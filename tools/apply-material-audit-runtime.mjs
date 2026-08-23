import { readFile, writeFile } from "node:fs/promises";

const root=new URL("../",import.meta.url);
const indexUrl=new URL("index.html",root);
let html=await readFile(indexUrl,"utf8");
const auditTag='<script src="codex-revisao/spell-material-audit.js"></script>';
const runtimeTag='<script src="codex-revisao/material-audit-runtime.js"></script>';
if(!html.includes(auditTag)){
  html=html.replace('<script src="codex-revisao/spell-data.js"></script>',`<script src="codex-revisao/spell-data.js"></script>\n${auditTag}`);
}
if(!html.includes(runtimeTag)){
  html=html.replace('</body>',`${runtimeTag}\n</body>`);
}
await writeFile(indexUrl,html,"utf8");
console.log("Runtime da auditoria de materiais aplicado ao index.html de publicação.");
