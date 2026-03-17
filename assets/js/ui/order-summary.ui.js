/* ================================================
   MÓDULO: Order Summary UI
   Ficheiro: assets/js/ui/order-summary.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= ORDER SUMMARY SLIDER ======= */
/**
 * Inicializa o slider do Order Summary (OBS toggle)
 */
function initOrderSummarySlider() {
  const slider = document.getElementById('orderSummarySlider');
  const obsToggleBtn = document.getElementById('obsToggleBtn');
  const obsBackBtn = document.getElementById('obsBackBtn');
  const obsSubmitBtn = document.getElementById('obsSubmitBtn');
  const orderObservation = document.getElementById('orderObservation');
  const innerSlider = document.getElementById('orderObsInnerSlider');
  const obsTabObservacao = document.getElementById('obsTabObservacao');
  const obsTabDesc = document.getElementById('obsTabDesc');

  if (!slider || !obsToggleBtn || !obsBackBtn) {
    console.warn('Order summary slider elements not found');
    return;
  }

  const orderDiscountInput = document.getElementById('orderDiscountInput');

  function setObsTab(panel) {
    if (!innerSlider || !obsTabObservacao || !obsTabDesc) return;
    const bodyWrapper = innerSlider.parentElement; // .order-obs-body-wrapper
    if (panel === 'desc') {
      const offsetPx = bodyWrapper.offsetWidth;
      innerSlider.style.transform = 'translateX(-' + offsetPx + 'px)';
      obsTabObservacao.classList.remove('active');
      obsTabObservacao.setAttribute('aria-selected', 'false');
      obsTabDesc.classList.add('active');
      obsTabDesc.setAttribute('aria-selected', 'true');
      setTimeout(function () {
        if (orderDiscountInput) orderDiscountInput.focus();
      }, 350);
    } else {
      innerSlider.style.transform = 'translateX(0px)';
      obsTabObservacao.classList.add('active');
      obsTabObservacao.setAttribute('aria-selected', 'true');
      obsTabDesc.classList.remove('active');
      obsTabDesc.setAttribute('aria-selected', 'false');
    }
  }

  /** Bloqueia a aba Desc. quando o tipo de documento é factura-proforma, factura ou orçamento.
   *  Cadeado só aparece quando a aba está bloqueada; com Factura-Recibo (A4 ou 80mm) o cadeado some. */
  function updateDescTabBlockState() {
    const tipo = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
    const blockDesc = tipo === 'factura-proforma' || tipo === 'factura' || tipo === 'orcamento';
    if (obsTabDesc) {
      obsTabDesc.classList.toggle('disabled', blockDesc);
      obsTabDesc.setAttribute('aria-disabled', blockDesc ? 'true' : 'false');
      // Cadeado: só inserir no DOM quando bloqueado; remover quando Factura-Recibo
      const lockEl = obsTabDesc.querySelector('.obs-tab-lock-icon');
      if (blockDesc) {
        if (!lockEl) {
          const icon = document.createElement('i');
          icon.className = 'fa-solid fa-lock obs-tab-lock-icon';
          icon.setAttribute('aria-hidden', 'true');
          icon.style.marginLeft = '4px';
          icon.style.fontSize = '10px';
          obsTabDesc.appendChild(icon);
        }
      } else {
        if (lockEl) lockEl.remove();
      }
    }
    if (blockDesc) setObsTab('obs');
  }

  if (obsTabObservacao) {
    obsTabObservacao.addEventListener('click', function () { setObsTab('obs'); });
  }
  if (obsTabDesc) {
    obsTabDesc.addEventListener('click', function () {
      if (obsTabDesc.classList.contains('disabled')) return;
      setObsTab('desc');
    });
  }

  window.updateOrderSummaryDescTabState = updateDescTabBlockState;
  updateDescTabBlockState();

  // Atualizar também o bottom sheet se estiver aberto quando o tipo de documento muda
  window.updateOrderSummaryDescTabStateWithSheet = function() {
    updateDescTabBlockState();
    if (typeof window.currentSheetOrdemContainer !== 'undefined' && window.currentSheetOrdemContainer) {
      updateDescTabBlockStateInSheetContainer(window.currentSheetOrdemContainer);
    }
  };

  // Toggle to OBS view (como em leia.txt); ao abrir, mostrar sempre a aba Observação
  obsToggleBtn.addEventListener('click', function () {
    setObsTab('obs');
    slider.classList.add('show-obs');
    setTimeout(function () {
      if (orderObservation) orderObservation.focus();
    }, 350);
  });

  // Back to Order Summary view
  obsBackBtn.addEventListener('click', function () {
    slider.classList.remove('show-obs');
  });

  /* Recalcular o transform do inner slider em resize APENAS se:
     1. O painel DESC está activo (transform != 0px)
     2. O contentor OBS está visível (slider tem classe show-obs)
     3. O layout está estável (usa requestAnimationFrame + debounce) */
  if (innerSlider && typeof ResizeObserver !== 'undefined') {
    const bodyWrapper = innerSlider.parentElement;
    let resizeTimeout;

    const recalculateTransform = function () {
      // Só recalcular se o painel DESC está visível E o contentor OBS está aberto
      if (!slider.classList.contains('show-obs')) return;
      if (!innerSlider.style.transform || innerSlider.style.transform === 'translateX(0px)') return;

      // requestAnimationFrame garante que o DOM foi completamente renderizado
      requestAnimationFrame(function () {
        const newOffsetPx = bodyWrapper.offsetWidth;
        if (newOffsetPx > 0) {
          innerSlider.style.transform = 'translateX(-' + newOffsetPx + 'px)';
        }
      });
    };

    const resizeObs = new ResizeObserver(function () {
      // Debounce: só recalcular 100ms após o último evento de resize
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(recalculateTransform, 100);
    });

    resizeObs.observe(bodyWrapper);
  }

  // Submit observation
  if (obsSubmitBtn) {
    obsSubmitBtn.addEventListener('click', function () {
      const observation = orderObservation ? orderObservation.value.trim() : '';
      window.orderObservation = observation;
      console.log('📝 Observação salva:', observation);
      obsSubmitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
      obsSubmitBtn.style.background = '#4caf50';
      setTimeout(function () {
        slider.classList.remove('show-obs');
        setTimeout(function () {
          obsSubmitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Confirmar';
          obsSubmitBtn.style.background = '';
        }, 400);
      }, 500);
    });
  }

  // Input de desconto com formatação monetária (como valor pago e preço do produto)
  if (orderDiscountInput && typeof MonetaryFormatter !== 'undefined') {
    window.orderDiscountFormatter = new MonetaryFormatter('orderDiscountInput', {
      locale: 'pt-AO',
      currency: 'Kz',
      decimals: 2,
      allowNegative: false,
      onValueChange: function (value) { window.orderDiscountValue = value; }
    });
    window.orderDiscountFormatter.enable();
    window.orderDiscountFormatter.setValue(0);
  }

  // Aplicar desconto (valor guardado para uso no cálculo)
  const orderDiscountApplyBtn = document.getElementById('orderDiscountApplyBtn');
  if (orderDiscountApplyBtn && orderDiscountInput) {
    orderDiscountApplyBtn.addEventListener('click', function () {
      const value = window.orderDiscountFormatter ? window.orderDiscountFormatter.getValue() : parseFloat((orderDiscountInput.value || '').replace(/\s/g, '').replace(',', '.')) || 0;
      window.orderDiscountValue = value;
      console.log('💰 Desconto aplicado:', value);
      if (typeof showAlert === 'function') {
        showAlert('info', 'Desconto', value ? 'Valor de desconto definido: ' + currency.format(value) : 'Introduza um valor.', 3000);
      }
    });
  }

  console.log('✅ Order Summary Slider initialized');
}

/**
 * Atualiza os valores do resumo do pedido no footer
 */
function updateOrderSummaryFooter(netTotal, taxTotal, retention, totalPagar) {
  const summaryNetTotal = document.getElementById('summaryNetTotal');
  const summaryTaxTotal = document.getElementById('summaryTaxTotal');
  const summaryRetention = document.getElementById('summaryRetention');
  const summaryTotalPagar = document.getElementById('summaryTotalPagar');

  if (summaryNetTotal) summaryNetTotal.textContent = currency.format(netTotal || 0);
  if (summaryTaxTotal) summaryTaxTotal.textContent = currency.format(taxTotal || 0);
  if (summaryRetention) summaryRetention.textContent = currency.format(retention || 0);
  if (summaryTotalPagar) summaryTotalPagar.textContent = currency.format(totalPagar || 0);

  // Atualiza o total atual do carrinho para os cards de pagamento
  currentCartTotal = totalPagar || 0;

  // Atualiza os valores exibidos nos cards de pagamento
  updateFooterPaymentCards();

  // Atualiza o total na aba do bottom sheet (carrinho), se estiver aberto
  if (typeof window.updateBottomSheetCartTabTotal === 'function') window.updateBottomSheetCartTabTotal();
}

/**
 * Retorna a observação do pedido
 */
/**
 * Retorna a observação do pedido
 * @returns {string} Observação (sempre string, vazia ou com conteúdo)
 */
function getOrderObservation() {
  // Garantir que sempre retorna string
  if (window.orderObservation && typeof window.orderObservation === 'string') {
    return window.orderObservation.trim();
  }
  return '';
}

/**
 * Atualiza estado de bloqueio da aba Desc dentro de um ordemContainer específico
 */
function updateDescTabBlockStateInSheetContainer(ordemContainer) {
  if (!ordemContainer) return;

  const obsTabDesc = ordemContainer.querySelector('.order-obs-tab:nth-child(2)');
  const innerSlider = ordemContainer.querySelector('.order-obs-inner-track');
  if (!obsTabDesc) return;

  const tipo = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
  const blockDesc = tipo === 'factura-proforma' || tipo === 'factura' || tipo === 'orcamento';
  obsTabDesc.classList.toggle('disabled', blockDesc);
  obsTabDesc.setAttribute('aria-disabled', blockDesc ? 'true' : 'false');
  
  // Cadeado: só inserir no DOM quando bloqueado; remover quando Factura-Recibo
  const lockEl = obsTabDesc.querySelector('.obs-tab-lock-icon');
  if (blockDesc) {
    if (!lockEl) {
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-lock obs-tab-lock-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.style.marginLeft = '4px';
      icon.style.fontSize = '10px';
      obsTabDesc.appendChild(icon);
    }
  } else {
    if (lockEl) lockEl.remove();
  }
  
  // Se DESC está bloqueado e está visível, voltar para OBS
  if (blockDesc && obsTabDesc.classList.contains('active') && innerSlider) {
    innerSlider.style.transform = 'translateX(0px)';
    obsTabDesc.classList.remove('active');
    obsTabDesc.setAttribute('aria-selected', 'false');
    const obsTabObservacao = ordemContainer.querySelector('.order-obs-tab:nth-child(1)');
    if (obsTabObservacao) {
      obsTabObservacao.classList.add('active');
      obsTabObservacao.setAttribute('aria-selected', 'true');
    }
  }
}

/**
 * Inicializa os listeners da área OBS|Desc dentro do Bottom Sheet (mobile)
 * Recebe o contentor raiz (ordemContainer) e liga todos os listeners aos elementos dentro dele
 */
function initOrderSummaryInSheet(ordemContainer) {
  if (!ordemContainer) {
    console.warn('Order summary sheet: container not provided');
    return;
  }

  // Tabs OBS | Desc
  const obsTabObservacao = ordemContainer.querySelector('.order-obs-tab:nth-child(1)');
  const obsTabDesc = ordemContainer.querySelector('.order-obs-tab:nth-child(2)');
  const innerSlider = ordemContainer.querySelector('.order-obs-inner-track');
  const textarea = ordemContainer.querySelector('.obs-textarea');
  const obsSubmitBtn = ordemContainer.querySelector('.obs-submit-btn');
  const discountInput = ordemContainer.querySelector('.order-desc-input');
  const discountApplyBtn = ordemContainer.querySelector('.order-desc-apply-btn');
  const bodyWrapper = innerSlider ? innerSlider.parentElement : null;

  if (!obsTabObservacao || !obsTabDesc || !innerSlider) {
    console.warn('Order summary sheet: required elements not found');
    return;
  }

  // Guardar referência global ao contentor atual do sheet para uso em updateOrderSummaryDescTabState
  window.currentSheetOrdemContainer = ordemContainer;

  function setObsTab(panel) {
    if (panel === 'desc') {
      const offsetPx = bodyWrapper.offsetWidth;
      innerSlider.style.transform = 'translateX(-' + offsetPx + 'px)';
      obsTabObservacao.classList.remove('active');
      obsTabObservacao.setAttribute('aria-selected', 'false');
      obsTabDesc.classList.add('active');
      obsTabDesc.setAttribute('aria-selected', 'true');
      if (discountInput) {
        setTimeout(function () {
          discountInput.focus();
        }, 350);
      }
    } else {
      innerSlider.style.transform = 'translateX(0px)';
      obsTabObservacao.classList.add('active');
      obsTabObservacao.setAttribute('aria-selected', 'true');
      obsTabDesc.classList.remove('active');
      obsTabDesc.setAttribute('aria-selected', 'false');
    }
  }

  // Atualizar estado de bloqueio da aba Desc (baseado no tipo de documento)
  updateDescTabBlockStateInSheetContainer(ordemContainer);

  // Tab Observação
  obsTabObservacao.addEventListener('click', function () {
    setObsTab('obs');
  });

  // Tab Desc
  obsTabDesc.addEventListener('click', function () {
    if (obsTabDesc.classList.contains('disabled')) return;
    setObsTab('desc');
  });

  // Submit observation
  if (obsSubmitBtn && textarea) {
    obsSubmitBtn.addEventListener('click', function () {
      const observation = textarea.value.trim();
      window.orderObservation = observation;
      console.log('📝 Observação salva (sheet):', observation);
      obsSubmitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
      obsSubmitBtn.style.background = '#4caf50';
      setTimeout(function () {
        obsSubmitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Confirmar';
        obsSubmitBtn.style.background = '';
      }, 1500);
    });
  }

  // Apply discount
  if (discountApplyBtn && discountInput) {
    discountApplyBtn.addEventListener('click', function () {
      const value = parseFloat((discountInput.value || '').replace(/\s/g, '').replace(',', '.')) || 0;
      window.orderDiscountValue = value;
      console.log('💰 Desconto aplicado (sheet):', value);
      if (typeof showAlert === 'function') {
        showAlert('info', 'Desconto', value ? 'Valor de desconto definido: ' + currency.format(value) : 'Introduza um valor.', 3000);
      }
    });
  }

  console.log('✅ Order Summary Sheet Listeners initialized');
}

// Expose functions globally
window.updateOrderSummaryFooter = updateOrderSummaryFooter;
window.getOrderObservation = getOrderObservation;
window.initOrderSummarySlider = initOrderSummarySlider;
window.initOrderSummaryInSheet = initOrderSummaryInSheet;
window.updateDescTabBlockStateInSheetContainer = updateDescTabBlockStateInSheetContainer;

