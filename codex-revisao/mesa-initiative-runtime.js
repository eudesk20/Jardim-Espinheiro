/* MICROCOSMOS — Painel de Iniciativa da Mesa.
   A antiga lista de Jogadores passa a listar todos os tokens da Mesa em ordem
   de iniciativa. Jogadores rolam a própria iniciativa; Mestre pode rolar todos,
   editar resultados, avançar turnos e limpar o combate. Estado compartilhado
   pelo Supabase em tempo real.
*/
(async function(){
  if(globalThis.MICROCOSMOS_MESA_INITIATIVE)return;
  globalThis.MICROCOSMOS_MESA_INITIATIVE=true;

  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const SESSION_KEY="microcosmos-main";
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  const api=globalThis.MICROCOSMOS_TABLE_API;
  const list=document.getElementById("players"),tokenLayer=document.getElementById("tokenLayer");
  if(!Array.isArray(players)||!api||!list)return;

  let supabase=null,session=null,profile=null,isMaster=false;
  let rows=new Map(),combat={started:false,active_token_id:null,round:0};
  let characterMods=new Map(),renderQueued=false,loading=false;

  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const mod=v=>Math.floor(((Number(v)||10)-10)/2);
  const fmt=n=>Number(n)>=0?`+${Number(n)||0}`:`${Number(n)||0}`;
  const d20=()=>1+Math.floor(Math.random()*20);

  function ensureCss(){
    if(document.getElementById("microInitiativeStyle"))return;
    const s=document.createElement("style");s.id="microInitiativeStyle";s.textContent=`
      .micro-init-toolbar{display:flex;gap:5px;flex-wrap:wrap;margin:0 0 7px}.micro-init-toolbar .btn{flex:1;min-width:72px;padding:6px 7px;font-size:.72rem}.micro-init-round{width:100%;font-size:.7rem;color:#6c5a43;text-align:center}.micro-init-row{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:7px;align-items:center;background:#fff8e7;border:1px solid #b6a17d;border-radius:10px;padding:6px 7px;margin:5px 0;cursor:pointer;min-width:0}.micro-init-row.active-turn{border:2px solid #b58a3d;background:#fff0bd;box-shadow:0 0 0 2px #fff6 inset}.micro-init-row.unrolled{opacity:.78}.micro-init-main{min-width:0}.micro-init-main b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.micro-init-main small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#6b5a43}.micro-init-right{display:flex;align-items:center;gap:5px}.micro-init-value{min-width:34px;height:30px;display:grid;place-items:center;border:1px solid #806844;border-radius:9px;background:#fffdf6;font-weight:bold;font-size:.88rem}.micro-init-value.master-edit{cursor:pointer}.micro-init-roll{width:30px;height:30px;display:grid;place-items:center;border:1px solid #806844;border-radius:9px;background:#e9dcc1;cursor:pointer;user-select:none}.micro-init-roll.disabled{opacity:.35;cursor:default}.micro-init-dot{width:22px;height:22px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #5f503d;overflow:hidden;display:grid;place-items:center}.micro-init-dot img{width:100%;height:100%;object-fit:cover}.micro-init-turn-tag{font-size:.58rem;color:#75531d;font-weight:bold}.micro-init-empty{font-size:.74rem;color:#75644e;text-align:center;padding:8px}@media(max-width:720px){.micro-init-row{grid-template-columns:27px minmax(0,1fr) auto;padding:5px 6px}.micro-init-toolbar{display:grid;grid-template-columns:repeat(3,1fr)}.micro-init-toolbar .btn{min-width:0}.micro-init-value,.micro-init-roll{width:28px;min-width:28px;height:28px}}
    `;document.head.appendChild(s)
  }

  function tokenModifier(p){
    if(Number.isFinite(+p?.initiativeModifier))return +p.initiativeModifier;
    if(p?.stats&&p.stats.DES!=null)return mod(p.stats.DES);
    if(p?.characterId&&characterMods.has(p.characterId))return characterMods.get(p.characterId);
    if(p?.userId&&characterMods.has(`user:${p.userId}`))return characterMods.get(`user:${p.userId}`);
    return 0
  }
  function canRoll(p){return isMaster||!!(session?.user?.id&&p?.userId===session.user.id)}
  function tokenRow(p){return rows.get(p.id)||null}
  function orderedPlayers(){
    return [...players].sort((a,b)=>{
      const A=tokenRow(a),B=tokenRow(b),ai=A?.initiative,bi=B?.initiative;
      const ah=Number.isFinite(ai),bh=Number.isFinite(bi);
      if(ah!==bh)return ah?-1:1;
      if(ah&&bi!==ai)return bi-ai;
      const am=A?.modifier??tokenModifier(a),bm=B?.modifier??tokenModifier(b);if(am!==bm)return bm-am;
      return String(a.name||"").localeCompare(String(b.name||""),"pt-BR")
    })
  }

  function ensurePanel(){
    ensureCss();const panel=list.closest("section,.panel")||list.parentElement;
    const title=panel?.querySelector("h3,h2");if(title)title.textContent="⚔️ Iniciativa";
    document.querySelectorAll('[data-drawer="left"]').forEach(b=>{if(/Jogadores|Mesa/i.test(b.textContent||""))b.textContent="⚔️ Iniciativa"});
    let toolbar=document.getElementById("microInitiativeToolbar");
    if(isMaster&&!toolbar){toolbar=document.createElement("div");toolbar.id="microInitiativeToolbar";toolbar.className="micro-init-toolbar";toolbar.innerHTML='<button class="btn" id="microInitAll">🎲 Todos</button><button class="btn primary" id="microInitNext">▶ Próximo</button><button class="btn" id="microInitClear">🔄 Limpar</button><div class="micro-init-round" id="microInitRound"></div>';list.before(toolbar);document.getElementById("microInitAll").onclick=rollAll;document.getElementById("microInitNext").onclick=nextTurn;document.getElementById("microInitClear").onclick=clearCombat}
    if(!isMaster&&toolbar)toolbar.remove()
  }

  function render(){
    renderQueued=false;ensurePanel();
    const order=orderedPlayers();
    if(!order.length){list.innerHTML='<div class="micro-init-empty">Nenhum token na Mesa.</div>';return}
    list.innerHTML=order.map(p=>{
      const r=tokenRow(p),value=Number.isFinite(r?.initiative)?r.initiative:"—",active=combat.started&&combat.active_token_id===p.id,allowed=canRoll(p);
      const meta=p.creature?`${p.cls||"Criatura"} • ND ${p.challenge??p.level??"—"}`:`${p.cls||"Personagem"} • Nv. ${p.level||1}`;
      const image=p.tokenImage||p.sheetPortrait||"",dot=image?`<span class="micro-init-dot"><img src="${esc(image)}" alt=""></span>`:`<span class="micro-init-dot" style="background:${esc(p.color||"#8d63bf")}"></span>`;
      return `<div class="micro-init-row ${active?"active-turn":""} ${Number.isFinite(r?.initiative)?"":"unrolled"}" data-init-token="${esc(p.id)}">${dot}<div class="micro-init-main"><b>${esc(p.name||"Token")}</b><small>${esc(meta)}${active?'<span class="micro-init-turn-tag"> • TURNO ATUAL</span>':""}</small></div><div class="micro-init-right"><span class="micro-init-value ${isMaster?"master-edit":""}" data-init-edit="${esc(p.id)}" title="${isMaster?"Clique para editar":"Iniciativa"}">${value}</span><span class="micro-init-roll ${allowed?"":"disabled"}" data-init-roll="${esc(p.id)}" title="${allowed?`Rolar iniciativa (${fmt(r?.modifier??tokenModifier(p))})`:"Somente o dono do token ou Mestre"}">🎲</span></div></div>`
    }).join("");
    list.querySelectorAll("[data-init-token]").forEach(el=>el.addEventListener("click",e=>{if(e.target.closest("[data-init-roll],[data-init-edit]"))return;api.selectToken?.(el.dataset.initToken)}));
    list.querySelectorAll("[data-init-roll]").forEach(el=>el.addEventListener("click",e=>{e.stopPropagation();const p=players.find(x=>x.id===el.dataset.initRoll);if(p&&canRoll(p))rollOne(p)}));
    if(isMaster)list.querySelectorAll("[data-init-edit]").forEach(el=>el.addEventListener("click",e=>{e.stopPropagation();editOne(el.dataset.initEdit)}));
    const round=document.getElementById("microInitRound");if(round)round.textContent=combat.started?`Rodada ${Math.max(1,combat.round||1)} • ${order.find(p=>p.id===combat.active_token_id)?.name||"turno não definido"}`:"Combate ainda não iniciado";
  }
  function schedule(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(render)}

  async function loadCharacters(){
    if(!supabase)return;const {data}=await supabase.from("characters").select("id,user_id,data");characterMods=new Map();for(const row of data||[]){const m=mod(row.data?.stats?.DES);characterMods.set(row.id,m);if(row.user_id)characterMods.set(`user:${row.user_id}`,m)}
  }
  async function loadState(){
    if(!supabase||loading)return;loading=true;
    try{
      const [{data:init},{data:state}]=await Promise.all([
        supabase.from("mesa_initiative").select("token_id,token_name,owner_user_id,initiative,natural_roll,modifier,updated_at").eq("session_key",SESSION_KEY),
        supabase.from("mesa_combat_state").select("active_token_id,round,started").eq("session_key",SESSION_KEY).maybeSingle()
      ]);
      rows=new Map((init||[]).map(r=>[r.token_id,r]));combat=state||{started:false,active_token_id:null,round:0};schedule()
    }finally{loading=false}
  }

  async function saveRoll(p,natural,total,modifier){
    if(!supabase||!session)return;
    const payload={session_key:SESSION_KEY,token_id:p.id,token_name:p.name||"Token",owner_user_id:p.userId||null,initiative:total,natural_roll:natural,modifier,updated_by:session.user.id,updated_at:new Date().toISOString()};
    const {error}=await supabase.from("mesa_initiative").upsert(payload,{onConflict:"session_key,token_id"});if(error){console.warn("MICROCOSMOS iniciativa:",error);return false}return true
  }
  async function rollOne(p){
    const modifier=tokenModifier(p),natural=d20(),total=natural+modifier;if(await saveRoll(p,natural,total,modifier)){const log=document.getElementById("rollLog");if(log){const e=document.createElement("div");e.className="log-entry";e.textContent=`⚔️ Iniciativa • ${p.name}: ${natural} ${fmt(modifier)} = ${total}`;log.prepend(e)}await loadState()}
  }
  async function editOne(id){
    if(!isMaster||!session)return;const p=players.find(x=>x.id===id);if(!p)return;const current=tokenRow(p)?.initiative;const raw=prompt(`Iniciativa de ${p.name}:`,Number.isFinite(current)?String(current):"");if(raw===null)return;const total=Number(raw);if(!Number.isFinite(total))return;const modifier=tokenModifier(p);if(await saveRoll(p,null,Math.trunc(total),modifier))await loadState()
  }
  async function setCombat(next){
    if(!isMaster||!supabase||!session)return;const payload={session_key:SESSION_KEY,active_token_id:next.active_token_id||null,round:Math.max(0,next.round||0),started:!!next.started,updated_by:session.user.id,updated_at:new Date().toISOString()};const {error}=await supabase.from("mesa_combat_state").upsert(payload,{onConflict:"session_key"});if(error)console.warn("MICROCOSMOS turno:",error)
  }
  async function rollAll(){
    if(!isMaster)return;for(const p of players){const m=tokenModifier(p),n=d20();await saveRoll(p,n,n+m,m)}await loadState();const order=orderedPlayers().filter(p=>Number.isFinite(tokenRow(p)?.initiative));if(order.length)await setCombat({started:true,round:1,active_token_id:order[0].id});await loadState()
  }
  async function nextTurn(){
    if(!isMaster)return;await loadState();const order=orderedPlayers().filter(p=>Number.isFinite(tokenRow(p)?.initiative));if(!order.length)return;
    let idx=order.findIndex(p=>p.id===combat.active_token_id),round=Math.max(1,combat.round||1);if(idx<0){idx=0}else{idx++;if(idx>=order.length){idx=0;round++}}
    await setCombat({started:true,round,active_token_id:order[idx].id});await loadState();api.selectToken?.(order[idx].id)
  }
  async function clearCombat(){
    if(!isMaster||!confirm("Limpar todas as iniciativas e encerrar o combate atual?"))return;
    await supabase.from("mesa_initiative").delete().eq("session_key",SESSION_KEY);await setCombat({started:false,round:0,active_token_id:null});await loadState()
  }

  try{
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");supabase=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});const {data:{session:s}}=await supabase.auth.getSession();session=s;if(!session){schedule();return}
    const {data:p}=await supabase.from("profiles").select("role,approved").eq("id",session.user.id).maybeSingle();profile=p;isMaster=profile?.role==="master"&&profile?.approved!==false;await loadCharacters();await loadState();
    supabase.channel(`mesa-init-${SESSION_KEY}`).on("postgres_changes",{event:"*",schema:"public",table:"mesa_initiative",filter:`session_key=eq.${SESSION_KEY}`},()=>loadState()).on("postgres_changes",{event:"*",schema:"public",table:"mesa_combat_state",filter:`session_key=eq.${SESSION_KEY}`},()=>loadState()).subscribe();
  }catch(e){console.warn("MICROCOSMOS: iniciativa online indisponível",e);schedule()}

  if(tokenLayer){const obs=new MutationObserver(()=>{loadCharacters().then(schedule)});obs.observe(tokenLayer,{childList:true,subtree:false})}
  const oldRender=api.renderPlayers;if(typeof oldRender==="function"&&!oldRender.__microInitWrapped){api.renderPlayers=function(){const out=oldRender.apply(this,arguments);schedule();return out};api.renderPlayers.__microInitWrapped=true}
  setInterval(schedule,1200);
  globalThis.MICROCOSMOS_INITIATIVE={rollOne,rollAll,nextTurn,clearCombat,reload:loadState,get order(){return orderedPlayers()},get combat(){return combat}};
})();
