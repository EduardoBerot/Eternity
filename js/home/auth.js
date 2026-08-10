async function send (event){
    event.preventDefault();
    
    const ETY_FORM_COOKIE = 'eternity-form';
    const ETY_FORM_TIME = 10; /* tempo em minutos */

    if (!checkCookie(ETY_FORM_COOKIE)){
        const data = getFormData();

        try {
            const activeResponse = await fetch(`${URL_BASE}/api/membros/ativos`);
            if (!activeResponse.ok) {
                throw new Error("Não foi possível consultar os membros ativos");
            }

            const activeMembers = await activeResponse.json();
            const normalizedNick = String(data.nick || '').trim().toLowerCase();
            const existingMember = activeMembers.find(member =>
                String(member.nick || '').trim().toLowerCase() === normalizedNick
            );
            const isProfileUpdate = Boolean(existingMember);
            const targetUrl = isProfileUpdate ? URL_MEMBER_UPDATES : URL_MEMBERS;
            const requestData = isProfileUpdate
                ? {
                    membro_id: existingMember.id,
                    tipo: 'Atualização cadastral',
                    nick: existingMember.nick,
                    data_nascimento: data.data_nascimento,
                    foco: data.foco,
                }
                : data;

            const response = await fetch(targetUrl,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestData),
                }
            );
    
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            setCookie(ETY_FORM_COOKIE, ETY_FORM_TIME);
            const successMessage = isProfileUpdate
                ? "Atualização cadastral enviada para análise!"
                : "Solicitação de recrutamento enviada com sucesso!";
            alert(successMessage);
            msg.innerText = successMessage;
        } catch (error) {
            console.error(error);
            alert("Não foi possível enviar a solicitação. Verifique se já não existe uma solicitação pendente para esse nick e tente novamente mais tarde.")
        }
    }else{
        alert('Você já realizou o seu cadastro! Tente novamente mais tarde.')
        goHome()
    }
};

function goHome() {
    join.classList.remove('select');
    app.innerHTML = pages_content.home;
}
