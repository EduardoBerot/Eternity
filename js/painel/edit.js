const URL_PATH_MEMBRO = `${URL_BASE}/api/membro/id`;

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

function renderFormEdit(data){
    APP.innerHTML = `
    <h1 class="tittle">Editar Informações - ${data.nick}</h1>
    <form id="form_editar" onsubmit="submitEditar(event)">
        <div class="form-label">
            <label for="nick">Nick</label>
            <input type="text" id="nick" value="${data.nick}" placeholder="Nick" disabled>
        </div>
        <div class="form-label">
            <label for="idade">Data de Nascimento</label>
            <input type="number" step="1" min="5" max="120" value="${data.idade}" id="idade" placeholder="Idade" required>
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
            <input type="date" id="data_entrada" placeholder="Data" required>
        </div>
        <div class="form-label">
            <label for="recrutador">Recrutador</label>
            <select name="recrutador" id="recrutador" required></select>
        </div>
        <div class="form-label">
            <a onclick="goBackMembers()" class="button">Voltar</a>
            <button>Editar</button>
        </div>
    </form>
    `;

    createOptions('recrutador', STAFFMEMBERS, data.recrutador);
    createOptions('foco', FOCUS_TYPE, data.foco);
    createOptions('cargo', CARGOS, data.cargo);
    
    setDate();

    function setDate() {
        const date_input = document.querySelector('input[type="date"]');
        date_input.value = getDate(data.data_entrada,false,true);
    }
}

function goBackMembers() {
    membros.click()
}

function submitEditar() {
    
}