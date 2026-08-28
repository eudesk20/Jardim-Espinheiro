/* MICROCOSMOS — Mestre: Ficha/Log no menu de contexto do Token.
   Mantém as ações administrativas juntas de Ocultar/Revelar. */
(function(){
  if(globalThis.MICROCOSMOS_MESA_MASTER_CHARACTER_CONTEXT)return;
  globalThis.MICROCOSMOS_MESA_MASTER_CHARACTER_CONTEXT=true;

  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  if(!Array.isArray(players))return;

  function isMaster(){
    return document.documentElement.dataset.microcosmosRole==="master"
      ||document.documentElement.dataset.mesaRole==="master"
      ||document.body.classList.contains("micro-online-master")
      ||document.body.classList.contains("micro-mesa-master")
  }
  function audit(){return globalThis.MICROCOSMOS_MESA_MASTER_CHARACTER_AUDIT_API}
  function tokenFromElement(el){
    const token=el?.closest?.("#tokenLayer [data-token]");
    return token?players.find(p=>p.id===token.dataset.token):null
  }
  function removeCardLinks(){
    document.querySelectorAll("#tokenCard .micro-master-character-links").forEach(x=>x.remove())
  }
  function augmentMenu(p){
    removeCardLinks();
    if(!isMaster()||!p?.linked||!p.characterId)return;
    const menu=document.getElementById("microTokenVisibilityMenu"),api=audit();
    if(!menu||!api?.openSheet||!api?.openLog)return;
    if(menu.dataset.characterAuditId===p.characterId)return;
    menu.dataset.characterAuditId=p.characterId;
    menu.style.width="250px";

    const divider=document.createElement("div");
    divider.style.cssText="border-top:1px dashed #a18b69;margin:7px 0";
    const sheet=document.createElement("button");
    sheet.type="button";sheet.className="btn";sheet.style.cssText="width:100%;margin-bottom:6px";sheet.textContent="📄 Ver Ficha Jogador";
    const log=document.createElement("button");
    log.type="button";log.className="btn";log.style.cssText="width:100%";log.textContent="📜 Log do Jogador";
    menu.append(divider,sheet,log);

    sheet.onclick=e=>{e.preventDefault();e.stopPropagation();menu.remove();api.openSheet(p)};
    log.onclick=e=>{e.preventDefault();e.stopPropagation();menu.remove();api.openLog(p)};
  }

  document.addEventListener("contextmenu",e=>{
    if(!isMaster())return;
    const p=tokenFromElement(e.target);if(!p)return;
    // O runtime de visibilidade cria o menu no mesmo evento; executamos depois dele.
    setTimeout(()=>augmentMenu(p),0)
  },true);

  // O runtime antigo pode tentar recolocar os botões no card ao selecionar o Token.
  // Removemos somente esses dois atalhos, sem tocar nas demais ferramentas do card.
  const card=document.getElementById("tokenCard");
  if(card)new MutationObserver(removeCardLinks).observe(card,{childList:true,subtree:true});
  document.addEventListener("click",e=>{if(e.target.closest?.("#tokenLayer [data-token]"))setTimeout(removeCardLinks,0)},true);
  removeCardLinks();

  globalThis.MICROCOSMOS_MESA_MASTER_CHARACTER_CONTEXT_API={augmentMenu,removeCardLinks};
})();
