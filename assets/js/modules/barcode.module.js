/* ================================================
   MÓDULO: Barcode Module
   Ficheiro: assets/js/modules/barcode.module.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= BARCODE SCANNER SYSTEM ======= */

// Configurações do scanner
const BARCODE_CONFIG = {
  minLength: 8,           // Tamanho mínimo do código
  maxLength: 20,          // Tamanho máximo do código
  timeout: 100,           // Tempo máximo entre caracteres (ms)
  enterKey: true,         // Leitor envia Enter ao final?
  prefixChars: [],        // Caracteres de prefixo (ex: ['*'])
  suffixChars: ['\n', '\r', 'Enter'] // Caracteres de sufixo
};

// Estado do scanner
let barcodeBuffer = '';
let barcodeTimeout = null;
let isProcessingBarcode = false;
let lastBarcodeTime = 0;

// Elementos DOM
const barcodeInput = document.getElementById('barcodeInput');
const barcodeStatus = document.getElementById('barcodeStatus');
const barcodeLastScan = document.getElementById('barcodeLastScan');

// Estatísticas (opcional)
const barcodeStats = {
  total: 0,
  success: 0,
  errors: 0,
  history: []
};

/**
 * Sistema de detecção de código de barras
 * Captura sequências rápidas de teclas que simulam leitura de scanner
 */
document.addEventListener('keydown', (e) => {
  // Ignora se estiver digitando em outro input/textarea (exceto barcodeInput)
  if (e.target.tagName === 'INPUT' && e.target.id !== 'barcodeInput') return;
  if (e.target.tagName === 'TEXTAREA') return;

  // Ignora teclas de controle (exceto Enter)
  if (e.key.length > 1 && e.key !== 'Enter') return;

  const now = Date.now();
  const timeDiff = now - lastBarcodeTime;

  // Se passou muito tempo, reseta o buffer
  if (timeDiff > BARCODE_CONFIG.timeout && barcodeBuffer.length > 0) {
    console.log('⏱️ Timeout - Buffer resetado:', barcodeBuffer);
    barcodeBuffer = '';
  }

  lastBarcodeTime = now;

  // Detecta Enter (fim da leitura)
  if (e.key === 'Enter' && barcodeBuffer.length >= BARCODE_CONFIG.minLength) {
    e.preventDefault();
    processBarcode(barcodeBuffer.trim());
    barcodeBuffer = '';
    return;
  }

  // Adiciona caractere ao buffer
  if (e.key.length === 1) {
    barcodeBuffer += e.key;

    // Auto-focus no input visual
    if (barcodeInput && document.activeElement !== barcodeInput) {
      barcodeInput.value = barcodeBuffer;
    }

    // Limpa timeout anterior
    clearTimeout(barcodeTimeout);

    // Define novo timeout para auto-processar
    barcodeTimeout = setTimeout(() => {
      if (barcodeBuffer.length >= BARCODE_CONFIG.minLength) {
        console.log('⏱️ Auto-processando após timeout:', barcodeBuffer);
        processBarcode(barcodeBuffer.trim());
        barcodeBuffer = '';
      }
    }, BARCODE_CONFIG.timeout);
  }
});

/**
 * Listener dedicado para o input visual
 */
barcodeInput?.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const barcode = barcodeInput.value.trim();

    if (barcode.length >= BARCODE_CONFIG.minLength) {
      await processBarcode(barcode);
      barcodeInput.value = '';
    } else {
      showBarcodeStatus('❌', 'error');
      showAlert('warning', '⚠️ Código Inválido', 'O código deve ter no mínimo 8 caracteres');
    }
  }
});

/* ======= BARCODE TOGGLE CONTROL ======= */
let isBarcodeEnabled = true; // Inicialmente ativo

// Elementos DOM do toggle
const barcodeToggle = document.getElementById('barcodeToggle');
const barcodeToggleContainer = document.querySelector('.barcode-toggle');

/**
 * Controla o estado do leitor de código de barras
 */
function toggleBarcodeScanner(enable) {
  console.log('🎯 toggleBarcodeScanner chamado com:', enable);
  isBarcodeEnabled = enable;

  if (enable) {
    console.log('✅ Leitor de código de barras ATIVADO');
    barcodeToggleContainer?.classList.add('active');
    console.log('📢 Chamando showAlert para ATIVADO...');
    showAlert('success', 'Leitor Ativado', 'O leitor de código de barras foi ativado com sucesso', 2500);
  } else {
    console.log('🚫 Leitor de código de barras DESATIVADO');
    barcodeToggleContainer?.classList.remove('active');
    console.log('📢 Chamando showAlert para DESATIVADO...');
    showAlert('info', 'Leitor Desativado', 'O leitor de código de barras foi desativado', 2500);
  }
  console.log('✔️ toggleBarcodeScanner finalizado');
}

/**
 * Processa o código de barras capturado
 * ✅ OTIMIZADO: Busca direto no array PRODUCTS (sem fetch adicional)
 */
async function processBarcode(barcode) {

  // 🔒 VERIFICA SE O LEITOR ESTÁ BLOQUEADO
  if (!isBarcodeEnabled) {
    console.log('🚫 Leitor bloqueado - Ignorando código:', barcode);
    showAlert('warning', '🔒 Leitor Bloqueado', 'Ative o leitor para escanear produtos', 2000);
    return;
  }

  // Previne processamento duplicado
  if (isProcessingBarcode) {
    console.log('⚠️ Já está processando um código');
    return;
  }

  isProcessingBarcode = true;
  barcodeStats.total++;

  console.log('🔍 Processando código de barras:', barcode);

  // Feedback visual - Processando
  showBarcodeStatus('⏳', 'processing');
  if (barcodeInput) {
    barcodeInput.style.borderColor = '#3b82f6';
    barcodeInput.value = barcode;
  }

  try {
    // ✅ BUSCA DIRETO NO ARRAY PRODUCTS (já carregado na memória)
    const produto = PRODUCTS.find(p => p.barra && p.barra.trim() === barcode.trim());

    if (produto) {
      const produtoId = produto.id;

      console.log('✅ Produto encontrado no cache local:', produto);
      console.log({
        id: produtoId,
        nome: produto.name,
        codigo_barra: produto.barra,
        preco: produto.price,
        disponivel: produto.available,
        tipo: produto.ps === 'S' ? 'SERVIÇO' : 'PRODUTO'
      });

      // ✅ REUTILIZA A FUNÇÃO EXISTENTE - Mesmo fluxo do clique
      addToCart(produtoId, 1);

      // Feedback de sucesso
      showBarcodeStatus('✅', 'success');
      showBarcodeLastScan(produto.name, 'success');
      barcodeStats.success++;

      // Alert de sucesso
      showAlert('success', '✅ Adicionado', `${produto.name} foi adicionado ao pedido`);

      // Som de beep
      playBeepSound('success');

      // Salva no histórico
      barcodeStats.history.unshift({
        barcode,
        produto: produto.name,
        timestamp: new Date().toISOString(),
        success: true
      });

      // Limpa input após 1.5 segundos
      setTimeout(() => {
        if (barcodeInput) barcodeInput.value = '';
        showBarcodeStatus('', 'idle');
      }, 1500);

    } else {
      // Produto não encontrado no cache local
      console.warn('❌ Código não encontrado no cache:', barcode);
      console.log('💡 Dica: Verifique se o produto tem o campo "barra" preenchido na base de dados');

      showBarcodeStatus('❌', 'error');
      showBarcodeLastScan(`Código ${barcode} não encontrado`, 'error');
      barcodeStats.errors++;

      showAlert('error', '❌ Não Encontrado', 'Código de barras não cadastrado no sistema ou produto não carregado');

      playBeepSound('error');

      // Salva no histórico
      barcodeStats.history.unshift({
        barcode,
        produto: null,
        timestamp: new Date().toISOString(),
        success: false,
        error: 'Produto não encontrado'
      });

      // Limpa após 2 segundos
      setTimeout(() => {
        if (barcodeInput) barcodeInput.value = '';
        showBarcodeStatus('', 'idle');
      }, 2000);
    }

  } catch (error) {
    console.error('💥 Erro ao processar código de barras:', error);

    showBarcodeStatus('⚠️', 'error');
    showBarcodeLastScan('Erro interno', 'error');
    barcodeStats.errors++;

    showAlert('error', '❌ Erro', 'Erro ao processar o código de barras');

    playBeepSound('error');

  } finally {
    isProcessingBarcode = false;

    // Reseta visual após delay
    setTimeout(() => {
      if (barcodeInput) barcodeInput.style.borderColor = 'rgba(255,255,255,0.3)';
    }, 1000);
  }
}

/**
 * Mostra status visual no input
 */
function showBarcodeStatus(icon, type) {
  if (!barcodeStatus) return;

  barcodeStatus.textContent = icon;
  barcodeStatus.style.display = icon ? 'block' : 'none';

  // Cores baseadas no tipo
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    processing: '#3b82f6',
    idle: '#6b7280'
  };

  barcodeStatus.style.color = colors[type] || colors.idle;
}

/**
 * Mostra última leitura
 */
function showBarcodeLastScan(text, type) {
  if (!barcodeLastScan) return;

  const colors = {
    success: 'rgba(16, 185, 129, 0.9)',
    error: 'rgba(239, 68, 68, 0.9)'
  };

  barcodeLastScan.textContent = text;
  barcodeLastScan.style.color = colors[type] || 'rgba(255,255,255,0.9)';
  barcodeLastScan.style.display = 'block';
}

/**
 * Sons de feedback
 */
function playBeepSound(type = 'success') {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'success') {
      // Tom agudo e curto para sucesso
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);

    } else if (type === 'error') {
      // Tom grave e prolongado para erro
      oscillator.frequency.value = 200;
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  } catch (error) {
    console.warn('Áudio não suportado:', error);
  }
}

/**
 * Debug: Mostra estatísticas no console
 */
function showBarcodeStats() {
  console.table({
    'Total de Leituras': barcodeStats.total,
    'Sucessos': barcodeStats.success,
    'Erros': barcodeStats.errors,
    'Taxa de Sucesso': `${((barcodeStats.success / barcodeStats.total) * 100).toFixed(1)}%`
  });

  console.log('📊 Histórico Completo:', barcodeStats.history);
}

// Comando de debug disponível no console
window.barcodeStats = showBarcodeStats;

/**
 * Event Listener para o toggle
 */
document.addEventListener('DOMContentLoaded', function () {
  console.log('🔵 Inicializando toggle do código de barras...');
  const toggle = document.getElementById('barcodeToggle');

  if (toggle) {
    console.log('✅ Toggle encontrado!');
    // Inicializa como ativo
    toggle.checked = true;
    isBarcodeEnabled = true;
    barcodeToggleContainer?.classList.add('active');

    // Event listener para mudanças no toggle
    toggle.addEventListener('change', function (e) {
      console.log('🔄 Toggle mudou para:', e.target.checked);
      toggleBarcodeScanner(e.target.checked);
    });

    console.log('✅ Event listener do toggle adicionado com sucesso!');
  } else {
    console.error('❌ Toggle de código de barras não encontrado!');
  }
});

// Adiciona controle por teclado (Alt+B)
document.addEventListener('keydown', function (e) {
  if (e.altKey && e.key === 'b') {
    e.preventDefault();
    console.log('⌨️  Atalho Alt+B pressionado');
    const toggle = document.getElementById('barcodeToggle');
    if (toggle) {
      toggle.checked = !toggle.checked;
      console.log('🔄 Toggle alterado via teclado para:', toggle.checked);
      toggleBarcodeScanner(toggle.checked);

      // Trigger change event
      const event = new Event('change');
      toggle.dispatchEvent(event);
    } else {
      console.error('❌ Toggle não encontrado ao usar atalho Alt+B');
    }
  }
});

console.log('✅ Sistema de código de barras inicializado');
console.log('💡 Digite "barcodeStats()" no console para ver estatísticas');
