async function send (event){
    event.preventDefault();
    
    const ETY_FORM_COOKIE = 'eternity-form';
    const ETY_FORM_TIME = 10; /* tempo em minutos */

    if (!checkCookie(ETY_FORM_COOKIE)){
        data = getFormData();

        try {
            let response = await fetch(URL_MEMBERS,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                }
            );
    
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            setCookie(ETY_FORM_COOKIE, ETY_FORM_TIME);
            alert("Cadastro Realizado com sucesso!");
            msg.innerText="Cadastro realizado com sucesso!";
        } catch (error) {
            alert("Não foi possível realizar o cadastro. Verifique se já não exite solicitações para esse nick e tente mais tarde novamente.")
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
