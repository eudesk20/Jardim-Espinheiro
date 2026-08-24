/* MICROCOSMOS — Kits A/B/C integrados à ficha.
   Concede Foco/Bolsa pela escolha do Kit e faz o Grimório reconhecer o item real. */
(function(){
  if(globalThis.MICROCOSMOS_CLASS_KIT_SHEET_RUNTIME)return;
  globalThis.MICROCOSMOS_CLASS_KIT_SHEET_RUNTIME=true;

  const MAGIC_ITEMS=globalThis.CLASS_STARTING_KIT_MAGIC||{};
  const ACCEPTED=globalThis.CLASS_FOCUS_ACCEPTED_ITEMS||{};
  const kitLetters=["A","B","C"];

  function itemById(id){return (globalThis.CODEX_ITEM_DATA||[]).find(item=>item.id===id)}
  function bagCodexId(id){return `misc:${id}`}
  function currentKitList(){return globalThis.CLASS_STARTING_KITS?.[state.cls]||[]}
  function currentAcceptedIds(){return ACCEPTED[state.cls]||[]}
  function hasMagicAccess(){
    if(!CLASS_DATA[state.cls]?.caster)return false;
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
    if(!kitLetters.includes(letter)||!currentKitList()[kitLetters.indexOf(letter)])return;
    if(state.startingKit&&state.startingKit!==letter){
      if(!confirm(`Trocar o Kit Inicial ${state.startingKit} pelo Kit ${letter}?\n\nO Foco/Bolsa concedido automaticamente pelo Kit anterior será substituído.`))return;
    }
    removePreviousGrant();
    state.startingKit=letter;
    state.startingKitClass=state.cls;
    const grants=[...(MAGIC_ITEMS[state.cls]?.[letter]||[])];
    grants.forEach(addMagicGrant);
    state.startingKitMagicGrant=grants;
    syncMagicAccess(false);
    save();
    if(typeof renderInventory==="function")renderInventory();
    if(typeof renderMagicAvailable==="function")renderMagicAvailable();
    renderKitPanel();
    if(typeof showPopup==="function"){
      const text=currentKitList()[kitLetters.indexOf(letter)]||"";
      const magic=grants.map(itemById).filter(Boolean).map(x=>x.name).join(" + ");
      showPopup("🎒 Kit Inicial escolhido",`Kit ${letter}`,`${text}${magic?`<br><br>✨ <b>Conjuração:</b> ${magic} foi adicionado à Mochila e já é reconhecido pelo Grimório.`:""}`)
    }
  }
  globalThis.selectStartingKit=selectStartingKit;

  function ensurePanel(){
    if(document.getElementById("microStartingKitPanel"))return;
    const profPanel=document.querySelector(".bottom-grid .panel.profs");
    if(!profPanel)return;
    const panel=document.createElement("div");
    panel.id="microStartingKitPanel";
    panel.className="panel";
    panel.style.marginTop="10px";
    panel.innerHTML='<div class="ribbon">🎒 Kit Inicial da Classe</div><div id="microStartingKitContent"></div>';
    profPanel.after(panel);
    const style=document.createElement("style");
    style.id="microStartingKitStyles";
    style.textContent=`#microStartingKitContent{display:grid;gap:7px}.micro-kit-choice{width:100%;text-align:left;border:1px solid #9b8058;border-radius:10px;background:#fffaf0;padding:9px;color:#372b20}.micro-kit-choice.active{background:#dfead8;border:2px solid #477344}.micro-kit-choice b{display:block;color:#4b5f3b;margin-bottom:3px}.micro-kit-choice small{display:block;line-height:1.4;color:#6e5e4b}.micro-kit-magic{display:inline-block;margin-top:5px;padding:3px 7px;border-radius:999px;background:#eee2f5;color:#593b70;font-size:.72rem;font-weight:bold}.micro-focus-status{margin-top:9px;padding:8px;border-left:4px solid #a36f17;background:#fff0cf;border-radius:0 8px 8px 0;font-size:.76rem}.micro-focus-status.ok{border-left-color:#477344;background:#e4f0df}`;
    document.head.appendChild(style);
  }

  function renderKitPanel(){
    ensurePanel();
    const box=document.getElementById("microStartingKitContent");if(!box)return;
    const kits=currentKitList();
    if(!state.cls||!kits.length){box.innerHTML='<div class="eq-note">Escolha uma Classe para ver os Kits A, B e C.</div>';return}
    if(state.startingKitClass&&state.startingKitClass!==state.cls){
      state.startingKit="";state.startingKitClass=state.cls;state.startingKitMagicGrant=[];
    }
    box.innerHTML=kits.map((text,i)=>{
      const letter=kitLetters[i],grants=MAGIC_ITEMS[state.cls]?.[letter]||[],magic=grants.map(itemById).filter(Boolean).map(x=>x.name).join(" + ");
      return `<button type="button" class="micro-kit-choice ${state.startingKit===letter?"active":""}" onclick="selectStartingKit('${letter}')"><b>${state.startingKit===letter?"✓ ":""}Kit ${letter}</b><small>${text}</small>${magic?`<span class="micro-kit-magic">✨ ${magic}</span>`:""}</button>`
    }).join("")+`<div id="microMagicFocusStatus" class="micro-focus-status"></div>`;
    syncMagicAccess(false);
  }

  function patchGrimoireUi(){
    const check=document.getElementById("p3ComponentPouch");if(!check)return;
    check.disabled=true;
    const label=check.closest("label");if(label)label.innerHTML='<input id="p3ComponentPouch" type="checkbox" style="width:auto" disabled> Detectado automaticamente pelo inventário';
    const card=label?.closest(".component-card");
    if(card&&!card.querySelector(".micro-grimoire-auto-note")){
      const note=document.createElement("div");note.className="hint micro-grimoire-auto-note";note.style.marginTop="8px";note.innerHTML="🎒 O Foco de Conjuração ou a Bolsa de Componentes agora vem do <b>Kit Inicial</b> ou de um item real adicionado à Mochila/Carrinho. Não é mais uma marcação manual.";card.appendChild(note)
    }
    syncMagicAccess(false)
  }

  // Qualquer alteração no inventário atualiza a disponibilidade de componentes.
  if(typeof renderInventory==="function"){
    const originalRenderInventory=renderInventory;
    renderInventory=function(){const result=originalRenderInventory.apply(this,arguments);syncMagicAccess(false);return result}
  }
  if(typeof renderAll==="function"){
    const originalRenderAll=renderAll;
    renderAll=function(){const result=originalRenderAll.apply(this,arguments);renderKitPanel();patchGrimoireUi();syncMagicAccess(false);return result}
  }

  const classSelect=document.getElementById("p1ClassSelect");
  classSelect?.addEventListener("change",()=>setTimeout(()=>{renderKitPanel();syncMagicAccess(true)},0));
  ensurePanel();renderKitPanel();patchGrimoireUi();syncMagicAccess(true);
})();
