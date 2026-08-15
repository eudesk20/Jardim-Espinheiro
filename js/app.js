
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
// INICIALIZAÇÃO DA TELA
// ======================================================

atualizarTela();