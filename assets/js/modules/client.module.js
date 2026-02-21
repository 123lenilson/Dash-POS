/* ================================================
   MÓDULO: Client Module
   Ficheiro: assets/js/modules/client.module.js
   Responsabilidade: Estado e lógica de negócio de clientes
   Dash-POS
   ================================================ */

const ClientModule = (() => {
    // --- Estado interno ---
    let _clients = [];
    let _selectedClient = null;

    // --- Utilitário ---
    function _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Inicialização ---
    async function init() {
        const clients = await listarClientes(); // função do cliente.service.js
        _clients = clients;
        renderClientList(_clients); // função do client-panel.ui.js
    }

    // --- Filtrar clientes ---
    function filterClients(searchTerm) {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return [..._clients];
        return _clients.filter(c =>
            c.nome.toLowerCase().includes(term) ||
            (c.nif && c.nif.includes(term))
        );
    }

    // --- Selecionar cliente por ID ---
    function selectClientById(clientId) {
        const client = _clients.find(c => c.idcliente === clientId);
        if (!client) return;

        _selectedClient = client;

        // Atualizar UI do card selecionado
        updateSelectedClientCard(client); // função do client-panel.ui.js

        // Fechar painel (bridge definida no app.js ou invoice-type.ui.js)
        if (typeof closeClientPanel === 'function') {
            closeClientPanel();
        }

        // Bridge para o checkout
        if (typeof window.handleClientSelection === 'function') {
            window.handleClientSelection(client.idcliente, client.nome, {
                id: client.idcliente,
                nome: client.nome,
                telefone: client.telefone || 'N/A',
                email: client.email || '',
                endereco: client.morada || 'N/A',
                nif: client.nif || null
            });
        }

        // Evento para outros componentes
        document.dispatchEvent(new CustomEvent('clientSelected', {
            detail: { client }
        }));
    }

    // --- Guardar novo cliente ---
    async function saveNewClient(formData) {
        // formData: { nome, nif, telefone, email, endereco }

        // Validação
        if (!formData.nome || !formData.nome.trim()) {
            _showError('O campo Nome é obrigatório');
            return false;
        }
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                _showError('Email inválido');
                return false;
            }
        }

        const result = await verificarOuCriarCliente({
            nome: formData.nome.trim(),
            nif: formData.nif || null,
            telefone: formData.telefone || null,
            email: formData.email || null,
            endereco: formData.endereco || null
        });

        if (result.sucesso) {
            // Recarregar lista
            const clients = await listarClientes();
            _clients = clients;
            renderClientList(_clients); // client-panel.ui.js

            // Selecionar o cliente criado/encontrado
            selectClientById(result.id_cliente);

            // Sinalizar sucesso para a UI limpar o formulário e mostrar a lista
            _showSuccess('Cliente guardado com sucesso!');
            return true;
        } else {
            _showError(result.erro || 'Erro ao guardar cliente');
            return false;
        }
    }

    // --- Getter ---
    function getSelectedClient() {
        return _selectedClient;
    }

    function getAllClients() {
        return [..._clients];
    }

    function escapeHtml(text) {
        return _escapeHtml(text);
    }

    // --- Alertas (pontes para o sistema global) ---
    function _showError(message) {
        console.error('❌ Erro:', message);
        if (typeof showAlert === 'function') {
            showAlert('error', 'Erro', message, 3000);
        }
    }

    function _showSuccess(message) {
        console.log('✅ Sucesso:', message);
        if (typeof showAlert === 'function') {
            showAlert('success', 'Sucesso', message, 3000);
        }
    }

    return {
        init,
        filterClients,
        selectClientById,
        saveNewClient,
        getSelectedClient,
        getAllClients,
        escapeHtml
    };
})();

// Expor globalmente para compatibilidade com app.js e clientes.js legados
window.ClientModule = ClientModule;

// Manter compatibilidade com código que usa getClientManager()
window.getClientManager = () => ({
    getSelectedClient: ClientModule.getSelectedClient,
    searchByName: function () { /* pesquisa feita no painel (client-panel.ui.js) */ }
});
