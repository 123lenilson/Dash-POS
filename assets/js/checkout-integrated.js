/**
 * checkout-integrated.js
 * 
 * Integrated checkout flow for dashboard interface
 * Replaces legacy modal-based checkout system
 * 
 * @version 1.0.0
 * @date 2026-01-26
 */

/* ============================================
   GLOBAL STATE
   ============================================ */
// ✅ CORREÇÃO: Não redeclara variáveis já existentes em app.js
// As variáveis tipoDocumentoAtual e formatoFaturaAtual já existem globalmente
// Apenas inicializa selectedCustomer (que é exclusiva deste arquivo)
let selectedCustomer = null;

// ✅ NOTA: tipoDocumentoAtual e formatoFaturaAtual são usadas de app.js
// (já declaradas em app.js linha 29)

/* ============================================
   CONSTANTS
   ============================================ */
const DOCUMENT_TYPES = {
  'fatura-recibo': {
    label: 'Fatura-Recibo',
    requiresPayment: true,
    hasFormatOptions: true,
    formats: ['A4', '80mm'],
    endpoint: 'fatura-recibo',
    buttonText: 'Pay'
  },
  'fatura-proforma': {
    label: 'Fatura Proforma',
    requiresPayment: false,
    hasFormatOptions: false,
    formats: ['A4'],
    endpoint: 'factura_proforma_orcamento',
    buttonText: 'Generate Proforma Invoice'
  },
  'fatura': {
    label: 'Fatura',
    requiresPayment: false,
    hasFormatOptions: false,
    formats: ['A4'],
    endpoint: 'fatura',
    buttonText: 'Generate Invoice'
  },
  'orcamento': {
    label: 'Orçamento',
    requiresPayment: false,
    hasFormatOptions: false,
    formats: ['A4'],
    endpoint: 'factura_proforma_orcamento',
    buttonText: 'Generate Quotation'
  }
};

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ============================================
   CUSTOMER FUNCTIONS
   ============================================ */

/**
 * Initialize with default customer (Consumidor Final)
 */
function initDefaultCustomer() {
  selectedCustomer = {
    id: null,
    nome: 'Consumidor Final',
    telefone: 'N/A',
    email: 'consumidor@final.ao',
    endereco: 'N/A',
    nif: null
  };
  updateCustomerDisplay();
  console.log('✅ Default customer initialized');
}

/**
 * Handle customer selection from panel
 * @param {number} clientId - Customer ID
 * @param {string} clientName - Customer name
 * @param {object} clientData - Full customer data
 */
function handleClientSelection(clientId, clientName, clientData) {
  console.log('🧑 Cliente selecionado:', clientName, clientId);
  
  // Store customer data globally
  selectedCustomer = {
    id: clientId,
    nome: clientName,
    telefone: clientData.telefone || 'N/A',
    email: clientData.email || '',
    endereco: clientData.endereco || 'N/A',
    nif: clientData.nif || null
  };
  
  // Update UI elements
  updateCustomerDisplay();
  
  // Close panel
  if (typeof closeClientPanel === 'function') {
    closeClientPanel();
  }
  
  // Show success alert
  if (typeof showAlert === 'function') {
    showAlert('success', 'Cliente Selecionado', `${clientName} foi selecionado`, 2000);
  }
}

/**
 * Update all customer display elements in UI
 */
function updateCustomerDisplay() {
  if (!selectedCustomer) return;
  
  // Update top button display
  const topClientName = document.getElementById('topSelectedClient');
  if (topClientName) {
    topClientName.textContent = selectedCustomer.nome;
  }
  
  // Update selected card in panel
  const selectedCard = document.getElementById('selectedClientCard');
  if (selectedCard) {
    const nameEl = selectedCard.querySelector('.client-card-name');
    const detailsEl = selectedCard.querySelector('.client-card-details');
    
    if (nameEl) {
      nameEl.textContent = selectedCustomer.nome;
    }
    
    if (detailsEl) {
      detailsEl.innerHTML = `
        <span>Telefone: ${selectedCustomer.telefone}</span> | 
        <span>Email: ${selectedCustomer.email || 'N/A'}</span> | 
        <span>NIF: ${selectedCustomer.nif || 'N/A'}</span>
      `;
    }
  }
  
  console.log('✅ Customer display updated');
}

/**
 * Verify or create customer in backend
 * @returns {Promise<object>} Customer data with ID
 */
async function verifyOrCreateCustomer() {
  console.log('🔍 Verifying customer:', selectedCustomer);
  
  // If customer has ID, backend already knows them
  if (selectedCustomer.id) {
    console.log('✅ Customer already has ID:', selectedCustomer.id);
    return { id_cliente: selectedCustomer.id };
  }
  
  // Otherwise, create/verify via API
  const payload = {
    acao: 'verificar_cliente',
    nome: selectedCustomer.nome,
    telefone: selectedCustomer.telefone,
    email: selectedCustomer.email,
    endereco: selectedCustomer.endereco || '',
    nif: selectedCustomer.nif || null
  };
  
  console.log('📤 Sending customer data to backend:', payload);
  
  const response = await fetch('http://localhost/Dash-POS/api/cliente.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.sucesso) {
    throw new Error(data.mensagem || 'Erro ao verificar cliente');
  }
  
  console.log('✅ Customer verified/created with ID:', data.id_cliente);
  
  // Update customer with ID
  selectedCustomer.id = data.id_cliente;
  
  return data;
}

/* ============================================
   DOCUMENT TYPE FUNCTIONS
   ============================================ */

/**
 * Handle document type selection
 * @param {string} tipo - Document type (fatura-recibo, fatura-proforma, etc)
 */
function handleDocumentTypeSelection(tipo) {
  console.log('📋 Document type selected:', tipo);
  
  // Validate type exists
  if (!DOCUMENT_TYPES[tipo]) {
    console.error('❌ Invalid document type:', tipo);
    return;
  }
  
  // ✅ Update global state (usa a variável de app.js)
  window.tipoDocumentoAtual = tipo;
  
  // Sync all UI elements
  syncDocumentTypeUI(tipo);
  
  // Configure payment section
  configurePaymentSection(tipo);
  
  // Update action button
  updateActionButton();
  
  // Handle format selection visibility
  const formatSubOptions = document.getElementById('formatSubOptions');
  if (formatSubOptions) {
    if (DOCUMENT_TYPES[tipo].hasFormatOptions) {
      formatSubOptions.style.display = 'flex';
    } else {
      formatSubOptions.style.display = 'none';
      // Force A4 for non-fatura-recibo types
      formatoFaturaAtual = 'A4';
    }
  }
  
  // Close panel if no format selection needed
  if (!DOCUMENT_TYPES[tipo].hasFormatOptions && typeof closeDocPanel === 'function') {
    setTimeout(() => closeDocPanel(), 300);
  }
  
  console.log('✅ Document type configured:', tipo);
}

/**
 * Synchronize document type UI across all elements
 * @param {string} tipo - Document type
 */
function syncDocumentTypeUI(tipo) {
  // Update all radio buttons (desktop + mobile)
  const allRadios = document.querySelectorAll('input[name="invoiceTypePanel"], input[name="invoiceType"]');
  allRadios.forEach(radio => {
    radio.checked = (radio.value === tipo);
  });
  
  // Update all toggle visual states
  const allToggles = document.querySelectorAll('.invoice-toggle-option');
  allToggles.forEach(toggle => {
    const isActive = toggle.dataset.invoiceType === tipo;
    toggle.classList.toggle('active', isActive);
    
    // Update visual switch inside toggle
    const switchVisual = toggle.querySelector('.toggle-switch-visual');
    if (switchVisual) {
      switchVisual.style.backgroundColor = isActive ? 'var(--accent)' : '#e0e0e0';
    }
  });
  
  // Update display text in cart header
  const docTypeDisplay = document.getElementById('selectedDocType');
  if (docTypeDisplay) {
    docTypeDisplay.textContent = DOCUMENT_TYPES[tipo].label;
  }
  
  console.log('🔄 Document type UI synchronized');
}

/**
 * Handle format selection (A4 or 80mm)
 * @param {string} formato - Format (A4 | 80mm)
 */
function handleFormatSelection(formato) {
  console.log('📐 Format selected:', formato);
  
  // ✅ Update global state (usa a variável de app.js)
  window.formatoFaturaAtual = formato;
  
  // Sync UI
  syncFormatUI(formato);
  
  // Update display text
  const formatDisplay = document.getElementById('selectedDocFormat');
  if (formatDisplay) {
    formatDisplay.textContent = `Formato ${formato}`;
  }
  
  // Close panel after selection
  if (typeof closeDocPanel === 'function') {
    setTimeout(() => closeDocPanel(), 300);
  }
  
  console.log('✅ Format configured:', formato);
}

/**
 * Synchronize format UI across all elements
 * @param {string} formato - Format
 */
function syncFormatUI(formato) {
  // Update all format radios
  const formatRadios = document.querySelectorAll('input[name="invoiceFormatPanel"]');
  formatRadios.forEach(radio => {
    radio.checked = (radio.value === formato);
  });
  
  // Update all format toggle visual states
  const formatToggles = document.querySelectorAll('.format-toggle-option');
  formatToggles.forEach(toggle => {
    const isActive = toggle.dataset.format === formato;
    toggle.classList.toggle('active', isActive);
    
    // Update visual switch inside toggle
    const switchVisual = toggle.querySelector('.format-switch-visual');
    if (switchVisual) {
      switchVisual.style.backgroundColor = isActive ? 'var(--accent)' : '#e0e0e0';
    }
  });
  
  console.log('🔄 Format UI synchronized');
}

/* ============================================
   PAYMENT SECTION CONFIGURATION
   ============================================ */

/**
 * Configure payment section based on document type
 * @param {string} tipo - Document type
 */
function configurePaymentSection(tipo) {
  const docConfig = DOCUMENT_TYPES[tipo];
  const requiresPayment = docConfig.requiresPayment;
  
  console.log(`⚙️ Configuring payment section - Requires Payment: ${requiresPayment}`);
  
  // Get all payment UI elements
  const paymentMethodsSection = document.querySelector('.payment-methods-section');
  const footerAmountRow = document.querySelector('.footer-amount-row');
  const keypadExactBtn = document.querySelector('.keypad-exact-btn');
  const keypadGrid = document.querySelector('.keypad-grid');
  
  if (requiresPayment) {
    // ✅ ENABLE PAYMENT FUNCTIONALITY
    console.log('✅ Enabling payment section');
    
    // Show payment methods
    if (paymentMethodsSection) {
      paymentMethodsSection.style.display = 'block';
      paymentMethodsSection.style.opacity = '1';
      paymentMethodsSection.style.pointerEvents = 'auto';
    }
    
    // Show amount input
    if (footerAmountRow) {
      footerAmountRow.style.display = 'flex';
      footerAmountRow.style.opacity = '1';
      footerAmountRow.style.pointerEvents = 'auto';
    }
    
    // Enable keypad
    if (keypadGrid) {
      keypadGrid.style.opacity = '1';
      keypadGrid.style.pointerEvents = 'auto';
      const keypadButtons = keypadGrid.querySelectorAll('.keypad-btn');
      keypadButtons.forEach(btn => btn.disabled = false);
    }
    
    // Enable exact button
    if (keypadExactBtn) {
      keypadExactBtn.disabled = false;
      keypadExactBtn.style.opacity = '1';
      keypadExactBtn.style.pointerEvents = 'auto';
    }
    
  } else {
    // ❌ DISABLE PAYMENT FUNCTIONALITY
    console.log('❌ Disabling payment section');
    
    // Dim payment methods (keep visible but disabled)
    if (paymentMethodsSection) {
      paymentMethodsSection.style.opacity = '0.4';
      paymentMethodsSection.style.pointerEvents = 'none';
    }
    
    // Dim amount input
    if (footerAmountRow) {
      footerAmountRow.style.opacity = '0.4';
      footerAmountRow.style.pointerEvents = 'none';
    }
    
    // Disable keypad
    if (keypadGrid) {
      keypadGrid.style.opacity = '0.4';
      keypadGrid.style.pointerEvents = 'none';
      const keypadButtons = keypadGrid.querySelectorAll('.keypad-btn');
      keypadButtons.forEach(btn => btn.disabled = true);
    }
    
    // Disable exact button
    if (keypadExactBtn) {
      keypadExactBtn.disabled = true;
      keypadExactBtn.style.opacity = '0.4';
      keypadExactBtn.style.pointerEvents = 'none';
    }
  }
}

/**
 * Update action button text based on document type
 */
function updateActionButton() {
  // ✅ Usa a variável global de app.js
  const docConfig = DOCUMENT_TYPES[window.tipoDocumentoAtual];  // ✅ CORRECT
  const payBtn = document.querySelector('.keypad-pay-btn');
  
  if (payBtn) {
    // Update text based on document type
    payBtn.textContent = docConfig.buttonText;
    
    // Update styling based on payment requirement
    if (docConfig.requiresPayment) {
      // Payment required - green gradient
      payBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      payBtn.style.color = 'white';
      payBtn.style.border = 'none';
    } else {
      // No payment required - blue gradient
      payBtn.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
      payBtn.style.color = 'white';
      payBtn.style.border = 'none';
    }
  }
  
  console.log('🔄 Action button updated:', docConfig.buttonText);
}

/* ============================================
   VALIDATION
   ============================================ */

/**
 * Validate checkout requirements before submission
 * @returns {boolean} - True if valid, false otherwise
 */
function validateCheckout() {
  // ✅ Usa a variável global de app.js
  const docConfig = DOCUMENT_TYPES[window.tipoDocumentoAtual];  // ✅ CORRECT
  let isValid = true;  // ✅ CORRIGIDO: mudado de const para let
  let errorMessage = '';
  
  // Validate customer selection
  if (!selectedCustomer) {
    errorMessage = 'Selecione um cliente primeiro';
    isValid = false;
  }
  
  // Validate payment if required
  if (docConfig.requiresPayment) {
    // Check if payment methods are available
    if (!window.footerPaymentMethods || window.footerPaymentMethods.length === 0) {
      errorMessage = 'Nenhum método de pagamento disponível';
      isValid = false;
    } else {
      // Check if any payment method has been selected and has amount
      let hasValidPayment = false;
      for (const [methodSlug, amount] of Object.entries(window.footerValoresPorMetodo)) {
        if (parseFloat(amount) > 0) {
          hasValidPayment = true;
          break;
        }
      }
      
      if (!hasValidPayment) {
        errorMessage = 'Insira pelo menos um pagamento';
        isValid = false;
      }
    }
  }
  
  // Validate cart is not empty
  if (!window.cart || window.cart.size === 0) {
    errorMessage = 'Carrinho vazio';
    isValid = false;
  }
  
  if (!isValid && typeof showAlert === 'function') {
    showAlert('error', 'Erro de Validação', errorMessage, 3000);
  }
  
  console.log('✅ Validation result:', { isValid, errorMessage });
  return isValid;
}

/* ============================================
   SUBMISSION
   ============================================ */

/**
 * Submit checkout to backend
 * @returns {Promise<object>} Response from backend
 */
async function submitCheckout() {
  console.log('📤 Submitting checkout...');
  
  // Prepare payload based on document type
  const docConfig = DOCUMENT_TYPES[window.tipoDocumentoAtual];  // ✅ CORRECT
  const payload = {};
  
  // Always include customer
  const customerResult = await verifyOrCreateCustomer();
  payload.id_cliente = customerResult.id_cliente;
  
  if (docConfig.requiresPayment) {
    // Payment required - prepare payment data
    const metodosPagamento = [];
    for (const [methodSlug, amount] of Object.entries(window.footerValoresPorMetodo)) {
      if (parseFloat(amount) > 0) {
        // Find the method in footerPaymentMethods to get the ID
        const method = window.footerPaymentMethods.find(m => m.slug === methodSlug);
        if (method) {
          metodosPagamento.push({
            id_metodo: method.id,
            valor: parseFloat(amount)
          });
        }
      }
    }
    
    // Calculate total paid and change
    const totalPaid = metodosPagamento.reduce((sum, method) => sum + method.valor, 0);
    const totalDue = window.currentCartTotal;
    const change = Math.max(0, totalPaid - totalDue);
    
    payload.metodos_pagamento = metodosPagamento;
    payload.troco = change;
    payload.valor_pago = totalPaid;
    payload.observacao = typeof getOrderObservation === 'function' ? getOrderObservation() : '';
    
    // Set action for payment documents
    payload.acao = docConfig.endpoint;
  } else {
    // No payment required - prepare document data
    payload.tipo_documento = window.tipoDocumentoAtual;  // ✅ CORRECT
    payload.observacao = typeof getOrderObservation === 'function' ? getOrderObservation() : '';
    
    // Set action for non-payment documents
    payload.acao = docConfig.endpoint;
  }
  
  console.log('📦 Payload prepared:', payload);
  
  // Send to backend
  const response = await fetch('http://localhost/Dash-POS/api/vender.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('✅ Backend response:', data);
  
  return data;
}

/* ============================================
   INVOICE RENDERING
   ============================================ */

/**
 * Render and print invoice based on type and format
 * @param {object} backendResponse - Response from backend API
 */
async function renderAndPrintInvoice(backendResponse) {
  console.log('🖨️ Rendering invoice...', backendResponse);
  
  // ✅ Usa as variáveis globais de app.js
  const formato = window.formatoFaturaAtual;   // ✅ CORRECT
  const tipoDoc = window.tipoDocumentoAtual;   // ✅ CORRECT
  
  // Prepare invoice data
  const invoiceData = {
    ...backendResponse.dados_fatura,
    cliente: selectedCustomer,
    tipo_documento: tipoDoc,                  // ✅ CORRECT
    observacao: typeof getOrderObservation === 'function' ? getOrderObservation() : '',
    format: formato                           // ✅ CORRECT
  };
  
  console.log('📋 Invoice data prepared:', invoiceData);
  
  if (formato === 'A4') {                     // ✅ CORRECT
    // Render A4 invoice
    console.log('📄 Rendering A4 invoice...');
    
    // Wait for any pending UI updates
    await sleep(500);
    
    // Get A4 container
    const printContainer = document.getElementById('inv-a4-container-principal');
    if (!printContainer) {
      throw new Error('A4 print container not found');
    }
    
    // Clear and render
    printContainer.innerHTML = '';
    
    // Call the existing fatura.js function to render the invoice
    if (typeof window.renderizarFaturaComDadosBackend === 'function') {
      window.renderizarFaturaComDadosBackend(invoiceData, printContainer);
    } else {
      throw new Error('renderizarFaturaComDadosBackend function not found');
    }
    
    // Wait for rendering to complete
    await sleep(1000);
    
    // Print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fatura</title>
        <link rel="stylesheet" href="../assets/css/fatura.css">
        <style>
          body { margin: 0; padding: 20px; }
        </style>
      </head>
      <body>
        ${printContainer.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    
  } else if (formato === '80mm') {            // ✅ CORRECT
    // Render 80mm invoice
    console.log('🧾 Rendering 80mm invoice...');
    
    // Wait for any pending UI updates
    await sleep(500);
    
    // Get 80mm container
    const printContainer = document.getElementById('fatura80-container-inv80');
    if (!printContainer) {
      throw new Error('80mm print container not found');
    }
    
    // Clear and render
    printContainer.innerHTML = '';
    
    // Call the existing fatura80.js function to render the invoice
    if (typeof window.renderizarFatura80ComDadosBackend === 'function') {
      window.renderizarFatura80ComDadosBackend(invoiceData, printContainer);
    } else {
      throw new Error('renderizarFatura80ComDadosBackend function not found');
    }
    
    // Wait for rendering to complete
    await sleep(1000);
    
    // Print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fatura 80mm</title>
        <link rel="stylesheet" href="../assets/css/fatura80.css">
        <style>
          body { margin: 0; padding: 10px; }
          @media print {
            body { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        ${printContainer.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
}

/* ============================================
   CLEANUP
   ============================================ */

/**
 * Reset all checkout state after successful submission
 */
function resetCheckoutState() {
  console.log('🔄 Resetting checkout state...');
  
  // Reset customer
  initDefaultCustomer();
  
  // Reset document type to default
  handleDocumentTypeSelection('fatura-recibo');
  window.formatoFaturaAtual = 'A4';  // ✅ CORRECT
  
  // Reset payment values if payment functions exist
  if (typeof window.resetFooterPaymentValues === 'function') {
    window.resetFooterPaymentValues();
  }
  
  // Clear cart if function exists
  if (typeof window.loadCartFromAPI === 'function') {
    setTimeout(() => {
      window.loadCartFromAPI(); // Reload cart to clear it
    }, 300);
  }
}

/* ============================================
   MAIN ACTION HANDLER
   ============================================ */

/**
 * Main handler for the action button click
 * Coordinates the entire checkout flow
 */
async function handleActionClick() {
  console.log('🚀 Action button clicked! Starting checkout flow...');
  const payBtn = document.querySelector('.keypad-pay-btn');
  
  // Get document config
  const docConfig = DOCUMENT_TYPES[window.tipoDocumentoAtual];  // ✅ CORRECT
  
  try {
    // Disable button to prevent double-clicks
    if (payBtn) {
      payBtn.disabled = true;
      payBtn.textContent = 'PROCESSANDO...';
      payBtn.style.background = 'linear-gradient(135deg, #94a3b8, #64748b)';
    }
    
    // Validate
    if (!validateCheckout()) {
      console.log('❌ Validation failed, aborting checkout');
      return;
    }
    
    // Submit to backend
    console.log('📤 Submitting to backend...');
    const backendResponse = await submitCheckout();
    
    if (!backendResponse.sucesso) {
      throw new Error(backendResponse.mensagem || 'Erro ao processar checkout');
    }
    
    // Render and print invoice
    console.log('🖨️ Printing invoice...');
    await renderAndPrintInvoice(backendResponse);
    
    // Show success message
    if (typeof showAlert === 'function') {
      showAlert('success', 'Sucesso!', `Documento ${docConfig.label} gerado com sucesso`, 3000);
    }
    
    // Reset state
    resetCheckoutState();
    
    console.log('✅ Checkout completed successfully!');
    
  } catch (error) {
    console.error('❌ Checkout error:', error);
    
    // Show error message
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', error.message || 'Erro ao processar checkout', 5000);
    }
  } finally {
    // Re-enable button
    if (payBtn) {
      payBtn.disabled = false;
      payBtn.textContent = docConfig.buttonText;
      if (docConfig.requiresPayment) {
        payBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      } else {
        payBtn.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
      }
    }
  }
}

/* ============================================
   INITIALIZATION
   ============================================ */

/**
 * Initialize the integrated checkout system
 */
function initIntegratedCheckout() {
  console.log('🚀 Initializing integrated checkout system...');
  
  // Initialize default customer
  initDefaultCustomer();
  
  // Attach event listener to the action button
  const payBtn = document.querySelector('.keypad-pay-btn');
  if (payBtn) {
    // Remove any existing listeners to avoid duplicates
    payBtn.replaceWith(payBtn.cloneNode(true)); // This removes all event listeners
    const newPayBtn = document.querySelector('.keypad-pay-btn');
    newPayBtn.addEventListener('click', handleActionClick);
  } else {
    console.warn('⚠️ Pay button not found - action button will not work');
  }
  
  // Initialize with default document type
  handleDocumentTypeSelection('fatura-recibo');
  window.formatoFaturaAtual = 'A4';  // ✅ CORRECT
  
  console.log('✅ Integrated checkout system initialized!');
}

// Export functions to global scope for integration
window.handleClientSelection = handleClientSelection;
window.handleDocumentTypeSelection = handleDocumentTypeSelection;
window.handleFormatSelection = handleFormatSelection;
window.initIntegratedCheckout = initIntegratedCheckout;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIntegratedCheckout);
} else {
  initIntegratedCheckout();
}