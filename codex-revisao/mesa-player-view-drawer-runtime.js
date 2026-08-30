/* MICROCOSMOS — Gaveta central de controles do Grid v2.
   Uma única gaveta para Mestre e Jogador: Ficha + Zoom + Snap.
   O Menu principal e o Atlas permanecem separados no topo.
*/
(function(){
  if(globalThis.MICROCOSMOS_PLAYER_VIEW_DRAWER_V2)return;
  globalThis.MICROCOSMOS_PLAYER_VIEW_DRAWER_V2=true;

  const $=id=>document.getElementById(id),mapShell=document.querySelector('.map-shell');
  if(!mapShell)return;
  let open=false,queued=false;

  function ensureCss(){
    if($("microPlayerViewDrawerStyleV2"))return;
    const s=document.createElement("style");s.id="microPlayerViewDrawerStyleV2";s.textContent=`
      /* A barra antiga deixa de competir com a gaveta central. */
      body.micro-grid-drawer-clean #microCompactTableBar{display:none!important}
      body.micro-grid-drawer-clean .toolbar{height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;border:0!important}

      .micro-player-grid-drawer{position:fixed!important;top:51px!important;left:50%!important;transform:translateX(-50%)!important;z-index:16980!important;display:flex!important;flex-direction:column!important;align-items:center!important;pointer-events:none!important;max-width:calc(100vw - 12px)!important}
      .micro-player-grid-toggle{pointer-events:auto!important;width:44px!important;height:30px!important;padding:0!important;border:2px solid #725a38!important;border-radius:0 0 12px 12px!important;background:#efe5cc!important;color:#3f3225!important;font:bold 1.05rem Georgia,serif!important;line-height:1!important;box-shadow:0 3px 9px #0006!important;touch-action:manipulation!important}
      .micro-player-grid-toggle::before{content:none!important}
      .micro-player-grid-controls{pointer-events:auto!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;max-width:min(96vw,560px)!important;padding:6px!important;margin-top:3px!important;border:2px solid #806945!important;border-radius:11px!important;background:#efe5cc!important;box-shadow:0 8px 22px #0008!important;overflow-x:auto!important;overscroll-behavior-x:contain!important;scrollbar-width:none!important;transform-origin:top center!important;transition:opacity .14s ease,transform .14s ease!important}
      .micro-player-grid-controls::-webkit-scrollbar{display:none}
      .micro-player-grid-drawer:not(.open) .micro-player-grid-controls{opacity:0!important;transform:translateY(-8px) scale(.97)!important;pointer-events:none!important;position:absolute!important;top:30px!important;visibility:hidden!important}
      .micro-player-grid-controls .btn,.micro-player-grid-controls button{flex:0 0 auto!important;min-height:34px!important;padding:6px 9px!important;white-space:nowrap!important;display:inline-flex!important}
      .micro-player-grid-controls .micro-player-sheet-btn{font-size:.82rem!important}
      @media(max-width:720px){
        .micro-player-grid-drawer{top:47px!important;max-width:calc(100% - 6px)!important}
        .micro-player-grid-toggle{width:42px!important;height:27px!important;font-size:1rem!important}
        .micro-player-grid-controls{gap:4px!important;padding:4px!important;max-width:96vw!important;border-radius:9px!important}
        .micro-player-grid-controls .btn,.micro-player-grid-controls button{min-height:32px!important;padding:5px 7px!important;font-size:.78rem!important}
        .micro-player-grid-controls .micro-player-sheet-btn{max-width:115px!important;overflow:hidden!important;text-overflow:ellipsis!important}
      }
    `;document.head.appendChild(s)
  }

  function findToolbarButton(regex,ids=[]){
    for(const id of ids){const el=$(id);if(el)return el}
    for(const root of [document.querySelector('.toolbar'),$("microCompactTableBar"),mapShell].filter(Boolean)){
      const found=[...root.querySelectorAll('button')].find(b=>regex.test((b.textContent||'').trim()));if(found)return found
    }
    return null
  }
  const zoomOut=()=>findToolbarButton(/^[-−–➖]$/,['zoomOut','zoomMinus']);
  const zoomIn=()=>findToolbarButton(/^[+➕]$/,['zoomIn','zoomPlus']);
  function zoomValue(){for(const id of ['zoomReset','zoomLabel','zoomPct','zoomValue','zoomPercent']){const el=$(id);if(el)return el}return [...document.querySelectorAll('button,span,b')].find(x=>/^\s*\d{1,3}%\s*$/.test(x.textContent||''))||null}
  const snap=()=>$("toggleSnap")||findToolbarButton(/Snap\s*:/i);
  const sheetButton=()=>$("microAddCharacterSide")||$("addToken");

  function ensureDrawer(){
    let drawer=$("microPlayerGridDrawer");
    if(!drawer){drawer=document.createElement('div');drawer.id='microPlayerGridDrawer';drawer.className='micro-player-grid-drawer';drawer.innerHTML='<button type="button" id="microPlayerGridToggle" class="micro-player-grid-toggle" aria-expanded="false" aria-label="Abrir controles do Grid">⌄</button><div id="microPlayerGridControls" class="micro-player-grid-controls"></div>';document.body.appendChild(drawer)}
    else if(drawer.parentElement!==document.body)document.body.appendChild(drawer);
    const toggle=$("microPlayerGridToggle");
    if(toggle&&!toggle.dataset.v2Bound){toggle.dataset.v2Bound='1';toggle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setOpen(!open)})}
    for(const type of ['pointerdown','pointermove','pointerup','pointercancel','wheel'])if(!drawer.dataset[`stop${type}`]){drawer.dataset[`stop${type}`]='1';drawer.addEventListener(type,e=>e.stopPropagation(),{passive:type!=='wheel'})}
    return drawer
  }
  function setOpen(value){open=!!value;const drawer=$("microPlayerGridDrawer"),toggle=$("microPlayerGridToggle");drawer?.classList.toggle('open',open);if(toggle){toggle.textContent=open?'⌃':'⌄';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fechar controles do Grid':'Abrir controles do Grid')}}
  function move(el,target,cls=''){if(!el||!target)return;if(cls)el.classList.add(cls);el.style.removeProperty('display');if(el.parentElement!==target)target.appendChild(el)}

  function apply(){
    ensureCss();document.body.classList.add('micro-grid-drawer-clean');ensureDrawer();const controls=$("microPlayerGridControls");if(!controls)return;
    const ficha=sheetButton(),minus=zoomOut(),pct=zoomValue(),plus=zoomIn(),snapBtn=snap();
    if(ficha){ficha.textContent='🧙 Ficha';ficha.title='Abrir ou adicionar personagem da própria ficha';move(ficha,controls,'micro-player-sheet-btn')}
    move(minus,controls);move(pct,controls);move(plus,controls);move(snapBtn,controls);
    [...controls.children].forEach(el=>el.style.removeProperty('display'));
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}

  ensureCss();schedule();
  const obs=new MutationObserver(schedule);obs.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',schedule);
  globalThis.MICROCOSMOS_PLAYER_VIEW_DRAWER_API={refresh:schedule,setOpen,isOpen:()=>open};
})();
