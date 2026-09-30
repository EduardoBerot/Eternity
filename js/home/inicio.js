// Inicio: a marca sobre a cidade de verdade, o IP para entrar, a cidade, quem
// lidera e a chamada para o recrutamento (redesign de 29/09/2026).

const SERVIDOR_IP = 'armamc.com';
// API publica de status de servidor Minecraft, com CORS aberto. Se ela cair, a
// barra mostra so o IP -- o resto da pagina nao depende dela.
const URL_STATUS_SERVIDOR = `https://api.mcsrvstat.us/3/${SERVIDOR_IP}`;

function renderInicio() {
    app.innerHTML = `
        <section class="hero">
            <div class="miolo">
                <h1 class="hero-marca">Eternity</h1>
                <p class="hero-lema">Uni-vos pela Eternidade.</p>
                <p class="texto">Um clã da rede Armageddon desde 2020, com cidade própria, farms coletivas, torneios e uma liga mensal entre os membros.</p>
                <div class="hero-acoes">
                    <a class="botao botao-principal" href="#guia"><i class="fa-solid fa-user-plus"></i> Quero entrar</a>
                    <a class="botao" href="#membros"><i class="fa-solid fa-users"></i> Ver os membros</a>
                </div>
                <div class="ip-barra">
                    <span class="ip-status" id="servidor-status"><span class="ponto"></span> Consultando o servidor…</span>
                    <span class="ip-endereco">${SERVIDOR_IP}</span>
                    <button type="button" class="ip-copiar" onclick="copiarIp(this)"><i class="fa-regular fa-copy"></i> Copiar IP</button>
                </div>
            </div>
            <div class="hero-rodape">
                <div class="miolo fatos">
                    <span><strong id="inicio-membros">—</strong> membros</span>
                    <span><strong>01/08/2020</strong> fundação</span>
                    <span><strong>Terceira Era</strong> atual</span>
                    <span><strong>Aberto</strong> recrutamento</span>
                </div>
            </div>
        </section>

        <section class="faixa">
            <div class="miolo duas-colunas">
                <div>
                    <h2>Uma cidade construída a várias mãos</h2>
                    <p class="texto">Desde 2020, a Eternity une jogadores para construir, explorar e crescer juntos. A cidade é o coração do clã: casas e terrenos são gratuitos, e as farms coletivas garantem recursos para todos.</p>
                    <p class="texto">Nossos valores são <b>união, justiça e honestidade</b>. Quem está começando encontra ajuda aqui.</p>
                    <a class="link-seta" href="#cidade">Ver a galeria da cidade <i class="fa-solid fa-arrow-right"></i></a>
                </div>
                <div class="mosaico">
                    <a href="#cidade"><img src="imgs/City00.jpg" alt="Vista da cidade da Eternity" loading="lazy"></a>
                    <a href="#cidade"><img src="imgs/City03.jpg" alt="Construção da cidade" loading="lazy"></a>
                    <a href="#cidade"><img src="imgs/City05.jpg" alt="Rua da cidade" loading="lazy"></a>
                </div>
            </div>
        </section>

        <section class="faixa faixa-escura">
            <div class="miolo">
                <h2>Quem lidera</h2>
                <p class="texto">A staff cuida da cidade, do recrutamento e dos eventos de PvP. Veja o papel de cada cargo na Wiki.</p>
                <div class="lideres" id="inicio-lideres">${loadingHTML}</div>
                <a class="link-seta" href="#wiki">Conhecer a hierarquia <i class="fa-solid fa-arrow-right"></i></a>
            </div>
        </section>

        <section class="chamada">
            <div class="miolo">
                <div>
                    <h2>Pronto para entrar?</h2>
                    <p class="texto">Assista ao vídeo, faça o teste de três perguntas e vincule seu Discord. O convite chega no jogo.</p>
                </div>
                <a class="botao botao-principal" href="#guia"><i class="fa-solid fa-user-plus"></i> Começar o recrutamento</a>
            </div>
        </section>

        ${rodapeSite()}`;
    carregarMembrosInicio();
    carregarStatusServidor();
}

function rodapeSite() {
    return `
        <footer class="rodape">
            <div class="miolo">
                <span class="brand">Eternity</span>
                <span>Clã da rede Armageddon, desde 01/08/2020.</span>
            </div>
        </footer>`;
}

async function carregarMembrosInicio() {
    try {
        const membros = await (await fetch(`${URL_BASE}/api/membros/ativos`)).json();
        if (!Array.isArray(membros)) return;
        const total = document.getElementById('inicio-membros');
        if (total) total.textContent = membros.length;
        const lideres = document.getElementById('inicio-lideres');
        if (!lideres) return;
        const staff = membros
            .filter(m => nivelCargo(m.cargo) > 1)
            .sort((a, b) => nivelCargo(b.cargo) - nivelCargo(a.cargo));
        lideres.innerHTML = staff.map(m => `
            <a class="lider ${escHtml(classeCargo(m.cargo))}" href="#membros" title="${escHtml(m.nick)}, ${escHtml(m.cargo)}">
                <img src="https://mc-heads.net/avatar/${encodeURIComponent(m.nick)}/64" alt="" loading="lazy">
                <span class="lider-nick">${escHtml(m.nick)}</span>
                <span class="lider-cargo">${escHtml(m.cargo)}</span>
            </a>`).join('') || '<p class="texto">A lista da staff não carregou.</p>';
    } catch (_) {
        const lideres = document.getElementById('inicio-lideres');
        if (lideres) lideres.innerHTML = '<p class="texto">A lista da staff não carregou. Tente de novo em instantes.</p>';
    }
}

async function carregarStatusServidor() {
    const status = document.getElementById('servidor-status');
    try {
        const dados = await (await fetch(URL_STATUS_SERVIDOR)).json();
        if (!status) return;
        if (dados?.online) {
            const on = dados.players?.online;
            const max = dados.players?.max;
            const jogadores = Number.isFinite(on) ? ` · ${on}${Number.isFinite(max) ? `/${max}` : ''} jogando` : '';
            status.innerHTML = `<span class="ponto vivo"></span> Online${jogadores}`;
        } else {
            status.innerHTML = '<span class="ponto"></span> Servidor offline';
        }
    } catch (_) {
        if (status) status.innerHTML = '<span class="ponto"></span> Servidor';
    }
}

async function copiarIp(botao) {
    try {
        await navigator.clipboard.writeText(SERVIDOR_IP);
        botao.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
        setTimeout(() => { botao.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar IP'; }, 1600);
    } catch (_) { /* sem clipboard: o IP continua na tela */ }
}
