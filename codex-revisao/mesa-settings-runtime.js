/* MICROCOSMOS — Configurações da Mesa v1.
   Separação oficial:
   - 👑 Mesa e Regras: regras compartilhadas/autoridade do Mestre.
   - 👤 Minha Experiência: preferências locais de interface de cada jogador.
   Nesta primeira versão, as opções controlam o sistema de Reações já implementado.
*/
(async function(){
  if(globalThis.MICROCOSMOS_MESA_SETTINGS)return;

  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const SESSION_KEY="microcosmos-main";
  const PLAYER_KEY="MICROCOSMOS_PLAYER_EXPERIENCE_V1";
  const TABLE_LOCAL_KEY="MICROCOSMOS_TABLE_RULES_V1";
  const $=id=>document.getElementById(id);

  const TABLE_DEFAULTS={
    reactions:true,
    opportunityAttack:true,
    opportunityMagic:true,
    specialReactions:true
  };
  const PLAYER_DEFAULTS={
    preset:"assisted",
    notifyReactions:true,
    autoOpenReaction:true,
    showOpportunityAttack:true,
    showOpportunityMagic:true,
    showSpecialReactions:true,
    showEmptyGroups:true,
    showReactionDetails:true
  };
  const PRESETS={
    root:{preset:"root",notifyReactions:true,autoOpenReaction:false,showOpportunityAttack:true,showOpportunityMagic:true,showSpecialReactions:true,showEmptyGroups:false,showReactionDetails:false},
    assisted:{preset:"assisted",notifyReactions:true,autoOpenReaction:true,showOpportunityAttack:true,showOpportunityMagic:true,showSpecialReactions:true,showEmptyGroups:true,showReactionDetails:true},
    practical:{preset:"practical",notifyReactions:true,autoOpenReaction:true,showOpportunityAttack:true,showOpportunityMagic:true,showSpecialReactions:true,showEmptyGroups:false,showReactionDetails:false}
  };

  const readJson=(key,fallback)=>{try{return{...fallback,...JSON.parse(localStorage.getItem(key)||"{}")}}catch{return{...fallback}}};
  const saveJson=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(_e){}};
  let table=readJson(TABLE_LOCAL_KEY,TABLE_DEFAULTS),player=readJson(PLAYER_KEY,PLAYER_DEFAULTS);
  let supabase=null,session=null,isMaster=false,channel=null,saveTimer=null,manualOpenId="";

  function tableRule(key,fallback=true){return key in table?!!table[key]:fallback}
  function playerRule(key,fallback=true){return key in player?!!player[key]:fallback}
  function emitChange(){window.dispatchEvent(new CustomEvent("microcosmos:settings-change",{detail:{table:{...table},player:{...player}}}));syncReactionUi();render()}

  async function connect(){
    try{
      const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      supabase=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:{session:s}}=await supabase.auth.getSession();session=s;if(!session)return false;
      const {data:p}=await supabase.from("profiles").select("role,approved").eq("id",session.user.id).maybeSingle();
      isMaster=p?.role==="master"&&p?.approved!==false;return true
    }catch(e){console.warn("MICROCOSMOS Configurações: modo local",e);return false}
  }
  async function loadTable(){
    if(!supabase||!session)return;
    const {data,error}=await supabase.from("mesa_session_state").select("data").eq("session_key",SESSION_KEY).maybeSingle();
    if(error)return console.warn("MICROCOSMOS Configurações: falha ao ler regras",error);
    const remote=data?.data?.reactionSettings;if(remote&&typeof remote==="object"){table={...TABLE_DEFAULTS,...remote};saveJson(TABLE_LOCAL_KEY,table);emitChange()}
  }
  async function saveTableNow(){
    saveJson(TABLE_LOCAL_KEY,table);if(!supabase||!session||!isMaster)return;
    const {data:row}=await supabase.from("mesa_session_state").select("data").eq("session_key",SESSION_KEY).maybeSingle();
    const next={...(row?.data||{}),reactionSettings:{...table}};
    const {error}=await supabase.from("mesa_session_state").upsert({session_key:SESSION_KEY,data:next,updated_by:session.user.id,updated_at:new Date().toISOString()},{onConflict:"session_key"});
    if(error)console.warn("MICROCOSMOS Configurações: falha ao salvar regras",error)
  }
  function scheduleTableSave(){saveJson(TABLE_LOCAL_KEY,table);clearTimeout(saveTimer);saveTimer=setTimeout(saveTableNow,180)}
  function subscribe(){
    if(!supabase||!session)return;
    channel=supabase.channel(`mesa-settings-${SESSION_KEY}`).on("postgres_changes",{event:"*",schema:"public",table:"mesa_session_state",filter:`session_key=eq.${SESSION_KEY}`},payload=>{
      const remote=payload.new?.data?.reactionSettings;if(remote&&typeof remote==="object"){table={...TABLE_DEFAULTS,...remote};saveJson(TABLE_LOCAL_KEY,table);emitChange()}
    }).subscribe()
  }

  function ensureCss(){
    if($("microSettingsStyle"))return;const s=document.createElement("style");s.id="microSettingsStyle";s.textContent=`
      #microSettingsModal{position:fixed;inset:0;z-index:260;background:#07100bc9;display:grid;place-items:center;padding:12px}#microSettingsModal[hidden]{display:none}
      .micro-settings-card{width:min(760px,96vw);max-height:90vh;overflow:auto;background:#efe5cc;border:3px double #735e3e;border-radius:18px;box-shadow:0 18px 50px #000b;color:#30271e}
      .micro-settings-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;background:#263c30;color:#f5e4ad}.micro-settings-head h2{margin:0;color:#f2d68e}
      .micro-settings-body{padding:12px}.micro-settings-tabs{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}.micro-settings-tab.active{background:#356342;color:white}
      .micro-settings-pane{display:none}.micro-settings-pane.active{display:block}.micro-settings-note{font-size:.76rem;color:#6c5842;background:#fff7df;border:1px solid #c8b18b;border-radius:9px;padding:8px;margin-bottom:10px}
      .micro-settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.micro-setting{display:flex;gap:9px;align-items:flex-start;padding:9px;border:1px solid #b9a17b;border-radius:10px;background:#fffaf0}.micro-setting input{margin-top:3px;transform:scale(1.15)}.micro-setting b{display:block}.micro-setting small{display:block;color:#725f49;margin-top:2px}
      .micro-presets{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0 12px}.micro-preset{padding:9px 6px;border:1px solid #876d49;border-radius:9px;background:#fff8e7;font-weight:bold}.micro-preset.active{background:#356342;color:#fff}
      #microReactionPendingOpen{display:none;width:100%;margin:0 0 7px;padding:9px;border:2px solid #c28b4c;border-radius:10px;background:#fff0c7;color:#482e1f;font-weight:bold}#microReactionPendingOpen.active{display:block}
      #microReactionWindow.micro-settings-collapsed{display:none!important}#microReactionWindow.micro-settings-compact .micro-reaction-detail,#microReactionWindow.micro-settings-compact .micro-reaction-choice small{display:none!important}
      @media(max-width:720px){.micro-settings-grid{grid-template-columns:1fr}.micro-presets{grid-template-columns:1fr 1fr}.micro-settings-card{max-height:94vh}}
    `;document.head.appendChild(s)
  }
  function check(key,label,desc,scope){const val=scope==="table"?tableRule(key):playerRule(key);return `<label class="micro-setting"><input type="checkbox" data-setting-scope="${scope}" data-setting-key="${key}" ${val?"checked":""}><span><b>${label}</b><small>${desc}</small></span></label>`}
  function render(){
    const modal=$("microSettingsModal");if(!modal)return;
    const tableTab=$("microSettingsTableTab"),tablePane=$("microSettingsTablePane");if(tableTab)tableTab.hidden=!isMaster;if(tablePane)tablePane.hidden=!isMaster;
    if($("microSettingsTableGrid"))$("microSettingsTableGrid").innerHTML=[
      check("reactions","↩️ Sistema de Reações","Liga ou desliga todas as Reações automáticas da Mesa.","table"),
      check("opportunityAttack","⚔️ Ataque de Oportunidade","Permite ataques corpo a corpo quando um inimigo abandona o alcance.","table"),
      check("opportunityMagic","✨ Magia de Oportunidade","Permite Truques válidos de 1 Ação e tipo Ataque.","table"),
      check("specialReactions","🌟 Reações Especiais","Permite habilidades, itens e magias explicitamente marcados como Reação.","table")
    ].join("");
    if($("microSettingsPlayerGrid"))$("microSettingsPlayerGrid").innerHTML=[
      check("notifyReactions","🔔 Avisar quando houver Reação","Mostra o aviso de que uma Reação ficou disponível.","player"),
      check("autoOpenReaction","🚨 Abrir janela automaticamente","Se desligado, aparece apenas um botão discreto para abrir a Reação quando você quiser.","player"),
      check("showOpportunityAttack","⚔️ Mostrar Ataque de Oportunidade","Exibe esta categoria quando houver opção válida.","player"),
      check("showOpportunityMagic","✨ Mostrar Magia de Oportunidade","Exibe Truques válidos como opção de Reação.","player"),
      check("showSpecialReactions","🌟 Mostrar Reações Especiais","Exibe habilidades, itens e magias especiais compatíveis com o gatilho.","player"),
      check("showEmptyGroups","🧭 Mostrar categorias vazias","Útil no modo assistido para entender o que foi verificado pelo sistema.","player"),
      check("showReactionDetails","📖 Mostrar detalhes e explicações","Exibe alcance, tipo e informações auxiliares nas opções de Reação.","player")
    ].join("");
    document.querySelectorAll(".micro-preset").forEach(b=>b.classList.toggle("active",b.dataset.preset===player.preset))
  }
  function ensureUi(){
    ensureCss();if(!$("microSettingsOpen")){
      const host=document.querySelector(".head-actions");if(host){const b=document.createElement("button");b.type="button";b.className="btn dark";b.id="microSettingsOpen";b.textContent="⚙️ Configurações";host.appendChild(b)}
    }
    if(!$("microSettingsModal")){
      const modal=document.createElement("div");modal.id="microSettingsModal";modal.hidden=true;modal.innerHTML=`<div class="micro-settings-card"><div class="micro-settings-head"><h2>⚙️ Configurações da Mesa</h2><button class="btn" id="microSettingsClose">✕ Fechar</button></div><div class="micro-settings-body"><div class="micro-settings-tabs"><button class="btn micro-settings-tab" id="microSettingsTableTab" data-settings-tab="table">👑 Mesa e Regras</button><button class="btn micro-settings-tab active" data-settings-tab="player">👤 Minha Experiência</button></div><section class="micro-settings-pane" id="microSettingsTablePane" data-settings-pane="table"><div class="micro-settings-note"><b>Regras compartilhadas.</b> Só o Mestre altera. Essas opções mudam o comportamento oficial da Mesa para todos.</div><div class="micro-settings-grid" id="microSettingsTableGrid"></div></section><section class="micro-settings-pane active" data-settings-pane="player"><div class="micro-settings-note"><b>Ao gosto do cliente 😄</b> Estas opções mudam apenas como a interface ajuda você; não alteram as regras da campanha.</div><div class="micro-presets"><button class="micro-preset" data-preset="root">🎲 Modo Raiz</button><button class="micro-preset" data-preset="assisted">🧭 Assistido</button><button class="micro-preset" data-preset="practical">⚡ Prático</button><button class="micro-preset" data-preset="custom">🛠️ Personalizado</button></div><div class="micro-settings-grid" id="microSettingsPlayerGrid"></div></section></div></div>`;document.body.appendChild(modal)
    }
    if(!$("microReactionPendingOpen")){
      const b=document.createElement("button");b.type="button";b.id="microReactionPendingOpen";b.textContent="↩️ Reação disponível — abrir opções";const shell=document.querySelector(".map-shell"),viewport=$("viewport");if(shell&&viewport)shell.insertBefore(b,viewport)
    }
    $("microSettingsOpen")?.addEventListener("click",()=>{$("microSettingsModal").hidden=false;render()});
    $("microSettingsClose")?.addEventListener("click",()=>$("microSettingsModal").hidden=true);
    $("microSettingsModal")?.addEventListener("click",e=>{if(e.target===$("microSettingsModal"))$("microSettingsModal").hidden=true});
    $("microReactionPendingOpen")?.addEventListener("click",()=>{const w=globalThis.MICROCOSMOS_REACTION_API?.active;manualOpenId=String(w?.id||Date.now());syncReactionUi()});
    document.addEventListener("click",e=>{
      const tab=e.target.closest?.("[data-settings-tab]");if(tab){document.querySelectorAll(".micro-settings-tab").forEach(x=>x.classList.toggle("active",x===tab));document.querySelectorAll(".micro-settings-pane").forEach(x=>x.classList.toggle("active",x.dataset.settingsPane===tab.dataset.settingsTab));return}
      const preset=e.target.closest?.("[data-preset]");if(preset){const key=preset.dataset.preset;if(key!=="custom"&&PRESETS[key])player={...PLAYER_DEFAULTS,...PRESETS[key]};else player={...player,preset:"custom"};saveJson(PLAYER_KEY,player);emitChange();return}
    });
    document.addEventListener("change",e=>{const input=e.target.closest?.("[data-setting-key]");if(!input)return;const key=input.dataset.settingKey,scope=input.dataset.settingScope;if(scope==="table"){if(!isMaster)return;table={...table,[key]:!!input.checked};scheduleTableSave()}else{player={...player,[key]:!!input.checked,preset:"custom"};saveJson(PLAYER_KEY,player)}emitChange()});
    render()
  }

  function groupKind(section){const h=section?.querySelector("h4")?.textContent||"";if(/Ataque de Oportunidade/i.test(h))return"attack";if(/Magia de Oportunidade/i.test(h))return"magic";if(/Reação Especial/i.test(h))return"special";return""}
  function syncReactionUi(){
    const box=$("microReactionWindow"),pending=$("microReactionPendingOpen");if(!box||!pending)return;
    const active=box.classList.contains("active"),w=globalThis.MICROCOSMOS_REACTION_API?.active,wid=String(w?.id||"");
    if(!active){box.classList.remove("micro-settings-collapsed","micro-settings-compact");pending.classList.remove("active");manualOpenId="";return}
    const shouldCollapse=!playerRule("autoOpenReaction",true)&&manualOpenId!==wid;
    box.classList.toggle("micro-settings-collapsed",shouldCollapse);pending.classList.toggle("active",shouldCollapse);
    box.classList.toggle("micro-settings-compact",!playerRule("showReactionDetails",true));
    box.querySelectorAll(".micro-reaction-group").forEach(section=>{
      const kind=groupKind(section);let visible=true;
      if(kind==="attack")visible=playerRule("showOpportunityAttack",true);
      if(kind==="magic")visible=playerRule("showOpportunityMagic",true);
      if(kind==="special")visible=playerRule("showSpecialReactions",true);
      if(visible&&!playerRule("showEmptyGroups",true)&&section.querySelector(".micro-reaction-empty"))visible=false;
      section.style.display=visible?"":"none"
    })
  }

  globalThis.MICROCOSMOS_MESA_SETTINGS={
    version:1,
    tableRule,playerRule,
    getTable:()=>({...table}),getPlayer:()=>({...player}),
    isMaster:()=>isMaster,
    setTable:(key,value)=>{if(!isMaster)return false;table={...table,[key]:!!value};scheduleTableSave();emitChange();return true},
    setPlayer:(key,value)=>{player={...player,[key]:value,preset:"custom"};saveJson(PLAYER_KEY,player);emitChange();return true},
    applyPreset:key=>{if(!PRESETS[key])return false;player={...PLAYER_DEFAULTS,...PRESETS[key]};saveJson(PLAYER_KEY,player);emitChange();return true},
    syncReactionUi
  };

  ensureUi();const online=await connect();if(online){await loadTable();subscribe()}emitChange();
  const observer=new MutationObserver(syncReactionUi);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});setInterval(syncReactionUi,300);
})();
