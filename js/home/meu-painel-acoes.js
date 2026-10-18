// Acoes do painel do membro (18/10/2026): usar um titulo conquistado e pedir
// trust nas farms da ETY. O painel so registra o pedido (POST
// /api/painel-membro/acoes, com a sessao do Discord); a Eternity, no jogo,
// busca a cada ~30 s, confere com as mesmas regras do pedido por tell e
// responde. Enquanto houver pedido aberto o painel pergunta a cada 5 s e mostra
// o resultado num aviso.

const MP_FARMS = [
    { farm: 'ETYBatata', nome: 'Farm de batata', icone: 'fa-seedling', acesso: 'Abrir os baús', requisito: 'Ser confiável no clã' },
    { farm: 'ETYHerba', nome: 'Farm de herbalismo', icone: 'fa-leaf', acesso: 'Construir na farm', requisito: 'Ser confiável no clã' },
    { farm: 'ETYMegaFarm', nome: 'Mega farm', icone: 'fa-wheat-awn', acesso: 'Abrir os baús', requisito: 'Confiável + Herbalismo 100 no mcMMO' },
];
const MP_STATUS_ACAO = {
    pendente: ['fa-hourglass-half', 'Na fila da Eternity'],
    executando: ['fa-gear fa-spin', 'A Eternity está fazendo'],
    feito: ['fa-circle-check', 'Feito'],
    negado: ['fa-circle-xmark', 'Não liberado'],
    erro: ['fa-triangle-exclamation', 'Deu erro'],
    expirado: ['fa-clock', 'Expirou'],
};
let mpAcoesTimer = null;

function mpAcaoAberta() {
    return (mpEstado.acoes || []).find(acao => ['pendente', 'executando'].includes(acao.status)) || null;
}

function mpPodeAgir() {
    return mpEstado.dados?.perfil?.jogo?.cla === 'ETY';
}

// Cargo de staff ou PvP nao e trocado por titulo (title-flow.js): sem botao.
function mpPodeTrocarTitulo() {
    return mpPodeAgir() && !mpEstado.dados?.staff;
}

async function mpCarregarAcoes() {
    try {
        const resposta = await fetch(`${URL_PAINEL_MEMBRO}/acoes`, { headers: { Authorization: `Bearer ${mpLerSessao()}` } });
        if (!resposta.ok) return;
        const antes = new Map((mpEstado.acoes || []).map(acao => [acao.id, acao.status]));
        mpEstado.acoes = await resposta.json();
        // Pedido que terminou desde a ultima olhada: aviso com a resposta.
        for (const acao of mpEstado.acoes) {
            const status = antes.get(acao.id);
            if (status && ['pendente', 'executando'].includes(status) && !['pendente', 'executando'].includes(acao.status)) mpAvisoAcao(acao);
        }
        mpAtualizarAcoesNaTela();
    } catch { /* tenta na proxima */ }
    clearTimeout(mpAcoesTimer);
    if (mpAcaoAberta() && location.hash.startsWith('#meu-painel')) mpAcoesTimer = setTimeout(mpCarregarAcoes, 5000);
}

async function mpPedirAcao(tipo, dados, botao) {
    if (mpAcaoAberta()) return mpAviso('Espere a Eternity terminar o pedido em andamento.', 'aviso');
    if (botao) { botao.disabled = true; botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Enviando'; }
    try {
        const resposta = await fetch(`${URL_PAINEL_MEMBRO}/acoes`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${mpLerSessao()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo, dados }),
        });
        const corpo = await resposta.json().catch(() => ({}));
        if (resposta.status === 401) { mpGuardarSessao(null); return mpTelaLogin(null); }
        if (!resposta.ok) {
            mpAviso(corpo.message || 'Não foi possível enviar agora.', 'erro');
        } else {
            mpEstado.acoes = [corpo, ...(mpEstado.acoes || [])];
            mpAviso(tipo === 'titulo'
                ? `Pedido enviado: a Eternity vai conferir e aplicar <b>${escHtml(dados.titulo)}</b> em instantes.`
                : 'Pedido enviado: a Eternity vai até a farm liberar seu trust. Leva um ou dois minutos.', 'ok');
            clearTimeout(mpAcoesTimer);
            mpAcoesTimer = setTimeout(mpCarregarAcoes, 5000);
        }
    } catch {
        mpAviso('O site não respondeu. Tente de novo em instantes.', 'erro');
    }
    mpAtualizarAcoesNaTela();
}

function mpPedirTitulo(titulo, botao) {
    return mpPedirAcao('titulo', { titulo }, botao);
}

function mpPedirTrust(farm, botao) {
    return mpPedirAcao('trust', { farm }, botao);
}

// ---------- Avisos ----------

function mpAviso(html, tipo = 'ok', ms = 6000) {
    let pilha = document.getElementById('mp-avisos');
    if (!pilha) {
        pilha = document.createElement('div');
        pilha.id = 'mp-avisos';
        pilha.className = 'mp-avisos';
        pilha.setAttribute('role', 'status');
        pilha.setAttribute('aria-live', 'polite');
        document.body.appendChild(pilha);
    }
    const aviso = document.createElement('div');
    aviso.className = `mp-aviso ${tipo}`;
    aviso.innerHTML = `<span>${html}</span><button type="button" aria-label="Fechar" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>`;
    pilha.appendChild(aviso);
    setTimeout(() => aviso.remove(), ms);
}

function mpAvisoAcao(acao) {
    const linhas = String(acao.resposta || '').split('\n').filter(Boolean);
    const final = linhas.at(-1) || MP_STATUS_ACAO[acao.status]?.[1] || '';
    const tipo = acao.status === 'feito' ? 'ok' : acao.status === 'negado' ? 'aviso' : 'erro';
    const titulo = acao.tipo === 'titulo' ? `Título ${escHtml(acao.dados?.titulo || '')}` : `Trust na ${escHtml(MP_FARMS.find(f => f.farm === acao.dados?.farm)?.nome || acao.dados?.farm || 'farm')}`;
    mpAviso(`<b>${titulo}:</b> ${escHtml(final)}`, tipo, 12000);
}

// ---------- Na tela ----------

// Redesenha so os pedacos que dependem dos pedidos (botoes e lista).
function mpAtualizarAcoesNaTela() {
    const lista = document.getElementById('mp-pedidos');
    if (lista) lista.outerHTML = mpCartaoPedidos();
    const farms = document.getElementById('mp-farms');
    if (farms) farms.outerHTML = mpCartaoFarms();
    if (mpEstado.tela === 'perfil' && mpEstado.aba === 'conquistas') {
        const alvo = document.getElementById('mp-aba');
        if (alvo) alvo.innerHTML = mpConteudoAba();
    }
}

function mpCartaoFarms() {
    if (!mpPodeAgir()) return '';
    const aberta = mpAcaoAberta();
    return `<section class="ficha-painel inicio-farms" id="mp-farms">
        <h3 class="ficha-titulo"><i class="fa-solid fa-tractor" aria-hidden="true"></i> Farms da ETY</h3>
        <ul class="farms-lista">
            ${MP_FARMS.map(item => {
                const esta = aberta?.tipo === 'trust' && aberta.dados?.farm === item.farm;
                return `<li>
                    <i class="fa-solid ${item.icone}" aria-hidden="true"></i>
                    <span><b>${item.nome}</b><small>${item.acesso} · ${item.requisito}</small></span>
                    <button type="button" class="mp-acao" ${aberta ? 'disabled' : ''} onclick="mpPedirTrust('${item.farm}', this)">${esta ? '<i class="fa-solid fa-gear fa-spin" aria-hidden="true"></i> Liberando' : 'Pedir trust'}</button>
                </li>`;
            }).join('')}
        </ul>
        <p class="mp-nota">A Eternity confere se você pode, vai até a farm e libera. Use <code>/go</code> com o nome da farm para chegar lá.</p>
    </section>`;
}

function mpCartaoPedidos() {
    const acoes = (mpEstado.acoes || []).slice(0, 4);
    if (!acoes.length) return '<div id="mp-pedidos" hidden></div>';
    return `<section class="ficha-painel inicio-pedidos" id="mp-pedidos">
        <h3 class="ficha-titulo"><i class="fa-solid fa-list-check" aria-hidden="true"></i> Seus pedidos</h3>
        <ul class="pedidos-lista">
            ${acoes.map(acao => {
                const [icone, rotulo] = MP_STATUS_ACAO[acao.status] || MP_STATUS_ACAO.erro;
                const nome = acao.tipo === 'titulo' ? `Título ${acao.dados?.titulo || ''}` : `Trust: ${MP_FARMS.find(f => f.farm === acao.dados?.farm)?.nome || acao.dados?.farm || ''}`;
                const final = String(acao.resposta || '').split('\n').filter(Boolean).at(-1);
                return `<li class="pedido-${acao.status}">
                    <i class="fa-solid ${icone}" aria-hidden="true"></i>
                    <span><b>${escHtml(nome)}</b><small>${escHtml(final || rotulo)}</small></span>
                    <time>${escHtml(mpData(acao.criadoEm))}</time>
                </li>`;
            }).join('')}
        </ul>
    </section>`;
}

// Titulo que da para pedir: o topo de cada escada e os de fora das escadas que
// a pessoa ja tem. Quem usa uma versao feminina pede a feminina.
function mpTitulosPedidos(perfil) {
    const emUso = (perfil.titulos || []).find(titulo => titulo.atual)?.nome || null;
    const feminino = (perfil.titulos || []).some(titulo => TITULOS_POR_NOME.get(titulo.nome)?.familia?.titulos?.some(t => t.fem === titulo.nome));
    return { emUso, feminino };
}

function mpBotaoUsar(titulo) {
    if (!mpPodeTrocarTitulo()) return '';
    const { emUso, feminino } = mpTitulosPedidos(mpEstado.dados.perfil);
    const nome = feminino && titulo.fem ? titulo.fem : titulo.nome;
    if (emUso && (emUso === titulo.nome || emUso === titulo.fem)) return '<span class="ficha-usando"><i class="fa-solid fa-check" aria-hidden="true"></i> Em uso</span>';
    const aberta = mpAcaoAberta();
    const esta = aberta?.tipo === 'titulo' && aberta.dados?.titulo === nome;
    return `<button type="button" class="mp-acao ficha-usar" ${aberta ? 'disabled' : ''} data-titulo="${escHtml(nome)}" onclick="mpPedirTitulo(this.dataset.titulo, this)">${esta ? '<i class="fa-solid fa-gear fa-spin" aria-hidden="true"></i> Aplicando' : 'Usar'}</button>`;
}

function mpBotaoVoltarMembro() {
    if (!mpPodeTrocarTitulo()) return '';
    const { emUso } = mpTitulosPedidos(mpEstado.dados.perfil);
    if (!emUso) return '';
    return `<button type="button" class="mp-acao mp-acao-fraca" ${mpAcaoAberta() ? 'disabled' : ''} onclick="mpPedirTitulo('Membro', this)">Voltar a Membro</button>`;
}
