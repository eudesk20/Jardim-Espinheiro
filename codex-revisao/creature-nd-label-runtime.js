/* MICROCOSMOS — rótulo explícito de Nível de Dificuldade.
   Versão segura: qualquer atualização de DOM é idempotente e agrupada em
   requestAnimationFrame. A criação do token fica sob responsabilidade do
   Codex IPM + creature-token-nd-fix; este arquivo apenas apresenta o rótulo.
*/
(function(){
  if(globalThis.MICROCOSMOS_CREATURE_ND_LABEL)return;
  globalThis.MICROCOSMOS_CREATURE_ND_LABEL=true;

  const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
  function label(v){const nd=String(v??"—").trim()||"—";return `Nível de Dificuldade: ND ${nd}`}
  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}

  function mesa(){
    if(!Array.isArray(players))return;
    document.querySelectorAll("[data-select]").forEach(row=>{
      const p=players.find(x=>x.id===row.dataset.select);if(!p?.creature)return;
      setText(row.querySelector("small"),`${p.cls||"Criatura"} • ${label(p.challenge??p.level)}${p.xp?` • ${p.xp} XP`:""}`)
    });
    const sel=document.querySelector("#tokenLayer .token.selected"),card=document.getElementById("tokenCard"),p=sel&&players.find(x=>x.id===sel.dataset.token);
    if(card&&p?.creature)setText(card.querySelector("div > div > small"),`${p.cls||"Criatura"} • ${label(p.challenge??p.level)}${p.xp?` • ${p.xp} XP`:""}`)
  }

  function codex(){
    document.querySelectorAll(".micro-bestiary-row small").forEach(s=>{
      if(/Nível de Dificuldade:/i.test(s.textContent||""))return;
      const next=(s.textContent||"").replace(/\bND\s*([^•]+)/i,(_m,v)=>label(v.trim()));setText(s,next)
    });
    document.querySelectorAll(".micro-bestiary-main p").forEach(p=>{
      if(!/\bND\s*/i.test(p.textContent||"")||/Nível de Dificuldade:/i.test(p.textContent||""))return;
      const b=[...p.querySelectorAll("b")].find(x=>/^ND\s*/i.test((x.textContent||"").trim()));
      if(b)setText(b,(b.textContent||"").replace(/^ND\s*/i,"Nível de Dificuldade: ND "))
    })
  }

  let queued=false;
  function refresh(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;mesa();codex()})
  }

  // Observador permanece apenas para páginas do Codex que montam cards depois do login.
  // Como setText só escreve quando o conteúdo realmente muda, ele não se retroalimenta.
  const obs=new MutationObserver(refresh);obs.observe(document.body,{childList:true,subtree:true});
  document.addEventListener("click",refresh,true);
  refresh();setTimeout(refresh,300);setTimeout(refresh,1000);
  globalThis.MICROCOSMOS_CREATURE_ND_LABEL_API={label,refresh};
})();