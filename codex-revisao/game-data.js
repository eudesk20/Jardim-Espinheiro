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
 races:globalThis.CODEX_RACE_DATA,
 classSaves:{barbaro:["FOR","CON"],bardo:["DES","CAR"],bastiao:["FOR","CON"],clerigo:["SAB","CAR"],druida:["INT","SAB"],guerreiro:["FOR","CON"],monge:["DES","SAB"],paladino:["SAB","CAR"],patrulheiro:["FOR","DES"],ladino:["DES","INT"],feiticeiro:["CON","CAR"],bruxo:["SAB","CAR"],mago:["INT","SAB"],cozinheiro:["CON","INT"],engenheiro:["CON","INT"]},
 classWeaponProficiencies:{barbaro:["group:simples","group:marcial"],bardo:["group:simples"],cozinheiro:["group:simples","weapon:tridente_junco","weapon:cimitarra_folha"]},
 classArmorProficiencies:{barbaro:["armor:leve","armor:media","armor:escudo"],bardo:["armor:leve"],cozinheiro:["armor:leve","armor:escudo"]}
};
