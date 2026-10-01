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
    atualizarMarca();
}

// A marca do hero vira o logo da navbar com a rolagem: encolhe e desliza ate o
// lugar dele, e so ai o logo aparece. A distancia de rolagem e a que a marca
// levaria para subir sozinha ate a altura do logo, entao na vertical ela so
// acompanha a pagina; o que a animacao faz e o deslize para a esquerda e a
// escala. Tudo sai de offsetLeft/offsetTop, que ignoram o transform aplicado.
const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
let quadroMarca = null;

function atualizarMarca() {
    const marca = document.querySelector('.hero-marca');
    const logo = document.querySelector('.topbar .brand');
    if (!logo) return;
    if (!marca || reduzirMovimento.matches) {
        logo.classList.remove('aguardando');
        return;
    }
    const hero = marca.offsetParent.getBoundingClientRect();
    const alvo = logo.getBoundingClientRect();
    const largura = marca.offsetWidth;
    const altura = marca.offsetHeight;
    // Centro da marca onde ela estaria sem transform, na tela e com a pagina no topo.
    const centroX = hero.left + marca.offsetLeft + largura / 2;
    const centroY = hero.top + marca.offsetTop + altura / 2;
    const centroYNoTopo = centroY + window.scrollY;
    const alvoX = alvo.left + alvo.width / 2;
    const alvoY = alvo.top + alvo.height / 2;
    const percurso = Math.max(120, centroYNoTopo - alvoY);
    const p = Math.min(1, window.scrollY / percurso);

    const escala = 1 + p * (alvo.width / largura - 1);
    const dx = p * (alvoX - centroX);
    // Corrige o que a rolagem nao cobre sozinha (percurso minimo em tela baixa).
    const dy = p * (alvoY - (centroYNoTopo - percurso)) ;
    marca.style.transform = p > 0 ? `translate(${dx}px, ${dy}px) scale(${escala})` : '';

    const chegou = p >= 1;
    marca.classList.toggle('recolhida', chegou);
    logo.classList.toggle('aguardando', !chegou);
}

window.addEventListener('scroll', () => {
    if (quadroMarca) return;
    quadroMarca = requestAnimationFrame(() => {
        quadroMarca = null;
        atualizarMarca();
    });
}, { passive: true });
window.addEventListener('resize', atualizarMarca);

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
