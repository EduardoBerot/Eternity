const URL_VERIFY_LOGIN = `${URL_BASE}/api/verifyLogin`;
const URL_GET_MEMBROS = `${URL_BASE}/api/membros`;
const URL_GET_SOLICITACOES = `${URL_BASE}/api/solicitacoes`;

const APP = document.getElementById("app");
let nick;

const FIELD_MASK = {
    id: 'ID',
    nick: 'Nick',
    idade: 'Idade',
    foco: 'Foco',
    status: 'Status',
    recrutador: 'Recrutador Por',
    cargo: 'Cargo',
    data_entrada: 'Data de Admissão',
    status: 'Status',
}

async function authenticate() {
    const MSG = 'Faça login na seção "Administração".';
    
    try {
        if (checkCookie(ETY_ADM_COOKIE)) {
            const token = getCookie(ETY_ADM_COOKIE);

            const response = await fetch(URL_VERIFY_LOGIN, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({token})
        });

            if (!response.ok) {
                throw new Error('Erro na requisição');
            }

            const {valid} = await response.json();

            if (valid){
                nick = valid;
            }else{
                alert(MSG);
                deleteCookie(ETY_ADM_COOKIE);
                window.location.href = '/';
            }
        } else {
            alert(MSG);
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        alert(MSG);
        window.location.href = '/';
    }
}

authenticate();

function fetchDataAndRenderTable(url, tableId, properties, extraField='') {
    function renderTable(data, tableId, properties) {
        const table = document.getElementById(tableId);
        if (!table) {
            console.error(`No table found with id "${tableId}"`);
            return;
        }
    
        table.innerHTML = '';
    
        const thead = table.createTHead();
        const row = thead.insertRow();
        for (const prop of properties) {
            const th = document.createElement('th');
            const field = FIELD_MASK[prop] || prop;
            th.textContent = field;
            row.appendChild(th);
        }
        if (extraField){
            const th = document.createElement('th');
            th.textContent = extraField.name;
            row.appendChild(th);
        }
    
        const tbody = table.createTBody();
        data.forEach(item => {
            const row = tbody.insertRow();
            for (const prop of properties) {
                const cell = row.insertCell();
                const value = formatValue(item[prop]);
                cell.textContent = value;
            }
            if (extraField){
                const cell = row.insertCell();
                const value = formatExtraField(extraField.content, item.id);
                cell.innerHTML = value;
            }
        });

        function formatExtraField(element, id) {
            return element.replaceAll('%id',id)
        }

        function formatValue(value) {
            if (isValidDate(value)){
                return getDate(value);
            }

            return value

            function isValidDate(dataStr) {
                const ISO_8601_FULL = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
                return ISO_8601_FULL.test(dataStr);
            }
        }
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            hideLoading();
            // data = formatData(data);
            renderTable(data, tableId, properties);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

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

function hideLoading() {
    const loading = document.getElementById('loading')
    if (loading){
        loading.style.display = 'none';
    }else{
        console.log('Elemento loading não encontrado.');
    }
}

function renderLoading(element) {
    element.innerHTML += '<div id="loading">Carregando<span class="loading-dot">...</span></div>'
}

function createOptions(id, options, defaultValue) {
    const selectElement = document.getElementById(id);

    options.forEach(function (value) {
        const option = document.createElement("option");
        option.text = value;
        option.value = value;

        if (value == defaultValue){
            option.selected = true;
        }

        selectElement.add(option);
    });
}

function createTable(element,id) {
    element.innerHTML += `<table id="${id}"></table>`
}

function renderSolicitacoes() {
    const table_id = 'tb_solicitacoes';
    const properties = ['id','nick', 'idade',  'foco', 'data_entrada', 'recrutador'];
    renderLoading(APP);
    createTable(APP, table_id);
    const extraField = {
        name: 'Status',
        content: `
            <div>
                <img value="%id" src="./imgs/icons/Check.svg" alt="Aceitar" onclick="checkOutSolicitation(event)">
                <img value="%id" src="./imgs/icons/Close.svg" alt="Negar" onclick="checkOutSolicitation(event)">
            </div>
        `
    }
    fetchDataAndRenderTable(URL_GET_SOLICITACOES, table_id, properties, extraField);
}

function renderAdicionar() {
    APP.innerHTML = `
    <h1 class="tittle">Adicionar Membro</h1>
    <form id="form_adicionar" onsubmit="submitAdicionar(event)"> 
        <input type="text" id="nick" placeholder="Nick" required>
        <input type="text" id="idade" placeholder="Idade">
        <input type="text" id="cargo" placeholder="Cargo" required>
        <input type="date" value="" id="data_entrada" placeholder="Data" required>
        <select name="recrutador" id="recrutador" ></select>
        <button>Cadastrar</button>
    </form>
    `;
    createOptions('recrutador', STAFFMEMBERS, nick)
    setDate()

    function setDate() {
        const date_input = document.querySelector('input[type="date"]');
        date_input.value = getDate();
    }
}

function renderMembros() {
    const table_id = 'tb_membros';
    const properties = ['nick', 'idade',  'cargo', 'data_entrada', 'recrutador'];
    renderLoading(APP);
    createTable(APP, table_id);
    fetchDataAndRenderTable(URL_GET_MEMBROS, table_id, properties);
}

const pages_content = {
    solicitacoes: renderSolicitacoes,
    membros: renderMembros,
    adicionar: renderAdicionar,
}

function render(event) {
    APP.innerHTML = '';
    const id = event.target.id;
    const fn = pages_content[id];
    fn();
    selectItem(event.target);
}

membros.click()

function checkOutSolicitation(event){
    const id = event.target.getAttribute('value');
    const status = event.target.alt == 'Aceitar' ? 'Ativo' : false;
    const proceed = confirm(`Tem certeza que deseja definir como ${status? status : 'Recusado'} o membro Nº${id}?`)

    console.log(proceed);
}

function submitAdicionar(event) {
    event.preventDefault();
    console.log('submetendo formulário de adição');
}