/* MICROCOSMOS — estabilidade visual das Ferramentas do Mestre.
   O organizador antigo ainda pode alterar o atributo nativo `open` durante
   atualizacoes da Mesa. Para evitar o efeito de piscar, a interface passa a usar
   uma classe visual controlada apenas pelo clique do Mestre. O atributo `open`
   continua livre para os runtimes internos carregarem/atualizarem o conteudo. */
(function(){
  if(globalThis.MICROCOSMOS_MASTER_TOOLS_VISUAL_STABILITY)return;
  globalThis.MICROCOSMOS_MASTER_TOOLS_VISUAL_STABILITY=true;

  const NativeMutationObserver=globalThis.MutationObserver;
  if(!NativeMutationObserver)return;

  function ensureStyle(){
    if(document.getElementById('microMasterVisualStabilityStyle'))return;
    const style=document.createElement('style');
    style.id='microMasterVisualStabilityStyle';
    style.textContent=`
      #microMasterAccordion > .micro-master-section > .micro-master-section-body{
        display:none!important;
      }
      #microMasterAccordion > .micro-master-section.micro-master-manual-open > .micro-master-section-body{
        display:grid!important;
      }
      #microMasterAccordion > .micro-master-section > summary:after{
        content:"＋"!important;
      }
      #microMasterAccordion > .micro-master-section.micro-master-manual-open > summary:after{
        content:"−"!important;
      }
    `;
    document.head.appendChild(style);
  }

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

  function directSections(root){
    return [...root.children].filter(el=>el.classList?.contains('micro-master-section'));
  }

  function setVisualOpen(root,section){
    directSections(root).forEach(el=>el.classList.toggle('micro-master-manual-open',el===section));
  }

  function bindAccordion(root){
    if(!root)return;
    ensureStyle();
    removeDuplicateCards(root);

    if(!root.querySelector(':scope > .micro-master-section.micro-master-manual-open')){
      const initial=directSections(root).find(el=>el.open)||directSections(root)[0]||null;
      if(initial)setVisualOpen(root,initial);
    }

    if(root.dataset.masterVisualStable==='1')return;
    root.dataset.masterVisualStable='1';

    root.addEventListener('click',event=>{
      const summary=event.target?.closest?.('summary');
      if(!summary)return;
      const section=summary.parentElement;
      if(section?.parentElement!==root||!section.classList.contains('micro-master-section'))return;

      const alreadyVisualOpen=section.classList.contains('micro-master-manual-open');
      if(alreadyVisualOpen){
        section.classList.remove('micro-master-manual-open');
      }else{
        setVisualOpen(root,section);
      }

      /*
       * Nao impedimos o comportamento nativo do <details>. Assim os listeners
       * originais ainda recebem `toggle` e carregam Aprovações, Descanso, Token etc.
       * A diferenca e que mudancas programaticas de `open` nao afetam mais o que
       * o Mestre esta vendo, eliminando o abre/fecha rapido.
       */
    },true);

    const childWatcher=new NativeMutationObserver(()=>removeDuplicateCards(root));
    childWatcher.observe(root,{childList:true,subtree:true});
  }

  function scan(){
    const root=document.getElementById('microMasterAccordion');
    if(root)bindAccordion(root);
  }

  const pageWatcher=new NativeMutationObserver(()=>{
    clearTimeout(pageWatcher._timer);
    pageWatcher._timer=setTimeout(scan,80);
  });
  pageWatcher.observe(document.documentElement,{childList:true,subtree:true});

  scan();
  setTimeout(scan,100);
  setTimeout(scan,500);
  setTimeout(scan,1200);
})();
