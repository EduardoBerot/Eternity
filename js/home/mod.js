// Pagina do mod (#mod, 16/11/2026): baixar o instalador e o passo a passo.
// Os arquivos ficam no GitHub Releases (link fixo "latest"); a versao vem da API
// do GitHub, que libera CORS. Se ela falhar, a pagina funciona sem o numero.

const MOD_REPO = 'EduardoBerot/eternity-instalador';
const MOD_LATEST = `https://github.com/${MOD_REPO}/releases/latest/download/`;

const MOD_RECURSOS = [
    ['fa-table-columns', 'Painel do clã no jogo', 'Aperte J: Liga, torneios, banco, ranking, agenda, anúncios e o seu perfil com os títulos.'],
    ['fa-shield-halved', 'Armadura por cor', 'Verde, amarelo e vermelho conforme a durabilidade, na sua armadura e na dos outros, e o aviso de bigorna.'],
    ['fa-apple-whole', 'Aviso de cap', 'Em combate, com pouca absorção, o ícone da cap aparece com quantas você ainda tem.'],
    ['fa-heart', 'Vida dos players', 'Corações em cima do nome de quem está perto, com a absorção em dourado.'],
    ['fa-flask', 'HUD do seu jeito', 'Armadura ao lado da hotbar, poções onde você quiser e atalhos J+C, J+B e J+V.'],
    ['fa-palette', 'Textura Eternity', 'O Eternity v3 Texture Pack já vem dentro do mod e liga sozinho.'],
];

function renderMod() {
    app.innerHTML = `
        <header class="cabeca-pagina">
            <div class="miolo">
                <h1>Mod Eternity</h1>
                <p class="texto">O painel do clã dentro do Minecraft, a textura da Eternity e ajudas de PvP, num instalador só.</p>
            </div>
        </header>
        <div class="miolo mod-pagina">
            <section class="mod-baixar">
                <a class="botao botao-principal mod-botao" href="${MOD_LATEST}Eternity-Instalador.exe" onclick="window.etyTelemetria?.acao('baixar_mod')">
                    <i class="fa-solid fa-download" aria-hidden="true"></i> Baixar o instalador
                </a>
                <p class="mod-versao" id="mod-versao">Windows · Minecraft 26.3 · Fabric</p>
                <p class="texto mod-inclui">Instala o Fabric, o mod Eternity com a textura e mods de desempenho
                    (Sodium, Lithium, FerriteCore, EntityCulling, MoreCulling, Krypton e C2ME).</p>
            </section>

            <section>
                <h2>Como instalar</h2>
                <ol class="mod-passos">
                    <li><b>Baixe</b> o <code>Eternity-Instalador.exe</code> no botão acima.</li>
                    <li><b>Abra.</b> O Windows pode avisar “O Windows protegeu o computador”: clique em <b>Mais informações</b> e depois em <b>Executar assim mesmo</b>. O aviso aparece porque o instalador não tem assinatura paga, não porque tem vírus.</li>
                    <li><b>Escolha o seu launcher</b> (ele já marca os que achou no seu PC) e clique em <b>Instalar</b>.</li>
                    <li><b>Jogue:</b> no launcher oficial, use o perfil <b>Eternity</b>; no SKLauncher, a versão <b>fabric-loader 26.3</b>; no Prism, a instância <b>Eternity</b>; no Dawn, o seu perfil 26.3. No jogo, aperte <b>J</b>.</li>
                </ol>
                <div class="mod-launchers">
                    <span><i class="fa-solid fa-check"></i> Oficial</span>
                    <span><i class="fa-solid fa-check"></i> SKLauncher</span>
                    <span><i class="fa-solid fa-check"></i> Prism</span>
                    <span><i class="fa-solid fa-check"></i> Dawn</span>
                    <span class="nao"><i class="fa-solid fa-xmark"></i> Lunar e Badlion não aceitam mods de fora</span>
                </div>
            </section>

            <section>
                <h2>O que vem no mod</h2>
                <div class="mod-recursos">
                    ${MOD_RECURSOS.map(([icone, titulo, texto]) => `
                    <div class="mod-recurso">
                        <i class="fa-solid ${icone}" aria-hidden="true"></i>
                        <h3>${titulo}</h3>
                        <p>${texto}</p>
                    </div>`).join('')}
                </div>
            </section>

            <section class="mod-manual">
                <h2>Instalação manual</h2>
                <p class="texto">Já tem o Fabric para o 26.3? Baixe o <a href="${MOD_LATEST}instalador.json" target="_blank" rel="noopener">manifesto</a> para ver os arquivos, ou importe o modpack <a href="${MOD_LATEST}Eternity.mrpack">Eternity.mrpack</a> no Prism ou no Modrinth App. Todas as versões ficam no <a href="https://github.com/${MOD_REPO}/releases" target="_blank" rel="noopener">GitHub</a>.</p>
                <p class="texto">Deu problema? Chame a staff no <a href="https://discord.gg/vj4eNDJqct" target="_blank" rel="noopener">Discord</a> com um print.</p>
            </section>
        </div>`;

    fetch(`https://api.github.com/repos/${MOD_REPO}/releases/latest`)
        .then(r => r.ok ? r.json() : null)
        .then(rel => {
            const el = document.getElementById('mod-versao');
            if (!rel || !el) return;
            const data = new Date(rel.published_at).toLocaleDateString('pt-BR');
            el.textContent = `Versão ${String(rel.tag_name).replace(/^v/, '')} · ${data} · Windows · Minecraft 26.3`;
        })
        .catch(() => {});
}
