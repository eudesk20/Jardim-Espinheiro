/* MICROCOSMOS — ponte das Perícias Flexíveis para o menu Ações do Token.
   O menu contextual antigo renderiza Perícias com Atributo/bônus fixo.
   Quando Perícias Flexíveis está ativa, este runtime altera SOMENTE essa categoria:
   - o Atributo exibido vira sugestão;
   - "Rolar" vira "Escolher";
   - a escolha FOR/DES/CON/INT/SAB/CAR acontece DENTRO da própria linha do menu.

   A escolha inline evita conflito com camadas, mapa, arrasto e modais da Mesa.
   Ataques, Magias, Itens e Salvaguardas permanecem intocados.
*/
(function(){
  if(globalThis.MICROCOSMOS_TOKEN_FLEXIBLE_SKILLS_BRIDGE)return;
  globalThis.MICROCOSMOS_TOKEN_FLEXIBLE_SKILLS_BRIDGE=true;

  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS||[];
  const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const fmt=v=>(Number(v)||0)>=0?`+${Number(v)||0}`:String(Number(v)||0);

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

  function ensureStyle(){
    if(document.getElementById("microTokenFlexibleInlineStyle"))return;
    const style=document.createElement("style");style.id="microTokenFlexibleInlineStyle";style.textContent=`
      #microTokenActionMenu .micro-flex-inline-row{display:block;padding:8px}
      #microTokenActionMenu .micro-flex-inline-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:7px}
      #microTokenActionMenu .micro-flex-inline-head small{display:block;color:#6b5a43;margin-top:2px}
      #microTokenActionMenu .micro-flex-inline-mode{width:100%;margin:0 0 7px;padding:6px;border:1px solid #a58b66;border-radius:7px;background:#fffaf0;color:#392d22}
      #microTokenActionMenu .micro-flex-inline-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
      #microTokenActionMenu .micro-flex-inline-ability{min-width:0;padding:7px 4px;border:1px solid #8f7753;border-radius:8px;background:#fff8e7;color:#3b2e22;font-weight:bold;cursor:pointer;touch-action:manipulation}
      #microTokenActionMenu .micro-flex-inline-ability.suggested{background:#f3dca2;border-color:#9b6d2e}
      #microTokenActionMenu .micro-flex-inline-ability small{display:block;font-size:.59rem;color:#6b583f;margin-top:2px;font-weight:normal}
      #microTokenActionMenu .micro-flex-inline-back{border:0;background:transparent;color:#62477a;text-decoration:underline;cursor:pointer;padding:2px 4px}
      @media(max-width:520px){#microTokenActionMenu .micro-flex-inline-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;document.head.appendChild(style)
  }

  function isSkillCategory(menu){return !!menu?.querySelector('[data-action-cat="skill"].active')}
  function decorate(){
    ensureStyle();
    const menu=document.getElementById("microTokenActionMenu");
    if(!menu||menu.hidden||!isSkillCategory(menu)||!enabled())return;
    const p=selectedToken();if(!p)return;
    menu.querySelectorAll(".micro-action-panel .micro-action-row").forEach(row=>{
      if(row.dataset.flexInlineOpen==="1")return;
      const title=row.querySelector("span>b"),meta=row.querySelector("span>small"),button=row.querySelector("button[data-action-row]");
      const name=String(title?.textContent||"").trim();if(!name||!button)return;
      const skill=flexibleSkill(p,name),signature=`${name}|${skill.suggested}|${proficiencyLabel(p,skill)}`;
      if(row.dataset.flexSkillSignature===signature&&button.dataset.flexSkillChoice==="1")return;
      row.dataset.flexSkillName=name;
      row.dataset.flexSkillSuggested=skill.suggested;
      row.dataset.flexSkillSignature=signature;
      if(meta)meta.textContent=`sug. ${skill.suggested} • ${proficiencyLabel(p,skill)} • Atributo livre`;
      button.textContent="Escolher";
      button.title=`Escolher abordagem para ${name}: FOR, DES, CON, INT, SAB ou CAR`;
      button.setAttribute("aria-label",`Escolher Atributo para ${name}`);
      button.dataset.flexSkillChoice="1"
    })
  }

  function openInline(row,p,name){
    const api=flexApi();if(!row||!p||!api)return;
    ensureStyle();
    const skill=flexibleSkill(p,name),attrs=api.attributes||[
      {key:"FOR",label:"Força"},{key:"DES",label:"Destreza"},{key:"CON",label:"Constituição"},
      {key:"INT",label:"Inteligência"},{key:"SAB",label:"Sabedoria"},{key:"CAR",label:"Carisma"}
    ];
    row.dataset.flexInlineOpen="1";
    row.classList.add("micro-flex-inline-row");
    row.innerHTML=`<div class="micro-flex-inline-head"><span><b>${esc(name)}</b><small>${esc(proficiencyLabel(p,skill))} • sug. ${esc(skill.suggested)}</small></span><button type="button" class="micro-flex-inline-back" data-flex-inline-back="1">voltar</button></div><select class="micro-flex-inline-mode" data-flex-inline-mode aria-label="Modo da rolagem"><option value="normal">Normal</option><option value="adv">Vantagem</option><option value="dis">Desvantagem</option></select><div class="micro-flex-inline-grid">${attrs.map(attr=>{const total=api.bonusFor?.(p,skill,attr.key)??0;return `<button type="button" class="micro-flex-inline-ability ${attr.key===skill.suggested?"suggested":""}" data-flex-inline-ability="${attr.key}" data-flex-inline-skill="${esc(name)}"><span>${esc(attr.key)}</span><small>${fmt(total)}</small></button>`}).join("")}</div>`
  }

  function restoreCategory(){
    const menu=document.getElementById("microTokenActionMenu");
    const tab=menu?.querySelector('[data-action-cat="skill"]');
    if(tab){tab.click();setTimeout(decorate,0)}
  }

  // O listener antigo do menu fecha a janela e rola o bônus fixo. Em capture,
  // desviamos SOMENTE o botão Escolher e abrimos os seis Atributos na própria linha.
  document.addEventListener("click",event=>{
    const button=event.target.closest?.('#microTokenActionMenu .micro-action-panel button[data-flex-skill-choice="1"]');
    if(!button||!enabled())return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const row=button.closest(".micro-action-row"),name=row?.dataset?.flexSkillName||row?.querySelector("span>b")?.textContent||"Perícia";
    const p=selectedToken();if(!p)return;
    openInline(row,p,name)
  },true);

  // Os seis botões ficam dentro do mesmo menu que já é clicável na Mesa.
  // A rolagem usa diretamente o motor oficial de Perícias Flexíveis.
  document.addEventListener("click",event=>{
    const button=event.target.closest?.('#microTokenActionMenu [data-flex-inline-ability]');
    if(!button||!enabled())return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const p=selectedToken(),api=flexApi();if(!p||!api?.roll)return;
    const row=button.closest(".micro-action-row"),name=button.dataset.flexInlineSkill||row?.dataset?.flexSkillName||"Perícia";
    const skill=flexibleSkill(p,name),ability=button.dataset.flexInlineAbility,mode=row?.querySelector("[data-flex-inline-mode]")?.value||"normal";
    const result=api.roll(p,skill,ability,mode);
    if(result!==false){const menu=document.getElementById("microTokenActionMenu");if(menu)menu.hidden=true}
  },true);

  document.addEventListener("click",event=>{
    const back=event.target.closest?.('#microTokenActionMenu [data-flex-inline-back="1"]');if(!back)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();restoreCategory()
  },true);

  // O próprio menu é reconstruído quando a categoria é escolhida; decoramos só uma vez.
  document.addEventListener("click",event=>{
    if(event.target.closest?.('#microTokenActionMenu [data-action-cat="skill"]'))setTimeout(decorate,0)
  },true);
  window.addEventListener("microcosmos:settings-change",()=>setTimeout(decorate,0));

  globalThis.MICROCOSMOS_TOKEN_FLEXIBLE_SKILLS_BRIDGE_API={decorate,flexibleSkill,openInline};
})();
