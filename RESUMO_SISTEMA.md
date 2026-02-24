# Resumo do sistema – Dash-POS (L&P POS Dashboard)

## 1. Estrutura do projeto

```
Dash-POS/
├── api/                    # Endpoints REST (PHP)
│   ├── cliente.php         # CRUD e busca de clientes
│   ├── pagamento.php       # Listagem de métodos de pagamento
│   ├── pedido.php          # Adicionar/listar pedidos (mesa/conta)
│   ├── produtos.php        # Listar e pesquisar produtos
│   ├── stream.php          # SSE – atualização em tempo real (produtos)
│   └── vender.php          # Processar venda/fatura (fatura-recibo, proforma, etc.)
├── app/
│   ├── config/
│   │   └── conexao.php     # Singleton MySQL (BD: wenkamba)
│   ├── Control/            # Controllers (validação e orquestração)
│   │   ├── ClienteControl.php
│   │   ├── PagamentoControl.php
│   │   ├── PedidoControl.php
│   │   ├── ProdutoControl.php
│   │   └── VendaControl.php
│   └── Model/              # Acesso a dados
│       ├── ClienteModel.php
│       ├── PagamentoModel.php
│       ├── PedidoModel.php
│       ├── ProdutoModel.php
│       └── VendaModel.php
├── assets/
│   ├── css/                # Estilos (ver secção 5 — arquitetura CSS refatorada)
│   │   ├── main.css        # Ponto de entrada único do dashboard (index.php referencia só este)
│   │   ├── base/           # variables.css, reset.css, typography.css
│   │   ├── layout/         # interface.css, responsive.css (todos os @media globais)
│   │   ├── components/     # skeleton, header, search, categories, product-card, cart, cart-footer, keypad, payment-methods, invoice-type, client-btn, client-panel, bottom-sheet, alerts, modals
│   │   ├── fatura.css      # Impressão A4 (carregado dinamicamente)
│   │   └── fatura80.css    # Impressão 80mm (carregado dinamicamente)
│   └── js/                 # Ordem de carregamento é crítica (ver secção 4 e docs/mapa-js-dash-pos.md)
│       ├── (suporte — carregados primeiro)
│       │   ├── ui/invoice/     # fatura.js (A4), fatura80.js (80mm)
│       │   ├── services/      # cliente.service.js
│       │   ├── modules/       # client.module.js
│       │   ├── ui/            # client-panel.ui.js
│       │   └── utils/         # monetary-formatter.js
│       ├── (núcleo)          # state.js, dom.js, utils.js
│       ├── services/         # cliente, produto, pedido, pagamento (fetch ao backend)
│       ├── modules/          # client, invoice-assets, cart, barcode, checkout (lógica de negócio)
│       ├── ui/               # skeleton, alerts, modal, products, cart, cart-editing, payment, invoice-type, order-summary, search, bottom-sheet (+ invoice/ e client-panel)
│       ├── utils/            # monetary-formatter.js (pasta; utils.js é ficheiro na raiz)
│       └── app.js            # Orquestrador: init, SSE, bridges, DOMContentLoaded (não contém lógica de negócio)
├── pages/
│   └── index.php           # Página principal do POS (dashboard)
└── (outros ficheiros/pastas na raiz)
```

#### Fora de uso no sistema

Estes ficheiros/pastas existem no projeto mas **não estão em uso** no sistema atual:

- **assets/js:** `cardapio.js`, `fetchData.js`, `login.js`, `tailwind.js`; existe `app.js.bak` (backup do app monolítico original), não é carregado.
- **pages:** `login.php`; `teste.html`, `FAT-pe.html`, `fatura80-exemplo.html` (e outras páginas que usam cardápio/fetchData)
- **Raiz:** `cardapioModel.php`
- **Pastas:** `FACTURAS/` (armazenamento de faturas); `.claude`, `.git`, `.qoder` (configuração/versão — não fazem parte da aplicação em execução)

A gestão de clientes deixou de ser um único `clientes.js`: está refatorada em `client.module.js`, `client-panel.ui.js` e `cliente.service.js` (ver secção 4).

---

## 2. Stack técnico

| Camada      | Tecnologia |
|------------|------------|
| Backend    | PHP (XAMPP), MySQL (BD `wenkamba`) |
| Frontend   | HTML/CSS (dashboard: main.css + base/layout/components; ver secção 5), JavaScript (vanilla, modular — state/dom/utils, services, modules, ui), Font Awesome |
| API        | REST (GET/POST) + JSON; SSE em `stream.php` |
| Moeda      | AOA (Kwanza – Angola), formatação `pt-AO` |

---

## 3. Funcionamento geral

### Fluxo de dados

1. **Frontend** (`pages/index.php` + `assets/js/`):  
   O **app.js** é o orquestrador (init, SSE, bridges); não contém lógica de negócio. O estado global vive em **state.js**, referências ao DOM em **dom.js**, helpers em **utils.js**. A interface é construída por módulos **ui/** (products, cart, payment, invoice-type, client-panel, bottom-sheet, etc.) e a lógica por **modules/** (cart, checkout, client, barcode, invoice-assets). Os **services/** fazem o `fetch()` às APIs.

2. **Comunicação com o servidor:**  
   - **REST:** chamadas `fetch()` a partir de `services/*.js` para `api/*.php` (produtos, cliente, pedido, pagamento, vender).  
   - **Tempo real:** `EventSource` para `api/stream.php` (SSE), inicializado no **app.js**; atualiza a lista de produtos quando há alterações na base.

3. **API (api/*.php):**  
   Recebe o pedido, valida (e eventualmente lê JSON do body), chama o **Control** correspondente.

4. **Control (app/Control/*):**  
   Valida regras de negócio e chama o **Model** para ler/escrever na base.

5. **Model (app/Model/*):**  
   Usa `Conexao::getConexao()` (MySQL, UTF-8) para executar SQL e devolver dados ao Control, que por sua vez devolve JSON ao frontend.

### Fluxo de uma venda (exemplo)

- **Início:** `app.js` → `init()` → `carregarClientePadrao` (cliente.service) → `carregarProdutos` (produto.service) + `loadCartFromAPI` (pedido.service) + `initSSE` + `initInvoiceFormat` + `initPayButton`.
- **Produtos:** produto.service → `atualizarProdutos` → `buildCategories` + `renderProducts` (products.ui.js).
- **Carrinho:** utilizador adiciona item → **cart.module.js** `addToCart` → **pedido.service.js** `syncToAPI` → `loadCartFromAPI` → **cart.ui.js** `renderCart`.
- **Checkout:** utilizador escolhe cliente (painel **client-panel.ui.js** + **client.module.js**), métodos de pagamento (**payment.ui.js** + pagamento.service), tipo/formato de documento (**invoice-type.ui.js**). Ao clicar Pagar → **checkout.module.js** (collectPaymentData, process*Invoice) → **invoice-assets.module.js** carrega CSS da fatura → **fatura.js** (A4) ou **fatura80.js** (80mm) renderizam → `clearCartAfterSale`.
- **Cliente:** seleção emite `clientSelected` / `window.handleClientSelection` (app.js); checkout usa `getIdClienteForDocument` (idClientePadrao ou cliente escolhido).
- **Mobile (≤905px):** **bottom-sheet.ui.js** mostra carrinho/cliente/tipo doc; `checkout()` abre o sheet do carrinho; **search.ui.js** move a barra de pesquisa para o header.

### Documentos fiscais / impressão

- Tipos suportados no fluxo: `fatura-recibo`, `fatura-proforma`, `fatura`, `orcamento`.
- Dois formatos de impressão: **A4** (`fatura.css` + `ui/invoice/fatura.js`) e **80mm** (`fatura80.css` + `ui/invoice/fatura80.js`), carregados dinamicamente pelo **invoice-assets.module.js** conforme seleção.

### Outros módulos (em uso)

- **Clientes:** listagem, pesquisa e criação via **client.module.js**, **client-panel.ui.js** e **cliente.service.js** (`api/cliente.php`).
- **Pedidos (carrinho):** **pedido.service.js** com `syncToAPI` e `loadCartFromAPI` (`api/pedido.php`).
- **Código de barras:** **barcode.module.js** (toggle scanner, processBarcode, listener global).
- **Edição no carrinho:** **cart-editing.ui.js** (quantidade e preço inline; sync com API).

---

## 4. Arquitetura JavaScript do dashboard (refatorada)

O JavaScript do POS está **modularizado**: a ordem de carregamento no `pages/index.php` é crítica (cada ficheiro pode depender de variáveis/funções definidas nos anteriores).

- **Núcleo:** `state.js` (estado global: carrinho, pagamento, SSE, tipo documento, etc.), `dom.js` (referências a elementos do DOM), `utils.js` (connectMonetaryInput, debounce, nowFancy, isMobileView — 905px).
- **Services:** chamadas ao backend (cliente, produto, pedido, pagamento); ex.: `carregarProdutos`, `syncToAPI`, `loadCartFromAPI`, `loadFooterPaymentMethods`.
- **Modules:** lógica de negócio sem DOM direto (client, invoice-assets, cart, barcode, checkout).
- **UI:** renderização e eventos (skeleton, alerts, modal, products, cart, cart-editing, payment, invoice-type, order-summary, search, bottom-sheet, client-panel, invoice/fatura e fatura80).
- **Orquestrador:** `app.js` — inicialização única, listeners, `init()`, SSE, `DOMContentLoaded` (loadFooterPaymentMethods, initOrderSummarySlider, initBottomSheetSystem, etc.); define `window.handleClientSelection` e `window.checkout`.

**Referência completa:** `docs/mapa-js-dash-pos.md` (todos os ficheiros, o que fazem e onde fazer alterações). Módulos de fatura e formatador monetário: `docs/assets-js-modulos.md`.

---

## 5. Arquitetura CSS do dashboard (refatorada)

O CSS da interface do POS (dashboard) **não** está num único ficheiro. Foi refatorado e está organizado assim:

- **Ponto de entrada:** `assets/css/main.css` — é o **único** ficheiro CSS do dashboard referenciado em `pages/index.php`. Contém apenas `@import` dos restantes ficheiros.
- **`assets/css/base/`** — `variables.css` (tokens `:root`, cores, fontes, espaçamentos), `reset.css` (box-sizing, body, scrollbars), `typography.css` (minimal).
- **`assets/css/layout/`** — `interface.css` (grid .interface, .main, .side, .checkout-panel) e **`responsive.css`** (todos os blocos `@media` que afetam o layout global).
- **`assets/css/components/`** — um ficheiro por área: skeleton, header, search, categories, product-card, cart, cart-footer, keypad, payment-methods, invoice-type, client-btn, client-panel, bottom-sheet, alerts, modals.

Os ficheiros **`fatura.css`** e **`fatura80.css`** continuam em `assets/css/` e são carregados dinamicamente para impressão; não fazem parte da árvore importada por `main.css`.

**Para modificações:** usar **`docs/mapa-css-dash-pos.md`** para saber em que ficheiro atuar (ex.: alterar cabeçalho → `components/header.css`, alterar um breakpoint global → `layout/responsive.css`).

**Responsividade:** O breakpoint de mobile é **905px** (760px está obsoleto e não deve ser usado). Regra: **um breakpoint = um único bloco `@media`** por ficheiro; todo o CSS desse breakpoint fica dentro dele (`docs/breakpoints-media-queries.md`). Alterações que afetem só certos tamanhos de ecrã devem ficar **apenas dentro do `@media`** correspondente, sem alterar a estrutura base (`docs/modificacoes-estruturais-responsivas.md`). Para tipografia e espaçamentos escaláveis usam-se as variáveis `--font-*` e `--space-*` em `base/variables.css` e `clamp()` para dimensões de botões/ícones/grid (`docs/responsividade-regras-e-referencia.md`). No JavaScript, “mobile” baseia-se em **905px** (ex.: `isMobileView()` em utils.js).

---

## 6. Resumo em poucas linhas

**Dash-POS** é um sistema de **ponto de venda (POS)** em PHP + JavaScript para ambiente XAMPP/WAMP, com base de dados MySQL `wenkamba`. O frontend (dashboard em `pages/index.php`) usa uma arquitetura JS refatorada: **app.js** como orquestrador; **state.js**, **dom.js** e **utils.js** como núcleo; **services/** para chamadas à API; **modules/** para lógica de negócio (cart, checkout, client, barcode, invoice-assets); **ui/** para renderização e eventos (products, cart, payment, client-panel, bottom-sheet, etc.). O CSS do dashboard está refatorado em **main.css** + base/, layout/ (interface + responsive) e components/ (ver secção 5 e `docs/mapa-css-dash-pos.md`). As vendas são processadas via `api/vender.php` (VendaControl + VendaModel), com geração de fatura em A4 ou 80mm (fatura.js / fatura80.js, assets carregados por invoice-assets.module). A lista de produtos é atualizada em tempo real via SSE (`stream.php`). Inclui gestão de clientes (client.module + client-panel.ui + cliente.service), métodos de pagamento, pedidos (sync/load cart), código de barras e bottom sheet para mobile; breakpoint de mobile é 905px e as regras de responsividade estão em `docs/` (breakpoints, modificações estruturais, responsividade). A aplicação segue uma arquitetura em camadas no backend (API → Control → Model → BD). Vários ficheiros (cardápio, login, páginas de teste, app.js.bak) existem no repositório mas estão fora de uso no sistema atual.
