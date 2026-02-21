# Módulos JavaScript em `assets/js` (exceto app.js)

Este documento descreve os ficheiros JavaScript em `assets/js` que **não** são o `app.js`: o que fazem, qual o seu objetivo no sistema e como se integram com o resto do POS. O `app.js` é o núcleo do dashboard (produtos, carrinho, checkout, SSE) e está documentado separadamente.

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [clientes.js](#2-clientesjs)
3. [monetary-formatter.js](#3-monetary-formatterjs)
4. [fatura.js](#4-faturajs)
5. [fatura80.js](#5-fatura80js)
6. [Integração entre módulos](#6-integração-entre-módulos)
7. [Referência rápida (API exposta)](#7-referência-rápida-api-exposta)

---

## 1. Visão geral

| Ficheiro | Objetivo principal | Usado por |
|----------|--------------------|-----------|
| **clientes.js** | Gestão do painel de clientes: listar, pesquisar, selecionar e cadastrar clientes. | app.js (painel lateral, checkout) |
| **monetary-formatter.js** | Formatação e edição do valor monetário no input de “valor recebido” (teclado, operações +/−). | app.js (keypad, footer do carrinho) |
| **fatura.js** | Renderização da fatura em formato **A4** para impressão (múltiplas páginas, QR por página). | app.js (após venda; dados locais ou backend) |
| **fatura80.js** | Renderização do recibo em formato **80mm** (térmico) para impressão. | app.js (após venda; dados locais ou backend) |

Todos estes ficheiros são carregados na página principal (`pages/index.php`) e expõem funções ou objetos no `window` para o `app.js` (e eventualmente outros scripts) utilizarem.

---

## 2. clientes.js

### Objetivo

Módulo de **gestão de clientes** no POS: carregar a lista de clientes da API, pesquisar em tempo real, exibir resultados no painel lateral, selecionar um cliente para a venda e cadastrar novo cliente quando a pesquisa não encontra resultados.

### O que faz

- **Classe `ClientManager`** (singleton após `DOMContentLoaded`):
  - **Inicialização:** faz cache dos elementos do DOM do painel de clientes (`#clientListPanel`, `#clientSearchInput`, `#selectedClientCard`, formulário de novo cliente, etc.) e associa os eventos.
  - **API:** usa `../api/cliente.php` com:
    - `GET ?acao=listar_cliente` — carrega todos os clientes (timeout 5s).
    - `POST` com `acao: 'verificar_cliente'` — cria ou encontra cliente (nome obrigatório; telefone, email, endereco, nif opcionais).
  - **Pesquisa:** no `input` da pesquisa, filtra em tempo real por `nome` ou `nif`. Se houver resultados, mostra a lista (máx. 6 cards); se não houver, mostra o formulário para “Nome do cliente” e cadastro.
  - **Lista:** renderiza cards (`.client-card`) com nome, morada, telefone, NIF. Limita a 6 itens e indica “+N cliente(s) não exibido(s)”.
  - **Seleção:** ao clicar num card, guarda o cliente selecionado, atualiza o card de “cliente selecionado”, fecha o painel (se existir `closeClientPanel()`), chama `window.handleClientSelection(id, nome, dados)` para o checkout e emite o evento `clientSelected` no `document`.
  - **Novo cliente:** submete o formulário com validação (nome obrigatório; email com regex se preenchido). Após sucesso, recarrega a lista, seleciona o cliente criado, limpa o formulário e mostra mensagem de sucesso via `showAlert` (se existir).
  - **Utilitários:** `escapeHtml` (anti-XSS), `showError` / `showSuccess` (alertas), `getSelectedClient()` para outros módulos.

### Integração com o sistema

- O **app.js** deve garantir que existam no DOM os IDs esperados (painel, input, formulário, etc.) e que as funções globais `closeClientPanel`, `showAlert` e `handleClientSelection` estejam definidas.
- `handleClientSelection` é a ponte para o checkout integrado: recebe o cliente escolhido para associar à venda.
- Acesso global: `window.ClientManager`, `window.getClientManager()`.

---

## 3. monetary-formatter.js

### Objetivo

Controlar o **campo de valor monetário** (ex.: “valor recebido”) usado no keypad do POS: formatação em locale (pt-AO, Kz), entrada apenas via teclado/teclado numérico, e suporte a **operações de soma e subtração** no próprio campo (ex.: “Kz 100 + Kz 50” e Enter para obter 150).

### O que faz

- **Classe `MonetaryFormatter`** (instanciada com `inputId` e `options`):
  - **Configuração:** `locale` (default `pt-AO`), `currency` (default `Kz`), `decimals` (default 2), `allowNegative` (default false). Callback opcional `onValueChange`.
  - **Estado interno:** `internalValue` (valor atual), e em modo operação: `operationMode` (`'addition'` ou `'subtraction'`), `operationBuffer` (valor digitado após +/−), `previousValue` (valor antes do operador).
  - **Entrada:** `keypadInput(value)` — dígitos e ponto decimal; limita casas decimais. Em modo operação, escreve no `operationBuffer`; caso contrário, no `internalValue`.
  - **Teclado:** `handleKeyboard(event)` — trata `+` (inicia soma), `-` (inicia subtração), `Enter` (executa operação), `Escape` (cancela operação), dígitos, `,`/`.`/`Decimal`, `Backspace`, `Delete`/`Clear`. Em subtração, se `allowNegative === false` e o resultado fosse negativo, cancela a operação.
  - **Operações:** `startOperation(operation)`, `executeOperation()`, `cancelOperation()`. Após executar, o resultado passa a ser o novo valor e o modo operação é limpo.
  - **Formatação:** o input é mostrado como “Kz X,XX” ou “Kz A + Kz B” / “Kz A − Kz B” em modo operação. O elemento é tratado como `readonly` na lógica de formatação; a edição real é feita pelos handlers.
  - **DOM:** `_refreshInputReference()` — atualiza a referência ao `input` por ID (útil quando o elemento é recriado, ex.: bottom sheet). `enable()` / `disable()` ligam/desligam os listeners de `keydown`, `input` e `paste` (paste é bloqueado). `destroy()` remove listeners e referências.
  - **API:** `getValue()`, `setValue(newValue)`, `backspace()`, `clear()`.

### Integração com o sistema

- O **app.js** cria uma instância de `MonetaryFormatter` associada ao input do valor recebido (ex.: `#footerAmountInput` ou id usado no checkout), chama `enable()` quando o campo está ativo e pode usar `getValue()` para obter o valor numérico e `onValueChange` para atualizar troco/estado de pagamento.
- Não expõe construtor no `window` de forma explícita no ficheiro; o app.js usa a classe se estiver no scope (script carregado antes do app.js).

---

## 4. fatura.js

### Objetivo

Renderizar a **fatura em formato A4** para impressão: múltiplas páginas (16 produtos por página), cabeçalho com dados da empresa e do cliente, tabela de produtos, “transportado”/“a transportar” entre páginas, resumo de impostos, total por extenso em kwanzas, formas de pagamento e QR Code por página. Funciona tanto com dados montados no frontend (carrinho + checkout) como com dados devolvidos pelo backend após processar a venda.

### O que faz

- **Proteção:** evita carregamento duplicado (`window.FATURA_JS_LOADED`).
- **Números por extenso:** `numeroParaExtenso` (PT) e `numeroParaExtensoAOA` (kwanzas/cêntimos) para o total pago.
- **Paginação:** `PRODUTOS_POR_PAGINA = 16`. `dividirProdutosEmPaginas(produtos)`, `calcularTotalPagina`, `calcularTransportado` para valores “transportado” e “a transportar” entre páginas.
- **Formatação:** `formatarMoeda(valor)` com `Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
- **Renderização por página:** `criarPaginaFatura(produtos, numeroPagina, totalPaginas, todasPaginas, dadosFatura)` gera o HTML de uma página A4 (classe `inv-a4-interface-fatura`): cabeçalho (logo, empresa, título “FATURA RECIBO”, cliente, QR); corpo (tabela data/hora/contribuinte/telefone/endereço; tabela de produtos; transportado/a transportar); rodapé (resumo de impostos, totais, valor por extenso, formas de pagamento, operador, “Pag X de Y”). Gera QR Code com a lib `QRCode` após inserir no DOM.
- **Container:** `renderizarFaturaComPaginas(dadosFatura)` limpa `#inv-a4-container-principal`, cria um wrapper para múltiplas páginas e acrescenta uma página por cada “fatia” de produtos.
- **Dados a partir do carrinho:** `prepararDadosFatura(cart, checkoutCustomerData, checkoutPaymentData)` monta o objeto `dadosFatura` (numeroFatura, data, hora, cliente, produtos, totais, impostos, formasPagamento, observação, operador) para uso local. Usa `window.getActivePaymentMethods` se existir para as formas de pagamento.
- **Dados a partir do backend:** `renderizarFaturaComDadosBackend(dadosBackend)` transforma a resposta da API (ex.: após `vender.php`) no formato esperado por `renderizarFaturaComPaginas` (empresa, cliente, produtos_fatura, totais, resumo_impostos, formas_pagamento, etc.), garante que exista `#inv-a4-container-principal` (cria e esconde fora da tela se necessário) e chama `renderizarFaturaComPaginas(dadosFatura)`.

### Integração com o sistema

- O **app.js** (ou fluxo de venda) decide se a impressão é A4 ou 80mm; para A4 carrega `fatura.css` e usa `renderizarFaturaComPaginas` (dados locais) ou `renderizarFaturaComDadosBackend` (dados do backend). O container A4 fica tipicamente fora da vista (`position: fixed; top: -9999px`) e é enviado para a impressora.
- Funções expostas: `window.renderizarFaturaComPaginas`, `window.prepararDadosFatura`, `window.formatarMoeda`, `window.renderizarFaturaComDadosBackend`.

---

## 5. fatura80.js

### Objetivo

Renderizar o **recibo térmico 80mm** para impressão: uma única “página” com logo, empresa, cliente, tabela de produtos, totais (total a pagar, valor pago, troco), formas de pagamento, resumo de impostos, rodapé legal e QR Code. Funciona com dados montados no frontend ou com dados do backend.

### O que faz

- **Proteção:** evita carregamento duplicado (`window.FATURA80_JS_LOADED`).
- **Formatação:** `formatarMoeda(valor)` em pt-AO (igual ao fatura.js).
- **HTML do recibo:** `gerarHTMLFatura80(dadosFatura)` gera o HTML completo com classes `inv80`/`-inv80`: logo, dados da empresa, bloco cliente (exmo sr(a), data emissão, NIF, contacto, número fatura, “ORIGINAL”), tabela de produtos (Desc, Qtd, Preço Uni., Desc.(%), Taxa(%), Total), totais (total a pagar, valor pago, troco), meio de pagamento (linhas metodo/valor), rodapé de software, resumo de impostos, rodapé legal, agradecimento e container para QR Code.
- **Renderização:** `renderizarFatura80(dadosFatura)` obtém ou cria o elemento `#fatura80-container-inv80`, define `innerHTML` com o resultado de `gerarHTMLFatura80`, e após um pequeno delay gera o QR Code em `#qrcode-inv80` com a lib `QRCode`.
- **Dados a partir do carrinho:** `prepararDadosFatura80(cart, checkoutCustomerData, checkoutPaymentData)` monta o objeto com produtos, totais (subtotal, desconto, imposto, valorAPagar, pago, troco), impostos, formasPagamento (array de `{ metodo, valor }`), empresa e cliente. Usa valores default para empresa (Hélio Trading, etc.) e operador.
- **Dados a partir do backend:** `renderizarFatura80ComDadosBackend(dadosBackend)` mapeia a resposta da API para o formato esperado por `renderizarFatura80` (codigo_documento, dados_empresa, cliente, produtos_fatura, totais, resumo_impostos, formas_pagamento, etc.) e chama `renderizarFatura80(dadosFatura)`.

### Integração com o sistema

- O **app.js** (ou fluxo de venda) carrega `fatura80.css` e usa `renderizarFatura80` ou `renderizarFatura80ComDadosBackend` conforme a origem dos dados. O container 80mm é tipicamente posicionado para impressão térmica.
- Funções expostas: `window.renderizarFatura80`, `window.prepararDadosFatura80`, `window.renderizarFatura80ComDadosBackend`, `window.populateInvoice80` (alias), `window.formatarMoeda`.

---

## 6. Integração entre módulos

- **app.js** é o orquestrador: usa o painel de clientes (e `handleClientSelection`), o formatador monetário no input de valor recebido, e após concluir a venda escolhe fatura A4 ou 80mm e chama as funções de renderização correspondentes (com dados locais ou com resposta do backend).
- **clientes.js** depende de: `api/cliente.php`, DOM do painel de clientes, e (opcionalmente) `closeClientPanel`, `showAlert`, `handleClientSelection` definidos no app ou noutro script.
- **monetary-formatter.js** é usado pelo app.js numa instância por input; não depende de outros módulos.
- **fatura.js** e **fatura80.js** dependem da biblioteca **QRCode** (global) e de um container no DOM; recebem dados no formato definido por cada um (preparados localmente ou transformados a partir do backend). Não dependem um do outro; o app decide qual usar conforme o tipo de documento/impressora.

---

## 7. Referência rápida (API exposta)

| Módulo | No `window` | Uso típico |
|--------|-------------|------------|
| **clientes.js** | `ClientManager`, `getClientManager()` | Obter instância do gestor; `getClientManager().getSelectedClient()` |
| **clientes.js** | (esperado pelo módulo) `closeClientPanel()`, `showAlert()`, `handleClientSelection(id, nome, dados)` | Fechar painel; alertas; passar cliente ao checkout |
| **monetary-formatter.js** | Classe `MonetaryFormatter` (se script carregado no mesmo scope) | `new MonetaryFormatter('idInput', { onValueChange })` + `enable()` / `getValue()` |
| **fatura.js** | `renderizarFaturaComPaginas(dadosFatura)`, `prepararDadosFatura(cart, customer, payment)`, `renderizarFaturaComDadosBackend(dadosBackend)`, `formatarMoeda` | Renderizar A4 com dados locais ou backend |
| **fatura80.js** | `renderizarFatura80(dadosFatura)`, `prepararDadosFatura80(cart, customer, payment)`, `renderizarFatura80ComDadosBackend(dadosBackend)`, `populateInvoice80`, `formatarMoeda` | Renderizar 80mm com dados locais ou backend |

---

*Documento criado com base na leitura dos ficheiros em `assets/js` (exceto app.js) — Dash-POS.*
