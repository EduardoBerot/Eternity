const URL_VERIFY_LOGIN = `${URL_BASE}/api/verifyLogin`;
let nick;

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

            const {valid} = await response.json();

            if (valid){
                nick = valid;
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

authenticate();