// Wiki: hierarquia, titulos, warps e regras, numa pagina so.
//
// A hierarquia e o destaque: uma torre em que cada cargo e um andar, mais
// estreito quanto mais alto, com as cabecas de quem ocupa o cargo hoje.
//
// As regras sao o MESMO bloco do Guia (GUIA_REGRAS, em guia.js): o teste do
// recrutamento e corrigido contra elas, entao uma copia aqui divergiria na
// primeira mudanca. Mudou uma regra? Video, banco do teste e GUIA_REGRAS mudam
// juntos -- e esta pagina acompanha sozinha.

// A cor define o nivel e o cargo define a funcao: no mesmo andar, a trilha de
// gestao (esquerda) e a de PvP (direita) tem o mesmo peso. `andar` 0 e o topo.
const WIKI_TORRE = [
    { andar: 0, salas: [{ cargo: 'Fundador', funcao: 'Fundou a Eternity em 01/08/2020.' }] },
    {
        andar: 1,
        salas: [
            { cargo: 'Dono', funcao: 'Autonomia total sobre o clã.' },
            { cargo: 'Heika', funcao: 'Organiza as estratégias e decide os vencedores.' },
        ],
    },
    {
        andar: 2,
        salas: [
            { cargo: 'Coordenador', funcao: 'Organiza projetos e cargos.' },
            { cargo: 'Sohei', funcao: 'Organiza os itens e lidera os Samurais.' },
        ],
    },
    {
        andar: 3,
        salas: [
            { cargo: 'Supervisor', funcao: 'Cuida da cidade, da atividade e dos kicks.' },
            { cargo: 'Ikko', funcao: 'Convoca os eventos e promove os Ronins.' },
        ],
    },
    {
        andar: 4,
        salas: [
            { cargo: 'Auxiliar', funcao: 'Recruta e apoia os novatos.' },
            { cargo: 'Daimyo', funcao: 'Treina e procura novos Ronins.' },
        ],
    },
    { andar: 5, salas: [{ cargo: 'Estagiário', funcao: 'Primeiro cargo da staff.' }] },
    { andar: 6, salas: [{ cargo: 'Membro', funcao: 'Todo integrante da ETY e da ETZ.' }] },
];

// Titulos: catalogo em js/titulos.js (comum a janela do membro).

// Uma familia: a faixa do degrade e os tres titulos, com o avanco de icones.
function familiaWikiHtml(familia) {
    const linhas = familia.titulos.map((titulo, indice) => {
        const info = { familia, ...tituloNivel(familia, indice) };
        const fem = titulo.fem ? `<small class="titulo-fem">${escHtml(titulo.fem)}</small>` : '';
        return `
            <li class="familia-titulo">
                <span class="familia-nome">${tituloHtml(titulo.nome, info)}${fem}</span>
                <span class="familia-req">${escHtml(titulo.requisito)}</span>
            </li>`;
    }).join('');
    const selo = familia.escada ? 'Escada' : 'Cada um';
    return `
        <article class="familia" style="--de:${familia.de};--ate:${familia.ate}">
            <div class="familia-faixa" aria-hidden="true"></div>
            <div class="familia-topo">
                <span class="familia-selo">${selo}</span>
                ${familia.posicao ? '<span class="familia-selo familia-selo-posicao" title="Sai sozinho quando a pessoa deixa de cumprir">Por posição</span>' : ''}
            </div>
            <ol class="familia-lista">${linhas}</ol>
        </article>`;
}

function titulosWikiHtml() {
    return TITULOS_CATEGORIAS.map(categoria => `
        <div class="titulos-categoria">
            <div class="titulos-categoria-cabeca">
                <i class="fa-solid ${categoria.icone}" aria-hidden="true"></i>
                <div><h3>${escHtml(categoria.nome)}</h3><p>${escHtml(categoria.texto)}</p></div>
            </div>
            <div class="familias">${categoria.familias.map(familiaWikiHtml).join('')}</div>
        </div>`).join('');
}

const WIKI_WARPS = [
    ['/go ETY', 'A cidade e o ponto de encontro'],
    ['/go ETYHistoria', 'A história da ETY'],
    ['/go ETYShop', 'O shop oficial'],
    ['/go ETYTrofeus', 'A exposição de troféus'],
    ['/go ETYBatata', 'Farm de batata, para confiáveis'],
    ['/go ETYHerba', 'Farm de herbalismo, para confiáveis'],
    ['/go ETYMegaFarm', 'Mega farm: confiável e Herbalismo 100'],
    ['/go ETYXp', 'A pequena farm de blaze'],
    ['/go ETYVillager', 'O mobspawn de villager'],
    ['/go ETYWarden1', 'Mobspawn de warden'],
    ['/go ETYWarden2', 'Mobspawn de warden'],
    ['/go ETYSpawners', 'O local com spawners'],
    ['/go ETYBunker', 'Os itens dos eventos de PvP'],
    ['/go ETYDubai', 'O bairro dos sheiks'],
];

function renderWiki() {
    app.innerHTML = `
        <header class="cabeca-pagina">
            <div class="miolo">
                <h1>Wiki</h1>
                <p class="texto">Como a Eternity se organiza: os cargos, os títulos que dá para conquistar, os lugares do clã e as regras.</p>
            </div>
        </header>
        <div class="wiki-corpo miolo">
        <nav class="wiki-secoes" aria-label="Seções da wiki">
            ${WIKI_SECOES.map(([id, nome, icone]) => `
                <a href="#wiki" data-secao="${id}" onclick="irSecaoWiki(event, '${id}')"><i class="fa-solid ${icone}" aria-hidden="true"></i>${nome}</a>`).join('')}
        </nav>
        <div class="wiki-conteudo">

        <section class="secao-wiki" id="wiki-hierarquia">
            <div class="miolo">
                <h2>Hierarquia</h2>
                <p class="texto">A cor define o nível e o cargo define a função. No mesmo andar, os cargos de gestão e de PvP valem o mesmo.</p>
                <div class="torre" id="wiki-torre">
                    <div class="torre-trilhas" style="width:calc(46% + 1 * 9%)"><span>Gestão</span><span>PvP</span></div>
                    ${WIKI_TORRE.map(andarHtml).join('')}
                    <div class="torre-chao"></div>
                </div>
            </div>
        </section>

        <section class="secao-wiki" id="wiki-titulos">
            <div class="miolo">
                <h2>Títulos</h2>
                <p class="texto">O título aparece ao lado do seu nick no clã. Para pedir o seu, mande no privado do jogo: <code>/m Eternity quero a tag &lt;nome&gt;</code></p>
                <ul class="titulos-regras">
                    <li><b>Escada:</b> vale só o nível mais alto que você alcançou.</li>
                    <li><b>Por posição:</b> top do clã, Liga e ofensiva saem sozinhos quando você deixa de cumprir.</li>
                    <li><b>Feminino:</b> quem preferir pede a versão feminina (Mestra, Campeã…), que vale igual.</li>
                </ul>
                ${titulosWikiHtml()}
                <div class="titulos-categoria">
                    <div class="titulos-categoria-cabeca">
                        <i class="fa-solid fa-hourglass-half" aria-hidden="true"></i>
                        <div><h3>Tempo de clã</h3><p>Pela data de entrada no clã.</p></div>
                    </div>
                    <div class="subida">
                        ${TITULOS_TEMPO.map(([nome, tempo]) => `
                            <div class="degrau"><span class="marco"></span><strong>${nome}</strong><span>${tempo}</span></div>`).join('')}
                    </div>
                </div>
            </div>
        </section>

        <section class="secao-wiki" id="wiki-warps">
            <div class="miolo">
                <h2>Warps</h2>
                <p class="texto">Todos os warps ficam no servidor <b>Apocalipse</b>: entre com <code>/apocalipse</code> antes de usar o <code>/go</code>. Cada warp é um lugar separado; clique em um para copiar o comando.</p>
                <div class="warps">
                    ${WIKI_WARPS.map(([comando, texto]) => `
                        <button type="button" class="warp" onclick="copiarWarp(this, '${comando}')"><code>${comando}</code><span>${texto}</span><i class="fa-regular fa-copy" aria-hidden="true"></i></button>`).join('')}
                </div>
            </div>
        </section>

        <section class="secao-wiki regras" id="wiki-regras">
            <div class="miolo">
                <h2>Regras</h2>
                <p class="texto">O essencial da convivência no clã. É sobre isto o teste do recrutamento.</p>
                ${GUIA_REGRAS}
            </div>
        </section>
        </div>
        </div>

        ${rodapeSite()}`;
    preencherOcupantes();
    acompanharSecaoWiki();
}

// Itens da navegacao lateral: [id da secao, nome, icone].
const WIKI_SECOES = [
    ['wiki-hierarquia', 'Hierarquia', 'fa-sitemap'],
    ['wiki-titulos', 'Títulos', 'fa-crown'],
    ['wiki-warps', 'Warps', 'fa-location-dot'],
    ['wiki-regras', 'Regras', 'fa-scroll'],
];

// Marca na navegacao a secao que esta na faixa de leitura (logo abaixo do
// topo). O observador anterior sai a cada render: a pagina e trocada inteira
// pelo innerHTML e as secoes antigas deixam de existir.
let wikiObservador = null;

function marcarSecaoWiki(id) {
    for (const link of document.querySelectorAll('.wiki-secoes a')) {
        link.classList.toggle('ativo', link.dataset.secao === id);
    }
}

function acompanharSecaoWiki() {
    wikiObservador?.disconnect();
    marcarSecaoWiki(WIKI_SECOES[0][0]);
    if (!('IntersectionObserver' in window)) return;
    wikiObservador = new IntersectionObserver(entradas => {
        const visivel = entradas.find(entrada => entrada.isIntersecting);
        if (visivel) marcarSecaoWiki(visivel.target.id);
    }, { rootMargin: '-30% 0px -65% 0px' });
    for (const [id] of WIKI_SECOES) {
        const secao = document.getElementById(id);
        if (secao) wikiObservador.observe(secao);
    }
}

function andarHtml({ andar, salas }) {
    return `
        <div class="andar ${salas.length === 1 ? 'inteiro' : ''}" style="--andar:${Math.min(andar, 6)}">
            ${salas.map(({ cargo, funcao }) => `
                <div class="sala ${classeCargo(cargo)}" data-cargo="${cargo}">
                    <div class="sala-texto">
                        <strong class="sala-cargo">${cargo}</strong>
                        <span class="sala-funcao">${funcao}</span>
                    </div>
                    <div class="ocupantes"></div>
                </div>`).join('')}
        </div>`;
}

// As cabecas de quem ocupa cada cargo, do cadastro ativo do site. O andar de
// Membro e grande demais para mostrar todo mundo: mostra alguns e conta o resto.
async function preencherOcupantes() {
    let membros = [];
    try {
        membros = await (await fetch(`${URL_BASE}/api/membros/ativos`)).json();
    } catch (_) {
        return;
    }
    if (!Array.isArray(membros)) return;
    membros = semContasDoCla(membros);
    for (const sala of document.querySelectorAll('#wiki-torre .sala')) {
        const cargo = sala.dataset.cargo;
        const ocupantes = membros.filter(m => m.cargo === cargo);
        const limite = cargo === 'Membro' ? 12 : 8;
        const cabecas = ocupantes.slice(0, limite).map(m => `
            <img src="https://mc-heads.net/avatar/${encodeURIComponent(m.nick)}/28" alt="${escHtml(m.nick)}" title="${escHtml(m.nick)}" loading="lazy">`).join('');
        const resto = ocupantes.length - limite;
        sala.querySelector('.ocupantes').innerHTML = cabecas + (resto > 0 ? `<span class="mais">+${resto}</span>` : '');
    }
}

function irSecaoWiki(event, id) {
    event.preventDefault();
    marcarSecaoWiki(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function copiarWarp(botao, comando) {
    try {
        await navigator.clipboard.writeText(comando);
        botao.classList.add('copiado');
        botao.querySelector('i').className = 'fa-solid fa-check';
        setTimeout(() => {
            botao.classList.remove('copiado');
            botao.querySelector('i').className = 'fa-regular fa-copy';
        }, 1400);
    } catch (_) { /* sem clipboard: o comando continua na tela */ }
}
