let pontosDeVida = localStorage.getItem("pontosDeVida");

if (pontosDeVida === null) {
    pontosDeVida = 10;
}

const textoPV = document.getElementById("pv-atual");
const botaoDiminuir = document.getElementById("diminuir-pv");
const botaoAumentar = document.getElementById("aumentar-pv");
textoPV.textContent = pontosDeVida;

botaoDiminuir.addEventListener("click", function () {
    pontosDeVida = Number(pontosDeVida) - 1;

    textoPV.textContent = pontosDeVida;

    localStorage.setItem("pontosDeVida", pontosDeVida);
});

botaoAumentar.addEventListener("click", function () {
    pontosDeVida = Number(pontosDeVida) + 1;

    textoPV.textContent = pontosDeVida;

    localStorage.setItem("pontosDeVida", pontosDeVida);
});