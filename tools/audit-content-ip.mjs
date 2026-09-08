import { readFile, writeFile, readdir } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const codex = new URL("codex-revisao/", root);
const context = { console };
context.globalThis = context;
vm.createContext(context);
for (const file of ["race-data.js", "item-data.js", "creature-data-ipm.js", "spell-data.js", "game-data.js"]) {
  vm.runInContext(await readFile(new URL(file, codex), "utf8"), context, { filename: file });
}

const spells = context.CODEX_SPELL_DATA || [];
const classes = context.MICROCOSMO_DATA?.classes || {};
const races = context.CODEX_RACE_DATA || {};
const items = context.CODEX_ITEM_DATA || [];
const creatures = context.MICROCOSMOS_CREATURES_IPM || [];
const named = /(Bigby|Mordenkainen|Tenser|Tasha|Aganazzar|Abi-Dalzim|Otiluke|Otto|Drawmij|Jim|Hadar|Agathys|Raulothim|Fizban|Nathair|Rary|Leomund|Nystul|Snilloc|Maximilian|Galder|Kelemvor|Iggwilv|Ashardalon|Vrock|Hezrou|Barlgura|Knowbot)/i;
const experimental = spells.filter(item => /\(UA\)/i.test(item.reference || ""));
const namedReferences = spells.filter(item => named.test(item.reference || ""));
const renamed = spells.filter(item => item.microcosmoContent);
const duplicateTitles = [...spells.reduce((map, item) => {
  const key = String(item.title || "").toLocaleLowerCase("pt-BR");
  map.set(key, [...(map.get(key) || []), item.key]);
  return map;
}, new Map())].filter(([, keys]) => keys.length > 1);

const label = value => String(value?.name || value?.title || value?.id || value);
const lines = [
  "# Inventário editorial e de propriedade intelectual do Microcosmo",
  "",
  `Gerado em ${new Date().toISOString().slice(0, 10)}. Este documento é uma triagem editorial e técnica, não um parecer jurídico.`,
  "",
  "## Resultado executivo",
  "",
  `- Classes: ${Object.keys(classes).length}.`,
  `- Povos/raças: ${Object.keys(races).length}.`,
  `- Itens estruturados: ${items.length}.`,
  `- Criaturas IPM estruturadas: ${creatures.length}.`,
  `- Magias: ${spells.length}.`,
  `- Magias experimentais provenientes de UA: ${experimental.length} (alto risco; reescrita ou retirada antes de comercialização).`,
  `- Magias com nomes próprios ou criaturas reconhecíveis na referência interna: ${namedReferences.length}.`,
  `- Magias já renomeadas nesta migração: ${renamed.length}.`,
  `- Magias sem metadado individual de licença/procedência: ${spells.filter(item => !item.license && !item.provenance).length}.`,
  `- Títulos duplicados no catálogo: ${duplicateTitles.length}.`,
  "",
  "## Classificação por área",
  "",
  "| Área | Situação | Ação |",
  "|---|---|---|",
  "| Mesa, Atlas, grid, iluminação e interface | Código funcional próprio; baixo risco editorial | Manter e documentar autoria |",
  "| Criaturas IPM e povos do Microcosmo | Identidade temática própria | Manter; revisar apenas semelhanças pontuais |",
  "| Classes | IDs técnicos preservados; nomes públicos migrados para o vocabulário do Microcosmo | Reescrever progressões e características que ainda reproduzam estrutura externa |",
  "| Equipamentos | Predominantemente genéricos ou tematizados | Acrescentar procedência por item nas próximas revisões |",
  "| Grimório SRD | Pode ser usado com atribuição CC BY 4.0 | Confirmar item a item contra o SRD oficial e manter a atribuição |",
  "| Grimório UA/suplementos | Não há licença aberta presumida | Substituir nome, texto e expressão mecânica; renomear sozinho não basta |",
  "| Ferramentas de importação | Há consultas a Wikidot, 5etools e APIs comunitárias | Não usar como fonte editorial de uma versão comercial |",
  "| Imagens enviadas pelo usuário | Conteúdo externo não empacotado | Exibir aviso de responsabilidade no upload |",
  "",
  "## Medidas já aplicadas",
  "",
  "- IDs de classes e chaves de magia foram preservados para não quebrar fichas e automações.",
  "- Doze nomes públicos de classes foram convertidos para nomes próprios do Microcosmo; Bastião, Cozinheiro e Engenheiro já eram distintivos e foram mantidos.",
  `- ${renamed.length} magias com nomes próprios ou criaturas reconhecíveis receberam títulos do Microcosmo.`,
  "- Foi criado `CONTENT_ATTRIBUTION.md` com o crédito exigido para o conteúdo SRD.",
  "",
  "## Pendências que impedem declarar o catálogo totalmente original",
  "",
  "1. Classificar as 574 magias contra a lista oficial do SRD 5.2.1.",
  "2. Retirar ou reescrever integralmente as 50 entradas UA; trocar apenas o título não licencia texto ou mecânica expressiva.",
  "3. Substituir as referências inglesas internas por chaves neutras depois de converter as regras especiais que ainda consultam `reference`.",
  "4. Desativar o uso editorial dos importadores comunitários e manter apenas fontes oficiais/licenciadas.",
  "5. Fazer revisão humana de similaridade de descrições, progressões, listas de classe, talentos e equipamentos.",
  "",
  "## Apêndice A - Classes (inventário completo)", "",
  ...Object.entries(classes).map(([id, item]) => `- ${id}: ${item.name}`),
  "", "## Apêndice B - Povos/raças (inventário completo)", "",
  ...Object.entries(races).map(([id, item]) => `- ${id}: ${label(item)}`),
  "", "## Apêndice C - Itens (inventário completo)", "",
  ...items.map(item => `- ${item.id || "sem-id"}: ${label(item)}`),
  "", "## Apêndice D - Criaturas IPM (inventário completo)", "",
  ...creatures.map(item => `- ${item.id || "sem-id"}: ${label(item)}`),
  "", "## Apêndice E - Magias (inventário completo)", "",
  ...spells.map(item => {
    const flags = [/\(UA\)/i.test(item.reference || "") ? "experimental" : "", named.test(item.reference || "") ? "referência reconhecível" : "", item.microcosmoContent ? "nome migrado" : ""].filter(Boolean);
    return `- ${item.key}: ${item.title} — nível ${item.level}${flags.length ? ` — ${flags.join(", ")}` : ""}`;
  }),
  "", "## Apêndice F - Duplicidades", "",
  ...(duplicateTitles.length ? duplicateTitles.map(([title, keys]) => `- ${title}: ${keys.join(", ")}`) : ["- Nenhuma."]),
  ""
];

await writeFile(new URL("CONTENT_INVENTORY.md", root), lines.join("\n"), "utf8");
console.log(JSON.stringify({ classes: Object.keys(classes).length, races: Object.keys(races).length, items: items.length, creatures: creatures.length, spells: spells.length, experimental: experimental.length, namedReferences: namedReferences.length, renamed: renamed.length, duplicateTitles: duplicateTitles.length }, null, 2));
