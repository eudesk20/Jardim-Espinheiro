/* MICROCOSMOS — auditoria de componentes materiais das magias.
   Este arquivo é carregado depois da ficha e corrige exibição, vínculo e bloqueio de Foco/Bolsa. */
(function(){
  const audit=globalThis.SPELL_MATERIAL_AUDIT||{};
  if(typeof MATERIAL_CATALOG!=="undefined"){
    for(const [id,m] of Object.entries(MATERIAL_CATALOG)){
      m.quality=m.quality||m.rarity||"Comum";
      m.marketValue=m.marketValue||m.value||"A definir";
      m.magicUsageCount=0;
    }
    for(const spell of globalThis.CODEX_SPELL_DATA||[]){
      const a=audit[spell.key];
      for(const id of a?.materialIds||spell.materialIds||[]){
        if(MATERIAL_CATALOG[id])MATERIAL_CATALOG[id].magicUsageCount=(MATERIAL_CATALOG[id].magicUsageCount||0)+1;
      }
    }
  }

  const oldCodexSpellToSheet=typeof codexSpellToSheet==="function"?codexSpellToSheet:null;
  if(oldCodexSpellToSheet){
    codexSpellToSheet=function(spell){
      const out=oldCodexSpellToSheet(spell),a=audit[spell.key]||{};
      out.materialIds=[...(a.materialIds||spell.materialIds||[])];
      out.price=a.requiredValue||"";
      out.requiredValueGp=+a.requiredValueGp||0;
      out.consumed=!!a.consumed;
      out.focusReplaceable=a.focusReplaceable!==false;
      out.originalMaterial=a.originalMaterial||"";
      out.auditSource=a.auditSource||"";
      return out;
    };
  }

  if(typeof spellMaterialIds==="function"){
    spellMaterialIds=function(s){
      if(Array.isArray(s.materialIds)&&s.materialIds.length)return [...s.materialIds];
      const a=audit[s.codexKey];
      if(a?.materialIds?.length)return [...a.materialIds];
      return Object.entries(typeof GRIMOIRE_MATERIAL_LINKS!=="undefined"?GRIMOIRE_MATERIAL_LINKS:{}).filter(([,keys])=>keys.includes(s.codexKey)).map(([id])=>id);
    };
  }

  if(typeof materialBlock==="function"){
    materialBlock=function(s){
      const known=state.magic.known.some(x=>x.name===s.name),castButton=known?`<div style="margin-top:8px"><button class="btn primary" onclick="castSpell('${s.name.replace(/'/g,"\\'")}')">✨ Conjurar magia</button></div>`:"";
      if(!s.comp.includes("M"))return `<div class='material'><b>Material:</b> Nenhum.${castButton}</div>`;
      const ids=spellMaterialIds(s),hasPrice=!!String(s.price||"").trim(),mustHave=!!s.consumed||hasPrice,focusCovers=state.magic.componentPouch&&!mustHave;
      const materialNames=ids.map(id=>materialById(id)?.name||id).join(", ")||s.material||"material simples";
      const materialDetails=ids.map(id=>{const m=materialById(id);return m?`${m.name} — ${m.quality||m.rarity||"Comum"} • ${m.marketValue||m.value||"A definir"}`:id}).join("<br>");
      return `<div class="material"><b>🎒 Material:</b> ${esc(materialNames)}${materialDetails?`<br><span class="eq-note">${materialDetails}</span>`:""}<br>${s.consumed?"🔥 <b>Consumido ao conjurar.</b>":"♻️ <b>Não é consumido.</b>"}${hasPrice?`<br>💰 <b>Custo mínimo exigido pela magia:</b> ${esc(s.price)}`:""}${focusCovers?"<br>✅ Foco/Bolsa pode substituir este componente simples.":"<br>⛔ <b>Foco/Bolsa não substitui.</b> O componente deve estar no inventário."}${s.originalMaterial?`<br><small>Referência do componente original: ${esc(s.originalMaterial)}</small>`:""}${castButton}</div>`;
    };
  }

  const oldCastSpell=typeof castSpell==="function"?castSpell:null;
  if(oldCastSpell){
    castSpell=function(name){
      const s=state.magic.known.find(x=>x.name===name);if(!s)return false;
      if(!spellLevelUnlocked(s.lvl)){showPopup("🔒 Círculo ainda não liberado",s.name,`Sua Classe no nível ${state.level} ainda não pode conjurar esta magia.`);return false}
      if(s.reference){showPopup("🧪 Magia em análise",s.name,"A magia está sincronizada com a ficha, mas o Codex ainda não informa regras suficientes para realizar a conjuração automática.");return false}
      const ids=spellMaterialIds(s),hasPrice=!!String(s.price||"").trim(),focusCovers=s.comp.includes("M")&&state.magic.componentPouch&&!s.consumed&&!hasPrice;
      if(s.comp.includes("M")&&!focusCovers){
        const missing=ids.filter(id=>!(state.magic.specialMaterials||[]).some(x=>x.id===id&&+x.qty>0));
        if(!ids.length||missing.length){const names=missing.length?missing.map(id=>materialById(id)?.name||id).join(", "):s.material,reason=s.consumed?"O componente é consumido pela magia.":hasPrice?`A magia exige componente no valor mínimo de ${s.price}.`:"Não há Foco/Bolsa para fornecer o componente simples.";showPopup("🚫 Magia bloqueada",s.name,`${reason}<br><b>Necessário no inventário:</b> ${esc(names||"material indicado na magia")}.`);return false}
      }
      const slots=slotProgression(),slotLevel=state.cls==="bruxo"&&s.lvl>0&&s.lvl<=5?+(Object.keys(slots)[0]||s.lvl):s.lvl;
      if(s.lvl>0&&(!slots[slotLevel]||slots[slotLevel].used>=slots[slotLevel].max)){showPopup("🚫 Magia bloqueada",s.name,state.cls==="bruxo"?`Não há Slot Mágico de Pacto disponível do <b>${slotLevel}º Círculo Mágico</b>.`:`Não há Slot Mágico disponível do <b>${s.lvl}º Círculo Mágico</b>.`);return false}
      if(s.comp.includes("M")&&!focusCovers&&s.consumed){for(const id of ids){const item=state.magic.specialMaterials.find(x=>x.id===id);if(item)item.qty--;state.magic.specialMaterials=state.magic.specialMaterials.filter(x=>x.qty>0)}}
      if(s.lvl>0)state.magic.slots[slotLevel].used++;
      save();renderMaterials();renderSlots();renderInventory();addRollHistory("Magia","—",s.lvl?`${s.lvl}º Círculo Mágico`:"Truque","—",s.name);
      showPopup("✨ Magia conjurada",s.name,`${focusCovers?"O Foco/Bolsa substituiu o material simples.":s.comp.includes("M")&&s.consumed?"O componente consumível foi retirado automaticamente do inventário.":s.comp.includes("M")?"O componente obrigatório foi verificado no inventário e não foi consumido.":"Nenhum material foi necessário."}`);return true;
    };
  }

  if(typeof renderCodexContent==="function"){
    const oldRenderCodexContent=renderCodexContent;
    renderCodexContent=function(entry){
      oldRenderCodexContent(entry);
      if(!entry||entry.category!=="materials"||!entry.discovered)return;
      const d=entry.data,out=document.getElementById("codexContent");if(!out)return;
      const core=out.querySelector(".codex-core");
      if(core){
        core.insertAdjacentHTML("beforeend",`<div class="codex-core-card"><b>Qualidade</b>${esc(d.quality||d.rarity||"Comum")}</div><div class="codex-core-card"><b>Uso em Magias</b>${Number(d.magicUsageCount||0)}</div>`);
      }
      const title=[...out.querySelectorAll("h3")].find(h=>/Pode ser usado em/i.test(h.textContent));
      if(title&&Number(d.magicUsageCount||0)===0&&String(d.use||"").includes("Magia"))title.insertAdjacentHTML("beforebegin",'<div class="note"><b>Auditoria:</b> este material está classificado para uso mágico, mas ainda não possui uma Magia específica vinculada. Ele continua válido para Receitas/Projetos e para futuras Magias, porém não será exigido automaticamente até receber um vínculo.</div>');
    };
  }

  // Reconstrói vínculos a partir da fonte oficial das magias, eliminando listas antigas incompletas.
  if(typeof GRIMOIRE_MATERIAL_LINKS!=="undefined"){
    for(const id of Object.keys(GRIMOIRE_MATERIAL_LINKS))GRIMOIRE_MATERIAL_LINKS[id]=[];
    for(const spell of globalThis.CODEX_SPELL_DATA||[]){
      const ids=audit[spell.key]?.materialIds||spell.materialIds||[];
      for(const id of ids){if(!GRIMOIRE_MATERIAL_LINKS[id])GRIMOIRE_MATERIAL_LINKS[id]=[];GRIMOIRE_MATERIAL_LINKS[id].push(spell.key)}
    }
  }

  // Atualiza as cópias já carregadas no estado e redesenha a interface.
  if(typeof enforceCodexAuthority==="function")enforceCodexAuthority();
  if(typeof renderMagicAll==="function")renderMagicAll();
  if(typeof renderCodex==="function")renderCodex();
})();
