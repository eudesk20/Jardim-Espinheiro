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
  let isMaster=false,tool="select",targetLayer="players",selectedId="",drawing=null,editing=null,partialErasing=null,scene={version:1,elements:[]};
  try{scene=JSON.parse(localStorage.getItem(STORE_KEY)||"null")||scene;if(!Array.isArray(scene.elements))scene.elements=[]}catch{}
  let lastSnapshot=JSON.stringify(scene),undoStack=[];

  function uid(){return crypto.randomUUID?.()||`geo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}
  function save(record=true){try{const next=JSON.stringify(scene);if(record&&next!==lastSnapshot){undoStack.push(lastSnapshot);if(undoStack.length>60)undoStack.shift()}lastSnapshot=next;localStorage.setItem(STORE_KEY,next);updateUndoButton()}catch(e){console.warn("MICROCOSMOS: não foi possível salvar cenário",e)}}
  function updateUndoButton(){const b=$("microSceneUndo");if(b){b.disabled=!undoStack.length;b.title=undoStack.length?`Desfazer última alteração (${undoStack.length} disponível${undoStack.length===1?"":"is"})`:"Nenhuma alteração para desfazer"}}
  function undoScene(){if(!undoStack.length)return;const previous=undoStack.pop();try{scene=JSON.parse(previous);if(!Array.isArray(scene.elements))scene.elements=[];lastSnapshot=previous;localStorage.setItem(STORE_KEY,previous);selectedId="";drawing=null;editing=null;globalThis.MICROCOSMOS_SCENE_EDITING=null;setTool("select");render();updateUndoButton()}catch(e){console.warn("MICROCOSMOS: não foi possível desfazer",e)}}
  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
  function selected(){return scene.elements.find(x=>x.id===selectedId)||null}
  function selectedTogether(el){const current=selected();return el.id===selectedId||!!(current?.groupId&&el.groupId===current.groupId)}

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
    .micro-scene-layer{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:4}.micro-scene-master{z-index:5}.micro-scene-visible{z-index:4}.micro-scene-segment{pointer-events:stroke;cursor:pointer;vector-effect:non-scaling-stroke;stroke-linecap:round}.micro-scene-segment.wall{stroke:#2b201b;stroke-width:7}.micro-scene-segment.door{stroke:#9a632d;stroke-width:8;stroke-dasharray:15 5}.micro-scene-segment.window{stroke:#4c92a8;stroke-width:7;stroke-dasharray:10 5}.micro-scene-master .micro-scene-segment{filter:drop-shadow(0 0 3px #b76be0);opacity:.82}.micro-scene-segment.selected{stroke:#f0c94d!important;stroke-width:11!important}.micro-scene-segment.open{opacity:.42;stroke-dasharray:5 9}.micro-scene-segment.half{stroke-dasharray:12 7;opacity:.72}.micro-scene-hit{stroke:transparent;stroke-width:24;pointer-events:stroke;cursor:pointer}.micro-scene-handle{fill:#fff8e7;stroke:#5f4725;stroke-width:3;vector-effect:non-scaling-stroke;pointer-events:all;cursor:grab}.micro-scene-handle.endpoint{fill:#f0c94d;cursor:crosshair}.micro-scene-handle.corner-both{fill:#76558f}.micro-scene-guide{stroke:#76558f;stroke-width:2;stroke-dasharray:4 3;pointer-events:none;vector-effect:non-scaling-stroke}.micro-scene-handle:active{cursor:grabbing}.micro-scene-preview{stroke:#f2d36f;stroke-width:5;stroke-dasharray:9 6;pointer-events:none;vector-effect:non-scaling-stroke}.micro-eraser-preview{position:absolute;z-index:20;pointer-events:none;border:2px dashed #ffdf74;background:#ffdf7433;transform:translate(-50%,-50%)}.micro-builder-panel{margin-top:10px}.micro-builder-tools{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}.micro-builder-tools .active{background:#405d3e;color:white}.micro-builder-row{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}.micro-builder-status{font-size:.7rem;margin-top:7px;padding:7px;background:#fff8e7;border-left:4px solid #665080;border-radius:0 7px 7px 0}.micro-builder-selected{margin-top:8px;padding:7px;border:1px solid #a69272;border-radius:8px;background:#fffaf0}.micro-builder-selected select{width:100%}.micro-layer-chip{font-size:.62rem;border-radius:999px;padding:2px 6px;background:#665080;color:#fff;margin-left:4px}`;document.head.appendChild(s)}

  function behavior(el){
    const state=el.state||"closed";
    if(el.type==="wall"||el.type==="circle")return{blocksVision:true,blocksMovement:true};
    if(el.type==="window")return state==="open"?{blocksVision:false,blocksMovement:false}:{blocksVision:false,blocksMovement:true};
    if(el.type==="door"){
      if(state==="open")return{blocksVision:false,blocksMovement:false};
      if(state==="half")return{blocksVision:false,blocksMovement:false};
      return{blocksVision:true,blocksMovement:true}
    }
    return{blocksVision:false,blocksMovement:false}
  }
  function normalize(el){const b=behavior(el);el.blocksVision=b.blocksVision;el.blocksMovement=b.blocksMovement;return el}

  function cornerGeom(points,i,controls={},rounded=false){const a=points[i-1],p=points[i],b=points[i+1],la=Math.hypot(p.x-a.x,p.y-a.y)||1,lb=Math.hypot(b.x-p.x,b.y-p.y)||1,base=rounded?Math.max(6,Math.min(24,(+gridSize?.value||70)*.22)):0,c=controls?.[i]||{},ri=Math.min(c.in??base,la*.48),ro=Math.min(c.out??base,lb*.48);return{before:{x:p.x-(p.x-a.x)/la*ri,y:p.y-(p.y-a.y)/la*ri},after:{x:p.x+(b.x-p.x)/lb*ro,y:p.y+(b.y-p.y)/lb*ro},ri,ro}}
  function pathD(points,rounded=false,controls={}){
    if(!points?.length)return"";if((!rounded&&!Object.keys(controls||{}).length)||points.length<3)return points.map((p,i)=>`${i?"L":"M"} ${p.x} ${p.y}`).join(" ");
    const out=[`M ${points[0].x} ${points[0].y}`];for(let i=1;i<points.length-1;i++){const p=points[i],{before,after}=cornerGeom(points,i,controls,rounded);out.push(`L ${before.x} ${before.y} Q ${p.x} ${p.y} ${after.x} ${after.y}`)}
    const end=points.at(-1);out.push(`L ${end.x} ${end.y}`);return out.join(" ")
  }
  function elementSvg(el){
    normalize(el);const state=el.state||"closed",sel=selectedTogether(el)?" selected":"",editingHandles=el.id===selectedId&&isMaster&&tool==="select";
    if(el.type==="circle"){
      const handles=editingHandles?`<circle class="micro-scene-handle" data-scene-handle="circle-move" cx="${el.cx}" cy="${el.cy}" r="10"></circle><circle class="micro-scene-handle endpoint" data-scene-handle="circle-radius" cx="${el.cx+el.r}" cy="${el.cy}" r="9"></circle>`:"";
      return `<g data-scene-id="${esc(el.id)}"><circle class="micro-scene-hit" cx="${el.cx}" cy="${el.cy}" r="${el.r}" fill="none"></circle><circle class="micro-scene-segment wall ${state}${sel}" cx="${el.cx}" cy="${el.cy}" r="${el.r}" fill="none"></circle>${handles}</g>`
    }
    if(el.shape==="polyline"&&Array.isArray(el.points)){
      const d=pathD(el.points,el.cornerStyle==="round",el.cornerControls),handles=editingHandles?el.points.map((p,i)=>{let extra="";if(i>0&&i<el.points.length-1){const actual=cornerGeom(el.points,i,el.cornerControls,el.cornerStyle==="round"),g=cornerGeom(el.points,i,{[i]:{in:Math.max(actual.ri,18),out:Math.max(actual.ro,18)}},false),both={x:(g.before.x+g.after.x)/2,y:(g.before.y+g.after.y)/2};extra=`<path class="micro-scene-guide" d="M ${g.before.x} ${g.before.y} L ${p.x} ${p.y} L ${g.after.x} ${g.after.y}"></path><circle class="micro-scene-handle" data-scene-handle="corner-side" data-corner-side="in" data-point-index="${i}" cx="${g.before.x}" cy="${g.before.y}" r="7"></circle><circle class="micro-scene-handle" data-scene-handle="corner-side" data-corner-side="out" data-point-index="${i}" cx="${g.after.x}" cy="${g.after.y}" r="7"></circle><circle class="micro-scene-handle corner-both" data-scene-handle="corner-both" data-point-index="${i}" cx="${both.x}" cy="${both.y}" r="7"></circle>`}return`${extra}<circle class="micro-scene-handle endpoint" data-scene-handle="point" data-point-index="${i}" cx="${p.x}" cy="${p.y}" r="9"></circle>`}).join(""):"";
      return `<g data-scene-id="${esc(el.id)}"><path class="micro-scene-hit" d="${d}" fill="none"></path><path class="micro-scene-segment wall ${state}${sel}" d="${d}" fill="none"></path>${handles}</g>`
    }
    const handles=editingHandles?`<circle class="micro-scene-handle endpoint" data-scene-handle="start" cx="${el.x1}" cy="${el.y1}" r="9"></circle><circle class="micro-scene-handle" data-scene-handle="move" cx="${(el.x1+el.x2)/2}" cy="${(el.y1+el.y2)/2}" r="10"></circle><circle class="micro-scene-handle endpoint" data-scene-handle="end" cx="${el.x2}" cy="${el.y2}" r="9"></circle>`:"";
    return `<g data-scene-id="${esc(el.id)}"><line class="micro-scene-hit" x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}"></line><line class="micro-scene-segment ${el.type} ${state}${sel}" x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}"></line>${handles}</g>`
  }
  function render(){
    const {visible,master}=ensureLayers();
    visible.innerHTML=scene.elements.filter(e=>e.layer!=="master").map(elementSvg).join("");
    master.innerHTML=isMaster?scene.elements.filter(e=>e.layer==="master").map(elementSvg).join(""):"";
    bindSegments(visible);if(isMaster)bindSegments(master);renderSelected()
  }
  function bindSegments(svg){
    svg.querySelectorAll("[data-scene-id]").forEach(g=>g.addEventListener("pointerdown",e=>{
      if(e.target?.closest?.("[data-scene-handle]")||!isMaster||tool!=="select")return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();selectedId=g.dataset.sceneId;render()
    },true));
    svg.querySelectorAll("[data-scene-handle]").forEach(handle=>handle.addEventListener("pointerdown",e=>{
      const g=handle.closest("[data-scene-id]"),el=scene.elements.find(x=>x.id===g?.dataset.sceneId);if(!isMaster||tool!=="select"||!el)return;
      const raw=stagePoint(e),p=handle.dataset.sceneHandle?.startsWith("corner-")?raw:snapPoint(raw);globalThis.MICROCOSMOS_SCENE_EDITING=el.id;editing={pointer:e.pointerId,id:el.id,mode:handle.dataset.sceneHandle,side:handle.dataset.cornerSide,index:+handle.dataset.pointIndex,start:p,initial:structuredClone(el)};stage.setPointerCapture?.(e.pointerId);e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
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
  function ensurePreview(){const {visible}=ensureLayers();let group=$("microScenePreview");if(!group){group=document.createElementNS("http://www.w3.org/2000/svg","g");group.id="microScenePreview";visible.appendChild(group)}return group}
  function removePreview(){$("microScenePreview")?.remove()}
  function renderPreview(cursor=null){
    if(!drawing)return;const group=ensurePreview(),end=cursor||drawing.end||drawing.start;
    if(drawing.type==="circle"){const r=Math.hypot(end.x-drawing.start.x,end.y-drawing.start.y);group.innerHTML=`<circle class="micro-scene-preview" cx="${drawing.start.x}" cy="${drawing.start.y}" r="${r}" fill="none"></circle>`;return}
    if(drawing.type==="pen"){const pts=[...(drawing.points||[]),...(end?[end]:[])];group.innerHTML=`<path class="micro-scene-preview" d="${pathD(pts,drawing.cornerStyle==="round")}" fill="none"></path>`;return}
    group.innerHTML=`<line class="micro-scene-preview" x1="${drawing.start.x}" y1="${drawing.start.y}" x2="${end.x}" y2="${end.y}"></line>`
  }

  function defaultState(type){return type==="door"||type==="window"?"closed":"solid"}
  function pointOn(el,t){return{x:el.x1+(el.x2-el.x1)*t,y:el.y1+(el.y2-el.y1)*t}}
  function wallOpeningMatch(opening){
    let best=null;const tolerance=Math.max(9,(+gridSize?.value||70)*.16);
    for(const wall of scene.elements.filter(e=>e.type==="wall"&&e.shape!=="polyline"&&e.layer===opening.layer)){
      const vx=wall.x2-wall.x1,vy=wall.y2-wall.y1,len2=vx*vx+vy*vy;if(len2<64)continue;
      const project=p=>({t:((p.x-wall.x1)*vx+(p.y-wall.y1)*vy)/len2,d:Math.abs((p.x-wall.x1)*vy-(p.y-wall.y1)*vx)/Math.sqrt(len2)}),a=project({x:opening.x1,y:opening.y1}),b=project({x:opening.x2,y:opening.y2});
      const lo=Math.max(0,Math.min(a.t,b.t)),hi=Math.min(1,Math.max(a.t,b.t)),overlap=(hi-lo)*Math.sqrt(len2);if(Math.max(a.d,b.d)>tolerance||overlap<8)continue;
      const score=Math.max(a.d,b.d)-overlap*.01;if(!best||score<best.score)best={wall,lo,hi,score}
    }
    return best
  }
  function straightWallPoints(el){if(el.type!=="wall"||el.type==="circle"||el.generatedFromErase||el.cornerStyle==="round"||el.cornerStyle==="custom"||Object.keys(el.cornerControls||{}).length)return null;return el.shape==="polyline"?(el.points||[]):[{x:el.x1,y:el.y1},{x:el.x2,y:el.y2}]}
  function mergeStraightWalls(){
    const tolerance=Math.max(8,(+gridSize?.value||70)*.14),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<=tolerance;let merged=true;
    while(merged){merged=false;outer:for(let i=0;i<scene.elements.length;i++){const a=scene.elements[i],ap=straightWallPoints(a);if(!ap?.length)continue;for(let j=i+1;j<scene.elements.length;j++){const b=scene.elements[j],bp=straightWallPoints(b);if(!bp?.length||a.layer!==b.layer)continue;let points=null;if(near(ap.at(-1),bp[0]))points=[...ap,...bp.slice(1)];else if(near(ap.at(-1),bp.at(-1)))points=[...ap,...bp.slice(0,-1).reverse()];else if(near(ap[0],bp.at(-1)))points=[...bp,...ap.slice(1)];else if(near(ap[0],bp[0]))points=[...bp.slice().reverse(),...ap.slice(1)];if(!points)continue;scene.elements.splice(j,1);scene.elements.splice(i,1,normalize({id:a.id,type:"wall",shape:"polyline",layer:a.layer,state:"solid",cornerStyle:"straight",cornerControls:{},points}));merged=true;break outer}}}
  }
  function insertElement(el){
    if(!["door","window"].includes(el.type)){scene.elements.push(el);mergeStraightWalls();return el}
    const match=wallOpeningMatch(el);if(!match){scene.elements.push(el);return el}
    const {wall,lo,hi}=match,a=pointOn(wall,lo),b=pointOn(wall,hi),minLength=8,index=scene.elements.indexOf(wall);scene.elements.splice(index,1);
    const before=Math.hypot(a.x-wall.x1,a.y-wall.y1),after=Math.hypot(wall.x2-b.x,wall.y2-b.y);
    if(before>=minLength)scene.elements.push(normalize({...wall,id:uid(),x2:+a.x.toFixed(1),y2:+a.y.toFixed(1)}));
    el.x1=+a.x.toFixed(1);el.y1=+a.y.toFixed(1);el.x2=+b.x.toFixed(1);el.y2=+b.y.toFixed(1);el.replacesWallId=wall.id;scene.elements.push(el);
    if(after>=minLength)scene.elements.push(normalize({...wall,id:uid(),x1:+b.x.toFixed(1),y1:+b.y.toFixed(1)}));
    return el
  }
  function drawStart(e){
    if(!isMaster||e.button>0||!["wall","door","window","circle","pen"].includes(tool)||e.target?.closest?.(".token"))return;
    const p=snapPoint(stagePoint(e)),drawType=tool,drawLayer=targetLayer;
    if(drawType==="pen"){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();selectedId="";
      if(!drawing){globalThis.MICROCOSMOS_SCENE_EDITING="drawing";drawing={type:"pen",layer:drawLayer,points:[p],end:p,cornerStyle:$("microBuilderCorner")?.value||"straight"}}
      else if(drawing.type==="pen"&&e.detail<2&&Math.hypot(p.x-drawing.points.at(-1).x,p.y-drawing.points.at(-1).y)>=4)drawing.points.push(p);
      renderPreview(p);if(e.detail>=2)finishPen();return
    }
    globalThis.MICROCOSMOS_SCENE_EDITING="drawing";drawing={pointer:e.pointerId,type:drawType,layer:drawLayer,start:p,end:p};selectedId="";
    renderPreview(p);
    try{stage.setPointerCapture?.(e.pointerId)}catch(_e){}
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
  }
  function drawMove(e){if(!drawing||drawing.type!=="pen"&&drawing.pointer!==e.pointerId)return;const p=snapPoint(stagePoint(e));drawing.end=p;renderPreview(p);e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
  function drawEnd(e){
    if(!drawing||drawing.type==="pen"||drawing.pointer!==e.pointerId)return;const d=drawing;drawing=null;globalThis.MICROCOSMOS_SCENE_EDITING=null;removePreview();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(Math.hypot(d.end.x-d.start.x,d.end.y-d.start.y)<8){setTool("select");render();return}
    const el=d.type==="circle"?normalize({id:uid(),type:"circle",layer:d.layer,state:"solid",cx:+d.start.x.toFixed(1),cy:+d.start.y.toFixed(1),r:+Math.hypot(d.end.x-d.start.x,d.end.y-d.start.y).toFixed(1)}):normalize({id:uid(),type:d.type,layer:d.layer,state:defaultState(d.type),x1:+d.start.x.toFixed(1),y1:+d.start.y.toFixed(1),x2:+d.end.x.toFixed(1),y2:+d.end.y.toFixed(1)});insertElement(el);autoFuseGroups();selectedId=el.id;save();setTool("select");render()
  }
  function finishPen(){
    if(!drawing||drawing.type!=="pen")return;const d=drawing,points=(d.points||[]).filter((p,i,a)=>!i||Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y)>=4);drawing=null;globalThis.MICROCOSMOS_SCENE_EDITING=null;removePreview();
    if(points.length<2){setTool("select");render();return}
    const el=normalize({id:uid(),type:"wall",shape:"polyline",layer:d.layer,state:"solid",cornerStyle:d.cornerStyle||"straight",cornerControls:{},points:points.map(p=>({x:+p.x.toFixed(1),y:+p.y.toFixed(1)}))});scene.elements.push(el);mergeStraightWalls();autoFuseGroups();selectedId=scene.elements.find(x=>x.id===el.id)?.id||"";save();setTool("select");render()
  }
  function eraseAt(e){
    if(!isMaster||tool!=="erase")return;const g=e.target?.closest?.("[data-scene-id]");if(!g)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const hit=scene.elements.find(x=>x.id===g.dataset.sceneId),group=hit?.groupId;scene.elements=scene.elements.filter(x=>group?x.groupId!==group:x.id!==g.dataset.sceneId);selectedId="";save();render()
  }
  function sampledPoints(el){let source=[];if(el.type==="circle"){const n=Math.max(48,Math.ceil(Math.PI*2*el.r/8));source=Array.from({length:n+1},(_,i)=>{const a=i/n*Math.PI*2;return{x:el.cx+Math.cos(a)*el.r,y:el.cy+Math.sin(a)*el.r}})}else if(el.shape==="polyline")source=el.points||[];else if(el.type==="wall")source=[{x:el.x1,y:el.y1},{x:el.x2,y:el.y2}];const out=[];for(let i=0;i<source.length-1;i++){const a=source[i],b=source[i+1],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/8));for(let j=0;j<n;j++)out.push({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n})}if(source.length)out.push(source.at(-1));return out}
  function simplifyPoints(points,tolerance=3){if(points.length<3)return points;const a=points[0],b=points.at(-1),vx=b.x-a.x,vy=b.y-a.y,len2=vx*vx+vy*vy||1;let max=0,index=0;for(let i=1;i<points.length-1;i++){const p=points[i],t=Math.max(0,Math.min(1,((p.x-a.x)*vx+(p.y-a.y)*vy)/len2)),d=Math.hypot(p.x-(a.x+vx*t),p.y-(a.y+vy*t));if(d>max){max=d;index=i}}if(max<=tolerance)return[a,b];const left=simplifyPoints(points.slice(0,index+1),tolerance),right=simplifyPoints(points.slice(index),tolerance);return[...left.slice(0,-1),...right]}
  function brushContains(p,c,size,shape){const h=size/2,dx=Math.abs(p.x-c.x),dy=Math.abs(p.y-c.y);return shape==="square"?dx<=h&&dy<=h:Math.hypot(dx,dy)<=h}
  function showEraserPreview(p,size,shape){let d=$("microPartialEraserPreview");if(!d){d=document.createElement("div");d.id="microPartialEraserPreview";d.className="micro-eraser-preview";stage.appendChild(d)}d.style.left=`${p.x}px`;d.style.top=`${p.y}px`;d.style.width=`${size}px`;d.style.height=`${size}px`;d.style.borderRadius=shape==="circle"?"50%":"3px"}
  function partialEraseAt(e){if(!isMaster||tool!=="partialErase")return;const p=stagePoint(e),size=+$("microEraserSize")?.value||70,shape=$("microEraserShape")?.value||"circle";showEraserPreview(p,size,shape);if(e.type==="pointerdown")partialErasing=e.pointerId;else if(partialErasing!==e.pointerId)return;let changed=false,next=[];for(const el of scene.elements){if(!(el.type==="circle"||el.type==="wall")){next.push(el);continue}const pts=sampledPoints(el);if(!pts.some(q=>brushContains(q,p,size,shape))){next.push(el);continue}changed=true;let run=[];const flush=()=>{if(run.length>1){const clean=simplifyPoints(run,3);if(clean.length>1)next.push(normalize({id:uid(),groupId:el.groupId,type:"wall",shape:"polyline",layer:el.layer,state:"solid",cornerStyle:"custom",cornerControls:{},generatedFromErase:true,points:clean}))}run=[]};for(const q of pts){if(brushContains(q,p,size,shape))flush();else run.push({x:+q.x.toFixed(1),y:+q.y.toFixed(1)})}flush()}if(changed){scene.elements=next;autoFuseGroups();selectedId="";save();render()}e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}
  function clearSelectionAt(e){
    if(!isMaster||tool!=="select"||!selectedId||e.target?.closest?.("[data-scene-id],[data-scene-handle],#tokenLayer [data-token]"))return;
    selectedId="";render()
  }

  function setTool(next){
    if(!["select","wall","door","window","circle","pen","erase","partialErase"].includes(next))return;
    if(next===tool&&next!=="select")next="select";
    drawing=null;partialErasing=null;globalThis.MICROCOSMOS_SCENE_EDITING=null;removePreview();$("microPartialEraserPreview")?.remove();tool=next;
    document.body.classList.toggle("micro-scene-building",["wall","door","window","circle","pen"].includes(tool));document.body.dataset.microSceneTool=tool;
    document.querySelectorAll("[data-scene-tool]").forEach(b=>{const active=b.dataset.sceneTool===tool;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
    const status=$("microBuilderStatus");if(status)status.innerHTML={select:"Clique em uma barreira para editar.",wall:"🧱 <b>Parede ativa.</b> Clique e arraste no mapa.",door:"🚪 <b>Porta ativa.</b> Clique e arraste no mapa.",window:"🪟 <b>Janela ativa.</b> Clique e arraste no mapa.",circle:"⭕ <b>Círculo ativo.</b> Arraste do centro até a borda.",pen:"✒️ <b>Caneta ativa.</b> Clique em cada direção; Enter ou duplo clique finaliza.",erase:"Clique numa barreira para apagá-la.",partialErase:"🧼 <b>Borracha parcial.</b> Arraste apenas sobre o trecho que deseja remover."}[tool]||"";stage.style.cursor=tool==="select"?"default":"crosshair"
  }
  function setElementState(id,state){const el=scene.elements.find(x=>x.id===id);if(!el)return;el.state=state;normalize(el);save();render()}
  function setElementLayer(id,layer){const el=scene.elements.find(x=>x.id===id);if(!el)return;el.layer=layer;save();render()}
  function setElementType(id,type){const el=scene.elements.find(x=>x.id===id);if(!el||!["wall","door","window"].includes(type))return;el.type=type;el.state=defaultState(type);normalize(el);save();render()}
  function deleteSelected(){if(!selectedId)return;const group=selected()?.groupId;scene.elements=scene.elements.filter(x=>group?x.groupId!==group:x.id!==selectedId);selectedId="";save();render()}

  function renderSelected(){
    const box=$("microBuilderSelected");if(!box)return;const el=selected();
    if(!el){box.innerHTML="<small>Nenhum elemento selecionado.</small>";return}
    const isPath=el.shape==="polyline",isCircle=el.type==="circle",stateUi=el.type==="wall"||isCircle?"<span>Estado: fixo</span>":`<label>Estado<select id="microElementState">${(el.type==="door"?[["closed","Fechada"],["half","Meia aberta"],["open","Aberta"],["locked","Trancada"]]:[["closed","Fechada"],["open","Aberta"]]).map(([v,n])=>`<option value="${v}" ${el.state===v?"selected":""}>${n}</option>`).join("")}</select></label>`;
    const typeUi=isPath||isCircle?`<label>Formato<input value="${isCircle?"Círculo":"Parede contínua"}" disabled></label>`:`<label>Tipo<select id="microElementType"><option value="wall" ${el.type==="wall"?"selected":""}>Parede</option><option value="door" ${el.type==="door"?"selected":""}>Porta</option><option value="window" ${el.type==="window"?"selected":""}>Janela</option></select></label>`;
    const cornerUi=isPath?`<label>Quinas<select id="microElementCorner"><option value="straight" ${el.cornerStyle!=="round"?"selected":""}>Retas</option><option value="round" ${el.cornerStyle==="round"?"selected":""}>Arredondadas</option></select></label>`:stateUi;
    box.innerHTML=`<b>${isCircle?"⭕ Círculo":isPath?"✒️ Parede contínua":el.type==="wall"?"🧱 Parede":el.type==="door"?"🚪 Porta":"🪟 Janela"}</b><span class="micro-layer-chip">${el.layer==="master"?"SÓ MESTRE":"VISÍVEL"}</span><div class="micro-builder-row">${typeUi}<label>Camada<select id="microElementLayer"><option value="players" ${el.layer!=="master"?"selected":""}>Jogadores</option><option value="master" ${el.layer==="master"?"selected":""}>Mestre</option></select></label></div><div class="micro-builder-row">${cornerUi}<small>${isCircle?"Arraste o centro para mover ou o ponto amarelo para alterar o raio.":isPath?"Arraste qualquer ponto amarelo para editar a direção.":"Arraste as pontas amarelas para redimensionar e o círculo central para mover."}</small></div><small>Visão: <b>${el.blocksVision?"bloqueia":"permite"}</b> • Movimento: <b>${el.blocksMovement?"bloqueia":"permite"}</b></small><button type="button" class="btn danger" id="microDeleteElement" style="width:100%;margin-top:6px">🗑️ Apagar elemento</button>`;
    $("microElementType")?.addEventListener("change",e=>setElementType(el.id,e.target.value));$("microElementState")?.addEventListener("change",e=>setElementState(el.id,e.target.value));$("microElementLayer")?.addEventListener("change",e=>setElementLayer(el.id,e.target.value));$("microDeleteElement")?.addEventListener("click",deleteSelected)
    $("microElementCorner")?.addEventListener("change",e=>{el.cornerStyle=e.target.value;save();render()})
  }

  function editMove(e){
    if(!editing||editing.pointer!==e.pointerId)return;const el=scene.elements.find(x=>x.id===editing.id);if(!el)return;const raw=stagePoint(e),p=editing.mode?.startsWith("corner-")?raw:snapPoint(raw),i=editing.initial;
    if(editing.mode==="point"&&el.points?.[editing.index])el.points[editing.index]={x:+p.x.toFixed(1),y:+p.y.toFixed(1)};
    else if((editing.mode==="corner-side"||editing.mode==="corner-both")&&el.points?.[editing.index]){const idx=editing.index,v=el.points[idx],a=el.points[idx-1],b=el.points[idx+1],side=editing.side,limit=(q)=>Math.min(Math.hypot(p.x-v.x,p.y-v.y),Math.hypot(q.x-v.x,q.y-v.y)*.48);el.cornerControls=el.cornerControls||{};const c=el.cornerControls[idx]||{in:0,out:0};if(editing.mode==="corner-both"){const amount=Math.min(limit(a),limit(b));c.in=amount;c.out=amount}else if(side==="in")c.in=limit(a);else c.out=limit(b);el.cornerControls[idx]=c;el.cornerStyle="custom"}
    else if(editing.mode==="circle-radius")el.r=+Math.max(8,Math.hypot(p.x-el.cx,p.y-el.cy)).toFixed(1);
    else if(editing.mode==="circle-move"){el.cx=+p.x.toFixed(1);el.cy=+p.y.toFixed(1)}
    else if(editing.mode==="start"){el.x1=+p.x.toFixed(1);el.y1=+p.y.toFixed(1)}else if(editing.mode==="end"){el.x2=+p.x.toFixed(1);el.y2=+p.y.toFixed(1)}else{const dx=p.x-editing.start.x,dy=p.y-editing.start.y;el.x1=+(i.x1+dx).toFixed(1);el.y1=+(i.y1+dy).toFixed(1);el.x2=+(i.x2+dx).toFixed(1);el.y2=+(i.y2+dy).toFixed(1)}
    render();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()
  }
  function editEnd(e){if(!editing||editing.pointer!==e.pointerId)return;editing=null;globalThis.MICROCOSMOS_SCENE_EDITING=null;autoFuseGroups();save();render();e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()}

  function blockingSegments(el){
    if(el.type==="circle"){
      const count=Math.max(20,Math.ceil((Math.PI*2*(+el.r||1))/24)),points=Array.from({length:count},(_,i)=>{const a=i/count*Math.PI*2;return{x:el.cx+Math.cos(a)*el.r,y:el.cy+Math.sin(a)*el.r}});
      return points.map((p,i)=>normalize({id:`${el.id}:circle:${i}`,parentId:el.id,type:"wall",layer:el.layer,state:"solid",x1:p.x,y1:p.y,x2:points[(i+1)%count].x,y2:points[(i+1)%count].y}))
    }
    if(el.shape==="polyline"&&Array.isArray(el.points))return el.points.slice(0,-1).map((p,i)=>normalize({id:`${el.id}:path:${i}`,parentId:el.id,type:"wall",layer:el.layer,state:"solid",x1:p.x,y1:p.y,x2:el.points[i+1].x,y2:el.points[i+1].y}));
    return[el]
  }
  function pointSegmentDistance(p,a,b){const vx=b.x-a.x,vy=b.y-a.y,len2=vx*vx+vy*vy||1,t=Math.max(0,Math.min(1,((p.x-a.x)*vx+(p.y-a.y)*vy)/len2));return Math.hypot(p.x-(a.x+vx*t),p.y-(a.y+vy*t))}
  function segmentsTouch(a,b,tolerance){const orient=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x),boxes=Math.max(Math.min(a.a.x,a.b.x),Math.min(b.a.x,b.b.x))<=Math.min(Math.max(a.a.x,a.b.x),Math.max(b.a.x,b.b.x))+tolerance&&Math.max(Math.min(a.a.y,a.b.y),Math.min(b.a.y,b.b.y))<=Math.min(Math.max(a.a.y,a.b.y),Math.max(b.a.y,b.b.y))+tolerance,cross=boxes&&orient(a.a,a.b,b.a)*orient(a.a,a.b,b.b)<=0&&orient(b.a,b.b,a.a)*orient(b.a,b.b,a.b)<=0;if(cross)return true;return Math.min(pointSegmentDistance(a.a,b.a,b.b),pointSegmentDistance(a.b,b.a,b.b),pointSegmentDistance(b.a,a.a,a.b),pointSegmentDistance(b.b,a.a,a.b))<=tolerance}
  function autoFuseGroups(){
    const walls=scene.elements.filter(e=>e.type==="wall"||e.type==="circle"),parent=walls.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i])),join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a},tolerance=Math.max(6,(+gridSize?.value||70)*.1),segments=walls.map(el=>blockingSegments(el).map(s=>({a:{x:s.x1,y:s.y1},b:{x:s.x2,y:s.y2}})));
    for(let i=0;i<walls.length;i++)for(let j=i+1;j<walls.length;j++){if(walls[i].layer!==walls[j].layer)continue;if(walls[i].groupId&&walls[i].groupId===walls[j].groupId){join(i,j);continue}if(segments[i].some(a=>segments[j].some(b=>segmentsTouch(a,b,tolerance))))join(i,j)}
    let changed=false;const components=new Map();walls.forEach((el,i)=>{const root=find(i);if(!components.has(root))components.set(root,[]);components.get(root).push(el)});for(const list of components.values()){if(list.length<2)continue;const group=list.find(x=>x.groupId)?.groupId||uid();for(const el of list)if(el.groupId!==group){el.groupId=group;changed=true}}return changed
  }

  function buildPanel(){
    if(!isMaster||$("microSceneBuilderPanel"))return;
    const panel=document.createElement("section");panel.className="panel micro-builder-panel";panel.id="microSceneBuilderPanel";panel.innerHTML=`<h3>🛠️ Construir Cenário</h3><button type="button" class="btn" id="microSceneUndo" style="width:100%;margin-bottom:7px" disabled>↶ Desfazer última alteração</button><div class="micro-builder-tools"><button type="button" class="btn active" data-scene-tool="select">🖱️ Selecionar</button><button type="button" class="btn" data-scene-tool="wall">🧱 Parede</button><button type="button" class="btn" data-scene-tool="door">🚪 Porta</button><button type="button" class="btn" data-scene-tool="window">🪟 Janela</button><button type="button" class="btn" data-scene-tool="circle">⭕ Círculo</button><button type="button" class="btn" data-scene-tool="pen">✒️ Caneta</button><button type="button" class="btn danger" data-scene-tool="erase">🧽 Apagar peça</button><button type="button" class="btn danger" data-scene-tool="partialErase">🧼 Borracha parcial</button></div><div class="micro-builder-row"><label>Nova barreira<select id="microBuilderLayer"><option value="players">Camada Jogadores</option><option value="master">Camada Mestre</option></select></label><label><input id="microBuilderSnap" type="checkbox" checked> Ajustar ao Grid</label></div><div class="micro-builder-row"><label>Quinas da Caneta<select id="microBuilderCorner"><option value="straight">Retas</option><option value="round">Arredondadas</option></select></label><small>Enter ou duplo clique finaliza.</small></div><div class="micro-builder-row"><label>Formato da Borracha<select id="microEraserShape"><option value="circle">Circular</option><option value="square">Quadrada</option></select></label><label>Tamanho<input id="microEraserSize" type="range" min="20" max="180" value="70"></label></div><div class="micro-builder-status" id="microBuilderStatus">Clique em uma barreira para editar.</div><div class="micro-builder-selected" id="microBuilderSelected"><small>Nenhum elemento selecionado.</small></div>`;
    left.appendChild(panel);panel.querySelectorAll("[data-scene-tool]").forEach(b=>{
      const activate=e=>{e.preventDefault();e.stopPropagation();setTool(b.dataset.sceneTool)};
      b.addEventListener("pointerdown",activate,true);b.addEventListener("click",e=>{if(e.detail===0)activate(e);else{e.preventDefault();e.stopPropagation()}},true)
    });$("microSceneUndo").addEventListener("click",undoScene);$("microBuilderLayer").addEventListener("change",e=>targetLayer=e.target.value);setTool("select");updateUndoButton()
  }

  ensureCss();await resolveRole();ensureLayers();buildPanel();if(isMaster&&autoFuseGroups())save();render();
  if(isMaster){
    stage.addEventListener("pointerdown",drawStart,true);stage.addEventListener("pointerdown",clearSelectionAt,true);stage.addEventListener("pointermove",editMove,true);stage.addEventListener("pointermove",drawMove,true);stage.addEventListener("pointerup",editEnd,true);stage.addEventListener("pointerup",drawEnd,true);stage.addEventListener("pointercancel",()=>{drawing=null;editing=null;globalThis.MICROCOSMOS_SCENE_EDITING=null;removePreview();setTool("select");render()},true);stage.addEventListener("pointerdown",eraseAt,true);
    stage.addEventListener("pointerdown",partialEraseAt,true);stage.addEventListener("pointermove",partialEraseAt,true);stage.addEventListener("pointerup",e=>{if(partialErasing===e.pointerId)partialErasing=null},true);stage.addEventListener("pointerleave",()=>$("microPartialEraserPreview")?.remove(),true);
    window.addEventListener("pointermove",drawMove,true);window.addEventListener("pointerup",drawEnd,true)
    window.addEventListener("keydown",e=>{
      if(e.key==="Enter"&&drawing?.type==="pen"){e.preventDefault();finishPen();return}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();undoScene();return}
      if(e.key!=="Escape"||!drawing&&!editing&&tool==="select")return;e.preventDefault();drawing=null;editing=null;globalThis.MICROCOSMOS_SCENE_EDITING=null;removePreview();setTool("select");render()
    },true)
    new ResizeObserver(()=>render()).observe(stage)
  }

  globalThis.MICROCOSMOS_SCENE={
    get elements(){return scene.elements},get isMaster(){return isMaster},behavior,refresh:render,
    getBlockingVision:()=>scene.elements.filter(e=>normalize(e).blocksVision).flatMap(blockingSegments),
    getBlockingMovement:()=>scene.elements.filter(e=>normalize(e).blocksMovement).flatMap(blockingSegments),
    add:e=>{const el=normalize({...e,id:e.id||uid()});insertElement(el);save();render();return el},
    remove:id=>{scene.elements=scene.elements.filter(e=>e.id!==id);save();render()}
  };
})();
