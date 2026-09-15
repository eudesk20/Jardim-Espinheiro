/* MICROCOSMOS — Truque racial automático dos Mantídeos.
   É uma concessão da Raça e não ocupa o limite de Truques da Classe. */
(()=>{
  if(globalThis.MICROCOSMOS_MANTIDEO_RACIAL_CANTRIP)return;
  globalThis.MICROCOSMOS_MANTIDEO_RACIAL_CANTRIP=true;
  const spell={
    key:"racial-mantideo-foices-retrateis",
    title:"✨ Foices Retráteis",
    reference:"racial-mantideo-foices-retrateis",
    level:0,
    kind:"completa",
    status:"oficial",
    classes:[],
    school:"Transmutação racial",
    source:"Raça: Mantídeo",
    manifestation:"✨ Manifestação corporal",
    cast:"1 Ação Bônus",
    range:"Pessoal",
    duration:"Até serem recolhidas",
    components:"S",
    area:"O próprio Mantídeo",
    materialIds:[],
    conjuration:"Um gesto curto ou impulso instintivo faz as lâminas naturais deslizarem para fora dos antebraços. Recolhê-las não exige Ação.",
    description:"Você estende ou recolhe as foices naturais alojadas junto aos antebraços sem impedir o uso das mãos.",
    effect:"Enquanto estendidas, suas mãos continuam livres e suas Garras Naturais ficam disponíveis, causando 1d6 de dano Cortante conforme o traço racial. A manifestação pode ter um brilho discreto de seiva, pólen ou energia, escolhido pelo personagem.",
    limitation:"Este Truque não concede um ataque adicional, não aumenta o dano das Garras Naturais, não aumenta o alcance e não transforma o dano em mágico por si só.",
    damage:"1d6 Cortante (Garras Naturais)",
    healing:"",
    damageType:"Cortante",
    attack:false,
    save:"",
    saveTrigger:"",
    saveFailure:"",
    saveSuccess:"",
    condition:"",
    repeatSave:"",
    higherLevels:"",
    flags:"racial,automatico,extra",
    auto:true,
    automatic:true,
    granted:true,
    grantedBy:"Raça: Mantídeo",
    provenance:"microcosmos-original",
    license:"Conteúdo original do MICROCOSMOS",
    sourceCatalog:"MICROCOSMOS"
  };
  const spells=globalThis.CODEX_SPELL_DATA||(globalThis.CODEX_SPELL_DATA=[]);
  if(!spells.some(item=>item.key===spell.key))spells.push(spell);
  const entry={key:spell.key,title:spell.title,level:0,kind:"completa",classes:[]};
  const globalIndex=globalThis.GRIMOIRE_SPELL_INDEX;
  if(Array.isArray(globalIndex)&&!globalIndex.some(item=>item.key===spell.key))globalIndex.push(entry);
  try{
    if(typeof GRIMOIRE_SPELL_INDEX!=="undefined"&&Array.isArray(GRIMOIRE_SPELL_INDEX)&&!GRIMOIRE_SPELL_INDEX.some(item=>item.key===spell.key))GRIMOIRE_SPELL_INDEX.push(entry);
  }catch(_error){}
})();
