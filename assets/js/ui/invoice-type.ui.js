/* ================================================
   MÓDULO: Invoice Type UI
   Ficheiro: assets/js/ui/invoice-type.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= CONTROLE DE TIPO DE DOCUMENTO ======= */
/**
 * Função para selecionar tipo de documento
 * Valida se o tipo já foi desenvolvido
 */
/* ======= CONTROLE DE TIPO DE DOCUMENTO - VERSÃO CORRIGIDA ======= */

/**
 * Retorna o tipo de documento atualmente selecionado
 */
function getTipoDocumentoAtual() {
  return tipoDocumentoAtual;
}

/**
 * Seleciona o formato de fatura (A4 ou 80mm)
 * Sincroniza todos os radio buttons e atualiza a interface
 */
function selecionarFormatoFatura(formato) {
  console.log(`📐 [FORMATO] Selecionando formato: ${formato}`);
  
  // ✅ 1. Valida formato
  if (formato !== 'A4' && formato !== '80mm') {
    console.warn(`⚠️ [FORMATO] Formato inválido: ${formato}. Usando A4.`);
    formato = 'A4';
  }
  
  // ✅ 2. Atualiza variável global
  formatoFaturaAtual = formato;
  
  // ✅ 3. Salva em localStorage
  localStorage.setItem('invoiceFormat', formato);
  
  // ✅ 4. Sincroniza TODOS os radio buttons
  const allRadios = document.querySelectorAll('input[name="invoiceFormat"]');
  allRadios.forEach(radio => {
    radio.checked = (radio.value === formato);
    
    // Atualiza classe visual do toggle pai
    const toggleParent = radio.closest('.format-toggle-option');
    if (toggleParent) {
      if (radio.value === formato) {
        toggleParent.classList.add('active');
      } else {
        toggleParent.classList.remove('active');
      }
    }
  });
  
  // ✅ 5. Atualiza display no cabeçalho do carrinho
  updateInvoiceFormatDisplay(formato);

  if (typeof updateStickyDocTypeLabel === 'function') updateStickyDocTypeLabel();

  // Factura-Recibo (A4 ou 80mm): garantir que a aba Desc. e os blocos do rodapé ficam sem cadeado
  if (typeof window.updateOrderSummaryDescTabState === 'function') window.updateOrderSummaryDescTabState();
  var currentType = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
  if (typeof updateCartFooterLockIcons === 'function') updateCartFooterLockIcons(currentType);

  console.log(`✅ [FORMATO] Formato selecionado: ${formato}`);
}

/**
 * Retorna o formato de fatura atualmente selecionado
 */
function getInvoiceFormat() {
  return formatoFaturaAtual;
}

/**
 * Inicializa o formato de fatura (chamado no carregamento)
 */
function initInvoiceFormat() {
  // Tenta carregar do localStorage
  const savedFormat = localStorage.getItem('invoiceFormat');
  const initialFormat = savedFormat || 'A4';
  
  console.log(`🔧 [FORMATO] Inicializando com formato: ${initialFormat}`);
  
  // Aplica seleção inicial
  selecionarFormatoFatura(initialFormat);
}
// Função para mostrar o seletor de formato de fatura (painel único - formatSubOptions)
function showInvoiceFormatSelector() {
  const formatSubOptions = document.getElementById('formatSubOptions');
  if (formatSubOptions) {
    formatSubOptions.style.display = 'flex';
  }
  const formatRadios = document.querySelectorAll('input[name="invoiceFormat"]');
  let hasSelection = false;
  formatRadios.forEach(radio => {
    if (radio.checked) hasSelection = true;
  });
  if (!hasSelection && formatRadios.length > 0) {
    formatRadios[0].checked = true;
  }
}

// Função para esconder o seletor de formato de fatura (painel único - formatSubOptions)
function hideInvoiceFormatSelector() {
  const formatSubOptions = document.getElementById('formatSubOptions');
  if (formatSubOptions) {
    formatSubOptions.style.display = 'none';
  }
}

// Função para selecionar formato de fatura
function selectInvoiceFormat(format) {
  // Find and check the corresponding radio button
  const formatRadios = document.querySelectorAll(`input[name="invoiceFormat"][value="${format}"]`);
  formatRadios.forEach(radio => {
    radio.checked = true;
  });
}

// Função para confirmar formato de fatura
function confirmInvoiceFormat() {
  // Get the selected format from radio buttons
  const selectedRadio = document.querySelector('input[name="invoiceFormat"]:checked');
  if (!selectedRadio) {
    showAlert('warning', 'Formato não selecionado', 'Por favor, selecione um formato de fatura.');
    return;
  }

  const selectedFormat = selectedRadio.value;

  // Store the selected format in localStorage
  localStorage.setItem('invoiceFormat', selectedFormat);

  // Hide the selector
  hideInvoiceFormatSelector();

  // Show confirmation
  showAlert('success', 'Formato selecionado', `Formato de fatura definido como ${selectedFormat}`);
}



// Initialize invoice format selector event listeners
document.addEventListener('DOMContentLoaded', function () {
  // Add event listeners for format selection
  const formatRadios = document.querySelectorAll('input[name="invoiceFormat"]');

  formatRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      // ✅ NOVO: Usa a função centralizada
      selecionarFormatoFatura(this.value);
    });
  });

  // ✅ NOVO: Inicialização já é feita na função init()
  // O código de inicialização foi movido para initInvoiceFormat()
});
// ===== INTEGRAÇÃO COM CHECKOUT INTEGRADO =====
// ============================================
// PAINEL CLIENTE SLIDER
// ============================================

/**
 * Abre/fecha o painel cliente slider (TOGGLE)
 */
function openPanel(panelId) {
  if (panelId === 'clientePanel') {
    const panel = document.getElementById('clientePanelSlider');
    const wrapper = document.querySelector('.products-container-wrapper');
    const clientBtn = document.querySelector('.toggle-select-painel.cliente-btn');

    if (panel && wrapper) {
      // Verifica se o painel já está aberto
      const isOpen = panel.classList.contains('active');

      if (isOpen) {
        // Se está aberto, fecha
        panel.classList.remove('active');
        wrapper.classList.remove('panel-open');
        if (clientBtn) clientBtn.classList.remove('panel-active');
        console.log('✅ Painel cliente fechado (toggle)');
      } else {
        // Se está fechado, abre
        panel.classList.add('active');
        wrapper.classList.add('panel-open');
        if (clientBtn) clientBtn.classList.add('panel-active');
        console.log('✅ Painel cliente aberto (toggle)');
      }
    }
  }

  // Painel de Tipo de Documento (no carrinho)
  if (panelId === 'documentoPanel') {
    const panel = document.getElementById('docTypePanelSlider');
    const wrapper = document.getElementById('cartBodyWrapper');
    const docBtn = document.querySelector('.cart-header .toggle-select-painel');

    if (panel && wrapper) {
      // Verifica se o painel já está aberto
      const isOpen = panel.classList.contains('active');

      if (isOpen) {
        // Se está aberto, fecha
        panel.classList.remove('active');
        wrapper.classList.remove('doc-panel-open');
        if (docBtn) docBtn.classList.remove('panel-active');
        console.log('✅ Painel documento fechado (toggle)');
      } else {
        // Se está fechado, abre
        panel.classList.add('active');
        wrapper.classList.add('doc-panel-open');
        if (docBtn) docBtn.classList.add('panel-active');
        console.log('✅ Painel documento aberto (toggle)');
      }
    }
  }
}

/**
 * Fecha o painel cliente slider
 */
function closeClientPanel() {
  const panel = document.getElementById('clientePanelSlider');
  const wrapper = document.querySelector('.products-container-wrapper');
  const clientBtn = document.querySelector('.toggle-select-painel.cliente-btn');

  if (panel && wrapper) {
    panel.classList.remove('active');
    wrapper.classList.remove('panel-open');
    if (clientBtn) clientBtn.classList.remove('panel-active');
    console.log('✅ Painel cliente fechado');
  }
  if (typeof closeBottomSheet === 'function') closeBottomSheet();
}

/**
 * Fecha o painel de tipo de documento slider
 */
function closeDocPanel() {
  const panel = document.getElementById('docTypePanelSlider');
  const wrapper = document.getElementById('cartBodyWrapper');
  const docBtn = document.querySelector('.cart-header .toggle-select-painel');

  if (panel && wrapper) {
    panel.classList.remove('active');
    wrapper.classList.remove('doc-panel-open');
    if (docBtn) docBtn.classList.remove('panel-active');
    console.log('✅ Painel documento fechado');
  }
  if (typeof closeBottomSheet === 'function') closeBottomSheet();
}

/**
 * Inicializa os event listeners para os toggles de tipo de fatura
 */
function initInvoiceTypePanelToggles() {
  console.log('🔧 [TOGGLES] Inicializando toggles...');
  
  // Toggles de tipo
  const invoiceToggles = document.querySelectorAll('.invoice-toggle-option');
  console.log('📊 [TOGGLES] Tipos encontrados:', invoiceToggles.length);
  
  invoiceToggles.forEach(toggle => {
    toggle.addEventListener('click', function () {
      invoiceToggles.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      const radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const invoiceType = this.dataset.invoiceType;
      tipoDocumentoAtual = invoiceType;
      updateInvoiceTypeDisplay(invoiceType);
      if (typeof window.updateOrderSummaryDescTabState === 'function') window.updateOrderSummaryDescTabState();
      console.log('📄 [TOGGLES] Tipo selecionado:', invoiceType);

      const formatSubOptions = document.getElementById('formatSubOptions');
      if (formatSubOptions) {
        if (invoiceType === 'factura-recibo') {
          formatSubOptions.style.display = 'flex';
          console.log('✅ [TOGGLES] Sub-toggle exibido');
        } else {
          formatSubOptions.style.display = 'none';
          console.log('❌ [TOGGLES] Sub-toggle ocultado');
        }
      }

      if (invoiceType !== 'factura-recibo') {
        closeDocPanel();
      }
    });
  });

  // ✅ CRÍTICO: Toggles de formato
  const formatToggles = document.querySelectorAll('.format-toggle-option');
  console.log('📊 [TOGGLES] Formatos encontrados:', formatToggles.length);
  
  formatToggles.forEach((toggle, index) => {
    toggle.addEventListener('click', function () {
      console.log(`🎯 [TOGGLES] Toggle ${index} clicado:`, this.dataset.format);
      
      formatToggles.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      const radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const format = this.dataset.format;
      console.log('📐 [TOGGLES] Chamando selecionarFormatoFatura():', format);
      
      // ✅ CHAMADA CRÍTICA
      selecionarFormatoFatura(format);
      
      // Verifica se atualizou
      setTimeout(() => {
        console.log('🔍 [TOGGLES] Verificação:', {
          formatoFaturaAtual: formatoFaturaAtual,
          localStorage: localStorage.getItem('invoiceFormat'),
          radioMarcado: document.querySelector('input[name="invoiceFormat"]:checked')?.value
        });
      }, 100);

      closeDocPanel();
    });
  });
  
  console.log('✅ [TOGGLES] Inicialização concluída');
}

/**
 * Atualiza o texto do botão Tipo Factura no sticky bottom menu (telas ≤905px).
 * Se for Factura-Recibo, acrescenta o formato (A4 ou 80mm).
 */
function updateStickyDocTypeLabel() {
  const el = document.getElementById('stickyDocTypeLabel');
  if (!el) return;
  const typeNames = {
    'factura-recibo': 'Factura-Recibo',
    'factura-proforma': 'Factura Proforma',
    'factura': 'Factura',
    'orcamento': 'Orçamento'
  };
  const tipo = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
  let text = typeNames[tipo] || tipo || 'Tipo Factura';
  if (tipo === 'factura-recibo') {
    const formato = (typeof formatoFaturaAtual !== 'undefined' && formatoFaturaAtual)
      ? formatoFaturaAtual
      : (document.querySelector('input[name="invoiceFormat"]:checked')?.value || localStorage.getItem('invoiceFormat') || 'A4');
    text = text + ' (' + (formato === '80mm' ? '80mm' : 'A4') + ')';
  }
  el.textContent = text;
}

/**
 * Atualiza o display do formato de fatura (A4 ou 80mm) no botão do cabeçalho do carrinho
 * Chamada por selecionarFormatoFatura() sempre que o formato muda
 */
function updateInvoiceFormatDisplay(formato) {
  const formatDisplay = document.getElementById('selectedDocFormat');
  if (formatDisplay) {
    formatDisplay.textContent = formato === '80mm' ? 'Formato 80mm' : 'Formato A4';
  }
  updateStickyDocTypeLabel();
}

/**
 * Atualiza o display do tipo de fatura no botão do cabeçalho
 */
function updateInvoiceTypeDisplay(invoiceType) {
  const typeNames = {
    'factura-recibo': 'Factura-Recibo',
    'factura-proforma': 'Factura Proforma',
    'factura': 'Factura',
    'orcamento': 'Orçamento'
  };
  const displayElement = document.getElementById('selectedDocType');
  if (displayElement) {
    displayElement.textContent = typeNames[invoiceType] || invoiceType;
  }

  updateStickyDocTypeLabel();

  // Sempre mostra o formato e a seta
  const formatDisplay = document.getElementById('selectedDocFormat');
  const arrowDisplay = document.querySelector('.doc-arrow');

  if (formatDisplay) formatDisplay.style.display = 'inline';
  if (arrowDisplay) arrowDisplay.style.display = 'inline';

  // Para tipos diferentes de factura-recibo, sempre mostra A4 como padrão
  if (invoiceType !== 'factura-recibo') {
    if (formatDisplay) formatDisplay.textContent = 'Formato A4';
  }

  // Factura Proforma, Fatura e Orçamento: bloquear métodos de pagamento e teclado; alterar texto do botão
  const cartFooter = document.querySelector('.cart-footer');
  const payBtns = document.querySelectorAll('.keypad-pay-btn');
  const setPayBtnText = function (text) { payBtns.forEach(function (btn) { btn.textContent = text; }); };
  if (invoiceType === 'factura-proforma') {
    if (cartFooter) cartFooter.classList.add('document-type-proforma');
    setPayBtnText('Gerar Factura Proforma');
  } else if (invoiceType === 'factura') {
    if (cartFooter) cartFooter.classList.add('document-type-proforma');
    setPayBtnText('Gerar Fatura');
  } else if (invoiceType === 'orcamento') {
    if (cartFooter) cartFooter.classList.add('document-type-proforma');
    setPayBtnText('Gerar Orçamento');
  } else {
    if (cartFooter) cartFooter.classList.remove('document-type-proforma');
    setPayBtnText('Pagar');
  }

  // Cadeados no rodapé: mostrar só quando bloqueado (proforma/fatura/orçamento); sumir com Factura-Recibo
  if (typeof updateCartFooterLockIcons === 'function') updateCartFooterLockIcons(invoiceType);
}

/**
 * Adiciona ou remove o ícone de cadeado DENTRO de cada elemento bloqueado do rodapé,
 * com estilo igual ao do elemento (mesmo font-size e tom de cor).
 * @param {string} invoiceType - Tipo de documento atual (factura-recibo, factura-proforma, fatura, orcamento)
 */
function updateCartFooterLockIcons(invoiceType) {
  const blockFooter = invoiceType === 'factura-proforma' || invoiceType === 'factura' || invoiceType === 'orcamento';
  const footer = document.querySelector('.cart-footer');
  if (!footer) return;

  function addLock(parent, lockClass) {
    if (!parent.querySelector('.' + lockClass)) {
      const wrap = document.createElement('span');
      wrap.className = lockClass;
      wrap.setAttribute('aria-hidden', 'true');
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-lock';
      wrap.appendChild(icon);
      parent.appendChild(wrap);
    }
  }
  function removeLocks(selector) {
    footer.querySelectorAll(selector).forEach(function (el) { el.remove(); });
  }

  if (blockFooter) {
    // 1) Cada card: substituir conteúdo pelo cadeado
    footer.querySelectorAll('#paymentMethodsTrack .pm-card').forEach(function (card) {
      addLock(card, 'pm-card-lock');
      card.classList.add('locked');
    });
    // 2) Input: substituir valor pelo cadeado
    const amountWrapper = footer.querySelector('.footer-amount-wrapper');
    if (amountWrapper) {
      addLock(amountWrapper, 'footer-input-lock');
      amountWrapper.classList.add('locked');
    }
    // 3) Cada botão numérico: substituir número pelo cadeado
    footer.querySelectorAll('.keypad-grid .keypad-btn').forEach(function (btn) {
      addLock(btn, 'keypad-btn-lock');
      btn.classList.add('locked');
    });
    // 4) Botão Exato: substituir palavra "Exato" pelo cadeado
    const exactBtn = footer.querySelector('.keypad-exact-btn');
    if (exactBtn) {
      addLock(exactBtn, 'keypad-exact-lock');
      exactBtn.classList.add('locked');
    }
  } else {
    removeLocks('.pm-card-lock');
    removeLocks('.footer-input-lock');
    removeLocks('.keypad-btn-lock');
    removeLocks('.keypad-exact-lock');
    footer.querySelectorAll('.pm-card, .footer-amount-wrapper, .keypad-grid .keypad-btn, .keypad-exact-btn').forEach(function (el) {
      el.classList.remove('locked');
    });
  }
}
// Inicializa os toggles quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
  initInvoiceTypePanelToggles();

  // [TESTE] Clique na área do usuário logado → alert com width da tela (útil ao redimensionar)
  const loggedUserArea = document.getElementById('loggedUserArea');
  if (loggedUserArea) {
    loggedUserArea.addEventListener('click', function () {
      var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      alert('Width da tela: ' + w + ' px');
    });
  }

  // Inicializa visibilidade do sub-toggle de formato
  const formatSubOptions = document.getElementById('formatSubOptions');
  if (formatSubOptions) {
    // Mostra sub-toggle apenas se factura-recibo estiver selecionado
    const isFaturaRecibo = tipoDocumentoAtual === 'factura-recibo';
    formatSubOptions.style.display = isFaturaRecibo ? 'flex' : 'none';
  }

});
/**
 * Função genérica para fechar painel (compatibilidade)
 */
function closePanel(panelId) {
  if (panelId === 'clientePanel') {
    closeClientPanel();
  }
  if (panelId === 'documentoPanel') {
    closeDocPanel();
  }
}

/**
 * Seleciona um cliente no painel
 */
function selectClient(clientId, clientName) {
  console.log('🧑 Cliente selecionado:', clientName, clientId);

  // Remove active de todos os itens
  const items = document.querySelectorAll('.client-item');
  items.forEach(item => item.classList.remove('active'));

  // Adiciona active no item clicado
  event.currentTarget.classList.add('active');

  // Atualiza o nome no botão cliente (topo e sticky bottom menu)
  const topClientName = document.getElementById('topSelectedClient');
  if (topClientName) {
    topClientName.textContent = clientName;
  }
  const stickyClientLabel = document.getElementById('stickyClientLabel');
  if (stickyClientLabel) {
    stickyClientLabel.textContent = clientName;
  }

  // Atualiza no checkout também (se existir)
  const selectedClientName = document.getElementById('selectedClientName');
  if (selectedClientName) {
    selectedClientName.textContent = clientName;
  }

  // Fecha o painel após seleção
  setTimeout(() => {
    closeClientPanel();
  }, 300);

  // Mostra alerta de sucesso
  showAlert('success', 'Cliente Selecionado', `${clientName} foi selecionado`, 2000);
}

/**
 * Abre formulário para novo cliente (placeholder)
 */
function openNewClientFormPanel() {
  console.log('➕ Abrir formulário de novo cliente');
  showAlert('info', 'Em Desenvolvimento', 'Funcionalidade de cadastro será implementada', 2500);
}

/**
 * ⚠️ CÓDIGO ANTIGO DO PAINEL DE CLIENTES FOI REMOVIDO
 * Foi substituído pelo arquivo clientes.js que conecta com a API do backend
 * O código antigo usava dados mockados e foi removido para evitar conflitos
 */


