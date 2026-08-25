/* MICROCOSMOS — Gaveta compacta do Jogador sobre o Grid.
   Mobile-first: fechada mostra somente uma seta. Ao abrir, desce uma barra
   com Personagem da Ficha + Zoom + Snap, reutilizando os controles reais.
   Ferramentas do Mestre não são alteradas.
*/
(function(){
  if(globalThis.MICROCOSMOS_PLAYER_VIEW_DRAWER)return;
  globalThis.MICROCOSMOS_PLAYER_VIEW_DRAWER=true;

  const $=id=>document.getElementById(id);
  const viewport=$("viewport"),toolbar=document.querySelector(".toolbar"),mapShell=document.querySelector(".map-shell");
  if(!viewport||!mapShell)return;

  let open=false,queued=false;

  function isPlayer(){
    return document.documentElement.dataset.mesaRole==="player"||document.documentElement.dataset.microcosmosRole==="player"||document.body.classList.contains("micro-mesa-player")||document.body.classList.contains("micro-online-player")
  }
  function isMaster(){
    return document.documentElement.dataset.mesaRole==="master"||document.documentElement.dataset.microcosmosRole==="master"||document.body.classList.contains("micro-mesa-master")||document.body.classList.contains("micro-online-master")
  }

  function ensureCss(){
    if($("microPlayerViewDrawerStyle"))return;
    const s=document.createElement("style");
    s.id="microPlayerViewDrawerStyle";
    s.textContent=`
      .micro-player-grid-drawer{position:absolute;top:5px;left:50%;transform:translateX(-50%);z-index:760;display:flex;flex-direction:column;align-items:center;pointer-events:none;max-width:calc(100% - 12px)}
      .micro-player-grid-toggle{pointer-events:auto;width:44px;height:28px;padding:0;border:1px solid #725a38;border-radius:0 0 12px 12px;background:#efe5cc;color:#3f3225;font-weight:bold;font-size:1.15rem;line-height:1;box-shadow:0 3px 9px #0005;touch-action:manipulation}
      .micro-player-grid-controls{pointer-events:auto;display:flex;align-items:center;justify-content:center;gap:5px;max-width:min(96vw,520px);padding:6px;margin-top:3px;border:2px solid #806945;border-radius:11px;background:#efe5cc;box-shadow:0 8px 22px #0007;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;transform-origin:top center;transition:opacity .14s ease,transform .14s ease}
      .micro-player-grid-controls::-webkit-scrollbar{display:none}
      .micro-player-grid-drawer:not(.open) .micro-player-grid-controls{opacity:0;transform:translateY(-8px) scale(.97);pointer-events:none;position:absolute;top:27px;visibility:hidden}
      .micro-player-grid-controls .btn,.micro-player-grid-controls button{flex:0 0 auto;min-height:34px;padding:6px 9px!important;white-space:nowrap}
      .micro-player-grid-controls .micro-player-sheet-btn{font-size:.82rem}
      body.micro-player-grid-clean .toolbar{display:none!important}
      body.micro-player-grid-clean #microCompactTableBar{display:none!important}
      @media(max-width:720px){
        .micro-player-grid-drawer{top:2px;max-width:calc(100% - 6px)}
        .micro-player-grid-toggle{width:42px;height:25px;font-size:1rem}
        .micro-player-grid-controls{gap:4px;padding:4px;max-width:96vw;border-radius:9px}
        .micro-player-grid-controls .btn,.micro-player-grid-controls button{min-height:32px;padding:5px 7px!important;font-size:.78rem}
        .micro-player-grid-controls .micro-player-sheet-btn{max-width:115px;overflow:hidden;text-overflow:ellipsis}
      }
      @media(max-height:650px) and (pointer:coarse){
        .micro-player-grid-controls{max-width:94vw;padding:3px}
        .micro-player-grid-controls .btn,.micro-player-grid-controls button{min-height:29px;padding:4px 6px!important;font-size:.72rem}
      }
    `;
    document.head.appendChild(s)
  }

  function findToolbarButton(regex,ids=[]){
    for(const id of ids){const el=$(id);if(el)return el}
    const roots=[toolbar,$("microCompactTableBar"),mapShell].filter(Boolean);
    for(const root of roots){
      const found=[...root.querySelectorAll("button")].find(b=>regex.test((b.textContent||"").trim()));
      if(found)return found
    }
    return null
  }
  function zoomOut(){return findToolbarButton(/^[-−–]$/, ["zoomOut","zoomMinus"])}
  function zoomIn(){return findToolbarButton(/^\+$/, ["zoomIn","zoomPlus"])}
  function zoomValue(){
    for(const id of ["zoomLabel","zoomPct","zoomValue","zoomPercent"]){const el=$(id);if(el)return el}
    const roots=[toolbar,mapShell].filter(Boolean);
    for(const root of roots){
      const el=[...root.querySelectorAll("button,span,b")].find(x=>/^\s*\d{1,3}%\s*$/.test(x.textContent||""));
      if(el)return el
    }
    return null
  }
  function snap(){return $("toggleSnap")||findToolbarButton(/Snap\s*:/i)}
  function sheetButton(){return $("microAddCharacterSide")||$("addToken")}

  function ensureDrawer(){
    let drawer=$("microPlayerGridDrawer");
    if(drawer)return drawer;
    drawer=document.createElement("div");
    drawer.id="microPlayerGridDrawer";
    drawer.className="micro-player-grid-drawer";
    drawer.innerHTML='<button type="button" id="microPlayerGridToggle" class="micro-player-grid-toggle" aria-expanded="false" aria-label="Abrir controles do Grid">⌄</button><div id="microPlayerGridControls" class="micro-player-grid-controls"></div>';
    for(const type of ["pointerdown","pointermove","pointerup","pointercancel","wheel"])drawer.addEventListener(type,e=>e.stopPropagation(),{passive:type!=="wheel"});
    viewport.appendChild(drawer);
    const toggle=$("microPlayerGridToggle");
    toggle.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();setOpen(!open)});
    return drawer
  }
  function setOpen(value){
    open=!!value;
    const drawer=$("microPlayerGridDrawer"),toggle=$("microPlayerGridToggle");
    drawer?.classList.toggle("open",open);
    if(toggle){toggle.textContent=open?"⌃":"⌄";toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Fechar controles do Grid":"Abrir controles do Grid")}
  }

  function move(el,target,cls=""){
    if(!el||!target)return;
    if(cls)el.classList.add(cls);
    if(el.parentElement!==target)target.appendChild(el)
  }

  function apply(){
    ensureCss();
    if(!isPlayer()||isMaster()){
      document.body.classList.remove("micro-player-grid-clean");
      $("microPlayerGridDrawer")?.remove();
      return
    }
    document.body.classList.add("micro-player-grid-clean");
    ensureDrawer();
    const controls=$("microPlayerGridControls");if(!controls)return;

    const ficha=sheetButton(),minus=zoomOut(),pct=zoomValue(),plus=zoomIn(),snapBtn=snap();
    if(ficha){
      ficha.style.removeProperty("display");
      ficha.textContent="🧙 Ficha";
      ficha.title="Adicionar ou abrir o personagem da própria ficha";
      move(ficha,controls,"micro-player-sheet-btn")
    }
    move(minus,controls);move(pct,controls);move(plus,controls);move(snapBtn,controls);

    [...controls.children].forEach(el=>el.style.removeProperty("display"));
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}
  ensureCss();schedule();
  const obs=new MutationObserver(schedule);
  obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
  window.addEventListener("resize",schedule);
  globalThis.MICROCOSMOS_PLAYER_VIEW_DRAWER_API={refresh:schedule,setOpen,isOpen:()=>open};
})();
