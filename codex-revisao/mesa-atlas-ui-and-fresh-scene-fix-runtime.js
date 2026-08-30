/* MICROCOSMOS — segurança visual do Atlas. A persistência das Cenas fica no núcleo do Atlas. */
(async function(){
  if(globalThis.MICROCOSMOS_ATLAS_UI_FRESH_SCENE_FIX)return;
  globalThis.MICROCOSMOS_ATLAS_UI_FRESH_SCENE_FIX=true;

  const $=id=>document.getElementById(id);
  function ensureStyle(){
    if($("microAtlasUiFreshSceneStyle"))return;
    const s=document.createElement("style");s.id="microAtlasUiFreshSceneStyle";s.textContent=`
      body:not(.micro-atlas-master-ok) #microAtlasTopToggle,
      body:not(.micro-atlas-master-ok) #microAtlasTopDrawer{display:none!important}
    `;document.head.appendChild(s)
  }
  async function authorizeAtlas(){
    ensureStyle();
    try{
      const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      const sb=createClient("https://evyhhlbvhspiuwouivbb.supabase.co","sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data:{session}}=await sb.auth.getSession();if(!session)return false;
      const {data}=await sb.from("profiles").select("role,approved").eq("id",session.user.id).maybeSingle();
      const master=data?.role==="master"&&data?.approved!==false;
      document.body.classList.toggle("micro-atlas-master-ok",master);
      if(!master){$("microAtlasTopDrawer")?.setAttribute("hidden","");$("microAtlasTopToggle")?.setAttribute("aria-expanded","false")}
      return master
    }catch(_e){document.body.classList.remove("micro-atlas-master-ok");return false}
  }
  ensureStyle();authorizeAtlas();
})();
