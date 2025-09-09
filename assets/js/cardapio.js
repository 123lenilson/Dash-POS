const tabela = document.getElementById("tabela-pedidos-hoje");
const cart = {};
// declarar no topo do ficheiro (logo após const fecharSidebarBtn ...)
let modoEdicao = false;
let produtoEditandoId = null;

const productGrid = document.getElementById("productGrid");
const cartItems = document.getElementById("cartItems");
const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");

const sidebar = document.getElementById("sidebar");
const formProduto = document.getElementById("formProduto");
const sidebarTitle = document.getElementById("sidebarTitle");
const abrirSidebarBtn = document.getElementById("abrirModal");
const fecharSidebarBtn = document.querySelector(".close-btn");

const searchInput = document.getElementById("searchInput"); // Já declarando aqui para usar no polling

// Variável para controlar se o input está focado (usuário pesquisando)
let estaPesquisando = false;

// Event listeners para controlar o foco do input de pesquisa
searchInput.addEventListener("focus", () => {
  estaPesquisando = true;
});

searchInput.addEventListener("blur", () => {
  estaPesquisando = false;
  carregarCardapios(); // Atualiza a lista quando o usuário sair do campo
});

// abrir modal "Adicionar Produto" - já tens algo assim, garanta que reseta modo
abrirSidebarBtn.addEventListener("click", () => {
  modoEdicao = false;
  produtoEditandoId = null;
  sidebarTitle.textContent = "Adicionar Produto";
  document.getElementById("nome").value = "";
  document.getElementById("preco").value = "";
  delete formProduto.dataset.mode;
  sidebar.classList.add("open");
});

// Fecha a sidebar ao clicar no 'X'
fecharSidebarBtn.addEventListener("click", () => {
  sidebar.classList.remove("open"); // Remove classe para animação
});

// Lógica de submit do formulário (add ou edit)
formProduto.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const preco = parseFloat(document.getElementById("preco").value);

  // validação simples
  if (!nome) {
    alert("Nome obrigatório");
    return;
  }
  if (isNaN(preco)) {
    alert("Preço inválido");
    return;
  }

  try {
    if (modoEdicao && produtoEditandoId) {
      // === MODO EDIÇÃO ===
      const res = await fetch(`../api/cardapio.php?acao=alterar&id=${produtoEditandoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, preco })
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.mensagem || "Erro ao alterar produto");
      }

      // sucesso edição
      //alert("Produto alterado com sucesso!");
      sidebar.classList.remove("open");
      modoEdicao = false;
      produtoEditandoId = null;
      delete formProduto.dataset.mode;
      carregarCardapios();
      return; // IMPORTANTE: evita executar o bloco de adicionar
    }

    // === MODO ADICIONAR ===
    const resAdd = await fetch(`../api/cardapio.php?acao=adicionar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, preco })
    });

    const dataAdd = await resAdd.json();
    if (!resAdd.ok || !dataAdd.sucesso) {
      throw new Error(dataAdd.mensagem || "Erro ao adicionar produto");
    }

    //alert("Produto adicionado com sucesso!");
    sidebar.classList.remove("open");
    carregarCardapios();

  } catch (err) {
    console.error("Erro na operação:", err);
    alert("Ocorreu um erro: " + (err.message || err));
  } finally {
    // limpa flags caso algo falhe
    modoEdicao = false;
    produtoEditandoId = null;
  }
});


function updateCart() {
  cartItems.innerHTML = "";
  let subtotal = 0;
  Object.keys(cart).forEach((key) => {
    const item = cart[key];
    subtotal += item.price * item.qty;

    const itemEl = document.createElement("div");
    itemEl.className = "cart-item";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = item.name;
    itemEl.appendChild(nameSpan);

    const qtyControl = document.createElement("div");
    qtyControl.className = "qty-control";

    const minusBtn = document.createElement("button");
    minusBtn.textContent = "-";
    minusBtn.addEventListener("click", () => changeQty(item.name, -1));
    qtyControl.appendChild(minusBtn);

    const qtySpan = document.createElement("span");
    qtySpan.style.margin = "0 8px";
    qtySpan.textContent = item.qty;
    qtyControl.appendChild(qtySpan);

    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.addEventListener("click", () => changeQty(item.name, 1));
    qtyControl.appendChild(plusBtn);

    itemEl.appendChild(qtyControl);
    cartItems.appendChild(itemEl);
  });

  const tax = subtotal * 0.1;
  const total = subtotal + tax;
  subtotalEl.textContent = subtotal.toFixed(2);
  taxEl.textContent = tax.toFixed(2);
  totalEl.textContent = total.toFixed(2);
}

function changeQty(name, amount) {
  if (cart[name]) {
    cart[name].qty += amount;
    if (cart[name].qty <= 0) delete cart[name];
  }
  updateCart();
}

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

carregarCardapios();

setInterval(() => {
  // Só atualiza se não estiver editando e não estiver pesquisando no input
  if (!modoEdicao && !estaPesquisando) {
    carregarCardapios();
  }
}, 500);

function atualizarCards(cardapios) {
  productGrid.innerHTML = "";
  cardapios.forEach(cardapio => {
    const card = document.createElement("div");
    card.className = "card";

    const h3 = document.createElement("h3");
    h3.textContent = cardapio.nome;
    card.appendChild(h3);

    const p = document.createElement("p");
    p.textContent = `Kz ${parseFloat(cardapio.preco).toFixed(2)}`;
    card.appendChild(p);

    // Adicionando os ícones de ações
    const actions = document.createElement("div");
    actions.className = "card-actions";

    const editIcon = document.createElement("i");
    editIcon.classList.add("fas", "fa-pencil"); // Ícone de lápis para editar
    editIcon.addEventListener("click", (e) => {
       e.stopPropagation();
      modoEdicao = true;
      produtoEditandoId = cardapio.id;

      sidebarTitle.textContent = "Editar Produto";
      document.getElementById("nome").value = cardapio.nome;
      document.getElementById("preco").value = cardapio.preco;

      // opcional: marca o form como edit
      formProduto.dataset.mode = "edit";
      formProduto.dataset.originalNome = cardapio.nome || "";

      sidebar.classList.add("open");

    });
    actions.appendChild(editIcon);

    const deleteIcon = document.createElement("i");
    deleteIcon.classList.add("fas", "fa-trash"); // Ícone de lixo
    deleteIcon.addEventListener("click", (e) => {
      e.stopPropagation(); // Evita que clique no ícone adicione ao carrinho

      if (confirm(`Tem certeza que deseja excluir "${cardapio.nome}"?`)) {
        fetch(`../api/cardapio.php?acao=deletar&id=${cardapio.id}`, {
          method: "DELETE",
        })
          .then(response => {
            if (!response.ok) {
              throw new Error("Erro ao deletar produto");
            }
            return response.json();
          })
          .then(data => {
            console.log(data.mensagem || "Produto deletado com sucesso");
            carregarCardapios(); // Atualiza a lista
          })
          .catch(err => console.error("Erro ao deletar:", err));
      }
    });
    actions.appendChild(deleteIcon);


    card.appendChild(actions);

    // Evento de clique no card para adicionar ao carrinho
    card.addEventListener("click", () => {
      if (!cart[cardapio.nome]) {
        cart[cardapio.nome] = { name: cardapio.nome, price: parseFloat(cardapio.preco), qty: 1 };
      } else {
        cart[cardapio.nome].qty++;
      }
      updateCart();
    });

    productGrid.appendChild(card);
  });

  // O listener do searchInput para filtrar cards localmente continua igual
  searchInput.addEventListener("keyup", function () {
    const filter = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
      const title = card.querySelector("h3").textContent.toLowerCase();
      if (title.includes(filter)) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
  });
}
