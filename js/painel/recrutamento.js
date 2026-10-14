// Aba Recrutamento do painel (so lideres). Desde 14/10/2026 e um dashboard de
// tela unica, no molde da aba Analises: a tela cabe na janela (recrutamento.css),
// os graficos sao SVG desenhados no tamanho medido de cada caixa e um
// ResizeObserver redesenha quando ela muda. Os utilitarios de desenho (anTicks,
// anBarraTopo, anBarraDireita) sao os do analises.js.
//
// Servidor e periodo vao ao backend; todo o resto (clique num grafico recortando
// a fila) e local, sobre a lista que ja veio.

const URL_METRICAS_RECRUTAMENTO = `${URL_BASE}/api/recrutamento/metricas`;
const URL_RECRUTAS = `${URL_BASE}/api/recrutamento/recrutas`;

const DIA_MS_RC = 24 * 60 * 60 * 1000;

const rc = {
    servidor: '',
    periodo: 'tudo',
    // Um recorte por vez: { chave, nome, fn }. Clicar de novo no mesmo desfaz.
    filtro: null,
    lista: [],
    metricas: null,
    aba: 'resumo',
    observador: null,
    quadro: 0,
};

const ETAPAS_LABEL = {
    candidato: 'Visto no chat',
    abordado: 'Abordado',
    convertido: 'Topou entrar',
    recusou: 'Pediu para parar',
    sem_resposta: 'Sem resposta',
    encerrado: 'Encerrado',
    inelegivel: 'Inelegível',
    visit: 'Placas (modelo antigo)',
    quiz: 'Teste no chat (modelo antigo)',
    site: 'No Guia',
    discord: 'Discord vinculado',
    invited: 'Convite enviado',
    returning: 'Convite de volta enviado',
    complete: 'Entrou',
    expirado: 'Encerrado por inatividade',
    sem_discord: 'Sem Discord (pausado)',
};

// O que falta para a pessoa andar, dito do jeito que um lider resolveria. No
// modelo do Guia quase tudo depende do recruta; o unico passo do bot e o
// convite logo depois do vinculo.
const PROXIMO_PASSO = {
    candidato: 'Responder à Eternity',
    abordado: 'Responder à Eternity',
    convertido: 'Confirmar que quer entrar',
    visit: 'Falar com a Eternity para migrar ao Guia',
    quiz: 'Falar com a Eternity para migrar ao Guia',
    site: 'Terminar o Guia no site',
    discord: 'Bot enviar o convite',
    invited: 'Aceitar o convite da ETZ no jogo',
    returning: 'Aceitar o convite de volta no jogo',
};

// A cor segue o desfecho, nunca a posicao dele no ranking: filtrar a tela nao
// pode repintar quem sobrou. Sao os tons da paleta categorica clareados para o
// fundo escuro (painel-site.css).
const DESFECHOS = [
    { id: 'entrou', nome: 'Entrou no clã', cor: 'var(--rc-1)' },
    { id: 'em_andamento', nome: 'No meio do recrutamento', cor: 'var(--rc-2)' },
    { id: 'aguardando', nome: 'Aguardando a 1ª resposta', cor: 'var(--rc-3)' },
    { id: 'sem_resposta', nome: 'Sem resposta', cor: 'var(--rc-4)' },
    { id: 'inelegivel', nome: 'Inelegível', cor: 'var(--rc-5)' },
    { id: 'encerrado', nome: 'Encerrado sem interesse', cor: 'var(--rc-6)' },
    { id: 'recusou', nome: 'Pediu para parar', cor: 'var(--rc-7)' },
    { id: 'expirado', nome: 'Encerrado por 10 dias parado', cor: 'var(--rc-8)' },
    // Neutro, e nao um nono slot: e pausa, nao desfecho de verdade (14/10/2026).
    { id: 'sem_discord', nome: 'Sem Discord (pausado)', cor: 'var(--rc-neutro)' },
];

// Onde quem ainda nao terminou esta parado AGORA. A cor e a fase (chat, site ou
// jogo): e ela que diz de quem e a vez -- da Eternity, do Guia ou do convite.
const FASES = {
    chat: { nome: 'No chat', cor: 'var(--rc-chat)' },
    site: { nome: 'No site', cor: 'var(--an-acento)' },
    jogo: { nome: 'No jogo', cor: 'var(--rc-jogo)' },
    pausa: { nome: 'Pausado', cor: 'var(--rc-neutro)' },
};

const AGORA = [
    { id: 'resposta', nome: 'Esperando a 1ª resposta', fase: 'chat', nota: 'fecha sozinho em 48h' },
    { id: 'conversa', nome: 'Conversando com a Eternity', fase: 'chat' },
    { id: 'nao_abriu', nome: 'Não abriu o Guia', fase: 'site' },
    { id: 'teste', nome: 'No vídeo ou no teste', fase: 'site' },
    { id: 'discord', nome: 'Falta vincular o Discord', fase: 'site', nota: 'já passou no teste' },
    { id: 'convite_bot', nome: 'Bot vai mandar o convite', fase: 'jogo' },
    { id: 'convite', nome: 'Falta aceitar o convite', fase: 'jogo' },
    { id: 'volta', nome: 'Ex-membro voltando', fase: 'jogo' },
    { id: 'sem_discord', nome: 'Sem Discord (pausado)', fase: 'pausa', nota: 'volta com "quero entrar"' },
];

const PERIODOS = [['7d', '7 dias', 7], ['30d', '30 dias', 30], ['tudo', 'Tudo', null]];

/* ---------------------------------------------------------------------------
 * Utilitarios
 * ------------------------------------------------------------------------- */

function rotuloEtapa(valor, retorno = false) {
    // Ex-membro em `discord` ainda NAO vinculou: e a etapa em que ele espera o
    // vinculo para receber o convite de volta.
    if (retorno && valor === 'discord') return 'Falta o Discord';
    return ETAPAS_LABEL[valor] || valor || '—';
}

function proximoPasso(item) {
    if (item.desfecho !== 'em_andamento' && item.desfecho !== 'aguardando') return '—';
    if (item.retorno && item.etapa === 'discord') return 'Vincular o Discord';
    if (item.etapa === 'site') return passoNoGuia(item.guia);
    return PROXIMO_PASSO[item.etapa] || '—';
}

// Na etapa do site, o que o Guia viu de quem veio pelo link do bot: diz se a
// pessoa nem abriu o link, parou no teste ou parou no Discord (14/10/2026).
function passoNoGuia(guia) {
    if (!guia?.abertoEm) return 'Abrir o link do Guia (ainda não abriu)';
    if (!guia.testeEm) return 'Passar no teste do Guia';
    return 'Vincular o Discord (já passou no teste)';
}

function horasLegiveis(horas) {
    if (horas === null || horas === undefined) return '—';
    if (horas >= 48) return `${Math.round(horas / 24)}d`;
    if (horas >= 1) return `${Math.round(horas)}h`;
    return `${Math.max(1, Math.round(horas * 60))}min`;
}

function textoSeguro(valor) {
    // Fala e nick sao texto escrito por estranho: vao para a tela escapados.
    return String(valor ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function horaCurta(iso) {
    if (!iso) return '';
    const data = new Date(iso);
    return Number.isNaN(data.getTime())
        ? ''
        : data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Dia de Sao Paulo (AAAA-MM-DD): e o dia em que o lider viveu o recrutamento,
// nao o dia UTC.
function diaSP(valor) {
    const data = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(data.getTime())) return null;
    return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function diaRotulo(chave) {
    const [, mes, dia] = chave.split('-');
    return `${dia}/${mes}`;
}

function somaDias(chave, dias) {
    const data = new Date(`${chave}T12:00:00Z`);
    data.setUTCDate(data.getUTCDate() + dias);
    return data.toISOString().slice(0, 10);
}

function segundaDe(chave) {
    const data = new Date(`${chave}T12:00:00Z`);
    return somaDias(chave, -((data.getUTCDay() + 6) % 7));
}

const pct = (parte, todo) => (todo ? Math.round((parte / todo) * 1000) / 10 : null);
const pctTexto = valor => (valor === null ? '—' : `${valor.toLocaleString('pt-BR')}%`);

/* ---------------------------------------------------------------------------
 * Recortes locais
 * ------------------------------------------------------------------------- */

function agoraDe(item) {
    if (item.desfecho === 'sem_discord') return 'sem_discord';
    if (item.desfecho === 'aguardando') return 'resposta';
    if (item.desfecho !== 'em_andamento') return null;
    if (item.retorno) return 'volta';
    if (item.etapa === 'site') {
        if (!item.guia?.abertoEm) return 'nao_abriu';
        return item.guia.testeEm ? 'discord' : 'teste';
    }
    // Placas e teste no chat sairam em 28/09: quem ficou la nao fez o Guia.
    if (item.etapa === 'visit' || item.etapa === 'quiz') return 'nao_abriu';
    if (item.etapa === 'discord') return 'convite_bot';
    if (item.etapa === 'invited') return 'convite';
    return 'conversa';
}

const ALEM_DO_GUIA = new Set(['discord', 'invited', 'complete']);
const passouDoGuia = item => ALEM_DO_GUIA.has(item.etapa) || item.desfecho === 'entrou';

// O funil do backend, com dois degraus a mais dentro do Guia: abriu e passou no
// teste. Eles vem do registro do site por nick (14/10/2026); quem ja vinculou o
// Discord conta como tendo passado pelos dois, porque o vinculo exige o teste --
// sem isso, um nick digitado diferente no site faria o funil subir.
function funilCompleto() {
    const base = rc.metricas?.funil || [];
    const jornada = rc.lista.filter(item => !item.retorno);
    const abriu = jornada.filter(item => item.guia?.abertoEm || passouDoGuia(item)).length;
    const teste = jornada.filter(item => item.guia?.testeEm || passouDoGuia(item)).length;
    const degraus = [];
    for (const degrau of base) {
        degraus.push({ id: degrau.id, nome: degrau.nome, total: degrau.total });
        if (degrau.id === 'guia') {
            degraus.push({ id: 'abriu', nome: 'Abriu o Guia', total: Math.min(abriu, degrau.total) });
            degraus.push({ id: 'teste', nome: 'Passou no teste', total: Math.min(teste, abriu, degrau.total) });
        }
    }
    // Quem chega sozinho pula a abordagem e entra direto no interesse: ali a taxa
    // passaria de 100% e nao diria nada.
    return degraus.map((degrau, i) => ({ ...degrau, taxa: i && degrau.id !== 'interesse' ? pct(degrau.total, degraus[i - 1].total) : null }));
}

// Clicar num degrau mostra quem esta parado NELE: quem chegou ali e nao subiu.
const PARADOS_NO_DEGRAU = {
    abordado: ['resposta'],
    interesse: ['conversa'],
    guia: ['nao_abriu'],
    abriu: ['teste'],
    teste: ['discord', 'sem_discord'],
    discord: ['convite_bot'],
    invited: ['convite'],
};

function filtroDoDegrau(degrau) {
    if (degrau.id === 'complete') {
        return { chave: 'degrau:complete', nome: 'Entraram no clã', fn: item => item.desfecho === 'entrou' };
    }
    const grupos = new Set(PARADOS_NO_DEGRAU[degrau.id] || []);
    return { chave: `degrau:${degrau.id}`, nome: `Parados em "${degrau.nome}"`, fn: item => grupos.has(agoraDe(item)) };
}

function aplicarFiltro(filtro) {
    rc.filtro = rc.filtro?.chave === filtro?.chave ? null : filtro;
    // No celular o recorte so faz sentido vendo a lista.
    if (rc.filtro && window.matchMedia('(max-width: 900px)').matches) rc.aba = 'fila';
    rcEsconderDica();
    rcDesenharFiltros();
    rcDesenharAbas();
    rcDesenharGraficos();
}

function filtrarDegrau(id) {
    const degrau = funilCompleto().find(item => item.id === id);
    if (degrau) aplicarFiltro(filtroDoDegrau(degrau));
}

function filtrarAgora(id) {
    const grupo = AGORA.find(item => item.id === id);
    aplicarFiltro({ chave: `agora:${id}`, nome: grupo.nome, fn: item => agoraDe(item) === id });
}

function filtrarDesfecho(id) {
    const nome = DESFECHOS.find(item => item.id === id)?.nome || id;
    aplicarFiltro({ chave: `desfecho:${id}`, nome, fn: item => item.desfecho === id });
}

function filtrarDia(inicio, dias, nome) {
    const fim = somaDias(inicio, dias);
    const dentro = iso => {
        const dia = iso && diaSP(iso);
        return dia && dia >= inicio && dia < fim;
    };
    aplicarFiltro({ chave: `dia:${inicio}`, nome, fn: item => dentro(item.iniciado_em) || dentro(item.concluido_em) });
}

/* ---------------------------------------------------------------------------
 * Estrutura da tela
 * ------------------------------------------------------------------------- */

function renderRecrutamento() {
    rcSairDaAba();
    document.body.classList.add('painel--recrutamento');
    rc.filtro = null;
    APP.innerHTML = `
        <div class="an-root rc-root" id="rc_root">
            <div class="an-topo">
                <div class="an-titulo">
                    <h1>Recrutamento</h1>
                    <small id="rc_aviso">Carregando...</small>
                </div>
                <div class="an-filtros" id="rc_filtros"></div>
            </div>
            <div class="an-abas" id="rc_abas" role="tablist"></div>
            <div class="an-grade rc-grade" id="rc_grade" data-aba="${rc.aba}">
                <section class="an-card rc-c-hero" data-aba="resumo">
                    <div class="an-hero" id="rc_hero"></div>
                </section>
                <section class="an-card rc-c-funil" data-aba="funil">
                    <header><h2>Onde o funil vaza</h2><span>% que segue do degrau anterior · clique para ver quem parou</span></header>
                    <div class="an-plot" id="rc_funil"></div>
                </section>
                <section class="an-card rc-c-fila" data-aba="fila">
                    <header><h2 id="rc_t_fila">Fila de ação</h2><span id="rc_s_fila"></span></header>
                    <div class="rc-fila" id="rc_fila"></div>
                </section>
                <section class="an-card rc-c-guia" data-aba="resumo">
                    <header><h2>Guia no site</h2><span>teste anônimo · medianas</span></header>
                    <div class="rc-guia" id="rc_guia"></div>
                </section>
                <section class="an-card rc-c-agora" data-aba="agora">
                    <header><h2>Onde estão agora</h2><span id="rc_s_agora"></span></header>
                    <div class="an-plot" id="rc_agora"></div>
                </section>
                <section class="an-card rc-c-desf" data-aba="desfechos">
                    <header><h2>Como terminaram</h2><span>clique para filtrar</span></header>
                    <div class="an-origem">
                        <div class="an-plot" id="rc_rosca"></div>
                        <ul id="rc_desf_lista"></ul>
                    </div>
                </section>
                <section class="an-card rc-c-dias" data-aba="dias">
                    <header><h2 id="rc_t_dias">Por dia</h2><span class="rc-leg"><i style="background:var(--rc-novos)"></i>entraram no funil <i style="background:var(--an-acento)"></i>entraram no clã</span></header>
                    <div class="an-plot" id="rc_dias"></div>
                </section>
            </div>
            <div class="an-tooltip" id="rc_tooltip" hidden></div>
        </div>
    `;
    rcLigarDicas();
    rcDesenharFiltros();
    rcDesenharAbas();
    carregarRecrutamento();
}

// render() chama ao trocar de aba; a conversa tambem, porque ela rola.
function rcSairDaAba() {
    document.body.classList.remove('painel--recrutamento');
    if (rc.observador) {
        rc.observador.disconnect();
        rc.observador = null;
    }
}

function queryRecrutamento() {
    const params = new URLSearchParams();
    if (rc.servidor) params.set('servidor', rc.servidor);
    const dias = PERIODOS.find(([id]) => id === rc.periodo)?.[2];
    if (dias) params.set('desde', new Date(Date.now() - dias * DIA_MS_RC).toISOString());
    const texto = params.toString();
    return texto ? `?${texto}` : '';
}

function carregarRecrutamento() {
    const query = queryRecrutamento();
    const cabecalhos = { headers: getAdminRequestHeaders() };
    document.getElementById('rc_hero').innerHTML = '<div class="an-vazio">Carregando...</div>';

    Promise.all([
        fetch(`${URL_METRICAS_RECRUTAMENTO}${query}`, cabecalhos).then(resposta => {
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            return resposta.json();
        }),
        // A lista vem inteira, uma vez: com ela na mao, todo clique num grafico
        // recorta a fila sem uma nova volta ao servidor.
        fetch(`${URL_RECRUTAS}${query}${query ? '&' : '?'}estado=todos`, cabecalhos).then(resposta => {
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            return resposta.json();
        }),
    ])
        .then(([metricas, lista]) => {
            if (!document.getElementById('rc_root')) return;
            rc.metricas = metricas;
            rc.lista = lista;
            rc.filtro = null;
            rcDesenharAviso(metricas.cobertura);
            rcDesenharFiltros();
            rcDesenharGraficos();
            if (!rc.observador) {
                rc.observador = new ResizeObserver(() => {
                    cancelAnimationFrame(rc.quadro);
                    rc.quadro = requestAnimationFrame(rcDesenharGraficos);
                });
                rc.observador.observe(document.getElementById('rc_grade'));
            }
        })
        .catch(erro => {
            const hero = document.getElementById('rc_hero');
            if (hero) hero.innerHTML = '<div class="an-vazio">Não foi possível carregar o painel.</div>';
            console.error('Painel de recrutamento:', erro);
        });
}

function rcDesenharAviso(cobertura) {
    const aviso = document.getElementById('rc_aviso');
    if (!cobertura?.parcial) {
        aviso.textContent = 'Chat → Guia no site (vídeo, teste, Discord) → convite da ETZ → clã';
        return;
    }
    // Sem este aviso, as primeiras taxas parecem desempenho ruim quando sao
    // ausencia de dado: o historico de etapas so existe desde 08/09/2026.
    aviso.textContent = `${cobertura.total - cobertura.comHistorico} de ${cobertura.total} registros sem histórico de etapas: taxas parciais`;
}

function rcDesenharFiltros() {
    const servidores = [['', 'Todos'], ['apocalipse', 'Apocalipse'], ['genesis', 'Gênesis']].map(([id, nome]) => `
        <button type="button" class="${rc.servidor === id ? 'is-on' : ''}" aria-pressed="${rc.servidor === id}"
            onclick="rcTrocar({ servidor: '${id}' })">${nome}</button>`).join('');
    const periodos = PERIODOS.map(([id, nome]) => `
        <button type="button" class="${rc.periodo === id ? 'is-on' : ''}" aria-pressed="${rc.periodo === id}"
            onclick="rcTrocar({ periodo: '${id}' })">${nome}</button>`).join('');
    document.getElementById('rc_filtros').innerHTML = `
        <div class="an-seg" role="group" aria-label="Servidor">${servidores}</div>
        <div class="an-seg" role="group" aria-label="Período">${periodos}</div>
        ${rc.filtro ? `<button type="button" class="an-limpar" onclick="aplicarFiltro(null)">${textoSeguro(rc.filtro.nome)} ×</button>` : ''}
    `;
}

function rcTrocar(mudanca) {
    Object.assign(rc, mudanca);
    rcDesenharFiltros();
    carregarRecrutamento();
}

function rcDesenharAbas() {
    const abas = [['resumo', 'Resumo'], ['funil', 'Funil'], ['agora', 'Agora'], ['desfechos', 'Desfechos'], ['dias', 'Dias'], ['fila', 'Fila']];
    document.getElementById('rc_abas').innerHTML = abas.map(([id, nome]) => `
        <button type="button" role="tab" class="${rc.aba === id ? 'is-on' : ''}" aria-selected="${rc.aba === id}"
            onclick="rcTrocarAba('${id}')">${nome}</button>`).join('');
    const grade = document.getElementById('rc_grade');
    grade.dataset.aba = rc.aba;
    for (const card of grade.querySelectorAll('.an-card')) card.classList.toggle('is-aba', card.dataset.aba === rc.aba);
}

function rcTrocarAba(aba) {
    rc.aba = aba;
    rcDesenharAbas();
    rcDesenharGraficos();
}

function rcDesenharGraficos() {
    if (!rc.metricas || !document.getElementById('rc_root')) return;
    rcDesenharHero();
    rcDesenharGuia();
    rcDesenharFunil();
    rcDesenharAgora();
    rcDesenharDesfechos();
    rcDesenharDias();
    rcDesenharFila();
}

function rcCaixa(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const { width, height } = el.getBoundingClientRect();
    return width > 10 && height > 10 ? { el, w: Math.floor(width), h: Math.floor(height) } : null;
}

/* ---------------------------------------------------------------------------
 * Hero: a conversao e os numeros de apoio
 * ------------------------------------------------------------------------- */

function rcDesenharHero() {
    const { kpis } = rc.metricas;
    const periodo = PERIODOS.find(([id]) => id === rc.periodo)?.[1].toLowerCase();
    const mini = [
        [kpis.parados, 'em andamento', `filtrarDesfecho('em_andamento')`],
        [kpis.paradosMaisDeUmaSemana, 'parados +7 dias', null],
        [kpis.aguardando, 'sem responder', `filtrarAgora('resposta')`],
        [kpis.retornos ?? 0, 'ex-membros voltando', `filtrarAgora('volta')`],
    ];
    document.getElementById('rc_hero').innerHTML = `
        <span class="an-hero__rotulo">Conversão · ${rc.periodo === 'tudo' ? 'todo o período' : `últimos ${periodo}`}</span>
        <span class="an-hero__valor">${pctTexto(kpis.taxaConversao)}</span>
        <span class="an-hero__liga"><strong>${kpis.entraram}</strong> entraram no clã de <strong>${kpis.total}</strong> no funil</span>
        <div class="an-mini">${mini.map(([valor, nome, acao]) => acao
            ? `<button type="button" onclick="${acao}"><b>${valor}</b><span>${nome}</span></button>`
            : `<div><b>${valor}</b><span>${nome}</span></div>`).join('')}</div>
    `;
}

/* ---------------------------------------------------------------------------
 * Guia no site: a contagem anonima do teste (todo mundo que abriu, com ou sem
 * nick) e quanto tempo cada trecho leva. Fica fora do funil por pessoa para
 * ninguem dividir um pelo outro.
 * ------------------------------------------------------------------------- */

function rcDesenharGuia() {
    const guia = rc.metricas.guia;
    const tempos = rc.metricas.tempos || {};
    const tiles = [
        [guia ? guia.aberto : '—', 'testes abertos', 'chegaram ao fim do vídeo'],
        [guia ? guia.aprovado : '—', 'aprovados', guia?.passaram === null || !guia ? '' : `${pctTexto(guia.passaram)} dos abertos`],
        [guia?.aprovacao === null || !guia ? '—' : pctTexto(guia.aprovacao), 'aprovação', guia ? `${guia.reprovado} reprovada(s)` : 'contagem fora do ar'],
        [horasLegiveis(tempos.guia), 'para fazer o Guia', 'do link ao vínculo'],
        [horasLegiveis(tempos.convite), 'para aceitar', 'o convite da ETZ'],
        [rc.metricas.kpis.noGuia ?? '—', 'parados no Guia', 'agora'],
    ];
    document.getElementById('rc_guia').innerHTML = tiles.map(([valor, nome, nota]) => `
        <div><b>${valor}</b><span>${nome}</span>${nota ? `<small>${nota}</small>` : ''}</div>`).join('');
}

/* ---------------------------------------------------------------------------
 * Funil: uma barra por degrau, todas do mesmo tom; o degrau que mais perde
 * gente em relacao ao anterior ganha a cor de alerta e o rotulo. A taxa e
 * sempre contra o degrau ANTERIOR: e ela que aponta onde vaza.
 * ------------------------------------------------------------------------- */

function rcDesenharFunil() {
    const caixa = rcCaixa('rc_funil');
    if (!caixa) return;
    const degraus = funilCompleto();
    if (!degraus.length || !degraus[0].total && !degraus[1]?.total) {
        caixa.el.innerHTML = '<div class="an-vazio">Ninguém no funil neste recorte.</div>';
        return;
    }
    const maximo = Math.max(...degraus.map(item => item.total), 1);
    // "Abordado" so conta prospeccao; quem chegou sozinho entra direto no
    // interesse. O vazamento so se mede dali para baixo.
    let pior = null;
    degraus.forEach((item, i) => {
        if (i >= 2 && degraus[i - 1].total > 0 && item.taxa !== null && (pior === null || item.taxa < degraus[pior].taxa)) pior = i;
    });

    const linhaH = caixa.h / degraus.length;
    const barraH = Math.max(10, Math.min(30, linhaH * 0.62));
    const nomeW = Math.min(150, Math.max(96, caixa.w * 0.27));
    const taxaW = 78;
    const trilho = Math.max(20, caixa.w - nomeW - taxaW - 8);

    const corpo = degraus.map((item, i) => {
        const y = i * linhaH + (linhaH - barraH) / 2;
        const largura = item.total ? Math.max(3, (item.total / maximo) * trilho) : 0;
        const alerta = i === pior && item.taxa < 100;
        // O rotulo "maior vazamento" so cabe em linha alta; na baixa a cor basta.
        const rotuloAlerta = alerta && linhaH >= 34;
        const cor = alerta ? 'var(--rc-alerta)' : 'var(--an-acento)';
        const filtro = filtroDoDegrau(item);
        const ativo = rc.filtro?.chave === filtro.chave;
        const esmaecido = rc.filtro?.chave?.startsWith('degrau:') && !ativo;
        const perdidos = i ? Math.max(0, degraus[i - 1].total - item.total) : 0;
        const yTexto = i * linhaH + linhaH / 2 + 4;
        const dica = `<strong>${textoSeguro(item.nome)}</strong>${item.total} pessoa(s)${item.taxa !== null ? `<div class="an-tt-nota">${pctTexto(item.taxa)} do degrau anterior · ${perdidos} ficaram para trás</div>` : ''}<div class="an-tt-nota">clique para ver quem parou aqui</div>`;
        const dentro = largura > 40;
        return `<g class="${esmaecido ? 'an-esmaecido' : ''}">
            ${ativo ? `<rect class="an-sel" x="0" y="${i * linhaH}" width="${caixa.w}" height="${linhaH}" rx="6"></rect>` : ''}
            <text x="${nomeW - 10}" y="${yTexto}" text-anchor="end" class="${ativo ? 'an-forte' : ''}">${textoSeguro(item.nome)}</text>
            <rect x="${nomeW}" y="${y}" width="${trilho}" height="${barraH}" rx="4" class="rc-trilho"></rect>
            <path d="${anBarraDireita(nomeW, y, largura, barraH, 5)}" fill="${cor}"></path>
            <text x="${dentro ? nomeW + largura - 7 : nomeW + largura + 6}" y="${y + barraH / 2 + 4}" text-anchor="${dentro ? 'end' : 'start'}"
                class="${dentro ? 'rc-dentro' : 'an-forte'}" style="font-size:${barraH >= 18 ? 12 : 10.5}px">${item.total}</text>
            ${item.taxa !== null ? `<text x="${caixa.w - 2}" y="${yTexto - (rotuloAlerta ? 5 : 0)}" text-anchor="end" class="${alerta ? 'rc-alerta' : 'an-forte'}" style="font-size:12px">${pctTexto(item.taxa)}</text>` : ''}
            ${rotuloAlerta ? `<text x="${caixa.w - 2}" y="${yTexto + 9}" text-anchor="end" class="rc-alerta" style="font-size:9.5px">maior vazamento</text>` : ''}
            <rect class="an-hit" x="0" y="${i * linhaH}" width="${caixa.w}" height="${linhaH}"
                onclick="filtrarDegrau('${item.id}')" data-dica="${textoSeguro(dica)}"></rect>
        </g>`;
    }).join('');

    caixa.el.innerHTML = `<svg width="${caixa.w}" height="${caixa.h}" role="img" aria-label="Funil de recrutamento">${corpo}</svg>`;
}

/* ---------------------------------------------------------------------------
 * Onde estao agora: quem ainda nao terminou, por trecho. Barras deitadas, cor
 * pela fase; o trecho vazio fica de fora para nao gastar linha.
 * ------------------------------------------------------------------------- */

function rcDesenharAgora() {
    const caixa = rcCaixa('rc_agora');
    if (!caixa) return;
    const contagem = new Map();
    for (const item of rc.lista) {
        const grupo = agoraDe(item);
        if (grupo) contagem.set(grupo, (contagem.get(grupo) || 0) + 1);
    }
    const linhas = AGORA.map(item => ({ ...item, total: contagem.get(item.id) || 0 })).filter(item => item.total > 0);
    const total = linhas.reduce((soma, item) => soma + item.total, 0);
    document.getElementById('rc_s_agora').textContent = total ? `${total} pessoas` : '';
    if (!linhas.length) {
        caixa.el.innerHTML = '<div class="an-vazio">Ninguém parado agora.</div>';
        return;
    }

    const linhaH = Math.min(30, caixa.h / linhas.length);
    const barraH = Math.max(8, Math.min(16, linhaH * 0.6));
    const nomeW = Math.min(175, Math.max(118, caixa.w * 0.56));
    const fonte = linhaH < 20 ? 10 : 11;
    const trilho = Math.max(20, caixa.w - nomeW - 34);
    const maximo = Math.max(...linhas.map(item => item.total), 1);

    const corpo = linhas.map((item, i) => {
        const y = i * linhaH + (linhaH - barraH) / 2;
        const largura = Math.max(3, (item.total / maximo) * trilho);
        const fase = FASES[item.fase];
        const ativo = rc.filtro?.chave === `agora:${item.id}`;
        const esmaecido = rc.filtro?.chave?.startsWith('agora:') && !ativo;
        const yTexto = i * linhaH + linhaH / 2 + 4;
        const dica = `<strong>${textoSeguro(item.nome)}</strong>${item.total} pessoa(s) · ${pctTexto(pct(item.total, total))}<div class="an-tt-nota">${fase.nome}${item.nota ? ` · ${item.nota}` : ''} · clique para ver quem</div>`;
        return `<g class="${esmaecido ? 'an-esmaecido' : ''}">
            ${ativo ? `<rect class="an-sel" x="0" y="${i * linhaH}" width="${caixa.w}" height="${linhaH}" rx="6"></rect>` : ''}
            <text x="${nomeW - 8}" y="${yTexto}" text-anchor="end" class="${ativo ? 'an-forte' : ''}" style="font-size:${fonte}px">${textoSeguro(item.nome)}</text>
            <path d="${anBarraDireita(nomeW, y, largura, barraH)}" fill="${fase.cor}"></path>
            <text x="${nomeW + largura + 6}" y="${yTexto}" class="an-forte" style="font-size:11px">${item.total}</text>
            <rect class="an-hit" x="0" y="${i * linhaH}" width="${caixa.w}" height="${linhaH}"
                onclick="filtrarAgora('${item.id}')" data-dica="${textoSeguro(dica)}"></rect>
        </g>`;
    }).join('');
    caixa.el.innerHTML = `<svg width="${caixa.w}" height="${caixa.h}" role="img" aria-label="Onde estão agora">${corpo}</svg>`;
}

/* ---------------------------------------------------------------------------
 * Desfechos: rosca com a legenda ao lado, igual a de origens do Analises.
 * ------------------------------------------------------------------------- */

function rcDesenharDesfechos() {
    const porId = Object.fromEntries((rc.metricas.desfechos || []).map(item => [item.desfecho, item]));
    const fatias = DESFECHOS.filter(item => porId[item.id]?.total).map(item => ({ ...item, dado: porId[item.id] }));
    const total = fatias.reduce((soma, item) => soma + item.dado.total, 0);
    const lista = document.getElementById('rc_desf_lista');
    const caixa = rcCaixa('rc_rosca');
    if (!total) {
        lista.innerHTML = '';
        if (caixa) caixa.el.innerHTML = '<div class="an-vazio">Sem registros.</div>';
        return;
    }
    const ativoDe = id => rc.filtro?.chave === `desfecho:${id}`;
    lista.innerHTML = fatias.map(item => `<li><button type="button" class="${ativoDe(item.id) ? 'is-on' : ''}" aria-pressed="${ativoDe(item.id)}"
        onclick="filtrarDesfecho('${item.id}')">
        <i style="background:${item.cor}"></i><span>${item.nome}<small>${pctTexto(pct(item.dado.total, total))}</small></span><b>${item.dado.total}</b>
    </button></li>`).join('');
    if (!caixa) return;

    const raio = Math.max(20, Math.min(caixa.w, caixa.h) / 2 - 4);
    const espessura = Math.max(10, raio * 0.36);
    const cx = caixa.w / 2;
    const cy = caixa.h / 2;
    const p = (rad, a) => `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
    const algumAtivo = rc.filtro?.chave?.startsWith('desfecho:');
    let angulo = -Math.PI / 2;
    const arcos = fatias.map(item => {
        const fatia = (item.dado.total / total) * Math.PI * 2;
        const ini = angulo;
        const fim = angulo + fatia;
        angulo = fim;
        const grande = fatia > Math.PI ? 1 : 0;
        const ext = raio;
        const int = raio - espessura;
        // Fatia unica: dois arcos de meia volta, porque um arco de 360° some.
        const d = fatias.length === 1
            ? `M${p(ext, -Math.PI / 2)}A${ext},${ext} 0 1 1 ${p(ext, Math.PI / 2)}A${ext},${ext} 0 1 1 ${p(ext, -Math.PI / 2)}M${p(int, -Math.PI / 2)}A${int},${int} 0 1 0 ${p(int, Math.PI / 2)}A${int},${int} 0 1 0 ${p(int, -Math.PI / 2)}Z`
            : `M${p(ext, ini)}A${ext},${ext} 0 ${grande} 1 ${p(ext, fim)}L${p(int, fim)}A${int},${int} 0 ${grande} 0 ${p(int, ini)}Z`;
        const motivos = Object.entries(item.dado.motivos || {}).map(([motivo, qtd]) => `${textoSeguro(motivo)} (${qtd})`).join(', ');
        const dica = `<strong>${item.nome}</strong>${item.dado.total} · ${pctTexto(pct(item.dado.total, total))}${motivos ? `<div class="an-tt-nota">${motivos}</div>` : ''}`;
        return `<path d="${d}" fill="${item.cor}" stroke="var(--an-surface)" stroke-width="2" fill-rule="evenodd"
            class="${algumAtivo && !ativoDe(item.id) ? 'an-esmaecido' : ''}" style="cursor:pointer"
            onclick="filtrarDesfecho('${item.id}')" data-dica="${textoSeguro(dica)}"></path>`;
    }).join('');

    caixa.el.innerHTML = `
        <svg width="${caixa.w}" height="${caixa.h}" role="img" aria-label="Como terminaram">
            ${arcos}
            <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="an-forte" style="font-size:${Math.max(12, raio * 0.3)}px">${total}</text>
            <text x="${cx}" y="${cy + Math.max(12, raio * 0.22)}" text-anchor="middle" class="an-fraco" style="font-size:10px">registros</text>
        </svg>`;
}

/* ---------------------------------------------------------------------------
 * Por dia: quem entrou no funil e quem chegou ao cla. Sao as duas pontas da
 * MESMA jornada, no mesmo eixo, lado a lado. Com mais de 45 dias na tela, o
 * balde vira a semana.
 * ------------------------------------------------------------------------- */

function rcBaldes() {
    const hoje = diaSP(new Date());
    const dias = PERIODOS.find(([id]) => id === rc.periodo)?.[2];
    let inicio = dias ? somaDias(hoje, -(dias - 1)) : null;
    if (!inicio) {
        const datas = rc.lista.map(item => item.iniciado_em && diaSP(item.iniciado_em)).filter(Boolean).sort();
        inicio = datas[0] || somaDias(hoje, -6);
        // Pelo menos uma semana na tela: tres colunas gordas nao parecem serie.
        if (inicio > somaDias(hoje, -6)) inicio = somaDias(hoje, -6);
    }
    const span = Math.round((new Date(`${hoje}T12:00:00Z`) - new Date(`${inicio}T12:00:00Z`)) / DIA_MS_RC) + 1;
    const semanal = span > 45;
    const passo = semanal ? 7 : 1;
    const primeiro = semanal ? segundaDe(inicio) : inicio;
    const baldes = [];
    for (let chave = primeiro; chave <= hoje; chave = somaDias(chave, passo)) baldes.push({ chave, novos: 0, entraram: 0 });
    const indice = new Map(baldes.map((balde, i) => [balde.chave, i]));
    const baldeDe = iso => {
        const dia = iso && diaSP(iso);
        if (!dia) return null;
        const i = indice.get(semanal ? segundaDe(dia) : dia);
        return i === undefined ? null : baldes[i];
    };
    for (const item of rc.lista) {
        if (item.retorno) continue;
        const nasceu = baldeDe(item.iniciado_em);
        if (nasceu) nasceu.novos += 1;
        const entrou = item.desfecho === 'entrou' ? baldeDe(item.concluido_em) : null;
        if (entrou) entrou.entraram += 1;
    }
    return { baldes, semanal, passo, hoje };
}

function rcDesenharDias() {
    const caixa = rcCaixa('rc_dias');
    if (!caixa) return;
    const { baldes, semanal, passo, hoje } = rcBaldes();
    document.getElementById('rc_t_dias').textContent = semanal ? 'Por semana' : 'Por dia';
    const maximo = Math.max(...baldes.flatMap(item => [item.novos, item.entraram]), 1);
    const ticks = anTicks(maximo, 3);
    const topo = ticks[ticks.length - 1];
    const m = { t: 14, r: 4, b: 20, l: 28 };
    const pw = caixa.w - m.l - m.r;
    const ph = caixa.h - m.t - m.b;
    const banda = pw / baldes.length;
    const coluna = Math.max(2, Math.min(18, (banda * 0.72) / 2));
    const y = v => m.t + ph - (v / topo) * ph;
    const cadaRotulo = Math.max(1, Math.ceil(40 / banda));

    const grade = ticks.map(t => `
        <line class="an-grid" x1="${m.l}" x2="${caixa.w - m.r}" y1="${y(t)}" y2="${y(t)}"></line>
        <text x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join('');

    const colunas = baldes.map((balde, k) => {
        const centro = m.l + k * banda + banda / 2;
        const nome = semanal ? `Semana de ${diaRotulo(balde.chave)}` : (balde.chave === hoje ? `Hoje (${diaRotulo(balde.chave)})` : diaRotulo(balde.chave));
        const ativo = rc.filtro?.chave === `dia:${balde.chave}`;
        const esmaecido = rc.filtro?.chave?.startsWith('dia:') && !ativo;
        const dica = `<strong>${nome}</strong>${balde.novos} entraram no funil<br>${balde.entraram} entraram no clã<div class="an-tt-nota">clique para ver quem</div>`;
        const rotulo = k % cadaRotulo === 0
            ? `<text x="${centro}" y="${caixa.h - 5}" text-anchor="middle">${diaRotulo(balde.chave)}</text>` : '';
        const valor = (v, x) => (v && banda >= 22 ? `<text x="${x + coluna / 2}" y="${y(v) - 4}" text-anchor="middle" class="an-forte" style="font-size:10px">${v}</text>` : '');
        return `<g class="${esmaecido ? 'an-esmaecido' : ''}">
            ${ativo ? `<rect class="an-sel" x="${m.l + k * banda + 1}" y="${m.t - 6}" width="${banda - 2}" height="${ph + 6}" rx="6"></rect>` : ''}
            <path d="${anBarraTopo(centro - coluna - 1, y(balde.novos), coluna, y(0) - y(balde.novos), 3)}" fill="var(--rc-novos)"></path>
            <path d="${anBarraTopo(centro + 1, y(balde.entraram), coluna, y(0) - y(balde.entraram), 3)}" fill="var(--an-acento)"></path>
            ${valor(balde.novos, centro - coluna - 1)}${valor(balde.entraram, centro + 1)}
            ${rotulo}
            <rect class="an-hit" x="${m.l + k * banda}" y="${m.t}" width="${banda}" height="${ph}"
                onclick="filtrarDia('${balde.chave}', ${passo}, '${nome}')" data-dica="${textoSeguro(dica)}"></rect>
        </g>`;
    }).join('');

    caixa.el.innerHTML = `
        <svg width="${caixa.w}" height="${caixa.h}" role="img" aria-label="Entradas por ${semanal ? 'semana' : 'dia'}">
            ${grade}
            <line class="an-base" x1="${m.l}" x2="${caixa.w - m.r}" y1="${y(0)}" y2="${y(0)}"></line>
            ${colunas}
        </svg>`;
}

/* ---------------------------------------------------------------------------
 * Fila de acao: sem recorte, quem esta no meio do recrutamento, do mais parado
 * para o mais recente. A lista rola dentro do cartao; a pagina nao.
 * ------------------------------------------------------------------------- */

function rcDesenharFila() {
    const lista = rc.filtro
        ? rc.lista.filter(rc.filtro.fn)
        : rc.lista.filter(item => item.desfecho === 'em_andamento');
    document.getElementById('rc_t_fila').textContent = rc.filtro ? rc.filtro.nome : 'Fila de ação';
    document.getElementById('rc_s_fila').textContent = `${lista.length} pessoa(s)`;
    const alvo = document.getElementById('rc_fila');
    if (!lista.length) {
        alvo.innerHTML = '<div class="an-vazio">Ninguém neste recorte.</div>';
        return;
    }
    alvo.innerHTML = lista.map(item => {
        const grupo = AGORA.find(g => g.id === agoraDe(item));
        const cor = grupo ? FASES[grupo.fase].cor : (DESFECHOS.find(d => d.id === item.desfecho)?.cor || 'var(--rc-neutro)');
        const passo = proximoPasso(item);
        const origem = item.retorno ? 'Ex-membro' : (item.origem === 'prospeccao' ? 'Prospecção' : 'Orgânico');
        const parado = item.dias_parado === null || item.dias_parado === undefined ? '' : `${item.dias_parado}d`;
        const quente = (item.dias_parado ?? 0) >= 7 && item.desfecho === 'em_andamento';
        return `<div class="rc-item">
            <i style="background:${cor}"></i>
            <div class="rc-item__quem">
                <strong>${textoSeguro(item.nick)}</strong>
                <span>${item.servidor === 'genesis' ? 'Gênesis' : 'Apocalipse'} · ${origem}</span>
            </div>
            <div class="rc-item__passo">${passo === '—' ? textoSeguro(rotuloEtapa(item.desfecho === 'entrou' ? 'complete' : item.etapa, item.retorno)) : textoSeguro(passo)}</div>
            <span class="rc-item__dias${quente ? ' is-quente' : ''}" title="Parado há">${parado}</span>
            <button type="button" class="rc-item__log" value="${item.id}" ${item.tem_conversa ? '' : 'disabled title="Sem conversa gravada"'}
                onclick="renderConversaRecruta(event)" aria-label="Conversa de ${textoSeguro(item.nick)}"><i class="fa-regular fa-comments" aria-hidden="true"></i></button>
        </div>`;
    }).join('');
}

/* ---------------------------------------------------------------------------
 * Dica flutuante: fixa na viewport (nao estica nada), um ouvinte so para todas
 * as marcas, conteudo vindo de data-dica (ja escapado na montagem).
 * ------------------------------------------------------------------------- */

function rcMoverDica(event) {
    const dica = document.getElementById('rc_tooltip');
    if (!dica) return;
    const alvo = event.target.closest('[data-dica]');
    if (!alvo) {
        dica.hidden = true;
        return;
    }
    dica.innerHTML = alvo.getAttribute('data-dica');
    dica.hidden = false;
    const caixa = dica.getBoundingClientRect();
    const margem = 14;
    const direita = event.clientX + margem + caixa.width > window.innerWidth;
    const abaixo = event.clientY + margem + caixa.height > window.innerHeight;
    dica.style.left = `${Math.max(4, direita ? event.clientX - margem - caixa.width : event.clientX + margem)}px`;
    dica.style.top = `${Math.max(4, abaixo ? event.clientY - margem - caixa.height : event.clientY + margem)}px`;
}

function rcEsconderDica() {
    const dica = document.getElementById('rc_tooltip');
    if (dica) dica.hidden = true;
}

function rcLigarDicas() {
    const raiz = document.getElementById('rc_root');
    raiz.addEventListener('mousemove', rcMoverDica);
    raiz.addEventListener('mouseleave', rcEsconderDica);
    raiz.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'mouse') rcMoverDica(event);
    });
}

// Sem modal: o painel não tem um, e a sub-view dentro do #app é o caminho que a
// tela de edição já usa.
function renderConversaRecruta(event) {
    abrirConversaRecruta(event.currentTarget.getAttribute('value'));
}

/* ---------------------------------------------------------------------------
 * Link direto da conversa: painel.html#log=<servidor>/<nick>. E o botao do
 * aviso de prospeccao no Telegram (01/10/2026). Quem chega sem login passa pela
 * tela de login e perde o hash, entao ele fica guardado na sessao ate o painel
 * confirmar que e lider.
 * ------------------------------------------------------------------------- */
const LOG_PENDENTE = 'ety-log-pendente';

function lerLinkDeConversa() {
    const doHash = /^#log=([^/]+)\/(.+)$/.exec(location.hash);
    if (doHash) {
        try { sessionStorage.setItem(LOG_PENDENTE, location.hash); } catch (_) {}
        return { servidor: decodeURIComponent(doHash[1]), nick: decodeURIComponent(doHash[2]) };
    }
    let guardado = null;
    try { guardado = sessionStorage.getItem(LOG_PENDENTE); } catch (_) {}
    const match = guardado && /^#log=([^/]+)\/(.+)$/.exec(guardado);
    return match ? { servidor: decodeURIComponent(match[1]), nick: decodeURIComponent(match[2]) } : null;
}

async function abrirConversaDoLink() {
    const pedido = lerLinkDeConversa();
    if (!pedido) return;
    try { sessionStorage.removeItem(LOG_PENDENTE); } catch (_) {}
    history.replaceState(null, '', location.pathname + location.search);
    rcSairDaAba();
    const aba = document.getElementById('recrutamento');
    if (aba) selectItem(aba);
    APP.innerHTML = '';
    renderLoading(APP);
    try {
        const resposta = await fetch(`${URL_RECRUTAS}?servidor=${encodeURIComponent(pedido.servidor)}&estado=todos`, { headers: getAdminRequestHeaders() });
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        const lista = await resposta.json();
        const alvo = String(pedido.nick).trim().toLowerCase();
        const recruta = lista.find(item => String(item.nick).trim().toLowerCase() === alvo);
        if (recruta) {
            abrirConversaRecruta(recruta.id);
            return;
        }
        APP.innerHTML = `
            <div class="pending-page">
                <header class="pending-page__intro">
                    <span class="pending-page__eyebrow">Conversa</span>
                    <h1>${textoSeguro(pedido.nick)}</h1>
                    <p>A conversa ainda não chegou ao site: o bot sincroniza o funil a cada 30 minutos. Tente de novo daqui a pouco.</p>
                    <button type="button" class="btn btn-danger" onclick="recrutamento.click()">Ir para o Recrutamento</button>
                </header>
            </div>`;
    } catch (erro) {
        APP.innerHTML = '<p class="table-message">Não foi possível abrir a conversa.</p>';
        console.error('Link da conversa:', erro);
    }
}

lerLinkDeConversa();
document.addEventListener('painel:lider', abrirConversaDoLink);

function abrirConversaRecruta(id) {
    // A conversa rola: sai do modo tela cheia do dashboard.
    rcSairDaAba();
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
