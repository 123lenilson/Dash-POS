# Camada 1 — CSS (raiz, base, layout)

Este documento consolida todo o código CSS da **raiz** de `assets/css/`, da pasta **base/** e da pasta **layout/**.

---

<!-- ========== INÍCIO: main.css ========== -->

## main.css (raiz)

```css
/* ================================================
   DASH-POS — Ponto de entrada CSS
   Ficheiro: assets/css/main.css
   ÚNICO ficheiro que faz @import de todos os outros
   ================================================ */

/* === BASE === */
@import './base/variables.css';
@import './base/reset.css';
@import './base/typography.css';

/* === LAYOUT === */
@import './layout/interface.css';

/* === COMPONENTS === */
@import './components/skeleton.css';
@import './components/header.css';
@import './components/search.css';
@import './components/categories.css';
@import './components/product-card.css';
@import './components/cart.css';
@import './components/cart-footer.css';
@import './components/keypad.css';
@import './components/payment-methods.css';
@import './components/invoice-type.css';
@import './components/toggle-select-painel.css';
@import './components/client-panel.css';
@import './components/bottom-sheet.css'; /* sem alterações na correção doctype/cart — ver camada_2_js.md */
@import './components/alerts.css';
@import './components/modals.css';

/* === RESPONSIVE (sempre por último) === */
@import './layout/responsive.css';
```

<!-- ========== FIM: main.css ========== -->

---

<!-- ========== INÍCIO: factura.css ========== -->

## factura.css (raiz)

```css
/* ========= CORREÇÃO CRÍTICA PARA RENDERING DE FONTES ========= */
#inv-a4-container-principal,
#inv-a4-container-principal * {
    font-family: Arial, Helvetica, sans-serif !important;
    font-variant: normal !important;
    font-feature-settings: normal !important;
    letter-spacing: 0 !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
}

/* ========= FORÇA FONT-WEIGHT EXPLÍCITO ========= */
#inv-a4-container-principal {
    font-weight: 400; /* Normal weight explícito */
}

#inv-a4-container-principal strong,
#inv-a4-container-principal b,
#inv-a4-container-principal th {
    font-weight: 700 !important; /* Bold explícito apenas onde necessário */
}

/* ========= RESET ESPECÍFICO PARA FATURA COM PREFIXO inv-a4- ========= */
#inv-a4-container-principal,
#inv-a4-container-principal * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* ========= CONTAINER PRINCIPAL ========= */
#inv-a4-container-principal {
    width: 100%;
    min-height: 100vh;
    font-family: Arial, Helvetica, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 0;
    background: #f5f5f5;
}

/* Container de múltiplas páginas */
.inv-a4-container-multiplas-paginas {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: auto;
    margin: 0 auto;
    padding: 0;
}

/* ========= CADA PÁGINA DA FATURA ========= */
.inv-a4-interface-fatura,
.inv-a4-pagina-fatura {
    width: 210mm;
    height: 297mm;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 12px;
    background: white;
    margin-bottom: 20px;
}

.inv-a4-pagina-fatura:last-child,
.inv-a4-interface-fatura:last-child {
    margin-bottom: 0;
}

/* ========= SESSÕES DA FATURA ========= */
.inv-a4-sessao-cabecalho {
    height: 270px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    font-size: 16px;
}

.inv-a4-sessao-corpo-central {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.inv-a4-sessao-rodape {
    height: 390px;
    font-size: 16px;
}

/* ========= CABEÇALHO - INFORMAÇÕES DA EMPRESA ========= */
.inv-a4-infor-empresa {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 10px;
}

.inv-a4-infor-empresa img {
    width: 100px;
    height: auto;
    margin: 10px 0;
}

.inv-a4-infor-empresa h3 {
    font-size: 20px;
    color: #333;
    margin: 5px 0;
}

.inv-a4-dados-empresa {
    display: flex;
    flex-direction: column;
    font-size: 14px;
    color: #000;
    font-weight: normal;
}

.inv-a4-dados-empresa span {
    margin: 2px 0;
}

/* ========= CABEÇALHO - FATURA ========= */
.inv-a4-cabe-fatura {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.inv-a4-cabe-fatura .inv-a4-titulo-fatura,
.inv-a4-cabe-fatura .inv-a4-container-infor-cliente {
    flex: 1;
    display: flex;
}

.inv-a4-titulo-fatura {
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-start;
    text-align: right;
    padding: 10px;
}

.inv-a4-container-infor-cliente {
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    text-align: right;
    height: 100%;
}

.inv-a4-container-infor-cliente > div {
    width: 100%;
    height: 50%;
    display: flex;
}

.inv-a4-infor-cliente {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-start;
    padding: 10px;
}

.inv-a4-codigo-barra-fatura {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    padding: 10px;
}

.inv-a4-qrcode-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}
 
.inv-a4-qrcode-container > div {
    display: flex;
    align-items: center;
    justify-content: center;
}

.inv-a4-qrcode-container img {
    border: 2px solid #333;
    padding: 5px;
    background: white;
}

.inv-a4-qrcode-text {
    font-size: 12px;
    font-weight: bold;
    color: #333;
    letter-spacing: 1px;
}

/* ========= CORPO CENTRAL - TABELA DE CABEÇALHO ========= */
.inv-a4-tabela-cabecalho-corpo {
    width: 100%;
    margin-bottom: 10px;
}

.inv-a4-tabela-cabecalho-corpo table {
    width: 100%;
    border-collapse: collapse;
    border-bottom: 3px double #000;
    table-layout: fixed;
    text-align: left;
    vertical-align: middle;
    font-size: 13px;
    color: #333;
    word-wrap: break-word;
    font-family: Arial, Helvetica, sans-serif !important; /* ✅ ADICIONAR */
    letter-spacing: 0 !important; /* ✅ ADICIONAR */
}

.inv-a4-tabela-cabecalho-corpo tr:first-child th {
    border-top: 2px solid #000;
    font-weight: bold;
    font-size: 15px;
}

.inv-a4-tabela-cabecalho-corpo th {
    font-weight: 700; /* ✅ MUDAR de 'bold' para '700' */
    text-transform: capitalize;
    font-family: Arial, Helvetica, sans-serif !important; /* ✅ ADICIONAR */
}

.inv-a4-tabela-cabecalho-corpo th:nth-child(1),
.inv-a4-tabela-cabecalho-corpo td:nth-child(1) {
    width: 20%;
}

.inv-a4-tabela-cabecalho-corpo th:nth-child(2),
.inv-a4-tabela-cabecalho-corpo td:nth-child(2) {
    width: 10%;
}

.inv-a4-tabela-cabecalho-corpo th:nth-child(3),
.inv-a4-tabela-cabecalho-corpo td:nth-child(3) {
    width: 30%;
}

.inv-a4-tabela-cabecalho-corpo th:nth-child(4),
.inv-a4-tabela-cabecalho-corpo td:nth-child(4) {
    width: 15%;
}

.inv-a4-tabela-cabecalho-corpo th:nth-child(5),
.inv-a4-tabela-cabecalho-corpo td:nth-child(5) {
    width: 30%;
}

/* ========= TABELA DE PRODUTOS ========= */
.inv-a4-tabela-produtos {
    width: 100%;
    height: 370px;
    margin-bottom: 12px;
}

.inv-a4-tabela-produtos table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.inv-a4-tabela-produtos thead {
    background-color: #dad9d9;
    border-top: 2px solid #dad9d9;
    border-bottom: 2px solid #dad9d9;
    position: sticky;
    top: 0;
    z-index: 1;
}

.inv-a4-tabela-produtos th,
.inv-a4-tabela-produtos td {
    text-align: left;
    border-bottom: 1px solid #ddd;
    color: #000;
    font-family: Arial, Helvetica, sans-serif !important; /* ✅ ADICIONAR */
    letter-spacing: 0 !important; /* ✅ ADICIONAR */
}

.inv-a4-tabela-produtos th {
    font-weight: 700; /* ✅ MUDAR de 'bold' para '700' */
    font-size: 13px;
}

.inv-a4-tabela-produtos td {
    font-size: 11px;
    padding: 2px 0px;
    font-weight: 400; /* ✅ ADICIONAR: força peso normal */
}

.inv-a4-tabela-produtos tbody tr:hover {
    background-color: #f9f9f9;
}

.inv-a4-tabela-produtos th:nth-child(1),
.inv-a4-tabela-produtos td:nth-child(1) {
    width: 4%;
}

.inv-a4-tabela-produtos th:nth-child(2),
.inv-a4-tabela-produtos td:nth-child(2) {
    width: 53%;
    text-align: left;
}

.inv-a4-tabela-produtos th:nth-child(3),
.inv-a4-tabela-produtos td:nth-child(3) {
    width: 5%;
}

.inv-a4-tabela-produtos th:nth-child(4),
.inv-a4-tabela-produtos td:nth-child(4) {
    width: 17%;
}

.inv-a4-tabela-produtos th:nth-child(5),
.inv-a4-tabela-produtos td:nth-child(5) {
    width: 9%;
}

.inv-a4-tabela-produtos th:nth-child(6),
.inv-a4-tabela-produtos td:nth-child(6) {
    width: 9%;
}

.inv-a4-tabela-produtos th:nth-child(7),
.inv-a4-tabela-produtos td:nth-child(7) {
    width: 9%;
    text-align: right;
}

/* ========= RODAPÉ ========= */
.inv-a4-div-1,
.inv-a4-div-3 {
    border-bottom: 2px solid #000000;
}

.inv-a4-div-3 {
    font-size: 14px;
    text-align: center;
    padding: 7px 0px;
}

.inv-a4-div-1 {
    display: flex;
    flex: 1;
}

.inv-a4-div-1-sub:first-child {
    width: 20%;
    text-align: left;
    font-size: 16px;
    font-weight: bold;
}

.inv-a4-div-1-sub:last-child {
    flex: 1;
    text-align: center;
    font-size: 14px;
}

.inv-a4-div-2 {
    display: flex;
    gap: 10px;
    padding: 5px 0px;
    flex: 1;
}

.inv-a4-resumo-fatura {
    width: 40%;
    margin-left: auto;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.inv-a4-resumo-fatura table {
    width: 80%;
    border-collapse: collapse;
    font-size: 14px;
    margin-left: auto;
}

.inv-a4-tab-1-resumo-fatura {
    border-bottom: 1px solid #000000;
}

.inv-a4-tab-1-resumo-fatura th,
.inv-a4-tab-2-resumo-fatura th {
    text-align: left;
    padding-top: 3px;
    padding-bottom: 3px;
}

.inv-a4-tab-2-resumo-fatura {
    margin-top: 3px;
}

.inv-a4-tab-1-resumo-fatura td {
    text-align: right;
    padding-top: 3px;
    padding-bottom: 3px;
}

.inv-a4-tab-2-resumo-fatura td {
    text-align: left;
    padding: 0px 2px;
    border: 1px solid #000000;
}

.inv-a4-tabela-impostos {
    width: 60%;
    align-self: flex-start;
}

.inv-a4-tabela-impostos table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;  /* ✅ Reduzido de 14px para 12px */
    border: 1px solid #000;
}

.inv-a4-tabela-impostos th,
.inv-a4-tabela-impostos td {
    border: 1px solid #000;
    padding: 2px;
    text-align: center;
    font-size: 12px;  /* ✅ Garantir 12px em todos os elementos */
    font-family: Arial, Helvetica, sans-serif !important; /* ✅ ADICIONAR */
}

.inv-a4-tabela-impostos thead {
    background-color: #f3f3f3;
}

.inv-a4-div-4 {
    display: flex;
    justify-content: space-between;
    padding: 10px 0px;
}

.inv-a4-div-4 div {
    height: 50px;
}

.inv-a4-operador {
    font-weight: bold;
}

.inv-a4-div-4 div:first-child {
    font-size: 13px;
}

.inv-a4-div-4 div:first-child p {
    padding-top: 2px;
}

.inv-a4-div-4 div:last-child {
    display: flex;
    align-items: flex-end;
    font-size: 12px;
}

/* ========= ELEMENTOS ADICIONAIS ========= */
.inv-a4-obs-fatura {
    width: 100%;
    margin-top: 11px;
}

.inv-a4-obs-fatura h5 {
    font-size: 14px;
    margin-bottom: 5px;
}

.inv-a4-parag-obs-fatura {
    font-size: 13px;
}

.inv-a4-transportado-valor {
    padding: 2px 10px;
    background-color: #fafafa;
    border: 1px solid #fafafa;
    font-size: 13px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 10px;
}

/* A TRANSPORTAR - Alinhado à DIREITA (Página 1) */
.inv-a4-transportado-direita {
    text-align: right;
    justify-content: flex-end;
}

/* TRANSPORTADO - Alinhado à ESQUERDA (Páginas 2+) */
.inv-a4-transportado-esquerda {
    text-align: left;
    justify-content: flex-start;
}

.inv-a4-text-transportado-1 {
    color: #495057;
}

.inv-a4-text-transportado-2 {
    color: #d14b59;
}

.inv-a4-valor-extenso {
    font-size: 13px;
    text-align: right;
    padding: 2px 0px;
}

.inv-a4-pagina-fatura {
    page-break-after: always;
}

.inv-a4-pagina-fatura:last-child {
    page-break-after: auto;
}

.inv-a4-info-pagina {
    font-size: 12px;
    color: #666;
    text-align: center;
    margin-top: 5px;
}

/* ========= MEDIA QUERY PARA IMPRESSÃO ========= */
@media print {
    /* Remove cabeçalhos e rodapés padrão do navegador */
    @page {
        margin: 0 !important;
        size: A4 portrait;
    }

    /* Remove margens do body/html na impressão */
    html,
    body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
    }

    /* Esconde todo o conteúdo exceto a fatura */
    body * {
        visibility: hidden;
    }

    #inv-a4-container-principal,
    #inv-a4-container-principal * {
        visibility: visible;
    }

    #inv-a4-container-principal {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 0 !important;
        background: white !important;
    }

    /* Remove espaços extras entre páginas */
    .inv-a4-container-multiplas-paginas {
        gap: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
    }

    /* Garante que a fatura ocupe a página corretamente */
    .inv-a4-interface-fatura,
    .inv-a4-pagina-fatura {
        width: 210mm !important;
        height: 297mm !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 !important;
        padding: 12px !important;
        page-break-after: always !important;
        page-break-inside: avoid !important;
    }

    /* Remove quebra de página após a última página */
    .inv-a4-pagina-fatura:last-child,
    .inv-a4-interface-fatura:last-child {
        page-break-after: auto !important;
    }

    /* Garante que seções não quebrem no meio */
    .inv-a4-sessao-cabecalho,
    .inv-a4-sessao-corpo-central,
    .inv-a4-sessao-rodape {
        page-break-inside: avoid !important;
    }
}
```

<!-- ========== FIM: factura.css ========== -->

---

<!-- ========== INÍCIO: factura80.css ========== -->

## factura80.css (raiz)

```css
/* ========= CORREÇÃO CRÍTICA PARA RENDERING DE FONTES 80MM ========= */
.recibo-inv80,
.recibo-inv80 * {
    font-family: Arial, Helvetica, sans-serif !important;
    font-variant: normal !important;
    font-feature-settings: normal !important;
    letter-spacing: 0 !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
}

/* ========= FORÇA FONT-WEIGHT EXPLÍCITO ========= */
.recibo-inv80 {
    font-weight: 400; /* Normal weight explícito */
}

.recibo-inv80 .label-inv80,
.recibo-inv80 strong,
.recibo-inv80 b {
    font-weight: 700 !important; /* Bold explícito */
}

.recibo-inv80 {
  width: 80mm;
  background: white;
  padding: 4px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  font-size: 8px;
  line-height: 1.1;
}

.logo-inv80 {
  text-align: center;
  margin-bottom: 3px;
}

.logo-icon-inv80 {
  font-size: 24px;
  font-weight: bold;
  transform: skewX(-15deg);
  display: inline-block;
  margin-bottom: 2px;
}

/* Logo da empresa (imagem) */
.logo-img-inv80 {
  max-width: 50mm;        /* Tamanho ideal para folha de 80mm */
  max-height: 20mm;       /* Altura máxima para não ocupar muito espaço */
  width: auto;
  height: auto;
  display: block;
  margin: 0 auto 3px;     /* Centraliza e adiciona margem inferior */
  object-fit: contain;    /* Mantém proporção da imagem */
}

.empresa-inv80 {
  text-align: center;
  margin-bottom: 3px;
  font-weight: bold;
  font-size: 9px;
}

.empresa-info-inv80 {
  text-align: center;
  font-size: 7px;
  margin-bottom: 4px;
  line-height: 1.2;
}

.separador-inv80 {
  border-top: 1px dashed #000;
  margin: 4px 0;
}

.box-cliente-inv80 {
  border: 1px solid #000;
  padding: 3px;
  margin-bottom: 4px;
  font-size: 7px;
}

.cliente-row-inv80 {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1px;
}

.label-inv80 {
  font-weight: bold;
}

.box-fatura-inv80 {
  border: 1px solid #000;
  padding: 3px;
  margin-bottom: 4px;
  font-size: 7px;
  text-align: right;
}

.original-inv80 {
  float: right;
  font-size: 7px;
  font-weight: bold;
  margin-top: -2px;
}



.table-inv80 {
    width: 100% !important;
    border-collapse: collapse;
    margin: 3px 0;
    font-size: 7px;
    font-family: Arial, Helvetica, sans-serif !important; /* ✅ ADICIONAR */
    letter-spacing: 0 !important; /* ✅ ADICIONAR */
}

.table-inv80 th {
    border-bottom: 1px solid #000;
    padding: 2px 1px;
    text-align: left;
    font-weight: 700; /* ✅ MUDAR de 'bold' para '700' */
    font-size: 6px;
    font-family: Arial, Helvetica, sans-serif !important; /* ✅ ADICIONAR */
}

.table-inv80 td {
    padding: 2px 1px;
    border-bottom: 1px dashed #ccc;
    font-family: Arial, Helvetica, sans-serif !important; /* ✅ ADICIONAR */
    font-weight: 400; /* ✅ ADICIONAR */
    letter-spacing: 0 !important; /* ✅ ADICIONAR */
}
.table-inv80 th:nth-child(1),
.table-inv80 td:nth-child(1) {
    width: 50%;
    text-align: left;
}

.table-inv80 th:nth-child(2),
.table-inv80 td:nth-child(2) {
    width: 10%;
    text-align: left;
}

.table-inv80 th:nth-child(3),
.table-inv80 td:nth-child(3) {
    width: 20%;
    text-align: left;
}

.table-inv80 th:nth-child(4),
.table-inv80 td:nth-child(4) {
    width: 10%;
    text-align: left;
}

.table-inv80 th:nth-child(5),
.table-inv80 td:nth-child(5) {
    width: 10%;
    text-align: left;
}
.table-inv80 th:nth-child(6),
.table-inv80 td:nth-child(6) {
    width: 10%;
    text-align: right;
}

.totais-inv80 {
  margin: 3px 0;
  font-size: 8px;
}

.total-row-inv80 {
  display: flex;
  justify-content: space-between;
  padding: 1px 0;
}

.total-row-inv80.destaque-inv80 {
  font-weight: bold;
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 2px 0;
  margin: 2px 0;
}

.pagamento-inv80 {
  margin: 3px 0;
  font-size: 7px;
}

.resumo-impostos-inv80 {
  margin: 3px 0;
}

.resumo-impostos-inv80 h4 {
  font-size: 7px;
  margin-bottom: 2px;
  text-align: center;
}

/* Specific styles for tax summary table */
.resumo-impostos-inv80 .table-inv80.tax-summary-table {
  width: 100% !important;
}

.resumo-impostos-inv80 .table-inv80.tax-summary-table th:nth-child(1),
.resumo-impostos-inv80 .table-inv80.tax-summary-table td:nth-child(1),
.resumo-impostos-inv80 .table-inv80.tax-summary-table th:nth-child(2),
.resumo-impostos-inv80 .table-inv80.tax-summary-table td:nth-child(2),
.resumo-impostos-inv80 .table-inv80.tax-summary-table th:nth-child(3),
.resumo-impostos-inv80 .table-inv80.tax-summary-table td:nth-child(3) {
  width: 33.33% !important;
}

.rodape-inv80 {
  text-align: center;
  font-size: 6px;
  margin-top: 3px;
  padding-top: 3px;
  border-top: 1px dashed #000;
}

.rodape-inv80 p {
  margin: 1px 0;
}

.agradecimento-inv80 {
  text-align: center;
  font-style: italic;
  margin-top: 3px;
  font-size: 8px;
}

.qrcode-container-inv80 {
  text-align: center;
  margin-top: 5px;
  padding: 5px 0;
}

#qrcode-inv80 {
  display: inline-block;
  margin: 0 auto;
}

#qrcode-inv80 img {
  border: 1px solid #000;
  padding: 2px;
}

.qrcode-text-inv80 {
  font-size: 7px;
  font-weight: bold;
  margin-top: 2px;
}

/* ========= MEDIA QUERY PARA IMPRESSÃO ========= */
@media print {
    /* Remove cabeçalhos e rodapés padrão do navegador */
    @page {
        margin: 0 !important;
        size: 80mm auto; /* ✅ Largura fixa 80mm, altura automática */
    }

    /* Remove margens do body/html na impressão */
    html,
    body {
        margin: 0 !important;
        padding: 0 !important;
        width: 80mm !important;
        height: auto !important;
    }

    /* Esconde todo o conteúdo exceto a fatura */
    body * {
        visibility: hidden;
    }

    /* ✅ TORNA O CONTAINER 80MM VISÍVEL NA IMPRESSÃO */
    #factura80-container-inv80,
    #factura80-container-inv80 * {
        visibility: visible !important;
    }

    #factura80-container-inv80 {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 80mm !important;
        height: auto !important;
        padding: 0 !important;
        background: white !important;
        z-index: 9999 !important;
    }

    /* Remove espaços extras */
    .recibo-inv80 {
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 !important;
        padding: 4px !important;
        page-break-after: auto !important;
        page-break-inside: avoid !important;
    }

    /* Garante que elementos não quebrem */
    .logo-inv80,
    .empresa-inv80,
    .box-cliente-inv80,
    .box-fatura-inv80,
    .totais-inv80,
    .pagamento-inv80,
    .resumo-impostos-inv80,
    .rodape-inv80 {
        page-break-inside: avoid !important;
    }
}

/* ========= ESTILOS PARA TELA (preview) ========= */
@media screen {
    #factura80-container-inv80 {
        position: fixed !important;
        top: -9999px !important;
        left: -9999px !important;
        z-index: -1 !important;
    }
}
```

<!-- ========== FIM: factura80.css ========== -->

---

<!-- ========== INÍCIO: base/typography.css ========== -->

## base/typography.css

```css
/* ================================================
   BASE: Typography
   Ficheiro: assets/css/base/typography.css
   Parte do sistema Dash-POS
   Estilos globais de texto (minimal - fontes/tamanhos em variables + reset)
   ================================================ */
```

<!-- ========== FIM: base/typography.css ========== -->

---

<!-- ========== INÍCIO: base/variables.css ========== -->

## base/variables.css

```css
/* ================================================
   BASE: Variables
   Ficheiro: assets/css/base/variables.css
   Parte do sistema Dash-POS
   ================================================ */

:root{
  --bg:#f6f7fb;
  --card:#ffffff;
  --muted:#8b8fa3;
  --text:#23243a;
  --text-1:#23243a;
  --text-2:#8b8fa3;
  --accent:#6c5ce7;
  --accent-2:#9b8cff;
  --ok:#22c55e;
  --warn:#ef4444;
  --line:#ececf3;
  --shadow: 0 2px 8px rgba(0,0,0,.03);  /* ✅ Mais leve e neutro */
  --shadow-strong: 0 4px 16px rgba(0,0,0,.05);  /* ✅ Mais leve e neutro */
  --radius: 16px;

  /* 🎨 NOVO ESQUEMA DE CORES - Sistema Principal */
  --color-selection: #222222;           /* Cor de seleção: hover, active, selecionado */
  --color-primary: #FFCC99;             /* Cor principal: botões, destaques, CTAs */
  --color-primary-hover: #FFB366;       /* Hover da cor principal */
  --color-primary-shadow: rgba(255, 204, 153, 0.4);  /* Sombra da cor principal */

  /* Tons de cinza (mantidos) */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* Sidebar width: clamp(min, preferred, max) */
  --sidebar-width: clamp(280px, 22vw, 360px);
  --mobile-nav-width: min(320px, 80vw); /* largura do sidebar do menu mobile */

  /* ── Tipografia responsiva (escala compacta) ────────────── */
  --font-xs:    clamp(7px,  0.65vw,  9px);
  --font-sm:    clamp(9px,  0.75vw,  11px);
  --font-base:  clamp(10px, 0.85vw,  12px);
  --font-md:    clamp(11px, 0.95vw,  13px);
  --font-lg:    clamp(12px, 1.1vw,   14px);

  /* ── Espaçamentos responsivos (escala compacta) ───────── */
  --space-xs:   clamp(2px,  0.3vw,  4px);
  --space-sm:   clamp(4px,  0.45vw,  6px);
  --space-md:   clamp(5px,  0.65vw,  8px);
  --space-lg:   clamp(8px,  1vw,     12px);
  --space-xl:   clamp(10px, 1.2vw,   16px);
}
```

<!-- ========== FIM: base/variables.css ========== -->

---

<!-- ========== INÍCIO: base/reset.css ========== -->

## base/reset.css

```css
/* ================================================
   BASE: Reset
   Ficheiro: assets/css/base/reset.css
   Parte do sistema Dash-POS
   ================================================ */

*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  font-size: var(--font-base);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Arial;
  line-height: 1.4;
  color:var(--text);
  background:#ffffff !important;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  overflow:hidden;
}

/* scrollbars gerais (onde permitimos) */
.side::-webkit-scrollbar, .main::-webkit-scrollbar { width:6px; height:6px; }
.side::-webkit-scrollbar-thumb, .main::-webkit-scrollbar-thumb { background:#e7e7ef; border-radius:6px; }
```

<!-- ========== FIM: base/reset.css ========== -->

---

<!-- ========== INÍCIO: layout/interface.css ========== -->

## layout/interface.css

```css
/* ================================================
   LAYOUT: Interface
   Ficheiro: assets/css/layout/interface.css
   Parte do sistema Dash-POS
   ================================================ */

.interface{
  display:grid;
  grid-template-columns: 64% 36%;
  gap:0;
  height:100vh;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background:#ffffff !important;
}

/* Quando o side panel estiver aberto */
.interface.panel-open {
  grid-template-columns: 39% 36% 25%;
}

.main{
  background:#ffffff !important;
  overflow:hidden;
  padding:0;
  margin:0;
  position:relative;
  display:flex;
  flex-direction:column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Quando painel aberto, empurra produtos */
.interface.panel-open .main {
  width: 100% !important;
}

/* SIDE (comentado no original - mantido para compatibilidade) */
.side{
  background:#fff;
  border-left:1px solid var(--line);
  overflow:hidden;
  display:flex;
  flex-direction:column;
  min-width: var(--sidebar-width);
  max-width: var(--sidebar-width);
  box-sizing:border-box;
}
.side-inner{ display:flex; flex-direction:column; height:100%; }

/* FORÇA O .main SEMPRE SER BRANCO, em qualquer estado */
.main,
.interface.panel-open .main,
.interface.panel-open ~ .main,
.main:has(+ .checkout-panel),
.main {
  background: #ffffff !important;
}

/* FORÇA FUNDO BRANCO TOTAL NA SEÇÃO STICKY */
.sticky-section-home {
  background: #ffffff !important;
  position: relative !important;
  z-index: 1;
  width: 100%;
  left: 0;
  right: 0;
}

/* Camada branca ABSOLUTA que mata qualquer vazamento do pai */
.sticky-section-home::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  z-index: -1;
  pointer-events: none;
}

/* Garante que os filhos não herdem nada estranho */
.sticky-section-home > * {
  position: relative;
  z-index: 2;
}

/* Se ainda aparecer uma linha cinza em cima/baixo (borda do .main vazando) */
.main > .sticky-section-home {
  margin: 0 !important;
  padding: 0 !important;
}

/* CHECKOUT PANEL INTEGRADO (40% direita) */
.checkout-panel {
  background: #f8f9fa;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  overflow: hidden;
  height: 100vh;
  box-sizing: border-box;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Quando painel aberto, comprime checkout */
.interface.panel-open .checkout-panel {
  width: 100% !important;
}
```

<!-- ========== FIM: layout/interface.css ========== -->

---

<!-- ========== INÍCIO: layout/responsive.css ========== -->

## layout/responsive.css

*(Conteúdo integral do ficheiro — ver bloco de código abaixo.)*

```css
/* ================================================
   LAYOUT: Responsive
   Ficheiro: assets/css/layout/responsive.css
   Parte do sistema Dash-POS
   TODOS os @media queries globais do sistema
   ================================================ */

/* 2 colunas entre 350px e 450px */
@media (min-width:350px) and (max-width:450px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: var(--space-md);
    padding: 0 var(--space-lg) var(--space-xl);
  }
  .product-grid .card { margin:0; }
}

/* phones < 350px: 1 coluna */
@media (max-width:349px) {
  .product-grid {
    grid-template-columns: 1fr !important;
    padding: 0 var(--space-md) var(--space-xl);
  }
}

/* Botão menu mobile - base (escondido por defeito) */
.main-header .mobile-menu-btn,
.header .mobile-menu-btn,
.navbar .mobile-menu-btn {
  display: none !important;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: none;
}

@media (max-width: 890px) {
  .main .main-nav { display:none !important; }
  .controls { display:none !important; }
  .date-time { display:none !important; }

  .main-header .mobile-menu-btn,
  .header .mobile-menu-btn,
  .navbar .mobile-menu-btn {
    display: inline-grid !important;
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
    width:36px;
    height:36px;
    border-radius:6px;
    border:0;
    background:transparent;
    color:var(--muted);
    place-items:center;
    cursor:pointer;
    transition: all .12s ease;
    font-size: var(--font-lg);
  }

  .main .main-nav {
    display: flex !important;
    flex-direction: column;
    gap: var(--space-sm);
    align-items: flex-start;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: var(--mobile-nav-width);
    max-width: 100%;
    padding: var(--space-lg) var(--space-lg);
    box-sizing: border-box;
    background: var(--card);
    border: none;
    border-radius: 0;
    box-shadow: 0 18px 50px rgba(10,10,40,0.12);
    transform: translateX(-110%);
    transition: transform .28s cubic-bezier(.2,.9,.2,1);
    z-index: 1200;
    visibility: hidden;
    pointer-events: none;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .main .main-nav .nav-link{
    display:flex;
    width:100%;
    padding: var(--space-md) var(--space-md);
    margin: clamp(2px, 0.2vw, 4px) 0;
    border-radius:4px;
    justify-content:flex-start;
    text-align:left;
    font-size: var(--font-md);
  }

  .main-header.nav-open .main-nav {
    transform: translateX(0);
    visibility: visible;
    pointer-events: auto;
  }
}

@media (max-width: 1100px) {
  .cart-body-wrapper {
    flex-direction: column;
  }

  .cart-body-wrapper:not(.doc-panel-open) .doc-type-panel-slider {
    flex: 0 0 0;
    height: 0;
    min-height: 0;
    overflow: hidden;
  }

  .cart-body-wrapper:not(.doc-panel-open) .cart-content-area {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
  }

  .cart-body-wrapper.doc-panel-open .doc-type-panel-slider.active {
    width: 100%;
    min-width: 100%;
    flex: 1;
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .cart-body-wrapper.doc-panel-open .cart-content-area {
    flex: 0 0 0;
    height: 0;
    min-height: 0;
    overflow: hidden;
  }

  .product-grid{ grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); padding: 0 var(--space-lg) var(--space-xl); }

  .date-time {
    display: none !important;
    visibility: hidden !important;
  }
}

/* RESPONSIVIDADE DO SEARCH BAR CONTAINER */
@media (min-width: 761px) and (max-width: 1100px) {
  .search-bar-container {
    margin: var(--space-md) 0;
    padding: 0 var(--space-lg);
    gap: var(--space-md);
  }

  .toggle-select-painel {
    padding: var(--space-lg) var(--space-lg);
    font-size: var(--font-md);
  }
}

@media (min-width: 906px) {
  .footer-amount-row .footer-amount-wrapper {
    flex: 1 1 auto;
    min-width: 80px;
  }
  .footer-amount-row .footer-pay-cell {
    display: none !important;
  }

  .bottom-sheet-overlay,
  .bottom-sheet {
    display: none !important;
  }

  .client-panel-close-btn {
    display: none !important;
  }
}

@media (max-width: 905px) {
  .app-skeleton { grid-template-columns: 1fr; }
  .skeleton-layout-side { display: none; }
  .skeleton-product-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-md); }
  .skeleton-mobile-wrap { display: block !important; }

  .main-header-right .header-search-slot {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    flex: 1;
    min-width: 0;
    justify-content: flex-end;
  }
  .main-header-right .date-time {
    display: none;
  }
  .main-header .header-search-slot .search-bar-inner {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    min-width: 0;
  }
  .main-header .header-search-slot .search-wrapper {
    display: flex;
    align-items: center;
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
    flex: 0 0 auto;
    min-width: 0;
    gap: var(--space-sm);
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--collapsed .search-icon-left {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    border-radius: 50%;
    background: #E0E0E0;
    color: #555;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-lg);
    cursor: pointer;
    flex-shrink: 0;
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--collapsed input,
  .main-header .header-search-slot .search-wrapper.search-wrapper--collapsed .clear-btn {
    width: 0;
    min-width: 0;
    overflow: hidden;
    opacity: 0;
    padding: 0;
    margin: 0;
    border: none;
    pointer-events: none;
    position: absolute;
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--collapsed .barcode-toggle-inline {
    flex-shrink: 0;
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--expanded {
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 9999px;
    padding: var(--space-sm) var(--space-md) var(--space-sm) var(--space-md);
    gap: var(--space-sm);
    flex: 1;
    max-width: 180px;
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--expanded .search-icon-left {
    font-size: var(--font-md);
    flex-shrink: 0;
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--expanded input {
    width: 100%;
    min-width: 0;
    opacity: 1;
    position: static;
    pointer-events: auto;
    font-size: var(--font-md);
  }
  .main-header .header-search-slot .search-wrapper.search-wrapper--expanded .barcode-toggle-inline,
  .main-header .header-search-slot .search-wrapper.search-wrapper--expanded .clear-btn {
    width: auto;
    min-width: 0;
    opacity: 1;
    position: static;
    pointer-events: auto;
  }
  .sticky-section-home .search-bar-container {
    display: none;
  }

  .search-wrapper {
    padding: var(--space-sm) var(--space-lg);
    gap: var(--space-sm);
    border-radius: 9999px;
  }

  .search-icon-left {
    font-size: var(--font-md);
  }

  .search-wrapper input {
    font-size: var(--font-md);
  }

  .barcode-toggle-inline {
    padding: clamp(3px, 0.3vw, 4px) var(--space-md);
    gap: var(--space-xs);
    border-radius: 6px;
  }

  .toggle-switch {
    width: 26px;
    height: 14px;
    border-radius: 7px;
  }

  .toggle-switch::before {
    width: 10px;
    height: 10px;
  }

  .barcode-toggle-inline input:checked + .toggle-switch::before {
    transform: translateX(12px);
  }

  .toggle-label-short {
    font-size: var(--font-sm);
  }

  .clear-btn {
    font-size: var(--font-lg);
    padding: clamp(2px, 0.2vw, 4px) var(--space-xs);
  }

  .invoice-type-options-panel {
    padding: var(--space-lg) var(--space-lg);
  }
  .invoice-toggle-option {
    padding: var(--space-md) var(--space-lg);
  }
  .toggle-label {
    font-size: var(--font-lg);
  }
  .format-toggle-option {
    padding: var(--space-md) var(--space-lg);
  }
  .format-label {
    font-size: var(--font-md);
  }

  .footer-amount-row {
    gap: var(--space-md);
  }
  .footer-amount-row .footer-amount-wrapper {
    flex: 1;
    min-width: 0;
    align-self: stretch;
    box-sizing: border-box;
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: clamp(2px, 0.3vw, 5px);
    padding: 0 var(--space-sm);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
  }
  .footer-amount-row .footer-amount-wrapper:focus-within {
    border-color: #000000;
    border-width: 1px;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }
  .footer-amount-row .footer-amount-input {
    flex: unset;
    min-width: 0;
    width: 100%;
    height: auto;
    padding: 0;
    /* 20pt Word ≈ 26.67px; em mobile mantém grande com clamp */
    font-size: clamp(20px, 2.5vw, 28px);
    font-weight: 700;
    text-align: center;
    color: #111111;
    background: transparent !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    caret-color: #6b7280;
    font-family: inherit;
    -webkit-appearance: none;
    appearance: none;
    line-height: 1;
  }
  .footer-amount-row .footer-amount-input:focus {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .footer-amount-row .footer-amount-input::placeholder {
    color: #888;
  }
  .footer-amount-row .footer-amount-wrapper .keypad-exact-btn--inline {
    display: flex;
    flex-shrink: 0;
    height: 28px;
    min-height: 28px;
    padding: 0 var(--space-md);
    font-size: var(--font-sm);
    font-weight: 700;
    border-radius: 4px;
    align-items: center;
    justify-content: center;
  }
  .keypad-final-row .keypad-exact-btn {
    display: none !important;
  }
  .footer-amount-row .footer-pay-cell {
    flex: 0 0 20%;
    width: 20%;
    min-width: 0;
    display: flex;
    align-items: stretch;
  }
  .footer-pay-cell .keypad-pay-btn {
    flex: 1;
    width: 100%;
    height: 38px;
    min-height: 38px;
  }
  .keypad-pay-btn--desktop {
    display: none !important;
  }

  .cart-sheet-tab-panel-fatura {
    padding-bottom: 8px;
    box-sizing: border-box;
  }
  .cart-sheet-tab-panel-fatura #cartContentArea {
    flex: 0 0 80%;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .cart-sheet-tab-panel-fatura .cart-footer {
    flex: 0 0 20%;
    min-height: 0;
    flex-shrink: 0;
    overflow: hidden;
    overflow-y: hidden;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    padding: var(--space-xs) 0 0;
    gap: clamp(3px, 0.3vw, 4px);
    border-top: 1px solid var(--line, #e5e7eb);
  }
  .cart-sheet-tab-panel-fatura .cart-footer .payment-methods-section,
  .cart-sheet-tab-panel-fatura .cart-footer .footer-amount-row {
    flex-shrink: 0;
    min-height: 0;
  }

  .interface{
    grid-template-columns: 1fr !important;
  }
  .interface.panel-open {
    grid-template-columns: 1fr !important;
  }
  .checkout-panel{
    display: none !important;
  }
  body { padding-bottom: 64px; }
  .sticky-bottom-menu { display: flex; }
  .search-bar-container .toggle-select-painel.cliente-btn {
    display: none !important;
  }
  .search-bar-container .search-wrapper {
    flex: 1 1 100%;
    max-width: 100%;
  }
  .main .product-grid {
    padding-bottom: 0;
  }

  .sticky-section-home {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg, #fff);
    padding-bottom: 0;
  }

  .main.col-60.products-col {
    height: auto;
    min-height: 0;
    overflow-x: hidden;
  }

  .products-container-wrapper {
    padding-bottom: 0;
    margin-bottom: 0;
  }

  .client-panel-close-btn {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 50%;
    background: #f1f5f9;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease, color 0.2s ease;
  }
  .client-panel-close-btn:hover {
    background: #e2e8f0;
    color: #334155;
  }
  .client-panel-close-btn i {
    font-size: var(--font-lg);
  }
}

@media (max-width: 768px) {
  #alertContainer {
    bottom: 10px;
    left: 10px;
    right: 10px;
    max-width: none;
  }

  .alert {
    min-width: auto;
    max-width: none;
  }

  .client-panel-slider {
    width: 320px;
    min-width: 320px;
  }

  .products-container-wrapper.panel-open .product-grid {
    margin-right: 320px;
  }

  .panel-body-slider {
    padding: var(--space-lg) var(--space-md);
    gap: var(--space-lg);
  }

  .client-section {
    gap: var(--space-sm);
  }

  .client-card {
    padding: var(--space-sm) var(--space-md);
  }

  .client-card-name {
    font-size: var(--font-sm);
  }

  .client-card-details {
    font-size: var(--font-xs);
  }

  .section-title {
    font-size: clamp(8px, 0.8vw, 10px);
    font-weight: 800;
    letter-spacing: 0.7px;
  }

  .client-search-input {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-sm);
    border-radius: 6px !important;
    -webkit-border-radius: 6px !important;
    -moz-border-radius: 6px !important;
  }

  .client-search-input::placeholder {
    font-size: var(--font-sm);
    color: #94a3b8;
  }

  .client-card-indicator {
    font-size: var(--font-md);
  }

  .client-form {
    gap: var(--space-md);
  }

  .client-form-input {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-sm);
  }

  .client-form-input::placeholder {
    font-size: var(--font-xs);
    color: #94a3b8;
  }

  .client-form-submit {
    padding: var(--space-sm) var(--space-lg);
    font-size: var(--font-sm);
  }
}
```

<!-- ========== FIM: layout/responsive.css ========== -->
