// Aba Cidade (05/10/2026; refeita em 06/10/2026): o mapa da cidade da ETY com
// as casas, os terrenos e os locais importantes. A staff (Supervisor ou acima)
// marca com o botao direito (toque longo no celular): casa ou terreno, aberto
// para ocupacao, ou um local (warp, loja, farm...) com icone. Os membros pedem
// casa/terreno no site publico pelo nick, confirmam por DM do bot, e um lider
// da o /trust no jogo e aprova aqui. Quando o morador sai do cla, fica
// pendente retirar o trust: o lider tira no jogo, leva os itens ao banco de
// itens e marca aqui. Os marcadores sao de js/cidade-marcas.js.
//
// Pendencias da cidade (10/10/2026): o que o Supervisor acha na ronda (grief,
// farm quebrada, casa abandonada, informacao desatualizada). Aberta pelo
// botao direito no mapa ou de dentro de uma casa/local, fica marcada no mapa
// ate ser resolvida e entra no selo do rodape junto das pendencias de trust.
// A aba inteira e do nivel de Supervisor para cima (auth.js esconde o menu de
// quem esta abaixo; o backend confere em cada requisicao). Nunca vai ao site
// publico.
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

// Pendencia da cidade: a cor diz o status, o icone diz o tipo.
const PENDENCIA_STATUS = {
    Aberta: { cor: '#ff4d5e' },
    'Em andamento': { cor: '#ffb020' },
    Resolvida: { cor: '#3ddc84' },
};
const PENDENCIA_ICONE = {
    grief: 'fa-burst',
    farm: 'fa-wheat-awn',
    abandonada: 'fa-house-crack',
    informacao: 'fa-circle-info',
    outro: 'fa-triangle-exclamation',
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
            <div class="cidade-moldura"><div id="cidade_mapa" class="cidade-mapa"></div></div>
            <footer class="cidade-rodape">
                <ul class="cidade-legenda">
                    ${Object.values(CIDADE_ESTADOS).map(e => `<li><span style="--cor:${e.cor}"></span>${e.rotulo}</li>`).join('')}
                    <li><span class="quadrado" style="--cor:${CIDADE_COR_TERRENO_LIVRE}"></span>Terreno</li>
                    <li><span class="pendente"></span>Pedido pendente</li>
                    <li><i class="fa-solid fa-signs-post" aria-hidden="true"></i>Local</li>
                    <li><span class="pend" style="--cor:${PENDENCIA_STATUS.Aberta.cor}"></span>Pendência da cidade</li>
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
    cidadeProporcao(document.getElementById('cidade_mapa'), largura, altura);
    const mapa = L.map('cidade_mapa', {
        crs: L.CRS.Simple, minZoom: -2, maxZoom: 3, zoomSnap: 0, zoomDelta: 0.5, wheelPxPerZoomLevel: 120, attributionControl: false,
        maxBounds: limites, maxBoundsViscosity: 1,
    });
    L.imageOverlay(`${URL_CIDADE}/mapa?v=${encodeURIComponent(cidade.dados.mapa.versao || '')}`, limites, { className: 'cidade-mapa-img' }).addTo(mapa);
    cidadeEnquadrar(mapa, limites);
    cidade.mapa = mapa;
    // A caixa do mapa muda com a janela (e com a fonte carregando no topo):
    // reenquadra a cidade a cada mudanca.
    cidade.observador = new ResizeObserver(() => {
        mapa.invalidateSize();
        cidadeEnquadrar(mapa, limites);
    });
    cidade.observador.observe(document.getElementById('cidade_mapa'));
    cidade.camada = L.layerGroup().addTo(mapa);

    // Botao direito (toque longo no celular) num lugar vazio marca casa,
    // terreno ou local (quem gere) ou abre uma pendencia (toda a aba).
    const { gerir, ver = gerir } = cidade.dados.permissoes;
    if (gerir || ver) mapa.on('contextmenu', e => abrirNovaMarca(latLngParaBloco(e.latlng)));
}

function pendenciasAbertas() {
    return (cidade.dados.pendencias || []).filter(p => p.status !== 'Resolvida');
}

function rotuloTipoPendencia(tipo) {
    return (cidade.dados.tipos_pendencia || []).find(t => t.chave === tipo)?.rotulo || tipo;
}

function marcaPendencia(p) {
    const cor = (PENDENCIA_STATUS[p.status] || PENDENCIA_STATUS.Aberta).cor;
    const icone = PENDENCIA_ICONE[p.tipo] || PENDENCIA_ICONE.outro;
    return L.marker(blocoParaLatLng(p.x, p.z), {
        icon: L.divIcon({
            className: 'cidade-pino-caixa',
            html: `<span class="cidade-pend" style="--cor:${cor}"><i class="fa-solid ${icone}" aria-hidden="true"></i></span>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
        }),
        riseOnHover: true,
        zIndexOffset: 800,
    });
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
    // Pendencias da cidade em aberto (as resolvidas saem do mapa).
    for (const p of pendenciasAbertas()) {
        const marca = marcaPendencia(p);
        marca.bindTooltip(`${cEsc(rotuloTipoPendencia(p.tipo))} <small>(${cEsc(p.status.toLowerCase())})</small>`, { direction: 'top', offset: [0, -24] });
        marca.on('click', () => abrirPendenciaCidade(p.id));
        marca.addTo(cidade.camada);
    }
    // As pendencias viram um selo de status no rodape; o clique abre a lista.
    const trust = pendenciasCidade().length;
    const daCidade = pendenciasAbertas().length;
    const total = trust + daCidade;
    const status = document.getElementById('cidade_status');
    status.disabled = !total && !(cidade.dados.pendencias || []).length;
    status.classList.toggle('tem', total > 0);
    const partes = [];
    if (trust) partes.push(`${trust} de trust`);
    if (daCidade) partes.push(`${daCidade} da cidade`);
    status.innerHTML = total
        ? `<i class="fa-solid fa-list-check" aria-hidden="true"></i> ${total === 1 ? 'Pendência' : 'Pendências'}: ${partes.join(' · ')}`
        : '<i class="fa-solid fa-check" aria-hidden="true"></i> Nenhuma pendência';
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
    const daCidade = pendenciasAbertas();
    const resolvidas = (cidade.dados.pendencias || []).filter(p => p.status === 'Resolvida');
    const itemCidade = p => `
        <li><button type="button" class="pend-${p.status === 'Em andamento' ? 'andamento' : p.status === 'Resolvida' ? 'resolvida' : 'aberta'}" onclick="irParaPendencia(${p.id})">
            <strong><i class="fa-solid ${PENDENCIA_ICONE[p.tipo] || PENDENCIA_ICONE.outro}" aria-hidden="true"></i> ${cEsc(rotuloTipoPendencia(p.tipo))} · ${cEsc(p.status)}</strong>
            <span>X ${p.x}, Z ${p.z} · ${cEsc(p.descricao.slice(0, 90))}${p.descricao.length > 90 ? '…' : ''}</span>
            <span>Aberta por ${cEsc(p.criado_por)} em ${cData(p.criado_em)}${p.responsavel && p.status !== 'Aberta' ? ` · com ${cEsc(p.responsavel)}` : ''}</span>
        </button></li>`;
    abrirModal(`
        <h2>Pendências da cidade</h2>
        <ul class="cidade-pendencias">${daCidade.map(itemCidade).join('') || '<li class="vazio">Nenhuma pendência em aberto.</li>'}</ul>
        <h2>Pendências de trust</h2>
        <ul class="cidade-pendencias">${pendentes.map(({ casa, titulo, detalhe }) => `
            <li><button type="button" onclick="irParaCasa(${casa.id})">
                <strong>${cEsc(titulo)}</strong>
                <span>${cEsc(casa.nome || `X ${casa.x}, Z ${casa.z}`)} · ${cEsc(detalhe)}</span>
            </button></li>`).join('') || '<li class="vazio">Nenhuma pendência.</li>'}</ul>
        ${resolvidas.length ? `
        <details class="cidade-resolvidas">
            <summary>Resolvidas nos últimos 30 dias (${resolvidas.length})</summary>
            <ul class="cidade-pendencias">${resolvidas.map(itemCidade).join('')}</ul>
        </details>` : ''}`);
}

function irParaPendencia(id) {
    const p = (cidade.dados.pendencias || []).find(item => item.id === id);
    if (!p) return;
    cidade.mapa.setView(blocoParaLatLng(p.x, p.z), 1);
    abrirPendenciaCidade(id);
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

// Botao direito: escolhe entre casa, terreno, local importante (quem gere) e
// pendencia da cidade (toda a aba).
function abrirNovaMarca({ x, z }, tipo) {
    const { x0, z0, largura, altura } = cidade.dados.mapa;
    if (x < x0 || z < z0 || x >= x0 + largura || z >= z0 + altura) return;
    const { gerir } = cidade.dados.permissoes;
    tipo ??= gerir ? 'casa' : 'pendencia';
    if (!gerir) tipo = 'pendencia';
    const opcoes = [
        ...(gerir ? [['casa', 'Casa', 'fa-house'], ['terreno', 'Terreno', 'fa-vector-square'], ['local', 'Local', 'fa-signs-post']] : []),
        ['pendencia', 'Pendência', 'fa-triangle-exclamation'],
    ];
    const abas = opcoes
        .map(([valor, rotulo, icone]) => `<button type="button" class="cidade-aba ${valor === tipo ? 'ativa' : ''}" onclick="abrirNovaMarca({ x: ${x}, z: ${z} }, '${valor}')">
            <i class="fa-solid ${icone}" aria-hidden="true"></i> ${rotulo}</button>`).join('');
    const corpo = tipo === 'pendencia' ? `
        <form class="cidade-form" onsubmit="criarPendenciaCidade(event, ${x}, ${z})">
            ${camposPendencia({})}
            <p class="cidade-aviso">Fica marcada no mapa do painel até ser resolvida. Não aparece no site.</p>
            <button class="botao botao-principal" type="submit">Abrir pendência</button>
        </form>` : tipo === 'local' ? `
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
        <h2>${gerir ? 'Marcar no mapa' : 'Abrir pendência'}</h2>
        <p class="cidade-coord">X ${x}, Z ${z}</p>
        ${opcoes.length > 1 ? `<div class="cidade-abas">${abas}</div>` : ''}
        ${corpo}`);
}

// ---------- Pendencias da cidade ----------

function camposPendencia(p) {
    const atual = p.tipo || cidade.dados.tipos_pendencia?.[0]?.chave;
    const tipos = (cidade.dados.tipos_pendencia || []).map(t => `
        <label class="cidade-icone" title="${cEsc(t.rotulo)}">
            <input type="radio" name="tipo" value="${cEsc(t.chave)}" ${t.chave === atual ? 'checked' : ''}>
            <i class="fa-solid ${PENDENCIA_ICONE[t.chave] || PENDENCIA_ICONE.outro}" aria-hidden="true"></i><span>${cEsc(t.rotulo)}</span>
        </label>`).join('');
    return `
        <fieldset class="cidade-icones"><legend>Tipo</legend>${tipos}</fieldset>
        <label><span>O que foi encontrado</span><textarea name="descricao" required maxlength="1000" rows="3" placeholder="Ex.: parede da casa do lado da praça quebrada, baú aberto">${cEsc(p.descricao || '')}</textarea></label>
        <label><span>Link do print <small>(opcional)</small></span><input name="link" type="url" maxlength="500" value="${cEsc(p.link || '')}" placeholder="https://..."></label>`;
}

function dadosPendencia(form) {
    const dados = new FormData(form);
    return { tipo: dados.get('tipo'), descricao: dados.get('descricao'), link: dados.get('link') || '' };
}

async function enviarPendencia(event, caminho, metodo, corpo, falha, reabrirId) {
    event?.preventDefault();
    const botao = event?.target?.querySelector?.('button[type=submit]');
    if (botao) botao.disabled = true;
    try {
        const resposta = await cidadeApi(caminho, { method: metodo, body: JSON.stringify(corpo) });
        cidade.dados = await cidadeApi('');
        desenharCasas();
        const id = reabrirId ?? resposta?.id;
        if (id && (cidade.dados.pendencias || []).some(p => p.id === id)) abrirPendenciaCidade(id);
        else cidadeFechar();
    } catch (error) {
        avisarFalha(error, falha);
        if (botao) botao.disabled = false;
    }
}

function criarPendenciaCidade(event, x, z) {
    enviarPendencia(event, '/pendencias', 'POST', { x, z, ...dadosPendencia(event.target) }, 'Não foi possível abrir a pendência.');
}

function salvarPendenciaCidade(event, id) {
    enviarPendencia(event, `/pendencias/${id}`, 'PATCH', dadosPendencia(event.target), 'Não foi possível salvar a pendência.', id);
}

function mudarPendenciaCidade(id, status, event) {
    const resolucao = status === 'Resolvida' ? document.querySelector('#pend_resolucao textarea')?.value || '' : undefined;
    enviarPendencia(event, `/pendencias/${id}`, 'PATCH', { status, resolucao }, 'Não foi possível mudar a pendência.', id);
}

function mostrarResolucao() {
    const form = document.getElementById('pend_resolucao');
    if (form) { form.hidden = false; form.querySelector('textarea').focus(); }
}

async function apagarPendenciaCidade(id) {
    try {
        await lerResposta(await fetch(`${URL_CIDADE}/pendencias/${id}`, { method: 'DELETE', headers: getAdminRequestHeaders() }));
        cidade.dados = await cidadeApi('');
        desenharCasas();
        cidadeFechar();
    } catch (error) {
        avisarFalha(error, 'Não foi possível apagar a pendência.');
    }
}

function abrirPendenciaCidade(id) {
    const p = (cidade.dados.pendencias || []).find(item => item.id === id);
    if (!p) return;
    const { lider } = cidade.dados.permissoes;
    const cor = (PENDENCIA_STATUS[p.status] || PENDENCIA_STATUS.Aberta).cor;
    const acoes = p.status === 'Resolvida' ? `
        <div class="cidade-acoes"><button class="botao" type="button" onclick="mudarPendenciaCidade(${p.id}, 'Aberta')">Reabrir</button></div>` : `
        <div class="cidade-acoes">
            ${p.status === 'Aberta' ? `<button class="botao" type="button" onclick="mudarPendenciaCidade(${p.id}, 'Em andamento')">Assumir</button>` : ''}
            <button class="botao botao-principal" type="button" onclick="mostrarResolucao()">Marcar como resolvida</button>
        </div>
        <form class="cidade-form" id="pend_resolucao" hidden onsubmit="mudarPendenciaCidade(${p.id}, 'Resolvida', event)">
            <label><span>O que foi feito <small>(opcional)</small></span><textarea maxlength="1000" rows="2" placeholder="Ex.: replantei a farm; avisei um líder sobre o grief"></textarea></label>
            <button class="botao botao-principal" type="submit">Confirmar resolução</button>
        </form>`;
    abrirModal(`
        <h2><i class="fa-solid ${PENDENCIA_ICONE[p.tipo] || PENDENCIA_ICONE.outro}" aria-hidden="true"></i> ${cEsc(rotuloTipoPendencia(p.tipo))}
            <span class="cidade-estado" style="--cor:${cor}">${cEsc(p.status)}</span></h2>
        <p class="cidade-coord">X ${p.x}, Z ${p.z} · aberta por ${cEsc(p.criado_por)} em ${cData(p.criado_em)}</p>
        ${p.responsavel && p.status !== 'Aberta' ? `<p class="cidade-coord">Responsável: ${cEsc(p.responsavel)}</p>` : ''}
        <p class="cidade-pend-texto">${cEsc(p.descricao)}</p>
        ${p.link ? `<p><a class="cidade-pend-link" href="${cEsc(p.link)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-image" aria-hidden="true"></i> Ver o print</a></p>` : ''}
        ${p.status === 'Resolvida' ? `<p class="cidade-aviso">Resolvida por ${cEsc(p.resolvido_por)} em ${cData(p.resolvido_em)}${p.resolucao ? `: ${cEsc(p.resolucao)}` : '.'}</p>` : ''}
        ${acoes}
        <details class="cidade-editar-pend">
            <summary>Corrigir a pendência</summary>
            <form class="cidade-form" onsubmit="salvarPendenciaCidade(event, ${p.id})">
                ${camposPendencia(p)}
                <button class="botao" type="submit">Salvar</button>
            </form>
        </details>
        ${lider ? `<button class="botao cidade-apagar" type="button" onclick="apagarPendenciaCidade(${p.id})">Apagar pendência aberta por engano</button>` : ''}`);
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
        ${botaoPendenciaAqui(local)}
        <button class="botao cidade-apagar" type="button" onclick="apagarLocalCidade(${local.id})">Apagar local</button>` : `
        <h2><i class="${cidadeIconeClasse(local.icone)}" aria-hidden="true"></i> ${cEsc(local.nome)}</h2>
        <p class="cidade-coord">X ${local.x}, Z ${local.z}</p>
        ${local.warp ? `<p><code>${cEsc(local.warp)}</code></p>` : ''}
        ${local.descricao ? `<p>${cEsc(local.descricao)}</p>` : ''}
        ${botaoPendenciaAqui(local)}`);
}

// Atalho para abrir uma pendencia no ponto de uma casa, terreno ou local.
function botaoPendenciaAqui({ x, z }) {
    return `<button class="botao cidade-pend-aqui" type="button" onclick="abrirNovaMarca({ x: ${x}, z: ${z} }, 'pendencia')">
        <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Abrir pendência aqui</button>`;
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
        ${botaoPendenciaAqui(casa)}
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
