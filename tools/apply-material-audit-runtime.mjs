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
const cantripFinalAuditTag='<script src="codex-revisao/cantrip-final-audit-runtime.js"></script>';
const spellKnownProgressionTag='<script src="codex-revisao/spell-known-progression-runtime.js"></script>';
const magicCapacityEnforcementTag='<script src="codex-revisao/magic-capacity-enforcement-runtime.js"></script>';
const spellRelearningTag='<script src="codex-revisao/spell-relearning-runtime.js"></script>';
const campaignTableLinkTag='<script id="microCampaignTableLinkRuntime">(()=>{if(document.getElementById("microCampaignTableLink"))return;const tabs=document.querySelector(".tabs");if(!tabs)return;const link=document.createElement("a");link.id="microCampaignTableLink";link.href="mesa-campanha.html";link.textContent="🗺️ Mesa da Campanha";link.setAttribute("aria-label","Abrir Mesa da Campanha");link.style.cssText="white-space:nowrap;border:1px solid #846d4a;background:#263c30;color:#f5e4ad;border-radius:999px;padding:9px 13px;font-weight:bold;box-shadow:0 4px 10px #0003;text-decoration:none;display:inline-flex;align-items:center;justify-content:center";tabs.appendChild(link)})();</script>';

html=html.replaceAll('<script src="codex-revisao/auth-demo-runtime.js"></script>','').replaceAll('<script src="codex-revisao/account-sheet-runtime.js"></script>','').replaceAll('<script src="codex-revisao/supabase-online-runtime.js"></script>','');
if(!html.includes(auditTag))html=html.replace('<script src="codex-revisao/spell-data.js"></script>',`<script src="codex-revisao/spell-data.js"></script>\n${auditTag}`);
for(const tag of [runtimeTag,masterDiscoveryFixTag,popupLayerFixTag,skillChoiceTag,classKitSheetTag,classFeatureDetailsTag,cantripCapacityTag,cantripQualityTag,cantripCombatAuditTag,cantrip2024SpecialTag,cantripUaCurationTag,cantripFinalAuditTag,spellKnownProgressionTag,magicCapacityEnforcementTag,spellRelearningTag,onlineAuthTag])if(!html.includes(tag))html=html.replace('</body>',`${tag}\n</body>`);
if(!html.includes('microCampaignTableLinkRuntime'))html=html.replace('</body>',`${campaignTableLinkTag}\n</body>`);
await writeFile(indexUrl,html,"utf8");

const tableUrl=new URL("mesa-campanha.html",root);let table=await readFile(tableUrl,"utf8");
const tableRuntimeTag='<script src="codex-revisao/mesa-ficha-token-runtime.js"></script>';
const tableMagicRuntimeTag='<script src="codex-revisao/mesa-magic-effects-runtime.js"></script>';
const tableTargetPointerFixTag='<script src="codex-revisao/mesa-target-pointer-fix-runtime.js"></script>';
const tableApiMarker='globalThis.MICROCOSMOS_TABLE_PLAYERS=players;';
if(!table.includes(tableApiMarker)){const initNeedle='renderPlayers();renderTokens();updateGrid();setTransform();selectToken("luna");';const apiCode=`globalThis.MICROCOSMOS_TABLE_PLAYERS=players;\nglobalThis.MICROCOSMOS_TABLE_API={renderPlayers,renderTokens,selectToken,quickRoll,updateGrid,setTransform};\n${initNeedle}`;if(!table.includes(initNeedle))throw new Error("Não foi possível localizar a inicialização da Mesa para expor sua API.");table=table.replace(initNeedle,apiCode)}
for(const tag of [tableRuntimeTag,tableMagicRuntimeTag,tableTargetPointerFixTag])if(!table.includes(tag))table=table.replace('</body>',`${tag}\n</body>`);
await writeFile(tableUrl,table,"utf8");

const originsUrl=new URL("codex-revisao/origens-equipamentos-talentos-revisao.html",root);let origins=await readFile(originsUrl,"utf8");const originRuntime='<script src="origin-attributes-runtime.js"></script>';if(!origins.includes(originRuntime))origins=origins.replace('</body>',`${originRuntime}\n</body>`);await writeFile(originsUrl,origins,"utf8");
console.log("Runtimes MICROCOSMOS aplicados: materiais, Origens, Kits, Truques, limites/Conhecidas, reaprendizado no DL, autenticação, Mesa, tokens, pointer e efeitos mágicos.");
