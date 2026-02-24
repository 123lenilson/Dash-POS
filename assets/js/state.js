/* ================================================
   MÓDULO: State (Estado Global)
   Ficheiro: assets/js/state.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= DADOS ======= */
let PRODUCTS = [];

// ✅ REMOVIDO: TAX_RATE e DISCOUNT
// Todos os cálculos vêm do backend via loadCartFromAPI()
const currency = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 2 });

/* ======= ESTADO DE UI ======= */
let activeCategory = "Todos Produtos";
let searchTerm = "";
let modoEdicao = false;       // mantém do seu fluxo
let estaPesquisando = false;  // mantém do seu fluxo
let searchResults = [];  // Novo: Armazena resultados da busca do servidor

/* ======= CARRINHO ======= */
const cart = new Map();       // id -> {product, qty, customPrice}
let lastCartHash = null;  // Pra otimizar: só atualiza se mudou
let lastExpandedProductId = null; // Rastreia o último produto que ficou expansivo

/* ======= ESTADO: Controlo de edição inline dos cards do carrinho ======= */
let isSwitchingCards = false;        // Impede reload do carrinho durante troca de card expandido
let isPriceEditCancelled = false;    // Flag para cancelamento de edição de preço via ESC
let quantityInputIsSelected = false; // Controla se o texto do input de qtd está seleccionado

/* ======= PAGAMENTO ======= */
let currentCartTotal = 0;  // Total atual do carrinho (usado pelos cards de pagamento)
let selectedPaymentMethod = null;  // Método de pagamento atualmente selecionado
let footerPaymentMethods = [];  // Array de métodos de pagamento carregados
let footerValoresPorMetodo = {};  // Valores por método de pagamento
let footerCashAmount = '0';  // Valor digitado no input do footer

/* ======= SSE ======= */
let sseConnection = null;
let sseReconnectAttempts = 0;
const SSE_MAX_RECONNECT_ATTEMPTS = 5;
const SSE_RECONNECT_DELAY = 3000; // 3 segundos

/* ======= TIPO/FORMATO DE DOCUMENTO ======= */
const tiposDesenvolvidos = ['factura-recibo', 'factura-proforma', 'factura', 'orcamento']; // Tipos já implementados
let tipoDocumentoAtual = 'factura-recibo'; // Tipo padrão
let formatoFaturaAtual = 'A4'; // Formato padrão

/* ======= INVOICE ASSETS ======= */
const invoiceAssetsState = {
  css: {
    a4: false,      // fatura.css
    mm80: false     // fatura80.css
  }
};

/* ======= CLIENTE ======= */
let idClientePadrao = null; // Será preenchido via API

/* ======= CART EDITING ======= */
let lastCategoriesKey = null; /* guarda a key das categorias para evitar rebuild desnecessário */
let finishEditingTimeout = null;
let pendingSync = null; // Armazena dados de sincronização pendente
