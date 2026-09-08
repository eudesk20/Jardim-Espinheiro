import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const spellFile = new URL("codex-revisao/spell-data.js", root);
const indexFile = new URL("codex-revisao/grimorio-index.js", root);
const gameFile = new URL("codex-revisao/game-data.js", root);
const classPageFile = new URL("codex-revisao/classes-revisao.html", root);
const runtimeFiles = [
  "cantrip-2024-special-runtime.js", "cantrip-combat-audit-runtime.js",
  "cantrip-final-audit-runtime.js", "cantrip-quality-runtime.js",
  "cantrip-ua-curation-runtime.js", "mesa-reaction-turn-compat-runtime.js"
];

const spellNames = {
  "truques-17": "✨ Palma do Besouro-Sol (Experimental)",
  "truques-28": "🌀 Mulligar Relíquia (Experimental)",
  "truques-48": "🛡️ Casca de Ânimo (Experimental)",
  "m1-2": "✨ Filete de Seiva Corrosiva (Experimental)",
  "m1-5": "🌀 Ferrão Imbuído (Experimental)",
  "m1-45": "👁️ Mão-Guia do Micélio (Experimental)",
  "m1-47": "🕸️ Tônico de Orvalho Vital (Experimental)",
  "m1-54": "🎵 Sussurro do Subconsciente (Experimental)",
  "m1-57": "👁️ Fio Infalível da Colônia (Experimental)",
  "m1-66": "🎵 Fios da Marionete (Experimental)",
  "m1-69": "🌀 Toque Distante na Relíquia (Experimental)",
  "m1-72": "👁️ Sentir Feromônios (Experimental)",
  "m1-80": "🎵 Alarme da Cigarra (Experimental)",
  "m1-86": "🪞 Coro do Jardim Profundo (Experimental)",
  "m1-88": "🌀 Instinto do Batedor (Experimental)",
  "m2-6": "🌀 Decifrar Relíquia (Experimental)",
  "m2-23": "🛡️ Véu da Engrenagem (Experimental)",
  "m2-32": "🕸️ Convocar Montaria de Sucata (Experimental)",
  "m2-43": "✨ Geada da Mariposa Pálida (Experimental)",
  "m2-57": "🛡️ Casulo Mental (Experimental)",
  "m2-59": "🎵 Impulso do Micélio (Experimental)",
  "m2-64": "🪞 Travessura Experimental do Pólen",
  "m2-85": "🕸️ Rajada de Folhas Laminadas (Experimental)",
  "m2-89": "🛡️ Carapaça do Pensamento (Experimental)",
  "m3-3": "🎵 Feromônio de Discórdia (Experimental)",
  "m3-15": "🕸️ Convocar Faminto Menor (Experimental)",
  "m3-29": "🌀 Passos sobre Brasas (Experimental)",
  "m3-35": "🎵 Descompasso das Engrenagens (Experimental)",
  "m3-36": "🕸️ Fortaleza de Folhas (Experimental)",
  "m3-41": "🪞 Véu contra Olhos de Vidro (Experimental)",
  "m3-55": "🛡️ Casca contra Projéteis (Experimental)",
  "m3-57": "✨ Onda do Pensamento Partido (Experimental)",
  "m3-60": "🕯️ Última Centelha do Casulo",
  "m3-73": "🕸️ Convocar Guardião de Quitina (Experimental)",
  "m1-6": "🛡️ Casca do Inverno Profundo",
  "m1-7": "🕸️ Tentáculos do Vazio-Raiz",
  "m1-59": "✨ Sementes Erráticas de Cristal",
  "m1-81": "✨ Infusão Cáustica da Vespa",
  "m1-82": "🎵 Riso Desconcertante dos Grilos",
  "m1-83": "🕸️ Disco de Carga do Orvalho",
  "m2-1": "✨ Rajada Incandescente de Resina",
  "m2-46": "🎵 Moeda-Lume do Trapaceiro",
  "m2-55": "🌀 Punho de Terra Enraizada",
  "m2-63": "🪞 Travessura do Pólen Feérico",
  "m2-64": "🪞 Travessura Experimental do Pólen",
  "m2-65": "🪞 Aura de Seiva Enganadora",
  "m2-80": "✨ Enxame de Granizo-Semente",
  "m2-88": "🎵 Chicote Mental da Cigarra",
  "m3-4": "🌀 Passo da Salamandra de Brasa",
  "m3-31": "🕸️ Torre de Casca Súbita",
  "m3-37": "🕸️ Fome do Vazio-Raiz",
  "m3-42": "✨ Abrigo Breve de Folhas",
  "m4-9": "🕸️ Convocar Predador do Subsolo (Experimental)",
  "m4-10": "🕸️ Convocar Oráculo Mecânico (Experimental)",
  "m4-12": "🕸️ Convocar Sombra do Subsolo (Experimental)",
  "m4-19": "🎵 Ferrão do Ego (Experimental)",
  "m4-26": "🕸️ Correio Veloz da Libélula",
  "m4-36": "🕸️ Baú Oculto do Micélio",
  "m4-38": "🕸️ Cão-Vigia de Esporos",
  "m4-39": "🛡️ Refúgio Privado da Colônia",
  "m4-40": "✨ Esfera Resiliente de Resina",
  "m4-43": "🎵 Lança Psíquica da Vespa-Oráculo",
  "m4-44": "🎵 Lança Psíquica Experimental da Vespa-Oráculo",
  "m4-48": "🕯️ Eco do Último Casulo (Experimental)",
  "m4-57": "🎵 Pulso Sincrônico do Enxame (Experimental)",
  "m4-58": "🌀 Passagem Oculta da Relíquia (Experimental)",
  "m5-5": "✨ Mão Colossal da Seiva",
  "m5-14": "🕸️ Convocar Caçador Alado (Experimental)",
  "m5-9": "👁️ Conselho das Ruas-Raiz (Experimental)",
  "m5-50": "🌀 Silenciar Engrenagens (Experimental)",
  "m5-55": "🕸️ Convocar Espírito de Escamas (Experimental)",
  "m5-46": "👁️ Rede Telepática do Micélio",
  "m6-11": "🕸️ Chamado Instantâneo do Fio",
  "m6-15": "🛡️ Escudo de Quitina Solar",
  "m6-16": "🛡️ Escudo Experimental de Quitina Solar",
  "m6-33": "🌀 Forma do Jardim Distante (Experimental)",
  "m6-39": "🎵 Colapso da Mente-Colmeia (Experimental)",
  "m6-34": "✨ Esfera Congelante do Orvalho",
  "m6-35": "🎵 Dança Irresistível das Antenas",
  "m6-44": "🌀 Forma do Outro Jardim",
  "m6-45": "🌀 Metamorfose do Casulo Bélico",
  "m7-2": "🕸️ Convocar Colosso do Brejo (Experimental)",
  "m7-8": "🌀 Metamorfose do Lagarto-Titã (Experimental)",
  "m7-15": "🕸️ Palácio Vivo da Colônia",
  "m7-16": "✨ Lâmina Autônoma de Cristal",
  "m7-22": "🕯️ Retorno do Casulo Ancestral",
  "m8-1": "🕯️ Murcha Horrenda do Brejo"
};

const classNames = {
  barbaro: "Casca-Fera", bardo: "Cantor de Ecos", clerigo: "Guardião do Orvalho",
  druida: "Metamorfo do Jardim", feiticeiro: "Nascido da Seiva",
  guerreiro: "Lâmina da Colônia", ladino: "Sombra de Folha", mago: "Tecelão",
  monge: "Discípulo do Casulo", paladino: "Juramentado da Colmeia",
  patrulheiro: "Batedor do Jardim", bruxo: "Pactário do Subsolo"
};

function stripIcon(value = "") {
  return value.replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "").trim();
}

const spellSource = await readFile(spellFile, "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(spellSource, context);
const spells = context.CODEX_SPELL_DATA;
let srdText = "";
try {
  srdText = (await readFile(new URL("tmp/pdfs/SRD_CC_v5.2.txt", root), "utf8"))
    .normalize("NFKC").replaceAll("’", "'").toLocaleLowerCase("en");
} catch {}
const formerReferences = new Map();
for (const spell of spells) {
  const oldReference = String(spell.reference || "");
  if (oldReference && oldReference !== spell.key) formerReferences.set(oldReference, spell.key);
  const next = spellNames[spell.key];
  if (next) {
    const oldPlain = stripIcon(spell.title);
    const newPlain = stripIcon(next);
    spell.title = next;
    for (const field of ["description", "effect"]) {
      if (typeof spell[field] === "string") spell[field] = spell[field].split(oldPlain).join(newPlain);
    }
    spell.microcosmoContent = true;
  }
  const wasExperimental = spell.provenance === "microcosmo-original-rewrite" || /\(UA\)/i.test(oldReference) || /\(Experimental\)/i.test(spell.title);
  const cleanReference = oldReference.replace(/\s*\(UA\)\s*$/i, "").replaceAll("’", "'").toLocaleLowerCase("en");
  const isSrd = spell.provenance === "srd-5.2.1-cc-by-4.0" || Boolean(oldReference !== spell.key && srdText && cleanReference && srdText.includes(cleanReference));
  spell.reference = spell.key;
  spell.provenance = wasExperimental ? "microcosmo-original-rewrite" : isSrd ? "srd-5.2.1-cc-by-4.0" : "microcosmo-adapted-review";
  spell.license = isSrd && !wasExperimental ? "CC-BY-4.0" : "Microcosmo";
  spell.sourceCatalog = wasExperimental ? "Microcosmo Experimental" : isSrd ? "SRD 5.2.1" : "Microcosmo";
  delete spell.legacyReferenceInternal;
}
await writeFile(spellFile, `globalThis.CODEX_SPELL_DATA = ${JSON.stringify(spells, null, 2)};\n`, "utf8");

for (const file of runtimeFiles) {
  const target = new URL(`codex-revisao/${file}`, root);
  let source = await readFile(target, "utf8");
  for (const [reference, key] of formerReferences) source = source.split(JSON.stringify(reference)).join(JSON.stringify(key));
  await writeFile(target, source, "utf8");
}

const indexSource = await readFile(indexFile, "utf8");
const index = JSON.parse(indexSource.trim().slice("const GRIMOIRE_SPELL_INDEX=".length, -1));
for (const spell of index) if (spellNames[spell.key]) spell.title = spellNames[spell.key];
await writeFile(indexFile, `const GRIMOIRE_SPELL_INDEX=${JSON.stringify(index)};\n`, "utf8");

let gameSource = await readFile(gameFile, "utf8");
for (const [id, name] of Object.entries(classNames)) {
  const pattern = new RegExp(`(${id}:\\{name:)\"[^\"]+\"`);
  gameSource = gameSource.replace(pattern, `$1${JSON.stringify(name)}`);
}
await writeFile(gameFile, gameSource, "utf8");

let classPage = await readFile(classPageFile, "utf8");
const visibleClassNames = {
  "Bárbaro": "Casca-Fera", "Bardo": "Cantor de Ecos", "Clérigo": "Guardião do Orvalho",
  "Druida": "Metamorfo do Jardim", "Feiticeiro": "Nascido da Seiva",
  "Guerreiro": "Lâmina da Colônia", "Ladino": "Sombra de Folha", "Mago": "Tecelão",
  "Monge": "Discípulo do Casulo", "Paladino": "Juramentado da Colmeia",
  "Patrulheiro": "Batedor do Jardim", "Bruxo": "Pactário do Subsolo"
};
for (const [oldName, newName] of Object.entries(visibleClassNames)) {
  classPage = classPage.replace(new RegExp(`\\b${oldName}\\b`, "g"), newName);
}
await writeFile(classPageFile, classPage, "utf8");

console.log(JSON.stringify({ renamedSpells: Object.keys(spellNames).length, renamedClasses: Object.keys(classNames).length }, null, 2));
