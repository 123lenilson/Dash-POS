/* ================================================
   MÓDULO: Invoice Assets Module
   Ficheiro: assets/js/modules/invoice-assets.module.js
   Parte do sistema Dash-POS
   (invoiceAssetsState está em state.js)
   ================================================ */

/* ======================================================
   SISTEMA DE CARREGAMENTO DINÂMICO DE FATURAS
   ====================================================== */

/**
 * Carrega um arquivo CSS dinamicamente
 * @param {string} href - Caminho do arquivo CSS
 * @param {string} id - ID único para o elemento link
 * @returns {Promise<void>}
 */
function loadCSS(href, id) {
  return new Promise((resolve, reject) => {
    // Verifica se já existe no DOM
    if (document.getElementById(id)) {
      console.log(`✅ [CSS] ${id} já carregado`);
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    
    link.onload = () => {
      console.log(`✅ [CSS] ${id} carregado com sucesso`);
      resolve();
    };
    
    link.onerror = () => {
      console.error(`❌ [CSS] Falha ao carregar ${id}`);
      reject(new Error(`Falha ao carregar CSS: ${href}`));
    };
    
    document.head.appendChild(link);
  });
}

/**
 * Carrega todos os recursos necessários para renderizar faturas
 * @param {string} format - Formato da fatura: 'A4' ou '80mm'
 * @returns {Promise<void>}
 * @throws {Error} Se formato inválido ou falha no carregamento
 */
async function loadInvoiceAssets(format) {
  console.log(`🔄 [ASSETS] Iniciando carregamento para formato: ${format}`);
  
  if (format !== 'A4' && format !== '80mm') {
    throw new Error(`Formato inválido: ${format}. Use 'A4' ou '80mm'.`);
  }
  
  try {
    // Carregar ambos os CSS (como no backup) para A4 e 80mm estarem sempre disponíveis
    if (!invoiceAssetsState.css.a4) {
      await loadCSS('../assets/css/fatura.css', 'fatura-a4-css');
      invoiceAssetsState.css.a4 = true;
    }
    if (!invoiceAssetsState.css.mm80) {
      await loadCSS('../assets/css/fatura80.css', 'fatura-80mm-css');
      invoiceAssetsState.css.mm80 = true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const containerA4 = document.getElementById('inv-a4-container-principal');
    const container80 = document.getElementById('fatura80-container-inv80');
    if (containerA4) {
      containerA4.style.position = 'fixed';
      containerA4.style.top = '-9999px';
      containerA4.style.left = '-9999px';
      containerA4.style.zIndex = '-1';
    }
    if (container80) {
      container80.style.position = 'fixed';
      container80.style.top = '-9999px';
      container80.style.left = '-9999px';
      container80.style.zIndex = '-1';
    }
    
    console.log('✅ [ASSETS] Carregamento concluído');
    
  } catch (error) {
    console.error('❌ [ASSETS] Erro ao carregar recursos:', error);
    throw new Error(`Falha ao carregar recursos de fatura: ${error.message}`);
  }
}

/**
 * Verifica se os recursos CSS para um formato já estão carregados
 * @param {string} format - Formato: 'A4' ou '80mm'
 * @returns {boolean}
 */
function areInvoiceAssetsLoaded(format) {
  if (format === 'A4') {
    return invoiceAssetsState.css.a4;
  } else if (format === '80mm') {
    return invoiceAssetsState.css.mm80;
  }
  return false;
}

/**
 * Reseta o estado de carregamento CSS (útil para debug)
 */
function resetInvoiceAssetsState() {
  invoiceAssetsState.css.a4 = false;
  invoiceAssetsState.css.mm80 = false;
  console.log('🔄 [ASSETS] Estado de carregamento resetado');
}

/**
 * Aplica ou atualiza estilos de impressão para o formato indicado.
 * Mostra apenas o container da fatura usada e define @page correto (evita 1ª página em branco).
 * @param {string} format - 'A4' ou '80mm'
 */
function applyInvoicePrintStyles(format) {
  const printStylesId = 'invoice-print-styles-global';
  let el = document.getElementById(printStylesId);
  if (!el) {
    el = document.createElement('style');
    el.id = printStylesId;
    document.head.appendChild(el);
  }
  const isA4 = format === 'A4';
  el.textContent = `
    @media print {
      @page {
        margin: 0 !important;
        size: ${isA4 ? 'A4 portrait' : '80mm auto'};
      }
      /* Esconder só filhos diretos do body (evita 2.ª página); descendentes da fatura mantêm flex/grid do fatura.css */
      html, body {
        margin: 0 !important; padding: 0 !important;
        height: auto !important; min-height: 0 !important;
        overflow: hidden !important;
      }
      body > * { display: none !important; }
      ${isA4
        ? `#inv-a4-container-principal {
             display: block !important;
             position: absolute !important; left: 0 !important; top: 0 !important;
             width: 210mm !important;
             height: auto !important;
             background: white !important;
             z-index: 9999 !important; padding: 0 !important; margin: 0 !important;
             page-break-after: avoid !important;
           }
           #fatura80-container-inv80 { display: none !important; }`
        : `#fatura80-container-inv80 {
             display: block !important;
             position: absolute !important; left: 0 !important; top: 0 !important;
             width: 80mm !important;
             height: auto !important; min-height: 0 !important;
             background: white !important;
             z-index: 9999 !important; padding: 0 !important; margin: 0 !important;
             page-break-after: avoid !important;
           }
           #inv-a4-container-principal { display: none !important; }`
      }
      .inv-a4-container-multiplas-paginas { gap: 0 !important; margin: 0 !important; padding: 0 !important; }
      /* Altura fixa 297mm por página (como fatura.css do backup) para caber cabeçalho + corpo + rodapé numa folha */
      .inv-a4-interface-fatura, .inv-a4-pagina-fatura {
        width: 210mm !important; height: 297mm !important;
        margin: 0 !important; padding: 12px !important;
        box-shadow: none !important; border-radius: 0 !important;
        overflow: hidden !important;
        page-break-after: always !important; page-break-inside: avoid !important;
      }
      .inv-a4-interface-fatura:last-child, .inv-a4-pagina-fatura:last-child { page-break-after: auto !important; }
      .inv-a4-sessao-cabecalho, .inv-a4-sessao-corpo-central, .inv-a4-sessao-rodape { page-break-inside: avoid !important; }
    }
    @media screen {
      #inv-a4-container-principal, #fatura80-container-inv80 {
        position: fixed !important; top: -9999px !important; left: -9999px !important;
        z-index: -1 !important;
      }
    }
  `;
  console.log('✅ [STYLES] Estilos de impressão aplicados para', format);
}

// Expor funções globalmente para debug
window.loadInvoiceAssets = loadInvoiceAssets;
window.areInvoiceAssetsLoaded = areInvoiceAssetsLoaded;
window.resetInvoiceAssetsState = resetInvoiceAssetsState;
window.invoiceAssetsState = invoiceAssetsState;
window.applyInvoicePrintStyles = applyInvoicePrintStyles;
