function replaceInTableHeader(searchString, replaceString) {
    const headers = document.getElementsByTagName("th");
    Object.values(headers).forEach(function(header) {
        if (header.innerHTML.includes(searchString)) {
            header.innerHTML = header.innerHTML.replace(searchString, replaceString);
            return null;
        }
    });
}

function selectItem(itemSelect) {
    const itens = document.querySelectorAll(".itens");
    for (const item of itens) {
        if (item != itemSelect) {
            item.classList.remove("select");
        } else {
            item.classList.add("select");
        }
    }
};

function hideLoading() {
    const loading = document.getElementById('loading')
    if (loading){
        loading.style.display = 'none';
    }else{
        console.log('Elemento loading não encontrado.');
    }
}

function renderLoading(element) {
    element.innerHTML += '<div id="loading">Carregando<span class="loading-dot">...</span></div>'
}

function createTable(element,id) {
    element.innerHTML += `<table id="${id}"></table>`
}

function renderSearch(element, id) {
    element.innerHTML += `
    <div class="form-label">
        <input 
            type="text" id="search" table_id="${id}" placeholder="Pesquisar" oninput="updateTable(event)">
    </div>
    `
}

function updateTable(event) {
    const searchValue = event.target.value.toLowerCase();

    const tableId = event.target.getAttribute('table_id');

    const table = document.getElementById(tableId);

    if (!table) {
        console.error(`Tabela com o ID '${tableId}' não foi encontrada.`);
        return;
    }

    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        if (i>0){
            const cells = rows[i].getElementsByTagName('td');
            let rowContainsSearchText = false;
    
            for (let j = 0; j < cells.length; j++) {
                if (cells[j].textContent.toLowerCase().indexOf(searchValue) > -1) {
                    rowContainsSearchText = true;
                    break;
                }
            }
    
            if (rowContainsSearchText) {
                rows[i].style.display = '';
            } else {
                rows[i].style.display = 'none';
            }
        }
    }
}


