// Guia do Recruta: video, teste, Discord e convite num caminho so.
// Substitui as placas do /go ETY e o teste que a Eternity aplicava no chat do
// jogo (28/09/2026). O teste e sorteado e corrigido no servidor e e so uma
// barreira antes da etapa do Discord: nao guarda quem passou. Desde 29/09/2026
// nao ha formulario de cadastro -- a data de nascimento e pedida na janela do
// vinculo do Discord, e o bot cria a solicitacao quando a pessoa, ja vinculada,
// esta em recrutamento com ele.

const URL_TESTE = `${URL_BASE}/api/recrutamento/teste`;
const DISCORD_URL = 'https://discord.gg/vj4eNDJqct';
const GUIA_ETAPAS = ['Vídeo', 'Teste', 'Discord', 'Convite'];
// v2: as etapas mudaram de indice quando o cadastro saiu; um progresso salvo
// com a numeracao antiga abriria a etapa errada.
const GUIA_STORAGE = 'eternity-guia-v2';

// `doJogo`: a pessoa chegou pelo link que a Eternity manda no jogo
// (?nick=Fulano#guia, ou ?g=Fulano.assinatura desde 15/10/2026). Ai a conta ja
// esta acompanhando o recrutamento e convida sozinha no fim; sem o link, a
// pessoa precisa chamar a conta no jogo. `link`: o `g` assinado, que prova o
// nick e libera o vinculo pelo login do Discord.
let guia = { etapa: 0, aprovado: false, nick: '', doJogo: false, link: '' };

function guiaCarregar() {
    try {
        const salvo = JSON.parse(sessionStorage.getItem(GUIA_STORAGE) || 'null');
        if (salvo && Number.isInteger(salvo.etapa)) guia = { ...guia, ...salvo };
    } catch (_) { /* sem storage: comeca do zero */ }
}

function guiaSalvar() {
    try { sessionStorage.setItem(GUIA_STORAGE, JSON.stringify(guia)); } catch (_) { /* ignora */ }
}

// Onde a pessoa parou no Guia, so para quem veio pelo link do bot (14/10/2026):
// a conta do cla le isso para saber se a pessoa parada abriu o link, passou no
// teste ou parou no Discord. Quem abre o site sozinho continua anonimo, e o
// teste aprovado e gravado pela propria correcao. Uma vez por etapa e por
// pagina; falha nao atrapalha o Guia.
const URL_GUIA_PROGRESSO = `${URL_BASE}/api/recrutamento/guia`;
const guiaRegistrado = new Set();

function guiaRegistrar(etapa) {
    if (!guia.doJogo || !guia.nick || guiaRegistrado.has(etapa)) return;
    guiaRegistrado.add(etapa);
    fetch(URL_GUIA_PROGRESSO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: guia.nick, etapa }),
        keepalive: true,
    }).catch(() => guiaRegistrado.delete(etapa));
}

function guiaIr(etapa) {
    guia.etapa = etapa;
    guiaSalvar();
    renderGuia();
    document.getElementById('app')?.scrollTo({ top: 0, behavior: 'smooth' });
}

function guiaProgresso() {
    return `<ol class="guia-stepper">${GUIA_ETAPAS.map((nome, i) => `
        <li class="${i < guia.etapa ? 'feita' : i === guia.etapa ? 'atual' : ''}">
            <span class="num">${i < guia.etapa ? '<i class="fa-solid fa-check"></i>' : i + 1}</span>
            <span class="nome">${nome}</span>
        </li>`).join('')}</ol>`;
}

// Comando com botao de copiar: no celular ninguem quer digitar "/m Coagula1999".
function guiaComando(servidor, comando) {
    return `<div class="cmd"><small>${servidor}</small><code>${escapeGuia(comando)}</code>
        <button type="button" class="copiar" title="Copiar" data-cmd="${escapeGuia(comando)}" onclick="guiaCopiar(this)"><i class="fa-regular fa-copy"></i></button></div>`;
}

async function guiaCopiar(botao) {
    try {
        // O codigo do vinculo cada um tem o seu: copia so o comeco.
        await navigator.clipboard.writeText(botao.dataset.cmd.replace(' CÓDIGO', ' '));
        botao.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => { botao.innerHTML = '<i class="fa-regular fa-copy"></i>'; }, 1500);
    } catch (_) { /* sem clipboard: o texto continua na tela */ }
}

function escapeGuia(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const GUIA_REGRAS = `
    <div class="guia-cards">
        <section class="guia-card">
            <h3><i class="fa-solid fa-landmark"></i> O clã</h3>
            <p>A Eternity foi fundada em <b>01/08/2020</b> por <b>Ducred22</b>. Hoje estamos na <b>Terceira Era</b> (a Primeira foi 2020–2021 e a Segunda, 2022–2024).</p>
            <p>Nossos valores são <b>união, justiça e honestidade</b>. O clã ajuda quem está começando.</p>
        </section>
        <section class="guia-card">
            <h3><i class="fa-solid fa-city"></i> A cidade</h3>
            <p>A cidade fica no <b>Apocalipse</b>: entre com <code>/apocalipse</code> e visite com <code>/go ETY</code>. Casas e terrenos são gratuitos.</p>
            <p>Vai construir? Use <b>somente estilo moderno</b>.</p>
        </section>
        <section class="guia-card">
            <h3><i class="fa-solid fa-clock"></i> Atividade</h3>
            <p><b>10 dias offline resultam em kick.</b> Com <b>3 meses offline</b>, o trust da casa é retirado e os itens vão para o banco de itens do clã.</p>
            <p>O <b>confiável</b> é automático: a Eternity o dá a quem completa <b>20 dias de clã</b>, e ele é exigido nas farms coletivas.</p>
        </section>
        <section class="guia-card">
            <h3><i class="fa-solid fa-khanda"></i> PvP</h3>
            <p><b>Tp kill é proibido.</b></p>
            <p>Eventos de PvP são organizados pela equipe de PvP: Heika, Sohei, Ikko e Daimyo.</p>
        </section>
        <section class="guia-card">
            <h3><i class="fa-solid fa-seedling"></i> Farms e warps</h3>
            <p>Todos os warps e farms do clã ficam no <b>Apocalipse</b> (<code>/apocalipse</code>).</p>
            <p>Farms coletivas de batata, herbalismo e a mega farm liberam trust para quem é confiável (a mega farm pede Herbalismo 100 no mcMMO). Peça à Eternity no privado.</p>
            <p>Outros warps: <code>/go ETYShop</code>, <code>/go ETYHistoria</code>, <code>/go ETYTrofeus</code>, <code>/go ETYXp</code>, <code>/go ETYSpawners</code> e mais.</p>
        </section>
        <section class="guia-card">
            <h3><i class="fa-solid fa-crown"></i> Cargos e títulos</h3>
            <p>A cor define a hierarquia e o cargo define a função. Dono conduz os ciclos e as promoções da staff; Coordenador acompanha a gestão; Supervisor zela pela cidade e pelas farms; Auxiliar é mentor dos novatos.</p>
            <p>Títulos vêm do mcMMO, dos desafios, dos torneios e da Liga, do banco do clã e do tempo de clã (Tyrael aos 120 dias até Raziel aos 5 anos). A lista completa está na Wiki; peça a sua tag à Eternity no jogo.</p>
        </section>
    </div>`;

// Primeira etapa: o video que apresenta o cla e as regras. O teste e sobre ele.
// O texto das regras fica recolhido embaixo, para quem nao pode ouvir e para
// consulta de quem vai tentar o teste de novo.
function renderGuiaVideo() {
    return `
        <video class="guia-video" controls playsinline preload="metadata" poster="imgs/apresentacao-poster.jpg" src="videos/apresentacao.mp4"></video>
        <button class="button guia-continuar" id="guia-avancar" onclick="guiaIr(1)">Continuar</button>
        <p class="guia-links">
            <a href="#" onclick="guiaMostrarRegras(event)">Prefere ler? Ver as regras em texto</a>
            <span>·</span>
            Já é do clã? <a href="#" onclick="openAtualizar(event)">Atualizar cadastro</a>
        </p>
        <div id="guia-regras-texto" hidden>${GUIA_REGRAS}</div>`;
}

function guiaMostrarRegras(event) {
    event?.preventDefault();
    const bloco = document.getElementById('guia-regras-texto');
    bloco.hidden = !bloco.hidden;
    if (!bloco.hidden) bloco.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Cada pergunta e um cartao com o titulo DENTRO dele. Era um fieldset com
// legend, e o navegador desenha a legend em cima da borda: o titulo "pulava"
// para fora do cartao.
async function carregarTeste() {
    const alvo = document.getElementById('guia-teste');
    try {
        const resposta = await fetch(URL_TESTE);
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        const { token, perguntas } = await resposta.json();
        alvo.dataset.token = token;
        alvo.innerHTML = perguntas.map((p, i) => `
            <div class="quiz-card" role="radiogroup" aria-labelledby="quiz-q${i}">
                <span class="quiz-num">Pergunta ${i + 1} de ${perguntas.length}</span>
                <h3 id="quiz-q${i}">${escapeGuia(p.enunciado)}</h3>
                <div class="quiz-opcoes">${p.opcoes.map((opcao, j) => `
                    <label class="quiz-opcao">
                        <input type="radio" name="q${i}" value="${j}" onchange="guiaContarRespostas()">
                        <span class="letra">${'ABCD'[j]}</span>
                        <span class="texto">${escapeGuia(opcao)}</span>
                    </label>`).join('')}
                </div>
            </div>`).join('') + `
            <div class="quiz-rodape">
                <span id="quiz-contador">0 de ${perguntas.length} respondidas</span>
                <button class="button guia-principal" id="quiz-enviar" type="submit" disabled>Enviar respostas</button>
                <p id="guia-msg" class="guia-msg"></p>
            </div>`;
    } catch (error) {
        console.error(error);
        alvo.innerHTML = '<p class="guia-erro">Não consegui carregar o teste. Tente de novo em alguns segundos.</p>';
    }
}

function guiaContarRespostas() {
    const form = document.getElementById('guia-teste');
    const total = form.querySelectorAll('.quiz-card').length;
    const feitas = form.querySelectorAll('input[type="radio"]:checked').length;
    document.getElementById('quiz-contador').textContent = `${feitas} de ${total} respondidas`;
    document.getElementById('quiz-enviar').disabled = feitas < total;
}

function renderGuiaTeste() {
    setTimeout(carregarTeste);
    return `
        <div class="guia-cabeca">
            <h2>Teste</h2>
            <p>Três perguntas sobre o vídeo. Acerte todas para seguir para o Discord. <a href="#" onclick="guiaIr(0); return false;">Rever o vídeo</a></p>
        </div>
        <form id="guia-teste" class="quiz" onsubmit="enviarTeste(event)">${loadingHTML}</form>`;
}

async function enviarTeste(event) {
    event.preventDefault();
    const form = event.target;
    const total = form.querySelectorAll('.quiz-card').length;
    const respostas = [];
    for (let i = 0; i < total; i++) {
        const marcada = form.querySelector(`input[name="q${i}"]:checked`);
        if (!marcada) {
            document.getElementById('guia-msg').textContent = 'Responda todas as perguntas.';
            return;
        }
        respostas.push(Number(marcada.value));
    }
    const msg = document.getElementById('guia-msg');
    try {
        const resposta = await fetch(URL_TESTE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Nick so quando veio do link do bot (?nick=): e o que marca a
            // integracao de quem entrou por convite direto (03/10/2026).
            body: JSON.stringify({ token: form.dataset.token, respostas, ...(guia.doJogo && guia.nick ? { nick: guia.nick } : {}) }),
        });
        const resultado = await resposta.json();
        if (!resposta.ok) throw new Error(resultado?.message || 'Falha ao corrigir.');
        if (resultado.aprovado) {
            guia.aprovado = true;
            guiaIr(2);
            return;
        }
        const pontos = Array.from({ length: resultado.total }, (_, i) => `<span class="${i < resultado.acertos ? 'ok' : ''}"></span>`).join('');
        document.getElementById('app').innerHTML = `
            <h1>Recrutamento</h1>
            ${guiaProgresso()}
            <div class="guia-cartao guia-centro">
                <div class="guia-selo aviso"><i class="fa-solid fa-rotate-right"></i></div>
                <h2>Quase lá!</h2>
                <div class="quiz-pontos">${pontos}</div>
                <p>Você acertou <b>${resultado.acertos} de ${resultado.total}</b>. Reveja o vídeo (ou as regras em texto) e tente de novo — as perguntas mudam a cada tentativa.</p>
                <button class="button guia-principal" onclick="guiaIr(0)">Rever o vídeo</button>
            </div>`;
    } catch (error) {
        console.error(error);
        msg.textContent = error.message && error.message !== 'Failed to fetch' ? error.message : 'Não consegui enviar. Tente de novo.';
    }
}

// Vinculo pelo login do Discord (15/10/2026). Com o link assinado do jogo, o
// Guia ja sabe que a pessoa e dona do nick: o login diz quem ela e no Discord, e
// o bot a coloca no servidor e grava o vinculo -- sem canal, sem codigo e sem
// voltar ao jogo para digitar nada. A data de nascimento era pedida na janela do
// botao do Discord; aqui ela vem antes do login.
const URL_GUIA_DISCORD = `${URL_BASE}/api/guia/discord`;

function renderGuiaDiscordLogin() {
    const nick = escapeGuia(guia.nick);
    const cabeca = guia.volta
        ? `<div class="guia-cabeca">
            <h2>Bem-vindo de volta, ${nick}!</h2>
            <p>Você já foi da Eternity: não precisa refazer o vídeo nem o teste. Para voltar, só falta o Discord.</p>
        </div>`
        : `<div class="guia-cabeca">
            <h2>Discord</h2>
            <p>Teste aprovado! Todo membro fica no nosso Discord, com a conta vinculada ao nick.</p>
        </div>`;
    return `
        ${cabeca}
        <form class="guia-cartao guia-centro guia-login" onsubmit="guiaEntrarDiscord(event)">
            <div class="guia-selo discord"><i class="fa-brands fa-discord"></i></div>
            <h2>Vincule com um clique</h2>
            <p>Entre com a sua conta do Discord: você já cai no <b>nosso servidor</b> com a conta vinculada ao nick <b>${nick}</b>. Não precisa mandar código no jogo.</p>
            <label class="guia-campo">
                <span>Sua data de nascimento</span>
                <input id="guia-nascimento" type="text" inputmode="numeric" autocomplete="bday" placeholder="dd/mm/aaaa" maxlength="10" required oninput="guiaMascaraData(this)">
            </label>
            <button class="guia-discord guia-discord--grande" id="guia-entrar-discord" type="submit"><i class="fa-brands fa-discord"></i> Entrar com Discord</button>
            <small class="guia-sub">Não tem conta? Dá para criar na própria tela do Discord, de graça.</small>
            <p id="guia-msg" class="guia-msg"></p>
        </form>
        <p class="guia-links"><a href="#" onclick="guiaVinculoPeloCanal(event)">Prefiro vincular pelo canal #saudações</a><span>·</span><a href="#" onclick="guiaSemDiscord(event)">Não tenho Discord</a></p>`;
}

// dd/mm/aaaa enquanto digita: no celular o teclado numerico nao tem a barra.
function guiaMascaraData(campo) {
    const digitos = campo.value.replace(/\D/g, '').slice(0, 8);
    campo.value = [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4)].filter(Boolean).join('/');
}

async function guiaEntrarDiscord(event) {
    event.preventDefault();
    const msg = document.getElementById('guia-msg');
    const botao = document.getElementById('guia-entrar-discord');
    const nascimento = document.getElementById('guia-nascimento').value.trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(nascimento)) {
        msg.textContent = 'Escreva a data no formato dd/mm/aaaa.';
        return;
    }
    msg.textContent = '';
    botao.disabled = true;
    botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Abrindo o Discord...';
    try {
        const resposta = await fetch(`${URL_GUIA_DISCORD}/iniciar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ g: guia.link, nascimento }),
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok || !dados.url) throw new Error(dados.message || 'Não consegui abrir o Discord. Tente de novo.');
        location.href = dados.url;
    } catch (error) {
        botao.disabled = false;
        botao.innerHTML = '<i class="fa-brands fa-discord"></i> Entrar com Discord';
        msg.textContent = error.message && error.message !== 'Failed to fetch' ? error.message : 'Não consegui falar com o site. Tente de novo em alguns segundos.';
    }
}

// O caminho antigo continua valendo: o botao "Vincular minha conta" no canal.
function guiaVinculoPeloCanal(event) {
    event?.preventDefault();
    guia.peloCanal = true;
    renderGuia();
}

// A volta do Discord: ?vinculo=<id> acompanha o bot do Discord aplicar o
// vinculo (ele confere a cada minuto); ?vinculo=erro diz o que deu errado.
const GUIA_ERROS_VINCULO = {
    cancelado: 'Você cancelou o login no Discord.',
    expirado: 'O login demorou demais ou já foi usado.',
    discord: 'O Discord não respondeu agora.',
};
let guiaVinculoTimer = null;

function renderGuiaVinculo(id, motivo) {
    clearTimeout(guiaVinculoTimer);
    // So chega aqui quem apertou o botao da etapa do Discord, ou seja, ja
    // passou no teste. A volta pode abrir noutra aba (o app do Discord no
    // celular), sem a sessao: sem isto, "Tentar de novo" mandaria refazer o teste.
    guia.aprovado = true;
    if (guia.etapa < 2) guia.etapa = 2;
    guiaSalvar();
    const app = document.getElementById('app');
    app.classList.remove('guia-modo-video');
    const tentarDeNovo = `<button class="button guia-principal" onclick="guiaVoltarAoDiscord()">Tentar de novo</button>`;
    const cartao = (selo, icone, titulo, corpo) => {
        app.innerHTML = `<h1>Recrutamento</h1>${guia.volta ? '' : guiaProgresso()}
            <div class="guia-cartao guia-centro">
                <div class="guia-selo ${selo}"><i class="${icone}"></i></div>
                <h2>${titulo}</h2>${corpo}
            </div>`;
    };
    if (id === 'erro') {
        cartao('aviso', 'fa-brands fa-discord', 'O vínculo não saiu', `<p>${escapeGuia(GUIA_ERROS_VINCULO[motivo] || GUIA_ERROS_VINCULO.discord)}</p>${tentarDeNovo}`);
        return;
    }
    let tentativas = 0;
    const consultar = async () => {
        tentativas += 1;
        let dados = null;
        try {
            const resposta = await fetch(`${URL_GUIA_DISCORD}/status/${encodeURIComponent(id)}`);
            dados = resposta.ok ? await resposta.json() : null;
        } catch (_) { /* tenta de novo */ }
        if (dados?.status === 'concluido') {
            guia.etapa = 3;
            guia.aprovado = true;
            if (dados.nick && !guia.nick) guia.nick = dados.nick;
            guia.doJogo = true;
            guiaSalvar();
            cartao('sucesso', 'fa-solid fa-check', 'Discord vinculado!', `
                <p>A conta <b>${escapeGuia(dados.usuario || 'do Discord')}</b> está vinculada ao nick <b>${escapeGuia(dados.nick)}</b> e já está no nosso servidor.</p>
                <p>Agora é só <b>ficar online no jogo</b>: a conta do clã manda o <b>convite</b> sozinha.</p>
                ${GUIA_AVISO_CONVITE}
                <h2 class="guia-bemvindo">Seja bem-vindo à Eternity!</h2>`);
            return;
        }
        if (dados?.status === 'falhou') {
            cartao('aviso', 'fa-brands fa-discord', 'O vínculo não saiu', `<p>${escapeGuia(dados.motivo || 'Algo deu errado.')}</p>${tentarDeNovo}`);
            return;
        }
        // Autorizado: o bot do Discord pega em ate um minuto. Passados ~3 min, o
        // mais provavel e o recrutamento ter vencido no jogo.
        const demorando = tentativas > 36;
        cartao('discord', 'fa-solid fa-spinner fa-spin', 'Vinculando sua conta...', demorando
            ? '<p>Está demorando mais que o normal. Mande <b>quero entrar</b> para a conta do clã no jogo e use o link novo que ela mandar.</p>'
            : `<p>Recebemos o login${dados?.usuario ? ` de <b>${escapeGuia(dados.usuario)}</b>` : ''}. A conta do clã está aplicando o vínculo — leva até um minuto.</p><p class="guia-sub">Pode deixar esta página aberta.</p>`);
        guiaVinculoTimer = setTimeout(consultar, tentativas < 20 ? 3000 : 6000);
    };
    cartao('discord', 'fa-solid fa-spinner fa-spin', 'Vinculando sua conta...', '<p>Conferindo o login...</p>');
    consultar();
}

function guiaVoltarAoDiscord() {
    clearTimeout(guiaVinculoTimer);
    history.replaceState(null, '', `${location.pathname}${guia.link ? `?g=${encodeURIComponent(guia.link)}` : ''}#guia`);
    guia.etapa = 2;
    guiaSalvar();
    renderGuia();
}

function renderGuiaDiscord() {
    const nick = escapeGuia(guia.nick || 'SeuNick');
    guiaRegistrar('discord');
    if (guia.link && !guia.peloCanal) return renderGuiaDiscordLogin();
    return `
        <div class="guia-cabeca">
            <h2>Discord</h2>
            <p>${guia.volta ? 'Bem-vindo de volta!' : 'Teste aprovado!'} Todo membro fica no nosso Discord, com a conta vinculada ao nick.</p>
        </div>
        <ol class="guia-timeline">
            <li>
                <span class="passo">1</span>
                <div><h3>Entre no servidor</h3>
                    <a class="guia-discord" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-discord"></i> Entrar no Discord</a>
                    <small>Não tem conta? É gratuita — crie em discord.com.</small></div>
            </li>
            <li>
                <span class="passo">2</span>
                <div><h3>Vincule sua conta</h3>
                    <p>No canal <b>#saudações</b>, clique em <b>Vincular minha conta</b> e informe o nick <b>${nick}</b> e sua data de nascimento.</p></div>
            </li>
            <li>
                <span class="passo">3</span>
                <div><h3>Confirme no jogo</h3>
                    <p>O bot mostra um <b>código</b>. Mande em privado para a conta do clã:</p>
                    <div class="guia-cmds">${guiaComando('Apocalipse', '/m Eternity vincular CÓDIGO')}${guiaComando('Gênesis', '/m Coagula1999 vincular CÓDIGO')}</div></div>
            </li>
        </ol>
        <button class="button guia-principal" onclick="guiaIr(3)">Já vinculei</button>
        ${guia.link ? '<p class="guia-links"><a href="#" onclick="guia.peloCanal = false; renderGuia(); return false;">Voltar para o login com Discord</a></p>' : ''}
        <!-- Quem ja tem o Discord vinculado ao nick nao refaz o vinculo: o bot
             confere no jogo e segue direto para a solicitacao e o convite. -->
        <p class="guia-links"><a href="#" onclick="guiaIr(3); return false;">Já tenho o Discord vinculado ao meu nick</a><span>·</span><a href="#" onclick="guiaSemDiscord(event)">Não tenho Discord</a></p>`;
}

// O Discord continua obrigatorio (14/10/2026): o botao nao pula a etapa. Ele
// avisa a conta do cla, que pausa o recrutamento e para de cobrar a pessoa ate
// ela voltar com o "quero entrar". Fica fora da numeracao das etapas: e um
// desvio da etapa do Discord, e o "Voltar" devolve para ela.
function guiaSemDiscord(event) {
    event?.preventDefault();
    guiaRegistrar('sem_discord');
    const comando = guia.doJogo
        ? `<p>Seu teste fica salvo e a conta do clã para de te cobrar enquanto isso. Quando tiver o Discord, volte nesta página ou mande no jogo:</p>`
        : `<p>Seu teste fica salvo nesta página. Quando tiver o Discord, volte aqui ou mande no jogo:</p>`;
    document.getElementById('app').innerHTML = `
        <h1>Recrutamento</h1>
        ${guiaProgresso()}
        <div class="guia-cartao guia-centro">
            <div class="guia-selo aviso"><i class="fa-brands fa-discord"></i></div>
            <h2>Sem problema</h2>
            <p>O Discord é <b>obrigatório</b> para entrar na Eternity: é por ele que o clã aplica o seu cargo e fala com os membros.</p>
            <p>A conta é <b>gratuita</b> e sai em dois minutos, até pelo celular.</p>
            <a class="guia-discord" href="https://discord.com/register" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-discord"></i> Criar conta no Discord</a>
            ${comando}
            <div class="guia-cmds">${guiaComando('Apocalipse', '/m Eternity quero entrar')}${guiaComando('Gênesis', '/m Coagula1999 quero entrar')}</div>
        </div>
        <p class="guia-rodape"><a href="#" onclick="renderGuia(); return false;">Voltar para a etapa do Discord</a></p>`;
    document.getElementById('app')?.scrollTo({ top: 0, behavior: 'smooth' });
}

// No Apocalipse o convite NAO vem da Eternity nem da ETY: vem da ETZ, a porta de
// entrada, enviado pela Coagula1999 -- que mora no Genesis e precisa viajar ate
// o Apocalipse, o que leva alguns minutos. Recruta que esperava outra coisa
// ignorava o convite da ETZ ou saia antes de ele chegar, e nunca entrava.
const GUIA_AVISO_CONVITE = `
    <div class="guia-aviso-convite">
        <p><i class="fa-solid fa-envelope-open-text"></i> <b>No Apocalipse, o convite vem do clã ETZ</b>, a porta de entrada da Eternity. <b>Aceite o convite da ETZ</b>: é por ele que você entra no clã.</p>
        <p><i class="fa-solid fa-hourglass-half"></i> Quem envia é a conta <b>Coagula1999</b>, que precisa vir até o Apocalipse. <b>Pode levar alguns minutos</b> — fique online e aguarde.</p>
        <p class="guia-sub">No Gênesis, o convite vem direto da ETY.</p>
    </div>`;

function renderGuiaConvite() {
    const lema = '<h2 class="guia-bemvindo">Seja bem-vindo à Eternity!</h2>';
    if (guia.doJogo) {
        return `
        <div class="guia-cartao guia-centro guia-final">
            <div class="guia-selo sucesso"><i class="fa-solid fa-check"></i></div>
            <h2>Tudo pronto!</h2>
            <p>A conta do clã já está acompanhando você no jogo e manda o <b>convite do clã</b> sozinha.</p>
            ${GUIA_AVISO_CONVITE}
            <p class="guia-sub">Se estiver offline, entre no servidor: o convite sai assim que você aparecer.</p>
            ${lema}
        </div>`;
    }
    return `
        <div class="guia-cartao guia-centro guia-final">
            <div class="guia-selo sucesso"><i class="fa-solid fa-check"></i></div>
            <h2>Última etapa!</h2>
            <p>Entre no jogo e chame a conta do clã no privado:</p>
            <div class="guia-cmds">${guiaComando('Apocalipse', '/m Eternity quero entrar')}${guiaComando('Gênesis', '/m Coagula1999 quero entrar')}</div>
            <p>Ela confere o Discord e manda o <b>convite do clã</b>.</p>
            ${GUIA_AVISO_CONVITE}
            ${lema}
        </div>
        <p class="guia-rodape"><a href="#" onclick="guiaRecomecar(event)">Recomeçar</a></p>`;
}

function guiaRecomecar(event) {
    event?.preventDefault();
    guia = { etapa: 0, aprovado: false, nick: guia.doJogo ? guia.nick : '', doJogo: guia.doJogo };
    guiaSalvar();
    renderGuia();
}

const GUIA_RENDER = [renderGuiaVideo, renderGuiaTeste, renderGuiaDiscord, renderGuiaConvite];

// Ex-membro (?g=...&v, 15/10/2026): a lista de inativos no bot ja decidiu que
// ele volta sem recrutamento, entao o Guia e so o login do Discord. O link
// "pelo canal" continua valendo, sem as etapas.
function renderGuiaVolta() {
    const app = document.getElementById('app');
    app.classList.remove('guia-modo-video');
    // "Já vinculei" (pelo canal) leva a etapa 3: o aviso do convite.
    const corpo = guia.etapa >= 3 ? renderGuiaConvite() : guia.peloCanal ? renderGuiaDiscord() : renderGuiaDiscordLogin();
    app.innerHTML = `<h1>Recrutamento</h1>${corpo}`;
}

function renderGuia() {
    if (guia.volta && guia.link) {
        renderGuiaVolta();
        return;
    }
    // O teste e a barreira: sem ele aprovado nesta sessao, volta para o teste.
    if (guia.etapa >= 2 && !guia.aprovado) guia.etapa = 1;
    if (!GUIA_RENDER[guia.etapa]) guia.etapa = 0;
    const app = document.getElementById('app');
    // Na etapa do video a atencao e toda dele: as etapas so aparecem depois.
    app.classList.toggle('guia-modo-video', guia.etapa === 0);
    app.innerHTML = `<h1>Recrutamento</h1>${guia.etapa === 0 ? '' : guiaProgresso()}${GUIA_RENDER[guia.etapa]()}`;
}

function openGuia() {
    guiaCarregar();
    const params = new URLSearchParams(location.search);
    // ?g=Nick.assinatura (15/10/2026): o nick e a prova dele num parametro so.
    const link = params.get('g') || '';
    const doLink = link.includes('.') ? link.slice(0, link.lastIndexOf('.')) : '';
    const nick = doLink || params.get('nick');
    // O `*` e o prefixo dos nicks do Bedrock (*aislan8560): sem ele no padrao,
    // o link do bot para essas pessoas abria o Guia como se nao fosse do jogo.
    if (nick && /^\*?[A-Za-z0-9_]{3,16}$/.test(nick)) {
        guia.doJogo = true;
        if (!guia.nick || doLink) guia.nick = nick;
        if (doLink) guia.link = link;
        // `&v`: ex-membro voltando (o bot so manda este link para quem esta na
        // lista de inativos). Um link sem a marca desfaz a de um anterior.
        if (doLink) guia.volta = params.has('v');
        if (guia.volta) { guia.etapa = 2; guia.peloCanal = false; }
        guiaSalvar();
    }
    const vinculo = params.get('vinculo');
    if (vinculo) {
        renderGuiaVinculo(vinculo, params.get('motivo'));
        return;
    }
    renderGuia();
    guiaRegistrar('aberto');
}

// Atualizacao cadastral de quem ja e membro: so a explicacao do /aniversario.
function openAtualizar(event) {
    event?.preventDefault();
    document.getElementById('app').innerHTML = pages_content.atualizar;
}
