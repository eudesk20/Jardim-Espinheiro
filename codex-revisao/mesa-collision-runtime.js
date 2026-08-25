/* MICROCOSMOS — Colisão real de movimento com o cenário (Bloco 2).
   Usa as linhas do Construtor de Cenário como barreiras mecânicas.
   - Parede: bloqueia movimento.
   - Porta fechada/trancada: bloqueia; aberta/meia aberta: permite.
   - Janela fechada: bloqueia; aberta: permite.
   - Considera o tamanho mecânico do token e funciona em quadrado/hex/sem grid.
*/
(function(){
  if(globalThis.MICROCOSMOS_MESA_COLLISION)return;
  globalThis.MICROCOSMOS_MESA_COLLISION=true;
  const $=id=>document.getElementById(id),stage=$("stage"),tokenLayer=$("tokenLayer"),gridType=$("gridType"),gridSize=$("gridSize"),status=$("mapStatus");
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS,api=globalThis.MICROCOSMOS_TABLE_API;
  if(!stage||!tokenLayer||!Array.isArray(players))return;
  let drag=null,lastBlockedAt=0;

  function targeting(){return document.body.classList.contains("micro-auto-target")||document.body.classList.contains("micro-target-mode")}
  function snapOn(){return !/OFF/i.test($("toggleSnap")?.textContent||"")}
  function gridPx(){return Math.max(20,+gridSize?.value||70)}
  function stagePoint(e){const r=stage.getBoundingClientRect(),sx=r.width/(stage.offsetWidth||1400),sy=r.height/(stage.offsetHeight||900);return{x:(e.clientX-r.left)/sx,y:(e.clientY-r.top)/sy}}
  function currentSize(p){return globalThis.MICROCOSMOS_TOKEN_SIZE?.currentSize?.(p)||p?.size||"Médio"}
  function collisionRadius(p){
    const s=gridPx(),size=currentSize(p);
    const factor={"Minúsculo":.16,"Pequeno":.34,"Médio":.34,"Grande":.84,"Enorme":1.34,"Colossal":1.84}[size]??.34;
    return Math.max(8,s*factor)
  }
  function squareSnap(p,x,y){
    if(!snapOn())return{x,y};
    const s=gridPx(),size=currentSize(p),cells=size==="Grande"?2:size==="Enorme"?3:size==="Colossal"?4:1;
    if(cells%2===0)return{x:Math.round(x/s)*s,y:Math.round(y/s)*s};
    return{x:Math.floor(x/s)*s+s/2,y:Math.floor(y/s)*s+s/2}
  }
  function candidatePoint(p,pt){
    const type=gridType?.value||"none";
    if(type==="none"||!snapOn())return pt;
    if(type==="hex"&&globalThis.MICROCOSMOS_HEX_GRID?.snapPoint)return globalThis.MICROCOSMOS_HEX_GRID.snapPoint(pt.x,pt.y);
    return squareSnap(p,pt.x,pt.y)
  }

  function pointSegDist(px,py,x1,y1,x2,y2){
    const vx=x2-x1,vy=y2-y1,wx=px-x1,wy=py-y1,c1=vx*wx+vy*wy,c2=vx*vx+vy*vy;
    const t=c2?Math.max(0,Math.min(1,c1/c2)):0,qx=x1+t*vx,qy=y1+t*vy;
    return Math.hypot(px-qx,py-qy)
  }
  function orient(ax,ay,bx,by,cx,cy){return(bx-ax)*(cy-ay)-(by-ay)*(cx-ax)}
  function onSeg(ax,ay,bx,by,cx,cy){return cx>=Math.min(ax,bx)-1e-6&&cx<=Math.max(ax,bx)+1e-6&&cy>=Math.min(ay,by)-1e-6&&cy<=Math.max(ay,by)+1e-6}
  function intersects(a,b,c,d){
    const o1=orient(a.x,a.y,b.x,b.y,c.x,c.y),o2=orient(a.x,a.y,b.x,b.y,d.x,d.y),o3=orient(c.x,c.y,d.x,d.y,a.x,a.y),o4=orient(c.x,c.y,d.x,d.y,b.x,b.y);
    if(((o1>0&&o2<0)||(o1<0&&o2>0))&&((o3>0&&o4<0)||(o3<0&&o4>0)))return true;
    if(Math.abs(o1)<1e-6&&onSeg(a.x,a.y,b.x,b.y,c.x,c.y))return true;
    if(Math.abs(o2)<1e-6&&onSeg(a.x,a.y,b.x,b.y,d.x,d.y))return true;
    if(Math.abs(o3)<1e-6&&onSeg(c.x,c.y,d.x,d.y,a.x,a.y))return true;
    if(Math.abs(o4)<1e-6&&onSeg(c.x,c.y,d.x,d.y,b.x,b.y))return true;
    return false
  }
  function segDistance(a,b,c,d){
    if(intersects(a,b,c,d))return 0;
    return Math.min(pointSegDist(a.x,a.y,c.x,c.y,d.x,d.y),pointSegDist(b.x,b.y,c.x,c.y,d.x,d.y),pointSegDist(c.x,c.y,a.x,a.y,b.x,b.y),pointSegDist(d.x,d.y,a.x,a.y,b.x,b.y))
  }
  function blockers(){
    const scene=globalThis.MICROCOSMOS_SCENE;
    if(!scene)return[];
    try{return scene.getBlockingMovement?.()||scene.elements?.filter(e=>scene.behavior?.(e)?.blocksMovement)||[]}catch{return[]}
  }
  function label(el){return el?.type==="wall"?"Parede":el?.type==="door"?"Porta":el?.type==="window"?"Janela":"barreira"}
  function blocked(p,from,to){
    const radius=collisionRadius(p),pathA={x:from.x,y:from.y},pathB={x:to.x,y:to.y};
    for(const el of blockers()){
      const c={x:+el.x1||0,y:+el.y1||0},d={x:+el.x2||0,y:+el.y2||0};
      const startDist=pointSegDist(from.x,from.y,c.x,c.y,d.x,d.y),endDist=pointSegDist(to.x,to.y,c.x,c.y,d.x,d.y),swept=segDistance(pathA,pathB,c,d);
      if(swept>radius)returnCheck: void 0;
      if(swept<=radius){
        // Se o token já nasceu/está encostado numa barreira, permitimos afastar-se dela.
        if(startDist<=radius+1&&endDist>startDist+0.5)continue;
        return{blocked:true,element:el,radius,startDist,endDist,swept}
      }
    }
    return{blocked:false}
  }
  function resolveMove(p,from,to){
    const first=blocked(p,from,to);if(!first.blocked)return{point:to,blocker:null};
    let lo=0,hi=1,best={x:from.x,y:from.y};
    for(let i=0;i<14;i++){
      const mid=(lo+hi)/2,probe={x:from.x+(to.x-from.x)*mid,y:from.y+(to.y-from.y)*mid};
      if(blocked(p,from,probe).blocked)hi=mid;else{lo=mid;best=probe}
    }
    return{point:best,blocker:first.element}
  }
  function notifyBlocked(el){
    const now=Date.now();if(now-lastBlockedAt<350)return;lastBlockedAt=now;
    if(status){status.dataset.microBeforeCollision=status.dataset.microBeforeCollision||status.textContent||"";status.textContent=`🚫 Movimento bloqueado por ${label(el)}.`;clearTimeout(notifyBlocked.t);notifyBlocked.t=setTimeout(()=>{if(status?.dataset.microBeforeCollision){status.textContent=status.dataset.microBeforeCollision;delete status.dataset.microBeforeCollision}},1200)}
  }
  function tokenEl(id){try{return tokenLayer.querySelector(`[data-token="${CSS.escape(id)}"]`)}catch{return null}}
  function applyPosition(p,pt){p.x=pt.x;p.y=pt.y;const el=tokenEl(p.id);if(el){el.style.left=`${pt.x}px`;el.style.top=`${pt.y}px`}}

  // Capture no document: assume o movimento antes das rotinas antigas de snap.
  document.addEventListener("pointerdown",e=>{
    if(targeting())return;
    const el=e.target?.closest?.("#tokenLayer [data-token]");if(!el)return;
    const p=players.find(x=>x.id===el.dataset.token);if(!p)return;
    drag={pointer:e.pointerId,p,id:p.id,last:{x:+p.x||0,y:+p.y||0}};
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    try{api?.selectToken?.(p.id)}catch(_e){}
  },true);
  document.addEventListener("pointermove",e=>{
    if(!drag||drag.pointer!==e.pointerId)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const raw=stagePoint(e),candidate=candidatePoint(drag.p,raw),resolved=resolveMove(drag.p,drag.last,candidate);
    applyPosition(drag.p,resolved.point);
    drag.last={x:resolved.point.x,y:resolved.point.y};
    if(resolved.blocker)notifyBlocked(resolved.blocker)
  },true);
  document.addEventListener("pointerup",e=>{
    if(!drag||drag.pointer!==e.pointerId)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const id=drag.id;drag=null;
    try{api?.renderTokens?.();api?.selectToken?.(id);globalThis.MICROCOSMOS_TOKEN_SIZE?.refresh?.()}catch(_e){}
  },true);
  document.addEventListener("pointercancel",e=>{if(drag?.pointer===e.pointerId)drag=null},true);

  globalThis.MICROCOSMOS_COLLISION={collisionRadius,blocked,resolveMove,refresh:()=>{},getBlockers:blockers};
})();
