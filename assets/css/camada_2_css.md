# Camada 2 — CSS (components)

Este documento consolida todo o código CSS da pasta **components/** (`assets/css/components/`).

---

<!-- ========== INÍCIO: components/alerts.css ========== -->

## components/alerts.css

```css
/* ================================================
   COMPONENTE: Alerts
   Ficheiro: assets/css/components/alerts.css
   Parte do sistema Dash-POS
   ================================================ */


#alertContainer {
  position: fixed;
  bottom: var(--space-xl);
  left: var(--space-xl);
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse;
  gap: var(--space-lg);
  max-width: 380px;
}

.alert {
  min-width: 300px;
  max-width: 380px;
  padding: var(--space-lg);
  border-radius: 12px;
  box-shadow: var(--shadow-strong);
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
  animation: alertSlideIn 0.3s ease-out forwards;
  border-left: 4px solid transparent;
  background: var(--card);
  border: 1px solid var(--line);
}

.alert-enter {
  animation: alertSlideIn 0.3s ease-out forwards;
}

.alert-exit {
  animation: alertSlideOut 0.3s ease-in forwards;
}

@keyframes alertSlideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes alertSlideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

.alert-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
  flex: 1;
}

.alert-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.alert-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.alert-title {
  font-weight: 600;
  font-size: var(--font-lg);
  line-height: 1.2;
}

.alert-message {
  font-size: var(--font-md);
  opacity: 0.9;
  line-height: 1.3;
}

.alert-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s ease;
  color: inherit;
}

.alert-close:hover {
  opacity: 1;
  background: rgba(0,0,0,0.05);
}

.alert.success {
  border-left-color: var(--ok);
  background: linear-gradient(135deg, #f0fdf4, #ffffff);
  color: #166534;
}

.alert.success .alert-icon {
  background: var(--ok);
  color: white;
}

.alert.error {
  border-left-color: var(--warn);
  background: linear-gradient(135deg, #fef2f2, #ffffff);
  color: #dc2626;
}

.alert.error .alert-icon {
  background: var(--warn);
  color: white;
}

.alert.warning {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb, #ffffff);
  color: #92400e;
}

.alert.warning .alert-icon {
  background: #f59e0b;
  color: white;
}

.alert.info {
  border-left-color: var(--accent);
  background: linear-gradient(135deg, #eff6ff, #ffffff);
  color: #1e40af;
}

.alert.info .alert-icon {
  background: var(--accent);
  color: white;
}

#criticalAlertContainer {
  position: fixed;
  bottom: var(--space-xl);
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  pointer-events: none;
}

.alert-critical {
  width: 100%;
  max-width: 600px;
  height: auto;
  min-height: 56px;
  background: #EF4444;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-lg) var(--space-lg) var(--space-lg);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
  pointer-events: all;
}

.alert-critical-content {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex: 1;
}

.alert-critical-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #FFFFFF;
}

.alert-critical-icon svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 2px;
}

.alert-critical-message {
  flex: 1;
  font-size: var(--font-lg);
  font-weight: 500;
  color: #FFFFFF;
  line-height: 1.5;
  letter-spacing: normal;
}

.alert-critical-close {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  color: #FFFFFF;
}

.alert-critical-close svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 2px;
}

.alert-critical-close:hover {
  background: rgba(255, 255, 255, 0.15);
}

.alert-critical-close:active {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(0.95);
}

.alert-critical-enter {
  animation: criticalFadeIn 0.3s ease-out forwards;
}

.alert-critical-exit {
  animation: criticalFadeOut 0.3s ease-in forwards;
}

@keyframes criticalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes criticalFadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@media (max-width: 640px) {
  #criticalAlertContainer {
    bottom: 0;
    left: 0;
    right: 0;
    transform: none;
    width: 100%;
  }

  .alert-critical {
    max-width: 100%;
    border-radius: 0;
    margin: 0;
  }

  .alert-critical-message {
    font-size: 13px;
  }
}

<!-- ========== FIM: components/alerts.css ========== -->

---

<!-- ========== INÍCIO: components/bottom-sheet.css ========== -->

## components/bottom-sheet.css

*Nota: Sem alterações de CSS na correção doctype/cart (alterações apenas em bottom-sheet.ui.js; ver camada_2_js.md).*

/* ================================================
   COMPONENTE: Bottom Sheet
   Ficheiro: assets/css/components/bottom-sheet.css
   Parte do sistema Dash-POS
   ================================================ */

.sticky-bottom-menu {
  display: none;
  position: fixed;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 96%;
  max-width: 100%;
  height: 52px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(224, 224, 224, 0.4);
  border-radius: 9999px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
  z-index: 9999;
  padding: 8px 12px;
  box-sizing: border-box;
  justify-content: space-between;
  align-items: stretch;
  gap: 0;
}

.sticky-menu-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  padding: 4px 8px;
  box-sizing: border-box;
}

.sticky-menu-btn:not(.sticky-menu-btn-primary) {
  flex: 1 1 0;
  min-width: 0;
  max-width: 48%;
  border-radius: 9999px;
  align-self: center;
}

.sticky-menu-btn i {
  font-size: 13px;
  color: rgba(102, 102, 102, 0.85);
  transition: color 0.2s ease;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.sticky-menu-label {
  position: static;
  font-size: var(--font-xs);
  font-weight: 500;
  color: rgba(136, 136, 136, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  max-width: 100%;
  text-align: center;
  pointer-events: none;
  line-height: 1.1;
}

.sticky-menu-btn-primary {
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #000000;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  justify-content: center;
  align-items: center;
  padding: 0;
  align-self: center;
  transform: translateY(-6px);
}

.sticky-menu-btn-primary i {
  font-size: 18px;
  color: #ffffff;
  margin-bottom: 0;
}

.sticky-menu-btn-primary .sticky-menu-label {
  display: none;
}

.sticky-cart-badge {
  position: absolute;
  top: -1px;
  right: -1px;
  background: #ff4444;
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  min-width: 14px;
  height: 14px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 1px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.sticky-menu-btn:not(.sticky-menu-btn-primary):hover {
  background: #e5e7eb;
  transform: translateY(-2px);
  border-radius: 9999px;
}

.sticky-menu-btn:not(.sticky-menu-btn-primary):hover i,
.sticky-menu-btn:not(.sticky-menu-btn-primary):hover .sticky-menu-label {
  color: #000000;
}

.sticky-menu-btn-primary:hover {
  background: #1a1a1a;
  transform: translateY(-6px) scale(1.05);
}

.sticky-menu-btn:active {
  transform: scale(0.95);
}

.bottom-sheet-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(2px);
}

.bottom-sheet-overlay.active {
  display: block;
  opacity: 1;
}

.bottom-sheet {
  display: flex;
  flex-direction: column;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 98vh;
  height: 98dvh;
  max-height: 98vh;
  max-height: 98dvh;
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  z-index: 10001;
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
}

.bottom-sheet.bottom-sheet-client {
  background: #F1F3F5;
}

.bottom-sheet.active {
  visibility: visible;
  pointer-events: auto;
}

.bottom-sheet.active.slide-up {
  transform: translateY(0);
}

.bottom-sheet.active.closing {
  transform: translateY(100%);
}

.bottom-sheet.bottom-sheet--short {
  height: 67vh;
  height: 67dvh;
  max-height: 67vh;
  max-height: 67dvh;
}

.bottom-sheet .cart-header .cart-header-title .toggle-select-painel {
  display: none !important;
}

.bottom-sheet .bottom-sheet-body:has(> .cart-header) {
  padding-top: 0;
  padding-left: 0;
  padding-right: 0;
  padding-bottom: 0;
  gap: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cart-sheet-tabs {
  display: flex;
  gap: 0;
  border-radius: 0;
  background: #eee;
  padding: 2px 12px;
  width: 100%;
  flex-shrink: 0;
  box-sizing: border-box;
}
.cart-sheet-tab {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 500;
  color: #666;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.cart-sheet-tab-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
.cart-sheet-tab-doc-label {
  font-size: 11px;
  font-weight: 500;
  color: inherit;
  line-height: 1.2;
}
.cart-sheet-tab-total {
  font-size: 13px;
  font-weight: 700;
  color: #000;
  line-height: 1.2;
}
.cart-sheet-tab:hover {
  color: #333;
}
.cart-sheet-tab:hover .cart-sheet-tab-total {
  color: #000;
}
.cart-sheet-tab.active {
  background: #fff;
  color: var(--color-selection, #333);
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}
.cart-sheet-tab.active .cart-sheet-tab-total {
  color: #000;
}

.cart-sheet-tab-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0 12px 12px;
  box-sizing: border-box;
}
.cart-sheet-tab-panel[hidden] {
  display: none !important;
}

.cart-sheet-tab-panel-fatura {
  display: flex;
  flex-direction: column;
  padding: 0 12px 0; /* sem espaço em baixo: cart-footer colado ao limite do bottom sheet */
}
.cart-sheet-tab-panel-fatura #cartContentArea {
  flex: 0 0 80%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
.cart-sheet-tab-panel-fatura .cart-footer {
  flex: 0 0 20%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 6px 0 0;
  gap: 4px;
  border-top: 1px solid var(--line, #e5e7eb);
}

.bottom-sheet .bottom-sheet-body .cart-header {
  flex: none;
  padding: 5px 12px;
  min-height: 0;
  border-bottom: 1px solid var(--line, #e5e7eb);
}
.bottom-sheet .bottom-sheet-body .cart-header .cart-header-title {
  min-height: 0;
}
.bottom-sheet .bottom-sheet-body .cart-header .btn-clear-cart {
  padding: 4px 8px;
  min-height: 26px;
}
.bottom-sheet .bottom-sheet-body .cart-header .btn-clear-cart i {
  font-size: 13px;
}

.bottom-sheet .cart-footer .footer-actions-row {
  display: none !important;
}

.cart-sheet-ordem-placeholder {
  padding: 24px;
  text-align: center;
  color: #888;
  font-size: 13px;
}

.bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background: #d0d0d0;
  border-radius: 2px;
  margin: 12px auto 8px;
  cursor: grab;
  flex-shrink: 0;
}

.bottom-sheet-handle:active {
  cursor: grabbing;
}

.bottom-sheet-doc-type-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 0 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}
.bottom-sheet-doc-type-title {
  font-size: 15px;
  font-weight: 600;
  color: #334155;
}
.bottom-sheet-close-btn-doc {
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
.bottom-sheet-close-btn-doc:hover {
  background: #e2e8f0;
  color: #334155;
}
.bottom-sheet-close-btn-doc i {
  font-size: 14px;
}

.bottom-sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.bottom-sheet-title {
  font-size: 18px;
  font-weight: 600;
  color: #111;
  margin: 0;
}

.bottom-sheet-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.bottom-sheet-close:hover {
  background: #e8e8e8;
}

.bottom-sheet-close i {
  font-size: 18px;
}

.bottom-sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
/* Carrinho no sheet: sem padding em baixo para o cart-footer ficar colado ao limite do bottom sheet */
.bottom-sheet-body:has(.cart-sheet-tab-panel-fatura) {
  padding-bottom: 0;
}

/* Quando o sheet mostra o painel de clientes, o body cede espaço ao wrapper sem padding duplicado */
.bottom-sheet-body:has(> .bottom-sheet-client-panel-body) {
  padding: 0;
  min-height: 0;
}

/* Conteúdo do painel de clientes no sheet: mesmo layout e scroll que no desktop */
.bottom-sheet-body .bottom-sheet-client-panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  width: 100%;
  box-sizing: border-box;
}

.bottom-sheet-body::-webkit-scrollbar {
  width: 6px;
}

.bottom-sheet-body::-webkit-scrollbar-track {
  background: transparent;
}

.bottom-sheet-body::-webkit-scrollbar-thumb {
  background: #d0d0d0;
}


<!-- ========== FIM: components/bottom-sheet.css ========== -->

---

<!-- ========== INÍCIO: components/cart-footer.css ========== -->

## components/cart-footer.css
/* ================================================
   COMPONENTE: Cart Footer
   Ficheiro: assets/css/components/cart-footer.css
   Parte do sistema Dash-POS
   ================================================ */

/* CART FOOTER FIXED */
.cart-footer-fixed{
  position:sticky;
  bottom:0;
  background:var(--card);
  padding:12px 14px;
  border-top:1px solid var(--line);
  z-index:10;
}
.cart-summary-compact{
  display:flex;
  flex-direction:column;
  gap:8px;
  font-size: 11px;
  margin-bottom: 12px;
}
.summary-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
}
.btn-checkout {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-primary);
  color: var(--color-selection);
  font-weight: 600;
  font-size: 14px;
  padding: 12px 16px;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 6px 18px var(--color-primary-shadow);
  transition: background .15s ease;
}
.btn-checkout:hover {
  background: var(--color-primary-hover);
}
.btn-checkout .btn-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
.btn-checkout #cartTotalBtn {
  font-size: 15px;
  font-weight: 700;
}

/* RODAPÉ DO CARRINHO */
.cart-footer {
  flex: 52;
  background: #ffffff;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 6px 8px 0;
  gap: 6px;
}

.cart-footer.document-type-proforma .payment-methods-section,
.cart-footer.document-type-proforma .footer-amount-row,
.cart-footer.document-type-proforma .keypad-grid,
.cart-footer.document-type-proforma .keypad-exact-btn {
  position: relative;
  opacity: 0.92;
  filter: grayscale(0.15);
}
.cart-footer.document-type-proforma .payment-methods-section::after,
.cart-footer.document-type-proforma .footer-amount-row::after,
.cart-footer.document-type-proforma .keypad-grid::after,
.cart-footer.document-type-proforma .keypad-exact-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(252, 252, 252, 0.55);
  cursor: not-allowed;
  pointer-events: auto;
  z-index: 2;
  border-radius: 6px;
}

.pm-card.locked .pm-card-name,
.pm-card.locked .pm-card-value {
  display: none !important;
}
.pm-card-lock {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  color: #444;
}
.pm-card-lock i {
  font-size: 10px;
}
.pm-card.locked .pm-card-lock {
  margin-left: 0;
}

.footer-amount-wrapper.locked .footer-amount-input {
  display: none !important;
}
.footer-input-lock {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
}
.footer-input-lock i {
  font-size: 12px;
}
.footer-amount-wrapper.locked .footer-input-lock {
  margin-left: 0;
}

.keypad-btn.locked {
  font-size: 0;
}
.keypad-btn.locked .keypad-btn-lock {
  font-size: 12px;
}
.keypad-btn-lock {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: #333;
}
.keypad-btn-lock i {
  font-size: 10px;
}
.keypad-btn.locked .keypad-btn-lock {
  margin-left: 0;
}

.keypad-exact-btn.locked {
  font-size: 0;
}
.keypad-exact-btn.locked .keypad-exact-lock {
  font-size: 12px;
}
.keypad-exact-lock {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #15803d;
}
.keypad-exact-lock i {
  font-size: 11px;
}
.keypad-exact-btn.locked .keypad-exact-lock {
  margin-left: 0;
}
.cart-footer.document-type-proforma .keypad-exact-lock {
  color: #22c55e;
}

.footer-section {
  width: 100%;
}

.payment-methods-section {
  display: flex;
  flex-direction: column;
}

.payment-methods-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.payment-methods-track {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  overflow-x: auto;
  scroll-behavior: smooth;
  -ms-overflow-style: none;
  scrollbar-width: none;
  flex: 1;
}

.payment-methods-track::-webkit-scrollbar {
  display: none;
}

.pm-card {
  flex: 0 0 auto;
  min-width: 70px;
  padding: 4px 12px;
  border: 1px solid #ebebeb;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
  transition: all 0.15s ease;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pm-card-name {
  font-size: 11px;
  font-weight: 500;
  color: #444;
  line-height: 1.3;
}

.pm-card-value {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
  min-height: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.15s ease;
}

.pm-card-value:not(:empty) {
  min-height: 18px;
  max-height: 32px;
  margin-top: 2px;
}

.pm-card-value.valor-negativo {
  color: #dc2626;
  font-weight: 600;
}

.pm-card-value.valor-positivo {
  color: #333;
  font-weight: 700;
}

.pm-card-value.valor-confirmado {
  color: #16a34a;
  font-weight: 600;
}

.pm-card:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.pm-card.active {
  background: rgba(0, 0, 0, 0.06);
  border-color: var(--color-selection);
}

.pm-card.active .pm-card-name {
  color: var(--color-selection);
}

.pm-card.editing {
  border-color: var(--color-selection);
  border-width: 2px;
  background: rgba(0, 0, 0, 0.08);
  transform: scale(1.03);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.pm-card.editing .pm-card-name {
  color: var(--color-selection);
  font-weight: 700;
}

.pm-empty {
  font-size: 10px;
  color: #999;
  font-style: italic;
}

.pm-arrow {
  display: none;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #ddd;
  cursor: pointer;
  font-size: 12px;
  color: #555;
  z-index: 2;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
  transition: all 0.15s ease;
  align-items: center;
  justify-content: center;
}

.pm-arrow:hover {
  background: #f5f5f5;
  border-color: #bbb;
}

.pm-arrow-prev { left: 0; }
.pm-arrow-next { right: 0; }

.payment-methods-wrapper.has-overflow .pm-arrow {
  display: flex;
}

.payment-methods-wrapper.has-overflow .payment-methods-track {
  margin: 0 22px;
}

.pm-arrow[disabled] {
  opacity: 0.3;
  pointer-events: none;
}

.footer-amount-row {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0;
  overflow: hidden;
}

.payment-status-element {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  padding: 0;
  transition: max-width 0.3s ease, opacity 0.3s ease, padding 0.3s ease, background 0.3s ease;
  white-space: nowrap;
  box-sizing: border-box;
  flex-shrink: 0;
}

.payment-status-element.visible {
  max-width: none;
  opacity: 1;
  padding: 0 10px;
}

.payment-status-element .status-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.payment-status-element .status-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.payment-status-element .status-label {
  font-size: 10px;
  font-weight: 500;
  line-height: 1.2;
}

.payment-status-element .status-value {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.2;
}

.payment-status-element.state-change {
  background: rgba(22, 163, 74, 0.35);
}
.payment-status-element.state-change .status-icon {
  stroke: #15803d;
}
.payment-status-element.state-change .status-label {
  color: #333;
}
.payment-status-element.state-change .status-value {
  color: #15803d;
}

.payment-status-element.state-remaining {
  background: rgba(220, 38, 38, 0.2);
}
.payment-status-element.state-remaining .status-icon {
  stroke: #dc2626;
}
.payment-status-element.state-remaining .status-label {
  color: #333;
}
.payment-status-element.state-remaining .status-value {
  color: #dc2626;
}

.payment-status-element.state-complete {
  background: rgba(37, 99, 235, 0.2);
}
.payment-status-element.state-complete .status-icon {
  stroke: #2563eb;
}
.payment-status-element.state-complete .status-label {
  color: #333;
}
.payment-status-element.state-complete .status-value {
  color: #2563eb;
}

.footer-amount-wrapper {
  flex: 1;
  min-width: 80px;
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
  box-sizing: border-box;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.06),
    inset 0 0 0 1px rgba(0, 0, 0, 0.02);
}

.footer-amount-wrapper:focus-within {
  border-color: #000000;
  border-width: 1px;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.footer-amount-wrapper .footer-amount-input {
  flex: unset;
  min-width: 0;
  width: 100%;
}

.footer-amount-input {
  width: 100%;
  height: auto;
  padding: 0;
  /* 20pt Word ≈ 26.67px @96dpi; clamp para escalar com viewport */
  font-size: clamp(22px, 2.8vw, 32px);
  font-weight: 700;
  text-align: center;
  color: #111111;
  background-color: transparent !important;
  border: none !important;
  border-radius: 0;
  outline: none !important;
  box-shadow: none !important;
  caret-color: #6b7280;
  font-family: inherit;
  -webkit-appearance: none;
  appearance: none;
  line-height: 1;
}

.footer-amount-input:focus {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.footer-amount-input::placeholder {
  color: #aaaaaa;
  font-weight: 700;
}

.footer-amount-label {
  font-size: var(--font-xs);
  font-weight: 400;
  color: #aaaaaa;
  text-align: center;
  line-height: 1;
  letter-spacing: 0.2px;
  pointer-events: none;
  user-select: none;
}

.footer-actions-row {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 0;
  min-height: 0;
  overflow: hidden;
}

.footer-actions-left {
  width: 45%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.footer-actions-right {
  width: 55%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* ORDER SUMMARY SLIDER COMPONENT */
.order-summary-wrapper {
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: #ffffff;
  border-radius: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.order-summary-slider {
  display: flex;
  width: 200%;
  height: 100%;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(0);
}

.order-summary-slider.show-obs {
  transform: translateX(-50%);
}

.order-summary-view {
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--space-xl) var(--space-xl) var(--space-xl) var(--space-lg);
  box-sizing: border-box;
  flex-shrink: 0;
}

.order-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-xs);
  flex-shrink: 0;
}

.order-summary-title {
  font-size: var(--font-xs);
  font-weight: 500;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.2px;
}

.obs-toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: transparent;
  border: none;
  border-radius: 4px;
  padding: var(--space-xs) var(--space-md);
  font-size: var(--font-xs);
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: background 0.2s ease;
}

.obs-toggle-btn:hover {
  background: var(--gray-200);
}

.obs-toggle-btn i {
  font-size: var(--font-xs);
}

.order-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.38);
  border: 1px solid rgba(200, 160, 100, 0.22);
  border-radius: 4px;
  padding: 2px 6px;
  width: 100%;
  box-sizing: border-box;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.order-card-label {
  font-size: 11px;
  font-weight: 500;
  color: #8a6a40;
  letter-spacing: 0.1px;
}

.order-card-value {
  font-size: 12px;
  font-weight: 700;
  color: #3a2a10;
}

.order-card-icon i {
  font-size: 10px;
  color: #b8916a;
}

.order-summary-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-top: var(--space-xs);
  overflow-y: auto;
  min-height: 0;
}

/* ── ORDEM DE VENDA — Estilo lista recibo (variáveis conforme responsividade) ── */

.order-summary-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-top: var(--space-xs);
  overflow-y: auto;
  min-height: 0;
  position: relative;
}

/* Fundo papel cartolina com bordas serrilhadas — só no corpo dos totais */
.order-summary-content::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 0;
  background-color: #f5f5f5;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 3px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 5px,
      rgba(0, 0, 0, 0.02) 5px,
      rgba(0, 0, 0, 0.02) 6px
    ),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.10'/%3E%3C/svg%3E"),
    radial-gradient(ellipse at 25% 15%, rgba(255, 255, 255, 0.55) 0%, transparent 55%),
    radial-gradient(ellipse at 80% 85%, rgba(190, 190, 190, 0.2) 0%, transparent 50%);

  --scallop-size: 12px;
  --scallop-radius: 5px;
  mask-image:
    radial-gradient(circle at center top, transparent var(--scallop-radius), black calc(var(--scallop-radius) + 0.5px)),
    radial-gradient(circle at center bottom, transparent var(--scallop-radius), black calc(var(--scallop-radius) + 0.5px));
  mask-size: var(--scallop-size) 100%;
  mask-repeat: repeat-x;
  mask-composite: intersect;
  -webkit-mask-image:
    radial-gradient(circle at center top, transparent var(--scallop-radius), black calc(var(--scallop-radius) + 0.5px)),
    radial-gradient(circle at center bottom, transparent var(--scallop-radius), black calc(var(--scallop-radius) + 0.5px));
  -webkit-mask-size: var(--scallop-size) 100%;
  -webkit-mask-repeat: repeat-x;
  -webkit-mask-composite: source-in;

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    inset 0 -1px 0 rgba(180, 180, 180, 0.25),
    0 2px 8px rgba(0, 0, 0, 0.07);
}

.order-summary-content > * {
  position: relative;
  z-index: 1;
}

/* Linha genérica */
.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--gray-200);
  gap: var(--space-lg);
  min-height: 0;
}

.order-row:last-child {
  border-bottom: none;
}

/* Label (esquerda) */
.order-row-label {
  font-size: var(--font-sm);
  font-weight: 400;
  color: var(--gray-500);
  white-space: nowrap;
  letter-spacing: 0.1px;
  flex-shrink: 0;
}

/* Valor (direita) */
.order-row-value {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--gray-800);
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.2px;
}

/* Impostos — cor subtilmente distinta */
.order-row-value--tax {
  color: #e07b2e;
}

/* Retenção — cor subtilmente distinta */
.order-row-value--retention {
  color: var(--gray-500);
}

/* Separador antes do total */
.order-total-divider {
  height: 1px;
  background: var(--gray-300);
  margin: var(--space-xs) 0;
  flex-shrink: 0;
}

/* Linha de Total a pagar — destacada */
.order-row--total {
  border-bottom: none;
  padding: var(--space-md) 0 var(--space-xs);
}

.order-row--total .order-row-label {
  font-size: var(--font-sm);
  font-weight: 700;
  color: var(--gray-900);
}

.order-row--total .order-row-value {
  font-size: var(--font-base);
  font-weight: 800;
  color: var(--gray-900);
  letter-spacing: 0.3px;
}

.order-obs-view {
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--space-md);
  box-sizing: border-box;
  flex-shrink: 0;
}

.order-obs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-xs);
  flex-shrink: 0;
}

.order-obs-tabs {
  display: flex;
  gap: 0;
  border-radius: 4px;
  background: var(--gray-200);
  padding: var(--space-xs);
  width: 100%;
}
.order-obs-tab {
  flex: 1;
  min-width: 0;
  padding: var(--space-xs) var(--space-md);
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--gray-500);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.order-obs-tab:hover {
  color: var(--gray-700);
}
.order-obs-tab.active {
  background: #fff;
  color: var(--color-selection);
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}
.order-obs-tab.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
.obs-tab-lock-icon {
  margin-left: var(--space-sm);
  font-size: var(--font-xs);
}

.obs-back-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: transparent;
  border: none;
  border-radius: 4px;
  padding: var(--space-xs) var(--space-md);
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--gray-500);
  cursor: pointer;
  transition: background 0.2s ease;
}

.obs-back-btn:hover {
  background: var(--gray-200);
}

.obs-back-btn i {
  font-size: var(--font-xs);
}

.order-obs-body-wrapper {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  overflow: hidden;
  position: relative;
  background: var(--gray-50);
  border-radius: 4px;
}

.order-obs-inner-track {
  display: flex;
  width: 200%;
  height: 100%;
  transform: translateX(0);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  will-change: transform;
}

.order-obs-body-wrapper .order-obs-inner-track.show-desc {
  transform: translateX(-50%);
}

.order-obs-panel {
  width: 50%;
  min-width: 0;
  max-width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 var(--space-md) var(--space-md) 0;
  box-sizing: border-box;
  flex-shrink: 0;
  overflow: hidden;
}

.order-desc-panel {
  width: 50%;
  min-width: 0;
  max-width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 0 var(--space-lg) var(--space-lg);
  box-sizing: border-box;
  flex-shrink: 0;
  overflow: hidden;
}

.order-obs-panel .order-obs-content,
.order-obs-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-top: var(--space-md);
  min-height: 0;
}

.obs-textarea {
  flex: 1;
  width: 100%;
  padding: var(--space-md);
  border: 1px solid var(--gray-300);
  border-radius: 4px;
  font-size: var(--font-xs);
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
  min-height: 0;
}

.obs-textarea:focus {
  border-color: var(--color-selection);
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.obs-textarea::placeholder {
  color: #aaa;
  font-style: italic;
}

.obs-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-selection);
  border: none;
  border-radius: 4px;
  font-size: var(--font-xs);
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.obs-submit-btn:hover {
  opacity: 0.9;
}

.order-desc-panel .order-desc-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-top: var(--space-md);
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
.order-desc-label {
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--gray-500);
  margin: 0;
}
.order-desc-input {
  width: 100%;
  min-width: 0;
  padding: var(--space-md) var(--space-xl);
  border: 1px solid var(--gray-300);
  border-radius: 4px;
  font-size: var(--font-sm);
  font-weight: 600;
  font-family: inherit;
  color: var(--gray-900);
  background-color: #fff;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  text-align: center;
}
.order-desc-input:focus {
  outline: none !important;
  border: 1px solid #111 !important;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1) !important;
  caret-color: #111;
}
.order-desc-input::placeholder {
  color: #888;
}
.order-desc-apply-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: var(--gray-900);
  border: 1px solid var(--gray-900);
  border-radius: 4px;
  font-size: var(--font-xs);
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}
.order-desc-apply-btn:hover {
  opacity: 0.9;
  background: var(--gray-700);
}

@media (max-width: 1155px) {
  .order-obs-header {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
  .obs-back-btn {
    order: -1;
    width: 100%;
    justify-content: center;
  }
  .order-obs-tabs {
    order: 0;
    width: 100%;
    justify-content: center;
  }
}


<!-- ========== FIM: components/cart-footer.css ========== -->

---

<!-- ========== INÍCIO: components/cart.css ========== -->

## components/cart.css
/* ================================================
   COMPONENTE: Cart
   Ficheiro: assets/css/components/cart.css
   Parte do sistema Dash-POS
   ================================================ */

.cart-products-area{ flex:1; overflow-y:auto; padding:12px; position:relative; -webkit-overflow-scrolling:touch; }
.cart-empty-state{ display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; color:var(--muted); }
.empty-icon{ font-size:40px; margin-bottom:10px; color:var(--accent); opacity:0.3; }
.cart-empty-state h3{ font-size: 13px; margin:0 0 2px; color:var(--text); }
.cart-empty-state p{ font-size: 10px; margin:0; }
.empty-decoration{ display:flex; gap:5px; margin-top:12px; }
.decoration-circle{ width:6px; height:6px; border-radius:50%; background:var(--line); }
.cart-list-new{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.cart-item{ display:grid; grid-template-columns: 1fr auto; gap:6px; align-items:center; padding:8px; border:1px solid var(--line); border-radius:12px; background:#fff; }
.cart-item .title{ font-weight:600; font-size: 12px; color:var(--text); }
.cart-item .meta{ color:var(--muted); font-size: 10px; }
.cart-item .right{ display:flex; align-items:center; gap:6px; }
.cart-item .adjust-price{ cursor: pointer; padding: 2px 6px; font-size: 10px; background: #f1edff; color: var(--accent); border: 1px solid #e6edf6; border-radius: 6px; }
.iconbtn{ width: clamp(24px, 2.2vw, 30px); height: clamp(24px, 2.2vw, 30px); display:grid; place-items:center; border-radius:6px; border:0; cursor:pointer; background:#f3f4fa; font-weight:600; font-size: var(--font-base); }
.iconbtn.del{ background:#ffefef; color:#cc2a2a; }

/* util / controls */
.iconbtn{ font-weight:600; border:0; cursor:pointer; }
.qtybtn{ width: clamp(26px, 2.5vw, 32px); height: clamp(26px, 2.5vw, 32px); border-radius:8px; border:0; background:#f3f4fa; cursor:pointer; font-size: var(--font-lg); font-weight:600; }
.qtybtn.plus{ background:#f1edff; color:var(--accent); }

/* CABEÇALHO DO CARRINHO */
.cart-header {
  background: #ffffff;
  padding: 6px 8px;
  width: 100%;
  box-sizing: border-box;
  flex: none;
}

.cart-header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

/* Botão Voltar: visível apenas no bottom sheet (estilos em responsive.css @ 905px) */
.cart-sheet-back-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-clear-cart {
  margin-left: auto;
  background: transparent;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.15s;
  font-size: 11px;
}

.btn-clear-cart:hover {
  background: #fef2f2;
  color: #dc2626;
  transform: translateY(-1px);
}

/* CORPO DO CARRINHO */
.cart-body {
  flex: 48;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.cart-body:has(.cart-empty-state:not([style*="display: none"])) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 24px;
  opacity: 0.6;
}

.cart-empty-state .empty-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.cart-empty-state .empty-icon i {
  font-size: 36px;
  color: #9ca3af;
}

.cart-empty-state .empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #4b5563;
  margin: 0 0 8px 0;
}

.cart-empty-state .empty-message {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.cart-products-container {
  width: 100%;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
}

/* Wrapper que contém painel + área de conteúdo */
.cart-body-wrapper {
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cart-content-area {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.4s cubic-bezier(0.4, 0.0, 0.2, 1),
              margin-left 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.cart-content-area:has(.cart-empty-state:not([style*="display: none"])) {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* CARRINHO - EMPTY STATE (alternativo) */
.cart-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--muted);
}

.cart-empty-state .empty-icon {
  font-size: 48px;
  color: #e5e7eb;
  margin-bottom: 12px;
}

.cart-empty-state p {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #6b7280;
}

.cart-empty-state small {
  font-size: 12px;
  color: #9ca3af;
}

/* CARRINHO - LISTA DE ITENS */
.cart-items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-right: 4px;
  max-height: 280px;
}

.cart-item-new {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.15s;
}

.cart-item-new:hover {
  background: #f3f4f6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.cart-item-info {
  flex: 1;
  min-width: 0;
}

.cart-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-item-details {
  font-size: 11px;
  color: #6b7280;
}

.cart-item-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn-small {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  transition: all 0.15s;
}

.qty-btn-small:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.qty-display-small {
  min-width: 30px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  color: #374151;
}

.btn-remove-item {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  cursor: pointer;
  color: #dc2626;
  font-size: 14px;
  transition: all 0.15s;
}

.btn-remove-item:hover {
  background: #fee2e2;
  transform: scale(1.05);
}

/* Card de produto no carrinho - Estado base */
.cart-product-card {
  background: #e8e8e8;
  border-radius: 6px;
  padding: 8px 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  min-height: 28px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.cart-product-card .card-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.cart-product-card .expand-arrow {
  font-size: 10px;
  color: #666;
  transition: transform 0.3s ease;
  flex-shrink: 0;
  width: 14px;
  text-align: center;
}

.cart-product-card .product-quantity {
  font-size: 12px;
  font-weight: 700;
  color: #333;
  flex-shrink: 0;
  min-width: 20px;
}

.cart-product-card .quantity-separator {
  font-size: 11px;
  color: #666;
  flex-shrink: 0;
}

.cart-product-card .product-name {
  font-size: 11px;
  color: #333;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.cart-product-card .product-total-price {
  font-size: 11px;
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
  margin-left: auto;
}

.cart-product-card .btn-remove {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #333;
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  padding: 0;
  text-align: center;
  transition: background 0.2s ease;
  font-family: Arial, sans-serif;
}

.cart-product-card .btn-remove:hover {
  background: #000;
}

.cart-product-card .card-expanded-area {
  display: none;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #ddd;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.cart-product-card.expanded {
  border-color: #999;
}

.cart-product-card.expanded .expand-arrow {
  transform: rotate(90deg);
}

.cart-product-card.expanded .card-expanded-area {
  display: block;
}

.card-expanded-area .inputs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.input-field {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.input-field label {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 9px;
  font-weight: normal;
  color: #6B7280;
  pointer-events: none;
  z-index: 1;
  white-space: nowrap;
}

.input-field input {
  width: 100%;
  height: 38px;
  padding: 14px 4px 4px 4px;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  text-align: center;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  min-width: 0;
}

.input-field input:focus {
  outline: none;
}

.input-field:first-child input {
  background: #FFFFFF;
  border: 1px solid var(--color-selection);
  color: var(--color-selection);
  font-weight: bold;
}

.input-field:first-child input:focus {
  border-color: var(--color-selection);
  box-shadow: 0 0 0 3px rgba(34, 34, 34, 0.1);
}

.input-field:last-child input {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  color: #9CA3AF;
  font-weight: 300;
  cursor: not-allowed;
}

.input-field:last-child input:not([readonly]) {
  color: #374151;
  font-weight: bold;
  cursor: text;
}

.input-field:last-child input:focus {
  border-color: #E5E7EB;
}


<!-- ========== FIM: components/cart.css ========== -->

---

<!-- ========== INÍCIO: components/categories.css ========== -->

## components/categories.css
/* ================================================
   COMPONENTE: Categories
   Ficheiro: assets/css/components/categories.css
   Parte do sistema Dash-POS
   ================================================ */

.category-bar{
  margin: var(--space-md) 0 var(--space-md);
  padding: 0 var(--space-xl);
  position:relative;
}

.cat-slider{
  position:relative;
}

.cat-viewport{
  overflow-x:hidden;
  overflow-y:visible;
  -ms-overflow-style: none;
  scrollbar-width: none;
  scroll-behavior:smooth;
  scroll-snap-type: x proximity;
}
.cat-viewport::-webkit-scrollbar{ display:none; }

.cat-track{
  display:flex;
  flex-wrap:nowrap;
  gap: var(--space-sm);
  padding:0;
}

.category{
  flex:0 0 auto;
  display:flex;
  align-items:center;
  justify-content:center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  border:1px solid #f5f5f5;
  background:#f5f5f5;
  border-radius:8px;
  cursor:pointer;
  transition: all 0.15s ease;
  scroll-snap-align: start;
}

.category:hover {
  background:#ececec;
  border-color:#ececec;
}

.category.is-active {
  background:var(--color-selection);
  border-color:var(--color-selection);
}

.category .cat-name {
  font-size: var(--font-base);
  font-weight: 500;
  color: #444;
  white-space: nowrap;
}

.category.is-active .cat-name {
  color: #fff;
  font-weight: 600;
}

.category .cat-count {
  font-size: var(--font-sm);
  font-weight: 600;
  color: #888;
  background: rgba(0,0,0,0.06);
  padding: clamp(2px, 0.2vw, 4px) var(--space-sm);
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.category.is-active .cat-count {
  color: var(--color-selection);
  background: #fff;
}

.cat-arrow{
  position:absolute;
  top:50%;
  transform:translateY(-50%);
  width:32px;
  height:32px;
  border-radius:999px;
  border:1px solid var(--line);
  background:#fff;
  box-shadow: var(--shadow);
  display:grid;
  place-items:center;
  cursor:pointer;
  z-index:2;
  user-select:none;
}
.cat-arrow.prev{ left:10px; }
.cat-arrow.next{ right:10px; }
.cat-arrow[disabled]{ opacity:.35; pointer-events:none; }

.category-bar.has-left-shadow .cat-viewport{
  mask-image: linear-gradient(90deg, rgba(0,0,0,0) 0, rgba(0,0,0,1) 22px);
  -webkit-mask-image: linear-gradient(90deg, rgba(0,0,0,0) 0, rgba(0,0,0,1) 22px);
}
.category-bar.has-right-shadow .cat-viewport{
  mask-image: linear-gradient(270deg, rgba(0,0,0,0) 0, rgba(0,0,0,1) 22px);
  -webkit-mask-image: linear-gradient(270deg, rgba(0,0,0,0) 0, rgba(0,0,0,1) 22px);
}
.category-bar.has-left-shadow.has-right-shadow .cat-viewport{
  mask-image: linear-gradient(90deg, rgba(0,0,0,0) 0 20px, rgba(0,0,0,1) 40px calc(100% - 40px), rgba(0,0,0,0) calc(100% - 20px) 100%);
  -webkit-mask-image: linear-gradient(90deg, rgba(0,0,0,0) 0 20px, rgba(0,0,0,1) 40px calc(100% - 40px), rgba(0,0,0,0) calc(100% - 20px) 100%);
}


<!-- ========== FIM: components/categories.css ========== -->

---

<!-- ========== INÍCIO: components/client-panel.css ========== -->

## components/client-panel.css
/* ================================================
   COMPONENTE: Client Panel
   Ficheiro: assets/css/components/client-panel.css
   Parte do sistema Dash-POS
   ================================================ */

/* Painel Cliente Slider */
.client-panel-slider {
  width: 400px;
  min-width: 400px;
  height: 100%;
  background: #F1F3F5;
  border-left: 1px solid var(--line);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
  position: absolute;
  right: 0;
  top: 0;
  z-index: 10;
}

.client-panel-slider.active {
  transform: translateX(0);
}

.products-container-wrapper.panel-open .product-grid {
  margin-right: 400px;
}

.panel-header-slider {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: #F1F3F5;
  flex-shrink: 0;
}

.panel-header-slider h3 {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-2);
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  opacity: 0.8;
}

.panel-header-slider h3 i {
  font-size: 9px;
  color: var(--text-2);
  opacity: 0.6;
}

.panel-close-slider {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;
  opacity: 0.5;
}

.panel-close-slider:hover {
  background: var(--line);
  color: var(--text-1);
  opacity: 1;
}

.panel-body-slider {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-body-slider::-webkit-scrollbar {
  width: 6px;
}

.panel-body-slider::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.panel-body-slider::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.panel-body-slider::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.client-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.client-section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.section-title {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #475569;
  margin: 0;
  padding: 0 2px;
  line-height: 1.5;
}

.section-title strong {
  font-weight: 800;
  color: #334155;
}

.client-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #FFFFFF;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 10px;
  border: 1px solid #E5E7EB;
}

.client-card:hover {
  background: #ebebeb;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.client-card.active {
  border: 1px solid #000000;
}

.client-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.client-card-name {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  line-height: 1.2;
}

.client-card-details {
  font-size: var(--font-sm);
  color: var(--gray-500);
  line-height: 1.4;
  font-weight: 400;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: center;
}

.client-card-details span {
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  vertical-align: middle;
}

.client-card-details i {
  font-size: calc(var(--font-sm) - 2px);
  color: #CBCBCB;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  line-height: 1;
}

.client-card-indicator {
  flex-shrink: 0;
  font-size: var(--font-lg);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.client-card:not(.active) .client-card-indicator {
  display: none;
}

.client-search-wrapper {
  width: 100%;
}

.client-search-input {
  width: 100%;
  padding: 7px 11px;
  background: #ffffff;
  border: 1px solid #cbd5e1 !important;
  border-radius: 6px !important;
  font-size: 11px;
  color: #334155;
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.client-search-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
  font-size: 11px;
}

.client-search-input:focus {
  border-color: #94a3b8 !important;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1) !important;
  border-radius: 6px !important;
}

.client-list-results {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.client-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.client-form-input {
  width: 100%;
  padding: 7px 11px;
  background: #ffffff;
  border: 1px solid #cbd5e1 !important;
  border-radius: 6px !important;
  font-size: 11px;
  color: #334155;
  outline: none;
  box-sizing: border-box;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.client-form-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
  font-size: 10px;
}

.client-form-input:focus {
  border-color: #94a3b8 !important;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1) !important;
  border-radius: 6px !important;
}

.client-form-input[required]::placeholder {
  color: #94a3b8;
}

.client-form-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-lg) var(--space-xl);
  background: var(--color-selection);
  border: none;
  border-radius: 4px;
  font-size: var(--font-sm);
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.client-form-submit:hover {
  opacity: 0.9;
}

/* LISTA DE CLIENTES */
.client-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.client-item {
  padding: 14px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.client-item:hover {
  background: #f3f4f6;
  border-color: var(--accent);
  transform: translateX(4px);
}

.client-item.selected {
  background: #eff6ff;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
}

.client-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.client-details {
  font-size: 12px;
  color: #6b7280;
}

.btn-new-client {
  width: 100%;
  padding: 12px;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.15s;
  margin-bottom: 20px;
}

.btn-new-client:hover {
  background: var(--accent-2);
  transform: translateY(-1px);
}

.new-client-form {
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.new-client-form h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.new-client-form input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 10px;
  background: #fff;
}

.new-client-form input:focus {
  outline: none;
  border-color: var(--accent);
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-save {
  background: var(--color-primary);
  color: var(--color-selection);
}

.btn-save:hover {
  background: var(--color-primary-hover);
}


<!-- ========== FIM: components/client-panel.css ========== -->

---

<!-- ========== INÍCIO: components/header.css ========== -->
/* ================================================
   COMPONENTE: Header
   Ficheiro: assets/css/components/header.css
   Parte do sistema Dash-POS
   ================================================ */

/* main-header (sticky) */
.main-header{
  position:sticky;
  top:0;
  left:0;
  right:0;
  width:100%;
  z-index:60;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
  border-radius:0;
  box-shadow: var(--shadow);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(235,232,255,0.6);
}
.main-header-left{ display:flex; gap: var(--space-lg); align-items:center; }
.main-header-right{ display:flex; gap: var(--space-lg); align-items:center; }

/* main nav */
.main .main-nav{
  display:flex;
  gap: var(--space-md);
  align-items:center;
  flex-wrap:wrap;
}
.main .main-nav .nav-link{
  border:0;
  background:transparent;
  padding: var(--space-md) var(--space-lg);
  border-radius:12px;
  color:var(--muted);
  cursor:pointer;
  font-weight:600;
  font-size: var(--font-lg);
  transition: all .12s ease;
  display:inline-flex;
  align-items:center;
  gap: var(--space-sm);
}
.main .main-nav .nav-link:hover{
  background:#f6f5ff;
  color:var(--accent);
  transform:translateY(-1px);
  box-shadow: var(--shadow-strong);
}
.main .main-nav .nav-link.is-active{
  color:#fff;
  background: var(--color-selection);
  box-shadow: 0 8px 20px rgba(34, 34, 34, 0.18);
  font-size: var(--font-lg);
}

/* buttons / user */
#newOrderBtn{ padding: var(--space-md) var(--space-lg); border-radius:12px; font-weight:600; font-size: var(--font-lg); box-shadow: 0 8px 24px rgba(108,92,231,0.12); border:0; cursor:pointer; }
.date-time{ color:var(--muted); font-size: var(--font-sm); white-space:nowrap; min-width:120px; text-align:right; }
.user{ display:flex; align-items:center; gap: var(--space-md); }
.avatar{ width: clamp(24px, 2.5vw, 32px); height: clamp(24px, 2.5vw, 32px); border-radius:50%; display:grid; place-items:center; background:#f0f1f6; color:#5b5e72; font-weight:600; font-size: var(--font-base); }
.user-info{ display:flex; flex-direction:column; line-height:1; }
.user-info strong{ font-size: var(--font-sm); font-weight:600; }
.user-info span{ font-size: var(--font-xs); color:var(--muted); }

<!-- ========== FIM: components/header.css ========== -->

---

<!-- ========== INÍCIO: components/invoice-type.css ========== -->
/* ================================================
   COMPONENTE: Invoice Type
   Ficheiro: assets/css/components/invoice-type.css
   Parte do sistema Dash-POS
   ================================================ */

/* Invoice Format Selection */
.invoice-format-selection {
  transition: all 0.3s ease;
}

.invoice-format-selection .format-options {
  background: #f8f9ff;
  border-left: 3px solid var(--accent);
}

.invoice-format-selection .format-option label {
  transition: all 0.2s ease;
}

.invoice-format-selection .format-option label:hover {
  color: var(--accent);
}

.invoice-format-selection input[type="radio"] {
  accent-color: var(--accent);
}

/* SELETOR DE TIPO DE FATURA */
.invoice-type-selector {
  padding: 12px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border-bottom: 1px solid var(--line);
}

.invoice-type-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}

.invoice-type-header i {
  color: var(--accent);
  font-size: 14px;
}

.invoice-type-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.invoice-radio-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #fff;
  border: 1.5px solid #e6edf6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.invoice-radio-option:hover {
  border-color: var(--accent);
  background: #f8f9ff;
  transform: translateX(2px);
}

.invoice-radio-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.invoice-radio-option input[type="radio"]:checked + .radio-custom {
  border-color: var(--accent) !important;
  background: var(--accent) !important;
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1) !important;
}

.invoice-radio-option input[type="radio"]:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: #fff !important;
  border-radius: 50%;
}

.radio-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text);
  user-select: none;
}

.invoice-radio-option input[type="radio"]:checked ~ .radio-label {
  font-weight: 600 !important;
  color: var(--accent) !important;
}

.invoice-radio-option input[type="radio"]:checked {
  animation: radioSelect 0.3s ease;
}

@keyframes radioSelect {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* PAINEL TIPO DE DOCUMENTO (SLIDER ESQUERDA) */
.doc-type-panel-slider {
  width: 0;
  min-width: 0;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid var(--line);
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.4, 0.0, 0.2, 1),
              min-width 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
  flex-shrink: 0;
}

.doc-type-panel-slider.active {
  width: 35%;
  min-width: 35%;
}

.cart-body-wrapper.doc-panel-open .cart-content-area {
  width: 65%;
}

/* OPÇÕES DE TIPO DE FATURA (TOGGLES) */
.invoice-type-options-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: clamp(0.5rem, 0.4vw + 0.35rem, 0.875rem) clamp(0.375rem, 0.3vw + 0.25rem, 0.625rem);
  background: #ffffff;
  height: 100%;
  overflow-y: auto;
}

.invoice-option-group {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #f0f0f0;
}

.invoice-option-group:last-child {
  border-bottom: none;
}

.invoice-toggle-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(0.5rem, 0.4vw + 0.35rem, 0.875rem) clamp(0.5rem, 0.3vw + 0.4rem, 0.75rem);
  cursor: pointer;
  transition: background 0.2s ease;
  user-select: none;
}

.invoice-toggle-option:hover {
  background: #fafafa;
}

.invoice-toggle-option.active {
  background: #FFF8F3;
}

.toggle-label {
  font-size: clamp(0.5rem, 0.25vw + 0.4rem, 0.75rem);
  font-weight: 500;
  color: #555555;
  order: 1;
}

.invoice-toggle-option.active .toggle-label {
  color: #8B5A2B;
  font-weight: 600;
}

.toggle-switch-container {
  position: relative;
  width: clamp(1.5rem, 0.5vw + 1.1rem, 2rem);
  height: clamp(0.75rem, 0.25vw + 0.55rem, 1rem);
  flex-shrink: 0;
  order: 2;
}

.toggle-switch-container input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggle-switch-visual {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d4d4d4;
  transition: all 0.3s ease;
  border-radius: 1rem;
}

.toggle-switch-visual::before {
  position: absolute;
  content: "";
  height: clamp(0.5rem, 0.2vw + 0.38rem, 0.75rem);
  width: clamp(0.5rem, 0.2vw + 0.38rem, 0.75rem);
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: all 0.3s ease;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.invoice-toggle-option.active .toggle-switch-visual {
  background-color: #FFCBA4;
}

.invoice-toggle-option.active .toggle-switch-visual::before {
  transform: translateX(calc(100% + 2px));
}

/* SUB-OPÇÕES DE FORMATO (A4 / 80mm) */
.format-sub-options {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 16px;
  background: #FDFCFB;
  border-top: 1px solid #f0f0f0;
  overflow: hidden;
  max-height: 100px;
  opacity: 1;
  transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
}

.invoice-option-group:not(:has(.invoice-toggle-option.active)) .format-sub-options {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-top: none;
}

.format-toggle-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(0.375rem, 0.3vw + 0.25rem, 0.625rem) clamp(0.5rem, 0.3vw + 0.4rem, 0.75rem);
  cursor: pointer;
  transition: background 0.2s ease;
  user-select: none;
}

.format-toggle-option:hover {
  background: #f9f9f9;
}

.format-toggle-option.active {
  background: #FFF5EE;
}

.format-label {
  font-size: clamp(0.45rem, 0.2vw + 0.35rem, 0.65rem);
  font-weight: 500;
  color: #777777;
  order: 1;
}

.format-toggle-option.active .format-label {
  color: #8B5A2B;
  font-weight: 600;
}

.format-switch-container {
  position: relative;
  width: clamp(1.2rem, 0.4vw + 0.9rem, 1.6rem);
  height: clamp(0.6rem, 0.2vw + 0.45rem, 0.8rem);
  flex-shrink: 0;
  order: 2;
}

.format-switch-container input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.format-switch-visual {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d4d4d4;
  transition: all 0.3s ease;
  border-radius: 1rem;
}

.format-switch-visual::before {
  position: absolute;
  content: "";
  height: clamp(0.4rem, 0.15vw + 0.3rem, 0.55rem);
  width: clamp(0.4rem, 0.15vw + 0.3rem, 0.55rem);
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: all 0.3s ease;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.format-toggle-option.active .format-switch-visual {
  background-color: #FFCBA4;
}

.format-toggle-option.active .format-switch-visual::before {
  transform: translateX(calc(100% + 2px));
}

/* doc-type-item */
.doc-type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
}

.doc-type-item:hover { background: #f0f0f0; }
.doc-type-item.active {
  background: #f0f8ff;
  border-color: #000000;
}

.doc-type-item i:first-child { font-size: 24px; color: #666; }
.doc-type-item span { flex: 1; font-size: 14px; font-weight: 600; color: #111; }
.doc-type-check { font-size: 18px; color: #000000; opacity: 0; transition: opacity 0.2s ease; }
.doc-type-item.active .doc-type-check { opacity: 1; }

@media (max-width: 1200px) {
  .doc-type-panel-slider.active {
    width: 40%;
    min-width: 40%;
  }

  .cart-body-wrapper.doc-panel-open .cart-content-area {
    width: 60%;
  }
}

@media (max-width: 992px) {
  .doc-type-panel-slider.active {
    width: 45%;
    min-width: 45%;
  }

  .cart-body-wrapper.doc-panel-open .cart-content-area {
    width: 55%;
  }
}


<!-- ========== FIM: components/invoice-type.css ========== -->

---

<!-- ========== INÍCIO: components/keypad.css ========== -->
/* ================================================
   COMPONENTE: Keypad
   Ficheiro: assets/css/components/keypad.css
   Parte do sistema Dash-POS
   ================================================ */

.footer-keypad {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2px;
  box-sizing: border-box;
  gap: 2px;
}

.keypad-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 2px;
  min-height: 0;
}

.keypad-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: var(--font-base);
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: background 0.1s ease, border-color 0.1s ease;
  font-family: inherit;
  padding: 0;
  margin: 0;
  min-height: 0;
  min-width: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.keypad-btn:hover {
  background: #e8e8e8;
}

.keypad-btn:active {
  background: #ddd;
}

.keypad-btn.keypad-clear {
  background: #ffebee;
  color: #c62828;
  border-color: #ffcdd2;
}

.keypad-btn.keypad-clear:hover {
  background: #ffcdd2;
}

.keypad-btn.keypad-backspace {
  background: #fff3e0;
  color: #e65100;
  border-color: #ffe0b2;
}

.keypad-btn.keypad-backspace:hover {
  background: #ffe0b2;
}

.keypad-split-cell {
  display: flex;
  gap: 2px;
  min-height: 0;
  min-width: 0;
}

.keypad-split-cell .keypad-btn {
  flex: 1;
  font-size: 10px;
}

.keypad-pay-btn {
  width: 100%;
  height: clamp(42px, 4.5vw, 52px);
  min-height: clamp(42px, 4.5vw, 52px);
  flex-shrink: 0;
  background: var(--color-selection);
  border: none;
  border-radius: 6px;
  font-size: var(--font-lg);
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s ease;
  font-family: inherit;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.keypad-pay-btn:hover {
  opacity: 0.9;
}

.keypad-final-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2px;
  margin-top: 2px;
}

.keypad-exact-btn {
  background: #dcfce7;
  border: 1px solid #86efac;
  border-radius: 6px;
  font-size: var(--font-base);
  font-weight: 700;
  color: #15803d;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  font-family: inherit;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.keypad-exact-btn:hover {
  background: #bbf7d0;
  border-color: #4ade80;
}

.keypad-exact-btn:active {
  background: #86efac;
}

.keypad-exact-btn--inline {
  display: none;
}


<!-- ========== FIM: components/keypad.css ========== -->

---

<!-- ========== INÍCIO: components/modals.css ========== -->

## components/modals.css
/* ================================================
   COMPONENTE: Modals
   Ficheiro: assets/css/components/modals.css
   Parte do sistema Dash-POS
   ================================================ */

.panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  z-index: 1999;
}

.panel-overlay.active {
  opacity: 1;
  pointer-events: all;
}

.fade-enter-confirm-dialog {
  opacity: 0;
  transform: scale(0.97);
}

.fade-enter-active-confirm-dialog {
  opacity: 1;
  transform: scale(1);
  transition: all 0.25s ease;
}

.fade-exit-confirm-dialog {
  opacity: 1;
  transform: scale(1);
}

.fade-exit-active-confirm-dialog {
  opacity: 0;
  transform: scale(0.97);
  transition: all 0.2s ease;
}

#overlay-confirm-dialog {
  backdrop-filter: blur(1px);
  transition: opacity 0.3s ease;
}

#box-confirm-dialog {
  transition: all 0.25s ease;
  will-change: transform, opacity;
}

body.overflow-hidden {
  overflow: hidden;
}

#cancel-confirm-dialog {
  transition: background-color 0.2s ease, color 0.2s ease;
}

#confirm-confirm-dialog {
  transition: background-color 0.2s ease, color 0.2s ease;
}

#box-confirm-dialog .bg-blue-100 {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

#clearCart.btn.light {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border: none;
  border-radius: 10px;
  background: #f3f4fa;
  color: var(--warn);
  font-size: var(--font-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all .15s ease;
  box-shadow: var(--shadow);
}

#clearCart.btn.light:hover {
  background: #ffefef;
  color: #cc2a2a;
  transform: translateY(-1px);
  box-shadow: var(--shadow-strong);
}

#clearCart.btn.light:active {
  transform: translateY(0);
}


<!-- ========== FIM: components/modals.css ========== -->

---

<!-- ========== INÍCIO: components/payment-methods.css ========== -->

## components/payment-methods.css
/* ================================================
   COMPONENTE: Payment Methods
   Ficheiro: assets/css/components/payment-methods.css
   Parte do sistema Dash-POS
   ================================================ */

/* LEGACY - verificar uso */
.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.payment-method-btn {
  padding: 12px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-align: center;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.payment-method-btn i {
  font-size: 18px;
  color: var(--accent);
}

.payment-method-btn:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.payment-method-btn.active {
  background: #eff6ff;
  border-color: var(--accent);
  color: var(--accent);
}

.payment-display {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 12px;
}

.payment-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payment-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.payment-methods {
  display: none;
}


<!-- ========== FIM: components/payment-methods.css ========== -->

---

<!-- ========== INÍCIO: components/product-card.css ========== -->

## components/product-card.css
/* ================================================
   COMPONENTE: Product Card
   Ficheiro: assets/css/components/product-card.css
   Parte do sistema Dash-POS
   ================================================ */

/* PRODUCT GRID */
.product-grid{
  display:grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fill, minmax(clamp(130px, 28vw, 175px), 1fr));
  padding: 0 var(--space-xl) var(--space-xl);
  flex:1;
  overflow-y:auto;
  overflow-x:hidden;
  -webkit-overflow-scrolling:touch;
  align-content:start;
}

/* CARD BASE */
.card {
  background: white;
  border-radius: 14px;
  overflow: visible;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  position: relative;
  border: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.card:hover {
  box-shadow: 0 6px 20px rgba(34, 34, 34, 0.15);
  transform: translateY(-2px);
  border-color: var(--color-selection);
}

.card-image {
  width: 100%;
  height: 130px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s;
  border-radius: 14px 14px 0 0;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-image-placeholder {
  font-size: 2.8em;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
  z-index: 1;
  user-select: none;
}

.overlay-blur {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 130px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 5;
  border-radius: 14px 14px 0 0;
}

.card.is-selected .overlay-blur {
  opacity: 1;
  pointer-events: all;
}

.card.is-selected {
  border: 2px solid var(--color-selection);
  box-shadow: 0 8px 24px rgba(34, 34, 34, 0.15);
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  background: rgba(255, 255, 255, 0.98);
  padding: var(--space-md) var(--space-lg);
  border-radius: 25px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  border: 1px solid rgba(0,0,0,0.05);
}

.quantity-btn {
  width:  clamp(26px, 2.5vw, 32px);
  height: clamp(26px, 2.5vw, 32px);
  background: var(--color-selection);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.1em;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-btn:hover {
  background: #1a252f;
  transform: scale(1.1);
}

.quantity-btn:active {
  transform: scale(0.95);
}

.quantity-display {
  font-size: 1.2em;
  font-weight: 800;
  color: #2c3e50;
  min-width: 28px;
  text-align: center;
}

.card-content {
  padding: 12px;
  position: relative;
  z-index: 1;
  background: white;
  border-radius: 0 0 14px 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 0.85em;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  line-height: 1.3;
  height: 34px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color 0.3s;
}

.card.is-selected .card-title {
  color: #2c3e50;
  font-weight: 700;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.card-price {
  font-size: 1.05em;
  font-weight: 800;
  color: #6c757d;
  transition: color 0.3s;
}

.card.is-selected .card-price {
  color: #2c3e50;
}

.card-stock {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s;
}

.card-stock.available {
  background: #28a745;
}

.card-stock.low {
  background: #ff9800;
}

.card-stock.unavailable {
  background: #dc3545;
}

.card-stock.service {
  background: #667eea;
}

.card.is-selected .card-stock {
  width: 10px;
  height: 10px;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.card.is-selected .card-stock.available {
  background: #28a745;
}

.card.is-selected .card-stock.low {
  background: #ff9800;
}

.card.is-selected .card-stock.unavailable {
  background: #dc3545;
}

.card.is-selected .card-stock.service {
  background: #667eea;
}

.stock-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stock-quantity {
  font-size: 9px;
  color: #999;
  font-weight: 500;
  line-height: 1;
}

.card-quick-add {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width:  clamp(28px, 2.8vw, 36px);
  height: clamp(28px, 2.8vw, 36px);
  background: white;
  color: #495057;
  border: 1px solid #dee2e6;
  border-radius: 50%;
  font-size: 1.2em;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s;
  opacity: 0;
  transform: scale(0.8);
  z-index: 2;
}

.card:hover .card-quick-add {
  opacity: 1;
  transform: scale(1);
}

.card-quick-add:hover {
  background: #2c3e50;
  color: white;
  border-color: #2c3e50;
  transform: scale(1.05);
}

.card .thumb { display: none; }
.card .body { display: none; }
.controls { display: none; }

/* PRODUCTS CONTAINER WRAPPER (CARDS + PAINEL CLIENTE SLIDER) */
.products-container-wrapper {
  display: flex;
  position: relative;
  overflow: hidden;
  height: calc(100vh - 200px);
  gap: 0;
}

.product-grid {
  flex: 1;
  transition: flex 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
  overflow-y: auto;
  overflow-x: hidden;
}


<!-- ========== FIM: components/product-card.css ========== -->

---

<!-- ========== INÍCIO: components/search.css ========== -->

## components/search.css
/* ================================================
   COMPONENTE: Search
   Ficheiro: assets/css/components/search.css
   Parte do sistema Dash-POS
   ================================================ */

/* SEARCH BAR CONTAINER (Search + Cliente Button) */
.search-bar-container {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin: var(--space-lg) 0;
  padding: 0 var(--space-xl);
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.search-bar-container .search-bar-inner {
  flex: 1;
  min-width: 0;
}

/* Slot no header para search + toggle em mobile (≤905px); escondido quando vazio (desktop) */
.header-search-slot {
  display: none;
}

/* SEARCH WRAPPER WITH INLINE TOGGLE */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: var(--space-md) var(--space-lg);
  box-shadow: var(--shadow);
  gap: var(--space-md);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  flex: 1;
  min-width: 0;
}

.search-wrapper:focus-within {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-icon-left {
  color: #9aa0b4;
  font-size: var(--font-lg);
  flex-shrink: 0;
}

.search-wrapper input {
  flex: 1;
  border: 0;
  outline: 0;
  font-size: var(--font-lg);
  background: transparent;
  color: var(--text);
  padding: 0;
  min-width: 0;
  box-shadow: none !important;
}

.search-wrapper input:focus {
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
}

.search-wrapper input::placeholder {
  color: #9aa0b4;
}

/* Toggle inline (dentro do input) */
.barcode-toggle-inline {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  padding: var(--space-sm) var(--space-md);
  background: #fff;
  border: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  user-select: none;
  flex-shrink: 0;
}

.barcode-toggle-inline:hover {
  background: #f9fafb;
}

.barcode-toggle-inline.active {
  background: #fef3e8;
}

.barcode-toggle-inline input[type="checkbox"] {
  display: none;
}

.toggle-switch {
  position: relative;
  width: 30px;
  height: 16px;
  background: #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toggle-switch::before {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.barcode-toggle-inline input:checked + .toggle-switch {
  background: #E2852E;
}

.barcode-toggle-inline input:checked + .toggle-switch::before {
  transform: translateX(14px);
}

.toggle-label-short {
  font-size: var(--font-sm);
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
}

.barcode-toggle-inline.active .toggle-label-short {
  color: #E2852E;
}

.clear-btn {
  border: 0;
  background: transparent;
  font-size: clamp(16px, 1.6vw, 20px);
  color: #9aa0b4;
  cursor: pointer;
  padding: var(--space-xs) var(--space-sm);
  line-height: 1;
  border-radius: 4px;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.clear-btn:hover {
  background: #f3f4f6;
  color: #6b7280;
}

/* FEEDBACK VISUAL PARA CÓDIGO DE BARRAS NO SEARCH WRAPPER */
.search-wrapper.barcode-mode {
  border-color: #E2852E;
  box-shadow: 0 0 0 3px rgba(226, 133, 46, 0.1);
}

.search-wrapper.barcode-success {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.search-wrapper.barcode-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}


<!-- ========== FIM: components/search.css ========== -->

---

<!-- ========== INÍCIO: components/skeleton.css ========== -->

## components/skeleton.css
/* ================================================
   COMPONENTE: Skeleton
   Ficheiro: assets/css/components/skeleton.css
   Parte do sistema Dash-POS
   ================================================ */

/* Enhanced loading dots styling */
.keypad-pay-btn {
  letter-spacing: 0.15em;
  font-size: 1.1em;
}

/* Optional: Pulse animation for dots */
.keypad-pay-btn.loading {
  animation: pulse-dots 0.4s ease-in-out infinite;
}

@keyframes pulse-dots {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* SKELETON LOADING (estilo YouTube / Figma) */
.app-skeleton {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg);
  display: grid;
  grid-template-columns: 64% 36%;
  gap: 0;
  transition: opacity 0.4s ease, visibility 0.4s ease;
  pointer-events: auto;
}
.app-skeleton.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.skeleton-layout-main,
.skeleton-layout-side {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.skeleton-layout-main {
  padding: var(--space-lg) var(--space-xl) var(--space-xl);
}
.skeleton-layout-side {
  background: var(--card);
  border-left: 1px solid var(--line);
  padding: var(--space-lg);
}

/* Bloco cinza base + shimmer */
.skeleton-block {
  background: linear-gradient(
    90deg,
    var(--gray-200) 0%,
    var(--gray-100) 45%,
    var(--gray-200) 55%,
    var(--gray-200) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: 8px;
}
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Alturas/larguras comuns */
.skeleton-search { height: 44px; max-width: 100%; border-radius: 12px; }
.skeleton-pills { height: 36px; width: 100%; border-radius: 20px; margin-bottom: var(--space-lg); }
.skeleton-card { width: 100%; aspect-ratio: 1; border-radius: 12px; }
.skeleton-text-sm { height: 12px; width: 70%; border-radius: 4px; margin-top: var(--space-sm); }
.skeleton-text-xs { height: 10px; width: 50%; border-radius: 4px; margin-top: var(--space-xs); }
.skeleton-cart-header { height: 48px; width: 100%; border-radius: 8px; margin-bottom: var(--space-lg); }
.skeleton-cart-body { height: 120px; width: 100%; border-radius: 8px; margin-bottom: var(--space-lg); }
.skeleton-cart-footer-row { height: 40px; width: 100%; border-radius: 8px; margin-bottom: var(--space-md); }
.skeleton-cart-footer-btn { height: 48px; width: 100%; border-radius: 10px; }
.skeleton-mobile-btn { width: 56px; height: 56px; border-radius: 50%; }

/* Grid de cards skeleton (produtos) */
.skeleton-product-grid {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
  flex: 1;
  margin-top: var(--space-lg);
}
.skeleton-mobile-wrap {
  display: none;
  position: fixed;
  bottom: var(--space-xl);
  right: var(--space-xl);
  z-index: 10000;
}

<!-- ========== FIM: components/skeleton.css ========== -->

---

<!-- ========== INÍCIO: components/toggle-select-painel.css ========== -->

## components/toggle-select-painel.css
/* ================================================
   COMPONENTE: Toggle Select Painel
   Botão reutilizável para abrir painéis (ex.: Cliente, Tipo de Factura)
   Modificadores: .cliente-btn | .tipoFat-btn
   Ficheiro: assets/css/components/toggle-select-painel.css
   ================================================ */

.toggle-select-painel {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
  font-size: var(--font-base);
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
}

.toggle-select-painel:hover {
  background: #f9fafb;
  transform: translateY(-1px);
  box-shadow: var(--shadow-strong);
}

.toggle-select-painel:active {
  transform: translateY(0);
}

.toggle-select-painel.panel-active {
  background: rgba(34, 34, 34, 0.05);
  border-color: var(--color-selection);
  box-shadow: 0 0 0 3px rgba(34, 34, 34, 0.1);
}

.toggle-select-painel.panel-active > i:first-child {
  color: var(--color-selection);
}

.toggle-select-painel.panel-active .cliente-label {
  color: var(--color-selection);
}

.toggle-select-painel > i:first-child {
  color: #9ca3af;
  font-size: clamp(16px, 1.6vw, 20px);
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.toggle-select-painel .cliente-text {
  display: flex;
  flex-direction: column;
  gap: clamp(2px, 0.2vw, 4px);
  flex: 1;
  min-width: 0;
  align-items: flex-start;
  text-align: left;
}

.toggle-select-painel .cliente-label {
  font-size: var(--font-sm);
  color: #9ca3af;
  font-weight: 500;
  line-height: 1;
}

.toggle-select-painel .cliente-name {
  font-size: var(--font-md);
  font-weight: 600;
  color: #6b7280;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toggle-select-painel .cliente-name.selected {
  color: #374151;
}

.toggle-select-painel > i:last-child {
  color: #d1d5db;
  font-size: var(--font-lg);
  flex-shrink: 0;
  transition: transform 0.3s ease, color 0.2s ease;
}

.toggle-select-painel:hover > i:last-child {
  transform: translateX(2px);
}

.toggle-select-painel.panel-active > i:last-child {
  transform: rotate(180deg);
  color: var(--color-selection);
}

/* Botão Cliente ao lado da search: mesma altura (padding vertical igual ao .search-wrapper) */
.search-bar-container .toggle-select-painel.cliente-btn {
  padding-top: var(--space-md);
  padding-bottom: var(--space-md);
  padding-left: var(--space-lg);
  padding-right: var(--space-lg);
}

/* Botão dentro do cabeçalho do carrinho (Tipo de Factura) */
.cart-header .toggle-select-painel {
  width: auto;
  max-width: 200px;
  min-width: 0;
  font-size: var(--font-base);
  padding: var(--space-sm) var(--space-md);
  gap: var(--space-sm);
  border-radius: 6px;
}

.cart-header .toggle-select-painel > i:first-child {
  font-size: var(--font-lg);
}

.cart-header .toggle-select-painel .cliente-label {
  font-size: var(--font-xs);
}

.cart-header .toggle-select-painel .cliente-name {
  font-size: var(--font-sm);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding-right: var(--space-md);
}

.cart-header .doc-arrow {
  font-size: var(--font-xs);
  color: #9ca3af;
}

.cart-header .toggle-select-painel > i:last-child {
  font-size: var(--font-base);
}


<!-- ========== FIM: components/toggle-select-painel.css ========== -->
