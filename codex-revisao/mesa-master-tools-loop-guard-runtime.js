/* MICROCOSMOS — proteção e estabilidade das Ferramentas do Mestre.
   Impede cartões duplicados e preserva a gaveta escolhida manualmente pelo Mestre,
   mesmo quando runtimes da Mesa disparam novas reorganizações do painel. */
(function(){
  if(globalThis.MICROCOSMOS_MASTER_TOOLS_LOOP_GUARD_V2)return;
  globalThis.MICROCOSMOS_MASTER_TOOLS_LOOP_GUARD_V2=true;

  const NativeMutationObserver=globalThis.MutationObserver;
  if(!NativeMutationObserver)return;

  let desiredOpenId=undefined;
  let applyingState=false;
  let accordionObserver=null;

  function patchBody(body){
    if(!body||body.dataset.masterAppendGuard==='1')return;
    body.dataset.masterAppendGuard='1';
    const nativeAppend=body.appendChild.bind(body);
    body.appendChild=function(child){
      if(child?.nodeType===1&&child.dataset?.masterV2==='1'){
        const existing=[...this.children].find(el=>el!==child&&el.dataset?.masterV2==='1');
        if(existing){
          if(existing.className!==child.className)existing.className=child.className;
          if(existing.innerHTML!==child.innerHTML)existing.innerHTML=child.innerHTML;
          return existing;
        }
      }
      return nativeAppend(child);
    };
  }

  function removeDuplicateCards(root){
    root.querySelectorAll('.micro-master-section-body').forEach(body=>{
      patchBody(body);
      const cards=[...body.children].filter(el=>el.dataset?.masterV2==='1');
      if(cards.length>1){
        const keep=cards[cards.length-1];
        cards.forEach(el=>{if(el!==keep)el.remove()});
      }
    });
  }

  function sections(root){
    return [...root.querySelectorAll(':scope > .micro-master-section')];
  }

  function applyDesiredState(root){
    if(applyingState||desiredOpenId===undefined)return;
    applyingState=true;
    try{
      sections(root).forEach(section=>{
        const shouldOpen=desiredOpenId!==null&&section.id===desiredOpenId;
        if(section.open!==shouldOpen)section.open=shouldOpen;
      });
    }finally{
      applyingState=false;
    }
  }

  function bindAccordion(root){
    if(!root)return;
    removeDuplicateCards(root);

    if(desiredOpenId===undefined){
      desiredOpenId=sections(root).find(s=>s.open)?.id||null;
    }

    if(root.dataset.masterStableAccordion!=='1'){
      root.dataset.masterStableAccordion='1';

      /*
       * O organizador antigo reescreve a propriedade `open` sempre que observa
       * mudanças na página. Capturamos o clique do Mestre e tornamos esse estado
       * a fonte de verdade até que ele escolha outra gaveta.
       */
      root.addEventListener('click',event=>{
        const summary=event.target?.closest?.(':scope summary')||event.target?.closest?.('summary');
        if(!summary||summary.parentElement?.parentElement!==root)return;
        const section=summary.parentElement;
        event.preventDefault();
        event.stopPropagation();
        desiredOpenId=section.open?null:section.id;
        applyDesiredState(root);
      },true);
    }

    if(accordionObserver)accordionObserver.disconnect();
    accordionObserver=new NativeMutationObserver(mutations=>{
      removeDuplicateCards(root);
      if(mutations.some(m=>m.type==='attributes'&&m.attributeName==='open')){
        queueMicrotask(()=>applyDesiredState(root));
      }
    });
    accordionObserver.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});

    applyDesiredState(root);
  }

  function scan(){
    const root=document.getElementById('microMasterAccordion');
    if(root)bindAccordion(root);
  }

  const pageWatcher=new NativeMutationObserver(()=>{
    clearTimeout(pageWatcher._timer);
    pageWatcher._timer=setTimeout(scan,60);
  });
  pageWatcher.observe(document.documentElement,{childList:true,subtree:true});

  scan();
  setTimeout(scan,100);
  setTimeout(scan,500);
  setTimeout(scan,1200);
})();
