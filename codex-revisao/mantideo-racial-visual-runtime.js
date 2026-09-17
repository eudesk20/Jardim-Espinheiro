/* MICROCOSMOS — Prévia visual do truque racial dos Mantídeos. */
(()=>{
  if(globalThis.MICROCOSMOS_MANTIDEO_RACIAL_VISUAL)return;
  globalThis.MICROCOSMOS_MANTIDEO_RACIAL_VISUAL=true;
  const KEY="racial-mantideo-foices-retrateis";
  const visualFor=data=>{
    if(data?.codexKey===KEY&&data.visual)return data.visual;
    return (globalThis.CODEX_SPELL_DATA||[]).find(spell=>spell.key===KEY)?.visual||"";
  };
  const decorate=(root,data)=>{
    const visual=visualFor(data);
    if(!root||!visual||root.querySelector('.mantideo-cantrip-preview'))return;
    const figure=document.createElement('figure');
    figure.style.margin='12px 0';
    const image=document.createElement('img');
    image.className='mantideo-cantrip-preview';
    image.src=visual;
    image.alt='Foices Mágicas Retráteis: ativação, guarda e golpe em visão superior';
    const caption=document.createElement('figcaption');
    caption.className='mantideo-cantrip-caption';
    caption.textContent='Demonstração superior: ativação, guarda e golpe. O token final usa camadas modulares.';
    figure.append(image,caption);
    (root.querySelector('.meta,.codex-meta')||root.querySelector('h2'))?.insertAdjacentElement('afterend',figure);
  };
  const oldDescription=globalThis.showMagicDesc;
  if(typeof oldDescription==='function')globalThis.showMagicDesc=function(name){
    const result=oldDescription.apply(this,arguments);
    if(name==='Foices Mágicas Retráteis'){
      const spell=(globalThis.CODEX_SPELL_DATA||[]).find(item=>item.key===KEY);
      decorate(document.getElementById('p3ModalContent'),spell);
    }
    return result;
  };
  const oldCodex=globalThis.renderCodexContent;
  if(typeof oldCodex==='function')globalThis.renderCodexContent=function(entry){
    const result=oldCodex.apply(this,arguments);
    if(entry?.id===`grimorio:${KEY}`)decorate(document.getElementById('codexContent'),entry.data);
    return result;
  };
})();
