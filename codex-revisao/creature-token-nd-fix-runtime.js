/* MICROCOSMOS — Nível de Dificuldade dos tokens de criaturas IPM.
   Corrige integração do Codex IPM com a Mesa sem criar ciclo de MutationObserver.
*/
(function(){
  if(globalThis.MICROCOSMOS_CREATURE_ND_FIX)return;
  globalThis.MICROCOSMOS_CREATURE_ND_FIX=true;
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  const api=globalThis.MICROCOSMOS_TABLE_API;
  if(!Array.isArray(players)||!api)return;

  function ndValue(p){return String(p?.challenge??p?.level??"—").trim()||"—"}
  function ndLabel(p){return `Nível de Dificuldade: ND ${ndValue(p)}`}
  function normalizeToken(token,creature){
    if(!token||!creature)return token;
    const d=creature.data||{};
    const nd=String(d.challenge??creature.challenge??token.challenge??token.level??"—").trim()||"—";
    token.challenge=nd;
    token.level=nd;
    token.xp=+(d.xp??creature.xp??token.xp??0)||0;
    token.creature=true;
    return token;
  }

  function findCreatureToken(creature,before=0){
    return players.slice(before).reverse().find(p=>p.creatureId===creature?.id)||[...players].reverse().find(p=>p.creatureId===creature?.id)
  }
  function refreshToken(token){
    try{api.renderPlayers();api.renderTokens();if(token)api.selectToken(token.id)}catch(e){console.warn("MICROCOSMOS: falha ao atualizar token de criatura",e)}
  }

  function patchCodexApi(){
    const codex=globalThis.MICROCOSMOS_CREATURE_CODEX_IPM;
    if(!codex||codex.__ndFixed||typeof codex.addToTable!=="function")return false;
    const old=codex.addToTable;
    codex.addToTable=function(creature){
      const before=players.length;
      let result;
      try{result=old.apply(this,arguments)}catch(e){console.error("MICROCOSMOS: erro ao criar token da criatura",e);throw e}
      const finish=()=>{
        const token=findCreatureToken(creature,before);
        normalizeToken(token,creature);
        refreshToken(token);
        scheduleFixDom();
        return token
      };
      if(result&&typeof result.then==="function")return result.then(value=>{finish();return value});
      setTimeout(finish,0);
      return result;
    };
    codex.__ndFixed=true;
    return true;
  }

  let fixing=false,fixQueued=false;
  function setTextIfChanged(el,text){if(el&&el.textContent!==text)el.textContent=text}
  function fixDom(){
    if(fixing)return;
    fixing=true;
    try{
      document.querySelectorAll("[data-select]").forEach(row=>{
        const p=players.find(x=>x.id===row.dataset.select);if(!p?.creature)return;
        const small=row.querySelector("small");
        setTextIfChanged(small,`${p.cls||"Criatura"} • ${ndLabel(p)}${p.xp?` • ${p.xp} XP`:""}`)
      });
      const card=document.getElementById("tokenCard"),selected=document.querySelector("#tokenLayer .token.selected");
      const p=selected?players.find(x=>x.id===selected.dataset.token):null;
      if(card&&p?.creature){
        const headSmall=card.querySelector("div > div > small");
        setTextIfChanged(headSmall,`${p.cls||"Criatura"} • ${ndLabel(p)}${p.xp?` • ${p.xp} XP`:""}`)
      }
    }finally{fixing=false}
  }
  function scheduleFixDom(){
    if(fixQueued)return;fixQueued=true;
    requestAnimationFrame(()=>{fixQueued=false;fixDom()})
  }

  for(const p of players)if(p.creature&&p.challenge)p.level=p.challenge;
  let tries=0;
  const timer=setInterval(()=>{tries++;patchCodexApi();scheduleFixDom();if(tries>40)clearInterval(timer)},250);
  const obs=new MutationObserver(()=>scheduleFixDom());obs.observe(document.body,{childList:true,subtree:true});
  document.addEventListener("click",()=>scheduleFixDom(),true);
  globalThis.MICROCOSMOS_CREATURE_ND={normalizeToken,fixDom,ndLabel,scheduleFixDom};
})();
