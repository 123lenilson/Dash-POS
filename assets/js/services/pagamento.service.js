/* ================================================
   MÓDULO: Pagamento Service
   Ficheiro: assets/js/services/pagamento.service.js
   Parte do sistema Dash-POS
   ================================================ */

/**
 * Carrega métodos de pagamento da API e renderiza no footer
 */
function loadFooterPaymentMethods() {
  const track = document.getElementById('paymentMethodsTrack');
  if (!track) {
    console.warn('⚠️ Track de métodos de pagamento não encontrado');
    return;
  }

  console.log('🔄 [FOOTER] Carregando métodos de pagamento...');

  fetch("../api/pagamento.php?acao=listar_pagamento", {
    method: "GET",
    cache: "no-store"
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.sucesso && Array.isArray(data.pagamentos)) {
        footerPaymentMethods = data.pagamentos
          .filter(p => p.ativo === "1")
          .map(item => ({
            id: item.idpagamento || item.id,
            nome: item.forma,
            slug: generatePaymentSlug(item.forma)
          }));
        console.log('✅ [FOOTER] Carregados', footerPaymentMethods.length, 'métodos');
      } else {
        console.warn('⚠️ [FOOTER] Sem métodos de pagamento:', data.mensagem || data.erro);
        footerPaymentMethods = [];
      }
      renderFooterPaymentCards();
    })
    .catch(error => {
      console.error('❌ [FOOTER] Erro ao carregar métodos:', error);
      // Fallback
      footerPaymentMethods = [
        { id: 1, nome: 'Dinheiro', slug: 'dinheiro' },
        { id: 2, nome: 'TPA', slug: 'tpa' },
        { id: 3, nome: 'Transferência', slug: 'transferencia' }
      ];
      renderFooterPaymentCards();
    });
}
