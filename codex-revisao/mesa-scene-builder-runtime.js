/* MICROCOSMOS — Camadas + Construtor de Cenário (Bloco 1).
   Base para Campo de Visão, iluminação, Fog of War e colisão.
   Mestre: Selecionar | Parede | Porta | Janela | Apagar.
   Cada segmento registra camada, estado e se bloqueia visão/movimento.
*/
(async function(){
  if(globalThis.MICROCOSMOS_SCENE_BUILDER)return;
  globalThis.MICROCOSMOS_SCENE_BUILDER=true;

  const $=id=>document.getElementById(id),viewport=$("viewport"),stage=$("stage"),gridLayer=$("gridLayer"),tokenLayer=$("tokenLayer"),left=$("leftPanel"),gridType=$("gridType"),gridSize=$("gridSize");
  if(!stage||!gridLayer||!tokenLayer||!left)return;
  const STORE_KEY="MICROCOSMOS_SCENE_GEOMETRY_V1";
  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  let isMaster=false,tool="select",targetLayer="players",selectedId="",drawing=null,editing=null,scene={version:1,elements:[]};
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
      visible=document.createElementNS("http://www.w3.org/2000/svg","svg");visible.id="microSceneVisibleLayer";visible.classList.add("micro-scene-layer","micro-scene-visible");visible.setAttribute("preserveAspectRatio","none");
      stage.insertBefore(visible,tokenLayer)
    }
    if(!master){
      master=document.createElementNS("http://www.w3.org/2000/svg","svg");master.id="microSceneMasterLayer";master.classList.add("micro-scene-layer","micro-scene-master");master.setAttribute("preserveAspectRatio","none");
      stage.insertBefore(master,tokenLayer)
    }
    const viewBox=`0 0 ${stage.offsetWidth||1400} ${stage.offsetHeight||900}`;
    if(visible.getAttribute("viewBox")!==viewBox)visible.setAttribute("viewBox",viewBox);
    if(master.getAttribute("viewBox")!==viewBox)master.setAttribute("viewBox",viewBox);
    master.hidden=!isMaster;
    return{visible,master}
  }

  function ensureCss(){if($("microSceneBuilderStyle"))return;const s=document.createElement("style");s.id="microSceneBuilderStyle";s.textContent=`
    .micro-scene-layer{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:4}.micro-scene-master{z-index:5}.micro-scene-visible{z-index:4}.micro-scene-segment{pointer-events:stroke;cursor:pointer;vector-effect:non-scaling-stroke;stroke-linecap:round}.micro-scene-segment.wall{stroke:#2b201b;stroke-width:7}.micro-scene-segment.door{stroke:#9a632d;stroke-width:8;stroke-dasharray:15 5}.micro-scene-segment.window{stroke:#4c92a8;stroke-width:7;stroke-dasharray:10 5}.micro-scene-master .micro-scene-segment{filter:drop-shadow(0 0 3px #b76be0);opacity:.82}.micro-scene-segment.selected{stroke:#f0c94d!important;stroke-width:11!important}.micro-scene-segment.open{opacity:.42;stroke-dasharray:5 9}.micro-scene-segment.half{stroke-dasharray:12 7;opacity:.72}.micro-scene-hit{stroke:transparent;stroke-width:24;pointer-events:stroke;cursor:pointer}.micro-scene-handle{fill:#fff8e7;stroke:#5f4725;stroke-width:3;vector-effect:non-scaling-stroke;pointer-events:all;cursor:grab}.micro-scene-handle.endpoint{fill:#f0c94d;cursor:crosshair}.micro-scene-handle:active{cursor:grabbing}.micro-scene-preview{stroke:#f2d36f;stroke-width:5;stroke-dasharray:9 6;pointer-events:none;vector-effect:non-scaling-stroke}.micro-builder-panel{margin-top:10px}.micro-builder-tools{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}.micro-builder-tools .active{background:#405d3e;color:white}.micro-builder-row{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}.micro-builder-status{font-size:.7rem;margin-top:7px;padding:7px;background:#fff8e7;border-left:4px solid #665080;border-radius:0 7px 7px 0}.micro-builder-selected{margin-top:8px;padding:7px;border:1px solid #a69272;border-radius:8px;background:#fffaf0}.micro-builder-selected select{width:100%}.micro-layer-chip{font-size:.62rem;border-radius:999px;padding:2px 6px;background:#665080;color:#fff;margin-left:4px}`;document.head.appendChild(s)}

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
    const handles=el.id===selectedId&&isMaster&&tool==="select"?`<circle class="micro-scene-handle endpoint" data-scene-handle="start" cx="${el.x1}" cy="${el.y1}" r="9"></circle><circle class="micro-scene-handle" data-scene-handle="move" cx="${(el.x1+el.x2)/2}" cy="${(el.y1+el.y2)/2}" r="10"></circle><circle class="micro-scene-handle endpoint" data-scene-handle="end" cx="${el.x2}" cy="${el.y2}" r="9"></circle>`:"";
    return `<g data-scene-id="${esc(el.id)}"><line class="micro-scene-hit" x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}"></line><line class="micro-scene-segment ${el.type} ${state}${sel}" x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}"></line>${handles}</g>`
  }
  function render(){
    const {visible,master}=ensureLayers();
    visible.innerHTML=scene.elements.filter(e=>e.layer!=="master").map(lineSvg).join("");
    master.innerHTML=isMaster?scene.elements.filter(e=>e.layer==="master").map(lineSvg).join(""):"";
    bindSegments(visible);if(isMaster)bindSegments(master);renderSelected()
  }
  function bindSegments(svg){
    svg.querySelectorAll("[data-scene-id]").forEach(g=>g.addEventListener("pointerdown",e=>{
      if(e.target?.closest?.("[data-scene-handle]")||!isMaster||tool!=="select")return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();selectedId=g.dataset.sceneId;render()
    },true));
    svg.querySelectorAll("[data-scene-handle]").forEach(handle=>handle.addEventListener("pointerdown",e=>{
      const g=handle.closest("[data-scene-id]"),el=scene.elements.find(x=>x.id===g?.dataset.sceneId);if(!isMaster||tool!=="select"||!el)return;
      const p=snapPoint(stagePoint(e));globalThis.MICROCOSMOS_SCENE_EDITING=el.id;editing={pointer:e.pointerId,id:el.id,mode:handle.dataset.sceneHandle,start:p,initial:{x1:el.x1,y1:el.y1,x2:el.x2,y2:el.y2}};stage.setPointerCapture?.(e.pointerId);e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
    },true))
  }

  function stagePoint(e){
    // Converte o cursor pela transformação real aplicada ao Stage. Isso separa
    // corretamente o pan/zoom da posição da camada SVG e mantém o traço no cursor.
    const vr=viewport.getBoundingClientRect(),style=getComputedStyle(stage),matrix=new DOMMatrixReadOnly(style.transform==="none"?"matrix(1,0,0,1,0,0)":style.transform),inverse=matrix.inverse();
    const point=new DOMPoint(e.clientX-vr.left-viewport.clientLeft-stage.offsetLeft,e.clientY-vr.top-viewport.clientTop-stage.offsetTop).matrixTransform(inverse);
    return{x:point.x,y:point.y}
  }
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
  function pointOn(el,t){return{x:el.x1+(el.x2-el.x1)*t,y:el.y1+(el.y2-el.y1)*t}}
  function wallOpeningMatch(opening){
    let best=null;const tolerance=Math.max(9,(+gridSize?.value||70)*.16);
    for(const wall of scene.elements.filter(e=>e.type==="wall"&&e.layer===opening.layer)){
      const vx=wall.x2-wall.x1,vy=wall.y2-wall.y1,len2=vx*vx+vy*vy;if(len2<64)continue;
      const project=p=>({t:((p.x-wall.x1)*vx+(p.y-wall.y1)*vy)/len2,d:Math.abs((p.x-wall.x1)*vy-(p.y-wall.y1)*vx)/Math.sqrt(len2)}),a=project({x:opening.x1,y:opening.y1}),b=project({x:opening.x2,y:opening.y2});
      const lo=Math.max(0,Math.min(a.t,b.t)),hi=Math.min(1,Math.max(a.t,b.t)),overlap=(hi-lo)*Math.sqrt(len2);if(Math.max(a.d,b.d)>tolerance||overlap<8)continue;
      const score=Math.max(a.d,b.d)-overlap*.01;if(!best||score<best.score)best={wall,lo,hi,score}
    }
    return best
  }
  function insertElement(el){
    if(!["door","window"].includes(el.type)){scene.elements.push(el);return el}
    const match=wallOpeningMatch(el);if(!match){scene.elements.push(el);return el}
    const {wall,lo,hi}=match,a=pointOn(wall,lo),b=pointOn(wall,hi),minLength=8,index=scene.elements.indexOf(wall);scene.elements.splice(index,1);
    const before=Math.hypot(a.x-wall.x1,a.y-wall.y1),after=Math.hypot(wall.x2-b.x,wall.y2-b.y);
    if(before>=minLength)scene.elements.push(normalize({...wall,id:uid(),x2:+a.x.toFixed(1),y2:+a.y.toFixed(1)}));
    el.x1=+a.x.toFixed(1);el.y1=+a.y.toFixed(1);el.x2=+b.x.toFixed(1);el.y2=+b.y.toFixed(1);el.replacesWallId=wall.id;scene.elements.push(el);
    if(after>=minLength)scene.elements.push(normalize({...wall,id:uid(),x1:+b.x.toFixed(1),y1:+b.y.toFixed(1)}));
    return el
  }
  function drawStart(e){
    if(!isMaster||e.button>0||!["wall","door","window"].includes(tool)||e.target?.closest?.(".token"))return;
    const p=snapPoint(stagePoint(e)),drawType=tool,drawLayer=targetLayer;
    globalThis.MICROCOSMOS_SCENE_EDITING="drawing";drawing={pointer:e.pointerId,type:drawType,layer:drawLayer,start:p,end:p};selectedId="";
    const line=ensurePreview();line.setAttribute("class",`micro-scene-preview ${drawType}`);line.setAttribute("x1",p.x);line.setAttribute("y1",p.y);line.setAttribute("x2",p.x);line.setAttribute("y2",p.y);
    try{stage.setPointerCapture?.(e.pointerId)}catch(_e){}
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
  }
  function drawMove(e){if(!drawing||drawing.pointer!==e.pointerId)return;const p=snapPoint(stagePoint(e));drawing.end=p;const l=$("microScenePreview");if(l){l.setAttribute("x2",p.x);l.setAttribute("y2",p.y)}e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
  function drawEnd(e){
    if(!drawing||drawing.pointer!==e.pointerId)return;const d=drawing;drawing=null;globalThis.MICROCOSMOS_SCENE_EDITING=null;removePreview();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(Math.hypot(d.end.x-d.start.x,d.end.y-d.start.y)<8)return;
    const el=normalize({id:uid(),type:d.type,layer:d.layer,state:defaultState(d.type),x1:+d.start.x.toFixed(1),y1:+d.start.y.toFixed(1),x2:+d.end.x.toFixed(1),y2:+d.end.y.toFixed(1)});insertElement(el);selectedId=el.id;save();setTool("select");render()
  }
  function eraseAt(e){
    if(!isMaster||tool!=="erase")return;const g=e.target?.closest?.("[data-scene-id]");if(!g)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();scene.elements=scene.elements.filter(x=>x.id!==g.dataset.sceneId);if(selectedId===g.dataset.sceneId)selectedId="";save();render()
  }
  function clearSelectionAt(e){
    if(!isMaster||tool!=="select"||!selectedId||e.target?.closest?.("[data-scene-id],[data-scene-handle],#tokenLayer [data-token]"))return;
    selectedId="";render()
  }

  function setTool(next){
    if(!["select","wall","door","window","erase"].includes(next))return;
    if(next===tool&&next!=="select")next="select";
    drawing=null;globalThis.MICROCOSMOS_SCENE_EDITING=null;removePreview();tool=next;
    document.body.classList.toggle("micro-scene-building",["wall","door","window"].includes(tool));document.body.dataset.microSceneTool=tool;
    document.querySelectorAll("[data-scene-tool]").forEach(b=>{const active=b.dataset.sceneTool===tool;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
    const status=$("microBuilderStatus");if(status)status.innerHTML={select:"Clique em uma barreira para editar.",wall:"🧱 <b>Parede ativa.</b> Clique e arraste no mapa.",door:"🚪 <b>Porta ativa.</b> Clique e arraste no mapa.",window:"🪟 <b>Janela ativa.</b> Clique e arraste no mapa.",erase:"Clique numa barreira para apagá-la."}[tool]||"";stage.style.cursor=tool==="select"?"default":"crosshair"
  }
  function setElementState(id,state){const el=scene.elements.find(x=>x.id===id);if(!el)return;el.state=state;normalize(el);save();render()}
  function setElementLayer(id,layer){const el=scene.elements.find(x=>x.id===id);if(!el)return;el.layer=layer;save();render()}
  function setElementType(id,type){const el=scene.elements.find(x=>x.id===id);if(!el||!["wall","door","window"].includes(type))return;el.type=type;el.state=defaultState(type);normalize(el);save();render()}
  function deleteSelected(){if(!selectedId)return;scene.elements=scene.elements.filter(x=>x.id!==selectedId);selectedId="";save();render()}

  function renderSelected(){
    const box=$("microBuilderSelected");if(!box)return;const el=selected();
    if(!el){box.innerHTML="<small>Nenhum elemento selecionado.</small>";return}
    const stateUi=el.type==="wall"?"<span>Estado: fixo</span>":`<label>Estado<select id="microElementState">${(el.type==="door"?[["closed","Fechada"],["half","Meia aberta"],["open","Aberta"],["locked","Trancada"]]:[["closed","Fechada"],["open","Aberta"]]).map(([v,n])=>`<option value="${v}" ${el.state===v?"selected":""}>${n}</option>`).join("")}</select></label>`;
    box.innerHTML=`<b>${el.type==="wall"?"🧱 Parede":el.type==="door"?"🚪 Porta":"🪟 Janela"}</b><span class="micro-layer-chip">${el.layer==="master"?"SÓ MESTRE":"VISÍVEL"}</span><div class="micro-builder-row"><label>Tipo<select id="microElementType"><option value="wall" ${el.type==="wall"?"selected":""}>Parede</option><option value="door" ${el.type==="door"?"selected":""}>Porta</option><option value="window" ${el.type==="window"?"selected":""}>Janela</option></select></label><label>Camada<select id="microElementLayer"><option value="players" ${el.layer!=="master"?"selected":""}>Jogadores</option><option value="master" ${el.layer==="master"?"selected":""}>Mestre</option></select></label></div><div class="micro-builder-row">${stateUi}<small>Arraste as pontas amarelas para redimensionar e o círculo central para mover.</small></div><small>Visão: <b>${el.blocksVision?"bloqueia":"permite"}</b> • Movimento: <b>${el.blocksMovement?"bloqueia":"permite"}</b></small><button type="button" class="btn danger" id="microDeleteElement" style="width:100%;margin-top:6px">🗑️ Apagar elemento</button>`;
    $("microElementType")?.addEventListener("change",e=>setElementType(el.id,e.target.value));$("microElementState")?.addEventListener("change",e=>setElementState(el.id,e.target.value));$("microElementLayer")?.addEventListener("change",e=>setElementLayer(el.id,e.target.value));$("microDeleteElement")?.addEventListener("click",deleteSelected)
  }

  function editMove(e){
    if(!editing||editing.pointer!==e.pointerId)return;const el=scene.elements.find(x=>x.id===editing.id);if(!el)return;const p=snapPoint(stagePoint(e)),i=editing.initial;
    if(editing.mode==="start"){el.x1=+p.x.toFixed(1);el.y1=+p.y.toFixed(1)}else if(editing.mode==="end"){el.x2=+p.x.toFixed(1);el.y2=+p.y.toFixed(1)}else{const dx=p.x-editing.start.x,dy=p.y-editing.start.y;el.x1=+(i.x1+dx).toFixed(1);el.y1=+(i.y1+dy).toFixed(1);el.x2=+(i.x2+dx).toFixed(1);el.y2=+(i.y2+dy).toFixed(1)}
    render();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
  }
  function editEnd(e){if(!editing||editing.pointer!==e.pointerId)return;editing=null;globalThis.MICROCOSMOS_SCENE_EDITING=null;save();render();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}

  function buildPanel(){
    if(!isMaster||$("microSceneBuilderPanel"))return;
    const panel=document.createElement("section");panel.className="panel micro-builder-panel";panel.id="microSceneBuilderPanel";panel.innerHTML=`<h3>🛠️ Construir Cenário</h3><div class="micro-builder-tools"><button type="button" class="btn active" data-scene-tool="select">🖱️ Selecionar</button><button type="button" class="btn" data-scene-tool="wall">🧱 Parede</button><button type="button" class="btn" data-scene-tool="door">🚪 Porta</button><button type="button" class="btn" data-scene-tool="window">🪟 Janela</button><button type="button" class="btn danger" data-scene-tool="erase">🧽 Apagar</button></div><div class="micro-builder-row"><label>Nova barreira<select id="microBuilderLayer"><option value="players">Camada Jogadores</option><option value="master">Camada Mestre</option></select></label><label><input id="microBuilderSnap" type="checkbox" checked> Ajustar ao Grid</label></div><div class="micro-builder-status" id="microBuilderStatus">Clique em uma barreira para editar.</div><div class="micro-builder-selected" id="microBuilderSelected"><small>Nenhum elemento selecionado.</small></div>`;
    left.appendChild(panel);panel.querySelectorAll("[data-scene-tool]").forEach(b=>{
      const activate=e=>{e.preventDefault();e.stopPropagation();setTool(b.dataset.sceneTool)};
      b.addEventListener("pointerdown",activate,true);b.addEventListener("click",e=>{if(e.detail===0)activate(e);else{e.preventDefault();e.stopPropagation()}},true)
    });$("microBuilderLayer").addEventListener("change",e=>targetLayer=e.target.value);setTool("select")
  }

  ensureCss();await resolveRole();ensureLayers();buildPanel();render();
  if(isMaster){
    stage.addEventListener("pointerdown",drawStart,true);stage.addEventListener("pointerdown",clearSelectionAt,true);stage.addEventListener("pointermove",editMove,true);stage.addEventListener("pointermove",drawMove,true);stage.addEventListener("pointerup",editEnd,true);stage.addEventListener("pointerup",drawEnd,true);stage.addEventListener("pointercancel",()=>{drawing=null;editing=null;globalThis.MICROCOSMOS_SCENE_EDITING=null;removePreview();setTool("select");render()},true);stage.addEventListener("pointerdown",eraseAt,true);
    window.addEventListener("pointermove",drawMove,true);window.addEventListener("pointerup",drawEnd,true)
    window.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(!drawing&&tool==="select")return;e.preventDefault();drawing=null;editing=null;globalThis.MICROCOSMOS_SCENE_EDITING=null;removePreview();setTool("select");render()},true)
    new ResizeObserver(()=>render()).observe(stage)
  }

  globalThis.MICROCOSMOS_SCENE={
    get elements(){return scene.elements},get isMaster(){return isMaster},behavior,refresh:render,
    getBlockingVision:()=>scene.elements.filter(e=>normalize(e).blocksVision),
    getBlockingMovement:()=>scene.elements.filter(e=>normalize(e).blocksMovement),
    add:e=>{const el=normalize({...e,id:e.id||uid()});insertElement(el);save();render();return el},
    remove:id=>{scene.elements=scene.elements.filter(e=>e.id!==id);save();render()}
  };
})();
