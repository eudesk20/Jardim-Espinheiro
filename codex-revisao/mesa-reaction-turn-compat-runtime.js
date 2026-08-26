/* MICROCOSMOS — Compatibilidade da Janela de Reação com a trava de turno.
   A Reação é a única exceção controlada ao bloqueio "não é sua vez".
   Alguns navegadores podem manter em cache uma versão anterior da trava de ações;
   nesse caso o Ataque de Oportunidade abre corretamente, mas o executor ainda
   devolve false ao iniciar a ação. Este runtime faz um bypass mínimo e síncrono:
   durante a chamada inicial da Reação, apresenta temporariamente o reactor como
   token ativo apenas para atravessar a guarda antiga. O turno real é restaurado
   imediatamente, antes de a resolução assíncrona continuar.
*/
(function(){
  if(globalThis.MICROCOSMOS_REACTION_TURN_COMPAT)return;
  globalThis.MICROCOSMOS_REACTION_TURN_COMPAT=true;

  const $=id=>document.getElementById(id);
  let patchedButton=null;

  function patch(){
    const api=globalThis.MICROCOSMOS_REACTION_API;
    const btn=$("microReactionUse");
    if(!api||!btn||patchedButton===btn)return false;

    const originalUse=api.useReaction;
    if(typeof originalUse!=="function")return false;

    btn.onclick=function(){
      const w=api.active;
      const combat=globalThis.MICROCOSMOS_INITIATIVE?.combat;
      if(!w?.reactor||!combat)return originalUse();

      const realActive=combat.active_token_id;
      let pending;
      try{
        // Somente a verificação síncrona do executor enxerga o reactor como ativo.
        // O estado oficial da iniciativa volta ao normal no mesmo ciclo de evento.
        combat.active_token_id=w.reactor.id;
        pending=originalUse();
      }finally{
        combat.active_token_id=realActive;
      }
      return pending
    };
    btn.onclick.__microReactionTurnCompat=true;
    patchedButton=btn;
    return true
  }

  patch();
  setInterval(patch,250);
})();
