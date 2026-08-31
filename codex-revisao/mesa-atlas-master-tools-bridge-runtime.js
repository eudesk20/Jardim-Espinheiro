/* MICROCOSMOS — Atlas da Campanha em gaveta superior independente.
   Cria um botão 🗂 Atlas ao lado do botão Menu e mantém Pastas/Cenas,
   Transições vinculadas numa gaveta própria do Mestre. */
(function(){
  if(globalThis.MICROCOSMOS_ATLAS_MASTER_TOOLS_BRIDGE)return;
  globalThis.MICROCOSMOS_ATLAS_MASTER_TOOLS_BRIDGE=true;

  const $=id=>document.getElementById(id);
  let mounting=false,positionQueued=false;

  function ensureStyle(){
    if($("microAtlasTopDrawerStyle"))return;
    const s=document.createElement("style");
    s.id="microAtlasTopDrawerStyle";
    s.textContent=`
      #microAtlasTopToggle{position:fixed;z-index:17020;top:5px;left:calc(50% + 62px);border:2px solid #665239;background:#f5ead0;color:#34291e;border-radius:10px;padding:7px 12px;min-height:34px;font:bold 15px Georgia,serif;box-shadow:0 2px 8px #0005;cursor:pointer;white-space:nowrap}
      #microAtlasTopToggle:hover,#microAtlasTopToggle[aria-expanded="true"]{background:#e8d7b6;outline:2px solid #c7a660;outline-offset:1px}
      #microAtlasTopDrawer{position:fixed;z-index:17010;top:45px;left:50%;transform:translateX(-50%);width:min(620px,calc(100vw - 16px));max-height:calc(100vh - 58px);overflow:auto;background:#efe5cc;border:3px double #806743;border-radius:16px;padding:9px;box-shadow:0 16px 45px #000a;color:#30271e}
      #microAtlasTopDrawer[hidden]{display:none!important}
      .micro-atlas-top-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;padding:2px 3px 7px;border-bottom:1px solid #a68d68}
      .micro-atlas-top-head b{font-size:1.05rem;color:#405d3e}.micro-atlas-top-close{border:1px solid #876d49;background:#fff8e7;border-radius:8px;padding:5px 8px;font-weight:bold}
      #microAtlasTopBody{display:grid;gap:8px}
      #microAtlasTopBody #microCampaignAtlas,#microAtlasTopBody #microAtlasTransitionPanel{margin:0!important;border:1px solid #a48d68!important;border-radius:10px!important;box-shadow:none!important;padding:8px!important;background:#fffaf0!important}
      #microAtlasTopBody #microCampaignAtlas{order:10}#microAtlasTopBody #microAtlasTransitionPanel{order:20}
      #microAtlasEntryPanel,#microAtlasEntryLayer{display:none!important}
      #microAtlasTopBody .micro-atlas-head h2{font-size:1.05rem}.micro-atlas-top-empty{padding:12px;text-align:center;background:#fff8e7;border-radius:9px;color:#715f49}
      @media(max-width:720px){#microAtlasTopToggle{font-size:13px;padding:6px 9px;left:auto;right:7px;top:5px}#microAtlasTopDrawer{top:43px;left:6px;right:6px;transform:none;width:auto;max-height:calc(100vh - 50px);border-radius:13px}#microAtlasTopBody .micro-atlas-actions,#microAtlasTopBody .micro-entry-actions{flex-wrap:wrap}}
    `;
    document.head.appendChild(s)
  }

  function findMenuButton(){
    const direct=$("microMasterToggle")||$("microMenuToggle")||$("menuToggle");
    if(direct&&/menu/i.test(direct.textContent||""))return direct;
    return [...document.querySelectorAll("button")].find(b=>/^\s*[☰≡]?\s*Menu\s*$/i.test((b.textContent||"").trim()))||null
  }

  function positionToggle(){
    if(positionQueued)return;positionQueued=true;
    requestAnimationFrame(()=>{
      positionQueued=false;const btn=$("microAtlasTopToggle"),menu=findMenuButton();if(!btn||matchMedia("(max-width:720px)").matches)return;
      if(menu){const r=menu.getBoundingClientRect(),left=Math.min(innerWidth-btn.offsetWidth-8,r.right+8);btn.style.left=`${Math.max(8,left)}px`;btn.style.top=`${Math.max(4,r.top)}px`}
      else{btn.style.left="calc(50% + 62px)";btn.style.top="5px"}
    })
  }

  function ensureShell(){
    ensureStyle();
    let toggle=$("microAtlasTopToggle");
    if(!toggle){toggle=document.createElement("button");toggle.id="microAtlasTopToggle";toggle.type="button";toggle.textContent="🗂 Atlas";toggle.setAttribute("aria-expanded","false");document.body.appendChild(toggle)}
    let drawer=$("microAtlasTopDrawer");
    if(!drawer){drawer=document.createElement("aside");drawer.id="microAtlasTopDrawer";drawer.hidden=true;drawer.innerHTML='<div class="micro-atlas-top-head"><b>🗂️ Atlas da Campanha</b><button type="button" class="micro-atlas-top-close" aria-label="Fechar Atlas">✕</button></div><div id="microAtlasTopBody"></div>';document.body.appendChild(drawer)}
    if(!toggle.dataset.bound){toggle.dataset.bound="1";toggle.onclick=e=>{e.stopPropagation();const open=drawer.hidden;drawer.hidden=!open;toggle.setAttribute("aria-expanded",String(open));if(open){mount();setTimeout(positionToggle,0)}}}
    const close=drawer.querySelector(".micro-atlas-top-close");if(close&&!close.dataset.bound){close.dataset.bound="1";close.onclick=()=>{drawer.hidden=true;toggle.setAttribute("aria-expanded","false")}}
    if(!drawer.dataset.bound){drawer.dataset.bound="1";drawer.addEventListener("click",e=>e.stopPropagation())}
    positionToggle();return{toggle,drawer,body:$("microAtlasTopBody")}
  }

  function removeOldAccordionCopy(){const old=$("microMasterAtlasSection");if(old)old.remove()}

  function mount(){
    if(mounting)return;mounting=true;
    try{
      const {body}=ensureShell();if(!body)return false;removeOldAccordionCopy();
      const atlas=$("microCampaignAtlas"),entries=$("microAtlasEntryPanel"),transitions=$("microAtlasTransitionPanel");
      entries?.setAttribute("hidden","");
      for(const panel of [atlas,transitions])if(panel&&panel.parentElement!==body)body.appendChild(panel);
      let empty=body.querySelector(".micro-atlas-top-empty");
      if(!atlas&&!entries&&!transitions){if(!empty){empty=document.createElement("div");empty.className="micro-atlas-top-empty";empty.textContent="O Atlas ainda está carregando…";body.appendChild(empty)}}else empty?.remove();
      return true
    }finally{mounting=false}
  }

  document.addEventListener("click",e=>{const drawer=$("microAtlasTopDrawer"),toggle=$("microAtlasTopToggle");if(!drawer||drawer.hidden||e.target?.closest?.("#microAtlasTopDrawer,#microAtlasTopToggle"))return;drawer.hidden=true;toggle?.setAttribute("aria-expanded","false")},true);
  document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;const drawer=$("microAtlasTopDrawer"),toggle=$("microAtlasTopToggle");if(drawer&&!drawer.hidden){drawer.hidden=true;toggle?.setAttribute("aria-expanded","false")}},true);
  addEventListener("resize",positionToggle,{passive:true});

  let tries=0;const timer=setInterval(()=>{mount();if(++tries>50&&$("microCampaignAtlas")&&$("microAtlasTransitionPanel"))clearInterval(timer)},220);
  for(const ev of ["microcosmos:atlas-entry-points-changed","microcosmos:atlas-transitions-changed","microcosmos:atlas-players-transferred"])
    document.addEventListener(ev,()=>setTimeout(mount,0));
  new MutationObserver(()=>positionToggle()).observe(document.body,{childList:true,subtree:true});
  mount();
})();
