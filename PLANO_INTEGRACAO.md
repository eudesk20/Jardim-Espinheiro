# Plano de integração — alfa do Microcosmos

## Comparação com o HTML final integrado

### Reaproveitado do repositório

- objeto `personagem` como fonte da verdade;
- persistência no `localStorage`;
- migração das primeiras fichas salvas;
- seis atributos, controles de valor e modificadores calculados;
- nome, nível e pontos de vida.

### Integrado neste bloco

- 20 perícias, incluindo Coleta e Engenharia de Sucata;
- proficiência por perícia e bônus calculado pelo nível;
- seis salvaguardas com proficiência;
- CA, deslocamento, PV temporário e iniciativa;
- Central d20 com perícias, salvaguardas, críticos e histórico;
- estilo responsivo básico (o arquivo CSS continha JavaScript por engano);
- compatibilidade com `skillRanks` do HTML final.

### Ainda necessário para equivalência com a referência

1. Identidade completa: jogador, classe, subclasse, raça, antecedente e XP.
2. Combate completo: ataques, dano, equipamentos, morte e descanso.
3. Inventário: mochila, carrinho, moedas e materiais.
4. Vida no Jardim: aparência, história, memórias, facções e conquistas.
5. Grimório: atributo conjurador, CD, ataque mágico, círculos, slots e componentes.
6. Importação/exportação do personagem e, depois da alfa local, persistência online.

## Situação atual

Os blocos de identidade, combate, equipamentos, inventário, grimório,
página narrativa e proteção dos dados foram concluídos na Alfa 1. A Alfa 1.1
acrescentou atualização imediata dos principais valores automáticos.

## Próximos blocos

1. **Alfa 1.2 — vida em combate** — dano, cura e consumo automático de PV temporário.
2. **Acessibilidade e mensagens** — retornos mais claros para ações e rolagens.
3. **Persistência online** — somente depois de estabilizar o formato local dos dados.

Cada bloco deve passar por teste manual, compatibilidade com personagem salvo e um checkpoint separado no Git.
