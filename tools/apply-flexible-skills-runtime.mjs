import {readFile,writeFile} from "node:fs/promises";

const root=new URL("../",import.meta.url);
const indexUrl=new URL("index.html",root);
const tableUrl=new URL("mesa-campanha.html",root);
const fichaRuntimeUrl=new URL("codex-revisao/flexible-skills-layout-runtime.js",root);
const skillNamesUrl=new URL("codex-revisao/skill-name-sync-runtime.js",root);
const classCraftUrl=new URL("codex-revisao/class-crafting-books-runtime.js",root);
const officioEquipmentUrl=new URL("codex-revisao/class-officio-equipment-runtime.js",root);
const officioKitGrantsUrl=new URL("codex-revisao/class-officio-kit-grants-runtime.js",root);
const creationAssistantUrl=new URL("codex-revisao/character-creation-assistant-runtime.js",root);
const creationFreezeFixUrl=new URL("codex-revisao/character-creation-freeze-fix-runtime.js",root);
const creationCodexDetailsUrl=new URL("codex-revisao/character-creation-codex-details-runtime.js",root);
const mesaRuntimeUrl=new URL("codex-revisao/mesa-flexible-skills-runtime.js",root);
const tokenBridgeUrl=new URL("codex-revisao/mesa-token-flexible-skills-bridge-runtime.js",root);
const clickFixUrl=new URL("codex-revisao/mesa-flexible-skills-click-fix-runtime.js",root);
const sceneCopyUrl=new URL("codex-revisao/mesa-scene-copy-paste-runtime.js",root);

// Falha o deploy cedo se algum dos runtimes tiver erro de sintaxe.
new Function(await readFile(fichaRuntimeUrl,"utf8"));
new Function(await readFile(skillNamesUrl,"utf8"));
new Function(await readFile(classCraftUrl,"utf8"));
new Function(await readFile(officioEquipmentUrl,"utf8"));
new Function(await readFile(officioKitGrantsUrl,"utf8"));
new Function(await readFile(creationAssistantUrl,"utf8"));
new Function(await readFile(creationFreezeFixUrl,"utf8"));
new Function(await readFile(creationCodexDetailsUrl,"utf8"));
new Function(await readFile(mesaRuntimeUrl,"utf8"));
new Function(await readFile(tokenBridgeUrl,"utf8"));
new Function(await readFile(clickFixUrl,"utf8"));
new Function(await readFile(sceneCopyUrl,"utf8"));

let index=await readFile(indexUrl,"utf8");

// A Ficha e a Mesa passam a usar exatamente a mesma lista canônica de nomes.
// O Atributo continua sendo apenas sugestão por causa da regra de Perícias Flexíveis.
const canonicalAttrs=`const ATTRS=[
 {k:"FOR",label:"Força",skills:[["Atletismo","FOR"]]},
 {k:"DES",label:"Destreza",skills:[["Acrobacia","DES"],["Furtividade","DES"],["Prestidigitação","DES"]]},
 {k:"CON",label:"Constituição",skills:[]},
 {k:"INT",label:"Inteligência",skills:[["Arcanismo","INT"],["História","INT"],["Investigação","INT"],["Natureza","INT"],["Religião","INT"],["Engenharia de Sucata","INT"]]},
 {k:"SAB",label:"Sabedoria",skills:[["Adestrar Animais","SAB"],["Intuição","SAB"],["Percepção","SAB"],["Medicina","SAB"],["Sobrevivência","SAB"],["Instinto do Matagal","SAB"]]},
 {k:"CAR",label:"Carisma",skills:[["Atuação","CAR"],["Enganação","CAR"],["Intimidação","CAR"],["Persuasão","CAR"]]}
];`;
const attrsStart=index.indexOf('const ATTRS=[');
if(attrsStart<0)throw new Error("MICROCOSMOS: bloco ATTRS da Ficha não encontrado");
const attrsEnd=index.indexOf('\n];',attrsStart);
if(attrsEnd<0)throw new Error("MICROCOSMOS: fim do bloco ATTRS da Ficha não encontrado");
index=index.slice(0,attrsStart)+canonicalAttrs+index.slice(attrsEnd+3);

const skillChoiceTag='<script src="codex-revisao/skill-choice-runtime.js"></script>';
const skillNamesTag='<script src="codex-revisao/skill-name-sync-runtime.js"></script>';
const fichaTag='<script src="codex-revisao/flexible-skills-layout-runtime.js"></script>';
const officioEquipmentTag='<script src="codex-revisao/class-officio-equipment-runtime.js"></script>';
const classCraftTag='<script src="codex-revisao/class-crafting-books-runtime.js"></script>';
const fullKitTag='<script src="codex-revisao/class-kit-full-grants-runtime.js"></script>';
const officioKitGrantsTag='<script src="codex-revisao/class-officio-kit-grants-runtime.js"></script>';
const creationAssistantTag='<script src="codex-revisao/character-creation-assistant-runtime.js"></script>';
const creationFreezeFixTag='<script src="codex-revisao/character-creation-freeze-fix-runtime.js"></script>';
const creationCodexDetailsTag='<script src="codex-revisao/character-creation-codex-details-runtime.js"></script>';
if(!index.includes(skillNamesTag)){
  if(index.includes(skillChoiceTag))index=index.replace(skillChoiceTag,`${skillChoiceTag}\n${skillNamesTag}`);
  else index=index.replace('</body>',`${skillNamesTag}\n</body>`);
}
if(!index.includes(fichaTag)){
  if(index.includes(skillNamesTag))index=index.replace(skillNamesTag,`${skillNamesTag}\n${fichaTag}`);
  else if(index.includes(skillChoiceTag))index=index.replace(skillChoiceTag,`${skillChoiceTag}\n${fichaTag}`);
  else index=index.replace('</body>',`${fichaTag}\n</body>`);
}
if(!index.includes(officioEquipmentTag)){
  if(index.includes(fichaTag))index=index.replace(fichaTag,`${fichaTag}\n${officioEquipmentTag}`);
  else index=index.replace('</body>',`${officioEquipmentTag}\n</body>`);
}
if(!index.includes(classCraftTag)){
  if(index.includes(officioEquipmentTag))index=index.replace(officioEquipmentTag,`${officioEquipmentTag}\n${classCraftTag}`);
  else if(index.includes(fichaTag))index=index.replace(fichaTag,`${fichaTag}\n${classCraftTag}`);
  else index=index.replace('</body>',`${classCraftTag}\n</body>`);
}
if(!index.includes(officioKitGrantsTag)){
  if(index.includes(fullKitTag))index=index.replace(fullKitTag,`${fullKitTag}\n${officioKitGrantsTag}`);
  else index=index.replace('</body>',`${officioKitGrantsTag}\n</body>`);
}
if(!index.includes(creationAssistantTag)){
  if(index.includes(officioKitGrantsTag))index=index.replace(officioKitGrantsTag,`${officioKitGrantsTag}\n${creationAssistantTag}`);
  else if(index.includes(classCraftTag))index=index.replace(classCraftTag,`${classCraftTag}\n${creationAssistantTag}`);
  else index=index.replace('</body>',`${creationAssistantTag}\n</body>`);
}
if(!index.includes(creationFreezeFixTag)){
  if(index.includes(creationAssistantTag))index=index.replace(creationAssistantTag,`${creationAssistantTag}\n${creationFreezeFixTag}`);
  else index=index.replace('</body>',`${creationFreezeFixTag}\n</body>`);
}
if(!index.includes(creationCodexDetailsTag)){
  if(index.includes(creationFreezeFixTag))index=index.replace(creationFreezeFixTag,`${creationFreezeFixTag}\n${creationCodexDetailsTag}`);
  else if(index.includes(creationAssistantTag))index=index.replace(creationAssistantTag,`${creationAssistantTag}\n${creationCodexDetailsTag}`);
  else index=index.replace('</body>',`${creationCodexDetailsTag}\n</body>`);
}
await writeFile(indexUrl,index,"utf8");

let table=await readFile(tableUrl,"utf8");
const settingsTag='<script src="codex-revisao/mesa-settings-runtime.js"></script>';
const reactionGroupsTag='<script src="codex-revisao/mesa-reaction-groups-runtime.js"></script>';
const sceneBuilderTag='<script src="codex-revisao/mesa-scene-builder-runtime.js"></script>';
const sceneCopyTag='<script src="codex-revisao/mesa-scene-copy-paste-runtime.js"></script>';
const mesaTag='<script src="codex-revisao/mesa-flexible-skills-runtime.js"></script>';
const bridgeTag='<script src="codex-revisao/mesa-token-flexible-skills-bridge-runtime.js"></script>';
const clickFixTag='<script src="codex-revisao/mesa-flexible-skills-click-fix-runtime.js"></script>';
if(!table.includes(mesaTag)){
  if(table.includes(settingsTag))table=table.replace(settingsTag,`${settingsTag}\n${mesaTag}`);
  else if(table.includes(reactionGroupsTag))table=table.replace(reactionGroupsTag,`${mesaTag}\n${reactionGroupsTag}`);
  else table=table.replace('</body>',`${mesaTag}\n</body>`);
}
if(!table.includes(bridgeTag)){
  if(table.includes(mesaTag))table=table.replace(mesaTag,`${mesaTag}\n${bridgeTag}`);
  else table=table.replace('</body>',`${bridgeTag}\n</body>`);
}
if(!table.includes(clickFixTag)){
  if(table.includes(bridgeTag))table=table.replace(bridgeTag,`${bridgeTag}\n${clickFixTag}`);
  else if(table.includes(mesaTag))table=table.replace(mesaTag,`${mesaTag}\n${clickFixTag}`);
  else table=table.replace('</body>',`${clickFixTag}\n</body>`);
}
if(!table.includes(sceneCopyTag)){
  if(table.includes(sceneBuilderTag))table=table.replace(sceneBuilderTag,`${sceneBuilderTag}\n${sceneCopyTag}`);
  else table=table.replace('</body>',`${sceneCopyTag}\n</body>`);
}
await writeFile(tableUrl,table,"utf8");

console.log("Perícias Flexíveis, Conhecimento de Ofício, Kits exclusivos, Assistente de Criação com Codex completo, correção de Sub-Raça/Antecedente, correção de travamento e atalhos do Construtor publicados.");
