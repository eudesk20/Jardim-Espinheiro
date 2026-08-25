/* MICROCOSMOS — Histórico compartilhado de Rolagens da Mesa.
   - Jogadores publicam suas rolagens no Supabase e todos os participantes aprovados veem em tempo real.
   - Mestre recebe botão de Rolagem Oculta; quando ON, suas novas rolagens ficam visíveis somente ao Mestre.
   - A segurança é RLS no banco, não apenas CSS/JS.
*/
(async function(){
  if(globalThis.MICROCOSMOS_MESA_ROLL_HISTORY)return;
  globalThis.MICROCOSMOS_MESA_ROLL_HISTORY=true;

  const PROJECT_URL="https://evyhhlbvhspiuwouivbb.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable_mf7PV03HfaJw_YkUhX34NA_dAGFbyp6";
  const SESSION_KEY="microcosmos-main";
  const rollLog=document.getElementById("rollLog");
  if(!rollLog)return;

  let supabase=null,session=null,profile=null,hiddenMode=false,loadingRemote=false;
  const seenIds=new Set(),localNonces=new Set();
  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS||[];

  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
  function selectedToken(){const el=document.querySelector("#tokenLayer .token.selected");return players.find(p=>p.id===el?.dataset?.token)||null}
  function actorName(){return profile?.display_name||profile?.username||session?.user?.email?.split("@")[0]||"Jogador"}
  function nonce(){return `${Date.now()}-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`}
  function timeText(ts){try{return new Date(ts).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}catch{return""}}

  function ensureStyle(){
    if(document.getElementById("microMesaRollStyle"))return;
    const s=document.createElement("style");s.id="microMesaRollStyle";s.textContent=`
      .micro-roll-toolbar{display:flex;gap:6px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:-2px 0 8px}.micro-roll-toolbar small{color:#6d5b44}.micro-hidden-roll{border-left-color:#6b4d87!important;background:#f0e6f6!important}.micro-roll-author{font-weight:bold}.micro-roll-time{opacity:.7;font-size:.68rem;margin-left:5px}.micro-roll-hidden-badge{display:inline-block;margin-left:6px;background:#5d3b70;color:white;border-radius:999px;padding:1px 6px;font-size:.62rem}.micro-roll-sync-note{font-size:.68rem;color:#725f47;margin-bottom:6px}`;document.head.appendChild(s)
  }

  function ensureToolbar(){
    ensureStyle();
    const panel=rollLog.closest(".panel")||rollLog.parentElement;
    if(!panel||document.getElementById("microRollToolbar"))return;
    const bar=document.createElement("div");bar.id="microRollToolbar";bar.className="micro-roll-toolbar";
    bar.innerHTML=`<small>As rolagens públicas da Mesa são compartilhadas com todos.</small>${profile?.role==="master"?'<button class="btn dark" id="microHiddenRollToggle">🎭 Rolagem Oculta: OFF</button>':""}`;
    panel.insertBefore(bar,rollLog);
    const btn=document.getElementById("microHiddenRollToggle");if(btn)btn.onclick=()=>{hiddenMode=!hiddenMode;btn.textContent=`🎭 Rolagem Oculta: ${hiddenMode?"ON":"OFF"}`;btn.classList.toggle("danger",hiddenMode);btn.classList.toggle("dark",!hiddenMode)}
  }

  function rowHtml(r){
    const hidden=r.hidden&&profile?.role==="master";
    return `<div class="log-entry ${hidden?"micro-hidden-roll":""}" data-roll-id="${esc(r.id)}"><span class="micro-roll-author">${esc(r.actor_name||"Jogador")}</span>${r.token_name?` • ${esc(r.token_name)}`:""}<span class="micro-roll-time">${esc(timeText(r.created_at))}</span>${hidden?'<span class="micro-roll-hidden-badge">SÓ MESTRE</span>':""}<br>${esc(r.message)}</div>`
  }

  function prependRow(r){
    if(!r?.id||seenIds.has(r.id))return;seenIds.add(r.id);
    if(r.client_nonce&&localNonces.has(r.client_nonce)){rollLog.querySelector(`[data-micro-roll-nonce="${CSS.escape(String(r.client_nonce))}"]`)?.remove();localNonces.delete(r.client_nonce)}
    const wrap=document.createElement("div");wrap.innerHTML=rowHtml(r);const node=wrap.firstElementChild;if(!node)return;
    node.dataset.remoteRoll="1";rollLog.prepend(node)
  }

  async function loadRecent(){
    const {data,error}=await supabase.from("mesa_rolls").select("id,actor_user_id,actor_name,actor_role,token_name,message,hidden,client_nonce,created_at").eq("session_key",SESSION_KEY).order("created_at",{ascending:false}).limit(100);
    if(error){console.warn("MICROCOSMOS: falha ao carregar rolagens",error);return}
    loadingRemote=true;
    try{
      rollLog.querySelectorAll('[data-remote-roll="1"]').forEach(n=>n.remove());
      for(const r of [...(data||[])].reverse())prependRow(r)
    }finally{loadingRemote=false}
  }

  async function publishMessage(message,entry){
    if(!session||!profile||!message?.trim())return;
    const n=nonce();localNonces.add(n);if(entry)entry.dataset.microRollNonce=n;const token=selectedToken();
    const payload={session_key:SESSION_KEY,actor_user_id:session.user.id,actor_name:actorName(),actor_role:profile.role==="master"?"master":"player",token_name:token?.name||null,message:message.trim().slice(0,2000),hidden:profile.role==="master"&&hiddenMode,client_nonce:n};
    const {error}=await supabase.from("mesa_rolls").insert(payload);if(error)console.warn("MICROCOSMOS: falha ao publicar rolagem",error)
  }

  // Captura o histórico local já produzido pelas rotinas existentes da Mesa,
  // inclusive ataques, danos, curas, Salvaguardas e magias.
  const observer=new MutationObserver(mutations=>{
    if(loadingRemote)return;
    for(const m of mutations)for(const node of m.addedNodes){
      if(!(node instanceof HTMLElement))continue;
      const entries=node.matches?.(".log-entry")?[node]:[...node.querySelectorAll?.(".log-entry")||[]];
      for(const entry of entries){
        if(entry.dataset.remoteRoll==="1"||entry.dataset.microPublished==="1")continue;
        const text=(entry.textContent||"").trim();if(!text||/mesa está pronta para o teste/i.test(text))continue;
        entry.dataset.microPublished="1";
        if(profile?.role==="master"&&hiddenMode){entry.classList.add("micro-hidden-roll");const badge=document.createElement("span");badge.className="micro-roll-hidden-badge";badge.textContent="SÓ MESTRE";entry.prepend(badge)}
        publishMessage(text,entry)
      }
    }
  });
  observer.observe(rollLog,{childList:true,subtree:true});

  try{
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    supabase=createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    const {data:{session:s}}=await supabase.auth.getSession();session=s;if(!session)return;
    const {data:p}=await supabase.from("profiles").select("id,username,display_name,role,approved").eq("id",session.user.id).maybeSingle();profile=p;if(!profile||profile.approved===false)return;
    ensureToolbar();await loadRecent();
    supabase.channel(`mesa-rolls-${SESSION_KEY}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"mesa_rolls",filter:`session_key=eq.${SESSION_KEY}`},payload=>prependRow(payload.new)).subscribe();
    globalThis.MICROCOSMOS_MESA_ROLLS={reload:loadRecent,isHidden:()=>hiddenMode,setHidden:v=>{if(profile.role==="master"){hiddenMode=!!v;const b=document.getElementById("microHiddenRollToggle");if(b)b.click()}}};
  }catch(e){console.warn("MICROCOSMOS: histórico online da Mesa indisponível",e)}
})();
