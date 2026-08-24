/* MICROCOSMOS — acabamento da ficha.
   1) Características de Classe consultam também a fonte oficial embutida na própria ficha.
   2) Alterar CON recalcula imediatamente os PV automáticos.
   3) Central d20 sai da interface da ficha; seus campos internos permanecem para compatibilidade.
*/
(function(){
  if(globalThis.MICROCOSMOS_SHEET_POLISH_RUNTIME)return;
  globalThis.MICROCOSMOS_SHEET_POLISH_RUNTIME=true;

  const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[.]+$/g,"").replace(/[^a-z0-9]+/g," ").trim().toLowerCase();

  // ---------- Central d20: removida visualmente da ficha ----------
  function hideD20(){
    if(!document.getElementById("microHideSheetD20")){
      const style=document.createElement("style");
      style.id="microHideSheetD20";
      style.textContent='.d20-center{display:none!important}';
      document.head.appendChild(style);
    }
    try{if(state?.roll){state.roll.mode="normal";save()}}catch(e){}
  }

  // ---------- PV: CON participa imediatamente ----------
  function applyHpFromCon(){
    try{
      state.hpAuto=true;
      if(globalThis.MICROCOSMOS_HP_AUTO?.apply)globalThis.MICROCOSMOS_HP_AUTO.apply(true);
      if(typeof renderCombat==="function")renderCombat();
      if(typeof save==="function")save();
    }catch(e){console.warn("MICROCOSMOS: não foi possível recalcular PV após CON",e)}
  }

  const originalSetStat=globalThis.setStat;
  if(typeof originalSetStat==="function"&&!originalSetStat.__microHpWrapped){
    const wrapped=function(k,v){
      const result=originalSetStat.apply(this,arguments);
      if(String(k).toUpperCase()==="CON")setTimeout(applyHpFromCon,0);
      return result
    };
    wrapped.__microHpWrapped=true;
    globalThis.setStat=wrapped;
  }

  // Fallback para fichas em que setStat não esteja exposta em window.
  document.addEventListener("change",e=>{
    const input=e.target;
    if(!(input instanceof HTMLInputElement))return;
    const block=input.closest?.(".attr-block");
    const name=block?.querySelector?.(".attr-shield small,.attr-shield")?.textContent||"";
    if(/constitui|constituição|constituicao|\bcon\b/i.test(name))setTimeout(applyHpFromCon,0);
  },true);

  // ---------- Características de Classe ----------
  const previousShowFeature=globalThis.showFeature;

  function getOfficialClassHtml(){
    try{
      if(typeof OFFICIAL_CLASS_HTML!=="undefined")return OFFICIAL_CLASS_HTML?.[state.cls]||"";
    }catch(e){}
    return ""
  }

  function getProgressionDescription(name){
    const wanted=normalize(name);
    try{
      if(typeof CLASS_CODEX_PROGRESSIONS!=="undefined"){
        const rows=CLASS_CODEX_PROGRESSIONS?.[state.cls]||[];
        const row=rows.find(([,title])=>{
          const t=normalize(title);
          return t===wanted||t.startsWith(wanted)||wanted.startsWith(t)
        });
        if(row?.[2])return `<p>${typeof esc==="function"?esc(row[2]):row[2]}</p>`;
      }
    }catch(e){}
    return ""
  }

  function embeddedClassDescription(name){
    const progression=getProgressionDescription(name);
    if(progression)return progression;
    const source=getOfficialClassHtml();
    if(!source)return "";
    const doc=new DOMParser().parseFromString(`<body>${source}</body>`,"text/html"),wanted=normalize(name);
    const candidates=[...doc.querySelectorAll(".card,.sub,.didactic-feature,.ability-box,.feature,.codex-section")];
    const titleOf=el=>{
      const exact=el.querySelector(":scope > .ribbon,:scope > h2,:scope > h3,:scope > h4,:scope > b");
      return normalize(exact?.textContent||"")
    };
    let best=candidates.find(el=>{
      const title=titleOf(el);
      return title&&(title===wanted||title.startsWith(wanted)||wanted.startsWith(title))
    });
    if(!best)best=candidates.find(el=>{
      const title=titleOf(el);return title&&title.includes(wanted)
    });
    if(!best)return "";
    const clone=best.cloneNode(true);
    const heading=clone.querySelector(":scope > .ribbon,:scope > h2,:scope > h3,:scope > h4");
    if(heading)heading.remove();
    return clone.innerHTML.trim()
  }

  if(typeof previousShowFeature==="function"){
    globalThis.showFeature=async function(name,origin){
      // Raça/Sub-raça continua sob responsabilidade do resolvedor anterior.
      try{
        const race=RACE_DATA?.[state.race];
        if(race?.featureDetails?.[name]||race?.subraceDetails?.[name])return previousShowFeature.apply(this,arguments);
      }catch(e){}

      const details=embeddedClassDescription(name);
      if(details){
        showPopup("📜 "+name,origin,details);
        return
      }
      return previousShowFeature.apply(this,arguments)
    };
  }

  hideD20();
  // Corrige imediatamente fichas existentes que ainda estavam com PV automático sem CON aplicada.
  try{if(state?.cls&&state.hpAuto!==false)setTimeout(applyHpFromCon,0)}catch(e){}
  globalThis.MICROCOSMOS_SHEET_POLISH={hideD20,applyHpFromCon,embeddedClassDescription};
})();
