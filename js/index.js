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
    </br><div id="loading">Carregando<span class="loading-dot">...</span><div class="alert" style="font-size:0.75em;margin-left:auto;margin-top:0.5em;">(isso pode demorar um pouco)</div></div>
    <form onsubmit="send(event)" style="display:none;">
        <label>Nick</label>
        <input type="text" id="nick" placeholder="Nick" required>
        <label>Data de Nascimento</label>
        <input type="date" id="data_nascimento" required>
        <label>Foco</label>
        <select id="foco" required></select>
        <input type="text" id="recrutador" value="" style="display:none;" readonly>
        <input type="text" id="cargo" value="Membro" style="display:none;" readonly>
        <input type="text" id="data_entrada" style="display:none;" readonly>
        <input type="text" id="status" value="Pendente" style="display:none;" readonly>
        <button class="button">Solicitar Recrutamento</button>
    </form>`,

    city: `<h1>Conheça nossa cidade</h1></br><p>Nossa cidade no servidor de sobrevivência é mais do que apenas blocos e estruturas. É um lar acolhedor, onde todos contribuem para algo maior. Cada pedra conta uma história de cooperação e criatividade.</p><div id="gallery"><a href="/imgs/City00.jpg"><img class="cityimgs" src="/imgs/City00.jpg" alt="city00"></a><a href="/imgs/City01.jpg"><img class="cityimgs" src="/imgs/City01.jpg" alt="city01"></a><a href="/imgs/City02.jpg"><img class="cityimgs" src="/imgs/City02.jpg" alt="city02"></a><a href="/imgs/City03.jpg"><img class="cityimgs" src="/imgs/City03.jpg" alt="city03"></a><a href="/imgs/City04.jpg"><img class="cityimgs" src="/imgs/City04.jpg" alt="city04"></a><a href="/imgs/City05.jpg"><img class="cityimgs" src="/imgs/City05.jpg" alt="city05"></a></div>`,

    discord:
        `<h1>Acesse nosso discord</h1></br><p>Para acessar nosso servidor discord basta clicar no botão abaixo, lá você podera se manter atualizado quanto as novidades do Clã.</p></br><a href="https://discord.gg/vj4eNDJqct" class="button">Acesse já</a>`,

    zap: `<h1>Participe do nosso grupo de WhatsApp!</h1></br><p>Entre no nosso grupo de Whatsapp clicando no botão abaixo!</p></br><a href="https://chat.whatsapp.com/L3P1OvMnrVpJ3cj849ZoIw" class="button">Entre no grupo</a>`,

    texture: `<h1>Utilize nossa textura!</h1></br><p>Clique no botão abaixo para baixar a nossa textura oficial, contando com beneficios para PvP, Hud tematizado e muito mais!</p></br><a href="https://drive.usercontent.google.com/u/0/uc?id=1FE7HafEXq_V3NBliSEe_80y2Y7l1N_gM&export=download" download="Eternity Texture" class="button">Versão Convencional</a><a href="https://drive.usercontent.google.com/u/0/uc?id=1Qxja2VzC-OHlfl1uemSs13YQ2Oj0odMN&export=download" download="Eternity Texture Lite" class="button">Versão Lite</a>`,

    administracao: `<div id="loading">Carregando<span class="loading-dot">...</span><div class="alert" style="font-size:0.75em;margin-left:auto;margin-top:0.5em;">(isso pode demorar um pouco)</div></div><form onsubmit="validationLogin(event)" style="display:none;"><h1>Login</h1><input type="text" id="login" placeholder="login"><input type="password" id="senha" placeholder="Senha"><button class="button">OK</button></form>`,

    hall: `<h1>Membros Staff</h1><hr style="width:100%;"><div id="hall-da-fama" style="display:flex;flex-wrap:wrap;gap:1em;justify-content:center;padding-top:8px; margin-bottom:16px;"></div>`,
};

async function render(event) {
    const id = event.target.id;
    app.innerHTML = pages_content[id];
    selectItem(event.target);

    renderGallery(id);
    renderFormJoin(id);
    renderFormAdmin(id);
    await renderHall(id);
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
                renderDate();
                createOptions('foco', FOCUS_TYPE, 'PvP');
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
    }
}

async function renderHall(id) {
    if (id == 'hall') {
        const hall = document.getElementById('hall-da-fama');
        let playersHTML = "";
        const resposta = await fetch(URL_STAFFMEMBERS);
        const STAFFMEMBERS = await resposta.json();
        STAFFMEMBERS.push({nick:'trogro9',cargo:'Admin',data_entrada:'2022-05-11 00:00:00+00'})

        for (const staff of STAFFMEMBERS) {
            const playerHTML = `
            <div class="card-staff" style="display:flex; flex-direction:column; align-items:center;">
                <img width="100" src="https://mc-heads.net/head/${staff.nick}" alt="skin do player ${staff.nick}">
                <div style="display:flex; flex-direction:column;align-items:center;margin-top:8px;">
                <p>${staff.nick}</p>
                    <h3>${staff.cargo}</h3>
                    <em style="font-size:0.8em;color:#404040">${calculateInYearOrDays(staff.data_entrada)}</em>
                </div>
            </div>
            `;
            
            playersHTML += playerHTML;
        }
        

        hall.innerHTML = playersHTML;
    }
}

function calculateInYearOrDays(incomeDate) {
    function calculateAge(birthDate) {
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    function calculateAgeInDays(birthDate) {
        const today = new Date();
        const timeDifference = today - new Date(birthDate);
        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        return daysDifference;
    }

    incomeDate = new Date(incomeDate);
    let age = calculateAge(incomeDate);
    let ageInDays = calculateAgeInDays(incomeDate);
    if (ageInDays > 365) return `Membro a +${age} anos`;
    return `Membro a ${ageInDays} dias`;
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