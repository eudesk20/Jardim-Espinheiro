/* MICROCOSMOS — padronização dos nomes de Perícias entre Ficha e Mesa.
   A Mesa da Campanha usa a lista canônica abaixo. Este runtime migra as
   Proficiências antigas da Ficha para os mesmos nomes sem perder graduação.
*/
(function(){
  if(globalThis.MICROCOSMOS_SKILL_NAME_SYNC)return;
  globalThis.MICROCOSMOS_SKILL_NAME_SYNC=true;

  const SESSION_KEY="MICROCOSMOS_AUTH_DEMO_SESSION_V1";
  const user=()=>String(localStorage.getItem(SESSION_KEY)||"sem-login").toLowerCase();
  const storageKey=()=>`MICROCOSMOS_SKILLS_V1:${user()}`;
  const backupKey=()=>`MICROCOSMOS_SKILLS_LEGACY_BACKUP_V1:${user()}`;
  const clamp=v=>Math.min(2,Math.max(0,Number(v)||0));

  const CANONICAL=[
    ["Acrobacia","DES"],["Adestrar Animais","SAB"],["Arcanismo","INT"],["Atletismo","FOR"],
    ["Atuação","CAR"],["Enganação","CAR"],["Furtividade","DES"],["História","INT"],
    ["Intimidação","CAR"],["Intuição","SAB"],["Investigação","INT"],["Medicina","SAB"],
    ["Natureza","INT"],["Percepção","SAB"],["Persuasão","CAR"],["Prestidigitação","DES"],
    ["Religião","INT"],["Sobrevivência","SAB"],["Engenharia de Sucata","INT"],["Instinto do Matagal","SAB"]
  ];

  const LEGACY_TO_CANONICAL={
    "Atletismo de Carga":"Atletismo",
    "Acrobacia do Matagal":"Acrobacia",
    "Furtividade entre Folhas":"Furtividade",
    "Prestidigitação de Sucata":"Prestidigitação",
    "Sobrevivência Climática":"Sobrevivência",
    "Arcanismo do Jardim":"Arcanismo",
    "História do Jardim":"História",
    "Investigação de Sucata":"Investigação",
    "Natureza do Micromundo":"Natureza",
    "Intuição de Colônia":"Intuição",
    "Percepção do Matagal":"Percepção",
    "Medicina de Ervas":"Medicina",
    "Trato com Criaturas":"Adestrar Animais",
    "Sobrevivência do Jardim":"Sobrevivência",
    "Atuação Ressonante":"Atuação"
  };
  const LEGACY_ONLY=["Alquimia Natural"];

  function read(key){try{return JSON.parse(localStorage.getItem(key)||"{}")||{}}catch{return {}}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value||{}))}catch(_e){}}
  function migrate(source){
    const original={...(source||{})},next={...original};
    let changed=false;
    for(const [oldName,newName] of Object.entries(LEGACY_TO_CANONICAL)){
      if(!Object.prototype.hasOwnProperty.call(next,oldName))continue;
      const oldRank=clamp(next[oldName]),newRank=clamp(next[newName]);
      next[newName]=Math.max(oldRank,newRank);
      delete next[oldName];changed=true
    }
    for(const oldName of LEGACY_ONLY){
      if(!Object.prototype.hasOwnProperty.call(next,oldName))continue;
      const backup=read(backupKey());backup[oldName]=clamp(next[oldName]);write(backupKey(),backup);
      delete next[oldName];changed=true
    }
    return{next,changed,original}
  }

  function apply(){
    if(typeof state==="undefined")return false;
    const local=read(storageKey()),current=state.skillRanks&&typeof state.skillRanks==="object"?state.skillRanks:{};
    const merged={...local,...current},result=migrate(merged);
    const validNames=new Set(CANONICAL.map(([name])=>name));
    const cleaned={};
    for(const [name,rank] of Object.entries(result.next))if(validNames.has(name)&&clamp(rank)>0)cleaned[name]=clamp(rank);
    const changed=JSON.stringify(cleaned)!==JSON.stringify(current)||JSON.stringify(cleaned)!==JSON.stringify(local);
    if(!changed)return false;
    try{write(backupKey(),{...read(backupKey()),...result.original})}catch(_e){}
    state.skillRanks=cleaned;write(storageKey(),cleaned);
    try{if(typeof save==="function")save()}catch(_e){}
    try{if(typeof renderAttrs==="function")renderAttrs()}catch(_e){}
    return true
  }

  // Executa depois de skill-choice-runtime.js, que restaura a graduação salva.
  queueMicrotask(apply);
  setTimeout(apply,250);

  globalThis.MICROCOSMOS_SKILL_NAMES={
    version:1,
    canonical:CANONICAL.map(([name,ability])=>({name,ability})),
    legacyMap:{...LEGACY_TO_CANONICAL},
    migrate:apply
  };
})();
