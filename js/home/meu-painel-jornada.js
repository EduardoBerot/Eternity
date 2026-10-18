// Jornada dos 7 Dias (18/10/2026): o caminho do novato da ETZ no painel. Uma
// missao libera por dia e as liberadas ficam abertas ate o fim. Completar nao e
// obrigatorio: adianta a subida para a ETY (15 dias de cla em vez de 30), traz o
// confiavel nas farms junto com a subida e paga 100k de ajuda inicial.
//
// A API (jornada.service.js no eternity-crud) diz o que esta liberado e o que
// foi cumprido; quem confere cada etapa sao os bots (chat do jogo, Discord,
// banco, Liga, mcMMO) e o proprio painel (abrir, escolher se mora na cidade).
// So aparece para quem esta fazendo a jornada.

const MP_JORNADA_ETAPAS = {
    chegada: { icone: 'fa-location-dot', texto: 'Use <code>/go ETY</code> e mande um oi no chat local', ajuda: 'A Eternity fica na cidade e ouve o chat local de quem chega.' },
    painel: { icone: 'fa-display', texto: 'Abra o seu painel', ajuda: 'Pronto: você já está nele.' },
    cidade: { icone: 'fa-house-chimney', texto: 'Decida se vai morar na cidade', ajuda: 'Casa ou terreno: escolha e veja os lugares livres no mapa da cidade.' },
    cla: { icone: 'fa-comments', texto: 'Mande uma mensagem no chat do clã com <code>/c</code>' },
    discord: { icone: 'fa-brands fa-discord', texto: 'Mande uma mensagem no Discord da Eternity' },
    call: { icone: 'fa-headset', texto: 'Fique 5 minutos em uma call do Discord', ajuda: 'Pode ser sozinho: entre em qualquer canal de voz.' },
    eternity: { icone: 'fa-robot', texto: 'Mande uma pergunta para a Eternity no privado', ajuda: 'No jogo: <code>/m Eternity</code> e a sua pergunta. Ela responde sobre o clã, a Liga, o banco e o servidor.' },
    herbalismo: { icone: 'fa-seedling', texto: 'Chegue ao nível 20 em Herbalismo' },
    banco: { icone: 'fa-coins', texto: 'Deposite 30k no banco do clã', ajuda: 'No jogo: <code>/clan banco depositar</code> e o valor. Pode ser em partes.' },
    liga: { icone: 'fa-trophy', texto: 'Faça 1 ponto para a Eternity na Liga' },
    dias: { icone: 'fa-calendar-check', texto: 'Jogue em 10 dias diferentes' },
};
const MP_CIDADE_ESCOLHAS = [
    ['casa', 'fa-house', 'Quero uma casa'],
    ['terreno', 'fa-map', 'Quero um terreno'],
    ['agora_nao', 'fa-clock', 'Agora não'],
];
const MP_JORNADA_ICONES = ['fa-door-open', 'fa-users', 'fa-robot', 'fa-seedling', 'fa-coins', 'fa-shirt', 'fa-gift'];

async function mpCarregarJornada() {
    const antes = Boolean(mpEstado.jornada);
    try {
        const resposta = await fetch(`${URL_PAINEL_MEMBRO}/jornada`, { headers: { Authorization: `Bearer ${mpLerSessao()}` } });
        if (!resposta.ok) return;
        mpEstado.jornada = (await resposta.json()).jornada || null;
    } catch { return; }
    if (!location.hash.startsWith('#meu-painel') || !mpEstado.dados) return;
    // A aba da Jornada entra no HUD quando a jornada chega.
    if (Boolean(mpEstado.jornada) !== antes) return mpDesenhar();
    if (['inicio', 'jornada'].includes(mpEstado.tela)) mpRedesenharTela();
}

function mpDiaCurto(data) {
    const [, mes, dia] = String(data || '').split('-');
    return dia ? `${dia}/${mes}` : '';
}

function mpMissaoAtual(jornada) {
    return jornada.missoes.find(missao => missao.liberada && !missao.feita) || null;
}

// ---------- Cartao no Inicio ----------

function mpCartaoJornadaInicio() {
    const jornada = mpEstado.jornada;
    if (!jornada) return '';
    const feitas = jornada.missoes.filter(missao => missao.feita).length;
    const atual = mpMissaoAtual(jornada);
    const proxima = jornada.missoes.find(missao => !missao.liberada);
    const chamada = jornada.completa
        ? `Jornada completa! ${jornada.recompensa.pagaEm ? 'Os 100k já foram pagos.' : 'Os 100k saem em instantes.'} Sua subida para a ETY libera em <b>${mpDiaCurto(jornada.subida.data)}</b>.`
        : atual
            ? `Dia ${atual.dia} liberado: <b>${escHtml(atual.titulo)}</b>`
            : proxima ? `Tudo em dia! A próxima missão libera em <b>${mpDiaCurto(proxima.liberaEm)}</b>.` : '';
    return `<section class="ficha-painel jornada-chamada" onclick="mpIr('jornada')">
        <div class="jornada-chamada-selo"><i class="fa-solid fa-route" aria-hidden="true"></i></div>
        <div class="jornada-chamada-texto">
            <h3>Jornada dos 7 Dias <small>${feitas}/7</small></h3>
            <p>${chamada}</p>
            <div class="jornada-trilha" aria-hidden="true">${jornada.missoes.map(missao => `<span class="${missao.feita ? 'feita' : missao.liberada ? 'aberta' : ''}"></span>`).join('')}</div>
        </div>
        <button type="button" class="mp-acao" onclick="event.stopPropagation(); mpIr('jornada')">${jornada.completa ? 'Ver' : 'Continuar'}</button>
    </section>`;
}

// ---------- Tela da Jornada ----------

function mpTelaJornada() {
    const jornada = mpEstado.jornada;
    if (!jornada) return mpTelaInicio();
    const feitas = jornada.missoes.filter(missao => missao.feita).length;
    const pct = Math.round(feitas / 7 * 100);
    const premio = jornada.completa
        ? `<div class="jornada-premio feito"><i class="fa-solid fa-gift" aria-hidden="true"></i><span><b>Jornada completa!</b> ${jornada.recompensa.pagaEm ? `100k pagos em ${escHtml(mpData(jornada.recompensa.pagaEm))}.` : 'A Eternity vai mandar os 100k em instantes.'} Subida para a ETY e confiável nas farms em <b>${mpDiaCurto(jornada.subida.data)}</b>.</span></div>`
        : `<div class="jornada-premio"><i class="fa-solid fa-gift" aria-hidden="true"></i><span>Complete as 7 missões e ganhe <b>100k de ajuda inicial</b>, com a subida para a ETY aos <b>15 dias</b> de clã em vez de ${jornada.regraAntiga ? 20 : 30}.</span></div>`;
    return `<div class="jogo-cabeca jornada-cabeca">
            <h1>Jornada dos 7 Dias</h1>
            <p>Uma missão nova por dia para você conhecer a Eternity e se firmar no Apocalipse. As liberadas ficam abertas até você terminar.</p>
            <div class="jornada-progresso">
                <div class="ficha-barra ficha-barra-ouro" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Missões concluídas"><span style="width:${pct}%"></span></div>
                <b>${feitas}/7</b>
            </div>
            ${premio}
        </div>
        <div class="jornada-missoes">${jornada.missoes.map(missao => mpCartaoMissao(jornada, missao)).join('')}</div>`;
}

function mpCartaoMissao(jornada, missao) {
    const estado = missao.feita ? 'feita' : missao.liberada ? 'aberta' : 'trancada';
    const selo = missao.feita
        ? `<span class="jornada-selo feita"><i class="fa-solid fa-check" aria-hidden="true"></i> Concluída</span>`
        : missao.liberada
            ? '<span class="jornada-selo aberta">Liberada</span>'
            : `<span class="jornada-selo"><i class="fa-solid fa-lock" aria-hidden="true"></i> Libera em ${mpDiaCurto(missao.liberaEm)}</span>`;
    return `<section class="ficha-painel jornada-missao ${estado}" id="jornada-dia-${missao.dia}">
        <header class="jornada-missao-topo">
            <span class="jornada-dia"><i class="fa-solid ${MP_JORNADA_ICONES[missao.dia - 1]}" aria-hidden="true"></i><small>Dia ${missao.dia}</small></span>
            <h3>${escHtml(missao.titulo)}</h3>
            ${selo}
        </header>
        ${mpCorpoMissao(jornada, missao)}
    </section>`;
}

function mpEtapas(missao, { semAjuda = false } = {}) {
    return `<ul class="jornada-etapas">${missao.etapas.map(({ etapa, feitaEm }) => {
        const info = MP_JORNADA_ETAPAS[etapa] || { icone: 'fa-circle', texto: etapa };
        const icone = info.icone.startsWith('fa-brands') ? info.icone : `fa-solid ${info.icone}`;
        return `<li class="${feitaEm ? 'feita' : ''}">
            <i class="${feitaEm ? 'fa-solid fa-circle-check' : icone}" aria-hidden="true"></i>
            <span>${info.texto}${!semAjuda && info.ajuda && !feitaEm ? `<small>${info.ajuda}</small>` : ''}</span>
        </li>`;
    }).join('')}</ul>`;
}

function mpBarraJornada(valor, meta, rotulo) {
    const pct = Math.max(0, Math.min(100, Math.round(valor / meta * 100)));
    return `<div class="jornada-barra">
        <div class="ficha-barra" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${escHtml(rotulo)}"><span style="width:${pct}%"></span></div>
        <small>${rotulo}</small>
    </div>`;
}

function mpCorpoMissao(jornada, missao) {
    const p = jornada.progresso;
    const m = jornada.meta;
    const aberta = missao.liberada && !missao.feita;
    if (missao.dia === 1) return mpEtapas(missao) + (missao.liberada ? mpEscolhaCidade(jornada) : '');
    if (missao.dia === 4) return mpEtapas(missao, { semAjuda: true }) + mpCorpoRaizes(jornada, missao, aberta);
    if (missao.dia === 5) {
        return mpEtapas(missao)
            + mpBarraJornada(Math.min(p.banco, m.banco), m.banco, `${mpDinheiro(Math.min(p.banco, m.banco))} de ${mpDinheiro(m.banco)}`)
            + mpMetaNaJornada();
    }
    if (missao.dia === 6) return mpEtapas(missao) + mpCorpoLiga(jornada);
    if (missao.dia === 7) return mpEtapas(missao) + mpBarraJornada(Math.min(p.dias, m.dias), m.dias, `${Math.min(p.dias, m.dias)} de ${m.dias} dias jogados`) + mpCorpoRecompensa(jornada);
    return mpEtapas(missao);
}

function mpEscolhaCidade(jornada) {
    if (jornada.cidade) {
        const escolha = MP_CIDADE_ESCOLHAS.find(([id]) => id === jornada.cidade);
        const mapa = jornada.cidade === 'agora_nao' ? '' : ' <a href="#cidade">Ver os lugares livres no mapa da cidade</a>';
        return `<p class="mp-nota jornada-escolha"><i class="fa-solid ${escolha?.[1] || 'fa-check'}" aria-hidden="true"></i> Sua escolha: <b>${escolha?.[2] || ''}</b>.${mapa} <button type="button" class="mp-link" onclick="mpEstado.jornada.cidade = null; mpRedesenharTela()">Mudar</button></p>`;
    }
    return `<div class="jornada-botoes">${MP_CIDADE_ESCOLHAS.map(([id, icone, rotulo]) => `<button type="button" class="mp-acao ${id === 'agora_nao' ? 'mp-acao-fraca' : ''}" onclick="mpEscolherCidade('${id}', this)"><i class="fa-solid ${icone}" aria-hidden="true"></i> ${rotulo}</button>`).join('')}</div>`;
}

async function mpEscolherCidade(escolha, botao) {
    if (botao) { botao.disabled = true; botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Salvando'; }
    try {
        const resposta = await fetch(`${URL_PAINEL_MEMBRO}/jornada/cidade`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${mpLerSessao()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ escolha }),
        });
        const corpo = await resposta.json().catch(() => ({}));
        if (resposta.status === 401) { mpGuardarSessao(null); return mpTelaLogin(null); }
        if (!resposta.ok) return mpAviso(corpo.message || 'Não foi possível salvar agora.', 'erro');
        mpEstado.jornada = corpo.jornada;
        mpAviso(escolha === 'agora_nao' ? 'Anotado! Quando quiser morar na cidade, o mapa está em <a href="#cidade">Cidade</a>.' : 'Boa escolha! Veja os lugares livres no <a href="#cidade">mapa da cidade</a>.', 'ok');
    } catch {
        mpAviso('O site não respondeu. Tente de novo em instantes.', 'erro');
    }
    mpRedesenharTela();
}

// Dia 4: o botao Conferir pede para a Eternity ler o mcMMO (fila de acoes) e o
// gancho dos titulos -- os mais perto de serem conquistados.
function mpCorpoRaizes(jornada, missao, aberta) {
    const nivel = jornada.progresso.herbalismo;
    const meta = jornada.meta.herbalismo;
    const pedido = mpAcaoAberta();
    const conferindo = pedido?.tipo === 'conferir';
    const botao = aberta
        ? `<button type="button" class="mp-acao" ${pedido ? 'disabled' : ''} onclick="mpPedirAcao('conferir', { skill: 'herbalismo' }, this)">${conferindo ? '<i class="fa-solid fa-gear fa-spin" aria-hidden="true"></i> Conferindo' : '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Conferir'}</button>`
        : '';
    const proximos = (mpEstado.dados?.perfil?.privado?.proximosTitulos || []).slice(0, 4);
    const titulos = proximos.length
        ? `<ul class="jornada-titulos">${proximos.map(item => {
            const info = TITULOS_POR_NOME.get(item.nome);
            const cor = info?.familia ? `--de:${info.familia.de};--ate:${info.familia.ate}` : '';
            const pct = item.meta ? Math.min(100, Math.round((Number(item.atual) || 0) / item.meta * 100)) : 0;
            return `<li style="${cor}"><span class="tit-nome">${info ? tituloHtml(item.nome, info) : `<b>${escHtml(item.nome)}</b>`}</span><small>${escHtml(item.requisito || '')}</small><div class="ficha-barra"><span style="width:${pct}%"></span></div></li>`;
        }).join('')}</ul>`
        : '';
    return `${nivel ? mpBarraJornada(Math.min(nivel, meta), meta, `Última leitura: nível ${nivel} de ${meta}`) : ''}
        ${aberta ? `<div class="jornada-conferir">
            <p class="mp-nota"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Você precisa estar <b>online no servidor</b> para a Eternity conferir. Com o perfil trancado, vá até o <code>/go ETY</code> antes.</p>
            ${botao}
        </div>` : ''}
        <div class="jornada-gancho">
            <h4><i class="fa-solid fa-crown" aria-hidden="true"></i> Títulos do clã</h4>
            <p>O mcMMO conta para os títulos: cada skill tem uma escada, e o título aparece no seu nick na ETY. ${proximos.length ? 'Os mais perto de você:' : ''}</p>
            ${titulos}
            <button type="button" class="mp-link" onclick="mpEstado.aba = 'conquistas'; mpIr('perfil')">Ver todos os títulos</button>
        </div>`;
}

// Dia 5: a barra da meta da semana, para o deposito virar parte de algo maior.
function mpMetaNaJornada() {
    const meta = mpEstado.meta;
    if (!meta?.degraus?.length) return '';
    const topo = meta.degraus.at(-1).valor;
    const pct = Math.max(0, Math.min(100, Math.round((Number(meta.liquido) || 0) / topo * 100)));
    const degraus = meta.degraus.map(degrau => {
        const chegou = (Number(meta.liquido) || 0) >= degrau.valor;
        const rotulo = `${mpDinheiro(degrau.valor)}${degrau.extra ? ` · ${degrau.extra}` : ''}`;
        return `<span class="${chegou ? 'feito' : ''}"><i class="fa-solid ${chegou ? 'fa-circle-check' : 'fa-circle'}" aria-hidden="true"></i> ${escHtml(rotulo)}</span>`;
    }).join('');
    return `<div class="jornada-gancho">
        <h4><i class="fa-solid fa-bullseye" aria-hidden="true"></i> Meta da semana do clã</h4>
        <p>${mpDinheiro(meta.liquido)} de ${mpDinheiro(topo)} (${pct}%). <b>Seu depósito também conta para a meta.</b></p>
        <div class="ficha-barra ficha-barra-ouro"><span style="width:${pct}%"></span></div>
        <div class="jornada-degraus">${degraus}</div>
    </div>`;
}

// Dia 6: os tres jeitos de pontuar na Liga num lugar so.
function mpCorpoLiga(jornada) {
    const s = mpCla()?.cla?.servidores?.find(item => item.servidor === 'apocalipse') || mpCla()?.cla?.servidores?.[0];
    const posicao = s?.liga?.posicao ? `A Eternity está em <b>${s.liga.posicao}º lugar</b> na Liga de ${MP_MESES_LONGOS[(Number(String(s.mes).slice(5, 7)) || 1) - 1] || 'este mês'}.` : 'Todo mês os clãs disputam a Liga, e cada ponto de membro conta.';
    const origem = MP_ORIGENS[jornada.progresso.ligaOrigem]?.nome;
    return `<div class="jornada-gancho">
        <p>${posicao}</p>
        <ul class="jornada-jeitos">
            <li><i class="fa-solid fa-check-to-slot" aria-hidden="true"></i><span><code>/votar</code><small>Vote no servidor todo dia</small></span></li>
            <li><i class="fa-solid fa-bullseye" aria-hidden="true"></i><span><code>/desafios</code><small>Cumpra os desafios do dia</small></span></li>
            <li><i class="fa-solid fa-trophy" aria-hidden="true"></i><span><code>/torneio</code><small>Dispute os torneios entre clãs</small></span></li>
        </ul>
        <p class="mp-nota">Seus pontos na jornada: <b>${jornada.progresso.liga.toLocaleString('pt-BR')}</b>${origem ? ` (o primeiro veio de ${escHtml(origem.toLowerCase())})` : ''}. O ponto pode levar até 30 min para aparecer. <button type="button" class="mp-link" onclick="mpEstado.aba = 'liga'; mpIr('perfil')">Ver meus pontos na Liga</button></p>
    </div>`;
}

// Dia 7: a vitrine das farms e a linha do tempo da subida.
function mpCorpoRecompensa(jornada) {
    const farms = MP_FARMS.map(item => `<li><i class="fa-solid ${item.icone}" aria-hidden="true"></i><span><b>${item.nome}</b><small><code>/go ${item.farm}</code></small></span></li>`).join('');
    const com = jornada.completa;
    return `<div class="jornada-gancho">
        <h4><i class="fa-solid fa-gift" aria-hidden="true"></i> Complete a Jornada e ganhe</h4>
        <ul class="jornada-recompensas">
            <li><i class="fa-solid fa-coins" aria-hidden="true"></i> 100k de ajuda inicial</li>
            <li><i class="fa-solid fa-forward" aria-hidden="true"></i> Subida para a ETY aos 15 dias (em vez de ${jornada.regraAntiga ? 20 : 30})</li>
            <li><i class="fa-solid fa-key" aria-hidden="true"></i> Confiável nas farms junto com a subida</li>
        </ul>
        <h4><i class="fa-solid fa-tractor" aria-hidden="true"></i> O que te espera na ETY</h4>
        <ul class="farms-lista jornada-farms">${farms}</ul>
        <ol class="jornada-linha">
            <li class="feita"><span>Entrou no clã</span><b>${mpDiaCurto(jornada.dataEntrada)}</b></li>
            <li class="${com ? 'feita' : ''}"><span>Jornada completa</span><b>${com ? mpDiaCurto(jornada.completaEm) : `faltam ${Math.max(0, jornada.meta.dias - jornada.progresso.dias)} dias jogados`}</b></li>
            <li><span>Subida para a ETY + confiável</span><b>${com ? mpDiaCurto(jornada.subida.comJornada) : `${mpDiaCurto(jornada.subida.comJornada)} com a Jornada · ${mpDiaCurto(jornada.subida.semJornada)} sem`}</b></li>
        </ol>
    </div>`;
}
