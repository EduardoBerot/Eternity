// Gamificacao do painel do membro (18/10/2026): abas "Minha Liga" (pontos e
// origens de quem esta logado, por semana) e "Top niveis" (ranking do nivel da
// conta de todos os membros). Dados de GET /api/painel-membro/cla
// (gamificacao.service.js no eternity-crud), so com a sessao do Discord. A Liga
// dos OUTROS jogadores continua so para lideres (aba Analises da staff): daqui a
// pessoa ve so a propria contribuicao e a posicao dela.

const MP_ORIGENS = {
    torneios: { nome: 'Torneios', icone: 'fa-trophy', cor: '#3987e5' },
    eventos: { nome: 'Eventos', icone: 'fa-flag-checkered', cor: '#d95926' },
    desafios: { nome: 'Desafios', icone: 'fa-bolt', cor: '#199e70' },
    votos: { nome: 'Votos', icone: 'fa-check-to-slot', cor: '#c98500' },
    vip: { nome: 'VIP', icone: 'fa-crown', cor: '#d55181' },
    ajustes: { nome: 'Ajustes', icone: 'fa-scale-balanced', cor: '#6b8193' },
};
const MP_MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MP_MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// null = nao pedido; 'carregando'; 'erro'; ou o corpo da API.
function mpCla() {
    return mpEstado.cla && typeof mpEstado.cla === 'object' ? mpEstado.cla : null;
}

async function mpCarregarCla() {
    if (mpEstado.cla === 'carregando' || mpCla()) return;
    mpEstado.cla = 'carregando';
    const token = mpLerSessao();
    try {
        const resposta = await fetch(`${URL_PAINEL_MEMBRO}/cla`, { headers: { Authorization: `Bearer ${token}` } });
        mpEstado.cla = resposta.ok ? await resposta.json() : 'erro';
    } catch {
        mpEstado.cla = 'erro';
    }
    if (!location.hash.startsWith('#meu-painel') || !mpEstado.dados) return;
    if (mpEstado.tela !== 'perfil' || mpEstado.aba === 'liga') mpRedesenharTela();
    else mpAtualizarHeroiCla();
}

function mpEsperandoCla(titulo) {
    if (mpEstado.cla === 'erro') {
        return `<section class="info-bloco"><p class="info-vazio">Não consegui carregar ${titulo} agora. <button type="button" class="mp-link" onclick="mpEstado.cla = null; mpRedesenharTela(); mpCarregarCla()">Tentar de novo</button></p></section>`;
    }
    return `<section class="info-bloco"><p class="info-vazio"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Carregando ${titulo}...</p></section>`;
}

function mpMinhaLinha() {
    const cla = mpCla();
    return cla ? cla.ranking.find(linha => linha.nick === cla.eu) || null : null;
}

// Posicao no ranking e XP da semana no topo da ficha, quando o ranking chega.
function mpAtualizarHeroiCla() {
    const alvo = document.getElementById('mp-heroi-cla');
    const cla = mpCla();
    if (!alvo || !cla) return;
    // No perfil de outro membro, a posicao dele.
    const nick = mpAlvo().perfil.nick;
    const eu = cla.ranking.find(linha => linha.nick === nick);
    if (!eu) return;
    const total = cla.ranking.length;
    alvo.innerHTML = `<button type="button" class="ficha-rank" onclick="mpIr('ranking')" title="Ver o ranking">
            <i class="fa-solid fa-ranking-star" aria-hidden="true"></i> ${eu.posicao}º de ${total} no clã
        </button>${eu.semana ? `<span class="ficha-semana"><i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i> +${eu.semana.toLocaleString('pt-BR')} XP na semana</span>` : ''}`;
}

// ---------- Top niveis ----------

function mpAbaNiveis() {
    const cla = mpCla();
    if (!cla) return mpEsperandoCla('o ranking');
    if (!cla.ranking.length) return '<section class="info-bloco"><p class="info-vazio">O ranking aparece na próxima atualização dos perfis.</p></section>';
    const filtro = mpEstado.nivFiltro || 'todos';
    const ordem = mpEstado.nivOrdem || 'xp';
    const temSemana = cla.ranking.some(linha => linha.semana !== null);
    let linhas = cla.ranking.filter(linha => filtro === 'todos' || linha.cla === filtro);
    if (ordem === 'semana') linhas = [...linhas].sort((a, b) => (b.semana ?? -1) - (a.semana ?? -1) || b.xp - a.xp);
    const eu = mpMinhaLinha();
    const percentil = eu ? Math.max(1, Math.ceil(eu.posicao / cla.ranking.length * 100)) : null;
    const tags = [...new Set(cla.ranking.map(linha => linha.cla).filter(Boolean))].sort();
    const chip = (grupo, valor, rotulo, ativo) => `<button type="button" class="mp-chip ${ativo ? 'ativo' : ''}" aria-pressed="${ativo}" onclick="mpNiveis('${grupo}', '${valor}')">${rotulo}</button>`;

    const topo = linhas.slice(0, 3);
    const podio = ordem === 'xp' && filtro === 'todos' && topo.length === 3
        ? `<div class="niv-podio">${[1, 0, 2].map(i => mpCartaoPodio(topo[i], i + 1, cla.eu)).join('')}</div>`
        : '';
    const resto = podio ? linhas.slice(3) : linhas;

    return `<div class="niv">
        ${eu ? `<section class="niv-eu">
            <div class="niv-eu-pos"><span>Sua posição</span><strong>${eu.posicao}º</strong><small>de ${cla.ranking.length} membros</small></div>
            <div class="niv-eu-dados">
                <span class="niv-nv">NV ${eu.nivel}</span>
                <b>${eu.xp.toLocaleString('pt-BR')} XP</b>
                <small>${percentil <= 50 ? `Entre os ${percentil}% mais altos do clã` : 'Cada XP conta: veja de onde ele vem na sua ficha'}${eu.semana ? ` · +${eu.semana.toLocaleString('pt-BR')} XP nesta semana` : ''}</small>
            </div>
            ${mpProximoAcima(eu, cla.ranking)}
        </section>` : ''}
        <div class="niv-filtros">
            <div class="niv-grupo" role="group" aria-label="Clã">${chip('filtro', 'todos', 'Todos', filtro === 'todos')}${tags.map(tag => chip('filtro', tag, tag, filtro === tag)).join('')}</div>
            ${temSemana ? `<div class="niv-grupo" role="group" aria-label="Ordem">${chip('ordem', 'xp', 'XP total', ordem === 'xp')}${chip('ordem', 'semana', '<i class="fa-solid fa-fire" aria-hidden="true"></i> Em alta na semana', ordem === 'semana')}</div>` : ''}
            ${eu ? '<button type="button" class="mp-link niv-ir" onclick="mpIrAteMim()">Ir até mim</button>' : ''}
        </div>
        ${podio}
        <ol class="niv-lista">
            ${resto.map(linha => mpLinhaNivel(linha, cla.eu, ordem)).join('')}
        </ol>
        <p class="mp-nota"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> O XP soma tempo de clã, conquistas, pontos da Liga, pódios, desafios, eventos, banco e ofensiva. "Na semana" compara com o registro de até 7 dias atrás. Em breve, títulos por nível de conta.</p>
    </div>`;
}

function mpProximoAcima(eu, ranking) {
    const acima = ranking.find(linha => linha.posicao === eu.posicao - 1);
    if (!acima) return '<div class="niv-eu-meta"><i class="fa-solid fa-crown" aria-hidden="true"></i><span>Você está em <b>1º lugar</b> no clã</span></div>';
    const falta = acima.xp - eu.xp + 1;
    return `<div class="niv-eu-meta"><i class="fa-solid fa-angles-up" aria-hidden="true"></i><span>Faltam <b>${falta.toLocaleString('pt-BR')} XP</b> para passar ${escHtml(acima.nick)}</span></div>`;
}

function mpCabeca(nick, tamanho) {
    return `<img class="niv-cabeca" src="https://mc-heads.net/avatar/${encodeURIComponent(String(nick).replace(/^\*+/, ''))}/${tamanho}" alt="" width="${tamanho}" height="${tamanho}" loading="lazy">`;
}

// Clicar em alguem abre o perfil dele dentro do painel (18/10/2026), nao o
// perfil publico. O href fica para abrir em outra aba.
function mpLinkMembro(nick) {
    return `href="#meu-painel&tela=jogador&nick=${encodeURIComponent(nick)}" data-nick="${escHtml(nick)}" onclick="return mpAbrirJogador(this.dataset.nick)"`;
}

function mpCartaoPodio(linha, lugar, eu) {
    return `<a class="niv-podio-carta lugar-${lugar} ${linha.nick === eu ? 'eu' : ''}" ${mpLinkMembro(linha.nick)} title="Ver o perfil de ${escHtml(linha.nick)}">
        <span class="niv-podio-lugar">${lugar}º</span>
        ${mpCabeca(linha.nick, 56)}
        <b>${escHtml(linha.nick)}</b>
        <span class="niv-nv">NV ${linha.nivel}</span>
        <small>${linha.xp.toLocaleString('pt-BR')} XP</small>
    </a>`;
}

function mpLinhaNivel(linha, eu, ordem) {
    return `<li class="niv-linha ${linha.nick === eu ? 'eu' : ''}" ${linha.nick === eu ? 'id="niv-eu"' : ''}>
        <a ${mpLinkMembro(linha.nick)} title="Ver o perfil de ${escHtml(linha.nick)}">
            <span class="niv-pos">${linha.posicao}º</span>
            ${mpCabeca(linha.nick, 32)}
            <span class="niv-nome"><b>${escHtml(linha.nick)}</b><small><span class="cargo-${escHtml(classeCargo(linha.cargo))}">${escHtml(linha.cargo)}</span>${linha.cla ? ` · ${escHtml(linha.cla)}` : ''}</small></span>
            <span class="niv-semana ${ordem === 'semana' ? 'destaque' : ''}">${linha.semana ? `+${linha.semana.toLocaleString('pt-BR')}` : ''}</span>
            <span class="niv-nv">NV ${linha.nivel}</span>
            <span class="niv-xp">${linha.xp.toLocaleString('pt-BR')} <small>XP</small></span>
        </a>
    </li>`;
}

function mpNiveis(grupo, valor) {
    if (grupo === 'filtro') mpEstado.nivFiltro = valor;
    if (grupo === 'ordem') mpEstado.nivOrdem = valor;
    const alvo = document.getElementById('mp-ranking');
    if (alvo) alvo.innerHTML = mpAbaNiveis();
}

function mpIrAteMim() {
    let linha = document.getElementById('niv-eu') || document.querySelector('.niv-podio-carta.eu');
    if (!linha && (mpEstado.nivFiltro || 'todos') !== 'todos') {
        mpNiveis('filtro', 'todos');
        linha = document.getElementById('niv-eu') || document.querySelector('.niv-podio-carta.eu');
    }
    linha?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    linha?.classList.add('piscar');
    setTimeout(() => linha?.classList.remove('piscar'), 1600);
}

// ---------- Minha Liga ----------

function mpRotuloMes(mes, longo = false) {
    const [ano, numero] = String(mes).split('-').map(Number);
    return longo ? `${MP_MESES_LONGOS[numero - 1]} de ${ano}` : `${MP_MESES_CURTOS[numero - 1]} ${String(ano).slice(2)}`;
}

function mpAbaMinhaLiga(perfil) {
    const cla = mpCla();
    if (!cla) return mpEsperandoCla('a sua Liga');
    const liga = cla.liga;
    // Sem historico da pessoa (recem-chegado, ou pacote ainda nao publicado): a
    // aba antiga, com os meses do perfil.
    if (!liga?.servidores?.length) return mpAbaLiga(perfil);

    const servidores = liga.servidores;
    const sIndice = Math.min(mpEstado.ligaServidor || 0, servidores.length - 1);
    const servidor = servidores[sIndice];
    const meses = Object.keys(servidor.meses).sort().reverse();
    if (!meses.length) return mpAbaLiga(perfil);
    const mes = meses.includes(mpEstado.ligaMes) ? mpEstado.ligaMes : meses[0];
    const dados = servidor.meses[mes];
    const origens = liga.origens;
    const origemAtiva = Number.isInteger(mpEstado.ligaOrigem) ? mpEstado.ligaOrigem : null;
    const semanas = servidor.semanas.filter(semana => semana.mes === mes).sort((a, b) => a.numero - b.numero);
    const porOrigem = origens.map((_, o) => semanas.reduce((soma, semana) => soma + semana.origens[o], 0));
    const ganhos = porOrigem.reduce((soma, valor) => soma + Math.max(0, valor), 0);
    const parte = dados.cla?.pontos > 0 ? dados.pontos / dados.cla.pontos * 100 : null;

    const seletorServidor = servidores.length > 1
        ? `<div class="niv-grupo" role="group" aria-label="Servidor">${servidores.map((s, i) => `<button type="button" class="mp-chip ${i === sIndice ? 'ativo' : ''}" aria-pressed="${i === sIndice}" onclick="mpLiga('servidor', ${i})">${escHtml(SERVIDORES[s.servidor] || s.servidor)}</button>`).join('')}</div>`
        : '';

    // Historico: um botao por mes (do mais antigo ao mais recente), para escolher.
    const maiorMes = Math.max(1, ...meses.map(m => servidor.meses[m].pontos));
    const historico = [...meses].reverse().map(m => {
        const pontos = servidor.meses[m].pontos;
        return `<button type="button" class="mp-barra ${m === mes ? 'ativa' : ''}" onclick="mpLiga('mes', '${m}')" aria-label="${mpRotuloMes(m, true)}: ${pontos} pontos" title="${mpRotuloMes(m, true)}: ${pontos.toLocaleString('pt-BR')} pontos">
            <span class="mp-barra-valor">${pontos.toLocaleString('pt-BR')}</span>
            <span class="mp-barra-coluna" style="height:${Math.max(3, Math.round(Math.max(0, pontos) / maiorMes * 100))}%"></span>
            <span class="mp-barra-mes">${mpRotuloMes(m)}</span>
        </button>`;
    }).join('');

    // Semanas do mes em barras empilhadas por origem; com uma origem escolhida,
    // so ela aparece.
    const totalSemana = semana => semana.origens.reduce((soma, v, o) => soma + (origemAtiva === null || origemAtiva === o ? Math.max(0, v) : 0), 0);
    const maiorSemana = Math.max(1, ...semanas.map(totalSemana));
    const barrasSemana = semanas.map(semana => {
        const total = totalSemana(semana);
        const partes = semana.origens.map((v, o) => ({ v: Math.max(0, v), o }))
            .filter(p => p.v > 0 && (origemAtiva === null || origemAtiva === p.o))
            .map(p => `<span style="height:${p.v / maiorSemana * 100}%;background:${MP_ORIGENS[origens[p.o]]?.cor || '#6b8193'}" title="${MP_ORIGENS[origens[p.o]]?.nome || origens[p.o]}: ${p.v.toLocaleString('pt-BR')}"></span>`).join('');
        return `<div class="lg-semana" title="${escHtml(semana.rotulo)}: ${total.toLocaleString('pt-BR')} pontos">
            <span class="lg-semana-valor">${total ? total.toLocaleString('pt-BR') : ''}</span>
            <div class="lg-semana-pilha">${partes}</div>
            <span class="lg-semana-rotulo">${semana.numero ? `${semana.numero}ª sem` : escHtml(semana.rotulo)}</span>
        </div>`;
    }).join('');

    const legenda = origens.map((origem, o) => ({ origem, o, valor: porOrigem[o], meta: MP_ORIGENS[origem] || { nome: origem, icone: 'fa-circle', cor: '#6b8193' } }))
        .filter(item => item.valor !== 0)
        .sort((a, b) => b.valor - a.valor)
        .map(item => {
            const pct = ganhos && item.valor > 0 ? Math.round(item.valor / ganhos * 100) : 0;
            const ativa = origemAtiva === item.o;
            return `<li><button type="button" class="lg-origem ${ativa ? 'ativa' : ''} ${origemAtiva !== null && !ativa ? 'apagada' : ''}" aria-pressed="${ativa}" onclick="mpLiga('origem', ${item.o})">
                <div class="mp-area-topo">
                    <span><i class="fa-solid ${item.meta.icone}" style="color:${item.meta.cor}" aria-hidden="true"></i> ${item.meta.nome}</span>
                    <span><b>${item.valor.toLocaleString('pt-BR')}</b> pts${item.valor > 0 ? ` · ${pct}%` : ''}</span>
                </div>
                <div class="ficha-barra"><span style="width:${pct}%;background:${item.meta.cor}"></span></div>
            </button></li>`;
        }).join('');

    const eventos = perfil.eventos?.lista || [];
    return `<div class="lg">
        <div class="lg-cabeca">
            <h3><i class="fa-solid fa-trophy" aria-hidden="true"></i> Liga de ${mpRotuloMes(mes, true)}${dados.cla && !dados.cla.final ? ' <small>em andamento</small>' : ''}</h3>
            ${seletorServidor}
        </div>
        <div class="lg-numeros">
            ${mpStat('fa-star', 'Seus pontos', dados.pontos.toLocaleString('pt-BR'), 'no mês')}
            ${mpStat('fa-ranking-star', 'No clã', dados.posicao ? `${dados.posicao}º` : '—', dados.posicao ? `de ${dados.jogadores} que pontuaram` : 'sem pontos no mês')}
            ${mpStat('fa-people-group', 'Sua parte', parte !== null ? `${parte.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—', dados.cla?.pontos ? `dos ${dados.cla.pontos.toLocaleString('pt-BR')} pts do clã` : 'do total do clã')}
            ${mpStat('fa-shield-halved', 'Clã na Liga', dados.cla?.posicao ? `${dados.cla.posicao}º` : '—', dados.cla?.final ? 'resultado final' : 'posição atual')}
        </div>
        <div class="mp-grade">
            <section class="info-bloco">
                <h3><i class="fa-solid fa-calendar-week" aria-hidden="true"></i> Semanas do mês${origemAtiva !== null ? ` <small>só ${MP_ORIGENS[origens[origemAtiva]]?.nome || origens[origemAtiva]}</small>` : ''}</h3>
                ${semanas.length ? `<div class="lg-semanas">${barrasSemana}</div>` : '<p class="info-vazio">Sem pontos neste mês.</p>'}
            </section>
            <section class="info-bloco">
                <h3><i class="fa-solid fa-layer-group" aria-hidden="true"></i> De onde vieram <small>toque para filtrar</small></h3>
                ${legenda ? `<ul class="lg-origens">${legenda}</ul>` : '<p class="info-vazio">Sem pontos neste mês.</p>'}
            </section>
            <section class="info-bloco info-bloco-largo">
                <h3><i class="fa-solid fa-chart-column" aria-hidden="true"></i> Seus pontos por mês <small>toque num mês</small></h3>
                <div class="mp-grafico">${historico}</div>
            </section>
            <section class="info-bloco info-bloco-largo">
                <h3><i class="fa-solid fa-medal" aria-hidden="true"></i> Eventos vencidos <small>desde agosto de 2026</small></h3>
                ${eventos.length
                    ? `<ul class="eventos-lista">${eventos.map(item => `
                        <li class="${item.semanal ? 'evento-semanal' : ''}" title="${item.ultimo ? `Última vitória em ${escHtml(dataBr(item.ultimo))}` : ''}">
                            <span>${escHtml(item.nome)}</span><strong>×${escHtml(item.vezes)}</strong>
                        </li>`).join('')}</ul>`
                    : '<p class="info-vazio">Nenhum evento vencido ainda.</p>'}
            </section>
        </div>
        <p class="mp-nota"><i class="fa-solid fa-lock" aria-hidden="true"></i> Aqui aparecem só os seus pontos; a contribuição de cada membro fica com os líderes.</p>
    </div>`;
}

function mpLiga(campo, valor) {
    if (campo === 'servidor') { mpEstado.ligaServidor = Number(valor) || 0; mpEstado.ligaMes = null; mpEstado.ligaOrigem = null; }
    if (campo === 'mes') { mpEstado.ligaMes = valor; }
    if (campo === 'origem') mpEstado.ligaOrigem = mpEstado.ligaOrigem === valor ? null : valor;
    const alvo = document.getElementById('mp-aba');
    if (alvo) alvo.innerHTML = mpAbaMinhaLiga(mpEstado.dados.perfil);
}

// ---------- Inicio do jogo (18/10/2026) ----------
// A tela principal e o cla: a temporada (o mes da Liga) com contagem, o cla na
// Liga em totais, as missoes do dia, a meta do banco e o topo do ranking. O que
// e so da pessoa fica em Meu perfil.

function mpDiasParaFimDoMes(now = new Date()) {
    const [ano, mes, dia] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).split('-').map(Number);
    const total = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    return { restam: total - dia, pct: Math.round(dia / total * 100), mes: `${ano}-${String(mes).padStart(2, '0')}` };
}

function mpTelaInicio() {
    const { perfil } = mpResumo();
    const temporada = mpDiasParaFimDoMes();
    return `<section class="inicio-boas">
            <div>
                <h1>Bem-vindo de volta, <span>${escHtml(perfil.nick)}</span></h1>
            </div>
            <div class="inicio-temporada" title="A Liga fecha no último dia do mês">
                <span><i class="fa-solid fa-hourglass-half" aria-hidden="true"></i> ${temporada.restam ? `A Liga fecha em <b>${temporada.restam} ${temporada.restam === 1 ? 'dia' : 'dias'}</b>` : '<b>Último dia</b> da Liga'}</span>
                <div class="ficha-barra"><span style="width:${temporada.pct}%"></span></div>
            </div>
        </section>
        ${mpCartaoJornadaInicio()}
        ${mpFaixaHoje(perfil)}
        ${mpTilesPrincipais()}
        ${mpTilesSecundarios()}`;
}

// ---------- Inicio em cartoes (13/11/2026) ----------
// Pedido do Fundador: o Inicio tinha informacao demais. Agora e um resumo: as
// missoes de hoje numa faixa, tres cartoes grandes (um numero cada) e dois
// menores. Clicar num cartao abre o detalhe numa tela propria (MP_SUBTELAS em
// meu-painel.js), que reaproveita os cartoes completos de antes.

function mpFaixaHoje(perfil) {
    const missoes = mpListaMissoes(perfil);
    const feitas = missoes.filter(m => m.estado === 'feito').length;
    return `<section class="hoje" aria-labelledby="hoje-titulo">
        <div class="hoje-resumo">
            <h2 id="hoje-titulo"><i class="fa-solid fa-scroll" aria-hidden="true"></i> Hoje</h2>
            <span class="hoje-contagem ${feitas === missoes.length ? 'completo' : ''}"><b>${feitas}</b> de ${missoes.length}</span>
        </div>
        <ul class="hoje-lista">
            ${missoes.map(m => `<li><button type="button" class="hoje-item ${m.estado}" onclick="${m.ir}" title="${mpTextoPuro(m.texto)}">
                <span class="hoje-marca"><i class="fa-solid ${m.estado === 'feito' ? 'fa-check' : m.icone}" aria-hidden="true"></i></span>
                <span class="hoje-texto" aria-hidden="true">${m.curto}</span>
                <span class="hoje-sr">${m.estado === 'feito' ? 'Feita' : 'Pendente'}: ${mpTextoPuro(m.texto)}</span>
            </button></li>`).join('')}
        </ul>
    </section>`;
}

// Cartao que ainda nao tem dado: carregando ou com erro (e "Tentar de novo").
function mpTileEstado(classe, icone, rotulo, erro, nova, vazio = '') {
    const texto = vazio
        || (erro
            ? `Não consegui carregar agora. <button type="button" class="mp-link" onclick="${nova}">Tentar de novo</button>`
            : '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Carregando...');
    return `<div class="tile tile-${classe} tile-estado">
        <span class="tile-rotulo"><i class="fa-solid ${icone}" aria-hidden="true"></i> ${rotulo}</span>
        <p class="tile-texto">${texto}</p>
    </div>`;
}

// Os tres cartoes grandes tem o mesmo esqueleto: numero, legenda, barra e duas linhas.
function mpTile(classe, icone, rotulo, tela, aria, miolo) {
    return `<button type="button" class="tile tile-${classe}" onclick="mpIr('${tela}')" aria-label="${escHtml(aria)}">
        <span class="tile-rotulo"><i class="fa-solid ${icone}" aria-hidden="true"></i> ${rotulo}</span>
        ${miolo}
        <span class="tile-abrir" aria-hidden="true">Abrir <i class="fa-solid fa-chevron-right"></i></span>
    </button>`;
}

function mpTileLiga() {
    const cla = mpCla();
    const nova = 'mpEstado.cla = null; mpRedesenharTela(); mpCarregarCla()';
    if (!cla) return mpTileEstado('liga', 'fa-shield-halved', 'Liga', mpEstado.cla === 'erro', nova);
    const servidores = cla.cla?.servidores;
    if (!servidores?.length) return mpTileEstado('liga', 'fa-shield-halved', 'Liga', false, nova, 'A Liga do mês aparece quando o clã pontuar.');
    const s = servidores[Math.min(mpEstado.inicioServidor || 0, servidores.length - 1)];
    const posicao = s.liga?.posicao;
    const pontos = s.liga?.pontos ?? s.porOrigem.reduce((soma, v) => soma + Math.max(0, v), 0);
    const participacao = s.membrosAtuais ? Math.min(100, Math.round(s.pontuaram / s.membrosAtuais * 100)) : 0;
    const clas = `${pontos.toLocaleString('pt-BR')} pts · ${s.pontuaram}${s.membrosAtuais ? ` de ${s.membrosAtuais}` : ''} pontuaram`;
    const meus = cla.liga?.servidores.find(item => item.servidor === s.servidor)?.meses?.[s.mes];
    const voce = meus ? `Você: ${meus.pontos.toLocaleString('pt-BR')} pts${meus.posicao ? ` · ${meus.posicao}º do clã` : ''}` : 'Você ainda não pontuou neste mês';
    const aria = `Liga: ${s.cla || 'o clã'} em ${posicao ? `${posicao}º lugar` : 'sem posição'}. ${clas}. ${voce}. Abrir detalhes.`;
    return mpTile('liga', 'fa-shield-halved', 'Liga', 'liga', aria, `
        <span class="tile-valor ${posicao && posicao <= 3 ? `podio-${posicao}` : ''}">${posicao ? `${posicao}º` : '—'}</span>
        <span class="tile-legenda">${s.liga?.final ? 'resultado final do clã' : 'posição do clã agora'}</span>
        <span class="ficha-barra tile-barra" aria-hidden="true"><span style="width:${participacao}%"></span></span>
        <span class="tile-linhas">
            <span>${escHtml(clas)}</span>
            <span>${escHtml(voce)}</span>
        </span>`);
}

function mpTileTorneios() {
    const nova = 'mpEstado.torneios = null; mpRedesenharTela(); mpCarregarTorneios()';
    if (mpEstado.torneios === 'erro') return mpTileEstado('torneios', 'fa-trophy', 'Torneios', true, nova);
    const t = mpTorneios();
    if (!t) return mpTileEstado('torneios', 'fa-trophy', 'Torneios', false, nova);
    if (!t.torneios?.length) return mpTileEstado('torneios', 'fa-trophy', 'Torneios', false, nova, 'Nenhum torneio nesta semana.');
    const { meus, ganho } = mpMeusPodios(t);
    const pct = Math.round(t.comCla / t.torneios.length * 100);
    const fecha = t.tempoRestante ? `fecha em ${t.tempoRestante.replace(/\s*\(.*\)\s*$/, '')}` : 'semana em andamento';
    const seus = meus.length ? `Seus pódios: ${meus.length}${ganho ? ` · +${mbCompacto(ganho)}` : ''}` : 'Você ainda não está em nenhum pódio';
    const aria = `Torneios da semana: o clã está no pódio de ${t.comCla} de ${t.torneios.length} torneios, ${fecha}. ${seus}. Abrir detalhes.`;
    return mpTile('torneios', 'fa-trophy', 'Torneios', 'torneios', aria, `
        <span class="tile-valor">${t.comCla}<small>de ${t.torneios.length}</small></span>
        <span class="tile-legenda">torneios com o clã no pódio</span>
        <span class="ficha-barra tile-barra" aria-hidden="true"><span style="width:${pct}%"></span></span>
        <span class="tile-linhas">
            <span>${escHtml(fecha)}</span>
            <span>${escHtml(seus)}</span>
        </span>`);
}

function mpTileBanco() {
    const meta = mpEstado.meta;
    if (!meta?.degraus?.length) return '';
    const liquido = Math.max(0, Number(meta.liquido) || 0);
    const pct = Math.min(100, Math.floor(liquido / meta.meta * 100));
    const fecha = mpFechaEm(meta.semana.fim);
    const valores = `${mpDinheiro(liquido)} de ${mpDinheiro(meta.meta)}`;
    const { perfil } = mpResumo(mpEu());
    const chaves = mpChavesNick(perfil);
    const minha = (meta.apoiadores || []).filter(item => chaves.has(String(item.nick).toLowerCase())).reduce((soma, item) => soma + (Number(item.valor) || 0), 0);
    const voce = minha ? `Você depositou ${mpDinheiro(minha)}` : 'Você ainda não depositou';
    return mpTile('banco', 'fa-gem', 'Meta do banco', 'banco', `Meta do banco: ${pct}% concluída, ${valores}, ${fecha}. ${voce}. Abrir detalhes.`, `
        <span class="tile-valor ${pct ? '' : 'neutro'}">${pct}%</span>
        <span class="tile-legenda">da meta da semana</span>
        <span class="ficha-barra ficha-barra-ouro tile-barra" aria-hidden="true"><span style="width:${pct}%"></span></span>
        <span class="tile-linhas">
            <span>${escHtml(valores)} · ${escHtml(fecha)}</span>
            <span>${escHtml(voce)}</span>
        </span>`);
}

function mpTilesPrincipais() {
    const tiles = [mpTileLiga(), mpTileTorneios(), mpTileBanco()].filter(Boolean);
    return `<div class="inicio-tiles" style="--colunas:${tiles.length}">${tiles.join('')}</div>`;
}

function mpTileTopo() {
    const cla = mpCla();
    if (!cla) {
        return `<div class="tile-sec tile-topo tile-estado"><span class="tile-rotulo"><i class="fa-solid fa-ranking-star" aria-hidden="true"></i> Top níveis</span><p class="tile-texto">${mpEstado.cla === 'erro' ? 'Não consegui carregar agora.' : '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Carregando...'}</p></div>`;
    }
    const eu = mpMinhaLinha();
    const topo = cla.ranking.slice(0, 3);
    if (!topo.length) return '';
    const fora = eu && eu.posicao > 3;
    return `<section class="tile-sec tile-topo" aria-label="Top níveis do clã">
        <h3 class="tile-rotulo"><i class="fa-solid fa-ranking-star" aria-hidden="true"></i> Top níveis${fora ? `<small>Você: ${eu.posicao}º</small>` : ''}</h3>
        <ol class="topo-lista">${topo.map(linha => `<li class="${linha.nick === cla.eu ? 'eu' : ''}"><a ${mpLinkMembro(linha.nick)} title="Ver o perfil de ${escHtml(linha.nick)}">
            <span class="niv-pos">${linha.posicao}º</span>
            ${mpCabeca(linha.nick, 32)}
            <span class="topo-nick">${escHtml(linha.nick)}</span>
            <span class="niv-nv">NV ${linha.nivel}</span>
        </a></li>`).join('')}</ol>
        <button type="button" class="tile-abrir tile-abrir-link" onclick="mpIr('ranking')" aria-label="Ver o ranking completo">Ver ranking <i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
    </section>`;
}

// Estado de cada farm a partir dos pedidos de trust: pedido aberto, liberada
// (algum pedido ja concluido) ou ainda por pedir.
function mpEstadoFarm(farm) {
    const pedidos = (mpEstado.acoes || []).filter(acao => acao.tipo === 'trust' && acao.dados?.farm === farm);
    if (pedidos.some(acao => ['pendente', 'executando'].includes(acao.status))) return 'aberto';
    if (pedidos.some(acao => acao.status === 'feito')) return 'liberada';
    return 'pedir';
}

const MP_ROTULO_FARM = { aberto: ['fa-hourglass-half', 'Pedido aberto'], liberada: ['fa-circle-check', 'Liberada'], pedir: ['fa-hand-pointer', 'Pedir trust'] };

// Cartao de farms e pedidos. Tem id fixo (e um vazio escondido quando nao ha
// o que mostrar) para o aviso dos pedidos trocar so ele (mpAtualizarAcoesNaTela).
function mpTileFarms() {
    const acoes = mpEstado.acoes || [];
    if (!mpPodeAgir() && !acoes.length) return '<div id="mp-tile-farms" hidden></div>';
    const abertos = acoes.filter(acao => ['pendente', 'executando'].includes(acao.status)).length;
    let resumo;
    let linhas;
    let falado;
    if (mpPodeAgir()) {
        const estados = MP_FARMS.map(item => ({ item, estado: mpEstadoFarm(item.farm) }));
        resumo = `${estados.filter(e => e.estado === 'liberada').length} de ${MP_FARMS.length} liberadas`;
        linhas = estados.map(({ item, estado }) => ({ icone: item.icone, nome: item.nome, estado, icone2: MP_ROTULO_FARM[estado][0], texto: MP_ROTULO_FARM[estado][1] }));
        falado = estados.map(({ item, estado }) => `${item.nome}: ${MP_ROTULO_FARM[estado][1].toLowerCase()}`).join('; ');
    } else {
        resumo = `${acoes.length} ${acoes.length === 1 ? 'pedido' : 'pedidos'}`;
        const rotulo = acao => (['pendente', 'executando'].includes(acao.status) ? ['aberto', 'fa-hourglass-half', 'Em andamento'] : acao.status === 'feito' ? ['liberada', 'fa-circle-check', 'Feito'] : ['pedir', 'fa-circle-xmark', 'Não liberado']);
        linhas = acoes.slice(0, 3).map(acao => {
            const [estado, icone2, texto] = rotulo(acao);
            return { icone: 'fa-list-check', nome: mpNomeAcao(acao), estado, icone2, texto };
        });
        falado = linhas.map(l => `${l.nome}: ${l.texto.toLowerCase()}`).join('; ');
    }
    return `<button type="button" id="mp-tile-farms" class="tile-sec tile-farms" onclick="mpIr('farms')" aria-label="${escHtml(`Farms e pedidos: ${resumo}. ${falado}. Abrir detalhes.`)}">
        <span class="tile-rotulo"><i class="fa-solid fa-tractor" aria-hidden="true"></i> Farms e pedidos${abertos ? `<span class="tile-selo" aria-hidden="true">${abertos}</span>` : ''}<small class="tile-resumo">${escHtml(resumo)}</small></span>
        <span class="farms-mini" aria-hidden="true">${linhas.map(l => `<span class="farm-linha ${l.estado}">
            <i class="fa-solid ${l.icone}"></i>
            <span class="farm-nome">${escHtml(l.nome)}</span>
            <span class="farm-estado"><i class="fa-solid ${l.icone2}"></i> ${l.texto}</span>
        </span>`).join('')}</span>
        <span class="tile-abrir" aria-hidden="true">Abrir <i class="fa-solid fa-chevron-right"></i></span>
    </button>`;
}

function mpTilesSecundarios() {
    const farms = mpTileFarms();
    mpEstado.tileFarmsHtml = farms;
    return `<div class="inicio-tiles-sec">${mpTileTopo()}${farms}</div>`;
}

// Tela de detalhe de um cartao: o conteudo completo de antes, com a volta. Os
// cartoes saem sem o proprio titulo (a tela ja tem o dela).
function mpTelaDetalhe(tela) {
    const [titulo, subtitulo] = MP_SUBTELAS[tela];
    const aviso = texto => `<section class="ficha-painel"><p class="info-vazio">${texto}</p></section>`;
    let corpo = '';
    if (tela === 'liga') corpo = mpCartaoClaNaLiga(true) || aviso('A Liga do mês aparece quando o clã pontuar.');
    if (tela === 'torneios') {
        if (mpEstado.torneios === 'erro') corpo = aviso('Não consegui carregar os torneios agora. <button type="button" class="mp-link" onclick="mpEstado.torneios = null; mpRedesenharTela(); mpCarregarTorneios()">Tentar de novo</button>');
        else if (!mpTorneios()) corpo = aviso('<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Carregando os torneios...');
        else corpo = mpCartaoTorneios(true) || aviso('Nenhum torneio nesta semana.');
    }
    if (tela === 'banco') corpo = mpCartaoMeta(true) || aviso('Não há meta do banco aberta agora.');
    if (tela === 'farms') {
        // Sempre com o espaco dos pedidos (#mp-pedidos): eles aparecem quando chegam.
        corpo = (mpPodeAgir() || (mpEstado.acoes || []).length ? '' : aviso('As farms são exclusivas de quem está na ETY.')) + mpCartaoFarms() + mpCartaoPedidos();
    }
    return `<div class="detalhe-tela">
        <div class="jogo-voltar-barra">
            <button type="button" class="jogo-voltar" onclick="mpIr('inicio')"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Início</button>
        </div>
        <div class="jogo-cabeca"><h1>${titulo}</h1><p>${subtitulo}</p></div>
        <div class="detalhe">${corpo}</div>
    </div>`;
}

// detalhe: na tela propria so ficam as abas de servidor (o titulo e da tela).
function mpCartaoClaNaLiga(detalhe = false) {
    const cla = mpCla();
    if (!cla) {
        const texto = mpEstado.cla === 'erro'
            ? 'Não consegui carregar o clã agora. <button type="button" class="mp-link" onclick="mpEstado.cla = null; mpRedesenharTela(); mpCarregarCla()">Tentar de novo</button>'
            : '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Carregando o clã...';
        return `<section class="ficha-painel inicio-cla"><p class="info-vazio">${texto}</p></section>`;
    }
    const resumo = cla.cla;
    if (!resumo?.servidores?.length) return '';
    const servidores = resumo.servidores;
    const sIndice = Math.min(mpEstado.inicioServidor || 0, servidores.length - 1);
    const s = servidores[sIndice];
    const origens = resumo.origens;
    const ganhos = s.porOrigem.reduce((soma, v) => soma + Math.max(0, v), 0);
    const participacao = s.membrosAtuais ? Math.min(100, Math.round(s.pontuaram / s.membrosAtuais * 100)) : null;
    const maiorSemana = Math.max(1, ...s.semanas.map(semana => semana.pontos));
    const meus = cla.liga?.servidores.find(item => item.servidor === s.servidor)?.meses?.[s.mes];
    const anterior = s.historico.filter(item => item.mes < s.mes).at(-1);
    const chips = servidores.length > 1
        ? `<span class="niv-grupo inicio-servidores">${servidores.map((item, i) => `<button type="button" class="mp-chip ${i === sIndice ? 'ativo' : ''}" aria-pressed="${i === sIndice}" onclick="mpEstado.inicioServidor = ${i}; mpRedesenharTela()">${escHtml(SERVIDORES[item.servidor] || item.servidor)}</button>`).join('')}</span>`
        : '';
    const origensHtml = origens.map((origem, o) => ({ origem, valor: s.porOrigem[o] }))
        .filter(item => item.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 4)
        .map(item => `<li><i style="background:${MP_ORIGENS[item.origem]?.cor || '#6b8193'}"></i>${MP_ORIGENS[item.origem]?.nome || escHtml(item.origem)} <b>${ganhos ? Math.round(item.valor / ganhos * 100) : 0}%</b></li>`).join('');
    return `<section class="ficha-painel inicio-cla">
        ${detalhe ? (chips ? `<h3 class="ficha-titulo ficha-titulo-solo">${chips}</h3>` : '') : `<h3 class="ficha-titulo"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> ${escHtml(s.cla || 'Clã')} na Liga ${chips}</h3>`}
        <div class="inicio-cla-topo">
            <div class="inicio-cla-pos ${s.liga?.posicao && s.liga.posicao <= 3 ? `podio-${s.liga.posicao}` : ''}">
                <strong>${s.liga?.posicao ? `${s.liga.posicao}º` : '—'}</strong>
                <small>${s.liga?.final ? 'resultado final' : 'posição agora'}</small>
            </div>
            <div class="inicio-cla-numeros">
                <div><span>Pontos do clã</span><b>${(s.liga?.pontos ?? ganhos).toLocaleString('pt-BR')}</b>${anterior?.posicao ? `<small>mês passado: ${anterior.posicao}º</small>` : ''}</div>
                <div><span>Pontuaram</span><b>${s.pontuaram}${s.membrosAtuais ? ` <small>de ${s.membrosAtuais}</small>` : ''}</b>${participacao !== null ? `<div class="ficha-barra"><span style="width:${participacao}%"></span></div>` : ''}</div>
                <div><span>Você</span><b>${meus ? `${meus.pontos.toLocaleString('pt-BR')} <small>pts</small>` : '<small>sem pontos</small>'}</b>${meus?.posicao ? `<small>${meus.posicao}º do clã</small>` : '<small>pontue para aparecer</small>'}</div>
            </div>
        </div>
        <div class="inicio-cla-baixo">
            <div class="inicio-semanas" aria-label="Pontos do clã por semana">
                ${s.semanas.map(semana => `<div class="inicio-semana" title="${escHtml(semana.rotulo)}: ${semana.pontos.toLocaleString('pt-BR')} pontos">
                    <span class="inicio-semana-valor">${semana.pontos.toLocaleString('pt-BR')}</span>
                    <span class="inicio-semana-barra"><span style="height:${Math.max(4, Math.round(Math.max(0, semana.pontos) / maiorSemana * 100))}%"></span></span>
                    <small>${semana.numero ? `${semana.numero}ª sem` : ''}</small>
                </div>`).join('')}
            </div>
            <ul class="inicio-origens">${origensHtml}</ul>
        </div>
        <button type="button" class="mp-link inicio-mais" onclick="mpEstado.aba = 'liga'; mpIr('perfil')">Ver meus pontos na Liga <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
    </section>`;
}

// ---------- Perfil de outro membro (18/10/2026) ----------
// Dados publicos (os mesmos da pagina Membros): /api/perfis e /api/membros,
// pedidos uma vez por visita ao painel.

async function mpCarregarPublicos() {
    if (mpEstado.publicos) return mpEstado.publicos;
    const [perfis, membros] = await Promise.all([
        fetch(`${URL_BASE}/api/perfis`).then(r => (r.ok ? r.json() : [])),
        fetch(`${URL_BASE}/api/membros`).then(r => (r.ok ? r.json() : [])),
    ]);
    const porNick = new Map();
    // O mesmo nick pode ter um cadastro antigo e um ativo: o ativo ganha.
    for (const membro of Array.isArray(membros) ? membros : []) {
        const chave = String(membro.nick || '').toLowerCase();
        if (!porNick.has(chave) || membro.status === 'Ativo') porNick.set(chave, membro);
    }
    mpEstado.publicos = {
        perfis: new Map((Array.isArray(perfis) ? perfis : []).map(p => [String(p.nick).toLowerCase(), p])),
        membros: porNick,
    };
    return mpEstado.publicos;
}

function mpAbrirJogador(nick) {
    if (!nick) return false;
    if (String(nick).toLowerCase() === String(mpEstado.dados.perfil.nick).toLowerCase()) {
        mpIr('perfil');
        return false;
    }
    if (mpEstado.tela !== 'jogador') mpEstado.voltar = mpEstado.tela;
    mpEstado.tela = 'jogador';
    mpEstado.jogadorNick = nick;
    mpEstado.jogador = null;
    mpEstado.aba = 'geral';
    mpEstado.mes = 0;
    history.replaceState(null, '', `${location.pathname}${location.search}#meu-painel&tela=jogador&nick=${encodeURIComponent(nick)}`);
    mpDesenhar();
    window.scrollTo({ top: 0 });
    mpCarregarPublicos().then(({ perfis, membros }) => {
        const chave = String(nick).toLowerCase();
        mpEstado.jogador = perfis.has(chave) ? { perfil: perfis.get(chave), membro: membros.get(chave) || null } : { erro: true };
    }).catch(() => {
        mpEstado.publicos = null;
        mpEstado.jogador = { erro: true };
    }).finally(() => {
        if (mpEstado.tela === 'jogador' && mpEstado.jogadorNick === nick) mpRedesenharTela();
    });
    return false;
}

function mpTelaJogador() {
    const voltar = mpEstado.voltar && mpEstado.voltar !== 'jogador' ? mpEstado.voltar : 'ranking';
    const rotulo = { inicio: 'Início', ranking: 'Ranking', perfil: 'Meu perfil', liga: 'Liga', torneios: 'Torneios', banco: 'Meta do banco', farms: 'Farms' }[voltar] || 'Ranking';
    const barra = `<div class="jogo-voltar-barra">
        <button type="button" class="jogo-voltar" onclick="mpIr('${voltar}')"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> ${rotulo}</button>
        <span>Perfil de membro</span>
    </div>`;
    if (!mpEstado.jogador) return `${barra}<section class="ficha-painel"><p class="info-vazio"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Abrindo o perfil de ${escHtml(mpEstado.jogadorNick)}...</p></section>`;
    if (mpEstado.jogador.erro) return `${barra}<section class="ficha-painel"><p class="info-vazio">Não encontrei o perfil de ${escHtml(mpEstado.jogadorNick)}. O perfil aparece depois da próxima atualização do site.</p></section>`;
    return barra + mpTelaPerfil();
}
