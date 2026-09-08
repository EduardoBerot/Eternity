const URL_METRICAS_RECRUTAMENTO = `${URL_BASE}/api/recrutamento/metricas`;
const URL_RECRUTAS = `${URL_BASE}/api/recrutamento/recrutas`;

// Filtro de servidor da tela. Os dois funis sao conduzidos por bots diferentes,
// em servidores diferentes, e somar os dois esconderia justamente a diferenca
// entre eles.
let recrutamentoServidor = '';

const ETAPAS_LABEL = {
    // Prospecao
    candidato: 'Visto no chat',
    abordado: 'Abordado',
    convertido: 'Aceitou o convite',
    recusou: 'Pediu para parar',
    sem_resposta: 'Sem resposta',
    encerrado: 'Encerrado',
    inelegivel: 'Inelegivel',
    // Recrutamento
    visit: 'Lendo as placas',
    quiz: 'No teste',
    site: 'Falta o cadastro',
    discord: 'Falta o Discord',
    invited: 'Convite enviado',
    returning: 'Voltando ao cla',
    complete: 'Entrou',
};

const DESFECHO_LABEL = {
    entrou: 'Entrou no cla',
    em_andamento: 'Em andamento',
    recusou: 'Pediu para parar',
    sem_resposta: 'Sem resposta',
    encerrado: 'Encerrado sem interesse',
    inelegivel: 'Inelegivel',
};

function rotuloEtapa(valor) {
    return ETAPAS_LABEL[valor] || valor || '—';
}

function textoSeguro(valor) {
    // Fala de jogador e texto escrito por estranho: vai para a tela escapado,
    // sempre.
    const div = document.createElement('div');
    div.textContent = String(valor ?? '');
    return div.innerHTML;
}

function renderRecrutamento() {
    APP.innerHTML = `
        <div class="pending-page">
            <header class="pending-page__intro">
                <span class="pending-page__eyebrow">Central de análise</span>
                <h1>Recrutamento</h1>
                <p>Quem está parado no meio do caminho, onde o funil vaza e o que está convertendo.</p>
                <div class="member-toggle" id="filtro_servidor">
                    <button type="button" class="member-toggle__button is-active" onclick="filtrarServidor(event,'')">Todos</button>
                    <button type="button" class="member-toggle__button" onclick="filtrarServidor(event,'apocalipse')">Apocalipse</button>
                    <button type="button" class="member-toggle__button" onclick="filtrarServidor(event,'genesis')">Gênesis</button>
                </div>
            </header>

            <div class="pending-list">
                <section class="pending-card">
                    <div class="pending-card__header">
                        <div>
                            <h2>Números do funil</h2>
                            <p id="aviso_cobertura">Carregando...</p>
                        </div>
                    </div>
                    <div class="pending-card__loading" id="loading_kpis">Carregando números...</div>
                    <div class="pending-card__table" id="cartoes_recrutamento"></div>
                </section>

                <section class="pending-card">
                    <div class="pending-card__header">
                        <div>
                            <h2>Onde está travado</h2>
                            <p>Quem começou o recrutamento e não terminou, do mais parado para o mais recente.</p>
                        </div>
                        <span class="pending-card__count" id="count_parados">—</span>
                    </div>
                    <div class="pending-card__loading" id="loading_parados">Carregando quem está parado...</div>
                    <div class="pending-card__table"><table id="tb_parados"></table></div>
                </section>

                <section class="pending-card">
                    <div class="pending-card__header">
                        <div>
                            <h2>Passagem por etapa</h2>
                            <p>Quantos chegaram a cada degrau e que fatia do degrau anterior isso representa.</p>
                        </div>
                    </div>
                    <div class="pending-card__table" id="tabela_funil"></div>
                </section>

                <section class="pending-card">
                    <div class="pending-card__header">
                        <div>
                            <h2>Desfechos</h2>
                            <p>Como terminaram os que saíram do funil, com o motivo registrado.</p>
                        </div>
                    </div>
                    <div class="pending-card__table" id="tabela_desfechos"></div>
                </section>
            </div>
        </div>
    `;

    carregarMetricas();
    carregarParados();
}

function filtrarServidor(event, servidor) {
    recrutamentoServidor = servidor;
    for (const botao of document.querySelectorAll('#filtro_servidor .member-toggle__button')) {
        botao.classList.remove('is-active');
    }
    event.target.classList.add('is-active');
    carregarMetricas();
    carregarParados();
}

function queryServidor() {
    return recrutamentoServidor ? `?servidor=${recrutamentoServidor}` : '';
}

function carregarMetricas() {
    fetch(`${URL_METRICAS_RECRUTAMENTO}${queryServidor()}`, { headers: getAdminRequestHeaders() })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(dados => {
            document.getElementById('loading_kpis').style.display = 'none';
            renderCartoes(dados.kpis);
            renderFunil(dados.funil);
            renderDesfechos(dados.desfechos);
            renderCobertura(dados.cobertura);
        })
        .catch(error => {
            document.getElementById('loading_kpis').textContent = 'Não foi possível carregar os números.';
            console.error('Métricas de recrutamento:', error);
        });
}

function renderCartoes(kpis) {
    const horas = kpis.horasMedianasAteEntrar;
    const tempo = horas === null
        ? '—'
        : (horas >= 48 ? `${Math.round(horas / 24)} dias` : `${horas} h`);
    const cartoes = [
        ['Abordados', kpis.abordados],
        ['Demonstraram interesse', kpis.interessados],
        ['Entraram no clã', kpis.entraram],
        ['Taxa de conversão', `${kpis.taxaConversao}%`],
        ['Parados agora', kpis.parados],
        ['Parados há mais de 7 dias', kpis.paradosMaisDeUmaSemana],
        ['Tempo até entrar', tempo],
    ];
    document.getElementById('cartoes_recrutamento').innerHTML = `
        <table>
            <tbody>
                ${cartoes.map(([nome, valor]) => `<tr><td>${nome}</td><td><strong>${valor}</strong></td></tr>`).join('')}
            </tbody>
        </table>
    `;
}

function renderCobertura(cobertura) {
    const aviso = document.getElementById('aviso_cobertura');
    if (!cobertura || !cobertura.parcial) {
        aviso.textContent = 'Todos os registros têm o histórico completo de etapas.';
        return;
    }
    // Sem esse aviso as primeiras taxas parecem desempenho ruim quando são, na
    // verdade, ausência de dado: o histórico de etapas só passou a ser gravado
    // em 08/09/2026.
    const semHistorico = cobertura.total - cobertura.comHistorico;
    aviso.textContent = `Atenção: ${semHistorico} de ${cobertura.total} registros são anteriores ao histórico de etapas. `
        + 'Para eles, vale a etapa em que estão hoje, e as taxas abaixo são parciais.';
}

function renderFunil(funil) {
    document.getElementById('tabela_funil').innerHTML = `
        <table>
            <thead><tr><th>Etapa</th><th>Chegaram</th><th>Do degrau anterior</th></tr></thead>
            <tbody>
                ${funil.map(degrau => `
                    <tr>
                        <td>${degrau.nome}</td>
                        <td>${degrau.total}</td>
                        <td>${degrau.taxa === null ? '—' : `${degrau.taxa}%`}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderDesfechos(desfechos) {
    document.getElementById('tabela_desfechos').innerHTML = `
        <table>
            <thead><tr><th>Desfecho</th><th>Total</th><th>Motivos</th></tr></thead>
            <tbody>
                ${desfechos.map(item => `
                    <tr>
                        <td>${DESFECHO_LABEL[item.desfecho] || item.desfecho}</td>
                        <td>${item.total}</td>
                        <td>${Object.entries(item.motivos).map(([motivo, total]) => `${textoSeguro(motivo)} (${total})`).join(', ') || '—'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function carregarParados() {
    const loading = document.getElementById('loading_parados');
    loading.style.display = '';
    fetch(`${URL_RECRUTAS}${queryServidor()}`, { headers: getAdminRequestHeaders() })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(lista => {
            loading.style.display = 'none';
            document.getElementById('count_parados').textContent = lista.length;
            document.getElementById('tb_parados').innerHTML = lista.length ? `
                <thead><tr><th>Nick</th><th>Servidor</th><th>Origem</th><th>Etapa</th><th>Parado há</th><th>Log</th></tr></thead>
                <tbody>
                    ${lista.map(item => `
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
            ` : '<tbody><tr><td class="table-message">Ninguém parado no meio do recrutamento.</td></tr></tbody>';
        })
        .catch(error => {
            loading.textContent = 'Não foi possível carregar a lista.';
            console.error('Lista de recrutas:', error);
        });
}

// Sem modal: o painel não tem um, e a sub-view dentro do #app é o caminho que
// a tela de edição já usa.
function renderConversaRecruta(event) {
    const id = event.target.getAttribute('value');
    APP.innerHTML = '';
    renderLoading(APP);

    fetch(`${URL_RECRUTAS}/${id}/conversa`, { headers: getAdminRequestHeaders() })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(dados => {
            const corpo = dados.expirada
                ? '<p class="table-message">A conversa passou de 90 dias e o texto foi apagado. O histórico do funil continua acima.</p>'
                : (dados.falas.length
                    ? dados.falas.map(fala => `
                        <div class="recruta-log__fala recruta-log__fala--${fala.quem === 'jogador' ? 'jogador' : 'eternity'}">
                            <strong>${fala.quem === 'jogador' ? textoSeguro(dados.nick) : 'Eternity'}</strong>
                            <span>${textoSeguro(fala.texto)}</span>
                            <small>${fala.at ? getDate(fala.at, true) : ''}</small>
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
        .catch(error => {
            APP.innerHTML = '<p class="table-message">Não foi possível carregar a conversa.</p>';
            console.error('Conversa do recruta:', error);
        });
}
