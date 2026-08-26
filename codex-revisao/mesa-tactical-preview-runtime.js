/* MICROCOSMOS — Prévia Tática Beta v1.
   Camada visual de planejamento antes de confirmar Ataque/Magia:
   - mostra o alcance real no Grid a partir da posição atual do token;
   - destaca alvos dentro e fora do alcance e exibe a distância;
   - detecta metadados de área das magias e desenha áreas centradas no conjurador;
   - impede selecionar por engano um alvo fora do alcance, sem gastar Ação/Slot;
   - não altera dano, cura, PV, Slots ou resolução atual do combate.
*/
(function(){
  if(globalThis.MICROCOSMOS_TACTICAL_PREVIEW)return;
  globalThis.MICROCOSMOS_TACTICAL_PREVIEW=true;

  const $=id=>document.getElementById(id);
  const players=()=>Array.isArray(globalThis.MICROCOSMOS_TABLE_PLAYERS)?globalThis.MICROCOSMOS_TABLE_PLAYERS:[];
  const stage=$("stage"),tokenLayer=$("tokenLayer"),viewport=$("viewport"),status=$("mapStatus");
  if(!stage||!tokenLayer||!viewport)return;

  let active=null,lastSignature="",hintTimer=0;
  const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const fmt=v=>{const n=Math.max(0,Math.round((+v||0)*10)/10);return Number.isInteger(n)?String(n):n.toFixed(1).replace(".",",")};

  function gridSize(){return Math.max(20,+$("gridSize")?.value||70)}
  function gridType(){return $("gridType")?.value||"square"}
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
  function areaInfo(item){
    const original=String(item?.area||item?.shape||"").trim(),raw=norm(`${item?.shape||""} ${item?.area||""}`);
    if(!raw)return{kind:"",meters:0,centered:false,label:""};
    const kind=/cone/.test(raw)?"cone":/linha/.test(raw)?"line":/cubo|quadrado/.test(raw)?"cube":/raio|circulo|esfera/.test(raw)?"radius":"";
    const m=raw.match(/(\d+(?:[,.]\d+)?)\s*m\b/),meters=m?+m[1].replace(",","."):0;
    const centered=/a partir do conjurador|conjurador|pessoal|self/.test(raw);
    return{kind,meters,centered,label:original}
  }
  function validTarget(p){
    if(!active||!p)return false;
    if(active.range<=0)return String(p.id)===String(active.caster.id);
    return distance(active.caster,p)<=active.range+.05
  }

  function ensureCss(){
    if($("microTacticalPreviewStyle"))return;
    const s=document.createElement("style");s.id="microTacticalPreviewStyle";s.textContent=`
      #microTacticalPreviewLayer{position:absolute;inset:0;z-index:12;pointer-events:none;overflow:hidden}
      .micro-preview-zone{position:absolute;pointer-events:none;border:2px dashed rgba(245,215,118,.95);background:rgba(245,215,118,.10);box-shadow:0 0 18px rgba(245,215,118,.25) inset,0 0 9px rgba(0,0,0,.35)}
      .micro-preview-zone.circle{border-radius:50%}.micro-preview-zone.square{border-radius:12px}
      .micro-preview-area-zone{position:absolute;pointer-events:none;border:2px solid rgba(111,201,174,.95);background:rgba(70,177,145,.16);box-shadow:0 0 20px rgba(79,210,168,.30) inset}.micro-preview-area-zone.circle{border-radius:50%}.micro-preview-area-zone.square{border-radius:10px}
      body.micro-tactical-preview-active #tokenLayer .token{z-index:25;transition:opacity .12s ease,filter .12s ease,box-shadow .12s ease}
      body.micro-tactical-preview-active #tokenLayer .token.micro-preview-valid{opacity:1;filter:none;box-shadow:0 0 0 4px rgba(91,210,132,.86),0 0 20px rgba(91,210,132,.75),0 4px 12px #0009}
      body.micro-tactical-preview-active #tokenLayer .token.micro-preview-invalid{opacity:.38;filter:grayscale(.55)}
      body.micro-tactical-preview-active #tokenLayer .token.micro-preview-caster{opacity:1;filter:none;outline:4px solid #f2d36f;outline-offset:3px}
      .micro-preview-distance{position:absolute;right:-14px;top:-17px;z-index:6;min-width:34px;padding:2px 4px;border-radius:999px;background:#17251e;color:#fff8dd;border:1px solid #e7cc82;font:bold 9px/1.2 Arial,sans-serif;white-space:nowrap;pointer-events:none}
      #microTacticalPreviewBar{display:none;align-items:center;gap:7px;flex-wrap:wrap;margin:0 0 6px;padding:6px 8px;border:1px solid #8f744b;border-radius:10px;background:#17251e;color:#fff2cf;font-size:.73rem;box-shadow:0 3px 10px #0005}
      #microTacticalPreviewBar.active{display:flex}#microTacticalPreviewBar b{color:#f1d789}.micro-preview-info{display:flex;gap:7px;align-items:center;flex-wrap:wrap;min-width:0;flex:1}.micro-preview-chip{padding:3px 6px;border:1px solid #816e50;border-radius:999px;background:#fff1;color:#fff3d6;white-space:nowrap}.micro-preview-hint{color:#ffd687;font-weight:bold}.micro-preview-cancel{margin-left:auto;padding:5px 8px!important;min-height:29px!important;font-size:.69rem!important}
      @media(max-width:720px){#microTacticalPreviewBar{font-size:.68rem;padding:5px 6px;gap:4px}.micro-preview-info{gap:4px}.micro-preview-chip{padding:2px 5px}.micro-preview-cancel{margin-left:0;width:100%}}
    `;document.head.appendChild(s)
  }
  function ensureUi(){
    ensureCss();
    let layer=$("microTacticalPreviewLayer");if(!layer){layer=document.createElement("div");layer.id="microTacticalPreviewLayer";layer.innerHTML='<div id="microPreviewRangeZone" class="micro-preview-zone"></div><div id="microPreviewAreaZone" class="micro-preview-area-zone" hidden></div>';stage.appendChild(layer)}
    let bar=$("microTacticalPreviewBar");if(!bar){
      bar=document.createElement("div");bar.id="microTacticalPreviewBar";bar.innerHTML='<div class="micro-preview-info"><b id="microPreviewAction"></b><span class="micro-preview-chip" id="microPreviewRange"></span><span class="micro-preview-chip" id="microPreviewTargets"></span><span class="micro-preview-chip" id="microPreviewArea" hidden></span><span class="micro-preview-hint" id="microPreviewHint"></span></div><button type="button" class="btn micro-preview-cancel" id="microPreviewCancel">✕ Cancelar prévia</button>';
      const tactical=$("microTacticalHud");if(tactical?.parentElement)tactical.insertAdjacentElement("afterend",bar);else viewport.insertAdjacentElement("beforebegin",bar);
      $("microPreviewCancel").onclick=()=>{try{globalThis.MICROCOSMOS_COMBAT_EXECUTOR?.cancel?.()}catch(_e){}clear()}
    }
  }
  function positionZone(el,caster,meters,kind){
    const s=gridSize(),stepPx=Math.max(0,meters)/1.5*s,half=Math.max(s/2,stepPx+s/2);
    el.classList.toggle("square",kind==="square");el.classList.toggle("circle",kind!=="square");
    el.style.left=`${(+caster.x||0)-half}px`;el.style.top=`${(+caster.y||0)-half}px`;el.style.width=`${half*2}px`;el.style.height=`${half*2}px`
  }
  function clearTokenMarks(){
    tokenLayer.querySelectorAll("[data-token]").forEach(el=>{el.classList.remove("micro-preview-valid","micro-preview-invalid","micro-preview-caster");el.querySelector(":scope>.micro-preview-distance")?.remove()})
  }
  function showHint(text){
    ensureUi();const el=$("microPreviewHint");if(!el)return;el.textContent=text;clearTimeout(hintTimer);hintTimer=setTimeout(()=>{if(el.textContent===text)el.textContent=""},1500)
  }
  function clear(){
    active=null;lastSignature="";document.body.classList.remove("micro-tactical-preview-active");clearTokenMarks();
    const bar=$("microTacticalPreviewBar");bar?.classList.remove("active");
    const layer=$("microTacticalPreviewLayer");if(layer)layer.style.display="none"
  }
  function begin(caster,type,index,item){
    if(!caster||!item)return;
    active={caster,type,index,item,range:parseRange(item),area:areaInfo(item)};lastSignature="";render(true)
  }
  function detectFromTargetMode(){
    if(!document.body.classList.contains("micro-auto-target")){if(active)clear();return}
    const selectedEl=tokenLayer.querySelector(".token.selected"),combat=globalThis.MICROCOSMOS_INITIATIVE?.combat;
    const caster=players().find(p=>String(p.id)===String(selectedEl?.dataset?.token))||players().find(p=>String(p.id)===String(combat?.active_token_id));
    if(!caster)return;
    const text=String(status?.textContent||""),m=text.match(/^🎯\s*(.+?):\s*selecione/i),name=m?.[1]?.trim();
    if(!name){if(active)render();return}
    let index=(caster.attacks||[]).findIndex(x=>String(x.name)===name),type="attack",item=index>=0?caster.attacks[index]:null;
    if(!item){index=(caster.spells||[]).findIndex(x=>String(x.name)===name);type="spell";item=index>=0?caster.spells[index]:null}
    if(!item)return;
    const signature=`${caster.id}:${type}:${index}:${name}`;
    if(!active||lastSignature!==signature){begin(caster,type,index,item);lastSignature=signature}else render()
  }
  function render(force=false){
    if(!active)return;ensureUi();
    const layer=$("microTacticalPreviewLayer"),rangeZone=$("microPreviewRangeZone"),areaZone=$("microPreviewAreaZone"),bar=$("microTacticalPreviewBar");
    if(!layer||!rangeZone||!bar)return;
    layer.style.display="block";bar.classList.add("active");document.body.classList.add("micro-tactical-preview-active");
    positionZone(rangeZone,active.caster,active.range,gridType()==="square"?"square":"circle");

    const area=areaInfo(active.item);active.area=area;
    if(area.centered&&area.meters>0&&(area.kind==="radius"||area.kind==="cube")){
      areaZone.hidden=false;positionZone(areaZone,active.caster,area.meters,area.kind==="cube"?"square":"circle")
    }else areaZone.hidden=true;

    clearTokenMarks();let validCount=0;
    for(const p of players()){
      const el=tokenLayer.querySelector(`[data-token="${CSS.escape(String(p.id))}"]`);if(!el)continue;
      const valid=validTarget(p),caster=String(p.id)===String(active.caster.id);if(valid)validCount++;
      el.classList.add(valid?"micro-preview-valid":"micro-preview-invalid");if(caster)el.classList.add("micro-preview-caster");
      if(!caster){const badge=document.createElement("span");badge.className="micro-preview-distance";badge.textContent=`${fmt(distance(active.caster,p))} m`;el.appendChild(badge)}
    }
    $("microPreviewAction").textContent=`👁️ ${active.item.name||"Ação"}`;
    $("microPreviewRange").textContent=active.range<=0?"🎯 Pessoal":`📏 Alcance ${fmt(active.range)} m`;
    $("microPreviewTargets").textContent=`✅ ${validCount} alvo${validCount===1?"":"s"} no alcance`;
    const areaChip=$("microPreviewArea");if(areaChip){areaChip.hidden=!area.label;areaChip.textContent=area.label?`▧ Área: ${area.label}`:""}
  }

  // A prévia não deixa um clique inválido chegar ao executor. Assim testar o
  // alcance não consome Ação nem Slot Mágico por engano.
  window.addEventListener("pointerdown",e=>{
    if(!active||!document.body.classList.contains("micro-auto-target"))return;
    const el=e.target?.closest?.("#tokenLayer [data-token]");if(!el)return;
    const target=players().find(p=>String(p.id)===String(el.dataset.token));if(!target||validTarget(target))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showHint(`🚫 Fora do alcance: ${fmt(distance(active.caster,target))} m`)
  },true);

  ensureUi();
  setInterval(detectFromTargetMode,90);
  globalThis.MICROCOSMOS_TACTICAL_PREVIEW_API={begin,clear,render,parseRange,distance,areaInfo,get active(){return active}};
})();
