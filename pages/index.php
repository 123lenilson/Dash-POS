<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>L&P - POS Dashboard</title>
  <link rel="stylesheet" href="../assets/css/main.css" />
  <!-- Font Awesome Free (CDN) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

</head>
<body>
  <!-- Skeleton loading (estilo YouTube) - escondido quando produtos e carrinho estiverem prontos -->
  <div class="app-skeleton" id="appSkeleton" aria-hidden="false">
    <div class="skeleton-layout-main">
      <div class="skeleton-block skeleton-search"></div>
      <div class="skeleton-block skeleton-pills" style="margin-top: 14px;"></div>
      <div class="skeleton-product-grid">
        <?php for ($i = 0; $i < 12; $i++) { ?>
        <div class="skeleton-block skeleton-card"></div>
        <?php } ?>
      </div>
    </div>
    <div class="skeleton-layout-side">
      <div class="skeleton-block skeleton-cart-header"></div>
      <div class="skeleton-block skeleton-cart-body"></div>
      <div class="skeleton-block skeleton-cart-footer-row"></div>
      <div class="skeleton-block skeleton-cart-footer-row"></div>
      <div class="skeleton-block skeleton-cart-footer-btn" style="margin-top: 8px;"></div>
    </div>
    <div class="skeleton-mobile-wrap">
      <div class="skeleton-block skeleton-mobile-btn"></div>
    </div>
  </div>

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
          <!-- Slot para a search + toggle em mobile (≤905px); preenchido via JS -->
          <div id="headerSearchSlot" class="header-search-slot" aria-hidden="true"></div>
          <div class="date-time" id="dateTime"></div>
          <div class="user" id="loggedUserArea" title="Clique para ver width da tela (teste)">
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
        <!-- SEARCH BAR + BOTÃO CLIENTE (em ≤905px o #searchBarInner é movido para #headerSearchSlot) -->
        <div class="search-bar-container">
          <div id="searchBarInner" class="search-bar-inner">
            <div class="search-wrapper">
              <i class="fa-solid fa-search search-icon-left" aria-hidden="true"></i>
              <input id="searchInput" type="text" placeholder="Procurar por produtos ou serviços" />

              <!-- Toggle DENTRO do input, à direita -->
              <label class="barcode-toggle barcode-toggle-inline">
                <input type="checkbox" id="barcodeToggle">
                <span class="toggle-switch"></span>
                <span class="toggle-label-short">Código de Barras</span>
              </label>

              <button id="clearSearch" class="clear-btn" aria-label="Limpar busca">×</button>
            </div>
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
              <div class="client-section-header-row">
                <h4 class="section-title">CLIENTE SELECIONADO</h4>
                <button type="button" class="client-panel-close-btn" onclick="closeClientPanel()" aria-label="Fechar">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
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
                      <input type="radio" name="invoiceFormat" value="A4" checked>
                      <span class="format-switch-visual"></span>
                    </div>
                  </label>
                  <label class="format-toggle-option" data-format="80mm">
                    <span class="format-label">80mm</span>
                    <div class="format-switch-container">
                      <input type="radio" name="invoiceFormat" value="80mm">
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
          <!-- Wrapper do Input (em ≤905px o Exato fica dentro do wrapper, estilo search) -->
          <div class="footer-amount-wrapper">
            <input
              type="text"
              id="footerCashInput"
              inputmode="numeric"
              placeholder="Kz 0"
              class="footer-amount-input"
              value="Kz 0"
            />
            <button class="keypad-exact-btn keypad-exact-btn--inline" type="button" onclick="fillExactAmount()">Exato</button>
          </div>
          <!-- Célula do botão Pagar (só visível ≤905px; em linha com o input: 80% + 20%) -->
          <div class="footer-pay-cell">
            <button class="keypad-pay-btn keypad-pay-btn--mobile">Pagar</button>
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
                      OBS | Desc. <i class="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                  <div class="order-summary-content">
                    <!-- Card: Total a pagar (1ª posição) -->
                    <div class="order-card">
                      <div class="order-card-info">
                        <span class="order-card-label">Total a pagar:</span>
                        <span class="order-card-value" id="summaryTotalPagar">Kz 0,00</span>
                      </div>
                      <div class="order-card-icon">
                        <i class="fa-solid fa-money-bills"></i>
                      </div>
                    </div>

                    <!-- Card: Total Ilíquido (2ª posição) -->
                    <div class="order-card">
                      <div class="order-card-info">
                        <span class="order-card-label">Total ilíquido:</span>
                        <span class="order-card-value" id="summaryNetTotal">Kz 0,00</span>
                      </div>
                      <div class="order-card-icon">
                        <i class="fa-solid fa-receipt"></i>
                      </div>
                    </div>

                    <!-- Card: Total Impostos (3ª posição) -->
                    <div class="order-card">
                      <div class="order-card-info">
                        <span class="order-card-label">Total impostos:</span>
                        <span class="order-card-value" id="summaryTaxTotal">Kz 0,00</span>
                      </div>
                      <div class="order-card-icon">
                        <i class="fa-solid fa-percent"></i>
                      </div>
                    </div>

                    <!-- Card: Retenção (4ª posição) -->
                    <div class="order-card">
                      <div class="order-card-info">
                        <span class="order-card-label">Retenção:</span>
                        <span class="order-card-value" id="summaryRetention">Kz 0,00</span>
                      </div>
                      <div class="order-card-icon">
                        <i class="fa-solid fa-hand-holding-dollar"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- View 2: Observação (oculta por defeito) -->
                <div class="order-obs-view" id="orderObsView">
                  <div class="order-obs-header">
                    <div class="order-obs-tabs">
                      <button type="button" class="order-obs-tab active" id="obsTabObservacao" aria-selected="true">Observação</button>
                      <button type="button" class="order-obs-tab" id="obsTabDesc" aria-selected="false">Desc.</button>
                    </div>
                    <button class="obs-back-btn" id="obsBackBtn" type="button">
                      <i class="fa-solid fa-arrow-left"></i> Voltar
                    </button>
                  </div>
                  <!-- Corpo: viewport + segundo contentor deslizante (200%), por agora sem funcionalidade de deslize -->
                  <div class="order-obs-body-wrapper">
                    <div class="order-obs-inner-track" id="orderObsInnerSlider">
                      <div class="order-obs-panel" id="orderObsPanelObs">
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
                      <div class="order-desc-panel" id="orderObsPanelDesc">
                        <div class="order-desc-content">
                          <label class="order-desc-label" for="orderDiscountInput">Desconto (valor ou %)</label>
                          <input
                            type="text"
                            id="orderDiscountInput"
                            class="order-desc-input"
                            placeholder="Ex: 500 ou 10%"
                            inputmode="decimal"
                          />
                          <button class="order-desc-apply-btn" id="orderDiscountApplyBtn" type="button">
                            <i class="fa-solid fa-percent"></i> Aplicar desconto
                          </button>
                        </div>
                      </div>
                    </div>
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
              
              <!-- Exato + Pagar no desktop (≥906px); em ≤905px o Pagar está em footer-amount-row) -->
              <div class="keypad-final-row">
                <button class="keypad-exact-btn" onclick="fillExactAmount()">Exato</button>
                <button class="keypad-pay-btn keypad-pay-btn--desktop">Pagar</button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </aside>
  </div>
  
  <!-- Sticky Bottom Menu (apenas ≤905px) -->
  <div class="sticky-bottom-menu" id="stickyBottomMenu">
    <button class="sticky-menu-btn" id="stickyClientBtn" type="button" aria-label="Selecionar Cliente">
      <i class="fa-solid fa-user"></i>
      <span class="sticky-menu-label" id="stickyClientLabel">Consumidor Final</span>
    </button>
    <button class="sticky-menu-btn sticky-menu-btn-primary" id="stickyCartBtn" type="button" aria-label="Ver Carrinho">
      <i class="fa-solid fa-cart-shopping"></i>
      <span class="sticky-cart-badge" id="stickyCartBadge">0</span>
    </button>
    <button class="sticky-menu-btn" id="stickyDocTypeBtn" type="button" aria-label="Tipo de Factura">
      <i class="fa-solid fa-file-invoice"></i>
      <span class="sticky-menu-label" id="stickyDocTypeLabel">Tipo Factura</span>
    </button>
  </div>

  <!-- Modal Bottom Sheet (abre ao clicar nos botões do Sticky Menu) -->
  <div class="bottom-sheet-overlay" id="bottomSheetOverlay"></div>
  <div class="bottom-sheet" id="bottomSheet" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="bottom-sheet-handle"></div>
    <div class="bottom-sheet-body" id="bottomSheetBody"></div>
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

<!-- Alert Container (pode ficar no body) -->
<!-- Coloque isso no final do body, antes dos scripts -->
<div id="alertContainer"></div>

<!-- Container para Fatura A4 -->
<div id="inv-a4-container-principal" style="
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 210mm;
  background: white;
  z-index: -1;
  display: none;
"></div>

<!-- Container para Fatura 80mm -->
<div id="fatura80-container-inv80" class="recibo-inv80" style="
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 80mm;
  background: white;
  z-index: -1;
  display: none;
"></div>

<!-- Scripts -->
<script src="../assets/js/ui/invoice/fatura.js"></script>
<script src="../assets/js/ui/invoice/fatura80.js"></script>
<script src="../assets/js/services/cliente.service.js"></script>
<script src="../assets/js/modules/client.module.js"></script>
<script src="../assets/js/ui/client-panel.ui.js"></script>
<script src="../assets/js/utils/monetary-formatter.js"></script>

<!-- === NOVA ESTRUTURA APP.JS === -->
<script src="../assets/js/state.js"></script>
<script src="../assets/js/dom.js"></script>
<script src="../assets/js/utils.js"></script>
<script src="../assets/js/services/produto.service.js"></script>
<script src="../assets/js/services/pedido.service.js"></script>
<script src="../assets/js/services/pagamento.service.js"></script>
<script src="../assets/js/modules/invoice-assets.module.js"></script>
<script src="../assets/js/modules/cart.module.js"></script>
<script src="../assets/js/modules/barcode.module.js"></script>
<script src="../assets/js/modules/checkout.module.js"></script>
<script src="../assets/js/ui/skeleton.ui.js"></script>
<script src="../assets/js/ui/alerts.ui.js"></script>
<script src="../assets/js/ui/modal.ui.js"></script>
<script src="../assets/js/ui/products.ui.js"></script>
<script src="../assets/js/ui/cart.ui.js"></script>
<script src="../assets/js/ui/cart-editing.ui.js"></script>
<script src="../assets/js/ui/payment.ui.js"></script>
<script src="../assets/js/ui/invoice-type.ui.js"></script>
<script src="../assets/js/ui/order-summary.ui.js"></script>
<script src="../assets/js/ui/search.ui.js"></script>
<script src="../assets/js/ui/bottom-sheet.ui.js"></script>
<script src="../assets/js/app.js"></script>
</body>
</html>