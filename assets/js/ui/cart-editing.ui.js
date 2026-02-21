/* ================================================
   MÓDULO: Cart Editing UI
   Ficheiro: assets/js/ui/cart-editing.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/**
 * Previne a digitação de "0" e valores que excedem o stock
 * Funciona como calculadora: números sempre adicionados no final
 */
function preventZero(event, input) {
  const key = event.key || event.char;
  const currentValue = input.value;

  // Permite Backspace e Delete normalmente
  if (key === 'Backspace' || key === 'Delete') {
    quantityInputIsSelected = false; // Limpa a flag quando usuário edita manualmente
    return true;
  }

  // Bloqueia teclas de navegação
  if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End') {
    event.preventDefault();
    return false;
  }

  // Permite Tab
  if (key === 'Tab') {
    return true;
  }

  // Se não é número, bloqueia
  if (!/[0-9]/.test(key)) {
    event.preventDefault();
    return false;
  }

  // ✅ BLOQUEIA O COMPORTAMENTO PADRÃO - vamos inserir manualmente
  event.preventDefault();

  // Se está tentando digitar "0" como primeiro dígito
  if (key === '0' && (currentValue === '' || currentValue === '0')) {
    return false;
  }

  // ✅ Verifica se o texto está selecionado (usando flag manual)
  let newValue;
  if (quantityInputIsSelected) {
    // Se há texto selecionado, substitui pela nova tecla
    newValue = key;
    quantityInputIsSelected = false; // Limpa a flag após a primeira digitação
  } else {
    // Se não há seleção, MODO CALCULADORA: adiciona no final
    newValue = currentValue + key;
  }

  const futureQty = parseInt(newValue);

  if (isNaN(futureQty)) {
    return false;
  }

  // Pega o productId do input
  const productId = input.id.replace('qty-', '');
  const id = parseInt(productId);

  // ✅ Busca o produto original em PRODUCTS para pegar o stock atualizado
  const product = PRODUCTS.find(p => p.id === id);

  if (product) {
    const isServico = product.ps && product.ps.toUpperCase() === 'S';
    const stockDisponivel = product.stock || 0;

    console.log('🔍 Validação Stock:', {
      productName: product.name,
      currentValue,
      key,
      newValue,
      futureQty,
      stockDisponivel,
      isServico
    });

    // Se é produto (não serviço) e quantidade futura excede o stock
    if (!isServico && futureQty > stockDisponivel) {
      // Mostra alerta crítico
      showCriticalAlert(`${product.name}: Quantidade máxima disponível em stock é ${stockDisponivel}.`, 3000);
      return false;
    }
  }

  // ✅ INSERE O NÚMERO NO FINAL MANUALMENTE
  input.value = newValue;

  // ✅ Mantém cursor no final
  input.setSelectionRange(newValue.length, newValue.length);

  // ✅ Dispara o evento oninput manualmente para atualizar o carrinho
  const inputEvent = new Event('input', { bubbles: true });
  input.dispatchEvent(inputEvent);

  return false;
}

/**
 * Valida e atualiza quantidade em tempo real
 * Impede a entrada de valores inválidos enquanto o usuário digita
 */
/**
 * Ativa o modo de edição quando o usuário começa a digitar no input de quantidade
 */
function startEditingQuantity() {
  modoEdicao = true;
  console.log('✏️ Modo de edição ATIVADO - Impedindo reload do carrinho');
}

/**
 * Desativa o modo de edição e sincroniza com a API após o usuário terminar de digitar
 */
let finishEditingTimeout = null;
let pendingSync = null; // Armazena dados de sincronização pendente

function finishEditingQuantity(productId, input) {
  const id = parseInt(productId);
  const cartItem = cart.get(id);

  // Armazena os dados para sincronização
  if (cartItem && input.value) {
    const qty = parseInt(input.value);
    if (!isNaN(qty) && qty >= 1) {
      pendingSync = { id, qty };
    }
  }

  // Limpa o timeout anterior se existir
  if (finishEditingTimeout) {
    clearTimeout(finishEditingTimeout);
  }

  // Aguarda 500ms após o blur para desativar o modo de edição
  // Isso permite múltiplas edições sem reload entre elas
  finishEditingTimeout = setTimeout(() => {
    modoEdicao = false;
    console.log('✅ Modo de edição DESATIVADO - Permitindo reload do carrinho');

    // Sincroniza se houver dados pendentes
    if (pendingSync) {
      syncToAPI(pendingSync.id, pendingSync.qty, null);
      pendingSync = null;
    }
  }, 500);
}

/**
 * Força a sincronização imediata de qualquer edição pendente
 * Chamada quando o usuário troca de card
 */
function forceSyncPendingEdit() {
  if (pendingSync) {
    console.log('🔄 Sincronizando edição pendente imediatamente');
    syncToAPI(pendingSync.id, pendingSync.qty, null);
    pendingSync = null;
  }
}

function validateAndUpdateQuantity(productId, input) {
  // Converte productId para número (pode vir como string do HTML)
  const id = parseInt(productId);

  let value = input.value;

  // Remove qualquer caractere não numérico
  value = value.replace(/[^0-9]/g, '');

  // Pega referências do card e cartItem ANTES de qualquer validação
  const card = document.querySelector(`[data-product-id="${productId}"]`);
  const cartItem = cart.get(id);

  // Impede zeros à esquerda e valor "0"
  if (value === '0' || value.startsWith('0')) {
    input.value = '';
    // ✅ Atualiza visual mesmo quando vazio
    if (card && cartItem) {
      const qtySpan = card.querySelector('.product-quantity');
      if (qtySpan) {
        qtySpan.textContent = '0';
      }
    }
    return;
  }

  // Se o campo está vazio, atualiza visual para mostrar vazio/0
  if (value === '') {
    input.value = '';
    // ✅ Atualiza visual mesmo quando vazio
    if (card && cartItem) {
      const qtySpan = card.querySelector('.product-quantity');
      if (qtySpan) {
        qtySpan.textContent = '0';
      }
    }
    return;
  }

  // Garante que seja um número inteiro positivo >= 1
  const qty = parseInt(value);
  if (isNaN(qty) || qty < 1) {
    input.value = '';
    // ✅ Atualiza visual mesmo quando inválido
    if (card && cartItem) {
      const qtySpan = card.querySelector('.product-quantity');
      if (qtySpan) {
        qtySpan.textContent = '0';
      }
    }
    return;
  }

  // Define o valor limpo no input
  input.value = qty;

  // ✅ Atualiza IMEDIATAMENTE a quantidade e o preço total no resumo do card
  if (card && cartItem) {
    // Atualiza a quantidade visual - SEMPRE em tempo real
    const qtySpan = card.querySelector('.product-quantity');
    if (qtySpan) {
      qtySpan.textContent = qty;
    }

    // Calcula e atualiza o preço total
    const price = cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
    const total = price * qty;

    const totalSpan = card.querySelector('.product-total-price');
    if (totalSpan) {
      totalSpan.textContent = currency.format(total);
    }
  }

  // ✅ NÃO sincroniza durante a digitação - apenas atualiza localmente
  // A sincronização acontece no onblur (finishEditingQuantity)

  // Atualiza apenas o Map local sem chamar a API
  if (cartItem) {
    cartItem.qty = qty;
  }
}

/**
 * Atualiza quantidade de um produto
 */
function updateCartProductQuantity(productId, newQty) {
  const qty = parseInt(newQty);

  // Validação: não aceita números abaixo de 1
  if (isNaN(qty) || qty < 1) {
    // Reverte o input para o valor anterior
    const qtyInput = document.getElementById(`qty-${productId}`);
    const cartItem = cart.get(productId);
    if (qtyInput && cartItem) {
      qtyInput.value = cartItem.qty;
    }
    return;
  }

  const cartItem = cart.get(productId);
  if (!cartItem) return;

  // Atualiza a quantidade no Map
  cartItem.qty = qty;

  // Atualiza o resumo visual (quantidade e total)
  const card = document.querySelector(`[data-product-id="${productId}"]`);
  if (card) {
    const qtySpan = card.querySelector('.product-quantity');
    const totalSpan = card.querySelector('.product-total-price');

    const price = cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
    const total = price * qty;

    if (qtySpan) qtySpan.textContent = qty;
    if (totalSpan) totalSpan.textContent = currency.format(total);
  }

  // Sincroniza com a API
  syncToAPI(productId, qty, null);
}

/**
 * Atualiza preço de um produto
 */
function updateCartProductPrice(productId, newPrice) {
  const price = parseFloat(newPrice);

  if (isNaN(price) || price < 0) return;

  const cartItem = cart.get(productId);
  if (!cartItem) return;

  // Atualiza o preço customizado
  cartItem.customPrice = price;

  // Atualiza o total visual
  const card = document.querySelector(`[data-product-id="${productId}"]`);
  if (card) {
    const totalSpan = card.querySelector('.product-total-price');
    const total = price * cartItem.qty;

    if (totalSpan) totalSpan.textContent = currency.format(total);
  }

  // Remove the numeric input event listener and disable formatter
  const input = document.getElementById(`price-${productId}`);
  if (input) {
    // Disable the formatter if it exists
    const formatter = window[`priceFormatter_${productId}`];
    if (formatter) {
      formatter.disable();
    }
    
    input.value = formatPriceDisplay(price);
    input.setAttribute('readonly', 'true');
  }

  // Sincroniza com a API enviando TAMBÉM a quantidade atual
  syncToAPI(productId, cartItem.qty, price);
}

/**
 * Inicia a edição do preço com duplo clique
 */
function startEditingPrice(productId, input) {
  const id = parseInt(productId);
  const cartItem = cart.get(id);
  
  if (!cartItem) return;
  
  const price = cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
  
  // ✅ CRITICAL FIX: Remove readonly BEFORE enabling formatter
  input.removeAttribute('readonly');
  
  // ✅ CORREÇÃO: Verifica se formatter JÁ EXISTE
  let formatter = window[`priceFormatter_${productId}`];
  
  if (!formatter) {
    // ✅ Cria APENAS se não existir
    formatter = new MonetaryFormatter(`price-${productId}`, {
      locale: 'pt-AO',
      currency: 'Kz',
      decimals: 2,
      onValueChange: (value) => {
        // Atualiza preview em tempo real
        const card = document.querySelector(`[data-product-id="${productId}"]`);
        if (card && cartItem) {
          const totalSpan = card.querySelector('.product-total-price');
          const total = value * cartItem.qty;
          if (totalSpan) totalSpan.textContent = currency.format(total);
        }
      }
    });
    
    // ✅ Armazena para reutilizar
    window[`priceFormatter_${productId}`] = formatter;
    console.log(`✅ [PRICE] Formatter criado para produto ${productId}`);
  } else {
    console.log(`♻️ [PRICE] Reutilizando formatter existente para produto ${productId}`);
  }
  
  // ✅ ATIVA o formatter (adiciona listeners)
  formatter.enable();
  
  // ✅ Define valor inicial
  formatter.setValue(price);
  
  // ✅ Foca no input
  input.focus();
  
  console.log('✏️ Editando preço do produto:', productId, '- Valor:', price);
}

/**
 * Submits the edited price when user clicks outside the input
 * Called on blur event
 */
function submitEditingPrice(productId, input) {
  const id = parseInt(productId);
  const formatter = window[`priceFormatter_${productId}`];
  
  if (!formatter) {
    console.warn('⚠️ [SUBMIT BLUR] Formatter not found for product:', productId);
    return;
  }
  
  // Get the new price from formatter
  const newPrice = formatter.getValue();
  
  console.log(`💾 [SUBMIT BLUR] Submitting price ${newPrice} for product ${productId}`);
  
  // Validate price
  if (newPrice >= 0) {
    // ✅ Update price
    updateCartProductPrice(id, newPrice);
    
    // ✅ Disable formatter
    formatter.disable();
    
    // ✅ Lock input
    input.setAttribute('readonly', 'true');
    
    console.log(`✅ [SUBMIT BLUR] Price saved: ${newPrice} for product ${productId}`);
  } else {
    console.warn(`⚠️ [SUBMIT BLUR] Invalid price, cancelling edit`);
    cancelEditingPrice(productId, input);
  }
}

/**
 * Handles blur event intelligently
 * Submits if value changed, cancels if ESC was pressed
 */
function handlePriceBlur(productId, input) {
  const id = parseInt(productId);
  const formatter = window[`priceFormatter_${productId}`];
  
  if (!formatter) {
    console.warn('⚠️ [BLUR] Formatter not found');
    return;
  }
  
  // ✅ Check if ESC was pressed
  if (isPriceEditCancelled) {
    console.log(`🚫 [BLUR] Cancelled by ESC flag, not submitting`);
    isPriceEditCancelled = false;  // Reset flag
    return;
  }
  
  // Get current value from formatter
  const currentValue = formatter.getValue();
  
  // Get original value from cart
  const cartItem = cart.get(id);
  const originalPrice = cartItem ? (cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price)) : 0;
  
  console.log(`🔍 [BLUR] Checking if price changed:`, {
    productId,
    original: originalPrice,
    current: currentValue,
    changed: currentValue !== originalPrice
  });
  
  // If value changed, submit; otherwise, just cancel
  if (currentValue !== originalPrice && currentValue >= 0) {
    console.log(`✅ [BLUR] Price changed, submitting...`);
    submitEditingPrice(productId, input);
  } else {
    console.log(`❌ [BLUR] No change or invalid value, cancelling...`);
    cancelEditingPrice(productId, input);
  }
}

/**
 * Salva edição de preço ao pressionar ENTER
 */
function handlePriceKeydown(event, productId, input) {
  const formatter = window[`priceFormatter_${productId}`];
  
  if (!formatter) {
    console.warn('⚠️ Formatter não encontrado para produto:', productId);
    return;
  }
  
  if (event.key === 'Enter') {
    event.preventDefault();
    
    const newPrice = formatter.getValue();
    
    if (newPrice >= 0) {
      // ✅ Atualiza preço
      updateCartProductPrice(parseInt(productId), newPrice);
      
      // ✅ DESATIVA o formatter (remove listeners)
      formatter.disable();
      
      // ✅ Bloqueia input novamente
      input.setAttribute('readonly', 'true');
      input.blur();
      
      console.log(`✅ Preço confirmado: ${newPrice} para produto ${productId}`);
    }
  } else if (event.key === 'Escape') {
    event.preventDefault();
    
    // ✅ Set cancellation flag
    isPriceEditCancelled = true;
    
    // ✅ Cancel edit
    cancelEditingPrice(productId, input);
    
    // ✅ DESATIVA o formatter
    formatter.disable();
    
    console.log(`🚫 Edit cancelled by ESC for product ${productId}`);
  }
  
  // ❌ NÃO delega para formatter.handleKeyboard() aqui
  // (o formatter já está escutando diretamente via seu próprio listener)
}

function formatPriceDisplay(value) {
  // Converte para número para garantir formatação correta
  const numValue = parseFloat(value) || 0;
  
  // Formata com separadores de milhar e 2 casas decimais (como o input de pagamento)
  const formatted = numValue.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatted;
}

/*
function handlePriceKeydownNumeric(event) {
  const input = event.target;
  const key = event.key;

  // BACKSPACE: Remove último caractere
  if (key === 'Backspace') {
    // Permitido - o próprio input lida com isso
    return;
  }

  // DELETE: Limpa tudo
  if (key === 'Delete') {
    event.preventDefault();
    // Limpa o input
    input.value = '';
    return;
  }

  // PONTO DECIMAL: Adiciona ponto (aceita . ou , ou Decimal do numpad)
  if (key === '.' || key === ',' || key === 'Decimal') {
    event.preventDefault();
    const currentValue = input.value;
    // Verifica se já existe ponto decimal
    if (currentValue.includes('.')) {
      console.log('⚠️ Já existe ponto decimal - ignorando');
      return;
    }
    // Adiciona ponto decimal
    input.value = currentValue + '.';
    return;
  }

  // NÚMEROS: Adiciona dígito
  if (/^[0-9]$/.test(key)) {
    event.preventDefault();
    const currentValue = input.value;
    input.value = currentValue + key;
    // Limita a 2 casas decimais após o ponto
    if (input.value.includes('.')) {
      const parts = input.value.split('.');
      if (parts[1] && parts[1].length > 2) {
        input.value = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    return;
  }

  // Arrow keys, Tab, Home, End são permitidos para navegação
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'].includes(key)) {
    return;
  }

  // Prevenir qualquer outro caractere
  event.preventDefault();
}
*/

/**
 * Cancela edição e restaura valor formatado
 */
function cancelEditingPrice(productId, input) {
  setTimeout(() => {
    const id = parseInt(productId);
    const cartItem = cart.get(id);

    if (cartItem) {
      const price = cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
      input.value = formatPriceDisplay(price);
    }

    // ✅ DESATIVA o formatter
    const formatter = window[`priceFormatter_${productId}`];
    if (formatter) {
      formatter.disable();
    }

    // Bloqueia input
    input.setAttribute('readonly', 'true');
    
    console.log(`❌ Edição cancelada para produto ${productId}`);
  }, 150);
}

/**
 * Remove produto do carrinho
 */
function handleInputKeydown(event, productId) {
  if (event.key === 'Enter') {
    event.preventDefault();

    // Encontra o card atual
    const card = document.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
      // Remove a classe expanded para colapsar o card
      card.classList.remove('expanded');
      // Limpa o registro do último card expandido
      lastExpandedProductId = null;
    }

    // Remove o foco do input (opcional, para evitar que continue editando)
    event.target.blur();
  }
}

