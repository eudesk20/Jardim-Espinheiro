/* MICROCOSMOS — Atlas da Campanha v2.1: Cenas independentes + edição local segura. */
(async function(){
  if(globalThis.MICROCOSMOS_CAMPAIGN_ATLAS)return;
  globalThis.MICROCOSMOS_CAMPAIGN_ATLAS=true;

  const $=id=>document.getElementById(id),left=$("leftPanel"),gridType=$("gridType"),gridSize=$("gridSize"),mapFile=$("mapFile"),mapImage=$("mapImage"),mapStatus=$("mapStatus"),viewport=$("viewport");
  if(!left)return;
  const STORE="MICROCOSMOS_CAMPAIGN_ATLAS_V1",SCENE_STORE="MICROCOSMOS_SCENE_GEOMETRY_V1";
  let isMaster=false,restoring=false,lastLocalSceneInput=0,localCaptureTimer=null;
  try{
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    const sb=createClient("https://evyhhlbvhspiuwouivbb.supabase.co","sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    const {data:{session}}=await sb.auth.getSession();
    if(session?.user){const {data}=await sb.from("profiles").select("role,approved").eq("id",session.user.id).maybeSingle();isMaster=data?.role==="master"&&data?.approved!==false}
  }catch(_e){}
  if(!isMaster)return;

  const uid=(p="id")=>crypto.randomUUID?.()||`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const clone=v=>{try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v))}};
  function emptyGeometry(){return{version:1,elements:[]}}
  function readGeometry(){try{const x=JSON.parse(localStorage.getItem(SCENE_STORE)||"null");return x&&Array.isArray(x.elements)?x:emptyGeometry()}catch(_e){return emptyGeometry()}}
  function load(){
    try{const x=JSON.parse(localStorage.getItem(STORE)||"null");if(x?.folders?.length&&x?.scenes?.length)return x}catch(_e){}
    const folderId=uid("folder"),sceneId=uid("scene");return{version:2,activeSceneId:sceneId,folders:[{id:folderId,name:"Campanha",open:true}],scenes:[{id:sceneId,folderId,name:"Cena Atual",geometry:readGeometry(),gridType:gridType?.value||"square",gridSize:+gridSize?.value||70,mapData:"",entryPoints:[],transitions:[],updatedAt:Date.now()}]}
  }
  let atlas=load();atlas.version=2;
  for(const s of atlas.scenes){if(!s.geometry)s.geometry=emptyGeometry();if(!Array.isArray(s.entryPoints))s.entryPoints=[];if(!Array.isArray(s.transitions))s.transitions=[];if(typeof s.mapData!=="string")s.mapData=""}
  function saveData(){localStorage.setItem(STORE,JSON.stringify(atlas))}
  function active(){return atlas.scenes.find(s=>s.id===atlas.activeSceneId)||atlas.scenes[0]}
  function captureCurrent(){const s=active();if(!s||restoring)return;s.geometry=clone(readGeometry());s.gridType=gridType?.value||s.gridType||"square";s.gridSize=+gridSize?.value||s.gridSize||70;s.updatedAt=Date.now();saveData()}
  function scheduleLocalCapture(delay=20){clearTimeout(localCaptureTimer);localCaptureTimer=setTimeout(captureCurrent,delay)}
  async function compressMap(file){
    const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
    const img=await new Promise((resolve,reject)=>{const x=new Image();x.onload=()=>resolve(x);x.onerror=reject;x.src=src});
    const max=1800,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));c.getContext("2d").drawImage(img,0,0,c.width,c.height);return c.toDataURL("image/webp",.8)
  }
  function applySceneVisuals(){
    const s=active();if(!s)return;
    if(gridType){gridType.value=s.gridType||"square";gridType.dispatchEvent(new Event("change",{bubbles:true}))}
    if(gridSize){gridSize.value=String(s.gridSize||70);gridSize.dispatchEvent(new Event("input",{bubbles:true}))}
    if(mapImage){if(s.mapData){mapImage.src=s.mapData;mapImage.hidden=false;mapImage.style.removeProperty("display");if(mapStatus)mapStatus.textContent=`Cena: ${s.name}`}else{mapImage.hidden=true;mapImage.removeAttribute("src");mapImage.style.display="none";if(mapStatus)mapStatus.textContent=`Cena: ${s.name} • sem mapa`}}
    const stage=$("stage");if(stage&&!s.mapData)stage.style.backgroundImage="none"
  }
  function applyStoredGeometry(){
    if(restoring)return;const s=active();if(!s)return;const geo=clone(s.geometry||emptyGeometry());restoring=true;
    try{
      localStorage.setItem(SCENE_STORE,JSON.stringify(geo));
      const live=globalThis.MICROCOSMOS_SCENE;
      if(live?.elements&&Array.isArray(live.elements)){live.elements.splice(0,live.elements.length,...geo.elements.map(clone));live.refresh?.()}
      applySceneVisuals()
    }finally{setTimeout(()=>restoring=false,0)}
  }
  function switchScene(id){
    if(id===atlas.activeSceneId)return;captureCurrent();const next=atlas.scenes.find(s=>s.id===id);if(!next)return;atlas.activeSceneId=id;saveData();localStorage.setItem(SCENE_STORE,JSON.stringify(clone(next.geometry||emptyGeometry())));location.reload()
  }
  function addFolder(){const name=prompt("Nome da Pasta / Conjunto:","Novo Conjunto");if(!name?.trim())return;atlas.folders.push({id:uid("folder"),name:name.trim(),open:true});saveData();render()}
  function addScene(folderId){
    const name=prompt("Nome da nova Cena:","Nova Cena");if(!name?.trim())return;
    captureCurrent();const id=uid("scene");
    atlas.scenes.push({id,folderId,name:name.trim(),geometry:emptyGeometry(),gridType:"square",gridSize:70,mapData:"",entryPoints:[],transitions:[],updatedAt:Date.now()});
    atlas.activeSceneId=id;saveData();localStorage.setItem(SCENE_STORE,JSON.stringify(emptyGeometry()));location.reload()
  }
  function renameFolder(id){const f=atlas.folders.find(x=>x.id===id);if(!f)return;const name=prompt("Renomear Pasta:",f.name);if(!name?.trim())return;f.name=name.trim();saveData();render()}
  function renameScene(id){const s=atlas.scenes.find(x=>x.id===id);if(!s)return;const name=prompt("Renomear Cena:",s.name);if(!name?.trim())return;s.name=name.trim();saveData();render();applySceneVisuals()}
  function deleteScene(id){const s=atlas.scenes.find(x=>x.id===id);if(!s||atlas.scenes.length<=1){alert("O Atlas precisa manter pelo menos uma Cena.");return}if(!confirm(`Excluir a Cena “${s.name}”?`))return;atlas.scenes=atlas.scenes.filter(x=>x.id!==id);if(atlas.activeSceneId===id){const next=atlas.scenes[0];atlas.activeSceneId=next.id;localStorage.setItem(SCENE_STORE,JSON.stringify(clone(next.geometry||emptyGeometry())));saveData();location.reload();return}saveData();render()}
  function deleteFolder(id){const f=atlas.folders.find(x=>x.id===id);if(!f)return;const scenes=atlas.scenes.filter(s=>s.folderId===id);if(scenes.length){alert("Mova ou exclua as Cenas desta Pasta antes de apagá-la.");return}if(!confirm(`Excluir a Pasta “${f.name}”?`))return;atlas.folders=atlas.folders.filter(x=>x.id!==id);saveData();render()}
  function moveScene(id){const s=atlas.scenes.find(x=>x.id===id);if(!s)return;const options=atlas.folders.map((f,i)=>`${i+1}. ${f.name}`).join("\n"),answer=prompt(`Mover “${s.name}” para qual Pasta?\n${options}`);const n=+answer;if(!Number.isInteger(n)||n<1||n>atlas.folders.length)return;s.folderId=atlas.folders[n-1].id;saveData();render()}
  function ensureStyle(){if($("microAtlasStyle"))return;const st=document.createElement("style");st.id="microAtlasStyle";st.textContent=`
    .micro-atlas{margin-top:10px}.micro-atlas-head{display:flex;gap:5px;align-items:center;justify-content:space-between;flex-wrap:wrap}.micro-atlas-head .row{display:flex;gap:5px}.micro-atlas-folder{margin-top:7px;border:1px solid #a38b68;border-radius:10px;background:#fff8e7;overflow:hidden}.micro-atlas-folder summary{display:flex;align-items:center;gap:5px;padding:7px 8px;cursor:pointer;font-weight:bold;color:#405d3e;list-style:none}.micro-atlas-folder summary::-webkit-details-marker{display:none}.micro-atlas-folder summary .grow{flex:1}.micro-atlas-folder-body{padding:0 6px 7px}.micro-atlas-scene{display:grid;grid-template-columns:1fr auto;gap:5px;align-items:center;border-top:1px dashed #c4b18e;padding:6px 2px}.micro-atlas-scene:first-child{border-top:0}.micro-atlas-open{border:1px solid transparent;background:transparent;text-align:left;padding:5px;border-radius:7px;color:#403525}.micro-atlas-open:hover{background:#efe3c9}.micro-atlas-scene.active .micro-atlas-open{background:#dce9da;border-color:#6c906b;font-weight:bold;color:#294e34}.micro-atlas-actions{display:flex;gap:3px}.micro-atlas-mini{border:1px solid #9a815e;background:#f7ecd3;border-radius:7px;padding:4px 6px;min-width:30px}.micro-atlas-count{font-size:.66rem;color:#76634c}.micro-atlas-empty{font-size:.7rem;padding:7px;color:#7b6a55}.micro-atlas-badge{font-size:.62rem;border-radius:999px;background:#405d3e;color:white;padding:2px 6px}`;document.head.appendChild(st)}
  function ensurePanel(){let panel=$("microCampaignAtlas");if(!panel){panel=document.createElement("section");panel.id="microCampaignAtlas";panel.className="panel micro-atlas";left.insertBefore(panel,left.firstChild)}return panel}
  function render(){
    ensureStyle();const panel=ensurePanel();
    panel.innerHTML=`<div class="micro-atlas-head"><h2 style="margin:0">🗂️ Atlas da Campanha</h2><button class="btn" data-atlas-folder>📁 Criar Pasta</button></div><div style="font-size:.7rem;margin-top:5px;color:#6c5a43">Pastas servem apenas para organização. Cada Cena mantém seu próprio cenário.</div><div data-atlas-folders></div>`;
    const host=panel.querySelector("[data-atlas-folders]");
    for(const f of atlas.folders){const scenes=atlas.scenes.filter(s=>s.folderId===f.id),d=document.createElement("details");d.className="micro-atlas-folder";d.open=f.open!==false;d.innerHTML=`<summary><span>${d.open?"▼":"▶"}</span><span>📁 ${esc(f.name)}</span><span class="grow"></span><span class="micro-atlas-badge">${scenes.length}</span><button class="micro-atlas-mini" data-add-scene title="Nova Cena">＋</button><button class="micro-atlas-mini" data-folder-edit title="Renomear">✎</button><button class="micro-atlas-mini" data-folder-delete title="Excluir">🗑</button></summary><div class="micro-atlas-folder-body"></div>`;const body=d.querySelector(".micro-atlas-folder-body");
      if(!scenes.length)body.innerHTML='<div class="micro-atlas-empty">Nenhuma Cena nesta Pasta.</div>';
      for(const s of scenes){const row=document.createElement("div");row.className=`micro-atlas-scene${s.id===atlas.activeSceneId?" active":""}`;row.innerHTML=`<button class="micro-atlas-open" data-open-scene><span>${s.id===atlas.activeSceneId?"🟢":"🗺️"} ${esc(s.name)}</span><br><span class="micro-atlas-count">${s.id===atlas.activeSceneId?"Cena aberta pelo Mestre":"Abrir Cena"}</span></button><div class="micro-atlas-actions"><button class="micro-atlas-mini" data-scene-move title="Mover para outra Pasta">📁</button><button class="micro-atlas-mini" data-scene-edit title="Renomear">✎</button><button class="micro-atlas-mini" data-scene-delete title="Excluir">🗑</button></div>`;row.querySelector("[data-open-scene]").onclick=()=>switchScene(s.id);row.querySelector("[data-scene-move]").onclick=()=>moveScene(s.id);row.querySelector("[data-scene-edit]").onclick=()=>renameScene(s.id);row.querySelector("[data-scene-delete]").onclick=()=>deleteScene(s.id);body.appendChild(row)}
      d.addEventListener("toggle",()=>{f.open=d.open;saveData();const icon=d.querySelector("summary>span");if(icon)icon.textContent=d.open?"▼":"▶"});d.querySelector("[data-add-scene]").onclick=e=>{e.preventDefault();e.stopPropagation();addScene(f.id)};d.querySelector("[data-folder-edit]").onclick=e=>{e.preventDefault();e.stopPropagation();renameFolder(f.id)};d.querySelector("[data-folder-delete]").onclick=e=>{e.preventDefault();e.stopPropagation();deleteFolder(f.id)};host.appendChild(d)
    }
    panel.querySelector("[data-atlas-folder]").onclick=addFolder
  }

  saveData();applySceneVisuals();render();
  gridType?.addEventListener("change",()=>{if(restoring)return;const s=active();if(s){s.gridType=gridType.value;saveData()}});
  gridSize?.addEventListener("input",()=>{if(restoring)return;const s=active();if(s){s.gridSize=+gridSize.value||70;saveData()}});
  mapFile?.addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=await compressMap(file),s=active();if(s){s.mapData=data;s.updatedAt=Date.now();saveData();setTimeout(applySceneVisuals,0)}}catch(err){console.warn("MICROCOSMOS Atlas: mapa não pôde ser persistido",err)}},true);
  $("clearMap")?.addEventListener("click",()=>{const s=active();if(s){s.mapData="";saveData()}},true);

  // Diferencia edição local do Mestre de aplicação remota do sincronizador global.
  // No celular pointer/touch ocorre imediatamente antes do save do Construtor.
  for(const type of ["pointerdown","pointermove","pointerup","touchstart","touchmove","touchend"]){
    viewport?.addEventListener(type,()=>{lastLocalSceneInput=Date.now()},{capture:true,passive:true})
  }
  document.addEventListener("microcosmos:scene-changed",e=>{
    const local=!!e.detail?.local||Date.now()-lastLocalSceneInput<1600||!!globalThis.MICROCOSMOS_SCENE_EDITING;
    clearTimeout(globalThis.__microAtlasRestoreTimer);
    if(local){scheduleLocalCapture(15);return}
    globalThis.__microAtlasRestoreTimer=setTimeout(applyStoredGeometry,40)
  });
  // Uma única aplicação inicial é suficiente; não há mais restores tardios que possam apagar desenho novo.
  setTimeout(applyStoredGeometry,60);
  viewport?.addEventListener("pointerup",()=>scheduleLocalCapture(30),true);
  viewport?.addEventListener("touchend",()=>scheduleLocalCapture(30),{capture:true,passive:true});
  window.addEventListener("beforeunload",captureCurrent);
  globalThis.MICROCOSMOS_ATLAS={get data(){return atlas},active,save:saveData,captureCurrent,restoreActive:applyStoredGeometry,switchScene,addFolder,addScene,render};
})();
