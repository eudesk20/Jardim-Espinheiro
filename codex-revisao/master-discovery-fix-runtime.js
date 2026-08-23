/* MICROCOSMOS — correção da visão de Descobertas para o Mestre.
   O login do Mestre transforma entradas bloqueadas em legíveis para abrir o conteúdo.
   Esta camada preserva a tela "Descobertas ainda bloqueadas", filtrando pela marca
   masterOriginalDiscovered em vez do campo discovered já liberado para leitura. */
(function(){
  if(typeof filteredCodex!=="function")return;
  const originalFilteredCodex=filteredCodex;

  filteredCodex=function(){
    const isMaster=document.body.classList.contains("micro-role-master-active");
    if(!isMaster||typeof codexOnlyLocked==="undefined"||!codexOnlyLocked)return originalFilteredCodex();

    const previous=codexOnlyLocked;
    codexOnlyLocked=false;
    try{
      return originalFilteredCodex().filter(entry=>entry?.masterOriginalDiscovered===false||entry?.data?.masterOriginalDiscovered===false);
    }finally{
      codexOnlyLocked=previous;
    }
  };

  const originalOpenDiscoveries=typeof openCodexDiscoveries==="function"?openCodexDiscoveries:null;
  if(originalOpenDiscoveries){
    openCodexDiscoveries=function(){
      originalOpenDiscoveries();
      if(document.body.classList.contains("micro-role-master-active")){
        const heading=document.getElementById("codexHeading");
        if(heading)heading.textContent="📚 Descobertas ainda bloqueadas • Visão do Mestre";
        if(typeof renderCodex==="function")renderCodex();
      }
    };
  }
})();
