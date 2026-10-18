// Paineis do cla (18/10/2026): os mesmos paineis de Liga, torneios e banco que o
// bot publica no Discord, para qualquer um ver no site. O bot manda os pacotes
// ao site junto com os perfis (public-panels.service.js no eternity-crud) e a
// API desenha o PNG com o mesmo codigo dos paineis do Discord.

const URL_PAINEIS = `${URL_BASE}/api/paineis`;
const PAINEIS_TIPOS = [
    ['liga', 'Liga do mês', 'fa-trophy', 'Pontos do clã na Liga, a semana e quem mais pontuou.'],
    ['torneios', 'Torneios da semana', 'fa-medal', 'Pódios do clã nos torneios semanais e a projeção.'],
    ['banco', 'Banco do clã', 'fa-coins', 'Saldo, maiores apoiadores e os últimos depósitos.'],
];
const PAINEIS_SERVIDORES = { apocalipse: 'Apocalipse', genesis: 'Gênesis' };
const paineisEstado = { lista: [], servidor: 'apocalipse' };

function paineisQuando(valor) {
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return '';
    const minutos = Math.max(0, Math.round((Date.now() - data) / 60000));
    if (minutos < 2) return 'agora há pouco';
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.round(minutos / 60);
    return horas < 24 ? `há ${horas} h` : data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

async function renderPaineis() {
    app.innerHTML = `<h1>Painéis do clã</h1>${loadingHTML}`;
    let corpo = null;
    try {
        const resposta = await fetch(`${URL_PAINEIS}/publicos`);
        corpo = resposta.ok ? await resposta.json() : null;
    } catch { corpo = null; }
    if (!location.hash.startsWith('#paineis')) return;
    paineisEstado.lista = Array.isArray(corpo?.paineis) ? corpo.paineis : [];
    if (!paineisEstado.lista.length) {
        app.innerHTML = `<h1>Painéis do clã</h1>
            <p class="paineis-vazio">${corpo ? 'Os painéis aparecem na próxima atualização do site, em até 1 hora.' : 'O site não respondeu agora. Tente de novo em instantes.'}</p>`;
        return;
    }
    if (!paineisEstado.lista.some(p => p.servidor === paineisEstado.servidor)) paineisEstado.servidor = paineisEstado.lista[0].servidor;
    paineisDesenhar();
}

function paineisDesenhar() {
    const servidores = [...new Set(paineisEstado.lista.map(p => p.servidor))];
    const doServidor = PAINEIS_TIPOS
        .map(([tipo, titulo, icone, texto]) => ({ tipo, titulo, icone, texto, painel: paineisEstado.lista.find(p => p.servidor === paineisEstado.servidor && p.tipo === tipo) }))
        .filter(item => item.painel);
    app.innerHTML = `
        <div class="paineis-topo">
            <div>
                <h1>Painéis do clã</h1>
                <p>Os mesmos painéis dos canais do Discord, atualizados pelo bot do clã.</p>
            </div>
            ${servidores.length > 1 ? `<div class="paineis-servidores" role="tablist" aria-label="Servidor">
                ${servidores.map(s => `<button type="button" role="tab" class="${s === paineisEstado.servidor ? 'ativo' : ''}" aria-selected="${s === paineisEstado.servidor}" onclick="paineisTrocar('${s}')">${escHtml(PAINEIS_SERVIDORES[s] || s)}</button>`).join('')}
            </div>` : ''}
        </div>
        <div class="paineis-lista">
            ${doServidor.map(({ tipo, titulo, icone, texto, painel }) => {
                const url = `${URL_PAINEIS}/publico/${encodeURIComponent(painel.servidor)}/${encodeURIComponent(tipo)}.png?v=${encodeURIComponent(painel.versao)}`;
                return `<section class="painel-publico">
                    <header>
                        <h2><i class="fa-solid ${icone}" aria-hidden="true"></i> ${titulo}</h2>
                        <small>${escHtml(paineisQuando(painel.atualizadoEm))}</small>
                    </header>
                    <p>${texto}</p>
                    <a href="${url}" target="_blank" rel="noopener" class="painel-publico-imagem" title="Abrir em tamanho cheio">
                        <img src="${url}" alt="${escHtml(titulo)} (${escHtml(PAINEIS_SERVIDORES[painel.servidor] || painel.servidor)})" width="1200" height="643" loading="lazy">
                    </a>
                    <small class="painel-publico-dica"><i class="fa-solid fa-magnifying-glass-plus" aria-hidden="true"></i> Toque na imagem para ver em tamanho cheio</small>
                </section>`;
            }).join('')}
        </div>`;
}

function paineisTrocar(servidor) {
    paineisEstado.servidor = servidor;
    paineisDesenhar();
}
