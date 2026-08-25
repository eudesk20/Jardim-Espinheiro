/* MICROCOSMOS — Tamanho e espaço dos Tokens na Mesa.
   Regra visual/mecânica base:
   Minúsculo: 4 por célula; Pequeno/Médio: 1 célula; Grande: 2x2 / 3 hexes;
   Enorme: 3x3 / 7 hexes; Colossal: 4x4+ / 12+ hexes.
   Tamanho Atual altera a ocupação. Escala visual é ajuste fino e não muda regra.
*/
(function(){
  if(globalThis.MICROCOSMOS_MESA_TOKEN_SIZE)return;
  globalThis.MICROCOSMOS_MESA_TOKEN_SIZE=true;
  const $=id=>document.getElementById(id),players=globalThis.MICROCOSMOS_TABLE_PLAYERS,api=globalThis.MICROCOSMOS_TABLE_API;
  const tokenLayer=$("tokenLayer"),card=$("tokenCard"),gridType=$("gridType"),gridSize=$("gridSize");
  if(!Array.isArray(players)||!tokenLayer||!card||!gridType||!gridSize)return;

  const STORE_KEY="MICROCOSMOS_TOKEN_SIZE_OVERRIDES_V1";
  const SIZES=["Minúsculo","Pequeno","Médio","Grande","Enorme","Colossal"];
  const RULES={
    "Minúsculo":{squareCells:.45,squareText:"4 por quadrado",hexCells:.45,hexText:"4 por hex"},
    "Pequeno":{squareCells:.82,squareText:"1 quadrado",hexCells:.82,hexText:"1 hex"},
    "Médio":{squareCells:.82,squareText:"1 quadrado",hexCells:.82,hexText:"1 hex"},
    "Grande":{squareCells:1.85,squareText:"2×2 (4 quadrados)",hexCells:1.55,hexText:"3 hexes"},
    "Enorme":{squareCells:2.80,squareText:"3×3 (9 quadrados)",hexCells:2.35,hexText:"7 hexes"},
    "Colossal":{squareCells:3.75,squareText:"4×4 ou mais",hexCells:3.15,hexText:"12 hexes ou mais"}
  };
  const ALIAS={tiny:"Minúsculo",minusculo:"Minúsculo",minúsculo:"Minúsculo",small:"Pequeno",pequeno:"Pequeno",medium:"Médio",medio:"Médio",médio:"Médio",large:"Grande",grande:"Grande",huge:"Enorme",enorme:"Enorme",gargantuan:"Colossal",colossal:"Colossal",gigantesco:"Colossal"};
  let overrides={};try{overrides=JSON.parse(localStorage.getItem(STORE_KEY)||"{}")||{}}catch{}
  let drag=null,queued=false;

  function norm(v){const raw=String(v||"").trim(),key=raw.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();return ALIAS[key]||SIZES.find(s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()===key)||"Médio"}
  function selected(){const el=tokenLayer.querySelector(".token.selected");return el?players.find(p=>p.id===el.dataset.token):null}
  function baseSize(p){return norm(p?.sizeBase||p?.baseSize||p?.size||"Médio")}
  function currentSize(p){return norm(overrides[p?.id]?.size||p?.size||baseSize(p))}
  function visualScale(p){const n=+(overrides[p?.id]?.visualScale||100);return Math.max(60,Math.min(140,Number.isFinite(n)?n:100))}
  function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(overrides))}catch(_e){}}
  function rule(p){return RULES[currentSize(p)]||RULES["Médio"]}
  function gridPx(){return Math.max(20,+gridSize.value||70)}
  function pixelSize(p){const r=rule(p),factor=gridType.value==="hex"?r.hexCells:r.squareCells;return Math.max(24,gridPx()*factor*visualScale(p)/100)}
  function footprintText(p){const r=rule(p);return gridType.value==="hex"?r.hexText:r.squareText}

  function ensureCss(){if($("microTokenSizeStyle"))return;const s=document.createElement("style");s.id="microTokenSizeStyle";s.textContent=`
    #tokenLayer .token{transition:width .15s ease,height .15s ease,font-size .15s ease}#tokenLayer .token>small{top:calc(100% + 3px)!important}#tokenLayer .token>.hp{bottom:-10px!important}.micro-token-size-panel{margin-top:9px;padding:9px;border:1px solid #9b8058;border-radius:10px;background:#f5ecd8}.micro-token-size-panel h3{margin:0 0 7px!important}.micro-size-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.micro-size-grid label{font-size:.68rem;font-weight:bold;color:#6d5a43}.micro-size-grid select,.micro-size-grid input{width:100%;margin-top:3px}.micro-size-summary{margin-top:6px;font-size:.72rem;color:#6b5a43}.micro-size-temp-badge{display:inline-block;background:#6b4d87;color:#fff;border-radius:999px;padding:2px 6px;font-size:.64rem;margin-left:5px}@media(max-width:620px){.micro-size-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(s)
  }
  function applyToken(p){
    const el=tokenLayer.querySelector(`[data-token="${CSS.escape(p.id)}"]`);if(!el)return;
    const px=pixelSize(p),font=Math.max(.72,Math.min(1.4,px/58*1.05));
    if(el.style.width!==`${px}px`)el.style.width=`${px}px`;if(el.style.height!==`${px}px`)el.style.height=`${px}px`;el.style.fontSize=`${font}rem`;
    el.dataset.size=currentSize(p);el.title=`${p.name} • ${currentSize(p)} • ${footprintText(p)}`
  }
  function decorate(){for(const p of players)applyToken(p);renderControls()}

  function renderControls(){
    const p=selected();if(!p)return;
    ensureCss();let panel=$("microTokenSizePanel");if(!panel){panel=document.createElement("div");panel.id="microTokenSizePanel";panel.className="micro-token-size-panel";card.appendChild(panel)}
    const base=baseSize(p),cur=currentSize(p),scale=visualScale(p),temporary=!!overrides[p.id]?.size;
    const html=`<h3>📐 Tamanho no Grid</h3><div class="micro-size-grid"><label>Tamanho Base<input value="${base}" disabled></label><label>Tamanho Atual<select id="microTokenCurrentSize">${SIZES.map(s=>`<option ${s===cur?"selected":""}>${s}</option>`).join("")}</select></label><label>Escala visual <b id="microScaleValue">${scale}%</b><input id="microTokenVisualScale" type="range" min="60" max="140" step="5" value="${scale}"></label><label>Ajuste temporário<button class="btn" id="microResetTokenSize" style="width:100%;margin-top:3px" ${!temporary&&scale===100?"disabled":""}>↩ Voltar ao tamanho base</button></label></div><div class="micro-size-summary"><b>${cur}</b> ocupa <b>${footprintText(p)}</b> no grid atual.${temporary?'<span class="micro-size-temp-badge">TEMPORÁRIO</span>':""}<br><small>A categoria altera o espaço mecânico. A barra só ajusta o desenho do token.</small></div>`;
    if(panel.innerHTML!==html){panel.innerHTML=html;bindControls(p)}
  }
  function bindControls(p){
    const sel=$("microTokenCurrentSize"),range=$("microTokenVisualScale"),reset=$("microResetTokenSize");
    if(sel)sel.onchange=()=>setTemporarySize(p.id,sel.value,"Ajuste temporário da Mesa");
    if(range)range.oninput=()=>{overrides[p.id]=overrides[p.id]||{};overrides[p.id].visualScale=+range.value;save();const val=$("microScaleValue");if(val)val.textContent=`${range.value}%`;applyToken(p)};
    if(reset)reset.onclick=()=>resetSize(p.id)
  }
  function setTemporarySize(id,size,source="Efeito temporário"){
    const p=players.find(x=>x.id===id);if(!p)return;overrides[id]=overrides[id]||{};overrides[id].size=norm(size);overrides[id].source=source;p.size=norm(size);p.sizeTemporary=true;save();schedule();return p.size
  }
  function resetSize(id){
    const p=players.find(x=>x.id===id);if(!p)return;const base=baseSize(p);delete overrides[id];p.size=base;p.sizeTemporary=false;save();schedule();return base
  }
  function setVisualScale(id,percent){const p=players.find(x=>x.id===id);if(!p)return;overrides[id]=overrides[id]||{};overrides[id].visualScale=Math.max(60,Math.min(140,+percent||100));save();schedule()}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}

  // Snap quadrado considera o espaço mecânico: tamanhos pares (Grande/Colossal)
  // centralizam no cruzamento de linhas; ímpares no centro da célula central.
  function squareSnap(p,x,y){
    const s=gridPx(),size=currentSize(p),cells=size==="Grande"?2:size==="Enorme"?3:size==="Colossal"?4:1;
    if(cells%2===0)return{x:Math.round(x/s)*s,y:Math.round(y/s)*s};
    return{x:Math.floor(x/s)*s+s/2,y:Math.floor(y/s)*s+s/2}
  }
  function stagePoint(e){const stage=$("stage"),r=stage.getBoundingClientRect(),sx=r.width/(stage.offsetWidth||1400),sy=r.height/(stage.offsetHeight||900);return{x:(e.clientX-r.left)/sx,y:(e.clientY-r.top)/sy}}
  function snapOn(){return !/OFF/i.test($("toggleSnap")?.textContent||"")}
  function targeting(){return document.body.classList.contains("micro-auto-target")||document.body.classList.contains("micro-target-mode")}
  document.addEventListener("pointerdown",e=>{
    if(gridType.value!=="square"||!snapOn()||targeting())return;const el=e.target?.closest?.("#tokenLayer [data-token]");if(!el)return;const p=players.find(x=>x.id===el.dataset.token);if(!p)return;
    drag={p,pointer:e.pointerId,id:p.id};e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();try{api.selectToken?.(p.id)}catch(_e){}
  },true);
  document.addEventListener("pointermove",e=>{
    if(!drag||drag.pointer!==e.pointerId)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const pt=stagePoint(e),sn=squareSnap(drag.p,pt.x,pt.y);drag.p.x=sn.x;drag.p.y=sn.y;const el=tokenLayer.querySelector(`[data-token="${CSS.escape(drag.id)}"]`);if(el){el.style.left=`${sn.x}px`;el.style.top=`${sn.y}px`}
  },true);
  document.addEventListener("pointerup",e=>{if(!drag||drag.pointer!==e.pointerId)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const id=drag.id;drag=null;try{api.renderTokens?.();api.selectToken?.(id)}catch(_e){}setTimeout(schedule,0)},true);
  document.addEventListener("pointercancel",e=>{if(drag?.pointer===e.pointerId)drag=null},true);

  const obs=new MutationObserver(schedule);obs.observe(tokenLayer,{childList:true,subtree:true});obs.observe(card,{childList:true,subtree:true});
  gridType.addEventListener("change",schedule);gridSize.addEventListener("input",schedule);$("gridMinus")?.addEventListener("click",()=>setTimeout(schedule,0));$("gridPlus")?.addEventListener("click",()=>setTimeout(schedule,0));
  ensureCss();schedule();
  globalThis.MICROCOSMOS_TOKEN_SIZE={SIZES,RULES,norm,baseSize,currentSize,footprintText,pixelSize,setTemporarySize,resetSize,setVisualScale,refresh:schedule};
})();
