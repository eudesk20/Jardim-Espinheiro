/* MICROCOSMOS — Reset seguro da ficha.
   Corrige o caso em que a ficha antiga voltava após Reset porque `state`
   permanecia antigo enquanto o Supabase era atualizado. O botão é
   interceptado antes do onclick legado para garantir um único fluxo.
*/
(function(){
  if(globalThis.MICROCOSMOS_RESET_FIX)return;
  globalThis.MICROCOSMOS_RESET_FIX=true;

  const SHEET_KEY="JE_INTEGRATED_123";
  const HYDRATE_PREFIX="MICROCOSMOS_CLOUD_HYDRATED_V2:";
  let resetting=false;

  function clone(v){
    try{return structuredClone(v)}catch(_e){return JSON.parse(JSON.stringify(v))}
  }
  function freshSheet(){
    try{return typeof DEFAULT!=="undefined"?clone(DEFAULT):{}}
    catch(_e){return {}}
  }
  function oldSheet(){
    try{return typeof state!=="undefined"?clone(state):JSON.parse(localStorage.getItem(SHEET_KEY)||"{}")}
    catch(_e){return {}}
  }
  function writeLocal(payload){
    localStorage.setItem(SHEET_KEY,JSON.stringify(payload));
  }
  function replaceMemory(payload){
    try{
      // `state` é declarado com let no script principal e pode ser substituído
      // por scripts clássicos carregados depois dele.
      if(typeof state!=="undefined")state=clone(payload);
    }catch(e){console.warn("MICROCOSMOS: não foi possível substituir state durante Reset",e)}
  }
  function showError(message){
    alert("Não foi possível concluir o reset da ficha. Os dados anteriores foram preservados.\n\n"+message)
  }

  async function resetSafely(){
    if(resetting)return;
    if(!confirm("Resetar a ficha inteira? Um backup automático será criado antes da limpeza."))return;
    if(!confirm("Confirmação final: retrato, combate, inventário, história, economia, magias e materiais serão apagados da ficha atual."))return;

    resetting=true;
    const previous=oldSheet();
    const fresh=freshSheet();

    try{
      if(typeof createSafetyBackup==="function")createSafetyBackup("Antes do reset da ficha");

      // O ponto crítico: limpa não só o localStorage, mas também o objeto que
      // todas as rotinas save() continuam usando enquanto aguardamos a rede.
      replaceMemory(fresh);
      writeLocal(fresh);

      const supabase=globalThis.MICROCOSMOS_SUPABASE;
      if(supabase){
        const {data:{session},error:sessionError}=await supabase.auth.getSession();
        if(sessionError)throw sessionError;
        if(session?.user?.id){
          const {data,error}=await supabase.from("characters").upsert({
            user_id:session.user.id,
            name:"",
            data:fresh
          },{onConflict:"user_id"}).select("id,updated_at").single();
          if(error)throw error;
          if(data?.updated_at)sessionStorage.setItem(HYDRATE_PREFIX+session.user.id,data.updated_at);
        }
      }

      // Regrava uma última vez após o await. Qualquer rotina que tenha rodado
      // durante a espera já enxerga state zerado, então não consegue reviver
      // a ficha antiga.
      replaceMemory(fresh);
      writeLocal(fresh);
      sessionStorage.setItem("MICROCOSMOS_RESET_OK","1");
      location.reload();
    }catch(e){
      // Se o servidor falhar, voltar para a ficha anterior evita o próximo
      // reload hidratar dados antigos por cima de uma limpeza incompleta.
      replaceMemory(previous);
      writeLocal(previous);
      resetting=false;
      showError(e?.message||String(e));
    }
  }

  // Capture phase: impede que o onclick="resetCharacter()" legado rode junto.
  document.addEventListener("click",function(e){
    const btn=e.target?.closest?.('button[onclick*="resetCharacter"]');
    if(!btn)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    resetSafely();
  },true);

  // Também expõe a versão corrigida para chamadas futuras feitas por código.
  globalThis.MICROCOSMOS_RESET_CHARACTER=resetSafely;

  // Reinstala globalmente depois que o runtime online assíncrono terminar de
  // inicializar. O listener em capture acima continua sendo a proteção principal.
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    try{globalThis.resetCharacter=resetSafely}catch(_e){}
    if(attempts>=20)clearInterval(timer)
  },250);
})();
