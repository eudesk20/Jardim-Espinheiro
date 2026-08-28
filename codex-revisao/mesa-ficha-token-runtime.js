/* MICROCOSMOS — Mesa da Campanha: tokens vinculados à ficha + imagem própria.
   A Mesa ainda é local nesta etapa; dados do personagem podem ser lidos do Supabase
   e a posição/imagem do token ficam persistidas no navegador até a sincronização da Mesa. */
(async function(){
  if(globalThis.MICROCOSMOS_MESA_FICHA_TOKEN_RUNTIME)return;
  globalThis.MICROCOSMOS_MESA_FICHA_TOKEN_RUNTIME=true;

  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const MESA_SESSION_KEY="microcosmos-main";
  const SHEET_KEY="JE_INTEGRATED_123";
  const TABLE_KEY="MICROCOSMOS_TABLE_TOKENS_V2";
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  const api=globalThis.MICROCOSMOS_TABLE_API;
  if(!Array.isArray(players)||!api)return;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const mod=v=>Math.floor(((+v||10)-10)/2);
  const prof=level=>2+Math.floor((Math.max(1,+level||1)-1)/4);
  const fmt=n=>(+n||0)>=0?`+${+n||0}`:`${+n||0}`;
  let supabase=null,currentUserId="",currentRole="player",profile=null,profileNames=new Map(),characterCache=[],uploadTargetId="";

  function readLocalSheet(){try{return JSON.parse(localStorage.getItem(SHEET_KEY)||"{}")||{}}catch{return {}}}
  function saveTable(){
    try{
      localStorage.setItem(TABLE_KEY,JSON.stringify(players.map(p=>({
        id:p.id,name:p.name,color:p.color,cls:p.cls,level:p.level,hp:p.hp,hpMax:p.hpMax,ac:p.ac,speed:p.speed,x:p.x,y:p.y,
        attacks:p.attacks||[],spells:p.spells||[],master:!!p.master,free:!!p.free,linked:!!p.linked,userId:p.userId||"",characterId:p.characterId||"",
        tokenImage:p.tokenImage||"",tokenImageMode:p.tokenImageMode||"",sheetPortrait:p.sheetPortrait||"",visibilityLayer:p.visibilityLayer||p.layer||"players"
      }))))
    }catch(e){console.warn("MICROCOSMOS Mesa: não foi possível salvar tokens",e)}
  }
  function restoreTable(){
    let stored=null;try{stored=JSON.parse(localStorage.getItem(TABLE_KEY)||"null")}catch{}
    // Remove os personagens demonstrativos da v1. A Mesa passa a trabalhar com fichas reais.
    players.splice(0,players.length,...(Array.isArray(stored)?stored:[]));
    api.renderPlayers();api.renderTokens();
  }

  async function loadScript(src,globalName){
    if(globalName&&globalThis[globalName])return;
    await new Promise((resolve,reject)=>{const old=[...document.scripts].find(s=>s.src.endsWith(src));if(old){if(globalName&&globalThis[globalName])return resolve();old.addEventListener("load",resolve,{once:true});setTimeout(resolve,300);return}const s=document.createElement("script");s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})
  }
  async function ensureGameData(){
    try{await loadScript("codex-revisao/race-data.js","CODEX_RACE_DATA");await loadScript("codex-revisao/game-data.js","MICROCOSMO_DATA")}catch(e){console.warn("MICROCOSMOS Mesa: dados auxiliares indisponíveis",e)}
  }

  function className(id){return globalThis.MICROCOSMO_DATA?.classes?.[id]?.name||id||"Sem Classe"}
  function raceSpeed(data){
    const raw=globalThis.MICROCOSMO_DATA?.races?.[data.race]?.speed||data.speed||9;
    const n=parseFloat(String(raw).replace(",","."));return Number.isFinite(n)?n:9
  }
  function weaponAbility(data,e){
    const effect=String(e.effect||"").toLowerCase();
    if(effect.includes("acuidade"))return mod(data.stats?.DES)>mod(data.stats?.FOR)?"DES":"FOR";
    return e.category==="distancia"?"DES":e.ability||"FOR"
  }
  function weaponProficient(data,e){
    const list=data.weaponProficiencies||[],id=e.catalogId||"",training=e.training||"simples",category=e.category||"corpo";
    return list.includes("group:all")||list.includes(`group:${training}`)||list.includes(`group:${category}`)||list.includes(`group:${training}-${category}`)||(id&&list.includes(`weapon:${id}`))
  }
  function buildAttacks(data){
    return (data.equipment||[]).filter(e=>e.type==="arma").slice(0,6).map(e=>{
      const a=weaponAbility(data,e),ab=mod(data.stats?.[a]),magic=+e.magic||0,bonus=ab+(weaponProficient(data,e)?prof(data.level):0)+magic,damageBonus=ab+magic;
      return {name:e.name||"Ataque",bonus,damage:`${e.die||"1d4"}${damageBonus?fmt(damageBonus):""}`}
    })
  }
  function buildSpells(data){
    const caster=globalThis.MICROCOSMO_DATA?.classes?.[data.cls]?.caster||"INT",spellAtk=mod(data.stats?.[caster])+prof(data.level);
    return (data.magic?.known||[]).filter(s=>s.attack||s.healing).slice(0,6).map(s=>({
      name:s.name||"Magia",bonus:s.attack?spellAtk:0,damage:s.healing||s.damage||"0",kind:s.healing?"cura":"ataque"
    }))
  }
  function calcAC(data){
    const armor=(data.equipment||[]).filter(x=>x.type==="armadura").reduce((s,x)=>s+(+x.ac||0),0),shield=(data.equipment||[]).filter(x=>x.type==="escudo").reduce((s,x)=>s+(+x.ac||0),0);
    return 10+mod(data.stats?.DES)+armor+shield
  }
  function stableColor(seed){
    const palette=["#8d63bf","#4f9464","#b06b4d","#4f7fa8","#b18a42","#9a5f87","#6f9d56","#b65c62"];let h=0;for(const ch of String(seed||"token"))h=(h*31+ch.charCodeAt(0))>>>0;return palette[h%palette.length]
  }
  function sheetToToken(row,index=0){
    const data=row.data||{},characterId=row.id||`local-${row.user_id||"self"}`,userId=row.user_id||currentUserId||"",id=`sheet:${characterId}`,existing=players.find(p=>p.id===id),sheetPortrait=data.portrait||"";
    let tokenImage="",tokenImageMode=existing?.tokenImageMode||"";
    if(tokenImageMode==="custom")tokenImage=existing?.tokenImage||"";
    else if(tokenImageMode==="none")tokenImage="";
    else {tokenImageMode=sheetPortrait?"sheet":"";tokenImage=sheetPortrait}
    const name=data.charName||row.name||profileNames.get(userId)||"Personagem";
    return {
      id,name,color:existing?.color||data.playerColor||stableColor(userId||name),cls:className(data.cls),classKey:data.cls||"",level:+data.level||1,
      hp:+data.hpNow||0,hpMax:+data.hpMax||0,ac:calcAC(data),speed:raceSpeed(data),
      x:existing?.x??(210+(index%6)*85),y:existing?.y??(210+Math.floor(index/6)*85),attacks:buildAttacks(data),spells:buildSpells(data),
      linked:true,userId,characterId,tokenImage,tokenImageMode,sheetPortrait,free:false
    }
  }

  function upsertCharacterToken(row,index=0,select=true){
    const token=sheetToToken(row,index),at=players.findIndex(p=>p.id===token.id);
    if(at>=0)players[at]={...players[at],...token,x:players[at].x,y:players[at].y};else players.push(token);
    saveTable();api.renderPlayers();api.renderTokens();decorateTokens();if(select)api.selectToken(token.id);return token
  }

  async function connectSupabase(){
    try{
      const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");supabase=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:{session}}=await supabase.auth.getSession();if(!session)return;
      currentUserId=session.user.id;
      const {data:p}=await supabase.from("profiles").select("id,username,display_name,role,approved").eq("id",currentUserId).maybeSingle();profile=p||null;currentRole=profile?.role||"player";
      await loadProfiles();updateRoleUi()
    }catch(e){console.warn("MICROCOSMOS Mesa: sessão online não carregada",e)}
  }
  async function loadProfiles(){
    if(!supabase)return;const {data}=await supabase.from("profiles").select("id,username,display_name,role,approved");profileNames=new Map((data||[]).map(p=>[p.id,p.display_name||p.username||"Jogador"]))
  }
  async function loadCharacters(){
    const local=readLocalSheet(),rows=[];
    if(supabase&&currentUserId){
      const {data,error}=await supabase.from("characters").select("id,user_id,name,data,updated_at").order("updated_at",{ascending:false});
      if(!error)rows.push(...(data||[]))
    }
    // A cópia local é a mais recente da própria conta enquanto a pessoa edita a ficha.
    if(Object.keys(local).length){
      const ownIndex=rows.findIndex(r=>r.user_id===currentUserId);const own={id:ownIndex>=0?rows[ownIndex].id:`local-${currentUserId||"self"}`,user_id:currentUserId||"local",name:local.charName||"",data:local,updated_at:new Date().toISOString(),local:true};
      if(ownIndex>=0)rows[ownIndex]=own;else rows.unshift(own)
    }
    const seen=new Set();characterCache=rows.filter(r=>{const k=r.user_id||r.id;if(seen.has(k))return false;seen.add(k);return true});return characterCache
  }

  function ensureUi(){
    if(!document.getElementById("microMesaTokenStyles")){
      const style=document.createElement("style");style.id="microMesaTokenStyles";style.textContent=`
      .token.micro-token-image{border-radius:12px!important;overflow:visible;background:#171714!important;font-size:0!important}.token.micro-token-image>.micro-token-photo{position:absolute;inset:2px;width:calc(100% - 4px);height:calc(100% - 4px);object-fit:cover;object-position:center;border-radius:8px;pointer-events:none;z-index:1}.token.micro-token-image>small,.token.micro-token-image>.hp{z-index:3}.token.micro-token-master-hidden{opacity:.42!important;filter:saturate(.35);outline:2px dashed #9d71b4!important}.token.micro-token-master-hidden:after{content:"OCULTO";position:absolute;left:50%;top:-20px;transform:translateX(-50%);padding:2px 5px;border-radius:999px;background:#5b3c70;color:#fff;font:bold 8px sans-serif;white-space:nowrap}.micro-token-visibility-quick{position:absolute;z-index:20;left:-11px;top:-11px;width:24px;height:24px;border-radius:50%;border:2px solid #e9cf76;background:#21372b;color:#fff;padding:0;display:grid;place-items:center;font-size:12px;line-height:1;opacity:.58;cursor:pointer;box-shadow:0 2px 7px #0008}.micro-token-visibility-quick:hover,.micro-token-visibility-quick:focus{opacity:1}.micro-token-master-hidden .micro-token-visibility-quick{opacity:1;background:#674579}.micro-token-tools{margin-top:10px;padding-top:9px;border-top:1px dashed #a18b69;display:grid;gap:6px}.micro-token-tools .row{display:flex;gap:6px;flex-wrap:wrap}.micro-token-tools .btn{flex:1}.micro-token-source{font-size:.72rem;color:#6d5a43;background:#efe5cc;border-radius:8px;padding:7px}.micro-enemy-editor{border:1px solid #a18b69;border-radius:9px;background:#fff8e7;padding:7px}.micro-enemy-editor summary{cursor:pointer;font-weight:bold}.micro-enemy-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}.micro-enemy-grid label,.micro-enemy-wide label{display:grid;gap:2px;font-size:.66rem;font-weight:bold}.micro-enemy-grid input,.micro-enemy-wide textarea{width:100%;padding:6px;border:1px solid #9b8058;border-radius:7px;background:#fffdf6}.micro-enemy-wide{display:grid;gap:6px;margin-top:6px}.micro-enemy-wide small{font-weight:normal;color:#6d5a43}.micro-character-modal{position:fixed;inset:0;z-index:120000;background:#07100ddd;display:grid;place-items:center;padding:12px}.micro-character-modal[hidden]{display:none}.micro-character-modal-card{width:min(640px,100%);max-height:88vh;overflow:auto;background:#efe5cc;border:4px double #b58a3d;border-radius:20px;padding:14px;color:#30271e}.micro-character-list{display:grid;gap:8px;margin-top:10px}.micro-character-choice{width:100%;text-align:left;padding:10px;border:1px solid #9b8058;border-radius:11px;background:#fff8e7;color:#30271e}.micro-character-choice b{display:block;color:#405d3e}.micro-character-choice small{display:block;margin-top:3px;color:#6d5a43}.micro-token-thumb{width:36px;height:36px;border-radius:8px;object-fit:cover;object-position:center;border:2px solid #fff;box-shadow:0 0 0 1px #725e42}.player-row.has-photo{grid-template-columns:40px 1fr auto}.micro-table-actions{display:grid;gap:6px;margin-top:9px}.micro-sync-note{font-size:.72rem;color:#6b5a43;margin-top:6px}`;document.head.appendChild(style)
    }
    if(!$("microCharacterModal")){
      const modal=document.createElement("div");modal.id="microCharacterModal";modal.className="micro-character-modal";modal.hidden=true;modal.innerHTML='<div class="micro-character-modal-card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><div><h2 style="margin:0;color:#405d3e">🧙 Personagem da Ficha</h2><small>Escolha qual ficha será ligada ao token.</small></div><button class="btn" id="microCloseCharacterModal">✕</button></div><div id="microCharacterList" class="micro-character-list"></div></div>';document.body.appendChild(modal);$("microCloseCharacterModal").onclick=()=>modal.hidden=true;modal.onclick=e=>{if(e.target===modal)modal.hidden=true}
    }
    if(!$("microTokenImageInput")){const inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.id="microTokenImageInput";inp.hidden=true;document.body.appendChild(inp);inp.onchange=handleTokenImage}
    const add=$("addToken");if(add){add.textContent="➕ Personagem da Ficha";add.onclick=openCharacterModal}
    const prep=document.querySelector("#leftPanel .panel");
    if(prep&&!$("microTableActions")){
      const wrap=document.createElement("div");wrap.id="microTableActions";wrap.className="micro-table-actions";wrap.innerHTML='<button class="btn primary" id="microAddCharacterSide">🧙 Adicionar personagem da ficha</button><button class="btn" id="microRefreshLinked">🔄 Atualizar tokens pelas fichas</button><button class="btn" id="microAddFreeToken">➕ Token livre / NPC</button><div class="micro-sync-note">Tokens vinculados puxam os dados de combate da ficha. A posição e a imagem própria do token ainda ficam salvas localmente nesta versão da Mesa.</div>';prep.appendChild(wrap);$("microAddCharacterSide").onclick=openCharacterModal;$("microRefreshLinked").onclick=refreshLinkedTokens;$("microAddFreeToken").onclick=addFreeToken
    }
  }
  function updateRoleUi(){const free=$("microAddFreeToken");if(free)free.style.display=currentRole==="master"||!currentUserId?"":"none"}

  async function openCharacterModal(){
    ensureUi();const modal=$("microCharacterModal"),list=$("microCharacterList");modal.hidden=false;list.innerHTML='<div class="micro-token-source">Carregando fichas…</div>';const rows=await loadCharacters();
    if(!rows.length){list.innerHTML='<div class="micro-token-source">Nenhuma ficha encontrada. Volte para a Ficha, escolha o personagem e salve os dados primeiro.</div>';return}
    list.innerHTML=rows.map((r,i)=>{const d=r.data||{},owner=profileNames.get(r.user_id)||((r.user_id===currentUserId||r.local)?"Minha conta":"Jogador"),photo=d.portrait?`<img class="micro-token-thumb" src="${d.portrait}" alt="">`:"";return `<button class="micro-character-choice" data-character-index="${i}"><div style="display:grid;grid-template-columns:${photo?"42px ":""}1fr;gap:7px;align-items:center">${photo}<span><b>${esc(d.charName||r.name||"Personagem sem nome")}</b><small>${esc(owner)} • ${esc(className(d.cls))} • Nível ${+d.level||1} • PV ${+d.hpNow||0}/${+d.hpMax||0}</small></span></div></button>`}).join("");
    list.querySelectorAll("[data-character-index]").forEach(btn=>btn.onclick=()=>{const row=rows[+btn.dataset.characterIndex];upsertCharacterToken(row,+btn.dataset.characterIndex,true);modal.hidden=true})
  }

  function addFreeToken(){
    const name=prompt("Nome do token livre / NPC:","Novo Token");if(!name)return;const s=+$("gridSize")?.value||70,id=`free:${Date.now()}`;players.push({id,name,color:stableColor(id),cls:"Token livre",level:1,hp:10,hpMax:10,ac:10,speed:9,x:s*6+s/2,y:s*5+s/2,attacks:[{name:"Ataque rápido",bonus:2,damage:"1d6"}],spells:[],free:true,linked:false,userId:"",characterId:"",tokenImage:"",tokenImageMode:""});saveTable();api.renderPlayers();api.renderTokens();decorateTokens();api.selectToken(id)
  }

  function decoratePlayers(){
    document.querySelectorAll("#players [data-select]").forEach(row=>{const p=players.find(x=>x.id===row.dataset.select);if(!p)return;const dot=row.querySelector(".dot");if(p.tokenImage&&dot){const img=document.createElement("img");img.className="micro-token-thumb";img.src=p.tokenImage;img.alt="";dot.replaceWith(img);row.classList.add("has-photo")}})
  }
  function resizeImageTokens(){const s=+$("gridSize")?.value||70,size=Math.max(34,Math.min(106,Math.round(s*.82)));document.querySelectorAll(".token.micro-token-image").forEach(t=>{t.style.setProperty("width",`${size}px`,"important");t.style.setProperty("height",`${size}px`,"important")})}
  function decorateTokens(){
    document.querySelectorAll("#tokenLayer [data-token]").forEach(el=>{const p=players.find(x=>x.id===el.dataset.token);if(!p)return;el.querySelector(".micro-token-photo")?.remove();el.querySelector(".micro-token-visibility-quick")?.remove();const hidden=(p.visibilityLayer||p.layer)==="master";el.classList.toggle("micro-token-image",!!p.tokenImage);el.classList.toggle("micro-token-master-hidden",currentRole==="master"&&hidden);if(p.tokenImage){const img=document.createElement("img");img.className="micro-token-photo";img.src=p.tokenImage;img.alt="";el.prepend(img)}});resizeImageTokens();decoratePlayers()
  }

  function selectedPlayer(){const el=document.querySelector("#tokenLayer .token.selected");return el?players.find(p=>p.id===el.dataset.token):null}
  function canEditToken(p){return !!p&&(currentRole==="master"||!currentUserId||(p.userId&&p.userId===currentUserId))}
  function attackLines(p){return(p.attacks||[]).map(a=>`${a.name||"Ataque"} | ${+a.bonus||0} | ${a.damage||"1d4"}`).join("\n")}
  function spellLines(p){return(p.spells||[]).map(s=>`${s.name||"Magia"} | ${s.damage||s.healing||"1d4"} | ${s.kind==="cura"||s.healing?"cura":"ataque"} | ${s.range||"18 m"}`).join("\n")}
  function parseAttacks(text){return String(text||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const [name,bonus,damage]=line.split("|").map(x=>x.trim());return{name:name||"Ataque",bonus:+bonus||0,damage:damage||"1d4",attack:true,kind:"weapon",range:{normal:1.5,long:1.5}}})}
  function parseSpells(text){return String(text||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const [name,damage,mode,range]=line.split("|").map(x=>x.trim()),healing=/cura/i.test(mode||"");return{name:name||"Magia",lvl:0,bonus:0,damage:healing?"":damage||"1d4",healing:healing?(damage||"1d4"):"",kind:healing?"cura":"ataque",attack:!healing,range:range||"18 m"}})}
  function enemyEditor(p){return `<details class="micro-enemy-editor"><summary>✏️ Editar dados do inimigo</summary><div class="micro-enemy-grid"><label>Nome<input data-enemy-name value="${esc(p.name)}"></label><label>Tipo<input data-enemy-class value="${esc(p.cls||"Inimigo")}"></label><label>Nível / ND<input data-enemy-level value="${esc(p.level||1)}"></label><label>PV atual<input data-enemy-hp type="number" value="${+p.hp||0}"></label><label>PV máximo<input data-enemy-hpmax type="number" value="${+p.hpMax||1}"></label><label>CA<input data-enemy-ac type="number" value="${+p.ac||10}"></label><label>Movimento (m)<input data-enemy-speed type="number" step="1.5" value="${+p.speed||9}"></label></div><div class="micro-enemy-wide"><label>Ataques <small>Um por linha: Nome | bônus | dano</small><textarea rows="3" data-enemy-attacks>${esc(attackLines(p))}</textarea></label><label>Magias <small>Um por linha: Nome | dano/cura | ataque ou cura | alcance</small><textarea rows="3" data-enemy-spells>${esc(spellLines(p))}</textarea></label><button class="btn primary" data-enemy-save>💾 Salvar dados</button></div></details>`}
  async function toggleTokenVisibility(p){if(currentRole!=="master"||!p||!supabase)return;const previous=p.visibilityLayer||p.layer||"players",next=previous==="master"?"players":"master",{data:row,error:readError}=await supabase.from("mesa_tokens").select("data").eq("session_key",MESA_SESSION_KEY).eq("token_id",p.id).maybeSingle();if(readError)return alert("Não foi possível consultar a visibilidade: "+readError.message);const payload={...(row?.data||p),visibilityLayer:next};delete payload.layer;const {error}=await supabase.from("mesa_tokens").update({layer:next,data:payload,updated_by:currentUserId,updated_at:new Date().toISOString()}).eq("session_key",MESA_SESSION_KEY).eq("token_id",p.id);if(error)return alert("Não foi possível alterar a visibilidade: "+error.message);p.visibilityLayer=next;delete p.layer;saveTable();await globalThis.MICROCOSMOS_MESA_SHARED?.reloadTokens?.();api.renderPlayers();api.renderTokens();api.selectToken(p.id);$("tokenCard")?.querySelector(".micro-token-tools")?.remove();decorateTokens();decorateCard()}
  function showVisibilityMenu(p,x,y){if(currentRole!=="master"||!p)return;$("microTokenVisibilityMenu")?.remove();const hidden=(p.visibilityLayer||p.layer)==="master",menu=document.createElement("div");menu.id="microTokenVisibilityMenu";menu.style.cssText=`position:fixed;z-index:150000;left:${Math.max(8,Math.min(innerWidth-230,x))}px;top:${Math.max(8,Math.min(innerHeight-80,y))}px;width:220px;padding:7px;background:#efe5cc;border:3px double #806945;border-radius:12px;box-shadow:0 10px 28px #000a;color:#30271e`;menu.innerHTML=`<small style="display:block;margin:0 0 5px"><b>${esc(p.name||"Token")}</b> • visibilidade</small><button type="button" class="btn ${hidden?'primary':'dark'}" style="width:100%" data-visibility-action>${hidden?'👁️ Revelar aos jogadores':'🎭 Ocultar dos jogadores'}</button>`;document.body.appendChild(menu);menu.querySelector("[data-visibility-action]").onclick=async e=>{e.preventDefault();e.stopPropagation();const button=e.currentTarget;button.disabled=true;button.textContent="⏳ Atualizando…";await toggleTokenVisibility(p);menu.remove()};setTimeout(()=>document.addEventListener("pointerdown",e=>{if(!e.target.closest?.("#microTokenVisibilityMenu"))menu.remove()},{capture:true,once:true}),0)}
  function decorateCard(){
    const card=$("tokenCard"),p=selectedPlayer();if(!card||!p||card.querySelector(".micro-token-tools"))return;
    const tools=document.createElement("div");tools.className="micro-token-tools";const editable=canEditToken(p),source=p.linked?`🔗 Ligado à ficha${p.userId?` de ${esc(profileNames.get(p.userId)||p.name)}`:""}. PV, CA, nível, ataques e magias podem ser atualizados pela ficha.`:"Token livre: valores pertencem somente à Mesa.";
    const hidden=(p.visibilityLayer||p.layer)==="master";tools.innerHTML=`<div class="micro-token-source">${source}</div>${editable?`${p.free?enemyEditor(p):""}${currentRole==="master"?`<div class="row"><button class="btn ${hidden?'primary':'dark'}" data-token-visibility>${hidden?'👁️ Revelar aos jogadores':'🎭 Ocultar dos jogadores'}</button></div>`:""}<div class="row"><button class="btn primary" data-token-upload>🖼️ Imagem do Token</button>${p.sheetPortrait?'<button class="btn" data-token-sheet-photo>📷 Usar foto da ficha</button>':""}</div><div class="row">${p.linked?'<button class="btn" data-token-refresh>🔄 Atualizar da ficha</button>':""}<button class="btn" data-token-remove-image>◯ Remover imagem</button>${currentRole==="master"||p.free?'<button class="btn danger" data-token-delete>✕ Remover token</button>':""}</div>`:"<div class=\"micro-token-source\">🔒 Somente o dono deste personagem ou o Mestre pode trocar a imagem do token.</div>"}`;
    card.appendChild(tools);
    tools.querySelector("[data-token-upload]")?.addEventListener("click",()=>{uploadTargetId=p.id;$("microTokenImageInput").click()});
    tools.querySelector("[data-token-sheet-photo]")?.addEventListener("click",()=>{p.tokenImage=p.sheetPortrait||"";p.tokenImageMode=p.tokenImage?"sheet":"none";saveTable();api.renderTokens();decorateTokens();api.selectToken(p.id)});
    tools.querySelector("[data-token-remove-image]")?.addEventListener("click",()=>{p.tokenImage="";p.tokenImageMode="none";saveTable();api.renderTokens();decorateTokens();api.selectToken(p.id)});
    tools.querySelector("[data-token-refresh]")?.addEventListener("click",()=>refreshOneToken(p.id));
    tools.querySelector("[data-token-visibility]")?.addEventListener("click",async e=>{const button=e.currentTarget;button.disabled=true;button.textContent="⏳ Atualizando…";await toggleTokenVisibility(p)});
    tools.querySelector("[data-enemy-save]")?.addEventListener("click",()=>{p.name=tools.querySelector("[data-enemy-name]").value.trim()||p.name;p.cls=tools.querySelector("[data-enemy-class]").value.trim()||"Inimigo";p.level=tools.querySelector("[data-enemy-level]").value.trim()||1;p.hp=Math.max(0,+tools.querySelector("[data-enemy-hp]").value||0);p.hpMax=Math.max(1,+tools.querySelector("[data-enemy-hpmax]").value||1);p.hp=Math.min(p.hp,p.hpMax);p.ac=Math.max(0,+tools.querySelector("[data-enemy-ac]").value||10);p.speed=Math.max(0,+tools.querySelector("[data-enemy-speed]").value||0);p.attacks=parseAttacks(tools.querySelector("[data-enemy-attacks]").value);p.spells=parseSpells(tools.querySelector("[data-enemy-spells]").value);p.combatDataReady=true;saveTable();api.renderPlayers();api.renderTokens();decorateTokens();api.selectToken(p.id);globalThis.MICROCOSMOS_MESA_SHARED?.flushToken?.(p.id,true)});
    tools.querySelector("[data-token-delete]")?.addEventListener("click",()=>{if(!confirm(`Remover o token de ${p.name} da Mesa? A ficha não será apagada.`))return;const i=players.findIndex(x=>x.id===p.id);if(i>=0)players.splice(i,1);saveTable();api.renderPlayers();api.renderTokens();decorateTokens();card.className="token-card empty";card.textContent="Toque em um token no mapa."})
  }

  async function compressSquare(file){
    const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)}),img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=dataUrl});
    const side=Math.min(img.naturalWidth,img.naturalHeight),sx=(img.naturalWidth-side)/2,sy=(img.naturalHeight-side)/2,canvas=document.createElement("canvas");canvas.width=384;canvas.height=384;canvas.getContext("2d").drawImage(img,sx,sy,side,side,0,0,384,384);return canvas.toDataURL("image/jpeg",.84)
  }
  async function handleTokenImage(e){
    const file=e.target.files?.[0],p=players.find(x=>x.id===uploadTargetId);e.target.value="";if(!file||!p||!canEditToken(p))return;try{p.tokenImage=await compressSquare(file);p.tokenImageMode="custom";saveTable();api.renderPlayers();api.renderTokens();decorateTokens();api.selectToken(p.id)}catch(err){alert("Não foi possível preparar esta imagem para o token.")}
  }

  async function refreshOneToken(id){
    const p=players.find(x=>x.id===id);if(!p?.linked)return;const rows=await loadCharacters(),row=rows.find(r=>String(r.id)===String(p.characterId)||r.user_id===p.userId);if(!row)return alert("A ficha vinculada não foi encontrada.");upsertCharacterToken(row,players.indexOf(p),true)
  }
  async function refreshLinkedTokens(){
    const rows=await loadCharacters();let changed=0;for(const p of [...players]){if(!p.linked)continue;const row=rows.find(r=>String(r.id)===String(p.characterId)||r.user_id===p.userId);if(row){upsertCharacterToken(row,players.indexOf(p),false);changed++}}
    api.renderPlayers();api.renderTokens();decorateTokens();saveTable();const status=$("mapStatus");if(status&&changed)status.textContent=`${changed} token(s) atualizado(s) pelas fichas.`
  }

  restoreTable();ensureUi();await ensureGameData();await connectSupabase();updateRoleUi();decorateTokens();decorateCard();

  // Observa as renderizações feitas pelo código original da Mesa e reaplica imagem/controles.
  const tokenObserver=new MutationObserver(()=>decorateTokens());tokenObserver.observe($("tokenLayer"),{childList:true,subtree:false});
  const cardObserver=new MutationObserver(()=>decorateCard());cardObserver.observe($("tokenCard"),{childList:true,subtree:true});
  const playerObserver=new MutationObserver(()=>decoratePlayers());playerObserver.observe($("players"),{childList:true,subtree:true});
  document.addEventListener("contextmenu",e=>{const token=e.target.closest?.("#tokenLayer [data-token]");if(currentRole!=="master"||!token)return;const p=players.find(x=>String(x.id)===String(token.dataset.token));if(!p)return;e.preventDefault();e.stopPropagation();showVisibilityMenu(p,e.clientX,e.clientY)},true);
  let visibilityHold=null;document.addEventListener("pointerdown",e=>{const token=e.target.closest?.("#tokenLayer [data-token]");if(currentRole!=="master"||!token)return;const p=players.find(x=>String(x.id)===String(token.dataset.token));if(!p)return;if(e.button===2){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showVisibilityMenu(p,e.clientX,e.clientY);return}if(!['touch','pen'].includes(e.pointerType))return;const start={x:e.clientX,y:e.clientY,id:token.dataset.token,pointer:e.pointerId};visibilityHold={...start,timer:setTimeout(()=>{visibilityHold=null;showVisibilityMenu(p,start.x,start.y)},650)}},true);document.addEventListener("pointermove",e=>{if(visibilityHold?.pointer===e.pointerId&&Math.hypot(e.clientX-visibilityHold.x,e.clientY-visibilityHold.y)>8){clearTimeout(visibilityHold.timer);visibilityHold=null}},true);for(const eventName of ["pointerup","pointercancel"])document.addEventListener(eventName,e=>{if(visibilityHold?.pointer===e.pointerId){clearTimeout(visibilityHold.timer);visibilityHold=null}},true);
  $("gridSize")?.addEventListener("input",resizeImageTokens);$("gridSize")?.addEventListener("change",resizeImageTokens);
  $("viewport")?.addEventListener("pointerup",()=>setTimeout(saveTable,0));
  window.addEventListener("storage",e=>{if(e.key===SHEET_KEY)refreshLinkedTokens()});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshLinkedTokens()});
})();
