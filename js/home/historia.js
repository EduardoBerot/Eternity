// Historia na Wiki (19/10/2026): os tres volumes (as Eras) com os livros para
// ler no site e baixar em PDF, e a linha do tempo com os marcos de cada Era.
//
// Os marcos saem dos livros da Primeira e da Segunda Era, escritos pelo
// Fundador (PDFs em docs/historia/, publicados em 20/10/2026, revisados a
// partir das paginas da biblioteca do cla; o texto do leitor fica em
// historia-livros.js). A Terceira Era ainda nao tem livro e
// e escrita agora: no lugar dos marcos, um convite que leva ao Guia (o
// recrutamento), pedido do Fundador. Marco novo e uma linha nesta lista.
//
// `tipo` escolhe o icone; `nicks` vira as cabecas do marco, com link para o
// perfil de quem ainda esta no cla (os outros aparecem sem link). `foto` e a
// data de um print do Fundador daquele momento (20/10/2026, das pastas de
// screenshots de 2018-2021 e 2022-2024 e da pasta do jogo, 2024 em diante): imgs/historia/marcos/<data>.webp e a
// miniatura 16:9 sem a barra de itens, <data>-g.webp o print inteiro.

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
        periodo: '2020 – 2021',
        lema: 'A fundação',
        resumo: 'Da ideia de algo que fosse eterno à cidade, às primeiras guerras e ao longo silêncio que encerrou a era.',
        pdf: './docs/historia/eternity-primeira-era.pdf',
        capa: './imgs/historia/capa-primeira-era.webp',
        livros: 'Sete livros',
    },
    {
        id: 'segunda',
        numero: 'II',
        nome: 'Segunda Era',
        periodo: '2022 – 2024',
        lema: 'A reestruturação',
        resumo: 'A volta, as comunidades que vieram e se foram, a esperança e o Ano da Integridade.',
        pdf: './docs/historia/eternity-segunda-era.pdf',
        capa: './imgs/historia/capa-segunda-era.webp',
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
    { era: 'primeira', data: '2020', titulo: 'A Origem', tipo: 'fundacao', livro: 'I', foto: '2020-07-25', nicks: ['Ducred22'],
      texto: 'Cansado de ver as vilas dos amigos surgirem e ruírem, o fundador entra no Apocalipse decidido a criar algo que fosse eterno.' },
    { era: 'primeira', data: '01/08/2020', titulo: 'Nasce a Eternity', tipo: 'fundacao', livro: 'II', foto: '2020-08-01', nicks: ['Ducred22'],
      texto: 'O clã é fundado com o azul-água como cor e a primeira bandeira. A cidade nasce em estilo moderno, a partir de um parque cercado de ruas.' },
    { era: 'primeira', data: 'Ago 2020', titulo: 'O primeiro recruta', tipo: 'cidade', livro: 'II', foto: '2020-08-20', nicks: ['Zeki', 'Krenzif_Korvat'],
      texto: 'Zeki ergue a terceira casa da cidade. Vêm as primeiras relações diplomáticas, com a TsK, e as primeiras lições sobre as wars.' },
    { era: 'primeira', data: 'Set 2020', titulo: 'A Grande Migração', tipo: 'crise', livro: 'III', foto: '2020-09-13',
      texto: 'Os grandes clãs partem para o Genesis e o Apocalipse esvazia. A Eternity abre as portas a todos e firma seus valores: União, Respeito e Honestidade.' },
    { era: 'primeira', data: 'Fim de 2020', titulo: 'A Primeira Divisão', tipo: 'crise', livro: 'IV', foto: '2020-10-24', nicks: ['nemowtg', 'Shindeiku', 'lucao_br1', 'VRSz'],
      texto: 'O conflito do castelo divide o clã e dá origem à DAS. A liderança é refeita com lucao_br1 e VRSz como sublíderes.' },
    { era: 'primeira', data: 'Dez 2020', titulo: 'O Renascimento', tipo: 'alianca', livro: 'V', foto: '2020-12-29', nicks: ['oPedroSales', 'Emy_Fortune'],
      texto: 'As férias trazem o servidor de volta. Chegam oPedroSales e Emy_Fortune, a NEX vira a primeira grande aliada, a TOP a primeira rival, e surgem a ETYIgreja e a ETYShop.' },
    { era: 'primeira', data: 'Dez 2020', titulo: 'Nasce a ETK', tipo: 'alianca', livro: 'VII', foto: '2021-02-24', nicks: ['DiguinhoLNS'],
      texto: 'Um acordo com DiguinhoLNS cria a ETK, o clã da vila medieval, primeiro membro da família que chamaríamos de Eternidade.' },
    { era: 'primeira', data: 'Jan 2021', titulo: 'O Ápice', tipo: 'lideranca', livro: 'VI', foto: '2021-01-17', nicks: ['blocaonf', 'bloquin11', 'aiZendi', 'artgigante', 'sinagame25', 'XeKeMaTe', 'Sir_Felipee'],
      texto: 'Entra a regra dos 10 dias de inatividade e chega uma geração memorável de membros. Nasce também o Jornal do Apocalipse, em frente à praia da cidade.' },
    { era: 'primeira', data: 'Início de 2021', titulo: 'O primeiro troféu de war', tipo: 'guerra', livro: 'VI', foto: '2020-12-05',
      texto: 'Com as wars do Genesis e do Apocalipse no mesmo horário, a Eternity conquista o seu primeiro troféu. A rivalidade com a TkA chega ao extremo.' },
    { era: 'primeira', data: 'Mar 2021', titulo: 'Os cargos da Eternity', tipo: 'lideranca', livro: 'VI',
      texto: 'Nasce a hierarquia de Dono, Coordenador, Supervisor e Auxiliar: simples e funcional, como é até hoje.' },
    { era: 'primeira', data: '21/08/2021', titulo: 'A Segunda Divisão', tipo: 'guerra', livro: 'VII', foto: '2021-08-22', nicks: ['Haruzinha'],
      texto: 'Unidos uma última vez, os membros vencem a war que passaria a TkA na liga. Logo depois, muitos deixam o clã, e o fundador entende que o fim também faz parte do ciclo.' },
    { era: 'primeira', data: '2021 – 2022', titulo: 'O longo silêncio', tipo: 'crise', livro: 'VII', foto: '2021-08-28',
      texto: 'O clã entra em inatividade, o antigo Discord é apagado e cerca de 40% dos terrenos da cidade se perdem.' },

    // ---------- Segunda Era ----------
    { era: 'segunda', data: '2022', titulo: 'A Reestruturação', tipo: 'fundacao', livro: 'I', foto: '2023-01-30', nicks: ['Ducred22'],
      texto: 'O fundador volta, uma nova bandeira é criada e ergue-se a Torre da Staff, num bioma gélido que inspira a lore do clã. Nasce também um novo Discord.' },
    { era: 'segunda', data: '2022', titulo: 'Nasce a ETZ', tipo: 'alianca', livro: 'II', nicks: ['T14G0865', 'XeKeMaTe'],
      texto: 'A ETZ — Eternal Citizens surge como novo clã da Eternidade. T14G0865 assume como Coordenador e XeKeMaTe como Dono.' },
    { era: 'segunda', data: '2022', titulo: 'O Bunker e os Paladinos', tipo: 'cidade', livro: 'II', foto: '2023-01-17',
      texto: 'Ao redor de um portal do End nasce o ETYBunker, com a galeria dos Paladinos da Segunda Era. A cidade avança ao oeste com o metrô.' },
    { era: 'segunda', data: '2022 – 2023', titulo: 'A comunidade efêmera', tipo: 'crise', livro: 'II', foto: '2023-01-21',
      texto: 'A pequena comunidade desanima da noite para o dia. O fundador também se afasta e passa um ano inteiro longe do jogo.' },
    { era: 'segunda', data: 'Meados de 2023', titulo: 'A Esperança', tipo: 'lideranca', livro: 'III', nicks: ['ov3r5y5t3m'],
      texto: 'Um jogador encantado com a cidade, ov3r5y5t3m, assume o clã vazio. Ao confiar nele por completo, o fundador decide voltar de vez.' },
    { era: 'segunda', data: 'Início de 2024', titulo: 'O Ano da Integridade', tipo: 'lideranca', livro: 'IV', foto: '2024-01-16', nicks: ['XeKeMaTe', 'ov3r5y5t3m', 'Sir_Felipee'],
      texto: 'Recrutamentos em massa, títulos de McMMO e o retorno de nomes da Primeira Era levam o clã a uma ascensão nunca vista.' },
    { era: 'segunda', data: 'Mai 2024', titulo: 'O site da ETY', tipo: 'sistema', livro: 'IV', nicks: ['trogro9'],
      texto: 'Começa o projeto do site da Eternity, para apoiar a organização e as novas mecânicas do clã.' },
    { era: 'segunda', data: 'Abr – jul 2024', titulo: 'As Duas Frentes', tipo: 'guerra', livro: 'V', foto: '2024-04-06',
      texto: 'A HGT domina os torneios e a XOX desafia no PvP. A Eternity reafirma o seu propósito: mais do que vencer, manter uma comunidade ativa.' },
    { era: 'segunda', data: 'Jul 2024', titulo: 'Novos aliados', tipo: 'alianca', livro: 'V', nicks: ['Jiraiya', 'MerpIsHere'],
      texto: 'A HGT se dissolve, Jiraiya e MerpIsHere chegam à Eternity e as alianças com a FUN e a uwu equilibram a disputa com a XOX.' },
    { era: 'segunda', data: '2024', titulo: 'O vácuo de rival', tipo: 'sistema', livro: 'VI', foto: '2024-09-03', nicks: ['DMonte1122', 'Coxiinha'],
      texto: 'Pódios passam a render 50% a mais, nasce o canal do clã no YouTube, a XOX cai por trapaça e começa a praça da Eternity no Genesis.' },
    { era: 'segunda', data: 'Out 2024', titulo: 'As alianças se rompem', tipo: 'crise', livro: 'VI', nicks: ['Zixul'],
      texto: 'Em pouco tempo, uwu, ETK e FUN rompem com a Eternity, e a ETK é debandada.' },
    { era: 'segunda', data: 'Fim de 2024', titulo: 'O primeiro Heika', tipo: 'lideranca', livro: 'VII', foto: '2024-11-16', nicks: ['Sir_Felipee'],
      texto: 'Nascem os cargos de PvP, e Sir_Felipee se torna o primeiro Heika, a quem passam as decisões sobre alianças e rivalidades.' },
    { era: 'segunda', data: '31/12/2024', titulo: 'O fim planejado', tipo: 'fundacao', livro: 'VII', foto: '2024-12-28',
      texto: 'Pela primeira vez, uma era termina sem inatividade: o Ano da Integridade fecha a Segunda Era, o primeiro ano em que o clã jogou todos os meses.' },
];

// A capa dos volumes com livro e a primeira pagina do PDF; a da Terceira Era,
// sem livro, e desenhada em CSS no mesmo estilo.
function historiaCapaHtml(era) {
    if (era.capa) {
        return `
        <button type="button" class="hist-capa-botao" onclick="abrirLeitorHistoria('${era.id}')" aria-label="Ler a ${escHtml(era.nome)}">
            <img class="hist-capa hist-capa-img" src="${era.capa}" alt="" width="300" height="425" loading="lazy">
        </button>`;
    }
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
        ? `<button type="button" class="hist-botao hist-botao-cheio" data-ler="${era.id}" onclick="abrirLeitorHistoria('${era.id}')"><i class="fa-solid fa-book-open" aria-hidden="true"></i><span>Ler no site</span></button>
           <a class="hist-botao" href="${era.pdf}" download><i class="fa-solid fa-download" aria-hidden="true"></i>PDF</a>`
        : '<span class="hist-em-breve"><i class="fa-solid fa-feather-pointed" aria-hidden="true"></i>Em breve</span>';
    const livro = HISTORIA_LIVROS[era.id];
    const sumario = livro ? `
                <details class="hist-sumario">
                    <summary><i class="fa-solid fa-list-ul" aria-hidden="true"></i>Sumário</summary>
                    <ol>${livro.capitulos.map((cap, i) => `
                        <li><button type="button" onclick="abrirLeitorHistoria('${era.id}', ${i})"><span>${cap.livro}</span>${escHtml(cap.titulo)}</button></li>`).join('')}
                    </ol>
                </details>` : '';
    return `
        <article class="hist-volume">
            ${historiaCapaHtml(era)}
            <div class="hist-volume-texto">
                <span class="hist-volume-num">Volume ${era.numero} · ${livro ? `${livro.paginas} páginas` : escHtml(era.livros)}</span>
                <h3>${escHtml(era.nome)}</h3>
                <p class="hist-volume-lema">${escHtml(era.lema)} · ${escHtml(era.periodo)}</p>
                <p>${escHtml(era.resumo)}</p>
                ${sumario}
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
    const capitulo = (HISTORIA_LIVROS[era.id]?.capitulos || []).findIndex(cap => cap.livro === marco.livro);
    const livro = capitulo >= 0
        ? `<button type="button" class="hist-livro" onclick="abrirLeitorHistoria('${era.id}', ${capitulo})" title="Ler o Livro ${marco.livro}"><i class="fa-solid fa-book" aria-hidden="true"></i>Livro ${marco.livro}</button>`
        : '';
    const foto = marco.foto ? `
                <button type="button" class="hist-foto" onclick="abrirFotoHistoria(this)" data-foto="${marco.foto}" data-titulo="${escHtml(marco.titulo)}" aria-label="Ampliar o print de ${escHtml(marco.titulo)}">
                    <img src="./imgs/historia/marcos/${marco.foto}.webp" alt="" width="720" height="405" loading="lazy">
                    <span><i class="fa-solid fa-camera" aria-hidden="true"></i>${historiaDataFoto(marco.foto)}</span>
                </button>` : '';
    return `
        <li class="hist-marco hist-tipo-${marco.tipo}${marco.foto ? ' com-foto' : ''}">
            <span class="hist-ponto" title="${escHtml(tipo.nome)}"><i class="fa-solid ${tipo.icone}" aria-hidden="true"></i></span>
            <div class="hist-cartao">${foto}
                <time class="hist-data">${escHtml(marco.data)}</time>
                <h4>${escHtml(marco.titulo)}</h4>
                <p>${escHtml(marco.texto)}</p>
                ${rostos || livro ? `<div class="hist-rodape"><div class="hist-rostos">${rostos}</div>${livro}</div>` : ''}
            </div>
        </li>`;
}

function historiaDataFoto(data) {
    return data.split('-').reverse().join('/');
}

// O print ampliado: o arquivo inteiro (com o chat e a barra do jogo), num
// <dialog> que fecha com qualquer clique.
function abrirFotoHistoria(botao) {
    let dialogo = document.getElementById('hist-foto-dialog');
    if (!dialogo) {
        dialogo = document.createElement('dialog');
        dialogo.id = 'hist-foto-dialog';
        dialogo.className = 'hist-foto-dialog';
        dialogo.addEventListener('click', () => dialogo.close());
        document.body.append(dialogo);
    }
    const { foto, titulo } = botao.dataset;
    dialogo.innerHTML = `
        <figure>
            <img src="./imgs/historia/marcos/${foto}-g.webp" alt="${escHtml(titulo)}">
            <figcaption><b>${escHtml(titulo)}</b> · print de ${historiaDataFoto(foto)}</figcaption>
        </figure>
        <button type="button" class="hist-foto-fechar" aria-label="Fechar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>`;
    dialogo.showModal();
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
                <p class="texto">Desde 1º de agosto de 2020, a Eternity atravessou três eras. As duas primeiras foram contadas pelo fundador em livros que ficam na biblioteca do clã, no <code>/go ETYHistoria</code>, e agora também podem ser lidos aqui, livro a livro, ou baixados em PDF.</p>
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

// Leitor dos livros (20/10/2026): um livro (capitulo) por vez num <dialog>,
// na fonte dos PDFs. O texto vem de HISTORIA_LIVROS porque o PDF embutido nao
// abre no celular (o Chrome do Android so baixa); o PDF fica para baixar. O
// ultimo livro aberto e o tamanho da letra ficam guardados no aparelho, e
// #historia?ler=segunda-4 abre direto o Livro IV da Segunda Era.
const HISTORIA_CHAVE_LEITURA = 'eternity-historia-leitura';
const HISTORIA_CHAVE_LETRA = 'eternity-historia-letra';
const HISTORIA_LETRAS = ['media', 'grande', 'pequena'];

// Os livros das duas Eras em sequencia, para o "proximo" atravessar de uma
// Era para a outra.
function historiaSequencia() {
    return Object.keys(HISTORIA_LIVROS).flatMap(era => HISTORIA_LIVROS[era].capitulos.map((_, i) => ({ era, i })));
}

function historiaGuardado(chave) {
    try { return JSON.parse(localStorage.getItem(chave)); } catch { return null; }
}

function historiaGuardar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem storage */ }
}

function leitorHistoria() {
    let dialogo = document.getElementById('hist-leitor');
    if (dialogo) return dialogo;
    dialogo = document.createElement('dialog');
    dialogo.id = 'hist-leitor';
    dialogo.className = 'hist-leitor';
    dialogo.setAttribute('aria-labelledby', 'hist-leitor-titulo');
    dialogo.dataset.letra = historiaGuardado(HISTORIA_CHAVE_LETRA) || 'media';
    // Clique no fundo escurecido fecha (o alvo e o proprio <dialog>).
    dialogo.addEventListener('click', event => { if (event.target === dialogo) dialogo.close(); });
    dialogo.addEventListener('keydown', event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === 'ArrowRight') passoLeitorHistoria(1);
        else if (event.key === 'ArrowLeft') passoLeitorHistoria(-1);
    });
    dialogo.addEventListener('close', marcarLeituraHistoria);
    document.body.append(dialogo);
    return dialogo;
}

function abrirLeitorHistoria(era, indice) {
    if (!HISTORIA_LIVROS[era]) return;
    if (indice === undefined) {
        const guardada = historiaGuardado(HISTORIA_CHAVE_LEITURA);
        indice = guardada?.era === era ? guardada.i : 0;
    }
    const dialogo = leitorHistoria();
    mostrarLivroHistoria(era, indice);
    if (!dialogo.open) dialogo.showModal();
    // O showModal foca o primeiro botao; o foco volta para o texto.
    dialogo.querySelector('.hist-leitor-corpo').focus({ preventScroll: true });
}

function passoLeitorHistoria(delta) {
    const dialogo = document.getElementById('hist-leitor');
    if (!dialogo?.open) return;
    const sequencia = historiaSequencia();
    const atual = sequencia.findIndex(pos => pos.era === dialogo.dataset.era && pos.i === Number(dialogo.dataset.livro));
    const destino = sequencia[atual + delta];
    if (destino) mostrarLivroHistoria(destino.era, destino.i);
}

function trocarLetraHistoria() {
    const dialogo = leitorHistoria();
    const proxima = HISTORIA_LETRAS[(HISTORIA_LETRAS.indexOf(dialogo.dataset.letra) + 1) % HISTORIA_LETRAS.length];
    dialogo.dataset.letra = proxima;
    historiaGuardar(HISTORIA_CHAVE_LETRA, proxima);
}

function historiaPassoHtml(pos, lado) {
    const era = HISTORIA_ERAS.find(e => e.id === pos.era);
    const cap = HISTORIA_LIVROS[pos.era].capitulos[pos.i];
    const icone = lado === 'anterior' ? 'fa-arrow-left' : 'fa-arrow-right';
    return `
        <button type="button" class="hist-leitor-passo ${lado}" onclick="passoLeitorHistoria(${lado === 'anterior' ? -1 : 1})">
            <small><i class="fa-solid ${icone}" aria-hidden="true"></i>${escHtml(era.nome)} · Livro ${cap.livro}</small>
            <span>${escHtml(cap.titulo)}</span>
        </button>`;
}

function mostrarLivroHistoria(era, indice) {
    const dialogo = leitorHistoria();
    const livro = HISTORIA_LIVROS[era];
    const i = Math.min(Math.max(0, Number(indice) || 0), livro.capitulos.length - 1);
    const cap = livro.capitulos[i];
    const dadosEra = HISTORIA_ERAS.find(e => e.id === era);
    const sequencia = historiaSequencia();
    const posicao = sequencia.findIndex(pos => pos.era === era && pos.i === i);
    const anterior = sequencia[posicao - 1];
    const proximo = sequencia[posicao + 1];
    const ultimoDaEra = i === livro.capitulos.length - 1;
    dialogo.dataset.era = era;
    dialogo.dataset.livro = i;
    historiaGuardar(HISTORIA_CHAVE_LEITURA, { era, i });

    const sumario = Object.keys(HISTORIA_LIVROS).map(id => `
        <div>
            <strong>${escHtml(HISTORIA_ERAS.find(e => e.id === id).nome)}</strong>
            <ol>${HISTORIA_LIVROS[id].capitulos.map((c, n) => `
                <li><button type="button" onclick="mostrarLivroHistoria('${id}', ${n})"${id === era && n === i ? ' aria-current="true"' : ''}><span>${c.livro}</span>${escHtml(c.titulo)}</button></li>`).join('')}
            </ol>
        </div>`).join('');
    // Depois do ultimo livro da Segunda Era, o convite da Terceira, como na linha do tempo.
    const seguinte = proximo
        ? historiaPassoHtml(proximo, 'proximo')
        : `<a class="hist-leitor-passo proximo hist-leitor-terceira" href="#guia" onclick="document.getElementById('hist-leitor').close()">
               <small><i class="fa-solid fa-feather-pointed" aria-hidden="true"></i>Terceira Era · em escrita</small>
               <span>Faça parte da história</span>
           </a>`;

    dialogo.innerHTML = `
        <div class="hist-leitor-topo">
            <div class="hist-leitor-onde">
                <span>${escHtml(dadosEra.nome)}</span>
                <b>Livro ${cap.livro} de ${livro.capitulos.at(-1).livro}</b>
            </div>
            <div class="hist-leitor-ferramentas">
                <button type="button" onclick="trocarLetraHistoria()" title="Tamanho da letra" aria-label="Tamanho da letra"><i class="fa-solid fa-text-height" aria-hidden="true"></i></button>
                <a href="${dadosEra.pdf}" download title="Baixar o PDF" aria-label="Baixar o PDF"><i class="fa-solid fa-download" aria-hidden="true"></i></a>
                <button type="button" onclick="document.getElementById('hist-leitor').close()" title="Fechar" aria-label="Fechar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            </div>
            <span class="hist-leitor-progresso" aria-hidden="true"><span></span></span>
        </div>
        <div class="hist-leitor-corpo" tabindex="-1">
            <details class="hist-leitor-sumario">
                <summary><i class="fa-solid fa-list-ul" aria-hidden="true"></i>Sumário</summary>
                <div class="hist-leitor-sumario-eras">${sumario}</div>
            </details>
            <article class="hist-leitor-texto" lang="pt-BR">
                <header>
                    <span class="hist-leitor-livro">Livro ${cap.livro}</span>
                    <h2 id="hist-leitor-titulo">${escHtml(cap.titulo)}</h2>
                    <span class="hist-leitor-ornamento" aria-hidden="true">◆</span>
                </header>
                ${cap.paragrafos.map(p => `<p>${escHtml(p)}</p>`).join('')}
                ${ultimoDaEra ? `<p class="hist-leitor-fim">◆ Fim da ${escHtml(dadosEra.nome)} ◆</p>` : ''}
            </article>
            <nav class="hist-leitor-passos" aria-label="Outros livros">
                ${anterior ? historiaPassoHtml(anterior, 'anterior') : '<span></span>'}
                ${seguinte}
            </nav>
        </div>`;

    // A barra fina embaixo do topo acompanha a leitura do livro aberto.
    const corpo = dialogo.querySelector('.hist-leitor-corpo');
    const barra = dialogo.querySelector('.hist-leitor-progresso span');
    corpo.addEventListener('scroll', () => {
        const total = corpo.scrollHeight - corpo.clientHeight;
        barra.style.width = `${total > 0 ? Math.min(100, (corpo.scrollTop / total) * 100) : 100}%`;
    }, { passive: true });
    // O foco vai para o texto: as setas do teclado rolam e trocam de livro.
    corpo.focus({ preventScroll: true });
}

// O botao "Ler no site" do volume vira "Continuar" no livro onde a pessoa parou.
function marcarLeituraHistoria() {
    const guardada = historiaGuardado(HISTORIA_CHAVE_LEITURA);
    for (const botao of document.querySelectorAll('#wiki-historia [data-ler]')) {
        const cap = guardada?.era === botao.dataset.ler && guardada.i > 0
            ? HISTORIA_LIVROS[guardada.era]?.capitulos[guardada.i]
            : null;
        botao.querySelector('span').textContent = cap ? `Continuar · Livro ${cap.livro}` : 'Ler no site';
    }
}

// Chamado pelo renderWiki depois de montar a pagina.
function iniciarHistoria() {
    acenderMarcosHistoria();
    marcarLeituraHistoria();
    const pedido = new URLSearchParams(location.hash.split('?')[1] || '').get('ler');
    const [, era, livro] = /^(primeira|segunda)(?:-(\d))?$/.exec(pedido || '') || [];
    if (era) abrirLeitorHistoria(era, livro ? Number(livro) - 1 : 0);
}

// Trocar de pagina (inclusive pelo voltar do celular) fecha o leitor. Este
// ouvinte roda depois do route() (index.js carrega antes), entao poupa o
// leitor que o proprio link ?ler= acabou de abrir.
window.addEventListener('hashchange', () => {
    if (!/[?&]ler=/.test(location.hash)) document.getElementById('hist-leitor')?.close();
});
