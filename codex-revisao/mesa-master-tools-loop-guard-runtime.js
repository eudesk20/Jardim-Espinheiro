/* MICROCOSMOS — guarda leve das Ferramentas do Mestre.
   A estabilidade das gavetas agora é controlada diretamente pelo organizador v2.1.
   Este runtime fica apenas responsável por remover cartões duplicados antigos,
   sem alterar open, classes visuais ou comportamento de clique das gavetas.
*/
(function(){
  if(globalThis.MICROCOSMOS_MASTER_TOOLS_DUPLICATE_GUARD)return;
  globalThis.MICROCOSMOS_MASTER_TOOLS_DUPLICATE_GUARD=true;

  const NativeMutationObserver=globalThis.MutationObserver;
  if(!NativeMutationObserver)return;

  function clean(){
    const root=document.getElementById('microMasterAccordion');
    if(!root)return;
    root.querySelectorAll('.micro-master-section-body').forEach(body=>{
      const cards=[...body.children].filter(el=>el.dataset?.masterV2==='1');
      if(cards.length>1){
        const keep=cards[cards.length-1];
        cards.forEach(el=>{if(el!==keep)el.remove()});
      }
    });
  }

  const watcher=new NativeMutationObserver(mutations=>{
    if(!mutations.some(m=>{
      const target=m.target?.nodeType===1?m.target:m.target?.parentElement;
      return target?.closest?.('#microMasterAccordion');
    }))return;
    clearTimeout(watcher._timer);
    watcher._timer=setTimeout(clean,80);
  });
  watcher.observe(document.documentElement,{childList:true,subtree:true});

  clean();
  setTimeout(clean,250);
})();
