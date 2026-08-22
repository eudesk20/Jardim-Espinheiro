import { readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const LIST_URL = "https://dnd5e.wikidot.com/spells";
const CLASS_PAGES = {
  bardo: "bard", clerigo: "cleric", druida: "druid", feiticeiro: "sorcerer",
  mago: "wizard", paladino: "paladin", patrulheiro: "ranger", bruxo: "warlock"
};
const SCHOOL = {
  Abjuration: ["Abjuração", "🛡️ Proteção"], Conjuration: ["Conjuração", "🕸️ Manifestação"],
  Divination: ["Adivinhação", "👁️ Presságio"], Enchantment: ["Encantamento", "🎵 Ressonância"],
  Evocation: ["Evocação", "✨ Emissão"], Illusion: ["Ilusão", "🪞 Miragem"],
  Necromancy: ["Necromancia", "🕯️ Eco Vital"], Transmutation: ["Transmutação", "🌀 Alteração"]
};
const ICON = { Abjuration:"🛡️",Conjuration:"🕸️",Divination:"👁️",Enchantment:"🎵",Evocation:"✨",Illusion:"🪞",Necromancy:"🕯️",Transmutation:"🌀" };

function clean(value="") {
  return value.replace(/<br\s*\/?\s*>/gi," ").replace(/<[^>]+>/g,"").replace(/&nbsp;|&#160;/g," ")
    .replace(/&amp;/g,"&").replace(/&#x27;|&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();
}
function slug(value="") { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
function translateRange(value) {
  return value.replace(/Self/gi,"Pessoal").replace(/Touch/gi,"Toque").replace(/Sight/gi,"À vista")
    .replace(/Unlimited/gi,"Ilimitado").replace(/(\d[\d,]*)\s*feet/gi,(_,n)=>`${Math.round(Number(n.replace(",",""))*.3*10)/10} m`)
    .replace(/(\d[\d,]*)\s*miles?/gi,(_,n)=>`${Math.round(Number(n.replace(",",""))*1.6*10)/10} km`)
    .replace(/foot radius/gi,"de raio").replace(/foot cone/gi,"em cone").replace(/foot line/gi,"em linha").replace(/foot cube/gi,"em cubo");
}
function translateTime(value) {
  return value.replace(/Bonus Action/gi,"Ação Bônus").replace(/Reaction/gi,"Reação").replace(/Action/gi,"Ação")
    .replace(/Minutes?/gi,"minuto").replace(/Hours?/gi,"hora").replace(/Special/gi,"Especial").replace(/\s+R$/," • Ritual");
}
function translateDuration(value) {
  return value.replace(/Concentration,?\s*/gi,"Concentração, ").replace(/up to/gi,"até").replace(/Instantaneous/gi,"Instantânea")
    .replace(/Until dispelled or triggered/gi,"Até ser dissipada ou ativada").replace(/Until dispelled/gi,"Até ser dissipada")
    .replace(/rounds?/gi,"rodada").replace(/minutes?/gi,"minuto").replace(/hours?/gi,"hora").replace(/days?/gi,"dias")
    .replace(/Special/gi,"Especial");
}
function areaFrom(range) {
  const match=range.match(/Pessoal\s*\((.+)\)/i);if(match)return match[1];
  if(/Toque/i.test(range))return "Criatura ou objeto tocado";
  if(/Pessoal/i.test(range))return "Conjurador";
  return `Alvo ou ponto dentro de ${range}`;
}
function thematicName(translated, original) {
  let name=(translated||original).replace(/Mago/gi,"Tecelão").replace(/Drag(ão|ões)/gi,"Titã")
    .replace(/Demon(íaco|íaca|íacos|íacas|io|ios)?/gi,"Predador Abissal").replace(/Celestial/gi,"Luminar")
    .replace(/Fogo/gi,"Brasa").replace(/Chama/gi,"Brasa").replace(/Água/gi,"Orvalho").replace(/Floresta/gi,"Jardim")
    .replace(/Ácido/gi,"de Seiva Ácida").replace(/Inseto/gi,"Criatura do Jardim");
  name=name.replace(/\s+/g," ").replace(/ de de /gi," de ").trim();
  return name || original;
}
function effectFor(spell) {
  const n=spell.reference.toLowerCase(),name=spell.displayName;
  if(/heal|cure|restoration|reviv|resurrection|regenerate|spare the dying|goodberry|aid|vitality/.test(n))return `${name} restaura ou preserva a força vital de uma ou mais criaturas, respeitando alcance e duração indicados.`;
  if(/summon|conjure|create|animate|familiar|servant|steed|homunculus|magen/.test(n))return `${name} manifesta, desperta ou convoca uma presença compatível com o Jardim, que segue as condições da conjuração.`;
  if(/wall|barrier|cage|prison|shield|ward|armor|aura|sanctuary|protection|invulnerability|antimagic/.test(n))return `${name} ergue uma proteção, limite ou campo mágico na área indicada, bloqueando ou reduzindo efeitos compatíveis.`;
  if(/detect|see|vision|clair|scry|foresight|identify|legend lore|commune|contact|telepathy|message|sending|tongues|speak/.test(n))return `${name} amplia sentidos, conhecimento ou comunicação por meio dos ecos do Jardim dentro do alcance indicado.`;
  if(/charm|dominate|suggestion|command|fear|confusion|mockery|laughter|madness|sleep|stun|pain|kill|feeble|mind|psychic/.test(n))return `${name} interfere na mente, emoção ou vontade dos alvos; criaturas resistentes enfrentam a Salvaguarda apropriada.`;
  if(/teleport|gate|door|step|stride|walk|fly|levitate|jump|haste|slow|scatter|plane shift|ethereal|passwall/.test(n))return `${name} altera deslocamento, posição ou passagem entre pontos, conforme alcance e duração da manifestação.`;
  if(/illusion|image|invisibility|disguise|seeming|mirage|dream|darkness|blur|phantom/.test(n))return `${name} cria uma percepção falsa ou oculta presenças; interação e investigação podem revelar a ilusão.`;
  if(/transmut|shape|polymorph|enlarge|reduce|awaken|stone|water|earth|flame|weather|wind|plant growth|barkskin/.test(n))return `${name} transforma matéria, corpo ou ambiente na escala do Pequeno Mundo durante o tempo indicado.`;
  if(/bolt|blast|ball|storm|ray|spray|wave|touch|strike|smite|blade|arrow|whip|cloud|sphere|meteor|lightning|thunder|fire|cold|frost|acid|poison|radiance|sun|harm|disintegrate/.test(n))return `${name} libera energia ofensiva contra o alvo ou área indicada, causando dano e efeitos associados à manifestação.`;
  return `${name} canaliza uma manifestação de ${spell.school.toLowerCase()} adaptada à escala e às matérias do Microcosmo.`;
}

function parseTables(html) {
  const tables=[...html.matchAll(/<table[^>]*class="wiki-content-table"[^>]*>([\s\S]*?)<\/table>/gi)].map(m=>m[1]);
  return tables.flatMap((table,level)=>[...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1).map((row,index)=>{
    const cells=[...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>clean(m[1]));
    if(cells.length<6)return null;
    const schoolRaw=cells[1],school=Object.keys(SCHOOL).find(x=>schoolRaw.startsWith(x))||schoolRaw.replace(/\s+(D|DG|DC|T)$/,'');
    return {key:level===0?`truques-${index+1}`:`m${level}-${index+1}`,reference:cells[0],level,school,flags:schoolRaw.slice(school.length).trim(),castRaw:cells[2],rangeRaw:cells[3],durationRaw:cells[4],components:cells[5]};
  }).filter(Boolean));
}
async function classAssignments() {
  const assignments=new Map();
  await Promise.all(Object.entries(CLASS_PAGES).map(async([id,page])=>{
    const html=await fetch(`https://dnd5e.wikidot.com/spells:${page}`).then(r=>{if(!r.ok)throw new Error(`${page}: ${r.status}`);return r.text()});
    for(const match of html.matchAll(/href="\/spell:([^"]+)"[^>]*>([^<]+)<\/a>/gi)){
      const key=slug(clean(match[2]));if(!assignments.has(key))assignments.set(key,new Set());assignments.get(key).add(id);
    }
  }));
  assignments.set(slug("Encode Thoughts"),new Set(["mago"]));
  assignments.set(slug("Arcane Weapon (UA)"),new Set(["mago"]));
  return assignments;
}
async function translateTitles(titles) {
  const cacheUrl=new URL("spell-title-translations.json",import.meta.url);let cache={};
  try{cache=JSON.parse(await readFile(cacheUrl,"utf8"))}catch{}
  const missing=titles.filter(x=>!cache[x]);
  for(let index=0;index<missing.length;index+=16){
    const batch=missing.slice(index,index+16);await Promise.all(batch.map(async title=>{
      const url=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(title)}&langpair=en|pt-BR`;
      try{const data=await fetch(url).then(r=>r.json());cache[title]=data?.responseData?.translatedText||title}catch{cache[title]=title}
    }));
    console.log(`Nomes preparados: ${Math.min(index+batch.length,missing.length)}/${missing.length}`);
  }
  await writeFile(cacheUrl,JSON.stringify(cache,null,2)+"\n","utf8");return cache;
}

const listHtml=await fetch(LIST_URL).then(r=>{if(!r.ok)throw new Error(`Lista: ${r.status}`);return r.text()});
let raw=parseTables(listHtml);
// A lista fechada do projeto inclui este Truque de Unearthed Arcana, hoje ausente da tabela geral da fonte.
if(!raw.some(spell=>spell.reference==="Hand of Radiance (UA)"))raw.push({reference:"Hand of Radiance (UA)",level:0,school:"Evocation",flags:"UA",castRaw:"1 Action",rangeRaw:"5 feet",durationRaw:"Instantaneous",components:"V, S"});
raw=raw.sort((a,b)=>a.level-b.level||a.reference.localeCompare(b.reference,"en")).map((spell,index,all)=>({...spell,key:spell.level===0?`truques-${all.slice(0,index).filter(x=>x.level===0).length+1}`:`m${spell.level}-${all.slice(0,index).filter(x=>x.level===spell.level).length+1}`}));
if(raw.length!==574){const counts=Object.fromEntries([...Array(10)].map((_,level)=>[level,raw.filter(s=>s.level===level).length]));throw new Error(`Esperadas 574 magias; encontradas ${raw.length}: ${JSON.stringify(counts)}.`)}
const classes=await classAssignments(),translations=await translateTitles(raw.map(x=>x.reference));
const spells=raw.map(item=>{
  const displayName=thematicName(translations[item.reference],item.reference),schoolData=SCHOOL[item.school]||[item.school,"✨ Manifestação"];
  const range=translateRange(item.rangeRaw),spell={...item,displayName,range,school:schoolData[0]};
  return {key:item.key,title:`${ICON[item.school]||"✨"} ${displayName}`,reference:item.reference,level:item.level,kind:"completa",status:"teste",classes:[...(classes.get(slug(item.reference))||[])],school:schoolData[0],source:schoolData[0],manifestation:schoolData[1],cast:translateTime(item.castRaw),range,duration:translateDuration(item.durationRaw),components:item.components,area:areaFrom(range),conjuration:item.components.includes("M")?"Bolsa de Componentes ou foco; componentes com preço ou consumo exigem o item específico.":"Nenhum.",effect:effectFor(spell),limitation:"Adaptação inicial em teste; custos especiais e números de dano serão confirmados na revisão da magia.",damage:"",attack:/bolt|ray|blade|arrow|whip|touch|strike/i.test(item.reference),save:"",flags:item.flags};
});
const index=spells.map(({key,title,level,kind,classes})=>({key,title,level,kind,classes}));
await writeFile(new URL("codex-revisao/spell-data.js",ROOT),`globalThis.CODEX_SPELL_DATA = ${JSON.stringify(spells,null,2)};\n`,`utf8`);
await writeFile(new URL("codex-revisao/grimorio-index.js",ROOT),`const GRIMOIRE_SPELL_INDEX=${JSON.stringify(index)};\n`,`utf8`);
console.log(JSON.stringify({total:spells.length,levels:Object.fromEntries([...Array(10)].map((_,level)=>[level,spells.filter(s=>s.level===level).length])),withoutClasses:spells.filter(s=>!s.classes.length).map(s=>s.reference)},null,2));
