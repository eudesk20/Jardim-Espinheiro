/* MICROCOSMOS — Mestre: Ver Ficha + Log do Jogador por characterId.
   O Log vem de public.character_logs e é somente leitura no cliente.
*/
(async function(){
  if(globalThis.MICROCOSMOS_MESA_MASTER_CHARACTER_AUDIT)return;
  globalThis.MICROCOSMOS_MESA_MASTER_CHARACTER_AUDIT=true;

  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  if(!Array.isArray(players))return;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  let supabase=null,role="player",queued=false,lastCharacterId="";

  function isMaster(){return role==="master"||document.documentElement.dataset.microcosmosRole==="master"||document.documentElement.dataset.mesaRole==="master"||document.body.classList.contains("micro-online-master")||document.body.classList.contains("micro-mesa-master")}
  function selected(){const el=document.querySelector("#tokenLayer .token.selected");return el?players.find(p=>p.id===el.dataset.token):null}
  function className(k){return globalThis.MICROCOSMO_DATA?.classes?.[k]?.name||k||"—"}
  function raceName(k){return globalThis.MICROCOSMO_DATA?.races?.[k]?.name||k||"—"}
  function fmtDate(value){try{return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"medium"}).format(new Date(value))}catch{return String(value||"")}}
  function rankLabel(v){return +v>=2?"Especialização":+v===1?"Proficiente":""}

  function ensureCss(){
    if($("microMasterCharacterAuditStyle"))return;
    const s=document.createElement("style");s.id="microMasterCharacterAuditStyle";s.textContent=`
      .micro-master-character-links{display:grid;grid-template-columns:1fr 1fr;gap:6px}.micro-master-character-links .btn{width:100%}
      #microMasterCharacterAuditModal{position:fixed;inset:0;z-index:180000;background:#07100ddd;display:grid;place-items:center;padding:12px;color:#30271e}#microMasterCharacterAuditModal[hidden]{display:none}
      .micro-master-audit-card{width:min(900px,98vw);max-height:92vh;overflow:auto;background:#efe5cc;border:4px double #b58a3d;border-radius:20px;padding:14px;box-shadow:0 22px 70px #000b}.micro-master-audit-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;position:sticky;top:-14px;background:#efe5cc;padding:8px 0;z-index:2}.micro-master-audit-head h2{margin:0;color:#405d3e}.micro-master-audit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.micro-master-audit-section{background:#fffaf0;border:1px solid #a58b66;border-radius:11px;padding:9px}.micro-master-audit-section h3{margin:0 0 6px;color:#523b69}.micro-master-audit-attrs{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}.micro-master-audit-attr{text-align:center;border:1px solid #b39a74;border-radius:9px;background:#fff8e7;padding:7px}.micro-master-audit-attr b{display:block;font-size:1.15rem}.micro-master-audit-list{margin:0;padding-left:18px}.micro-master-audit-log{width:100%;border-collapse:collapse;font-size:.82rem}.micro-master-audit-log th,.micro-master-audit-log td{border:1px solid #b49a72;padding:7px;vertical-align:top}.micro-master-audit-log th{background:#e2d4b8;text-align:left}.micro-master-audit-log th:first-child,.micro-master-audit-log td:first-child{width:175px;white-space:nowrap}.micro-master-audit-empty{text-align:center;padding:18px;border:1px dashed #a78c65;border-radius:10px;background:#fff8e7;color:#6d5a43}
      @media(max-width:700px){.micro-master-audit-grid{grid-template-columns:1fr}.micro-master-audit-attrs{grid-template-columns:repeat(3,1fr)}.micro-master-audit-log th:first-child,.micro-master-audit-log td:first-child{width:auto;white-space:normal}.micro-master-character-links{grid-template-columns:1fr}}
    `;document.head.appendChild(s)
  }

  function ensureModal(){
    ensureCss();let modal=$("microMasterCharacterAuditModal");if(modal)return modal;
    modal=document.createElement("div");modal.id="microMasterCharacterAuditModal";modal.hidden=true;
    modal.innerHTML='<article class="micro-master-audit-card"><div class="micro-master-audit-head"><div><small id="microMasterAuditKind">FICHA</small><h2 id="microMasterAuditTitle">Personagem</h2><div id="microMasterAuditSubtitle" style="font-size:.75rem;color:#6d5a43"></div></div><button type="button" class="btn" id="microMasterAuditClose">✕ Fechar</button></div><div id="microMasterAuditBody"></div></article>';
    document.body.appendChild(modal);$("microMasterAuditClose").onclick=()=>modal.hidden=true;modal.onclick=e=>{if(e.target===modal)modal.hidden=true};return modal
  }
  function openLoading(kind,title){const modal=ensureModal();modal.hidden=false;$("microMasterAuditKind").textContent=kind;$("microMasterAuditTitle").textContent=title||"Personagem";$("microMasterAuditSubtitle").textContent="";$("microMasterAuditBody").innerHTML='<div class="micro-master-audit-empty">Carregando...</div>';return modal}

  function renderSheet(row){
    const d=row?.data||{},stats=d.stats||{},skills=Object.entries(d.skillRanks||{}).filter(([,v])=>+v>0),eq=d.equipment||[],bag=d.bag||[],cart=d.cart||[],known=d.magic?.known||[],recipes=d.classCraft?.recipes||[],projects=d.classCraft?.projects||[],p2=d.p2||{};
    $("microMasterAuditKind").textContent="📄 FICHA DO JOGADOR";$("microMasterAuditTitle").textContent=d.charName||row?.name||"Personagem";$("microMasterAuditSubtitle").textContent=`Atualizada em ${fmtDate(row?.updated_at)}`;
    const li=arr=>arr.length?`<ul class="micro-master-audit-list">${arr.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:'<span style="color:#75644e">Nenhum registro.</span>';
    const eqNames=eq.map(x=>x.name||x.catalogId||"Equipamento"),bagNames=bag.map(x=>`${x.name||"Item"} ×${+x.qty||0}`),cartNames=cart.map(x=>`${x.name||"Item"} ×${+x.qty||0}`),spellNames=known.map(x=>x.name||x.id||"Magia"),skillNames=skills.map(([name,r])=>`${name} — ${rankLabel(r)}`),craftNames=[...recipes.map(x=>`Receita: ${x.id||x}`),...projects.map(x=>`Projeto: ${x.id||x}`)];
    $("microMasterAuditBody").innerHTML=`
      <div class="micro-master-audit-grid">
        <section class="micro-master-audit-section"><h3>🧙 Identidade</h3><b>Classe:</b> ${esc(className(d.cls))}${d.sub?` — ${esc(d.sub)}`:""}<br><b>Nível:</b> ${+d.level||1} • <b>XP:</b> ${+d.xp||0}<br><b>Raça:</b> ${esc(raceName(d.race))}${d.subrace?` — ${esc(d.subrace)}`:""}<br><b>Antecedente:</b> ${esc(d.background||"—")}<br><b>Kit Inicial:</b> ${esc(d.startingKit||"—")}</section>
        <section class="micro-master-audit-section"><h3>❤️ Combate</h3><b>PV:</b> ${+d.hpNow||0}/${+d.hpMax||0} • <b>PV Temp.:</b> ${+d.hpTemp||0}<br><b>Inspiração:</b> ${esc(d.inspiration||"—")}<br><b>Carrinho:</b> ${esc(d.cartType||"none")}</section>
        <section class="micro-master-audit-section" style="grid-column:1/-1"><h3>💪 Atributos</h3><div class="micro-master-audit-attrs">${["FOR","DES","CON","INT","SAB","CAR"].map(k=>`<div class="micro-master-audit-attr"><small>${k}</small><b>${Number(stats[k])||10}</b></div>`).join("")}</div></section>
        <section class="micro-master-audit-section"><h3>🎯 Perícias</h3>${li(skillNames)}</section>
        <section class="micro-master-audit-section"><h3>⚔️ Equipamentos</h3>${li(eqNames)}</section>
        <section class="micro-master-audit-section"><h3>🎒 Mochila</h3>${li(bagNames)}</section>
        <section class="micro-master-audit-section"><h3>🛒 Carrinho</h3>${li(cartNames)}</section>
        <section class="micro-master-audit-section"><h3>✨ Magias conhecidas</h3>${li(spellNames)}</section>
        <section class="micro-master-audit-section"><h3>📚 Conhecimento de Ofício</h3>${li(craftNames)}</section>
        <section class="micro-master-audit-section"><h3>💰 Recursos</h3>SF: <b>${+p2.sf||0}</b> • PS: <b>${+p2.ps||0}</b> • RS: <b>${+p2.rs||0}</b> • Âmbar: <b>${+p2.amber||0}</b></section>
      </div>`
  }

  async function openSheet(p){
    if(!isMaster()||!p?.linked||!p.characterId)return;
    openLoading("📄 FICHA DO JOGADOR",p.name);
    const {data,error}=await supabase.from("characters").select("id,user_id,name,data,updated_at").eq("id",p.characterId).maybeSingle();
    if(error||!data){$("microMasterAuditBody").innerHTML=`<div class="micro-master-audit-empty">Não foi possível carregar esta ficha.${error?`<br><small>${esc(error.message)}</small>`:""}</div>`;return}renderSheet(data)
  }

  async function openLog(p){
    if(!isMaster()||!p?.linked||!p.characterId)return;
    lastCharacterId=p.characterId;openLoading("📜 LOG DO JOGADOR",p.name);
    const {data,error}=await supabase.from("character_logs").select("id,info,created_at").eq("character_id",p.characterId).order("created_at",{ascending:false}).limit(300);
    $("microMasterAuditKind").textContent="📜 LOG DO JOGADOR";$("microMasterAuditTitle").textContent=p.name||"Personagem";$("microMasterAuditSubtitle").textContent="Histórico separado exclusivamente desta ficha • mais recente primeiro";
    if(error){$("microMasterAuditBody").innerHTML=`<div class="micro-master-audit-empty">Não foi possível carregar o Log.<br><small>${esc(error.message)}</small></div>`;return}
    $("microMasterAuditBody").innerHTML=(data||[]).length?`<table class="micro-master-audit-log"><thead><tr><th>Data/Hora</th><th>Informação</th></tr></thead><tbody>${data.map(row=>`<tr><td>${esc(fmtDate(row.created_at))}</td><td>${esc(row.info)}</td></tr>`).join("")}</tbody></table>`:'<div class="micro-master-audit-empty">Ainda não existem alterações registradas para esta ficha.</div>'
  }

  function inject(){
    if(!isMaster())return;
    const p=selected(),tools=$("tokenCard")?.querySelector(".micro-token-tools");if(!p?.linked||!p.characterId||!tools)return;
    let row=tools.querySelector(".micro-master-character-links");if(row&&row.dataset.characterId===p.characterId)return;
    row?.remove();row=document.createElement("div");row.className="micro-master-character-links";row.dataset.characterId=p.characterId;row.innerHTML='<button type="button" class="btn primary" data-master-view-sheet>📄 Ver Ficha Jogador</button><button type="button" class="btn" data-master-view-log>📜 Log do Jogador</button>';tools.appendChild(row);
    row.querySelector("[data-master-view-sheet]").onclick=()=>openSheet(p);row.querySelector("[data-master-view-log]").onclick=()=>openLog(p)
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;inject()})}

  try{
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");supabase=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    const {data:{session}}=await supabase.auth.getSession();if(!session)return;
    const {data:profile}=await supabase.from("profiles").select("role,approved").eq("id",session.user.id).maybeSingle();role=profile?.approved?profile?.role||"player":"player";
    if(!isMaster())return;
    ensureCss();ensureModal();schedule();
    const card=$("tokenCard");if(card)new MutationObserver(schedule).observe(card,{childList:true,subtree:true});
    document.addEventListener("click",e=>{if(e.target.closest?.("#tokenLayer .token,[data-token]"))setTimeout(schedule,0)},true);
    globalThis.MICROCOSMOS_MESA_MASTER_CHARACTER_AUDIT_API={openSheet,openLog,refresh:schedule,get lastCharacterId(){return lastCharacterId}}
  }catch(e){console.warn("MICROCOSMOS: auditoria da ficha do Mestre indisponível",e)}
})();
