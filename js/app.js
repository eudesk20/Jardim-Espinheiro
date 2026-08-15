
// ELEMENTOS DA TELA
// Busca no HTML os elementos que o JavaScript vai controlar.

const textoPV = document.getElementById("pv-atual");
const textoPVMaximo = document.getElementById("pv-maximo");

const botaoDiminuir = document.getElementById("diminuir-pv");
const botaoAumentar = document.getElementById("aumentar-pv");

const campoNome = document.getElementById("nome-personagem");

const textoNivel = document.getElementById("nivel");
const camposIdentidade = ["jogador", "classe", "subclasse", "raca", "antecedente", "xp"];
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

    try {
        personagem = JSON.parse(personagemSalvo);
    } catch (erro) {
        // Preserva o texto corrompido para uma recuperação manual e permite
        // que a ficha abra com dados novos em vez de travar na inicialização.
        localStorage.setItem("personagem-corrompido", personagemSalvo);
        personagem = null;
        console.warn("A ficha salva estava corrompida e foi isolada.", erro);
    }

    // --------------------------------------------------
    // INÍCIO: MIGRAÇÃO DO FORMATO ANTIGO
    // O formato antigo tinha pvAtual, pvMaximo, forca etc.
    // O novo formato organiza isso em vida e atributos.
    // --------------------------------------------------

    if (personagem !== null && personagem.vida === undefined) {

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

if (personagem === undefined || personagem === null) {

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

    personagem.meta = {
        versaoDados: 1,
        atualizadoEm: new Date().toISOString()
    };

    const personagemJSON = JSON.stringify(personagem);

    localStorage.setItem("personagem", personagemJSON);
}

function mostrarStatusDados(mensagem, erro) {
    const status = document.getElementById("status-dados");
    status.textContent = mensagem;
    status.style.color = erro ? "#ff9b8f" : "#b8d99b";
}

function nomeSeguroArquivo(nome) {
    return (nome || "personagem").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "personagem";
}

function exportarPersonagem() {
    salvarPersonagem();
    const pacote = {
        aplicacao: "Microcosmos — Onde o Mundo Termina",
        versaoDados: 1,
        exportadoEm: new Date().toISOString(),
        personagem: personagem
    };
    const arquivo = new Blob([JSON.stringify(pacote, null, 2)], { type: "application/json" });
    const endereco = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = endereco;
    link.download = `microcosmos-${nomeSeguroArquivo(personagem.nome)}.json`;
    link.click();
    URL.revokeObjectURL(endereco);
    mostrarStatusDados("Ficha exportada com sucesso.", false);
}

// Converte nomes usados pelo HTML final antigo para a estrutura atual.
function normalizarPersonagemImportado(dados) {
    const importado = dados.personagem ?? dados;
    if (!importado || typeof importado !== "object" || Array.isArray(importado)) {
        throw new Error("O arquivo não contém um personagem válido.");
    }

    const mapa = { FOR: "forca", DES: "destreza", CON: "constituicao", INT: "inteligencia", SAB: "sabedoria", CAR: "carisma" };
    if (!importado.atributos && importado.stats) {
        importado.atributos = {};
        Object.entries(mapa).forEach(function ([antigo, atual]) {
            importado.atributos[atual] = Number(importado.stats[antigo]) || 10;
        });
    }
    importado.nome = importado.nome ?? importado.charName ?? "";
    importado.jogador = importado.jogador ?? importado.playerName ?? "";
    importado.pericias = importado.pericias ?? importado.skillRanks ?? {};
    if (!importado.vida) {
        importado.vida = {
            atual: Number(importado.hpCurrent ?? importado.pvAtual) || 10,
            maximo: Number(importado.hpMax ?? importado.pvMaximo) || 10,
            temporario: Number(importado.hpTemp ?? importado.pvTemporario) || 0
        };
    }
    if (Array.isArray(importado.saves)) {
        const convertidas = {};
        importado.saves.forEach(function (chave) { convertidas[mapa[chave] ?? chave] = true; });
        importado.salvaguardas = convertidas;
    }

    const atributosValidos = importado.atributos && nomesAtributos.every(function (chave) {
        return Number.isFinite(Number(importado.atributos[chave]));
    });
    if (!atributosValidos || !importado.vida || typeof importado.vida !== "object") {
        throw new Error("Faltam atributos ou pontos de vida válidos no arquivo.");
    }
    return importado;
}

function substituirPersonagem(novoPersonagem, mensagem) {
    localStorage.setItem("personagem-backup", JSON.stringify(personagem));
    localStorage.setItem("personagem", JSON.stringify(novoPersonagem));
    sessionStorage.setItem("status-importacao", mensagem);
    window.location.reload();
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
    textoNivel.value = personagem.nivel;
    camposIdentidade.forEach(function (campo) {
        document.getElementById(campo === "jogador" ? "nome-jogador" : campo).value = personagem[campo];
    });


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
personagem.jogador = personagem.jogador ?? personagem.playerName ?? "";
personagem.classe = personagem.classe ?? "";
personagem.subclasse = personagem.subclasse ?? "";
personagem.raca = personagem.raca ?? personagem.raça ?? "";
personagem.antecedente = personagem.antecedente ?? "";
personagem.xp = personagem.xp ?? personagem.XP ?? 0;
personagem.morte = personagem.morte ?? { sucessos: 0, falhas: 0 };
personagem.ataques = Array.isArray(personagem.ataques) ? personagem.ataques : [];
personagem.equipamentos = personagem.equipamentos ?? {
    armaduraNome: "", armaduraCaBase: 10, armaduraLimiteDes: null,
    escudoNome: "", escudoBonus: 0
};
personagem.moedas = { pc: 0, pp: 0, pe: 0, po: 0, pl: 0, ...(personagem.moedas || {}) };
personagem.inventario = personagem.inventario ?? {};
personagem.inventario.mochila = Array.isArray(personagem.inventario.mochila)
    ? personagem.inventario.mochila : (Array.isArray(personagem.bolsa) ? personagem.bolsa : []);
personagem.inventario.carrinho = Array.isArray(personagem.inventario.carrinho)
    ? personagem.inventario.carrinho : (Array.isArray(personagem.carrinho) ? personagem.carrinho : []);
const grimorioAntigo = personagem.magia ?? {};
personagem.grimorio = personagem.grimorio ?? {
    classe: grimorioAntigo.classe ?? "",
    atributo: grimorioAntigo.atributo ?? "inteligencia",
    espacos: grimorioAntigo.slots ?? {},
    magias: Array.isArray(grimorioAntigo.conhecidas) ? grimorioAntigo.conhecidas : [],
    materiais: grimorioAntigo.materiais ?? ""
};
personagem.grimorio.espacos = personagem.grimorio.espacos ?? {};
personagem.grimorio.magias = Array.isArray(personagem.grimorio.magias) ? personagem.grimorio.magias : [];
personagem.grimorio.magias = personagem.grimorio.magias.map(function (magia) {
    if (typeof magia === "string") {
        return { nome: magia, circulo: 0, componentes: "", dano: "", notas: "", preparada: false };
    }
    return {
        nome: magia.nome ?? "", circulo: Number(magia.circulo ?? magia.nivel) || 0,
        componentes: magia.componentes ?? "", dano: magia.dano ?? "",
        notas: magia.notas ?? magia.efeito ?? "", preparada: Boolean(magia.preparada)
    };
});
for (let circulo = 1; circulo <= 9; circulo += 1) {
    const salvo = personagem.grimorio.espacos[circulo];
    personagem.grimorio.espacos[circulo] = typeof salvo === "object" && salvo !== null
        ? { total: Number(salvo.total) || 0, gastos: Number(salvo.gastos) || 0 }
        : { total: Number(salvo) || 0, gastos: 0 };
}
const narrativaAntiga = personagem.pagina2 ?? personagem.page2 ?? {};
personagem.narrativa = personagem.narrativa ?? {
    origem: narrativaAntiga.origem ?? personagem.origem ?? "",
    aparencia: narrativaAntiga.aparencia ?? personagem.aparencia ?? "",
    historia: narrativaAntiga.historia ?? personagem.historia ?? "",
    memorias: narrativaAntiga.memorias ?? personagem.memorias ?? [],
    faccoes: narrativaAntiga.faccoes ?? personagem.faccoes ?? [],
    conquistas: narrativaAntiga.conquistas ?? personagem.conquistas ?? []
};
["memorias", "faccoes", "conquistas"].forEach(function (lista) {
    const itens = Array.isArray(personagem.narrativa[lista]) ? personagem.narrativa[lista] : [];
    personagem.narrativa[lista] = itens.map(function (item) {
        if (typeof item === "string") return { titulo: item, texto: "" };
        return { titulo: item.titulo ?? item.nome ?? "", texto: item.texto ?? item.descricao ?? item.notas ?? "" };
    });
});

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
    personagem.combate.ca = calcularCA();
    document.getElementById("bonus-proficiencia").textContent = formatarBonus(calcularBonusProficiencia());
    document.getElementById("ca").value = personagem.combate.ca;
    document.getElementById("deslocamento").value = personagem.combate.deslocamento;
    document.getElementById("pv-temporario").value = personagem.vida.temporario;
    document.getElementById("editar-pv-maximo").value = personagem.vida.maximo;

    nomesAtributos.forEach(function (atributo) {
        document.querySelector(`[data-salvaguarda="${atributo}"]`).checked = Boolean(personagem.salvaguardas[atributo]);
        document.querySelector(`[data-bonus-salvaguarda="${atributo}"]`).textContent = formatarBonus(bonusSalvaguarda(atributo));
    });
    pericias.forEach(function (pericia) {
        document.querySelector(`[data-pericia="${pericia[0]}"]`).checked = Boolean(personagem.pericias[pericia[0]]);
        document.querySelector(`[data-bonus-pericia="${pericia[0]}"]`).textContent = formatarBonus(bonusPericia(pericia[0]));
    });
    const historico = document.getElementById("historico-rolagens");
    historico.innerHTML = "";
    personagem.historico.slice(0, 20).forEach(function (item) {
        const linha = document.createElement("li");
        linha.textContent = String(item);
        historico.appendChild(linha);
    });
    atualizarMorte();
    atualizarAtaques();
    atualizarEquipamentos();
    atualizarInventario();
    atualizarGrimorio();
    atualizarNarrativa();
}

function atualizarNarrativa() {
    const narrativa = personagem.narrativa;
    ["origem", "aparencia", "historia"].forEach(function (campo) {
        document.getElementById("narrativa-" + campo).value = narrativa[campo];
    });
    ["memorias", "faccoes", "conquistas"].forEach(function (lista) {
        const area = document.getElementById("lista-" + lista);
        area.innerHTML = "";
        narrativa[lista].forEach(function (item, indice) {
            const linha = document.createElement("div");
            linha.className = "linha-narrativa";
            linha.innerHTML = `<input data-narrativa-lista="${lista}" data-narrativa-campo="titulo" data-indice="${indice}" placeholder="Título ou nome">
                <button class="remover-narrativa" data-lista="${lista}" data-indice="${indice}" aria-label="Remover">×</button>
                <textarea data-narrativa-lista="${lista}" data-narrativa-campo="texto" data-indice="${indice}" rows="3" placeholder="Descrição, relação ou detalhes"></textarea>`;
            linha.querySelector('[data-narrativa-campo="titulo"]').value = item.titulo;
            linha.querySelector('[data-narrativa-campo="texto"]').value = item.texto;
            area.appendChild(linha);
        });
    });
}

function bonusAtaqueMagico() {
    return calcularModificador(personagem.atributos[personagem.grimorio.atributo]) + calcularBonusProficiencia();
}

function atualizarGrimorio() {
    const grimorio = personagem.grimorio;
    document.getElementById("classe-conjuradora").value = grimorio.classe;
    document.getElementById("atributo-conjurador").value = grimorio.atributo;
    document.getElementById("cd-magia").textContent = 8 + bonusAtaqueMagico();
    document.getElementById("ataque-magico").textContent = formatarBonus(bonusAtaqueMagico());
    document.getElementById("materiais-magicos").value = grimorio.materiais;
    atualizarEspacosMagia();
    atualizarMagias();
}

function atualizarEspacosMagia() {
    const area = document.getElementById("espacos-magia");
    area.innerHTML = "";
    for (let circulo = 1; circulo <= 9; circulo += 1) {
        const espaco = personagem.grimorio.espacos[circulo];
        const linha = document.createElement("label");
        linha.className = "circulo-magia";
        linha.innerHTML = `<span>${circulo}º — restantes <strong>${Math.max(0, espaco.total - espaco.gastos)}</strong></span>
            <input data-espaco="total" data-circulo="${circulo}" type="number" min="0" title="Espaços totais">
            <input data-espaco="gastos" data-circulo="${circulo}" type="number" min="0" title="Espaços gastos">`;
        linha.querySelector('[data-espaco="total"]').value = espaco.total;
        linha.querySelector('[data-espaco="gastos"]').value = espaco.gastos;
        area.appendChild(linha);
    }
}

function atualizarMagias() {
    const lista = document.getElementById("lista-magias");
    lista.innerHTML = "";
    personagem.grimorio.magias.forEach(function (magia, indice) {
        const linha = document.createElement("div");
        linha.className = "linha-magia";
        linha.innerHTML = `<input data-magia-campo="nome" data-indice="${indice}" placeholder="Magia">
            <input data-magia-campo="circulo" data-indice="${indice}" type="number" min="0" max="9" title="Círculo">
            <input data-magia-campo="componentes" data-indice="${indice}" placeholder="V, S, M">
            <input data-magia-campo="dano" data-indice="${indice}" placeholder="Dano">
            <input data-magia-campo="notas" data-indice="${indice}" placeholder="Alcance, duração ou efeito">
            <label><input data-magia-campo="preparada" data-indice="${indice}" type="checkbox"> Prep.</label>
            <button class="dano-magia" data-indice="${indice}">Dano</button>
            <button class="remover-magia" data-indice="${indice}" aria-label="Remover magia">×</button>`;
        ["nome", "circulo", "componentes", "dano", "notas"].forEach(function (campo) {
            linha.querySelector(`[data-magia-campo="${campo}"]`).value = magia[campo] ?? "";
        });
        linha.querySelector('[data-magia-campo="preparada"]').checked = Boolean(magia.preparada);
        lista.appendChild(linha);
    });
}

function calcularCA() {
    const equipamentos = personagem.equipamentos;
    const destreza = calcularModificador(personagem.atributos.destreza);
    const bonusDestreza = equipamentos.armaduraLimiteDes === null
        ? destreza
        : (equipamentos.armaduraLimiteDes === 0 ? 0 : Math.min(destreza, equipamentos.armaduraLimiteDes));
    return Math.max(0, equipamentos.armaduraCaBase + bonusDestreza + equipamentos.escudoBonus);
}

function atualizarEquipamentos() {
    const equipamentos = personagem.equipamentos;
    document.getElementById("armadura-nome").value = equipamentos.armaduraNome;
    document.getElementById("armadura-ca-base").value = equipamentos.armaduraCaBase;
    document.getElementById("armadura-limite-des").value = equipamentos.armaduraLimiteDes ?? "";
    document.getElementById("escudo-nome").value = equipamentos.escudoNome;
    document.getElementById("escudo-bonus").value = equipamentos.escudoBonus;
}

function pesoDoLocal(local) {
    return personagem.inventario[local].reduce(function (total, item) {
        return total + (Number(item.quantidade) || 0) * (Number(item.peso) || 0);
    }, 0);
}

function atualizarInventario() {
    Object.keys(personagem.moedas).forEach(function (moeda) {
        document.querySelector(`[data-moeda="${moeda}"]`).value = personagem.moedas[moeda];
    });

    ["mochila", "carrinho"].forEach(function (local) {
        const lista = document.getElementById("lista-" + local);
        lista.innerHTML = "";
        personagem.inventario[local].forEach(function (item, indice) {
            const linha = document.createElement("div");
            linha.className = "linha-item";
            linha.innerHTML = `<input data-item-campo="nome" data-local="${local}" data-indice="${indice}" placeholder="Item">
                <input data-item-campo="quantidade" data-local="${local}" data-indice="${indice}" type="number" min="0" title="Quantidade">
                <input data-item-campo="peso" data-local="${local}" data-indice="${indice}" type="number" min="0" step="0.01" title="Peso unitário em kg">
                <button class="remover-item" data-local="${local}" data-indice="${indice}" aria-label="Remover item">×</button>`;
            linha.querySelector('[data-item-campo="nome"]').value = item.nome;
            linha.querySelector('[data-item-campo="quantidade"]').value = item.quantidade;
            linha.querySelector('[data-item-campo="peso"]').value = item.peso;
            lista.appendChild(linha);
        });
    });

    const mochila = pesoDoLocal("mochila");
    const carrinho = pesoDoLocal("carrinho");
    document.getElementById("peso-mochila").textContent = mochila.toFixed(2);
    document.getElementById("peso-carrinho").textContent = carrinho.toFixed(2);
    document.getElementById("peso-total").textContent = (mochila + carrinho).toFixed(2);
}

function atualizarMorte() {
    ["sucessos", "falhas"].forEach(function (tipo) {
        const grupo = document.getElementById(tipo + "-morte");
        grupo.innerHTML = "";
        for (let indice = 1; indice <= 3; indice += 1) {
            const marcador = document.createElement("input");
            marcador.type = "checkbox";
            marcador.dataset.morte = tipo;
            marcador.dataset.indice = indice;
            marcador.checked = personagem.morte[tipo] >= indice;
            grupo.appendChild(marcador);
        }
    });
}

function atualizarAtaques() {
    const lista = document.getElementById("lista-ataques");
    lista.innerHTML = "";

    personagem.ataques.forEach(function (ataque, indice) {
        const linha = document.createElement("div");
        linha.className = "linha-ataque";
        linha.innerHTML = `<input data-ataque-campo="nome" data-indice="${indice}" placeholder="Ataque">
            <input data-ataque-campo="bonus" data-indice="${indice}" type="number" placeholder="Bônus">
            <input data-ataque-campo="dano" data-indice="${indice}" placeholder="Dano (ex.: 1d8+3)">
            <button class="rolar-ataque" data-indice="${indice}">Rolar</button>
            <button class="rolar-dano" data-indice="${indice}">Dano</button>
            <button class="remover-ataque" data-indice="${indice}" aria-label="Remover ataque">×</button>`;
        linha.querySelector('[data-ataque-campo="nome"]').value = ataque.nome;
        linha.querySelector('[data-ataque-campo="bonus"]').value = ataque.bonus;
        linha.querySelector('[data-ataque-campo="dano"]').value = ataque.dano;
        lista.appendChild(linha);
    });
}

function rolarD20(rotulo, bonus) {
    const dado = Math.floor(Math.random() * 20) + 1;
    const detalhe = dado === 20 ? " — crítico!" : (dado === 1 ? " — falha crítica!" : "");
    personagem.historico.unshift(`${rotulo}: ${dado} ${formatarBonus(bonus)} = ${dado + bonus}${detalhe}`);
    salvarPersonagem();
    atualizarTela();
}

// Aceita fórmulas simples como 1d8+3, 2d6 ou 1d10-1.
function rolarDano(rotulo, expressao) {
    const resultado = String(expressao).trim().match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!resultado) {
        personagem.historico.unshift(`${rotulo}: fórmula de dano inválida (${expressao || "vazia"})`);
    } else {
        const quantidade = Math.min(20, Number(resultado[1]));
        const faces = Math.min(100, Number(resultado[2]));
        const bonus = Number(resultado[3] || 0);
        const dados = Array.from({ length: quantidade }, function () {
            return Math.floor(Math.random() * faces) + 1;
        });
        const total = dados.reduce(function (soma, dado) { return soma + dado; }, 0) + bonus;
        personagem.historico.unshift(`${rotulo} — dano ${expressao}: [${dados.join(", ")}] ${formatarBonus(bonus)} = ${total}`);
    }
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

    personagem.vida.atual = Math.min(
        personagem.vida.maximo,
        personagem.vida.atual + 1
    );

    atualizarTela();
    salvarPersonagem();
});

// FIM DO EVENTO aumentar PV

// ======================================================
// EVENTO: Diminuir PV
// Executado quando o jogador clica no botão "+"
// ======================================================

botaoDiminuir.addEventListener("click", function () {

    personagem.vida.atual = Math.max(0, personagem.vida.atual - 1);

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
    if (alvo.id === "editar-pv-maximo") {
        personagem.vida.maximo = Math.max(1, Number(alvo.value) || 1);
        personagem.vida.atual = Math.min(personagem.vida.atual, personagem.vida.maximo);
    }
    if (alvo.id === "nivel") personagem.nivel = Math.min(20, Math.max(1, Number(alvo.value) || 1));
    if (alvo.id === "nome-jogador") personagem.jogador = alvo.value;
    if (["classe", "subclasse", "raca", "antecedente"].includes(alvo.id)) personagem[alvo.id] = alvo.value;
    if (alvo.id === "xp") personagem.xp = Math.max(0, Number(alvo.value) || 0);
    if (alvo.dataset.morte) {
        const indice = Number(alvo.dataset.indice);
        personagem.morte[alvo.dataset.morte] = alvo.checked ? indice : indice - 1;
    }
    if (alvo.dataset.ataqueCampo) {
        const ataque = personagem.ataques[Number(alvo.dataset.indice)];
        ataque[alvo.dataset.ataqueCampo] = alvo.dataset.ataqueCampo === "bonus"
            ? Number(alvo.value) || 0
            : alvo.value;
    }
    if (alvo.id === "armadura-nome") personagem.equipamentos.armaduraNome = alvo.value;
    if (alvo.id === "armadura-ca-base") personagem.equipamentos.armaduraCaBase = Math.max(0, Number(alvo.value) || 0);
    if (alvo.id === "armadura-limite-des") {
        personagem.equipamentos.armaduraLimiteDes = alvo.value === "" ? null : Number(alvo.value);
    }
    if (alvo.id === "escudo-nome") personagem.equipamentos.escudoNome = alvo.value;
    if (alvo.id === "escudo-bonus") personagem.equipamentos.escudoBonus = Math.max(0, Number(alvo.value) || 0);
    if (alvo.dataset.moeda) personagem.moedas[alvo.dataset.moeda] = Math.max(0, Number(alvo.value) || 0);
    if (alvo.dataset.itemCampo) {
        const item = personagem.inventario[alvo.dataset.local][Number(alvo.dataset.indice)];
        item[alvo.dataset.itemCampo] = alvo.dataset.itemCampo === "nome"
            ? alvo.value
            : Math.max(0, Number(alvo.value) || 0);
    }
    if (alvo.id === "classe-conjuradora") personagem.grimorio.classe = alvo.value;
    if (alvo.id === "atributo-conjurador") personagem.grimorio.atributo = alvo.value;
    if (alvo.id === "materiais-magicos") personagem.grimorio.materiais = alvo.value;
    if (alvo.dataset.espaco) {
        const espaco = personagem.grimorio.espacos[Number(alvo.dataset.circulo)];
        espaco[alvo.dataset.espaco] = Math.max(0, Number(alvo.value) || 0);
        espaco.gastos = Math.min(espaco.gastos, espaco.total);
    }
    if (alvo.dataset.magiaCampo) {
        const magia = personagem.grimorio.magias[Number(alvo.dataset.indice)];
        if (alvo.dataset.magiaCampo === "preparada") magia.preparada = alvo.checked;
        else if (alvo.dataset.magiaCampo === "circulo") magia.circulo = Math.min(9, Math.max(0, Number(alvo.value) || 0));
        else magia[alvo.dataset.magiaCampo] = alvo.value;
    }
    if (alvo.id && alvo.id.startsWith("narrativa-")) {
        personagem.narrativa[alvo.id.replace("narrativa-", "")] = alvo.value;
    }
    if (alvo.dataset.narrativaLista) {
        const item = personagem.narrativa[alvo.dataset.narrativaLista][Number(alvo.dataset.indice)];
        item[alvo.dataset.narrativaCampo] = alvo.value;
    }

    salvarPersonagem();
    atualizarTela();
});

document.addEventListener("click", function (evento) {
    const botao = evento.target.closest(".botao-rolagem");
    if (!botao) return;

    if (botao.dataset.tipo === "d20") rolarD20("d20", 0);
    if (botao.dataset.tipo === "iniciativa") rolarD20("Iniciativa", calcularModificador(personagem.atributos.destreza));
    if (botao.dataset.tipo === "magia") rolarD20("Ataque mágico", bonusAtaqueMagico());
    if (botao.dataset.tipo === "salvaguarda") rolarD20("Salvaguarda de " + botao.dataset.chave, bonusSalvaguarda(botao.dataset.chave));
    if (botao.dataset.tipo === "pericia") {
        const nome = pericias.find(function (item) { return item[0] === botao.dataset.chave; })[1];
        rolarD20(nome, bonusPericia(botao.dataset.chave));
    }
});

document.getElementById("adicionar-ataque").addEventListener("click", function () {
    personagem.ataques.push({ nome: "", bonus: 0, dano: "" });
    salvarPersonagem();
    atualizarTela();
});

document.getElementById("lista-ataques").addEventListener("click", function (evento) {
    const remover = evento.target.closest(".remover-ataque");
    const rolar = evento.target.closest(".rolar-ataque");
    const dano = evento.target.closest(".rolar-dano");

    if (remover) personagem.ataques.splice(Number(remover.dataset.indice), 1);
    if (rolar) {
        const ataque = personagem.ataques[Number(rolar.dataset.indice)];
        rolarD20(ataque.nome || "Ataque", Number(ataque.bonus) || 0);
        return;
    }
    if (dano) {
        const ataque = personagem.ataques[Number(dano.dataset.indice)];
        rolarDano(ataque.nome || "Ataque", ataque.dano);
        return;
    }
    if (remover) {
        salvarPersonagem();
        atualizarTela();
    }
});

document.getElementById("estabilizar").addEventListener("click", function () {
    personagem.morte = { sucessos: 0, falhas: 0 };
    salvarPersonagem();
    atualizarTela();
});

document.getElementById("descanso-longo").addEventListener("click", function () {
    personagem.vida.atual = personagem.vida.maximo;
    personagem.vida.temporario = 0;
    personagem.morte = { sucessos: 0, falhas: 0 };
    Object.values(personagem.grimorio.espacos).forEach(function (espaco) { espaco.gastos = 0; });
    salvarPersonagem();
    atualizarTela();
});

document.querySelectorAll(".adicionar-item").forEach(function (botao) {
    botao.addEventListener("click", function () {
        personagem.inventario[botao.dataset.local].push({ nome: "", quantidade: 1, peso: 0 });
        salvarPersonagem();
        atualizarTela();
    });
});

document.querySelector(".inventario").addEventListener("click", function (evento) {
    const botao = evento.target.closest(".remover-item");
    if (!botao) return;
    personagem.inventario[botao.dataset.local].splice(Number(botao.dataset.indice), 1);
    salvarPersonagem();
    atualizarTela();
});

document.getElementById("adicionar-magia").addEventListener("click", function () {
    personagem.grimorio.magias.push({
        nome: "", circulo: 0, componentes: "", dano: "", notas: "", preparada: false
    });
    salvarPersonagem();
    atualizarTela();
});

document.getElementById("lista-magias").addEventListener("click", function (evento) {
    const remover = evento.target.closest(".remover-magia");
    const dano = evento.target.closest(".dano-magia");
    if (remover) personagem.grimorio.magias.splice(Number(remover.dataset.indice), 1);
    if (dano) {
        const magia = personagem.grimorio.magias[Number(dano.dataset.indice)];
        rolarDano(magia.nome || "Magia", magia.dano);
        return;
    }
    if (remover) {
        salvarPersonagem();
        atualizarTela();
    }
});

// Textos longos são salvos enquanto o jogador escreve. Assim uma atualização
// da página não perde o último parágrafo ainda em edição.
document.querySelector(".pagina-narrativa").addEventListener("input", function (evento) {
    const alvo = evento.target;
    if (alvo.id && alvo.id.startsWith("narrativa-")) {
        personagem.narrativa[alvo.id.replace("narrativa-", "")] = alvo.value;
    }
    if (alvo.dataset.narrativaLista) {
        const item = personagem.narrativa[alvo.dataset.narrativaLista][Number(alvo.dataset.indice)];
        item[alvo.dataset.narrativaCampo] = alvo.value;
    }
    salvarPersonagem();
});

document.querySelectorAll(".adicionar-narrativa").forEach(function (botao) {
    botao.addEventListener("click", function () {
        personagem.narrativa[botao.dataset.lista].push({ titulo: "", texto: "" });
        salvarPersonagem();
        atualizarTela();
    });
});

document.querySelector(".pagina-narrativa").addEventListener("click", function (evento) {
    const botao = evento.target.closest(".remover-narrativa");
    if (!botao) return;
    personagem.narrativa[botao.dataset.lista].splice(Number(botao.dataset.indice), 1);
    salvarPersonagem();
    atualizarTela();
});

// ======================================================
// IMPORTAÇÃO, EXPORTAÇÃO E RECUPERAÇÃO
// ======================================================
document.getElementById("exportar-personagem").addEventListener("click", exportarPersonagem);

document.getElementById("importar-personagem").addEventListener("change", async function (evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    try {
        const dados = JSON.parse(await arquivo.text());
        const importado = normalizarPersonagemImportado(dados);
        const confirmar = window.confirm(
            `Importar a ficha de ${importado.nome || "personagem sem nome"}? A ficha atual será guardada como backup.`
        );
        if (confirmar) substituirPersonagem(importado, "Ficha importada; a versão anterior foi guardada como backup.");
        else mostrarStatusDados("Importação cancelada; nenhum dado foi alterado.", false);
    } catch (erro) {
        mostrarStatusDados("Não foi possível importar: " + erro.message, true);
    } finally {
        evento.target.value = "";
    }
});

document.getElementById("restaurar-backup").addEventListener("click", function () {
    const backup = localStorage.getItem("personagem-backup");
    if (!backup) {
        mostrarStatusDados("Ainda não existe um backup para restaurar.", true);
        return;
    }
    try {
        const restaurado = normalizarPersonagemImportado(JSON.parse(backup));
        if (window.confirm("Restaurar o último backup? A ficha atual também será preservada para desfazer a troca.")) {
            substituirPersonagem(restaurado, "Backup restaurado com sucesso.");
        }
    } catch (erro) {
        mostrarStatusDados("O backup existe, mas não pôde ser restaurado: " + erro.message, true);
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

const statusImportacao = sessionStorage.getItem("status-importacao");
if (statusImportacao) {
    mostrarStatusDados(statusImportacao, false);
    sessionStorage.removeItem("status-importacao");
} else if (localStorage.getItem("personagem-corrompido")) {
    mostrarStatusDados("Uma ficha corrompida foi isolada; exporte a ficha atual antes de continuar.", true);
}
