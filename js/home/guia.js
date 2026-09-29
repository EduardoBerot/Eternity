// Guia do Recruta: regras, teste, cadastro, Discord e convite num caminho so.
// Substitui as placas do /go ETY e o teste que a Eternity aplicava no chat do
// jogo (28/09/2026). O teste e sorteado e corrigido no servidor; o passe que
// ele devolve e o que libera o cadastro.

const URL_TESTE = `${URL_BASE}/api/recrutamento/teste`;
const DISCORD_URL = 'https://discord.gg/vj4eNDJqct';
const GUIA_ETAPAS = ['Regras', 'Teste', 'Cadastro', 'Discord', 'Convite'];
const GUIA_STORAGE = 'eternity-guia';

// `doJogo`: a pessoa chegou pelo link que a Eternity manda no jogo
// (?nick=Fulano#guia). Ai a conta ja esta acompanhando o recrutamento e convida
// sozinha no fim; sem o link, a pessoa precisa chamar a conta no jogo.
let guia = { etapa: 0, passe: null, nick: '', doJogo: false };

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
    return `<ol class="guia-progresso">${GUIA_ETAPAS.map((nome, i) => `
        <li class="${i < guia.etapa ? 'feita' : i === guia.etapa ? 'atual' : ''}">
            <span>${i < guia.etapa ? '✓' : i + 1}</span>${nome}
        </li>`).join('')}</ol>`;
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

function renderGuiaRegras() {
    return `
        <p class="guia-intro">Leia com atenção: o teste da próxima etapa é sobre estas regras.</p>
        ${GUIA_REGRAS}
        <label class="guia-aceite"><input type="checkbox" id="guia-li"> Li as regras e concordo em segui-las</label>
        <button class="button" id="guia-avancar" disabled onclick="guiaIr(1)">Fazer o teste</button>
        <p class="guia-rodape">Já faz parte do clã e só quer corrigir seus dados? <a href="#" onclick="openAtualizar(event)">Atualizar cadastro</a></p>`;
}

async function carregarTeste() {
    const alvo = document.getElementById('guia-teste');
    try {
        const resposta = await fetch(URL_TESTE);
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        const { token, perguntas } = await resposta.json();
        alvo.dataset.token = token;
        alvo.innerHTML = perguntas.map((p, i) => `
            <fieldset class="guia-pergunta">
                <legend>${i + 1}. ${escapeGuia(p.enunciado)}</legend>
                ${p.opcoes.map((opcao, j) => `
                    <label class="guia-opcao"><input type="radio" name="q${i}" value="${j}"> ${escapeGuia(opcao)}</label>`).join('')}
            </fieldset>`).join('') + `<button class="button" type="submit">Enviar respostas</button>`;
    } catch (error) {
        console.error(error);
        alvo.innerHTML = '<p class="guia-erro">Não consegui carregar o teste. Tente de novo em alguns segundos.</p>';
    }
}

function renderGuiaTeste() {
    setTimeout(carregarTeste);
    return `
        <p class="guia-intro">Três perguntas sobre as regras. Acerte todas para liberar o cadastro.</p>
        <form id="guia-teste" class="guia-form" onsubmit="enviarTeste(event)">${loadingHTML}</form>
        <p id="guia-msg" class="guia-msg"></p>
        <p class="guia-rodape"><a href="#" onclick="guiaIr(0); return false;">Voltar às regras</a></p>`;
}

async function enviarTeste(event) {
    event.preventDefault();
    const form = event.target;
    const total = form.querySelectorAll('fieldset').length;
    const respostas = [];
    for (let i = 0; i < total; i++) {
        const marcada = form.querySelector(`input[name="q${i}"]:checked`);
        if (!marcada) {
            document.getElementById('guia-msg').textContent = 'Responda todas as perguntas.';
            return;
        }
        respostas.push(Number(marcada.value));
    }
    try {
        const resposta = await fetch(URL_TESTE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: form.dataset.token, respostas }),
        });
        const resultado = await resposta.json();
        if (!resposta.ok) throw new Error(resultado?.message || 'Falha ao corrigir.');
        if (resultado.aprovado) {
            guia.passe = resultado.passe;
            guiaIr(2);
            return;
        }
        document.getElementById('app').innerHTML = `
            <h1>Guia do Recruta</h1>
            ${guiaProgresso()}
            <div class="guia-resultado">
                <h2>Quase lá!</h2>
                <p>Você acertou <b>${resultado.acertos} de ${resultado.total}</b>. Releia as regras com calma e tente de novo — as perguntas mudam a cada tentativa.</p>
                <button class="button" onclick="guiaIr(0)">Reler as regras</button>
            </div>`;
    } catch (error) {
        console.error(error);
        document.getElementById('guia-msg').textContent = 'Não consegui enviar. Tente de novo.';
    }
}

function renderGuiaCadastro() {
    if (!guia.passe) return renderGuiaTeste();
    return `
        <p class="guia-intro">Teste aprovado! Agora preencha sua solicitação.</p>
        <form class="guia-form" onsubmit="enviarCadastro(event)">
            <label for="nick">Seu nick no Minecraft (exatamente como no jogo)</label>
            <input type="text" id="nick" placeholder="Nick" required maxlength="16" pattern="[A-Za-z0-9_]{3,16}" value="${escapeGuia(guia.nick)}">
            <label for="data_nascimento">Data de nascimento</label>
            <input type="date" id="data_nascimento" required>
            <button class="button">Enviar solicitação</button>
        </form>
        <p id="guia-msg" class="guia-msg"></p>`;
}

async function enviarCadastro(event) {
    event.preventDefault();
    const msg = document.getElementById('guia-msg');
    const nick = document.getElementById('nick').value.trim();
    const data_nascimento = document.getElementById('data_nascimento').value;
    try {
        const ativos = await (await fetch(`${URL_BASE}/api/membros/ativos`)).json();
        if (ativos.some(m => String(m.nick || '').trim().toLowerCase() === nick.toLowerCase())) {
            msg.innerHTML = `<b>${escapeGuia(nick)}</b> já faz parte do clã. Para corrigir seus dados, use <a href="#" onclick="openAtualizar(event)">Atualizar cadastro</a>.`;
            return;
        }
        const resposta = await fetch(URL_MEMBERS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nick, data_nascimento, passe_teste: guia.passe }),
        });
        if (resposta.status === 403) {
            guia.passe = null;
            msg.textContent = 'Seu teste expirou. Faça de novo para enviar a solicitação.';
            setTimeout(() => guiaIr(1), 2500);
            return;
        }
        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => ({}));
            throw new Error(erro.message || 'Falha no envio');
        }
        guia.nick = nick;
        guia.passe = null;
        guiaIr(3);
    } catch (error) {
        console.error(error);
        msg.textContent = `Não foi possível enviar. Confira se já não existe uma solicitação para "${nick}" e tente de novo.`;
    }
}

function renderGuiaDiscord() {
    const nick = escapeGuia(guia.nick || 'SeuNick');
    return `
        <p class="guia-intro">Solicitação enviada! Todo membro precisa estar no nosso Discord, com a conta vinculada ao nick.</p>
        <ol class="guia-passos">
            <li>Entre no servidor: <a class="guia-link" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-discord"></i> Entrar no Discord</a></li>
            <li>No canal <b>#saudações</b>, clique em <b>Vincular minha conta</b> e informe o nick <b>${nick}</b>.</li>
            <li>O bot mostra um <b>código</b>. No jogo, mande em privado para a conta do clã:
                <div class="guia-comandos">
                    <div><small>Apocalipse</small><code>/m Eternity vincular CÓDIGO</code></div>
                    <div><small>Gênesis</small><code>/m Coagula1999 vincular CÓDIGO</code></div>
                </div>
            </li>
        </ol>
        <p class="guia-rodape">Não tem Discord? A conta é gratuita — crie em discord.com e volte aqui.</p>
        <button class="button" onclick="guiaIr(4)">Já vinculei</button>`;
}

function renderGuiaConvite() {
    if (guia.doJogo) {
        return `
        <div class="guia-resultado">
            <h2>Tudo pronto!</h2>
            <p>A conta do clã já está acompanhando você no jogo. Em instantes chega o <b>convite do clã</b> — <b>agora é só aceitar o convite no jogo</b>.</p>
            <p>Se estiver offline, entre no servidor: o convite sai assim que você aparecer.</p>
            <h2 class="guia-lema">Uni-vos pela Eternidade!</h2>
        </div>`;
    }
    return `
        <div class="guia-resultado">
            <h2>Última etapa!</h2>
            <p>Entre no jogo e chame a conta do clã no privado:</p>
            <div class="guia-comandos">
                <div><small>Apocalipse</small><code>/m Eternity quero entrar</code></div>
                <div><small>Gênesis</small><code>/m Coagula1999 quero entrar</code></div>
            </div>
            <p>Ela confere seu cadastro e o vínculo do Discord e manda o <b>convite do clã</b>. É só aceitar no jogo.</p>
            <h2 class="guia-lema">Uni-vos pela Eternidade!</h2>
        </div>
        <p class="guia-rodape"><a href="#" onclick="guiaRecomecar(event)">Recomeçar o guia</a></p>`;
}

function guiaRecomecar(event) {
    event?.preventDefault();
    guia = { etapa: 0, passe: null, nick: guia.doJogo ? guia.nick : '', doJogo: guia.doJogo };
    guiaSalvar();
    renderGuia();
}

const GUIA_RENDER = [renderGuiaRegras, renderGuiaTeste, renderGuiaCadastro, renderGuiaDiscord, renderGuiaConvite];

function renderGuia() {
    // Sem passe (expirou, ou a sessao foi limpa) o cadastro volta para o teste.
    if (guia.etapa === 2 && !guia.passe) guia.etapa = 1;
    const app = document.getElementById('app');
    app.innerHTML = `<h1>Guia do Recruta</h1>${guiaProgresso()}${GUIA_RENDER[guia.etapa]()}`;
    const li = document.getElementById('guia-li');
    if (li) li.addEventListener('change', () => { document.getElementById('guia-avancar').disabled = !li.checked; });
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
