const app = document.getElementById("app");
const menuToggle = document.getElementById("menu-toggle");
const mainMenu = document.getElementById("main-menu");

function setMenuOpen(isOpen) {
    mainMenu.classList.toggle('open', isOpen);
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
}

menuToggle.addEventListener('click', () => {
    setMenuOpen(!mainMenu.classList.contains('open'));
});

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

    // "Juntar-se" abre o Guia do Recruta (guia.js). Este e o formulario de
    // atualizacao cadastral de quem ja e membro, que nao passa pelo teste.
    atualizar: `<h1>Atualizar cadastro</h1>
    </br><p id="msg">Para quem já está no clã: informe seu nick e a data de nascimento. A mudança vai para análise da staff. Ainda não é membro? Faça o <a href="#guia" onclick="openGuia()">Recrutamento</a>.</p>
    </br>${loadingHTML}
    <form onsubmit="send(event)" style="display:none;">
        <label>Nick</label>
        <input type="text" id="nick" placeholder="Nick" required>
        <label>Data de Nascimento</label>
        <input type="date" id="data_nascimento" required>
        <input type="text" id="recrutador" value="" style="display:none;" readonly>
        <input type="text" id="cargo" value="Membro" style="display:none;" readonly>
        <input type="text" id="data_entrada" style="display:none;" readonly>
        <input type="text" id="status" value="Pendente" style="display:none;" readonly>
        <button class="button">Enviar atualização</button>
    </form>`,

    city: `<h1>Conheça nossa cidade</h1></br><p>Nossa cidade no servidor de sobrevivência é mais do que apenas blocos e estruturas. É um lar acolhedor, onde todos contribuem para algo maior. Cada pedra conta uma história de cooperação e criatividade.</p><div id="gallery"><a href="/imgs/City00.jpg"><img class="cityimgs" src="/imgs/City00.jpg" alt="city00"></a><a href="/imgs/City01.jpg"><img class="cityimgs" src="/imgs/City01.jpg" alt="city01"></a><a href="/imgs/City02.jpg"><img class="cityimgs" src="/imgs/City02.jpg" alt="city02"></a><a href="/imgs/City03.jpg"><img class="cityimgs" src="/imgs/City03.jpg" alt="city03"></a><a href="/imgs/City04.jpg"><img class="cityimgs" src="/imgs/City04.jpg" alt="city04"></a><a href="/imgs/City05.jpg"><img class="cityimgs" src="/imgs/City05.jpg" alt="city05"></a></div>`,

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
    cidade: {
        menu: 'city',
        render: () => {
            app.innerHTML = pages_content.city;
            renderGallery('city');
        },
    },
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
    app.scrollTo({ top: 0 });
}

function navigate(nome) {
    if (location.hash === `#${nome}`) route();
    else location.hash = nome;
}

window.addEventListener('hashchange', route);

function renderGallery(id) {
    if (id == "city") {
        lightGallery(document.getElementById("gallery"), { download: false });
    }
}

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

function renderFormJoin(id) {
    if (id == 'atualizar') {
        fetch(URL_BASE)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                document.getElementById('loading').style.display = 'none';
                document.querySelector('form').style.display = 'flex';
                renderDate();
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
    }
}

function renderDate() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();

    const formattedDate = yyyy + '-' + mm + '-' + dd;
    document.getElementById('data_entrada').value = formattedDate;
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
