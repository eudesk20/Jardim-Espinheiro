/* MICROCOSMOS — Corrige a ordem visual entre pop-ups da ficha e a barra de sessão.
   O pop-up de características deve sempre ficar acima do badge Mestre/Jogador. */
(function(){
  const id="microPopupLayerFix";
  if(document.getElementById(id))return;
  const style=document.createElement("style");
  style.id=id;
  style.textContent=`
    #microAuthBadge{z-index:50!important}
    .popup{z-index:120!important}
    .popup.milestone-popup{z-index:130!important}
    #microMasterPanel{z-index:99995!important}
    #microAuthOverlay{z-index:100000!important}
  `;
  document.head.appendChild(style);
})();
