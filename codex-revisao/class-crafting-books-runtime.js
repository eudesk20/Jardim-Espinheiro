/* MICROCOSMOS — Conhecimento de Ofício v3.
   Cozinheiro -> Livro de Receitas
   Engenheiro -> Mochila de Projetos

   REGRA CENTRAL:
   - Nível define quantas criações podem ser dominadas e a Complexidade máxima.
   - A campanha define quais Receitas/Projetos o personagem realmente conhece.
   - Kit Inicial concede 1 conhecimento fixo + escolha de 2 conhecimentos do Kit.
   - Depois, novas criações entram por compra, recompensa, descoberta, ensino,
     achado, desmontagem, experimento ou outra fonte registrada pela campanha.
*/
(function(){
  if(globalThis.MICROCOSMOS_CLASS_CRAFTING_BOOKS)return;
  globalThis.MICROCOSMOS_CLASS_CRAFTING_BOOKS=true;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const PROGRESSION=[
    {min:1,max:4,known:3,prepared:2,complexity:1},
    {min:5,max:8,known:6,prepared:3,complexity:2},
    {min:9,max:12,known:9,prepared:4,complexity:3},
    {min:13,max:16,known:12,prepared:5,complexity:4},
    {min:17,max:20,known:15,prepared:6,complexity:5}
  ];
  const MIN_LEVEL={1:1,2:5,3:9,4:13,5:17};

  function ready(){try{return typeof state!=="undefined"&&typeof save==="function"}catch{return false}}
  function level(){return Math.max(1,Math.min(20,Number(state?.level)||1))}
  function progression(){const lv=level();return PROGRESSION.find(row=>lv>=row.min&&lv<=row.max)||PROGRESSION[0]}
  function knownLimit(){return progression().known}
  function preparedLimit(){return progression().prepared}
  function maxComplexity(){return progression().complexity}
  function complexity(data){return Math.max(1,Math.min(5,Number(data?.complexity)||1))}
  function minLevelFor(data){return MIN_LEVEL[complexity(data)]||1}
  function activeType(){return state?.cls==="cozinheiro"?"recipes":state?.cls==="engenheiro"?"projects":""}
  function activeClass(){return state?.cls==="cozinheiro"||state?.cls==="engenheiro"?state.cls:""}
  function typeLabel(type){return type==="recipes"?"Receita":"Projeto"}
  function bookLabel(type){return type==="recipes"?"🍲 Livro de Receitas":"⚙️ Mochila de Projetos"}

  function allCatalog(type){
    try{
      const source=type==="recipes"?(typeof CODEX_RECIPES!=="undefined"?CODEX_RECIPES:{}):(typeof CODEX_PROJECTS!=="undefined"?CODEX_PROJECTS:{});
      return Object.entries(source||{}).map(([id,data])=>({id,...data})).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"pt-BR"))
    }catch{return[]}
  }
  function item(type,id){return allCatalog(type).find(x=>x.id===id)||null}
  function materialName(id){try{return MATERIAL_CATALOG?.[id]?.name||id}catch{return id}}
  function componentIds(type,data){return type==="recipes"?(data?.ingredients||[]):(data?.components||[])}
  function componentsText(type,data){const ids=componentIds(type,data);return ids.length?ids.map(materialName).join(" • "):"Nenhum componente catalogado"}

  function normalizeLearned(entry){
    if(typeof entry==="string")return{id:entry,prepared:false,notes:"",source:"Registro anterior",sourceKey:"legacy"};
    return{id:String(entry?.id||""),prepared:!!entry?.prepared,notes:String(entry?.notes||""),source:String(entry?.source||"Registro anterior"),sourceKey:String(entry?.sourceKey||"")}
  }
  function ensureData(){
    if(!ready())return null;
    state.classCraft=state.classCraft&&typeof state.classCraft==="object"?state.classCraft:{};
    state.classCraft.recipes=(Array.isArray(state.classCraft.recipes)?state.classCraft.recipes:[]).map(normalizeLearned).filter(x=>x.id);
    state.classCraft.projects=(Array.isArray(state.classCraft.projects)?state.classCraft.projects:[]).map(normalizeLearned).filter(x=>x.id);
    state.classCraftAccess=state.classCraftAccess&&typeof state.classCraftAccess==="object"?state.classCraftAccess:{};
    state.classCraftAccess.recipes=state.classCraftAccess.recipes&&typeof state.classCraftAccess.recipes==="object"?state.classCraftAccess.recipes:{};
    state.classCraftAccess.projects=state.classCraftAccess.projects&&typeof state.classCraftAccess.projects==="object"?state.classCraftAccess.projects:{};
    state.classCraftInitial=state.classCraftInitial&&typeof state.classCraftInitial==="object"?state.classCraftInitial:{};
    for(const type of ["recipes","projects"])for(const entry of state.classCraft[type]){
      const current=state.classCraftAccess[type][entry.id]||{};
      state.classCraftAccess[type][entry.id]={...current,status:"learned",source:current.source||entry.source||"Registro anterior",sourceKey:current.sourceKey||entry.sourceKey||""}
    }
    return state.classCraft
  }
  function learned(type){return ensureData()?.[type]||[]}
  function learnedEntry(type,id){return learned(type).find(x=>x.id===id)||null}
  function accessMap(type){ensureData();return state.classCraftAccess[type]}
  function access(type,id){return accessMap(type)[id]||null}
  function isLearned(type,id){return !!learnedEntry(type,id)}
  function saveRender(){save();render()}
  function notify(title,big,details){try{if(typeof showPopup==="function")return showPopup(title,big,details)}catch(_e){}alert(`${title}\n${big}`)}

  function kitSpec(){
    const cls=activeClass(),letter=state?.startingKit;
    if(!cls||!letter||state.startingKitClass!==cls)return null;
    return globalThis.CLASS_OFFICIO_KITS?.[cls]?.[letter]||null
  }
  function kitKey(cls=activeClass(),letter=state?.startingKit){return cls&&letter?`kit:${cls}:${letter}`:""}
  function initialState(cls=activeClass()){
    ensureData();
    if(!cls)return null;
    const current=state.classCraftInitial[cls];
    if(current&&typeof current==="object")return current;
    return state.classCraftInitial[cls]={kit:"",choices:[]}
  }
  function removeOldKitKnowledge(cls,oldLetter){
    if(!cls||!oldLetter)return;
    const key=kitKey(cls,oldLetter),type=cls==="cozinheiro"?"recipes":"projects";
    state.classCraft[type]=learned(type).filter(entry=>entry.sourceKey!==key);
    for(const [id,rec] of Object.entries(accessMap(type)))if(rec?.sourceKey===key)delete state.classCraftAccess[type][id]
  }
  function learnDirect(type,id,source,sourceKey=""){
    const data=item(type,id);if(!data)return false;
    if(!isLearned(type,id))state.classCraft[type].push({id,prepared:false,notes:"",source,sourceKey});
    const current=access(type,id)||{};
    state.classCraftAccess[type][id]={...current,status:"learned",source:current.source||source,sourceKey:current.sourceKey||sourceKey};
    return true
  }
  function unlearnKitChoice(type,id,key){
    const entry=learnedEntry(type,id);if(entry?.sourceKey===key)state.classCraft[type]=learned(type).filter(x=>x!==entry);
    const rec=access(type,id);if(rec?.sourceKey===key)delete state.classCraftAccess[type][id]
  }
  function syncKitSetup(){
    const cls=activeClass(),spec=kitSpec();if(!cls||!spec)return false;
    ensureData();const setup=initialState(cls),letter=state.startingKit,type=cls==="cozinheiro"?"recipes":"projects";
    let changed=false;
    if(setup.kit!==letter){
      if(setup.kit)removeOldKitKnowledge(cls,setup.kit);
      setup.kit=letter;setup.choices=[];changed=true
    }
    const key=kitKey(cls,letter),fixed=item(type,spec.fixed);
    if(fixed&&!isLearned(type,spec.fixed)){learnDirect(type,spec.fixed,`Kit ${letter} — ${spec.name}`,key);changed=true}
    setup.choices=(Array.isArray(setup.choices)?setup.choices:[]).filter(id=>spec.choices?.includes(id)).slice(0,Number(spec.choose)||2);
    for(const id of setup.choices)if(!isLearned(type,id)){learnDirect(type,id,`Escolha do Kit ${letter} — ${spec.name}`,key);changed=true}
    if(changed)save();return changed
  }
  function kitChanged(){syncKitSetup();render()}
  function toggleInitialChoice(id){
    const cls=activeClass(),spec=kitSpec();if(!cls||!spec)return;
    const type=cls==="cozinheiro"?"recipes":"projects",setup=initialState(cls),key=kitKey(cls,state.startingKit),max=Number(spec.choose)||2;
    const index=setup.choices.indexOf(id);
    if(index>=0){setup.choices.splice(index,1);unlearnKitChoice(type,id,key)}
    else{
      if(setup.choices.length>=max){notify("🎒 Escolhas do Kit completas",`Escolha somente ${max}`,"Desmarque uma opção antes de escolher outra.");return}
      setup.choices.push(id);learnDirect(type,id,`Escolha do Kit ${state.startingKit} — ${spec.name}`,key)
    }
    saveRender()
  }

  // API para lojas, recompensas, achados, NPCs, chaves de descoberta etc.
  function grant(type,id,source="Descoberta da campanha"){
    ensureData();const data=item(type,id);if(!data)return false;
    if(isLearned(type,id))return true;
    const old=access(type,id)||{};
    state.classCraftAccess[type][id]={...old,status:"acquired",source:String(source||"Descoberta da campanha"),sourceKey:"campaign"};
    save();render();
    notify(type==="recipes"?"📜 Nova Receita adquirida":"📐 Novo Projeto adquirido",data.name,complexity(data)<=maxComplexity()?"O conhecimento foi guardado e já pode ser estudado se houver espaço.":`Conhecimento preservado. Você poderá dominá-lo ao alcançar o nível ${minLevelFor(data)}.`);
    return true
  }
  function learnAcquired(type,id){
    ensureData();const data=item(type,id),rec=access(type,id);if(!data||rec?.status!=="acquired")return false;
    if(complexity(data)>maxComplexity()){notify("🔒 Conhecimento acima da sua capacidade",`Requer nível ${minLevelFor(data)}`,`Seu nível atual domina até Complexidade ${maxComplexity()}.`);return false}
    if(learned(type).length>=knownLimit()){notify(bookLabel(type),`Limite de conhecimentos: ${knownLimit()}`,"Você ainda pode guardar a criação em Para Estudar, mas precisa aumentar sua capacidade ou arquivar outra antes de aprendê-la.");return false}
    learnDirect(type,id,rec.source||"Campanha","");state.classCraftAccess[type][id].sourceKey="campaign";saveRender();return true
  }

  function togglePrepared(type,id,checked){
    const entry=learnedEntry(type,id),data=item(type,id);if(!entry||!data)return;
    if(checked&&complexity(data)>maxComplexity()){notify("🔒 Complexidade acima do nível",`Requer nível ${minLevelFor(data)}`,"A criação continua conhecida, mas não pode ser preparada agora.");render();return}
    if(checked&&!entry.prepared&&learned(type).filter(x=>x.prepared).length>=preparedLimit()){notify("🧰 Limite de preparo",`Você pode preparar ${preparedLimit()} opções`,"Desmarque uma criação preparada antes de escolher outra.");render();return}
    entry.prepared=!!checked;saveRender()
  }
  function updateNotes(type,id,value){const entry=learnedEntry(type,id);if(!entry)return;entry.notes=String(value||"");save()}
  function archive(type,id){
    const entry=learnedEntry(type,id);if(!entry)return;
    if(String(entry.sourceKey||"").startsWith("kit:")){notify("🔒 Conhecimento do Kit",item(type,id)?.name||id,"Conhecimentos concedidos pelo Kit Inicial fazem parte da formação do personagem e não podem ser arquivados enquanto esse Kit estiver selecionado.");return}
    if(!confirm(`Arquivar ${item(type,id)?.name||id}?\n\nA descoberta não será apagada; ela voltará para Para Estudar.`))return;
    state.classCraft[type]=learned(type).filter(x=>x!==entry);
    const rec=access(type,id)||{};state.classCraftAccess[type][id]={...rec,status:"acquired",source:rec.source||entry.source||"Conhecimento arquivado",sourceKey:"campaign"};saveRender()
  }

  function ensureStyle(){
    if($("microClassCraftStyle"))return;
    const style=document.createElement("style");style.id="microClassCraftStyle";style.textContent=`
      #microClassCraftSection{margin-top:10px;background:rgba(255,250,240,.84);border:2px solid #8e7755;border-radius:17px;padding:10px;position:relative;z-index:2}.micro-craft-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}.micro-craft-head h3{margin:0;color:#4f3864}.micro-craft-head p{margin:3px 0 0;color:#6f604c;font-size:.75rem;line-height:1.4;max-width:760px}.micro-craft-counts{display:flex;gap:6px;flex-wrap:wrap}.micro-craft-chip{padding:4px 8px;border:1px solid #aa9270;border-radius:999px;background:#fff8e7;font-size:.69rem}.micro-craft-rule{margin:9px 0;padding:8px 10px;border-left:4px solid #6f4d84;background:#f1e7f5;border-radius:0 9px 9px 0;font-size:.73rem;line-height:1.4}.micro-craft-kit{margin:10px 0;padding:10px;border:2px solid #96713d;border-radius:12px;background:#fff1cf}.micro-craft-kit h4{margin:0 0 4px;color:#62451f}.micro-craft-kit-choice{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px;margin:5px 0;border:1px solid #b59a70;border-radius:9px;background:#fffaf0}.micro-craft-kit-choice input{width:auto}.micro-craft-section-title{margin:12px 0 6px;color:#4f3864}.micro-craft-list{display:grid;gap:8px}.micro-craft-card{border:1px solid #a58b66;border-radius:11px;background:#fffaf0;padding:9px}.micro-craft-card.acquired{border-left:5px solid #a36f17}.micro-craft-card-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:start}.micro-craft-card h4{margin:0;color:#405d3e}.micro-craft-meta{color:#705c45;font-size:.7rem;margin-top:2px}.micro-craft-source{font-size:.69rem;color:#725879;margin-top:4px}.micro-craft-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.micro-craft-prepared{display:flex;align-items:center;gap:5px;font-size:.72rem;font-weight:bold}.micro-craft-prepared input{width:auto}.micro-craft-notes{margin-top:7px}.micro-craft-notes textarea{min-height:48px}.micro-craft-empty{text-align:center;padding:12px;border:1px dashed #b39b77;border-radius:10px;color:#75644e;background:#fff8e7}.micro-craft-lock{color:#934c38;font-size:.7rem;font-weight:bold}
      #microClassCraftPreview{position:fixed;inset:0;z-index:3500;background:#08110cbb;display:grid;place-items:center;padding:12px}#microClassCraftPreview[hidden]{display:none}.micro-craft-preview-card{width:min(640px,96vw);max-height:88vh;overflow:auto;background:#efe5cc;border:4px double #735e3e;border-radius:18px;padding:14px;box-shadow:0 18px 55px #000a}.micro-craft-preview-head{display:flex;justify-content:space-between;gap:10px}.micro-craft-preview-head h2{margin:2px 0;color:#503868}.micro-craft-preview-section{padding:9px 10px;margin:8px 0;border:1px solid #b39a74;border-radius:10px;background:#fffaf0;line-height:1.45}.micro-craft-preview-actions{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;margin-top:10px}@media(max-width:650px){.micro-craft-card-top{grid-template-columns:1fr}.micro-craft-actions{justify-content:flex-start}.micro-craft-kit-choice{grid-template-columns:auto 1fr}.micro-craft-kit-choice .btn{grid-column:1/-1}}
    `;document.head.appendChild(style)
  }
  function ensureSection(){
    ensureStyle();let section=$("microClassCraftSection");if(section)return section;
    const bottom=document.querySelector("#p1Page .bottom-grid"),page=$("p1Page");if(!page)return null;
    section=document.createElement("section");section.id="microClassCraftSection";section.hidden=true;
    if(bottom?.parentNode)bottom.parentNode.insertBefore(section,bottom);else page.querySelector(".sheet")?.appendChild(section);return section
  }
  function ensurePreview(){
    ensureStyle();let modal=$("microClassCraftPreview");if(modal)return modal;
    modal=document.createElement("div");modal.id="microClassCraftPreview";modal.hidden=true;
    modal.innerHTML='<article class="micro-craft-preview-card"><div class="micro-craft-preview-head"><div><small id="microCraftPreviewKind">CRIAÇÃO</small><h2 id="microCraftPreviewTitle">Criação</h2></div><button type="button" class="btn" id="microCraftPreviewClose">✕ Fechar</button></div><div id="microCraftPreviewBody"></div><div class="micro-craft-preview-actions"><button type="button" class="btn primary" id="microCraftPreviewAction"></button></div></article>';
    document.body.appendChild(modal);$("microCraftPreviewClose").onclick=()=>modal.hidden=true;modal.onclick=e=>{if(e.target===modal)modal.hidden=true};return modal
  }
  function preview(type,id){
    const data=item(type,id);if(!data)return;const modal=ensurePreview(),rec=access(type,id),known=isLearned(type,id),canLevel=complexity(data)<=maxComplexity();
    modal.hidden=false;modal.dataset.type=type;modal.dataset.id=id;
    $("microCraftPreviewKind").textContent=type==="recipes"?"🍲 RECEITA":"⚙️ PROJETO";$("microCraftPreviewTitle").textContent=data.name||typeLabel(type);
    $("microCraftPreviewBody").innerHTML=`<div class="micro-craft-counts"><span class="micro-craft-chip">Complexidade <b>${complexity(data)}</b></span><span class="micro-craft-chip">Nível mínimo <b>${minLevelFor(data)}</b></span>${data.rarity?`<span class="micro-craft-chip">${esc(data.rarity)}</span>`:""}<span class="micro-craft-chip">${known?"🧠 Aprendida":rec?.status==="acquired"?"📜 Adquirida":"👀 Não pertence à sua base de conhecimento"}</span></div><div class="micro-craft-preview-section"><b>${type==="recipes"?"Ingredientes":"Componentes"}</b><br>${esc(componentsText(type,data))}</div><div class="micro-craft-preview-section"><b>${type==="recipes"?"Preparo":"Ativação"}</b><br>${esc(type==="recipes"?(data.prep||"Preparo especial"):(data.activation||"Ativação especial"))}${type==="recipes"?` • ${Number(data.portions||1)} Porção${Number(data.portions||1)===1?"":"ões"}`:` • ${Number(data.charges||1)} Carga${Number(data.charges||1)===1?"":"s"}`}</div><div class="micro-craft-preview-section"><b>Efeito</b><br>${esc(data.effect||"Sem efeito descrito no Codex.")}</div>${rec?.source?`<div class="micro-craft-preview-section"><b>Como entrou na sua base</b><br>${esc(rec.source)}</div>`:""}${!canLevel?`<div class="micro-craft-preview-section micro-craft-lock">🔒 Você ainda não domina esta Complexidade. Ela será utilizável a partir do nível ${minLevelFor(data)}.</div>`:""}`;
    const action=$("microCraftPreviewAction");
    if(known){action.textContent="✓ Já aprendida";action.disabled=true;action.onclick=null}
    else if(rec?.status==="acquired"){action.textContent=canLevel?"🧠 Aprender agora":`🔒 Requer nível ${minLevelFor(data)}`;action.disabled=!canLevel||learned(type).length>=knownLimit();action.onclick=()=>{if(learnAcquired(type,id))modal.hidden=true}}
    else{action.textContent="🔒 Precisa ser adquirida na campanha";action.disabled=true;action.onclick=null}
  }

  function renderKitBlock(type){
    const spec=kitSpec(),cls=activeClass();if(!spec||!cls)return'<div class="micro-craft-kit"><h4>🎒 Conhecimento Inicial</h4><p>Escolha primeiro um <b>Kit Inicial da Classe</b>. O Kit define equipamento exclusivo e sua formação inicial de Ofício.</p></div>';
    syncKitSetup();const setup=initialState(cls),fixed=item(type,spec.fixed),max=Number(spec.choose)||2,complete=setup.choices.length>=max;
    return `<div class="micro-craft-kit"><h4>🎒 Conhecimento Inicial — Kit ${esc(state.startingKit)}: ${esc(spec.name)}</h4><div class="micro-craft-meta">${esc(spec.style)}</div><p style="font-size:.75rem">${esc(spec.advantage||"")}</p><div class="micro-craft-kit-choice"><span>✓</span><div><b>${esc(fixed?.name||spec.fixed)}</b><div class="micro-craft-meta">Conhecimento fixo concedido pelo Kit.</div></div><button type="button" class="btn slim" data-preview="${esc(spec.fixed)}">👁️ Ver ${typeLabel(type)}</button></div><div class="micro-craft-meta" style="margin:7px 0"><b>Escolha ${max}:</b> ${setup.choices.length}/${max} selecionadas.</div>${(spec.choices||[]).map(id=>{const data=item(type,id),checked=setup.choices.includes(id);return`<label class="micro-craft-kit-choice"><input type="checkbox" data-initial-choice="${esc(id)}" ${checked?"checked":""}><div><b>${esc(data?.name||id)}</b><div class="micro-craft-meta">Complexidade ${complexity(data)} • ${esc(data?.effect||"")}</div></div><button type="button" class="btn slim" data-preview="${esc(id)}">👁️ Ver</button></label>`}).join("")}<div class="micro-craft-rule">${complete?"✅ Formação inicial completa. As próximas criações precisam entrar pela campanha.":"Escolha as duas criações que fizeram parte da formação do personagem. Depois disso, o catálogo não libera conhecimentos automaticamente."}</div></div>`
  }

  function renderAcquired(type){
    const records=Object.entries(accessMap(type)).filter(([id,rec])=>rec?.status==="acquired"&&!isLearned(type,id));
    if(!records.length)return'<div class="micro-craft-empty">Nenhum novo conhecimento adquirido aguardando estudo.</div>';
    return records.map(([id,rec])=>{const data=item(type,id);if(!data)return"";const unlocked=complexity(data)<=maxComplexity(),space=learned(type).length<knownLimit();return`<article class="micro-craft-card acquired"><div class="micro-craft-card-top"><div><h4>📜 ${esc(data.name)}</h4><div class="micro-craft-meta">Complexidade ${complexity(data)} • ${unlocked?"pode ser estudada agora":`requer nível ${minLevelFor(data)}`}</div><div class="micro-craft-source">Origem: ${esc(rec.source||"Campanha")}</div></div><div class="micro-craft-actions"><button class="btn slim" type="button" data-preview="${esc(id)}">👁️ Ver</button><button class="btn primary slim" type="button" data-learn="${esc(id)}" ${!unlocked||!space?"disabled":""}>🧠 Aprender</button></div></div>${!unlocked?`<div class="micro-craft-lock">🔒 Guardada para o futuro — nível ${minLevelFor(data)}.</div>`:!space?'<div class="micro-craft-lock">📚 Limite de conhecimentos atingido; a descoberta continua preservada.</div>':""}</article>`}).join("")
  }

  function renderLearned(type){
    const rows=learned(type);if(!rows.length)return'<div class="micro-craft-empty">Nenhum conhecimento aprendido ainda.</div>';
    return rows.map(entry=>{const data=item(type,entry.id);if(!data)return"";const kitKnowledge=String(entry.sourceKey||"").startsWith("kit:");return`<article class="micro-craft-card"><div class="micro-craft-card-top"><div><h4>${esc(data.name)}</h4><div class="micro-craft-meta">Complexidade ${complexity(data)} • ${type==="recipes"?`${Number(data.portions||1)} Porção${Number(data.portions||1)===1?"":"ões"} • ${esc(data.prep||"Preparo especial")}`:`${Number(data.charges||1)} Carga${Number(data.charges||1)===1?"":"s"} • ${esc(data.activation||"Ativação especial")}`}</div><div class="micro-craft-source">Origem: ${esc(entry.source||"Conhecimento do personagem")}</div></div><div class="micro-craft-actions"><label class="micro-craft-prepared"><input type="checkbox" data-prepared="${esc(entry.id)}" ${entry.prepared?"checked":""}> Preparada</label><button type="button" class="btn slim" data-preview="${esc(entry.id)}">👁️ Ver</button>${kitKnowledge?'<span class="micro-craft-chip">🔒 Kit</span>':`<button type="button" class="btn danger slim" data-archive="${esc(entry.id)}">Arquivar</button>`}</div></div><label class="mini-label micro-craft-notes">Anotações pessoais<textarea data-notes="${esc(entry.id)}" placeholder="Quem ensinou, variações, descobertas, ajustes da campanha...">${esc(entry.notes)}</textarea></label></article>`}).join("")
  }

  function strengthenCodexRule(){
    try{
      if(typeof CODEX_RULES==="undefined"||!Array.isArray(CODEX_RULES))return;
      const title="Conhecimento de Ofício — Receitas e Projetos";
      const text="Cozinheiro e Engenheiro não recebem automaticamente todas as criações permitidas pelo nível. O nível determina apenas a capacidade: níveis 1–4 conhecem até 3 criações, preparam 2 e dominam Complexidade 1; 5–8: 6/3/Complexidade 2; 9–12: 9/4/Complexidade 3; 13–16: 12/5/Complexidade 4; 17–20: 15/6/Complexidade 5. O Kit Inicial concede 1 conhecimento fixo e 2 escolhas do estilo do Kit. Depois disso, Receitas e Projetos devem ser comprados, ganhos, encontrados, ensinados, descobertos, desmontados ou desenvolvidos durante a campanha. Uma criação adquirida acima da capacidade permanece guardada em Para Estudar até o personagem conseguir dominá-la.";
      const old=CODEX_RULES.find(x=>/Receitas, Projetos, aprendizado e preparação|Conhecimento de Ofício/i.test(String(x?.title||"")));
      if(old){old.title=title;old.status="oficial";old.text=text}else CODEX_RULES.push({title,status:"oficial",text})
    }catch(_e){}
  }

  function render(){
    if(!ready())return;ensureData();strengthenCodexRule();const section=ensureSection(),type=activeType();if(!section)return;
    if(!type){section.hidden=true;return}section.hidden=false;syncKitSetup();
    const known=learned(type).length,prepared=learned(type).filter(x=>x.prepared).length;
    section.innerHTML=`<div class="micro-craft-head"><div><h3>${bookLabel(type)}</h3><p>${type==="recipes"?"Base pessoal de conhecimento culinário do Cozinheiro.":"Base pessoal de conhecimento técnico do Engenheiro."} O nível define capacidade; a aventura define o que você conhece.</p></div><div class="micro-craft-counts"><span class="micro-craft-chip">Aprendidas <b>${known}/${knownLimit()}</b></span><span class="micro-craft-chip">Preparadas <b>${prepared}/${preparedLimit()}</b></span><span class="micro-craft-chip">Complexidade <b>${maxComplexity()}</b></span></div></div><div class="micro-craft-rule"><b>📚 Conhecimento de Ofício:</b> subir de nível não ensina automaticamente novas ${type==="recipes"?"Receitas":"Projetos"}. Novos conhecimentos precisam entrar na história do personagem.</div>${renderKitBlock(type)}<h4 class="micro-craft-section-title">📜 Para Estudar</h4><div class="micro-craft-list">${renderAcquired(type)}</div><h4 class="micro-craft-section-title">🧠 Aprendidas</h4><div class="micro-craft-list">${renderLearned(type)}</div>`;
    section.querySelectorAll("[data-initial-choice]").forEach(input=>input.addEventListener("change",()=>toggleInitialChoice(input.dataset.initialChoice)));
    section.querySelectorAll("[data-preview]").forEach(button=>button.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();preview(type,button.dataset.preview)}));
    section.querySelectorAll("[data-learn]").forEach(button=>button.addEventListener("click",()=>learnAcquired(type,button.dataset.learn)));
    section.querySelectorAll("[data-prepared]").forEach(input=>input.addEventListener("change",()=>togglePrepared(type,input.dataset.prepared,input.checked)));
    section.querySelectorAll("[data-archive]").forEach(button=>button.addEventListener("click",()=>archive(type,button.dataset.archive)));
    section.querySelectorAll("[data-notes]").forEach(area=>area.addEventListener("input",()=>updateNotes(type,area.dataset.notes,area.value)))
  }

  function install(){
    if(!ready())return false;ensureData();ensureStyle();ensureSection();strengthenCodexRule();
    if(typeof renderAll==="function"&&!renderAll.__microClassCraftV3){const original=renderAll;const wrapped=function(){const value=original.apply(this,arguments);render();return value};wrapped.__microClassCraftV3=true;renderAll=wrapped}
    $("p1ClassSelect")?.addEventListener("change",()=>setTimeout(render,0));$("p1Level")?.addEventListener("input",()=>setTimeout(render,0));render();return true
  }
  if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer)},125)}
  globalThis.MICROCOSMOS_CLASS_CRAFTING_BOOKS_API={render,knownLimit,preparedLimit,maxComplexity,catalog:allCatalog,preview,progression,grant,learnAcquired,kitChanged,syncKitSetup};
})();
