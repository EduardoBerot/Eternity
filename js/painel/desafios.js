
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
    <div id="seletor-data" style="display:flex;gap:8px;justify-content:center;margin-bottom:1em;">
        <div style="width:calc(33.333% - 16px / 3)">
            <label>Ano</label>
            <select style="width:100%" id="seletor-data-ano"></select>
        </div>
        <div style="width:calc(33.333% - 16px / 3)">
            <label>Mês</label>
            <select style="width:100%" id="seletor-data-mes"></select>
        </div>
        <div style="width:calc(33.333% - 16px / 3)">
            <label>Dia</label>
            <select style="width:100%" id="seletor-data-dia"></select>
        </div>
    </div>
    `
    const anos = ['2024'];
    const mes = Object.values(mesesDoAno);
    const dia = obterDias();

    const mes_atual = obterMesAtual();
    const dia_atual = obterDiaAtual();

    createOptions('seletor-data-ano', anos, '2024');
    createOptions('seletor-data-mes', mes, mes_atual);
    createOptions('seletor-data-dia', dia, dia_atual);

    const table_id = 'tb_desafios';
    renderLoading(APP);
    renderSearch(APP, table_id);
    createTable(APP, table_id);
    
    fetchDataDesafios(table_id);

    function fetchDataDesafios(table_id) {
        const properties = ['nick'];
        const extraField = {
            name: 'Concluído',
            content: `<input type="checkbox" class="menu-filtrar-filtro">`
        }
    
        fetchDataAndRenderTable(URL_GET_MEMBROS_ATIVOS, table_id, properties, extraField,)
    }
}

function obterMesAtual() {
    const dataAtual = new Date();
    const mesNumerico = dataAtual.getMonth();
    return mesesDoAno[mesNumerico];
}

function obterDiaAtual() {
    const dataAtual = new Date();
    return dataAtual.getDate();
}

function obterDias() {
    const dias = [];
    for (let i = 1; i <= 31; i++) {
        dias.push(i);
    }
    return dias;
}