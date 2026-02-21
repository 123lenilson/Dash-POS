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
│   └── js/
│       ├── app.js          # Núcleo do POS: produtos, carrinho, categorias, checkout, SSE
│       ├── clientes.js     # Módulo clientes (ClientManager, painel, busca)
│       ├── fatura.js       # Renderização de fatura A4 (extenso, layout)
│       ├── fatura80.js     # Renderização de recibo 80mm
│       ├── monetary-formatter.js
│       └── (outros .js em uso conforme necessário)
├── pages/
│   └── index.php           # Página principal do POS (dashboard)
└── (outros ficheiros/pastas na raiz)
```

#### Fora de uso no sistema

Estes ficheiros/pastas existem no projeto mas **não estão em uso** no sistema atual:

- **assets/js:** `cardapio.js`, `fetchData.js`, `login.js`, `tailwind.js`
- **pages:** `login.php`; `teste.html`, `FAT-pe.html`, `fatura80-exemplo.html` (e outras páginas que usam cardápio/fetchData)
- **Raiz:** `cardapioModel.php`
- **Pastas:** `FACTURAS/` (armazenamento de faturas); `.claude`, `.git`, `.qoder` (configuração/versão — não fazem parte da aplicação em execução)

---

## 2. Stack técnico

| Camada      | Tecnologia |
|------------|------------|
| Backend    | PHP (XAMPP), MySQL (BD `wenkamba`) |
| Frontend   | HTML/CSS, JavaScript (vanilla), Tailwind CSS, Font Awesome |
| API        | REST (GET/POST) + JSON; SSE em `stream.php` |
| Moeda      | AOA (Kwanza – Angola), formatação `pt-AO` |

---

## 3. Funcionamento geral

### Fluxo de dados

1. **Frontend** (`pages/index.php` + `assets/js/app.js`):  
   Interface do POS: grelha de produtos, carrinho, pesquisa, categorias, cliente, métodos de pagamento, checkout.

2. **Comunicação com o servidor:**  
   - **REST:** chamadas `fetch()` para `api/*.php` (ex.: `produtos.php`, `cliente.php`, `vender.php`, `pedido.php`, `pagamento.php`).  
   - **Tempo real:** `EventSource` para `api/stream.php` (SSE), para atualizar a lista de produtos quando há alterações na base (evita polling).

3. **API (api/*.php):**  
   Recebe o pedido, valida (e eventualmente lê JSON do body), chama o **Control** correspondente.

4. **Control (app/Control/*):**  
   Valida regras de negócio e chama o **Model** para ler/escrever na base.

5. **Model (app/Model/*):**  
   Usa `Conexao::getConexao()` (MySQL, UTF-8) para executar SQL e devolver dados ao Control, que por sua vez devolve JSON ao frontend.

### Fluxo de uma venda (exemplo)

- Utilizador adiciona itens ao carrinho (produtos vêm de `produtos.php` e podem ser atualizados via SSE).
- No checkout: escolhe cliente (consumidor final ou da lista via `cliente.php`), métodos de pagamento (`pagamento.php`) e tipo de documento (fatura-recibo, fatura-proforma, fatura, orçamento).
- Frontend envia POST para `api/vender.php` com `acao`, `id_cliente`, `metodos_pagamento`, itens, etc.
- `VendaControl` valida e chama `VendaModel->processarFatura()`.
- O model usa tabelas `pedido`, `cliente`, `imposto`, etc., gera a fatura e devolve sucesso + dados (ex.: número da fatura).
- O frontend usa `fatura.js` (A4) ou `fatura80.js` (80mm) para renderizar e imprimir.

### Documentos fiscais / impressão

- Tipos suportados no fluxo: `fatura-recibo`, `fatura-proforma`, `fatura`, `orcamento`.
- Dois formatos de impressão: **A4** (`fatura.css` + `fatura.js`) e **80mm** (`fatura80.css` + `fatura80.js`), carregados dinamicamente conforme seleção.

### Outros módulos (em uso)

- **Clientes:** listagem, pesquisa e criação via `clientes.js` e `api/cliente.php`.
- **Pedidos (mesa/conta):** `api/pedido.php` (adicionar/listar pedido).

---

## 5. Arquitetura CSS do dashboard (refatorada)

O CSS da interface do POS (dashboard) **não** está num único ficheiro. Foi refatorado e está organizado assim:

- **Ponto de entrada:** `assets/css/main.css` — é o **único** ficheiro CSS do dashboard referenciado em `pages/index.php`. Contém apenas `@import` dos restantes ficheiros.
- **`assets/css/base/`** — `variables.css` (tokens `:root`, cores, fontes, espaçamentos), `reset.css` (box-sizing, body, scrollbars), `typography.css` (minimal).
- **`assets/css/layout/`** — `interface.css` (grid .interface, .main, .side, .checkout-panel) e **`responsive.css`** (todos os blocos `@media` que afetam o layout global).
- **`assets/css/components/`** — um ficheiro por área: skeleton, header, search, categories, product-card, cart, cart-footer, keypad, payment-methods, invoice-type, client-btn, client-panel, bottom-sheet, alerts, modals.

Os ficheiros **`fatura.css`** e **`fatura80.css`** continuam em `assets/css/` e são carregados dinamicamente para impressão; não fazem parte da árvore importada por `main.css`.

**Para modificações:** usar **`docs/mapa-css-dash-pos.md`** para saber em que ficheiro atuar (ex.: alterar cabeçalho → `components/header.css`, alterar um breakpoint global → `layout/responsive.css`).

---

## 6. Resumo em poucas linhas

**Dash-POS** é um sistema de **ponto de venda (POS)** em PHP + JavaScript para ambiente XAMPP, com base de dados MySQL `wenkamba`. O frontend (dashboard em `pages/index.php` e `app.js`) mostra produtos, carrinho, cliente e pagamentos; o CSS do dashboard está refatorado em `assets/css/main.css` + base/, layout/ e components/ (ver secção 5 e `docs/mapa-css-dash-pos.md`). As vendas são processadas via `api/vender.php` (VendaControl + VendaModel), com geração de fatura em A4 ou 80mm. A lista de produtos é atualizada em tempo real via SSE (`stream.php`). Inclui ainda gestão de clientes, métodos de pagamento e pedidos (mesa/conta), seguindo uma arquitetura em camadas (API → Control → Model → BD). Vários ficheiros (cardápio, login, páginas de teste, etc.) existem no repositório mas estão fora de uso no sistema atual.
