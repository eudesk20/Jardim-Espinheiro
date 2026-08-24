/* MICROCOSMOS — Correção de ND/CR dos tokens de criaturas IPM.
   O Codex armazena o ND em creature.data.challenge. Este runtime garante que
   o token receba challenge/level/xp corretos e que a UI use ND, não Nível. */
(function(){
  if(globalThis.MICROCOSMOS_CREATURE_ND_FIX)return;
  globalThis.MICROCOSMOS_CREATURE_ND_FIX=true;
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  const api=globalThis.MICROCOSMOS_TABLE_API;
  if(!Array.isArray(players)||!api)return;

  function normalizeToken(token,creature){
    if(!token||!creature)return token;
    const d=creature.data||{};
    const nd=String(d.challenge??creature.challenge??token.challenge??token.level??"—").trim()||"—";
    token.challenge=nd;
    token.level=nd; // compatibilidade com a Mesa v1
    token.xp=+(d.xp??creature.xp??token.xp??0)||0;
    token.creature=true;
    return token;
  }

  function patchCodexApi(){
    const codex=globalThis.MICROCOSMOS_CREATURE_CODEX_IPM;
    if(!codex||codex.__ndFixed||typeof codex.addToTable!=="function")return false;
    const old=codex.addToTable;
    codex.addToTable=function(creature){
      const before=players.length;
      const result=old.apply(this,arguments);
      const token=players.slice(before).reverse().find(p=>p.creatureId===creature?.id)||[...players].reverse().find(p=>p.creatureId===creature?.id);
      normalizeToken(token,creature);
      try{api.renderPlayers();api.renderTokens();if(token)api.selectToken(token.id)}catch(e){}
      return result;
    };
    codex.__ndFixed=true;
    return true;
  }

  function fixDom(){
    // Lista lateral: troca somente para linhas associadas a tokens de criatura.
    document.querySelectorAll("[data-select]").forEach(row=>{
      const p=players.find(x=>x.id===row.dataset.select);if(!p?.creature)return;
      const small=row.querySelector("small");
      if(small)small.textContent=`${p.cls||"Criatura"} • ND ${p.challenge||p.level||"—"}${p.xp?` • ${p.xp} XP`:""}`;
    });
    const card=document.getElementById("tokenCard");
    const selected=document.querySelector("#tokenLayer .token.selected");
    const p=selected?players.find(x=>x.id===selected.dataset.token):null;
    if(!card||!p?.creature)return;
    const headSmall=card.querySelector("div > div > small");
    if(headSmall)headSmall.textContent=`${p.cls||"Criatura"} • ND ${p.challenge||p.level||"—"}${p.xp?` • ${p.xp} XP`:""}`;
  }

  // Migra qualquer criatura criada antes da correção quando os dados estiverem
  // disponíveis no próprio token.
  for(const p of players)if(p.creature&&p.challenge)p.level=p.challenge;

  let tries=0;
  const timer=setInterval(()=>{tries++;patchCodexApi();fixDom();if(tries>40)clearInterval(timer)},250);
  const obs=new MutationObserver(fixDom);obs.observe(document.body,{childList:true,subtree:true});
  document.addEventListener("click",()=>setTimeout(fixDom,0),true);
  globalThis.MICROCOSMOS_CREATURE_ND={normalizeToken,fixDom};
})();