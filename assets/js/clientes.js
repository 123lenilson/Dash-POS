// clients.js - Módulo de gerenciamento de clientes
class ClientManager {
    constructor() {
        this.clients = []; // Lista de clientes carregada da API
        this.filteredClients = [];
        this.selectedClient = null;
        this.apiBaseUrl = '../api/cliente.php';
        this.init();
    }

    async init() {
        this.cacheDOM();
        this.bindEvents();
        // Carregar clientes de forma assíncrona sem bloquear
        this.loadClientsFromAPI().catch(error => {
            console.error('Erro ao carregar clientes:', error);
            // Se falhar, deixa a lista vazia mas não quebra a página
        });
    }

    cacheDOM() {
        // Elementos do painel de clientes
        this.clientListPanel = document.getElementById('clientListPanel');
        this.clientSearchInput = document.getElementById('clientSearchInput');
        this.selectedClientCard = document.getElementById('selectedClientCard');
        this.clientListSection = document.getElementById('clientListSection');
        this.clientFormSection = document.getElementById('clientFormSection');
        this.newClientForm = document.getElementById('newClientForm');
        this.clientSearchTitle = document.getElementById('clientSearchTitle');

        // Campos do formulário
        this.newClientNif = document.getElementById('newClientNif');
        this.newClientPhone = document.getElementById('newClientPhone');
        this.newClientEmail = document.getElementById('newClientEmail');
        this.newClientAddress = document.getElementById('newClientAddress');

        // Verificar se elementos essenciais existem
        if (!this.clientListPanel) {
            console.warn('⚠️ Painel de clientes não encontrado no DOM. O módulo de clientes pode não funcionar corretamente.');
        }
    }

    bindEvents() {
        // Busca em tempo real
        if (this.clientSearchInput) {
            this.clientSearchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Submit do formulário de novo cliente
        if (this.newClientForm) {
            this.newClientForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNewClient();
            });
        }
    }

    // Carregar clientes da API
    async loadClientsFromAPI() {
        try {
            // Timeout de 5 segundos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.apiBaseUrl}?acao=listar_cliente`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();

            if (data.sucesso) {
                this.clients = data.clientes || [];
                this.filteredClients = [...this.clients];
                this.renderClientList(this.filteredClients);
                console.log('✅ Clientes carregados:', this.clients.length);
            } else {
                console.error('Erro ao carregar clientes:', data.erro);
                this.renderClientList([]); // Renderiza lista vazia
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('⏱️ Timeout ao carregar clientes');
            } else {
                console.error('❌ Erro na requisição:', error);
            }
            this.renderClientList([]); // Renderiza lista vazia mesmo com erro
        }
    }

    // Buscar clientes (em tempo real ou quando digitar)
    async handleSearch(searchTerm) {
        const term = searchTerm.trim();

        // Se vazio, mostra lista e esconde formulário
        if (term === '') {
            this.showClientList();
            this.filteredClients = [...this.clients];
            this.renderClientList(this.filteredClients);
            return;
        }

        // Se digitando, verifica se já existe
        const localResults = this.clients.filter(client =>
            client.nome.toLowerCase().includes(term.toLowerCase()) ||
            (client.nif && client.nif.includes(term))
        );

        if (localResults.length > 0) {
            // Se encontrou localmente, mostra os resultados
            this.showClientList();
            this.filteredClients = localResults;
            this.renderClientList(localResults);
        } else {
            // Se não encontrou, mostra formulário para cadastrar
            this.showClientForm();
        }
    }

    // Renderizar lista de clientes
    renderClientList(clients) {
        if (!this.clientListPanel) {
            console.warn('⚠️ clientListPanel não encontrado no DOM');
            return;
        }

        if (!Array.isArray(clients)) {
            console.warn('⚠️ clients não é um array:', clients);
            clients = [];
        }

        if (clients.length === 0) {
            this.clientListPanel.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #999;">
                    Nenhum cliente encontrado
                </div>
            `;
            return;
        }

        // Limita para apenas 6 clientes
        const limitedClients = clients.slice(0, 6);
        const totalClients = clients.length;

        const clientsHTML = limitedClients.map(client => this.createClientCard(client)).join('');
        this.clientListPanel.innerHTML = clientsHTML;

        // Mostra mensagem se houver mais clientes
        if (totalClients > 6) {
            this.clientListPanel.innerHTML += `
                <div style="text-align: center; padding: 10px; color: #6b7280; font-size: 11px; font-style: italic;">
                    +${totalClients - 6} cliente(s) não exibido(s). Use a busca para encontrar.
                </div>
            `;
        }

        // Bind click events
        this.bindClientCardEvents();
    }

    // Criar card de cliente
    createClientCard(client) {
        return `
            <div class="client-card" data-client-id="${client.idcliente}">
                <div class="client-card-content">
                    <div class="client-card-name">${this.escapeHtml(client.nome)}</div>
                    <div class="client-card-details">
                        ${client.morada ? `<span>Endereço: ${this.escapeHtml(client.morada)}</span>` : '<span>Endereço: N/A</span>'}
                        |
                        ${client.telefone ? `<span>Telefone: ${this.escapeHtml(client.telefone)}</span>` : '<span>Telefone: N/A</span>'}
                        |
                        ${client.nif ? `<span>NIF: ${this.escapeHtml(client.nif)}</span>` : '<span>NIF: N/A</span>'}
                    </div>
                </div>
            </div>
        `;
    }

    // Bind eventos nos cards de clientes
    bindClientCardEvents() {
        const cards = this.clientListPanel.querySelectorAll('.client-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const clientId = parseInt(card.dataset.clientId);
                this.selectClientById(clientId);
            });
        });
    }

    // Selecionar cliente por ID
    selectClientById(clientId) {
        const client = this.clients.find(c => c.idcliente === clientId);
        if (client) {
            this.selectedClient = client;
            this.updateSelectedClientCard(client);

            // Fechar painel após seleção
            if (typeof closeClientPanel === 'function') {
                closeClientPanel();
            }

            // Emitir evento para outros componentes
            document.dispatchEvent(new CustomEvent('clientSelected', {
                detail: { client }
            }));
        }
    }

    // Atualizar card de cliente selecionado
    updateSelectedClientCard(client) {
        if (!this.selectedClientCard) return;

        this.selectedClientCard.innerHTML = `
            <div class="client-card-content">
                <div class="client-card-name">${this.escapeHtml(client.nome)}</div>
                <div class="client-card-details">
                    ${client.morada ? `<span>Endereço: ${this.escapeHtml(client.morada)}</span>` : '<span>Endereço: N/A</span>'}
                    |
                    ${client.telefone ? `<span>Telefone: ${this.escapeHtml(client.telefone)}</span>` : '<span>Telefone: N/A</span>'}
                    |
                    ${client.nif ? `<span>NIF: ${this.escapeHtml(client.nif)}</span>` : '<span>NIF: N/A</span>'}
                </div>
            </div>
            <div class="client-card-indicator">
                <i class="fa-solid fa-circle-check"></i>
            </div>
        `;

        // Atualizar também o botão no topo
        const topSelectedClient = document.getElementById('topSelectedClient');
        if (topSelectedClient) {
            topSelectedClient.textContent = client.nome;
        }
    }

    // Salvar novo cliente
    async saveNewClient() {
        const nome = this.clientSearchInput.value.trim();
        const nif = this.newClientNif.value.trim();
        const telefone = this.newClientPhone.value.trim();
        const email = this.newClientEmail.value.trim();
        const endereco = this.newClientAddress.value.trim();

        // Validação - Apenas o Nome é obrigatório
        if (!nome) {
            this.showError('O campo Nome é obrigatório');
            return;
        }

        // Validação básica de email (apenas se estiver preenchido)
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showError('Email inválido');
                return;
            }
        }

        try {
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    acao: 'verificar_cliente',
                    nome,
                    telefone: telefone || null,
                    email: email || null,
                    endereco: endereco || null,
                    nif: nif || null
                })
            });

            const data = await response.json();

            if (data.sucesso) {
                // Recarregar lista
                await this.loadClientsFromAPI();

                // Selecionar o cliente recém criado/encontrado
                this.selectClientById(data.id_cliente);

                // Limpar formulário
                this.clearForm();

                // Mostrar lista novamente
                this.showClientList();

                this.showSuccess('Cliente salvo com sucesso!');
            } else {
                this.showError(data.erro || 'Erro ao salvar cliente');
            }
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            this.showError('Erro ao conectar com o servidor');
        }
    }

    // Mostrar lista de clientes
    showClientList() {
        if (this.clientListSection) this.clientListSection.style.display = 'block';
        if (this.clientFormSection) this.clientFormSection.style.display = 'none';
        if (this.clientSearchTitle) this.clientSearchTitle.textContent = 'PROCURA POR CLIENTES AQUI';
    }

    // Mostrar formulário de cadastro
    showClientForm() {
        if (this.clientListSection) this.clientListSection.style.display = 'none';
        if (this.clientFormSection) this.clientFormSection.style.display = 'block';
        if (this.clientSearchTitle) this.clientSearchTitle.textContent = 'NOME DO CLIENTE';
    }

    // Limpar formulário
    clearForm() {
        if (this.clientSearchInput) this.clientSearchInput.value = '';
        if (this.newClientNif) this.newClientNif.value = '';
        if (this.newClientPhone) this.newClientPhone.value = '';
        if (this.newClientEmail) this.newClientEmail.value = '';
        if (this.newClientAddress) this.newClientAddress.value = '';
    }

    // Utilitários
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        console.error('❌ Erro:', message);
        // Usar sistema de alertas se disponível
        if (typeof showAlert === 'function') {
            showAlert('error', 'Erro', message, 3000);
        }
    }

    showSuccess(message) {
        console.log('✅ Sucesso:', message);
        // Usar sistema de alertas se disponível
        if (typeof showAlert === 'function') {
            showAlert('success', 'Sucesso', message, 3000);
        }
    }

    // Obter cliente selecionado (para outros componentes)
    getSelectedClient() {
        return this.selectedClient;
    }
}

// Inicialização singleton
let clientManager;
document.addEventListener('DOMContentLoaded', () => {
    clientManager = new ClientManager();
});

// Exportar para uso global
window.ClientManager = ClientManager;
window.getClientManager = () => clientManager;