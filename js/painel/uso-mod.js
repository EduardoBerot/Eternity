// Indicadores > Mod (20/11/2026, Fundador): o uso do mod era um quadro
// apertado no fim de Indicadores > Site; ganhou aba propria, com os crash
// reports que antes so se liam no Pi. Mesma permissao do Site (lideres,
// Coordenador para cima; o backend confere em GET /api/analise/mod).
//
// Mesmo molde da aba Site (uso-site.js): cartoes do .an-root, tabelas que rolam
// por dentro no computador e pagina que rola no celular. Retrato de agora, sem
// periodo: o uso vem de tb_mod_uso e os crashes dos ultimos 150 guardados.

const URL_USO_MOD = `${URL_BASE}/api/analise/mod`;

const um = { dados: null, filtro: 'todos', aberto: null };

// A etapa do atualizador que o mod manda (X-Eternity-Atualizacao, 0.18.0+).
function umEtapa(texto) {
    const t = String(texto || '');
    if (!t) return { tipo: 'sem', rotulo: 'sem informação' };
    if (/^em dia/.test(t) || /^atualizou/.test(t)) return { tipo: 'ok', rotulo: t };
    if (/^baixada/.test(t)) return { tipo: 'andamento', rotulo: t };
    if (/falhou|^erro/.test(t)) return { tipo: 'problema', rotulo: t };
    return { tipo: 'sem', rotulo: t };
}

function umVersao(versao) {
    return versao === '0.0.0' ? '0.15.2 ou antes' : versao;
}

function umCompararVersao(a, b) {
    const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
    return 0;
}

function renderUsoMod() {
    document.body.classList.add('painel--analises', 'painel--uso');
    APP.innerHTML = `
        <div class="an-root us-root um-root" id="an_root">
            <div class="an-topo">
                <div class="an-titulo">
                    ${indicadoresCabecalho('mod')}
                    <small id="um_atualizado">Carregando...</small>
                </div>
                <button type="button" class="um-recarregar" onclick="umCarregar()"><i class="fa-solid fa-rotate" aria-hidden="true"></i> Atualizar</button>
            </div>
            <div class="um-grade" id="um_grade">
                <section class="us-tiles um-tiles" id="um_tiles"></section>
                <section class="an-card um-c-pessoas">
                    <header>
                        <h2>Quem usa</h2>
                        <div class="an-seg us-filtro" role="radiogroup" aria-label="Quem" id="um_filtro"></div>
                    </header>
                    <div class="us-tabela" id="um_pessoas"></div>
                </section>
                <section class="an-card um-c-versoes">
                    <header><h2>Versões em uso</h2><span id="um_s_versoes"></span></header>
                    <ul class="um-barras" id="um_versoes"></ul>
                    <header><h2>Atualização automática</h2><span>última etapa</span></header>
                    <ul class="us-lista" id="um_etapas"></ul>
                </section>
                <section class="an-card um-c-crashes">
                    <header><h2>Crash reports</h2><span id="um_s_crashes"></span></header>
                    <div class="us-tabela" id="um_crashes"></div>
                </section>
            </div>
            <div class="um-modal" id="um_modal" hidden>
                <div class="um-modal__caixa" role="dialog" aria-modal="true" aria-labelledby="um_modal_titulo">
                    <header>
                        <h2 id="um_modal_titulo">Crash</h2>
                        <div class="um-modal__acoes">
                            <button type="button" onclick="umCopiarCrash()"><i class="fa-solid fa-copy" aria-hidden="true"></i> Copiar</button>
                            <button type="button" onclick="umFecharCrash()" aria-label="Fechar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
                        </div>
                    </header>
                    <div class="um-modal__resumo" id="um_modal_resumo"></div>
                    <pre id="um_modal_texto">Carregando...</pre>
                </div>
            </div>
            <div class="an-tooltip" id="an_tooltip" hidden></div>
        </div>`;
    anLigarDicas();
    document.addEventListener('keydown', umTecla);
    umCarregar();
}

function umSairDaAba() {
    document.removeEventListener('keydown', umTecla);
    document.body.classList.remove('painel--uso');
}

function umTecla(evento) {
    if (evento.key === 'Escape' && um.aberto) umFecharCrash();
}

function umCarregar() {
    const tiles = document.getElementById('um_tiles');
    if (!tiles) return;
    if (!um.dados) tiles.innerHTML = '<div class="an-vazio">Carregando...</div>';
    fetch(URL_USO_MOD, { headers: getAdminRequestHeaders() })
        .then(resposta => {
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            return resposta.json();
        })
        .then(dados => {
            if (!document.getElementById('um_grade')) return;
            um.dados = dados;
            const quando = new Date(dados.geradoEm);
            document.getElementById('um_atualizado').textContent =
                `Uso desde 17/11/2026 · crashes desde 19/11/2026 · atualizado ${quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
            umDesenharTudo();
        })
        .catch(erro => {
            tiles.innerHTML = '<div class="an-vazio">Não foi possível carregar os dados do mod agora.</div>';
            console.error('Indicadores do mod:', erro);
        });
}

function umDesenharTudo() {
    umDesenharTiles();
    umDesenharPessoas();
    umDesenharVersoes();
    umDesenharCrashes();
}

function umDesenharTiles() {
    const { uso, crashes } = um.dados;
    const agora = Date.now();
    const seteDias = crashes.filter(c => agora - Date.parse(c.recebidoEm) < 7 * 86_400_000);
    const nossos = seteDias.filter(c => c.resumo?.envolveEternity).length;
    const velhos = uso.pessoas.filter(p => p.desatualizado).length;
    const problemas = uso.pessoas.filter(p => umEtapa(p.atualizacao).tipo === 'problema').length;
    const tiles = [
        ['Com login', anNum(uso.pessoas.length), `${uso.pessoas.filter(p => agora - Date.parse(p.visto) < 7 * 86_400_000).length} abriram nos últimos 7 dias`],
        ['Sem login (30 dias)', anNum(uso.semLogin), 'jogaram com o mod sem entrar no painel'],
        ['Desatualizados', anNum(velhos), uso.minima ? `abaixo da mínima ${anEsc(uso.minima)} · ${problemas} com erro na atualização` : `sem versão mínima · ${problemas} com erro na atualização`],
        ['Crashes (7 dias)', anNum(seteDias.length), seteDias.length ? `${nossos} com o Eternity na pilha` : 'nenhum recebido'],
    ];
    document.getElementById('um_tiles').innerHTML = tiles.map(([rotulo, valor, nota]) => `
        <div class="an-card us-tile">
            <span class="us-tile__rotulo">${rotulo}</span>
            <span class="us-tile__valor">${valor}</span>
            <span class="us-tile__nota">${nota}</span>
        </div>`).join('');
}

function umTrocarFiltro(filtro) {
    um.filtro = filtro;
    umDesenharPessoas();
}

function umDesenharPessoas() {
    const filtros = { todos: 'Todos', staff: 'Staff', problema: 'Com problema' };
    document.getElementById('um_filtro').innerHTML = Object.entries(filtros).map(([chave, nome]) => `
        <button type="button" role="radio" aria-checked="${chave === um.filtro}" class="${chave === um.filtro ? 'is-on' : ''}"
            onclick="umTrocarFiltro('${chave}')">${nome}</button>`).join('');
    const pessoas = um.dados.uso.pessoas.filter(p => um.filtro === 'staff' ? p.staff
        : um.filtro === 'problema' ? p.desatualizado || umEtapa(p.atualizacao).tipo === 'problema' : true);
    document.getElementById('um_pessoas').innerHTML = pessoas.length ? `
        <table>
            <thead><tr><th>Nick</th><th>Versão</th><th>Atualização</th><th>Último uso</th><th>Usa desde</th></tr></thead>
            <tbody>${pessoas.map(p => {
                const etapa = umEtapa(p.atualizacao);
                return `
                <tr>
                    <td class="us-nick">${usCabeca(p.nick)}<span>${anEsc(p.nick)}<small>${p.cargo ? anEsc(p.cargo) : 'fora do clã'}</small></span></td>
                    <td class="${p.desatualizado ? 'us-mod-velho' : ''}">${anEsc(umVersao(p.versao))}${p.desatualizado ? ' · desatualizado' : ''}</td>
                    <td class="um-etapa um-etapa--${etapa.tipo}" title="${anEsc(etapa.rotulo)}">${anEsc(etapa.rotulo)}</td>
                    <td>${usQuando(p.visto)}</td>
                    <td>${usQuando(p.primeiro)}</td>
                </tr>`;
            }).join('')}
            </tbody>
        </table>` : `<div class="an-vazio">${um.filtro === 'todos' ? 'Ninguém abriu o painel do mod com login ainda.' : 'Ninguém neste filtro.'}</div>`;
}

function umDesenharVersoes() {
    const pessoas = um.dados.uso.pessoas;
    const contagem = new Map();
    for (const p of pessoas) contagem.set(p.versao, (contagem.get(p.versao) || 0) + 1);
    const versoes = [...contagem.entries()].sort((a, b) => umCompararVersao(b[0], a[0]));
    const maior = Math.max(1, ...versoes.map(([, n]) => n));
    const minima = um.dados.uso.minima;
    document.getElementById('um_s_versoes').textContent = `${pessoas.length} com login`;
    document.getElementById('um_versoes').innerHTML = versoes.length ? versoes.map(([versao, n]) => {
        const velha = minima && umCompararVersao(versao, minima) < 0;
        return `<li class="${velha ? 'velha' : ''}"><span>${anEsc(umVersao(versao))}</span><i style="width:${Math.max(4, (n / maior) * 100)}%"></i><b>${anNum(n)}</b></li>`;
    }).join('') : '<li class="us-vazio">Sem dados.</li>';
    const tipos = { ok: 'Em dia ou atualizou', andamento: 'Baixou, esperando fechar o jogo', problema: 'Falhou', sem: 'Sem informação (mod antigo)' };
    const porTipo = { ok: 0, andamento: 0, problema: 0, sem: 0 };
    for (const p of pessoas) porTipo[umEtapa(p.atualizacao).tipo] += 1;
    document.getElementById('um_etapas').innerHTML = Object.entries(tipos)
        .map(([tipo, nome]) => `<li><span><i class="um-ponto um-etapa--${tipo}"></i>${nome}</span><b>${anNum(porTipo[tipo])}</b></li>`).join('');
}

function umDesenharCrashes() {
    const crashes = um.dados.crashes;
    const nossos = crashes.filter(c => c.resumo?.envolveEternity).length;
    document.getElementById('um_s_crashes').textContent = crashes.length ? `${crashes.length} guardados · ${nossos} com o Eternity na pilha · clique para ler` : '';
    document.getElementById('um_crashes').innerHTML = crashes.length ? `
        <table>
            <thead><tr><th>Quando</th><th>Nick</th><th>Mod</th><th>Jogo</th><th>Launcher</th><th>Culpa</th><th>O que houve</th></tr></thead>
            <tbody>${crashes.map(c => {
                const r = c.resumo || {};
                const oque = r.descricao || r.excecao || r.frame || '?';
                const dica = [r.excecao, r.suspeitos ? `Suspeitos: ${r.suspeitos}` : null].filter(Boolean).map(anEsc).join('<br>');
                return `
                <tr class="um-crash" tabindex="0" onclick="umAbrirCrash('${anEsc(c.id)}')" onkeydown="if(event.key==='Enter')umAbrirCrash('${anEsc(c.id)}')"${dica ? ` data-dica="${anEsc(`<div class="an-tt-nota">${dica}</div>`)}"` : ''}>
                    <td>${usQuando(c.recebidoEm)}</td>
                    <td>${c.nick ? `<span class="us-nick">${usCabeca(c.nick)}<span>${anEsc(c.nick)}</span></span>` : '<span class="um-apagado">sem nick</span>'}</td>
                    <td>${anEsc(c.versao || '?')}</td>
                    <td>${anEsc(r.versaoJogo || '?')}</td>
                    <td>${anEsc(c.launcher || '?')}</td>
                    <td>${r.envolveEternity ? '<span class="um-culpa um-culpa--nossa">Eternity na pilha</span>' : '<span class="um-culpa">outro mod ou jogo</span>'}</td>
                    <td class="um-oque">${anEsc(oque)}</td>
                </tr>`;
            }).join('')}
            </tbody>
        </table>` : '<div class="an-vazio">Nenhum crash recebido. O mod manda sozinho os crash reports novos ao abrir o jogo (da 0.18.0 em diante).</div>';
}

function umAbrirCrash(id) {
    const crash = um.dados?.crashes.find(c => c.id === id);
    if (!crash) return;
    um.aberto = { id, texto: '' };
    const r = crash.resumo || {};
    document.getElementById('um_modal_titulo').textContent = `Crash de ${crash.nick || 'sem nick'} · ${new Date(crash.recebidoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;
    document.getElementById('um_modal_resumo').innerHTML = [
        ['Mod', crash.versao], ['Jogo', r.versaoJogo], ['Launcher', crash.launcher], ['Arquivo', crash.arquivo],
        ['Suspeitos', r.suspeitos], ['Mods na pasta', crash.qtdMods ? String(crash.qtdMods) : null],
    ].filter(([, v]) => v).map(([k, v]) => `<span><b>${k}</b> ${anEsc(v)}</span>`).join('');
    const texto = document.getElementById('um_modal_texto');
    texto.textContent = 'Carregando...';
    const modal = document.getElementById('um_modal');
    modal.hidden = false;
    modal.onclick = evento => { if (evento.target === modal) umFecharCrash(); };
    fetch(`${URL_USO_MOD}/crash/${encodeURIComponent(id)}`, { headers: getAdminRequestHeaders() })
        .then(resposta => {
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            return resposta.json();
        })
        .then(dados => {
            if (um.aberto?.id !== id) return;
            um.aberto.texto = dados.texto;
            const mods = dados.mods?.length ? `\n\n---- Mods na pasta (${dados.mods.length}) ----\n${dados.mods.join('\n')}` : '';
            texto.textContent = dados.texto + mods;
        })
        .catch(() => { if (um.aberto?.id === id) texto.textContent = 'Não foi possível ler este crash agora.'; });
}

function umFecharCrash() {
    um.aberto = null;
    const modal = document.getElementById('um_modal');
    if (modal) modal.hidden = true;
}

function umCopiarCrash() {
    const texto = document.getElementById('um_modal_texto')?.textContent || '';
    navigator.clipboard?.writeText(texto).then(() => {
        const botao = document.querySelector('.um-modal__acoes button');
        if (!botao) return;
        botao.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copiado';
        setTimeout(() => { botao.innerHTML = '<i class="fa-solid fa-copy" aria-hidden="true"></i> Copiar'; }, 1500);
    }).catch(() => {});
}
