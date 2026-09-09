const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
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

    const apiKey=Deno.env.get("OPENAI_API_KEY"),model=Deno.env.get("OPENAI_MODEL");
    if(!apiKey||!model)return json({error:"O núcleo da IA está instalado, mas o Administrador ainda precisa configurar OPENAI_API_KEY e OPENAI_MODEL nos segredos da função."},503);
    const mode=context.master_mode==="assisted"?"assistente privado do Mestre":"Mestre IA da campanha";
    const instructions=`Você é o ${mode} de uma mesa de RPG chamada "${context.room_name}". Responda sempre em português do Brasil. Seja claro e conciso. Nunca altere fichas, PV, tokens, cenário ou participantes por conta própria; apenas descreva ou sugira ações autorizadas. Não invente resultados de dados que não foram informados. Permissões atuais: ${JSON.stringify(context.permissions)}. Personalidade definida pelo criador: ${context.persona||"narrador neutro, justo e colaborativo"}.`;
    const aiResponse=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model,instructions,input,max_output_tokens:700,store:false,safety_identifier:await safetyId(authorization)})});
    const ai=await aiResponse.json();
    if(!aiResponse.ok)return json({error:ai?.error?.message||"A IA não conseguiu responder."},502);
    const output=ai.output_text||ai.output?.flatMap((item:any)=>item.content||[]).filter((item:any)=>item.type==="output_text").map((item:any)=>item.text).join("\n")||"";
    return json({output,mode:context.master_mode,response_id:ai.id});
  }catch(error){return json({error:error instanceof Error?error.message:"Falha inesperada na IA."},500)}
});
