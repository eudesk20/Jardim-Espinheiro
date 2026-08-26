/* MICROCOSMOS — Atualização automática dos tokens vinculados.
   Escuta mudanças da tabela characters no Supabase e reutiliza o atualizador
   existente da Mesa. Substitui a necessidade do botão “Atualizar tokens”.
*/
(async function(){
  if(globalThis.MICROCOSMOS_MESA_AUTO_TOKEN_SYNC)return;
  globalThis.MICROCOSMOS_MESA_AUTO_TOKEN_SYNC=true;

  let timer=null,lastRun=0;
  function refresh(){
    clearTimeout(timer);
    timer=setTimeout(()=>{
      if(globalThis.MICROCOSMOS_TOKEN_DRAGGING){refresh();return}
      const btn=document.getElementById("microRefreshLinked");
      if(btn){lastRun=Date.now();btn.click();setTimeout(()=>globalThis.MICROCOSMOS_TABLE_COMBAT_DATA?.refresh?.(),450);return}
      if(typeof globalThis.MICROCOSMOS_REFRESH_LINKED_TOKENS==="function"){
        lastRun=Date.now();Promise.resolve(globalThis.MICROCOSMOS_REFRESH_LINKED_TOKENS()).finally(()=>globalThis.MICROCOSMOS_TABLE_COMBAT_DATA?.refresh?.())
      }
    },220)
  }

  try{
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    const sb=createClient("https://evyhhlbvhspiuwouivbb.supabase.co","sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    const {data:{session}}=await sb.auth.getSession();
    if(!session)return;
    const {data:profile}=await sb.from("profiles").select("role,approved").eq("id",session.user.id).maybeSingle();
    if(!profile||profile.approved===false)return;

    sb.channel(`mesa-character-auto-sync-${session.user.id}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"characters"},()=>refresh())
      .subscribe();

    // Ao voltar para a aba, garante que qualquer alteração feita enquanto ela
    // estava em segundo plano também seja refletida imediatamente.
    document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-lastRun>500)refresh()});
    window.addEventListener("focus",()=>{if(Date.now()-lastRun>500)refresh()});

    globalThis.MICROCOSMOS_MESA_AUTO_TOKEN_SYNC_API={refresh};
  }catch(e){console.warn("MICROCOSMOS: atualização automática de tokens indisponível",e)}
})();
