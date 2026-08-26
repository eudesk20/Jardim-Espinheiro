/* MICROCOSMOS — proteção contra re-render recursivo das Ferramentas do Mestre.
   O organizador observa a página para reagir a mudanças externas. Sem esta guarda,
   alterações feitas dentro das próprias gavetas podem disparar o organizador de novo
   e criar cópias repetidas dos mesmos cartões. */
(function(){
  if(globalThis.MICROCOSMOS_MASTER_TOOLS_LOOP_GUARD)return;
  globalThis.MICROCOSMOS_MASTER_TOOLS_LOOP_GUARD=true;

  const NativeMutationObserver=globalThis.MutationObserver;
  if(!NativeMutationObserver)return;

  // Se este runtime entrar antes de algum observador futuro, evita que mutações
  // internas do acordeão sejam tratadas como mudanças estruturais da Mesa.
  globalThis.MutationObserver=class MicrocosmosGuardedMutationObserver extends NativeMutationObserver{
    constructor(callback){
      super((mutations,observer)=>{
        const relevant=mutations.filter(m=>{
          const target=m.target;
          return !(target?.nodeType===1&&target.closest?.('#microMasterAccordion'));
        });
        if(relevant.length)callback(relevant,observer);
      });
    }
  };

  function patchBody(body){
    if(!body||body.dataset.masterAppendGuard==='1')return;
    body.dataset.masterAppendGuard='1';
    const nativeAppend=body.appendChild.bind(body);
    body.appendChild=function(child){
      if(child?.nodeType===1&&child.dataset?.masterV2==='1'){
        const existing=[...this.children].find(el=>el!==child&&el.dataset?.masterV2==='1');
        if(existing){
          // Atualiza o cartão existente em vez de criar outra cópia. Se nada mudou,
          // não toca no DOM e quebra o ciclo MutationObserver -> organize -> append.
          if(existing.className!==child.className)existing.className=child.className;
          if(existing.innerHTML!==child.innerHTML)existing.innerHTML=child.innerHTML;
          return existing;
        }
      }
      return nativeAppend(child);
    };
  }

  function patchSections(){
    document.querySelectorAll('#microMasterAccordion .micro-master-section-body').forEach(patchBody);
    // Remove duplicações que já tenham sido criadas antes da proteção entrar em ação.
    document.querySelectorAll('#microMasterAccordion .micro-master-section-body').forEach(body=>{
      const cards=[...body.children].filter(el=>el.dataset?.masterV2==='1');
      if(cards.length>1){
        const keep=cards[cards.length-1];
        cards.forEach(el=>{if(el!==keep)el.remove()});
      }
    });
  }

  const watcher=new NativeMutationObserver(()=>patchSections());
  watcher.observe(document.documentElement,{childList:true,subtree:true});
  patchSections();
  setTimeout(patchSections,100);
  setTimeout(patchSections,500);
})();
