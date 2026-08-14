let pontosDeVida = localStorage.getItem("pontosDeVida");

if (pontosDeVida === null) {
    pontosDeVida = 10;
}

const textoPV = document.getElementById("pv-atual");
const botaoDiminuir = document.getElementById("diminuir-pv");
const botaoAumentar = document.getElementById("aumentar-pv");

const campoNome = document.getElementById("nome-personagem");
const nomeSalvo = localStorage.getItem("nomePersonagem");
if (nomeSalvo !== null) {
    campoNome.value = nomeSalvo;

}
textoPV.textContent = pontosDeVida;

botaoDiminuir.addEventListener("click", function () {
    pontosDeVida = Number(pontosDeVida) - 1;
    personagem.pvAtual = pontosDeVida;
    textoPV.textContent = pontosDeVida;

    localStorage.setItem("pontosDeVida", pontosDeVida);
});

botaoAumentar.addEventListener("click", function () {
    pontosDeVida = Number(pontosDeVida) + 1;
    personagem.pvAtual = pontosDeVida;
    textoPV.textContent = pontosDeVida;

    localStorage.setItem("pontosDeVida", pontosDeVida);
});

campoNome.addEventListener("input", function () {
    personagem.nome = campoNome.value;

    localStorage.setItem("nomePersonagem", campoNome.value);
});
const personagem = {
    nome: nomeSalvo || "",
    nivel: 1,
    pvAtual: Number(pontosDeVida),
    pvMaximo: 10,
    forca: 10,
    destreza: 10,
    inteligencia: 10
};

console.log(personagem);