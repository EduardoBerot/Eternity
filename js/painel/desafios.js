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
        <label>Data do desafio</label>
        <input id="data_atual" type="date" min="2024-09-30">
    </div>
    <div style="display:flex;gap:1em;flex-wrap:wrap;">
        <button class="btn btn-success" onclick="marcarTodos()">Todos</button>
        <button class="btn btn-danger" onclick="desmarcarTodos()">Nenhum</button>
        <button class="btn btn-primary" onclick="enviarMarcados()">Confirmar</button>
        <button class="btn btn-secondary" onclick="renderDesafiosRelatorio()">Gerar Relatório</button>
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

    setDataAtual()
}

function renderDesafiosRelatorio() {
    APP.innerHTML = `
    <h1 style="text-align:center;">Relatório de Desafios</h1>
    <div style="display:flex;flex-direction:column;gap:8px;justify-content:center;margin-bottom:1em;">
        <label>Data do desafio</label>
        <input id="data_atual" type="date" min="2024-09-30" value="${getDataAtual()}">
    </div>
    <div style="display:flex;gap:1em;flex-wrap:wrap;">
        <button class="btn btn-danger" onclick="desafios.click()">Voltar</button>
        <button class="btn btn-primary" onclick="gerarRelatorio(getDataAtual())">Gerar</button>
    </div>
    `;
    gerarRelatorio();
}

function gerarRelatorio() {
    const data_atual = document.getElementById('data_atual').value;
    APP.innerHTML = `
    <h1 style="text-align:center;">Relatório de Desafios</h1>
    <div style="display:flex;flex-direction:column;gap:8px;justify-content:center;align-items:center;margin-bottom:1em;">
        <label>Data do desafio</label>
        <input id="data_atual" type="date" min="2024-09-30" value="${data_atual}">
        <sub style="color:#202020;">*Apenas mês e ano será avaliado</sub>
    </div>
    <div style="display:flex;gap:1em;flex-wrap:wrap;">
        <button class="btn btn-danger" onclick="desafios.click()">Voltar</button>
        <button class="btn btn-primary" onclick="gerarRelatorio(getDataAtual())">Gerar</button>
    </div>
    `;
    console.log(data_atual);
    const table_id = 'tb_desafios_relatorio';
    renderLoading(APP);
    renderSearch(APP, table_id);
    createTable(APP, table_id);

    const properties = ['nick', 'quantidade'];

    fetchDataAndRenderTable(`${URL_RELATORIO_DESAFIOS}?data=${encodeURI(data_atual)}`, table_id, properties)
}

function setDataAtual() {
    const data_atual = document.getElementById('data_atual');
    const dataAtual = new Date();
    const diaAtual = dataAtual.getDate();
    const mesAtual = dataAtual.getMonth() + 1;
    const anoAtual = dataAtual.getFullYear();

    function f(num) {return num.toString().padStart(2,'0')}
    
    const valor = `${anoAtual}-${f(mesAtual)}-${f(diaAtual)}`;

    data_atual.value = valor;
}

function getDataAtual() {
    const data_atual = document.getElementById('data_atual');
    const dataAtual = new Date();
    const diaAtual = dataAtual.getDate();
    const mesAtual = dataAtual.getMonth() + 1;
    const anoAtual = dataAtual.getFullYear();

    function f(num) {return num.toString().padStart(2,'0')}

    const valor = `${anoAtual}-${f(mesAtual)}-${f(diaAtual)}`;

    return valor;
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

        const data_atual = document.getElementById('data_atual').value

        if (data_atual.length < 1){
            alert('Escolha uma data para prosseguir o registro da informação.');
            return;
        }
        
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
            if (data) {
                alert('Registro realizado com sucesso.');
                desmarcarTodos();
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
