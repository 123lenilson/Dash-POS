/* ======= MOCK DE DADOS (preenchido pela API) ======= */
let PRODUCTS = [];

const TAX_RATE = 0.15; // 15%
const DISCOUNT = 0; // Adicione lógica de desconto se necessário; por enquanto 0
const currency = new Intl.NumberFormat('pt-AO', { style:'currency', currency:'AOA', maximumFractionDigits:2 });

/* ======= ESTADO ======= */
let activeCategory = "All Menu";
let searchTerm = "";
let modoEdicao = false;       // mantém do seu fluxo
let estaPesquisando = false;  // mantém do seu fluxo
const cart = new Map();       // id -> {product, qty, customPrice}

/* guarda a key das categorias para evitar rebuild desnecessário */
let lastCategoriesKey = null;

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
const cartTotal    = document.getElementById('cartTotal');
const cartEmptyState = document.getElementById('cartEmptyState');

const cartListOverlay = document.getElementById('cartListOverlay');
const cartItemsCountOverlay = document.getElementById('cartItemsCountOverlay');
const cartSubtotalOverlay = document.getElementById('cartSubtotalOverlay');
const cartDiscountOverlay = document.getElementById('cartDiscountOverlay');
const cartTaxOverlay = document.getElementById('cartTaxOverlay');
const cartTotalOverlay = document.getElementById('cartTotalOverlay');
const cartEmptyStateMobile = document.getElementById('cartEmptyStateMobile');

const clearCartBtn = document.getElementById('clearCart');
const placeOrderBtn = document.getElementById('placeOrder');

const clearCartOverlayBtn = document.getElementById('clearCartOverlay');
const placeOrderOverlayBtn = document.getElementById('placeOrderOverlay');

const mobileCartBtn = document.getElementById('mobileCartBtn');
const mobileCartBadge = document.getElementById('mobileCartBadge');
const cartOverlay = document.getElementById('cartOverlay');
const closeCartOverlayBtn = document.getElementById('closeCartOverlay');

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
function carregarCardapios() {
  fetch("http://localhost/Dash-POS/api/cardapio.php?acao=listar", {
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
    .then(cardapios => {
      atualizarCards(cardapios);
    })
    .catch(error => {
      console.error("Erro no fetch:", error);
      productGrid.innerHTML = `<div style='grid-column:1/-1; text-align:center; color:#8b8fa3; padding:20px;'>Erro ao carregar os dados: ${error.message}</div>`;
    });
}

function atualizarCards(cardapios) {
  if (!Array.isArray(cardapios)) {
    console.error("Erro: API não retornou um array", cardapios);
    productGrid.innerHTML = `<div style='grid-column:1/-1; text-align:center; color:#8b8fa3; padding:20px;'>Erro: Dados inválidos recebidos da API</div>`;
    return;
  }

  // popula PRODUCTS no formato esperado
  PRODUCTS = cardapios.map(item => ({
    id: parseInt(item.cardapio_id) || 0,
    cat: item.categoria_nome || "All Menu",
    name: item.cardapio_nome || "Produto sem nome",
    price: parseFloat(item.cardapio_preco) || 0,
    available: true,
    img: ""
  }));

  // calcula counts e order para decidir se rebuild é necessário
  const counts = {};
  for (const p of PRODUCTS) { const c = p.cat; counts[c] = (counts[c] || 0) + 1; }
  counts["All Menu"] = PRODUCTS.length;
  const order = ["All Menu", ...Object.keys(counts).filter(c => c !== "All Menu").sort()];

  const keyArr = order.map(cat => `${cat}:${counts[cat]}`);
  const key = JSON.stringify(keyArr);

  // se mudou, rebuild; se não mudou, só renderiza produtos (preserva scroll)
  if (key !== lastCategoriesKey) {
    lastCategoriesKey = key;
    buildCategories(order, counts, true); // preserve scroll if possible
  } else {
    // atualiza highlight da categoria sem reconstruir (se existir)
    const track = categoryBar.querySelector('.cat-track');
    if (track) {
      track.querySelectorAll('.category').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.cat === activeCategory);
      });
    }
  }

  // renderiza produtos (sempre)
  renderProducts();
}

/* ======= CATEGORY SLIDER ======= */
function buildCategories(orderIn = null, countsIn = null, preserveScroll = false) {
  const counts = countsIn || (() => {
    const c = {};
    for (const p of PRODUCTS) { c[p.cat] = (c[p.cat] || 0) + 1; }
    c["All Menu"] = PRODUCTS.length;
    return c;
  })();

  const order = orderIn || ["All Menu", ...Object.keys(counts).filter(c => c !== "All Menu").sort()];

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
              <div class="circle">🏷️</div>
              <div class="meta">
                <strong>${cat}</strong>
                <small>${counts[cat] || 0} items</small>
              </div>
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
function renderProducts(){
  const list = PRODUCTS
    .filter(p => p.name !== undefined && p.name !== null)
    .filter(p => activeCategory==="All Menu" ? true : p.cat === activeCategory)
    .filter(p => p.name.toLowerCase().includes(searchTerm));

  if(list.length === 0){
    productGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#8b8fa3; padding:20px;">Nenhum produto encontrado.</div>`;
    return;
  }

  productGrid.innerHTML = list.map(p => {
    const imgSrc = p.img || placeholderIMG(p.name);
    return `
      <article class="card" data-id="${p.id}">
        <div class="thumb"><img alt="${p.name}" src="${imgSrc}"></div>
        <div class="body">
          <div class="title">${p.name}</div>
          <span class="badge ${p.available? '':'na'}">${p.available? 'Available':'Not Available'}</span>
          <div class="price">${currency.format(p.price)}</div>
          <div class="controls" onclick="event.stopPropagation()">
            <button class="qtybtn minus" data-action="minus" aria-label="Diminuir">−</button>
            <button class="qtybtn plus"  data-action="plus"  aria-label="Adicionar">+</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  productGrid.querySelectorAll('.card').forEach(card=>{
    const id = +card.dataset.id;
    if(cart.has(id) && cart.get(id).qty > 0){ card.classList.add('is-selected'); }
    else { card.classList.remove('is-selected'); }
    card.addEventListener('click', ()=> addToCart(id, 1));
    const plusBtn = card.querySelector('.qtybtn.plus');
    const minusBtn = card.querySelector('.qtybtn.minus');
    if(plusBtn){ plusBtn.addEventListener('click', e=>{ e.stopPropagation(); addToCart(id,1); }); }
    if(minusBtn){ minusBtn.addEventListener('click', e=>{ e.stopPropagation(); addToCart(id,-1); }); }
  });
}

/* Atualiza a seleção visual dos cards */
function updateProductSelections(){
  const cards = productGrid.querySelectorAll('.card');
  cards.forEach(card=>{
    const id = +card.dataset.id;
    if(cart.has(id) && cart.get(id).qty > 0){ card.classList.add('is-selected'); }
    else { card.classList.remove('is-selected'); }
  });
}

/* ======= CART ======= */
function renderCart(){
  const items = [...cart.values()];

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

    cartList.innerHTML = items.map(({product, qty, customPrice = product.price})=>{
      const line = customPrice * qty;
      return `
        <li class="cart-item" data-id="${product.id}">
          <div>
            <div class="title" style="cursor: pointer; padding: 2px 0;" onclick="openPriceModal(${product.id})">${product.name}</div>
            <div class="meta">${currency.format(customPrice)} × ${qty} = <strong>${currency.format(line)}</strong></div>
          </div>
          <div class="right">
            <button class="iconbtn" data-act="minus" aria-label="Diminuir">−</button>
            <div style="min-width:24px; text-align:center; font-weight:700">${qty}</div>
            <button class="iconbtn" data-act="plus" aria-label="Adicionar">+</button>
            <button class="iconbtn del" data-act="del" aria-label="Excluir">×</button>
          </div>
        </li>
      `;
    }).join('');

    cartListOverlay.innerHTML = items.map(({product, qty, customPrice = product.price})=>{
      const line = customPrice * qty;
      return `
        <li class="cart-item" data-id="${product.id}">
          <div>
            <div class="title" style="cursor: pointer; padding: 2px 0;" onclick="openPriceModal(${product.id})">${product.name}</div>
            <div class="meta">${currency.format(customPrice)} × ${qty} = <strong>${currency.format(line)}</strong></div>
          </div>
          <div class="right">
            <button class="iconbtn" data-act="minus" aria-label="Diminuir">−</button>
            <div style="min-width:24px; text-align:center; font-weight:700">${qty}</div>
            <button class="iconbtn" data-act="plus" aria-label="Adicionar">+</button>
            <button class="iconbtn del" data-act="del" aria-label="Excluir">×</button>
          </div>
        </li>
      `;
    }).join('');

    cartList.querySelectorAll('.cart-item').forEach(row=>{
      const id = +row.dataset.id;
      row.querySelector('[data-act="minus"]').addEventListener('click', ()=> addToCart(id, -1));
      row.querySelector('[data-act="plus"]').addEventListener('click',  ()=> addToCart(id, +1));
      row.querySelector('[data-act="del"]').addEventListener('click',   ()=> removeFromCart(id));
    });

    cartListOverlay.querySelectorAll('.cart-item').forEach(row=>{
      const id = +row.dataset.id;
      row.querySelector('[data-act="minus"]').addEventListener('click', ()=> addToCart(id, -1));
      row.querySelector('[data-act="plus"]').addEventListener('click',  ()=> addToCart(id, +1));
      row.querySelector('[data-act="del"]').addEventListener('click',   ()=> removeFromCart(id));
    });
  }

  const stats = items.reduce((acc, it)=>{
    acc.items += it.qty;
    acc.subtotal += (it.customPrice || it.product.price) * it.qty;
    return acc;
  }, {items:0, subtotal:0});

  const discount = DISCOUNT;
  const tax = (stats.subtotal - discount) * TAX_RATE;
  const total = stats.subtotal - discount + tax;

  cartItemsCount.textContent = `${stats.items} Items`;
  cartSubtotal.textContent = currency.format(stats.subtotal);
  cartDiscount.textContent = currency.format(discount);
  cartTax.textContent = currency.format(tax);
  cartTotal.textContent = currency.format(total);

  cartItemsCountOverlay.textContent = `${stats.items} Items`;
  cartSubtotalOverlay.textContent = currency.format(stats.subtotal);
  cartDiscountOverlay.textContent = currency.format(discount);
  cartTaxOverlay.textContent = currency.format(tax);
  cartTotalOverlay.textContent = currency.format(total);

  mobileCartBadge.textContent = stats.items;
  mobileCartBadge.style.display = stats.items > 0 ? 'inline-grid' : 'none';

  updateProductSelections();
}

/* ======= ACTIONS ======= */
function addToCart(id, delta){
  const product = PRODUCTS.find(p=>p.id===id);
  if(!product) return;
  const entry = cart.get(id) || {product, qty:0, customPrice: product.price};
  entry.qty += delta;
  if(entry.qty <= 0) cart.delete(id);
  else cart.set(id, entry);
  renderCart();
}
function removeFromCart(id){
  cart.delete(id);
  renderCart();
}

/* ======= SEARCH ======= */
searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  estaPesquisando = searchTerm.length > 0;
  renderProducts();
});
clearSearch.addEventListener('click', ()=>{
  searchInput.value = "";
  searchTerm = "";
  estaPesquisando = false;
  searchInput.focus();
  renderProducts();
});

/* ======= GLOBAL BUTTONS ======= */
document.getElementById('placeOrder')?.addEventListener('click', ()=>{
  if(cart.size===0){ alert('Seu carrinho está vazio.'); return; }
  alert('Pedido realizado! (demonstração)');
  cart.clear(); renderCart();
});
document.getElementById('placeOrderOverlay')?.addEventListener('click', ()=>{
  if(cart.size===0){ alert('Seu carrinho está vazio.'); return; }
  alert('Pedido realizado! (demonstração)');
  cart.clear(); renderCart();
});
clearCartBtn?.addEventListener('click', ()=>{ cart.clear(); renderCart(); });
clearCartOverlayBtn?.addEventListener('click', ()=>{ cart.clear(); renderCart(); });

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
function init(){
  carregarCardapios();
  renderCart();
  updateDateTime();
  setInterval(updateDateTime, 30000);
  if(+mobileCartBadge.textContent === 0) mobileCartBadge.style.display = 'none';
  updateResponsiveUI();
  window.addEventListener('resize', updateResponsiveUI);

  setInterval(() => {
    if (!modoEdicao && !estaPesquisando) {
      carregarCardapios();
    }
  }, 500);
}
init();

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

// Função para abrir a modal de ajuste de preço
async function openPriceModal(productId) {
  const entry = cart.get(productId);
  if (!entry) return;

  const currentPrice = entry.customPrice || entry.product.price;
  const newPrice = await showPriceModal({
    initial: currentPrice,
    currency: 'Kz',
    decimals: 2
  });

  if (newPrice !== null && newPrice !== currentPrice) {
    entry.customPrice = newPrice;
    renderCart(); // Re-renderiza o carrinho para atualizar preços
  }
}