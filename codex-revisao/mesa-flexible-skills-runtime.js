/* MICROCOSMOS — Perícias Flexíveis na Mesa da Campanha v1.
   Espelha a regra da ficha:
   - Perícia = o que o personagem sabe fazer.
   - Atributo = como ele executa a ação nesta cena.
   - Proficiência / Especialização pertencem à Perícia.
   - O Atributo sugerido é referência, não trava.

   A rolagem é publicada pelo Histórico compartilhado da Mesa como qualquer
   outra entrada local. Não consome Ação automaticamente: o custo narrativo ou
   tático de um teste continua sendo decidido pelo Mestre conforme a situação.
*/
(async function(){
  if(globalThis.MICROCOSMOS_MESA_FLEXIBLE_SKILLS)return;
  globalThis.MICROCOSMOS_MESA_FLEXIBLE_SKILLS=true;

  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  if(!Array.isArray(players))return;

  const $=id=>document.getElementById(id);
  const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const clampRank=v=>Math.min(2,Math.max(0,Number(v)||0));
  const fmt=v=>(Number(v)||0)>=0?`+${Number(v)||0}`:String(Number(v)||0);

  const ATTRIBUTES=[
    {key:"FOR",label:"Força",icon:"💪",approach:"força física, impacto, carga ou imposição corporal"},
    {key:"DES",label:"Destreza",icon:"🪶",approach:"precisão, agilidade, coordenação ou delicadeza"},
    {key:"CON",label:"Constituição",icon:"🛡️",approach:"resistência, persistência ou esforço prolongado"},
    {key:"INT",label:"Inteligência",icon:"🧠",approach:"conhecimento, memória, lógica ou planejamento"},
    {key:"SAB",label:"Sabedoria",icon:"👁️",approach:"percepção, instinto, experiência ou leitura do ambiente"},
    {key:"CAR",label:"Carisma",icon:"✨",approach:"presença, influência, expressão ou liderança"}
  ];

  // Mesmos nomes exibidos atualmente na Ficha Integrada. aliases preservam
  // compatibilidade com dados antigos/5e ainda usados pelo enriquecimento da Mesa.
  const CATALOG=[
    {name:"Atletismo de Carga",suggested:"FOR",aliases:["Atletismo"]},
    {name:"Acrobacia do Matagal",suggested:"DES",aliases:["Acrobacia"]},
    {name:"Furtividade entre Folhas",suggested:"DES",aliases:["Furtividade"]},
    {name:"Prestidigitação de Sucata",suggested:"DES",aliases:["Prestidigitação"]},
    {name:"Sobrevivência Climática",suggested:"CON",aliases:[]},
    {name:"Arcanismo do Jardim",suggested:"INT",aliases:["Arcanismo"]},
    {name:"História do Jardim",suggested:"INT",aliases:["História"]},
    {name:"Investigação de Sucata",suggested:"INT",aliases:["Investigação"]},
    {name:"Natureza do Micromundo",suggested:"INT",aliases:["Natureza"]},
    {name:"Alquimia Natural",suggested:"INT",aliases:[]},
    {name:"Intuição de Colônia",suggested:"SAB",aliases:["Intuição"]},
    {name:"Percepção do Matagal",suggested:"SAB",aliases:["Percepção"]},
    {name:"Medicina de Ervas",suggested:"SAB",aliases:["Medicina"]},
    {name:"Trato com Criaturas",suggested:"SAB",aliases:["Adestrar Animais"]},
    {name:"Sobrevivência do Jardim",suggested:"SAB",aliases:["Sobrevivência"]},
    {name:"Atuação Ressonante",suggested:"CAR",aliases:["Atuação"]},
    {name:"Enganação",suggested:"CAR",aliases:[]},
    {name:"Intimidação",suggested:"CAR",aliases:[]},
    {name:"Persuasão",suggested:"CAR",aliases:[]}
  ];

  let supabase=null,userId="",profileRole="",lastRanksAt=0,lastPanelSignature="";
  const ranksByCharacter=new Map(),ranksByUser=new Map();

  function prof(p){const level=Math.max(1,Number(p?.level)||1);return 2+Math.floor((level-1)/4)}
  function abilityMod(p,key){return Math.floor(((Number(p?.stats?.[key])||10)-10)/2)}
  function selectedToken(){const id=document.querySelector("#tokenLayer .token.selected")?.dataset?.token||"";return players.find(p=>String(p.id)===String(id))||null}
  function settings(){return globalThis.MICROCOSMOS_MESA_SETTINGS}
  function flexibleEnabled(){return settings()?.tableRule?.("flexibleSkills",true)!==false}
  function isMaster(){try{return settings()?.isMaster?.()===true||globalThis.MICROCOSMOS_MESA_SHARED?.isMaster?.()===true||profileRole==="master"}catch{return profileRole==="master"}}
  function ownerId(p){return String(p?.userId||p?.ownerUserId||"")}
  function canControl(p){return !!p&&(isMaster()||!!userId&&ownerId(p)===String(userId))}

  function rawRanks(p){
    const byCharacter=p?.characterId?ranksByCharacter.get(String(p.characterId)):null;
    if(byCharacter)return byCharacter;
    const byUser=ownerId(p)?ranksByUser.get(ownerId(p)):null;
    return byUser||null
  }
  function namesFor(skill){return[skill.name,...(skill.aliases||[])]}
  function findExistingSkill(p,skill){
    const wanted=new Set(namesFor(skill).map(norm));
    return (Array.isArray(p?.skills)?p.skills:[]).find(item=>wanted.has(norm(item?.name)))||null
  }
  function rankFor(p,skill){
    const source=rawRanks(p);
    if(source&&typeof source==="object")for(const name of namesFor(skill))if(Object.prototype.hasOwnProperty.call(source,name))return clampRank(source[name]);
    const existing=findExistingSkill(p,skill);if(existing&&Object.prototype.hasOwnProperty.call(existing,"rank"))return clampRank(existing.rank);
    return 0
  }
  function trainingFor(p,skill){
    const rank=rankFor(p,skill);if(rank)return rank*prof(p);
    const existing=findExistingSkill(p,skill);
    // Criaturas/NPCs podem trazer somente um bônus pronto em vez de rank.
    if(existing&&!Object.prototype.hasOwnProperty.call(existing,"rank")&&Number.isFinite(Number(existing.bonus)))return Number(existing.bonus)-abilityMod(p,skill.suggested);
    return 0
  }
  function bonusFor(p,skill,ability){return abilityMod(p,ability)+trainingFor(p,skill)}
  function rankLabel(p,skill){const rank=rankFor(p,skill),training=trainingFor(p,skill);if(rank===2)return`◆ Especialização • ${fmt(training)}`;if(rank===1)return`● Proficiente • ${fmt(training)}`;if(training)return`Treinamento • ${fmt(training)}`;return"○ Sem proficiência"}

  function skillsFor(p){
    const out=CATALOG.map(item=>({...item}));
    const covered=new Set(out.flatMap(item=>namesFor(item).map(norm)));
    for(const item of Array.isArray(p?.skills)?p.skills:[]){
      const name=String(item?.name||"").trim();if(!name||covered.has(norm(name)))continue;
      const suggested=ATTRIBUTES.some(a=>a.key===item?.ability)?item.ability:"SAB";
      out.push({name,suggested,aliases:[],extra:true});covered.add(norm(name))
    }
    return out
  }

  async function refreshRawRanks(force=false){
    if(!supabase||!userId||!force&&Date.now()-lastRanksAt<3500)return;
    lastRanksAt=Date.now();
    try{
      const {data,error}=await supabase.from("characters").select("id,user_id,data");if(error)return;
      ranksByCharacter.clear();ranksByUser.clear();
      for(const row of data||[]){const ranks=row?.data?.skillRanks||{};ranksByCharacter.set(String(row.id),ranks);if(row.user_id)ranksByUser.set(String(row.user_id),ranks)}
      lastPanelSignature=""
    }catch(_e){}
  }

  function ensureCss(){
    if($("microMesaFlexibleSkillsStyle"))return;
    const style=document.createElement("style");style.id="microMesaFlexibleSkillsStyle";style.textContent=`
      #microMesaSkillsPanel{margin-top:9px;padding:9px;border:1px solid #9c805a;border-radius:10px;background:#fff7e4;display:grid;gap:7px}
      #microMesaSkillsPanel .micro-ms-title{font-weight:bold;color:#4c3a2a}.micro-ms-note{font-size:.68rem;color:#715d47;line-height:1.35}.micro-ms-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:end}.micro-ms-row label{font-size:.66rem;font-weight:bold;color:#6d5840}.micro-ms-row select{width:100%;margin-top:3px;padding:7px;border:1px solid #a68d68;border-radius:7px;background:#fffaf0}.micro-ms-current{font-size:.67rem;color:#6f5941;padding:5px 7px;border:1px solid #cfbb96;border-radius:7px;background:#fffdf7}
      #microMesaSkillModal{position:fixed;inset:0;z-index:270;background:#08110ccc;display:grid;place-items:center;padding:12px}#microMesaSkillModal[hidden]{display:none}.micro-ms-card{width:min(690px,96vw);max-height:90vh;overflow:auto;padding:13px;border:3px double #745c3c;border-radius:16px;background:#efe5cc;color:#30271e;box-shadow:0 18px 50px #000b}.micro-ms-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.micro-ms-head h2{margin:0;color:#4f3864}.micro-ms-summary{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 11px}.micro-ms-chip{padding:4px 7px;border:1px solid #ad9470;border-radius:999px;background:#fff8e7;font-size:.69rem}.micro-ms-mode{display:grid;grid-template-columns:1fr;gap:3px;margin-bottom:9px;font-size:.68rem;font-weight:bold;color:#6c5842}.micro-ms-mode select{padding:7px;border:1px solid #9f8765;border-radius:7px;background:#fffaf0}.micro-ms-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.micro-ms-ability{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;padding:9px;border:1px solid #a58b66;border-radius:9px;background:#fffaf0;color:#392c21;text-align:left}.micro-ms-ability:hover{border-color:#715087;background:#f6eef9}.micro-ms-ability.suggested{border-color:#9a7139;background:#fff1ca;box-shadow:inset 0 0 0 1px #d7b66c}.micro-ms-icon{font-size:1.2rem}.micro-ms-copy{display:grid;gap:2px}.micro-ms-copy b{color:#503868}.micro-ms-copy small{font-weight:normal;color:#725e49;line-height:1.25}.micro-ms-total{font-size:1.05rem;color:#62447a}.micro-ms-foot{font-size:.69rem;color:#725e49;line-height:1.4;margin:10px 0 0}
      @media(max-width:720px){.micro-ms-row{grid-template-columns:1fr}.micro-ms-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(style)
  }

  function ensureModal(){
    ensureCss();let modal=$("microMesaSkillModal");if(modal)return modal;
    modal=document.createElement("div");modal.id="microMesaSkillModal";modal.hidden=true;
    modal.innerHTML=`<div class="micro-ms-card"><div class="micro-ms-head"><div><small>↔ PERÍCIA FLEXÍVEL</small><h2 id="microMesaSkillTitle">Perícia</h2></div><button type="button" class="btn" id="microMesaSkillClose">✕ Fechar</button></div><div class="micro-ms-summary" id="microMesaSkillSummary"></div><label class="micro-ms-mode">Modo da rolagem<select id="microMesaSkillMode"><option value="normal">Normal</option><option value="adv">Vantagem</option><option value="dis">Desvantagem</option></select></label><div class="micro-ms-grid" id="microMesaSkillGrid"></div><p class="micro-ms-foot">Descreva primeiro a abordagem. O maior bônus não torna um Atributo automaticamente válido. A combinação precisa fazer sentido na ficção e pode ser ajustada pelo Mestre.</p></div>`;
    document.body.appendChild(modal);$("microMesaSkillClose").onclick=()=>modal.hidden=true;modal.onclick=e=>{if(e.target===modal)modal.hidden=true};
    $("microMesaSkillGrid").addEventListener("click",e=>{const b=e.target.closest?.("[data-mesa-skill-ability]");if(!b)return;rollFromModal(b.dataset.mesaSkillAbility)});
    return modal
  }

  async function openSkill(p,skill){
    if(!canControl(p))return;
    await refreshRawRanks(true);
    const current=players.find(x=>String(x.id)===String(p.id))||p;
    const modal=ensureModal();modal.dataset.tokenId=String(current.id);modal.dataset.skillName=skill.name;modal.hidden=false;
    $("microMesaSkillTitle").textContent=skill.name;
    $("microMesaSkillSummary").innerHTML=`<span class="micro-ms-chip">Sugestão: <b>${esc(skill.suggested)}</b></span><span class="micro-ms-chip">${esc(rankLabel(current,skill))}</span><span class="micro-ms-chip">Proficiência do nível: <b>${fmt(prof(current))}</b></span>`;
    $("microMesaSkillGrid").innerHTML=ATTRIBUTES.map(attr=>`<button type="button" class="micro-ms-ability ${attr.key===skill.suggested?"suggested":""}" data-mesa-skill-ability="${attr.key}"><span class="micro-ms-icon">${attr.icon}</span><span class="micro-ms-copy"><b>${attr.key} — ${attr.label}${attr.key===skill.suggested?" • sugerido":""}</b><small>${attr.approach}<br>Atributo ${fmt(abilityMod(current,attr.key))} • Perícia ${fmt(trainingFor(current,skill))}</small></span><strong class="micro-ms-total">${fmt(bonusFor(current,skill,attr.key))}</strong></button>`).join("");
    setTimeout(()=>$("microMesaSkillGrid")?.querySelector(".suggested")?.focus?.(),0)
  }

  function addLog(p,skill,ability,mode,rolls,natural,bonus,total){
    const log=$("rollLog");if(!log)return;
    const attr=ATTRIBUTES.find(a=>a.key===ability),entry=document.createElement("div");entry.className="log-entry";entry.style.borderLeftColor=p?.color||"#7d6c55";
    const diceText=mode==="normal"?String(natural):`${rolls.join(" / ")} → ${natural}`;
    const modeText=mode==="adv"?"Vantagem":mode==="dis"?"Desvantagem":"Normal";
    entry.innerHTML=`🧭 <b>${esc(p.name||"Personagem")}</b> testa <b>${esc(skill.name)}</b> com <b>${ability}</b><br>🎲 ${esc(diceText)} ${fmt(bonus)} = <b>${total}</b> • ${modeText}<br><small>${esc(attr?.label||ability)} ${fmt(abilityMod(p,ability))} • Perícia ${fmt(trainingFor(p,skill))}. A CD e o resultado narrativo são definidos pelo Mestre.</small>`;
    log.prepend(entry)
  }

  function roll(p,skill,ability,mode="normal"){
    if(!p||!skill||!canControl(p))return false;
    const r1=1+Math.floor(Math.random()*20),r2=1+Math.floor(Math.random()*20),rolls=mode==="normal"?[r1]:[r1,r2];
    const natural=mode==="adv"?Math.max(r1,r2):mode==="dis"?Math.min(r1,r2):r1,bonus=bonusFor(p,skill,ability),total=natural+bonus;
    addLog(p,skill,ability,mode,rolls,natural,bonus,total);
    const status=$("mapStatus");if(status){const text=`🧭 ${p.name}: ${skill.name} com ${ability} = ${total}`;status.textContent=text;clearTimeout(roll._statusTimer);roll._statusTimer=setTimeout(()=>{if(status.textContent===text)status.textContent="Arraste o mapa para navegar • toque no token para selecionar"},2200)}
    return{natural,bonus,total,mode,ability,skill:skill.name}
  }

  function rollFromModal(ability){
    const modal=$("microMesaSkillModal");if(!modal)return;
    const p=players.find(x=>String(x.id)===String(modal.dataset.tokenId));if(!p)return;
    const skill=skillsFor(p).find(s=>s.name===modal.dataset.skillName);if(!skill)return;
    const mode=$("microMesaSkillMode")?.value||"normal";modal.hidden=true;roll(p,skill,ability,mode)
  }

  function renderPanel(){
    ensureCss();const card=$("tokenCard"),p=selectedToken();if(!card||!p){$("microMesaSkillsPanel")?.remove();return}
    const skills=skillsFor(p),enabled=flexibleEnabled(),controlled=canControl(p),rankSource=rawRanks(p)||{};
    const signature=`${p.id}|${enabled}|${controlled}|${p.level}|${JSON.stringify(p.stats||{})}|${JSON.stringify(rankSource)}`;
    let panel=$("microMesaSkillsPanel");if(panel&&panel.dataset.tokenId!==String(p.id)){panel.remove();panel=null}
    if(!panel){panel=document.createElement("section");panel.id="microMesaSkillsPanel";panel.dataset.tokenId=String(p.id);card.appendChild(panel)}
    if(signature===lastPanelSignature&&panel.querySelector("select"))return;
    lastPanelSignature=signature;
    panel.innerHTML=`<div class="micro-ms-title">🧭 Perícias${enabled?" Flexíveis":""}</div><div class="micro-ms-note">${enabled?"Escolha a Perícia, descreva a abordagem e então escolha o Atributo usado na cena.":"Modo clássico da Mesa: a Perícia usa diretamente o Atributo sugerido."}</div><div class="micro-ms-row"><label>Perícia<select id="microMesaSkillSelect">${skills.map((skill,i)=>`<option value="${i}">${esc(skill.name)} • sug. ${skill.suggested} • ${esc(rankLabel(p,skill).replace(/ • .*/,""))}</option>`).join("")}</select></label><button type="button" class="btn ${enabled?"primary":""}" id="microMesaSkillRoll" ${controlled?"":"disabled"}>${enabled?"🎲 Escolher abordagem":"🎲 Rolar sugerido"}</button></div><div class="micro-ms-current">${controlled?"O teste não consome Ação automaticamente; o Mestre decide o custo conforme a situação.":"🔒 Você pode consultar as Perícias deste token, mas somente seu controlador pode rolar."}</div>`;
    $("microMesaSkillRoll").onclick=async()=>{const index=Number($("microMesaSkillSelect")?.value)||0,skill=skillsFor(p)[index];if(!skill)return;if(flexibleEnabled())await openSkill(p,skill);else roll(p,skill,skill.suggested,"normal")}
  }

  function injectSettingsOption(){
    const grid=$("microSettingsTableGrid"),s=settings();if(!grid||!s?.isMaster?.())return;
    let row=$("microFlexibleSkillsSetting");if(row){const input=row.querySelector("input");if(input)input.checked=flexibleEnabled();return}
    row=document.createElement("label");row.className="micro-setting";row.id="microFlexibleSkillsSetting";
    row.innerHTML=`<input type="checkbox" ${flexibleEnabled()?"checked":""}><span><b>↔ Perícias Flexíveis</b><small>ON: a abordagem escolhe FOR/DES/CON/INT/SAB/CAR. OFF: a Mesa usa o Atributo sugerido.</small></span>`;
    row.querySelector("input").onchange=e=>{s.setTable?.("flexibleSkills",!!e.target.checked);lastPanelSignature="";setTimeout(renderPanel,0)};
    grid.appendChild(row)
  }

  async function connect(){
    try{
      const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");supabase=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:{session}}=await supabase.auth.getSession();userId=session?.user?.id||"";if(userId){const {data}=await supabase.from("profiles").select("role,approved").eq("id",userId).maybeSingle();if(data?.approved!==false)profileRole=data?.role||"";await refreshRawRanks(true)}
    }catch(e){console.warn("MICROCOSMOS Perícias Flexíveis: dados online indisponíveis",e)}
    lastPanelSignature="";renderPanel()
  }

  window.addEventListener("microcosmos:settings-change",()=>{lastPanelSignature="";renderPanel();setTimeout(injectSettingsOption,0)});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshRawRanks(true)});
  setInterval(()=>{renderPanel();injectSettingsOption();refreshRawRanks(false)},420);
  await connect();

  globalThis.MICROCOSMOS_MESA_FLEXIBLE_SKILLS_API={
    version:1,attributes:ATTRIBUTES,catalog:CATALOG,skillsFor,rankFor,bonusFor,open:openSkill,roll,
    ruleKey:"flexibleSkills",enabled:flexibleEnabled
  };
})();
