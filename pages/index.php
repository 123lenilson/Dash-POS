<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>POS Dashboard — l</title>
  <link rel="stylesheet" href="../assets/css/styles.css" />
  <!-- Font Awesome Free (CDN) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-p1CmVx4g...PLACEHOLDER..." crossorigin="anonymous" referrerpolicy="no-referrer" />
</head>
<body>
  <!-- INTERFACE (pai) — contém EXATAMENTE DUAS FILHAS: main (70%) e side (30%) -->
  <div class="interface">
    <!-- COLUNA 70% (MAIN / PRODUTOS) - Primeiro (à esquerda) -->
    <main class="main col-70 products-col">
      <!-- HEADER DENTRO DO MAIN (sticky) -->
      <div class="main-header">
        <div class="main-header-left">
          <!-- brand, etc -->
          <!-- COLE ESTE BOTÃO AO LADO DO BRAND / ANTES DA .main-nav -->
          <button id="mobileMenuBtn" class="mobile-menu-btn" aria-label="Abrir menu" aria-expanded="false" title="Abrir menu">
            <i class="fa-solid fa-bars" aria-hidden="true"></i>
          </button>
          <nav class="main-nav" aria-label="Menu principal do dashboard">
            <button class="nav-link is-active" data-nav="home">Home</button>
            <button class="nav-link" data-nav="orders">Order List</button>
            <button class="nav-link" data-nav="history">History</button>
            <button class="nav-link" data-nav="report">Report</button>
            <button class="nav-link" data-nav="setting">Setting</button>
          </nav>
        </div>
        <div class="main-header-right">
          <div class="date-time" id="dateTime"></div>
          <div class="user">
            <div class="avatar">AN</div>
            <div class="user-info">
              <strong>Anisa Nur H.</strong>
              <span>Cashier Staff</span>
            </div>
          </div>
        </div>
      </div>
      <!-- FIM HEADER DO MAIN -->
      <div class="sticky-section">
        <!-- SEARCH -->
        <div class="search-row">
          <div class="search">
            <span class="search-icon">🔎</span>
            <input id="searchInput" type="text" placeholder="Search menu here..." />
            <button id="clearSearch" class="clear-btn" aria-label="Limpar busca">×</button>
          </div>
        </div>
        <!-- CATEGORIAS -->
        <div id="categoryBar" class="category-bar"></div>
      </div>
      <!-- GRID DE PRODUTOS -->
      <div id="productGrid" class="product-grid" aria-live="polite"></div>
    </main>
    <!-- COLUNA 30% (SIDE / CARRINHO) - Segundo (à direita) -->
    <aside class="side col-30" id="desktopCartCol" aria-hidden="false">
      <div class="side-inner">
        <div class="cart-header">
          <div class="cart-title">
            <strong>Cart</strong>
            <button id="clearCart" class="btn light" aria-label="Limpar carrinho"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        
        <!-- ÁREA EXPANDIDA PARA PRODUTOS DO CARRINHO -->
        <div class="cart-products-area">
          <!-- Placeholder quando carrinho vazio -->
          <div id="cartEmptyState" class="cart-empty-state">
            <div class="empty-icon">
              <i class="fa-solid fa-cart-shopping"></i>
            </div>
            <h3>Seu carrinho está vazio</h3>
            <p>Adicione produtos do menu para começar seu pedido</p>
            <div class="empty-decoration">
              <div class="decoration-circle"></div>
              <div class="decoration-circle"></div>
              <div class="decoration-circle"></div>
            </div>
          </div>
          
          <!-- Lista de produtos (visível quando há itens) -->
          <ul id="cartList" class="cart-list-new" aria-live="polite"></ul>
        </div>

        <!-- RODAPÉ FIXO DO CARRINHO: resumo compacto + ações -->
        <div class="cart-footer-fixed">
          <div class="cart-summary-compact">
            <div class="summary-row">
              <span>Item</span>
              <strong id="cartItemsCount">0 Items</strong>
            </div>
            <div class="summary-row">
              <span>Sub Total</span>
              <strong id="cartSubtotal">Kz 0,00</strong>
            </div>
            <div class="summary-row">
              <span>Discount</span>
              <strong id="cartDiscount">Kz 0,00</strong>
            </div>
            <div class="summary-row">
              <span>Tax</span>
              <strong id="cartTax">Kz 0,00</strong>
            </div>
            <div class="summary-row total-row">
              <span>Total</span>
              <strong id="cartTotal">Kz 0,00</strong>
            </div>
          </div>
          
          <div class="payment-compact">
            <div class="payment-methods">
              <button class="payment-btn is-active" data-method="cash">Cash</button>
              <button class="payment-btn" data-method="debit">Debit</button>
              <button class="payment-btn" data-method="qris">QRIS</button>
            </div>
          </div>
          
          <button id="placeOrder" class="btn-process-transaction">
            Process Transactions
          </button>
        </div>
      </div>
    </aside>
  </div>
  
  <!-- BOTÃO FLUTUANTE (mobile) para abrir carrinho -->
  <button id="mobileCartBtn" class="mobile-cart-btn" aria-label="Abrir carrinho" title="Carrinho">
    <span class="cart-ico">🛒</span>
    <span id="mobileCartBadge" class="cart-badge" aria-hidden="true">0</span>
  </button>
  
  <!-- DRAWER / OVERLAY DO CARRINHO (mobile) -->
  <div id="cartOverlay" class="cart-overlay" aria-hidden="true">
    <div class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
      <div class="cart-drawer-header">
        <h3 id="drawerTitle">Seu Carrinho</h3>
        <button id="closeCartOverlay" class="iconbtn" aria-label="Fechar">×</button>
      </div>
      <!-- corpo scrollável -->
      <div class="cart-drawer-body">
        <!-- Placeholder mobile quando carrinho vazio -->
        <div id="cartEmptyStateMobile" class="cart-empty-state">
          <div class="empty-icon">
            <i class="fa-solid fa-cart-shopping"></i>
          </div>
          <h3>Seu carrinho está vazio</h3>
          <p>Adicione produtos do menu para começar seu pedido</p>
          <div class="empty-decoration">
            <div class="decoration-circle"></div>
            <div class="decoration-circle"></div>
            <div class="decoration-circle"></div>
          </div>
        </div>
        
        <!-- Lista produtos mobile -->
        <ul id="cartListOverlay" class="cart-list-new"></ul>
      </div>
      
      <!-- footer fixo do drawer (resumo + ação) -->
      <div class="cart-drawer-footer">
        <div class="cart-summary-compact">
          <div class="summary-row">
            <span>Item</span>
            <strong id="cartItemsCountOverlay">0 Items</strong>
          </div>
          <div class="summary-row">
            <span>Sub Total</span>
            <strong id="cartSubtotalOverlay">Kz 0,00</strong>
          </div>
          <div class="summary-row">
            <span>Discount</span>
            <strong id="cartDiscountOverlay">Kz 0,00</strong>
          </div>
          <div class="summary-row">
            <span>Tax</span>
            <strong id="cartTaxOverlay">Kz 0,00</strong>
          </div>
          <div class="summary-row total-row">
            <span>Total</span>
            <strong id="cartTotalOverlay">Kz 0,00</strong>
          </div>
        </div>
        
        <div class="payment-compact">
          <div class="payment-methods">
            <button class="payment-btn is-active" data-method="cash">Cash</button>
            <button class="payment-btn" data-method="debit">Debit</button>
            <button class="payment-btn" data-method="qris">QRIS</button>
          </div>
        </div>
        
        <button id="placeOrderOverlay" class="btn-process-transaction">Process Transactions</button>
      </div>
    </div>
  </div>
  <script src="../assets/js/app.js"></script>
</body>
</html>