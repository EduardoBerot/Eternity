const URL_METRICAS_RECRUTAMENTO = `${URL_BASE}/api/recrutamento/metricas`;
const URL_RECRUTAS = `${URL_BASE}/api/recrutamento/recrutas`;

// Estado da tela. O servidor e filtro de servidor (o backend consulta so aquele
// funil); etapa, desfecho e semana sao recortes locais, feitos sobre a lista que
// ja veio, para cada clique num grafico responder na hora.
const painelRecrutamento = {
    servidor: '',
    etapa: null,
    desfecho: null,
    semana: null,
    lista: [],
    metricas: null,
};

const ETAPAS_LABEL = {
    candidato: 'Visto no chat',
    abordado: 'Abordado',
    convertido: 'Aceitou o convite',
    recusou: 'Pediu para parar',
    sem_resposta: 'Sem resposta',
    encerrado: 'Encerrado',
    inelegivel: 'Inelegível',
    visit: 'Lendo as placas',
    quiz: 'No teste',
    site: 'Falta o cadastro',
    discord: 'Falta o Discord',
    invited: 'Convite enviado',
    returning: 'Voltando ao clã',
    complete: 'Entrou',
};

// A cor seque o desfecho, nunca a posicao dele no ranking: filtrar a tela nao
// pode repintar quem sobrou. Slots 1 a 6 da paleta categorica, na ordem fixa em
// que ela foi validada para pares vizinhos.
const DESFECHOS = [
    { id: 'entrou', nome: 'Entrou no clã', cor: 'var(--viz-1)' },
    { id: 'em_andamento', nome: 'No meio do recrutamento', cor: 'var(--viz-2)' },
    { id: 'aguardando', nome: 'Aguardando a 1ª resposta', cor: 'var(--viz-3)' },
    { id: 'sem_resposta', nome: 'Sem resposta', cor: 'var(--viz-4)' },
    { id: 'inelegivel', nome: 'Inelegível', cor: 'var(--viz-5)' },
    { id: 'encerrado', nome: 'Encerrado sem interesse', cor: 'var(--viz-6)' },
    { id: 'recusou', nome: 'Pediu para parar', cor: 'var(--viz-7)' },
];

function rotuloEtapa(valor) {
    return ETAPAS_LABEL[valor] || valor || '—';
}

function textoSeguro(valor) {
    // Fala e nick sao texto escrito por estranho: vao para a tela escapados.
    const div = document.createElement('div');
    div.textContent = String(valor ?? '');
    return div.innerHTML;
}

function diaCurto(iso) {
    if (!iso) return '';
    const data = new Date(iso);
    return Number.isNaN(data.getTime()) ? '' : data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function horaCurta(iso) {
    if (!iso) return '';
    const data = new Date(iso);
    return Number.isNaN(data.getTime())
        ? ''
        : data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function renderRecrutamento() {
    APP.innerHTML = `
        <div class="pending-page viz-root">
            <header class="pending-page__intro">
                <span class="pending-page__eyebrow">Central de análise</span>
                <h1>Recrutamento</h1>
                <p id="aviso_cobertura">Carregando...</p>
                <div class="viz-filtros">
                    <div class="member-toggle" id="filtro_servidor">
                        <button type="button" class="member-toggle__button is-active" onclick="filtrarServidor(event,'')">Todos</button>
                        <button type="button" class="member-toggle__button" onclick="filtrarServidor(event,'apocalipse')">Apocalipse</button>
                        <button type="button" class="member-toggle__button" onclick="filtrarServidor(event,'genesis')">Gênesis</button>
                    </div>
                    <div class="viz-chips" id="viz_chips"></div>
                </div>
            </header>

            <div class="viz-tiles" id="viz_tiles"></div>

            <div class="viz-grid">
                <section class="pending-card viz-card">
                    <div class="pending-card__header">
                        <div>
                            <h2>Onde o funil vaza</h2>
                            <p>Quantos chegaram a cada degrau. Clique num degrau para ver quem está nele.</p>
                        </div>
                    </div>
                    <div class="viz-plot" id="viz_funil"></div>
                </section>

                <section class="pending-card viz-card">
                    <div class="pending-card__header">
                        <div>
                            <h2>Semana a semana</h2>
                            <p>Quem entrou no funil e quem chegou ao clã, nas últimas 12 semanas.</p>
                        </div>
                    </div>
                    <div class="viz-plot" id="viz_semanas"></div>
                </section>
            </div>

            <section class="pending-card viz-card">
                <div class="pending-card__header">
                    <div>
                        <h2>Como terminaram</h2>
                        <p>Composição de todo mundo que passou pelo funil. Clique para recortar a lista.</p>
                    </div>
                </div>
                <div class="viz-plot" id="viz_desfechos"></div>
            </section>

            <section class="pending-card viz-card">
                <div class="pending-card__header">
                    <div>
                        <h2 id="titulo_lista">Fila de ação</h2>
                        <p id="subtitulo_lista">Quem começou e não terminou, do mais parado para o mais recente.</p>
                    </div>
                    <span class="pending-card__count" id="count_lista">—</span>
                </div>
                <div class="pending-card__loading" id="loading_lista">Carregando...</div>
                <div class="pending-card__table"><table id="tb_recrutas"></table></div>
            </section>

            <div class="viz-tooltip" id="viz_tooltip" hidden></div>
        </div>
    `;

    ligarDicas();
    carregarRecrutamento();
}

function filtrarServidor(event, servidor) {
    painelRecrutamento.servidor = servidor;
    for (const botao of document.querySelectorAll('#filtro_servidor .member-toggle__button')) {
        botao.classList.remove('is-active');
    }
    event.currentTarget.classList.add('is-active');
    carregarRecrutamento();
}

function carregarRecrutamento() {
    const query = painelRecrutamento.servidor ? `?servidor=${painelRecrutamento.servidor}` : '';
    const cabecalhos = { headers: getAdminRequestHeaders() };

    Promise.all([
        fetch(`${URL_METRICAS_RECRUTAMENTO}${query}`, cabecalhos).then(resposta => {
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            return resposta.json();
        }),
        // A lista vem inteira, uma vez: com ela na mao, todo clique num grafico
        // recorta a tabela sem uma nova volta ao servidor.
        fetch(`${URL_RECRUTAS}${query}${query ? '&' : '?'}estado=todos`, cabecalhos).then(resposta => {
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            return resposta.json();
        }),
    ])
        .then(([metricas, lista]) => {
            painelRecrutamento.metricas = metricas;
            painelRecrutamento.lista = lista;
            painelRecrutamento.etapa = null;
            painelRecrutamento.desfecho = null;
            painelRecrutamento.semana = null;
            document.getElementById('loading_lista').style.display = 'none';
            renderCobertura(metricas.cobertura);
            renderTiles(metricas.kpis);
            renderFunil(metricas.funil);
            renderSemanas(metricas.serie);
            renderDesfechos(metricas.desfechos);
            renderTabela();
        })
        .catch(erro => {
            document.getElementById('loading_lista').textContent = 'Não foi possível carregar o painel.';
            console.error('Painel de recrutamento:', erro);
        });
}

function renderCobertura(cobertura) {
    const aviso = document.getElementById('aviso_cobertura');
    if (!cobertura || !cobertura.parcial) {
        aviso.textContent = 'Quem está solto, o que converte e quanto tempo leva.';
        return;
    }
    // Sem este aviso, as primeiras taxas parecem desempenho péssimo quando são,
    // na verdade, ausência de dado: o histórico de etapas só passou a ser
    // gravado em 08/09/2026.
    const semHistorico = cobertura.total - cobertura.comHistorico;
    aviso.textContent = `${semHistorico} de ${cobertura.total} registros são anteriores ao histórico de etapas: `
        + 'para eles vale a etapa de hoje, e as taxas abaixo são parciais.';
}

/* ---------------------------------------------------------------------------
 * Cartões. Números soltos são números, não gráficos de uma barra só.
 * ------------------------------------------------------------------------- */
function renderTiles(kpis) {
    const horas = kpis.horasMedianasAteEntrar;
    const tempo = horas === null
        ? '—'
        : (horas >= 48 ? `${Math.round(horas / 24)}d` : `${horas}h`);
    const tiles = [
        { valor: `${kpis.taxaConversao}%`, nome: 'Conversão', nota: `${kpis.entraram} de ${kpis.total}`, destaque: true },
        { valor: kpis.abordados, nome: 'Abordados' },
        { valor: kpis.interessados, nome: 'Interessados' },
        { valor: kpis.entraram, nome: 'Entraram' },
        { valor: kpis.parados, nome: 'Travados', nota: `${kpis.paradosMaisDeUmaSemana} há mais de 7 dias` },
        { valor: kpis.aguardando, nome: 'Sem responder ainda', nota: 'fecham sozinhos em 48h' },
        { valor: tempo, nome: 'Até entrar', nota: 'mediana' },
    ];
    document.getElementById('viz_tiles').innerHTML = tiles.map(tile => `
        <div class="viz-tile${tile.destaque ? ' viz-tile--destaque' : ''}">
            <span class="viz-tile__valor">${tile.valor}</span>
            <span class="viz-tile__nome">${tile.nome}</span>
            ${tile.nota ? `<span class="viz-tile__nota">${tile.nota}</span>` : ''}
        </div>
    `).join('');
}

/* ---------------------------------------------------------------------------
 * Funil. Uma cor só: o comprimento carrega a magnitude e a posição vertical já
 * carrega a ordem. Pintar cada degrau de um tom diferente gastaria o único
 * canal livre repetindo o que a barra mostra.
 * ------------------------------------------------------------------------- */
function renderFunil(funil) {
    const maior = Math.max(...funil.map(degrau => degrau.total), 1);
    const clicaveis = new Set(['visit', 'quiz', 'site', 'discord', 'invited', 'complete']);
    document.getElementById('viz_funil').innerHTML = funil.map(degrau => {
        const largura = Math.max((degrau.total / maior) * 100, degrau.total ? 2 : 0);
        const clicavel = clicaveis.has(degrau.id);
        const ativo = painelRecrutamento.etapa === degrau.id;
        return `
            <button type="button"
                class="viz-barra${ativo ? ' is-active' : ''}${clicavel ? '' : ' viz-barra--fixa'}"
                ${clicavel ? `onclick="filtrarEtapa('${degrau.id}')"` : 'disabled'}
                aria-pressed="${ativo}"
                data-dica="${textoSeguro(`${degrau.nome}: ${degrau.total} pessoa(s)${degrau.taxa === null ? '' : ` · ${degrau.taxa}% do degrau anterior`}`)}">
                <span class="viz-barra__nome">${degrau.nome}</span>
                <span class="viz-barra__trilho">
                    <span class="viz-barra__fill" style="width:${largura}%"></span>
                </span>
                <span class="viz-barra__valor">${degrau.total}</span>
                <span class="viz-barra__taxa">${degrau.taxa === null ? '' : `${degrau.taxa}%`}</span>
            </button>
        `;
    }).join('');
}

/* ---------------------------------------------------------------------------
 * Semanas. As duas séries são as duas pontas da MESMA jornada e dividem o
 * mesmo eixo; por isso são dois tons de um azul só, e não duas cores.
 * ------------------------------------------------------------------------- */
function renderSemanas(serie) {
    if (!serie || !serie.length) {
        document.getElementById('viz_semanas').innerHTML = '<p class="table-message">Sem histórico suficiente.</p>';
        return;
    }
    const maior = Math.max(...serie.flatMap(item => [item.novos, item.entraram]), 1);
    const colunas = serie.map((item, indice) => {
        const ativo = painelRecrutamento.semana === item.semana;
        const dica = `Semana de ${diaCurto(item.semana)}: ${item.novos} no funil, ${item.entraram} entraram`;
        return `
            <button type="button" class="viz-semana${ativo ? ' is-active' : ''}"
                onclick="filtrarSemana('${item.semana}')"
                aria-pressed="${ativo}"
                data-dica="${textoSeguro(dica)}">
                <span class="viz-semana__colunas">
                    <span class="viz-semana__col viz-semana__col--novos" style="height:${(item.novos / maior) * 100}%"></span>
                    <span class="viz-semana__col viz-semana__col--entraram" style="height:${(item.entraram / maior) * 100}%"></span>
                </span>
                <span class="viz-semana__label">${indice % 2 === 0 ? diaCurto(item.semana) : ''}</span>
            </button>
        `;
    }).join('');

    document.getElementById('viz_semanas').innerHTML = `
        <div class="viz-legenda">
            <span><i class="viz-swatch viz-swatch--novos"></i>Entraram no funil</span>
            <span><i class="viz-swatch viz-swatch--entraram"></i>Entraram no clã</span>
        </div>
        <div class="viz-semanas">${colunas}</div>
    `;
}

/* ---------------------------------------------------------------------------
 * Desfechos. Parte-de-um-todo: uma barra empilhada, com 2px de respiro entre
 * os segmentos e rótulo direto em quem cabe.
 * ------------------------------------------------------------------------- */
function renderDesfechos(desfechos) {
    const porId = Object.fromEntries(desfechos.map(item => [item.desfecho, item]));
    const total = desfechos.reduce((soma, item) => soma + item.total, 0) || 1;
    const presentes = DESFECHOS.filter(item => porId[item.id]);

    const segmentos = presentes.map(item => {
        const dado = porId[item.id];
        const fatia = (dado.total / total) * 100;
        const ativo = painelRecrutamento.desfecho === item.id;
        const motivos = Object.entries(dado.motivos).map(([motivo, qtd]) => `${motivo} (${qtd})`).join(', ');
        const dica = `${item.nome}: ${dado.total} (${Math.round(fatia)}%)${motivos ? ` · ${motivos}` : ''}`;
        return `
            <button type="button" class="viz-seg${ativo ? ' is-active' : ''}"
                style="flex-grow:${dado.total};background:${item.cor}"
                onclick="filtrarDesfecho('${item.id}')"
                aria-pressed="${ativo}"
                aria-label="${item.nome}: ${dado.total}"
                data-dica="${textoSeguro(dica)}">
                ${fatia >= 18 ? `<span class="viz-seg__valor">${dado.total}</span>` : ''}
            </button>
        `;
    }).join('');

    const legenda = presentes.map(item => `
        <span><i class="viz-swatch" style="background:${item.cor}"></i>${item.nome} <strong>${porId[item.id].total}</strong></span>
    `).join('');

    document.getElementById('viz_desfechos').innerHTML = `
        <div class="viz-empilhada">${segmentos}</div>
        <div class="viz-legenda viz-legenda--larga">${legenda}</div>
    `;
}

/* ---------------------------------------------------------------------------
 * Filtros: cada clique num gráfico recorta a tabela. Clicar de novo desfaz.
 * ------------------------------------------------------------------------- */
function filtrarEtapa(etapa) {
    painelRecrutamento.etapa = painelRecrutamento.etapa === etapa ? null : etapa;
    renderFunil(painelRecrutamento.metricas.funil);
    renderTabela();
}

function filtrarDesfecho(desfecho) {
    painelRecrutamento.desfecho = painelRecrutamento.desfecho === desfecho ? null : desfecho;
    renderDesfechos(painelRecrutamento.metricas.desfechos);
    renderTabela();
}

function filtrarSemana(semana) {
    painelRecrutamento.semana = painelRecrutamento.semana === semana ? null : semana;
    renderSemanas(painelRecrutamento.metricas.serie);
    renderTabela();
}

function limparFiltros() {
    painelRecrutamento.etapa = null;
    painelRecrutamento.desfecho = null;
    painelRecrutamento.semana = null;
    renderFunil(painelRecrutamento.metricas.funil);
    renderSemanas(painelRecrutamento.metricas.serie);
    renderDesfechos(painelRecrutamento.metricas.desfechos);
    renderTabela();
}

function mesmaSemana(iso, semana) {
    if (!iso) return false;
    const inicio = new Date(semana);
    const fim = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000);
    const data = new Date(iso);
    return data >= inicio && data < fim;
}

function listaFiltrada() {
    const { etapa, desfecho, semana } = painelRecrutamento;
    return painelRecrutamento.lista
        .filter(item => (etapa ? item.etapa === etapa : true))
        .filter(item => (desfecho ? item.desfecho === desfecho : true))
        .filter(item => (semana ? mesmaSemana(item.iniciado_em, semana) || mesmaSemana(item.concluido_em, semana) : true));
}

function renderChips() {
    const { etapa, desfecho, semana } = painelRecrutamento;
    const chips = [];
    if (etapa) chips.push(['Etapa: ' + rotuloEtapa(etapa), `filtrarEtapa('${etapa}')`]);
    if (desfecho) {
        const nome = (DESFECHOS.find(item => item.id === desfecho) || {}).nome || desfecho;
        chips.push(['Desfecho: ' + nome, `filtrarDesfecho('${desfecho}')`]);
    }
    if (semana) chips.push(['Semana de ' + diaCurto(semana), `filtrarSemana('${semana}')`]);

    document.getElementById('viz_chips').innerHTML = chips.length
        ? chips.map(([texto, acao]) => `<button type="button" class="viz-chip" onclick="${acao}">${texto} ×</button>`).join('')
          + '<button type="button" class="viz-chip viz-chip--limpar" onclick="limparFiltros()">Limpar</button>'
        : '';
}

function renderTabela() {
    renderChips();
    const lista = listaFiltrada();
    const semFiltro = !painelRecrutamento.etapa && !painelRecrutamento.desfecho && !painelRecrutamento.semana;
    const visiveis = semFiltro ? lista.filter(item => item.desfecho === 'em_andamento') : lista;

    document.getElementById('titulo_lista').textContent = semFiltro ? 'Fila de ação' : 'Recorte selecionado';
    document.getElementById('subtitulo_lista').textContent = semFiltro
        ? 'Quem começou e não terminou, do mais parado para o mais recente.'
        : 'Clique de novo no gráfico para desfazer o recorte.';
    document.getElementById('count_lista').textContent = visiveis.length;

    document.getElementById('tb_recrutas').innerHTML = visiveis.length ? `
        <thead><tr><th>Nick</th><th>Servidor</th><th>Origem</th><th>Etapa</th><th>Parado há</th><th>Log</th></tr></thead>
        <tbody>
            ${visiveis.map(item => `
                <tr>
                    <td>${textoSeguro(item.nick)}</td>
                    <td>${item.servidor === 'genesis' ? 'Gênesis' : 'Apocalipse'}</td>
                    <td>${item.origem === 'prospeccao' ? 'Prospecção' : 'Orgânico'}</td>
                    <td>${rotuloEtapa(item.etapa)}</td>
                    <td>${item.dias_parado === null ? '—' : `${item.dias_parado} dia(s)`}</td>
                    <td>
                        <button type="button" class="btn btn-secondary" value="${item.id}"
                            ${item.tem_conversa ? '' : 'disabled title="Sem conversa gravada"'}
                            onclick="renderConversaRecruta(event)">Log</button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    ` : '<tbody><tr><td class="table-message">Ninguém neste recorte.</td></tr></tbody>';
}

/* ---------------------------------------------------------------------------
 * Dica flutuante.
 *
 * Fica em `position: fixed`, em coordenadas de viewport. A primeira versao era
 * absoluta dentro do #app e calculava a posicao descontando o retangulo do
 * container: como o #app rola, a dica aparecia deslocada assim que a pagina
 * saia do topo, e perto da borda direita ela ESTICAVA a area rolavel, que era
 * de onde vinha a barra de rolagem lateral. Elemento fixo nao ocupa espaco no
 * fluxo, entao nao empurra nada.
 *
 * O texto vem de `data-dica` e um so ouvinte cobre todas as marcas: com a
 * string dentro de um `onmousemove` inline, uma aspas num motivo ou num nick
 * quebrava o atributo inteiro.
 * ------------------------------------------------------------------------- */
const MARGEM_DICA = 14;

function moverDica(event) {
    const alvo = event.target.closest('[data-dica]');
    const dica = document.getElementById('viz_tooltip');
    if (!dica) return;
    if (!alvo) {
        dica.hidden = true;
        return;
    }
    dica.textContent = alvo.getAttribute('data-dica');
    dica.hidden = false;

    // Encostou na borda? A dica vira para o outro lado do cursor em vez de
    // sair da tela.
    const caixa = dica.getBoundingClientRect();
    const direita = event.clientX + MARGEM_DICA + caixa.width > window.innerWidth;
    const abaixo = event.clientY + MARGEM_DICA + caixa.height > window.innerHeight;
    dica.style.left = `${Math.max(4, direita ? event.clientX - MARGEM_DICA - caixa.width : event.clientX + MARGEM_DICA)}px`;
    dica.style.top = `${Math.max(4, abaixo ? event.clientY - MARGEM_DICA - caixa.height : event.clientY + MARGEM_DICA)}px`;
}

function esconderDica() {
    const dica = document.getElementById('viz_tooltip');
    if (dica) dica.hidden = true;
}

function ligarDicas() {
    const raiz = document.querySelector('.viz-root');
    if (!raiz) return;
    raiz.addEventListener('mousemove', moverDica);
    raiz.addEventListener('mouseleave', esconderDica);
    // Rolar com a dica aberta a deixaria parada no lugar errado, ja que ela vive
    // em coordenadas de viewport.
    APP.addEventListener('scroll', esconderDica);
}

// Sem modal: o painel não tem um, e a sub-view dentro do #app é o caminho que a
// tela de edição já usa.
function renderConversaRecruta(event) {
    const id = event.currentTarget.getAttribute('value');
    APP.innerHTML = '';
    renderLoading(APP);

    fetch(`${URL_RECRUTAS}/${id}/conversa`, { headers: getAdminRequestHeaders() })
        .then(resposta => {
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            return resposta.json();
        })
        .then(dados => {
            const corpo = dados.expirada
                ? '<p class="table-message">A conversa passou de 90 dias e o texto foi apagado. O histórico do funil continua na tela anterior.</p>'
                : (dados.falas.length
                    ? dados.falas.map(fala => `
                        <div class="recruta-log__fala recruta-log__fala--${fala.quem === 'jogador' ? 'jogador' : 'eternity'}">
                            <strong>${fala.quem === 'jogador' ? textoSeguro(dados.nick) : 'Eternity'}</strong>
                            <span>${textoSeguro(fala.texto)}</span>
                            <small>${horaCurta(fala.at)}</small>
                        </div>
                    `).join('')
                    : '<p class="table-message">Nenhuma fala gravada para este recruta.</p>');

            APP.innerHTML = `
                <div class="pending-page">
                    <header class="pending-page__intro">
                        <span class="pending-page__eyebrow">Conversa</span>
                        <h1>${textoSeguro(dados.nick)}</h1>
                        <p>${dados.servidor === 'genesis' ? 'Gênesis' : 'Apocalipse'} ·
                           ${dados.origem === 'prospeccao' ? 'Prospecção' : 'Orgânico'} ·
                           ${rotuloEtapa(dados.etapa)}</p>
                        <button type="button" class="btn btn-danger" onclick="recrutamento.click()">Voltar</button>
                    </header>
                    <div class="pending-list">
                        <section class="pending-card">
                            <div class="recruta-log">${corpo}</div>
                        </section>
                    </div>
                </div>
            `;
        })
        .catch(erro => {
            APP.innerHTML = '<p class="table-message">Não foi possível carregar a conversa.</p>';
            console.error('Conversa do recruta:', erro);
        });
}
