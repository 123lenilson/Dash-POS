# Plano de Refatoração JS — Dash-POS
> Versão 1.0 | Gerado após análise completa do `app.js` (6655 linhas)

---

## Contexto

O ficheiro `app.js` atual contém **6655 linhas** num único ficheiro plano, com tudo misturado: chamadas ao backend (fetch), lógica de negócio, manipulação do DOM, gestão de estado e inicialização. Isto dificulta manutenção, debug e escalabilidade.

O objetivo deste plano é **dividir o ficheiro por responsabilidade**, inspirado na arquitetura do **Vue.js** — sem alterar nenhum comportamento. Nenhuma função deve ser removida ou renomeada — apenas movida para o ficheiro correto. O sistema continua a funcionar em **vanilla JS, sem bundler**, com `<script>` tags sequenciais em `index.php`.

---

## Estrutura de Destino

```
assets/js/
├── state.js                          ← Estado global, constantes e variáveis reativas
├── dom.js                            ← Referências DOM (getElementById, querySelector)
├── utils.js                          ← Utilitários puros: debounce, formatters, helpers
│
├── services/                         ← Chamadas ao backend (fetch) — equivalente a "services" Vue
│   ├── cliente.service.js            ← carregarClientePadrao
│   ├── produto.service.js            ← carregarProdutos, atualizarProdutos
│   ├── pedido.service.js             ← syncToAPI, loadCartFromAPI
│   └── pagamento.service.js          ← loadFooterPaymentMethods
│
├── modules/                          ← Lógica de domínio sem toque direto no DOM — equivalente a "composables" Vue
│   ├── invoice-assets.module.js      ← loadCSS, loadInvoiceAssets, applyInvoicePrintStyles
│   ├── cart.module.js                ← addToCart, removeFromCart, removeCartProduct, clearCart, showRemoveConfirmation
│   ├── barcode.module.js             ← BARCODE_CONFIG, processBarcode, toggleBarcodeScanner, beep
│   └── checkout.module.js            ← collectPaymentData, getIdClienteForDocument, processReceiptInvoice,
│                                        processProformaInvoice, processFaturaInvoice, processOrcamentoInvoice,
│                                        clearCartAfterSale, startPayButtonAnimation, resetPayButtonText, initPayButton
│
├── ui/                               ← Interação com o DOM e renderização — equivalente a "components" Vue
│   ├── skeleton.ui.js                ← skeletonMarkProductsReady, skeletonMarkCartReady, skeletonTryHide
│   ├── alerts.ui.js                  ← showAlert, closeAlert, showCriticalAlert, closeCriticalAlert
│   ├── modal.ui.js                   ← showConfirmModal, hideConfirmModal, onConfirmAction, onCancelAction, initConfirmModalListeners
│   ├── products.ui.js                ← getSoftColor, renderProducts, buildCategories, updateProductSelections
│   ├── cart.ui.js                    ← renderCart, renderCartProductCard, updateCartDisplay, formatCurrencyInput, toggleCardExpansion
│   ├── cart-editing.ui.js            ← startEditingQuantity, finishEditingQuantity, validateAndUpdateQuantity,
│   │                                    updateCartProductQuantity, updateCartProductPrice, preventZero,
│   │                                    handleInputKeydown, startEditingPrice, submitEditingPrice,
│   │                                    handlePriceBlur, handlePriceKeydown, cancelEditingPrice, formatPriceDisplay, forceSyncPendingEdit
│   ├── payment.ui.js                 ← renderFooterPaymentCards, selectFooterPaymentMethod, updateFooterPaymentCards,
│   │                                    updatePaymentStatus, showPaymentMissing, initPaymentMethodsSlider,
│   │                                    initPaymentMethodsSelection, refreshPaymentMethodsOverflow,
│   │                                    scheduleRefreshPaymentMethodsOverflow, resetFooterPaymentValues,
│   │                                    footerKeypadInput, backspaceFooterCash, clearFooterCash,
│   │                                    getFooterCashAmount, initFooterKeypad, fillExactAmount, confirmFooterPaymentValue,
│   │                                    generatePaymentSlug, getSelectedPaymentMethod, updateFooterCashDisplay
│   ├── invoice-type.ui.js            ← openPanel, closeClientPanel, closeDocPanel, closePanel, selectClient,
│   │                                    openNewClientFormPanel, initInvoiceTypePanelToggles, initInvoiceFormat,
│   │                                    selecionarFormatoFatura, getInvoiceFormat, getTipoDocumentoAtual,
│   │                                    showInvoiceFormatSelector, hideInvoiceFormatSelector, selectInvoiceFormat,
│   │                                    confirmInvoiceFormat, updateInvoiceTypeDisplay, updateCartFooterLockIcons,
│   │                                    updateInvoiceFormatDisplay, updateStickyDocTypeLabel
│   ├── order-summary.ui.js           ← initOrderSummarySlider, updateOrderSummaryFooter, getOrderObservation
│   ├── search.ui.js                  ← debouncedSearch, processBarcodeFromSearch, listeners de pesquisa e clearSearch,
│   │                                    setupHeaderSearchToggle IIFE
│   └── bottom-sheet.ui.js            ← initBottomSheetSystem
│
└── app.js                            ← Orquestrador puro: init(), SSE, datetime, responsive,
                                         menu móvel, bridges globais, DOMContentLoaded final
```

---

## Mapeamento: O que vai para onde

### `state.js`
**Linhas de origem:** 1–37, 55–60, 252–255, 279, 3359–3360

Contém **todo o estado global** — variáveis que são partilhadas por múltiplos módulos:

```js
// === DADOS ===
let PRODUCTS = [];
const currency = new Intl.NumberFormat('pt-AO', { ... });

// === ESTADO DE UI ===
let activeCategory = "Todos Produtos";
let searchTerm = "";
let modoEdicao = false;
let estaPesquisando = false;
let searchResults = [];

// === CARRINHO ===
const cart = new Map();
let lastCartHash = null;
let lastExpandedProductId = null;
let isSwitchingCards = false;
let isPriceEditCancelled = false;
let quantityInputIsSelected = false;

// === PAGAMENTO ===
let currentCartTotal = 0;
let selectedPaymentMethod = null;
let footerPaymentMethods = [];
let footerValoresPorMetodo = {};
let footerCashAmount = '0';

// === SSE ===
let sseConnection = null;
let sseReconnectAttempts = 0;
const SSE_MAX_RECONNECT_ATTEMPTS = 5;
const SSE_RECONNECT_DELAY = 3000;

// === TIPO/FORMATO DE DOCUMENTO ===
const tiposDesenvolvidos = ['fatura-recibo', 'fatura-proforma', 'fatura', 'orcamento'];
let tipoDocumentoAtual = 'fatura-recibo';
let formatoFaturaAtual = 'A4';

// === INVOICE ASSETS ===
const invoiceAssetsState = { css: { a4: false, mm80: false } };

// === CLIENTE ===
let idClientePadrao = null;
let lastCategoriesKey = null;

// === CART EDITING ===
let finishEditingTimeout = null;
let pendingSync = null;
```

---

### `dom.js`
**Linhas de origem:** 534–558

Contém as referências aos elementos DOM usados globalmente:

```js
const dateTimeEl = document.getElementById('dateTime');
const categoryBar = document.getElementById('categoryBar');
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const cartList = document.getElementById('cartList');
const cartItemsCount = document.getElementById('cartItemsCount');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartDiscount = document.getElementById('cartDiscount');
const cartTax = document.getElementById('cartTax');
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
```

---

### `utils.js`
**Linhas de origem:** 257–276, 563–586

Contém funções utilitárias puras (sem dependência de estado ou DOM):

- `connectMonetaryInput(inputId, options)` — linha 263
- `debounce(func, delay)` — linha 270
- `nowFancy()` — linha 564
- `placeholderIMG(name)` — linha 569
- `isMobileView()` — linha 584

---

### `services/cliente.service.js`
**Linhas de origem:** 592–633

Contém:
- `carregarClientePadrao()` — linha 593

---

### `services/produto.service.js`
**Linhas de origem:** 635–656, 679–743

Contém:
- `carregarProdutos()` — linha 635
- `atualizarProdutos(produtos)` — linha 679

> **Nota:** `atualizarProdutos` chama `buildCategories` e `renderProducts` (que estão em `ui/products.ui.js`). Esta dependência mantém-se — não reordenar.

---

### `services/pedido.service.js`
**Linhas de origem:** 285–390, 436–530

Contém:
- `syncToAPI(id, qtyOverride, priceOverride)` — linha 285
- `loadCartFromAPI()` — linha 436

---

### `services/pagamento.service.js`
**Linhas de origem:** 4005–4050

Contém:
- `loadFooterPaymentMethods()` — linha 4005

---

### `modules/invoice-assets.module.js`
**Linhas de origem:** 47–246

Contém:
- `loadCSS(href, id)` — linha 68
- `loadInvoiceAssets(format)` — linha 104
- `areInvoiceAssetsLoaded(format)` — linha 152
- `resetInvoiceAssetsState()` — linha 164
- `applyInvoicePrintStyles(format)` — linha 175
- Exposições `window.*` das funções acima — linhas 241–246

---

### `modules/cart.module.js`
**Linhas de origem:** 392–433, 1275–1288, 2500–2525, 3849–3971

Contém:
- `addToCart(id, delta)` — linha 392
- `removeFromCart(id)` — linha 1275
- `showRemoveConfirmation(productId, productName)` — linha 2504
- `removeCartProduct(productId)` — linha 3849
- `clearCart()` — linha 3916
- `showRemoveAllConfirmation()` — linha 3969

> **Nota:** Estas funções usam `cart`, `syncToAPI`, `renderCart`, `updateCartDisplay`, `showAlert`, `showConfirmModal`, `resetFooterPaymentValues`. Todas essas estarão disponíveis pois são carregadas antes (via `state.js`, services e ui).

---

### `modules/barcode.module.js`
**Linhas de origem:** 2105–2453, 2458–2499

Contém:
- Configuração: `BARCODE_CONFIG`, `barcodeBuffer`, `barcodeTimeout`, `isProcessingBarcode`, `lastBarcodeTime` — linha 2108–2133
- `toggleBarcodeScanner(enable)` — linha 2218
- `processBarcode(barcode)` — linha 2243
- `showBarcodeStatus(icon, type)` — linha 2368
- `showBarcodeLastScan(text, type)` — linha 2388
- `playBeepSound(type)` — linha 2404
- `showBarcodeStats()` — linha 2441
- `window.barcodeStats = showBarcodeStats` — linha 2453
- `DOMContentLoaded` — inicialização do toggle de barcode (linhas 2458–2479)
- `document.addEventListener('keydown', ...)` — listener global de scanner (linhas 2482–2499)

---

### `modules/checkout.module.js`
**Linhas de origem:** 5000–5186, 5191–5948, 5953–5966, 5975–6024, 6027–6131, 6333–6344

Contém:
- `getIdClienteForDocument()` — linha 5005
- `collectPaymentData()` — linha 5024
- `payButtonAnimationInterval` (variável) — linha 5143
- `startPayButtonAnimation()` — linha 5145
- `stopPayButtonAnimation()` — linha 5161
- `resetPayButtonText()` — linha 5174
- `processProformaInvoice()` — linha 5191
- `processOrcamentoInvoice()` — linha 5311
- `processFaturaInvoice()` — linha 5431
- `processReceiptInvoice()` — linha 5551
- `clearCartAfterSale()` — linha 5891
- `closeAlert()` ← **ATENÇÃO**: versão simplificada (apaga container inteiro) — linha 5953
  > **Duplicado**: `alerts.ui.js` tem uma versão mais completa de `closeAlert`. Esta versão do checkout deve manter o nome mas ser marcada com `/* LEGACY - versão simplificada, ver alerts.ui.js */`
- `getTipoDocumentoAtual()` — linha 5964 ← **Duplicado** com `invoice-type.ui.js`. Mover apenas esta instância e marcar `/* DUPLICADO — versão em invoice-type.ui.js */`
- `initPayButton()` — linha 5975
- `testRender80mm()` — linha 6027 ← debug
- `debug80mmContainer()` — linha 6095 ← debug
- Exposições `window.*` globais do bloco de checkout/fatura — linhas 6333–6344

---

### `ui/skeleton.ui.js`
**Linhas de origem:** 658–677

Contém:
- `skeletonMarkProductsReady()` — linha 659
- `skeletonMarkCartReady()` — linha 664
- `skeletonTryHide()` — linha 670

---

### `ui/alerts.ui.js`
**Linhas de origem:** 1887–2076

Contém:
- `stripLeadingIcon(str)` — linha 1888
- `showAlert(type, title, message, duration)` — linha 1902
- `closeAlert(alertId)` — linha 1968 ← versão com animação (esta é a correta)
- `showCriticalAlert(message, duration)` — linha 2003
- `closeCriticalAlert(alertId)` — linha 2064

---

### `ui/modal.ui.js`
**Linhas de origem:** 6132–6327

Contém:
- `confirmCallback` e `cancelCallback` (variáveis) — linha 6137
- `showConfirmModal(config, onConfirm, onCancel)` — linha 6146
- `updateConfirmModalContent(config)` — linha 6198
- `hideConfirmModal()` — linha 6241
- `onConfirmAction()` — linha 6267
- `onCancelAction()` — linha 6278
- `initConfirmModalListeners()` — linha 6290
- Bloco de inicialização (DOMContentLoaded ou readyState) — linhas 6312–6317
- Exposições `window.*` — linhas 6319–6327

---

### `ui/products.ui.js`
**Linhas de origem:** 856–1059

Contém:
- `getSoftColor(id)` — linha 859
- `renderProducts()` — linha 880
- `updateProductSelections()` — linha 1038
- `buildCategories(orderIn, countsIn, preserveScroll)` — linha 745

> **Nota:** `buildCategories` está em linhas 745–851 mas pertence conceitualmente a products.ui.js.

---

### `ui/cart.ui.js`
**Linhas de origem:** 1061–1201, 3034–3161

Contém:
- `formatCurrencyInput(value)` — linha 3040
- `renderCartProductCard(productId, productData)` — linha 3056
- `updateCartDisplay()` — linha 3118
- `renderCart(resumoServidor)` — linha 1064
- `toggleCardExpansion(productId)` — linha 3167

> **Nota:** `renderCart` é depois envolvido num wrapper em `app.js` (orquestrador). O wrapper usa a variável `_originalRenderCart`. Mover `renderCart` para este ficheiro; o wrapper fica em `app.js`.

---

### `ui/cart-editing.ui.js`
**Linhas de origem:** 3162–3847 (exceto `toggleCardExpansion` que vai para `cart.ui.js`)

Contém:
- `startEditingQuantity()` — linha 3351
- `finishEditingQuantity(productId, input)` — linha 3362
- `forceSyncPendingEdit()` — linha 3397
- `validateAndUpdateQuantity(productId, input)` — linha 3405
- `updateCartProductQuantity(productId, newQty)` — linha 3491
- `updateCartProductPrice(productId, newPrice)` — linha 3531
- `preventZero(event, input)` — linha 3250
- `handleInputKeydown(event, productId)` — linha 3977
- `startEditingPrice(productId, input)` — linha 3571
- `submitEditingPrice(productId, input)` — linha 3625
- `handlePriceBlur(productId, input)` — linha 3661
- `handlePriceKeydown(event, productId, input)` — linha 3704
- `cancelEditingPrice(productId, input)` — linha 3823
- `formatPriceDisplay(value)` — linha 3749
- Código comentado (função antiga `handlePriceKeydownNumeric`) — linhas 3762–3818 ← mover como comentário

---

### `ui/payment.ui.js`
**Linhas de origem:** 4052–4779

Contém:
- `generatePaymentSlug(text)` — linha 4055
- `renderFooterPaymentCards()` — linha 4068
- `refreshPaymentMethodsOverflow()` — linha 4110
- `scheduleRefreshPaymentMethodsOverflow()` — linha 4146
- `initPaymentMethodsSlider()` — linha 4158
- `initPaymentMethodsSelection()` — linha 4194
- `selectFooterPaymentMethod(card, method)` — linha 4209
- `updateFooterPaymentCards()` — linha 4267
- `showPaymentMissing(valorEmFalta)` — linha 4360
- `updatePaymentStatus(somaPagamentos, totalAPagar)` — linha 4393
- `getSelectedPaymentMethod()` — linha 4446
- `resetFooterPaymentValues()` — linha 4454
- Funções comentadas (`setupFooterKeyboardListener`, `handleFooterKeyboardInput`) — linhas 4486–4551 ← mover como comentários
- `footerKeypadInput(value)` — linha 4553
- `backspaceFooterCash()` — linha 4564
- `clearFooterCash()` — linha 4575
- `updateFooterCashDisplay()` — linha 4581
- `getFooterCashAmount()` — linha 4591
- `initFooterKeypad()` — linha 4598
- `fillExactAmount()` — linha 4669
- `confirmFooterPaymentValue()` — linha 4738
- Exposições `window.*` — linhas 4762–4778

---

### `ui/invoice-type.ui.js`
**Linhas de origem:** 1753–1834, 2529–2600, 2628–2931, 2947–2968, 2970–3033

Contém:
- `getTipoDocumentoAtual()` — linha 1763 ← versão principal (a de checkout.module.js é duplicado)
- `selecionarFormatoFatura(formato)` — linha 1771
- `getInvoiceFormat()` — linha 1818
- `initInvoiceFormat()` — linha 1825
- `showInvoiceFormatSelector()` — linha 2530
- `hideInvoiceFormatSelector()` — linha 2546
- `selectInvoiceFormat(format)` — linha 2554
- `confirmInvoiceFormat()` — linha 2563
- `DOMContentLoaded` — radios de formato (linhas 2586–2599)
- `openPanel(panelId)` — linha 2635
- `closeClientPanel()` — linha 2691
- `closeDocPanel()` — linha 2708
- `initInvoiceTypePanelToggles()` — linha 2725
- `updateStickyDocTypeLabel()` — linha 2803
- `updateInvoiceTypeDisplay(invoiceType)` — linha 2826
- `updateCartFooterLockIcons(invoiceType)` — linha 2879
- `updateInvoiceFormatDisplay(format)` — linha 2936
- `DOMContentLoaded` — `initInvoiceTypePanelToggles` + `loggedUserArea` alert + `formatSubOptions` init (linhas 2947–2968)
- `closePanel(panelId)` — linha 2973
- `selectClient(clientId, clientName)` — linha 2985
- `openNewClientFormPanel()` — linha 3023
- Comentário sobre remoção do código antigo — linha 3028

---

### `ui/order-summary.ui.js`
**Linhas de origem:** 4780–4993

Contém:
- `initOrderSummarySlider()` — linha 4784
- `updateOrderSummaryFooter(netTotal, taxTotal, retention, totalPagar)` — linha 4957
- `getOrderObservation()` — linha 4982
- Exposições `window.*` — linhas 4990–4993

---

### `ui/search.ui.js`
**Linhas de origem:** 1290–1544

Contém:
- `debouncedSearch` (const com debounce) — linha 1295
- `processBarcodeFromSearch(barcode)` — linha 1412
- `searchInput.addEventListener('keydown', ...)` — listener Enter/barcode — linha 1369
- `searchInput.addEventListener('input', debouncedSearch)` — linha 1507
- `clearSearch.addEventListener('click', ...)` — listener de limpar pesquisa — linha 1509
- `setupHeaderSearchToggle` IIFE — linha 1524

---

### `ui/bottom-sheet.ui.js`
**Linhas de origem:** 6346–6655

Contém:
- `initBottomSheetSystem()` — linha 6347 (função completa com todas as sub-funções internas)

---

### `app.js` (Orquestrador)

O `app.js` final deve ser **o mais pequeno possível** — apenas a inicialização e a "cola" entre módulos. Contém:

**Da linha 1603–1644:** `init()` e a chamada `init()`

**Da linha 1646–1751:** `initSSE()`, `closeSSE()`, `window.addEventListener('beforeunload', closeSSE)`

**Da linha 1561–1601:** `updateDateTime()`, `updateResponsiveUI()`

**Da linha 1553–1559:** Listener do main nav (`.nav-link`)

**Da linha 1836–1882:** IIFE `setupResponsiveMenu`

**Da linha 1551:** `clearCartBtn?.addEventListener('click', () => clearCart())`

**Da linha 2079–2101:** `DOMContentLoaded` — fullNameInput listener + `clientSelected` event listener

**Da linha 2600–2626:** Wrapper de `renderCart`:
```js
const _originalRenderCart = renderCart;
renderCart = function (...args) { ... };
function notifyCartChange() { ... }
document.addEventListener('cartChanged', ...);
```

**Da linha 4657–4663:** `DOMContentLoaded` — inicialização final:
```js
document.addEventListener('DOMContentLoaded', function () {
  loadFooterPaymentMethods();
  initOrderSummarySlider();
  initFooterKeypad();
  if (typeof initBottomSheetSystem === 'function') initBottomSheetSystem();
});
```

**Exposição global de `handleClientSelection`:** Ponte entre `clientes.js` e o sistema. Se não existir explicitamente no `app.js` original, adicionar:
```js
window.handleClientSelection = function(id, nome, dados) {
  // atualiza botão cliente no UI
  const topSelectedClient = document.getElementById('topSelectedClient');
  if (topSelectedClient) topSelectedClient.textContent = nome;
  const stickyClientLabel = document.getElementById('stickyClientLabel');
  if (stickyClientLabel) stickyClientLabel.textContent = nome;
};
```

---

## Ordem de Carregamento em `index.php`

Substituir a tag `<script src="../assets/js/app.js">` pela sequência abaixo (mantendo os scripts externos e os já existentes `clientes.js`, `monetary-formatter.js`, `fatura.js`, `fatura80.js` **antes** desta lista):

```html
<!-- Bibliotecas externas (manter como estão) -->
<!-- Tailwind, Font Awesome, QRCode, etc. -->

<!-- Módulos de suporte existentes (manter antes do app) -->
<script src="../assets/js/monetary-formatter.js"></script>
<script src="../assets/js/clientes.js"></script>
<script src="../assets/js/fatura.js"></script>
<script src="../assets/js/fatura80.js"></script>

<!-- === NOVA ESTRUTURA APP.JS === -->

<!-- 1. Estado global (carregado primeiro — todos dependem disto) -->
<script src="../assets/js/state.js"></script>

<!-- 2. Referências DOM (carregado antes dos módulos que as usam) -->
<script src="../assets/js/dom.js"></script>

<!-- 3. Utilitários genéricos -->
<script src="../assets/js/utils.js"></script>

<!-- 4. Serviços (fetch ao backend) -->
<script src="../assets/js/services/cliente.service.js"></script>
<script src="../assets/js/services/produto.service.js"></script>
<script src="../assets/js/services/pedido.service.js"></script>
<script src="../assets/js/services/pagamento.service.js"></script>

<!-- 5. Módulos de lógica de negócio -->
<script src="../assets/js/modules/invoice-assets.module.js"></script>
<script src="../assets/js/modules/cart.module.js"></script>
<script src="../assets/js/modules/barcode.module.js"></script>
<script src="../assets/js/modules/checkout.module.js"></script>

<!-- 6. Camada de UI (ordem importa: alerts e modal primeiro, depois componentes) -->
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

<!-- 7. Orquestrador (carregado por último) -->
<script src="../assets/js/app.js"></script>
```

---

## Regras para o Agente seguir

### 1. Nunca apagar, sempre mover
Nenhuma linha de JavaScript deve ser removida. Cada linha do `app.js` original deve aparecer em exatamente um dos ficheiros de destino.

### 2. Manter a ordem dentro de cada ficheiro
Dentro de cada ficheiro de destino, manter a ordem original das funções tal como aparecem no `app.js`. Não reordenar funções.

### 3. Nunca renomear funções
Nenhuma função deve ser renomeada. O objetivo é apenas reorganizar, não refatorar a semântica.

### 4. Comentário de identificação no topo de cada ficheiro
Cada ficheiro deve começar com um bloco de comentário identificador:

```js
/* ================================================
   MÓDULO: Cart Module
   Ficheiro: assets/js/modules/cart.module.js
   Parte do sistema Dash-POS
   ================================================ */
```

### 5. Código duplicado
Existem duas versões de `closeAlert` e `getTipoDocumentoAtual`. **Mover ambas** para os ficheiros indicados mas marcar a secundária:
```js
/* DUPLICADO - versão principal em alerts.ui.js / invoice-type.ui.js */
```

### 6. Código comentado (legacy)
Blocos de código comentado (como `handlePriceKeydownNumeric`, `setupFooterKeyboardListener`, `handleFooterKeyboardInput`) devem ser **movidos com os comentários intactos**, sem apagar.

### 7. Código de debug
As funções `testRender80mm` e `debug80mmContainer` devem ser marcadas com:
```js
/* DEBUG - pode ser removido em produção */
```

### 8. Exposições `window.*`
Todos os blocos `window.funcaoX = funcaoX` devem permanecer **no mesmo ficheiro onde a função está definida**, nunca separados.

### 9. Validação após migração
Após criar todos os ficheiros e atualizar `index.php`, abrir o browser e confirmar que:
- [ ] Produtos carregam na grelha
- [ ] Categorias funcionam
- [ ] Adicionar ao carrinho funciona
- [ ] SSE não dá erro na consola
- [ ] Pagamento completo (fatura-recibo) funciona
- [ ] Alertas aparecem corretamente
- [ ] Bottom sheet mobile funciona

Se algo quebrar, o problema está provavelmente na **ordem de carregamento dos scripts** em `index.php`. Ajustar a ordem sem alterar os ficheiros de destino.

---

## Ordem de Execução para o Agente

1. Criar as pastas: `assets/js/services/`, `assets/js/modules/`, `assets/js/ui/`
2. Criar `state.js` (linhas 1–37, 55–60, 252–255, 279, 3359–3360 do original)
3. Criar `dom.js` (linhas 534–558)
4. Criar `utils.js` (linhas 257–276, 563–586)
5. Criar `services/cliente.service.js` (linhas 592–633)
6. Criar `services/produto.service.js` (linhas 635–656, 679–743)
7. Criar `services/pedido.service.js` (linhas 285–390, 436–530)
8. Criar `services/pagamento.service.js` (linhas 4005–4050)
9. Criar `modules/invoice-assets.module.js` (linhas 47–246)
10. Criar `modules/cart.module.js` (linhas 392–433, 1275–1288, 2500–2525, 3849–3971)
11. Criar `modules/barcode.module.js` (linhas 2105–2453, 2458–2499)
12. Criar `modules/checkout.module.js` (linhas 5000–5186, 5191–5948, 5953–5966, 5975–6024, 6027–6131, 6333–6344)
13. Criar `ui/skeleton.ui.js` (linhas 658–677)
14. Criar `ui/alerts.ui.js` (linhas 1887–2076)
15. Criar `ui/modal.ui.js` (linhas 6132–6327)
16. Criar `ui/products.ui.js` (linhas 745–851, 856–1059)
17. Criar `ui/cart.ui.js` (linhas 1061–1201, 3034–3161, 3162–3248 `toggleCardExpansion`)
18. Criar `ui/cart-editing.ui.js` (linhas 3250–3847, 3977–3993)
19. Criar `ui/payment.ui.js` (linhas 4052–4779)
20. Criar `ui/invoice-type.ui.js` (linhas 1753–1834, 2529–2600, 2628–2968, 2970–3033)
21. Criar `ui/order-summary.ui.js` (linhas 4780–4993)
22. Criar `ui/search.ui.js` (linhas 1290–1544)
23. Criar `ui/bottom-sheet.ui.js` (linhas 6346–6655)
24. Criar o novo `app.js` orquestrador com o conteúdo descrito na secção acima
25. Atualizar `pages/index.php` para substituir `<script src="../assets/js/app.js">` pela lista de scripts na ordem definida
26. Manter o `app.js` original como backup (ex.: `app.js.bak`) até confirmação visual
27. Testar no browser e verificar checklist de validação

---

**Estado:** Plano criado. Aguarda execução pelo agente.
Para saber onde fazer modificações futuras no JS, consultar este documento ou o `docs/mapa-js-dash-pos.md` (a criar após a refatoração).
