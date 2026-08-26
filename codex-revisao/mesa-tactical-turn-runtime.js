/* MICROCOSMOS — Modo Tático Beta v1.1.
   Controla o deslocamento por turno em blocos reversíveis:
   - cada arrasto concluído vira um segmento de movimento;
   - ↩ desfaz somente o último segmento;
   - uma ação confirmada trava os movimentos anteriores, mas não zera o movimento restante;
   - Ataques e magias respeitam o recurso Ação/Ação Bônus/Reação do turno;
   - o turno só avança quando o dono do token ativo (ou o Mestre) usa Passar Vez.
   Nesta primeira versão o histórico de movimento é local ao aparelho que controla o turno;
   a posição do token continua sincronizada pela Mesa compartilhada.
*/
(async function(){
  if(globalThis.MICROCOSMOS_TACTICAL_TURN)return;
  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const SESSION_KEY="microcosmos-main";
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  const api=globalThis.MICROCOSMOS_TABLE_API;
  if(!Array.isArray(players)||!api)return;

  const $=id=>document.getElementById(id);
  let supabase=null,session=null,profile=null;
  let turnKey="",state=null,lastCombatStarted=false;

  function num(v,fallback=0){
    if(typeof v==="number"&&Number.isFinite(v))return v;
    const m=String(v??"").replace(",",".").match(/-?\d+(?:\.\d+)?/);
    return m?+m[0]:fallback
  }
  function fmt(v){
    const n=Math.max(0,Math.round((+v||0)*10)/10);
    return Number.isInteger(n)?String(n):n.toFixed(1).replace(".",",")
  }
  function combat(){return globalThis.MICROCOSMOS_INITIATIVE?.combat||{started:false,active_token_id:null,round:0}}
  function activeToken(){const c=combat();return players.find(p=>String(p.id)===String(c.active_token_id))||null}
  function movementTotal(p){
    const candidates=[p?.speed,p?.movement,p?.move,p?.walk,p?.movementSpeed,p?.stats?.movement,p?.data?.speed];
    for(const v of candidates){const n=num(v,NaN);if(Number.isFinite(n)&&n>0)return n}
    return 9
  }
  function distanceMeters(from,to){
    const s=Math.max(20,+$("gridSize")?.value||70),dx=Math.abs((+to.x||0)-(+from.x||0)),dy=Math.abs((+to.y||0)-(+from.y||0)),type=$("gridType")?.value||"square";
    if(type==="square")return Math.max(dx,dy)/s*1.5;
    return Math.hypot(dx,dy)/s*1.5
  }
  function canControl(p){return !!p&&!!session&&(profile?.role==="master"||p.userId===session.user.id)}
  function resetForTurn(c){
    const p=players.find(x=>String(x.id)===String(c.active_token_id))||null;
    state={tokenId:p?.id||null,round:+c.round||0,total:movementTotal(p),used:0,history:[],actionUsed:false,bonusUsed:false,reactionUsed:false,actionLocks:0};
    render()
  }
  function syncTurn(){
    const c=combat(),key=c.started&&c.active_token_id?`${c.round||0}:${c.active_token_id}`:"";
    if(key!==turnKey){turnKey=key;if(key)resetForTurn(c);else{state=null;render()}}
    lastCombatStarted=!!c.started;
  }

  function notify(text){
    const st=$("mapStatus");if(!st)return;
    const old=st.textContent;st.textContent=text;clearTimeout(notify._t);notify._t=setTimeout(()=>{if(st.textContent===text)st.textContent=old},1500)
  }
  function ensureCss(){
    if($("microTacticalTurnStyle"))return;
    const s=document.createElement("style");s.id="microTacticalTurnStyle";s.textContent=`
      #microTacticalHud{display:none;gap:6px;align-items:center;flex-wrap:wrap;margin:0 0 6px;padding:6px 7px;border:1px solid #8a704b;border-radius:10px;background:#efe5cc;color:#3f3223;font-size:.75rem}
      #microTacticalHud.active{display:flex}.micro-tactical-main{display:flex;gap:8px;align-items:center;flex-wrap:wrap;min-width:0;flex:1}.micro-tactical-turn{font-weight:bold;color:#31583d;white-space:nowrap}.micro-tactical-pill{display:inline-flex;align-items:center;gap:4px;padding:4px 7px;border:1px solid #a18b69;border-radius:999px;background:#fffaf0;white-space:nowrap}.micro-tactical-pill.spent{opacity:.58;text-decoration:line-through}.micro-tactical-actions{display:flex;gap:5px;margin-left:auto}.micro-tactical-actions .btn{padding:5px 8px;min-height:30px;font-size:.72rem}.micro-tactical-actions .btn:disabled{opacity:.4;cursor:default}
      @media(max-width:720px){#microTacticalHud{font-size:.7rem;padding:5px}.micro-tactical-main{gap:5px}.micro-tactical-pill{padding:3px 6px}.micro-tactical-actions{width:100%;margin-left:0;display:grid;grid-template-columns:1fr 1fr}.micro-tactical-actions .btn{width:100%}}
    `;document.head.appendChild(s)
  }
  function ensureHud(){
    ensureCss();let hud=$("microTacticalHud");if(hud)return hud;
    const shell=document.querySelector(".map-shell"),viewport=$("viewport");if(!shell||!viewport)return null;
    hud=document.createElement("div");hud.id="microTacticalHud";hud.innerHTML='<div class="micro-tactical-main"><span class="micro-tactical-turn" id="microTacticalTurnLabel"></span><span class="micro-tactical-pill" id="microTacticalMove"></span><span class="micro-tactical-pill" id="microTacticalAction"></span></div><div class="micro-tactical-actions"><button class="btn" id="microTacticalUndo">↩️ Retornar</button><button class="btn primary" id="microTacticalPass">⏭️ Passar Vez</button></div>';
    shell.insertBefore(hud,viewport);
    $("microTacticalUndo").onclick=undoLast;
    $("microTacticalPass").onclick=passTurn;
    return hud
  }
  function render(){
    const hud=ensureHud();if(!hud)return;const c=combat(),p=activeToken();
    if(!c.started||!p||!state){hud.classList.remove("active");return}
    hud.classList.add("active");
    const remaining=Math.max(0,state.total-state.used),controller=canControl(p);
    $("microTacticalTurnLabel").textContent=`⚔️ Turno: ${p.name||"Token"}`;
    $("microTacticalMove").textContent=`🏃 ${fmt(remaining)} / ${fmt(state.total)} m restantes`;
    const a=$("microTacticalAction");a.textContent=state.actionUsed?"⚔️ Ação usada":"⚔️ Ação disponível";a.classList.toggle("spent",state.actionUsed);
    const undo=$("microTacticalUndo"),pass=$("microTacticalPass");
    undo.disabled=!controller||!state.history.length;undo.title=state.history.length?`Desfazer último deslocamento (${fmt(state.history[state.history.length-1].meters)} m)`:"Nenhum deslocamento reversível";
    pass.disabled=!controller;pass.title=controller?"Encerrar este turno e avançar para o próximo":"Somente o dono do token ativo ou o Mestre";
  }

  function validateMove(p,from,to){
    syncTurn();const c=combat();if(!c.started)return{ok:true,point:to};
    if(String(c.active_token_id)!==String(p.id)){notify(`⛔ Agora é o turno de ${activeToken()?.name||"outro token"}.`);return{ok:false,point:from}}
    if(!state||String(state.tokenId)!==String(p.id))resetForTurn(c);
    const meters=distanceMeters(from,to),remaining=Math.max(0,state.total-state.used);
    if(meters<=0.05)return{ok:true,point:to,meters:0};
    if(meters>remaining+.05){notify(`🚫 Movimento insuficiente: restam ${fmt(remaining)} m.`);return{ok:false,point:from,meters:0}}
    return{ok:true,point:to,meters}
  }
  function recordMove(p,from,to){
    syncTurn();const c=combat();if(!c.started||String(c.active_token_id)!==String(p.id)||!state)return;
    const meters=distanceMeters(from,to);if(meters<=0.05)return;
    state.used=Math.min(state.total,state.used+meters);
    state.history.push({from:{x:+from.x||0,y:+from.y||0},to:{x:+to.x||0,y:+to.y||0},meters});
    render()
  }
  async function undoLast(){
    syncTurn();const p=activeToken();if(!state||!p||!canControl(p)||!state.history.length)return;
    const step=state.history.pop();p.x=step.from.x;p.y=step.from.y;state.used=Math.max(0,state.used-step.meters);
    try{api.renderTokens?.();api.selectToken?.(p.id);globalThis.MICROCOSMOS_TOKEN_SIZE?.refresh?.();await globalThis.MICROCOSMOS_MESA_SHARED?.flushToken?.(p.id,false)}catch(e){console.warn("MICROCOSMOS retorno tático:",e)}
    notify(`↩️ ${fmt(step.meters)} m retornados. Restam ${fmt(state.total-state.used)} m.`);render()
  }
  function actionBucket(item,type){
    const raw=`${item?.activation||""} ${item?.castingTime||""} ${item?.time||""} ${item?.actionType||""}`.toLowerCase();
    if(/b[oô]nus|bonus/.test(raw))return"bonus";if(/rea[cç][aã]o|reaction/.test(raw))return"reaction";return"action"
  }
  function actionLabel(bucket){return bucket==="bonus"?"Ação Bônus":bucket==="reaction"?"Reação":"Ação"}
  function canUseAction(caster,meta={}){
    syncTurn();const c=combat();
    if(!c.started)return{ok:true,bucket:actionBucket(meta.item,meta.type)};
    if(!caster||String(c.active_token_id)!==String(caster.id))return{ok:false,bucket:"action",reason:`⏳ Aguarde. Agora é o turno de ${activeToken()?.name||"outro token"}.`};
    if(!state||String(state.tokenId)!==String(caster.id))resetForTurn(c);
    const bucket=actionBucket(meta.item,meta.type),used=bucket==="bonus"?state.bonusUsed:bucket==="reaction"?state.reactionUsed:state.actionUsed;
    if(used)return{ok:false,bucket,reason:`🚫 ${actionLabel(bucket)} já foi usada neste turno.`};
    return{ok:true,bucket}
  }
  function commitAction(caster,meta={}){
    const check=canUseAction(caster,meta);if(!check.ok){notify(check.reason);render();return false}
    const c=combat();if(!c.started)return true;
    if(check.bucket==="bonus")state.bonusUsed=true;else if(check.bucket==="reaction")state.reactionUsed=true;else state.actionUsed=true;
    // Tudo que foi feito antes desta ação fica confirmado. O movimento restante continua disponível.
    state.history=[];state.actionLocks++;render();notify(`🔒 ${actionLabel(check.bucket)} usada. Movimento restante: ${fmt(state.total-state.used)} m.`);return true
  }
  async function passTurn(){
    syncTurn();const p=activeToken();if(!p||!canControl(p)||!supabase)return;
    const btn=$("microTacticalPass");if(btn)btn.disabled=true;
    const {data,error}=await supabase.rpc("tactical_pass_turn",{p_session_key:SESSION_KEY});
    if(error){notify(`⚠️ ${error.message}`);render();return}
    turnKey="";try{await globalThis.MICROCOSMOS_INITIATIVE?.reload?.()}catch(_e){};syncTurn();
    const next=players.find(x=>String(x.id)===String(data?.active_token_id));notify(`⏭️ Turno encerrado${next?`. Agora: ${next.name}`:""}.`)
  }

  try{
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");supabase=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});const {data:{session:s}}=await supabase.auth.getSession();session=s;
    if(session){const {data:p}=await supabase.from("profiles").select("role,approved").eq("id",session.user.id).maybeSingle();profile=p||null}
  }catch(e){console.warn("MICROCOSMOS modo tático sem conexão online",e)}

  globalThis.MICROCOSMOS_TACTICAL_TURN={validateMove,recordMove,undoLast,commitAction,canUseAction,actionBucket,passTurn,get state(){return state},distanceMeters,sync:syncTurn};
  ensureHud();syncTurn();setInterval(()=>{syncTurn();render()},350);
})();
