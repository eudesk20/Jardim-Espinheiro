import { readFile, writeFile } from "node:fs/promises";

const root=new URL("../",import.meta.url);

// Ficha principal: auditoria de materiais mágicos + autenticação demo.
const indexUrl=new URL("index.html",root);
let html=await readFile(indexUrl,"utf8");
const auditTag='<script src="codex-revisao/spell-material-audit.js"></script>';
const runtimeTag='<script src="codex-revisao/material-audit-runtime.js"></script>';
const authTag='<script src="codex-revisao/auth-demo-runtime.js"></script>';
const masterDiscoveryFixTag='<script src="codex-revisao/master-discovery-fix-runtime.js"></script>';
if(!html.includes(auditTag)){
  html=html.replace('<script src="codex-revisao/spell-data.js"></script>',`<script src="codex-revisao/spell-data.js"></script>\n${auditTag}`);
}
if(!html.includes(runtimeTag))html=html.replace('</body>',`${runtimeTag}\n</body>`);
if(!html.includes(authTag))html=html.replace('</body>',`${authTag}\n</body>`);
if(!html.includes(masterDiscoveryFixTag))html=html.replace('</body>',`${masterDiscoveryFixTag}\n</body>`);
await writeFile(indexUrl,html,"utf8");

// Codex de Origens: distribuições de atributos derivadas de cada descrição.
const originsUrl=new URL("codex-revisao/origens-equipamentos-talentos-revisao.html",root);
let origins=await readFile(originsUrl,"utf8");
const originRuntime='<script src="origin-attributes-runtime.js"></script>';
if(!origins.includes(originRuntime))origins=origins.replace('</body>',`${originRuntime}\n</body>`);
await writeFile(originsUrl,origins,"utf8");

console.log("Runtimes de materiais, atributos das Origens, login demo e visão de Descobertas do Mestre aplicados à publicação.");
