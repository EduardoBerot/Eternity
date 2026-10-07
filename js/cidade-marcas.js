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
// `pendente`: borda tracejada (pedido esperando um lider, so no painel).
function cidadeMarcaCasa(latlng, { tipo, cor, destaque = false, pendente = false }) {
    const tamanho = destaque ? 18 : 14;
    const classes = ['cidade-pino', tipo === 'terreno' ? 'cidade-pino--terreno' : '', pendente ? 'cidade-pino--pendente' : ''].join(' ');
    return L.marker(latlng, {
        icon: L.divIcon({
            className: 'cidade-pino-caixa',
            html: `<span class="${classes}" style="--cor:${cor}"></span>`,
            iconSize: [tamanho, tamanho],
            iconAnchor: [tamanho / 2, tamanho / 2],
        }),
        riseOnHover: true,
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

function cidadeRotuloTipo(tipo) {
    return tipo === 'terreno' ? 'Terreno' : 'Casa';
}
