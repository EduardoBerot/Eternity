// A semana do cla no Inicio do painel (18/10/2026): a meta do banco e os
// torneios, nos mesmos cards (ficha-painel + ficha-titulo) do resto do Inicio.
// O card grande de meta-banco.js saiu daqui por destoar do painel; o calculo
// continua no bot, e o site so desenha.
//
// Torneios: GET /api/torneios (tournaments.service.js no eternity-crud), o
// snapshot do painel de torneios do Discord publicado pelo bot. Os "seus
// podios" sao os do nick logado e dos alts do vinculo.

const URL_TORNEIOS = `${URL_BASE}/api/torneios`;

function mpNickChave(nick) {
    return String(nick || '').replace(/^\*+/, '').toLowerCase();
}

function mpChavesNick(perfil) {
    return new Set([perfil.nick, ...(perfil.alts || [])].map(mpNickChave));
}

function mpLugar(posicao) {
    return `<span class="semana-lugar lugar-${posicao}">${posicao}º</span>`;
}

// ---------- Meta do banco ----------

function mpCartaoMeta() {
    const meta = mpEstado.meta;
    if (!meta?.degraus?.length) return '';
    const { perfil } = mpResumo(mpEu());
    const liquido = Math.max(0, Number(meta.liquido) || 0);
    const degraus = meta.degraus;
    const nivel = degraus.filter(degrau => liquido >= degrau.valor).length;
    const cheia = nivel === degraus.length;
    const proximo = degraus[nivel] || null;
    const pct = Math.min(100, Math.floor(liquido / meta.meta * 100));
    const chaves = mpChavesNick(perfil);
    const minha = (meta.apoiadores || []).filter(item => chaves.has(String(item.nick).toLowerCase())).reduce((soma, item) => soma + (Number(item.valor) || 0), 0);

    const marcas = degraus.map((degrau, i) => `<span class="semana-marca ${i < nivel ? 'feita' : ''}" style="left:${degrau.valor / meta.meta * 100}%" title="${mbCompacto(degrau.valor)}: ${mbPct(degrau.taxa)}"></span>`).join('');
    const passos = [{ valor: 0, taxa: meta.taxaBase, base: true }, ...degraus].map((degrau, i) => {
        const chegou = degrau.base || i <= nivel;
        const agora = i === nivel;
        return `<li class="${chegou ? 'feito' : ''} ${agora ? 'agora' : ''}">
            <b>${mbPct(degrau.taxa)}</b>
            <small>${degrau.base ? 'sempre' : mbCompacto(degrau.valor)}</small>
            ${degrau.extra ? `<em>${escHtml(degrau.extra)}</em>` : ''}
        </li>`;
    }).join('');
    const chamada = cheia
        ? `<i class="fa-solid fa-crown" aria-hidden="true"></i> <span><b>Meta cheia!</b> Os pódios da semana pagam <b>${mbPct(degraus.at(-1).taxa)}</b> de adicional.</span>`
        : `<i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i> <span>Faltam <b>${escHtml(mpDinheiro(proximo.valor - liquido))}</b> para o adicional subir para <b>${mbPct(proximo.taxa)}</b>${proximo.extra ? ` e liberar <b>${escHtml(proximo.extra)}</b>` : ''}.</span>`;
    const apoiadores = (meta.apoiadores || []).slice(0, 3);

    return `<section class="ficha-painel semana-meta ${cheia ? 'cheia' : ''}">
        <h3 class="ficha-titulo"><i class="fa-solid fa-gem" aria-hidden="true"></i> Meta do banco<small><i class="fa-regular fa-clock" aria-hidden="true"></i> fecha em ${escHtml(mbFaltaTexto(meta.semana.fim))}</small></h3>
        <div class="semana-meta-numeros">
            <b>${escHtml(mpDinheiro(liquido))}</b>
            <span>de ${escHtml(mpDinheiro(meta.meta))}</span>
            <strong>${pct}%</strong>
        </div>
        <div class="semana-trilha">
            <div class="ficha-barra ficha-barra-ouro" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Depósitos da semana"><span style="width:${pct}%"></span></div>
            ${marcas}
        </div>
        <ol class="semana-degraus" aria-label="Adicional dos pódios por degrau">${passos}</ol>
        <p class="semana-chamada">${chamada}</p>
        <div class="semana-meta-pe">
            <p class="semana-voce">${minha
                ? `<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Você depositou <b>${escHtml(mpDinheiro(minha))}</b> nesta semana.`
                : '<i class="fa-solid fa-coins" aria-hidden="true"></i> Deposite com <code>/clan banco depositar</code>: todo valor sobe a barra.'}</p>
            ${apoiadores.length ? `<ul class="semana-apoiadores" aria-label="Quem mais depositou">${apoiadores.map(item => `<li title="${escHtml(item.nick)}: ${escHtml(mpDinheiro(item.valor))}">${mpCabeca(item.nick, 22)}<span>${escHtml(item.nick)}</span><b>${mbCompacto(item.valor)}</b></li>`).join('')}</ul>` : ''}
        </div>
    </section>`;
}

// ---------- Torneios da semana ----------

async function mpCarregarTorneios() {
    try {
        const resposta = await fetch(URL_TORNEIOS);
        mpEstado.torneios = resposta.ok ? await resposta.json() : null;
    } catch {
        mpEstado.torneios = null;
    }
    if (mpEstado.torneios && location.hash.startsWith('#meu-painel') && mpEstado.tela === 'inicio') mpRedesenharTela();
}

function mpCartaoTorneios() {
    const t = mpEstado.torneios;
    if (!t?.torneios?.length) return '';
    const { perfil } = mpResumo(mpEu());
    const chaves = mpChavesNick(perfil);
    const meus = t.torneios.flatMap(torneio => torneio.top
        .filter(item => chaves.has(mpNickChave(item.nick)))
        .map(item => ({ nome: torneio.nome, posicao: item.posicao })))
        .sort((a, b) => a.posicao - b.posicao);
    const taxa = Number(mpEstado.meta?.taxaAtual ?? t.taxaBase) || 0;
    const premio = lugar => (Number(t.premios?.[lugar]) || 0) * taxa;
    const nosso = t.projecao.find(clan => clan.nosso);
    const pctPodio = Math.round(t.comCla / t.torneios.length * 100);

    const projecao = t.projecao.slice(0, 5);
    if (nosso && !projecao.includes(nosso)) projecao.push(nosso);
    const corrida = projecao.map(clan => `<li class="${clan.nosso ? 'eu' : ''}">
            <span class="niv-pos">${clan.posicao}º</span>
            <span class="semana-tag">${escHtml(clan.tag)}</span>
            <span class="semana-corrida-podios">${clan.podios} ${clan.podios === 1 ? 'pódio' : 'pódios'}</span>
            <b>${clan.pontos.toLocaleString('pt-BR')}</b>
        </li>`).join('');

    const ganho = meus.reduce((soma, item) => soma + premio(item.posicao), 0);
    const MOSTRAR = 4;
    const seus = meus.length
        ? `<ul class="semana-meus">${meus.slice(0, MOSTRAR).map(item => `<li>${mpLugar(item.posicao)}<span>${escHtml(item.nome)}</span>${premio(item.posicao) ? `<b>+${mbCompacto(premio(item.posicao))}</b>` : ''}</li>`).join('')}</ul>${meus.length > MOSTRAR ? `<p class="semana-mais">e mais ${meus.length - MOSTRAR} ${meus.length - MOSTRAR === 1 ? 'pódio' : 'pódios'} na lista de todos os torneios</p>` : ''}`
        : '<p class="semana-vazio">Você ainda não está em nenhum pódio. Abra <code>/torneio</code> no jogo e escolha um para disputar.</p>';

    const todos = t.torneios.map(torneio => `<li class="${torneio.top.some(item => item.cla) ? 'com-cla' : ''}">
            <b>${escHtml(torneio.nome)}</b>
            <span>${torneio.top.map(item => `<span class="${item.cla ? 'cla' : ''} ${chaves.has(mpNickChave(item.nick)) ? 'eu' : ''}">${mpLugar(item.posicao)} ${escHtml(item.nick)}${!item.cla && item.tag ? ` <small>${escHtml(item.tag)}</small>` : ''}</span>`).join('') || '<small>sem pódio</small>'}</span>
        </li>`).join('');

    return `<section class="ficha-painel semana-torneios">
        <h3 class="ficha-titulo"><i class="fa-solid fa-trophy" aria-hidden="true"></i> Torneios da semana${t.tempoRestante ? `<small><i class="fa-regular fa-clock" aria-hidden="true"></i> fecha em ${escHtml(t.tempoRestante.replace(/\s*\(.*\)\s*$/, ''))}</small>` : ''}</h3>
        <div class="inicio-cla-numeros">
            <div><span>Clã no pódio</span><b>${t.comCla} <small>de ${t.torneios.length}</small></b><div class="ficha-barra"><span style="width:${pctPodio}%"></span></div></div>
            <div><span>Pódios do clã</span><b>${t.presenca.posicoes}</b><small>${t.participacao.membros} ${t.participacao.membros === 1 ? 'membro' : 'membros'} no pódio</small></div>
            <div><span>Clã na semana</span><b>${nosso ? `${nosso.posicao}º` : '—'}</b><small>${t.pontosLiga.pontos.toLocaleString('pt-BR')} pts projetados</small></div>
        </div>
        <div class="semana-torneios-meio">
            <div>
                <h4>Corrida dos clãs</h4>
                <ol class="semana-corrida">${corrida}</ol>
            </div>
            <div>
                <h4>Seus pódios${meus.length ? `<small>${meus.length}${ganho ? ` · +${mbCompacto(ganho)}` : ''}</small>` : ''}</h4>
                ${seus}
            </div>
        </div>
        ${taxa && premio(1) ? `<p class="semana-premio"><i class="fa-solid fa-coins" aria-hidden="true"></i> <span>O clã paga <b>${mbPct(taxa)}</b> de adicional por pódio: <b>${mbCompacto(premio(1))}</b> no 1º, <b>${mbCompacto(premio(2))}</b> no 2º e <b>${mbCompacto(premio(3))}</b> no 3º, na segunda-feira.</span></p>` : ''}
        <details class="semana-todos">
            <summary>Ver o pódio de todos os torneios <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></summary>
            <ul>${todos}</ul>
        </details>
    </section>`;
}
