// Aba Indicadores (15/10/2026): o Recrutamento e as Analises da Liga, que eram
// duas abas do menu, numa so. A troca e um seletor ao lado do titulo, sempre a
// vista; os dois dashboards seguem nos proprios arquivos (recrutamento.js e
// analises.js) e so ganham este cabecalho. A ultima escolha fica no navegador.
// So lideres (auth.js mostra o item do menu).

const INDICADORES = { recrutamento: 'Recrutamento', liga: 'Liga' };
const INDICADORES_CHAVE = 'ety-indicadores';

function indicadorSalvo() {
    try {
        const salvo = localStorage.getItem(INDICADORES_CHAVE);
        if (salvo in INDICADORES) return salvo;
    } catch (_) {}
    return 'recrutamento';
}

// `qual` vem do seletor ou de um link (voltar da conversa do recruta); pelo
// menu, abre o ultimo visto.
function renderIndicadores(qual) {
    if (!(qual in INDICADORES)) qual = indicadorSalvo();
    try { localStorage.setItem(INDICADORES_CHAVE, qual); } catch (_) {}
    anSairDaAba();
    rcSairDaAba();
    const aba = document.getElementById('indicadores');
    if (aba) selectItem(aba);
    (qual === 'liga' ? renderAnalises : renderRecrutamento)();
}

function indicadoresCabecalho(ativo) {
    const opcoes = Object.entries(INDICADORES).map(([chave, rotulo]) => `
        <button type="button" role="radio" aria-checked="${chave === ativo}" class="${chave === ativo ? 'is-on' : ''}"
            onclick="${chave === ativo ? '' : `renderIndicadores('${chave}')`}">${rotulo}</button>`).join('');
    return `
        <div class="ind-cab">
            <h1>Indicadores</h1>
            <div class="an-seg ind-troca" role="radiogroup" aria-label="Indicador">${opcoes}</div>
        </div>`;
}
