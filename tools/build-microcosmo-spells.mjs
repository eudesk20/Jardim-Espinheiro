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
const MATERIAL_NAMES={
  gota_orvalho:"Orvalho Purificado",sementes_mistas:"Sementes Nutritivas",folha_serena:"Folha Serena",fungo_bioluminescente:"Fungo Bioluminescente",brasa_semente:"Semente de Brasa",esporos_mutaveis:"Esporos Mutáveis",geleia_revigorante:"Seiva Revigorante",fio_cobre:"Fio Fino de Cobre",seda_aranha:"Fio de Seda de Aranha",resina_endurecida:"Resina Endurecida",lente_vidro:"Lente de Vidro",bateria_gigante:"Fragmento de Bateria",perola_orvalho:"Pérola de Orvalho Puríssimo",casca_mineral:"Casca Mineral Translúcida",nectar_luminoso:"Néctar Luminoso",carvao_po:"Carvão em Pó",casca_ressoante:"Casca Oca Ressoante",sal_cristalino:"Sal Cristalino",incenso_raiz:"Incenso de Raiz",cristal_condutor:"Cristal de Orvalho Condutor",polen_estelar:"Núcleo de Pólen Estelar",micelio_memoria:"Micélio de Memória",ambar_tempestade:"Âmbar de Tempestade Presa",po_carapaca:"Pó de Carapaça Ancestral",feromonio_ressonante:"Feromônio Ressonante",po_espelho:"Pó de Espelho de Orvalho",seiva_limiar:"Seiva do Limiar",esporo_toxico:"Esporo Tóxico Concentrado",areia_instante:"Areia do Instante"
};
function materialIdsFor(item){
  if(!item.components.includes("M"))return [];
  const n=item.reference.toLowerCase();
  if(/time|temporal|foresight|contingency|fortune/.test(n))return ["areia_instante","ambar_tempestade"];
  if(/gate|teleport|dimension|plane|demiplane|ethereal|passwall|rope trick|arcane gate/.test(n))return ["seiva_limiar","cristal_condutor"];
  if(/dead|undead|death|necrom|reviv|resurrect|clone|soul|vampir|life transfer|harm/.test(n))return ["po_carapaca","incenso_raiz"];
  if(/charm|suggestion|command|friend|dominat|emotion|enth?rall|geas|mind|psychic|fear|dream/.test(n))return ["feromonio_ressonante","folha_serena"];
  if(/illusion|image|invis|mirror|blur|disguise|seeming|mirage|shadow/.test(n))return ["po_espelho","lente_vidro"];
  if(/poison|acid|toxic|sickness|contagion|cloudkill|stinking|wither|blight/.test(n))return ["esporo_toxico","esporos_mutaveis"];
  if(/fire|flame|burn|scorch|heat|immolat|bonfire|meteor|sun|radiance|light/.test(n))return ["brasa_semente","carvao_po"];
  if(/lightning|thunder|shocking|storm|static|chain/.test(n))return ["fio_cobre","cristal_condutor"];
  if(/water|frost|cold|ice|sleet|snow|rime|tidal|tsunami/.test(n))return ["gota_orvalho","perola_orvalho"];
  if(/plant|thorn|vine|druid|animal|beast|insect|spore|wood|bark|tree|earth/.test(n))return ["sementes_mistas","resina_endurecida"];
  if(/sound|word|message|whisper|thunder|mockery|song|speech/.test(n))return ["casca_ressoante","nectar_luminoso"];
  return ({Abjuration:["sal_cristalino","casca_mineral"],Conjuration:["seda_aranha","resina_endurecida"],Divination:["lente_vidro","incenso_raiz"],Enchantment:["feromonio_ressonante","folha_serena"],Evocation:["cristal_condutor","nectar_luminoso"],Illusion:["po_espelho","lente_vidro"],Necromancy:["po_carapaca","incenso_raiz"],Transmutation:["esporos_mutaveis","casca_mineral"]}[item.school]||["resina_endurecida"]);
}
function materialIsConsumed(item){return /reviv|resurrect|raise dead|clone|awaken|heroes' feast|hallow|glyph|magic circle|simulacrum|imprisonment|true resurrection|astral projection/i.test(item.reference)}
function conjurationText(item,ids){
  const parts=item.components.split(",").map(value=>value.trim()),steps=[];
  if(parts.includes("V"))steps.push("V: fórmula, palavra ou vibração de ativação");
  if(parts.includes("S"))steps.push("S: gesto que orienta e dá forma à manifestação");
  if(!item.components.includes("M"))return `${steps.join(". ")}. Nenhum componente material é necessário.`;
  const names=ids.map(id=>MATERIAL_NAMES[id]||id),list=names.length>1?`${names.slice(0,-1).join(", ")} e ${names.at(-1)}`:names[0];
  steps.push(`M: ${list}`);return `${steps.join(". ")}. Material: ${materialIsConsumed(item)?"consumível e gasto ao concluir a conjuração":"reutilizável, desde que permaneça inteiro"}. Componentes com preço indicado não podem ser substituídos pela Bolsa ou por foco.`;
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
  if(/heal|cure|restoration|reviv|resurrection|regenerate|spare the dying|goodberry|aid|vitality/.test(n))return `${name} reúne seiva vital, calor e memória corporal para restaurar ou preservar uma ou mais criaturas. A energia procura primeiro ferimentos recentes e condições compatíveis; efeitos permanentes ou morte exigem os materiais especiais indicados. Alvos fora do alcance ou que não possam receber cura não são afetados.`;
  if(/summon|conjure|create|animate|familiar|servant|steed|homunculus|magen/.test(n))return `${name} manifesta, desperta ou convoca uma presença compatível com o Jardim. A criatura ou construção surge em espaço livre da área, age de acordo com os comandos permitidos e desaparece ou se desfaz ao término da duração. Perder Concentração encerra imediatamente manifestações sustentadas.`;
  if(/wall|barrier|cage|prison|shield|ward|armor|aura|sanctuary|protection|invulnerability|antimagic/.test(n))return `${name} organiza matéria e energia em uma proteção, limite ou campo mágico. A barreira ocupa a área indicada e interfere apenas nos efeitos descritos por sua manifestação, sem atravessar cobertura total. Quando exige Concentração, qualquer ruptura encerra toda a estrutura ao mesmo tempo.`;
  if(/detect|see|vision|clair|scry|foresight|identify|legend lore|commune|contact|telepathy|message|sending|tongues|speak/.test(n))return `${name} amplia sentidos, conhecimento ou comunicação através dos ecos preservados no Jardim. O conjurador recebe informações ligadas ao alvo e ao alcance, mas não ultrapassa proteções específicas contra adivinhação. Respostas simbólicas, memórias incompletas e interferências podem exigir interpretação.`;
  if(/charm|dominate|suggestion|command|fear|confusion|mockery|laughter|madness|sleep|stun|pain|kill|feeble|mind|psychic/.test(n))return `${name} impõe uma frequência sobre pensamento, emoção ou vontade. Criaturas afetadas enfrentam a Salvaguarda apropriada; em sucesso, evitam ou reduzem o efeito conforme a magia. Ordens autodestrutivas, imunidades mentais e ausência de percepção do estímulo podem impedir a manifestação.`;
  if(/teleport|gate|door|step|stride|walk|fly|levitate|jump|haste|slow|scatter|plane shift|ethereal|passwall/.test(n))return `${name} dobra distância, peso ou ritmo para alterar deslocamento e posição. O destino precisa respeitar as condições da magia e oferecer espaço livre; uma chegada impossível conduz ao ponto seguro mais próximo ou faz a manifestação falhar. Passagens sustentadas terminam quando a Concentração é perdida.`;
  if(/illusion|image|invisibility|disguise|seeming|mirage|dream|darkness|blur|phantom/.test(n))return `${name} reorganiza luz, som, cheiro e expectativa para criar uma percepção falsa ou ocultar presenças. Contato direto, investigação cuidadosa ou sentidos especiais podem revelar inconsistências. Descobrir a ilusão não a dissipa automaticamente, mas permite reconhecê-la pelo restante da duração.`;
  if(/transmut|shape|polymorph|enlarge|reduce|awaken|stone|water|earth|flame|weather|wind|plant growth|barkskin/.test(n))return `${name} transforma matéria, corpo ou ambiente na escala do Pequeno Mundo. A forma resultante conserva apenas as capacidades explicitamente permitidas e retorna ao estado original quando a duração termina. Objetos vestidos ou carregados acompanham a transformação somente quando a magia permitir.`;
  if(/bolt|blast|ball|storm|ray|spray|wave|touch|strike|smite|blade|arrow|whip|cloud|sphere|meteor|lightning|thunder|fire|cold|frost|acid|poison|radiance|sun|harm|disintegrate/.test(n))return `${name} concentra energia e a libera contra o alvo ou área indicada. Um ataque mágico ou Salvaguarda determina quem é atingido; cobertura, resistência e imunidade continuam aplicáveis. Efeitos persistentes exigem Concentração e afetam novamente apenas nas condições descritas pela manifestação.`;
  return `${name} canaliza uma manifestação de ${spell.school.toLowerCase()} adaptada à escala do Microcosmo. O conjurador escolhe alvos válidos dentro do alcance, respeita cobertura e sustenta Concentração quando indicada. Interferências que impeçam componentes verbais, somáticos ou materiais fazem a conjuração falhar antes de consumir o espaço de magia.`;
}

function parseTables(html) {
  const tables=[...html.matchAll(/<table[^>]*class="wiki-content-table"[^>]*>([\s\S]*?)<\/table>/gi)].map(m=>m[1]);
  return tables.flatMap((table,level)=>[...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1).map((row,index)=>{
    const cells=[...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>clean(m[1]));
    if(cells.length<6)return null;
    const schoolRaw=cells[1],school=Object.keys(SCHOOL).find(x=>schoolRaw.startsWith(x))||schoolRaw.replace(/\s+(D|DG|DC|T)$/,''),path=row[1].match(/href="(\/spell:[^"]+)"/i)?.[1]||`/spell:${slug(cells[0].replace(/\s*\(UA\)$/,""))}`;
    return {key:level===0?`truques-${index+1}`:`m${level}-${index+1}`,reference:cells[0],pagePath:path,level,school,flags:schoolRaw.slice(school.length).trim(),castRaw:cells[2],rangeRaw:cells[3],durationRaw:cells[4],components:cells[5]};
  }).filter(Boolean));
}
const SAVE_NAMES={Strength:"FOR",Dexterity:"DES",Constitution:"CON",Intelligence:"INT",Wisdom:"SAB",Charisma:"CAR"};
const DAMAGE_NAMES={acid:"Ácido",bludgeoning:"Concussão",cold:"Frio",fire:"Fogo",force:"Força",lightning:"Relâmpago",necrotic:"Necrótico",piercing:"Perfurante",poison:"Veneno",psychic:"Psíquico",radiant:"Radiante",slashing:"Cortante",thunder:"Trovão"};
function firstDice(text){return text.match(/\b\d+d\d+(?:\s*\+\s*(?:\d+|your spellcasting ability modifier|your spellcasting modifier))?/i)?.[0]?.replace(/your spellcasting ability modifier|your spellcasting modifier/i,"Mod. Conjuração")||""}
function damageFacts(text){const types=Object.keys(DAMAGE_NAMES).join("|"),pairs=[...text.matchAll(new RegExp(`(\\d+d\\d+(?:\\s*\\+\\s*\\d+)?)\\s+(${types}) damage`,"gi"))].map(match=>({dice:match[1],type:DAMAGE_NAMES[match[2].toLowerCase()]})),unique=[];for(const pair of pairs)if(!unique.some(item=>item.dice===pair.dice&&item.type===pair.type))unique.push(pair);return unique}
function healingFact(text){const sentence=text.match(/[^.!?]*(?:regain|restores?|heals?)[^.!?]*hit points?[^.!?]*/i)?.[0]||"";return firstDice(sentence)||sentence.match(/\b\d+\s+hit points?/i)?.[0]?.replace(/\s+hit points?/i,"")||""}
function metricShape(text){const match=text.match(/(\d[\d,]*)[- ]foot[- ](radius|cone|line|cube|sphere|cylinder|square)/i);if(!match)return "";const meters=Math.round(Number(match[1].replace(",",""))*.3*10)/10,names={radius:"raio",cone:"cone",line:"linha",cube:"cubo",sphere:"esfera",cylinder:"cilindro",square:"quadrado"};return `${names[match[2].toLowerCase()]} de ${meters} m`}
function parseMechanics(html,item){
  const start=html.indexOf('id="page-content"'),end=html.indexOf('<div class="page-tags"',start);const content=html.slice(start,end>start?end:undefined);
  const paragraphs=[...content.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(match=>clean(match[1])),body=paragraphs.filter(text=>!/^Source:|cantrip$|level|^Casting Time:|^Spell Lists\./i.test(text)).join(" ");
  const higher=paragraphs.find(text=>/^At Higher Levels\./i.test(text))||"",saveName=Object.keys(SAVE_NAMES).find(name=>new RegExp(`${name} saving throw`,`i`).test(body)),attack=/make (?:a|one|up to \w+) (?:ranged|melee) spell attack/i.test(body),pairs=damageFacts(body),damage=pairs.map(pair=>`${pair.dice} ${pair.type}`).join(" + "),healing=healingFact(body),damageType=[...new Set(pairs.map(pair=>pair.type))].join(" + "),shape=metricShape(item.rangeRaw)||metricShape(body);let area=shape?`${shape}${/self/i.test(item.rangeRaw)?" a partir do conjurador":""}`:areaFrom(translateRange(item.rangeRaw));
  if(/choose one creature[^.]+or choose two creatures/i.test(body))area=`1 criatura, ou 2 criaturas separadas por até 1,5 m, dentro de ${translateRange(item.rangeRaw)}`;else {const targets=body.match(/up to (\w+) creatures?/i);if(targets)area=`Até ${targets[1]} criaturas dentro de ${translateRange(item.rangeRaw)}`}
  let higherLevels="";
  if(item.level===0&&/5th level/i.test(higher)){const die=damage.match(/d\d+/)?.[0]||"dado";higherLevels=`No 5º nível, use 2${die}; no 11º, 3${die}; no 17º, 4${die}.`}
  else {const increase=higher.match(/increases? by (\d+d\d+|one die|\d+) for each slot level above/i),extraRay=/one additional ray for each slot level above/i.test(higher),extraTarget=/one additional (?:creature|target) for each slot level above/i.test(higher);if(increase)higherLevels=`Ao usar um espaço superior, aumente o efeito em ${increase[1].replace(/one die/i,"um dado")} por círculo acima do nível-base.`;else if(extraRay)higherLevels="Ao usar um espaço superior, crie um raio adicional por círculo acima do nível-base.";else if(extraTarget)higherLevels="Ao usar um espaço superior, escolha um alvo adicional por círculo acima do nível-base.";else if(higher)higherLevels="Ao usar um espaço superior, amplie os alvos, a duração ou o efeito conforme a progressão específica desta magia."}
  const result=[];if(attack)result.push("Faça um ataque mágico contra cada alvo indicado");if(saveName)result.push(`o alvo realiza Salvaguarda de ${SAVE_NAMES[saveName]}`);if(damage)result.push(`na falha ou acerto, aplique ${damage} de dano`);if(healing)result.push(`a recuperação usa ${healing} pontos de vida`);
  return {area,damage:healing?"":damage,healing,damageType,save:saveName?SAVE_NAMES[saveName]:"",attack,mechanics:result.length?`${result.join("; ")}.`:"Resolva o efeito conforme os alvos e condições descritos.",higherLevels};
}
async function loadMechanics(spells){
  const cacheUrl=new URL("spell-mechanics-cache.json",import.meta.url),version=3;let cache={};try{cache=JSON.parse(await readFile(cacheUrl,"utf8"));if(cache.__version===2){for(const [key,value] of Object.entries(cache))if(key!=="__version"&&value?.damage)value.damageType=Object.values(DAMAGE_NAMES).filter(type=>value.damage.includes(type)).join(" + ");cache.__version=version}else if(cache.__version!==version)cache={__version:version}}catch{cache={__version:version}}
  const missing=spells.filter(spell=>!cache[spell.reference]);
  for(let index=0;index<missing.length;index+=16){const batch=missing.slice(index,index+16);await Promise.all(batch.map(async spell=>{try{const html=await fetch(`https://dnd5e.wikidot.com${spell.pagePath}`).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.text()});cache[spell.reference]=parseMechanics(html,spell)}catch{cache[spell.reference]={area:areaFrom(translateRange(spell.rangeRaw)),damage:"",healing:"",damageType:"",save:"",attack:false,mechanics:"Resolva o efeito conforme os alvos e condições descritos.",higherLevels:""}}}));console.log(`Mecânicas preparadas: ${Math.min(index+batch.length,missing.length)}/${missing.length}`)}
  await writeFile(cacheUrl,JSON.stringify(cache,null,2)+"\n","utf8");return cache;
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
const classes=await classAssignments(),translations=await translateTitles(raw.map(x=>x.reference)),mechanics=await loadMechanics(raw);
const spells=raw.map(item=>{
  const displayName=thematicName(translations[item.reference],item.reference),schoolData=SCHOOL[item.school]||[item.school,"✨ Manifestação"];
  const range=translateRange(item.rangeRaw),spell={...item,displayName,range,school:schoolData[0]},materialIds=materialIdsFor(item),rule=mechanics[item.reference]||{};
  return {key:item.key,title:`${ICON[item.school]||"✨"} ${displayName}`,reference:item.reference,level:item.level,kind:"completa",status:"teste",classes:[...(classes.get(slug(item.reference))||[])],school:schoolData[0],source:schoolData[0],manifestation:schoolData[1],cast:translateTime(item.castRaw),range,duration:translateDuration(item.durationRaw),components:item.components,area:rule.area||areaFrom(range),materialIds,conjuration:conjurationText(item,materialIds),effect:`${effectFor(spell)} ${rule.mechanics||""}`.trim(),limitation:"A magia respeita cobertura, Concentração, imunidades e requisitos de alvo indicados.",damage:rule.damage||"",healing:rule.healing||"",damageType:rule.damageType||"",attack:!!rule.attack,save:rule.save||"",higherLevels:rule.higherLevels||"",flags:item.flags};
});
const index=spells.map(({key,title,level,kind,classes})=>({key,title,level,kind,classes}));
await writeFile(new URL("codex-revisao/spell-data.js",ROOT),`globalThis.CODEX_SPELL_DATA = ${JSON.stringify(spells,null,2)};\n`,`utf8`);
await writeFile(new URL("codex-revisao/grimorio-index.js",ROOT),`const GRIMOIRE_SPELL_INDEX=${JSON.stringify(index)};\n`,`utf8`);
console.log(JSON.stringify({total:spells.length,levels:Object.fromEntries([...Array(10)].map((_,level)=>[level,spells.filter(s=>s.level===level).length])),withoutClasses:spells.filter(s=>!s.classes.length).map(s=>s.reference)},null,2));
