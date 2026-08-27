/* MICROCOSMOS — ponte das Perícias Flexíveis para o menu Ações do Token.
   O menu contextual antigo ainda renderiza Perícias com um Atributo/bônus fixo.
   Este runtime altera SOMENTE a categoria Perícias quando a regra flexível está ativa:
   - o Atributo exibido vira sugestão;
   - "Rolar" vira "Escolher";
   - o clique abre o seletor FOR/DES/CON/INT/SAB/CAR do motor oficial.
   Ataques, Magias, Itens e Salvaguardas permanecem intocados.
*/
(function(){
  if(globalThis.MICROCOSMOS_TOKEN_FLEXIBLE_SKILLS_BRIDGE)return;
  globalThis.MICROCOSMOS_TOKEN_FLEXIBLE_SKILLS_BRIDGE=true;

  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS||[];
  const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

  function flexApi(){return globalThis.MICROCOSMOS_MESA_FLEXIBLE_SKILLS_API}
  function enabled(){try{return flexApi()?.enabled?.()!==false}catch{return true}}
  function selectedToken(){
    const id=document.querySelector("#tokenLayer .token.selected")?.dataset?.token||"";
    return players.find(p=>String(p.id)===String(id))||null
  }
  function currentSkillData(p,name){
    const wanted=norm(name);
    return (Array.isArray(p?.skills)?p.skills:[]).find(s=>norm(s?.name)===wanted)||null
  }
  function flexibleSkill(p,name){
    const api=flexApi(),catalog=api?.catalog||[],wanted=norm(name),raw=currentSkillData(p,name);
    const found=catalog.find(skill=>[skill.name,...(skill.aliases||[])].some(label=>norm(label)===wanted));
    if(found){
      const aliases=[found.name,...(found.aliases||[])].filter(label=>norm(label)!==wanted);
      return{name:String(name||found.name),suggested:raw?.ability||found.suggested||"SAB",aliases}
    }
    return{name:String(name||"Perícia"),suggested:raw?.ability||"SAB",aliases:[]}
  }
  function proficiencyLabel(p,skill){
    const rank=Number(flexApi()?.rankFor?.(p,skill))||0;
    return rank>=2?"◆ Especialização":rank===1?"● Proficiente":"○ Sem proficiência"
  }

  function isSkillCategory(menu){return !!menu?.querySelector('[data-action-cat="skill"].active')}
  function decorate(){
    const menu=document.getElementById("microTokenActionMenu");
    if(!menu||menu.hidden||!isSkillCategory(menu)||!enabled())return;
    const p=selectedToken();if(!p)return;
    menu.querySelectorAll(".micro-action-panel .micro-action-row").forEach(row=>{
      const title=row.querySelector("span>b"),meta=row.querySelector("span>small"),button=row.querySelector("button[data-action-row]");
      const name=String(title?.textContent||"").trim();if(!name||!button)return;
      const skill=flexibleSkill(p,name);
      row.dataset.flexSkillName=name;
      row.dataset.flexSkillSuggested=skill.suggested;
      if(meta)meta.textContent=`sug. ${skill.suggested} • ${proficiencyLabel(p,skill)} • Atributo livre`;
      button.textContent="Escolher";
      button.title=`Escolher abordagem para ${name}: FOR, DES, CON, INT, SAB ou CAR`;
      button.setAttribute("aria-label",`Escolher Atributo para ${name}`);
      button.dataset.flexSkillChoice="1"
    })
  }

  // O listener antigo do menu fecha a janela e rola o bônus fixo. Em capture,
  // desviamos SOMENTE os botões de Perícia para o motor flexível antes dele.
  document.addEventListener("click",async event=>{
    const button=event.target.closest?.('#microTokenActionMenu .micro-action-panel button[data-flex-skill-choice="1"]');
    if(!button||!enabled())return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const row=button.closest(".micro-action-row"),name=row?.dataset?.flexSkillName||row?.querySelector("span>b")?.textContent||"Perícia";
    const p=selectedToken(),api=flexApi();
    if(!p||!api?.open)return;
    button.disabled=true;
    try{await api.open(p,flexibleSkill(p,name))}finally{if(button.isConnected)button.disabled=false}
  },true);

  // A categoria é reconstruída a cada clique, então decoramos após mutações e
  // também logo depois do botão "Perícias" ser acionado.
  document.addEventListener("click",event=>{
    if(event.target.closest?.('#microTokenActionMenu [data-action-cat="skill"]'))setTimeout(decorate,0)
  },true);
  const observer=new MutationObserver(()=>queueMicrotask(decorate));
  const start=()=>{const menu=document.getElementById("microTokenActionMenu");if(menu){observer.observe(menu,{childList:true,subtree:true});decorate();return true}return false};
  if(!start()){let tries=0;const timer=setInterval(()=>{if(start()||++tries>80)clearInterval(timer)},125)}
  window.addEventListener("microcosmos:settings-change",()=>setTimeout(decorate,0));

  globalThis.MICROCOSMOS_TOKEN_FLEXIBLE_SKILLS_BRIDGE_API={decorate,flexibleSkill};
})();
