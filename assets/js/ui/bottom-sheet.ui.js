/* ================================================
   MÓDULO: Bottom Sheet UI
   Ficheiro: assets/js/ui/bottom-sheet.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/* ===== STICKY BOTTOM MENU + MODAL BOTTOM SHEET (≤905px) ===== */
function initBottomSheetSystem() {
  const stickyMenu = document.getElementById('stickyBottomMenu');
  const overlay = document.getElementById('bottomSheetOverlay');
  const sheet = document.getElementById('bottomSheet');
  const sheetTitle = document.getElementById('bottomSheetTitle');
  const sheetBody = document.getElementById('bottomSheetBody');
  const sheetClose = document.getElementById('bottomSheetClose');
  const sheetHandle = sheet ? sheet.querySelector('.bottom-sheet-handle') : null;
  const clientBtn = document.getElementById('stickyClientBtn');
  const cartBtn = document.getElementById('stickyCartBtn');
  const docTypeBtn = document.getElementById('stickyDocTypeBtn');
  const cartBadge = document.getElementById('stickyCartBadge');

  if (!sheet || !overlay || !clientBtn || !cartBtn || !docTypeBtn) {
    console.warn('Bottom sheet elements not found');
    return;
  }

  let currentPanel = null;
  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  function openBottomSheet(title, contentHTML, panelType) {
    currentPanel = panelType;
    if (sheetTitle) sheetTitle.textContent = title;
    if (panelType === 'client') {
      sheetBody.innerHTML = '';
      var panelBody = document.querySelector('#clientePanelSlider .panel-body-slider');
      if (panelBody) {
        while (panelBody.firstChild) {
          sheetBody.appendChild(panelBody.firstChild);
        }
      }
    } else if (panelType === 'doctype') {
      sheetBody.innerHTML = '';
      var docPanel = document.querySelector('#docTypePanelSlider .invoice-type-options-panel');
      if (docPanel) {
        while (docPanel.firstChild) {
          sheetBody.appendChild(docPanel.firstChild);
        }
      }
      var docHeader = document.createElement('div');
      docHeader.className = 'bottom-sheet-doc-type-header';
      docHeader.innerHTML = '<span class="bottom-sheet-doc-type-title">Tipo de Factura</span>' +
        '<button type="button" class="bottom-sheet-close-btn-doc" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>';
      sheetBody.insertBefore(docHeader, sheetBody.firstChild);
      var docCloseBtn = docHeader.querySelector('.bottom-sheet-close-btn-doc');
      if (docCloseBtn) docCloseBtn.addEventListener('click', closeBottomSheet);
    } else if (panelType === 'cart') {
      sheetBody.innerHTML = '';
      var checkoutPanel = document.getElementById('checkoutPanel');
      var cartHeader = checkoutPanel ? checkoutPanel.querySelector('.cart-header') : null;
      var cartBodyWrapper = document.getElementById('cartBodyWrapper');
      var cartContentArea = document.getElementById('cartContentArea');
      var cartFooter = checkoutPanel ? checkoutPanel.querySelector('.cart-footer') : null;
      if (cartHeader) sheetBody.appendChild(cartHeader);

      var docTypeNames = { 'fatura-recibo': 'Fatura-Recibo', 'fatura-proforma': 'Fatura Proforma', 'fatura': 'Fatura', 'orcamento': 'Orçamento' };
      var currentDocType = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
      var docTypeLabel = docTypeNames[currentDocType] || currentDocType || 'Factura';

      var tabBar = document.createElement('div');
      tabBar.className = 'cart-sheet-tabs';
      tabBar.setAttribute('role', 'tablist');
      tabBar.innerHTML = '<button type="button" class="cart-sheet-tab active" role="tab" aria-selected="true" data-cart-tab="fatura">' + docTypeLabel + '</button>' +
        '<button type="button" class="cart-sheet-tab" role="tab" aria-selected="false" data-cart-tab="ordem">Ordem de Venda</button>';
      sheetBody.appendChild(tabBar);

      var tabPanel = document.createElement('div');
      tabPanel.className = 'cart-sheet-tab-panel cart-sheet-tab-panel-fatura';
      if (cartContentArea) tabPanel.appendChild(cartContentArea);
      if (cartFooter) tabPanel.appendChild(cartFooter);
      sheetBody.appendChild(tabPanel);

      var ordemPanel = document.createElement('div');
      ordemPanel.className = 'cart-sheet-tab-panel cart-sheet-tab-panel-ordem';
      ordemPanel.setAttribute('hidden', '');
      ordemPanel.innerHTML = '<div class="cart-sheet-ordem-placeholder">Ordem de Venda (em breve)</div>';
      sheetBody.appendChild(ordemPanel);

      tabBar.querySelectorAll('.cart-sheet-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var tab = this.getAttribute('data-cart-tab');
          tabBar.querySelectorAll('.cart-sheet-tab').forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
          this.classList.add('active');
          this.setAttribute('aria-selected', 'true');
          sheetBody.querySelectorAll('.cart-sheet-tab-panel').forEach(function (p) { p.setAttribute('hidden', ''); });
          var target = sheetBody.querySelector('.cart-sheet-tab-panel-' + tab);
          if (target) { target.removeAttribute('hidden'); }
        });
      });

    } else {
      sheetBody.innerHTML = contentHTML;
    }
    if (panelType === 'doctype') {
      sheet.classList.add('bottom-sheet--short');
    } else {
      sheet.classList.remove('bottom-sheet--short');
    }
    document.body.style.overflow = 'hidden';
    overlay.classList.add('active');
    sheet.classList.remove('closing', 'slide-up');
    sheet.classList.add('active');
    sheet.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        sheet.classList.add('slide-up');
      });
    });
    initPanelContent(panelType);
  }

  function closeBottomSheet() {
    if (!sheet.classList.contains('active')) return;

    sheet.classList.add('closing');
    var panelType = currentPanel;

    function onTransitionEnd(e) {
      if (e.target !== sheet || e.propertyName !== 'transform') return;
      sheet.removeEventListener('transitionend', onTransitionEnd);
      sheet.classList.remove('active', 'closing', 'slide-up', 'bottom-sheet--short');
      sheet.style.transform = '';
      sheet.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      currentPanel = null;

      if (panelType === 'client') {
        var panelBody = document.querySelector('#clientePanelSlider .panel-body-slider');
        if (panelBody) {
          while (sheetBody.firstChild) {
            panelBody.appendChild(sheetBody.firstChild);
          }
        }
      }
      if (panelType === 'doctype') {
        var docHeaderEl = sheetBody.querySelector('.bottom-sheet-doc-type-header');
        if (docHeaderEl) docHeaderEl.remove();
        var docPanel = document.querySelector('#docTypePanelSlider .invoice-type-options-panel');
        if (docPanel) {
          while (sheetBody.firstChild) {
            docPanel.appendChild(sheetBody.firstChild);
          }
        }
      }
      if (panelType === 'cart') {
        var cartHeader = sheetBody.querySelector('.cart-header');
        var tabPanel = sheetBody.querySelector('.cart-sheet-tab-panel-fatura');
        var cartContentArea = sheetBody.querySelector('#cartContentArea');
        var cartFooterEl = sheetBody.querySelector('.cart-footer');
        var checkoutPanel = document.getElementById('checkoutPanel');
        var cartBodyWrapper = document.getElementById('cartBodyWrapper');
        var cartBody = checkoutPanel ? checkoutPanel.querySelector('.cart-body') : null;
        if (cartHeader && checkoutPanel && cartBody) checkoutPanel.insertBefore(cartHeader, cartBody);
        if (cartContentArea && cartBodyWrapper) cartBodyWrapper.appendChild(cartContentArea);
        if (cartFooterEl && checkoutPanel) checkoutPanel.appendChild(cartFooterEl);
      }
      setTimeout(function () {
        sheetBody.innerHTML = '';
      }, 50);
    }

    sheet.addEventListener('transitionend', onTransitionEnd);
  }

  function getClientPanelContent() {
    return ''; /* Conteúdo real é o painel desktop movido para o sheet em openBottomSheet */
  }

  function getCartPanelContent() {
    const items = [];
    cart.forEach(function (cartItem, productId) {
      const price = cartItem.customPrice != null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
      items.push({
        id: productId,
        name: cartItem.product.name || cartItem.product.descricao || 'Item',
        price: price,
        quantity: cartItem.qty
      });
    });

    if (items.length === 0) {
      return '<div class="empty-cart">' +
        '<i class="fa-solid fa-cart-shopping"></i>' +
        '<p>Carrinho vazio</p>' +
        '<span>Adicione produtos para começar</span>' +
        '</div>';
    }

    const itemsHTML = items.map(function (item, index) {
      return '<div class="cart-item" data-id="' + item.id + '">' +
        '<div class="cart-item-info">' +
        '<span class="cart-item-name">' + (item.name || 'Item') + '</span>' +
        '<span class="cart-item-price">' + currency.format(item.price) + '</span>' +
        '</div>' +
        '<div class="cart-item-qty">' +
        '<button class="qty-btn" data-action="decrease" data-id="' + item.id + '">-</button>' +
        '<span class="qty-value">' + item.quantity + '</span>' +
        '<button class="qty-btn" data-action="increase" data-id="' + item.id + '">+</button>' +
        '</div>' +
        '<button class="cart-item-remove" data-id="' + item.id + '">' +
        '<i class="fa-solid fa-trash"></i>' +
        '</button>' +
        '</div>';
    }).join('');

    let total = 0;
    items.forEach(function (item) {
      total += item.price * item.quantity;
    });

    return '<div class="cart-panel-content">' +
      '<div class="cart-items-list">' + itemsHTML + '</div>' +
      '<div class="cart-total">' +
      '<span>Total:</span>' +
      '<span class="cart-total-value">' + currency.format(total) + '</span>' +
      '</div>' +
      '</div>';
  }

  function getDocTypePanelContent() {
    return ''; /* Limpo por agora; conteúdo será o painel desktop (como no Cliente) */
  }

  function initPanelContent(panelType) {
    if (panelType === 'client') {
      /* Conteúdo é o painel desktop movido para o sheet; ClientManager já está ligado aos mesmos elementos. */
    }

    if (panelType === 'cart') {
      /* Conteúdo é o carrinho real (#cartContentArea) movido para o sheet; os cards já têm os handlers (removeCartProduct, toggleCardExpansion, etc.). */
    }

    if (panelType === 'doctype') {
      /* Conteúdo será o painel desktop movido para o sheet (a implementar). */
      if (sheetBody.querySelectorAll('.doc-type-item').length) {
        sheetBody.querySelectorAll('.doc-type-item').forEach(function (item) {
          item.addEventListener('click', function () {
            const docType = this.getAttribute('data-doc-type');
            tipoDocumentoAtual = docType;
            if (typeof updateInvoiceTypeDisplay === 'function') updateInvoiceTypeDisplay(docType);
            if (typeof window.updateOrderSummaryDescTabState === 'function') window.updateOrderSummaryDescTabState();
            if (typeof updateCartFooterLockIcons === 'function') updateCartFooterLockIcons(docType);
            sheetBody.querySelectorAll('.doc-type-item').forEach(function (i) { i.classList.remove('active'); });
            this.classList.add('active');
            setTimeout(function () {
              if (typeof closeBottomSheet === 'function') closeBottomSheet();
            }, 300);
          });
        });
      }
    }
  }

  function updateStickyCartBadge() {
    if (!cartBadge) return;
    let total = 0;
    cart.forEach(function (item) {
      total += (item.qty || 0);
    });
    cartBadge.textContent = total;
    cartBadge.style.display = total > 0 ? 'flex' : 'none';
  }

  clientBtn.addEventListener('click', function () {
    openBottomSheet('Selecionar Cliente', getClientPanelContent(), 'client');
  });
  cartBtn.addEventListener('click', function () {
    openBottomSheet('Carrinho', '', 'cart');
  });
  docTypeBtn.addEventListener('click', function () {
    openBottomSheet('Tipo de Factura', getDocTypePanelContent(), 'doctype');
  });

  overlay.addEventListener('click', closeBottomSheet);
  if (sheetClose) sheetClose.addEventListener('click', closeBottomSheet);

  if (sheetHandle) {
    sheetHandle.addEventListener('touchstart', function (e) {
      isDragging = true;
      startY = e.touches[0].clientY;
      sheet.style.transition = 'none';
    });
    sheetHandle.addEventListener('touchmove', function (e) {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      var deltaY = currentY - startY;
      if (deltaY > 0) sheet.style.transform = 'translateY(' + deltaY + 'px)';
    });
    sheetHandle.addEventListener('touchend', function () {
      if (!isDragging) return;
      isDragging = false;
      sheet.style.transition = '';
      var deltaY = currentY - startY;
      if (deltaY > 100) closeBottomSheet();
      else sheet.style.transform = 'translateY(0)';
    });
  }

  updateStickyCartBadge();
  window.updateStickyCartBadge = updateStickyCartBadge;
  if (typeof updateStickyDocTypeLabel === 'function') updateStickyDocTypeLabel();
  window.closeBottomSheet = closeBottomSheet;
  window.openBottomSheet = openBottomSheet;
}


