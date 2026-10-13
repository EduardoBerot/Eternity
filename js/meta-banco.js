// Meta semanal do banco do cla (13/10/2026), na pagina inicial e no painel.
//
// O bot calcula a semana (bank-goal.js no harley) e publica o pacote pronto em
// /api/banco/meta; aqui so se desenha. Enquanto o Fundador nao divulga a meta,
// a API so responde ao lider logado -- para todo o resto ela devolve 404 e a
// secao da pagina inicial continua escondida.
//
// Os degraus vem do pacote (hoje 2,5kk -> 50%, 5kk -> 75%, 7,5kk -> 100%),
// entao mudar a regra no bot muda a barra sem mexer no site.

const URL_META_BANCO = `${URL_BASE}/api/banco/meta`;
const MB_ATUALIZAR_MS = 5 * 60_000;
const mbSemMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

function mbEsc(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const mbMoeda = valor => `¢ ${Math.round(valor).toLocaleString('pt-BR')}`;
const mbPct = taxa => `${Math.round(taxa * 100)}%`;

function mbCompacto(valor) {
    if (valor >= 1_000_000) return `${(valor / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}kk`;
    if (valor >= 1_000) return `${(valor / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
    return Math.round(valor).toLocaleString('pt-BR');
}

function mbData(iso) {
    // A semana e de Sao Paulo; o navegador pode estar em outro fuso.
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
}

function mbFaltaTexto(fimIso) {
    const ms = Date.parse(fimIso) - Date.now();
    if (!(ms > 0)) return 'semana encerrada';
    const min = Math.floor(ms / 60_000);
    const d = Math.floor(min / 1440);
    const h = Math.floor((min % 1440) / 60);
    const m = min % 60;
    if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h`;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
    return `${m} min`;
}

function metaBancoHTML(meta, { painel = false } = {}) {
    const degraus = meta.degraus;
    const nivel = degraus.filter(d => meta.liquido >= d.valor).length;
    const cheia = nivel === degraus.length;
    const proximo = degraus[nivel] || null;
    const progresso = Math.max(0, Math.min(1, meta.liquido / meta.meta));
    // O fim da semana e domingo 23:59; o pacote guarda a segunda 00:00.
    const ultimoDia = new Date(Date.parse(meta.semana.fim) - 60_000).toISOString();

    const marcos = degraus.map((d, i) => `
        <div class="mb-marco${i < nivel ? ' mb-alcancado' : ''}${i === nivel - 1 ? ' mb-atual' : ''}" style="--pos: ${(d.valor / meta.meta) * 100}%">
            <span class="mb-marco-taxa">${mbPct(d.taxa)}</span>
            <span class="mb-no" aria-hidden="true">${i < nivel ? '<i class="fa-solid fa-check"></i>' : ''}</span>
            <span class="mb-marco-valor">${mbCompacto(d.valor)}</span>
        </div>`).join('');

    const cartoes = [{ valor: 0, taxa: meta.taxaBase, base: true }, ...degraus].map((d, i) => {
        const alcancado = d.base || i <= nivel;
        const atual = i === nivel;
        return `
            <li class="mb-degrau${alcancado ? ' mb-alcancado' : ''}${atual ? ' mb-atual' : ''}" style="--i: ${i}">
                <span class="mb-degrau-taxa">${mbPct(d.taxa)}</span>
                <span class="mb-degrau-req">${d.base ? 'Sempre' : `${mbCompacto(d.valor)} na semana`}</span>
                ${d.extra ? `<span class="mb-degrau-extra">+ ${mbEsc(d.extra)}</span>` : ''}
                ${atual ? '<span class="mb-degrau-selo">Agora</span>' : ''}
            </li>`;
    }).join('');

    // `extra`: o evento que o degrau libera (Quiz do Clã, Copa de Duelos).
    const ultimo = degraus[degraus.length - 1];
    const chamada = cheia
        ? `<p class="mb-chamada mb-chamada-cheia"><i class="fa-solid fa-crown"></i> <span><strong>Meta cheia!</strong> Os pódios desta semana pagam <strong>${mbPct(ultimo.taxa)}</strong> de adicional${ultimo.extra ? ` e a <strong class="mb-chamada-extra">${mbEsc(ultimo.extra)}</strong> está liberada` : ''}.</span></p>`
        : `<p class="mb-chamada"><i class="fa-solid fa-arrow-trend-up"></i> <span>Faltam <strong>${mbMoeda(proximo.valor - meta.liquido)}</strong> para o adicional subir para <strong>${mbPct(proximo.taxa)}</strong>${proximo.extra ? ` e liberar o <strong class="mb-chamada-extra">${mbEsc(proximo.extra)}</strong>` : ''}.</span></p>`;

    const apoiadores = meta.apoiadores.length
        ? `<ol class="mb-apoiadores">${meta.apoiadores.map((a, i) => `
                <li style="--i: ${i}">
                    <img src="https://mc-heads.net/avatar/${encodeURIComponent(a.nick)}/40" alt="" loading="lazy" width="40" height="40">
                    <span class="mb-apoiador-nick">${mbEsc(a.nick)}</span>
                    <span class="mb-apoiador-valor">${mbCompacto(a.valor)}</span>
                </li>`).join('')}
            </ol>${meta.totalApoiadores > meta.apoiadores.length ? `<p class="mb-mais">e mais ${meta.totalApoiadores - meta.apoiadores.length}</p>` : ''}`
        : '<p class="mb-vazio"><i class="fa-solid fa-coins"></i> Ninguém depositou nesta semana ainda. O primeiro depósito começa a encher a barra.</p>';

    return `
        <article class="mb-card${cheia ? ' mb-cheia' : ''}" style="--mb-alvo: ${progresso}">
            ${painel && !meta.publico ? '<p class="mb-previa"><i class="fa-solid fa-eye-slash"></i> Prévia: a meta ainda não foi divulgada. Só líderes logados veem esta tela.</p>' : ''}
            <header class="mb-topo">
                <div class="mb-taxa-bloco">
                    <span class="mb-rotulo">Adicional dos pódios agora</span>
                    <span class="mb-taxa">${mbPct(meta.taxaAtual)}</span>
                </div>
                <div class="mb-relogio">
                    <span class="mb-rotulo"><i class="fa-regular fa-clock"></i> Fecha em</span>
                    <strong data-mb-fim="${mbEsc(meta.semana.fim)}">${mbFaltaTexto(meta.semana.fim)}</strong>
                    <small>${mbData(meta.semana.inicio)} a ${mbData(ultimoDia)}</small>
                </div>
            </header>

            <div class="mb-numeros">
                <span class="mb-valor" data-mb-contar="${Math.max(0, meta.liquido)}">${mbMoeda(Math.max(0, meta.liquido))}</span>
                <span class="mb-de">de ${mbMoeda(meta.meta)}</span>
                <span class="mb-pct">${Math.floor(progresso * 100)}%</span>
            </div>

            <div class="mb-trilha-area">
                <div class="mb-trilha" role="progressbar" aria-label="Depósitos da semana" aria-valuemin="0" aria-valuemax="${meta.meta}" aria-valuenow="${Math.max(0, meta.liquido)}" aria-valuetext="${mbMoeda(Math.max(0, meta.liquido))} de ${mbMoeda(meta.meta)}">
                    <div class="mb-preenchido"><span class="mb-brilho"></span></div>
                </div>
                ${marcos}
            </div>

            ${chamada}

            <ol class="mb-degraus">${cartoes}</ol>

            <section class="mb-bloco">
                <h3>Quem encheu a barra</h3>
                ${apoiadores}
            </section>

            <footer class="mb-regras">
                Conta o depósito <b>líquido</b> dos membros no banco do clã (<code>/clan banco depositar</code>), de segunda a domingo: sacar devolve a barra.
                O adicional vale para os pódios dos torneios da semana e é pago na segunda, junto do resultado.
            </footer>
        </article>`;
}

// Numero subindo ate o valor, e a barra enchendo, quando o card aparece na tela.
function mbAnimar(card) {
    const valor = card.querySelector('[data-mb-contar]');
    const alvo = Number(valor?.dataset.mbContar) || 0;
    if (mbSemMovimento.matches) {
        card.classList.add('mb-visivel');
        return;
    }
    const iniciar = () => {
        card.classList.add('mb-visivel');
        if (!valor || !alvo) return;
        const inicio = performance.now();
        const duracao = 1400;
        const passo = agora => {
            const t = Math.min(1, (agora - inicio) / duracao);
            const suave = 1 - Math.pow(1 - t, 3);
            valor.textContent = mbMoeda(alvo * suave);
            if (t < 1) requestAnimationFrame(passo);
        };
        valor.textContent = mbMoeda(0);
        requestAnimationFrame(passo);
    };
    if (!('IntersectionObserver' in window)) return iniciar();
    const observador = new IntersectionObserver(entradas => {
        if (!entradas.some(e => e.isIntersecting)) return;
        observador.disconnect();
        iniciar();
    }, { threshold: 0.3 });
    observador.observe(card);
}

let mbRelogio = null;
let mbRecarga = null;

function mbPararTimers() {
    clearInterval(mbRelogio);
    clearInterval(mbRecarga);
    mbRelogio = mbRecarga = null;
}

// Aba Banco do painel (so lideres). Com a meta ainda nao divulgada, e o unico
// lugar onde ela aparece.
function renderBancoPainel() {
    APP.innerHTML = `
        <div class="mb-painel">
            <h2>Meta semanal do banco</h2>
            <p class="texto">Depósitos líquidos dos membros na semana da Liga e o adicional que eles liberam nos pódios.</p>
            <div id="mb-painel-meta"><p class="texto"><span class="loading-dot">Aguarde ...</span></p></div>
        </div>`;
    const alvo = document.getElementById('mb-painel-meta');
    carregarMetaBanco(alvo, { headers: getAdminRequestHeaders(), painel: true })
        .then(ok => {
            if (!ok) alvo.innerHTML = '<p class="texto">O bot ainda não publicou a meta desta semana. Ela aparece aqui alguns minutos depois do próximo ciclo do site.</p>';
        })
        .catch(() => {
            alvo.innerHTML = '<p class="texto">A meta não carregou. Tente de novo em instantes.</p>';
        });
}

// Busca e desenha em `alvo`. Devolve false quando nao ha meta para mostrar
// (404: sem meta, ou meta ainda nao divulgada para quem nao e lider).
async function carregarMetaBanco(alvo, { headers = {}, painel = false } = {}) {
    if (!alvo) return false;
    mbPararTimers();
    const resposta = await fetch(URL_META_BANCO, { headers });
    if (resposta.status === 404) return false;
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const meta = await resposta.json();
    if (!meta?.degraus?.length) return false;
    alvo.innerHTML = metaBancoHTML(meta, { painel });
    mbAnimar(alvo.querySelector('.mb-card'));
    let atual = meta;

    mbRelogio = setInterval(() => {
        const fim = alvo.querySelector('[data-mb-fim]');
        if (!fim || !document.body.contains(fim)) return mbPararTimers();
        fim.textContent = mbFaltaTexto(fim.dataset.mbFim);
    }, 30_000);
    // O bot republica a cada ciclo do site; quem deixa a pagina aberta ve o
    // deposito novo sem recarregar.
    mbRecarga = setInterval(async () => {
        if (!document.body.contains(alvo) || document.hidden) return;
        try {
            const nova = await fetch(URL_META_BANCO, { headers });
            if (!nova.ok) return;
            const dados = await nova.json();
            if (!dados?.degraus?.length || dados.atualizadoEm === atual.atualizadoEm) return;
            atual = dados;
            alvo.innerHTML = metaBancoHTML(dados, { painel });
            alvo.querySelector('.mb-card')?.classList.add('mb-visivel');
        } catch (_) { /* tenta no proximo */ }
    }, MB_ATUALIZAR_MS);
    return true;
}
