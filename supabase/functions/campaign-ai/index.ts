const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});

function publishableKey(){
  const legacy=Deno.env.get("SUPABASE_ANON_KEY");
  if(legacy)return legacy;
  try{return JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default||""}catch{return""}
}

async function safetyId(authorization:string){
  try{
    const payload=JSON.parse(atob(authorization.replace(/^Bearer\s+/i,"").split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
    const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(payload.sub||"anonymous")));
    return Array.from(new Uint8Array(bytes)).slice(0,16).map(x=>x.toString(16).padStart(2,"0")).join("");
  }catch{return"anonymous"}
}

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Método não permitido."},405);
  const authorization=req.headers.get("Authorization")||"";
  if(!authorization.startsWith("Bearer "))return json({error:"Entre na conta para usar a IA."},401);

  try{
    const body=await req.json(),roomId=String(body.room_id||""),input=String(body.input||"").trim();
    if(!/^[0-9a-f-]{36}$/i.test(roomId))return json({error:"Sala inválida."},400);
    if(!input||input.length>4000)return json({error:"A mensagem deve ter entre 1 e 4000 caracteres."},400);

    const supabaseUrl=Deno.env.get("SUPABASE_URL")||"",apikey=publishableKey();
    const contextResponse=await fetch(`${supabaseUrl}/rest/v1/rpc/get_room_ai_runtime_context`,{method:"POST",headers:{apikey,Authorization:authorization,"Content-Type":"application/json"},body:JSON.stringify({p_room_id:roomId})});
    const contextBody=await contextResponse.json();
    if(!contextResponse.ok)return json({error:contextBody?.message||"Sem permissão para usar a IA nesta campanha."},contextResponse.status);
    const context=Array.isArray(contextBody)?contextBody[0]:contextBody;
    if(!context)return json({error:"Configuração da IA não encontrada."},404);
    const rpc=async(name:string,args:Record<string,unknown>)=>{
      const response=await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey,Authorization:authorization,"Content-Type":"application/json"},body:JSON.stringify(args)});
      const result=await response.json();if(!response.ok)throw new Error(result?.message||`Falha em ${name}.`);return result;
    };
    const[history,memoryRows]=await Promise.all([rpc("get_room_ai_history",{p_room_id:roomId,p_limit:20}),rpc("get_room_ai_memory",{p_room_id:roomId})]);
    const memory=Array.isArray(memoryRows)?memoryRows[0]:memoryRows;

    const apiKey=Deno.env.get("OPENAI_API_KEY"),model=Deno.env.get("OPENAI_MODEL");
    if(!apiKey||!model)return json({error:"O núcleo da IA está instalado, mas o Administrador ainda precisa configurar OPENAI_API_KEY e OPENAI_MODEL nos segredos da função."},503);
    const mode=context.master_mode==="assisted"?"assistente privado do Mestre":"Mestre IA da campanha",aiName=context.permissions?.ai_name||"Mestre IA",voiceProfile=context.permissions?.voice_profile||"neutral";
    const instructions=`Seu nome nesta campanha é "${aiName}" e você é o ${mode} de uma mesa de RPG chamada "${context.room_name}". Responda sempre em português do Brasil. Seja claro e conciso. Seu perfil de interpretação é "${voiceProfile}"; adapte o tom ao clima da cena somente quando dynamic_delivery estiver habilitado. Use as regras 5E compatíveis com o SRD como uma base sólida para resolver ações, nunca como uma prisão. Pode propor uma exceção quando ela tornar a sessão mais divertida, dramática ou adequadamente desafiadora, mas deve avisar claramente o grupo e manter a decisão consistente dali em diante. Nunca mude uma regra escondido, escolha ações pelos jogadores, altere fichas, PV, tokens, cenário ou participantes por conta própria; apenas descreva ou sugira ações autorizadas. Não invente resultados de dados que não foram informados. Permissões atuais: ${JSON.stringify(context.permissions)}. Informações e estilo definidos pelo criador: ${context.persona||"narrador neutro, justo e colaborativo"}. Resumo persistente da campanha: ${memory?.summary||"ainda não há resumo"}. Fatos persistentes: ${JSON.stringify(memory?.facts||[])}.`;
    const conversation=[...(Array.isArray(history)?history:[]).map((item:any)=>({role:item.speaker==="assistant"?"assistant":"user",content:String(item.content||"")})),{role:"user",content:input}];
    const aiResponse=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model,instructions,input:conversation,max_output_tokens:700,store:false,safety_identifier:await safetyId(authorization)})});
    const ai=await aiResponse.json();
    if(!aiResponse.ok)return json({error:ai?.error?.message||"A IA não conseguiu responder."},502);
    const output=ai.output_text||ai.output?.flatMap((item:any)=>item.content||[]).filter((item:any)=>item.type==="output_text").map((item:any)=>item.text).join("\n")||"";
    if(output)await Promise.all([rpc("append_room_ai_message",{p_room_id:roomId,p_speaker:"user",p_content:input}),rpc("append_room_ai_message",{p_room_id:roomId,p_speaker:"assistant",p_content:output})]);
    return json({output,mode:context.master_mode,response_id:ai.id});
  }catch(error){return json({error:error instanceof Error?error.message:"Falha inesperada na IA."},500)}
});
