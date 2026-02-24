/* ================================================
   MÓDULO: Checkout Module
   Ficheiro: assets/js/modules/checkout.module.js
   Parte do sistema Dash-POS
   ================================================ */

/**
 * Obtém o ID do cliente para envio ao backend (selecionado ou Consumidor Final).
 * Usado por Fatura-Recibo e Fatura Proforma.
 * @returns {number}
 * @throws {Error}
 */
function getIdClienteForDocument() {
  const clientManager = window.getClientManager ? window.getClientManager() : null;
  const selectedClient = clientManager ? clientManager.getSelectedClient() : null;
  if (selectedClient && selectedClient.idcliente) {
    return parseInt(selectedClient.idcliente);
  }
  if (!idClientePadrao) {
    throw new Error('Cliente padrão não foi carregado. Recarregue a página.');
  }
  const id = parseInt(idClientePadrao);
  if (!id || isNaN(id)) throw new Error('ID de cliente inválido.');
  return id;
}

/**
 * Coleta todos os dados de pagamento para envio ao backend
 * @returns {Object} Dados formatados para o backend
 * @throws {Error} Se validação falhar
 */
function collectPaymentData() {
  console.log('📊 Coletando dados de pagamento...');
  
  // 1. OBTER CLIENTE SELECIONADO (SE EXISTIR)
  const clientManager = window.getClientManager ? window.getClientManager() : null;
  const selectedClient = clientManager ? clientManager.getSelectedClient() : null;
  
  // ✅ NOVO: Cliente é OBRIGATÓRIO - usa selecionado OU "Consumidor Final"
  let idCliente;
  
  if (selectedClient && selectedClient.idcliente) {
    // Usuário selecionou um cliente específico
    idCliente = parseInt(selectedClient.idcliente);
    console.log('✅ Cliente selecionado:', selectedClient.nome, '(ID:', idCliente, ')');
    
  } else {
    // Nenhum cliente selecionado - usa Consumidor Final
    if (!idClientePadrao) {
      throw new Error(
        'ERRO CRÍTICO: Cliente padrão não foi carregado. ' +
        'Recarregue a página e tente novamente.'
      );
    }
    
    idCliente = idClientePadrao;
    console.log('✅ Usando cliente padrão (Consumidor Final) - ID:', idCliente);
  }
  
  // Validação final: NUNCA pode ser null/undefined
  if (!idCliente || isNaN(idCliente)) {
    throw new Error(
      'ERRO: ID de cliente inválido. ' +
      'Por favor, recarregue a página.'
    );
  }
  
  // 2. VALIDAR CARRINHO
  if (!cart || cart.size === 0) {
    throw new Error('Carrinho vazio. Adicione produtos ao carrinho.');
  }
  
  console.log('✅ Carrinho possui', cart.size, 'produtos');
  
  // 3. COLETAR MÉTODOS DE PAGAMENTO COM VALORES > 0
  const metodosPagamento = [];
  let totalPago = 0;
  
  if (!footerPaymentMethods || footerPaymentMethods.length === 0) {
    throw new Error('Métodos de pagamento não carregados');
  }
  
  footerPaymentMethods.forEach(metodo => {
    const valor = parseFloat(footerValoresPorMetodo[metodo.slug]) || 0;
    if (valor > 0) {
      metodosPagamento.push({
        id_metodo: metodo.id,
        valor: valor
      });
      totalPago += valor;
      console.log(`💳 ${metodo.nome}: ${valor.toFixed(2)} Kz`);
    }
  });
  
  // 4. VALIDAR PELO MENOS UM MÉTODO DE PAGAMENTO
  if (metodosPagamento.length === 0) {
    throw new Error('Nenhum valor de pagamento informado. Insira o valor recebido.');
  }
  
  console.log('✅ Total pago:', totalPago.toFixed(2), 'Kz');
  
  // 5. CALCULAR TROCO
  const valorAPagar = currentCartTotal || 0;
  const troco = Math.max(0, totalPago - valorAPagar);
  
  if (troco > 0) {
    console.log('💵 Troco:', troco.toFixed(2), 'Kz');
  }
  
  // 6. COLETAR OBSERVAÇÃO (SE EXISTIR) - ✅ GARANTIR QUE SEMPRE SEJA STRING
  let observacao = '';
  
  try {
    if (typeof getOrderObservation === 'function') {
      const obs = getOrderObservation();
      // Garantir que seja string e remover espaços extras
      observacao = (obs && typeof obs === 'string') ? obs.trim() : '';
    }
  } catch (error) {
    console.warn('⚠️ Erro ao obter observação:', error);
    observacao = '';
  }
  
  if (observacao) {
    console.log('📝 Observação:', observacao);
  } else {
    console.log('📝 Observação: (vazia)');
  }
  
  // 7. MONTAR PAYLOAD PARA O BACKEND
  const payload = {
    acao: 'factura-recibo',
    metodos_pagamento: metodosPagamento,
    observacao: observacao,
    troco: troco,
    valor_pago: totalPago
  };
  
  // ✅ SEMPRE envia id_cliente (selecionado OU padrão)
  payload.id_cliente = idCliente;
  
  console.log('✅ Payload montado:', payload);
  
  return payload;
}

/**
 * Animação de loading para o botão Pagar
 * Cicla entre ".", "..", "..." continuamente
 */
let payButtonAnimationInterval = null;

function startPayButtonAnimation() {
  const payButtons = document.querySelectorAll('.keypad-pay-btn');
  if (!payButtons.length) return;
  
  payButtons.forEach(function (btn) { btn.classList.add('loading'); });
  let dotCount = 0;
  if (payButtonAnimationInterval) clearInterval(payButtonAnimationInterval);
  payButtonAnimationInterval = setInterval(function () {
    dotCount = (dotCount % 3) + 1;
    const bulletChar = '•';
    const dots = Array(dotCount).fill(bulletChar).join(' ');
    payButtons.forEach(function (btn) { btn.textContent = dots; });
  }, 400);
  console.log('⏳ Animação do botão Pagar iniciada');
}

function stopPayButtonAnimation() {
  if (payButtonAnimationInterval) {
    clearInterval(payButtonAnimationInterval);
    payButtonAnimationInterval = null;
  }
  
  document.querySelectorAll('.keypad-pay-btn').forEach(function (btn) {
    btn.classList.remove('loading');
    btn.textContent = '• • •';
  });
  console.log('⏸️ Animação do botão Pagar parada');
}

function resetPayButtonText() {
  if (payButtonAnimationInterval) {
    clearInterval(payButtonAnimationInterval);
    payButtonAnimationInterval = null;
  }
  
  document.querySelectorAll('.keypad-pay-btn').forEach(function (btn) {
    btn.classList.remove('loading');
    btn.textContent = 'Pagar';
  });
  console.log('🔄 Texto do botão Pagar restaurado');
}

async function processProformaInvoice() {
  console.log('🚀 [PROFORMA] Iniciando Factura Proforma...');

  if (!cart || cart.size === 0 || currentCartTotal <= 0) {
    if (typeof showAlert === 'function') {
      showAlert('warning', 'Carrinho Vazio', 'Adicione produtos ao carrinho antes de gerar a Factura Proforma.', 4000);
    } else {
      alert('Adicione produtos ao carrinho.');
    }
    return;
  }

  let idCliente;
  try {
    idCliente = getIdClienteForDocument();
  } catch (e) {
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', e.message || 'Cliente inválido.');
    } else {
      alert(e.message);
    }
    return;
  }

  try {
    startPayButtonAnimation();
    if (typeof showAlert === 'function') {
      showAlert('info', 'Processando', 'A gerar Factura Proforma...', 0);
    }

    let observacao = '';
    try {
      if (typeof getOrderObservation === 'function') {
        const obs = getOrderObservation();
        observacao = (obs && typeof obs === 'string') ? obs.trim() : '';
      }
    } catch (e) {
      observacao = '';
    }

    const response = await fetch('http://localhost/Dash-POS/api/vender.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'factura-proforma',
        id_cliente: idCliente,
        tipo_documento: 'Factura-Proforma',
        observacao: observacao
      })
    });

    const rawText = await response.text();
    if (rawText.trim().startsWith('<')) {
      throw new Error('Erro no servidor. Verifique os logs do PHP.');
    }
    const data = JSON.parse(rawText);

    if (!response.ok || !data.sucesso) {
      throw new Error(data.erro || data.mensagem || 'Erro ao processar Factura Proforma');
    }

    if (typeof closeAlert === 'function') closeAlert();
    if (typeof showAlert === 'function') {
      showAlert('info', 'A gerar documento', 'A preparar impressão A4...', 0);
    }

    await loadInvoiceAssets('A4');
    applyInvoicePrintStyles('A4');

    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('factura80-container-inv80');
    if (!containerA4 || !container80) throw new Error('Containers de fatura não encontrados.');

    container80.innerHTML = '';
    container80.style.display = 'none';
    containerA4.style.display = 'block';
    containerA4.style.position = 'fixed';
    containerA4.style.top = '-9999px';
    containerA4.style.left = '-9999px';
    containerA4.style.zIndex = '-1';
    containerA4.innerHTML = '';

    if (typeof window.renderizarFaturaComDadosBackend !== 'function') {
      throw new Error('Função renderizarFaturaComDadosBackend não encontrada');
    }
    window.renderizarFaturaComDadosBackend(data);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!containerA4.innerHTML.trim()) throw new Error('Falha na renderização da Factura Proforma');

    window.print();
    resetPayButtonText();
    if (typeof updateInvoiceTypeDisplay === 'function') {
      updateInvoiceTypeDisplay(getTipoDocumentoAtual());
    }
    await new Promise(resolve => setTimeout(resolve, 150));
    await clearCartAfterSale();

    if (typeof closeAlert === 'function') closeAlert();
    if (typeof showAlert === 'function') {
      showAlert('success', 'Factura Proforma gerada', `Documento ${data.codigo_documento} gerado com sucesso.`, 4000);
    }
  } catch (error) {
    console.error('❌ [PROFORMA]', error);
    if (typeof closeAlert === 'function') closeAlert();
    resetPayButtonText();
    if (typeof updateInvoiceTypeDisplay === 'function') {
      updateInvoiceTypeDisplay(getTipoDocumentoAtual());
    }
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', error.message || 'Erro ao gerar Factura Proforma.', 5000);
    } else {
      alert(error.message || 'Erro ao gerar Factura Proforma.');
    }
  }
}

/**
 * Processa e imprime Orçamento (mesmo comportamento da Factura Proforma: sem pagamento, A4).
 * Envia id_cliente e observacao ao backend, renderiza A4 e abre a janela de impressão.
 */
async function processOrcamentoInvoice() {
  console.log('🚀 [ORÇAMENTO] Iniciando Orçamento...');

  if (!cart || cart.size === 0 || currentCartTotal <= 0) {
    if (typeof showAlert === 'function') {
      showAlert('warning', 'Carrinho Vazio', 'Adicione produtos ao carrinho antes de gerar o Orçamento.', 4000);
    } else {
      alert('Adicione produtos ao carrinho.');
    }
    return;
  }

  let idCliente;
  try {
    idCliente = getIdClienteForDocument();
  } catch (e) {
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', e.message || 'Cliente inválido.');
    } else {
      alert(e.message);
    }
    return;
  }

  try {
    startPayButtonAnimation();
    if (typeof showAlert === 'function') {
      showAlert('info', 'Processando', 'A gerar Orçamento...', 0);
    }

    let observacao = '';
    try {
      if (typeof getOrderObservation === 'function') {
        const obs = getOrderObservation();
        observacao = (obs && typeof obs === 'string') ? obs.trim() : '';
      }
    } catch (e) {
      observacao = '';
    }

    const response = await fetch('http://localhost/Dash-POS/api/vender.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'orcamento',
        id_cliente: idCliente,
        tipo_documento: 'Orcamento',
        observacao: observacao
      })
    });

    const rawText = await response.text();
    if (rawText.trim().startsWith('<')) {
      throw new Error('Erro no servidor. Verifique os logs do PHP.');
    }
    const data = JSON.parse(rawText);

    if (!response.ok || !data.sucesso) {
      throw new Error(data.erro || data.mensagem || 'Erro ao processar Orçamento');
    }

    if (typeof closeAlert === 'function') closeAlert();
    if (typeof showAlert === 'function') {
      showAlert('info', 'A gerar documento', 'A preparar impressão A4...', 0);
    }

    await loadInvoiceAssets('A4');
    applyInvoicePrintStyles('A4');

    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('factura80-container-inv80');
    if (!containerA4 || !container80) throw new Error('Containers de fatura não encontrados.');

    container80.innerHTML = '';
    container80.style.display = 'none';
    containerA4.style.display = 'block';
    containerA4.style.position = 'fixed';
    containerA4.style.top = '-9999px';
    containerA4.style.left = '-9999px';
    containerA4.style.zIndex = '-1';
    containerA4.innerHTML = '';

    if (typeof window.renderizarFaturaComDadosBackend !== 'function') {
      throw new Error('Função renderizarFaturaComDadosBackend não encontrada');
    }
    window.renderizarFaturaComDadosBackend(data);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!containerA4.innerHTML.trim()) throw new Error('Falha na renderização do Orçamento');

    window.print();
    resetPayButtonText();
    if (typeof updateInvoiceTypeDisplay === 'function') {
      updateInvoiceTypeDisplay(getTipoDocumentoAtual());
    }
    await new Promise(resolve => setTimeout(resolve, 150));
    await clearCartAfterSale();

    if (typeof closeAlert === 'function') closeAlert();
    if (typeof showAlert === 'function') {
      showAlert('success', 'Orçamento gerado', `Documento ${data.codigo_documento} gerado com sucesso.`, 4000);
    }
  } catch (error) {
    console.error('❌ [ORÇAMENTO]', error);
    if (typeof closeAlert === 'function') closeAlert();
    resetPayButtonText();
    if (typeof updateInvoiceTypeDisplay === 'function') {
      updateInvoiceTypeDisplay(getTipoDocumentoAtual());
    }
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', error.message || 'Erro ao gerar Orçamento.', 5000);
    } else {
      alert(error.message || 'Erro ao gerar Orçamento.');
    }
  }
}

/**
 * Processa e imprime Fatura (sem pagamento; baixa stock).
 * Envia id_cliente e observacao ao backend, renderiza A4 e abre a janela de impressão.
 */
async function processFaturaInvoice() {
  console.log('🚀 [FATURA] Iniciando Fatura...');

  if (!cart || cart.size === 0 || currentCartTotal <= 0) {
    if (typeof showAlert === 'function') {
      showAlert('warning', 'Carrinho Vazio', 'Adicione produtos ao carrinho antes de gerar a Fatura.', 4000);
    } else {
      alert('Adicione produtos ao carrinho.');
    }
    return;
  }

  let idCliente;
  try {
    idCliente = getIdClienteForDocument();
  } catch (e) {
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', e.message || 'Cliente inválido.');
    } else {
      alert(e.message);
    }
    return;
  }

  try {
    startPayButtonAnimation();
    if (typeof showAlert === 'function') {
      showAlert('info', 'Processando', 'A gerar Fatura...', 0);
    }

    let observacao = '';
    try {
      if (typeof getOrderObservation === 'function') {
        const obs = getOrderObservation();
        observacao = (obs && typeof obs === 'string') ? obs.trim() : '';
      }
    } catch (e) {
      observacao = '';
    }

    const response = await fetch('http://localhost/Dash-POS/api/vender.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'factura',
        id_cliente: idCliente,
        observacao: observacao
      })
    });

    const rawText = await response.text();
    if (rawText.trim().startsWith('<')) {
      throw new Error('Erro no servidor. Verifique os logs do PHP.');
    }
    const data = JSON.parse(rawText);

    if (!response.ok || !data.sucesso) {
      throw new Error(data.erro || data.mensagem || 'Erro ao processar Fatura');
    }

    if (typeof closeAlert === 'function') closeAlert();
    if (typeof showAlert === 'function') {
      showAlert('info', 'A gerar documento', 'A preparar impressão A4...', 0);
    }

    await loadInvoiceAssets('A4');
    applyInvoicePrintStyles('A4');

    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('factura80-container-inv80');
    if (!containerA4 || !container80) throw new Error('Containers de fatura não encontrados.');

    container80.innerHTML = '';
    container80.style.display = 'none';
    containerA4.style.display = 'block';
    containerA4.style.position = 'fixed';
    containerA4.style.top = '-9999px';
    containerA4.style.left = '-9999px';
    containerA4.style.zIndex = '-1';
    containerA4.innerHTML = '';

    if (typeof window.renderizarFaturaComDadosBackend !== 'function') {
      throw new Error('Função renderizarFaturaComDadosBackend não encontrada');
    }
    window.renderizarFaturaComDadosBackend(data);
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!containerA4.innerHTML.trim()) throw new Error('Falha na renderização da Fatura');

    window.print();
    resetPayButtonText();
    if (typeof updateInvoiceTypeDisplay === 'function') {
      updateInvoiceTypeDisplay(getTipoDocumentoAtual());
    }
    await new Promise(resolve => setTimeout(resolve, 150));
    await clearCartAfterSale();

    if (typeof closeAlert === 'function') closeAlert();
    if (typeof showAlert === 'function') {
      showAlert('success', 'Fatura gerada', `Documento ${data.codigo_documento} gerado com sucesso.`, 4000);
    }
  } catch (error) {
    console.error('❌ [FATURA]', error);
    if (typeof closeAlert === 'function') closeAlert();
    resetPayButtonText();
    if (typeof updateInvoiceTypeDisplay === 'function') {
      updateInvoiceTypeDisplay(getTipoDocumentoAtual());
    }
    if (typeof showAlert === 'function') {
      showAlert('error', 'Erro', error.message || 'Erro ao gerar Fatura.', 5000);
    } else {
      alert(error.message || 'Erro ao gerar Fatura.');
    }
  }
}

/**
 * Processa a venda de Fatura-Recibo
 * Envia dados ao backend, carrega recursos, imprime a fatura (janela do navegador) e limpa o carrinho.
 * Não mostra opção de download em PDF após fechar a impressão; isso ficará para etapa futura.
 */
async function processReceiptInvoice() {
  console.log('🚀 [PAYMENT] Iniciando processamento de Fatura-Recibo...');
  
  // ============================================
  // PASSO 1: VALIDAÇÃO DO TIPO DE DOCUMENTO
  // ============================================
  
  const tipoDocumento = typeof getTipoDocumentoAtual === 'function' ? 
    getTipoDocumentoAtual() : tipoDocumentoAtual;
  
  console.log('📄 [PAYMENT] Tipo de documento:', tipoDocumento);
  
  if (tipoDocumento !== 'factura-recibo') {
    console.error('❌ [PAYMENT] Tipo de documento não suportado:', tipoDocumento);
    
    const nomeAmigavel = {
      'factura-recibo': 'Factura-Recibo',
      'factura-proforma': 'Factura Proforma',
      'factura': 'Factura',
      'orcamento': 'Orçamento'
    };
    
    const nomeDocumento = nomeAmigavel[tipoDocumento] || tipoDocumento;
    
    if (typeof showAlert === 'function') {
      showAlert('error', '❌ Tipo Não Suportado', 
        `"${nomeDocumento}" ainda não está implementado. Apenas "Factura-Recibo" está disponível.`, 4000);
    } else {
      alert(`"${nomeDocumento}" ainda não está implementado.`);
    }
    
    return; // BLOQUEIA EXECUÇÃO
  }
  
  // ============================================
  // PASSO 1.5: VALIDAÇÃO CARRINHO E MÉTODOS DE PAGAMENTO (antes de animação)
  // ============================================
  
  if (!cart || cart.size === 0 || currentCartTotal <= 0) {
    if (typeof showAlert === 'function') {
      showAlert('warning', '⚠️ Carrinho Vazio', 'Adicione produtos ao carrinho antes de pagar.', 4000);
    } else {
      alert('Adicione produtos ao carrinho antes de pagar.');
    }
    console.warn('⚠️ [PAYMENT] Bloqueado: carrinho vazio');
    return;
  }
  
  let somaPagamentosPre = 0;
  if (footerPaymentMethods && footerPaymentMethods.length > 0) {
    footerPaymentMethods.forEach(metodo => {
      somaPagamentosPre += parseFloat(footerValoresPorMetodo[metodo.slug]) || 0;
    });
  }
  if (somaPagamentosPre <= 0) {
    if (typeof showAlert === 'function') {
      showAlert('warning', '⚠️ Métodos de Pagamento', 'Preencha os valores nos métodos de pagamento (dinheiro, multibanco, etc.) antes de pagar.', 5000);
    } else {
      alert('Preencha os valores nos métodos de pagamento antes de pagar.');
    }
    console.warn('⚠️ [PAYMENT] Bloqueado: nenhum valor de pagamento informado');
    return;
  }
  
  // ============================================
  // PASSO 2: RECOLHA E ENVIO DE DADOS
  // ============================================
  
  try {
    startPayButtonAnimation();
    
    if (typeof showAlert === 'function') {
      showAlert('info', '⏳ Processando', 'Validando dados do pagamento...', 0);
    }
    
    console.log('📊 [PAYMENT] Coletando dados de pagamento...');
    const paymentData = collectPaymentData();
    
    // Validação frontend: valor pago >= total a pagar
    const totalAPagar = currentCartTotal || 0;
    const totalPago = paymentData.valor_pago || 0;
    
    console.log('💰 [PAYMENT] Validação:', {
      totalAPagar: totalAPagar.toFixed(2),
      totalPago: totalPago.toFixed(2),
      diferenca: (totalPago - totalAPagar).toFixed(2)
    });
    
    if (totalPago < totalAPagar) {
      stopPayButtonAnimation();
      
      const valorEmFalta = totalAPagar - totalPago;
      showPaymentMissing(valorEmFalta);
      
      const msg = `Valor insuficiente! Faltam ${valorEmFalta.toLocaleString('pt-AO', { 
        minimumFractionDigits: 2 
      })} Kz para completar o pagamento.`;
      
      if (typeof showAlert === 'function') {
        showAlert('error', '❌ Pagamento Incompleto', msg, 5000);
      } else {
        alert(msg);
      }
      
      console.warn('❌ [PAYMENT] Bloqueado: valor insuficiente');
      return;
    }
    
    console.log('📤 [PAYMENT] Enviando dados para backend...');
    
    const response = await fetch('http://localhost/Dash-POS/api/vender.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    console.log('📡 [PAYMENT] Resposta recebida. Status:', response.status);

    const rawText = await response.text();
    console.log('📥 [PAYMENT] Resposta RAW (primeiros 300 chars):', rawText.substring(0, 300));

    // Valida se não é HTML (erro PHP)
    if (rawText.trim().startsWith('<')) {
      console.error('❌ [PAYMENT] SERVIDOR RETORNOU HTML (erro PHP)');
      throw new Error('Erro no servidor. Verifique os logs do PHP.');
    }

    // Parse JSON
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error('❌ [PAYMENT] JSON inválido:', parseError);
      throw new Error('Resposta do servidor inválida');
    }

    console.log('📥 [PAYMENT] Dados parseados:', data);

    // Valida resposta do backend
    if (!response.ok || !data.sucesso) {
      const errorMsg = data.erro || data.mensagem || 'Erro desconhecido no backend';
      throw new Error(errorMsg);
    }
    
    console.log('✅ [PAYMENT] Pagamento aprovado pelo backend!');
    console.log('📄 [PAYMENT] Código do documento:', data.codigo_documento);
    
    // ============================================
    // PASSO 3: CARREGAMENTO DINÂMICO DE RECURSOS
    // ============================================
    
    // Detecta formato selecionado pelo usuário
    let formato = 'A4';
    
    console.log('🔍 [FORMAT] Detectando formato selecionado...');
    
    if (typeof formatoFaturaAtual !== 'undefined' && formatoFaturaAtual) {
      formato = formatoFaturaAtual;
      console.log('✅ [FORMAT] Variável global:', formato);
    } else if (typeof getInvoiceFormat === 'function') {
      formato = getInvoiceFormat() || 'A4';
      console.log('✅ [FORMAT] Função getInvoiceFormat():', formato);
    } else {
      const radio = document.querySelector('input[name="invoiceFormat"]:checked');
      formato = radio?.value || 'A4';
      console.log('✅ [FORMAT] Radio button:', formato);
    }
    
    // Validação do formato
    if (formato !== 'A4' && formato !== '80mm') {
      console.warn('⚠️ [FORMAT] Formato inválido:', formato, '- Usando A4');
      formato = 'A4';
    }
    
    console.log('📐 [FORMAT] Formato CONFIRMADO:', formato);
    
    // Atualiza mensagem de loading
    if (typeof showAlert === 'function') {
      closeAlert();
      showAlert('info', '⏳ Gerando Fatura', `Carregando recursos para ${formato}...`, 0);
    }
    
    // ✅ CARREGA RECURSOS DINAMICAMENTE
    console.log(`🔄 [ASSETS] Iniciando carregamento para ${formato}...`);
    
    try {
      await loadInvoiceAssets(formato);
      console.log('✅ [ASSETS] Recursos carregados com sucesso');
    } catch (assetError) {
      throw new Error(`Falha ao carregar recursos de fatura: ${assetError.message}`);
    }
    
    // ============================================
    // PASSO 3.5.5: APLICAR ESTILOS DE IMPRESSÃO
    // ============================================
    
    // ✅ ESTILOS DE IMPRESSÃO: apenas o container usado fica visível (evita 1ª página em branco)
    applyInvoicePrintStyles(formato);
    
    // ============================================
    // PASSO 4: RENDERIZAÇÃO DA FATURA (CORRIGIDO)
    // ============================================

    if (typeof showAlert === 'function') {
      closeAlert();
      showAlert('info', '⏳ Gerando Fatura', 'Preparando documento para impressão...', 0);
    }

    console.log('🎨 [RENDER] Iniciando renderização...');

    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('factura80-container-inv80');
    if (!containerA4 || !container80) {
      throw new Error('Containers de fatura não encontrados no DOM');
    }

    // ✅ Mostrar só o container que vamos usar e esconder/limpar o outro (igual ao backup)
    if (formato === '80mm') {
      containerA4.innerHTML = '';
      containerA4.style.display = 'none';
      container80.style.display = 'block';
      container80.style.position = 'fixed';
      container80.style.top = '-9999px';
      container80.style.left = '-9999px';
      container80.style.zIndex = '-1';
      console.log('📄 [RENDER] Container 80mm ativo, A4 oculto');
    } else {
      container80.innerHTML = '';
      container80.style.display = 'none';
      containerA4.style.display = 'block';
      containerA4.style.position = 'fixed';
      containerA4.style.top = '-9999px';
      containerA4.style.left = '-9999px';
      containerA4.style.zIndex = '-1';
      console.log('📄 [RENDER] Container A4 ativo, 80mm oculto');
    }

    if (formato === '80mm') {
      // ========== RENDERIZAÇÃO 80MM ==========
      
      console.log('📄 [RENDER] Renderizando fatura 80mm...');
      
      if (typeof window.renderizarFatura80ComDadosBackend !== 'function') {
        throw new Error('Função renderizarFatura80ComDadosBackend não encontrada');
      }
      
      window.renderizarFatura80ComDadosBackend(data);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const hasContent = container80.innerHTML.length > 0;
      if (!hasContent) {
        throw new Error('Falha na renderização da fatura 80mm');
      }
      
      console.log('✅ [RENDER] Fatura 80mm renderizada');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } else {
      // ========== RENDERIZAÇÃO A4 ==========
      
      console.log('📄 [RENDER] Renderizando fatura A4...');
      
      if (typeof window.renderizarFaturaComDadosBackend !== 'function') {
        throw new Error('Função renderizarFaturaComDadosBackend não encontrada');
      }
      
      window.renderizarFaturaComDadosBackend(data);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const hasContent = containerA4.innerHTML.length > 0;
      if (!hasContent) {
        throw new Error('Falha na renderização da fatura A4');
      }
      
      console.log('✅ [RENDER] Fatura A4 renderizada');
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // ========== IMPRESSÃO ==========
    
    console.log('🖨️ [PRINT] Abrindo janela de impressão...');
    
    // ✅ CHAMADA DIRETA: janela de impressão abre (animação continua a rodar)
    window.print();
    
    // Utilizador fechou a janela de impressão → parar animação e repor texto "Pagar" de imediato
    resetPayButtonText();
    
    // Pequena pausa para o diálogo fechar por completo (evita race)
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // ============================================
    // PASSO 5: LIMPEZA DO ESTADO DA VENDA
    // ============================================
    
    console.log('🧹 [CLEANUP] Iniciando limpeza pós-venda...');
    
    // Limpa carrinho e estado (UI fica disponível logo)
    await clearCartAfterSale();
    
    // Mensagem de sucesso
    if (typeof showAlert === 'function') {
      showAlert('success', '✅ Venda Concluída', 
        `Fatura ${data.codigo_documento} gerada com sucesso!`, 4000);
    }
    
    console.log('🎉 [PAYMENT] Processo concluído com sucesso!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    // ========== TRATAMENTO DE ERROS ==========
    
    console.error('❌ [PAYMENT] Erro no processamento:', error);
    console.error('Stack:', error.stack);
    
    // Fecha loading
    if (typeof closeAlert === 'function') {
      closeAlert();
    }
    
    // Restaura botão
    resetPayButtonText();
    
    // Mostra erro ao usuário
    if (typeof showAlert === 'function') {
      showAlert('error', '❌ Erro no Pagamento', 
        error.message || 'Erro ao processar a venda', 6000);
    } else {
      alert('Erro: ' + (error.message || 'Erro ao processar'));
    }
  }
}

/**
 * Limpa carrinho e reseta estado após venda concluída
 */
async function clearCartAfterSale() {
  console.log('🧹 Limpando carrinho após venda...');
  
  try {
    // 1. LIMPAR CARRINHO LOCAL
    if (cart && typeof cart.clear === 'function') {
      cart.clear();
      console.log('✅ Carrinho local limpo');
    }
    
    // 2. RESETAR VALORES DE PAGAMENTO
    if (typeof resetFooterPaymentValues === 'function') {
      resetFooterPaymentValues();
      console.log('✅ Valores de pagamento resetados');
    }
    
    // 3. LIMPAR OBSERVAÇÃO
    const obsTextarea = document.getElementById('orderObservation');
    if (obsTextarea) {
      obsTextarea.value = '';
    }
    if (window.orderObservation !== undefined) {
      window.orderObservation = '';
    }
    console.log('✅ Observação limpa');
    
    // 4. ATUALIZAR DISPLAYS
    if (typeof updateCartDisplay === 'function') {
      updateCartDisplay();
    }
    
    if (typeof renderCart === 'function') {
      renderCart();
    }
    
    // 5. Recarrega carrinho da API em background (não bloqueia; UI já está limpa)
    if (typeof loadCartFromAPI === 'function') {
      const loadPromise = loadCartFromAPI();
      if (loadPromise && typeof loadPromise.then === 'function') {
        loadPromise.then(() => console.log('✅ Carrinho recarregado da API')).catch(err => console.warn('⚠️ loadCartFromAPI:', err));
      }
    }
    
    // ✅ LIMPA OS CONTAINERS APÓS A IMPRESSÃO (não antes!)
    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('factura80-container-inv80');

    if (containerA4) containerA4.innerHTML = '';
    if (container80) container80.innerHTML = '';

    console.log('✅ Containers de fatura limpos');
    
    console.log('✅ Limpeza concluída');
    
    // ✅ NOVA: Restaura texto do botão após limpeza
    resetPayButtonText();
    
  } catch (error) {
    console.error('⚠️ Erro ao limpar carrinho:', error);
  }
}
/* LEGACY - versão simplificada, ver alerts.ui.js */
function closeAlert() {
  const container = document.getElementById('alertContainer');
  if (container) {
    container.innerHTML = '';
  }
}

/**
 * Retorna o tipo de documento atualmente selecionado
 * DUPLICADO - versão em invoice-type.ui.js
 * @returns {string} Tipo do documento
 */
function getTipoDocumentoAtual() {
  return tipoDocumentoAtual || 'factura-recibo';
}
function initPayButton() {
  console.log('🔧 [PAY BUTTON] Tentando inicializar botão Pagar...');
  const cartFooter = document.querySelector('.cart-footer');
  if (!cartFooter) {
    console.warn('⚠️ [PAY BUTTON] .cart-footer não encontrado, tentando em 500ms...');
    setTimeout(initPayButton, 500);
    return;
  }
  cartFooter.addEventListener('click', async function (e) {
    if (!e.target || !e.target.closest('.keypad-pay-btn')) return;
    e.preventDefault();
    console.log('💳 [PAY BUTTON] Botão "Pagar" clicado');
    var tipoDoc = getTipoDocumentoAtual();
    console.log('📄 [PAY BUTTON] Tipo de documento:', tipoDoc);
    if (tipoDoc === 'factura-proforma') {
      console.log('🚀 [PAY BUTTON] Chamando processProformaInvoice()...');
      await processProformaInvoice();
      return;
    }
    if (tipoDoc === 'factura') {
      console.log('🚀 [PAY BUTTON] Chamando processFaturaInvoice()...');
      await processFaturaInvoice();
      return;
    }
    if (tipoDoc === 'orcamento') {
      console.log('🚀 [PAY BUTTON] Chamando processOrcamentoInvoice()...');
      await processOrcamentoInvoice();
      return;
    }
    if (tipoDoc !== 'factura-recibo') {
      if (typeof showAlert === 'function') {
        showAlert(
          'warning',
          'Tipo Não Suportado',
          'Este tipo de documento ainda não está implementado. Use Factura-Recibo, Factura Proforma ou Orçamento.',
          4000
        );
      } else {
        alert('Este tipo de documento ainda não está implementado.');
      }
      return;
    }
    console.log('🚀 [PAY BUTTON] Chamando processReceiptInvoice()...');
    await processReceiptInvoice();
  });
  console.log('✅ [PAY BUTTON] Event listener (delegação) attached em .cart-footer');
}

// ✅ Pay button initialization now handled in init() function
// Previous DOMContentLoaded calls removed to prevent race conditions
// DEBUG - pode ser removido em produção
async function testRender80mm() {
    console.log('🧪 [TEST] Iniciando teste de renderização 80mm...');
    
    const testData = {
        codigo_documento: 'FR TEST/001',
        data_emissao: '01/02/2026',
        hora_emissao: '10:30:00',
        dados_empresa: {
            Empresa: 'Teste LTDA',
            NIF: '1234567890'
        },
        dados_cliente: {
            Nome: 'Cliente Teste',
            NIF: '987654321'
        },
        produtos: [
            {
                designacao: 'Produto Teste 1',
                quantidade: 2,
                precoUnitario: 50.00,
                desconto: 5.00,
                taxa: '14%',
                total: 95.00
            },
            {
                designacao: 'Produto Teste 2',
                quantidade: 1,
                precoUnitario: 30.00,
                desconto: 0.00,
                taxa: '14%',
                total: 34.20
            }
        ],
        impostos: [
            {
                taxa: '14%',
                incidencia: 80.00,
                valor: 11.20
            }
        ],
        totais: {
            totalMercadorias: 80.00,
            totalImposto: 11.20,
            totalDescontos: 5.00,
            totalDocumento: 129.20
        },
        numeroFatura: 'FR TEST/001',
        operador: 'Operador Teste'
    };
    
    try {
        // Força formato 80mm para teste
        window.formatoFaturaAtual = '80mm';
        
        console.log('📦 [TEST] Dados de teste:', testData);
        
        // Chama a função principal com dados de teste
        await processReceiptInvoice(testData);
        
        console.log('✅ [TEST] Teste concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ [TEST] Erro no teste:', error);
        alert('Erro no teste: ' + error.message);
    }
}

// DEBUG - pode ser removido em produção
function debug80mmContainer() {
    const container = document.getElementById('factura80-container-inv80');
    if (!container) {
        console.log('❌ [DEBUG] Container 80mm NÃO ENCONTRADO');
        return null;
    }
    
    console.log('🔍 [DEBUG] Container 80mm encontrado:', {
        id: container.id,
        className: container.className,
        childrenCount: container.children.length,
        htmlLength: container.innerHTML.length,
        style: {
            position: container.style.position,
            left: container.style.left,
            top: container.style.top,
            width: container.style.width,
            visibility: container.style.visibility,
            opacity: container.style.opacity,
            zIndex: container.style.zIndex
        },
        computedStyle: {
            position: getComputedStyle(container).position,
            display: getComputedStyle(container).display,
            visibility: getComputedStyle(container).visibility
        }
    });
    
    if (container.innerHTML.length > 0) {
        console.log('📄 [DEBUG] Conteúdo do container (primeiros 500 caracteres):', 
                   container.innerHTML.substring(0, 500));
    } else {
        console.log('⚠️ [DEBUG] Container está vazio');
    }
    
    return container;
}

window.processReceiptInvoice = processReceiptInvoice;
window.collectPaymentData = collectPaymentData;
window.clearCartAfterSale = clearCartAfterSale;
window.testRender80mm = testRender80mm;
window.debug80mmContainer = debug80mmContainer;

