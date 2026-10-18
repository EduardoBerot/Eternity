// Painel do membro (16/10/2026): o membro entra com o Discord e ve o proprio
// painel -- Liga, banco, premios e o progresso dos titulos. So leitura.
//
// O login e o do Discord (eternity-crud, membro-painel.service.js): o botao leva
// a /api/painel-membro/entrar, o Discord volta para a API e a API devolve para
// #meu-painel&sessao=<token>. O token fica no localStorage deste navegador (30
// dias) e vai no Authorization de cada leitura. Depositos e premios so aparecem
// aqui: a listagem publica dos perfis nao os traz.

const MP_CHAVE_SESSAO = 'ety-painel-sessao';
const URL_PAINEL_MEMBRO = `${URL_BASE}/api/painel-membro`;
const URL_COPA = `${URL_BASE}/api/copa`;

const MP_ERROS = {
    cancelado: 'Você cancelou o login no Discord.',
    expirado: 'O login demorou demais. Tente de novo.',
    discord: 'O Discord não respondeu agora. Tente de novo em instantes.',
    desligado: 'O login com Discord ainda não está ligado.',
};

// cla: ranking de nivel e Liga pessoal (meu-painel-cla.js), pedido depois da ficha.
const mpEstado = { dados: null, meta: null, copa: null, cla: null, tela: 'inicio', aba: 'geral', mes: 0 };

function mpLerSessao() {
    try { return localStorage.getItem(MP_CHAVE_SESSAO); } catch { return null; }
}

function mpGuardarSessao(token) {
    try {
        if (token) localStorage.setItem(MP_CHAVE_SESSAO, token);
        else localStorage.removeItem(MP_CHAVE_SESSAO);
    } catch { /* aba privada: a sessao vale so ate fechar */ }
}

// A volta do login traz a sessao ou o erro no hash; os dois saem da barra na hora.
// `admin=1` (vindo do painel da staff com o acesso vencido) pede para abrir a
// administracao assim que o painel carregar; o pedido sobrevive a ida ao
// Discord guardado na aba do navegador.
const MP_CHAVE_ADMIN = 'ety-painel-abrir-admin';

function mpLerRetorno() {
    const params = new URLSearchParams(location.hash.replace(/^#meu-painel&?/, ''));
    if (MP_TELAS.some(([id]) => id === params.get('tela'))) mpEstado.tela = params.get('tela');
    // Perfil de outro membro aberto no painel: volta a ele ao recarregar.
    if (params.get('tela') === 'jogador' && params.get('nick')) { mpEstado.tela = 'jogador'; mpEstado.jogadorNick = params.get('nick'); }
    const sessao = params.get('sessao');
    const erro = params.get('erro');
    if (params.get('admin') === '1') {
        try { sessionStorage.setItem(MP_CHAVE_ADMIN, '1'); } catch { /* sem a aba guardada, so nao abre sozinho */ }
    }
    if (sessao || erro || params.has('admin')) history.replaceState(null, '', `${location.pathname}${location.search}#meu-painel`);
    if (sessao) mpGuardarSessao(sessao);
    return { erro };
}

function mpPedidoAdmin() {
    try {
        const pedido = sessionStorage.getItem(MP_CHAVE_ADMIN) === '1';
        sessionStorage.removeItem(MP_CHAVE_ADMIN);
        return pedido;
    } catch { return false; }
}

function mpDinheiro(valor) {
    const numero = Number(valor) || 0;
    return `$ ${new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 2 }).format(numero)}`;
}

function mpDinheiroCheio(valor) {
    return `$ ${(Number(valor) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
}

function mpData(valor) {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? '' : data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function mpCartao(icone, titulo, corpo, { tipo = '' } = {}) {
    return `<h1>Meu painel</h1>
        <div class="mp-cartao ${tipo}">
            <div class="mp-cartao-selo"><i class="${icone}" aria-hidden="true"></i></div>
            <h2>${titulo}</h2>
            ${corpo}
        </div>`;
}

// O botao nasce apontando para a reserva da API (que redireciona) e, assim que
// o link do Discord chega, aponta direto para ele (16/10/2026): o clique deixa
// de esperar a API, e um Render acordando acorda enquanto a pessoa le a tela.
// O link vence em 10 min (o state assinado); passados 9, volta a reserva.
const MP_LINK_VALIDO_MS = 9 * 60 * 1000;
let mpLinkDiscord = null;

function mpBotaoEntrar(texto = 'Entrar com Discord') {
    return `<a class="button mp-entrar" id="mp-entrar" href="${URL_PAINEL_MEMBRO}/entrar" onclick="mpClicouEntrar(this)"><i class="fa-brands fa-discord" aria-hidden="true"></i> <span>${texto}</span></a>`;
}

async function mpPrepararLink() {
    try {
        const resposta = await fetch(`${URL_PAINEL_MEMBRO}/link`);
        const corpo = resposta.ok ? await resposta.json() : null;
        if (!corpo?.url) return;
        mpLinkDiscord = { url: corpo.url, em: Date.now() };
        const botao = document.getElementById('mp-entrar');
        if (botao) botao.href = corpo.url;
    } catch { /* fica a reserva da API */ }
}

// Retorno imediato no clique: no celular o Discord (ou o app dele) demora a abrir.
function mpClicouEntrar(botao) {
    if (!mpLinkDiscord || Date.now() - mpLinkDiscord.em > MP_LINK_VALIDO_MS) botao.href = `${URL_PAINEL_MEMBRO}/entrar`;
    botao.classList.add('carregando');
    botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> <span>Abrindo o Discord...</span>';
}

function mpTelaLogin(erro) {
    app.innerHTML = mpCartao('fa-solid fa-user-astronaut', 'Seu painel na Eternity', `
        ${erro ? `<p class="mp-erro">${escHtml(MP_ERROS[erro] || MP_ERROS.discord)}</p>` : ''}
        <p>Entre com a conta do Discord vinculada ao seu nick para ver a sua Liga, os seus depósitos no banco, os prêmios que recebeu e quanto falta para cada título.</p>
        ${mpBotaoEntrar()}
        <p class="mp-sub">Só pedimos o seu nome no Discord. Nada é publicado em seu nome.</p>`);
    mpPrepararLink();
}

// Quem volta do Discord pelo botao Voltar do celular encontra o botao ainda
// em "Abrindo o Discord...": a pagina restaurada do cache volta ao normal.
window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    const botao = document.getElementById('mp-entrar');
    if (botao?.classList.contains('carregando')) mpTelaLogin(null);
});

function mpTelaSemVinculo() {
    app.innerHTML = mpCartao('fa-brands fa-discord', 'Discord sem nick vinculado', `
        <p>Este Discord ainda não está vinculado a um nick do clã.</p>
        <p>No <a href="https://discord.gg/vj4eNDJqct" target="_blank" rel="noopener">Discord da Eternity</a>, use o botão <b>Vincular minha conta</b> no canal <b>#saudações</b> (ou o comando <code>/vincular</code>). O painel aparece na próxima atualização do site, em até 30 minutos.</p>
        <p class="mp-sub">Entrou com a conta errada? <a href="#meu-painel" onclick="mpSair(event)">Sair</a> e entre com a outra.</p>`, { tipo: 'aviso' });
}

function mpSair(event) {
    event?.preventDefault();
    mpGuardarSessao(null);
    document.body.classList.remove('modo-jogo');
    // Sai da staff junto: o acesso da administracao nao fica aberto neste navegador.
    deleteCookie(ETY_ADM_LOGIN_COOKIE);
    deleteCookie(ETY_ADM_PASS_COOKIE);
    mpEstado.dados = null;
    mpTelaLogin(null);
}

async function renderMeuPainel() {
    const { erro } = mpLerRetorno();
    const token = mpLerSessao();
    if (!token) return mpTelaLogin(erro);

    app.innerHTML = mpCartao('fa-solid fa-spinner fa-spin', 'Abrindo seu painel...', '<p class="mp-sub">Se o site estava dormindo, pode levar até um minuto.</p>');
    const extra = url => fetch(url).then(resposta => (resposta.ok ? resposta.json() : null)).catch(() => null);
    const [resposta, meta, copa] = await Promise.all([
        fetch(URL_PAINEL_MEMBRO, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        extra(URL_META_BANCO),
        extra(URL_COPA),
    ]);
    if (!location.hash.startsWith('#meu-painel')) return; // a pessoa saiu da pagina no meio
    if (!resposta) {
        app.innerHTML = mpCartao('fa-solid fa-plug-circle-xmark', 'Não foi possível abrir', '<p>O site não respondeu. Tente de novo em instantes.</p><button class="button mp-entrar" onclick="renderMeuPainel()">Tentar de novo</button>', { tipo: 'aviso' });
        return;
    }
    const corpo = await resposta.json().catch(() => ({}));
    if (resposta.status === 401) {
        mpGuardarSessao(null);
        return mpTelaLogin(null);
    }
    if (resposta.status === 404 && corpo.codigo === 'sem-vinculo') return mpTelaSemVinculo();
    if (!resposta.ok) {
        app.innerHTML = mpCartao('fa-solid fa-triangle-exclamation', 'Não foi possível abrir', `<p>${escHtml(corpo.message || 'Tente de novo em instantes.')}</p><button class="button mp-entrar" onclick="renderMeuPainel()">Tentar de novo</button>`, { tipo: 'aviso' });
        return;
    }
    mpEstado.dados = corpo;
    mpEstado.meta = meta?.publico ? meta : null;
    mpEstado.copa = copa && copa.status ? copa : null;
    mpEstado.mes = 0;
    mpEstado.cla = null;
    if (mpPedidoAdmin() && corpo.staff) return mpAbrirAdmin();
    mpDesenhar();
    mpCarregarCla();
    mpCarregarAcoes();
    if (mpEstado.tela === 'jogador') mpAbrirJogador(mpEstado.jogadorNick);
}

// ---------- Ficha de personagem (16/10/2026) ----------
// Redesenho pedido pelo Fundador: o painel generico (coluna lateral, quatro
// numeros, lista e abas competindo) virou uma ficha de RPG. Topo com a skin 3D,
// o nivel pelo tempo de cla e os numeros; atributos como barras de XP ate o
// proximo titulo de cada escada; missoes do dia; a grade com TODAS as
// conquistas (titulos) do cla, acesas ou bloqueadas. Liga, tesouro e conta
// ficam nas abas de baixo.

// Escada de tempo de cla, na ordem de TITULOS_TEMPO (titulos.js).
const MP_NIVEIS_DIAS = [120, 180, 365, 730, 1095, 1825];

// Titulo que cobre outros fora das escadas (titles.js do bot: SUPERA).
const MP_SUPERA = { Onipotente: ['Vanguarda', 'Atirador', 'Farmer', 'Mercenário', 'Pacifista'], Mercenário: ['Vanguarda', 'Atirador'], Pacifista: ['Farmer'] };

const MP_ATRIBUTOS = [
    ['podios', 'Pódios', 'fa-medal'],
    ['desafios', 'Desafios', 'fa-bolt'],
    ['ofensiva', 'Ofensiva', 'fa-fire'],
    ['banco', 'Apoio ao banco', 'fa-coins'],
    ['poder', 'Poder mcMMO', 'fa-hand-fist'],
];

let mpViewer = null;

function mpDiasDeCla(membro) {
    const inicio = new Date(membro?.data_entrada);
    return Number.isNaN(inicio.getTime()) ? null : Math.max(0, Math.floor((Date.now() - inicio) / 86_400_000));
}

// Nivel da conta (16/10/2026, Fundador: "faz um que some tudo"). O primeiro
// nivel olhava so o tempo de cla; agora soma o XP de tudo o que a pessoa fez,
// com os dados que o painel ja recebe. A tabela fica a mostra na ficha ("De onde
// vem seu XP"). Os pesos valem tambem no bot (minecraft/member-level.js no harley),
// que publica o nivel oficial: mudou aqui, mude la.
const MP_XP = {
    dia: 0.5,            // por dia de cla
    pontosLiga: 0.1,     // por ponto da Liga (1 a cada 10), todos os meses guardados
    podio: { ouro: 30, prata: 20, bronze: 10 },
    desafios: 15,        // por dia com todos os desafios completos
    evento: 50,          // por evento vencido
    banco: 10 / 100_000, // 10 a cada 100k depositados
    conquista: 100,      // por titulo desbloqueado
    ofensiva: 5,         // por dia da ofensiva ativa
};
// O nivel N pede 50 x N^2 de XP no total, sem teto.
const MP_XP_BASE = 50;

function mpContarConquistas(perfil, dias) {
    const conquistados = mpConquistados(perfil);
    let acesas = 0;
    for (const familia of TITULOS_CATEGORIAS.flatMap(categoria => categoria.familias)) {
        const indices = familia.titulos.map((t, i) => (conquistados.has(t.nome) ? i : -1)).filter(i => i >= 0);
        acesas += familia.escada ? (indices.length ? Math.max(...indices) + 1 : 0) : indices.length;
    }
    if (dias !== null) acesas += MP_NIVEIS_DIAS.filter(limite => dias >= limite).length;
    return acesas;
}

function mpXp(perfil, dias) {
    const meses = Array.isArray(perfil.ligaMeses) && perfil.ligaMeses.length ? perfil.ligaMeses : (perfil.liga ? [perfil.liga] : []);
    const soma = campo => meses.reduce((total, mes) => total + (Number(mes?.[campo]) || 0), 0);
    const podios = meses.reduce((total, mes) => ({
        ouro: total.ouro + (Number(mes?.podios?.ouro) || 0),
        prata: total.prata + (Number(mes?.podios?.prata) || 0),
        bronze: total.bronze + (Number(mes?.podios?.bronze) || 0),
    }), { ouro: 0, prata: 0, bronze: 0 });
    const conquistas = mpContarConquistas(perfil, dias);
    const eventos = Number(perfil.eventos?.total) || 0;
    const banco = Number(perfil.banco?.total) || 0;
    const ofensiva = Number(perfil.liga?.dominio) || 0;
    const pontos = soma('pontos');
    const desafios = soma('desafios');
    const fontes = [
        { icone: 'fa-hourglass-half', rotulo: 'Tempo de clã', detalhe: `${(dias || 0).toLocaleString('pt-BR')} dias`, xp: (dias || 0) * MP_XP.dia },
        { icone: 'fa-award', rotulo: 'Conquistas', detalhe: `${conquistas} títulos`, xp: conquistas * MP_XP.conquista },
        { icone: 'fa-trophy', rotulo: 'Pontos na Liga', detalhe: `${pontos.toLocaleString('pt-BR')} pontos`, xp: pontos * MP_XP.pontosLiga },
        { icone: 'fa-medal', rotulo: 'Pódios', detalhe: `${podios.ouro}·${podios.prata}·${podios.bronze}`, xp: podios.ouro * MP_XP.podio.ouro + podios.prata * MP_XP.podio.prata + podios.bronze * MP_XP.podio.bronze },
        { icone: 'fa-bolt', rotulo: 'Desafios completos', detalhe: `${desafios} dias`, xp: desafios * MP_XP.desafios },
        { icone: 'fa-flag-checkered', rotulo: 'Eventos vencidos', detalhe: `${eventos}`, xp: eventos * MP_XP.evento },
        { icone: 'fa-coins', rotulo: 'Banco do clã', detalhe: mpDinheiro(banco), xp: banco * MP_XP.banco },
        { icone: 'fa-fire', rotulo: 'Ofensiva ativa', detalhe: `${ofensiva} dias`, xp: ofensiva * MP_XP.ofensiva },
    ].map(fonte => ({ ...fonte, xp: Math.round(fonte.xp) }));
    return { total: fontes.reduce((total, fonte) => total + fonte.xp, 0), fontes };
}

// O nivel que o bot publica no perfil (member-level.js), o mesmo do card do
// /perfil. O calculo daqui (mpXp) so vale enquanto o perfil nao trouxer o nivel.
const MP_FONTES_XP = {
    tempo: ['fa-hourglass-half', 'Tempo de clã'],
    conquistas: ['fa-award', 'Conquistas'],
    liga: ['fa-trophy', 'Pontos na Liga'],
    podios: ['fa-medal', 'Pódios'],
    desafios: ['fa-bolt', 'Desafios completos'],
    eventos: ['fa-flag-checkered', 'Eventos vencidos'],
    banco: ['fa-coins', 'Banco do clã'],
    ofensiva: ['fa-fire', 'Ofensiva ativa'],
};

function mpXpPublicado(perfil) {
    const nivel = perfil.nivel;
    if (!nivel || !Number.isFinite(Number(nivel.xp))) return null;
    const fontes = (nivel.fontes || []).filter(fonte => MP_FONTES_XP[fonte.chave]).map(fonte => ({
        icone: MP_FONTES_XP[fonte.chave][0], rotulo: MP_FONTES_XP[fonte.chave][1], detalhe: fonte.detalhe || '', xp: Number(fonte.xp) || 0,
    }));
    return { total: Number(nivel.xp), fontes };
}

function mpNivelXp(total) {
    const nivel = Math.floor(Math.sqrt(total / MP_XP_BASE));
    const base = MP_XP_BASE * nivel * nivel;
    const proximo = MP_XP_BASE * (nivel + 1) * (nivel + 1);
    return { nivel, faltam: proximo - total, pct: Math.round((total - base) / (proximo - base) * 100) };
}

// Nomes conquistados (masculino e feminino contam igual), com o que cada um supera.
function mpConquistados(perfil) {
    const nomes = new Set();
    for (const titulo of perfil.titulos || []) {
        const info = TITULOS_POR_NOME.get(titulo.nome);
        const base = info?.familia?.titulos?.find(t => t.nome === titulo.nome || t.fem === titulo.nome)?.nome || titulo.nome;
        nomes.add(base);
        for (const coberto of MP_SUPERA[base] || []) nomes.add(coberto);
    }
    return nomes;
}

// ---------- Modo jogo (18/10/2026) ----------
// Pedido do Fundador: a ficha numa pagina so parecia poluida, e o painel devia
// ser "literalmente um jogo web". Logado, a navbar do site sai (body.modo-jogo)
// e entra o HUD: Inicio (o cla: Liga do cla, missoes, meta, top niveis),
// Ranking e Meu perfil (a ficha, com as abas). No celular as telas vao para uma
// barra de abas embaixo. A tela fica no hash (#meu-painel&tela=perfil) para
// sobreviver ao recarregar; trocar de tela nao recarrega os dados.

const MP_TELAS = [
    ['inicio', 'fa-house', 'Início'],
    ['ranking', 'fa-ranking-star', 'Ranking'],
    ['perfil', 'fa-user', 'Meu perfil'],
];
const MP_ABAS_PERFIL = [
    ['geral', 'fa-chart-simple', 'Visão geral'],
    ['liga', 'fa-trophy', 'Liga'],
    ['banco', 'fa-gem', 'Tesouro'],
    ['conquistas', 'fa-award', 'Conquistas'],
    ['conta', 'fa-id-card', 'Conta'],
];

// Quem as telas de perfil mostram: a propria pessoa, ou outro membro na tela
// 'jogador' (clique no ranking, 18/10/2026), so com o que ja e publico.
function mpAlvo() {
    if (mpEstado.tela === 'jogador' && mpEstado.jogador?.perfil) return { ...mpEstado.jogador, proprio: false };
    return mpEu();
}

function mpEu() {
    return { perfil: mpEstado.dados.perfil, membro: mpEstado.dados.membro, proprio: true };
}

function mpResumo(alvo = mpAlvo()) {
    const { perfil, membro } = alvo;
    const dias = mpDiasDeCla(membro);
    const xp = mpXpPublicado(perfil) || mpXp(perfil, dias);
    return { perfil, membro, dias, xp, nivel: mpNivelXp(xp.total), nickSkin: String(perfil.nick).replace(/^\*+/, ''), proprio: alvo.proprio !== false };
}

function mpDesenhar() {
    document.body.classList.add('modo-jogo');
    const { perfil, nivel, nickSkin } = mpResumo(mpEu());
    const telas = [...MP_TELAS, ...(mpEstado.dados.staff ? [['staff', 'fa-user-shield', 'Staff']] : [])];
    const botao = ([id, icone, rotulo], classe) => `<button type="button" class="${classe} ${mpEstado.tela === id ? 'ativa' : ''}" ${mpEstado.tela === id ? 'aria-current="page"' : ''} onclick="mpIr('${id}')"><i class="fa-solid ${icone}" aria-hidden="true"></i><span>${rotulo}</span></button>`;
    app.innerHTML = `<div class="jogo">
        <header class="hud">
            <a class="hud-marca" href="#inicio" title="Voltar ao site">Eternity</a>
            <nav class="hud-nav" aria-label="Painel">${telas.map(tela => botao(tela, 'hud-item')).join('')}</nav>
            <button type="button" class="hud-jogador" onclick="mpIr('perfil')" title="Meu perfil">
                <img src="https://mc-heads.net/avatar/${encodeURIComponent(nickSkin)}/40" alt="" width="34" height="34">
                <span class="hud-jogador-texto">
                    <b>${escHtml(perfil.nick)}</b>
                    <span class="hud-xp" role="progressbar" aria-valuenow="${nivel.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="XP até o próximo nível"><span style="width:${nivel.pct}%"></span></span>
                </span>
                <span class="niv-nv">NV ${nivel.nivel}</span>
            </button>
            <button type="button" class="hud-sair" onclick="mpSair(event)" aria-label="Sair" title="Sair"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i></button>
        </header>
        <main class="jogo-tela" id="jogo-tela">${mpConteudoTela()}</main>
        <nav class="jogo-abas-baixo" aria-label="Painel">${telas.map(tela => botao(tela, 'jogo-aba')).join('')}</nav>
    </div>`;
    mpDepoisDaTela();
}

function mpConteudoTela() {
    if (mpEstado.tela === 'ranking') return `<div class="jogo-cabeca"><h1>Ranking de níveis</h1><p>O nível da conta soma tudo o que você faz no clã.</p></div><div id="mp-ranking">${mpAbaNiveis()}</div>`;
    if (mpEstado.tela === 'perfil') return mpTelaPerfil();
    if (mpEstado.tela === 'jogador') return mpTelaJogador();
    return mpTelaInicio();
}

function mpDepoisDaTela() {
    if (mpEstado.tela === 'perfil' || (mpEstado.tela === 'jogador' && mpEstado.jogador?.perfil)) mpSkin3d(app.querySelector('.ficha-skin'), mpResumo().nickSkin);
    else { mpViewer?.dispose(); mpViewer = null; }
    if (mpEstado.tela === 'inicio') mpMetaInicio();
    mpAtualizarHeroiCla();
}

// Redesenha so a tela (o HUD fica), por exemplo quando o ranking chega.
function mpRedesenharTela() {
    const alvo = document.getElementById('jogo-tela');
    if (!alvo) return;
    alvo.innerHTML = mpConteudoTela();
    mpDepoisDaTela();
}

function mpIr(tela) {
    if (tela === 'staff') return mpAbrirAdmin();
    mpEstado.tela = tela;
    history.replaceState(null, '', `${location.pathname}${location.search}#meu-painel${tela === 'inicio' ? '' : `&tela=${tela}`}`);
    mpDesenhar();
    window.scrollTo({ top: 0 });
}

// ---------- Meu perfil ----------

// No perfil de outro membro so as abas com dado publico (Tesouro e Conta sao
// privados; a Liga e a por mes do perfil publico, sem semanas nem origens).
const MP_ABAS_JOGADOR = ['geral', 'liga', 'conquistas'];

function mpTelaPerfil() {
    const { perfil, membro, nivel, xp, nickSkin, proprio } = mpResumo();
    const cargo = membro?.cargo || 'Membro';
    const jogo = perfil.jogo || {};
    const online = jogo.visto === 'Online';
    const inativo = membro?.status && membro.status !== 'Ativo';
    const tempo = tempoNoCla(membro?.data_entrada);
    const abas = proprio ? MP_ABAS_PERFIL : MP_ABAS_PERFIL.filter(([id]) => MP_ABAS_JOGADOR.includes(id));
    const aba = abas.some(([id]) => id === mpEstado.aba) ? mpEstado.aba : 'geral';
    mpEstado.aba = aba;
    return `<section class="perfil-heroi ${escHtml(classeCargo(cargo))}">
            <div class="ficha-skin" title="Arraste para girar">
                <img src="https://mc-heads.net/body/${encodeURIComponent(nickSkin)}/150" alt="Skin de ${escHtml(perfil.nick)}" width="75" height="150">
            </div>
            <div class="perfil-id">
                <h1>${escHtml(perfil.nick)}</h1>
                <div class="dialogo-selos">
                    <span class="selo cargo-${escHtml(classeCargo(cargo))}">${escHtml(cargo)}</span>
                    ${jogo.cla ? `<span class="selo selo-tag">${escHtml(jogo.cla)}</span>` : ''}
                    ${inativo ? '<span class="selo selo-inativo">Inativo</span>' : ''}
                    ${jogo.visto ? `<span class="selo ${online ? 'selo-online' : ''}"><span class="ponto"></span> ${online ? 'Online' : `Visto: ${escHtml(jogo.visto)}`}</span>` : ''}
                    ${tempo ? `<span class="selo"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${escHtml(tempo)} de clã</span>` : ''}
                </div>
                <div class="perfil-nivel">
                    <div class="perfil-nv" aria-label="Nível ${nivel.nivel}"><small>NV</small><b>${nivel.nivel}</b></div>
                    <div class="perfil-nv-barra">
                        <div class="perfil-nv-topo"><b>${xp.total.toLocaleString('pt-BR')} XP</b><small>faltam ${nivel.faltam.toLocaleString('pt-BR')} para o NV ${nivel.nivel + 1}</small></div>
                        <div class="ficha-barra ficha-barra-ouro" role="progressbar" aria-valuenow="${nivel.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Nível da conta"><span style="width:${nivel.pct}%"></span></div>
                    </div>
                </div>
                <div class="ficha-heroi-cla" id="mp-heroi-cla"></div>
                ${mpTitulosEmUso(perfil.titulos)}
            </div>
        </section>
        <div class="perfil-abas" role="tablist" aria-label="Seções do perfil">
            ${abas.map(([id, icone, rotulo]) => `<button type="button" role="tab" class="perfil-aba ${aba === id ? 'ativa' : ''}" aria-selected="${aba === id}" onclick="mpTrocarAba('${id}')"><i class="fa-solid ${icone}" aria-hidden="true"></i> ${rotulo}${id === 'conquistas' ? ` <small>${mpContarConquistas(perfil, mpDiasDeCla(membro))}/${MP_TOTAL_CONQUISTAS}</small>` : ''}</button>`).join('')}
        </div>
        <div id="mp-aba" role="tabpanel">${mpConteudoAba()}</div>`;
}

function mpTrocarAba(aba) {
    mpEstado.aba = aba;
    for (const botao of document.querySelectorAll('.perfil-aba')) {
        const ativa = botao.getAttribute('onclick').includes(`'${aba}'`);
        botao.classList.toggle('ativa', ativa);
        botao.setAttribute('aria-selected', String(ativa));
    }
    const alvo = document.getElementById('mp-aba');
    if (alvo) alvo.innerHTML = mpConteudoAba();
}

function mpConteudoAba() {
    const { perfil, membro, proprio } = mpAlvo();
    if (proprio && mpEstado.aba === 'banco') return mpAbaBanco(perfil);
    if (proprio && mpEstado.aba === 'conta') return mpAbaConta(perfil, membro);
    // A grade de conquistas e grande: fica numa aba (16/10/2026).
    if (mpEstado.aba === 'conquistas') return mpConquistasGrade(perfil, mpDiasDeCla(membro));
    if (mpEstado.aba === 'liga') return proprio ? mpAbaMinhaLiga(perfil) : mpAbaLiga(perfil);
    return mpAbaGeral();
}

// No perfil de outro membro: voce x ele, numero a numero (so dado publico).
function mpComparacao() {
    const outro = mpResumo();
    const eu = mpResumo(mpEu());
    const pontos = r => Number((r.perfil.ligaMeses?.[0] || r.perfil.liga)?.pontos) || 0;
    const linhas = [
        ['fa-star', 'Nível', r => r.nivel.nivel, v => `NV ${v}`],
        ['fa-bolt', 'XP total', r => r.xp.total, v => v.toLocaleString('pt-BR')],
        ['fa-trophy', 'Liga do mês', pontos, v => `${v.toLocaleString('pt-BR')} pts`],
        ['fa-award', 'Conquistas', r => mpContarConquistas(r.perfil, r.dias), v => String(v)],
        ['fa-flag-checkered', 'Eventos vencidos', r => Number(r.perfil.eventos?.total) || 0, v => String(v)],
        ['fa-hourglass-half', 'Dias de clã', r => r.dias || 0, v => v.toLocaleString('pt-BR')],
    ];
    const corpo = `<div class="cmp">
        <div class="cmp-cabeca"><span>Você</span><span></span><span>${escHtml(outro.perfil.nick)}</span></div>
        ${linhas.map(([icone, rotulo, valor, texto]) => {
            const a = valor(eu); const b = valor(outro);
            return `<div class="cmp-linha">
                <b class="${a > b ? 'ganha' : ''}">${escHtml(texto(a))}</b>
                <span><i class="fa-solid ${icone}" aria-hidden="true"></i> ${rotulo}</span>
                <b class="${b > a ? 'ganha' : ''}">${escHtml(texto(b))}</b>
            </div>`;
        }).join('')}
    </div>`;
    return mpPainel('fa-scale-balanced', 'Você × ' + escHtml(outro.perfil.nick), corpo, { classe: 'cmp-painel' });
}

// Visao geral: os numeros, os atributos (escadas dos titulos) e de onde vem o XP.
function mpAbaGeral() {
    const { perfil, xp, dias, proprio } = mpResumo();
    const mes = perfil.ligaMeses?.[0] || perfil.liga;
    const premios = (perfil.privado?.premios || []).reduce((soma, item) => soma + (Number(item.valor) || 0), 0);
    return `<div class="perfil-geral">
        <div class="lg-numeros">
            ${mpStat('fa-trophy', 'Liga do mês', escHtml((mes?.pontos ?? 0).toLocaleString('pt-BR')), 'pontos')}
            ${mpStat('fa-coins', 'Banco', escHtml(mpDinheiro(perfil.banco?.total)), perfil.banco?.posicao ? `${escHtml(perfil.banco.posicao)}º apoiador` : 'sem depósitos')}
            ${mpStat('fa-flag-checkered', 'Eventos', escHtml(perfil.eventos?.total ?? 0), 'vencidos')}
            ${proprio
                ? mpStat('fa-sack-dollar', 'Prêmios', escHtml(mpDinheiro(premios)), 'recebidos')
                : mpStat('fa-award', 'Conquistas', escHtml(mpContarConquistas(perfil, dias)), `de ${MP_TOTAL_CONQUISTAS}`)}
        </div>
        <div class="perfil-geral-grade">
            ${proprio ? mpAtributos(perfil) : mpComparacao()}
            ${mpPainel('fa-star', proprio ? 'De onde vem seu XP' : 'De onde vem o XP', `<ul class="perfil-xp">${xp.fontes.filter(fonte => fonte.xp > 0).sort((a, b) => b.xp - a.xp).map(fonte => `<li>
                    <i class="fa-solid ${fonte.icone}" aria-hidden="true"></i>
                    <span>${fonte.rotulo} <small>${escHtml(fonte.detalhe)}</small></span>
                    <b>${escHtml(fonte.xp.toLocaleString('pt-BR'))}</b>
                    <span class="perfil-xp-barra"><span style="width:${Math.round(fonte.xp / Math.max(1, xp.total) * 100)}%"></span></span>
                </li>`).join('')}</ul>
                <details class="perfil-xp-regras"><summary>Como o XP é calculado</summary><p>Dia de clã 0,5 · 10 pontos da Liga 1 · pódio 30/20/10 · dia de desafios 15 · evento 50 · ¢100k no banco 10 · título 100 · dia de ofensiva 5. O NV N pede 50 × N² de XP.</p></details>`, { classe: 'perfil-xp-painel', extra: `${xp.total.toLocaleString('pt-BR')} XP` })}
        </div>
    </div>`;
}

// Todas as cartas da grade: os titulos do catalogo mais a escada de tempo.
const MP_TOTAL_CONQUISTAS = TITULOS_CATEGORIAS.reduce((soma, categoria) => soma + categoria.familias.reduce((s, familia) => s + familia.titulos.length, 0), 0) + TITULOS_TEMPO.length;

// Skin 3D grande no topo da ficha (skinview3d, o mesmo da janela de Membros).
// Sem WebGL ou sem a biblioteca, fica a imagem 2D.
async function mpSkin3d(caixa, nick) {
    mpViewer?.dispose();
    mpViewer = null;
    if (!caixa || typeof webglDisponivel !== 'function' || !webglDisponivel()) return;
    let lib;
    try { lib = await carregarSkinview3d(); } catch { return; }
    if (!caixa.isConnected) return;
    const canvas = document.createElement('canvas');
    const viewer = new lib.SkinViewer({ canvas, width: 180, height: 250 });
    try { await viewer.loadSkin(`https://mc-heads.net/skin/${encodeURIComponent(nick)}`); } catch { viewer.dispose(); return; }
    if (!caixa.isConnected) { viewer.dispose(); return; }
    viewer.fov = 40;
    viewer.zoom = 0.82;
    viewer.controls.enableZoom = false;
    viewer.controls.enablePan = false;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        viewer.animation = new lib.IdleAnimation();
        viewer.autoRotate = true;
        viewer.autoRotateSpeed = 0.5;
    }
    mpViewer = viewer;
    caixa.replaceChildren(canvas);
    caixa.classList.add('em-3d');
}

function mpStat(icone, rotulo, valor, apoio) {
    return `<div class="ficha-stat">
        <i class="fa-solid ${icone}" aria-hidden="true"></i>
        <span>${rotulo}</span>
        <strong>${valor}</strong>
        <small>${apoio}</small>
    </div>`;
}

// Titulos conquistados no topo, o que esta em uso primeiro.
function mpTitulosEmUso(titulos) {
    const lista = (Array.isArray(titulos) ? titulos : [])
        .map(titulo => ({ ...titulo, info: TITULOS_POR_NOME.get(titulo.nome) }))
        .filter(titulo => titulo.info)
        .sort((a, b) => Number(Boolean(b.atual)) - Number(Boolean(a.atual)) || b.info.nivel - a.info.nivel);
    if (!lista.length) return '';
    return `<div class="mp-titulos mp-titulos-esquerda">
        ${lista.map(titulo => `<span class="titulo-chip holo" style="--de:${titulo.info.familia.de};--ate:${titulo.info.familia.ate}" title="${titulo.atual ? 'Usando agora' : 'Conquistado'}">${tituloHtml(titulo.nome, titulo.info, { atual: titulo.atual })}</span>`).join('')}
    </div>`;
}

function mpPainel(icone, titulo, corpo, { classe = '', extra = '' } = {}) {
    return `<section class="ficha-painel ${classe}">
        <h3 class="ficha-titulo"><i class="fa-solid ${icone}" aria-hidden="true"></i> ${titulo}${extra ? `<small>${extra}</small>` : ''}</h3>
        ${corpo}
    </section>`;
}

// Atributos: uma barra por escada, ate o proximo titulo; escada completa = MAX.
function mpAtributos(perfil) {
    const proximos = new Map((perfil.privado?.proximosTitulos || []).map(item => [item.grupo, item]));
    const conquistados = mpConquistados(perfil);
    const linhas = MP_ATRIBUTOS.map(([grupo, rotulo, icone]) => {
        const item = proximos.get(grupo);
        const familia = TITULOS_CATEGORIAS.flatMap(c => c.familias).find(f => f.grupo === grupo);
        const topo = familia?.titulos.at(-1)?.nome;
        if (!item && !(topo && conquistados.has(topo))) return '';
        const pct = item ? Math.min(100, Math.round(item.atual / item.meta * 100)) : 100;
        return `<li class="ficha-atributo">
            <div class="ficha-atributo-topo">
                <span><i class="fa-solid ${icone}" aria-hidden="true"></i> ${rotulo}</span>
                <span>${item ? `${escHtml(mpValorEscada(grupo, item.atual))} / ${escHtml(mpValorEscada(grupo, item.meta))}` : '<b class="ficha-max">MÁX</b>'}</span>
            </div>
            <div class="ficha-barra" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${escHtml(rotulo)}"><span style="width:${pct}%"></span></div>
            <small>${item ? `Próximo: ${mpNomeTitulo(item.nome)} · faltam ${escHtml(mpFalta(item))}` : `Escada completa: ${mpNomeTitulo(topo)}`}</small>
        </li>`;
    }).join('');
    return mpPainel('fa-chart-simple', 'Atributos', linhas
        ? `<ul class="ficha-atributos">${linhas}</ul>`
        : '<p class="info-vazio">Os atributos aparecem na próxima atualização do site, em até 1 hora.</p>', { classe: 'ficha-atributos-painel' });
}

// Missoes do dia: o que a pessoa consegue fazer agora, com o estado quando se sabe.
function mpMissoes(perfil) {
    const missoes = [];
    const dominio = Number(perfil.liga?.dominio) || 0;
    missoes.push({
        estado: 'pendente', icone: 'fa-fire',
        texto: dominio ? `Mantenha a ofensiva de <b>${escHtml(dominio)} dias</b>: complete os desafios de hoje.` : 'Complete <b>todos os desafios</b> de hoje e comece uma ofensiva.',
    });
    const meta = mpEstado.meta;
    if (meta && Number(meta.meta) > 0) {
        const pct = Math.min(100, Math.round((Number(meta.liquido) || 0) / Number(meta.meta) * 100));
        const chaves = new Set([perfil.nick, ...(perfil.alts || [])].map(n => String(n).toLowerCase()));
        const minha = (meta.apoiadores || []).filter(item => chaves.has(String(item.nick).toLowerCase())).reduce((soma, item) => soma + (Number(item.valor) || 0), 0);
        missoes.push(minha
            ? { estado: 'feito', icone: 'fa-coins', texto: `Você já apoiou a meta da semana: <b>${escHtml(mpDinheiro(minha))}</b> (meta em ${pct}%).` }
            : { estado: 'pendente', icone: 'fa-coins', texto: `Apoie a <b>meta do banco</b> da semana (em ${pct}%).` });
    }
    const copa = mpEstado.copa;
    if (copa?.status === 'inscricoes') {
        const inscrito = (copa.inscritos || []).some(n => String(n).toLowerCase() === String(perfil.nick).toLowerCase());
        missoes.push(inscrito
            ? { estado: 'feito', icone: 'fa-hand-fist', texto: 'Inscrito na <b>Copa de Duelos</b>.' }
            : { estado: 'pendente', icone: 'fa-hand-fist', texto: `Inscreva-se na <b>Copa de Duelos</b> com <code>/copa</code>${copa.inscricoesAte ? ` até ${escHtml(mpData(copa.inscricoesAte))}` : ''}.` });
    }
    const perto = (perfil.privado?.proximosTitulos || [])
        .map(item => ({ ...item, razao: item.atual / item.meta }))
        .filter(item => item.razao < 1)
        .sort((a, b) => b.razao - a.razao)[0];
    if (perto) missoes.push({ estado: 'pendente', icone: 'fa-award', texto: `Faltam <b>${escHtml(mpFalta(perto))}</b> para ${mpNomeTitulo(perto.nome)}.` });
    const feitas = missoes.filter(m => m.estado === 'feito').length;
    return mpPainel('fa-scroll', 'Missões de hoje', `<ul class="ficha-missoes">
        ${missoes.map(m => `<li class="ficha-missao ${m.estado}">
            <span class="ficha-missao-marca" aria-label="${m.estado === 'feito' ? 'Feita' : 'Pendente'}"><i class="fa-solid ${m.estado === 'feito' ? 'fa-check' : m.icone}" aria-hidden="true"></i></span>
            <span>${m.texto}</span>
        </li>`).join('')}
    </ul>`, { classe: 'ficha-missoes-painel', extra: `${feitas} de ${missoes.length}` });
}

// Conquistas: todos os titulos do cla, por categoria. Escada acende ate o nivel
// alcancado; nas outras familias cada titulo e independente.
function mpConquistasGrade(perfil, dias) {
    const conquistados = mpConquistados(perfil);
    // Botao "Usar" (meu-painel-acoes.js) so no proprio perfil: o topo de cada
    // escada e os de fora das escadas que a pessoa tem de fato (nao os cobertos).
    const proprio = mpAlvo().proprio;
    const tem = new Set((perfil.titulos || []).flatMap(titulo => {
        const base = TITULOS_POR_NOME.get(titulo.nome)?.familia?.titulos?.find(t => t.nome === titulo.nome || t.fem === titulo.nome);
        return [titulo.nome, base?.nome].filter(Boolean);
    }));
    let total = 0;
    let acesas = 0;
    const tile = (nome, icone, requisito, aceso, familia, nivelTitulo, pedir = null) => {
        total += 1;
        if (aceso) acesas += 1;
        const cor = familia ? `--de:${familia.de};--ate:${familia.ate}` : '';
        return `<div class="ficha-conquista ${aceso ? 'acesa' : 'bloqueada'}" style="${cor}" title="${escHtml(requisito)}">
            <span class="ficha-conquista-icone" aria-hidden="true">${aceso ? escHtml(icone || '✦') : '<i class="fa-solid fa-lock"></i>'}</span>
            <span class="ficha-conquista-nome">${aceso ? tituloHtml(nome, { familia, nivel: nivelTitulo }) : escHtml(nome)}</span>
            <small>${escHtml(requisito)}</small>
            ${proprio && aceso && pedir ? mpBotaoUsar(pedir) : ''}
        </div>`;
    };
    const blocos = TITULOS_CATEGORIAS.map(categoria => `
        <div class="ficha-conquistas-cat">
            <h4><i class="fa-solid ${categoria.icone}" aria-hidden="true"></i> ${escHtml(categoria.nome)}</h4>
            <div class="ficha-conquistas-grade">
                ${categoria.familias.map(familia => {
                    const indices = familia.titulos.map((t, i) => (conquistados.has(t.nome) ? i : -1)).filter(i => i >= 0);
                    const topo = indices.length ? Math.max(...indices) : -1;
                    return familia.titulos.map((titulo, i) => tile(
                        titulo.nome, titulo.icone || familia.icone, titulo.requisito,
                        familia.escada ? i <= topo : conquistados.has(titulo.nome),
                        familia, familia.escada ? i + 1 : (titulo.nivel || 1),
                        (familia.escada ? i === topo : tem.has(titulo.nome)) ? titulo : null,
                    )).join('');
                }).join('')}
            </div>
        </div>`).join('');
    const tempo = { de: '#e8f4f8', ate: '#2ee6f0' };
    const blocoTempo = `
        <div class="ficha-conquistas-cat">
            <h4><i class="fa-solid fa-hourglass-half" aria-hidden="true"></i> Tempo de clã</h4>
            <div class="ficha-conquistas-grade">
                ${TITULOS_TEMPO.map(([nome, rotulo], i) => tile(nome, '✧', `${rotulo} de clã`, dias !== null && dias >= MP_NIVEIS_DIAS[i], tempo, 1,
                    dias !== null && dias >= MP_NIVEIS_DIAS[i] && !(dias >= MP_NIVEIS_DIAS[i + 1]) ? { nome } : null)).join('')}
            </div>
        </div>`;
    // No celular so as acesas aparecem; o botao abre as bloqueadas (a grade inteira tem 36).
    let topoAcoes = '';
    if (proprio && mpPodeTrocarTitulo()) topoAcoes = `<div class="ficha-conquistas-acoes"><span>Toque em <b>Usar</b> para a Eternity trocar seu título no jogo.</span>${mpBotaoVoltarMembro()}</div>`;
    else if (proprio && mpPodeAgir()) topoAcoes = `<div class="ficha-conquistas-acoes"><span>Seu cargo (${escHtml(mpEstado.dados.membro?.cargo || 'staff')}) é de staff: os títulos não substituem o cargo no jogo.</span></div>`;
    const corpo = `${topoAcoes}<div class="ficha-conquistas">${blocos}${blocoTempo}</div>
        <button type="button" class="ficha-ver-todas" onclick="this.previousElementSibling.classList.toggle('todas'); this.textContent = this.previousElementSibling.classList.contains('todas') ? 'Mostrar só as conquistadas' : 'Ver todas as conquistas'">Ver todas as conquistas</button>`;
    return mpPainel('fa-award', 'Conquistas', corpo, { classe: 'ficha-conquistas-painel', extra: `${acesas} de ${total}` });
}

// ---------- Abas ----------

function mpAbaLiga(perfil) {
    const meses = Array.isArray(perfil.ligaMeses) ? perfil.ligaMeses : [];
    if (!meses.length) return '<section class="info-bloco"><p class="info-vazio">Sem dados da Liga ainda.</p></section>';
    // Grafico do mais antigo (esquerda) ao mais recente; ate 12 meses.
    const ultimos = meses.slice(0, 12);
    const maior = Math.max(1, ...ultimos.map(mes => Number(mes.pontos) || 0));
    const barras = ultimos.map((mes, indice) => ({ mes, indice })).reverse().map(({ mes, indice }) => {
        const altura = Math.max(3, Math.round((Number(mes.pontos) || 0) / maior * 100));
        const rotulo = (mes.rotulo || `${mes.mes}/${mes.ano}`).replace(/ de (\d{4})$/, ' $1');
        return `<button type="button" class="mp-barra ${indice === mpEstado.mes ? 'ativa' : ''}" onclick="mpTrocarMes(${indice})" title="${escHtml(rotulo)}: ${escHtml(mes.pontos)} pontos" aria-label="${escHtml(rotulo)}: ${escHtml(mes.pontos)} pontos">
            <span class="mp-barra-valor">${escHtml(mes.pontos)}</span>
            <span class="mp-barra-coluna" style="height:${altura}%"></span>
            <span class="mp-barra-mes">${escHtml(rotulo.slice(0, 3))}</span>
        </button>`;
    }).join('');
    const eventos = perfil.eventos?.lista || [];
    return `<div class="mp-grade">
        <section class="info-bloco">
            <h3><i class="fa-solid fa-chart-column"></i> Pontos por mês</h3>
            <div class="mp-grafico">${barras}</div>
        </section>
        <section class="info-bloco">
            <h3><i class="fa-solid fa-trophy"></i> ${escHtml(meses[mpEstado.mes]?.rotulo || 'Mês')}</h3>
            <div id="mp-liga-mes">${conteudoLigaMes(perfil, mpEstado.mes)}</div>
        </section>
        ${mpAreasLiga(meses[mpEstado.mes])}
        <section class="info-bloco info-bloco-largo">
            <h3><i class="fa-solid fa-medal"></i> Eventos vencidos <small>desde agosto de 2026</small></h3>
            ${eventos.length
                ? `<ul class="eventos-lista">${eventos.map(item => `
                    <li class="${item.semanal ? 'evento-semanal' : ''}" title="${item.ultimo ? `Última vitória em ${escHtml(dataBr(item.ultimo))}` : ''}">
                        <span>${escHtml(item.nome)}</span><strong>×${escHtml(item.vezes)}</strong>
                    </li>`).join('')}</ul>`
                : '<p class="info-vazio">Nenhum evento vencido ainda.</p>'}
        </section>
    </div>`;
}

// Pontos do mes escolhido por area da Liga (16/10/2026): de onde veio cada
// ponto. "Outros" so aparece quando tem ponto (o que nao e torneio, desafio
// nem evento).
const MP_AREAS_LIGA = [
    ['torneios', 'Torneios', 'fa-trophy'],
    ['desafios', 'Desafios', 'fa-bolt'],
    ['eventos', 'Eventos', 'fa-flag-checkered'],
    ['outros', 'Outros', 'fa-ellipsis'],
];

function mpAreasLiga(mes) {
    const areas = mes?.areas;
    if (!areas) {
        return `<section class="info-bloco info-bloco-largo"><h3><i class="fa-solid fa-layer-group"></i> Pontos por área</h3>
            <p class="info-vazio">Aparece na próxima atualização do site, em até 1 hora.</p></section>`;
    }
    const total = MP_AREAS_LIGA.reduce((soma, [chave]) => soma + (Number(areas[chave]) || 0), 0);
    const linhas = MP_AREAS_LIGA
        .filter(([chave]) => chave !== 'outros' || Number(areas.outros) > 0)
        .map(([chave, rotulo, icone]) => {
            const pontos = Number(areas[chave]) || 0;
            const pct = total ? Math.round(pontos / total * 100) : 0;
            return `<li class="mp-area">
                <div class="mp-area-topo">
                    <span><i class="fa-solid ${icone}" aria-hidden="true"></i> ${rotulo}</span>
                    <span><b>${escHtml(pontos.toLocaleString('pt-BR'))}</b> pts · ${pct}%</span>
                </div>
                <div class="ficha-barra" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${rotulo}"><span style="width:${pct}%"></span></div>
            </li>`;
        }).join('');
    return `<section class="info-bloco info-bloco-largo">
        <h3><i class="fa-solid fa-layer-group"></i> Pontos por área <small>${escHtml(mes.rotulo || '')} · ${escHtml(total.toLocaleString('pt-BR'))} pts</small></h3>
        ${total ? `<ul class="mp-areas">${linhas}</ul>` : '<p class="info-vazio">Sem pontos neste mês.</p>'}
    </section>`;
}

function mpTrocarMes(indice) {
    mpEstado.mes = Number(indice) || 0;
    const alvo = document.getElementById('mp-aba');
    if (alvo) alvo.innerHTML = mpAbaLiga(mpAlvo().perfil);
}

function mpTabela(colunas, linhas, vazio) {
    if (!linhas.length) return `<p class="info-vazio">${vazio}</p>`;
    return `<div class="mp-tabela-caixa"><table class="mp-tabela">
        <thead><tr>${colunas.map(coluna => `<th>${coluna}</th>`).join('')}</tr></thead>
        <tbody>${linhas.map(celulas => `<tr>${celulas.map(celula => `<td>${celula}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
}

const MP_TIPO_PREMIO = { torneio: 'Torneio semanal', quiz: 'Quiz', outro: 'Prêmio' };

function mpAbaBanco(perfil) {
    const privado = perfil.privado || {};
    const depositos = privado.depositos || [];
    const premios = privado.premios || [];
    const totalPremios = premios.reduce((soma, item) => soma + (Number(item.valor) || 0), 0);
    const banco = perfil.banco;
    return `<div class="mp-grade">
        <section class="info-bloco">
            <h3><i class="fa-solid fa-building-columns"></i> Seus depósitos <small>últimos ${depositos.length || 0}</small></h3>
            ${linhaInfo('Total depositado', banco?.total ? `<span title="${escHtml(mpDinheiroCheio(banco.total))}">${escHtml(mpDinheiro(banco.total))}</span>` : '<small>Sem depósitos</small>')}
            ${linhaInfo('Posição entre os apoiadores', banco?.posicao ? `${escHtml(banco.posicao)}º de ${escHtml(banco.apoiadores)}` : '')}
            ${mpTabela(['Data', 'Valor'], depositos.map(item => [
                escHtml(mpData(item.data)),
                `${escHtml(mpDinheiroCheio(item.valor))}${item.nick && item.nick.toLowerCase() !== String(perfil.nick).toLowerCase() ? ` <small>(${escHtml(item.nick)})</small>` : ''}`,
            ]), 'Nenhum depósito registrado ainda.')}
        </section>
        <section class="info-bloco">
            <h3><i class="fa-solid fa-sack-dollar"></i> Prêmios recebidos <small>pagos pelo banco do clã</small></h3>
            ${linhaInfo('Total recebido', totalPremios ? escHtml(mpDinheiro(totalPremios)) : '<small>Nenhum ainda</small>')}
            ${mpTabela(['Data', 'Origem', 'Valor'], premios.map(item => [
                escHtml(mpData(item.data)),
                escHtml(MP_TIPO_PREMIO[item.tipo] || 'Prêmio'),
                escHtml(mpDinheiroCheio(item.valor)),
            ]), 'Quem fica no pódio dos torneios ou acerta o quiz recebe aqui.')}
        </section>
        <p class="mp-nota"><i class="fa-solid fa-lock" aria-hidden="true"></i> Depósitos e prêmios aparecem só para você.</p>
    </div>`;
}

// Escadas de banco vem em dinheiro; as outras sao contagem.
function mpValorEscada(grupo, valor) {
    return grupo === 'banco' ? mpDinheiro(valor) : Number(valor).toLocaleString('pt-BR');
}

function mpFalta(item) {
    const falta = Math.max(0, item.meta - item.atual);
    if (item.grupo === 'banco') return `${mpDinheiro(falta)} em depósitos`;
    const unidade = { podios: ['pódio', 'pódios'], desafios: ['dia de desafios', 'dias de desafios'], ofensiva: ['dia de ofensiva', 'dias de ofensiva'], tempo: ['dia de clã', 'dias de clã'], poder: ['de poder', 'de poder'] }[item.grupo] || ['', ''];
    return `${falta.toLocaleString('pt-BR')} ${unidade[falta === 1 ? 0 : 1]}`.trim();
}

function mpNomeTitulo(nome) {
    const info = TITULOS_POR_NOME.get(nome);
    return info ? tituloHtml(nome, info) : `<b>${escHtml(nome)}</b>`;
}

function mpAbaConta(perfil, membro) {
    const discord = perfil.discord;
    const alts = Array.isArray(perfil.alts) ? perfil.alts : [];
    const servidores = String(membro?.servidor || 'apocalipse').split(',').map(item => SERVIDORES[item.trim()] || item.trim()).filter(Boolean).join(' e ');
    return `<div class="mp-grade">
        <section class="info-bloco">
            <h3><i class="fa-solid fa-id-card"></i> Sua conta</h3>
            ${linhaInfo('Nick', escHtml(perfil.nick))}
            ${linhaInfo('Discord', discord ? `<span class="discord-chip">${discord.avatar ? `<img src="${escHtml(discord.avatar)}" alt="" width="20" height="20">` : ''}${escHtml(String(discord.nome || '').replace(/⌜[^⌟]*⌟\s*/g, '').trim() || perfil.nick)}</span>` : '')}
            ${linhaInfo('Alts', alts.length ? `<span class="alts-lista">${alts.map(alt => `<span class="alt-chip">${escHtml(alt)}</span>`).join('')}</span>` : '<small>Nenhuma</small>')}
            ${linhaInfo('Clã', escHtml(perfil.jogo?.cla || membro?.clan_origem || ''))}
            ${linhaInfo('Servidor', escHtml(servidores))}
            ${linhaInfo('Entrada no clã', membro?.data_entrada ? escHtml(dataBr(membro.data_entrada)) : '<small>Sem data</small>')}
            ${linhaInfo('Recrutador', escHtml(membro?.recrutador || ''))}
        </section>
        <section class="info-bloco">
            <h3><i class="fa-solid fa-pen"></i> Corrigir algo</h3>
            <p class="mp-texto">As mudanças passam pelo Discord, com a conta vinculada:</p>
            ${linhaInfo('<code>/entrada</code>', '<small>data em que entrou no clã</small>')}
            ${linhaInfo('<code>/aniversario</code>', '<small>sua data de nascimento</small>')}
            ${linhaInfo('<code>/vincular</code>', '<small>adicionar uma alt</small>')}
            <p class="mp-nota">Os dados do painel são atualizados pelo bot a cada 30 minutos.</p>
        </section>
    </div>`;
}

// ---------- Administracao (so quem tem cargo) ----------

// O unico login do painel da staff (16/10/2026): a API confere o cargo agora e
// devolve o token no formato de sempre, que vai nos cookies que o painel le.
async function mpAbrirAdmin() {
    const token = mpLerSessao();
    const erro = mensagem => {
        const alvo = document.getElementById('mp-admin-erro');
        if (alvo) { alvo.textContent = mensagem; alvo.hidden = false; }
        else app.innerHTML = mpCartao('fa-solid fa-user-shield', 'Administração', `<p>${escHtml(mensagem)}</p>`, { tipo: 'aviso' });
    };
    if (!token) return mpTelaLogin(null);
    try {
        const resposta = await fetch(`${URL_PAINEL_MEMBRO}/staff`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        const corpo = await resposta.json().catch(() => ({}));
        if (resposta.status === 401) { mpGuardarSessao(null); return mpTelaLogin(null); }
        if (!resposta.ok || !corpo.token) return erro(corpo.message || 'Não foi possível abrir a administração agora.');
        const DOIS_DIAS_EM_MINUTOS = 60 * 24 * 2;
        setCookie(ETY_ADM_LOGIN_COOKIE, DOIS_DIAS_EM_MINUTOS, corpo.login);
        setCookie(ETY_ADM_PASS_COOKIE, DOIS_DIAS_EM_MINUTOS, corpo.token);
        window.location.href = '/painel.html';
    } catch {
        erro('O site não respondeu. Tente de novo em instantes.');
    }
}
