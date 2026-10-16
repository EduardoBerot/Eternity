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

const mpEstado = { dados: null, meta: null, copa: null, aba: 'liga', mes: 0 };

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
    if (mpPedidoAdmin() && corpo.staff) return mpAbrirAdmin();
    mpDesenhar();
}

// ---------- Painel ----------

function mpDesenhar() {
    const { perfil, membro } = mpEstado.dados;
    const nick = perfil.nick;
    const cargo = membro?.cargo || 'Membro';
    const jogo = perfil.jogo || {};
    const online = jogo.visto === 'Online';
    const tempo = tempoNoCla(membro?.data_entrada);
    const inativo = membro?.status && membro.status !== 'Ativo';

    app.innerHTML = `
        <div class="mp-topo">
            <h1>Meu painel</h1>
            <a href="#meu-painel" class="mp-sair" onclick="mpSair(event)"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Sair</a>
        </div>
        <div class="mp">
            <aside class="mp-perfil ${escHtml(classeCargo(cargo))}">
                <img class="mp-skin" src="https://mc-heads.net/body/${encodeURIComponent(String(nick).replace(/^\*+/, ''))}/110" alt="Skin de ${escHtml(nick)}" width="66" height="132">
                <h2>${escHtml(nick)}</h2>
                <div class="dialogo-selos">
                    <span class="selo cargo-${escHtml(classeCargo(cargo))}">${escHtml(cargo)}</span>
                    ${inativo ? '<span class="selo selo-inativo">Inativo</span>' : ''}
                    ${jogo.visto ? `<span class="selo ${online ? 'selo-online' : ''}"><span class="ponto"></span> ${online ? 'Online' : `Visto: ${escHtml(jogo.visto)}`}</span>` : ''}
                </div>
                ${tempo ? `<p class="mp-tempo"><i class="fa-regular fa-clock" aria-hidden="true"></i> No clã ${escHtml(tempo)}</p>` : ''}
                ${mpTitulosConquistados(perfil.titulos)}
            </aside>
            <div class="mp-principal">
                ${mpNumeros(perfil)}
                ${mpAgora(perfil)}
                <div class="mp-abas" role="tablist" aria-label="Seções do painel">
                    ${[['liga', 'fa-trophy', 'Liga'], ['banco', 'fa-building-columns', 'Banco e prêmios'], ['titulos', 'fa-award', 'Títulos'], ['conta', 'fa-id-card', 'Conta'], ...(mpEstado.dados.staff ? [['admin', 'fa-user-shield', 'Administração']] : [])]
                        .map(([id, icone, rotulo]) => `<button type="button" role="tab" class="mp-aba ${mpEstado.aba === id ? 'ativa' : ''}" aria-selected="${mpEstado.aba === id}" onclick="mpTrocarAba('${id}')"><i class="fa-solid ${icone}" aria-hidden="true"></i> ${rotulo}</button>`).join('')}
                </div>
                <div id="mp-aba" role="tabpanel">${mpConteudoAba()}</div>
            </div>
        </div>`;
}

function mpTrocarAba(aba) {
    mpEstado.aba = aba;
    for (const botao of document.querySelectorAll('.mp-aba')) {
        const ativa = botao.getAttribute('onclick').includes(`'${aba}'`);
        botao.classList.toggle('ativa', ativa);
        botao.setAttribute('aria-selected', String(ativa));
    }
    const alvo = document.getElementById('mp-aba');
    if (alvo) alvo.innerHTML = mpConteudoAba();
}

function mpConteudoAba() {
    const { perfil, membro } = mpEstado.dados;
    if (mpEstado.aba === 'admin' && mpEstado.dados.staff) return mpAbaAdmin(membro);
    if (mpEstado.aba === 'banco') return mpAbaBanco(perfil);
    if (mpEstado.aba === 'titulos') return mpAbaTitulos(perfil);
    if (mpEstado.aba === 'conta') return mpAbaConta(perfil, membro);
    return mpAbaLiga(perfil);
}

function mpTitulosConquistados(titulos) {
    const lista = (Array.isArray(titulos) ? titulos : [])
        .map(titulo => ({ ...titulo, info: TITULOS_POR_NOME.get(titulo.nome) }))
        .filter(titulo => titulo.info)
        .sort((a, b) => Number(Boolean(b.atual)) - Number(Boolean(a.atual)) || b.info.nivel - a.info.nivel);
    if (!lista.length) return '';
    return `<div class="mp-titulos">
        ${lista.map(titulo => `<span class="titulo-chip holo" style="--de:${titulo.info.familia.de};--ate:${titulo.info.familia.ate}" title="${titulo.atual ? 'Usando agora' : 'Conquistado'}">${tituloHtml(titulo.nome, titulo.info, { atual: titulo.atual })}</span>`).join('')}
    </div>`;
}

function mpNumero(rotulo, valor, apoio, { destaque = false } = {}) {
    return `<div class="mp-numero ${destaque ? 'destaque' : ''}">
        <span>${rotulo}</span>
        <strong>${valor}</strong>
        <small>${apoio || '&nbsp;'}</small>
    </div>`;
}

function mpNumeros(perfil) {
    const mes = perfil.ligaMeses?.[0] || perfil.liga;
    const banco = perfil.banco;
    const dominio = Number(perfil.liga?.dominio) || 0;
    return `<div class="mp-numeros">
        ${mpNumero('Pontos na Liga', escHtml(mes?.pontos ?? 0), mes?.posicao ? `${escHtml(mes.posicao)}º de ${escHtml(mes.participantes)}` : 'Sem pontos no mês', { destaque: true })}
        ${mpNumero('Banco do clã', escHtml(mpDinheiro(banco?.total)), banco?.posicao ? `${escHtml(banco.posicao)}º de ${escHtml(banco.apoiadores)} apoiadores` : 'Sem depósitos')}
        ${mpNumero('Eventos vencidos', escHtml(perfil.eventos?.total ?? 0), 'desde ago/2026')}
        ${mpNumero('Ofensiva', dominio ? `🔥 ${escHtml(dominio)}` : '0', dominio ? 'dias seguidos' : 'Dias de Domínio')}
    </div>`;
}

// O que da para fazer agora: so o que a pessoa consegue mudar hoje.
function mpAgora(perfil) {
    const itens = [];
    const dominio = Number(perfil.liga?.dominio) || 0;
    itens.push(dominio
        ? ['fa-fire', `Ofensiva de <b>${escHtml(dominio)} dias</b> nos Dias de Domínio. Complete os desafios de hoje para não perder a sequência.`]
        : ['fa-fire', 'Complete todos os desafios de hoje para começar uma ofensiva nos <b>Dias de Domínio</b>.']);

    const meta = mpEstado.meta;
    if (meta && Number(meta.meta) > 0) {
        const pct = Math.min(100, Math.round((Number(meta.liquido) || 0) / Number(meta.meta) * 100));
        const chaves = new Set([perfil.nick, ...(perfil.alts || [])].map(nick => String(nick).toLowerCase()));
        const minha = (meta.apoiadores || []).filter(item => chaves.has(String(item.nick).toLowerCase())).reduce((soma, item) => soma + (Number(item.valor) || 0), 0);
        itens.push(['fa-building-columns', `Meta do banco da semana em <b>${pct}%</b> (${escHtml(mpDinheiro(meta.liquido))} de ${escHtml(mpDinheiro(meta.meta))}). ${minha ? `Sua parte: <b>${escHtml(mpDinheiro(minha))}</b>.` : 'Você ainda não depositou nesta semana.'}`]);
    }

    const copa = mpEstado.copa;
    if (copa?.status === 'inscricoes') {
        const inscrito = (copa.inscritos || []).some(nick => String(nick).toLowerCase() === String(perfil.nick).toLowerCase());
        itens.push(['fa-hand-fist', inscrito
            ? 'Você está inscrito na <b>Copa de Duelos</b>. Fique de olho no Discord para a sua chamada.'
            : `Inscrições da <b>Copa de Duelos</b> abertas${copa.inscricoesAte ? ` até ${escHtml(mpData(copa.inscricoesAte))}` : ''}. Use <code>/copa</code> no Discord.`]);
    }

    const perto = (perfil.privado?.proximosTitulos || [])
        .map(item => ({ ...item, razao: item.atual / item.meta }))
        .filter(item => item.razao < 1)
        .sort((a, b) => b.razao - a.razao)[0];
    if (perto) itens.push(['fa-award', `Você está a <b>${escHtml(mpFalta(perto))}</b> do título ${mpNomeTitulo(perto.nome)}.`]);

    return `<section class="info-bloco mp-agora">
        <h3><i class="fa-solid fa-bolt"></i> O que fazer agora</h3>
        <ul>${itens.map(([icone, texto]) => `<li><i class="fa-solid ${icone}" aria-hidden="true"></i><span>${texto}</span></li>`).join('')}</ul>
    </section>`;
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

function mpTrocarMes(indice) {
    mpEstado.mes = Number(indice) || 0;
    const alvo = document.getElementById('mp-aba');
    if (alvo) alvo.innerHTML = mpAbaLiga(mpEstado.dados.perfil);
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

function mpAbaTitulos(perfil) {
    const proximos = perfil.privado?.proximosTitulos || [];
    const conquistados = mpTitulosConquistados(perfil.titulos);
    return `<div class="mp-grade">
        <section class="info-bloco info-bloco-largo">
            <h3><i class="fa-solid fa-stairs"></i> Próximo degrau de cada escada</h3>
            ${proximos.length ? `<ul class="mp-progresso">${proximos.map(item => {
                const pct = Math.min(100, Math.round(item.atual / item.meta * 100));
                return `<li>
                    <div class="mp-progresso-topo">
                        <span class="titulo-chip">${mpNomeTitulo(item.nome)}</span>
                        <strong>${escHtml(mpValorEscada(item.grupo, item.atual))} / ${escHtml(mpValorEscada(item.grupo, item.meta))}</strong>
                    </div>
                    <div class="mp-progresso-barra" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${escHtml(item.nome)}"><span style="width:${pct}%"></span></div>
                    <small>Faltam ${escHtml(mpFalta(item))}</small>
                </li>`;
            }).join('')}</ul>` : '<p class="info-vazio">Você já está no topo das escadas que dá para medir.</p>'}
        </section>
        <section class="info-bloco info-bloco-largo">
            <h3><i class="fa-solid fa-award"></i> Conquistados</h3>
            ${conquistados ? conquistados.replace('class="mp-titulos"', 'class="mp-titulos mp-titulos-esquerda"') : '<p class="info-vazio">Nenhum título ainda.</p>'}
            <p class="mp-nota">Para usar um título no jogo, mande para a Eternity: <code>/m Eternity quero a tag Nome</code>. A lista completa está na <a href="#wiki">Wiki</a>.</p>
        </section>
    </div>`;
}

function mpAbaConta(perfil, membro) {
    const discord = perfil.discord;
    const alts = Array.isArray(perfil.alts) ? perfil.alts : [];
    const servidores = String(membro?.servidor || 'apocalipse').split(',').map(item => SERVIDORES[item.trim()] || item.trim()).filter(Boolean).join(' e ');
    return `<div class="mp-grade">
        <section class="info-bloco">
            <h3><i class="fa-solid fa-id-card"></i> Sua conta</h3>
            ${linhaInfo('Nick', escHtml(perfil.nick))}
            ${linhaInfo('Discord', discord ? `<span class="discord-chip">${discord.avatar ? `<img src="${escHtml(discord.avatar)}" alt="" width="20" height="20">` : ''}${escHtml(discord.nome || perfil.nick)}</span>` : '')}
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
function mpAbaAdmin(membro) {
    return `<div class="mp-grade">
        <section class="info-bloco info-bloco-largo mp-admin">
            <h3><i class="fa-solid fa-user-shield"></i> Painel da staff</h3>
            <p class="mp-texto">Como ${escHtml(membro?.cargo || 'staff')}, você tem acesso ao painel da staff: membros, solicitações, recrutamento e o que mais o seu cargo permite.</p>
            <button type="button" class="button mp-entrar" onclick="mpAbrirAdmin()"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Abrir a administração</button>
            <p class="mp-nota" id="mp-admin-erro" hidden></p>
            <p class="mp-nota">O acesso confere o seu cargo a cada ação e vale por 2 dias; depois o site renova sozinho pelo seu Discord.</p>
        </section>
    </div>`;
}

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
