/* MICROCOSMOS — Persistência local separada por conta.
   O GitHub Pages continua sendo uma demonstração local: cada navegador mantém
   seus próprios dados. Este runtime impede que Mestre e Jogadores compartilhem
   a mesma ficha dentro do mesmo navegador enquanto o backend não é integrado. */
(function(){
  const SHARED_KEY="JE_INTEGRATED_123";
  const SESSION_KEY="MICROCOSMOS_AUTH_DEMO_SESSION_V1";
  const OWNER_KEY="MICROCOSMOS_ACTIVE_SHEET_USER_V1";
  const LEGACY_KEY="MICROCOSMOS_LEGACY_SHARED_SHEET_V1";
  const scopedKey=user=>`MICROCOSMOS_SHEET_V1:${String(user||"").toLowerCase()}`;
  let switching=false;

  function freshSheet(){
    try{return JSON.stringify(DEFAULT)}catch{return "{}"}
  }
  function persistOwner(){
    const owner=localStorage.getItem(OWNER_KEY);
    if(!owner)return;
    const current=localStorage.getItem(SHARED_KEY);
    if(current)localStorage.setItem(scopedKey(owner),current);
  }
  function activate(user){
    user=String(user||"").trim().toLowerCase();
    if(!user)return false;
    const owner=localStorage.getItem(OWNER_KEY);
    if(owner===user)return false;

    if(owner){
      persistOwner();
    }else{
      const legacy=localStorage.getItem(SHARED_KEY);
      if(legacy&&!localStorage.getItem(LEGACY_KEY))localStorage.setItem(LEGACY_KEY,legacy);
    }

    let target=localStorage.getItem(scopedKey(user));
    if(!target){
      // Preserva a ficha que já havia sido preenchida antes da separação e a
      // atribui ao Mestre de teste. Contas de Jogador nascem com ficha zerada.
      if(user==="mestre.teste"&&localStorage.getItem(LEGACY_KEY))target=localStorage.getItem(LEGACY_KEY);
      else target=freshSheet();
      localStorage.setItem(scopedKey(user),target);
    }

    localStorage.setItem(SHARED_KEY,target);
    localStorage.setItem(OWNER_KEY,user);
    return true;
  }
  function syncAccount(){
    if(switching)return;
    const user=localStorage.getItem(SESSION_KEY);
    if(!user){persistOwner();return}
    if(activate(user)){
      switching=true;
      location.reload();
    }
  }

  // Se a página abriu com uma sessão já existente, troca para a ficha daquela
  // conta antes de continuar o uso. Em um novo login, a classe do body muda e
  // o observer faz a mesma troca automaticamente.
  syncAccount();
  if(!switching&&document.body){
    new MutationObserver(syncAccount).observe(document.body,{attributes:true,attributeFilter:["class"]});
  }
  window.addEventListener("pagehide",persistOwner);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")persistOwner()});
})();
