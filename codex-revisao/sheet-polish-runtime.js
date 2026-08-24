/* MICROCOSMOS — acabamento da ficha.
   1) Características de Classe consultam também a fonte oficial embutida na própria ficha.
   2) Alterar CON recalcula imediatamente os PV automáticos.
   3) Central d20 e Histórico de Rolagens saem da interface da ficha.
   4) Alterações manuais de atributo ficam limitadas a 20; bônus extraordinários usam API própria.
*/
(function(){
  if(globalThis.MICROCOSMOS_SHEET_POLISH_RUNTIME)return;
  globalThis.MICROCOSMOS_SHEET_POLISH_RUNTIME=true;

  const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[.]+$/g,"").replace(/[^a-z0-9]+/g," ").trim().toLowerCase();

  // ---------- Central d20 + Histórico: removidos visualmente da ficha ----------
  function markHistoryPanel(box){
    if(box)box.classList.add("micro-roll-history-hidden")
  }
  function findHistoryPanel(anchor){
    let node=anchor;
    for(let i=0;node&&i<8;i++,node=node.parentElement){
      const text=node.textContent||"";
      const hasHistoryText=/últimos resultados de atributos|ultimos resultados de atributos|hist[oó]rico de rolagens/i.test(text);
      const hasTable=!!node.querySelector?.("table");
      const hasHeaders=/\bHora\b/.test(text)&&/\bTipo\b/.test(text)&&/\bNatural\b/.test(text)&&/\bTotal\b/.test(text)&&/Observa[cç][aã]o/i.test(text);
      const hasClear=[...node.querySelectorAll?.("button")||[]].some(b=>/^\s*Limpar\s*$/i.test(b.textContent||""));
      if(hasHistoryText&&hasTable&&(hasHeaders||hasClear))return node
    }
    return anchor.closest?.(".panel,.card,.sub,section,article")||anchor.parentElement
  }
  function hideSheetRollUi(){
    if(!document.getElementById("microHideSheetRollUi")){
      const style=document.createElement("style");
      style.id="microHideSheetRollUi";
      style.textContent='.d20-center{display:none!important}.micro-roll-history-hidden{display:none!important}';
      document.head.appendChild(style);
    }

    // Título explícito, quando existir.
    document.querySelectorAll("h1,h2,h3,h4,.ribbon,.sep-title,b,strong").forEach(el=>{
      if(/hist[oó]rico de rolagens/i.test(el.textContent||""))markHistoryPanel(findHistoryPanel(el))
    });

    // Painel atual da ficha: o título pode não existir; usamos o texto introdutório
    // e a estrutura da tabela para remover o bloco inteiro (texto + Limpar + tabela).
    document.querySelectorAll("p,small,div,span").forEach(el=>{
      const own=el.childElementCount?"":(el.textContent||"");
      if(/últimos resultados de atributos,? perícias,? salvaguardas,? ataques e magias/i.test(own)||/ultimos resultados de atributos,? pericias,? salvaguardas,? ataques e magias/i.test(normalize(own)))markHistoryPanel(findHistoryPanel(el))
    });

    // Fallback estrutural específico: qualquer painel da Página 1 que contenha a
    // tabela Hora/Tipo/Natural/Mod./Total/Observação e botão Limpar é o histórico.
    const page=document.getElementById("p1Page")||document;
    page.querySelectorAll(".panel,.card,.sub,section,article,div").forEach(box=>{
      const table=box.querySelector?.("table");if(!table)return;
      const text=box.textContent||"";
      if(!/\bHora\b/.test(text)||!/\bTipo\b/.test(text)||!/\bNatural\b/.test(text)||!/\bTotal\b/.test(text)||!/Observa[cç][aã]o/i.test(text))return;
      const clear=[...box.querySelectorAll("button")].some(b=>/^\s*Limpar\s*$/i.test(b.textContent||""));
      if(clear)markHistoryPanel(box)
    });

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

  // ---------- Atributos: jogador não passa de 20 manualmente ----------
  const originalSetStat=globalThis.setStat;
  if(typeof originalSetStat==="function"&&!originalSetStat.__microStatCapWrapped){
    const wrapped=function(k,v){
      const attr=String(k||"").toUpperCase();
      let next=Number(v);
      if(Number.isFinite(next)&&!globalThis.MICROCOSMOS_ALLOW_STAT_OVER_20)next=Math.min(20,Math.max(1,next));
      const result=originalSetStat.call(this,k,Number.isFinite(next)?next:v);
      if(attr==="CON")setTimeout(applyHpFromCon,0);
      return result
    };
    wrapped.__microStatCapWrapped=true;
    globalThis.setStat=wrapped;
  }

  // API reservada para itens/habilidades que explicitamente permitem ultrapassar 20.
  globalThis.MICROCOSMOS_SET_STAT_EXTRA=function(attr,value){
    if(typeof globalThis.setStat!=="function")return;
    globalThis.MICROCOSMOS_ALLOW_STAT_OVER_20=true;
    try{return globalThis.setStat(attr,Math.max(1,Number(value)||1))}
    finally{globalThis.MICROCOSMOS_ALLOW_STAT_OVER_20=false}
  };
  globalThis.MICROCOSMOS_ADD_STAT_EXTRA=function(attr,amount){
    const key=String(attr||"").toUpperCase();
    const current=Number(state?.stats?.[key]||10);
    return globalThis.MICROCOSMOS_SET_STAT_EXTRA(key,current+(Number(amount)||0))
  };

  // Fallback para entradas diretas que não passem por setStat.
  document.addEventListener("change",e=>{
    const input=e.target;
    if(!(input instanceof HTMLInputElement))return;
    const block=input.closest?.(".attr-block");
    if(!block)return;
    const attrText=block.querySelector?.(".attr-shield small,.attr-shield")?.textContent||"";
    if(input.type==="number"){
      const n=Number(input.value);
      if(Number.isFinite(n)&&n>20&&!globalThis.MICROCOSMOS_ALLOW_STAT_OVER_20){input.value="20";input.dispatchEvent(new Event("input",{bubbles:true}))}
    }
    if(/constitui|constituição|constituicao|\bcon\b/i.test(attrText))setTimeout(applyHpFromCon,0);
  },true);

  // ---------- Características de Classe ----------
  const previousShowFeature=globalThis.showFeature;

  function getOfficialClassHtml(){
    try{if(typeof OFFICIAL_CLASS_HTML!=="undefined")return OFFICIAL_CLASS_HTML?.[state.cls]||""}catch(e){}
    return ""
  }

  function getProgressionDescription(name){
    const wanted=normalize(name);
    try{
      if(typeof CLASS_CODEX_PROGRESSIONS!=="undefined"){
        const rows=CLASS_CODEX_PROGRESSIONS?.[state.cls]||[];
        const row=rows.find(([,title])=>{const t=normalize(title);return t===wanted||t.startsWith(wanted)||wanted.startsWith(t)});
        if(row?.[2])return `<p>${typeof esc==="function"?esc(row[2]):row[2]}</p>`
      }
    }catch(e){}
    return ""
  }

  function embeddedClassDescription(name){
    const progression=getProgressionDescription(name);if(progression)return progression;
    const source=getOfficialClassHtml();if(!source)return "";
    const doc=new DOMParser().parseFromString(`<body>${source}</body>`,"text/html"),wanted=normalize(name);
    const candidates=[...doc.querySelectorAll(".card,.sub,.didactic-feature,.ability-box,.feature,.codex-section")];
    const titleOf=el=>normalize(el.querySelector(":scope > .ribbon,:scope > h2,:scope > h3,:scope > h4,:scope > b")?.textContent||"");
    let best=candidates.find(el=>{const title=titleOf(el);return title&&(title===wanted||title.startsWith(wanted)||wanted.startsWith(title))});
    if(!best)best=candidates.find(el=>{const title=titleOf(el);return title&&title.includes(wanted)});
    if(!best)return "";
    const clone=best.cloneNode(true),heading=clone.querySelector(":scope > .ribbon,:scope > h2,:scope > h3,:scope > h4");if(heading)heading.remove();
    return clone.innerHTML.trim()
  }

  if(typeof previousShowFeature==="function"){
    globalThis.showFeature=async function(name,origin){
      try{const race=RACE_DATA?.[state.race];if(race?.featureDetails?.[name]||race?.subraceDetails?.[name])return previousShowFeature.apply(this,arguments)}catch(e){}
      const details=embeddedClassDescription(name);if(details){showPopup("📜 "+name,origin,details);return}
      return previousShowFeature.apply(this,arguments)
    };
  }

  hideSheetRollUi();
  const rollObs=new MutationObserver(()=>hideSheetRollUi());rollObs.observe(document.body,{childList:true,subtree:true});
  try{if(state?.cls&&state.hpAuto!==false)setTimeout(applyHpFromCon,0)}catch(e){}
  globalThis.MICROCOSMOS_SHEET_POLISH={hideSheetRollUi,applyHpFromCon,embeddedClassDescription,setStatExtra:globalThis.MICROCOSMOS_SET_STAT_EXTRA,addStatExtra:globalThis.MICROCOSMOS_ADD_STAT_EXTRA};
})();
