# Estrutura HTML e CSS — Cards da Ordem de Venda

Documento de referência: HTML e CSS dos cards que mostram **Total a pagar**, **Total ilíquido**, **Total impostos** e **Retenção** no footer do carrinho.

---

## 1. HTML

Origem: `pages/index.php` (dentro do rodapé do carrinho, área "Order Summary").

```html
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
      <!-- ... OBS / Desc. ... -->
    </div>
  </div>
</div>
```

### IDs usados pelo JS (`order-summary.ui.js`)

| ID | Uso |
|----|-----|
| `summaryTotalPagar` | Total a pagar |
| `summaryNetTotal` | Total ilíquido |
| `summaryTaxTotal` | Total impostos |
| `summaryRetention` | Retenção |

---

## 2. CSS — Ficheiro: `assets/css/components/cart-footer.css`

### Contexto (linha do footer onde os cards vivem)

```css
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
```

### Wrapper e slider da ordem de venda

```css
/* ORDER SUMMARY SLIDER COMPONENT */
.order-summary-wrapper {
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: #fafafa;
  border-radius: 6px;
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
  padding: 0 8px 8px 0;
  box-sizing: border-box;
  flex-shrink: 0;
}

.order-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 2px;
  flex-shrink: 0;
}

.order-summary-title {
  font-size: 9px;
  font-weight: 500;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.2px;
}

.obs-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: background 0.2s ease;
}

.obs-toggle-btn:hover {
  background: #e8e8e8;
}

.obs-toggle-btn i {
  font-size: 10px;
}

.order-summary-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 2px;
  overflow-y: auto;
  min-height: 0;
}
```

### Estilos dos cards (Total a pagar, Ilíquido, Impostos, Retenção)

```css
.order-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #e8e8e8;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 2px 6px;
  width: 100%;
  box-sizing: border-box;
}

.order-card-info {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.order-card-label {
  font-size: 11px;
  font-weight: 500;
  color: #666;
  letter-spacing: 0.1px;
}

.order-card-value {
  font-size: 12px;
  font-weight: 700;
  color: #111;
}

.order-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

.order-card-icon i {
  font-size: 10px;
}
```

---

## 3. Responsividade

No **mesmo ficheiro** `assets/css/components/cart-footer.css` existe um único bloco `@media` que afecta o componente da ordem de venda. Ele altera apenas o **View 2** (OBS/Desc.), não os quatro cards:

```css
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
```

Os **cards** (`.order-card`, `.order-card-info`, `.order-card-label`, `.order-card-value`, `.order-card-icon`) **não têm regras específicas em nenhum `@media`** no projeto; o layout responsivo do footer em geral está em `assets/css/layout/responsive.css` (breakpoints globais), mas sem seletores que alterem estes cards.

---

## 4. Resumo

| O quê | Onde |
|-------|------|
| HTML dos 4 cards | `pages/index.php` (dentro de `.order-summary-wrapper` → `.order-summary-view` → `.order-summary-content`) |
| CSS dos cards e do wrapper/slider | `assets/css/components/cart-footer.css` (`.footer-actions-*`, `.order-summary-*`, `.order-card*`, `.obs-toggle-btn`) |
| Responsividade que toca no componente | `cart-footer.css`: só `@media (max-width: 1155px)` para `.order-obs-*` e `.obs-back-btn` (view OBS/Desc.), não para os cards |

Os valores dos cards são actualizados por `updateOrderSummaryFooter(netTotal, taxTotal, retention, totalPagar)` em `assets/js/ui/order-summary.ui.js`, que escreve em `#summaryNetTotal`, `#summaryTaxTotal`, `#summaryRetention` e `#summaryTotalPagar`.
