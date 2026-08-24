import { readFile, writeFile } from "node:fs/promises";

const root=new URL("../",import.meta.url);

// Ficha principal: runtimes publicados no GitHub Pages.
const indexUrl=new URL("index.html",root);
let html=await readFile(indexUrl,"utf8");
const auditTag='<script src="codex-revisao/spell-material-audit.js"></script>';
const runtimeTag='<script src="codex-revisao/material-audit-runtime.js"></script>';
const onlineAuthTag='<script src="codex-revisao/supabase-online-runtime-v2.js"></script>';
const masterDiscoveryFixTag='<script src="codex-revisao/master-discovery-fix-runtime.js"></script>';
const popupLayerFixTag='<script src="codex-revisao/popup-layer-fix-runtime.js"></script>';
const skillChoiceTag='<script src="codex-revisao/skill-choice-runtime.js"></script>';
const campaignTableLinkTag='<script id="microCampaignTableLinkRuntime">(()=>{if(document.getElementById("microCampaignTableLink"))return;const tabs=document.querySelector(".tabs");if(!tabs)return;const link=document.createElement("a");link.id="microCampaignTableLink";link.href="mesa-campanha.html";link.textContent="🗺️ Mesa da Campanha";link.setAttribute("aria-label","Abrir Mesa da Campanha");link.style.cssText="white-space:nowrap;border:1px solid #846d4a;background:#263c30;color:#f5e4ad;border-radius:999px;padding:9px 13px;font-weight:bold;box-shadow:0 4px 10px #0003;text-decoration:none;display:inline-flex;align-items:center;justify-content:center";tabs.appendChild(link)})();</script>';

// Remove runtimes antigos para não competir com a autenticação/sincronização atual.
html=html
  .replaceAll('<script src="codex-revisao/auth-demo-runtime.js"></script>','')
  .replaceAll('<script src="codex-revisao/account-sheet-runtime.js"></script>','')
  .replaceAll('<script src="codex-revisao/supabase-online-runtime.js"></script>','');

if(!html.includes(auditTag)){
  html=html.replace('<script src="codex-revisao/spell-data.js"></script>',`<script src="codex-revisao/spell-data.js"></script>\n${auditTag}`);
}
if(!html.includes(runtimeTag))html=html.replace('</body>',`${runtimeTag}\n</body>`);
if(!html.includes(masterDiscoveryFixTag))html=html.replace('</body>',`${masterDiscoveryFixTag}\n</body>`);
if(!html.includes(popupLayerFixTag))html=html.replace('</body>',`${popupLayerFixTag}\n</body>`);
if(!html.includes(skillChoiceTag))html=html.replace('</body>',`${skillChoiceTag}\n</body>`);
if(!html.includes(onlineAuthTag))html=html.replace('</body>',`${onlineAuthTag}\n</body>`);
if(!html.includes('microCampaignTableLinkRuntime'))html=html.replace('</body>',`${campaignTableLinkTag}\n</body>`);
await writeFile(indexUrl,html,"utf8");

// Codex de Origens: distribuições de atributos derivadas de cada descrição.
const originsUrl=new URL("codex-revisao/origens-equipamentos-talentos-revisao.html",root);
let origins=await readFile(originsUrl,"utf8");
const originRuntime='<script src="origin-attributes-runtime.js"></script>';
if(!origins.includes(originRuntime))origins=origins.replace('</body>',`${originRuntime}\n</body>`);
await writeFile(originsUrl,origins,"utf8");

console.log("Runtimes de materiais, Origens, Descobertas, pop-ups, perícias, autenticação online Supabase v2 e acesso à Mesa da Campanha aplicados à publicação.");
