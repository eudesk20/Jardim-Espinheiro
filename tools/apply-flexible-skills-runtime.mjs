import {readFile,writeFile} from "node:fs/promises";

const root=new URL("../",import.meta.url);
const indexUrl=new URL("index.html",root);
const tableUrl=new URL("mesa-campanha.html",root);
const fichaRuntimeUrl=new URL("codex-revisao/flexible-skills-layout-runtime.js",root);
const skillNamesUrl=new URL("codex-revisao/skill-name-sync-runtime.js",root);
const mesaRuntimeUrl=new URL("codex-revisao/mesa-flexible-skills-runtime.js",root);
const tokenBridgeUrl=new URL("codex-revisao/mesa-token-flexible-skills-bridge-runtime.js",root);
const clickFixUrl=new URL("codex-revisao/mesa-flexible-skills-click-fix-runtime.js",root);

// Falha o deploy cedo se algum dos runtimes tiver erro de sintaxe.
new Function(await readFile(fichaRuntimeUrl,"utf8"));
new Function(await readFile(skillNamesUrl,"utf8"));
new Function(await readFile(mesaRuntimeUrl,"utf8"));
new Function(await readFile(tokenBridgeUrl,"utf8"));
new Function(await readFile(clickFixUrl,"utf8"));

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
if(!index.includes(skillNamesTag)){
  if(index.includes(skillChoiceTag))index=index.replace(skillChoiceTag,`${skillChoiceTag}\n${skillNamesTag}`);
  else index=index.replace('</body>',`${skillNamesTag}\n</body>`);
}
if(!index.includes(fichaTag)){
  if(index.includes(skillNamesTag))index=index.replace(skillNamesTag,`${skillNamesTag}\n${fichaTag}`);
  else if(index.includes(skillChoiceTag))index=index.replace(skillChoiceTag,`${skillChoiceTag}\n${fichaTag}`);
  else index=index.replace('</body>',`${fichaTag}\n</body>`);
}
await writeFile(indexUrl,index,"utf8");

let table=await readFile(tableUrl,"utf8");
const settingsTag='<script src="codex-revisao/mesa-settings-runtime.js"></script>';
const reactionGroupsTag='<script src="codex-revisao/mesa-reaction-groups-runtime.js"></script>';
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
await writeFile(tableUrl,table,"utf8");

console.log("Perícias Flexíveis publicadas: Ficha e Token com nomes canônicos iguais, migração das Proficiências antigas, regra no Codex e integração às Ações do Token.");
