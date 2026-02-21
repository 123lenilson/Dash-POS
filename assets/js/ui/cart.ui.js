/* ================================================
   MÓDULO: Cart UI
   Ficheiro: assets/js/ui/cart.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= CART ======= */
function renderCart(resumoServidor = null) {
  const items = [...cart.values()];

  updateCartDisplay();

  if (items.length === 0) {
    if (cartEmptyState) cartEmptyState.style.display = 'flex';
    if (cartList) cartList.style.display = 'none';
    if (cartEmptyStateMobile) cartEmptyStateMobile.style.display = 'flex';
    if (cartListOverlay) cartListOverlay.style.display = 'none';
  } else {
    if (cartEmptyState) cartEmptyState.style.display = 'none';
    if (cartList) cartList.style.display = 'flex';
    if (cartEmptyStateMobile) cartEmptyStateMobile.style.display = 'none';
    if (cartListOverlay) cartListOverlay.style.display = 'flex';

    if (cartList) {
      cartList.innerHTML = items.map(({ product, qty, customPrice = product.price }) => {
        const line = customPrice * qty;
        const precoCustomizado = product.preco_customizado === "1" ? ' (Custom)' : '';
        return `
          <li class="cart-item" data-id="${product.id}">
            <div>
              <div class="title" style="cursor: pointer; padding: 2px 0;">${product.name}</div>
              <div class="meta">${currency.format(customPrice)}${precoCustomizado} × ${qty} = <strong>${currency.format(line)}</strong></div>
            </div>
            <div class="right">
              <button class="iconbtn" data-act="minus" aria-label="Diminuir">−</button>
              <div class="qty-display" style="min-width:24px; text-align:center; font-weight:700; cursor: pointer;">${qty}</div>
              <button class="iconbtn" data-act="plus" aria-label="Adicionar">+</button>
              <button class="iconbtn del" data-act="del" aria-label="Excluir">×</button>
            </div>
          </li>
        `;
      }).join('');
    }

    if (cartListOverlay) {
      cartListOverlay.innerHTML = items.map(({ product, qty, customPrice = product.price }) => {
        const line = customPrice * qty;
        const precoCustomizado = product.preco_customizado === "1" ? ' (Custom)' : '';
        return `
          <li class="cart-item" data-id="${product.id}">
            <div>
              <div class="title" style="cursor: pointer; padding: 2px 0;">${product.name}</div>
              <div class="meta">${currency.format(customPrice)}${precoCustomizado} × ${qty} = <strong>${currency.format(line)}</strong></div>
            </div>
            <div class="right">
              <button class="iconbtn" data-act="minus" aria-label="Diminuir">−</button>
              <div class="qty-display" style="min-width:24px; text-align:center; font-weight:700; cursor: pointer;">${qty}</div>
              <button class="iconbtn" data-act="plus" aria-label="Adicionar">+</button>
              <button class="iconbtn del" data-act="del" aria-label="Excluir">×</button>
            </div>
          </li>
        `;
      }).join('');
    }

    if (cartList) {
      cartList.querySelectorAll('.cart-item').forEach(row => {
        const id = +row.dataset.id;
        row.querySelector('[data-act="minus"]').addEventListener('click', () => addToCart(id, -1));
        row.querySelector('[data-act="plus"]').addEventListener('click', () => addToCart(id, +1));
        row.querySelector('[data-act="del"]').addEventListener('click', () => {
          const cartItem = cart.get(id);
          if (cartItem && cartItem.product) {
            showRemoveConfirmation(id, cartItem.product.name);
          } else {
            const productName = row.querySelector('.title')?.textContent || 'Item';
            showRemoveConfirmation(id, productName);
          }
        });
      });
    }

    if (cartListOverlay) {
      cartListOverlay.querySelectorAll('.cart-item').forEach(row => {
        const id = +row.dataset.id;
        row.querySelector('[data-act="minus"]').addEventListener('click', () => addToCart(id, -1));
        row.querySelector('[data-act="plus"]').addEventListener('click', () => addToCart(id, +1));
        row.querySelector('[data-act="del"]').addEventListener('click', () => {
          const cartItem = cart.get(id);
          if (cartItem && cartItem.product) {
            showRemoveConfirmation(id, cartItem.product.name);
          } else {
            const productName = row.querySelector('.title')?.textContent || 'Item';
            showRemoveConfirmation(id, productName);
          }
        });
      });
    }

    if (cartList) {
      cartList.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('.empty') || target.matches('.clear-all') || target.closest('.clear-all')) {
          showRemoveAllConfirmation();
        }
        if (target.closest('[data-act="checkout"]')) {
          checkout();
        }
      });
    }

    if (cartListOverlay) {
      cartListOverlay.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('.empty') || target.matches('.clear-all') || target.closest('.clear-all')) {
          showRemoveAllConfirmation();
        }
        if (target.closest('[data-act="checkout"]')) {
          checkout();
        }
      });
    }
  }

  let stats;
  let totalIliquido, totalImposto, totalRetencao, total;

  if (resumoServidor && resumoServidor.total_iliquido !== undefined) {
    console.log("✅ Usando resumo do BACKEND:", resumoServidor);
    stats = {
      items: resumoServidor.total_itens,
      subtotal: resumoServidor.total_iliquido
    };
    totalIliquido = resumoServidor.total_iliquido;
    totalImposto = resumoServidor.total_imposto;
    totalRetencao = resumoServidor.total_retencao;
    total = resumoServidor.total;
  } else {
    console.warn('⚠️ Resumo do backend não disponível - calculando localmente');
    let subtotal = 0;
    let itemCount = 0;
    cart.forEach((cartItem) => {
      const price = cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
      const qty = parseInt(cartItem.qty) || 0;
      subtotal += price * qty;
      itemCount += qty;
    });
    stats = { items: itemCount, subtotal: subtotal };
    totalIliquido = subtotal;
    totalImposto = 0;
    totalRetencao = 0;
    total = subtotal;
  }

  if (cartItemsCount) cartItemsCount.textContent = `${stats.items}`;
  if (cartSubtotal) cartSubtotal.textContent = currency.format(totalIliquido);
  if (cartDiscount) cartDiscount.textContent = currency.format(totalRetencao);
  if (cartTax) cartTax.textContent = currency.format(totalImposto);
  if (cartTotalBtn) cartTotalBtn.textContent = currency.format(total);

  if (cartItemsCountOverlay) cartItemsCountOverlay.textContent = `${stats.items}`;
  if (cartSubtotalOverlay) cartSubtotalOverlay.textContent = currency.format(totalIliquido);
  if (cartDiscountOverlay) cartDiscountOverlay.textContent = currency.format(totalRetencao);
  if (cartTaxOverlay) cartTaxOverlay.textContent = currency.format(totalImposto);
  if (cartTotalBtnOverlay) cartTotalBtnOverlay.textContent = currency.format(total);

  if (typeof window.updateStickyCartBadge === 'function') window.updateStickyCartBadge();

  updateOrderSummaryFooter(totalIliquido, totalImposto, totalRetencao, total);

  updateProductSelections();

  if (typeof scheduleRefreshPaymentMethodsOverflow === 'function') scheduleRefreshPaymentMethodsOverflow();
}

/* ======= GESTÃO DE CARDS DE PRODUTOS NO CARRINHO ======= */

function formatCurrencyInput(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "0,00 Kz";
  const formatted = num.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${formatted} Kz`;
}

function renderCartProductCard(productId, productData) {
  const { product, qty, customPrice } = productData;
  const price = customPrice !== null ? parseFloat(customPrice) : parseFloat(product.price);
  const total = price * qty;

  const card = document.createElement('div');
  card.className = 'cart-product-card';
  card.dataset.productId = productId;

  card.innerHTML = `
    <div class="card-summary" onclick="toggleCardExpansion('${productId}')">
      <i class="fa-solid fa-chevron-right expand-arrow"></i>
      <span class="product-quantity">${qty}</span>
      <span class="quantity-separator">×</span>
      <span class="product-name">${product.name}</span>
      <span class="product-total-price">${currency.format(total)}</span>
      <button class="btn-remove" onclick="event.stopPropagation(); removeCartProduct('${productId}')">
        ×
      </button>
    </div>
    <div class="card-expanded-area">
      <div class="inputs-grid">
        <div class="input-field">
          <label for="qty-${productId}">Quantidade:</label>
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            id="qty-${productId}"
            value="${qty}"
            onclick="event.stopPropagation(); quantityInputIsSelected = false;"
            onfocus="startEditingQuantity()"
            onblur="finishEditingQuantity('${productId}', this)"
            oninput="validateAndUpdateQuantity('${productId}', this)"
            onkeypress="return preventZero(event, this)"
            onkeydown="handleInputKeydown(event, '${productId}')"
          />
        </div>
        <div class="input-field">
          <label for="price-${productId}">Preço:</label>
          <input
            type="text"
            id="price-${productId}"
            data-formatter="price-${productId}"
            value="${formatCurrencyInput(price)}"
            readonly
            onclick="event.stopPropagation()"
            ondblclick="startEditingPrice('${productId}', this)"
            onkeydown="handlePriceKeydown(event, '${productId}', this)"
            onblur="handlePriceBlur('${productId}', this)"
          />
        </div>
      </div>
    </div>
  `;

  return card;
}

function updateCartDisplay() {
  const emptyState = document.getElementById('cartEmptyState');
  const productsContainer = document.getElementById('cartProductsContainer');

  if (!emptyState || !productsContainer) return;

  if (cart.size === 0) {
    emptyState.style.display = 'flex';
    productsContainer.style.display = 'none';
    productsContainer.innerHTML = '';
    lastExpandedProductId = null;
  } else {
    emptyState.style.display = 'none';
    productsContainer.style.display = 'flex';

    productsContainer.innerHTML = '';

    cart.forEach((productData, productId) => {
      const card = renderCartProductCard(productId, productData);
      productsContainer.appendChild(card);

      if (lastExpandedProductId !== null && productId === lastExpandedProductId) {
        setTimeout(() => {
          card.classList.add('expanded');
          const qtyInput = document.getElementById(`qty-${productId}`);
          if (qtyInput) {
            qtyInput.focus();
            qtyInput.select();
            quantityInputIsSelected = true;
          }
        }, 100);
      }
    });
  }

  if (typeof scheduleRefreshPaymentMethodsOverflow === 'function') scheduleRefreshPaymentMethodsOverflow();
}

function toggleCardExpansion(productId) {
  const numericId = parseInt(productId);

  isSwitchingCards = true;

  if (finishEditingTimeout) {
    clearTimeout(finishEditingTimeout);
    finishEditingTimeout = null;
  }

  if (pendingSync) {
    console.log('🔄 Sincronizando edição pendente (sem reload durante troca)');
    const cartItem = cart.get(pendingSync.id);
    if (cartItem) {
      cartItem.qty = pendingSync.qty;
    }
    setTimeout(() => {
      if (pendingSync) {
        syncToAPI(pendingSync.id, pendingSync.qty, null);
        pendingSync = null;
      }
    }, 200);
  }

  if (modoEdicao) {
    modoEdicao = false;
    console.log('✅ Modo de edição DESATIVADO (troca de card)');
  }

  const allCards = document.querySelectorAll('.cart-product-card');
  const clickedCard = document.querySelector(`[data-product-id="${productId}"]`);

  if (!clickedCard) {
    isSwitchingCards = false;
    return;
  }

  const wasExpanded = clickedCard.classList.contains('expanded');

  allCards.forEach(card => card.classList.remove('expanded'));

  if (!wasExpanded) {
    clickedCard.classList.add('expanded');
    lastExpandedProductId = numericId;

    setTimeout(() => {
      const qtyInput = document.getElementById(`qty-${productId}`);
      if (qtyInput) {
        qtyInput.focus();
        qtyInput.select();
        quantityInputIsSelected = true;
      }
    }, 100);
  } else {
    lastExpandedProductId = null;
    console.log('🔽 Card colapsado pelo usuário (Toggle)');
  }

  setTimeout(() => {
    isSwitchingCards = false;
    console.log('✅ Troca de card completa');
  }, 300);
}
