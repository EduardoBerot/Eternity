
const mesesDoAno = {
    0: 'Janeiro',
    1: 'Fevereiro',
    2: 'Março',
    3: 'Abril',
    4: 'Maio',
    5: 'Junho',
    6: 'Julho',
    7: 'Agosto',
    8: 'Setembro',
    9: 'Outubro',
    10: 'Novembro',
    11: 'Dezembro'
};

function renderDesafios() {
    APP.innerHTML = `
    <h1 style="text-align:center;">Gerenciador de Desafios</h1>
    <div style="display:flex;flex-direction:column;gap:8px;justify-content:center;margin-bottom:1em;">
        <label>Dia do desafio</label>
        <input type="date" min="2024-09-30">
    </div>
    <div style="display:flex;gap:1em;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="marcarTodos()">Todos</button>
        <button class="btn btn-danger" onclick="desmarcarTodos()">Nenhum</button>
        <button class="btn btn-primary" onclick="enviarMarcados()">Confirmar</button>
    </div>
    `;

    const table_id = 'tb_desafios';
    renderLoading(APP);
    renderSearch(APP, table_id);
    createTable(APP, table_id);
    
    fetchDataDesafios(table_id);

    function fetchDataDesafios(table_id) {
        const properties = ['nick'];
        const extraField = {
            name: 'Concluído',
            content: `<input id-member="%id" type="checkbox" class="menu-filtrar-filtro">`
        }
    
        fetchDataAndRenderTable(URL_GET_MEMBROS_ATIVOS, table_id, properties, extraField,)
    }
}

function marcarTodos() {
    const checkboxes = document.querySelectorAll('.menu-filtrar-filtro');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function desmarcarTodos() {
    const checkboxes = document.querySelectorAll('.menu-filtrar-filtro');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

function enviarMarcados() {
    const checkboxes = document.querySelectorAll('.menu-filtrar-filtro');
    const desafiosMarcados = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            desafiosMarcados.push(checkbox.getAttribute('id-member'));
        }
    });
    
    if (desafiosMarcados.length > 0) {
        fetchDataConcluirDesafios(desafiosMarcados);
    }
    else {
        alert('Nenhum desafio marcado para concluir.');
    }
    
    function fetchDataConcluirDesafios(desafios) {

        const data_atual = document.querySelector('input[type=date]').value

        if (data_atual.length < 1){
            alert('Escolha uma data para prosseguir o registro da informação.');
            return;
        }

        console.log(data_atual);
        
        
        const data = {
            date: data_atual,
            members: desafios
        };


        fetch(URL_CONCLUIR_DESAFIOS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Registro realizado com sucesso.');
            }
            else {
                alert('Falha ao realizar o registro.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Falha ao realizar o registro.');
        });
    }
}
