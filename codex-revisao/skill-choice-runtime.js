/* MICROCOSMOS — Escolha manual de Perícias na ficha.
   Corrige dois bloqueios do protótipo integrado:
   1) os marcadores de perícia eram renderizados como disabled;
   2) enforceCodexAuthority zerava state.skillRanks em cada carregamento.
   Enquanto as escolhas estruturadas por Classe/Origem não estão totalmente
   automatizadas, o jogador pode alternar Sem proficiência / Proficiência /
   Especialização. As escolhas são preservadas por conta neste navegador. */
(function(){
  const SESSION_KEY="MICROCOSMOS_AUTH_DEMO_SESSION_V1";
  const user=()=>String(localStorage.getItem(SESSION_KEY)||"sem-login").toLowerCase();
  const key=()=>`MICROCOSMOS_SKILLS_V1:${user()}`;

  function read(){try{return JSON.parse(localStorage.getItem(key())||"{}")||{}}catch{return {}}}
  function write(value){localStorage.setItem(key(),JSON.stringify(value||{}))}
  function restore(){
    if(typeof state==="undefined")return;
    state.skillRanks={...read()};
    if(typeof save==="function")save();
  }
  function setRank(name){
    if(typeof state==="undefined")return;
    const ranks={...(state.skillRanks||{})};
    ranks[name]=((Number(ranks[name])||0)+1)%3;
    if(ranks[name]===0)delete ranks[name];
    state.skillRanks=ranks;write(ranks);
    if(typeof save==="function")save();
    if(typeof renderAttrs==="function")renderAttrs();
  }
  globalThis.microCycleSkill=setRank;

  if(typeof renderAttrs==="function"){
    const originalRenderAttrs=renderAttrs;
    renderAttrs=function(){
      originalRenderAttrs();
      document.querySelectorAll("#p1Attributes .skill-rank").forEach((button)=>{
        const row=button.closest(".skill");
        const roll=row?.querySelector(".roll-name");
        const text=String(roll?.textContent||"").replace(/\([^)]*\)\s*$/," ").trim();
        if(!text)return;
        button.disabled=false;
        button.title="Toque para alternar: sem proficiência → proficiente → especialização";
        button.setAttribute("aria-label",`Alterar proficiência em ${text}`);
        button.onclick=()=>setRank(text);
      });
    };
  }

  restore();
  if(typeof renderAttrs==="function")renderAttrs();
})();
