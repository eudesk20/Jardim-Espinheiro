/* MICROCOSMOS — Reações Beta v1.
   Primeiro gatilho real: Ataque de Oportunidade.
   - detecta quando o token do turno sai do alcance corpo a corpo de um oponente;
   - abre uma Janela de Reação para quem controla o oponente;
   - a Reação pode acontecer fora do próprio turno;
   - ao usar, resolve um ataque corpo a corpo a partir da posição de saída;
   - a Reação é consumida mesmo se o ataque errar e volta no início do próximo turno do personagem;
   - dano de jogador continua seguindo o fluxo normal de aprovação do Mestre.

   Beta: o deslocamento visual termina primeiro; a reação usa a posição imediatamente
   anterior ao deslocamento para alcance/rolagem. Em uma etapa futura a movimentação
   será pausada antes de abandonar o alcance.
*/
(async function(){
  if(globalThis.MICROCOSMOS_REACTION_RUNTIME)return;
  globalThis.MICROCOSMOS_REACTION_RUNTIME=true;

  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  const api=globalThis.MICROCOSMOS_TABLE_API;
  if(!Array.isArray(players)||!api)return;

  const $=id=>document.getElementById(id);
  let userId="",isMaster=false,activeWindow=null,wrappedRecord=null,lastTurnKey="",patchedTactical=false;
  const reactionSpent=new Set(),lastPositions=new Map(),recentMoves=new Map();

  function combat(){return globalThis.MICROCOSMOS_INITIATIVE?.combat||{started:false,active_token_id:null,round:0}}
  function gridSize(){return Math.max(20,+$("gridSize")?.value||70)}
  function gridType(){return $("gridType")?.value||"square"}
  function fmt(v){const n=Math.round((+v||0)*10)/10;return Number.isInteger(n)?String(n):n.toFixed(1).replace(".",",")}
  function distance(a,b){
    const s=gridSize(),dx=Math.abs((+a?.x||0)-(+b?.x||0)),dy=Math.abs((+a?.y||0)-(+b?.y||0));
    return (gridType()==="square"?Math.max(dx,dy):Math.hypot(dx,dy))/s*1.5
  }
  function side(p){
    if(!p)return"neutral";
    if(p.creature||(!p.linked&&(p.free||p.master||p.ipm)))return"creature";
    if(p.linked)return"player";
    return"neutral"
  }
  function hostile(a,b){const sa=side(a),sb=side(b);return sa!=="neutral"&&sb!=="neutral"&&sa!==sb}
  function canControl(p){return !!p&&(isMaster||!!userId&&String(p.userId||"")===String(userId))}
  function attackRange(item){
    if(item?.range?.normal!=null)return +item.range.normal||0;
    const raw=String(item?.range||item?.properties||"").toLowerCase();
    const m=raw.match(/(\d+(?:[,.]\d+)?)\s*m\b/);if(m)return +m[1].replace(",",".");
    return 1.5
  }
  function meleeAttackIndex(p){
    const list=p?.attacks||[];
    let fallback=-1;
    for(let i=0;i<list.length;i++){
      const a=list[i],r=attackRange(a),raw=`${a?.properties||""} ${a?.effect||""}`.toLowerCase();
      if(r<=1.55&&!/muni[cç][aã]o|arremesso/.test(raw))return i;
      if(fallback<0&&r<=3&&!/muni[cç][aã]o/.test(raw))fallback=i
    }
    return fallback
  }
  function reachOf(p,index){return Math.max(1.5,attackRange(p?.attacks?.[index]))}
  function alive(p){return (+p?.hpMax||0)<=0||(+p?.hp||0)>0}
  function reactionAvailable(p){return !!p&&!reactionSpent.has(String(p.id))}

  function ensureCss(){
    if($("microReactionStyle"))return;
    const s=document.createElement("style");s.id="microReactionStyle";s.textContent=`
      #microReactionWindow{display:none;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 7px;padding:9px 10px;border:2px solid #b75d43;border-radius:12px;background:linear-gradient(135deg,#3a1714,#563023);color:#fff1d1;box-shadow:0 5px 16px #0008;font-size:.76rem}
      #microReactionWindow.active{display:flex}.micro-reaction-copy{display:grid;gap:2px;min-width:0;flex:1}.micro-reaction-title{font-weight:bold;color:#ffd274;font-size:.84rem}.micro-reaction-detail{color:#ffe9ca}.micro-reaction-actions{display:flex;gap:6px}.micro-reaction-actions .btn{padding:6px 9px;min-height:31px}.micro-reaction-use{background:#8b3f32!important;color:#fff!important;border-color:#e18d62!important}
      #microTacticalReaction.spent{opacity:.58;text-decoration:line-through}
      @media(max-width:720px){#microReactionWindow{font-size:.7rem}.micro-reaction-actions{width:100%;display:grid;grid-template-columns:1fr 1fr}.micro-reaction-actions .btn{width:100%}}
    `;document.head.appendChild(s)
  }
  function ensureUi(){
    ensureCss();
    let hud=$("microTacticalHud"),pill=$("microTacticalReaction");
    if(hud&&!pill){pill=document.createElement("span");pill.className="micro-tactical-pill";pill.id="microTacticalReaction";hud.querySelector(".micro-tactical-main")?.appendChild(pill)}
    let box=$("microReactionWindow");if(!box){
      box=document.createElement("div");box.id="microReactionWindow";box.innerHTML='<div class="micro-reaction-copy"><span class="micro-reaction-title" id="microReactionTitle">🚨 JANELA DE REAÇÃO</span><span class="micro-reaction-detail" id="microReactionDetail"></span></div><div class="micro-reaction-actions"><button type="button" class="btn micro-reaction-use" id="microReactionUse">⚔️ Ataque de Oportunidade</button><button type="button" class="btn" id="microReactionPass">✕ Não reagir</button></div>';
      const shell=document.querySelector(".map-shell"),viewport=$("viewport");if(shell&&viewport)shell.insertBefore(box,viewport);else document.body.appendChild(box);
      $("microReactionUse").onclick=useReaction;$("microReactionPass").onclick=passReaction
    }
    return box
  }
  function updateHud(){
    ensureUi();const c=combat(),p=players.find(x=>String(x.id)===String(c.active_token_id)),pill=$("microTacticalReaction");if(!pill)return;
    if(!c.started||!p){pill.hidden=true;return}pill.hidden=false;
    const spent=!reactionAvailable(p);pill.textContent=spent?"↩️ Reação usada":"↩️ Reação disponível";pill.classList.toggle("spent",spent)
  }
  function notify(text){
    if(globalThis.MICROCOSMOS_TOKEN_ACTIONS?.showToast)try{globalThis.MICROCOSMOS_TOKEN_ACTIONS.showToast(text)}catch(_e){}
    const st=$("mapStatus");if(!st)return;const old=st.textContent;st.textContent=text;clearTimeout(notify._t);notify._t=setTimeout(()=>{if(st.textContent===text)st.textContent=old},2200)
  }

  function patchTactical(){
    const t=globalThis.MICROCOSMOS_TACTICAL_TURN;if(!t||patchedTactical)return false;
    const oldCan=typeof t.canUseAction==="function"?t.canUseAction.bind(t):null,oldCommit=typeof t.commitAction==="function"?t.commitAction.bind(t):null;
    if(!oldCan||!oldCommit)return false;
    t.canUseAction=function(caster,meta={}){
      const ctx=globalThis.MICROCOSMOS_REACTION_CONTEXT;
      if(ctx&&String(ctx.reactorId)===String(caster?.id)){
        if(reactionSpent.has(String(caster.id)))return{ok:false,bucket:"reaction",reason:"🚫 Reação já foi usada desde o início do seu último turno."};
        return{ok:true,bucket:"reaction"}
      }
      return oldCan(caster,meta)
    };
    t.commitAction=function(caster,meta={}){
      const ctx=globalThis.MICROCOSMOS_REACTION_CONTEXT;
      if(ctx&&String(ctx.reactorId)===String(caster?.id)){
        if(reactionSpent.has(String(caster.id))){notify("🚫 Reação já utilizada.");return false}
        reactionSpent.add(String(caster.id));updateHud();notify(`↩️ Reação de ${caster.name||"personagem"} utilizada.`);return true
      }
      return oldCommit(caster,meta)
    };
    t.reactionAvailable=reactionAvailable;
    t.resetReaction=p=>{if(p)reactionSpent.delete(String(p.id));updateHud()};
    patchedTactical=true;return true
  }

  function resetAtTurnStart(){
    const c=combat(),key=c.started&&c.active_token_id?`${c.round||0}:${c.active_token_id}`:"";
    if(key===lastTurnKey)return;lastTurnKey=key;
    if(c.started&&c.active_token_id)reactionSpent.delete(String(c.active_token_id));
    if(!c.started){reactionSpent.clear();activeWindow=null;$("microReactionWindow")?.classList.remove("active")}
    updateHud()
  }

  function reactionCandidates(mover,from,to){
    const c=combat();if(!c.started||String(c.active_token_id)!==String(mover?.id))return[];
    const out=[];
    for(const reactor of players){
      if(String(reactor.id)===String(mover.id)||!alive(reactor)||!hostile(reactor,mover)||!reactionAvailable(reactor)||!canControl(reactor))continue;
      const attackIndex=meleeAttackIndex(reactor);if(attackIndex<0)continue;const reach=reachOf(reactor,attackIndex);
      const before=distance(reactor,from),after=distance(reactor,to);
      if(before<=reach+.05&&after>reach+.05)out.push({reactor,mover,from:{x:+from.x||0,y:+from.y||0},to:{x:+to.x||0,y:+to.y||0},attackIndex,reach,before,after})
    }
    return out
  }
  function moveKey(mover,from,to){return `${mover.id}:${(+from.x||0).toFixed(1)},${(+from.y||0).toFixed(1)}>${(+to.x||0).toFixed(1)},${(+to.y||0).toFixed(1)}`}
  function afterMove(mover,from,to){
    if(!mover||distance(from,to)<.05)return;
    const mk=moveKey(mover,from,to),now=Date.now();if(now-(recentMoves.get(mk)||0)<800)return;recentMoves.set(mk,now);
    lastPositions.set(String(mover.id),{x:+to.x||0,y:+to.y||0});
    if(activeWindow)return;
    const candidate=reactionCandidates(mover,from,to)[0];if(candidate)openReaction(candidate)
  }
  function openReaction(candidate){
    activeWindow={...candidate,id:`reaction-${Date.now().toString(36)}`};const box=ensureUi();
    $("microReactionTitle").textContent=`🚨 REAÇÃO — ${candidate.reactor.name||"Personagem"}`;
    $("microReactionDetail").textContent=`${candidate.mover.name||"Alvo"} saiu do alcance corpo a corpo (${fmt(candidate.reach)} m). Você pode usar 1 Reação.`;
    const use=$("microReactionUse");use.disabled=!canControl(candidate.reactor);use.textContent=`⚔️ ${candidate.reactor.attacks?.[candidate.attackIndex]?.name||"Ataque de Oportunidade"}`;
    box.classList.add("active");notify(`🚨 ${candidate.reactor.name} pode fazer um Ataque de Oportunidade contra ${candidate.mover.name}.`)
  }
  function closeReaction(){activeWindow=null;globalThis.MICROCOSMOS_REACTION_CONTEXT=null;$("microReactionWindow")?.classList.remove("active");updateHud()}
  function passReaction(){if(!activeWindow)return;notify(`↩️ ${activeWindow.reactor.name} decidiu não usar a Reação.`);closeReaction()}

  async function useReaction(){
    const w=activeWindow;if(!w||!canControl(w.reactor)||!reactionAvailable(w.reactor))return;
    const ex=globalThis.MICROCOSMOS_COMBAT_EXECUTOR;if(!ex?.start||!ex?.resolve){notify("⚠️ Executor de combate ainda não está pronto.");return}
    const btn=$("microReactionUse");if(btn)btn.disabled=true;
    const current={x:+w.mover.x||0,y:+w.mover.y||0};
    globalThis.MICROCOSMOS_REACTION_CONTEXT={id:w.id,kind:"opportunity_attack",reactorId:String(w.reactor.id),moverId:String(w.mover.id),from:w.from,to:w.to};
    try{
      // O executor calcula o alcance pela posição do token. Durante a resolução,
      // usamos a posição exata em que o alvo abandonou o alcance; visualmente o
      // deslocamento continua concluído nesta Beta.
      w.mover.x=w.from.x;w.mover.y=w.from.y;
      const started=await ex.start(w.reactor,"attack",w.attackIndex);if(started===false)throw new Error("Reação bloqueada pelo controle de turno");
      await ex.resolve(w.mover);
      if(!reactionSpent.has(String(w.reactor.id)))throw new Error("A Reação não foi registrada pelo turno tático")
    }catch(err){console.warn("MICROCOSMOS reação:",err);notify(`⚠️ Não foi possível concluir a Reação: ${err?.message||err}`)}
    finally{
      w.mover.x=current.x;w.mover.y=current.y;try{api.renderTokens?.();globalThis.MICROCOSMOS_TOKEN_SIZE?.refresh?.()}catch(_e){}
      globalThis.MICROCOSMOS_REACTION_CONTEXT=null;if(btn)btn.disabled=false
    }
    if(reactionSpent.has(String(w.reactor.id)))closeReaction()
  }

  function wrapRecordMove(){
    const t=globalThis.MICROCOSMOS_TACTICAL_TURN;if(!t||typeof t.recordMove!=="function"||t.recordMove===wrappedRecord)return;
    const original=t.recordMove.bind(t);const wrapped=function(p,from,to){const result=original(p,from,to);afterMove(p,from,to);return result};wrapped.__microReaction=true;t.recordMove=wrapped;wrappedRecord=wrapped
  }
  function scanPositions(){
    const c=combat();
    for(const p of players){
      const id=String(p.id),now={x:+p.x||0,y:+p.y||0},prev=lastPositions.get(id);
      if(prev&&c.started&&String(c.active_token_id)===id&&distance(prev,now)>.05)afterMove(p,prev,now);
      lastPositions.set(id,now)
    }
  }

  try{
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");const sb=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});const {data:{session}}=await sb.auth.getSession();userId=session?.user?.id||"";
    if(userId){const {data}=await sb.from("profiles").select("role,approved").eq("id",userId).maybeSingle();isMaster=data?.role==="master"&&data?.approved!==false}
  }catch(e){console.warn("MICROCOSMOS Reações: autenticação indisponível",e)}

  ensureUi();patchTactical();wrapRecordMove();resetAtTurnStart();scanPositions();
  setInterval(()=>{patchTactical();wrapRecordMove();resetAtTurnStart();scanPositions();updateHud()},220);
  globalThis.MICROCOSMOS_REACTION_API={reactionAvailable,afterMove,openReaction,passReaction,useReaction,get active(){return activeWindow},get spent(){return reactionSpent}};
})();
