import { readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const TARGET = new URL("codex-revisao/mesa-master-tools-organizer-runtime.js", ROOT);

let source = await readFile(TARGET, "utf8");

const broken = 'd.querySelector("summary").textContent=title;d.open=!!open&&root.querySelectorAll(".micro-master-section[open]").length===0;';
const fixed = 'd.querySelector("summary").textContent=title;if(!d.dataset.masterInitialOpen){d.dataset.masterInitialOpen="1";if(open)d.open=true;}';

if (source.includes(broken)) {
  source = source.replace(broken, fixed);
} else if (!source.includes('masterInitialOpen') && !source.includes('masterInitialRender') && !source.includes('v2Bound')) {
  throw new Error("Trecho esperado da gaveta do Mestre não foi encontrado.");
}

await writeFile(TARGET, source, "utf8");
console.log("Estado das gavetas do Mestre preservado: reorganizações não abrem/fecham detalhes automaticamente.");
