/* MICROCOSMOS — Kits Iniciais completos.
   Complementa class-kit-sheet-runtime: cada Kit A/B/C passa a conceder armas,
   armaduras/escudos e itens reais do Codex. Equipamentos entram em
   state.equipment; utilidades e consumíveis entram na Mochila.
   Ao trocar de Kit, remove somente o que foi concedido pelo Kit anterior. */
(function(){
  if(globalThis.MICROCOSMOS_CLASS_KIT_FULL_EQUIPMENT)return;
  globalThis.MICROCOSMOS_CLASS_KIT_FULL_EQUIPMENT=true;

  // eq = ID do EQUIPMENT_CATALOG; item = ID de CODEX_ITEM_DATA; qty opcional.
  const KITS={
    barbaro:{
      A:[{eq:"machado_mandibula"},{eq:"espinho_arremesso",qty:2},{eq:"couro_folha"},{item:"item-19",qty:2}],
      B:[{eq:"espada_agulha",qty:2},{eq:"espinho_arremesso",qty:2},{item:"item-16"},{item:"item-1"},{item:"item-19",qty:2}],
      C:[{eq:"machado_casca"},{eq:"tampinha"},{item:"item-12"},{item:"item-19",qty:3}]
    },
    bardo:{
      A:[{eq:"espinho_curto"},{item:"item-6"},{item:"item-1"},{item:"item-19",qty:2}],
      B:[{eq:"besta_graveto"},{item:"item-32"},{item:"item-33"},{item:"item-34"},{item:"item-16"},{item:"item-6"},{item:"item-19",qty:2}],
      C:[{eq:"cajado_raiz"},{item:"item-32"},{item:"item-6"},{item:"item-19",qty:3}]
    },
    bastiao:{
      A:[{eq:"tampinha"},{eq:"agulha"},{eq:"escamas_besouro"},{item:"item-22"},{item:"item-19",qty:2}],
      B:[{eq:"tampinha"},{eq:"alabarda_galho"},{item:"item-2"},{item:"item-1"},{item:"item-19",qty:2}],
      C:[{eq:"couro_batido"},{eq:"espada_agulha"},{item:"item-28"},{item:"item-11"},{item:"item-19",qty:3}]
    },
    clerigo:{
      A:[{eq:"couro_folha"},{eq:"cajado_raiz"},{item:"item-9"},{item:"item-11"},{item:"item-19",qty:3}],
      B:[{eq:"tampinha"},{eq:"cajado_raiz"},{item:"item-9"},{item:"item-6"},{item:"item-22"}],
      C:[{eq:"cajado_raiz"},{item:"item-16"},{item:"item-12"},{item:"item-9"},{item:"item-19",qty:3}]
    },
    druida:{
      A:[{eq:"cajado_raiz"},{item:"item-8"},{item:"item-12"},{eq:"couro_folha"},{item:"item-19",qty:2}],
      B:[{eq:"foice_mandibula"},{item:"item-8"},{item:"item-38",qty:2},{item:"item-40"},{item:"item-19",qty:2}],
      C:[{eq:"cajado_raiz"},{item:"item-16"},{item:"item-8"},{item:"item-19",qty:3}]
    },
    guerreiro:{
      A:[{eq:"florete_ferrão"},{eq:"tampinha"},{eq:"couro_batido"},{item:"item-22"},{item:"item-19",qty:2}],
      B:[{eq:"lanca_espinho"},{eq:"tampinha"},{eq:"peitoral_carapaca"},{item:"item-1"},{item:"item-19",qty:2}],
      C:[{eq:"arco_antena"},{eq:"espinho_curto"},{item:"item-16"},{item:"item-19",qty:2}]
    },
    monge:{
      A:[{eq:"espinho_curto",qty:2},{item:"item-1"},{item:"item-19",qty:2}],
      B:[{eq:"cajado_raiz"},{item:"item-2"},{item:"item-16"},{item:"item-43"}],
      C:[{eq:"cajado_raiz"},{item:"item-43"},{item:"item-5"},{item:"item-19",qty:3}]
    },
    paladino:{
      A:[{eq:"tampinha"},{eq:"martelo_bolota"},{eq:"peitoral_carapaca"},{item:"item-9"},{item:"item-19",qty:2}],
      B:[{eq:"lanca_espinho"},{eq:"escamas_besouro"},{item:"item-9"},{item:"item-1"},{item:"item-19",qty:2}],
      C:[{eq:"machado_casca"},{eq:"tampinha"},{item:"item-11"},{item:"item-9"},{item:"item-16"},{item:"item-19",qty:3}]
    },
    patrulheiro:{
      A:[{eq:"arco_antena"},{eq:"espinho_curto"},{item:"item-16"},{item:"item-12"},{item:"item-8"},{item:"item-19",qty:2}],
      B:[{eq:"lanca_espinho"},{eq:"peitoral_carapaca"},{item:"item-1"},{item:"item-2"},{item:"item-8"},{item:"item-19",qty:2}],
      C:[{eq:"espinho_curto"},{eq:"besta_graveto"},{item:"item-43"},{item:"item-31"},{item:"item-8"},{item:"item-19",qty:3}]
    },
    ladino:{
      A:[{eq:"espinho_curto"},{item:"item-13"},{item:"item-1"},{item:"item-16"},{item:"item-19",qty:2}],
      B:[{eq:"espada_agulha"},{item:"item-2"},{item:"item-13"},{item:"item-22"},{item:"item-19",qty:2}],
      C:[{eq:"arco_antena"},{eq:"espinho_curto"},{item:"item-16"},{item:"item-19",qty:2}]
    },
    feiticeiro:{
      A:[{eq:"cajado_raiz"},{item:"item-7"},{item:"item-16"},{item:"item-19",qty:2}],
      B:[{eq:"espinho_curto"},{item:"item-6"},{item:"item-12"},{item:"item-19",qty:2}],
      C:[{eq:"couro_folha"},{item:"item-7"},{item:"item-38",qty:2},{item:"item-39"},{item:"item-19",qty:2}]
    },
    bruxo:{
      A:[{eq:"cajado_raiz"},{item:"item-7"},{item:"item-29"},{item:"item-19",qty:2}],
      B:[{eq:"espinho_curto"},{item:"item-7"},{item:"item-16"},{item:"item-19",qty:2}],
      C:[{eq:"besta_graveto"},{item:"item-6"},{item:"item-1"},{item:"item-29"},{item:"item-19",qty:3}]
    },
    mago:{
      A:[{eq:"cajado_raiz"},{item:"item-6"},{item:"item-32"},{item:"item-19",qty:2}],
      B:[{eq:"espinho_curto"},{item:"item-7"},{item:"item-26"},{item:"item-12"},{item:"item-32"},{item:"item-19",qty:2}],
      C:[{eq:"espinho_curto"},{item:"item-7"},{item:"item-15"},{item:"item-32"},{item:"item-19",qty:2}]
    },
    cozinheiro:{
      A:[{eq:"espinho_curto"},{item:"item-14"},{item:"item-20",qty:2},{item:"item-19",qty:2}],
      B:[{eq:"espinho_curto"},{item:"item-14"},{item:"item-24"},{item:"item-20",qty:2},{item:"item-19",qty:2}],
      C:[{eq:"espinho_curto"},{item:"item-14"},{item:"item-38",qty:2},{item:"item-20",qty:3}]
    },
    engenheiro:{
      A:[{eq:"espinho_curto"},{item:"item-13"},{item:"item-1"},{item:"item-2"},{item:"item-6"},{item:"item-19",qty:2}],
      B:[{eq:"besta_graveto"},{item:"item-13"},{item:"item-26"},{item:"item-6"},{item:"item-19",qty:2}],
      C:[{eq:"espinho_curto"},{item:"item-13"},{item:"item-38",qty:2},{item:"item-7"},{item:"item-19",qty:2}]
    }
  };
  globalThis.CLASS_STARTING_KIT_FULL=KITS;

  function codexItem(id){return (globalThis.CODEX_ITEM_DATA||[]).find(x=>x.id===id)}
  function equipment(id){try{return typeof EQUIPMENT_CATALOG!=="undefined"?EQUIPMENT_CATALOG[id]:null}catch{return null}}
  function grantKey(cls,letter){return `${cls}:${letter}`}
  function previous(){return state.startingKitFullGrant||null}
  function removePrevious(){
    const old=previous();if(!old)return;
    state.equipment=(state.equipment||[]).filter(x=>x.kitGrantKey!==old.key);
    for(const row of old.items||[]){
      const bag=(state.bag||[]).find(x=>x.codexId===`misc:${row.id}`);if(!bag)continue;
      bag.qty=Math.max(0,(+bag.qty||0)-(+row.qty||1));
    }
    state.bag=(state.bag||[]).filter(x=>(+x.qty||0)>0);
    state.startingKitFullGrant=null;
  }
  function addMisc(id,qty=1){
    const item=codexItem(id);if(!item)return false;const codexId=`misc:${id}`;
    let row=(state.bag||(state.bag=[])).find(x=>x.codexId===codexId);
    if(row)row.qty=(+row.qty||0)+qty;else state.bag.push({name:item.name,qty,weight:+item.weight||0,codexId});return true
  }
  function addEquipment(id,qty,key){
    const item=equipment(id);if(!item)return false;state.equipment=Array.isArray(state.equipment)?state.equipment:[];
    for(let i=0;i<qty;i++)state.equipment.push({...item,catalogId:id,kitGrantKey:key,kitGranted:true});return true
  }
  function apply(cls,letter){
    const spec=KITS[cls]?.[letter];if(!spec)return;
    removePrevious();const key=grantKey(cls,letter),items=[];
    for(const row of spec){const qty=+row.qty||1;if(row.eq)addEquipment(row.eq,qty,key);if(row.item&&addMisc(row.item,qty))items.push({id:row.item,qty})}
    state.startingKitFullGrant={key,cls,letter,items};save();
    try{renderEquipment()}catch(e){}try{renderInventory()}catch(e){}try{renderArmorProficiencies()}catch(e){}try{renderWeaponProficiencies()}catch(e){}
  }

  const original=globalThis.selectStartingKit;
  if(typeof original==="function"){
    globalThis.selectStartingKit=function(letter){
      const beforeClass=state.startingKitClass,beforeLetter=state.startingKit;
      original.call(this,letter);
      const cls=state.startingKitClass||state.cls;
      // Se o original foi cancelado, não altera os itens completos.
      if(state.startingKit===beforeLetter&&cls===beforeClass&&previous()?.key===grantKey(cls,letter))return;
      if(state.startingKit===letter)apply(cls,letter)
    };
  }

  // Migra uma ficha que já escolheu Kit antes deste runtime existir.
  if(state.startingKit&&state.startingKitClass&&!previous())apply(state.startingKitClass,state.startingKit);
})();
