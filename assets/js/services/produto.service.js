/* ================================================
   MÓDULO: Produto Service
   Ficheiro: assets/js/services/produto.service.js
   Parte do sistema Dash-POS
   ================================================ */

function carregarProdutos() {
  fetch("http://localhost/Dash-POS/api/produtos.php?acao=listar_prod", {
    method: "GET",
    cache: "no-store"
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`Erro HTTP ${response.status}: ${text || response.statusText}`);
        });
      }
      return response.json();
    })
    .then(produtos => {
      atualizarProdutos(produtos);
    })
    .catch(error => {
      console.error("Erro no fetch:", error);
      productGrid.innerHTML = `<div style='grid-column:1/-1; text-align:center; color:#8b8fa3; padding:20px;'>Erro ao carregar os dados: ${error.message}</div>`;
      if (typeof skeletonMarkProductsReady === 'function') skeletonMarkProductsReady();
    });
}

function atualizarProdutos(produtos) {
  if (!Array.isArray(produtos)) {
    console.error("Erro: API não retornou um array", produtos);
    productGrid.innerHTML = `<div style='grid-column:1/-1; text-align:center; color:#8b8fa3; padding:20px;'>Erro: Dados inválidos recebidos da API</div>`;
    return;
  }

  PRODUCTS = produtos.map(item => {
    const isServico = (item.ps || 'P').toUpperCase() === 'S';
    const stock = parseInt(item.qtd) || 0;

    return {
      id: parseInt(item.idproduto) || 0,
      cat: item.categoria_nome || "Todos Produtos",
      name: item.descricao || "Produto sem nome",
      price: parseFloat(item.preco_com_imposto) || parseFloat(item.venda) || 0,
      preco_base: parseFloat(item.venda) || 0,
      impostos: parseInt(item.impostos) || null,
      imposto_percentagem: parseFloat(item.imposto_percentagem) || 0,
      imposto_descricao: item.imposto_descricao || '',
      available: isServico ? true : (stock > 0),
      ps: (item.ps || 'P').toUpperCase(),
      barra: item.barra || null,
      stock: stock,
      img: ""
    };
  });

  console.log(`✅ Produtos carregados: ${PRODUCTS.length}`);
  console.log(`📊 Produtos: ${PRODUCTS.filter(p => p.ps === 'P').length}, Serviços: ${PRODUCTS.filter(p => p.ps === 'S').length}`);
  console.log(`📊 Com código de barras: ${PRODUCTS.filter(p => p.barra).length}, Sem código: ${PRODUCTS.filter(p => !p.barra).length}`);
  console.log(`💰 Preços com imposto aplicado - Exemplo:`, PRODUCTS.slice(0, 3).map(p => ({
    nome: p.name,
    preco_base: p.preco_base,
    imposto: p.imposto_descricao,
    preco_final: p.price
  })));

  console.log("📋 Detalhes dos itens mapeados:", PRODUCTS.slice(0, 5).map(p => ({
    id: p.id,
    name: p.name.substring(0, 20) + '...',
    ps: p.ps,
    available: p.available,
    tipo: p.ps === 'S' ? 'SERVIÇO' : 'PRODUTO'
  })));

  const counts = {};
  for (const p of PRODUCTS) {
    const c = p.cat;
    counts[c] = (counts[c] || 0) + 1;
  }
  counts["Todos Produtos"] = PRODUCTS.length;
  const order = ["Todos Produtos", ...Object.keys(counts).filter(c => c !== "Todos Produtos").sort()];

  const keyArr = order.map(cat => `${cat}:${counts[cat]}`);
  const key = JSON.stringify(keyArr);

  if (key !== lastCategoriesKey) {
    lastCategoriesKey = key;
    buildCategories(order, counts, true);
  }

  renderProducts();
  if (typeof skeletonMarkProductsReady === 'function') skeletonMarkProductsReady();
}
