/* ================================================
   MÓDULO: Alerts UI
   Ficheiro: assets/js/ui/alerts.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/** Remove ícone/emoji no início do texto para evitar duplicar o ícone do próprio alerta */
function stripLeadingIcon(str) {
  if (typeof str !== 'string') return str;
  let s = str.trimStart();
  if (!s.length) return str;
  const first = s[0];
  if (!/\p{L}/u.test(first) && !/\p{N}/u.test(first)) {
    s = s.slice(1);
    if (s.length && (s[0] === '\uFE0F' || /\p{M}/u.test(s[0]))) s = s.slice(1);
    s = s.trimStart();
  }
  return s;
}

// Função para criar e exibir alertas
function showAlert(type, title, message, duration = 4000) {
  title = stripLeadingIcon(String(title));
  message = stripLeadingIcon(String(message));
  console.log(`🔔 showAlert chamado: [${type}] ${title} - ${message}`);
  const container = document.getElementById("alertContainer");
  if (!container) {
    console.warn("❌ Alert container não encontrado!");
    return;
  }
  console.log('✅ Alert container encontrado, criando alerta...');

  const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Ícones para cada tipo
  const icons = {
    success: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
    `,
    error: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    `,
    warning: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>
    `,
    info: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    `
  };

  const alert = document.createElement("div");
  alert.id = alertId;
  alert.className = `alert ${type} alert-enter`;

  alert.innerHTML = `
    <div class="alert-content">
      <div class="alert-icon">
        ${icons[type] || icons.info}
      </div>
      <div class="alert-text">
        <span class="alert-title">${title}</span>
        <span class="alert-message">${message}</span>
      </div>
    </div>
    <button class="alert-close" onclick="closeAlert('${alertId}')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  `;

  container.appendChild(alert);

  // Auto-remove após duração
  setTimeout(() => {
    closeAlert(alertId);
  }, duration);
}

function closeAlert(alertId) {
  const alert = document.getElementById(alertId);
  if (alert) {
    alert.classList.remove('alert-enter');
    alert.classList.add('alert-exit');

    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 300);
  }
}

/**
 * Exibe um alerta crítico no topo da tela
 * Usado para situações críticas como: perda de conexão, erros graves, alertas de segurança
 *
 * @param {string} message - Mensagem do alerta crítico
 * @param {number} duration - Duração em ms (0 = sem auto-dismiss, alerta fica até usuário fechar)
 */
function showCriticalAlert(message, duration = 0) {
  console.log(`🚨 showCriticalAlert: ${message}`);

  // Cria o container se não existir
  let container = document.getElementById("criticalAlertContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "criticalAlertContainer";
    document.body.appendChild(container);
  }

  const alertId = `critical-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Ícone de alerta crítico (círculo com exclamação)
  const icon = `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke-width="2" stroke-linecap="round"></circle>
      <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"></line>
      <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none"></circle>
    </svg>
  `;

  // Ícone de fechar
  const closeIcon = `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  `;

  const alert = document.createElement("div");
  alert.id = alertId;
  alert.className = "alert-critical alert-critical-enter";
  alert.setAttribute("role", "alert");
  alert.setAttribute("aria-live", "assertive");

  alert.innerHTML = `
    <div class="alert-critical-content">
      <div class="alert-critical-icon">
        ${icon}
      </div>
      <span class="alert-critical-message">${message}</span>
    </div>
    <button class="alert-critical-close" onclick="closeCriticalAlert('${alertId}')" aria-label="Fechar alerta">
      ${closeIcon}
    </button>
  `;

  container.appendChild(alert);

  // Auto-remove após duração (se definida)
  if (duration > 0) {
    setTimeout(() => {
      closeCriticalAlert(alertId);
    }, duration);
  }
}

/**
 * Fecha um alerta crítico
 * @param {string} alertId - ID do alerta a ser fechado
 */
function closeCriticalAlert(alertId) {
  const alert = document.getElementById(alertId);
  if (alert) {
    alert.classList.remove('alert-critical-enter');
    alert.classList.add('alert-critical-exit');

    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 300);
  }
}
