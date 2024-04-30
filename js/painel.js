const URL_VERIFY_LOGIN = `${URL_BASE}/api/verifyLogin`;
let nick;

async function index() {
    await authenticate();
    const dataUrl = `${URL_BASE}/api/membros`;
    const tableId = 'membros';
    const propertiesToShow = ['nick', 'cargo', 'data_entrada'];

    fetchDataAndRenderTable(dataUrl, tableId, propertiesToShow);
}

async function authenticate() {
    const MSG = 'Faça login na seção "Administração".';
    
    try {
        if (checkCookie(ETY_ADM_COOKIE)) {
            const token = getCookie(ETY_ADM_COOKIE);

            const response = await fetch(URL_VERIFY_LOGIN, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({token})
        });

            if (!response.ok) {
                throw new Error('Erro na requisição');
            }

            const {isValid} = await response.json();

            if (isValid){
                nick = isValid;
            }else{
                alert(MSG);
                deleteCookie(ETY_ADM_COOKIE);
                window.location.href = '/';
            }
        } else {
            alert(MSG);
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        alert(MSG);
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