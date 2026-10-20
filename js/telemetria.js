// Uso do site (20/10/2026, no lugar do Google Analytics): cada pagina vista,
// o tempo com a aba visivel e algumas acoes vao para a API do clã
// (POST /api/telemetria, telemetria.service.js no eternity-crud), que monta o
// dashboard dos lideres (painel da staff, Indicadores > Site).
//
// Quem e: a API reconhece pela sessao do Discord do painel do membro e, no
// painel da staff, pelo token da staff. O nick nunca sai daqui; vai so o token.
// Quem nao entrou com o Discord e um codigo aleatorio deste navegador. Sem IP,
// sem cookie de terceiros.
//
// Uso: index.js e o painel chamam etyTelemetria.pagina(rota) a cada troca de
// tela, e os botoes contados chamam etyTelemetria.acao(nome).
(function () {
    const URL_TELEMETRIA = `${URL_BASE}/api/telemetria`;
    const ROTA = /^[a-z0-9-]{1,30}(\/[a-z0-9-]{1,30}){0,2}$/;

    function novoId() {
        if (window.crypto?.randomUUID) return crypto.randomUUID();
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    }

    // localStorage/sessionStorage podem faltar (aba anonima, bloqueio): sem
    // eles o visitante vale so para esta pagina.
    function guardado(armazem, chave) {
        try {
            const atual = window[armazem].getItem(chave);
            if (atual) return { id: atual, novo: false };
            const id = novoId();
            window[armazem].setItem(chave, id);
            return { id, novo: true };
        } catch {
            return { id: novoId(), novo: true };
        }
    }

    const visitante = guardado('localStorage', 'ety-visitante').id;
    const sessao = guardado('sessionStorage', 'ety-sessao');

    // De onde veio: so na primeira pagina da sessao. Lido antes do index.js,
    // que troca o ?e= do link curto pelo #meu-painel.
    function origemDaSessao() {
        const busca = new URLSearchParams(location.search);
        if (busca.has('e')) return 'tell';
        if (busca.has('g') || busca.has('vinculo')) return 'guia';
        let host = '';
        try { host = document.referrer ? new URL(document.referrer).hostname : ''; } catch { host = ''; }
        if (!host || host === location.hostname) return 'direto';
        if (/(^|\.)discord(app)?\.com$/.test(host)) return 'discord';
        if (/(^|\.)google\./.test(host)) return 'google';
        return 'outro';
    }

    let origem = sessao.novo ? origemDaSessao() : null;
    const aparelho = window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth <= 900 ? 'celular' : 'computador';

    function cookie(nome) {
        const achado = document.cookie.split('; ').find(parte => parte.startsWith(`${nome}=`));
        return achado ? decodeURIComponent(achado.slice(nome.length + 1)) : '';
    }

    function credenciais() {
        const corpo = {};
        try {
            const membro = localStorage.getItem('ety-painel-sessao');
            if (membro) corpo.m = membro;
        } catch { /* sem storage */ }
        // So no painel da staff: e la que o acesso dela conta como "staff".
        if (/painel\.html$/.test(location.pathname)) {
            const login = cookie(ETY_ADM_LOGIN_COOKIE);
            const token = cookie(ETY_ADM_PASS_COOKIE);
            if (login && token) corpo.st = { login, token };
        }
        return corpo;
    }

    let fila = [];
    let timer = null;
    let atual = null; // { rota, desde (ms) | null, ms }

    function enviar() {
        clearTimeout(timer);
        timer = null;
        if (!fila.length) return;
        const eventos = fila.splice(0, 40);
        const corpo = JSON.stringify({ v: visitante, s: sessao.id, a: aparelho, ...(origem ? { o: origem } : {}), ...credenciais(), e: eventos });
        origem = null;
        // text/plain: o sendBeacon nao manda preflight de CORS.
        const blob = new Blob([corpo], { type: 'text/plain' });
        let foi = false;
        try { foi = navigator.sendBeacon?.(URL_TELEMETRIA, blob) || false; } catch { foi = false; }
        if (!foi) fetch(URL_TELEMETRIA, { method: 'POST', body: corpo, headers: { 'Content-Type': 'text/plain' }, keepalive: true }).catch(() => {});
        if (fila.length) enviar();
    }

    function agendar() {
        if (!timer) timer = setTimeout(enviar, 2000);
    }

    function fecharTempo() {
        if (!atual) return;
        if (atual.desde !== null) {
            atual.ms += Date.now() - atual.desde;
            atual.desde = document.visibilityState === 'visible' ? Date.now() : null;
        }
        if (atual.ms >= 1000) fila.push({ t: 'tempo', r: atual.rota, ms: Math.round(atual.ms) });
        atual.ms = 0;
    }

    function pagina(rota) {
        rota = String(rota || '').toLowerCase();
        if (!ROTA.test(rota) || atual?.rota === rota) return;
        fecharTempo();
        atual = { rota, desde: document.visibilityState === 'visible' ? Date.now() : null, ms: 0 };
        fila.push({ t: 'pagina', r: rota });
        agendar();
    }

    function acao(nome) {
        fila.push({ t: 'acao', r: atual?.rota || 'inicio', x: String(nome) });
        agendar();
    }

    // Aba escondida ou pagina fechando: fecha o tempo e manda na hora (o
    // navegador pode nao rodar mais nada depois).
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            fecharTempo();
            if (atual) atual.desde = null;
            enviar();
        } else if (atual && atual.desde === null) {
            atual.desde = Date.now();
        }
    });
    window.addEventListener('pagehide', () => {
        fecharTempo();
        enviar();
    });

    window.etyTelemetria = { pagina, acao };
})();
