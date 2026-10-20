// Indicadores > Site (20/10/2026): quem usa o site e como. Dos lideres,
// Coordenador para cima (o backend confere em GET /api/analise/uso). Os dados
// vem do js/telemetria.js: paginas vistas, tempo com a aba visivel e algumas
// acoes, com o nick de quem entrou com o Discord (90 dias guardados).
//
// Mesmo molde da aba Liga (analises.js): os graficos sao SVG no tamanho medido
// da caixa, as dicas reaproveitam o an_tooltip e os helpers an*. No computador
// a tela cabe na janela e as tabelas rolam por dentro; no celular a pagina rola.

const URL_USO_SITE = `${URL_BASE}/api/analise/uso`;

// Uma cor por tipo de visitante, nos tres primeiros slots da paleta ja validada
// da aba Liga (na ordem: o par 1-2 e o 2-3 sao os conferidos).
const US_TIPOS = {
    publico: { nome: 'Público', cor: '#3987e5' },
    membro: { nome: 'Membros', cor: '#d95926' },
    staff: { nome: 'Staff no painel', cor: '#199e70' },
};

const US_ROTAS = {
    inicio: 'Início', membros: 'Membros', wiki: 'Wiki', historia: 'História', cidade: 'Cidade',
    guia: 'Guia do recruta', 'meu-painel': 'Meu painel', torneios: 'Torneios', copa: 'Copa',
};

const US_ORIGENS = {
    tell: 'Link do tell (jogo)', discord: 'Discord', google: 'Google', guia: 'Link do Guia', outro: 'Outro site', direto: 'Direto ou favorito',
};

const US_ACOES = {
    historia_ler: 'Abriu um livro da História', historia_pdf: 'Baixou um PDF da História', login_discord: 'Clicou em Entrar com Discord',
    guia_discord: 'Entrou com Discord no Guia', staff_entrar: 'Abriu a Administração', acao_titulo: 'Pediu um título',
    acao_trust: 'Pediu trust numa farm', acao_conferir: 'Pediu conferência da Jornada', juntar_se: 'Clicou em Juntar-se',
};

const us = { dados: null, dias: 30, filtro: 'todos', observador: null, quadro: 0 };

function usRota(rota) {
    if (rota.startsWith('painel/indicadores/')) return `Indicadores › ${rota.split('/')[2]}`;
    if (rota.startsWith('painel/')) return `Painel › ${rota.split('/').slice(1).join(' › ')}`;
    return US_ROTAS[rota] || rota;
}

// Rotulo que cabe na largura (texto de 10.5px: ~6px por letra).
function usCabe(texto, largura) {
    const max = Math.max(6, Math.floor(largura / 6));
    return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

function usQuando(iso) {
    if (!iso) return '—';
    const data = new Date(iso);
    const hoje = new Date();
    const dias = Math.floor((new Date(hoje.toDateString()) - new Date(data.toDateString())) / 86_400_000);
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (dias <= 0) return `hoje ${hora}`;
    if (dias === 1) return `ontem ${hora}`;
    if (dias < 7) return `há ${dias} dias`;
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function usPct(parte, todo) {
    return todo ? `${Math.round((parte / todo) * 100)}%` : '0%';
}

function renderUsoSite() {
    document.body.classList.add('painel--analises', 'painel--uso');
    APP.innerHTML = `
        <div class="an-root us-root" id="an_root">
            <div class="an-topo">
                <div class="an-titulo">
                    ${indicadoresCabecalho('site')}
                    <small id="us_atualizado">Carregando...</small>
                </div>
                <div class="an-seg" role="radiogroup" aria-label="Período" id="us_periodo"></div>
            </div>
            <div class="us-grade" id="us_grade">
                <section class="us-tiles" id="us_tiles"></section>
                <section class="an-card us-c-diario">
                    <header><h2>Visitantes por dia</h2><div class="us-legenda" id="us_legenda"></div></header>
                    <div class="an-plot" id="us_diario"></div>
                </section>
                <section class="an-card us-c-paginas">
                    <header><h2>Páginas mais vistas</h2><span>visitas</span></header>
                    <div class="an-plot" id="us_paginas"></div>
                </section>
                <section class="an-card us-c-lado">
                    <header><h2>De onde vêm</h2><span>início da visita</span></header>
                    <ul class="us-lista" id="us_origens"></ul>
                    <header><h2>Ações</h2><span>vezes · pessoas</span></header>
                    <ul class="us-lista" id="us_acoes"></ul>
                </section>
                <section class="an-card us-c-pessoas">
                    <header>
                        <h2>Quem usa</h2>
                        <div class="an-seg us-filtro" role="radiogroup" aria-label="Quem" id="us_filtro"></div>
                    </header>
                    <div class="us-tabela" id="us_pessoas"></div>
                </section>
                <section class="an-card us-c-staff">
                    <header><h2>Staff no painel</h2><span id="us_s_staff"></span></header>
                    <div class="us-tabela" id="us_staff"></div>
                </section>
                <section class="an-card us-c-nunca">
                    <header><h2>Nunca entraram</h2><span id="us_s_nunca"></span></header>
                    <div class="us-tabela" id="us_nunca"></div>
                </section>
            </div>
            <div class="an-tooltip" id="an_tooltip" hidden></div>
        </div>`;
    anLigarDicas();
    usDesenharPeriodo();
    usCarregar();
}

function usSairDaAba() {
    document.body.classList.remove('painel--uso');
    if (us.observador) {
        us.observador.disconnect();
        us.observador = null;
    }
}

function usDesenharPeriodo() {
    const alvo = document.getElementById('us_periodo');
    if (!alvo) return;
    alvo.innerHTML = [7, 30, 90].map(dias => `
        <button type="button" role="radio" aria-checked="${dias === us.dias}" class="${dias === us.dias ? 'is-on' : ''}"
            onclick="usTrocarPeriodo(${dias})">${dias} dias</button>`).join('');
}

function usTrocarPeriodo(dias) {
    if (dias === us.dias) return;
    us.dias = dias;
    usDesenharPeriodo();
    usCarregar();
}

function usTrocarFiltro(filtro) {
    us.filtro = filtro;
    usDesenharPessoas();
}

function usCarregar() {
    const tiles = document.getElementById('us_tiles');
    if (!us.dados) tiles.innerHTML = '<div class="an-vazio">Carregando...</div>';
    fetch(`${URL_USO_SITE}?dias=${us.dias}`, { headers: getAdminRequestHeaders() })
        .then(resposta => {
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            return resposta.json();
        })
        .then(dados => {
            us.dados = dados;
            const quando = new Date(dados.geradoEm);
            document.getElementById('us_atualizado').textContent =
                `Desde 20/10/2026 · ${dados.retencaoDias} dias guardados · atualizado ${quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
            usDesenharTudo();
            if (!us.observador) {
                us.observador = new ResizeObserver(() => {
                    cancelAnimationFrame(us.quadro);
                    us.quadro = requestAnimationFrame(usDesenharGraficos);
                });
                us.observador.observe(document.getElementById('us_grade'));
            }
        })
        .catch(erro => {
            tiles.innerHTML = '<div class="an-vazio">Não foi possível carregar o uso do site agora.</div>';
            console.error('Uso do site:', erro);
        });
}

function usDesenharTudo() {
    usDesenharTiles();
    usDesenharListas();
    usDesenharPessoas();
    usDesenharStaff();
    usDesenharNunca();
    usDesenharGraficos();
}

function usDesenharGraficos() {
    if (!us.dados || !document.getElementById('us_grade')) return;
    usDesenharDiario();
    usDesenharPaginas();
}

function usDesenharTiles() {
    const { totais, aparelhos, dias } = us.dados;
    const aparelhosTotal = aparelhos.celular + aparelhos.computador;
    const tiles = [
        ['Visitantes', anNum(totais.visitantes.periodo), `hoje ${anNum(totais.visitantes.hoje)} · 7 dias ${anNum(totais.visitantes.d7)}`],
        ['Membros que usaram', `${anNum(totais.membros.periodo)}<small> de ${anNum(totais.membros.total)}</small>`, `${usPct(totais.membros.periodo, totais.membros.total)} do cadastro · 7 dias ${anNum(totais.membros.d7)}`],
        ['Staff no painel (7 dias)', `${anNum(totais.staff.d7)}<small> de ${anNum(totais.staff.total)}</small>`, `${usPct(totais.staff.d7, totais.staff.total)} da staff abriu o painel`],
        ['Páginas vistas', anNum(totais.visitas), aparelhosTotal ? `celular ${usPct(aparelhos.celular, aparelhosTotal)} · computador ${usPct(aparelhos.computador, aparelhosTotal)}` : 'sem visitas no período'],
    ];
    document.getElementById('us_tiles').innerHTML = tiles.map(([rotulo, valor, nota]) => `
        <div class="an-card us-tile">
            <span class="us-tile__rotulo">${rotulo}${rotulo === 'Visitantes' || rotulo === 'Membros que usaram' || rotulo === 'Páginas vistas' ? ` · ${dias} dias` : ''}</span>
            <span class="us-tile__valor">${valor}</span>
            <span class="us-tile__nota">${nota}</span>
        </div>`).join('');
    document.getElementById('us_legenda').innerHTML = Object.values(US_TIPOS)
        .map(tipo => `<span><i style="background:${tipo.cor}"></i>${tipo.nome}</span>`).join('');
}

// Colunas empilhadas por dia: publico, membros e staff (cada visitante uma vez
// por dia, no tipo mais alto). 2px de respiro entre os segmentos.
function usDesenharDiario() {
    const caixa = anCaixa('us_diario');
    if (!caixa) return;
    const diario = us.dados.diario;
    const tipos = Object.keys(US_TIPOS);
    const total = dia => tipos.reduce((soma, tipo) => soma + dia[tipo], 0);
    // Contagem de pessoas: o eixo nunca passa por 0,5.
    const maximo = Math.max(...diario.map(total), 4);
    const ticks = anTicks(maximo);
    const topo = ticks[ticks.length - 1];
    const m = { t: 14, r: 6, b: 22, l: 34 };
    const pw = caixa.w - m.l - m.r;
    const ph = caixa.h - m.t - m.b;
    const banda = pw / diario.length;
    const largura = Math.max(2, Math.min(28, banda * 0.66));
    const y = v => m.t + ph - (v / topo) * ph;
    const cadaRotulo = Math.max(1, Math.ceil(44 / banda));
    const grade = ticks.map(t => `
        <line class="an-grid" x1="${m.l}" x2="${caixa.w - m.r}" y1="${y(t)}" y2="${y(t)}"></line>
        <text x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${anCurto(t)}</text>`).join('');
    const colunas = diario.map((dia, k) => {
        const x = m.l + k * banda + (banda - largura) / 2;
        let base = 0;
        const presentes = tipos.filter(tipo => dia[tipo] > 0);
        const segmentos = presentes.map((tipo, n) => {
            const y0 = y(base);
            base += dia[tipo];
            const y1 = y(base);
            const altura = Math.max(0, y0 - y1 - (n > 0 ? 2 : 0));
            const cor = US_TIPOS[tipo].cor;
            return n === presentes.length - 1
                ? `<path d="${anBarraTopo(x, y1, largura, altura)}" fill="${cor}"></path>`
                : `<rect x="${x}" y="${y1}" width="${largura}" height="${altura}" fill="${cor}"></rect>`;
        }).join('');
        const [ano, mes, d] = dia.dia.split('-');
        const linhas = tipos.map(tipo => `<div class="an-tt-linha"><i style="background:${US_TIPOS[tipo].cor}"></i><span>${US_TIPOS[tipo].nome}</span><b>${anNum(dia[tipo])}</b></div>`).join('');
        const dica = `<strong>${d}/${mes}/${ano}</strong>${linhas}<div class="an-tt-nota">Total: ${anNum(total(dia))} visitantes</div>`;
        const rotuloX = k % cadaRotulo === 0 ? `<text x="${x + largura / 2}" y="${caixa.h - 6}" text-anchor="middle">${d}/${mes}</text>` : '';
        return `${segmentos}${rotuloX}<rect class="an-hit" x="${m.l + k * banda}" y="${m.t}" width="${banda}" height="${ph}" data-dica="${anEsc(dica)}"></rect>`;
    }).join('');
    caixa.el.innerHTML = `
        <svg width="${caixa.w}" height="${caixa.h}" role="img" aria-label="Visitantes por dia, por tipo">
            ${grade}
            <line class="an-base" x1="${m.l}" x2="${caixa.w - m.r}" y1="${y(0)}" y2="${y(0)}"></line>
            ${colunas}
        </svg>`;
}

// Barras deitadas, uma serie so (cor de destaque). Cabem quantas a caixa deixar.
function usDesenharPaginas() {
    const caixa = anCaixa('us_paginas');
    if (!caixa) return;
    const todas = us.dados.paginas;
    if (!todas.length) {
        caixa.el.innerHTML = '<div class="an-vazio">Nenhuma visita no período.</div>';
        return;
    }
    const linha = 24;
    const paginas = todas.slice(0, Math.max(1, Math.floor(caixa.h / linha)));
    const rotuloW = Math.min(170, Math.max(96, caixa.w * 0.42));
    const valorW = 40;
    const pw = Math.max(10, caixa.w - rotuloW - valorW);
    const maximo = Math.max(...paginas.map(pagina => pagina.visitas), 1);
    const barras = paginas.map((pagina, k) => {
        const y = k * linha;
        const w = (pagina.visitas / maximo) * pw;
        const dica = `<strong>${anEsc(usRota(pagina.rota))}</strong>
            <div class="an-tt-linha"><span>Visitas</span><b>${anNum(pagina.visitas)}</b></div>
            <div class="an-tt-linha"><span>Visitantes</span><b>${anNum(pagina.visitantes)}</b></div>
            <div class="an-tt-linha"><span>Tempo médio</span><b>${pagina.tempoMedioS >= 60 ? `${Math.round(pagina.tempoMedioS / 60)} min` : `${pagina.tempoMedioS} s`}</b></div>`;
        return `
            <text x="${rotuloW - 8}" y="${y + 15}" text-anchor="end">${anEsc(usCabe(usRota(pagina.rota), rotuloW - 12))}</text>
            <path d="${anBarraDireita(rotuloW, y + 5, w, linha - 10)}" fill="var(--an-acento)"></path>
            <text x="${rotuloW + w + 6}" y="${y + 15}" class="an-forte">${anNum(pagina.visitas)}</text>
            <rect class="an-hit" x="0" y="${y}" width="${caixa.w}" height="${linha}" data-dica="${anEsc(dica)}"></rect>`;
    }).join('');
    caixa.el.innerHTML = `<svg width="${caixa.w}" height="${paginas.length * linha}" role="img" aria-label="Páginas mais vistas">${barras}</svg>`;
}

function usDesenharListas() {
    const { origens, acoes } = us.dados;
    const totalOrigens = origens.reduce((soma, item) => soma + item.vezes, 0);
    document.getElementById('us_origens').innerHTML = origens.length
        ? origens.map(item => `<li><span>${anEsc(US_ORIGENS[item.origem] || item.origem)}</span><b>${usPct(item.vezes, totalOrigens)}</b></li>`).join('')
        : '<li class="us-vazio">Sem visitas no período.</li>';
    document.getElementById('us_acoes').innerHTML = acoes.length
        ? acoes.map(item => `<li><span>${anEsc(US_ACOES[item.acao] || item.acao)}</span><b>${anNum(item.vezes)} · ${anNum(item.pessoas)}</b></li>`).join('')
        : '<li class="us-vazio">Nenhuma ação no período.</li>';
}

function usCabeca(nick) {
    return `<img src="https://mc-heads.net/avatar/${encodeURIComponent(nick)}/20" alt="" width="20" height="20" loading="lazy">`;
}

function usDesenharPessoas() {
    const filtroAlvo = document.getElementById('us_filtro');
    if (!filtroAlvo || !us.dados) return;
    const filtros = { todos: 'Todos', staff: 'Staff', membros: 'Membros' };
    filtroAlvo.innerHTML = Object.entries(filtros).map(([chave, nome]) => `
        <button type="button" role="radio" aria-checked="${chave === us.filtro}" class="${chave === us.filtro ? 'is-on' : ''}" onclick="usTrocarFiltro('${chave}')">${nome}</button>`).join('');
    const ehStaff = new Set(us.dados.staff.map(item => item.nick.toLowerCase()));
    const pessoas = us.dados.pessoas.filter(pessoa => us.filtro === 'todos'
        || (us.filtro === 'staff') === ehStaff.has(pessoa.nick.toLowerCase()));
    document.getElementById('us_pessoas').innerHTML = pessoas.length ? `
        <table>
            <thead><tr><th>Nick</th><th>Último acesso</th><th title="Dias com visita no período">Dias</th><th>Visitas</th><th>Mais vê</th></tr></thead>
            <tbody>${pessoas.map(pessoa => `
                <tr>
                    <td class="us-nick">${usCabeca(pessoa.nick)}<span>${anEsc(pessoa.nick)}${pessoa.cargo ? `<small>${anEsc(pessoa.cargo)}</small>` : ''}${pessoa.noCla ? '' : '<small>fora do clã</small>'}</span></td>
                    <td>${usQuando(pessoa.ultimo)}</td>
                    <td class="us-num">${anNum(pessoa.dias)}</td>
                    <td class="us-num">${anNum(pessoa.visitas)}</td>
                    <td class="us-paginas">${pessoa.paginas.map(rota => anEsc(usRota(rota))).join(', ')}</td>
                </tr>`).join('')}
            </tbody>
        </table>` : '<div class="an-vazio">Ninguém entrou com o Discord no período.</div>';
}

function usDesenharStaff() {
    const staff = us.dados.staff;
    const usaram = staff.filter(item => item.visitasPainel > 0).length;
    document.getElementById('us_s_staff').textContent = `${usaram} de ${staff.length} no período`;
    document.getElementById('us_staff').innerHTML = staff.length ? `
        <table>
            <thead><tr><th>Nick</th><th>Último no painel</th><th>Visitas</th></tr></thead>
            <tbody>${staff.map(item => `
                <tr class="${item.visitasPainel ? '' : 'us-apagado'}"${item.abas.length ? ` data-dica="${anEsc(`<strong>${anEsc(item.nick)}</strong><div class="an-tt-nota">Mais usa: ${item.abas.map(aba => anEsc(aba)).join(', ')}</div>`)}"` : ''}>
                    <td class="us-nick">${usCabeca(item.nick)}<span>${anEsc(item.nick)}<small>${anEsc(item.cargo)}</small></span></td>
                    <td>${item.ultimoPainel ? usQuando(item.ultimoPainel) : 'não abriu'}</td>
                    <td class="us-num">${anNum(item.visitasPainel)}</td>
                </tr>`).join('')}
            </tbody>
        </table>` : '<div class="an-vazio">Sem staff no cadastro.</div>';
}

function usDesenharNunca() {
    const nunca = us.dados.nunca;
    document.getElementById('us_s_nunca').textContent = `${nunca.length} de ${us.dados.totais.membros.total} em ${us.dados.retencaoDias} dias`;
    document.getElementById('us_nunca').innerHTML = nunca.length
        ? `<ul class="us-chips">${nunca.map(item => `<li>${usCabeca(item.nick)}<span>${anEsc(item.nick)}${item.cargo ? `<small>${anEsc(item.cargo)}</small>` : ''}</span></li>`).join('')}</ul>`
        : '<div class="an-vazio">Todo o cadastro já entrou no site.</div>';
}
