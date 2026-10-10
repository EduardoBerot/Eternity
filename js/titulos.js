// Catalogo dos titulos do cla (09/10/2026), comum a Wiki (js/home/wiki.js) e
// a janela do membro (js/home/membros.js). Espelha o titles.js e o
// clan-titles.js do bot: mesmos nomes e o mesmo degrade de cada familia. O
// icone e o nivel ficam no catalogo para a ordem, mas o site mostra so o
// degrade.
//
// Cada familia e um trio. Nas escadas (`escada: true`) vale so o nivel mais
// alto; nas outras os tres sao tipos diferentes, cada um com o seu icone.

const TITULOS_CATEGORIAS = [
    {
        id: 'mcmmo',
        nome: 'mcMMO',
        icone: 'fa-hand-fist',
        texto: 'Skills no nível máximo, o poder somado e o topo do clã.',
        familias: [
            { grupo: 'armas', de: '#03f0ee', ate: '#090de7', titulos: [
                { nome: 'Vanguarda', icone: '⚔', requisito: 'Nível 100 em Espada, Machado, Clava ou Lança' },
                { nome: 'Atirador', fem: 'Atiradora', icone: '➶', requisito: 'Nível 100 em uma skill de arremesso: Arquearia, Besta ou Tridente' },
                { nome: 'Farmer', icone: '✿', requisito: 'Nível 100 em uma skill de farm' },
            ] },
            { grupo: 'maestria', de: '#0101fa', ate: '#f80402', titulos: [
                { nome: 'Mercenário', fem: 'Mercenária', icone: '☠', requisito: 'Todas as skills de PvP em 100' },
                { nome: 'Pacifista', icone: '☮', requisito: 'Todas as skills de farm em 100' },
                { nome: 'Onipotente', icone: '✪', requisito: 'Todo o mcMMO em 100', nivel: 3 },
            ] },
            { grupo: 'poder', de: '#fc0100', ate: '#9b2015', escada: true, icone: '✦', titulos: [
                { nome: 'Iniciado', fem: 'Iniciada', requisito: '500 de poder' },
                { nome: 'Ascendente', requisito: '1.500 de poder' },
                { nome: 'Experiente', requisito: '3.000 de poder' },
            ] },
            { grupo: 'poder-top', de: '#db0503', ate: '#eb0c8a', escada: true, posicao: true, icone: '♛', titulos: [
                { nome: 'Veterano', fem: 'Veterana', requisito: 'Top 3 de poder do clã' },
                { nome: 'Lendário', fem: 'Lendária', requisito: 'Top 2 de poder do clã' },
                { nome: 'Mestre', fem: 'Mestra', requisito: 'Top 1 de poder do clã' },
            ] },
        ],
    },
    {
        id: 'desafios',
        nome: 'Desafios',
        icone: 'fa-fire',
        texto: 'A ofensiva dos Dias de Domínio e os dias com todos os desafios completos.',
        familias: [
            { grupo: 'ofensiva', de: '#ff0000', ate: '#fbff00', escada: true, posicao: true, icone: '♨', titulos: [
                { nome: 'Incendiário', fem: 'Incendiária', requisito: '30 dias de ofensiva ativa' },
                { nome: 'Piromaníaco', fem: 'Piromaníaca', requisito: '60 dias de ofensiva ativa' },
                { nome: 'Fênix', requisito: '120 dias de ofensiva ativa' },
            ] },
            { grupo: 'desafios', de: '#04eae7', ate: '#da771d', escada: true, icone: '⚡', titulos: [
                { nome: 'Persistente', requisito: '30 dias com todos os desafios completos' },
                { nome: 'Obstinado', fem: 'Obstinada', requisito: '60 dias com todos os desafios completos' },
                { nome: 'Implacável', requisito: '120 dias com todos os desafios completos' },
            ] },
        ],
    },
    {
        id: 'torneio',
        nome: 'Torneio e Liga',
        icone: 'fa-trophy',
        texto: 'Pódios somados de todas as ligas e o resultado do mês que fechou.',
        familias: [
            { grupo: 'podios', de: '#00ffff', ate: '#00ff00', escada: true, icone: '✯', titulos: [
                { nome: 'Competitivo', fem: 'Competitiva', requisito: '20 pódios acumulados' },
                { nome: 'Condecorado', fem: 'Condecorada', requisito: '40 pódios acumulados' },
                { nome: 'Medalhista', requisito: '80 pódios acumulados' },
            ] },
            { grupo: 'liga', de: '#2bfd00', ate: '#fef600', posicao: true, titulos: [
                { nome: 'Campeão', fem: 'Campeã', icone: '♔', requisito: '1º lugar da Liga do mês anterior' },
                { nome: 'Finalista', icone: '✧', requisito: '2º ou 3º lugar da Liga do mês anterior' },
                { nome: 'Recordista', icone: '⚑', requisito: 'Maior pontuação de um mês na Liga' },
            ] },
        ],
    },
    {
        id: 'banco',
        nome: 'Banco do clã',
        icone: 'fa-coins',
        texto: 'Quanto você já apoiou o banco do clã e o pódio dos apoiadores.',
        familias: [
            { grupo: 'banco', de: '#03dedb', ate: '#e9cc02', escada: true, icone: '◆', titulos: [
                { nome: 'Contribuinte', requisito: '1kk depositado' },
                { nome: 'Apoiador', fem: 'Apoiadora', requisito: '5kk depositados' },
                { nome: 'Patrocinador', fem: 'Patrocinadora', requisito: '10kk depositados' },
            ] },
            { grupo: 'banco-top', de: '#e5df02', ate: '#ee9105', escada: true, posicao: true, icone: '❖', titulos: [
                { nome: 'Soberano', fem: 'Soberana', requisito: 'Top 3 apoiador' },
                { nome: 'Magnata', requisito: 'Top 2 apoiador' },
                { nome: 'Filantropo', fem: 'Filantropa', requisito: 'Top 1 apoiador' },
            ] },
        ],
    },
];

// Tempo de cla: a escada de sempre, com o desenho proprio da Wiki.
const TITULOS_TEMPO = [
    ['Tyrael', '120 dias'],
    ['Haniel', '180 dias'],
    ['Kamael', '1 ano'],
    ['Uriel', '2 anos'],
    ['Ariel', '3 anos'],
    ['Raziel', '5 anos'],
];

// Nivel de cada titulo (1, 2 ou 3) e o icone que ele usa no jogo.
function tituloNivel(familia, indice) {
    const titulo = familia.titulos[indice];
    return {
        nivel: familia.escada ? indice + 1 : (titulo.nivel || 1),
        icone: titulo.icone || familia.icone,
    };
}

// Nome (masculino ou feminino) -> familia e nivel, para a janela do membro.
const TITULOS_POR_NOME = (() => {
    const mapa = new Map();
    for (const categoria of TITULOS_CATEGORIAS) {
        for (const familia of categoria.familias) {
            familia.titulos.forEach((titulo, indice) => {
                const info = { familia, ...tituloNivel(familia, indice) };
                mapa.set(titulo.nome, info);
                if (titulo.fem) mapa.set(titulo.fem, info);
            });
        }
    }
    // Tempo de cla: cargos de playtime, fora das familias; na faixa do membro
    // aparecem no aqua do site, sem icone.
    const tempo = { de: '#e8f4f8', ate: '#2ee6f0' };
    for (const [nome] of TITULOS_TEMPO) mapa.set(nome, { familia: tempo, nivel: 1, icone: '' });
    return mapa;
})();

// O titulo no site: so o nome no degrade da familia. Os icones e o &k ficam no
// jogo (decisao do Fundador, 10/10/2026). `atual`: e o titulo em uso agora.
function tituloHtml(nome, { familia, nivel = 1 } = {}, { atual = false } = {}) {
    const cor = familia ? `--de:${familia.de};--ate:${familia.ate}` : '';
    return `<span class="titulo-nome nivel-${nivel} ${atual ? 'titulo-atual' : ''}" style="${cor}">`
        + `<span class="titulo-grad">${escHtml(nome)}</span></span>`;
}

// Cartao holografico (10/10/2026): o elemento `.holo` inclina em 3D seguindo o
// mouse e um brilho nas cores da familia corre por cima. Um ouvinte so, no
// documento, serve a Wiki e a janela do membro (que sao trocadas pelo innerHTML).
// So com mouse e sem "reduzir movimento": no toque e no modo quieto, nada muda.
(() => {
    const podeInclinar = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let ativo = null;

    function soltar() {
        if (!ativo) return;
        ativo.classList.remove('holo-ativo');
        for (const nome of ['--rx', '--ry', '--mx', '--my']) ativo.style.removeProperty(nome);
        ativo = null;
    }

    document.addEventListener('pointermove', event => {
        if (!podeInclinar.matches) return;
        const alvo = event.target.closest?.('.holo');
        if (alvo !== ativo) soltar();
        if (!alvo) return;
        ativo = alvo;
        const caixa = alvo.getBoundingClientRect();
        const x = (event.clientX - caixa.left) / caixa.width;
        const y = (event.clientY - caixa.top) / caixa.height;
        // Cartao grande inclina menos que chip pequeno, para nao parecer solto.
        const forca = caixa.width > 240 ? 7 : 14;
        alvo.classList.add('holo-ativo');
        alvo.style.setProperty('--ry', `${((x - 0.5) * forca).toFixed(2)}deg`);
        alvo.style.setProperty('--rx', `${((0.5 - y) * forca).toFixed(2)}deg`);
        alvo.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        alvo.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    }, { passive: true });

    document.addEventListener('pointerleave', soltar);
    window.addEventListener('blur', soltar);
})();
