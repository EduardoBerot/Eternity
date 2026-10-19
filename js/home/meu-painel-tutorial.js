// Tutorial do painel (18/10/2026): na primeira entrada do recruta (quem esta na
// Jornada dos 7 Dias e ainda nao viu), um tour escurece a tela e destaca uma
// parte do painel por vez. Visto ou pulado, a API grava (tb_jornada.tutorial_em)
// e ele nao volta, nem em outro aparelho; "Rever o tutorial" abre de novo.
//
// Cada passo aponta para um seletor; o primeiro que estiver visivel ganha o
// destaque (o menu lateral no computador, a barra de baixo no celular). Sem
// alvo, o balao fica no meio da tela.

const MP_TUTORIAL_PASSOS = [
    {
        icone: 'fa-hand-sparkles',
        titulo: 'Bem-vindo ao seu painel',
        texto: 'Aqui fica tudo da Eternity e tudo sobre você: o clã na Liga, os torneios, a meta do banco, a cidade e o seu progresso. Leva menos de um minuto para conhecer.',
    },
    {
        alvos: ['.lateral-jogador', '.hud-jogador'],
        icone: 'fa-user',
        titulo: 'Este é você',
        texto: 'Seu nível sobe com tudo o que você faz no clã. Clique aqui para abrir o seu perfil: títulos, pontos na Liga, tesouro e conquistas.',
    },
    {
        alvos: ['.jornada-chamada', '.lateral-item[onclick="mpIr(\'jornada\')"]', '.jogo-aba[onclick="mpIr(\'jornada\')"]'],
        icone: 'fa-route',
        titulo: 'Sua Jornada dos 7 Dias',
        texto: 'Uma missão nova por dia para você se firmar no clã. Complete as 7 e ganhe <b>100k de ajuda inicial</b>, com a subida para a ETY aos <b>15 dias</b> em vez de 30.',
    },
    {
        alvos: ['.inicio-cla'],
        icone: 'fa-shield-halved',
        titulo: 'O clã em tempo real',
        texto: 'A posição da Eternity na Liga do mês e quanto cada semana rendeu. Logo abaixo ficam os torneios da semana, a meta do banco e o ranking de níveis.',
    },
    {
        alvos: ['.lateral-item[onclick="mpIr(\'cidade\')"]', '.jogo-aba[onclick="mpIr(\'cidade\')"]'],
        icone: 'fa-city',
        titulo: 'Um lugar na cidade',
        texto: 'Casas e terrenos são gratuitos para os membros. No mapa da Cidade você escolhe um lugar livre e pede o seu.',
    },
    {
        icone: 'fa-flag-checkered',
        titulo: 'Tudo pronto!',
        texto: 'Comece pela missão de hoje da Jornada. Se quiser ver este tour de novo, use <b>Rever o tutorial</b> na tela da Jornada.',
        fim: true,
    },
];

let mpTutorial = null;

function mpTutorialPendente() {
    return Boolean(mpEstado.jornada && !mpEstado.jornada.tutorialEm);
}

function mpTutorialIniciar() {
    if (mpTutorial) return;
    // Os destaques do Inicio (Jornada, clã na Liga) precisam da tela aberta.
    if (mpEstado.tela !== 'inicio') mpIr('inicio');
    const camada = document.createElement('div');
    camada.className = 'tutorial';
    camada.innerHTML = `<div class="tutorial-veu"></div><div class="tutorial-foco" aria-hidden="true"></div>
        <section class="tutorial-balao" role="dialog" aria-modal="true" aria-labelledby="tutorial-titulo"></section>`;
    document.body.appendChild(camada);
    document.body.classList.add('tutorial-aberto');
    mpTutorial = { passo: 0, camada, reposicionar: () => mpTutorialPosicionar() };
    window.addEventListener('resize', mpTutorial.reposicionar);
    window.addEventListener('scroll', mpTutorial.reposicionar, { passive: true });
    document.addEventListener('keydown', mpTutorialTecla);
    mpTutorialMostrar();
}

function mpTutorialTecla(evento) {
    if (!mpTutorial) return;
    if (evento.key === 'Escape') mpTutorialFechar();
    else if (evento.key === 'ArrowRight') mpTutorialIr(1);
    else if (evento.key === 'ArrowLeft') mpTutorialIr(-1);
}

function mpTutorialAlvo(passo) {
    for (const seletor of passo.alvos || []) {
        const el = document.querySelector(seletor);
        if (el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden') return el;
    }
    return null;
}

function mpTutorialMostrar() {
    const passo = MP_TUTORIAL_PASSOS[mpTutorial.passo];
    const total = MP_TUTORIAL_PASSOS.length;
    const balao = mpTutorial.camada.querySelector('.tutorial-balao');
    balao.innerHTML = `
        <div class="tutorial-topo">
            <span class="tutorial-icone"><i class="fa-solid ${passo.icone}" aria-hidden="true"></i></span>
            <small>${mpTutorial.passo + 1} de ${total}</small>
            ${passo.fim ? '' : '<button type="button" class="tutorial-pular" onclick="mpTutorialFechar()">Pular</button>'}
        </div>
        <h3 id="tutorial-titulo">${passo.titulo}</h3>
        <p>${passo.texto}</p>
        <div class="tutorial-pontos" aria-hidden="true">${MP_TUTORIAL_PASSOS.map((_, i) => `<span class="${i === mpTutorial.passo ? 'ativo' : i < mpTutorial.passo ? 'feito' : ''}"></span>`).join('')}</div>
        <div class="tutorial-botoes">
            ${mpTutorial.passo ? '<button type="button" class="mp-acao mp-acao-fraca" onclick="mpTutorialIr(-1)">Voltar</button>' : ''}
            ${passo.fim
                ? '<button type="button" class="mp-acao" onclick="mpTutorialFechar(\'jornada\')"><i class="fa-solid fa-route" aria-hidden="true"></i> Começar a Jornada</button>'
                : `<button type="button" class="mp-acao" onclick="mpTutorialIr(1)">${mpTutorial.passo ? 'Próximo' : 'Começar'} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>`}
        </div>`;
    mpTutorial.alvo = mpTutorialAlvo(passo);
    if (mpTutorial.alvo) {
        mpTutorial.alvo.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
    mpTutorialPosicionar();
    balao.querySelector('.tutorial-botoes .mp-acao:last-child')?.focus({ preventScroll: true });
}

function mpTutorialPosicionar() {
    if (!mpTutorial) return;
    const { camada, alvo } = mpTutorial;
    const foco = camada.querySelector('.tutorial-foco');
    const balao = camada.querySelector('.tutorial-balao');
    camada.classList.toggle('sem-alvo', !alvo);
    if (!alvo) {
        balao.style.left = balao.style.top = '';
        return;
    }
    const folga = 8;
    const r = alvo.getBoundingClientRect();
    Object.assign(foco.style, {
        left: `${r.left - folga}px`,
        top: `${r.top - folga}px`,
        width: `${r.width + folga * 2}px`,
        height: `${r.height + folga * 2}px`,
    });
    // Celular: o balao vira uma faixa no pe da tela (CSS) e so o foco anda.
    if (window.matchMedia('(max-width: 640px)').matches) {
        balao.style.left = balao.style.top = '';
        camada.classList.toggle('balao-em-cima', r.top + r.height / 2 > window.innerHeight * 0.55);
        return;
    }
    camada.classList.remove('balao-em-cima');
    const largura = balao.offsetWidth;
    const altura = balao.offsetHeight;
    const margem = 16;
    let x;
    let y;
    // Alvo estreito na lateral (menu): o balao vai ao lado; senao, embaixo ou em cima.
    if (r.right + margem + largura < window.innerWidth && r.width < window.innerWidth * 0.35) {
        x = r.right + margem + folga;
        y = r.top + r.height / 2 - altura / 2;
    } else {
        x = r.left + r.width / 2 - largura / 2;
        y = r.bottom + margem + folga + altura < window.innerHeight ? r.bottom + margem + folga : r.top - margem - folga - altura;
    }
    balao.style.left = `${Math.min(Math.max(margem, x), window.innerWidth - largura - margem)}px`;
    balao.style.top = `${Math.min(Math.max(margem, y), window.innerHeight - altura - margem)}px`;
}

function mpTutorialIr(delta) {
    if (!mpTutorial) return;
    mpTutorial.passo = Math.max(0, Math.min(MP_TUTORIAL_PASSOS.length - 1, mpTutorial.passo + delta));
    mpTutorialMostrar();
}

// Visto ou pulado: grava na API e, no fim, abre a Jornada.
async function mpTutorialFechar(destino = null) {
    if (!mpTutorial) return;
    window.removeEventListener('resize', mpTutorial.reposicionar);
    window.removeEventListener('scroll', mpTutorial.reposicionar);
    document.removeEventListener('keydown', mpTutorialTecla);
    mpTutorial.camada.remove();
    mpTutorial = null;
    document.body.classList.remove('tutorial-aberto');
    if (destino) mpIr(destino);
    if (!mpTutorialPendente()) return;
    mpEstado.jornada.tutorialEm = new Date().toISOString();
    try {
        const resposta = await fetch(`${URL_PAINEL_MEMBRO}/jornada/tutorial`, { method: 'POST', headers: { Authorization: `Bearer ${mpLerSessao()}` } });
        if (resposta.ok) mpEstado.jornada = (await resposta.json()).jornada || mpEstado.jornada;
    } catch { /* fica marcado nesta visita; na proxima o tour volta */ }
}
