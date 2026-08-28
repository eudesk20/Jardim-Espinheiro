/* MICROCOSMOS — correção de clique do modal de Perícias Flexíveis.
   Garante que o seletor de Atributo fique acima de todas as camadas da Mesa
   e que FOR/DES/CON/INT/SAB/CAR sejam clicáveis mesmo quando o menu contextual
   do Token ainda estiver aberto em segundo plano.
*/
(function(){
  if(globalThis.MICROCOSMOS_MESA_FLEXIBLE_SKILLS_CLICK_FIX)return;
  globalThis.MICROCOSMOS_MESA_FLEXIBLE_SKILLS_CLICK_FIX=true;

  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS||[];
  const api=()=>globalThis.MICROCOSMOS_MESA_FLEXIBLE_SKILLS_API;
  const $=id=>document.getElementById(id);

  function ensureStyle(){
    if($("microMesaSkillClickFixStyle"))return;
    const style=document.createElement("style");
    style.id="microMesaSkillClickFixStyle";
    style.textContent=`
      #microMesaSkillModal{z-index:5000!important;pointer-events:auto!important;isolation:isolate!important}
      #microMesaSkillModal .micro-ms-card{position:relative;z-index:1;pointer-events:auto!important}
      #microMesaSkillModal .micro-ms-ability,
      #microMesaSkillModal .micro-ms-mode select,
      #microMesaSkillModal #microMesaSkillClose{pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important}
    `;
    document.head.appendChild(style)
  }

  function hideOldTokenMenu(){
    const menu=$("microTokenActionMenu");
    if(menu&&!menu.hidden)menu.hidden=true
  }

  function reinforceModal(){
    const modal=$("microMesaSkillModal");
    if(!modal||modal.hidden)return;
    hideOldTokenMenu();
    modal.style.setProperty("z-index","5000","important");
    modal.style.setProperty("pointer-events","auto","important")
  }

  function rollChoice(button){
    const modal=$("microMesaSkillModal"),engine=api();
    if(!modal||!engine?.roll||!engine?.skillsFor)return false;
    const tokenId=String(modal.dataset.tokenId||"");
    const p=players.find(x=>String(x.id)===tokenId);if(!p)return false;
    const skillName=String(modal.dataset.skillName||"");
    const skill=engine.skillsFor(p).find(s=>String(s.name)===skillName);if(!skill)return false;
    const ability=String(button?.dataset?.mesaSkillAbility||"");if(!ability)return false;
    const mode=$("microMesaSkillMode")?.value||"normal";
    modal.hidden=true;
    hideOldTokenMenu();
    engine.roll(p,skill,ability,mode);
    return true
  }

  // Captura antes do listener delegado antigo para impedir clique perdido ou rolagem dupla.
  document.addEventListener("click",event=>{
    const button=event.target.closest?.('#microMesaSkillModal [data-mesa-skill-ability]');
    if(!button)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    rollChoice(button)
  },true);

  // O botão Fechar também fica protegido contra camadas da Mesa.
  document.addEventListener("click",event=>{
    const close=event.target.closest?.("#microMesaSkillClose");if(!close)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const modal=$("microMesaSkillModal");if(modal)modal.hidden=true;hideOldTokenMenu()
  },true);

  ensureStyle();

  // O modal só é criado na primeira Perícia. Assim que existir, observamos apenas
  // o atributo hidden dele, sem MutationObserver sobre a Mesa inteira.
  let attempts=0;
  const timer=setInterval(()=>{
    const modal=$("microMesaSkillModal");
    if(!modal){if(++attempts>240)clearInterval(timer);return}
    clearInterval(timer);
    const obs=new MutationObserver(reinforceModal);
    obs.observe(modal,{attributes:true,attributeFilter:["hidden"]});
    reinforceModal();
    globalThis.MICROCOSMOS_MESA_FLEXIBLE_SKILLS_CLICK_FIX_API={reinforce:reinforceModal,rollChoice,observer:obs}
  },125);
})();
