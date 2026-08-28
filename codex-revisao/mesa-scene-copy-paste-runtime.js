/* MICROCOSMOS — Copiar / Colar no Construtor de Cenário.
   Ctrl/Cmd+C copia o objeto selecionado (ou seu grupo fundido).
   Ctrl/Cmd+V cola uma cópia independente com pequeno deslocamento.
   Não intercepta atalhos quando o usuário estiver digitando em campos de texto.
*/
(function(){
  if(globalThis.MICROCOSMOS_SCENE_COPY_PASTE)return;
  globalThis.MICROCOSMOS_SCENE_COPY_PASTE=true;

  let clipboard=null,pasteCount=0;

  const clone=value=>{try{return structuredClone(value)}catch{return JSON.parse(JSON.stringify(value))}};
  const uid=()=>crypto.randomUUID?.()||`geo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  function editableTarget(target){
    if(!target)return false;
    const tag=String(target.tagName||"").toLowerCase();
    return target.isContentEditable||["input","textarea","select"].includes(tag)||!!target.closest?.('[contenteditable="true"]')
  }
  function api(){return globalThis.MICROCOSMOS_SCENE}
  function selectedId(){
    const root=document.querySelector('.micro-scene-segment.selected,.micro-light-area.selected');
    return root?.closest?.('[data-scene-id]')?.dataset?.sceneId||""
  }
  function selectedElements(){
    const sceneApi=api(),id=selectedId();if(!sceneApi?.isMaster||!id)return[];
    const source=sceneApi.elements?.find?.(element=>String(element.id)===String(id));if(!source)return[];
    if(source.groupId)return sceneApi.elements.filter(element=>element.groupId===source.groupId);
    // Uma porta vinculada faz sentido como objeto composto somente quando o par está presente.
    if(source.type==="door"&&source.linkId){const linked=sceneApi.elements.filter(element=>element.type==="door"&&element.linkId===source.linkId);if(linked.length>1)return linked}
    return[source]
  }
  function shiftElement(element,dx,dy){
    const out=clone(element);
    for(const key of ["x1","x2","cx"]){if(Number.isFinite(+out[key]))out[key]=+(+out[key]+dx).toFixed(1)}
    for(const key of ["y1","y2","cy"]){if(Number.isFinite(+out[key]))out[key]=+(+out[key]+dy).toFixed(1)}
    if(Array.isArray(out.points))out.points=out.points.map(point=>({...point,x:+((+point.x||0)+dx).toFixed(1),y:+((+point.y||0)+dy).toFixed(1)}));
    return out
  }
  function copySelection(){
    const elements=selectedElements();if(!elements.length)return false;
    clipboard={elements:clone(elements),copiedAt:Date.now()};pasteCount=0;
    announce(`📋 ${elements.length>1?`${elements.length} partes copiadas`:`${elements[0].type||"Objeto"} copiado`} — Ctrl+V para colar.`);
    return true
  }
  function pasteSelection(){
    const sceneApi=api();if(!sceneApi?.isMaster||!clipboard?.elements?.length||typeof sceneApi.add!=="function")return false;
    pasteCount++;
    const grid=Math.max(20,+(document.getElementById("gridSize")?.value)||70),offset=Math.max(14,Math.min(35,grid*.3))*pasteCount;
    const originals=clipboard.elements,groupMap=new Map(),linkCounts=new Map();
    originals.forEach(element=>{if(element.linkId)linkCounts.set(element.linkId,(linkCounts.get(element.linkId)||0)+1)});
    const linkMap=new Map();
    const pasted=originals.map(source=>{
      const next=shiftElement(source,offset,offset);next.id=uid();
      if(source.groupId){if(!groupMap.has(source.groupId))groupMap.set(source.groupId,uid());next.groupId=groupMap.get(source.groupId)}
      if(source.linkId){
        // Só preserva o vínculo quando todas as partes vinculadas foram copiadas juntas.
        if((linkCounts.get(source.linkId)||0)>1){if(!linkMap.has(source.linkId))linkMap.set(source.linkId,uid());next.linkId=linkMap.get(source.linkId)}
        else delete next.linkId
      }
      return next
    });
    pasted.forEach(element=>sceneApi.add(element));
    sceneApi.refresh?.();
    announce(`📌 ${pasted.length>1?`${pasted.length} partes coladas`:`Cópia colada`} • deslocamento ${Math.round(offset)} px.`);
    return true
  }
  function announce(text){
    const status=document.getElementById("microBuilderStatus");if(!status)return;
    const previous=status.dataset.copyPasteBase||status.innerHTML;status.dataset.copyPasteBase=previous;
    status.innerHTML=`${previous}<div data-copy-paste-message style="margin-top:5px;color:#5b3c73"><b>${text}</b></div>`;
    clearTimeout(announce.timer);announce.timer=setTimeout(()=>{const current=document.getElementById("microBuilderStatus");if(current?.dataset.copyPasteBase){current.innerHTML=current.dataset.copyPasteBase;delete current.dataset.copyPasteBase}},2200)
  }
  function ensureHint(){
    if(document.getElementById("microSceneCopyPasteHint"))return;
    const status=document.getElementById("microBuilderStatus");if(!status)return;
    const hint=document.createElement("div");hint.id="microSceneCopyPasteHint";hint.style.cssText="margin-top:6px;padding:5px 7px;border:1px dashed #a58c68;border-radius:7px;background:#fffaf0;font-size:.68rem;color:#66523e";hint.innerHTML="⌨️ <b>Ctrl+C</b> copiar • <b>Ctrl+V</b> colar objeto selecionado";status.insertAdjacentElement("afterend",hint)
  }
  function install(){
    const sceneApi=api();if(!sceneApi)return false;
    if(!sceneApi.isMaster)return true;
    ensureHint();
    window.addEventListener("keydown",event=>{
      if(editableTarget(event.target)||!(event.ctrlKey||event.metaKey)||event.altKey)return;
      const key=String(event.key||"").toLowerCase();
      if(key==="c"&&copySelection()){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();return}
      if(key==="v"&&pasteSelection()){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation()}
    },true);
    return true
  }

  if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>100)clearInterval(timer)},100)}
  globalThis.MICROCOSMOS_SCENE_COPY_PASTE_API={copy:copySelection,paste:pasteSelection,get hasCopy(){return!!clipboard?.elements?.length}};
})();
