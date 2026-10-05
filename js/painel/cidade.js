// Aba Cidade (05/10/2026): o mapa da cidade da ETY com as casas e os pedidos de
// trust. O supervisor marca a casa com o botao direito (toque longo no
// celular) e pede o trust de um membro; um lider da o /trust no jogo e aprova
// aqui. A retirada, quando o morador sai do cla e os itens vao ao banco de
// itens, segue o mesmo caminho.
//
// O mapa (1 pixel por bloco) vem do backend so para staff logada, e por isso
// e baixado com o token e virado em blob. Leaflet com CRS.Simple: lat = -linha,
// lng = coluna, e o bloco do mundo e (x0 + coluna, z0 + linha).

const URL_CIDADE = `${URL_BASE}/api/cidade`;

const CIDADE_ESTADOS = {
    livre: { rotulo: 'Livre', cor: '#9fb4c4' },
    ocupada: { rotulo: 'Ocupada', cor: '#3ddc84' },
    inativa: { rotulo: 'Morador inativo', cor: '#ffd23f' },
    liberar: { rotulo: 'A liberar', cor: '#ff4d5e' },
};

const cidade = { mapa: null, camada: null, imagem: null, dados: null, membros: null };

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
        const [dados, blob] = await Promise.all([
            cidadeApi(''),
            fetch(`${URL_CIDADE}/mapa`, { headers: getAdminRequestHeaders() }).then(r => {
                if (!r.ok) throw new Error(`mapa HTTP ${r.status}`);
                return r.blob();
            }),
        ]);
        cidade.dados = dados;
        if (cidade.imagem) URL.revokeObjectURL(cidade.imagem);
        cidade.imagem = URL.createObjectURL(blob);
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
    L.imageOverlay(cidade.imagem, limites, { className: 'cidade-mapa-img' }).addTo(mapa);
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
    if (cidade.dados.permissoes.pedir) mapa.on('contextmenu', e => abrirNovaCasa(latLngParaBloco(e.latlng)));
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
        ? `<i class="fa-solid fa-key" aria-hidden="true"></i> ${total} ${total === 1 ? 'pedido de trust pendente' : 'pedidos de trust pendentes'}`
        : '<i class="fa-solid fa-check" aria-hidden="true"></i> Nenhum trust pendente';
}

// O hover mostra quem mora la. Sem morador, quem esta pedindo; senao, "Livre".
function rotuloDaCasa(casa) {
    if (casa.moradores.length) return casa.moradores.map(m => cEsc(m.nick)).join(', ');
    const pedindo = casa.pedidos.filter(p => p.status === 'Pendente' && p.tipo === 'conceder').map(p => cEsc(p.nick));
    return pedindo.length ? `${pedindo.join(', ')} <small>(pendente)</small>` : 'Livre';
}

function pendenciasCidade() {
    return cidade.dados.casas.flatMap(casa => casa.pedidos
        .filter(p => p.status === 'Pendente').map(p => ({ casa, p })));
}

function abrirPendencias() {
    const pendentes = pendenciasCidade();
    abrirModal(`
        <h2>Pedidos de trust pendentes</h2>
        <ul class="cidade-pendencias">${pendentes.map(({ casa, p }) => `
            <li><button type="button" onclick="irParaCasa(${casa.id})">
                <strong>${p.tipo === 'retirar' ? 'Retirar' : 'Conceder'} trust · ${cEsc(p.nick)}</strong>
                <span>${cEsc(casa.nome || `X ${casa.x}, Z ${casa.z}`)} · pedido por ${cEsc(p.pedido_por)} em ${cData(p.createdAt)}</span>
            </button></li>`).join('') || '<li class="vazio">Nenhum pedido pendente.</li>'}</ul>`);
}

function irParaCasa(id) {
    const casa = cidade.dados.casas.find(c => c.id === id);
    if (!casa) return;
    cidade.mapa.setView(blocoParaLatLng(casa.x, casa.z), 1);
    abrirCasa(id);
}

async function membrosAtivosCidade() {
    if (!cidade.membros) {
        try {
            const lista = await fetch(URL_GET_MEMBROS_ATIVOS, { headers: getAdminRequestHeaders() }).then(r => r.json());
            cidade.membros = semContasDoCla(lista).map(m => m.nick).sort((a, b) => a.localeCompare(b));
        } catch (_) {
            cidade.membros = [];
        }
    }
    return cidade.membros;
}

function abrirModal(html) {
    document.getElementById('cidade_modal_corpo').innerHTML = html;
    document.getElementById('cidade_modal').hidden = false;
}

function cidadeFechar() {
    document.getElementById('cidade_modal').hidden = true;
}

async function campoNick() {
    const nicks = await membrosAtivosCidade();
    return `<label>Membro<input name="nick" list="cidade_nicks" required maxlength="17" autocomplete="off" placeholder="Nick do membro"></label>
        <datalist id="cidade_nicks">${nicks.map(n => `<option value="${cEsc(n)}">`).join('')}</datalist>`;
}

async function abrirNovaCasa({ x, z }) {
    const { x0, z0, largura, altura } = cidade.dados.mapa;
    if (x < x0 || z < z0 || x >= x0 + largura || z >= z0 + altura) return;
    abrirModal(`
        <h2>Nova casa</h2>
        <p class="cidade-coord">X ${x}, Z ${z}</p>
        <form class="cidade-form" onsubmit="enviarPedidoCidade(event, { x: ${x}, z: ${z}, tipo: 'conceder' })">
            <label><span>Nome da casa <small>(opcional)</small></span><input name="nome" maxlength="60" placeholder="Ex.: Casa da praia"></label>
            ${await campoNick()}
            <label><span>Observação <small>(opcional)</small></span><textarea name="observacao" maxlength="500" rows="2"></textarea></label>
            <p class="cidade-aviso">O pedido vai para um líder, que dá o trust no jogo e aprova.</p>
            <button class="botao botao-principal" type="submit">Pedir trust</button>
        </form>`);
}

function linhaPedido(p, lider) {
    const final = p.status === 'Pendente' ? '' : ` · ${cEsc(p.status)} por ${cEsc(p.decidido_por)} em ${cData(p.decidido_em)}`;
    const acoes = lider && p.status === 'Pendente' ? `
        <div class="cidade-acoes">
            <button class="botao botao-principal" type="button" onclick="decidirPedidoCidade(${p.id}, true)">${p.tipo === 'retirar' ? 'Aprovar retirada' : 'Aprovar e conceder'}</button>
            <button class="botao" type="button" onclick="mostrarRecusa(${p.id})">Recusar</button>
        </div>
        <form class="cidade-recusa" id="recusa_${p.id}" hidden onsubmit="decidirPedidoCidade(${p.id}, false, event)">
            <input name="motivo" maxlength="500" placeholder="Motivo da recusa">
            <button class="botao" type="submit">Confirmar recusa</button>
        </form>` : '';
    return `
        <li class="cidade-pedido status-${cEsc(p.status.toLowerCase())}">
            <div><strong>${p.tipo === 'retirar' ? 'Retirar' : 'Conceder'} · ${cEsc(p.nick)}</strong> <span class="selo">${cEsc(p.status)}</span></div>
            <small>Pedido por ${cEsc(p.pedido_por)} em ${cData(p.createdAt)}${final}</small>
            ${p.tipo === 'retirar' ? `<small>Itens no banco de itens: ${p.itens_no_banco ? 'sim' : 'não'}</small>` : ''}
            ${p.observacao ? `<p>${cEsc(p.observacao)}</p>` : ''}
            ${p.motivo ? `<p class="motivo">Motivo: ${cEsc(p.motivo)}</p>` : ''}
            ${acoes}
        </li>`;
}

async function abrirCasa(id) {
    const casa = cidade.dados.casas.find(c => c.id === id);
    if (!casa) return;
    const { pedir, lider } = cidade.dados.permissoes;
    const estado = CIDADE_ESTADOS[casa.estado] || CIDADE_ESTADOS.livre;
    const moradores = casa.moradores.length
        ? casa.moradores.map(m => `
            <li>
                <img src="https://mc-heads.net/avatar/${encodeURIComponent(m.nick)}/24" alt="" width="24" height="24">
                <div><strong>${cEsc(m.nick)}</strong>
                <small>Trust desde ${cData(m.desde)} · ${cEsc(m.status_membro)}${m.inativo_ate ? ` até ${cData(m.inativo_ate)}` : ''}</small></div>
                ${pedir && !casa.pedidos.some(p => p.status === 'Pendente' && p.tipo === 'retirar' && p.nick === m.nick)
                    ? `<button class="botao" type="button" onclick="abrirRetirada(${casa.id}, '${cEsc(m.nick)}')">Pedir retirada</button>` : ''}
            </li>`).join('')
        : '<li class="vazio">Ninguém mora aqui.</li>';
    abrirModal(`
        <h2>${cEsc(casa.nome || 'Casa sem nome')} <span class="cidade-estado" style="--cor:${estado.cor}">${estado.rotulo}</span></h2>
        <p class="cidade-coord">X ${casa.x}, Z ${casa.z}</p>
        ${pedir ? `<form class="cidade-renomear" onsubmit="renomearCasa(event, ${casa.id})">
            <input name="nome" maxlength="60" value="${cEsc(casa.nome || '')}" placeholder="Nome da casa">
            <button class="botao" type="submit">Salvar nome</button></form>` : ''}
        <h3>Moradores</h3>
        <ul class="cidade-moradores">${moradores}</ul>
        ${pedir ? `<details class="cidade-novo"><summary>Pedir trust para outro membro</summary>
            <form class="cidade-form" onsubmit="enviarPedidoCidade(event, { casa_id: ${casa.id}, tipo: 'conceder' })">
                ${await campoNick()}
                <label><span>Observação <small>(opcional)</small></span><textarea name="observacao" maxlength="500" rows="2"></textarea></label>
                <button class="botao botao-principal" type="submit">Pedir trust</button>
            </form></details>` : ''}
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
        <form class="cidade-form" onsubmit="enviarPedidoCidade(event, { casa_id: ${casaId}, tipo: 'retirar', nick: '${cEsc(nick)}' })">
            <label class="cidade-check"><input type="checkbox" name="itens_no_banco"> Levei os itens da casa ao banco de itens</label>
            <label><span>Observação <small>(opcional)</small></span><textarea name="observacao" maxlength="500" rows="2" placeholder="O que foi guardado, em qual baú..."></textarea></label>
            <p class="cidade-aviso">O pedido vai para um líder, que tira o trust no jogo e aprova.</p>
            <button class="botao botao-principal" type="submit">Pedir retirada</button>
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

async function enviarPedidoCidade(event, base) {
    event.preventDefault();
    const form = event.target;
    const dados = new FormData(form);
    const corpo = {
        ...base,
        nick: base.nick || String(dados.get('nick') || '').trim(),
        nome: dados.get('nome') ?? undefined,
        observacao: dados.get('observacao') || '',
        itens_no_banco: dados.get('itens_no_banco') === 'on',
    };
    form.querySelector('button[type=submit]').disabled = true;
    try {
        const { casa } = await cidadeApi('/pedidos', { method: 'POST', body: JSON.stringify(corpo) });
        await recarregarCidade(casa.id);
    } catch (error) {
        avisarFalha(error, 'Não foi possível enviar o pedido.');
        form.querySelector('button[type=submit]').disabled = false;
    }
}

async function decidirPedidoCidade(id, aprovar, event) {
    event?.preventDefault();
    const casa = cidade.dados.casas.find(c => c.pedidos.some(p => p.id === id));
    const motivo = aprovar ? undefined : document.querySelector(`#recusa_${id} input`)?.value || '';
    try {
        await cidadeApi(`/pedidos/${id}/${aprovar ? 'aprovar' : 'recusar'}`, { method: 'PATCH', body: JSON.stringify({ motivo }) });
        await recarregarCidade(casa?.id);
    } catch (error) {
        avisarFalha(error, 'Não foi possível decidir o pedido.');
    }
}

async function renomearCasa(event, id) {
    event.preventDefault();
    try {
        await cidadeApi(`/casas/${id}`, { method: 'PATCH', body: JSON.stringify({ nome: new FormData(event.target).get('nome') }) });
        await recarregarCidade(id);
    } catch (error) {
        avisarFalha(error, 'Não foi possível renomear a casa.');
    }
}

async function apagarCasa(id) {
    try {
        await lerResposta(await fetch(`${URL_CIDADE}/casas/${id}`, { method: 'DELETE', headers: getAdminRequestHeaders() }));
        await recarregarCidade();
    } catch (error) {
        avisarFalha(error, 'Não foi possível apagar a casa.');
    }
}
