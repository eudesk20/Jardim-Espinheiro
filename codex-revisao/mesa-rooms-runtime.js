/* MICROCOSMOS — Salas de campanha.
   A escolha fica local ao navegador; dados e permissões são validados no Supabase. */
(function(){
  if(globalThis.MICROCOSMOS_ROOMS)return;
  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const STORAGE_KEY="MICROCOSMOS_ACTIVE_ROOM_V1";
  const LEGACY_KEY="microcosmos-main";
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")}catch(_e){}
  globalThis.MICROCOSMOS_ACTIVE_ROOM_ID=saved?.roomId||LEGACY_KEY;

  let resolveReady;
  const ready=new Promise(resolve=>resolveReady=resolve);
  const state={ready,room:null,membership:null,legacy:false,canMaster:false};
  globalThis.MICROCOSMOS_ROOMS=state;

  const esc=value=>String(value??"").replace(/[&<>\"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const modeName=mode=>mode==="ai"?"Mestre Bot IA":mode==="assisted"?"Mestre + ajuda da IA":"Mestre humano";
  function finish(context){
    Object.assign(state,context);
    globalThis.MICROCOSMOS_ROOM_CONTEXT=state;
    globalThis.MICROCOSMOS_ACTIVE_ROOM_ID=state.room?.room_id||LEGACY_KEY;
    document.body.dataset.roomRole=state.membership?.member_role||"player";
    document.body.classList.toggle("micro-room-spectator",state.membership?.member_role==="spectator");
    document.body.dataset.roomMasterMode=state.room?.master_mode||"human";
    const label=document.getElementById("sessionLabel");if(label)label.textContent=`MICROCOSMOS • ${state.room?.room_name||"Mesa atual"} • ${modeName(state.room?.master_mode||"human")}`;
    if(!state.canMaster){document.body.classList.remove("micro-role-master-active");document.body.classList.add("micro-room-player")}
    resolveReady(state);
    document.dispatchEvent(new CustomEvent("microcosmos:room-ready",{detail:state}));
  }
  function styles(){
    if(document.getElementById("microRoomsStyle"))return;
    const style=document.createElement("style");style.id="microRoomsStyle";style.textContent=`
      .micro-room-launch{position:fixed;right:12px;bottom:12px;z-index:96;border:1px solid #c9a862;border-radius:999px;background:#25283d;color:#fff7d7;padding:9px 13px;font-weight:bold;box-shadow:0 5px 18px #0008}
      .micro-room-overlay{position:fixed;inset:0;z-index:10000;background:#07100dda;display:grid;place-items:center;padding:12px;overflow:auto}
      .micro-room-panel{width:min(760px,100%);max-height:94vh;overflow:auto;background:#efe5cc;color:#30271e;border:4px double #9a7844;border-radius:20px;padding:16px;box-shadow:0 18px 70px #000}
      .micro-room-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.micro-room-head h2{margin:0;color:#405d3e}.micro-room-tabs,.micro-room-actions{display:flex;gap:7px;flex-wrap:wrap}.micro-room-panel button,.micro-room-panel input,.micro-room-panel select{font:inherit;border:1px solid #8c7552;border-radius:9px;padding:9px;background:#fff8e7;color:#30271e}.micro-room-panel button{font-weight:bold;cursor:pointer}.micro-room-panel button.primary{background:#356342;color:#fff}.micro-room-panel button.dark{background:#25283d;color:#fff}.micro-room-form{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.micro-room-form[hidden]{display:none!important}.micro-room-form label{display:grid;gap:3px;font-size:.8rem}.micro-room-form .wide{grid-column:1/-1}.micro-room-list{display:grid;gap:8px;margin:12px 0}.micro-room-card{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;background:#fff8e7;border:1px solid #aa9472;border-radius:12px;padding:10px}.micro-room-code{font-family:monospace;letter-spacing:.08em}.micro-room-error{color:#873c38;min-height:1.2em;margin:8px 0}.micro-room-muted{color:#75654e;font-size:.78rem}@media(max-width:620px){.micro-room-overlay{align-items:end;padding:0}.micro-room-panel{border-radius:18px 18px 0 0;max-height:88vh}.micro-room-form{grid-template-columns:1fr}.micro-room-form .wide{grid-column:auto}.micro-room-launch{bottom:70px}}
      .micro-admission-card{position:fixed;left:12px;bottom:12px;z-index:9990;width:min(370px,calc(100% - 24px));background:#fff8e7;border:3px double #9a7844;border-radius:15px;padding:11px;box-shadow:0 12px 36px #000a}.micro-admission-card h3{margin:0 0 5px;color:#405d3e}.micro-admission-actions{display:flex;gap:6px;margin-top:8px}.micro-admission-actions button{flex:1}.micro-admission-card[hidden]{display:none}
      body.micro-room-spectator #tokenLayer .token,body.micro-room-spectator #addToken{pointer-events:none!important}body.micro-room-spectator #addToken{display:none!important}body.micro-room-spectator #sessionLabel:after{content:" • 👁️ Espectador (somente leitura)"}
    `;document.head.appendChild(style)
  }
  function openPicker(client,rooms,profile,{required=false}={}){
    styles();document.getElementById("microRoomOverlay")?.remove();
    const overlay=document.createElement("div");overlay.id="microRoomOverlay";overlay.className="micro-room-overlay";
    overlay.innerHTML=`<section class="micro-room-panel" role="dialog" aria-modal="true" aria-labelledby="microRoomTitle">
      <div class="micro-room-head"><div><h2 id="microRoomTitle">🏰 Salas de campanha</h2><div class="micro-room-muted">Cada sala guarda seu próprio mapa, cenário e participantes.</div></div>${required?"":'<button data-close>Fechar</button>'}</div>
      <div class="micro-room-list">${rooms.map(r=>`<article class="micro-room-card"><div><b>${esc(r.room_name)}</b><br><span class="micro-room-code">${esc(r.room_code)}</span> · ${esc(modeName(r.master_mode))}<br><small>${r.participant_count}/${r.max_participants} participantes · ${r.has_password?"🔒 Com senha":"Sem senha"}</small></div><button class="primary" data-enter="${esc(r.room_id)}">Entrar</button></article>`).join("")||'<div class="micro-room-muted">Você ainda não participa de nenhuma sala nova.</div>'}</div>
      ${profile?.role==="master"?'<button data-legacy class="dark">Abrir minha Mesa atual (legado)</button>':""}
      <div class="micro-room-tabs"><button data-tab="create" class="primary">＋ Criar sala</button><button data-tab="join">🔑 Entrar com código</button></div>
      <form id="microRoomCreate" class="micro-room-form"><label class="wide">Nome da sala<input name="name" required minlength="2" maxlength="80" placeholder="Ex.: A Torre do Vale"></label><label>Limite de pessoas<input name="limit" type="number" min="1" max="30" value="6"></label><label>Senha opcional<input name="password" type="password" minlength="4" autocomplete="new-password"></label><label class="wide">Quem conduz<select name="mode"><option value="human">Mestre humano</option><option value="assisted">Mestre com ajuda da IA</option><option value="ai">Mestre Bot com IA (estrutura pronta; IA será ligada depois)</option></select></label><button class="primary wide" type="submit">Criar e entrar</button></form>
      <form id="microRoomJoin" class="micro-room-form" hidden><label>Código da sala<input name="code" required maxlength="12" autocomplete="off"></label><label>Senha, se houver<input name="password" type="password" autocomplete="current-password"></label><button class="primary wide" type="submit">Entrar na sala</button></form>
      <div id="microRoomError" class="micro-room-error"></div>
    </section>`;
    document.body.appendChild(overlay);
    const error=message=>overlay.querySelector("#microRoomError").textContent=message||"";
    const selectRoom=room=>{localStorage.setItem(STORAGE_KEY,JSON.stringify({roomId:room.room_id,roomName:room.room_name||"Mesa atual"}));location.reload()};
    overlay.querySelectorAll("[data-enter]").forEach(btn=>btn.onclick=()=>selectRoom(rooms.find(r=>r.room_id===btn.dataset.enter)));
    overlay.querySelector("[data-close]")?.addEventListener("click",()=>overlay.remove());
    overlay.querySelector("[data-legacy]")?.addEventListener("click",()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify({roomId:LEGACY_KEY}));location.reload()});
    overlay.querySelectorAll("[data-tab]").forEach(btn=>btn.onclick=()=>{const create=btn.dataset.tab==="create";overlay.querySelector("#microRoomCreate").hidden=!create;overlay.querySelector("#microRoomJoin").hidden=create;error("")});
    overlay.querySelector("#microRoomCreate").onsubmit=async event=>{event.preventDefault();error("");const form=new FormData(event.currentTarget);const {data,e}=await (async()=>{const {data,error}=await client.rpc("create_room",{p_name:form.get("name"),p_max_participants:+form.get("limit"),p_password:form.get("password")||null,p_master_mode:form.get("mode")});return{data,e:error}})();if(e)return error(e.message);selectRoom({room_id:data?.[0]?.room_id})};
    overlay.querySelector("#microRoomJoin").onsubmit=async event=>{event.preventDefault();error("");const form=new FormData(event.currentTarget);const {data,e}=await (async()=>{const {data,error}=await client.rpc("join_room",{p_room_code:String(form.get("code")||"").trim(),p_password:form.get("password")||null});return{data,e:error}})();if(e)return error(e.message);if(data?.[0]?.member_role==="pending"){alert("Solicitação enviada. Aguarde a autorização do Mestre.");location.href="lobby.html";return}selectRoom({room_id:data?.[0]?.room_id,room_name:data?.[0]?.room_name})};
  }
  function startModeration(client,room){
    if(!room?.room_id||!(room.is_owner||room.member_role==="master"))return;styles();let busy=false;
    async function refresh(){if(busy)return;busy=true;try{const {data,error}=await client.rpc("list_room_members",{p_room_id:room.room_id});if(error)return;const pending=(data||[]).find(m=>m.member_status==="pending");let card=document.getElementById("microAdmissionCard");if(!pending){if(card)card.hidden=true;return}if(!card){card=document.createElement("aside");card.id="microAdmissionCard";card.className="micro-admission-card";document.body.appendChild(card)}card.hidden=false;card.innerHTML=`<h3>👑 Pedido para entrar</h3><b>${esc(pending.display_name)}</b><div class="micro-room-muted">Ao aprovar, entrará como Espectador e não poderá controlar tokens.</div><div class="micro-admission-actions"><button class="primary" data-admit="approve">Aprovar</button><button data-admit="reject">Recusar</button><button class="dark" data-admit="block">Bloquear</button></div>`;card.querySelectorAll("[data-admit]").forEach(btn=>btn.onclick=async()=>{btn.disabled=true;const {error:e}=await client.rpc("moderate_room_member",{p_room_id:room.room_id,p_user_id:pending.user_id,p_action:btn.dataset.admit});if(e)alert(e.message);busy=false;await refresh()})}finally{busy=false}}
    refresh();setInterval(refresh,4000)
  }
  function watchAccess(client,room){if(!room?.room_id||room.room_id===LEGACY_KEY)return;const initialRole=room.member_role;setInterval(async()=>{const {data}=await client.rpc("list_my_rooms"),current=(data||[]).find(r=>r.room_id===room.room_id&&r.member_status==="active");if(!current){alert("Seu acesso a esta sala foi encerrado pelo Mestre.");location.href="lobby.html";return}if(current.member_role!==initialRole){location.reload()}},5000)}
  (async()=>{
    try{
      const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      const client=globalThis.MICROCOSMOS_SUPABASE||createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:{session}}=await client.auth.getSession();
      if(!session){finish({room:{room_id:LEGACY_KEY,room_name:"Mesa local"},membership:{member_role:"player"},legacy:true,canMaster:false});return}
      const [{data:rooms,error},{data:profile}]=await Promise.all([client.rpc("list_my_rooms"),client.from("profiles").select("role,approved").eq("id",session.user.id).maybeSingle()]);
      if(error)throw error;
      const active=(rooms||[]).find(r=>r.room_id===saved?.roomId&&r.member_status==="active");
      if(saved?.roomId===LEGACY_KEY&&profile?.role==="master")finish({room:{room_id:LEGACY_KEY,room_name:"Mesa atual",master_mode:"human"},membership:{member_role:"owner"},legacy:true,canMaster:true,client,session});
      else if(active){const canMaster=["owner","master"].includes(active.member_role)&&active.master_mode!=="ai";finish({room:active,membership:active,legacy:false,canMaster,client,session});startModeration(client,active);watchAccess(client,active)}
      else openPicker(client,rooms||[],profile,{required:true});
      const launch=document.createElement("button");launch.className="micro-room-launch";launch.textContent=active?`🏰 ${active.room_name}`:"🏰 Salas";launch.onclick=()=>location.href="lobby.html";document.body.appendChild(launch);
    }catch(error){console.warn("MICROCOSMOS Salas:",error);finish({room:{room_id:LEGACY_KEY,room_name:"Mesa atual"},membership:{member_role:"player"},legacy:true,canMaster:false,error})}
  })();
})();
