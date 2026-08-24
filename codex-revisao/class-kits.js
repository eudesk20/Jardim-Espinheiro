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
"cozinheiro":["A — Caldeirão: panela, colher, faca, 5 ingredientes, 2 rações.","B — Forno: placa aquecedora, formas, farinha/pólen, fogo, 2 rações.","C — Cozinha Móvel: frascos, faca, grelha, bolsa térmica, 3 ingredientes."],
"engenheiro":["A — Armadilheiro: molas, fios, ganchos, alicate, Bolsa de Componentes, 2 armadilhas, 2 rações.","B — Balístico: besta/elástico, munição, ferramentas, mira, Bolsa de Componentes, 2 rações.","C — Oficina Móvel: ferramentas, fios, placas, frascos, Foco Arcano usado como foco técnico, 2 rações."]
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
 mago:{A:["item-6"],B:["item-7"],C:["item-7"]},
 engenheiro:{A:["item-6"],B:["item-6"],C:["item-7"]}
};

globalThis.CLASS_FOCUS_ACCEPTED_ITEMS={
 bardo:["item-6"],
 clerigo:["item-6","item-9"],
 druida:["item-6","item-8"],
 paladino:["item-6","item-9"],
 patrulheiro:["item-6","item-8"],
 feiticeiro:["item-6","item-7"],
 bruxo:["item-6","item-7"],
 mago:["item-6","item-7"],
 engenheiro:["item-6","item-7"]
};
