/* ============================================
   MODAL DE CHECKOUT - modal_checkout.js
   VERSÃO COM INPUT REAL FUNCIONANDO Atual
   ============================================ */

// Estado global da modal
let paymentMethods = [];  
let checkoutCurrentStep = 1;
let checkoutCashAmount = '0';
let checkoutSelectedPaymentMethod = null;
let checkoutCustomerData = {};
let valoresPagamentos = {dinheiro: 0, cartao: 0, transferencia: 0};
let metodoAtual = null;
let checkoutPaymentData = {
    total: 0,
    subtotal: 0,
    tax: 0,
    discount: 0,
    method: '',
    customerPays: 0,
    change: 0,
    pagamentos: []
};
let valoresPorMetodo = {}; // ✅ MUDANÇA: de const para let

// Função para obter o formato de fatura selecionado
function getInvoiceFormat() {
    // Verificar primeiro os radio buttons ativos
    const selectedRadio = document.querySelector('input[name="invoiceFormat"]:checked');
    if (selectedRadio) {
        return selectedRadio.value;
    }
    
    // Se não encontrar, verificar no localStorage
    const savedFormat = localStorage.getItem('invoiceFormat');
    if (savedFormat) {
        return savedFormat;
    }
    
    // Default para A4
    return 'A4';
}

// ============================================
// FUNÇÕES PRINCIPAIS DA MODAL
// ============================================

async function openCheckoutModal() {
    console.log('🚀 [MODAL] Tentando abrir modal...');
    console.log('📊 [CART] Tamanho do carrinho:', cart.size);
    
    const modal = document.getElementById('checkoutModalOverlay');
    if (!modal) {
        console.error('❌ [MODAL] Modal NÃO encontrada no DOM!');
        alert('ERRO: Modal não encontrada!');
        return;
    }
    console.log('✅ [MODAL] Modal encontrada:', modal);

    if (cart.size === 0) {
        showAlert("warning", "Carruinho vázio", "Adicione produtos ao carrinho.");
        return;
    }
    
    // ✅ FECHAR O CARRINHO MOBILE ANTES DE ABRIR A MODAL
    // Verifica se estamos em mobile e fecha o carrinho drawer
    if (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) {
        const cartOverlay = document.getElementById('cartOverlay');
        if (cartOverlay && cartOverlay.classList.contains('is-open')) {
            console.log('🔒 [MODAL] Fechando carrinho mobile antes de abrir modal...');
            cartOverlay.classList.remove('is-open');
            cartOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }
    
    await loadInvoiceAssets();

    console.log('📝 [MODAL] Populando resumo...');
    await populateCheckoutOrderSummary();

    console.log('🎬 [MODAL] Aplicando estilos...');
    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
    
    console.log('📍 [MODAL] Classes aplicadas:', modal.className);
    
    checkoutCurrentStep = 1;
    resetValoresPagamentos();
    
    // 🔹 NOVA LÓGICA: Atualizar interface com base no tipo de documento
    updateModalInterfaceByDocumentType();
    
    updateCheckoutStepDisplay();
    
    // Carrega clientes
    loadAndRenderCustomers();
    
    // Garante que os métodos de pagamento são carregados antes de renderizar
    try {
        await loadAndRenderPaymentMethods();
        console.log('✅ [MODAL] Métodos de pagamento carregados:', paymentMethods);
    } catch (error) {
        console.error('❌ [MODAL] Erro ao carregar métodos:', error);
    }
    
    console.log('✅ [MODAL] Modal deve estar visível agora!');
}

// NO modal_checkout.js
async function loadInvoiceAssets() {
    console.log('📦 [ASSETS] Carregando assets da fatura...');
    
    return new Promise((resolve) => {
        let cssLoaded = false;
        let css80Loaded = false;
        let jsLoaded = false;
        let js80Loaded = false;
        let qrcodeLoaded = false;

        // ✅ VERIFICAR SE JÁ ESTÃO CARREGADOS
        if (window.populateInvoiceA4 && window.populateInvoice80 && 
            document.querySelector('#fatura-css') && document.querySelector('#fatura80-css') && 
            typeof QRCode !== 'undefined') {
            console.log('✅ [ASSETS] Todos os assets já carregados');
            resolve();
            return;
        }

        // 1. CARREGAR CSS
        if (!document.querySelector('#fatura-css')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '../assets/css/fatura.css';
            link.id = 'fatura-css';
            link.onload = () => {
                cssLoaded = true;
                console.log('✅ [CSS] CSS da fatura carregado');
                if (css80Loaded && jsLoaded && js80Loaded && qrcodeLoaded) resolve();
            };
            link.onerror = () => {
                console.error('❌ [CSS] Erro ao carregar CSS da fatura');
                cssLoaded = true; // Continuar mesmo com erro
                if (css80Loaded && jsLoaded && js80Loaded && qrcodeLoaded) resolve();
            };
            document.head.appendChild(link);
        } else {
            cssLoaded = true;
        }

        // 2. CARREGAR CSS 80MM
        if (!document.querySelector('#fatura80-css')) {
            const link80 = document.createElement('link');
            link80.rel = 'stylesheet';
            link80.href = '../assets/css/fatura80.css';
            link80.id = 'fatura80-css';
            link80.onload = () => {
                css80Loaded = true;
                console.log('✅ [CSS80] CSS da fatura 80mm carregado');
                if (cssLoaded && jsLoaded && js80Loaded && qrcodeLoaded) resolve();
            };
            link80.onerror = () => {
                console.error('❌ [CSS80] Erro ao carregar CSS da fatura 80mm');
                css80Loaded = true; // Continuar mesmo com erro
                if (cssLoaded && jsLoaded && js80Loaded && qrcodeLoaded) resolve();
            };
            document.head.appendChild(link80);
        } else {
            css80Loaded = true;
        }

        // 3. CARREGAR QRCode.js
        if (typeof QRCode === 'undefined') {
            const qrScript = document.createElement('script');
            qrScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
            qrScript.onload = () => {
                qrcodeLoaded = true;
                console.log('✅ [QRCODE] QRCode.js carregado');
                if (cssLoaded && css80Loaded && jsLoaded && js80Loaded) resolve();
            };
            qrScript.onerror = () => {
                console.error('❌ [QRCODE] Erro ao carregar QRCode.js');
                qrcodeLoaded = true; // Continuar mesmo com erro
                if (cssLoaded && css80Loaded && jsLoaded && js80Loaded) resolve();
            };
            document.head.appendChild(qrScript);
        } else {
            qrcodeLoaded = true;
        }

        // 4. CARREGAR JS DA FATURA
        if (!window.populateInvoiceA4) {
            const script = document.createElement('script');
            script.src = '../assets/js/fatura.js';
            script.onload = () => {
                jsLoaded = true;
                console.log('✅ [JS] JS da fatura carregado');
                if (cssLoaded && css80Loaded && js80Loaded && qrcodeLoaded) resolve();
            };
            script.onerror = () => {
                console.error('❌ [JS] Erro ao carregar JS da fatura');
                jsLoaded = true; // Continuar mesmo com erro
                if (cssLoaded && css80Loaded && js80Loaded && qrcodeLoaded) resolve();
            };
            document.head.appendChild(script);
        } else {
            jsLoaded = true;
        }

        // 5. CARREGAR JS 80MM
        if (!window.populateInvoice80) {
            const script80 = document.createElement('script');
            script80.src = '../assets/js/fatura80.js';
            script80.onload = () => {
                js80Loaded = true;
                console.log('✅ [JS80] JS da fatura 80mm carregado');
                if (cssLoaded && css80Loaded && jsLoaded && qrcodeLoaded) resolve();
            };
            script80.onerror = () => {
                console.error('❌ [JS80] Erro ao carregar JS da fatura 80mm');
                js80Loaded = true; // Continuar mesmo com erro
                if (cssLoaded && css80Loaded && jsLoaded && qrcodeLoaded) resolve();
            };
            document.head.appendChild(script80);
        } else {
            js80Loaded = true;
        }
    });
}

function closeCheckoutModal() {
    console.log('🔒 [MODAL] Fechando modal...');
    console.log('🔍 [MODAL] Verificando se o elemento checkoutModalOverlay existe...');
    const modal = document.getElementById('checkoutModalOverlay');
    if (!modal) {
        console.error('❌ [MODAL] Elemento checkoutModalOverlay não encontrado!');
        return;
    }
    console.log('✅ [MODAL] Elemento checkoutModalOverlay encontrado:', modal);

    modal.classList.remove('active');
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
    document.body.style.overflow = '';
    
    resetCheckoutModal();
    console.log('✅ [MODAL] Modal fechada');
}

function updateModalInterfaceByDocumentType() {
    // Verifica se tipoDocumentoAtual existe no escopo global
    const tipoDoc = (typeof tipoDocumentoAtual !== 'undefined') ? tipoDocumentoAtual : 'fatura-recibo';
    
    console.log('📝 [INTERFACE] Tipo de documento atual:', tipoDoc);
    
    // Elementos da interface - mais específicos para evitar afetar o cabeçalho
    // Seleciona especificamente o progress stepper, não o header
    const progressStepper = document.querySelector('#checkoutModalOverlay .px-6.py-6.border-b.border-gray-200');
    const continueButton = document.querySelector('#checkoutStepContent1 button'); // Botão "Continue to Payment"
    const paymentStepText = document.querySelector('#checkoutStep2 .text-xs'); // Texto "Payment" do Step 2
    
    if (tipoDoc === 'fatura-proforma' || tipoDoc === 'fatura' || tipoDoc === 'orcamento') {
        // 🔹 Fatura Pró-Forma, Fatura ou Orçamento: Esconder progresso e modificar botão
        console.log(`🟢 [INTERFACE] Configurando interface para ${tipoDoc === 'orcamento' ? 'Orçamento' : tipoDoc === 'fatura-proforma' ? 'Fatura Pró-Forma' : 'Fatura'}`);
        
        if (progressStepper) {
            progressStepper.style.display = 'none';
            console.log('✅ [INTERFACE] Progress stepper escondido');
        }
        
        if (continueButton) {
            continueButton.textContent = 'Continuar';
            // ✅ REMOVIDO: Não mudar a cor do botão, manter azul padrão
            console.log('✅ [INTERFACE] Texto do botão alterado para "Continuar"');
        }
        
        // ✅ Ocultar apenas o texto "Payment" do Step 2, mantendo "Informações do Cliente"
        if (paymentStepText) {
            paymentStepText.textContent = '';
            console.log('✅ [INTERFACE] Texto "Payment" ocultado');
        }
        
    } else {
        // 🟡 Fatura Recibo: Manter interface padrão
        console.log('🟡 [INTERFACE] Configurando interface para Fatura Recibo');
        
        if (progressStepper) {
            progressStepper.style.display = 'block';
            console.log('✅ [INTERFACE] Progress stepper visível');
        }
        
        if (continueButton) {
            continueButton.textContent = 'Continuar para Pagamento';
            // ✅ REMOVIDO: Não mudar a cor do botão, manter azul padrão
            console.log('✅ [INTERFACE] Texto do botão restaurado para "Continuar para Pagamento"');
        }
        
        // ✅ Restaurar o texto "Payment" do Step 2
        if (paymentStepText) {
            paymentStepText.textContent = 'Pagamento';
            console.log('✅ [INTERFACE] Texto "Payment" restaurado');
        }
    }
}

function resetCheckoutModal() {
    checkoutCurrentStep = 1;
    checkoutCashAmount = '0';
    checkoutSelectedPaymentMethod = null;
    checkoutCustomerData = {};
    resetValoresPagamentos();
    
    updateCheckoutStepDisplay();
    updatePaymentCards();
    updateCheckoutOrderSummaryPayment();
    
    const form = document.getElementById('checkoutCustomerForm');
    if (form) form.reset();
    
    // Reseta o INPUT real
    const cashInput = document.getElementById('checkoutCashInput');
    if (cashInput) cashInput.value = '0';
    
    const interfacePagamento = document.getElementById('checkoutCashPayment');
    if (interfacePagamento) {
        interfacePagamento.style.display = 'block';
        interfacePagamento.style.opacity = '1';
    }
    
    // ✅ RESET DO BOTÃO PAY NOW
    const btnPayNow = document.getElementById('btnPayNow');
    if (btnPayNow) {
        btnPayNow.disabled = false;  // Sempre habilitado
        btnPayNow.textContent = 'Pay Now';  // Reseta o texto
        console.log('✅ [RESET] Botão Pay Now resetado');
    }
    
    // ✅ RESET DO BOTÃO CONTINUE
    const continueButton = document.querySelector('#checkoutStepContent1 button');
    if (continueButton) {
        continueButton.disabled = false;  // Sempre habilitado
        // Verifica o tipo de documento atual para definir o texto correto
        const tipoDoc = (typeof tipoDocumentoAtual !== 'undefined') ? tipoDocumentoAtual : 'fatura-recibo';
        if (tipoDoc === 'fatura-proforma' || tipoDoc === 'fatura' || tipoDoc === 'orcamento') {
            continueButton.textContent = 'Continuar';
        } else {
            continueButton.textContent = 'Continuar para Pagamento';
        }
        console.log('✅ [RESET] Botão Continue resetado');
    }
}

function resetValoresPagamentos() {
    initializePaymentValues(); // Reutiliza a nova função para reset dinâmico
    metodoAtual = null;
    checkoutCashAmount = '0';
    
    // ✅ Garante que o display é atualizado
    updateCheckoutCashDisplay();
}

// ============================================
// NAVEGAÇÃO ENTRE STEPS
// ============================================
// Adicionar esta função no modal_checkout.js

// ============================================
// NAVEGAÇÃO ENTRE STEPS
// ============================================
// Adicionar esta função no modal_checkout.js
function abrirImpressaoFatura() {
    console.log('🖨️ [PRINT] Abrindo diálogo de impressão...');
    
    // ✅ PASSO 1: Criar um container dedicado para impressão
    let printContainer = document.getElementById('print-container');
    if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        printContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 99999;
            overflow: auto;
            padding: 20px;
        `;
        document.body.appendChild(printContainer);
    }
    
    // ✅ PASSO 2: Limpar e preparar o container
    printContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <button onclick="fecharImpressao()" style="padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Fechar Preview
            </button>
            <button onclick="imprimirFatura()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                🖨️ Imprimir
            </button>
        </div>
        <div id="container-principal-print"></div>
    `;
    
    // ✅ PASSO 3: Mostrar o container
    printContainer.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // ✅ PASSO 4: Renderizar a fatura no container de impressão
    setTimeout(() => {
        // Temporariamente redirecionar a renderização para o container de impressão
        const originalContainer = document.getElementById('container-principal');
        const printContentContainer = document.getElementById('container-principal-print');
        
        if (printContentContainer) {
            // Forçar a renderização da fatura
            if (typeof renderizarFaturaComPaginas === 'function') {
                // Criar um container temporário para a renderização
                const tempContainer = document.createElement('div');
                tempContainer.id = 'container-principal';
                document.body.appendChild(tempContainer);
                
                // Renderizar a fatura
                renderizarFaturaComPaginas();
                
                // Mover o conteúdo para o container de impressão
                const faturaContent = tempContainer.innerHTML;
                printContentContainer.innerHTML = faturaContent;
                
                // Remover o container temporário
                tempContainer.remove();
                
                console.log('✅ [PRINT] Fatura renderizada no container de impressão');
                
                // ✅ AGUARDAR QR CODES serem gerados
                setTimeout(() => {
                    console.log('🔍 [PRINT] QR Codes devem estar prontos');
                }, 500);
                
            } else {
                console.error('❌ [PRINT] renderizarFaturaComPaginas não encontrada');
                printContentContainer.innerHTML = '<div style="text-align: center; padding: 50px; color: red;">Erro: Não foi possível gerar a fatura</div>';
            }
        }
    }, 100);
}

// ✅ Função para imprimir a fatura
function imprimirFatura() {
    console.log('🖨️ [PRINT] Iniciando impressão...');
    
    // ✅ PASSO 1: Esconder botões durante a impressão
    const buttons = document.querySelectorAll('#print-container button');
    buttons.forEach(btn => btn.style.display = 'none');
    
    // ✅ PASSO 2: Aplicar estilos de impressão diretamente
    const printContent = document.getElementById('container-principal-print');
    if (printContent) {
        // Aplicar estilos de impressão diretamente nos elementos
        const faturaElements = printContent.querySelectorAll('.interface-fatura');
        faturaElements.forEach(fatura => {
            fatura.style.width = '210mm';
            fatura.style.height = '297mm';
            fatura.style.margin = '0';
            fatura.style.padding = '12px';
            fatura.style.boxShadow = 'none';
            fatura.style.borderRadius = '0';
        });
    }
    
    // ✅ PASSO 3: Chamar o print nativo
    setTimeout(() => {
        window.print();
    }, 500);
}

// ✅ Função para fechar o preview
function fecharImpressao() {
    const printContainer = document.getElementById('print-container');
    if (printContainer) {
        printContainer.style.display = 'none';
        document.body.style.overflow = '';
    }
    closeCheckoutModal(); // Fechar a modal também
}

// ✅ CORREÇÃO PARA O STEP 2 → IMPRESSÃO
// ✅ MUDANÇA: Torna async e adiciona verificação remota no Step 1
async function checkoutNextStep() {
    console.log('➡️ [STEP] ==================== ATENÇÃO: checkoutNextStep CHAMADA ====================');
    console.log('➡️ [STEP] checkoutCurrentStep atual:', checkoutCurrentStep);
    console.log('➡️ [STEP] Avançando do step', checkoutCurrentStep, 'para', checkoutCurrentStep + 1);
    
    if (checkoutCurrentStep === 1) {
        if (!validateCheckoutCustomerForm()) return;
        
        // ✅ PROTEÇÃO: Desabilitar botão para evitar cliques duplicados
        const continueButton = document.querySelector('#checkoutStepContent1 button');
        if (continueButton) {
            if (continueButton.disabled) {
                console.log('⚠️ [STEP1] Botão já desabilitado - requisição em andamento');
                return;  // Já está processando
            }
            continueButton.disabled = true;
            continueButton.textContent = 'Processando...';
        }
        
        // ✅ NOVA: Coletar dados para envio ao backend
        const dadosEnvio = {
            acao: 'verificar_cliente',
            nome: document.getElementById('checkoutFullName')?.value.trim(),
            telefone: (document.getElementById('checkoutCountryCode')?.value || '+244') + ' ' + document.getElementById('checkoutPhone')?.value.trim(),
            email: document.getElementById('checkoutEmail')?.value.trim(),
            endereco: document.getElementById('checkoutAddress')?.value.trim(),
            nif: document.getElementById('checkoutNif')?.value.trim() || null  // Opcional
        };
        
        console.log('📤 [API] Enviando dados para verificação:', dadosEnvio);
        
        try {
            // ✅ NOVA: Fetch POST para backend
            const response = await fetch('http://localhost/Dash-POS/API/cliente.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosEnvio)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📥 [API] Resposta do backend:', data);
            
            if (data.sucesso && data.id_cliente) {
                // ✅ NOVA: Sucesso - salva com ID do backend (sobrescreve se veio da tabela)
                saveCheckoutCustomerData(data.id_cliente);
                await populateCheckoutOrderSummary();
                
                // 🔹 NOVA LÓGICA: Verifica o tipo de documento selecionado
                console.log('📝 [TIPO DOC] Verificando tipo de documento...', typeof tipoDocumentoAtual !== 'undefined' ? tipoDocumentoAtual : 'Não definido');
                
                // Verifica se tipoDocumentoAtual existe no escopo global
                const tipoDoc = (typeof tipoDocumentoAtual !== 'undefined') ? tipoDocumentoAtual : 'fatura-recibo';
                
                if (tipoDoc === 'fatura-proforma' || tipoDoc === 'orcamento') {
                    console.log(`🟢 [${tipoDoc === 'orcamento' ? 'ORCAMENTO' : 'PROFORMA'}] Tipo de documento é ${tipoDoc === 'orcamento' ? 'Orçamento' : 'Fatura Pró-Forma'} - Processando...`);
                    
                    // ✅ FATURA PRÓ-FORMA / ORÇAMENTO: NÃO avança para Step 2, faz fetch e renderiza
                    const dadosFaturaProforma = {
                        acao: 'factura_proforma_orcamento',
                        id_cliente: data.id_cliente,
                        tipo_documento: tipoDoc === 'orcamento' ? 'orcamento' : 'fatura-proforma'
                    };
                    
                    console.log('📤 [PROFORMA API] Enviando para vender.php:', dadosFaturaProforma);
                    
                    try {
                        const responseProforma = await fetch('http://localhost/Dash-POS/api/vender.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(dadosFaturaProforma)
                        });
                        
                        if (!responseProforma.ok) {
                            throw new Error(`HTTP ${responseProforma.status}: ${responseProforma.statusText}`);
                        }
                        
                        const resultadoProforma = await responseProforma.json();
                        console.log(`📥 [${tipoDoc === 'orcamento' ? 'ORCAMENTO' : 'PROFORMA'} API] Resposta:`, resultadoProforma);
                        
                        if (resultadoProforma.sucesso) {
                            console.log(`✅ [${tipoDoc === 'orcamento' ? 'ORCAMENTO' : 'PROFORMA'}] ${tipoDoc === 'orcamento' ? 'Orçamento' : 'Fatura Pró-Forma'} gerado com sucesso!`);
                            
                            // ✅ Valida funções
                            if (typeof window.renderizarFaturaComDadosBackend !== 'function') {
                                console.error('❌ renderizarFaturaComDadosBackend não existe!');
                                alert('Erro: Sistema de fatura não carregado. Recarregue a página.');
                                // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                                if (continueButton) {
                                    continueButton.disabled = false;
                                    continueButton.textContent = 'Continuar';
                                }
                                return;
                            }
                            
                            // ✅ RENDERIZAR A FATURA PRÓ-FORMA / ORÇAMENTO
                            
                            // Para fatura pró-forma/orçamento, não há seleção de formato
                            const selectedFormat = 'A4'; // Fixo para estes tipos de documento
                            
                            window.renderizarFaturaComDadosBackend(resultadoProforma);
                            
                            // Aguarda renderização
                            setTimeout(() => {
                                const printContainer = document.getElementById('inv-a4-container-principal');
                                
                                if (!printContainer || printContainer.innerHTML.length === 0) {
                                    console.error('❌ Fatura não foi renderizada!');
                                    alert('Erro: A fatura não foi renderizada corretamente.');
                                    // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                                    if (continueButton) {
                                        continueButton.disabled = false;
                                        continueButton.textContent = 'Continuar';
                                    }
                                    return;
                                }
                                
                                console.log(`✅ ${tipoDoc === 'orcamento' ? 'Orçamento' : 'Fatura Pró-Forma'} renderizado!`);
                                
                                // Aguarda QR codes
                                setTimeout(() => {
                                    console.log(`🖨️ Abrindo impressão de ${tipoDoc === 'orcamento' ? 'Orçamento' : 'Fatura Pró-Forma'}...`);
                                    
                                    // ABRE O DIÁLOGO DE IMPRESSÃO
                                    window.print();
                                    
                                    // Limpa após fechar
                                    setTimeout(() => {
                                        console.log('🧹 Limpando...');
                                        if (printContainer) printContainer.innerHTML = '';
                                        
                                        if (typeof cart !== 'undefined' && cart.clear) {
                                            cart.clear();
                                        }
                                        
                                        if (typeof renderCart === 'function') {
                                            renderCart();
                                        }
                                        
                                        closeCheckoutModal();
                                        showAlert('success', '✅ Concluído', 'Fatura Pró-Forma impressa com sucesso!');
                                    }, 1000);
                                    
                                }, 500);
                                
                            }, 1000);
                            
                        } else {
                            showAlert('error', 'Erro ao Gerar Fatura Pró-Forma', resultadoProforma.erro || resultadoProforma.mensagem || 'Erro desconhecido');
                            // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                            if (continueButton) {
                                continueButton.disabled = false;
                                continueButton.textContent = 'Continuar';
                            }
                        }
                        
                    } catch (errorProforma) {
                        console.error(`❌ [${tipoDoc === 'orcamento' ? 'ORCAMENTO' : 'PROFORMA'} API] Erro:`, errorProforma);
                        showAlert('error', 'Erro de Conexão', `Não foi possível gerar ${tipoDoc === 'orcamento' ? 'o Orçamento' : 'a Fatura Pró-Forma'}. Verifique sua conexão.`);
                        // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                        if (continueButton) {
                            continueButton.disabled = false;
                            continueButton.textContent = 'Continuar';
                        }
                    }
                    
                    // ✅ NÃO avança para Step 2
                    return;
                    
                } else if (tipoDoc === 'fatura') {
                    console.log('🔵 [FATURA] Tipo de documento é Fatura - Processando...');
                    
                    // ✅ FATURA: NÃO avança para Step 2, faz fetch e renderiza
                    const dadosFatura = {
                        acao: 'fatura',
                        id_cliente: data.id_cliente
                    };
                    
                    console.log('📤 [FATURA API] Enviando para vender.php:', dadosFatura);
                    
                    try {
                        const responseFatura = await fetch('http://localhost/Dash-POS/api/vender.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(dadosFatura)
                        });
                        
                        if (!responseFatura.ok) {
                            throw new Error(`HTTP ${responseFatura.status}: ${responseFatura.statusText}`);
                        }
                        
                        const resultadoFatura = await responseFatura.json();
                        console.log('📥 [FATURA API] Resposta:', resultadoFatura);
                        
                        if (resultadoFatura.sucesso) {
                            console.log('✅ [FATURA] Fatura gerada com sucesso!');
                            
                            // ✅ Valida funções
                            if (typeof window.renderizarFaturaComDadosBackend !== 'function') {
                                console.error('❌ renderizarFaturaComDadosBackend não existe!');
                                alert('Erro: Sistema de fatura não carregado. Recarregue a página.');
                                // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                                if (continueButton) {
                                    continueButton.disabled = false;
                                    continueButton.textContent = 'Continuar';
                                }
                                return;
                            }
                            
                            // ✅ RENDERIZAR A FATURA
                            
                            // Para fatura normal, não há seleção de formato
                            const selectedFormat = 'A4'; // Fixo para este tipo de documento
                            
                            window.renderizarFaturaComDadosBackend(resultadoFatura);
                            
                            // Aguarda renderização
                            setTimeout(() => {
                                const printContainer = document.getElementById('inv-a4-container-principal');
                                
                                if (!printContainer || printContainer.innerHTML.length === 0) {
                                    console.error('❌ Fatura não foi renderizada!');
                                    alert('Erro: A fatura não foi renderizada corretamente.');
                                    // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                                    if (continueButton) {
                                        continueButton.disabled = false;
                                        continueButton.textContent = 'Continuar';
                                    }
                                    return;
                                }
                                
                                console.log('✅ Fatura renderizada!');
                                
                                // Aguarda QR codes
                                setTimeout(() => {
                                    console.log('🖨️ Abrindo impressão de Fatura...');
                                    
                                    // ABRE O DIÁLOGO DE IMPRESSÃO
                                    window.print();
                                    
                                    // Limpa após fechar
                                    setTimeout(() => {
                                        console.log('🧹 Limpando...');
                                        if (printContainer) printContainer.innerHTML = '';
                                        
                                        if (typeof cart !== 'undefined' && cart.clear) {
                                            cart.clear();
                                        }
                                        
                                        if (typeof renderCart === 'function') {
                                            renderCart();
                                        }
                                        
                                        closeCheckoutModal();
                                        showAlert('success', '✅ Concluído', 'Fatura impressa com sucesso!');
                                    }, 1000);
                                    
                                }, 500);
                                
                            }, 1000);
                            
                        } else {
                            showAlert('error', 'Erro ao Gerar Fatura', resultadoFatura.erro || resultadoFatura.mensagem || 'Erro desconhecido');
                            // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                            if (continueButton) {
                                continueButton.disabled = false;
                                continueButton.textContent = 'Continuar';
                            }
                        }
                        
                    } catch (errorFatura) {
                        console.error('❌ [FATURA API] Erro:', errorFatura);
                        showAlert('error', 'Erro de Conexão', 'Não foi possível gerar a Fatura. Verifique sua conexão.');
                        // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                        if (continueButton) {
                            continueButton.disabled = false;
                            continueButton.textContent = 'Continuar';
                        }
                    }
                    
                    // ✅ NÃO avança para Step 2
                    return;
                    
                } else {
                    console.log('🟡 [FATURA RECIBO] Tipo de documento é Fatura Recibo - Continuando para Step 2...');
                    
                    // ✅ FATURA RECIBO: Continua normalmente para Step 2
                    checkoutSelectedPaymentMethod = null;
                    metodoAtual = null;
                    
                    clearCheckoutCash();
                    const cards = document.querySelectorAll('.checkout-payment-card');
                    cards.forEach(c => c.classList.remove('active'));
                    updatePaymentCards();
                }
            } else {
                // ✅ NOVA: Erro do backend (ex.: validação falhou)
                showAlert('error', 'Erro na Verificação', data.erro || data.mensagem || 'Falha ao verificar cliente. Tente novamente.');
                // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                if (continueButton) {
                    continueButton.disabled = false;
                    continueButton.textContent = 'Continuar para Pagamento';
                }
                return;
            }
        } catch (error) {
            console.error('❌ [API] Erro na requisição:', error);
            showAlert('error', 'Erro de Conexão', 'Não foi possível verificar o cliente. Verifique sua conexão e tente novamente.');
            // ✅ REATIVAR BOTÃO EM CASO DE ERRO
            if (continueButton) {
                continueButton.disabled = false;
                continueButton.textContent = 'Continuar para Pagamento';
            }
            return;
        }
    }
    
    // ✅ MANTER: Step 2 inalterado (processa pagamento e imprime)
    if (checkoutCurrentStep === 2) {
        console.log('🔍 [DEBUG] ========== INICIANDO VALIDAÇÃO DE PAGAMENTO ==========');
        
        // ✅ VALIDAÇÃO: Verificar se o valor pago é suficiente ANTES de processar
        let totalAPagar = checkoutPaymentData.total || 0;
        console.log('🔍 [DEBUG] Total a pagar:', totalAPagar);
        console.log('🔍 [DEBUG] checkoutPaymentData:', checkoutPaymentData);
        
        // Calcula soma de pagamentos de TODOS os métodos
        let somaPagamentos = 0;
        console.log('🔍 [DEBUG] paymentMethods:', paymentMethods);
        console.log('🔍 [DEBUG] valoresPorMetodo:', valoresPorMetodo);
        
        paymentMethods.forEach(metodo => {
            const slug = metodo.slug;
            const valorMetodo = parseFloat(valoresPorMetodo[slug]) || 0;
            somaPagamentos += valorMetodo;
            console.log(`🔍 [DEBUG] Método: ${metodo.name} (${slug}), Valor: ${valorMetodo}`);
        });
        
        console.log(`🔍 [DEBUG] SOMA TOTAL DOS PAGAMENTOS: ${somaPagamentos}`);
        console.log(`🔍 [DEBUG] TOTAL A PAGAR: ${totalAPagar}`);
        console.log(`🔍 [DEBUG] É menor? ${somaPagamentos < totalAPagar}`);
        
        // ✅ VERIFICA SE O VALOR É MENOR
        if (somaPagamentos < totalAPagar) {
            const faltaPagar = totalAPagar - somaPagamentos;
            console.log(`🔍 [DEBUG] ❌ PAGAMENTO INSUFICIENTE!`);
            console.log(`🔍 [DEBUG] Falta pagar: ${faltaPagar}`);
            console.log(`🔍 [DEBUG] Tentando chamar showAlert...`);
            console.log(`🔍 [DEBUG] showAlert existe? ${typeof showAlert}`);
            
            // Tenta chamar showAlert
            if (typeof showAlert === 'function') {
                console.log(`🔍 [DEBUG] Chamando showAlert...`);
                showAlert("error", "Pagamento Insuficiente", 
                    `O valor informado é menor que o valor a pagar. Falta: ${formatarMoeda(faltaPagar)} AOA`);
                console.log(`🔍 [DEBUG] showAlert chamado!`);
            } else {
                console.error(`🔍 [DEBUG] showAlert NÃO É UMA FUNÇÃO!`);
                alert(`PAGAMENTO INSUFICIENTE! Falta: ${formatarMoeda(faltaPagar)} AOA`);
            }
            
            console.log(`🔍 [DEBUG] Executando return para interromper...`);
            return;
        }
        
        console.log('🔍 [DEBUG] ✅ Pagamento SUFICIENTE! Continuando...');
        console.log('🔍 [DEBUG] ========== FIM DA VALIDAÇÃO ==========');
        
        if (!validateCheckoutPayment()) return;
        
        // ✅ VERIFICAR FORMATO DE FATURA ANTES DE PROCESSAR (apenas para fatura-recibo)
        const tipoDoc = (typeof tipoDocumentoAtual !== 'undefined') ? tipoDocumentoAtual : 'fatura-recibo';
        if (tipoDoc === 'fatura-recibo') {
            const selectedFormat = getInvoiceFormat();
            console.log('📄 [FORMAT] Formato selecionado:', selectedFormat);
            
            // A verificação de formato 80mm foi removida pois agora o sistema suporta renderização de fatura 80mm
        }
        
        // ✅ PROTEÇÃO: Desabilitar botão para evitar cliques duplicados
        const btnPayNow = document.getElementById('btnPayNow');
        if (btnPayNow) {
            if (btnPayNow.disabled) {
                console.log('⚠️ [STEP2] Botão já desabilitado - requisição em andamento');
                return;  // Já está processando
            }
            btnPayNow.disabled = true;
            btnPayNow.textContent = 'Processando...';
        }
        
        console.log('💳 [STEP2] Processando pagamento e gerando fatura...');
        
        // ✅ PREPARAR DADOS PARA ENVIAR AO BACKEND
        const metodosPagamento = [];
        // ✅ Reutiliza a variável totalAPagar já declarada acima
        
        // Coletar todos os métodos de pagamento com valores
        paymentMethods.forEach(metodo => {
            const valorMetodo = parseFloat(valoresPorMetodo[metodo.slug]) || 0;
            if (valorMetodo > 0) {
                metodosPagamento.push({
                    id_metodo: parseInt(metodo.id, 10),  // ✅ CONVERTER PARA INT
                    valor: valorMetodo
                });
            }
        });
        
        // Verificar se há métodos de pagamento
        if (metodosPagamento.length === 0) {
            showAlert('error', 'Erro', 'Nenhum método de pagamento selecionado.');
            // ✅ REATIVAR BOTÃO EM CASO DE ERRO
            if (btnPayNow) {
                btnPayNow.disabled = false;
                btnPayNow.textContent = 'Pay Now';
            }
            return;
        }
        
        // Calcular total pago e troco
        const totalPago = metodosPagamento.reduce((acc, m) => acc + m.valor, 0);
        const troco = totalPago > totalAPagar ? totalPago - totalAPagar : 0;
        
        // Montar o objeto de dados para enviar
        const dadosVenda = {
            acao: 'fatura-recibo',  // ✅ ATUALIZADO: fatura -> fatura-recibo
            id_cliente: checkoutCustomerData.id_cliente,  // ID do cliente vindo do Step 1
            metodos_pagamento: metodosPagamento,
            observacao: document.getElementById('checkoutObservation')?.value.trim() || '',  // ✅ FIXED: Get observation from textarea
            troco: troco,
            valor_pago: totalPago
        };
        
        console.log('📤 [API] Enviando dados da venda:', dadosVenda);
        
        try {
            // ✅ ENVIAR PARA O BACKEND
            console.log('🔗 [API] Iniciando requisição para:', 'http://localhost/Dash-POS/api/vender.php');
            
            const response = await fetch('http://localhost/Dash-POS/api/vender.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosVenda)
            });
            
            console.log('📡 [API] Response status:', response.status);
            console.log('📡 [API] Response ok:', response.ok);
            
            // ✅ LER O TEXTO DA RESPOSTA PRIMEIRO (para debug)
            const responseText = await response.text();
            console.log('📜 [API] Response text:', responseText);
            
            if (!response.ok) {
                console.error('❌ [API] HTTP Error:', response.status, response.statusText);
                showAlert('error', 'Erro HTTP', `Erro ${response.status}: ${response.statusText}`);
                // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                if (btnPayNow) {
                    btnPayNow.disabled = false;
                    btnPayNow.textContent = 'Pay Now';
                }
                return;
            }
            
            // ✅ TENTAR PARSEAR COMO JSON
            let resultado;
            try {
                resultado = JSON.parse(responseText);
                console.log('📥 [API] Resposta do backend (JSON):', resultado);
            } catch (parseError) {
                console.error('❌ [API] Erro ao parsear JSON:', parseError);
                console.error('📜 [API] Conteúdo recebido:', responseText.substring(0, 500));
                showAlert('error', 'Erro de Formato', 'A resposta do servidor não é um JSON válido. Verifique o console.');
                // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                if (btnPayNow) {
                    btnPayNow.disabled = false;
                    btnPayNow.textContent = 'Pay Now';
                }
                return;
            }
            
            if (!resultado.sucesso) {
                // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                if (btnPayNow) {
                    btnPayNow.disabled = false;
                    btnPayNow.textContent = 'Pay Now';
                }
                showAlert('error', 'Erro ao Gerar Fatura', resultado.erro || resultado.mensagem || 'Erro desconhecido');
                return;
            }
            
            // ✅ SUCESSO - DADOS DA FATURA RECEBIDOS DO BACKEND
            console.log('✅ [SUCCESS] Fatura gerada com sucesso! Renderizando...');
            
            // Verificar qual formato de fatura deve ser renderizado
            const selectedFormat = getInvoiceFormat();
            console.log('📄 [FORMAT] Formato selecionado para renderização:', selectedFormat);
            
            // Valida funções
            if (selectedFormat === '80mm') {
                // Para fatura 80mm, verificar se a função específica existe
                if (typeof window.renderizarFatura80ComDadosBackend !== 'function') {
                    console.error('❌ renderizarFatura80ComDadosBackend não existe!');
                    alert('Erro: Sistema de fatura 80mm não carregado. Recarregue a página.');
                    // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                    if (btnPayNow) {
                        btnPayNow.disabled = false;
                        btnPayNow.textContent = 'Pay Now';
                    }
                    return;
                }
                
                // ✅ CHAMAR FUNÇÃO DO fatura80.js COM OS DADOS DO BACKEND
                window.renderizarFatura80ComDadosBackend(resultado);
            } else {
                // Para fatura A4 (padrão)
                if (typeof window.renderizarFaturaComDadosBackend !== 'function') {
                    console.error('❌ renderizarFaturaComDadosBackend não existe!');
                    alert('Erro: Sistema de fatura não carregado. Recarregue a página.');
                    // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                    if (btnPayNow) {
                        btnPayNow.disabled = false;
                        btnPayNow.textContent = 'Pay Now';
                    }
                    return;
                }
                
                // ✅ CHAMAR FUNÇÃO DO fatura.js COM OS DADOS DO BACKEND
                window.renderizarFaturaComDadosBackend(resultado);
            }
            
            // Aguarda renderização
            setTimeout(() => {
                // Verificar qual container usar baseado no formato selecionado
                const selectedFormat = getInvoiceFormat();
                const containerId = selectedFormat === '80mm' ? 'fatura80-container-inv80' : 'inv-a4-container-principal';
                const printContainer = document.getElementById(containerId);
                
                if (!printContainer || printContainer.innerHTML.length === 0) {
                    console.error('❌ Fatura não foi renderizada!');
                    alert('Erro: A fatura não foi renderizada corretamente.');
                    // ✅ REATIVAR BOTÃO EM CASO DE ERRO
                    if (btnPayNow) {
                        btnPayNow.disabled = false;
                        btnPayNow.textContent = 'Pay Now';
                    }
                    return;
                }
                
                console.log('✅ Fatura renderizada!');
                
                // Aguarda QR codes
                setTimeout(() => {
                    console.log('🖨️ Abrindo impressão...');
                    
                    // ABRE O DIÁLOGO DE IMPRESSÃO
                    window.print();
                    
                    // Limpa após fechar
                    setTimeout(() => {
                        console.log('🧹 Limpando...');
                        if (printContainer) printContainer.innerHTML = '';
                        
                        if (typeof cart !== 'undefined' && cart.clear) {
                            cart.clear();
                        }
                        
                        if (typeof renderCart === 'function') {
                            renderCart();
                        }
                        
                        closeCheckoutModal();
                        showAlert('success', '✅ Concluído', 'Fatura impressa com sucesso!');
                    }, 1000);
                    
                }, 500);
                
            }, 1000);
            
        } catch (error) {
            console.error('❌ [API] Erro capturado:', error);
            console.error('❌ [API] Tipo do erro:', error.name);
            console.error('❌ [API] Mensagem do erro:', error.message);
            console.error('❌ [API] Stack trace:', error.stack);
            
            // ✅ REATIVAR BOTÃO EM CASO DE ERRO
            if (btnPayNow) {
                btnPayNow.disabled = false;
                btnPayNow.textContent = 'Pay Now';
            }
            
            // Mostrar mensagem mais específica baseada no tipo de erro
            let mensagemErro = 'Não foi possível processar a venda.';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                mensagemErro = 'Erro de conexão: Não foi possível conectar ao servidor. Verifique se o XAMPP está rodando.';
            } else if (error.name === 'SyntaxError') {
                mensagemErro = 'Erro no formato da resposta. Verifique o console para mais detalhes.';
            } else {
                mensagemErro = `Erro: ${error.message}`;
            }
            
            showAlert('error', 'Erro de Conexão', mensagemErro);
            return;
        }
        
        return;
    }
    
    // Não permite avançar além do step 2
    if (checkoutCurrentStep < 2) {
        checkoutCurrentStep++;
        updateCheckoutStepDisplay();
    }
}

function updateCheckoutStepDisplay() {
    console.log('🎨 [STEP] Atualizando display para step:', checkoutCurrentStep);
    console.log('🎨 [STEP] Atualizando display para step:', checkoutCurrentStep);
    
    // ✅ NOVO: Força remoção de qualquer step extra >2 (se alguém adicionou)
    for (let i = 3; i <= 10; i++) {  // Assume max 10, ajuste se preciso
        const extraStep = document.getElementById(`checkoutStep${i}`);
        const extraContent = document.getElementById(`checkoutStepContent${i}`);
        if (extraStep) extraStep.remove();
        if (extraContent) extraContent.remove();
        const extraProgress = document.getElementById(`checkoutProgress${i}`);
        if (extraProgress) extraProgress.remove();
    }
    
    // Mostra apenas os steps 1 e 2
    for (let i = 1; i <= 2; i++) {
        const content = document.getElementById(`checkoutStepContent${i}`);
        if (content) {
            content.style.display = 'none';
            content.style.opacity = '0';
            content.style.visibility = 'hidden';
        }
    }
    
    const currentContent = document.getElementById(`checkoutStepContent${checkoutCurrentStep}`);
    if (currentContent) {
        currentContent.style.display = 'block';
        currentContent.style.opacity = '1';
        currentContent.style.visibility = 'visible';
        currentContent.style.transform = 'translateX(0)';
        
        if (checkoutCurrentStep === 2) {
            const interfacePagamento = document.getElementById('checkoutCashPayment');
            if (interfacePagamento) {
                interfacePagamento.style.display = 'block';
                interfacePagamento.style.opacity = '1';
            }
            
            // ✅ MODIFICAR TODO ESTE BLOCO:
            setTimeout(() => {
                setupPhysicalKeyboardListener(); // ← ADICIONAR ESTA LINHA
                const cashInput = document.getElementById('checkoutCashInput');
                if (cashInput) {
                    cashInput.focus();
                    console.log('🎯 [FOCUS] Input focado automaticamente!');
                }
            }, 300);
        }
    }
    
    // Atualiza indicadores apenas para steps 1 e 2
    for (let i = 1; i <= 2; i++) {
        const stepIndicator = document.getElementById(`checkoutStep${i}`);
        if (!stepIndicator) continue;
        
        const stepDiv = stepIndicator.querySelector('div');
        const stepNumber = stepIndicator.querySelector('.step-number');
        const stepCheck = stepIndicator.querySelector('.step-check');
        
        if (!stepDiv || !stepNumber || !stepCheck) continue;
        
        if (i < checkoutCurrentStep) {
            stepDiv.className = 'w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm';
            stepNumber.classList.add('hidden');
            stepCheck.classList.remove('hidden');
            // Progress bar apenas entre step 1 e 2
            if (i === 1) {
                const progress = document.getElementById(`checkoutProgress${i}`);
                if (progress) progress.style.width = '100%';
            }
        } else if (i === checkoutCurrentStep) {
            stepDiv.className = 'w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm';
            stepNumber.classList.remove('hidden');
            stepCheck.classList.add('hidden');
        } else {
            stepDiv.className = 'w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-semibold text-sm';
            stepNumber.classList.remove('hidden');
            stepCheck.classList.add('hidden');
        }
    }
    
    console.log('✅ [STEP] Display atualizado');
}

// ============================================
// STEP 1: CUSTOMER INFO
// ============================================

function validateCheckoutCustomerForm() {
    const fullName = document.getElementById('checkoutFullName')?.value.trim();
    const email = document.getElementById('checkoutEmail')?.value.trim();
    const phone = document.getElementById('checkoutPhone')?.value.trim();
    
    if (!fullName) {
        showAlert("error", "Erro em Prosseguir", "Por favor informe o nome completo.");
        return false;
    }
    
    if (!email) {
        showAlert("error", "Erro em Prosseguir", "Por favor informe o Email.");
        return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
        showAlert("error", "Erro em Prosseguir", "Email inválido.");
        return false;
    }
    
    if (!phone) {
        showAlert("error", "Erro em Prosseguir", "Por favor informe o Telefone.");
        return false;
    }
    
    return true;
}

// ✅ MUDANÇA: Adiciona id_cliente ao save (inicialmente null, atualizado pelo backend)
function saveCheckoutCustomerData(idCliente = null) {  // ✅ NOVA: Parâmetro opcional para ID do backend
    const countryCode = document.getElementById('checkoutCountryCode')?.value || '+244';
    const fullName = document.getElementById('checkoutFullName')?.value.trim();
    const email = document.getElementById('checkoutEmail')?.value.trim();
    const phone = countryCode + ' ' + document.getElementById('checkoutPhone')?.value.trim();
    const address = document.getElementById('checkoutAddress')?.value.trim();
    const nif = document.getElementById('checkoutNif')?.value.trim();
    
    checkoutCustomerData = { 
        fullName, 
        email, 
        phone, 
        address, 
        nif,
        id_cliente: idCliente  // ✅ NOVA: Armazena o ID do backend
    };
    console.log('✅ [DATA] Customer data saved:', checkoutCustomerData);
}

// ============================================
// STEP 2: PAGAMENTO - SELEÇÃO COM INPUT REAL
// ============================================

function selectCheckoutPaymentMethod(card, method) {
    console.log('💳 [PAYMENT] Clique detectado em:', method);

    const isCurrentMethod = metodoAtual === method;
    
    if (isCurrentMethod) {
        // ✅ Clicou no método que já está sendo editado: DESELECIONA para editar outro
        console.log('❎ Deselecionando método atual:', method);
        
        // ✅ CORREÇÃO: Usa parseFloat em vez de parseInt
        const valorDigitado = parseFloat(checkoutCashAmount) || 0;
        valoresPorMetodo[method] = valorDigitado;
        console.log(`💾 Salvando ${method}: ${valorDigitado} Kz`);
        
        // Limpa o método atual
        metodoAtual = null;
        checkoutCashAmount = '0';
        updateCheckoutCashDisplay();
        
    } else {
        // ✅ Clicou em um NOVO método para editar
        console.log('✅ Selecionando novo método:', method);
        
        // 1️⃣ SALVA o valor do método anterior (se houver)
        if (metodoAtual) {
            // ✅ CORREÇÃO: Usa parseFloat em vez de parseInt
            const valorDigitado = parseFloat(checkoutCashAmount) || 0;
            valoresPorMetodo[metodoAtual] = valorDigitado;
            console.log(`💾 Salvando ${metodoAtual}: ${valorDigitado} Kz`);
        }
        
        // 2️⃣ Define o novo método atual
        metodoAtual = method;
        
        // 3️⃣ Carrega o valor JÁ SALVO deste método (se houver)
        const valorSalvo = valoresPorMetodo[method] || 0;
        checkoutCashAmount = valorSalvo > 0 ? String(valorSalvo) : '0';
        updateCheckoutCashDisplay();
        
        console.log(`📥 Carregando ${method}: ${checkoutCashAmount} Kz`);
        // ✅ ADICIONAR ESTE BLOCO:
        setTimeout(() => {
            setupPhysicalKeyboardListener(); // ← RECONECTA O LISTENER
            const cashInput = document.getElementById('checkoutCashInput');
            if (cashInput) {
                cashInput.focus();
                console.log('🎯 [FOCUS] Input focado!');
            }
        }, 100);

        // 4️⃣ Foco automático no input
        setTimeout(() => {
            const cashInput = document.getElementById('checkoutCashInput');
            if (cashInput) {
                cashInput.focus();
                console.log('🎯 [FOCUS] Input focado!');
            }
        }, 100);
    }

    // 5️⃣ Atualiza a interface (os estilos serão aplicados por updatePaymentCards)
    updatePaymentCards();
}

function updatePaymentCards() {
    // ✅ VERIFICAÇÃO DE SEGURANCA: Garante que paymentMethods existe
    if (!paymentMethods || !Array.isArray(paymentMethods)) {
        console.warn('⚠️ [PAYMENT] paymentMethods não está definido ou não é array');
        paymentMethods = [];
    }
    
    const cards = document.querySelectorAll('.checkout-payment-card');
    const totalAPagar = checkoutPaymentData.total || 0;
    
    // ✅ CORREÇÃO: Usa parseFloat em vez de parseInt para manter decimais
    let somaPagamentos = 0;
    paymentMethods.forEach(metodo => {
        const slug = metodo.slug;
        if (slug === metodoAtual) {
            somaPagamentos += parseFloat(checkoutCashAmount) || 0;
        } else {
            somaPagamentos += parseFloat(valoresPorMetodo[slug]) || 0;
        }
    });
    
    const faltaPagar = totalAPagar - somaPagamentos;
    
    console.log(`💰 [CALC] Total: ${totalAPagar} | Pago: ${somaPagamentos} | Falta: ${faltaPagar}`);
    console.log(`📋 [METHODS] Métodos disponíveis:`, paymentMethods.map(m => m.slug));
    
    cards.forEach(card => {
        const method = card.getAttribute('data-metodo') || '';
        
        // ✅ VERIFICA se o método existe no array paymentMethods
        const metodoExiste = paymentMethods.some(m => m.slug === method);
        if (!metodoExiste) {
            console.warn(`⚠️ [CARD] Método "${method}" não encontrado em paymentMethods`);
            card.style.display = 'none'; // Esconde cards de métodos não carregados
            return;
        }
        
        const span = card.querySelector('.valor-restante');
        const isCurrentMethod = metodoAtual === method;
        
        // ✅ CORREÇÃO: Usa parseFloat em vez de parseInt
        let valorDoMetodo = 0;
        if (isCurrentMethod) {
            valorDoMetodo = parseFloat(checkoutCashAmount) || 0;
        } else {
            valorDoMetodo = parseFloat(valoresPorMetodo[method]) || 0;
        }
        
        // ✅ REGRA: Card ativo se valor > 0
        const deveEstarAtivo = valorDoMetodo > 0;
        
        // Aplica ou remove a classe 'active' baseado no valor
        if (deveEstarAtivo) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }

        // ✅ ESTILOS VISUAIS baseados no estado
        if (deveEstarAtivo) {
            if (isCurrentMethod) {
                card.style.border = '3px solid #2563eb';
                card.style.backgroundColor = '#dbeafe';
                card.style.color = '#1e3a8a';
                card.style.transform = 'scale(1.05)';
                card.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
            } else {
                card.style.border = '2px solid #60a5fa';
                card.style.backgroundColor = '#eff6ff';
                card.style.color = '#1e40af';
                card.style.transform = 'scale(1.02)';
                card.style.boxShadow = '0 2px 8px rgba(96, 165, 250, 0.2)';
            }
        } else {
            card.style.border = '2px solid #e5e7eb';
            card.style.backgroundColor = '#fff';
            card.style.color = '#6b7280';
            card.style.transform = 'scale(1)';
            card.style.boxShadow = 'none';
        }

        // ✅ EXIBIÇÃO DO VALOR/STATUS no span
        if (span) {
            if (isCurrentMethod && deveEstarAtivo) {
                // ✅ CORREÇÃO: Formata com 2 casas decimais
                span.textContent = valorDoMetodo.toLocaleString('pt-AO', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) + ' Kz';
                span.style.opacity = '1';
                span.style.color = '#2563eb';
                span.style.fontWeight = '700';
                
            } else if (deveEstarAtivo) {
                // ✅ CORREÇÃO: Formata com 2 casas decimais
                span.textContent = valorDoMetodo.toLocaleString('pt-AO', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) + ' Kz';
                span.style.opacity = '1';
                span.style.color = '#16a34a';
                span.style.fontWeight = '600';
                
            } else if (faltaPagar > 0) {
                // ✅ CORREÇÃO: Formata com 2 casas decimais
                span.textContent = '−' + faltaPagar.toLocaleString('pt-AO', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) + ' Kz';
                span.style.opacity = '1';
                span.style.color = '#dc2626';
                span.style.fontWeight = '600';
                
            } else {
                span.textContent = '';
                span.style.opacity = '0';
            }
        }
    });

    // Atualiza o Order Summary
    updateOrderSummaryWithChange(faltaPagar);

    // ✅ BOTÃO SEMPRE HABILITADO - Validação acontece no clique
    const btnPayNow = document.getElementById('btnPayNow');
    if (btnPayNow) {
        btnPayNow.disabled = false;  // Sempre habilitado para mostrar o showAlert
    }
}


function updateOrderSummaryWithChange(faltaPagar) {
    const totalAPagar = checkoutPaymentData.total || 0;
    
    // ✅ CORREÇÃO: Usa parseFloat em vez de parseInt para manter decimais
    let somaPagamentos = 0;
    paymentMethods.forEach(metodo => {
        const slug = metodo.slug;
        if (slug === metodoAtual) {
            somaPagamentos += parseFloat(checkoutCashAmount) || 0;
        } else {
            somaPagamentos += parseFloat(valoresPorMetodo[slug]) || 0;
        }
    });
    
    const diferenca = totalAPagar - somaPagamentos;
    
    console.log(`📊 [ORDER SUMMARY] Total: ${totalAPagar} | Pago: ${somaPagamentos.toFixed(2)} | Diferença: ${diferenca.toFixed(2)}`);
    
    // Encontra o container do Order Summary no Step 2
    const summaryContainer = document.getElementById('checkoutOrderSummaryStep2');
    if (!summaryContainer) return;
    
    const parentDiv = summaryContainer.parentElement;
    if (!parentDiv) return;
    
    // Remove qualquer linha de status anterior (troco ou falta)
    const statusLineOld = parentDiv.querySelector('.payment-status-line');
    if (statusLineOld) statusLineOld.remove();
    
    // Só mostra algo se houver pagamentos digitados
    if (somaPagamentos === 0) {
        return; // Nada digitado ainda
    }
    
    // Encontra onde inserir (antes do Total Payment)
    const totalPaymentDiv = parentDiv.querySelector('.border-t.border-gray-300.pt-4');
    if (!totalPaymentDiv) return;
    
    // ✅ LÓGICA CONDICIONAL
    if (diferenca > 0) {
        // 🔴 AINDA FALTA PAGAR
        const faltaHTML = `
            <div class="payment-status-line flex justify-between text-sm border-t border-gray-300 pt-3 mt-3 bg-red-50 -mx-6 px-6 py-3 rounded-lg">
                <span class="text-gray-700 font-semibold flex items-center gap-2">
                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Valor em falta
                </span>
                <span class="font-bold text-red-600 text-lg">${currency.format(diferenca)}</span>
            </div>
        `;
        totalPaymentDiv.insertAdjacentHTML('beforebegin', faltaHTML);
        
    } else if (diferenca < 0) {
        // 🟢 PAGOU A MAIS - TEM TROCO
        const troco = Math.abs(diferenca);
        const trocoHTML = `
            <div class="payment-status-line flex justify-between text-sm border-t border-gray-300 pt-3 mt-3 bg-green-50 -mx-6 px-6 py-3 rounded-lg">
                <span class="text-gray-700 font-semibold flex items-center gap-2">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Troco
                </span>
                <span class="font-bold text-green-600 text-lg">${currency.format(troco)}</span>
            </div>
        `;
        totalPaymentDiv.insertAdjacentHTML('beforebegin', trocoHTML);
        
    } else {
        // ✅ PAGAMENTO EXATO - COMPLETO
        const completoHTML = `
            <div class="payment-status-line flex justify-between text-sm border-t border-gray-300 pt-3 mt-3 bg-blue-50 -mx-6 px-6 py-3 rounded-lg">
                <span class="text-gray-700 font-semibold flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Pagamento completo
                </span>
                <span class="font-bold text-blue-600 text-lg">✓</span>
            </div>
        `;
        totalPaymentDiv.insertAdjacentHTML('beforebegin', completoHTML);
    }
}

// ============================================
// TECLADO NUMÉRICO - ATUALIZA O INPUT REAL
// ============================================

function checkoutKeypadInput(value) {
    if (!metodoAtual) {
        console.warn('⚠️ [KEYPAD] Nenhum método selecionado — clique num método antes de digitar.');
        return;
    }

    if (!paymentMethods.some(m => m.slug === metodoAtual)) {
        console.warn('⚠️ [INPUT] Método atual não encontrado nos métodos carregados.');
        return;
    }

    const currentValue = checkoutCashAmount || '0';
    
    // ✅ LÓGICA PARA PONTO DECIMAL (aceita tanto '.' quanto ',' como separador decimal)
    if (value === '.' || value === ',') {
        // ✅ VERIFICA se já existe ponto decimal
        if (currentValue.includes('.')) {
            console.log('⚠️ [DECIMAL] Já existe ponto decimal - ignorando');
            return; // ⛔ NÃO permite múltiplos pontos
        }
        
        // ✅ Se for o primeiro caractere, adiciona "0." antes
        if (currentValue === '0' || currentValue === '') {
            checkoutCashAmount = '0.';
        } else {
            // ✅ Adiciona o ponto à string existente
            checkoutCashAmount = currentValue + '.';
        }
    } 
    // ✅ LÓGICA PARA NÚMEROS
    else if (/\d/.test(value)) {
        // ✅ Se o valor atual é "0" ou "0.", substitui
        if (currentValue === '0' && value === '0') {
            checkoutCashAmount = '0';
        } else if (currentValue === '0') {
            checkoutCashAmount = value;
        } 
        // ✅ Se o valor atual é "0.x", adiciona normalmente
        else if (currentValue === '0.') {
            checkoutCashAmount = currentValue + value;
        }
        // ✅ Adiciona ao valor existente
        else {
            checkoutCashAmount = currentValue + value;
        }
        
        // ✅ LIMITA A 2 CASAS DECIMAIS APÓS O PONTO
        if (checkoutCashAmount.includes('.')) {
            const parts = checkoutCashAmount.split('.');
            if (parts[1].length > 2) {
                checkoutCashAmount = parts[0] + '.' + parts[1].substring(0, 2);
            }
        }
    }

    // ✅ CONVERTE PARA NÚMERO (mantém decimais)
    const numericValue = parseFloat(checkoutCashAmount) || 0;
    valoresPorMetodo[metodoAtual] = numericValue;

    updateCheckoutCashDisplay();
    updatePaymentCards();
}

function addCheckoutQuickAmount(amount) {
    if (!metodoAtual) {
        console.warn('⚠️ [QUICK] Nenhum método selecionado — clique num método antes de usar valores rápidos.');
        return;
    }

    if (!paymentMethods.some(m => m.slug === metodoAtual)) {
        console.warn('⚠️ [INPUT] Método atual não encontrado nos métodos carregados.');
        return;
    }

    const current = parseFloat(checkoutCashAmount) || 0;
    const novo = current + amount;
    
    // ✅ MANTÉM formatação decimal se existir
    if (checkoutCashAmount.includes('.')) {
        checkoutCashAmount = novo.toFixed(2);
    } else {
        checkoutCashAmount = String(Math.round(novo));
    }

    valoresPorMetodo[metodoAtual] = parseFloat(checkoutCashAmount) || 0;
    updateCheckoutCashDisplay();
    updatePaymentCards(); 
}

function clearCheckoutCash() {
    if (!metodoAtual) {
        checkoutCashAmount = '0';
        updateCheckoutCashDisplay();
        return;
    }

    if (!paymentMethods.some(m => m.slug === metodoAtual)) {
        console.warn('⚠️ [INPUT] Método atual não encontrado nos métodos carregados.');
        return;
    }

    checkoutCashAmount = '0'; // ✅ Reset para "0" (sem decimais)
    valoresPorMetodo[metodoAtual] = 0;
    updateCheckoutCashDisplay();
    updatePaymentCards();
}

function backspaceCheckoutCash() {
    if (!metodoAtual) {
        console.warn('⚠️ [BACKSPACE] Nenhum método selecionado.');
        return;
    }

    if (!paymentMethods.some(m => m.slug === metodoAtual)) {
        console.warn('⚠️ [INPUT] Método atual não encontrado nos métodos carregados.');
        return;
    }

    if (checkoutCashAmount.length > 1) {
        checkoutCashAmount = checkoutCashAmount.slice(0, -1);
        // ✅ Se ficou apenas ".", converte para "0"
        if (checkoutCashAmount === '.') {
            checkoutCashAmount = '0';
        }
    } else {
        checkoutCashAmount = '0';
    }

    const numericValue = parseFloat(checkoutCashAmount) || 0;
    valoresPorMetodo[metodoAtual] = numericValue;
    
    updateCheckoutCashDisplay();
    updatePaymentCards();
}

function updateCheckoutCashDisplay() {
    const input = document.getElementById('checkoutCashInput');
    if (!input) return;
    
    // ✅ CONVERTE para número com decimais
    const numValue = parseFloat(checkoutCashAmount) || 0;
    
    // ✅ FORMATA com separadores de milhar E 2 casas decimais
    const formatted = numValue.toLocaleString('pt-AO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // ✅ ADICIONA "Kz" no início
    input.value = `Kz ${formatted}`;
    
    console.log(`💰 Display atualizado: ${checkoutCashAmount} → Kz ${formatted}`);
}

// ✅ CAPTURA DIGITAÇÃO DIRETA NO INPUT
// ✅ CAPTURA DIGITAÇÃO DIRETA NO INPUT - VERSÃO CORRIGIDA (evita loop infinito

function updateCheckoutOrderSummaryPayment() {
    if (checkoutCurrentStep !== 2) return;
    
    const summaryDiv = document.getElementById('checkoutOrderSummaryStep2');
    if (summaryDiv) {
        const pagoLine = summaryDiv.querySelector('.pago-line');
        const restanteLine = summaryDiv.querySelector('.restante-line');
        if (pagoLine) pagoLine.remove();
        if (restanteLine) restanteLine.remove();
    }
}

function validateCheckoutPayment() {
    const totalAPagar = checkoutPaymentData.total || 0;
    
    // Calcula soma de pagamentos
    let somaPagamentos = 0;
    paymentMethods.forEach(metodo => {
        const slug = metodo.slug;
        if (slug === metodoAtual) {
            somaPagamentos += parseFloat(checkoutCashAmount) || 0;
        } else {
            somaPagamentos += parseFloat(valoresPorMetodo[slug]) || 0;
        }
    });
    
    if (somaPagamentos < totalAPagar) {
        showAlert("error", "Pagamento Insuficiente", 
            `Falta pagar ${formatarMoeda(totalAPagar - somaPagamentos)} Kz`);
        return false;
    }
    
    return true;
}

// ============================================
// POPULATE ORDER SUMMARY
// ============================================

async function populateCheckoutOrderSummary() {
    console.log('📊 [SUMMARY] Populando resumo do pedido...');

    // 🔥 BUSCAR DADOS DO BACKEND em vez de calcular no frontend
    try {
        const response = await fetch("http://localhost/Dash-POS/api/pedido.php?acao=listar_pedido", {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 [SUMMARY] Dados do backend:', data);

        if (!data.sucesso || !data.resumo) {
            console.warn('⚠️ [SUMMARY] Resumo não disponível, usando valores padrão');
            checkoutPaymentData.subtotal = 0;
            checkoutPaymentData.discount = 0;
            checkoutPaymentData.tax = 0;
            checkoutPaymentData.total = 0;
        } else {
            // ✅ USAR dados do backend (novos campos)
            checkoutPaymentData.subtotal = data.resumo.total_iliquido || 0;
            checkoutPaymentData.discount = data.resumo.total_retencao || 0;
            checkoutPaymentData.tax = data.resumo.total_imposto || 0;
            checkoutPaymentData.total = data.resumo.total || 0;
        }
    } catch (error) {
        console.error('❌ [SUMMARY] Erro ao buscar dados do backend:', error);
        // Fallback: usa valores padrão
        checkoutPaymentData.subtotal = 0;
        checkoutPaymentData.discount = 0;
        checkoutPaymentData.tax = 0;
        checkoutPaymentData.total = 0;
    }
    
    // ✅ Buscar itens do carrinho
    const items = [...cart.values()];

    const customerName = checkoutCustomerData.fullName || 'Não informado';
    const customerHTML = `<div class="flex justify-between text-sm text-gray-600">
        <span>Cliente</span>
        <span class="font-medium">${customerName}</span>
    </div>`;

    const summaryStep1 = document.getElementById('checkoutOrderSummaryStep1');
    const summaryStep2 = document.getElementById('checkoutOrderSummaryStep2');

    if (summaryStep1) {
        let itemsHTML = '';
        items.forEach(({product, qty, customPrice}) => {
            const price = customPrice || product.price;
            const lineTotal = price * qty;
            itemsHTML += `<div class="flex justify-between text-sm">
                <span class="text-gray-600">${product.name} x${qty}</span>
                <span class="font-medium">${currency.format(lineTotal)}</span>
            </div>`;
        });
        summaryStep1.innerHTML = itemsHTML || customerHTML;
    }
    if (summaryStep2) {
        summaryStep2.innerHTML = customerHTML;
    }

    const updateSummaryValues = (stepNum) => {
        const subtotalEl = document.getElementById(`checkoutSummarySubtotal${stepNum}`);
        const taxEl = document.getElementById(`checkoutSummaryTax${stepNum}`);
        const discountEl = document.getElementById(`checkoutSummaryDiscount${stepNum}`);
        const totalEl = document.getElementById(`checkoutSummaryTotal${stepNum}`);

        // ✅ Usar dados de checkoutPaymentData em vez de variáveis locais
        if (subtotalEl) subtotalEl.textContent = currency.format(checkoutPaymentData.subtotal);
        if (taxEl) taxEl.textContent = currency.format(checkoutPaymentData.tax);
        if (discountEl) discountEl.textContent = currency.format(checkoutPaymentData.discount);
        if (totalEl) totalEl.textContent = currency.format(checkoutPaymentData.total);
    };
    
    updateSummaryValues(1);
    updateSummaryValues(2);
    
    updateCheckoutOrderSummaryPayment();

    // ✅ ADICIONA ESTA LINHA AQUI:
    updatePaymentCards(); // Garante que os cards mostram "falta pagar" quando entra no Step 2
    
    console.log('✅ [SUMMARY] Resumo populado');
}

// ============================================
// EVENT LISTENERS
// ============================================

(function initCheckoutModal() {
    console.log('🔧 [INIT] Inicializando modal...');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupCheckoutListeners);
    } else {
        setupCheckoutListeners();
    }
})();

// ✅ ADICIONAR esta função auxiliar para melhor suporte do teclado
// ============================================
// CORREÇÃO: MANIPULAÇÃO DO TECLADO FÍSICO
// ============================================

/**
 * Manipula entrada do teclado físico com comportamento tipo Calculadora do Windows
 */
function handlePhysicalKeyboardInput(e) {
    // Só processa se houver um método selecionado
    if (!metodoAtual) {
        console.warn('⚠️ [KEYBOARD] Nenhum método selecionado');
        return;
    }

    const key = e.key;
    
    // ✅ BACKSPACE: Remove último caractere
    if (key === 'Backspace') {
        e.preventDefault();
        if (checkoutCashAmount.length > 1) {
            checkoutCashAmount = checkoutCashAmount.slice(0, -1);
            // Se ficou apenas ".", volta para "0"
            if (checkoutCashAmount === '.') {
                checkoutCashAmount = '0';
            }
        } else {
            checkoutCashAmount = '0';
        }
        
        const numericValue = parseFloat(checkoutCashAmount) || 0;
        valoresPorMetodo[metodoAtual] = numericValue;
        updateCheckoutCashDisplay();
        updatePaymentCards();
        return;
    }
    
    // ✅ DELETE: Limpa tudo
    if (key === 'Delete') {
        e.preventDefault();
        checkoutCashAmount = '0';
        valoresPorMetodo[metodoAtual] = 0;
        updateCheckoutCashDisplay();
        updatePaymentCards();
        return;
    }
    
    // ✅ ESCAPE: Fecha modal
    if (key === 'Escape') {
        showConfirmModal({
            title: 'Fechar Checkout?',
            message: 'Tem certeza que deseja fechar? Todo o progresso do checkout será perdido.',
            confirmText: 'Sim, Fechar',
            cancelText: 'Cancelar',
            confirmColor: 'red',
            icon: 'warning'
        }, closeCheckoutModal);
        return;
    }
    
    // ✅ ENTER: Avança para próximo step
    if (key === 'Enter') {
        e.preventDefault();
        if (checkoutCurrentStep === 1) {
            checkoutNextStep();
        } else if (checkoutCurrentStep === 2) {
            const btnPayNow = document.getElementById('btnPayNow');
            if (btnPayNow && !btnPayNow.disabled) {
                btnPayNow.click();
            }
        }
        return;
    }
    
    // ✅ PONTO DECIMAL: Adiciona ponto (aceita . ou , ou Decimal do numpad)
    if (key === '.' || key === ',' || key === 'Decimal') {
        e.preventDefault();
        
        const currentValue = checkoutCashAmount || '0';
        
        // Só adiciona ponto se ainda não existir um
        if (!currentValue.includes('.')) {
            // Se valor é "0" ou vazio, inicia com "0."
            if (currentValue === '0' || currentValue === '') {
                checkoutCashAmount = '0.';
            } else {
                // Adiciona ponto ao valor existente
                checkoutCashAmount = currentValue + '.';
            }
            
            // Atualiza estado interno (valor ainda é o mesmo numericamente)
            const numericValue = parseFloat(checkoutCashAmount) || 0;
            valoresPorMetodo[metodoAtual] = numericValue;
            
            updateCheckoutCashDisplay();
            updatePaymentCards();
        }
        return;
    }
    
    // ✅ NÚMEROS: Adiciona dígito
    if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        
        const currentValue = checkoutCashAmount || '0';
        
        // Se o valor atual é apenas "0" (sem ponto decimal), substitui pelo novo dígito
        if (currentValue === '0') {
            checkoutCashAmount = key;
        } 
        // Se já existe ponto decimal, verifica limite de 2 casas decimais
        else if (currentValue.includes('.')) {
            const parts = currentValue.split('.');
            
            // Limita a 2 casas decimais
            if (parts[1] && parts[1].length >= 2) {
                console.log('⚠️ [KEYBOARD] Limite de 2 casas decimais atingido');
                return; // Não adiciona mais dígitos após 2 casas decimais
            }
            
            // Adiciona o dígito
            checkoutCashAmount = currentValue + key;
        } 
        // Valor sem ponto decimal - simplesmente adiciona
        else {
            checkoutCashAmount = currentValue + key;
        }
        
        // Atualiza estado interno
        const numericValue = parseFloat(checkoutCashAmount) || 0;
        valoresPorMetodo[metodoAtual] = numericValue;
        
        updateCheckoutCashDisplay();
        updatePaymentCards();
        return;
    }
}

/**
 * Configurar listener para o input capturar teclado físico
 */
function setupPhysicalKeyboardListener() {
    const cashInput = document.getElementById('checkoutCashInput');
    if (!cashInput) {
        console.warn('⚠️ [KEYBOARD] Input não encontrado');
        return;
    }
    
    // Remove listener anterior se existir
    cashInput.removeEventListener('keydown', handlePhysicalKeyboardInput);
    
    // Adiciona novo listener
    cashInput.addEventListener('keydown', handlePhysicalKeyboardInput);
    
    // ✅ IMPORTANTE: Previne que o input aceite entrada direta
    // O valor deve ser controlado apenas pela nossa lógica
    cashInput.addEventListener('input', function(e) {
        e.preventDefault();
        // Restaura o valor formatado correto
        updateCheckoutCashDisplay();
    });
    
    // ✅ IMPORTANTE: Garante que o cursor sempre fica no final
    cashInput.addEventListener('click', function() {
        this.selectionStart = this.selectionEnd = this.value.length;
    });
    
    cashInput.addEventListener('focus', function() {
        this.selectionStart = this.selectionEnd = this.value.length;
    });
    
    console.log('✅ [KEYBOARD] Listener do teclado físico configurado');
}

function setupCheckoutListeners() {
    console.log('🎯 [INIT] Configurando listeners...');

    // ✅ ADICIONAR ESTA LINHA AQUI (logo no início):
    setupPhysicalKeyboardListener();
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('checkoutModalOverlay');
            if (modal && modal.classList.contains('active')) {
                // AGORA CHAMA CONFIRMAÇÃO EM VEZ DE FECHAR DIRETO
                showCloseConfirmation();
            }
        }
    });
    
    // ⚠️ REMOVER ESTE BLOCO - não fechar ao clicar no overlay
    // const modal = document.getElementById('checkoutModalOverlay');
    // if (modal) {
    //     modal.addEventListener('click', function(e) {
    //         if (e.target === modal) closeCheckoutModal();
    //     });
    // }
    
    const placeOrder = document.getElementById('placeOrder');
    const placeOrderOverlay = document.getElementById('placeOrderOverlay');
    
    if (placeOrder) {
        placeOrder.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openCheckoutModal();
        });
    }
    
    if (placeOrderOverlay) {
        placeOrderOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openCheckoutModal();
        });
    }
    
    // Configura a modal de confirmação
    setupConfirmationModalListeners();
    
    // ... resto do código permanece igual
}
// ============================================
// GERENCIAMENTO DE CLIENTES
// ============================================

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function loadAndRenderCustomers() {
    console.log('🔄 [CLIENTS] Requisitando clientes...');
    
    fetch("http://localhost/Dash-POS/api/cliente.php?acao=listar_cliente", {
        method: "GET",
        cache: "no-store"
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('📥 [CLIENTS] JSON recebido:', data);
        
        let clientes = [];
        if (data.sucesso && Array.isArray(data.clientes)) {
            clientes = data.clientes.map(item => ({
                id: item.idcliente || 'N/A',
                nome: item.nome || item.nome_cliente || 'Sem nome',
                telefone: item.telefone || '-',
                email: item.email || '-',
                morada: item.morada || item.endereco || '-',
                nif: item.nif || '-'
            }));
            console.log('✅ [CLIENTS] Mapeados', clientes.length, 'clientes');
        } else {
            console.warn('⚠️ [CLIENTS] JSON inválido:', data.mensagem || data.erro);
            clientes = [];
        }
        
        renderCustomersTable(clientes);
    })
    .catch(error => {
        console.error('❌ [CLIENTS] Erro no fetch:', error);
        const tbody = document.getElementById('customerTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td class="py-4 px-4 text-red-500 text-center" colspan="5">❌ Erro ao carregar clientes.</td></tr>';
        }
    });
}

function loadAndRenderPaymentMethods() {
    console.log('🔄 [PAYMENTS] Requisitando métodos de pagamento...');
    
    return fetch("http://localhost/Dash-POS/api/pagamento.php?acao=listar_pagamento", {
        method: "GET",
        cache: "no-store"
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('📥 [PAYMENTS] JSON recebido:', data);
        
        let metodos = [];
        if (data.sucesso && Array.isArray(data.pagamentos)) {
            metodos = data.pagamentos.filter(pagamento => pagamento.ativo === "1");
            // ✅ ATUALIZADA: Incluir ID do método (assumir 'idpagamento' na API; ajuste se diferente)
            paymentMethods = metodos.map(item => ({
                id: item.idpagamento || item.id,  // ID real pro backend
                nome: item.forma,
                slug: generateSlug(item.forma)
            }));
            console.log('✅ [PAYMENTS] Carregados', paymentMethods.length, 'métodos com IDs:', paymentMethods);
        } else {
            console.warn('⚠️ [PAYMENTS] JSON inválido ou sem pagamentos:', data.mensagem || data.erro);
            paymentMethods = [];
        }
        
        renderPaymentCards();
        initializePaymentValues();
        return paymentMethods; // Retorna para encadeamento
    })
    .catch(error => {
        console.error('❌ [PAYMENTS] Erro no fetch:', error);
        paymentMethods = [];
        // Fallback para métodos padrão se a API falhar (sem IDs reais, use slug como fallback)
        paymentMethods = [
            { id: 1, nome: 'Dinheiro', slug: 'dinheiro' },
            { id: 2, nome: 'Cartão', slug: 'cartao' }, 
            { id: 3, nome: 'Transferência', slug: 'transferencia' }
        ];
        renderPaymentCards();
        initializePaymentValues();
        return paymentMethods;
    });
}

function generateSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function renderPaymentCards() {
    const container = document.getElementById('checkoutPaymentMethodsContainer');
    if (!container) {
        console.error('❌ [RENDER] #checkoutPaymentMethodsContainer não encontrado!');
        return;
    }
    
    if (paymentMethods.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4 italic">Nenhum método de pagamento disponível</div>';
        return;
    }
    
    const cardsHTML = paymentMethods.map(metodo => `
        <div class="checkout-payment-card bg-white border-2 border-gray-200 rounded-md p-3 text-center cursor-pointer transition-all duration-200 hover:shadow-sm" 
             data-metodo="${metodo.slug}">
            <div class="text-sm font-semibold text-gray-800 mb-1">${metodo.nome}</div>
            <div class="text-xs text-gray-500">Valor</div>
            <span class="valor-restante block mt-1 text-gray-400 text-xs"></span>
        </div>
    `).join('');
    
    container.innerHTML = cardsHTML;
    
    // Adiciona listeners dinamicamente após render
    const cards = container.querySelectorAll('.checkout-payment-card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const method = this.getAttribute('data-metodo');
            selectCheckoutPaymentMethod(this, method);
        });
    });
    
    console.log('✅ [RENDER] Cards renderizados com', paymentMethods.length, 'métodos');
}

function initializePaymentValues() {
    // ✅ CORREÇÃO: Limpa e recria o objeto sem reatribuir a variável
    for (const key in valoresPorMetodo) {
        if (valoresPorMetodo.hasOwnProperty(key)) {
            delete valoresPorMetodo[key];
        }
    }
    
    // ✅ GARANTE que paymentMethods existe antes de iterar
    if (!paymentMethods || !Array.isArray(paymentMethods)) {
        console.warn('⚠️ [VALUES] paymentMethods não definido, usando fallback');
        paymentMethods = [
            { nome: 'Dinheiro', slug: 'dinheiro' },
            { nome: 'Cartão', slug: 'cartao' }, 
            { nome: 'Transferência', slug: 'transferencia' }
        ];
    }
    
    paymentMethods.forEach(metodo => {
        valoresPorMetodo[metodo.slug] = 0;
    });
    console.log('💾 [VALUES] Valores inicializados:', valoresPorMetodo);
}


const debouncedSearchCustomers = debounce(function(query) {
    console.log('🔍 [SEARCH] Buscando por:', query);
    
    if (!query.trim()) {
        loadAndRenderCustomers();
        return;
    }
    
    fetch(`http://localhost/Dash-POS/api/cliente.php?acao=pesquisar_cliente&termo=${encodeURIComponent(query)}`, {
        method: "GET",
        cache: "no-store"
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('📥 [SEARCH] Resultados:', data);
        
        let clientes = [];
        if (data.sucesso && Array.isArray(data.clientes)) {
            clientes = data.clientes.map(item => ({
                id: item.idcliente || 'N/A',
                nome: item.nome || item.nome_cliente || 'Sem nome',
                telefone: item.telefone || '-',
                email: item.email || '-',
                morada: item.morada || item.endereco || '-',
                nif: item.nif || '-'
            }));
            console.log('✅ [SEARCH] Encontrados', clientes.length, 'clientes');
        } else {
            console.warn('⚠️ [SEARCH] Sem resultados');
            clientes = [];
        }
        
        renderCustomersTable(clientes);
    })
    .catch(error => {
        console.error('❌ [SEARCH] Erro:', error);
        const tbody = document.getElementById('customerTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td class="py-4 px-4 text-red-500 text-center" colspan="5">❌ Erro na busca.</td></tr>';
        }
    });
}, 300);

function renderCustomersTable(clientes) {
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) {
        console.error('❌ [RENDER] #customerTableBody não encontrado!');
        return;
    }
    
    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td class="py-4 px-4 text-gray-500 text-center italic" colspan="5">Nenhum cliente encontrado</td></tr>';
        return;
    }
    
    const limitedClientes = clientes.slice(0, 8);
    
    tbody.innerHTML = limitedClientes.map(cliente => `
        <tr class="border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors duration-150" 
            data-cliente='${JSON.stringify(cliente).replace(/'/g, '&#39;')}'>
            <td class="py-3 px-4 font-medium text-gray-900 truncate" title="${escapeHtml(cliente.nome)}">${escapeHtml(cliente.nome)}</td>
            <td class="py-3 px-4 text-gray-600 truncate">${escapeHtml(cliente.telefone)}</td>
            <td class="py-3 px-4 text-gray-600 truncate" title="${escapeHtml(cliente.email)}">${escapeHtml(cliente.email)}</td>
            <td class="py-3 px-4 text-gray-500 truncate" title="${escapeHtml(cliente.morada)}">${escapeHtml(cliente.morada)}</td>
            <td class="py-3 px-4 text-gray-500 truncate">${escapeHtml(cliente.nif)}</td>
        </tr>
    `).join('');
    
    tbody.querySelectorAll('tr[data-cliente]').forEach(row => {
        row.addEventListener('click', function() {
            try {
                const clienteData = this.getAttribute('data-cliente');
                const cliente = JSON.parse(clienteData.replace(/&#39;/g, "'"));
                selectCustomerFromTable(cliente);
            } catch (error) {
                console.error('❌ [CLICK] Erro ao parsear cliente:', error);
            }
        });
    });
    
    console.log('✅ [RENDER] Tabela atualizada com', limitedClientes.length, 'clientes');
}

function searchCustomer() {
    const query = document.getElementById('checkoutFullName')?.value || '';
    debouncedSearchCustomers(query);
}

// ✅ AJUSTE: Em selectCustomerFromTable, salva com ID da tabela (mas backend confirmará)
function selectCustomerFromTable(cliente) {
    console.log('👤 [SELECT] Cliente selecionado:', cliente.nome);
    
    if (!cliente || !cliente.nome) {
        console.warn('⚠️ [SELECT] Dados inválidos');
        return;
    }
    
    const nomeInput = document.getElementById('checkoutFullName');
    const emailInput = document.getElementById('checkoutEmail');
    const phoneInput = document.getElementById('checkoutPhone');
    const addressInput = document.getElementById('checkoutAddress');
    const nifInput = document.getElementById('checkoutNif');
    
    if (nomeInput) {
        nomeInput.value = cliente.nome || '';
        nomeInput.removeEventListener('input', searchCustomer);
    }
    
    if (emailInput) emailInput.value = cliente.email !== '-' ? cliente.email : '';
    
    if (phoneInput && cliente.telefone !== '-') {
        const cleanPhone = cliente.telefone.replace(/^\+\d{1,3}\s*/, '').trim();
        phoneInput.value = cleanPhone;
    }
    
    if (addressInput) addressInput.value = cliente.morada !== '-' ? cliente.morada : '';
    if (nifInput) nifInput.value = cliente.nif !== '-' ? cliente.nif : '';
    
    // ✅ NOVA: Salva temporariamente com ID da tabela
    saveCheckoutCustomerData(cliente.id);
    
    console.log('✅ [SELECT] Formulário preenchido com ID temporário!');
    
    loadAndRenderCustomers();
    
    setTimeout(() => {
        if (nomeInput) {
            nomeInput.addEventListener('input', searchCustomer);
        }
    }, 200);
}

function checkoutPrevStep() {
    console.log('⬅️ [STEP] Voltando do step', checkoutCurrentStep, 'para', checkoutCurrentStep - 1);
    
    if (checkoutCurrentStep === 2) {
        metodoAtual = null;
        clearCheckoutCash();
        
        const cards = document.querySelectorAll('.checkout-payment-card');
        cards.forEach(c => c.classList.remove('active'));
    }
    
    // Não permite voltar antes do step 1
    if (checkoutCurrentStep > 1) {
        checkoutCurrentStep--;
        updateCheckoutStepDisplay();
        
        if (checkoutCurrentStep === 1 || checkoutCurrentStep === 2) {
            populateCheckoutOrderSummary();
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Retorna array com os métodos de pagamento que têm valor > 0
 * Útil para enviar ao backend e gerar fatura
 * ✅ ATUALIZADA: Agora inclui ID do método e usa parseFloat
 */
function getActivePaymentMethods() {
    const metodos = [];
    
    paymentMethods.forEach(metodo => {
        const slug = metodo.slug;
        let valor = 0;
        
        // Se é o método atual sendo editado, pega o valor sendo digitado
        if (slug === metodoAtual) {
            valor = parseFloat(checkoutCashAmount) || 0;  // ✅ ATUALIZADA: parseFloat pra decimais
        } else {
            // Se não, pega o valor salvo
            valor = parseFloat(valoresPorMetodo[slug]) || 0;
        }
        
        if (valor > 0) {
            metodos.push({
                id_metodo: metodo.id,  // ✅ NOVA: ID real pro backend
                valor: valor
            });
        }
    });
    
    console.log('📋 [ACTIVE METHODS]', metodos);
    return metodos;
}

// ✅ NOVA: Função auxiliar pra coletar todos os dados da venda pro backend
function getSaleDataForBackend() {
    const totalAPagar = checkoutPaymentData.total || 0;
    let somaPagamentos = 0;
    paymentMethods.forEach(metodo => {
        const slug = metodo.slug;
        if (slug === metodoAtual) {
            somaPagamentos += parseFloat(checkoutCashAmount) || 0;
        } else {
            somaPagamentos += parseFloat(valoresPorMetodo[slug]) || 0;
        }
    });
    
    const troco = somaPagamentos > totalAPagar ? Math.abs(somaPagamentos - totalAPagar) : 0;
    const observacao = document.getElementById('checkoutObservation')?.value.trim() || '';
    
    return {
        acao: 'fatura-recibo',  // ✅ ATUALIZADO: fatura -> fatura-recibo
        id_cliente: checkoutCustomerData.id_cliente,  // Do Step 1
        metodos_pagamento: getActivePaymentMethods(),  // Array {id_metodo, valor} >0
        observacao: observacao,
        troco: troco,
        valor_pago: somaPagamentos
    };
}
// ============================================
// INICIALIZAÇÃO
// ============================================

// Inicializa valoresPorMetodo vazio
valoresPorMetodo = {};

// ============================================
// EXPORTA FUNÇÕES GLOBAIS
// ============================================
const toggleObservation = document.getElementById('toggleObservation');
  const observationArea = document.getElementById('observationArea');
  const obsArrow = document.getElementById('obsArrow');
  let isOpen = false;

  toggleObservation.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      observationArea.style.maxHeight = observationArea.scrollHeight + 'px';
      observationArea.style.opacity = '1';
      obsArrow.classList.add('rotate-180');
    } else {
      observationArea.style.maxHeight = '0px';
      observationArea.style.opacity = '0';
      obsArrow.classList.remove('rotate-180');
    }
  });

 // ============================================
//          FATURA A4
// ============================================

/* ======= INVOICE FUNCTIONS ======= */

/**
 * Preenche a fatura A4 com os dados da venda
 */


/**
 * Gera dados de exemplo para a fatura
 */


/**
 * Função para imprimir a fatura A4
 */


/**
 * Atualiza o STEP 4 para mostrar a fatura quando chegar nele
 */


// Funções auxiliares para cálculos (já devem existir no seu código)
function calculateCartSubtotal() {
    return [...cart.values()].reduce((total, item) => {
        return total + (item.qty * (item.customPrice || item.product.price));
    }, 0);
}

function calculateCartTax() {
    const subtotal = calculateCartSubtotal();
    return subtotal * TAX_RATE;
}

function calculateCartTotal() {
    const subtotal = calculateCartSubtotal();
    const tax = calculateCartTax();
    return subtotal + tax;
}

function getSelectedPaymentMethod() {
    // Implemente conforme seu sistema de pagamento
    return 'NUMERARIO';
}

// ============================================
// FATURAS
// ============================================




// ============================================
// ESTILOS PARA PREVIEW DA FATURA
// ============================================
(function addInvoiceStyles() {
    const style = document.createElement('style');
    style.id = 'invoice-preview-styles';
    style.textContent = `
        #invoice-preview-container {
            width: 100%;
            max-height: 600px;
            overflow-y: auto;
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        #invoice-preview-container #inv-a4-container-principal {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            z-index: 1 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
        }
        
        #invoice-preview-container .inv-a4-pagina-fatura,
        #invoice-preview-container .inv-a4-interface-fatura {
            margin: 0 auto 20px auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        #invoice-preview-container .inv-a4-container-multiplas-paginas {
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: center;
        }
    `;
    document.head.appendChild(style);
    console.log('✅ [STYLES] Estilos de preview adicionados');
})();
// ============================================
// ESTILOS PARA IMPRESSÃO
// ============================================
(function addPrintStyles() {
    const oldStyle = document.getElementById('invoice-print-styles');
    if (oldStyle) oldStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'invoice-print-styles';
    style.textContent = `
        @media print {
            @page {
                margin: 0;
                size: A4 portrait;
            }
            
            body * {
                visibility: hidden !important;
            }
            
            #inv-a4-container-principal,
            #inv-a4-container-principal * {
                visibility: visible !important;
            }
            
            #inv-a4-container-principal {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: auto !important;
                background: white !important;
                z-index: 9999 !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            
            .inv-a4-container-multiplas-paginas {
                gap: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            .inv-a4-interface-fatura,
            .inv-a4-pagina-fatura {
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 12px !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                page-break-after: always !important;
                page-break-inside: avoid !important;
            }
            
            .inv-a4-interface-fatura:last-child,
            .inv-a4-pagina-fatura:last-child {
                page-break-after: auto !important;
            }
            
            .inv-a4-sessao-cabecalho,
            .inv-a4-sessao-corpo-central,
            .inv-a4-sessao-rodape {
                page-break-inside: avoid !important;
            }
        }
        
        @media screen {
            #inv-a4-container-principal {
                position: fixed !important;
                top: -9999px !important;
                left: -9999px !important;
                z-index: -1 !important;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('✅ [PRINT STYLES] Estilos aplicados');
})();


// ============================================
// MODAL DE CONFIRMAÇÃO PARA FECHAR
// ============================================

// ============================================
// NAVEGAÇÃO ENTRE STEPS
// ============================================
//function abrirImpressaoFatura() {

function showCloseConfirmation() {
    console.log('❓ [CONFIRM] Mostrando modal de confirmação...');
    
    const modal = document.getElementById('modal-confirm-dialog');
    const overlay = document.getElementById('overlay-confirm-dialog');
    const box = document.getElementById('box-confirm-dialog');
    
    if (!modal || !overlay || !box) {
        console.error('❌ [CONFIRM] Elementos da modal de confirmação não encontrados!');
        closeCheckoutModal(); // Fallback: fecha direto se a modal não existir
        return;
    }
    
    // Mostra a modal
    modal.classList.remove('hidden');
    
    // Força reflow para garantir a animação
    void modal.offsetWidth;
    
    // Animações
    overlay.style.opacity = '1';
    box.style.transform = 'scale(1)';
    box.style.opacity = '1';
    
    // Foco no botão de cancelar para acessibilidade
    setTimeout(() => {
        const cancelBtn = document.getElementById('cancel-confirm-dialog');
        if (cancelBtn) cancelBtn.focus();
    }, 100);
}

function hideCloseConfirmation() {
    console.log('✅ [CONFIRM] Escondendo modal de confirmação...');
    
    const modal = document.getElementById('modal-confirm-dialog');
    const overlay = document.getElementById('overlay-confirm-dialog');
    const box = document.getElementById('box-confirm-dialog');
    
    if (!modal || !overlay || !box) return;
    
    // Animações de saída
    overlay.style.opacity = '0';
    box.style.transform = 'scale(0.9)';
    box.style.opacity = '0';
    
    // Esconde após animação
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function setupConfirmationModalListeners() {
    console.log('🔧 [CONFIRM] Configurando listeners da modal de confirmação...');
    
    // Botão X da modal principal - AGORA CHAMA CONFIRMAÇÃO DINÂMICA
    // Verifica se o botão X existe no cabeçalho da modal de checkout
    // ✅ CORREÇÃO: Usar um seletor mais específico e confiável
    const closeBtn = document.querySelector('#checkoutModalOverlay .modal-content > div:first-child button');
    if (closeBtn) {
        // ✅ CORREÇÃO: Remover qualquer onclick existente e adicionar event listener
        closeBtn.onclick = null; // Remove onclick inline
        closeBtn.removeEventListener('click', showCloseConfirmation); // Remove listener antigo se existir
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showConfirmModal({
                title: 'Fechar Checkout?',
                message: 'Tem certeza que deseja fechar? Todo o progresso do checkout será perdido.',
                confirmText: 'Sim, Fechar',
                cancelText: 'Cancelar',
                confirmColor: 'red',
                icon: 'warning'
            }, closeCheckoutModal);
        });
        console.log('✅ [CONFIRM] Botão X da modal principal configurado');
    } else {
        console.warn('⚠️ [CONFIRM] Botão X da modal principal não encontrado');
    }
    
    // Botões da modal de confirmação
    const confirmBtn = document.getElementById('confirm-confirm-dialog');
    const cancelBtn = document.getElementById('cancel-confirm-dialog');
    const closeConfirmBtn = document.getElementById('close-confirm-dialog');
    const overlayConfirm = document.getElementById('overlay-confirm-dialog');
    
    // CONFIRMAR: Executa callback de confirmação
    if (confirmBtn) {
        confirmBtn.addEventListener('click', onConfirmAction);
    }
    
    // CANCELAR: Executa callback de cancelamento
    if (cancelBtn) {
        cancelBtn.addEventListener('click', onCancelAction);
    }
    
    // FECHAR (X): Executa callback de cancelamento
    if (closeConfirmBtn) {
        closeConfirmBtn.addEventListener('click', onCancelAction);
    }
    
    // OVERLAY: Clicar fora também cancela
    if (overlayConfirm) {
        overlayConfirm.addEventListener('click', onCancelAction);
    }
    
    // Tecla ESC na modal de confirmação
    document.addEventListener('keydown', function(e) {
        const confirmModal = document.getElementById('modal-confirm-dialog');
        if (e.key === 'Escape' && confirmModal && !confirmModal.classList.contains('hidden')) {
            onCancelAction();
        }
    });
    
    console.log('✅ [CONFIRM] Listeners da modal de confirmação configurados');
}
// ============================================
// SISTEMA DINÂMICO DE MODAL DE CONFIRMAÇÃO
// ============================================

let confirmCallback = null;
let cancelCallback = null;

/**
 * Mostra a modal de confirmação dinâmica
 * @param {Object} config - Configuração da modal
 * @param {Function} onConfirm - Callback quando confirmar
 * @param {Function} onCancel - Callback quando cancelar (opcional)
 */
function showConfirmModal(config = {}, onConfirm = null, onCancel = null) {
    console.log('❓ [CONFIRM] Mostrando modal de confirmação dinâmica...', config);
    
    // Guarda os callbacks
    confirmCallback = onConfirm;
    cancelCallback = onCancel;
    
    // Configurações padrão
    const defaultConfig = {
        title: "Are you sure?",
        message: "This action can't be undone. Please confirm if you want to proceed.",
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "blue", // blue, red, green, yellow
        icon: "warning" // warning, success, error, info, question
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    
    // Atualiza o conteúdo da modal
    updateConfirmModalContent(finalConfig);
    
    // Mostra a modal
    const modal = document.getElementById('modal-confirm-dialog');
    const overlay = document.getElementById('overlay-confirm-dialog');
    const box = document.getElementById('box-confirm-dialog');
    
    if (!modal || !overlay || !box) {
        console.error('❌ [CONFIRM] Elementos da modal de confirmação não encontrados!');
        return;
    }
    
    modal.classList.remove('hidden');
    
    // Força reflow para garantir a animação
    void modal.offsetWidth;
    
    // Animações
    overlay.style.opacity = '1';
    box.style.transform = 'scale(1)';
    box.style.opacity = '1';
    
    // Foco no botão de cancelar para acessibilidade
    setTimeout(() => {
        const cancelBtn = document.getElementById('cancel-confirm-dialog');
        if (cancelBtn) cancelBtn.focus();
    }, 100);
}

/**
 * Atualiza o conteúdo da modal baseado na configuração
 */
function updateConfirmModalContent(config) {
    const { title, message, confirmText, cancelText, confirmColor, icon } = config;
    
    // Atualiza textos
    const titleElement = document.getElementById('title-confirm-dialog');
    const messageElement = document.getElementById('desc-confirm-dialog');
    const confirmBtn = document.getElementById('confirm-confirm-dialog');
    const cancelBtn = document.getElementById('cancel-confirm-dialog');
    const iconElement = document.getElementById('icon-confirm-dialog');
    
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    if (confirmBtn) confirmBtn.textContent = confirmText;
    if (cancelBtn) cancelBtn.textContent = cancelText;
    
    // Atualiza cor do botão de confirmar
    if (confirmBtn) {
        // Remove classes de cor anteriores
        confirmBtn.className = confirmBtn.className.replace(/bg-(blue|red|green|yellow|gray)-600/g, '');
        confirmBtn.className = confirmBtn.className.replace(/hover:bg-(blue|red|green|yellow|gray)-700/g, '');
        
        // Adiciona nova cor
        const colorMap = {
            blue: 'bg-blue-600 hover:bg-blue-700',
            red: 'bg-red-600 hover:bg-red-700',
            green: 'bg-green-600 hover:bg-green-700',
            yellow: 'bg-yellow-600 hover:bg-yellow-700',
            gray: 'bg-gray-600 hover:bg-gray-700'
        };
        
        const colorClasses = colorMap[confirmColor] || colorMap.blue;
        confirmBtn.className += ` ${colorClasses}`;
    }
    
    // Atualiza ícone (opcional - você pode expandir esta parte)
    if (iconElement) {
        // Por enquanto mantemos o ícone padrão de warning
        // Você pode expandir para suportar diferentes ícones
        console.log('🎨 [CONFIRM] Ícone selecionado:', icon);
    }
}

/**
 * Esconde a modal de confirmação
 */
function hideConfirmModal() {
    console.log('✅ [CONFIRM] Escondendo modal de confirmação...');
    
    const modal = document.getElementById('modal-confirm-dialog');
    const overlay = document.getElementById('overlay-confirm-dialog');
    const box = document.getElementById('box-confirm-dialog');
    
    if (!modal || !overlay || !box) return;
    
    // Animações de saída
    overlay.style.opacity = '0';
    box.style.transform = 'scale(0.9)';
    box.style.opacity = '0';
    
    // Esconde após animação
    setTimeout(() => {
        modal.classList.add('hidden');
        // Limpa os callbacks
        confirmCallback = null;
        cancelCallback = null;
    }, 300);
}

/**
 * Quando usuário confirma
 */
function onConfirmAction() {
    console.log('✅ [CONFIRM] Ação confirmada pelo usuário');
    if (typeof confirmCallback === 'function') {
        confirmCallback();
    }
    hideConfirmModal();
}

/**
 * Quando usuário cancela
 */
function onCancelAction() {
    console.log('❌ [CONFIRM] Ação cancelada pelo usuário');
    if (typeof cancelCallback === 'function') {
        cancelCallback();
    }
    hideConfirmModal();
}

// ============================================
// EXPORTA FUNÇÕES GLOBAIS
// ============================================
// EXPORTA FUNÇÕES GLOBAIS
// ============================================

window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.checkoutNextStep = checkoutNextStep;
window.checkoutPrevStep = checkoutPrevStep;
window.selectCheckoutPaymentMethod = selectCheckoutPaymentMethod;
window.checkoutKeypadInput = checkoutKeypadInput;
window.addCheckoutQuickAmount = addCheckoutQuickAmount;
window.clearCheckoutCash = clearCheckoutCash;
window.backspaceCheckoutCash = backspaceCheckoutCash;
// ❌ REMOVIDO: window.processCheckoutPayment (duplicado - usar checkoutNextStep)
window.searchCustomer = searchCustomer;
window.getActivePaymentMethods = getActivePaymentMethods;
window.showCloseConfirmation = showCloseConfirmation; // ✅ NOVA
window.hideCloseConfirmation = hideCloseConfirmation; // ✅ NOVA

// ✅ NOVAS FUNÇÕES DA MODAL DINÂMICA
window.showConfirmModal = showConfirmModal;
window.hideConfirmModal = hideConfirmModal;
window.onConfirmAction = onConfirmAction;
window.onCancelAction = onCancelAction;

console.log('✅ [GLOBAL] Todas as funções exportadas');
