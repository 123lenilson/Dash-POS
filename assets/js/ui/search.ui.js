/* ================================================
   MÓDULO: Search UI
   Ficheiro: assets/js/ui/search.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= SEARCH ======= */
// ✅ MODIFICADO: Busca no servidor com debounce
/* ======= SEARCH ======= */
// ✅ MODIFICADO: Busca no servidor com debounce
/* ======= SEARCH COM DUPLA FUNÇÃO (PESQUISA + CÓDIGO DE BARRAS) ======= */
const debouncedSearch = debounce(async () => {
  searchTerm = searchInput.value.trim();

  // Se estiver vazio, reseta
  if (searchTerm.length === 0) {
    estaPesquisando = false;
    searchResults = [];
    renderProducts();
    return;
  }

  // ✅ DETECTA SE É CÓDIGO DE BARRAS (apenas números, comprimento específico)
  const isLikelyBarcode = /^\d+$/.test(searchTerm) &&
    searchTerm.length >= BARCODE_CONFIG.minLength &&
    searchTerm.length <= BARCODE_CONFIG.maxLength;

  if (isLikelyBarcode) {
    console.log('🔍 Campo de pesquisa detectou código de barras:', searchTerm);
    // Não faz pesquisa imediata - espera Enter ou timeout
    return;
  }

  // Se não for código de barras, faz pesquisa normal
  estaPesquisando = true;
  activeCategory = "Todos Produtos";
  try {
    const response = await fetch(`${window.location.origin}/Dash-POS/api/produtos.php?acao=pesquisar_prod&termo=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("❌ Resposta inválida da API (não é array):", data);
      searchResults = [];
    } else {
      searchResults = data.map((item, index) => {
        const idproduto = item.idproduto || item.id || item.ID || 0;
        const descricao = item.descricao || item.nome || item.name || item.produto || '';
        const venda = item.venda || item.preco || item.price || item.valor || 0;
        const preco_com_imposto = item.preco_com_imposto || venda;
        const qtd = item.qtd || item.quantidade || item.stock || item.estoque || 0;
        const ps = (item.ps || item.tipo || 'P').toUpperCase();
        const categoria = item.categoria_nome || item.categoria || item.cat || 'Todos Produtos';

        const isServico = ps === 'S';
        const stock = parseInt(qtd) || 0;

        return {
          id: parseInt(idproduto) || 0,
          cat: categoria,
          name: descricao || "Produto sem nome",
          price: parseFloat(preco_com_imposto) || 0,
          preco_base: parseFloat(venda) || 0,
          impostos: parseInt(item.impostos) || null,
          imposto_percentagem: parseFloat(item.imposto_percentagem) || 0,
          imposto_descricao: item.imposto_descricao || '',
          available: isServico ? true : (stock > 0),
          ps: ps,
          barra: item.barra || null,
          stock: stock,
          img: ""
        };
      });
    }
    renderProducts();
  } catch (error) {
    console.error("💥 Erro na busca:", error);
    searchResults = [];
    renderProducts();
  }
}, 300);

/* ======= LISTENER PARA ENTER NO CAMPO DE PESQUISA ======= */
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const term = searchInput.value.trim();

    if (term.length === 0) {
      return; // Ignora Enter em campo vazio
    }

    // ✅ VERIFICA SE É CÓDIGO DE BARRAS
    const isLikelyBarcode = /^\d+$/.test(term) &&
      term.length >= BARCODE_CONFIG.minLength &&
      term.length <= BARCODE_CONFIG.maxLength;

    if (isLikelyBarcode) {
      e.preventDefault();
      console.log('🎯 Enter pressionado com código de barras:', term);

      // 🔒 VERIFICA SE O LEITOR ESTÁ ATIVO
      if (!isBarcodeEnabled) {
        console.log('🚫 Leitor bloqueado - Ignorando código:', term);
        showAlert('warning', '🔒 Leitor Bloqueado', 'Ative o leitor para escanear produtos', 2000);

        // Limpa o campo
        searchInput.value = '';
        searchTerm = '';
        estaPesquisando = false;
        searchResults = [];
        renderProducts();
        return;
      }

      // Processa como código de barras
      processBarcodeFromSearch(term);

    } else {
      // Se não for código de barras, faz pesquisa normal com Enter
      console.log('🔍 Enter pressionado com termo de pesquisa:', term);
      debouncedSearch();
    }
  }
});

/* ======= FUNÇÃO PARA PROCESSAR CÓDIGO DE BARRAS DO CAMPO DE PESQUISA ======= */
async function processBarcodeFromSearch(barcode) {
  if (isProcessingBarcode) {
    console.log('⚠️ Já está processando um código');
    return;
  }

  isProcessingBarcode = true;
  barcodeStats.total++;

  // Feedback visual no wrapper
  const searchWrapper = document.querySelector('.search-wrapper');
  if (searchWrapper) {
    searchWrapper.classList.add('barcode-mode');
  }

  console.log('🔍 Processando código de barras do campo de pesquisa:', barcode);

  try {
    // ✅ BUSCA DIRETO NO ARRAY PRODUCTS
    const produto = PRODUCTS.find(p => p.barra && p.barra.trim() === barcode.trim());

    if (produto) {
      console.log('✅ Produto encontrado via código de barras:', produto.name);

      // ✅ ADICIONA AO CARRINHO
      addToCart(produto.id, 1);

      // Feedback de sucesso
      showAlert('success', '✅ Adicionado', `${produto.name} foi adicionado ao pedido via código de barras`);

      // Feedback visual de sucesso
      if (searchWrapper) {
        searchWrapper.classList.remove('barcode-mode');
        searchWrapper.classList.add('barcode-success');
        setTimeout(() => searchWrapper.classList.remove('barcode-success'), 1000);
      }

      // Atualiza estatísticas
      barcodeStats.success++;
      barcodeStats.history.unshift({
        barcode,
        produto: produto.name,
        timestamp: new Date().toISOString(),
        success: true,
        source: 'search_field'
      });

    } else {
      // Produto não encontrado
      console.warn('❌ Código não encontrado:', barcode);
      showAlert('error', '❌ Não Encontrado', 'Código de barras não cadastrado no sistema');

      // Feedback visual de erro
      if (searchWrapper) {
        searchWrapper.classList.remove('barcode-mode');
        searchWrapper.classList.add('barcode-error');
        setTimeout(() => searchWrapper.classList.remove('barcode-error'), 1000);
      }

      barcodeStats.errors++;
      barcodeStats.history.unshift({
        barcode,
        produto: null,
        timestamp: new Date().toISOString(),
        success: false,
        error: 'Produto não encontrado',
        source: 'search_field'
      });
    }

  } catch (error) {
    console.error('💥 Erro ao processar código de barras:', error);
    showAlert('error', '❌ Erro', 'Erro ao processar o código de barras');
    barcodeStats.errors++;

    // Feedback visual de erro
    if (searchWrapper) {
      searchWrapper.classList.remove('barcode-mode');
      searchWrapper.classList.add('barcode-error');
      setTimeout(() => searchWrapper.classList.remove('barcode-error'), 1000);
    }

  } finally {
    // ✅ SEMPRE LIMPA O CAMPO E RESETA A PESQUISA
    searchInput.value = '';
    searchTerm = '';
    estaPesquisando = false;
    searchResults = [];
    renderProducts();

    isProcessingBarcode = false;
  }
}

/* ======= ATUALIZAR FUNÇÃO clearSearch ======= */
searchInput.addEventListener('input', debouncedSearch);

clearSearch.addEventListener('click', () => {
  searchInput.value = "";
  searchTerm = "";
  estaPesquisando = false;
  searchResults = [];
  searchInput.focus();
  renderProducts();
  var inner = document.getElementById('searchBarInner');
  if (inner && inner.parentElement && inner.parentElement.id === 'headerSearchSlot') {
    var w = document.querySelector('.search-wrapper');
    if (w) { w.classList.add('search-wrapper--collapsed'); w.classList.remove('search-wrapper--expanded'); }
  }
});

/* ======= HEADER SEARCH MOBILE (≤905px): expandir/colapsar ao clicar no ícone ======= */
(function setupHeaderSearchToggle() {
  function isHeaderSearchMode() {
    var inner = document.getElementById('searchBarInner');
    return inner && inner.parentElement && inner.parentElement.id === 'headerSearchSlot';
  }
  document.addEventListener('click', function (e) {
    if (!isHeaderSearchMode()) return;
    var wrapper = document.querySelector('.search-wrapper');
    if (!wrapper) return;
    var slot = document.getElementById('headerSearchSlot');
    if (e.target.closest('#headerSearchSlot') && (e.target.closest('.search-icon-left') || (wrapper.classList.contains('search-wrapper--collapsed') && e.target.closest('.search-wrapper')))) {
      wrapper.classList.remove('search-wrapper--collapsed');
      wrapper.classList.add('search-wrapper--expanded');
      searchInput.focus();
      e.preventDefault();
    } else if (!e.target.closest('#headerSearchSlot')) {
      wrapper.classList.remove('search-wrapper--expanded');
      wrapper.classList.add('search-wrapper--collapsed');
    }
  });
})();

