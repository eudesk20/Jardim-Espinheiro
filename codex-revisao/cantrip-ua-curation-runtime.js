/* MICROCOSMOS — Curadoria dos Truques UA/experimentais.
   Remove do catálogo normal opções redundantes ou inadequadas ao cenário,
   preservando metadados para futura reutilização em Engenharia/Relíquias. */
(function(){
  if(globalThis.MICROCOSMOS_CANTRIP_UA_CURATION)return;
  globalThis.MICROCOSMOS_CANTRIP_UA_CURATION=true;

  const ARCHIVED={
    "Hand of Radiance (UA)":{
      reason:"Redundante com Palavra de Radiância, que já cobre a explosão radiante próxima do Clérigo.",
      destination:"Arquivado; manter Palavra de Radiância como opção principal."
    },
    "Virtue (UA)":{
      reason:"Playtest antigo de PV temporários, pouco distinto e sem necessidade no catálogo principal.",
      destination:"Arquivado; pode inspirar Talento, bênção ou efeito temporário no futuro."
    },
    "On/Off (UA)":{
      reason:"Material de magia moderna; não deve aparecer como Truque mágico universal no MICROCOSMOS.",
      destination:"Reservado para Engenharia de Sucata, Projeto ou interação descoberta com Relíquias dos Gigantes."
    }
  };
  globalThis.MICROCOSMOS_ARCHIVED_CANTRIPS=ARCHIVED;

  const refs=new Set(Object.keys(ARCHIVED));
  const data=globalThis.CODEX_SPELL_DATA;
  if(Array.isArray(data)){
    for(let i=data.length-1;i>=0;i--){
      const spell=data[i];
      if(spell?.level===0&&refs.has(spell.reference))data.splice(i,1);
    }
  }

  try{
    if(typeof GRIMOIRE_SPELL_INDEX!=="undefined"&&Array.isArray(GRIMOIRE_SPELL_INDEX)){
      for(let i=GRIMOIRE_SPELL_INDEX.length-1;i>=0;i--){
        const entry=GRIMOIRE_SPELL_INDEX[i];
        const title=String(entry?.title||"");
        if(entry?.level===0&&(/Mão de Radiância \(UA\)/i.test(title)||/Virtude \(UA\)/i.test(title)||/Ligar\/Desligar \(UA\)/i.test(title)))GRIMOIRE_SPELL_INDEX.splice(i,1);
      }
    }
  }catch(e){console.warn("MICROCOSMOS: índice de Truques UA não pôde ser curado",e)}

  // Não apaga uma magia que já exista em uma ficha salva. Se um personagem antigo
  // já a conhece, ela continua no estado local para não destruir dados do jogador.
  setTimeout(()=>{
    try{if(typeof renderMagicAll==="function")renderMagicAll()}catch(e){}
    try{if(typeof renderCodex==="function")renderCodex()}catch(e){}
  },0);
})();
