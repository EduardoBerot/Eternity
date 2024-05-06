const URL_GET_MEMBROS_ATIVOS = `${URL_BASE}/api/membros/ativos`;
const URL_GET_SOLICITACOES = `${URL_BASE}/api/solicitacoes`;
const URL_PATH_ATIVAR_MEMBRO = `${URL_BASE}/api/membro/ativar/id`;
const URL_DELETE_MEMBRO = `${URL_BASE}/api/membro/id`;

const FIELD_MASK = {
    id: 'ID',
    nick: 'Nick',
    idade: 'Idade',
    foco: 'Foco',
    status: 'Status',
    recrutador: 'Recrutador Por',
    cargo: 'Cargo',
    data_entrada: 'Data de Solicitação',
}

const APP = document.getElementById("app");

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

function renderSolicitacoes() {
    const table_id = 'tb_solicitacoes';
    const properties = ['nick', 'idade',  'foco', 'data_entrada'];
    renderLoading(APP);
    createTable(APP, table_id);
    const extraField = {
        name: 'Status',
        content: `
            <div>
                <img value="%id" status="Ativo" src="./imgs/icons/Check.svg" alt="Aceitar" onclick="checkOutSolicitation(event)">
                <img value="%id" status="Excluído" src="./imgs/icons/Close.svg" alt="Negar" onclick="checkOutSolicitation(event)">
            </div>
        `
    }
    fetchDataAndRenderTable(URL_GET_SOLICITACOES, table_id, properties, extraField);
}

function renderAdicionar() {
    APP.innerHTML = `
    <h1 class="tittle">Adicionar Membro</h1>
    <form id="form_adicionar" onsubmit="submitAdicionar(event)">
        <div class="form-label">
            <label for="nick">Nick</label>
            <input type="text" id="nick" placeholder="Nick" required>
        </div>
        <div class="form-label">
            <label for="idade">Data de Nascimento</label>
            <input type="number" step="1" min="5" max="120" value="5" id="idade" placeholder="Idade" required>
        </div>
        <div class="form-label">
            <label for="foco">Foco</label>
            <select name="foco" id="foco" required></select>
        </div>
        <div class="form-label">
            <label for="cargo">Cargo</label>        
            <input type="text" id="cargo" placeholder="Cargo" value="Membro" required>
        </div>
        <input type="text" id="status" placeholder="Status" value="Ativo" style="display:none"required>
        <div class="form-label">
            <label for="data_entrada">Data de Cadastro</label>
            <input type="date" id="data_entrada" placeholder="Data" required>
        </div>
        <div class="form-label">
            <label for="recrutador">Recrutador</label>
            <select name="recrutador" id="recrutador" required></select>
        </div>
        <button>Cadastrar</button>
    </form>
    `;
    
    const nick = getCookie(ETY_ADM_LOGIN_COOKIE);
    createOptions('recrutador', STAFFMEMBERS, nick);
    createOptions('foco', FOCUS_TYPE, 'PvP')
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
    
    const extraField = {
        name: 'Excluir',
        content: `
        <div>
        <img value="%id" status="Excluído" src="./imgs/icons/Close.svg" alt="Negar" onclick="checkOutSolicitation(event)">
        </div>
        `
    }
    fetchDataAndRenderTable(URL_GET_MEMBROS_ATIVOS, table_id, properties, extraField, ()=>{
        replaceInTableHeader(FIELD_MASK['data_entrada'],'Membro desde')
    });
}

function checkOutSolicitation(event){
    const id = event.target.getAttribute('value');
    const status = event.target.getAttribute('status');
    const proceed = confirm(`Tem certeza que deseja definir o membro como ${status}?`)

    if (proceed) {
        if (status == 'Ativo'){
            updateMember(id);
        }else if(status == 'Excluído'){
            excludeMember(id)
        }else{
            throw new Error( `Invalid status ${status}`);
        }
    }

    function updateMember(id) {
        const opcoes = {
            method: 'PATCH', 
            headers: {'Content-Type': 'application/json'},
        };
    
        fetch(`${URL_PATH_ATIVAR_MEMBRO}/${id}`, opcoes)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Algo deu errado na requisição: ' + response.statusText);
            })
            .then(data => {
                alert(`O membro foi definido como Ativo!`);
                getRedirectElement()?.click()
            })
            .catch(error => {
                console.error('Erro durante a requisição:', error);
            });
    }
    
    function excludeMember(id) {

        fetch(`${URL_DELETE_MEMBRO}/${id}`, {method: 'DELETE'})
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Algo deu errado na requisição: ' + response.statusText);
            })
            .then(_ => {
                getRedirectElement()?.click()
            })
            .catch(error => {
                console.error('Erro durante a requisição:', error);
            });
    }
}

function getRedirectElement() {
    const  elements = document.getElementsByClassName('select');
    if(elements){
        return elements[0]
    }
    return null
}

async function submitAdicionar(event) {
    event.preventDefault();
    console.log('Submetendo formulário de adição.');

    const data = getFormData();

    try {
        let response = await fetch(URL_MEMBERS,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        alert("Cadastro realizado com sucesso!");
        cleanForm();
    } catch (error) {
        alert(`Não foi possível realizar o cadastro. Verifique se não um membro cadastrado com o nick "${data.nick}"`);
    }

    function getFormData() {
        const data = {
            nick: document.getElementById('nick').value,
            idade: document.getElementById('idade').value,
            foco: document.getElementById('foco').value,
            recrutador: document.getElementById('recrutador').value,
            cargo: document.getElementById('cargo').value,
            data_entrada: document.getElementById('data_entrada').value,
            status: document.getElementById('status').value,
        }
        return data
    }

    function cleanForm() {
        document.getElementById('nick').value = '';
        document.getElementById('idade').value = '5';
    }
}

function fetchDataAndRenderTable(url, tableId, properties, extraField='', callback=null) {
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
                return getDate(value, true);
            }

            return value

            function isValidDate(dataStr) {
                const ISO_8601_FULL = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
                return ISO_8601_FULL.test(dataStr);
            }
        }
    }

    function renderVoidTable(tableId, properties) {
        const table = document.getElementById(tableId);
        if (!table) {
            console.error(`No table found with id "${tableId}"`);
            return;
        }
    
        table.innerHTML = '<h2>Não há nada aqui!</h2>';
    
        // const thead = table.createTHead();
        // const row = thead.insertRow();
        // for (const prop of properties) {
        //     const th = document.createElement('th');
        //     const field = FIELD_MASK[prop] || prop;
        //     th.textContent = field;
        //     row.appendChild(th);
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

            if(data.length == 0){
                renderVoidTable(tableId, properties)
            }else{
                renderTable(data, tableId, properties);
            }

            if (callback) callback()
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

function init() {
    const nick = getCookie(ETY_ADM_LOGIN_COOKIE);
    const element = document.querySelector('#title_nick');
    const msg = `Seja Bem-Vindo ${nick}!`;
    element.textContent = msg;
    solicitacoes.click()
}

init();
