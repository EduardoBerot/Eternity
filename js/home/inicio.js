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
                    <p class="texto">Desde 2020, a Eternity une jogadores para construir, explorar e crescer juntos. A cidade, no servidor <b>Apocalipse</b> (<code>/apocalipse</code>), é o coração do clã: casas e terrenos são gratuitos, e as farms coletivas garantem recursos para todos.</p>
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

        <section class="faixa">
            <div class="miolo">
                <h2>Hall</h2>
                <p class="texto">Os últimos eventos semanais e de fim de semana vencidos pela Eternity.</p>
                <div class="hall" id="inicio-hall">${loadingHTML}</div>
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
    carregarHall();
    carregarStatusServidor();
    marcaNoLogo = false;
    atualizarMarca(true);
}

// A marca do hero vira o logo da navbar com a rolagem. Desde 05/10/2026 a
// troca e de uma vez: ate LIMIAR_MARCA px a marca fica no hero; passou disso,
// ela faz a viagem inteira ate o logo numa animacao so, e o logo aparece quando
// ela chega. Voltando acima do limiar, ela faz o caminho inverso. (Antes a
// viagem acompanhava a rolagem pixel a pixel.) Tudo sai de
// offsetLeft/offsetTop, que ignoram o transform aplicado.
const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
const LIMIAR_MARCA = 80;
const DURACAO_MARCA = 550;
let quadroMarca = null;
let marcaNoLogo = false;
let fimMarca = null;

// `instantaneo`: sem animacao (pagina recem-montada, resize).
function atualizarMarca(instantaneo = false) {
    const marca = document.querySelector('.hero-marca');
    const logo = document.querySelector('.topbar .brand');
    if (!logo) return;
    if (!marca || reduzirMovimento.matches) {
        marcaNoLogo = false;
        logo.classList.remove('aguardando');
        return;
    }
    // A transform que leva a marca ate o logo, com a pagina onde ela esta agora.
    const ateOLogo = () => {
        const hero = marca.offsetParent.getBoundingClientRect();
        const alvo = logo.getBoundingClientRect();
        const centroX = hero.left + marca.offsetLeft + marca.offsetWidth / 2;
        const centroY = hero.top + marca.offsetTop + marca.offsetHeight / 2;
        const dx = alvo.left + alvo.width / 2 - centroX;
        const dy = alvo.top + alvo.height / 2 - centroY;
        return `translate(${dx}px, ${dy}px) scale(${alvo.width / marca.offsetWidth})`;
    };
    const transicao = `transform ${DURACAO_MARCA}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
    marca.style.transition = instantaneo ? 'none' : transicao;

    if (window.scrollY > LIMIAR_MARCA) {
        // Recalcula a cada rolagem: no meio da viagem a pagina ainda anda, e a
        // marca precisa terminar em cima do logo, nao onde ele estava.
        marca.style.transform = ateOLogo();
        if (!marcaNoLogo) {
            marcaNoLogo = true;
            clearTimeout(fimMarca);
            fimMarca = setTimeout(() => {
                if (!marcaNoLogo) return;
                marca.classList.add('recolhida');
                logo.classList.remove('aguardando');
            }, instantaneo ? 0 : DURACAO_MARCA);
        }
        return;
    }

    if (marcaNoLogo) {
        // Escondida, a marca ficou com a transform da ultima rolagem; parte do
        // logo de agora, senao a volta comecaria de um ponto qualquer da tela.
        marcaNoLogo = false;
        clearTimeout(fimMarca);
        marca.style.transition = 'none';
        marca.style.transform = ateOLogo();
        marca.getBoundingClientRect();
        marca.style.transition = instantaneo ? 'none' : transicao;
    }
    marca.classList.remove('recolhida');
    logo.classList.add('aguardando');
    marca.style.transform = '';
}

window.addEventListener('scroll', () => {
    if (quadroMarca) return;
    quadroMarca = requestAnimationFrame(() => {
        quadroMarca = null;
        atualizarMarca();
    });
}, { passive: true });
window.addEventListener('resize', () => atualizarMarca(true));

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
        const resposta = await (await fetch(`${URL_BASE}/api/membros/ativos`)).json();
        if (!Array.isArray(resposta)) return;
        const membros = semContasDoCla(resposta);
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

// Hall: o bot publica os ultimos eventos semanais e de fim de semana vencidos
// pelo cla (/api/hall). Evento de equipe (Duo, Trio, Guerra, Pre Guerra) vem
// creditado ao proprio cla e aparece com o escudo no lugar da cabeca.
async function carregarHall() {
    const hall = document.getElementById('inicio-hall');
    if (!hall) return;
    try {
        const eventos = await (await fetch(`${URL_BASE}/api/hall`)).json();
        if (!Array.isArray(eventos) || !eventos.length) {
            hall.innerHTML = '<p class="texto">Nenhum evento registrado ainda.</p>';
            return;
        }
        hall.innerHTML = eventos.map(evento => {
            const [, mes, dia] = String(evento.data).split('-');
            const avatar = evento.equipe
                ? '<span class="hall-escudo" aria-hidden="true"><i class="fa-solid fa-shield-halved"></i></span>'
                : `<img src="https://mc-heads.net/avatar/${encodeURIComponent(evento.vencedor)}/48" alt="" loading="lazy" width="48" height="48">`;
            return `
                <article class="hall-card${evento.semanal ? '' : ' hall-fim-de-semana'}">
                    ${avatar}
                    <div class="hall-info">
                        <span class="hall-evento">${escHtml(evento.evento)}</span>
                        <span class="hall-vencedor">${evento.equipe ? 'Clã (equipe)' : escHtml(evento.vencedor)}</span>
                    </div>
                    <div class="hall-meta">
                        <span class="hall-data">${escHtml(dia)}/${escHtml(mes)}</span>
                        ${evento.servidor === 'genesis' ? '<span class="hall-servidor">Gênesis</span>' : ''}
                    </div>
                </article>`;
        }).join('');
    } catch (_) {
        hall.innerHTML = '<p class="texto">O Hall não carregou. Tente de novo em instantes.</p>';
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
