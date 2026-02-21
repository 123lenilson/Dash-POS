# Mapa JavaScript — Dash-POS

**Objetivo:** Referência da arquitetura da pasta `assets/js` após a refatoração. Descreve todos os ficheiros, o que fazem em poucas linhas e como se ligam entre si. Usar sempre que fores modificar ou adicionar lógica no frontend do POS.

---

## 1. Estrutura e ordem de carregamento

Os scripts são carregados no `pages/index.php` **nesta ordem**. A ordem é crítica: cada ficheiro pode depender de variáveis/funções definidas nos anteriores.

```
assets/js/
├── (suporte — carregados primeiro)
│   ├── ui/invoice/
│   │   ├── fatura.js
│   │   └── fatura80.js
│   ├── services/cliente.service.js
│   ├── modules/client.module.js
│   ├── ui/client-panel.ui.js
│   └── utils/
│       └── monetary-formatter.js
│
├── (núcleo do app refatorado)
│   ├── state.js
│   ├── dom.js
│   └── utils.js
│
├── services/          ← Chamadas ao backend (fetch)
│   ├── cliente.service.js   (também carregado no bloco suporte)
│   ├── produto.service.js
│   ├── pedido.service.js
│   └── pagamento.service.js
│
├── modules/           ← Lógica de negócio (sem DOM direto)
│   ├── client.module.js     (também carregado no bloco suporte)
│   ├── invoice-assets.module.js
│   ├── cart.module.js
│   ├── barcode.module.js
│   └── checkout.module.js
│
├── ui/                ← DOM, renderização e eventos
│   ├── invoice/             (faturas A4 e 80mm)
│   │   ├── fatura.js
│   │   └── fatura80.js
│   ├── client-panel.ui.js    (também carregado no bloco suporte)
│   ├── skeleton.ui.js
│   ├── alerts.ui.js
│   ├── modal.ui.js
│   ├── products.ui.js
│   ├── cart.ui.js
│   ├── cart-editing.ui.js
│   ├── payment.ui.js
│   ├── invoice-type.ui.js
│   ├── order-summary.ui.js
│   ├── search.ui.js
│   └── bottom-sheet.ui.js
│
├── utils/             ← Utilitários (pasta; distinto do ficheiro utils.js)
│   └── monetary-formatter.js
│
└── app.js             ← Orquestrador (init, SSE, bridges, DOMContentLoaded)
```

**Notas:**
- Existe `app.js.bak` (backup do app monolítico original); não é carregado pela página.
- A **pasta** `utils/` contém apenas `monetary-formatter.js`; o ficheiro **utils.js** na raiz de `assets/js` é o núcleo (helpers, debounce, connectMonetaryInput).

---

## 2. Ficheiros de suporte (carregados antes do núcleo)

Estes scripts são carregados **antes** de state/dom/utils no `index.php`.

| Ficheiro | Resumo | Ligações |
|----------|--------|----------|
| **ui/invoice/fatura.js** | Renderiza fatura **A4** (múltiplas páginas, QR, total por extenso). Expõe `renderizarFaturaComPaginas`, `renderizarFaturaComDadosBackend`, `prepararDadosFatura`, `formatarMoeda`. | Usado por **checkout.module.js** após venda; carrega CSS via **invoice-assets.module**. |
| **ui/invoice/fatura80.js** | Renderiza recibo **80mm** (térmico). Expõe `renderizarFatura80`, `renderizarFatura80ComDadosBackend`, `prepararDadosFatura80`, `formatarMoeda`. | Usado por **checkout.module.js** após venda; CSS via **invoice-assets.module**. |
| **services/cliente.service.js** | Chamadas à API de clientes: `listarClientes`, `verificarOuCriarCliente`, etc. | **client.module.js** e **client-panel.ui.js** usam para listar e cadastrar. |
| **modules/client.module.js** | Lógica de cliente: estado do painel, seleção, `getSelectedClient`, `selectClient`, `clearClient`, `openPanel`, `closePanel`. | **client-panel.ui.js** renderiza; **app.js** define `window.handleClientSelection`; **invoice-type.ui.js** abre painel. |
| **ui/client-panel.ui.js** | UI do painel de clientes: lista, pesquisa, botão cadastrar, emissão de `clientSelected`. | **client.module.js** fornece dados e ações; **checkout.module.js** usa cliente selecionado. |
| **utils/monetary-formatter.js** | Classe `MonetaryFormatter`: formata input monetário (Kz, pt-AO), keypad, operações +/−. | **utils.js** usa `connectMonetaryInput` (instancia `MonetaryFormatter`); **payment.ui.js** usa para o input de valor recebido. |

---

## 3. Núcleo (state, dom, utils)

| Ficheiro | Resumo | Ligações |
|----------|--------|----------|
| **state.js** | Estado global: `PRODUCTS`, `currency`, `cart` (Map), `activeCategory`, `searchTerm`, variáveis de edição, pagamento (`footerPaymentMethods`, `footerValoresPorMetodo`, `footerCashAmount`), SSE (`sseConnection`, constantes), tipo/formato de documento, `invoiceAssetsState`, `idClientePadrao`, `lastCartHash`, `lastExpandedProductId`, `finishEditingTimeout`, `pendingSync`. | Quase todos os módulos e UI leem/escrevem aqui. |
| **dom.js** | Referências a elementos do DOM: `dateTimeEl`, `categoryBar`, `productGrid`, `searchInput`, `clearSearch`, lista e overlays do carrinho, `clearCartBtn`. | UI e módulos usam estas constantes para não repetir `getElementById`. |
| **utils.js** | `connectMonetaryInput`, `debounce`, `nowFancy`, `placeholderIMG`, `isMobileView()` (905px). Funções puras/helpers. | **app.js** usa `nowFancy`; **search.ui.js** usa `debounce`; **payment.ui.js** e outros usam `connectMonetaryInput` / `isMobileView`. |

---

## 4. Services (backend)

| Ficheiro | Resumo | Ligações |
|----------|--------|----------|
| **cliente.service.js** | `carregarClientePadrao()` — fetch ao `api/cliente.php?acao=buscar_consumidor_final`, preenche `idClientePadrao`. Em erro chama `showCriticalAlert`. | Chamado em **app.js** `init()`; **checkout.module.js** usa `idClientePadrao`. |
| **produto.service.js** | `carregarProdutos()` — fetch `api/produtos.php?acao=listar_prod`, chama `atualizarProdutos(produtos)`. `atualizarProdutos` atualiza `PRODUCTS` e chama `buildCategories` + `renderProducts`. | **app.js** chama no init; **products.ui.js** fornece `buildCategories` e `renderProducts`. |
| **pedido.service.js** | `syncToAPI(id, qtyOverride, priceOverride)` — POST para `api/pedido.php?acao=adicionar_pedido`; em sucesso chama `loadCartFromAPI()`. `loadCartFromAPI()` — GET pedido atual e atualiza carrinho + UI. | **cart.module.js** chama `syncToAPI`; **cart.ui.js** usa `renderCart` (chamado após loadCartFromAPI). |
| **pagamento.service.js** | `loadFooterPaymentMethods()` — fetch métodos de pagamento, preenche `footerPaymentMethods`, chama `renderFooterPaymentCards` e `generatePaymentSlug`. | Chamado em **app.js** DOMContentLoaded; depende de **payment.ui.js** para render e slug. |

---

## 5. Modules (lógica de negócio)

| Ficheiro | Resumo | Ligações |
|----------|--------|----------|
| **client.module.js** | Lógica de cliente: estado do painel (aberto/fechado), cliente selecionado, `getSelectedClient`, `selectClient`, `clearClient`, `openPanel`, `closePanel`. Coordena com **cliente.service** e **client-panel.ui**. | Carregado no bloco suporte; **client-panel.ui.js** e **invoice-type.ui.js** usam. |
| **invoice-assets.module.js** | Carrega CSS de faturas (`loadCSS`), `loadInvoiceAssets(format)`, `areInvoiceAssetsLoaded`, `resetInvoiceAssetsState`, `applyInvoicePrintStyles(format)`. Estado em `invoiceAssetsState`. | **checkout.module.js** chama antes de renderizar A4/80mm. |
| **cart.module.js** | `addToCart`, `removeFromCart`, `showRemoveConfirmation`, `removeCartProduct`, `clearCart`, `showRemoveAllConfirmation`. Usa `cart`, `syncToAPI`, `renderCart`, `updateCartDisplay`, `showAlert`, `showConfirmModal`, `resetFooterPaymentValues`. | **products.ui.js** (add); **cart.ui.js** (render, clear, remove); **modal.ui.js** (confirmações). |
| **barcode.module.js** | Config e estado do scanner; `toggleBarcodeScanner`, `processBarcode`, `showBarcodeStatus`, `showBarcodeLastScan`, `playBeepSound`, `showBarcodeStats`. Listener global de teclado para scanner; DOMContentLoaded para toggle. | **search.ui.js** pode usar `processBarcodeFromSearch`; UI da barra de pesquisa mostra modo barcode. |
| **checkout.module.js** | `getIdClienteForDocument`, `collectPaymentData`, animação do botão Pagar, `processProformaInvoice`, `processOrcamentoInvoice`, `processFaturaInvoice`, `processReceiptInvoice`, `clearCartAfterSale`, `initPayButton`. Carrega assets de fatura, chama `renderizarFaturaComDadosBackend` / `renderizarFatura80ComDadosBackend`. Inclui versão LEGACY de `closeAlert` e duplicado de `getTipoDocumentoAtual`; funções DEBUG (testRender80mm, etc.). | Usa **invoice-assets**, **fatura.js**, **fatura80.js**, **alerts.ui.js**, **invoice-type.ui.js** (tipo doc), **payment.ui.js** (dados de pagamento), cliente via **client.module**. |

---

## 6. UI (renderização e eventos)

| Ficheiro | Resumo | Ligações |
|----------|--------|----------|
| **client-panel.ui.js** | UI do painel de clientes: lista, pesquisa, botão cadastrar, emissão de `clientSelected`. Renderiza e liga eventos ao **client.module** e **cliente.service**. | Carregado no bloco suporte; **invoice-type.ui.js** abre o painel; **app.js** define `handleClientSelection`. |
| **skeleton.ui.js** | `skeletonMarkProductsReady`, `skeletonMarkCartReady`, `skeletonTryHide` — esconder o loading skeleton. | **app.js** init e **produto.service** / **pedido.service** quando dados estão prontos. |
| **alerts.ui.js** | `showAlert(type, title, message, duration)`, `closeAlert(alertId)`, `showCriticalAlert`, `closeCriticalAlert`. | Chamado por quase todos os módulos e services para feedback. |
| **modal.ui.js** | Modal de confirmação: `showConfirmModal`, `updateConfirmModalContent`, `hideConfirmModal`, `onConfirmAction`, `onCancelAction`, `initConfirmModalListeners`. | **cart.module.js** (confirmar limpar/remover); outros para ações destrutivas. |
| **products.ui.js** | `buildCategories`, `getSoftColor`, `renderProducts`, `updateProductSelections`. Preenche `productGrid` e barra de categorias. | **produto.service.js** chama após carregar produtos; **cart.module** (add) pode marcar seleção. |
| **cart.ui.js** | `renderCart`, `formatCurrencyInput`, `renderCartProductCard`, `updateCartDisplay`, `toggleCardExpansion`. Liga cliques em “checkout” a `checkout()` e “clear” a `showRemoveAllConfirmation`. | **pedido.service** (após loadCartFromAPI); **cart.module**; **cart-editing.ui.js** (expansão/edição). |
| **cart-editing.ui.js** | Edição inline: quantidade (start/finish/validate), preço (start/submit/cancel/blur/keydown), `updateCartProductQuantity`, `updateCartProductPrice`, `forceSyncPendingEdit`, etc. | Usa **cart** (state), **syncToAPI**, **renderCart**, **updateCartDisplay**; eventos em elementos renderizados por **cart.ui.js**. |
| **payment.ui.js** | Footer de pagamento: `renderFooterPaymentCards`, keypad (input, backspace, clear, exact, confirm), `updatePaymentStatus`, `showPaymentMissing`, `resetFooterPaymentValues`, `getSelectedPaymentMethod`, `getFooterCashAmount`, etc. | **pagamento.service** chama render; **checkout.module** usa dados de pagamento e keypad; usa **MonetaryFormatter** (utils/monetary-formatter.js). |
| **invoice-type.ui.js** | Tipo/formato de documento: `getTipoDocumentoAtual`, `getInvoiceFormat`, `selecionarFormatoFatura`, `initInvoiceFormat`, painéis (open/close client, doc), `initInvoiceTypePanelToggles`, `updateStickyDocTypeLabel`, `updateCartFooterLockIcons`, etc. | **checkout.module** lê tipo/formato; **client.module** e **client-panel.ui** para painel cliente; **bottom-sheet** mostra painel tipo doc. |
| **order-summary.ui.js** | `initOrderSummarySlider`, `updateOrderSummaryFooter`, `getOrderObservation`. Slider resumo/OBS no rodapé do carrinho. | **app.js** chama init; **checkout.module** usa observação e totais. |
| **search.ui.js** | `debouncedSearch`, `processBarcodeFromSearch`, listeners em `searchInput` e `clearSearch`, IIFE `setupHeaderSearchToggle` (mover search para header em mobile). | Usa **state** (searchTerm, PRODUCTS), **dom** (searchInput, clearSearch); **barcode** pode integrar. |
| **bottom-sheet.ui.js** | `initBottomSheetSystem()`: abre/fecha sheet móvel, conteúdo “Carrinho” / “Cliente” / “Tipo de Factura”, abas, injeção do painel desktop. Expõe `openBottomSheet`. | **app.js** chama init e define `checkout()` que abre sheet do carrinho; **invoice-type** e **client-panel** são mostrados no sheet. |

---

## 7. Orquestrador

| Ficheiro | Resumo | Ligações |
|----------|--------|----------|
| **app.js** | Inicialização única: listener `clearCartBtn` → `clearCart`; nav (`.nav-link`); `updateDateTime`, `updateResponsiveUI`; `init()` (carregarClientePadrao → carregarProdutos, loadCartFromAPI, SSE, initInvoiceFormat, initPayButton); `initSSE`, `closeSSE`; IIFE menu responsivo; DOMContentLoaded (fullNameInput, `clientSelected`, wrapper de `renderCart` + `cartChanged`); DOMContentLoaded final (loadFooterPaymentMethods, initOrderSummarySlider, initFooterKeypad, initBottomSheetSystem). Define `window.handleClientSelection` e `window.checkout`. | Depende de todos os services, modules e ui; não contém lógica de negócio, só “cola” e ordem de execução. |

---

## 8. Fluxo resumido (quem chama quem)

- **Início:** `app.js` → `init()` → `carregarClientePadrao` → `carregarProdutos` + `loadCartFromAPI` + `initSSE` + `initInvoiceFormat` + `initPayButton`.
- **Produtos:** `produto.service` → `atualizarProdutos` → `buildCategories` + `renderProducts` (products.ui).
- **Carrinho:** utilizador adiciona → **cart.module** `addToCart` → **pedido.service** `syncToAPI` → `loadCartFromAPI` → **cart.ui** `renderCart`.
- **Pagamento:** **payment.ui** (keypad, métodos); ao clicar Pagar → **checkout.module** (collectPaymentData, process*Invoice) → **invoice-assets** (load) → **fatura.js** ou **fatura80.js** (render) → **clearCartAfterSale**.
- **Cliente:** **client-panel.ui** + **client.module** selecionam cliente → `clientSelected` / `handleClientSelection` (app.js) → atualiza labels; **checkout.module** usa `getIdClienteForDocument` (idClientePadrao ou cliente escolhido).
- **Mobile:** **bottom-sheet.ui** abre com conteúdo cart/cliente/tipo doc; **app.js** `checkout()` abre sheet “Carrinho”; **search.ui** move barra de pesquisa para o header (≤905px).

---

## 9. Onde fazer o quê (referência rápida)

| Queres… | Ficheiro(s) |
|--------|--------------|
| Alterar estado global (carrinho, pagamento, SSE, tipo doc) | `state.js` |
| Alterar referências a elementos do DOM | `dom.js` |
| Novos helpers / debounce / isMobileView | `utils.js` |
| Chamadas à API de clientes/produtos/pedidos/pagamentos | `services/*.js` (cliente.service, produto.service, etc.) |
| Lógica de cliente (seleção, painel) | `modules/client.module.js` |
| Formatação monetária (classe global) | `utils/monetary-formatter.js` |
| Carregar CSS de fatura ou estilos de impressão | `modules/invoice-assets.module.js` |
| Render de fatura A4 / recibo 80mm | `ui/invoice/fatura.js`, `ui/invoice/fatura80.js` |
| Lógica de adicionar/remover/limpar carrinho | `modules/cart.module.js` |
| Código de barras / scanner | `modules/barcode.module.js` |
| Fluxo de pagamento e fatura (processar venda, A4/80mm) | `modules/checkout.module.js` |
| Skeleton de loading | `ui/skeleton.ui.js` |
| Alertas e alerta crítico | `ui/alerts.ui.js` |
| Modal de confirmação | `ui/modal.ui.js` |
| Grelha de produtos e categorias | `ui/products.ui.js` |
| Render do carrinho e cartões de produto | `ui/cart.ui.js` |
| Edição de quantidade/preço no carrinho | `ui/cart-editing.ui.js` |
| Rodapé de pagamento (keypad, métodos, valor) | `ui/payment.ui.js` |
| Tipo/formato de documento e painéis cliente/doc | `ui/invoice-type.ui.js` |
| Painel de clientes (lista, pesquisa, cadastro) | `ui/client-panel.ui.js` |
| Resumo e OBS no rodapé | `ui/order-summary.ui.js` |
| Pesquisa e clear | `ui/search.ui.js` |
| Bottom sheet (mobile) | `ui/bottom-sheet.ui.js` |
| Ordem de init, SSE, bridges, menu responsivo | `app.js` |

---

*Mapa criado após refatoração JS (PLANO-JS-DASH-POS). Arquitetura atual de `assets/js` — Dash-POS.*
