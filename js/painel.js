const ETY_ADM_COOKIE = 'eternity-adm'

function index() {
    authenticate();
    const dataUrl = 'https://eternity-crud.onrender.com/api/membros';
    const tableId = 'membros';
    const propertiesToShow = ['nick', 'cargo', 'data_entrada'];
    
    fetchDataAndRenderTable(dataUrl, tableId, propertiesToShow);
}

function authenticate() {
    if(checkCookie(ETY_ADM_COOKIE)){
        
    }else{
        alert('Faça login na seção "Administração".')
        window.location.href = '/';
    }
}

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
            data = formatData(data);
            renderTable(data, tableId, properties);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

function formatData(data) {
    return data.map(item => {
        const date = new Date(item.data_entrada);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        return { ...item, data_entrada: formattedDate };
    });
}

function renderTable(data, tableId, properties) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`No table found with id "${tableId}"`);
        return;
    }

    table.innerHTML = '';

    const thead = table.createTHead();
    const row = thead.insertRow();
    for (const prop of properties) {
        const th = document.createElement('th');
        th.textContent = prop;
        row.appendChild(th);
    }

    const tbody = table.createTBody();
    data.forEach(item => {
        const row = tbody.insertRow();
        for (const prop of properties) {
            const cell = row.insertCell();
            cell.textContent = item[prop];
        }
    });
}

index();