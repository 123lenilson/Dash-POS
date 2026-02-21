/* ================================================
   MÓDULO: Pedido Service
   Ficheiro: assets/js/services/pedido.service.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= NOVA FUNÇÃO: SYNC PARA API ======= */
/* ======= NOVA FUNÇÃO: SYNC PARA API - CORRIGIDA ======= */
function syncToAPI(id, qtyOverride = null, priceOverride = null) {
  const product = PRODUCTS.find(p => p.id === id);
  const isServico = product && product.ps && product.ps.toLowerCase() === 's';

  console.log("=== SYNC TO API ===");
  console.log("🔍 DEBUG syncToAPI:", {
    id: id,
    nome: product?.name,
    ps: product?.ps,
    isServico: isServico,
    impostos: product?.impostos,
    qtyOverride: qtyOverride,
    priceOverride: priceOverride
  });

  const payload = { id: id };

  if (qtyOverride !== null) {
    payload.qty = parseInt(qtyOverride);
  }

  if (priceOverride !== null) {
    payload.preco = parseFloat(priceOverride).toFixed(2);
  }

  if (product && product.impostos) {
    payload.impostos = parseInt(product.impostos);
  }

  console.log("Payload enviado:", JSON.stringify(payload, null, 2));
  console.log("==================");

  fetch("http://localhost/Dash-POS/api/pedido.php?acao=adicionar_pedido", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(response => {
      // ✅ CAPTURA O TEXTO RAW PRIMEIRO
      return response.text().then(text => {
        console.log("📥 Resposta RAW do servidor:", text);

        // ✅ Verifica se é HTML (erro PHP)
        if (text.trim().startsWith('<')) {
          console.error("❌ SERVIDOR RETORNOU HTML (erro PHP):");
          console.error(text.substring(0, 500)); // Primeiros 500 chars
          throw new Error('Servidor retornou HTML em vez de JSON. Verifique os logs do PHP.');
        }

        // ✅ Verifica se response foi OK
        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}: ${text}`);
        }

        // ✅ Tenta parsear JSON
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error("❌ Erro ao parsear JSON:", e);
          console.error("Texto recebido:", text);
          throw new Error('Resposta inválida do servidor (não é JSON válido)');
        }
      });
    })
    .then(data => {
      console.log("=== SYNC API RESPOSTA ===");
      console.log("Resposta parseada:", JSON.stringify(data, null, 2));
      console.log("Sucesso?", data.sucesso);

      if (!data.sucesso && data.erros && data.erros.length > 0) {
        const erro = data.erros[0];
        console.log("❌ ERRO DO BACKEND:", erro);

        if (erro.erro && erro.erro.includes('Stock insuficiente')) {
          console.log("⚠️ Stock insuficiente!");
          const productName = erro.nome || 'Produto';
          const available = erro.stock_disponivel || '0';
          const requested = erro.quantidade_pedida || '0';

          // Exibe alerta crítico com auto-dismiss de 3 segundos
          showCriticalAlert(`${productName}: Quantidade solicitada (${requested}) excede o stock disponível (${available}).`, 3000);
        } else {
          alert(erro.erro || data.mensagem || 'Erro desconhecido');
        }
      } else if (!data.sucesso) {
        console.warn("Falha geral na API:", data);
        alert(data.mensagem || 'Falha na sincronização');
      } else {
        console.log("✅ Sync sucesso!");
        loadCartFromAPI();
      }
    })
    .catch(error => {
      console.error("❌ Erro no fetch/sync:", error);
      console.error("Stack trace:", error.stack);

      // ✅ Mensagem mais informativa
      if (error.message.includes('HTML')) {
        alert('Erro no servidor PHP. Verifique o console para detalhes.');
      } else {
        alert('Erro de conexão com a API: ' + error.message);
      }
    });
}

/* ======= NOVA FUNÇÃO: CARREGAR CARRINHO DO DB ======= */
function loadCartFromAPI() {
  // ✅ NÃO recarrega o carrinho se o usuário estiver editando a quantidade
  if (modoEdicao) {
    console.log('⏸️ loadCartFromAPI bloqueado - usuário está editando');
    return;
  }

  // ✅ NÃO recarrega o carrinho durante a troca de cards
  if (isSwitchingCards) {
    console.log('⏸️ loadCartFromAPI bloqueado - trocando entre cards');
    return;
  }

  fetch("http://localhost/Dash-POS/api/pedido.php?acao=listar_pedido", {
    method: "GET",
    cache: "no-store"
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("=== LOAD CART FROM API ===");
      console.log("Resposta full:", JSON.stringify(data, null, 2));

      if (!data.sucesso) {
        console.warn("Falha no loadCarrinho:", data.mensagem);
        cart.clear();
        renderCart();
        if (typeof skeletonMarkCartReady === 'function') skeletonMarkCartReady();
        return;
      }

      const itensDB = data.itens || [];
      const resumoDB = data.resumo || {};  // ✅ NOVO: Pega resumo do backend

      if (PRODUCTS.length === 0) {
        console.log("PRODUCTS ainda vazio, retry em 100ms...");
        setTimeout(loadCartFromAPI, 100);
        return;
      }

      const newHash = itensDB.map(item => `${item.cardapio_id}:${item.qty}:${item.preco}`).join('|');

      if (newHash === lastCartHash) {
        console.log("Carrinho DB não mudou — skip update.");
        return;
      }
      lastCartHash = newHash;

      cart.clear();

      itensDB.forEach(item => {
        const id = parseInt(item.cardapio_id);
        const productFromDB = {
          id: id,
          name: item.produto_nome,
          price: parseFloat(item.preco),
          available: parseInt(item.stock_atual) > 0,
          cat: 'Todos Produtos',
          img: ''
        };

        const fullProduct = PRODUCTS.find(p => p.id === id);
        if (fullProduct) {
          productFromDB.cat = fullProduct.cat;
          productFromDB.img = fullProduct.img;
          console.log(`Item enriquecido com PRODUCTS: ${item.produto_nome} (ID: ${id})`);
        } else {
          productFromDB.img = placeholderIMG(item.produto_nome);
          console.log(`Item do JSON puro: ${item.produto_nome} (ID: ${id}, sem match em PRODUCTS)`);
        }

        cart.set(id, {
          product: productFromDB,
          qty: parseInt(item.qty),
          customPrice: parseFloat(item.preco)
        });
      });

      console.log(`Carrinho populado 100% do JSON: ${itensDB.length} itens. Map size: ${cart.size}`);

      // ✅ PASSA O RESUMO DO BACKEND PARA O RENDER
      renderCart(resumoDB);
      if (typeof skeletonMarkCartReady === 'function') skeletonMarkCartReady();
    })
    .catch(error => {
      console.error("Erro no loadCartFromAPI:", error);
      cart.clear();
      renderCart();
      if (typeof skeletonMarkCartReady === 'function') skeletonMarkCartReady();
    });
}
