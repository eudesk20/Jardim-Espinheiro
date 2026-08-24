/* MICROCOSMOS — capacidade de Truques por Classe e nível.
   Exibe contador na área de Slots Mágicos. Truques automáticos de Raça/Subclasse
   são tratados como extras e não reduzem as escolhas de Truques da Classe. */
(function(){
  if(globalThis.MICROCOSMOS_CANTRIP_CAPACITY_RUNTIME)return;
  globalThis.MICROCOSMOS_CANTRIP_CAPACITY_RUNTIME=true;

  // Progressão-base usada pela ficha. Paladino e Patrulheiro não recebem Truques
  // pela Classe base; podem obtê-los por outras fontes. Engenheiro segue a
  // progressão própria inspirada no conjurador técnico do projeto.
  const PROGRESSION={
    bardo:[[1,2],[4,3],[10,4]],
    clerigo:[[1,3],[4,4],[10,5]],
    druida:[[1,2],[4,3],[10,4]],
    feiticeiro:[[1,4],[4,5],[10,6]],
    bruxo:[[1,2],[4,3],[10,4]],
    mago:[[1,3],[4,4],[10,5]],
    engenheiro:[[1,2],[10,3],[14,4]],
    paladino:[],
    patrulheiro:[]
  };
  globalThis.CLASS_CANTRIP_PROGRESSION=PROGRESSION;

  const $=id=>document.getElementById(id);
  function capacity(cls,level){
    let total=0;for(const [lvl,count] of PROGRESSION[cls]||[])if((+level||1)>=lvl)total=count;return total
  }
  function isCantrip(s){return +(s?.level??s?.lvl??s?.circle??s?.spellLevel??-1)===0}
  function isAutomatic(s){
    const origin=String(s?.origin||s?.sourceOrigin||s?.grantedBy||"").toLowerCase();
    return !!s?.auto||!!s?.automatic||!!s?.granted||/raça|raca|subclasse|linhagem|talento|origem/.test(origin)
  }
  function counts(){
    const all=(state.magic?.known||[]).filter(isCantrip),automatic=all.filter(isAutomatic),chosen=all.filter(s=>!isAutomatic(s));
    return {all,automatic,chosen}
  }
  function ensure(){
    if($("microCantripCapacity"))return;
    const slots=$("p3Slots");if(!slots)return;
    const card=document.createElement("div");card.id="microCantripCapacity";card.className="micro-cantrip-capacity";slots.parentElement.insertBefore(card,slots);
    if(!$("microCantripCapacityStyles")){
      const s=document.createElement("style");s.id="microCantripCapacityStyles";s.textContent=`
      .micro-cantrip-capacity{margin:7px 0 11px;padding:10px;border:2px solid #7d668d;border-radius:12px;background:#f3eaf7;color:#392b42}.micro-cantrip-head{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}.micro-cantrip-head b{color:#583d68}.micro-cantrip-count{font-size:1.05rem;font-weight:bold;background:#fffaf0;border:1px solid #9c86aa;border-radius:999px;padding:4px 9px}.micro-cantrip-count.full{background:#e3eee0;border-color:#66835f}.micro-cantrip-count.over{background:#f8dddd;border-color:#a65e5e;color:#7e3333}.micro-cantrip-note{font-size:.75rem;color:#66556f;margin-top:6px;line-height:1.4}.micro-cantrip-none{font-size:.8rem;color:#66556f}`;document.head.appendChild(s)
    }
  }
  function render(){
    ensure();const box=$("microCantripCapacity");if(!box)return;
    const cls=state.cls||"",lvl=+state.level||1,max=capacity(cls,lvl),c=counts(),className=globalThis.MICROCOSMO_DATA?.classes?.[cls]?.name||cls||"Classe";
    if(!cls){box.innerHTML='<div class="micro-cantrip-none">✨ Escolha uma Classe para ver quantos Truques ela conhece.</div>';return}
    if(!(cls in PROGRESSION)){box.innerHTML='<div class="micro-cantrip-none">✨ Esta Classe não possui uma progressão de Truques cadastrada.</div>';return}
    if(max===0){box.innerHTML=`<div class="micro-cantrip-head"><b>✨ Truques — ${className}</b><span class="micro-cantrip-count">0 pela Classe</span></div><div class="micro-cantrip-note">A Classe base não concede Truques. Truques obtidos por Raça, Subclasse, Talento ou outra fonte continuam aparecendo normalmente como extras.${c.automatic.length?` Extras atuais: <b>${c.automatic.length}</b>.`:""}</div>`;return}
    const clsCount=c.chosen.length,css=clsCount>max?"over":clsCount===max?"full":"";
    box.innerHTML=`<div class="micro-cantrip-head"><b>✨ Truques — ${className} • Nível ${lvl}</b><span class="micro-cantrip-count ${css}">${clsCount}/${max} escolhidos</span></div><div class="micro-cantrip-note">Você pode conhecer <b>${max} Truque${max===1?"":"s"}</b> pela Classe neste nível.${c.automatic.length?` Além disso, há <b>${c.automatic.length}</b> Truque${c.automatic.length===1?"":"s"} automático${c.automatic.length===1?"":"s"} de Raça/Subclasse/outra fonte, que não consome${c.automatic.length===1?"":"m"} esse limite.`:""} Truques não gastam Slot Mágico.</div>`
  }

  // Atualiza sempre que o Grimório ou a ficha forem redesenhados.
  if(typeof renderMagicAll==="function"){
    const original=renderMagicAll;renderMagicAll=function(){const r=original.apply(this,arguments);render();return r}
  }
  if(typeof renderKnown==="function"){
    const original=renderKnown;renderKnown=function(){const r=original.apply(this,arguments);render();return r}
  }
  const cls=$("p1ClassSelect"),level=$("p1Level");
  cls?.addEventListener("change",()=>setTimeout(render,0));level?.addEventListener("input",()=>setTimeout(render,0));
  window.addEventListener("pageshow",()=>setTimeout(render,0));
  render();
})();
