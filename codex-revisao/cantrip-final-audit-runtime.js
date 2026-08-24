/* MICROCOSMOS — Auditoria final dos Truques ativos.
   Faz acabamento de nomenclatura, elimina qualquer rodapé genérico residual
   e registra um relatório de sanidade para evitar regressões futuras. */
(function(){
  if(globalThis.MICROCOSMOS_CANTRIP_FINAL_AUDIT)return;
  globalThis.MICROCOSMOS_CANTRIP_FINAL_AUDIT=true;

  const GENERIC_LIMIT="A magia respeita cobertura, Concentração, imunidades e requisitos de alvo indicados.";
  const GENERIC_PATTERNS=[
    /produz um efeito de .* dentro do alcance indicado/i,
    /aplique o efeito aos alvos indicados/i,
    /transforma uma criatura, objeto ou parte do ambiente/i,
    /libera energia contra o alvo ou a área escolhida/i
  ];

  const TITLE_POLISH={
    "Friends":"🎵 Encanto Amistoso",
    "Encode Thoughts":"🎵 Fio de Pensamento",
    "Poison Spray":"🕸️ Jato Venenoso",
    "Control Flames":"🌀 Controlar Brasas",
    "Create Bonfire":"🕸️ Criar Fogueira",
    "Produce Flame":"🕸️ Criar Brasas",
    "Mind Sliver":"🎵 Farpinha Mental",
    "Lightning Lure":"✨ Laço de Relâmpago",
    "Sapping Sting":"🕯️ Picada Debilitante",
    "Shocking Grasp":"✨ Toque Elétrico",
    "Sword Burst":"🕸️ Explosão de Lâminas",
    "Toll the Dead":"🕯️ Sino dos Mortos"
  };

  const spells=(globalThis.CODEX_SPELL_DATA||[]).filter(s=>s&&s.level===0);
  const issues=[];

  for(const spell of spells){
    if(TITLE_POLISH[spell.reference])spell.title=TITLE_POLISH[spell.reference];
    if(spell.limitation===GENERIC_LIMIT)spell.limitation="";

    const desc=String(spell.description||"").trim();
    const effect=String(spell.effect||"").trim();
    const genericDesc=GENERIC_PATTERNS.some(rx=>rx.test(desc));
    const genericEffect=GENERIC_PATTERNS.some(rx=>rx.test(effect));

    if(!desc)issues.push({reference:spell.reference,field:"description",reason:"Descrição vazia"});
    if(!effect)issues.push({reference:spell.reference,field:"effect",reason:"Efeito vazio"});
    if(genericDesc)issues.push({reference:spell.reference,field:"description",reason:"Descrição ainda genérica"});
    if(genericEffect)issues.push({reference:spell.reference,field:"effect",reason:"Efeito ainda genérico"});
    if(spell.attack&&spell.save)issues.push({reference:spell.reference,field:"mechanics",reason:"Marcado simultaneamente como ataque e Salvaguarda; revisar"});

    spell.auditFinal=true;
  }

  // Sincroniza títulos em listas compactas.
  try{
    if(typeof GRIMOIRE_SPELL_INDEX!=="undefined"&&Array.isArray(GRIMOIRE_SPELL_INDEX)){
      const byKey=new Map(spells.map(s=>[s.key,s]));
      for(const entry of GRIMOIRE_SPELL_INDEX){
        const spell=byKey.get(entry.key);
        if(spell)entry.title=spell.title;
      }
    }
  }catch(e){}

  globalThis.MICROCOSMOS_CANTRIP_AUDIT_REPORT={
    expectedActive:46,
    active:spells.length,
    issues,
    complete:spells.length===46&&issues.length===0,
    auditedAt:"2026-08-24"
  };

  if(issues.length)console.warn("MICROCOSMOS — pendências na auditoria final de Truques",issues);
  else console.info(`MICROCOSMOS — ${spells.length} Truques ativos auditados sem pendências genéricas.`);

  setTimeout(()=>{
    try{if(typeof renderMagicAll==="function")renderMagicAll()}catch(e){}
    try{if(typeof renderCodex==="function")renderCodex()}catch(e){}
  },0);
})();
