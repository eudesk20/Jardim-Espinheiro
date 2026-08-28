/* MICROCOSMOS — compactação visual da ficha no desktop.
   Não altera regras nem dados: apenas remove repetição visual após a criação
   e impede que as colunas da Página 1 estiquem até a altura da coluna maior. */
(function(){
  if(globalThis.MICROCOSMOS_SHEET_DESKTOP_COMPACT)return;
  globalThis.MICROCOSMOS_SHEET_DESKTOP_COMPACT=true;

  const $=id=>document.getElementById(id);

  function ensureStyle(){
    if($("microSheetDesktopCompactStyle"))return;
    const style=document.createElement("style");
    style.id="microSheetDesktopCompactStyle";
    style.textContent=`
      /* A trava da criação não deve apagar visualmente a ficha inteira. */
      body.micro-creation-locked{opacity:1!important}

      /* Depois de confirmada, a origem vira um aviso curto. */
      body.micro-creation-locked #microCreationBanner{margin:7px 0 0;padding:6px 10px;min-height:0}
      body.micro-creation-locked #microCreationBanner small{display:none}

      /* Kit: após confirmação mostra somente o Kit realmente escolhido. */
      body.micro-creation-locked #microStartingKitPanel{padding:8px 10px;margin-top:8px}
      body.micro-creation-locked #microStartingKitPanel .micro-kit-head{margin-bottom:4px}
      body.micro-creation-locked #microStartingKitPanel .micro-kit-head>small{display:none}
      body.micro-creation-locked #microStartingKitContent{grid-template-columns:1fr!important;gap:0}
      body.micro-creation-locked #microStartingKitContent>.micro-kit-intro{display:none!important}
      body.micro-creation-locked #microStartingKitContent>.micro-kit-choice:not(.active){display:none!important}
      body.micro-creation-locked #microStartingKitContent>.micro-kit-choice.active{
        min-height:0!important;padding:7px 9px!important;pointer-events:none;box-shadow:none
      }
      body.micro-creation-locked #microStartingKitContent>.micro-kit-choice.active small{font-size:.72rem}

      /* Formação Inicial já foi decidida no Assistente: não repetir checkboxes na ficha. */
      body.micro-creation-locked #microClassCraftSection>.micro-craft-rule,
      body.micro-creation-locked #microClassCraftSection>.micro-craft-kit{display:none!important}
      body.micro-creation-locked #microClassCraftSection .micro-craft-head p{display:none}
      body.micro-creation-locked #microClassCraftSection{padding-top:9px}

      /* Classes sem conjuração não precisam do aviso de Foco/Bolsa. */
      body.micro-class-no-focus #microMagicFocusStatus{display:none!important}

      /* PC: cada painel assume somente a própria altura; elimina painéis esticados vazios. */
      @media(min-width:1121px){
        #p1Page .main-grid{align-items:start!important}
        #p1Page .main-grid>.panel,
        #p1Page .main-grid>.rightcol{align-self:start!important;min-height:0!important}
        #p1Page .rightcol{display:grid!important;grid-auto-rows:max-content;align-content:start;gap:10px}
        #p1Page .rightcol>.panel{margin:0!important;min-height:0!important;height:auto!important}
        #p1Page .bottom-grid{align-items:start!important}
        #p1Page .bottom-grid>.panel{align-self:start!important;min-height:0!important;height:auto!important}
        #p1Page .panel{height:auto}
        #p1Page .auto-traits{max-height:360px;overflow:auto}
      }
    `;
    document.head.appendChild(style)
  }

  function refreshClassUi(){
    try{
      const key=state?.cls||$("p1ClassSelect")?.value||"";
      const caster=globalThis.CLASS_DATA?.[key]?.caster||globalThis.MICROCOSMO_DATA?.classes?.[key]?.caster;
      document.body.classList.toggle("micro-class-no-focus",!caster);
    }catch(_e){}
  }

  function refresh(){ensureStyle();refreshClassUi()}

  const classSelect=$("p1ClassSelect");
  classSelect?.addEventListener("change",()=>setTimeout(refresh,0));
  classSelect?.addEventListener("input",()=>setTimeout(refresh,0));
  window.addEventListener("pageshow",refresh);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});

  refresh();
  globalThis.MICROCOSMOS_SHEET_DESKTOP_COMPACT_API={refresh};
})();
