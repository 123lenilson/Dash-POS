/* ======= MOCK DE DADOS (preenchido pela API) ======= */
let PRODUCTS = [];

const TAX_RATE = 0.15; // 15%
const DISCOUNT = 0; // Adicione lógica de desconto se necessário; por enquanto 0
const currency = new Intl.NumberFormat('pt-AO', { style:'currency', currency:'AOA', maximumFractionDigits:2 });

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

// ✅ SSE: Variável global para conexão Server-Sent Events
let sseConnection = null;
let sseReconnectAttempts = 0;
const SSE_MAX_RECONNECT_ATTEMPTS = 5;
const SSE_RECONNECT_DELAY = 3000; // 3 segundos

// ✅ CONTROLE DE TIPO DE DOCUMENTO (FATURA)
const tiposDesenvolvidos = ['fatura-recibo', 'fatura-proforma', 'fatura', 'orcamento']; // Tipos já implementados
let tipoDocumentoAtual = 'fatura-recibo'; // Tipo padrão

let currentEditingId = null;  // ID do produto sendo editado na modal
let currentInput = '';        // String para construir o input do preço na modal
let replaceOnNextDigit = false; // Flag para substituir o input ao primeiro dígito
let isQuantityMode = false;   // Flag para modo quantidade na modal de preço
let lastCartHash = null;  // Pra otimizar: só atualiza se mudou
let lastExpandedProductId = null; // Rastreia o último produto que ficou expansivo
let isSwitchingCards = false; // Flag para indicar que está trocando entre cards
let quantityInputIsSelected = false; // Flag para rastrear se o input de quantidade está selecionado

/* ======= UTIL: DEBOUNCE ======= */
function debounce(func, delay) {
  let timeout;
  return function(...args) {
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
  })
  .catch(error => {
    console.error("Erro no loadCartFromAPI:", error);
    cart.clear();
    renderCart();
  });
}



/* ======= DOM ======= */
const dateTimeEl   = document.getElementById('dateTime');
const categoryBar  = document.getElementById('categoryBar');
const productGrid  = document.getElementById('productGrid');
const searchInput  = document.getElementById('searchInput');
const clearSearch  = document.getElementById('clearSearch');

const cartList     = document.getElementById('cartList');
const cartItemsCount = document.getElementById('cartItemsCount');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartDiscount = document.getElementById('cartDiscount');
const cartTax      = document.getElementById('cartTax');
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

const clearCartOverlayBtn = document.getElementById('clearCartOverlay');
//const placeOrderOverlayBtn = document.getElementById('placeOrderOverlay');

const mobileCartBtn = document.getElementById('mobileCartBtn');
const mobileCartBadge = document.getElementById('mobileCartBadge');
const cartOverlay = document.getElementById('cartOverlay');
const closeCartOverlayBtn = document.getElementById('closeCartOverlay');

// Novo: Elementos da modal de preço
const pmOverlay = document.getElementById('pm-overlay');
const pmAmount = document.getElementById('pm-amount');
const pmConfirm = document.getElementById('pm-confirm');
const pmCancel = document.getElementById('pm-cancel');
const pmClose = document.getElementById('pm-close');
const pmKeys = document.querySelectorAll('.pm-key');

/* ======= UTIL ======= */
function nowFancy(){
  const d = new Date();
  return d.toLocaleDateString('pt-PT', { weekday:'short', day:'2-digit', month:'short', year:'numeric'}) +
         " • " + d.toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' });
}
function placeholderIMG(name){
  const initials = name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const hue = (name.length*37) % 360;
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='hsl(${hue},74%,92%)' />
      <stop offset='100%' stop-color='hsl(${(hue+40)%360},74%,85%)' />
    </linearGradient></defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, -apple-system, Segoe UI, Roboto' font-weight='700' font-size='64' fill='hsl(${hue},35%,28%)'>${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function isMobileView(){
  return window.matchMedia && window.matchMedia('(max-width:760px)').matches;
}

/* ======= FETCH ======= */
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
            <button class="category ${cat===activeCategory?'is-active':''}" data-cat="${cat}">
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
  const track    = categoryBar.querySelector('#catTrack');
  const prevBtn  = categoryBar.querySelector('.cat-arrow.prev');
  const nextBtn  = categoryBar.querySelector('.cat-arrow.next');

  track.addEventListener('click', (e) => {
    const btn = e.target.closest('.category');
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    track.querySelectorAll('.category').forEach(b => b.classList.toggle('is-active', b === btn));
    renderProducts();
  });

  function pageSize(){ return Math.max(viewport.clientWidth * 0.85, 180); }
  function scrollByPage(dir){
    viewport.scrollBy({ left: dir * pageSize(), behavior:'smooth' });
  }
  prevBtn.addEventListener('click', () => scrollByPage(-1));
  nextBtn.addEventListener('click', () => scrollByPage(+1));

  function updateWheelBlock(){
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
  function wheelBlocker(e){ e.preventDefault(); }

  function atStart(){ return viewport.scrollLeft <= 2; }
  function atEnd(){
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth - 2);
    return viewport.scrollLeft >= maxScroll;
  }
  function updateArrows(){
    const mobile = isMobileView();
    prevBtn.style.display = mobile ? 'none' : '';
    nextBtn.style.display = mobile ? 'none' : '';
    if (!mobile) {
      prevBtn.disabled = atStart();
      nextBtn.disabled = atEnd();
      categoryBar.classList.toggle('has-left-shadow', !atStart());
      categoryBar.classList.toggle('has-right-shadow', !atEnd());
    } else {
      categoryBar.classList.remove('has-left-shadow','has-right-shadow');
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

function renderProducts(){
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
function updateProductSelections(){
  const cards = productGrid.querySelectorAll('.card');
  cards.forEach(card=>{
    const id = +card.dataset.id;
    if(cart.has(id) && cart.get(id).qty > 0){
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
function renderCart(resumoServidor = null){
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
      cartList.innerHTML = items.map(({product, qty, customPrice = product.price})=>{
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
      cartListOverlay.innerHTML = items.map(({product, qty, customPrice = product.price})=>{
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
      cartList.querySelectorAll('.cart-item').forEach(row=>{
      const id = +row.dataset.id;
      row.querySelector('[data-act="minus"]').addEventListener('click', ()=> addToCart(id, -1));
      row.querySelector('[data-act="plus"]').addEventListener('click',  ()=> addToCart(id, +1));
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

      row.addEventListener('click', (e) => {
        if (!e.target.closest('.right')) {
          openPriceModal(id);
        }
      });

      const qtyDisplay = row.querySelector('.qty-display');
      if (qtyDisplay) {
        qtyDisplay.addEventListener('click', (e) => {
          e.stopPropagation();
          openPriceModal(id, true);
        });
      }
    });
    }

    if (cartListOverlay) {
      cartListOverlay.querySelectorAll('.cart-item').forEach(row=>{
      const id = +row.dataset.id;
      row.querySelector('[data-act="minus"]').addEventListener('click', ()=> addToCart(id, -1));
      row.querySelector('[data-act="plus"]').addEventListener('click',  ()=> addToCart(id, +1));
      
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

      row.addEventListener('click', (e) => {
        if (!e.target.closest('.right')) {
          openPriceModal(id);
        }
      });

      const qtyDisplay = row.querySelector('.qty-display');
      if (qtyDisplay) {
        qtyDisplay.addEventListener('click', (e) => {
          e.stopPropagation();
          openPriceModal(id, true);
        });
      }
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

  // ✅ USA RESUMO DO SERVIDOR SE DISPONÍVEL, SENÃO CALCULA LOCAL (fallback)
  let stats;
  if (resumoServidor && resumoServidor.subtotal !== undefined) {
    console.log("✅ Usando resumo do BACKEND:", resumoServidor);
    stats = {
      items: resumoServidor.total_itens,
      subtotal: resumoServidor.subtotal
    };
    var discount = resumoServidor.desconto;
    var tax = resumoServidor.taxa;
    var total = resumoServidor.total;
  } else {
    console.log("⚠️ Fallback: Calculando resumo no FRONTEND");
    stats = items.reduce((acc, it)=>{
      acc.items += it.qty;
      acc.subtotal += (it.customPrice || it.product.price) * it.qty;
      return acc;
    }, {items:0, subtotal:0});

    discount = DISCOUNT;
    tax = (stats.subtotal - discount) * TAX_RATE;
    total = stats.subtotal - discount + tax;
  }

  // Atualiza elementos do carrinho (com verificação de existência)
  if (cartItemsCount) cartItemsCount.textContent = `${stats.items}`;
  if (cartSubtotal) cartSubtotal.textContent = currency.format(stats.subtotal);
  if (cartDiscount) cartDiscount.textContent = currency.format(discount);
  if (cartTax) cartTax.textContent = currency.format(tax);
  if (cartTotalBtn) cartTotalBtn.textContent = currency.format(total);

  if (cartItemsCountOverlay) cartItemsCountOverlay.textContent = `${stats.items}`;
  if (cartSubtotalOverlay) cartSubtotalOverlay.textContent = currency.format(stats.subtotal);
  if (cartDiscountOverlay) cartDiscountOverlay.textContent = currency.format(discount);
  if (cartTaxOverlay) cartTaxOverlay.textContent = currency.format(tax);
  if (cartTotalBtnOverlay) cartTotalBtnOverlay.textContent = currency.format(total);

  if (mobileCartBadge) {
    mobileCartBadge.textContent = stats.items;
    mobileCartBadge.style.display = stats.items > 0 ? 'inline-grid' : 'none';
  }

  // ✅ Atualiza o Order Summary no footer (40% div)
  updateOrderSummaryFooter(stats.subtotal, tax, discount, total);

  updateProductSelections();
}

function removeFromCart(id) {
  if (cart.has(id)) {
    syncToAPI(id, 0);  // Envia qty=0
  }
  cart.delete(id);

  // ✅ Reseta os valores dos métodos de pagamento (mesma lógica do clearCart)
  resetFooterPaymentValues();

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
clearSearch.addEventListener('click', ()=>{
  searchInput.value = "";
  searchTerm = "";
  estaPesquisando = false;
  searchResults = [];
  searchInput.focus();
  renderProducts();
});

searchInput.addEventListener('input', debouncedSearch);

clearSearch.addEventListener('click', ()=>{
  searchInput.value = "";
  searchTerm = "";
  estaPesquisando = false;
  searchResults = [];
  searchInput.focus();
  renderProducts();
});

/* ======= GLOBAL BUTTONS ======= */
//Comentado/removido o listener original do placeOrder, pois agora a modal cuida disso
// Novo: Abre a modal de checkout


clearCartBtn?.addEventListener('click', ()=> clearCart());
clearCartOverlayBtn?.addEventListener('click', ()=> clearCart());

/* ======= MOBILE DRAWER ======= */
mobileCartBtn?.addEventListener('click', ()=> openCartOverlay());
closeCartOverlayBtn?.addEventListener('click', ()=> closeCartOverlay());
cartOverlay?.addEventListener('click', (e)=>{ if(e.target === cartOverlay) closeCartOverlay(); });

function openCartOverlay(){
  cartOverlay.classList.add('is-open');
  cartOverlay.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
function closeCartOverlay(){
  cartOverlay.classList.remove('is-open');
  cartOverlay.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

/* ======= MAIN MENU (nav) ======= */
document.querySelectorAll('.main .main-nav .nav-link').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.main .main-nav .nav-link').forEach(x=>x.classList.remove('is-active'));
    btn.classList.add('is-active');
  });
});

/* ======= DATETIME & INIT ======= */
function updateDateTime(){
  const dt = document.getElementById('dateTime');
  if(dt) dt.textContent = nowFancy();
}

function updateResponsiveUI(){
  if(isMobileView()){
    document.querySelector('.side') && (document.querySelector('.side').style.display = 'none');
    mobileCartBtn && (mobileCartBtn.style.display = 'grid');
  } else {
    document.querySelector('.side') && (document.querySelector('.side').style.display = '');
    mobileCartBtn && (mobileCartBtn.style.display = 'none');
    closeCartOverlay();
  }

  if(window.matchMedia && window.matchMedia('(max-width:890px)').matches){
    const mainNav = document.querySelector('.main .main-nav');
    if(mainNav) mainNav.style.display = '';
  }
}

/* ======= INIT ======= */
/* ======= INIT ======= */
function init(){
  carregarProdutos();  // Primeiro produtos
  loadCartFromAPI();    // NOVO: Depois carrega carrinho do DB (sequência pra reduzir race)
  renderCart();
  updateDateTime();
  setInterval(updateDateTime, 30000);
  if(+mobileCartBadge.textContent === 0) mobileCartBadge.style.display = 'none';
  updateResponsiveUI();
  window.addEventListener('resize', updateResponsiveUI);

  // ✅ SSE: Substitui o polling de 500ms por conexão persistente
  initSSE();

  // Adicionar event listeners para a modal de preço (uma vez só)
  setupPriceModalListeners();

  // ✅ ADICIONE ESTA LINHA AQUI:
  initInvoiceTypeSelector();  // ← NOVA LINHA
}
init();

// ✅ GARANTIR EXECUÇÃO EM MÚLTIPLOS MOMENTOS
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInvoiceTypeSelector);
} else {
  initInvoiceTypeSelector();
}

// ✅ SEGUNDA TENTATIVA após 500ms (para garantir que o HTML renderizou)
setTimeout(initInvoiceTypeSelector, 500);

// ✅ TERCEIRA TENTATIVA ao carregar completamente a janela
window.addEventListener('load', initInvoiceTypeSelector);

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
 * ✅ FUNÇÃO CORRIGIDA: Seleciona tipo de documento
 * Agora sincroniza desktop e mobile automaticamente
 */
function selecionarTipoDocumento(tipo) {
  console.log(`📋 [TIPO DOC] Tentando selecionar: ${tipo}`);
  
  // Verifica se o tipo já foi desenvolvido
  if (!tiposDesenvolvidos.includes(tipo)) {
    console.warn(`⚠️ [TIPO DOC] Tipo "${tipo}" ainda não desenvolvido`);
    
    const nomeAmigavel = {
      'fatura-recibo': 'Fatura Recibo',
      'fatura-proforma': 'Fatura Proforma',
      'fatura': 'Fatura',
      'orcamento': 'Orçamento'
    };
    
    const nomeDocumento = nomeAmigavel[tipo] || tipo.replace('-', ' ');
    
    showAlert('warning', '🚧 Em Desenvolvimento', 
      `O tipo de documento "${nomeDocumento}" ainda não foi implementado. Por favor, selecione "Fatura Recibo".`);
    
    // ✅ CORREÇÃO: Força seleção de fatura-recibo em AMBOS os lugares
    syncRadioSelection('fatura-recibo');
    return false;
  }
  
  // Atualiza variável global
  tipoDocumentoAtual = tipo;
  console.log(`✅ [TIPO DOC] Tipo selecionado: ${tipo}`);
  
  // ✅ SINCRONIZA todos os radios (desktop + mobile)
  syncRadioSelection(tipo);
  
  // Atualiza interface da modal se estiver aberta
  if (typeof updateModalInterfaceByDocumentType === 'function') {
    updateModalInterfaceByDocumentType();
  }
  
  // Mostrar seletor de formato de fatura quando fatura-recibo for selecionado
  if (tipo === 'fatura-recibo') {
    // Pequeno delay para garantir que a interface foi atualizada
    setTimeout(showInvoiceFormatSelector, 100);
  } else {
    // Esconder o seletor para outros tipos
    hideInvoiceFormatSelector();
  }
  
  return true;
}

/**
 * ✅ NOVA FUNÇÃO: Sincroniza seleção entre desktop e mobile
 */
function syncRadioSelection(tipo) {
  const allRadios = document.querySelectorAll('input[name="invoiceType"]');
  
  allRadios.forEach(radio => {
    const parent = radio.closest('.invoice-radio-option');
    
    if (radio.value === tipo) {
      // ✅ SELECIONA
      radio.checked = true;
      radio.setAttribute('checked', 'checked');
      
      if (parent) {
        parent.classList.add('selected', 'active');
        parent.style.borderColor = 'var(--accent)';
        parent.style.backgroundColor = '#f8f9ff';
        parent.style.transform = 'translateX(2px)';
      }
      
      // Força atualização do custom radio
      const customRadio = radio.nextElementSibling;
      if (customRadio && customRadio.classList.contains('radio-custom')) {
        customRadio.style.borderColor = 'var(--accent)';
        customRadio.style.backgroundColor = 'var(--accent)';
      }
      
    } else {
      // ✅ DESSELECIONA
      radio.checked = false;
      radio.removeAttribute('checked');
      
      if (parent) {
        parent.classList.remove('selected', 'active');
        parent.style.borderColor = '#e6edf6';
        parent.style.backgroundColor = '#fff';
        parent.style.transform = 'translateX(0)';
      }
      
      // Reseta custom radio
      const customRadio = radio.nextElementSibling;
      if (customRadio && customRadio.classList.contains('radio-custom')) {
        customRadio.style.borderColor = '#cbd5e1';
        customRadio.style.backgroundColor = 'transparent';
      }
    }
  });
  
  console.log(`🔄 Sincronizados ${allRadios.length} radios para: ${tipo}`);
}


/**
 * ✅ CONFIGURAÇÃO INICIAL - EXECUTE LOGO APÓS O DOM CARREGAR
 */
function initInvoiceTypeSelector() {
  console.log('🔧 [TIPO DOC] Inicializando seletor de tipo de documento...');
  
  // 1️⃣ Define estado global
  tipoDocumentoAtual = 'fatura-recibo';
  
  // 2️⃣ Encontra TODOS os radios (desktop + mobile)
  const allRadios = document.querySelectorAll('input[name="invoiceType"]');
  
  console.log(`📻 Encontrados ${allRadios.length} radio buttons`);
  
  if (allRadios.length === 0) {
    console.warn('⚠️ [TIPO DOC] Nenhum radio button encontrado! Verificar HTML.');
    return;
  }
  
  // 3️⃣ Adiciona listeners e força estado inicial
  allRadios.forEach((radio, index) => {
    // Remove listeners antigos (evita duplicação)
    const newRadio = radio.cloneNode(true);
    radio.parentNode.replaceChild(newRadio, radio);
    
    // Adiciona listener novo
    newRadio.addEventListener('change', (e) => {
      const tipo = e.target.value;
      console.log(`🎯 Radio ${index + 1} mudou para: ${tipo}`);
      selecionarTipoDocumento(tipo);
    });
    
    // ✅ FORÇA estado inicial EXPLICITAMENTE
    if (newRadio.value === 'fatura-recibo') {
      newRadio.checked = true;
      newRadio.setAttribute('checked', 'checked');
      
      // Força classes visuais no label pai
      const parent = newRadio.closest('.invoice-radio-option');
      if (parent) {
        parent.classList.add('selected', 'active');
        parent.style.borderColor = 'var(--accent)';
        parent.style.backgroundColor = '#f8f9ff';
      }
    } else {
      newRadio.checked = false;
      newRadio.removeAttribute('checked');
      
      const parent = newRadio.closest('.invoice-radio-option');
      if (parent) {
        parent.classList.remove('selected', 'active');
        parent.style.borderColor = '#e6edf6';
        parent.style.backgroundColor = '#fff';
      }
    }
  });
  
  // 4️⃣ SYNC final para garantir
  syncRadioSelection('fatura-recibo');
  
  // Show format selector if fatura-recibo is selected
  if (tipoDocumentoAtual === 'fatura-recibo') {
    setTimeout(showInvoiceFormatSelector, 100);
  }
  
  console.log('✅ [TIPO DOC] Seletor inicializado com sucesso');
  console.log(`📋 Tipo atual: ${tipoDocumentoAtual}`);
}

// ✅ ADICIONAR ESTE CÓDIGO PARA GARANTIR QUE O ESTADO VISUAL SEJA APLICADO APÓS O CARREGAMENTO DA PÁGINA
// Removido DOMContentLoaded duplicado - syncRadioSelection é chamado por initInvoiceTypeSelector

/**
 * Retorna o tipo de documento atualmente selecionado
 */
function getTipoDocumentoAtual() {
  return tipoDocumentoAtual;
}

/**
 * Retorna o formato de fatura selecionado
 */
function getInvoiceFormat() {
  const selectedRadio = document.querySelector('input[name="invoiceFormat"]:checked');
  return selectedRadio ? selectedRadio.value : localStorage.getItem('invoiceFormat') || 'A4';
}

// Adiciona listener aos radio buttons de tipo de documento
function setupInvoiceTypeListeners() {
  // Add listeners to invoice type radio buttons
  const invoiceTypeRadios = document.querySelectorAll('input[name="invoiceType"]');
  
  invoiceTypeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'fatura-recibo') {
        setTimeout(showInvoiceFormatSelector, 100);
      } else {
        hideInvoiceFormatSelector();
      }
    });
  });
}

// Call the setup function
setupInvoiceTypeListeners();


/* ===== Menu responsivo ===== */
(function setupResponsiveMenu(){
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mainHeader = document.querySelector('.main-header');
  const mainNav = document.querySelector('.main .main-nav');

  if(!mobileBtn || !mainHeader || !mainNav) return;

  function setOpenState(open){
    if(open){
      mainHeader.classList.add('nav-open');
      mobileBtn.setAttribute('aria-expanded','true');
      document.body.style.overflow = 'hidden';
    } else {
      mainHeader.classList.remove('nav-open');
      mobileBtn.setAttribute('aria-expanded','false');
      document.body.style.overflow = '';
    }
  }

  mobileBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const isOpen = mainHeader.classList.contains('nav-open');
    setOpenState(!isOpen);
  });

  document.querySelectorAll('.main .main-nav .nav-link').forEach(link=>{
    link.addEventListener('click', ()=>{
      if(window.matchMedia && window.matchMedia('(max-width:890px)').matches){
        setOpenState(false);
      }
    });
  });

  document.addEventListener('click', (e)=>{
    if(!mainHeader.classList.contains('nav-open')) return;
    if(!mainHeader.contains(e.target) && e.target !== mobileBtn){
      setOpenState(false);
    }
  });

  window.addEventListener('resize', ()=>{
    if(!(window.matchMedia && window.matchMedia('(max-width:890px)').matches)){
      setOpenState(false);
    }
  });
})();

// Função para configurar listeners da modal (chamada no init)
// Função para configurar listeners da modal (chamada no init)
function setupPriceModalListeners() {
  pmKeys.forEach(key => {
    key.addEventListener('click', () => {
      const value = key.dataset.key;
      handleKeyInput(value);
    });
  });

  // ✅ CONFIGURAÇÃO DO INPUT: Previne edição direta e controla cursor
  const pmInput = document.getElementById('pm-amount');
  if (pmInput) {
    // Função para forçar cursor no final
    const forceCursorToEnd = function() {
      const len = this.value.length;
      this.setSelectionRange(len, len);
    };

    // ✅ Previne que o input aceite entrada direta
    pmInput.addEventListener('input', function(e) {
      e.preventDefault();
      // Restaura o valor correto
      updatePriceDisplay();
    });

    // ✅ CRÍTICO: Previne seleção de texto
    pmInput.addEventListener('select', function(e) {
      e.preventDefault();
      forceCursorToEnd.call(this);
    });

    // ✅ Garante que o cursor sempre fica no final ao clicar
    pmInput.addEventListener('click', forceCursorToEnd);

    // ✅ Garante que o cursor sempre fica no final ao focar
    pmInput.addEventListener('focus', forceCursorToEnd);

    // ✅ Garante que o cursor sempre fica no final ao mover mouse
    pmInput.addEventListener('mousedown', forceCursorToEnd);
    pmInput.addEventListener('mouseup', forceCursorToEnd);

    // ✅ Garante que o cursor sempre fica no final ao usar teclado
    pmInput.addEventListener('keyup', function(e) {
      // Não força em teclas de ação (Enter, Escape, etc)
      if (!['Enter', 'Escape', 'Tab'].includes(e.key)) {
        forceCursorToEnd.call(this);
      }
    });

    // ✅ CRÍTICO: Previne movimento do cursor com setas, Home, End
    pmInput.addEventListener('keydown', function(e) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        forceCursorToEnd.call(this);
      }
    });

    // ✅ Observa mudanças na posição do cursor continuamente
    setInterval(() => {
      if (document.activeElement === pmInput) {
        const len = pmInput.value.length;
        if (pmInput.selectionStart !== len || pmInput.selectionEnd !== len) {
          pmInput.setSelectionRange(len, len);
        }
      }
    }, 10);

    console.log('✅ [SETUP] Listeners do input configurados com bloqueio total de cursor');
  }

  // ✅ CORREÇÃO NO CONFIRM
  pmConfirm.addEventListener('click', () => {
    if (!currentEditingId) {
      console.warn("Nenhum produto em edição!");
      closePriceModal();
      return;
    }

    let newValue;
    
    if (isQuantityMode) {
      // Modo Quantidade
      newValue = parseInt(currentInput) || 0;
      if (newValue > 0) {
        console.log(`✅ Confirmando QUANTIDADE: ${newValue} para produto ${currentEditingId}`);
        syncToAPI(currentEditingId, newValue, null);  // qty override, preço null
      } else {
        alert("Quantidade inválida!");
        return;
      }
    } else {
      // Modo Preço Customizado
      newValue = parseFloat(currentInput) || 0;
      if (newValue > 0) {
        console.log(`✅ Confirmando PREÇO CUSTOM: ${newValue.toFixed(2)} para produto ${currentEditingId}`);
        
        // ✅ CRITICAL: Busca a quantidade ATUAL do carrinho
        const entry = cart.get(currentEditingId);
        if (!entry) {
          console.error("Produto não encontrado no carrinho!");
          closePriceModal();
          return;
        }
        
        const qtyAtual = entry.qty;
        console.log(`Quantidade atual no carrinho: ${qtyAtual}`);
        
        // ✅ Envia QTY ATUAL + PREÇO CUSTOM (ambos explícitos)
        syncToAPI(currentEditingId, qtyAtual, newValue.toFixed(2));
      } else {
        alert("Preço inválido!");
        return;
      }
    }
    
    closePriceModal();
  });

  pmCancel.addEventListener('click', closePriceModal);
  pmClose.addEventListener('click', closePriceModal);
}

// Nova função para processar input (de botões ou teclado)
// ✅ REFATORADA: Aplicando lógica do modal_checkout para evitar problemas de cursor
function handleKeyInput(value) {
  // ✅ CLEAR: Limpa tudo
  if (value === 'C') {
    currentInput = '0';
    replaceOnNextDigit = false;
  }
  // ✅ BACKSPACE: Remove último caractere
  else if (value === 'back') {
    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
      // Se ficou apenas ".", converte para "0"
      if (currentInput === '.') {
        currentInput = '0';
      }
    } else {
      currentInput = '0';
    }
    replaceOnNextDigit = false;
  }
  // ✅ PONTO DECIMAL (apenas no modo preço)
  else if (value === '.' || value === ',') {
    if (isQuantityMode) return;  // ← BLOQUEIA PONTO NO MODO QUANTIDADE

    // Verifica se já existe ponto decimal
    if (currentInput.includes('.')) {
      return; // ⛔ NÃO permite múltiplos pontos
    }

    // Se estiver em modo de substituição, inicia com "0."
    if (replaceOnNextDigit) {
      currentInput = '0.';
      replaceOnNextDigit = false;
    }
    // Se o valor é "0" ou vazio, adiciona "0."
    else if (currentInput === '0' || currentInput === '') {
      currentInput = '0.';
    }
    // Adiciona o ponto à string existente
    else {
      currentInput += '.';
    }
  }
  // ✅ NÚMEROS (0-9)
  else if (/\d/.test(value)) {
    // Se estiver em modo de substituição, substitui completamente
    if (replaceOnNextDigit) {
      currentInput = value;
      replaceOnNextDigit = false;
    }
    // Se o valor atual é apenas "0" (sem ponto), substitui pelo novo dígito
    else if (currentInput === '0' && value === '0') {
      currentInput = '0';
    }
    else if (currentInput === '0') {
      currentInput = value;
    }
    // Se o valor atual é "0." (início de decimal), adiciona normalmente
    else if (currentInput === '0.') {
      currentInput = currentInput + value;
    }
    // Se já existe ponto decimal, verifica limite de 2 casas decimais
    else if (currentInput.includes('.')) {
      const parts = currentInput.split('.');
      // Limita a 2 casas decimais (apenas no modo preço)
      if (!isQuantityMode && parts[1] && parts[1].length >= 2) {
        return; // Não adiciona mais dígitos após 2 casas decimais
      }
      currentInput = currentInput + value;
    }
    // Adiciona ao valor existente
    else {
      currentInput = currentInput + value;
    }
  }

  updatePriceDisplay();
}

// ✅ NOVA FUNÇÃO: Atualiza preview do item no carrinho em tempo real
function updateCartItemPreview() {
  console.log('🔄 [PREVIEW] updateCartItemPreview chamada');
  console.log('🔄 [PREVIEW] currentEditingId:', currentEditingId);
  console.log('🔄 [PREVIEW] isQuantityMode:', isQuantityMode);
  console.log('🔄 [PREVIEW] currentInput:', currentInput);

  if (!currentEditingId) {
    console.warn('⚠️ [PREVIEW] currentEditingId é null, saindo...');
    return;
  }

  const entry = cart.get(currentEditingId);
  if (!entry) {
    console.warn('⚠️ [PREVIEW] Produto não encontrado no carrinho');
    return;
  }

  console.log('✅ [PREVIEW] Entry encontrada:', entry);

  // Calcula valores temporários baseado no que está sendo digitado
  let previewQty = entry.qty;
  let previewPrice = entry.customPrice || entry.product.price;

  if (isQuantityMode) {
    // Se está editando quantidade, usa o valor sendo digitado
    previewQty = parseInt(currentInput) || 0;
    console.log('📊 [PREVIEW] Modo QUANTIDADE - previewQty:', previewQty);
  } else {
    // Se está editando preço, usa o valor sendo digitado
    previewPrice = parseFloat(currentInput) || 0;
    console.log('💰 [PREVIEW] Modo PREÇO - previewPrice:', previewPrice);
  }

  const previewTotal = previewPrice * previewQty;
  const precoCustomizado = entry.product.preco_customizado === "1" ? ' (Custom)' : '';

  console.log('🧮 [PREVIEW] Calculado - Qtd:', previewQty, 'Preço:', previewPrice, 'Total:', previewTotal);

  // Atualiza AMBOS os cards (desktop e mobile)
  const cartItems = document.querySelectorAll(`.cart-item[data-id="${currentEditingId}"]`);
  console.log('🔍 [PREVIEW] Cards encontrados:', cartItems.length);

  cartItems.forEach((item, index) => {
    console.log(`📦 [PREVIEW] Atualizando card ${index + 1}`);

    const metaDiv = item.querySelector('.meta');
    if (metaDiv) {
      const novoConteudo = `${currency.format(previewPrice)}${precoCustomizado} × ${previewQty} = <strong>${currency.format(previewTotal)}</strong>`;
      metaDiv.innerHTML = novoConteudo;
      console.log('✅ [PREVIEW] Meta atualizada:', novoConteudo);
    } else {
      console.warn('⚠️ [PREVIEW] .meta não encontrado');
    }

    const qtyDisplay = item.querySelector('.qty-display');
    if (qtyDisplay) {
      qtyDisplay.textContent = previewQty;
      console.log('✅ [PREVIEW] qty-display atualizado:', previewQty);
    } else {
      console.warn('⚠️ [PREVIEW] .qty-display não encontrado');
    }
  });

  console.log('✅ [PREVIEW] Atualização concluída!');
}

// Atualizar o display da modal (genérico para preço ou qty)
function updatePriceDisplay() {
  let displayValue;
  if (isQuantityMode) {
    displayValue = currentInput ? parseInt(currentInput) : '0';  // Inteiro para qty
  } else {
    const floatVal = currentInput ? parseFloat(currentInput) : 0;
    displayValue = floatVal.toFixed(2);  // 2 decimais para preço
  }

  // ✅ CORRIGIDO: Usa .value para input em vez de .textContent
  const pmInput = document.getElementById('pm-amount');
  if (pmInput) {
    pmInput.value = displayValue;
    // Garante que o cursor fica no final após atualização
    pmInput.selectionStart = pmInput.selectionEnd = pmInput.value.length;
  }

  // Atualiza label dinâmico
  const pmLabel = document.getElementById('pm-label');
  if (pmLabel) pmLabel.textContent = isQuantityMode ? 'Quantidade:' : 'Preço:';
  // ✅ CORRIGIDO: Desabilita confirm se inválido (considerando '0' como inválido)
  pmConfirm.disabled = !currentInput || currentInput === '0' || currentInput === '0.' || (isQuantityMode ? parseInt(currentInput) <= 0 : parseFloat(currentInput) <= 0);

  // ✅ NOVO: Atualiza o card do carrinho em tempo real enquanto digita
  updateCartItemPreview();
}

// Função para lidar com keydown do teclado
function handleKeyboardInput(e) {
  const key = e.key;
  if (/\d/.test(key)) {
    handleKeyInput(key);
  } else if (key === '.' || key === ',' || key === 'Decimal') {  // ✅ Aceita . , e Decimal do numpad
    handleKeyInput('.');
  } else if (key === 'Backspace') {
    handleKeyInput('back');
  } else if (key === 'Delete') {
    handleKeyInput('C');
  } else if (key === 'Enter') {
    pmConfirm.click();
  } else if (key === 'Escape') {
    closePriceModal();
  } else {
    return;
  }
  e.preventDefault(); // Prevenir comportamentos padrão como scroll
}

// Abrir a modal de preço (genérica para preço ou quantidade)
function openPriceModal(productId, isQtyMode = false) {
  console.log("=== openPriceModal CHAMADA ===");
  console.log("productId:", productId);
  console.log("isQtyMode:", isQtyMode);

  let entry;
  
  if (isQtyMode) {
    // Modo quantidade: Produto DEVE existir no carrinho
    entry = cart.get(productId);
    if (!entry) {
      console.warn("Produto não está no carrinho para ajustar quantidade");
      return;
    }
  } else {
    // Modo preço: Produto DEVE existir no carrinho
    entry = cart.get(productId);
    if (!entry) {
      console.warn("Produto não está no carrinho para customizar preço");
      return;
    }
  }

  currentEditingId = productId;
  isQuantityMode = isQtyMode;

  const initialValue = isQtyMode ? entry.qty : (entry.customPrice || entry.product.price);
  currentInput = initialValue.toString().replace('.', '');
  replaceOnNextDigit = true;

  // Atualiza título da modal dinamicamente
  const modalTitle = document.getElementById('pm-title');
  if (modalTitle) {
    modalTitle.textContent = isQuantityMode ? 'Adicionar Quantidade' : 'Ajustar Preço';
  }

  updatePriceDisplay();
  pmOverlay.classList.add('is-open');
  pmOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // ✅ FOCO AUTOMÁTICO no input para permitir digitação via teclado físico
  setTimeout(() => {
    const pmInput = document.getElementById('pm-amount');
    if (pmInput) {
      pmInput.focus();
      // Garante que o cursor fica no final
      pmInput.selectionStart = pmInput.selectionEnd = pmInput.value.length;
      console.log('🎯 [FOCUS] Input focado automaticamente!');
    }
  }, 100);

  if (!isMobileView()) {
    document.addEventListener('keydown', handleKeyboardInput);
  }

  console.log(`Modal aberta - ID: ${productId}, Modo: ${isQtyMode ? 'QUANTIDADE' : 'PREÇO'}, Valor inicial: ${initialValue}`);
  console.log("===========================");
}

// Fechar a modal de preço
function closePriceModal() {
  pmOverlay.classList.remove('is-open');
  pmOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentInput = '0';  // ✅ CORRIGIDO: Reseta para '0' em vez de string vazia
  currentEditingId = null;
  replaceOnNextDigit = false;
  isQuantityMode = false;  // Reset para preço default

  // Remover listener de teclado
  document.removeEventListener('keydown', handleKeyboardInput);
}

// ===== FUNÇÕES DE MODAL DE STOCK REMOVIDAS =====
// Substituído por showCriticalAlert para alertas de stock insuficiente

// Função para criar e exibir alertas
function showAlert(type, title, message, duration = 4000) {
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
        syncRadioSelection('fatura-recibo');
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
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔵 Inicializando toggle do código de barras...');
    const toggle = document.getElementById('barcodeToggle');

    if (toggle) {
        console.log('✅ Toggle encontrado!');
        // Inicializa como ativo
        toggle.checked = true;
        isBarcodeEnabled = true;
        barcodeToggleContainer?.classList.add('active');

        // Event listener para mudanças no toggle
        toggle.addEventListener('change', function(e) {
            console.log('🔄 Toggle mudou para:', e.target.checked);
            toggleBarcodeScanner(e.target.checked);
        });

        console.log('✅ Event listener do toggle adicionado com sucesso!');
    } else {
        console.error('❌ Toggle de código de barras não encontrado!');
    }
});

// Adiciona controle por teclado (Alt+B)
document.addEventListener('keydown', function(e) {
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
    function() {
        console.log('✅ [CART] Usuário confirmou remoção do produto:', productName);
        removeFromCart(productId);
        showAlert("success", "✅ Item Removido", `${productName} foi removido do carrinho`);
    },
    // Callback quando cancelar (opcional)
    function() {
        console.log('❌ [CART] Usuário cancelou remoção do produto:', productName);
    });
}
console.log('✅ Sistema de código de barras inicializado');
console.log('💡 Digite "barcodeStats()" no console para ver estatísticas');

// Função para mostrar o seletor de formato de fatura
function showInvoiceFormatSelector() {
  const formatSelector = document.getElementById('invoiceFormatSelection');
  const formatSelectorMobile = document.getElementById('invoiceFormatSelectionMobile');
  
  if (formatSelector) {
    formatSelector.classList.remove('hidden');
  }
  
  if (formatSelectorMobile) {
    formatSelectorMobile.classList.remove('hidden');
  }
  
  // Set default selection to A4 if nothing is selected
  const formatRadios = document.querySelectorAll('input[name="invoiceFormat"]');
  let hasSelection = false;
  
  formatRadios.forEach(radio => {
    if (radio.checked) {
      hasSelection = true;
    }
  });
  
  if (!hasSelection && formatRadios.length > 0) {
    formatRadios[0].checked = true; // Select A4 by default
  }
}

// Função para esconder o seletor de formato de fatura
function hideInvoiceFormatSelector() {
  const formatSelector = document.getElementById('invoiceFormatSelection');
  const formatSelectorMobile = document.getElementById('invoiceFormatSelectionMobile');
  
  if (formatSelector) {
    formatSelector.classList.add('hidden');
  }
  
  if (formatSelectorMobile) {
    formatSelectorMobile.classList.add('hidden');
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
document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners for format selection
  const formatRadios = document.querySelectorAll('input[name="invoiceFormat"]');
  
  formatRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      // Store selection in localStorage when changed
      localStorage.setItem('invoiceFormat', this.value);
    });
  });
  
  // Set initial selection if stored
  const savedFormat = localStorage.getItem('invoiceFormat');
  if (savedFormat) {
    const savedRadio = document.querySelector(`input[name="invoiceFormat"][value="${savedFormat}"]`);
    if (savedRadio) {
      savedRadio.checked = true;
    }
  } else {
    // Default to A4
    const defaultRadio = document.querySelector('input[name="invoiceFormat"][value="A4"]');
    if (defaultRadio) {
      defaultRadio.checked = true;
    }
  }
});
// ===== INTEGRAÇÃO COM CHECKOUT INTEGRADO =====
// Sobrescreve renderCart para sincronizar com checkout
const _originalRenderCart = renderCart;
renderCart = function(...args) {
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
document.addEventListener('cartChanged', function(e) {
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
}

/**
 * Inicializa os event listeners para os toggles de tipo de fatura
 */
function initInvoiceTypePanelToggles() {
    // Toggles de tipo de fatura
    const invoiceToggles = document.querySelectorAll('.invoice-toggle-option');
    invoiceToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            // Remove active de todos os toggles de fatura
            invoiceToggles.forEach(t => t.classList.remove('active'));
            // Adiciona active no toggle clicado
            this.classList.add('active');
            // Marca o radio como checked
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;

            // Atualiza o texto no botão do cabeçalho
            const invoiceType = this.dataset.invoiceType;
            updateInvoiceTypeDisplay(invoiceType);

            console.log('📄 Tipo de fatura selecionado:', invoiceType);

            // Fecha o painel automaticamente, exceto para fatura-recibo (precisa escolher formato)
            if (invoiceType !== 'fatura-recibo') {
                closeDocPanel();
            }
        });
    });

    // Toggles de formato (A4 / 80mm)
    const formatToggles = document.querySelectorAll('.format-toggle-option');
    formatToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            // Remove active de todos os toggles de formato
            formatToggles.forEach(t => t.classList.remove('active'));
            // Adiciona active no toggle clicado
            this.classList.add('active');
            // Marca o radio como checked
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;

            // Atualiza o texto no botão do cabeçalho
            const format = this.dataset.format;
            updateInvoiceFormatDisplay(format);

            console.log('📐 Formato selecionado:', format);

            // Fecha o painel após selecionar o formato
            closeDocPanel();
        });
    });
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

    // Sempre mostra o formato e a seta
    const formatDisplay = document.getElementById('selectedDocFormat');
    const arrowDisplay = document.querySelector('.doc-arrow');

    if (formatDisplay) formatDisplay.style.display = 'inline';
    if (arrowDisplay) arrowDisplay.style.display = 'inline';

    // Para tipos diferentes de fatura-recibo, sempre mostra A4 como padrão
    if (invoiceType !== 'fatura-recibo') {
        if (formatDisplay) formatDisplay.textContent = 'Formato A4';
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
document.addEventListener('DOMContentLoaded', function() {
    initInvoiceTypePanelToggles();
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

    // Atualiza o nome no botão cliente
    const topClientName = document.getElementById('topSelectedClient');
    if (topClientName) {
        topClientName.textContent = clientName;
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
            type="number"
            id="qty-${productId}"
            value="${qty}"
            min="1"
            step="1"
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
            value="${formatCurrencyInput(price)}"
            readonly
            onclick="event.stopPropagation()"
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

  // Colapsa todos os cards
  allCards.forEach(card => card.classList.remove('expanded'));

  // SEMPRE expande o card clicado (não faz toggle)
  clickedCard.classList.add('expanded');

  // Armazena qual produto foi expandido por último (como número)
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

  // Sincroniza com a API
  syncToAPI(productId, null, price);
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
  function() {
    console.log('✅ [CART] Usuário confirmou remoção do produto:', productName);

    // Remove do carrinho usando o ID numérico
    cart.delete(numericId);

    // Sincroniza com a API usando o ID numérico
    syncToAPI(numericId, 0, null);

    // ✅ Reseta os valores dos métodos de pagamento
    resetFooterPaymentValues();

    // Atualiza a exibição
    updateCartDisplay();

    // Limpa o registro do último card expandido se for o removido
    if (lastExpandedProductId === numericId) {
      lastExpandedProductId = null;
    }

    showAlert("success", "✅ Item Removido", `${productName} foi removido do carrinho`);
  },
  // Callback quando cancelar
  function() {
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
  function() {
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
  function() {
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

  console.log('✅ [FOOTER] Cards renderizados');
}

/**
 * Inicializa o slider de métodos de pagamento
 * Arrows only appear when content overflows
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

  // Check if overflow exists and toggle arrows visibility
  function checkOverflow() {
    const hasOverflow = track.scrollWidth > track.clientWidth;
    wrapper.classList.toggle('has-overflow', hasOverflow);
    if (hasOverflow) {
      updateArrowsState();
    }
  }

  // Update arrows disabled state
  function updateArrowsState() {
    const scrollLeft = track.scrollLeft;
    const maxScroll = track.scrollWidth - track.clientWidth;

    prevBtn.disabled = scrollLeft <= 0;
    nextBtn.disabled = scrollLeft >= maxScroll - 1;
  }

  // Scroll by page
  function scrollByPage(direction) {
    const pageSize = Math.max(track.clientWidth * 0.8, 100);
    track.scrollBy({ left: direction * pageSize, behavior: 'smooth' });
  }

  // Event listeners
  prevBtn.addEventListener('click', () => scrollByPage(-1));
  nextBtn.addEventListener('click', () => scrollByPage(+1));
  track.addEventListener('scroll', updateArrowsState);

  // Initial check
  checkOverflow();

  // Re-check on resize
  window.addEventListener('resize', checkOverflow);
}

/**
 * Inicializa a seleção de métodos de pagamento
 */
function initPaymentMethodsSelection() {
  const cards = document.querySelectorAll('#paymentMethodsTrack .pm-card');

  cards.forEach(card => {
    card.addEventListener('click', function() {
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
    // Clicou no método que já está sendo editado: DESELECIONA
    console.log('❎ [FOOTER] Deselecionando método:', method);

    // Salva o valor digitado para este método
    const valorDigitado = parseFloat(footerCashAmount) || 0;
    footerValoresPorMetodo[method] = valorDigitado;
    console.log(`💾 [FOOTER] Salvando ${method}: ${valorDigitado} Kz`);

    // Limpa o método atual
    selectedPaymentMethod = null;
    footerCashAmount = '0';
    updateFooterCashDisplay();

  } else {
    // Clicou em um NOVO método para editar
    console.log('✅ [FOOTER] Selecionando método:', method);

    // 1️⃣ SALVA o valor do método anterior (se houver)
    if (selectedPaymentMethod) {
      const valorDigitado = parseFloat(footerCashAmount) || 0;
      footerValoresPorMetodo[selectedPaymentMethod] = valorDigitado;
      console.log(`💾 [FOOTER] Salvando ${selectedPaymentMethod}: ${valorDigitado} Kz`);
    }

    // 2️⃣ Define o novo método atual
    selectedPaymentMethod = method;

    // 3️⃣ Carrega o valor JÁ SALVO deste método (se houver)
    const valorSalvo = footerValoresPorMetodo[method] || 0;
    footerCashAmount = valorSalvo > 0 ? String(valorSalvo) : '0';
    updateFooterCashDisplay();

    console.log(`📥 [FOOTER] Carregando ${method}: ${footerCashAmount} Kz`);

    // 4️⃣ Foco automático no input
    setTimeout(() => {
      setupFooterKeyboardListener();
      const cashInput = document.getElementById('footerCashInput');
      if (cashInput) {
        cashInput.focus();
        console.log('🎯 [FOOTER] Input focado!');
      }
    }, 100);
  }

  // 5️⃣ Atualiza a interface dos cards
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
    // 🔴 AINDA FALTA PAGAR
    statusLabel.textContent = 'Valor em falta';
    statusValue.textContent = diferenca.toLocaleString('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' Kz';
    statusIcon.innerHTML = iconWarning;
    statusElement.classList.add('visible', 'state-remaining');
    console.log(`🔴 [STATUS] Falta pagar: ${diferenca.toFixed(2)} Kz`);

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
    statusValue.textContent = '✓';
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

/**
 * Configura listeners para o input capturar teclado físico
 */
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
  cashInput.addEventListener('input', function(e) {
    e.preventDefault();
    updateFooterCashDisplay();
  });

  // Cursor sempre no final
  cashInput.addEventListener('click', function() {
    this.selectionStart = this.selectionEnd = this.value.length;
  });

  cashInput.addEventListener('focus', function() {
    this.selectionStart = this.selectionEnd = this.value.length;
  });

  console.log('✅ [FOOTER] Listener do teclado físico configurado');
}

/**
 * Manipula entrada do teclado físico
 */
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

/**
 * Processa entrada do keypad virtual ou teclado físico
 */
function footerKeypadInput(value) {
  // Verifica se há método selecionado
  if (!selectedPaymentMethod) {
    console.warn('⚠️ [FOOTER] Nenhum método selecionado — clique num método antes de digitar.');
    return;
  }

  const currentValue = footerCashAmount || '0';

  // LÓGICA PARA PONTO DECIMAL
  if (value === '.' || value === ',') {
    // Verifica se já existe ponto decimal
    if (currentValue.includes('.')) {
      console.log('⚠️ [FOOTER] Já existe ponto decimal - ignorando');
      return;
    }

    // Se for o primeiro caractere, adiciona "0." antes
    if (currentValue === '0' || currentValue === '') {
      footerCashAmount = '0.';
    } else {
      footerCashAmount = currentValue + '.';
    }
  }
  // LÓGICA PARA NÚMEROS
  else if (/\d/.test(value)) {
    // Se o valor atual é "0" e digita "0", mantém "0"
    if (currentValue === '0' && value === '0') {
      footerCashAmount = '0';
    }
    // Se o valor atual é "0", substitui pelo novo dígito
    else if (currentValue === '0') {
      footerCashAmount = value;
    }
    // Se o valor atual é "0.", adiciona normalmente
    else if (currentValue === '0.') {
      footerCashAmount = currentValue + value;
    }
    // Adiciona ao valor existente
    else {
      footerCashAmount = currentValue + value;
    }

    // Limita a 2 casas decimais após o ponto
    if (footerCashAmount.includes('.')) {
      const parts = footerCashAmount.split('.');
      if (parts[1] && parts[1].length > 2) {
        footerCashAmount = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
  }

  // Salva valor para o método atual
  const numericValue = parseFloat(footerCashAmount) || 0;
  footerValoresPorMetodo[selectedPaymentMethod] = numericValue;

  updateFooterCashDisplay();
  updateFooterPaymentCards();
}

/**
 * Remove o último caractere (backspace)
 */
function backspaceFooterCash() {
  // Verifica se há método selecionado
  if (!selectedPaymentMethod) {
    console.warn('⚠️ [FOOTER] Nenhum método selecionado.');
    return;
  }

  if (footerCashAmount.length > 1) {
    footerCashAmount = footerCashAmount.slice(0, -1);
    // Se ficou apenas ".", volta para "0"
    if (footerCashAmount === '.') {
      footerCashAmount = '0';
    }
  } else {
    footerCashAmount = '0';
  }

  // Salva valor para o método atual
  const numericValue = parseFloat(footerCashAmount) || 0;
  footerValoresPorMetodo[selectedPaymentMethod] = numericValue;

  updateFooterCashDisplay();
  updateFooterPaymentCards();
}

/**
 * Limpa o valor (clear)
 */
function clearFooterCash() {
  footerCashAmount = '0';

  // Se há método selecionado, zera o valor dele
  if (selectedPaymentMethod) {
    footerValoresPorMetodo[selectedPaymentMethod] = 0;
  }

  updateFooterCashDisplay();
  updateFooterPaymentCards();
}

/**
 * Atualiza o display do input com formatação
 */
function updateFooterCashDisplay() {
  const input = document.getElementById('footerCashInput');
  if (!input) return;

  // Converte para número
  const numValue = parseFloat(footerCashAmount) || 0;

  // Formata com separadores de milhar e 2 casas decimais
  const formatted = numValue.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Adiciona "Kz" no início
  input.value = `Kz ${formatted}`;

  console.log(`💰 [FOOTER] Display: ${footerCashAmount} → Kz ${formatted}`);
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
  // Botões numéricos e ponto decimal
  const keypadBtns = document.querySelectorAll('.keypad-btn');
  keypadBtns.forEach(btn => {
    btn.addEventListener('click', function() {
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

  // Configura listener do teclado físico
  setupFooterKeyboardListener();

  // Foca no input
  const cashInput = document.getElementById('footerCashInput');
  if (cashInput) {
    cashInput.focus();
  }

  console.log('✅ [FOOTER] Keypad inicializado');
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  loadFooterPaymentMethods();
  initOrderSummarySlider();
  initFooterKeypad();
});

// Expor funções globalmente
window.getSelectedPaymentMethod = getSelectedPaymentMethod;
window.footerKeypadInput = footerKeypadInput;
window.backspaceFooterCash = backspaceFooterCash;
window.clearFooterCash = clearFooterCash;
window.getFooterCashAmount = getFooterCashAmount;
window.updateFooterPaymentCards = updateFooterPaymentCards;
window.selectFooterPaymentMethod = selectFooterPaymentMethod;
window.resetFooterPaymentValues = resetFooterPaymentValues;
window.updatePaymentStatus = updatePaymentStatus;

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

  if (!slider || !obsToggleBtn || !obsBackBtn) {
    console.warn('Order summary slider elements not found');
    return;
  }

  // Toggle to OBS view
  obsToggleBtn.addEventListener('click', function() {
    slider.classList.add('show-obs');
    // Focus on textarea after transition
    setTimeout(() => {
      if (orderObservation) orderObservation.focus();
    }, 350);
  });

  // Back to Order Summary view
  obsBackBtn.addEventListener('click', function() {
    slider.classList.remove('show-obs');
  });

  // Submit observation
  if (obsSubmitBtn) {
    obsSubmitBtn.addEventListener('click', function() {
      const observation = orderObservation ? orderObservation.value.trim() : '';

      // Store observation in global state
      window.orderObservation = observation;

      console.log('📝 Observação salva:', observation);

      // Visual feedback
      obsSubmitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
      obsSubmitBtn.style.background = '#4caf50';

      // Slide back to summary view
      setTimeout(() => {
        slider.classList.remove('show-obs');

        // Reset button after slide animation
        setTimeout(() => {
          obsSubmitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Confirmar';
          obsSubmitBtn.style.background = '';
        }, 400);
      }, 500);
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
function getOrderObservation() {
  return window.orderObservation || '';
}

// Expose functions globally
window.updateOrderSummaryFooter = updateOrderSummaryFooter;
window.getOrderObservation = getOrderObservation;
window.initOrderSummarySlider = initOrderSummarySlider;