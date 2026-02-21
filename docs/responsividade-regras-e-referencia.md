# Responsividade Dash-POS — Regras e Referência para Modificações Futuras

**Baseado no:** Plano de Correcções de Responsividade v1.0 (2026-02-21)  
**Ficheiros envolvidos:** `pages/index.php` · **CSS do dashboard** (ver abaixo) · `assets/js/app.js`  
**Objectivo deste documento:** Especificar como as modificações **daqui em diante** devem ser feitas quando o assunto for responsividade conforme esse plano — sem alterar funcionalidade existente e mantendo consistência.

---

## Arquitetura CSS do dashboard (refatorada)

O CSS do dashboard **não** está num único `styles.css`. Está dividido em:

- **Ponto de entrada:** `assets/css/main.css` (único ficheiro referenciado no `index.php`).
- **Variáveis e tokens:** `assets/css/base/variables.css` — é aqui que estão `:root`, `--font-*`, `--space-*`, etc.
- **Media queries de layout global:** `assets/css/layout/responsive.css` — todos os `@media` que afetam o layout geral.
- **Estilos de componentes:** `assets/css/components/*.css` (cada componente pode ter os seus próprios `@media` internos).

Para saber **em que ficheiro** fazer cada tipo de alteração, usar **`docs/mapa-css-dash-pos.md`**.

---

## 1. O que o plano faz (resumo)

O plano **elimina inconsistências** em três frentes:

| Frente | O que foi feito |
|--------|------------------|
| **Breakpoints** | Um único ponto de viragem para mobile: **905px**. O valor **760px** deixou de existir; o JS (`isMobileView()`) e o CSS passaram a usar só 905px. Evita que entre 761px e 905px o layout seja mobile no CSS mas “desktop” no JS (setas da category bar, scroll, etc.). |
| **Dimensões e tipografia** | Valores fixos (px) em fontes, botões, avatares e grid foram substituídos por **variáveis CSS** (`--font-*`, `--space-*`) e **`clamp()`** para escalar com o viewport sem quebrar em ecrãs muito pequenos ou grandes. |
| **Duplicados** | Remoção de meta viewport duplicado no HTML, de listener duplicado no `clearSearch` (app.js) e do bloco **`@media (max-width: 760px)`** no CSS, cuja lógica foi consolidada no bloco **`@media (max-width: 905px)`** (incluindo regras de skeleton). |

Ou seja: **um único breakpoint de mobile (905px), tipografia e espaçamentos escaláveis, e zero duplicação** entre HTML, CSS e JS.

---

## 2. Breakpoints oficiais — usar apenas estes

Estes são os **breakpoints canónicos**. Qualquer novo `@media` deve usar um destes valores. **Não adicionar novos breakpoints.**

| Nome | Valor | Uso |
|------|--------|-----|
| Extra large | `1200px` | Layout grande, ajustes de painel |
| Large | `1155px` | obs-header empilha verticalmente |
| Medium-large | `1100px` | cartBodyWrapper empilha; date-time oculto |
| Medium | `992px` | doc-type panel 45% |
| **Mobile principal** | **`905px`** | **Ponto de viragem: ocultar coluna checkout, sticky menu e bottom sheet** |
| Menu hamburguer | `890px` | Menu lateral com hamburguer |
| Tablet | `768px` | Tipografia/padding menores; client panel 320px |
| Small mobile | `640px` | Critical alert full width |
| Extra small | `450px` | Product grid 2 colunas |
| Tiny | `349px` | Product grid 1 coluna |

- **Regra:** `905px` = breakpoint de mobile. `890px` é só para o menu hamburguer; são diferentes por design.
- **Obsoleto e proibido:** `760px` — não voltar a usar. Toda a lógica que dependia de 760px está no bloco `905px`.

---

## 3. Variáveis CSS de tipografia e espaçamento

No `:root` de **`assets/css/base/variables.css`** existem variáveis que **devem ser usadas** em alterações futuras quando se tratar de tamanhos de fonte e espaçamentos responsivos:

### Tipografia (`:root`)

```css
--font-xs:    clamp(9px,  0.85vw, 11px);
--font-sm:    clamp(11px, 1vw,    13px);
--font-base:  clamp(12px, 1.1vw,  14px);
--font-md:    clamp(13px, 1.2vw,  15px);
--font-lg:    clamp(14px, 1.4vw,  16px);
```

### Espaçamentos (`:root`)

```css
--space-xs:   clamp(4px,  0.5vw,  6px);
--space-sm:   clamp(6px,  0.7vw,  8px);
--space-md:   clamp(8px,  1vw,    12px);
--space-lg:   clamp(12px, 1.5vw,  16px);
--space-xl:   clamp(16px, 2vw,    20px);
```

- **Regra para modificações futuras:** Ao adicionar ou alterar `font-size` ou espaçamentos (padding/margin/gap) em elementos que precisem de escalar, preferir **`var(--font-*)`** ou **`var(--space-*)`** em vez de valores fixos em px. Se for necessário um valor fora desta escala, usar **`clamp(min, preferido_vw, max)`** no mesmo espírito (ex.: `--sidebar-width`, `--mobile-nav-width` já existem com `clamp`/`min`).

---

## 4. Dimensões de componentes (botões, avatares, grid)

O plano introduziu **`clamp()`** para largura/altura em elementos interactivos e no grid de produtos:

- **Regra para modificações futuras:** Ao criar ou alterar dimensões de botões, ícones, avatares ou colunas de grid, evitar valores únicos em px (ex.: `30px`). Usar **`clamp(min_px, vw, max_px)`** para que escalem em ecrãs pequenos e grandes. Exemplos já aplicados no plano:
  - Avatar: `clamp(24px, 2.5vw, 32px)`
  - Botões de quantidade / iconbtn: `clamp(24px, 2.2vw, 30px)` ou `clamp(26px, 2.5vw, 32px)`
  - Keypad pay btn: `clamp(42px, 4.5vw, 52px)`
  - Product grid: `minmax(clamp(130px, 28vw, 175px), 1fr)` (os media 450px e 349px continuam a sobrepor para 2 e 1 coluna).

---

## 5. JavaScript e breakpoint de mobile

- **Função `isMobileView()` (app.js):** Deve usar **apenas** o breakpoint **`905px`** (e não 760px nem outro). É usada para:
  - Visibilidade das setas da category bar
  - Bloqueio ou libertação do wheel scroll na category bar
- **Regra para modificações futuras:** Qualquer lógica que dependa de “estar em mobile” deve basear-se no mesmo critério que o CSS: **905px**. Se for necessário usar `matchMedia`, usar `(max-width: 905px)` (e não 760px).

---

## 6. Evitar duplicação

- **HTML (index.php):** Um único `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. Não duplicar.
- **app.js:** Não registar o mesmo listener duas vezes no mesmo elemento (ex.: `clearSearch` tinha dois `click`; deve existir apenas o que também trata do colapso do search no mobile).
- **CSS:** Não voltar a criar um bloco **`@media (max-width: 760px)`**. Tudo o que for “em mobile” (layout single column, checkout oculto, skeleton mobile, etc.) deve estar no bloco **`@media (max-width: 905px)`**, em **`assets/css/layout/responsive.css`** (ou no componente correspondente se for override local). Ver também `docs/breakpoints-media-queries.md`: um breakpoint = um bloco. Ver `docs/mapa-css-dash-pos.md` para saber onde editar.

---

## 7. O que NÃO alterar (fora do âmbito do plano)

- Containers de impressão de fatura (`#inv-a4-container-principal`, `#fatura80-container-inv80`) em `position: fixed; top: -9999px`.
- Comportamento de `closeAlert()` sem argumento ou de `localStorage` para formato de fatura — são temas de refactor separados.
- Resize com bottom sheet aberto (solução futura possivelmente em `updateResponsiveUI()`) — não está no âmbito deste plano.

---

## 8. Checklist rápido para alterações futuras

Ao tocar em responsividade (index.php, CSS do dashboard — ver `docs/mapa-css-dash-pos.md` —, app.js):

1. **Breakpoint:** Usar só um dos valores da tabela (Secção 2); nunca 760px.
2. **CSS:** Novos estilos por breakpoint → dentro do bloco `@media` **existente** para esse breakpoint (905px, 768px, etc.).
3. **Tipografia / espaço:** Preferir `var(--font-*)` e `var(--space-*)`; se precisar de outro valor, usar `clamp()`.
4. **Dimensões de botões/ícones/grid:** Preferir `clamp(min, vw, max)` em vez de px fixo.
5. **JS “mobile”:** Usar 905px (ex.: `isMobileView()` ou `matchMedia('(max-width:905px)')`).
6. **Duplicados:** Não duplicar viewport, listeners nem blocos `@media (max-width: 760px)`.

---

*Documento criado para referência nas modificações futuras relacionadas com o Plano de Correcções de Responsividade — Dash-POS v1.0.*
