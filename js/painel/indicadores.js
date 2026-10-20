// Aba Indicadores (15/10/2026): o Recrutamento e as Analises da Liga, que eram
// duas abas do menu, numa so. A troca e um seletor ao lado do titulo, sempre a
// vista; os dois dashboards seguem nos proprios arquivos (recrutamento.js e
// analises.js) e so ganham este cabecalho. A ultima escolha fica no navegador.
// So lideres (auth.js mostra o item do menu). O Site (uso do site, 20/10/2026)
// e de todo lider, Coordenador para cima; Recrutamento e Liga seguem so da
// allowlist (`lider`). O backend confere cada um.

const INDICADORES = { recrutamento: 'Recrutamento', liga: 'Liga', site: 'Site' };

function indicadoresPermitidos() {
    const permissoes = window.painelPermissoes || {};
    return Object.keys(INDICADORES).filter(chave => chave === 'site' ? permissoes.usoSite || permissoes.lider : permissoes.lider);
}
const INDICADORES_CHAVE = 'ety-indicadores';

function indicadorSalvo() {
    try {
        const salvo = localStorage.getItem(INDICADORES_CHAVE);
        if (indicadoresPermitidos().includes(salvo)) return salvo;
    } catch (_) {}
    return indicadoresPermitidos()[0] || 'site';
}

// `qual` vem do seletor ou de um link (voltar da conversa do recruta); pelo
// menu, abre o ultimo visto.
function renderIndicadores(qual) {
    if (!indicadoresPermitidos().includes(qual)) qual = indicadorSalvo();
    try { localStorage.setItem(INDICADORES_CHAVE, qual); } catch (_) {}
    anSairDaAba();
    rcSairDaAba();
    usSairDaAba();
    const aba = document.getElementById('indicadores');
    if (aba) selectItem(aba);
    window.etyTelemetria?.pagina(`painel/indicadores/${qual}`);
    ({ liga: renderAnalises, site: renderUsoSite }[qual] || renderRecrutamento)();
}

function indicadoresCabecalho(ativo) {
    const opcoes = Object.entries(INDICADORES).filter(([chave]) => indicadoresPermitidos().includes(chave)).map(([chave, rotulo]) => `
        <button type="button" role="radio" aria-checked="${chave === ativo}" class="${chave === ativo ? 'is-on' : ''}"
            onclick="${chave === ativo ? '' : `renderIndicadores('${chave}')`}">${rotulo}</button>`).join('');
    return `
        <div class="ind-cab">
            <h1>Indicadores</h1>
            <div class="an-seg ind-troca" role="radiogroup" aria-label="Indicador">${opcoes}</div>
        </div>`;
}
