/* MICROCOSMOS — Controles compactos da Mesa.
   Move os controles de preparo para uma barra acima do Grid, reaproveitando
   os mesmos elementos/listeners. Otimiza celular em retrato e paisagem.
*/
(function(){
  if(globalThis.MICROCOSMOS_COMPACT_TABLE_CONTROLS)return;
  globalThis.MICROCOSMOS_COMPACT_TABLE_CONTROLS=true;
  const $=id=>document.getElementById(id),mapShell=document.querySelector('.map-shell'),toolbar=mapShell?.querySelector('.toolbar'),left=$('leftPanel');
  if(!mapShell||!toolbar||!left)return;

  function ensureCss(){if($('microCompactTableStyle'))return;const s=document.createElement('style');s.id='microCompactTableStyle';s.textContent=`
    .micro-compact-bar{display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin-bottom:6px;background:#efe5cc;border:2px solid #876d49;border-radius:11px;padding:5px;color:#30271e;position:relative;z-index:20}.micro-compact-bar .btn{padding:6px 8px;min-height:34px}.micro-compact-grid{display:flex;gap:4px;align-items:center}.micro-compact-grid select{width:auto;min-width:112px;padding:6px;border:1px solid #9d8765;border-radius:8px;background:#fffaf0}.micro-compact-label{font-size:.65rem;font-weight:bold;color:#6d5a43}.micro-compact-more{position:relative}.micro-compact-more summary{list-style:none;cursor:pointer;border:1px solid #755d3b;background:#efe2c4;border-radius:9px;padding:7px 9px;font-weight:bold;user-select:none}.micro-compact-more summary::-webkit-details-marker{display:none}.micro-compact-pop{position:absolute;right:0;top:calc(100% + 5px);width:min(310px,86vw);z-index:300;background:#efe5cc;border:2px solid #876d49;border-radius:11px;padding:8px;box-shadow:0 10px 24px #0006;display:grid;gap:7px}.micro-compact-pop label{font-size:.67rem;font-weight:bold;color:#6d5a43}.micro-compact-pop input[type=range]{width:100%}.micro-compact-spacer{flex:1}.micro-compact-icon{white-space:nowrap}.micro-compact-bar .map-upload{margin:0}.micro-compact-bar .map-upload label:first-child{display:none}.micro-compact-bar .map-upload .btn{width:auto}.micro-prep-hidden{display:none!important}
    @media(max-width:720px){.micro-compact-bar{flex-wrap:nowrap;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;padding:4px}.micro-compact-bar::-webkit-scrollbar{display:none}.micro-compact-bar .btn{flex:0 0 auto;padding:6px 8px}.micro-compact-grid{flex:0 0 auto}.micro-compact-grid select{min-width:102px;max-width:122px}.micro-compact-spacer{display:none}.toolbar{margin-bottom:5px;gap:4px}.toolbar .btn{padding:6px 7px}.viewport{height:calc(100vh - 220px);min-height:360px}.mobile-tabs [data-drawer="left"]{font-size:0}.mobile-tabs [data-drawer="left"]::after{content:'👥 Jogadores';font-size:1rem}}
    @media(max-height:650px) and (pointer:coarse){.layout{display:block!important}.left,.right{display:none!important}.mobile-tabs{display:flex!important;gap:5px;margin:4px 0}.left.drawer,.right.drawer{display:block!important;position:fixed;left:6px;right:6px;bottom:6px;z-index:900;max-height:65vh;overflow:auto}.right.drawer{grid-template-columns:1fr!important}.map-shell{border-radius:10px;padding:4px}.head{padding:7px 10px}.head h1{font-size:1.15rem}.head small{display:none}.micro-compact-bar{flex-wrap:nowrap;overflow-x:auto;margin-bottom:4px}.toolbar{margin-bottom:4px}.viewport{height:calc(100vh - 165px)!important;min-height:240px!important}.status{display:none}.mobile-tabs [data-drawer="left"]{font-size:0}.mobile-tabs [data-drawer="left"]::after{content:'👥 Jogadores';font-size:1rem}}
  `;document.head.appendChild(s)}

  function ensureBar(){
    let bar=$('microCompactTableBar');if(bar)return bar;
    bar=document.createElement('div');bar.id='microCompactTableBar';bar.className='micro-compact-bar';
    bar.innerHTML='<div class="micro-compact-grid" id="microCompactGrid"><span class="micro-compact-label">GRID</span></div><div id="microCompactMap"></div><div id="microCompactCharacters" style="display:flex;gap:4px"></div><span class="micro-compact-spacer"></span><details class="micro-compact-more" id="microCompactMore"><summary>⚙️ Mais</summary><div class="micro-compact-pop" id="microCompactPop"></div></details>';
    mapShell.insertBefore(bar,toolbar);return bar
  }
  function shortButton(btn,text,title){if(!btn)return;btn.classList.add('micro-compact-icon');btn.textContent=text;if(title)btn.title=title}
  function moveControls(){
    ensureCss();ensureBar();const grid=$('microCompactGrid'),map=$('microCompactMap'),chars=$('microCompactCharacters'),pop=$('microCompactPop');
    const type=$('gridType');if(type&&type.parentElement!==grid)grid.appendChild(type);
    const minus=$('gridMinus'),plus=$('gridPlus');if(minus&&minus.parentElement!==grid){shortButton(minus,'−','Diminuir Grid');grid.appendChild(minus)}if(plus&&plus.parentElement!==grid){shortButton(plus,'+','Aumentar Grid');grid.appendChild(plus)}
    const upload=document.querySelector('.map-upload');if(upload&&upload.parentElement!==map){map.appendChild(upload);const label=upload.querySelector('label.btn');if(label){label.textContent='🖼️ Mapa';label.title='Carregar mapa'}}
    const add=$('microAddCharacterSide');if(add&&add.parentElement!==chars){shortButton(add,'🧙 Ficha','Adicionar personagem da ficha');chars.appendChild(add)}
    const refresh=$('microRefreshLinked');if(refresh&&refresh.parentElement!==chars){shortButton(refresh,'🔄','Atualizar tokens pelas fichas');chars.appendChild(refresh)}
    const free=$('microAddFreeToken');if(free&&free.parentElement!==chars){shortButton(free,'➕ NPC','Token livre / NPC');chars.appendChild(free)}
    const size=$('gridSize');if(size&&size.parentElement!==pop){const wrap=document.createElement('label');wrap.id='microCompactGridSize';wrap.textContent='Tamanho do Grid';wrap.appendChild(size);pop.appendChild(wrap)}
    const clear=$('clearMap');if(clear&&clear.parentElement!==pop){clear.textContent='🗑️ Remover mapa';clear.style.width='100%';pop.appendChild(clear)}
    const prep=[...left.querySelectorAll(':scope > .panel')].find(p=>/Preparar Mesa/i.test(p.textContent||''));if(prep)prep.classList.add('micro-prep-hidden');
    const headerAdd=$('addToken');if(headerAdd)headerAdd.style.display='none';
    const leftTab=document.querySelector('.mobile-tabs [data-drawer="left"]');if(leftTab)leftTab.setAttribute('aria-label','Jogadores');
  }
  ensureCss();moveControls();
  let queued=false;const obs=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;moveControls()})});obs.observe(left,{childList:true,subtree:true});
  globalThis.MICROCOSMOS_COMPACT_TABLE={refresh:moveControls};
})();
