// const URL_PATH_MEMBRO = `${URL_BASE}/api/membro/id`;
const URL_GET_MEMBRO = `${URL_BASE}/api/membro/id`;

function checkIdParameter() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('id')) {
        return true
    }
    return false
}

function renderEditPage(event) {
    const id = event.target.getAttribute('value');
    clearAPP(APP);
    renderLoading(APP);

    fetch(`${URL_GET_MEMBRO}/${id}`)
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Algo deu errado na requisição: ' + response.statusText);
    })
    .then(data => {
        renderFormEdit(data);
    })
    .catch(error => {
        console.error('Erro durante a requisição:', error);
    });
}

async function renderFormEdit(data){
    APP.innerHTML = `
    <h1 class="tittle">Editar Informações - ${data.nick}</h1>
    <form id="form_editar" value="${data.id}" onsubmit="submitEditar(event)">
        <div class="form-label">
            <label for="nick">Nick</label>
            <input type="text" id="nick" value="${data.nick}" placeholder="Nick" disabled>
        </div>
        <div class="form-label">
            <label for="data_nascimento">Data de Nascimento</label>
            <input type="date" value="${getDate(data.data_nascimento)}" id="data_nascimento" required>
        </div>
        <div class="form-label">
            <label for="foco">Foco</label>
            <select name="foco" id="foco" required></select>
        </div>
        <div class="form-label">
            <label for="cargo">Cargo</label>        
            <select name="cargo" id="cargo" required></select>
        </div>
        <input type="text" id="status" placeholder="Status" value="${data.status}" style="display:none"required>
        <div class="form-label">
            <label for="data_entrada">Data de Cadastro</label>
            <input type="date" id="data_entrada" value="${getDate(data.data_entrada)}" required>
        </div>
        <div class="form-label">
            <label for="recrutador">Recrutador</label>
            <select name="recrutador" id="recrutador" required></select>
        </div>
        <div id="form-label-editar-btn">
            <a onclick="goBackMembers()" tabindex="0" class="button">Voltar</a>
            <button>Salvar</button>
        </div>
    </form>
    `;
    const STAFFMEMBERS = await getStaffsNames();
    createOptions('recrutador', STAFFMEMBERS, data.recrutador);
    createOptions('foco', FOCUS_TYPE, data.foco);
    createOptions('cargo', CARGOS, data.cargo);
}

function goBackMembers() {
    membros.click()
}

function submitEditar(event) {
    event.preventDefault();
    const data = getFormData();
    const id = event.target.getAttribute('value');

    const opcoes = {
        method: 'PATCH', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    };

    fetch(`${URL_PATH_MEMBRO}/${id}`, opcoes)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Algo deu errado na requisição: ' + response.statusText);
        })
        .then(data => {
            alert(`O membro foi alterado com sucesso!`);
            getRedirectElement()?.click()
        })
        .catch(error => {
            console.error('Erro durante a requisição:', error);
        });
}