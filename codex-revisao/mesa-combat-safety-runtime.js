/* MICROCOSMOS — Blindagem do executor de combate.
   Sempre resolve o token e a magia na fonte mais recente antes de executar.
   Evita que uma representação antiga de cura seja tratada como dano e que
   magias de Círculo sejam usadas sem consumir Slot Mágico.
   Também aplica uma trava real de linha de efeito antes do Pointer chegar
   ao executor: paredes, portas fechadas/trancadas e janelas fechadas impedem
   selecionar um token do outro lado sem gastar Ação ou Slot Mágico. */
(async function(){
  if(globalThis.MICROCOSMOS_MESA_COMBAT_SAFETY)return;
  globalThis.MICROCOSMOS_MESA_COMBAT_SAFETY=true;
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  if(!Array.isArray(players))return;

  const $=id=>document.getElementById(id);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const spellLevel=s=>+(s?.lvl??s?.level??s?.circle??0)||0;
  const abilityMod=(caster)=>{const key=caster?.spellAbility||"INT",score=+caster?.stats?.[key]||10;return Math.floor((score-10)/2)};
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
  // LINHA DE EFEITO REAL
  // O executor antigo resolve o alvo por um listener Pointer interno no document.
  // Esta blindagem captura no WINDOW (uma etapa antes do document), portanto uma
  // barreira inválida não consegue chegar ao resolve antigo nem por clique/touch.
  // ---------------------------------------------------------------------------
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
  function blockers(){
    const scene=globalThis.MICROCOSMOS_SCENE;
    try{
      if(scene?.elements)return scene.elements.filter(el=>{
        const state=scene.behavior?.(el)||el;
        return !!(state?.blocksVision||state?.blocksMovement)
      });
    }catch(_e){}
    try{return globalThis.MICROCOSMOS_COLLISION?.getBlockers?.()||[]}catch(_e){return[]}
  }
  function lineBlocker(from,to){
    if(!from||!to)return null;
    const a={x:+from.x||0,y:+from.y||0},b={x:+to.x||0,y:+to.y||0};
    if(Math.hypot(b.x-a.x,b.y-a.y)<2)return null;
    for(const el of blockers()){
      const c={x:+el.x1||0,y:+el.y1||0},d={x:+el.x2||0,y:+el.y2||0};
      if(segmentsIntersect(a,b,c,d))return el
    }
    return null
  }
  function blockerLabel(el){return el?.type==="wall"?"Parede":el?.type==="door"?"Porta":el?.type==="window"?"Janela":"Barreira"}
  function blockedTarget(caster,target){const barrier=lineBlocker(caster,target);return barrier?{blocked:true,barrier}:{blocked:false,barrier:null}}
  function showBlocked(barrier,target){
    const text=`🧱 ${blockerLabel(barrier)} bloqueia ${target?.name||"o alvo"}. Escolha outro alvo.`;
    const status=$("mapStatus");if(status)status.textContent=text;
    const hint=$("microPreviewHint");if(hint)hint.textContent=text;
  }

  let tries=0,executor=null,currentTargeting=null;
  while(!(executor=globalThis.MICROCOSMOS_COMBAT_EXECUTOR)&&tries++<120)await wait(100);
  if(!executor?.start||executor.start.__microSafety)return;
  const originalStart=executor.start.bind(executor),originalCancel=typeof executor.cancel==="function"?executor.cancel.bind(executor):null;

  const wrapped=async function(caster,type,index){
    const staleItem=(type==="spell"?caster?.spells:caster?.attacks)?.[index];
    const staleName=staleItem?.name||"";
    try{await globalThis.MICROCOSMOS_TABLE_COMBAT_DATA?.refresh?.()}catch(_e){}
    const fresh=players.find(p=>String(p.id)===String(caster?.id))||caster;
    normalizeCaster(fresh);
    let freshIndex=index;
    if(type==="spell"&&staleName){const byName=(fresh.spells||[]).findIndex(s=>s?.name===staleName);if(byName>=0)freshIndex=byName}
    currentTargeting={caster:fresh,type,index:freshIndex};
    const result=await originalStart(fresh,type,freshIndex);
    if(!document.body.classList.contains("micro-auto-target"))currentTargeting=null;
    return result
  };
  wrapped.__microSafety=true;
  executor.start=wrapped;
  if(originalCancel){
    executor.cancel=function(){currentTargeting=null;return originalCancel()};
    executor.cancel.__microSafety=true
  }

  function targetFromEvent(e){
    const el=e.target?.closest?.("#tokenLayer [data-token]");
    if(!el)return null;
    return players.find(p=>String(p.id)===String(el.dataset.token))||null
  }
  function protectPointer(e){
    if(!currentTargeting||!document.body.classList.contains("micro-auto-target")){if(!document.body.classList.contains("micro-auto-target"))currentTargeting=null;return}
    const target=targetFromEvent(e);if(!target)return;
    const verdict=blockedTarget(currentTargeting.caster,target);if(!verdict.blocked)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showBlocked(verdict.barrier,target)
  }

  // WINDOW capture acontece antes dos listeners do executor registrados no document.
  window.addEventListener("pointerdown",protectPointer,true);
  window.addEventListener("pointerup",protectPointer,true);
  window.addEventListener("keydown",e=>{if(e.key==="Escape")currentTargeting=null},true);

  globalThis.MICROCOSMOS_LINE_OF_EFFECT={lineBlocker,blockedTarget,getBlockers:blockers};
  globalThis.MICROCOSMOS_COMBAT_EXECUTOR=executor;
})();
