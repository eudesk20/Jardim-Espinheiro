/* MICROCOSMOS — apresentação oficial das Perícias Flexíveis.
   Complementa skill-choice-runtime.js sem alterar dados do personagem.
   As Perícias deixam de parecer "filhas" de um Atributo: ficam em uma lista
   independente, enquanto o Atributo mostrado em cada linha continua apenas
   como sugestão de abordagem.
*/
(function(){
  if(globalThis.MICROCOSMOS_FLEXIBLE_SKILLS_LAYOUT)return;
  globalThis.MICROCOSMOS_FLEXIBLE_SKILLS_LAYOUT=true;

  const RULE_TITLE="Perícias Flexíveis";
  const RULE_TEXT="Perícias não pertencem a um Atributo obrigatório. A Perícia define o que o personagem sabe fazer; o Atributo define como ele realiza aquela ação naquele momento. O jogador descreve a abordagem e escolhe FOR, DES, CON, INT, SAB ou CAR quando a descrição e a situação justificarem. O teste usa 1d20 + modificador do Atributo escolhido + Proficiência da Perícia; Especialização dobra a Proficiência. O Atributo indicado na ficha é somente uma sugestão. Exemplo: Intimidação pode usar CAR para uma ameaça verbal, FOR para uma demonstração física ou INT para expor friamente as consequências. O Mestre valida se a abordagem sustenta o Atributo escolhido. Percepção Passiva continua usando SAB + Percepção do Matagal porque representa atenção constante, e não uma abordagem ativa.";
  let arranging=false;

  function ensureStyle(){
    if(document.getElementById("microFlexibleSkillsLayoutStyle"))return;
    const style=document.createElement("style");
    style.id="microFlexibleSkillsLayoutStyle";
    style.textContent=`
      #microFlexibleSkillsSection{margin-top:12px;padding:11px;border:1px solid #8e7658;border-radius:11px;background:linear-gradient(145deg,#f2e7d0,#fff8e8)}
      #microFlexibleSkillsSection .micro-flex-layout-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:8px}
      #microFlexibleSkillsSection .micro-flex-layout-head h3{margin:0;color:#503868;font-size:1rem}
      #microFlexibleSkillsSection .micro-flex-layout-head p{margin:2px 0 0;max-width:700px;color:#6f604c;font-size:.73rem;line-height:1.4}
      #microFlexibleSkillsSection .micro-flex-formula{padding:4px 8px;border:1px solid #b49a73;border-radius:999px;background:#fffaf0;color:#57422f;font-size:.68rem;white-space:nowrap}
      #microFlexibleSkillIndependentList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 12px}
      #microFlexibleSkillIndependentList .skill{min-width:0;border-bottom:1px dotted #bda783;padding:3px 0}
      #p1Attributes .attr-block .skills:empty,#p1Attributes .attr-block .skills[data-flex-moved="1"]{display:none!important}
      @media(max-width:620px){#microFlexibleSkillIndependentList{grid-template-columns:1fr}.micro-flex-formula{white-space:normal}}
    `;
    document.head.appendChild(style)
  }

  function strengthenCodexRule(){
    try{
      if(typeof CODEX_RULES==="undefined"||!Array.isArray(CODEX_RULES))return;
      const existing=CODEX_RULES.find(rule=>String(rule?.title||"").toLowerCase()===RULE_TITLE.toLowerCase());
      if(existing){existing.status="oficial";existing.text=RULE_TEXT}
      else CODEX_RULES.push({title:RULE_TITLE,status:"oficial",text:RULE_TEXT})
    }catch(_e){}
  }

  function arrange(){
    if(arranging)return;
    const root=document.getElementById("p1Attributes");
    if(!root)return;
    const skills=[...root.querySelectorAll(".attr-block .skills .skill")];
    if(!skills.length)return;
    arranging=true;
    try{
      ensureStyle();
      let section=document.getElementById("microFlexibleSkillsSection");
      if(!section){
        section=document.createElement("section");
        section.id="microFlexibleSkillsSection";
        section.innerHTML=`<div class="micro-flex-layout-head"><div><h3>↔ Perícias Flexíveis</h3><p>A Perícia diz <b>o que</b> você sabe fazer. Clique no nome e escolha o Atributo que representa <b>como</b> seu personagem está fazendo isso na cena. O Atributo sugerido é só uma referência.</p></div><span class="micro-flex-formula">1d20 + Atributo + Proficiência da Perícia</span></div><div id="microFlexibleSkillIndependentList"></div>`;
        root.appendChild(section)
      }
      const list=document.getElementById("microFlexibleSkillIndependentList");
      if(!list)return;
      skills.forEach(skill=>list.appendChild(skill));
      root.querySelectorAll(".attr-block .skills").forEach(box=>box.dataset.flexMoved="1")
    }finally{arranging=false}
  }

  function install(){
    strengthenCodexRule();
    ensureStyle();
    if(typeof renderAttrs==="function"&&!renderAttrs.__microFlexibleLayout){
      const original=renderAttrs;
      const wrapped=function(){const value=original.apply(this,arguments);queueMicrotask(arrange);return value};
      wrapped.__microFlexibleLayout=true;
      renderAttrs=wrapped
    }
    arrange()
  }

  install();
  // Outros runtimes também podem redesenhar os Atributos. A verificação é barata
  // e só reorganiza quando encontra Perícias novamente dentro dos blocos antigos.
  setInterval(()=>{strengthenCodexRule();arrange()},900);
})();
