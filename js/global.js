const URL_BASE = "https://eternity-crud.onrender.com"
// const URL_BASE = "http://localhost:5000"
const URL_MEMBERS = `${URL_BASE}/api/membro`;

const ETY_ADM_LOGIN_COOKIE = 'eternity-adm-login';
const ETY_ADM_PASS_COOKIE = 'eternity-adm';

const STAFFMEMBERS = ['Ducred22', 'ov3r5y5t3m', 'XeKeMaTe', 'Sir_Felipee', 'DRAGON_SDK', 'DarkMelissa','trogro9'];
const FOCUS_TYPE = ['PvP', 'Torneio', 'Build', 'Farm'];
const CARGOS = ['Membro','Estagiário', 'Auxiliar', 'Supervisor', 'Coordenador', 'Dono']

const clearAPP = (element=APP) => element.innerHTML = ''; 

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
    const add = defaultDate ? 1 : 0;
    
    if (brOrder){
        return `${f(add+date.getDate())}-${f(date.getMonth()+1)}-${date.getFullYear()}`
    }else{
        return `${date.getFullYear()}-${f(date.getMonth()+1)}-${f(add+date.getDate())}`
    }
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
