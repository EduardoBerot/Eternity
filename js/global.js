const URL_BASE = "https://eternity-crud.onrender.com"
// const URL_BASE = "http://localhost:5000"

const URL_MEMBERS = `${URL_BASE}/api/membro`;
const URL_MEMBER_UPDATES = `${URL_BASE}/api/solicitacoes/atualizacao`;
const URL_STAFFMEMBERS = `${URL_BASE}/api/membros/staffs`;
const URL_STAFFMEMBERS_NAMES = `${URL_BASE}/api/staffs`;

const ETY_ADM_LOGIN_COOKIE = 'eternity-adm-login';
const ETY_ADM_PASS_COOKIE = 'eternity-adm';

// Contas dos bots do cla (Eternity no Apocalipse, Coagula1999 no Genesis).
// Estao no cla para conduzir recrutamento e convites, mas nao sao pessoas: as
// paginas publicas as escondem da lista, da contagem e dos cargos.
const CONTAS_DO_CLA = ['eternity', 'coagula1999'];

function semContasDoCla(membros) {
    return (Array.isArray(membros) ? membros : [])
        .filter(m => !CONTAS_DO_CLA.includes(String(m?.nick || '').trim().toLowerCase()));
}

const CARGOS = ['Membro','Estagiário','Daimyo', 'Auxiliar', 'Ikko', 'Supervisor', 'Sohei', 'Coordenador', 'Heika', 'Dono', 'Fundador']

const clearAPP = (element=APP) => element.innerHTML = ''; 

async function getStaffsNames() {
    const resultado = await fetch (URL_STAFFMEMBERS_NAMES);
    return await resultado.json();
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

function createOptionsHTML(id, options, defaultValue) {
    const selectElement = document.getElementById(id);

    options.forEach(function (value) {
        const selected = value == defaultValue? 'selected' : ''
        const option = `<option ${selected} value="${value}">${value}</option>`;

        selectElement.innerHTML += option;
    });
}

function selectOptionByValue(selectId, optionValue) {
    const selectElement = document.getElementById(selectId);
    for (const i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].value === optionValue) {
            selectElement.selectedIndex = i;
            break;
        }
    }
}

function getDate(defaultDate='', brOrder=false) {
    if (arguments.length > 0 && !defaultDate) return '';
    const f = (str)=>String(str).padStart(2, '0');
    const date = defaultDate ? new Date(defaultDate) : new Date;
    let date_str;
    if (brOrder){
        date_str = `${f(date.getUTCDate())}-${f(date.getUTCMonth()+1)}-${date.getUTCFullYear()}`
    }else{
        date_str = `${date.getUTCFullYear()}-${f(date.getUTCMonth()+1)}-${f(date.getUTCDate())}`
    }
    return date_str
}

// Limites do campo de nascimento: de 5 a 100 anos atras. O calendario nem
// oferece data fora disso e o navegador barra o envio; o backend confere de novo.
function birthDateRangeAttrs() {
    const f = (n)=>String(n).padStart(2, '0');
    const hoje = new Date();
    const dia = `${f(hoje.getMonth()+1)}-${f(hoje.getDate())}`;
    return `min="${hoje.getFullYear()-100}-${dia}" max="${hoje.getFullYear()-5}-${dia}"`;
}

function getFormData() {
    const data = {
        nick: document.getElementById('nick')?.value,
        data_nascimento: document.getElementById('data_nascimento')?.value,
        recrutador: document.getElementById('recrutador')?.value,
        cargo: document.getElementById('cargo')?.value,
        data_entrada: document.getElementById('data_entrada')?.value,
        status: document.getElementById('status')?.value,
    }
    return data
}

function setCookie(name, time, value='') {
    const expiry = new Date();  
    expiry.setTime(expiry.getTime() + (time * 60 * 1000));
    document.cookie = `${name}=${value}; expires=${expiry.toGMTString()}; path=/`;
}

function checkCookie(name) {
    const cookieName = `${name}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
        let c = cookies[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cookieName) == 0) {
            return true;
        }
    }
    return false;
}

function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
}

function getCookie(cookieName) {
    var name = cookieName + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookiesArray = decodedCookie.split(';');
    for(var i = 0; i < cookiesArray.length; i++) {
        var cookie = cookiesArray[i];
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) == 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return undefined;
}

function promptOptions(msg, options) {
    let objOptions = {}
    let mensage = msg + options.map((op, id) => {
        objOptions[id+1] = op;
        return `\n${id + 1} - ${op}`
    }).join('')

    return objOptions[+prompt(mensage)]
}

