# Plano de Refatoração CSS — Dash-POS
> Versão 1.0 | Gerado após análise completa do `styles.css` (5443 linhas)

---

## Contexto

O ficheiro `styles.css` atual contém **5443 linhas** num único ficheiro plano, sem separação por componente ou responsabilidade. Isto dificulta manutenção, gera conflitos ao trabalhar a dois, e torna qualquer debugging um exercício de busca e rolagem.

O objetivo deste plano é **dividir o ficheiro por responsabilidade e componente**, sem alterar nenhum comportamento visual. Nenhuma classe deve ser removida ou renomeada — apenas movida para o ficheiro certo.

---

## Estrutura de Destino

```
assets/css/
├── base/
│   ├── variables.css          ← :root, custom properties, tokens
│   ├── reset.css              ← *, html, body, scrollbars globais
│   └── typography.css         ← fontes, tamanhos, line-height (se existirem estilos globais de texto)
│
├── layout/
│   ├── interface.css          ← .interface, .main, .side, .checkout-panel, grids principais
│   └── responsive.css         ← TODOS os @media queries do sistema (exceto os internos a componentes)
│
├── components/
│   ├── skeleton.css           ← .app-skeleton, .skeleton-*, @keyframes skeleton-shimmer
│   ├── header.css             ← .main-header, .main-nav, .nav-link, .date-time, .user, .avatar
│   ├── search.css             ← .search-bar-container, .search-wrapper, .search-icon-left, .barcode-toggle-inline, .toggle-switch, .clear-btn
│   ├── categories.css         ← .category-bar, .cat-slider, .cat-viewport, .cat-track, .category, .cat-arrow
│   ├── product-card.css       ← .product-grid, .card, .card-content, .card-title, .card-footer, .card-price, .card-stock, .card-quick-add, .stock-indicator
│   ├── cart.css               ← .cart-header, .cart-body, .cart-content-area, .cart-products-container, .cart-item, .cart-empty-state, .cart-list-new
│   ├── cart-footer.css        ← .cart-footer, .payment-methods-section, .footer-amount-row, .footer-amount-wrapper, .footer-amount-input, .footer-actions-row, .order-summary-*
│   ├── keypad.css             ← .footer-keypad, .keypad-grid, .keypad-btn, .keypad-pay-btn, .keypad-exact-btn, .keypad-final-row, .keypad-split-cell
│   ├── payment-methods.css    ← .pm-card, .pm-card-name, .pm-card-value, .pm-arrow, .payment-status-element, .payment-methods-track, .payment-methods-wrapper
│   ├── invoice-type.css       ← .invoice-type-selector, .invoice-radio-option, .radio-custom, .doc-type-panel-slider, .invoice-toggle-option, .invoice-type-options-panel, .format-sub-options, .format-toggle-option
│   ├── client-btn.css         ← .cliente-btn, .cliente-text, .cliente-label, .cliente-name (botão no header/cart)
│   ├── client-panel.css       ← .client-panel-slider, .panel-header-slider, .panel-body-slider, .client-section, .client-card, .client-search-*, .client-form-*, .client-list-results
│   ├── bottom-sheet.css       ← .bottom-sheet-overlay, .bottom-sheet, .bottom-sheet-handle, .cart-sheet-tabs, .cart-sheet-tab, .cart-sheet-tab-panel, .sticky-bottom-menu, .sticky-menu-btn
│   ├── alerts.css             ← #alertContainer, .alert, .alert-*, .alert-critical, #criticalAlertContainer, @keyframes alertSlideIn, alertSlideOut, criticalFadeIn, criticalFadeOut
│   └── modals.css             ← .panel-overlay, #overlay-confirm-dialog, #box-confirm-dialog, .fade-enter-*, .fade-exit-*
│
└── main.css                   ← ÚNICO ficheiro que faz @import de todos os outros (na ordem correta)
```

---

## Mapeamento: O que vai para onde

### `base/variables.css`
Linhas de origem: **1–54**

Contém:
- Todo o bloco `:root { ... }` com tokens de cor, tipografia, espaçamentos, sidebar widths

```css
/* Início do ficheiro */
:root {
  --bg: ...
  --color-primary: ...
  --sidebar-width: ...
  --font-xs: ...
  --space-xs: ...
}
```

---

### `base/reset.css`
Linhas de origem: **173–196** e scrollbars **1197–1199**

Contém:
- `* { box-sizing: border-box }`
- `html, body { height: 100% }`
- `body { margin: 0; font-size...; overflow: hidden; ... }`
- `.side::-webkit-scrollbar`, `.main::-webkit-scrollbar` (scrollbars globais)

---

### `layout/interface.css`
Linhas de origem: **188–215** e partes do **999–1013**

Contém:
- `.interface { display: grid; grid-template-columns: 64% 36%; ... }`
- `.interface.panel-open { grid-template-columns: 39% 36% 25%; }`
- `.main { ... }`
- `.side { ... }`
- `.sticky-section-home { ... }` e seu `::before`
- `.checkout-panel { ... }`

---

### `layout/responsive.css`
Linhas de origem: **3516–3532**, **4137–4248**, **4596–4607**, **4819–5151**

Contém todos os blocos `@media` do sistema que afetam o layout geral:
- `@media (min-width:350px) and (max-width:450px)` — product-grid 2 colunas
- `@media (max-width:349px)` — product-grid 1 coluna
- `@media (max-width: 890px)` — mobile-menu-btn, nav mobile
- `@media (max-width: 1100px)` — cart-body-wrapper, product-grid cols
- `@media (min-width: 906px)` e `@media (max-width: 905px)` — bottom sheet, skeleton, search mobile, bottom-menu
- `@media (max-width: 768px)` — alertContainer, client-panel-slider, client-card mobile
- `@media (min-width: 761px) and (max-width: 1100px)` — search-bar-container, cliente-btn

> **Nota para o agente:** Cada componente pode ter os seus próprios `@media` internos quando o override é muito específico ao componente (ex: `@media (max-width: 768px)` dentro de `client-panel.css`). O `responsive.css` contém apenas media queries que afetam layout global ou múltiplos componentes ao mesmo tempo.

---

### `components/skeleton.css`
Linhas de origem: **56–149**

Contém:
- `.keypad-pay-btn` (estado loading)
- `@keyframes pulse-dots`
- `.app-skeleton`, `.app-skeleton.hidden`
- `.skeleton-layout-main`, `.skeleton-layout-side`
- `.skeleton-block`, `@keyframes skeleton-shimmer`
- `.skeleton-search`, `.skeleton-pills`, `.skeleton-card`, `.skeleton-text-*`, `.skeleton-cart-*`, `.skeleton-mobile-*`
- `.skeleton-product-grid`, `.skeleton-mobile-wrap`

---

### `components/header.css`
Linhas de origem: **218–281**

Contém:
- `.main-header`, `.main-header-left`, `.main-header-right`
- `.main .main-nav`, `.nav-link`, `.nav-link:hover`, `.nav-link.is-active`
- `#newOrderBtn`, `.date-time`, `.user`, `.avatar`, `.user-info`

---

### `components/search.css`
Linhas de origem: **283–444**

Contém:
- `.search-bar-container`, `.search-bar-inner`, `.header-search-slot`
- `.search-wrapper`, `.search-wrapper:focus-within`
- `.search-icon-left`
- `.search-wrapper input`, `::placeholder`, `:focus`
- `.barcode-toggle-inline`, `.barcode-toggle-inline.active`
- `.toggle-switch`, `.toggle-switch::before`
- `.toggle-label-short`
- `.clear-btn`
- `.search-wrapper.barcode-mode`, `.barcode-success`, `.barcode-error` (linhas 4581–4594)

---

### `components/categories.css`
Linhas de origem: **589–701** (aprox.)

Contém:
- `.category-bar`, `.cat-slider`, `.cat-viewport`, `.cat-track`
- `.category`, `.category:hover`, `.category.is-active`
- `.cat-name`, `.cat-count`
- `.cat-arrow`, `.cat-arrow.prev`, `.cat-arrow.next`, `.cat-arrow[disabled]`
- `.category-bar.has-left-shadow`, `.has-right-shadow` (efeito mask)

---

### `components/product-card.css`
Linhas de origem: **702–997** (aprox.)

Contém:
- `.product-grid` (grid de produtos)
- `.card`, `.card:hover`, `.card.is-selected`
- `.card-img-wrap`, `.card-badge`, `.qty-badge`
- `.card-content`, `.card-title`, `.card-footer`
- `.card-price`, `.card-stock` (e suas variações: `.available`, `.low`, `.unavailable`, `.service`)
- `.stock-indicator`, `.stock-quantity`
- `.card-quick-add`
- `.products-container-wrapper` (linhas 4671–4713)

---

### `components/cart.css`
Linhas de origem: **1119–1133**, **1276–1367**

Contém:
- `.cart-products-area`, `.cart-empty-state`, `.empty-icon`, `.cart-list-new`
- `.cart-item`, `.cart-item .title`, `.cart-item .meta`
- `.cart-header`, `.cart-header-title`
- `.cart-body`, `.cart-body:has(.cart-empty-state...)`
- `.cart-body-wrapper`, `.cart-content-area`
- `.cart-products-container`
- `.iconbtn`, `.qtybtn` (linhas 1132–1134, 1192–1194)
- `.cart-items-list`, `.cart-item-new`, `.cart-item-info`, `.cart-item-name`, `.cart-item-details`, `.cart-item-controls` (linhas 3073–3131)
- `.qty-btn-small`, `.qty-display-small`, `.btn-remove-item` (linhas 3133–3179)

---

### `components/cart-footer.css`
Linhas de origem: **1836–1953**, **2466–2660** (aprox.)

Contém:
- `.cart-footer`, `.cart-footer.document-type-proforma` (e todos os `::after` de bloqueio)
- `.pm-card.locked`, `.footer-amount-wrapper.locked`, `.keypad-btn.locked`
- `.footer-section`
- `.order-summary-wrapper`, `.order-summary-slider`, `.order-summary-view`
- `.order-summary-header`, `.order-summary-title`, `.obs-toggle-btn`
- `.order-summary-content`, `.order-card`, `.order-card-info`, `.order-card-label`, `.order-card-value`
- `.order-obs-view`, `.order-obs-header`, `.order-obs-tabs`, `.order-obs-tab`
- `.footer-actions-row`, `.footer-actions-left`, `.footer-actions-right`
- `.cart-summary-compact`, `.summary-row`, `.btn-checkout` (linhas 1144–1184)

---

### `components/keypad.css`
Linhas de origem: **2298–2465**

Contém:
- `.footer-keypad`, `.keypad-grid`
- `.keypad-btn`, `.keypad-btn:hover`, `.keypad-btn:active`
- `.keypad-btn.keypad-clear`, `.keypad-btn.keypad-backspace`
- `.keypad-split-cell`
- `.keypad-pay-btn` (estilos normais, não o loading)
- `.keypad-final-row`, `.keypad-exact-btn`, `.keypad-exact-btn--inline`

---

### `components/payment-methods.css`
Linhas de origem: **1959–2122**, **2123–2270**

Contém:
- `.payment-methods-section`, `.payment-methods-wrapper`, `.payment-methods-track`
- `.pm-card`, `.pm-card-name`, `.pm-card-value` (e variantes: `.valor-negativo`, `.valor-positivo`, `.valor-confirmado`)
- `.pm-card:hover`, `.pm-card.active`, `.pm-card.editing`, `.pm-empty`
- `.pm-arrow`, `.pm-arrow-prev`, `.pm-arrow-next`, `.pm-arrow[disabled]`
- `.payment-methods-wrapper.has-overflow .pm-arrow`
- `.footer-amount-row`, `.payment-status-element` e variantes (`.state-change`, `.state-remaining`, `.state-complete`)
- `.footer-amount-wrapper`, `.footer-amount-input`
- `.payment-methods-grid`, `.payment-method-btn` (linhas 3182–3290)
- `.payment-display`, `.payment-label`, `.payment-value` (linhas 3222–3247)

---

### `components/invoice-type.css`
Linhas de origem: **151–171**, **1015–1117**, **1340–1600** (aprox.)

Contém:
- `.invoice-format-selection`
- `.invoice-type-selector`, `.invoice-type-header`, `.invoice-type-options`
- `.invoice-radio-option`, `.radio-custom`, `.radio-label`, `@keyframes radioSelect`
- `.cart-body-wrapper.doc-panel-open`, `.doc-type-panel-slider`, `.doc-type-panel-slider.active`
- `.invoice-type-options-panel`, `.invoice-option-group`
- `.invoice-toggle-option`, `.toggle-label`, `.toggle-switch-container`, `.toggle-switch-visual`
- `.format-sub-options`, `.format-toggle-option`, `.format-label`, `.format-switch-container`, `.format-switch-visual`
- `.doc-type-item` (linhas 4109–4125)

---

### `components/client-btn.css`
Linhas de origem: **446–540**

Contém:
- `.cliente-btn`, `.cliente-btn:hover`, `.cliente-btn:active`
- `.cliente-btn.panel-active` (e seus filhos)
- `.cliente-text`, `.cliente-label`, `.cliente-name`, `.cliente-name.selected`
- `.cart-header .cliente-btn` (override dentro do carrinho, linhas 1240–1273)

---

### `components/client-panel.css`
Linhas de origem: **4670–4713**, **4715–4796**, **4797–5000** (aprox.) e **5152–5443**

Contém:
- `.products-container-wrapper`, `.product-grid` (quando painel aberto)
- `.client-panel-slider`, `.client-panel-slider.active`
- `.panel-header-slider`, `.panel-body-slider`
- `.client-section`, `.client-section-header-row`
- `.section-title`
- `.client-card`, `.client-card:hover`, `.client-card-content`, `.client-card-name`, `.client-card-details`, `.client-card-indicator`
- `.client-search-wrapper`, `.client-search-input`, `::placeholder`, `:focus`
- `.client-list-results`
- `.client-form`, `.client-form-input`, `.client-form-submit`
- `.client-panel-close-btn`
- `.client-list`, `.client-item`, `.client-name`, `.client-details` (linhas 3366–3406)
- `.btn-new-client`, `.new-client-form`, `.form-actions`, `.btn-cancel`, `.btn-save` (linhas 3407–3495)

---

### `components/bottom-sheet.css`
Linhas de origem: **3534–3665** e **3666–3898** (aprox.)

Contém:
- `.sticky-bottom-menu`, `.sticky-menu-btn`, `.sticky-menu-btn-primary`
- `.sticky-menu-label`, `.sticky-cart-badge`
- `.bottom-sheet-overlay`, `.bottom-sheet`
- `.bottom-sheet.active`, `.bottom-sheet.active.slide-up`, `.bottom-sheet.active.closing`
- `.bottom-sheet--short`
- `.bottom-sheet-handle`
- `.cart-sheet-tabs`, `.cart-sheet-tab`, `.cart-sheet-tab.active`
- `.cart-sheet-tab-panel`, `.cart-sheet-tab-panel-fatura`
- `.cart-sheet-ordem-placeholder`
- `.bottom-sheet-doc-type-header`, `.bottom-sheet-doc-type-title`, `.bottom-sheet-close-btn-doc`

---

### `components/alerts.css`
Linhas de origem: **4278–4578**

Contém:
- `#alertContainer`, `.alert`, `.alert-content`, `.alert-icon`, `.alert-text`, `.alert-title`, `.alert-message`, `.alert-close`
- `.alert-enter`, `.alert-exit`, `@keyframes alertSlideIn`, `@keyframes alertSlideOut`
- `.alert.success`, `.alert.error`, `.alert.warning`, `.alert.info`
- `#criticalAlertContainer`, `.alert-critical`, `.alert-critical-content`, `.alert-critical-icon`, `.alert-critical-message`
- `.alert-critical-close`, `.alert-critical-enter`, `.alert-critical-exit`
- `@keyframes criticalFadeIn`, `@keyframes criticalFadeOut`

---

### `components/modals.css`
Linhas de origem: **3497–3511**, **4609–4669**

Contém:
- `.panel-overlay`, `.panel-overlay.active`
- `.fade-enter-confirm-dialog`, `.fade-enter-active-confirm-dialog`
- `.fade-exit-confirm-dialog`, `.fade-exit-active-confirm-dialog`
- `#overlay-confirm-dialog`, `#box-confirm-dialog`
- `body.overflow-hidden`
- `#cancel-confirm-dialog`, `#confirm-confirm-dialog`
- `#clearCart.btn.light` (linhas 4250–4276)

---

### Secções legadas / a investigar

As seguintes secções existem no ficheiro mas devem ser verificadas antes de mover — podem ser código antigo ou duplicado:

- **Linhas 3022–3072**: `.cart-empty-state` com ícone, `p`, `small` — parece ser uma versão alternativa/antiga do estado vazio. Verificar se ainda está em uso no HTML.
- **Linhas 3182–3500**: `.payment-methods-grid`, `.payment-method-btn`, `.payment-display`, `.payment-keypad button`, `.keypad-back`, `.resumo-grid`, etc. — estrutura que parece diferente da do keypad atual. Pode ser código do modal de checkout antigo. **Mover para `components/payment-methods.css` mas marcar com comentário `/* LEGACY - verificar uso */`.**

---

## Ficheiro `main.css` — Ponto de entrada único

```css
/* === BASE === */
@import './base/variables.css';
@import './base/reset.css';
@import './base/typography.css';

/* === LAYOUT === */
@import './layout/interface.css';

/* === COMPONENTS === */
@import './components/skeleton.css';
@import './components/header.css';
@import './components/search.css';
@import './components/categories.css';
@import './components/product-card.css';
@import './components/cart.css';
@import './components/cart-footer.css';
@import './components/keypad.css';
@import './components/payment-methods.css';
@import './components/invoice-type.css';
@import './components/client-btn.css';
@import './components/client-panel.css';
@import './components/bottom-sheet.css';
@import './components/alerts.css';
@import './components/modals.css';

/* === RESPONSIVE (sempre por último) === */
@import './layout/responsive.css';
```

> **Nota crítica:** O ficheiro `index.php` deve referenciar apenas `main.css`. Remover a referência direta a `styles.css`.

---

## Regras para o Agente seguir

### 1. Nunca apagar, sempre mover
Nenhuma linha de CSS deve ser removida. Cada linha do `styles.css` original deve aparecer em exatamente um dos ficheiros de destino.

### 2. Manter a ordem dentro de cada ficheiro
Dentro de cada ficheiro de componente, manter a ordem original das regras tal como aparecem no `styles.css`. Não reordenar seletores.

### 3. Nunca renomear classes
Nenhuma classe CSS deve ser renomeada. O objetivo é apenas reorganizar, não refatorar a semântica.

### 4. Comentários de secção
Cada ficheiro deve começar com um bloco de comentário identificador:

```css
/* ================================================
   COMPONENTE: Cart Footer
   Ficheiro: assets/css/components/cart-footer.css
   Parte do sistema Dash-POS
   ================================================ */
```

### 5. Quando encontrar código duplicado
Se durante a migração encontrar duas definições do mesmo seletor (ex: `.cart-empty-state` aparece em múltiplos blocos), mover ambas para o ficheiro do componente mas adicionar um comentário:

```css
/* DUPLICADO - verificar qual versão está ativa no HTML */
```

Não eliminar nenhuma das versões até confirmação.

### 6. Código legado
Secções marcadas como `/* LEGACY */` devem ser movidas mas nunca apagadas sem confirmação explícita.

### 7. Validação após migração
Após criar todos os ficheiros e o `main.css`, abrir o browser e confirmar que o visual está idêntico ao original. Se algo quebrar, o problema está na **ordem dos imports** em `main.css` — ajustar a ordem sem alterar os ficheiros de componente.

---

## Ordem de execução para o Agente

1. Criar a estrutura de pastas: `assets/css/base/`, `assets/css/layout/`, `assets/css/components/`
2. Criar `base/variables.css` (linhas 1–54 do original)
3. Criar `base/reset.css`
4. Criar `layout/interface.css`
5. Criar cada ficheiro em `components/` seguindo o mapeamento acima
6. Criar `layout/responsive.css` com todos os `@media` globais
7. Criar `main.css` com os imports na ordem definida
8. Atualizar `pages/index.php` para apontar para `main.css` em vez de `styles.css`
9. Manter o `styles.css` original intacto até confirmação visual de que tudo funciona
10. Apenas após confirmação visual: arquivar `styles.css` (não apagar)

---

**Estado:** Refatoração concluída. O dashboard usa `assets/css/main.css` como ponto de entrada. Para saber onde fazer modificações nos estilos, ver **`docs/mapa-css-dash-pos.md`**.
