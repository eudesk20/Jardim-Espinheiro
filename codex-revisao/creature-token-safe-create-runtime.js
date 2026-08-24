/* MICROCOSMOS — criação segura de token a partir do Codex IPM.
   Intercepta #mcAdd em capture antes da rotina antiga e executa um único fluxo:
   1 push -> 1 renderPlayers -> 1 renderTokens -> 1 selectToken.
   Evita re-render duplicado/loops de runtimes legados que podiam congelar a Mesa.
*/
(function(){
  if(globalThis.MICROCOSMOS_CREATURE_SAFE_CREATE)return;
  globalThis.MICROCOSMOS_CREATURE_SAFE_CREATE=true;

  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  const api=globalThis.MICROCOSMOS_TABLE_API;
  if(!Array.isArray(players)||!api)return;

  const $=id=>document.getElementById(id);
  const ABILITIES=["FOR","DES","CON","INT","SAB","CAR"];
  const CATEGORIES={natural:"Natural",primeva:"Linhagem Primeva",mutada:"Mutada",fungica:"Fúngica",arcana:"Arcana",gigante:"Influência dos Gigantes",elevada:"Linhagem Elevada",lenda:"Lenda / Entidade",outro:"Outro"};
  let creating=false;

  function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f}
  function arr(v){return String(v||"").split(/[,;\n]/).map(x=>x.trim()).filter(Boolean)}
  function clone(v){try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v))}}
  function json(id){try{const v=JSON.parse($(id)?.value||"[]");return Array.isArray(v)?v:[]}catch{return[]}}
  function mod(v){return Math.floor(((+v||10)-10)/2)}
  function activeCreatureId(){return document.querySelector(".micro-creature-row.active")?.dataset?.creatureId||`local-${Date.now().toString(36)}`}

  function buildToken(){
    const name=$("mcName")?.value?.trim()||"Criatura";
    const category=$("mcCategory")?.value||"natural";
    const challenge=$("mcChallenge")?.value?.trim()||"—";
    const xp=Math.max(0,num($("mcXp")?.value,0));
    const hp=Math.max(1,num($("mcHp")?.value,1));
    const stats=Object.fromEntries(ABILITIES.map(a=>[a,num($(`mc${a}`)?.value,10)]));
    const id=`creature:${activeCreatureId()}:${Date.now().toString(36)}`;
    return {
      id,
      name,
      cls:CATEGORIES[category]||"Criatura",
      level:challenge,
      challenge,
      xp,
      hp,
      hpMax:hp,
      ac:Math.max(0,num($("mcAc")?.value,10)),
      speed:Math.max(0,num($("mcSpeed")?.value,9)),
      x:280+Math.random()*90,
      y:280+Math.random()*90,
      color:"#704c48",
      master:true,
      free:true,
      creature:true,
      creatureId:activeCreatureId(),
      linked:false,
      size:$("mcSize")?.value?.trim()||"Pequeno",
      type:$("mcType")?.value?.trim()||"Criatura",
      stats,
      saveBonuses:Object.fromEntries(ABILITIES.map(a=>[a,mod(stats[a])])),
      resistances:arr($("mcRes")?.value),
      vulnerabilities:arr($("mcVul")?.value),
      immunities:arr($("mcImm")?.value),
      conditionImmunities:[],
      conditions:[],
      senses:$("mcSenses")?.value?.trim()||"",
      languages:$("mcLang")?.value?.trim()||"—",
      attacks:clone(json("mcAttacks")),
      spells:[],
      traits:clone(json("mcTraits")),
      combatDataReady:true,
      ipm:true
    }
  }

  function addLog(token){
    const log=$("rollLog");if(!log)return;
    const e=document.createElement("div");e.className="log-entry";e.textContent=`👑 ${token.name} foi adicionado à Mesa a partir do Codex IPM.`;log.prepend(e)
  }

  function closeModal(){const modal=$("microCreatureModal");if(modal)modal.hidden=true}

  document.addEventListener("click",e=>{
    const btn=e.target?.closest?.("#mcAdd");if(!btn)return;
    // Impede o listener original do Codex e qualquer runtime legado de também criar o token.
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if(creating)return;
    creating=true;btn.disabled=true;
    try{
      const token=buildToken();
      players.push(token);
      api.renderPlayers();
      api.renderTokens();
      api.selectToken(token.id);
      closeModal();
      addLog(token);
      globalThis.MICROCOSMOS_CREATURE_ND_LABEL_API?.refresh?.();
    }catch(err){
      console.error("MICROCOSMOS: falha na criação segura do token",err);
      alert("Não foi possível criar o token desta criatura. A Mesa foi preservada; tente novamente após atualizar a página.")
    }finally{
      creating=false;
      if(btn.isConnected)btn.disabled=false
    }
  },true);

  globalThis.MICROCOSMOS_CREATURE_SAFE_CREATE_API={buildToken};
})();