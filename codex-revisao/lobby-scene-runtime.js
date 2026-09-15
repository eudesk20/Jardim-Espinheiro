const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const spots={
  fundo:[[43,43],[57,43],[50,39]],
  esquerda:[[24,56],[17,66],[31,69],[12,50]],
  direita:[[76,56],[83,66],[69,69],[88,50]],
  frente:[[50,79],[39,77],[61,77]]
};

export function lobbySeatLayout(){
  return Object.entries(spots).flatMap(([zone,positions])=>positions.map(([x,y],ordinal)=>({zone,ordinal,x,y})));
}

function portraitMarkup(raceKey,label){
  const index=Number(String(raceKey||"").match(/^race-(\d+)$/)?.[1]);
  if(!Number.isInteger(index)||index<0||index>11)return'<span class="glade-portrait glade-portrait-empty" aria-hidden="true">🎭</span>';
  const x=["0%","33.333%","66.667%","100%"][index%4],y=["0%","50%","100%"][Math.floor(index/4)];
  return `<span class="glade-portrait" data-race="${escapeHtml(raceKey)}" style="--sprite-x:${x};--sprite-y:${y}" role="img" aria-label="${escapeHtml(label)}"></span>`;
}

function sceneMarkup(room,large=false){
  const capacity=Math.max(1,Math.min(10,Math.trunc(Number(room.max_participants)||6)));
  const occupied=Math.max(0,Math.min(capacity,Number(room.participant_count)||0));
  const seats=large?lobbySeatLayout().map((spot,index)=>`<button type="button" class="glade-seat" data-seat="${index}" data-zone="${spot.zone}" style="--seat-x:${spot.x}%;--seat-y:${spot.y}%;--seat-delay:${index*.22}s" aria-label="Escolher ${spot.zone} ${spot.ordinal+1}"><span class="glade-avatar"><i class="glade-back"></i><i class="glade-head"></i><i class="glade-body"></i><i class="glade-detail"></i></span><i class="glade-prop" aria-hidden="true"></i><i class="glade-racial-effect" aria-hidden="true"></i><span class="glade-stool"></span></button>`).join(""):"";
  return `<div class="glade ${large?"glade-large":""}" role="${large?"group":"img"}" aria-label="Clareira de Encontro; ${occupied} de ${capacity} jogadores na campanha"><span class="glade-light"></span>${seats}<span class="glade-butterfly" aria-hidden="true">✦</span><span class="glade-caption">Clareira de Encontro</span></div>`;
}

export function decorateRooms(){
  document.querySelectorAll("#myRooms .room,#publicRooms .room").forEach(card=>{
    if(card.querySelector(".glade"))return;
    const id=card.querySelector("[data-open]")?.dataset.open||card.querySelector("[data-join]")?.dataset.join;
    const room=window.__microLobbyRooms?.find(item=>item.room_id===id||item.room_code===id);
    if(room&&room.room_status!=="archived")card.insertAdjacentHTML("afterbegin",sceneMarkup(room));
  });
}

export function lobbyIdleForSpot(spot,roleKey){
  if(spot.zone==="fundo")return{kind:"reading",text:roleKey==="mago"?"estuda anotações de magia":roleKey==="bardo"?"cantarola versos de um livro":"folheia um pequeno livro"};
  if(spot.zone==="esquerda")return{kind:"tinkering",text:roleKey==="cozinheiro"?"prepara uma receita":roleKey==="engenheiro"?"ajusta uma pequena engenhoca":"mexe em pequenos objetos"};
  if(spot.zone==="direita")return{kind:"looking",text:roleKey==="patrulheiro"?"observa as trilhas próximas":"observa a clareira e seus visitantes"};
  return{kind:"warming",text:"descansa perto do calor da fogueira"};
}

function nearbySeats(a,b){
  const spots=lobbySeatLayout(),first=spots[a],second=spots[b];
  return !!first&&!!second&&Math.hypot(first.x-second.x,first.y-second.y)<=31;
}

function installConversations(panel,room,userId,client,getPeople,getOwnSeat){
  const area=document.createElement("div");area.className="glade-conversation";area.hidden=true;
  panel.querySelector("#gladeCharacter").after(area);
  let target=null,events=[],timer,demoMessages=[],dismissedRequestId=0,conversationActive=false;
  const setTalking=active=>{
    panel.querySelectorAll(".glade-seat.activity-talking").forEach(seat=>seat.classList.remove("activity-talking"));
    if(!active||!target)return;
    const seats=[...panel.querySelectorAll(".glade-seat")];
    seats[getOwnSeat()]?.classList.add("activity-talking");
    const other=target.user_id==="demo"?seats.find(seat=>seat.classList.contains("is-demo")):seats.find(seat=>seat.dataset.seat===String(getPeople().find(person=>person.user_id===target.user_id)?.seat_index));
    other?.classList.add("activity-talking");
  };
  const pair=()=>events.filter(item=>(item.sender_id===userId&&item.recipient_id===target?.user_id)||(item.sender_id===target?.user_id&&item.recipient_id===userId));
  const render=()=>{
    if(!target||!panel.isConnected)return;
    if(target.user_id==="demo"){
      conversationActive=true;
      area.innerHTML=`<div class="glade-conversation-top"><b>💬 Visitante de teste <small>prévia local</small></b><button type="button" class="btn" data-talk-close>✕</button></div><p>O visitante deixa sua atividade e olha para você.</p><div class="glade-dialogue">${demoMessages.map(item=>`<p><b>${item.mine?"Você":"Visitante"}:</b> ${escapeHtml(item.text)}</p>`).join("")}</div><form data-talk-form><input name="message" maxlength="500" required placeholder="Diga algo ao visitante…"><button class="btn primary">Enviar</button></form>`;
      area.querySelector("[data-talk-form]").onsubmit=event=>{event.preventDefault();const text=event.currentTarget.elements.message.value.trim();if(!text)return;demoMessages.push({mine:true,text},{mine:false,text:"Que bom encontrar você nesta clareira!"});render()};
    }else{
      const history=pair(),lastRequest=[...history].reverse().find(item=>item.kind==="request"),after=lastRequest?history.filter(item=>item.id>lastRequest.id):[];
      const accepted=after.some(item=>item.kind==="accept"),declined=after.some(item=>item.kind==="decline");
      conversationActive=accepted;
      const pending=!!lastRequest&&!accepted&&!declined;
      const messages=(accepted?after:[]).filter(item=>item.kind==="message");
      area.innerHTML=`<div class="glade-conversation-top"><b>💬 ${escapeHtml(target.display_name)}</b><button type="button" class="btn" data-talk-close>✕</button></div><div class="glade-dialogue">${messages.map(item=>`<p><b>${item.sender_id===userId?"Você":escapeHtml(target.display_name)}:</b> ${escapeHtml(item.body)}</p>`).join("")}</div>${accepted?'<form data-talk-form><input name="message" maxlength="500" required placeholder="Escreva uma mensagem…"><button class="btn primary">Enviar</button></form>':pending?(lastRequest.sender_id===userId?'<p>Convite enviado. Aguardando resposta…</p>':'<p>Convidou você para conversar.</p><button type="button" class="btn primary" data-talk-action="accept">Aceitar</button> <button type="button" class="btn" data-talk-action="decline">Recusar</button>'):'<button type="button" class="btn primary" data-talk-action="request">Convidar para conversar</button>'}`;
      area.querySelectorAll("[data-talk-action]").forEach(button=>button.onclick=()=>send(button.dataset.talkAction));
      const form=area.querySelector("[data-talk-form]");
      if(form)form.onsubmit=event=>{event.preventDefault();const text=form.elements.message.value.trim();if(text)send("message",text)};
    }
    setTalking(conversationActive);
    area.querySelector("[data-talk-close]").onclick=()=>{dismissedRequestId=Math.max(dismissedRequestId,...events.filter(item=>item.kind==="request"&&item.recipient_id===userId).map(item=>item.id));area.hidden=true;conversationActive=false;setTalking(false);target=null};
  };
  const refresh=async()=>{
    const {data}=await client.from("campaign_lobby_conversations").select("id,sender_id,recipient_id,kind,body,created_at").eq("room_id",room.room_id).order("id",{ascending:true}).limit(200);
    if(!panel.isConnected||!data)return;
    const changed=JSON.stringify(data)!==JSON.stringify(events);events=data;
    if(changed&&target?.user_id!=="demo")render();
    const incoming=[...events].reverse().find(item=>item.kind==="request"&&item.recipient_id===userId&&item.id>dismissedRequestId&&!events.some(later=>later.id>item.id&&later.sender_id===userId&&later.recipient_id===item.sender_id&&["accept","decline"].includes(later.kind)));
    if(incoming&&!target){const person=getPeople().find(item=>item.user_id===incoming.sender_id);if(person&&nearbySeats(getOwnSeat(),person.seat_index))open(person)}
  };
  const send=async(kind,body=null)=>{
    if(!target||target.user_id==="demo")return;
    const {error}=await client.from("campaign_lobby_conversations").insert({room_id:room.room_id,sender_id:userId,recipient_id:target.user_id,kind,body});
    if(error){const feedback=panel.querySelector("#gladeFeedback");if(feedback)feedback.textContent=`Não foi possível enviar: ${error.message}`;return}
    await refresh();
  };
  const open=person=>{
    if(person.user_id!=="demo"&&!nearbySeats(getOwnSeat(),person.seat_index)){
      const feedback=panel.querySelector("#gladeFeedback");if(feedback)feedback.textContent=`Aproxime seu avatar de ${person.display_name} para conversar.`;return;
    }
    target=person;area.hidden=false;render();
  };
  panel.addEventListener("glade-render",()=>setTalking(conversationActive&&!area.hidden));
  panel.addEventListener("glade-demo-interact",()=>open({user_id:"demo",display_name:"Visitante de teste"}));
  refresh();timer=setInterval(refresh,3500);
  panel.addEventListener("glade-close",()=>clearInterval(timer),{once:true});
  return open;
}

function installSeatPreview(panel,room,userId,character,client){
  const scene=panel.querySelector(".glade-large"),box=panel.querySelector("#gladeCharacter");
  scene.classList.add("can-place");
  const key=`MICROCOSMOS_LOBBY_SEAT_V1:${room.room_id}:${userId}`;
  const seats=[...scene.querySelectorAll("[data-seat]")],places=lobbySeatLayout();
  let selected=Number(localStorage.getItem(key)),actionTimer,refreshTimer,people=[],lastSnapshot="";
  if(!Number.isInteger(selected)||selected<0||selected>=seats.length)selected=0;
  const raceKey=character.data?.race,roleKey=character.data?.cls;
  const raceData=globalThis.MICROCOSMO_DATA?.races?.[raceKey];
  const race=raceData?.name||"Povo ainda não identificado";
  const subrace=character.data?.subrace;
  const subraceLabel=subrace&&raceData?.subs?.includes(subrace)?` · ${escapeHtml(subrace)}`:"";
  const className=roleKey?` · ${escapeHtml(globalThis.MICROCOSMO_DATA?.classes?.[roleKey]?.name||roleKey)}`:"";
  const displayName=character.name||"Seu personagem";
  const raceDetail={"race-0":"As folhas balançam de leve.","race-1":"A carapaça reflete a luz da fogueira.","race-2":"Dá um saltinho antes de se acomodar.","race-3":"As antenas se movem curiosas.","race-4":"As asas vibram por um instante.","race-6":"Alguns esporos dançam no ar.","race-7":"O casco brilha com o calor do fogo."};
  box.innerHTML=`<div class="glade-identity">${portraitMarkup(raceKey,`${displayName}, ${race}`)}<div><b>🎭 ${escapeHtml(displayName)}</b><p>${escapeHtml(race)}${subraceLabel}${className}. Clique no lugar desejado da Clareira. O avatar assume automaticamente uma atividade daquela posição.</p></div></div><div class="glade-position"><span id="gladePlacement"></span></div><p class="glade-feedback" id="gladeFeedback" aria-live="polite"></p><div class="glade-avatar-menu" id="gladeAvatarMenu" hidden><b>Ações de ${escapeHtml(displayName)}</b><p>Clique no avatar para abrir ou fechar. Outros jogadores autorizados aparecem aqui quando escolhem um lugar.</p><button type="button" class="btn" data-glade-wave>👋 Acenar</button>${raceKey==="race-5"?'<button type="button" class="btn" data-glade-blades>✨ Estender foices</button>':""}<button type="button" class="btn" data-glade-resume>↩ Voltar à atividade</button><button type="button" class="btn" data-glade-talk hidden>💬 Conversar</button></div>`;
  const menu=panel.querySelector("#gladeAvatarMenu"),feedback=panel.querySelector("#gladeFeedback");
  const openConversation=installConversations(panel,room,userId,client,()=>people,()=>selected);
  const resume=()=>{
    if(actionTimer)clearTimeout(actionTimer);
    const seat=seats[selected],idle=lobbyIdleForSpot(places[selected],roleKey);
    seat.classList.remove("activity-greeting","activity-blades","idle-reading","idle-tinkering","idle-looking","idle-warming");
    seat.classList.add(`idle-${idle.kind}`);
    feedback.textContent=`${displayName} ${idle.text}. ${raceDetail[raceKey]||""}`;
  };
  const redraw=()=>{
    seats.forEach(seat=>seat.classList.remove("is-demo"));
    seats.forEach((seat,index)=>{
      const occupant=people.find(person=>person.seat_index===index);
      seat.classList.toggle("is-mine",occupant?.user_id===userId);
      seat.classList.toggle("is-occupied",!!occupant);
      seat.classList.toggle("is-other",!!occupant&&occupant.user_id!==userId);
      if(occupant)seat.dataset.race=occupant.race_key||"";else delete seat.dataset.race;
      seat.title=occupant?.display_name||"";
      seat.setAttribute("aria-label",occupant?`${occupant.display_name}, ${places[index].zone}`:`Escolher ${places[index].zone} ${places[index].ordinal+1}`);
      seat.classList.remove("idle-reading","idle-tinkering","idle-looking","idle-warming","activity-greeting");
      if(occupant){const idle=lobbyIdleForSpot(places[index],occupant.class_key);seat.classList.add(`idle-${idle.kind}`)}
    });
    panel.querySelector("#gladePlacement").textContent=`Seu lugar: ${places[selected].zone}. ${people.length} avatar(es) nesta campanha.`;
    menu.hidden=true;resume();panel.dispatchEvent(new Event("glade-render"));
  };
  const refresh=async()=>{
    const {data,error}=await client.from("campaign_lobby_avatars").select("user_id,seat_index,display_name,race_key,class_key").eq("room_id",room.room_id).order("seat_index",{ascending:true});
    if(!panel.isConnected)return;
    if(error){feedback.textContent="Não foi possível sincronizar os avatares do Lobby.";return}
    const snapshot=JSON.stringify(data||[]);
    if(snapshot===lastSnapshot)return;
    lastSnapshot=snapshot;
    people=data||[];
    const mine=people.find(person=>person.user_id===userId);
    if(mine)selected=mine.seat_index;
    redraw();
  };
  const choose=async index=>{
    if(people.some(person=>person.seat_index===index&&person.user_id!==userId)){feedback.textContent="Esse lugar já está ocupado. Escolha outro.";return}
    const previous=selected;selected=index;
    const {error}=await client.from("campaign_lobby_avatars").upsert({room_id:room.room_id,user_id:userId,character_id:character.id,seat_index:index,display_name:displayName.slice(0,60),race_key:raceKey||"",class_key:roleKey||"",updated_at:new Date().toISOString()},{onConflict:"room_id,user_id"});
    if(error){selected=previous;feedback.textContent=error.code==="23505"?"Alguém escolheu esse lugar antes de você. Tente outro.":`Não foi possível salvar o lugar: ${error.message}`;await refresh();return}
    localStorage.setItem(key,String(index));await refresh();
  };
  seats.forEach((seat,index)=>seat.onclick=()=>{
    const occupant=people.find(person=>person.seat_index===index);
    if(occupant?.user_id===userId){menu.hidden=!menu.hidden;return}
    if(seat.classList.contains("is-demo")){feedback.textContent="Avatar de demonstração: ele só aparece neste navegador e não participa da campanha.";seat.classList.add("activity-greeting");setTimeout(()=>seat.classList.remove("activity-greeting"),2200);return}
    if(occupant){openConversation(occupant);return}
    choose(index);
  });
  refresh().then(()=>{if(panel.isConnected&&!people.some(person=>person.user_id===userId)){
    const available=seats.findIndex((_,index)=>!people.some(person=>person.seat_index===index));
    if(available>=0)choose(people.some(person=>person.seat_index===selected)?available:selected);
  }});
  refreshTimer=setInterval(refresh,4000);
  panel.addEventListener("glade-close",()=>clearInterval(refreshTimer),{once:true});
  panel.querySelector("[data-glade-resume]").onclick=()=>{menu.hidden=true;resume()};
  panel.querySelector("[data-glade-wave]").onclick=()=>{
    const seat=seats[selected];menu.hidden=true;
    seat.classList.remove("idle-reading","idle-tinkering","idle-looking","idle-warming");
    seat.classList.add("activity-greeting");
    feedback.textContent=`${displayName} interrompe sua atividade e faz um aceno.`;
    actionTimer=setTimeout(()=>{if(panel.isConnected)resume()},2200);
  };
  const blades=panel.querySelector("[data-glade-blades]");
  if(blades)blades.onclick=()=>{
    const seat=seats[selected];menu.hidden=true;
    seat.classList.remove("idle-reading","idle-tinkering","idle-looking","idle-warming");
    seat.classList.add("activity-blades");
    feedback.textContent=`As lâminas de ${displayName} deslizam para fora dos antebraços com um brilho de seiva e continuam deixando as mãos livres.`;
    actionTimer=setTimeout(()=>{if(panel.isConnected)resume()},3200);
  };
}

function watchOtherAvatars(panel,room,client){
  const scene=panel.querySelector(".glade-large"),seats=[...scene.querySelectorAll("[data-seat]")],places=lobbySeatLayout();
  scene.classList.add("can-place","view-only");
  const refresh=async()=>{
    const {data}=await client.from("campaign_lobby_avatars").select("seat_index,display_name,race_key,class_key").eq("room_id",room.room_id);
    if(!panel.isConnected||!data)return;
    seats.forEach(seat=>seat.classList.remove("is-demo"));
    seats.forEach((seat,index)=>{
      const person=data.find(item=>item.seat_index===index);
      seat.classList.toggle("is-occupied",!!person);
      if(person)seat.dataset.race=person.race_key||"";else delete seat.dataset.race;
      seat.title=person?.display_name||"";
      seat.setAttribute("aria-label",person?`${person.display_name}, ${places[index].zone}`:`Lugar livre: ${places[index].zone}`);
      seat.classList.remove("idle-reading","idle-tinkering","idle-looking","idle-warming");
      if(person)seat.classList.add(`idle-${lobbyIdleForSpot(places[index],person.class_key).kind}`);
    });
    panel.dispatchEvent(new Event("glade-render"));
  };
  refresh();const timer=setInterval(refresh,4000);
  panel.addEventListener("glade-close",()=>clearInterval(timer),{once:true});
}

function installDemoAvatar(panel){
  const summary=panel.querySelector(".glade-summary"),scene=panel.querySelector(".glade-large"),seats=[...scene.querySelectorAll("[data-seat]")];
  const button=document.createElement("button");button.type="button";button.className="btn glade-demo-toggle";
  const raceButton=document.createElement("button");raceButton.type="button";raceButton.className="btn glade-demo-race";raceButton.hidden=true;
  const actionButton=document.createElement("button");actionButton.type="button";actionButton.className="btn glade-demo-action";actionButton.hidden=true;actionButton.textContent="✨ Estender foices";
  const readButton=document.createElement("button");readButton.type="button";readButton.className="btn glade-demo-read";readButton.hidden=true;
  summary.append(button,raceButton,readButton,actionButton);
  const preview=document.createElement("div");preview.className="glade-demo-preview";preview.hidden=true;summary.after(preview);
  const raceKeys=Object.keys(globalThis.MICROCOSMO_DATA?.races||{}).filter(key=>/^race-\d+$/.test(key));
  let enabled=false,demoRace=0,demoActivity="";
  const render=()=>{
    seats.forEach(seat=>{
      if(!seat.classList.contains("is-demo"))return;
      seat.classList.remove("is-demo","is-occupied","idle-reading","idle-tinkering","idle-looking","idle-warming","activity-greeting","activity-blades");
      seat.title="";
    });
    button.textContent=enabled?"✕ Remover avatar de teste":"＋ Avatar de teste";
    raceButton.hidden=!enabled;
    const raceName=globalThis.MICROCOSMO_DATA?.races?.[raceKeys[demoRace]]?.name||"Povo";
    raceButton.textContent=`🎨 ${raceName}`;
    preview.hidden=!enabled;
    actionButton.hidden=!enabled||raceKeys[demoRace]!=="race-5";
    readButton.hidden=!enabled||raceKeys[demoRace]!=="race-5";
    readButton.textContent=demoActivity==="reading"?"↩ Atividade do lugar":"📖 Ver leitura";
    if(enabled)preview.innerHTML=`${portraitMarkup(raceKeys[demoRace],`Visitante de teste, ${raceName}`)}<div><b>${escapeHtml(raceName)}</b><p>${demoActivity==="reading"?"Lendo com movimentos articulados de olhos, cabeça, antenas, mãos e páginas.":"Visitante de teste · prévia local. Use 🎨 para comparar os povos; seu personagem continua definido pela ficha."}</p></div>`;
    if(!enabled)return;
    const mine=seats.findIndex(seat=>seat.classList.contains("is-mine"));
    const free=seats.map((seat,index)=>({seat,index,distance:mine<0?index:Math.abs(index-mine)}))
      .filter(item=>!item.seat.classList.contains("is-occupied"))
      .sort((a,b)=>a.distance-b.distance)[0];
    if(!free)return;
    free.seat.classList.add("is-demo","is-occupied",`idle-${demoActivity||lobbyIdleForSpot(lobbySeatLayout()[free.index],"").kind}`);
    free.seat.dataset.race=raceKeys[demoRace]||"";
    free.seat.title=`Visitante de teste · ${globalThis.MICROCOSMO_DATA?.races?.[raceKeys[demoRace]]?.name||"Povo"}`;
    free.seat.setAttribute("aria-label",`${free.seat.title}, somente neste navegador`);
  };
  const onDemoClick=event=>{
    const seat=event.target.closest(".glade-seat.is-demo");
    if(!seat)return;
    event.stopPropagation();event.preventDefault();
    const feedback=panel.querySelector("#gladeFeedback");
    panel.dispatchEvent(new Event("glade-demo-interact"));
    if(feedback)feedback.textContent="Conversa de demonstração aberta. Ela existe apenas neste navegador.";
    seat.classList.add("activity-greeting");
    setTimeout(()=>seat.classList.remove("activity-greeting"),2200);
  };
  scene.addEventListener("click",onDemoClick,true);
  button.onclick=()=>{enabled=!enabled;render()};
  raceButton.onclick=()=>{demoRace=(demoRace+1)%Math.max(1,raceKeys.length);demoActivity="";render()};
  readButton.onclick=()=>{demoActivity=demoActivity==="reading"?"":"reading";render()};
  actionButton.onclick=()=>{
    const seat=seats.find(item=>item.classList.contains("is-demo"));if(!seat)return;
    seat.classList.remove("idle-reading","idle-tinkering","idle-looking","idle-warming");seat.classList.add("activity-blades");
    preview.querySelector("p").textContent="As foices aparecem por alguns segundos; as mãos permanecem livres para segurar e interagir.";
    setTimeout(()=>{if(seat.isConnected){seat.classList.remove("activity-blades");seat.classList.add(`idle-${lobbyIdleForSpot(lobbySeatLayout()[Number(seat.dataset.seat)],"").kind}`);render()}},3200);
  };
  panel.addEventListener("glade-render",render);
  panel.addEventListener("glade-close",()=>{panel.removeEventListener("glade-render",render);scene.removeEventListener("click",onDemoClick,true)},{once:true});
  render();
}

export async function openScene(room,{client,userId,enter}){
  const previous=document.getElementById("gladeOverlay");
  if(previous){previous.dispatchEvent(new Event("glade-close"));previous.remove()}
  const panel=document.createElement("div");panel.id="gladeOverlay";panel.className="glade-overlay";
  panel.innerHTML=`<section class="glade-panel" role="dialog" aria-modal="true" aria-label="Lobby da campanha"><div class="glade-top"><div><span class="glade-eyebrow">MICROCOSMO · LOBBY DA CAMPANHA</span><h2>${escapeHtml(room.room_name||"Campanha")}</h2></div><button type="button" class="btn" data-glade-close aria-label="Fechar Lobby">✕</button></div>${sceneMarkup(room,true)}<div class="glade-summary"><span>👥 ${Math.max(0,Number(room.participant_count)||0)}/${Math.max(1,Number(room.max_participants)||6)} jogadores</span><span>${room.has_password?"🔒 Com senha":"🔓 Sem senha"}</span><span>${room.master_mode==="ai"?"🤖 Mestre IA":room.master_mode==="assisted"?"🤖 Assistência IA":"👑 Mestre humano"}</span></div><div class="glade-character" id="gladeCharacter">Verificando sua ficha…</div><div class="glade-actions"><button type="button" class="btn primary" data-glade-enter>▶ Entrar na Mesa</button><button type="button" class="btn" data-glade-close>Voltar às campanhas</button></div></section>`;
  document.body.append(panel);
  const onKey=event=>{if(event.key==="Escape")close()};
  const close=()=>{panel.dispatchEvent(new Event("glade-close"));panel.remove();document.removeEventListener("keydown",onKey)};
  panel.querySelectorAll("[data-glade-close]").forEach(button=>button.onclick=close);
  panel.addEventListener("click",event=>{if(event.target===panel)close()});
  panel.querySelector("[data-glade-enter]").onclick=enter;
  document.addEventListener("keydown",onKey);
  installDemoAvatar(panel);
  if(!userId){const {data}=await client.auth.getUser();userId=data?.user?.id}
  if(!panel.isConnected)return;
  if(!userId){panel.querySelector("#gladeCharacter").textContent="Entre com sua conta para personalizar o avatar.";return}
  const {data,error}=await client.from("characters").select("id,name,data,updated_at").eq("user_id",userId).order("updated_at",{ascending:false}).limit(1);
  if(!panel.isConnected)return;
  const box=panel.querySelector("#gladeCharacter");
  if(error){box.textContent="Não foi possível verificar a ficha agora. A Mesa continua disponível.";return}
  if(room.member_role==="spectator"){box.innerHTML="<b>👁️ Espectador</b><p>Você pode acompanhar os avatares da campanha. Apenas jogadores autorizados escolhem um lugar na Clareira.</p>";watchOtherAvatars(panel,room,client);return}
  if(!data?.length){
    if(room.is_owner){box.innerHTML="<b>👑 Preparação do Mestre</b><p>Você pode ver os avatares e entrar na Mesa sem criar uma ficha.</p>";watchOtherAvatars(panel,room,client);return}
    box.innerHTML=`<b>🎭 Avatar em preparação</b><p>Crie sua ficha para liberar a personalização do personagem no Lobby. Você ainda pode abrir a Mesa.</p><a class="btn" href="index.html?from=lobby">📜 Criar minha ficha</a>`;watchOtherAvatars(panel,room,client);return;
  }
  installSeatPreview(panel,room,userId,data[0],client);
}
