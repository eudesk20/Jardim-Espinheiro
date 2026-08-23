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
    // Prefer a record that actually carries an explicit material cost/consumption rule.
    if (!previous || audit.costCp > previous.costCp || (audit.consumed && !previous.consumed)) reference.set(key, audit);
  }
}

const audit = {};
let materialSpells=0,costly=0,consumed=0,unmatched=0;
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
  audit[spell.key] = {
    materialIds: Array.isArray(spell.materialIds) ? spell.materialIds : [],
    reference: spell.reference || "",
    originalMaterial: found?.text || "",
    requiredValue: cost,
    requiredValueGp: found?.costCp ? found.costCp/100 : 0,
    consumed: isConsumed,
    focusReplaceable: !cost && !isConsumed,
    auditSource: found ? "5etools • referência 5e" : "MICROCOSMOS • sem correspondência externa"
  };
}

const payload = `/* Gerado automaticamente por tools/build-material-audit.mjs.\n   Não editar manualmente: audita custo, consumo e substituição por Foco/Bolsa. */\nglobalThis.SPELL_MATERIAL_AUDIT=${JSON.stringify(audit,null,2)};\nglobalThis.SPELL_MATERIAL_AUDIT_STATS=${JSON.stringify({totalSpells:spells.length,materialSpells,costly,consumed,unmatched,generatedAt:new Date().toISOString()},null,2)};\n`;
await writeFile(OUTPUT_URL,payload,"utf8");
console.log(`Auditoria: ${spells.length} magias; ${materialSpells} com M; ${costly} com custo; ${consumed} consumíveis; ${unmatched} sem correspondência.`);
