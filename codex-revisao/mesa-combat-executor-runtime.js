/* MICROCOSMOS — Executor automático de combate da Mesa v1.
   Problema 4/5: alvo via Pointer Events, valida alcance, rola ataque contra CA
   ou Salvaguarda contra CD, calcula dano/cura, aplica resistências conhecidas e
   executa efeitos espaciais simples como Chicote Espinhoso.
   Alterações de PV online continuam passando pela aprovação do Mestre via RPC. */
(async function(){
  if(globalThis.MICROCOSMOS_MESA_COMBAT_EXECUTOR)return;
  globalThis.MICROCOSMOS_MESA_COMBAT_EXECUTOR=true;
  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const SHEET_KEY="JE_INTEGRATED_123";
  const SESSION_KEY="microcosmos-main";
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS,api=globalThis.MICROCOSMOS_TABLE_API;
  if(!Array.isArray(players)||!api)return;
  const $=id=>document.getElementById(id),tokenLayer=$("tokenLayer"),rollLog=$("rollLog"),stage=$("stage");
  let supabase=null,session=null,profile=null,pending=null,armed=null;
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  function dice(expr,crit=false){const m=String(expr||"").replace(/\s/g,"").match(/(\d*)d(\d+)([+-]\d+)?/i);if(!m){const n=parseInt(expr,10);return Number.isFinite(n)?n:0}let count=+(m[1]||1),die=+m[2],total=+(m[3]||0);if(crit)count*=2;for(let i=0;i<count;i++)total+=1+Math.floor(Math.random()*die);return total}
  function log(html,color="#7d6c55"){if(!rollLog)return;const d=document.createElement("div");d.className="log-entry";d.style.borderLeftColor=color;d.innerHTML=html;rollLog.prepend(d)}
  function selected(){const el=tokenLayer?.querySelector(".token.selected");return el?players.find(p=>p.id===el.dataset.token):null}
  function gridMeters(){return 1.5}
  function distance(a,b){
    const s=+$("gridSize")?.value||70,dx=Math.abs((+a.x||0)-(+b.x||0)),dy=Math.abs((+a.y||0)-(+b.y||0)),type=$("gridType")?.value||"square";
    // No Grid quadrado, uma casa diagonal também conta como 1 quadrado (1,5 m),
    // seguindo a regra tática usada pela Mesa. Assim dois tokens em casas
    // diagonalmente adjacentes permanecem válidos para ataques corpo a corpo.
    if(type==="square")return Math.max(dx,dy)/s*gridMeters();
    return Math.hypot(dx,dy)/s*gridMeters()
  }
  function parseRange(item){
    if(item?.kind==="weapon"&&item.range?.normal)return +item.range.normal;
    const raw=String(item?.range||"").toLowerCase();if(/pessoal|self/.test(raw))return 0;if(/toque|touch/.test(raw))return 1.5;
    let m=raw.match(/(\d+(?:[,.]\d+)?)\s*m\b/);if(m)return +m[1].replace(",",".");m=raw.match(/(\d+(?:[,.]\d+)?)\s*(?:ft|pés|pes)/);if(m)return +m[1].replace(",",".")*.3;
    return item?.kind==="weapon"?1.5:18
  }
  function typeKey(type){const t=String(type||"").toLowerCase();return t.normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
  function includesType(list,type){const k=typeKey(type);return (list||[]).some(x=>typeKey(x).includes(k)||k.includes(typeKey(x)))}
  function adjustedDamage(target,amount,type){if(!type)return amount;if(includesType(target.immunities,type))return 0;if(includesType(target.vulnerabilities,type))return amount*2;if(includesType(target.resistances,type))return Math.floor(amount/2);return amount}
  function targetSizeRank(size){const s=typeKey(size);return({minúsculo:0,minusculo:0,pequeno:1,médio:2,medio:2,grande:3,enorme:4,colossal:5,gargantuan:5})[s]??2}
  function effectText(item){return `${item?.effect||""} ${item?.text||""} ${item?.limitation||""}`}
  function saveHalf(item){return /metade|half/i.test(effectText(item))}
  function saveBonus(target,ability){return +(target.saveBonuses?.[ability]??Math.floor(((+target.stats?.[ability]||10)-10)/2))||0}
  function colorFor(type){const k=typeKey(type);if(k.includes("veneno")||k.includes("acido"))return"#49733e";if(k.includes("fogo"))return"#a5532e";if(k.includes("frio"))return"#54809a";if(k.includes("relamp"))return"#677eaf";if(k.includes("necro"))return"#684f78";if(k.includes("radiante"))return"#b28b3d";return"#735f8d"}
  function vfx(caster,target,type){if(!stage)return;let layer=$("microAutoFx");if(!layer){layer=document.createElement("div");layer.id="microAutoFx";layer.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:55";stage.appendChild(layer)}const dx=target.x-caster.x,dy=target.y-caster.y,len=Math.max(5,Math.hypot(dx,dy)),ang=Math.atan2(dy,dx)*180/Math.PI,line=document.createElement("div");line.style.cssText=`position:absolute;left:${caster.x}px;top:${caster.y}px;width:${len}px;height:10px;border-radius:999px;background:linear-gradient(90deg,transparent,${colorFor(type)},#fff,${colorFor(type)});transform-origin:0 50%;transform:rotate(${ang}deg);filter:drop-shadow(0 0 8px ${colorFor(type)});animation:microAutoCombatFx .65s ease-out forwards`;layer.appendChild(line);setTimeout(()=>line.remove(),800)}
  if(!$("microAutoCombatFxStyle")){const s=document.createElement("style");s.id="microAutoCombatFxStyle";s.textContent="@keyframes microAutoCombatFx{0%{opacity:0;scale:.1 1}20%{opacity:1}100%{opacity:0;scale:1 1}}body.micro-auto-target #tokenLayer .token{cursor:crosshair!important;animation:microTargetPulse .7s ease-in-out infinite alternate}";document.head.appendChild(s)}

  async function connect(){try{const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");supabase=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});const {data:{session:s}}=await supabase.auth.getSession();session=s;if(session){const {data}=await supabase.from("profiles").select("id,role,approved").eq("id",session.user.id).maybeSingle();profile=data||null}}catch(e){console.warn("MICROCOSMOS executor online indisponível",e)}}
  function canControl(p){return !!p&&(!session||profile?.role==="master"||p.userId===session.user.id)}

  function slots(token){return token.magicSlots||[]}
  function findSlot(token,minLevel){const arr=slots(token);for(let l=minLevel;l<=9;l++){const row=arr[l]||arr[l-1];if(!row)continue;const max=+(row.max??row.total??0),used=+(row.used??0);if(max-used>0)return{level:l,row}}return null}
  async function consumeSlot(caster,item){if((+item.lvl||0)<=0)return{ok:true,level:0};const found=findSlot(caster,+item.lvl||1);if(!found)return{ok:false,reason:"Sem Slot Mágico disponível"};found.row.used=(+found.row.used||0)+1;
    // Atualiza a ficha local quando este token pertence ao navegador atual.
    try{const local=JSON.parse(localStorage.getItem(SHEET_KEY)||"null");if(local&&(!caster.userId||caster.userId===session?.user?.id)){local.magic=local.magic||{};local.magic.slots=local.magic.slots||[];const row=local.magic.slots[found.level]||local.magic.slots[found.level-1];if(row)row.used=(+row.used||0)+1;localStorage.setItem(SHEET_KEY,JSON.stringify(local))}}catch(e){}
    return{ok:true,level:found.level}
  }

  async function start(caster,type,index){
    if(!canControl(caster)){log(`🔒 Você não controla <b>${esc(caster.name)}</b>.`);return}
    if(caster.linked)await globalThis.MICROCOSMOS_TABLE_COMBAT_DATA?.refresh?.();
    const item=(type==="attack"?caster.attacks:caster.spells)?.[index];if(!item)return;
    if(!caster.combatDataReady&&caster.linked){log(`⏳ <b>${esc(caster.name)}</b>: aguardando dados completos da ficha. Atualize os tokens e tente novamente.`,caster.color);globalThis.MICROCOSMOS_TABLE_COMBAT_DATA?.refresh?.();return}
    pending={caster,item,type,index};document.body.classList.add("micro-auto-target");const st=$("mapStatus");if(st)st.textContent=`🎯 ${item.name}: selecione o alvo. Alcance: ${parseRange(item)} m.`
  }
  function cancel(){pending=null;armed=null;document.body.classList.remove("micro-auto-target");const st=$("mapStatus");if(st)st.textContent="Arraste o mapa para navegar • toque no token para selecionar"}

  async function hpEffect(caster,target,amount,effect,item,details){
    if(amount<=0){log(`${details}<br><small>Nenhuma alteração de PV.</small>`,caster.color);return}
    const characterTarget=!!(target?.linked&&target?.userId),tokenTarget=!characterTarget&&!!target?.id;
    if(supabase&&session&&(characterTarget||tokenTarget)){
      const payload={effect,amount,spell_name:item.name||"Ação",source_name:item.name||"Ação",caster_name:caster.name||"Personagem",target_name:target.name||"Alvo",damage_type:item.damageType||null,caster_character_id:caster.characterId||null,target_character_id:characterTarget?(target.characterId||null):null,target_scope:tokenTarget?"mesa_token":"character",target_token_id:tokenTarget?String(target.id):null,session_key:tokenTarget?SESSION_KEY:null,source:"campaign_table",automation:{details_text:String(details||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),range_checked:true}};
      const rpcTarget=characterTarget?target.userId:session.user.id;
      const {data,error}=await supabase.rpc("request_interaction",{target:rpcTarget,interaction_kind:"combat_effect",interaction_payload:payload});
      if(error){log(`${details}<br>⚠️ Não foi possível enviar a alteração de PV: ${esc(error.message)}`,caster.color);return}
      if(profile?.role==="master"){
        const {error:reviewError}=await supabase.rpc("review_interaction",{interaction_id:data,approve:true,note:"Aplicado automaticamente por ação do Mestre"});
        if(reviewError){log(`${details}<br>⚠️ A ação foi criada, mas não pôde ser aplicada automaticamente: ${esc(reviewError.message)}`,caster.color);return}
        log(`${details}<br>${effect==="healing"?"💚 Cura":"💥 Dano"} de <b>${amount} PV</b> aplicado diretamente pelo Mestre.`,caster.color);
        if(tokenTarget)await globalThis.MICROCOSMOS_MESA_SHARED?.reloadTokens?.();
        else {await globalThis.MICROCOSMOS_TABLE_COMBAT_DATA?.refresh?.();await globalThis.MICROCOSMOS_MESA_SHARED?.flushToken?.(target.id,true)}
        return data
      }
      log(`${details}<br>👑 Alteração de <b>${amount} PV</b> enviada para aprovação do Mestre. O PV só muda depois da aprovação.`,caster.color);return data
    }
    const before=+target.hp||0;target.hp=effect==="healing"?Math.min(+target.hpMax||before,before+amount):Math.max(0,before-amount);api.renderPlayers();api.renderTokens();api.selectToken(target.id);await globalThis.MICROCOSMOS_MESA_SHARED?.flushToken?.(target.id,true);log(`${details}<br>${effect==="healing"?"💚":"💥"} PV: <b>${before} → ${target.hp}</b>`,caster.color)
  }

  function pullToward(caster,target,meters){const rank=targetSizeRank(target.size);if(rank>3)return false;const s=+$("gridSize")?.value||70,maxPx=meters/gridMeters()*s,dx=caster.x-target.x,dy=caster.y-target.y,d=Math.hypot(dx,dy);if(d<1)return false;const move=Math.min(maxPx,d);target.x+=dx/d*move;target.y+=dy/d*move;api.renderTokens();return true}

  async function resolve(target){
    const p=pending;if(!p)return;cancel();const {caster,type,index}=p,item=(type==="attack"?caster.attacks:caster.spells)?.[index]||p.item,dist=distance(caster,target),max=parseRange(item),selfOnly=max===0;
    if(selfOnly&&target.id!==caster.id){log(`❌ <b>${esc(item.name)}</b> tem alcance Pessoal. O alvo escolhido é inválido.`,caster.color);return}
    if(!selfOnly&&dist>max+.05){
      const spend=type==="spell"?await consumeSlot(caster,item):{ok:true};log(`❌ <b>${esc(item.name)}</b>: alvo a ${dist.toFixed(1)} m, fora do alcance de ${max} m.${type==="spell"&&+item.lvl>0?(spend.ok?` O Slot de ${spend.level}º Círculo foi gasto pela tentativa.`:` ${spend.reason}.`):" A ação foi gasta."}`,caster.color);return
    }
    let slot={ok:true,level:0};if(type==="spell"){slot=await consumeSlot(caster,item);if(!slot.ok){log(`❌ <b>${esc(item.name)}</b>: ${slot.reason}.`,caster.color);return}}
    vfx(caster,target,item.damageType||item.name);
    let success=true,crit=false,rollInfo="";
    if(item.attack||type==="attack"){
      const d20=1+Math.floor(Math.random()*20),total=d20+(+item.bonus||0);crit=d20===20;success=crit||d20!==1&&total>=(+target.ac||10);rollInfo=`🎲 Ataque: <b>${d20} ${(+item.bonus||0)>=0?"+":""}${+item.bonus||0} = ${total}</b> contra CA <b>${+target.ac||10}</b> → <b>${success?crit?"CRÍTICO":"ACERTO":"ERRO"}</b>`
    }else if(item.save){
      const ability=String(item.save).toUpperCase().slice(0,3),d20=1+Math.floor(Math.random()*20),bonus=saveBonus(target,ability),total=d20+bonus,dc=+item.spellDc||+caster.spellDc||10;success=total<dc;rollInfo=`🛡️ Salvaguarda de ${ability}: <b>${d20} ${bonus>=0?"+":""}${bonus} = ${total}</b> contra CD <b>${dc}</b> → <b>${success?"FALHA":"SUCESSO"}</b>`
    }else rollInfo="✨ Efeito automático no alvo válido.";
    let amount=0,effect="damage";
    if(item.healing){amount=dice(item.healing,crit);effect="healing"}
    else if(item.damage){amount=dice(item.damage,crit);if(item.save&&!success)amount=saveHalf(item)?Math.floor(amount/2):0;else if((item.attack||type==="attack")&&!success)amount=0;amount=adjustedDamage(target,amount,item.damageType)}
    const details=`<b style="color:${caster.color}">${esc(caster.name)}</b> usa <b>${esc(item.name)}</b> em <b>${esc(target.name)}</b><br>📏 ${dist.toFixed(1)} m / ${max} m${slot.level?` • 🔷 Slot ${slot.level}º gasto`:""}<br>${rollInfo}${item.damageType&&amount?`<br>💥 ${amount} ${esc(item.damageType)}`:""}`;
    await hpEffect(caster,target,amount,effect,item,details);
    if(success&&/thorn whip|chicote espinhoso/i.test(`${item.reference||""} ${item.name||""}`)){
      const moved=pullToward(caster,target,3);log(moved?`🌿 <b>${esc(target.name)}</b> foi puxado até 3 m em direção a ${esc(caster.name)}.`:`🌿 O puxão não moveu ${esc(target.name)} (tamanho/posição incompatível).`,caster.color)
    }
  }

  // Intercepta antes do quickRoll antigo e do runtime visual antigo.
  document.addEventListener("click",e=>{const btn=e.target?.closest?.("#tokenCard [data-roll]");if(!btn)return;const caster=selected();if(!caster)return;const m=String(btn.dataset.roll||"").match(/^(attack|spell):(\d+)$/);if(!m)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();start(caster,m[1],+m[2])},true);
  document.addEventListener("pointerdown",e=>{if(!pending)return;const token=e.target?.closest?.("#tokenLayer [data-token]");if(!token)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();armed={id:token.dataset.token,pointer:e.pointerId}},true);
  document.addEventListener("pointermove",e=>{if(!pending||!armed||armed.pointer!==e.pointerId)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()},true);
  document.addEventListener("pointerup",e=>{if(!pending||!armed||armed.pointer!==e.pointerId)return;const token=e.target?.closest?.("#tokenLayer [data-token]");e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const id=token?.dataset?.token||armed.id;armed=null;const target=players.find(x=>x.id===id);if(target)resolve(target)},true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&pending)cancel()});
  await connect();
  globalThis.MICROCOSMOS_COMBAT_EXECUTOR={start,cancel,resolve,distance,parseRange};
})();
