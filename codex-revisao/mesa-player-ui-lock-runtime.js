/* MICROCOSMOS — Permissões visuais da Mesa.
   Jogador: Zoom + adicionar o próprio personagem.
   Mestre: controles completos de Grid, mapa, NPC e preparação.
   O botão manual de atualizar tokens é removido porque a atualização passa a ser automática.
*/
(async function(){
  if(globalThis.MICROCOSMOS_MESA_PLAYER_UI_LOCK)return;
  globalThis.MICROCOSMOS_MESA_PLAYER_UI_LOCK=true;

  const $=id=>document.getElementById(id);
  let role="player";

  async function resolveRole(){
    try{
      const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      const sb=createClient("https://evyhhlbvhspiuwouivbb.supabase.co","sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:{session}}=await sb.auth.getSession();
      if(!session)return "player";
      const {data}=await sb.from("profiles").select("role,approved").eq("id",session.user.id).maybeSingle();
      return data?.role==="master"&&data?.approved!==false?"master":"player"
    }catch(_e){return "player"}
  }

  function hide(el){if(el)el.style.setProperty("display","none","important")}
  function show(el,display=""){if(el){el.style.removeProperty("display");if(display)el.style.display=display}}

  function apply(){
    const master=role==="master";
    document.documentElement.dataset.mesaRole=role;
    document.body.classList.toggle("micro-mesa-master",master);
    document.body.classList.toggle("micro-mesa-player",!master);

    // Atualização manual deixa de existir: tokens vinculados passam a reagir a mudanças da ficha.
    hide($("microRefreshLinked"));

    const gridWrap=$("microCompactGrid");
    const mapWrap=$("microCompactMap");
    const more=$("microCompactMore");
    const free=$("microAddFreeToken");
    const ficha=$("microAddCharacterSide");

    if(master){
      show(gridWrap,"flex");show(mapWrap);show(more);show(free);show(ficha)
    }else{
      hide(gridWrap);hide(mapWrap);hide(more);hide(free);show(ficha);

      // Proteção adicional caso algum controle antigo volte para o DOM por re-render.
      hide($("gridType"));hide($("gridMinus"));hide($("gridPlus"));hide($("gridSize"));hide($("clearMap"));
      const upload=document.querySelector(".map-upload");hide(upload);
    }

    // O botão original do topo também não deve reaparecer fora da barra compacta.
    hide($("addToken"));

    const leftTab=document.querySelector('.mobile-tabs [data-drawer="left"]');
    if(leftTab)leftTab.setAttribute("aria-label","Iniciativa");
  }

  role=await resolveRole();
  apply();

  let queued=false;
  const obs=new MutationObserver(()=>{
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;apply()})
  });
  obs.observe(document.body,{childList:true,subtree:true});

  globalThis.MICROCOSMOS_MESA_UI_ACCESS={get role(){return role},refresh:apply};
})();
