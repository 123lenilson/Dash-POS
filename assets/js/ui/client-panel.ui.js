/* ================================================
   UI: Client Panel
   Ficheiro: assets/js/ui/client-panel.ui.js
   Responsabilidade: DOM e eventos do painel de clientes
   Dash-POS
   ================================================ */

// --- Cache de elementos DOM ---
let _dom = {};

function _cacheClientPanelDOM() {
    _dom = {
        clientListPanel:    document.getElementById('clientListPanel'),
        clientSearchInput:  document.getElementById('clientSearchInput'),
        selectedClientCard: document.getElementById('selectedClientCard'),
        clientListSection:  document.getElementById('clientListSection'),
        clientFormSection:  document.getElementById('clientFormSection'),
        newClientForm:      document.getElementById('newClientForm'),
        clientSearchTitle:  document.getElementById('clientSearchTitle'),
        newClientNif:       document.getElementById('newClientNif'),
        newClientPhone:     document.getElementById('newClientPhone'),
        newClientEmail:     document.getElementById('newClientEmail'),
        newClientAddress:   document.getElementById('newClientAddress')
    };

    if (!_dom.clientListPanel) {
        console.warn('⚠️ clientListPanel não encontrado no DOM. O painel de clientes pode não funcionar.');
    }
}

// --- Renderizar lista de clientes ---
function renderClientList(clients) {
    if (!_dom.clientListPanel) return;

    if (!Array.isArray(clients) || clients.length === 0) {
        _dom.clientListPanel.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #999;">
                Nenhum cliente encontrado
            </div>
        `;
        return;
    }

    const limited = clients.slice(0, 6);
    const total = clients.length;

    _dom.clientListPanel.innerHTML =
        limited.map(client => _createClientCardHTML(client)).join('');

    if (total > 6) {
        _dom.clientListPanel.innerHTML += `
            <div style="text-align: center; padding: 10px; color: #6b7280; font-size: 11px; font-style: italic;">
                +${total - 6} cliente(s) não exibido(s). Use a busca para encontrar.
            </div>
        `;
    }

    _bindClientCardEvents();
}

// --- Criar HTML de um card de cliente ---
function _createClientCardHTML(client) {
    const esc = ClientModule.escapeHtml;
    return `
        <div class="client-card" data-client-id="${client.idcliente}">
            <div class="client-card-content">
                <div class="client-card-name">${esc(client.nome)}</div>
                <div class="client-card-details">
                    ${client.morada ? `<span>Endereço: ${esc(client.morada)}</span>` : '<span>Endereço: N/A</span>'}
                    |
                    ${client.telefone ? `<span>Telefone: ${esc(client.telefone)}</span>` : '<span>Telefone: N/A</span>'}
                    |
                    ${client.nif ? `<span>NIF: ${esc(client.nif)}</span>` : '<span>NIF: N/A</span>'}
                </div>
            </div>
        </div>
    `;
}

// --- Bind eventos nos cards ---
function _bindClientCardEvents() {
    if (!_dom.clientListPanel) return;
    const cards = _dom.clientListPanel.querySelectorAll('.client-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const clientId = parseInt(card.dataset.clientId);
            ClientModule.selectClientById(clientId); // delega ao module
        });
    });
}

// --- Atualizar card do cliente selecionado ---
function updateSelectedClientCard(client) {
    if (!_dom.selectedClientCard) return;

    const esc = ClientModule.escapeHtml;
    _dom.selectedClientCard.innerHTML = `
        <div class="client-card-content">
            <div class="client-card-name">${esc(client.nome)}</div>
            <div class="client-card-details">
                ${client.morada ? `<span>Endereço: ${esc(client.morada)}</span>` : '<span>Endereço: N/A</span>'}
                |
                ${client.telefone ? `<span>Telefone: ${esc(client.telefone)}</span>` : '<span>Telefone: N/A</span>'}
                |
                ${client.nif ? `<span>NIF: ${esc(client.nif)}</span>` : '<span>NIF: N/A</span>'}
            </div>
        </div>
        <div class="client-card-indicator">
            <i class="fa-solid fa-circle-check"></i>
        </div>
    `;

    // Atualizar labels de topo e sticky menu
    const topSelectedClient = document.getElementById('topSelectedClient');
    if (topSelectedClient) topSelectedClient.textContent = client.nome;

    const stickyClientLabel = document.getElementById('stickyClientLabel');
    if (stickyClientLabel) stickyClientLabel.textContent = client.nome;
}

// --- Mostrar lista / formulário ---
function showClientList() {
    if (_dom.clientListSection) _dom.clientListSection.style.display = 'block';
    if (_dom.clientFormSection) _dom.clientFormSection.style.display = 'none';
    if (_dom.clientSearchTitle) _dom.clientSearchTitle.textContent = 'PROCURA POR CLIENTES AQUI';
}

function showClientForm() {
    if (_dom.clientListSection) _dom.clientListSection.style.display = 'none';
    if (_dom.clientFormSection) _dom.clientFormSection.style.display = 'block';
    if (_dom.clientSearchTitle) _dom.clientSearchTitle.textContent = 'NOME DO CLIENTE';
}

// --- Limpar formulário ---
function clearClientForm() {
    if (_dom.clientSearchInput) _dom.clientSearchInput.value = '';
    if (_dom.newClientNif)      _dom.newClientNif.value = '';
    if (_dom.newClientPhone)    _dom.newClientPhone.value = '';
    if (_dom.newClientEmail)    _dom.newClientEmail.value = '';
    if (_dom.newClientAddress)  _dom.newClientAddress.value = '';
}

// --- Recolher dados do formulário ---
function _getFormData() {
    return {
        nome:     _dom.clientSearchInput ? _dom.clientSearchInput.value.trim() : '',
        nif:      _dom.newClientNif      ? _dom.newClientNif.value.trim()      : '',
        telefone: _dom.newClientPhone    ? _dom.newClientPhone.value.trim()    : '',
        email:    _dom.newClientEmail    ? _dom.newClientEmail.value.trim()    : '',
        endereco: _dom.newClientAddress  ? _dom.newClientAddress.value.trim()  : ''
    };
}

// --- Bind eventos do painel (search + form) ---
function _bindPanelEvents() {
    // Pesquisa em tempo real
    if (_dom.clientSearchInput) {
        _dom.clientSearchInput.addEventListener('input', (e) => {
            const term = e.target.value;
            if (!term.trim()) {
                showClientList();
                renderClientList(ClientModule.getAllClients());
                return;
            }
            const results = ClientModule.filterClients(term);
            if (results.length > 0) {
                showClientList();
                renderClientList(results);
            } else {
                showClientForm();
            }
        });
    }

    // Submit do formulário de novo cliente
    if (_dom.newClientForm) {
        _dom.newClientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = _getFormData();
            const success = await ClientModule.saveNewClient(formData);
            if (success) {
                clearClientForm();
                showClientList();
            }
        });
    }
}

// --- Inicialização pública ---
function initClientPanel() {
    _cacheClientPanelDOM();
    _bindPanelEvents();
    ClientModule.init(); // carrega clientes e renderiza lista
}

// Expor funções necessárias por outros módulos (ex: renderização após loadClientsFromAPI)
window.renderClientList = renderClientList;
window.updateSelectedClientCard = updateSelectedClientCard;
window.initClientPanel = initClientPanel;
