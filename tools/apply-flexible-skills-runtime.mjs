import {readFile,writeFile} from "node:fs/promises";

const root=new URL("../",import.meta.url);
const indexUrl=new URL("index.html",root);
const tableUrl=new URL("mesa-campanha.html",root);
const fichaRuntimeUrl=new URL("codex-revisao/flexible-skills-layout-runtime.js",root);
const mesaRuntimeUrl=new URL("codex-revisao/mesa-flexible-skills-runtime.js",root);
const tokenBridgeUrl=new URL("codex-revisao/mesa-token-flexible-skills-bridge-runtime.js",root);

// Falha o deploy cedo se algum dos runtimes tiver erro de sintaxe.
new Function(await readFile(fichaRuntimeUrl,"utf8"));
new Function(await readFile(mesaRuntimeUrl,"utf8"));
new Function(await readFile(tokenBridgeUrl,"utf8"));

let index=await readFile(indexUrl,"utf8");
const skillChoiceTag='<script src="codex-revisao/skill-choice-runtime.js"></script>';
const fichaTag='<script src="codex-revisao/flexible-skills-layout-runtime.js"></script>';
if(!index.includes(fichaTag)){
  if(index.includes(skillChoiceTag))index=index.replace(skillChoiceTag,`${skillChoiceTag}\n${fichaTag}`);
  else index=index.replace('</body>',`${fichaTag}\n</body>`);
}
await writeFile(indexUrl,index,"utf8");

let table=await readFile(tableUrl,"utf8");
const settingsTag='<script src="codex-revisao/mesa-settings-runtime.js"></script>';
const reactionGroupsTag='<script src="codex-revisao/mesa-reaction-groups-runtime.js"></script>';
const mesaTag='<script src="codex-revisao/mesa-flexible-skills-runtime.js"></script>';
const bridgeTag='<script src="codex-revisao/mesa-token-flexible-skills-bridge-runtime.js"></script>';
if(!table.includes(mesaTag)){
  if(table.includes(settingsTag))table=table.replace(settingsTag,`${settingsTag}\n${mesaTag}`);
  else if(table.includes(reactionGroupsTag))table=table.replace(reactionGroupsTag,`${mesaTag}\n${reactionGroupsTag}`);
  else table=table.replace('</body>',`${mesaTag}\n</body>`);
}
if(!table.includes(bridgeTag)){
  if(table.includes(mesaTag))table=table.replace(mesaTag,`${mesaTag}\n${bridgeTag}`);
  else table=table.replace('</body>',`${bridgeTag}\n</body>`);
}
await writeFile(tableUrl,table,"utf8");

console.log("Perícias Flexíveis publicadas: ficha reorganizada, regra reforçada no Codex e rolagem por abordagem integrada à Mesa e às Ações do Token.");
