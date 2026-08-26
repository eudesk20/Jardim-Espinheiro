/* MICROCOSMOS — Mesa compartilhada em tempo real.
   Sincroniza tokens/posições, cenário, Grid e mapa entre navegadores via Supabase.
   RLS garante que jogadores só recebam camadas visíveis e só atualizem o próprio token.
*/
(async function(){
  if(globalThis.MICROCOSMOS_MESA_SHARED_SYNC)return;
  globalThis.MICROCOSMOS_MESA_SHARED_SYNC=true;

  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const SESSION_KEY="microcosmos-main";
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  const api=globalThis.MICROCOSMOS_TABLE_API;
  if(!Array.isArray(players)||!api)return;

  const $=id=>document.getElementById(id);
  const clone=v=>{try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v))}};
  let supabase=null,session=null,profile=null,isMaster=false,applyingRemote=false,tokenTimer=null,sceneTimer=null,stateTimer=null,queuedTokenRows=null;
  const remoteMeta=new Map();

  function tokenLayer(p){return p?.visibilityLayer||p?.layer||"players"}
  function ownerId(p){return p?.userId||p?.ownerUserId||null}
  function tokenPayload(p){
    const data=clone(p);
    delete data._remote;delete data.__remote;
    return data
  }
  async function resolveAuth(){
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    supabase=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    const {data:{session:s}}=await supabase.auth.getSession();session=s;if(!session)return false;
    const {data:p,error}=await supabase.from("profiles").select("id,role,approved").eq("id",session.user.id).maybeSingle();
    if(error||!p||p.approved===false)return false;profile=p;isMaster=p.role==="master";return true
  }

  async function readRemoteTokens(){
    const {data,error}=await supabase.from("mesa_tokens").select("token_id,owner_user_id,layer,data,updated_at").eq("session_key",SESSION_KEY);
    if(error){console.warn("MICROCOSMOS Mesa: falha ao carregar tokens compartilhados",error);return []}
    return data||[]
  }
  function applyRemoteTokens(rows){
    if(globalThis.MICROCOSMOS_TOKEN_DRAGGING){queuedTokenRows=clone(rows||[]);return}
    applyingRemote=true;
    try{
      remoteMeta.clear();
      const next=[];
      for(const row of rows){
        remoteMeta.set(row.token_id,{owner_user_id:row.owner_user_id,layer:row.layer,data:clone(row.data||{})});
        const p={...(row.data||{}),id:row.token_id};
        if(row.owner_user_id&&!p.userId)p.userId=row.owner_user_id;
        if(row.layer&&!p.visibilityLayer)p.visibilityLayer=row.layer;
        next.push(p)
      }
      players.splice(0,players.length,...next);
      api.renderPlayers?.();api.renderTokens?.();
      globalThis.MICROCOSMOS_TOKEN_SIZE?.refresh?.();
      globalThis.MICROCOSMOS_INITIATIVE?.refresh?.();
    }finally{setTimeout(()=>applyingRemote=false,0)}
  }
  async function uploadToken(p,{includeHp=false}={}){
    const owner=ownerId(p),layer=tokenLayer(p);
    if(!isMaster&&owner!==session.user.id)return;
    const data=tokenPayload(p),remote=remoteMeta.get(p.id)?.data;
    // Movimentar/renderizar um token nunca pode reenviar um PV antigo. Somente
    // rotinas que alteram PV usam includeHp=true explicitamente.
    if(!includeHp&&remote){if(Number.isFinite(+remote.hp))data.hp=+remote.hp;if(Number.isFinite(+remote.hpMax))data.hpMax=+remote.hpMax}
    const {error}=await supabase.from("mesa_tokens").upsert({session_key:SESSION_KEY,token_id:p.id,owner_user_id:owner,layer,data,updated_by:session.user.id,updated_at:new Date().toISOString()},{onConflict:"session_key,token_id"});
    if(error)console.warn("MICROCOSMOS Mesa: falha ao sincronizar token",p.id,error);else remoteMeta.set(p.id,{owner_user_id:owner,layer,data:clone(data)})
  }
  async function flushToken(id,includeHp=false){if(!session)return false;const p=players.find(x=>String(x.id)===String(id));if(!p)return false;await uploadToken(p,{includeHp});return true}
  async function finishTokenDrag(id){
    try{if(session){const p=players.find(x=>String(x.id)===String(id));if(p)await uploadToken(p)}}
    finally{globalThis.MICROCOSMOS_TOKEN_DRAGGING=null;queuedTokenRows=null}
    if(session)applyRemoteTokens(await readRemoteTokens());
    return true
  }
  async function flushTokens(){
    if(applyingRemote||!session)return;
    const allowed=players.filter(p=>isMaster||ownerId(p)===session.user.id);
    await Promise.all(allowed.map(uploadToken));
    // Exclusões: Mestre pode remover qualquer token; jogador somente o próprio.
    const current=new Set(players.map(p=>p.id));
    const deletions=[];
    for(const [id,meta] of remoteMeta){
      if(current.has(id))continue;
      if(isMaster||meta.owner_user_id===session.user.id)deletions.push(id)
    }
    if(deletions.length){
      const {error}=await supabase.from("mesa_tokens").delete().eq("session_key",SESSION_KEY).in("token_id",deletions);
      if(error)console.warn("MICROCOSMOS Mesa: falha ao remover tokens compartilhados",error)
    }
  }
  function scheduleTokens(){if(applyingRemote||globalThis.MICROCOSMOS_TOKEN_DRAGGING)return;clearTimeout(tokenTimer);tokenTimer=setTimeout(flushTokens,180)}

  function sceneElements(){return globalThis.MICROCOSMOS_SCENE?.elements||[]}
  function applyRemoteScene(rows){
    const scene=globalThis.MICROCOSMOS_SCENE;if(!scene)return;
    applyingRemote=true;
    try{
      const target=scene.elements;
      target.splice(0,target.length,...rows.map(r=>({...clone(r.data||{}),id:r.element_id,layer:r.layer})));
      try{localStorage.setItem("MICROCOSMOS_SCENE_GEOMETRY_V1",JSON.stringify({version:1,elements:target}))}catch(_e){}
      scene.refresh?.();
    }finally{setTimeout(()=>applyingRemote=false,0)}
  }
  async function readRemoteScene(){
    const {data,error}=await supabase.from("mesa_scene_elements").select("element_id,layer,data,updated_at").eq("session_key",SESSION_KEY);
    if(error){console.warn("MICROCOSMOS Mesa: falha ao carregar cenário compartilhado",error);return []}
    return data||[]
  }
  async function flushScene(){
    if(!isMaster||applyingRemote)return;
    const els=sceneElements();
    if(els.length){
      const rows=els.map(e=>({session_key:SESSION_KEY,element_id:e.id,layer:e.layer==="master"?"master":"players",data:clone(e),updated_by:session.user.id,updated_at:new Date().toISOString()}));
      const {error}=await supabase.from("mesa_scene_elements").upsert(rows,{onConflict:"session_key,element_id"});if(error)console.warn("MICROCOSMOS Mesa: falha ao sincronizar cenário",error)
    }
    const {data:remote}=await supabase.from("mesa_scene_elements").select("element_id").eq("session_key",SESSION_KEY);
    const current=new Set(els.map(e=>e.id)),del=(remote||[]).map(r=>r.element_id).filter(id=>!current.has(id));
    if(del.length)await supabase.from("mesa_scene_elements").delete().eq("session_key",SESSION_KEY).in("element_id",del)
  }
  function scheduleScene(){if(!isMaster||applyingRemote)return;clearTimeout(sceneTimer);sceneTimer=setTimeout(flushScene,180)}

  async function getSessionState(){
    const {data}=await supabase.from("mesa_session_state").select("data").eq("session_key",SESSION_KEY).maybeSingle();return data?.data||{}
  }
  async function mergeSessionState(patch){
    if(!isMaster)return;
    const current=await getSessionState(),next={...current,...patch};
    const {error}=await supabase.from("mesa_session_state").upsert({session_key:SESSION_KEY,data:next,updated_by:session.user.id,updated_at:new Date().toISOString()},{onConflict:"session_key"});
    if(error)console.warn("MICROCOSMOS Mesa: falha ao sincronizar estado da sessão",error)
  }
  function scheduleGrid(){if(!isMaster||applyingRemote)return;clearTimeout(stateTimer);stateTimer=setTimeout(()=>mergeSessionState({gridType:$("gridType")?.value||"square",gridSize:+$("gridSize")?.value||70}),180)}
  function findMapElement(){return $("mapImage")||$("mapImg")||document.querySelector(".map-image")||document.querySelector("#stage img[data-map]")||document.querySelector("#stage>img")}
  async function applyMapPath(path){
    const el=findMapElement();
    if(!path){if(el){el.removeAttribute("src");el.style.display="none"}const stage=$("stage");if(stage)stage.style.backgroundImage="none";return}
    const {data,error}=await supabase.storage.from("mesa-maps").createSignedUrl(path,3600);
    if(error||!data?.signedUrl)return;
    if(el){el.src=data.signedUrl;el.style.display="block"}
    else {const stage=$("stage");if(stage){stage.style.backgroundImage=`url("${data.signedUrl}")`;stage.style.backgroundSize="contain";stage.style.backgroundRepeat="no-repeat";stage.style.backgroundPosition="center"}}
  }
  async function applySessionState(data){
    applyingRemote=true;
    try{
      if(data.gridType&&$("gridType"))$("gridType").value=data.gridType;
      if(data.gridSize&&$("gridSize"))$("gridSize").value=data.gridSize;
      api.updateGrid?.();globalThis.MICROCOSMOS_HEX_GRID?.refresh?.();globalThis.MICROCOSMOS_TOKEN_SIZE?.refresh?.();
      if("mapPath" in data)await applyMapPath(data.mapPath)
    }finally{setTimeout(()=>applyingRemote=false,0)}
  }
  async function uploadMap(file){
    if(!isMaster||!file)return;
    const ext=(file.name.split(".").pop()||"img").replace(/[^a-z0-9]/gi,"").toLowerCase()||"img",path=`${SESSION_KEY}/current-map.${ext}`;
    const {error}=await supabase.storage.from("mesa-maps").upload(path,file,{upsert:true,contentType:file.type||undefined,cacheControl:"60"});
    if(error){console.warn("MICROCOSMOS Mesa: falha ao enviar mapa",error);return}
    await mergeSessionState({mapPath:path,mapUpdatedAt:Date.now()})
  }

  function wrapRender(name){
    const old=api[name];if(typeof old!=="function"||old.__microShared)return;
    const wrapped=function(){const r=old.apply(this,arguments);scheduleTokens();return r};wrapped.__microShared=true;api[name]=wrapped
  }
  wrapRender("renderTokens");wrapRender("renderPlayers");

  // Posições mudam durante o arrasto antes da renderização final; pointerup garante flush.
  document.addEventListener("pointerup",e=>{if(e.target?.closest?.("#tokenLayer [data-token]")||document.querySelector("#tokenLayer .token.selected"))scheduleTokens()},true);
  $("gridType")?.addEventListener("change",scheduleGrid,true);$("gridSize")?.addEventListener("input",scheduleGrid,true);$("gridMinus")?.addEventListener("click",()=>setTimeout(scheduleGrid,0),true);$("gridPlus")?.addEventListener("click",()=>setTimeout(scheduleGrid,0),true);
  document.addEventListener("change",e=>{const input=e.target;if(input?.matches?.('.map-upload input[type="file"]')&&input.files?.[0])uploadMap(input.files[0])},true);
  document.addEventListener("click",e=>{if(e.target?.closest?.("#clearMap")&&isMaster)setTimeout(()=>mergeSessionState({mapPath:null,mapUpdatedAt:Date.now()}),0)},true);

  // Detecta edições do Construtor de Cenário sem exigir outro sistema de eventos.
  const sceneObserver=new MutationObserver(()=>scheduleScene());
  const beginSceneObserver=()=>{const a=$("microSceneVisibleLayer"),b=$("microSceneMasterLayer");if(a)sceneObserver.observe(a,{childList:true,subtree:true,attributes:true});if(b)sceneObserver.observe(b,{childList:true,subtree:true,attributes:true})};

  if(!await resolveAuth())return;
  const remoteTokens=await readRemoteTokens();
  if(remoteTokens.length)applyRemoteTokens(remoteTokens);else if(isMaster&&players.length)await flushTokens();
  const remoteScene=await readRemoteScene();
  if(remoteScene.length)applyRemoteScene(remoteScene);else if(isMaster&&sceneElements().length)await flushScene();
  const state=await getSessionState();if(Object.keys(state).length)await applySessionState(state);else if(isMaster)await mergeSessionState({gridType:$("gridType")?.value||"square",gridSize:+$("gridSize")?.value||70,mapPath:null});
  beginSceneObserver();

  const channel=supabase.channel(`mesa-shared-${SESSION_KEY}`)
    .on("postgres_changes",{event:"*",schema:"public",table:"mesa_tokens",filter:`session_key=eq.${SESSION_KEY}`},async()=>{if(!applyingRemote)applyRemoteTokens(await readRemoteTokens())})
    .on("postgres_changes",{event:"*",schema:"public",table:"mesa_scene_elements",filter:`session_key=eq.${SESSION_KEY}`},async()=>{if(!applyingRemote)applyRemoteScene(await readRemoteScene())})
    .on("postgres_changes",{event:"*",schema:"public",table:"mesa_session_state",filter:`session_key=eq.${SESSION_KEY}`},async payload=>{if(payload.new?.data)await applySessionState(payload.new.data)})
    .subscribe();

  globalThis.MICROCOSMOS_MESA_SHARED={isMaster:()=>isMaster,flushToken,finishTokenDrag,flushTokens,flushScene,reloadTokens:async()=>applyRemoteTokens(await readRemoteTokens()),reloadScene:async()=>applyRemoteScene(await readRemoteScene()),reloadState:async()=>applySessionState(await getSessionState()),channel};
})();
