/* MICROCOSMOS — correção de seleção de alvo na Mesa.
   Em modo de alvo, usa Pointer Events para unificar mouse, caneta e toque.
   Impede drag/pan de roubar a seleção e dispara o click que o runtime de magia
   já sabe resolver.

   Também restringe a área clicável da seta de direção da visão à parte externa
   do token, evitando que cliques no centro iniciem rotação acidental. */
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
  style.textContent=`
    body.micro-target-mode #tokenLayer,
    body.micro-target-mode #tokenLayer [data-token]{
      touch-action:none!important;
      user-select:none!important;
      -webkit-user-select:none!important
    }
    body.micro-target-mode #tokenLayer [data-token]{cursor:crosshair!important}

    /* Direção da visão:
       - mantém o pivô da rotação no centro do token;
       - alonga a seta;
       - recorta os primeiros 28 px da área de interação.
       Assim o centro do token deixa de capturar a rotação. */
    #tokenLayer [data-token] .micro-vision-facing{
      width:72px!important;
      height:24px!important;
      clip-path:inset(0 0 0 28px)!important;
      -webkit-clip-path:inset(0 0 0 28px)!important;
      cursor:crosshair!important;
      touch-action:none!important
    }
    #tokenLayer [data-token] .micro-vision-facing:before{
      left:28px!important;
      right:4px!important;
      top:10px!important
    }
    #tokenLayer [data-token] .micro-vision-facing:after{
      right:0!important;
      top:6px!important;
      border-left-width:10px!important;
      border-top-width:6px!important;
      border-bottom-width:6px!important
    }
  `;
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
