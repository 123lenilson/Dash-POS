# Regra: Um breakpoint = Um bloco `@media`

Este documento serve de **lembrete e referência** para quem modificar os ficheiros CSS do dashboard em tudo o que diz respeito a **breakpoints** e **media queries**.

---

## Arquitetura CSS do dashboard (refatorada)

O CSS do dashboard **não** está num único `styles.css`. Está dividido em:

- **Ponto de entrada:** `assets/css/main.css` (único CSS do dashboard referenciado no `index.php`).
- **Media queries de layout global:** **`assets/css/layout/responsive.css`** — contém todos os blocos `@media` que afetam o layout geral ou vários componentes. **É aqui** que deves adicionar ou editar regras por breakpoint quando o impacto for global.
- **Componentes:** `assets/css/components/*.css` — cada um pode ter os seus próprios `@media` internos quando o override é específico desse componente (ex.: `client-panel.css`).

Para saber em que ficheiro fazer cada tipo de alteração, usar **`docs/mapa-css-dash-pos.md`**.

---

## Regra principal

**Sempre que tiveres de modificar ou adicionar estilos por breakpoint, coloca o código dentro do bloco `@media` que já existe para esse breakpoint.**

- **Um breakpoint** (ex.: `max-width: 905px`) deve existir **uma única vez** no ficheiro.
- Todo o CSS que dependa desse mesmo breakpoint deve estar **dentro desse único bloco**.
- **Não** criar um novo `@media (max-width: 905px) { ... }` noutro sítio do ficheiro só porque estás a trabalhar noutra secção (search, footer, modal, etc.).

---

## Porquê?

1. **Manutenção** — É mais fácil encontrar e alterar tudo o que acontece num dado breakpoint quando está num só sítio.
2. **Evitar duplicados** — Vários blocos iguais (ex.: vários `@media (max-width: 905px)`) poluem o ficheiro e aumentam o risco de regras em conflito ou esquecidas.
3. **Ordem da cascata** — Se o mesmo selector aparecer em dois blocos do mesmo breakpoint, o que vier mais abaixo no ficheiro ganha. Ter um único bloco por breakpoint torna essa ordem explícita e controlada.
4. **Consistência** — O `layout/responsive.css` (e, quando aplicável, os componentes) segue a regra de um breakpoint = um bloco; mantê-la evita duplicados e conflitos.

---

## O que fazer na prática

### Quando adicionas estilos para um breakpoint

1. **Descobre qual é o breakpoint** (ex.: `max-width: 905px`, `min-width: 906px`).
2. **Escolhe o ficheiro:** se a regra afetar layout global ou vários componentes → **`layout/responsive.css`**; se for só um componente → ficheiro em **`components/`** (ver `docs/mapa-css-dash-pos.md`).
3. **Procura no ficheiro** o bloco `@media` que usa esse breakpoint (só deve haver um por breakpoint nesse ficheiro).
4. **Adiciona as novas regras dentro desse bloco**, na posição que fizer sentido (por exemplo agrupado por componente ou por secção do layout).

### Quando crias um breakpoint “novo”

- Se o breakpoint for realmente novo (ex.: `max-width: 600px` ainda não existe), podes criar um novo bloco `@media`.
- Antes de criar, **confirma** que não existe já um bloco com a mesma condição (com ou sem espaços, ex.: `max-width:905px` e `max-width: 905px` são o mesmo).

### O que evitar

- **Não** abrir um segundo `@media (max-width: 905px) { ... }` mais abaixo no ficheiro para “organizar” ou “deixar perto do componente”.
- **Não** duplicar a condição do media com pequenas variações (ex.: `905px` n um sítio e `906px` noutro) sem necessidade de lógica diferente.
- **Não** deixar blocos `@media` vazios; se mudaste regras de sítio, remove o bloco que ficou vazio.

---

## Breakpoints usados no projeto (referência)

No **`layout/responsive.css`** (e, quando aplicável, em componentes) cada condição de breakpoint deve aparecer **uma vez** por ficheiro:

| Condição | Uso principal |
|----------|----------------|
| `max-width: 349px` | Telefones muito pequenos |
| `min-width: 350px) and (max-width: 450px)` | Product grid 2 colunas |
| `max-width: 420px` | Modais (pm-, pay-) em ecrãs muito estreitos |
| `max-width: 640px` | Alert crítico full width |
| `max-width: 760px` | Mobile: skeleton, interface, pay modal, search bar |
| `min-width: 761px) and (max-width: 1100px)` | Search bar / cliente (tablet) |
| `max-width: 768px` | Alert container, painel cliente slider |
| `max-width: 890px` | Nav principal, menu mobile, controles |
| `max-width: 905px` | Mobile/carrinho: search compacto, tipo factura, footer pay, interface, sticky menu, botão fechar painel cliente |
| `min-width: 906px` | Desktop: footer amount, bottom sheet escondido, botão fechar painel escondido |
| `max-width: 992px` | Painel tipo documento (largura) |
| `max-width: 1100px` | Cart body wrapper, product-grid, date-time |
| `max-width: 1155px` | Cabeçalho OBS (coluna) |
| `max-width: 1200px` | Painel tipo documento (largura) |

Ao adicionar ou alterar estilos para um destes tamanhos de ecrã, usar **sempre** o bloco `@media` correspondente já existente.

---

## Resumo em uma frase

**Um breakpoint = um único bloco `@media` no ficheiro; todo o código desse breakpoint fica dentro dele.**

---

*Documento criado como referência após consolidação dos blocos `@media` duplicados. A arquitetura CSS do dashboard está em `assets/css/` (base/, layout/, components/); ver `docs/mapa-css-dash-pos.md`.*
