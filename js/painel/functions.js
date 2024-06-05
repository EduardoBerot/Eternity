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
    element.innerHTML += `
    <div id="loading" >Carregando
        <span class="loading-dot">...</span>
        <div class="alert" style="font-size:0.75em;margin-left:auto;margin-top:0.5em;">(isso pode demorar um pouco)</div>
    </div>`
}

function createTable(element,id) {
    element.innerHTML += `<table id="${id}"></table>`
}

function renderSearch(element, id) {
    element.innerHTML += `
    <div class="form-label">
        <label for="search" id="count_search" style="padding-bottom:0.5em;">Nº de ocorrências</label>
        <input 
            type="text" id="search" table_id="${id}" placeholder="Pesquisar" oninput="updateTable(event)">
    </div>
    `
}

function updateCountSearch(num){
    const countSearch = document.getElementById('count_search');
    if (countSearch) {
        countSearch.innerHTML = `Nº de ocorrências: ${num}`;
    }
}

function updateTable(event) {
    const searchValue = event.target.value.toLowerCase();

    const tableId = event.target.getAttribute('table_id');

    const table = document.getElementById(tableId);

    let count = 0

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
                count++;
            } else {
                rows[i].style.display = 'none';
            }
        }
    }
    updateCountSearch(count);
}

function createModal() {
    return new Promise((resolve) => {
      // Create modal container
      const modalContainer = document.createElement('div');
      modalContainer.style.position = 'fixed';
      modalContainer.style.top = '0';
      modalContainer.style.left = '0';
      modalContainer.style.width = '100%';
      modalContainer.style.height = '100%';
      modalContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
      modalContainer.style.display = 'flex';
      modalContainer.style.justifyContent = 'center';
      modalContainer.style.alignItems = 'center';
      modalContainer.style.zIndex = '1000';
  
      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.style.backgroundColor = '#fff';
      modalContent.style.padding = '20px';
      modalContent.style.borderRadius = '5px';
      modalContent.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  
      // Create select element
      const selectElement = document.createElement('select');
      const option1 = document.createElement('option');
      option1.value = 'option1';
      option1.text = 'Option 1';
      const option2 = document.createElement('option');
      option2.value = 'option2';
      option2.text = 'Option 2';
      selectElement.add(option1);
      selectElement.add(option2);
  
      // Create OK button
      const okButton = document.createElement('button');
      okButton.textContent = 'OK';
      okButton.style.marginTop = '10px';
  
      // Append elements to modal content
      modalContent.appendChild(selectElement);
      modalContent.appendChild(okButton);
      
      // Append modal content to modal container
      modalContainer.appendChild(modalContent);
      
      // Append modal container to body
      document.body.appendChild(modalContainer);
  
      // Add event listener to OK button
      okButton.addEventListener('click', () => {
        const selectedValue = selectElement.value;
        document.body.removeChild(modalContainer);
        resolve(selectedValue);
      });
    });
  }