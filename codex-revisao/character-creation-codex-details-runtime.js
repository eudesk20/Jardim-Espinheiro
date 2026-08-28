/* MICROCOSMOS — Criação Assistida: fontes corretas + fichas completas do Codex.
   Corrige Sub-Raça/Antecedente e adiciona visualização completa sem alterar a escolha.
*/
(function(){
  if(globalThis.MICROCOSMOS_CHARACTER_CREATION_CODEX_DETAILS)return;
  globalThis.MICROCOSMOS_CHARACTER_CREATION_CODEX_DETAILS=true;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  let bodyObserver=null,scheduled=false;

  function raceCatalog(){
    try{if(typeof RACE_DATA!=="undefined"&&RACE_DATA)return RACE_DATA}catch(_e){}
    return globalThis.CODEX_RACE_DATA||globalThis.MICROCOSMO_DATA?.races||{};
  }
  function originNames(){
    try{if(typeof ORIGIN_REVIEW_NAMES!=="undefined"&&Array.isArray(ORIGIN_REVIEW_NAMES))return [...ORIGIN_REVIEW_NAMES]}catch(_e){}
    return [...document.querySelectorAll("#backgroundCodexOptions option")].map(o=>o.value||o.textContent).filter(Boolean);
  }
  function progressionRows(key){
    try{if(typeof CLASS_CODEX_PROGRESSIONS!=="undefined")return CLASS_CODEX_PROGRESSIONS?.[key]||[]}catch(_e){}
    return globalThis.CLASS_CODEX_PROGRESSIONS?.[key]||[];
  }

  function fixDataSources(){
    const races=raceCatalog();
    if(!globalThis.RACE_DATA&&races)globalThis.RACE_DATA=races;
    const input=$("p1Background");
    if(input&&!input.dataset.microCreationOptionsPatched){
      try{
        Object.defineProperty(input,"options",{configurable:true,get(){return originNames().map(name=>({value:name,textContent:name}))}});
        input.dataset.microCreationOptionsPatched="1";
      }catch(_e){input.options=originNames().map(name=>({value:name,textContent:name}));input.dataset.microCreationOptionsPatched="1"}
    }
  }

  function ensureCss(){
    if($("microCreationCodexDetailsStyle"))return;
    const s=document.createElement("style");s.id="microCreationCodexDetailsStyle";s.textContent=`
      .micro-create-choice-wrap{display:grid;grid-template-rows:1fr auto;gap:5px;min-width:0}.micro-create-choice-wrap>.micro-create-option{height:100%}.micro-create-view{width:100%;padding:6px 8px;border:1px solid #8d7654;border-radius:8px;background:#eee0c0;color:#4b3827;font-weight:bold}.micro-create-view:hover{background:#e2d0aa}
      #microCreationCodexDetail{position:fixed;inset:0;z-index:220000;background:#07100dea;display:grid;place-items:center;padding:10px;color:#30271e}#microCreationCodexDetail[hidden]{display:none}.micro-create-detail-card{width:min(1080px,98vw);height:min(90vh,900px);display:grid;grid-template-rows:auto 1fr;background:#efe5cc;border:4px double #b58a3d;border-radius:20px;overflow:hidden;box-shadow:0 24px 80px #000d}.micro-create-detail-head{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid #a58b66;background:#f4ead4}.micro-create-detail-head h2{margin:0;color:#405d3e}.micro-create-detail-body{min-height:0;overflow:auto;padding:10px}.micro-create-detail-frame{width:100%;height:100%;min-height:620px;border:0;border-radius:12px;background:#efe5cc}.micro-create-detail-summary{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 9px}.micro-create-detail-chip{padding:4px 8px;border:1px solid #a58b66;border-radius:999px;background:#fff8e7;font-size:.75rem}.micro-create-progression{width:100%;border-collapse:collapse;background:#fffaf0}.micro-create-progression th,.micro-create-progression td{border:1px solid #aa9270;padding:7px;vertical-align:top}.micro-create-progression th{background:#e2d4b8;text-align:left}.micro-create-subdetail{display:grid;gap:9px}.micro-create-subdetail section{padding:10px;border:1px solid #aa9270;border-radius:10px;background:#fffaf0}.micro-create-subdetail h3{margin:0 0 5px;color:#503868}
      @media(max-width:700px){.micro-create-detail-card{height:94vh}.micro-create-detail-frame{min-height:700px}}
    `;document.head.appendChild(s)
  }

  function ensureModal(){
    ensureCss();let m=$("microCreationCodexDetail");if(m)return m;
    m=document.createElement("div");m.id="microCreationCodexDetail";m.hidden=true;
    m.innerHTML='<article class="micro-create-detail-card"><header class="micro-create-detail-head"><div><small id="microCreationDetailKind">CODEX</small><h2 id="microCreationDetailTitle">Detalhes</h2></div><button type="button" class="btn" id="microCreationDetailClose">✕ Fechar</button></header><div class="micro-create-detail-body" id="microCreationDetailBody"></div></article>';
    document.body.appendChild(m);$("microCreationDetailClose").onclick=()=>m.hidden=true;m.onclick=e=>{if(e.target===m)m.hidden=true};return m
  }
  function openHtml(kind,title,html){const m=ensureModal();$("microCreationDetailKind").textContent=kind;$("microCreationDetailTitle").textContent=title;$("microCreationDetailBody").innerHTML=html;m.hidden=false}
  function openFrame(kind,title,src,summary=""){
    const m=ensureModal();$("microCreationDetailKind").textContent=kind;$("microCreationDetailTitle").textContent=title;
    $("microCreationDetailBody").innerHTML=`${summary}<iframe class="micro-create-detail-frame" src="${esc(src)}" loading="eager" title="${esc(title)}"></iframe>`;m.hidden=false
  }

  function openClass(key){
    const c=globalThis.MICROCOSMO_DATA?.classes?.[key]||{},chips=`<div class="micro-create-detail-summary"><span class="micro-create-detail-chip">Dado de Vida: <b>${esc(c.hit||"—")}</b></span><span class="micro-create-detail-chip">PV base: <b>${esc(c.hp||"—")}</b></span>${c.caster?`<span class="micro-create-detail-chip">Conjuração: <b>${esc(c.caster)}</b></span>`:""}<span class="micro-create-detail-chip">Subclasses no Nv.3: <b>${esc((c.subs||[]).length)}</b></span></div>`;
    if(key!=="barbaro"&&key!=="bardo"){
      openFrame("⚔️ FICHA COMPLETA DA CLASSE",c.name||key,`codex-revisao/classes-revisao.html?embed=1&classe=${encodeURIComponent(key)}`,chips);return
    }
    const rows=progressionRows(key),table=rows.length?`<table class="micro-create-progression"><thead><tr><th>Nível</th><th>Característica / Marco</th><th>Descrição</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2]||"")}</td></tr>`).join("")}</tbody></table>`:'<div class="micro-create-subdetail"><section>A progressão detalhada desta Classe ainda não foi localizada na fonte publicada.</section></div>';
    openHtml("⚔️ FICHA COMPLETA DA CLASSE",c.name||key,`${chips}<section class="micro-create-subdetail"><section><h3>Características iniciais</h3>${esc((c.features||[]).join(" • ")||"—")}</section><section><h3>Caminhos no nível 3</h3>${esc((c.subs||[]).join(" • ")||"—")}</section></section><h3 style="color:#503868">📈 Linha evolutiva</h3>${table}`)
  }
  function openRace(key){
    const r=raceCatalog()[key]||{},summary=`<div class="micro-create-detail-summary"><span class="micro-create-detail-chip">Deslocamento: <b>${esc(r.speed||"—")}</b></span><span class="micro-create-detail-chip">Sub-Raças/Ramos: <b>${esc((r.subs||[]).length)}</b></span></div>`;
    openFrame("🧬 FICHA COMPLETA DA RAÇA",r.name||key,`codex-revisao/racas-subracas-revisao.html?embed=1&raca=${encodeURIComponent(key)}`,summary)
  }
  function openSubrace(name){
    const key=state?.race||"",r=raceCatalog()[key]||{},d=r.subraceDetails?.[name]||{};
    openHtml("🌿 FICHA DA SUB-RAÇA",name,`<div class="micro-create-subdetail"><section><h3>🧬 Raça-base</h3>${esc(r.name||key||"—")}</section><section><h3>⚙️ Características</h3>${esc(d.effect||"Descrição mecânica não localizada.")}</section>${d.appearance?`<section><h3>👁 Aparência</h3>${esc(d.appearance)}</section>`:""}${d.culture?`<section><h3>🏘 Cultura</h3>${esc(d.culture)}</section>`:""}</div>`)
  }
  function openBackground(name){
    const names=originNames(),index=names.indexOf(name);if(index<0){openHtml("📜 ANTECEDENTE",name,"<div class='micro-create-subdetail'><section>Antecedente não localizado no catálogo oficial.</section></div>");return}
    openFrame("📜 FICHA COMPLETA DO ANTECEDENTE",name,`codex-revisao/origens-equipamentos-talentos-revisao.html?embed=1&secao=antecedentes&origem=${index+1}`)
  }

  function parseArg(button,fn){const raw=button.getAttribute("onclick")||"",m=raw.match(new RegExp(`${fn}\\('((?:\\\\'|[^'])*)'\\)`));return m?m[1].replace(/\\'/g,"'"):""}
  function currentStep(){return String($("microCreateTitle")?.textContent||"")}
  function wrapOption(button,kind,key,label){
    if(!button||button.parentElement?.classList.contains("micro-create-choice-wrap"))return;
    const wrap=document.createElement("div");wrap.className="micro-create-choice-wrap";button.before(wrap);wrap.appendChild(button);
    const view=document.createElement("button");view.type="button";view.className="micro-create-view";view.textContent=`👁 ${label}`;view.dataset.detailKind=kind;view.dataset.detailKey=key;wrap.appendChild(view)
  }
  function decorate(){
    fixDataSources();const body=$("microCreateBody");if(!body)return;const title=currentStep();
    const buttons=[...body.querySelectorAll(":scope > .micro-create-options > .micro-create-option")];
    if(/^1\.\s*Classe/i.test(title))buttons.forEach(b=>{const k=parseArg(b,"chooseClass");if(k)wrapOption(b,"class",k,"Ver Classe completa")});
    else if(/^2\.\s*Raça/i.test(title))buttons.forEach(b=>{const k=parseArg(b,"chooseRace");if(k)wrapOption(b,"race",k,"Ver Raça completa")});
    else if(/^3\.\s*Sub-Raça/i.test(title))buttons.forEach(b=>{const n=parseArg(b,"chooseSubrace")||b.querySelector("b")?.textContent?.trim();if(n)wrapOption(b,"subrace",n,"Ver Sub-Raça")});
    else if(/^4\.\s*Antecedente/i.test(title))buttons.forEach(b=>{const n=parseArg(b,"chooseBackground")||b.querySelector("b")?.textContent?.trim();if(n)wrapOption(b,"background",n,"Ver Antecedente completo")})
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate()})}
  function observe(){const body=$("microCreateBody");if(!body)return;bodyObserver?.disconnect();bodyObserver=new MutationObserver(()=>schedule());bodyObserver.observe(body,{childList:true,subtree:false});schedule()}

  document.addEventListener("click",e=>{
    const b=e.target.closest?.(".micro-create-view");if(!b)return;e.preventDefault();e.stopPropagation();
    if(b.dataset.detailKind==="class")openClass(b.dataset.detailKey);else if(b.dataset.detailKind==="race")openRace(b.dataset.detailKey);else if(b.dataset.detailKind==="subrace")openSubrace(b.dataset.detailKey);else if(b.dataset.detailKind==="background")openBackground(b.dataset.detailKey)
  },true);

  function boot(){fixDataSources();ensureModal();observe();const api=globalThis.MICROCOSMOS_CHARACTER_CREATION_API;if(api){const oldOpen=api.openWizard;if(oldOpen&&!oldOpen.__microCodexWrapped){const wrapped=function(){fixDataSources();const r=oldOpen.apply(this,arguments);setTimeout(()=>{try{api.render()}catch(_e){}observe()},0);return r};wrapped.__microCodexWrapped=true;api.openWizard=wrapped}try{if(!$("microCreationWizard")?.hidden)api.render()}catch(_e){}}schedule()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
  globalThis.MICROCOSMOS_CHARACTER_CREATION_CODEX_DETAILS_API={openClass,openRace,openSubrace,openBackground,decorate,fixDataSources};
})();
