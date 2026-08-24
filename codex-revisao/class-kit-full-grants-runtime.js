/* MICROCOSMOS — Kits Iniciais completos.
   Problema 2: complementa o Kit A/B/C com armas/armaduras/escudos reais do
   EQUIPMENT_CATALOG. Equipamentos entram diretamente na lista de combate. */
(function(){
 if(globalThis.MICROCOSMOS_CLASS_KIT_FULL_GRANTS)return;globalThis.MICROCOSMOS_CLASS_KIT_FULL_GRANTS=true;
 const G={
 barbaro:{A:["machado_mandibula","espinho_arremesso","espinho_arremesso","couro_folha"],B:["machado_casca","tampinha","couro_folha"],C:["espada_agulha","espada_agulha","espinho_arremesso","espinho_arremesso","espinho_arremesso"]},
 bardo:{A:["espada_agulha"],B:["besta_graveto"],C:["espinho_curto"]},
 bastiao:{A:["tampinha","agulha","malha_formiga"],B:["tampinha","alabarda_galho","escamas_besouro"],C:["couro_batido","espada_agulha"]},
 clerigo:{A:["couro_folha","noz_maca"],B:["tampinha","noz_maca"],C:["cajado_raiz"]},
 druida:{A:["cajado_raiz","couro_folha"],B:["espinho_curto"],C:["lamina_casca","couro_folha"]},
 guerreiro:{A:["florete_ferrão","tampinha","couro_batido"],B:["agulha","tampinha","escamas_besouro"],C:["arco_libelula","espinho_curto","couro_folha"]},
 monge:{A:["espada_agulha","espada_agulha"],B:["cajado_raiz"],C:["lamina_casca"]},
 paladino:{A:["tampinha","machado_casca","escamas_besouro"],B:["alabarda_galho","escamas_besouro"],C:["machado_casca","tampinha","couro_batido"]},
 patrulheiro:{A:["arco_libelula","espinho_curto","couro_folha"],B:["lanca_espinho","escamas_besouro"],C:["espada_agulha","besta_graveto","couro_folha"]},
 ladino:{A:["espinho_curto","couro_folha"],B:["espada_agulha","couro_folha"],C:["besta_pata","espinho_curto","couro_folha"]},
 feiticeiro:{A:["cajado_raiz"],B:["espada_agulha"],C:["couro_folha"]},
 bruxo:{A:["cajado_raiz"],B:["espada_agulha","couro_folha"],C:["besta_graveto"]},
 mago:{A:["cajado_raiz"],B:["espinho_curto"],C:["espinho_curto"]},
 cozinheiro:{A:["espinho_curto"],B:["galho_curto"],C:["espinho_curto"]},
 engenheiro:{A:["espinho_curto"],B:["besta_graveto"],C:["galho_curto"]}
 };
 globalThis.CLASS_STARTING_KIT_EQUIPMENT=G;
 function removeOld(){const ids=Array.isArray(state.startingKitEquipmentGrant)?state.startingKitEquipmentGrant:[];for(const grantId of ids){const at=(state.equipment||[]).findIndex(e=>e.kitGrantId===grantId);if(at>=0)state.equipment.splice(at,1)}state.startingKitEquipmentGrant=[]}
 function apply(cls,letter){removeOld();const ids=G[cls]?.[letter]||[],grants=[];ids.forEach((id,n)=>{const item=globalThis.EQUIPMENT_CATALOG?.[id]||((typeof EQUIPMENT_CATALOG!=="undefined")?EQUIPMENT_CATALOG[id]:null);if(!item)return;const grantId=`kit:${cls}:${letter}:${n}:${id}`;(state.equipment||(state.equipment=[])).push({...item,catalogId:id,kitGrantId:grantId,source:"Kit Inicial"});grants.push(grantId)});state.startingKitEquipmentGrant=grants;try{save();renderEquipment();renderInventory()}catch(e){}return ids}
 function patch(){if(typeof globalThis.selectStartingKit!=="function"||globalThis.selectStartingKit.microFullGrants)return;const old=globalThis.selectStartingKit;const wrapped=function(letter){const before=state.startingKit,cls=(document.getElementById("p1ClassSelect")?.value||state.cls||"");const r=old.apply(this,arguments);if(state.startingKit===letter&&state.startingKitClass===cls&&(before!==letter||!Array.isArray(state.startingKitEquipmentGrant)||!state.startingKitEquipmentGrant.length)){const ids=apply(cls,letter);if(typeof showPopup==="function"&&ids.length)showPopup("🎒 Equipamentos do Kit",`Kit ${letter}`,`${ids.length} equipamento(s) do Codex foram adicionados automaticamente à área de Armas/Armaduras.`)}return r};wrapped.microFullGrants=true;globalThis.selectStartingKit=wrapped}
 setTimeout(patch,0);setTimeout(patch,250);setTimeout(()=>{patch();if(state.startingKit&&state.startingKitClass&&(!state.startingKitEquipmentGrant||!state.startingKitEquipmentGrant.length)){apply(state.startingKitClass,state.startingKit)}},700);
})();
