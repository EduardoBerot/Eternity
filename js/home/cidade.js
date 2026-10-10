// Cidade no site publico (06/10/2026): o mapa com as casas, os terrenos e os
// locais importantes, aberto a qualquer um, e o pedido de trust. Clicar numa
// marca da zoom nela e abre um card ao lado; numa casa ou terreno aberto para
// ocupacao, "Solicitar trust" pede o nick. Marcadores em js/cidade-marcas.js. O nick tem de
// ser de um membro ativo com Discord vinculado: o bot manda DM para esse
// Discord, e so a confirmacao la faz o pedido chegar aos lideres. Assim
// ninguem pede casa no nome de outro. Um lider da o /trust no jogo e aprova no
// painel.
//
// Leaflet com CRS.Simple, como no painel (js/painel/cidade.js): lat = -linha,
// lng = coluna, e o bloco do mundo e (x0 + coluna, z0 + linha).

const URL_CIDADE_PUBLICA = `${URL_BASE}/api/cidade`;

const CASA_ESTADOS = {
    aberta: { rotulo: 'Aberta para ocupação', cor: '#3ddc84' },
    ocupada: { rotulo: 'Ocupada', cor: '#2ee6f0' },
    fechada: { rotulo: 'Indisponível', cor: '#9fb4c4' },
};

const ZOOM_NA_CASA = 1.5;

const cidadePub = { mapa: null, dados: null, alvo: null };

// Distancia do card ate a marca, em pixels.
const FOLGA_CARD = 40;

function oTipo(casa) {
    return casa.tipo === 'terreno'
        ? { nome: 'terreno', este: 'este terreno', aberto: 'aberto' }
        : { nome: 'casa', este: 'esta casa', aberto: 'aberta' };
}

function renderCidadePublica() {
    if (cidadePub.mapa) { cidadePub.mapa.remove(); cidadePub.mapa = null; }
    cidadePub.alvo = null;
    app.innerHTML = `
        <header class="cabeca-pagina"><div class="miolo">
            <h1>Cidade</h1>
            <p class="texto">A cidade da Eternity fica no servidor <b>Apocalipse</b>: casas e terrenos gratuitos, farms coletivas e um lugar para cada membro.</p>
        </div></header>
        <div class="miolo">
            <section class="cidade-publica">
                <div class="cidade-mapa cidade-mapa--publica">
                    <div id="cidade_mapa" class="cidade-mapa-leaflet"><p class="cidade-carregando">Carregando o mapa...</p></div>
                    <div id="cidade_card" class="cidade-card" hidden role="dialog" aria-live="polite"></div>
                </div>
                <aside class="cidade-lado">
                    <dl class="cidade-numeros">
                        <div><dt>Casas livres</dt><dd id="cidade_n_casas">–</dd></div>
                        <div><dt>Terrenos livres</dt><dd id="cidade_n_terrenos">–</dd></div>
                        <div><dt>Ocupados</dt><dd id="cidade_n_ocupados">–</dd></div>
                    </dl>
                    <div class="cidade-bloco">
                        <h2>Como pedir o seu</h2>
                        <ol class="cidade-passos">
                            <li><span>Clique numa casa ou num terreno <b>livre</b> no mapa.</span></li>
                            <li><span>Em <b>Solicitar trust</b>, digite o seu nick.</span></li>
                            <li><span>Confirme pela DM do bot no Discord vinculado ao nick.</span></li>
                            <li><span>Um líder dá o trust no jogo.</span></li>
                        </ol>
                    </div>
                    <div class="cidade-bloco">
                        <h2>Como visitar</h2>
                        <p class="cidade-rota"><code>/apocalipse</code><i class="fa-solid fa-arrow-right" aria-hidden="true"></i><code>/go ETY</code></p>
                    </div>
                    <ul class="cidade-legenda cidade-legenda--lado">
                        <li><span style="--cor:${CASA_ESTADOS.aberta.cor}"></span>Casa livre</li>
                        <li><span class="quadrado" style="--cor:${CIDADE_COR_TERRENO_LIVRE}"></span>Terreno livre</li>
                        <li><span style="--cor:${CASA_ESTADOS.ocupada.cor}"></span>Ocupado</li>
                        <li><span style="--cor:${CASA_ESTADOS.fechada.cor}"></span>Indisponível</li>
                        <li><i class="fa-solid fa-signs-post" aria-hidden="true"></i>Local importante</li>
                    </ul>
                </aside>
            </section>
            <section class="cidade-galeria">
                <div class="cidade-galeria-cabeca">
                    <h2>Galeria</h2>
                    <p>Clique numa foto para ampliar.</p>
                </div>
                <div id="gallery">${[0, 1, 2, 3, 4, 5].map(i => `<a href="/imgs/City0${i}.jpg"><img class="cityimgs" src="/imgs/City0${i}.jpg" alt="Cidade da Eternity, vista ${i + 1}" loading="lazy"><i class="fa-solid fa-expand" aria-hidden="true"></i></a>`).join('')}</div>
            </section>
        </div>
        ${rodapeSite()}`;
    lightGallery(document.getElementById('gallery'), { download: false });
    carregarCidadePublica();
}

async function carregarCidadePublica() {
    try {
        cidadePub.dados = await fetch(`${URL_CIDADE_PUBLICA}/publico`).then(lerResposta);
        contarCidade();
        montarMapaPublico();
    } catch (error) {
        console.error('Falha ao carregar a cidade:', error);
        const caixa = document.getElementById('cidade_mapa');
        if (caixa) caixa.innerHTML = '<p class="cidade-carregando">Não foi possível carregar o mapa da cidade.</p>';
    }
}

// Os numeros do painel ao lado do mapa.
function contarCidade() {
    const casas = cidadePub.dados.casas;
    const conta = filtro => casas.filter(filtro).length;
    const poe = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
    poe('cidade_n_casas', conta(c => c.estado === 'aberta' && c.tipo !== 'terreno'));
    poe('cidade_n_terrenos', conta(c => c.estado === 'aberta' && c.tipo === 'terreno'));
    poe('cidade_n_ocupados', conta(c => c.estado === 'ocupada'));
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
    cidadeProporcao(caixa.parentElement, largura, altura);
    const mapa = L.map(caixa, {
        crs: L.CRS.Simple, minZoom: -2, maxZoom: 3, zoomSnap: 0, zoomDelta: 0.5, wheelPxPerZoomLevel: 120, attributionControl: false,
        maxBounds: limites, maxBoundsViscosity: 1,
    });
    L.imageOverlay(`${URL_CIDADE_PUBLICA}/mapa?v=${encodeURIComponent(cidadePub.dados.mapa.versao || '')}`, limites, { className: 'cidade-mapa-img' }).addTo(mapa);
    let enquadrado = cidadeEnquadrar(mapa, limites);
    cidadePub.mapa = mapa;
    // Janela mudou: so sobe o zoom minimo, sem tirar o visitante da casa que
    // ele abriu. Enquadra uma vez quando a caixa ganha tamanho.
    cidadePub.observador?.disconnect();
    cidadePub.observador = new ResizeObserver(() => {
        mapa.invalidateSize();
        if (!enquadrado) enquadrado = cidadeEnquadrar(mapa, limites);
        else cidadeAjustarZoomMinimo(mapa, limites);
    });
    cidadePub.observador.observe(caixa);
    for (const casa of cidadePub.dados.casas) {
        const estado = CASA_ESTADOS[casa.estado] || CASA_ESTADOS.fechada;
        const cor = casa.tipo === 'terreno' && casa.estado === 'aberta' ? CIDADE_COR_TERRENO_LIVRE : estado.cor;
        const marca = cidadeMarcaCasa(blocoPublico(casa.x, casa.z), { tipo: casa.tipo, cor, destaque: casa.estado === 'aberta' });
        const rotulo = casa.moradores.length ? casa.moradores.map(escHtml).join(', ') : `${cidadeRotuloTipo(casa.tipo)} · ${estado.rotulo.toLowerCase()}`;
        marca.bindTooltip(rotulo, { direction: 'top', offset: [0, -10] });
        marca.on('click', () => focarCasa(casa.id));
        marca.addTo(mapa);
    }
    for (const local of cidadePub.dados.locais || []) {
        const marca = cidadeMarcaLocal(blocoPublico(local.x, local.z), local.icone);
        marca.bindTooltip(escHtml(local.nome), { direction: 'top', offset: [0, -14] });
        marca.on('click', () => focarLocal(local.id));
        marca.addTo(mapa);
    }
    // O card acompanha a casa quando o mapa anda ou muda de zoom.
    mapa.on('move zoom', posicionarCard);
    mapa.on('click', fecharCardCasa);
}

// Zoom na marca e o card ao lado dela.
function focarEm(alvo) {
    cidadePub.alvo = alvo;
    const zoom = Math.max(cidadePub.mapa.getZoom(), ZOOM_NA_CASA);
    cidadePub.mapa.flyTo(blocoPublico(alvo.x, alvo.z), zoom, { duration: 0.6 });
}

function focarCasa(id) {
    const casa = cidadePub.dados.casas.find(c => c.id === id);
    if (!casa) return;
    focarEm(casa);
    mostrarCardCasa(casa);
}

function focarLocal(id) {
    const local = (cidadePub.dados.locais || []).find(l => l.id === id);
    if (!local) return;
    focarEm(local);
    abrirCard(`
        <button type="button" class="cidade-fechar" onclick="fecharCardCasa()" aria-label="Fechar">&times;</button>
        <h3><i class="${cidadeIconeClasse(local.icone)} cidade-card-icone" aria-hidden="true"></i> ${escHtml(local.nome)}</h3>
        <p class="cidade-coord">X ${local.x}, Z ${local.z}</p>
        ${local.warp ? `<p class="cidade-warp">Para ir: <code>${escHtml(local.warp)}</code></p>` : ''}
        ${local.descricao ? `<p class="cidade-descricao">${escHtml(local.descricao)}</p>` : ''}`);
}

function cartaoCasa(casa, corpo) {
    const estado = CASA_ESTADOS[casa.estado] || CASA_ESTADOS.fechada;
    return `
        <button type="button" class="cidade-fechar" onclick="fecharCardCasa()" aria-label="Fechar">&times;</button>
        <h3>${escHtml(casa.nome || cidadeRotuloTipo(casa.tipo))}</h3>
        <span class="cidade-estado" style="--cor:${estado.cor}">${estado.rotulo}</span>
        <p class="cidade-coord">${cidadeRotuloTipo(casa.tipo)} · X ${casa.x}, Z ${casa.z}</p>
        ${casa.moradores.length ? `<ul class="cidade-moradores">${casa.moradores.map(nick => `
            <li><img src="https://mc-heads.net/avatar/${encodeURIComponent(nick)}/20" alt="" width="20" height="20"><div><strong>${escHtml(nick)}</strong></div></li>`).join('')}</ul>` : ''}
        ${corpo}`;
}

function mostrarCardCasa(casa) {
    let corpo = '';
    if (casa.estado === 'aberta') {
        corpo = `
            ${casa.em_analise ? `<p class="cidade-aviso">${casa.em_analise} ${casa.em_analise === 1 ? 'pedido' : 'pedidos'} em análise para ${oTipo(casa).este}.</p>` : ''}
            <button type="button" class="botao botao-principal" onclick="abrirSolicitacao(${casa.id})">Solicitar trust</button>`;
    } else if (casa.estado === 'fechada') {
        const t = oTipo(casa);
        corpo = `<p class="cidade-aviso">${t.este[0].toUpperCase()}${t.este.slice(1)} não está ${t.aberto} para ocupação.</p>`;
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
    cidadePub.alvo = null;
}

// Ao lado da casa: a direita, ou a esquerda se nao couber. No celular o card
// vira uma faixa no pe do mapa (CSS), e aqui so se limpa a posicao.
function posicionarCard() {
    const card = document.getElementById('cidade_card');
    const casa = cidadePub.alvo;
    if (!card || card.hidden || !casa || !cidadePub.mapa) return;
    if (window.matchMedia('(max-width: 640px)').matches) {
        card.style.left = card.style.top = '';
        return;
    }
    const ponto = cidadePub.mapa.latLngToContainerPoint(blocoPublico(casa.x, casa.z));
    const largura = card.offsetWidth;
    const caixa = cidadePub.mapa.getSize();
    const folga = FOLGA_CARD;
    const x = ponto.x + folga + largura <= caixa.x - 8 ? ponto.x + folga : Math.max(8, ponto.x - folga - largura);
    const y = Math.min(Math.max(8, ponto.y - card.offsetHeight / 2), Math.max(8, caixa.y - card.offsetHeight - 8));
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
}
