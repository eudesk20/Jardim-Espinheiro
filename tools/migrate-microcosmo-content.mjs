import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const spellFile = new URL("codex-revisao/spell-data.js", root);
const indexFile = new URL("codex-revisao/grimorio-index.js", root);
const gameFile = new URL("codex-revisao/game-data.js", root);
const classPageFile = new URL("codex-revisao/classes-revisao.html", root);

const spellNames = {
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
  "m4-26": "🕸️ Correio Veloz da Libélula",
  "m4-36": "🕸️ Baú Oculto do Micélio",
  "m4-38": "🕸️ Cão-Vigia de Esporos",
  "m4-39": "🛡️ Refúgio Privado da Colônia",
  "m4-40": "✨ Esfera Resiliente de Resina",
  "m4-43": "🎵 Lança Psíquica da Vespa-Oráculo",
  "m4-44": "🎵 Lança Psíquica Experimental da Vespa-Oráculo",
  "m5-5": "✨ Mão Colossal da Seiva",
  "m5-14": "🕸️ Convocar Caçador Alado (Experimental)",
  "m5-46": "👁️ Rede Telepática do Micélio",
  "m6-11": "🕸️ Chamado Instantâneo do Fio",
  "m6-15": "🛡️ Escudo de Quitina Solar",
  "m6-16": "🛡️ Escudo Experimental de Quitina Solar",
  "m6-34": "✨ Esfera Congelante do Orvalho",
  "m6-35": "🎵 Dança Irresistível das Antenas",
  "m6-44": "🌀 Forma do Outro Jardim",
  "m6-45": "🌀 Metamorfose do Casulo Bélico",
  "m7-2": "🕸️ Convocar Colosso do Brejo (Experimental)",
  "m7-15": "🕸️ Palácio Vivo da Colônia",
  "m7-16": "✨ Lâmina Autônoma de Cristal",
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
for (const spell of spells) {
  const next = spellNames[spell.key];
  if (!next) continue;
  const oldPlain = stripIcon(spell.title);
  const newPlain = stripIcon(next);
  spell.title = next;
  for (const field of ["description", "effect"]) {
    if (typeof spell[field] === "string") spell[field] = spell[field].split(oldPlain).join(newPlain);
  }
  spell.microcosmoContent = true;
  spell.legacyReferenceInternal = true;
}
await writeFile(spellFile, `globalThis.CODEX_SPELL_DATA = ${JSON.stringify(spells, null, 2)};\n`, "utf8");

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
