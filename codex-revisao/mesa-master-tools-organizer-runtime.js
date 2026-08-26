/* MICROCOSMOS — Ferramentas do Mestre v2.1.
   Gavetas funcionais sem depender do reparenting da barra compacta.
   Esta versão preserva o estado manual das gavetas e ignora mutações internas
   do próprio acordeão para impedir ciclos de re-render/piscar.
*/
(async function(){
  if(globalThis.MICROCOSMOS_MASTER_TOOLS_ORGANIZER_V2)return;
  globalThis.MICROCOSMOS_MASTER_TOOLS_ORGANIZER_V2=true;

  const $=id=>document.getElementById(id);
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS||[];
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  let sb=null,session=null,profile=null,organizing=false,restMode="individual",restCharacterId="",approvalChannel=null;

  async function connect(){
    try{
      const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      sb=createClient("https://evyhhlbvhspiuwouivbb.supabase.co","sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:{session:s}}=await sb.auth.getSession();session=s;if(!session)return false;
      const {data:p}=await sb.from("profiles").select("id,role,approved").eq("id",session.user.id).maybeSingle();profile=p||null;
      return profile?.role==="master"&&profile?.approved!==false
    }catch(e){console.warn("MICROCOSMOS: Ferramentas do Mestre sem sessão",e);return false}
  }

  function ensureStyle(){
    if($("microMasterOrganizerStyleV2"))return;
    const s=document.createElement("style");s.id="microMasterOrganizerStyleV2";s.textContent=`
      .micro-master-drawer.micro-master-organized{width:min(590px,calc(100vw - 10px))!important;max-height:calc(100vh - 48px)!important;overflow:auto!important;padding:8px!important}
      .micro-master-accordion{display:grid;gap:7px}.micro-master-section{border:1px solid #9a8058;border-radius:12px;background:#fff7e6;overflow:hidden}.micro-master-section>summary{list-style:none;cursor:pointer;padding:11px 12px;background:#e8dcc2;color:#395b43;font-weight:bold;font-size:1rem;display:flex;align-items:center;justify-content:space-between;gap:8px}.micro-master-section>summary::-webkit-details-marker{display:none}.micro-master-section>summary:after{content:"＋"}.micro-master-section[open]>summary:after{content:"−"}.micro-master-section-body{padding:8px;display:grid;gap:8px}.micro-master-section-body>.panel,.micro-master-section-body>section.panel{margin:0!important;border:1px solid #a48d68!important;border-radius:10px!important;box-shadow:none!important;padding:8px!important;background:#fffaf0!important}
      #microMasterTools>#leftPanel,#microMasterTools>#rightPanel,#microMasterTools>#microCompactTableBar,#microMasterTools>#microCreatureButton{display:none!important}
      #microMasterOtherSection{display:none!important}
      .micro-tool-card{display:grid;gap:8px;padding:9px;border:1px solid #ae9875;border-radius:10px;background:#fffaf0}.micro-tool-row{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.micro-tool-row>*{flex:1}.micro-tool-card label{font-size:.72rem;font-weight:bold;color:#6a583f}.micro-tool-card select,.micro-tool-card input{width:100%;padding:8px;border:1px solid #a18b69;border-radius:8px;background:#fffdf6}.micro-tool-note{font-size:.74rem;color:#695943;background:#f0e7d4;border-left:4px solid #806945;border-radius:0 8px 8px 0;padding:7px}.micro-tool-btn{border:1px solid #755d3b;background:#efe2c4;color:#463626;border-radius:9px;padding:8px 10px;font-weight:bold}.micro-tool-btn.primary{background:#356342;color:#fff;border-color:#24472e}.micro-tool-btn.danger{background:#914744;color:#fff;border-color:#6d3330}.micro-tool-list{display:grid;gap:6px}.micro-player-tool{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:center;padding:8px;border:1px solid #ad9977;border-radius:9px;background:#fffdf7}.micro-player-tool small{display:block;color:#6d5b44;margin-top:2px}.micro-player-tool.selected{outline:2px solid #b58a3d}.micro-empty-tool{padding:10px;text-align:center;color:#74634d;background:#f5ecd8;border-radius:9px}
      .micro-approval-tool{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px;border:1px solid #aa9675;border-radius:9px;background:#fffdf7}.micro-approval-tool small{display:block;color:#6b5a43;margin-top:3px}.micro-approval-actions{display:flex;gap:5px}.micro-approval-actions button{min-width:82px}.micro-approval-count{display:inline-flex;min-width:24px;justify-content:center;border-radius:999px;padding:2px 7px;background:#5d3041;color:#fff;font-size:.75rem}
      .micro-rest-mode{display:grid;grid-template-columns:1fr 1fr;gap:7px}.micro-rest-mode button.active{background:#356342;color:#fff}.micro-rest-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.micro-rest-char{padding:8px;border:1px solid #ad9977;border-radius:9px;background:#fffdf7}.micro-rest-slot{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:center;padding:7px;border-top:1px dashed #b3a17f}.micro-rest-slot:first-of-type{border-top:0}.micro-rest-slot small{display:block;color:#6d5b44}.micro-rest-status{font-size:.78rem;font-weight:bold;min-height:1.3em;color:#365c43}
      @media(max-width:720px){.micro-master-drawer.micro-master-organized{left:5px!important;right:5px!important;top:42px!important;bottom:5px!important;width:auto!important;max-height:none!important;height:auto!important}.micro-master-section>summary{font-size:1rem;padding:12px}.micro-master-section-body{padding:7px}.micro-tool-row{display:grid;grid-template-columns:1fr 1fr}.micro-approval-tool{grid-template-columns:1fr}.micro-approval-actions button{flex:1}.micro-rest-actions{grid-template-columns:1fr 1fr}}
    `;document.head.appendChild(s)
  }

  function section(root,id,title,open=false){
    let d=$(id),created=false;
    if(!d){
      created=true;
      d=document.createElement("details");
      d.id=id;
      d.className="micro-master-section";
      d.innerHTML=`<summary>${title}</summary><div class="micro-master-section-body"></div>`;
      root.appendChild(d);
      if(open&&root.querySelectorAll(":scope>.micro-master-section[open]").length===0)d.open=true;
    }
    d.querySelector("summary").textContent=title;
    if(!d.dataset.v2Bound){
      d.dataset.v2Bound="1";
      d.addEventListener("toggle",()=>{
        if(!d.open)return;
        root.querySelectorAll(":scope>.micro-master-section").forEach(o=>{if(o!==d&&o.open)o.open=false});
        refreshSection(id)
      })
    }
    return {element:d,created}
  }
  const bodyOf=id=>$(id)?.querySelector(".micro-master-section-body");
  function clearLegacyBody(body,keepSelector=""){if(!body)return;for(const el of [...body.children]){if(el.matches?.("[data-master-v2]"))continue;if(keepSelector&&el.matches?.(keepSelector))continue;el.remove()}}
  function selectedToken(){const id=document.querySelector("#tokenLayer .token.selected")?.dataset?.token;return players.find(p=>String(p.id)===String(id))||null}
  function selectedId(){return selectedToken()?.id||""}
  function clickOriginal(id){const el=$(id);if(el){el.click();return true}return false}
  function dispatchOriginal(id,value){const el=$(id);if(!el)return false;el.value=value;el.dispatchEvent(new Event("change",{bubbles:true}));el.dispatchEvent(new Event("input",{bubbles:true}));return true}

  function renderTable(){
    const body=bodyOf("microMasterTableSection");if(!body)return;clearLegacyBody(body);
    const type=$("gridType")?.value||"square",size=+$("gridSize")?.value||70;
    const card=document.createElement("div");card.dataset.masterV2="1";card.className="micro-tool-card";card.innerHTML=`
      <div class="micro-tool-row"><label>Tipo do Grid<select id="microV2GridType"><option value="square" ${type==="square"?"selected":""}>Quadrado</option><option value="hex" ${type==="hex"?"selected":""}>Hexagonal</option><option value="none" ${type==="none"?"selected":""}>Sem Grid</option></select></label><label>Tamanho do Grid<input id="microV2GridSize" type="range" min="40" max="120" value="${size}"></label></div>
      <div class="micro-tool-row"><button class="micro-tool-btn" id="microV2GridMinus">− Grid</button><button class="micro-tool-btn" id="microV2GridPlus">+ Grid</button><button class="micro-tool-btn primary" id="microV2Map">🖼️ Carregar Mapa</button><button class="micro-tool-btn danger" id="microV2ClearMap">Remover Mapa</button></div>
      <div class="micro-tool-note">Esses controles usam o mesmo Grid e o mesmo mapa da Mesa; só foram reorganizados dentro da gaveta do Mestre.</div>`;
    body.appendChild(card);
    $("microV2GridType").onchange=e=>dispatchOriginal("gridType",e.target.value);
    $("microV2GridSize").oninput=e=>dispatchOriginal("gridSize",e.target.value);
    $("microV2GridMinus").onclick=()=>clickOriginal("gridMinus");$("microV2GridPlus").onclick=()=>clickOriginal("gridPlus");
    $("microV2Map").onclick=()=>$("mapFile")?.click();$("microV2ClearMap").onclick=()=>clickOriginal("clearMap")
  }

  function renderPlayers(){
    const body=bodyOf("microMasterPlayersSection");if(!body)return;clearLegacyBody(body);
    const card=document.createElement("div");card.dataset.masterV2="1";card.className="micro-tool-card";
    card.innerHTML=`<div class="micro-tool-row"><button class="micro-tool-btn primary" id="microV2AddSheet">🧙 Adicionar Ficha</button><button class="micro-tool-btn" id="microV2AddNpc">➕ Token / NPC</button></div><div class="micro-tool-list">${players.length?players.map(p=>`<div class="micro-player-tool ${String(p.id)===String(selectedId())?"selected":""}"><div><b>${esc(p.name||"Token")}</b><small>${esc(p.cls||p.classKey||"Sem Classe")} • PV ${+p.hp||0}/${+p.hpMax||0} • CA ${+p.ac||0}</small></div><button class="micro-tool-btn" data-master-select="${esc(p.id)}">Selecionar</button></div>`).join(""):'<div class="micro-empty-tool">Nenhum token na Mesa.</div>'}</div>`;
    body.appendChild(card);$("microV2AddSheet").onclick=()=>clickOriginal("microAddCharacterSide");$("microV2AddNpc").onclick=()=>clickOriginal("microAddFreeToken");
    card.querySelectorAll("[data-master-select]").forEach(b=>b.onclick=()=>{globalThis.MICROCOSMOS_TABLE_API?.selectToken?.(b.dataset.masterSelect);setTimeout(()=>{renderPlayers();renderToken()},80)})
  }

  function renderToken(){
    const body=bodyOf("microMasterTokenSection");if(!body)return;
    const card=$("tokenCard"),panel=card?.closest("section,.panel");
    for(const el of [...body.children])if(el!==panel)el.remove();
    if(panel){panel.style.removeProperty("display");panel.style.margin="0";body.appendChild(panel)}
    else body.innerHTML='<div class="micro-empty-tool" data-master-v2="1">Selecione um token no Grid.</div>'
  }

  function renderScene(){
    const body=bodyOf("microMasterSceneSection");if(!body)return;
    let panel=$("microSceneBuilder")||$("microSceneTools");
    if(!panel){panel=[...document.querySelectorAll("section.panel,.panel")].find(el=>/Construir Cen[aá]rio/i.test(el.textContent||""))||null}
    for(const el of [...body.children])if(el!==panel)el.remove();
    if(panel){panel.style.removeProperty("display");panel.style.margin="0";body.appendChild(panel)}
    else body.innerHTML='<div class="micro-empty-tool" data-master-v2="1">As ferramentas de cenário ainda estão carregando.</div>'
  }

  function renderCreatures(){
    const body=bodyOf("microMasterCreatureSection");if(!body)return;clearLegacyBody(body);
    const card=document.createElement("div");card.dataset.masterV2="1";card.className="micro-tool-card";card.innerHTML='<button class="micro-tool-btn primary" id="microV2CreatureOpen">👑 Abrir Codex de Criaturas IPM</button><div class="micro-tool-note">Abre o catálogo secreto do Mestre para consultar, editar e adicionar criaturas à Mesa.</div>';body.appendChild(card);
    $("microV2CreatureOpen").onclick=()=>{const b=$("microCreatureButton");if(b)b.click();else alert("O Codex de Criaturas IPM ainda está carregando.")}
  }

  async function renderApprovals(){
    const body=bodyOf("microMasterApprovalSection");if(!body||!sb)return;clearLegacyBody(body);body.innerHTML='<div class="micro-empty-tool" data-master-v2="1">Carregando aprovações pendentes…</div>';
    const {data,error}=await sb.from("interactions").select("id,sender_id,target_id,kind,payload,status,created_at").eq("status","pending_master").order("created_at",{ascending:false}).limit(50);
    if(error){body.innerHTML=`<div class="micro-empty-tool" data-master-v2="1">${esc(error.message)}</div>`;return}
    const rows=data||[];body.innerHTML=`<div class="micro-tool-card" data-master-v2="1"><div><b>Solicitações aguardando decisão</b> <span class="micro-approval-count">${rows.length}</span></div><div class="micro-tool-note">Somente pendências aparecem aqui. Reprovações antigas não voltam a cada nova ação.</div><div class="micro-tool-list">${rows.length?rows.map(r=>{const p=r.payload||{},combat=r.kind==="combat_effect",heal=p.effect==="healing";return `<div class="micro-approval-tool"><div><b>${combat?(heal?"💚 ":"💥 ")+esc(p.spell_name||p.source_name||"Efeito de combate"):esc(r.kind)}</b><small>${combat?`${esc(p.caster_name||"Personagem")} → ${esc(p.target_name||"alvo")} • ${heal?"Cura":"Dano"} ${+p.amount||0} PV`:"Solicitação pendente"}</small></div><div class="micro-approval-actions"><button class="micro-tool-btn primary" data-approve="${r.id}">✓ Aprovar</button><button class="micro-tool-btn danger" data-reject="${r.id}">✕ Rejeitar</button></div></div>`}).join(""):'<div class="micro-empty-tool">Nenhuma aprovação pendente.</div>'}</div></div>`;
    body.querySelectorAll("[data-approve]").forEach(b=>b.onclick=()=>reviewApproval(b.dataset.approve,true));body.querySelectorAll("[data-reject]").forEach(b=>b.onclick=()=>reviewApproval(b.dataset.reject,false))
  }
  async function reviewApproval(id,approve){const {error}=await sb.rpc("review_interaction",{interaction_id:id,approve,note:null});if(error){alert("Não foi possível revisar: "+error.message);return}try{const shared=globalThis.MICROCOSMOS_MESA_SHARED;await shared?.reloadTokens?.();await globalThis.MICROCOSMOS_TABLE_COMBAT_DATA?.refresh?.();for(const token of players.filter(p=>p?.linked&&p?.id))await shared?.flushToken?.(token.id,true)}catch(_e){}await renderApprovals()}

  function slotRows(slots){const out=[];for(let l=1;l<=9;l++){const row=Array.isArray(slots)?(slots[l]??slots[l-1]):(slots?.[l]??slots?.[String(l)]);if(!row)continue;out.push({level:l,max:+(row.max??row.total??0)||0,used:+(row.used??0)||0})}return out}
  async function charactersOnTable(){
    const ids=[...new Set(players.filter(p=>p.linked&&p.characterId&&!String(p.characterId).startsWith("local-")).map(p=>String(p.characterId)))];if(!ids.length)return[];
    const {data,error}=await sb.from("characters").select("id,name,data").in("id",ids);if(error)return[];return data||[]
  }
  async function selectedCharacter(){const token=selectedToken();if(!token?.linked||!token.characterId||String(token.characterId).startsWith("local-"))return null;const {data}=await sb.from("characters").select("id,name,data").eq("id",token.characterId).maybeSingle();return data||null}
  function charName(row){return row?.data?.charName||row?.name||"Personagem"}

  async function renderRest(){
    const body=bodyOf("microMasterRestSection");if(!body||!sb)return;clearLegacyBody(body);body.innerHTML='<div class="micro-empty-tool" data-master-v2="1">Carregando personagens…</div>';
    const group=await charactersOnTable(),selected=await selectedCharacter();if(selected&&!restCharacterId)restCharacterId=selected.id;if(!restCharacterId&&group[0])restCharacterId=group[0].id;
    const chosen=group.find(r=>String(r.id)===String(restCharacterId))||selected||group[0]||null;
    const scopeRows=restMode==="group"?group:(chosen?[chosen]:[]);
    const slotHtml=scopeRows.length?scopeRows.map(row=>{const spent=slotRows(row.data?.magic?.slots||{}).filter(s=>s.used>0);return `<div class="micro-rest-char"><b>${esc(charName(row))}</b>${spent.length?spent.map(s=>s.level<=6?`<div class="micro-rest-slot"><div>${s.level}º Círculo — ${s.used}/${s.max} gasto(s)<small>DC: ${s.level<=3?1:2} PRM por Slot</small></div><button class="micro-tool-btn" data-rest-slot="${row.id}|${s.level}">Recuperar 1</button></div>`:`<div class="micro-rest-slot"><div>${s.level}º Círculo — ${s.used}/${s.max} gasto(s)<small>Recuperação especial.</small></div><span>🔒</span></div>`).join(""):'<div class="micro-tool-note">Sem Slots Mágicos gastos.</div>'}</div>`}).join(""):'<div class="micro-empty-tool">Adicione uma ficha vinculada à Mesa para usar Descanso.</div>';
    body.innerHTML=`<div class="micro-tool-card" data-master-v2="1"><div class="micro-rest-mode"><button class="micro-tool-btn ${restMode==="individual"?"active":""}" id="microRestIndividual">👤 Individual</button><button class="micro-tool-btn ${restMode==="group"?"active":""}" id="microRestGroup">👥 Grupo</button></div>${group.length?`<label>Personagem para descanso individual<select id="microRestCharacter">${group.map(r=>`<option value="${r.id}" ${String(r.id)===String(chosen?.id)?"selected":""}>${esc(charName(r))}</option>`).join("")}</select></label>`:""}<div class="micro-rest-actions"><button class="micro-tool-btn" id="microShortRest">🌙 Descanso Curto ${restMode==="group"?"do Grupo":"Individual"}</button><button class="micro-tool-btn primary" id="microLongRest">🌌 Descanso Longo ${restMode==="group"?"do Grupo":"Individual"}</button></div><div class="micro-tool-note">No DC, o Mestre escolhe manualmente os Slots recuperados: 1º–3º Círculo = 1 PRM por Slot; 4º–6º = 2 PRM. No DL, os Slots rotineiros de 1º–6º são recuperados. 7º–9º permanecem sob regras especiais.</div><div id="microRestSlotList" class="micro-tool-list">${slotHtml}</div><div class="micro-rest-status" id="microRestStatus"></div></div>`;
    $("microRestIndividual").onclick=()=>{restMode="individual";renderRest()};$("microRestGroup").onclick=()=>{restMode="group";renderRest()};
    $("microRestCharacter")?.addEventListener("change",e=>{restCharacterId=e.target.value;restMode="individual";renderRest()});
    $("microShortRest").onclick=()=>{const st=$("microRestStatus");if(st)st.textContent=restMode==="group"?"🌙 DC do Grupo iniciado. Use ‘Recuperar 1’ em cada Slot permitido pelo PRM de cada personagem.":"🌙 DC individual iniciado. Use ‘Recuperar 1’ nos Slots permitidos pelo PRM."};
    $("microLongRest").onclick=()=>applyLongRest(scopeRows);
    body.querySelectorAll("[data-rest-slot]").forEach(b=>b.onclick=()=>{const [id,level]=b.dataset.restSlot.split("|");recoverOne(id,+level)})
  }
  async function recoverOne(characterId,level){const status=$("microRestStatus");if(status)status.textContent="Recuperando Slot…";const {error}=await sb.rpc("master_recover_spell_slot",{target_character:characterId,rest_kind:"short",slot_level:level,amount:1});if(error){if(status)status.textContent=`⚠️ ${error.message}`;return}if(status)status.textContent=`✅ 1 Slot de ${level}º Círculo recuperado.`;try{await globalThis.MICROCOSMOS_TABLE_COMBAT_DATA?.refresh?.()}catch(_e){}setTimeout(renderRest,180)}
  async function applyLongRest(rows){if(!rows.length)return;const label=restMode==="group"?"todo o grupo":"este personagem";if(!confirm(`Aplicar Descanso Longo em ${label} e recuperar os Slots rotineiros de 1º–6º Círculo?`))return;const status=$("microRestStatus");if(status)status.textContent="Aplicando Descanso Longo…";let ok=0,fail=0;for(const row of rows){const {error}=await sb.rpc("master_recover_spell_slot",{target_character:row.id,rest_kind:"long",slot_level:null,amount:1});if(error)fail++;else ok++}if(status)status.textContent=fail?`⚠️ DL aplicado em ${ok}; falhou em ${fail}.`:`✅ Descanso Longo aplicado em ${ok} personagem(ns).`;try{await globalThis.MICROCOSMOS_TABLE_COMBAT_DATA?.refresh?.()}catch(_e){}setTimeout(renderRest,220)}

  function refreshSection(id){if(id==="microMasterTableSection")renderTable();else if(id==="microMasterPlayersSection")renderPlayers();else if(id==="microMasterTokenSection")renderToken();else if(id==="microMasterSceneSection")renderScene();else if(id==="microMasterCreatureSection")renderCreatures();else if(id==="microMasterApprovalSection")renderApprovals();else if(id==="microMasterRestSection")renderRest()}

  function organize(){
    if(organizing)return;organizing=true;
    try{
      const drawer=$("microMasterDrawer"),tools=$("microMasterTools");if(!drawer||!tools)return;ensureStyle();drawer.classList.add("micro-master-organized");
      let root=$("microMasterAccordion");if(!root){root=document.createElement("div");root.id="microMasterAccordion";root.className="micro-master-accordion";tools.prepend(root)}
      section(root,"microMasterTableSection","🗺️ Mesa, Grid & Mapa",true);section(root,"microMasterPlayersSection","👥 Jogadores & Tokens");section(root,"microMasterTokenSection","🎲 Token selecionado");section(root,"microMasterSceneSection","🛠️ Construir Cenário");section(root,"microMasterCreatureSection","👑 Criaturas IPM");section(root,"microMasterApprovalSection","✅ Aprovações");section(root,"microMasterRestSection","🌙 Descanso & Slots Mágicos");
      $("microMasterOtherSection")?.remove();
      if(!root.dataset.masterInitialRender){root.dataset.masterInitialRender="1";for(const d of root.querySelectorAll(":scope>.micro-master-section[open]"))refreshSection(d.id)}
    }finally{organizing=false}
  }

  if(!await connect())return;
  let tries=0;while(!$("microMasterDrawer")&&tries++<140)await wait(100);organize();
  const obs=new MutationObserver(mutations=>{
    const external=mutations.some(m=>{
      const target=m.target?.nodeType===1?m.target:m.target?.parentElement;
      return !target?.closest?.("#microMasterAccordion")
    });
    if(!external)return;
    clearTimeout(obs._t);obs._t=setTimeout(organize,120)
  });
  obs.observe(document.body,{childList:true,subtree:true});
  document.addEventListener("click",e=>{if(e.target?.closest?.("#tokenLayer [data-token]")){setTimeout(()=>{if($("microMasterPlayersSection")?.open)renderPlayers();if($("microMasterTokenSection")?.open)renderToken();if($("microMasterRestSection")?.open)renderRest()},120)}},true);
  approvalChannel=sb.channel("microcosmos-master-tools-v2").on("postgres_changes",{event:"*",schema:"public",table:"interactions"},()=>{if($("microMasterApprovalSection")?.open)renderApprovals()}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"characters"},()=>{if($("microMasterRestSection")?.open)renderRest()}).subscribe();
  globalThis.MICROCOSMOS_MASTER_TOOLS={organize,renderRest,renderApprovals,renderPlayers,renderTable};
})();
