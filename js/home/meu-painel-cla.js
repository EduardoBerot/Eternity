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
        <div class="inicio-grade">
            <div class="inicio-col">
                ${mpCartaoClaNaLiga()}
                ${mpCartaoTorneios()}
                ${mpCartaoFarms()}
            </div>
            <div class="inicio-col">
                ${mpMissoes(perfil)}
                ${mpCartaoMeta()}
                ${mpCartaoTopo()}
                ${mpCartaoPedidos()}
            </div>
        </div>`;
}

function mpCartaoClaNaLiga() {
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
        <h3 class="ficha-titulo"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> ${escHtml(s.cla || 'Clã')} na Liga ${chips}</h3>
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

function mpCartaoTopo() {
    const cla = mpCla();
    if (!cla) return '';
    const eu = mpMinhaLinha();
    const topo = cla.ranking.slice(0, 5);
    const linhas = [...topo, ...(eu && eu.posicao > 5 ? [null, eu] : [])];
    const emAlta = cla.ranking.filter(linha => linha.semana > 0).sort((a, b) => b.semana - a.semana).slice(0, 3);
    const itens = linhas.map(linha => (linha === null
        ? '<li class="inicio-ranking-pula" aria-hidden="true">⋯</li>'
        : `<li class="${linha.nick === cla.eu ? 'eu' : ''}"><a ${mpLinkMembro(linha.nick)} title="Ver o perfil de ${escHtml(linha.nick)}">
            <span class="niv-pos">${linha.posicao}º</span>
            ${mpCabeca(linha.nick, 24)}
            <span class="inicio-ranking-nick">${escHtml(linha.nick)}</span>
            <span class="niv-nv">NV ${linha.nivel}</span>
        </a></li>`)).join('');
    return `<section class="ficha-painel inicio-topo">
        <h3 class="ficha-titulo"><i class="fa-solid fa-ranking-star" aria-hidden="true"></i> Top níveis</h3>
        <ol class="inicio-ranking">${itens}</ol>
        ${emAlta.length ? `<div class="inicio-em-alta"><span><i class="fa-solid fa-fire" aria-hidden="true"></i> Em alta na semana</span>${emAlta.map(linha => `<a class="inicio-em-alta-item" ${mpLinkMembro(linha.nick)}>${escHtml(linha.nick)} <b>+${linha.semana.toLocaleString('pt-BR')}</b></a>`).join('')}</div>` : ''}
        <button type="button" class="mp-link inicio-mais" onclick="mpIr('ranking')">Ver o ranking completo <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
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
    const rotulo = { inicio: 'Início', ranking: 'Ranking', perfil: 'Meu perfil' }[voltar] || 'Ranking';
    const barra = `<div class="jogo-voltar-barra">
        <button type="button" class="jogo-voltar" onclick="mpIr('${voltar}')"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> ${rotulo}</button>
        <span>Perfil de membro</span>
    </div>`;
    if (!mpEstado.jogador) return `${barra}<section class="ficha-painel"><p class="info-vazio"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Abrindo o perfil de ${escHtml(mpEstado.jogadorNick)}...</p></section>`;
    if (mpEstado.jogador.erro) return `${barra}<section class="ficha-painel"><p class="info-vazio">Não encontrei o perfil de ${escHtml(mpEstado.jogadorNick)}. O perfil aparece depois da próxima atualização do site.</p></section>`;
    return barra + mpTelaPerfil();
}
