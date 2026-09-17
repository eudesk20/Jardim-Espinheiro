/* MICROCOSMOS — cliente Supabase único para todos os módulos da Mesa. */
(()=>{
  if(globalThis.MICROCOSMOS_GET_SUPABASE)return;
  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  globalThis.MICROCOSMOS_GET_SUPABASE=()=>{
    if(globalThis.MICROCOSMOS_SUPABASE)return Promise.resolve(globalThis.MICROCOSMOS_SUPABASE);
    if(!globalThis.MICROCOSMOS_SUPABASE_READY){
      globalThis.MICROCOSMOS_SUPABASE_READY=import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(({createClient})=>{
        const client=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
        globalThis.MICROCOSMOS_SUPABASE=client;
        return client;
      });
    }
    return globalThis.MICROCOSMOS_SUPABASE_READY;
  };
})();
