/* MICROCOSMOS — Ofícios exclusivos de Classe na Ficha v2.
   Cozinheiro  -> Livro de Receitas
   Engenheiro  -> Mochila de Projetos

   Os catálogos do Codex são a fonte única das criações. A ficha guarda somente
   o que o personagem aprendeu, preparou e suas anotações pessoais.
*/
(function(){
  if(globalThis.MICROCOSMOS_CLASS_CRAFTING_BOOKS)return;
  globalThis.MICROCOSMOS_CLASS_CRAFTING_BOOKS=true;

  const $=id=>document.getElementById(id);
  const htmlEsc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

  // Progressão definida no Codex de Classes para Cozinheiro e Engenheiro.
  const PROGRESSION=[
    {min:1,max:4,known:3,prepared:2,complexity:1},
    {min:5,max:8,known:6,prepared:3,complexity:2},
    {min:9,max:12,known:9,prepared:4,complexity:3},
    {min:13,max:16,known:12,prepared:5,complexity:4},
    {min:17,max:20,known:15,prepared:6,complexity:5}
  ];
  const MIN_LEVEL_BY_COMPLEXITY={1:1,2:5,3:9,4:13,5:17};

  function available(){try{return typeof state!=="undefined"&&typeof save==="function"}catch{return false}}
  function level(){try{return Math.max(1,Math.min(20,Number(state.level)||1))}catch{return 1}}
  function progression(){const lv=level();return PROGRESSION.find(row=>lv>=row.min&&lv<=row.max)||PROGRESSION[0]}
  function knownLimit(){return progression().known}
  function preparedLimit(){return progression().prepared}
  function maxComplexity(){return progression().complexity}
  function creationComplexity(data){return Math.max(1,Number(data?.complexity)||1)}
  function minLevelFor(data){return MIN_LEVEL_BY_COMPLEXITY[Math.min(5,creationComplexity(data))]||1}

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
      return Object.entries(source||{}).filter(([,entry])=>entry&&entry.discovered!==false).map(([id,entry])=>({id,...entry})).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"pt-BR"))
    }catch{return[]}
  }
  function item(type,id){return catalog(type).find(entry=>entry.id===id)||null}
  function availableToLearn(type){const cap=maxComplexity();return catalog(type).filter(entry=>creationComplexity(entry)<=cap)}
  function list(type){return ensureData()?.[type]||[]}
  function saveAndRender(){save();render()}
  function notify(title,big,details){try{if(typeof showPopup==="function")return showPopup(title,big,details)}catch(_e){}alert(`${title}\n${big}`)}
  function materialName(id){try{return MATERIAL_CATALOG?.[id]?.name||id}catch{return id}}
  function components(type,data){return type==="recipes"?(data.ingredients||[]):(data.components||[])}
  function componentsLine(type,data){const keys=components(type,data);return keys.length?keys.map(materialName).join(" • "):"Nenhum componente catalogado"}
  function detailsLine(type,data){
    const cx=`Complexidade ${creationComplexity(data)}`;
    if(type==="recipes")return `${cx}${data.rarity?` • ${data.rarity}`:""} • ${data.portions||1} Porção${Number(data.portions||1)===1?"":"ões"} • ${data.prep||"Preparo especial"}`;
    return `${cx}${data.rarity?` • ${data.rarity}`:""} • ${data.charges||1} Carga${Number(data.charges||1)===1?"":"s"} • ${data.activation||"Ativação especial"}`
  }

  function strengthenCodexRule(){
    try{
      if(typeof CODEX_RULES==="undefined"||!Array.isArray(CODEX_RULES))return;
      const rule=CODEX_RULES.find(entry=>/Receitas, Projetos, aprendizado e preparação/i.test(String(entry?.title||"")));
      if(!rule)return;
      rule.text="Cozinheiro e Engenheiro seguem a progressão própria de seus ofícios. Nos níveis 1–4 conhecem até 3 criações, preparam 2 e acessam Complexidade 1; nos níveis 5–8, 6 conhecidas, 3 preparadas e Complexidade 2; nos níveis 9–12, 9 conhecidas, 4 preparadas e Complexidade 3; nos níveis 13–16, 12 conhecidas, 5 preparadas e Complexidade 4; nos níveis 17–20, 15 conhecidas, 6 preparadas e Complexidade 5. Receitas e Projetos acima da Complexidade liberada não podem ser aprendidos ainda. Novas criações podem ser obtidas por mestre, livro, descoberta, desmontagem ou experimentação aprovada pelo Mestre.";
    }catch(_e){}
  }

  function ensureStyle(){
    if($("microClassCraftStyle"))return;
    const style=document.createElement("style");style.id="microClassCraftStyle";style.textContent=`
      #microClassCraftSection{margin-top:10px;background:rgba(255,250,240,.82);border:2px solid #8e7755;border-radius:17px;padding:10px;position:relative;z-index:2}
      .micro-craft-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}.micro-craft-head h3{margin:0;color:#4f3864}.micro-craft-head p{margin:3px 0 0;color:#6f604c;font-size:.75rem;line-height:1.4;max-width:760px}
      .micro-craft-counts{display:flex;gap:6px;flex-wrap:wrap}.micro-craft-chip{padding:4px 8px;border:1px solid #aa9270;border-radius:999px;background:#fff8e7;font-size:.69rem}.micro-craft-add{display:grid;grid-template-columns:minmax(220px,1fr) auto auto;gap:7px;margin:10px 0}.micro-craft-add select{min-width:0}
      .micro-craft-level-note{padding:7px 9px;border:1px dashed #a78c65;border-radius:9px;background:#f7efd9;color:#66523e;font-size:.72rem;line-height:1.4;margin-bottom:8px}
      .micro-craft-list{display:grid;gap:8px}.micro-craft-card{border:1px solid #a58b66;border-radius:11px;background:#fffaf0;padding:9px}.micro-craft-card.locked{border-color:#a56e55;background:#f7e9df}.micro-craft-card-top{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:start}.micro-craft-card h4{margin:0;color:#405d3e}.micro-craft-meta{color:#705c45;font-size:.7rem;margin-top:2px}.micro-craft-components{font-size:.71rem;color:#66523e;margin:6px 0;padding:6px 8px;border-left:3px solid #8f6d3c;background:#f5ead2}.micro-craft-effect{font-size:.75rem;line-height:1.4;margin:6px 0}.micro-craft-prepared{display:flex;align-items:center;gap:5px;white-space:nowrap;font-size:.72rem;font-weight:bold}.micro-craft-prepared input{width:auto}.micro-craft-notes{margin-top:6px}.micro-craft-notes textarea{min-height:48px;resize:vertical}.micro-craft-empty{text-align:center;padding:12px;border:1px dashed #b39b77;border-radius:10px;color:#75644e;background:#fff8e7}
      #microClassCraftPreview{position:fixed;inset:0;z-index:3500;background:#08110cbb;display:grid;place-items:center;padding:12px}#microClassCraftPreview[hidden]{display:none}.micro-craft-preview-card{width:min(620px,96vw);max-height:88vh;overflow:auto;background:#efe5cc;border:4px double #735e3e;border-radius:18px;padding:14px;box-shadow:0 18px 55px #000a}.micro-craft-preview-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.micro-craft-preview-head h2{margin:2px 0;color:#503868}.micro-craft-preview-badges{display:flex;gap:6px;flex-wrap:wrap;margin:9px 0}.micro-craft-preview-section{padding:9px 10px;margin:8px 0;border:1px solid #b39a74;border-radius:10px;background:#fffaf0;line-height:1.45}.micro-craft-preview-section b{color:#405d3e}.micro-craft-preview-actions{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;margin-top:10px}
      @media(max-width:650px){.micro-craft-add{grid-template-columns:1fr}.micro-craft-card-top{grid-template-columns:1fr auto}.micro-craft-card-top .micro-craft-prepared{grid-column:1/-1}.micro-craft-preview-actions>*{flex:1}}
    `;document.head.appendChild(style)
  }
  function ensureSection(){
    ensureStyle();let section=$("microClassCraftSection");if(section)return section;
    const bottom=document.querySelector("#p1Page .bottom-grid"),page=$("p1Page");if(!page)return null;
    section=document.createElement("section");section.id="microClassCraftSection";section.hidden=true;
    if(bottom?.parentNode)bottom.parentNode.insertBefore(section,bottom);else page.querySelector(".sheet")?.appendChild(section);
    return section
  }
  function ensurePreview(){
    ensureStyle();let modal=$("microClassCraftPreview");if(modal)return modal;
    modal=document.createElement("div");modal.id="microClassCraftPreview";modal.hidden=true;
    modal.innerHTML='<article class="micro-craft-preview-card"><div class="micro-craft-preview-head"><div><small id="microCraftPreviewKind">CRIAÇÃO</small><h2 id="microCraftPreviewTitle">Receita</h2></div><button type="button" class="btn" id="microCraftPreviewClose">✕ Fechar</button></div><div id="microCraftPreviewBody"></div><div class="micro-craft-preview-actions"><button type="button" class="btn primary" id="microCraftPreviewAdd">＋ Adicionar à ficha</button></div></article>';
    document.body.appendChild(modal);$("microCraftPreviewClose").onclick=()=>modal.hidden=true;modal.onclick=e=>{if(e.target===modal)modal.hidden=true};
    $("microCraftPreviewAdd").onclick=()=>{const type=modal.dataset.type,id=modal.dataset.id;if(type&&id)addById(type,id)};
    return modal
  }
  function preview(type,id){
    const data=item(type,id);if(!data)return;
    const modal=ensurePreview(),cook=type==="recipes",known=list(type).some(entry=>entry.id===id),unlocked=creationComplexity(data)<=maxComplexity(),need=minLevelFor(data);
    modal.dataset.type=type;modal.dataset.id=id;modal.hidden=false;
    $("microCraftPreviewKind").textContent=cook?"🍲 RECEITA":"⚙️ PROJETO";$("microCraftPreviewTitle").textContent=data.name||"Criação";
    $("microCraftPreviewBody").innerHTML=`<div class="micro-craft-preview-badges"><span class="micro-craft-chip">Complexidade <b>${creationComplexity(data)}</b></span><span class="micro-craft-chip">Libera no nível <b>${need}</b></span>${data.rarity?`<span class="micro-craft-chip">${htmlEsc(data.rarity)}</span>`:""}<span class="micro-craft-chip">${unlocked?"✅ Pode aprender agora":"🔒 Ainda não disponível"}</span></div><div class="micro-craft-preview-section"><b>${cook?"Ingredientes":"Componentes"}</b><br>${htmlEsc(componentsLine(type,data))}</div><div class="micro-craft-preview-section"><b>${cook?"Preparo":"Ativação"}</b><br>${htmlEsc(cook?(data.prep||"Preparo especial"):(data.activation||"Ativação especial"))}${cook?` • ${Number(data.portions||1)} Porção${Number(data.portions||1)===1?"":"ões"}`:` • ${Number(data.charges||1)} Carga${Number(data.charges||1)===1?"":"s"}`}</div><div class="micro-craft-preview-section"><b>Efeito</b><br>${htmlEsc(data.effect||"Sem efeito descrito no Codex.")}</div>${data.school?`<div class="micro-craft-preview-section"><b>Escola / estilo</b><br>${htmlEsc(data.school)}</div>`:""}`;
    const addButton=$("microCraftPreviewAdd");addButton.disabled=known||!unlocked||list(type).length>=knownLimit();addButton.textContent=known?"✓ Já registrada":!unlocked?`🔒 Requer nível ${need}`:list(type).length>=knownLimit()?"Livro/Mochila no limite":"＋ Adicionar à ficha"
  }

  function addById(type,id){
    const data=item(type,id);if(!data)return;
    if(creationComplexity(data)>maxComplexity()){notify("🔒 Criação ainda bloqueada",`Requer nível ${minLevelFor(data)}`,`Seu nível atual libera até <b>Complexidade ${maxComplexity()}</b>.`);return}
    const entries=list(type);if(entries.some(entry=>entry.id===id))return;
    if(entries.length>=knownLimit()){notify(type==="recipes"?"🍲 Livro de Receitas cheio":"⚙️ Mochila de Projetos cheia",`Limite no nível ${level()}: ${knownLimit()}`,"Aumente seu nível ou remova/arquive uma criação conhecida antes de aprender outra.");return}
    entries.push({id,prepared:false,notes:""});save();ensurePreview().hidden=true;render()
  }
  function add(type){const id=String($("microClassCraftSelect")?.value||"");if(id)addById(type,id)}
  function remove(type,id){const data=item(type,id),name=data?.name||id;if(!confirm(`Remover ${name} desta ficha?\n\nIsso não apaga a descoberta do Codex.`))return;state.classCraft[type]=list(type).filter(entry=>entry.id!==id);saveAndRender()}
  function togglePrepared(type,id,checked){
    const entries=list(type),entry=entries.find(e=>e.id===id),data=item(type,id);if(!entry)return;
    if(checked&&data&&creationComplexity(data)>maxComplexity()){notify("🔒 Complexidade acima do nível",`Requer nível ${minLevelFor(data)}`,"Esta criação foi preservada na ficha, mas não pode ser preparada no nível atual.");render();return}
    if(checked&&!entry.prepared&&entries.filter(e=>e.prepared).length>=preparedLimit()){notify("🧰 Limite de preparo",`Você pode preparar ${preparedLimit()} opções no nível ${level()}`,"Desmarque uma criação preparada antes de escolher outra.");render();return}
    entry.prepared=!!checked;saveAndRender()
  }
  function updateNotes(type,id,value){const entry=list(type).find(e=>e.id===id);if(!entry)return;entry.notes=String(value||"");save()}

  function render(){
    if(!available())return;ensureData();strengthenCodexRule();const section=ensureSection(),type=activeType();if(!section)return;
    if(!type){section.hidden=true;return}section.hidden=false;
    const cook=type==="recipes",entries=list(type),known=entries.length,prepared=entries.filter(entry=>entry.prepared).length,kLimit=knownLimit(),pLimit=preparedLimit(),cap=maxComplexity();
    const knownIds=new Set(entries.map(entry=>entry.id)),options=availableToLearn(type).filter(entry=>!knownIds.has(entry.id));
    section.innerHTML=`<div class="micro-craft-head"><div><h3>${cook?"🍲 Livro de Receitas":"⚙️ Mochila de Projetos"}</h3><p>${cook?"Escolha uma Receita liberada pelo seu nível, veja os detalhes e então decida se quer aprendê-la.":"Escolha um Projeto liberado pelo seu nível, veja os detalhes e então decida se quer dominá-lo."}</p></div><div class="micro-craft-counts"><span class="micro-craft-chip">Conhecidas <b>${known}/${kLimit}</b></span><span class="micro-craft-chip">Preparadas <b>${prepared}/${pLimit}</b></span><span class="micro-craft-chip">Nível <b>${level()}</b> • Complexidade máx. <b>${cap}</b></span></div></div><div class="micro-craft-level-note">🔓 Neste nível aparecem somente ${cook?"Receitas":"Projetos"} de <b>Complexidade ${cap} ou menor</b>. As próximas Complexidades são liberadas nos níveis 5, 9, 13 e 17.</div><div class="micro-craft-add"><select id="microClassCraftSelect"><option value="">${options.length?`Escolha ${cook?"uma Receita":"um Projeto"} que pode aprender`:`Nenhuma nova opção disponível neste nível`}</option>${options.map(entry=>`<option value="${htmlEsc(entry.id)}">${htmlEsc(entry.name)} • Complexidade ${creationComplexity(entry)}</option>`).join("")}</select><button type="button" class="btn" id="microClassCraftView" ${options.length?"":"disabled"}>👁️ Ver ${cook?"Receita":"Projeto"}</button><button type="button" class="btn primary" id="microClassCraftAdd" ${options.length&&known<kLimit?"":"disabled"}>＋ Adicionar</button></div><div class="micro-craft-list">${entries.length?entries.map(entry=>{const data=item(type,entry.id);if(!data)return`<div class="micro-craft-card"><b>Registro antigo: ${htmlEsc(entry.id)}</b><button type="button" class="btn danger slim" data-craft-remove="${htmlEsc(entry.id)}">Remover</button></div>`;const locked=creationComplexity(data)>cap;return`<article class="micro-craft-card ${locked?"locked":""}"><div class="micro-craft-card-top"><div><h4>${htmlEsc(data.name)}</h4><div class="micro-craft-meta">${htmlEsc(detailsLine(type,data))}${locked?` • 🔒 Requer nível ${minLevelFor(data)}`:""}</div></div><label class="micro-craft-prepared"><input type="checkbox" data-craft-prepared="${htmlEsc(entry.id)}" ${entry.prepared?"checked":""} ${locked?"disabled":""}> Preparada</label><button type="button" class="btn danger slim" data-craft-remove="${htmlEsc(entry.id)}">✕</button></div><div class="micro-craft-components"><b>${cook?"Ingredientes":"Componentes"}:</b> ${htmlEsc(componentsLine(type,data))}</div><div class="micro-craft-effect"><b>Efeito:</b> ${htmlEsc(data.effect||"Sem efeito descrito no Codex.")}</div><button type="button" class="btn slim" data-craft-view-known="${htmlEsc(entry.id)}">👁️ Ver detalhes</button><label class="mini-label micro-craft-notes">Anotações pessoais<textarea data-craft-notes="${htmlEsc(entry.id)}" placeholder="Descoberta, variação, quem ensinou, ajustes da campanha...">${htmlEsc(entry.notes)}</textarea></label></article>`}).join(""):`<div class="micro-craft-empty">${cook?"Nenhuma Receita registrada no Livro ainda.":"Nenhum Projeto guardado na Mochila ainda."}</div>`}</div>`;
    const select=$("microClassCraftSelect"),view=$("microClassCraftView"),addButton=$("microClassCraftAdd");
    select?.addEventListener("change",()=>{const has=!!select.value;if(view)view.disabled=!has;if(addButton)addButton.disabled=!has||known>=kLimit});
    view?.addEventListener("click",()=>{const id=String(select?.value||"");if(id)preview(type,id)});addButton?.addEventListener("click",()=>add(type));
    section.querySelectorAll("[data-craft-view-known]").forEach(button=>button.addEventListener("click",()=>preview(type,button.dataset.craftViewKnown)));
    section.querySelectorAll("[data-craft-remove]").forEach(button=>button.addEventListener("click",()=>remove(type,button.dataset.craftRemove)));
    section.querySelectorAll("[data-craft-prepared]").forEach(input=>input.addEventListener("change",()=>togglePrepared(type,input.dataset.craftPrepared,input.checked)));
    section.querySelectorAll("[data-craft-notes]").forEach(area=>area.addEventListener("input",()=>updateNotes(type,area.dataset.craftNotes,area.value)))
  }

  function install(){
    if(!available())return false;ensureData();ensureStyle();ensureSection();ensurePreview();strengthenCodexRule();
    if(typeof renderAll==="function"&&!renderAll.__microClassCraft){const original=renderAll;const wrapped=function(){const value=original.apply(this,arguments);render();return value};wrapped.__microClassCraft=true;renderAll=wrapped}
    $("p1ClassSelect")?.addEventListener("change",()=>setTimeout(render,0));$("p1Level")?.addEventListener("input",()=>setTimeout(render,0));render();return true
  }

  if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer)},125)}
  globalThis.MICROCOSMOS_CLASS_CRAFTING_BOOKS_API={render,knownLimit,preparedLimit,maxComplexity,catalog,preview,progression};
})();
