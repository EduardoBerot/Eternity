// Marcadores do mapa da cidade, comuns ao painel (js/painel/cidade.js) e ao
// site publico (js/home/cidade.js), 06/10/2026. Casa e um circulo, terreno um
// quadrado (verde forte quando livre) e local importante um icone do Font
// Awesome escolhido pela staff. Tudo e divIcon do Leaflet, que nao repassa o
// clique ao mapa.

const CIDADE_COR_TERRENO_LIVRE = '#0f9d3a';

// Mesmas chaves e rotulos de ICONES_LOCAL no backend (cidade.service.js); o
// painel recebe a lista dele, isto e so o rotulo do card publico.
function cidadeIconeClasse(chave) {
    return `fa-solid fa-${String(chave || 'star').replace(/[^a-z0-9-]/g, '')}`;
}

// `tipo`: 'casa' | 'terreno'. `destaque`: um pouco maior (livre para pedir).
// `pendente`: pedido esperando um lider (so no painel). Maior, com anel
// pulsando e selo de ampulheta: o tracejado de antes sumia no mapa (09/10/2026).
function cidadeMarcaCasa(latlng, { tipo, cor, destaque = false, pendente = false }) {
    const tamanho = pendente ? 20 : destaque ? 18 : 14;
    const classes = ['cidade-pino', tipo === 'terreno' ? 'cidade-pino--terreno' : '', pendente ? 'cidade-pino--pendente' : ''].join(' ');
    const selo = pendente ? '<i class="cidade-pino-selo fa-solid fa-hourglass-half" aria-hidden="true"></i>' : '';
    return L.marker(latlng, {
        icon: L.divIcon({
            className: 'cidade-pino-caixa',
            html: `<span class="${classes}" style="--cor:${cor}">${selo}</span>`,
            iconSize: [tamanho, tamanho],
            iconAnchor: [tamanho / 2, tamanho / 2],
        }),
        riseOnHover: true,
        zIndexOffset: pendente ? 400 : 0,
    });
}

function cidadeMarcaLocal(latlng, icone) {
    return L.marker(latlng, {
        icon: L.divIcon({
            className: 'cidade-pino-caixa',
            html: `<span class="cidade-local"><i class="${cidadeIconeClasse(icone)}" aria-hidden="true"></i></span>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
        }),
        riseOnHover: true,
        zIndexOffset: 500,
    });
}

// A caixa do mapa tem a proporcao do PNG (css/cidade.css, --proporcao): o zoom
// que cobre a caixa mostra a cidade inteira, sem faixa preta e sem corte.
function cidadeProporcao(elemento, largura, altura) {
    elemento?.style.setProperty('--proporcao', String(largura / altura));
}

// Zoom que cobre a caixa inteira com o mapa (09/10/2026). Vira o zoom minimo,
// e o arraste para nas bordas da imagem. Devolve o zoom de cobertura, ou null
// com a caixa ainda sem tamanho.
function cidadeAjustarZoomMinimo(mapa, limites) {
    const tamanho = mapa.getSize();
    if (!tamanho.x || !tamanho.y) return null;
    const cobre = mapa.getBoundsZoom(limites, true);
    mapa.setMinZoom(cobre);
    if (mapa.getZoom() < cobre) mapa.setZoom(cobre, { animate: false });
    return cobre;
}

// A cidade inteira na caixa. Devolve false com a caixa ainda sem tamanho (aba
// escondida).
function cidadeEnquadrar(mapa, limites) {
    const cobre = cidadeAjustarZoomMinimo(mapa, limites);
    if (cobre === null) return false;
    mapa.setView(L.latLngBounds(limites).getCenter(), cobre, { animate: false });
    return true;
}

function cidadeRotuloTipo(tipo) {
    return tipo === 'terreno' ? 'Terreno' : 'Casa';
}
