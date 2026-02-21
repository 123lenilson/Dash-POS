/* ================================================
   MÓDULO: Products UI
   Ficheiro: assets/js/ui/products.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= CATEGORY SLIDER ======= */
function buildCategories(orderIn = null, countsIn = null, preserveScroll = false) {
  const counts = countsIn || (() => {
    const c = {};
    for (const p of PRODUCTS) { c[p.cat] = (c[p.cat] || 0) + 1; }
    c["Todos Produtos"] = PRODUCTS.length;
    return c;
  })();

  const order = orderIn || ["Todos Produtos", ...Object.keys(counts).filter(c => c !== "Todos Produtos").sort()];

  let oldScroll = 0;
  const oldViewport = categoryBar.querySelector('.cat-viewport');
  if (preserveScroll && oldViewport) {
    oldScroll = oldViewport.scrollLeft || 0;
  }

  categoryBar.innerHTML = `
    <div class="cat-slider">
      <button class="cat-arrow prev" aria-label="Anterior" type="button">
        <span aria-hidden="true">‹</span>
      </button>
      <div class="cat-viewport" id="catViewport">
        <div class="cat-track" id="catTrack">
          ${order.map(cat => `
            <button class="category ${cat === activeCategory ? 'is-active' : ''}" data-cat="${cat}">
              <span class="cat-name">${cat}</span>
              <span class="cat-count">${counts[cat] || 0}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <button class="cat-arrow next" aria-label="Próximo" type="button">
        <span aria-hidden="true">›</span>
      </button>
    </div>
  `;

  const viewport = categoryBar.querySelector('#catViewport');
  const track = categoryBar.querySelector('#catTrack');
  const prevBtn = categoryBar.querySelector('.cat-arrow.prev');
  const nextBtn = categoryBar.querySelector('.cat-arrow.next');

  track.addEventListener('click', (e) => {
    const btn = e.target.closest('.category');
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    track.querySelectorAll('.category').forEach(b => b.classList.toggle('is-active', b === btn));
    renderProducts();
  });

  function pageSize() { return Math.max(viewport.clientWidth * 0.85, 180); }
  function scrollByPage(dir) {
    viewport.scrollBy({ left: dir * pageSize(), behavior: 'smooth' });
  }
  prevBtn.addEventListener('click', () => scrollByPage(-1));
  nextBtn.addEventListener('click', () => scrollByPage(+1));

  function updateWheelBlock() {
    if (!isMobileView()) {
      if (!viewport._wheelBlocked) {
        viewport.addEventListener('wheel', wheelBlocker, { passive: false });
        viewport._wheelBlocked = true;
      }
      viewport.style.overflowX = 'hidden';
    } else {
      if (viewport._wheelBlocked) {
        viewport.removeEventListener('wheel', wheelBlocker, { passive: false });
        viewport._wheelBlocked = false;
      }
      viewport.style.overflowX = 'auto';
    }
  }
  function wheelBlocker(e) { e.preventDefault(); }

  function atStart() { return viewport.scrollLeft <= 2; }
  function atEnd() {
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth - 2);
    return viewport.scrollLeft >= maxScroll;
  }
  function updateArrows() {
    const mobile = isMobileView();
    prevBtn.style.display = mobile ? 'none' : '';
    nextBtn.style.display = mobile ? 'none' : '';
    if (!mobile) {
      prevBtn.disabled = atStart();
      nextBtn.disabled = atEnd();
      categoryBar.classList.toggle('has-left-shadow', !atStart());
      categoryBar.classList.toggle('has-right-shadow', !atEnd());
    } else {
      categoryBar.classList.remove('has-left-shadow', 'has-right-shadow');
    }
  }

  viewport.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', () => { updateWheelBlock(); updateArrows(); });

  if (preserveScroll && oldScroll && viewport) {
    requestAnimationFrame(() => {
      const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      viewport.scrollLeft = Math.min(oldScroll, max);
      updateArrows();
    });
  } else {
    updateWheelBlock();
    updateArrows();
  }
}

// Função para gerar cores suaves/pastéis para os placeholders
function getSoftColor(id) {
  const softColors = [
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
    'linear-gradient(135deg, #ffd1ff 0%, #ffddb7 100%)',
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)',
    'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)',
    'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
    'linear-gradient(135deg, #fab1a0 0%, #ff7675 100%)',
    'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)',
  ];
  return softColors[id % softColors.length];
}

function renderProducts() {
  let list;
  if (estaPesquisando) {
    list = searchResults;
  } else {
    list = PRODUCTS
      .filter(p => p.name !== undefined && p.name !== null);
  }

  list = list.filter(p => !estaPesquisando ? (activeCategory === "Todos Produtos" ? true : p.cat === activeCategory) : true);

  if (!estaPesquisando && searchTerm.length > 0) {
    list = list.filter(p => p.name.toLowerCase().includes(searchTerm));
  }

  if (list.length === 0) {
    productGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#8b8fa3; padding:20px;">Nenhum produto encontrado.</div>`;
    return;
  }

  productGrid.innerHTML = list.map(p => {
    const imgSrc = p.img || placeholderIMG(p.name);
    const isServico = p.ps && p.ps.toUpperCase() === 'S';

    let stockClass;
    let stockQuantity = p.stock || 0;

    if (isServico) {
      stockClass = 'service';
    } else if (stockQuantity > 6) {
      stockClass = 'available';
    } else if (stockQuantity >= 1 && stockQuantity <= 6) {
      stockClass = 'low';
    } else {
      stockClass = 'unavailable';
    }

    const stockText = isServico ? '' : `<span class="stock-quantity">${stockQuantity}</span>`;
    const placeholder = p.name.substring(0, 2).toUpperCase();
    const currentQty = cart.has(p.id) ? cart.get(p.id).qty : 1;
    const softColor = getSoftColor(p.id);
    const cardImageStyle = !p.img ? `style="background: ${softColor};"` : '';

    return `
      <article class="card" data-id="${p.id}">
        <div class="card-image" ${cardImageStyle}>
          ${p.img ? `<img alt="${p.name}" src="${imgSrc}">` : `<span class="card-image-placeholder">${placeholder}</span>`}
          <button class="card-quick-add" onclick="event.stopPropagation()">+</button>
          <div class="overlay-blur">
            <div class="quantity-controls">
              <button class="quantity-btn" data-action="minus" onclick="event.stopPropagation()">−</button>
              <span class="quantity-display">${currentQty}</span>
              <button class="quantity-btn" data-action="plus" onclick="event.stopPropagation()">+</button>
            </div>
          </div>
        </div>
        <div class="card-content">
          <div class="card-title">${p.name}</div>
          <div class="card-footer">
            <div class="card-price">${currency.format(p.price)}</div>
            <div class="stock-indicator">
              <span class="card-stock ${stockClass}"></span>
              ${stockText}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');

  productGrid.querySelectorAll('.card').forEach(card => {
    const id = +card.dataset.id;

    if (cart.has(id) && cart.get(id).qty > 0) {
      card.classList.add('is-selected');
      const qtyDisplay = card.querySelector('.quantity-display');
      if (qtyDisplay) qtyDisplay.textContent = cart.get(id).qty;
    } else {
      card.classList.remove('is-selected');
    }

    card.addEventListener('click', (e) => {
      if (e.target.closest('.quantity-btn') || e.target.closest('.card-quick-add')) {
        return;
      }
      addToCart(id, 1);
    });

    const quickAddBtn = card.querySelector('.card-quick-add');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', e => {
        e.stopPropagation();
        addToCart(id, 1);
      });
    }

    const plusBtns = card.querySelectorAll('[data-action="plus"]');
    const minusBtns = card.querySelectorAll('[data-action="minus"]');

    plusBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        addToCart(id, 1);
        const qtyDisplay = card.querySelector('.quantity-display');
        if (qtyDisplay && cart.has(id)) {
          qtyDisplay.textContent = cart.get(id).qty;
        }
      });
    });

    minusBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        addToCart(id, -1);
        const qtyDisplay = card.querySelector('.quantity-display');
        if (qtyDisplay && cart.has(id)) {
          qtyDisplay.textContent = cart.get(id).qty;
        }
      });
    });
  });
}

/* Atualiza a seleção visual dos cards */
function updateProductSelections() {
  const cards = productGrid.querySelectorAll('.card');
  cards.forEach(card => {
    const id = +card.dataset.id;
    if (cart.has(id) && cart.get(id).qty > 0) {
      card.classList.add('is-selected');
      const qtyDisplay = card.querySelector('.quantity-display');
      if (qtyDisplay) {
        qtyDisplay.textContent = cart.get(id).qty;
      }
    }
    else {
      card.classList.remove('is-selected');
      const qtyDisplay = card.querySelector('.quantity-display');
      if (qtyDisplay) {
        qtyDisplay.textContent = '1';
      }
    }
  });
}
