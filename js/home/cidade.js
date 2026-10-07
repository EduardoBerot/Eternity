// Cidade no site publico (06/10/2026): o mapa com as casas, aberto a qualquer
// um, e o pedido de casa. Clicar numa casa da zoom nela e abre um card ao lado;
// numa casa aberta para ocupacao, "Solicitar trust" pede o nick. O nick tem de
// ser de um membro ativo com Discord vinculado: o bot manda DM para esse
// Discord, e so a confirmacao la faz o pedido chegar aos lideres. Assim
// ninguem pede casa no nome de outro. Um lider da o /trust no jogo e aprova no
// painel.
//
// Leaflet com CRS.Simple, como no painel (js/painel/cidade.js): lat = -linha,
// lng = coluna, e o bloco do mundo e (x0 + coluna, z0 + linha).

const URL_CIDADE_PUBLICA = `${URL_BASE}/api/cidade`;

const CASA_ESTADOS = {
    aberta: { rotulo: 'Aberta para ocupação', cor: '#b98cff' },
    ocupada: { rotulo: 'Ocupada', cor: '#3ddc84' },
    fechada: { rotulo: 'Indisponível', cor: '#9fb4c4' },
};

const ZOOM_NA_CASA = 1.5;

const cidadePub = { mapa: null, dados: null, casaAberta: null };

function renderCidadePublica() {
    if (cidadePub.mapa) { cidadePub.mapa.remove(); cidadePub.mapa = null; }
    cidadePub.casaAberta = null;
    app.innerHTML = `
        <header class="cabeca-pagina"><div class="miolo">
            <h1>Cidade</h1>
            <p class="texto">A cidade da Eternity fica no servidor <b>Apocalipse</b>: casas e terrenos gratuitos, farms coletivas e um lugar para cada membro. Para visitar: <code>/apocalipse</code> e depois <code>/go ETY</code>.</p>
        </div></header>
        <div class="miolo">
            <section class="cidade-publica">
                <p class="cidade-dica">Quer uma casa? Clique numa casa <b>aberta para ocupação</b> e solicite o trust. A confirmação chega por DM no Discord vinculado ao seu nick.</p>
                <div class="cidade-mapa cidade-mapa--publica">
                    <div id="cidade_mapa" class="cidade-mapa-leaflet"><p class="cidade-carregando">Carregando o mapa...</p></div>
                    <div id="cidade_card" class="cidade-card" hidden role="dialog" aria-live="polite"></div>
                </div>
                <ul class="cidade-legenda">
                    ${Object.values(CASA_ESTADOS).map(e => `<li><span style="--cor:${e.cor}"></span>${e.rotulo}</li>`).join('')}
                </ul>
            </section>
            <h2 class="cidade-galeria-titulo">Galeria</h2>
            <div id="gallery">${[0, 1, 2, 3, 4, 5].map(i => `<a href="/imgs/City0${i}.jpg"><img class="cityimgs" src="/imgs/City0${i}.jpg" alt="Cidade da Eternity, vista ${i + 1}" loading="lazy"></a>`).join('')}</div>
        </div>
        ${rodapeSite()}`;
    lightGallery(document.getElementById('gallery'), { download: false });
    carregarCidadePublica();
}

async function carregarCidadePublica() {
    try {
        cidadePub.dados = await fetch(`${URL_CIDADE_PUBLICA}/publico`).then(lerResposta);
        montarMapaPublico();
    } catch (error) {
        console.error('Falha ao carregar a cidade:', error);
        const caixa = document.getElementById('cidade_mapa');
        if (caixa) caixa.innerHTML = '<p class="cidade-carregando">Não foi possível carregar o mapa da cidade.</p>';
    }
}

function blocoPublico(x, z) {
    const { x0, z0 } = cidadePub.dados.mapa;
    return [-(z - z0 + 0.5), x - x0 + 0.5];
}

function montarMapaPublico() {
    const caixa = document.getElementById('cidade_mapa');
    if (!caixa) return;
    caixa.innerHTML = '';
    const { largura, altura } = cidadePub.dados.mapa;
    const limites = [[-altura, 0], [0, largura]];
    const mapa = L.map(caixa, {
        crs: L.CRS.Simple, minZoom: -2, maxZoom: 3, zoomSnap: 0, zoomDelta: 0.5, wheelPxPerZoomLevel: 120, attributionControl: false,
        maxBounds: L.latLngBounds(limites).pad(0.15),
    });
    L.imageOverlay(`${URL_CIDADE_PUBLICA}/mapa`, limites, { className: 'cidade-mapa-img' }).addTo(mapa);
    mapa.fitBounds(limites);
    cidadePub.mapa = mapa;
    for (const casa of cidadePub.dados.casas) {
        const estado = CASA_ESTADOS[casa.estado] || CASA_ESTADOS.fechada;
        const marca = L.circleMarker(blocoPublico(casa.x, casa.z), {
            radius: casa.estado === 'aberta' ? 8 : 6, weight: 2, color: '#04080f', fillColor: estado.cor, fillOpacity: 0.95,
            // Sem isso o clique sobe ao mapa, que fecha o card logo depois de abrir.
            bubblingMouseEvents: false,
        });
        marca.bindTooltip(casa.moradores.length ? casa.moradores.map(escHtml).join(', ') : estado.rotulo, { direction: 'top', offset: [0, -6] });
        marca.on('click', () => focarCasa(casa.id));
        marca.addTo(mapa);
    }
    // O card acompanha a casa quando o mapa anda ou muda de zoom.
    mapa.on('move zoom', posicionarCard);
    mapa.on('click', fecharCardCasa);
}

// Zoom na casa e o card ao lado dela.
function focarCasa(id) {
    const casa = cidadePub.dados.casas.find(c => c.id === id);
    if (!casa) return;
    cidadePub.casaAberta = casa;
    const zoom = Math.max(cidadePub.mapa.getZoom(), ZOOM_NA_CASA);
    cidadePub.mapa.flyTo(blocoPublico(casa.x, casa.z), zoom, { duration: 0.6 });
    mostrarCardCasa(casa);
}

function cartaoCasa(casa, corpo) {
    const estado = CASA_ESTADOS[casa.estado] || CASA_ESTADOS.fechada;
    return `
        <button type="button" class="cidade-fechar" onclick="fecharCardCasa()" aria-label="Fechar">&times;</button>
        <h3>${escHtml(casa.nome || 'Casa')}</h3>
        <span class="cidade-estado" style="--cor:${estado.cor}">${estado.rotulo}</span>
        <p class="cidade-coord">X ${casa.x}, Z ${casa.z}</p>
        ${casa.moradores.length ? `<ul class="cidade-moradores">${casa.moradores.map(nick => `
            <li><img src="https://mc-heads.net/avatar/${encodeURIComponent(nick)}/20" alt="" width="20" height="20"><div><strong>${escHtml(nick)}</strong></div></li>`).join('')}</ul>` : ''}
        ${corpo}`;
}

function mostrarCardCasa(casa) {
    let corpo = '';
    if (casa.estado === 'aberta') {
        corpo = `
            ${casa.em_analise ? `<p class="cidade-aviso">${casa.em_analise} ${casa.em_analise === 1 ? 'pedido' : 'pedidos'} em análise para esta casa.</p>` : ''}
            <button type="button" class="botao botao-principal" onclick="abrirSolicitacao(${casa.id})">Solicitar trust</button>`;
    } else if (casa.estado === 'fechada') {
        corpo = '<p class="cidade-aviso">Esta casa não está aberta para ocupação.</p>';
    }
    abrirCard(cartaoCasa(casa, corpo));
}

function abrirSolicitacao(id) {
    const casa = cidadePub.dados.casas.find(c => c.id === id);
    if (!casa) return;
    abrirCard(cartaoCasa(casa, `
        <form class="cidade-form" onsubmit="enviarSolicitacao(event, ${casa.id})">
            <label><span>Seu nick no Minecraft</span><input name="nick" required maxlength="17" autocomplete="off" spellcheck="false" placeholder="Ex.: Ducred22"></label>
            <label><span>Observação <small>(opcional)</small></span><textarea name="observacao" maxlength="500" rows="2" placeholder="Ex.: vou morar com o meu duo"></textarea></label>
            <p class="cidade-aviso">Você vai receber uma DM do bot da Eternity no Discord vinculado ao nick para confirmar o pedido.</p>
            <p class="cidade-erro" hidden></p>
            <button class="botao botao-principal" type="submit">Enviar pedido</button>
        </form>`));
    document.querySelector('#cidade_card input[name=nick]')?.focus();
}

async function enviarSolicitacao(event, casaId) {
    event.preventDefault();
    const form = event.target;
    const botao = form.querySelector('button[type=submit]');
    const erro = form.querySelector('.cidade-erro');
    const dados = new FormData(form);
    botao.disabled = true;
    erro.hidden = true;
    try {
        const { nick } = await lerResposta(await fetch(`${URL_CIDADE_PUBLICA}/publico/solicitar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ casa_id: casaId, nick: String(dados.get('nick') || '').trim(), observacao: dados.get('observacao') || '' }),
        }));
        const casa = cidadePub.dados.casas.find(c => c.id === casaId);
        abrirCard(cartaoCasa(casa, `
            <div class="cidade-enviado">
                <i class="fa-brands fa-discord" aria-hidden="true"></i>
                <p><b>Confira o seu Discord.</b> Em instantes o bot da Eternity manda uma DM para <b>${escHtml(nick)}</b>. Confirme por lá em até 30 minutos para o pedido chegar aos líderes.</p>
            </div>`));
    } catch (error) {
        erro.textContent = error?.doBackend ? error.message : 'Não foi possível enviar o pedido. Tente de novo.';
        erro.hidden = false;
        botao.disabled = false;
    }
}

function abrirCard(html) {
    const card = document.getElementById('cidade_card');
    if (!card) return;
    card.innerHTML = html;
    card.hidden = false;
    posicionarCard();
}

function fecharCardCasa() {
    const card = document.getElementById('cidade_card');
    if (card) card.hidden = true;
    cidadePub.casaAberta = null;
}

// Ao lado da casa: a direita, ou a esquerda se nao couber. No celular o card
// vira uma faixa no pe do mapa (CSS), e aqui so se limpa a posicao.
function posicionarCard() {
    const card = document.getElementById('cidade_card');
    const casa = cidadePub.casaAberta;
    if (!card || card.hidden || !casa || !cidadePub.mapa) return;
    if (window.matchMedia('(max-width: 640px)').matches) {
        card.style.left = card.style.top = '';
        return;
    }
    const ponto = cidadePub.mapa.latLngToContainerPoint(blocoPublico(casa.x, casa.z));
    const largura = card.offsetWidth;
    const caixa = cidadePub.mapa.getSize();
    const folga = 18;
    const x = ponto.x + folga + largura <= caixa.x - 8 ? ponto.x + folga : Math.max(8, ponto.x - folga - largura);
    const y = Math.min(Math.max(8, ponto.y - card.offsetHeight / 2), Math.max(8, caixa.y - card.offsetHeight - 8));
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
}
