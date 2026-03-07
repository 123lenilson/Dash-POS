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
        var clone = panelBody.cloneNode(true);
        clone.className = 'panel-body-slider bottom-sheet-client-panel-body';
        sheetBody.appendChild(clone);

        clone.querySelectorAll('.client-card').forEach(function (card) {
          card.addEventListener('click', function () {
            var clientId = parseInt(card.dataset.clientId);
            if (typeof ClientModule !== 'undefined') ClientModule.selectClientById(clientId);
          });
        });

        var clonedSearch = clone.querySelector('#clientSearchInput');
        if (clonedSearch) {
          clonedSearch.id = 'clientSearchInput_sheet';
          clonedSearch.addEventListener('input', function (e) {
            var term = e.target.value;
            var allClients = (typeof ClientModule !== 'undefined') ? ClientModule.getAllClients() : [];
            var results = term.trim()
              ? ((typeof ClientModule !== 'undefined') ? ClientModule.filterClients(term) : [])
              : allClients;
            var listPanel = clone.querySelector('#clientListPanel');
            var listSec = clone.querySelector('#clientListSection');
            var formSec = clone.querySelector('#clientFormSection');
            var titleEl = clone.querySelector('#clientSearchTitle');
            if (!results.length && term.trim()) {
              if (listSec) listSec.style.display = 'none';
              if (formSec) formSec.style.display = 'block';
              if (titleEl) titleEl.textContent = 'NOME DO CLIENTE';
              return;
            }
            if (listSec) listSec.style.display = 'block';
            if (formSec) formSec.style.display = 'none';
            if (titleEl) titleEl.textContent = 'PROCURA POR CLIENTES AQUI';
            if (!listPanel) return;
            listPanel.innerHTML = results.slice(0, 6).map(function (c) {
              var esc = (typeof ClientModule !== 'undefined') ? ClientModule.escapeHtml : function (t) { return t; };
              return '<div class="client-card" data-client-id="' + c.idcliente + '">' +
                '<div class="client-card-content"><div class="client-card-name">' + esc(c.nome) + '</div>' +
                '<div class="client-card-details">' +
                '<span>Endereço: ' + esc(c.morada || 'N/A') + '</span> | ' +
                '<span>Telefone: ' + esc(c.telefone || 'N/A') + '</span> | ' +
                '<span>NIF: ' + esc(c.nif || 'N/A') + '</span>' +
                '</div></div></div>';
            }).join('');
            listPanel.querySelectorAll('.client-card').forEach(function (card) {
              card.addEventListener('click', function () {
                if (typeof ClientModule !== 'undefined') ClientModule.selectClientById(parseInt(card.dataset.clientId));
              });
            });
          });
        }

        var clonedForm = clone.querySelector('#newClientForm');
        if (clonedForm) {
          clonedForm.id = 'newClientForm_sheet';
          clonedForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var nameInput = clone.querySelector('#clientSearchInput_sheet') || clone.querySelector('[id^="clientSearchInput"]');
            var nifInput = clone.querySelector('#newClientNif');
            var phoneInput = clone.querySelector('#newClientPhone');
            var emailInput = clone.querySelector('#newClientEmail');
            var addressInput = clone.querySelector('#newClientAddress');
            var formData = {
              nome: nameInput ? nameInput.value.trim() : '',
              nif: nifInput ? nifInput.value.trim() : '',
              telefone: phoneInput ? phoneInput.value.trim() : '',
              email: emailInput ? emailInput.value.trim() : '',
              endereco: addressInput ? addressInput.value.trim() : ''
            };
            if (typeof ClientModule !== 'undefined') {
              var success = await ClientModule.saveNewClient(formData);
              if (success) {
                if (nameInput) nameInput.value = '';
                if (nifInput) nifInput.value = '';
                if (phoneInput) phoneInput.value = '';
                if (emailInput) emailInput.value = '';
                if (addressInput) addressInput.value = '';
                var listSec = clone.querySelector('#clientListSection');
                var formSec = clone.querySelector('#clientFormSection');
                if (listSec) listSec.style.display = 'block';
                if (formSec) formSec.style.display = 'none';
              }
            }
          });
        }
      }
    } else if (panelType === 'doctype') {
      sheetBody.innerHTML = '';
      var invoicePanel = document.querySelector('#docTypePanelSlider .invoice-type-options-panel');
      if (invoicePanel) {
        var docClone = invoicePanel.cloneNode(true);
        sheetBody.appendChild(docClone);

        // Handlers para selecção do tipo de factura
        docClone.querySelectorAll('.invoice-toggle-option').forEach(function (option) {
          option.addEventListener('click', function () {
            var invoiceType = this.getAttribute('data-invoice-type');
            if (!invoiceType) return;

            tipoDocumentoAtual = invoiceType;

            // Sincroniza painel original (radio + active)
            invoicePanel.querySelectorAll('.invoice-toggle-option').forEach(function (o) { o.classList.remove('active'); });
            var origOption = invoicePanel.querySelector('[data-invoice-type="' + invoiceType + '"]');
            if (origOption) {
              origOption.classList.add('active');
              var origRadio = origOption.querySelector('input[type="radio"]');
              if (origRadio) origRadio.checked = true;
            }

            // Actualiza visuais do clone
            docClone.querySelectorAll('.invoice-toggle-option').forEach(function (o) { o.classList.remove('active'); });
            this.classList.add('active');

            // Actualiza UI do dashboard
            if (typeof updateInvoiceTypeDisplay === 'function') updateInvoiceTypeDisplay(invoiceType);
            if (typeof window.updateOrderSummaryDescTabState === 'function') window.updateOrderSummaryDescTabState();
            if (typeof updateCartFooterLockIcons === 'function') updateCartFooterLockIcons(invoiceType);

            setTimeout(function () { closeBottomSheet(); }, 250);
          });
        });

        // Handlers para selecção de formato (A4 / 80mm)
        docClone.querySelectorAll('.format-toggle-option').forEach(function (option) {
          option.addEventListener('click', function (e) {
            e.stopPropagation();
            var format = this.getAttribute('data-format');
            if (!format) return;

            formatoFaturaAtual = format;

            // Sincroniza painel original
            invoicePanel.querySelectorAll('.format-toggle-option').forEach(function (o) { o.classList.remove('active'); });
            var origFormat = invoicePanel.querySelector('[data-format="' + format + '"]');
            if (origFormat) {
              origFormat.classList.add('active');
              var origRadio = origFormat.querySelector('input[type="radio"]');
              if (origRadio) origRadio.checked = true;
            }

            // Actualiza visuais do clone
            docClone.querySelectorAll('.format-toggle-option').forEach(function (o) { o.classList.remove('active'); });
            this.classList.add('active');

            if (typeof updateInvoiceTypeDisplay === 'function') updateInvoiceTypeDisplay(tipoDocumentoAtual);
          });
        });
      }
    } else if (panelType === 'cart') {
      // Restauração de segurança: elementos presos no sheetBody (transitionend falhou anteriormente)
      (function () {
        var _strandedHeader = sheetBody.querySelector('.cart-header');
        var _strandedArea = sheetBody.querySelector('#cartContentArea');
        var _strandedFooter = sheetBody.querySelector('.cart-footer');
        if (_strandedHeader || _strandedArea || _strandedFooter) {
          var _cp = document.getElementById('checkoutPanel');
          var _cbw = document.getElementById('cartBodyWrapper');
          var _cb = _cp ? _cp.querySelector('.cart-body') : null;
          if (_strandedHeader && _cp && _cb) _cp.insertBefore(_strandedHeader, _cb);
          if (_strandedArea && _cbw) _cbw.appendChild(_strandedArea);
          if (_strandedFooter && _cb) _cb.appendChild(_strandedFooter);
        }
      })();
      sheetBody.innerHTML = '';
      var checkoutPanel = document.getElementById('checkoutPanel');
      var cartHeader = checkoutPanel ? checkoutPanel.querySelector('.cart-header') : null;
      var cartBodyWrapper = document.getElementById('cartBodyWrapper');
      var cartContentArea = document.getElementById('cartContentArea');
      var cartFooter = checkoutPanel ? checkoutPanel.querySelector('.cart-footer') : null;
      if (cartHeader) sheetBody.appendChild(cartHeader);

      var docTypeNames = { 'factura-recibo': 'Factura-Recibo', 'factura-proforma': 'Factura Proforma', 'factura': 'Factura', 'orcamento': 'Orçamento' };
      var currentDocType = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
      var docTypeLabel = docTypeNames[currentDocType] || currentDocType || 'Factura';
      if (currentDocType === 'factura-recibo') {
        var fmt = (typeof formatoFaturaAtual !== 'undefined' && formatoFaturaAtual) ? formatoFaturaAtual : (document.querySelector('input[name="invoiceFormat"]:checked')?.value || 'A4');
        docTypeLabel = docTypeLabel + ' ' + (fmt === '80mm' ? '80mm' : 'A4');
      }
      var totalVal = (typeof currentCartTotal !== 'undefined' ? currentCartTotal : 0) || 0;
      var totalFormatted = (typeof currency !== 'undefined' && currency && typeof currency.format === 'function') ? currency.format(totalVal) : (totalVal.toFixed(2) + ' Kz');

      var tabBar = document.createElement('div');
      tabBar.className = 'cart-sheet-tabs';
      tabBar.setAttribute('role', 'tablist');
      tabBar.innerHTML =
        '<button type="button" class="cart-sheet-tab active" role="tab" aria-selected="true" data-cart-tab="fatura">' +
          '<span class="cart-sheet-tab-inner">' +
            '<span class="cart-sheet-tab-doc-label">' + docTypeLabel + '</span>' +
            '<span class="cart-sheet-tab-total">Total a pagar: <span id="cartSheetTabTotal">' + totalFormatted + '</span></span>' +
          '</span>' +
        '</button>' +
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

    var panelType = currentPanel;
    currentPanel = null;
    sheet.classList.add('closing');

    var _closeDone = false;
    var _fallbackTimer = null;

    function _doClose() {
      if (_closeDone) return;
      _closeDone = true;
      clearTimeout(_fallbackTimer);
      sheet.removeEventListener('transitionend', _onTransitionEnd);
      sheet.classList.remove('active', 'closing', 'slide-up', 'bottom-sheet--short');
      sheet.style.transform = '';
      sheet.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('active');
      document.body.style.overflow = '';

      // client + doctype: conteúdo são clones — destruídos pelo innerHTML = '' abaixo.
      if (panelType === 'cart') {
        var cartHeader = sheetBody.querySelector('.cart-header');
        var cartContentArea = sheetBody.querySelector('#cartContentArea');
        var cartFooterEl = sheetBody.querySelector('.cart-footer');
        var checkoutPanelEl = document.getElementById('checkoutPanel');
        var cartBodyWrapperEl = document.getElementById('cartBodyWrapper');
        var cartBodyEl = checkoutPanelEl ? checkoutPanelEl.querySelector('.cart-body') : null;
        if (cartHeader && checkoutPanelEl && cartBodyEl) checkoutPanelEl.insertBefore(cartHeader, cartBodyEl);
        if (cartContentArea && cartBodyWrapperEl) cartBodyWrapperEl.appendChild(cartContentArea);
        if (cartFooterEl && cartBodyEl) cartBodyEl.appendChild(cartFooterEl);
      }

      setTimeout(function () { sheetBody.innerHTML = ''; }, 50);
    }

    function _onTransitionEnd(e) {
      if (e.target !== sheet || e.propertyName !== 'transform') return;
      _doClose();
    }

    // Fallback: garante limpeza/restauração mesmo que transitionend não dispare
    _fallbackTimer = setTimeout(_doClose, 500);
    sheet.addEventListener('transitionend', _onTransitionEnd);
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

      // Fechar o bottom sheet quando um cliente for selecionado.
      // O listener é de uso único: remove-se a si próprio após disparar.
      function _onClientSelectedInSheet() {
        document.removeEventListener('clientSelected', _onClientSelectedInSheet);
        closeBottomSheet();
      }
      document.addEventListener('clientSelected', _onClientSelectedInSheet);

      // Garantir que os botões de fechar que vieram do painel desktop
      // também fechem o bottom sheet (em vez de apenas o painel slider).
      sheetBody.querySelectorAll(
        '.panel-close-slider, .client-panel-close-btn'
      ).forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          closeBottomSheet();
        });
      });
    }

    if (panelType === 'cart') {
      /* Conteúdo é o carrinho real (#cartContentArea) movido para o sheet; os cards já têm os handlers (removeCartProduct, toggleCardExpansion, etc.). */
      var backBtn = sheetBody.querySelector('.cart-sheet-back-btn');
      if (backBtn) {
        backBtn.onclick = function () {
          closeBottomSheet();
        };
      }
    }

    if (panelType === 'doctype') {
      /* Handlers já ligados ao clone em openBottomSheet — nada a fazer aqui. */
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

  /** Atualiza o total a pagar na primeira aba do bottom sheet (carrinho), quando o sheet está aberto. */
  function updateBottomSheetCartTabTotal() {
    var el = document.getElementById('cartSheetTabTotal');
    if (!el) return;
    var totalVal = (typeof currentCartTotal !== 'undefined' ? currentCartTotal : 0) || 0;
    var formatted = (typeof currency !== 'undefined' && currency && typeof currency.format === 'function') ? currency.format(totalVal) : (totalVal.toFixed(2) + ' Kz');
    el.textContent = formatted;
  }
  window.updateBottomSheetCartTabTotal = updateBottomSheetCartTabTotal;

  updateStickyCartBadge();
  window.updateStickyCartBadge = updateStickyCartBadge;
  if (typeof updateStickyDocTypeLabel === 'function') updateStickyDocTypeLabel();
  window.closeBottomSheet = closeBottomSheet;
  window.openBottomSheet = openBottomSheet;
}


