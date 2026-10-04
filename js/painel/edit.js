// const URL_PATH_MEMBRO = `${URL_BASE}/api/membro/id`;
const URL_GET_MEMBRO = `${URL_BASE}/api/membro/id`;
let editReturnPage = 'membros';

function checkIdParameter() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('id')) {
        return true
    }
    return false
}

function renderEditPage(event) {
    const id = event.target.getAttribute('value');
    editReturnPage = event.target.getAttribute('return-page') || 'membros';
    clearAPP(APP);
    renderLoading(APP);

    fetch(`${URL_GET_MEMBRO}/${id}`, { headers: getAdminRequestHeaders() })
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
    <p class="edit-help">Preencha todos os campos para concluir a pendência cadastral.</p>
    <form id="form_editar" value="${data.id}" onsubmit="submitEditar(event)">
        <div class="form-label">
            <label for="nick">Nick</label>
            <input type="text" id="nick" value="${data.nick}" placeholder="Nick" disabled>
        </div>
        <div class="form-label">
            <label for="data_nascimento">Data de Nascimento</label>
            <input type="date" value="${getDate(data.data_nascimento)}" id="data_nascimento" ${birthDateRangeAttrs()} required>
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
            <button type="button" class="edit-action edit-action--back" onclick="goBackMembers()">Voltar</button>
            <button type="submit" class="edit-action edit-action--save">Salvar</button>
        </div>
    </form>
    `;
    const STAFFMEMBERS = await getStaffsNames();
    createOptions('recrutador', STAFFMEMBERS, data.recrutador);
    createOptions('cargo', CARGOS, data.cargo);
    // Cargo so o Fundador muda (o backend confere de novo): para os outros o
    // campo fica travado, com o motivo a vista.
    const cargo = document.getElementById('cargo');
    cargo.dataset.original = data.cargo || '';
    if (!ehFundadorLogado()) {
        cargo.disabled = true;
        cargo.title = 'Só o Fundador muda o cargo. A mudança vale no jogo e no Discord.';
    }
}

// Logins que mudam cargo pelo painel. O backend tem a mesma lista
// (ETERNITY_FOUNDER_LOGINS); aqui so decide se o campo abre.
const LOGINS_FUNDADOR = ['ducred22'];

function ehFundadorLogado() {
    return LOGINS_FUNDADOR.includes(String(getCookie(ETY_ADM_LOGIN_COOKIE) || '').trim().toLowerCase());
}

function goBackMembers() {
    const target = document.getElementById(editReturnPage) || membros;
    target.click()
}

function submitEditar(event) {
    event.preventDefault();
    const data = getFormData();
    const id = event.target.getAttribute('value');
    const cargoCampo = document.getElementById('cargo');
    const mudouCargo = Boolean(cargoCampo && !cargoCampo.disabled && cargoCampo.value !== cargoCampo.dataset.original);
    // Campo travado nao vai no formulario: sem cargo, o backend nao mexe nele.
    if (cargoCampo?.disabled) delete data.cargo;
    if (mudouCargo && !confirm(`Mudar o cargo de ${cargoCampo.dataset.original || 'Membro'} para ${cargoCampo.value}?

A mudança vai para o jogo e para o Discord, com anúncio (promoção) ou mensagem privada (rebaixamento).`)) return;

    const opcoes = {
        method: 'PATCH', 
        headers: getAdminRequestHeaders(),
        body: JSON.stringify(data)
    };

    fetch(`${URL_PATH_MEMBRO}/${id}`, opcoes)
        .then(async response => {
            if (response.ok) {
                return response.json();
            }
            const corpo = await response.json().catch(() => ({}));
            if (corpo?.message) alert(corpo.message);
            throw new Error('Algo deu errado na requisição: ' + response.statusText);
        })
        .then(data => {
            alert(mudouCargo
                ? 'Membro alterado! O novo cargo chega ao jogo e ao Discord nos próximos minutos.'
                : 'O membro foi alterado com sucesso!');
            getRedirectElement()?.click()
        })
        .catch(error => {
            console.error('Erro durante a requisição:', error);
        });
}
