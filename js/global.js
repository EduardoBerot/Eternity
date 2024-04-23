const URL_DISCORD_INTEGRATION = "https://discord.com/api/webhooks/1228845807550074900/HwKlDWuMZqONWv1HumZnjIoBPJnYmuDKnWziKJbImSe2EuWf6PsvswlCHPLYph24FWvH"

const URL_BASE = "https://eternity-crud.onrender.com/api/membros"

const STAFFMEMBERS = ['Ducred22', 'Ov3r5y5t3m', 'XeKeMaTe', 'Sir_Felipee']

function setCookie(name, time) {
    const expiry = new Date();
    expiry.setTime(expiry.getTime() + (time * 60 * 1000)); // 10 minutos
    document.cookie = `${name}=true; expires=${expiry.toGMTString()}; path=/`;
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
