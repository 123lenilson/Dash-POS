# Regra: Modificações estruturais e responsividade

Este documento define como devem ser feitas **alterações estruturais** (layout, posição de elementos, contentores) quando o pedido afeta **apenas alguns breakpoints** e não a estrutura base do sistema.

---

## Arquitetura CSS do dashboard (refatorada)

O CSS do dashboard está dividido em ficheiros por responsabilidade. O ponto de entrada é **`assets/css/main.css`** (referenciado no `index.php`).

- **Estrutura base (layout “normal”):** regras fora de `@media` estão em **`layout/interface.css`** (grid, .main, .side, .checkout-panel) ou no ficheiro do **componente** correspondente em `assets/css/components/*.css`.
- **Comportamento por breakpoint:** regras dentro de `@media` que afetam o layout global estão em **`layout/responsive.css`**. Alguns componentes têm os seus próprios `@media` internos no respetivo ficheiro em `components/`.

Para saber em que ficheiro editar (interface, responsive ou qual componente), usar **`docs/mapa-css-dash-pos.md`**.

---

## Princípio fundamental

**A estrutura base (o CSS que não está dentro de `@media`) define o layout “padrão” do sistema.**  
Quando pedimos uma mudança que só deve aplicar em certos tamanhos de ecrã (ex.: abaixo de 905px), essa mudança **não pode alterar a base**. Deve aplicar-se **apenas dentro do bloco `@media`** correspondente.

- **Estrutura base** = regras CSS fora de media queries. É o comportamento “normal” em ecrãs grandes / desktop.
- **Comportamento por breakpoint** = regras dentro de `@media (…)`. Alteram layout/comportamento só para esse intervalo de largura.

Se a modificação for “só para telas abaixo de 905px”, então **toda** a alteração estrutural (contentores, flex, posição dos botões, etc.) deve existir **apenas** dentro do bloco `@media` desse breakpoint. A base permanece intacta.

---

## Exemplo concreto

### Situação inicial (estrutura base)

- Existe um **contentor** (ex.: `.meu-contentor`).
- Dentro dele há **dois botões** alinhados numa só linha com `display: flex`.
- Isto está definido no CSS **sem** media query — é a estrutura base.

```css
.meu-contentor {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.meu-contentor .btn-1 { }
.meu-contentor .btn-2 { }
```

### Pedido

> “Em telas abaixo de 905px, quero que um dos botões saia deste contentor e fique noutro contentor (ou simplesmente fora deste contentor).”

### O que deve acontecer

1. **Ecrãs acima de 905px (e quando não há media aplicável)**  
   - Continua igual à estrutura base: o contentor com os dois botões numa linha em flex.  
   - Nada no CSS base é alterado para “preparar” o comportamento mobile.

2. **Ecrãs abaixo de 905px**  
   - Dentro do bloco `@media (max-width: 905px) { ... }` (um único bloco, conforme a regra dos breakpoints):
     - Pode-se alterar o layout do contentor (ex.: flex-direction, esconder um botão do fluxo).
     - O botão que “sai” pode ser posicionado noutro contentor (ex.: via ordem no DOM e CSS, ou movido com flex/position apenas nesse breakpoint).
     - Ou pode ser estilizado como “fora” do contentor visualmente (ex.: position absolute, ou colocando-o noutro wrapper que só existe no HTML e é mostrado/estilizado nesse breakpoint).
   - Toda essa lógica fica **só** dentro do `@media (max-width: 905px)`.

### O que não deve acontecer

- **Não** alterar a estrutura base (o CSS fora de `@media`) para que “já fique preparado” para mobile (ex.: mudar o flex ou os contentores de forma que o desktop deixe de ser “dois botões numa linha dentro do contentor”).
- **Não** criar uma única estrutura que “funcione para os dois” de forma que o desktop deixe de ser o layout original. O desktop deve continuar a ser exatamente o que a base define.
- **Não** duplicar o breakpoint; usar o bloco `@media (max-width: 905px)` já existente (conforme `breakpoints-media-queries.md`).

---

## Regras práticas

### 1. Identificar o âmbito do pedido

- O pedido fala em “em telas abaixo de X px” ou “em mobile” ou “em ecrãs pequenos”?  
  → A alteração é **só para esse(s) breakpoint(s)**.
- Nesse caso: **estrutura base = intocada**. Toda a mudança estrutural (contentores, flex, posição, visibilidade) vai **dentro do(s) bloco(s) `@media`** correspondente(s).

### 2. Onde escrever o código

- **Estrutura base:** CSS fora de qualquer `@media`. Define o layout “normal” (tipicamente desktop / ecrã grande).
- **Mudança só para um breakpoint:**  
  - Localizar o bloco `@media` já existente para esse breakpoint (ex.: `max-width: 905px`) — em **`layout/responsive.css`** para layout global, ou no ficheiro do componente em `components/` se for override só desse componente.  
  - Inserir **só aí** as regras que mudam contentores, ordem dos elementos, um botão “fora” do contentor, etc.

### 3. HTML / DOM

- Se for preciso um contentor extra ou mover um elemento “para fora” só em certo breakpoint:
  - Preferir soluções que não mudem a estrutura base do HTML para todos os ecrãs (ex.: usar ordem visual com CSS no `@media`, ou um wrapper que só tem impacto visual dentro do breakpoint).
  - Se for necessário um elemento extra no DOM (ex.: contentor só para mobile), esse elemento pode ser mostrado/estilizado **apenas** dentro do `@media`; na base, não deve afetar o layout dos dois botões no contentor original.

### 4. Consistência com a regra dos breakpoints

- Continuar a seguir a regra **um breakpoint = um bloco `@media`** (ver `breakpoints-media-queries.md`).
- As modificações estruturais responsivas são **conteúdo** desses blocos, não novos blocos duplicados.

---

## Resumo em poucas linhas

- **Base** = CSS fora de `@media` → define o layout padrão (ex.: contentor com dois botões em flex numa linha).  
- **Pedido “só abaixo de 905px”** (ou outro breakpoint) → toda a alteração estrutural (botão fora do contentor, novo contentor, etc.) fica **apenas** dentro do `@media` desse breakpoint.  
- **Acima desse breakpoint** → a estrutura base mantém-se exatamente como está; nada na base é alterado para “servir” o comportamento das telas pequenas.

Assim, uma modificação estrutural que deve mudar só em alguns pontos (breakpoints) **não altera a base toda** — altera apenas o que se vê nesses breakpoints, dentro dos respetivos blocos `@media`.

---

*Documento de referência do projeto Dash-POS. Deve ser seguido sempre que se pedirem mudanças de responsividade que afetem estrutura (contentores, posição de elementos) apenas em certos tamanhos de ecrã.*
