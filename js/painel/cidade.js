// Aba Cidade (05/10/2026; refeita em 06/10/2026): o mapa da cidade da ETY com
// as casas. A staff (Supervisor ou acima) marca a casa com o botao direito
// (toque longo no celular) e a abre para ocupacao. Os membros pedem a casa no
// site publico, logados com o Discord, e um lider da o /trust no jogo e aprova
// aqui. Quando o morador sai do cla, a casa fica pendente de retirar o trust:
// o lider tira no jogo, leva os itens ao banco de itens e marca aqui.
//
// Leaflet com CRS.Simple: lat = -linha, lng = coluna, e o bloco do mundo e
// (x0 + coluna, z0 + linha). O mapa (1 pixel por bloco) e publico.

const URL_CIDADE = `${URL_BASE}/api/cidade`;

const CIDADE_ESTADOS = {
    livre: { rotulo: 'Vazia', cor: '#9fb4c4' },
    aberta: { rotulo: 'Aberta para ocupação', cor: '#3ddc84' },
    ocupada: { rotulo: 'Ocupada', cor: '#2ee6f0' },
    inativa: { rotulo: 'Morador inativo', cor: '#ffd23f' },
    liberar: { rotulo: 'Retirar trust', cor: '#ff4d5e' },
};

const cidade = { mapa: null, camada: null, dados: null };

function cEsc(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function cData(valor) {
    if (!valor) return '';
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
}

async function cidadeApi(caminho, opcoes = {}) {
    return lerResposta(await fetch(`${URL_CIDADE}${caminho}`, { ...opcoes, headers: getAdminRequestHeaders() }));
}

// A aba cabe na janela, sem rolagem (como a Analises): o mapa ocupa o que
// sobra abaixo do topo e sempre enquadra a cidade inteira, inclusive quando a
// janela muda de tamanho. render() chama cidadeSairDaAba() ao trocar de aba.
function cidadeSairDaAba() {
    document.body.classList.remove('painel--cidade');
    if (cidade.observador) { cidade.observador.disconnect(); cidade.observador = null; }
    if (cidade.mapa) { cidade.mapa.remove(); cidade.mapa = null; }
}

async function renderCidade() {
    cidadeSairDaAba();
    document.body.classList.add('painel--cidade');
    APP.innerHTML = `
        <section class="cidade">
            <div id="cidade_mapa" class="cidade-mapa"></div>
            <footer class="cidade-rodape">
                <ul class="cidade-legenda">
                    ${Object.values(CIDADE_ESTADOS).map(e => `<li><span style="--cor:${e.cor}"></span>${e.rotulo}</li>`).join('')}
                    <li><span class="pendente"></span>Pedido pendente</li>
                </ul>
                <button type="button" id="cidade_status" class="cidade-status" onclick="abrirPendencias()" disabled>Carregando o mapa...</button>
            </footer>
        </section>
        <div id="cidade_modal" class="cidade-modal" hidden>
            <div class="cidade-modal-caixa" role="dialog" aria-modal="true">
                <button type="button" class="cidade-fechar" onclick="cidadeFechar()" aria-label="Fechar">&times;</button>
                <div id="cidade_modal_corpo"></div>
            </div>
        </div>`;
    document.getElementById('cidade_modal').addEventListener('click', e => { if (e.target.id === 'cidade_modal') cidadeFechar(); });

    try {
        cidade.dados = await cidadeApi('');
        montarMapaCidade();
        desenharCasas();
    } catch (error) {
        console.error('Falha ao carregar a cidade:', error);
        document.getElementById('cidade_status').textContent = 'Não foi possível carregar o mapa da cidade.';
    }
}

function blocoParaLatLng(x, z) {
    const { x0, z0 } = cidade.dados.mapa;
    return [-(z - z0 + 0.5), x - x0 + 0.5];
}

function latLngParaBloco(latlng) {
    const { x0, z0 } = cidade.dados.mapa;
    return { x: x0 + Math.floor(latlng.lng), z: z0 + Math.floor(-latlng.lat) };
}

function montarMapaCidade() {
    const { largura, altura } = cidade.dados.mapa;
    const limites = [[-altura, 0], [0, largura]];
    const mapa = L.map('cidade_mapa', {
        crs: L.CRS.Simple, minZoom: -2, maxZoom: 3, zoomSnap: 0, zoomDelta: 0.5, wheelPxPerZoomLevel: 120, attributionControl: false,
        maxBounds: L.latLngBounds(limites).pad(0.15),
    });
    L.imageOverlay(`${URL_CIDADE}/mapa`, limites, { className: 'cidade-mapa-img' }).addTo(mapa);
    mapa.fitBounds(limites);
    cidade.mapa = mapa;
    // A caixa do mapa muda com a janela (e com a fonte carregando no topo):
    // reenquadra a cidade inteira a cada mudanca.
    cidade.observador = new ResizeObserver(() => {
        mapa.invalidateSize();
        mapa.fitBounds(limites);
    });
    cidade.observador.observe(document.getElementById('cidade_mapa'));
    cidade.camada = L.layerGroup().addTo(mapa);

    // Botao direito (toque longo no celular) num lugar vazio marca casa nova.
    if (cidade.dados.permissoes.gerir) mapa.on('contextmenu', e => abrirNovaCasa(latLngParaBloco(e.latlng)));
}

function desenharCasas() {
    cidade.camada.clearLayers();
    for (const casa of cidade.dados.casas) {
        const estado = CIDADE_ESTADOS[casa.estado] || CIDADE_ESTADOS.livre;
        const marca = L.circleMarker(blocoParaLatLng(casa.x, casa.z), {
            radius: 7, weight: casa.pendentes ? 3 : 2, color: casa.pendentes ? '#2ee6f0' : '#04080f',
            dashArray: casa.pendentes ? '3 3' : null, fillColor: estado.cor, fillOpacity: 0.95,
        });
        marca.bindTooltip(rotuloDaCasa(casa), { direction: 'top', offset: [0, -6] });
        marca.on('click', () => abrirCasa(casa.id));
        marca.addTo(cidade.camada);
    }
    // As pendencias viram um selo de status no rodape; o clique abre a lista.
    const total = pendenciasCidade().length;
    const status = document.getElementById('cidade_status');
    status.disabled = !total;
    status.classList.toggle('tem', total > 0);
    status.innerHTML = total
        ? `<i class="fa-solid fa-key" aria-hidden="true"></i> ${total} ${total === 1 ? 'pendência de trust' : 'pendências de trust'}`
        : '<i class="fa-solid fa-check" aria-hidden="true"></i> Nenhum trust pendente';
}

// O hover mostra quem mora la. Sem morador, quem esta pedindo; senao, o estado.
function rotuloDaCasa(casa) {
    if (casa.moradores.length) return casa.moradores.map(m => cEsc(m.nick)).join(', ');
    const pedindo = casa.pedidos.filter(p => p.status === 'Pendente' && p.tipo === 'conceder').map(p => cEsc(p.nick));
    if (pedindo.length) return `${pedindo.join(', ')} <small>(pendente)</small>`;
    return (CIDADE_ESTADOS[casa.estado] || CIDADE_ESTADOS.livre).rotulo;
}

// Pedidos a decidir e moradores que sairam do cla (trust a retirar).
function pendenciasCidade() {
    return cidade.dados.casas.flatMap(casa => [
        ...casa.pedidos.filter(p => p.status === 'Pendente').map(p => ({
            casa,
            titulo: `${p.tipo === 'retirar' ? 'Retirar' : 'Conceder'} trust · ${p.nick}`,
            detalhe: `pedido em ${cData(p.createdAt)}`,
        })),
        ...casa.moradores.filter(m => m.retirar).map(m => ({
            casa,
            titulo: `Retirar trust · ${m.nick}`,
            detalhe: m.status_membro === 'Fora do cadastro' ? 'fora do cadastro' : `membro ${m.status_membro.toLowerCase()}`,
        })),
    ]);
}

function abrirPendencias() {
    const pendentes = pendenciasCidade();
    abrirModal(`
        <h2>Pendências de trust</h2>
        <ul class="cidade-pendencias">${pendentes.map(({ casa, titulo, detalhe }) => `
            <li><button type="button" onclick="irParaCasa(${casa.id})">
                <strong>${cEsc(titulo)}</strong>
                <span>${cEsc(casa.nome || `X ${casa.x}, Z ${casa.z}`)} · ${cEsc(detalhe)}</span>
            </button></li>`).join('') || '<li class="vazio">Nenhuma pendência.</li>'}</ul>`);
}

function irParaCasa(id) {
    const casa = cidade.dados.casas.find(c => c.id === id);
    if (!casa) return;
    cidade.mapa.setView(blocoParaLatLng(casa.x, casa.z), 1);
    abrirCasa(id);
}

function abrirModal(html) {
    document.getElementById('cidade_modal_corpo').innerHTML = html;
    document.getElementById('cidade_modal').hidden = false;
}

function cidadeFechar() {
    document.getElementById('cidade_modal').hidden = true;
}

function abrirNovaCasa({ x, z }) {
    const { x0, z0, largura, altura } = cidade.dados.mapa;
    if (x < x0 || z < z0 || x >= x0 + largura || z >= z0 + altura) return;
    abrirModal(`
        <h2>Nova casa</h2>
        <p class="cidade-coord">X ${x}, Z ${z}</p>
        <form class="cidade-form" onsubmit="criarCasa(event, ${x}, ${z})">
            <label><span>Nome da casa <small>(opcional)</small></span><input name="nome" maxlength="60" placeholder="Ex.: Casa da praia"></label>
            <label class="cidade-check"><input type="checkbox" name="aberta" checked> Abrir para ocupação</label>
            <p class="cidade-aviso">Aberta, a casa aparece no site para os membros pedirem. Um líder dá o trust no jogo e aprova aqui.</p>
            <button class="botao botao-principal" type="submit">Marcar casa</button>
        </form>`);
}

function linhaPedido(p, lider) {
    const final = p.status === 'Pendente' ? '' : ` · ${cEsc(p.status)} por ${cEsc(p.decidido_por)} em ${cData(p.decidido_em)}`;
    const autor = p.tipo === 'conceder' && p.pedido_por === p.nick ? 'Pedido pelo membro' : `Pedido por ${cEsc(p.pedido_por)}`;
    const acoes = lider && p.status === 'Pendente' ? `
        <div class="cidade-acoes">
            <button class="botao botao-principal" type="button" onclick="decidirPedidoCidade(${p.id}, true)">${p.tipo === 'retirar' ? 'Aprovar retirada' : 'Dei o trust, aprovar'}</button>
            <button class="botao" type="button" onclick="mostrarRecusa(${p.id})">Recusar</button>
        </div>
        <form class="cidade-recusa" id="recusa_${p.id}" hidden onsubmit="decidirPedidoCidade(${p.id}, false, event)">
            <input name="motivo" maxlength="500" placeholder="Motivo da recusa (o membro vê no site)">
            <button class="botao" type="submit">Confirmar recusa</button>
        </form>` : '';
    return `
        <li class="cidade-pedido status-${cEsc(p.status.toLowerCase())}">
            <div><strong>${p.tipo === 'retirar' ? 'Retirar' : 'Conceder'} · ${cEsc(p.nick)}</strong> <span class="selo">${cEsc(p.status)}</span></div>
            <small>${autor} em ${cData(p.createdAt)}${final}</small>
            ${p.tipo === 'retirar' ? `<small>Itens no banco de itens: ${p.itens_no_banco ? 'sim' : 'não'}</small>` : ''}
            ${p.observacao ? `<p>${cEsc(p.observacao)}</p>` : ''}
            ${p.motivo ? `<p class="motivo">Motivo: ${cEsc(p.motivo)}</p>` : ''}
            ${acoes}
        </li>`;
}

function abrirCasa(id) {
    const casa = cidade.dados.casas.find(c => c.id === id);
    if (!casa) return;
    const { gerir, lider } = cidade.dados.permissoes;
    const estado = CIDADE_ESTADOS[casa.estado] || CIDADE_ESTADOS.livre;
    const moradores = casa.moradores.length
        ? casa.moradores.map(m => `
            <li class="${m.retirar ? 'a-retirar' : ''}">
                <img src="https://mc-heads.net/avatar/${encodeURIComponent(m.nick)}/24" alt="" width="24" height="24">
                <div><strong>${cEsc(m.nick)}</strong>
                <small>Trust desde ${cData(m.desde)} · ${cEsc(m.status_membro)}${m.inativo_ate ? ` até ${cData(m.inativo_ate)}` : ''}</small></div>
                ${lider ? `<button class="botao" type="button" onclick="abrirRetirada(${casa.id}, '${cEsc(m.nick)}')">Retirar trust</button>` : ''}
            </li>`).join('')
        : '<li class="vazio">Ninguém mora aqui.</li>';
    const ocupacao = gerir && !casa.moradores.length
        ? `<button class="botao ${casa.aberta ? '' : 'botao-principal'}" type="button" onclick="alternarOcupacao(${casa.id}, ${!casa.aberta})">
            ${casa.aberta ? 'Fechar para ocupação' : 'Abrir para ocupação'}</button>`
        : '';
    abrirModal(`
        <h2>${cEsc(casa.nome || 'Casa sem nome')} <span class="cidade-estado" style="--cor:${estado.cor}">${estado.rotulo}</span></h2>
        <p class="cidade-coord">X ${casa.x}, Z ${casa.z}</p>
        ${gerir ? `<form class="cidade-renomear" onsubmit="renomearCasa(event, ${casa.id})">
            <input name="nome" maxlength="60" value="${cEsc(casa.nome || '')}" placeholder="Nome da casa">
            <button class="botao" type="submit">Salvar nome</button></form>` : ''}
        ${ocupacao ? `<div class="cidade-acoes">${ocupacao}</div>` : ''}
        <h3>Moradores</h3>
        <ul class="cidade-moradores">${moradores}</ul>
        <h3>Pedidos</h3>
        <ul class="cidade-pedidos">${casa.pedidos.map(p => linhaPedido(p, lider)).join('') || '<li class="vazio">Nenhum pedido.</li>'}</ul>
        ${lider && !casa.moradores.length && !casa.pendentes
            ? `<button class="botao cidade-apagar" type="button" onclick="apagarCasa(${casa.id})">Apagar casa marcada por engano</button>` : ''}`);
}

function abrirRetirada(casaId, nick) {
    const casa = cidade.dados.casas.find(c => c.id === casaId);
    abrirModal(`
        <h2>Retirar trust · ${cEsc(nick)}</h2>
        <p class="cidade-coord">${cEsc(casa?.nome || '')} X ${casa?.x}, Z ${casa?.z}</p>
        <form class="cidade-form" onsubmit="retirarTrust(event, ${casaId}, '${cEsc(nick)}')">
            <label class="cidade-check"><input type="checkbox" name="itens_no_banco"> Os itens da casa foram ao banco de itens</label>
            <label><span>Observação <small>(opcional)</small></span><textarea name="observacao" maxlength="500" rows="2" placeholder="O que foi guardado, em qual baú..."></textarea></label>
            <p class="cidade-aviso">Tire o trust no jogo antes de marcar aqui.</p>
            <button class="botao botao-principal" type="submit">Trust retirado</button>
        </form>`);
}

function mostrarRecusa(id) {
    const form = document.getElementById(`recusa_${id}`);
    if (form) { form.hidden = false; form.querySelector('input').focus(); }
}

async function recarregarCidade(casaId) {
    cidade.dados = await cidadeApi('');
    desenharCasas();
    if (casaId && cidade.dados.casas.some(c => c.id === casaId)) abrirCasa(casaId);
    else cidadeFechar();
}

async function enviarCidade(event, caminho, metodo, corpo, casaId, falha) {
    event?.preventDefault();
    const botao = event?.target.querySelector?.('button[type=submit]');
    if (botao) botao.disabled = true;
    try {
        const resposta = await cidadeApi(caminho, { method: metodo, body: JSON.stringify(corpo) });
        await recarregarCidade(casaId ?? resposta?.id);
    } catch (error) {
        avisarFalha(error, falha);
        if (botao) botao.disabled = false;
    }
}

function criarCasa(event, x, z) {
    const dados = new FormData(event.target);
    enviarCidade(event, '/casas', 'POST', { x, z, nome: dados.get('nome'), aberta: dados.get('aberta') === 'on' }, null, 'Não foi possível marcar a casa.');
}

function retirarTrust(event, casaId, nick) {
    const dados = new FormData(event.target);
    enviarCidade(event, `/casas/${casaId}/retirar`, 'POST', {
        nick, observacao: dados.get('observacao') || '', itens_no_banco: dados.get('itens_no_banco') === 'on',
    }, casaId, 'Não foi possível retirar o trust.');
}

function renomearCasa(event, id) {
    enviarCidade(event, `/casas/${id}`, 'PATCH', { nome: new FormData(event.target).get('nome') }, id, 'Não foi possível renomear a casa.');
}

function alternarOcupacao(id, aberta) {
    enviarCidade(null, `/casas/${id}`, 'PATCH', { aberta }, id, 'Não foi possível mudar a ocupação da casa.');
}

function decidirPedidoCidade(id, aprovar, event) {
    const casa = cidade.dados.casas.find(c => c.pedidos.some(p => p.id === id));
    const motivo = aprovar ? undefined : document.querySelector(`#recusa_${id} input`)?.value || '';
    enviarCidade(event, `/pedidos/${id}/${aprovar ? 'aprovar' : 'recusar'}`, 'PATCH', { motivo }, casa?.id, 'Não foi possível decidir o pedido.');
}

async function apagarCasa(id) {
    try {
        await lerResposta(await fetch(`${URL_CIDADE}/casas/${id}`, { method: 'DELETE', headers: getAdminRequestHeaders() }));
        await recarregarCidade();
    } catch (error) {
        avisarFalha(error, 'Não foi possível apagar a casa.');
    }
}
