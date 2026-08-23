/* MICROCOSMOS — correção da visão de Descobertas para o Mestre.
   Compatível com o login local antigo e com o login online Supabase. */
(function(){
  if(typeof filteredCodex!=="function")return;
  const isMasterMode=()=>document.body.classList.contains("micro-role-master-active")||document.body.classList.contains("micro-online-master")||document.documentElement.dataset.microcosmosRole==="master";
  const originalFilteredCodex=filteredCodex;

  filteredCodex=function(){
    if(!isMasterMode()||typeof codexOnlyLocked==="undefined"||!codexOnlyLocked)return originalFilteredCodex();
    const previous=codexOnlyLocked;
    codexOnlyLocked=false;
    try{
      return originalFilteredCodex().filter(entry=>entry?.masterOriginalDiscovered===false||entry?.data?.masterOriginalDiscovered===false||entry?.discovered===false);
    }finally{
      codexOnlyLocked=previous;
    }
  };

  const originalOpenDiscoveries=typeof openCodexDiscoveries==="function"?openCodexDiscoveries:null;
  if(originalOpenDiscoveries){
    openCodexDiscoveries=function(){
      originalOpenDiscoveries();
      if(isMasterMode()){
        const heading=document.getElementById("codexHeading");
        if(heading)heading.textContent="📚 Descobertas ainda bloqueadas • Visão do Mestre";
        if(typeof renderCodex==="function")renderCodex();
      }
    };
  }
})();
