/* MICROCOSMOS — Trava de Ações pelo Turno Tático.
   Durante um combate iniciado, apenas o token cujo turno está ativo pode
   executar ações pelo menu contextual. Os demais tokens continuam podendo ser
   consultados, mas os botões de execução ficam bloqueados até chegar a vez.

   v1.1: atualização sem MutationObserver global. A versão anterior observava
   atributos que ela mesma alterava (class/disabled), podendo criar um ciclo de
   mutações quando o alvo de um ataque era selecionado e congelar a página.
*/
(function(){
  if(globalThis.MICROCOSMOS_TURN_ACTION_LOCK)return;
  globalThis.MICROCOSMOS_TURN_ACTION_LOCK=true;

  const $=id=>document.getElementById(id);
  const players=()=>Array.isArray(globalThis.MICROCOSMOS_TABLE_PLAYERS)?globalThis.MICROCOSMOS_TABLE_PLAYERS:[];
  let wrappedExecutor=null,lastLocked=null,lastTokenId="",lastMenuVisible=null;

  function combat(){return globalThis.MICROCOSMOS_INITIATIVE?.combat||{started:false,active_token_id:null,round:0}}
  function activeToken(){const c=combat();return players().find(p=>String(p.id)===String(c.active_token_id))||null}
  function selectedToken(){
    const el=document.querySelector("#tokenLayer .token.selected,#tokenLayer [data-token][aria-selected='true']");
    return el?players().find(p=>String(p.id)===String(el.dataset.token)):null
  }
  function isTurnOf(p){const c=combat();return !c.started||!c.active_token_id||!!p&&String(p.id)===String(c.active_token_id)}
  function message(){const p=activeToken();return `⏳ Aguarde. Agora é o turno de ${p?.name||"outro token"}.`}
  function notify(){
    const text=message();
    if(globalThis.MICROCOSMOS_TOKEN_ACTIONS?.showToast){globalThis.MICROCOSMOS_TOKEN_ACTIONS.showToast(text);return}
    const st=$("mapStatus");if(!st)return;const old=st.textContent;st.textContent=text;clearTimeout(notify._t);notify._t=setTimeout(()=>{if(st.textContent===text)st.textContent=old},1600)
  }

  function ensureCss(){
    if($("microTurnActionLockStyle"))return;
    const s=document.createElement("style");s.id="microTurnActionLockStyle";s.textContent=`
      #microTokenActionMenu.micro-turn-actions-locked .micro-action-row button[data-action-row]{opacity:.38!important;filter:grayscale(.35);cursor:not-allowed!important;pointer-events:none!important}
      #microTurnActionLockNotice{margin:7px 0 1px;padding:7px 9px;border:1px solid #b18a48;border-radius:9px;background:#fff0bd;color:#654a1f;font-size:.72rem;font-weight:bold;text-align:center}
    `;document.head.appendChild(s)
  }

  function updateMenu(force=false){
    ensureCss();const menu=$("microTokenActionMenu");if(!menu)return;
    const visible=!menu.hidden,p=selectedToken(),c=combat(),locked=!!(visible&&c.started&&p&&!isTurnOf(p)),tokenId=String(p?.id||"");
    if(!force&&locked===lastLocked&&tokenId===lastTokenId&&visible===lastMenuVisible)return;

    if(menu.classList.contains("micro-turn-actions-locked")!==locked)menu.classList.toggle("micro-turn-actions-locked",locked);
    let notice=$("microTurnActionLockNotice");
    if(locked){
      if(!notice){notice=document.createElement("div");notice.id="microTurnActionLockNotice";const head=menu.querySelector(".micro-token-menu-head");head?.insertAdjacentElement("afterend",notice)}
      const text=message();if(notice&&notice.textContent!==text)notice.textContent=text
    }else notice?.remove();

    const title=message();
    for(const b of menu.querySelectorAll(".micro-action-row button[data-action-row]")){
      if(b.disabled!==locked)b.disabled=locked;
      const aria=String(locked);if(b.getAttribute("aria-disabled")!==aria)b.setAttribute("aria-disabled",aria);
      if(locked){if(b.title!==title)b.title=title}else if(b.title&&/^⏳ Aguarde\./.test(b.title))b.removeAttribute("title")
    }
    lastLocked=locked;lastTokenId=tokenId;lastMenuVisible=visible
  }

  // Captura antes dos onclick do menu. Assim Item, Perícia e Salvaguarda também
  // respeitam o turno, não apenas ataques e magias do executor de combate.
  window.addEventListener("click",e=>{
    const button=e.target?.closest?.("#microTokenActionMenu [data-action-row]");if(!button)return;
    const p=selectedToken();if(isTurnOf(p))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();notify();updateMenu(true)
  },true);

  // Proteção adicional para ataques/magias iniciados por qualquer outro caminho.
  function wrapExecutor(){
    const ex=globalThis.MICROCOSMOS_COMBAT_EXECUTOR;if(!ex||ex===wrappedExecutor||typeof ex.start!=="function")return;
    const original=ex.start.bind(ex);
    ex.start=function(caster,type,index){if(!isTurnOf(caster)){notify();return false}return original(caster,type,index)};
    wrappedExecutor=ex
  }

  // Se o turno mudar enquanto o jogador ainda estava escolhendo um alvo,
  // cancela o modo de alvo antes de a ação antiga poder ser concluída.
  window.addEventListener("pointerup",e=>{
    if(!document.body.classList.contains("micro-auto-target"))return;
    const c=combat(),caster=players().find(p=>String(p.id)===String(c.active_token_id));
    if(caster&&isTurnOf(caster))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    try{globalThis.MICROCOSMOS_COMBAT_EXECUTOR?.cancel?.()}catch(_e){}
    notify();updateMenu(true)
  },true);

  // Poll leve e idempotente. Evita observar DOM inteiro e, principalmente,
  // evita reagir às próprias alterações de class/disabled.
  setInterval(()=>{wrapExecutor();updateMenu(false)},200);
  wrapExecutor();updateMenu(true);
  globalThis.MICROCOSMOS_ACTION_TURN_LOCK={isTurnOf,refresh:()=>updateMenu(true)};
})();
