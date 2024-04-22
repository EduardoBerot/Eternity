// const URL_DISCORD_INTEGRATION = "https://discord.com/api/webhooks/1228837417688109179/8LEi6HLNmY-nHpn0rB9oKk2fBrC0QzFQ334CToKoFnVOZxDmk8Vko0odRdjC34P6bSzE"
const URL_DISCORD_INTEGRATION = "https://discord.com/api/webhooks/1228845807550074900/HwKlDWuMZqONWv1HumZnjIoBPJnYmuDKnWziKJbImSe2EuWf6PsvswlCHPLYph24FWvH"

// const URL_BASE = "http://localhost:5000/api/membro"
const URL_BASE = "https://eternity-crud.onrender.com/api/membros"

async function send (event){
    event.preventDefault();

    if (!checkCookie()){
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
            let response = await fetch(URL_BASE,
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
            setCookie();
            msg.innerText="Cadastro Realizado com sucesso!"
            
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

function setCookie() {
    const expiry = new Date();
    expiry.setTime(expiry.getTime() + (10 * 60 * 1000)); // 10 minutos
    document.cookie = "eternity-form=true; expires=" + expiry.toGMTString() + "; path=/";
}

function checkCookie() {
    const cookieName = "eternity-form=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
        let c = cookies[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cookieName) == 0) {
            return true;
        }
    }
    return false;
}

function goHome() {
    join.classList.remove('select');
    app.innerHTML = pages_content.home;
}
