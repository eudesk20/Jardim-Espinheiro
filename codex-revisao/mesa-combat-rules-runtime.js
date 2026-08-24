/* MICROCOSMOS — Executor de combate da Mesa, fase funcional.
   Problema 4: enriquece os dados puxados da ficha e resolve alcance, ataque
   mágico/CA e Salvaguarda antes do efeito de dano/cura existente. */
(function(){
 if(globalThis.MICROCOSMOS_MESA_COMBAT_RULES)return;globalThis.MICROCOSMOS_MESA_COMBAT_RULES=true;
 const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;if(!Array.isArray(players))return;
 const mod=v=>Math.floor(((+v||10)-10)/2),prof=l=>2+Math.floor((Math.max(1,+l||1)-1)/4),d20=()=>1+Math.floor(Math.random()*20);
 function metersBetween(a,b){const size=+document.getElementById("gridSize")?.value||70;return Math.hypot((+a.x||0)-(+b.x||0),(+a.y||0)-(+b.y||0))/size*1.5}
 function parseRange(v){const s=String(v||"").toLowerCase().replace(",",".");if(/toque/.test(s))return 1.5;if(/pessoal/.test(s))return 0;const n=parseFloat(s.match(/\d+(?:\.\d+)?/)?.[0]);return Number.isFinite(n)?n:null}
 function saveBonus(p,key){if(p.saves&&Number.isFinite(+p.saves[key]))return +p.saves[key];if(p.stats){const base=mod(p.stats[key]);return base+(p.saveProficiencies||[]).includes(key)?prof(p.level):base}return 0}
 function spellDC(p){if(Number.isFinite(+p.spellDC))return +p.spellDC;return 8+prof(p.level)+(+p.spellAbilityMod||0)}
 function spellAttack(p){if(Number.isFinite(+p.spellAttack))return +p.spellAttack;return prof(p.level)+(+p.spellAbilityMod||0)}
 function evaluate(caster,target,spell){const range=parseRange(spell.range||spell.rangeMeters);const distance=metersBetween(caster,target);if(range!==null&&range>0&&distance>range+.01)return{ok:false,reason:`Fora do alcance: ${distance.toFixed(1)} m / máximo ${range} m. A tentativa é registrada como uso.`};if(spell.attack){const natural=d20(),total=natural+spellAttack(caster),hit=natural!==1&&(natural===20||total>=(+target.ac||10));return{ok:hit,attack:true,natural,total,ac:+target.ac||10,reason:hit?`Ataque ${total} contra CA ${+target.ac||10}.`:`Ataque ${total} contra CA ${+target.ac||10}: errou.`}}const key=String(spell.save||"").toUpperCase();if(key){const roll=d20(),bonus=saveBonus(target,key),total=roll+bonus,dc=spellDC(caster),failed=total<dc;return{ok:failed,save:true,key,roll,bonus,total,dc,reason:failed?`Salvaguarda de ${key}: ${total} contra CD ${dc}, falha.`:`Salvaguarda de ${key}: ${total} contra CD ${dc}, sucesso.`}}return{ok:true,reason:`Alvo dentro do alcance (${distance.toFixed(1)} m).`}}
 globalThis.MICROCOSMOS_COMBAT_RULES={evaluate,metersBetween,parseRange,saveBonus,spellDC,spellAttack};
})();
