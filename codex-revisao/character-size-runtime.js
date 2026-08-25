/* MICROCOSMOS — Tamanho de Personagem.
   A ficha passa a guardar Tamanho Base e Tamanho Atual. Raça define o padrão;
   Classe/Subclasse/Habilidade podem registrar sobrescritas sem liberar edição
   manual arbitrária. Enquanto as raças não forem revisadas, Médio é o padrão.
*/
(function(){
  if(globalThis.MICROCOSMOS_CHARACTER_SIZE_RUNTIME)return;
  globalThis.MICROCOSMOS_CHARACTER_SIZE_RUNTIME=true;

  const SIZES=["Minúsculo","Pequeno","Médio","Grande","Enorme","Colossal"];
  const RULES={
    "Minúsculo":{square:"4 por quadrado",hex:"4 por hex"},
    "Pequeno":{square:"1 quadrado",hex:"1 hex"},
    "Médio":{square:"1 quadrado",hex:"1 hex"},
    "Grande":{square:"4 quadrados (2×2)",hex:"3 hexes"},
    "Enorme":{square:"9 quadrados (3×3)",hex:"7 hexes"},
    "Colossal":{square:"16 quadrados (4×4) ou mais",hex:"12 hexes ou mais"}
  };
  const ALIASES={tiny:"Minúsculo",minusculo:"Minúsculo",minúsculo:"Minúsculo",small:"Pequeno",pequeno:"Pequeno",medium:"Médio",medio:"Médio",médio:"Médio",large:"Grande",grande:"Grande",huge:"Enorme",enorme:"Enorme",gargantuan:"Colossal",colossal:"Colossal",gigantesco:"Colossal"};
  globalThis.MICROCOSMOS_CLASS_SIZE_RULES=globalThis.MICROCOSMOS_CLASS_SIZE_RULES||{};
  globalThis.MICROCOSMOS_SUBCLASS_SIZE_RULES=globalThis.MICROCOSMOS_SUBCLASS_SIZE_RULES||{};

  function norm(v){const k=String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();return ALIASES[k]||SIZES.find(x=>x.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()===k)||"Médio"}
  function raceSize(){try{return norm(globalThis.CODEX_RACE_DATA?.[state.race]?.size||globalThis.MICROCOSMO_DATA?.races?.[state.race]?.size||"Médio")}catch{return"Médio"}}
  function resolveBase(){
    const race=raceSize(),classOverride=globalThis.MICROCOSMOS_CLASS_SIZE_RULES?.[state.cls],subOverride=globalThis.MICROCOSMOS_SUBCLASS_SIZE_RULES?.[state.cls]?.[state.subclass]||globalThis.MICROCOSMOS_SUBCLASS_SIZE_RULES?.[state.subclass];
    if(subOverride)return{size:norm(subOverride),source:`Subclasse: ${state.subclass}`};
    if(classOverride)return{size:norm(classOverride),source:`Classe: ${state.cls}`};
    return{size:race,source:state.race?"Raça":"Padrão técnico"}
  }
  function ensure(){
    state.sizeProfile=state.sizeProfile&&typeof state.sizeProfile==="object"?state.sizeProfile:{};
    const base=resolveBase();state.sizeProfile.base=base.size;state.sizeProfile.baseSource=base.source;
    if(!state.sizeProfile.current||!state.sizeProfile.temporary)state.sizeProfile.current=base.size;
    state.sizeProfile.current=norm(state.sizeProfile.current);state.size=state.sizeProfile.current;state.creatureSize=state.sizeProfile.current
  }
  function persist(){try{save()}catch(_e){try{localStorage.setItem("JE_INTEGRATED_123",JSON.stringify(state))}catch(__e){}}}
  function setTemporary(size,source="Efeito temporário"){ensure();state.sizeProfile.current=norm(size);state.sizeProfile.temporary=true;state.sizeProfile.currentSource=source;state.size=state.sizeProfile.current;state.creatureSize=state.sizeProfile.current;persist();render();return state.sizeProfile.current}
  function clearTemporary(){ensure();state.sizeProfile.temporary=false;state.sizeProfile.current=state.sizeProfile.base;state.sizeProfile.currentSource="";state.size=state.sizeProfile.current;state.creatureSize=state.sizeProfile.current;persist();render()}
  function registerClass(classKey,size){globalThis.MICROCOSMOS_CLASS_SIZE_RULES[classKey]=norm(size);sync()}
  function registerSubclass(classKey,subclass,size){globalThis.MICROCOSMOS_SUBCLASS_SIZE_RULES[classKey]=globalThis.MICROCOSMOS_SUBCLASS_SIZE_RULES[classKey]||{};globalThis.MICROCOSMOS_SUBCLASS_SIZE_RULES[classKey][subclass]=norm(size);sync()}
  function sync(){const before=state.sizeProfile?.base;ensure();if(before!==state.sizeProfile.base&&!state.sizeProfile.temporary)state.sizeProfile.current=state.sizeProfile.base;persist();render()}

  function ensureStyle(){if(document.getElementById("microCharacterSizeStyle"))return;const s=document.createElement("style");s.id="microCharacterSizeStyle";s.textContent=`#microCharacterSizeBox{margin-top:8px;padding:8px 10px;border:1px solid #9d8765;border-radius:11px;background:#fff8e7;display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:.78rem;position:relative;z-index:2}#microCharacterSizeBox b{color:#405d3e}.micro-size-temp{color:#7b4966;font-weight:bold}`;document.head.appendChild(s)}
  function ensureUi(){ensureStyle();if(document.getElementById("microCharacterSizeBox"))return true;const top=document.querySelector("#p1Page .topinfo,.topinfo");if(!top)return false;const box=document.createElement("div");box.id="microCharacterSizeBox";top.insertAdjacentElement("afterend",box);return true}
  function render(){
    ensure();if(!ensureUi())return;const box=document.getElementById("microCharacterSizeBox"),p=state.sizeProfile,r=RULES[p.current]||RULES["Médio"];
    const html=`<span>📐 <b>Tamanho Base:</b> ${p.base} <small>(${p.baseSource})</small></span><span class="${p.temporary?"micro-size-temp":""}"><b>Tamanho Atual:</b> ${p.current}${p.temporary?` • ${p.currentSource||"temporário"}`:""}</span><span><b>Grid:</b> ${r.square} • ${r.hex}</span>`;
    if(box.innerHTML!==html)box.innerHTML=html
  }

  ensure();persist();render();
  document.addEventListener("change",e=>{if(["p1Race","p1RaceSelect","p1Subrace","p1SubraceSelect","p1ClassSelect","p1Subclass","p1SubclassSelect"].includes(e.target?.id))setTimeout(sync,0)},true);
  let queued=false;const obs=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;if(!document.getElementById("microCharacterSizeBox"))render()})});obs.observe(document.body,{childList:true,subtree:true});
  globalThis.MICROCOSMOS_SIZE={SIZES,RULES,norm,resolveBase,setTemporary,clearTemporary,registerClass,registerSubclass,sync,get:()=>{ensure();return JSON.parse(JSON.stringify(state.sizeProfile))}};
})();
