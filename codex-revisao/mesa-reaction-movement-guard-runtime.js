/* MICROCOSMOS — Guarda de Movimento para Reações v1.
   Regras:
   - ↩️ Retornar é uma correção local de deslocamento, não um novo movimento de jogo;
     portanto nunca pode gerar Ataque/Magia de Oportunidade.
   - quando um deslocamento válido abre uma Janela de Reação de Oportunidade,
     o histórico reversível anterior é confirmado imediatamente. O alvo não pode
     usar Retornar para apagar o gatilho ou fugir do ataque que já provocou.
   - movimentos feitos depois da janela podem voltar a criar novos segmentos
     reversíveis normalmente.
*/
(function(){
  if(globalThis.MICROCOSMOS_REACTION_MOVEMENT_GUARD)return;
  globalThis.MICROCOSMOS_REACTION_MOVEMENT_GUARD=true;

  const $=id=>document.getElementById(id);
  const players=()=>Array.isArray(globalThis.MICROCOSMOS_TABLE_PLAYERS)?globalThis.MICROCOSMOS_TABLE_PLAYERS:[];
  let patchedTactical=null,patchedUndoButton=null,lastLockedWindowId="";

  function combat(){return globalThis.MICROCOSMOS_INITIATIVE?.combat||{started:false,active_token_id:null,round:0}}
  function activeToken(){const c=combat();return players().find(p=>String(p.id)===String(c.active_token_id))||null}
  function fmt(v){const n=Math.max(0,Math.round((+v||0)*10)/10);return Number.isInteger(n)?String(n):n.toFixed(1).replace(".",",")}
  function notify(text){
    if(globalThis.MICROCOSMOS_TOKEN_ACTIONS?.showToast)try{globalThis.MICROCOSMOS_TOKEN_ACTIONS.showToast(text)}catch(_e){}
    const st=$("mapStatus");if(!st)return;const old=st.textContent;st.textContent=text;clearTimeout(notify._t);notify._t=setTimeout(()=>{if(st.textContent===text)st.textContent=old},2300)
  }
  function reactionForMover(p){
    const w=globalThis.MICROCOSMOS_REACTION_API?.active;
    return !!(w&&w.mode==="opportunity"&&p&&String(w.mover?.id)===String(p.id))
  }
  function refreshUndoButton(){
    const t=globalThis.MICROCOSMOS_TACTICAL_TURN,s=t?.state,btn=$("microTacticalUndo");if(!btn)return;
    const p=activeToken();
    if(reactionForMover(p)){
      btn.disabled=true;btn.title="🔒 Este deslocamento já provocou uma Reação e não pode ser desfeito.";return
    }
    if(!s?.history?.length){btn.disabled=true;if(s?.reactionCheckpoint)btn.title="🔒 O movimento anterior foi confirmado por uma Reação.";return}
    // A permissão normal continua sendo controlada pelo runtime tático; só
    // reabilitamos quando ele já havia deixado o botão disponível ao controlador.
    if(btn.dataset.microReactionForcedLock==="1"){btn.dataset.microReactionForcedLock="";btn.disabled=false}
  }
  function lockReturnForOpportunity(w){
    if(!w||w.mode!=="opportunity"||!w.mover)return false;
    const t=globalThis.MICROCOSMOS_TACTICAL_TURN,s=t?.state,c=combat();
    if(!s||String(s.tokenId)!==String(w.mover.id)||String(c.active_token_id)!==String(w.mover.id))return false;
    // Confirmar todo o caminho reversível evita que um segmento antigo seja
    // desfeito depois do segmento que realmente provocou a Reação.
    s.history=[];
    s.reactionCheckpoint={id:w.id,at:Date.now(),reason:"opportunity"};
    const btn=$("microTacticalUndo");if(btn){btn.disabled=true;btn.dataset.microReactionForcedLock="1";btn.title="🔒 Movimento confirmado: uma Reação de Oportunidade foi provocada."}
    return true
  }
  function syncReactionPositionAfterUndo(p,point){
    const r=globalThis.MICROCOSMOS_REACTION_API,c=combat();if(!r?.afterMove||!p||!point)return;
    const real=c.active_token_id;
    try{
      // afterMove atualiza a posição interna usada pelo detector. Trocamos o
      // token ativo apenas durante esta chamada síncrona para que o retorno seja
      // registrado como correção e nunca seja interpretado como gatilho real.
      c.active_token_id=`__micro-return-sync-${Date.now()}`;
      r.afterMove(p,{x:(+point.x||0)+4,y:(+point.y||0)+4},{x:+point.x||0,y:+point.y||0});
    }catch(e){console.warn("MICROCOSMOS: não foi possível sincronizar Retornar com Reações",e)}
    finally{c.active_token_id=real}
  }
  async function safeUndo(){
    const t=globalThis.MICROCOSMOS_TACTICAL_TURN,s=t?.state,p=activeToken(),btn=$("microTacticalUndo");
    if(!t||!s||!p||!Array.isArray(s.history)||!s.history.length)return false;
    if(reactionForMover(p)){
      lockReturnForOpportunity(globalThis.MICROCOSMOS_REACTION_API?.active);
      notify("🚫 Retornar indisponível: este deslocamento já provocou uma Reação.");
      return false
    }
    if(btn?.disabled)return false;
    const step=s.history.pop();if(!step)return false;
    p.x=+step.from?.x||0;p.y=+step.from?.y||0;s.used=Math.max(0,(+s.used||0)-(+step.meters||0));
    syncReactionPositionAfterUndo(p,{x:p.x,y:p.y});
    try{
      globalThis.MICROCOSMOS_TABLE_API?.renderTokens?.();
      globalThis.MICROCOSMOS_TABLE_API?.selectToken?.(p.id);
      globalThis.MICROCOSMOS_TOKEN_SIZE?.refresh?.();
      await globalThis.MICROCOSMOS_MESA_SHARED?.flushToken?.(p.id,false)
    }catch(e){console.warn("MICROCOSMOS retorno tático protegido:",e)}
    notify(`↩️ ${fmt(step.meters)} m retornados. Retornar não gera Reação.`);
    return true
  }
  function patch(){
    const t=globalThis.MICROCOSMOS_TACTICAL_TURN;
    if(t&&t!==patchedTactical){t.undoLast=safeUndo;patchedTactical=t}
    const btn=$("microTacticalUndo");if(btn&&btn!==patchedUndoButton){btn.onclick=safeUndo;patchedUndoButton=btn}
    const w=globalThis.MICROCOSMOS_REACTION_API?.active;
    if(w?.mode==="opportunity"&&w.id&&w.id!==lastLockedWindowId){lastLockedWindowId=w.id;lockReturnForOpportunity(w)}
    refreshUndoButton()
  }

  // Bloqueio em captura: mesmo no intervalo de poucos milissegundos entre abrir
  // a janela e o próximo ciclo de atualização, o alvo não consegue apagar o gatilho.
  window.addEventListener("click",e=>{
    const btn=e.target?.closest?.("#microTacticalUndo");if(!btn)return;
    const p=activeToken();if(!reactionForMover(p))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    lockReturnForOpportunity(globalThis.MICROCOSMOS_REACTION_API?.active);
    notify("🚫 O movimento já provocou uma Reação. Retornar foi perdido para esse deslocamento.")
  },true);

  patch();setInterval(patch,60);
  globalThis.MICROCOSMOS_REACTION_MOVEMENT_GUARD_API={safeUndo,lockReturnForOpportunity};
})();
