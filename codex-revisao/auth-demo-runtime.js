/* MICROCOSMOS — Login de demonstração local.
   IMPORTANTE: este modo serve para testar fluxo e visibilidade no GitHub Pages.
   Como o site é estático e público, NÃO é segurança real para IPM.
   A versão definitiva deve mover autenticação, aprovação e conteúdo IPM para backend. */
(function(){
  const USERS_KEY="MICROCOSMOS_AUTH_DEMO_USERS_V1";
  const SESSION_KEY="MICROCOSMOS_AUTH_DEMO_SESSION_V1";
  const MASTER_HASH="28f90c8237514d311f73ee6ee9c966c2b01b8b15c62242938184c7d30b00e0db";
  const PLAYER_HASH="5b874f46a8d48e0d526a288b8d7994144c01d80af65d3fb6426cb02c55f8e468";
  let currentUser=null;
  let originalCodexEntries=typeof codexEntries==="function"?codexEntries:null;

  const escAuth=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  async function sha256(text){
    const data=new TextEncoder().encode(text);
    const hash=await crypto.subtle.digest("SHA-256",data);
    return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }
  function loadUsers(){
    let users=[];try{users=JSON.parse(localStorage.getItem(USERS_KEY)||"[]")}catch{}
    const defaults=[
      {username:"mestre.teste",passwordHash:MASTER_HASH,role:"master",approved:true,label:"Mestre de Teste",builtIn:true},
      {username:"jogador.teste",passwordHash:PLAYER_HASH,role:"player",approved:true,label:"Jogador de Teste",builtIn:true}
    ];
    for(const def of defaults){const i=users.findIndex(u=>u.username===def.username);if(i<0)users.push(def);else users[i]={...users[i],...def}}
    localStorage.setItem(USERS_KEY,JSON.stringify(users));return users;
  }
  function saveUsers(users){localStorage.setItem(USERS_KEY,JSON.stringify(users))}
  function session(){return localStorage.getItem(SESSION_KEY)||""}
  function setSession(username){if(username)localStorage.setItem(SESSION_KEY,username);else localStorage.removeItem(SESSION_KEY)}
  function isMasterEntry(entry){
    if(!entry)return false;
    const tags=[...(entry.tags||[])].map(x=>String(x).toLowerCase());
    const data=entry.data||{};
    return entry.access==="master"||entry.visibility==="master"||data.access==="master"||data.visibility==="master"||entry.category==="master"||tags.some(t=>t==="ipm"||t.includes("informação para o mestre")||t.includes("informacao para o mestre")||t.includes("somente mestre")||t.includes("secreto do mestre"));
  }
  function masterReadableEntry(entry){
    if(!entry||entry.discovered!==false)return entry;
    return {
      ...entry,
      discovered:true,
      masterOriginalDiscovered:false,
      tags:[...(entry.tags||[]),"🔒 Ainda não descoberto pelos Jogadores"],
      data:{...(entry.data||{}),masterOriginalDiscovered:false}
    };
  }
  if(originalCodexEntries){
    codexEntries=function(){
      const all=originalCodexEntries();
      if(currentUser?.role==="master")return all.map(masterReadableEntry);
      return all.filter(entry=>!isMasterEntry(entry));
    };
  }

  function ensureStyles(){
    if(document.getElementById("microAuthStyles"))return;
    const style=document.createElement("style");style.id="microAuthStyles";style.textContent=`
      #microAuthOverlay{position:fixed;inset:0;z-index:100000;background:radial-gradient(circle at 50% 0,#273e32,#08100b 70%);display:grid;place-items:center;padding:16px;color:#2f271e}
      #microAuthOverlay[hidden]{display:none}.micro-auth-card{width:min(470px,100%);background:#efe5cc;border:4px double #b58a3d;border-radius:24px;padding:18px;box-shadow:0 22px 70px #000b}.micro-auth-card h2{margin:0 0 5px;color:#3e523d}.micro-auth-card p{line-height:1.45}.micro-auth-card label{display:block;font-size:.75rem;font-weight:bold;margin:9px 0 3px;color:#69583f}.micro-auth-card input{width:100%;padding:10px;border:1px solid #9c8765;border-radius:9px;background:#fffaf0}.micro-auth-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.micro-auth-actions button,#microAuthBadge button,#microMasterPanel button{border:1px solid #765f3d;border-radius:9px;padding:8px 10px;font-weight:bold;background:#eee0c0;color:#473625}.micro-auth-actions .primary,#microMasterPanel .primary{background:#356342;color:white}.micro-auth-error{min-height:20px;color:#913f3d;font-weight:bold;margin-top:8px}.micro-auth-hint{font-size:.75rem;color:#75634d;background:#fff4d7;border-left:4px solid #b58a3d;padding:8px;border-radius:7px;margin-top:10px}
      #microAuthBadge{position:fixed;right:10px;top:10px;z-index:99990;display:flex;align-items:center;gap:6px;background:#efe5cc;border:2px solid #735e3e;border-radius:999px;padding:5px 7px;box-shadow:0 5px 18px #0005;font-size:.72rem}#microAuthBadge[hidden]{display:none}#microAuthBadge button{padding:4px 7px;font-size:.7rem}.micro-role-master{color:#744d12;font-weight:bold}.micro-role-player{color:#315a42;font-weight:bold}
      #microMasterPanel{position:fixed;inset:8% 4%;z-index:99995;background:#efe5cc;border:4px double #9a7840;border-radius:22px;padding:15px;box-shadow:0 0 0 100vmax #07100ddd,0 22px 60px #000b;overflow:auto;color:#2f271e}#microMasterPanel[hidden]{display:none}.micro-master-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.micro-user-row{display:grid;grid-template-columns:minmax(130px,1fr) 100px 110px auto;gap:7px;align-items:center;padding:8px;border-bottom:1px solid #baa684}.micro-user-status.ok{color:#246137}.micro-user-status.wait{color:#8a5f12}.micro-ipm-test{margin:10px auto;max-width:1380px;background:#241a2d;color:#f5e5bc;border:3px double #b98c3e;border-radius:16px;padding:12px;box-shadow:0 8px 24px #0005}.micro-security-note{background:#fff1c9;border-left:5px solid #994b48;border-radius:8px;padding:9px;margin:10px 0}.micro-master-note{background:#e7e0f0;border-left:5px solid #654d83;border-radius:8px;padding:9px;margin:10px 0}
      body:not(.micro-role-master-active) [data-access="master"],body:not(.micro-role-master-active) [data-ipm],body:not(.micro-role-master-active) .master-only{display:none!important}
      body.micro-role-master-active .player-only{display:none!important}
      @media(max-width:650px){.micro-user-row{grid-template-columns:1fr}.micro-auth-actions button{flex:1}#microAuthBadge{top:auto;bottom:8px;right:8px}}
    `;document.head.appendChild(style);
  }
  function ensureUi(){
    ensureStyles();
    if(!document.getElementById("microAuthOverlay")){
      const overlay=document.createElement("div");overlay.id="microAuthOverlay";overlay.innerHTML=`<div class="micro-auth-card"><h2>🔐 Acesso ao MICROCOSMOS</h2><p>Entre como Jogador ou Mestre. Novos jogadores podem solicitar acesso e ficam aguardando aprovação do Mestre.</p><label>Login</label><input id="microAuthUser" autocomplete="username" placeholder="seu.login"><label>Senha</label><input id="microAuthPass" type="password" autocomplete="current-password" placeholder="••••••••"><div class="micro-auth-actions"><button class="primary" id="microAuthLogin">Entrar</button><button id="microAuthRequest">Solicitar acesso de Jogador</button></div><div id="microAuthError" class="micro-auth-error"></div><div class="micro-auth-hint"><b>Modo de teste local.</b> O Mestre aprova novos usuários neste mesmo navegador. A versão definitiva usará backend para funcionar entre aparelhos e proteger IPM de verdade.</div></div>`;document.body.appendChild(overlay);
      document.getElementById("microAuthLogin").onclick=login;
      document.getElementById("microAuthRequest").onclick=requestAccess;
      document.getElementById("microAuthPass").addEventListener("keydown",e=>{if(e.key==="Enter")login()});
    }
    if(!document.getElementById("microAuthBadge")){
      const badge=document.createElement("div");badge.id="microAuthBadge";badge.hidden=true;document.body.appendChild(badge);
    }
    if(!document.getElementById("microMasterPanel")){
      const panel=document.createElement("div");panel.id="microMasterPanel";panel.hidden=true;document.body.appendChild(panel);
    }
    if(!document.getElementById("microIpmTest")){
      const test=document.createElement("div");test.id="microIpmTest";test.className="micro-ipm-test master-only";test.dataset.access="master";test.innerHTML='<b>🔒 IPM • MODO MESTRE ATIVO</b><br>O Mestre pode abrir no Codex tanto as informações públicas quanto as Descobertas ainda bloqueadas para os Jogadores.';
      const app=document.querySelector(".app");if(app)app.insertAdjacentElement("afterbegin",test);else document.body.prepend(test);
    }
  }
  function showError(msg){const el=document.getElementById("microAuthError");if(el)el.textContent=msg}
  async function login(){
    const username=document.getElementById("microAuthUser").value.trim().toLowerCase(),password=document.getElementById("microAuthPass").value;
    const users=loadUsers(),user=users.find(u=>u.username.toLowerCase()===username);if(!user)return showError("Login ou senha inválidos.");
    const digest=await sha256(password);if(digest!==user.passwordHash)return showError("Login ou senha inválidos.");
    if(user.role!=="master"&&!user.approved)return showError("Acesso aguardando aprovação do Mestre.");
    currentUser=user;setSession(user.username);applyRole();showError("");
  }
  async function requestAccess(){
    const username=document.getElementById("microAuthUser").value.trim().toLowerCase(),password=document.getElementById("microAuthPass").value;
    if(username.length<3||password.length<6)return showError("Use login com pelo menos 3 caracteres e senha com pelo menos 6.");
    const users=loadUsers();if(users.some(u=>u.username.toLowerCase()===username))return showError("Este login já existe.");
    users.push({username,passwordHash:await sha256(password),role:"player",approved:false,label:username,builtIn:false,createdAt:new Date().toISOString()});saveUsers(users);showError("Solicitação criada. Entre como Mestre neste navegador para aprovar.");
  }
  function logout(){currentUser=null;setSession("");document.body.classList.remove("micro-role-master-active","micro-role-player-active");const overlay=document.getElementById("microAuthOverlay");overlay.hidden=false;document.getElementById("microAuthBadge").hidden=true;document.getElementById("microMasterPanel").hidden=true;if(typeof renderCodex==="function")renderCodex()}
  function applyRole(){
    ensureUi();const overlay=document.getElementById("microAuthOverlay"),badge=document.getElementById("microAuthBadge");overlay.hidden=!!currentUser;if(!currentUser){badge.hidden=true;return}
    const master=currentUser.role==="master";document.body.classList.toggle("micro-role-master-active",master);document.body.classList.toggle("micro-role-player-active",!master);document.documentElement.dataset.microcosmosRole=currentUser.role;
    badge.hidden=false;badge.innerHTML=`<span class="${master?"micro-role-master":"micro-role-player"}">${master?"👑 Mestre":"🎲 Jogador"} • ${escAuth(currentUser.username)}</span>${master?'<button id="microOpenMaster">Painel</button>':""}<button id="microLogout">Sair</button>`;
    document.getElementById("microLogout").onclick=logout;if(master)document.getElementById("microOpenMaster").onclick=openMasterPanel;
    if(master){
      const visibility=document.getElementById("codexVisibility");
      if(visibility)visibility.value="all";
    }
    if(typeof renderCodex==="function")renderCodex();
  }
  function openMasterPanel(){
    if(currentUser?.role!=="master")return;const panel=document.getElementById("microMasterPanel"),users=loadUsers();let ipmCount=0,lockedCount=0;if(originalCodexEntries){try{const all=originalCodexEntries();ipmCount=all.filter(isMasterEntry).length;lockedCount=all.filter(e=>e.discovered===false).length}catch{}}
    panel.innerHTML=`<div class="micro-master-head"><div><h2>👑 Painel do Mestre</h2><small>Controle de acesso • demonstração local</small></div><button id="microCloseMaster">Fechar</button></div><div class="micro-master-note"><b>🔓 Visão do Mestre:</b> ${lockedCount} Descoberta(s) ainda bloqueada(s) para Jogadores podem ser abertas normalmente pelo Mestre no Codex. Elas aparecem marcadas como <b>“Ainda não descoberto pelos Jogadores”</b>.</div><div class="micro-security-note"><b>⚠️ Segurança:</b> no GitHub Pages este login é apenas uma demonstração de interface. Conteúdo IPM realmente secreto não deve ficar dentro de arquivos públicos do site. Na etapa definitiva, IPM e contas irão para backend.</div><p><b>Entradas IPM detectadas no Codex:</b> ${ipmCount}</p><h3>Jogadores e acessos</h3><div>${users.map((u,i)=>`<div class="micro-user-row"><b>${escAuth(u.username)}${u.builtIn?" • teste":""}</b><span>${u.role==="master"?"Mestre":"Jogador"}</span><span class="micro-user-status ${u.approved?"ok":"wait"}">${u.approved?"✓ Aprovado":"⏳ Pendente"}</span><span>${u.role==="master"?"Conta Mestre":`<button data-auth-action="${u.approved?"revoke":"approve"}" data-auth-index="${i}" class="${u.approved?"":"primary"}">${u.approved?"Revogar":"Aprovar"}</button>`}</span></div>`).join("")}</div>`;
    panel.hidden=false;document.getElementById("microCloseMaster").onclick=()=>panel.hidden=true;panel.querySelectorAll("[data-auth-action]").forEach(btn=>btn.onclick=()=>{const list=loadUsers(),i=+btn.dataset.authIndex;if(!list[i]||list[i].role==="master")return;list[i].approved=btn.dataset.authAction==="approve";saveUsers(list);openMasterPanel()});
  }
  function restoreSession(){const username=session();if(!username)return;const user=loadUsers().find(u=>u.username===username&&u.approved);if(user)currentUser=user;else setSession("")}
  function init(){ensureUi();loadUsers();restoreSession();applyRole()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
