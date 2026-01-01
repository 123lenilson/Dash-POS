<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>L&P - POS Dashboard</title>
  <link rel="stylesheet" href="../assets/css/styles.css" />
  <link rel="stylesheet" href="../assets/css/modal_checkout.css" />
  <link rel="stylesheet" href="../assets/css/fatura.css" />
  <!-- Font Awesome Free (CDN) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

</head>
<body>
  <!-- INTERFACE (pai) — contém EXATAMENTE DUAS FILHAS: main (70%) e side (30%) -->
  <div class="interface">
    <!-- COLUNA 60% (MAIN / PRODUTOS) - Primeiro (à esquerda) -->
    <main class="main col-60 products-col">
      <!-- HEADER DENTRO DO MAIN (sticky) -->
      <div class="main-header">
        <div class="main-header-left">
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
      <div class="sticky-section-home" id="id_stickySection">
        <!-- SEARCH BAR + BOTÃO CLIENTE -->
        <div class="search-bar-container">
          <!-- SEARCH WRAPPER (80%) -->
          <div class="search-wrapper">
            <i class="fa-solid fa-search search-icon-left"></i>
            <input id="searchInput" type="text" placeholder="Procurar por produtos ou serviços" />

            <!-- Toggle DENTRO do input, à direita -->
            <label class="barcode-toggle barcode-toggle-inline">
              <input type="checkbox" id="barcodeToggle">
              <span class="toggle-switch"></span>
              <span class="toggle-label-short">Código de Barras</span>
            </label>

            <button id="clearSearch" class="clear-btn" aria-label="Limpar busca">×</button>
          </div>

          <!-- BOTÃO CLIENTE (20%) -->
          <button class="cliente-btn" onclick="openPanel('clientePanel')">
            <i class="fa-solid fa-user"></i>
            <div class="cliente-text">
              <span class="cliente-label">Cliente</span>
              <span class="cliente-name" id="topSelectedClient">Consumidor Final</span>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <!-- ============================================ -->
        <!-- LEITOR DE CÓDIGO DE BARRAS -->
        <!-- ============================================ -->
        
        <!-- ============================================ -->
        <!-- CATEGORIAS -->
        <div id="categoryBar" class="category-bar"></div>
      </div>

      <!-- CONTAINER WRAPPER: CARDS + PAINEL CLIENTE -->
      <div class="products-container-wrapper">
        <!-- GRID DE PRODUTOS -->
        <div id="productGrid" class="product-grid" aria-live="polite"></div>

        <!-- PAINEL CLIENTE (SLIDER) -->
        <div id="clientePanelSlider" class="client-panel-slider">
          <div class="panel-header-slider">
            <h3><i class="fa-solid fa-user"></i> Cliente</h3>
            <button class="panel-close-slider" onclick="closeClientPanel()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="panel-body-slider">

            <!-- SEÇÃO 1: CLIENTE SELECIONADO -->
            <div class="client-section">
              <h4 class="section-title">CLIENTE SELECIONADO</h4>
              <div class="client-card active" id="selectedClientCard">
                <div class="client-card-content">
                  <div class="client-card-name">Consumidor Final</div>
                  <div class="client-card-details">
                    <span>Endereço: N/A</span> | <span>Telefone: N/A</span> | <span>NIF: N/A</span>
                  </div>
                </div>
                <div class="client-card-indicator">
                  <i class="fa-solid fa-circle-check"></i>
                </div>
              </div>
            </div>

            <!-- SEÇÃO 2: CAMPO DE BUSCA / NOME (Dinâmico) -->
            <div class="client-section">
              <h4 class="section-title" id="clientSearchTitle">PROCURA POR CLIENTES AQUI</h4>
              <div class="client-search-wrapper">
                <input
                  type="text"
                  id="clientSearchInput"
                  class="client-search-input"
                  placeholder="Nome ou NIF"
                  autocomplete="off"
                />
              </div>
            </div>

            <!-- SEÇÃO 3: LISTA DE CLIENTES CADASTRADOS (Estado 1) -->
            <div class="client-section" id="clientListSection">
              <h4 class="section-title">LISTA DE CLIENTES CADASTRADOS</h4>
              <div class="client-list-results" id="clientListPanel">
                <!-- Clientes serão carregados aqui via JS -->
              </div>
            </div>

            <!-- SEÇÃO 4: FORMULÁRIO DE CADASTRO (Estado 2 - Inicialmente oculto) -->
            <div class="client-section" id="clientFormSection" style="display: none;">
              <!-- Formulário de Cadastro (sem campo de nome, pois usa o de busca) -->
              <form id="newClientForm" class="client-form">
                <input
                  type="text"
                  id="newClientNif"
                  class="client-form-input"
                  placeholder="Informe o NIF"
                />

                <input
                  type="tel"
                  id="newClientPhone"
                  class="client-form-input"
                  placeholder="Informe o telefone"
                />

                <input
                  type="email"
                  id="newClientEmail"
                  class="client-form-input"
                  placeholder="Informe um Email válido"
                />

                <input
                  type="text"
                  id="newClientAddress"
                  class="client-form-input"
                  placeholder="Informe o Endereço"
                />

                <button type="submit" class="client-form-submit">
                  Salvar Cliente como novo
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </main>

        <!-- ============================================ -->
    <!-- COLUNA 40% (CHECKOUT INTEGRADO) - Direita -->
    <!-- ============================================ -->
    <aside class="checkout-panel col-40" id="checkoutPanel">

      <!-- ===== CABEÇALHO DO CARRINHO ===== -->
      <div class="cart-header">
        <!-- Botão Tipo de Documento (esquerda) e Botão Limpar (direita) -->
        <div class="cart-header-title">
          <button class="cliente-btn" onclick="openPanel('documentoPanel')">
            <i class="fa-solid fa-file-invoice"></i>
            <div class="cliente-text">
              <span class="cliente-label">Tipo de Documento</span>
              <span class="cliente-name">
                <span id="selectedDocType">Fatura-Recibo</span>
                <i class="fa-solid fa-arrow-right doc-arrow"></i>
                <span id="selectedDocFormat">Formato A4</span>
              </span>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
          </button>
          <button class="btn-clear-cart" onclick="clearCart()" title="Limpar carrinho">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      <!-- ===== CORPO DO CARRINHO ===== -->
      <div class="cart-body">
        <!-- Wrapper para painel de documento + produtos -->
        <div class="cart-body-wrapper" id="cartBodyWrapper">

          <!-- Painel de Seleção de Tipo de Fatura (Slider da esquerda) -->
          <div class="doc-type-panel-slider" id="docTypePanelSlider">
            <div class="invoice-type-options-panel">

              <!-- Opção 1: Fatura-Recibo (padrão, com sub-toggle de formato) -->
              <div class="invoice-option-group">
                <label class="invoice-toggle-option active" data-invoice-type="fatura-recibo">
                  <span class="toggle-label">Fatura-Recibo</span>
                  <div class="toggle-switch-container">
                    <input type="radio" name="invoiceTypePanel" value="fatura-recibo" checked>
                    <span class="toggle-switch-visual"></span>
                  </div>
                </label>
                <!-- Sub-toggle para formato (visível apenas quando Fatura-Recibo está ativo) -->
                <div class="format-sub-options" id="formatSubOptions">
                  <label class="format-toggle-option active" data-format="A4">
                    <span class="format-label">A4</span>
                    <div class="format-switch-container">
                      <input type="radio" name="invoiceFormatPanel" value="A4" checked>
                      <span class="format-switch-visual"></span>
                    </div>
                  </label>
                  <label class="format-toggle-option" data-format="80mm">
                    <span class="format-label">80mm</span>
                    <div class="format-switch-container">
                      <input type="radio" name="invoiceFormatPanel" value="80mm">
                      <span class="format-switch-visual"></span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Opção 2: Fatura Proforma -->
              <div class="invoice-option-group">
                <label class="invoice-toggle-option" data-invoice-type="fatura-proforma">
                  <span class="toggle-label">Fatura Proforma</span>
                  <div class="toggle-switch-container">
                    <input type="radio" name="invoiceTypePanel" value="fatura-proforma">
                    <span class="toggle-switch-visual"></span>
                  </div>
                </label>
              </div>

              <!-- Opção 3: Fatura -->
              <div class="invoice-option-group">
                <label class="invoice-toggle-option" data-invoice-type="fatura">
                  <span class="toggle-label">Fatura</span>
                  <div class="toggle-switch-container">
                    <input type="radio" name="invoiceTypePanel" value="fatura">
                    <span class="toggle-switch-visual"></span>
                  </div>
                </label>
              </div>

              <!-- Opção 4: Orçamento -->
              <div class="invoice-option-group">
                <label class="invoice-toggle-option" data-invoice-type="orcamento">
                  <span class="toggle-label">Orçamento</span>
                  <div class="toggle-switch-container">
                    <input type="radio" name="invoiceTypePanel" value="orcamento">
                    <span class="toggle-switch-visual"></span>
                  </div>
                </label>
              </div>

            </div>
          </div>

          <!-- Área de conteúdo do carrinho (produtos/vazio) -->
          <div class="cart-content-area" id="cartContentArea">
            <!-- Estado vazio do carrinho -->
            <div class="cart-empty-state" id="cartEmptyState">
              <div class="empty-icon">
                <i class="fa-solid fa-cart-shopping"></i>
              </div>
              <h3 class="empty-title">Carrinho vazio</h3>
              <p class="empty-message">Nenhum item selecionado</p>
            </div>

            <!-- Container de produtos do carrinho -->
            <div class="cart-products-container" id="cartProductsContainer" style="display: none;">
              <!-- Os cards de produtos serão inseridos aqui via JavaScript -->
            </div>
          </div>

        </div>
      </div>

      <!-- ===== RODAPÉ DO CARRINHO ===== -->
      <div class="cart-footer">

        <!-- Métodos de Pagamento -->
        <div class="payment-methods-section">
          <div class="payment-methods-wrapper" id="paymentMethodsWrapper">
            <button class="pm-arrow pm-arrow-prev" id="pmArrowPrev" aria-label="Anterior" type="button">‹</button>
            <div class="payment-methods-track" id="paymentMethodsTrack">
              <!-- Cards renderizados via JavaScript -->
            </div>
            <button class="pm-arrow pm-arrow-next" id="pmArrowNext" aria-label="Próximo" type="button">›</button>
          </div>
        </div>

        <!-- Input de Valor Recebido + Status de Pagamento (paralelos) -->
        <div class="footer-amount-row">
          <!-- Elemento de Status (Troco / Falta / Completo) -->
          <div class="payment-status-element" id="paymentStatusElement">
            <svg class="status-icon" id="statusIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div class="status-text">
              <span class="status-label" id="statusLabel">Troco</span>
              <span class="status-value" id="statusValue">Kz 0,00</span>
            </div>
          </div>
          <!-- Wrapper do Input -->
          <div class="footer-amount-wrapper">
            <input
              type="text"
              id="footerCashInput"
              inputmode="numeric"
              placeholder="Kz 0"
              class="footer-amount-input"
              value="Kz 0"
            />
          </div>
        </div>

        <!-- Terceira Div: Área de Ações -->
        <div class="footer-actions-row">
          <div class="footer-actions-left">
            <!-- Order Summary Component with Slider -->
            <div class="order-summary-wrapper">
              <!-- Slide Container (holds both views) -->
              <div class="order-summary-slider" id="orderSummarySlider">

                <!-- View 1: Order Summary (Default) -->
                <div class="order-summary-view" id="orderSummaryView">
                  <div class="order-summary-header">
                    <span class="order-summary-title">Ordem de Venda</span>
                    <button class="obs-toggle-btn" id="obsToggleBtn" type="button">
                      OBS <i class="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                  <div class="order-summary-content">
                    <!-- Card: Total Ilíquido -->
                    <div class="order-card">
                      <div class="order-card-info">
                        <span class="order-card-label">Total ilíquido:</span>
                        <span class="order-card-value" id="summaryNetTotal">Kz 0,00</span>
                      </div>
                      <div class="order-card-icon">
                        <i class="fa-solid fa-receipt"></i>
                      </div>
                    </div>

                    <!-- Card: Total Impostos -->
                    <div class="order-card">
                      <div class="order-card-info">
                        <span class="order-card-label">Total impostos:</span>
                        <span class="order-card-value" id="summaryTaxTotal">Kz 0,00</span>
                      </div>
                      <div class="order-card-icon">
                        <i class="fa-solid fa-percent"></i>
                      </div>
                    </div>

                    <!-- Card: Retenção -->
                    <div class="order-card">
                      <div class="order-card-info">
                        <span class="order-card-label">Retenção:</span>
                        <span class="order-card-value" id="summaryRetention">Kz 0,00</span>
                      </div>
                      <div class="order-card-icon">
                        <i class="fa-solid fa-hand-holding-dollar"></i>
                      </div>
                    </div>

                    <!-- Card: Total a pagar -->
                    <div class="order-card">
                      <div class="order-card-info">
                        <span class="order-card-label">Total apagar:</span>
                        <span class="order-card-value" id="summaryTotalPagar">Kz 0,00</span>
                      </div>
                      <div class="order-card-icon">
                        <i class="fa-solid fa-money-bills"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- View 2: Observation (Hidden by default) -->
                <div class="order-obs-view" id="orderObsView">
                  <div class="order-obs-header">
                    <span class="order-obs-title">Observação</span>
                    <button class="obs-back-btn" id="obsBackBtn" type="button">
                      <i class="fa-solid fa-arrow-left"></i> Voltar
                    </button>
                  </div>
                  <div class="order-obs-content">
                    <textarea
                      class="obs-textarea"
                      id="orderObservation"
                      placeholder="Adicione uma observação ao pedido..."
                      rows="4"
                    ></textarea>
                    <button class="obs-submit-btn" id="obsSubmitBtn" type="button">
                      <i class="fa-solid fa-check"></i> Confirmar
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
          <div class="footer-actions-right">
            <!-- Keypad numérico -->
            <div class="footer-keypad">
              <div class="keypad-grid">
                <button class="keypad-btn" data-value="1">1</button>
                <button class="keypad-btn" data-value="2">2</button>
                <button class="keypad-btn" data-value="3">3</button>
                <button class="keypad-btn" data-value="4">4</button>
                <button class="keypad-btn" data-value="5">5</button>
                <button class="keypad-btn" data-value="6">6</button>
                <button class="keypad-btn" data-value="7">7</button>
                <button class="keypad-btn" data-value="8">8</button>
                <button class="keypad-btn" data-value="9">9</button>
                <button class="keypad-btn" data-value=".">.</button>
                <button class="keypad-btn" data-value="0">0</button>
                <div class="keypad-split-cell">
                  <button class="keypad-btn keypad-clear" data-value="C">C</button>
                  <button class="keypad-btn keypad-backspace" data-value="back">⌫</button>
                </div>
              </div>
              <button class="keypad-pay-btn">Pay</button>
            </div>
          </div>
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
        <!-- ✅ SELETOR DE TIPO DE FATURA (MOBILE) -->
        <div class="invoice-type-selector">
          <div class="invoice-type-header">
            <i class="fa-solid fa-file-invoice" aria-hidden="true"></i>
            <span>Tipo de Documento</span>
          </div>
          <div class="invoice-type-options">
            <label class="invoice-radio-option">
              <input type="radio" name="invoiceType" value="fatura-recibo" checked>
              <span class="radio-custom"></span>
              <span class="radio-label">Factura Recibo</span>
            </label>
            <!-- Invoice Format Selection (nested under fatura-recibo) -->
            <div id="invoiceFormatSelectionMobile" class="invoice-format-selection hidden ml-6 mt-2 mb-3">
              <div class="format-options bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div class="format-option mb-2">
                  <label class="flex items-center cursor-pointer">
                    <input type="radio" name="invoiceFormat" value="A4" class="h-4 w-4 text-blue-600">
                    <span class="ml-2 text-sm font-medium text-gray-700">Fatura A4</span>
                  </label>
                </div>
                <div class="format-option">
                  <label class="flex items-center cursor-pointer">
                    <input type="radio" name="invoiceFormat" value="80mm" class="h-4 w-4 text-blue-600">
                    <span class="ml-2 text-sm font-medium text-gray-700">Fatura 80mm</span>
                  </label>
                </div>
              </div>
            </div>
            <label class="invoice-radio-option">
              <input type="radio" name="invoiceType" value="fatura-proforma">
              <span class="radio-custom"></span>
              <span class="radio-label">Factura Proforma</span>
            </label>
            <label class="invoice-radio-option">
              <input type="radio" name="invoiceType" value="fatura">
              <span class="radio-custom"></span>
              <span class="radio-label">Factura</span>
            </label>
            <label class="invoice-radio-option">
              <input type="radio" name="invoiceType" value="orcamento">
              <span class="radio-custom"></span>
              <span class="radio-label">Orçamento</span>
            </label>
          </div>
        </div>
      
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
            <span>Itens</span>
            <strong id="cartItemsCountOverlay">0</strong>
          </div>
          <div class="summary-row">
            <span>Total Íliquido</span>
            <strong id="cartSubtotalOverlay">Kz 0,00</strong>
          </div>
          <div class="summary-row">
            <span>Retenção</span>
            <strong id="cartDiscountOverlay">Kz 0,00</strong>
          </div>
          <div class="summary-row">
            <span>Total de Impostos</span>
            <strong id="cartTaxOverlay">Kz 0,00</strong>
          </div>
        </div>
        
        <button id="placeOrderOverlay" class="btn-checkout" data-action="pay">
          <span id="cartTotalBtnOverlay">Kz 0,00</span>
          <span class="btn-label">Continuar <i class="fa-solid fa-arrow-right"></i></span>
        </button>
      </div>
    </div>
  </div>

  <!-- Price Adjustment Modal (genérica para preço/quantidade) -->
  <div id="pm-overlay" class="pm-overlay" aria-hidden="true">
    <div id="pm-dialog" class="pm-dialog" role="dialog" aria-modal="true" aria-labelledby="pm-title">
      <header class="pm-header">
        <h3 id="pm-title">Ajustar Preço</h3>
      </header>

      <div class="pm-display" aria-live="polite">
        <label id="pm-label">Preço:</label>  <!-- ← Novo: Label dinâmico para preço/quantidade -->
        <span class="pm-amount" id="pm-amount">0.00</span>
      </div>

      <div class="pm-keypad" role="application" aria-label="Numeric keypad">
        <button class="pm-key" data-key="7" type="button">7</button>
        <button class="pm-key" data-key="8" type="button">8</button>
        <button class="pm-key" data-key="9" type="button">9</button>

        <button class="pm-key" data-key="4" type="button">4</button>
        <button class="pm-key" data-key="5" type="button">5</button>
        <button class="pm-key" data-key="6" type="button">6</button>

        <button class="pm-key" data-key="1" type="button">1</button>
        <button class="pm-key" data-key="2" type="button">2</button>
        <button class="pm-key" data-key="3" type="button">3</button>

        <button class="pm-key pm-key-clear" data-key="C" type="button">C</button>
        <button class="pm-key" data-key="0" type="button">0</button>
        <button class="pm-key" data-key="." type="button">.</button>

        <!-- wide backspace -->
        <button class="pm-key pm-key-back" data-key="back" type="button">
          <i class="fa-solid fa-delete-left" aria-hidden="true"></i>
        </button>
      </div>

      <div class="pm-actions">
        <button id="pm-cancel" class="btn pm-btn-cancel" type="button">Cancel</button>
        <button id="pm-confirm" class="btn pm-btn-confirm" type="button">Confirmar</button>  <!-- ← Alterado: Texto genérico -->
      </div>

      <button class="pm-close" id="pm-close" aria-label="Fechar">×</button>
    </div>
  </div>
    
</div







  <!-- Stock Unavailable Warning (modal integrada, inicialmente oculta) -->
  <div id="stockWarningModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="stockWarningTitle">
      <div class="stock-warning-dialog bg-white dark:bg-[#231c0f] rounded-xl shadow-lg max-w-md w-full p-6 m-4">
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1 flex justify-center">
          <div class="bg-[#f9a406]/20 rounded-full p-3">
            <span class="material-symbols-outlined text-[#f9a406] text-4xl">warning</span>
          </div>
        </div>
        <!-- Close button in top-right -->
        <button aria-label="Fechar" onclick="hideStockWarning()" class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-300">
          ×
        </button>
      </div>
      <h3 id="stockWarningTitle" class="text-[#181611] dark:text-white text-xl font-bold text-center mb-2">Stock Unavailable</h3>
      <p class="text-[#181611] dark:text-gray-300 text-sm text-center mb-4">A quantidade solicitada é maior que o estoque disponível.</p>

      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 my-2">
        <div class="flex justify-between py-2">
          <p class="text-[#8c7c5f] dark:text-gray-400 text-sm">Estoque Disponível:</p>
          <p id="availableStock" class="text-[#181611] dark:text-white text-sm font-bold">0</p>
        </div>
        <div class="flex justify-between py-2">
          <p class="text-[#8c7c5f] dark:text-gray-400 text-sm">Quantidade Solicitada:</p>
          <p id="requestedQty" class="text-[#181611] dark:text-white text-sm font-bold">0</p>
        </div>
      </div>

      <div class="text-center mt-4">
        <!-- Botão OK com largura de 50% centralizado -->
        <button id="okBtn" class="inline-flex items-center justify-center w-1/2 mx-auto px-6 py-3 rounded-lg bg-blue-600 text-white font-bold">OK</button>
      </div>
    </div>
  </div>

















<!-- ============================================ -->
<!-- MODAL DE CHECKOUT - ADICIONAR ANTES DOS SCRIPTS -->
<!-- ============================================ -->

<!-- Modal Overlay -->
<div id="checkoutModalOverlay" class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50 p-4">
    <div class="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <!-- Título -->
            <h2 class="text-xl font-semibold text-gray-800">Finalizar Compra</h2>

            <!-- Botão de Fechar (X) -->
            <button onclick="showCloseConfirmation()" class="text-gray-400 hover:text-gray-600 transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <!-- Progress Stepper -->
        <!-- Progress Stepper ATUALIZADO -->
        <div class="px-6 py-6 border-b border-gray-200">
            <div class="flex items-center justify-between max-w-3xl mx-auto">
                <!-- Step 1 -->
                <div class="flex items-center flex-1">
                    <div id="checkoutStep1" class="step-indicator flex flex-col items-center">
                        <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                            <span class="step-number">1</span>
                            <svg class="step-check w-5 h-5 hidden" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <span class="text-xs mt-2 text-gray-600">Informações do Cliente</span>
                    </div>
                    <div class="flex-1 h-1 bg-gray-200 mx-2">
                        <div id="checkoutProgress1" class="h-full bg-blue-600 transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Step 2 (AGORA É O ÚLTIMO) -->
                <div class="flex items-center">
                    <div id="checkoutStep2" class="step-indicator flex flex-col items-center">
                        <div class="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-semibold text-sm">
                            <span class="step-number">2</span>
                            <svg class="step-check w-5 h-5 hidden" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <span class="text-xs mt-2 text-gray-600"></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Step Content Container -->
        <div class="p-6">
            
            <!-- STEP 1: Customer Information -->
            <div id="checkoutStepContent1" class="checkout-step-content" style="display: block;">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Customer Form -->
                    <div class="bg-white p-8 rounded-lg shadow-sm">
                        <h1 class="text-2xl font-semibold mb-6">Informações do Cliente</h1>
                        <form id="checkoutCustomerForm" class="space-y-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1" for="checkoutFullName">Nome Completo <span class="text-red-500">*</span></label>
                                <input class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500" id="checkoutFullName" name="fullName" placeholder="João Silva" type="text" autocomplete="off" required oninput="searchCustomer()">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1" for="checkoutEmail">Email <span class="text-red-500">*</span></label>
                                <input class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500" id="checkoutEmail" name="email" placeholder="joao@exemplo.com" type="email" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1" for="checkoutPhone">Telefone <span class="text-red-500">*</span></label>
                                <div class="flex">
                                    <select class="appearance-none h-full rounded-l-md border border-r-0 border-gray-200 bg-gray-50 py-2 pl-3 pr-7 text-gray-500 sm:text-sm" id="checkoutCountryCode">
                                        <option value="+244">+244 (AO)</option>
                                        <option value="+1">+1 (US)</option>
                                        <option value="+351">+351 (PT)</option>
                                    </select>
                                    <input class="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-r-md" id="checkoutPhone" name="phone" placeholder="923 456 789" type="text" required>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1" for="checkoutAddress">Endereço</label>
                                <input class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md" id="checkoutAddress" name="address" placeholder="Rua, Cidade" type="text">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-500 mb-1" for="checkoutNif">NIF / Contribuinte (Opcional)</label>
                                <input class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md" id="checkoutNif" name="nif" placeholder="123456789" type="text">
                            </div>
                            <div>
                                <button type="button" onclick="checkoutNextStep()" class="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-700">
                                    Continuar para Pagamento
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Substituir o Order Summary (Step 1) por esta tabela -->
                    <!-- TABELA SEM SCROLL - CABE TUDO! -->
                    <!-- Tabela de Clientes (direita do form, sem scroll, filtra em tempo real) -->
                  <!-- Customer Table -->
                  <div class="bg-white p-8 rounded-lg shadow-sm">
                    <div class="overflow-x-auto">
                        <!-- SUBSTITUA o <thead> e <tbody> por isto: -->
                        <table class="w-full text-left text-sm table-fixed" id="customerTableList">
                            <thead>
                                <tr class="border-b-2 border-gray-300 text-gray-500 uppercase text-xs">
                                  <th class="py-3 px-4 font-semibold w-1/5">Nome</th>
                                  <th class="py-3 px-4 font-semibold w-1/5">Telefone</th>
                                  <th class="py-3 px-4 font-semibold w-1/5">Email</th>
                                  <th class="py-3 px-4 font-semibold w-1/5">Morada</th>
                                  <th class="py-3 px-4 font-semibold w-1/5">NIF</th>
                                </tr>
                            </thead>
                            <tbody id="customerTableBody">
                                <!-- Rows serão renderizadas pelo JS -->
                            </tbody>
                        </table>
                    </div>
                  </div>
                </div>
            </div>

            <!-- STEP 2: Payment Method -->
            <!-- STEP 2: Payment Method -->
            <!-- STEP 2: Payment Method -->
            <div id="checkoutStepContent2" class="checkout-step-content" style="display: none;">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Payment Method Selection -->
                    <div class="lg:col-span-2">
                        <h3 class="text-2xl font-semibold text-gray-800 mb-6">Método de Pagamento</h3>
                        
                        <!-- Container dinâmico para os métodos da API -->
                        <div id="checkoutPaymentMethodsContainer" class="checkout-payment-methods grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                            <!-- Os cards serão renderizados dinamicamente via JavaScript -->
                            <div class="text-center text-gray-500 py-4">Carregando métodos de pagamento...</div>
                        </div>


                        <!-- Interface Unificada de Pagamento (inputs vão pro método atual) -->
                        <div id="checkoutCashPayment" class="checkout-payment-interface">
                            <div class="mb-4">
                              <label class="block text-sm font-medium text-gray-700 mb-2">
                                Valor recebido do cliente (método atual)
                              </label>

                              <!-- Input real com o mesmo design visual -->
                              <div class="text-4xl font-bold text-gray-800 mb-4 p-4 bg-gray-50 rounded-lg flex justify-center items-center">
                                <input
                                  type="text" 
                                  id="checkoutCashInput" 
                                  inputmode="numeric"
                                  placeholder="Kz 0"
                                  class="w-full px-4 py-3 text-4xl font-bold text-center bg-transparent border-0 focus:outline-none text-gray-800"
                                  value="Kz 0"
                                  focus:ring-2 focus:ring-blue-400 focus:rounded-lg transition-all
                                />
                              </div>
                            </div>
                            <!-- Quick Amount Buttons -->
                            <div class="grid grid-cols-4 gap-2 mb-4">
                                <button onclick="addCheckoutQuickAmount(500)" class="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Kz 500</button>
                                <button onclick="addCheckoutQuickAmount(1000)" class="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Kz 1.000</button>
                                <button onclick="addCheckoutQuickAmount(2000)" class="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Kz 2.000</button>
                                <button onclick="addCheckoutQuickAmount(5000)" class="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Kz 5.000</button>
                            </div>

                            <!-- Numeric Keypad -->
                            <!-- Numeric Keypad -->
                            <div class="grid grid-cols-3 gap-2 mb-4">
                                <button onclick="checkoutKeypadInput('1')" class="checkout-keypad-button py-2 bg-white border border-gray-300 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-150">1</button>
                                <button onclick="checkoutKeypadInput('2')" class="checkout-keypad-button py-2 bg-white border border-gray-300 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-150">2</button>
                                <button onclick="checkoutKeypadInput('3')" class="checkout-keypad-button py-2 bg-white border border-gray-300 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-150">3</button>
                                <button onclick="checkoutKeypadInput('4')" class="checkout-keypad-button py-2 bg-white border border-gray-300 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-150">4</button>
                                <button onclick="checkoutKeypadInput('5')" class="checkout-keypad-button py-2 bg-white border border-gray-300 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-150">5</button>
                                <button onclick="checkoutKeypadInput('6')" class="checkout-keypad-button py-2 bg-white border border-gray-300 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-150">6</button>
                                <button onclick="checkoutKeypadInput('7')" class="checkout-keypad-button py-2 bg-white border border-gray-300 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-150">7</button>
                                <button onclick="checkoutKeypadInput('8')" class="checkout-keypad-button py-2 bg-white border border-gray-300 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-150">8</button>
                                <button onclick="checkoutKeypadInput('9')" class="checkout-keypad-button py-2 bg-white border border-gray-300 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-150">9</button>
                                <button onclick="checkoutKeypadInput('.')" class="checkout-keypad-button py-2 bg-white border border-gray-300 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-150">.</button>
                                <button onclick="checkoutKeypadInput('0')" class="checkout-keypad-button py-2 bg-white border border-gray-300 rounded-md text-base font-semibold hover:bg-gray-50 transition-all duration-150">0</button>
                                <button onclick="backspaceCheckoutCash()" class="checkout-keypad-button py-2 bg-gray-100 border border-gray-300 rounded-md text-base font-semibold hover:bg-gray-200 transition-all duration-150">⌫</button>
                            </div>

                            <!-- Botão Clear separado -->
                            <div class="flex justify-center mb-4">
                                <button onclick="clearCheckoutCash()" class="checkout-keypad-button py-2 px-6 bg-red-50 border border-red-200 rounded-md text-sm font-semibold hover:bg-red-100 text-red-600 transition-all duration-150">Limpar (C)</button>
                            </div>

                            <!-- Botões Finais (unificados) -->
                            <div class="flex gap-3 mt-4">
                                <button onclick="checkoutPrevStep()" class="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors">
                                    ← Voltar
                                </button>
                                <button id="btnPayNow" onclick="checkoutNextStep()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                                    Pay Now
                                </button>
                            </div>
                        </div>

                        <!-- REMOVIDO: Interfaces de Card e Mobile -- não são mais necessárias -->
                    </div>

                    <!-- Order Summary (Step 2) -- mantém igual, JS atualiza total/restante se quiser -->
                    <!-- Order Summary (Step 2) -->
                    <div class="lg:col-span-1">
                      <div class="bg-gray-50 rounded-lg p-6 sticky top-6">
                        <h4 class="text-lg font-semibold text-gray-800 mb-4">Order Summary</h4>

                        <div id="checkoutOrderSummaryStep2" class="space-y-3 mb-4">
                          <!-- Preenchido via JS -->
                        </div>

                        <div class="border-t border-gray-300 pt-4 space-y-2">
                          <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Total Íliquido</span>
                            <span class="font-medium" id="checkoutSummarySubtotal2">Kz 0,00</span>
                          </div>
                          <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Total de Impostos</span>
                            <span class="font-medium" id="checkoutSummaryTax2">Kz 0,00</span>
                          </div>
                          <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Retenção</span>
                            <span class="font-medium text-red-600" id="checkoutSummaryDiscount2">Kz 0,00</span>
                          </div>
                          <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                            <span>Total Payment</span>
                            <span id="checkoutSummaryTotal2">Kz 0,00</span>
                          </div>
                        </div>

                        <!-- Observação Expandable -->
                        <div class="mt-5 border-t border-gray-300 pt-4">
                          <button id="toggleObservation" 
                            class="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 transition-all">
                            <span>Observação</span>
                            <svg id="obsArrow" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          <div id="observationArea" class="overflow-hidden transition-all duration-500 max-h-0 opacity-0">
                            <textarea 
                              id="checkoutObservation" 
                              rows="4" 
                              placeholder="Adicione uma observação ao pedido..." 
                              class="mt-3 w-full p-3 text-sm border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                            </textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>

<!-- Modal Confirm Dialog -->
<div id="modal-confirm-dialog" class="fixed inset-0 flex items-center justify-center hidden z-[99999]" aria-hidden="true">
  <!-- Overlay -->
  <div id="overlay-confirm-dialog" class="fixed inset-0 bg-black/30 opacity-0 transition-opacity duration-300 z-[99998]"></div>

  <!-- Caixa da Modal -->
  <div id="box-confirm-dialog"
       class="bg-white w-[360px] rounded-2xl shadow-xl p-6 relative text-center fade-enter-confirm-dialog z-[99999]"
       role="dialog"
       aria-modal="true"
       aria-labelledby="title-confirm-dialog"
       aria-describedby="desc-confirm-dialog"
       tabindex="0">

    <!-- Botão Fechar -->
    <button id="close-confirm-dialog"
            type="button"
            class="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-lg"
            aria-label="Fechar">
      &times;
    </button>

    <!-- Ícone -->
    <div class="flex justify-center mb-4">
      <div class="bg-blue-100 p-3 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg"
             class="h-6 w-6 text-blue-600"
             fill="none"
             viewBox="0 0 24 24"
             stroke="currentColor">
          <path stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>

    <!-- Título -->
    <h2 id="title-confirm-dialog" class="text-lg font-semibold text-gray-900 mb-1">
      Are you sure?
    </h2>

    <!-- Texto -->
    <p id="desc-confirm-dialog" class="text-gray-500 text-sm mb-6">
      This action can’t be undone. Please confirm if you want to proceed.
    </p>

    <!-- Botões -->
    <div class="flex justify-center gap-3">
      <button id="cancel-confirm-dialog"
              type="button"
              class="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
        Cancel
      </button>
      <button id="confirm-confirm-dialog"
              type="button"
              class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Confirm
      </button>
    </div>
  </div>
</div>


<!-- ============================================ -->
<!-- SIDE PANEL: SELEÇÃO DE CLIENTE (ANTIGO - COMENTADO) -->
<!-- Substituído pelo novo painel slider dentro da área de produtos -->
<!-- ============================================ -->
<!--
<div class="side-panel" id="clientePanel">
  <div class="panel-header">
    <h3>
      <i class="fa-solid fa-user"></i>
      Selecionar Cliente
    </h3>
    <button class="panel-close" onclick="closePanel('clientePanel')">
      <i class="fa-solid fa-times"></i>
    </button>
  </div>

  <div class="panel-body">
    <div class="panel-search">
      <i class="fa-solid fa-search"></i>
      <input
        type="text"
        id="panelClientSearch"
        placeholder="Buscar por nome, telefone ou email..."
        oninput="searchClientePanel(this.value)"
      />
    </div>

    <div id="panelClientList" class="client-list">
    </div>

    <button class="btn-new-client" onclick="openNewClientForm()">
      <i class="fa-solid fa-plus"></i>
      Cadastrar Novo Cliente
    </button>

    <div id="newClientForm" class="new-client-form" style="display: none;">
      <h4>Novo Cliente</h4>
      <input type="text" placeholder="Nome Completo *" id="newClientName" required />
      <input type="tel" placeholder="Telefone *" id="newClientPhone" required />
      <input type="email" placeholder="Email *" id="newClientEmail" required />
      <input type="text" placeholder="Endereço" id="newClientAddress" />
      <input type="text" placeholder="NIF (opcional)" id="newClientNIF" />

      <div class="form-actions">
        <button class="btn-cancel" onclick="cancelNewClient()">Cancelar</button>
        <button class="btn-save" onclick="saveNewClient()">Salvar</button>
      </div>
    </div>
  </div>
</div>
-->

<!-- ============================================ -->
<!-- SIDE PANEL: TIPO DE DOCUMENTO -->
<!-- ============================================ -->
<div class="side-panel" id="documentoPanel">
  <div class="panel-header">
    <h3>
      <i class="fa-solid fa-file-invoice"></i>
      Tipo de Documento
    </h3>
    <button class="panel-close" onclick="closePanel('documentoPanel')">
      <i class="fa-solid fa-times"></i>
    </button>
  </div>
  
  <div class="panel-body">
    <div class="doc-type-list">
      <div class="doc-type-item active" onclick="selectDocType('fatura-recibo', this)">
        <i class="fa-solid fa-file-invoice"></i>
        <div>
          <strong>Fatura Recibo</strong>
          <small>Documento padrão com pagamento</small>
        </div>
        <i class="fa-solid fa-check-circle"></i>
      </div>
      
      <div class="doc-type-item" onclick="selectDocType('fatura-proforma', this)">
        <i class="fa-solid fa-file-lines"></i>
        <div>
          <strong>Fatura Proforma</strong>
          <small>Orçamento sem valor fiscal</small>
        </div>
        <i class="fa-solid fa-check-circle"></i>
      </div>
      
      <div class="doc-type-item" onclick="selectDocType('fatura', this)">
        <i class="fa-solid fa-receipt"></i>
        <div>
          <strong>Fatura</strong>
          <small>Documento fiscal sem recibo</small>
        </div>
        <i class="fa-solid fa-check-circle"></i>
      </div>
      
      <div class="doc-type-item" onclick="selectDocType('orcamento', this)">
        <i class="fa-solid fa-calculator"></i>
        <div>
          <strong>Orçamento</strong>
          <small>Proposta comercial</small>
        </div>
        <i class="fa-solid fa-check-circle"></i>
      </div>
    </div>
  </div>
</div>
<!-- Alert Container (pode ficar no body) -->
<!-- Coloque isso no final do body, antes dos scripts -->
<div id="alertContainer"></div>


<!-- Scripts -->
<script src="../assets/js/clientes.js"></script>
<script src="../assets/js/fatura.js"></script>
<script src="../assets/js/modal_checkout.js"></script>
<script src="../assets/js/app.js"></script>
<!-- <script src="../assets/js/checkout-integrated.js"></script> TEMPORARIAMENTE DESATIVADO PARA TESTE -->
<!-- Container para impressão da fatura -->
<!-- Deve estar no final do body, antes dos scripts -->
<div id="inv-a4-container-principal" style="position: fixed; top: -9999px; left: -9999px; z-index: -1; background: white;"></div>
<div id="fatura80-container-inv80" style="position: fixed; top: -9999px; left: -9999px; z-index: -1; background: white; width: 80mm;"></div>
</body>
</html>