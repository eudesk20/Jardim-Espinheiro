/* MICROCOSMOS — Auditoria de qualidade dos Truques.
   Corrige descrições genéricas geradas automaticamente e remove o rodapé
   repetitivo que não acrescentava regra. A referência em inglês continua
   sendo a chave estável para futuras regenerações do Grimório. */
(function(){
  if(globalThis.MICROCOSMOS_CANTRIP_QUALITY_RUNTIME)return;
  globalThis.MICROCOSMOS_CANTRIP_QUALITY_RUNTIME=true;

  const GENERIC_LIMIT="A magia respeita cobertura, Concentração, imunidades e requisitos de alvo indicados.";

  const AUDIT={
    "Blade Ward":{
      title:"🛡️ Proteção Contra Lâminas",
      description:"Você traça uma proteção breve sobre si para amortecer golpes físicos.",
      effect:"Até o fim do seu próximo turno, você recebe resistência ao dano Contundente, Cortante e Perfurante causado por ataques com armas.",
      limitation:"Protege apenas contra os tipos de dano indicados; não reduz outros tipos de dano."
    },
    "Control Flames":{
      title:"🌀 Controlar Brasas",
      area:"uma chama não mágica que caiba em um cubo de 1,5 m, a até 18 m",
      description:"Você manipula uma chama não mágica próxima sem criar fogo novo.",
      effect:"Escolha um efeito: apagar instantaneamente a chama; expandi-la até 1,5 m para um espaço com combustível; dobrar ou reduzir pela metade a luz emitida por até 1 hora; ou fazer formas simples aparecerem nas chamas por até 1 hora. Você pode manter até três efeitos duradouros desta magia ao mesmo tempo.",
      limitation:"Não cria uma chama do nada e não controla fogo mágico."
    },
    "Dancing Lights":{
      title:"✨ Luzes Dançantes",
      description:"Você cria até quatro pequenas luzes móveis que podem ser usadas para iluminar, marcar caminhos ou distrair visualmente.",
      effect:"Crie até quatro luzes dentro do alcance. Cada uma produz luz fraca em 3 m. As luzes podem se mover enquanto a magia durar, permanecendo dentro do alcance umas das outras conforme a regra da magia; as quatro também podem se combinar numa única forma luminosa aproximadamente humanoide.",
      limitation:"As luzes não causam dano, não queimam objetos e desaparecem quando a Concentração termina."
    },
    "Druidcraft":{
      title:"🌀 Druidismo",
      description:"Você provoca uma pequena manifestação da natureza, útil para sinais, previsão e efeitos ambientais simples.",
      effect:"Escolha um efeito: prever de forma simples o clima das próximas 24 horas; fazer uma flor ou broto desabrochar; criar um efeito sensorial natural inofensivo, como folhas, cheiro, som de animal ou brisa; ou acender/apagar uma pequena chama não mágica, como vela, tocha ou fogueira pequena.",
      limitation:"Os efeitos são pequenos e inofensivos; não causam dano nem substituem magias de controle climático."
    },
    "Encode Thoughts":{
      title:"🎵 Codificar Pensamento",
      description:"Você retira da própria mente uma ideia, lembrança ou mensagem e a transforma temporariamente em um fio perceptível de pensamento.",
      effect:"Escolha um pensamento, memória ou ideia sua e manifeste-o como um fio de pensamento por até 8 horas. Uma criatura capaz de usar esta mesma magia pode tocar o fio para perceber o conteúdo armazenado.",
      limitation:"Você só codifica conteúdo da sua própria mente; o Truque não lê pensamentos de outra criatura."
    },
    "Friends":{
      title:"🎵 Familiaridade",
      description:"Você usa magia sutil para parecer temporariamente mais convincente para uma criatura que não esteja hostil a você.",
      effect:"Escolha uma criatura não hostil. Enquanto mantiver Concentração, você recebe Vantagem em testes de CAR dirigidos a ela. Quando a magia termina, a criatura percebe que sua atitude foi influenciada magicamente e pode reagir de acordo com a situação.",
      limitation:"Não transforma uma criatura hostil em amistosa e não controla suas decisões."
    },
    "Guidance":{
      title:"👁️ Orientação",
      description:"Você toca uma criatura voluntária e a orienta magicamente em uma tarefa próxima.",
      effect:"Antes de a magia terminar, o alvo pode adicionar 1d4 a um teste de habilidade à escolha dele. O dado pode ser rolado antes ou depois do d20, respeitando o momento permitido pela regra da magia.",
      limitation:"Exige Concentração e beneficia apenas um teste antes de terminar."
    },
    "Gust":{
      title:"🌀 Rajada",
      area:"1 criatura, 1 objeto muito leve ou um ponto de ar a até 9 m",
      description:"Você produz uma rajada curta e direcionada, útil para empurrar um alvo leve ou manipular objetos e o ambiente.",
      effect:"Escolha um efeito: uma criatura Média ou menor faz Salvaguarda de FOR e, na falha, é empurrada 1,5 m para longe de você; um objeto muito leve que não esteja sendo segurado é empurrado até 3 m; ou você cria um efeito inofensivo no ar, como levantar poeira, agitar folhas ou fazer tecidos esvoaçarem.",
      limitation:"Não causa dano, não cria vento sustentado e não ergue uma criatura do chão.",
      save:"FOR",saveTrigger:"Somente ao tentar empurrar uma criatura Média ou menor.",saveFailure:"A criatura é empurrada 1,5 m para longe de você.",saveSuccess:"A criatura não é empurrada."
    },
    "Light":{
      title:"✨ Luminosidade",
      area:"1 objeto tocado; ilumina 6 m e cria penumbra por mais 6 m",
      description:"Você toca um objeto e o faz emitir luz durante a duração da magia.",
      effect:"O objeto emite luz plena em 6 m e penumbra por mais 6 m. Cobrir completamente o objeto com algo opaco bloqueia a luz. Se o objeto estiver sendo vestido ou carregado por uma criatura hostil, ela pode tentar impedir a magia com a Salvaguarda indicada.",
      limitation:"A magia afeta um objeto, não cria uma fonte de calor e não atravessa cobertura opaca que envolva totalmente o objeto."
    },
    "Mage Hand":{
      title:"🕸️ Mão Mágica",
      description:"Você cria uma mão espectral para manipular pequenos objetos à distância.",
      effect:"A mão pode manipular um objeto, abrir uma porta ou recipiente destrancado, guardar ou retirar um item de um recipiente aberto e derramar o conteúdo de um frasco. Você pode movê-la dentro do alcance enquanto a magia durar.",
      limitation:"A mão não pode atacar, ativar itens mágicos nem carregar mais de aproximadamente 4,5 kg."
    },
    "Magic Stone":{
      title:"🌀 Pedra Mágica",
      description:"Você imbui de magia até três pequenas pedras ou sementes duras para que possam ser arremessadas como projéteis mágicos.",
      effect:"Até três projéteis tocados ficam encantados por 1 minuto. Você ou outra criatura pode realizar um ataque mágico à distância com um deles; em um acerto, causa 1d6 + seu Modificador de Conjuração de dano Contundente. O encantamento de um projétil termina quando ele é usado.",
      limitation:"Conjurar novamente encerra o encantamento dos projéteis anteriores ainda não usados."
    },
    "Mending":{
      title:"🌀 Remendar",
      description:"Você repara uma quebra ou rasgo simples em um objeto que possa tocar.",
      effect:"Repare uma única ruptura física de até cerca de 30 cm em qualquer dimensão, como uma corrente partida, tecido rasgado, recipiente rachado ou duas partes separadas de um objeto. A marca do reparo pode permanecer visível conforme o material.",
      limitation:"Pode restaurar a forma física de um item mágico, mas não recupera uma propriedade mágica perdida."
    },
    "Message":{
      title:"🌀 Mensagem",
      description:"Você envia um sussurro mágico privado para uma criatura dentro do alcance e permite uma resposta curta.",
      effect:"Aponte para uma criatura que você conhece dentro do alcance e sussurre uma mensagem. Apenas ela ouve a mensagem e pode responder em um sussurro que apenas você escuta.",
      limitation:"O efeito pode atravessar obstáculos comuns, mas é bloqueado por barreiras muito espessas ou materiais especialmente densos conforme a regra da magia."
    },
    "Minor Illusion":{
      title:"🪞 Ilusão Menor",
      description:"Você cria um som ou a imagem estática de um objeto pequeno para enganar os sentidos por até 1 minuto.",
      effect:"Escolha som ou imagem. Um som pode variar em volume e conteúdo dentro dos limites da magia. Uma imagem deve representar um objeto e caber em um cubo de 1,5 m. Interação física revela que a imagem não possui substância; uma criatura que a examine pode usar Investigação contra sua CD de Magia para reconhecê-la como ilusão.",
      limitation:"Não cria simultaneamente som e imagem e não produz efeitos físicos reais como calor, cheiro ou impacto."
    },
    "Mold Earth":{
      title:"🌀 Moldar Terra",
      area:"uma porção de terra ou pedra solta que caiba em um cubo de 1,5 m, a até 9 m",
      description:"Você manipula uma pequena porção de terra solta para escavar, marcar ou alterar o terreno.",
      effect:"Escolha um efeito: mover terra solta até 1,5 m ao longo do chão; criar formas, cores ou símbolos simples na superfície por até 1 hora; ou transformar o trecho em terreno difícil — ou remover essa dificuldade — por até 1 hora. Você pode manter até dois efeitos duradouros desta magia ao mesmo tempo.",
      limitation:"Não move rocha maciça, não arremessa terra com força suficiente para causar dano e não escava estruturas resistentes automaticamente."
    },
    "On/Off (UA)":{
      title:"🌀 Ligar/Desligar Relíquia (UA)",
      description:"Você envia um pequeno impulso mágico para acionar à distância um mecanismo simples de uma Relíquia dos Gigantes.",
      effect:"Escolha um dispositivo visível dentro do alcance que possua uma função simples de ligar ou desligar. Você alterna esse estado sem tocá-lo, desde que o mecanismo possa responder normalmente a esse comando.",
      limitation:"Não invade sistemas, não escolhe funções complexas e não controla mecanismos que não possuam um comando simples de ligar/desligar."
    },
    "Prestidigitation":{
      title:"🌀 Prestidigitação",
      description:"Você produz pequenos truques mágicos inofensivos para manipular sensações, limpeza, temperatura, marcas e objetos triviais.",
      effect:"Escolha um efeito pequeno: criar um efeito sensorial inofensivo; acender ou apagar uma pequena chama; limpar ou sujar uma área pequena; resfriar, aquecer ou dar sabor a material não vivo; criar uma marca ou símbolo temporário; ou produzir uma pequena bugiganga não mágica/efeito ilusório que caiba na mão. Você pode manter até três efeitos não instantâneos ao mesmo tempo.",
      limitation:"Não causa dano, não cria itens de valor permanente e não reproduz os efeitos completos de outra magia."
    },
    "Produce Flame":{
      title:"🕸️ Criar Brasas",
      description:"Uma pequena chama mágica surge na sua mão: ela pode iluminar ou ser arremessada contra uma criatura.",
      effect:"Enquanto permanecer na mão, a chama não machuca você nem seu equipamento e produz luz. Você pode encerrá-la ao arremessá-la contra uma criatura dentro do alcance, realizando um ataque mágico à distância; em um acerto, causa o dano de Fogo indicado pela magia.",
      limitation:"A chama termina quando é arremessada ou quando a duração acaba."
    },
    "Resistance":{
      title:"🛡️ Resistência",
      description:"Você toca uma criatura voluntária e fortalece brevemente sua capacidade de resistir a um perigo.",
      effect:"Uma vez antes de a magia terminar, o alvo pode adicionar 1d4 a uma Salvaguarda à escolha dele, dentro do momento permitido pela regra da magia.",
      limitation:"Exige Concentração e o benefício termina depois de ser usado uma vez."
    },
    "Shape Water":{
      title:"🌀 Moldar Orvalho",
      area:"uma porção de água ou orvalho que caiba em um cubo de 1,5 m, a até 9 m",
      description:"Você manipula água ou orvalho próximo sem criar nem destruir água.",
      effect:"Escolha um efeito: mover ou alterar o fluxo da água em até 1,5 m; formar figuras simples e animá-las por até 1 hora; mudar uniformemente a cor ou a transparência da água por até 1 hora; ou congelar a água por até 1 hora, desde que nenhuma criatura esteja dentro dela. Você pode manter até dois efeitos duradouros desta magia ao mesmo tempo.",
      limitation:"Não cria água, não causa dano diretamente e não pode congelar água ocupada por uma criatura."
    },
    "Shillelagh":{
      title:"🌀 Bastão Encantado",
      description:"Você imbui um bastão, cajado ou arma natural de madeira apropriada com poder mágico temporário.",
      effect:"Durante a duração, você pode usar seu Atributo de Conjuração no lugar de FOR para as jogadas de ataque e dano com a arma. O dado-base de dano da arma se torna d8 se fosse menor, e os ataques contam como mágicos para superar resistência e imunidade.",
      limitation:"A magia termina se você conjurá-la novamente ou deixar de empunhar a arma por tempo suficiente para perder o vínculo."
    },
    "Spare the Dying":{
      title:"🕯️ Estabilizar Moribundo",
      description:"Você interrompe magicamente a piora dos ferimentos de uma criatura viva que esteja à beira da morte.",
      effect:"Toque uma criatura viva com 0 PV. Ela fica estabilizada e deixa de realizar Salvaguardas contra a Morte enquanto permanecer estável.",
      limitation:"Não recupera PV por si só e não afeta criaturas para as quais estabilização não se aplique."
    },
    "Thaumaturgy":{
      title:"🌀 Taumaturgia",
      description:"Você manifesta um pequeno sinal sobrenatural ligado à sua presença ou fé.",
      effect:"Escolha um efeito inofensivo: ampliar sua voz; alterar temporariamente a aparência de chamas; produzir pequenos tremores; criar um som instantâneo; abrir ou fechar bruscamente uma porta ou janela destrancada; ou alterar temporariamente a aparência dos seus olhos. Você pode manter até três efeitos duradouros desta magia ao mesmo tempo.",
      limitation:"Os efeitos não causam dano e não forçam fechaduras, travas ou estruturas resistentes."
    },
    "True Strike":{
      title:"👁️ Golpe Certeiro",
      description:"Você concentra sua percepção mágica em uma criatura para encontrar uma abertura no próximo ataque.",
      effect:"Escolha um alvo dentro do alcance e mantenha Concentração. No seu próximo turno, você recebe Vantagem no primeiro ataque que fizer contra esse alvo antes da magia terminar.",
      limitation:"O benefício exige manter Concentração até o próximo turno e vale apenas para o primeiro ataque contra o alvo escolhido."
    },
    "Virtue (UA)":{
      title:"🛡️ Vigor Breve (UA)",
      description:"Você toca uma criatura que ainda esteja consciente e reforça temporariamente sua vitalidade.",
      effect:"Se o alvo tiver pelo menos 1 PV, ele recebe PV temporários conforme o valor indicado pela magia até a duração terminar.",
      limitation:"Não estabiliza uma criatura a 0 PV e os PV temporários desaparecem quando a magia termina."
    }
  };

  function spellName(spell){return String(spell.title||spell.reference||"Truque").replace(/^\S+\s*/,"")}
  function polishMechanical(spell){
    if(spell.level!==0||AUDIT[spell.reference])return;
    if(spell.attack&&spell.damage){
      spell.description=`${spellName(spell)} exige um ataque mágico contra o alvo. Em um acerto, causa ${spell.damage}.`;
      return;
    }
    if(spell.save){
      const fail=spell.saveFailure?` Na falha, ${spell.saveFailure.charAt(0).toLowerCase()+spell.saveFailure.slice(1)}`:"";
      const success=spell.saveSuccess?` No sucesso, ${spell.saveSuccess.charAt(0).toLowerCase()+spell.saveSuccess.slice(1)}`:"";
      spell.description=`${spellName(spell)} exige uma Salvaguarda de ${spell.save}.${fail}${success}`;
      return;
    }
    if(spell.damage){spell.description=`${spellName(spell)} causa ${spell.damage} conforme os alvos e a área indicados.`}
  }

  function patchSpell(spell){
    if(!spell||spell.level!==0)return;
    const override=AUDIT[spell.reference];
    if(override){
      for(const [key,value] of Object.entries(override))spell[key]=value;
    }else polishMechanical(spell);
    if(spell.limitation===GENERIC_LIMIT)spell.limitation=override?.limitation||"";
    spell.audit="Truque revisado — descrição de uso e limitação auditadas";
  }

  const spells=globalThis.CODEX_SPELL_DATA||[];
  spells.forEach(patchSpell);

  // O índice também alimenta listas compactas; sincroniza títulos revisados.
  try{
    if(typeof GRIMOIRE_SPELL_INDEX!=="undefined"){
      const byKey=new Map(spells.filter(s=>s.level===0).map(s=>[s.key,s]));
      for(const entry of GRIMOIRE_SPELL_INDEX){const spell=byKey.get(entry.key);if(spell)entry.title=spell.title}
    }
  }catch(e){console.warn("MICROCOSMOS: não foi possível sincronizar títulos dos Truques",e)}

  // Re-renderiza o Grimório caso a página já tenha sido inicializada.
  setTimeout(()=>{
    try{if(typeof renderMagicAll==="function")renderMagicAll()}catch(e){}
    try{if(typeof renderCodex==="function"&&document.getElementById("p4Page")?.classList.contains("active"))renderCodex()}catch(e){}
  },0);
})();
