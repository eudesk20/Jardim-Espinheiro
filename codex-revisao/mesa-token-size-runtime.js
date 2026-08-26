/* MICROCOSMOS — Tamanho e espaço dos Tokens na Mesa.
   Regra visual/mecânica base:
   Minúsculo: 4 por célula; Pequeno/Médio: 1 célula; Grande: 2x2 / 3 hexes;
   Enorme: 3x3 / 7 hexes; Colossal: 4x4+ / 12+ hexes.
   O tamanho mecânico continua aplicado a todos os tokens, mas o painel de
   controle Tamanho no Grid é visível exclusivamente para contas Mestre.
*/
(async function(){
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
  let drag=null,queued=false,isMaster=false,lastPanelKey="";

  function norm(v){const raw=String(v||"").trim(),key=raw.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();return ALIAS[key]||SIZES.find(s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()===key)||"Médio"}
  function selected(){const el=tokenLayer.querySelector(".token.selected");return el?players.find(p=>p.id===el.dataset.token):null}
  function baseSize(p){return norm(p?.sizeBase||p?.baseSize||p?.sizeProfile?.base||p?.size||"Médio")}
  function currentSize(p){return norm(overrides[p?.id]?.size||p?.sizeProfile?.current||p?.size||baseSize(p))}
  function visualScale(p){const raw=overrides[p?.id]?.visualScale,n=raw===undefined?100:+raw;return Math.max(60,Math.min(140,Number.isFinite(n)?n:100))}
  function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(overrides))}catch(_e){}}
  function rule(p){return RULES[currentSize(p)]||RULES["Médio"]}
  function gridPx(){return Math.max(20,+gridSize.value||70)}
  function pixelSize(p){const r=rule(p),factor=gridType.value==="hex"?r.hexCells:r.squareCells;return Math.max(24,gridPx()*factor*visualScale(p)/100)}
  function footprintText(p){const r=rule(p);return gridType.value==="hex"?r.hexText:r.squareText}

  async function resolveRole(){
    try{
      const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      const sb=createClient("https://evyhhlbvhspiuwouivbb.supabase.co","sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:{session}}=await sb.auth.getSession();
      if(!session){isMaster=false;return}
      const {data}=await sb.from("profiles").select("role,approved").eq("id",session.user.id).maybeSingle();
      isMaster=data?.role==="master"&&data?.approved!==false;
    }catch(_e){isMaster=false}
  }

  function ensureCss(){if($("microTokenSizeStyle"))return;const s=document.createElement("style");s.id="microTokenSizeStyle";s.textContent=`
    #tokenLayer .token{transition:none!important}#tokenLayer .token>small{top:calc(100% + 3px)!important}#tokenLayer .token>.hp{bottom:-10px!important}.micro-token-size-panel{margin-top:9px;padding:9px;border:1px solid #9b8058;border-radius:10px;background:#f5ecd8}.micro-token-size-panel h3{margin:0 0 7px!important}.micro-size-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.micro-size-grid label{font-size:.68rem;font-weight:bold;color:#6d5a43}.micro-size-grid select,.micro-size-grid input{width:100%;margin-top:3px}.micro-size-summary{margin-top:6px;font-size:.72rem;color:#6b5a43}.micro-size-temp-badge{display:inline-block;background:#6b4d87;color:#fff;border-radius:999px;padding:2px 6px;font-size:.64rem;margin-left:5px}.micro-master-scale{padding:7px;border:1px dashed #8a6a96;border-radius:8px;background:#f0e6f4}.micro-master-only-note{font-size:.65rem;color:#77527f;display:block;margin-top:3px}@media(max-width:620px){.micro-size-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(s)
  }
  function applyToken(p){
    const el=tokenLayer.querySelector(`[data-token="${CSS.escape(p.id)}"]`);if(!el)return;
    const px=pixelSize(p),font=Math.max(.72,Math.min(1.4,px/58*1.05));
    if(el.style.width!==`${px}px`)el.style.width=`${px}px`;
    if(el.style.height!==`${px}px`)el.style.height=`${px}px`;
    if(el.style.fontSize!==`${font}rem`)el.style.fontSize=`${font}rem`;
    el.dataset.size=currentSize(p);el.title=`${p.name} • ${currentSize(p)} • ${footprintText(p)}`
  }
  function decorate(){for(const p of players)applyToken(p);renderControls()}

  function panelKey(p){return [p?.id,baseSize(p),currentSize(p),visualScale(p),gridType.value,!!overrides[p?.id]?.size].join("|")}
  function renderControls(force=false){
    let panel=$("microTokenSizePanel");
    // Jogadores não veem nenhuma parte do painel. O tamanho mecânico do token
    // continua sendo aplicado por applyToken(), independentemente desta UI.
    if(!isMaster){if(panel)panel.remove();lastPanelKey="";return}
    const p=selected();
    if(!p){if(panel)panel.remove();lastPanelKey="";return}
    ensureCss();
    if(!panel){panel=document.createElement("div");panel.id="microTokenSizePanel";panel.className="micro-token-size-panel";card.appendChild(panel);force=true}
    const key=panelKey(p);
    if(!force&&key===lastPanelKey)return;
    lastPanelKey=key;
    const base=baseSize(p),cur=currentSize(p),scale=visualScale(p),temporary=!!overrides[p.id]?.size;
    panel.innerHTML=`<h3>📐 Tamanho no Grid</h3><div class="micro-size-grid"><label>Tamanho Base<input value="${base}" disabled></label><label>Tamanho Atual<select id="microTokenCurrentSize">${SIZES.map(s=>`<option value="${s}" ${s===cur?"selected":""}>${s}</option>`).join("")}</select></label><label class="micro-master-scale">Escala visual <b id="microScaleValue">${scale}%</b><input id="microTokenVisualScale" type="range" min="60" max="140" step="5" value="${scale}"><small class="micro-master-only-note">👑 Somente Mestre • ajuste visual, não altera a categoria mecânica.</small></label><label>Ajuste temporário<button type="button" class="btn" id="microResetTokenSize" style="width:100%;margin-top:3px" ${!temporary&&scale===100?"disabled":""}>↩ Voltar ao tamanho base</button></label></div><div class="micro-size-summary"><b>${cur}</b> ocupa <b>${footprintText(p)}</b> no grid atual.${temporary?'<span class="micro-size-temp-badge">TEMPORÁRIO</span>':""}<br><small>A categoria altera o espaço mecânico. A escala visual é exclusiva do Mestre.</small></div>`;
    bindControls(p)
  }
  function bindControls(p){
    const sel=$("microTokenCurrentSize"),range=$("microTokenVisualScale"),reset=$("microResetTokenSize");
    if(sel)sel.addEventListener("change",()=>setTemporarySize(p.id,sel.value,"Ajuste temporário da Mesa"));
    if(range)range.addEventListener("input",()=>{overrides[p.id]=overrides[p.id]||{};overrides[p.id].visualScale=+range.value;save();const val=$("microScaleValue");if(val)val.textContent=`${range.value}%`;applyToken(p);lastPanelKey=panelKey(p)});
    if(reset)reset.addEventListener("click",e=>{e.preventDefault();resetSize(p.id)})
  }
  function setTemporarySize(id,size,source="Efeito temporário"){
    const p=players.find(x=>x.id===id);if(!p)return;
    const next=norm(size),base=baseSize(p);
    overrides[id]=overrides[id]||{};
    if(next===base){delete overrides[id].size;delete overrides[id].source}else{overrides[id].size=next;overrides[id].source=source}
    if(!p.sizeBase)p.sizeBase=base;
    p.size=next;p.sizeTemporary=next!==base;
    save();lastPanelKey="";applyToken(p);renderControls(true);return next
  }
  function resetSize(id){
    const p=players.find(x=>x.id===id);if(!p)return;
    const base=baseSize(p);
    overrides[id]=overrides[id]||{};
    delete overrides[id].size;delete overrides[id].source;overrides[id].visualScale=100;
    if(!Object.keys(overrides[id]).length)delete overrides[id];
    p.size=base;p.sizeTemporary=false;
    save();lastPanelKey="";applyToken(p);renderControls(true);return base
  }
  function setVisualScale(id,percent){
    if(!isMaster)return false;
    const p=players.find(x=>x.id===id);if(!p)return false;
    overrides[id]=overrides[id]||{};overrides[id].visualScale=Math.max(60,Math.min(140,+percent||100));save();lastPanelKey="";applyToken(p);renderControls(true);return true
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}

  function squareSnap(p,x,y){
    const s=gridPx(),size=currentSize(p),cells=size==="Grande"?2:size==="Enorme"?3:size==="Colossal"?4:1;
    if(cells%2===0)return{x:Math.round(x/s)*s,y:Math.round(y/s)*s};
    return{x:Math.floor(x/s)*s+s/2,y:Math.floor(y/s)*s+s/2}
  }
  function stagePoint(e){const stage=$("stage"),r=stage.getBoundingClientRect(),sx=r.width/(stage.offsetWidth||1400),sy=r.height/(stage.offsetHeight||900);return{x:(e.clientX-r.left)/sx,y:(e.clientY-r.top)/sy}}
  function snapOn(){return !/OFF/i.test($("toggleSnap")?.textContent||"")}
  function targeting(){return document.body.classList.contains("micro-auto-target")||document.body.classList.contains("micro-target-mode")}
  // O tamanho continua determinando a ocupação e o encaixe. O arrasto pertence
  // exclusivamente ao controlador de colisão, evitando dois movimentos para
  // o mesmo evento de ponteiro.

  const obs=new MutationObserver(schedule);obs.observe(tokenLayer,{childList:true,subtree:true});
  tokenLayer.addEventListener("click",()=>{if(!isMaster)return;lastPanelKey="";setTimeout(schedule,0)},true);
  document.querySelectorAll("[data-select]").forEach(el=>el.addEventListener("click",()=>{lastPanelKey="";setTimeout(schedule,0)},true));
  gridType.addEventListener("change",()=>{lastPanelKey="";schedule()});gridSize.addEventListener("input",schedule);$("gridMinus")?.addEventListener("click",()=>setTimeout(schedule,0));$("gridPlus")?.addEventListener("click",()=>setTimeout(schedule,0));

  ensureCss();await resolveRole();lastPanelKey="";schedule();
  globalThis.MICROCOSMOS_TOKEN_SIZE={SIZES,RULES,norm,baseSize,currentSize,footprintText,pixelSize,setTemporarySize,resetSize,setVisualScale,isMaster:()=>isMaster,refresh:()=>{lastPanelKey="";schedule()}};
})();
