/* MICROCOSMOS — rótulo explícito de Nível de Dificuldade.
   Usado na ficha/Codex e na Mesa. Para criaturas, exibe sempre
   “Nível de Dificuldade: ND X” e preserva XP quando disponível. */
(function(){
 if(globalThis.MICROCOSMOS_CREATURE_ND_LABEL)return;globalThis.MICROCOSMOS_CREATURE_ND_LABEL=true;
 const players=globalThis.MICROCOSMOS_TABLE_PLAYERS;
 function label(v){const nd=String(v??"—").trim()||"—";return `Nível de Dificuldade: ND ${nd}`}
 function mesa(){
   if(!Array.isArray(players))return;
   document.querySelectorAll("[data-select]").forEach(row=>{const p=players.find(x=>x.id===row.dataset.select);if(!p?.creature)return;const s=row.querySelector("small");if(s)s.textContent=`${p.cls||"Criatura"} • ${label(p.challenge??p.level)}${p.xp?` • ${p.xp} XP`:""}`});
   const sel=document.querySelector("#tokenLayer .token.selected"),card=document.getElementById("tokenCard"),p=sel&&players.find(x=>x.id===sel.dataset.token);if(card&&p?.creature){const s=card.querySelector("div > div > small");if(s)s.textContent=`${p.cls||"Criatura"} • ${label(p.challenge??p.level)}${p.xp?` • ${p.xp} XP`:""}`}
 }
 function codex(){
   document.querySelectorAll(".micro-bestiary-row small").forEach(s=>{if(/Nível de Dificuldade:/i.test(s.textContent))return;s.textContent=s.textContent.replace(/\bND\s*([^•]+)/i,(_m,v)=>label(v.trim()))});
   document.querySelectorAll(".micro-bestiary-main p").forEach(p=>{if(!/\bND\s*/i.test(p.textContent)||/Nível de Dificuldade:/i.test(p.textContent))return;const b=[...p.querySelectorAll("b")].find(x=>/^ND\s*/i.test(x.textContent.trim()));if(b)b.textContent=b.textContent.replace(/^ND\s*/i,"Nível de Dificuldade: ND ")})
 }
 // Corrige o valor na origem quando o Mestre usa “Adicionar visível à Mesa”.
 // O formulário já contém o ND correto; após o runtime original criar o token,
 // copiamos esse valor para challenge/level e o XP para o token recém-criado.
 document.addEventListener("click",e=>{
   const btn=e.target?.closest?.("#mcAdd");if(!btn||!Array.isArray(players))return;
   const nd=document.getElementById("mcChallenge")?.value?.trim()||"—",xp=+(document.getElementById("mcXp")?.value||0)||0,before=players.length;
   setTimeout(()=>{const token=players.slice(before).reverse().find(x=>x.creature)||[...players].reverse().find(x=>x.creature);if(!token)return;token.challenge=nd;token.level=nd;token.xp=xp;try{globalThis.MICROCOSMOS_TABLE_API?.renderPlayers?.();globalThis.MICROCOSMOS_TABLE_API?.renderTokens?.();globalThis.MICROCOSMOS_TABLE_API?.selectToken?.(token.id)}catch(_e){}mesa()},0)
 },true);
 function refresh(){mesa();codex()}
 const obs=new MutationObserver(refresh);obs.observe(document.body,{childList:true,subtree:true});
 document.addEventListener("click",()=>setTimeout(refresh,0),true);setTimeout(refresh,250);setTimeout(refresh,1000);
 globalThis.MICROCOSMOS_CREATURE_ND_LABEL_API={label,refresh};
})();