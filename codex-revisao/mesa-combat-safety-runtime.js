/* MICROCOSMOS — Blindagem do executor de combate.
   Sempre resolve o token e a magia na fonte mais recente antes de executar.
   Evita que uma representação antiga de cura seja tratada como dano e que
   magias de Círculo sejam usadas sem consumir Slot Mágico. */
(async function(){
  if(globalThis.MICROCOSMOS_MESA_COMBAT_SAFETY)return;
  globalThis.MICROCOSMOS_MESA_COMBAT_SAFETY=true;
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  if(!Array.isArray(players))return;

  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const spellLevel=s=>+(s?.lvl??s?.level??s?.circle??0)||0;
  function normalizeSpell(s){
    if(!s)return s;
    const healing=s.healing||((s.kind==="cura"||s.kind==="healing")?s.damage:"")||"";
    const damage=(s.kind==="cura"||s.kind==="healing")?"":(s.damage||"");
    s.lvl=spellLevel(s);s.level=s.lvl;s.healing=healing;s.damage=damage;
    if(healing)s.kind="cura";
    return s
  }
  function normalizeCaster(caster){for(const s of caster?.spells||[])normalizeSpell(s);return caster}

  let tries=0,executor=null;
  while(!(executor=globalThis.MICROCOSMOS_COMBAT_EXECUTOR)&&tries++<120)await wait(100);
  if(!executor?.start||executor.start.__microSafety)return;
  const originalStart=executor.start.bind(executor);

  const wrapped=async function(caster,type,index){
    const staleItem=(type==="spell"?caster?.spells:caster?.attacks)?.[index];
    const staleName=staleItem?.name||"";
    try{await globalThis.MICROCOSMOS_TABLE_COMBAT_DATA?.refresh?.()}catch(_e){}
    const fresh=players.find(p=>String(p.id)===String(caster?.id))||caster;
    normalizeCaster(fresh);
    let freshIndex=index;
    if(type==="spell"&&staleName){const byName=(fresh.spells||[]).findIndex(s=>s?.name===staleName);if(byName>=0)freshIndex=byName}
    return originalStart(fresh,type,freshIndex)
  };
  wrapped.__microSafety=true;
  executor.start=wrapped;
  globalThis.MICROCOSMOS_COMBAT_EXECUTOR=executor;
})();
