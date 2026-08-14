// ======================================================
// 1. ELEMENTOS DA TELA
// Busca no HTML os elementos que o JavaScript vai controlar.
// ======================================================

const textoPV = document.getElementById("pv-atual");
const botaoDiminuir = document.getElementById("diminuir-pv");
const botaoAumentar = document.getElementById("aumentar-pv");
const campoNome = document.getElementById("nome-personagem");


// ======================================================
// 2. CARREGAMENTO DO PERSONAGEM
// Procura no navegador um personagem salvo anteriormente.
// ======================================================

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
    // INÍCIO DA MIGRAÇÃO DO FORMATO ANTIGO
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

        localStorage.setItem(
            "personagem",
            JSON.stringify(personagem)
        );
    }

    // --------------------------------------------------
    // FIM DA MIGRAÇÃO DO FORMATO ANTIGO
    // --------------------------------------------------

} else {

    // --------------------------------------------------
    // CRIAÇÃO DE UM PERSONAGEM NOVO
    // Executado somente quando não existe personagem salvo.
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
            inteligencia: 10
        }
    };
}


// ======================================================
// 4. FUNÇÃO: SALVAR PERSONAGEM
// Transforma o objeto personagem em JSON e salva no navegador.
// ======================================================

function salvarPersonagem() {

    const personagemJSON = JSON.stringify(personagem);

    localStorage.setItem("personagem", personagemJSON);

}

// FIM DA FUNÇÃO salvarPersonagem()


// ======================================================
// 5. FUNÇÃO: ATUALIZAR TELA
// Pega os dados do objeto personagem e mostra no HTML.
// ======================================================

function atualizarTela() {

    campoNome.value = personagem.nome;
    textoPV.textContent = personagem.vida.atual;

}

// FIM DA FUNÇÃO atualizarTela()


// ======================================================
// 6. EVENTO: DIMINUIR PV
// Executado quando o jogador clica no botão "-"
// ======================================================

botaoDiminuir.addEventListener("click", function () {

    personagem.vida.atual = personagem.vida.atual - 1;

    atualizarTela();
    salvarPersonagem();

});

// FIM DO EVENTO diminuir PV


// ======================================================
// 7. EVENTO: AUMENTAR PV
// Executado quando o jogador clica no botão "+"
// ======================================================

botaoAumentar.addEventListener("click", function () {

    personagem.vida.atual = personagem.vida.atual + 1;

    atualizarTela();
    salvarPersonagem();

});

// FIM DO EVENTO aumentar PV


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
// 9. INICIALIZAÇÃO DA TELA
// Depois que tudo estiver preparado, mostra os dados carregados.
// ======================================================

atualizarTela();