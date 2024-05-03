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

function createOptions(id, options, defaultValue) {
    const selectElement = document.getElementById(id);

    options.forEach(function (value) {
        const option = document.createElement("option");
        option.text = value;
        option.value = value;

        if (value == defaultValue){
            option.selected = true;
        }

        selectElement.add(option);
    });
}

function createTable(element,id) {
    element.innerHTML += `<table id="${id}"></table>`
}