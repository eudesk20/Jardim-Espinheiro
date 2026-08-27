/* MICROCOSMOS — Perícias Flexíveis v2.
   Regra oficial da ficha:
   - Perícia define O QUE o personagem sabe fazer.
   - Atributo define COMO ele tenta fazer naquele momento.
   - O atributo exibido junto da Perícia é apenas uma sugestão, nunca uma trava.
   - Proficiência / Especialização continuam pertencendo à Perícia e são somadas
     ao modificador do Atributo escolhido para aquela rolagem.

   Este runtime também preserva a escolha manual de proficiência já usada na ficha.
*/
(function(){
  if(globalThis.MICROCOSMOS_FLEXIBLE_SKILLS)return;

  const SESSION_KEY="MICROCOSMOS_AUTH_DEMO_SESSION_V1";
  const user=()=>String(localStorage.getItem(SESSION_KEY)||"sem-login").toLowerCase();
  const key=()=>`MICROCOSMOS_SKILLS_V1:${user()}`;
  const ATTRIBUTES=[
    {key:"FOR",label:"Força",icon:"💪",approach:"força física, impacto, carga ou imposição corporal"},
    {key:"DES",label:"Destreza",icon:"🪶",approach:"precisão, agilidade, coordenação ou delicadeza"},
    {key:"CON",label:"Constituição",icon:"🛡️",approach:"resistência, persistência ou esforço prolongado"},
    {key:"INT",label:"Inteligência",icon:"🧠",approach:"conhecimento, memória, lógica ou planejamento"},
    {key:"SAB",label:"Sabedoria",icon:"👁️",approach:"percepção, instinto, leitura do ambiente ou experiência"},
    {key:"CAR",label:"Carisma",icon:"✨",approach:"presença, influência, expressão ou liderança"}
  ];

  function read(){try{return JSON.parse(localStorage.getItem(key())||"{}")||{}}catch{return {}}}
  function write(value){try{localStorage.setItem(key(),JSON.stringify(value||{}))}catch(_e){}}
  function rankOf(name){try{return Math.min(2,Math.max(0,Number(state?.skillRanks?.[name])||0))}catch{return 0}}
  function profBonus(){try{return 2+Math.floor((Math.max(1,Number(state?.level)||1)-1)/4)}catch{return 2}}
  function abilityMod(key){try{return Math.floor(((Number(state?.stats?.[key])||10)-10)/2)}catch{return 0}}
  function format(value){return value>=0?`+${value}`:String(value)}
  function bonusFor(name,ability){return abilityMod(ability)+rankOf(name)*profBonus()}

  function skillInfo(name){
    try{
      for(const group of ATTRS||[]){
        for(const skill of group.skills||[]){
          if(String(skill[0])===String(name))return{name:skill[0],suggested:skill[1]||group.k};
        }
      }
    }catch(_e){}
    return{name:String(name||"Perícia"),suggested:"SAB"}
  }

  function restore(){
    if(typeof state==="undefined")return;
    state.skillRanks={...read()};
    if(typeof save==="function")save();
  }

  function setRank(name){
    if(typeof state==="undefined")return;
    const ranks={...(state.skillRanks||{})};
    ranks[name]=((Number(ranks[name])||0)+1)%3;
    if(ranks[name]===0)delete ranks[name];
    state.skillRanks=ranks;
    write(ranks);
    if(typeof save==="function")save();
    if(typeof renderAttrs==="function")renderAttrs();
  }
  globalThis.microCycleSkill=setRank;

  function ensureStyle(){
    if(document.getElementById("microFlexibleSkillStyle"))return;
    const style=document.createElement("style");
    style.id="microFlexibleSkillStyle";
    style.textContent=`
      #microFlexibleSkillNote{margin:7px 0 9px;padding:8px 10px;border:1px solid #9b8058;border-radius:9px;background:linear-gradient(120deg,#f4ead2,#fff8e8);color:#594733;font-size:.75rem;line-height:1.35}
      #microFlexibleSkillNote b{color:#51396b}#p1Attributes .skill .roll-name[data-flexible-skill]{position:relative}
      #p1Attributes .skill .roll-name[data-flexible-skill]:after{content:" ↔";color:#6a477d;font-weight:bold}
      #p1Attributes .skill .roll-name .micro-skill-suggested{color:#75634d;font-size:.68rem;font-weight:normal}
      #microFlexibleSkillModal .modal-card{width:min(680px,calc(100vw - 24px));max-height:min(82vh,760px);overflow:auto}
      .micro-flex-head{display:grid;gap:4px;margin-bottom:10px}.micro-flex-head h2{margin:0;color:#503868}.micro-flex-head p{margin:0;color:#75634d;line-height:1.45}
      .micro-flex-summary{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 12px}.micro-flex-chip{padding:4px 8px;border:1px solid #aa9270;border-radius:999px;background:#fff8e7;color:#56432f;font-size:.72rem}
      .micro-flex-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.micro-flex-ability{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;padding:10px;border:1px solid #a68d68;border-radius:10px;background:#fffaf0;color:#3d3024;text-align:left}
      .micro-flex-ability:hover{border-color:#76508d;background:#f7eefb}.micro-flex-ability.suggested{border-color:#8d6a39;box-shadow:inset 0 0 0 1px #d6b66e;background:#fff2cf}.micro-flex-icon{font-size:1.25rem}.micro-flex-copy{display:grid;gap:2px}.micro-flex-copy b{color:#4e3862}.micro-flex-copy small{color:#75634d;line-height:1.25}.micro-flex-total{font-size:1.05rem;color:#5d3e73}.micro-flex-foot{margin:10px 0 0;color:#75634d;font-size:.72rem;line-height:1.4}
      @media(max-width:600px){.micro-flex-grid{grid-template-columns:1fr}#microFlexibleSkillModal .modal-card{max-height:88vh}}
    `;
    document.head.appendChild(style);
  }

  function ensureModal(){
    ensureStyle();
    let modal=document.getElementById("microFlexibleSkillModal");
    if(modal)return modal;
    modal=document.createElement("div");
    modal.id="microFlexibleSkillModal";
    modal.className="modal";
    modal.innerHTML=`<div class="modal-card"><button type="button" class="btn danger" id="microFlexibleSkillClose" style="float:right">✕</button><div class="micro-flex-head"><small>PERÍCIA FLEXÍVEL</small><h2 id="microFlexibleSkillTitle">Perícia</h2><p>Descreva <b>como</b> seu personagem realiza a ação. Depois escolha o Atributo que melhor representa essa abordagem.</p></div><div class="micro-flex-summary" id="microFlexibleSkillSummary"></div><div class="micro-flex-grid" id="microFlexibleSkillGrid"></div><p class="micro-flex-foot">O maior Atributo não é automaticamente o correto: a combinação precisa fazer sentido com a descrição e com a situação. O Mestre pode pedir outra combinação quando a abordagem não justificar o Atributo escolhido.</p></div>`;
    modal.addEventListener("click",event=>{if(event.target===modal)modal.classList.remove("show")});
    document.body.appendChild(modal);
    document.getElementById("microFlexibleSkillClose").onclick=()=>modal.classList.remove("show");
    document.getElementById("microFlexibleSkillGrid").addEventListener("click",event=>{
      const button=event.target.closest("[data-flex-ability]");
      if(!button)return;
      const name=modal.dataset.skillName||"Perícia";
      rollFlexible(name,button.dataset.flexAbility);
    });
    return modal;
  }

  function openFlexible(name){
    const info=skillInfo(name),modal=ensureModal(),rank=rankOf(info.name),rankLabel=["Sem proficiência","Proficiente","Especialização (proficiência dobrada)"][rank];
    modal.dataset.skillName=info.name;
    document.getElementById("microFlexibleSkillTitle").textContent=info.name;
    document.getElementById("microFlexibleSkillSummary").innerHTML=`<span class="micro-flex-chip">Atributo sugerido: <b>${info.suggested}</b></span><span class="micro-flex-chip">${rankLabel}</span><span class="micro-flex-chip">Proficiência: <b>${format(profBonus())}</b></span>`;
    document.getElementById("microFlexibleSkillGrid").innerHTML=ATTRIBUTES.map(attr=>{
      const total=bonusFor(info.name,attr.key),attribute=abilityMod(attr.key),training=rank*profBonus();
      return `<button type="button" class="micro-flex-ability ${attr.key===info.suggested?"suggested":""}" data-flex-ability="${attr.key}"><span class="micro-flex-icon">${attr.icon}</span><span class="micro-flex-copy"><b>${attr.key} — ${attr.label}${attr.key===info.suggested?" • sugerido":""}</b><small>${attr.approach}<br>Atributo ${format(attribute)}${rank?` • Perícia ${format(training)}`:" • sem Proficiência"}</small></span><strong class="micro-flex-total">${format(total)}</strong></button>`
    }).join("");
    modal.classList.add("show");
    setTimeout(()=>document.querySelector("#microFlexibleSkillGrid .micro-flex-ability.suggested")?.focus?.(),0);
  }

  function rollFlexible(name,ability){
    const attr=ATTRIBUTES.find(item=>item.key===ability)||ATTRIBUTES[4],total=bonusFor(name,attr.key),modal=ensureModal();
    modal.classList.remove("show");
    if(typeof rollNamedD20==="function"){
      rollNamedD20(`${name} com ${attr.key}`,total,"Perícia");
      return;
    }
    if(typeof showPopup==="function")showPopup("🎲 Perícia Flexível",`${name} com ${attr.key}`,`Bônus total: <b>${format(total)}</b>.`)
  }

  function ensureRuleNote(){
    const root=document.getElementById("p1Attributes");
    if(!root||document.getElementById("microFlexibleSkillNote"))return;
    const note=document.createElement("div");
    note.id="microFlexibleSkillNote";
    note.innerHTML="<b>↔ Perícias Flexíveis:</b> a Perícia diz o que você sabe fazer; o Atributo diz como você faz. Clique no nome da Perícia e escolha o Atributo que combina com sua abordagem.";
    root.parentNode.insertBefore(note,root)
  }

  function decorate(){
    ensureRuleNote();
    document.querySelectorAll("#p1Attributes .skill").forEach(row=>{
      const button=row.querySelector(".skill-rank"),roll=row.querySelector(".roll-name"),small=roll?.querySelector("small");
      const name=String(roll?.textContent||"").replace(/\([^)]*\)\s*$/," ").replace(/↔/g,"").trim();
      if(!name)return;
      const info=skillInfo(name);
      if(button){
        button.disabled=false;
        button.title="Toque para alternar: sem proficiência → proficiente → especialização";
        button.setAttribute("aria-label",`Alterar proficiência em ${name}`);
        button.onclick=()=>setRank(name)
      }
      if(roll){
        roll.dataset.flexibleSkill=name;
        roll.dataset.suggestedAbility=info.suggested;
        roll.title=`Perícia Flexível: escolha o Atributo conforme a abordagem. ${info.suggested} é apenas a sugestão.`
      }
      if(small){small.classList.add("micro-skill-suggested");small.textContent=`(sug. ${info.suggested})`}
      const total=row.querySelector("b");
      if(total)total.title=`Bônus mostrado com o Atributo sugerido ${info.suggested}. Clique no nome para escolher outro Atributo.`
    })
  }

  function addCodexRule(){
    try{
      if(typeof CODEX_RULES==="undefined"||!Array.isArray(CODEX_RULES))return;
      if(CODEX_RULES.some(rule=>/per[ií]cias flex[ií]veis/i.test(String(rule?.title||""))))return;
      CODEX_RULES.push({title:"Perícias Flexíveis",status:"oficial",text:"Perícias não possuem um Atributo obrigatório. Ao realizar um teste, o jogador descreve como o personagem age e escolhe um Atributo coerente com essa abordagem. A ficha mostra um Atributo sugerido apenas como referência. Proficiência e Especialização pertencem à Perícia e são somadas ao modificador do Atributo escolhido. Percepção Passiva continua usando Sabedoria + Percepção do Matagal por representar atenção constante, não uma abordagem ativa."})
    }catch(_e){}
  }

  if(typeof renderAttrs==="function"){
    const originalRenderAttrs=renderAttrs;
    renderAttrs=function(){originalRenderAttrs();decorate()}
  }

  // Intercepta somente a rolagem das Perícias. Atributos, Salvaguardas, ataques,
  // magias e todos os demais botões da ficha continuam usando o fluxo existente.
  document.addEventListener("click",event=>{
    const roll=event.target.closest?.("#p1Attributes .skill .roll-name[data-flexible-skill]");
    if(!roll)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openFlexible(roll.dataset.flexibleSkill)
  },true);

  restore();
  addCodexRule();
  if(typeof renderAttrs==="function")renderAttrs();
  globalThis.MICROCOSMOS_FLEXIBLE_SKILLS={version:2,open:openFlexible,roll:rollFlexible,bonusFor,skillInfo,attributes:ATTRIBUTES};
})();
