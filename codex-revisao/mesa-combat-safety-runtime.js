/* MICROCOSMOS — Blindagem do executor de combate.
   Mantém dados de magia atualizados e impede ações através das barreiras VISUAIS
   reais do cenário.

   v1.4:
   - não depende mais das coordenadas salvas pelo Construtor de Cenário;
   - lê diretamente as linhas SVG que estão desenhadas na Mesa;
   - parede, porta fechada/trancada e janela fechada bloqueiam a seleção;
   - a checagem acontece no WINDOW/capture, antes do Pointer chegar ao executor;
   - não gasta Ação nem Slot quando a barreira bloqueia o alvo.
*/
(async function(){
  if(globalThis.MICROCOSMOS_MESA_COMBAT_SAFETY)return;
  globalThis.MICROCOSMOS_MESA_COMBAT_SAFETY=true;
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  if(!Array.isArray(players))return;

  const $=id=>document.getElementById(id);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const spellLevel=s=>+(s?.lvl??s?.level??s?.circle??0)||0;
  const abilityMod=caster=>{const key=caster?.spellAbility||"INT",score=+caster?.stats?.[key]||10;return Math.floor((score-10)/2)};
  function resolveCasterMod(expr,caster){
    const raw=String(expr||"");if(!raw)return raw;const m=abilityMod(caster),rep=m>=0?`+${m}`:`${m}`;
    return raw.replace(/\+?\s*Mod\.?\s*(?:de\s*)?Conjura(?:ção|cao)/gi,rep).replace(/\s+/g,"")
  }
  function normalizeSpell(s,caster){
    if(!s)return s;
    const healing=s.healing||((s.kind==="cura"||s.kind==="healing")?s.damage:"")||"";
    const damage=(s.kind==="cura"||s.kind==="healing")?"":(s.damage||"");
    s.lvl=spellLevel(s);s.level=s.lvl;s.healing=resolveCasterMod(healing,caster);s.damage=resolveCasterMod(damage,caster);
    if(s.healing)s.kind="cura";
    return s
  }
  function normalizeCaster(caster){for(const s of caster?.spells||[])normalizeSpell(s,caster);return caster}

  // ---------------------------------------------------------------------------
  // GEOMETRIA DE TELA
  // Tudo abaixo trabalha em coordenadas do navegador. Assim, mesmo que o
  // Construtor esteja temporariamente com offset de cursor/viewBox, a barreira
  // usada no combate é exatamente a linha preta/porta/janela que aparece na tela.
  // ---------------------------------------------------------------------------
  function orient(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
  function onSeg(a,b,p){return p.x>=Math.min(a.x,b.x)-1&&p.x<=Math.max(a.x,b.x)+1&&p.y>=Math.min(a.y,b.y)-1&&p.y<=Math.max(a.y,b.y)+1}
  function segmentsIntersect(a,b,c,d){
    const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b),eps=1;
    if(((o1>eps&&o2<-eps)||(o1<-eps&&o2>eps))&&((o3>eps&&o4<-eps)||(o3<-eps&&o4>eps)))return true;
    if(Math.abs(o1)<=eps&&onSeg(a,b,c))return true;
    if(Math.abs(o2)<=eps&&onSeg(a,b,d))return true;
    if(Math.abs(o3)<=eps&&onSeg(c,d,a))return true;
    if(Math.abs(o4)<=eps&&onSeg(c,d,b))return true;
    return false
  }
  function tokenScreenCenter(token){
    if(!token)return null;
    let el=null;try{el=document.querySelector(`#tokenLayer [data-token="${CSS.escape(String(token.id))}"]`)}catch(_e){}
    if(!el)return null;const r=el.getBoundingClientRect();
    return{x:r.left+r.width/2,y:r.top+r.height/2}
  }
  function lineBlocks(line){
    if(!line)return false;
    if(line.classList.contains("wall"))return true;
    if(line.classList.contains("door"))return !line.classList.contains("open")&&!line.classList.contains("half");
    if(line.classList.contains("window"))return !line.classList.contains("open");
    return false
  }
  function visualLines(){
    return [...document.querySelectorAll("#microSceneVisibleLayer .micro-scene-segment,#microSceneMasterLayer .micro-scene-segment")]
      .filter(line=>lineBlocks(line)&&line.getClientRects().length)
  }
  function screenPointForLine(line,x,y){
    try{
      const svg=line?.ownerSVGElement,matrix=line?.getScreenCTM?.()||svg?.getScreenCTM?.();if(!svg||!matrix)return null;
      const p=svg.createSVGPoint();p.x=+x||0;p.y=+y||0;const out=p.matrixTransform(matrix);
      return{x:out.x,y:out.y}
    }catch(_e){return null}
  }
  function visualSegment(line){
    const a=screenPointForLine(line,line.getAttribute("x1"),line.getAttribute("y1"));
    const b=screenPointForLine(line,line.getAttribute("x2"),line.getAttribute("y2"));
    return a&&b?{a,b}:null
  }
  function visualLineBlocker(from,to){
    const a=tokenScreenCenter(from),b=tokenScreenCenter(to);if(!a||!b)return null;
    for(const line of visualLines()){
      const seg=visualSegment(line);if(seg&&segmentsIntersect(a,b,seg.a,seg.b))return line
    }
    return null
  }

  // Fallback lógico apenas se a camada SVG ainda não tiver sido criada.
  function sceneBlockers(){
    const scene=globalThis.MICROCOSMOS_SCENE;
    try{return (scene?.elements||[]).filter(el=>{const b=scene.behavior?.(el)||el;return !!(b?.blocksVision||b?.blocksMovement)})}catch(_e){return[]}
  }
  function logicalLineBlocker(from,to){
    const a={x:+from?.x||0,y:+from?.y||0},b={x:+to?.x||0,y:+to?.y||0};
    for(const el of sceneBlockers()){
      const c={x:+el.x1||0,y:+el.y1||0},d={x:+el.x2||0,y:+el.y2||0};if(segmentsIntersect(a,b,c,d))return el
    }
    return null
  }
  function lineBlocker(from,to){
    if(!from||!to)return null;
    // Se existem linhas visuais, elas são a autoridade para combate.
    const lines=visualLines();if(lines.length)return visualLineBlocker(from,to);
    return logicalLineBlocker(from,to)
  }
  function blockerLabel(blocker){
    const cls=blocker?.classList;
    if(cls?.contains("wall")||blocker?.type==="wall")return"Parede";
    if(cls?.contains("door")||blocker?.type==="door")return"Porta";
    if(cls?.contains("window")||blocker?.type==="window")return"Janela";
    return"Barreira"
  }
  function blockedTarget(caster,target){const barrier=lineBlocker(caster,target);return barrier?{blocked:true,barrier}:{blocked:false,barrier:null}}
  function showBlocked(barrier,target){
    const text=`🧱 ${blockerLabel(barrier)} bloqueia ${target?.name||"o alvo"}. Escolha outro alvo.`;
    const status=$("mapStatus");if(status)status.textContent=text;
    const hint=$("microPreviewHint");if(hint)hint.textContent=text;
    if(globalThis.MICROCOSMOS_TOKEN_ACTIONS?.showToast)try{globalThis.MICROCOSMOS_TOKEN_ACTIONS.showToast(text)}catch(_e){}
  }

  let tries=0,executor=null,currentTargeting=null;
  while(!(executor=globalThis.MICROCOSMOS_COMBAT_EXECUTOR)&&tries++<120)await wait(100);
  if(!executor?.start||executor.start.__microSafety)return;
  const originalStart=executor.start.bind(executor),originalCancel=typeof executor.cancel==="function"?executor.cancel.bind(executor):null;

  const wrapped=async function(caster,type,index){
    const staleItem=(type==="spell"?caster?.spells:caster?.attacks)?.[index],staleName=staleItem?.name||"";
    try{await globalThis.MICROCOSMOS_TABLE_COMBAT_DATA?.refresh?.()}catch(_e){}
    const fresh=players.find(p=>String(p.id)===String(caster?.id))||caster;normalizeCaster(fresh);
    let freshIndex=index;if(type==="spell"&&staleName){const byName=(fresh.spells||[]).findIndex(s=>s?.name===staleName);if(byName>=0)freshIndex=byName}
    currentTargeting={caster:fresh,type,index:freshIndex};
    const result=await originalStart(fresh,type,freshIndex);
    if(!document.body.classList.contains("micro-auto-target"))currentTargeting=null;
    return result
  };
  wrapped.__microSafety=true;executor.start=wrapped;
  if(originalCancel){executor.cancel=function(){currentTargeting=null;return originalCancel()};executor.cancel.__microSafety=true}

  function targetFromEvent(e){
    const el=e.target?.closest?.("#tokenLayer [data-token]");if(!el)return null;
    return players.find(p=>String(p.id)===String(el.dataset.token))||null
  }
  function selectedCaster(){
    const preview=globalThis.MICROCOSMOS_TACTICAL_PREVIEW_API?.active?.caster;if(preview)return preview;
    const selected=document.querySelector("#tokenLayer .token.selected");
    const bySelected=selected&&players.find(p=>String(p.id)===String(selected.dataset.token));if(bySelected)return bySelected;
    const activeId=globalThis.MICROCOSMOS_INITIATIVE?.combat?.active_token_id;
    return players.find(p=>String(p.id)===String(activeId))||null
  }
  function protectPointer(e){
    if(!document.body.classList.contains("micro-auto-target")){currentTargeting=null;return}
    const target=targetFromEvent(e);if(!target)return;
    const caster=currentTargeting?.caster||selectedCaster();if(!caster||String(caster.id)===String(target.id))return;
    const verdict=blockedTarget(caster,target);if(!verdict.blocked)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showBlocked(verdict.barrier,target)
  }

  // WINDOW/capture ocorre antes dos listeners internos do executor registrados no document.
  for(const eventName of ["pointerdown","pointerup","click","touchstart","touchend"])window.addEventListener(eventName,protectPointer,{capture:true,passive:false});
  window.addEventListener("keydown",e=>{if(e.key==="Escape")currentTargeting=null},true);

  globalThis.MICROCOSMOS_LINE_OF_EFFECT={
    lineBlocker,blockedTarget,getBlockers:sceneBlockers,getVisualBlockers:visualLines,
    debug:(caster,target)=>({caster:tokenScreenCenter(caster),target:tokenScreenCenter(target),visualBlockers:visualLines().length,blocked:blockedTarget(caster,target)})
  };
  globalThis.MICROCOSMOS_COMBAT_EXECUTOR=executor;
})();
