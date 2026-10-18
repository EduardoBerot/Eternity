const app = document.getElementById("app");
const menuToggle = document.getElementById("menu-toggle");
const mainMenu = document.getElementById("main-menu");
const menuVeu = document.getElementById("menu-veu");

function setMenuOpen(isOpen) {
    mainMenu.classList.toggle('open', isOpen);
    menuVeu.classList.toggle('open', isOpen);
    document.body.classList.toggle('menu-aberto', isOpen);
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
}

menuToggle.addEventListener('click', () => {
    setMenuOpen(!mainMenu.classList.contains('open'));
});

menuVeu.addEventListener('click', () => setMenuOpen(false));

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        setMenuOpen(false);
        menuToggle.focus();
    }
});

function selectItem(itemSelect) {
    for (const item of document.querySelectorAll(".itens")) {
        const atual = item === itemSelect;
        item.classList.toggle("select", atual);
        if (atual) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
    }
};

// Texto vindo da API vai para innerHTML: tudo passa por aqui.
function escHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const loadingHTML = `
    <div id="loading" style="display:flex;flex-direction:column;align-items:center;margin-top:1em;">
        <span class="loading-dot">Aguarde ...</span>
    </div>
    `

const pages_content = {

    // "Juntar-se" abre o Guia do Recruta (guia.js). A atualizacao cadastral de
    // quem ja e membro saiu do site em 03/10/2026: o formulario era aberto e
    // qualquer um mandava data para o nick de outro. No Discord o nick sai do
    // vinculo, entao so o proprio membro pede a mudanca.
    atualizar: `<h1>Atualizar cadastro</h1>
    </br><p>A atualização do cadastro agora é feita no <a href="https://discord.gg/vj4eNDJqct" target="_blank" rel="noopener">Discord da Eternity</a>, com a conta vinculada ao seu nick:</p>
    </br><p><code>/aniversario</code> — corrige a sua data de nascimento.</p>
    <p><code>/entrada</code> — corrige a data em que você entrou no clã.</p>
    </br><p>A mudança vai para análise da staff. Ainda não vinculou o Discord? Use o botão <b>Vincular minha conta</b> no canal <b>#saudações</b>. Ainda não é membro? Faça o <a href="#guia" onclick="openGuia()">Recrutamento</a>.</p>`,

    // A Cidade (mapa, galeria e pedido de casa) fica em cidade.js.
};

// Rotas por hash (#inicio, #membros...): cada pagina tem endereco proprio. O
// `?nick=Fulano#guia` que a Eternity manda no jogo continua caindo no Guia.
// `menu` e o id do link da navbar que fica aceso.
const ROTAS = {
    inicio: { menu: 'inicio', render: () => renderInicio() },
    guia: { menu: 'join', render: () => openGuia() },
    membros: { menu: 'hall', render: () => renderMembros() },
    wiki: { menu: 'wiki', render: () => renderWiki() },
    cidade: { menu: 'city', render: () => renderCidadePublica() },
    atualizar: { menu: null, render: () => openAtualizar() },
    // Painel do membro, com login do Discord (meu-painel.js). E o unico login do
    // site: a administracao e uma aba dele para quem tem cargo (16/10/2026).
    'meu-painel': { menu: 'meu-painel-link', render: () => renderMeuPainel() },
    // Endereco antigo do login da staff: leva a administracao pelo painel.
    admin: { menu: 'meu-painel-link', render: () => { history.replaceState(null, '', '#meu-painel&admin=1'); renderMeuPainel(); } },
};

function route() {
    // O link assinado do jogo (?g=) e a volta do login do Discord (?vinculo=)
    // abrem o Guia mesmo sem o #guia: no tell cada caractere conta.
    const doGuia = /[?&](g|vinculo)=/.test(location.search) ? 'guia' : 'inicio';
    const nome = location.hash.replace(/^#/, '').split(/[?&]/)[0] || doGuia;
    const rota = ROTAS[nome] || ROTAS.inicio;
    // A classe da pagina zera a do Guia (guia-modo-video) e deixa cada tela
    // ajustar o proprio painel.
    app.className = `content page-${ROTAS[nome] ? nome : 'inicio'}`;
    // O modo jogo (HUD do painel do membro) so vale no #meu-painel logado.
    document.body.classList.remove('modo-jogo');
    setMenuOpen(false);
    selectItem(rota.menu ? document.getElementById(rota.menu) : null);
    rota.render();
    window.scrollTo({ top: 0 });
    // Fora do Inicio nao ha marca no hero: o logo da navbar volta na hora.
    atualizarMarca(true);
}

function navigate(nome) {
    if (location.hash === `#${nome}`) route();
    else location.hash = nome;
}

window.addEventListener('hashchange', route);

// A navbar fica mais opaca quando a pagina rola, para o texto nao brigar com o
// conteudo que passa por baixo.
window.addEventListener('scroll', () => {
    document.querySelector('.topbar')?.classList.toggle('rolou', window.scrollY > 8);
}, { passive: true });

// Espera o DOMContentLoaded porque inicio.js, membros.js, wiki.js e guia.js
// carregam depois deste arquivo.
document.addEventListener('DOMContentLoaded', route);
