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
            if (status && ['pendente', 'executando'].includes(status) && !['pendente', 'executando'].includes(acao.status)) {
                if (acao.tipo === 'titulo' && acao.status === 'feito') mpEstado.tituloAplicado = acao.dados?.titulo || null;
                mpAvisoAcao(acao);
            }
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
    if (mpEstado.tela === 'perfil' && mpEstado.aba === 'titulos') {
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

// ---------- Aba Titulos (18/10/2026) ----------
// Pedido do Fundador: em vez de um botao em cada carta das conquistas, uma
// vitrine com todos os titulos que a pessoa pode usar; o que esta em uso fica
// selecionado e tocar em outro seleciona e manda a Eternity trocar no jogo.

// Os titulos que da para pedir: o topo de cada escada (pedir um nivel abaixo
// volta "superado"), os de fora das escadas que a pessoa tem de fato (nao os
// cobertos por outro) e o tempo de cla mais alto. Quem usa uma versao feminina
// pede a feminina.
function mpTitulosDisponiveis(perfil, dias) {
    const conquistados = mpConquistados(perfil);
    const feminino = (perfil.titulos || []).some(titulo => TITULOS_POR_NOME.get(titulo.nome)?.familia?.titulos?.some(t => t.fem === titulo.nome));
    const tem = new Set((perfil.titulos || []).flatMap(titulo => {
        const base = TITULOS_POR_NOME.get(titulo.nome)?.familia?.titulos?.find(t => t.nome === titulo.nome || t.fem === titulo.nome);
        return [titulo.nome, base?.nome].filter(Boolean);
    }));
    const lista = [];
    for (const categoria of TITULOS_CATEGORIAS) {
        for (const familia of categoria.familias) {
            const indices = familia.titulos.map((t, i) => (conquistados.has(t.nome) ? i : -1)).filter(i => i >= 0);
            const escolhidos = familia.escada
                ? (indices.length ? [familia.titulos[Math.max(...indices)]] : [])
                : familia.titulos.filter(t => tem.has(t.nome));
            for (const titulo of escolhidos) {
                const nome = feminino && titulo.fem ? titulo.fem : titulo.nome;
                lista.push({ nome, base: titulo.nome, fem: titulo.fem || null, requisito: titulo.requisito, icone: titulo.icone || familia.icone, categoria: categoria.nome, info: TITULOS_POR_NOME.get(titulo.nome) });
            }
        }
    }
    const tempo = TITULOS_TEMPO.map(([nome, rotulo], i) => ({ nome, rotulo, i })).filter(t => dias !== null && dias >= MP_NIVEIS_DIAS[t.i]).at(-1);
    if (tempo) lista.push({ nome: tempo.nome, base: tempo.nome, fem: null, requisito: `${tempo.rotulo} de clã`, icone: '✧', categoria: 'Tempo de clã', info: TITULOS_POR_NOME.get(tempo.nome) || null });
    return lista;
}

function mpTituloEmUso(perfil) {
    // Troca que acabou de dar certo vale antes da proxima atualizacao do perfil.
    if (mpEstado.tituloAplicado) return mpEstado.tituloAplicado;
    return (perfil.titulos || []).find(titulo => titulo.atual)?.nome || 'Membro';
}

function mpAbaTitulos(perfil, dias) {
    if (!mpPodeAgir()) {
        return mpPainel('fa-crown', 'Seus títulos', '<p class="info-vazio">Os títulos são exclusivos da ETY. Quando você subir para a ETY, eles aparecem aqui para escolher.</p>');
    }
    const staff = !mpPodeTrocarTitulo();
    const emUso = mpTituloEmUso(perfil);
    const aberta = mpAcaoAberta();
    const pedindo = aberta?.tipo === 'titulo' ? aberta.dados?.titulo : null;
    const lista = mpTitulosDisponiveis(perfil, dias);
    const cartao = item => {
        const selecionado = emUso === item.nome || emUso === item.fem || (item.nome === 'Membro' && emUso === 'Membro');
        const carregando = pedindo === item.nome;
        const cor = item.info?.familia ? `--de:${item.info.familia.de};--ate:${item.info.familia.ate}` : '';
        const nome = item.info ? tituloHtml(item.nome, item.info) : `<b>${escHtml(item.nome)}</b>`;
        const bloqueado = staff || Boolean(aberta) || selecionado;
        return `<button type="button" class="tit-carta ${selecionado ? 'selecionada' : ''} ${carregando ? 'carregando' : ''}" style="${cor}"
                ${bloqueado ? 'disabled' : ''} aria-pressed="${selecionado}" data-titulo="${escHtml(item.nome)}" onclick="mpPedirTitulo(this.dataset.titulo, this)">
            <span class="tit-icone" aria-hidden="true">${escHtml(item.icone || '✦')}</span>
            <span class="tit-nome">${nome}</span>
            <small>${escHtml(item.requisito || '')}</small>
            <span class="tit-estado">${selecionado ? '<i class="fa-solid fa-check" aria-hidden="true"></i> Em uso' : carregando ? '<i class="fa-solid fa-gear fa-spin" aria-hidden="true"></i> Aplicando' : staff ? '' : 'Usar'}</span>
        </button>`;
    };
    const membro = { nome: 'Membro', base: 'Membro', fem: null, requisito: 'Sem título, só o cargo de membro', icone: '○', info: null };
    const intro = staff
        ? `Seu cargo (${escHtml(mpEstado.dados.membro?.cargo || 'staff')}) é de staff: os títulos não substituem o cargo no jogo. Aqui ficam os que você já conquistou.`
        : 'Escolha o título que aparece no seu nick. A Eternity confere e troca no jogo em instantes.';
    const corpo = `<p class="tit-intro">${intro}</p>
        ${lista.length ? `<div class="tit-grade">${lista.map(cartao).join('')}${staff ? '' : cartao(membro)}</div>` : '<p class="info-vazio">Você ainda não conquistou nenhum título. Veja na aba Conquistas o que falta para cada um.</p>'}`;
    return mpPainel('fa-crown', 'Seus títulos', corpo, { classe: 'tit-painel', extra: `${lista.length} disponíveis` });
}
