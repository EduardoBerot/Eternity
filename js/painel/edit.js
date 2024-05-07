const URL_PATH_MEMBRO = `${URL_BASE}/api/membro/id`;

function checkIdParameter() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('id')) {
        return true
    }
    return false
}

function rrr() {
    if (checkIdParameter()) {
        console.log('Oi')
    }
}

window.onload = rrr();
window.addEventListener('popstate', rrr());

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