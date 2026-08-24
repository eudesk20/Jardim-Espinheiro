/* MICROCOSMOS — Reaprendizado de Magias no Descanso Longo.
   Problema 3: Magias Conhecidas são escolhas duradouras. Substituí-las exige
   uma janela aberta por Descanso Longo, pagamento por magia retirada e
   Micélio de Memória. Magias automáticas nunca podem ser substituídas aqui. */
(function(){
  if(globalThis.MICROCOSMOS_SPELL_RELEARNING_RUNTIME)return;
  globalThis.MICROCOSMOS_SPELL_RELEARNING_RUNTIME=true;

  const $=id=>document.getElementById(id);
  const COST_PS=[10,20,35,55,80,110,150,200,260,340];
  const MYCELIUM_QTY=[1,1,1,1,2,2,2,3,3,4];
  const MATERIAL_ID="micelio_memoria";
  const MATERIAL_NAME="Micélio de Memória";
  const WINDOW_KEY="relearnWindowOpen";

  function lvl(spell){return Math.max(0,Math.min(9,+(spell?.lvl??spell?.level??0)||0))}
  function cost(spell){const c=lvl(spell);return{ps:COST_PS[c],micelio:MYCELIUM_QTY[c],circle:c}}
  function known(){state.magic=state.magic||{};state.magic.known=Array.isArray(state.magic.known)?state.magic.known:[];return state.magic.known}
  function auto(spell){return !!spell?.auto||!!spell?.automatic||!!spell?.granted||/raça|raca|subclasse|linhagem|talento|origem/i.test(String(spell?.source||spell?.origin||spell?.grantedBy||""))}
  function materials(){state.magic=state.magic||{};state.magic.specialMaterials=Array.isArray(state.magic.specialMaterials)?state.magic.specialMaterials:[];return state.magic.specialMaterials}
  function micelioRow(){return materials().find(x=>x.id===MATERIAL_ID)}
  function micelioQty(){return +micelioRow()?.qty||0}
  function ps(){state.p2=state.p2||{};return +state.p2.ps||0}
  function windowOpen(){return !!state.magic?.[WINDOW_KEY]}
  function openWindow(){state.magic=state.magic||{};state.magic[WINDOW_KEY]=true;state.magic.relearnWindowOpenedAt=new Date().toISOString();save();renderPanel();showInfo("🌙 Reaprendizado disponível","O Descanso Longo abriu a preparação de Magias Conhecidas. Você pode substituir magias enquanto esta janela estiver aberta, pagando o custo de cada magia retirada.")}
  function closeWindow(){state.magic=state.magic||{};state.magic[WINDOW_KEY]=false;save();renderPanel();showInfo("📖 Preparação encerrada","As Magias Conhecidas ficam fixadas até o próximo Descanso Longo.")}

  function showInfo(title,text){if(typeof showPopup==="function")showPopup("🔮 Reaprendizado",title,text);else alert(`${title}\n\n${String(text).replace(/<[^>]+>/g,"")}`)}
  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
  function sourceSpells(){try{return typeof magicSource==="function"?(magicSource()?.spells||[]):[]}catch{return[]}}
  function unlocked(sp){try{return typeof spellLevelUnlocked==="function"?spellLevelUnlocked(sp.lvl):true}catch{return true}}
  function candidates(oldSpell){
    const current=new Set(known().map(x=>x.codexKey||x.name));
    return sourceSpells().filter(sp=>unlocked(sp)&&!current.has(sp.codexKey||sp.name)&&!sp.auto)
  }

  function canPay(oldSpell){const c=cost(oldSpell);return ps()>=c.ps&&micelioQty()>=c.micelio}
  function pay(oldSpell){
    const c=cost(oldSpell);if(!canPay(oldSpell))return false;
    state.p2.ps=Math.max(0,ps()-c.ps);
    const row=micelioRow();row.qty=Math.max(0,(+row.qty||0)-c.micelio);state.magic.specialMaterials=materials().filter(x=>(+x.qty||0)>0);
    return true
  }

  function ensureUi(){
    if(!$("microRelearnStyles")){const s=document.createElement("style");s.id="microRelearnStyles";s.textContent=`
      #microRelearnPanel{margin:8px 0 12px;padding:10px;border:2px solid #73577f;border-radius:12px;background:#f4eaf7;color:#3b2b43}.micro-relearn-head{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}.micro-relearn-open{color:#285c35;font-weight:bold}.micro-relearn-closed{color:#7b4a35;font-weight:bold}.micro-relearn-note{font-size:.74rem;line-height:1.45;margin-top:6px;color:#66516d}.micro-relearn-modal{position:fixed;inset:0;background:#07100ddd;z-index:145000;display:grid;place-items:center;padding:12px}.micro-relearn-modal[hidden]{display:none}.micro-relearn-card{width:min(620px,100%);max-height:88vh;overflow:auto;background:#efe5cc;border:4px double #9b7442;border-radius:20px;padding:14px;color:#30271e}.micro-relearn-card select{width:100%;padding:9px;background:#fffaf0;border:1px solid #9b8058;border-radius:8px}.micro-relearn-cost{margin:9px 0;padding:9px;background:#fff1c9;border-left:4px solid #a97827;border-radius:0 9px 9px 0}.micro-relearn-actions{display:flex;gap:8px;flex-wrap:wrap}.micro-relearn-actions button{flex:1}`;document.head.appendChild(s)}
    if(!$("microRelearnModal")){const d=document.createElement("div");d.id="microRelearnModal";d.className="micro-relearn-modal";d.hidden=true;document.body.appendChild(d)}
    let panel=$("microRelearnPanel");if(!panel){panel=document.createElement("div");panel.id="microRelearnPanel";const knownList=$("p3KnownList"),slots=$("p3Slots");if(knownList?.parentElement)knownList.parentElement.insertBefore(panel,knownList);else slots?.parentElement?.insertBefore(panel,slots)}
  }
  function renderPanel(){ensureUi();const box=$("microRelearnPanel");if(!box)return;const open=windowOpen();box.innerHTML=`<div class="micro-relearn-head"><b>🌙 Reaprendizado no Descanso Longo</b><span class="${open?"micro-relearn-open":"micro-relearn-closed"}">${open?"● Preparação aberta":"● Magias fixadas"}</span></div><div class="micro-relearn-note">Substituir uma Magia Conhecida não é grátis. O custo é baseado no Círculo da magia retirada e exige <b>${MATERIAL_NAME}</b>. Saldo atual: <b>${ps()} PS</b> • ${MATERIAL_NAME}: <b>${micelioQty()}</b>.${open?" Enquanto a preparação estiver aberta, use o ✕ de uma magia para iniciar a substituição.":" A preparação é aberta automaticamente ao concluir um Descanso Longo."}</div>${open?'<button type="button" class="btn" id="microCloseRelearn" style="margin-top:8px">🔒 Encerrar preparação</button>':""}`;$("microCloseRelearn")?.addEventListener("click",closeWindow)}

  function openReplace(name){
    const oldSpell=known().find(x=>x.name===name);if(!oldSpell)return;
    if(auto(oldSpell)){showInfo("Magia automática",`<b>${escapeHtml(name)}</b> foi concedida automaticamente e não pode ser trocada por este sistema.`);return}
    if(!windowOpen()){showInfo("Magias fixadas",`<b>${escapeHtml(name)}</b> só pode ser substituída durante a preparação aberta por um Descanso Longo.`);return}
    const list=candidates(oldSpell),c=cost(oldSpell),d=$("microRelearnModal");
    if(!list.length){showInfo("Nenhuma opção disponível","Não há outra magia liberada da sua Classe que possa substituir esta no momento.");return}
    d.hidden=false;d.innerHTML=`<div class="micro-relearn-card"><h2 style="margin:0;color:#5a3d67">🔄 Reaprender Magia</h2><p>Você vai retirar <b>${escapeHtml(oldSpell.name)}</b> (${c.circle?c.circle+"º Círculo":"Truque"}). Escolha a nova magia conhecida.</p><label style="display:block;font-weight:bold;margin-bottom:4px">Nova magia</label><select id="microRelearnChoice">${list.sort((a,b)=>(a.lvl-b.lvl)||a.name.localeCompare(b.name,"pt-BR")).map(sp=>`<option value="${escapeHtml(sp.codexKey||sp.name)}">${sp.lvl?sp.lvl+"º":"Truque"} — ${escapeHtml(sp.name)}</option>`).join("")}</select><div class="micro-relearn-cost"><b>Custo da magia retirada:</b> ${c.ps} PS + ${c.micelio}× ${MATERIAL_NAME}.<br><small>O custo é alto de propósito: trocar uma escolha mágica deve ser uma decisão de campanha, não uma preparação gratuita para cada encontro.</small></div><div class="micro-relearn-actions"><button class="btn" id="microRelearnCancel">Cancelar</button><button class="btn primary" id="microRelearnConfirm" ${canPay(oldSpell)?"":"disabled"}>Confirmar substituição</button></div>${canPay(oldSpell)?"":`<p style="color:#873e38"><b>Recursos insuficientes.</b> Você possui ${ps()} PS e ${micelioQty()}× ${MATERIAL_NAME}.</p>`}</div>`;
    $("microRelearnCancel").onclick=()=>d.hidden=true;
    $("microRelearnConfirm").onclick=()=>confirmReplace(oldSpell,$("microRelearnChoice").value)
  }
  function confirmReplace(oldSpell,key){
    const next=sourceSpells().find(sp=>(sp.codexKey||sp.name)===key);if(!next||!unlocked(next))return;
    if(!canPay(oldSpell)){renderPanel();return}
    if(!confirm(`Substituir “${oldSpell.name}” por “${next.name}”?\n\nEsta ação consumirá os recursos de reaprendizado e não pode ser desfeita automaticamente.`))return;
    if(!pay(oldSpell))return;
    const at=known().findIndex(x=>x===oldSpell||x.name===oldSpell.name);if(at<0)return;
    state.magic.known.splice(at,1,{...next,sourceClass:state.cls,source:next.reference?"Codex • Reaprendida":"Codex • Reaprendida",relearnedAt:new Date().toISOString()});
    state.magic.relearnHistory=Array.isArray(state.magic.relearnHistory)?state.magic.relearnHistory:[];state.magic.relearnHistory.push({removed:oldSpell.name,added:next.name,circle:lvl(oldSpell),cost:cost(oldSpell),at:new Date().toISOString()});
    save();$("microRelearnModal").hidden=true;try{renderKnown();renderMagicAvailable();renderAttackSpells();renderMaterials();renderP2()}catch(e){}renderPanel();showInfo("Magia reaprendida",`<b>${escapeHtml(oldSpell.name)}</b> foi retirada e <b>${escapeHtml(next.name)}</b> entrou na lista de Magias Conhecidas.`)
  }

  // Substitui a exclusão livre antiga. O botão visual continua no mesmo lugar,
  // mas agora inicia o processo de reaprendizado e nunca apaga silenciosamente.
  globalThis.removeKnown=openReplace;
  globalThis.MICROCOSMOS_SPELL_RELEARNING={openWindow,closeWindow,openReplace,cost};

  // Qualquer botão atual/futuro cujo texto seja “Descanso Longo” abre a janela
  // depois que a rotina original de descanso terminar.
  function bindLongRestButtons(){document.querySelectorAll("button").forEach(btn=>{if(btn.dataset.microRelearnBound)return;if(/descanso\s+longo/i.test(btn.textContent||"")){btn.dataset.microRelearnBound="1";btn.addEventListener("click",()=>setTimeout(openWindow,80))}})}
  const observer=new MutationObserver(bindLongRestButtons);observer.observe(document.body,{childList:true,subtree:true});bindLongRestButtons();
  if(typeof renderKnown==="function"){const old=renderKnown;renderKnown=function(){const r=old.apply(this,arguments);setTimeout(renderPanel,0);return r}}
  window.addEventListener("pageshow",()=>setTimeout(renderPanel,0));ensureUi();renderPanel();
})();
