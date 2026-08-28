/* MICROCOSMOS — Concessões dos Kits de Ofício v1.
   Substitui somente os Kits do Cozinheiro e do Engenheiro no motor geral. */
(function(){
  if(globalThis.MICROCOSMOS_OFFICIO_KIT_GRANTS)return;
  globalThis.MICROCOSMOS_OFFICIO_KIT_GRANTS=true;

  const GRANTS={
    cozinheiro:{
      A:[{eq:"frigideira_combate"},{eq:"chapa_cozinheiro"},{it:"oficio-caldeirao-mochila"},{it:"item-14"},{it:"item-20",q:2},{it:"item-19",q:2}],
      B:[{eq:"cutelo_cozinheiro"},{it:"oficio-bolsa-temperos"},{it:"item-14"},{it:"item-24"},{it:"item-20",q:2},{it:"item-19",q:2}],
      C:[{eq:"frigideira_combate"},{it:"oficio-caldeirao-mochila"},{it:"oficio-carrinho-cozinha"},{it:"item-14"},{it:"item-20",q:3},{it:"item-19",q:3}]
    },
    engenheiro:{
      A:[{eq:"martelo_montagem"},{it:"item-13"},{it:"oficio-estojo-molas"},{it:"item-1"},{it:"item-2"},{it:"item-19",q:2}],
      B:[{eq:"lancador_mola"},{eq:"chave_sucata"},{it:"item-13"},{it:"oficio-caixa-pecas"},{it:"item-26"},{it:"item-19",q:2}],
      C:[{eq:"martelo_montagem"},{eq:"chave_sucata"},{it:"item-13"},{it:"oficio-caixa-pecas"},{it:"oficio-carrinho-oficina"},{it:"item-19",q:2}]
    }
  };

  function applyGrantMap(){
    const full=globalThis.CLASS_STARTING_KIT_FULL;if(!full)return false;
    full.cozinheiro=GRANTS.cozinheiro;full.engenheiro=GRANTS.engenheiro;return true
  }

  function syncCartForKit(cls,letter){
    const spec=globalThis.CLASS_OFFICIO_KITS?.[cls]?.[letter];
    const previous=state.startingKitOfficioCartGrant||"";
    if(previous&&state.cartType===previous)state.cartType="none";
    const next=spec?.cartType&&spec.cartType!=="none"?spec.cartType:"";
    if(next)state.cartType=next;
    state.startingKitOfficioCartGrant=next;
    const select=document.getElementById("p1CartType");if(select)select.value=state.cartType||"none";
    try{save();renderInventory?.()}catch(_e){}
  }

  function patchSelector(){
    const fn=globalThis.selectStartingKit;if(typeof fn!=="function"||fn.__microOfficioKit)return false;
    const wrapped=function(letter){
      applyGrantMap();
      const beforeClass=state.startingKitClass||state.cls,beforeLetter=state.startingKit;
      const result=fn.apply(this,arguments);
      const cls=state.startingKitClass||state.cls;
      if(["cozinheiro","engenheiro"].includes(cls)&&state.startingKit===letter){
        syncCartForKit(cls,letter);
        // O Livro/Mochila detecta a troca de Kit e reconstrói somente o conhecimento
        // inicial concedido por ele. Conhecimentos obtidos em campanha são preservados.
        try{globalThis.MICROCOSMOS_CLASS_CRAFTING_BOOKS_API?.kitChanged?.(cls,letter,beforeClass,beforeLetter)}catch(_e){}
        try{globalThis.MICROCOSMOS_CLASS_CRAFTING_BOOKS_API?.render?.()}catch(_e){}
        const kit=globalThis.CLASS_OFFICIO_KITS?.[cls]?.[letter];
        if(typeof showPopup==="function"&&kit)showPopup(cls==="cozinheiro"?"🍲 Kit de Cozinheiro":"⚙️ Kit de Engenheiro",kit.name,`<b>${kit.style}</b><br>${kit.advantage}<br><br>📚 O Kit concede 1 conhecimento fixo e permite escolher mais 2 no Livro/Mochila de Ofício.`)
      }else if(beforeClass&&["cozinheiro","engenheiro"].includes(beforeClass)&&beforeLetter!==letter){
        syncCartForKit("","")
      }
      return result
    };
    wrapped.__microOfficioKit=true;globalThis.selectStartingKit=wrapped;return true
  }

  applyGrantMap();
  let tries=0;const timer=setInterval(()=>{applyGrantMap();if(patchSelector()||++tries>50)clearInterval(timer)},100);
  globalThis.MICROCOSMOS_OFFICIO_KIT_GRANTS_API={grants:GRANTS,applyGrantMap,syncCartForKit};
})();
