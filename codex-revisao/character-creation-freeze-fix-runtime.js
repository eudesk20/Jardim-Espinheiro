/* MICROCOSMOS — Hotfix do Assistente de Criação v1
   Impede o MutationObserver do Assistente de entrar em ciclo ao reescrever
   o próprio banner com exatamente o mesmo conteúdo. */
(function(){
  if(globalThis.MICROCOSMOS_CHARACTER_CREATION_FREEZE_FIX)return;
  globalThis.MICROCOSMOS_CHARACTER_CREATION_FREEZE_FIX=true;

  const descriptor=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");
  if(!descriptor?.get||!descriptor?.set)return;

  function patchBanner(){
    const banner=document.getElementById("microCreationBanner");
    if(!banner||banner.dataset.microFreezeFix==="1")return false;
    banner.dataset.microFreezeFix="1";
    Object.defineProperty(banner,"innerHTML",{
      configurable:true,
      enumerable:false,
      get(){return descriptor.get.call(this)},
      set(value){
        const next=String(value??"");
        if(descriptor.get.call(this)===next)return;
        descriptor.set.call(this,next)
      }
    });
    return true
  }

  patchBanner();
  let attempts=0;
  const timer=setInterval(()=>{
    patchBanner();
    if(++attempts>=40)clearInterval(timer)
  },250);

  window.addEventListener("pageshow",patchBanner);
  globalThis.MICROCOSMOS_CHARACTER_CREATION_FREEZE_FIX_API={patch:patchBanner};
})();
