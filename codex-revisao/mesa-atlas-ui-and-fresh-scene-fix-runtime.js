/* MICROCOSMOS — correções de UI/segurança do Atlas e Cena nova limpa. */
(async function(){
  if(globalThis.MICROCOSMOS_ATLAS_UI_FRESH_SCENE_FIX)return;
  globalThis.MICROCOSMOS_ATLAS_UI_FRESH_SCENE_FIX=true;

  const $=id=>document.getElementById(id);
  const FRESH_PREV="MICROCOSMOS_ATLAS_NEW_SCENE_PREV_V1";

  function ensureStyle(){
    if($("microAtlasUiFreshSceneStyle"))return;
    const s=document.createElement("style");s.id="microAtlasUiFreshSceneStyle";s.textContent=`
      /* Atlas é ferramenta exclusiva do Mestre: nasce invisível e só é liberado após validar a sessão. */
      body:not(.micro-atlas-master-ok) #microAtlasTopToggle,
      body:not(.micro-atlas-master-ok) #microAtlasTopDrawer{display:none!important}

      /* Jogador: mesmos controles, mas em gaveta centralizada no topo como a do Mestre. */
      body.micro-mesa-player .micro-player-grid-drawer,
      body.micro-online-player .micro-player-grid-drawer,
      html[data-mesa-role="player"] .micro-player-grid-drawer,
      html[data-microcosmos-role="player"] .micro-player-grid-drawer{
        position:fixed!important;top:5px!important;left:50%!important;transform:translateX(-50%)!important;
        z-index:17000!important;width:auto!important;max-width:calc(100vw - 12px)!important;pointer-events:none!important
      }
      body.micro-mesa-player .micro-player-grid-toggle,
      body.micro-online-player .micro-player-grid-toggle,
      html[data-mesa-role="player"] .micro-player-grid-toggle,
      html[data-microcosmos-role="player"] .micro-player-grid-toggle{
        width:auto!important;height:34px!important;min-width:86px!important;padding:6px 12px!important;
        border:2px solid #665239!important;border-radius:10px!important;background:#f5ead0!important;
        box-shadow:0 2px 8px #0005!important;color:#34291e!important;font-size:0!important;pointer-events:auto!important
      }
      .micro-player-grid-toggle::before{content:"☰ Menu";font:bold 15px Georgia,serif}
      .micro-player-grid-toggle[aria-expanded="true"]::before{content:"✕ Menu"}
      body.micro-mesa-player .micro-player-grid-controls,
      body.micro-online-player .micro-player-grid-controls,
      html[data-mesa-role="player"] .micro-player-grid-controls,
      html[data-microcosmos-role="player"] .micro-player-grid-controls{
        position:fixed!important;top:45px!important;left:50%!important;transform:translateX(-50%)!important;
        margin:0!important;max-width:min(96vw,560px)!important;border-radius:11px!important;z-index:16990!important
      }
      body.micro-mesa-player .micro-player-grid-drawer:not(.open) .micro-player-grid-controls,
      body.micro-online-player .micro-player-grid-drawer:not(.open) .micro-player-grid-controls,
      html[data-mesa-role="player"] .micro-player-grid-drawer:not(.open) .micro-player-grid-controls,
      html[data-microcosmos-role="player"] .micro-player-grid-drawer:not(.open) .micro-player-grid-controls{
        visibility:hidden!important;opacity:0!important;pointer-events:none!important
      }
      @media(max-width:720px){.micro-player-grid-toggle::before{font-size:13px}.micro-player-grid-toggle{min-width:78px!important}.micro-player-grid-controls{top:43px!important}}
    `;document.head.appendChild(s)
  }

  async function authorizeAtlas(){
    ensureStyle();
    try{
      const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      const sb=createClient("https://evyhhlbvhspiuwouivbb.supabase.co","sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:{session}}=await sb.auth.getSession();if(!session)return false;
      const {data}=await sb.from("profiles").select("role,approved").eq("id",session.user.id).maybeSingle();
      const master=data?.role==="master"&&data?.approved!==false;
      document.body.classList.toggle("micro-atlas-master-ok",master);
      if(!master){$("microAtlasTopDrawer")?.setAttribute("hidden","");$("microAtlasTopToggle")?.setAttribute("aria-expanded","false")}
      return master
    }catch(_e){document.body.classList.remove("micro-atlas-master-ok");return false}
  }

  // Guarda qual Cena estava aberta no instante em que o Mestre pediu uma Cena nova.
  // Após o reload, somente um ID realmente novo dispara a limpeza forçada.
  document.addEventListener("click",e=>{
    if(!e.target?.closest?.("[data-add-scene]"))return;
    const id=globalThis.MICROCOSMOS_ATLAS?.active?.()?.id||"";
    if(id)sessionStorage.setItem(FRESH_PREV,String(id))
  },true);

  function blankLiveScene(){
    const scene=globalThis.MICROCOSMOS_SCENE;
    if(scene?.elements&&Array.isArray(scene.elements)){
      scene.elements.splice(0,scene.elements.length);
      try{localStorage.setItem("MICROCOSMOS_SCENE_GEOMETRY_V1",JSON.stringify({version:1,elements:[]}))}catch(_e){}
      scene.refresh?.()
    }
    const map=$("mapImage")||$("mapImg")||document.querySelector(".map-image");
    if(map){map.hidden=true;map.removeAttribute("src");map.style.display="none"}
    const stage=$("stage");if(stage)stage.style.backgroundImage="none";
    const status=$("mapStatus"),a=globalThis.MICROCOSMOS_ATLAS?.active?.();if(status&&a)status.textContent=`Cena: ${a.name} • sem mapa`
  }

  async function enforceFreshScene(){
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<80&&!globalThis.MICROCOSMOS_ATLAS;i++)await wait(75);
    const atlas=globalThis.MICROCOSMOS_ATLAS;if(!atlas)return;
    const previous=sessionStorage.getItem(FRESH_PREV);if(!previous)return;
    const current=atlas.active?.();
    sessionStorage.removeItem(FRESH_PREV);
    if(!current||String(current.id)===String(previous))return;
    const geo=current.geometry;
    if(geo&&Array.isArray(geo.elements)&&geo.elements.length)return;
    current.geometry={version:1,elements:[]};current.mapData="";current.entryPoints=[];current.transitions=[];
    try{localStorage.setItem("MICROCOSMOS_CAMPAIGN_ATLAS_V1",JSON.stringify(atlas.data))}catch(_e){}
    // O sincronizador compartilhado antigo pode aplicar o cenário global durante o carregamento.
    // Reforçamos a Cena vazia algumas vezes somente nesta primeira abertura da Cena recém-criada.
    for(const delay of [0,90,260,650,1250])setTimeout(blankLiveScene,delay)
  }

  ensureStyle();authorizeAtlas();enforceFreshScene();
})();
