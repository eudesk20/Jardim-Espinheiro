/* MICROCOSMOS — Equipamentos de Ofício v1
   Catálogo exclusivo para Cozinheiro e Engenheiro.
   Usa os sistemas normais de arma, escudo, inventário, carrinho e Codex. */
(function(){
  if(globalThis.MICROCOSMOS_OFFICIO_EQUIPMENT)return;
  globalThis.MICROCOSMOS_OFFICIO_EQUIPMENT=true;

  const EQUIPMENT={
    frigideira_combate:{name:"Frigideira de Combate",type:"arma",training:"simples",category:"corpo",die:"1d6",ability:"FOR",magic:0,rarity:"Comum",exclusiveClass:"cozinheiro",craftCategory:"Equipamento de Ofício",effect:"Contundente • utensílio de cozinha • Equipamento de Ofício exclusivo do Cozinheiro. Também serve como superfície de preparo."},
    cutelo_cozinheiro:{name:"Cutelo de Casca",type:"arma",training:"simples",category:"corpo",die:"1d6",ability:"DES",magic:0,rarity:"Comum",exclusiveClass:"cozinheiro",craftCategory:"Equipamento de Ofício",effect:"Cortante • acuidade, leve • Equipamento de Ofício exclusivo do Cozinheiro. Pode ser usado no preparo e na coleta de ingredientes."},
    chapa_cozinheiro:{name:"Chapa de Forno Reforçada",type:"escudo",armorClass:"escudo",ac:2,rarity:"Comum",exclusiveClass:"cozinheiro",craftCategory:"Equipamento de Ofício",effect:"CA +2 • Equipamento de Ofício exclusivo do Cozinheiro. Quando não está sendo usada como Escudo, funciona como chapa/superfície de preparo."},
    martelo_montagem:{name:"Martelo de Montagem",type:"arma",training:"simples",category:"corpo",die:"1d6",ability:"FOR",magic:0,rarity:"Comum",exclusiveClass:"engenheiro",craftCategory:"Equipamento de Ofício",effect:"Contundente • ferramenta de Engenharia • Equipamento de Ofício exclusivo do Engenheiro. Serve para montagem e reparos técnicos."},
    chave_sucata:{name:"Chave de Sucata",type:"arma",training:"simples",category:"corpo",die:"1d4",ability:"DES",magic:0,rarity:"Comum",exclusiveClass:"engenheiro",craftCategory:"Equipamento de Ofício",effect:"Contundente • acuidade, leve • ferramenta de Engenharia • Equipamento de Ofício exclusivo do Engenheiro."},
    lancador_mola:{name:"Lançador de Mola",type:"arma",training:"simples",category:"distancia",die:"1d8",ability:"DES",magic:0,rarity:"Comum",exclusiveClass:"engenheiro",craftCategory:"Equipamento de Ofício",effect:"Perfurante • arremesso 18/54m • duas mãos, recarga • Equipamento de Ofício exclusivo do Engenheiro; dispara pequenos projéteis impulsionados por mola."}
  };

  const ITEMS=[
    {id:"oficio-caldeirao-mochila",name:"Caldeirão-Mochila",category:"Equipamento de Ofício • Cozinheiro",weight:3,value:"12 PS",effect:"Modo Transporte: recipiente/mochila reforçada. Durante um descanso pode ser aberto como Caldeirão de Campo e conta como estação adequada para Receitas que exigem panela ou fervura.",rarity:"Comum",discovered:true,exclusiveClass:"cozinheiro",craftCategory:"Equipamento de Ofício"},
    {id:"oficio-bolsa-temperos",name:"Bolsa de Temperos do Matagal",category:"Equipamento de Ofício • Cozinheiro",weight:1,value:"6 PS",effect:"Compartimentos secos para temperos, pós e ingredientes delicados. Mantém o material culinário separado do restante da Mochila.",rarity:"Comum",discovered:true,exclusiveClass:"cozinheiro",craftCategory:"Equipamento de Ofício"},
    {id:"oficio-carrinho-cozinha",name:"Carrinho-Cozinha Improvisada",category:"Equipamento de Ofício • Cozinheiro",weight:8,value:"25 PS",effect:"Carrinho exclusivo do Cozinheiro. Capacidade 6× a carga base. Estacionado, abre suportes, chapa e bancada e funciona como Cozinha Improvisada para preparar Receitas em campo.",rarity:"Incomum",discovered:true,exclusiveClass:"cozinheiro",craftCategory:"Equipamento de Ofício",cartType:"cozinha"},
    {id:"oficio-estojo-molas",name:"Estojo de Molas e Gatilhos",category:"Equipamento de Ofício • Engenheiro",weight:1,value:"8 PS",effect:"Organiza molas, fios, travas e gatilhos usados na montagem de armadilhas e mecanismos pequenos.",rarity:"Comum",discovered:true,exclusiveClass:"engenheiro",craftCategory:"Equipamento de Ofício"},
    {id:"oficio-caixa-pecas",name:"Caixa de Peças de Sucata",category:"Equipamento de Ofício • Engenheiro",weight:3,value:"12 PS",effect:"Caixa compartimentada para engrenagens, placas, fios, parafusos e peças técnicas de Projetos.",rarity:"Comum",discovered:true,exclusiveClass:"engenheiro",craftCategory:"Equipamento de Ofício"},
    {id:"oficio-carrinho-oficina",name:"Carrinho-Oficina de Sucata",category:"Equipamento de Ofício • Engenheiro",weight:9,value:"28 PS",effect:"Carrinho exclusivo do Engenheiro. Capacidade 6× a carga base. Estacionado, abre morsa, bancada e suportes e funciona como Oficina Móvel para construção e reparo em campo.",rarity:"Incomum",discovered:true,exclusiveClass:"engenheiro",craftCategory:"Equipamento de Ofício",cartType:"oficina"}
  ];

  function installCatalog(){
    try{
      if(typeof EQUIPMENT_CATALOG!=="undefined")Object.assign(EQUIPMENT_CATALOG,EQUIPMENT)
    }catch(_e){}
    const list=globalThis.CODEX_ITEM_DATA;
    if(Array.isArray(list))for(const item of ITEMS)if(!list.some(x=>x.id===item.id))list.push({...item});
  }

  function installCartTypes(){
    try{
      if(typeof CART_TYPES!=="undefined"){
        CART_TYPES.cozinha={name:"Carrinho-Cozinha Improvisada",mult:6};
        CART_TYPES.oficina={name:"Carrinho-Oficina de Sucata",mult:6};
      }
    }catch(_e){}
    const select=document.getElementById("p1CartType");if(!select)return;
    if(!select.querySelector('option[value="cozinha"]'))select.insertAdjacentHTML("beforeend",'<option value="cozinha">Carrinho-Cozinha Improvisada — 6×</option>');
    if(!select.querySelector('option[value="oficina"]'))select.insertAdjacentHTML("beforeend",'<option value="oficina">Carrinho-Oficina de Sucata — 6×</option>');
    try{select.value=state.cartType||"none"}catch(_e){}
  }

  function installEquipmentChoices(){
    const select=document.getElementById("p1EquipmentCatalog");if(!select)return;
    select.querySelectorAll('optgroup[data-officio-equipment]').forEach(x=>x.remove());
    for(const cls of ["cozinheiro","engenheiro"]){
      const group=document.createElement("optgroup");group.dataset.officioEquipment=cls;group.label=cls==="cozinheiro"?"🍲 Equipamentos de Ofício — Cozinheiro":"⚙️ Equipamentos de Ofício — Engenheiro";
      for(const [id,item] of Object.entries(EQUIPMENT).filter(([,item])=>item.exclusiveClass===cls)){
        const option=document.createElement("option");option.value=id;option.textContent=`${item.name} — ${item.type==="arma"?`Arma • ${item.die}`:"Escudo • CA +"+item.ac}`;group.appendChild(option)
      }
      select.appendChild(group)
    }
  }

  function installCodexTags(){
    try{
      if(typeof codexEntries!=="function"||codexEntries.__microOfficioEquipment)return;
      const original=codexEntries;
      const wrapped=function(){
        const entries=original.apply(this,arguments);
        for(const entry of entries||[]){
          const data=entry?.data;if(!data?.exclusiveClass)continue;
          const className=data.exclusiveClass==="cozinheiro"?"Cozinheiro":"Engenheiro";
          entry.tags=[...new Set([...(entry.tags||[]),"Equipamento de Ofício",`Exclusivo: ${className}`])]
        }
        return entries
      };
      wrapped.__microOfficioEquipment=true;codexEntries=wrapped
    }catch(_e){}
  }

  function install(){installCatalog();installCartTypes();installEquipmentChoices();installCodexTags();try{renderEquipment?.();renderInventory?.()}catch(_e){}}
  install();
  window.addEventListener("pageshow",installCartTypes);
  globalThis.MICROCOSMOS_OFFICIO_EQUIPMENT_API={equipment:EQUIPMENT,items:ITEMS,install};
})();
