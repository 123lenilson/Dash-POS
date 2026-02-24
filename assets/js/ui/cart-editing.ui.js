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

  // Detecta seleção real: flag da expansão do card OU seleção DOM real (mouse/Shift+setas)
  const hasRealSelection = quantityInputIsSelected ||
    (input.selectionStart !== undefined && input.selectionStart !== input.selectionEnd);

  let newValue;
  if (hasRealSelection) {
    // Há seleção activa — substitui o conteúdo seleccionado pela tecla premida
    newValue = key;
    quantityInputIsSelected = false; // Limpa flag após usar
  } else {
    // Sem seleção — MODO CALCULADORA: adiciona no final
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
 * (finishEditingTimeout e pendingSync estão em state.js)
 */
function finishEditingQuantity(productId, input) {
  const id = parseInt(productId);
  const cartItem = cart.get(id);

  // Determina a quantidade a sincronizar:
  // se vazio, "0", NaN ou < 1 → fallback para 1
  let qty = parseInt(input.value);
  if (!cartItem || isNaN(qty) || qty < 1) {
    qty = 1;
  }

  // Corrige o input visualmente para o valor que vai ser sincronizado
  input.value = qty;

  // Regista para sincronização
  pendingSync = { id, qty };

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
 * Aplica uma tecla do teclado numérico da tela ao input de quantidade.
 * Chamado por payment.ui.js quando o utilizador clica no keypad e o alvo é um input qty-*.
 * value: '0'..'9', 'C' (limpar), 'back' (apagar), '.' (ignorado)
 */
function handleQuantityKeypadKey(input, value) {
  if (!input || input.id == null || !input.id.startsWith('qty-')) return;
  const productId = input.id.replace('qty-', '');
  const id = parseInt(productId, 10);
  const currentRaw = (input.value || '').replace(/[^0-9]/g, '');

  if (value === 'C') {
    // Esvazia o input e activa a flag de substituição.
    // O comportamento é idêntico ao do botão 'back' quando o input fica vazio:
    // a próxima tecla (keypad ou teclado físico) substitui em vez de concatenar.
    input.value = '';
    quantityInputIsSelected = true;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  if (value === 'back') {
    let v = currentRaw.slice(0, -1);
    if (v === '' || v === '0') {
      // Input ficaria vazio: deixar vazio e activar flag de substituição.
      // A próxima tecla no keypad ou no teclado físico vai substituir,
      // como acontece na expansão inicial do card.
      input.value = '';
      quantityInputIsSelected = true;
    } else {
      input.value = v;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  if (value === '.') return;

  if (!/^[0-9]$/.test(value)) return;
  if (value === '0' && (currentRaw === '' || currentRaw === '0')) return;

  // Detecta seleção real: flag da expansão/back OU seleção DOM real (mouse/Shift+setas).
  // Cobre todos os cenários: expansão do card, seleção por mouse, seleção por Shift+setas,
  // e o caso em que back esvaziou o input e activou a flag.
  const hasRealSelection = (typeof quantityInputIsSelected !== 'undefined' && quantityInputIsSelected) ||
    (input.selectionStart !== undefined && input.selectionStart !== input.selectionEnd);

  let newValue;
  if (hasRealSelection) {
    newValue = value;                // substitui o conteúdo seleccionado
    quantityInputIsSelected = false; // limpa a flag após usar
  } else {
    newValue = currentRaw + value;   // comportamento normal: concatena
  }
  const futureQty = parseInt(newValue, 10);
  if (isNaN(futureQty)) return;

  const product = typeof PRODUCTS !== 'undefined' && PRODUCTS && PRODUCTS.find(function (p) { return p.id === id; });
  if (product) {
    const isServico = product.ps && String(product.ps).toUpperCase() === 'S';
    const stockDisponivel = product.stock || 0;
    if (!isServico && futureQty > stockDisponivel) {
      if (typeof showCriticalAlert === 'function') {
        showCriticalAlert(product.name + ': Quantidade máxima disponível em stock é ' + stockDisponivel + '.', 3000);
      }
      return;
    }
  }

  input.value = newValue;
  input.dispatchEvent(new Event('input', { bubbles: true }));
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

  // ✅ Selecciona todo o conteúdo visualmente e activa a flag de substituição.
  // Comportamento idêntico ao input de quantidade quando o card expande:
  // a primeira tecla (física ou keypad) substitui em vez de concatenar.
  input.select();
  formatter.replaceOnNextInput = true;
  
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
  const rawPrice = formatter.getValue();

  // Se o utilizador submeteu 0 ou vazio, reverter para o preço original do produto.
  // O preço original é cartItem.product.price (o que veio da API quando o produto
  // entrou no carrinho), não cartItem.customPrice (que pode já ter sido editado antes).
  const cartItem = cart.get(id);
  const originalProductPrice = cartItem ? parseFloat(cartItem.product.price) : 0;
  const newPrice = (rawPrice > 0) ? rawPrice : originalProductPrice;

  console.log(`💾 [SUBMIT BLUR] Submitting price ${newPrice} for product ${productId} (raw: ${rawPrice})`);

  // Validate price
  if (newPrice > 0) {
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
    
    const rawPrice = formatter.getValue();

    // Se o utilizador submeteu 0 ou vazio, reverter para o preço original do produto.
    const cartItem = cart.get(parseInt(productId));
    const originalProductPrice = cartItem ? parseFloat(cartItem.product.price) : 0;
    const newPrice = (rawPrice > 0) ? rawPrice : originalProductPrice;

    if (newPrice > 0) {
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

// Expõe no global para os handlers inline (onfocus/onblur) no HTML gerado por cart.ui.js
window.startEditingQuantity = startEditingQuantity;
window.finishEditingQuantity = finishEditingQuantity;
window.handleQuantityKeypadKey = handleQuantityKeypadKey;

/**
 * Rastreia o input de quantidade ou preço focado para o teclado numérico da tela.
 * payment.ui.js usa window._keypadTargetInput para enviar teclas ao input correto.
 */
function initKeypadTargetTracking() {
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (el && el.id && (el.id.indexOf('qty-') === 0 || el.id.indexOf('price-') === 0)) {
      window._keypadTargetInput = el;
    }
  });
  document.addEventListener('focusout', function () {
    setTimeout(function () {
      var a = document.activeElement;
      // ✅ CORRECÇÃO: não apagar se o foco foi para outro input do carrinho (qty ou price).
      // Sem esta verificação, quando o foco passa do qty para o price input,
      // o setTimeout de 200ms apaga _keypadTargetInput porque o price input
      // não está dentro de .footer-keypad, tornando o keypad inoperante para preços.
      if (a && a.id && (a.id.startsWith('qty-') || a.id.startsWith('price-'))) {
        return; // foco está num input do carrinho — manter _keypadTargetInput
      }
      if (!a || !a.closest || !a.closest('.footer-keypad')) {
        window._keypadTargetInput = null;
      }
    }, 200);
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initKeypadTargetTracking);
} else {
  initKeypadTargetTracking();
}
