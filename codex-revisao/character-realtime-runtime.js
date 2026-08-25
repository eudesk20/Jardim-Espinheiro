/* MICROCOSMOS — Atualização da ficha em tempo real.
   Recebe mudanças do próprio registro em characters (ex.: dano/cura aprovado pelo Mestre)
   e atualiza a ficha aberta sem exigir recarregar a página.
*/
(async function(){
  if(globalThis.MICROCOSMOS_CHARACTER_REALTIME)return;
  globalThis.MICROCOSMOS_CHARACTER_REALTIME=true;
  const SHEET_KEY="JE_INTEGRATED_123";
  const clone=v=>{try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v))}};
  const stable=v=>Array.isArray(v)?v.map(stable):(v&&typeof v==="object"?Object.keys(v).sort().reduce((o,k)=>(o[k]=stable(v[k]),o),{}):v);
  const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
  const parse=()=>{try{return JSON.parse(localStorage.getItem(SHEET_KEY)||"{}")||{}}catch{return{}}};

  // Online v2 inicializa de forma assíncrona; aguardamos o cliente existente para
  // usar exatamente a mesma sessão autenticada.
  let tries=0,supabase=null;
  while(!(supabase=globalThis.MICROCOSMOS_SUPABASE)&&tries++<80)await new Promise(r=>setTimeout(r,100));
  if(!supabase)return;
  const {data:{session}}=await supabase.auth.getSession();if(!session)return;

  function applyCloud(data){
    const cloud=clone(data||{}),local=parse();if(same(cloud,local))return;
    try{localStorage.setItem(SHEET_KEY,JSON.stringify(cloud))}catch(_e){}
    try{if(typeof state!=="undefined")state=clone(cloud)}catch(_e){}
    // Atualiza a UI em memória quando possível; fallback leve para telas que não
    // expõem renderAll.
    try{
      if(typeof renderAll==="function")renderAll();
      else{
        if(typeof renderCombat==="function")renderCombat();
        if(typeof renderEquipment==="function")renderEquipment();
        if(typeof renderInventory==="function")renderInventory();
        if(typeof renderMagic==="function")renderMagic();
      }
    }catch(e){console.warn("MICROCOSMOS: ficha recebeu atualização online, mas a UI precisou de atualização parcial",e)}
    document.dispatchEvent(new CustomEvent("microcosmos:character-realtime",{detail:{data:cloud}}));
  }

  const channel=supabase.channel(`character-live-${session.user.id}`)
    .on("postgres_changes",{event:"UPDATE",schema:"public",table:"characters",filter:`user_id=eq.${session.user.id}`},payload=>applyCloud(payload.new?.data))
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"characters",filter:`user_id=eq.${session.user.id}`},payload=>applyCloud(payload.new?.data))
    .subscribe();

  globalThis.MICROCOSMOS_CHARACTER_REALTIME_API={apply:applyCloud,channel};
})();
