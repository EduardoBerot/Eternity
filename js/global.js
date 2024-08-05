// const URL_BASE = "https://eternity-crud.onrender.com"
const URL_BASE = "http://localhost:5000"
const URL_MEMBERS = `${URL_BASE}/api/membro`;
// const URL_MEMBERS = `${URL_BASE}/api/membros`;
const URL_STAFFMEMBERS = `${URL_BASE}/api/membros/staffs`;
const URL_STAFFMEMBERS_NAMES = `${URL_BASE}/api/staffs`;

const ETY_ADM_LOGIN_COOKIE = 'eternity-adm-login';
const ETY_ADM_PASS_COOKIE = 'eternity-adm';

const FOCUS_TYPE = ['PvP', 'Torneio', 'Build', 'Farm'];
const CARGOS = ['Membro','Estagiário', 'Auxiliar', 'Supervisor', 'Coordenador', 'Dono']

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

function getFormData() {
    const data = {
        nick: document.getElementById('nick')?.value,
        data_nascimento: document.getElementById('data_nascimento')?.value,
        foco: document.getElementById('foco')?.value,
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

