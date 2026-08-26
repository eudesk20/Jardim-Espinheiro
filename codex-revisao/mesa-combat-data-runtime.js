/* MICROCOSMOS — Dados completos de combate para a Mesa.
   Problema 4: enriquece tokens vinculados com atributos, Salvaguardas, CD,
   Slots Mágicos e metadados completos de armas/magias para o executor.
   v1.2: preserva Tempo de Conjuração e metadados explícitos de Reação e cria
   um índice de Reações Especiais vindas do Grimório, Inventário e Habilidades. */
(async function(){
  if(globalThis.MICROCOSMOS_MESA_COMBAT_DATA)return;
  globalThis.MICROCOSMOS_MESA_COMBAT_DATA=true;
  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const SHEET_KEY="JE_INTEGRATED_123";
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;if(!Array.isArray(players))return;
  const mod=v=>Math.floor(((+v||10)-10)/2),prof=l=>2+Math.floor((Math.max(1,+l||1)-1)/4);
  let supabase=null,currentUserId="";
  function readLocal(){try{return JSON.parse(localStorage.getItem(SHEET_KEY)||"{}")||{}}catch{return {}}}
  function clone(v){try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v??null))}}
  function norm(v){return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
  function classCaster(data){return globalThis.MICROCOSMO_DATA?.classes?.[data.cls]?.caster||({bardo:"CAR",clerigo:"SAB",druida:"SAB",feiticeiro:"CAR",bruxo:"CAR",mago:"INT",paladino:"CAR",patrulheiro:"SAB",engenheiro:"INT"})[data.cls]||"INT"}
  function saveBonus(data,ability){const base=mod(data.stats?.[ability]),trained=(data.saves||[]).includes(ability);return base+(trained?prof(data.level):0)}
  function damageType(text){const t=String(text||"").toLowerCase();for(const [rx,type] of [[/ácido|acid/,"Ácido"],[/contund|concuss|bludge/,"Contundente"],[/frio|cold|gelo/,"Frio"],[/fogo|fire|brasa/,"Fogo"],[/força|force/,"Força"],[/necr/,"Necrótico"],[/perfur|pierc/,"Perfurante"],[/veneno|poison/,"Veneno"],[/psíqu|psych/,"Psíquico"],[/radiante|radiant/,"Radiante"],[/relâmp|lightning|elétr/,"Relâmpago"],[/cortante|slash/,"Cortante"],[/trovão|thunder/,"Trovão"]])if(rx.test(t))return type;return""}
  function weaponAbility(data,e){const fx=String(e.effect||"").toLowerCase();if(fx.includes("acuidade"))return mod(data.stats?.DES)>mod(data.stats?.FOR)?"DES":"FOR";return e.category==="distancia"?"DES":e.ability||"FOR"}
  function proficient(data,e){const list=data.weaponProficiencies||[],id=e.catalogId||"",tr=e.training||"simples",cat=e.category||"corpo";return list.includes("group:all")||list.includes(`group:${tr}`)||list.includes(`group:${cat}`)||list.includes(`group:${tr}-${cat}`)||(id&&list.includes(`weapon:${id}`))}
  function attackRange(e){const fx=String(e.effect||"");const m=fx.match(/(?:arremesso|munição)\s*(\d+(?:[,.]\d+)?)\s*\/\s*(\d+(?:[,.]\d+)?)\s*m/i);if(m)return{normal:+m[1].replace(",","."),long:+m[2].replace(",",".")};if(/alcance/i.test(fx))return{normal:3,long:3};return{normal:1.5,long:1.5}}
  function buildAttacks(data){return(data.equipment||[]).filter(e=>e.type==="arma").map(e=>{const a=weaponAbility(data,e),ab=mod(data.stats?.[a]),magic=+e.magic||0,bonus=ab+(proficient(data,e)?prof(data.level):0)+magic,damageBonus=ab+magic;return{name:e.name||"Ataque",bonus,damage:`${e.die||"1d4"}${damageBonus?(damageBonus>0?"+":"")+damageBonus:""}`,damageType:damageType(e.effect),range:attackRange(e),properties:e.effect||"",kind:"weapon",attack:true,catalogId:e.catalogId||""}})}
  function spellLevel(s){return +(s?.lvl??s?.level??s?.circle??0)||0}
  function spellTiming(s){return s?.cast||s?.castingTime||s?.activation||s?.time||s?.actionType||""}
  function buildSpells(data){
    const caster=classCaster(data),spellAttack=mod(data.stats?.[caster])+prof(data.level),spellDc=8+spellAttack;
    return(data.magic?.known||[]).map(s=>({
      name:s.name||"Magia",codexKey:s.codexKey||"",reference:s.reference||"",lvl:spellLevel(s),bonus:s.attack?spellAttack:0,spellDc,
      damage:s.damage||"",healing:s.healing||"",kind:s.healing?"cura":s.attack?"ataque":s.save?"salvaguarda":"efeito",attack:!!s.attack,
      save:s.save||"",saveFailure:s.saveFailure||"",saveSuccess:s.saveSuccess||"",range:s.range||"",area:s.area||"",shape:s.shape||"",target:s.target||"",
      damageType:s.damageType||damageType(`${s.damage||""} ${s.text||""} ${s.effect||""}`),text:s.text||s.description||"",effect:s.effect||"",limitation:s.limitation||"",higherLevels:s.higherLevels||"",
      components:s.comp||s.components||[],consumed:!!s.consumed,requiredMaterialCost:+(s.requiredMaterialCost||s.componentCost||0)||0,
      cast:spellTiming(s),castingTime:s.castingTime||s.cast||"",activation:s.activation||"",time:s.time||"",actionType:s.actionType||"",
      reaction:!!s.reaction,trigger:s.trigger||s.reactionTrigger||s.gatilho||"",reactionTrigger:s.reactionTrigger||s.trigger||s.gatilho||"",
      reactionEffect:s.reactionEffect||s.effectType||s.reaction_effect||"",reactionRange:s.reactionRange||s.reaction_range||"",reactionValue:s.reactionValue??s.reaction_value??null,
      sourceType:"spell"
    }))
  }
  const SKILL_ABILITIES={"Acrobacia":"DES","Adestrar Animais":"SAB","Arcanismo":"INT","Atletismo":"FOR","Atuação":"CAR","Enganação":"CAR","Furtividade":"DES","História":"INT","Intimidação":"CAR","Intuição":"SAB","Investigação":"INT","Medicina":"SAB","Natureza":"INT","Percepção":"SAB","Persuasão":"CAR","Prestidigitação":"DES","Religião":"INT","Sobrevivência":"SAB","Engenharia de Sucata":"INT","Instinto do Matagal":"SAB"};
  function buildSkills(data){const ranks=data.skillRanks||{};return Object.entries(SKILL_ABILITIES).map(([name,ability])=>{const rank=+(ranks[name]||0),bonus=mod(data.stats?.[ability])+prof(data.level)*rank;return{name,ability,rank,bonus}}).sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"))}
  function buildUsableItems(data){return(data.equipment||[]).map((item,index)=>({...clone(item),index})).filter(item=>{const type=String(item.type||"").toLowerCase(),text=`${item.name||""} ${item.effect||""}`.toLowerCase();return !["arma","armadura","escudo","material"].includes(type)&&(/poção|pocao|comida|ferramenta|kit|consum|usar|ativa|cura|recupera|bônus|bonus|reação|reacao/.test(text)||["item","consumivel","consumível","ferramenta","comida"].includes(type))})}

  function reactionMarked(x){
    if(!x||typeof x!=="object")return false;
    if(x.reaction===true||x.isReaction===true)return true;
    const timing=norm(`${x.activation||""} ${x.cast||""} ${x.castingTime||""} ${x.time||""} ${x.actionType||""} ${x.tipoAcao||""}`);
    if(/\breacao\b|\breaction\b/.test(timing))return true;
    const explicit=norm(`${x.reactionTrigger||""} ${x.trigger||""} ${x.gatilho||""}`);
    return !!explicit
  }
  function featurePools(data){
    const pools=[data.reactions,data.features,data.abilities,data.classFeatures,data.subclassFeatures,data.racialFeatures,data.feats,data.talents,data.knownFeatures,data.featuresKnown];
    return pools.flatMap(v=>Array.isArray(v)?v:[]).filter(v=>v&&typeof v==="object")
  }
  function reactionOption(raw,source,index){
    return{
      id:String(raw.id||raw.key||raw.codexKey||`${source}:${index}:${raw.name||raw.title||"reacao"}`),
      name:raw.name||raw.title||"Reação Especial",source,index,
      trigger:raw.reactionTrigger||raw.trigger||raw.gatilho||"",activation:raw.activation||raw.cast||raw.castingTime||raw.time||raw.actionType||"Reação",
      effectType:raw.reactionEffect||raw.effectType||raw.reaction_effect||"",range:raw.reactionRange||raw.reaction_range||raw.range||"",
      value:raw.reactionValue??raw.reaction_value??raw.value??null,text:raw.text||raw.description||raw.effect||"",
      target:raw.reactionTarget||raw.target||"",redirectTarget:raw.redirectTarget!==false,raw:clone(raw)
    }
  }
  function buildReactionOptions(data){
    const out=[];
    (data.magic?.known||[]).forEach((x,i)=>{if(reactionMarked(x))out.push(reactionOption(x,"spell",i))});
    (data.equipment||[]).forEach((x,i)=>{if(reactionMarked(x))out.push(reactionOption(x,"item",i))});
    featurePools(data).forEach((x,i)=>{if(reactionMarked(x))out.push(reactionOption(x,"ability",i))});
    return out
  }

  function applyData(token,data){
    if(!token||!data)return;
    const caster=classCaster(data),spellAttack=mod(data.stats?.[caster])+prof(data.level);
    if(Object.prototype.hasOwnProperty.call(data,"hpNow"))token.hp=Math.max(0,+data.hpNow||0);
    if(Object.prototype.hasOwnProperty.call(data,"hpMax"))token.hpMax=Math.max(0,+data.hpMax||0);
    token.stats={FOR:+data.stats?.FOR||10,DES:+data.stats?.DES||10,CON:+data.stats?.CON||10,INT:+data.stats?.INT||10,SAB:+data.stats?.SAB||10,CAR:+data.stats?.CAR||10};
    token.saveProficiencies=[...(data.saves||[])];token.saveBonuses=Object.fromEntries(["FOR","DES","CON","INT","SAB","CAR"].map(a=>[a,saveBonus(data,a)]));
    token.skills=buildSkills(data);token.usableItems=buildUsableItems(data);token.spellAbility=caster;token.spellAttack=spellAttack;token.spellDc=8+spellAttack;
    token.magicSlots=clone(data.magic?.slots||[]);const sizeProfile=data.sizeProfile||{};token.sizeBase=sizeProfile.base||data.baseSize||data.size||data.creatureSize||"Médio";token.size=sizeProfile.current||data.size||data.creatureSize||token.sizeBase||"Médio";token.sizeTemporary=!!sizeProfile.temporary;token.sizeSource=sizeProfile.currentSource||sizeProfile.baseSource||"Ficha";
    token.resistances=[...(data.resistances||[])];token.vulnerabilities=[...(data.vulnerabilities||[])];token.immunities=[...(data.immunities||[])];token.conditionImmunities=[...(data.conditionImmunities||[])];token.conditions=[...(data.conditions||[])];
    token.attacks=buildAttacks(data);token.spells=buildSpells(data);token.reactionOptions=buildReactionOptions(data);token.combatDataReady=true
  }
  async function connect(){try{const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");supabase=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});const {data:{session}}=await supabase.auth.getSession();currentUserId=session?.user?.id||""}catch(e){console.warn("MICROCOSMOS Mesa: dados completos online indisponíveis",e)}}
  async function refresh(){const rows=[];if(supabase&&currentUserId){const {data,error}=await supabase.from("characters").select("id,user_id,data");if(!error)rows.push(...(data||[]))}const local=readLocal();if(Object.keys(local).length){const own=players.find(p=>p.userId===currentUserId&&p.linked)||players.find(p=>p.linked&&String(p.characterId||"").startsWith("local-"));if(own)applyData(own,local)}for(const p of players.filter(x=>x.linked)){const row=rows.find(r=>String(r.id)===String(p.characterId))||rows.find(r=>String(r.user_id)===String(p.userId));if(row?.data)applyData(p,row.data)}try{const selectedId=document.querySelector("#tokenLayer .token.selected")?.dataset.token||"";globalThis.MICROCOSMOS_TABLE_API?.renderPlayers?.();globalThis.MICROCOSMOS_TABLE_API?.renderTokens?.();if(selectedId)globalThis.MICROCOSMOS_TABLE_API?.selectToken?.(selectedId)}catch(e){}return players}
  globalThis.MICROCOSMOS_TABLE_COMBAT_DATA={refresh,applyData,buildAttacks,buildSpells,buildSkills,buildUsableItems,buildReactionOptions};await connect();await refresh();window.addEventListener("storage",e=>{if(e.key===SHEET_KEY)refresh()});document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
})();
