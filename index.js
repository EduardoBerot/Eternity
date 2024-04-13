const URL_DISCORD_INTEGRATION = "https://discord.com/api/webhooks/1228845807550074900/HwKlDWuMZqONWv1HumZnjIoBPJnYmuDKnWziKJbImSe2EuWf6PsvswlCHPLYph24FWvH"

async function send (event){
    event.preventDefault();
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

        const data = await response.json();
    } catch (error) {
        // console.error(error);
    }
};
