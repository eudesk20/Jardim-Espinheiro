/* MICROCOSMOS — Limites reais de seleção mágica.
   Fase 1 dos problemas 1 e 3: aplica o limite já aprovado de Truques e prepara
   a Página 3 para separar Truques Conhecidos, Magias Conhecidas e Slots Mágicos.
   A tabela definitiva de Magias Conhecidas por Classe será plugada neste mesmo
   runtime depois da revisão específica de cada Classe, sem inventar números. */
(function(){
  if(globalThis.MICROCOSMOS_MAGIC_CAPACITY_ENFORCEMENT)return;
  globalThis.MICROCOSMOS_MAGIC_CAPACITY_ENFORCEMENT=true;

  const $=id=>document.getElementById(id);
  const AUTO_RX=/raça|raca|subclasse|linhagem|talento|origem/i;
  function known(){state.magic=state.magic||{};state.magic.known=Array.isArray(state.magic.known)?state.magic.known:[];return state.magic.known}
  function levelOf(s){return +(s?.level??s?.lvl??s?.circle??s?.spellLevel??-1)}
  function isAuto(s){const origin=String(s?.origin||s?.sourceOrigin||s?.grantedBy||"");return !!s?.auto||!!s?.automatic||!!s?.granted||AUTO_RX.test(origin)}
  function capFromProgression(table,cls,lvl){let n=0;for(const [at,count] of table?.[cls]||[])if((+lvl||1)>=at)n=count;return n}
  function cantripCap(){return capFromProgression(globalThis.CLASS_CANTRIP_PROGRESSION||{},state.cls||"",+state.level||1)}
  function chosenCantrips(list=known()){return list.filter(s=>levelOf(s)===0&&!isAuto(s))}
  function automaticCantrips(list=known()){return list.filter(s=>levelOf(s)===0&&isAuto(s))}
  function chosenLeveled(list=known()){return list.filter(s=>levelOf(s)>0&&!isAuto(s))}
  function automaticLeveled(list=known()){return list.filter(s=>levelOf(s)>0&&isAuto(s))}

  // Ponto de extensão do problema 3. Quando a revisão das Classes terminar,
  // cada Classe terá uma progressão explícita aqui, e o bloqueio abaixo passa
  // automaticamente a valer também para Magias Conhecidas de 1º–9º Círculo.
  globalThis.CLASS_SPELL_KNOWN_PROGRESSION=globalThis.CLASS_SPELL_KNOWN_PROGRESSION||{};
  function knownSpellCap(){
    const table=globalThis.CLASS_SPELL_KNOWN_PROGRESSION||{};
    if(!Object.prototype.hasOwnProperty.call(table,state.cls||""))return null;
    return capFromProgression(table,state.cls||"",+state.level||1)
  }

  function toast(title,details){
    if(typeof showPopup==="function")showPopup("📚 Limite mágico",title,details);
    else alert(`${title}\n\n${String(details).replace(/<[^>]+>/g,"")}`)
  }

  function restore(snapshot){
    state.magic=state.magic||{};
    state.magic.known=snapshot;
    try{save()}catch(e){}
    try{if(typeof renderKnown==="function")renderKnown()}catch(e){}
    try{if(typeof renderMagicAvailable==="function")renderMagicAvailable()}catch(e){}
    try{if(typeof renderMagicAll==="function")renderMagicAll()}catch(e){}
    renderPanel();
  }

  function validateAfter(snapshot){
    const list=known(),maxCantrips=cantripCap(),chosen=chosenCantrips(list);
    if(chosen.length>maxCantrips){
      restore(snapshot);
      toast("Limite de Truques atingido",`Sua Classe no nível atual pode escolher <b>${maxCantrips}</b> Truque${maxCantrips===1?"":"s"} pela Classe. Truques automáticos de Raça, Subclasse, Talento ou outra fonte continuam como extras.`);
      return false
    }
    const maxSpells=knownSpellCap(),spells=chosenLeveled(list);
    if(maxSpells!==null&&spells.length>maxSpells){
      restore(snapshot);
      toast("Limite de Magias Conhecidas atingido",`Sua Classe no nível atual pode manter <b>${maxSpells}</b> Magia${maxSpells===1?"":"s"} Conhecida${maxSpells===1?"":"s"} pela Classe. Magias automáticas não consomem esse limite.`);
      return false
    }
    renderPanel();return true
  }

  // Não depende do nome da função interna que adiciona uma magia: tira uma foto
  // da lista antes do clique e valida depois que o código original terminar.
  document.addEventListener("click",e=>{
    const page=$("p3Page");if(!page||!page.contains(e.target))return;
    const before=structuredClone(known());
    setTimeout(()=>{try{validateAfter(before)}catch(err){console.warn("MICROCOSMOS: falha ao validar limite mágico",err)}},0)
  },true);

  function ensureStyle(){if($("microMagicCapacityStyles"))return;const s=document.createElement("style");s.id="microMagicCapacityStyles";s.textContent=`
    #microMagicCapacitySummary{margin:8px 0 11px;padding:10px;border:2px solid #806a93;border-radius:13px;background:#f5eef8;color:#382b41}
    .micro-magic-cap-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.micro-magic-cap-card{background:#fffaf0;border:1px solid #a08aac;border-radius:10px;padding:8px;text-align:center}.micro-magic-cap-card b{display:block;color:#583d68;font-size:.76rem;margin-bottom:3px}.micro-magic-cap-card strong{font-size:1.14rem}.micro-magic-cap-card small{display:block;color:#6e5c74;font-size:.67rem;margin-top:3px;line-height:1.3}.micro-cap-review{margin-top:7px;padding:6px 8px;border-left:4px solid #b28739;background:#fff0ca;border-radius:0 8px 8px 0;font-size:.7rem;color:#6a532a}@media(max-width:650px){.micro-magic-cap-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(s)}
  function ensurePanel(){ensureStyle();let box=$("microMagicCapacitySummary");if(box)return box;const slots=$("p3Slots");if(!slots)return null;box=document.createElement("div");box.id="microMagicCapacitySummary";slots.parentElement.insertBefore(box,slots);return box}
  function slotText(){
    const slots=state.magic?.slots;
    if(!slots)return "veja abaixo";
    if(Array.isArray(slots)){
      const active=slots.map((x,i)=>({i:i+1,x})).filter(o=>o.x&&(+o.x.max||+o.x.total||+o.x||0)>0);
      if(!active.length)return "0 disponíveis";
      return active.map(o=>`${o.i}º: ${+(o.x.current??o.x.now??o.x.max??o.x.total??o.x)||0}/${+(o.x.max??o.x.total??o.x)||0}`).join(" • ")
    }
    return "veja abaixo"
  }
  function renderPanel(){
    const box=ensurePanel();if(!box)return;const c=chosenCantrips(),ca=automaticCantrips(),s=chosenLeveled(),sa=automaticLeveled(),tc=cantripCap(),sc=knownSpellCap();
    box.innerHTML=`<div class="micro-magic-cap-grid">
      <div class="micro-magic-cap-card"><b>✨ Truques Conhecidos</b><strong>${c.length}/${tc}</strong><small>${ca.length?`+ ${ca.length} automático${ca.length===1?"":"s"}`:"Truques não gastam Slot Mágico"}</small></div>
      <div class="micro-magic-cap-card"><b>📖 Magias Conhecidas</b><strong>${s.length}/${sc===null?"—":sc}</strong><small>${sa.length?`+ ${sa.length} automática${sa.length===1?"":"s"}`:"1º ao 9º Círculo Mágico"}</small></div>
      <div class="micro-magic-cap-card"><b>🔷 Slots Mágicos</b><strong>${slotText()}</strong><small>Slots limitam quantas conjurações podem ser realizadas; não são o número de magias conhecidas.</small></div>
    </div>${sc===null&&state.cls&&CLASS_DATA?.[state.cls]?.caster?'<div class="micro-cap-review"><b>PROPOSTA PARA REVISÃO:</b> o limite de Magias Conhecidas desta Classe ainda será fechado no problema 3. O sistema já está preparado para bloquear automaticamente assim que a progressão for aprovada.</div>':""}`
  }

  globalThis.MICROCOSMOS_MAGIC_CAPACITY={cantripCap,knownSpellCap,validateAfter,render:renderPanel,isAutomatic:isAuto};
  if(typeof renderKnown==="function"){const old=renderKnown;renderKnown=function(){const r=old.apply(this,arguments);setTimeout(renderPanel,0);return r}}
  if(typeof renderMagicAll==="function"){const old=renderMagicAll;renderMagicAll=function(){const r=old.apply(this,arguments);setTimeout(renderPanel,0);return r}}
  window.addEventListener("pageshow",()=>setTimeout(renderPanel,0));
  renderPanel();
})();
