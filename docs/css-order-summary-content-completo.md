# Corpo do contentor «Ordem de Venda» — HTML e CSS

Referência do **corpo** do contentor de ordem de venda: HTML (`index.php` linhas 393-422) e todo o CSS que o estiliza. Os elementos HTML abaixo são estilizados exactamente pelas regras CSS indicadas; a apresentação visual (layout, espaçamentos, tipografia, cores) vem dessas regras.

---

## 1. HTML dos elementos

```html
<div class="order-summary-content">

  <!-- Linha: Total Ilíquido -->
  <div class="order-row">
    <span class="order-row-label">Total ilíquido</span>
    <span class="order-row-value" id="summaryNetTotal">Kz 0,00</span>
  </div>

  <!-- Linha: Total Impostos -->
  <div class="order-row">
    <span class="order-row-label">Total impostos</span>
    <span class="order-row-value order-row-value--tax" id="summaryTaxTotal">Kz 0,00</span>
  </div>

  <!-- Linha: Retenção -->
  <div class="order-row">
    <span class="order-row-label">Retenção</span>
    <span class="order-row-value order-row-value--retention" id="summaryRetention">Kz 0,00</span>
  </div>

  <!-- Separador antes do total -->
  <div class="order-total-divider"></div>

  <!-- Linha: Total a pagar — destacada -->
  <div class="order-row order-row--total">
    <span class="order-row-label">Total a pagar</span>
    <span class="order-row-value" id="summaryTotalPagar">Kz 0,00</span>
  </div>

</div>
```

---

## 2. CSS que estiliza estes elementos

Origem: **`assets/css/components/cart-footer.css`**.

```css
/* Contentor do corpo (lista de totais) */
.order-summary-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-top: var(--space-xs);
  overflow-y: auto;
  min-height: 0;
}

/* Linha genérica (ilíquido, impostos, retenção) */
.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--gray-200);
  gap: var(--space-lg);
  min-height: 0;
}
.order-row:last-child {
  border-bottom: none;
}

/* Label (esquerda) */
.order-row-label {
  font-size: var(--font-xs);
  font-weight: 400;
  color: var(--gray-500);
  white-space: nowrap;
  letter-spacing: 0.1px;
  flex-shrink: 0;
}

/* Valor (direita) */
.order-row-value {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--gray-800);
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.2px;
}
.order-row-value--tax {
  color: #e07b2e;
}
.order-row-value--retention {
  color: var(--gray-500);
}

/* Separador antes do total */
.order-total-divider {
  height: 1px;
  background: var(--gray-300);
  margin: var(--space-xs) 0;
  flex-shrink: 0;
}

/* Linha "Total a pagar" — destacada */
.order-row--total {
  border-bottom: none;
  padding: var(--space-md) 0 var(--space-xs);
}
.order-row--total .order-row-label {
  font-size: var(--font-sm);
  font-weight: 700;
  color: var(--gray-900);
}
.order-row--total .order-row-value {
  font-size: var(--font-base);
  font-weight: 800;
  color: var(--gray-900);
  letter-spacing: 0.3px;
}
```

---

## 3. Como o HTML é estilizado pelo CSS

Cada elemento do fragmento HTML acima é apresentado conforme as regras CSS que se aplicam às suas classes. Resumo por elemento:

| Elemento HTML | Classe(s) | Estilização aplicada pelo CSS |
|---------------|-----------|--------------------------------|
| **`<div class="order-summary-content">`** | `.order-summary-content` | Contentor em coluna flex que ocupa o espaço disponível (`flex: 1`), sem espaço entre linhas (`gap: 0`), com padding no topo e scroll vertical se necessário (`overflow-y: auto`). |
| **`<div class="order-row">`** (cada linha de total) | `.order-row` | Linha em flex com label à esquerda e valor à direita (`justify-content: space-between`), padding vertical, borda inferior cinza; a última linha perde a borda com `.order-row:last-child`. |
| **`<span class="order-row-label">`** | `.order-row-label` | Texto do rótulo: fonte pequena (`--font-xs`), peso normal, cor cinzenta (`--gray-500`), sem quebra de linha. |
| **`<span class="order-row-value">`** | `.order-row-value` | Valor numérico: fonte pequena, peso 600, cor escura (`--gray-800`), alinhado à direita e com números tabulares. |
| **`<span class="order-row-value order-row-value--tax">`** | `.order-row-value` + `.order-row-value--tax` | Mesmo que acima, mas a cor é sobrescrita para laranja (`#e07b2e`) nos impostos. |
| **`<span class="order-row-value order-row-value--retention">`** | `.order-row-value` + `.order-row-value--retention` | Mesmo que o valor base, com cor cinzenta (`--gray-500`) para a retenção. |
| **`<div class="order-total-divider">`** | `.order-total-divider` | Linha horizontal de 1px, fundo cinza (`--gray-300`), margem vertical, funcionando como separador antes do total. |
| **`<div class="order-row order-row--total">`** | `.order-row` + `.order-row--total` | Linha igual às outras em layout, mas sem borda inferior e com padding inferior menor; os filhos (label e valor) são estilizados pelas regras específicas abaixo. |
| **Label e valor dentro de `.order-row--total`** | `.order-row--total .order-row-label` e `.order-row--total .order-row-value` | Label e valor do total a pagar com fonte maior (`--font-sm` / `--font-base`), em negrito (700 / 800) e cor mais escura (`--gray-900`), para destacar o total. |

Em conjunto: o **HTML** define a estrutura (contentor, linhas, rótulos e valores); o **CSS** define como essa estrutura é desenhada (coluna flex, espaços, bordas, tamanhos de letra e cores). Qualquer alteração visual a este corpo deve ser feita nas regras em **`assets/css/components/cart-footer.css`** referidas na secção 2.
