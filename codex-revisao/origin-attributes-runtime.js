/* MICROCOSMOS — Atributos das Origens / Antecedentes.
   Distribuição inspirada na estrutura 2024: cada Antecedente oferece 3 atributos coerentes
   com sua identidade, perícias e treinamento. O jogador escolhe +2/+1 entre dois deles
   ou +1/+1/+1 nos três, respeitando o limite geral do sistema. */
(function(){
  const DATA={
    "Explorador de Raízes":{abilities:["DES","CON","SAB"],reason:"mobilidade em terreno perigoso, resistência de viagem e leitura do ambiente"},
    "Sucateiro de Ruínas":{abilities:["DES","CON","INT"],reason:"manuseio cuidadoso, sobrevivência entre ruínas e conhecimento técnico"},
    "Curandeiro de Colônia":{abilities:["CON","INT","SAB"],reason:"resistência física, conhecimento de tratamento e percepção das necessidades dos feridos"},
    "Coletor de Pólen":{abilities:["CON","INT","SAB"],reason:"tolerância à coleta, conhecimento natural e leitura de épocas e perigos"},
    "Sentinela de Muralha":{abilities:["FOR","CON","SAB"],reason:"força para defender, resistência de vigília e percepção de ameaças"},
    "Mensageiro de Folhas":{abilities:["DES","CON","SAB"],reason:"acrobacia, fôlego de viagem e conhecimento de rotas"},
    "Artista de Clareira":{abilities:["DES","SAB","CAR"],reason:"coordenação de performance, leitura do público e presença social"},
    "Erudito de Casca":{abilities:["INT","SAB","CAR"],reason:"estudo, interpretação de registros e transmissão de conhecimento"},
    "Devoto do Ciclo":{abilities:["CON","SAB","CAR"],reason:"disciplina ritual, cuidado espiritual e força de presença"},
    "Caçador do Capim Alto":{abilities:["DES","CON","SAB"],reason:"furtividade, resistência de perseguição e rastreamento"},
    "Cozinheiro de Caravana":{abilities:["CON","INT","SAB"],reason:"resistência de jornada, preparo técnico e leitura de ingredientes e necessidades do grupo"},
    "Aprendiz de Oficina":{abilities:["DES","CON","INT"],reason:"precisão manual, rotina de oficina e raciocínio de engenharia"},
    "Refugiado da Estufa":{abilities:["DES","CON","SAB"],reason:"evasão, resistência diante da perda e instinto para avaliar perigos"},
    "Diplomata de Colônia":{abilities:["INT","SAB","CAR"],reason:"registro de acordos, leitura de intenções e negociação"},
    "Escavador de Horta":{abilities:["FOR","CON","SAB"],reason:"trabalho pesado, resistência física e leitura de terra e raízes"},
    "Sobrevivente dos Gigantes":{abilities:["CON","INT","SAB"],reason:"resistência ao desconhecido, investigação de Relíquias e atenção constante ao ambiente"}
  };
  globalThis.ORIGIN_ATTRIBUTE_DATA=DATA;
  globalThis.ORIGIN_ATTRIBUTE_RULE={
    optionA:"Escolha um dos 3 atributos para +2 e outro diferente para +1.",
    optionB:"Ou distribua +1 nos 3 atributos.",
    limit:"Nenhum aumento pode ultrapassar o limite geral de atributo da ficha."
  };

  function enhance(){
    const section=document.getElementById("antecedentes");
    if(!section)return;
    const note=section.querySelector(":scope > .note");
    if(note&&!note.dataset.originAttributes){
      note.dataset.originAttributes="1";
      note.insertAdjacentHTML("beforeend",'<br><br><b>📈 Atributos do Antecedente:</b> cada Antecedente oferece 3 atributos coerentes com sua história. Distribua <b>+2 em um e +1 em outro</b>, ou <b>+1 nos três</b>. O bônus nunca transforma os três atributos em bônus livres fora da lista do Antecedente.');
    }
    section.querySelectorAll(".card.searchable").forEach(card=>{
      const name=String(card.querySelector("h3")?.textContent||"").replace(/^📜\s*/,"").trim();
      const data=DATA[name];if(!data)return;
      const summary=card.querySelector(".origin-summary");
      if(summary){
        const first=summary.firstElementChild;
        if(first)first.innerHTML=`<b>Atributos</b>${data.abilities.join(" • ")}<small style="display:block;margin-top:4px;color:#75634d">+2/+1 em dois diferentes, ou +1/+1/+1.</small>`;
      }
      if(!card.querySelector(".origin-attribute-detail")){
        const identity=[...card.querySelectorAll(".detail")].find(x=>/Identidade narrativa/i.test(x.textContent));
        const box=document.createElement("div");box.className="detail origin-attribute-detail";
        box.innerHTML=`<b>📈 Atributos disponíveis:</b> ${data.abilities.join(", ")}. <b>Por quê:</b> ${data.reason}.<br><small>Distribuição: +2 em um e +1 em outro, ou +1 em cada um dos três.</small>`;
        if(identity)identity.insertAdjacentElement("afterend",box);else card.appendChild(box);
      }
    });
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",enhance);else enhance();
})();
