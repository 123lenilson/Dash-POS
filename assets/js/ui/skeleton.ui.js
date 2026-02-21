/* ================================================
   MÓDULO: Skeleton UI
   Ficheiro: assets/js/ui/skeleton.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/** Skeleton loading: marcar produtos como prontos e eventualmente esconder skeleton */
function skeletonMarkProductsReady() {
  window.__skeletonProductsReady = true;
  skeletonTryHide();
}

/** Skeleton loading: marcar carrinho como pronto e eventualmente esconder skeleton */
function skeletonMarkCartReady() {
  window.__skeletonCartReady = true;
  skeletonTryHide();
}

function skeletonTryHide() {
  if (!window.__skeletonProductsReady || !window.__skeletonCartReady) return;
  const el = document.getElementById('appSkeleton');
  if (!el) return;
  window.__skeletonHidden = true;
  el.classList.add('hidden');
  el.setAttribute('aria-hidden', 'true');
}
