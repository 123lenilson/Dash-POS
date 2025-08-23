/* ======= MOCK DE DADOS ======= */
const PRODUCTS = [
  {id:1,  cat:"All Menu", name:"Elegant Pan Seared Chicken Plate", price:5200, available:true,  img:""},
  {id:2,  cat:"Appetizer", name:"Bruschetta Classic", price:1900, available:true, img:""},
  {id:3,  cat:"Seafood", name:"Elegant Salmon Sashimi Presentation", price:8000, available:true, img:""},
  {id:4,  cat:"Chicken", name:"Chicken Pop Matah", price:3500, available:true, img:""},
  {id:5,  cat:"Steak", name:"Sirloin Steak 250g", price:11000, available:true, img:""},
  {id:6,  cat:"Salad", name:"Caesar Salad Bowl", price:3700, available:true, img:""},
  {id:7,  cat:"Spicy Food", name:"Artistic Overhead Pasta", price:4200, available:false, img:""},
  {id:8,  cat:"Dessert", name:"Bolognese Spaghetti", price:2400, available:true, img:""},
  {id:9,  cat:"Beverages", name:"Cinnaple Coffee", price:2120, available:true, img:""},
  {id:10, cat:"Cocktail", name:"Mango Sunrise", price:4500, available:true, img:""},
  {id:11, cat:"Seafood", name:"Gourmet Grilled Vegee Fish Dish", price:4000, available:true, img:""},
  {id:12, cat:"Pasta", name:"Elegantly Plated Fettuccine Pasta", price:3800, available:true, img:""},
  {id:13, cat:"Salad", name:"Greek Salad (Veg)", price:3300, available:true, img:""},
  {id:14, cat:"Chicken", name:"Honey Garlic Chicken", price:4200, available:true, img:""},
  {id:15, cat:"Beverages", name:"Iced Lemon Tea", price:1500, available:true, img:""},
  {id:16, cat:"Dessert", name:"Chocolate Lava Cake", price:3100, available:true, img:""},
  {id:17, cat:"Appetizer", name:"Fried Calamari", price:2700, available:true, img:""},
  {id:18, cat:"Spicy Food", name:"Volcano Ramen", price:3900, available:true, img:""},
  {id:19, cat:"Cocktail", name:"Berry Mojito", price:4700, available:true, img:""},
  {id:20, cat:"Pasta", name:"Penne Alfredo", price:3600, available:true, img:""}
];

const TAX_RATE = 0.15; // 15%
const currency = new Intl.NumberFormat('pt-AO', { style:'currency', currency:'AOA', maximumFractionDigits:2 });

/* ======= ESTADO ======= */
let activeCategory = "All Menu";
let searchTerm = "";
const cart = new Map(); // id -> {product, qty}

/* ======= DOM ======= */
const dateTimeEl   = document.getElementById('dateTime');
const categoryBar  = document.getElementById('categoryBar');
const productGrid  = document.getElementById('productGrid');
const searchInput  = document.getElementById('searchInput');
const clearSearch  = document.getElementById('clearSearch');

const cartList     = document.getElementById('cartList');
const cartItemsCount = document.getElementById('cartItemsCount');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartTax      = document.getElementById('cartTax');
const cartTotal    = document.getElementById('cartTotal');

const cartListOverlay = document.getElementById('cartListOverlay');
const cartItemsCountOverlay = document.getElementById('cartItemsCountOverlay');
const cartSubtotalOverlay = document.getElementById('cartSubtotalOverlay');
const cartTaxOverlay = document.getElementById('cartTaxOverlay');
const cartTotalOverlay = document.getElementById('cartTotalOverlay');

const taxRateLabel = document.getElementById('taxRateLabel');
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

/* ======= RENDER ======= */
function buildCategories(){
  const counts = {};
  for(const p of PRODUCTS){ const c = p.cat; counts[c] = (counts[c]||0)+1; }
  counts["All Menu"] = PRODUCTS.length;

  const order = ["All Menu", ...Object.keys(counts).filter(c=>c!=="All Menu").sort()];
  categoryBar.innerHTML = order.map(cat => `
    <button class="category ${cat===activeCategory?'is-active':''}" data-cat="${cat}">
      <div class="circle">🏷️</div>
      <div class="meta">
        <strong>${cat}</strong>
        <small>${counts[cat]} items</small>
      </div>
    </button>
  `).join('');

  categoryBar.querySelectorAll('.category').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeCategory = btn.dataset.cat;
      buildCategories();
      renderProducts();
    });
  });
}

function renderProducts(){
  const list = PRODUCTS
    .filter(p => activeCategory==="All Menu" ? true : p.cat === activeCategory)
    .filter(p => p.name.toLowerCase().includes(searchTerm));

  if(list.length === 0){
    productGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#8b8fa3; padding:20px;">Nenhum produto encontrado.</div>`;
    return;
  }

  productGrid.innerHTML = list.map(p => `
    <article class="card" data-id="${p.id}">
      <div class="thumb"><img alt="${p.name}" src="${p.img || placeholderIMG(p.name)}"></div>
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
  `).join('');

  productGrid.querySelectorAll('.card').forEach(card=>{
    const id = +card.dataset.id;
    card.addEventListener('click', ()=> addToCart(id, 1));
    card.querySelector('.qtybtn.plus').addEventListener('click', e=>{ e.stopPropagation(); addToCart(id,1); });
    card.querySelector('.qtybtn.minus').addEventListener('click', e=>{ e.stopPropagation(); addToCart(id,-1); });
  });
}

function renderCart(){
  const items = [...cart.values()];

  cartList.innerHTML = items.map(({product, qty})=>{
    const line = product.price * qty;
    return `
      <li class="cart-item" data-id="${product.id}">
        <div>
          <div class="title">${product.name}</div>
          <div class="meta">${currency.format(product.price)} × ${qty} = <strong>${currency.format(line)}</strong></div>
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

  cartListOverlay.innerHTML = items.map(({product, qty})=>{
    const line = product.price * qty;
    return `
      <li class="cart-item" data-id="${product.id}">
        <div>
          <div class="title">${product.name}</div>
          <div class="meta">${currency.format(product.price)} × ${qty} = <strong>${currency.format(line)}</strong></div>
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

  const stats = items.reduce((acc, it)=>{
    acc.items += it.qty;
    acc.subtotal += it.product.price * it.qty;
    return acc;
  }, {items:0, subtotal:0});

  const tax = stats.subtotal * TAX_RATE;
  const total = stats.subtotal + tax;

  cartItemsCount.textContent = stats.items;
  cartSubtotal.textContent = currency.format(stats.subtotal);
  cartTax.textContent = currency.format(tax);
  cartTotal.textContent = currency.format(total);
  taxRateLabel.textContent = `${(TAX_RATE*100).toFixed(0)}%`;

  cartItemsCountOverlay.textContent = stats.items;
  cartSubtotalOverlay.textContent = currency.format(stats.subtotal);
  cartTaxOverlay.textContent = currency.format(tax);
  cartTotalOverlay.textContent = currency.format(total);
  document.getElementById('taxRateLabelOverlay').textContent = `${(TAX_RATE*100).toFixed(0)}%`;

  mobileCartBadge.textContent = stats.items;
  mobileCartBadge.style.display = stats.items > 0 ? 'inline-grid' : 'none';
}

/* ======= ACTIONS ======= */
function addToCart(id, delta){
  const product = PRODUCTS.find(p=>p.id===id);
  if(!product) return;
  const entry = cart.get(id) || {product, qty:0};
  entry.qty += delta;
  if(entry.qty <= 0) cart.delete(id);
  else cart.set(id, entry);
  renderCart();
}
function removeFromCart(id){
  cart.delete(id);
  renderCart();
}

/* SEARCH */
searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  renderProducts();
});
clearSearch.addEventListener('click', ()=>{
  searchInput.value = "";
  searchTerm = "";
  searchInput.focus();
  renderProducts();
});

/* GLOBAL BUTTONS */
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

/* MOBILE DRAWER */
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

/* MAIN MENU (isolar .main nav) */
document.querySelectorAll('.main .main-nav .nav-link').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.main .main-nav .nav-link').forEach(x=>x.classList.remove('is-active'));
    btn.classList.add('is-active');
  });
});

/* DATETIME & INIT */
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
}

function init(){
  buildCategories();
  renderProducts();
  renderCart();
  updateDateTime();
  setInterval(updateDateTime, 30000);
  if(+mobileCartBadge.textContent === 0) mobileCartBadge.style.display = 'none';
  updateResponsiveUI();
  window.addEventListener('resize', updateResponsiveUI);
}
init();

/* ===== Menu responsivo: toggle hamburger, fechar ao clicar fora, limpar no resize ===== */
(function setupResponsiveMenu(){
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mainHeader = document.querySelector('.main-header');
  const mainNav = document.querySelector('.main .main-nav');

  if(!mobileBtn || !mainHeader || !mainNav) return;

  function setOpenState(open){
    if(open){
      mainHeader.classList.add('nav-open');
      mobileBtn.setAttribute('aria-expanded','true');
      mainNav.style.display = 'flex'; // Força a exibição do menu
      document.body.style.overflow = 'hidden'; // Bloqueia scroll do body
    } else {
      mainHeader.classList.remove('nav-open');
      mobileBtn.setAttribute('aria-expanded','false');
      mainNav.style.display = ''; // Restaura o estado padrão (none em mobile)
      document.body.style.overflow = ''; // Restaura scroll
    }
  }

  mobileBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const isOpen = mainHeader.classList.contains('nav-open');
    setOpenState(!isOpen);
  });

  // fechar o menu ao clicar nalguma nav-link (útil em mobile)
  document.querySelectorAll('.main .main-nav .nav-link').forEach(link=>{
    link.addEventListener('click', ()=>{
      if(window.matchMedia && window.matchMedia('(max-width:890px)').matches){
        setOpenState(false);
      }
    });
  });

  // fechar ao clicar fora (document)
  document.addEventListener('click', (e)=>{
    if(!mainHeader.classList.contains('nav-open')) return;
    // se o clique não estiver dentro do header ou no botão, fecha
    if(!mainHeader.contains(e.target) && e.target !== mobileBtn){
      setOpenState(false);
    }
  });

  // fechar ao redimensionar para desktop
  window.addEventListener('resize', ()=>{
    if(!(window.matchMedia && window.matchMedia('(max-width:890px)').matches)){
      setOpenState(false);
    }
  });
})();