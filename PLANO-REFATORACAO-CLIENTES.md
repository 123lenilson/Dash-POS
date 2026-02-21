# Plano de Refatoração — `clientes.js` → 3 ficheiros modulares

**Sistema:** Dash-POS  
**Data:** 2026-02-21  
**Objetivo:** Dividir o ficheiro monolítico `assets/js/clientes.js` em três ficheiros com responsabilidades bem separadas, seguindo a arquitetura modular já estabelecida no projeto, e fundir a lógica de fetch de clientes no `cliente.service.js` já existente.

---

## 1. Contexto e problema

O `clientes.js` atual mistura três responsabilidades distintas numa única classe `ClientManager`:

| Responsabilidade | Onde devia estar na arquitetura atual |
|---|---|
| Chamadas fetch à API de clientes | `services/` |
| Lógica de negócio (filtrar, selecionar, validar, gerir estado) | `modules/` |
| Manipulação do DOM (renderizar cards, mostrar/esconder secções, atualizar labels) | `ui/` |

Já existe `services/cliente.service.js` com a função `carregarClientePadrao()`, mas está isolado e não cobre as restantes chamadas de clientes. O objetivo é consolidar tudo de forma coerente com a arquitetura do projeto.

---

## 2. Ficheiros envolvidos

### Ficheiros a criar

| Ficheiro | Caminho completo |
|---|---|
| `client.module.js` | `assets/js/modules/client.module.js` |
| `client-panel.ui.js` | `assets/js/ui/client-panel.ui.js` |

### Ficheiros a modificar

| Ficheiro | Caminho completo | O que muda |
|---|---|---|
| `cliente.service.js` | `assets/js/services/cliente.service.js` | Adicionar funções `listarClientes()` e `verificarOuCriarCliente()` |
| `pages/index.php` | `pages/index.php` | Substituir `<script src="../assets/js/clientes.js">` pelos três novos scripts na ordem correta |

### Ficheiro a remover (após validação)

| Ficheiro | Ação |
|---|---|
| `assets/js/clientes.js` | Apagar após confirmar que tudo funciona |

---

## 3. Divisão detalhada do código

### 3.1 `services/cliente.service.js` — adicionar funções de fetch

Manter a função `carregarClientePadrao()` já existente **sem alterações**.  
Adicionar a seguir as duas funções abaixo.

---

**Função: `listarClientes()`**

Responsabilidade: Buscar todos os clientes da API.  
Retorna: `Array` de clientes, ou `[]` em caso de erro.

```javascript
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
```

---

**Função: `verificarOuCriarCliente(dadosCliente)`**

Responsabilidade: Criar ou encontrar um cliente via API.  
Parâmetro: objeto `{ nome, telefone, email, endereco, nif }` — apenas `nome` é obrigatório, os restantes podem ser `null`.  
Retorna: objeto `{ sucesso: true, id_cliente: number }` ou `{ sucesso: false, erro: string }`.

```javascript
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
```

---

### 3.2 `modules/client.module.js` — lógica de negócio

Responsabilidade: Gerir o estado dos clientes (lista, cliente selecionado), filtrar, selecionar e orquestrar operações entre o service e a UI. Sem manipulação direta de DOM (exceto disparar eventos e chamar funções de UI).

Conteúdo completo do ficheiro:

```javascript
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
    getSelectedClient: ClientModule.getSelectedClient
});
```

---

### 3.3 `ui/client-panel.ui.js` — DOM e renderização

Responsabilidade: Tudo o que toca no DOM do painel de clientes — renderizar listas, criar cards, mostrar/esconder secções, atualizar labels, e tratar eventos do painel.

Conteúdo completo do ficheiro:

```javascript
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
```

---

## 4. Ordem de carregamento em `pages/index.php`

### Remover
```html
<script src="../assets/js/clientes.js"></script>
```

### Substituir por (na mesma posição, nesta ordem)
```html
<script src="../assets/js/services/cliente.service.js"></script>
<script src="../assets/js/modules/client.module.js"></script>
<script src="../assets/js/ui/client-panel.ui.js"></script>
```

**Motivo da ordem:** `cliente.service.js` expõe as funções de fetch que `client.module.js` chama diretamente (sem import/export); `client.module.js` expõe `ClientModule` que `client-panel.ui.js` usa; e `client-panel.ui.js` expõe `initClientPanel` que o `app.js` chama no `DOMContentLoaded`.

---

## 5. Alterações no `app.js`

O `app.js` atual inicializa o `ClientManager` indiretamente via `DOMContentLoaded` no `clientes.js`. Com a refatoração, o init passa a ser explícito.

### Localizar no `app.js`
Qualquer referência a `ClientManager`, `clientManager`, ou ao evento `DOMContentLoaded` que inicialize o painel de clientes.

### Substituir por
No bloco `DOMContentLoaded` do `app.js`, adicionar:
```javascript
if (typeof initClientPanel === 'function') {
    initClientPanel();
}
```

Se o `app.js` usa `window.getClientManager()` para aceder ao cliente selecionado, essa chamada continua a funcionar — o `client.module.js` mantém o `window.getClientManager()` como alias de compatibilidade.

---

## 6. Verificação de compatibilidade

| Referência no código existente | Continua a funcionar? | Como |
|---|---|---|
| `window.getClientManager()` | ✅ Sim | Alias definido em `client.module.js` |
| `window.getClientManager().getSelectedClient()` | ✅ Sim | Alias delega para `ClientModule.getSelectedClient()` |
| `window.handleClientSelection(id, nome, dados)` | ✅ Sim | Bridge continua a ser chamada em `ClientModule.selectClientById()` |
| Evento `clientSelected` no `document` | ✅ Sim | Continua a ser disparado em `ClientModule.selectClientById()` |
| `closeClientPanel()` | ✅ Sim | Continua a ser chamada em `ClientModule.selectClientById()` |
| `showAlert()` usada no módulo | ✅ Sim | Bridge mantida em `ClientModule._showError()` / `_showSuccess()` |
| `window.ClientManager` (classe) | ⚠️ Não exposta diretamente | Se algum código externo fizer `new ClientManager()`, deve ser atualizado para usar `ClientModule` ou `initClientPanel()` |

---

## 7. Resumo do que o agente deve executar

1. **Abrir** `assets/js/services/cliente.service.js` e **adicionar** as funções `listarClientes()` e `verificarOuCriarCliente()` conforme a secção 3.1, após a função `carregarClientePadrao()` existente.

2. **Criar** o ficheiro `assets/js/modules/client.module.js` com o conteúdo exato da secção 3.2.

3. **Criar** o ficheiro `assets/js/ui/client-panel.ui.js` com o conteúdo exato da secção 3.3.

4. **Abrir** `pages/index.php`, **localizar** a linha com `clientes.js` e **substituí-la** pelas três linhas de script da secção 4, na ordem indicada.

5. **Abrir** `app.js`, **localizar** o bloco `DOMContentLoaded` e **adicionar** a chamada `initClientPanel()` conforme a secção 5.

6. **Testar** o sistema: abrir o POS, verificar que a lista de clientes carrega, que a pesquisa filtra corretamente, que selecionar um cliente atualiza os labels e fecha o painel, e que guardar um novo cliente funciona.

7. Após validação com sucesso: **apagar** `assets/js/clientes.js`.

---

*Plano elaborado com base na leitura completa de `clientes.js` e `cliente.service.js` — Dash-POS.*
