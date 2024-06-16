
function checkAniver() {
    const URL_ANIVERSARIANTES = `${URL_BASE}/api/aniversariantes`
    fetch(URL_ANIVERSARIANTES)
        .then(response=>{
            return response.json()
        })
        .then(data=>{
            if (data.length > 0) {
                data.forEach(player => {
                    sendMsg(player.nick)
                });
            }
        })
        .catch(error=>console.error(`Um erro ocorreu: ${error}`))
}

function sendMsg(nick) {
    const msg = `@everyone O player **${nick}** está fazendo aniversário hoje. A Eternity celebra o seu dia!`;
    // const URL_DISCORD_INTEGRATION = "https://discord.com/api/webhooks/1228845807550074900/HwKlDWuMZqONWv1HumZnjIoBPJnYmuDKnWziKJbImSe2EuWf6PsvswlCHPLYph24FWvH";
    const URL_DISCORD_INTEGRATION = "https://discord.com/api/webhooks/1228837417688109179/8LEi6HLNmY-nHpn0rB9oKk2fBrC0QzFQ334CToKoFnVOZxDmk8Vko0odRdjC34P6bSzE";

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content: 'Comunicado',
            tts: false,
            color: "white",
            embeds: [{
                title: "Aniversariante do Dia",
                description: msg,
            }]
        }),
    }

    fetch(URL_DISCORD_INTEGRATION, options).catch(error=>console.error(`Um erro ocorreu: ${error}`))
}

