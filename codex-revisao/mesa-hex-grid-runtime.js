/* MICROCOSMOS — Grid Hexagonal Pontudo (pointy-top).
   Modelo oficial da Mesa: ponta em cima/baixo, linhas alternadas, 6 vizinhos
   equidistantes e 1 hex = 1,5 m. Substitui apenas o modo Hexagonal.
*/
(function(){
  if(globalThis.MICROCOSMOS_HEX_GRID_RUNTIME)return;
  globalThis.MICROCOSMOS_HEX_GRID_RUNTIME=true;

  const $=id=>document.getElementById(id);
  const gridType=$("gridType"),gridSize=$("gridSize"),gridLayer=$("gridLayer"),viewport=$("viewport"),stage=$("stage"),tokenLayer=$("tokenLayer");
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS||[],api=globalThis.MICROCOSMOS_TABLE_API||{};
  if(!gridType||!gridSize||!gridLayer||!viewport||!stage||!tokenLayer)return;
  const METERS_PER_HEX=1.5;
  let drag=null;

  function size(){return Math.max(20,+gridSize.value||70)}
  function geometry(){
    const w=size();
    const radius=w/Math.sqrt(3);
    const h=radius*2;
    const rowStep=h*.75;
    return{w,h,radius,rowStep}
  }
  function isHex(){return gridType.value==="hex"}
  function snapEnabled(){return !/OFF/i.test($("toggleSnap")?.textContent||"")}
  function targeting(){return document.body.classList.contains("micro-auto-target")||document.body.classList.contains("micro-target-mode")}

  function offsetFromPoint(x,y){
    const g=geometry();
    const row=Math.round(y/g.rowStep);
    const offset=(row&1)*g.w/2;
    const col=Math.round((x-offset)/g.w);
    return{col,row}
  }
  function centerFromOffset(col,row){
    const g=geometry();
    return{x:col*g.w+(row&1)*g.w/2,y:row*g.rowStep}
  }
  function snapPoint(x,y){
    const c=offsetFromPoint(x,y);
    return centerFromOffset(c.col,c.row)
  }
  function offsetToCube(col,row){
    const q=col-(row-(row&1))/2;
    const r=row;
    return{x:q,z:r,y:-q-r}
  }
  function cubeForPoint(p){const o=offsetFromPoint(+p.x||0,+p.y||0);return offsetToCube(o.col,o.row)}
  function hexDistance(a,b){
    const A=cubeForPoint(a),B=cubeForPoint(b);
    return Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y),Math.abs(A.z-B.z))
  }
  function distanceMeters(a,b){
    if(isHex())return hexDistance(a,b)*METERS_PER_HEX;
    const s=size();return Math.hypot((+a.x||0)-(+b.x||0),(+a.y||0)-(+b.y||0))/s*METERS_PER_HEX
  }

  function polygon(cx,cy,g){
    const r=g.radius,w=g.w;
    return[[cx,cy-r],[cx+w/2,cy-r/2],[cx+w/2,cy+r/2],[cx,cy+r],[cx-w/2,cy+r/2],[cx-w/2,cy-r/2]].map(p=>p.map(n=>Number(n.toFixed(2))).join(",")).join(" ")
  }
  function svgPattern(){
    const g=geometry(),W=g.w*2,H=g.rowStep*2;
    const centers=[
      [0,0],[g.w,0],[g.w*2,0],
      [g.w/2,g.rowStep],[g.w*1.5,g.rowStep],
      [0,g.rowStep*2],[g.w,g.rowStep*2],[g.w*2,g.rowStep*2]
    ];
    const polygons=centers.map(([x,y])=>`<polygon points="${polygon(x,y,g)}"/>`).join("");
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g fill="none" stroke="rgba(255,255,255,0.48)" stroke-width="1">${polygons}</g></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  }

  function ensureNote(){
    let note=$("microHexGridNote");
    if(!note){
      note=document.createElement("div");note.id="microHexGridNote";note.style.cssText="font-size:.72rem;color:#6d5a43;margin-top:5px;padding:6px 8px;border-left:4px solid #665080;background:#f1e8f5;border-radius:0 8px 8px 0";
      gridType.closest(".control")?.appendChild(note)
    }
    note.hidden=!isHex();
    if(isHex())note.textContent="⬡ Hex pontudo • 1 hex = 1,5 m • movimento em 6 direções"
  }
  function refreshVisual(){
    ensureNote();
    const option=[...gridType.options].find(o=>o.value==="hex");if(option)option.textContent="Hexagonal — pontudo";
    if(!isHex()){
      gridLayer.style.removeProperty("background-image");
      gridLayer.style.removeProperty("background-repeat");
      gridLayer.style.removeProperty("background-position");
      return
    }
    const g=geometry();
    gridLayer.className="grid-layer hex";
    gridLayer.style.backgroundImage=svgPattern();
    gridLayer.style.backgroundSize=`${g.w*2}px ${g.rowStep*2}px`;
    gridLayer.style.backgroundRepeat="repeat";
    gridLayer.style.backgroundPosition="0 0";
    gridLayer.style.opacity=".68"
  }

  function stagePoint(e){
    const r=stage.getBoundingClientRect();
    const sx=r.width/(stage.offsetWidth||1400),sy=r.height/(stage.offsetHeight||900);
    return{x:(e.clientX-r.left)/sx,y:(e.clientY-r.top)/sy}
  }
  function tokenPlayer(el){return players.find(p=>p.id===el?.dataset?.token)}

  // Em Hex + Snap ON assumimos o arrasto para impedir que a lógica antiga,
  // baseada no hex de topo reto, mova o token para centros incompatíveis.
  document.addEventListener("pointerdown",e=>{
    if(!isHex()||!snapEnabled()||targeting())return;
    const el=e.target?.closest?.("#tokenLayer [data-token]");if(!el)return;
    const p=tokenPlayer(el);if(!p)return;
    drag={pointer:e.pointerId,p,id:p.id};
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    try{api.selectToken?.(p.id)}catch(_e){}
  },true);
  document.addEventListener("pointermove",e=>{
    if(!drag||drag.pointer!==e.pointerId)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const pt=stagePoint(e),sn=snapPoint(pt.x,pt.y);
    drag.p.x=Math.max(25,Math.min((stage.offsetWidth||1400)-25,sn.x));
    drag.p.y=Math.max(25,Math.min((stage.offsetHeight||900)-25,sn.y));
    const el=tokenLayer.querySelector(`[data-token="${CSS.escape(drag.id)}"]`);if(el){el.style.left=`${drag.p.x}px`;el.style.top=`${drag.p.y}px`}
  },true);
  function endDrag(e){
    if(!drag||drag.pointer!==e.pointerId)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const id=drag.id;drag=null;
    try{api.renderTokens?.();api.selectToken?.(id)}catch(_e){}
  }
  document.addEventListener("pointerup",endDrag,true);
  document.addEventListener("pointercancel",e=>{if(drag?.pointer===e.pointerId)drag=null},true);

  // O controle principal já atualiza o grid; estes listeners apenas redesenham
  // a camada pointy-top logo depois da atualização original.
  gridType.addEventListener("change",()=>setTimeout(refreshVisual,0));
  gridSize.addEventListener("input",()=>setTimeout(refreshVisual,0));
  $("gridMinus")?.addEventListener("click",()=>setTimeout(refreshVisual,0));
  $("gridPlus")?.addEventListener("click",()=>setTimeout(refreshVisual,0));
  window.addEventListener("resize",refreshVisual);
  setTimeout(refreshVisual,0);

  globalThis.MICROCOSMOS_HEX_GRID={
    type:"pointy-top",metersPerHex:METERS_PER_HEX,geometry,snapPoint,offsetFromPoint,centerFromOffset,hexDistance,distanceMeters,refresh:refreshVisual
  };
})();
