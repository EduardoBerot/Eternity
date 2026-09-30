// Membros: busca, filtros e cards clicaveis. O card abre uma janela com o que o
// site sabe (cargo, servidor, tempo de cla) e com o perfil publico que o bot do
// Discord publica em /api/perfis: Discord, tag e ultima vez visto no jogo, Liga
// do mes e banco do cla. Sem o perfil (bot fora, membro novo), a janela so
// mostra os dados do site.

const HIERARQUIA = {
    Fundador: 99, Dono: 90, Heika: 80, Coordenador: 70, Sohei: 60, Supervisor: 50,
    Ikko: 45, Auxiliar: 40, Daimyo: 30, 'Estagiário': 20, Admin: 10, Membro: 1,
};

const SERVIDORES = { apocalipse: 'Apocalipse', genesis: 'Gênesis' };

let membrosEstado = { membros: [], perfis: new Map(), busca: '', cargo: 'todos', servidor: 'todos' };

function nivelCargo(cargo) {
    return HIERARQUIA[cargo] ?? 0;
}

function classeCargo(cargo) {
    return String(cargo || 'membro').toLowerCase();
}

function servidoresDe(membro) {
    return String(membro?.servidor || 'apocalipse').split(',').map(item => item.trim()).filter(Boolean);
}

// "há 2 anos e 3 meses" a partir da data de entrada do cadastro.
function tempoNoCla(dataEntrada) {
    const inicio = new Date(dataEntrada);
    if (!dataEntrada || Number.isNaN(inicio.getTime())) return null;
    const hoje = new Date();
    let meses = (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth());
    if (hoje.getDate() < inicio.getDate()) meses -= 1;
    if (meses < 1) {
        const dias = Math.max(0, Math.floor((hoje - inicio) / 86_400_000));
        return dias === 0 ? 'desde hoje' : `há ${dias} dia${dias === 1 ? '' : 's'}`;
    }
    const anos = Math.floor(meses / 12);
    const resto = meses % 12;
    const partes = [];
    if (anos) partes.push(`${anos} ano${anos === 1 ? '' : 's'}`);
    if (resto) partes.push(`${resto} ${resto === 1 ? 'mês' : 'meses'}`);
    return `há ${partes.join(' e ')}`;
}

function dataBr(valor) {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

async function renderMembros() {
    app.innerHTML = `
        <header class="cabeca-pagina">
            <div class="miolo cabeca-linha">
                <div>
                    <h1>Membros</h1>
                    <p class="texto">Quem faz parte da Eternity hoje. Clique em alguém para ver o perfil.</p>
                </div>
                <span class="contagem" id="membros-contagem"></span>
            </div>
        </header>
        <div class="membros-controles">
            <div class="miolo">
                <div class="busca">
                    <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                    <input type="search" id="membros-busca" placeholder="Pesquisar por nick" aria-label="Pesquisar por nick" oninput="filtrarMembros({ busca: this.value })">
                </div>
                <div class="chips" id="membros-servidores" role="group" aria-label="Filtrar por servidor"></div>
                <div class="chips" id="membros-cargos" role="group" aria-label="Filtrar por cargo"></div>
            </div>
        </div>
        <div class="miolo">
            <section class="membros-grade" id="membros-grade">${loadingHTML}</section>
            <p class="membros-rodape">Data de entrada errada? Peça a correção com <code>/entrada</code> no nosso Discord.</p>
        </div>
        ${rodapeSite()}`;

    membrosEstado = { membros: [], perfis: new Map(), busca: '', cargo: 'todos', servidor: 'todos' };
    try {
        const [membros, perfis] = await Promise.all([
            fetch(`${URL_BASE}/api/membros/ativos`).then(r => r.json()),
            fetch(`${URL_BASE}/api/perfis`).then(r => (r.ok ? r.json() : [])).catch(() => []),
        ]);
        membrosEstado.membros = (Array.isArray(membros) ? membros : []).sort((a, b) =>
            nivelCargo(b.cargo) - nivelCargo(a.cargo)
            || String(a.data_entrada || '').localeCompare(String(b.data_entrada || '')));
        membrosEstado.perfis = new Map((Array.isArray(perfis) ? perfis : []).map(p => [String(p.nick).toLowerCase(), p]));
    } catch (error) {
        console.error(error);
        document.getElementById('membros-grade').innerHTML = '<p class="vazio">Não consegui carregar os membros agora. Tente de novo em instantes.</p>';
        return;
    }
    desenharFiltros();
    desenharMembros();
}

function desenharFiltros() {
    const cargos = [...new Set(membrosEstado.membros.map(m => m.cargo).filter(Boolean))]
        .sort((a, b) => nivelCargo(b) - nivelCargo(a));
    const chip = (grupo, valor, rotulo, extra = '') =>
        `<button type="button" class="chip ${extra} ${membrosEstado[grupo] === valor ? 'ativo' : ''}" aria-pressed="${membrosEstado[grupo] === valor}"
            onclick="filtrarMembros({ ${grupo}: '${valor}' })">${escHtml(rotulo)}</button>`;
    document.getElementById('membros-cargos').innerHTML = [
        chip('cargo', 'todos', 'Todos'),
        chip('cargo', 'staff', 'Staff'),
        ...cargos.map(cargo => chip('cargo', cargo, cargo, `cargo-${classeCargo(cargo)}`)),
    ].join('');
    document.getElementById('membros-servidores').innerHTML = [
        chip('servidor', 'todos', 'Todos os servidores'),
        chip('servidor', 'apocalipse', 'Apocalipse'),
        chip('servidor', 'genesis', 'Gênesis'),
    ].join('');
}

function filtrarMembros(mudanca) {
    Object.assign(membrosEstado, mudanca);
    if (!('busca' in mudanca)) desenharFiltros();
    desenharMembros();
}

function membrosVisiveis() {
    const busca = membrosEstado.busca.trim().toLowerCase();
    return membrosEstado.membros.filter(m => {
        if (busca && !String(m.nick).toLowerCase().includes(busca)) return false;
        if (membrosEstado.cargo === 'staff' && nivelCargo(m.cargo) <= 1) return false;
        if (!['todos', 'staff'].includes(membrosEstado.cargo) && m.cargo !== membrosEstado.cargo) return false;
        if (membrosEstado.servidor !== 'todos' && !servidoresDe(m).includes(membrosEstado.servidor)) return false;
        return true;
    });
}

function desenharMembros() {
    const lista = membrosVisiveis();
    const total = membrosEstado.membros.length;
    document.getElementById('membros-contagem').textContent =
        lista.length === total ? `${total} membros` : `${lista.length} de ${total} membros`;
    const grade = document.getElementById('membros-grade');
    if (!lista.length) {
        grade.innerHTML = '<p class="vazio">Nenhum membro encontrado com esses filtros.</p>';
        return;
    }
    grade.innerHTML = lista.map(m => {
        const tempo = tempoNoCla(m.data_entrada);
        const perfil = membrosEstado.perfis.get(String(m.nick).toLowerCase());
        const online = perfil?.jogo?.visto === 'Online';
        return `
        <button type="button" class="card-staff ${escHtml(classeCargo(m.cargo))}" onclick="abrirMembro('${escHtml(m.nick)}')" aria-label="Ver perfil de ${escHtml(m.nick)}">
            ${online ? '<span class="card-online" title="Online agora"></span>' : ''}
            <img width="96" height="96" loading="lazy" src="https://mc-heads.net/head/${encodeURIComponent(m.nick)}" alt="">
            <span class="card-nick">${escHtml(m.nick)}</span>
            <span class="card-cargo">${escHtml(m.cargo || 'Membro')}</span>
            <em>${tempo ? `No clã ${escHtml(tempo)}` : 'Cadastro incompleto'}</em>
        </button>`;
    }).join('');
}

function linhaInfo(rotulo, valor) {
    return valor ? `<div class="info-linha"><span>${rotulo}</span><strong>${valor}</strong></div>` : '';
}

function abrirMembro(nick) {
    const membro = membrosEstado.membros.find(m => m.nick === nick);
    if (!membro) return;
    const perfil = membrosEstado.perfis.get(String(nick).toLowerCase()) || {};
    const dialogo = document.getElementById('membro-dialog');
    const tempo = tempoNoCla(membro.data_entrada);
    const entrada = dataBr(membro.data_entrada);
    const servidores = servidoresDe(membro).map(s => SERVIDORES[s] || s).join(' e ');
    const jogo = perfil.jogo || {};
    const online = jogo.visto === 'Online';

    // Com o id (snowflake, validado na API) a linha abre o perfil no Discord.
    const discordId = /^\d{17,20}$/.test(String(perfil.discord?.id || '')) ? perfil.discord.id : null;
    const conteudoDiscord = perfil.discord
        ? `${perfil.discord.avatar ? `<img src="${escHtml(perfil.discord.avatar)}" alt="" width="40" height="40">` : ''}
           <strong>${escHtml(perfil.discord.nome || nick)}</strong>`
        : '';
    const blocoDiscord = !perfil.discord
        ? '<p class="info-vazio">Sem Discord vinculado.</p>'
        : discordId
            ? `<a class="discord-linha discord-link" href="https://discord.com/users/${discordId}" target="_blank" rel="noopener noreferrer" title="Abrir perfil no Discord">
                   ${conteudoDiscord}
                   <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
               </a>`
            : `<div class="discord-linha">${conteudoDiscord}</div>`;

    const liga = perfil.liga;
    const blocoLiga = liga
        ? `${linhaInfo('Pontos', escHtml(liga.pontos))}
           ${linhaInfo('Posição', liga.posicao ? `${escHtml(liga.posicao)}º de ${escHtml(liga.participantes)}` : 'Sem pontos ainda')}
           <div class="info-linha"><span>Pódios</span><strong class="podios">🥇 ${escHtml(liga.podios?.ouro ?? 0)} &nbsp; 🥈 ${escHtml(liga.podios?.prata ?? 0)} &nbsp; 🥉 ${escHtml(liga.podios?.bronze ?? 0)}</strong></div>
           ${linhaInfo('Domínio', liga.dominio ? `🔥 ${escHtml(liga.dominio)} dia(s) seguidos` : '')}
           ${linhaInfo('Desafios completos', liga.desafios ? `${escHtml(liga.desafios)} dia(s)` : '')}`
        : '<p class="info-vazio">Sem dados da Liga.</p>';

    const banco = perfil.banco;
    const blocoBanco = banco && banco.total
        ? `${linhaInfo('Total depositado', `$ ${escHtml(Number(banco.total).toLocaleString('pt-BR'))}`)}
           ${linhaInfo('Posição', banco.posicao ? `${escHtml(banco.posicao)}º de ${escHtml(banco.apoiadores)} apoiadores` : '')}`
        : '<p class="info-vazio">Nenhum depósito registrado.</p>';

    dialogo.innerHTML = `
        <div class="dialogo-topo card-staff-borda ${escHtml(classeCargo(membro.cargo))}">
            <img class="dialogo-skin" src="https://mc-heads.net/body/${encodeURIComponent(nick)}/110" alt="Skin de ${escHtml(nick)}" width="55" height="110">
            <div class="dialogo-titulo">
                <h2 id="membro-dialog-nick">${escHtml(nick)}</h2>
                <div class="dialogo-selos">
                    <span class="selo cargo-${escHtml(classeCargo(membro.cargo))}">${escHtml(membro.cargo || 'Membro')}</span>
                    ${jogo.tag && jogo.tag !== membro.cargo ? `<span class="selo selo-tag">${escHtml(jogo.tag)}</span>` : ''}
                    ${jogo.visto ? `<span class="selo ${online ? 'selo-online' : ''}"><span class="ponto"></span> ${online ? 'Online' : `Visto: ${escHtml(jogo.visto)}`}</span>` : ''}
                </div>
            </div>
            <button type="button" class="dialogo-fechar" onclick="fecharMembro()" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="dialogo-grade">
            <section class="info-bloco">
                <h3><i class="fa-solid fa-shield-halved"></i> No clã</h3>
                ${linhaInfo('Clã', escHtml(jogo.cla || membro.clan_origem || ''))}
                ${linhaInfo('Servidor', escHtml(servidores))}
                ${linhaInfo('Tempo de clã', tempo ? `${escHtml(tempo)}${entrada ? ` <small>(desde ${escHtml(entrada)})</small>` : ''}` : 'Cadastro incompleto')}
                ${linhaInfo('Recrutador', escHtml(membro.recrutador || ''))}
            </section>
            <section class="info-bloco">
                <h3><i class="fa-brands fa-discord"></i> Discord</h3>
                ${blocoDiscord}
            </section>
            <section class="info-bloco">
                <h3><i class="fa-solid fa-trophy"></i> Liga${liga?.mes ? ` de ${escHtml(liga.mes)}` : ''}</h3>
                ${blocoLiga}
            </section>
            <section class="info-bloco">
                <h3><i class="fa-solid fa-building-columns"></i> Banco do clã</h3>
                ${blocoBanco}
            </section>
        </div>`;
    dialogo.showModal();
}

function fecharMembro() {
    document.getElementById('membro-dialog')?.close();
}

// Clique no fundo escurecido fecha: o alvo do clique e o proprio <dialog>, e
// nao algo dentro dele. Esc ja fecha sozinho (comportamento nativo).
document.getElementById('membro-dialog')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) fecharMembro();
});
