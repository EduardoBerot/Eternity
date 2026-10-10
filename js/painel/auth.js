const URL_VERIFY_LOGIN = `${URL_BASE}/api/verifyLogin`;
let nick;

async function authenticate() {
    const MSG = 'Faça login na seção "Administração".';
    
    try {
        const cookiesOk = checkCookie(ETY_ADM_LOGIN_COOKIE) && checkCookie(ETY_ADM_PASS_COOKIE);
        if (cookiesOk) {
            const login_nick = getCookie(ETY_ADM_LOGIN_COOKIE);
            const token = getCookie(ETY_ADM_PASS_COOKIE);

            const response = await fetch(URL_VERIFY_LOGIN, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({token, login: login_nick})
        });

            if (!response.ok) {
                throw new Error('Erro na requisição');
            }

            const {valid, lider, cidade} = await response.json();

            // A aba Cidade e do nivel de Supervisor para cima (10/10/2026):
            // Estagiario, Auxiliar e Daimyo nao a veem. So some quando o backend
            // diz `false`; o backend recusa a aba de qualquer jeito.
            if (valid && cidade === false) {
                const item = document.getElementById('cidade');
                if (item) item.hidden = true;
            }

            // A aba de recrutamento nasce escondida no HTML: ela mostra
            // conversa privada de jogador e so lideres a enxergam. Esconder o
            // menu e conveniencia de interface -- quem autoriza de verdade e o
            // middleware do backend em cada requisicao.
            if (valid && lider) {
                for (const id of ['recrutamento', 'analises']) {
                    const item = document.getElementById(id);
                    if (item) item.hidden = false;
                }
                // Quem depende de saber que e lider (link da conversa vindo do
                // Telegram) espera este sinal.
                document.dispatchEvent(new Event('painel:lider'));
            }

            if (!valid){
                alert(MSG);
                deleteCookie(ETY_ADM_LOGIN_COOKIE);
                deleteCookie(ETY_ADM_PASS_COOKIE);
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