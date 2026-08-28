const CLASS_STARTING_KITS={
"barbaro":["A — Brutal: arma pesada, arma leve, armadura simples, sobrevivência, 2 rações.","B — Caçador: duas armas leves, arremessáveis, manto, corda, 2 rações.","C — Sobrevivente: arma versátil, escudo leve, coleta, 3 rações."],
"bardo":["A — Intérprete: instrumento artesanal, arma leve, roupa marcante, Bolsa de Componentes, 2 rações.","B — Mensageiro: instrumento pequeno, besta leve, escrita, manto, Bolsa de Componentes, 2 rações.","C — Cronista: instrumento, caderno, arma simples, Bolsa de Componentes, 3 rações."],
"bastiao":["A — Muralha: escudo pesado, lança, armadura rígida, reparo, 2 rações.","B — Interceptor: escudo médio, arma de haste, ganchos, corda, 2 rações.","C — Sentinela: placas leves, arma curta, apito, primeiros socorros, 3 rações."],
"clerigo":["A — Curador: Símbolo Espiritual, armadura leve, arma simples, kit médico, 3 rações.","B — Guardião Ritual: escudo, arma simples, Símbolo Espiritual, resinas, Bolsa de Componentes.","C — Peregrino: bastão, manto, coleta, Símbolo Espiritual, 3 rações."],
"druida":["A — Raízes: bastão, Foco Natural, coleta, proteção vegetal, 2 rações.","B — Esporos: Foco Natural, frascos, máscara, faca ritual, 2 rações.","C — Metamorfo: arma simples, manto, sobrevivência, Foco Natural, 3 rações."],
"guerreiro":["A — Duelista: agulha, escudo, proteção leve, manutenção, 2 rações.","B — Falange: lança, escudo pesado, proteção média, corda, 2 rações.","C — Atirador: arma à distância, munição, faca, camuflagem, 2 rações."],
"monge":["A — Mântico: lâminas leves, faixa, corda, 2 rações.","B — Saltador: bastão, ganchos, manto, escalada.","C — Fluxo d'Água: arma simples, aderência, cantil, 3 rações."],
"paladino":["A — Protetor: escudo, arma marcial, armadura média, Símbolo Espiritual, 2 rações.","B — Cavaleiro: haste, proteção média, montaria, Símbolo Espiritual, 2 rações.","C — Peregrino: arma versátil, escudo leve, cura, Símbolo Espiritual, manto, 3 rações."],
"patrulheiro":["A — Rastreador: arco, faca, camuflagem, coleta, Foco Natural, 2 rações.","B — Caçador de Grandes: lança pesada, corda/ganchos, armadilhas, proteção média, Foco Natural.","C — Batedor: arma leve, besta, escalada, mapas, Foco Natural, 3 rações."],
"ladino":["A — Infiltrador: ferramentas, adaga, corda, manto, 2 rações.","B — Saqueador: arma leve, sucata, ganchos, ferramentas, 2 rações.","C — Atirador Furtivo: arma à distância, munição, faca, camuflagem, 2 rações."],
"feiticeiro":["A — Condutor: Foco Arcano, arma simples, manto, 2 rações.","B — Errante: lâmina, exploração, Bolsa de Componentes, 2 rações.","C — Catalisador: cristais, Foco Arcano, frascos, proteção leve, 2 rações."],
"bruxo":["A — Pactuário: Foco Arcano, arma simples, amuletos, 2 rações.","B — Caçador Sombrio: arma leve, Foco Arcano, manto, 2 rações.","C — Portador do Sinal: talismã, besta leve, Bolsa de Componentes, corda, 3 rações."],
"mago":["A — Erudito: Grimório, Bolsa de Componentes, arma simples, 2 rações.","B — Pesquisador: Grimório compacto, lupa, coleta, Foco Arcano, 2 rações.","C — Alquimista: Grimório, frascos, reagentes, Foco Arcano, 2 rações."],
"cozinheiro":[
 "A — Cozinha de Campanha: Frigideira de Combate, Chapa de Forno reforçada, Caldeirão-Mochila, Kit de Cozinha e ingredientes. Estilo: defesa, recuperação e preparo seguro.",
 "B — Cutelo do Matagal: Cutelo de Casca, Bolsa de Temperos, Kit de Cozinha, fogo portátil e ingredientes. Estilo: combate, vigor e preparo rápido.",
 "C — Cozinha de Caravana: Frigideira de Combate, Caldeirão-Mochila e Carrinho-Cozinha Improvisada. Estilo: exploração, produção em grupo e grande capacidade de transporte."
],
"engenheiro":[
 "A — Armadilheiro de Campo: Martelo de Montagem, Kit de Engenharia, Estojo de Molas, corda e ganchos. Estilo: controle, armadilhas e preparação do terreno.",
 "B — Balístico de Sucata: Lançador de Mola, Chave de Sucata, Kit de Engenharia, Caixa de Peças e lupa. Estilo: alcance, precisão e dispositivos ofensivos.",
 "C — Oficina Móvel: Martelo de Montagem, Chave de Sucata, Kit de Engenharia, Caixa de Peças e Carrinho-Oficina. Estilo: suporte, reparo e construção em campo."
]
};

// Disponibiliza a mesma fonte de dados para os runtimes da ficha.
globalThis.CLASS_STARTING_KITS=CLASS_STARTING_KITS;

// Identidade mecânica dos Kits de Ofício.
// Cada Kit ensina 1 conhecimento fixo e permite escolher 2 entre 3 opções.
// O restante das Receitas/Projetos deve ser comprado, ganho, encontrado,
// ensinado ou descoberto durante a campanha.
globalThis.CLASS_OFFICIO_KITS={
 cozinheiro:{
  A:{name:"Cozinha de Campanha",style:"Defesa • Recuperação • Preparo seguro",fixed:"caldo_gota",choices:["pao_valente","cha_sereno","doce_vagalume"],choose:2,cartType:"none",advantage:"A Chapa funciona como Escudo e superfície de preparo; o Caldeirão-Mochila vira estação culinária durante descansos."},
  B:{name:"Cutelo do Matagal",style:"Combate • Vigor • Preparo rápido",fixed:"pao_valente",choices:["caldo_gota","cha_sereno","doce_vagalume"],choose:2,cartType:"none",advantage:"O Cutelo é uma arma de ofício leve e a Bolsa de Temperos mantém o conjunto de preparo pronto para receitas de campanha."},
  C:{name:"Cozinha de Caravana",style:"Exploração • Grupo • Transporte",fixed:"doce_vagalume",choices:["caldo_gota","pao_valente","cha_sereno"],choose:2,cartType:"cozinha",advantage:"O Carrinho-Cozinha transporta até 6× a carga base e, estacionado, funciona como Cozinha Improvisada."}
 },
 engenheiro:{
  A:{name:"Armadilheiro de Campo",style:"Controle • Armadilhas • Terreno",fixed:"mina_espinhos",choices:["gancho_besouro","luz_mecanica","lancador_sementes"],choose:2,cartType:"none",advantage:"O Estojo de Molas e o Martelo de Montagem formam uma estação compacta para instalar e reparar mecanismos de campo."},
  B:{name:"Balístico de Sucata",style:"Alcance • Precisão • Ofensiva",fixed:"lancador_sementes",choices:["mina_espinhos","gancho_besouro","luz_mecanica"],choose:2,cartType:"none",advantage:"O Lançador de Mola é uma arma de ofício própria do Engenheiro e a Caixa de Peças mantém munição e ajustes técnicos organizados."},
  C:{name:"Oficina Móvel",style:"Suporte • Reparo • Construção",fixed:"luz_mecanica",choices:["mina_espinhos","lancador_sementes","gancho_besouro"],choose:2,cartType:"oficina",advantage:"O Carrinho-Oficina transporta até 6× a carga base e, estacionado, funciona como bancada de Engenharia em campo."}
 }
};

// Item mágico funcional concedido por cada opção de Kit.
// IDs vêm de CODEX_ITEM_DATA: item-6 Bolsa, item-7 Foco Arcano,
// item-8 Foco Natural, item-9 Símbolo Espiritual.
globalThis.CLASS_STARTING_KIT_MAGIC={
 bardo:{A:["item-6"],B:["item-6"],C:["item-6"]},
 clerigo:{A:["item-9"],B:["item-9","item-6"],C:["item-9"]},
 druida:{A:["item-8"],B:["item-8"],C:["item-8"]},
 paladino:{A:["item-9"],B:["item-9"],C:["item-9"]},
 patrulheiro:{A:["item-8"],B:["item-8"],C:["item-8"]},
 feiticeiro:{A:["item-7"],B:["item-6"],C:["item-7"]},
 bruxo:{A:["item-7"],B:["item-7"],C:["item-6"]},
 mago:{A:["item-6"],B:["item-7"],C:["item-7"]}
};

globalThis.CLASS_FOCUS_ACCEPTED_ITEMS={
 bardo:["item-6"],
 clerigo:["item-6","item-9"],
 druida:["item-6","item-8"],
 paladino:["item-6","item-9"],
 patrulheiro:["item-6","item-8"],
 feiticeiro:["item-6","item-7"],
 bruxo:["item-6","item-7"],
 mago:["item-6","item-7"]
};
