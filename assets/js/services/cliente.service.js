/* ================================================
   MÓDULO: Cliente Service
   Ficheiro: assets/js/services/cliente.service.js
   Parte do sistema Dash-POS
   ================================================ */

/**
 * Busca o ID do cliente padrão "Consumidor Final" do banco de dados
 * Deve ser chamada na inicialização do app
 */
async function carregarClientePadrao() {
  console.log('🔍 Buscando cliente padrão (Consumidor Final)...');
  
  try {
    const response = await fetch('http://localhost/Dash-POS/api/cliente.php?acao=buscar_consumidor_final', {
      method: 'GET',
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.sucesso && data.cliente && data.cliente.idcliente) {
      idClientePadrao = parseInt(data.cliente.idcliente);
      console.log('✅ Cliente padrão carregado:', {
        id: idClientePadrao,
        nome: data.cliente.nome || 'Consumidor Final'
      });
    } else {
      console.error('❌ Cliente padrão não encontrado no banco');
      throw new Error('Cliente "Consumidor Final" não encontrado no sistema');
    }
    
  } catch (error) {
    console.error('❌ Erro ao carregar cliente padrão:', error);
    
    // Alerta crítico para o usuário
    if (typeof showCriticalAlert === 'function') {
      showCriticalAlert(
        'ERRO CRÍTICO: Cliente "Consumidor Final" não encontrado. ' +
        'Entre em contato com o suporte técnico.',
        0 // Não fecha automaticamente
      );
    }
    
    throw error;
  }
}

/**
 * Lista todos os clientes da API.
 * Retorna array de clientes ou [] em caso de erro/timeout.
 */
async function listarClientes() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('../api/cliente.php?acao=listar_cliente', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.sucesso) {
      console.log('✅ Clientes carregados:', (data.clientes || []).length);
      return data.clientes || [];
    } else {
      console.error('❌ Erro ao carregar clientes:', data.erro);
      return [];
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('⏱️ Timeout ao carregar clientes');
    } else {
      console.error('❌ Erro na requisição de clientes:', error);
    }
    return [];
  }
}

/**
 * Cria ou encontra um cliente na API.
 * @param {{ nome: string, telefone?: string|null, email?: string|null, endereco?: string|null, nif?: string|null }} dadosCliente
 * @returns {Promise<{ sucesso: boolean, id_cliente?: number, erro?: string }>}
 */
async function verificarOuCriarCliente(dadosCliente) {
  try {
    const response = await fetch('../api/cliente.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'verificar_cliente',
        nome: dadosCliente.nome,
        telefone: dadosCliente.telefone || null,
        email: dadosCliente.email || null,
        endereco: dadosCliente.endereco || null,
        nif: dadosCliente.nif || null
      })
    });

    const data = await response.json();
    return data; // { sucesso, id_cliente } ou { sucesso: false, erro }
  } catch (error) {
    console.error('❌ Erro ao verificar/criar cliente:', error);
    return { sucesso: false, erro: 'Erro ao conectar com o servidor' };
  }
}
