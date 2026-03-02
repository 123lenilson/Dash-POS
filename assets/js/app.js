/* ================================================
   MÓDULO: App (Orquestrador)
   Ficheiro: assets/js/app.js
   Parte do sistema Dash-POS
   ================================================ */

clearCartBtn?.addEventListener('click', () => clearCart());

/* ======= MAIN MENU (nav) ======= */
document.querySelectorAll('.main .main-nav .nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.main .main-nav .nav-link').forEach(x => x.classList.remove('is-active'));
    btn.classList.add('is-active');
  });
});

/* ======= DATETIME & RESPONSIVE ======= */
function updateDateTime() {
  const dt = document.getElementById('dateTime');
  if (dt) dt.textContent = nowFancy();
}

function updateResponsiveUI() {
  var cartDrawerView = window.matchMedia && window.matchMedia('(max-width: 905px)').matches;
  if (cartDrawerView) {
    document.querySelector('.side') && (document.querySelector('.side').style.display = 'none');
  } else {
    document.querySelector('.side') && (document.querySelector('.side').style.display = '');
  }

  if (window.matchMedia && window.matchMedia('(max-width:890px)').matches) {
    const mainNav = document.querySelector('.main .main-nav');
    if (mainNav) mainNav.style.display = '';
  }

  var headerSearchSlot = document.getElementById('headerSearchSlot');
  var searchBarInner = document.getElementById('searchBarInner');
  var searchBarContainer = document.querySelector('.search-bar-container');
  if (headerSearchSlot && searchBarInner && searchBarContainer) {
    if (cartDrawerView) {
      if (searchBarInner.parentElement !== headerSearchSlot) {
        headerSearchSlot.appendChild(searchBarInner);
        headerSearchSlot.setAttribute('aria-hidden', 'false');
        var wrapper = searchBarInner.querySelector('.search-wrapper');
        if (wrapper) wrapper.classList.add('search-wrapper--collapsed');
      }
    } else {
      if (searchBarInner.parentElement !== searchBarContainer) {
        searchBarContainer.insertBefore(searchBarInner, searchBarContainer.firstChild);
        headerSearchSlot.setAttribute('aria-hidden', 'true');
        var w = searchBarInner.querySelector('.search-wrapper');
        if (w) w.classList.remove('search-wrapper--collapsed', 'search-wrapper--expanded');
      }
    }
  }
}

/* ======= INIT ======= */
function init() {
  carregarClientePadrao()
    .then(() => {
      console.log('✅ App inicializado com cliente padrão');
      if (typeof window.handleClientSelection === 'function') {
        window.handleClientSelection(
          idClientePadrao,
          nomeClientePadrao || 'Consumidor Final',
          { id: idClientePadrao, nome: nomeClientePadrao || 'Consumidor Final' }
        );
      }
      carregarProdutos();
      loadCartFromAPI();
      updateDateTime();
      setInterval(updateDateTime, 30000);
      updateResponsiveUI();
      window.addEventListener('resize', updateResponsiveUI);
      initSSE();
      initInvoiceFormat();
      initPayButton();
      console.log('✅ [INIT] Todas as inicializações concluídas');
    })
    .catch(error => {
      console.error('❌ Falha crítica na inicialização:', error);
      if (typeof skeletonMarkProductsReady === 'function') skeletonMarkProductsReady();
      if (typeof skeletonMarkCartReady === 'function') skeletonMarkCartReady();
      if (typeof showCriticalAlert === 'function') {
        showCriticalAlert(
          'FALHA NA INICIALIZAÇÃO: Impossível carregar dados essenciais. ' +
          'Recarregue a página ou entre em contato com o suporte.',
          0
        );
      }
    });
}
init();

/* ======= SSE ======= */
function initSSE() {
  if (sseConnection) {
    console.log('⚠️ SSE: Fechando conexão anterior');
    sseConnection.close();
    sseConnection = null;
  }

  console.log('🔗 SSE: Iniciando conexão com api/stream.php');

  try {
    sseConnection = new EventSource(window.location.origin + "/Dash-POS/api/stream.php");

    sseConnection.addEventListener('connected', (e) => {
      const data = JSON.parse(e.data);
      console.log('✅ SSE: Conectado!', data);
      sseReconnectAttempts = 0;
    });

    sseConnection.addEventListener('produtos_updated', (e) => {
      const data = JSON.parse(e.data);
      console.log('📦 SSE: Produtos atualizados', data);
      if (!modoEdicao && !estaPesquisando) {
        carregarProdutos();
      }
    });

    sseConnection.addEventListener('pedido_updated', (e) => {
      const data = JSON.parse(e.data);
      console.log('🛍️ SSE: Carrinho atualizado', data);
      if (!modoEdicao) {
        loadCartFromAPI();
      }
    });

    sseConnection.addEventListener('heartbeat', (e) => {
      const data = JSON.parse(e.data);
      console.log('💓 SSE: Heartbeat', data.timestamp);
    });

    sseConnection.onerror = (error) => {
      console.error('❌ SSE: Erro na conexão', error);
      sseConnection.close();
      sseConnection = null;
      if (sseReconnectAttempts < SSE_MAX_RECONNECT_ATTEMPTS) {
        sseReconnectAttempts++;
        setTimeout(() => initSSE(), SSE_RECONNECT_DELAY);
      }
    };

    sseConnection.onopen = () => {
      console.log('✅ SSE: Conexão aberta e pronta');
    };
  } catch (error) {
    console.error('❌ SSE: Erro ao inicializar', error);
  }
}

function closeSSE() {
  if (sseConnection) {
    sseConnection.close();
    sseConnection = null;
  }
}
window.addEventListener('beforeunload', closeSSE);

/* ===== Menu responsivo ===== */
(function setupResponsiveMenu() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mainHeader = document.querySelector('.main-header');
  const mainNav = document.querySelector('.main .main-nav');

  if (!mobileBtn || !mainHeader || !mainNav) return;

  function setOpenState(open) {
    if (open) {
      mainHeader.classList.add('nav-open');
      mobileBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    } else {
      mainHeader.classList.remove('nav-open');
      mobileBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  mobileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = mainHeader.classList.contains('nav-open');
    setOpenState(!isOpen);
  });

  document.querySelectorAll('.main .main-nav .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.matchMedia && window.matchMedia('(max-width:890px)').matches) {
        setOpenState(false);
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!mainHeader.classList.contains('nav-open')) return;
    if (!mainHeader.contains(e.target) && e.target !== mobileBtn) {
      setOpenState(false);
    }
  });

  window.addEventListener('resize', () => {
    if (!(window.matchMedia && window.matchMedia('(max-width:890px)').matches)) {
      setOpenState(false);
    }
  });
})();

/* ======= DOMContentLoaded: fullNameInput + clientSelected ======= */
document.addEventListener('DOMContentLoaded', () => {
  const fullNameInput = document.getElementById('checkoutFullName');
  if (fullNameInput && window.getClientManager) {
    fullNameInput.addEventListener('input', debounce((e) => {
      const clientManager = window.getClientManager();
      if (clientManager) {
        clientManager.searchByName(e.target.value);
      }
    }, 300));
  }
});

document.addEventListener('clientSelected', (e) => {
  console.log('Cliente selecionado:', e.detail.client);
});

/* ======= Wrapper renderCart + cartChanged ======= */
const _originalRenderCart = renderCart;
renderCart = function (...args) {
  _originalRenderCart.apply(this, args);
  if (typeof syncCheckoutCart === 'function') {
    syncCheckoutCart();
  }
};

function notifyCartChange() {
  const event = new CustomEvent('cartChanged', {
    detail: { items: cart.size }
  });
  document.dispatchEvent(event);
}

document.addEventListener('cartChanged', function (e) {
  console.log('🔔 [CART] Carrinho mudou:', e.detail.items, 'itens');
  if (typeof syncCheckoutCart === 'function') {
    syncCheckoutCart();
  }
});

/* ======= DOMContentLoaded: footer + bottom sheet + painel clientes ======= */
document.addEventListener('DOMContentLoaded', function () {
  if (typeof initClientPanel === 'function') initClientPanel();
  loadFooterPaymentMethods();
  initOrderSummarySlider();
  /* initFooterKeypad() já é chamado em payment.ui.js (DOMContentLoaded) — evitar duplo registo de listeners */
  if (typeof initBottomSheetSystem === 'function') initBottomSheetSystem();
});

/* ======= Bridge clientes.js -> UI ======= */
window.handleClientSelection = function (id, nome, dados) {
  const topSelectedClient = document.getElementById('topSelectedClient');
  if (topSelectedClient) topSelectedClient.textContent = nome;
  const stickyClientLabel = document.getElementById('stickyClientLabel');
  if (stickyClientLabel) stickyClientLabel.textContent = nome;
};

/* ======= Checkout (botão no carrinho: abre bottom sheet do carrinho) ======= */
window.checkout = function () {
  if (typeof openBottomSheet === 'function') {
    openBottomSheet('Carrinho', '', 'cart');
  }
};
