/* MICROCOSMOS — Ofícios exclusivos de Classe na Ficha.
   Cozinheiro  -> Livro de Receitas
   Engenheiro  -> Mochila de Projetos

   Os registros usam os catálogos do Codex como fonte única. A ficha guarda apenas
   quais criações o personagem conhece/prepara e suas anotações pessoais.
*/
(function(){
  if(globalThis.MICROCOSMOS_CLASS_CRAFTING_BOOKS)return;
  globalThis.MICROCOSMOS_CLASS_CRAFTING_BOOKS=true;

  const $=id=>document.getElementById(id);
  const htmlEsc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const fmt=n=>Number(n)>=0?`+${Number(n)||0}`:String(Number(n)||0);

  function available(){try{return typeof state!=="undefined"&&typeof save==="function"}catch{return false}}
  function ensureData(){
    if(!available())return null;
    state.classCraft=state.classCraft&&typeof state.classCraft==="object"?state.classCraft:{};
    state.classCraft.recipes=Array.isArray(state.classCraft.recipes)?state.classCraft.recipes:[];
    state.classCraft.projects=Array.isArray(state.classCraft.projects)?state.classCraft.projects:[];
    for(const type of ["recipes","projects"]){
      state.classCraft[type]=state.classCraft[type].map(entry=>typeof entry==="string"?{id:entry,prepared:false,notes:""}:{id:String(entry?.id||""),prepared:!!entry?.prepared,notes:String(entry?.notes||"")}).filter(entry=>entry.id)
    }
    return state.classCraft
  }
  function isCook(){return available()&&state.cls==="cozinheiro"}
  function isEngineer(){return available()&&state.cls==="engenheiro"}
  function activeType(){return isCook()?"recipes":isEngineer()?"projects":""}
  function catalog(type){
    try{
      const source=type==="recipes"?(typeof CODEX_RECIPES!=="undefined"?CODEX_RECIPES:{}):(typeof CODEX_PROJECTS!=="undefined"?CODEX_PROJECTS:{});
      return Object.entries(source||{}).filter(([,item])=>item&&item.discovered!==false).map(([id,item])=>({id,...item})).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"pt-BR"))
    }catch{return[]}
  }
  function item(type,id){return catalog(type).find(entry=>entry.id===id)||null}
  function abilityKey(type){return type==="recipes"?"SAB":"INT"}
  function abilityMod(type){try{return Math.floor(((Number(state.stats?.[abilityKey(type)])||10)-10)/2)}catch{return 0}}
  function proficiency(){try{return 2+Math.floor((Math.max(1,Number(state.level)||1)-1)/4)}catch{return 2}}
  function knownLimit(type){return Math.max(2,proficiency()+abilityMod(type))}
  function preparedLimit(){return proficiency()+2}
  function list(type){return ensureData()?.[type]||[]}
  function saveAndRender(){save();render()}
  function notify(title,big,details){
    try{if(typeof showPopup==="function")return showPopup(title,big,details)}catch(_e){}
    alert(`${title}\n${big}`)
  }
  function materialName(id){
    try{return MATERIAL_CATALOG?.[id]?.name||id}catch{return id}
  }
  function detailsLine(type,data){
    if(type==="recipes")return `${data.rarity||`Complexidade ${data.complexity||"—"}`} • ${data.portions||1} Porção${Number(data.portions||1)===1?"":"ões"} • ${data.prep||"Preparo especial"}`;
    return `${data.rarity||`Complexidade ${data.complexity||"—"}`} • ${data.charges||1} Carga${Number(data.charges||1)===1?"":"s"} • ${data.activation||"Ativação especial"}`
  }
  function componentsLine(type,data){
    const keys=type==="recipes"?(data.ingredients||[]):(data.components||[]);
    return keys.length?keys.map(materialName).join(" • "):"Nenhum componente catalogado"
  }

  function ensureStyle(){
    if($("microClassCraftStyle"))return;
    const style=document.createElement("style");style.id="microClassCraftStyle";style.textContent=`
      #microClassCraftSection{margin-top:10px;background:rgba(255,250,240,.82);border:2px solid #8e7755;border-radius:17px;padding:10px;position:relative;z-index:2}
      .micro-craft-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}.micro-craft-head h3{margin:0;color:#4f3864}.micro-craft-head p{margin:3px 0 0;color:#6f604c;font-size:.75rem;line-height:1.4;max-width:760px}
      .micro-craft-counts{display:flex;gap:6px;flex-wrap:wrap}.micro-craft-chip{padding:4px 8px;border:1px solid #aa9270;border-radius:999px;background:#fff8e7;font-size:.69rem}.micro-craft-add{display:grid;grid-template-columns:minmax(220px,1fr) auto auto;gap:7px;margin:10px 0}.micro-craft-add select{min-width:0}
      .micro-craft-list{display:grid;gap:8px}.micro-craft-card{border:1px solid #a58b66;border-radius:11px;background:#fffaf0;padding:9px}.micro-craft-card-top{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:start}.micro-craft-card h4{margin:0;color:#405d3e}.micro-craft-meta{color:#705c45;font-size:.7rem;margin-top:2px}.micro-craft-components{font-size:.71rem;color:#66523e;margin:6px 0;padding:6px 8px;border-left:3px solid #8f6d3c;background:#f5ead2}.micro-craft-effect{font-size:.75rem;line-height:1.4;margin:6px 0}.micro-craft-prepared{display:flex;align-items:center;gap:5px;white-space:nowrap;font-size:.72rem;font-weight:bold}.micro-craft-prepared input{width:auto}.micro-craft-notes{margin-top:6px}.micro-craft-notes textarea{min-height:48px;resize:vertical}.micro-craft-empty{text-align:center;padding:12px;border:1px dashed #b39b77;border-radius:10px;color:#75644e;background:#fff8e7}
      @media(max-width:650px){.micro-craft-add{grid-template-columns:1fr}.micro-craft-card-top{grid-template-columns:1fr auto}.micro-craft-card-top .micro-craft-prepared{grid-column:1/-1}}
    `;document.head.appendChild(style)
  }
  function ensureSection(){
    ensureStyle();let section=$("microClassCraftSection");if(section)return section;
    const bottom=document.querySelector("#p1Page .bottom-grid"),page=$("p1Page");if(!page)return null;
    section=document.createElement("section");section.id="microClassCraftSection";section.hidden=true;
    if(bottom?.parentNode)bottom.parentNode.insertBefore(section,bottom);else page.querySelector(".sheet")?.appendChild(section);
    return section
  }

  function add(type){
    const select=$("microClassCraftSelect"),id=String(select?.value||"");if(!id)return;
    const entries=list(type);if(entries.some(entry=>entry.id===id))return;
    const limit=knownLimit(type);if(entries.length>=limit){
      notify(type==="recipes"?"🍲 Livro de Receitas cheio":"⚙️ Mochila de Projetos cheia",`Limite conhecido: ${limit}`,`A regra atual permite conhecer <b>Bônus de Proficiência + ${abilityKey(type)}</b>, com mínimo 2. Para aprender outro, arquive/remova uma criação conhecida.`);return
    }
    entries.push({id,prepared:false,notes:""});saveAndRender()
  }
  function remove(type,id){
    const data=item(type,id),name=data?.name||id;if(!confirm(`Remover ${name} desta ficha?\n\nIsso não apaga a descoberta do Codex.`))return;
    state.classCraft[type]=list(type).filter(entry=>entry.id!==id);saveAndRender()
  }
  function togglePrepared(type,id,checked){
    const entries=list(type),entry=entries.find(e=>e.id===id);if(!entry)return;
    if(checked&&!entry.prepared){
      const used=entries.filter(e=>e.prepared).length,limit=preparedLimit();
      if(used>=limit){notify("🧰 Limite de preparo",`Você pode preparar ${limit} opções`,"Bônus de Proficiência +2 opções do ofício da Classe. Desmarque uma criação preparada antes de escolher outra.");render();return}
    }
    entry.prepared=!!checked;saveAndRender()
  }
  function updateNotes(type,id,value){const entry=list(type).find(e=>e.id===id);if(!entry)return;entry.notes=String(value||"");save()}
  function openCodex(type){
    try{
      const tab=document.querySelector('.tabs button[data-page="p4Page"]');
      if(typeof switchPage==="function"&&tab)switchPage("p4Page",tab);
      if(typeof openCodexCategory==="function")openCodexCategory(type)
    }catch(_e){}
  }

  function render(){
    if(!available())return;ensureData();const section=ensureSection(),type=activeType();if(!section)return;
    if(!type){section.hidden=true;return}section.hidden=false;
    const cook=type==="recipes",entries=list(type),known=entries.length,prepared=entries.filter(entry=>entry.prepared).length,kLimit=knownLimit(type),pLimit=preparedLimit();
    const knownIds=new Set(entries.map(entry=>entry.id)),options=catalog(type).filter(entry=>!knownIds.has(entry.id));
    section.innerHTML=`
      <div class="micro-craft-head"><div><h3>${cook?"🍲 Livro de Receitas":"⚙️ Mochila de Projetos"}</h3><p>${cook?"Registre as Receitas aprendidas pelo Cozinheiro e marque quais foram preparadas para uso.":"Guarde os Projetos dominados pelo Engenheiro e marque quais estão preparados para construção/ativação."} As descrições vêm diretamente do Codex.</p></div><div class="micro-craft-counts"><span class="micro-craft-chip">Conhecidas <b>${known}/${kLimit}</b></span><span class="micro-craft-chip">Preparadas <b>${prepared}/${pLimit}</b></span><span class="micro-craft-chip">Base ${abilityKey(type)} ${fmt(abilityMod(type))} • Prof. ${fmt(proficiency())}</span></div></div>
      <div class="micro-craft-add"><select id="microClassCraftSelect"><option value="">${options.length?`Escolha ${cook?"uma Receita":"um Projeto"} disponível no Codex`:`Todas as opções disponíveis já estão registradas`}</option>${options.map(entry=>`<option value="${htmlEsc(entry.id)}">${htmlEsc(entry.name)} • ${htmlEsc(entry.rarity||`Complexidade ${entry.complexity||"—"}`)}</option>`).join("")}</select><button type="button" class="btn primary" id="microClassCraftAdd" ${options.length?"":"disabled"}>＋ Adicionar</button><button type="button" class="btn" id="microClassCraftCodex">📚 Abrir ${cook?"Receitas":"Projetos"} no Codex</button></div>
      <div class="micro-craft-list">${entries.length?entries.map(entry=>{const data=item(type,entry.id);if(!data)return`<div class="micro-craft-card"><b>Registro antigo: ${htmlEsc(entry.id)}</b><button type="button" class="btn danger slim" data-craft-remove="${htmlEsc(entry.id)}">Remover</button></div>`;return`<article class="micro-craft-card"><div class="micro-craft-card-top"><div><h4>${htmlEsc(data.name)}</h4><div class="micro-craft-meta">${htmlEsc(detailsLine(type,data))}</div></div><label class="micro-craft-prepared"><input type="checkbox" data-craft-prepared="${htmlEsc(entry.id)}" ${entry.prepared?"checked":""}> Preparada</label><button type="button" class="btn danger slim" data-craft-remove="${htmlEsc(entry.id)}">✕</button></div><div class="micro-craft-components"><b>${cook?"Ingredientes":"Componentes"}:</b> ${htmlEsc(componentsLine(type,data))}</div><div class="micro-craft-effect"><b>Efeito:</b> ${htmlEsc(data.effect||"Sem efeito descrito no Codex.")}</div><label class="mini-label micro-craft-notes">Anotações pessoais<textarea data-craft-notes="${htmlEsc(entry.id)}" placeholder="Descoberta, variação, quem ensinou, ajustes da campanha...">${htmlEsc(entry.notes)}</textarea></label></article>`}).join(""):`<div class="micro-craft-empty">${cook?"Nenhuma Receita registrada no Livro ainda.":"Nenhum Projeto guardado na Mochila ainda."}</div>`}</div>`;
    $("microClassCraftAdd")?.addEventListener("click",()=>add(type));$("microClassCraftCodex")?.addEventListener("click",()=>openCodex(type));
    section.querySelectorAll("[data-craft-remove]").forEach(button=>button.addEventListener("click",()=>remove(type,button.dataset.craftRemove)));
    section.querySelectorAll("[data-craft-prepared]").forEach(input=>input.addEventListener("change",()=>togglePrepared(type,input.dataset.craftPrepared,input.checked)));
    section.querySelectorAll("[data-craft-notes]").forEach(area=>area.addEventListener("input",()=>updateNotes(type,area.dataset.craftNotes,area.value)))
  }

  function install(){
    if(!available())return false;ensureData();ensureStyle();ensureSection();
    if(typeof renderAll==="function"&&!renderAll.__microClassCraft){const original=renderAll;const wrapped=function(){const value=original.apply(this,arguments);render();return value};wrapped.__microClassCraft=true;renderAll=wrapped}
    $("p1ClassSelect")?.addEventListener("change",()=>setTimeout(render,0));
    render();return true
  }

  if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer)},125)}
  globalThis.MICROCOSMOS_CLASS_CRAFTING_BOOKS_API={render,knownLimit,preparedLimit,catalog};
})();
