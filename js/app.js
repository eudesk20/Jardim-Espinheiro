
// ELEMENTOS DA TELA
// Busca no HTML os elementos que o JavaScript vai controlar.

const textoPV = document.getElementById("pv-atual");
const textoPVMaximo = document.getElementById("pv-maximo");

const botaoDiminuir = document.getElementById("diminuir-pv");
const botaoAumentar = document.getElementById("aumentar-pv");

const campoNome = document.getElementById("nome-personagem");

const textoNivel = document.getElementById("nivel");
// BOTÕES DOS ATRIBUTOS
const botoesAtributos =
    document.querySelectorAll(".botao-atributo");

// LISTA DOS ATRIBUTOS
// Guarda os nomes dos atributos utilizados pela ficha.
const nomesAtributos = [
    "forca",
    "destreza",
    "constituicao",
    "inteligencia",
    "sabedoria",
    "carisma"
];

// Cada perícia aponta para o atributo que governa seu cálculo.
// As duas últimas são próprias do Microcosmos.
const pericias = [
    ["acrobacia", "Acrobacia", "destreza"], ["adestrar-animais", "Adestrar Animais", "sabedoria"],
    ["arcanismo", "Arcanismo", "inteligencia"], ["atletismo", "Atletismo", "forca"],
    ["atuacao", "Atuação", "carisma"], ["enganacao", "Enganação", "carisma"],
    ["furtividade", "Furtividade", "destreza"], ["historia", "História", "inteligencia"],
    ["intimidacao", "Intimidação", "carisma"], ["intuicao", "Intuição", "sabedoria"],
    ["investigacao", "Investigação", "inteligencia"], ["medicina", "Medicina", "sabedoria"],
    ["natureza", "Natureza", "inteligencia"], ["percepcao", "Percepção", "sabedoria"],
    ["persuasao", "Persuasão", "carisma"], ["prestidigitacao", "Prestidigitação", "destreza"],
    ["religiao", "Religião", "inteligencia"], ["sobrevivencia", "Sobrevivência", "sabedoria"],
    ["coleta", "Coleta", "sabedoria"], ["engenharia-sucata", "Engenharia de Sucata", "inteligencia"]
];

// 2. CARREGAMENTO DO PERSONAGEM
// Procura no navegador um personagem salvo anteriormente.
const personagemSalvo = localStorage.getItem("personagem");

let personagem;

// ======================================================
// 3. CARREGAMENTO E MIGRAÇÃO DOS DADOS
// Se existe personagem salvo, transforma o JSON em objeto.
// Se estiver no formato antigo, converte para o formato novo.
// ======================================================

if (personagemSalvo !== null) {

    personagem = JSON.parse(personagemSalvo);

    // --------------------------------------------------
    // INÍCIO: MIGRAÇÃO DO FORMATO ANTIGO
    // O formato antigo tinha pvAtual, pvMaximo, forca etc.
    // O novo formato organiza isso em vida e atributos.
    // --------------------------------------------------

    if (personagem.vida === undefined) {

        personagem = {
            nome: personagem.nome,
            nivel: personagem.nivel,

            vida: {
                atual: personagem.pvAtual,
                maximo: personagem.pvMaximo
            },

            atributos: {
                forca: personagem.forca,
                destreza: personagem.destreza,
                inteligencia: personagem.inteligencia
            }
        };

        // Salva imediatamente o personagem já migrado.
        localStorage.setItem(
            "personagem",
            JSON.stringify(personagem)
        );
    }

    // --------------------------------------------------
    // FIM: MIGRAÇÃO DO FORMATO ANTIGO
    // --------------------------------------------------

} 
else {

     // --------------------------------------------------
     // INÍCIO: CRIAÇÃO DE PERSONAGEM NOVO
     // Só acontece quando não existe personagem salvo.
     // --------------------------------------------------

    personagem = {
         nome: "",
         nivel: 1,

        vida: {
         atual: 10,
         maximo: 10
        },

        atributos: {
         forca: 10,
         destreza: 10,
         constituicao: 10,
         inteligencia: 10,
         sabedoria: 10,
         carisma: 10
        }
    }
     // --------------------------------------------------
     // FIM: CRIAÇÃO DE PERSONAGEM NOVO
     // --------------------------------------------------
}


// ======================================================
// 4. FUNÇÃO: SALVAR PERSONAGEM
// Transforma o objeto em JSON e salva no navegador.
// ======================================================

function salvarPersonagem() {

    const personagemJSON = JSON.stringify(personagem);

    localStorage.setItem("personagem", personagemJSON);
}

// FIM DA FUNÇÃO salvarPersonagem()


// ======================================================
// FUNÇÃO: ATUALIZAR TELA
// Mostra no HTML os dados atuais do personagem.
// ======================================================

function atualizarTela() {

    // --------------------------------------------------
    // IDENTIDADE
    // --------------------------------------------------

    campoNome.value = personagem.nome;
    textoNivel.textContent = personagem.nivel;


    // --------------------------------------------------
    // VIDA
    // --------------------------------------------------

    textoPV.textContent = personagem.vida.atual;
    textoPVMaximo.textContent = personagem.vida.maximo;


    // --------------------------------------------------
    // ATRIBUTOS
    // --------------------------------------------------

    nomesAtributos.forEach(function (nomeAtributo) {

    // --------------------------------------------------
    // VALOR DO ATRIBUTO
    // --------------------------------------------------

    const elementoAtributo =
        document.getElementById(nomeAtributo);

    const valorAtributo =
        personagem.atributos[nomeAtributo];

    elementoAtributo.textContent = valorAtributo;


    // --------------------------------------------------
    // MODIFICADOR DO ATRIBUTO
    // --------------------------------------------------

    const elementoModificador =
        document.getElementById(
            "modificador-" + nomeAtributo
        );

    const modificador =
        calcularModificador(valorAtributo);

    if (modificador >= 0) {

    elementoModificador.textContent =
        "+" + modificador;

} else {

    elementoModificador.textContent =
        modificador;
}
});

    // Atualiza os blocos gerados dinamicamente (perícias, saves e combate).
    atualizarRegras();

}

// ======================================================
// FIM DA FUNÇÃO: ATUALIZAR TELA
// ======================================================

// ======================================================
// COMPLETA ATRIBUTOS NOVOS
// Adiciona atributos que não existiam em versões anteriores.
// ======================================================

if (personagem.atributos.constituicao === undefined) {
    personagem.atributos.constituicao = 10;
}

if (personagem.atributos.sabedoria === undefined) {
    personagem.atributos.sabedoria = 10;
}

if (personagem.atributos.carisma === undefined) {
    personagem.atributos.carisma = 10;
}

// Campos acrescentados no bloco alfa. O operador ?? preserva valores válidos,
// inclusive zero, e fornece um padrão somente quando o campo não existe.
personagem.vida.temporario = personagem.vida.temporario ?? 0;
personagem.combate = personagem.combate ?? { ca: 10, deslocamento: 9 };
personagem.salvaguardas = personagem.salvaguardas ?? {};
personagem.pericias = personagem.pericias ?? personagem.skillRanks ?? {};
personagem.historico = Array.isArray(personagem.historico) ? personagem.historico : [];

salvarPersonagem();

// ======================================================
// FUNÇÃO: ALTERAR ATRIBUTO
// Altera qualquer atributo e mantém seu valor entre 1 e 20.
// ======================================================

function alterarAtributo(nomeAtributo, valor) {

    // --------------------------------------------------
    // 1. LÊ O VALOR ATUAL
    // --------------------------------------------------

    const valorAtual = personagem.atributos[nomeAtributo];


    // --------------------------------------------------
    // 2. CALCULA O POSSÍVEL NOVO VALOR
    // --------------------------------------------------

    const novoValor = valorAtual + valor;


    // --------------------------------------------------
    // 3. LIMITE MÁXIMO
    // --------------------------------------------------

    if (novoValor > 20) {

        personagem.atributos[nomeAtributo] = 20;

        atualizarTela();
        salvarPersonagem();

        return;
    }


    // --------------------------------------------------
    // 4. LIMITE MÍNIMO
    // --------------------------------------------------

    if (novoValor < 1) {

        personagem.atributos[nomeAtributo] = 1;

        atualizarTela();
        salvarPersonagem();

        return;
    }


    // --------------------------------------------------
    // 5. VALOR VÁLIDO
    // --------------------------------------------------

    personagem.atributos[nomeAtributo] = novoValor;

    atualizarTela();
    salvarPersonagem();
}

// ======================================================
// FIM DA FUNÇÃO: ALTERAR ATRIBUTO
// ======================================================

// ======================================================
// FUNÇÃO: CALCULAR MODIFICADOR
// Recebe o valor de um atributo e retorna seu modificador.
// O modificador é calculado, portanto não precisa ser salvo.
// ======================================================

function calcularModificador(valorAtributo) {

    const modificador =
        Math.floor((valorAtributo - 10) / 2);

    return modificador;
}

function calcularBonusProficiencia() {
    return 2 + Math.floor((personagem.nivel - 1) / 4);
}

function formatarBonus(valor) {
    return valor >= 0 ? "+" + valor : String(valor);
}

function bonusPericia(chave) {
    const pericia = pericias.find(function (item) { return item[0] === chave; });
    const base = calcularModificador(personagem.atributos[pericia[2]]);
    return base + (personagem.pericias[chave] ? calcularBonusProficiencia() : 0);
}

function bonusSalvaguarda(atributo) {
    const base = calcularModificador(personagem.atributos[atributo]);
    return base + (personagem.salvaguardas[atributo] ? calcularBonusProficiencia() : 0);
}

// O HTML das listas nasce dos catálogos acima. Para incluir uma perícia nova,
// basta acrescentar um item ao catálogo em vez de copiar quatro blocos de código.
function montarRegras() {
    const salvaguardas = document.getElementById("lista-salvaguardas");
    const listaPericias = document.getElementById("lista-pericias");

    nomesAtributos.forEach(function (atributo) {
        const linha = document.createElement("div");
        linha.className = "linha-regra";
        linha.innerHTML = `<input type="checkbox" data-salvaguarda="${atributo}">
            <span>${atributo}</span><strong class="bonus" data-bonus-salvaguarda="${atributo}">+0</strong>
            <button type="button" class="botao-rolagem" data-tipo="salvaguarda" data-chave="${atributo}">Rolar</button>`;
        salvaguardas.appendChild(linha);
    });

    pericias.forEach(function (pericia) {
        const linha = document.createElement("div");
        linha.className = "linha-regra";
        linha.innerHTML = `<input type="checkbox" data-pericia="${pericia[0]}">
            <span>${pericia[1]}</span><strong class="bonus" data-bonus-pericia="${pericia[0]}">+0</strong>
            <button type="button" class="botao-rolagem" data-tipo="pericia" data-chave="${pericia[0]}">Rolar</button>`;
        listaPericias.appendChild(linha);
    });
}

function atualizarRegras() {
    document.getElementById("bonus-proficiencia").textContent = formatarBonus(calcularBonusProficiencia());
    document.getElementById("ca").value = personagem.combate.ca;
    document.getElementById("deslocamento").value = personagem.combate.deslocamento;
    document.getElementById("pv-temporario").value = personagem.vida.temporario;

    nomesAtributos.forEach(function (atributo) {
        document.querySelector(`[data-salvaguarda="${atributo}"]`).checked = Boolean(personagem.salvaguardas[atributo]);
        document.querySelector(`[data-bonus-salvaguarda="${atributo}"]`).textContent = formatarBonus(bonusSalvaguarda(atributo));
    });
    pericias.forEach(function (pericia) {
        document.querySelector(`[data-pericia="${pericia[0]}"]`).checked = Boolean(personagem.pericias[pericia[0]]);
        document.querySelector(`[data-bonus-pericia="${pericia[0]}"]`).textContent = formatarBonus(bonusPericia(pericia[0]));
    });
    document.getElementById("historico-rolagens").innerHTML = personagem.historico.slice(0, 20)
        .map(function (item) { return "<li>" + item + "</li>"; }).join("");
}

function rolarD20(rotulo, bonus) {
    const dado = Math.floor(Math.random() * 20) + 1;
    const detalhe = dado === 20 ? " — crítico!" : (dado === 1 ? " — falha crítica!" : "");
    personagem.historico.unshift(`${rotulo}: ${dado} ${formatarBonus(bonus)} = ${dado + bonus}${detalhe}`);
    salvarPersonagem();
    atualizarTela();
}

// ======================================================
// FIM DA FUNÇÃO: CALCULAR MODIFICADOR
// ======================================================

// ======================================================
// EVENTO: AUMENTAR PV
// Executado quando o jogador clica no botão "+"
// ======================================================

botaoAumentar.addEventListener("click", function () {

    personagem.vida.atual = personagem.vida.atual + 1;

    atualizarTela();
    salvarPersonagem();
});

// FIM DO EVENTO aumentar PV

// ======================================================
// EVENTO: Diminuir PV
// Executado quando o jogador clica no botão "+"
// ======================================================

botaoDiminuir.addEventListener("click", function () {

    personagem.vida.atual = personagem.vida.atual - 1;

    atualizarTela();
    salvarPersonagem();
});

// FIM DO EVENTO Diminuir PV


// ======================================================
// 8. EVENTO: ALTERAR NOME
// Executado sempre que o jogador digita no campo Nome.
// ======================================================

campoNome.addEventListener("input", function () {

    personagem.nome = campoNome.value;

    salvarPersonagem();
});

// FIM DO EVENTO alterar nome

// ======================================================
// EVENTOS: BOTÕES DOS ATRIBUTOS
// Percorre todos os elementos da classe botao-atributo.
// ======================================================

botoesAtributos.forEach(function (botao) {

    // --------------------------------------------------
    // Para CADA botão encontrado, cria um evento de clique.
    // --------------------------------------------------

    botao.addEventListener("click", function () {

        // Descobre qual atributo está escrito no botão.
        const nomeAtributo = botao.dataset.atributo;

        // Descobre quanto esse botão altera.
        // Number() transforma o texto em número.
        const valor = Number(botao.dataset.valor);

        // Usa nossa função que já existia.
        alterarAtributo(nomeAtributo, valor);
    });
});

// FIM DOS EVENTOS dos botões de atributos

// ======================================================
// EVENTOS DO BLOCO ALFA
// Delegação de eventos: um único ouvinte atende todas as
// perícias, salvaguardas e rolagens criadas dinamicamente.
// ======================================================
document.addEventListener("change", function (evento) {
    const alvo = evento.target;

    if (alvo.dataset.pericia) personagem.pericias[alvo.dataset.pericia] = alvo.checked;
    if (alvo.dataset.salvaguarda) personagem.salvaguardas[alvo.dataset.salvaguarda] = alvo.checked;
    if (alvo.id === "ca") personagem.combate.ca = Math.max(0, Number(alvo.value) || 0);
    if (alvo.id === "deslocamento") personagem.combate.deslocamento = Math.max(0, Number(alvo.value) || 0);
    if (alvo.id === "pv-temporario") personagem.vida.temporario = Math.max(0, Number(alvo.value) || 0);

    salvarPersonagem();
    atualizarTela();
});

document.addEventListener("click", function (evento) {
    const botao = evento.target.closest(".botao-rolagem");
    if (!botao) return;

    if (botao.dataset.tipo === "d20") rolarD20("d20", 0);
    if (botao.dataset.tipo === "iniciativa") rolarD20("Iniciativa", calcularModificador(personagem.atributos.destreza));
    if (botao.dataset.tipo === "salvaguarda") rolarD20("Salvaguarda de " + botao.dataset.chave, bonusSalvaguarda(botao.dataset.chave));
    if (botao.dataset.tipo === "pericia") {
        const nome = pericias.find(function (item) { return item[0] === botao.dataset.chave; })[1];
        rolarD20(nome, bonusPericia(botao.dataset.chave));
    }
});

document.getElementById("limpar-historico").addEventListener("click", function () {
    personagem.historico = [];
    salvarPersonagem();
    atualizarTela();
});

// ======================================================
// INICIALIZAÇÃO DA TELA
// ======================================================

montarRegras();
atualizarTela();
