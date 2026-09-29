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
// (?nick=Fulano#guia). Ai a conta ja esta acompanhando o recrutamento e convida
// sozinha no fim; sem o link, a pessoa precisa chamar a conta no jogo.
let guia = { etapa: 0, aprovado: false, nick: '', doJogo: false };

function guiaCarregar() {
    try {
        const salvo = JSON.parse(sessionStorage.getItem(GUIA_STORAGE) || 'null');
        if (salvo && Number.isInteger(salvo.etapa)) guia = { ...guia, ...salvo };
    } catch (_) { /* sem storage: comeca do zero */ }
}

function guiaSalvar() {
    try { sessionStorage.setItem(GUIA_STORAGE, JSON.stringify(guia)); } catch (_) { /* ignora */ }
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
            <p>Visite com <code>/go ETY</code>. Casas e terrenos são gratuitos.</p>
            <p>Vai construir? Use <b>somente estilo moderno</b>.</p>
        </section>
        <section class="guia-card">
            <h3><i class="fa-solid fa-clock"></i> Atividade</h3>
            <p><b>10 dias offline resultam em kick.</b> O trust da casa é removido depois de um mês offline, salvo aviso.</p>
            <p>O status de <b>confiável</b> depende da análise dos líderes e é exigido nas áreas coletivas.</p>
        </section>
        <section class="guia-card">
            <h3><i class="fa-solid fa-khanda"></i> PvP</h3>
            <p><b>Tp kill é proibido.</b></p>
            <p>Eventos de PvP são organizados pela equipe de PvP: Heika, Sohei, Ikko e Daimyo.</p>
        </section>
        <section class="guia-card">
            <h3><i class="fa-solid fa-seedling"></i> Farms e warps</h3>
            <p>Farms coletivas de batata, herbalismo e a mega farm liberam trust para quem é confiável (a mega farm pede Herbalismo 100 no mcMMO). Peça à Eternity no privado.</p>
            <p>Outros warps: <code>/go ETYShop</code>, <code>/go ETYHistoria</code>, <code>/go ETYTrofeus</code>, <code>/go ETYXp</code>, <code>/go ETYSpawners</code> e mais.</p>
        </section>
        <section class="guia-card">
            <h3><i class="fa-solid fa-crown"></i> Cargos e títulos</h3>
            <p>A cor define a hierarquia e o cargo define a função. Dono tem autonomia total; Coordenador organiza projetos; Supervisor cuida da cidade e da atividade; Auxiliar recruta e apoia novatos.</p>
            <p>Títulos vêm do mcMMO (Berserker, Paladino, Arqueiro…) e do tempo de clã (Tyrael aos 120 dias até Raziel aos 5 anos). Peça a sua tag à Eternity no jogo.</p>
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
            body: JSON.stringify({ token: form.dataset.token, respostas }),
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

function renderGuiaDiscord() {
    const nick = escapeGuia(guia.nick || 'SeuNick');
    return `
        <div class="guia-cabeca">
            <h2>Discord</h2>
            <p>Teste aprovado! Todo membro fica no nosso Discord, com a conta vinculada ao nick.</p>
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
        <!-- Quem ja tem o Discord vinculado ao nick nao refaz o vinculo: o bot
             confere no jogo e segue direto para a solicitacao e o convite. -->
        <p class="guia-links"><a href="#" onclick="guiaIr(3); return false;">Já tenho o Discord vinculado ao meu nick</a></p>`;
}

function renderGuiaConvite() {
    const lema = '<h2 class="guia-bemvindo">Seja bem-vindo à Eternity!</h2>';
    if (guia.doJogo) {
        return `
        <div class="guia-cartao guia-centro guia-final">
            <div class="guia-selo sucesso"><i class="fa-solid fa-check"></i></div>
            <h2>Tudo pronto!</h2>
            <p>A conta do clã já está acompanhando você no jogo. Em instantes chega o <b>convite do clã</b> — <b>agora é só aceitar no jogo</b>.</p>
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
            <p>Ela confere o Discord e manda o <b>convite do clã</b>. É só aceitar no jogo.</p>
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

function renderGuia() {
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
    const nick = new URLSearchParams(location.search).get('nick');
    if (nick && /^[A-Za-z0-9_]{3,16}$/.test(nick)) {
        guia.doJogo = true;
        if (!guia.nick) guia.nick = nick;
        guiaSalvar();
    }
    renderGuia();
}

// Atualizacao cadastral de quem ja e membro: o formulario antigo, sem teste.
function openAtualizar(event) {
    event?.preventDefault();
    document.getElementById('app').innerHTML = pages_content.atualizar;
    renderFormJoin('atualizar');
}
