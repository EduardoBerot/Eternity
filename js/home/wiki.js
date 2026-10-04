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

const WIKI_TITULOS_TEMPO = [
    ['Tyrael', '120 dias'],
    ['Haniel', '180 dias'],
    ['Hamael', '1 ano'],
    ['Uriel', '2 anos'],
    ['Ariel', '3 anos'],
    ['Raziel', '5 anos'],
];

const WIKI_TITULOS_MCMMO = [
    ['Berserker', 'Machado 100', 'fa-fire'],
    ['Paladino', 'Espada 100', 'fa-khanda'],
    ['Arqueiro', 'Arco 100', 'fa-bullseye'],
    ['Caçador', 'Besta 100', 'fa-crosshairs'],
    ['Poseidon', 'Tridente 100', 'fa-water'],
    ['Farmer', 'Habilidade passiva 100', 'fa-seedling'],
    ['Lendário', 'Todas as habilidades de PvP 100', 'fa-bolt'],
    ['Eternal', 'Todo o mcMMO 100', 'fa-infinity'],
    ['Campeão', 'Primeiro lugar da Liga do mês', 'fa-crown'],
];

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
        <nav class="wiki-secoes" aria-label="Seções da wiki">
            <div class="miolo">
                <a href="#wiki" onclick="irSecaoWiki(event, 'wiki-hierarquia')">Hierarquia</a>
                <a href="#wiki" onclick="irSecaoWiki(event, 'wiki-titulos')">Títulos</a>
                <a href="#wiki" onclick="irSecaoWiki(event, 'wiki-warps')">Warps</a>
                <a href="#wiki" onclick="irSecaoWiki(event, 'wiki-regras')">Regras</a>
            </div>
        </nav>

        <section class="secao-wiki" id="wiki-hierarquia">
            <div class="miolo">
                <h2>Hierarquia</h2>
                <p class="texto">A cor define o nível e o cargo define a função. No mesmo andar, os cargos de gestão e de PvP valem o mesmo.</p>
                ${organogramaHtml()}
            </div>
        </section>

        <section class="secao-wiki faixa-escura" id="wiki-titulos">
            <div class="miolo">
                <h2>Títulos</h2>
                <p class="texto">O título aparece ao lado do seu nick no clã. Para pedir o seu, mande no privado do jogo: <code>/m Eternity quero a tag &lt;nome&gt;</code></p>
                <h3 class="subtitulo-wiki">Pelo tempo de clã</h3>
                <div class="subida">
                    ${WIKI_TITULOS_TEMPO.map(([nome, tempo]) => `
                        <div class="degrau"><span class="marco"></span><strong>${nome}</strong><span>${tempo}</span></div>`).join('')}
                </div>
                <h3 class="subtitulo-wiki">Pelas habilidades do mcMMO</h3>
                <div class="habilidades">
                    ${WIKI_TITULOS_MCMMO.map(([nome, requisito, icone]) => `
                        <div class="habilidade"><i class="fa-solid ${icone}" aria-hidden="true"></i><strong>${nome}</strong><span>${requisito}</span></div>`).join('')}
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

        ${rodapeSite()}`;
    preencherOcupantes();
}

function salaHtml({ cargo, funcao }) {
    return `
        <div class="sala ${classeCargo(cargo)}" data-cargo="${cargo}">
            <div class="sala-texto">
                <strong class="sala-cargo">${cargo}</strong>
                <span class="sala-funcao">${funcao}</span>
            </div>
            <div class="ocupantes"></div>
        </div>`;
}

// Organograma (03/10/2026, no lugar da torre): o Fundador no topo abre em dois
// ramos, Gestao e PvP, que descem lado a lado e se juntam no Estagiario e no
// Membro. Cada nivel de dois cargos e uma linha da grade, entao Dono e Heika
// (e cada par abaixo) ficam sempre na mesma altura. No celular a grade vira
// uma coluna: `--ordem` poe o ramo de Gestao inteiro antes do de PvP.
function organogramaHtml() {
    const duplos = WIKI_TORRE.filter(nivel => nivel.salas.length === 2);
    const [topo, ...base] = WIKI_TORRE.filter(nivel => nivel.salas.length === 1);
    const no = (sala, ordem, ultimo) => `<div class="org-no ${ultimo ? 'ultimo' : ''}" style="--ordem:${ordem}">${salaHtml(sala)}</div>`;
    return `
        <div class="org" id="wiki-torre">
            <div class="org-unico">${salaHtml(topo.salas[0])}</div>
            <div class="org-ponte abre"></div>
            <div class="org-ramos">
                <div class="org-rotulo" style="--ordem:0"><span>Gestão</span></div>
                <div class="org-rotulo" style="--ordem:10"><span>PvP</span></div>
                ${duplos.map((nivel, i) => {
                    const ultimo = i === duplos.length - 1;
                    return no(nivel.salas[0], 1 + i, ultimo) + no(nivel.salas[1], 11 + i, ultimo);
                }).join('')}
            </div>
            <div class="org-ponte fecha"></div>
            ${base.map((nivel, i) => `${i ? '<div class="org-elo"></div>' : ''}<div class="org-unico">${salaHtml(nivel.salas[0])}</div>`).join('')}
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
