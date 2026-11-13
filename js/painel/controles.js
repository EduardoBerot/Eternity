// Indicadores > Controles (12/11/2026): liga e desliga funcoes dos bots ao vivo
// (GET/PATCH /api/controles). Coordenador para cima ve o estado e o historico;
// so o Fundador muda (o backend devolve `podeAlterar` e responde 403 aos demais).
//
// A mudanca NAO e otimista: o interruptor sempre mostra o que o servidor tem.
// Os bots aplicam em cerca de 1 minuto. Esta tela rola com a pagina (nao usa as
// classes painel--analises/painel--uso, que travam a rolagem).

const URL_CONTROLES = `${URL_BASE}/api/controles`;

const ct = { dados: null, pendente: null, aberto: null, token: 0, focar: null, avisoTimer: null, versao: 0 };

function renderControles() {
    ct.token++;
    ct.aberto = null;
    APP.innerHTML = `
        <div class="an-root ct-root" id="ct_root">
            <div class="an-topo">
                <div class="an-titulo">${indicadoresCabecalho('controles')}<small id="ct_sub">Os bots aplicam a mudança em cerca de 1 minuto. Toda mudança é avisada no canal da staff.</small></div>
            </div>
            <div class="ct-aviso" id="ct_aviso" hidden></div>
            <div id="ct_msg"></div>
            <div class="ct-corpo" id="ct_corpo">
                <div class="ct-grupos" id="ct_grupos"></div>
                <section class="an-card ct-historico" aria-labelledby="ct_h_titulo">
                    <header><h2 id="ct_h_titulo">Últimas mudanças</h2><span id="ct_h_conta"></span></header>
                    <ul class="ct-hist" id="ct_hist"></ul>
                </section>
            </div>
            <div class="ct-status" id="ct_status" role="status" aria-live="polite"></div>
        </div>`;
    ctCarregar();
}

function ctSairDaAba() {
    ct.token++;
    ct.aberto = null;
    ct.pendente = null;
    clearTimeout(ct.avisoTimer);
}

function ctCarregar() {
    const token = ct.token;
    const versao = ct.versao;
    const msg = document.getElementById('ct_msg');
    const corpo = document.getElementById('ct_corpo');
    if (!msg || !corpo) return;
    if (ct.dados) {
        ctDesenhar();
    } else {
        msg.innerHTML = '<div class="an-vazio">Carregando...</div>';
        corpo.hidden = true;
    }
    fetch(URL_CONTROLES, { headers: getAdminRequestHeaders() })
        .then(lerResposta)
        .then(dados => {
            if (token !== ct.token || versao !== ct.versao || ct.pendente) return;
            if (!Array.isArray(dados?.controles)) throw new Error('Resposta inesperada do servidor');
            ct.dados = dados;
            const digitando = document.activeElement?.id === 'ct_motivo';
            ctDesenhar();
            if (digitando) document.getElementById('ct_motivo')?.focus();
        })
        .catch(erro => {
            if (token !== ct.token || versao !== ct.versao || ct.pendente) return;
            console.error('Controles:', erro);
            const texto = erro?.doBackend ? erro.message : 'Não foi possível carregar os controles agora.';
            msg.innerHTML = `<div class="an-vazio ct-erro"><span>${anEsc(texto)}</span>
                <button type="button" class="btn btn-secondary" onclick="ctCarregar()">Tentar de novo</button></div>`;
            corpo.hidden = true;
        });
}

function ctDesenhar() {
    const msg = document.getElementById('ct_msg');
    const corpo = document.getElementById('ct_corpo');
    if (!msg || !corpo || !ct.dados) return;
    msg.innerHTML = '';
    corpo.hidden = false;
    ctDesenharSub();
    ctDesenharGrupos();
    ctDesenharHistorico();
    if (ct.focar) {
        document.querySelector(`.ct-switch[data-chave="${CSS.escape(ct.focar)}"]`)?.focus();
        ct.focar = null;
    }
}

function ctDesenharSub() {
    const aviso = document.getElementById('ct_aviso');
    aviso.hidden = Boolean(ct.dados.podeAlterar);
    aviso.textContent = ct.dados.podeAlterar ? '' : 'Só o Fundador muda. Você pode ver o estado e o histórico.';
}

// Agrupa por `grupo` na ordem em que aparecem (sem lista fixa).
function ctAgrupar(controles) {
    const grupos = new Map();
    for (const c of controles) {
        if (!grupos.has(c.grupo)) grupos.set(c.grupo, []);
        grupos.get(c.grupo).push(c);
    }
    return [...grupos.entries()];
}

function ctDesenharGrupos() {
    const el = document.getElementById('ct_grupos');
    const controles = ct.dados.controles || [];
    if (!controles.length) {
        el.innerHTML = '<div class="an-vazio ct-erro">Nenhum controle cadastrado.</div>';
        return;
    }
    el.innerHTML = ctAgrupar(controles).map(([grupo, itens], i) => {
        const ligados = itens.filter(c => c.ligado).length;
        return `
            <section class="an-card ct-grupo" aria-labelledby="ct_g_${i}">
                <header><h2 id="ct_g_${i}">${anEsc(grupo)}</h2><span>${ligados} de ${itens.length} ligados</span></header>
                <ul class="ct-lista">${itens.map(ctLinha).join('')}</ul>
            </section>`;
    }).join('');
}

function ctData(iso) {
    const d = new Date(iso);
    if (!iso || Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ctLinha(c) {
    const pendente = ct.pendente === c.chave;
    const bloqueado = !ct.dados.podeAlterar || Boolean(ct.pendente);
    const rotulo = pendente ? 'Salvando...' : c.ligado ? 'Ligado' : 'Desligado';
    const meta = c.atualizadoPor && c.atualizadoEm
        ? `<p class="ct-item__meta">Última mudança: ${anEsc(c.atualizadoPor)} em ${ctData(c.atualizadoEm)}${c.motivo ? ` · "${anEsc(c.motivo)}"` : ''}</p>`
        : '';
    const chave = anEsc(c.chave);
    return `
        <li class="ct-item ${c.ligado ? 'is-on' : 'is-off'}${pendente ? ' is-pendente' : ''}"${pendente ? ' aria-busy="true"' : ''}>
            <div class="ct-item__linha">
                <div class="ct-item__texto">
                    <strong class="ct-item__nome" id="ct_n_${chave}">${anEsc(c.nome)}</strong>
                    <p class="ct-item__desc" id="ct_d_${chave}">${anEsc(c.descricao)}</p>
                    ${meta}
                </div>
                <div class="ct-item__estado">
                    <span class="ct-item__rotulo">${rotulo}</span>
                    <button type="button" class="ct-switch" role="switch" aria-checked="${Boolean(c.ligado)}"
                        aria-labelledby="ct_n_${chave}" aria-describedby="ct_d_${chave}"
                        aria-disabled="${bloqueado}" ${ct.dados.podeAlterar ? '' : 'title="Só o Fundador muda"'}
                        data-chave="${chave}" onclick="ctPedir(this.dataset.chave)"><span class="ct-switch__bola" aria-hidden="true"></span></button>
                </div>
            </div>
            ${ct.aberto?.chave === c.chave ? ctForm(c) : ''}
        </li>`;
}

function ctForm(c) {
    const ligar = ct.aberto.ligar;
    const ocupado = Boolean(ct.pendente);
    const motivo = ct.aberto.motivo || '';
    return `
        <form class="ct-confirma" data-chave="${anEsc(c.chave)}" onsubmit="event.preventDefault(); ctConfirmar(this.dataset.chave)"
            onkeydown="if (event.key === 'Escape') { event.preventDefault(); ctCancelar(); }">
            ${ligar ? '' : '<p class="ct-confirma__aviso">Desligar interrompe esta função ao vivo.</p>'}
            <label for="ct_motivo">Motivo (opcional)</label>
            <input id="ct_motivo" type="text" maxlength="300" autocomplete="off" placeholder="Por que está mudando?"
                value="${anEsc(motivo)}"
                oninput="if (ct.aberto) ct.aberto.motivo = this.value; document.getElementById('ct_conta').textContent = this.value.length + '/300'"${ocupado ? ' disabled' : ''}>
            <small class="ct-confirma__conta" id="ct_conta">${motivo.length}/300</small>
            <div class="ct-confirma__acoes">
                <button type="button" class="btn btn-secondary" onclick="ctCancelar()"${ocupado ? ' disabled' : ''}>Cancelar</button>
                <button type="submit" class="btn ${ligar ? 'btn-success' : 'btn-danger'}"${ocupado ? ' disabled' : ''}>${ligar ? 'Ligar' : 'Desligar'}</button>
            </div>
        </form>`;
}

function ctDesenharHistorico() {
    const hist = ct.dados.historico || [];
    document.getElementById('ct_h_conta').textContent = hist.length ? `${hist.length} mais recentes` : '';
    document.getElementById('ct_hist').innerHTML = hist.length ? hist.map(h => `
        <li class="ct-hist__item">
            <span class="ct-hist__quando">${ctData(h.em)}</span>
            <b>${anEsc(h.nome)}</b>
            <span class="ct-tag ${h.ligado ? 'is-on' : 'is-off'}">${h.ligado ? 'Ligou' : 'Desligou'}</span>
            <span>por ${anEsc(h.por)}</span>
            ${h.motivo ? `<span class="ct-hist__motivo">"${anEsc(h.motivo)}"</span>` : ''}
        </li>`).join('') : '<li class="ct-vazio">Nenhuma mudança registrada ainda.</li>';
}

function ctPedir(chave) {
    if (!ct.dados?.podeAlterar || ct.pendente) return;
    const c = ct.dados.controles.find(x => x.chave === chave);
    if (!c) return;
    ct.aberto = { chave, ligar: !c.ligado };
    ctDesenharGrupos();
    document.getElementById('ct_motivo')?.focus();
}

function ctCancelar() {
    if (ct.pendente || !ct.aberto) return;
    ct.focar = ct.aberto.chave;
    ct.aberto = null;
    ctDesenhar();
}

async function ctConfirmar(chave) {
    if (!ct.aberto || ct.aberto.chave !== chave || ct.pendente) return;
    const ligado = ct.aberto.ligar;
    const motivo = (document.getElementById('ct_motivo')?.value || '').trim().slice(0, 300);
    const token = ct.token;
    ct.aberto.motivo = motivo;
    ct.pendente = chave;
    ct.versao++;
    ctDesenharGrupos();
    document.querySelector(`.ct-switch[data-chave="${CSS.escape(chave)}"]`)?.focus();
    const statusEl = document.getElementById('ct_status');
    if (statusEl) { clearTimeout(ct.avisoTimer); statusEl.textContent = 'Salvando...'; }
    try {
        const resposta = await fetch(`${URL_CONTROLES}/${encodeURIComponent(chave)}`, {
            method: 'PATCH',
            headers: { ...getAdminRequestHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(motivo ? { ligado, motivo } : { ligado }),
        }).then(lerResposta);
        if (token !== ct.token) return;
        if (!Array.isArray(resposta?.controles)) throw new Error('Resposta inesperada do servidor');
        ct.dados = resposta;
        ct.aberto = null;
        const nome = resposta.controles.find(x => x.chave === chave)?.nome || chave;
        const status = document.getElementById('ct_status');
        if (status) {
            status.textContent = `${nome} ${ligado ? 'ligado' : 'desligado'}. Os bots aplicam em cerca de 1 minuto.`;
            clearTimeout(ct.avisoTimer);
            ct.avisoTimer = setTimeout(() => { status.textContent = ''; }, 5000);
        }
    } catch (erro) {
        if (token !== ct.token) return;
        const st = document.getElementById('ct_status');
        if (st) st.textContent = '';
        avisarFalha(erro, 'Não foi possível alterar o controle.');
        if (erro?.doBackend) {
            ct.aberto = null;
            ctCarregar();
        }
    } finally {
        if (token === ct.token) {
            ct.pendente = null;
            ct.focar = ct.aberto ? null : chave;
            ctDesenhar();
            if (ct.aberto) document.getElementById('ct_motivo')?.focus();
        }
    }
}
