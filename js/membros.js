// Função que busca dados e renderiza uma tabela
function fetchDataAndRenderTable(url, tableId, properties) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('loading').style.display = 'none';
            renderTable(data, tableId, properties);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

// Função que cria e preenche a tabela com dados
function renderTable(data, tableId, properties) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`No table found with id "${tableId}"`);
        return;
    }

    // Limpar tabela existente
    table.innerHTML = '';

    // Criar cabeçalho da tabela
    const thead = table.createTHead();
    const row = thead.insertRow();
    for (const prop of properties) {
        const th = document.createElement('th');
        th.textContent = prop;
        row.appendChild(th);
    }

    // Criar corpo da tabela
    const tbody = table.createTBody();
    data.forEach(item => {
        const row = tbody.insertRow();
        for (const prop of properties) {
            const cell = row.insertCell();
            cell.textContent = item[prop];
        }
    });
}

// Exemplo de uso
// URL de onde os dados serão obtidos
const dataUrl = 'https://eternity-crud.onrender.com/api/membros';
// ID da tabela onde os dados serão exibidos
const tableId = 'membros';
// Propriedades dos objetos que você deseja exibir
const propertiesToShow = ['nick', 'foco', 'cargo', 'status'];

// Chamar a função
fetchDataAndRenderTable(dataUrl, tableId, propertiesToShow);