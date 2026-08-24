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
const classKitSheetTag='<script src="codex-revisao/class-kit-sheet-runtime.js"></script>';
const classFeatureDetailsTag='<script src="codex-revisao/class-feature-details-runtime.js"></script>';
const cantripCapacityTag='<script src="codex-revisao/cantrip-capacity-runtime.js"></script>';
const cantripQualityTag='<script src="codex-revisao/cantrip-quality-runtime.js"></script>';
const cantripCombatAuditTag='<script src="codex-revisao/cantrip-combat-audit-runtime.js"></script>';
const cantrip2024SpecialTag='<script src="codex-revisao/cantrip-2024-special-runtime.js"></script>';
const cantripUaCurationTag='<script src="codex-revisao/cantrip-ua-curation-runtime.js"></script>';
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
if(!html.includes(classKitSheetTag))html=html.replace('</body>',`${classKitSheetTag}\n</body>`);
if(!html.includes(classFeatureDetailsTag))html=html.replace('</body>',`${classFeatureDetailsTag}\n</body>`);
if(!html.includes(cantripCapacityTag))html=html.replace('</body>',`${cantripCapacityTag}\n</body>`);
if(!html.includes(cantripQualityTag))html=html.replace('</body>',`${cantripQualityTag}\n</body>`);
if(!html.includes(cantripCombatAuditTag))html=html.replace('</body>',`${cantripCombatAuditTag}\n</body>`);
if(!html.includes(cantrip2024SpecialTag))html=html.replace('</body>',`${cantrip2024SpecialTag}\n</body>`);
if(!html.includes(cantripUaCurationTag))html=html.replace('</body>',`${cantripUaCurationTag}\n</body>`);
if(!html.includes(onlineAuthTag))html=html.replace('</body>',`${onlineAuthTag}\n</body>`);
if(!html.includes('microCampaignTableLinkRuntime'))html=html.replace('</body>',`${campaignTableLinkTag}\n</body>`);
await writeFile(indexUrl,html,"utf8");

// Mesa da Campanha: expõe a API do protótipo para os runtimes online.
const tableUrl=new URL("mesa-campanha.html",root);
let table=await readFile(tableUrl,"utf8");
const tableRuntimeTag='<script src="codex-revisao/mesa-ficha-token-runtime.js"></script>';
const tableMagicRuntimeTag='<script src="codex-revisao/mesa-magic-effects-runtime.js"></script>';
const tableApiMarker='globalThis.MICROCOSMOS_TABLE_PLAYERS=players;';
if(!table.includes(tableApiMarker)){
  const initNeedle='renderPlayers();renderTokens();updateGrid();setTransform();selectToken("luna");';
  const apiCode=`globalThis.MICROCOSMOS_TABLE_PLAYERS=players;\nglobalThis.MICROCOSMOS_TABLE_API={renderPlayers,renderTokens,selectToken,quickRoll,updateGrid,setTransform};\n${initNeedle}`;
  if(!table.includes(initNeedle))throw new Error("Não foi possível localizar a inicialização da Mesa para expor sua API.");
  table=table.replace(initNeedle,apiCode);
}
if(!table.includes(tableRuntimeTag))table=table.replace('</body>',`${tableRuntimeTag}\n</body>`);
if(!table.includes(tableMagicRuntimeTag))table=table.replace('</body>',`${tableMagicRuntimeTag}\n</body>`);
await writeFile(tableUrl,table,"utf8");

// Codex de Origens: distribuições de atributos derivadas de cada descrição.
const originsUrl=new URL("codex-revisao/origens-equipamentos-talentos-revisao.html",root);
let origins=await readFile(originsUrl,"utf8");
const originRuntime='<script src="origin-attributes-runtime.js"></script>';
if(!origins.includes(originRuntime))origins=origins.replace('</body>',`${originRuntime}\n</body>`);
await writeFile(originsUrl,origins,"utf8");

console.log("Runtimes de materiais, Origens, Descobertas, pop-ups, perícias, Kits de Classe, descrições de Características, contador e auditorias de Truques (incluindo consolidação 2024 e curadoria UA), autenticação online Supabase v2, Mesa, tokens vinculados e efeitos mágicos aplicados à publicação.");
