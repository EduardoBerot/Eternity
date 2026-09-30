// Wiki: regras, hierarquia, titulos e warps.
//
// As regras sao o MESMO bloco do Guia (GUIA_REGRAS, em guia.js): o teste do
// recrutamento e corrigido contra elas, entao uma copia aqui divergiria na
// primeira mudanca. Mudou uma regra? Video, banco do teste e GUIA_REGRAS mudam
// juntos -- e esta pagina acompanha sozinha.

const WIKI_ABAS = [
    { id: 'regras', rotulo: 'Regras', icone: 'fa-scroll' },
    { id: 'hierarquia', rotulo: 'Hierarquia', icone: 'fa-crown' },
    { id: 'titulos', rotulo: 'Títulos', icone: 'fa-medal' },
    { id: 'warps', rotulo: 'Warps', icone: 'fa-location-dot' },
];

// A cor define o nivel e o cargo define a funcao: na mesma linha, a trilha de
// gestao (esquerda) e a de PvP (direita) tem o mesmo peso.
const WIKI_HIERARQUIA = [
    { nivel: 'fundador', gestao: { cargo: 'Fundador', funcao: 'Ducred22, que fundou a Eternity em 01/08/2020.' } },
    {
        nivel: 'dono',
        gestao: { cargo: 'Dono', funcao: 'Autonomia total sobre o clã.' },
        pvp: { cargo: 'Heika', funcao: 'Organiza as estratégias e decide os vencedores.' },
    },
    {
        nivel: 'coordenador',
        gestao: { cargo: 'Coordenador', funcao: 'Organiza projetos e cargos.' },
        pvp: { cargo: 'Sohei', funcao: 'Organiza os itens e lidera os Samurais.' },
    },
    {
        nivel: 'supervisor',
        gestao: { cargo: 'Supervisor', funcao: 'Cuida da cidade, da atividade e dos kicks.' },
        pvp: { cargo: 'Ikko', funcao: 'Convoca os eventos e promove os Ronins.' },
    },
    {
        nivel: 'auxiliar',
        gestao: { cargo: 'Auxiliar', funcao: 'Recruta e apoia os novatos.' },
        pvp: { cargo: 'Daimyo', funcao: 'Treina e procura novos Ronins.' },
    },
    { nivel: 'estagiário', gestao: { cargo: 'Estagiário', funcao: 'Primeiro cargo da staff.' } },
    { nivel: 'membro', gestao: { cargo: 'Membro', funcao: 'Todo integrante da ETY e da ETZ.' } },
];

const WIKI_TITULOS_MCMMO = [
    ['Berserker', 'Machado 100'],
    ['Paladino', 'Espada 100'],
    ['Arqueiro', 'Arco 100'],
    ['Caçador', 'Besta 100'],
    ['Poseidon', 'Tridente 100'],
    ['Farmer', 'Habilidade passiva 100'],
    ['Lendário', 'Todas as habilidades de PvP 100'],
    ['Eternal', 'Todo o mcMMO 100'],
    ['Campeão', 'Primeiro lugar da Liga mensal'],
];

const WIKI_TITULOS_TEMPO = [
    ['Tyrael', '120 dias'],
    ['Haniel', '180 dias'],
    ['Hamael', '1 ano'],
    ['Uriel', '2 anos'],
    ['Ariel', '3 anos'],
    ['Raziel', '5 anos'],
];

const WIKI_WARPS = [
    ['/go ETY', 'A cidade e o ponto de encontro. As placas de regras ficam à direita.'],
    ['/go ETYHistoria', 'A história da ETY.'],
    ['/go ETYShop', 'O shop oficial.'],
    ['/go ETYTrofeus', 'A exposição de troféus.'],
    ['/go ETYBatata', 'A grande farm de batata (trust para confiáveis).'],
    ['/go ETYHerba', 'A farm coletiva de herbalismo (trust para confiáveis).'],
    ['/go ETYMegaFarm', 'A mega farm (confiável e Herbalismo 100).'],
    ['/go ETYXp', 'A pequena farm de blaze.'],
    ['/go ETYVillager', 'O mobspawn de villager.'],
    ['/go ETYWarden1', 'Mobspawn de warden.'],
    ['/go ETYWarden2', 'Mobspawn de warden.'],
    ['/go ETYSpawners', 'O local com spawners.'],
    ['/go ETYBunker', 'Guarda os itens dos eventos de PvP.'],
    ['/go ETYDubai', 'O bairro dos sheiks.'],
];

let wikiAba = 'regras';

function renderWiki() {
    app.innerHTML = `
        <section class="pagina-cabeca">
            <div>
                <p class="eyebrow">Informações do clã</p>
                <h1>Wiki da Eternity</h1>
                <p class="pagina-sub">Regras, organização, títulos e lugares do clã.</p>
            </div>
        </section>
        <div class="abas" role="tablist" aria-label="Seções da wiki">
            ${WIKI_ABAS.map(aba => `
                <button type="button" role="tab" id="aba-${aba.id}" aria-controls="wiki-painel"
                    aria-selected="${aba.id === wikiAba}" class="aba ${aba.id === wikiAba ? 'ativa' : ''}"
                    onclick="trocarAbaWiki('${aba.id}')"><i class="fa-solid ${aba.icone}"></i> ${aba.rotulo}</button>`).join('')}
        </div>
        <section id="wiki-painel" role="tabpanel" aria-labelledby="aba-${wikiAba}">${conteudoWiki(wikiAba)}</section>`;
}

function trocarAbaWiki(id) {
    wikiAba = id;
    renderWiki();
}

function conteudoWiki(id) {
    if (id === 'hierarquia') {
        return `
        <div class="cartao">
            <p class="eyebrow">Estrutura interna</p>
            <h2>Hierarquia e cargos</h2>
            <p class="wiki-intro">A cor define o nível e o cargo define a função. Na mesma linha, os cargos de <b>gestão</b> e de <b>PvP</b> têm o mesmo nível.</p>
            <div class="hierarquia">
                <div class="hierarquia-cabeca"><span>Gestão</span><span>PvP</span></div>
                ${WIKI_HIERARQUIA.map(linha => `
                <div class="hierarquia-linha nivel-${linha.nivel}">
                    ${cargoWiki(linha.gestao)}
                    ${linha.pvp ? cargoWiki(linha.pvp) : '<div class="hierarquia-cargo vazio"></div>'}
                </div>`).join('')}
            </div>
        </div>`;
    }
    if (id === 'titulos') {
        const lista = itens => itens.map(([nome, requisito]) => `
            <div class="titulo-item"><strong>${nome}</strong><span>${requisito}</span></div>`).join('');
        return `
        <div class="cartao">
            <p class="eyebrow">Tags no jogo</p>
            <h2>Títulos</h2>
            <p class="wiki-intro">O título aparece ao lado do seu nick no clã. Para pedir o seu, mande no privado do jogo: <code>/m Eternity quero a tag &lt;nome&gt;</code>.</p>
            <h3 class="wiki-sub"><i class="fa-solid fa-khanda"></i> Por habilidade (mcMMO)</h3>
            <div class="titulos-grade">${lista(WIKI_TITULOS_MCMMO)}</div>
            <h3 class="wiki-sub"><i class="fa-solid fa-hourglass-half"></i> Por tempo de clã</h3>
            <div class="titulos-grade">${lista(WIKI_TITULOS_TEMPO)}</div>
        </div>`;
    }
    if (id === 'warps') {
        return `
        <div class="cartao">
            <p class="eyebrow">Onde fica cada coisa</p>
            <h2>Warps oficiais</h2>
            <p class="wiki-intro">Cada warp é um lugar separado. Use o próprio <code>/go</code> para chegar em qualquer um deles.</p>
            <div class="warps">${WIKI_WARPS.map(([comando, texto]) => `
                <div class="warp"><code>${comando}</code><span>${texto}</span></div>`).join('')}
            </div>
        </div>`;
    }
    return `
        <div class="cartao">
            <p class="eyebrow">Convivência e organização</p>
            <h2>Regras do clã</h2>
            ${GUIA_REGRAS}
        </div>`;
}

function cargoWiki({ cargo, funcao }) {
    return `
        <div class="hierarquia-cargo">
            <strong class="cargo-${cargo.toLowerCase()}">${cargo}</strong>
            <span>${funcao}</span>
        </div>`;
}
