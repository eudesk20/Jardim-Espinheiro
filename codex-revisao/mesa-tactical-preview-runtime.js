/* MICROCOSMOS — Prévia Tática Beta v1.4.
   Visualização por casas do Grid antes de confirmar Ataques/Magias.
   Agora respeita as barreiras do cenário: Parede/Porta/Janela fechada
   bloqueiam linha de efeito; portas/janelas abertas liberam novamente.
*/
(function(){
  if(globalThis.MICROCOSMOS_TACTICAL_PREVIEW)return;
  globalThis.MICROCOSMOS_TACTICAL_PREVIEW=true;

  const $=id=>document.getElementById(id);
  const players=()=>Array.isArray(globalThis.MICROCOSMOS_TABLE_PLAYERS)?globalThis.MICROCOSMOS_TABLE_PLAYERS:[];
  const stage=$("stage"),tokenLayer=$("tokenLayer"),viewport=$("viewport"),status=$("mapStatus");
  if(!stage||!tokenLayer||!viewport)return;

  let active=null,executorHooked=false,hintTimer=0,lastRenderKey="";
  const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const fmt=v=>{const n=Math.max(0,Math.round((+v||0)*10)/10);return Number.isInteger(n)?String(n):n.toFixed(1).replace(".",",")};
  const key=(c,r)=>`${c}:${r}`;

  function gridSize(){return Math.max(20,+$("gridSize")?.value||70)}
  function gridType(){return $("gridType")?.value||"square"}
  function stageCols(){return Math.ceil((stage.offsetWidth||1400)/gridSize())}
  function stageRows(){return Math.ceil((stage.offsetHeight||900)/gridSize())}
  function cellOf(p){const s=gridSize();return{c:Math.floor((+p?.x||0)/s),r:Math.floor((+p?.y||0)/s)}}
  function cellCenter(c,r){const s=gridSize();return{x:c*s+s/2,y:r*s+s/2}}
  function inBounds(c,r){return c>=0&&r>=0&&c<stageCols()&&r<stageRows()}

  function parseRange(item){
    if(item?.kind==="weapon"&&item.range?.normal!=null)return +item.range.normal||0;
    const raw=norm(item?.range||"");
    if(/pessoal|self/.test(raw))return 0;
    if(/toque|touch/.test(raw))return 1.5;
    let m=raw.match(/(\d+(?:[,.]\d+)?)\s*m\b/);if(m)return +m[1].replace(",",".");
    m=raw.match(/(\d+(?:[,.]\d+)?)\s*(?:ft|pes)\b/);if(m)return +m[1].replace(",",".")*.3;
    return item?.kind==="weapon"?1.5:18
  }
  function distance(a,b){
    const s=gridSize(),dx=Math.abs((+a?.x||0)-(+b?.x||0)),dy=Math.abs((+a?.y||0)-(+b?.y||0));
    if(gridType()==="square")return Math.max(dx,dy)/s*1.5;
    return Math.hypot(dx,dy)/s*1.5
  }

  function orient(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
  function onSeg(a,b,p){return p.x>=Math.min(a.x,b.x)-.01&&p.x<=Math.max(a.x,b.x)+.01&&p.y>=Math.min(a.y,b.y)-.01&&p.y<=Math.max(a.y,b.y)+.01}
  function segmentsIntersect(a,b,c,d){
    const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b),eps=.01;
    if(((o1>eps&&o2<-eps)||(o1<-eps&&o2>eps))&&((o3>eps&&o4<-eps)||(o3<-eps&&o4>eps)))return true;
    if(Math.abs(o1)<=eps&&onSeg(a,b,c))return true;
    if(Math.abs(o2)<=eps&&onSeg(a,b,d))return true;
    if(Math.abs(o3)<=eps&&onSeg(c,d,a))return true;
    if(Math.abs(o4)<=eps&&onSeg(c,d,b))return true;
    return false
  }
  function combatBlockers(){
    const scene=globalThis.MICROCOSMOS_SCENE;if(!scene)return[];
    try{
      return (scene.elements||[]).filter(el=>{
        const b=scene.behavior?.(el)||el;
        return !!(b?.blocksVision||b?.blocksMovement)
      })
    }catch(_e){return[]}
  }
  function lineBlocker(from,to){
    if(!from||!to)return null;
    const a={x:+from.x||0,y:+from.y||0},b={x:+to.x||0,y:+to.y||0};
    if(Math.hypot(b.x-a.x,b.y-a.y)<2)return null;
    for(const el of combatBlockers()){
      const c={x:+el.x1||0,y:+el.y1||0},d={x:+el.x2||0,y:+el.y2||0};
      if(!segmentsIntersect(a,b,c,d))continue;
      // Se a barreira encostar exatamente no centro de origem/destino, não
      // consideramos isso uma travessia. Evita falso bloqueio em tokens junto à parede.
      const nearStart=Math.min(Math.hypot(a.x-c.x,a.y-c.y),Math.hypot(a.x-d.x,a.y-d.y))<2;
      const nearEnd=Math.min(Math.hypot(b.x-c.x,b.y-c.y),Math.hypot(b.x-d.x,b.y-d.y))<2;
      if(nearStart||nearEnd)continue;
      return el
    }
    return null
  }
  function blockerLabel(el){return el?.type==="wall"?"Parede":el?.type==="door"?"Porta":el?.type==="window"?"Janela":"Barreira"}
  function hasLineOfEffect(from,to){return !lineBlocker(from,to)}

  function validTarget(p){
    if(!active||!p)return false;
    if(active.range<=0)return String(p.id)===String(active.caster.id);
    return distance(active.caster,p)<=active.range+.05&&hasLineOfEffect(active.caster,p)
  }

  function areaInfo(item){
    const base=String(item?.area||item?.shape||"").trim();
    const fallback=/\b(cone|linha|cubo|quadrado|raio|circulo|círculo|esfera|zona)\b/i.test(`${item?.effect||""} ${item?.text||""}`)?`${item?.effect||""} ${item?.text||""}`:"";
    const source=base||fallback,raw=norm(`${item?.shape||""} ${source}`);
    if(!raw)return{kind:"",meters:0,width:1.5,centered:false,label:""};
    let kind="";
    if(/\bcone\b/.test(raw))kind="cone";
    else if(/\blinha\b/.test(raw))kind="line";
    else if(/\bcubo\b|\bquadrado\b/.test(raw))kind="cube";
    else if(/\braio\b|\bcirculo\b|\besfera\b|\bzona\b/.test(raw))kind="radius";
    let meters=0,width=1.5;
    const shapeRx=kind==="cone"?/cone[^\d]{0,24}(\d+(?:[,.]\d+)?)\s*m/i:kind==="line"?/linha[^\d]{0,24}(\d+(?:[,.]\d+)?)\s*m/i:kind==="cube"?/(?:cubo|quadrado)[^\d]{0,24}(\d+(?:[,.]\d+)?)\s*m/i:/(?:raio|circulo|círculo|esfera|zona)[^\d]{0,24}(\d+(?:[,.]\d+)?)\s*m/i;
    const specific=source.match(shapeRx),generic=source.match(/(\d+(?:[,.]\d+)?)\s*m\b/i);
    meters=+(specific?.[1]||generic?.[1]||0).replace?.(",",".")||0;
    if(kind==="line"){const w=source.match(/(?:por|x|×)\s*(\d+(?:[,.]\d+)?)\s*m/i);if(w)width=+w[1].replace(",",".")||1.5}
    const centered=/a partir do conjurador|ao redor (?:do conjurador|de voce|de você)|conjurador|pessoal|self/.test(raw);
    return{kind,meters,width,centered,label:base||source.trim()}
  }

  function stagePoint(e){
    const r=stage.getBoundingClientRect(),w=stage.offsetWidth||1400,h=stage.offsetHeight||900;
    return{x:(e.clientX-r.left)*(w/Math.max(1,r.width)),y:(e.clientY-r.top)*(h/Math.max(1,r.height))}
  }
  function rangeCells(){
    const set=new Set(),origin=cellOf(active.caster),steps=Math.max(0,Math.floor((active.range+.05)/1.5));
    if(active.range<=0){set.add(key(origin.c,origin.r));return set}
    for(let dc=-steps;dc<=steps;dc++)for(let dr=-steps;dr<=steps;dr++){
      const c=origin.c+dc,r=origin.r+dr;if(!inBounds(c,r)||Math.max(Math.abs(dc),Math.abs(dr))>steps)continue;
      if(hasLineOfEffect(active.caster,cellCenter(c,r)))set.add(key(c,r))
    }
    return set
  }
  function radiusCells(center,meters){
    const set=new Set(),cc=cellOf(center),steps=Math.max(0,Math.ceil((meters-.01)/1.5)),origin=center;
    for(let dc=-steps;dc<=steps;dc++)for(let dr=-steps;dr<=steps;dr++){
      const c=cc.c+dc,r=cc.r+dr;if(!inBounds(c,r)||Math.max(Math.abs(dc),Math.abs(dr))>steps)continue;
      if(hasLineOfEffect(origin,cellCenter(c,r)))set.add(key(c,r))
    }
    return set
  }
  function cubeCells(center,meters){
    const set=new Set(),cc=cellOf(center),side=Math.max(1,Math.ceil((meters-.01)/1.5)),start=-Math.floor((side-1)/2),origin=center;
    for(let dx=0;dx<side;dx++)for(let dy=0;dy<side;dy++){
      const c=cc.c+start+dx,r=cc.r+start+dy;if(inBounds(c,r)&&hasLineOfEffect(origin,cellCenter(c,r)))set.add(key(c,r))
    }
    return set
  }
  function directedCells(kind,meters,width,aim){
    const set=new Set(),s=gridSize(),origin={x:+active.caster.x||0,y:+active.caster.y||0};
    let vx=(+aim?.x||origin.x)-origin.x,vy=(+aim?.y||origin.y)-origin.y,vl=Math.hypot(vx,vy);
    if(vl<1){vx=1;vy=0;vl=1}vx/=vl;vy/=vl;
    const lengthPx=Math.max(s,meters/1.5*s),halfWidth=Math.max(s*.42,width/1.5*s/2),maxC=stageCols(),maxR=stageRows();
    for(let c=0;c<maxC;c++)for(let r=0;r<maxR;r++){
      const p=cellCenter(c,r),dx=p.x-origin.x,dy=p.y-origin.y,proj=dx*vx+dy*vy;if(proj<0||proj>lengthPx+s*.15)continue;
      const perp=Math.abs(dx*vy-dy*vx),radial=Math.hypot(dx,dy);
      const inside=kind==="line"?perp<=halfWidth:(radial<=lengthPx+s*.15&&proj>0&&perp<=proj);
      if(inside&&hasLineOfEffect(origin,p))set.add(key(c,r))
    }
    return set
  }
  function effectCells(){
    const a=active.area;if(!a?.kind||!a.meters)return new Set();
    if(!a.centered&&lineBlocker(active.caster,active.aim))return new Set();
    if(a.kind==="radius")return radiusCells(a.centered?active.caster:active.aim,a.meters);
    if(a.kind==="cube")return cubeCells(a.centered?active.caster:active.aim,a.meters);
    if(a.kind==="line"||a.kind==="cone")return directedCells(a.kind,a.meters,a.width,active.aim);
    return new Set()
  }

  function ensureCss(){
    if($("microTacticalPreviewStyle"))return;
    const s=document.createElement("style");s.id="microTacticalPreviewStyle";s.textContent=`
      #microTacticalPreviewLayer{position:absolute;inset:0;z-index:40;pointer-events:none;overflow:hidden}
      .micro-preview-cell{position:absolute;box-sizing:border-box;pointer-events:none}
      .micro-preview-cell.range{background:rgba(255,211,69,.22);border:2px solid rgba(255,224,105,.72);box-shadow:inset 0 0 14px rgba(255,210,45,.18)}
      .micro-preview-cell.effect{background:rgba(59,228,161,.42);border:3px solid rgba(105,255,199,.98);box-shadow:inset 0 0 18px rgba(48,255,175,.36),0 0 7px rgba(48,255,175,.45)}
      .micro-preview-cell.aim{outline:4px solid #fff6b7;outline-offset:-5px;background:rgba(255,245,155,.28)}
      .micro-preview-fallback{position:absolute;border:4px dashed #f4d45d;background:rgba(244,212,93,.18);border-radius:50%;pointer-events:none}
      body.micro-tactical-preview-active #tokenLayer .token{z-index:60;transition:opacity .12s ease,filter .12s ease,box-shadow .12s ease}
      body.micro-tactical-preview-active #tokenLayer .token.micro-preview-valid{opacity:1;filter:none;box-shadow:0 0 0 4px rgba(102,245,145,.88),0 0 20px rgba(102,245,145,.72),0 4px 12px #0009}
      body.micro-tactical-preview-active #tokenLayer .token.micro-preview-invalid{opacity:.34;filter:grayscale(.55)}
      body.micro-tactical-preview-active #tokenLayer .token.micro-preview-caster{opacity:1;filter:none;outline:3px solid #ffe16c;outline-offset:3px}
      body.micro-tactical-preview-active #tokenLayer .token.micro-preview-affected{opacity:1!important;filter:none!important;box-shadow:0 0 0 5px #ff875f,0 0 25px rgba(255,95,58,.95),0 4px 12px #0009!important}
      body.micro-tactical-preview-active #tokenLayer .token.micro-preview-wall-blocked{opacity:.25!important;filter:grayscale(.8)!important;box-shadow:0 0 0 3px rgba(95,72,55,.9)!important}
      .micro-preview-distance{position:absolute;right:-14px;top:-17px;z-index:70;min-width:34px;padding:3px 5px;border-radius:999px;background:#17251e;color:#fff8dd;border:1px solid #e7cc82;font:bold 10px/1.2 Arial,sans-serif;white-space:nowrap;pointer-events:none}
      #microTacticalPreviewBar{display:none;align-items:center;gap:7px;flex-wrap:wrap;margin:0 0 6px;padding:7px 9px;border:2px solid #b58a3d;border-radius:10px;background:#17251e;color:#fff2cf;font-size:.75rem;box-shadow:0 3px 10px #0007}
      #microTacticalPreviewBar.active{display:flex}#microTacticalPreviewBar b{color:#f1d789}.micro-preview-info{display:flex;gap:7px;align-items:center;flex-wrap:wrap;min-width:0;flex:1}.micro-preview-chip{padding:3px 6px;border:1px solid #816e50;border-radius:999px;background:#fff1;color:#fff3d6;white-space:nowrap}.micro-preview-legend{font-weight:bold;color:#ffe38a}.micro-preview-area-text{color:#aaffd7}.micro-preview-hint{color:#ffcf79;font-weight:bold}.micro-preview-cancel{margin-left:auto;padding:5px 8px!important;min-height:29px!important;font-size:.69rem!important}
      @media(max-width:720px){#microTacticalPreviewBar{font-size:.67rem;padding:5px 6px;gap:4px}.micro-preview-info{gap:4px}.micro-preview-chip{padding:2px 5px}.micro-preview-cancel{margin-left:0;width:100%}}
    `;document.head.appendChild(s)
  }
  function ensureUi(){
    ensureCss();
    let layer=$("microTacticalPreviewLayer");if(!layer){layer=document.createElement("div");layer.id="microTacticalPreviewLayer";stage.appendChild(layer)}
    let bar=$("microTacticalPreviewBar");if(!bar){
      bar=document.createElement("div");bar.id="microTacticalPreviewBar";bar.innerHTML='<div class="micro-preview-info"><b id="microPreviewAction"></b><span class="micro-preview-chip" id="microPreviewRange"></span><span class="micro-preview-chip" id="microPreviewTargets"></span><span class="micro-preview-legend">🟨 alcance com linha livre</span><span class="micro-preview-legend micro-preview-area-text" id="microPreviewAreaLegend" hidden>🟩 área afetada</span><span class="micro-preview-hint" id="microPreviewHint"></span></div><button type="button" class="btn micro-preview-cancel" id="microPreviewCancel">✕ Cancelar prévia</button>';
      const tactical=$("microTacticalHud");if(tactical?.parentElement)tactical.insertAdjacentElement("afterend",bar);else viewport.insertAdjacentElement("beforebegin",bar);
      $("microPreviewCancel").onclick=()=>{try{globalThis.MICROCOSMOS_COMBAT_EXECUTOR?.cancel?.()}catch(_e){}clear()}
    }
    return{layer,bar}
  }
  function clearTokenMarks(){
    tokenLayer.querySelectorAll("[data-token]").forEach(el=>{el.classList.remove("micro-preview-valid","micro-preview-invalid","micro-preview-caster","micro-preview-affected","micro-preview-wall-blocked");el.querySelector(":scope>.micro-preview-distance")?.remove()})
  }
  function clear(){
    active=null;lastRenderKey="";document.body.classList.remove("micro-tactical-preview-active");clearTokenMarks();
    $("microTacticalPreviewBar")?.classList.remove("active");const layer=$("microTacticalPreviewLayer");if(layer){layer.style.display="none";layer.replaceChildren()}
  }
  function showHint(text){const el=$("microPreviewHint");if(!el)return;el.textContent=text;clearTimeout(hintTimer);hintTimer=setTimeout(()=>{if(el.textContent===text)el.textContent=""},1900)}
  function begin(caster,type,index,item){
    if(!caster||!item)return;
    active={caster,type,index,item,range:parseRange(item),area:areaInfo(item),aim:{x:+caster.x||0,y:+caster.y||0}};lastRenderKey="";render(true)
  }

  function drawSquareGrid(layer,ranges,effects){
    const s=gridSize(),aim=cellOf(active.aim),frag=document.createDocumentFragment();
    for(const k of ranges){const [c,r]=k.split(":").map(Number),d=document.createElement("div");d.className="micro-preview-cell range";d.style.cssText=`left:${c*s}px;top:${r*s}px;width:${s}px;height:${s}px`;frag.appendChild(d)}
    for(const k of effects){const [c,r]=k.split(":").map(Number),d=document.createElement("div");d.className="micro-preview-cell effect"+(c===aim.c&&r===aim.r&&!active.area.centered?" aim":"");d.style.cssText=`left:${c*s}px;top:${r*s}px;width:${s}px;height:${s}px`;frag.appendChild(d)}
    if(active.area?.kind&&!active.area.centered&&!effects.size&&!lineBlocker(active.caster,active.aim)){const d=document.createElement("div");d.className="micro-preview-cell aim";d.style.cssText=`left:${aim.c*s}px;top:${aim.r*s}px;width:${s}px;height:${s}px`;frag.appendChild(d)}
    layer.replaceChildren(frag)
  }
  function drawFallback(layer){
    const s=gridSize(),radius=Math.max(s/2,active.range/1.5*s),d=document.createElement("div");d.className="micro-preview-fallback";d.style.cssText=`left:${(+active.caster.x||0)-radius}px;top:${(+active.caster.y||0)-radius}px;width:${radius*2}px;height:${radius*2}px`;layer.replaceChildren(d)
  }
  function render(force=false){
    if(!active)return;const {layer,bar}=ensureUi();if(!layer||!bar)return;
    active.area=areaInfo(active.item);const ranges=rangeCells(),effects=effectCells(),aimCell=cellOf(active.aim),sceneSig=combatBlockers().map(x=>`${x.id}:${x.type}:${x.state}:${x.x1},${x.y1},${x.x2},${x.y2}`).join("|");
    const rk=`${active.caster.id}|${active.item.name}|${gridType()}|${gridSize()}|${active.caster.x}|${active.caster.y}|${aimCell.c},${aimCell.r}|${active.area.kind}|${active.area.meters}|${sceneSig}`;
    if(force||rk!==lastRenderKey){gridType()==="square"?drawSquareGrid(layer,ranges,effects):drawFallback(layer);lastRenderKey=rk}
    layer.style.display="block";bar.classList.add("active");document.body.classList.add("micro-tactical-preview-active");

    clearTokenMarks();let validCount=0,affectedCount=0;
    for(const p of players()){
      const el=tokenLayer.querySelector(`[data-token="${CSS.escape(String(p.id))}"]`);if(!el)continue;
      const caster=String(p.id)===String(active.caster.id),blocked=!caster&&!!lineBlocker(active.caster,p),valid=validTarget(p),pc=cellOf(p),affected=effects.has(key(pc.c,pc.r))&&!blocked;
      if(valid&&!caster)validCount++;if(affected&&!caster)affectedCount++;
      el.classList.add(valid?"micro-preview-valid":"micro-preview-invalid");if(caster)el.classList.add("micro-preview-caster");if(affected)el.classList.add("micro-preview-affected");if(blocked)el.classList.add("micro-preview-wall-blocked");
      if(!caster){const badge=document.createElement("span");badge.className="micro-preview-distance";badge.textContent=blocked?`🧱 ${fmt(distance(active.caster,p))} m`:`${fmt(distance(active.caster,p))} m`;el.appendChild(badge)}
    }
    $("microPreviewAction").textContent=`👁️ PRÉVIA • ${active.item.name||"Ação"}`;
    $("microPreviewRange").textContent=active.range<=0?"🎯 Pessoal":`📏 ${fmt(active.range)} m`;
    $("microPreviewTargets").textContent=active.area?.kind&&active.area.meters?`🎯 ${affectedCount} na área`:`✅ ${validCount} alvo${validCount===1?"":"s"}`;
    const areaLegend=$("microPreviewAreaLegend");if(areaLegend){areaLegend.hidden=!(active.area?.kind&&active.area.meters);areaLegend.title=active.area?.label||""}
  }

  function hookExecutor(){
    if(executorHooked)return true;const ex=globalThis.MICROCOSMOS_COMBAT_EXECUTOR;if(!ex||typeof ex.start!=="function")return false;
    const originalStart=ex.start.bind(ex),originalCancel=typeof ex.cancel==="function"?ex.cancel.bind(ex):null;
    ex.start=function(caster,type,index){
      const item=(type==="attack"?caster?.attacks:caster?.spells)?.[index];if(item)begin(caster,type,index,item);
      const result=originalStart(caster,type,index);if(result&&typeof result.then==="function")result.catch(()=>clear());return result
    };
    if(originalCancel)ex.cancel=function(){const result=originalCancel();clear();return result};executorHooked=true;return true
  }
  function fallbackDetect(){
    hookExecutor();
    if(!document.body.classList.contains("micro-auto-target")){if(active)clear();return}
    if(active){render();return}
    const selectedEl=tokenLayer.querySelector(".token.selected"),combat=globalThis.MICROCOSMOS_INITIATIVE?.combat,caster=players().find(p=>String(p.id)===String(selectedEl?.dataset?.token))||players().find(p=>String(p.id)===String(combat?.active_token_id));
    if(!caster)return;const m=String(status?.textContent||"").match(/^🎯\s*(.+?):\s*selecione/i),name=m?.[1]?.trim();if(!name)return;
    let index=(caster.attacks||[]).findIndex(x=>String(x.name)===name),type="attack",item=index>=0?caster.attacks[index]:null;
    if(!item){index=(caster.spells||[]).findIndex(x=>String(x.name)===name);type="spell";item=index>=0?caster.spells[index]:null}if(item)begin(caster,type,index,item)
  }

  window.addEventListener("pointermove",e=>{
    if(!active||!document.body.classList.contains("micro-auto-target"))return;const p=stagePoint(e),area=active.area;
    if(area?.kind&&!area.centered){active.aim=p;render()}
  },true);
  window.addEventListener("pointerdown",e=>{
    if(!active||!document.body.classList.contains("micro-auto-target"))return;const el=e.target?.closest?.("#tokenLayer [data-token]");if(!el)return;
    const target=players().find(p=>String(p.id)===String(el.dataset.token));if(!target)return;
    const wall=lineBlocker(active.caster,target);
    if(wall){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showHint(`🧱 ${blockerLabel(wall)} bloqueia o ataque.`);return}
    if(validTarget(target))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showHint(`🚫 Fora do alcance: ${fmt(distance(active.caster,target))} m`)
  },true);
  window.addEventListener("keydown",e=>{if(e.key==="Escape"&&active)clear()});
  $("gridSize")?.addEventListener("input",()=>active&&render(true));$("gridType")?.addEventListener("change",()=>active&&render(true));

  ensureUi();hookExecutor();setInterval(fallbackDetect,140);
  globalThis.MICROCOSMOS_TACTICAL_PREVIEW_API={begin,clear,render,parseRange,distance,areaInfo,lineBlocker,hasLineOfEffect,get active(){return active}};
})();