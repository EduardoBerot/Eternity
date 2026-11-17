// Tela "Mod" do painel do membro (16/11/2026, Fundador): so para quem esta
// logado. Baixar o instalador, o passo a passo e o que vem no mod. Os arquivos
// ficam no GitHub Releases (link fixo "latest"); a versao vem da API do GitHub,
// que libera CORS. Se ela falhar, a tela funciona sem o numero.

const MOD_REPO = 'EduardoBerot/eternity-instalador';
const MOD_LATEST = `https://github.com/${MOD_REPO}/releases/latest/download/`;

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
    ['SKLauncher', 'versão fabric-loader 26.3', true],
    ['Prism', 'instância “Eternity”', true],
    ['Dawn', 'seu perfil Fabric 26.3', true],
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
                    <span class="mod-chip" id="mod-versao"><i class="fa-solid fa-code-branch" aria-hidden="true"></i> Minecraft 26.3 · Fabric</span>
                </div>
            </div>
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
                    <div><b>Escolha o seu launcher</b> (ele já marca os que achou no PC) e clique em <b>Instalar</b>.</div>
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
                    <li><b>Já tenho Fabric 26.3.</b> Importe o <a href="${MOD_LATEST}Eternity.mrpack">Eternity.mrpack</a> no Prism ou Modrinth App, ou pegue o jar nas <a href="https://github.com/${MOD_REPO}/releases" target="_blank" rel="noopener">versões</a>.</li>
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
            el.innerHTML = `<i class="fa-solid fa-code-branch" aria-hidden="true"></i> Versão ${escHtml(String(rel.tag_name).replace(/^v/, ''))} · ${data} · Minecraft 26.3`;
        })
        .catch(() => {});
}
