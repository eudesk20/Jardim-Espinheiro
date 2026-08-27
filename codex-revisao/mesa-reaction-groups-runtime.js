/* MICROCOSMOS — Grupos exclusivos do sistema de Reações.
   Este runtime NÃO altera quem pode atacar, curar, buffar ou selecionar como alvo.
   Ele existe somente para responder duas perguntas do motor de Reações:
   "estes tokens são aliados?" e "estes tokens são hostis?".

   Tipo do token e Grupo de Reação são independentes:
   - Jogador / Monstro / NPC = identidade do token.
   - Companhia / Oposição / Neutro / Grupo A / Grupo B = relação usada pelas Reações.

   NPCs começam Neutros por segurança. O Mestre pode colocá-los na Companhia,
   Oposição ou em outro grupo sem alterar qualquer outra interação da Mesa. */
(function(){
  if(globalThis.MICROCOSMOS_REACTION_GROUPS)return;
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  if(!Array.isArray(players))return;

  const $=id=>document.getElementById(id);
  const TYPES={player:"🧑 Jogador",monster:"👹 Monstro",npc:"🎭 NPC"};
  const TEAMS={party:"🟢 Companhia / Jogadores",hostile:"🔴 Oposição",neutral:"🟡 Neutro",group_a:"🟣 Grupo A",group_b:"🔵 Grupo B"};
  const validType=v=>Object.prototype.hasOwnProperty.call(TYPES,String(v||""));
  const validTeam=v=>Object.prototype.hasOwnProperty.call(TEAMS,String(v||""));
  let lastSelected="",lastSignature="",flushTimer=null;

  function inferType(p){
    if(validType(p?.reactionActorType))return p.reactionActorType;
    if(p?.linked||p?.userId&&!p?.creature&&!p?.ipm)return"player";
    if(p?.creature||p?.ipm)return"monster";
    return"npc"
  }
  function inferTeam(p,type=inferType(p)){
    if(validTeam(p?.reactionTeam))return p.reactionTeam;
    if(type==="player")return"party";
    if(type==="monster")return"hostile";
    return"neutral"
  }
  function identity(p){const type=inferType(p),team=inferTeam(p,type);return{type,team,typeLabel:TYPES[type],teamLabel:TEAMS[team]}}
  function isFriendly(a,b){const A=identity(a),B=identity(b);return A.team!=="neutral"&&B.team!=="neutral"&&A.team===B.team}
  function isHostile(a,b){const A=identity(a),B=identity(b);return A.team!=="neutral"&&B.team!=="neutral"&&A.team!==B.team}
  function canReactBetween(a,b){return isHostile(a,b)}

  function isMaster(){try{return globalThis.MICROCOSMOS_MESA_SHARED?.isMaster?.()===true}catch{return false}}
  function selectedToken(){const id=document.querySelector("#tokenLayer .token.selected")?.dataset?.token||"";return players.find(p=>String(p.id)===String(id))||null}
  function scheduleFlush(p){
    if(!p||!isMaster())return;clearTimeout(flushTimer);flushTimer=setTimeout(()=>globalThis.MICROCOSMOS_MESA_SHARED?.flushToken?.(p.id,false),120)
  }
  function ensureDefaults(p,persist=false){
    if(!p)return false;let changed=false;
    if(!validType(p.reactionActorType)){p.reactionActorType=inferType(p);changed=true}
    if(!validTeam(p.reactionTeam)){p.reactionTeam=inferTeam(p,p.reactionActorType);changed=true}
    if(changed&&persist)scheduleFlush(p);return changed
  }
  function ensureAll(persist=false){for(const p of players)ensureDefaults(p,persist)}

  function ensureCss(){
    if($("microReactionGroupsStyle"))return;const s=document.createElement("style");s.id="microReactionGroupsStyle";s.textContent=`
      #microReactionGroupPanel{margin-top:9px;padding:8px;border:1px solid #a58c68;border-radius:10px;background:#f7efd9;display:grid;gap:6px}
      #microReactionGroupPanel .micro-rg-title{font-weight:bold;color:#4d3b2b}.micro-rg-note{font-size:.68rem;color:#735f49;line-height:1.3}
      #microReactionGroupPanel .micro-rg-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}#microReactionGroupPanel label{font-size:.66rem;font-weight:bold;color:#6b563f}
      #microReactionGroupPanel select{width:100%;margin-top:3px;padding:6px;border:1px solid #a58c68;border-radius:7px;background:#fffaf0;color:#382b20}
      #microReactionGroupPanel .micro-rg-state{font-size:.69rem;padding:5px 7px;border-radius:7px;background:#fffaf0;border:1px solid #c7b28c}
      @media(max-width:720px){#microReactionGroupPanel .micro-rg-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(s)
  }
  function optionHtml(map,current){return Object.entries(map).map(([value,label])=>`<option value="${value}"${value===current?" selected":""}>${label}</option>`).join("")}
  function renderPanel(){
    ensureAll(isMaster());
    const card=$("tokenCard"),p=selectedToken();if(!card||!p)return;
    const sig=`${p.id}:${p.reactionActorType}:${p.reactionTeam}:${isMaster()}`;
    let panel=$("microReactionGroupPanel");
    if(!isMaster()){panel?.remove();lastSelected=String(p.id);lastSignature=sig;return}
    ensureCss();
    if(panel&&lastSelected!==String(p.id)){panel.remove();panel=null}
    if(!panel){panel=document.createElement("div");panel.id="microReactionGroupPanel";card.appendChild(panel)}
    if(sig===lastSignature&&panel.querySelector("select"))return;
    const info=identity(p);
    panel.innerHTML=`<div class="micro-rg-title">↩️ Relação para Reações</div><div class="micro-rg-note">Afeta somente Reações automáticas. Ataques normais, buffs, cura e outras interações continuam livres.</div><div class="micro-rg-grid"><label>Tipo do token<select id="microReactionActorType">${optionHtml(TYPES,info.type)}</select></label><label>Grupo de Reação<select id="microReactionTeam">${optionHtml(TEAMS,info.team)}</select></label></div><div class="micro-rg-state">${info.typeLabel} • ${info.teamLabel}</div>`;
    $("microReactionActorType").onchange=e=>{p.reactionActorType=e.target.value;const oldTeam=p.reactionTeam;if(!validTeam(oldTeam))p.reactionTeam=inferTeam(p,p.reactionActorType);lastSignature="";scheduleFlush(p);renderPanel()};
    $("microReactionTeam").onchange=e=>{p.reactionTeam=e.target.value;lastSignature="";scheduleFlush(p);renderPanel()};
    lastSelected=String(p.id);lastSignature=sig
  }

  ensureAll(false);setInterval(renderPanel,350);
  globalThis.MICROCOSMOS_REACTION_GROUPS={version:1,TYPES,TEAMS,identity,isFriendly,isHostile,canReactBetween,ensureDefaults,ensureAll};
})();