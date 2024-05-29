const URL_GET_MEMBROS_ATIVOS = `${URL_BASE}/api/membros/ativos`;
const URL_GET_SOLICITACOES = `${URL_BASE}/api/solicitacoes`;
const URL_GET_EVENTOS = `${URL_BASE}/api/eventos`;
const URL_PATH_ATIVAR_MEMBRO = `${URL_BASE}/api/membro/ativar/id`;
const URL_BAN_MEMBRO = `${URL_BASE}/api/membro/banir/id`;
const URL_KICK_MEMBRO = `${URL_BASE}/api/membro/kick/id`;
const URL_PATH_MEMBRO = `${URL_BASE}/api/membro/id`;

const FIELD_MASK = {
    id: 'ID',
    nick: 'Nick',
    data_nascimento: 'Idade',
    foco: 'Foco',
    status: 'Status',
    recrutador: 'Recrutador',
    cargo: 'Cargo',
    data_entrada: 'Data de Solicitação',
    createdAt: 'Data da Ocorrência',
    updatedAt: 'Excluído em',
    comentario: 'Motivo',
    evento: 'Evento',
}

const APP = document.getElementById("app");

const pages_content = {
    solicitacoes: renderSolicitacoes,
    membros: renderMembros,
    adicionar: renderAdicionar,
    // excluidos: renderExcluidos,
    historico: renderHistorico,
}

function render(event) {
    APP.innerHTML = '';
    const id = event.target.id;
    const fn = pages_content[id];
    fn();
    selectItem(event.target);
}

function renderHistorico() {
    const table_id = 'tb_historico';
    const properties = ['createdAt', 'evento', 'nick', 'recrutador', 'comentario'];
    renderLoading(APP);
    renderSearch(APP, table_id);
    createTable(APP, table_id);
    fetchDataAndRenderTable(URL_GET_EVENTOS, table_id, properties, undefined, ()=>{
        replaceInTableHeader(FIELD_MASK['recrutador'], 'Staff')
        replaceInTableHeader(FIELD_MASK['nick'], 'Player')
    });
}

// function renderExcluidos() {
//     const table_id = 'tb_excluidos';
//     const properties = ['nick', 'data_nascimento', 'data_entrada', 'updatedAt', 'comentario'];
//     renderLoading(APP);
//     createTable(APP, table_id);

//     fetchDataAndRenderTable(URL_GET_MEMBROS_ATIVOS, table_id, properties, extraField, ()=>{
//         convertDatesToAges(table_id, FIELD_MASK['data_nascimento'])
//     });
// }

function renderSolicitacoes() {
    const table_id = 'tb_solicitacoes';
    const properties = ['nick', 'data_nascimento', 'foco', 'data_entrada'];
    const fieldDataEntrada = 'Tempo de Solicitação'
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
    fetchDataAndRenderTable(URL_GET_SOLICITACOES, table_id, properties, extraField, ()=>{
        replaceInTableHeader(FIELD_MASK['data_entrada'], fieldDataEntrada);
        convertDatesToAges(table_id, FIELD_MASK['data_nascimento']);
        convertDatesToAges(table_id, fieldDataEntrada, true);
    });
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
            <label for="data_nascimento">Data de Nascimento</label>
            <input type="date" value="2002-06-30" id="data_nascimento" required>
        </div>
        <div class="form-label">
            <label for="foco">Foco</label>
            <select name="foco" id="foco" required></select>
        </div>
        <div class="form-label">
            <label for="cargo">Cargo</label>        
            <select name="cargo" id="cargo" required></select>
        </div>
        <input type="text" id="status" placeholder="Status" value="Ativo" style="display:none"required>
        <div class="form-label">
            <label for="data_entrada">Data de Cadastro</label>
            <input type="date" id="data_entrada" value="${getDate()}" required>
        </div>
        <div class="form-label">
            <label for="recrutador">Recrutador</label>
            <select name="recrutador" id="recrutador" required></select>
        </div>
        <button>Adicionar</button>
    </form>
    `;
    
    const nick = getCookie(ETY_ADM_LOGIN_COOKIE);
    createOptions('recrutador', STAFFMEMBERS, nick);
    createOptions('foco', FOCUS_TYPE, 'PvP');
    createOptions('cargo', CARGOS, 'Membro');
}

function renderMembros() {
    const table_id = 'tb_membros';
    renderLoading(APP);
    renderSearch(APP, table_id);
    createTable(APP, table_id);
    fetchDataMembros(table_id);
}

function fetchDataMembros(table_id) {
    const properties = ['nick', 'data_nascimento','cargo', 'foco', 'data_entrada', 'recrutador'];
    const fieldDataEntrada = 'Tempo de clan'
    const extraField = {
        name: 'Editar',
        content: `
        <div>
            <img value="%id" status="Banido" src="./imgs/icons/Banir.svg" alt="Banir" onclick="checkOutSolicitation(event)">
            <img value="%id" status="Ativo" src="./imgs/icons/Edit.svg" alt="Editar" onclick="renderEditPage(event)">
            <img value="%id" status="Excluído" src="./imgs/icons/Close.svg" alt="Negar" onclick="checkOutSolicitation(event)">
        </div>
        `
    }

    fetchDataAndRenderTable(URL_GET_MEMBROS_ATIVOS, table_id, properties, extraField, ()=>{
        replaceInTableHeader(FIELD_MASK['data_entrada'], fieldDataEntrada);
        convertDatesToAges(table_id, FIELD_MASK['data_nascimento']);
        convertDatesToAges(table_id, fieldDataEntrada, true);
    })
}

function checkOutSolicitation(event){
    const id = event.target.getAttribute('value');
    const status = event.target.getAttribute('status');
    const proceed = confirm(`Tem certeza que deseja definir o membro como ${status}?`)

    if (proceed) {
        if (status == 'Ativo'){
            updateMember(id);
        }else if(status == 'Excluído'){
            const comentario = prompt('Digite o motivo da expulsão: ')
            excludeMember(id, comentario)
        }else if(status == 'Banido'){
            const comentario = prompt('Digite o motivo da expulsão: ')
            banMember(id, comentario)
        }else{
            throw new Error( `Invalid status ${status}`);
        }
    }

    function updateMember(id) {
        const opcoes = {
            method: 'PATCH', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({recrutador : getCookie(ETY_ADM_LOGIN_COOKIE)})
        };
    
        fetch(`${URL_PATH_ATIVAR_MEMBRO}/${id}`, opcoes)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Algo deu errado na requisição: ' + response.statusText);
            })
            .then(_ => {
                alert(`O membro foi definido como Ativo!`);
                getRedirectElement()?.click()
            })
            .catch(error => {
                console.error('Erro durante a requisição:', error);
            });
    }
    
    function excludeMember(id, comentario) {
        const opcoes = {
            method: 'PATCH', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({comentario})
        }
        fetch(`${URL_KICK_MEMBRO}/${id}`, opcoes)
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
    
    function banMember(id, comentario) {
        const opcoes = {
            method: 'PATCH', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({comentario})
        }
        fetch(`${URL_BAN_MEMBRO}/${id}`, opcoes)
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
        alert(`Não foi possível realizar o cadastro. Verifique se não há um membro cadastrado com o nick "${data.nick}"`);
    }

    function cleanForm() {
        document.getElementById('nick').value = '';
        document.getElementById('data_nascimento').value = '2002-06-30';
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
        let i = 0;

        for (const prop of properties) {
            const th = document.createElement('th');
            const field = FIELD_MASK[prop] || prop;
            th.textContent = field;
            th.id = `${i}-${prop}`
            th.onclick = (event) => setOrder(event, tableId)
            row.appendChild(th);
            i++;
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
                const ISO_8601_FULL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(([+-]\d{2}:\d{2})|Z)?$/i;
                const ISO_8601 = /^\d{4}-\d{2}-\d{2}$/;
            
                return ISO_8601_FULL.test(dataStr) || ISO_8601.test(dataStr);
            }
            
        }
    }

    function renderVoidTable(tableId) {
        const table = document.getElementById(tableId);
        if (!table) {
            console.error(`No table found with id "${tableId}"`);
            return;
        }
        table.innerHTML = '<h2>Não há nada aqui!</h2>';
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
                updateCountSearch(data.length)
            }
            
            if (callback) {
                callback()
            }
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

function convertDatesToAges(tableId, columnHeader, dayReturn=false) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.log("Tabela não encontrada!");
        return;
    }
    
    const headers = table.querySelectorAll('thead th');
    let columnIndex = -1;
    
    headers.forEach((th, index) => {
        if (th.textContent === columnHeader) {
            columnIndex = index;
        }
    });

    if (columnIndex === -1) {
        return;
    }

    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const cell = row.cells[columnIndex];
        if (cell) {
            const dateText = cell.textContent;
            const dateRegex = /^\d{2}-\d{2}-\d{4}$/; // Regex para validar o formato 'dd-mm-yyyy'

            if (dateRegex.test(dateText)) {
                const [day, month, year] = dateText.split('-').map(Number);
                const date = new Date(year, month - 1, day); // Os meses no JS começam de 0
                let age;

                if (dayReturn){
                    age = `${calculateAgeInDays(date)} dias`;
                }else{
                    age = `${calculateAge(date)} anos`;
                }

                cell.textContent = age;
            }
        }
    });

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
}

function setOrder(event, tableId) {
    const index = event.target.id.split('-')[0];
    sortTableByColumn(index, tableId);
}

function sortTableByColumn(columnIndex, tableId) {
    const table = document.getElementById(tableId);
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Função para extrair o valor da célula (assume que é texto ou número)
    const getCellValue = (row, index) => row.children[index].innerText || row.children[index].textContent;

    // Função para comparar os valores das células (converte em número se possível)
    const compareCells = (rowA, rowB) => {
        const valA = getCellValue(rowA, columnIndex);
        const valB = getCellValue(rowB, columnIndex);
        const floatA = parseFloat(valA.replace(',', '.'));
        const floatB = parseFloat(valB.replace(',', '.'));

        if (!isNaN(floatA) && !isNaN(floatB)) {
            return floatA - floatB;
        }
        return valA.localeCompare(valB);
    };

    // Determinar se a tabela já está ordenada por essa coluna
    let sorted = true;
    for (let i = 0; i < rows.length - 1; i++) {
        if (compareCells(rows[i], rows[i + 1]) > 0) {
            sorted = false;
            break;
        }
    }

    // Se já está ordenada, inverter a ordem
    if (sorted) {
        rows.reverse();
    } else {
        rows.sort(compareCells);
    }

    // Reanexar as linhas ao corpo da tabela na nova ordem
    rows.forEach(row => tbody.appendChild(row));
}

function init() {
    const nick = getCookie(ETY_ADM_LOGIN_COOKIE);
    const element = document.querySelector('#title_nick');
    const msg = `Seja Bem-Vindo ${nick}!`;
    element.textContent = msg;
    solicitacoes.click()
}

init();
