/* MICROCOSMOS — Truque racial automático dos Mantídeos.
   É uma concessão da Raça e não ocupa o limite de Truques da Classe. */
(()=>{
  if(globalThis.MICROCOSMOS_MANTIDEO_RACIAL_CANTRIP)return;
  globalThis.MICROCOSMOS_MANTIDEO_RACIAL_CANTRIP=true;
  const visual=new URL("../assets/characters/mantideo-truque-foices-magicas-superior-ativacao-guarda-golpe-guia-v2.png",document.currentScript?.src||location.href).href;
  const spell={
    key:"racial-mantideo-foices-retrateis",
    title:"✨ Foices Mágicas Retráteis",
    reference:"racial-mantideo-foices-retrateis",
    level:0,
    kind:"completa",
    status:"oficial",
    classes:[],
    school:"Transmutação racial",
    source:"Raça: Mantídeo",
    manifestation:"✨ Projeção racial de energia",
    cast:"1 Ação Bônus",
    range:"Pessoal",
    duration:"Até serem recolhidas",
    components:"S",
    area:"O próprio Mantídeo",
    materialIds:[],
    conjuration:"Um gesto curto ou impulso instintivo forma anéis de energia nos pulsos. Deles surgem duas foices mágicas translúcidas, como folhas luminosas projetadas junto aos antebraços. Dissipá-las não exige Ação.",
    description:"Você manifesta ou dissipa foices mágicas retráteis sem substituir os braços, deformar as mãos ou impedir que elas continuem livres.",
    effect:"Enquanto manifestadas, suas mãos continuam livres e suas Garras Naturais ficam disponíveis, causando 1d6 de dano Cortante conforme o traço racial. Cor dos anéis, nervuras luminosas e partículas podem variar com a aparência do personagem.",
    limitation:"As foices são projeções raciais, não membros permanentes. Este Truque não concede ataque adicional, não aumenta o dano das Garras Naturais, não aumenta o alcance e não torna o dano mágico por si só.",
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
    sourceCatalog:"MICROCOSMOS",
    visual
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
