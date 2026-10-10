// Cidade em 3D (10/10/2026): o mesmo mapa da pagina Cidade, com cada coluna de
// blocos na altura de verdade, so no computador. No celular (ou sem WebGL) fica
// o mapa 2D do Leaflet, que continua sendo montado sempre por baixo.
//
// O relevo e imgs/cidade-3d/altura.png, gerado pelo render-voxelmap.py (repo do
// Harley) junto com o mapa de cor, do mesmo cache: altura + 1024 em R (byte
// alto) e G (byte baixo). A cor e o proprio mapa da API. Mapa novo na API?
// Gere a altura junto e troque CIDADE3D_VERSAO: com a versao diferente da do
// mapa o 3D nao aparece, porque o relevo deixaria de bater com as cores.
//
// Three.js vem por import() so quando o 3D abre; quem nunca abre nao baixa.

const CIDADE3D_VERSAO = '2026-10-06';
const CIDADE3D_ALTURA = '/imgs/cidade-3d/altura.png';
const CIDADE3D_THREE = 'https://cdn.jsdelivr.net/npm/three@0.170.0/+esm';
const CIDADE3D_CONTROLES = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js/+esm';
const CIDADE3D_PREFERENCIA = 'eternity-cidade-modo';

let cidade3d = null;

function cidade3dPossivel() {
    if (!window.matchMedia('(min-width: 1100px) and (pointer: fine)').matches) return false;
    if (cidadePub.dados?.mapa?.versao !== CIDADE3D_VERSAO) return false;
    try {
        const canvas = document.createElement('canvas');
        return Boolean(canvas.getContext('webgl2'));
    } catch (_) {
        return false;
    }
}

// Botoes 2D/3D no canto do mapa. O 3D e o padrao no computador; a escolha fica
// guardada no navegador.
function cidade3dPreparar() {
    cidade3dDescartar();
    const moldura = document.querySelector('.cidade-mapa--publica');
    if (!moldura || !cidade3dPossivel()) return;
    const seletor = document.createElement('div');
    seletor.className = 'cidade-modo';
    seletor.innerHTML = `
        <button type="button" data-modo="2d">2D</button>
        <button type="button" data-modo="3d">3D</button>`;
    seletor.addEventListener('click', event => {
        const modo = event.target.closest('button')?.dataset.modo;
        if (modo) cidadeTrocarModo(modo);
    });
    moldura.appendChild(seletor);
    let preferido = '3d';
    try { preferido = localStorage.getItem(CIDADE3D_PREFERENCIA) || '3d'; } catch (_) { /* sem storage */ }
    cidadeTrocarModo(preferido, { guardar: false });
}

async function cidadeTrocarModo(modo, { guardar = true } = {}) {
    const moldura = document.querySelector('.cidade-mapa--publica');
    if (!moldura) return;
    if (guardar) {
        try { localStorage.setItem(CIDADE3D_PREFERENCIA, modo); } catch (_) { /* sem storage */ }
    }
    for (const botao of moldura.querySelectorAll('.cidade-modo button')) {
        botao.classList.toggle('ativo', botao.dataset.modo === modo);
        botao.setAttribute('aria-pressed', String(botao.dataset.modo === modo));
    }
    fecharCardCasa();
    cidadePub.modo = modo;
    moldura.classList.toggle('em-3d', modo === '3d');
    if (modo !== '3d') {
        cidade3d?.pausar();
        cidadePub.mapa?.invalidateSize();
        return;
    }
    if (cidade3d) {
        cidade3d.retomar();
        return;
    }
    const palco = document.createElement('div');
    palco.className = 'cidade-3d';
    palco.innerHTML = '<p class="cidade-carregando">Montando a cidade em 3D...</p>';
    moldura.insertBefore(palco, moldura.querySelector('.cidade-card'));
    try {
        cidade3d = await montarCidade3d(palco);
    } catch (error) {
        console.error('Cidade 3D:', error);
        palco.remove();
        moldura.querySelector('.cidade-modo')?.remove();
        moldura.classList.remove('em-3d');
        cidadePub.modo = '2d';
        cidadePub.mapa?.invalidateSize();
    }
}

function cidade3dDescartar() {
    cidade3d?.descartar();
    cidade3d = null;
    cidadePub.modo = '2d';
}

// Le o relevo: um Int16Array largura x altura, linha = Z, coluna = X.
async function lerAlturas(largura, altura) {
    const resposta = await fetch(CIDADE3D_ALTURA);
    if (!resposta.ok) throw new Error(`relevo HTTP ${resposta.status}`);
    const imagem = await createImageBitmap(await resposta.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
    if (imagem.width !== largura || imagem.height !== altura) throw new Error('relevo de outro tamanho que o mapa');
    const canvas = new OffscreenCanvas(largura, altura);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imagem, 0, 0);
    const px = ctx.getImageData(0, 0, largura, altura).data;
    const alturas = new Int16Array(largura * altura);
    for (let i = 0; i < alturas.length; i++) alturas[i] = px[i * 4] * 256 + px[i * 4 + 1] - 1024;
    return alturas;
}

// Arrays que crescem sozinhos (a malha passa de um milhao de vertices).
function crescente(Tipo, inicial) {
    let dados = new Tipo(inicial);
    let n = 0;
    return {
        push(...valores) {
            if (n + valores.length > dados.length) {
                const maior = new Tipo(Math.max(dados.length * 2, n + valores.length));
                maior.set(dados);
                dados = maior;
            }
            for (const v of valores) dados[n++] = v;
        },
        get tamanho() { return n; },
        pronto() { return dados.subarray(0, n); },
    };
}

// Malha em blocos: o topo de cada coluna e um quadrado na altura dela, e onde
// duas colunas vizinhas tem alturas diferentes sobe uma parede. Colunas
// seguidas na mesma altura viram um quadrado so (idem paredes), o que corta a
// malha a uma fracao. A cor vem da textura do mapa: o topo usa o pixel da
// propria coluna e a parede o da coluna mais alta. Em volta, uma saia ate a
// base fecha a maquete.
function malhaCidade(THREE, alturas, W, D, base) {
    const pos = crescente(Float32Array, 1 << 20);
    const nor = crescente(Float32Array, 1 << 20);
    const uv = crescente(Float32Array, 1 << 19);
    const idx = crescente(Uint32Array, 1 << 20);
    const h = (x, z) => alturas[z * W + x] - base;

    function quad(a, b, c, d, normal, uvs) {
        const v0 = pos.tamanho / 3;
        pos.push(...a, ...b, ...c, ...d);
        for (let i = 0; i < 4; i++) nor.push(...normal);
        uv.push(...uvs);
        idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
    }

    // Topos.
    for (let z = 0; z < D; z++) {
        let x = 0;
        while (x < W) {
            const y = h(x, z);
            let fim = x + 1;
            while (fim < W && h(fim, z) === y) fim++;
            const u0 = x / W, u1 = fim / W, v0 = z / D, v1 = (z + 1) / D;
            quad([x, y, z], [x, y, z + 1], [fim, y, z + 1], [fim, y, z], [0, 1, 0], [u0, v0, u0, v1, u1, v1, u1, v0]);
            x = fim;
        }
    }

    // Paredes entre linhas (plano z constante), em corrida ao longo de x.
    for (let z = 0; z <= D; z++) {
        let x = 0;
        while (x < W) {
            const norte = z > 0 ? h(x, z - 1) : 0;
            const sul = z < D ? h(x, z) : 0;
            if (norte === sul) { x++; continue; }
            let fim = x + 1;
            while (fim < W && (z > 0 ? h(fim, z - 1) : 0) === norte && (z < D ? h(fim, z) : 0) === sul) fim++;
            const alto = Math.max(norte, sul), baixo = Math.min(norte, sul);
            const linhaAlta = norte > sul ? z - 1 : z;
            const v = (linhaAlta + 0.5) / D, u0 = x / W, u1 = fim / W;
            if (norte > sul) {
                quad([x, baixo, z], [fim, baixo, z], [fim, alto, z], [x, alto, z], [0, 0, 1], [u0, v, u1, v, u1, v, u0, v]);
            } else {
                quad([fim, baixo, z], [x, baixo, z], [x, alto, z], [fim, alto, z], [0, 0, -1], [u1, v, u0, v, u0, v, u1, v]);
            }
            x = fim;
        }
    }

    // Paredes entre colunas (plano x constante), em corrida ao longo de z.
    for (let x = 0; x <= W; x++) {
        let z = 0;
        while (z < D) {
            const oeste = x > 0 ? h(x - 1, z) : 0;
            const leste = x < W ? h(x, z) : 0;
            if (oeste === leste) { z++; continue; }
            let fim = z + 1;
            while (fim < D && (x > 0 ? h(x - 1, fim) : 0) === oeste && (x < W ? h(x, fim) : 0) === leste) fim++;
            const alto = Math.max(oeste, leste), baixo = Math.min(oeste, leste);
            const colunaAlta = oeste > leste ? x - 1 : x;
            const u = (colunaAlta + 0.5) / W, v0 = z / D, v1 = fim / D;
            if (oeste > leste) {
                quad([x, baixo, fim], [x, baixo, z], [x, alto, z], [x, alto, fim], [1, 0, 0], [u, v1, u, v0, u, v0, u, v1]);
            } else {
                quad([x, baixo, z], [x, baixo, fim], [x, alto, fim], [x, alto, z], [-1, 0, 0], [u, v0, u, v1, u, v1, u, v0]);
            }
            z = fim;
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos.pronto(), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor.pronto(), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv.pronto(), 2));
    geo.setIndex(new THREE.BufferAttribute(idx.pronto(), 1));
    geo.computeBoundingSphere();
    return geo;
}

function carregarTextura(THREE, url) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(url, resolve, undefined, () => reject(new Error('mapa de cor nao carregou')));
    });
}

const CIDADE3D_COR_LOCAL = '#ffd23f';

async function montarCidade3d(palco) {
    const [THREE, { OrbitControls }] = await Promise.all([import(CIDADE3D_THREE), import(CIDADE3D_CONTROLES)]);
    const { mapa, casas, locais = [] } = cidadePub.dados;
    const W = mapa.largura, D = mapa.altura;
    // O mapa 2D usa o mesmo endereco sem CORS; o sufixo evita o navegador
    // reaproveitar aquela copia (sem o cabecalho) para a textura.
    const [alturas, textura] = await Promise.all([
        lerAlturas(W, D),
        carregarTextura(THREE, `${URL_CIDADE_PUBLICA}/mapa?v=${encodeURIComponent(mapa.versao || '')}&uso=3d`),
    ]);
    if (!palco.isConnected) throw new Error('pagina trocada durante a montagem');

    let minimo = Infinity;
    for (const a of alturas) if (a < minimo) minimo = a;
    const base = minimo - 6;

    textura.colorSpace = THREE.SRGBColorSpace;
    textura.flipY = false;
    textura.magFilter = THREE.NearestFilter;
    textura.minFilter = THREE.LinearMipmapLinearFilter;
    textura.generateMipmaps = true;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    textura.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const cena = new THREE.Scene();
    cena.fog = new THREE.Fog(0x070d16, 1400, 3200);

    const geo = malhaCidade(THREE, alturas, W, D, base);
    const cidade = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: textura }));
    cena.add(cidade);

    // Fundo da maquete: uma placa escura logo abaixo da saia.
    const placa = new THREE.Mesh(new THREE.BoxGeometry(W + 24, 4, D + 24), new THREE.MeshLambertMaterial({ color: 0x0f1c2b }));
    placa.position.set(W / 2, -2, D / 2);
    cena.add(placa);

    cena.add(new THREE.HemisphereLight(0xe8f4f8, 0x16283b, 1.6));
    const sol = new THREE.DirectionalLight(0xffffff, 1.4);
    sol.position.set(-0.6, 1, -0.35);
    cena.add(sol);

    // Marcas: pontos planos virados para a camera, do mesmo tamanho na tela de
    // perto e de longe, um pouco acima do telhado. Casa e redonda, terreno e
    // quadrado e local e um losango dourado; livre ganha um miolo branco. As
    // bolas com haste de antes cresciam com a distancia e cobriam a cidade.
    const alturaEm = (x, z) => {
        const cx = Math.min(W - 1, Math.max(0, x - mapa.x0)), cz = Math.min(D - 1, Math.max(0, z - mapa.z0));
        return alturas[cz * W + cx] - base;
    };
    // A marca fica sobre o bloco mais alto num raio de 3: a coordenada da casa
    // as vezes cai num vao (patio, buraco no telhado) e as paredes em volta a
    // escondiam.
    const alturaMarca = alvo => {
        let maior = -Infinity;
        for (let dz = -3; dz <= 3; dz++) {
            for (let dx = -3; dx <= 3; dx++) maior = Math.max(maior, alturaEm(alvo.x + dx, alvo.z + dz));
        }
        return maior;
    };
    const marcas = new THREE.Group();
    const cabecas = [];
    const texturas = new Map();
    function texturaMarca(forma, cor, livre) {
        const chave = `${forma}|${cor}|${livre}`;
        if (texturas.has(chave)) return texturas.get(chave);
        const t = 64, c = t / 2;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = t;
        const ctx = canvas.getContext('2d');
        const brilho = ctx.createRadialGradient(c, c, 4, c, c, c);
        brilho.addColorStop(0, `${cor}40`);
        brilho.addColorStop(1, `${cor}00`);
        ctx.fillStyle = brilho;
        ctx.fillRect(0, 0, t, t);
        const r = 13;
        ctx.beginPath();
        if (forma === 'terreno') ctx.rect(c - r + 2, c - r + 2, (r - 2) * 2, (r - 2) * 2);
        else if (forma === 'local') { ctx.moveTo(c, c - r - 3); ctx.lineTo(c + r + 1, c); ctx.lineTo(c, c + r + 3); ctx.lineTo(c - r - 1, c); ctx.closePath(); }
        else ctx.arc(c, c, r, 0, Math.PI * 2);
        ctx.fillStyle = cor;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(7, 13, 22, 0.9)';
        ctx.stroke();
        if (livre) {
            ctx.beginPath();
            ctx.arc(c, c, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
        const textura = new THREE.CanvasTexture(canvas);
        textura.colorSpace = THREE.SRGBColorSpace;
        texturas.set(chave, textura);
        return textura;
    }
    const TAMANHO_MARCA = 0.044;
    function marca(alvo, forma, cor, dica, livre = false) {
        const material = new THREE.SpriteMaterial({ map: texturaMarca(forma, cor, livre), sizeAttenuation: false, depthWrite: false, transparent: true });
        const ponto = new THREE.Sprite(material);
        ponto.scale.setScalar(TAMANHO_MARCA);
        ponto.renderOrder = 10;
        ponto.position.set(alvo.x - mapa.x0 + 0.5, alturaMarca(alvo) + 3, alvo.z - mapa.z0 + 0.5);
        ponto.userData = { alvo, dica };
        marcas.add(ponto);
        cabecas.push(ponto);
    }
    for (const casa of casas) {
        const estado = CASA_ESTADOS[casa.estado] || CASA_ESTADOS.fechada;
        const cor = casa.tipo === 'terreno' && casa.estado === 'aberta' ? CIDADE_COR_TERRENO_LIVRE : estado.cor;
        const dica = casa.moradores.length ? casa.moradores.join(', ') : `${cidadeRotuloTipo(casa.tipo)} · ${estado.rotulo.toLowerCase()}`;
        marca({ ...casa, tipoAlvo: 'casa' }, casa.tipo === 'terreno' ? 'terreno' : 'casa', cor, dica, casa.estado === 'aberta');
    }
    for (const local of locais) marca({ ...local, tipoAlvo: 'local' }, 'local', CIDADE3D_COR_LOCAL, local.nome);
    cena.add(marcas);

    const camera = new THREE.PerspectiveCamera(42, 1, 1, 6000);
    const meio = new THREE.Vector3(W / 2, 70 - base, D / 2);
    camera.position.set(W / 2 + 260, 620, D + 520);
    const controles = new OrbitControls(camera, renderer.domElement);
    controles.target.copy(meio);
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.screenSpacePanning = false;
    controles.zoomToCursor = true;
    controles.minDistance = 25;
    controles.maxDistance = 2200;
    controles.maxPolarAngle = 1.38;
    controles.update();

    palco.innerHTML = '';
    palco.appendChild(renderer.domElement);
    const dica = document.createElement('div');
    dica.className = 'cidade-3d-dica';
    dica.hidden = true;
    palco.appendChild(dica);
    const ajuda = document.createElement('p');
    ajuda.className = 'cidade-3d-ajuda';
    ajuda.innerHTML = '<i class="fa-solid fa-computer-mouse" aria-hidden="true"></i> Arraste para girar · botão direito para mover · roda para aproximar';
    palco.appendChild(ajuda);

    function ajustarTamanho() {
        const { clientWidth: largura, clientHeight: altura } = palco;
        if (!largura || !altura) return;
        renderer.setSize(largura, altura, false);
        camera.aspect = largura / altura;
        camera.updateProjectionMatrix();
        pedirQuadro();
    }
    const observador = new ResizeObserver(ajustarTamanho);
    observador.observe(palco);

    // Desenha so quando algo muda (camera, voo, foco): parado, a placa de video
    // descansa.
    let quadroPedido = false;
    let pausado = false;
    let voo = null;
    function pedirQuadro() {
        if (quadroPedido || pausado) return;
        quadroPedido = true;
        requestAnimationFrame(quadro);
    }
    function quadro(agora) {
        quadroPedido = false;
        if (!renderer.domElement.isConnected) {
            descartar();
            return;
        }
        if (voo) {
            const t = Math.min(1, (agora - voo.inicio) / voo.duracao);
            const s = t * t * (3 - 2 * t);
            controles.target.lerpVectors(voo.deAlvo, voo.paraAlvo, s);
            camera.position.lerpVectors(voo.dePos, voo.paraPos, s);
            if (t >= 1) voo = null;
        }
        const mexeu = controles.update();
        // O centro nao sai de cima da cidade.
        controles.target.x = Math.min(W, Math.max(0, controles.target.x));
        controles.target.z = Math.min(D, Math.max(0, controles.target.z));
        // Longe, as marcas encolhem ate a metade (a visao geral fica limpa); perto,
        // ficam no tamanho cheio. A que esta sob o mouse cresce em volta do
        // proprio centro, entao continua sob o cursor.
        // A do card aberto aparece sempre, por cima de qualquer predio.
        const aberto = cidadePub.alvo;
        for (const ponto of cabecas) {
            const alvo = ponto.userData.alvo;
            const selecionado = Boolean(aberto) && aberto.id === alvo.id && ('moradores' in aberto) === (alvo.tipoAlvo === 'casa');
            const perto = Math.min(1, Math.max(0.5, 300 / camera.position.distanceTo(ponto.position)));
            ponto.scale.setScalar(TAMANHO_MARCA * perto * (ponto === sobre || selecionado ? 1.5 : 1));
            ponto.material.depthTest = !selecionado;
            ponto.renderOrder = selecionado ? 20 : 10;
        }
        renderer.render(cena, camera);
        posicionarCard();
        if (mexeu || voo) pedirQuadro();
    }
    controles.addEventListener('change', pedirQuadro);

    // Passar o mouse num pino mostra o nome; clicar abre o card dele.
    const raio = new THREE.Raycaster();
    const ponteiro = new THREE.Vector2();
    let sobre = null;
    let arrasto = null;
    function cabecaEm(event) {
        const caixa = renderer.domElement.getBoundingClientRect();
        ponteiro.set(((event.clientX - caixa.left) / caixa.width) * 2 - 1, -((event.clientY - caixa.top) / caixa.height) * 2 + 1);
        raio.setFromCamera(ponteiro, camera);
        return raio.intersectObjects(cabecas, false)[0]?.object || null;
    }
    function destacar(cabeca) {
        if (sobre === cabeca) return;
        sobre = cabeca;
        renderer.domElement.style.cursor = sobre ? 'pointer' : '';
        pedirQuadro();
    }
    renderer.domElement.addEventListener('pointermove', event => {
        const cabeca = cabecaEm(event);
        destacar(cabeca);
        if (cabeca) {
            const caixa = palco.getBoundingClientRect();
            dica.textContent = cabeca.userData.dica;
            dica.style.left = `${event.clientX - caixa.left}px`;
            dica.style.top = `${event.clientY - caixa.top}px`;
            dica.hidden = false;
        } else {
            dica.hidden = true;
        }
    });
    renderer.domElement.addEventListener('pointerleave', () => { destacar(null); dica.hidden = true; });
    renderer.domElement.addEventListener('pointerdown', event => {
        arrasto = { x: event.clientX, y: event.clientY };
        dica.hidden = true;
    });
    renderer.domElement.addEventListener('pointerup', event => {
        if (!arrasto || Math.hypot(event.clientX - arrasto.x, event.clientY - arrasto.y) > 5) return;
        const cabeca = cabecaEm(event);
        if (!cabeca) {
            fecharCardCasa();
            return;
        }
        const alvo = cabeca.userData.alvo;
        if (alvo.tipoAlvo === 'local') focarLocal(alvo.id);
        else focarCasa(alvo.id);
    });

    function voarPara(alvo) {
        const destino = new THREE.Vector3(alvo.x - mapa.x0 + 0.5, alturaMarca(alvo), alvo.z - mapa.z0 + 0.5);
        // Mesmo angulo de agora, mais perto.
        const direcao = camera.position.clone().sub(controles.target).normalize();
        const distancia = Math.min(camera.position.distanceTo(controles.target), 160);
        voo = {
            inicio: performance.now(),
            duracao: 700,
            deAlvo: controles.target.clone(),
            paraAlvo: destino,
            dePos: camera.position.clone(),
            paraPos: destino.clone().add(direcao.multiplyScalar(distancia)),
        };
        pedirQuadro();
    }

    // Ponto do alvo na tela, em pixels do palco (para o card ao lado).
    function pontoNaTela(alvo) {
        const p = new THREE.Vector3(alvo.x - mapa.x0 + 0.5, alturaMarca(alvo) + 3, alvo.z - mapa.z0 + 0.5).project(camera);
        return { x: (p.x + 1) / 2 * palco.clientWidth, y: (1 - p.y) / 2 * palco.clientHeight };
    }

    function descartar() {
        observador.disconnect();
        controles.dispose();
        geo.dispose();
        textura.dispose();
        cidade.material.dispose();
        for (const ponto of cabecas) ponto.material.dispose();
        for (const textura of texturas.values()) textura.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
    }

    ajustarTamanho();
    return {
        voarPara,
        pontoNaTela,
        tamanho: () => ({ x: palco.clientWidth, y: palco.clientHeight }),
        pausar() { pausado = true; },
        retomar() { pausado = false; ajustarTamanho(); pedirQuadro(); },
        descartar,
    };
}
