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
    home: '<h1>Como usar nosso site?</h1></br><p>Use o menu de navegação ao lado para solicitar recrutamento, acessar nossos meios de comunicação e saber mais sobre nos</p></br><h1 style="margin-top:150px">Uni-vos pela Eternidade!</h1>',

    about: "<h1>Missão, propósito e valores</h1></br><p>Desde 2020, o Clã Eternity tem sido uma comunidade calorosa no Minecraft, unindo jogadores para construir, explorar e crescer juntos. Evoluindo ao longo dos anos, nossa visão resultou em uma cidade vibrante, o coração do servidor.</p><p>Valorizamos a cooperação e o trabalho em equipe, mantendo farms comunitárias para garantir recursos compartilhados. Essa abordagem promove solidariedade e uma comunidade unida.</p><p>Nossos valores - união, respeito e honestidade - são a base de nossa comunidade, construindo confiança e um ambiente acolhedor para todos.</p>",

    join: '<h1>Junte-se a Eternidade </h1></br><p id="msg">Junte-se ao Clã Eternity, um lugar acolhedor para jogar Minecraft. Valorizamos amizade, colaboração e diversão. Venha construir, explorar e criar memórias inesquecíveis conosco.</p></br><div id="loading">Carregando<span class="loading-dot">...</span></div><form onsubmit="send(event)" style="display:none;"><input type="text" id="uuid" placeholder="UUID"><input type="text" id="nick" placeholder="Nick" required><input type="number" id="idade" placeholder="Idade" step="1" required><select id="foco" required><option value="" disabled selected>Selecionar Foco</option><option value="PvP">PvP</option><option value="Torneio">Torneio</option><option value="Build">Build</option><option value="Farm">Farm</option></select><input type="text" id="recrutador" placeholder="Recrutador"><input type="text" id="cargo" value="Membro" style="display:none;" readonly><input type="text" id="data_entrada" style="display:none;" readonly><input type="text" id="status" value="Pendente" style="display:none;" readonly><button class="button">Solicitar Recrutamento</button></form>',

    city: `<h1>Conheça nossa cidade</h1></br><p>Nossa cidade no servidor de sobrevivência é mais do que apenas blocos e estruturas. É um lar acolhedor, onde todos contribuem para algo maior. Cada pedra conta uma história de cooperação e criatividade.</p><div id="gallery"><a href="/imgs/City00.jpg"><img class="cityimgs" src="/imgs/City00.jpg" alt="city00"></a><a href="/imgs/City01.jpg"><img class="cityimgs" src="/imgs/City01.jpg" alt="city01"></a><a href="/imgs/City02.jpg"><img class="cityimgs" src="/imgs/City02.jpg" alt="city02"></a><a href="/imgs/City03.jpg"><img class="cityimgs" src="/imgs/City03.jpg" alt="city03"></a><a href="/imgs/City04.jpg"><img class="cityimgs" src="/imgs/City04.jpg" alt="city04"></a><a href="/imgs/City05.jpg"><img class="cityimgs" src="/imgs/City05.jpg" alt="city05"></a></div>`,

    discord:
        '<h1>Acesse nosso discord</h1></br><p>Para acessar nosso servidor discord basta clicar no botão abaixo, lá você podera se manter atualizado quanto as novidades do Clã.</p></br><button class="button"><a href="https://discord.gg/MTfE7MmXT6">Acesse já</a></button>',

    zap: '<h1>Participe do nosso grupo de WhatsApp!</h1></br><p>Entre no nosso grupo de Whatsapp clicando no botão abaixo!</p></br><button class="button"><a href="https://chat.whatsapp.com/L3P1OvMnrVpJ3cj849ZoIw">Entre no grupo</a></button>',
};

function render(event) {
    const id = event.target.id;
    app.innerHTML = pages_content[id];
    selectItem(event.target);

    renderGallery(id);
    renderForm(id);
}

function renderGallery(id) {
    if (id == "city" ) {
        lightGallery(document.getElementById("gallery"),{download:false});
    }
}

function renderForm(id) {
    const url = 'https://eternity-crud.onrender.com'
    if (id == 'join'){
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
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

app.innerHTML = pages_content.home;
