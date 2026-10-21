// Visualizador da etapa 1. Depende de dados/amostra_instancias.js (COLUNAS, INSTANCIAS, PANORAMA).

const colunasCategoricas = ["protocol_type", "service", "flag"];
const colunasBinarias = ["land", "logged_in", "root_shell", "is_host_login", "is_guest_login"];
const colunasTaxas = COLUNAS.filter(nome => nome.endsWith("_rate"));
const colunasContagens = COLUNAS.filter(nome =>
    nome !== "class" && ![...colunasCategoricas, ...colunasBinarias, ...colunasTaxas].includes(nome));

const COLUNAS_POR_GRUPO = {
    todas: COLUNAS.filter(nome => nome !== "class"),
    categoricos: colunasCategoricas,
    binarios: colunasBinarias,
    contagens: colunasContagens,
    taxas: colunasTaxas,
};

const ETIQUETA_DA_INSTANCIA = {
    categoricos: "Atributo categórico",
    inconsistencia: "Inconsistência",
    redundancia: "Redundância",
    desbalanceamento: "Desbalanceamento",
    extremo: "Valor extremo",
};

const TEXTO_PROVISORIO = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

const EXPLICACOES = {
    colunas_todas: "Visão geral dos atributos",
    colunas_categoricos: "O que são atributos categóricos?",
    colunas_binarios: "O que são atributos binários?",
    colunas_contagens: "O que são atributos de contagem e tamanho?",
    colunas_taxas: "O que são as taxas (valores de 0 a 1)?",
    instancias_todas: "Instâncias da amostra",
    instancias_inconsistencia: "O que são inconsistências?",
    instancias_redundancia: "O que são redundâncias?",
    instancias_desbalanceamento: "O que é desbalanceamento?",
    instancias_extremo: "O que são valores extremos?",
};

const SELETORES_DE_COLUNAS = [
    { chave: "todas", rotulo: "Todos os atributos" },
    { chave: "categoricos", rotulo: "Categóricos" },
    { chave: "binarios", rotulo: "Binários" },
    { chave: "contagens", rotulo: "Contagens e tamanhos" },
    { chave: "taxas", rotulo: "Taxas" },
];

const SELETORES_DE_INSTANCIAS = [
    { chave: "todas", rotulo: "Todas" },
    { chave: "inconsistencia", rotulo: "Inconsistências" },
    { chave: "redundancia", rotulo: "Redundâncias" },
    { chave: "desbalanceamento", rotulo: "Desbalanceamento" },
    { chave: "extremo", rotulo: "Valores extremos" },
];

const estado = { grupoDeColunas: "todas", filtroDeInstancias: "todas", linhaSelecionada: null };

const formatarValor = valor =>
    typeof valor === "number" ? valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : valor;

const instanciasVisiveis = () => INSTANCIAS.filter(instancia =>
    estado.filtroDeInstancias === "todas" || instancia.tags.includes(estado.filtroDeInstancias));

function criarSeletor(idDoContainer, opcoes, chaveDoEstado, prefixoDaExplicacao) {
    const container = document.getElementById(idDoContainer);
    opcoes.forEach(opcao => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.dataset.chave = opcao.chave;
        const quantidade = chaveDoEstado === "filtroDeInstancias"
            ? INSTANCIAS.filter(i => opcao.chave === "todas" || i.tags.includes(opcao.chave)).length : null;
        botao.textContent = quantidade === null ? opcao.rotulo : `${opcao.rotulo} (${quantidade})`;
        botao.addEventListener("click", () => {
            estado[chaveDoEstado] = opcao.chave;
            container.querySelectorAll("button").forEach(b =>
                b.setAttribute("aria-pressed", String(b === botao)));
            mostrarExplicacao(`${prefixoDaExplicacao}_${opcao.chave}`);
            desenharTabela();
        });
        container.appendChild(botao);
    });
    container.querySelector("button").setAttribute("aria-pressed", "true");
}

function mostrarExplicacao(chave) {
    document.getElementById("viz-explicacao-titulo").textContent = EXPLICACOES[chave];
    document.getElementById("viz-explicacao-texto").textContent = TEXTO_PROVISORIO;
    const painel = document.getElementById("viz-panorama");
    painel.hidden = chave !== "instancias_desbalanceamento";
    if (!painel.hidden) desenharPanorama(painel);
}

function desenharPanorama(painel) {
    painel.replaceChildren();
    const grupos = [["class", "Classe"], ["protocol_type", "protocol_type"], ["flag", "flag"], ["service", "service"]];
    grupos.forEach(([chave, titulo]) => {
        const bloco = document.createElement("div");
        bloco.className = "viz-distribuicao";
        const cabecalho = document.createElement("h3");
        cabecalho.textContent = `${titulo} na base inteira (${PANORAMA.total.toLocaleString("pt-BR")} linhas)`;
        bloco.appendChild(cabecalho);
        PANORAMA[chave].forEach(([categoria, quantidade]) => {
            const percentual = quantidade / PANORAMA.total * 100;
            const linha = document.createElement("div");
            linha.className = "viz-linha-barra";
            const nome = document.createElement("span");
            nome.textContent = categoria;
            const trilha = document.createElement("div");
            trilha.className = "viz-trilha";
            const preenchimento = document.createElement("span");
            preenchimento.style.width = `${Math.max(percentual, 0.5)}%`;
            trilha.appendChild(preenchimento);
            const valor = document.createElement("b");
            valor.textContent = `${percentual.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
            linha.append(nome, trilha, valor);
            bloco.appendChild(linha);
        });
        painel.appendChild(bloco);
    });
}

function desenharTabela() {
    const nomesDasColunas = COLUNAS_POR_GRUPO[estado.grupoDeColunas];
    const linhas = instanciasVisiveis();
    const tabela = document.getElementById("viz-tabela");
    tabela.replaceChildren();

    const cabecalho = tabela.createTHead().insertRow();
    ["linha", ...nomesDasColunas, "class"].forEach(nome => {
        const celula = document.createElement("th");
        celula.scope = "col";
        celula.textContent = nome;
        if (colunasCategoricas.includes(nome) || nome === "class") celula.className = "viz-texto";
        cabecalho.appendChild(celula);
    });

    const corpo = tabela.createTBody();
    linhas.forEach(instancia => {
        const tr = corpo.insertRow();
        tr.tabIndex = 0;
        tr.dataset.linha = instancia.linha;
        tr.setAttribute("aria-selected", String(instancia.linha === estado.linhaSelecionada));
        const selecionar = () => selecionarLinha(instancia.linha);
        tr.addEventListener("click", selecionar);
        tr.addEventListener("keydown", evento => {
            if (evento.key === "Enter" || evento.key === " ") { evento.preventDefault(); selecionar(); }
        });

        const celulaLinha = tr.insertCell();
        celulaLinha.textContent = instancia.linha;
        [...nomesDasColunas, "class"].forEach(nome => {
            const celula = tr.insertCell();
            const valor = instancia.valores[COLUNAS.indexOf(nome)];
            celula.textContent = formatarValor(valor);
            if (typeof valor === "string") celula.className = "viz-texto";
            if (nome === "class") celula.classList.add(valor === "anomaly" ? "viz-anomalia" : "viz-normal");
            if (instancia.destaques.includes(nome)) celula.classList.add("viz-destaque");
        });
    });

    document.getElementById("viz-contagem").textContent =
        `${linhas.length} de ${INSTANCIAS.length} instâncias, ${nomesDasColunas.length} de ${COLUNAS.length - 1} atributos (mais a classe).`;

    if (!linhas.some(i => i.linha === estado.linhaSelecionada)) {
        selecionarLinha(linhas.length ? linhas[0].linha : null);
    }
}

function selecionarLinha(numeroDaLinha) {
    estado.linhaSelecionada = numeroDaLinha;
    document.querySelectorAll("#viz-tabela tbody tr").forEach(tr =>
        tr.setAttribute("aria-selected", String(Number(tr.dataset.linha) === numeroDaLinha)));

    const caixa = document.getElementById("viz-motivo");
    caixa.replaceChildren();
    const instancia = INSTANCIAS.find(i => i.linha === numeroDaLinha);
    if (!instancia) return;

    const titulo = document.createElement("h3");
    titulo.textContent = `Por que a linha ${instancia.linha} está aqui`;
    const etiquetas = document.createElement("ul");
    etiquetas.className = "viz-etiquetas";
    instancia.tags.forEach(tag => {
        const item = document.createElement("li");
        item.textContent = ETIQUETA_DA_INSTANCIA[tag];
        etiquetas.appendChild(item);
    });
    const motivo = document.createElement("p");
    motivo.textContent = instancia.motivo;
    caixa.append(titulo, etiquetas, motivo);
}

criarSeletor("seletor-colunas", SELETORES_DE_COLUNAS, "grupoDeColunas", "colunas");
criarSeletor("seletor-instancias", SELETORES_DE_INSTANCIAS, "filtroDeInstancias", "instancias");
mostrarExplicacao("colunas_todas");
desenharTabela();