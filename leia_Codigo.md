/* ================================================
   LAYOUT: Responsive
   Ficheiro: assets/css/layout/responsive.css
   Parte do sistema Dash-POS
   TODOS os @media queries globais do sistema
   ================================================ */

/* 2 colunas entre 350px e 450px */
@media (min-width:350px) and (max-width:450px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: var(--space-md);
    padding: 0 var(--space-lg) var(--space-xl);
  }
  .product-grid .card { margin:0; }
}

/* phones < 350px: 1 coluna */
@media (max-width:349px) {
  .product-grid {
    grid-template-columns: 1fr !important;
    padding: 0 var(--space-md) var(--space-xl);
  }
}

/* Bot�o menu mobile - base (escondido por defeito) */
.main-header .mobile-menu-btn,
.header .mobile-menu-btn,
.navbar .mobile-menu-btn {
  display: none !important;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: none;
}

@media (max-width: 890px) {
  .main .main-nav { display:none !important; }
  .controls { display:none !important; }
  .date-time { display:none !important; }

  .main-header .mobile-menu-btn,
  .header .mobile-menu-btn,
  .navbar .mobile-menu-btn {
    display: inline-grid !important;
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
    width:36px;
    height:36px;
    border-radius:6px;
    border:0;
    background:transparent;
    color:var(--muted);
    place-items:center;
    cursor:pointer;
    transition: all .12s ease;
    font-size: var(--font-lg);
  }

  .main .main-nav {
    display: flex !important;
    flex-direction: column;
    gap: var(--space-sm);
    align-items: flex-start;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: var(--mobile-nav-width);
    max-width: 100%;
    padding: var(--space-lg) var(--space-lg);
    box-sizing: border-box;
    background: var(--card);
    border: none;
    border-radius: 0;
    box-shadow: 0 18px 50px rgba(10,10,40,0.12);
    transform: translateX(-110%);
    transition: transform .28s cubic-bezier(.2,.9,.2,1);
    z-index: 1200;
    visibility: hidden;
    pointer-events: none;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .main .main-nav .nav-link{
    display:flex;
    width:100%;
    padding: var(--space-md) var(--space-md);
    margin: clamp(2px, 0.2vw, 4px) 0;
    border-radius:4px;
    justify-content:flex-start;
    text-align:left;
    font-size: var(--font-md);
  }

  .main-header.nav-open .main-nav {
    transform: translateX(0);
    visibility: visible;
    pointer-events: auto;
  }
}

@media (max-width: 1100px) {
  .cart-body-wrapper {
    flex-direction: column;
  }

  .cart-body-wrapper:not(.doc-panel-open) .doc-type-panel-slider {
    flex: 0 0 0;
    height: 0;
    min-height: 0;
    overflow: hidden;
  }

  .cart-body-wrapper:not(.doc-panel-open) .cart-content-area {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
  }

  .cart-body-wrapper.doc-panel-open .doc-type-panel-slider.active {
    width: 100%;
    min-width: 100%;
    flex: 1;
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .cart-body-wrapper.doc-panel-open .cart-content-area {
    flex: 0 0 0;
    height: 0;
    min-height: 0;
    overflow: hidden;
  }

  .product-grid{ grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); padding: 0 var(--space-lg) var(--space-xl); }

  .date-time {
    display: none !important;
    visibility: hidden !important;
  }
}

/* RESPONSIVIDADE DO SEARCH BAR CONTAINER */
@media (min-width: 761px) and (max-width: 1100px) {
  .search-bar-container {
    margin: var(--space-md) 0;
    padding: 0 var(--space-lg);
    gap: var(--space-md);
  }

  .toggle-select-painel {
    padding: var(--space-lg) var(--space-lg);
    font-size: var(--font-md);
  }
}

@media (min-width: 906px) {
  .footer-amount-row .footer-amount-wrapper {
    flex: 1 1 auto;
    min-width: 80px;
  }
  .footer-amount-row .footer-pay-cell {
    display: none !important;
  }

  .bottom-sheet-overlay,
  .bottom-sheet {
    display: none !important;
  }

  .client-panel-close-btn {
    display: none !important;
  }
}

@media (max-width: 905px) {
  :root {
    --font-xs:    clamp(8px,  0.8vw,  10px);
    --font-sm:    clamp(10px, 0.9vw,  12px);
    --font-base:  clamp(11px, 1vw,    13px);
    --font-md:    clamp(12px, 1.1vw,  14px);
    --font-lg:    clamp(13px, 1.3vw,  16px);
  }

  .app-skeleton { grid-template-columns: 1fr; }
  .skeleton-layout-side { display: none; }
  .skeleton-product-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-md); }
  .skeleton-mobile-wrap { display: block !important; }

  .main-header-right .header-search-slot {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    flex: 1;
    min-width: 0;
    justify-content: flex-end;
  }
  .main-header-right .date-time {
    display: none;
  }
  .main-header .header-search-slot .search-bar-inner {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    min-width: 0;
  }
  .main-header .header-search-slot .search-wrapper {
    display: flex;
    align-items: center;
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
    flex: 0 0 auto;
    min-width: 0;
    gap: var(--space-sm);
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--collapsed .search-icon-left {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    border-radius: 50%;
    background: #E0E0E0;
    color: #555;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-lg);
    cursor: pointer;
    flex-shrink: 0;
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--collapsed input,
  .main-header .header-search-slot .search-wrapper.search-wrapper--collapsed .clear-btn {
    width: 0;
    min-width: 0;
    overflow: hidden;
    opacity: 0;
    padding: 0;
    margin: 0;
    border: none;
    pointer-events: none;
    position: absolute;
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--collapsed .barcode-toggle-inline {
    flex-shrink: 0;
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--expanded {
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 9999px;
    padding: var(--space-sm) var(--space-md) var(--space-sm) var(--space-md);
    gap: var(--space-sm);
    flex: 1;
    max-width: 180px;
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--expanded .search-icon-left {
    font-size: var(--font-md);
    flex-shrink: 0;
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--expanded input {
    width: 100%;
    min-width: 0;
    opacity: 1;
    position: static;
    pointer-events: auto;
    font-size: var(--font-md);
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--expanded .barcode-toggle-inline,
  .main-header .header-search-slot .search-wrapper.search-wrapper--expanded .clear-btn {
    width: auto;
    min-width: 0;
    opacity: 1;
    position: static;
    pointer-events: auto;
  }
  .sticky-section-home .search-bar-container {
    display: none;
  }

  .search-wrapper {
    padding: var(--space-sm) var(--space-lg);
    gap: var(--space-sm);
    border-radius: 9999px;
  }

  .search-icon-left {
    font-size: var(--font-md);
  }

  .search-wrapper input {
    font-size: var(--font-md);
  }

  .barcode-toggle-inline {
    padding: clamp(3px, 0.3vw, 4px) var(--space-md);
    gap: var(--space-xs);
    border-radius: 6px;
  }

  .toggle-switch {
    width: 26px;
    height: 14px;
    border-radius: 7px;
  }

  .toggle-switch::before {
    width: 10px;
    height: 10px;
  }

  .barcode-toggle-inline input:checked + .toggle-switch::before {
    transform: translateX(12px);
  }

  .toggle-label-short {
    font-size: var(--font-sm);
  }

  .clear-btn {
    font-size: var(--font-lg);
    padding: clamp(2px, 0.2vw, 4px) var(--space-xs);
  }

  .invoice-type-options-panel {
    padding: var(--space-lg) var(--space-lg);
  }
  .invoice-toggle-option {
    padding: var(--space-md) var(--space-lg);
  }
  .toggle-label {
    font-size: var(--font-lg);
  }
  .format-toggle-option {
    padding: var(--space-md) var(--space-lg);
  }
  .format-label {
    font-size: var(--font-md);
  }

  .footer-amount-row {
    gap: var(--space-md);
  }
  .footer-amount-row .footer-amount-wrapper {
    flex: 1;
    min-width: 0;
    align-self: stretch;
    box-sizing: border-box;
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: clamp(2px, 0.3vw, 5px);
    padding: 0 var(--space-sm);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
    position: relative;
  }
  .footer-amount-row .footer-amount-wrapper:focus-within {
    border-color: #000000;
    border-width: 1px;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }
  .footer-amount-row .footer-amount-input {
    flex: unset;
    min-width: 0;
    width: 100%;
    height: auto;
    padding: 0;
    padding-right: clamp(40px, 8vw, 70px);
    /* 20pt Word ? 26.67px; em mobile mant�m grande com clamp */
    font-size: clamp(20px, 2.5vw, 28px);
    font-weight: 700;
    text-align: center;
    color: #111111;
    background: transparent !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    caret-color: #6b7280;
    font-family: inherit;
    -webkit-appearance: none;
    appearance: none;
    line-height: 1;
  }
  .footer-amount-row .footer-amount-input:focus {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .footer-amount-row .footer-amount-input::placeholder {
    color: #888;
  }
  .footer-amount-row .footer-amount-wrapper .keypad-exact-btn--inline {
    display: flex;
    flex-shrink: 0;
    height: 28px;
    min-height: 28px;
    padding: 0 var(--space-md);
    font-size: var(--font-sm);
    font-weight: 700;
    border-radius: 4px;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: var(--space-sm);
    top: 50%;
    transform: translateY(-50%);
  }
  .keypad-final-row .keypad-exact-btn {
    display: none !important;
  }
  .footer-amount-row .footer-pay-cell {
    flex: 0 0 20%;
    width: 20%;
    min-width: 0;
    display: flex;
    align-items: stretch;
  }
  .footer-pay-cell .keypad-pay-btn {
    flex: 1;
    width: 100%;
    height: 38px;
    min-height: 38px;
  }
  .keypad-pay-btn--desktop {
    display: none !important;
  }

  .bottom-sheet-body {
    padding-bottom: var(--space-lg);
  }

  /* Bottom Sheet: painel de faturacao � altura inteligente (lista ocupa espa�o, rodap� s� o necess�rio) */
  .cart-sheet-tab-panel-fatura {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding: 0 12px 0;
    padding-bottom: 0;
    box-sizing: border-box;
  }
  .cart-sheet-tab-panel-fatura #cartContentArea {
    flex: 1 1 auto;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .cart-sheet-tab-panel-fatura .cart-footer {
    flex: 0 0 auto;
    flex-grow: 0;
    flex-shrink: 0;
    flex-basis: auto;
    min-height: 0;
    overflow: hidden;
    overflow-y: hidden;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    padding: var(--space-xs) 0 var(--space-sm);
    gap: clamp(3px, 0.3vw, 4px);
    border-top: 1px solid var(--line, #e5e7eb);
  }
  .cart-sheet-tab-panel-fatura .cart-footer .payment-methods-section,
  .cart-sheet-tab-panel-fatura .cart-footer .footer-amount-row {
    flex-shrink: 0;
    min-height: 0;
  }
  .bottom-sheet-body:has(.cart-sheet-tab-panel-fatura) {
    padding-bottom: 0;
    min-height: 0;
  }

  /* Bot�o Voltar no header do carrinho (bottom sheet): vis�vel e estilizado em ?905px */
  .bottom-sheet .cart-header .cart-sheet-back-btn {
    display: flex;
    background: #ffffff;
    color: var(--gray-700, #374151);
    position: relative;
    overflow: hidden;
    outline: none;
    transition: background 0.2s ease, box-shadow 0.2s ease;
  }
  .bottom-sheet .cart-header .cart-sheet-back-btn:hover {
    background: var(--gray-200, #e5e7eb);
  }
  .bottom-sheet .cart-header .cart-sheet-back-btn:focus,
  .bottom-sheet .cart-header .cart-sheet-back-btn:focus-visible {
    background: var(--gray-200, #e5e7eb);
  }
  .bottom-sheet .cart-header .cart-sheet-back-btn:focus-visible {
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.08);
  }
  .bottom-sheet .cart-header .cart-sheet-back-btn:active {
    background: var(--gray-300, #d1d5db);
  }
  .bottom-sheet .cart-header .cart-sheet-back-btn i {
    font-size: clamp(18px, 1.6vw, 22px);
    font-weight: 900;
  }

  .bottom-sheet .cart-header .cart-sheet-back-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.12);
    opacity: 0;
    transform: scale(0);
    pointer-events: none;
  }
  .bottom-sheet .cart-header .cart-sheet-back-btn:active::after {
    animation: cartBackRipple 0.4s ease-out;
  }

  @keyframes cartBackRipple {
    0% {
      opacity: 0.3;
      transform: scale(0);
    }
    100% {
      opacity: 0;
      transform: scale(1);
    }
  }

  .interface{
    grid-template-columns: 1fr !important;
  }
  .interface.panel-open {
    grid-template-columns: 1fr !important;
  }
  .checkout-panel{
    display: none !important;
  }
  body { padding-bottom: 64px; }
  .sticky-bottom-menu { display: flex; }
  .search-bar-container .toggle-select-painel.cliente-btn {
    display: none !important;
  }
  .search-bar-container .search-wrapper {
    flex: 1 1 100%;
    max-width: 100%;
  }
  .main .product-grid {
    padding-bottom: 0;
  }

  .sticky-section-home {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg, #fff);
    padding-bottom: 0;
  }

  .main.col-60.products-col {
    height: auto;
    min-height: 0;
    overflow-x: hidden;
  }

  .products-container-wrapper {
    padding-bottom: 0;
    margin-bottom: 0;
  }

  .client-panel-close-btn {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 50%;
    background: #f1f5f9;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease, color 0.2s ease;
  }
  .client-panel-close-btn:hover {
    background: #e2e8f0;
    color: #334155;
  }
  .client-panel-close-btn i {
    font-size: var(--font-lg);
  }

  /* Painel de selecionar cliente: fontes maiores em mobile/tablet (< 905px) */
  .panel-header-slider h3 {
    font-size: var(--font-sm);
  }
  .panel-header-slider h3 i {
    font-size: var(--font-xs);
  }
  .section-title {
    font-size: var(--font-xs);
    letter-spacing: 0.7px;
  }
  .client-card-name {
    font-size: var(--font-base);
  }
  .client-card-details {
    font-size: var(--font-sm);
  }
  .client-search-input {
    font-size: var(--font-base);
  }
  .client-search-input::placeholder {
    font-size: var(--font-base);
  }
  .client-card-indicator {
    font-size: var(--font-lg);
  }
  .client-form-input {
    font-size: var(--font-base);
  }
  .client-form-input::placeholder {
    font-size: var(--font-sm);
  }
  .client-form-submit {
    font-size: var(--font-base);
  }
  .client-name {
    font-size: var(--font-md);
  }
  .client-details {
    font-size: var(--font-base);
  }
  .btn-new-client {
    font-size: var(--font-base);
  }

  /* Ordem de Venda: Contentores no Bottom Sheet (≤905px) */
  .ordem-sheet-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    width: 100%;
    box-sizing: border-box;
  }

  .ordem-summary-section {
    width: 100%;
    box-sizing: border-box;
    margin-top: clamp(6px, 0.8vw, 9px);
    margin-bottom: clamp(6px, 0.8vw, 9px);
  }

  .order-summary-content {
    padding-left: clamp(8px, 2vw, 16px);
    padding-right: clamp(8px, 2vw, 16px);
  }

  /* Font-size aumentado para a linha "Total a pagar" */
  .order-row--total .order-row-label,
  .order-row--total .order-row-value {
    font-size: clamp(20px, 3.5vw, 35px);
  }

  /* Classe específica para destacar ainda mais o Total a pagar no bottom sheet */
  .order-total-highlighted .order-row-label,
  .order-total-highlighted .order-row-value {
    font-size: clamp(20px, 3.5vw, 35px) !important;
  }

  .ordem-obs-section {
    width: 100%;
    box-sizing: border-box;
    margin-top: clamp(6px, 0.8vw, 9px);
    margin-bottom: clamp(6px, 0.8vw, 9px);
  }

  /* Font-size para texto na ordem de venda (≤905px) */
  .order-summary-content .order-row-label,
  .order-summary-content .order-row-value {
    font-size: clamp(12px, 1.8vw, 18px);
  }

  .order-obs-view .order-obs-header,
  .order-obs-view .order-obs-tab,
  .order-obs-view .order-obs-panel,
  .order-obs-view .order-desc-panel {
    font-size: clamp(12px, 1.8vw, 18px);
  }

  .obs-textarea,
  .order-desc-input {
    font-size: clamp(12px, 1.8vw, 18px);
  }

  /* ─── ORDER SUMMARY SLIDER: layout em coluna no Bottom Sheet ≤905px ─── */

  .order-summary-slider {
    flex-direction: column;
    width: 100%;
    height: 100%;
    transform: none !important;
  }

  .order-summary-slider.show-obs {
    transform: none !important;
  }

  /* Cada view ocupa exatamente metade da altura do slider */
  .order-summary-view,
  .order-obs-view {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    height: 50%;
    flex: 0 0 50%;
    box-sizing: border-box;
    overflow: hidden;
  }

  /* Conteúdo da Ordem de Venda: alinhado ao topo */
  .order-summary-view {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  /* Conteúdo da área OBS|Desc: alinhado ao fundo */
  .order-obs-view {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: var(--space-sm) 0 0;
  }

  /* Wrapper com altura total para alimentar os 50%+50% */
  .order-summary-wrapper {
    height: 100%;
    overflow: hidden;
  }

  /* Esconder botão Voltar e botão OBS|Desc em mobile */
  .obs-back-btn {
    display: none !important;
  }
  .obs-toggle-btn {
    display: none !important;
  }

  /* obs-header: apenas as tabs, em linha */
  .order-obs-header {
    flex-direction: row !important;
    align-items: center !important;
    justify-content: flex-start;
    padding-bottom: var(--space-xs);
  }

  .order-obs-tabs {
    width: 100%;
  }

  /* footer-actions-left no bottom sheet: largura total */
  .bottom-sheet .footer-actions-left {
    width: 100%;
  }
}

@media (max-width: 768px) {
  #alertContainer {
    bottom: 10px;
    left: 10px;
    right: 10px;
    max-width: none;
  }

  .alert {
    min-width: auto;
    max-width: none;
  }

  .client-panel-slider {
    width: 320px;
    min-width: 320px;
  }

  .products-container-wrapper.panel-open .product-grid {
    margin-right: 320px;
  }

  .panel-body-slider {
    padding: var(--space-lg) var(--space-md);
    gap: var(--space-lg);
  }

  .client-section {
    gap: var(--space-sm);
  }

  .client-card {
    padding: var(--space-sm) var(--space-md);
  }

  .client-card-name {
    font-size: var(--font-sm);
  }

  .client-card-details {
    font-size: var(--font-xs);
  }

  .section-title {
    font-size: clamp(8px, 0.8vw, 10px);
    font-weight: 800;
    letter-spacing: 0.7px;
  }

  .client-search-input {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-sm);
    border-radius: 6px !important;
    -webkit-border-radius: 6px !important;
    -moz-border-radius: 6px !important;
  }

  .client-search-input::placeholder {
    font-size: var(--font-sm);
    color: #94a3b8;
  }

  .client-card-indicator {
    font-size: var(--font-md);
  }

  .client-form {
    gap: var(--space-md);
  }

  .client-form-input {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-sm);
  }

  .client-form-input::placeholder {
    font-size: var(--font-xs);
    color: #94a3b8;
  }

  .client-form-submit {
    padding: var(--space-sm) var(--space-lg);
    font-size: var(--font-sm);
  }
}

@media (max-width: 630px) {
  .footer-amount-row {
    flex-wrap: wrap;
  }

  /* Cancela o mecanismo horizontal e troca para vertical */
  .footer-amount-row .payment-status-element {
    order: -1;
    flex: 0 0 100%;
    width: 100%;
    max-width: 100% !important;   /* anula o max-width: 0 do base */
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    padding: 0 !important;
    transform: translateY(16px);
    transition: max-height 0.35s ease,
                opacity 0.35s ease,
                padding 0.3s ease,
                transform 0.35s ease;
    justify-content: center;
    align-items: center;
  }

  /* Quando o JS adiciona .visible � sobe e expande verticalmente */
  .footer-amount-row .payment-status-element.visible {
    max-height: 60px;
    opacity: 1;
    padding: 6px 10px !important;
    transform: translateY(0);
  }

  /* Conte�do do status (�cone + texto) centralizado */
  .footer-amount-row .payment-status-element .status-text {
    align-items: center;
  }
}














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











/* ================================================
   MÓDULO: Bottom Sheet UI
   Ficheiro: assets/js/ui/bottom-sheet.ui.js
   Parte do sistema Dash-POS
   ================================================ */

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
        var clone = panelBody.cloneNode(true);
        clone.className = 'panel-body-slider bottom-sheet-client-panel-body';
        sheetBody.appendChild(clone);

        clone.querySelectorAll('.client-card').forEach(function (card) {
          card.addEventListener('click', function () {
            var clientId = parseInt(card.dataset.clientId);
            if (typeof ClientModule !== 'undefined') ClientModule.selectClientById(clientId);
          });
        });

        var clonedSearch = clone.querySelector('#clientSearchInput');
        if (clonedSearch) {
          clonedSearch.id = 'clientSearchInput_sheet';
          clonedSearch.addEventListener('input', function (e) {
            var term = e.target.value;
            var allClients = (typeof ClientModule !== 'undefined') ? ClientModule.getAllClients() : [];
            var results = term.trim()
              ? ((typeof ClientModule !== 'undefined') ? ClientModule.filterClients(term) : [])
              : allClients;
            var listPanel = clone.querySelector('#clientListPanel');
            var listSec = clone.querySelector('#clientListSection');
            var formSec = clone.querySelector('#clientFormSection');
            var titleEl = clone.querySelector('#clientSearchTitle');
            if (!results.length && term.trim()) {
              if (listSec) listSec.style.display = 'none';
              if (formSec) formSec.style.display = 'block';
              if (titleEl) titleEl.textContent = 'NOME DO CLIENTE';
              return;
            }
            if (listSec) listSec.style.display = 'block';
            if (formSec) formSec.style.display = 'none';
            if (titleEl) titleEl.textContent = 'PROCURA POR CLIENTES AQUI';
            if (!listPanel) return;
            listPanel.innerHTML = results.slice(0, 6).map(function (c) {
              var esc = (typeof ClientModule !== 'undefined') ? ClientModule.escapeHtml : function (t) { return t; };
              return '<div class="client-card" data-client-id="' + c.idcliente + '">' +
                '<div class="client-card-content"><div class="client-card-name">' + esc(c.nome) + '</div>' +
                '<div class="client-card-details">' +
                '<span>Endereço: ' + esc(c.morada || 'N/A') + '</span> | ' +
                '<span>Telefone: ' + esc(c.telefone || 'N/A') + '</span> | ' +
                '<span>NIF: ' + esc(c.nif || 'N/A') + '</span>' +
                '</div></div></div>';
            }).join('');
            listPanel.querySelectorAll('.client-card').forEach(function (card) {
              card.addEventListener('click', function () {
                if (typeof ClientModule !== 'undefined') ClientModule.selectClientById(parseInt(card.dataset.clientId));
              });
            });
          });
        }

        var clonedForm = clone.querySelector('#newClientForm');
        if (clonedForm) {
          clonedForm.id = 'newClientForm_sheet';
          clonedForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var nameInput = clone.querySelector('#clientSearchInput_sheet') || clone.querySelector('[id^="clientSearchInput"]');
            var nifInput = clone.querySelector('#newClientNif');
            var phoneInput = clone.querySelector('#newClientPhone');
            var emailInput = clone.querySelector('#newClientEmail');
            var addressInput = clone.querySelector('#newClientAddress');
            var formData = {
              nome: nameInput ? nameInput.value.trim() : '',
              nif: nifInput ? nifInput.value.trim() : '',
              telefone: phoneInput ? phoneInput.value.trim() : '',
              email: emailInput ? emailInput.value.trim() : '',
              endereco: addressInput ? addressInput.value.trim() : ''
            };
            if (typeof ClientModule !== 'undefined') {
              var success = await ClientModule.saveNewClient(formData);
              if (success) {
                if (nameInput) nameInput.value = '';
                if (nifInput) nifInput.value = '';
                if (phoneInput) phoneInput.value = '';
                if (emailInput) emailInput.value = '';
                if (addressInput) addressInput.value = '';
                var listSec = clone.querySelector('#clientListSection');
                var formSec = clone.querySelector('#clientFormSection');
                if (listSec) listSec.style.display = 'block';
                if (formSec) formSec.style.display = 'none';
              }
            }
          });
        }
      }
    } else if (panelType === 'doctype') {
      sheetBody.innerHTML = '';
      var invoicePanel = document.querySelector('#docTypePanelSlider .invoice-type-options-panel');
      if (invoicePanel) {
        var docClone = invoicePanel.cloneNode(true);
        sheetBody.appendChild(docClone);

        // Handlers para selecção do tipo de factura
        docClone.querySelectorAll('.invoice-toggle-option').forEach(function (option) {
          option.addEventListener('click', function () {
            var invoiceType = this.getAttribute('data-invoice-type');
            if (!invoiceType) return;

            tipoDocumentoAtual = invoiceType;

            // Sincroniza painel original (radio + active)
            invoicePanel.querySelectorAll('.invoice-toggle-option').forEach(function (o) { o.classList.remove('active'); });
            var origOption = invoicePanel.querySelector('[data-invoice-type="' + invoiceType + '"]');
            if (origOption) {
              origOption.classList.add('active');
              var origRadio = origOption.querySelector('input[type="radio"]');
              if (origRadio) origRadio.checked = true;
            }

            // Actualiza visuais do clone
            docClone.querySelectorAll('.invoice-toggle-option').forEach(function (o) { o.classList.remove('active'); });
            this.classList.add('active');

            // Actualiza UI do dashboard
            if (typeof updateInvoiceTypeDisplay === 'function') updateInvoiceTypeDisplay(invoiceType);
            if (typeof window.updateOrderSummaryDescTabState === 'function') window.updateOrderSummaryDescTabState();
            if (typeof updateCartFooterLockIcons === 'function') updateCartFooterLockIcons(invoiceType);

            setTimeout(function () { closeBottomSheet(); }, 250);
          });
        });

        // Handlers para selecção de formato (A4 / 80mm)
        docClone.querySelectorAll('.format-toggle-option').forEach(function (option) {
          option.addEventListener('click', function (e) {
            e.stopPropagation();
            var format = this.getAttribute('data-format');
            if (!format) return;

            formatoFaturaAtual = format;

            // Sincroniza painel original
            invoicePanel.querySelectorAll('.format-toggle-option').forEach(function (o) { o.classList.remove('active'); });
            var origFormat = invoicePanel.querySelector('[data-format="' + format + '"]');
            if (origFormat) {
              origFormat.classList.add('active');
              var origRadio = origFormat.querySelector('input[type="radio"]');
              if (origRadio) origRadio.checked = true;
            }

            // Actualiza visuais do clone
            docClone.querySelectorAll('.format-toggle-option').forEach(function (o) { o.classList.remove('active'); });
            this.classList.add('active');

            if (typeof updateInvoiceTypeDisplay === 'function') updateInvoiceTypeDisplay(tipoDocumentoAtual);
          });
        });
      }
    } else if (panelType === 'cart') {
      // Restauração de segurança: elementos presos no sheetBody (transitionend falhou anteriormente)
      (function () {
        var _strandedHeader = sheetBody.querySelector('.cart-header');
        var _strandedArea = sheetBody.querySelector('#cartContentArea');
        var _strandedFooter = sheetBody.querySelector('.cart-footer');
        if (_strandedHeader || _strandedArea || _strandedFooter) {
          var _cp = document.getElementById('checkoutPanel');
          var _cbw = document.getElementById('cartBodyWrapper');
          var _cb = _cp ? _cp.querySelector('.cart-body') : null;
          if (_strandedHeader && _cp && _cb) _cp.insertBefore(_strandedHeader, _cb);
          if (_strandedArea && _cbw) _cbw.appendChild(_strandedArea);
          if (_strandedFooter && _cb) _cb.appendChild(_strandedFooter);
        }
      })();
      sheetBody.innerHTML = '';
      var checkoutPanel = document.getElementById('checkoutPanel');
      var cartHeader = checkoutPanel ? checkoutPanel.querySelector('.cart-header') : null;
      var cartBodyWrapper = document.getElementById('cartBodyWrapper');
      var cartContentArea = document.getElementById('cartContentArea');
      var cartFooter = checkoutPanel ? checkoutPanel.querySelector('.cart-footer') : null;
      if (cartHeader) sheetBody.appendChild(cartHeader);

      var docTypeNames = { 'factura-recibo': 'Factura-Recibo', 'factura-proforma': 'Factura Proforma', 'factura': 'Factura', 'orcamento': 'Orçamento' };
      var currentDocType = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
      var docTypeLabel = docTypeNames[currentDocType] || currentDocType || 'Factura';
      if (currentDocType === 'factura-recibo') {
        var fmt = (typeof formatoFaturaAtual !== 'undefined' && formatoFaturaAtual) ? formatoFaturaAtual : (document.querySelector('input[name="invoiceFormat"]:checked')?.value || 'A4');
        docTypeLabel = docTypeLabel + ' ' + (fmt === '80mm' ? '80mm' : 'A4');
      }
      var totalVal = (typeof currentCartTotal !== 'undefined' ? currentCartTotal : 0) || 0;
      var totalFormatted = (typeof currency !== 'undefined' && currency && typeof currency.format === 'function') ? currency.format(totalVal) : (totalVal.toFixed(2) + ' Kz');

      var tabBar = document.createElement('div');
      tabBar.className = 'cart-sheet-tabs';
      tabBar.setAttribute('role', 'tablist');
      tabBar.innerHTML =
        '<button type="button" class="cart-sheet-tab active" role="tab" aria-selected="true" data-cart-tab="fatura">' +
          '<span class="cart-sheet-tab-inner">' +
            '<span class="cart-sheet-tab-doc-label">' + docTypeLabel + '</span>' +
            '<span class="cart-sheet-tab-total">Total a pagar: <span id="cartSheetTabTotal">' + totalFormatted + '</span></span>' +
          '</span>' +
        '</button>' +
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
      
      // Contentor pai: stacked verticalmente
      var ordemContainer = document.createElement('div');
      ordemContainer.className = 'ordem-sheet-container';
      
      // Contentor 1: Resumo da Ordem
      var summarySection = document.createElement('div');
      summarySection.className = 'ordem-summary-section';
      summarySection.innerHTML = `
        <div class="order-summary-content">
          <div class="order-row">
            <span class="order-row-label">Total ilíquido</span>
            <span class="order-row-value" id="summaryNetTotalSheet">Kz 0,00</span>
          </div>
          <div class="order-row">
            <span class="order-row-label">Total impostos</span>
            <span class="order-row-value order-row-value--tax" id="summaryTaxTotalSheet">Kz 0,00</span>
          </div>
          <div class="order-row">
            <span class="order-row-label">Retenção</span>
            <span class="order-row-value order-row-value--retention" id="summaryRetentionSheet">Kz 0,00</span>
          </div>
          <div class="order-total-divider"></div>
          <div class="order-row order-row--total">
            <span class="order-row-label">Total a pagar</span>
            <span class="order-row-value" id="summaryTotalPagarSheet">Kz 0,00</span>
          </div>
        </div>
      `;
      ordemContainer.appendChild(summarySection);
      
      // Contentor 2: OBS | Desc
      var obsSection = document.createElement('div');
      obsSection.className = 'ordem-obs-section';
      obsSection.innerHTML = `
        <div class="order-obs-view">
          <div class="order-obs-header">
            <div class="order-obs-tabs">
              <button type="button" class="order-obs-tab active" aria-selected="true">Observação</button>
              <button type="button" class="order-obs-tab" aria-selected="false">Desc.</button>
            </div>
            <button class="obs-back-btn" type="button">
              <i class="fa-solid fa-arrow-left"></i> Voltar
            </button>
          </div>
          <div class="order-obs-body-wrapper">
            <div class="order-obs-inner-track">
              <div class="order-obs-panel">
                <div class="order-obs-content">
                  <textarea
                    class="obs-textarea"
                    placeholder="Adicione uma observação ao pedido..."
                    rows="4"
                  ></textarea>
                  <button class="obs-submit-btn" type="button">
                    <i class="fa-solid fa-check"></i> Confirmar
                  </button>
                </div>
              </div>
              <div class="order-desc-panel">
                <div class="order-desc-content">
                  <label class="order-desc-label" for="orderDiscountInputSheet">Desconto (valor ou %)</label>
                  <input
                    type="text"
                    id="orderDiscountInputSheet"
                    class="order-desc-input"
                    placeholder="Ex: 500 ou 10%"
                    inputmode="decimal"
                  />
                  <button class="order-desc-apply-btn" type="button">
                    <i class="fa-solid fa-percent"></i> Aplicar desconto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      ordemContainer.appendChild(obsSection);
      
      ordemPanel.appendChild(ordemContainer);
      sheetBody.appendChild(ordemPanel);

      // Inicializa os listeners da área OBS|Desc dentro do sheet (mobile)
      if (typeof window.initOrderSummaryInSheet === 'function') {
        window.initOrderSummaryInSheet(ordemContainer);
      }

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

    var panelType = currentPanel;
    currentPanel = null;
    sheet.classList.add('closing');

    // Limpar referência ao contentor do sheet quando fechado
    if (typeof window !== 'undefined') {
      window.currentSheetOrdemContainer = null;
    }

    var _closeDone = false;
    var _fallbackTimer = null;

    function _doClose() {
      if (_closeDone) return;
      _closeDone = true;
      clearTimeout(_fallbackTimer);
      sheet.removeEventListener('transitionend', _onTransitionEnd);
      sheet.classList.remove('active', 'closing', 'slide-up', 'bottom-sheet--short');
      sheet.style.transform = '';
      sheet.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('active');
      document.body.style.overflow = '';

      // client + doctype: conteúdo são clones — destruídos pelo innerHTML = '' abaixo.
      if (panelType === 'cart') {
        var cartHeader = sheetBody.querySelector('.cart-header');
        var cartContentArea = sheetBody.querySelector('#cartContentArea');
        var cartFooterEl = sheetBody.querySelector('.cart-footer');
        var checkoutPanelEl = document.getElementById('checkoutPanel');
        var cartBodyWrapperEl = document.getElementById('cartBodyWrapper');
        var cartBodyEl = checkoutPanelEl ? checkoutPanelEl.querySelector('.cart-body') : null;
        if (cartHeader && checkoutPanelEl && cartBodyEl) checkoutPanelEl.insertBefore(cartHeader, cartBodyEl);
        if (cartContentArea && cartBodyWrapperEl) cartBodyWrapperEl.appendChild(cartContentArea);
        if (cartFooterEl && cartBodyEl) cartBodyEl.appendChild(cartFooterEl);
      }

      setTimeout(function () { sheetBody.innerHTML = ''; }, 50);
    }

    function _onTransitionEnd(e) {
      if (e.target !== sheet || e.propertyName !== 'transform') return;
      _doClose();
    }

    // Fallback: garante limpeza/restauração mesmo que transitionend não dispare
    _fallbackTimer = setTimeout(_doClose, 500);
    sheet.addEventListener('transitionend', _onTransitionEnd);
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

      // Fechar o bottom sheet quando um cliente for selecionado.
      // O listener é de uso único: remove-se a si próprio após disparar.
      function _onClientSelectedInSheet() {
        document.removeEventListener('clientSelected', _onClientSelectedInSheet);
        closeBottomSheet();
      }
      document.addEventListener('clientSelected', _onClientSelectedInSheet);

      // Garantir que os botões de fechar que vieram do painel desktop
      // também fechem o bottom sheet (em vez de apenas o painel slider).
      sheetBody.querySelectorAll(
        '.panel-close-slider, .client-panel-close-btn'
      ).forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          closeBottomSheet();
        });
      });
    }

    if (panelType === 'cart') {
      /* Conteúdo é o carrinho real (#cartContentArea) movido para o sheet; os cards já têm os handlers (removeCartProduct, toggleCardExpansion, etc.). */
      var backBtn = sheetBody.querySelector('.cart-sheet-back-btn');
      if (backBtn) {
        backBtn.onclick = function () {
          closeBottomSheet();
        };
      }
    }

    if (panelType === 'doctype') {
      /* Handlers já ligados ao clone em openBottomSheet — nada a fazer aqui. */
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

  /** Atualiza o total a pagar na primeira aba do bottom sheet (carrinho), quando o sheet está aberto. */
  function updateBottomSheetCartTabTotal() {
    var el = document.getElementById('cartSheetTabTotal');
    if (!el) return;
    var totalVal = (typeof currentCartTotal !== 'undefined' ? currentCartTotal : 0) || 0;
    var formatted = (typeof currency !== 'undefined' && currency && typeof currency.format === 'function') ? currency.format(totalVal) : (totalVal.toFixed(2) + ' Kz');
    el.textContent = formatted;
  }
  window.updateBottomSheetCartTabTotal = updateBottomSheetCartTabTotal;

  updateStickyCartBadge();
  window.updateStickyCartBadge = updateStickyCartBadge;
  if (typeof updateStickyDocTypeLabel === 'function') updateStickyDocTypeLabel();
  window.closeBottomSheet = closeBottomSheet;
  window.openBottomSheet = openBottomSheet;
}



