/* MICROCOSMOS — Reações Beta v2.
   Estrutura oficial da Mesa:
   ⚔️ Ataque de Oportunidade — ataques corpo a corpo válidos.
   ✨ Magia de Oportunidade — somente Truques conhecidos, de 1 Ação, do tipo Ataque e alvo único.
   🌟 Reação Especial — somente conteúdo explicitamente marcado como Reação e com Gatilho compatível.

   A Reação pertence ao personagem, pode acontecer fora do próprio turno e volta
   no início do próximo turno daquele personagem. Magia de Oportunidade nunca
   gasta Slot Mágico porque aceita somente Truques (Círculo 0).
*/
(async function(){
  if(globalThis.MICROCOSMOS_REACTION_RUNTIME)return;
  globalThis.MICROCOSMOS_REACTION_RUNTIME=true;

  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  const api=globalThis.MICROCOSMOS_TABLE_API;
  if(!Array.isArray(players)||!api)return;

  const $=id=>document.getElementById(id);
  const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  let userId="",isMaster=false,activeWindow=null,wrappedRecord=null,lastTurnKey="",patchedTactical=false;
  const reactionSpent=new Set(),lastPositions=new Map(),recentMoves=new Map();

  function combat(){return globalThis.MICROCOSMOS_INITIATIVE?.combat||{started:false,active_token_id:null,round:0}}
  function gridSize(){return Math.max(20,+$("gridSize")?.value||70)}
  function gridType(){return $("gridType")?.value||"square"}
  function fmt(v){const n=Math.round((+v||0)*10)/10;return Number.isInteger(n)?String(n):n.toFixed(1).replace(".",",")}
  function distance(a,b){const s=gridSize(),dx=Math.abs((+a?.x||0)-(+b?.x||0)),dy=Math.abs((+a?.y||0)-(+b?.y||0));return (gridType()==="square"?Math.max(dx,dy):Math.hypot(dx,dy))/s*1.5}
  function side(p){if(!p)return"neutral";if(p.creature||(!p.linked&&(p.free||p.master||p.ipm)))return"creature";if(p.linked)return"player";return"neutral"}
  function hostile(a,b){const sa=side(a),sb=side(b);return sa!=="neutral"&&sb!=="neutral"&&sa!==sb}
  function friendly(a,b){const sa=side(a),sb=side(b);return sa!=="neutral"&&sa===sb}
  function canControl(p){return !!p&&(isMaster||!!userId&&String(p.userId||p.ownerUserId||"")===String(userId))}
  function alive(p){return (+p?.hpMax||0)<=0||(+p?.hp||0)>0}
  function reactionAvailable(p){return !!p&&!reactionSpent.has(String(p.id))}
  function lineOfEffect(a,b){try{return globalThis.MICROCOSMOS_TACTICAL_PREVIEW_API?.hasLineOfEffect?.(a,b)!==false}catch{return true}}
  function parseRange(item){
    if(item?.range?.normal!=null)return +item.range.normal||0;
    const raw=norm(item?.reactionRange||item?.range||"");if(/pessoal|self/.test(raw))return 0;if(/toque|touch/.test(raw))return 1.5;
    let m=raw.match(/(\d+(?:[,.]\d+)?)\s*m\b/);if(m)return +m[1].replace(",",".");m=raw.match(/(\d+(?:[,.]\d+)?)\s*(?:ft|pes)\b/);if(m)return +m[1].replace(",",".")*.3;
    return 0
  }
  function attackRange(item){const n=parseRange(item);return n>0?n:1.5}
  function meleeAttackIndices(p){
    const out=[];for(let i=0;i<(p?.attacks||[]).length;i++){const a=p.attacks[i],r=attackRange(a),raw=norm(`${a?.properties||""} ${a?.effect||""}`);if(r<=3&&!/municao/.test(raw)&&!/arremesso/.test(raw))out.push(i)}return out
  }
  function reachOf(p){const ranges=meleeAttackIndices(p).map(i=>attackRange(p.attacks[i]));return Math.max(1.5,...ranges)}
  function spellTiming(s){return norm(`${s?.cast||""} ${s?.castingTime||""} ${s?.activation||""} ${s?.time||""} ${s?.actionType||""}`)}
  function isOneAction(s){const raw=spellTiming(s);return /(^|\s|\b)1\s*acao\b|\buma\s+acao\b|^acao$/.test(raw)&&!/bonus|reacao|reaction/.test(raw)}
  function singleTargetSpell(s){
    const raw=norm(`${s?.target||""} ${s?.area||""} ${s?.shape||""}`);
    if(!raw)return true;
    if(/cone|linha|cubo|quadrado|raio|circulo|esfera|zona|area/.test(raw))return false;
    if(/\b2\s+criaturas|duas\s+criaturas|cada\s+criatura|todas\s+as\s+criaturas|ate\s+\d+\s+criaturas/.test(raw))return false;
    return true
  }
  function magicOpportunityIndices(p,target,point){
    const out=[];for(let i=0;i<(p?.spells||[]).length;i++){
      const s=p.spells[i];if((+s?.lvl||0)!==0||!s?.attack||!isOneAction(s)||!singleTargetSpell(s))continue;
      const range=parseRange(s);if(range<=0||distance(p,point)>range+.05||!lineOfEffect(p,point))continue;out.push(i)
    }return out
  }

  function triggerKinds(option){
    const raw=norm(`${option?.trigger||""} ${option?.raw?.reactionTrigger||""} ${option?.raw?.trigger||""} ${option?.raw?.gatilho||""}`),out=new Set();
    if(/sai|sair|abandona|abandonar|deixa|deixar/.test(raw)&&/alcance|corpo a corpo/.test(raw))out.add("opportunity");
    const ally=/aliad|amig|companheir/.test(raw);
    if(/alvo de (?:um )?ataque|for alvo|e alvo/.test(raw))out.add(ally?"ally_targeted":"targeted");
    if(/atingid|acertad|sofre um acerto/.test(raw))out.add(ally?"ally_hit":"hit");
    if(/sofrer dano|receber dano|recebe dano|dano seria aplicado|antes do dano/.test(raw))out.add(ally?"ally_before_damage":"before_damage");
    if(/entra|entrar/.test(raw)&&/alcance/.test(raw))out.add("enter_reach");
    return [...out]
  }
  function specialRelationOk(reactor,event,kind){
    const target=event?.target||event?.mover;if(!target)return true;
    if(kind.startsWith("ally_"))return String(reactor.id)!==String(target.id)&&friendly(reactor,target);
    if(kind==="opportunity")return hostile(reactor,target);
    return String(reactor.id)===String(target.id)
  }
  function specialInRange(reactor,event,opt,kind){
    if(!kind.startsWith("ally_"))return true;
    const target=event?.target;if(!target)return false;const r=parseRange({reactionRange:opt?.range});const max=r>0?r:1.5;return distance(reactor,target)<=max+.05&&lineOfEffect(reactor,target)
  }
  function specialOptionsFor(reactor,event){
    if(!reactor||!reactionAvailable(reactor))return[];const eventKind=event?.kind||"";
    return(reactor.reactionOptions||[]).filter(opt=>{
      const kinds=triggerKinds(opt);if(!kinds.length)return false;
      const matched=kinds.find(k=>k===eventKind||k.startsWith("ally_")&&k.slice(5)===eventKind);if(!matched)return false;
      return specialRelationOk(reactor,event,matched)&&specialInRange(reactor,event,opt,matched)
    })
  }

  function ensureCss(){
    if($("microReactionStyle"))return;const s=document.createElement("style");s.id="microReactionStyle";s.textContent=`
      #microReactionWindow{display:none;align-items:stretch;gap:8px;flex-wrap:wrap;margin:0 0 7px;padding:10px;border:2px solid #b75d43;border-radius:12px;background:linear-gradient(135deg,#321513,#4c2b20);color:#fff1d1;box-shadow:0 5px 16px #0008;font-size:.76rem}
      #microReactionWindow.active{display:flex}.micro-reaction-copy{display:grid;gap:3px;min-width:0;width:100%}.micro-reaction-title{font-weight:bold;color:#ffd274;font-size:.86rem}.micro-reaction-detail{color:#ffe9ca}.micro-reaction-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;width:100%}.micro-reaction-group{border:1px solid #9f715f;border-radius:9px;padding:7px;background:#ffffff0c}.micro-reaction-group h4{margin:0 0 5px;color:#ffd98b;font-size:.75rem}.micro-reaction-list{display:grid;gap:5px}.micro-reaction-choice{width:100%;text-align:left;padding:6px 8px;border:1px solid #d49b74;border-radius:8px;background:#fff4dc;color:#3c261e;font-weight:bold}.micro-reaction-choice small{display:block;font-weight:normal;color:#745448;margin-top:2px}.micro-reaction-footer{width:100%;display:flex;justify-content:flex-end}.micro-reaction-pass{padding:6px 10px}.micro-reaction-empty{opacity:.65;font-style:italic}.micro-reaction-badge{display:inline-flex;padding:2px 6px;border-radius:999px;background:#ffffff18;border:1px solid #ffffff35;margin-left:4px}.micro-reaction-busy{opacity:.55;pointer-events:none}
      #microTacticalReaction.spent{opacity:.58;text-decoration:line-through}
      @media(max-width:720px){#microReactionWindow{font-size:.7rem}.micro-reaction-groups{grid-template-columns:1fr}.micro-reaction-footer .btn{width:100%}}
    `;document.head.appendChild(s)
  }
  function ensureUi(){
    ensureCss();let hud=$("microTacticalHud"),pill=$("microTacticalReaction");if(hud&&!pill){pill=document.createElement("span");pill.className="micro-tactical-pill";pill.id="microTacticalReaction";hud.querySelector(".micro-tactical-main")?.appendChild(pill)}
    let box=$("microReactionWindow");if(!box){
      box=document.createElement("div");box.id="microReactionWindow";box.innerHTML='<div class="micro-reaction-copy"><span class="micro-reaction-title" id="microReactionTitle">🚨 JANELA DE REAÇÃO</span><span class="micro-reaction-detail" id="microReactionDetail"></span></div><div class="micro-reaction-groups" id="microReactionGroups"></div><div class="micro-reaction-footer"><button type="button" class="btn micro-reaction-pass" id="microReactionPass">✕ Não reagir</button></div>';
      const shell=document.querySelector(".map-shell"),viewport=$("viewport");if(shell&&viewport)shell.insertBefore(box,viewport);else document.body.appendChild(box);
      $("microReactionPass").onclick=passReaction;$("microReactionGroups").addEventListener("click",onChoice)
    }return box
  }
  function groupHtml(title,icon,items){return `<section class="micro-reaction-group"><h4>${icon} ${title}</h4><div class="micro-reaction-list">${items.length?items.join(""):'<span class="micro-reaction-empty">Nenhuma opção válida</span>'}</div></section>`}
  function choiceHtml(kind,index,name,detail=""){return `<button type="button" class="micro-reaction-choice" data-reaction-kind="${kind}" data-reaction-index="${index}">${name}${detail?`<small>${detail}</small>`:""}</button>`}
  function renderWindow(){
    const w=activeWindow,box=ensureUi();if(!w){box.classList.remove("active");return}
    $("microReactionTitle").textContent=`🚨 REAÇÃO — ${w.reactor?.name||"Personagem"}`;$("microReactionDetail").textContent=w.detail||"Uma Reação está disponível.";
    const groups=[];
    if(w.mode==="opportunity"){
      const attacks=(w.attackIndices||[]).map(i=>choiceHtml("attack",i,w.reactor.attacks?.[i]?.name||"Ataque de Oportunidade",`Corpo a corpo • alcance ${fmt(attackRange(w.reactor.attacks?.[i]))} m`));
      const magic=(w.magicIndices||[]).map(i=>choiceHtml("magic",i,w.reactor.spells?.[i]?.name||"Truque",`Truque • 1 Ação • Ataque • sem Slot Mágico`));
      const special=(w.specials||[]).map((opt,i)=>choiceHtml("special",i,opt.name||"Reação Especial",opt.trigger||opt.text||"Gatilho compatível"));
      groups.push(groupHtml("Ataque de Oportunidade","⚔️",attacks));if(magic.length)groups.push(groupHtml("Magia de Oportunidade","✨",magic));if(special.length)groups.push(groupHtml("Reação Especial","🌟",special))
    }else{
      const special=(w.specials||[]).map((opt,i)=>choiceHtml("special",i,opt.name||"Reação Especial",opt.trigger||opt.text||"Gatilho compatível"));groups.push(groupHtml("Reação Especial","🌟",special))
    }
    $("microReactionGroups").innerHTML=groups.join("");box.classList.add("active")
  }
  function updateHud(){
    ensureUi();const c=combat(),p=players.find(x=>String(x.id)===String(c.active_token_id)),pill=$("microTacticalReaction");if(!pill)return;if(!c.started||!p){pill.hidden=true;return}pill.hidden=false;const spent=!reactionAvailable(p);pill.textContent=spent?"↩️ Reação usada":"↩️ Reação disponível";pill.classList.toggle("spent",spent)
  }
  function notify(text){if(globalThis.MICROCOSMOS_TOKEN_ACTIONS?.showToast)try{globalThis.MICROCOSMOS_TOKEN_ACTIONS.showToast(text)}catch(_e){}const st=$("mapStatus");if(!st)return;const old=st.textContent;st.textContent=text;clearTimeout(notify._t);notify._t=setTimeout(()=>{if(st.textContent===text)st.textContent=old},2400)}
  function addLog(text,reactor){const log=$("rollLog");if(!log)return;const e=document.createElement("div");e.className="log-entry";e.style.borderLeftColor=reactor?.color||"#8b5f48";e.textContent=text;log.prepend(e)}

  function patchTactical(){
    const t=globalThis.MICROCOSMOS_TACTICAL_TURN;if(!t||patchedTactical)return false;const oldCan=typeof t.canUseAction==="function"?t.canUseAction.bind(t):null,oldCommit=typeof t.commitAction==="function"?t.commitAction.bind(t):null;if(!oldCan||!oldCommit)return false;
    t.canUseAction=function(caster,meta={}){const ctx=globalThis.MICROCOSMOS_REACTION_CONTEXT;if(ctx&&String(ctx.reactorId)===String(caster?.id)){if(reactionSpent.has(String(caster.id)))return{ok:false,bucket:"reaction",reason:"🚫 Reação já foi usada desde o início do seu último turno."};return{ok:true,bucket:"reaction"}}return oldCan(caster,meta)};
    t.commitAction=function(caster,meta={}){const ctx=globalThis.MICROCOSMOS_REACTION_CONTEXT;if(ctx&&String(ctx.reactorId)===String(caster?.id)){if(reactionSpent.has(String(caster.id))){notify("🚫 Reação já utilizada.");return false}reactionSpent.add(String(caster.id));updateHud();notify(`↩️ Reação de ${caster.name||"personagem"} utilizada.`);return true}return oldCommit(caster,meta)};
    t.reactionAvailable=reactionAvailable;t.resetReaction=p=>{if(p)reactionSpent.delete(String(p.id));updateHud()};patchedTactical=true;return true
  }
  function consumeManualReaction(reactor){if(!reactionAvailable(reactor))return false;reactionSpent.add(String(reactor.id));updateHud();notify(`↩️ Reação de ${reactor.name||"personagem"} utilizada.`);return true}
  function resetAtTurnStart(){const c=combat(),key=c.started&&c.active_token_id?`${c.round||0}:${c.active_token_id}`:"";if(key===lastTurnKey)return;lastTurnKey=key;if(c.started&&c.active_token_id)reactionSpent.delete(String(c.active_token_id));if(!c.started){reactionSpent.clear();finishWindow(null,true)}updateHud()}

  function opportunityCandidates(mover,from,to){
    const c=combat();if(!c.started||String(c.active_token_id)!==String(mover?.id))return[];const out=[];
    for(const reactor of players){
      if(String(reactor.id)===String(mover.id)||!alive(reactor)||!hostile(reactor,mover)||!reactionAvailable(reactor)||!canControl(reactor))continue;
      const reach=reachOf(reactor),before=distance(reactor,from),after=distance(reactor,to);if(before>reach+.05||after<=reach+.05||!lineOfEffect(reactor,from))continue;
      const attackIndices=meleeAttackIndices(reactor),magicIndices=magicOpportunityIndices(reactor,mover,from),event={kind:"opportunity",mover,target:mover,caster:mover,from,to},specials=specialOptionsFor(reactor,event);
      if(attackIndices.length||magicIndices.length||specials.length)out.push({reactor,mover,from:{x:+from.x||0,y:+from.y||0},to:{x:+to.x||0,y:+to.y||0},reach,before,after,attackIndices,magicIndices,specials})
    }return out.sort((a,b)=>a.before-b.before)
  }
  function moveKey(mover,from,to){return `${mover.id}:${(+from.x||0).toFixed(1)},${(+from.y||0).toFixed(1)}>${(+to.x||0).toFixed(1)},${(+to.y||0).toFixed(1)}`}
  function afterMove(mover,from,to){
    if(!mover||distance(from,to)<.05)return;const mk=moveKey(mover,from,to),now=Date.now();if(now-(recentMoves.get(mk)||0)<800)return;recentMoves.set(mk,now);lastPositions.set(String(mover.id),{x:+to.x||0,y:+to.y||0});if(activeWindow)return;
    const candidate=opportunityCandidates(mover,from,to)[0];if(candidate)openOpportunity(candidate)
  }
  function openOpportunity(candidate){activeWindow={...candidate,id:`reaction-${Date.now().toString(36)}`,mode:"opportunity",detail:`${candidate.mover.name||"Alvo"} saiu do alcance corpo a corpo (${fmt(candidate.reach)} m). Escolha como gastar sua Reação.`};renderWindow();notify(`🚨 ${candidate.reactor.name} possui uma Reação contra ${candidate.mover.name}.`)}

  function finishWindow(result,silent=false){const w=activeWindow;if(!w)return;activeWindow=null;globalThis.MICROCOSMOS_REACTION_CONTEXT=null;$("microReactionWindow")?.classList.remove("active");$("microReactionWindow")?.classList.remove("micro-reaction-busy");if(w.resolveEvent)w.resolveEvent(result??w.event);if(!silent)updateHud()}
  function passReaction(){if(!activeWindow)return;const w=activeWindow;notify(`↩️ ${w.reactor?.name||"Personagem"} decidiu não usar a Reação.`);finishWindow(w.event)}
  function setBusy(on){$("microReactionWindow")?.classList.toggle("micro-reaction-busy",!!on)}

  async function executeCombatReaction(reactor,type,index,target,position,kind){
    const ex=globalThis.MICROCOSMOS_COMBAT_EXECUTOR;if(!ex?.start||!ex?.resolve)throw new Error("Executor de combate ainda não está pronto");const current=position&&target?{x:+target.x||0,y:+target.y||0}:null;
    globalThis.MICROCOSMOS_REACTION_CONTEXT={id:activeWindow?.id||`reaction-${Date.now()}`,kind,reactorId:String(reactor.id),moverId:String(target?.id||""),from:position||null};
    try{if(current&&position){target.x=position.x;target.y=position.y}const started=await ex.start(reactor,type,index);if(started===false)throw new Error("Reação bloqueada pelo controle de turno");await ex.resolve(target);if(!reactionSpent.has(String(reactor.id)))throw new Error("A Reação não foi registrada pelo turno tático")}finally{if(current&&target){target.x=current.x;target.y=current.y;try{api.renderTokens?.();globalThis.MICROCOSMOS_TOKEN_SIZE?.refresh?.()}catch(_e){}}globalThis.MICROCOSMOS_REACTION_CONTEXT=null}
  }
  function rollValue(v){if(typeof v==="number")return v;const raw=String(v??"").trim();const m=raw.match(/(\d*)d(\d+)([+-]\d+)?/i);if(m){let total=+(m[3]||0),count=+(m[1]||1),die=+m[2];for(let i=0;i<count;i++)total+=1+Math.floor(Math.random()*die);return total}const n=Number(raw.replace(",","."));return Number.isFinite(n)?n:0}
  function inferEffectType(opt){const explicit=norm(opt?.effectType||opt?.raw?.reactionEffect||opt?.raw?.effectType||"");if(explicit)return explicit;const text=norm(`${opt?.text||""} ${opt?.raw?.effect||""}`);if(/troca.*lugar|trocar.*lugar/.test(text))return"swap_position";if(/recebe todo|receber todo|assume todo/.test(text)&&/dano/.test(text))return"take_damage";if(/metade|parte do dano|divid/.test(text)&&/dano/.test(text))return"share_damage";if(/bloque|anula|impede/.test(text)&&/dano/.test(text))return"block_damage";if(/reduz|reduzir/.test(text)&&/dano/.test(text))return"reduce_damage";if(/interpo|novo alvo|torna.*alvo/.test(text))return"redirect_target";if(/bonus.*ca|\+\s*\d+.*ca/.test(text))return"ac_bonus";return"manual"}
  async function applySpecialEffect(w,opt){
    const event=w.event||{kind:"opportunity",target:w.mover,caster:w.mover},reactor=w.reactor,type=inferEffectType(opt),value=rollValue(opt.value??opt.raw?.reactionValue??opt.raw?.value??0);
    if(type==="block_damage"){event.amount=0}
    else if(type==="reduce_damage"){event.amount=Math.max(0,(+event.amount||0)-Math.max(0,value));event.reduction=(+event.reduction||0)+Math.max(0,value)}
    else if(type==="share_damage"){const total=Math.max(0,+event.amount||0),share=value>0&&value<1?Math.floor(total*value):Math.floor(total/2);event.amount=Math.max(0,total-share);event.secondaryEffects=[...(event.secondaryEffects||[]),{target:reactor,amount:share,effect:"damage",reason:opt.name}]}
    else if(type==="take_damage"){const total=Math.max(0,+event.amount||0);event.amount=0;event.secondaryEffects=[...(event.secondaryEffects||[]),{target:reactor,amount:total,effect:"damage",reason:opt.name}]}
    else if(type==="redirect_target"){event.target=reactor}
    else if(type==="swap_position"){
      const target=event.target;if(target&&String(target.id)!==String(reactor.id)){const a={x:+reactor.x||0,y:+reactor.y||0},b={x:+target.x||0,y:+target.y||0};reactor.x=b.x;reactor.y=b.y;target.x=a.x;target.y=a.y;if(opt.redirectTarget!==false)event.target=reactor;try{api.renderTokens?.();await globalThis.MICROCOSMOS_MESA_SHARED?.flushToken?.(reactor.id,false);await globalThis.MICROCOSMOS_MESA_SHARED?.flushToken?.(target.id,false)}catch(_e){}}
    }
    else if(type==="ac_bonus"){event.acBonus=(+event.acBonus||0)+(value||+String(opt.text||"").match(/\+\s*(\d+)/)?.[1]||0)}
    else event.manualReaction={reactorId:reactor.id,name:opt.name,text:opt.text||""};
    return event
  }
  function specialTarget(w,opt){const raw=norm(opt?.target||opt?.raw?.reactionTarget||"");if(/agressor|atacante|caster|conjurador inimigo/.test(raw))return w.event?.caster||w.mover;if(/aliad|alvo protegido/.test(raw))return w.event?.target||w.mover;if(/pessoal|self|voce|você/.test(raw))return w.reactor;return w.event?.target||w.mover||w.reactor}
  async function useSpecial(w,opt){
    if(!opt)return false;
    if(opt.source==="spell"){
      const target=specialTarget(w,opt),idx=+opt.index||0;await executeCombatReaction(w.reactor,"spell",idx,target,w.mode==="opportunity"?w.from:null,"special_reaction");
    }else if(!consumeManualReaction(w.reactor))throw new Error("Reação indisponível");
    const event=await applySpecialEffect(w,opt);addLog(`🌟 ${w.reactor.name} usa ${opt.name} como Reação Especial.`,w.reactor);return event
  }
  async function onChoice(e){
    const b=e.target.closest?.("[data-reaction-kind]");if(!b||!activeWindow)return;const w=activeWindow,kind=b.dataset.reactionKind,index=+b.dataset.reactionIndex||0;if(!reactionAvailable(w.reactor))return;setBusy(true);
    try{
      if(kind==="attack"){await executeCombatReaction(w.reactor,"attack",index,w.mover,w.from,"opportunity_attack");addLog(`⚔️ ${w.reactor.name} usa Ataque de Oportunidade contra ${w.mover.name}.`,w.reactor);finishWindow(w.event);return}
      if(kind==="magic"){const spell=w.reactor.spells?.[index];if(!spell||(+spell.lvl||0)!==0)throw new Error("Magia de Oportunidade inválida");await executeCombatReaction(w.reactor,"spell",index,w.mover,w.from,"opportunity_cantrip");addLog(`✨ ${w.reactor.name} usa ${spell.name} como Magia de Oportunidade (Truque, sem Slot Mágico).`,w.reactor);finishWindow(w.event);return}
      if(kind==="special"){const result=await useSpecial(w,w.specials?.[index]);finishWindow(result);return}
    }catch(err){console.warn("MICROCOSMOS reação:",err);notify(`⚠️ Não foi possível concluir a Reação: ${err?.message||err}`);setBusy(false)}
  }

  async function emit(event={}){
    if(!event||!event.kind||globalThis.MICROCOSMOS_REACTION_CONTEXT||activeWindow)return event;const c=combat();if(!c.started)return event;
    const groups=[];for(const reactor of players){if(!alive(reactor)||!reactionAvailable(reactor)||!canControl(reactor))continue;const specials=specialOptionsFor(reactor,event);if(specials.length)groups.push({reactor,specials})}
    if(!groups.length)return event;const g=groups[0];return new Promise(resolve=>{activeWindow={id:`reaction-${Date.now().toString(36)}`,mode:"special",reactor:g.reactor,specials:g.specials,event,resolveEvent:resolve,detail:event.detail||`Um gatilho de Reação Especial foi detectado para ${g.reactor.name}.`};renderWindow();notify(`🌟 ${g.reactor.name} possui uma Reação Especial disponível.`)})
  }

  function wrapRecordMove(){const t=globalThis.MICROCOSMOS_TACTICAL_TURN;if(!t||typeof t.recordMove!=="function"||t.recordMove===wrappedRecord)return;const original=t.recordMove.bind(t);const wrapped=function(p,from,to){const result=original(p,from,to);afterMove(p,from,to);return result};wrapped.__microReaction=true;t.recordMove=wrapped;wrappedRecord=wrapped}
  function scanPositions(){const c=combat();for(const p of players){const id=String(p.id),now={x:+p.x||0,y:+p.y||0},prev=lastPositions.get(id);if(prev&&c.started&&String(c.active_token_id)===id&&distance(prev,now)>.05)afterMove(p,prev,now);lastPositions.set(id,now)}}
  function selfTest(){
    const mock={spells:[{name:"Truque válido",lvl:0,attack:true,cast:"1 Ação",range:"18 m",area:"1 criatura"},{name:"Magia 1º",lvl:1,attack:true,cast:"1 Ação",range:"18 m",area:"1 criatura"},{name:"Truque bônus",lvl:0,attack:true,cast:"1 Ação Bônus",range:"18 m",area:"1 criatura"},{name:"Truque área",lvl:0,attack:true,cast:"1 Ação",range:"18 m",area:"Cone de 4,5 m"}],x:0,y:0};const idx=magicOpportunityIndices(mock,{x:70,y:0},{x:70,y:0});return{ok:idx.length===1&&idx[0]===0,magicOpportunityIndices:idx}
  }

  try{const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");const sb=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});const {data:{session}}=await sb.auth.getSession();userId=session?.user?.id||"";if(userId){const {data}=await sb.from("profiles").select("role,approved").eq("id",userId).maybeSingle();isMaster=data?.role==="master"&&data?.approved!==false}}catch(e){console.warn("MICROCOSMOS Reações: autenticação indisponível",e)}

  ensureUi();patchTactical();wrapRecordMove();resetAtTurnStart();scanPositions();setInterval(()=>{patchTactical();wrapRecordMove();resetAtTurnStart();scanPositions();updateHud()},220);
  globalThis.MICROCOSMOS_REACTION_API={version:2,reactionAvailable,afterMove,openOpportunity,passReaction,emit,selfTest,magicOpportunityIndices,specialOptionsFor,get active(){return activeWindow},get spent(){return reactionSpent}};
})();
