/* MICROCOSMOS — segurança visual do Atlas. A persistência das Cenas fica no núcleo do Atlas. */
(async function(){
  if(globalThis.MICROCOSMOS_ATLAS_UI_FRESH_SCENE_FIX)return;
  globalThis.MICROCOSMOS_ATLAS_UI_FRESH_SCENE_FIX=true;

  const $=id=>document.getElementById(id);
  function ensureStyle(){
    if($("microAtlasUiFreshSceneStyle"))return;
    const s=document.createElement("style");s.id="microAtlasUiFreshSceneStyle";s.textContent=`
      body:not(.micro-atlas-master-ok) #microAtlasTopToggle,
      body:not(.micro-atlas-master-ok) #microAtlasTopDrawer{display:none!important}
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
  ensureStyle();authorizeAtlas();
})();

/* MICROCOSMOS — celular: Porta/Janela estáveis no Grid e no menu.
   - um toque = uma alteração;
   - Estado da Porta mantém a porcentagem de abertura coerente;
   - alterações feitas pelo menu são tratadas como locais pelo Atlas. */
(function(){
  if(globalThis.MICROCOSMOS_MOBILE_OPENINGS_FIX)return;
  globalThis.MICROCOSMOS_MOBILE_OPENINGS_FIX=true;

  const $=id=>document.getElementById(id);
  let localUntil=0,lastActionKey="",lastActionAt=0;
  const mobile=()=>matchMedia("(max-width:720px)").matches;
  const sceneApi=()=>globalThis.MICROCOSMOS_SCENE;
  const elements=()=>sceneApi()?.elements||[];

  function markLocal(){
    localUntil=Date.now()+2400;
    globalThis.MICROCOSMOS_LOCAL_SCENE_ACTION_UNTIL=localUntil
  }
  function selectedId(){
    return document.querySelector('#stage [data-scene-id] .micro-scene-segment.selected')?.closest?.('[data-scene-id]')?.dataset.sceneId||""
  }
  function elementById(id){return elements().find(x=>String(x.id)===String(id))||null}
  function linkedDoors(el){
    if(!el||el.type!=="door")return el?[el]:[];
    if(!el.linkId)return[el];
    return elements().filter(x=>x.type==="door"&&x.linkId===el.linkId)
  }
  function normalizeLocal(el){
    if(!el)return;
    const state=el.state||"closed";
    if(el.type==="door"){
      const open=state==="open";
      el.blocksVision=!open;el.blocksMovement=!open
    }else if(el.type==="window"){
      el.blocksVision=el.curtain==="closed";
      el.blocksMovement=state!=="open"
    }
  }
  function commit(){
    markLocal();
    const api=sceneApi();api?.commit?.();api?.refresh?.();
    queueMicrotask(()=>{
      clearTimeout(globalThis.__microAtlasRestoreTimer);
      globalThis.MICROCOSMOS_ATLAS?.captureCurrent?.()
    })
  }
  function applyDoorState(el,state){
    const next=["closed","half","open","locked"].includes(state)?state:"closed";
    for(const door of linkedDoors(el)){
      door.state=next;
      if(next==="open")door.openness=1;
      else if(next==="half"){
        const current=+door.openness;
        door.openness=Number.isFinite(current)&&current>0&&current<1?current:.5
      }else door.openness=0;
      normalizeLocal(door)
    }
  }
  function applyWindowState(el,state){el.state=state==="open"?"open":"closed";normalizeLocal(el)}
  function toggleOpening(id){
    const el=elementById(id);if(!el)return;
    if(el.type==="door")applyDoorState(el,el.state==="open"?"closed":"open");
    else if(el.type==="window")applyWindowState(el,el.state==="open"?"closed":"open");
    else if(el.type==="light")el.state=el.state==="off"?"on":"off";
    else return;
    commit()
  }
  function toggleCurtain(id){
    const el=elementById(id);if(el?.type!=="window")return;
    el.curtain=el.curtain==="closed"?"open":"closed";normalizeLocal(el);commit()
  }
  function prevent(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
  function once(key){const now=Date.now();if(key===lastActionKey&&now-lastActionAt<380)return false;lastActionKey=key;lastActionAt=now;return true}

  // Controles desenhados sobre o Grid. Interceptamos antes dos handlers antigos,
  // evitando pointerdown + eventos sintéticos do navegador móvel alterarem duas vezes.
  document.addEventListener("pointerdown",e=>{
    if(!mobile())return;
    const toggle=e.target?.closest?.("[data-scene-toggle]");
    const curtain=e.target?.closest?.("[data-scene-curtain-toggle]");
    if(!toggle&&!curtain)return;
    markLocal();
    const id=toggle?.dataset.sceneToggle||curtain?.dataset.sceneCurtainToggle||"";
    const key=`${toggle?"toggle":"curtain"}:${id}`;
    prevent(e);if(!once(key))return;
    toggle?toggleOpening(id):toggleCurtain(id)
  },true);

  // Menu de edição: Estado e Cortina são tratados diretamente para que o Atlas
  // não restaure a versão anterior enquanto o select do celular ainda está fechando.
  document.addEventListener("change",e=>{
    if(!mobile())return;
    const target=e.target;if(!target)return;
    if(target.id==="microElementState"){
      const el=elementById(selectedId());if(!el)return;
      markLocal();prevent(e);
      if(el.type==="door")applyDoorState(el,target.value);
      else if(el.type==="window")applyWindowState(el,target.value);
      else el.state=target.value;
      commit();return
    }
    if(target.id==="microElementCurtain"){
      const el=elementById(selectedId());if(el?.type!=="window")return;
      markLocal();prevent(e);el.curtain=target.value==="closed"?"closed":"open";normalizeLocal(el);commit();return
    }
    if(target.closest?.("#microSceneBuilderPanel,#microMasterSceneSection"))markLocal()
  },true);

  // Slider de abertura e demais controles do painel continuam usando o motor original,
  // mas ficam explicitamente marcados como edição local.
  document.addEventListener("pointerdown",e=>{
    if(!mobile())return;
    if(e.target?.closest?.("#microSceneBuilderPanel,#microMasterSceneSection,#microSceneMobileBar,[data-scene-opening]"))markLocal()
  },true);
  document.addEventListener("input",e=>{
    if(!mobile())return;
    if(e.target?.closest?.("#microSceneBuilderPanel,#microMasterSceneSection"))markLocal()
  },true);

  // O Atlas antigo agenda um restore quando não reconhece a origem. Se a alteração
  // foi marcada localmente, cancelamos esse restore depois que todos os listeners
  // do evento rodarem e gravamos a geometria recém-editada na Cena atual.
  document.addEventListener("microcosmos:scene-changed",()=>{
    if(Date.now()>localUntil)return;
    queueMicrotask(()=>{
      clearTimeout(globalThis.__microAtlasRestoreTimer);
      globalThis.MICROCOSMOS_ATLAS?.captureCurrent?.()
    })
  },true);

  // Área de toque um pouco maior nos controles circulares do Grid no celular.
  const st=document.createElement("style");st.id="microMobileOpeningTouchStyle";st.textContent=`
    @media(max-width:720px){
      .micro-dynamic-control{touch-action:manipulation}
      .micro-dynamic-control circle{stroke-width:4px}
    }
  `;document.head.appendChild(st)
})();
