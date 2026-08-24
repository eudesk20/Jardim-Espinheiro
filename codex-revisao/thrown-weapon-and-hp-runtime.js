/* MICROCOSMOS — Armas de Arremesso + PV automático.
   - Armas com propriedade Arremesso passam a usar quantidade própria, não munição separada.
   - Duplicatas iguais viram uma única linha com quantidade.
   - Ao arremessar, 1 unidade sai da posse e vai para "arremessados no campo".
   - Pode recuperar depois se não quebrou.
   - Corpo a corpo não consome quantidade.
   - PV automático: Nv.1 = máximo do Dado de Vida + CON; níveis adicionais = PV fixo da Classe + CON.
*/
(function(){
 if(globalThis.MICROCOSMOS_THROWN_HP_RUNTIME)return;globalThis.MICROCOSMOS_THROWN_HP_RUNTIME=true;
 const $=id=>document.getElementById(id);
 function catalog(e){try{return e?.catalogId&&EQUIPMENT_CATALOG[e.catalogId]||equipmentCatalogItem(e)}catch{return e||{}}}
 function isThrown(e){return !!catalog(e)?.thrown}
 function thrownKey(e){return `${e?.catalogId||e?.name||""}|${+e?.magic||0}|${e?.name||""}`}
 function consolidateThrown(){
   state.equipment=Array.isArray(state.equipment)?state.equipment:[];
   const seen=new Map(),out=[];let changed=false;
   for(const e of state.equipment){
     if(!isThrown(e)){out.push(e);continue}
     const key=thrownKey(e),existing=seen.get(key),qty=Math.max(1,+e.qty||1),field=Math.max(0,+e.thrownOut||0);
     if(existing){existing.qty=(+existing.qty||1)+qty;existing.thrownOut=(+existing.thrownOut||0)+field;changed=true;continue}
     e.qty=qty;e.thrownOut=field;seen.set(key,e);out.push(e)
   }
   if(changed){state.equipment=out;try{save()}catch(e){}}
   return changed
 }

 const oldAmmoPanel=globalThis.weaponAmmoPanel;
 globalThis.weaponAmmoPanel=function(e,i){
   if(!isThrown(e))return typeof oldAmmoPanel==="function"?oldAmmoPanel(e,i):"";
   const qty=Math.max(0,+e.qty||0),out=Math.max(0,+e.thrownOut||0),mode=e.useThrown?"throw":"melee";
   return `<div class="ammo-note"><select onchange="setWeaponThrowMode(${i},this.value)"><option value="melee" ${mode==="melee"?"selected":""}>Uso corpo a corpo</option><option value="throw" ${mode==="throw"?"selected":""}>Arremessar</option></select><span>🗡️ Quantidade em posse:</span><b>${qty}</b><span>📍 Arremessados no campo:</span><b>${out}</b>${out?`<button class="btn slim" onclick="recoverThrownWeapon(${i},1)">Recuperar 1</button><button class="btn slim" onclick="recoverThrownWeapon(${i},${out})">Recuperar todos</button>`:""}<span class="ammo-effect">Ao arremessar, 1 unidade sai da posse. Depois do combate, pode ser recuperada se não tiver quebrado ou sido perdida.</span></div>`
 };

 globalThis.recoverThrownWeapon=function(i,amount=1){
   const e=state.equipment?.[i];if(!e||!isThrown(e))return;
   const available=Math.max(0,+e.thrownOut||0),take=Math.min(available,Math.max(1,+amount||1));
   if(!take)return;e.thrownOut=available-take;e.qty=Math.max(0,+e.qty||0)+take;save();renderEquipment();
   if(typeof showPopup==="function")showPopup("🧭 Arma recuperada",e.name,`${take} unidade${take===1?"":"s"} recuperada${take===1?"":"s"} do campo.`)
 };

 const oldPrepare=globalThis.prepareWeaponD20;
 globalThis.prepareWeaponD20=function(i){
   const e=state.equipment?.[i];if(!e||e.type!=="arma")return;
   if(!isThrown(e))return typeof oldPrepare==="function"?oldPrepare(i):undefined;
   consolidateThrown();
   const qty=Math.max(0,+e.qty||0);
   if(qty<=0){if(typeof showPopup==="function")showPopup("🗡️ Sem arma em posse",e.name,`Todas as unidades de <b>${e.name}</b> estão arremessadas, perdidas ou já foram usadas. Recupere uma unidade antes de atacar.`);return}
   const throwing=!!e.useThrown;
   if(throwing){e.qty=qty-1;e.thrownOut=Math.max(0,+e.thrownOut||0)+1}
   const abilityKey=weaponAbility(e),ability=mod(state.stats[abilityKey]),magic=+e.magic||0,label=throwing?`${e.name} • Arremesso`:e.name;
   state.roll.bonus=weaponAttackBonus(e);if($("d20Bonus"))$("d20Bonus").value=state.roll.bonus;save();
   automaticAttack(label,state.roll.bonus,e.die||"1d4",ability+magic,throwing?"A arma foi arremessada e ficou registrada no campo para possível recuperação.":"");
   try{renderInventory();renderEquipment()}catch(_e){}
 };

 // Garante que futuras adições do Kit ou do catálogo também sejam agrupadas.
 const oldRenderEquipment=globalThis.renderEquipment;
 if(typeof oldRenderEquipment==="function")globalThis.renderEquipment=function(){consolidateThrown();return oldRenderEquipment.apply(this,arguments)};

 // ---------- PV AUTOMÁTICO ----------
 function conMod(){return Math.floor(((+state.stats?.CON||10)-10)/2)}
 function classDef(){try{return CLASS_DATA?.[state.cls]||null}catch{return globalThis.MICROCOSMO_DATA?.classes?.[state.cls]||null}}
 function hitDieMax(cls){return +(String(cls?.hit||"").match(/d(\d+)/i)?.[1]||0)}
 function autoHpForLevel(){
   const cls=classDef();if(!cls)return 0;const lvl=Math.max(1,+state.level||1),con=conMod(),first=Math.max(1,hitDieMax(cls)+con),next=Math.max(1,(+cls.hp||1)+con);return first+Math.max(0,lvl-1)*next
 }
 function ensureHpAutoFlag(){
   if(state.hpAuto===undefined){state.hpAuto=(+state.hpMax||0)<=0;try{save()}catch(e){}}
 }
 function applyAutoHp(force=false){
   ensureHpAutoFlag();if(!state.cls)return false;if(!force&&state.hpAuto===false)return false;
   const next=autoHpForLevel();if(!next)return false;
   const oldMax=Math.max(0,+state.hpMax||0),oldNow=Math.max(0,+state.hpNow||0),delta=next-oldMax;
   state.hpMax=next;
   if(oldMax<=0||oldNow<=0)state.hpNow=next;
   else if(delta>0)state.hpNow=Math.min(next,oldNow+delta);
   else state.hpNow=Math.min(oldNow,next);
   state.hpAuto=true;try{save()}catch(e){}
   if($("p1HpMax"))$("p1HpMax").value=state.hpMax;if($("p1HpNow"))$("p1HpNow").value=state.hpNow;
   return oldMax!==next
 }

 // Edição manual de PV Máximo desliga o cálculo automático para não sobrescrever escolhas do jogador.
 document.addEventListener("input",e=>{
   if(e.target?.id==="p1HpMax"&&!e.target.dataset.microHpAutoWrite){state.hpAuto=false;try{save()}catch(_e){}}
 },true);
 // Classe, nível e alterações de atributo podem mudar o PV automático.
 function scheduleHp(){setTimeout(()=>{if((+state.hpMax||0)<=0)state.hpAuto=true;applyAutoHp(false);try{renderCombat()}catch(e){}},0)}
 document.addEventListener("change",e=>{if(["p1ClassSelect","p1Level"].includes(e.target?.id))scheduleHp()},true);
 document.addEventListener("input",e=>{if(e.target?.id==="p1Level")scheduleHp()},true);
 document.addEventListener("click",e=>{if(e.target?.closest?.(".skill-rank,[data-atributo],.botao-atributo")||/atributo/i.test(e.target?.className||""))scheduleHp()},true);

 consolidateThrown();ensureHpAutoFlag();if((+state.hpMax||0)<=0)applyAutoHp(true);
 try{renderEquipment();renderCombat()}catch(e){}
 globalThis.MICROCOSMOS_THROWN_WEAPONS={consolidate:consolidateThrown,recover:globalThis.recoverThrownWeapon};
 globalThis.MICROCOSMOS_HP_AUTO={calculate:autoHpForLevel,apply:applyAutoHp};
})();