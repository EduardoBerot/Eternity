const URL_DISCORD_INTEGRATION = "https://discord.com/api/webhooks/1228845807550074900/HwKlDWuMZqONWv1HumZnjIoBPJnYmuDKnWziKJbImSe2EuWf6PsvswlCHPLYph24FWvH"

async function send (event){
    event.preventDefault();

    if (!checkCookie()){
        data = `nick: ${nick.value}\nidade: ${idade.value}\n foco: ${foco.value}`;
    
        const body = {
            content: "Mensagem Recebida",
            tts: false,
            color: "white",
            embeds: [
                {
                    title: "Formulário de Contato",
                    description: data,
                },
            ],
        };
    
        try {
            const response = await fetch(URL_DISCORD_INTEGRATION,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                }
            );
    
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
    
            // const data = await response.json();
            setCookie();
            msg.innerText="Cadastro Realizado com sucesso!"
            
        } catch (error) {
            // console.error(error);
        }
    }else{
        console.log('teste');
        alert('Você já realizou o seu cadastro! Tente novamente mais tarde.')
        goHome()
    }
};

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
    item2.classList.remove('select');
    item1.classList.add('select');

    app.innerHTML = '<h1>Acesse nosso discord</h1></br><p>Para acessar nosso servidor discord basta clicar no botão abaixo, lá você podera se manter atualizado quanto as novidades do Clã.</p>';
}
