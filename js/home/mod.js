// Tela "Mod" do painel do membro (16/11/2026, Fundador): so para quem esta
// logado. Baixar o instalador, o passo a passo e o que vem no mod. Os arquivos
// ficam no GitHub Releases (link fixo "latest"); a versao vem da API do GitHub,
// que libera CORS. Se ela falhar, a tela funciona sem o numero.

const MOD_REPO = 'EduardoBerot/eternity-instalador';
const MOD_LATEST = `https://github.com/${MOD_REPO}/releases/latest/download/`;

// ---------- Convite aos novatos (17/11/2026, Fundador) ----------
// O mod e opcional, mas todo membro precisa saber que ele existe. Quem ainda nao
// abriu o jogo com ele ve um cartao no Inicio (com "Agora nao", que some de vez
// neste navegador) e uma etapa bonus no dia 1 da Jornada, que nao conta para
// completar. "Ja usa" vem da API: login no painel do J ou o nick que o mod
// 0.16.1+ manda ao abrir o jogo.
const MOD_CHAVE_DISPENSA = 'ety-mod-convite-dispensado';

async function mpCarregarMod() {
    try {
        const resposta = await fetch(`${URL_PAINEL_MEMBRO}/mod`, { headers: { Authorization: `Bearer ${mpLerSessao()}` } });
        if (!resposta.ok) return;
        mpEstado.mod = await resposta.json();
    } catch { return; }
    if (location.hash.startsWith('#meu-painel') && mpEstado.dados && ['inicio', 'jornada'].includes(mpEstado.tela)) mpRedesenharTela();
}

function mpModDispensado() {
    try { return localStorage.getItem(MOD_CHAVE_DISPENSA) === '1'; } catch { return false; }
}

function mpDispensarMod() {
    try { localStorage.setItem(MOD_CHAVE_DISPENSA, '1'); } catch { /* some so nesta visita */ }
    mpEstado.modDispensado = true;
    window.etyTelemetria?.acao('mod_agora_nao');
    mpRedesenharTela();
}

function mpCartaoModInicio() {
    if (!mpEstado.mod || mpEstado.mod.usa || mpEstado.modDispensado || mpModDispensado()) return '';
    return `<section class="ficha-painel jornada-chamada mod-convite" onclick="window.etyTelemetria?.acao('mod_convite'); mpIr('mod')">
        <div class="jornada-chamada-selo"><img src="imgs/mod-icone.png" alt="" width="40" height="40"></div>
        <div class="jornada-chamada-texto">
            <h3>Mod Eternity <small>opcional</small></h3>
            <p>O clã dentro do Minecraft: aperte <b>J</b> e veja a Liga, o banco, a Jornada e o seu perfil sem sair do jogo. Vem com a textura do clã e mais FPS.</p>
        </div>
        <div class="mod-convite-acoes">
            <button type="button" class="mp-acao" onclick="event.stopPropagation(); window.etyTelemetria?.acao('mod_convite'); mpIr('mod')"><i class="fa-solid fa-download" aria-hidden="true"></i> Conhecer o mod</button>
            <button type="button" class="mp-link" onclick="event.stopPropagation(); mpDispensarMod()">Agora não</button>
        </div>
    </section>`;
}

/** Etapa bonus do dia 1: opcional, fica de fora da contagem da missao. */
function mpBonusMod() {
    const usa = Boolean(mpEstado.mod?.usa);
    return `<ul class="jornada-etapas jornada-bonus">
        <li class="${usa ? 'feita' : ''}">
            <i class="fa-solid ${usa ? 'fa-circle-check' : 'fa-download'}" aria-hidden="true"></i>
            <span><em class="jornada-bonus-selo">Bônus</em> Instale o mod do clã${usa ? '' : `<small>Opcional, não conta para a missão. <a href="#meu-painel&tela=mod" onclick="event.preventDefault(); window.etyTelemetria?.acao('mod_convite'); mpIr('mod')">Ver o mod</a></small>`}</span>
        </li>
    </ul>`;
}

const MOD_RECURSOS = [
    ['fa-table-columns', 'Painel do clã', 'Aperte J no jogo: Liga, torneios, banco, ranking, agenda, anúncios e o seu perfil com os títulos.'],
    ['fa-shield-halved', 'Armadura por cor', 'Verde, amarelo e vermelho pela durabilidade, na sua e na dos outros. Bigorna quando ficar vermelha.'],
    ['fa-apple-whole', 'Aviso de cap', 'Em combate e com pouca absorção, o ícone da cap aparece com quantas ainda sobram.'],
    ['fa-heart', 'Vida dos players', 'Corações em cima do nome de quem está perto, com a absorção em dourado.'],
    ['fa-up-down-left-right', 'HUD do seu jeito', 'Armadura ao lado da hotbar e as poções onde você quiser.'],
    ['fa-palette', 'Textura Eternity', 'O Eternity v3 Texture Pack vem dentro do mod e já entra ligado.'],
    ['fa-gauge-high', 'Mais FPS', 'Sodium, Lithium, FerriteCore, EntityCulling, MoreCulling, Krypton e C2ME.'],
];

const MOD_LAUNCHERS = [
    ['Oficial', 'perfil “Eternity”', true],
    ['SKLauncher', 'versão fabric-loader do instalador', true],
    ['Prism', 'instância “Eternity”', true],
    ['Dawn', 'seu perfil Fabric', true],
    ['Lunar / Badlion', 'não aceitam mods de fora', false],
];

const MOD_ATALHOS = [
    [['J'], 'Abre o painel do clã'],
    [['J', 'C'], 'Liga ou desliga o aviso da cap'],
    [['J', 'B'], 'Liga ou desliga a bigorna da armadura'],
    [['J', 'V'], 'Liga ou desliga a vida em cima dos players'],
];

function mpTelaMod() {
    const tecla = t => `<kbd>${t}</kbd>`;
    return `
    <div class="mod-tela">
        <section class="mod-heroi">
            <div class="mod-heroi-brilho" aria-hidden="true"></div>
            <img class="mod-heroi-icone" src="imgs/mod-icone.png" alt="" width="120" height="120">
            <div class="mod-heroi-texto">
                <small>Exclusivo para membros</small>
                <h1>Mod Eternity</h1>
                <p>O clã dentro do Minecraft: painel, textura, ajudas de PvP e mais FPS, num instalador só.</p>
                <div class="mod-heroi-acoes">
                    <a class="mod-baixar" href="${MOD_LATEST}Eternity-Instalador.exe" onclick="window.etyTelemetria?.acao('baixar_mod')">
                        <span class="mod-baixar-icone"><i class="fa-solid fa-download" aria-hidden="true"></i></span>
                        <span class="mod-baixar-texto"><b>Baixar o instalador</b><small>Windows · grátis · 40 KB</small></span>
                    </a>
                    <span class="mod-chip" id="mod-versao"><i class="fa-solid fa-code-branch" aria-hidden="true"></i> Fabric</span>
                </div>
            </div>
        </section>

        <section class="mod-opcoes" aria-label="Formas de baixar">
            <article class="mod-opcao recomendada">
                <span class="mod-opcao-selo">Recomendado</span>
                <h3><i class="fa-solid fa-box-open" aria-hidden="true"></i> Instalador completo</h3>
                <p>Para quem está começando: instala o Fabric, o mod Eternity com a textura e os mods de desempenho no seu launcher.</p>
                <a class="mod-opcao-link" href="${MOD_LATEST}Eternity-Instalador.exe" onclick="window.etyTelemetria?.acao('baixar_mod')"><i class="fa-solid fa-download" aria-hidden="true"></i> Eternity-Instalador.exe</a>
            </article>
            <article class="mod-opcao">
                <h3><i class="fa-solid fa-puzzle-piece" aria-hidden="true"></i> Só o mod Eternity</h3>
                <p>Já tem o seu Fabric com mods? Baixe só o <b>.jar</b> do clã da sua versão do Minecraft e coloque na pasta <code>mods</code>, junto com os seus.</p>
                <a class="mod-opcao-link secundario" href="#meu-painel&tela=mod-versoes" onclick="event.preventDefault(); mpIr('mod-versoes')"><i class="fa-solid fa-list" aria-hidden="true"></i> Ver as versões</a>
                <ul class="mod-requisitos">
                    <li>Pegue o jar com a sua versão do Minecraft no nome, com <b>Fabric Loader 0.19.5</b> ou mais novo</li>
                    <li><a href="https://modrinth.com/mod/fabric-api/versions" target="_blank" rel="noopener">Fabric API</a> da mesma versão do Minecraft na mesma pasta</li>
                    <li>Apague o jar antigo do Eternity ao atualizar (só pode ter um)</li>
                    <li>A textura já vem dentro do mod: tire os packs Eternity antigos da lista</li>
                </ul>
            </article>
        </section>

        <section class="mod-bloco">
            <h2><i class="fa-solid fa-list-check" aria-hidden="true"></i> Como instalar</h2>
            <ol class="mod-passos">
                <li>
                    <span class="mod-passo-num">1</span>
                    <div><b>Baixe e abra</b> o <code>Eternity-Instalador.exe</code>.</div>
                </li>
                <li>
                    <span class="mod-passo-num">2</span>
                    <div>
                        <b>Passe pelo aviso do Windows.</b> Ele aparece porque o instalador não tem assinatura paga, não porque tem vírus.
                        <div class="mod-smartscreen" aria-hidden="true">
                            <div class="mod-ss-topo">O Windows protegeu o computador</div>
                            <div class="mod-ss-corpo">O Microsoft Defender SmartScreen impediu a inicialização de um aplicativo não reconhecido.<br><u class="mod-ss-alvo">Mais informações</u></div>
                            <div class="mod-ss-botoes"><span class="mod-ss-alvo">Executar assim mesmo</span><span>Não executar</span></div>
                        </div>
                        <small class="mod-dica">Clique em <b>Mais informações</b> e depois em <b>Executar assim mesmo</b>.</small>
                    </div>
                </li>
                <li>
                    <span class="mod-passo-num">3</span>
                    <div><b>Escolha a versão do Minecraft e o seu launcher</b> (ele já marca os que achou no PC) e clique em <b>Instalar</b>.</div>
                </li>
                <li>
                    <span class="mod-passo-num">4</span>
                    <div><b>Abra o jogo</b> pelo launcher e aperte ${tecla('J')} dentro do servidor.</div>
                </li>
            </ol>
            <div class="mod-launchers">
                ${MOD_LAUNCHERS.map(([nome, onde, ok]) => `
                <div class="mod-launcher ${ok ? '' : 'nao'}">
                    <i class="fa-solid ${ok ? 'fa-circle-check' : 'fa-circle-xmark'}" aria-hidden="true"></i>
                    <span><b>${nome}</b><small>${onde}</small></span>
                </div>`).join('')}
            </div>
        </section>

        <section class="mod-bloco">
            <h2><i class="fa-solid fa-cube" aria-hidden="true"></i> O que vem no mod</h2>
            <div class="mod-recursos">
                ${MOD_RECURSOS.map(([icone, titulo, texto]) => `
                <article class="mod-recurso">
                    <span class="mod-recurso-icone"><i class="fa-solid ${icone}" aria-hidden="true"></i></span>
                    <h3>${titulo}</h3>
                    <p>${texto}</p>
                </article>`).join('')}
            </div>
        </section>

        <div class="mod-duas">
            <section class="mod-bloco">
                <h2><i class="fa-solid fa-keyboard" aria-hidden="true"></i> Atalhos</h2>
                <ul class="mod-atalhos">
                    ${MOD_ATALHOS.map(([teclas, o_que]) => `<li><span class="mod-teclas">${teclas.map(tecla).join('<i>+</i>')}</span><span>${o_que}</span></li>`).join('')}
                </ul>
                <small class="mod-dica">Segure o J e aperte a outra tecla. As mesmas opções ficam na aba HUD do painel do jogo.</small>
            </section>
            <section class="mod-bloco">
                <h2><i class="fa-solid fa-life-ring" aria-hidden="true"></i> Ajuda</h2>
                <ul class="mod-ajuda">
                    <li><b>Já tenho Fabric.</b> Em <a href="#meu-painel&tela=mod-versoes" onclick="event.preventDefault(); mpIr('mod-versoes')">Versões do mod</a>, pegue o jar ou o <code>.mrpack</code> (Prism ou Modrinth App) da sua versão do Minecraft.</li>
                    <li><b>Atualizar.</b> Rode o instalador de novo: ele troca só o que mudou.</li>
                    <li><b>Deu erro?</b> Mande um print da janela do instalador para a staff no <a href="https://discord.gg/vj4eNDJqct" target="_blank" rel="noopener">Discord</a>.</li>
                </ul>
            </section>
        </div>
    </div>`;
}

function mpModDepois() {
    fetch(`https://api.github.com/repos/${MOD_REPO}/releases/latest`)
        .then(r => r.ok ? r.json() : null)
        .then(rel => {
            const el = document.getElementById('mod-versao');
            if (!rel || !el) return;
            const data = new Date(rel.published_at).toLocaleDateString('pt-BR');
            el.innerHTML = `<i class="fa-solid fa-code-branch" aria-hidden="true"></i> Versão ${escHtml(String(rel.tag_name).replace(/^v/, ''))} · ${data}`;
        })
        .catch(() => {});
}

// ---------- Versoes do mod (20/11/2026) ----------
// Para quem instala so o mod: um cartao por versao do Minecraft com o jar, o
// .mrpack e a Fabric API certa, sem mandar para o GitHub. Le a release mais nova
// pela API do GitHub (a unica fonte com CORS; o instalador.json nao tem). Os
// jars tem a versao do jogo no nome (eternity-mod-0.19.0+26.2.jar); o mrpack sem
// sufixo (Eternity.mrpack) e o da versao que nao tem um com sufixo.

function mpTelaModVersoes() {
    return `
    <div class="mod-tela">
        <a class="mod-voltar" href="#meu-painel&tela=mod" onclick="event.preventDefault(); mpIr('mod')"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Mod</a>
        <div class="jogo-cabeca">
            <h1>Versões do mod</h1>
            <p>Para quem já tem o Fabric e quer instalar só o mod do clã. Escolha a versão do Minecraft em que você joga.</p>
        </div>
        <div class="mod-versoes" id="mod-versoes" aria-live="polite">
            <div class="mod-versoes-aviso"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Buscando as versões...</div>
        </div>
        <section class="mod-bloco">
            <h2><i class="fa-solid fa-list-check" aria-hidden="true"></i> Como instalar só o mod</h2>
            <ol class="mod-passos">
                <li><span class="mod-passo-num">1</span><div>Baixe o <b>mod</b> e a <b>Fabric API</b> da sua versão do Minecraft.</div></li>
                <li><span class="mod-passo-num">2</span><div>Coloque os dois na pasta <code>mods</code> do seu perfil Fabric (<b>Fabric Loader 0.19.5</b> ou mais novo).</div></li>
                <li><span class="mod-passo-num">3</span><div>Ao atualizar, apague o jar antigo do Eternity: só pode ter um. Depois disso o mod se atualiza sozinho.</div></li>
            </ol>
            <small class="mod-dica">No Prism ou no Modrinth App, importe o <b>modpack</b>: ele já traz o mod, a Fabric API e os mods de desempenho. A textura do clã vem dentro do mod; tire os packs Eternity antigos da lista.</small>
        </section>
    </div>`;
}

function mpModVersoesDe(rel) {
    const assets = rel.assets || [];
    const versoes = [];
    for (const a of assets) {
        const m = /^eternity-mod-(.+?)\+(\d+(?:\.\d+)*)\.jar$/.exec(a.name);
        if (m) versoes.push({ mc: m[2], mod: m[1], jar: a });
    }
    // release antiga, de antes do sufixo: um jar so, sem a versao do jogo no nome
    if (!versoes.length) {
        const jar = assets.find(a => /^eternity-mod-[^+]+\.jar$/.test(a.name) && !a.name.includes('-sources'));
        if (jar) versoes.push({ mc: null, mod: jar.name.replace(/^eternity-mod-|\.jar$/g, ''), jar });
    }
    const semDono = versoes.filter(v => !assets.some(a => a.name === `Eternity-${v.mc}.mrpack`));
    for (const v of versoes) {
        v.mrpack = assets.find(a => a.name === `Eternity-${v.mc}.mrpack`)
            || (semDono.length === 1 && semDono[0] === v ? assets.find(a => a.name === 'Eternity.mrpack') : null);
    }
    const num = s => String(s || '').split('.').map(n => Number(n) || 0);
    versoes.sort((a, b) => {
        const x = num(a.mc), y = num(b.mc);
        for (let i = 0; i < Math.max(x.length, y.length); i++) if ((y[i] || 0) !== (x[i] || 0)) return (y[i] || 0) - (x[i] || 0);
        return 0;
    });
    return { versoes };
}

function mpModVersoesDepois() {
    const alvo = document.getElementById('mod-versoes');
    const mb = bytes => `${(bytes / 1048576).toFixed(1)} MB`;
    fetch(`https://api.github.com/repos/${MOD_REPO}/releases/latest`)
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
        .then(rel => {
            if (!alvo?.isConnected) return;
            const { versoes } = mpModVersoesDe(rel);
            if (!versoes.length) throw new Error('release sem jar');
            const data = new Date(rel.published_at).toLocaleDateString('pt-BR');
            alvo.innerHTML = versoes.map((v, i) => {
                const mc = v.mc ? escHtml(v.mc) : '';
                const fabricApi = `https://modrinth.com/mod/fabric-api/versions${v.mc ? `?g=${encodeURIComponent(v.mc)}&l=fabric` : ''}`;
                return `
                <article class="mod-opcao mod-versao ${i === 0 ? 'recomendada' : ''}">
                    ${i === 0 && versoes.length > 1 ? '<span class="mod-opcao-selo">Mais nova</span>' : ''}
                    <h3><i class="fa-solid fa-cube" aria-hidden="true"></i> ${mc ? `Minecraft ${mc}` : 'Minecraft'}</h3>
                    <p>Eternity <b>${escHtml(v.mod)}</b> · publicado em ${data}</p>
                    <div class="mod-versao-links">
                        <a class="mod-opcao-link" href="${escHtml(v.jar.browser_download_url)}" onclick="window.etyTelemetria?.acao('baixar_mod_jar')"><i class="fa-solid fa-download" aria-hidden="true"></i> Mod <small>${mb(v.jar.size)}</small></a>
                        <a class="mod-opcao-link secundario" href="${fabricApi}" target="_blank" rel="noopener"><i class="fa-solid fa-puzzle-piece" aria-hidden="true"></i> Fabric API</a>
                        ${v.mrpack ? `<a class="mod-opcao-link secundario" href="${escHtml(v.mrpack.browser_download_url)}" onclick="window.etyTelemetria?.acao('baixar_mod_mrpack')"><i class="fa-solid fa-box" aria-hidden="true"></i> Modpack <small>.mrpack</small></a>` : ''}
                    </div>
                    <code class="mod-versao-arquivo">${escHtml(v.jar.name)}</code>
                </article>`;
            }).join('');
        })
        .catch(() => {
            if (!alvo?.isConnected) return;
            alvo.innerHTML = `<div class="mod-versoes-aviso erro"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Não consegui buscar as versões agora. Tente de novo em instantes ou use o <a href="${MOD_LATEST}Eternity-Instalador.exe">instalador</a>.</div>`;
        });
}
