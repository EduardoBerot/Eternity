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

    administracao: `${loadingHTML}<form onsubmit="validationLogin(event)" style="display:none;"><h1>Login da staff</h1><input type="text" id="login" placeholder="login"><input type="password" id="senha" placeholder="Senha"><button class="button">OK</button></form>`,
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
    admin: {
        menu: 'administracao',
        render: () => {
            app.innerHTML = pages_content.administracao;
            renderFormAdmin('administracao');
        },
    },
    atualizar: { menu: null, render: () => openAtualizar() },
};

function route() {
    const nome = location.hash.replace(/^#/, '').split(/[?&]/)[0] || 'inicio';
    const rota = ROTAS[nome] || ROTAS.inicio;
    // A classe da pagina zera a do Guia (guia-modo-video) e deixa cada tela
    // ajustar o proprio painel.
    app.className = `content page-${ROTAS[nome] ? nome : 'inicio'}`;
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

function renderFormAdmin(id) {
    if (id == 'administracao') {
        fetch(URL_BASE)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                document.getElementById('loading').style.display = 'none';
                document.querySelector('form').style.display = 'flex';
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
    }
}


async function validationLogin(event) {
    event.preventDefault();

    const URL_LOGIN = `${URL_BASE}/api/login`
    const login = document.querySelector('#login').value;
    const senha = document.querySelector('#senha').value;
    const dados = {login, senha}

    try {
        const response = await fetch(URL_LOGIN, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            throw new Error('Erro na requisição');
        }

        const {token, login} = await response.json();
        const DOIS_DIAS_EM_MINUTOS = 60*24*2;

        setCookie(ETY_ADM_LOGIN_COOKIE, DOIS_DIAS_EM_MINUTOS, login);
        setCookie(ETY_ADM_PASS_COOKIE, DOIS_DIAS_EM_MINUTOS, token);

        window.location.href = '/painel.html';

    } catch (error) {
        alert('Login ou senha não conferem.')
        console.error('Erro ao enviar os dados:', error);
    }

}

// Espera o DOMContentLoaded porque inicio.js, membros.js, wiki.js e guia.js
// carregam depois deste arquivo.
document.addEventListener('DOMContentLoaded', route);
