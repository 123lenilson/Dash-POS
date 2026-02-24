/* FACTURA80.JS - Sistema de Renderização para recibos térmicos 80mm */

// ✅ PROTEÇÃO CONTRA CARREGAMENTO DUPLICADO
if (window.FACTURA80_JS_LOADED) {
    console.warn('⚠️ factura80.js já foi carregado anteriormente. Ignorando...');
} else {
    window.FACTURA80_JS_LOADED = true;
    
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-AO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

function gerarHTMLFatura80(dadosFatura) {
    // Verifica se os dados obrigatórios estão presentes
    if (!dadosFatura || !dadosFatura.produtos) {
        console.error('❌ Dados da factura inválidos ou incompletos');
        return '';
    }
    
    // Gera as linhas da tabela de produtos
    const linhasProdutos = dadosFatura.produtos.map(produto => `
        <tr>
            <td>${produto.designacao}</td>
            <td >${produto.quantidade}</td>
            <td >${formatarMoeda(produto.precoUnitario)}</td>
            <td >${formatarMoeda(produto.desconto)}</td>
            <td >${produto.taxa}</td>
            <td >${formatarMoeda(produto.total)}</td>
        </tr>
    `).join('');
    
    // Gera as linhas do resumo de impostos
    const linhasImpostos = dadosFatura.impostos.map(imposto => `
        <tr>
            <td>${imposto.taxa}</td>
            <td class="align-right-inv80">${formatarMoeda(imposto.incidencia)}</td>
            <td class="align-right-inv80">${formatarMoeda(imposto.imposto)}</td>
        </tr>
    `).join('');
    
    // Gera as linhas das formas de pagamento
    const linhasPagamento = dadosFatura.formasPagamento.map(forma => `
        <div class="total-row-inv80">
            <span>${forma.metodo}</span>
            <span>${formatarMoeda(forma.valor)}</span>
        </div>
    `).join('');
    
    // HTML completo da factura
    const htmlFatura = `
        <!-- Meta tags para garantir a codificação correta -->
        <meta charset="UTF-8">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        
        <!-- Logo -->
        <div class="logo-inv80">
            <img src="${dadosFatura.empresa?.img_logo || '../assets/img/LOGOO.PNG'}" alt="Logo" class="logo-img-inv80" onerror="this.style.display='none'">
        </div>

        <!-- Empresa -->
        <div class="empresa-inv80">
            ${dadosFatura.empresa?.nome || 'Hélio Trading, LDA'}
        </div>
        <div class="empresa-info-inv80">
            NIF: ${dadosFatura.empresa?.nif || '5417048720'}<br>
            ${dadosFatura.empresa?.endereco || 'Endereço'}<br>
            ${dadosFatura.empresa?.localidade || 'Benfica-Luanda-Angola'}
        </div>

        <div class="separador-inv80"></div>

        <!-- Cliente -->
        <div class="box-cliente-inv80">
            <div class="cliente-row-inv80">
                <span><span class="label-inv80">Exmo sr(a):</span></span>
                <span><span class="label-inv80">Data de emissão:</span></span>
            </div>
            <div class="cliente-row-inv80">
                <span>${dadosFatura.cliente?.nome || 'Consumidor Final'}</span>
                <span>${dadosFatura.data || new Date().toLocaleDateString('pt-PT')} ${dadosFatura.hora || new Date().toLocaleTimeString('pt-PT')}</span>
            </div>
            <div class="cliente-row-inv80" style="margin-top: 3px;">
                <span><span class="label-inv80">NIF:</span></span>
                <span><span class="label-inv80">Factura Recibo</span></span>
            </div>
            <div class="cliente-row-inv80">
                <span>${dadosFatura.cliente?.nif || 'Consumidor Final'}</span>
                <span>${dadosFatura.numeroFatura || 'FR 001'}</span>
            </div>
            <div class="cliente-row-inv80" style="margin-top: 3px;">
                <span><span class="label-inv80">Contacto:</span></span>
                <span class="original-inv80">ORIGINAL</span>
            </div>
            <div class="cliente-row-inv80">
                <span>${dadosFatura.cliente?.telefone || '-'}</span>
                <span></span>
            </div>
        </div>

        <!-- Tabela de Produtos -->
        <table class="table-inv80">
            <thead>
                <tr>
                    <th>Desc</th>
                    <th >Qtd</th>
                    <th >Preço Uni.</th>
                    <th >Desc.(%)</th>
                    <th >Taxa(%)</th>
                    <th >Total</th>
                </tr>
            </thead>
            <tbody>
                ${linhasProdutos}
            </tbody>
        </table>

        <div class="separador-inv80"></div>

        <!-- Totais -->
        <div class="totais-inv80">
            <div class="total-row-inv80 destaque-inv80">
                <span>Total a pagar:</span>
                <span>${formatarMoeda(dadosFatura.totais?.valorAPagar || 0)}</span>
            </div>
            <div class="total-row-inv80">
                <span>Valor Pago:</span>
                <span>${formatarMoeda(dadosFatura.totais?.pago || 0)}</span>
            </div>
            <div class="total-row-inv80">
                <span>Troco:</span>
                <span>${formatarMoeda(dadosFatura.totais?.troco || 0)}</span>
            </div>
        </div>

        <div class="separador-inv80"></div>

        <!-- Meio de Pagamento -->
        <div class="pagamento-inv80">
            <div class="total-row-inv80">
                <span class="label-inv80">Meio de Pagamento</span>
                <span class="label-inv80">Valor</span>
            </div>
            ${linhasPagamento || `
            <div class="total-row-inv80">
                <span>NUMERÁRIO</span>
                <span></span>
            </div>`}
        </div>

        <div class="separador-inv80"></div>

        <!-- Software -->
        <div class="rodape-inv80">
            <p>${dadosFatura.infoSoftware || 'Ck34 -Processado por programa validado nº 466/AGT/2024 Kamba SGF'}</p>
        </div>

        <!-- Resumo de Imposto -->
        <div class="resumo-impostos-inv80">
            <h4>Resumo de imposto</h4>
            <table class="table-inv80 tax-summary-table">
                <thead>
                    <tr>
                        <th>Taxa</th>
                        <th class="align-right-inv80">Incidência</th>
                        <th class="align-right-inv80">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${linhasImpostos}
                </tbody>
            </table>
        </div>

        <div class="separador-inv80"></div>

        <!-- Rodapé Legal -->
        <div class="rodape-inv80">
            <p>Os bens e serviços foram colocados à disposição do adquirente na data e local do documento</p>
            <p style="margin-top: 5px;">Operador: ${dadosFatura.operador || '1'}</p>
        </div>

        <!-- Agradecimento -->
        <div class="agradecimento-inv80">
            Obrigado Volte sempre...
        </div>

        <!-- QR Code -->
        <div class="qrcode-container-inv80">
            <div id="qrcode-inv80"></div>
            <div class="qrcode-text-inv80" id="qrcode-inv80-numero">${dadosFatura.numeroFatura || 'FR 001'}</div>
        </div>
    `;
    
    return htmlFatura;
}

function renderizarFatura80(dadosFatura) {
    console.log('📄 Renderizando factura 80mm');
    console.log('📦 Dados da factura:', dadosFatura);
    
    // Verifica se o container principal existe, senão cria
    let container = document.getElementById('factura80-container-inv80');
    if (!container) {
        container = document.createElement('div');
        container.id = 'factura80-container-inv80';
        container.className = 'recibo-inv80';
        document.body.appendChild(container);
    }
    
    // Gera o HTML da factura
    const htmlFatura = gerarHTMLFatura80(dadosFatura);
    
    // Insere o HTML no container
    container.innerHTML = htmlFatura;
    
    // Gera o QR Code após um pequeno delay para garantir que o DOM foi atualizado
    setTimeout(() => {
        if (typeof QRCode !== 'undefined' && dadosFatura.numeroFatura) {
            // Limpa qualquer QR Code existente
            const qrcodeContainer = document.getElementById('qrcode-inv80');
            if (qrcodeContainer) {
                qrcodeContainer.innerHTML = '';
                
                new QRCode(qrcodeContainer, {
                    text: dadosFatura.numeroFatura,
                    width: 35,
                    height: 35,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }
    }, 100);
    
    console.log('✅ Factura 80mm renderizada com sucesso!');
}

// Função para preparar os dados da factura a partir do carrinho e dados do cliente
function prepararDadosFatura80(cart, checkoutCustomerData, checkoutPaymentData) {
    const now = new Date();
    const numeroFatura = `FR ${now.getFullYear()}/${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    // Prepara os produtos
    const produtos = [];
    cart.forEach((item) => {
        produtos.push({
            designacao: item.product.name,
            quantidade: String(item.qty),
            precoUnitario: item.customPrice || item.product.price,
            desconto: 0,
            taxa: 14, // Taxa padrão de 14%
            total: (item.customPrice || item.product.price) * item.qty
        });
    });
    
    // Prepara as formas de pagamento
    const formasPagamento = [];
    if (checkoutPaymentData.formasPagamento) {
        checkoutPaymentData.formasPagamento.forEach(forma => {
            formasPagamento.push({
                metodo: forma.metodo.toUpperCase(),
                valor: forma.valor
            });
        });
    } else {
        formasPagamento.push({
            metodo: 'NUMERÁRIO',
            valor: checkoutPaymentData.total || 0
        });
    }
    
    // Prepara os impostos
    const impostos = [];
    if (checkoutPaymentData.impostos) {
        checkoutPaymentData.impostos.forEach(imposto => {
            impostos.push({
                taxa: imposto.taxa,
                incidencia: imposto.incidencia,
                imposto: imposto.imposto
            });
        });
    } else {
        // Cálculo padrão de impostos
        const subtotal = checkoutPaymentData.subtotal || 0;
        const imposto = checkoutPaymentData.tax || (subtotal * 0.14);
        impostos.push({
            taxa: '14,00',
            incidencia: subtotal,
            imposto: imposto
        });
    }
    
    return {
        numeroFatura,
        data: now.toLocaleDateString('pt-PT'),
        hora: now.toLocaleTimeString('pt-PT'),
        empresa: {
            nome: 'Hélio Trading, LDA',
            nif: '5417048720',
            endereco: 'Av. Fidel de Castro',
            localidade: 'Benfica-Luanda-Angola',
            img_logo: '../assets/img/LOGOO.PNG'
        },
        cliente: {
            nome: checkoutCustomerData.fullName || 'CONSUMIDOR FINAL',
            nif: checkoutCustomerData.nif || 'Consumidor Final',
            telefone: checkoutCustomerData.phone || '-',
            endereco: checkoutCustomerData.address || '-'
        },
        produtos,
        totais: {
            subtotal: checkoutPaymentData.subtotal || 0,
            desconto: checkoutPaymentData.discount || 0,
            imposto: checkoutPaymentData.tax || 0,
            valorAPagar: checkoutPaymentData.total || 0,  // 🔥 Valor que o cliente DEVE pagar
            pago: checkoutPaymentData.pago || checkoutPaymentData.total || 0,
            troco: checkoutPaymentData.troco || 0
        },
        impostos,
        formasPagamento,
        observacao: document.getElementById('checkoutObservation')?.value || '',
        operador: '1',
        infoSoftware: 'Ck34 -Processado por programa validado nº 466/AGT/2024 Kamba SGF'
    };
}

// ✅ NOVA FUNÇÃO: Renderizar factura80 com dados vindos do backend
function renderizarFatura80ComDadosBackend(dadosBackend) {
    console.log('📥 [FACTURA80] Recebendo dados do backend:', dadosBackend);
    
    // ✅ TRANSFORMAR dados do backend no formato esperado pelo renderizador
    const dadosFatura = {
        numeroFatura: dadosBackend.codigo_documento || 'FR 001',
        data: dadosBackend.data_emissao || new Date().toLocaleDateString('pt-PT'),
        hora: dadosBackend.hora_emissao || new Date().toLocaleTimeString('pt-PT'),
        empresa: {
            nome: dadosBackend.dados_empresa?.Empresa || 'Hélio Trading, LDA',
            nif: dadosBackend.dados_empresa?.NIF || '5417048720',
            endereco: dadosBackend.dados_empresa?.endereco || 'Av. Fidel de Castro',
            localidade: dadosBackend.dados_empresa?.localidade || 'Benfica-Luanda-Angola',
            img_logo: dadosBackend.dados_empresa?.img_logo || '../assets/img/LOGOO.PNG'
        },
        cliente: {
            nome: dadosBackend.cliente?.nome || 'CONSUMIDOR FINAL',
            nif: dadosBackend.nif_cliente || dadosBackend.cliente?.nif || 'Consumidor Final',
            telefone: dadosBackend.telefone_cliente || dadosBackend.cliente?.telefone || '-',
            endereco: dadosBackend.endereco_cliente || dadosBackend.cliente?.endereco || '-'
        },
        produtos: (dadosBackend.produtos_fatura || []).map(p => ({
            designacao: p.designacao,
            quantidade: String(p.qtd),
            precoUnitario: p.preco_unitario,
            desconto: p.desconto_percentual || 0,
            taxa: p.taxa_percentual || 0,
            total: p.total
        })),
        totais: {
            subtotal: dadosBackend.total_iliquido || 0,
            desconto: dadosBackend.total_desconto || 0,
            imposto: dadosBackend.total_imposto || 0,
            valorAPagar: dadosBackend.valor_a_pagar || 0,  // 🔥 NOVO: Valor que o cliente DEVE pagar
            pago: dadosBackend.total_pago || 0,            // 💰 Valor efetivamente pago
            troco: dadosBackend.troco || 0
        },
        impostos: (dadosBackend.resumo_impostos || []).map(imp => ({
            taxa: String(imp.taxa_percentual),
            incidencia: imp.incidencia,
            imposto: imp.imposto
        })),
        formasPagamento: (dadosBackend.formas_pagamento || []).map(f => ({
            metodo: f.forma.toUpperCase(),
            valor: f.valor
        })),
        observacao: dadosBackend.observacao || '',
        operador: dadosBackend.nome_usuario || '1',
        infoSoftware: dadosBackend.info_software || 'Ck34 -Processado por programa validado nº 466/AGT/2024 Kamba SGF'
    };
    
    console.log('📦 [FACTURA80] Dados transformados:', dadosFatura);
    
    // ✅ CHAMAR a função de renderização
    renderizarFatura80(dadosFatura);
    
    console.log('✅ [FACTURA80] Renderização com dados do backend concluída!');
}

// Exportar as funções
window.renderizarFatura80 = renderizarFatura80;
window.prepararDadosFatura80 = prepararDadosFatura80;
window.renderizarFatura80ComDadosBackend = renderizarFatura80ComDadosBackend;
window.populateInvoice80 = renderizarFatura80ComDadosBackend;  // ✅ Alias para compatibilidade
window.formatarMoeda = formatarMoeda;

console.log('✅ factura80.js carregado');

} // Fecha o bloco de proteção contra carregamento duplicado
