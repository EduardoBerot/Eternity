// Aba Analises do painel (so lideres), 01/10/2026.
//
// O bot do Discord publica o historico da Liga ja somado, numa tabela de fatos
// (jogador x semana x origem), e o site guarda o pacote inteiro (~10 KB). Tudo
// aqui e recorte local sobre esse pacote: trocar servidor, mes, jogador ou
// origem redesenha na hora, sem nova volta ao servidor.
//
// Os graficos sao SVG escritos a mao, no tamanho medido de cada caixa: a tela
// cabe sempre na janela (analises.css), e um ResizeObserver redesenha quando
// ela muda. Sem biblioteca: sao seis desenhos simples, e uma lib de graficos
// pesaria mais que o painel inteiro.

const URL_ANALISE = `${URL_BASE}/api/analise`;

const AN_ORIGENS = {
    torneios: { nome: 'Torneios', cor: 'var(--an-torneios)' },
    eventos: { nome: 'Eventos', cor: 'var(--an-eventos)' },
    desafios: { nome: 'Desafios', cor: 'var(--an-desafios)' },
    votos: { nome: 'Votos', cor: 'var(--an-votos)' },
    vip: { nome: 'VIP', cor: 'var(--an-vip)' },
    ajustes: { nome: 'Ajustes', cor: 'var(--an-ajustes)' },
};

const AN_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const AN_MESES_LONGOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const an = {
    dados: null,
    servidor: 0,
    mes: null,
    jogador: null,
    origem: null,
    aba: 'resumo',
    observador: null,
    quadro: 0,
    caixas: null,
};

/* ---------------------------------------------------------------------------
 * Utilitarios
 * ------------------------------------------------------------------------- */

const anNum = valor => Math.round(valor).toLocaleString('pt-BR');

function anCurto(valor) {
    const abs = Math.abs(valor);
    if (abs >= 10000) return `${(valor / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`;
    if (abs >= 1000) return `${(valor / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
    return anNum(valor);
}

function anEsc(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function anMesRotulo(chave, longo = false) {
    const [ano, mes] = chave.split('-').map(Number);
    return longo ? `${AN_MESES_LONGOS[mes - 1]} de ${ano}` : AN_MESES[mes - 1];
}

// Ticks "redondos" para o eixo: 3 ou 4 linhas, nunca 7,3.
function anTicks(maximo, alvo = 4) {
    if (maximo <= 0) return [0];
    const bruto = maximo / alvo;
    const ordem = 10 ** Math.floor(Math.log10(bruto));
    const passo = [1, 2, 2.5, 5, 10].map(m => m * ordem).find(p => p >= bruto);
    const ticks = [];
    for (let v = 0; v <= maximo + passo * 0.001; v += passo) ticks.push(v);
    if (ticks[ticks.length - 1] < maximo) ticks.push(ticks[ticks.length - 1] + passo);
    return ticks;
}

// As caixas sao medidas todas de uma vez, antes de qualquer escrita
// (anDesenharGraficos): medir depois de cada innerHTML forcava um reflow por
// grafico.
function anCaixa(id) {
    if (an.caixas?.has(id)) return an.caixas.get(id);
    const el = document.getElementById(id);
    if (!el) return null;
    const { width, height } = el.getBoundingClientRect();
    return width > 10 && height > 10 ? { el, w: Math.floor(width), h: Math.floor(height) } : null;
}

// Retangulo com so o topo arredondado (a ponta do dado); a base fica reta,
// encostada na linha de base.
function anBarraTopo(x, y, w, h, r = 4) {
    if (h <= 0 || w <= 0) return '';
    const rr = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

// Mesmo desenho, deitado: ponta arredondada a direita.
function anBarraDireita(x, y, w, h, r = 4) {
    if (h <= 0 || w <= 0) return '';
    const rr = Math.min(r, h / 2, w);
    return `M${x},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h - rr}Q${x + w},${y + h} ${x + w - rr},${y + h}H${x}Z`;
}

/* ---------------------------------------------------------------------------
 * Recortes
 * ------------------------------------------------------------------------- */

function anServidor() {
    return an.dados?.servidores?.[an.servidor] || null;
}

// Tudo o que os graficos precisam, numa passada so sobre os fatos. Cada
// grafico ignora o filtro que ele mesmo controla: o ranking mostra todos os
// jogadores (com o escolhido em destaque), a rosca todas as origens e as barras
// do mes todos os meses -- e isso que deixa o clique num deles trocar o recorte
// sem a escolha sumir da tela.
function anRecorte() {
    const s = anServidor();
    const origens = an.dados.origens;
    const nO = origens.length;
    const contas = new Set(s.contasDoCla);
    const noMes = s.semanas.map(semana => !an.mes || semana.mes === an.mes);
    const semanasIdx = s.semanas.map((_, i) => i).filter(i => noMes[i]);
    const meses = [...new Set(s.semanas.map(semana => semana.mes))];
    const mesIdx = new Map(meses.map((mes, i) => [mes, i]));

    const porSemana = s.semanas.map(() => new Array(nO).fill(0));
    const porOrigem = new Array(nO).fill(0);
    const registrosOrigem = new Array(nO).fill(0);
    const porJogador = s.jogadores.map(() => new Array(nO).fill(0));
    const porMes = meses.map(() => new Array(nO).fill(0));
    const ativosSemana = s.semanas.map(() => new Set());

    for (const [j, w, o, pontos, registros] of s.fatos) {
        const doJogador = an.jogador === null || j === an.jogador;
        const daOrigem = an.origem === null || o === an.origem;
        if (doJogador && daOrigem) porMes[mesIdx.get(s.semanas[w].mes)][o] += pontos;
        if (!noMes[w]) continue;
        if (doJogador) {
            porOrigem[o] += pontos;
            if (daOrigem) registrosOrigem[o] += registros;
        }
        if (!daOrigem) continue;
        porJogador[j][o] += pontos;
        if (pontos > 0 && !contas.has(j)) {
            ativosSemana[w].add(j);
        }
        if (doJogador) porSemana[w][o] += pontos;
    }

    const soma = linha => linha.reduce((a, b) => a + b, 0);
    const ranking = s.jogadores
        .map((nome, i) => ({ i, nome, origens: porJogador[i], total: soma(porJogador[i]) }))
        .filter(item => !contas.has(item.i) && item.total > 0)
        .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));

    return {
        s,
        origens,
        semanasIdx,
        meses,
        porSemana,
        porOrigem,
        registrosOrigem,
        porMes,
        ranking,
        ativosSemana,
        total: an.origem === null ? soma(porOrigem) : porOrigem[an.origem],
    };
}

/* ---------------------------------------------------------------------------
 * Estrutura da tela
 * ------------------------------------------------------------------------- */

function renderAnalises() {
    document.body.classList.add('painel--analises');
    APP.innerHTML = `
        <div class="an-root" id="an_root">
            <div class="an-topo">
                <div class="an-titulo">
                    <h1>Análises da Liga</h1>
                    <small id="an_atualizado">Carregando...</small>
                </div>
                <div class="an-filtros" id="an_filtros"></div>
            </div>
            <div class="an-abas" id="an_abas" role="tablist"></div>
            <div class="an-grade" id="an_grade" data-aba="${an.aba}">
                <section class="an-card an-c-semanas" data-aba="semanas">
                    <header><h2 id="an_t_semanas">Pontos por semana</h2><span>por origem</span></header>
                    <div class="an-plot" id="an_semanas"></div>
                </section>
                <section class="an-card an-c-hero" data-aba="resumo">
                    <div class="an-hero" id="an_hero"></div>
                </section>
                <section class="an-card an-c-partic" data-aba="partic">
                    <header><h2 id="an_t_partic">Participação por semana</h2><span id="an_s_partic"></span></header>
                    <div class="an-plot" id="an_partic"></div>
                </section>
                <section class="an-card an-c-origem" data-aba="resumo">
                    <header><h2>Pontos por origem</h2><span>clique para filtrar</span></header>
                    <div class="an-origem">
                        <div class="an-plot" id="an_rosca"></div>
                        <ul id="an_origem_lista"></ul>
                    </div>
                </section>
                <section class="an-card an-c-ranking" data-aba="ranking">
                    <header><h2>Pontos por jogador</h2><span id="an_s_ranking"></span></header>
                    <div class="an-plot" id="an_ranking"></div>
                </section>
                <section class="an-card an-c-meses" data-aba="meses">
                    <header><h2>Pontos do clã por mês</h2><span>e a posição na Liga</span></header>
                    <div class="an-plot" id="an_meses"></div>
                </section>
            </div>
            <div class="an-tooltip" id="an_tooltip" hidden></div>
        </div>
    `;
    anLigarDicas();
    anCarregar();
}

function anSairDaAba() {
    document.body.classList.remove('painel--analises');
    if (an.observador) {
        an.observador.disconnect();
        an.observador = null;
    }
}

function anCarregar() {
    const hero = document.getElementById('an_hero');
    hero.innerHTML = '<div class="an-vazio">Carregando...</div>';
    fetch(URL_ANALISE, { headers: getAdminRequestHeaders() })
        .then(resposta => {
            if (resposta.status === 404) throw new Error('sem-dados');
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            return resposta.json();
        })
        .then(dados => {
            if (!dados?.servidores?.length) throw new Error('sem-dados');
            an.dados = dados;
            if (an.servidor >= dados.servidores.length) an.servidor = 0;
            anValidarFiltros();
            const quando = new Date(dados.geradoEm);
            document.getElementById('an_atualizado').textContent = Number.isNaN(quando.getTime())
                ? 'Histórico da Liga desde agosto de 2026'
                : `Histórico da Liga · atualizado ${quando.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`;
            anDesenharTudo();
            an.observador = new ResizeObserver(() => {
                cancelAnimationFrame(an.quadro);
                an.quadro = requestAnimationFrame(anDesenharGraficos);
            });
            an.observador.observe(document.getElementById('an_grade'));
        })
        .catch(erro => {
            const texto = erro.message === 'sem-dados'
                ? 'O bot ainda não publicou as análises. Elas chegam em até 15 minutos.'
                : 'Não foi possível carregar as análises agora.';
            hero.innerHTML = `<div class="an-vazio">${texto}</div>`;
            document.getElementById('an_atualizado').textContent = '';
            console.error('Analises:', erro);
        });
}

// Ao trocar de servidor, um mes ou jogador que la nao existe vira "todos".
function anValidarFiltros() {
    const s = anServidor();
    if (an.mes && !s.semanas.some(semana => semana.mes === an.mes)) an.mes = null;
    if (an.jogador !== null && an.jogador >= s.jogadores.length) an.jogador = null;
}

function anDesenharTudo() {
    anDesenharFiltros();
    anDesenharAbas();
    anDesenharGraficos();
}

const AN_PLOTS = ['an_semanas', 'an_partic', 'an_rosca', 'an_ranking', 'an_meses'];

function anDesenharGraficos() {
    if (!an.dados || !document.getElementById('an_root')) return;
    an.caixas = new Map(AN_PLOTS.map(id => [id, anCaixa(id)]));
    const r = anRecorte();
    anDesenharHero(r);
    anDesenharOrigem(r);
    anDesenharSemanas(r);
    anDesenharParticipacao(r);
    anDesenharRanking(r);
    anDesenharMeses(r);
    an.caixas = null;
}

function anDesenharFiltros() {
    const s = anServidor();
    const meses = [...new Set(s.semanas.map(semana => semana.mes))];
    const servidores = an.dados.servidores.map((item, i) => `
        <button type="button" class="${i === an.servidor ? 'is-on' : ''}" aria-pressed="${i === an.servidor}"
            onclick="anFiltrar({ servidor: ${i} })">${item.servidor === 'genesis' ? 'Gênesis' : 'Apocalipse'}</button>`).join('');
    const botoesMes = [`<button type="button" class="${an.mes ? '' : 'is-on'}" aria-pressed="${!an.mes}" onclick="anFiltrar({ mes: null })">Tudo</button>`]
        .concat(meses.map(mes => `
        <button type="button" class="${an.mes === mes ? 'is-on' : ''}" aria-pressed="${an.mes === mes}"
            onclick="anFiltrar({ mes: '${mes}' })">${anMesRotulo(mes)}</button>`)).join('');

    // Jogadores do servidor, do que mais pontuou ao que menos, sem as contas do cla.
    const contas = new Set(s.contasDoCla);
    const totais = new Map();
    for (const [j, , , pontos] of s.fatos) totais.set(j, (totais.get(j) || 0) + pontos);
    const jogadores = s.jogadores
        .map((nome, i) => ({ nome, i, total: totais.get(i) || 0 }))
        .filter(item => !contas.has(item.i) && item.total > 0)
        .sort((a, b) => b.total - a.total);
    const opcoes = ['<option value="">Todos os jogadores</option>']
        .concat(jogadores.map(item => `<option value="${item.i}" ${an.jogador === item.i ? 'selected' : ''}>${anEsc(item.nome)}</option>`)).join('');

    const legenda = an.dados.origens.map((origem, i) => {
        const meta = AN_ORIGENS[origem] || { nome: origem, cor: 'var(--an-ajustes)' };
        return `<button type="button" class="an-leg${an.origem === i ? ' is-on' : ''}" aria-pressed="${an.origem === i}"
            onclick="anFiltrar({ origem: ${an.origem === i ? 'null' : i} })"><i style="background:${meta.cor}"></i>${meta.nome}</button>`;
    }).join('');

    const algumFiltro = an.mes || an.jogador !== null || an.origem !== null;
    document.getElementById('an_filtros').innerHTML = `
        ${an.dados.servidores.length > 1 ? `<div class="an-seg" role="group" aria-label="Servidor">${servidores}</div>` : ''}
        <div class="an-seg" role="group" aria-label="Período">${botoesMes}</div>
        <select class="an-select" aria-label="Jogador" onchange="anFiltrar({ jogador: this.value === '' ? null : Number(this.value) })">${opcoes}</select>
        <div class="an-legenda${an.origem !== null ? ' tem-foco' : ''}" role="group" aria-label="Origem dos pontos">${legenda}</div>
        ${algumFiltro ? '<button type="button" class="an-limpar" onclick="anFiltrar({ mes: null, jogador: null, origem: null })">Limpar</button>' : ''}
    `;
}

function anDesenharAbas() {
    const abas = [['resumo', 'Resumo'], ['semanas', 'Semanas'], ['partic', 'Participação'], ['ranking', 'Jogadores'], ['meses', 'Meses']];
    document.getElementById('an_abas').innerHTML = abas.map(([id, nome]) => `
        <button type="button" role="tab" class="${an.aba === id ? 'is-on' : ''}" aria-selected="${an.aba === id}"
            onclick="anTrocarAba('${id}')">${nome}</button>`).join('');
    const grade = document.getElementById('an_grade');
    grade.dataset.aba = an.aba;
    for (const card of grade.querySelectorAll('.an-card')) card.classList.toggle('is-aba', card.dataset.aba === an.aba);
}

function anTrocarAba(aba) {
    an.aba = aba;
    anDesenharAbas();
    anDesenharGraficos();
}

function anFiltrar(mudanca) {
    if ('servidor' in mudanca && mudanca.servidor !== an.servidor) {
        an.jogador = null;
    }
    Object.assign(an, mudanca);
    anValidarFiltros();
    anEsconderDica();
    anDesenharFiltros();
    anDesenharGraficos();
}

/* ---------------------------------------------------------------------------
 * Hero: a pontuacao do recorte, e o que a Liga diz dela
 * ------------------------------------------------------------------------- */

function anDesenharHero(r) {
    const alvo = document.getElementById('an_hero');
    const { s } = r;
    const jogador = an.jogador !== null ? s.jogadores[an.jogador] : null;
    const origem = an.origem !== null ? AN_ORIGENS[r.origens[an.origem]]?.nome : null;
    const periodo = an.mes ? anMesRotulo(an.mes, true) : 'todo o histórico';

    let rotulo = `Pontuação · ${periodo}`;
    if (jogador) rotulo = `${anEsc(jogador)} · ${periodo}`;
    if (origem) rotulo += ` · ${origem}`;

    let linhaLiga = '';
    if (jogador) {
        const pos = r.ranking.findIndex(item => item.i === an.jogador);
        const totalCla = r.ranking.reduce((soma, item) => soma + item.total, 0);
        const parte = totalCla ? Math.round((r.total / totalCla) * 1000) / 10 : 0;
        linhaLiga = pos >= 0
            ? `<strong>${pos + 1}º</strong> no clã · <strong>${parte.toLocaleString('pt-BR')}%</strong> dos pontos dos jogadores`
            : 'Não pontuou neste recorte';
    } else {
        const mesLiga = an.mes || Object.keys(s.liga || {}).sort().pop();
        const liga = mesLiga ? s.liga?.[mesLiga] : null;
        if (liga) {
            const quando = an.mes ? '' : ` em ${anMesRotulo(mesLiga)}`;
            linhaLiga = liga.posicao
                ? `<strong>${liga.posicao}º</strong> na Liga${quando}${liga.final ? '' : ' (ao vivo)'}${liga.pontos ? ` · ${anNum(liga.pontos)} pts oficiais` : ''}`
                : `Fora do pódio${quando}`;
        }
    }

    // Banimento entra negativo no total; os graficos de barra so somam ganhos.
    const iAjuste = r.origens.indexOf('ajustes');
    const ajuste = an.origem === null || an.origem === iAjuste ? Math.min(r.porOrigem[iAjuste] || 0, 0) : 0;
    const reg = r.registrosOrigem;
    const idx = nome => r.origens.indexOf(nome);
    const mini = [
        // Os mesmos jogadores do ranking ao lado: quem ficou no saldo negativo
        // (banido) pontuou, mas nao conta.
        [r.ranking.length, jogador ? 'semanas' : 'jogadores'],
        [reg[idx('torneios')] || 0, 'pódios'],
        [reg[idx('eventos')] || 0, 'eventos'],
        [reg[idx('desafios')] || 0, 'desafios'],
    ];
    if (jogador) mini[0][0] = r.semanasIdx.filter(w => r.porSemana[w].some(v => v > 0)).length;

    alvo.innerHTML = `
        <span class="an-hero__rotulo">${rotulo}</span>
        <span class="an-hero__valor">${anNum(r.total)}</span>
        <span class="an-hero__liga">${linhaLiga || '&nbsp;'}</span>
        ${ajuste < 0 ? `<span class="an-hero__nota">${anNum(r.total - ajuste)} ganhos e ${anNum(ajuste)} de ajustes (banimentos)</span>` : ''}
        <div class="an-mini">${mini.map(([valor, nome]) => `<div><b>${anNum(valor)}</b><span>${nome}</span></div>`).join('')}</div>
    `;
}

/* ---------------------------------------------------------------------------
 * Rosca: de onde vieram os pontos. Parte de um todo com poucas fatias; os
 * ajustes negativos (banimento) nao cabem numa rosca e viram nota.
 * ------------------------------------------------------------------------- */

function anDesenharOrigem(r) {
    const lista = document.getElementById('an_origem_lista');
    const fatias = r.origens.map((origem, i) => ({ i, origem, valor: r.porOrigem[i], meta: AN_ORIGENS[origem] }))
        .filter(item => item.valor > 0);
    const positivo = fatias.reduce((soma, item) => soma + item.valor, 0);
    const negativo = r.porOrigem.reduce((soma, valor) => soma + Math.min(valor, 0), 0);

    const caixa = anCaixa('an_rosca');
    if (!positivo) {
        lista.innerHTML = '';
        if (caixa) caixa.el.innerHTML = '<div class="an-vazio">Sem pontos neste recorte.</div>';
        return;
    }

    const itens = fatias.map(item => {
        const pct = Math.round((item.valor / positivo) * 1000) / 10;
        return `<li><button type="button" class="${an.origem === item.i ? 'is-on' : ''}" aria-pressed="${an.origem === item.i}"
            onclick="anFiltrar({ origem: ${an.origem === item.i ? 'null' : item.i} })">
            <i style="background:${item.meta.cor}"></i><span>${item.meta.nome}<small>${pct.toLocaleString('pt-BR')}%</small></span><b>${anCurto(item.valor)}</b>
        </button></li>`;
    }).join('');

    lista.innerHTML = `${itens}${negativo < 0 ? `<li class="an-nota">Ajustes: ${anNum(negativo)} (banimentos)</li>` : ''}`;
    if (!caixa) return;
    const raio = Math.max(20, Math.min(caixa.w, caixa.h) / 2 - 4);
    const espessura = Math.max(10, raio * 0.36);
    const cx = caixa.w / 2;
    const cy = caixa.h / 2;
    let angulo = -Math.PI / 2;
    const arcos = fatias.map(item => {
        const fatia = (item.valor / positivo) * Math.PI * 2;
        const ini = angulo;
        const fim = angulo + fatia;
        angulo = fim;
        const grande = fatia > Math.PI ? 1 : 0;
        const ext = raio;
        const int = raio - espessura;
        const p = (rad, a) => `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
        // Fatia unica: dois arcos de meia volta, porque um arco de 360° some.
        const d = fatias.length === 1
            ? `M${p(ext, -Math.PI / 2)}A${ext},${ext} 0 1 1 ${p(ext, Math.PI / 2)}A${ext},${ext} 0 1 1 ${p(ext, -Math.PI / 2)}M${p(int, -Math.PI / 2)}A${int},${int} 0 1 0 ${p(int, Math.PI / 2)}A${int},${int} 0 1 0 ${p(int, -Math.PI / 2)}Z`
            : `M${p(ext, ini)}A${ext},${ext} 0 ${grande} 1 ${p(ext, fim)}L${p(int, fim)}A${int},${int} 0 ${grande} 0 ${p(int, ini)}Z`;
        const pct = Math.round((item.valor / positivo) * 1000) / 10;
        const esmaecido = an.origem !== null && an.origem !== item.i;
        return `<path d="${d}" fill="${item.meta.cor}" stroke="var(--an-surface)" stroke-width="2" fill-rule="evenodd"
            class="${esmaecido ? 'an-esmaecido' : ''}" style="cursor:pointer"
            onclick="anFiltrar({ origem: ${an.origem === item.i ? 'null' : item.i} })"
            data-dica="${anEsc(`<strong>${item.meta.nome}</strong>${anNum(item.valor)} pontos · ${pct.toLocaleString('pt-BR')}%`)}"></path>`;
    }).join('');

    caixa.el.innerHTML = `
        <svg width="${caixa.w}" height="${caixa.h}" role="img" aria-label="Pontos por origem">
            ${arcos}
            <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="an-forte" style="font-size:${Math.max(12, raio * 0.26)}px">${anCurto(positivo)}</text>
            <text x="${cx}" y="${cy + Math.max(12, raio * 0.2)}" text-anchor="middle" class="an-fraco" style="font-size:10px">pontos ganhos</text>
        </svg>`;
}

/* ---------------------------------------------------------------------------
 * Semanas: colunas empilhadas por origem. O comprimento e a magnitude; a cor e
 * so a origem, na ordem fixa da legenda.
 * ------------------------------------------------------------------------- */

function anRotuloSemana(semana) {
    return `S${semana.numero} ${anMesRotulo(semana.mes)}`;
}

function anDesenharSemanas(r) {
    const caixa = anCaixa('an_semanas');
    if (!caixa) return;
    const semanas = r.semanasIdx;
    if (!semanas.length) {
        caixa.el.innerHTML = '<div class="an-vazio">Sem semanas neste período.</div>';
        return;
    }
    const pos = w => r.porSemana[w].reduce((soma, v) => soma + Math.max(v, 0), 0);
    const maximo = Math.max(...semanas.map(pos), 1);
    const ticks = anTicks(maximo);
    const topo = ticks[ticks.length - 1];

    const m = { t: 16, r: 6, b: 22, l: 38 };
    const pw = caixa.w - m.l - m.r;
    const ph = caixa.h - m.t - m.b;
    const banda = pw / semanas.length;
    const largura = Math.max(4, Math.min(48, banda * 0.62));
    const y = v => m.t + ph - (v / topo) * ph;
    const maiorW = semanas.reduce((melhor, w) => (pos(w) > pos(melhor) ? w : melhor), semanas[0]);
    const cabemTodos = banda >= 34;
    const cadaRotulo = Math.max(1, Math.ceil(46 / banda));

    const grade = ticks.map(t => `
        <line class="an-grid" x1="${m.l}" x2="${caixa.w - m.r}" y1="${y(t)}" y2="${y(t)}"></line>
        <text x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${anCurto(t)}</text>`).join('');

    const colunas = semanas.map((w, k) => {
        const x = m.l + k * banda + (banda - largura) / 2;
        let base = 0;
        const valores = r.porSemana[w];
        const ordem = valores.map((v, o) => ({ v, o })).filter(item => item.v > 0);
        const segmentos = ordem.map((item, n) => {
            const y0 = y(base);
            base += item.v;
            const y1 = y(base);
            // 2px de respiro entre segmentos: a superficie separa as cores.
            const altura = Math.max(0, y0 - y1 - (n > 0 ? 2 : 0));
            const cor = AN_ORIGENS[r.origens[item.o]].cor;
            return n === ordem.length - 1
                ? `<path d="${anBarraTopo(x, y1, largura, altura)}" fill="${cor}"></path>`
                : `<rect x="${x}" y="${y1}" width="${largura}" height="${altura}" fill="${cor}"></rect>`;
        }).join('');
        const total = pos(w);
        const semana = r.s.semanas[w];
        const linhas = valores.map((v, o) => (v ? `<div class="an-tt-linha"><i style="background:${AN_ORIGENS[r.origens[o]].cor}"></i><span>${AN_ORIGENS[r.origens[o]].nome}</span><b>${anNum(v)}</b></div>` : '')).join('');
        const dica = `<strong>${anEsc(semana.rotulo)}</strong>${linhas}<div class="an-tt-nota">Total: ${anNum(valores.reduce((a, b) => a + b, 0))}</div>`;
        const rotuloValor = (cabemTodos || w === maiorW) && total > 0
            ? `<text x="${x + largura / 2}" y="${y(total) - 5}" text-anchor="middle" class="an-forte" style="font-size:10.5px">${anCurto(total)}</text>`
            : '';
        const rotuloX = k % cadaRotulo === 0
            ? `<text x="${x + largura / 2}" y="${caixa.h - 6}" text-anchor="middle">${anRotuloSemana(semana)}</text>`
            : '';
        return `${segmentos}${rotuloValor}${rotuloX}
            <rect class="an-hit" x="${m.l + k * banda}" y="${m.t}" width="${banda}" height="${ph}" data-dica="${anEsc(dica)}"></rect>`;
    }).join('');

    caixa.el.innerHTML = `
        <svg width="${caixa.w}" height="${caixa.h}" role="img" aria-label="Pontos por semana, por origem">
            ${grade}
            <line class="an-base" x1="${m.l}" x2="${caixa.w - m.r}" y1="${y(0)}" y2="${y(0)}"></line>
            ${colunas}
        </svg>`;

    const jogador = an.jogador !== null ? ` · ${r.s.jogadores[an.jogador]}` : '';
    document.getElementById('an_t_semanas').textContent = `Pontos por semana${jogador}`;
}

/* ---------------------------------------------------------------------------
 * Participacao: quanto do cla pontuou em cada semana. Uma serie so, na cor de
 * destaque do site. Com uma origem escolhida, vira "participou de torneios".
 * ------------------------------------------------------------------------- */

function anDesenharParticipacao(r) {
    const caixa = anCaixa('an_partic');
    if (!caixa) return;
    const semanas = r.semanasIdx;
    const base = r.s.membrosAtuais;
    const origem = an.origem !== null ? AN_ORIGENS[r.origens[an.origem]].nome.toLowerCase() : null;
    document.getElementById('an_t_partic').textContent = origem ? `Participação em ${origem} por semana` : 'Participação por semana';
    document.getElementById('an_s_partic').textContent = base ? `% dos ${base} membros atuais` : 'jogadores que pontuaram';

    if (!semanas.length) {
        caixa.el.innerHTML = '<div class="an-vazio">Sem semanas neste período.</div>';
        return;
    }

    const pontos = semanas.map(w => {
        const n = r.ativosSemana[w].size;
        return { w, n, v: base ? Math.min(100, (n / base) * 100) : n };
    });
    const maximo = base ? 100 : Math.max(...pontos.map(p => p.v), 1);
    const ticks = base ? [0, 25, 50, 75, 100] : anTicks(maximo, 3);
    const topo = ticks[ticks.length - 1];

    const m = { t: 18, r: 14, b: 22, l: 38 };
    const pw = caixa.w - m.l - m.r;
    const ph = caixa.h - m.t - m.b;
    const passo = semanas.length > 1 ? pw / (semanas.length - 1) : 0;
    const x = k => (semanas.length > 1 ? m.l + k * passo : m.l + pw / 2);
    const y = v => m.t + ph - (v / topo) * ph;
    const fmt = v => (base ? `${Math.round(v)}%` : anNum(v));

    const grade = ticks.map(t => `
        <line class="an-grid" x1="${m.l}" x2="${caixa.w - m.r}" y1="${y(t)}" y2="${y(t)}"></line>
        <text x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${fmt(t)}</text>`).join('');

    const linha = pontos.map((p, k) => `${k ? 'L' : 'M'}${x(k)},${y(p.v)}`).join('');
    const area = `${linha}L${x(pontos.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;

    // Rotulo direto so onde ajuda: primeiro, ultimo, maior e menor. Numero em
    // todo ponto vira ruido.
    const valores = pontos.map(p => p.v);
    const destacar = new Set([0, pontos.length - 1, valores.indexOf(Math.max(...valores)), valores.indexOf(Math.min(...valores))]);
    const cadaRotulo = Math.max(1, Math.ceil(52 / Math.max(passo, 1)));

    const marcas = pontos.map((p, k) => {
        const semana = r.s.semanas[p.w];
        const dica = `<strong>${anEsc(semana.rotulo)}</strong>${p.n} jogador(es) pontuaram${origem ? ` em ${origem}` : ''}${base ? `<div class="an-tt-nota">${fmt(p.v)} dos ${base} membros atuais</div>` : ''}`;
        const largura = semanas.length > 1 ? passo : pw;
        const ancora = k === 0 ? 'start' : (k === pontos.length - 1 ? 'end' : 'middle');
        return `
            <circle cx="${x(k)}" cy="${y(p.v)}" r="4" fill="var(--an-acento)" stroke="var(--an-surface)" stroke-width="2"></circle>
            ${destacar.has(k) ? `<text x="${x(k)}" y="${y(p.v) - 9}" text-anchor="${ancora}" class="an-forte" style="font-size:10.5px">${fmt(p.v)}</text>` : ''}
            ${k % cadaRotulo === 0 ? `<text x="${x(k)}" y="${caixa.h - 6}" text-anchor="${ancora}">${anRotuloSemana(semana)}</text>` : ''}
            <rect class="an-hit" x="${x(k) - largura / 2}" y="${m.t}" width="${largura}" height="${ph}" data-dica="${anEsc(dica)}"></rect>`;
    }).join('');

    caixa.el.innerHTML = `
        <svg width="${caixa.w}" height="${caixa.h}" role="img" aria-label="Participação por semana">
            <defs><linearGradient id="an_grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2ee6f0" stop-opacity="0.32"></stop>
                <stop offset="1" stop-color="#2ee6f0" stop-opacity="0.02"></stop>
            </linearGradient></defs>
            ${grade}
            <path d="${area}" fill="url(#an_grad)"></path>
            <path d="${linha}" fill="none" stroke="var(--an-acento)" stroke-width="2" stroke-linejoin="round"></path>
            <line class="an-base" x1="${m.l}" x2="${caixa.w - m.r}" y1="${y(0)}" y2="${y(0)}"></line>
            ${marcas}
        </svg>`;
}

/* ---------------------------------------------------------------------------
 * Ranking: barras deitadas e empilhadas por origem. Cabem quantas linhas a
 * altura deixar; o resto vira "+N jogadores". O escolhido fica em destaque, e
 * se estiver fora do corte entra no lugar da ultima linha.
 * ------------------------------------------------------------------------- */

function anDesenharRanking(r) {
    const caixa = anCaixa('an_ranking');
    if (!caixa) return;
    const todos = r.ranking;
    document.getElementById('an_s_ranking').textContent = todos.length ? `${todos.length} jogadores` : '';
    if (!todos.length) {
        caixa.el.innerHTML = '<div class="an-vazio">Ninguém pontuou neste recorte.</div>';
        return;
    }

    const alturaLinha = Math.max(16, Math.min(26, caixa.h / Math.min(todos.length, 12)));
    const cabem = Math.max(1, Math.floor((caixa.h - 4) / alturaLinha));
    let linhas = todos.slice(0, cabem);
    const sobra = todos.length - cabem;
    if (sobra > 0) {
        linhas = todos.slice(0, cabem - 1);
        const escolhido = todos.find(item => item.i === an.jogador);
        if (escolhido && !linhas.includes(escolhido)) linhas[linhas.length - 1] = escolhido;
    }

    const nomeW = Math.min(118, Math.max(70, caixa.w * 0.34));
    const valorW = 44;
    const barraMax = Math.max(10, caixa.w - nomeW - valorW - 8);
    const maximo = Math.max(...todos.map(item => item.total), 1);
    const alturaBarra = Math.max(8, Math.min(14, alturaLinha * 0.58));

    const corpo = linhas.map((item, k) => {
        const yTopo = k * alturaLinha + (alturaLinha - alturaBarra) / 2;
        const posicao = todos.indexOf(item) + 1;
        const esmaecido = an.jogador !== null && an.jogador !== item.i;
        let x = nomeW;
        const positivos = item.origens.map((v, o) => ({ v, o })).filter(p => p.v > 0);
        const segmentos = positivos.map((p, n) => {
            const largura = (p.v / maximo) * barraMax - (n < positivos.length - 1 ? 2 : 0);
            const cor = AN_ORIGENS[r.origens[p.o]].cor;
            const forma = n === positivos.length - 1
                ? `<path d="${anBarraDireita(x, yTopo, Math.max(largura, 1), alturaBarra)}" fill="${cor}"></path>`
                : `<rect x="${x}" y="${yTopo}" width="${Math.max(largura, 1)}" height="${alturaBarra}" fill="${cor}"></rect>`;
            x += largura + 2;
            return forma;
        }).join('');
        const linhasDica = item.origens.map((v, o) => (v ? `<div class="an-tt-linha"><i style="background:${AN_ORIGENS[r.origens[o]].cor}"></i><span>${AN_ORIGENS[r.origens[o]].nome}</span><b>${anNum(v)}</b></div>` : '')).join('');
        const dica = `<strong>${posicao}º · ${anEsc(item.nome)}</strong>${linhasDica}<div class="an-tt-nota">Total: ${anNum(item.total)} · clique para filtrar</div>`;
        const yTexto = k * alturaLinha + alturaLinha / 2 + 4;
        return `<g class="${esmaecido ? 'an-esmaecido' : ''}">
            ${an.jogador === item.i ? `<rect class="an-sel" x="0" y="${k * alturaLinha}" width="${caixa.w}" height="${alturaLinha}" rx="6"></rect>` : ''}
            <text x="${nomeW - 8}" y="${yTexto}" text-anchor="end" class="${an.jogador === item.i ? 'an-forte' : ''}">${anEsc(item.nome.length > 16 ? `${item.nome.slice(0, 15)}…` : item.nome)}</text>
            ${segmentos}
            <text x="${Math.min(x + 4, caixa.w - valorW + 4)}" y="${yTexto}" class="an-forte" style="font-size:10.5px">${anCurto(item.total)}</text>
            <rect class="an-hit" x="0" y="${k * alturaLinha}" width="${caixa.w}" height="${alturaLinha}"
                onclick="anFiltrar({ jogador: ${an.jogador === item.i ? 'null' : item.i} })" data-dica="${anEsc(dica)}"></rect>
        </g>`;
    }).join('');

    const rodape = sobra > 0
        ? `<text x="${nomeW}" y="${linhas.length * alturaLinha + 12}" class="an-fraco" style="font-size:10.5px">+${sobra} jogadores com menos pontos</text>`
        : '';

    caixa.el.innerHTML = `
        <svg width="${caixa.w}" height="${caixa.h}" role="img" aria-label="Pontos por jogador">
            ${corpo}${rodape}
        </svg>`;
}

/* ---------------------------------------------------------------------------
 * Meses: colunas planas por origem e, embaixo, a posicao do cla na Liga
 * naquele mes. O modelo tinha colunas em 3D, que distorcem o comprimento --
 * aqui a barra e plana e o numero vem escrito.
 * ------------------------------------------------------------------------- */

function anDesenharMeses(r) {
    const caixa = anCaixa('an_meses');
    if (!caixa) return;
    const meses = r.meses;
    if (!meses.length) {
        caixa.el.innerHTML = '<div class="an-vazio">Sem meses no histórico.</div>';
        return;
    }
    const pos = i => r.porMes[i].reduce((soma, v) => soma + Math.max(v, 0), 0);
    const maximo = Math.max(...meses.map((_, i) => pos(i)), 1);

    const m = { t: 18, r: 6, b: 34, l: 6 };
    const pw = caixa.w - m.l - m.r;
    const ph = caixa.h - m.t - m.b;
    const banda = pw / meses.length;
    const largura = Math.max(10, Math.min(120, banda * 0.56));
    const y = v => m.t + ph - (v / maximo) * ph;

    const colunas = meses.map((mes, k) => {
        const x = m.l + k * banda + (banda - largura) / 2;
        const valores = r.porMes[k];
        const positivos = valores.map((v, o) => ({ v, o })).filter(p => p.v > 0);
        let acumulado = 0;
        const segmentos = positivos.map((p, n) => {
            const y0 = y(acumulado);
            acumulado += p.v;
            const y1 = y(acumulado);
            const altura = Math.max(0, y0 - y1 - (n > 0 ? 2 : 0));
            const cor = AN_ORIGENS[r.origens[p.o]].cor;
            return n === positivos.length - 1
                ? `<path d="${anBarraTopo(x, y1, largura, altura)}" fill="${cor}"></path>`
                : `<rect x="${x}" y="${y1}" width="${largura}" height="${altura}" fill="${cor}"></rect>`;
        }).join('');
        const total = pos(k);
        const liga = r.s.liga?.[mes];
        const ligaTexto = liga?.posicao ? `${liga.posicao}º na Liga${liga.final ? '' : ' · ao vivo'}` : (liga ? 'fora do pódio' : '');
        const esmaecido = an.mes && an.mes !== mes;
        const linhas = valores.map((v, o) => (v ? `<div class="an-tt-linha"><i style="background:${AN_ORIGENS[r.origens[o]].cor}"></i><span>${AN_ORIGENS[r.origens[o]].nome}</span><b>${anNum(v)}</b></div>` : '')).join('');
        const dica = `<strong>${anMesRotulo(mes, true)}</strong>${linhas}<div class="an-tt-nota">${ligaTexto ? `${ligaTexto}${liga?.pontos ? ` · ${anNum(liga.pontos)} pts oficiais` : ''} · ` : ''}clique para filtrar</div>`;
        return `<g class="${esmaecido ? 'an-esmaecido' : ''}">
            ${an.mes === mes ? `<rect class="an-sel" x="${m.l + k * banda + 2}" y="0" width="${banda - 4}" height="${caixa.h}" rx="8"></rect>` : ''}
            ${segmentos}
            ${total > 0 ? `<text x="${x + largura / 2}" y="${y(total) - 5}" text-anchor="middle" class="an-forte" style="font-size:11px">${anNum(total)}</text>` : ''}
            <text x="${x + largura / 2}" y="${caixa.h - 19}" text-anchor="middle" class="an-forte">${AN_MESES_LONGOS[Number(mes.split('-')[1]) - 1]}</text>
            <text x="${x + largura / 2}" y="${caixa.h - 5}" text-anchor="middle" class="an-fraco" style="font-size:10px">${ligaTexto}</text>
            <rect class="an-hit" x="${m.l + k * banda}" y="0" width="${banda}" height="${caixa.h}"
                onclick="anFiltrar({ mes: ${an.mes === mes ? 'null' : `'${mes}'`} })" data-dica="${anEsc(dica)}"></rect>
        </g>`;
    }).join('');

    caixa.el.innerHTML = `
        <svg width="${caixa.w}" height="${caixa.h}" role="img" aria-label="Pontos do clã por mês">
            <line class="an-base" x1="${m.l}" x2="${caixa.w - m.r}" y1="${y(0)}" y2="${y(0)}"></line>
            ${colunas}
        </svg>`;
}

/* ---------------------------------------------------------------------------
 * Dica flutuante: fixa na viewport (nao estica nada), um ouvinte so para todas
 * as marcas, conteudo vindo de data-dica (ja escapado na montagem).
 * ------------------------------------------------------------------------- */

function anMoverDica(event) {
    const dica = document.getElementById('an_tooltip');
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

function anEsconderDica() {
    const dica = document.getElementById('an_tooltip');
    if (dica) dica.hidden = true;
}

function anLigarDicas() {
    const raiz = document.getElementById('an_root');
    raiz.addEventListener('mousemove', anMoverDica);
    raiz.addEventListener('mouseleave', anEsconderDica);
    // No toque nao ha "passar o mouse": o toque mostra a dica de onde caiu.
    raiz.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'mouse') anMoverDica(event);
    });
}
