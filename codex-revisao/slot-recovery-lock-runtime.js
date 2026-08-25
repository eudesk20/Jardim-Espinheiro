/* MICROCOSMOS — Slots Mágicos são recurso de combate, não contador editável.
   O jogador consome Slots ao conjurar; recuperação acontece somente por DC/DL
   controlado pelo Mestre na Mesa. */
(function(){
  if(globalThis.MICROCOSMOS_SLOT_RECOVERY_LOCK)return;
  globalThis.MICROCOSMOS_SLOT_RECOVERY_LOCK=true;
  const $=id=>document.getElementById(id);

  function notify(){
    try{if(typeof showPopup==="function"){showPopup("🔒 Slots Mágicos","A recuperação de Slots é feita pelo Mestre através de Descanso Curto (DC) ou Descanso Longo (DL).");return}}catch(_e){}
    const old=$("microSlotLockToast");if(old)old.remove();const d=document.createElement("div");d.id="microSlotLockToast";d.textContent="🔒 Slots Mágicos só são recuperados por DC/DL autorizado pelo Mestre.";d.style.cssText="position:fixed;left:10px;right:10px;bottom:12px;z-index:140000;background:#193023;color:#fff8e7;border:2px solid #b58a3d;border-radius:12px;padding:10px;text-align:center;box-shadow:0 8px 24px #0008";document.body.appendChild(d);setTimeout(()=>d.remove(),2800)
  }

  function lockFunction(){
    try{globalThis.toggleSlot=function(){notify();return false};globalThis.toggleSlot.__microLocked=true}catch(_e){}
  }
  function lockDots(){
    const box=$("p3Slots");if(!box)return;
    box.querySelectorAll("button.dot").forEach(b=>{b.onclick=null;b.removeAttribute("onclick");b.disabled=true;b.setAttribute("aria-disabled","true");b.title="Recuperação somente por DC/DL autorizado pelo Mestre"});
    let note=$("microSlotRecoveryNotice");if(!note){note=document.createElement("div");note.id="microSlotRecoveryNotice";note.style.cssText="margin-top:7px;padding:7px 9px;border-left:4px solid #72538d;background:#f1e8f4;border-radius:0 8px 8px 0;font-size:.75rem;color:#5a4665";note.innerHTML="🔒 <b>Recuperação controlada:</b> os pontos acima são apenas indicadores. Slots são gastos ao conjurar e só retornam por <b>DC/DL autorizado pelo Mestre</b>.";box.insertAdjacentElement("afterend",note)}
  }
  function apply(){lockFunction();lockDots()}
  setTimeout(apply,50);setTimeout(apply,500);setTimeout(apply,1500);
  const obs=new MutationObserver(()=>{clearTimeout(obs._t);obs._t=setTimeout(apply,40)});obs.observe(document.body,{childList:true,subtree:true});
  document.addEventListener("microcosmos:character-realtime",()=>setTimeout(apply,50));
  globalThis.MICROCOSMOS_SLOT_RECOVERY={apply,notify};
})();
