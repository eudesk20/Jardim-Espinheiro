/* MICROCOSMOS — Progressão de Magias Conhecidas.
   Base numérica: tabelas de Prepared Spells do D&D 2024, reinterpretadas no
   MICROCOSMOS como o limite de Magias Conhecidas disponíveis para conjuração.
   Slots Mágicos continuam sendo um recurso separado e limitam o número de usos.
   Magias automáticas de Raça/Subclasse/Talento/Origem não consomem este limite.

   Engenheiro: ainda PROPOSTA PARA REVISÃO, portanto não recebe limite automático
   neste arquivo até a progressão própria da Classe ser aprovada. */
(function(){
  if(globalThis.MICROCOSMOS_SPELL_KNOWN_PROGRESSION)return;
  globalThis.MICROCOSMOS_SPELL_KNOWN_PROGRESSION=true;

  const fullCommon=[4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];
  const sorcerer=[2,4,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];
  const wizard=[4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,21,22,23,24,25];
  const warlock=[2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15];
  const halfCaster=[2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15];

  const pairs=values=>values.map((count,index)=>[index+1,count]);
  globalThis.CLASS_SPELL_KNOWN_PROGRESSION={
    bardo:pairs(fullCommon),
    clerigo:pairs(fullCommon),
    druida:pairs(fullCommon),
    feiticeiro:pairs(sorcerer),
    bruxo:pairs(warlock),
    mago:pairs(wizard),
    paladino:pairs(halfCaster),
    patrulheiro:pairs(halfCaster)
  };

  globalThis.CLASS_SPELL_KNOWN_MODE={
    bardo:"conhecidas",
    clerigo:"conhecidas",
    druida:"conhecidas",
    feiticeiro:"conhecidas",
    bruxo:"pacto",
    mago:"grimorio",
    paladino:"conhecidas",
    patrulheiro:"conhecidas",
    engenheiro:"proposta"
  };

  // Metadados para a futura troca durante Descanso Longo. Ainda não desconta
  // recursos até a interface de reaprendizado ser fechada no problema 3.
  globalThis.MICROCOSMOS_SPELL_RELEARNING_RULES={
    allowedOnlyDuringLongRest:true,
    costBasedOnRemovedSpellCircle:true,
    freeSwap:false,
    requiresSpecificMaterial:true,
    proposedMaterialId:"micelio_memoria",
    status:"PROPOSTA PARA REVISÃO"
  };

  // Se o runtime de capacidade já estiver carregado, pede uma atualização.
  setTimeout(()=>{try{globalThis.MICROCOSMOS_MAGIC_CAPACITY?.render?.()}catch(e){}},0);
})();
