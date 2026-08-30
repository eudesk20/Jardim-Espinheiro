/* MICROCOSMOS — Atlas da Campanha v2: Pontos de Entrada por Cena. */
(async function(){
  if(globalThis.MICROCOSMOS_ATLAS_ENTRY_POINTS)return;
  globalThis.MICROCOSMOS_ATLAS_ENTRY_POINTS=true;

  const $=id=>document.getElementById(id),stage=$("stage"),left=$("leftPanel"),viewport=$("viewport"),mapStatus=$("mapStatus");
  if(!stage||!left)return;

  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  for(let i=0;i<100&&!globalThis.MICROCOSMOS_ATLAS;i++)await wait(80);
  const atlasApi=globalThis.MICROCOSMOS_ATLAS;
  if(!atlasApi)return;

  let placing=null,dragging=null;
  const uid=()=>crypto.randomUUID?.()||`entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const activeScene=()=>atlasApi.active?.()||null;
  function points(scene=activeScene()){
    if(!scene)return[];
    if(!Array.isArray(scene.entryPoints))scene.entryPoints=[];
    return scene.entryPoints
  }
  function persist(){atlasApi.save?.();renderMarkers();renderPanel();document.dispatchEvent(new CustomEvent("microcosmos:atlas-entry-points-changed",{detail:{sceneId:activeScene()?.id||""}}))}
  function stagePoint(e){
    const r=stage.getBoundingClientRect(),w=stage.offsetWidth||1400,h=stage.offsetHeight||900;
    return{x:(e.clientX-r.left)*(w/r.width),y:(e.clientY-r.top)*(h/r.height)}
  }
  function ensureStyle(){
    if($("microAtlasEntryStyle"))return;
    const s=document.createElement("style");s.id="microAtlasEntryStyle";s.textContent=`
      #microAtlasEntryLayer{position:absolute;inset:0;z-index:15;pointer-events:none;overflow:visible}
      .micro-atlas-entry-marker{position:absolute;transform:translate(-50%,-50%);pointer-events:auto;display:flex;align-items:center;gap:4px;border:2px solid #735e3e;background:#fff6d6;color:#342a1e;border-radius:999px;padding:4px 7px 4px 5px;box-shadow:0 3px 10px #0008;font:bold 12px Georgia,serif;cursor:grab;user-select:none;white-space:nowrap}
      .micro-atlas-entry-marker:active{cursor:grabbing}.micro-atlas-entry-marker b{display:grid;place-items:center;width:23px;height:23px;border-radius:50%;background:#405d3e;color:white;font-size:14px}.micro-atlas-entry-marker span{max-width:150px;overflow:hidden;text-overflow:ellipsis}
      .micro-atlas-entry-panel{margin-top:10px}.micro-entry-actions{display:flex;gap:5px;flex-wrap:wrap}.micro-entry-actions .btn{flex:1;min-width:110px}.micro-entry-list{display:grid;gap:5px;margin-top:7px}.micro-entry-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px;align-items:center;padding:6px;border:1px solid #b09a77;border-radius:8px;background:#fff8e7}.micro-entry-row strong{display:block;color:#405d3e}.micro-entry-row small{color:#79664e}.micro-entry-row-actions{display:flex;gap:3px}.micro-entry-mini{border:1px solid #9a815e;background:#f7ecd3;border-radius:7px;padding:4px 6px;min-width:30px}.micro-entry-empty{font-size:.72rem;color:#76634c;padding:7px;background:#fff8e7;border-radius:8px}.micro-entry-hint{font-size:.7rem;color:#6c5a43;margin-top:5px}.micro-entry-placing #viewport{cursor:crosshair!important}.micro-entry-placing #mapStatus{font-weight:bold;color:#ffe7a0}
    `;document.head.appendChild(s)
  }
  function layer(){
    let l=$("microAtlasEntryLayer");if(!l){l=document.createElement("div");l.id="microAtlasEntryLayer";stage.appendChild(l)}return l
  }
  function renderMarkers(){
    ensureStyle();const l=layer();l.innerHTML="";
    for(const p of points()){
      const b=document.createElement("button");b.type="button";b.className="micro-atlas-entry-marker";b.dataset.entryPoint=p.id;b.style.left=`${+p.x||0}px`;b.style.top=`${+p.y||0}px`;b.title=`Ponto de Entrada: ${p.name||"Entrada"}`;b.innerHTML=`<b>📍</b><span>${esc(p.name||"Entrada")}</span>`;l.appendChild(b)
    }
  }
  function ensurePanel(){
    let p=$("microAtlasEntryPanel");if(!p){p=document.createElement("section");p.id="microAtlasEntryPanel";p.className="panel micro-atlas-entry-panel";const atlasPanel=$("microCampaignAtlas");atlasPanel?.insertAdjacentElement("afterend",p)||left.insertBefore(p,left.firstChild)}return p
  }
  function renderPanel(){
    const panel=ensurePanel(),scene=activeScene(),list=points(scene);
    panel.innerHTML=`<h3 style="margin:.1rem 0 .4rem">📍 Pontos de Entrada</h3><div class="micro-entry-hint">Cena: <b>${esc(scene?.name||"—")}</b>. Estes pontos serão os destinos das Transições.</div><div class="micro-entry-actions"><button class="btn primary" data-entry-new>＋ Novo Ponto</button><button class="btn" data-entry-cancel ${placing?"":"disabled"}>✕ Cancelar</button></div><div class="micro-entry-list" data-entry-list></div>`;
    const host=panel.querySelector("[data-entry-list]");
    if(!list.length)host.innerHTML='<div class="micro-entry-empty">Nenhum Ponto de Entrada nesta Cena.</div>';
    for(const p of list){const row=document.createElement("div");row.className="micro-entry-row";row.innerHTML=`<div><strong>📍 ${esc(p.name||"Entrada")}</strong><small>X ${Math.round(+p.x||0)} • Y ${Math.round(+p.y||0)}</small></div><div class="micro-entry-row-actions"><button class="micro-entry-mini" data-center title="Centralizar">🎯</button><button class="micro-entry-mini" data-rename title="Renomear">✎</button><button class="micro-entry-mini" data-delete title="Excluir">🗑</button></div>`;
      row.querySelector("[data-center]").onclick=()=>centerPoint(p);row.querySelector("[data-rename]").onclick=()=>renamePoint(p);row.querySelector("[data-delete]").onclick=()=>deletePoint(p);host.appendChild(row)}
    panel.querySelector("[data-entry-new]").onclick=beginPlacement;panel.querySelector("[data-entry-cancel]").onclick=cancelPlacement
  }
  function beginPlacement(){
    const name=prompt("Nome do Ponto de Entrada:",`Entrada ${points().length+1}`);if(!name?.trim())return;
    placing={id:uid(),name:name.trim()};document.body.classList.add("micro-entry-placing");if(mapStatus)mapStatus.textContent=`📍 ${placing.name}: clique no mapa para posicionar • Esc cancela`;renderPanel()
  }
  function cancelPlacement(){placing=null;document.body.classList.remove("micro-entry-placing");if(mapStatus){const s=activeScene();mapStatus.textContent=`Cena: ${s?.name||"Atual"}`}renderPanel()}
  function renamePoint(p){const name=prompt("Renomear Ponto de Entrada:",p.name||"Entrada");if(!name?.trim())return;p.name=name.trim();persist()}
  function deletePoint(p){if(!confirm(`Excluir o Ponto de Entrada “${p.name||"Entrada"}”?`))return;const s=activeScene();if(!s)return;s.entryPoints=points(s).filter(x=>x.id!==p.id);persist()}
  function centerPoint(p){
    const api=globalThis.MICROCOSMOS_TABLE_API;if(!viewport||!api?.setTransform)return;
    // A Mesa atual não expõe pan/zoom diretamente. Um evento permite que a futura camada de Atlas o faça sem acoplar esta ferramenta ao motor antigo.
    document.dispatchEvent(new CustomEvent("microcosmos:center-stage-point",{detail:{x:+p.x||0,y:+p.y||0,name:p.name||"Entrada"}}));
    const marker=document.querySelector(`[data-entry-point="${CSS.escape(String(p.id))}"]`);marker?.animate?.([{transform:"translate(-50%,-50%) scale(1)"},{transform:"translate(-50%,-50%) scale(1.25)"},{transform:"translate(-50%,-50%) scale(1)"}],{duration:420})
  }
  document.addEventListener("pointerdown",e=>{
    const marker=e.target?.closest?.("[data-entry-point]");
    if(marker&&!placing&&e.button===0){const p=points().find(x=>String(x.id)===String(marker.dataset.entryPoint));if(!p)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const pt=stagePoint(e);dragging={id:p.id,pointer:e.pointerId,dx:pt.x-(+p.x||0),dy:pt.y-(+p.y||0)};marker.setPointerCapture?.(e.pointerId);return}
    if(!placing||e.button!==0||!e.target?.closest?.("#viewport")||e.target?.closest?.("[data-token],.micro-atlas-entry-marker"))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const pt=stagePoint(e),s=activeScene();if(!s)return;points(s).push({id:placing.id,name:placing.name,x:+pt.x.toFixed(1),y:+pt.y.toFixed(1),createdAt:Date.now()});const label=placing.name;placing=null;document.body.classList.remove("micro-entry-placing");if(mapStatus)mapStatus.textContent=`📍 ${label} criado em ${s.name}`;persist()
  },true);
  document.addEventListener("pointermove",e=>{if(!dragging||dragging.pointer!==e.pointerId)return;const p=points().find(x=>String(x.id)===String(dragging.id));if(!p)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const pt=stagePoint(e);p.x=+(pt.x-dragging.dx).toFixed(1);p.y=+(pt.y-dragging.dy).toFixed(1);const marker=document.querySelector(`[data-entry-point="${CSS.escape(String(p.id))}"]`);if(marker){marker.style.left=`${p.x}px`;marker.style.top=`${p.y}px`}},true);
  for(const ev of ["pointerup","pointercancel"])document.addEventListener(ev,e=>{if(!dragging||dragging.pointer!==e.pointerId)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();dragging=null;persist()},true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&placing)cancelPlacement()},true);
  document.addEventListener("contextmenu",e=>{if(placing){e.preventDefault();cancelPlacement()}},true);
  document.addEventListener("microcosmos:scene-changed",renderMarkers);

  ensureStyle();renderMarkers();renderPanel();
  globalThis.MICROCOSMOS_ATLAS_ENTRY_POINTS_API={points,activePoints:()=>points(),getPoint:(sceneId,pointId)=>{const s=atlasApi.data?.scenes?.find(x=>String(x.id)===String(sceneId));return points(s).find(x=>String(x.id)===String(pointId))||null},render:()=>{renderMarkers();renderPanel()},beginPlacement};
})();
