# Mapa CSS — Dash-POS

**Objetivo:** Sempre que fores fazer modificações nos estilos do sistema, usa este mapa para saber **em que ficheiro** deves atuar. O CSS do dashboard está dividido por responsabilidade; o ponto de entrada é **`assets/css/main.css`** (único ficheiro referenciado no `index.php`).

---

## 1. Onde está o quê (estrutura atual)

```
assets/css/
├── main.css                    ← Ponto de entrada (NÃO editar estilos aqui; só @import)
│
├── base/
│   ├── variables.css           ← Tokens globais
│   ├── reset.css               ← Reset e scrollbars globais
│   └── typography.css          ← Tipografia global (minimal)
│
├── layout/
│   ├── interface.css           ← Grid principal, .main, .side, .checkout-panel
│   └── responsive.css          ← TODOS os @media do sistema (layout global)
│
└── components/
    ├── skeleton.css            ← Loading skeleton
    ├── header.css              ← Cabeçalho, nav, user, avatar
    ├── search.css              ← Barra de pesquisa, toggle código de barras
    ├── categories.css          ← Barra de categorias, setas
    ├── product-card.css        ← Grid de produtos, cards
    ├── cart.css                ← Carrinho: header, body, itens, empty state
    ├── cart-footer.css         ← Rodapé do carrinho, resumo, OBS, desconto
    ├── keypad.css              ← Teclado numérico, botão Pagar
    ├── payment-methods.css     ← Métodos de pagamento (cards, setas, input valor)
    ├── invoice-type.css        ← Tipo de documento, painel A4/80mm
    ├── client-btn.css          ← Botão Cliente (header e carrinho)
    ├── client-panel.css         ← Painel lateral de clientes
    ├── bottom-sheet.css        ← Menu sticky inferior, modal bottom sheet
    ├── alerts.css              ← Alertas e alerta crítico
    └── modals.css              ← Overlay, diálogo de confirmação
```

**Nota:** `fatura.css` e `fatura80.css` continuam na pasta `assets/css/` e **não fazem parte** desta árvore; são carregados dinamicamente para impressão.

---

## 2. Guia rápido: “Quero modificar…”

| O que queres modificar | Ficheiro onde deves atuar |
|------------------------|----------------------------|
| Cores, fontes, espaçamentos globais, sidebar width | `base/variables.css` |
| Reset (box-sizing, body, overflow) ou scrollbars de .main/.side | `base/reset.css` |
| Grid da página (colunas main/side), .interface, .checkout-panel, .sticky-section-home | `layout/interface.css` |
| **Qualquer @media** que afete layout global ou vários componentes | `layout/responsive.css` |
| Skeleton de loading | `components/skeleton.css` |
| Cabeçalho, menu nav, data/hora, utilizador, avatar | `components/header.css` |
| Barra de pesquisa, input, toggle código de barras, clear | `components/search.css` |
| Barra de categorias, pills, setas | `components/categories.css` |
| Grid de produtos, cards, preço, stock, quick-add | `components/product-card.css` |
| Cabeçalho do carrinho, corpo, lista de itens, estado vazio, cart-product-card | `components/cart.css` |
| Rodapé do carrinho, métodos de pagamento, input valor, keypad, resumo, OBS, desconto | `components/cart-footer.css` |
| Teclado numérico, botão Pagar, botão Exato | `components/keypad.css` |
| Cards de métodos de pagamento, setas, status de pagamento | `components/payment-methods.css` |
| Seletor de tipo de documento (fatura/recibo/proforma), painel A4/80mm | `components/invoice-type.css` |
| Botão Cliente (texto, label, nome) no header ou no carrinho | `components/client-btn.css` |
| Painel deslizante de clientes, lista, formulário | `components/client-panel.css` |
| Menu sticky inferior (mobile), bottom sheet, abas do carrinho no sheet | `components/bottom-sheet.css` |
| Alertas (#alertContainer, #criticalAlertContainer) | `components/alerts.css` |
| Overlay escuro, diálogo de confirmação, botão limpar carrinho (estilo) | `components/modals.css` |

---

## 3. Regras importantes

1. **Nunca** editar `main.css` para acrescentar estilos — só contém `@import`. Coloca sempre o CSS no ficheiro correto da tabela acima.
2. **Breakpoints:** Novos `@media` que afetem o layout geral → `layout/responsive.css`. Um breakpoint = um bloco (ver `docs/breakpoints-media-queries.md`).
3. **Variáveis:** Para font-size e espaçamentos responsivos, usar `var(--font-*)` e `var(--space-*)` definidos em `base/variables.css` (ver `docs/responsividade-regras-e-referencia.md`).
4. **Ordem de carregamento:** `main.css` importa na ordem: base → layout (interface) → components → layout (responsive). O `responsive.css` fica por último de propósito.

---

## 4. Documentos relacionados

- **Responsividade e breakpoints:** `docs/responsividade-regras-e-referencia.md`, `docs/breakpoints-media-queries.md`
- **Modificações só para um breakpoint:** `docs/modificacoes-estruturais-responsivas.md`
- **Plano original da refatoração:** `PLANO-CSS-DASH-POS.md` (na raiz do projeto)

---

*Mapa criado após refatoração CSS Dash-POS — arquitetura por ficheiros em base/, layout/ e components/.*
