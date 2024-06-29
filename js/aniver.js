
function checkAniver() {
    const URL_ANIVERSARIANTES = `${URL_BASE}/api/aniversariantes`
    fetch(URL_ANIVERSARIANTES)
        .then(response=>{
            return response.json()
        })
        .catch(error=>console.error(`Um erro ocorreu: ${error}`))
}
