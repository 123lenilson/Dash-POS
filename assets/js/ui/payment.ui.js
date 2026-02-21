/* ================================================
   MÓDULO: Payment UI
   Ficheiro: assets/js/ui/payment.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/**
 * Gera slug a partir do nome do método
 */
function generatePaymentSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Renderiza os cards de pagamento no footer
 */
function renderFooterPaymentCards() {
  const track = document.getElementById('paymentMethodsTrack');
  if (!track) return;

  if (footerPaymentMethods.length === 0) {
    track.innerHTML = '<span class="pm-empty">Nenhum método disponível</span>';
    return;
  }

  // Inicializa valores por método (se ainda não existir)
  footerPaymentMethods.forEach(metodo => {
    if (!(metodo.slug in footerValoresPorMetodo)) {
      footerValoresPorMetodo[metodo.slug] = 0;
    }
  });

  // Renderiza cards com estrutura de duas linhas (nome + valor restante)
  track.innerHTML = footerPaymentMethods.map(metodo =>
    `<button class="pm-card" data-method="${metodo.slug}" data-id="${metodo.id}">
      <span class="pm-card-name">${metodo.nome}</span>
      <span class="pm-card-value valor-restante"></span>
    </button>`
  ).join('');

  // Inicializa seleção e slider após renderizar
  initPaymentMethodsSelection();
  initPaymentMethodsSlider();

  // Atualiza os valores exibidos nos cards
  updateFooterPaymentCards();

  // Garantir que o overflow do slider é reavaliado após os cards estarem no DOM
  if (typeof scheduleRefreshPaymentMethodsOverflow === 'function') scheduleRefreshPaymentMethodsOverflow();

  console.log('✅ [FOOTER] Cards renderizados');
}

/**
 * Detecta se o track de métodos de pagamento tem overflow (quebra de linha)
 * e atualiza a visibilidade das setas + estado disabled.
 * Mostra setas sempre que qualquer card não estiver totalmente visível.
 */
function refreshPaymentMethodsOverflow() {
  const wrapper = document.getElementById('paymentMethodsWrapper');
  const track = document.getElementById('paymentMethodsTrack');
  const prevBtn = document.getElementById('pmArrowPrev');
  const nextBtn = document.getElementById('pmArrowNext');

  if (!wrapper || !track || !prevBtn || !nextBtn) return;

  const scrollW = track.scrollWidth;
  const clientW = track.clientWidth;
  const cards = track.querySelectorAll('.pm-card');

  // Overflow quando o conteúdo é mais largo que a área visível
  let hasOverflow = scrollW > clientW;

  // Deteção extra: último card parcialmente visível (quebra mínima / subpixel)
  if (!hasOverflow && cards.length > 0) {
    const tr = track.getBoundingClientRect();
    const last = cards[cards.length - 1];
    const lr = last.getBoundingClientRect();
    if (lr.right > tr.right - 1) hasOverflow = true;
  }

  wrapper.classList.toggle('has-overflow', hasOverflow);

  if (hasOverflow) {
    const scrollLeft = track.scrollLeft;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    prevBtn.disabled = scrollLeft <= 0;
    nextBtn.disabled = scrollLeft >= maxScroll - 1;
  }
}

/**
 * Agenda o refresh do overflow para depois do layout (evita medição antes do paint).
 */
function scheduleRefreshPaymentMethodsOverflow() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (typeof refreshPaymentMethodsOverflow === 'function') refreshPaymentMethodsOverflow();
    });
  });
}

/**
 * Inicializa o slider de métodos de pagamento
 * Setas só aparecem quando há overflow (quebra nos cards).
 */
function initPaymentMethodsSlider() {
  const wrapper = document.getElementById('paymentMethodsWrapper');
  const track = document.getElementById('paymentMethodsTrack');
  const prevBtn = document.getElementById('pmArrowPrev');
  const nextBtn = document.getElementById('pmArrowNext');

  if (!wrapper || !track || !prevBtn || !nextBtn) {
    console.warn('⚠️ Elementos do slider de pagamento não encontrados');
    return;
  }

  // Scroll por "página"
  function scrollByPage(direction) {
    const pageSize = Math.max(track.clientWidth * 0.8, 100);
    track.scrollBy({ left: direction * pageSize, behavior: 'smooth' });
  }

  prevBtn.addEventListener('click', () => scrollByPage(-1));
  nextBtn.addEventListener('click', () => scrollByPage(+1));
  track.addEventListener('scroll', () => refreshPaymentMethodsOverflow());

  // Verificação inicial após o layout estar estável
  scheduleRefreshPaymentMethodsOverflow();

  // Re-verificar no resize (debounce para evitar excesso de chamadas)
  let resizeTimeout;
  const onResize = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(scheduleRefreshPaymentMethodsOverflow, 120);
  };
  window.addEventListener('resize', onResize);
}

/**
 * Inicializa a seleção de métodos de pagamento
 */
function initPaymentMethodsSelection() {
  const cards = document.querySelectorAll('#paymentMethodsTrack .pm-card');

  cards.forEach(card => {
    card.addEventListener('click', function () {
      const method = this.dataset.method;
      selectFooterPaymentMethod(this, method);
    });
  });
}

/**
 * Seleciona um método de pagamento no footer
 * Lógica igual à do modal_checkout: salva valor anterior, carrega valor do método clicado
 */
function selectFooterPaymentMethod(card, method) {
  console.log('💳 [FOOTER] Clique detectado em:', method);

  const isCurrentMethod = selectedPaymentMethod === method;

  if (isCurrentMethod) {
    // Deselect current method
    console.log('❎ [FOOTER] Deselecionando método:', method);

    // ✅ CONFIRMA o valor antes de desselecionar
    confirmFooterPaymentValue();

    // Clear selection
    selectedPaymentMethod = null;
    footerCashAmount = '0';
    
    if (window.footerCashFormatter) {
      window.footerCashFormatter.setValue(0);
    }

  } else {
    // Select new method
    console.log('✅ [FOOTER] Selecionando método:', method);

    // ✅ CONFIRMA o valor do método anterior antes de trocar
    if (selectedPaymentMethod) {
      confirmFooterPaymentValue();
    }

    // 2️⃣ Set new current method
    selectedPaymentMethod = method;

    // 3️⃣ Load saved value for this method
    const valorSalvo = footerValoresPorMetodo[method] || 0;
    footerCashAmount = String(valorSalvo);
    
    if (window.footerCashFormatter) {
      window.footerCashFormatter.setValue(valorSalvo);
    }
    console.log(`📥 [FOOTER] Carregando ${method}: ${valorSalvo} Kz`);

    // 4️⃣ Auto-focus input
    setTimeout(() => {
      const cashInput = document.getElementById('footerCashInput');
      if (cashInput) {
        cashInput.focus();
        console.log('🎯 [FOOTER] Input focado!');
      }
    }, 100);
  }

  // ✅ Atualiza cards APÓS confirmar valores
  updateFooterPaymentCards();
}

/**
 * Atualiza os valores e estilos de todos os cards de pagamento
 */
function updateFooterPaymentCards() {
  const cards = document.querySelectorAll('#paymentMethodsTrack .pm-card');
  const totalAPagar = currentCartTotal || 0;

  // Calcula soma de todos os pagamentos
  let somaPagamentos = 0;
  footerPaymentMethods.forEach(metodo => {
    const slug = metodo.slug;
    if (slug === selectedPaymentMethod) {
      // Método atualmente sendo editado: usa o valor do input
      somaPagamentos += parseFloat(footerCashAmount) || 0;
    } else {
      // Outros métodos: usa o valor salvo
      somaPagamentos += parseFloat(footerValoresPorMetodo[slug]) || 0;
    }
  });

  const faltaPagar = totalAPagar - somaPagamentos;

  console.log(`💰 [FOOTER] Total: ${totalAPagar} | Pago: ${somaPagamentos} | Falta: ${faltaPagar}`);

  cards.forEach(card => {
    const method = card.getAttribute('data-method') || '';
    const span = card.querySelector('.valor-restante');
    const isCurrentMethod = selectedPaymentMethod === method;

    // Calcula o valor deste método
    let valorDoMetodo = 0;
    if (isCurrentMethod) {
      valorDoMetodo = parseFloat(footerCashAmount) || 0;
    } else {
      valorDoMetodo = parseFloat(footerValoresPorMetodo[method]) || 0;
    }

    // Card ativo se valor > 0
    const deveEstarAtivo = valorDoMetodo > 0;

    // Aplica ou remove classe 'active'
    if (deveEstarAtivo) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }

    // Aplica classe 'editing' se for o método atual
    if (isCurrentMethod) {
      card.classList.add('editing');
    } else {
      card.classList.remove('editing');
    }

    // Exibição do valor no span
    if (span) {
      if (isCurrentMethod && deveEstarAtivo) {
        // Método atual com valor: mostra em azul
        span.textContent = valorDoMetodo.toLocaleString('pt-AO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' Kz';
        span.className = 'pm-card-value valor-restante valor-positivo';

      } else if (deveEstarAtivo) {
        // Outro método com valor: mostra em verde
        span.textContent = valorDoMetodo.toLocaleString('pt-AO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' Kz';
        span.className = 'pm-card-value valor-restante valor-confirmado';

      } else if (faltaPagar > 0) {
        // Sem valor e falta pagar: mostra negativo em vermelho
        span.textContent = '−' + faltaPagar.toLocaleString('pt-AO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' Kz';
        span.className = 'pm-card-value valor-restante valor-negativo';

      } else {
        // Tudo pago ou carrinho vazio: limpa
        span.textContent = '';
        span.className = 'pm-card-value valor-restante';
      }
    }
  });

  // ✅ Calcula e exibe o STATUS DE PAGAMENTO (Troco / Falta / Completo)
  updatePaymentStatus(somaPagamentos, totalAPagar);
}

/**
 * Exibe o estado de "Valor em falta" após falha na validação de pagamento
 * Mostra um estado visual vermelho com a quantidade em falta
 */
function showPaymentMissing(valorEmFalta) {
  const statusElement = document.getElementById('paymentStatusElement');
  const statusLabel = document.getElementById('statusLabel');
  const statusValue = document.getElementById('statusValue');
  const statusIcon = document.getElementById('statusIcon');

  if (!statusElement || !statusLabel || !statusValue || !statusIcon) return;

  // Ícone de aviso
  const iconWarning = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m.93-6.93a9.001 9.001 0 1 1-1.86 0M9 16H3m6-8l-5.66 5.66m0 0l11.32 0" /><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>';
  const iconAlertIcon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

  // Limpa classes anteriores
  statusElement.classList.remove('state-change', 'state-complete');

  // Mostra o estado de valor em falta
  statusLabel.textContent = 'Valor em falta';
  statusValue.textContent = valorEmFalta.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' Kz';
  statusIcon.innerHTML = iconAlertIcon;
  statusElement.classList.add('visible', 'state-remaining');

  console.log(`🔴 [STATUS] Valor em falta exibido: ${valorEmFalta.toFixed(2)} Kz`);
}

/**
 * Atualiza a exibição do status de pagamento (3 estados)
 * - Troco (verde): pagou mais do que o total
 * - Valor em falta (vermelho): ainda falta pagar
 * - Pagamento completo (azul): pagou exatamente o total
 */
function updatePaymentStatus(somaPagamentos, totalAPagar) {
  const statusElement = document.getElementById('paymentStatusElement');
  const statusLabel = document.getElementById('statusLabel');
  const statusValue = document.getElementById('statusValue');
  const statusIcon = document.getElementById('statusIcon');

  if (!statusElement || !statusLabel || !statusValue || !statusIcon) return;

  // Ícones SVG
  const iconCheck = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
  const iconWarning = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

  // Remove classes de estado anteriores
  statusElement.classList.remove('visible', 'state-change', 'state-remaining', 'state-complete');

  // Se não há pagamentos ou carrinho vazio, esconde
  if (somaPagamentos === 0 || totalAPagar === 0) {
    return;
  }

  const diferenca = totalAPagar - somaPagamentos;

  if (diferenca > 0) {
    // 🔴 AINDA FALTA PAGAR -> OCULTO (Solicitação do usuário)
    // Se o valor inserido for menor que o total, não mostrar nada.
    statusElement.classList.remove('visible');
    console.log(`🔴 [STATUS] Falta pagar: ${diferenca.toFixed(2)} Kz (Oculto)`);

  } else if (diferenca < 0) {
    // 🟢 PAGOU A MAIS - TEM TROCO
    const troco = Math.abs(diferenca);
    statusLabel.textContent = 'Troco';
    statusValue.textContent = troco.toLocaleString('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' Kz';
    statusIcon.innerHTML = iconCheck;
    statusElement.classList.add('visible', 'state-change');
    console.log(`🟢 [STATUS] Troco: ${troco.toFixed(2)} Kz`);

  } else {
    // 🔵 PAGAMENTO EXATO - COMPLETO
    statusLabel.textContent = 'Pagamento completo';
    statusValue.textContent = '';
    statusIcon.innerHTML = iconCheck;
    statusElement.classList.add('visible', 'state-complete');
    console.log(`🔵 [STATUS] Pagamento completo`);
  }
}

/**
 * Retorna o método de pagamento selecionado
 */
function getSelectedPaymentMethod() {
  return selectedPaymentMethod;
}

/**
 * Reseta todos os valores dos métodos de pagamento
 * Chamado quando o carrinho é limpo
 */
function resetFooterPaymentValues() {
  console.log('🔄 [FOOTER] Resetando valores dos métodos de pagamento');

  // Limpa o objeto de valores por método
  for (const key in footerValoresPorMetodo) {
    if (footerValoresPorMetodo.hasOwnProperty(key)) {
      footerValoresPorMetodo[key] = 0;
    }
  }

  // Reseta o método selecionado
  selectedPaymentMethod = null;

  // Reseta o valor do input
  footerCashAmount = '0';

  // Atualiza o display do input
  const cashInput = document.getElementById('footerCashInput');
  if (cashInput) {
    cashInput.value = 'Kz 0,00';
  }

  // Atualiza os cards visuais
  updateFooterPaymentCards();

  console.log('✅ [FOOTER] Valores resetados');
}

/* ======================================================
   SEÇÃO: INPUT DO FOOTER - VALOR RECEBIDO DO CLIENTE
   ====================================================== */

/*
function setupFooterKeyboardListener() {
  const cashInput = document.getElementById('footerCashInput');
  if (!cashInput) {
    console.warn('⚠️ [FOOTER] Input footerCashInput não encontrado');
    return;
  }

  // Remove listeners anteriores se existirem
  cashInput.removeEventListener('keydown', handleFooterKeyboardInput);

  // Adiciona novo listener para keydown
  cashInput.addEventListener('keydown', handleFooterKeyboardInput);

  // Previne entrada direta - valor controlado pela nossa lógica
  cashInput.addEventListener('input', function (e) {
    e.preventDefault();
    updateFooterCashDisplay();
  });

  // Cursor sempre no final
  cashInput.addEventListener('click', function () {
    this.selectionStart = this.selectionEnd = this.value.length;
  });

  cashInput.addEventListener('focus', function () {
    this.selectionStart = this.selectionEnd = this.value.length;
  });

  console.log('✅ [FOOTER] Listener do teclado físico configurado');
}
*/

/*
function handleFooterKeyboardInput(e) {
  const key = e.key;

  // BACKSPACE: Remove último caractere
  if (key === 'Backspace') {
    e.preventDefault();
    backspaceFooterCash();
    return;
  }

  // DELETE: Limpa tudo
  if (key === 'Delete') {
    e.preventDefault();
    clearFooterCash();
    return;
  }

  // PONTO DECIMAL: Adiciona ponto (aceita . ou , ou Decimal do numpad)
  if (key === '.' || key === ',' || key === 'Decimal') {
    e.preventDefault();
    footerKeypadInput('.');
    return;
  }

  // NÚMEROS: Adiciona dígito
  if (/^[0-9]$/.test(key)) {
    e.preventDefault();
    footerKeypadInput(key);
    return;
  }
}
*/

function footerKeypadInput(value) {
  if (!selectedPaymentMethod) {
    console.warn('⚠️ [FOOTER] Nenhum método selecionado');
    return;
  }
  
  if (window.footerCashFormatter) {
    window.footerCashFormatter.keypadInput(value);
  }
}

function backspaceFooterCash() {
  if (!selectedPaymentMethod) {
    console.warn('⚠️ [FOOTER] Nenhum método selecionado');
    return;
  }
  
  if (window.footerCashFormatter) {
    window.footerCashFormatter.backspace();
  }
}

function clearFooterCash() {
  if (window.footerCashFormatter) {
    window.footerCashFormatter.clear();
  }
}

function updateFooterCashDisplay() {
  // This function now just triggers the formatter's display update
  if (window.footerCashFormatter) {
    window.footerCashFormatter._formatDisplay();
  }
}

/**
 * Retorna o valor numérico atual do footer
 */
function getFooterCashAmount() {
  return parseFloat(footerCashAmount) || 0;
}

/**
 * Inicializa os listeners dos botões do keypad
 */
function initFooterKeypad() {
  // ✅ Instancia formatter SEM atualizar cards em tempo real
  window.footerCashFormatter = new MonetaryFormatter('footerCashInput', {
    locale: 'pt-AO',
    currency: 'Kz',
    decimals: 2,
    onValueChange: (value) => {
      // ✅ Atualiza APENAS as variáveis globais (sem atualizar UI)
      footerCashAmount = String(value);
      
      if (selectedPaymentMethod) {
        footerValoresPorMetodo[selectedPaymentMethod] = value;
        console.log(`💾 [FOOTER] Salvando ${selectedPaymentMethod}: ${value} Kz (sem atualizar UI)`);
      }
      
      // ❌ NÃO CHAMA updateFooterPaymentCards() AQUI!
      // A atualização acontece apenas na confirmação (Enter ou Blur)
    }
  });
  
  // ✅ ATIVA o formatter (este input sempre está em modo edição)
  window.footerCashFormatter.enable();
  
  // ✅ NOVO: Adiciona listeners para confirmação
  const cashInput = document.getElementById('footerCashInput');
  if (cashInput) {
    // ✅ Confirma ao pressionar Enter
    cashInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmFooterPaymentValue();
      }
    });
    
    // ✅ Confirma ao clicar fora (blur)
    cashInput.addEventListener('blur', () => {
      confirmFooterPaymentValue();
    });
  }
  
  // Configura botões do keypad
  const keypadBtns = document.querySelectorAll('.keypad-btn');
  keypadBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const value = this.dataset.value;
      
      if (value === 'C') {
        clearFooterCash();
      } else if (value === 'back') {
        backspaceFooterCash();
      } else {
        footerKeypadInput(value);
      }
    });
  });
  
  console.log('✅ [FOOTER] Keypad inicializado com confirmação explícita');
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
  loadFooterPaymentMethods();
  initOrderSummarySlider();
  initFooterKeypad();
  if (typeof initBottomSheetSystem === 'function') initBottomSheetSystem();
});

/**
 * Preenche o input do método de pagamento atual com o valor exato do total
 * Chamada ao clicar no botão "Exact"
 */
function fillExactAmount() {
  // ✅ Verifica se há um método de pagamento selecionado
  if (!selectedPaymentMethod) {
    console.warn('⚠️ [EXACT] Nenhum método de pagamento selecionado');
    showAlert('warning', '⚠️ Selecione um Método', 'Por favor, selecione um método de pagamento primeiro');
    return;
  }

  // ✅ Verifica se há produtos no carrinho
  if (cart.size === 0 || currentCartTotal === 0) {
    console.warn('⚠️ [EXACT] Carrinho vazio');
    showAlert('warning', '⚠️ Carrinho Vazio', 'Adicione produtos ao carrinho primeiro');
    return;
  }

  // ✅ CORREÇÃO: Calcula o VALOR RESTANTE a pagar
  const totalAPagar = currentCartTotal;
  
  // Soma todos os pagamentos JÁ CONFIRMADOS (exceto o método atual)
  let somaPagamentos = 0;
  footerPaymentMethods.forEach(metodo => {
    const slug = metodo.slug;
    
    // Ignora o método atual (ainda está sendo editado)
    if (slug !== selectedPaymentMethod) {
      somaPagamentos += parseFloat(footerValoresPorMetodo[slug]) || 0;
    }
  });
  
  // Calcula quanto AINDA FALTA PAGAR
  const valorRestante = totalAPagar - somaPagamentos;
  
  // ✅ NOVO: Usa o VALOR RESTANTE em vez do total
  const exactAmount = valorRestante;

  console.log(`💰 [EXACT] Preenchendo ${exactAmount.toFixed(2)} Kz no método: ${selectedPaymentMethod}`);
  console.log(`📊 [EXACT] Total: ${totalAPagar} | Já pago: ${somaPagamentos} | Restante: ${valorRestante}`);

  // ✅ CORREÇÃO 1: Atualiza a variável global footerCashAmount
  footerCashAmount = String(exactAmount);
  
  // ✅ CORREÇÃO 2: Salva o valor no método de pagamento atual
  footerValoresPorMetodo[selectedPaymentMethod] = exactAmount;
  console.log(`💾 [EXACT] Salvando ${selectedPaymentMethod}: ${exactAmount} Kz`);

  // ✅ CORREÇÃO 3: Atualiza o formatter do footer com o valor exato
  if (window.footerCashFormatter) {
    window.footerCashFormatter.setValue(exactAmount);
  }

  // ✅ CORREÇÃO 4: Agora updateFooterPaymentCards() lerá os valores corretos
  updateFooterPaymentCards();

  // ✅ Feedback visual de sucesso
  showAlert('success', '✅ Valor Exato Inserido', `${exactAmount.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} Kz foi inserido no pagamento`);

  console.log('✅ [EXACT] Valor exato preenchido com sucesso');
}

/**
 * ✅ NOVA FUNÇÃO: Confirma valor digitado e atualiza cards
 * Chamada APENAS quando:
 * - Usuário pressiona Enter
 * - Usuário clica fora do input (blur)
 * - Usuário troca de método de pagamento
 */
function confirmFooterPaymentValue() {
  // Só confirma se há um método selecionado
  if (!selectedPaymentMethod) {
    console.log('⚠️ [CONFIRM] Nenhum método selecionado');
    return;
  }
  
  // Pega o valor atual do formatter
  const currentValue = window.footerCashFormatter ? 
    window.footerCashFormatter.getValue() : 
    parseFloat(footerCashAmount) || 0;
  
  console.log(`✅ [CONFIRM] Confirmando valor ${currentValue} para ${selectedPaymentMethod}`);
  
  // Salva o valor confirmado
  footerValoresPorMetodo[selectedPaymentMethod] = currentValue;
  footerCashAmount = String(currentValue);
  
  // ✅ AGORA SIM: Atualiza os cards com o valor confirmado
  updateFooterPaymentCards();
  
  console.log(`✅ [CONFIRM] Cards atualizados com valor confirmado`);
}

// ✅ Expõe a função globalmente
window.fillExactAmount = fillExactAmount;
window.confirmFooterPaymentValue = confirmFooterPaymentValue;

// Expor funções globalmente
window.getSelectedPaymentMethod = getSelectedPaymentMethod;
window.footerKeypadInput = footerKeypadInput;
window.backspaceFooterCash = backspaceFooterCash;
window.clearFooterCash = clearFooterCash;
window.updateFooterCashDisplay = updateFooterCashDisplay;
window.getFooterCashAmount = getFooterCashAmount;
window.updateFooterPaymentCards = updateFooterPaymentCards;
window.selectFooterPaymentMethod = selectFooterPaymentMethod;
window.resetFooterPaymentValues = resetFooterPaymentValues;
window.updatePaymentStatus = updatePaymentStatus;
window.refreshPaymentMethodsOverflow = refreshPaymentMethodsOverflow;
window.scheduleRefreshPaymentMethodsOverflow = scheduleRefreshPaymentMethodsOverflow;


