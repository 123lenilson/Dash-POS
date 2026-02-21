/* ================================================
   MÓDULO: Modal UI
   Ficheiro: assets/js/ui/modal.ui.js
   Parte do sistema Dash-POS
   ================================================ */


// ============================================
// MODAL DE CONFIRMAÇÃO (Centralizado em app.js)
// ============================================

let confirmCallback = null;
let cancelCallback = null;

/**
 * Mostra a modal de confirmação dinâmica
 * @param {Object} config - Configuração da modal
 * @param {Function} onConfirm - Callback quando confirmar
 * @param {Function} onCancel - Callback quando cancelar (opcional)
 */
function showConfirmModal(config = {}, onConfirm = null, onCancel = null) {
    console.log('❓ [CONFIRM] Mostrando modal de confirmação dinâmica...', config);
    
    // Guarda os callbacks
    confirmCallback = onConfirm;
    cancelCallback = onCancel;
    
    // Configurações padrão
    const defaultConfig = {
        title: "Are you sure?",
        message: "This action can't be undone. Please confirm if you want to proceed.",
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "blue", // blue, red, green, yellow
        icon: "warning" // warning, success, error, info, question
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    
    // Atualiza o conteúdo da modal
    updateConfirmModalContent(finalConfig);
    
    // Mostra a modal
    const modal = document.getElementById('modal-confirm-dialog');
    const overlay = document.getElementById('overlay-confirm-dialog');
    const box = document.getElementById('box-confirm-dialog');
    
    if (!modal || !overlay || !box) {
        console.error('❌ [CONFIRM] Elementos da modal de confirmação não encontrados!');
        return;
    }
    
    modal.classList.remove('hidden');
    
    // Força reflow para garantir a animação
    void modal.offsetWidth;
    
    // Animações
    overlay.style.opacity = '1';
    box.style.transform = 'scale(1)';
    box.style.opacity = '1';
    
    // Foco no botão de cancelar para acessibilidade
    setTimeout(() => {
        const cancelBtn = document.getElementById('cancel-confirm-dialog');
        if (cancelBtn) cancelBtn.focus();
    }, 100);
}

/**
 * Atualiza o conteúdo da modal baseado na configuração
 */
function updateConfirmModalContent(config) {
    const { title, message, confirmText, cancelText, confirmColor, icon } = config;
    
    // Atualiza textos
    const titleElement = document.getElementById('title-confirm-dialog');
    const messageElement = document.getElementById('desc-confirm-dialog');
    const confirmBtn = document.getElementById('confirm-confirm-dialog');
    const cancelBtn = document.getElementById('cancel-confirm-dialog');
    const iconElement = document.getElementById('icon-confirm-dialog');
    
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    if (confirmBtn) confirmBtn.textContent = confirmText;
    if (cancelBtn) cancelBtn.textContent = cancelText;
    
    // Atualiza cor do botão de confirmar
    if (confirmBtn) {
        // Remove classes de cor anteriores
        confirmBtn.className = confirmBtn.className.replace(/bg-(blue|red|green|yellow|gray)-600/g, '');
        confirmBtn.className = confirmBtn.className.replace(/hover:bg-(blue|red|green|yellow|gray)-700/g, '');
        
        // Adiciona nova cor
        const colorMap = {
            blue: 'bg-blue-600 hover:bg-blue-700',
            red: 'bg-red-600 hover:bg-red-700',
            green: 'bg-green-600 hover:bg-green-700',
            yellow: 'bg-yellow-600 hover:bg-yellow-700',
            gray: 'bg-gray-600 hover:bg-gray-700'
        };
        
        const colorClasses = colorMap[confirmColor] || colorMap.blue;
        confirmBtn.className += ` ${colorClasses}`;
    }
    
    // Atualiza ícone (opcional - você pode expandir esta parte)
    if (iconElement) {
        console.log('🎨 [CONFIRM] Ícone selecionado:', icon);
    }
}

/**
 * Esconde a modal de confirmação
 */
function hideConfirmModal() {
    console.log('✅ [CONFIRM] Escondendo modal de confirmação...');
    
    const modal = document.getElementById('modal-confirm-dialog');
    const overlay = document.getElementById('overlay-confirm-dialog');
    const box = document.getElementById('box-confirm-dialog');
    
    if (!modal || !overlay || !box) return;
    
    // Animações de saída
    overlay.style.opacity = '0';
    box.style.transform = 'scale(0.9)';
    box.style.opacity = '0';
    
    // Esconde após animação
    setTimeout(() => {
        modal.classList.add('hidden');
        // Limpa os callbacks
        confirmCallback = null;
        cancelCallback = null;
    }, 300);
}

/**
 * Quando usuário confirma
 */
function onConfirmAction() {
    console.log('✅ [CONFIRM] Ação confirmada pelo usuário');
    if (typeof confirmCallback === 'function') {
        confirmCallback();
    }
    hideConfirmModal();
}

/**
 * Quando usuário cancela
 */
function onCancelAction() {
    console.log('❌ [CONFIRM] Ação cancelada pelo usuário');
    if (typeof cancelCallback === 'function') {
        cancelCallback();
    }
    hideConfirmModal();
}

/**
 * Inicializa os listeners dos botões da modal de confirmação
 * Liga: confirm -> onConfirmAction, cancel/close/overlay -> onCancelAction
 */
function initConfirmModalListeners() {
  const confirmBtn = document.getElementById('confirm-confirm-dialog');
  const cancelBtn = document.getElementById('cancel-confirm-dialog');
  const closeBtn = document.getElementById('close-confirm-dialog');
  const overlay = document.getElementById('overlay-confirm-dialog');
  const modal = document.getElementById('modal-confirm-dialog');

  if (confirmBtn) confirmBtn.addEventListener('click', onConfirmAction);
  if (cancelBtn) cancelBtn.addEventListener('click', onCancelAction);
  if (closeBtn) closeBtn.addEventListener('click', onCancelAction);
  if (overlay) overlay.addEventListener('click', onCancelAction);

  // Escape key closes modal
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && modal && !modal.classList.contains('hidden')) {
      onCancelAction();
    }
  });

  console.log('🔧 [CONFIRM] Listeners de confirmação inicializados');
}

// Tenta inicializar imediatamente quando o DOM estiver pronto
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initConfirmModalListeners, 10);
} else {
  document.addEventListener('DOMContentLoaded', initConfirmModalListeners);
}


window.showConfirmModal = showConfirmModal;
window.hideConfirmModal = hideConfirmModal;
window.onConfirmAction = onConfirmAction;
window.onCancelAction = onCancelAction;
window.updateConfirmModalContent = updateConfirmModalContent;

