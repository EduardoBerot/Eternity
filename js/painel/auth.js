const URL_VERIFY_LOGIN = `${URL_BASE}/api/verifyLogin`;
let nick;

// Sem acesso valido, volta ao painel do membro: o unico login e o do Discord
// (16/10/2026), e o `admin=1` faz a aba Administracao renovar o acesso sozinha
// enquanto a sessao do Discord valer.
function voltarAoLogin() {
    deleteCookie(ETY_ADM_LOGIN_COOKIE);
    deleteCookie(ETY_ADM_PASS_COOKIE);
    window.location.href = '/#meu-painel&admin=1';
}

async function authenticate() {
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

            const {valid, lider, cidade, usoSite} = await response.json();
            // Quem ve o que dentro de Indicadores (indicadores.js).
            window.painelPermissoes = { lider: Boolean(valid && lider), usoSite: Boolean(valid && usoSite) };

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
            if (valid && (lider || usoSite)) {
                for (const id of ['indicadores']) {
                    const item = document.getElementById(id);
                    if (item) item.hidden = false;
                }
                // Quem depende de saber que e lider (link da conversa vindo do
                // Telegram) espera este sinal.
                if (lider) document.dispatchEvent(new Event('painel:lider'));
            }

            if (!valid) voltarAoLogin();
        } else {
            voltarAoLogin();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        voltarAoLogin();
    }
}

authenticate();