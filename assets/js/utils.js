/* ================================================
   MÓDULO: Utils (Utilitários puros)
   Ficheiro: assets/js/utils.js
   Parte do sistema Dash-POS
   ================================================ */

/**
 * Connects any input to monetary formatting
 * @param {string} inputId - Input ID
 * @param {object} options - Formatting options
 * @returns {MonetaryFormatter} Formatter instance
 */
function connectMonetaryInput(inputId, options = {}) {
  const formatter = new MonetaryFormatter(inputId, options);
  window[`formatter_${inputId}`] = formatter;
  return formatter;
}

/* ======= UTIL: DEBOUNCE ======= */
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

/* ======= UTIL ======= */
function nowFancy() {
  const d = new Date();
  return d.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) +
    " • " + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}
function placeholderIMG(name) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const hue = (name.length * 37) % 360;
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='hsl(${hue},74%,92%)' />
      <stop offset='100%' stop-color='hsl(${(hue + 40) % 360},74%,85%)' />
    </linearGradient></defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, -apple-system, Segoe UI, Roboto' font-weight='700' font-size='64' fill='hsl(${hue},35%,28%)'>${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function isMobileView() {
  return window.matchMedia && window.matchMedia('(max-width:905px)').matches;
}
