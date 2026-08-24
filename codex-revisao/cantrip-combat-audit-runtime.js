/* MICROCOSMOS — Auditoria dos Truques de combate.
   Complementa cantrip-quality-runtime com efeitos secundários importantes que
   não podem ser reduzidos a apenas dano + ataque/Salvaguarda. */
(function(){
  if(globalThis.MICROCOSMOS_CANTRIP_COMBAT_AUDIT)return;
  globalThis.MICROCOSMOS_CANTRIP_COMBAT_AUDIT=true;

  const PATCH={
    "Acid Splash":{
      title:"🕸️ Borrifada Ácida",
      description:"Você arremessa uma bolha de seiva ácida contra uma criatura — ou contra duas criaturas próximas entre si.",
      effect:"Escolha 1 criatura dentro do alcance, ou 2 criaturas separadas por até 1,5 m entre si. Cada alvo faz Salvaguarda de DES. Falha: sofre 1d6 de dano Ácido. Sucesso: não sofre dano.",
      limitation:"Se escolher dois alvos, ambos precisam estar dentro do alcance e separados por no máximo 1,5 m."
    },
    "Booming Blade":{
      title:"✨ Lâmina Trovejante",
      description:"Você envolve a arma usada no ataque com energia vibrante que pune o alvo se ele se mover voluntariamente.",
      effect:"Como parte da conjuração, faça um ataque corpo a corpo com arma contra uma criatura a até 1,5 m. Em um acerto, o ataque causa o dano normal da arma e o alvo fica envolto em energia até o início do seu próximo turno. Se ele se mover voluntariamente antes disso, sofre o dano de Trovão indicado pela magia.",
      limitation:"Movimento forçado não ativa o dano secundário.",
      attack:true
    },
    "Chill Touch":{
      title:"🕯️ Toque Necrótico",
      description:"Uma mão espectral de energia necrótica alcança a criatura e interfere temporariamente em sua recuperação.",
      effect:"Faça um ataque mágico à distância. Em um acerto, o alvo sofre 1d8 de dano Necrótico e não pode recuperar PV até o início do seu próximo turno. Se o alvo for Morto-Vivo, ele também sofre Desvantagem nas jogadas de ataque contra você até o fim do seu próximo turno.",
      limitation:"O bloqueio de cura dura apenas até o início do seu próximo turno.",
      attack:true
    },
    "Create Bonfire":{
      title:"🕸️ Criar Fogueira",
      description:"Você conjura uma pequena fogueira mágica em um espaço do chão e a mantém enquanto estiver Concentrado.",
      effect:"Escolha um espaço de 1,5 m dentro do alcance. Uma criatura no espaço quando a fogueira surge faz Salvaguarda de DES. Falha: sofre 1d8 de dano de Fogo. Uma criatura também realiza a Salvaguarda quando entra no espaço pela primeira vez em um turno ou termina o turno ali.",
      limitation:"A fogueira ocupa apenas o espaço escolhido e desaparece quando sua Concentração termina.",
      save:"DES"
    },
    "Eldritch Blast":{
      title:"✨ Explosão Sobrenatural",
      description:"Você dispara um feixe de energia pactuada contra uma criatura dentro do alcance.",
      effect:"Faça um ataque mágico à distância. Em um acerto, o alvo sofre 1d10 de dano de Força. Em níveis superiores, a magia cria feixes adicionais; cada feixe realiza uma jogada de ataque própria e pode escolher o mesmo alvo ou alvos diferentes dentro do alcance.",
      limitation:"Cada feixe exige uma jogada de ataque separada.",
      attack:true
    },
    "Fire Bolt":{
      title:"✨ Raio de Brasa",
      description:"Você dispara uma centelha concentrada de brasa contra uma criatura ou objeto.",
      effect:"Faça um ataque mágico à distância. Em um acerto, o alvo sofre 1d10 de dano de Fogo. Um objeto inflamável que não esteja sendo vestido ou carregado pode pegar fogo.",
      limitation:"Objetos vestidos ou carregados por criaturas não pegam fogo automaticamente por este efeito.",
      attack:true
    },
    "Frostbite":{
      title:"✨ Congelamento",
      description:"Geada dolorosa cobre momentaneamente o alvo e prejudica seu próximo golpe com arma.",
      effect:"O alvo faz Salvaguarda de CON. Falha: sofre 1d6 de dano de Frio e tem Desvantagem na próxima jogada de ataque com arma que fizer antes do fim do próximo turno dele. Sucesso: não sofre o dano nem a penalidade.",
      limitation:"A Desvantagem afeta apenas a próxima jogada de ataque com arma dentro da duração.",
      save:"CON"
    },
    "Green-Flame Blade":{
      title:"✨ Lâmina de Brasa Verde",
      description:"Você reveste a arma com uma chama esverdeada que salta do alvo atingido para outra criatura próxima.",
      effect:"Como parte da conjuração, faça um ataque corpo a corpo com arma. Em um acerto, além do dano normal da arma, você pode fazer a chama saltar para uma segunda criatura que esteja a até 1,5 m do alvo inicial, causando o dano adicional indicado pela progressão da magia.",
      limitation:"O segundo alvo precisa estar a até 1,5 m da criatura atingida pelo ataque inicial.",
      attack:true
    },
    "Infestation":{
      title:"🕸️ Infestação",
      description:"Um enxame momentâneo de pequenos parasitas ou insetos mágicos surge sobre a criatura e a força a se mover desordenadamente.",
      effect:"O alvo faz Salvaguarda de CON. Falha: sofre 1d6 de dano de Veneno e se move 1,5 m em uma direção aleatória, desde que possa se mover. Esse movimento não provoca Ataques de Oportunidade. Sucesso: não sofre o efeito.",
      limitation:"Se nenhuma direção válida estiver livre, o alvo não se move.",
      save:"CON"
    },
    "Lightning Lure":{
      title:"✨ Laço de Relâmpago",
      description:"Você cria um chicote elétrico que tenta puxar uma criatura em sua direção.",
      effect:"Uma criatura dentro do alcance faz Salvaguarda de FOR. Falha: é puxada até 3 m em sua direção; se terminar a até 1,5 m de você, sofre 1d8 de dano de Relâmpago. Sucesso: não é puxada nem sofre dano.",
      limitation:"A criatura só sofre o dano se terminar o puxão a até 1,5 m de você.",
      save:"FOR"
    },
    "Mind Sliver":{
      title:"🎵 Farpinha Mental",
      description:"Você introduz uma fissura psíquica na mente do alvo, dificultando sua próxima resistência.",
      effect:"O alvo faz Salvaguarda de INT. Falha: sofre 1d6 de dano Psíquico e deve subtrair 1d4 da próxima Salvaguarda que realizar antes do fim do seu próximo turno. Sucesso: não sofre o efeito.",
      limitation:"A penalidade de 1d4 vale apenas para a próxima Salvaguarda realizada dentro da duração.",
      save:"INT"
    },
    "Poison Spray":{
      title:"🕸️ Spray de Veneno",
      description:"Você projeta uma nuvem curta de toxina mágica contra uma criatura próxima.",
      effect:"Uma criatura dentro do alcance faz Salvaguarda de CON. Falha: sofre 1d12 de dano de Veneno. Sucesso: não sofre dano.",
      limitation:"Criaturas imunes a Veneno não sofrem o dano.",
      save:"CON"
    },
    "Primal Savagery":{
      title:"🌀 Selvageria Primordial",
      description:"Seus dentes, unhas ou outra parte do corpo assumem momentaneamente uma forma corrosiva e predatória.",
      effect:"Faça um ataque mágico corpo a corpo contra uma criatura a até 1,5 m. Em um acerto, o alvo sofre 1d10 de dano Ácido. A alteração corporal desaparece imediatamente após o ataque.",
      limitation:"A transformação não cria uma arma permanente e não concede ataques adicionais.",
      attack:true
    },
    "Ray of Frost":{
      title:"✨ Raio de Gelo",
      description:"Um raio de frio intenso atinge a criatura e desacelera seus movimentos.",
      effect:"Faça um ataque mágico à distância. Em um acerto, o alvo sofre 1d8 de dano de Frio e seu Deslocamento é reduzido em 3 m até o início do seu próximo turno.",
      limitation:"A redução de Deslocamento deste Truque não se acumula com outra conjuração do mesmo efeito.",
      attack:true
    },
    "Sacred Flame":{
      title:"✨ Brasa Sagrada",
      description:"Energia radiante desce sobre uma criatura que você possa ver e tenta atravessar suas defesas físicas.",
      effect:"O alvo faz Salvaguarda de DES. Falha: sofre 1d8 de dano Radiante. Sucesso: não sofre dano. O alvo não recebe o benefício de cobertura na Salvaguarda contra esta magia.",
      limitation:"A magia ainda exige que você possa ver o alvo.",
      save:"DES"
    },
    "Sapping Sting":{
      title:"🕯️ Picada Debilitante",
      description:"Uma descarga necromântica drena o equilíbrio da criatura e tenta derrubá-la.",
      effect:"O alvo faz Salvaguarda de CON. Falha: sofre 1d4 de dano Necrótico e fica Caído. Sucesso: não sofre o efeito.",
      limitation:"Criaturas que não possam ficar Caídas ignoram apenas essa parte do efeito.",
      save:"CON"
    },
    "Shocking Grasp":{
      title:"✨ Toque Elétrico",
      description:"Relâmpagos percorrem sua mão e descarregam sobre uma criatura ao alcance.",
      effect:"Faça um ataque mágico corpo a corpo. Você recebe Vantagem se o alvo estiver usando armadura feita principalmente de metal. Em um acerto, ele sofre 1d8 de dano de Relâmpago e não pode realizar Reações até o início do próximo turno dele.",
      limitation:"O bloqueio de Reações termina no início do próximo turno do alvo.",
      attack:true
    },
    "Sword Burst":{
      title:"🕸️ Explosão de Lâminas",
      description:"Lâminas espectrais surgem ao redor de você e atingem as criaturas próximas.",
      effect:"Cada criatura à sua escolha a até 1,5 m de você faz Salvaguarda de DES. Falha: sofre 1d6 de dano de Força. Sucesso: não sofre dano.",
      limitation:"Você pode excluir criaturas da área ao conjurar.",
      save:"DES"
    },
    "Thorn Whip":{
      title:"🌀 Chicote Espinhoso",
      description:"Um cipó coberto de espinhos chicoteia uma criatura e pode puxá-la para mais perto.",
      effect:"Faça um ataque mágico corpo a corpo contra uma criatura dentro do alcance. Em um acerto, ela sofre 1d6 de dano Perfurante e, se for Grande ou menor, você pode puxá-la até 3 m em sua direção.",
      limitation:"Criaturas maiores que Grande não podem ser puxadas por este Truque.",
      attack:true
    },
    "Thunderclap":{
      title:"✨ Estrondo",
      description:"Uma onda sonora explosiva parte de você e atinge todas as criaturas muito próximas.",
      effect:"Cada criatura, exceto você, a até 1,5 m faz Salvaguarda de CON. Falha: sofre 1d6 de dano de Trovão. Sucesso: não sofre dano. O som da magia pode ser ouvido a grande distância em ambiente aberto.",
      limitation:"A magia é barulhenta e pode denunciar sua posição.",
      save:"CON"
    },
    "Toll the Dead":{
      title:"🕯️ Sino dos Mortos",
      description:"Um sino espectral ressoa apenas para a criatura escolhida e transforma seus ferimentos em dor necrótica.",
      effect:"O alvo faz Salvaguarda de SAB. Falha: sofre 1d8 de dano Necrótico; se já estiver abaixo do PV máximo, use 1d12 em vez de 1d8. Sucesso: não sofre dano.",
      limitation:"O dado maior só é usado se o alvo já tiver perdido pelo menos 1 PV.",
      save:"SAB"
    },
    "Vicious Mockery":{
      title:"🎵 Zombaria Cruel",
      description:"Você lança uma provocação carregada de magia psíquica que abala a confiança da criatura.",
      effect:"O alvo, se puder ouvir você, faz Salvaguarda de SAB. Falha: sofre 1d4 de dano Psíquico e tem Desvantagem na próxima jogada de ataque que fizer antes do fim do próximo turno dele. Sucesso: não sofre o efeito.",
      limitation:"Uma criatura que não possa ouvir você não é afetada.",
      save:"SAB"
    },
    "Word of Radiance":{
      title:"✨ Palavra de Radiância",
      description:"Você pronuncia uma palavra sagrada e energia radiante irrompe de você contra criaturas próximas escolhidas.",
      effect:"Cada criatura à sua escolha a até 1,5 m de você faz Salvaguarda de CON. Falha: sofre 1d6 de dano Radiante. Sucesso: não sofre dano.",
      limitation:"Você escolhe quais criaturas dentro da área serão afetadas.",
      save:"CON"
    }
  };

  const spells=globalThis.CODEX_SPELL_DATA||[];
  for(const spell of spells){
    if(spell.level!==0)continue;
    const patch=PATCH[spell.reference];if(!patch)continue;
    Object.assign(spell,patch,{audit:"Truque revisado — efeitos de combate auditados"});
  }
  try{
    if(typeof GRIMOIRE_SPELL_INDEX!=="undefined"){
      const byKey=new Map(spells.filter(s=>s.level===0).map(s=>[s.key,s]));
      for(const entry of GRIMOIRE_SPELL_INDEX){const spell=byKey.get(entry.key);if(spell)entry.title=spell.title}
    }
  }catch(e){}
  setTimeout(()=>{try{if(typeof renderMagicAll==="function")renderMagicAll()}catch(e){}},0);
})();
