import { readFile, writeFile } from "node:fs/promises";

const file = new URL("../codex-revisao/grimorio-index.js", import.meta.url);
const source = await readFile(file, "utf8");
const prefix = "const GRIMOIRE_SPELL_INDEX=";
if (!source.startsWith(prefix) || !source.trimEnd().endsWith(";")) {
  throw new Error("Formato inesperado em grimorio-index.js");
}

const spells = JSON.parse(source.trim().slice(prefix.length, -1));
const references = spells.filter(spell => spell.kind === "referencia");
const classIds = {
  Bard: "bardo",
  Cleric: "clerigo",
  Druid: "druida",
  Paladin: "paladino",
  Ranger: "patrulheiro",
  Sorcerer: "feiticeiro",
  Warlock: "bruxo",
  Wizard: "mago"
};
const manualClasses = {
  "Dark Star": ["mago"],
  "Reality Break": ["mago"],
  "Ravenous Void": ["mago"],
  "Time Ravage": ["mago"]
};

const catalogResponse = await fetch("https://www.dnd5eapi.co/api/2014/spells");
if (!catalogResponse.ok) throw new Error(`Falha ao consultar catálogo: ${catalogResponse.status}`);
const catalog = await catalogResponse.json();
const byName = new Map(catalog.results.map(item => [item.name.toLocaleLowerCase("en"), item.url]));

async function loadFiveToolsClasses() {
  const url = "https://raw.githubusercontent.com/5etools-mirror-3/5etools-2014-src/main/data/generated/gendata-spell-source-lookup.json";
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha no índice 5e.tools: ${response.status}`);
  const lookup = await response.json();
  const result = new Map();
  for (const book of Object.values(lookup)) {
    for (const [name, spell] of Object.entries(book)) {
      const classes = ["class", "classVariant"].flatMap(type =>
        Object.values(spell[type] || {}).flatMap(group => Object.keys(group))
      );
      const current = result.get(name) || [];
      result.set(name, [...new Set([...current, ...classes.map(name => classIds[name]).filter(Boolean)])]);
    }
  }
  return result;
}

const fiveToolsByName = await loadFiveToolsClasses();

async function loadClasses(spell) {
  if (manualClasses[spell.title]) return { key: spell.key, classes: manualClasses[spell.title] };
  const url = byName.get(spell.title.toLocaleLowerCase("en"));
  if (!url) {
    const classes = fiveToolsByName.get(spell.title.toLocaleLowerCase("en")) || [];
    return classes.length ? { key: spell.key, classes } : { key: spell.key, classes: [], missing: spell.title };
  }
  const response = await fetch(`https://www.dnd5eapi.co${url}`);
  if (!response.ok) throw new Error(`Falha em ${spell.title}: ${response.status}`);
  const data = await response.json();
  return {
    key: spell.key,
    classes: (data.classes || []).map(item => classIds[item.name]).filter(Boolean)
  };
}

const classified = [];
for (let index = 0; index < references.length; index += 16) {
  classified.push(...await Promise.all(references.slice(index, index + 16).map(loadClasses)));
}
const byKey = new Map(classified.map(item => [item.key, item]));
for (const spell of spells) {
  const match = byKey.get(spell.key);
  if (match) spell.classes = match.classes;
}

await writeFile(file, `${prefix}${JSON.stringify(spells)};\n`, "utf8");
const missing = classified.filter(item => item.missing);
console.log(JSON.stringify({ total: spells.length, references: references.length, classified: classified.length - missing.length, missing }, null, 2));
