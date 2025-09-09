function carregarCardapios() {
  fetch("../api/cardapio.php?acao=listar", {
    method: "GET",
    cache: "no-store"
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Erro ao buscar cardápios");
      }
      return response.json();
    })
    .then(cardapios => atualizarCards(cardapios))
    .catch(error => {
      console.error("Erro no fetch:", error);
      // tabela.innerHTML = "<tr><td colspan='5'>Erro ao carregar os dados</td></tr>";
    });

}