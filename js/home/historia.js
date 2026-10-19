// Historia na Wiki (19/10/2026): os tres volumes (as Eras) com os livros em
// PDF para ler e baixar, e a linha do tempo com os marcos de cada Era.
//
// Os marcos saem dos livros da Primeira e da Segunda Era, escritos pelo
// Fundador (PDFs em docs/historia/, revisados a partir das paginas da
// biblioteca do cla). A Terceira Era ainda nao tem livro e
// e escrita agora: no lugar dos marcos, um convite que leva ao Guia (o
// recrutamento), pedido do Fundador. Marco novo e uma linha nesta lista.
//
// `tipo` escolhe o icone; `nicks` vira as cabecas do marco, com link para o
// perfil de quem ainda esta no cla (os outros aparecem sem link).

const HISTORIA_TIPOS = {
    fundacao: { icone: 'fa-landmark', nome: 'Fundação' },
    cidade: { icone: 'fa-city', nome: 'Cidade' },
    guerra: { icone: 'fa-khanda', nome: 'Guerras e rivais' },
    alianca: { icone: 'fa-handshake', nome: 'Alianças' },
    lideranca: { icone: 'fa-crown', nome: 'Liderança' },
    crise: { icone: 'fa-moon', nome: 'Crises e hiatos' },
    sistema: { icone: 'fa-gears', nome: 'Sistemas' },
};

const HISTORIA_ERAS = [
    {
        id: 'primeira',
        numero: 'I',
        nome: 'Primeira Era',
        periodo: '2020 – 2022',
        lema: 'A fundação',
        resumo: 'Da ideia de algo que fosse eterno à cidade, às primeiras guerras e ao longo silêncio que encerrou a era.',
        // PDF ainda em revisao pelo Fundador (19/10/2026): entra em docs/historia/.
        pdf: null,
        livros: 'Sete livros',
    },
    {
        id: 'segunda',
        numero: 'II',
        nome: 'Segunda Era',
        periodo: '2022 – 2024',
        lema: 'A reestruturação',
        resumo: 'A volta, as comunidades que vieram e se foram, a esperança e o Ano da Integridade.',
        pdf: null,
        livros: 'Sete livros',
    },
    {
        id: 'terceira',
        numero: 'III',
        nome: 'Terceira Era',
        periodo: '2025 – hoje',
        lema: 'Em escrita',
        resumo: 'A era que estamos vivendo, e que ainda está sendo escrita por quem joga hoje.',
        pdf: null,
        gancho: true,
        livros: 'Livro em escrita',
    },
];

const HISTORIA_MARCOS = [
    // ---------- Primeira Era ----------
    { era: 'primeira', data: '2020', titulo: 'A Origem', tipo: 'fundacao', livro: 'I', nicks: ['Ducred22'],
      texto: 'Cansado de ver as vilas dos amigos surgirem e ruírem, o fundador entra no Apocalipse decidido a criar algo que fosse eterno.' },
    { era: 'primeira', data: '01/08/2020', titulo: 'Nasce a Eternity', tipo: 'fundacao', livro: 'II', nicks: ['Ducred22'],
      texto: 'O clã é fundado com o azul-água como cor e a primeira bandeira. A cidade nasce em estilo moderno, a partir de um parque cercado de ruas.' },
    { era: 'primeira', data: 'Ago 2020', titulo: 'O primeiro recruta', tipo: 'cidade', livro: 'II', nicks: ['Zeki', 'Krenzif_Korvat'],
      texto: 'Zeki ergue a terceira casa da cidade. Vêm as primeiras relações diplomáticas, com a TsK, e as primeiras lições sobre as wars.' },
    { era: 'primeira', data: 'Set 2020', titulo: 'A Grande Migração', tipo: 'crise', livro: 'III',
      texto: 'Os grandes clãs partem para o Genesis e o Apocalipse esvazia. A Eternity abre as portas a todos e firma seus valores: União, Respeito e Honestidade.' },
    { era: 'primeira', data: 'Fim de 2020', titulo: 'A Primeira Divisão', tipo: 'crise', livro: 'IV', nicks: ['nemoutg', 'Shindeiku', 'lucao_br1', 'VR5z'],
      texto: 'O conflito do castelo divide o clã e dá origem à DAS. A liderança é refeita com lucao_br1 e VR5z como sublíderes.' },
    { era: 'primeira', data: 'Dez 2020', titulo: 'O Renascimento', tipo: 'alianca', livro: 'V', nicks: ['oPedroSales', 'Emy_Fortune'],
      texto: 'As férias trazem o servidor de volta. Chegam oPedroSales e Emy_Fortune, a NEX vira a primeira grande aliada, a TOP a primeira rival, e surgem a ETYIgreja e a ETYShop.' },
    { era: 'primeira', data: 'Dez 2020', titulo: 'Nasce a ETK', tipo: 'alianca', livro: 'VII', nicks: ['DiguinhoLNS'],
      texto: 'Um acordo com DiguinhoLNS cria a ETK, o clã da vila medieval, primeiro membro da família que chamaríamos de Eternidade.' },
    { era: 'primeira', data: 'Jan 2021', titulo: 'O Ápice', tipo: 'lideranca', livro: 'VI', nicks: ['blocaonf', 'bloquin11', 'aiZendi', 'artgigante', 'sinagame25', 'XeKeMaTe', 'Sir_Felipee'],
      texto: 'Entra a regra dos 10 dias de inatividade e chega uma geração memorável de membros. Nasce também o Jornal do Apocalipse, em frente à praia da cidade.' },
    { era: 'primeira', data: 'Início de 2021', titulo: 'O primeiro troféu de war', tipo: 'guerra', livro: 'VI',
      texto: 'Com as wars do Genesis e do Apocalipse no mesmo horário, a Eternity conquista o seu primeiro troféu. A rivalidade com a TkA chega ao extremo.' },
    { era: 'primeira', data: 'Mar 2021', titulo: 'Os cargos da Eternity', tipo: 'lideranca', livro: 'VI',
      texto: 'Nasce a hierarquia de Dono, Coordenador, Supervisor e Auxiliar: simples e funcional, como é até hoje.' },
    { era: 'primeira', data: '21/08/2021', titulo: 'A Segunda Divisão', tipo: 'guerra', livro: 'VII', nicks: ['Haruzinha'],
      texto: 'Unidos uma última vez, os membros vencem a war que passaria a TkA na liga. Logo depois, muitos deixam o clã, e o fundador entende que o fim também faz parte do ciclo.' },
    { era: 'primeira', data: '2021 – 2022', titulo: 'O longo silêncio', tipo: 'crise', livro: 'VII',
      texto: 'O clã entra em inatividade, o antigo Discord é apagado e cerca de 40% dos terrenos da cidade se perdem.' },

    // ---------- Segunda Era ----------
    { era: 'segunda', data: '2022', titulo: 'A Reestruturação', tipo: 'fundacao', livro: 'I', nicks: ['Ducred22'],
      texto: 'O fundador volta, uma nova bandeira é criada e ergue-se a Torre da Staff, num bioma gélido que inspira a lore do clã. Nasce também um novo Discord.' },
    { era: 'segunda', data: '2022', titulo: 'Nasce a ETZ', tipo: 'alianca', livro: 'II', nicks: ['T14G0865', 'XeKeMaTe'],
      texto: 'A ETZ — Eternal Citizens surge como novo clã da Eternidade. T14G0865 assume como Coordenador e XeKeMaTe como Dono.' },
    { era: 'segunda', data: '2022', titulo: 'O Bunker e os Paladinos', tipo: 'cidade', livro: 'II',
      texto: 'Ao redor de um portal do End nasce o ETYBunker, com a galeria dos Paladinos da Segunda Era. A cidade avança ao oeste com o metrô.' },
    { era: 'segunda', data: '2022 – 2023', titulo: 'A comunidade efêmera', tipo: 'crise', livro: 'II',
      texto: 'A pequena comunidade desanima da noite para o dia. O fundador também se afasta e passa um ano inteiro longe do jogo.' },
    { era: 'segunda', data: 'Meados de 2023', titulo: 'A Esperança', tipo: 'lideranca', livro: 'III', nicks: ['ov3r5y5t3m'],
      texto: 'Um jogador encantado com a cidade, ov3r5y5t3m, assume o clã vazio. Ao confiar nele por completo, o fundador decide voltar de vez.' },
    { era: 'segunda', data: 'Início de 2024', titulo: 'O Ano da Integridade', tipo: 'lideranca', livro: 'IV', nicks: ['XeKeMaTe', 'ov3r5y5t3m', 'Sir_Felipee'],
      texto: 'Recrutamentos em massa, títulos de McMMO e o retorno de nomes da Primeira Era levam o clã a uma ascensão nunca vista.' },
    { era: 'segunda', data: 'Mai 2024', titulo: 'O site da ETY', tipo: 'sistema', livro: 'IV', nicks: ['trogro9'],
      texto: 'Começa o projeto do site da Eternity, para apoiar a organização e as novas mecânicas do clã.' },
    { era: 'segunda', data: 'Abr – jul 2024', titulo: 'As Duas Frentes', tipo: 'guerra', livro: 'V',
      texto: 'A HGT domina os torneios e a XOX desafia no PvP. A Eternity reafirma o seu propósito: mais do que vencer, manter uma comunidade ativa.' },
    { era: 'segunda', data: 'Jul 2024', titulo: 'Novos aliados', tipo: 'alianca', livro: 'V', nicks: ['Jiraiya', 'MerpIsHere'],
      texto: 'A HGT se dissolve, Jiraiya e MerpIsHere chegam à Eternity e as alianças com a FUN e a uwu equilibram a disputa com a XOX.' },
    { era: 'segunda', data: '2024', titulo: 'O vácuo de rival', tipo: 'sistema', livro: 'VI', nicks: ['DMonte1122', 'Coxiinha'],
      texto: 'Pódios passam a render 50% a mais, nasce o canal do clã no YouTube, a XOX cai por trapaça e começa a praça da Eternity no Genesis.' },
    { era: 'segunda', data: 'Out 2024', titulo: 'As alianças se rompem', tipo: 'crise', livro: 'VI', nicks: ['Zixul'],
      texto: 'Em pouco tempo, uwu, ETK e FUN rompem com a Eternity, e a ETK é debandada.' },
    { era: 'segunda', data: 'Fim de 2024', titulo: 'O primeiro Heika', tipo: 'lideranca', livro: 'VII', nicks: ['Sir_Felipee'],
      texto: 'Nascem os cargos de PvP, e Sir_Felipee se torna o primeiro Heika, a quem passam as decisões sobre alianças e rivalidades.' },
    { era: 'segunda', data: '31/12/2024', titulo: 'O fim planejado', tipo: 'fundacao', livro: 'VII',
      texto: 'Pela primeira vez, uma era termina sem inatividade: o Ano da Integridade fecha a Segunda Era, o primeiro ano em que o clã jogou todos os meses.' },
];

function historiaCapaHtml(era) {
    return `
        <div class="hist-capa hist-capa-${era.id}" aria-hidden="true">
            <span class="hist-capa-selo">ETY</span>
            <span class="hist-capa-titulo">ETERNITY</span>
            <span class="hist-capa-era">${escHtml(era.nome)}</span>
            <span class="hist-capa-linha"></span>
            <span class="hist-capa-periodo">${escHtml(era.periodo)}</span>
        </div>`;
}

function historiaVolumeHtml(era) {
    const acoes = era.gancho
        ? '<a class="hist-botao hist-botao-cheio" href="#guia"><i class="fa-solid fa-feather-pointed" aria-hidden="true"></i>Faça parte</a>'
        : era.pdf
        ? `<a class="hist-botao" href="${era.pdf}" target="_blank" rel="noopener"><i class="fa-solid fa-book-open" aria-hidden="true"></i>Ler</a>
           <a class="hist-botao hist-botao-cheio" href="${era.pdf}" download><i class="fa-solid fa-download" aria-hidden="true"></i>Baixar PDF</a>`
        : '<span class="hist-em-breve"><i class="fa-solid fa-feather-pointed" aria-hidden="true"></i>Em breve</span>';
    return `
        <article class="hist-volume">
            ${historiaCapaHtml(era)}
            <div class="hist-volume-texto">
                <span class="hist-volume-num">Volume ${era.numero} · ${escHtml(era.livros)}</span>
                <h3>${escHtml(era.nome)}</h3>
                <p class="hist-volume-lema">${escHtml(era.lema)} · ${escHtml(era.periodo)}</p>
                <p>${escHtml(era.resumo)}</p>
                <div class="hist-acoes">${acoes}</div>
            </div>
        </article>`;
}

function historiaMarcoHtml(marco, era) {
    const tipo = HISTORIA_TIPOS[marco.tipo] || HISTORIA_TIPOS.fundacao;
    const rostos = (marco.nicks || []).map(nick => `
        <span class="hist-rosto" data-nick="${escHtml(nick)}" title="${escHtml(nick)}">
            <img src="https://mc-heads.net/avatar/${encodeURIComponent(nick)}/24" alt="" loading="lazy">${escHtml(nick)}
        </span>`).join('');
    const livro = marco.livro && era.pdf
        ? `<a class="hist-livro" href="${era.pdf}" target="_blank" rel="noopener"><i class="fa-solid fa-book" aria-hidden="true"></i>Livro ${marco.livro}</a>`
        : '';
    return `
        <li class="hist-marco hist-tipo-${marco.tipo}">
            <span class="hist-ponto" title="${escHtml(tipo.nome)}"><i class="fa-solid ${tipo.icone}" aria-hidden="true"></i></span>
            <div class="hist-cartao">
                <time class="hist-data">${escHtml(marco.data)}</time>
                <h4>${escHtml(marco.titulo)}</h4>
                <p>${escHtml(marco.texto)}</p>
                ${rostos || livro ? `<div class="hist-rodape"><div class="hist-rostos">${rostos}</div>${livro}</div>` : ''}
            </div>
        </li>`;
}

// A era em aberto: convite para entrar na historia pelo recrutamento.
function historiaGanchoHtml() {
    return `
        <div class="hist-gancho">
            <span class="hist-gancho-icone"><i class="fa-solid fa-feather-pointed" aria-hidden="true"></i></span>
            <h4>Esta era está sendo escrita agora</h4>
            <p>A Terceira Era começou em 1º de janeiro de 2025, com uma nova bandeira, os valores de <b>União, Justiça e Honestidade</b> e as primeiras obras da Nova Eternity. Ela ainda não tem livro: os próximos capítulos serão contados por quem está jogando hoje, e o seu nome pode estar neles.</p>
            <a class="hist-botao hist-botao-cheio" href="#guia"><i class="fa-solid fa-feather-pointed" aria-hidden="true"></i>Faça parte da história</a>
        </div>`;
}

function historiaWikiHtml() {
    const legenda = Object.values(HISTORIA_TIPOS).map(tipo => `
        <span><i class="fa-solid ${tipo.icone}" aria-hidden="true"></i>${tipo.nome}</span>`).join('');
    const eras = HISTORIA_ERAS.map(era => `
        <section class="hist-era hist-era-${era.id}" aria-label="${escHtml(era.nome)}">
            <header class="hist-era-cabeca">
                <span class="hist-era-num">${era.numero}</span>
                <div><strong>${escHtml(era.nome)}</strong><span>${escHtml(era.periodo)} · ${escHtml(era.lema)}</span></div>
            </header>
            ${era.gancho ? historiaGanchoHtml() : `<ol class="hist-linha">${HISTORIA_MARCOS.filter(marco => marco.era === era.id).map(marco => historiaMarcoHtml(marco, era)).join('')}</ol>`}
        </section>`).join('');
    return `
        <section class="secao-wiki" id="wiki-historia">
            <div class="miolo">
                <h2>História</h2>
                <p class="texto">Desde 1º de agosto de 2020, a Eternity atravessou três eras. As duas primeiras foram contadas pelo fundador em livros que ficam na biblioteca do clã, no <code>/go ETYHistoria</code>${HISTORIA_ERAS.some(era => era.pdf) ? ', e que você pode ler ou baixar aqui' : '; em breve, eles também poderão ser lidos aqui'}.</p>
                <div class="hist-volumes">${HISTORIA_ERAS.map(historiaVolumeHtml).join('')}</div>
                <div class="hist-legenda" aria-label="Tipos de marco">${legenda}</div>
                <div class="hist-tempo">${eras}</div>
            </div>
        </section>`;
}

// Quem ainda esta no cla ganha link para o perfil; os outros ficam so com a cabeca.
function preencherRostosHistoria(membros) {
    const ativos = new Map((membros || []).map(m => [String(m.nick || '').toLowerCase(), m.nick]));
    for (const rosto of document.querySelectorAll('#wiki-historia .hist-rosto')) {
        const nick = ativos.get(String(rosto.dataset.nick || '').toLowerCase());
        if (!nick) continue;
        const link = document.createElement('a');
        link.className = 'hist-rosto ativo';
        link.href = `#membros?membro=${encodeURIComponent(nick)}`;
        link.title = `${nick} · ver perfil`;
        link.innerHTML = rosto.innerHTML;
        rosto.replaceWith(link);
    }
}

// Os pontos acendem quando o marco entra na tela. Sem IntersectionObserver ou
// com "reduzir movimento", ja aparecem acesos.
let historiaObservador = null;

function acenderMarcosHistoria() {
    historiaObservador?.disconnect();
    const marcos = document.querySelectorAll('#wiki-historia .hist-marco');
    const parado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (parado || !('IntersectionObserver' in window)) {
        marcos.forEach(marco => marco.classList.add('aceso'));
        return;
    }
    historiaObservador = new IntersectionObserver(entradas => {
        for (const entrada of entradas) {
            if (!entrada.isIntersecting) continue;
            entrada.target.classList.add('aceso');
            historiaObservador.unobserve(entrada.target);
        }
    }, { rootMargin: '0px 0px -12% 0px' });
    marcos.forEach(marco => historiaObservador.observe(marco));
}
