/* Fonte única inicial do Microcosmo.
   A ficha e o Codex devem consultar estes registros, nunca manter cópias próprias. */
globalThis.MICROCOSMO_DATA={
 schemaVersion:1,
 classes:{
  barbaro:{name:"Bárbaro",hit:"d12",hp:7,features:["Instinto Primordial","Defesa sem Armadura"],subs:["Fúria do Predador","Casca Inquebrável","Pânico Frenético","Mofo Espiritual"],caster:null},
  bardo:{name:"Bardo",hit:"d8",hp:5,features:["Centelha Inspiradora","Ecos do Passado","Canção do Repouso"],subs:["Estridulante","Contador de Teias","Vagalume","Último Canto"],caster:"CAR"},
  bastiao:{name:"Bastião",hit:"d12",hp:7,features:["Postura Inabalável","Proteção de Aliado"],subs:["Muralha de Besouro-Rinoceronte","Carcaça Refletora","Escudo-Vivo da Colmeia","Fortaleza Ancorada"],caster:null},
  clerigo:{name:"Clérigo",hit:"d8",hp:5,features:["Canalizar Vitalidade","Ritos do Jardim"],subs:["Grande Decomposição","Orvalho & Chuva","Raiz-Mãe","Sol da Copa"],caster:"SAB"},
  cozinheiro:{name:"Cozinheiro",hit:"d10",hp:6,features:["Prato de Assinatura","Mestre dos Utensílios","Livro de Receitas"],subs:["Mestre dos Caldeirões","Gourmet Tóxico","Padeiro de Sementes Féricas","Banqueteiro da Colmeia"],caster:null},
  druida:{name:"Druida",hit:"d8",hp:5,features:["Forma Selvagem","Magia Natural"],subs:["Micro-Enxame","Flora Carnívora","Metamorfoses Quitinosas","Névoa Esporóide"],caster:"SAB"},
  engenheiro:{name:"Engenheiro",hit:"d8",hp:5,features:["Gambiarra","Ferramentas de Sucata"],subs:["Armadilhas de Mola","Balístico de Elástico","Centelha de Bateria","Piloto de Exotraje de Lata"],caster:"INT"},
  feiticeiro:{name:"Feiticeiro",hit:"d6",hp:4,features:["Feitiçaria Inata","Metamagia"],subs:["Sangue-Néctar","Centelha Estática","Magia Caótica do Lixo","Alma Micelial"],caster:"CAR"},
  guerreiro:{name:"Guerreiro",hit:"d10",hp:6,features:["Estilo de Luta","Retomar o Fôlego"],subs:["Esgrima de Agulha","Guardião de Falange","Atirador de Catapulta","Arqueiro de Hastes"],caster:null},
  ladino:{name:"Ladino",hit:"d8",hp:5,features:["Ataque Furtivo","Especialização"],subs:["Saqueador de Sucatas","Sombras de Orvalho","Corta-Gargantas de Agulha","Acrobata de Teias"],caster:null},
  mago:{name:"Mago",hit:"d6",hp:4,features:["Conjuração de Poeira","Recuperação Arcana"],subs:["Alquimista de Resina & Seiva","Opticista do Orvalho","Geometrista da Teia","Necromante do Formigueiro"],caster:"INT"},
  monge:{name:"Monge",hit:"d8",hp:5,features:["Artes Marciais","Fluxo Quitinoso"],subs:["Lâmina Mântica","Salto do Salticidae","Toque Paralisante","Fluxo d'Água"],caster:null},
  paladino:{name:"Paladino",hit:"d10",hp:6,features:["Sentido do Jardim","Imposição das Mãos"],subs:["Juramento da Colmeia","Carvalho Ancestral","Lâmina de Espinho","Guardião da Escuridão"],caster:"CAR"},
  patrulheiro:{name:"Patrulheiro",hit:"d10",hp:6,features:["Explorador do Matagal","Caçador de Predadores"],subs:["Emboscador do Matagal","Montaria de Besouro","Caçador de Predadores Gigantes","Rastreador de Peçonha"],caster:"SAB"},
  bruxo:{name:"Bruxo",hit:"d8",hp:5,features:["Pacto do Jardim","Magia de Patrono"],subs:["Terror do Céu","Sapo do Charco Profundo","Rainha Tecelã da Morte","Gigante Bípede"],caster:"CAR"}
 },
 races:{
  rato:{name:"Rato-dos-Campos",speed:"7,5m",features:["Visão no Escuro","Sentidos Aguçados","Hiper-Nervosismo"],subs:["Rato-Urbano","Rato-Sábio do Silo","Rato-dos-Bueiros"],carry:1},
  lagartixa:{name:"Lagartixa-da-Casca",speed:"9m",features:["Patas Aderentes","Reflexos Répteis"],subs:["Noturna","Solário","Mimetista","Pântano"],carry:1},
  pixie:{name:"Pixie / Fada do Jardim",speed:"4,5m / voo 9m",features:["Asas Féricas","Pó de Estrela"],subs:["Orvalho","Espinheiros","Noturna","Polinizadora"],carry:.7},
  gnomo:{name:"Gnomo-do-Musgo",speed:"7,5m",features:["Astúcia dos Pequenos","Ofício de Jardim"],subs:["Cogumelo","Raiz","Engenheiro","Florido"],carry:1},
  besouro:{name:"Besouro",speed:"7,5m",features:["Exoesqueleto Rígido","Carregador Pesado"],subs:["Rinoceronte","Joaninha","Besouro-Viga","Vira-Bosta"],carry:2},
  formiga:{name:"Formigídeo",speed:"9m",features:["Força de Colônia","Comunicação por Feromônios"],subs:["Soldado","Tecelã","Pote-de-Mel","Corticante"],carry:1.5},
  sapo:{name:"Rãzinha-Sapo",speed:"7,5m / natação 9m",features:["Anfíbio","Pulo do Sapo"],subs:["Flecha-Veneno","Sapo-Boi-Anão","Perereca","Cururu-Místico"],carry:1},
  minhoca:{name:"Minhocóide",speed:"6m",features:["Sentido por Vibração","Escavação"],subs:["Gladiadora","Nutritiva","Vibracional","Tóxica"],carry:1.2}
 }
};
