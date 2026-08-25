/* MICROCOSMOS — Ferramentas do Mestre organizadas em gavetas internas.
   Evita painéis empilhados sobre o Grid e concentra Mesa, Tokens, Cenário,
   Aprovações e Descanso/Slots em um único painel navegável. */
(async function(){
  if(globalThis.MICROCOSMOS_MASTER_TOOLS_ORGANIZER)return;
  globalThis.MICROCOSMOS_MASTER_TOOLS_ORGANIZER=true;
  const $=id=>document.getElementById(id),players=globalThis.MICROCOSMOS_TABLE_PLAYERS||[];
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  let sb=null,session=null,profile=null,organizing=false,lastSelected="";

  async function connect(){
    try{
      const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      sb=createClient("https://evyhhlbvhspiuwouivbb.supabase.co","sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:{session:s}}=await sb.auth.getSession();session=s;if(!session)return false;
      const {data:p}=await sb.from("profiles").select("id,role,approved").eq("id",session.user.id).maybeSingle();profile=p;
      return profile?.role==="master"&&profile?.approved!==false
    }catch(e){console.warn("MICROCOSMOS: organizador do Mestre sem sessão",e);return false}
  }

  function ensureStyle(){if($("microMasterOrganizerStyle"))return;const s=document.createElement("style");s.id="microMasterOrganizerStyle";s.textContent=`
    .micro-master-drawer.micro-master-organized{width:min(560px,calc(100vw - 10px))!important;max-height:calc(100vh - 48px)!important;overflow:auto!important;padding:8px!important}
    .micro-master-accordion{display:grid;gap:7px}.micro-master-section{border:1px solid #9a8058;border-radius:12px;background:#fff7e6;overflow:hidden}.micro-master-section>summary{list-style:none;cursor:pointer;padding:11px 12px;background:#e8dcc2;color:#395b43;font-weight:bold;font-size:1rem;display:flex;align-items:center;justify-content:space-between;gap:8px}.micro-master-section>summary::-webkit-details-marker{display:none}.micro-master-section>summary:after{content:"＋";font-weight:bold}.micro-master-section[open]>summary:after{content:"−"}.micro-master-section-body{padding:8px;display:grid;gap:8px}.micro-master-section-body>.panel,.micro-master-section-body>section.panel{margin:0!important;border:1px solid #a48d68!important;border-radius:10px!important;box-shadow:none!important;padding:8px!important;background:#fffaf0!important}.micro-master-section-body #leftPanel,.micro-master-section-body #rightPanel{display:contents!important}.micro-master-organized #microMasterTools>#leftPanel,.micro-master-organized #microMasterTools>#rightPanel{display:none!important}.micro-master-section-body #microCompactTableBar{position:static!important;margin:0!important;width:100%!important;flex-wrap:wrap!important}.micro-master-section-body #microCreatureButton{position:static!important;margin:0!important;width:100%!important}.micro-master-section-body #microApprovalBadge{position:static!important;display:block!important;width:100%!important;border-radius:10px!important;text-align:center!important}.micro-master-section-body #microApprovalPanel{position:static!important;inset:auto!important;width:100%!important;max-height:none!important;overflow:visible!important;box-shadow:none!important;border:1px solid #9a8058!important;border-radius:10px!important;padding:8px!important}.micro-master-section-body #microApprovalPanel[hidden]{display:none!important}
    .micro-rest-card{display:grid;gap:8px}.micro-rest-target{padding:8px;border-radius:9px;background:#efe5cc}.micro-rest-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:center;padding:7px;border:1px solid #b09a76;border-radius:9px;background:#fffdf7}.micro-rest-row small{display:block;color:#6d5b44;margin-top:2px}.micro-rest-row button{min-width:116px}.micro-rest-note{font-size:.72rem;color:#6c5a43;background:#f0e8d7;border-left:4px solid #7f6745;padding:7px;border-radius:0 8px 8px 0}.micro-rest-status{font-size:.75rem;font-weight:bold;color:#365c43;min-height:1.2em}.micro-rest-high{opacity:.75}
    @media(max-width:720px){.micro-master-drawer.micro-master-organized{left:5px!important;right:5px!important;top:42px!important;bottom:5px!important;width:auto!important;max-height:none!important;height:auto!important}.micro-master-section>summary{font-size:1.02rem;padding:12px}.micro-master-section-body{padding:7px}.micro-rest-row{grid-template-columns:1fr}.micro-rest-row button{width:100%}}
  `;document.head.appendChild(s)}

  function makeSection(root,id,title,open=false){let d=$(id);if(d)return d;d=document.createElement("details");d.id=id;d.className="micro-master-section";d.open=open;d.innerHTML=`<summary>${title}</summary><div class="micro-master-section-body"></div>`;root.appendChild(d);d.addEventListener("toggle",()=>{if(!d.open)return;root.querySelectorAll(":scope>.micro-master-section").forEach(other=>{if(other!==d)other.open=false});if(id==="microMasterRestSection")renderRest()});return d}
  const bodyOf=id=>$(id)?.querySelector(".micro-master-section-body");
  function panelTitle(el){return String(el?.querySelector?.("h1,h2,h3,.ribbon,summary")?.textContent||el?.textContent||"").replace(/\s+/g," ").trim()}
  function move(el,body){if(!el||!body||body.contains(el))return;el.style.removeProperty("position");el.style.removeProperty("inset");body.appendChild(el)}

  function organize(){
    if(organizing)return;organizing=true;
    try{
      const drawer=$("microMasterDrawer"),tools=$("microMasterTools");if(!drawer||!tools)return;
      ensureStyle();drawer.classList.add("micro-master-organized");
      let root=$("microMasterAccordion");if(!root){root=document.createElement("div");root.id="microMasterAccordion";root.className="micro-master-accordion";tools.prepend(root)}
      makeSection(root,"microMasterTableSection","🗺️ Mesa, Grid & Mapa",true);
      makeSection(root,"microMasterPlayersSection","👥 Jogadores & Tokens");
      makeSection(root,"microMasterTokenSection","🎲 Token selecionado");
      makeSection(root,"microMasterSceneSection","🛠️ Construir Cenário");
      makeSection(root,"microMasterCreatureSection","👑 Criaturas IPM");
      makeSection(root,"microMasterApprovalSection","✅ Aprovações");
      makeSection(root,"microMasterRestSection","🌙 Descanso & Slots Mágicos");
      makeSection(root,"microMasterOtherSection","⚙️ Outras Ferramentas");

      move($("microCompactTableBar"),bodyOf("microMasterTableSection"));
      move($("microCreatureButton"),bodyOf("microMasterCreatureSection"));
      const approvalBadge=$("microApprovalBadge");if(approvalBadge)move(approvalBadge,bodyOf("microMasterApprovalSection"));
      const approvalPanel=$("microApprovalPanel");if(approvalPanel)move(approvalPanel,bodyOf("microMasterApprovalSection"));

      for(const wrapper of [$("leftPanel"),$("rightPanel")]){
        if(!wrapper)continue;
        for(const child of [...wrapper.children]){
          const t=panelTitle(child).toLowerCase();
          if(/rolagens da mesa/.test(t))continue;
          if(/preparar mesa|grid|mapa/.test(t))move(child,bodyOf("microMasterTableSection"));
          else if(/jogadores|personagem da ficha|tokens/.test(t))move(child,bodyOf("microMasterPlayersSection"));
          else if(/token selecionado/.test(t))move(child,bodyOf("microMasterTokenSection"));
          else if(/construir cen[aá]rio|barreira|parede|janela/.test(t))move(child,bodyOf("microMasterSceneSection"));
          else move(child,bodyOf("microMasterOtherSection"));
        }
      }
      const sceneCandidates=[...tools.querySelectorAll(".panel,section,div")].filter(el=>el!==root&&!el.closest(".micro-master-section")&&/construir cen[aá]rio/i.test(panelTitle(el)));
      sceneCandidates.forEach(el=>move(el,bodyOf("microMasterSceneSection")));
      let createdRest=false;if(!$("microMasterRestCard")){const card=document.createElement("div");card.id="microMasterRestCard";card.className="micro-rest-card";bodyOf("microMasterRestSection").appendChild(card);createdRest=true}
      if(createdRest)setTimeout(renderRest,0);
    }finally{organizing=false}
  }

  function selectedToken(){const id=document.querySelector("#tokenLayer .token.selected")?.dataset?.token;return players.find(p=>String(p.id)===String(id))||null}
  function slotRows(slots){const out=[];for(let l=1;l<=9;l++){const row=Array.isArray(slots)?(slots[l]??slots[l-1]):(slots?.[l]??slots?.[String(l)]);if(!row)continue;out.push({level:l,max:+(row.max??row.total??0)||0,used:+(row.used??0)||0})}return out}
  async function getCharacter(token){if(!token?.linked||!token.characterId||String(token.characterId).startsWith("local-"))return null;const {data,error}=await sb.from("characters").select("id,name,data").eq("id",token.characterId).maybeSingle();if(error)return null;return data}

  async function renderRest(){
    const card=$("microMasterRestCard");if(!card||!sb)return;
    const token=selectedToken();if(!token){card.innerHTML='<div class="micro-rest-note">Selecione um personagem no Grid para controlar Descanso Curto/Longo e Slots Mágicos.</div>';return}
    if(!token.linked||!token.characterId){card.innerHTML=`<div class="micro-rest-target"><b>${esc(token.name)}</b></div><div class="micro-rest-note">Este é um token/NPC sem ficha vinculada. O controle de Slot Mágico é feito somente em personagens com ficha.</div>`;return}
    card.innerHTML=`<div class="micro-rest-target"><b>${esc(token.name)}</b><br><small>Carregando Slots Mágicos…</small></div>`;
    const row=await getCharacter(token);if(!row){card.innerHTML=`<div class="micro-rest-target"><b>${esc(token.name)}</b></div><div class="micro-rest-note">Não foi possível localizar a ficha vinculada.</div>`;return}
    const slots=slotRows(row.data?.magic?.slots||{}),spent=slots.filter(s=>s.used>0);
    card.innerHTML=`<div class="micro-rest-target"><b>${esc(row.data?.charName||row.name||token.name)}</b><br><small>Recuperação controlada pelo Mestre.</small></div><div class="micro-rest-note">🌙 <b>DC:</b> 1º–3º custa 1 PRM por Slot; 4º–6º custa 2 PRM. O Mestre escolhe abaixo conforme o PRM disponível. 🌌 <b>DL:</b> recupera os Slots rotineiros de 1º–6º. 7º–9º continuam exigindo seus requisitos especiais.</div>${spent.length?spent.map(s=>s.level<=6?`<div class="micro-rest-row"><div><b>${s.level}º Círculo</b> — ${s.used}/${s.max} gasto(s)<small>DC: ${s.level<=3?1:2} PRM por Slot</small></div><button class="btn" data-micro-recover="${s.level}">🌙 Recuperar 1</button></div>`:`<div class="micro-rest-row micro-rest-high"><div><b>${s.level}º Círculo</b> — ${s.used}/${s.max} gasto(s)<small>Recuperação especial exigida pelo sistema.</small></div><span>🔒</span></div>`).join(""):'<div class="micro-rest-note">Todos os Slots disponíveis já estão recuperados.</div>'}<button class="btn primary" id="microLongRestSlots">🌌 DL — Recuperar Slots 1º–6º</button><div class="micro-rest-status" id="microRestStatus"></div>`;
    card.querySelectorAll("[data-micro-recover]").forEach(b=>b.onclick=()=>recover(row.id,"short",+b.dataset.microRecover,1));
    $("microLongRestSlots").onclick=()=>recover(row.id,"long",null,1)
  }

  async function recover(characterId,kind,level,amount){
    const status=$("microRestStatus");if(status)status.textContent="Aplicando recuperação…";
    const args={target_character:characterId,rest_kind:kind,slot_level:level,amount};
    const {error}=await sb.rpc("master_recover_spell_slot",args);
    if(error){if(status)status.textContent=`⚠️ ${error.message}`;return}
    if(status)status.textContent=kind==="long"?"✅ Descanso Longo aplicado aos Slots de 1º–6º.":`✅ 1 Slot de ${level}º Círculo recuperado durante o DC.`;
    try{await globalThis.MICROCOSMOS_TABLE_COMBAT_DATA?.refresh?.();await globalThis.MICROCOSMOS_MESA_SHARED?.reloadTokens?.()}catch(_e){}
    setTimeout(renderRest,180)
  }

  if(!await connect())return;
  let tries=0;while(!$("microMasterDrawer")&&tries++<120)await wait(100);organize();
  const obs=new MutationObserver(()=>{clearTimeout(obs._t);obs._t=setTimeout(()=>{organize();const id=document.querySelector("#tokenLayer .token.selected")?.dataset?.token||"";if(id!==lastSelected){lastSelected=id;renderRest()}},80)});
  obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class","hidden"]});
  document.addEventListener("click",e=>{if(e.target?.closest?.("#tokenLayer [data-token]"))setTimeout(renderRest,120)},true);
  globalThis.MICROCOSMOS_MASTER_TOOLS={organize,renderRest};
})();
