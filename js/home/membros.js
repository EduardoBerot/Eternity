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

let membrosEstado = { membros: [], perfis: new Map(), busca: '', servidor: 'todos', ordem: 'cargo' };

// Ordenacoes da aba (01/10/2026; o filtro por cargo saiu). A atividade sai do
// "visto por ultimo" do jogo: Online, Hoje, "1 dia", "12 dias".
const ORDENS = {
    cargo: 'Cargo',
    atividade: 'Atividade',
    tempo: 'Tempo de clã',
    liga: 'Pontos na Liga',
    nick: 'Nick (A–Z)',
};

function diasOffline(perfil) {
    const visto = String(perfil?.jogo?.visto || '').trim().toLowerCase();
    if (visto === 'online') return -1;
    if (visto === 'hoje') return 0;
    const dias = visto.match(/^(\d+)\s*dias?$/);
    return dias ? Number(dias[1]) : Infinity;
}

function perfilDe(membro) {
    return membrosEstado.perfis.get(String(membro.nick).toLowerCase());
}

function porCargo(a, b) {
    return nivelCargo(b.cargo) - nivelCargo(a.cargo) || String(a.data_entrada || '').localeCompare(String(b.data_entrada || ''));
}

function compararMembros(a, b) {
    switch (membrosEstado.ordem) {
        case 'atividade': return diasOffline(perfilDe(a)) - diasOffline(perfilDe(b)) || porCargo(a, b);
        case 'tempo': return String(a.data_entrada || '9999').localeCompare(String(b.data_entrada || '9999')) || porCargo(a, b);
        case 'liga': return (perfilDe(b)?.liga?.pontos ?? -1) - (perfilDe(a)?.liga?.pontos ?? -1) || porCargo(a, b);
        // O `*` de alguns nicks do servidor nao conta na ordem alfabetica.
        case 'nick': return String(a.nick).replace(/^\*+/, '').localeCompare(String(b.nick).replace(/^\*+/, ''), 'pt-BR', { sensitivity: 'base' });
        default: return porCargo(a, b);
    }
}

// Linha de baixo do card: o dado da ordenacao escolhida, quando ela nao e o
// tempo de cla de sempre.
function detalheCard(membro, perfil) {
    if (membrosEstado.ordem === 'atividade') {
        const dias = diasOffline(perfil);
        if (dias === -1) return 'Online agora';
        if (dias === 0) return 'Visto hoje';
        return Number.isFinite(dias) ? `Visto há ${dias} dia${dias === 1 ? '' : 's'}` : 'Sem registro de atividade';
    }
    if (membrosEstado.ordem === 'liga') return `${perfil?.liga?.pontos ?? 0} pts na Liga do mês`;
    const tempo = tempoNoCla(membro.data_entrada);
    return tempo ? `No clã ${tempo}` : 'Cadastro incompleto';
}

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
                <label class="ordenar">
                    <span>Ordenar por</span>
                    <select id="membros-ordem" onchange="filtrarMembros({ ordem: this.value })">
                        ${Object.entries(ORDENS).map(([valor, rotulo]) => `<option value="${valor}">${rotulo}</option>`).join('')}
                    </select>
                </label>
            </div>
        </div>
        <div class="miolo">
            <section class="membros-grade" id="membros-grade">${loadingHTML}</section>
            <p class="membros-rodape">Data de entrada errada? Peça a correção com <code>/entrada</code> no nosso Discord.</p>
        </div>
        ${rodapeSite()}`;

    membrosEstado = { membros: [], perfis: new Map(), busca: '', servidor: 'todos', ordem: 'cargo' };
    try {
        const [membros, perfis] = await Promise.all([
            fetch(`${URL_BASE}/api/membros/ativos`).then(r => r.json()),
            fetch(`${URL_BASE}/api/perfis`).then(r => (r.ok ? r.json() : [])).catch(() => []),
        ]);
        membrosEstado.membros = semContasDoCla(membros);
        membrosEstado.perfis = new Map((Array.isArray(perfis) ? perfis : []).map(p => [String(p.nick).toLowerCase(), p]));
    } catch (error) {
        console.error(error);
        document.getElementById('membros-grade').innerHTML = '<p class="vazio">Não consegui carregar os membros agora. Tente de novo em instantes.</p>';
        return;
    }
    desenharFiltros();
    desenharMembros();
    // Botao "Ver no site" do /perfil do Discord: #membros?membro=Fulano ja abre
    // a janela da pessoa.
    const pedido = new URLSearchParams(location.hash.split('?')[1] || '').get('membro');
    if (pedido) abrirMembro(pedido);
}

function desenharFiltros() {
    const chip = (grupo, valor, rotulo) =>
        `<button type="button" class="chip ${membrosEstado[grupo] === valor ? 'ativo' : ''}" aria-pressed="${membrosEstado[grupo] === valor}"
            onclick="filtrarMembros({ ${grupo}: '${valor}' })">${escHtml(rotulo)}</button>`;
    document.getElementById('membros-servidores').innerHTML = [
        chip('servidor', 'todos', 'Todos os servidores'),
        chip('servidor', 'apocalipse', 'Apocalipse'),
        chip('servidor', 'genesis', 'Gênesis'),
    ].join('');
}

function filtrarMembros(mudanca) {
    Object.assign(membrosEstado, mudanca);
    if ('servidor' in mudanca) desenharFiltros();
    desenharMembros();
}

function membrosVisiveis() {
    const busca = membrosEstado.busca.trim().toLowerCase();
    return membrosEstado.membros.filter(m => {
        if (busca && !String(m.nick).toLowerCase().includes(busca)) return false;
        if (membrosEstado.servidor !== 'todos' && !servidoresDe(m).includes(membrosEstado.servidor)) return false;
        return true;
    }).sort(compararMembros);
}

function desenharMembros() {
    const lista = membrosVisiveis();
    const total = membrosEstado.membros.length;
    document.getElementById('membros-contagem').textContent =
        lista.length === total ? `${total} membros` : `${lista.length} de ${total} membros`;
    const grade = document.getElementById('membros-grade');
    if (!lista.length) {
        grade.innerHTML = '<p class="vazio">Nenhum membro encontrado com essa busca.</p>';
        return;
    }
    grade.innerHTML = lista.map(m => {
        const perfil = perfilDe(m);
        const online = perfil?.jogo?.visto === 'Online';
        return `
        <button type="button" class="card-staff ${escHtml(classeCargo(m.cargo))}" onclick="abrirMembro('${escHtml(m.nick)}')" aria-label="Ver perfil de ${escHtml(m.nick)}">
            ${online ? '<span class="card-online" title="Online agora"></span>' : ''}
            <img width="96" height="96" loading="lazy" src="https://mc-heads.net/head/${encodeURIComponent(m.nick)}" alt="">
            <span class="card-nick">${escHtml(m.nick)}</span>
            <span class="card-cargo">${escHtml(m.cargo || 'Membro')}</span>
            <em>${escHtml(detalheCard(m, perfil))}</em>
        </button>`;
    }).join('');
}

function linhaInfo(rotulo, valor) {
    return valor ? `<div class="info-linha"><span>${rotulo}</span><strong>${valor}</strong></div>` : '';
}

function linhaPodios(podios) {
    return `<div class="info-linha"><span>Pódios</span><strong class="podios">🥇 ${escHtml(podios?.ouro ?? 0)} &nbsp; 🥈 ${escHtml(podios?.prata ?? 0)} &nbsp; 🥉 ${escHtml(podios?.bronze ?? 0)}</strong></div>`;
}

// Mes corrente do perfil antigo (sem `ligaMeses`).
function conteudoLiga(liga) {
    return `${linhaInfo('Pontos', escHtml(liga.pontos))}
        ${linhaInfo('Posição', liga.posicao ? `${escHtml(liga.posicao)}º de ${escHtml(liga.participantes)}` : 'Sem pontos ainda')}
        ${linhaPodios(liga.podios)}
        ${linhaInfo('Domínio', liga.dominio ? `🔥 ${escHtml(liga.dominio)} dia(s) seguidos` : '')}
        ${linhaInfo('Desafios completos', liga.desafios ? `${escHtml(liga.desafios)} dia(s)` : '')}`;
}

// Um mes de `ligaMeses`. O Dominio e uma sequencia ao vivo: so faz sentido no
// mes corrente (o primeiro da lista).
function conteudoLigaMes(perfil, indice) {
    const mes = perfil.ligaMeses?.[indice];
    if (!mes) return '<p class="info-vazio">Sem dados da Liga.</p>';
    const dominio = indice === 0 ? perfil.liga?.dominio : 0;
    return `${linhaInfo('Pontos', escHtml(mes.pontos))}
        ${linhaInfo('Posição', mes.posicao ? `${escHtml(mes.posicao)}º de ${escHtml(mes.participantes)}` : 'Sem pontos no mês')}
        ${linhaPodios(mes.podios)}
        ${linhaInfo('Domínio', dominio ? `🔥 ${escHtml(dominio)} dia(s) seguidos` : '')}
        ${linhaInfo('Desafios completos', mes.desafios ? `${escHtml(mes.desafios)} dia(s)` : '')}`;
}

function trocarMesLiga(indice) {
    const alvo = document.getElementById('liga-conteudo');
    if (alvo && membrosEstado.aberto) alvo.innerHTML = conteudoLigaMes(membrosEstado.aberto, Number(indice));
}

// Titulos conquistados (09/10/2026), como aparecem no jogo, do mais alto para o
// mais baixo; o que a pessoa usa agora vem primeiro e marcado. Faixa fina
// entre o topo e os blocos: a janela continua sem rolagem.
function faixaTitulos(titulos) {
    const lista = (Array.isArray(titulos) ? titulos : [])
        .map(titulo => ({ ...titulo, info: TITULOS_POR_NOME.get(titulo.nome) }))
        .filter(titulo => titulo.info)
        .sort((a, b) => Number(Boolean(b.atual)) - Number(Boolean(a.atual)) || b.info.nivel - a.info.nivel);
    if (!lista.length) return '';
    return `
        <div class="dialogo-titulos" aria-label="Títulos conquistados">
            <span class="dialogo-titulos-rotulo"><i class="fa-solid fa-award" aria-hidden="true"></i> Títulos</span>
            ${lista.map(titulo => `<span class="titulo-chip" title="${titulo.atual ? 'Usando agora' : 'Conquistado'}">${tituloHtml(titulo.nome, titulo.info, { atual: titulo.atual })}</span>`).join('')}
        </div>`;
}

function abrirMembro(pedido) {
    const membro = membrosEstado.membros.find(m => m.nick === pedido)
        || membrosEstado.membros.find(m => String(m.nick).toLowerCase() === String(pedido).toLowerCase());
    if (!membro) return;
    const nick = membro.nick;
    const perfil = membrosEstado.perfis.get(String(nick).toLowerCase()) || {};
    const dialogo = document.getElementById('membro-dialog');
    const tempo = tempoNoCla(membro.data_entrada);
    const entrada = dataBr(membro.data_entrada);
    const servidores = servidoresDe(membro).map(s => SERVIDORES[s] || s).join(' e ');
    const jogo = perfil.jogo || {};
    const online = jogo.visto === 'Online';

    // Discord e banco viraram linhas do bloco "No clã" (01/10/2026): em blocos
    // proprios ocupavam espaco demais e a janela ganhava rolagem.
    // Com o id (snowflake, validado na API) a linha abre o perfil no Discord.
    const discordId = /^\d{17,20}$/.test(String(perfil.discord?.id || '')) ? perfil.discord.id : null;
    const conteudoDiscord = perfil.discord
        ? `${perfil.discord.avatar ? `<img src="${escHtml(perfil.discord.avatar)}" alt="" width="20" height="20">` : ''}${escHtml(perfil.discord.nome || nick)}`
        : '';
    const linhaDiscord = !perfil.discord
        ? linhaInfo('Discord', '<small>Não vinculado</small>')
        : linhaInfo('Discord', discordId
            ? `<a class="discord-chip discord-link" href="https://discord.com/users/${discordId}" target="_blank" rel="noopener noreferrer" title="Abrir perfil no Discord">${conteudoDiscord} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
            : `<span class="discord-chip">${conteudoDiscord}</span>`);

    // Liga com seletor de mes (01/10/2026): `ligaMeses` traz todos os meses
    // guardados, do mais recente ao mais antigo. Perfil antigo, sem a lista, so
    // tem o mes corrente.
    const liga = perfil.liga;
    const meses = Array.isArray(perfil.ligaMeses) && perfil.ligaMeses.length ? perfil.ligaMeses : null;
    membrosEstado.aberto = perfil;
    const cabecalhoLiga = meses && meses.length > 1
        ? `<select class="mes-liga" aria-label="Mês da Liga" onchange="trocarMesLiga(this.value)">
               ${meses.map((mes, i) => `<option value="${i}">${escHtml(mes.rotulo || `${mes.mes}/${mes.ano}`)}</option>`).join('')}
           </select>`
        : `<span class="mes-liga-fixo">${escHtml(meses?.[0]?.rotulo || liga?.mes || '')}</span>`;
    const blocoLiga = meses ? conteudoLigaMes(perfil, 0) : liga ? conteudoLiga(liga) : '<p class="info-vazio">Sem dados da Liga.</p>';

    const eventos = perfil.eventos;
    const blocoEventos = eventos?.lista?.length
        ? `${linhaInfo('Total de vitórias', escHtml(eventos.total))}
           <ul class="eventos-lista">
               ${eventos.lista.map(item => `
                   <li class="${item.semanal ? 'evento-semanal' : ''}" title="${item.ultimo ? `Última vitória em ${escHtml(dataBr(item.ultimo))}` : ''}">
                       <span>${escHtml(item.nome)}</span><strong>×${escHtml(item.vezes)}</strong>
                   </li>`).join('')}
           </ul>`
        : '<p class="info-vazio">Nenhum evento vencido ainda.</p>';

    const banco = perfil.banco;
    const valorBanco = Number(banco?.total) || 0;
    const linhaBanco = linhaInfo('Banco do clã', valorBanco
        ? `<span title="$ ${escHtml(valorBanco.toLocaleString('pt-BR'))}">$ ${escHtml(new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 2 }).format(valorBanco))}</span>${banco.posicao ? ` <small>(${escHtml(banco.posicao)}º de ${escHtml(banco.apoiadores)})</small>` : ''}`
        : '<small>Sem depósitos</small>');

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
        ${faixaTitulos(perfil.titulos)}
        <div class="dialogo-grade">
            <section class="info-bloco">
                <h3><i class="fa-solid fa-shield-halved"></i> No clã</h3>
                ${linhaInfo('Clã', escHtml(jogo.cla || membro.clan_origem || ''))}
                ${linhaInfo('Servidor', escHtml(servidores))}
                ${linhaInfo('Tempo de clã', tempo ? `<span title="${entrada ? `Desde ${escHtml(entrada)}` : ''}">${escHtml(tempo)}</span>` : 'Cadastro incompleto')}
                ${linhaInfo('Recrutador', escHtml(membro.recrutador || ''))}
                ${linhaDiscord}
                ${linhaBanco}
            </section>
            <section class="info-bloco">
                <h3><i class="fa-solid fa-trophy"></i> Liga ${cabecalhoLiga}</h3>
                <div id="liga-conteudo">${blocoLiga}</div>
            </section>
            <section class="info-bloco info-bloco-largo">
                <h3><i class="fa-solid fa-medal"></i> Eventos vencidos <small>desde agosto de 2026</small></h3>
                ${blocoEventos}
            </section>
        </div>`;
    dialogo.showModal();
}

function fecharMembro() {
    document.getElementById('membro-dialog')?.close();
}

// Veio do link do Discord: fechou (botao, fundo ou Esc), o endereco volta a ser
// so a pagina. replaceState nao dispara o hashchange.
document.getElementById('membro-dialog')?.addEventListener('close', () => {
    if (location.hash.includes('?membro=')) history.replaceState(null, '', '#membros');
});

// Clique no fundo escurecido fecha: o alvo do clique e o proprio <dialog>, e
// nao algo dentro dele. Esc ja fecha sozinho (comportamento nativo).
document.getElementById('membro-dialog')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) fecharMembro();
});
