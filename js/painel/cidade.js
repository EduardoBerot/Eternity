// Aba Cidade (05/10/2026; refeita em 06/10/2026): o mapa da cidade da ETY com
// as casas, os terrenos e os locais importantes. A staff (Supervisor ou acima)
// marca com o botao direito (toque longo no celular): casa ou terreno, aberto
// para ocupacao, ou um local (warp, loja, farm...) com icone. Os membros pedem
// casa/terreno no site publico pelo nick, confirmam por DM do bot, e um lider
// da o /trust no jogo e aprova aqui. Quando o morador sai do cla, fica
// pendente retirar o trust: o lider tira no jogo, leva os itens ao banco de
// itens e marca aqui. Os marcadores sao de js/cidade-marcas.js.
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
                    <li><span class="quadrado" style="--cor:${CIDADE_COR_TERRENO_LIVRE}"></span>Terreno</li>
                    <li><span class="pendente"></span>Pedido pendente</li>
                    <li><i class="fa-solid fa-signs-post" aria-hidden="true"></i>Local</li>
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

    // Botao direito (toque longo no celular) num lugar vazio marca casa,
    // terreno ou local.
    if (cidade.dados.permissoes.gerir) mapa.on('contextmenu', e => abrirNovaMarca(latLngParaBloco(e.latlng)));
}

function desenharCasas() {
    cidade.camada.clearLayers();
    for (const casa of cidade.dados.casas) {
        const estado = CIDADE_ESTADOS[casa.estado] || CIDADE_ESTADOS.livre;
        const cor = casa.tipo === 'terreno' && casa.estado === 'aberta' ? CIDADE_COR_TERRENO_LIVRE : estado.cor;
        const marca = cidadeMarcaCasa(blocoParaLatLng(casa.x, casa.z), {
            tipo: casa.tipo, cor, destaque: casa.estado === 'aberta', pendente: casa.pendentes > 0,
        });
        marca.bindTooltip(rotuloDaCasa(casa), { direction: 'top', offset: [0, -10] });
        marca.on('click', () => abrirCasa(casa.id));
        marca.addTo(cidade.camada);
    }
    for (const local of cidade.dados.locais || []) {
        const marca = cidadeMarcaLocal(blocoParaLatLng(local.x, local.z), local.icone);
        marca.bindTooltip(cEsc(local.nome), { direction: 'top', offset: [0, -14] });
        marca.on('click', () => abrirLocal(local.id));
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

// Botao direito: escolhe entre casa, terreno e local importante.
function abrirNovaMarca({ x, z }, tipo = 'casa') {
    const { x0, z0, largura, altura } = cidade.dados.mapa;
    if (x < x0 || z < z0 || x >= x0 + largura || z >= z0 + altura) return;
    const abas = [['casa', 'Casa', 'fa-house'], ['terreno', 'Terreno', 'fa-vector-square'], ['local', 'Local', 'fa-signs-post']]
        .map(([valor, rotulo, icone]) => `<button type="button" class="cidade-aba ${valor === tipo ? 'ativa' : ''}" onclick="abrirNovaMarca({ x: ${x}, z: ${z} }, '${valor}')">
            <i class="fa-solid ${icone}" aria-hidden="true"></i> ${rotulo}</button>`).join('');
    const corpo = tipo === 'local' ? `
        <form class="cidade-form" onsubmit="criarLocal(event, ${x}, ${z})">
            ${camposLocal({})}
            <button class="botao botao-principal" type="submit">Marcar local</button>
        </form>` : `
        <form class="cidade-form" onsubmit="criarCasa(event, ${x}, ${z}, '${tipo}')">
            <label><span>Nome ${tipo === 'terreno' ? 'do terreno' : 'da casa'} <small>(opcional)</small></span><input name="nome" maxlength="60" placeholder="${tipo === 'terreno' ? 'Ex.: Lote da praça' : 'Ex.: Casa da praia'}"></label>
            <label class="cidade-check"><input type="checkbox" name="aberta" checked> Abrir para ocupação</label>
            <p class="cidade-aviso">${tipo === 'terreno' ? 'Aberto, o terreno' : 'Aberta, a casa'} aparece no site para os membros pedirem. Um líder dá o trust no jogo e aprova aqui.</p>
            <button class="botao botao-principal" type="submit">Marcar ${tipo === 'terreno' ? 'terreno' : 'casa'}</button>
        </form>`;
    abrirModal(`
        <h2>Marcar no mapa</h2>
        <p class="cidade-coord">X ${x}, Z ${z}</p>
        <div class="cidade-abas">${abas}</div>
        ${corpo}`);
}

// Campos do local importante, com a grade de icones (lista do backend).
function camposLocal(local) {
    const atual = local.icone || cidade.dados.icones?.[0]?.chave;
    const icones = (cidade.dados.icones || []).map(i => `
        <label class="cidade-icone" title="${cEsc(i.rotulo)}">
            <input type="radio" name="icone" value="${cEsc(i.chave)}" ${i.chave === atual ? 'checked' : ''}>
            <i class="${cidadeIconeClasse(i.chave)}" aria-hidden="true"></i><span>${cEsc(i.rotulo)}</span>
        </label>`).join('');
    return `
        <label><span>Nome</span><input name="nome" required maxlength="60" value="${cEsc(local.nome || '')}" placeholder="Ex.: Loja do bunker"></label>
        <fieldset class="cidade-icones"><legend>Ícone</legend>${icones}</fieldset>
        <label><span>Warp <small>(opcional)</small></span><input name="warp" maxlength="60" value="${cEsc(local.warp || '')}" placeholder="Ex.: /warp loja"></label>
        <label><span>Descrição <small>(opcional)</small></span><textarea name="descricao" maxlength="500" rows="2">${cEsc(local.descricao || '')}</textarea></label>`;
}

function dadosLocal(form) {
    const dados = new FormData(form);
    return { nome: dados.get('nome'), icone: dados.get('icone'), warp: dados.get('warp') || '', descricao: dados.get('descricao') || '' };
}

function criarLocal(event, x, z) {
    enviarCidade(event, '/locais', 'POST', { x, z, ...dadosLocal(event.target) }, null, 'Não foi possível marcar o local.', true);
}

function salvarLocal(event, id) {
    enviarCidade(event, `/locais/${id}`, 'PATCH', dadosLocal(event.target), null, 'Não foi possível salvar o local.', true);
}

async function apagarLocalCidade(id) {
    try {
        await lerResposta(await fetch(`${URL_CIDADE}/locais/${id}`, { method: 'DELETE', headers: getAdminRequestHeaders() }));
        await recarregarCidade();
    } catch (error) {
        avisarFalha(error, 'Não foi possível apagar o local.');
    }
}

function abrirLocal(id) {
    const local = (cidade.dados.locais || []).find(l => l.id === id);
    if (!local) return;
    const { gerir } = cidade.dados.permissoes;
    abrirModal(gerir ? `
        <h2><i class="${cidadeIconeClasse(local.icone)}" aria-hidden="true"></i> ${cEsc(local.nome)}</h2>
        <p class="cidade-coord">X ${local.x}, Z ${local.z}</p>
        <form class="cidade-form" onsubmit="salvarLocal(event, ${local.id})">
            ${camposLocal(local)}
            <button class="botao botao-principal" type="submit">Salvar</button>
        </form>
        <button class="botao cidade-apagar" type="button" onclick="apagarLocalCidade(${local.id})">Apagar local</button>` : `
        <h2><i class="${cidadeIconeClasse(local.icone)}" aria-hidden="true"></i> ${cEsc(local.nome)}</h2>
        <p class="cidade-coord">X ${local.x}, Z ${local.z}</p>
        ${local.warp ? `<p><code>${cEsc(local.warp)}</code></p>` : ''}
        ${local.descricao ? `<p>${cEsc(local.descricao)}</p>` : ''}`);
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
        <h2>${cEsc(casa.nome || `${cidadeRotuloTipo(casa.tipo)} sem nome`)} <span class="cidade-estado" style="--cor:${estado.cor}">${estado.rotulo}</span></h2>
        <p class="cidade-coord">${cidadeRotuloTipo(casa.tipo)} · X ${casa.x}, Z ${casa.z}</p>
        ${gerir ? `<form class="cidade-renomear" onsubmit="renomearCasa(event, ${casa.id})">
            <input name="nome" maxlength="60" value="${cEsc(casa.nome || '')}" placeholder="Nome">
            <select name="tipo" aria-label="Tipo">
                <option value="casa" ${casa.tipo !== 'terreno' ? 'selected' : ''}>Casa</option>
                <option value="terreno" ${casa.tipo === 'terreno' ? 'selected' : ''}>Terreno</option>
            </select>
            <button class="botao" type="submit">Salvar</button></form>` : ''}
        ${ocupacao ? `<div class="cidade-acoes">${ocupacao}</div>` : ''}
        <h3>Moradores</h3>
        <ul class="cidade-moradores">${moradores}</ul>
        <h3>Pedidos</h3>
        <ul class="cidade-pedidos">${casa.pedidos.map(p => linhaPedido(p, lider)).join('') || '<li class="vazio">Nenhum pedido.</li>'}</ul>
        ${lider && !casa.moradores.length && !casa.pendentes
            ? `<button class="botao cidade-apagar" type="button" onclick="apagarCasa(${casa.id})">Apagar marcação feita por engano</button>` : ''}`);
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

// `fechar`: depois de salvar, fecha o popup em vez de reabrir a casa (locais).
async function enviarCidade(event, caminho, metodo, corpo, casaId, falha, fechar = false) {
    event?.preventDefault();
    const botao = event?.target.querySelector?.('button[type=submit]');
    if (botao) botao.disabled = true;
    try {
        const resposta = await cidadeApi(caminho, { method: metodo, body: JSON.stringify(corpo) });
        await recarregarCidade(fechar ? null : casaId ?? resposta?.id);
    } catch (error) {
        avisarFalha(error, falha);
        if (botao) botao.disabled = false;
    }
}

function criarCasa(event, x, z, tipo) {
    const dados = new FormData(event.target);
    enviarCidade(event, '/casas', 'POST', { x, z, tipo, nome: dados.get('nome'), aberta: dados.get('aberta') === 'on' }, null, 'Não foi possível marcar.');
}

function retirarTrust(event, casaId, nick) {
    const dados = new FormData(event.target);
    enviarCidade(event, `/casas/${casaId}/retirar`, 'POST', {
        nick, observacao: dados.get('observacao') || '', itens_no_banco: dados.get('itens_no_banco') === 'on',
    }, casaId, 'Não foi possível retirar o trust.');
}

function renomearCasa(event, id) {
    const dados = new FormData(event.target);
    enviarCidade(event, `/casas/${id}`, 'PATCH', { nome: dados.get('nome'), tipo: dados.get('tipo') }, id, 'Não foi possível salvar.');
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
