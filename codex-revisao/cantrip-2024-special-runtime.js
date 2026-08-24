/* MICROCOSMOS — Truques especiais consolidados (base 2024 adaptada).
   Objetivo: evitar duas versões concorrentes no catálogo e adotar as revisões
   que deixaram estes Truques mais úteis, claros e distintos. */
(function(){
  if(globalThis.MICROCOSMOS_CANTRIP_2024_SPECIAL)return;
  globalThis.MICROCOSMOS_CANTRIP_2024_SPECIAL=true;

  const PATCH={
    "Blade Ward":{
      title:"🛡️ Proteção Contra Lâminas",
      cast:"1 Ação",
      range:"Pessoal",
      duration:"Concentração, até 1 minuto",
      area:"Conjurador",
      description:"Você mantém um selo defensivo ativo ao redor do corpo, desviando ataques antes que encontrem uma abertura.",
      effect:"Enquanto mantiver Concentração, sempre que uma criatura fizer uma jogada de ataque contra você, ela subtrai 1d4 da jogada.",
      limitation:"A proteção exige Concentração e não reduz dano automaticamente; ela interfere na jogada de ataque.",
      damage:"",healing:"",attack:false,save:"",higherLevels:""
    },
    "Guidance":{
      title:"👁️ Orientação",
      cast:"1 Ação",
      range:"Toque",
      duration:"Concentração, até 1 minuto",
      area:"1 criatura voluntária tocada",
      description:"Você orienta magicamente uma criatura em uma perícia específica.",
      effect:"Ao conjurar, escolha uma perícia. Enquanto a magia durar, o alvo adiciona 1d4 a qualquer teste de habilidade que use a perícia escolhida.",
      limitation:"Exige Concentração e o bônus vale apenas para a perícia escolhida quando a magia foi conjurada."
    },
    "Resistance":{
      title:"🛡️ Resistência",
      cast:"1 Ação",
      range:"Toque",
      duration:"Concentração, até 1 minuto",
      area:"1 criatura voluntária tocada",
      description:"Você prepara uma criatura para suportar melhor um tipo específico de dano.",
      effect:"Escolha ao conjurar: Ácido, Contundente, Frio, Fogo, Relâmpago, Necrótico, Perfurante, Veneno, Radiante, Cortante ou Trovão. Quando o alvo sofrer dano do tipo escolhido antes da magia terminar, reduza o dano total em 1d4. A criatura só pode receber essa redução uma vez por turno.",
      limitation:"Exige Concentração, funciona apenas contra o tipo de dano escolhido e reduz dano no máximo uma vez por turno."
    },
    "True Strike":{
      title:"👁️ Golpe Certeiro",
      cast:"1 Ação",
      range:"Pessoal",
      duration:"Instantânea",
      area:"1 ataque com uma arma em que você seja proficiente",
      description:"Uma percepção mágica instantânea guia sua arma até a melhor abertura do alvo.",
      effect:"Como parte da conjuração, faça 1 ataque com uma arma em que você seja proficiente. Use seu Atributo de Conjuração no lugar de FOR ou DES para a jogada de ataque e de dano. Ao causar dano, escolha entre o tipo normal da arma ou dano Radiante. No nível 5, o ataque causa +1d6 Radiante; no 11º, +2d6; no 17º, +3d6.",
      limitation:"Exige uma arma em que você seja proficiente. O dano extra é concedido apenas pelo escalonamento do Truque.",
      attack:true,
      higherLevels:"Nível 5: +1d6 Radiante; nível 11: +2d6; nível 17: +3d6."
    },
    "Shillelagh":{
      title:"🌀 Bastão Encantado",
      cast:"1 Ação Bônus",
      range:"Pessoal",
      duration:"1 minuto",
      area:"1 bastão ou cajado apropriado que você esteja segurando",
      description:"Você imbui um bastão ou cajado com força natural, transformando-o numa extensão direta da sua magia.",
      effect:"Enquanto durar, você pode usar seu Atributo de Conjuração no lugar de FOR nas jogadas de ataque e dano corpo a corpo com a arma. O dado de dano passa a d8 e você pode causar dano de Força ou o tipo normal da arma. O dado aumenta para d10 no nível 5, d12 no nível 11 e 2d6 no nível 17.",
      limitation:"A magia termina se você conjurá-la novamente ou soltar a arma.",
      higherLevels:"Nível 5: d10; nível 11: d12; nível 17: 2d6."
    },
    "Spare the Dying":{
      title:"🕯️ Estabilizar Moribundo",
      cast:"1 Ação",
      range:"4,5 m",
      duration:"Instantânea",
      area:"1 criatura a 0 PV dentro do alcance",
      description:"Você interrompe magicamente a piora dos ferimentos de uma criatura que ainda esteja viva.",
      effect:"Escolha uma criatura dentro do alcance que esteja com 0 PV e não esteja morta. Ela fica Estável. O alcance aumenta conforme seu nível.",
      limitation:"Não recupera PV; apenas estabiliza a criatura.",
      healing:"",
      higherLevels:"Nível 5: alcance 9 m; nível 11: 18 m; nível 17: 36 m."
    },
    "Shocking Grasp":{
      title:"✨ Toque Elétrico",
      cast:"1 Ação",
      range:"Toque",
      duration:"Instantânea",
      area:"1 criatura tocada",
      description:"Relâmpagos percorrem sua mão e deixam o alvo incapaz de reagir à sua retirada imediata.",
      effect:"Faça um ataque mágico corpo a corpo. Em um acerto, o alvo sofre 1d8 de dano de Relâmpago e não pode realizar Ataques de Oportunidade até o início do próximo turno dele.",
      limitation:"O Truque bloqueia apenas Ataques de Oportunidade, não todas as Reações.",
      attack:true,
      higherLevels:"No 5º nível, 2d8; no 11º, 3d8; no 17º, 4d8."
    }
  };

  const spells=globalThis.CODEX_SPELL_DATA||[];
  for(const spell of spells){
    if(spell.level!==0)continue;
    const patch=PATCH[spell.reference];if(!patch)continue;
    Object.assign(spell,patch,{audit:"Truque consolidado — versão 2024 adaptada ao MICROCOSMOS"});
  }
  try{
    if(typeof GRIMOIRE_SPELL_INDEX!=="undefined"){
      const byKey=new Map(spells.filter(s=>s.level===0).map(s=>[s.key,s]));
      for(const entry of GRIMOIRE_SPELL_INDEX){const spell=byKey.get(entry.key);if(spell)entry.title=spell.title}
    }
  }catch(e){}
  setTimeout(()=>{try{if(typeof renderMagicAll==="function")renderMagicAll()}catch(e){}},0);
})();
