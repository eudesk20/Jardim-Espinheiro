/* MICROCOSMOS — Compatibilidade da Janela de Reação com a trava de turno.
   A Reação é a única exceção controlada ao bloqueio "não é sua vez".

   v1.1 também corrige metadados antigos de Truques já salvos na ficha. Algumas
   magias foram aprendidas antes da auditoria de combate marcar `attack:true`.
   Nesses personagens o Grimório mostra corretamente "1 Ação" e a descrição
   diz que é um ataque mágico, mas a Mesa recebe `attack:false` e não oferece
   a ✨ Magia de Oportunidade. O runtime normaliza somente Truques cuja própria
   referência/nome ou descrição os identifica explicitamente como ataque.
*/
(function(){
  if(globalThis.MICROCOSMOS_REACTION_TURN_COMPAT)return;
  globalThis.MICROCOSMOS_REACTION_TURN_COMPAT=true;

  const $=id=>document.getElementById(id);
  const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  let patchedButton=null;

  // Truques auditados no Codex que realizam jogada de ataque. A lista serve
  // apenas para recuperar fichas antigas que ainda guardam attack:false.
  const KNOWN_ATTACK_CANTRIPS=[
    "booming blade","lamina trovejante","lamina em expansao",
    "chill touch","toque necrotico",
    "eldritch blast","explosao sobrenatural",
    "fire bolt","raio de brasa",
    "green-flame blade","lamina de brasa verde",
    "primal savagery","selvageria primordial",
    "ray of frost","raio de gelo",
    "shocking grasp","toque eletrico",
    "thorn whip","chicote espinhoso"
  ];

  function isKnownAttackCantrip(spell){
    const identity=norm(`${spell?.reference||""} ${spell?.name||""} ${spell?.title||""}`);
    return KNOWN_ATTACK_CANTRIPS.some(name=>identity.includes(name))
  }
  function descriptionSaysAttack(spell){
    const raw=norm(`${spell?.text||""} ${spell?.effect||""} ${spell?.description||""}`);
    return /ataque magico|jogada de ataque|faca um ataque|realize um ataque|spell attack/.test(raw)
  }
  function normalizeSpell(spell){
    if(!spell||(+spell.lvl||+spell.level||0)!==0)return false;
    const known=isKnownAttackCantrip(spell),explicit=spell.attack===true||norm(spell.kind)==="ataque"||descriptionSaysAttack(spell);
    if(!known&&!explicit)return false;
    let changed=false;
    if(spell.attack!==true){spell.attack=true;changed=true}
    if(norm(spell.kind)!=="ataque"){spell.kind="ataque";changed=true}
    const timing=norm(`${spell.cast||""} ${spell.castingTime||""} ${spell.activation||""} ${spell.time||""} ${spell.actionType||""}`);
    // Estes Truques auditados são de 1 Ação. Só preenche quando a ficha antiga
    // perdeu o metadado; nunca sobrescreve Ação Bônus/Reação ou outro tempo real.
    if(known&&(!timing||timing==="—"||timing==="-")){spell.cast="1 Ação";changed=true}
    return changed
  }
  function normalizePlayers(){
    const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
    if(!Array.isArray(players))return 0;
    let changed=0;
    for(const p of players)for(const spell of (p?.spells||[]))if(normalizeSpell(spell))changed++;
    return changed
  }

  function patchOldReactionButton(){
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

  function selfTest(){
    const stale={name:"Chicote Espinhoso",reference:"Thorn Whip",lvl:0,cast:"1 Ação",range:"9 m",attack:false,kind:"efeito",text:"Faça um ataque mágico corpo a corpo contra uma criatura."};
    normalizeSpell(stale);
    return{ok:stale.attack===true&&stale.kind==="ataque"&&stale.cast==="1 Ação",spell:stale}
  }

  normalizePlayers();
  patchOldReactionButton();
  setInterval(()=>{normalizePlayers();patchOldReactionButton()},220);
  globalThis.MICROCOSMOS_REACTION_SPELL_COMPAT={normalizeSpell,normalizePlayers,selfTest};
})();
