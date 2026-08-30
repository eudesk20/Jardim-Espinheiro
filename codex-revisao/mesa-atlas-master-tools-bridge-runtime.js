/* MICROCOSMOS — integra o Atlas da Campanha à gaveta Ferramentas do Mestre. */
(function(){
  if(globalThis.MICROCOSMOS_ATLAS_MASTER_TOOLS_BRIDGE)return;
  globalThis.MICROCOSMOS_ATLAS_MASTER_TOOLS_BRIDGE=true;

  const $=id=>document.getElementById(id);
  let mounting=false;

  function ensureStyle(){
    if($("microAtlasMasterToolsBridgeStyle"))return;
    const s=document.createElement("style");
    s.id="microAtlasMasterToolsBridgeStyle";
    s.textContent=`
      #microMasterAtlasSection .micro-master-section-body{display:grid;gap:8px}
      #microMasterAtlasSection #microCampaignAtlas,
      #microMasterAtlasSection #microAtlasEntryPanel,
      #microMasterAtlasSection #microAtlasTransitionPanel{margin:0!important;border:1px solid #a48d68!important;border-radius:10px!important;box-shadow:none!important;padding:8px!important;background:#fffaf0!important}
      #microMasterAtlasSection #microCampaignAtlas{order:10}
      #microMasterAtlasSection #microAtlasEntryPanel{order:20}
      #microMasterAtlasSection #microAtlasTransitionPanel{order:30}
      #microMasterAtlasSection .micro-atlas-head h2{font-size:1.05rem}
      #microMasterAtlasSection .micro-atlas{margin-top:0!important}
      @media(max-width:720px){#microMasterAtlasSection .micro-atlas-actions,#microMasterAtlasSection .micro-entry-actions{flex-wrap:wrap}}
    `;
    document.head.appendChild(s)
  }

  function bindAccordion(section,root){
    if(section.dataset.atlasAccordionBound)return;
    section.dataset.atlasAccordionBound="1";
    section.addEventListener("toggle",()=>{
      if(!section.open)return;
      root.querySelectorAll(":scope>.micro-master-section").forEach(other=>{if(other!==section&&other.open)other.open=false});
      mount()
    })
  }

  function ensureSection(root){
    let section=$("microMasterAtlasSection");
    if(!section){
      section=document.createElement("details");
      section.id="microMasterAtlasSection";
      section.className="micro-master-section";
      section.innerHTML='<summary>🗂️ Atlas da Campanha</summary><div class="micro-master-section-body"></div>';
      const scene=$("microMasterSceneSection"),creatures=$("microMasterCreatureSection");
      if(scene?.parentElement===root)scene.insertAdjacentElement("afterend",section);
      else if(creatures?.parentElement===root)root.insertBefore(section,creatures);
      else root.appendChild(section)
    }
    const summary=section.querySelector("summary");if(summary)summary.textContent="🗂️ Atlas da Campanha";
    bindAccordion(section,root);
    return section
  }

  function mount(){
    if(mounting)return;mounting=true;
    try{
      const root=$("microMasterAccordion"),drawer=$("microMasterDrawer");
      if(!root||!drawer)return false;
      ensureStyle();
      const section=ensureSection(root),body=section.querySelector(".micro-master-section-body");
      if(!body)return false;
      const atlas=$("microCampaignAtlas"),entries=$("microAtlasEntryPanel"),transitions=$("microAtlasTransitionPanel");
      for(const panel of [atlas,entries,transitions])if(panel&&panel.parentElement!==body)body.appendChild(panel);
      if(!atlas&&!entries&&!transitions)body.innerHTML='<div class="micro-empty-tool">O Atlas ainda está carregando…</div>';
      else body.querySelector(".micro-empty-tool")?.remove();
      return true
    }finally{mounting=false}
  }

  // Os runtimes do Atlas carregam depois do organizador do Mestre; as chamadas abaixo
  // são idempotentes e apenas reencaixam o mesmo elemento quando ele surgir.
  let tries=0;const timer=setInterval(()=>{mount();if(++tries>40&&$("microCampaignAtlas")&&$("microAtlasEntryPanel")&&$("microAtlasTransitionPanel"))clearInterval(timer)},250);
  for(const ev of ["microcosmos:atlas-entry-points-changed","microcosmos:atlas-transitions-changed","microcosmos:atlas-players-transferred"])
    document.addEventListener(ev,()=>setTimeout(mount,0));
  document.addEventListener("click",e=>{if(e.target?.closest?.("#microMasterToggle,#microMasterDrawer"))setTimeout(mount,20)},true);
  mount();
})();
