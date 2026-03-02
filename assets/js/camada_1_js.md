# Camada 1 — CSS (raiz, base, layout)

Este documento consolida todo o código JS da **raiz** de `assets/js/`, da pasta **mudules/**, **service/** e  **utils/**.

---

<!-- ========== INÍCIO: app.js ========== -->

## app.js (raiz)

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
    sseConnection = new EventSource('http://localhost/Dash-POS/api/stream.php');

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
/* Bottom sheet: implementação (doctype clone, cart safety restore, closeBottomSheet fallback) em assets/js/ui/bottom-sheet.ui.js — ver camada_2_js.md */
window.checkout = function () {
  if (typeof openBottomSheet === 'function') {
    openBottomSheet('Carrinho', '', 'cart');
  }
};


/* ================================================
   FIM do App (Orquestrador)

   ================================================ */

/* ================================================
   MÓDULO: DOM (Referências aos elementos)
   Ficheiro: assets/js/dom.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= DOM ======= */
const dateTimeEl = document.getElementById('dateTime');
const categoryBar = document.getElementById('categoryBar');
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');

const cartList = document.getElementById('cartList');
const cartItemsCount = document.getElementById('cartItemsCount');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartDiscount = document.getElementById('cartDiscount');
const cartTax = document.getElementById('cartTax');
const cartTotalBtn = document.getElementById('cartTotalBtn');
const cartEmptyState = document.getElementById('cartEmptyState');

const cartListOverlay = document.getElementById('cartListOverlay');
const cartItemsCountOverlay = document.getElementById('cartItemsCountOverlay');
const cartSubtotalOverlay = document.getElementById('cartSubtotalOverlay');
const cartDiscountOverlay = document.getElementById('cartDiscountOverlay');
const cartTaxOverlay = document.getElementById('cartTaxOverlay');
const cartTotalBtnOverlay = document.getElementById('cartTotalBtnOverlay');
const cartEmptyStateMobile = document.getElementById('cartEmptyStateMobile');

const clearCartBtn = document.getElementById('clearCart');



   /* ================================================
   FIM do Dom (Referências aos elementos)

   ================================================ */


/* ================================================
   MÓDULO: State (Estado Global)
   Ficheiro: assets/js/state.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= DADOS ======= */
let PRODUCTS = [];

// ✅ REMOVIDO: TAX_RATE e DISCOUNT
// Todos os cálculos vêm do backend via loadCartFromAPI()
const currency = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 2 });

/* ======= ESTADO DE UI ======= */
let activeCategory = "Todos Produtos";
let searchTerm = "";
let modoEdicao = false;       // mantém do seu fluxo
let estaPesquisando = false;  // mantém do seu fluxo
let searchResults = [];  // Novo: Armazena resultados da busca do servidor

/* ======= CARRINHO ======= */
const cart = new Map();       // id -> {product, qty, customPrice}
let lastCartHash = null;  // Pra otimizar: só atualiza se mudou
let lastExpandedProductId = null; // Rastreia o último produto que ficou expansivo

/* ======= ESTADO: Controlo de edição inline dos cards do carrinho ======= */
let isSwitchingCards = false;        // Impede reload do carrinho durante troca de card expandido
let isPriceEditCancelled = false;    // Flag para cancelamento de edição de preço via ESC
let quantityInputIsSelected = false; // Controla se o texto do input de qtd está seleccionado

/* ======= PAGAMENTO ======= */
let currentCartTotal = 0;  // Total atual do carrinho (usado pelos cards de pagamento)
let selectedPaymentMethod = null;  // Método de pagamento atualmente selecionado
let footerPaymentMethods = [];  // Array de métodos de pagamento carregados
let footerValoresPorMetodo = {};  // Valores por método de pagamento
let footerCashAmount = '0';  // Valor digitado no input do footer

/* ======= SSE ======= */
let sseConnection = null;
let sseReconnectAttempts = 0;
const SSE_MAX_RECONNECT_ATTEMPTS = 5;
const SSE_RECONNECT_DELAY = 3000; // 3 segundos

/* ======= TIPO/FORMATO DE DOCUMENTO ======= */
const tiposDesenvolvidos = ['factura-recibo', 'factura-proforma', 'factura', 'orcamento']; // Tipos já implementados
let tipoDocumentoAtual = 'factura-recibo'; // Tipo padrão
let formatoFaturaAtual = 'A4'; // Formato padrão

/* ======= INVOICE ASSETS ======= */
const invoiceAssetsState = {
  css: {
    a4: false,      // fatura.css
    mm80: false     // fatura80.css
  }
};

/* ======= CLIENTE ======= */
let idClientePadrao = null; // Será preenchido via API
let nomeClientePadrao = null; // Será preenchido via API

/* ======= CART EDITING ======= */
let lastCategoriesKey = null; /* guarda a key das categorias para evitar rebuild desnecessário */
let finishEditingTimeout = null;
let pendingSync = null; // Armazena dados de sincronização pendente



      /* ================================================
   FIM do State (Estado Global)

   ================================================ */

/* ================================================
   MÓDULO: Utils (Utilitários puros)
   Ficheiro: assets/js/utils.js
   Parte do sistema Dash-POS
   ================================================ */

/**
 * Connects any input to monetary formatting
 * @param {string} inputId - Input ID
 * @param {object} options - Formatting options
 * @returns {MonetaryFormatter} Formatter instance
 */
function connectMonetaryInput(inputId, options = {}) {
  const formatter = new MonetaryFormatter(inputId, options);
  window[`formatter_${inputId}`] = formatter;
  return formatter;
}

/* ======= UTIL: DEBOUNCE ======= */
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

/* ======= UTIL ======= */
function nowFancy() {
  const d = new Date();
  return d.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) +
    " • " + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}
function placeholderIMG(name) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const hue = (name.length * 37) % 360;
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='hsl(${hue},74%,92%)' />
      <stop offset='100%' stop-color='hsl(${(hue + 40) % 360},74%,85%)' />
    </linearGradient></defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, -apple-system, Segoe UI, Roboto' font-weight='700' font-size='64' fill='hsl(${hue},35%,28%)'>${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function isMobileView() {
  return window.matchMedia && window.matchMedia('(max-width:905px)').matches;
}


      /* ================================================
   FIM do Utils (Utilitários puros)

   ================================================ */


/* ================================================
   MÓDULO: Barcode Module
   Ficheiro: assets/js/modules/barcode.module.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= BARCODE SCANNER SYSTEM ======= */

// Configurações do scanner
const BARCODE_CONFIG = {
  minLength: 8,           // Tamanho mínimo do código
  maxLength: 20,          // Tamanho máximo do código
  timeout: 100,           // Tempo máximo entre caracteres (ms)
  enterKey: true,         // Leitor envia Enter ao final?
  prefixChars: [],        // Caracteres de prefixo (ex: ['*'])
  suffixChars: ['\n', '\r', 'Enter'] // Caracteres de sufixo
};

// Estado do scanner
let barcodeBuffer = '';
let barcodeTimeout = null;
let isProcessingBarcode = false;
let lastBarcodeTime = 0;

// Elementos DOM
const barcodeInput = document.getElementById('barcodeInput');
const barcodeStatus = document.getElementById('barcodeStatus');
const barcodeLastScan = document.getElementById('barcodeLastScan');

// Estatísticas (opcional)
const barcodeStats = {
  total: 0,
  success: 0,
  errors: 0,
  history: []
};

/**
 * Sistema de detecção de código de barras
 * Captura sequências rápidas de teclas que simulam leitura de scanner
 */
document.addEventListener('keydown', (e) => {
  // Ignora se estiver digitando em outro input/textarea (exceto barcodeInput)
  if (e.target.tagName === 'INPUT' && e.target.id !== 'barcodeInput') return;
  if (e.target.tagName === 'TEXTAREA') return;

  // Ignora teclas de controle (exceto Enter)
  if (e.key.length > 1 && e.key !== 'Enter') return;

  const now = Date.now();
  const timeDiff = now - lastBarcodeTime;

  // Se passou muito tempo, reseta o buffer
  if (timeDiff > BARCODE_CONFIG.timeout && barcodeBuffer.length > 0) {
    console.log('⏱️ Timeout - Buffer resetado:', barcodeBuffer);
    barcodeBuffer = '';
  }

  lastBarcodeTime = now;

  // Detecta Enter (fim da leitura)
  if (e.key === 'Enter' && barcodeBuffer.length >= BARCODE_CONFIG.minLength) {
    e.preventDefault();
    processBarcode(barcodeBuffer.trim());
    barcodeBuffer = '';
    return;
  }

  // Adiciona caractere ao buffer
  if (e.key.length === 1) {
    barcodeBuffer += e.key;

    // Auto-focus no input visual
    if (barcodeInput && document.activeElement !== barcodeInput) {
      barcodeInput.value = barcodeBuffer;
    }

    // Limpa timeout anterior
    clearTimeout(barcodeTimeout);

    // Define novo timeout para auto-processar
    barcodeTimeout = setTimeout(() => {
      if (barcodeBuffer.length >= BARCODE_CONFIG.minLength) {
        console.log('⏱️ Auto-processando após timeout:', barcodeBuffer);
        processBarcode(barcodeBuffer.trim());
        barcodeBuffer = '';
      }
    }, BARCODE_CONFIG.timeout);
  }
});

/**
 * Listener dedicado para o input visual
 */
barcodeInput?.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const barcode = barcodeInput.value.trim();

    if (barcode.length >= BARCODE_CONFIG.minLength) {
      await processBarcode(barcode);
      barcodeInput.value = '';
    } else {
      showBarcodeStatus('❌', 'error');
      showAlert('warning', '⚠️ Código Inválido', 'O código deve ter no mínimo 8 caracteres');
    }
  }
});

/* ======= BARCODE TOGGLE CONTROL ======= */
let isBarcodeEnabled = true; // Inicialmente ativo

// Elementos DOM do toggle
const barcodeToggle = document.getElementById('barcodeToggle');
const barcodeToggleContainer = document.querySelector('.barcode-toggle');

/**
 * Controla o estado do leitor de código de barras
 */
function toggleBarcodeScanner(enable) {
  console.log('🎯 toggleBarcodeScanner chamado com:', enable);
  isBarcodeEnabled = enable;

  if (enable) {
    console.log('✅ Leitor de código de barras ATIVADO');
    barcodeToggleContainer?.classList.add('active');
    console.log('📢 Chamando showAlert para ATIVADO...');
    showAlert('success', 'Leitor Ativado', 'O leitor de código de barras foi ativado com sucesso', 2500);
  } else {
    console.log('🚫 Leitor de código de barras DESATIVADO');
    barcodeToggleContainer?.classList.remove('active');
    console.log('📢 Chamando showAlert para DESATIVADO...');
    showAlert('info', 'Leitor Desativado', 'O leitor de código de barras foi desativado', 2500);
  }
  console.log('✔️ toggleBarcodeScanner finalizado');
}

/**
 * Processa o código de barras capturado
 * ✅ OTIMIZADO: Busca direto no array PRODUCTS (sem fetch adicional)
 */
async function processBarcode(barcode) {

  // 🔒 VERIFICA SE O LEITOR ESTÁ BLOQUEADO
  if (!isBarcodeEnabled) {
    console.log('🚫 Leitor bloqueado - Ignorando código:', barcode);
    showAlert('warning', '🔒 Leitor Bloqueado', 'Ative o leitor para escanear produtos', 2000);
    return;
  }

  // Previne processamento duplicado
  if (isProcessingBarcode) {
    console.log('⚠️ Já está processando um código');
    return;
  }

  isProcessingBarcode = true;
  barcodeStats.total++;

  console.log('🔍 Processando código de barras:', barcode);

  // Feedback visual - Processando
  showBarcodeStatus('⏳', 'processing');
  if (barcodeInput) {
    barcodeInput.style.borderColor = '#3b82f6';
    barcodeInput.value = barcode;
  }

  try {
    // ✅ BUSCA DIRETO NO ARRAY PRODUCTS (já carregado na memória)
    const produto = PRODUCTS.find(p => p.barra && p.barra.trim() === barcode.trim());

    if (produto) {
      const produtoId = produto.id;

      console.log('✅ Produto encontrado no cache local:', produto);
      console.log({
        id: produtoId,
        nome: produto.name,
        codigo_barra: produto.barra,
        preco: produto.price,
        disponivel: produto.available,
        tipo: produto.ps === 'S' ? 'SERVIÇO' : 'PRODUTO'
      });

      // ✅ REUTILIZA A FUNÇÃO EXISTENTE - Mesmo fluxo do clique
      addToCart(produtoId, 1);

      // Feedback de sucesso
      showBarcodeStatus('✅', 'success');
      showBarcodeLastScan(produto.name, 'success');
      barcodeStats.success++;

      // Alert de sucesso
      showAlert('success', '✅ Adicionado', `${produto.name} foi adicionado ao pedido`);

      // Som de beep
      playBeepSound('success');

      // Salva no histórico
      barcodeStats.history.unshift({
        barcode,
        produto: produto.name,
        timestamp: new Date().toISOString(),
        success: true
      });

      // Limpa input após 1.5 segundos
      setTimeout(() => {
        if (barcodeInput) barcodeInput.value = '';
        showBarcodeStatus('', 'idle');
      }, 1500);

    } else {
      // Produto não encontrado no cache local
      console.warn('❌ Código não encontrado no cache:', barcode);
      console.log('💡 Dica: Verifique se o produto tem o campo "barra" preenchido na base de dados');

      showBarcodeStatus('❌', 'error');
      showBarcodeLastScan(`Código ${barcode} não encontrado`, 'error');
      barcodeStats.errors++;

      showAlert('error', '❌ Não Encontrado', 'Código de barras não cadastrado no sistema ou produto não carregado');

      playBeepSound('error');

      // Salva no histórico
      barcodeStats.history.unshift({
        barcode,
        produto: null,
        timestamp: new Date().toISOString(),
        success: false,
        error: 'Produto não encontrado'
      });

      // Limpa após 2 segundos
      setTimeout(() => {
        if (barcodeInput) barcodeInput.value = '';
        showBarcodeStatus('', 'idle');
      }, 2000);
    }

  } catch (error) {
    console.error('💥 Erro ao processar código de barras:', error);

    showBarcodeStatus('⚠️', 'error');
    showBarcodeLastScan('Erro interno', 'error');
    barcodeStats.errors++;

    showAlert('error', '❌ Erro', 'Erro ao processar o código de barras');

    playBeepSound('error');

  } finally {
    isProcessingBarcode = false;

    // Reseta visual após delay
    setTimeout(() => {
      if (barcodeInput) barcodeInput.style.borderColor = 'rgba(255,255,255,0.3)';
    }, 1000);
  }
}

/**
 * Mostra status visual no input
 */
function showBarcodeStatus(icon, type) {
  if (!barcodeStatus) return;

  barcodeStatus.textContent = icon;
  barcodeStatus.style.display = icon ? 'block' : 'none';

  // Cores baseadas no tipo
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    processing: '#3b82f6',
    idle: '#6b7280'
  };

  barcodeStatus.style.color = colors[type] || colors.idle;
}

/**
 * Mostra última leitura
 */
function showBarcodeLastScan(text, type) {
  if (!barcodeLastScan) return;

  const colors = {
    success: 'rgba(16, 185, 129, 0.9)',
    error: 'rgba(239, 68, 68, 0.9)'
  };

  barcodeLastScan.textContent = text;
  barcodeLastScan.style.color = colors[type] || 'rgba(255,255,255,0.9)';
  barcodeLastScan.style.display = 'block';
}

/**
 * Sons de feedback
 */
function playBeepSound(type = 'success') {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'success') {
      // Tom agudo e curto para sucesso
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);

    } else if (type === 'error') {
      // Tom grave e prolongado para erro
      oscillator.frequency.value = 200;
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  } catch (error) {
    console.warn('Áudio não suportado:', error);
  }
}

/**
 * Debug: Mostra estatísticas no console
 */
function showBarcodeStats() {
  console.table({
    'Total de Leituras': barcodeStats.total,
    'Sucessos': barcodeStats.success,
    'Erros': barcodeStats.errors,
    'Taxa de Sucesso': `${((barcodeStats.success / barcodeStats.total) * 100).toFixed(1)}%`
  });

  console.log('📊 Histórico Completo:', barcodeStats.history);
}

// Comando de debug disponível no console
window.barcodeStats = showBarcodeStats;

/**
 * Event Listener para o toggle
 */
document.addEventListener('DOMContentLoaded', function () {
  console.log('🔵 Inicializando toggle do código de barras...');
  const toggle = document.getElementById('barcodeToggle');

  if (toggle) {
    console.log('✅ Toggle encontrado!');
    // Inicializa como ativo
    toggle.checked = true;
    isBarcodeEnabled = true;
    barcodeToggleContainer?.classList.add('active');

    // Event listener para mudanças no toggle
    toggle.addEventListener('change', function (e) {
      console.log('🔄 Toggle mudou para:', e.target.checked);
      toggleBarcodeScanner(e.target.checked);
    });

    console.log('✅ Event listener do toggle adicionado com sucesso!');
  } else {
    console.error('❌ Toggle de código de barras não encontrado!');
  }
});

// Adiciona controle por teclado (Alt+B)
document.addEventListener('keydown', function (e) {
  if (e.altKey && e.key === 'b') {
    e.preventDefault();
    console.log('⌨️  Atalho Alt+B pressionado');
    const toggle = document.getElementById('barcodeToggle');
    if (toggle) {
      toggle.checked = !toggle.checked;
      console.log('🔄 Toggle alterado via teclado para:', toggle.checked);
      toggleBarcodeScanner(toggle.checked);

      // Trigger change event
      const event = new Event('change');
      toggle.dispatchEvent(event);
    } else {
      console.error('❌ Toggle não encontrado ao usar atalho Alt+B');
    }
  }
});

console.log('✅ Sistema de código de barras inicializado');
console.log('💡 Digite "barcodeStats()" no console para ver estatísticas');



   
      /* ================================================
   FIM do Barcode Module

   ================================================ */



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


   
      /* ================================================
   FIM do Cart Module

   ================================================ */


/* ================================================
   MÓDULO: Checkout Module
   Ficheiro: assets/js/modules/checkout.module.js
   Parte do sistema Dash-POS
   ================================================ */

/**
 * Obtém o ID do cliente para envio ao backend (selecionado ou Consumidor Final).
 * Usado por Fatura-Recibo e Fatura Proforma.
 * @returns {number}
 * @throws {Error}
 */
function getIdClienteForDocument() {
  const clientManager = window.getClientManager ? window.getClientManager() : null;
  const selectedClient = clientManager ? clientManager.getSelectedClient() : null;
  if (selectedClient && selectedClient.idcliente) {
    return parseInt(selectedClient.idcliente);
  }
  if (!idClientePadrao) {
    throw new Error('Cliente padrão não foi carregado. Recarregue a página.');
  }
  const id = parseInt(idClientePadrao);
  if (!id || isNaN(id)) throw new Error('ID de cliente inválido.');
  return id;
}

/**
 * Coleta todos os dados de pagamento para envio ao backend
 * @returns {Object} Dados formatados para o backend
 * @throws {Error} Se validação falhar
 */
function collectPaymentData() {
  console.log('📊 Coletando dados de pagamento...');
  
  // 1. OBTER CLIENTE SELECIONADO (SE EXISTIR)
  const clientManager = window.getClientManager ? window.getClientManager() : null;
  const selectedClient = clientManager ? clientManager.getSelectedClient() : null;
  
  // ✅ NOVO: Cliente é OBRIGATÓRIO - usa selecionado OU "Consumidor Final"
  let idCliente;
  
  if (selectedClient && selectedClient.idcliente) {
    // Usuário selecionou um cliente específico
    idCliente = parseInt(selectedClient.idcliente);
    console.log('✅ Cliente selecionado:', selectedClient.nome, '(ID:', idCliente, ')');
    
  } else {
    // Nenhum cliente selecionado - usa Consumidor Final
    if (!idClientePadrao) {
      throw new Error(
        'ERRO CRÍTICO: Cliente padrão não foi carregado. ' +
        'Recarregue a página e tente novamente.'
      );
    }
    
    idCliente = idClientePadrao;
    console.log('✅ Usando cliente padrão (Consumidor Final) - ID:', idCliente);
  }
  
  // Validação final: NUNCA pode ser null/undefined
  if (!idCliente || isNaN(idCliente)) {
    throw new Error(
      'ERRO: ID de cliente inválido. ' +
      'Por favor, recarregue a página.'
    );
  }
  
  // 2. VALIDAR CARRINHO
  if (!cart || cart.size === 0) {
    throw new Error('Carrinho vazio. Adicione produtos ao carrinho.');
  }
  
  console.log('✅ Carrinho possui', cart.size, 'produtos');
  
  // 3. COLETAR MÉTODOS DE PAGAMENTO COM VALORES > 0
  const metodosPagamento = [];
  let totalPago = 0;
  
  if (!footerPaymentMethods || footerPaymentMethods.length === 0) {
    throw new Error('Métodos de pagamento não carregados');
  }
  
  footerPaymentMethods.forEach(metodo => {
    const valor = parseFloat(footerValoresPorMetodo[metodo.slug]) || 0;
    if (valor > 0) {
      metodosPagamento.push({
        id_metodo: metodo.id,
        valor: valor
      });
      totalPago += valor;
      console.log(`💳 ${metodo.nome}: ${valor.toFixed(2)} Kz`);
    }
  });
  
  // 4. VALIDAR PELO MENOS UM MÉTODO DE PAGAMENTO
  if (metodosPagamento.length === 0) {
    throw new Error('Nenhum valor de pagamento informado. Insira o valor recebido.');
  }
  
  console.log('✅ Total pago:', totalPago.toFixed(2), 'Kz');
  
  // 5. CALCULAR TROCO
  const valorAPagar = currentCartTotal || 0;
  const troco = Math.max(0, totalPago - valorAPagar);
  
  if (troco > 0) {
    console.log('💵 Troco:', troco.toFixed(2), 'Kz');
  }
  
  // 6. COLETAR OBSERVAÇÃO (SE EXISTIR) - ✅ GARANTIR QUE SEMPRE SEJA STRING
  let observacao = '';
  
  try {
    if (typeof getOrderObservation === 'function') {
      const obs = getOrderObservation();
      // Garantir que seja string e remover espaços extras
      observacao = (obs && typeof obs === 'string') ? obs.trim() : '';
    }
  } catch (error) {
    console.warn('⚠️ Erro ao obter observação:', error);
    observacao = '';
  }
  
  if (observacao) {
    console.log('📝 Observação:', observacao);
  } else {
    console.log('📝 Observação: (vazia)');
  }
  
  // 7. MONTAR PAYLOAD PARA O BACKEND
  const payload = {
    acao: 'factura-recibo',
    metodos_pagamento: metodosPagamento,
    observacao: observacao,
    troco: troco,
    valor_pago: totalPago
  };
  
  // ✅ SEMPRE envia id_cliente (selecionado OU padrão)
  payload.id_cliente = idCliente;
  
  console.log('✅ Payload montado:', payload);
  
  return payload;
}

/**
 * Animação de loading para o botão Pagar
 * Cicla entre ".", "..", "..." continuamente
 */
let payButtonAnimationInterval = null;

function startPayButtonAnimation() {
  const payButtons = document.querySelectorAll('.keypad-pay-btn');
  if (!payButtons.length) return;
  
  payButtons.forEach(function (btn) { btn.classList.add('loading'); });
  let dotCount = 0;
  if (payButtonAnimationInterval) clearInterval(payButtonAnimationInterval);
  payButtonAnimationInterval = setInterval(function () {
    dotCount = (dotCount % 3) + 1;
    const bulletChar = '•';
    const dots = Array(dotCount).fill(bulletChar).join(' ');
    payButtons.forEach(function (btn) { btn.textContent = dots; });
  }, 400);
  console.log('⏳ Animação do botão Pagar iniciada');
}

function stopPayButtonAnimation() {
  if (payButtonAnimationInterval) {
    clearInterval(payButtonAnimationInterval);
    payButtonAnimationInterval = null;
  }
  
  document.querySelectorAll('.keypad-pay-btn').forEach(function (btn) {
    btn.classList.remove('loading');
    btn.textContent = '• • •';
  });
  console.log('⏸️ Animação do botão Pagar parada');
}

function resetPayButtonText() {
  if (payButtonAnimationInterval) {
    clearInterval(payButtonAnimationInterval);
    payButtonAnimationInterval = null;
  }
  
  document.querySelectorAll('.keypad-pay-btn').forEach(function (btn) {
    btn.classList.remove('loading');
    btn.textContent = 'Pagar';
  });
  console.log('🔄 Texto do botão Pagar restaurado');
}

async function processProformaInvoice() {
  console.log('🚀 [PROFORMA] Iniciando Factura Proforma...');

  if (!cart || cart.size === 0 || currentCartTotal <= 0) {
    if (typeof showAlert === 'function') {
      showAlert('warning', 'Carrinho Vazio', 'Adicione produtos ao carrinho antes de gerar a Factura Proforma.', 4000);
    } else {
      alert('Adicione produtos ao carrinho.');
    }
    return;
  }

  let idCliente;
  try {
    idCliente = getIdClienteForDocument();
  } catch (e) {
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', e.message || 'Cliente inválido.');
    } else {
      alert(e.message);
    }
    return;
  }

  try {
    startPayButtonAnimation();
    if (typeof showAlert === 'function') {
      showAlert('info', 'Processando', 'A gerar Factura Proforma...', 0);
    }

    let observacao = '';
    try {
      if (typeof getOrderObservation === 'function') {
        const obs = getOrderObservation();
        observacao = (obs && typeof obs === 'string') ? obs.trim() : '';
      }
    } catch (e) {
      observacao = '';
    }

    const response = await fetch('http://localhost/Dash-POS/api/vender.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'factura-proforma',
        id_cliente: idCliente,
        tipo_documento: 'Factura-Proforma',
        observacao: observacao
      })
    });

    const rawText = await response.text();
    if (rawText.trim().startsWith('<')) {
      throw new Error('Erro no servidor. Verifique os logs do PHP.');
    }
    const data = JSON.parse(rawText);

    if (!response.ok || !data.sucesso) {
      throw new Error(data.erro || data.mensagem || 'Erro ao processar Factura Proforma');
    }

    if (typeof closeAlert === 'function') closeAlert();
    if (typeof showAlert === 'function') {
      showAlert('info', 'A gerar documento', 'A preparar impressão A4...', 0);
    }

    await loadInvoiceAssets('A4');
    applyInvoicePrintStyles('A4');

    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('factura80-container-inv80');
    if (!containerA4 || !container80) throw new Error('Containers de fatura não encontrados.');

    container80.innerHTML = '';
    container80.style.display = 'none';
    containerA4.style.display = 'block';
    containerA4.style.position = 'fixed';
    containerA4.style.top = '-9999px';
    containerA4.style.left = '-9999px';
    containerA4.style.zIndex = '-1';
    containerA4.innerHTML = '';

    if (typeof window.renderizarFaturaComDadosBackend !== 'function') {
      throw new Error('Função renderizarFaturaComDadosBackend não encontrada');
    }
    window.renderizarFaturaComDadosBackend(data);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!containerA4.innerHTML.trim()) throw new Error('Falha na renderização da Factura Proforma');

    window.print();
    resetPayButtonText();
    if (typeof updateInvoiceTypeDisplay === 'function') {
      updateInvoiceTypeDisplay(getTipoDocumentoAtual());
    }
    await new Promise(resolve => setTimeout(resolve, 150));
    await clearCartAfterSale();

    if (typeof closeAlert === 'function') closeAlert();
    if (typeof showAlert === 'function') {
      showAlert('success', 'Factura Proforma gerada', `Documento ${data.codigo_documento} gerado com sucesso.`, 4000);
    }
  } catch (error) {
    console.error('❌ [PROFORMA]', error);
    if (typeof closeAlert === 'function') closeAlert();
    resetPayButtonText();
    if (typeof updateInvoiceTypeDisplay === 'function') {
      updateInvoiceTypeDisplay(getTipoDocumentoAtual());
    }
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', error.message || 'Erro ao gerar Factura Proforma.', 5000);
    } else {
      alert(error.message || 'Erro ao gerar Factura Proforma.');
    }
  }
}

/**
 * Processa e imprime Orçamento (mesmo comportamento da Factura Proforma: sem pagamento, A4).
 * Envia id_cliente e observacao ao backend, renderiza A4 e abre a janela de impressão.
 */
async function processOrcamentoInvoice() {
  console.log('🚀 [ORÇAMENTO] Iniciando Orçamento...');

  if (!cart || cart.size === 0 || currentCartTotal <= 0) {
    if (typeof showAlert === 'function') {
      showAlert('warning', 'Carrinho Vazio', 'Adicione produtos ao carrinho antes de gerar o Orçamento.', 4000);
    } else {
      alert('Adicione produtos ao carrinho.');
    }
    return;
  }

  let idCliente;
  try {
    idCliente = getIdClienteForDocument();
  } catch (e) {
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', e.message || 'Cliente inválido.');
    } else {
      alert(e.message);
    }
    return;
  }

  try {
    startPayButtonAnimation();
    if (typeof showAlert === 'function') {
      showAlert('info', 'Processando', 'A gerar Orçamento...', 0);
    }

    let observacao = '';
    try {
      if (typeof getOrderObservation === 'function') {
        const obs = getOrderObservation();
        observacao = (obs && typeof obs === 'string') ? obs.trim() : '';
      }
    } catch (e) {
      observacao = '';
    }

    const response = await fetch('http://localhost/Dash-POS/api/vender.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'orcamento',
        id_cliente: idCliente,
        tipo_documento: 'Orcamento',
        observacao: observacao
      })
    });

    const rawText = await response.text();
    if (rawText.trim().startsWith('<')) {
      throw new Error('Erro no servidor. Verifique os logs do PHP.');
    }
    const data = JSON.parse(rawText);

    if (!response.ok || !data.sucesso) {
      throw new Error(data.erro || data.mensagem || 'Erro ao processar Orçamento');
    }

    if (typeof closeAlert === 'function') closeAlert();
    if (typeof showAlert === 'function') {
      showAlert('info', 'A gerar documento', 'A preparar impressão A4...', 0);
    }

    await loadInvoiceAssets('A4');
    applyInvoicePrintStyles('A4');

    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('factura80-container-inv80');
    if (!containerA4 || !container80) throw new Error('Containers de fatura não encontrados.');

    container80.innerHTML = '';
    container80.style.display = 'none';
    containerA4.style.display = 'block';
    containerA4.style.position = 'fixed';
    containerA4.style.top = '-9999px';
    containerA4.style.left = '-9999px';
    containerA4.style.zIndex = '-1';
    containerA4.innerHTML = '';

    if (typeof window.renderizarFaturaComDadosBackend !== 'function') {
      throw new Error('Função renderizarFaturaComDadosBackend não encontrada');
    }
    window.renderizarFaturaComDadosBackend(data);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!containerA4.innerHTML.trim()) throw new Error('Falha na renderização do Orçamento');

    window.print();
    resetPayButtonText();
    if (typeof updateInvoiceTypeDisplay === 'function') {
      updateInvoiceTypeDisplay(getTipoDocumentoAtual());
    }
    await new Promise(resolve => setTimeout(resolve, 150));
    await clearCartAfterSale();

    if (typeof closeAlert === 'function') closeAlert();
    if (typeof showAlert === 'function') {
      showAlert('success', 'Orçamento gerado', `Documento ${data.codigo_documento} gerado com sucesso.`, 4000);
    }
  } catch (error) {
    console.error('❌ [ORÇAMENTO]', error);
    if (typeof closeAlert === 'function') closeAlert();
    resetPayButtonText();
    if (typeof updateInvoiceTypeDisplay === 'function') {
      updateInvoiceTypeDisplay(getTipoDocumentoAtual());
    }
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', error.message || 'Erro ao gerar Orçamento.', 5000);
    } else {
      alert(error.message || 'Erro ao gerar Orçamento.');
    }
  }
}

/**
 * Processa e imprime Fatura (sem pagamento; baixa stock).
 * Envia id_cliente e observacao ao backend, renderiza A4 e abre a janela de impressão.
 */
async function processFaturaInvoice() {
  console.log('🚀 [FATURA] Iniciando Fatura...');

  if (!cart || cart.size === 0 || currentCartTotal <= 0) {
    if (typeof showAlert === 'function') {
      showAlert('warning', 'Carrinho Vazio', 'Adicione produtos ao carrinho antes de gerar a Fatura.', 4000);
    } else {
      alert('Adicione produtos ao carrinho.');
    }
    return;
  }

  let idCliente;
  try {
    idCliente = getIdClienteForDocument();
  } catch (e) {
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', e.message || 'Cliente inválido.');
    } else {
      alert(e.message);
    }
    return;
  }

  try {
    startPayButtonAnimation();
    if (typeof showAlert === 'function') {
      showAlert('info', 'Processando', 'A gerar Fatura...', 0);
    }

    let observacao = '';
    try {
      if (typeof getOrderObservation === 'function') {
        const obs = getOrderObservation();
        observacao = (obs && typeof obs === 'string') ? obs.trim() : '';
      }
    } catch (e) {
      observacao = '';
    }

    const response = await fetch('http://localhost/Dash-POS/api/vender.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'factura',
        id_cliente: idCliente,
        observacao: observacao
      })
    });

    const rawText = await response.text();
    if (rawText.trim().startsWith('<')) {
      throw new Error('Erro no servidor. Verifique os logs do PHP.');
    }
    const data = JSON.parse(rawText);

    if (!response.ok || !data.sucesso) {
      throw new Error(data.erro || data.mensagem || 'Erro ao processar Fatura');
    }

    if (typeof closeAlert === 'function') closeAlert();
    if (typeof showAlert === 'function') {
      showAlert('info', 'A gerar documento', 'A preparar impressão A4...', 0);
    }

    await loadInvoiceAssets('A4');
    applyInvoicePrintStyles('A4');

    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('factura80-container-inv80');
    if (!containerA4 || !container80) throw new Error('Containers de fatura não encontrados.');

    container80.innerHTML = '';
    container80.style.display = 'none';
    containerA4.style.display = 'block';
    containerA4.style.position = 'fixed';
    containerA4.style.top = '-9999px';
    containerA4.style.left = '-9999px';
    containerA4.style.zIndex = '-1';
    containerA4.innerHTML = '';

    if (typeof window.renderizarFaturaComDadosBackend !== 'function') {
      throw new Error('Função renderizarFaturaComDadosBackend não encontrada');
    }
    window.renderizarFaturaComDadosBackend(data);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!containerA4.innerHTML.trim()) throw new Error('Falha na renderização da Fatura');

    window.print();
    resetPayButtonText();
    if (typeof updateInvoiceTypeDisplay === 'function') {
      updateInvoiceTypeDisplay(getTipoDocumentoAtual());
    }
    await new Promise(resolve => setTimeout(resolve, 150));
    await clearCartAfterSale();

    if (typeof closeAlert === 'function') closeAlert();
    if (typeof showAlert === 'function') {
      showAlert('success', 'Fatura gerada', `Documento ${data.codigo_documento} gerado com sucesso.`, 4000);
    }
  } catch (error) {
    console.error('❌ [FATURA]', error);
    if (typeof closeAlert === 'function') closeAlert();
    resetPayButtonText();
    if (typeof updateInvoiceTypeDisplay === 'function') {
      updateInvoiceTypeDisplay(getTipoDocumentoAtual());
    }
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', error.message || 'Erro ao gerar Fatura.', 5000);
    } else {
      alert(error.message || 'Erro ao gerar Fatura.');
    }
  }
}

/**
 * Processa a venda de Fatura-Recibo
 * Envia dados ao backend, carrega recursos, imprime a fatura (janela do navegador) e limpa o carrinho.
 * Não mostra opção de download em PDF após fechar a impressão; isso ficará para etapa futura.
 */
async function processReceiptInvoice() {
  console.log('🚀 [PAYMENT] Iniciando processamento de Fatura-Recibo...');
  
  // ============================================
  // PASSO 1: VALIDAÇÃO DO TIPO DE DOCUMENTO
  // ============================================
  
  const tipoDocumento = typeof getTipoDocumentoAtual === 'function' ? 
    getTipoDocumentoAtual() : tipoDocumentoAtual;
  
  console.log('📄 [PAYMENT] Tipo de documento:', tipoDocumento);
  
  if (tipoDocumento !== 'factura-recibo') {
    console.error('❌ [PAYMENT] Tipo de documento não suportado:', tipoDocumento);
    
    const nomeAmigavel = {
      'factura-recibo': 'Factura-Recibo',
      'factura-proforma': 'Factura Proforma',
      'factura': 'Factura',
      'orcamento': 'Orçamento'
    };
    
    const nomeDocumento = nomeAmigavel[tipoDocumento] || tipoDocumento;
    
    if (typeof showAlert === 'function') {
      showAlert('error', '❌ Tipo Não Suportado', 
        `"${nomeDocumento}" ainda não está implementado. Apenas "Factura-Recibo" está disponível.`, 4000);
    } else {
      alert(`"${nomeDocumento}" ainda não está implementado.`);
    }
    
    return; // BLOQUEIA EXECUÇÃO
  }
  
  // ============================================
  // PASSO 1.5: VALIDAÇÃO CARRINHO E MÉTODOS DE PAGAMENTO (antes de animação)
  // ============================================
  
  if (!cart || cart.size === 0 || currentCartTotal <= 0) {
    if (typeof showAlert === 'function') {
      showAlert('warning', '⚠️ Carrinho Vazio', 'Adicione produtos ao carrinho antes de pagar.', 4000);
    } else {
      alert('Adicione produtos ao carrinho antes de pagar.');
    }
    console.warn('⚠️ [PAYMENT] Bloqueado: carrinho vazio');
    return;
  }
  
  let somaPagamentosPre = 0;
  if (footerPaymentMethods && footerPaymentMethods.length > 0) {
    footerPaymentMethods.forEach(metodo => {
      somaPagamentosPre += parseFloat(footerValoresPorMetodo[metodo.slug]) || 0;
    });
  }
  if (somaPagamentosPre <= 0) {
    if (typeof showAlert === 'function') {
      showAlert('warning', '⚠️ Métodos de Pagamento', 'Preencha os valores nos métodos de pagamento (dinheiro, multibanco, etc.) antes de pagar.', 5000);
    } else {
      alert('Preencha os valores nos métodos de pagamento antes de pagar.');
    }
    console.warn('⚠️ [PAYMENT] Bloqueado: nenhum valor de pagamento informado');
    return;
  }
  
  // ============================================
  // PASSO 2: RECOLHA E ENVIO DE DADOS
  // ============================================
  
  try {
    startPayButtonAnimation();
    
    if (typeof showAlert === 'function') {
      showAlert('info', '⏳ Processando', 'Validando dados do pagamento...', 0);
    }
    
    console.log('📊 [PAYMENT] Coletando dados de pagamento...');
    const paymentData = collectPaymentData();
    
    // Validação frontend: valor pago >= total a pagar
    const totalAPagar = currentCartTotal || 0;
    const totalPago = paymentData.valor_pago || 0;
    
    console.log('💰 [PAYMENT] Validação:', {
      totalAPagar: totalAPagar.toFixed(2),
      totalPago: totalPago.toFixed(2),
      diferenca: (totalPago - totalAPagar).toFixed(2)
    });
    
    if (totalPago < totalAPagar) {
      stopPayButtonAnimation();
      
      const valorEmFalta = totalAPagar - totalPago;
      showPaymentMissing(valorEmFalta);
      
      const msg = `Valor insuficiente! Faltam ${valorEmFalta.toLocaleString('pt-AO', { 
        minimumFractionDigits: 2 
      })} Kz para completar o pagamento.`;
      
      if (typeof showAlert === 'function') {
        showAlert('error', '❌ Pagamento Incompleto', msg, 5000);
      } else {
        alert(msg);
      }
      
      console.warn('❌ [PAYMENT] Bloqueado: valor insuficiente');
      return;
    }
    
    console.log('📤 [PAYMENT] Enviando dados para backend...');
    
    const response = await fetch('http://localhost/Dash-POS/api/vender.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    console.log('📡 [PAYMENT] Resposta recebida. Status:', response.status);

    const rawText = await response.text();
    console.log('📥 [PAYMENT] Resposta RAW (primeiros 300 chars):', rawText.substring(0, 300));

    // Valida se não é HTML (erro PHP)
    if (rawText.trim().startsWith('<')) {
      console.error('❌ [PAYMENT] SERVIDOR RETORNOU HTML (erro PHP)');
      throw new Error('Erro no servidor. Verifique os logs do PHP.');
    }

    // Parse JSON
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error('❌ [PAYMENT] JSON inválido:', parseError);
      throw new Error('Resposta do servidor inválida');
    }

    console.log('📥 [PAYMENT] Dados parseados:', data);

    // Valida resposta do backend
    if (!response.ok || !data.sucesso) {
      const errorMsg = data.erro || data.mensagem || 'Erro desconhecido no backend';
      throw new Error(errorMsg);
    }
    
    console.log('✅ [PAYMENT] Pagamento aprovado pelo backend!');
    console.log('📄 [PAYMENT] Código do documento:', data.codigo_documento);
    
    // ============================================
    // PASSO 3: CARREGAMENTO DINÂMICO DE RECURSOS
    // ============================================
    
    // Detecta formato selecionado pelo usuário
    let formato = 'A4';
    
    console.log('🔍 [FORMAT] Detectando formato selecionado...');
    
    if (typeof formatoFaturaAtual !== 'undefined' && formatoFaturaAtual) {
      formato = formatoFaturaAtual;
      console.log('✅ [FORMAT] Variável global:', formato);
    } else if (typeof getInvoiceFormat === 'function') {
      formato = getInvoiceFormat() || 'A4';
      console.log('✅ [FORMAT] Função getInvoiceFormat():', formato);
    } else {
      const radio = document.querySelector('input[name="invoiceFormat"]:checked');
      formato = radio?.value || 'A4';
      console.log('✅ [FORMAT] Radio button:', formato);
    }
    
    // Validação do formato
    if (formato !== 'A4' && formato !== '80mm') {
      console.warn('⚠️ [FORMAT] Formato inválido:', formato, '- Usando A4');
      formato = 'A4';
    }
    
    console.log('📐 [FORMAT] Formato CONFIRMADO:', formato);
    
    // Atualiza mensagem de loading
    if (typeof showAlert === 'function') {
      closeAlert();
      showAlert('info', '⏳ Gerando Fatura', `Carregando recursos para ${formato}...`, 0);
    }
    
    // ✅ CARREGA RECURSOS DINAMICAMENTE
    console.log(`🔄 [ASSETS] Iniciando carregamento para ${formato}...`);
    
    try {
      await loadInvoiceAssets(formato);
      console.log('✅ [ASSETS] Recursos carregados com sucesso');
    } catch (assetError) {
      throw new Error(`Falha ao carregar recursos de fatura: ${assetError.message}`);
    }
    
    // ============================================
    // PASSO 3.5.5: APLICAR ESTILOS DE IMPRESSÃO
    // ============================================
    
    // ✅ ESTILOS DE IMPRESSÃO: apenas o container usado fica visível (evita 1ª página em branco)
    applyInvoicePrintStyles(formato);
    
    // ============================================
    // PASSO 4: RENDERIZAÇÃO DA FATURA (CORRIGIDO)
    // ============================================

    if (typeof showAlert === 'function') {
      closeAlert();
      showAlert('info', '⏳ Gerando Fatura', 'Preparando documento para impressão...', 0);
    }

    console.log('🎨 [RENDER] Iniciando renderização...');

    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('factura80-container-inv80');
    if (!containerA4 || !container80) {
      throw new Error('Containers de fatura não encontrados no DOM');
    }

    // ✅ Mostrar só o container que vamos usar e esconder/limpar o outro (igual ao backup)
    if (formato === '80mm') {
      containerA4.innerHTML = '';
      containerA4.style.display = 'none';
      container80.style.display = 'block';
      container80.style.position = 'fixed';
      container80.style.top = '-9999px';
      container80.style.left = '-9999px';
      container80.style.zIndex = '-1';
      console.log('📄 [RENDER] Container 80mm ativo, A4 oculto');
    } else {
      container80.innerHTML = '';
      container80.style.display = 'none';
      containerA4.style.display = 'block';
      containerA4.style.position = 'fixed';
      containerA4.style.top = '-9999px';
      containerA4.style.left = '-9999px';
      containerA4.style.zIndex = '-1';
      console.log('📄 [RENDER] Container A4 ativo, 80mm oculto');
    }

    if (formato === '80mm') {
      // ========== RENDERIZAÇÃO 80MM ==========
      
      console.log('📄 [RENDER] Renderizando fatura 80mm...');
      
      if (typeof window.renderizarFatura80ComDadosBackend !== 'function') {
        throw new Error('Função renderizarFatura80ComDadosBackend não encontrada');
      }
      
      window.renderizarFatura80ComDadosBackend(data);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const hasContent = container80.innerHTML.length > 0;
      if (!hasContent) {
        throw new Error('Falha na renderização da fatura 80mm');
      }
      
      console.log('✅ [RENDER] Fatura 80mm renderizada');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } else {
      // ========== RENDERIZAÇÃO A4 ==========
      
      console.log('📄 [RENDER] Renderizando fatura A4...');
      
      if (typeof window.renderizarFaturaComDadosBackend !== 'function') {
        throw new Error('Função renderizarFaturaComDadosBackend não encontrada');
      }
      
      window.renderizarFaturaComDadosBackend(data);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const hasContent = containerA4.innerHTML.length > 0;
      if (!hasContent) {
        throw new Error('Falha na renderização da fatura A4');
      }
      
      console.log('✅ [RENDER] Fatura A4 renderizada');
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // ========== IMPRESSÃO ==========
    
    console.log('🖨️ [PRINT] Abrindo janela de impressão...');
    
    // ✅ CHAMADA DIRETA: janela de impressão abre (animação continua a rodar)
    window.print();
    
    // Utilizador fechou a janela de impressão → parar animação e repor texto "Pagar" de imediato
    resetPayButtonText();
    
    // Pequena pausa para o diálogo fechar por completo (evita race)
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // ============================================
    // PASSO 5: LIMPEZA DO ESTADO DA VENDA
    // ============================================
    
    console.log('🧹 [CLEANUP] Iniciando limpeza pós-venda...');
    
    // Limpa carrinho e estado (UI fica disponível logo)
    await clearCartAfterSale();
    
    // Mensagem de sucesso
    if (typeof showAlert === 'function') {
      showAlert('success', '✅ Venda Concluída', 
        `Fatura ${data.codigo_documento} gerada com sucesso!`, 4000);
    }
    
    console.log('🎉 [PAYMENT] Processo concluído com sucesso!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    // ========== TRATAMENTO DE ERROS ==========
    
    console.error('❌ [PAYMENT] Erro no processamento:', error);
    console.error('Stack:', error.stack);
    
    // Fecha loading
    if (typeof closeAlert === 'function') {
      closeAlert();
    }
    
    // Restaura botão
    resetPayButtonText();
    
    // Mostra erro ao usuário
    if (typeof showAlert === 'function') {
      showAlert('error', '❌ Erro no Pagamento', 
        error.message || 'Erro ao processar a venda', 6000);
    } else {
      alert('Erro: ' + (error.message || 'Erro ao processar'));
    }
  }
}

/**
 * Limpa carrinho e reseta estado após venda concluída
 */
async function clearCartAfterSale() {
  console.log('🧹 Limpando carrinho após venda...');
  
  try {
    // 1. LIMPAR CARRINHO LOCAL
    if (cart && typeof cart.clear === 'function') {
      cart.clear();
      console.log('✅ Carrinho local limpo');
    }
    
    // 2. RESETAR VALORES DE PAGAMENTO
    if (typeof resetFooterPaymentValues === 'function') {
      resetFooterPaymentValues();
      console.log('✅ Valores de pagamento resetados');
    }
    
    // 3. LIMPAR OBSERVAÇÃO
    const obsTextarea = document.getElementById('orderObservation');
    if (obsTextarea) {
      obsTextarea.value = '';
    }
    if (window.orderObservation !== undefined) {
      window.orderObservation = '';
    }
    console.log('✅ Observação limpa');
    
    // 4. ATUALIZAR DISPLAYS
    if (typeof updateCartDisplay === 'function') {
      updateCartDisplay();
    }
    
    if (typeof renderCart === 'function') {
      renderCart();
    }
    
    // 5. Recarrega carrinho da API em background (não bloqueia; UI já está limpa)
    if (typeof loadCartFromAPI === 'function') {
      const loadPromise = loadCartFromAPI();
      if (loadPromise && typeof loadPromise.then === 'function') {
        loadPromise.then(() => console.log('✅ Carrinho recarregado da API')).catch(err => console.warn('⚠️ loadCartFromAPI:', err));
      }
    }
    
    // ✅ LIMPA OS CONTAINERS APÓS A IMPRESSÃO (não antes!)
    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('factura80-container-inv80');

    if (containerA4) containerA4.innerHTML = '';
    if (container80) container80.innerHTML = '';

    console.log('✅ Containers de fatura limpos');
    
    console.log('✅ Limpeza concluída');
    
    // ✅ NOVA: Restaura texto do botão após limpeza
    resetPayButtonText();
    
  } catch (error) {
    console.error('⚠️ Erro ao limpar carrinho:', error);
  }
}
/* LEGACY - versão simplificada, ver alerts.ui.js */
function closeAlert() {
  const container = document.getElementById('alertContainer');
  if (container) {
    container.innerHTML = '';
  }
}

/**
 * Retorna o tipo de documento atualmente selecionado
 * DUPLICADO - versão em invoice-type.ui.js
 * @returns {string} Tipo do documento
 */
function getTipoDocumentoAtual() {
  return tipoDocumentoAtual || 'factura-recibo';
}
function initPayButton() {
  console.log('🔧 [PAY BUTTON] Tentando inicializar botão Pagar...');
  const cartFooter = document.querySelector('.cart-footer');
  if (!cartFooter) {
    console.warn('⚠️ [PAY BUTTON] .cart-footer não encontrado, tentando em 500ms...');
    setTimeout(initPayButton, 500);
    return;
  }
  cartFooter.addEventListener('click', async function (e) {
    if (!e.target || !e.target.closest('.keypad-pay-btn')) return;
    e.preventDefault();
    console.log('💳 [PAY BUTTON] Botão "Pagar" clicado');
    var tipoDoc = getTipoDocumentoAtual();
    console.log('📄 [PAY BUTTON] Tipo de documento:', tipoDoc);
    if (tipoDoc === 'factura-proforma') {
      console.log('🚀 [PAY BUTTON] Chamando processProformaInvoice()...');
      await processProformaInvoice();
      return;
    }
    if (tipoDoc === 'factura') {
      console.log('🚀 [PAY BUTTON] Chamando processFaturaInvoice()...');
      await processFaturaInvoice();
      return;
    }
    if (tipoDoc === 'orcamento') {
      console.log('🚀 [PAY BUTTON] Chamando processOrcamentoInvoice()...');
      await processOrcamentoInvoice();
      return;
    }
    if (tipoDoc !== 'factura-recibo') {
      if (typeof showAlert === 'function') {
        showAlert(
          'warning',
          'Tipo Não Suportado',
          'Este tipo de documento ainda não está implementado. Use Factura-Recibo, Factura Proforma ou Orçamento.',
          4000
        );
      } else {
        alert('Este tipo de documento ainda não está implementado.');
      }
      return;
    }
    console.log('🚀 [PAY BUTTON] Chamando processReceiptInvoice()...');
    await processReceiptInvoice();
  });
  console.log('✅ [PAY BUTTON] Event listener (delegação) attached em .cart-footer');
}

// ✅ Pay button initialization now handled in init() function
// Previous DOMContentLoaded calls removed to prevent race conditions
// DEBUG - pode ser removido em produção
async function testRender80mm() {
    console.log('🧪 [TEST] Iniciando teste de renderização 80mm...');
    
    const testData = {
        codigo_documento: 'FR TEST/001',
        data_emissao: '01/02/2026',
        hora_emissao: '10:30:00',
        dados_empresa: {
            Empresa: 'Teste LTDA',
            NIF: '1234567890'
        },
        dados_cliente: {
            Nome: 'Cliente Teste',
            NIF: '987654321'
        },
        produtos: [
            {
                designacao: 'Produto Teste 1',
                quantidade: 2,
                precoUnitario: 50.00,
                desconto: 5.00,
                taxa: '14%',
                total: 95.00
            },
            {
                designacao: 'Produto Teste 2',
                quantidade: 1,
                precoUnitario: 30.00,
                desconto: 0.00,
                taxa: '14%',
                total: 34.20
            }
        ],
        impostos: [
            {
                taxa: '14%',
                incidencia: 80.00,
                valor: 11.20
            }
        ],
        totais: {
            totalMercadorias: 80.00,
            totalImposto: 11.20,
            totalDescontos: 5.00,
            totalDocumento: 129.20
        },
        numeroFatura: 'FR TEST/001',
        operador: 'Operador Teste'
    };
    
    try {
        // Força formato 80mm para teste
        window.formatoFaturaAtual = '80mm';
        
        console.log('📦 [TEST] Dados de teste:', testData);
        
        // Chama a função principal com dados de teste
        await processReceiptInvoice(testData);
        
        console.log('✅ [TEST] Teste concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ [TEST] Erro no teste:', error);
        alert('Erro no teste: ' + error.message);
    }
}

// DEBUG - pode ser removido em produção
function debug80mmContainer() {
    const container = document.getElementById('factura80-container-inv80');
    if (!container) {
        console.log('❌ [DEBUG] Container 80mm NÃO ENCONTRADO');
        return null;
    }
    
    console.log('🔍 [DEBUG] Container 80mm encontrado:', {
        id: container.id,
        className: container.className,
        childrenCount: container.children.length,
        htmlLength: container.innerHTML.length,
        style: {
            position: container.style.position,
            left: container.style.left,
            top: container.style.top,
            width: container.style.width,
            visibility: container.style.visibility,
            opacity: container.style.opacity,
            zIndex: container.style.zIndex
        },
        computedStyle: {
            position: getComputedStyle(container).position,
            display: getComputedStyle(container).display,
            visibility: getComputedStyle(container).visibility
        }
    });
    
    if (container.innerHTML.length > 0) {
        console.log('📄 [DEBUG] Conteúdo do container (primeiros 500 caracteres):', 
                   container.innerHTML.substring(0, 500));
    } else {
        console.log('⚠️ [DEBUG] Container está vazio');
    }
    
    return container;
}

window.processReceiptInvoice = processReceiptInvoice;
window.collectPaymentData = collectPaymentData;
window.clearCartAfterSale = clearCartAfterSale;
window.testRender80mm = testRender80mm;
window.debug80mmContainer = debug80mmContainer;




   
      /* ================================================
   FIM do Checkout Module

   ================================================ */


/* ================================================
   MÓDULO: Client Module
   Ficheiro: assets/js/modules/client.module.js
   Responsabilidade: Estado e lógica de negócio de clientes
   Dash-POS
   ================================================ */

const ClientModule = (() => {
    // --- Estado interno ---
    let _clients = [];
    let _selectedClient = null;

    // --- Utilitário ---
    function _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Inicialização ---
    async function init() {
        const clients = await listarClientes(); // função do cliente.service.js
        _clients = clients;
        renderClientList(_clients); // função do client-panel.ui.js
    }

    // --- Filtrar clientes ---
    function filterClients(searchTerm) {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return [..._clients];
        return _clients.filter(c =>
            c.nome.toLowerCase().includes(term) ||
            (c.nif && c.nif.includes(term))
        );
    }

    // --- Selecionar cliente por ID ---
    function selectClientById(clientId) {
        const client = _clients.find(c => c.idcliente === clientId);
        if (!client) return;

        _selectedClient = client;

        // Atualizar UI do card selecionado
        updateSelectedClientCard(client); // função do client-panel.ui.js

        // Fechar painel (bridge definida no app.js ou invoice-type.ui.js)
        if (typeof closeClientPanel === 'function') {
            closeClientPanel();
        }

        // Bridge para o checkout
        if (typeof window.handleClientSelection === 'function') {
            window.handleClientSelection(client.idcliente, client.nome, {
                id: client.idcliente,
                nome: client.nome,
                telefone: client.telefone || 'N/A',
                email: client.email || '',
                endereco: client.morada || 'N/A',
                nif: client.nif || null
            });
        }

        // Evento para outros componentes
        document.dispatchEvent(new CustomEvent('clientSelected', {
            detail: { client }
        }));
    }

    // --- Guardar novo cliente ---
    async function saveNewClient(formData) {
        // formData: { nome, nif, telefone, email, endereco }

        // Validação
        if (!formData.nome || !formData.nome.trim()) {
            _showError('O campo Nome é obrigatório');
            return false;
        }
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                _showError('Email inválido');
                return false;
            }
        }

        const result = await verificarOuCriarCliente({
            nome: formData.nome.trim(),
            nif: formData.nif || null,
            telefone: formData.telefone || null,
            email: formData.email || null,
            endereco: formData.endereco || null
        });

        if (result.sucesso) {
            // Recarregar lista
            const clients = await listarClientes();
            _clients = clients;
            renderClientList(_clients); // client-panel.ui.js

            // Selecionar o cliente criado/encontrado
            selectClientById(result.id_cliente);

            // Sinalizar sucesso para a UI limpar o formulário e mostrar a lista
            _showSuccess('Cliente guardado com sucesso!');
            return true;
        } else {
            _showError(result.erro || 'Erro ao guardar cliente');
            return false;
        }
    }

    // --- Getter ---
    function getSelectedClient() {
        return _selectedClient;
    }

    function getAllClients() {
        return [..._clients];
    }

    function escapeHtml(text) {
        return _escapeHtml(text);
    }

    // --- Alertas (pontes para o sistema global) ---
    function _showError(message) {
        console.error('❌ Erro:', message);
        if (typeof showAlert === 'function') {
            showAlert('error', 'Erro', message, 3000);
        }
    }

    function _showSuccess(message) {
        console.log('✅ Sucesso:', message);
        if (typeof showAlert === 'function') {
            showAlert('success', 'Sucesso', message, 3000);
        }
    }

    return {
        init,
        filterClients,
        selectClientById,
        saveNewClient,
        getSelectedClient,
        getAllClients,
        escapeHtml
    };
})();

// Expor globalmente para compatibilidade com app.js e clientes.js legados
window.ClientModule = ClientModule;

// Manter compatibilidade com código que usa getClientManager()
window.getClientManager = () => ({
    getSelectedClient: ClientModule.getSelectedClient,
    searchByName: function () { /* pesquisa feita no painel (client-panel.ui.js) */ }
});


   
      /* ================================================
   FIM do Client Module

   ================================================ */


/* ================================================
   MÓDULO: Invoice Assets Module
   Ficheiro: assets/js/modules/invoice-assets.module.js
   Parte do sistema Dash-POS
   (invoiceAssetsState está em state.js)
   ================================================ */

/* ======================================================
   SISTEMA DE CARREGAMENTO DINÂMICO DE FATURAS
   ====================================================== */

/**
 * Carrega um arquivo CSS dinamicamente
 * @param {string} href - Caminho do arquivo CSS
 * @param {string} id - ID único para o elemento link
 * @returns {Promise<void>}
 */
function loadCSS(href, id) {
  return new Promise((resolve, reject) => {
    // Verifica se já existe no DOM
    if (document.getElementById(id)) {
      console.log(`✅ [CSS] ${id} já carregado`);
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    
    link.onload = () => {
      console.log(`✅ [CSS] ${id} carregado com sucesso`);
      resolve();
    };
    
    link.onerror = () => {
      console.error(`❌ [CSS] Falha ao carregar ${id}`);
      reject(new Error(`Falha ao carregar CSS: ${href}`));
    };
    
    document.head.appendChild(link);
  });
}

/**
 * Carrega todos os recursos necessários para renderizar faturas
 * @param {string} format - Formato da fatura: 'A4' ou '80mm'
 * @returns {Promise<void>}
 * @throws {Error} Se formato inválido ou falha no carregamento
 */
async function loadInvoiceAssets(format) {
  console.log(`🔄 [ASSETS] Iniciando carregamento para formato: ${format}`);
  
  if (format !== 'A4' && format !== '80mm') {
    throw new Error(`Formato inválido: ${format}. Use 'A4' ou '80mm'.`);
  }
  
  try {
    // Carregar ambos os CSS (como no backup) para A4 e 80mm estarem sempre disponíveis
    if (!invoiceAssetsState.css.a4) {
      await loadCSS('../assets/css/factura.css', 'factura-a4-css');
      invoiceAssetsState.css.a4 = true;
    }
    if (!invoiceAssetsState.css.mm80) {
      await loadCSS('../assets/css/factura80.css', 'factura-80mm-css');
      invoiceAssetsState.css.mm80 = true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('factura80-container-inv80');
    if (containerA4) {
      containerA4.style.position = 'fixed';
      containerA4.style.top = '-9999px';
      containerA4.style.left = '-9999px';
      containerA4.style.zIndex = '-1';
    }
    if (container80) {
      container80.style.position = 'fixed';
      container80.style.top = '-9999px';
      container80.style.left = '-9999px';
      container80.style.zIndex = '-1';
    }
    
    console.log('✅ [ASSETS] Carregamento concluído');
    
  } catch (error) {
    console.error('❌ [ASSETS] Erro ao carregar recursos:', error);
    throw new Error(`Falha ao carregar recursos de factura: ${error.message}`);
  }
}

/**
 * Verifica se os recursos CSS para um formato já estão carregados
 * @param {string} format - Formato: 'A4' ou '80mm'
 * @returns {boolean}
 */
function areInvoiceAssetsLoaded(format) {
  if (format === 'A4') {
    return invoiceAssetsState.css.a4;
  } else if (format === '80mm') {
    return invoiceAssetsState.css.mm80;
  }
  return false;
}

/**
 * Reseta o estado de carregamento CSS (útil para debug)
 */
function resetInvoiceAssetsState() {
  invoiceAssetsState.css.a4 = false;
  invoiceAssetsState.css.mm80 = false;
  console.log('🔄 [ASSETS] Estado de carregamento resetado');
}

/**
 * Aplica ou atualiza estilos de impressão para o formato indicado.
 * Mostra apenas o container da fatura usada e define @page correto (evita 1ª página em branco).
 * @param {string} format - 'A4' ou '80mm'
 */
function applyInvoicePrintStyles(format) {
  const printStylesId = 'invoice-print-styles-global';
  let el = document.getElementById(printStylesId);
  if (!el) {
    el = document.createElement('style');
    el.id = printStylesId;
    document.head.appendChild(el);
  }
  const isA4 = format === 'A4';
  el.textContent = `
    @media print {
      @page {
        margin: 0 !important;
        size: ${isA4 ? 'A4 portrait' : '80mm auto'};
      }
      /* Esconder só filhos diretos do body (evita 2.ª página); descendentes da fatura mantêm flex/grid do fatura.css */
      html, body {
        margin: 0 !important; padding: 0 !important;
        height: auto !important; min-height: 0 !important;
        overflow: hidden !important;
      }
      body > * { display: none !important; }
      ${isA4
        ? `#inv-a4-container-principal {
             display: block !important;
             position: absolute !important; left: 0 !important; top: 0 !important;
             width: 210mm !important;
             height: auto !important;
             background: white !important;
             z-index: 9999 !important; padding: 0 !important; margin: 0 !important;
             page-break-after: avoid !important;
           }
           #factura80-container-inv80 { display: none !important; }`
        : `#factura80-container-inv80 {
             display: block !important;
             position: absolute !important; left: 0 !important; top: 0 !important;
             width: 80mm !important;
             height: auto !important; min-height: 0 !important;
             background: white !important;
             z-index: 9999 !important; padding: 0 !important; margin: 0 !important;
             page-break-after: avoid !important;
           }
           #inv-a4-container-principal { display: none !important; }`
      }
      .inv-a4-container-multiplas-paginas { gap: 0 !important; margin: 0 !important; padding: 0 !important; }
      /* Altura fixa 297mm por página (como fatura.css do backup) para caber cabeçalho + corpo + rodapé numa folha */
      .inv-a4-interface-fatura, .inv-a4-pagina-fatura {
        width: 210mm !important; height: 297mm !important;
        margin: 0 !important; padding: 12px !important;
        box-shadow: none !important; border-radius: 0 !important;
        overflow: hidden !important;
        page-break-after: always !important; page-break-inside: avoid !important;
      }
      .inv-a4-interface-fatura:last-child, .inv-a4-pagina-fatura:last-child { page-break-after: auto !important; }
      .inv-a4-sessao-cabecalho, .inv-a4-sessao-corpo-central, .inv-a4-sessao-rodape { page-break-inside: avoid !important; }
    }
    @media screen {
      #inv-a4-container-principal, #factura80-container-inv80 {
        position: fixed !important; top: -9999px !important; left: -9999px !important;
        z-index: -1 !important;
      }
    }
  `;
  console.log('✅ [STYLES] Estilos de impressão aplicados para', format);
}

// Expor funções globalmente para debug
window.loadInvoiceAssets = loadInvoiceAssets;
window.areInvoiceAssetsLoaded = areInvoiceAssetsLoaded;
window.resetInvoiceAssetsState = resetInvoiceAssetsState;
window.invoiceAssetsState = invoiceAssetsState;
window.applyInvoicePrintStyles = applyInvoicePrintStyles;


   
      /* ================================================
   FIM do Invoice Assets Module

   ================================================ */



/* ================================================
   MÓDULO: Cliente Service
   Ficheiro: assets/js/services/cliente.service.js
   Parte do sistema Dash-POS
   ================================================ */

/**
 * Busca o ID do cliente padrão "Consumidor Final" do banco de dados
 * Deve ser chamada na inicialização do app
 */
async function carregarClientePadrao() {
  console.log('🔍 Buscando cliente padrão (Consumidor Final)...');
  
  try {
    const response = await fetch('http://localhost/Dash-POS/api/cliente.php?acao=buscar_consumidor_final', {
      method: 'GET',
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.sucesso && data.cliente && data.cliente.idcliente) {
      idClientePadrao = parseInt(data.cliente.idcliente);
      nomeClientePadrao = data.cliente.nome || 'Consumidor Final';
      console.log('✅ Cliente padrão carregado:', {
        id: idClientePadrao,
        nome: nomeClientePadrao
      });
    } else {
      console.error('❌ Cliente padrão não encontrado no banco');
      throw new Error('Cliente "Consumidor Final" não encontrado no sistema');
    }
    
  } catch (error) {
    console.error('❌ Erro ao carregar cliente padrão:', error);
    
    // Alerta crítico para o usuário
    if (typeof showCriticalAlert === 'function') {
      showCriticalAlert(
        'ERRO CRÍTICO: Cliente "Consumidor Final" não encontrado. ' +
        'Entre em contato com o suporte técnico.',
        0 // Não fecha automaticamente
      );
    }
    
    throw error;
  }
}

/**
 * Lista todos os clientes da API.
 * Retorna array de clientes ou [] em caso de erro/timeout.
 */
async function listarClientes() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('../api/cliente.php?acao=listar_cliente', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.sucesso) {
      console.log('✅ Clientes carregados:', (data.clientes || []).length);
      return data.clientes || [];
    } else {
      console.error('❌ Erro ao carregar clientes:', data.erro);
      return [];
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('⏱️ Timeout ao carregar clientes');
    } else {
      console.error('❌ Erro na requisição de clientes:', error);
    }
    return [];
  }
}

/**
 * Cria ou encontra um cliente na API.
 * @param {{ nome: string, telefone?: string|null, email?: string|null, endereco?: string|null, nif?: string|null }} dadosCliente
 * @returns {Promise<{ sucesso: boolean, id_cliente?: number, erro?: string }>}
 */
async function verificarOuCriarCliente(dadosCliente) {
  try {
    const response = await fetch('../api/cliente.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'verificar_cliente',
        nome: dadosCliente.nome,
        telefone: dadosCliente.telefone || null,
        email: dadosCliente.email || null,
        endereco: dadosCliente.endereco || null,
        nif: dadosCliente.nif || null
      })
    });

    const data = await response.json();
    return data; // { sucesso, id_cliente } ou { sucesso: false, erro }
  } catch (error) {
    console.error('❌ Erro ao verificar/criar cliente:', error);
    return { sucesso: false, erro: 'Erro ao conectar com o servidor' };
  }
}

   
      /* ================================================
   FIM do Cliente Service

   ================================================ */

/* ================================================
   MÓDULO: Pagamento Service
   Ficheiro: assets/js/services/pagamento.service.js
   Parte do sistema Dash-POS
   ================================================ */

/**
 * Carrega métodos de pagamento da API e renderiza no footer
 */
function loadFooterPaymentMethods() {
  const track = document.getElementById('paymentMethodsTrack');
  if (!track) {
    console.warn('⚠️ Track de métodos de pagamento não encontrado');
    return;
  }

  console.log('🔄 [FOOTER] Carregando métodos de pagamento...');

  fetch("../api/pagamento.php?acao=listar_pagamento", {
    method: "GET",
    cache: "no-store"
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.sucesso && Array.isArray(data.pagamentos)) {
        footerPaymentMethods = data.pagamentos
          .filter(p => p.ativo === "1")
          .map(item => ({
            id: item.idpagamento || item.id,
            nome: item.forma,
            slug: generatePaymentSlug(item.forma)
          }));
        console.log('✅ [FOOTER] Carregados', footerPaymentMethods.length, 'métodos');
      } else {
        console.warn('⚠️ [FOOTER] Sem métodos de pagamento:', data.mensagem || data.erro);
        footerPaymentMethods = [];
      }
      renderFooterPaymentCards();
    })
    .catch(error => {
      console.error('❌ [FOOTER] Erro ao carregar métodos:', error);
      // Fallback
      footerPaymentMethods = [
        { id: 1, nome: 'Dinheiro', slug: 'dinheiro' },
        { id: 2, nome: 'TPA', slug: 'tpa' },
        { id: 3, nome: 'Transferência', slug: 'transferencia' }
      ];
      renderFooterPaymentCards();
    });
}



   
      /* ================================================
   FIM Pagamento Service

   ================================================ */



/* ================================================
   MÓDULO: Pedido Service
   Ficheiro: assets/js/services/pedido.service.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= NOVA FUNÇÃO: SYNC PARA API ======= */
/* ======= NOVA FUNÇÃO: SYNC PARA API - CORRIGIDA ======= */
function syncToAPI(id, qtyOverride = null, priceOverride = null) {
  const product = PRODUCTS.find(p => p.id === id);
  const isServico = product && product.ps && product.ps.toLowerCase() === 's';

  console.log("=== SYNC TO API ===");
  console.log("🔍 DEBUG syncToAPI:", {
    id: id,
    nome: product?.name,
    ps: product?.ps,
    isServico: isServico,
    impostos: product?.impostos,
    qtyOverride: qtyOverride,
    priceOverride: priceOverride
  });

  const payload = { id: id };

  if (qtyOverride !== null) {
    payload.qty = parseInt(qtyOverride);
  }

  if (priceOverride !== null) {
    payload.preco = parseFloat(priceOverride).toFixed(2);
  }

  if (product && product.impostos) {
    payload.impostos = parseInt(product.impostos);
  }

  console.log("Payload enviado:", JSON.stringify(payload, null, 2));
  console.log("==================");

  fetch("http://localhost/Dash-POS/api/pedido.php?acao=adicionar_pedido", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(response => {
      // ✅ CAPTURA O TEXTO RAW PRIMEIRO
      return response.text().then(text => {
        console.log("📥 Resposta RAW do servidor:", text);

        // ✅ Verifica se é HTML (erro PHP)
        if (text.trim().startsWith('<')) {
          console.error("❌ SERVIDOR RETORNOU HTML (erro PHP):");
          console.error(text.substring(0, 500)); // Primeiros 500 chars
          throw new Error('Servidor retornou HTML em vez de JSON. Verifique os logs do PHP.');
        }

        // ✅ Verifica se response foi OK
        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}: ${text}`);
        }

        // ✅ Tenta parsear JSON
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error("❌ Erro ao parsear JSON:", e);
          console.error("Texto recebido:", text);
          throw new Error('Resposta inválida do servidor (não é JSON válido)');
        }
      });
    })
    .then(data => {
      console.log("=== SYNC API RESPOSTA ===");
      console.log("Resposta parseada:", JSON.stringify(data, null, 2));
      console.log("Sucesso?", data.sucesso);

      if (!data.sucesso && data.erros && data.erros.length > 0) {
        const erro = data.erros[0];
        console.log("❌ ERRO DO BACKEND:", erro);

        if (erro.erro && erro.erro.includes('Stock insuficiente')) {
          console.log("⚠️ Stock insuficiente!");
          const productName = erro.nome || 'Produto';
          const available = erro.stock_disponivel || '0';
          const requested = erro.quantidade_pedida || '0';

          // Exibe alerta crítico com auto-dismiss de 3 segundos
          showCriticalAlert(`${productName}: Quantidade solicitada (${requested}) excede o stock disponível (${available}).`, 3000);
        } else {
          alert(erro.erro || data.mensagem || 'Erro desconhecido');
        }
      } else if (!data.sucesso) {
        console.warn("Falha geral na API:", data);
        alert(data.mensagem || 'Falha na sincronização');
      } else {
        console.log("✅ Sync sucesso!");
        loadCartFromAPI();
      }
    })
    .catch(error => {
      console.error("❌ Erro no fetch/sync:", error);
      console.error("Stack trace:", error.stack);

      // ✅ Mensagem mais informativa
      if (error.message.includes('HTML')) {
        alert('Erro no servidor PHP. Verifique o console para detalhes.');
      } else {
        alert('Erro de conexão com a API: ' + error.message);
      }
    });
}

/* ======= NOVA FUNÇÃO: CARREGAR CARRINHO DO DB ======= */
function loadCartFromAPI() {
  // ✅ NÃO recarrega o carrinho se o usuário estiver editando a quantidade
  if (modoEdicao) {
    console.log('⏸️ loadCartFromAPI bloqueado - usuário está editando');
    return Promise.resolve();
  }

  // ✅ NÃO recarrega o carrinho durante a troca de cards
  if (isSwitchingCards) {
    console.log('⏸️ loadCartFromAPI bloqueado - trocando entre cards');
    return Promise.resolve();
  }

  return fetch("http://localhost/Dash-POS/api/pedido.php?acao=listar_pedido", {
    method: "GET",
    cache: "no-store"
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("=== LOAD CART FROM API ===");
      console.log("Resposta full:", JSON.stringify(data, null, 2));

      if (!data.sucesso) {
        console.warn("Falha no loadCarrinho:", data.mensagem);
        cart.clear();
        renderCart();
        if (typeof skeletonMarkCartReady === 'function') skeletonMarkCartReady();
        return Promise.resolve();
      }

      const itensDB = data.itens || [];
      const resumoDB = data.resumo || {};  // ✅ NOVO: Pega resumo do backend

      if (PRODUCTS.length === 0) {
        console.log("PRODUCTS ainda vazio, retry em 100ms...");
        setTimeout(loadCartFromAPI, 100);
        return Promise.resolve();
      }

      const newHash = itensDB.map(item => `${item.cardapio_id}:${item.qty}:${item.preco}`).join('|');

      if (newHash === lastCartHash) {
        console.log("Carrinho DB não mudou — skip update.");
        return;
      }
      lastCartHash = newHash;

      cart.clear();

      itensDB.forEach(item => {
        const id = parseInt(item.cardapio_id);
        const productFromDB = {
          id: id,
          name: item.produto_nome,
          price: parseFloat(item.preco),
          available: parseInt(item.stock_atual) > 0,
          cat: 'Todos Produtos',
          img: ''
        };

        const fullProduct = PRODUCTS.find(p => p.id === id);
        if (fullProduct) {
          productFromDB.cat = fullProduct.cat;
          productFromDB.img = fullProduct.img;
          console.log(`Item enriquecido com PRODUCTS: ${item.produto_nome} (ID: ${id})`);
        } else {
          productFromDB.img = placeholderIMG(item.produto_nome);
          console.log(`Item do JSON puro: ${item.produto_nome} (ID: ${id}, sem match em PRODUCTS)`);
        }

        cart.set(id, {
          product: productFromDB,
          qty: parseInt(item.qty),
          customPrice: parseFloat(item.preco)
        });
      });

      console.log(`Carrinho populado 100% do JSON: ${itensDB.length} itens. Map size: ${cart.size}`);

      // ✅ PASSA O RESUMO DO BACKEND PARA O RENDER
      renderCart(resumoDB);
      if (typeof skeletonMarkCartReady === 'function') skeletonMarkCartReady();
    })
    .catch(error => {
      console.error("Erro no loadCartFromAPI:", error);
      cart.clear();
      renderCart();
      if (typeof skeletonMarkCartReady === 'function') skeletonMarkCartReady();
    });
}



         /* ================================================
   FIM do Pedido Service

   ================================================ */




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

         
         
         
         /* ================================================
   FIM do Produto Service

   ================================================ */

   