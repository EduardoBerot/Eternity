// Inicio: hero, numeros do cla, o servidor (IP + quem esta online) e o "sobre".
// Substitui a antiga pagina "Como usar nosso site?" (29/09/2026).

const SERVIDOR_IP = 'armamc.com';
// API publica de status de servidor Minecraft, com CORS aberto. Se ela cair, o
// card mostra so o IP -- o resto da pagina nao depende dela.
const URL_STATUS_SERVIDOR = `https://api.mcsrvstat.us/3/${SERVIDOR_IP}`;

function renderInicio() {
    app.innerHTML = `
        <section class="hero">
            <p class="eyebrow">Clã da rede Armageddon · desde 2020</p>
            <h1 class="hero-titulo">Uni-vos pela Eternidade!</h1>
            <p class="hero-texto">Uma comunidade que constrói, explora e cresce junto no Minecraft. Cidade própria, farms coletivas, torneios e uma liga mensal entre os membros.</p>
            <div class="hero-acoes">
                <a class="botao botao-principal" href="#guia"><i class="fa-solid fa-user-plus"></i> Quero entrar</a>
                <a class="botao" href="#membros"><i class="fa-solid fa-users"></i> Nossos membros</a>
            </div>
        </section>

        <section class="numeros" aria-label="O clã em números">
            <div class="numero"><span class="numero-rotulo">Membros</span><strong id="inicio-membros">—</strong></div>
            <div class="numero"><span class="numero-rotulo">Fundação</span><strong>01/08/2020</strong></div>
            <div class="numero"><span class="numero-rotulo">Era atual</span><strong>Terceira Era</strong></div>
            <div class="numero"><span class="numero-rotulo">Recrutamento</span><strong class="aberto"><span class="ponto"></span> Aberto</strong></div>
        </section>

        <section class="cartao servidor">
            <div class="servidor-topo">
                <div>
                    <p class="eyebrow">Servidor oficial</p>
                    <h2>Armageddon</h2>
                </div>
                <span class="status" id="servidor-status"><span class="ponto"></span> Consultando…</span>
            </div>
            <div class="servidor-linha">
                <div>
                    <span class="numero-rotulo">IP</span>
                    <code class="servidor-ip">${SERVIDOR_IP}</code>
                </div>
                <div>
                    <span class="numero-rotulo">Jogadores</span>
                    <strong id="servidor-jogadores">—</strong>
                </div>
                <button type="button" class="botao" id="copiar-ip" onclick="copiarIp(this)"><i class="fa-regular fa-copy"></i> Copiar IP</button>
            </div>
            <p class="servidor-dica">Mundos <b>Apocalipse</b> e <b>Gênesis</b>. Na cidade: <code>/go ETY</code>.</p>
        </section>

        <section class="cartao sobre">
            <p class="eyebrow">Sobre nós</p>
            <h2>Missão, propósito e valores</h2>
            <p>Desde 2020, o Clã Eternity tem sido uma comunidade calorosa no Minecraft, unindo jogadores para construir, explorar e crescer juntos. Evoluindo ao longo dos anos, nossa visão resultou em uma cidade vibrante, o coração do servidor.</p>
            <p>Valorizamos a cooperação e o trabalho em equipe, mantendo farms comunitárias para garantir recursos compartilhados. Essa abordagem promove solidariedade e uma comunidade unida.</p>
            <p>Nossos valores — <b>união, justiça e honestidade</b> — são a base da nossa comunidade.</p>
        </section>`;
    carregarNumeroMembros();
    carregarStatusServidor();
}

async function carregarNumeroMembros() {
    try {
        const membros = await (await fetch(`${URL_BASE}/api/membros/ativos`)).json();
        const alvo = document.getElementById('inicio-membros');
        if (alvo && Array.isArray(membros)) alvo.textContent = membros.length;
    } catch (_) { /* o traco fica */ }
}

async function carregarStatusServidor() {
    const status = document.getElementById('servidor-status');
    const jogadores = document.getElementById('servidor-jogadores');
    try {
        const dados = await (await fetch(URL_STATUS_SERVIDOR)).json();
        if (!status) return;
        if (dados?.online) {
            status.className = 'status online';
            status.innerHTML = '<span class="ponto"></span> Online';
            const on = dados.players?.online;
            const max = dados.players?.max;
            jogadores.textContent = Number.isFinite(on) ? `${on}${Number.isFinite(max) ? ` / ${max}` : ''} jogadores` : '—';
        } else {
            status.className = 'status offline';
            status.innerHTML = '<span class="ponto"></span> Offline';
        }
    } catch (_) {
        if (status) {
            status.className = 'status';
            status.innerHTML = '<span class="ponto"></span> Status indisponível';
        }
    }
}

async function copiarIp(botao) {
    try {
        await navigator.clipboard.writeText(SERVIDOR_IP);
        botao.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
        setTimeout(() => { botao.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar IP'; }, 1600);
    } catch (_) { /* sem clipboard: o IP continua na tela */ }
}
