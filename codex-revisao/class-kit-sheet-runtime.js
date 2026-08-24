/* MICROCOSMOS — Kits A/B/C integrados à ficha.
   Concede Foco/Bolsa pela escolha do Kit e faz o Grimório reconhecer o item real. */
(function(){
  if(globalThis.MICROCOSMOS_CLASS_KIT_SHEET_RUNTIME)return;
  globalThis.MICROCOSMOS_CLASS_KIT_SHEET_RUNTIME=true;

  const MAGIC_ITEMS=globalThis.CLASS_STARTING_KIT_MAGIC||{};
  const ACCEPTED=globalThis.CLASS_FOCUS_ACCEPTED_ITEMS||{};
  const kitLetters=["A","B","C"];

  function currentClassKey(){
    const select=document.getElementById("p1ClassSelect");
    const domValue=select?.value||"";
    if(domValue&&globalThis.MICROCOSMO_DATA?.classes?.[domValue])return domValue;
    return state.cls||"";
  }
  function itemById(id){return (globalThis.CODEX_ITEM_DATA||[]).find(item=>item.id===id)}
  function bagCodexId(id){return `misc:${id}`}
  function currentKitList(){return globalThis.CLASS_STARTING_KITS?.[currentClassKey()]||[]}
  function currentAcceptedIds(){return ACCEPTED[currentClassKey()]||[]}
  function hasMagicAccess(){
    const cls=currentClassKey();
    if(!CLASS_DATA[cls]?.caster)return false;
    const accepted=new Set(currentAcceptedIds().map(bagCodexId));
    return (state.bag||[]).some(item=>accepted.has(item.codexId)&&(+item.qty||0)>0)
      ||(state.cart||[]).some(item=>accepted.has(item.codexId)&&(+item.qty||0)>0);
  }
  function syncMagicAccess(saveNow=false){
    state.magic=state.magic||{};
    const next=hasMagicAccess();
    if(state.magic.componentPouch!==next){state.magic.componentPouch=next;if(saveNow)save()}
    const check=document.getElementById("p3ComponentPouch");
    if(check){check.checked=next;check.disabled=true;check.title="Definido automaticamente pelos itens carregados na Mochila/Carrinho."}
    const status=document.getElementById("microMagicFocusStatus");
    if(status){
      const names=currentAcceptedIds().map(itemById).filter(Boolean).map(x=>x.name);
      status.innerHTML=next
        ?`✅ <b>Foco/Componentes disponíveis.</b> O Grimório encontrou um item válido no inventário.`
        :`⚠️ <b>Sem Foco/Bolsa válido no inventário.</b>${names.length?` Itens aceitos para esta Classe: ${names.join(" ou ")}.`:""}`;
      status.classList.toggle("ok",next);
    }
    return next;
  }

  function removePreviousGrant(){
    const previous=Array.isArray(state.startingKitMagicGrant)?state.startingKitMagicGrant:[];
    for(const id of previous){
      const codexId=bagCodexId(id);
      const row=(state.bag||[]).find(x=>x.codexId===codexId);
      if(!row)continue;
      row.qty=Math.max(0,(+row.qty||0)-1);
      if(row.qty<=0)state.bag=state.bag.filter(x=>x!==row);
    }
    state.startingKitMagicGrant=[];
  }

  function addMagicGrant(id){
    const official=itemById(id);if(!official)return;
    const codexId=bagCodexId(id);
    let row=(state.bag||[]).find(x=>x.codexId===codexId);
    if(row)row.qty=(+row.qty||0)+1;
    else (state.bag||(state.bag=[])).push({name:official.name,qty:1,weight:official.weight,codexId});
  }

  function selectStartingKit(letter){
    const cls=currentClassKey(),kits=globalThis.CLASS_STARTING_KITS?.[cls]||[];
    if(!cls||!kitLetters.includes(letter)||!kits[kitLetters.indexOf(letter)])return;
    if(state.cls!==cls){state.cls=cls;state.saves=[...(CLASS_SAVES[cls]||[])];state.weaponProficiencies=[...(CLASS_WEAPON_PROFICIENCIES[cls]||[])];state.armorProficiencies=[...(CLASS_ARMOR_PROFICIENCIES[cls]||[])]}
    if(state.startingKit&&state.startingKitClass===cls&&state.startingKit!==letter){
      if(!confirm(`Trocar o Kit Inicial ${state.startingKit} pelo Kit ${letter}?\n\nO Foco/Bolsa concedido automaticamente pelo Kit anterior será substituído.`))return;
    }
    removePreviousGrant();
    state.startingKit=letter;
    state.startingKitClass=cls;
    const grants=[...(MAGIC_ITEMS[cls]?.[letter]||[])];
    grants.forEach(addMagicGrant);
    state.startingKitMagicGrant=grants;
    syncMagicAccess(false);
    save();
    if(typeof renderInventory==="function")renderInventory();
    if(typeof renderMagicAvailable==="function")renderMagicAvailable();
    renderKitPanel();
    if(typeof showPopup==="function"){
      const text=kits[kitLetters.indexOf(letter)]||"";
      const magic=grants.map(itemById).filter(Boolean).map(x=>x.name).join(" + ");
      showPopup("🎒 Kit Inicial escolhido",`Kit ${letter}`,`${text}${magic?`<br><br>✨ <b>Conjuração:</b> ${magic} foi adicionado à Mochila e já é reconhecido pelo Grimório.`:""}`)
    }
  }
  globalThis.selectStartingKit=selectStartingKit;

  function ensureStyles(){
    if(document.getElementById("microStartingKitStyles"))return;
    const style=document.createElement("style");
    style.id="microStartingKitStyles";
    style.textContent=`
      #microStartingKitPanel{margin:10px 0 0;padding:10px 12px;background:rgba(255,250,240,.88);border:2px solid #8e7755;border-radius:17px;position:relative;z-index:2}
      #microStartingKitPanel .micro-kit-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:7px}
      #microStartingKitPanel .micro-kit-title{font-weight:bold;color:#4e3b28;font-variant:small-caps;font-size:1rem}
      #microStartingKitContent{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
      .micro-kit-intro{grid-column:1/-1;font-size:.76rem;color:#6d5a43}
      .micro-kit-choice{width:100%;min-height:82px;text-align:left;border:1px solid #9b8058;border-radius:10px;background:#fffaf0;padding:8px;color:#372b20;box-shadow:0 2px 5px #0001}
      .micro-kit-choice:hover,.micro-kit-choice:focus-visible{border-color:#547558;outline:none;box-shadow:0 0 0 2px #54755833}
      .micro-kit-choice.active{background:#dfead8;border:2px solid #477344}
      .micro-kit-choice b{display:block;color:#405d3e;margin-bottom:3px;font-size:.9rem}
      .micro-kit-choice small{display:block;line-height:1.3;color:#6e5e4b;font-size:.72rem}
      .micro-kit-magic{display:inline-block;margin-top:5px;padding:2px 6px;border-radius:999px;background:#eee2f5;color:#593b70;font-size:.66rem;font-weight:bold}
      .micro-focus-status{grid-column:1/-1;margin-top:1px;padding:6px 8px;border-left:4px solid #a36f17;background:#fff0cf;border-radius:0 8px 8px 0;font-size:.7rem}
      .micro-focus-status.ok{border-left-color:#477344;background:#e4f0df}
      @media(max-width:700px){#microStartingKitContent{grid-template-columns:1fr}.micro-kit-choice{min-height:0}.micro-kit-intro,.micro-focus-status{grid-column:1}}
    `;
    document.head.appendChild(style)
  }

  function ensurePanel(){
    ensureStyles();
    let panel=document.getElementById("microStartingKitPanel");
    if(!panel){
      panel=document.createElement("div");
      panel.id="microStartingKitPanel";
      panel.innerHTML='<div class="micro-kit-head"><span class="micro-kit-title">🎒 Kit Inicial da Classe</span><small>Escolha A, B ou C</small></div><div id="microStartingKitContent"></div>';
    }
    // Local solicitado: logo abaixo da Identidade e antes de Atributos/Combate.
    const page=document.getElementById("p1Page");
    const topInfo=page?.querySelector(".topinfo");
    const mainGrid=page?.querySelector(".main-grid");
    if(mainGrid&&panel.parentElement!==mainGrid.parentElement)mainGrid.parentElement.insertBefore(panel,mainGrid);
    else if(mainGrid&&panel.nextElementSibling!==mainGrid)mainGrid.parentElement.insertBefore(panel,mainGrid);
    else if(topInfo&&!panel.isConnected)topInfo.after(panel);
    return panel
  }

  function renderKitPanel(){
    ensurePanel();
    const box=document.getElementById("microStartingKitContent");if(!box)return;
    const cls=currentClassKey(),kits=globalThis.CLASS_STARTING_KITS?.[cls]||[];
    if(!cls||!kits.length){box.innerHTML='<div class="micro-kit-intro">Escolha uma Classe para ver os Kits A, B e C.</div>';return}
    if(state.startingKitClass&&state.startingKitClass!==cls){
      removePreviousGrant();state.startingKit="";state.startingKitClass=cls;state.startingKitMagicGrant=[];
    }
    box.innerHTML=`<div class="micro-kit-intro"><b>${CLASS_DATA[cls]?.name||cls}</b> — toque em um Kit para selecioná-lo.</div>`+kits.map((text,i)=>{
      const letter=kitLetters[i],grants=MAGIC_ITEMS[cls]?.[letter]||[],magic=grants.map(itemById).filter(Boolean).map(x=>x.name).join(" + ");
      return `<button type="button" class="micro-kit-choice ${state.startingKit===letter&&state.startingKitClass===cls?"active":""}" onclick="selectStartingKit('${letter}')"><b>${state.startingKit===letter&&state.startingKitClass===cls?"✓ ":""}Kit ${letter}</b><small>${text}</small>${magic?`<span class="micro-kit-magic">✨ ${magic}</span>`:""}</button>`
    }).join("")+`<div id="microMagicFocusStatus" class="micro-focus-status"></div>`;
    syncMagicAccess(false);
  }
  globalThis.renderStartingKitPanel=renderKitPanel;

  function patchGrimoireUi(){
    let check=document.getElementById("p3ComponentPouch");if(!check)return;
    check.disabled=true;
    const label=check.closest("label");
    if(label&&!label.dataset.microPatched){
      label.dataset.microPatched="1";
      label.innerHTML='<input id="p3ComponentPouch" type="checkbox" style="width:auto" disabled> Detectado automaticamente pelo inventário';
      check=document.getElementById("p3ComponentPouch")
    }
    const card=label?.closest(".component-card");
    if(card&&!card.querySelector(".micro-grimoire-auto-note")){
      const note=document.createElement("div");note.className="hint micro-grimoire-auto-note";note.style.marginTop="8px";note.innerHTML="🎒 O Foco de Conjuração ou a Bolsa de Componentes vem do <b>Kit Inicial</b> ou de um item real adicionado à Mochila/Carrinho. Não é uma marcação manual.";card.appendChild(note)
    }
    syncMagicAccess(false)
  }

  if(typeof renderInventory==="function"){
    const originalRenderInventory=renderInventory;
    renderInventory=function(){const result=originalRenderInventory.apply(this,arguments);syncMagicAccess(false);return result}
  }
  if(typeof renderAll==="function"){
    const originalRenderAll=renderAll;
    renderAll=function(){const result=originalRenderAll.apply(this,arguments);renderKitPanel();patchGrimoireUi();syncMagicAccess(false);return result}
  }

  const classSelect=document.getElementById("p1ClassSelect");
  const refreshAfterClassChange=()=>{
    [0,60,220].forEach(ms=>setTimeout(()=>{renderKitPanel();syncMagicAccess(ms===220)},ms))
  };
  classSelect?.addEventListener("change",refreshAfterClassChange);
  classSelect?.addEventListener("input",refreshAfterClassChange);
  window.addEventListener("pageshow",()=>setTimeout(renderKitPanel,0));
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)renderKitPanel()});

  ensurePanel();renderKitPanel();patchGrimoireUi();syncMagicAccess(true);
})();
