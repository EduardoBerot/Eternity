async function send (event){
    event.preventDefault();

    const ETY_FORM_COOKIE = 'eternity-form';
    const ETY_FORM_TIME = 10; /* tempo em minutos */
    const URL_MEMBERS = `${URL_BASE}/api/membro`

    if (!checkCookie(ETY_FORM_COOKIE)){
        data = getFormData();
        
        const body = {
            content: "Mensagem Recebida",
            tts: false,
            color: "white",
            embeds: [
                {
                    title: "Formulário de Cadastro",
                    description: JSON.stringify(data,null,'\t'),
                },
            ],
        };

        try {
            let response = await fetch(URL_MEMBERS,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                }
            );
    
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }else{
                response = await fetch(URL_DISCORD_INTEGRATION,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(body),
                    }
                );
                if (!response.ok) {
                    throw new Error(response.statusText);
                }
            }
    
            // const data = await response.json();
            setCookie(ETY_FORM_COOKIE, ETY_FORM_TIME);
            alert("Cadastro Realizado com sucesso!");
            msg.innerText="Cadastro Realizado com sucesso!";
        } catch (error) {
            alert("Não foi possível realizar o cadastro. Verifique se já não exite solicitações para esse nick e tente mais tarde novamente.")
        }
    }else{
        alert('Você já realizou o seu cadastro! Tente novamente mais tarde.')
        goHome()
    }
};

function getFormData() {
    const data = {
        uuid: document.getElementById('uuid').value,
        nick: document.getElementById('nick').value,
        idade: document.getElementById('idade').value,
        foco: document.getElementById('foco').value,
        recrutador: document.getElementById('recrutador').value,
        cargo: document.getElementById('cargo').value,
        data_entrada: document.getElementById('data_entrada').value,
        status: document.getElementById('status').value,
    }
    return data
}

function goHome() {
    join.classList.remove('select');
    app.innerHTML = pages_content.home;
}
