// Cidade (06/10/2026; dividida em 18/10/2026). O site publico mostra so a
// maquete 3D girando e a galeria de fotos. O mapa com as casas, os terrenos e os
// locais importantes, e o pedido de trust, ficam na tela Cidade do painel do
// membro (meu-painel.js chama cidadeMiolo/cidadeMontarMapa). Clicar numa marca
// da zoom nela e abre um card ao lado; numa casa ou terreno aberto para
// ocupacao, "Solicitar trust" manda o pedido com a sessao do painel (o nick
// vem do login). Desde 22/10/2026 nao ha mais DM de confirmacao: o login do
// Discord ja prova que o nick e de quem pede, e o pedido vai direto aos lideres
// (POST /api/cidade/painel/solicitar). Um lider da o /trust no jogo e aprova no
// painel; o bot avisa o membro por DM quando o trust sai.
// Marcadores em js/cidade-marcas.js.
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

// nick: o do membro logado, para o pedido de trust do painel.
const cidadePub = { mapa: null, dados: null, alvo: null, nick: null };

// Distancia do card ate a marca, em pixels.
const FOLGA_CARD = 40;

function oTipo(casa) {
    return casa.tipo === 'terreno'
        ? { nome: 'terreno', este: 'este terreno', aberto: 'aberto' }
        : { nome: 'casa', este: 'esta casa', aberto: 'aberta' };
}

// Desmonta o mapa (Leaflet e 3D) ao trocar de pagina ou de tela.
function cidadeLimpar() {
    if (cidadePub.mapa) { cidadePub.mapa.remove(); cidadePub.mapa = null; }
    cidadePub.observador?.disconnect();
    cidadePub.observador = null;
    cidade3dDescartar();
    cidadePub.alvo = null;
}

// ---------- Site publico: vitrine 3D + galeria ----------

function renderCidadePublica() {
    cidadeLimpar();
    app.innerHTML = `
        <header class="cabeca-pagina"><div class="miolo">
            <h1>Cidade</h1>
            <p class="texto">A cidade da Eternity fica no servidor <b>Apocalipse</b>: casas e terrenos gratuitos, farms coletivas e um lugar para cada membro.</p>
        </div></header>
        <div class="miolo">
            <section class="cidade-vitrine">
                <div id="cidade_vitrine" class="cidade-vitrine-palco"><p class="cidade-carregando">Montando a cidade...</p></div>
                <div class="cidade-vitrine-pe">
                    <p class="cidade-rota">Para visitar: <code>/apocalipse</code><i class="fa-solid fa-arrow-right" aria-hidden="true"></i><code>/go ETY</code></p>
                    <a class="botao botao-principal" href="#meu-painel&tela=cidade"><i class="fa-solid fa-house-chimney" aria-hidden="true"></i> É membro? Peça a sua casa no painel</a>
                </div>
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
    carregarVitrine();
}

// Sem WebGL 2 (ou com o relevo desatualizado) a vitrine vira a imagem do mapa.
async function carregarVitrine() {
    const palco = document.getElementById('cidade_vitrine');
    const imagem = () => {
        const versao = encodeURIComponent(cidadePub.dados?.mapa?.versao || '');
        if (palco?.isConnected) palco.innerHTML = `<img class="cidade-vitrine-img" src="${URL_CIDADE_PUBLICA}/mapa?v=${versao}" alt="Mapa da cidade da Eternity">`;
    };
    try {
        cidadePub.dados = await fetch(`${URL_CIDADE_PUBLICA}/publico`).then(lerResposta);
    } catch (error) {
        console.error('Falha ao carregar a cidade:', error);
        if (palco?.isConnected) palco.innerHTML = '<p class="cidade-carregando">Não foi possível carregar a cidade.</p>';
        return;
    }
    if (!palco?.isConnected) return;
    if (!cidade3dPossivel()) return imagem();
    try {
        cidade3d = await montarCidade3d(palco, { vitrine: true });
    } catch (error) {
        console.error('Cidade 3D:', error);
        imagem();
    }
}

// ---------- Painel do membro: mapa e pedido de trust ----------

function cidadeMiolo() {
    return `
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
                            <li><span>Toque em <b>Solicitar trust</b> e envie o pedido. Ele vai direto para os líderes.</span></li>
                            <li><span>Um líder dá o trust no jogo e o bot te avisa no Discord.</span></li>
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
            </section>`;
}

// Chamado depois que o cidadeMiolo() entra na pagina.
function cidadeMontarMapa(nick) {
    cidadeLimpar();
    cidadePub.nick = nick || null;
    carregarCidadePublica();
}

async function carregarCidadePublica() {
    try {
        cidadePub.dados = await fetch(`${URL_CIDADE_PUBLICA}/publico`).then(lerResposta);
        if (!document.getElementById('cidade_mapa')) return;
        contarCidade();
        montarMapaPublico();
        cidade3dPreparar();
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
    if (cidadePub.modo === '3d' && cidade3d) {
        cidade3d.voarPara(alvo);
        return;
    }
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
            <label><span>Seu nick no Minecraft</span><input name="nick" required maxlength="17" autocomplete="off" spellcheck="false" placeholder="Ex.: Ducred22"${cidadePub.nick ? ` value="${escHtml(cidadePub.nick)}" readonly` : ''}></label>
            <label><span>Observação <small>(opcional)</small></span><textarea name="observacao" maxlength="500" rows="2" placeholder="Ex.: vou morar com o meu duo"></textarea></label>
            <p class="cidade-aviso">${cidadePub.nick ? 'O pedido vai direto para os líderes; quando o trust sair, o bot te avisa no Discord.' : 'Você vai receber uma DM do bot da Eternity no Discord vinculado ao nick para confirmar o pedido.'}</p>
            <p class="cidade-erro" hidden></p>
            <button class="botao botao-principal" type="submit">Enviar pedido</button>
        </form>`));
    document.querySelector(cidadePub.nick ? '#cidade_card textarea' : '#cidade_card input[name=nick]')?.focus();
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
        // Logado no painel: o pedido vai com a sessao e direto aos lideres. Sem
        // sessao (rota antiga), o nick digitado e confirmado por DM.
        const sessao = cidadePub.nick && typeof mpLerSessao === 'function' ? mpLerSessao() : null;
        const { nick, status } = await lerResposta(await fetch(`${URL_CIDADE_PUBLICA}/${sessao ? 'painel' : 'publico'}/solicitar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(sessao ? { Authorization: `Bearer ${sessao}` } : {}) },
            body: JSON.stringify({ casa_id: casaId, nick: String(dados.get('nick') || '').trim(), observacao: dados.get('observacao') || '' }),
        }));
        const casa = cidadePub.dados.casas.find(c => c.id === casaId);
        abrirCard(cartaoCasa(casa, status === 'Pendente' ? `
            <div class="cidade-enviado">
                <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
                <div><p><b>Pedido enviado!</b> O pedido de <b>${escHtml(nick)}</b> já está com os líderes. Assim que um líder der o trust no jogo, o bot da Eternity te avisa por DM no Discord.</p></div>
            </div>` : `
            <div class="cidade-enviado">
                <i class="fa-brands fa-discord" aria-hidden="true"></i>
                <div><p><b>Confira o seu Discord.</b> Em instantes o bot da Eternity manda uma DM para <b>${escHtml(nick)}</b>. Confirme por lá em até 30 minutos para o pedido chegar aos líderes.</p>
                <p class="cidade-enviado-nota">DM fechada para o servidor? A confirmação chega num tópico só seu no canal <b>#comandos</b>.</p></div>
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
    // No 3D o ponto e o pino projetado na tela (js/home/cidade-3d.js).
    const em3d = cidadePub.modo === '3d' && cidade3d;
    const ponto = em3d ? cidade3d.pontoNaTela(casa) : cidadePub.mapa.latLngToContainerPoint(blocoPublico(casa.x, casa.z));
    const largura = card.offsetWidth;
    const caixa = em3d ? cidade3d.tamanho() : cidadePub.mapa.getSize();
    const folga = FOLGA_CARD;
    const x = ponto.x + folga + largura <= caixa.x - 8 ? ponto.x + folga : Math.max(8, ponto.x - folga - largura);
    const y = Math.min(Math.max(8, ponto.y - card.offsetHeight / 2), Math.max(8, caixa.y - card.offsetHeight - 8));
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
}
