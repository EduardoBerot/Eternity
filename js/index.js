const app = document.getElementById("app");

function selectItem(itemSelect) {
    const itens = document.querySelectorAll(".itens");
    for (const item of itens) {
        if (item != itemSelect) {
            item.classList.remove("select");
        } else {
            item.classList.add("select");
        }
    }
};

const pages_content = {
    home: `<h1>Como usar nosso site?</h1></br><p>Use o menu de navegação para solicitar recrutamento, acessar nossos meios de comunicação e saber mais sobre nos</p></br><h1 style="margin-top:150px">Uni-vos pela Eternidade!</h1>`,

    about: `<h1>Missão, propósito e valores</h1></br><p>Desde 2020, o Clã Eternity tem sido uma comunidade calorosa no Minecraft, unindo jogadores para construir, explorar e crescer juntos. Evoluindo ao longo dos anos, nossa visão resultou em uma cidade vibrante, o coração do servidor.</p><p>Valorizamos a cooperação e o trabalho em equipe, mantendo farms comunitárias para garantir recursos compartilhados. Essa abordagem promove solidariedade e uma comunidade unida.</p><p>Nossos valores - união, respeito e honestidade - são a base de nossa comunidade, construindo confiança e um ambiente acolhedor para todos.</p>`,

    join: `<h1>Junte-se a Eternidade </h1>
    </br><p id="msg">Junte-se ao Clã Eternity, um lugar acolhedor para jogar Minecraft. Valorizamos amizade, colaboração e diversão. Venha construir, explorar e criar memórias inesquecíveis conosco.</p>
    </br><div id="loading">Carregando<span class="loading-dot">...</span></div>
    <form onsubmit="send(event)" style="display:none;">
        <label>Nick</label>
        <input type="text" id="nick" required>
        <label>Data de Nascimento</label>
        <input type="date" id="data_nascimento" required>
        <label>Foco</label>
        <select id="foco" required></select>
        <select id="recrutador" style="display:none;"></select>
        <input type="text" id="cargo" value="Membro" style="display:none;" readonly>
        <input type="text" id="data_entrada" style="display:none;" readonly>
        <input type="text" id="status" value="Pendente" style="display:none;" readonly>
        <button class="button">Solicitar Recrutamento</button>
    </form>`,

    city: `<h1>Conheça nossa cidade</h1></br><p>Nossa cidade no servidor de sobrevivência é mais do que apenas blocos e estruturas. É um lar acolhedor, onde todos contribuem para algo maior. Cada pedra conta uma história de cooperação e criatividade.</p><div id="gallery"><a href="/imgs/City00.jpg"><img class="cityimgs" src="/imgs/City00.jpg" alt="city00"></a><a href="/imgs/City01.jpg"><img class="cityimgs" src="/imgs/City01.jpg" alt="city01"></a><a href="/imgs/City02.jpg"><img class="cityimgs" src="/imgs/City02.jpg" alt="city02"></a><a href="/imgs/City03.jpg"><img class="cityimgs" src="/imgs/City03.jpg" alt="city03"></a><a href="/imgs/City04.jpg"><img class="cityimgs" src="/imgs/City04.jpg" alt="city04"></a><a href="/imgs/City05.jpg"><img class="cityimgs" src="/imgs/City05.jpg" alt="city05"></a></div>`,

    discord:
        `<h1>Acesse nosso discord</h1></br><p>Para acessar nosso servidor discord basta clicar no botão abaixo, lá você podera se manter atualizado quanto as novidades do Clã.</p></br><button class="button"><a href="https://discord.gg/MTfE7MmXT6">Acesse já</a></button>`,

    zap: `<h1>Participe do nosso grupo de WhatsApp!</h1></br><p>Entre no nosso grupo de Whatsapp clicando no botão abaixo!</p></br><button class="button"><a href="https://chat.whatsapp.com/L3P1OvMnrVpJ3cj849ZoIw">Entre no grupo</a></button>`,

    administracao: `<div id="loading">Carregando<span class="loading-dot">...</span></div><form onsubmit="validationLogin(event)" style="display:none;"><h1>Login</h1><input type="text" id="login" placeholder="login"><input type="password" id="senha" placeholder="Senha"><button class="button">OK</button></form>`,
};

function render(event) {
    const id = event.target.id;
    app.innerHTML = pages_content[id];
    selectItem(event.target);

    renderGallery(id);
    renderFormJoin(id);
    renderFormAdmin(id);
}

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
    if (id == 'join') {
        fetch(URL_BASE)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                document.getElementById('loading').style.display = 'none';
                document.querySelector('form').style.display = 'flex';
                renderSelect(STAFFMEMBERS, 'recrutador');
                renderDate();
                createOptions('foco', FOCUS_TYPE, 'PvP');
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
    }
}

function renderSelect(values, id) {
    const selectElement = document.getElementById(id);

    values.forEach(function (value) {
        const option = document.createElement("option");
        option.text = value;
        option.value = value;

        selectElement.add(option);
    });
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

app.innerHTML = pages_content.home;
