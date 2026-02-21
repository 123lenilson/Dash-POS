/* ================================================
   MÓDULO: Cart Module
   Ficheiro: assets/js/modules/cart.module.js
   Parte do sistema Dash-POS
   ================================================ */

function addToCart(id, delta) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  // ✅ CORREÇÃO: Usa toUpperCase() ao invés de toLowerCase()
  console.log("🔍 DEBUG addToCart:", {
    id: id,
    nome: product.name,
    ps: product.ps,
    available: product.available,
    isServico: product.ps && product.ps.toUpperCase() === 'S',
    delta: delta
  });

  const isServico = product.ps && product.ps.toUpperCase() === 'S';
  const isProduto = !isServico;

  if (isProduto && !product.available) {
    console.warn(`❌ Tentativa de adicionar PRODUTO indisponível: ${product.name} (ID: ${id})`);
    showAlert("error", "❌ Stock Indisponível", ` "${product.name}" não está disponível no momento. Stock esgotado.`);
    return;
  }

  // ✅ SERVIÇOS passam direto
  const entry = cart.get(id) || { product, qty: 0, customPrice: product.price };
  const newQty = entry.qty + delta;

  if (newQty <= 0) {
    cart.delete(id);
    syncToAPI(id, 0, null);
    // Se o produto removido era o expansivo, limpa o registro
    if (lastExpandedProductId === id) {
      lastExpandedProductId = null;
    }
    // ✅ Reseta os valores dos métodos de pagamento
    resetFooterPaymentValues();
  } else {
    // ✅ Marca este produto como o último expandido quando adicionado
    lastExpandedProductId = id;
    syncToAPI(id, newQty, null);
  }
}

function removeFromCart(id) {
  const wasOnlyItem = cart.size === 1;
  if (cart.has(id)) {
    syncToAPI(id, 0);  // Envia qty=0
  }
  cart.delete(id);

  // Só reseta métodos de pagamento quando era o único produto (igual ao botão Limpar Tudo)
  if (wasOnlyItem && typeof resetFooterPaymentValues === 'function') {
    resetFooterPaymentValues();
  }

  renderCart();
}

function showRemoveConfirmation(productId, productName) {
  console.log('❓ [CART] Solicitando confirmação para remover:', productName);

  showConfirmModal({
    title: "Remover Item?",
    message: `Tem certeza que deseja remover "${productName}" do carrinho?`,
    confirmText: "Sim, Remover",
    cancelText: "Manter no Carrinho",
    confirmColor: "red",
    icon: "warning"
  },
    // Callback quando confirmar
    function () {
      console.log('✅ [CART] Usuário confirmou remoção do produto:', productName);
      removeFromCart(productId);
      showAlert("success", "✅ Item Removido", `${productName} foi removido do carrinho`);
    },
    // Callback quando cancelar (opcional)
    function () {
      console.log('❌ [CART] Usuário cancelou remoção do produto:', productName);
    });
}

/**
 * Remove produto do carrinho
 */
function removeCartProduct(productId) {
  // Converte o ID para número (caso venha como string do HTML)
  const numericId = parseInt(productId);

  console.log('🔍 [DEBUG] removeCartProduct chamado com:', {
    originalId: productId,
    numericId: numericId,
    type: typeof productId,
    cartKeys: Array.from(cart.keys())
  });

  const cartItem = cart.get(numericId);

  if (!cartItem || !cartItem.product) {
    console.warn('Produto não encontrado no carrinho:', numericId);
    return;
  }

  const productName = cartItem.product.name;

  console.log('❓ [CART] Solicitando confirmação para remover:', productName);

  showConfirmModal({
    title: "Remover Item?",
    message: `Tem certeza que deseja remover "${productName}" do carrinho?`,
    confirmText: "Sim, Remover",
    cancelText: "Cancelar",
    confirmColor: "red",
    icon: "warning"
  },
    // Callback quando confirmar
    function () {
      console.log('✅ [CART] Usuário confirmou remoção do produto:', productName);

      // Só limpar métodos de pagamento se este era o único produto no carrinho (comportamento igual ao "Limpar Tudo")
      const wasOnlyItem = cart.size === 1;

      // Remove do carrinho usando o ID numérico
      cart.delete(numericId);

      // Sincroniza com a API usando o ID numérico
      syncToAPI(numericId, 0, null);

      if (wasOnlyItem && typeof resetFooterPaymentValues === 'function') {
        resetFooterPaymentValues();
      }

      // Atualiza a exibição
      updateCartDisplay();

      // Limpa o registro do último card expandido se for o removido
      if (lastExpandedProductId === numericId) {
        lastExpandedProductId = null;
      }

      showAlert("success", "✅ Item Removido", `${productName} foi removido do carrinho`);
    },
    // Callback quando cancelar
    function () {
      console.log('❌ [CART] Usuário cancelou remoção do produto:', productName);
    });
}

/**
 * Limpa todos os produtos do carrinho
 * Mostra confirmação antes de limpar
 */
function clearCart() {
  if (cart.size === 0) {
    console.log('⚠️ [CART] Carrinho já está vazio');
    showAlert("info", "ℹ️ Carrinho Vazio", "Não há produtos no carrinho para limpar");
    return;
  }

  const totalItems = cart.size;

  console.log('❓ [CART] Solicitando confirmação para limpar carrinho com', totalItems, 'itens');

  showConfirmModal({
    title: "Limpar Carrinho?",
    message: `Tem certeza que deseja remover todos os ${totalItems} ${totalItems === 1 ? 'produto' : 'produtos'} do carrinho?`,
    confirmText: "Sim, Limpar Tudo",
    cancelText: "Cancelar",
    confirmColor: "red",
    icon: "warning"
  },
    // Callback quando confirmar
    function () {
      console.log('✅ [CART] Usuário confirmou limpeza do carrinho');

      // Sincroniza cada produto com qty=0 para limpar no backend
      cart.forEach((item, productId) => {
        syncToAPI(productId, 0, null);
      });

      // Limpa o carrinho local
      cart.clear();

      // Limpa o registro do último card expandido
      lastExpandedProductId = null;

      // ✅ Reseta os valores dos métodos de pagamento
      resetFooterPaymentValues();

      // Atualiza a exibição
      updateCartDisplay();
      renderCart();

      showAlert("success", "✅ Carrinho Limpo", "Todos os produtos foram removidos do carrinho");
    },
    // Callback quando cancelar
    function () {
      console.log('❌ [CART] Usuário cancelou limpeza do carrinho');
    });
}

/**
 * Função alternativa para mostrar confirmação de remoção de todos os itens
 * Usada pelos listeners antigos no renderCart
 */
function showRemoveAllConfirmation() {
  clearCart();
}
