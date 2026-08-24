/* MICROCOSMOS — correção de seleção de alvo na Mesa.
   Em modo de alvo, usa Pointer Events para unificar mouse, caneta e toque.
   Impede drag/pan de roubar a seleção e dispara o click que o runtime de magia
   já sabe resolver. */
(function(){
  if(globalThis.MICROCOSMOS_MESA_TARGET_POINTER_FIX)return;
  globalThis.MICROCOSMOS_MESA_TARGET_POINTER_FIX=true;

  const tokenLayer=document.getElementById("tokenLayer");
  if(!tokenLayer)return;

  let armed=null;
  let synthetic=false;
  function targeting(){return document.body.classList.contains("micro-target-mode")}
  function tokenFromEvent(e){return e.target?.closest?.("[data-token]")||null}

  function block(e){
    if(!targeting())return false;
    const token=tokenFromEvent(e);if(!token)return false;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return token
  }

  tokenLayer.addEventListener("pointerdown",e=>{
    const token=block(e);if(!token)return;
    armed={id:token.dataset.token,pointerId:e.pointerId,token};
    try{token.setPointerCapture?.(e.pointerId)}catch(_e){}
  },true);

  tokenLayer.addEventListener("pointermove",e=>{
    if(!targeting()||!armed||armed.pointerId!==e.pointerId)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  },true);

  tokenLayer.addEventListener("pointerup",e=>{
    if(!targeting()||!armed||armed.pointerId!==e.pointerId)return;
    const current=tokenFromEvent(e)||armed.token;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const same=current?.dataset?.token===armed.id;
    const target=armed.token;armed=null;
    if(!same||!target)return;
    // O runtime de magia já possui o resolvedor fechado no seu escopo. Em vez
    // de duplicar essa regra, enviamos um click sintético ao mesmo token.
    synthetic=true;
    target.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}));
    synthetic=false;
  },true);

  tokenLayer.addEventListener("pointercancel",()=>{armed=null},true);

  // Enquanto o alvo está sendo escolhido, evita gestos de arrastar/selecionar.
  const style=document.createElement("style");
  style.id="microTargetPointerFixStyles";
  style.textContent=`body.micro-target-mode #tokenLayer,body.micro-target-mode #tokenLayer [data-token]{touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}body.micro-target-mode #tokenLayer [data-token]{cursor:crosshair!important}`;
  document.head.appendChild(style);

  // Alguns navegadores ainda geram um click nativo após pointerup. O primeiro
  // click sintético já resolve o alvo e remove micro-target-mode; este guarda
  // apenas a janela em que o sintético é criado.
  tokenLayer.addEventListener("click",e=>{
    if(synthetic)return;
    if(!targeting())return;
    // Deixa o click real seguir para o runtime existente quando ele existir.
  },true);
})();
