/* ======= MOCK DE DADOS (preenchido pela API) ======= */
let PRODUCTS = [];

// ✅ REMOVIDO: TAX_RATE e DISCOUNT
// Todos os cálculos vêm do backend via loadCartFromAPI()
const currency = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 2 });

/* ======= ESTADO ======= */
let activeCategory = "Todos Produtos";
let searchTerm = "";
let modoEdicao = false;       // mantém do seu fluxo
let estaPesquisando = false;  // mantém do seu fluxo
const cart = new Map();       // id -> {product, qty, customPrice}
let searchResults = [];  // Novo: Armazena resultados da busca do servidor
let currentCartTotal = 0;  // Total atual do carrinho (usado pelos cards de pagamento)
let selectedPaymentMethod = null;  // Método de pagamento atualmente selecionado
let footerPaymentMethods = [];  // Array de métodos de pagamento carregados
let footerValoresPorMetodo = {};  // Valores por método de pagamento
let footerCashAmount = '0';  // Valor digitado no input do footer

// ✅ ESTADO: Controlo de edição inline dos cards do carrinho
let isSwitchingCards = false;        // Impede reload do carrinho durante troca de card expandido
let isPriceEditCancelled = false;    // Flag para cancelamento de edição de preço via ESC
let quantityInputIsSelected = false; // Controla se o texto do input de qtd está seleccionado

// ✅ SSE: Variável global para conexão Server-Sent Events
let sseConnection = null;
let sseReconnectAttempts = 0;
const SSE_MAX_RECONNECT_ATTEMPTS = 5;
const SSE_RECONNECT_DELAY = 3000; // 3 segundos

// ✅ CONTROLE DE TIPO DE DOCUMENTO (FATURA)
const tiposDesenvolvidos = ['fatura-recibo', 'fatura-proforma', 'fatura', 'orcamento']; // Tipos já implementados
let tipoDocumentoAtual = 'fatura-recibo'; // Tipo padrão

// ✅ NOVO: Formato de fatura selecionado (A4 ou 80mm)
let formatoFaturaAtual = 'A4'; // Formato padrão

/**
 * Garante que fatura80.js seja carregado antes de processar
 * @returns {Promise<boolean>} true se carregado com sucesso
 */




/* ======================================================
   SISTEMA DE CARREGAMENTO DINÂMICO DE FATURAS
   ====================================================== */

/**
 * Estado de carregamento dos recursos de fatura
 * Rastreia quais arquivos CSS já foram carregados
 */
const invoiceAssetsState = {
  css: {
    a4: false,      // fatura.css
    mm80: false     // fatura80.css
  }
};

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
      await loadCSS('../assets/css/fatura.css', 'fatura-a4-css');
      invoiceAssetsState.css.a4 = true;
    }
    if (!invoiceAssetsState.css.mm80) {
      await loadCSS('../assets/css/fatura80.css', 'fatura-80mm-css');
      invoiceAssetsState.css.mm80 = true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('fatura80-container-inv80');
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
    throw new Error(`Falha ao carregar recursos de fatura: ${error.message}`);
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
           #fatura80-container-inv80 { display: none !important; }`
        : `#fatura80-container-inv80 {
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
      #inv-a4-container-principal, #fatura80-container-inv80 {
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




// NOVO: ID do cliente padrão (Consumidor Final)
let idClientePadrao = null; // Será preenchido via API

let lastCartHash = null;  // Pra otimizar: só atualiza se mudou
let lastExpandedProductId = null; // Rastreia o último produto que ficou expansivo

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

/* guarda a key das categorias para evitar rebuild desnecessário */
let lastCategoriesKey = null;

/* ======= NOVA FUNÇÃO: SYNC PARA API ======= */

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

/* ======= NOVA FUNÇÃO: CARREGAR CARRINHO DO DB ======= */
function loadCartFromAPI() {
  // ✅ NÃO recarrega o carrinho se o usuário estiver editando a quantidade
  if (modoEdicao) {
    console.log('⏸️ loadCartFromAPI bloqueado - usuário está editando');
    return;
  }

  // ✅ NÃO recarrega o carrinho durante a troca de cards
  if (isSwitchingCards) {
    console.log('⏸️ loadCartFromAPI bloqueado - trocando entre cards');
    return;
  }

  fetch("http://localhost/Dash-POS/api/pedido.php?acao=listar_pedido", {
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
        return;
      }

      const itensDB = data.itens || [];
      const resumoDB = data.resumo || {};  // ✅ NOVO: Pega resumo do backend

      if (PRODUCTS.length === 0) {
        console.log("PRODUCTS ainda vazio, retry em 100ms...");
        setTimeout(loadCartFromAPI, 100);
        return;
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
//const placeOrderBtn = document.getElementById('placeOrder');

//const placeOrderOverlayBtn = document.getElementById('placeOrderOverlay');


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

/* ======= FETCH ======= */
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
      console.log('✅ Cliente padrão carregado:', {
        id: idClientePadrao,
        nome: data.cliente.nome || 'Consumidor Final'
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

/** Skeleton loading: marcar produtos como prontos e eventualmente esconder skeleton */
function skeletonMarkProductsReady() {
  window.__skeletonProductsReady = true;
  skeletonTryHide();
}

/** Skeleton loading: marcar carrinho como pronto e eventualmente esconder skeleton */
function skeletonMarkCartReady() {
  window.__skeletonCartReady = true;
  skeletonTryHide();
}

function skeletonTryHide() {
  if (!window.__skeletonProductsReady || !window.__skeletonCartReady) return;
  const el = document.getElementById('appSkeleton');
  if (!el) return;
  window.__skeletonHidden = true;
  el.classList.add('hidden');
  el.setAttribute('aria-hidden', 'true');
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
/* ======= CATEGORY SLIDER ======= */
function buildCategories(orderIn = null, countsIn = null, preserveScroll = false) {
  const counts = countsIn || (() => {
    const c = {};
    for (const p of PRODUCTS) { c[p.cat] = (c[p.cat] || 0) + 1; }
    c["Todos Produtos"] = PRODUCTS.length;
    return c;
  })();

  const order = orderIn || ["Todos Produtos", ...Object.keys(counts).filter(c => c !== "Todos Produtos").sort()];

  let oldScroll = 0;
  const oldViewport = categoryBar.querySelector('.cat-viewport');
  if (preserveScroll && oldViewport) {
    oldScroll = oldViewport.scrollLeft || 0;
  }

  categoryBar.innerHTML = `
    <div class="cat-slider">
      <button class="cat-arrow prev" aria-label="Anterior" type="button">
        <span aria-hidden="true">‹</span>
      </button>
      <div class="cat-viewport" id="catViewport">
        <div class="cat-track" id="catTrack">
          ${order.map(cat => `
            <button class="category ${cat === activeCategory ? 'is-active' : ''}" data-cat="${cat}">
              <span class="cat-name">${cat}</span>
              <span class="cat-count">${counts[cat] || 0}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <button class="cat-arrow next" aria-label="Próximo" type="button">
        <span aria-hidden="true">›</span>
      </button>
    </div>
  `;

  const viewport = categoryBar.querySelector('#catViewport');
  const track = categoryBar.querySelector('#catTrack');
  const prevBtn = categoryBar.querySelector('.cat-arrow.prev');
  const nextBtn = categoryBar.querySelector('.cat-arrow.next');

  track.addEventListener('click', (e) => {
    const btn = e.target.closest('.category');
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    track.querySelectorAll('.category').forEach(b => b.classList.toggle('is-active', b === btn));
    renderProducts();
  });

  function pageSize() { return Math.max(viewport.clientWidth * 0.85, 180); }
  function scrollByPage(dir) {
    viewport.scrollBy({ left: dir * pageSize(), behavior: 'smooth' });
  }
  prevBtn.addEventListener('click', () => scrollByPage(-1));
  nextBtn.addEventListener('click', () => scrollByPage(+1));

  function updateWheelBlock() {
    if (!isMobileView()) {
      if (!viewport._wheelBlocked) {
        viewport.addEventListener('wheel', wheelBlocker, { passive: false });
        viewport._wheelBlocked = true;
      }
      viewport.style.overflowX = 'hidden';
    } else {
      if (viewport._wheelBlocked) {
        viewport.removeEventListener('wheel', wheelBlocker, { passive: false });
        viewport._wheelBlocked = false;
      }
      viewport.style.overflowX = 'auto';
    }
  }
  function wheelBlocker(e) { e.preventDefault(); }

  function atStart() { return viewport.scrollLeft <= 2; }
  function atEnd() {
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth - 2);
    return viewport.scrollLeft >= maxScroll;
  }
  function updateArrows() {
    const mobile = isMobileView();
    prevBtn.style.display = mobile ? 'none' : '';
    nextBtn.style.display = mobile ? 'none' : '';
    if (!mobile) {
      prevBtn.disabled = atStart();
      nextBtn.disabled = atEnd();
      categoryBar.classList.toggle('has-left-shadow', !atStart());
      categoryBar.classList.toggle('has-right-shadow', !atEnd());
    } else {
      categoryBar.classList.remove('has-left-shadow', 'has-right-shadow');
    }
  }

  viewport.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', () => { updateWheelBlock(); updateArrows(); });

  if (preserveScroll && oldScroll && viewport) {
    requestAnimationFrame(() => {
      const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      viewport.scrollLeft = Math.min(oldScroll, max);
      updateArrows();
    });
  } else {
    updateWheelBlock();
    updateArrows();
  }
}

/* ======= RENDER PRODUCTS ======= */
/* ======= RENDER PRODUCTS ======= */
/* ======= RENDER PRODUCTS ======= */
/* ======= RENDER PRODUCTS ======= */

// Função para gerar cores suaves/pastéis para os placeholders
function getSoftColor(id) {
  // Array de cores suaves e pastéis
  const softColors = [
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Pêssego suave
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', // Lavanda suave
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // Azul céu suave
    'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', // Rosa-azul suave
    'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)', // Rosa suave
    'linear-gradient(135deg, #ffd1ff 0%, #ffddb7 100%)', // Rosa-pêssego suave
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', // Lilás-amarelo suave
    'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)', // Verde-amarelo suave
    'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)', // Cinza-azul suave
    'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)', // Amarelo suave
    'linear-gradient(135deg, #fab1a0 0%, #ff7675 100%)', // Coral suave
    'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)', // Azul-roxo suave
  ];

  // Retorna uma cor baseada no ID do produto
  return softColors[id % softColors.length];
}

function renderProducts() {
  let list;
  if (estaPesquisando) {
    list = searchResults;
  } else {
    list = PRODUCTS
      .filter(p => p.name !== undefined && p.name !== null);
  }

  list = list.filter(p => !estaPesquisando ? (activeCategory === "Todos Produtos" ? true : p.cat === activeCategory) : true);

  if (!estaPesquisando && searchTerm.length > 0) {
    list = list.filter(p => p.name.toLowerCase().includes(searchTerm));
  }

  if (list.length === 0) {
    productGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#8b8fa3; padding:20px;">Nenhum produto encontrado.</div>`;
    return;
  }

  // ✅ CORREÇÃO: Usa toUpperCase() para comparação
  productGrid.innerHTML = list.map(p => {
    const imgSrc = p.img || placeholderIMG(p.name);
    const isServico = p.ps && p.ps.toUpperCase() === 'S';

    // Define a classe do stock indicator baseado na quantidade
    let stockClass;
    let stockQuantity = p.stock || 0;

    if (isServico) {
      stockClass = 'service'; // Roxo para serviços
    } else if (stockQuantity > 6) {
      stockClass = 'available'; // Verde para > 6 unidades
    } else if (stockQuantity >= 1 && stockQuantity <= 6) {
      stockClass = 'low'; // Laranja para 1-6 unidades
    } else {
      stockClass = 'unavailable'; // Vermelho para 0 unidades
    }

    // Define o texto da quantidade (só para produtos)
    const stockText = isServico ? '' : `<span class="stock-quantity">${stockQuantity}</span>`;

    // Gera placeholder com as primeiras 2 letras do nome
    const placeholder = p.name.substring(0, 2).toUpperCase();

    // Pega a quantidade do carrinho se existir
    const currentQty = cart.has(p.id) ? cart.get(p.id).qty : 1;

    // Gera cor suave para o placeholder
    const softColor = getSoftColor(p.id);

    // Define o estilo do background (cor suave se não houver imagem)
    const cardImageStyle = !p.img ? `style="background: ${softColor};"` : '';

    return `
      <article class="card" data-id="${p.id}">
        <div class="card-image" ${cardImageStyle}>
          ${p.img ? `<img alt="${p.name}" src="${imgSrc}">` : `<span class="card-image-placeholder">${placeholder}</span>`}
          <button class="card-quick-add" onclick="event.stopPropagation()">+</button>
          <div class="overlay-blur">
            <div class="quantity-controls">
              <button class="quantity-btn" data-action="minus" onclick="event.stopPropagation()">−</button>
              <span class="quantity-display">${currentQty}</span>
              <button class="quantity-btn" data-action="plus" onclick="event.stopPropagation()">+</button>
            </div>
          </div>
        </div>
        <div class="card-content">
          <div class="card-title">${p.name}</div>
          <div class="card-footer">
            <div class="card-price">${currency.format(p.price)}</div>
            <div class="stock-indicator">
              <span class="card-stock ${stockClass}"></span>
              ${stockText}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');

  productGrid.querySelectorAll('.card').forEach(card => {
    const id = +card.dataset.id;

    // Atualiza seleção visual
    if (cart.has(id) && cart.get(id).qty > 0) {
      card.classList.add('is-selected');
      // Atualiza a quantidade exibida
      const qtyDisplay = card.querySelector('.quantity-display');
      if (qtyDisplay) qtyDisplay.textContent = cart.get(id).qty;
    } else {
      card.classList.remove('is-selected');
    }

    // Clique no card adiciona 1 item
    card.addEventListener('click', (e) => {
      // Não adiciona se clicou em um botão
      if (e.target.closest('.quantity-btn') || e.target.closest('.card-quick-add')) {
        return;
      }
      addToCart(id, 1);
    });

    // Botão quick add (adiciona 1 item)
    const quickAddBtn = card.querySelector('.card-quick-add');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', e => {
        e.stopPropagation();
        addToCart(id, 1);
      });
    }

    // Botões de quantidade no overlay
    const plusBtns = card.querySelectorAll('[data-action="plus"]');
    const minusBtns = card.querySelectorAll('[data-action="minus"]');

    plusBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        addToCart(id, 1);
        // Atualiza display imediatamente
        const qtyDisplay = card.querySelector('.quantity-display');
        if (qtyDisplay && cart.has(id)) {
          qtyDisplay.textContent = cart.get(id).qty;
        }
      });
    });

    minusBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        addToCart(id, -1);
        // Atualiza display imediatamente
        const qtyDisplay = card.querySelector('.quantity-display');
        if (qtyDisplay && cart.has(id)) {
          qtyDisplay.textContent = cart.get(id).qty;
        }
      });
    });
  });
}

// Função para abrir a modal de adicionar quantidade


// Atualiza o display da modal de quantidade


// Listeners para a modal de quantidade








/* Atualiza a seleção visual dos cards */
function updateProductSelections() {
  const cards = productGrid.querySelectorAll('.card');
  cards.forEach(card => {
    const id = +card.dataset.id;
    if (cart.has(id) && cart.get(id).qty > 0) {
      card.classList.add('is-selected');
      // Atualiza o display de quantidade
      const qtyDisplay = card.querySelector('.quantity-display');
      if (qtyDisplay) {
        qtyDisplay.textContent = cart.get(id).qty;
      }
    }
    else {
      card.classList.remove('is-selected');
      // Reset quantidade para 1 quando não selecionado
      const qtyDisplay = card.querySelector('.quantity-display');
      if (qtyDisplay) {
        qtyDisplay.textContent = '1';
      }
    }
  });
}

/* ======= CART ======= */
/* ======= CART ======= */
/* ======= CART ======= */
function renderCart(resumoServidor = null) {
  const items = [...cart.values()];

  // ✅ Atualiza os cards de produtos no novo layout
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
        // ✅ APENAS ESTE LISTENER (remova a linha duplicada)
        row.querySelector('[data-act="del"]').addEventListener('click', () => {
          console.log('🎯 [DEBUG] Botão DEL clicado para produto ID:', id);

          const cartItem = cart.get(id);
          console.log('🎯 [DEBUG] Cart item encontrado:', cartItem);

          if (cartItem && cartItem.product) {
            console.log('🎯 [DEBUG] Chamando showRemoveConfirmation com:', cartItem.product.name);
            showRemoveConfirmation(id, cartItem.product.name);
          } else {
            console.warn('🎯 [DEBUG] Cart item não encontrado para ID:', id);
            // Fallback
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

        // ✅ ADICIONAR O EVENT LISTENER PARA O BOTÃO DE EXCLUIR COM CONFIRMAÇÃO
        row.querySelector('[data-act="del"]').addEventListener('click', () => {
          console.log('🎯 [DEBUG] Botão DEL clicado (mobile) para produto ID:', id);

          const cartItem = cart.get(id);
          console.log('🎯 [DEBUG] Cart item encontrado (mobile):', cartItem);

          if (cartItem && cartItem.product) {
            console.log('🎯 [DEBUG] Chamando showRemoveConfirmation (mobile) com:', cartItem.product.name);
            showRemoveConfirmation(id, cartItem.product.name);
          } else {
            console.warn('🎯 [DEBUG] Cart item não encontrado (mobile) para ID:', id);
            // Fallback
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

  // ✅ Usa resumo do backend se disponível, senão calcula localmente
  let stats;
  let totalIliquido, totalImposto, totalRetencao, total;

  if (resumoServidor && resumoServidor.total_iliquido !== undefined) {
    // Backend disponível - usa valores do servidor
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
    // Fallback - calcula localmente
    console.warn('⚠️ Resumo do backend não disponível - calculando localmente');
    
    // Calcula valores localmente a partir do Map cart
    let subtotal = 0;
    let itemCount = 0;
    
    cart.forEach((cartItem) => {
      const price = cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
      const qty = parseInt(cartItem.qty) || 0;
      subtotal += price * qty;
      itemCount += qty;
    });
    
    stats = {
      items: itemCount,
      subtotal: subtotal
    };
    
    // Valores simplificados (sem impostos/retenções detalhados)
    totalIliquido = subtotal;
    totalImposto = 0;  // Seria necessário buscar do produto
    totalRetencao = 0;
    total = subtotal;
    
    // ❌ NÃO mostra erro - apenas aviso no console
    // O erro só deve aparecer se loadCartFromAPI() falhar explicitamente
  }

  // ✅ Exibe valores recebidos do backend (sem cálculos locais)
  if (cartItemsCount) cartItemsCount.textContent = `${stats.items}`;
  if (cartSubtotal) cartSubtotal.textContent = currency.format(totalIliquido);
  if (cartDiscount) cartDiscount.textContent = currency.format(totalRetencao);  // Retenção
  if (cartTax) cartTax.textContent = currency.format(totalImposto);  // Impostos
  if (cartTotalBtn) cartTotalBtn.textContent = currency.format(total);

  if (cartItemsCountOverlay) cartItemsCountOverlay.textContent = `${stats.items}`;
  if (cartSubtotalOverlay) cartSubtotalOverlay.textContent = currency.format(totalIliquido);
  if (cartDiscountOverlay) cartDiscountOverlay.textContent = currency.format(totalRetencao);
  if (cartTaxOverlay) cartTaxOverlay.textContent = currency.format(totalImposto);
  if (cartTotalBtnOverlay) cartTotalBtnOverlay.textContent = currency.format(total);

  if (typeof window.updateStickyCartBadge === 'function') window.updateStickyCartBadge();

  // ✅ Atualiza o Order Summary no footer (40% div)
  updateOrderSummaryFooter(totalIliquido, totalImposto, totalRetencao, total);

  updateProductSelections();

  // Re-verificar overflow do slider de métodos de pagamento após qualquer alteração no carrinho
  if (typeof scheduleRefreshPaymentMethodsOverflow === 'function') scheduleRefreshPaymentMethodsOverflow();
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

/* ======= SEARCH ======= */
// ✅ MODIFICADO: Busca no servidor com debounce
/* ======= SEARCH ======= */
// ✅ MODIFICADO: Busca no servidor com debounce
/* ======= SEARCH COM DUPLA FUNÇÃO (PESQUISA + CÓDIGO DE BARRAS) ======= */
const debouncedSearch = debounce(async () => {
  searchTerm = searchInput.value.trim();

  // Se estiver vazio, reseta
  if (searchTerm.length === 0) {
    estaPesquisando = false;
    searchResults = [];
    renderProducts();
    return;
  }

  // ✅ DETECTA SE É CÓDIGO DE BARRAS (apenas números, comprimento específico)
  const isLikelyBarcode = /^\d+$/.test(searchTerm) &&
    searchTerm.length >= BARCODE_CONFIG.minLength &&
    searchTerm.length <= BARCODE_CONFIG.maxLength;

  if (isLikelyBarcode) {
    console.log('🔍 Campo de pesquisa detectou código de barras:', searchTerm);
    // Não faz pesquisa imediata - espera Enter ou timeout
    return;
  }

  // Se não for código de barras, faz pesquisa normal
  estaPesquisando = true;
  activeCategory = "Todos Produtos";
  try {
    const response = await fetch(`http://localhost/Dash-POS/api/produtos.php?acao=pesquisar_prod&termo=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("❌ Resposta inválida da API (não é array):", data);
      searchResults = [];
    } else {
      searchResults = data.map((item, index) => {
        const idproduto = item.idproduto || item.id || item.ID || 0;
        const descricao = item.descricao || item.nome || item.name || item.produto || '';
        const venda = item.venda || item.preco || item.price || item.valor || 0;
        const preco_com_imposto = item.preco_com_imposto || venda;
        const qtd = item.qtd || item.quantidade || item.stock || item.estoque || 0;
        const ps = (item.ps || item.tipo || 'P').toUpperCase();
        const categoria = item.categoria_nome || item.categoria || item.cat || 'Todos Produtos';

        const isServico = ps === 'S';
        const stock = parseInt(qtd) || 0;

        return {
          id: parseInt(idproduto) || 0,
          cat: categoria,
          name: descricao || "Produto sem nome",
          price: parseFloat(preco_com_imposto) || 0,
          preco_base: parseFloat(venda) || 0,
          impostos: parseInt(item.impostos) || null,
          imposto_percentagem: parseFloat(item.imposto_percentagem) || 0,
          imposto_descricao: item.imposto_descricao || '',
          available: isServico ? true : (stock > 0),
          ps: ps,
          barra: item.barra || null,
          stock: stock,
          img: ""
        };
      });
    }
    renderProducts();
  } catch (error) {
    console.error("💥 Erro na busca:", error);
    searchResults = [];
    renderProducts();
  }
}, 300);

/* ======= LISTENER PARA ENTER NO CAMPO DE PESQUISA ======= */
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const term = searchInput.value.trim();

    if (term.length === 0) {
      return; // Ignora Enter em campo vazio
    }

    // ✅ VERIFICA SE É CÓDIGO DE BARRAS
    const isLikelyBarcode = /^\d+$/.test(term) &&
      term.length >= BARCODE_CONFIG.minLength &&
      term.length <= BARCODE_CONFIG.maxLength;

    if (isLikelyBarcode) {
      e.preventDefault();
      console.log('🎯 Enter pressionado com código de barras:', term);

      // 🔒 VERIFICA SE O LEITOR ESTÁ ATIVO
      if (!isBarcodeEnabled) {
        console.log('🚫 Leitor bloqueado - Ignorando código:', term);
        showAlert('warning', '🔒 Leitor Bloqueado', 'Ative o leitor para escanear produtos', 2000);

        // Limpa o campo
        searchInput.value = '';
        searchTerm = '';
        estaPesquisando = false;
        searchResults = [];
        renderProducts();
        return;
      }

      // Processa como código de barras
      processBarcodeFromSearch(term);

    } else {
      // Se não for código de barras, faz pesquisa normal com Enter
      console.log('🔍 Enter pressionado com termo de pesquisa:', term);
      debouncedSearch();
    }
  }
});

/* ======= FUNÇÃO PARA PROCESSAR CÓDIGO DE BARRAS DO CAMPO DE PESQUISA ======= */
async function processBarcodeFromSearch(barcode) {
  if (isProcessingBarcode) {
    console.log('⚠️ Já está processando um código');
    return;
  }

  isProcessingBarcode = true;
  barcodeStats.total++;

  // Feedback visual no wrapper
  const searchWrapper = document.querySelector('.search-wrapper');
  if (searchWrapper) {
    searchWrapper.classList.add('barcode-mode');
  }

  console.log('🔍 Processando código de barras do campo de pesquisa:', barcode);

  try {
    // ✅ BUSCA DIRETO NO ARRAY PRODUCTS
    const produto = PRODUCTS.find(p => p.barra && p.barra.trim() === barcode.trim());

    if (produto) {
      console.log('✅ Produto encontrado via código de barras:', produto.name);

      // ✅ ADICIONA AO CARRINHO
      addToCart(produto.id, 1);

      // Feedback de sucesso
      showAlert('success', '✅ Adicionado', `${produto.name} foi adicionado ao pedido via código de barras`);

      // Feedback visual de sucesso
      if (searchWrapper) {
        searchWrapper.classList.remove('barcode-mode');
        searchWrapper.classList.add('barcode-success');
        setTimeout(() => searchWrapper.classList.remove('barcode-success'), 1000);
      }

      // Atualiza estatísticas
      barcodeStats.success++;
      barcodeStats.history.unshift({
        barcode,
        produto: produto.name,
        timestamp: new Date().toISOString(),
        success: true,
        source: 'search_field'
      });

    } else {
      // Produto não encontrado
      console.warn('❌ Código não encontrado:', barcode);
      showAlert('error', '❌ Não Encontrado', 'Código de barras não cadastrado no sistema');

      // Feedback visual de erro
      if (searchWrapper) {
        searchWrapper.classList.remove('barcode-mode');
        searchWrapper.classList.add('barcode-error');
        setTimeout(() => searchWrapper.classList.remove('barcode-error'), 1000);
      }

      barcodeStats.errors++;
      barcodeStats.history.unshift({
        barcode,
        produto: null,
        timestamp: new Date().toISOString(),
        success: false,
        error: 'Produto não encontrado',
        source: 'search_field'
      });
    }

  } catch (error) {
    console.error('💥 Erro ao processar código de barras:', error);
    showAlert('error', '❌ Erro', 'Erro ao processar o código de barras');
    barcodeStats.errors++;

    // Feedback visual de erro
    if (searchWrapper) {
      searchWrapper.classList.remove('barcode-mode');
      searchWrapper.classList.add('barcode-error');
      setTimeout(() => searchWrapper.classList.remove('barcode-error'), 1000);
    }

  } finally {
    // ✅ SEMPRE LIMPA O CAMPO E RESETA A PESQUISA
    searchInput.value = '';
    searchTerm = '';
    estaPesquisando = false;
    searchResults = [];
    renderProducts();

    isProcessingBarcode = false;
  }
}

/* ======= ATUALIZAR FUNÇÃO clearSearch ======= */
searchInput.addEventListener('input', debouncedSearch);

clearSearch.addEventListener('click', () => {
  searchInput.value = "";
  searchTerm = "";
  estaPesquisando = false;
  searchResults = [];
  searchInput.focus();
  renderProducts();
  var inner = document.getElementById('searchBarInner');
  if (inner && inner.parentElement && inner.parentElement.id === 'headerSearchSlot') {
    var w = document.querySelector('.search-wrapper');
    if (w) { w.classList.add('search-wrapper--collapsed'); w.classList.remove('search-wrapper--expanded'); }
  }
});

/* ======= HEADER SEARCH MOBILE (≤905px): expandir/colapsar ao clicar no ícone ======= */
(function setupHeaderSearchToggle() {
  function isHeaderSearchMode() {
    var inner = document.getElementById('searchBarInner');
    return inner && inner.parentElement && inner.parentElement.id === 'headerSearchSlot';
  }
  document.addEventListener('click', function (e) {
    if (!isHeaderSearchMode()) return;
    var wrapper = document.querySelector('.search-wrapper');
    if (!wrapper) return;
    var slot = document.getElementById('headerSearchSlot');
    if (e.target.closest('#headerSearchSlot') && (e.target.closest('.search-icon-left') || (wrapper.classList.contains('search-wrapper--collapsed') && e.target.closest('.search-wrapper')))) {
      wrapper.classList.remove('search-wrapper--collapsed');
      wrapper.classList.add('search-wrapper--expanded');
      searchInput.focus();
      e.preventDefault();
    } else if (!e.target.closest('#headerSearchSlot')) {
      wrapper.classList.remove('search-wrapper--expanded');
      wrapper.classList.add('search-wrapper--collapsed');
    }
  });
})();

/* ======= GLOBAL BUTTONS ======= */
//Comentado/removido o listener original do placeOrder, pois agora a modal cuida disso
// Novo: Abre a modal de checkout


clearCartBtn?.addEventListener('click', () => clearCart());

/* ======= MAIN MENU (nav) ======= */
document.querySelectorAll('.main .main-nav .nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.main .main-nav .nav-link').forEach(x => x.classList.remove('is-active'));
    btn.classList.add('is-active');
  });
});

/* ======= DATETIME & INIT ======= */
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

  // Search no header em ≤905px: move searchBarInner para headerSearchSlot ou devolve ao search-bar-container
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
/* ======= INIT ======= */
function init() {
  // ✅ NOVO: Carrega cliente padrão ANTES de tudo
  carregarClientePadrao()
    .then(() => {
      console.log('✅ App inicializado com cliente padrão');
      
      // Continua inicialização normal
      carregarProdutos();
      loadCartFromAPI();
      updateDateTime();
      setInterval(updateDateTime, 30000);
      updateResponsiveUI();
      window.addEventListener('resize', updateResponsiveUI);
      
      // ✅ SSE: Substitui o polling de 500ms por conexão persistente
      initSSE();
      
      // ✅ NOVO: Inicializa sistema de seleção de formato
      initInvoiceFormat();
      
      // ✅ CRITICAL: Initialize Pay button AFTER DOM is ready
      initPayButton();
      
      console.log('✅ [INIT] Todas as inicializações concluídas');
    })
    .catch(error => {
      console.error('❌ Falha crítica na inicialização:', error);
      if (typeof skeletonMarkProductsReady === 'function') skeletonMarkProductsReady();
      if (typeof skeletonMarkCartReady === 'function') skeletonMarkCartReady();
      // Bloqueia o app até resolver
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

/* ======= SSE (Server-Sent Events) - Substitui Polling ======= */
/**
 * Inicializa conexão SSE com o backend
 * Substitui o polling de 500ms por eventos em tempo real
 */
function initSSE() {
  // Se já existe conexão, fecha antes
  if (sseConnection) {
    console.log('⚠️ SSE: Fechando conexão anterior');
    sseConnection.close();
    sseConnection = null;
  }

  console.log('🔗 SSE: Iniciando conexão com api/stream.php');

  try {
    // Cria nova conexão EventSource
    sseConnection = new EventSource('http://localhost/Dash-POS/api/stream.php');

    // 1. EVENTO: Conexão estabelecida
    sseConnection.addEventListener('connected', (e) => {
      const data = JSON.parse(e.data);
      console.log('✅ SSE: Conectado!', data);
      sseReconnectAttempts = 0; // Reset contador de reconexões
    });

    // 2. EVENTO: Produtos foram atualizados
    sseConnection.addEventListener('produtos_updated', (e) => {
      const data = JSON.parse(e.data);
      console.log('📦 SSE: Produtos atualizados', data);

      // Só recarrega se NÃO estiver pesquisando ou editando
      if (!modoEdicao && !estaPesquisando) {
        console.log('🔄 Recarregando produtos...');
        carregarProdutos();
      } else {
        console.log('⏸️ Recarga pausada (modo edição ou pesquisa ativo)');
      }
    });

    // 3. EVENTO: Carrinho foi atualizado
    sseConnection.addEventListener('pedido_updated', (e) => {
      const data = JSON.parse(e.data);
      console.log('🛍️ SSE: Carrinho atualizado', data);

      // Só recarrega se NÃO estiver editando
      if (!modoEdicao) {
        console.log('🔄 Recarregando carrinho...');
        loadCartFromAPI();
      } else {
        console.log('⏸️ Recarga pausada (modo edição ativo)');
      }
    });

    // 4. EVENTO: Heartbeat (mantém conexão viva)
    sseConnection.addEventListener('heartbeat', (e) => {
      const data = JSON.parse(e.data);
      console.log('💓 SSE: Heartbeat', data.timestamp);
    });

    // 5. ERRO: Problema na conexão
    sseConnection.onerror = (error) => {
      console.error('❌ SSE: Erro na conexão', error);

      // Fecha conexão com problema
      sseConnection.close();
      sseConnection = null;

      // Tenta reconectar após delay
      if (sseReconnectAttempts < SSE_MAX_RECONNECT_ATTEMPTS) {
        sseReconnectAttempts++;
        console.log(`🔄 SSE: Tentando reconectar (${sseReconnectAttempts}/${SSE_MAX_RECONNECT_ATTEMPTS})...`);

        setTimeout(() => {
          initSSE();
        }, SSE_RECONNECT_DELAY);
      } else {
        console.error('❌ SSE: Máximo de tentativas de reconexão atingido');
        console.warn('⚠️ Caindo de volta para polling manual');
        // TODO: Opcional - implementar fallback para polling se SSE falhar
      }
    };

    // 6. OPEN: Conexão aberta com sucesso
    sseConnection.onopen = () => {
      console.log('✅ SSE: Conexão aberta e pronta');
    };

  } catch (error) {
    console.error('❌ SSE: Erro ao inicializar', error);
  }
}

/**
 * Fecha conexão SSE (chamado ao sair da página)
 */
function closeSSE() {
  if (sseConnection) {
    console.log('🔒 SSE: Fechando conexão');
    sseConnection.close();
    sseConnection = null;
  }
}

// Fecha SSE quando usuário sai da página
window.addEventListener('beforeunload', closeSSE);

/* ======= CONTROLE DE TIPO DE DOCUMENTO ======= */
/**
 * Função para selecionar tipo de documento
 * Valida se o tipo já foi desenvolvido
 */
/* ======= CONTROLE DE TIPO DE DOCUMENTO - VERSÃO CORRIGIDA ======= */

/**
 * Retorna o tipo de documento atualmente selecionado
 */
function getTipoDocumentoAtual() {
  return tipoDocumentoAtual;
}

/**
 * Seleciona o formato de fatura (A4 ou 80mm)
 * Sincroniza todos os radio buttons e atualiza a interface
 */
function selecionarFormatoFatura(formato) {
  console.log(`📐 [FORMATO] Selecionando formato: ${formato}`);
  
  // ✅ 1. Valida formato
  if (formato !== 'A4' && formato !== '80mm') {
    console.warn(`⚠️ [FORMATO] Formato inválido: ${formato}. Usando A4.`);
    formato = 'A4';
  }
  
  // ✅ 2. Atualiza variável global
  formatoFaturaAtual = formato;
  
  // ✅ 3. Salva em localStorage
  localStorage.setItem('invoiceFormat', formato);
  
  // ✅ 4. Sincroniza TODOS os radio buttons
  const allRadios = document.querySelectorAll('input[name="invoiceFormat"]');
  allRadios.forEach(radio => {
    radio.checked = (radio.value === formato);
    
    // Atualiza classe visual do toggle pai
    const toggleParent = radio.closest('.format-toggle-option');
    if (toggleParent) {
      if (radio.value === formato) {
        toggleParent.classList.add('active');
      } else {
        toggleParent.classList.remove('active');
      }
    }
  });
  
  // ✅ 5. Atualiza display no cabeçalho do carrinho
  updateInvoiceFormatDisplay(formato);

  if (typeof updateStickyDocTypeLabel === 'function') updateStickyDocTypeLabel();

  // Fatura-Recibo (A4 ou 80mm): garantir que a aba Desc. e os blocos do rodapé ficam sem cadeado
  if (typeof window.updateOrderSummaryDescTabState === 'function') window.updateOrderSummaryDescTabState();
  var currentType = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
  if (typeof updateCartFooterLockIcons === 'function') updateCartFooterLockIcons(currentType);

  console.log(`✅ [FORMATO] Formato selecionado: ${formato}`);
}

/**
 * Retorna o formato de fatura atualmente selecionado
 */
function getInvoiceFormat() {
  return formatoFaturaAtual;
}

/**
 * Inicializa o formato de fatura (chamado no carregamento)
 */
function initInvoiceFormat() {
  // Tenta carregar do localStorage
  const savedFormat = localStorage.getItem('invoiceFormat');
  const initialFormat = savedFormat || 'A4';
  
  console.log(`🔧 [FORMATO] Inicializando com formato: ${initialFormat}`);
  
  // Aplica seleção inicial
  selecionarFormatoFatura(initialFormat);
}

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

// ===== FUNÇÕES DE MODAL DE STOCK REMOVIDAS =====
// Substituído por showCriticalAlert para alertas de stock insuficiente

/** Remove ícone/emoji no início do texto para evitar duplicar o ícone do próprio alerta */
function stripLeadingIcon(str) {
  if (typeof str !== 'string') return str;
  let s = str.trimStart();
  if (!s.length) return str;
  const first = s[0];
  if (!/\p{L}/u.test(first) && !/\p{N}/u.test(first)) {
    s = s.slice(1);
    if (s.length && (s[0] === '\uFE0F' || /\p{M}/u.test(s[0]))) s = s.slice(1);
    s = s.trimStart();
  }
  return s;
}

// Função para criar e exibir alertas
function showAlert(type, title, message, duration = 4000) {
  title = stripLeadingIcon(String(title));
  message = stripLeadingIcon(String(message));
  console.log(`🔔 showAlert chamado: [${type}] ${title} - ${message}`);
  const container = document.getElementById("alertContainer");
  if (!container) {
    console.warn("❌ Alert container não encontrado!");
    return;
  }
  console.log('✅ Alert container encontrado, criando alerta...');

  const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Ícones para cada tipo
  const icons = {
    success: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
    `,
    error: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    `,
    warning: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>
    `,
    info: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    `
  };

  const alert = document.createElement("div");
  alert.id = alertId;
  alert.className = `alert ${type} alert-enter`;

  alert.innerHTML = `
    <div class="alert-content">
      <div class="alert-icon">
        ${icons[type] || icons.info}
      </div>
      <div class="alert-text">
        <span class="alert-title">${title}</span>
        <span class="alert-message">${message}</span>
      </div>
    </div>
    <button class="alert-close" onclick="closeAlert('${alertId}')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  `;

  container.appendChild(alert);

  // Auto-remove após duração
  setTimeout(() => {
    closeAlert(alertId);
  }, duration);
}

function closeAlert(alertId) {
  const alert = document.getElementById(alertId);
  if (alert) {
    alert.classList.remove('alert-enter');
    alert.classList.add('alert-exit');

    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 300);
  }
}

/**
 * Exibe um alerta crítico no topo da tela
 * Usado para situações críticas como: perda de conexão, erros graves, alertas de segurança
 *
 * @param {string} message - Mensagem do alerta crítico
 * @param {number} duration - Duração em ms (0 = sem auto-dismiss, alerta fica até usuário fechar)
 *
 * @example
 * // Alerta sem auto-dismiss (usuário precisa fechar)
 * showCriticalAlert("You are now offline");
 *
 * @example
 * // Alerta com auto-dismiss após 5 segundos
 * showCriticalAlert("Connection lost. Retrying...", 5000);
 *
 * @example
 * // Exemplos de uso para situações críticas:
 * showCriticalAlert("Erro crítico: Falha ao processar pagamento");
 * showCriticalAlert("Sem conexão com o servidor");
 * showCriticalAlert("Sessão expirada. Faça login novamente");
 */
function showCriticalAlert(message, duration = 0) {
  console.log(`🚨 showCriticalAlert: ${message}`);

  // Cria o container se não existir
  let container = document.getElementById("criticalAlertContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "criticalAlertContainer";
    document.body.appendChild(container);
  }

  const alertId = `critical-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Ícone de alerta crítico (círculo com exclamação)
  const icon = `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke-width="2" stroke-linecap="round"></circle>
      <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"></line>
      <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none"></circle>
    </svg>
  `;

  // Ícone de fechar
  const closeIcon = `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  `;

  const alert = document.createElement("div");
  alert.id = alertId;
  alert.className = "alert-critical alert-critical-enter";
  alert.setAttribute("role", "alert");
  alert.setAttribute("aria-live", "assertive");

  alert.innerHTML = `
    <div class="alert-critical-content">
      <div class="alert-critical-icon">
        ${icon}
      </div>
      <span class="alert-critical-message">${message}</span>
    </div>
    <button class="alert-critical-close" onclick="closeCriticalAlert('${alertId}')" aria-label="Fechar alerta">
      ${closeIcon}
    </button>
  `;

  container.appendChild(alert);

  // Auto-remove após duração (se definida)
  if (duration > 0) {
    setTimeout(() => {
      closeCriticalAlert(alertId);
    }, duration);
  }
}

/**
 * Fecha um alerta crítico
 * @param {string} alertId - ID do alerta a ser fechado
 */
function closeCriticalAlert(alertId) {
  const alert = document.getElementById(alertId);
  if (alert) {
    alert.classList.remove('alert-critical-enter');
    alert.classList.add('alert-critical-exit');

    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 300);
  }
}


// Adicionar listener no campo Full Name
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

  // ✅ ADICIONAR ESTE CÓDIGO PARA GARANTIR QUE O ESTADO VISUAL SEJA APLICADO APÓS O CARREGAMENTO DA PÁGINA
  // Aguarda um pouco mais para garantir que todos os elementos estejam prontos
  setTimeout(() => {
    //syncRadioSelection('fatura-recibo');
  }, 100);
});

// Listener para limpar seleção ao digitar
document.addEventListener('clientSelected', (e) => {
  console.log('Cliente selecionado:', e.detail.client);
});



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
 */
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
// ============================================
// CONFIRMAÇÃO PARA REMOVER ITEM DO CARRINHO
// ============================================

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
console.log('✅ Sistema de código de barras inicializado');
console.log('💡 Digite "barcodeStats()" no console para ver estatísticas');

// Função para mostrar o seletor de formato de fatura (painel único - formatSubOptions)
function showInvoiceFormatSelector() {
  const formatSubOptions = document.getElementById('formatSubOptions');
  if (formatSubOptions) {
    formatSubOptions.style.display = 'flex';
  }
  const formatRadios = document.querySelectorAll('input[name="invoiceFormat"]');
  let hasSelection = false;
  formatRadios.forEach(radio => {
    if (radio.checked) hasSelection = true;
  });
  if (!hasSelection && formatRadios.length > 0) {
    formatRadios[0].checked = true;
  }
}

// Função para esconder o seletor de formato de fatura (painel único - formatSubOptions)
function hideInvoiceFormatSelector() {
  const formatSubOptions = document.getElementById('formatSubOptions');
  if (formatSubOptions) {
    formatSubOptions.style.display = 'none';
  }
}

// Função para selecionar formato de fatura
function selectInvoiceFormat(format) {
  // Find and check the corresponding radio button
  const formatRadios = document.querySelectorAll(`input[name="invoiceFormat"][value="${format}"]`);
  formatRadios.forEach(radio => {
    radio.checked = true;
  });
}

// Função para confirmar formato de fatura
function confirmInvoiceFormat() {
  // Get the selected format from radio buttons
  const selectedRadio = document.querySelector('input[name="invoiceFormat"]:checked');
  if (!selectedRadio) {
    showAlert('warning', 'Formato não selecionado', 'Por favor, selecione um formato de fatura.');
    return;
  }

  const selectedFormat = selectedRadio.value;

  // Store the selected format in localStorage
  localStorage.setItem('invoiceFormat', selectedFormat);

  // Hide the selector
  hideInvoiceFormatSelector();

  // Show confirmation
  showAlert('success', 'Formato selecionado', `Formato de fatura definido como ${selectedFormat}`);
}



// Initialize invoice format selector event listeners
document.addEventListener('DOMContentLoaded', function () {
  // Add event listeners for format selection
  const formatRadios = document.querySelectorAll('input[name="invoiceFormat"]');

  formatRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      // ✅ NOVO: Usa a função centralizada
      selecionarFormatoFatura(this.value);
    });
  });

  // ✅ NOVO: Inicialização já é feita na função init()
  // O código de inicialização foi movido para initInvoiceFormat()
});
// ===== INTEGRAÇÃO COM CHECKOUT INTEGRADO =====
// Sobrescreve renderCart para sincronizar com checkout
const _originalRenderCart = renderCart;
renderCart = function (...args) {
  _originalRenderCart.apply(this, args);

  // Sincroniza com checkout integrado (se existir)
  if (typeof syncCheckoutCart === 'function') {
    syncCheckoutCart();
  }
};

// Adiciona evento customizado quando carrinho mudar
function notifyCartChange() {
  const event = new CustomEvent('cartChanged', {
    detail: { items: cart.size }
  });
  document.dispatchEvent(event);
}

// Listener para sincronizar checkout
document.addEventListener('cartChanged', function (e) {
  console.log('🔔 [CART] Carrinho mudou:', e.detail.items, 'itens');
  if (typeof syncCheckoutCart === 'function') {
    syncCheckoutCart();
  }
});

// ============================================
// PAINEL CLIENTE SLIDER
// ============================================

/**
 * Abre/fecha o painel cliente slider (TOGGLE)
 */
function openPanel(panelId) {
  if (panelId === 'clientePanel') {
    const panel = document.getElementById('clientePanelSlider');
    const wrapper = document.querySelector('.products-container-wrapper');
    const clientBtn = document.querySelector('.cliente-btn');

    if (panel && wrapper) {
      // Verifica se o painel já está aberto
      const isOpen = panel.classList.contains('active');

      if (isOpen) {
        // Se está aberto, fecha
        panel.classList.remove('active');
        wrapper.classList.remove('panel-open');
        if (clientBtn) clientBtn.classList.remove('panel-active');
        console.log('✅ Painel cliente fechado (toggle)');
      } else {
        // Se está fechado, abre
        panel.classList.add('active');
        wrapper.classList.add('panel-open');
        if (clientBtn) clientBtn.classList.add('panel-active');
        console.log('✅ Painel cliente aberto (toggle)');
      }
    }
  }

  // Painel de Tipo de Documento (no carrinho)
  if (panelId === 'documentoPanel') {
    const panel = document.getElementById('docTypePanelSlider');
    const wrapper = document.getElementById('cartBodyWrapper');
    const docBtn = document.querySelector('.cart-header .cliente-btn');

    if (panel && wrapper) {
      // Verifica se o painel já está aberto
      const isOpen = panel.classList.contains('active');

      if (isOpen) {
        // Se está aberto, fecha
        panel.classList.remove('active');
        wrapper.classList.remove('doc-panel-open');
        if (docBtn) docBtn.classList.remove('panel-active');
        console.log('✅ Painel documento fechado (toggle)');
      } else {
        // Se está fechado, abre
        panel.classList.add('active');
        wrapper.classList.add('doc-panel-open');
        if (docBtn) docBtn.classList.add('panel-active');
        console.log('✅ Painel documento aberto (toggle)');
      }
    }
  }
}

/**
 * Fecha o painel cliente slider
 */
function closeClientPanel() {
  const panel = document.getElementById('clientePanelSlider');
  const wrapper = document.querySelector('.products-container-wrapper');
  const clientBtn = document.querySelector('.cliente-btn');

  if (panel && wrapper) {
    panel.classList.remove('active');
    wrapper.classList.remove('panel-open');
    if (clientBtn) clientBtn.classList.remove('panel-active');
    console.log('✅ Painel cliente fechado');
  }
  if (typeof closeBottomSheet === 'function') closeBottomSheet();
}

/**
 * Fecha o painel de tipo de documento slider
 */
function closeDocPanel() {
  const panel = document.getElementById('docTypePanelSlider');
  const wrapper = document.getElementById('cartBodyWrapper');
  const docBtn = document.querySelector('.cart-header .cliente-btn');

  if (panel && wrapper) {
    panel.classList.remove('active');
    wrapper.classList.remove('doc-panel-open');
    if (docBtn) docBtn.classList.remove('panel-active');
    console.log('✅ Painel documento fechado');
  }
  if (typeof closeBottomSheet === 'function') closeBottomSheet();
}

/**
 * Inicializa os event listeners para os toggles de tipo de fatura
 */
function initInvoiceTypePanelToggles() {
  console.log('🔧 [TOGGLES] Inicializando toggles...');
  
  // Toggles de tipo
  const invoiceToggles = document.querySelectorAll('.invoice-toggle-option');
  console.log('📊 [TOGGLES] Tipos encontrados:', invoiceToggles.length);
  
  invoiceToggles.forEach(toggle => {
    toggle.addEventListener('click', function () {
      invoiceToggles.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      const radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const invoiceType = this.dataset.invoiceType;
      tipoDocumentoAtual = invoiceType;
      updateInvoiceTypeDisplay(invoiceType);
      if (typeof window.updateOrderSummaryDescTabState === 'function') window.updateOrderSummaryDescTabState();
      console.log('📄 [TOGGLES] Tipo selecionado:', invoiceType);

      const formatSubOptions = document.getElementById('formatSubOptions');
      if (formatSubOptions) {
        if (invoiceType === 'fatura-recibo') {
          formatSubOptions.style.display = 'flex';
          console.log('✅ [TOGGLES] Sub-toggle exibido');
        } else {
          formatSubOptions.style.display = 'none';
          console.log('❌ [TOGGLES] Sub-toggle ocultado');
        }
      }

      if (invoiceType !== 'fatura-recibo') {
        closeDocPanel();
      }
    });
  });

  // ✅ CRÍTICO: Toggles de formato
  const formatToggles = document.querySelectorAll('.format-toggle-option');
  console.log('📊 [TOGGLES] Formatos encontrados:', formatToggles.length);
  
  formatToggles.forEach((toggle, index) => {
    toggle.addEventListener('click', function () {
      console.log(`🎯 [TOGGLES] Toggle ${index} clicado:`, this.dataset.format);
      
      formatToggles.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      const radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const format = this.dataset.format;
      console.log('📐 [TOGGLES] Chamando selecionarFormatoFatura():', format);
      
      // ✅ CHAMADA CRÍTICA
      selecionarFormatoFatura(format);
      
      // Verifica se atualizou
      setTimeout(() => {
        console.log('🔍 [TOGGLES] Verificação:', {
          formatoFaturaAtual: formatoFaturaAtual,
          localStorage: localStorage.getItem('invoiceFormat'),
          radioMarcado: document.querySelector('input[name="invoiceFormat"]:checked')?.value
        });
      }, 100);

      closeDocPanel();
    });
  });
  
  console.log('✅ [TOGGLES] Inicialização concluída');
}

/**
 * Atualiza o texto do botão Tipo Factura no sticky bottom menu (telas ≤905px).
 * Se for Fatura-Recibo, acrescenta o formato (A4 ou 80mm).
 */
function updateStickyDocTypeLabel() {
  const el = document.getElementById('stickyDocTypeLabel');
  if (!el) return;
  const typeNames = {
    'fatura-recibo': 'Fatura-Recibo',
    'fatura-proforma': 'Fatura Proforma',
    'fatura': 'Fatura',
    'orcamento': 'Orçamento'
  };
  const tipo = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
  let text = typeNames[tipo] || tipo || 'Tipo Factura';
  if (tipo === 'fatura-recibo') {
    const formato = (typeof formatoFaturaAtual !== 'undefined' && formatoFaturaAtual)
      ? formatoFaturaAtual
      : (document.querySelector('input[name="invoiceFormat"]:checked')?.value || localStorage.getItem('invoiceFormat') || 'A4');
    text = text + ' (' + (formato === '80mm' ? '80mm' : 'A4') + ')';
  }
  el.textContent = text;
}

/**
 * Atualiza o display do tipo de fatura no botão do cabeçalho
 */
function updateInvoiceTypeDisplay(invoiceType) {
  const typeNames = {
    'fatura-recibo': 'Fatura-Recibo',
    'fatura-proforma': 'Fatura Proforma',
    'fatura': 'Fatura',
    'orcamento': 'Orçamento'
  };
  const displayElement = document.getElementById('selectedDocType');
  if (displayElement) {
    displayElement.textContent = typeNames[invoiceType] || invoiceType;
  }

  updateStickyDocTypeLabel();

  // Sempre mostra o formato e a seta
  const formatDisplay = document.getElementById('selectedDocFormat');
  const arrowDisplay = document.querySelector('.doc-arrow');

  if (formatDisplay) formatDisplay.style.display = 'inline';
  if (arrowDisplay) arrowDisplay.style.display = 'inline';

  // Para tipos diferentes de fatura-recibo, sempre mostra A4 como padrão
  if (invoiceType !== 'fatura-recibo') {
    if (formatDisplay) formatDisplay.textContent = 'Formato A4';
  }

  // Fatura Proforma, Fatura e Orçamento: bloquear métodos de pagamento e teclado; alterar texto do botão
  const cartFooter = document.querySelector('.cart-footer');
  const payBtns = document.querySelectorAll('.keypad-pay-btn');
  const setPayBtnText = function (text) { payBtns.forEach(function (btn) { btn.textContent = text; }); };
  if (invoiceType === 'fatura-proforma') {
    if (cartFooter) cartFooter.classList.add('document-type-proforma');
    setPayBtnText('Gerar Factura Proforma');
  } else if (invoiceType === 'fatura') {
    if (cartFooter) cartFooter.classList.add('document-type-proforma');
    setPayBtnText('Gerar Fatura');
  } else if (invoiceType === 'orcamento') {
    if (cartFooter) cartFooter.classList.add('document-type-proforma');
    setPayBtnText('Gerar Orçamento');
  } else {
    if (cartFooter) cartFooter.classList.remove('document-type-proforma');
    setPayBtnText('Pagar');
  }

  // Cadeados no rodapé: mostrar só quando bloqueado (proforma/fatura/orçamento); sumir com Fatura-Recibo
  if (typeof updateCartFooterLockIcons === 'function') updateCartFooterLockIcons(invoiceType);
}

/**
 * Adiciona ou remove o ícone de cadeado DENTRO de cada elemento bloqueado do rodapé,
 * com estilo igual ao do elemento (mesmo font-size e tom de cor).
 * @param {string} invoiceType - Tipo de documento atual (fatura-recibo, fatura-proforma, fatura, orcamento)
 */
function updateCartFooterLockIcons(invoiceType) {
  const blockFooter = invoiceType === 'fatura-proforma' || invoiceType === 'fatura' || invoiceType === 'orcamento';
  const footer = document.querySelector('.cart-footer');
  if (!footer) return;

  function addLock(parent, lockClass) {
    if (!parent.querySelector('.' + lockClass)) {
      const wrap = document.createElement('span');
      wrap.className = lockClass;
      wrap.setAttribute('aria-hidden', 'true');
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-lock';
      wrap.appendChild(icon);
      parent.appendChild(wrap);
    }
  }
  function removeLocks(selector) {
    footer.querySelectorAll(selector).forEach(function (el) { el.remove(); });
  }

  if (blockFooter) {
    // 1) Cada card: substituir conteúdo pelo cadeado
    footer.querySelectorAll('#paymentMethodsTrack .pm-card').forEach(function (card) {
      addLock(card, 'pm-card-lock');
      card.classList.add('locked');
    });
    // 2) Input: substituir valor pelo cadeado
    const amountWrapper = footer.querySelector('.footer-amount-wrapper');
    if (amountWrapper) {
      addLock(amountWrapper, 'footer-input-lock');
      amountWrapper.classList.add('locked');
    }
    // 3) Cada botão numérico: substituir número pelo cadeado
    footer.querySelectorAll('.keypad-grid .keypad-btn').forEach(function (btn) {
      addLock(btn, 'keypad-btn-lock');
      btn.classList.add('locked');
    });
    // 4) Botão Exato: substituir palavra "Exato" pelo cadeado
    const exactBtn = footer.querySelector('.keypad-exact-btn');
    if (exactBtn) {
      addLock(exactBtn, 'keypad-exact-lock');
      exactBtn.classList.add('locked');
    }
  } else {
    removeLocks('.pm-card-lock');
    removeLocks('.footer-input-lock');
    removeLocks('.keypad-btn-lock');
    removeLocks('.keypad-exact-lock');
    footer.querySelectorAll('.pm-card, .footer-amount-wrapper, .keypad-grid .keypad-btn, .keypad-exact-btn').forEach(function (el) {
      el.classList.remove('locked');
    });
  }
}

/**
 * Atualiza o display do formato no botão do cabeçalho
 */
function updateInvoiceFormatDisplay(format) {
  const formatNames = {
    'A4': 'Formato A4',
    '80mm': 'Formato 80mm'
  };
  const displayElement = document.getElementById('selectedDocFormat');
  if (displayElement) {
    displayElement.textContent = formatNames[format] || format;
  }
}

// Inicializa os toggles quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
  initInvoiceTypePanelToggles();

  // [TESTE] Clique na área do usuário logado → alert com width da tela (útil ao redimensionar)
  const loggedUserArea = document.getElementById('loggedUserArea');
  if (loggedUserArea) {
    loggedUserArea.addEventListener('click', function () {
      var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      alert('Width da tela: ' + w + ' px');
    });
  }

  // Inicializa visibilidade do sub-toggle de formato
  const formatSubOptions = document.getElementById('formatSubOptions');
  if (formatSubOptions) {
    // Mostra sub-toggle apenas se fatura-recibo estiver selecionado
    const isFaturaRecibo = tipoDocumentoAtual === 'fatura-recibo';
    formatSubOptions.style.display = isFaturaRecibo ? 'flex' : 'none';
  }

});

/**
 * Função genérica para fechar painel (compatibilidade)
 */
function closePanel(panelId) {
  if (panelId === 'clientePanel') {
    closeClientPanel();
  }
  if (panelId === 'documentoPanel') {
    closeDocPanel();
  }
}

/**
 * Seleciona um cliente no painel
 */
function selectClient(clientId, clientName) {
  console.log('🧑 Cliente selecionado:', clientName, clientId);

  // Remove active de todos os itens
  const items = document.querySelectorAll('.client-item');
  items.forEach(item => item.classList.remove('active'));

  // Adiciona active no item clicado
  event.currentTarget.classList.add('active');

  // Atualiza o nome no botão cliente (topo e sticky bottom menu)
  const topClientName = document.getElementById('topSelectedClient');
  if (topClientName) {
    topClientName.textContent = clientName;
  }
  const stickyClientLabel = document.getElementById('stickyClientLabel');
  if (stickyClientLabel) {
    stickyClientLabel.textContent = clientName;
  }

  // Atualiza no checkout também (se existir)
  const selectedClientName = document.getElementById('selectedClientName');
  if (selectedClientName) {
    selectedClientName.textContent = clientName;
  }

  // Fecha o painel após seleção
  setTimeout(() => {
    closeClientPanel();
  }, 300);

  // Mostra alerta de sucesso
  showAlert('success', 'Cliente Selecionado', `${clientName} foi selecionado`, 2000);
}

/**
 * Abre formulário para novo cliente (placeholder)
 */
function openNewClientFormPanel() {
  console.log('➕ Abrir formulário de novo cliente');
  showAlert('info', 'Em Desenvolvimento', 'Funcionalidade de cadastro será implementada', 2500);
}

/**
 * ⚠️ CÓDIGO ANTIGO DO PAINEL DE CLIENTES FOI REMOVIDO
 * Foi substituído pelo arquivo clientes.js que conecta com a API do backend
 * O código antigo usava dados mockados e foi removido para evitar conflitos
 */

/* ======= GESTÃO DE CARDS DE PRODUTOS NO CARRINHO ======= */

/**
 * Formata valor numérico para exibição no input de preço
 * Exemplo: 3950.75 -> "3.950,75 Kz"
 */
function formatCurrencyInput(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "0,00 Kz";

  // Formata com separador de milhares (.) e decimais (,)
  const formatted = num.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${formatted} Kz`;
}

/**
 * Renderiza um card de produto no carrinho
 */
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

/**
 * Atualiza a visualização do carrinho
 */
function updateCartDisplay() {
  const emptyState = document.getElementById('cartEmptyState');
  const productsContainer = document.getElementById('cartProductsContainer');

  if (!emptyState || !productsContainer) return;

  if (cart.size === 0) {
    // Carrinho vazio
    emptyState.style.display = 'flex';
    productsContainer.style.display = 'none';
    productsContainer.innerHTML = '';
    lastExpandedProductId = null; // Reset quando carrinho fica vazio
  } else {
    // Carrinho com produtos
    emptyState.style.display = 'none';
    productsContainer.style.display = 'flex';

    // Renderiza todos os cards
    productsContainer.innerHTML = '';

    cart.forEach((productData, productId) => {
      const card = renderCartProductCard(productId, productData);
      productsContainer.appendChild(card);

      // Expande APENAS o card que foi clicado por último (preserva o estado)
      if (lastExpandedProductId !== null && productId === lastExpandedProductId) {
        setTimeout(() => {
          card.classList.add('expanded');

          // Foca e seleciona o input de quantidade quando o card é expandido automaticamente
          const qtyInput = document.getElementById(`qty-${productId}`);
          if (qtyInput) {
            qtyInput.focus();
            qtyInput.select(); // Seleciona todo o texto para permitir substituição imediata
            quantityInputIsSelected = true; // Marca que o texto está selecionado
          }
        }, 100);
      }
    });
  }

  // Re-verificar overflow do slider de métodos de pagamento (layout do rodapé pode ter mudado)
  if (typeof scheduleRefreshPaymentMethodsOverflow === 'function') scheduleRefreshPaymentMethodsOverflow();
}

/**
 * Toggle expansão/colapso de um card
 * Regra: Sempre deixa o card clicado expansivo (nunca faz toggle para fechar)
 */
function toggleCardExpansion(productId) {
  // Converte o ID para número para consistência
  const numericId = parseInt(productId);

  // ✅ Marca que estamos trocando de card (impede reload durante a troca)
  isSwitchingCards = true;

  // ✅ Se houver uma edição pendente, finaliza imediatamente antes de trocar de card
  if (finishEditingTimeout) {
    clearTimeout(finishEditingTimeout);
    finishEditingTimeout = null;
  }

  // ✅ Sincroniza qualquer edição pendente ANTES de trocar de card (mas sem reload)
  if (pendingSync) {
    console.log('🔄 Sincronizando edição pendente (sem reload durante troca)');
    // Sincroniza apenas localmente, sem chamar syncToAPI que causaria reload
    const cartItem = cart.get(pendingSync.id);
    if (cartItem) {
      cartItem.qty = pendingSync.qty;
    }
    // Agenda a sincronização com a API para depois da troca
    setTimeout(() => {
      if (pendingSync) {
        syncToAPI(pendingSync.id, pendingSync.qty, null);
        pendingSync = null;
      }
    }, 200);
  }

  // ✅ Desativa o modo de edição imediatamente ao trocar de card
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

  // Check if currently expanded BEFORE removing classes
  const wasExpanded = clickedCard.classList.contains('expanded');

  // Colapsa todos os cards
  allCards.forEach(card => card.classList.remove('expanded'));

  // Se não estava expandido, expande agora (Toggle)
  if (!wasExpanded) {
    clickedCard.classList.add('expanded');

    // Armazena qual produto foi expandido por último
    lastExpandedProductId = numericId;

    // Foca no input de quantidade e seleciona o texto
    setTimeout(() => {
      const qtyInput = document.getElementById(`qty-${productId}`);
      if (qtyInput) {
        qtyInput.focus();
        qtyInput.select(); // Seleciona todo o texto para permitir substituição imediata
        quantityInputIsSelected = true; // Marca que o texto está selecionado
      }
    }, 100);
  } else {
    // Se estava expandido, ele fecha (já foi fechado pelo loop acima)
    lastExpandedProductId = null;
    console.log('🔽 Card colapsado pelo usuário (Toggle)');
  }

  // ✅ Libera a flag após a troca estar completa
  setTimeout(() => {
    isSwitchingCards = false;
    console.log('✅ Troca de card completa');
  }, 300);
}

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

/**
 * Gerencia tecla ENTER nos inputs
 * ENTER colapsa o card expandido
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

// Expor função globalmente para ser chamada quando produtos são adicionados
window.updateCartDisplay = updateCartDisplay;

/* ======================================================
   SEÇÃO: SLIDER DE MÉTODOS DE PAGAMENTO (RODAPÉ DO CARRINHO)
   ====================================================== */

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

/**
 * Gera slug a partir do nome do método
 */
function generatePaymentSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Renderiza os cards de pagamento no footer
 */
function renderFooterPaymentCards() {
  const track = document.getElementById('paymentMethodsTrack');
  if (!track) return;

  if (footerPaymentMethods.length === 0) {
    track.innerHTML = '<span class="pm-empty">Nenhum método disponível</span>';
    return;
  }

  // Inicializa valores por método (se ainda não existir)
  footerPaymentMethods.forEach(metodo => {
    if (!(metodo.slug in footerValoresPorMetodo)) {
      footerValoresPorMetodo[metodo.slug] = 0;
    }
  });

  // Renderiza cards com estrutura de duas linhas (nome + valor restante)
  track.innerHTML = footerPaymentMethods.map(metodo =>
    `<button class="pm-card" data-method="${metodo.slug}" data-id="${metodo.id}">
      <span class="pm-card-name">${metodo.nome}</span>
      <span class="pm-card-value valor-restante"></span>
    </button>`
  ).join('');

  // Inicializa seleção e slider após renderizar
  initPaymentMethodsSelection();
  initPaymentMethodsSlider();

  // Atualiza os valores exibidos nos cards
  updateFooterPaymentCards();

  // Garantir que o overflow do slider é reavaliado após os cards estarem no DOM
  if (typeof scheduleRefreshPaymentMethodsOverflow === 'function') scheduleRefreshPaymentMethodsOverflow();

  console.log('✅ [FOOTER] Cards renderizados');
}

/**
 * Detecta se o track de métodos de pagamento tem overflow (quebra de linha)
 * e atualiza a visibilidade das setas + estado disabled.
 * Mostra setas sempre que qualquer card não estiver totalmente visível.
 */
function refreshPaymentMethodsOverflow() {
  const wrapper = document.getElementById('paymentMethodsWrapper');
  const track = document.getElementById('paymentMethodsTrack');
  const prevBtn = document.getElementById('pmArrowPrev');
  const nextBtn = document.getElementById('pmArrowNext');

  if (!wrapper || !track || !prevBtn || !nextBtn) return;

  const scrollW = track.scrollWidth;
  const clientW = track.clientWidth;
  const cards = track.querySelectorAll('.pm-card');

  // Overflow quando o conteúdo é mais largo que a área visível
  let hasOverflow = scrollW > clientW;

  // Deteção extra: último card parcialmente visível (quebra mínima / subpixel)
  if (!hasOverflow && cards.length > 0) {
    const tr = track.getBoundingClientRect();
    const last = cards[cards.length - 1];
    const lr = last.getBoundingClientRect();
    if (lr.right > tr.right - 1) hasOverflow = true;
  }

  wrapper.classList.toggle('has-overflow', hasOverflow);

  if (hasOverflow) {
    const scrollLeft = track.scrollLeft;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    prevBtn.disabled = scrollLeft <= 0;
    nextBtn.disabled = scrollLeft >= maxScroll - 1;
  }
}

/**
 * Agenda o refresh do overflow para depois do layout (evita medição antes do paint).
 */
function scheduleRefreshPaymentMethodsOverflow() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (typeof refreshPaymentMethodsOverflow === 'function') refreshPaymentMethodsOverflow();
    });
  });
}

/**
 * Inicializa o slider de métodos de pagamento
 * Setas só aparecem quando há overflow (quebra nos cards).
 */
function initPaymentMethodsSlider() {
  const wrapper = document.getElementById('paymentMethodsWrapper');
  const track = document.getElementById('paymentMethodsTrack');
  const prevBtn = document.getElementById('pmArrowPrev');
  const nextBtn = document.getElementById('pmArrowNext');

  if (!wrapper || !track || !prevBtn || !nextBtn) {
    console.warn('⚠️ Elementos do slider de pagamento não encontrados');
    return;
  }

  // Scroll por "página"
  function scrollByPage(direction) {
    const pageSize = Math.max(track.clientWidth * 0.8, 100);
    track.scrollBy({ left: direction * pageSize, behavior: 'smooth' });
  }

  prevBtn.addEventListener('click', () => scrollByPage(-1));
  nextBtn.addEventListener('click', () => scrollByPage(+1));
  track.addEventListener('scroll', () => refreshPaymentMethodsOverflow());

  // Verificação inicial após o layout estar estável
  scheduleRefreshPaymentMethodsOverflow();

  // Re-verificar no resize (debounce para evitar excesso de chamadas)
  let resizeTimeout;
  const onResize = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(scheduleRefreshPaymentMethodsOverflow, 120);
  };
  window.addEventListener('resize', onResize);
}

/**
 * Inicializa a seleção de métodos de pagamento
 */
function initPaymentMethodsSelection() {
  const cards = document.querySelectorAll('#paymentMethodsTrack .pm-card');

  cards.forEach(card => {
    card.addEventListener('click', function () {
      const method = this.dataset.method;
      selectFooterPaymentMethod(this, method);
    });
  });
}

/**
 * Seleciona um método de pagamento no footer
 * Lógica igual à do modal_checkout: salva valor anterior, carrega valor do método clicado
 */
function selectFooterPaymentMethod(card, method) {
  console.log('💳 [FOOTER] Clique detectado em:', method);

  const isCurrentMethod = selectedPaymentMethod === method;

  if (isCurrentMethod) {
    // Deselect current method
    console.log('❎ [FOOTER] Deselecionando método:', method);

    // ✅ CONFIRMA o valor antes de desselecionar
    confirmFooterPaymentValue();

    // Clear selection
    selectedPaymentMethod = null;
    footerCashAmount = '0';
    
    if (window.footerCashFormatter) {
      window.footerCashFormatter.setValue(0);
    }

  } else {
    // Select new method
    console.log('✅ [FOOTER] Selecionando método:', method);

    // ✅ CONFIRMA o valor do método anterior antes de trocar
    if (selectedPaymentMethod) {
      confirmFooterPaymentValue();
    }

    // 2️⃣ Set new current method
    selectedPaymentMethod = method;

    // 3️⃣ Load saved value for this method
    const valorSalvo = footerValoresPorMetodo[method] || 0;
    footerCashAmount = String(valorSalvo);
    
    if (window.footerCashFormatter) {
      window.footerCashFormatter.setValue(valorSalvo);
    }
    console.log(`📥 [FOOTER] Carregando ${method}: ${valorSalvo} Kz`);

    // 4️⃣ Auto-focus input
    setTimeout(() => {
      const cashInput = document.getElementById('footerCashInput');
      if (cashInput) {
        cashInput.focus();
        console.log('🎯 [FOOTER] Input focado!');
      }
    }, 100);
  }

  // ✅ Atualiza cards APÓS confirmar valores
  updateFooterPaymentCards();
}

/**
 * Atualiza os valores e estilos de todos os cards de pagamento
 */
function updateFooterPaymentCards() {
  const cards = document.querySelectorAll('#paymentMethodsTrack .pm-card');
  const totalAPagar = currentCartTotal || 0;

  // Calcula soma de todos os pagamentos
  let somaPagamentos = 0;
  footerPaymentMethods.forEach(metodo => {
    const slug = metodo.slug;
    if (slug === selectedPaymentMethod) {
      // Método atualmente sendo editado: usa o valor do input
      somaPagamentos += parseFloat(footerCashAmount) || 0;
    } else {
      // Outros métodos: usa o valor salvo
      somaPagamentos += parseFloat(footerValoresPorMetodo[slug]) || 0;
    }
  });

  const faltaPagar = totalAPagar - somaPagamentos;

  console.log(`💰 [FOOTER] Total: ${totalAPagar} | Pago: ${somaPagamentos} | Falta: ${faltaPagar}`);

  cards.forEach(card => {
    const method = card.getAttribute('data-method') || '';
    const span = card.querySelector('.valor-restante');
    const isCurrentMethod = selectedPaymentMethod === method;

    // Calcula o valor deste método
    let valorDoMetodo = 0;
    if (isCurrentMethod) {
      valorDoMetodo = parseFloat(footerCashAmount) || 0;
    } else {
      valorDoMetodo = parseFloat(footerValoresPorMetodo[method]) || 0;
    }

    // Card ativo se valor > 0
    const deveEstarAtivo = valorDoMetodo > 0;

    // Aplica ou remove classe 'active'
    if (deveEstarAtivo) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }

    // Aplica classe 'editing' se for o método atual
    if (isCurrentMethod) {
      card.classList.add('editing');
    } else {
      card.classList.remove('editing');
    }

    // Exibição do valor no span
    if (span) {
      if (isCurrentMethod && deveEstarAtivo) {
        // Método atual com valor: mostra em azul
        span.textContent = valorDoMetodo.toLocaleString('pt-AO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' Kz';
        span.className = 'pm-card-value valor-restante valor-positivo';

      } else if (deveEstarAtivo) {
        // Outro método com valor: mostra em verde
        span.textContent = valorDoMetodo.toLocaleString('pt-AO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' Kz';
        span.className = 'pm-card-value valor-restante valor-confirmado';

      } else if (faltaPagar > 0) {
        // Sem valor e falta pagar: mostra negativo em vermelho
        span.textContent = '−' + faltaPagar.toLocaleString('pt-AO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' Kz';
        span.className = 'pm-card-value valor-restante valor-negativo';

      } else {
        // Tudo pago ou carrinho vazio: limpa
        span.textContent = '';
        span.className = 'pm-card-value valor-restante';
      }
    }
  });

  // ✅ Calcula e exibe o STATUS DE PAGAMENTO (Troco / Falta / Completo)
  updatePaymentStatus(somaPagamentos, totalAPagar);
}

/**
 * Exibe o estado de "Valor em falta" após falha na validação de pagamento
 * Mostra um estado visual vermelho com a quantidade em falta
 */
function showPaymentMissing(valorEmFalta) {
  const statusElement = document.getElementById('paymentStatusElement');
  const statusLabel = document.getElementById('statusLabel');
  const statusValue = document.getElementById('statusValue');
  const statusIcon = document.getElementById('statusIcon');

  if (!statusElement || !statusLabel || !statusValue || !statusIcon) return;

  // Ícone de aviso
  const iconWarning = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m.93-6.93a9.001 9.001 0 1 1-1.86 0M9 16H3m6-8l-5.66 5.66m0 0l11.32 0" /><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>';
  const iconAlertIcon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

  // Limpa classes anteriores
  statusElement.classList.remove('state-change', 'state-complete');

  // Mostra o estado de valor em falta
  statusLabel.textContent = 'Valor em falta';
  statusValue.textContent = valorEmFalta.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' Kz';
  statusIcon.innerHTML = iconAlertIcon;
  statusElement.classList.add('visible', 'state-remaining');

  console.log(`🔴 [STATUS] Valor em falta exibido: ${valorEmFalta.toFixed(2)} Kz`);
}

/**
 * Atualiza a exibição do status de pagamento (3 estados)
 * - Troco (verde): pagou mais do que o total
 * - Valor em falta (vermelho): ainda falta pagar
 * - Pagamento completo (azul): pagou exatamente o total
 */
function updatePaymentStatus(somaPagamentos, totalAPagar) {
  const statusElement = document.getElementById('paymentStatusElement');
  const statusLabel = document.getElementById('statusLabel');
  const statusValue = document.getElementById('statusValue');
  const statusIcon = document.getElementById('statusIcon');

  if (!statusElement || !statusLabel || !statusValue || !statusIcon) return;

  // Ícones SVG
  const iconCheck = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
  const iconWarning = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

  // Remove classes de estado anteriores
  statusElement.classList.remove('visible', 'state-change', 'state-remaining', 'state-complete');

  // Se não há pagamentos ou carrinho vazio, esconde
  if (somaPagamentos === 0 || totalAPagar === 0) {
    return;
  }

  const diferenca = totalAPagar - somaPagamentos;

  if (diferenca > 0) {
    // 🔴 AINDA FALTA PAGAR -> OCULTO (Solicitação do usuário)
    // Se o valor inserido for menor que o total, não mostrar nada.
    statusElement.classList.remove('visible');
    console.log(`🔴 [STATUS] Falta pagar: ${diferenca.toFixed(2)} Kz (Oculto)`);

  } else if (diferenca < 0) {
    // 🟢 PAGOU A MAIS - TEM TROCO
    const troco = Math.abs(diferenca);
    statusLabel.textContent = 'Troco';
    statusValue.textContent = troco.toLocaleString('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' Kz';
    statusIcon.innerHTML = iconCheck;
    statusElement.classList.add('visible', 'state-change');
    console.log(`🟢 [STATUS] Troco: ${troco.toFixed(2)} Kz`);

  } else {
    // 🔵 PAGAMENTO EXATO - COMPLETO
    statusLabel.textContent = 'Pagamento completo';
    statusValue.textContent = '';
    statusIcon.innerHTML = iconCheck;
    statusElement.classList.add('visible', 'state-complete');
    console.log(`🔵 [STATUS] Pagamento completo`);
  }
}

/**
 * Retorna o método de pagamento selecionado
 */
function getSelectedPaymentMethod() {
  return selectedPaymentMethod;
}

/**
 * Reseta todos os valores dos métodos de pagamento
 * Chamado quando o carrinho é limpo
 */
function resetFooterPaymentValues() {
  console.log('🔄 [FOOTER] Resetando valores dos métodos de pagamento');

  // Limpa o objeto de valores por método
  for (const key in footerValoresPorMetodo) {
    if (footerValoresPorMetodo.hasOwnProperty(key)) {
      footerValoresPorMetodo[key] = 0;
    }
  }

  // Reseta o método selecionado
  selectedPaymentMethod = null;

  // Reseta o valor do input
  footerCashAmount = '0';

  // Atualiza o display do input
  const cashInput = document.getElementById('footerCashInput');
  if (cashInput) {
    cashInput.value = 'Kz 0,00';
  }

  // Atualiza os cards visuais
  updateFooterPaymentCards();

  console.log('✅ [FOOTER] Valores resetados');
}

/* ======================================================
   SEÇÃO: INPUT DO FOOTER - VALOR RECEBIDO DO CLIENTE
   ====================================================== */

/*
function setupFooterKeyboardListener() {
  const cashInput = document.getElementById('footerCashInput');
  if (!cashInput) {
    console.warn('⚠️ [FOOTER] Input footerCashInput não encontrado');
    return;
  }

  // Remove listeners anteriores se existirem
  cashInput.removeEventListener('keydown', handleFooterKeyboardInput);

  // Adiciona novo listener para keydown
  cashInput.addEventListener('keydown', handleFooterKeyboardInput);

  // Previne entrada direta - valor controlado pela nossa lógica
  cashInput.addEventListener('input', function (e) {
    e.preventDefault();
    updateFooterCashDisplay();
  });

  // Cursor sempre no final
  cashInput.addEventListener('click', function () {
    this.selectionStart = this.selectionEnd = this.value.length;
  });

  cashInput.addEventListener('focus', function () {
    this.selectionStart = this.selectionEnd = this.value.length;
  });

  console.log('✅ [FOOTER] Listener do teclado físico configurado');
}
*/

/*
function handleFooterKeyboardInput(e) {
  const key = e.key;

  // BACKSPACE: Remove último caractere
  if (key === 'Backspace') {
    e.preventDefault();
    backspaceFooterCash();
    return;
  }

  // DELETE: Limpa tudo
  if (key === 'Delete') {
    e.preventDefault();
    clearFooterCash();
    return;
  }

  // PONTO DECIMAL: Adiciona ponto (aceita . ou , ou Decimal do numpad)
  if (key === '.' || key === ',' || key === 'Decimal') {
    e.preventDefault();
    footerKeypadInput('.');
    return;
  }

  // NÚMEROS: Adiciona dígito
  if (/^[0-9]$/.test(key)) {
    e.preventDefault();
    footerKeypadInput(key);
    return;
  }
}
*/

function footerKeypadInput(value) {
  if (!selectedPaymentMethod) {
    console.warn('⚠️ [FOOTER] Nenhum método selecionado');
    return;
  }
  
  if (window.footerCashFormatter) {
    window.footerCashFormatter.keypadInput(value);
  }
}

function backspaceFooterCash() {
  if (!selectedPaymentMethod) {
    console.warn('⚠️ [FOOTER] Nenhum método selecionado');
    return;
  }
  
  if (window.footerCashFormatter) {
    window.footerCashFormatter.backspace();
  }
}

function clearFooterCash() {
  if (window.footerCashFormatter) {
    window.footerCashFormatter.clear();
  }
}

function updateFooterCashDisplay() {
  // This function now just triggers the formatter's display update
  if (window.footerCashFormatter) {
    window.footerCashFormatter._formatDisplay();
  }
}

/**
 * Retorna o valor numérico atual do footer
 */
function getFooterCashAmount() {
  return parseFloat(footerCashAmount) || 0;
}

/**
 * Inicializa os listeners dos botões do keypad
 */
function initFooterKeypad() {
  // ✅ Instancia formatter SEM atualizar cards em tempo real
  window.footerCashFormatter = new MonetaryFormatter('footerCashInput', {
    locale: 'pt-AO',
    currency: 'Kz',
    decimals: 2,
    onValueChange: (value) => {
      // ✅ Atualiza APENAS as variáveis globais (sem atualizar UI)
      footerCashAmount = String(value);
      
      if (selectedPaymentMethod) {
        footerValoresPorMetodo[selectedPaymentMethod] = value;
        console.log(`💾 [FOOTER] Salvando ${selectedPaymentMethod}: ${value} Kz (sem atualizar UI)`);
      }
      
      // ❌ NÃO CHAMA updateFooterPaymentCards() AQUI!
      // A atualização acontece apenas na confirmação (Enter ou Blur)
    }
  });
  
  // ✅ ATIVA o formatter (este input sempre está em modo edição)
  window.footerCashFormatter.enable();
  
  // ✅ NOVO: Adiciona listeners para confirmação
  const cashInput = document.getElementById('footerCashInput');
  if (cashInput) {
    // ✅ Confirma ao pressionar Enter
    cashInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmFooterPaymentValue();
      }
    });
    
    // ✅ Confirma ao clicar fora (blur)
    cashInput.addEventListener('blur', () => {
      confirmFooterPaymentValue();
    });
  }
  
  // Configura botões do keypad
  const keypadBtns = document.querySelectorAll('.keypad-btn');
  keypadBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const value = this.dataset.value;
      
      if (value === 'C') {
        clearFooterCash();
      } else if (value === 'back') {
        backspaceFooterCash();
      } else {
        footerKeypadInput(value);
      }
    });
  });
  
  console.log('✅ [FOOTER] Keypad inicializado com confirmação explícita');
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
  loadFooterPaymentMethods();
  initOrderSummarySlider();
  initFooterKeypad();
  if (typeof initBottomSheetSystem === 'function') initBottomSheetSystem();
});

/**
 * Preenche o input do método de pagamento atual com o valor exato do total
 * Chamada ao clicar no botão "Exact"
 */
function fillExactAmount() {
  // ✅ Verifica se há um método de pagamento selecionado
  if (!selectedPaymentMethod) {
    console.warn('⚠️ [EXACT] Nenhum método de pagamento selecionado');
    showAlert('warning', '⚠️ Selecione um Método', 'Por favor, selecione um método de pagamento primeiro');
    return;
  }

  // ✅ Verifica se há produtos no carrinho
  if (cart.size === 0 || currentCartTotal === 0) {
    console.warn('⚠️ [EXACT] Carrinho vazio');
    showAlert('warning', '⚠️ Carrinho Vazio', 'Adicione produtos ao carrinho primeiro');
    return;
  }

  // ✅ CORREÇÃO: Calcula o VALOR RESTANTE a pagar
  const totalAPagar = currentCartTotal;
  
  // Soma todos os pagamentos JÁ CONFIRMADOS (exceto o método atual)
  let somaPagamentos = 0;
  footerPaymentMethods.forEach(metodo => {
    const slug = metodo.slug;
    
    // Ignora o método atual (ainda está sendo editado)
    if (slug !== selectedPaymentMethod) {
      somaPagamentos += parseFloat(footerValoresPorMetodo[slug]) || 0;
    }
  });
  
  // Calcula quanto AINDA FALTA PAGAR
  const valorRestante = totalAPagar - somaPagamentos;
  
  // ✅ NOVO: Usa o VALOR RESTANTE em vez do total
  const exactAmount = valorRestante;

  console.log(`💰 [EXACT] Preenchendo ${exactAmount.toFixed(2)} Kz no método: ${selectedPaymentMethod}`);
  console.log(`📊 [EXACT] Total: ${totalAPagar} | Já pago: ${somaPagamentos} | Restante: ${valorRestante}`);

  // ✅ CORREÇÃO 1: Atualiza a variável global footerCashAmount
  footerCashAmount = String(exactAmount);
  
  // ✅ CORREÇÃO 2: Salva o valor no método de pagamento atual
  footerValoresPorMetodo[selectedPaymentMethod] = exactAmount;
  console.log(`💾 [EXACT] Salvando ${selectedPaymentMethod}: ${exactAmount} Kz`);

  // ✅ CORREÇÃO 3: Atualiza o formatter do footer com o valor exato
  if (window.footerCashFormatter) {
    window.footerCashFormatter.setValue(exactAmount);
  }

  // ✅ CORREÇÃO 4: Agora updateFooterPaymentCards() lerá os valores corretos
  updateFooterPaymentCards();

  // ✅ Feedback visual de sucesso
  showAlert('success', '✅ Valor Exato Inserido', `${exactAmount.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} Kz foi inserido no pagamento`);

  console.log('✅ [EXACT] Valor exato preenchido com sucesso');
}

/**
 * ✅ NOVA FUNÇÃO: Confirma valor digitado e atualiza cards
 * Chamada APENAS quando:
 * - Usuário pressiona Enter
 * - Usuário clica fora do input (blur)
 * - Usuário troca de método de pagamento
 */
function confirmFooterPaymentValue() {
  // Só confirma se há um método selecionado
  if (!selectedPaymentMethod) {
    console.log('⚠️ [CONFIRM] Nenhum método selecionado');
    return;
  }
  
  // Pega o valor atual do formatter
  const currentValue = window.footerCashFormatter ? 
    window.footerCashFormatter.getValue() : 
    parseFloat(footerCashAmount) || 0;
  
  console.log(`✅ [CONFIRM] Confirmando valor ${currentValue} para ${selectedPaymentMethod}`);
  
  // Salva o valor confirmado
  footerValoresPorMetodo[selectedPaymentMethod] = currentValue;
  footerCashAmount = String(currentValue);
  
  // ✅ AGORA SIM: Atualiza os cards com o valor confirmado
  updateFooterPaymentCards();
  
  console.log(`✅ [CONFIRM] Cards atualizados com valor confirmado`);
}

// ✅ Expõe a função globalmente
window.fillExactAmount = fillExactAmount;
window.confirmFooterPaymentValue = confirmFooterPaymentValue;

// Expor funções globalmente
window.getSelectedPaymentMethod = getSelectedPaymentMethod;
window.footerKeypadInput = footerKeypadInput;
window.backspaceFooterCash = backspaceFooterCash;
window.clearFooterCash = clearFooterCash;
window.updateFooterCashDisplay = updateFooterCashDisplay;
window.getFooterCashAmount = getFooterCashAmount;
window.updateFooterPaymentCards = updateFooterPaymentCards;
window.selectFooterPaymentMethod = selectFooterPaymentMethod;
window.resetFooterPaymentValues = resetFooterPaymentValues;
window.updatePaymentStatus = updatePaymentStatus;
window.refreshPaymentMethodsOverflow = refreshPaymentMethodsOverflow;
window.scheduleRefreshPaymentMethodsOverflow = scheduleRefreshPaymentMethodsOverflow;

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

  /** Bloqueia a aba Desc. quando o tipo de documento é fatura-proforma, fatura ou orçamento.
   *  Cadeado só aparece quando a aba está bloqueada; com Fatura-Recibo (A4 ou 80mm) o cadeado some. */
  function updateDescTabBlockState() {
    const tipo = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
    const blockDesc = tipo === 'fatura-proforma' || tipo === 'fatura' || tipo === 'orcamento';
    if (obsTabDesc) {
      obsTabDesc.classList.toggle('disabled', blockDesc);
      obsTabDesc.setAttribute('aria-disabled', blockDesc ? 'true' : 'false');
      // Cadeado: só inserir no DOM quando bloqueado; remover quando Fatura-Recibo
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

// Expose functions globally
window.updateOrderSummaryFooter = updateOrderSummaryFooter;
window.getOrderObservation = getOrderObservation;
window.initOrderSummarySlider = initOrderSummarySlider;

// ============================================
// RECEIPT-INVOICE PAYMENT PROCESSING
// ============================================

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
    acao: 'fatura-recibo',
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

/**
 * Processa e imprime Fatura Proforma (sem pagamento).
 * Envia id_cliente e tipo_documento ao backend, renderiza A4 e abre a janela de impressão.
 */
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
        acao: 'fatura-proforma',
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
    const container80 = document.getElementById('fatura80-container-inv80');
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
    const container80 = document.getElementById('fatura80-container-inv80');
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
        acao: 'fatura',
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
    const container80 = document.getElementById('fatura80-container-inv80');
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
  
  if (tipoDocumento !== 'fatura-recibo') {
    console.error('❌ [PAYMENT] Tipo de documento não suportado:', tipoDocumento);
    
    const nomeAmigavel = {
      'fatura-recibo': 'Fatura-Recibo',
      'fatura-proforma': 'Fatura Proforma',
      'fatura': 'Fatura',
      'orcamento': 'Orçamento'
    };
    
    const nomeDocumento = nomeAmigavel[tipoDocumento] || tipoDocumento;
    
    if (typeof showAlert === 'function') {
      showAlert('error', '❌ Tipo Não Suportado', 
        `"${nomeDocumento}" ainda não está implementado. Apenas "Fatura-Recibo" está disponível.`, 4000);
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
    const container80 = document.getElementById('fatura80-container-inv80');
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
      loadCartFromAPI().then(() => console.log('✅ Carrinho recarregado da API')).catch(err => console.warn('⚠️ loadCartFromAPI:', err));
    }
    
    // ✅ LIMPA OS CONTAINERS APÓS A IMPRESSÃO (não antes!)
    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('fatura80-container-inv80');

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

/**
 * Fecha todos os alertas ativos
 */
function closeAlert() {
  const container = document.getElementById('alertContainer');
  if (container) {
    container.innerHTML = '';
  }
}

/**
 * Retorna o tipo de documento atualmente selecionado
 * @returns {string} Tipo do documento
 */
function getTipoDocumentoAtual() {
  return tipoDocumentoAtual || 'fatura-recibo';
}

/**
 * Inicializa o handler do botão "Pagar"
 */
/**
 * Inicializa o handler do botão "Pagar"
 * ✅ FIXED: Ensures DOM is ready before attaching listener
 */
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
    if (tipoDoc === 'fatura-proforma') {
      console.log('🚀 [PAY BUTTON] Chamando processProformaInvoice()...');
      await processProformaInvoice();
      return;
    }
    if (tipoDoc === 'fatura') {
      console.log('🚀 [PAY BUTTON] Chamando processFaturaInvoice()...');
      await processFaturaInvoice();
      return;
    }
    if (tipoDoc === 'orcamento') {
      console.log('🚀 [PAY BUTTON] Chamando processOrcamentoInvoice()...');
      await processOrcamentoInvoice();
      return;
    }
    if (tipoDoc !== 'fatura-recibo') {
      if (typeof showAlert === 'function') {
        showAlert(
          'warning',
          'Tipo Não Suportado',
          'Este tipo de documento ainda não está implementado. Use Fatura-Recibo, Fatura Proforma ou Orçamento.',
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

// ✅ DEBUG FUNCTION: Test 80mm rendering
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

// ✅ Função auxiliar para verificar estado do container 80mm
function debug80mmContainer() {
    const container = document.getElementById('fatura80-container-inv80');
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

// ============================================
// MODAL DE CONFIRMAÇÃO (Centralizado em app.js)
// ============================================

let confirmCallback = null;
let cancelCallback = null;

/**
 * Mostra a modal de confirmação dinâmica
 * @param {Object} config - Configuração da modal
 * @param {Function} onConfirm - Callback quando confirmar
 * @param {Function} onCancel - Callback quando cancelar (opcional)
 */
function showConfirmModal(config = {}, onConfirm = null, onCancel = null) {
    console.log('❓ [CONFIRM] Mostrando modal de confirmação dinâmica...', config);
    
    // Guarda os callbacks
    confirmCallback = onConfirm;
    cancelCallback = onCancel;
    
    // Configurações padrão
    const defaultConfig = {
        title: "Are you sure?",
        message: "This action can't be undone. Please confirm if you want to proceed.",
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "blue", // blue, red, green, yellow
        icon: "warning" // warning, success, error, info, question
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    
    // Atualiza o conteúdo da modal
    updateConfirmModalContent(finalConfig);
    
    // Mostra a modal
    const modal = document.getElementById('modal-confirm-dialog');
    const overlay = document.getElementById('overlay-confirm-dialog');
    const box = document.getElementById('box-confirm-dialog');
    
    if (!modal || !overlay || !box) {
        console.error('❌ [CONFIRM] Elementos da modal de confirmação não encontrados!');
        return;
    }
    
    modal.classList.remove('hidden');
    
    // Força reflow para garantir a animação
    void modal.offsetWidth;
    
    // Animações
    overlay.style.opacity = '1';
    box.style.transform = 'scale(1)';
    box.style.opacity = '1';
    
    // Foco no botão de cancelar para acessibilidade
    setTimeout(() => {
        const cancelBtn = document.getElementById('cancel-confirm-dialog');
        if (cancelBtn) cancelBtn.focus();
    }, 100);
}

/**
 * Atualiza o conteúdo da modal baseado na configuração
 */
function updateConfirmModalContent(config) {
    const { title, message, confirmText, cancelText, confirmColor, icon } = config;
    
    // Atualiza textos
    const titleElement = document.getElementById('title-confirm-dialog');
    const messageElement = document.getElementById('desc-confirm-dialog');
    const confirmBtn = document.getElementById('confirm-confirm-dialog');
    const cancelBtn = document.getElementById('cancel-confirm-dialog');
    const iconElement = document.getElementById('icon-confirm-dialog');
    
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    if (confirmBtn) confirmBtn.textContent = confirmText;
    if (cancelBtn) cancelBtn.textContent = cancelText;
    
    // Atualiza cor do botão de confirmar
    if (confirmBtn) {
        // Remove classes de cor anteriores
        confirmBtn.className = confirmBtn.className.replace(/bg-(blue|red|green|yellow|gray)-600/g, '');
        confirmBtn.className = confirmBtn.className.replace(/hover:bg-(blue|red|green|yellow|gray)-700/g, '');
        
        // Adiciona nova cor
        const colorMap = {
            blue: 'bg-blue-600 hover:bg-blue-700',
            red: 'bg-red-600 hover:bg-red-700',
            green: 'bg-green-600 hover:bg-green-700',
            yellow: 'bg-yellow-600 hover:bg-yellow-700',
            gray: 'bg-gray-600 hover:bg-gray-700'
        };
        
        const colorClasses = colorMap[confirmColor] || colorMap.blue;
        confirmBtn.className += ` ${colorClasses}`;
    }
    
    // Atualiza ícone (opcional - você pode expandir esta parte)
    if (iconElement) {
        console.log('🎨 [CONFIRM] Ícone selecionado:', icon);
    }
}

/**
 * Esconde a modal de confirmação
 */
function hideConfirmModal() {
    console.log('✅ [CONFIRM] Escondendo modal de confirmação...');
    
    const modal = document.getElementById('modal-confirm-dialog');
    const overlay = document.getElementById('overlay-confirm-dialog');
    const box = document.getElementById('box-confirm-dialog');
    
    if (!modal || !overlay || !box) return;
    
    // Animações de saída
    overlay.style.opacity = '0';
    box.style.transform = 'scale(0.9)';
    box.style.opacity = '0';
    
    // Esconde após animação
    setTimeout(() => {
        modal.classList.add('hidden');
        // Limpa os callbacks
        confirmCallback = null;
        cancelCallback = null;
    }, 300);
}

/**
 * Quando usuário confirma
 */
function onConfirmAction() {
    console.log('✅ [CONFIRM] Ação confirmada pelo usuário');
    if (typeof confirmCallback === 'function') {
        confirmCallback();
    }
    hideConfirmModal();
}

/**
 * Quando usuário cancela
 */
function onCancelAction() {
    console.log('❌ [CONFIRM] Ação cancelada pelo usuário');
    if (typeof cancelCallback === 'function') {
        cancelCallback();
    }
    hideConfirmModal();
}

/**
 * Inicializa os listeners dos botões da modal de confirmação
 * Liga: confirm -> onConfirmAction, cancel/close/overlay -> onCancelAction
 */
function initConfirmModalListeners() {
  const confirmBtn = document.getElementById('confirm-confirm-dialog');
  const cancelBtn = document.getElementById('cancel-confirm-dialog');
  const closeBtn = document.getElementById('close-confirm-dialog');
  const overlay = document.getElementById('overlay-confirm-dialog');
  const modal = document.getElementById('modal-confirm-dialog');

  if (confirmBtn) confirmBtn.addEventListener('click', onConfirmAction);
  if (cancelBtn) cancelBtn.addEventListener('click', onCancelAction);
  if (closeBtn) closeBtn.addEventListener('click', onCancelAction);
  if (overlay) overlay.addEventListener('click', onCancelAction);

  // Escape key closes modal
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && modal && !modal.classList.contains('hidden')) {
      onCancelAction();
    }
  });

  console.log('🔧 [CONFIRM] Listeners de confirmação inicializados');
}

// Tenta inicializar imediatamente quando o DOM estiver pronto
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initConfirmModalListeners, 10);
} else {
  document.addEventListener('DOMContentLoaded', initConfirmModalListeners);
}

// ✅ Export debug functions globally
window.testRender80mm = testRender80mm;
window.debug80mmContainer = debug80mmContainer;
//window.ensureFatura80Loaded = ensureFatura80Loaded;
window.showConfirmModal = showConfirmModal;
window.hideConfirmModal = hideConfirmModal;
window.onConfirmAction = onConfirmAction;
window.onCancelAction = onCancelAction;
window.updateConfirmModalContent = updateConfirmModalContent;

// ============================================
// EXPORTS GLOBAIS
// ============================================

// Funções de pagamento
window.processReceiptInvoice = processReceiptInvoice;
window.collectPaymentData = collectPaymentData;
window.clearCartAfterSale = clearCartAfterSale;

// Funções de recursos de fatura
window.loadInvoiceAssets = loadInvoiceAssets;
window.areInvoiceAssetsLoaded = areInvoiceAssetsLoaded;
window.resetInvoiceAssetsState = resetInvoiceAssetsState;
window.invoiceAssetsState = invoiceAssetsState;

console.log('✅ [APP] Funções de pagamento e fatura exportadas globalmente');

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
