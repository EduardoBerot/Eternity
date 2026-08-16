const APP = document.getElementById("app");

const pages_content = {
    solicitacoes: renderSolicitacoes,
    membros: renderMembros,
    adicionar: renderAdicionar,
    excluidos: renderExcluidos,
    historico: renderHistorico,
    desafios: renderDesafios,
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

function renderExcluidos() {
    const table_id = 'tb_excluidos';
    const properties = ['nick', 'data_nascimento', 'data_entrada', 'updatedAt'];
    renderLoading(APP);
    createTable(APP, table_id);
    const extraField = {
        name: 'Status',
        content: `
            <div>
                <img value="%id" status="Ativo" src="./imgs/icons/Check.svg" alt="Aceitar" onclick="checkOutSolicitation(event)">
            </div>
        `
    }

    fetchDataAndRenderTable(URL_GET_MEMBROS_BANIDOS, table_id, properties, extraField, ()=>{
        convertDatesToAges(table_id, FIELD_MASK['data_nascimento'])
    });
}

function renderSolicitacoes() {
    const table_id = 'tb_solicitacoes';
    const incompleteTableId = 'tb_cadastros_incompletos';
    const updateTableId = 'tb_atualizacoes_cadastrais';
    const properties = ['nick', 'data_nascimento', 'data_entrada'];
    const fieldDataEntrada = 'Tempo de Solicitação'
    APP.innerHTML = `
        <div class="pending-page">
            <header class="pending-page__intro">
                <span class="pending-page__eyebrow">Central de análise</span>
                <h1>Pendências</h1>
                <p>Revise novos pedidos de entrada e alterações de cadastro em um só lugar.</p>
            </header>

            <div class="pending-list">
                <section class="pending-card" aria-labelledby="title_solicitacoes">
                    <div class="pending-card__header">
                        <div>
                            <h2 id="title_solicitacoes">Solicitações de entrada</h2>
                            <p>Jogadores aguardando aprovação para entrar no clã.</p>
                        </div>
                        <span class="pending-card__count" id="count_solicitacoes" aria-label="Total de solicitações">—</span>
                    </div>
                    <div class="pending-card__loading" id="loading_solicitacoes">Carregando solicitações...</div>
                    <div class="pending-card__table"><table id="${table_id}"></table></div>
                </section>

                <section class="pending-card" aria-labelledby="title_cadastros">
                    <div class="pending-card__header">
                        <div>
                            <h2 id="title_cadastros">Pendências de cadastro</h2>
                            <p>Complete dados ausentes e analise alterações enviadas pelos membros.</p>
                        </div>
                        <span class="pending-card__count" id="count_cadastros_total" aria-label="Total de cadastros pendentes">—</span>
                    </div>
                    <div class="pending-subsection">
                        <div class="pending-subsection__header">
                            <div>
                                <h3>Cadastros incompletos</h3>
                                <p>Membros ativos que ainda possuem algum campo marcado como “Não informado”.</p>
                            </div>
                            <span class="pending-card__count pending-card__count--small" id="count_incompletos" data-pending-group="cadastros">—</span>
                        </div>
                        <div class="pending-card__loading" id="loading_incompletos">Carregando cadastros incompletos...</div>
                        <div class="pending-card__table"><table id="${incompleteTableId}"></table></div>
                    </div>
                    <div class="pending-subsection pending-subsection--divided">
                        <div class="pending-subsection__header">
                            <div>
                                <h3>Alterações enviadas</h3>
                                <p>Pedidos de alteração cadastral enviados pelos próprios membros.</p>
                            </div>
                            <span class="pending-card__count pending-card__count--small" id="count_atualizacoes" data-pending-group="cadastros">—</span>
                        </div>
                        <div class="pending-card__loading" id="loading_cadastros">Carregando alterações...</div>
                        <div class="pending-card__table"><table id="${updateTableId}"></table></div>
                    </div>
                </section>
            </div>
        </div>
    `;
    const extraField = {
        name: 'Ações',
        content: `
            <div class="pending-actions">
                <img value="%id" status="Ativo" src="./imgs/icons/Check.svg" alt="Aceitar" title="Aceitar solicitação" onclick="checkOutSolicitation(event)">
                <img value="%id" status="Negado" src="./imgs/icons/Close.svg" alt="Negar" title="Negar solicitação" onclick="checkOutSolicitation(event)">
            </div>
        `
    }
    fetchDataAndRenderTable(URL_GET_SOLICITACOES, table_id, properties, extraField, ()=>{
        replaceInTableHeader(FIELD_MASK['data_entrada'], fieldDataEntrada);
        convertDatesToAges(table_id, FIELD_MASK['data_nascimento']);
        convertDatesToAges(table_id, fieldDataEntrada, true);
    }, { headers: getAdminRequestHeaders() }, {
        loadingId: 'loading_solicitacoes',
        countId: 'count_solicitacoes',
        emptyMessage: 'Nenhuma solicitação de entrada aguardando análise.'
    });

    const incompleteActions = {
        name: 'Editar',
        content: `
            <div class="pending-actions">
                <img value="%id" return-page="solicitacoes" src="./imgs/icons/Edit.svg" alt="Editar" title="Completar cadastro" onclick="renderEditPage(event)">
            </div>
        `
    };
    fetchDataAndRenderTable(
        URL_GET_CADASTROS_PENDENTES,
        incompleteTableId,
        ['nick', 'data_nascimento', 'cargo', 'data_entrada', 'recrutador'],
        incompleteActions,
        () => convertDatesToAges(incompleteTableId, FIELD_MASK['data_nascimento']),
        { headers: getAdminRequestHeaders() },
        {
            loadingId: 'loading_incompletos',
            countId: 'count_incompletos',
            groupCountId: 'count_cadastros_total',
            emptyMessage: 'Todos os membros ativos estão com o cadastro completo.'
        },
    );

    const updateActions = {
        name: 'Ações',
        content: `
            <div class="pending-actions">
                <img value="%id" action="aprovar" src="./imgs/icons/Check.svg" alt="Aprovar" title="Aprovar alteração" onclick="checkOutProfileUpdate(event)">
                <img value="%id" action="negar" src="./imgs/icons/Close.svg" alt="Negar" title="Negar alteração" onclick="checkOutProfileUpdate(event)">
            </div>
        `
    };
    fetchDataAndRenderTable(
        URL_GET_ATUALIZACOES,
        updateTableId,
        ['nick', 'data_nascimento', 'createdAt'],
        updateActions,
        () => convertDatesToAges(updateTableId, FIELD_MASK['data_nascimento']),
        { headers: getAdminRequestHeaders() },
        {
            loadingId: 'loading_cadastros',
            countId: 'count_atualizacoes',
            groupCountId: 'count_cadastros_total',
            emptyMessage: 'Nenhuma atualização cadastral aguardando análise.'
        },
    );
}

async function checkOutProfileUpdate(event) {
    const id = event.target.getAttribute('value');
    const action = event.target.getAttribute('action');
    if (!['aprovar', 'negar'].includes(action)) return;
    if (!confirm(`Tem certeza que deseja ${action} esta atualização cadastral?`)) return;

    const body = action === 'negar'
        ? { comentario: prompt('Motivo da recusa:') || '' }
        : {};
    try {
        const response = await fetch(`${URL_PATH_ATUALIZACOES}/${id}/${action}`, {
            method: 'PATCH',
            headers: getAdminRequestHeaders(),
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error(`Falha HTTP ${response.status}`);
        alert(`Atualização cadastral ${action === 'aprovar' ? 'aprovada' : 'negada'}!`);
        getRedirectElement()?.click();
    } catch (error) {
        console.error('Erro ao analisar atualização cadastral:', error);
        alert('Não foi possível analisar a atualização cadastral.');
    }
}

async function renderAdicionar() {
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
    const staffs = await getStaffsNames();
    createOptions('recrutador', staffs, nick);
    createOptions('cargo', CARGOS, 'Membro');
}

function renderMembros(view = 'ativos') {
    const table_id = 'tb_membros';
    const showingInactive = view === 'inativos';
    APP.innerHTML = `
        <div class="members-page">
            <div class="members-page__header">
                <div>
                    <span class="pending-page__eyebrow">Gestão do clã</span>
                    <h1>Membros</h1>
                    <p>Consulte os membros ativos ou alterne para os afastados temporariamente.</p>
                </div>
                <div class="member-toggle" role="group" aria-label="Exibir membros">
                    <button type="button" class="member-toggle__button ${showingInactive ? '' : 'is-active'}" onclick="renderMembros('ativos')">Ativos</button>
                    <button type="button" class="member-toggle__button ${showingInactive ? 'is-active' : ''}" onclick="renderMembros('inativos')">Inativos</button>
                </div>
            </div>
            <div id="members_table_area" class="members-page__table"></div>
        </div>
    `;
    const tableArea = document.getElementById('members_table_area');
    renderLoading(tableArea);
    renderSearch(tableArea, table_id);
    createTable(tableArea, table_id);
    fetchDataMembros(table_id, view);
}

function fetchDataMembros(table_id, view = 'ativos') {
    const showingInactive = view === 'inativos';
    const properties = showingInactive
        ? ['nick', 'cargo', 'inativo_desde', 'inativo_ate']
        : ['nick', 'data_nascimento', 'cargo', 'data_entrada', 'recrutador', 'discord_vinculado'];
    const fieldDataEntrada = 'Tempo de clan'
    const extraField = showingInactive
        ? {
            name: 'Status',
            content: `
                <div class="pending-actions">
                    <img value="%id" status="Ativo" src="./imgs/icons/Check.svg" alt="Reativar" title="Reativar membro" onclick="checkOutSolicitation(event)">
                </div>
            `
        }
        : {
            name: 'Editar',
            content: `
                <div class="pending-actions">
                    <img value="%id" status="Banido" src="./imgs/icons/Banir.svg" alt="Banir" title="Banir membro" onclick="checkOutSolicitation(event)">
                    <img value="%id" status="Ativo" src="./imgs/icons/Edit.svg" alt="Editar" title="Editar membro" onclick="renderEditPage(event)">
                    <img value="%id" status="Excluído" src="./imgs/icons/Close.svg" alt="Remover" title="Remover membro" onclick="checkOutSolicitation(event)">
                </div>
            `
        };

    const url = showingInactive ? URL_GET_MEMBROS_INATIVOS : URL_GET_VINCULOS_DISCORD;
    const fetchOptions = showingInactive ? {} : { headers: getAdminRequestHeaders() };
    fetchDataAndRenderTable(url, table_id, properties, extraField, ()=>{
        if (showingInactive) return;
        replaceInTableHeader(FIELD_MASK['data_entrada'], fieldDataEntrada);
        convertDatesToAges(table_id, FIELD_MASK['data_nascimento']);
        convertDatesToAges(table_id, fieldDataEntrada, true);
    }, fetchOptions)
}

async function checkOutSolicitation(event){
    const id = event.target.getAttribute('value');
    const status = event.target.getAttribute('status');
    const proceed = confirm(`Tem certeza que deseja definir o membro como ${status}?`)
    const msg_error = 'Opção incorreta';

    if (proceed) {
        if (status == 'Ativo'){
            updateMember(id);
        }else if(status == 'Negado'){
            const comentario = promptOptions('Escolha o motivo de recusar a solicitação: ', OPTIONS_RECUSE_SOLICITATION)
            if (comentario){
                excludeMember(id, comentario)
            }else{
                alert(msg_error)
            }
        }else if(status == 'Excluído'){
            const comentario = promptOptions('Escolha o motivo da expulsão: ', OPTIONS_KICK)
            if (comentario) {
                excludeMember(id, comentario)
            } else {
                alert(msg_error)
            }
        }else if(status == 'Banido'){
            const membro_staff = getCookie(ETY_ADM_LOGIN_COOKIE);
            const frase = `${membro_staff} está banindo o membro ${id}`;
            const test = prompt(`Escreva a seguinte frase de confirmação: ${frase}`);

            if (test == frase){
                const comentario = promptOptions('Escolha o motivo do banimento: ', OPTIONS_BAN)
                if (comentario) {
                    banMember(id, comentario)
                } else {
                    alert(msg_error)
                }
            }
        }else{
            throw new Error( `Invalid status ${status}`);
        }
    }

    function updateMember(id) {
        const opcoes = {
            method: 'PATCH', 
            headers: getAdminRequestHeaders(),
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
        const recrutador = getCookie(ETY_ADM_LOGIN_COOKIE);
        const opcoes = {
            method: 'PATCH', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({comentario, recrutador})
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
        const recrutador = getCookie(ETY_ADM_LOGIN_COOKIE);
        const opcoes = {
            method: 'PATCH', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({comentario, recrutador})
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

function fetchDataAndRenderTable(url, tableId, properties, extraField='', callback=null, fetchOptions={}, uiOptions={}) {
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
                if (prop === 'discord_vinculado') {
                    renderDiscordStatus(cell, item);
                    continue;
                }
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

        function renderDiscordStatus(cell, item) {
            const linked = item.discord_vinculado === true && /^https:\/\/discord\.com\/users\/\d{17,20}$/.test(item.discord_url || '');
            const status = document.createElement(linked ? 'a' : 'span');
            status.className = `discord-link-status ${linked ? 'is-linked' : 'is-pending'}`;
            status.textContent = linked ? 'Sim ↗' : 'Não';
            status.title = linked ? 'Abrir perfil no Discord' : 'Vínculo com o Discord pendente';
            if (linked) {
                status.href = item.discord_url;
                status.target = '_blank';
                status.rel = 'noopener noreferrer';
            }
            cell.appendChild(status);
        }

        function formatValue(value) {
            if (value === null || value === undefined || value === '') {
                return 'Não informado';
            }
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

    function renderVoidTable(tableId, message = 'Não há nada aqui!') {
        const table = document.getElementById(tableId);
        if (!table) {
            console.error(`No table found with id "${tableId}"`);
            return;
        }
        const columns = properties.length + (extraField ? 1 : 0);
        table.innerHTML = `<tbody><tr><td class="table-message" colspan="${columns}">${message}</td></tr></tbody>`;
    }

    function finishLoading() {
        if (uiOptions.loadingId) {
            const loading = document.getElementById(uiOptions.loadingId);
            if (loading) loading.hidden = true;
            return;
        }
        hideLoading();
    }

    function updateScopedCount(total) {
        if (!uiOptions.countId) return;
        const count = document.getElementById(uiOptions.countId);
        if (!count) return;
        count.textContent = total;
        count.dataset.count = Number.isFinite(total) ? total : 0;
        count.dataset.error = Number.isFinite(total) ? 'false' : 'true';

        if (uiOptions.groupCountId) {
            const groupCount = document.getElementById(uiOptions.groupCountId);
            const children = document.querySelectorAll('[data-pending-group="cadastros"]');
            const hasError = [...children].some(item => item.dataset.error === 'true');
            const hasPending = [...children].some(item => item.textContent === '—');
            if (groupCount) {
                groupCount.textContent = hasError
                    ? '!'
                    : (hasPending ? '—' : [...children].reduce((sum, item) => sum + Number(item.dataset.count || 0), 0));
            }
        }
    }

    fetch(url, fetchOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            finishLoading();
            updateScopedCount(data.length);
            if(data.length == 0){
                renderVoidTable(tableId, uiOptions.emptyMessage)
            }else{
                renderTable(data, tableId, properties);
                if (!uiOptions.countId) updateCountSearch(data.length)
            }
            
            if (callback) {
                callback()
            }
        })
        .catch(error => {
            finishLoading();
            updateScopedCount('!');
            renderVoidTable(tableId, 'Não foi possível carregar esta lista. Tente novamente.');
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
        return Math.max(0, daysDifference);
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
    const head = document.querySelector('#admin_profile_head');
    const msg = `Saudações ${nick}!`;
    element.textContent = msg;
    head.src = `https://mc-heads.net/head/${encodeURIComponent(nick)}`;
    head.alt = `Head do jogador ${nick}`;
    head.addEventListener('error', () => { head.hidden = true; }, { once: true });
    solicitacoes.click();
    checkAniver();
}

init();
