import {readFile,writeFile} from "node:fs/promises";

const root=new URL("../",import.meta.url);
const tableUrl=new URL("mesa-campanha.html",root);
const reactionUrl=new URL("codex-revisao/mesa-reaction-runtime.js",root);

let table=await readFile(tableUrl,"utf8");
const settingsTag='<script src="codex-revisao/mesa-settings-runtime.js"></script>';
const groupsTag='<script src="codex-revisao/mesa-reaction-groups-runtime.js"></script>';
if(!table.includes(settingsTag)){
  if(table.includes(groupsTag))table=table.replace(groupsTag,`${settingsTag}\n${groupsTag}`);
  else table=table.replace('</body>',`${settingsTag}\n</body>`);
}
await writeFile(tableUrl,table,"utf8");

let reaction=await readFile(reactionUrl,"utf8");

// Regra geral: se o Mestre desligar Reações, nenhum gatilho automático é criado.
const oldAfter='function afterMove(mover,from,to){\n    if(!mover||distance(from,to)<.05)return;';
const newAfter='function afterMove(mover,from,to){\n    const settings=globalThis.MICROCOSMOS_MESA_SETTINGS;if(settings?.tableRule&&!settings.tableRule("reactions",true))return;\n    if(!mover||distance(from,to)<.05)return;';
if(reaction.includes(oldAfter))reaction=reaction.replace(oldAfter,newAfter);

// Cada família de Reação pode ser ligada/desligada separadamente pela regra da Mesa.
const oldOptions='const attackIndices=meleeAttackIndices(reactor),magicIndices=magicOpportunityIndices(reactor,mover,from),event={kind:"opportunity",mover,target:mover,caster:mover,from,to},specials=specialOptionsFor(reactor,event);';
const newOptions='const settings=globalThis.MICROCOSMOS_MESA_SETTINGS,attackIndices=settings?.tableRule&&!settings.tableRule("opportunityAttack",true)?[]:meleeAttackIndices(reactor),magicIndices=settings?.tableRule&&!settings.tableRule("opportunityMagic",true)?[]:magicOpportunityIndices(reactor,mover,from),event={kind:"opportunity",mover,target:mover,caster:mover,from,to},specials=settings?.tableRule&&!settings.tableRule("specialReactions",true)?[]:specialOptionsFor(reactor,event);';
if(reaction.includes(oldOptions))reaction=reaction.replace(oldOptions,newOptions);

// Reações Especiais emitidas durante ataque/acerto/dano também obedecem às regras da Mesa.
const oldEmit='async function emit(event={}){\n    if(!event||!event.kind||globalThis.MICROCOSMOS_REACTION_CONTEXT||activeWindow)return event;';
const newEmit='async function emit(event={}){\n    const settings=globalThis.MICROCOSMOS_MESA_SETTINGS;if(settings?.tableRule&&(!settings.tableRule("reactions",true)||!settings.tableRule("specialReactions",true)))return event;\n    if(!event||!event.kind||globalThis.MICROCOSMOS_REACTION_CONTEXT||activeWindow)return event;';
if(reaction.includes(oldEmit))reaction=reaction.replace(oldEmit,newEmit);

// O aviso é preferência individual; a existência da Reação continua sendo regra da Mesa.
const oldOpportunityNotify='renderWindow();notify(`🚨 ${candidate.reactor.name} possui uma Reação contra ${candidate.mover.name}.`)}';
const newOpportunityNotify='renderWindow();if(globalThis.MICROCOSMOS_MESA_SETTINGS?.playerRule?.("notifyReactions",true)!==false)notify(`🚨 ${candidate.reactor.name} possui uma Reação contra ${candidate.mover.name}.`)}';
if(reaction.includes(oldOpportunityNotify))reaction=reaction.replace(oldOpportunityNotify,newOpportunityNotify);

const oldSpecialNotify='renderWindow();notify(`🌟 ${g.reactor.name} possui uma Reação Especial disponível.`)})';
const newSpecialNotify='renderWindow();if(globalThis.MICROCOSMOS_MESA_SETTINGS?.playerRule?.("notifyReactions",true)!==false)notify(`🌟 ${g.reactor.name} possui uma Reação Especial disponível.`)})';
if(reaction.includes(oldSpecialNotify))reaction=reaction.replace(oldSpecialNotify,newSpecialNotify);

await writeFile(reactionUrl,reaction,"utf8");
console.log("Configurações v1 publicadas: Mesa e Regras + Minha Experiência, com controles reais sobre Reações.");
