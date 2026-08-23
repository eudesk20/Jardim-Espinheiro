import { readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const SPELL_DATA_URL = new URL("codex-revisao/spell-data.js", ROOT);
const OUTPUT_URL = new URL("codex-revisao/spell-material-audit.js", ROOT);
const FIVE_TOOLS_BASE = "https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/spells/";

function norm(value="") {
  return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
}
function formatGp(cp) {
  const gp = Number(cp || 0) / 100;
  if (!gp) return "";
  return `${Number.isInteger(gp) ? gp : gp.toFixed(2).replace(/0+$/,"").replace(/\.$/,"")} RS`;
}
function componentAudit(component) {
  if (!component || typeof component === "string") return {text: typeof component === "string" ? component : "", costCp:0, cost:"", consumed:false};
  return {
    text: component.text || "",
    costCp: Number(component.cost || 0),
    cost: formatGp(component.cost),
    consumed: !!component.consume
  };
}

/*
  Auditoria de materiais do MICROCOSMOS.
  O gerador principal já liga os materiais temáticos mais frequentes às Magias.
  Estes vínculos cobrem materiais que continuavam classificados como "Magia",
  mas não eram escolhidos por nenhuma regra temática do gerador.

  Importante: adicionar um material aqui NÃO torna seu valor comercial um custo
  obrigatório da Magia. A regra de Foco/Bolsa continua sendo determinada pelo
  custo/consumo oficial do componente da própria Magia.
*/
const SPECIAL_MAGIC_MATERIALS = [
  {id:"fungo_bioluminescente", references:["light","dancing lights"]},
  {id:"geleia_revigorante", references:["goodberry","regenerate"]},
  {id:"bateria_gigante", references:["lightning bolt","chain lightning"]},
  {id:"polen_estelar", references:["foresight","astral projection","dream"]},
  {id:"micelio_memoria", references:["legend lore","dream"]},
  {id:"semente_coracao", references:["awaken"]},
  {id:"reliquia_viva", references:["true resurrection","clone"]}
].map(rule=>({...rule,references:new Set(rule.references.map(norm))}));

function auditedMaterialIds(spell) {
  const ids = new Set(Array.isArray(spell.materialIds) ? spell.materialIds : []);
  const reference = norm(spell.reference);
  for (const rule of SPECIAL_MAGIC_MATERIALS) if (rule.references.has(reference)) ids.add(rule.id);
  return [...ids];
}

const raw = await readFile(SPELL_DATA_URL, "utf8");
const match = raw.match(/globalThis\.CODEX_SPELL_DATA\s*=\s*([\s\S]*);\s*$/);
if (!match) throw new Error("Não foi possível interpretar codex-revisao/spell-data.js");
const spells = JSON.parse(match[1]);

const index = await fetch(`${FIVE_TOOLS_BASE}index.json`).then(r=>{if(!r.ok)throw new Error(`5etools index ${r.status}`);return r.json()});
const files = [...new Set(Object.values(index))];
const reference = new Map();
for (const file of files) {
  const data = await fetch(`${FIVE_TOOLS_BASE}${file}`).then(r=>{if(!r.ok)throw new Error(`${file}: ${r.status}`);return r.json()});
  for (const spell of data.spell || []) {
    const key = norm(spell.name);
    const audit = componentAudit(spell.components?.m);
    const previous = reference.get(key);
    // Prefere o registro que realmente contenha custo ou consumo explícito.
    if (!previous || audit.costCp > previous.costCp || (audit.consumed && !previous.consumed)) reference.set(key, audit);
  }
}

const audit = {};
let materialSpells=0,costly=0,consumed=0,unmatched=0,specialLinks=0;
for (const spell of spells) {
  const hasMaterial = String(spell.components||"").split(/[,/]/).map(x=>x.trim()).includes("M");
  if (!hasMaterial) continue;
  materialSpells++;
  const found = reference.get(norm(spell.reference)) || reference.get(norm(String(spell.reference||"").replace(/\s*\(UA\)$/i,"")));
  if (!found) unmatched++;
  const cost = found?.cost || "";
  const isConsumed = !!found?.consumed;
  if (cost) costly++;
  if (isConsumed) consumed++;
  const originalIds = Array.isArray(spell.materialIds) ? spell.materialIds : [];
  const materialIds = auditedMaterialIds(spell);
  specialLinks += Math.max(0,materialIds.length-originalIds.length);
  audit[spell.key] = {
    materialIds,
    reference: spell.reference || "",
    originalMaterial: found?.text || "",
    requiredValue: cost,
    requiredValueGp: found?.costCp ? found.costCp/100 : 0,
    consumed: isConsumed,
    focusReplaceable: !cost && !isConsumed,
    auditSource: found ? "5etools • referência 5e" : "MICROCOSMOS • sem correspondência externa"
  };
}

const payload = `/* Gerado automaticamente por tools/build-material-audit.mjs.\n   Não editar manualmente: audita custo, consumo, vínculo e substituição por Foco/Bolsa. */\nglobalThis.SPELL_MATERIAL_AUDIT=${JSON.stringify(audit,null,2)};\nglobalThis.SPELL_MATERIAL_AUDIT_STATS=${JSON.stringify({totalSpells:spells.length,materialSpells,costly,consumed,unmatched,specialLinks,generatedAt:new Date().toISOString()},null,2)};\n`;
await writeFile(OUTPUT_URL,payload,"utf8");
console.log(`Auditoria: ${spells.length} magias; ${materialSpells} com M; ${costly} com custo; ${consumed} consumíveis; ${specialLinks} vínculos especiais; ${unmatched} sem correspondência.`);
