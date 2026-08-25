/* MICROCOSMOS — Camadas + Construtor de Cenário (Bloco 1).
   Base para Campo de Visão, iluminação, Fog of War e colisão.
   Mestre: Selecionar | Parede | Porta | Janela | Apagar.
   Cada segmento registra camada, estado e se bloqueia visão/movimento.
*/
(async function(){
  if(globalThis.MICROCOSMOS_SCENE_BUILDER)return;
  globalThis.MICROCOSMOS_SCENE_BUILDER=true;

  const $=id=>document.getElementById(id),stage=$("stage"),gridLayer=$("gridLayer"),tokenLayer=$("tokenLayer"),left=$("leftPanel"),gridType=$("gridType"),gridSize=$("gridSize");
  if(!stage||!gridLayer||!tokenLayer||!left)return;
  const STORE_KEY="MICROCOSMOS_SCENE_GEOMETRY_V1";
  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  let isMaster=false,tool="select",targetLayer="players",selectedId="",drawing=null,scene={version:1,elements:[]};
  try{scene=JSON.parse(localStorage.getItem(STORE_KEY)||"null")||scene;if(!Array.isArray(scene.elements))scene.elements=[]}catch{}

  function uid(){return crypto.randomUUID?.()||`geo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}
  function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(scene))}catch(e){console.warn("MICROCOSMOS: não foi possível salvar cenário",e)}}
  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
  function selected(){return scene.elements.find(x=>x.id===selectedId)||null}

  async function resolveRole(){
    try{
      const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      const sb=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:{session}}=await sb.auth.getSession();if(!session)return;
      const {data}=await sb.from("profiles").select("role,approved").eq("id",session.user.id).maybeSingle();
      isMaster=data?.role==="master"&&data?.approved!==false
    }catch(_e){isMaster=false}
  }

  function ensureLayers(){
    let visible=$("microSceneVisibleLayer"),master=$("microSceneMasterLayer");
    if(!visible){
      visible=document.createElementNS("http://www.w3.org/2000/svg","svg");visible.id="microSceneVisibleLayer";visible.classList.add("micro-scene-layer","micro-scene-visible");visible.setAttribute("viewBox","0 0 1400 900");visible.setAttribute("preserveAspectRatio","none");
      stage.insertBefore(visible,tokenLayer)
    }
    if(!master){
      master=document.createElementNS("http://www.w3.org/2000/svg","svg");master.id="microSceneMasterLayer";master.classList.add("micro-scene-layer","micro-scene-master");master.setAttribute("viewBox","0 0 1400 900");master.setAttribute("preserveAspectRatio","none");
      stage.insertBefore(master,tokenLayer)
    }
    master.hidden=!isMaster;
    return{visible,master}
  }

  function ensureCss(){if($("microSceneBuilderStyle"))return;const s=document.createElement("style");s.id="microSceneBuilderStyle";s.textContent=`
    .micro-scene-layer{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:4}.micro-scene-master{z-index:5}.micro-scene-visible{z-index:4}.micro-scene-segment{pointer-events:stroke;cursor:pointer;vector-effect:non-scaling-stroke;stroke-linecap:round}.micro-scene-segment.wall{stroke:#2b201b;stroke-width:7}.micro-scene-segment.door{stroke:#9a632d;stroke-width:8;stroke-dasharray:15 5}.micro-scene-segment.window{stroke:#4c92a8;stroke-width:7;stroke-dasharray:10 5}.micro-scene-master .micro-scene-segment{filter:drop-shadow(0 0 3px #b76be0);opacity:.82}.micro-scene-segment.selected{stroke:#f0c94d!important;stroke-width:11!important}.micro-scene-segment.open{opacity:.42;stroke-dasharray:5 9}.micro-scene-segment.half{stroke-dasharray:12 7;opacity:.72}.micro-scene-hit{stroke:transparent;stroke-width:24;pointer-events:stroke;cursor:pointer}.micro-scene-preview{stroke:#f2d36f;stroke-width:5;stroke-dasharray:9 6;pointer-events:none;vector-effect:non-scaling-stroke}.micro-builder-panel{margin-top:10px}.micro-builder-tools{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}.micro-builder-tools .active{background:#405d3e;color:white}.micro-builder-row{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}.micro-builder-status{font-size:.7rem;margin-top:7px;padding:7px;background:#fff8e7;border-left:4px solid #665080;border-radius:0 7px 7px 0}.micro-builder-selected{margin-top:8px;padding:7px;border:1px solid #a69272;border-radius:8px;background:#fffaf0}.micro-layer-chip{font-size:.62rem;border-radius:999px;padding:2px 6px;background:#665080;color:#fff;margin-left:4px}`;document.head.appendChild(s)}

  function behavior(el){
    const state=el.state||"closed";
    if(el.type==="wall")return{blocksVision:true,blocksMovement:true};
    if(el.type==="window")return state==="open"?{blocksVision:false,blocksMovement:false}:{blocksVision:false,blocksMovement:true};
    if(el.type==="door"){
      if(state==="open")return{blocksVision:false,blocksMovement:false};
      if(state==="half")return{blocksVision:false,blocksMovement:false};
      return{blocksVision:true,blocksMovement:true}
    }
    return{blocksVision:false,blocksMovement:false}
  }
  function normalize(el){const b=behavior(el);el.blocksVision=b.blocksVision;el.blocksMovement=b.blocksMovement;return el}

  function lineSvg(el){
    normalize(el);const state=el.state||"closed",sel=el.id===selectedId?" selected":"";
    return `<g data-scene-id="${esc(el.id)}"><line class="micro-scene-hit" x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}"></line><line class="micro-scene-segment ${el.type} ${state}${sel}" x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}"></line></g>`
  }
  function render(){
    const {visible,master}=ensureLayers();
    visible.innerHTML=scene.elements.filter(e=>e.layer!=="master").map(lineSvg).join("");
    master.innerHTML=isMaster?scene.elements.filter(e=>e.layer==="master").map(lineSvg).join(""):"";
    bindSegments(visible);if(isMaster)bindSegments(master);renderSelected()
  }
  function bindSegments(svg){
    svg.querySelectorAll("[data-scene-id]").forEach(g=>g.addEventListener("pointerdown",e=>{
      if(!isMaster||tool!=="select")return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();selectedId=g.dataset.sceneId;render()
    },true))
  }

  function stagePoint(e){const r=stage.getBoundingClientRect(),sx=r.width/(stage.offsetWidth||1400),sy=r.height/(stage.offsetHeight||900);return{x:(e.clientX-r.left)/sx,y:(e.clientY-r.top)/sy}}
  function snapPoint(p){
    if(!$("microBuilderSnap")?.checked)return p;
    const s=Math.max(20,+gridSize?.value||70),type=gridType?.value;
    if(type==="square")return{x:Math.round(p.x/(s/2))*(s/2),y:Math.round(p.y/(s/2))*(s/2)};
    if(type==="hex"&&globalThis.MICROCOSMOS_HEX_GRID?.snapPoint)return globalThis.MICROCOSMOS_HEX_GRID.snapPoint(p.x,p.y);
    return{x:Math.round(p.x/10)*10,y:Math.round(p.y/10)*10}
  }
  function ensurePreview(){const {visible}=ensureLayers();let line=$("microScenePreview");if(!line){line=document.createElementNS("http://www.w3.org/2000/svg","line");line.id="microScenePreview";line.setAttribute("class","micro-scene-preview");visible.appendChild(line)}return line}
  function removePreview(){$("microScenePreview")?.remove()}

  function defaultState(type){return type==="door"||type==="window"?"closed":"solid"}
  function drawStart(e){
    if(!isMaster||!["wall","door","window"].includes(tool)||e.target?.closest?.(".token"))return;
    const p=snapPoint(stagePoint(e));drawing={pointer:e.pointerId,start:p,end:p};selectedId="";const line=ensurePreview();line.setAttribute("x1",p.x);line.setAttribute("y1",p.y);line.setAttribute("x2",p.x);line.setAttribute("y2",p.y);e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
  }
  function drawMove(e){if(!drawing||drawing.pointer!==e.pointerId)return;const p=snapPoint(stagePoint(e));drawing.end=p;const l=$("microScenePreview");if(l){l.setAttribute("x2",p.x);l.setAttribute("y2",p.y)}e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
  function drawEnd(e){
    if(!drawing||drawing.pointer!==e.pointerId)return;const d=drawing;drawing=null;removePreview();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(Math.hypot(d.end.x-d.start.x,d.end.y-d.start.y)<8)return;
    const el=normalize({id:uid(),type:tool,layer:targetLayer,state:defaultState(tool),x1:+d.start.x.toFixed(1),y1:+d.start.y.toFixed(1),x2:+d.end.x.toFixed(1),y2:+d.end.y.toFixed(1)});scene.elements.push(el);selectedId=el.id;save();render()
  }
  function eraseAt(e){
    if(!isMaster||tool!=="erase")return;const g=e.target?.closest?.("[data-scene-id]");if(!g)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();scene.elements=scene.elements.filter(x=>x.id!==g.dataset.sceneId);if(selectedId===g.dataset.sceneId)selectedId="";save();render()
  }

  function setTool(next){tool=next;document.querySelectorAll("[data-scene-tool]").forEach(b=>b.classList.toggle("active",b.dataset.sceneTool===tool));const status=$("microBuilderStatus");if(status)status.innerHTML={select:"Clique em uma barreira para editar.",wall:"Clique e arraste no mapa para criar uma <b>Parede</b>.",door:"Clique e arraste para criar uma <b>Porta</b>.",window:"Clique e arraste para criar uma <b>Janela</b>.",erase:"Clique numa barreira para apagá-la."}[tool]||"";stage.style.cursor=tool==="select"?"default":"crosshair"}
  function setElementState(id,state){const el=scene.elements.find(x=>x.id===id);if(!el)return;el.state=state;normalize(el);save();render()}
  function setElementLayer(id,layer){const el=scene.elements.find(x=>x.id===id);if(!el)return;el.layer=layer;save();render()}
  function deleteSelected(){if(!selectedId)return;scene.elements=scene.elements.filter(x=>x.id!==selectedId);selectedId="";save();render()}

  function renderSelected(){
    const box=$("microBuilderSelected");if(!box)return;const el=selected();
    if(!el){box.innerHTML="<small>Nenhum elemento selecionado.</small>";return}
    const stateUi=el.type==="wall"?"<span>Estado: fixo</span>":`<label>Estado<select id="microElementState">${(el.type==="door"?[["closed","Fechada"],["half","Meia aberta"],["open","Aberta"],["locked","Trancada"]]:[["closed","Fechada"],["open","Aberta"]]).map(([v,n])=>`<option value="${v}" ${el.state===v?"selected":""}>${n}</option>`).join("")}</select></label>`;
    box.innerHTML=`<b>${el.type==="wall"?"🧱 Parede":el.type==="door"?"🚪 Porta":"🪟 Janela"}</b><span class="micro-layer-chip">${el.layer==="master"?"SÓ MESTRE":"VISÍVEL"}</span><div class="micro-builder-row">${stateUi}<label>Camada<select id="microElementLayer"><option value="players" ${el.layer!=="master"?"selected":""}>Jogadores</option><option value="master" ${el.layer==="master"?"selected":""}>Mestre</option></select></label></div><small>Visão: <b>${el.blocksVision?"bloqueia":"permite"}</b> • Movimento: <b>${el.blocksMovement?"bloqueia":"permite"}</b></small><button type="button" class="btn danger" id="microDeleteElement" style="width:100%;margin-top:6px">🗑️ Apagar elemento</button>`;
    $("microElementState")?.addEventListener("change",e=>setElementState(el.id,e.target.value));$("microElementLayer")?.addEventListener("change",e=>setElementLayer(el.id,e.target.value));$("microDeleteElement")?.addEventListener("click",deleteSelected)
  }

  function buildPanel(){
    if(!isMaster||$("microSceneBuilderPanel"))return;
    const panel=document.createElement("section");panel.className="panel micro-builder-panel";panel.id="microSceneBuilderPanel";panel.innerHTML=`<h3>🛠️ Construir Cenário</h3><div class="micro-builder-tools"><button class="btn active" data-scene-tool="select">🖱️ Selecionar</button><button class="btn" data-scene-tool="wall">🧱 Parede</button><button class="btn" data-scene-tool="door">🚪 Porta</button><button class="btn" data-scene-tool="window">🪟 Janela</button><button class="btn danger" data-scene-tool="erase">🧽 Apagar</button></div><div class="micro-builder-row"><label>Nova barreira<select id="microBuilderLayer"><option value="players">Camada Jogadores</option><option value="master">Camada Mestre</option></select></label><label><input id="microBuilderSnap" type="checkbox" checked> Ajustar ao Grid</label></div><div class="micro-builder-status" id="microBuilderStatus">Clique em uma barreira para editar.</div><div class="micro-builder-selected" id="microBuilderSelected"><small>Nenhum elemento selecionado.</small></div>`;
    left.appendChild(panel);panel.querySelectorAll("[data-scene-tool]").forEach(b=>b.addEventListener("click",()=>setTool(b.dataset.sceneTool)));$("microBuilderLayer").addEventListener("change",e=>targetLayer=e.target.value)
  }

  ensureCss();await resolveRole();ensureLayers();buildPanel();render();
  if(isMaster){
    stage.addEventListener("pointerdown",drawStart,true);stage.addEventListener("pointermove",drawMove,true);stage.addEventListener("pointerup",drawEnd,true);stage.addEventListener("pointercancel",()=>{drawing=null;removePreview()},true);stage.addEventListener("pointerdown",eraseAt,true)
  }

  globalThis.MICROCOSMOS_SCENE={
    get elements(){return scene.elements},get isMaster(){return isMaster},behavior,refresh:render,
    getBlockingVision:()=>scene.elements.filter(e=>normalize(e).blocksVision),
    getBlockingMovement:()=>scene.elements.filter(e=>normalize(e).blocksMovement),
    add:e=>{scene.elements.push(normalize({...e,id:e.id||uid()}));save();render()},
    remove:id=>{scene.elements=scene.elements.filter(e=>e.id!==id);save();render()}
  };
})();
