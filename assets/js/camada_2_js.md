# Camada 1 — CSS (raiz, base, layout)

Este documento consolida todo o código JS da **raiz** de `assets/js/`, da pasta **ui/**, **utils/**, **invoice/**~



/* ================================================
   MÓDULO: factura.js 
   Ficheiro: assets/js/ui/invoice/factura.js
   Parte do sistema Dash-POS
   ================================================ */

/* FACTURA.JS - Sistema de Renderização com prefixo inv-a4- */

// ✅ PROTEÇÃO CONTRA CARREGAMENTO DUPLICADO
if (window.FACTURA_JS_LOADED) {
    console.warn('⚠️ factura.js já foi carregado anteriormente. Ignorando...');
} else {
    window.FACTURA_JS_LOADED = true;
    
const PRODUTOS_POR_PAGINA = 16;

function numeroParaExtenso(valor) {
    const [inteira, decimal] = valor.toFixed(2).split('.');
    const extensoInteira = converterParteInteira(parseInt(inteira));
    const extensoDecimal = converterParteDecimal(parseInt(decimal));
    
    if (extensoDecimal === 'zero centavos') {
        return extensoInteira;
    } else {
        return `${extensoInteira} e ${extensoDecimal}`;
    }
}

function converterParteInteira(numero) {
    if (numero === 0) return 'zero';
    
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
        'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
        'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    
    let resultado = '';
    
    if (numero >= 1000) {
        const milhares = Math.floor(numero / 1000);
        if (milhares === 1) {
            resultado += 'mil';
        } else {
            resultado += converterParteInteira(milhares) + ' mil';
        }
        numero %= 1000;
    }
    
    if (numero >= 100) {
        if (resultado !== '') resultado += ' ';
        const centena = Math.floor(numero / 100);
        if (numero === 100) {
            resultado += 'cem';
        } else {
            resultado += centenas[centena];
        }
        numero %= 100;
    }
    
    if (numero > 0) {
        if (resultado !== '') resultado += ' e ';
        
        if (numero < 20) {
            resultado += unidades[numero];
        } else {
            const dezena = Math.floor(numero / 10);
            const unidade = numero % 10;
            resultado += dezenas[dezena];
            if (unidade > 0) {
                resultado += ' e ' + unidades[unidade];
            }
        }
    }
    
    return resultado || 'zero';
}

function converterParteDecimal(decimal) {
    if (decimal === 0) return 'zero centavos';
    const extenso = converterParteInteira(decimal);
    if (decimal === 1) {
        return extenso + ' centavo';
    } else {
        return extenso + ' centavos';
    }
}

function numeroParaExtensoAOA(valor) {
    const [inteira, decimal] = valor.toFixed(2).split('.').map(Number);
    const extensoInteira = converterParteInteira(inteira);
    const extensoDecimal = decimal > 0 ? ` e ${converterParteInteira(decimal)} cêntimos` : '';
    const moeda = inteira === 1 ? 'kwanza' : 'kwanzas';
    return `${extensoInteira} ${moeda}${extensoDecimal}`;
}

function dividirProdutosEmPaginas(produtos) {
    const paginas = [];
    for (let i = 0; i < produtos.length; i += PRODUTOS_POR_PAGINA) {
        paginas.push(produtos.slice(i, i + PRODUTOS_POR_PAGINA));
    }
    return paginas;
}

function calcularTotalPagina(produtosPagina) {
    let totalPagina = 0;
    produtosPagina.forEach(produto => {
        const totalNumerico = parseFloat(
            produto.total.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
        ) || 0;
        totalPagina += totalNumerico;
    });
    return totalPagina;
}

function calcularTransportado(paginaAtual, todasPaginas) {
    if (paginaAtual <= 1) return 0;
    let transportado = 0;
    for (let i = 0; i < paginaAtual - 1; i++) {
        transportado += calcularTotalPagina(todasPaginas[i]);
    }
    return transportado;
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-AO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

function criarPaginaFatura(produtos, numeroPagina, totalPaginas, todasPaginas, dadosFatura) {
    const pagina = document.createElement('div');
    pagina.className = 'inv-a4-pagina-fatura inv-a4-interface-fatura';
    
    const valorTransportar = calcularTotalPagina(produtos);
    const valorTransportado = numeroPagina > 1 ? calcularTransportado(numeroPagina, todasPaginas) : 0;
    const mostrarTransportar = numeroPagina === 1 && totalPaginas > 1;
    const mostrarTransportado = numeroPagina > 1;
    
    pagina.innerHTML = `
        <!-- Meta tags para garantir a codificação correta -->
        <meta charset="UTF-8">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        
        <div class="inv-a4-sessao-cabecalho">
            <div class="inv-a4-infor-empresa">
                <div><img src="${dadosFatura.empresa?.img_logo || '../assets/img/LOGOO.PNG'}" alt="Logo" onerror="this.style.display='none'"></div>
                <h3>${dadosFatura.empresa?.Empresa || 'HELIO TRADING, LDA'}</h3>
                <div class="inv-a4-dados-empresa">
                    <span>Endereço: ${dadosFatura.empresa?.endereco || 'Av. Fidel de Castro, Via Expressa, Benfica'}</span>
                    <span>Contato: ${dadosFatura.empresa?.contacto || '933691850-991768066'}</span>
                    <span>Email: ${dadosFatura.empresa?.emailE || 'comercial1@heliotrading.net'}</span>
                    <span>NIF: ${dadosFatura.empresa?.NIF || '5417048720'}</span>
                </div>
            </div>
            <div class="inv-a4-cabe-fatura">
                <div class="inv-a4-titulo-fatura">
                    <div>
                        <h4>${dadosFatura.titulo_documento || 'FACTURA RECIBO'}</h4>
                        <span style="font-family: Arial; font-size: 18px;">Original</span>
                    </div>
                </div>
                <div class="inv-a4-container-infor-cliente">
                    <div class="inv-a4-infor-cliente">
                        <span style="font-size: 15px;">EXMO SR(a).</span>
                        <span style="font-size: 15px; font-weight: bold;">${dadosFatura.cliente.nome}</span>
                    </div>
                    <div class="inv-a4-codigo-barra-fatura">
                        <div class="inv-a4-qrcode-container">
                            <div id="inv-a4-qrcode-${numeroPagina}"></div>
                            <span class="inv-a4-qrcode-text">${dadosFatura.numeroFatura}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="inv-a4-sessao-corpo-central">
            ${mostrarTransportado ? `<div class="inv-a4-transportado-valor inv-a4-transportado-esquerda"><span class="inv-a4-text-transportado-1">Transportado:</span><span class="inv-a4-text-transportado-2">${formatarMoeda(valorTransportado)} AOA</span></div>` : ''}
            <div class="inv-a4-tabela-cabecalho-corpo">
                <table>
                    <tr>
                        <th>Data:</th><th>Hora:</th><th>Contribuinte:</th><th>Telefone:</th><th>Endereço:</th>
                    </tr>
                    <tr>
                        <td>${dadosFatura.data}</td>
                        <td>${dadosFatura.hora}</td>
                        <td>${dadosFatura.cliente.nif || 'Consumidor Final'}</td>
                        <td>${dadosFatura.cliente.telefone}</td>
                        <td>${dadosFatura.cliente.endereco || '-'}</td>
                    </tr>
                </table>
            </div>
            <div class="inv-a4-tabela-produtos">
                <table>
                    <thead><tr><th>Nº.</th><th>Designação</th><th>Qtd.</th><th>P. Unit.</th><th>Desc. %</th><th>Taxa %</th><th>Total</th></tr></thead>
                    <tbody>
                        ${produtos.map((p, i) => `<tr>
                            <td>${String((numeroPagina - 1) * PRODUTOS_POR_PAGINA + i + 1).padStart(3, '0')}</td>
                            <td>${p.designacao}</td><td>${p.quantidade}</td><td>${p.precoUnitario}</td>
                            <td>${p.desconto}</td><td>${p.taxa}</td><td>${p.total}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            ${mostrarTransportar ? `<div class="inv-a4-transportado-valor inv-a4-transportado-direita"><span class="inv-a4-text-transportado-1">A Transportar:</span><span class="inv-a4-text-transportado-2">${formatarMoeda(valorTransportar)} AOA</span></div>` : ''}
        </div>
        <div class="inv-a4-sessao-rodape">
            <div class="inv-a4-div-1">
                <div class="inv-a4-div-1-sub">Resumo de Imposto</div>
                <div class="inv-a4-div-1-sub">Processado por programa validado nº 466/AGT/2024</div>
            </div>
            <div class="inv-a4-div-2">
                <div class="inv-a4-tabela-impostos">
                    <table>
                        <thead><tr><th>Descrição</th><th>Taxa%</th><th>Incidência</th><th>Imposto</th><th>Motivo</th></tr></thead>
                        <tbody>
                            ${dadosFatura.impostos.map(imp => `<tr><td>${imp.descricao}</td><td>${imp.taxa}</td><td>${imp.incidencia}</td><td>${imp.imposto}</td><td>${imp.motivo || ''}</td></tr>`).join('')}
                        </tbody>
                    </table>
                    <div class="inv-a4-obs-fatura">
                        <h5>OBS.:</h5>
                        <p class="inv-a4-parag-obs-fatura">${dadosFatura.observacao || 'Sem observações'}</p>
                    </div>
                </div>
                <div class="inv-a4-resumo-fatura">
                    <table class="inv-a4-tab-1-resumo-fatura">
                        <tbody>
                            <tr><th>Total Ilíquido:</th><td>${formatarMoeda(dadosFatura.totais.subtotal)} AOA</td></tr>
                            <tr><th>Total Desconto:</th><td>${formatarMoeda(dadosFatura.totais.desconto)} AOA</td></tr>
                            <tr><th>Total Imposto:</th><td>${formatarMoeda(dadosFatura.totais.imposto)} AOA</td></tr>
                            <tr><th>Retenção:</th><td>${formatarMoeda(dadosFatura.totais.retencao || 0)} AOA</td></tr>
                            <tr><th>Total Pago:</th><td>${formatarMoeda(dadosFatura.totais.total)} AOA</td></tr>
                        </tbody>
                    </table>
                    <div class="inv-a4-valor-extenso">${numeroParaExtensoAOA(dadosFatura.totais.total)}</div>
                    <table class="inv-a4-tab-2-resumo-fatura">
                        <tbody>
                            <tr><th>Pagamento</th></tr>
                            ${dadosFatura.formasPagamento.map(f => `<tr><td>${f}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="inv-a4-div-3"><span>Os Bens/Serviços foram colocados à disposição do adquirente</span></div>
            <div class="inv-a4-div-4">
                <div><span class="inv-a4-operador">Operador:</span><span>${dadosFatura.operador}</span><p>IVA-Regime Geral</p></div>
                <div>Pag ${numeroPagina} de ${totalPaginas}</div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        if (typeof QRCode !== 'undefined') {
            new QRCode(document.getElementById(`inv-a4-qrcode-${numeroPagina}`), {
                text: `${dadosFatura.numeroFatura}-P${numeroPagina}`,
                width: 50, height: 50,
                colorDark: "#000000", colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, 100);
    
    return pagina;
}

function renderizarFaturaComPaginas(dadosFatura) {
    console.log('📄 Renderizando factura');
    console.log('📦 Total de produtos:', dadosFatura.produtos.length);
    
    const todasPaginas = dividirProdutosEmPaginas(dadosFatura.produtos);
    console.log('📄 Total de páginas:', todasPaginas.length);
    
    const container = document.getElementById('inv-a4-container-principal');
    
    if (!container) {
        console.error('❌ Container inv-a4-container-principal não encontrado!');
        return;
    }
    
    // Limpa o container
    container.innerHTML = '';
    
    // Cria container para múltiplas páginas
    const containerMultiplas = document.createElement('div');
    containerMultiplas.className = 'inv-a4-container-multiplas-paginas';
    
    // Gera cada página
    todasPaginas.forEach((produtosPagina, index) => {
        console.log(`📃 Criando página ${index + 1} com ${produtosPagina.length} produtos`);
        
        const paginaElement = criarPaginaFatura(
            produtosPagina, 
            index + 1, 
            todasPaginas.length, 
            todasPaginas, 
            dadosFatura
        );
        
        containerMultiplas.appendChild(paginaElement);
    });
    
    container.appendChild(containerMultiplas);
    
    console.log('✅ Factura renderizada com', todasPaginas.length, 'página(s)');
    console.log('📏 Altura do container:', container.scrollHeight, 'px');
    
    // Debug: Verifica se todas as páginas foram criadas
    const paginasGeradas = container.querySelectorAll('.inv-a4-interface-fatura');
    console.log('🔍 Páginas no DOM:', paginasGeradas.length);
    paginasGeradas.forEach((pag, idx) => {
        console.log(`   Página ${idx + 1}: ${pag.offsetHeight}px de altura`);
    });
}

function prepararDadosFatura(cart, checkoutCustomerData, checkoutPaymentData) {
    const now = new Date();
    const numeroFatura = `FR ${now.getFullYear()}/${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    const produtos = [];
    cart.forEach((item) => {
        produtos.push({
            designacao: item.product.name,
            quantidade: String(item.qty),
            precoUnitario: formatarMoeda(item.customPrice || item.product.price),
            desconto: "0",
            taxa: "14",
            total: formatarMoeda((item.customPrice || item.product.price) * item.qty)
        });
    });
    
    const formasPagamento = [];
    if (window.getActivePaymentMethods) {
        const metodos = window.getActivePaymentMethods();
        metodos.forEach(m => formasPagamento.push(`${m.metodo.toUpperCase()} - ${formatarMoeda(m.valor)} AOA`));
    }
    if (formasPagamento.length === 0) formasPagamento.push('NUMERÁRIO');
    
    return {
        numeroFatura,
        data: now.toLocaleDateString('pt-PT'),
        hora: now.toLocaleTimeString('pt-PT'),
        cliente: {
            nome: checkoutCustomerData.fullName || 'CONSUMIDOR FINAL',
            nif: checkoutCustomerData.nif || '',
            telefone: checkoutCustomerData.phone || '-',
            endereco: checkoutCustomerData.address || '-'
        },
        produtos,
        totais: {
            subtotal: checkoutPaymentData.subtotal || 0,
            desconto: checkoutPaymentData.discount || 0,
            imposto: checkoutPaymentData.tax || 0,
            retencao: 0,  // ✅ Para facturas do checkout local, retenção é sempre 0
            total: checkoutPaymentData.total || 0
        },
        impostos: [{
            descricao: 'IVA',
            taxa: '14.0',
            incidencia: formatarMoeda(checkoutPaymentData.subtotal || 0) + ' AOA',
            imposto: formatarMoeda(checkoutPaymentData.tax || 0)
        }],
        formasPagamento,
        observacao: document.getElementById('checkoutObservation')?.value || '',
        operador: 'JOSÉ CHISSUPE'
    };
}

window.renderizarFaturaComPaginas = renderizarFaturaComPaginas;
window.prepararDadosFatura = prepararDadosFatura;
window.formatarMoeda = formatarMoeda;

// ✅ NOVA FUNÇÃO: Renderizar factura com dados vindos do backend
function renderizarFaturaComDadosBackend(dadosBackend) {
    console.log('📥 [FACTURA] Recebendo dados do backend:', dadosBackend);
    
    // ✅ TRANSFORMAR dados do backend no formato esperado pelo renderizador
    const dadosFatura = {
        numeroFatura: dadosBackend.codigo_documento || 'F00001',
        titulo_documento: dadosBackend.titulo_documento || 'FACTURA RECIBO',
        data: dadosBackend.data_emissao || new Date().toLocaleDateString('pt-PT'),
        hora: dadosBackend.hora_emissao || new Date().toLocaleTimeString('pt-PT'),
        empresa: {
            Empresa: dadosBackend.dados_empresa?.Empresa || 'HELIO TRADING, LDA',
            endereco: dadosBackend.dados_empresa?.endereco || 'Av. Fidel de Castro, Via Expressa, Benfica',
            contacto: dadosBackend.dados_empresa?.contacto || '933691850-991768066',
            emailE: dadosBackend.dados_empresa?.emailE || 'comercial1@heliotrading.net',
            NIF: dadosBackend.dados_empresa?.NIF || '5417048720',
            img_logo: dadosBackend.dados_empresa?.img_logo || '../assets/img/LOGOO.PNG'
        },
        cliente: {
            nome: dadosBackend.cliente?.nome || 'CONSUMIDOR FINAL',
            nif: dadosBackend.nif_cliente || dadosBackend.cliente?.nif || '',
            telefone: dadosBackend.telefone_cliente || dadosBackend.cliente?.telefone || '-',
            endereco: dadosBackend.endereco_cliente || dadosBackend.cliente?.endereco || '-'
        },
        produtos: (dadosBackend.produtos_fatura || []).map(p => ({
            designacao: p.designacao,
            quantidade: String(p.qtd),
            precoUnitario: formatarMoeda(p.preco_unitario),
            desconto: String(p.desconto_percentual),
            taxa: String(p.taxa_percentual),
            total: formatarMoeda(p.total)
        })),
        totais: {
            subtotal: dadosBackend.total_iliquido || 0,
            desconto: dadosBackend.total_desconto || 0,
            imposto: dadosBackend.total_imposto || 0,
            retencao: dadosBackend.total_retencao || 0,
            total: dadosBackend.total_pago ?? dadosBackend.valor_a_pagar ?? 0
        },
        impostos: (dadosBackend.resumo_impostos || []).map(imp => ({
            descricao: imp.descricao,
            taxa: String(imp.taxa_percentual),
            incidencia: formatarMoeda(imp.incidencia) + ' AOA',
            imposto: formatarMoeda(imp.imposto),
            motivo: imp.motivo || ''  // ✅ Adiciona campo motivo
        })),
        formasPagamento: (dadosBackend.formas_pagamento || []).map(f => 
            f.forma.toUpperCase()  // ✅ Remove o valor, exibe apenas a forma
        ),
        observacao: dadosBackend.observacao || '',
        operador: dadosBackend.nome_usuario || 'SISTEMA'
    };
    
    console.log('📦 [FACTURA] Dados transformados:', dadosFatura);
    
    // ✅ Busca ou cria o container
    let container = document.getElementById('inv-a4-container-principal');
    
    if (!container) {
        console.log('📦 Criando container de impressão...');
        container = document.createElement('div');
        container.id = 'inv-a4-container-principal';
        document.body.appendChild(container);
    }
    
    // Esconde na tela
    container.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 210mm;
        height: 297mm;
        background: white;
        z-index: -1;
    `;
    
    // ✅ CHAMAR a função de renderização existente
    renderizarFaturaComPaginas(dadosFatura);
    
    console.log('✅ [FACTURA] Renderização com dados do backend concluída!');
}

// Exportar a nova função
window.renderizarFaturaComDadosBackend = renderizarFaturaComDadosBackend;

console.log('✅ factura.js carregado com prefixo inv-a4-');

} // Fecha o bloco de proteção contra carregamento duplicado


      /* ================================================
   FIM do Factura.js

   ================================================ */




   /* ================================================
   MÓDULO: factura80.js 
   Ficheiro: assets/js/ui/invoice/factura80.js
   Parte do sistema Dash-POS
   ================================================ */


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




         /* ================================================
   FIM do factura80.js

   ================================================ */

/* ================================================
   MÓDULO: Alerts UI
   Ficheiro: assets/js/ui/alerts.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/** Remove ícone/emoji no início do texto para evitar duplicar o ícone do próprio alerta */
function stripLeadingIcon(str) {
  if (typeof str !== 'string') return str;
  let s = str.trimStart();
  if (!s.length) return str;
  const first = s[0];
  if (!/\p{L}/u.test(first) && !/\p{N}/u.test(first)) {
    s = s.slice(1);
    if (s.length && (s[0] === '\uFE0F' || /\p{M}/u.test(s[0]))) s = s.slice(1);
    s = s.trimStart();
  }
  return s;
}

// Função para criar e exibir alertas
function showAlert(type, title, message, duration = 4000) {
  title = stripLeadingIcon(String(title));
  message = stripLeadingIcon(String(message));
  console.log(`🔔 showAlert chamado: [${type}] ${title} - ${message}`);
  const container = document.getElementById("alertContainer");
  if (!container) {
    console.warn("❌ Alert container não encontrado!");
    return;
  }
  console.log('✅ Alert container encontrado, criando alerta...');

  const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Ícones para cada tipo
  const icons = {
    success: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
    `,
    error: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    `,
    warning: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>
    `,
    info: `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    `
  };

  const alert = document.createElement("div");
  alert.id = alertId;
  alert.className = `alert ${type} alert-enter`;

  alert.innerHTML = `
    <div class="alert-content">
      <div class="alert-icon">
        ${icons[type] || icons.info}
      </div>
      <div class="alert-text">
        <span class="alert-title">${title}</span>
        <span class="alert-message">${message}</span>
      </div>
    </div>
    <button class="alert-close" onclick="closeAlert('${alertId}')">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  `;

  container.appendChild(alert);

  // Auto-remove após duração
  setTimeout(() => {
    closeAlert(alertId);
  }, duration);
}

function closeAlert(alertId) {
  const alert = document.getElementById(alertId);
  if (alert) {
    alert.classList.remove('alert-enter');
    alert.classList.add('alert-exit');

    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 300);
  }
}

/**
 * Exibe um alerta crítico no topo da tela
 * Usado para situações críticas como: perda de conexão, erros graves, alertas de segurança
 *
 * @param {string} message - Mensagem do alerta crítico
 * @param {number} duration - Duração em ms (0 = sem auto-dismiss, alerta fica até usuário fechar)
 */
function showCriticalAlert(message, duration = 0) {
  console.log(`🚨 showCriticalAlert: ${message}`);

  // Cria o container se não existir
  let container = document.getElementById("criticalAlertContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "criticalAlertContainer";
    document.body.appendChild(container);
  }

  const alertId = `critical-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Ícone de alerta crítico (círculo com exclamação)
  const icon = `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke-width="2" stroke-linecap="round"></circle>
      <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"></line>
      <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none"></circle>
    </svg>
  `;

  // Ícone de fechar
  const closeIcon = `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  `;

  const alert = document.createElement("div");
  alert.id = alertId;
  alert.className = "alert-critical alert-critical-enter";
  alert.setAttribute("role", "alert");
  alert.setAttribute("aria-live", "assertive");

  alert.innerHTML = `
    <div class="alert-critical-content">
      <div class="alert-critical-icon">
        ${icon}
      </div>
      <span class="alert-critical-message">${message}</span>
    </div>
    <button class="alert-critical-close" onclick="closeCriticalAlert('${alertId}')" aria-label="Fechar alerta">
      ${closeIcon}
    </button>
  `;

  container.appendChild(alert);

  // Auto-remove após duração (se definida)
  if (duration > 0) {
    setTimeout(() => {
      closeCriticalAlert(alertId);
    }, duration);
  }
}

/**
 * Fecha um alerta crítico
 * @param {string} alertId - ID do alerta a ser fechado
 */
function closeCriticalAlert(alertId) {
  const alert = document.getElementById(alertId);
  if (alert) {
    alert.classList.remove('alert-critical-enter');
    alert.classList.add('alert-critical-exit');

    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 300);
  }
}



         /* ================================================
   FIM do Alerts UI

   ================================================ */



/* ================================================
   MÓDULO: Bottom Sheet UI
   Ficheiro: assets/js/ui/bottom-sheet.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/* ===== STICKY BOTTOM MENU + MODAL BOTTOM SHEET (≤905px) ===== */
function initBottomSheetSystem() {
  const stickyMenu = document.getElementById('stickyBottomMenu');
  const overlay = document.getElementById('bottomSheetOverlay');
  const sheet = document.getElementById('bottomSheet');
  const sheetTitle = document.getElementById('bottomSheetTitle');
  const sheetBody = document.getElementById('bottomSheetBody');
  const sheetClose = document.getElementById('bottomSheetClose');
  const sheetHandle = sheet ? sheet.querySelector('.bottom-sheet-handle') : null;
  const clientBtn = document.getElementById('stickyClientBtn');
  const cartBtn = document.getElementById('stickyCartBtn');
  const docTypeBtn = document.getElementById('stickyDocTypeBtn');
  const cartBadge = document.getElementById('stickyCartBadge');

  if (!sheet || !overlay || !clientBtn || !cartBtn || !docTypeBtn) {
    console.warn('Bottom sheet elements not found');
    return;
  }

  let currentPanel = null;
  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  function openBottomSheet(title, contentHTML, panelType) {
    currentPanel = panelType;
    if (sheetTitle) sheetTitle.textContent = title;
    if (panelType === 'client') {
      sheetBody.innerHTML = '';
      var panelBody = document.querySelector('#clientePanelSlider .panel-body-slider');
      if (panelBody) {
        var clone = panelBody.cloneNode(true);
        clone.className = 'panel-body-slider bottom-sheet-client-panel-body';
        sheetBody.appendChild(clone);

        clone.querySelectorAll('.client-card').forEach(function (card) {
          card.addEventListener('click', function () {
            var clientId = parseInt(card.dataset.clientId);
            if (typeof ClientModule !== 'undefined') ClientModule.selectClientById(clientId);
          });
        });

        var clonedSearch = clone.querySelector('#clientSearchInput');
        if (clonedSearch) {
          clonedSearch.id = 'clientSearchInput_sheet';
          clonedSearch.addEventListener('input', function (e) {
            var term = e.target.value;
            var allClients = (typeof ClientModule !== 'undefined') ? ClientModule.getAllClients() : [];
            var results = term.trim()
              ? ((typeof ClientModule !== 'undefined') ? ClientModule.filterClients(term) : [])
              : allClients;
            var listPanel = clone.querySelector('#clientListPanel');
            var listSec = clone.querySelector('#clientListSection');
            var formSec = clone.querySelector('#clientFormSection');
            var titleEl = clone.querySelector('#clientSearchTitle');
            if (!results.length && term.trim()) {
              if (listSec) listSec.style.display = 'none';
              if (formSec) formSec.style.display = 'block';
              if (titleEl) titleEl.textContent = 'NOME DO CLIENTE';
              return;
            }
            if (listSec) listSec.style.display = 'block';
            if (formSec) formSec.style.display = 'none';
            if (titleEl) titleEl.textContent = 'PROCURA POR CLIENTES AQUI';
            if (!listPanel) return;
            listPanel.innerHTML = results.slice(0, 6).map(function (c) {
              var esc = (typeof ClientModule !== 'undefined') ? ClientModule.escapeHtml : function (t) { return t; };
              return '<div class="client-card" data-client-id="' + c.idcliente + '">' +
                '<div class="client-card-content"><div class="client-card-name">' + esc(c.nome) + '</div>' +
                '<div class="client-card-details">' +
                '<span>Endereço: ' + esc(c.morada || 'N/A') + '</span> | ' +
                '<span>Telefone: ' + esc(c.telefone || 'N/A') + '</span> | ' +
                '<span>NIF: ' + esc(c.nif || 'N/A') + '</span>' +
                '</div></div></div>';
            }).join('');
            listPanel.querySelectorAll('.client-card').forEach(function (card) {
              card.addEventListener('click', function () {
                if (typeof ClientModule !== 'undefined') ClientModule.selectClientById(parseInt(card.dataset.clientId));
              });
            });
          });
        }

        var clonedForm = clone.querySelector('#newClientForm');
        if (clonedForm) {
          clonedForm.id = 'newClientForm_sheet';
          clonedForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var nameInput = clone.querySelector('#clientSearchInput_sheet') || clone.querySelector('[id^="clientSearchInput"]');
            var nifInput = clone.querySelector('#newClientNif');
            var phoneInput = clone.querySelector('#newClientPhone');
            var emailInput = clone.querySelector('#newClientEmail');
            var addressInput = clone.querySelector('#newClientAddress');
            var formData = {
              nome: nameInput ? nameInput.value.trim() : '',
              nif: nifInput ? nifInput.value.trim() : '',
              telefone: phoneInput ? phoneInput.value.trim() : '',
              email: emailInput ? emailInput.value.trim() : '',
              endereco: addressInput ? addressInput.value.trim() : ''
            };
            if (typeof ClientModule !== 'undefined') {
              var success = await ClientModule.saveNewClient(formData);
              if (success) {
                if (nameInput) nameInput.value = '';
                if (nifInput) nifInput.value = '';
                if (phoneInput) phoneInput.value = '';
                if (emailInput) emailInput.value = '';
                if (addressInput) addressInput.value = '';
                var listSec = clone.querySelector('#clientListSection');
                var formSec = clone.querySelector('#clientFormSection');
                if (listSec) listSec.style.display = 'block';
                if (formSec) formSec.style.display = 'none';
              }
            }
          });
        }
      }
    } else if (panelType === 'doctype') {
      sheetBody.innerHTML = '';
      var invoicePanel = document.querySelector('#docTypePanelSlider .invoice-type-options-panel');
      if (invoicePanel) {
        var docClone = invoicePanel.cloneNode(true);
        sheetBody.appendChild(docClone);

        // Handlers para selecção do tipo de factura
        docClone.querySelectorAll('.invoice-toggle-option').forEach(function (option) {
          option.addEventListener('click', function () {
            var invoiceType = this.getAttribute('data-invoice-type');
            if (!invoiceType) return;

            tipoDocumentoAtual = invoiceType;

            // Sincroniza painel original (radio + active)
            invoicePanel.querySelectorAll('.invoice-toggle-option').forEach(function (o) { o.classList.remove('active'); });
            var origOption = invoicePanel.querySelector('[data-invoice-type="' + invoiceType + '"]');
            if (origOption) {
              origOption.classList.add('active');
              var origRadio = origOption.querySelector('input[type="radio"]');
              if (origRadio) origRadio.checked = true;
            }

            // Actualiza visuais do clone
            docClone.querySelectorAll('.invoice-toggle-option').forEach(function (o) { o.classList.remove('active'); });
            this.classList.add('active');

            // Actualiza UI do dashboard
            if (typeof updateInvoiceTypeDisplay === 'function') updateInvoiceTypeDisplay(invoiceType);
            if (typeof window.updateOrderSummaryDescTabState === 'function') window.updateOrderSummaryDescTabState();
            if (typeof updateCartFooterLockIcons === 'function') updateCartFooterLockIcons(invoiceType);

            setTimeout(function () { closeBottomSheet(); }, 250);
          });
        });

        // Handlers para selecção de formato (A4 / 80mm)
        docClone.querySelectorAll('.format-toggle-option').forEach(function (option) {
          option.addEventListener('click', function (e) {
            e.stopPropagation();
            var format = this.getAttribute('data-format');
            if (!format) return;

            formatoFaturaAtual = format;

            // Sincroniza painel original
            invoicePanel.querySelectorAll('.format-toggle-option').forEach(function (o) { o.classList.remove('active'); });
            var origFormat = invoicePanel.querySelector('[data-format="' + format + '"]');
            if (origFormat) {
              origFormat.classList.add('active');
              var origRadio = origFormat.querySelector('input[type="radio"]');
              if (origRadio) origRadio.checked = true;
            }

            // Actualiza visuais do clone
            docClone.querySelectorAll('.format-toggle-option').forEach(function (o) { o.classList.remove('active'); });
            this.classList.add('active');

            if (typeof updateInvoiceTypeDisplay === 'function') updateInvoiceTypeDisplay(tipoDocumentoAtual);
          });
        });
      }
    } else if (panelType === 'cart') {
      // Restauração de segurança: elementos presos no sheetBody (transitionend falhou anteriormente)
      (function () {
        var _strandedHeader = sheetBody.querySelector('.cart-header');
        var _strandedArea = sheetBody.querySelector('#cartContentArea');
        var _strandedFooter = sheetBody.querySelector('.cart-footer');
        if (_strandedHeader || _strandedArea || _strandedFooter) {
          var _cp = document.getElementById('checkoutPanel');
          var _cbw = document.getElementById('cartBodyWrapper');
          var _cb = _cp ? _cp.querySelector('.cart-body') : null;
          if (_strandedHeader && _cp && _cb) _cp.insertBefore(_strandedHeader, _cb);
          if (_strandedArea && _cbw) _cbw.appendChild(_strandedArea);
          if (_strandedFooter && _cb) _cb.appendChild(_strandedFooter);
        }
      })();
      sheetBody.innerHTML = '';
      var checkoutPanel = document.getElementById('checkoutPanel');
      var cartHeader = checkoutPanel ? checkoutPanel.querySelector('.cart-header') : null;
      var cartBodyWrapper = document.getElementById('cartBodyWrapper');
      var cartContentArea = document.getElementById('cartContentArea');
      var cartFooter = checkoutPanel ? checkoutPanel.querySelector('.cart-footer') : null;
      if (cartHeader) sheetBody.appendChild(cartHeader);

      var docTypeNames = { 'factura-recibo': 'Factura-Recibo', 'factura-proforma': 'Factura Proforma', 'factura': 'Factura', 'orcamento': 'Orçamento' };
      var currentDocType = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
      var docTypeLabel = docTypeNames[currentDocType] || currentDocType || 'Factura';

      var tabBar = document.createElement('div');
      tabBar.className = 'cart-sheet-tabs';
      tabBar.setAttribute('role', 'tablist');
      tabBar.innerHTML = '<button type="button" class="cart-sheet-tab active" role="tab" aria-selected="true" data-cart-tab="fatura">' + docTypeLabel + '</button>' +
        '<button type="button" class="cart-sheet-tab" role="tab" aria-selected="false" data-cart-tab="ordem">Ordem de Venda</button>';
      sheetBody.appendChild(tabBar);

      var tabPanel = document.createElement('div');
      tabPanel.className = 'cart-sheet-tab-panel cart-sheet-tab-panel-fatura';
      if (cartContentArea) tabPanel.appendChild(cartContentArea);
      if (cartFooter) tabPanel.appendChild(cartFooter);
      sheetBody.appendChild(tabPanel);

      var ordemPanel = document.createElement('div');
      ordemPanel.className = 'cart-sheet-tab-panel cart-sheet-tab-panel-ordem';
      ordemPanel.setAttribute('hidden', '');
      ordemPanel.innerHTML = '<div class="cart-sheet-ordem-placeholder">Ordem de Venda (em breve)</div>';
      sheetBody.appendChild(ordemPanel);

      tabBar.querySelectorAll('.cart-sheet-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var tab = this.getAttribute('data-cart-tab');
          tabBar.querySelectorAll('.cart-sheet-tab').forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
          this.classList.add('active');
          this.setAttribute('aria-selected', 'true');
          sheetBody.querySelectorAll('.cart-sheet-tab-panel').forEach(function (p) { p.setAttribute('hidden', ''); });
          var target = sheetBody.querySelector('.cart-sheet-tab-panel-' + tab);
          if (target) { target.removeAttribute('hidden'); }
        });
      });

    } else {
      sheetBody.innerHTML = contentHTML;
    }
    if (panelType === 'doctype') {
      sheet.classList.add('bottom-sheet--short');
    } else {
      sheet.classList.remove('bottom-sheet--short');
    }
    document.body.style.overflow = 'hidden';
    overlay.classList.add('active');
    sheet.classList.remove('closing', 'slide-up');
    sheet.classList.add('active');
    sheet.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        sheet.classList.add('slide-up');
      });
    });
    initPanelContent(panelType);
  }

  function closeBottomSheet() {
    if (!sheet.classList.contains('active')) return;

    var panelType = currentPanel;
    currentPanel = null;
    sheet.classList.add('closing');

    var _closeDone = false;
    var _fallbackTimer = null;

    function _doClose() {
      if (_closeDone) return;
      _closeDone = true;
      clearTimeout(_fallbackTimer);
      sheet.removeEventListener('transitionend', _onTransitionEnd);
      sheet.classList.remove('active', 'closing', 'slide-up', 'bottom-sheet--short');
      sheet.style.transform = '';
      sheet.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('active');
      document.body.style.overflow = '';

      // client + doctype: conteúdo são clones — destruídos pelo innerHTML = '' abaixo.
      if (panelType === 'cart') {
        var cartHeader = sheetBody.querySelector('.cart-header');
        var cartContentArea = sheetBody.querySelector('#cartContentArea');
        var cartFooterEl = sheetBody.querySelector('.cart-footer');
        var checkoutPanelEl = document.getElementById('checkoutPanel');
        var cartBodyWrapperEl = document.getElementById('cartBodyWrapper');
        var cartBodyEl = checkoutPanelEl ? checkoutPanelEl.querySelector('.cart-body') : null;
        if (cartHeader && checkoutPanelEl && cartBodyEl) checkoutPanelEl.insertBefore(cartHeader, cartBodyEl);
        if (cartContentArea && cartBodyWrapperEl) cartBodyWrapperEl.appendChild(cartContentArea);
        if (cartFooterEl && cartBodyEl) cartBodyEl.appendChild(cartFooterEl);
      }

      setTimeout(function () { sheetBody.innerHTML = ''; }, 50);
    }

    function _onTransitionEnd(e) {
      if (e.target !== sheet || e.propertyName !== 'transform') return;
      _doClose();
    }

    // Fallback: garante limpeza/restauração mesmo que transitionend não dispare
    _fallbackTimer = setTimeout(_doClose, 500);
    sheet.addEventListener('transitionend', _onTransitionEnd);
  }

  function getClientPanelContent() {
    return ''; /* Conteúdo real é o painel desktop movido para o sheet em openBottomSheet */
  }

  function getCartPanelContent() {
    const items = [];
    cart.forEach(function (cartItem, productId) {
      const price = cartItem.customPrice != null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
      items.push({
        id: productId,
        name: cartItem.product.name || cartItem.product.descricao || 'Item',
        price: price,
        quantity: cartItem.qty
      });
    });

    if (items.length === 0) {
      return '<div class="empty-cart">' +
        '<i class="fa-solid fa-cart-shopping"></i>' +
        '<p>Carrinho vazio</p>' +
        '<span>Adicione produtos para começar</span>' +
        '</div>';
    }

    const itemsHTML = items.map(function (item, index) {
      return '<div class="cart-item" data-id="' + item.id + '">' +
        '<div class="cart-item-info">' +
        '<span class="cart-item-name">' + (item.name || 'Item') + '</span>' +
        '<span class="cart-item-price">' + currency.format(item.price) + '</span>' +
        '</div>' +
        '<div class="cart-item-qty">' +
        '<button class="qty-btn" data-action="decrease" data-id="' + item.id + '">-</button>' +
        '<span class="qty-value">' + item.quantity + '</span>' +
        '<button class="qty-btn" data-action="increase" data-id="' + item.id + '">+</button>' +
        '</div>' +
        '<button class="cart-item-remove" data-id="' + item.id + '">' +
        '<i class="fa-solid fa-trash"></i>' +
        '</button>' +
        '</div>';
    }).join('');

    let total = 0;
    items.forEach(function (item) {
      total += item.price * item.quantity;
    });

    return '<div class="cart-panel-content">' +
      '<div class="cart-items-list">' + itemsHTML + '</div>' +
      '<div class="cart-total">' +
      '<span>Total:</span>' +
      '<span class="cart-total-value">' + currency.format(total) + '</span>' +
      '</div>' +
      '</div>';
  }

  function getDocTypePanelContent() {
    return ''; /* Limpo por agora; conteúdo será o painel desktop (como no Cliente) */
  }

  function initPanelContent(panelType) {
    if (panelType === 'client') {
      /* Conteúdo é o painel desktop movido para o sheet; ClientManager já está ligado aos mesmos elementos. */

      // Fechar o bottom sheet quando um cliente for selecionado.
      // O listener é de uso único: remove-se a si próprio após disparar.
      function _onClientSelectedInSheet() {
        document.removeEventListener('clientSelected', _onClientSelectedInSheet);
        closeBottomSheet();
      }
      document.addEventListener('clientSelected', _onClientSelectedInSheet);

      // Garantir que os botões de fechar que vieram do painel desktop
      // também fechem o bottom sheet (em vez de apenas o painel slider).
      sheetBody.querySelectorAll(
        '.panel-close-slider, .client-panel-close-btn'
      ).forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          closeBottomSheet();
        });
      });
    }

    if (panelType === 'cart') {
      /* Conteúdo é o carrinho real (#cartContentArea) movido para o sheet; os cards já têm os handlers (removeCartProduct, toggleCardExpansion, etc.). */
    }

    if (panelType === 'doctype') {
      /* Handlers já ligados ao clone em openBottomSheet — nada a fazer aqui. */
    }
  }

  function updateStickyCartBadge() {
    if (!cartBadge) return;
    let total = 0;
    cart.forEach(function (item) {
      total += (item.qty || 0);
    });
    cartBadge.textContent = total;
    cartBadge.style.display = total > 0 ? 'flex' : 'none';
  }

  clientBtn.addEventListener('click', function () {
    openBottomSheet('Selecionar Cliente', getClientPanelContent(), 'client');
  });
  cartBtn.addEventListener('click', function () {
    openBottomSheet('Carrinho', '', 'cart');
  });
  docTypeBtn.addEventListener('click', function () {
    openBottomSheet('Tipo de Factura', getDocTypePanelContent(), 'doctype');
  });

  overlay.addEventListener('click', closeBottomSheet);
  if (sheetClose) sheetClose.addEventListener('click', closeBottomSheet);

  if (sheetHandle) {
    sheetHandle.addEventListener('touchstart', function (e) {
      isDragging = true;
      startY = e.touches[0].clientY;
      sheet.style.transition = 'none';
    });
    sheetHandle.addEventListener('touchmove', function (e) {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      var deltaY = currentY - startY;
      if (deltaY > 0) sheet.style.transform = 'translateY(' + deltaY + 'px)';
    });
    sheetHandle.addEventListener('touchend', function () {
      if (!isDragging) return;
      isDragging = false;
      sheet.style.transition = '';
      var deltaY = currentY - startY;
      if (deltaY > 100) closeBottomSheet();
      else sheet.style.transform = 'translateY(0)';
    });
  }

  updateStickyCartBadge();
  window.updateStickyCartBadge = updateStickyCartBadge;
  if (typeof updateStickyDocTypeLabel === 'function') updateStickyDocTypeLabel();
  window.closeBottomSheet = closeBottomSheet;
  window.openBottomSheet = openBottomSheet;
}




         /* ================================================
   FIM do Bottom Sheet UI

   ================================================ */


/* ================================================
   MÓDULO: Cart Editing UI
   Ficheiro: assets/js/ui/cart-editing.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/**
 * Previne a digitação de "0" e valores que excedem o stock
 * Funciona como calculadora: números sempre adicionados no final
 */
function preventZero(event, input) {
  const key = event.key || event.char;
  const currentValue = input.value;

  // Permite Backspace e Delete normalmente
  if (key === 'Backspace' || key === 'Delete') {
    quantityInputIsSelected = false; // Limpa a flag quando usuário edita manualmente
    return true;
  }

  // Bloqueia teclas de navegação
  if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End') {
    event.preventDefault();
    return false;
  }

  // Permite Tab
  if (key === 'Tab') {
    return true;
  }

  // Se não é número, bloqueia
  if (!/[0-9]/.test(key)) {
    event.preventDefault();
    return false;
  }

  // ✅ BLOQUEIA O COMPORTAMENTO PADRÃO - vamos inserir manualmente
  event.preventDefault();

  // Se está tentando digitar "0" como primeiro dígito
  if (key === '0' && (currentValue === '' || currentValue === '0')) {
    return false;
  }

  // Detecta seleção real: flag da expansão do card OU seleção DOM real (mouse/Shift+setas)
  const hasRealSelection = quantityInputIsSelected ||
    (input.selectionStart !== undefined && input.selectionStart !== input.selectionEnd);

  let newValue;
  if (hasRealSelection) {
    // Há seleção activa — substitui o conteúdo seleccionado pela tecla premida
    newValue = key;
    quantityInputIsSelected = false; // Limpa flag após usar
  } else {
    // Sem seleção — MODO CALCULADORA: adiciona no final
    newValue = currentValue + key;
  }

  const futureQty = parseInt(newValue);

  if (isNaN(futureQty)) {
    return false;
  }

  // Pega o productId do input
  const productId = input.id.replace('qty-', '');
  const id = parseInt(productId);

  // ✅ Busca o produto original em PRODUCTS para pegar o stock atualizado
  const product = PRODUCTS.find(p => p.id === id);

  if (product) {
    const isServico = product.ps && product.ps.toUpperCase() === 'S';
    const stockDisponivel = product.stock || 0;

    console.log('🔍 Validação Stock:', {
      productName: product.name,
      currentValue,
      key,
      newValue,
      futureQty,
      stockDisponivel,
      isServico
    });

    // Se é produto (não serviço) e quantidade futura excede o stock
    if (!isServico && futureQty > stockDisponivel) {
      // Mostra alerta crítico
      showCriticalAlert(`${product.name}: Quantidade máxima disponível em stock é ${stockDisponivel}.`, 3000);
      return false;
    }
  }

  // ✅ INSERE O NÚMERO NO FINAL MANUALMENTE
  input.value = newValue;

  // ✅ Mantém cursor no final
  input.setSelectionRange(newValue.length, newValue.length);

  // ✅ Dispara o evento oninput manualmente para atualizar o carrinho
  const inputEvent = new Event('input', { bubbles: true });
  input.dispatchEvent(inputEvent);

  return false;
}

/**
 * Valida e atualiza quantidade em tempo real
 * Impede a entrada de valores inválidos enquanto o usuário digita
 */
/**
 * Ativa o modo de edição quando o usuário começa a digitar no input de quantidade
 */
function startEditingQuantity() {
  modoEdicao = true;
  console.log('✏️ Modo de edição ATIVADO - Impedindo reload do carrinho');
}

/**
 * Desativa o modo de edição e sincroniza com a API após o usuário terminar de digitar
 * (finishEditingTimeout e pendingSync estão em state.js)
 */
function finishEditingQuantity(productId, input) {
  const id = parseInt(productId);
  const cartItem = cart.get(id);

  // Determina a quantidade a sincronizar:
  // se vazio, "0", NaN ou < 1 → fallback para 1
  let qty = parseInt(input.value);
  if (!cartItem || isNaN(qty) || qty < 1) {
    qty = 1;
  }

  // Corrige o input visualmente para o valor que vai ser sincronizado
  input.value = qty;

  // Regista para sincronização
  pendingSync = { id, qty };

  // Limpa o timeout anterior se existir
  if (finishEditingTimeout) {
    clearTimeout(finishEditingTimeout);
  }

  // Aguarda 500ms após o blur para desativar o modo de edição
  // Isso permite múltiplas edições sem reload entre elas
  finishEditingTimeout = setTimeout(() => {
    modoEdicao = false;
    console.log('✅ Modo de edição DESATIVADO - Permitindo reload do carrinho');

    // Sincroniza se houver dados pendentes
    if (pendingSync) {
      syncToAPI(pendingSync.id, pendingSync.qty, null);
      pendingSync = null;
    }
  }, 500);
}

/**
 * Força a sincronização imediata de qualquer edição pendente
 * Chamada quando o usuário troca de card
 */
function forceSyncPendingEdit() {
  if (pendingSync) {
    console.log('🔄 Sincronizando edição pendente imediatamente');
    syncToAPI(pendingSync.id, pendingSync.qty, null);
    pendingSync = null;
  }
}

function validateAndUpdateQuantity(productId, input) {
  // Converte productId para número (pode vir como string do HTML)
  const id = parseInt(productId);

  let value = input.value;

  // Remove qualquer caractere não numérico
  value = value.replace(/[^0-9]/g, '');

  // Pega referências do card e cartItem ANTES de qualquer validação
  const card = document.querySelector(`[data-product-id="${productId}"]`);
  const cartItem = cart.get(id);

  // Impede zeros à esquerda e valor "0"
  if (value === '0' || value.startsWith('0')) {
    input.value = '';
    // ✅ Atualiza visual mesmo quando vazio
    if (card && cartItem) {
      const qtySpan = card.querySelector('.product-quantity');
      if (qtySpan) {
        qtySpan.textContent = '0';
      }
    }
    return;
  }

  // Se o campo está vazio, atualiza visual para mostrar vazio/0
  if (value === '') {
    input.value = '';
    // ✅ Atualiza visual mesmo quando vazio
    if (card && cartItem) {
      const qtySpan = card.querySelector('.product-quantity');
      if (qtySpan) {
        qtySpan.textContent = '0';
      }
    }
    return;
  }

  // Garante que seja um número inteiro positivo >= 1
  const qty = parseInt(value);
  if (isNaN(qty) || qty < 1) {
    input.value = '';
    // ✅ Atualiza visual mesmo quando inválido
    if (card && cartItem) {
      const qtySpan = card.querySelector('.product-quantity');
      if (qtySpan) {
        qtySpan.textContent = '0';
      }
    }
    return;
  }

  // Define o valor limpo no input
  input.value = qty;

  // ✅ Atualiza IMEDIATAMENTE a quantidade e o preço total no resumo do card
  if (card && cartItem) {
    // Atualiza a quantidade visual - SEMPRE em tempo real
    const qtySpan = card.querySelector('.product-quantity');
    if (qtySpan) {
      qtySpan.textContent = qty;
    }

    // Calcula e atualiza o preço total
    const price = cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
    const total = price * qty;

    const totalSpan = card.querySelector('.product-total-price');
    if (totalSpan) {
      totalSpan.textContent = currency.format(total);
    }
  }

  // ✅ NÃO sincroniza durante a digitação - apenas atualiza localmente
  // A sincronização acontece no onblur (finishEditingQuantity)

  // Atualiza apenas o Map local sem chamar a API
  if (cartItem) {
    cartItem.qty = qty;
  }
}

/**
 * Aplica uma tecla do teclado numérico da tela ao input de quantidade.
 * Chamado por payment.ui.js quando o utilizador clica no keypad e o alvo é um input qty-*.
 * value: '0'..'9', 'C' (limpar), 'back' (apagar), '.' (ignorado)
 */
function handleQuantityKeypadKey(input, value) {
  if (!input || input.id == null || !input.id.startsWith('qty-')) return;
  const productId = input.id.replace('qty-', '');
  const id = parseInt(productId, 10);
  const currentRaw = (input.value || '').replace(/[^0-9]/g, '');

  if (value === 'C') {
    // Esvazia o input e activa a flag de substituição.
    // O comportamento é idêntico ao do botão 'back' quando o input fica vazio:
    // a próxima tecla (keypad ou teclado físico) substitui em vez de concatenar.
    input.value = '';
    quantityInputIsSelected = true;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  if (value === 'back') {
    let v = currentRaw.slice(0, -1);
    if (v === '' || v === '0') {
      // Input ficaria vazio: deixar vazio e activar flag de substituição.
      // A próxima tecla no keypad ou no teclado físico vai substituir,
      // como acontece na expansão inicial do card.
      input.value = '';
      quantityInputIsSelected = true;
    } else {
      input.value = v;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  if (value === '.') return;

  if (!/^[0-9]$/.test(value)) return;
  if (value === '0' && (currentRaw === '' || currentRaw === '0')) return;

  // Detecta seleção real: flag da expansão/back OU seleção DOM real (mouse/Shift+setas).
  // Cobre todos os cenários: expansão do card, seleção por mouse, seleção por Shift+setas,
  // e o caso em que back esvaziou o input e activou a flag.
  const hasRealSelection = (typeof quantityInputIsSelected !== 'undefined' && quantityInputIsSelected) ||
    (input.selectionStart !== undefined && input.selectionStart !== input.selectionEnd);

  let newValue;
  if (hasRealSelection) {
    newValue = value;                // substitui o conteúdo seleccionado
    quantityInputIsSelected = false; // limpa a flag após usar
  } else {
    newValue = currentRaw + value;   // comportamento normal: concatena
  }
  const futureQty = parseInt(newValue, 10);
  if (isNaN(futureQty)) return;

  const product = typeof PRODUCTS !== 'undefined' && PRODUCTS && PRODUCTS.find(function (p) { return p.id === id; });
  if (product) {
    const isServico = product.ps && String(product.ps).toUpperCase() === 'S';
    const stockDisponivel = product.stock || 0;
    if (!isServico && futureQty > stockDisponivel) {
      if (typeof showCriticalAlert === 'function') {
        showCriticalAlert(product.name + ': Quantidade máxima disponível em stock é ' + stockDisponivel + '.', 3000);
      }
      return;
    }
  }

  input.value = newValue;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Atualiza quantidade de um produto
 */
function updateCartProductQuantity(productId, newQty) {
  const qty = parseInt(newQty);

  // Validação: não aceita números abaixo de 1
  if (isNaN(qty) || qty < 1) {
    // Reverte o input para o valor anterior
    const qtyInput = document.getElementById(`qty-${productId}`);
    const cartItem = cart.get(productId);
    if (qtyInput && cartItem) {
      qtyInput.value = cartItem.qty;
    }
    return;
  }

  const cartItem = cart.get(productId);
  if (!cartItem) return;

  // Atualiza a quantidade no Map
  cartItem.qty = qty;

  // Atualiza o resumo visual (quantidade e total)
  const card = document.querySelector(`[data-product-id="${productId}"]`);
  if (card) {
    const qtySpan = card.querySelector('.product-quantity');
    const totalSpan = card.querySelector('.product-total-price');

    const price = cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
    const total = price * qty;

    if (qtySpan) qtySpan.textContent = qty;
    if (totalSpan) totalSpan.textContent = currency.format(total);
  }

  // Sincroniza com a API
  syncToAPI(productId, qty, null);
}

/**
 * Atualiza preço de um produto
 */
function updateCartProductPrice(productId, newPrice) {
  const price = parseFloat(newPrice);

  if (isNaN(price) || price < 0) return;

  const cartItem = cart.get(productId);
  if (!cartItem) return;

  // Atualiza o preço customizado
  cartItem.customPrice = price;

  // Atualiza o total visual
  const card = document.querySelector(`[data-product-id="${productId}"]`);
  if (card) {
    const totalSpan = card.querySelector('.product-total-price');
    const total = price * cartItem.qty;

    if (totalSpan) totalSpan.textContent = currency.format(total);
  }

  // Remove the numeric input event listener and disable formatter
  const input = document.getElementById(`price-${productId}`);
  if (input) {
    // Disable the formatter if it exists
    const formatter = window[`priceFormatter_${productId}`];
    if (formatter) {
      formatter.disable();
    }
    
    input.value = formatPriceDisplay(price);
    input.setAttribute('readonly', 'true');
  }

  // Sincroniza com a API enviando TAMBÉM a quantidade atual
  syncToAPI(productId, cartItem.qty, price);
}

/**
 * Inicia a edição do preço com duplo clique
 */
function startEditingPrice(productId, input) {
  const id = parseInt(productId);
  const cartItem = cart.get(id);
  
  if (!cartItem) return;
  
  const price = cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
  
  // ✅ CRITICAL FIX: Remove readonly BEFORE enabling formatter
  input.removeAttribute('readonly');
  
  // ✅ CORREÇÃO: Verifica se formatter JÁ EXISTE
  let formatter = window[`priceFormatter_${productId}`];
  
  if (!formatter) {
    // ✅ Cria APENAS se não existir
    formatter = new MonetaryFormatter(`price-${productId}`, {
      locale: 'pt-AO',
      currency: 'Kz',
      decimals: 2,
      onValueChange: (value) => {
        // Atualiza preview em tempo real
        const card = document.querySelector(`[data-product-id="${productId}"]`);
        if (card && cartItem) {
          const totalSpan = card.querySelector('.product-total-price');
          const total = value * cartItem.qty;
          if (totalSpan) totalSpan.textContent = currency.format(total);
        }
      }
    });
    
    // ✅ Armazena para reutilizar
    window[`priceFormatter_${productId}`] = formatter;
    console.log(`✅ [PRICE] Formatter criado para produto ${productId}`);
  } else {
    console.log(`♻️ [PRICE] Reutilizando formatter existente para produto ${productId}`);
  }
  
  // ✅ ATIVA o formatter (adiciona listeners)
  formatter.enable();
  
  // ✅ Define valor inicial
  formatter.setValue(price);
  
  // ✅ Foca no input
  input.focus();

  // ✅ Selecciona todo o conteúdo visualmente e activa a flag de substituição.
  // Comportamento idêntico ao input de quantidade quando o card expande:
  // a primeira tecla (física ou keypad) substitui em vez de concatenar.
  input.select();
  formatter.replaceOnNextInput = true;
  
  console.log('✏️ Editando preço do produto:', productId, '- Valor:', price);
}

/**
 * Submits the edited price when user clicks outside the input
 * Called on blur event
 */
function submitEditingPrice(productId, input) {
  const id = parseInt(productId);
  const formatter = window[`priceFormatter_${productId}`];
  
  if (!formatter) {
    console.warn('⚠️ [SUBMIT BLUR] Formatter not found for product:', productId);
    return;
  }
  
  // Get the new price from formatter
  const rawPrice = formatter.getValue();

  // Se o utilizador submeteu 0 ou vazio, reverter para o preço original do produto.
  // O preço original é cartItem.product.price (o que veio da API quando o produto
  // entrou no carrinho), não cartItem.customPrice (que pode já ter sido editado antes).
  const cartItem = cart.get(id);
  const originalProductPrice = cartItem ? parseFloat(cartItem.product.price) : 0;
  const newPrice = (rawPrice > 0) ? rawPrice : originalProductPrice;

  console.log(`💾 [SUBMIT BLUR] Submitting price ${newPrice} for product ${productId} (raw: ${rawPrice})`);

  // Validate price
  if (newPrice > 0) {
    // ✅ Update price
    updateCartProductPrice(id, newPrice);
    
    // ✅ Disable formatter
    formatter.disable();
    
    // ✅ Lock input
    input.setAttribute('readonly', 'true');
    
    console.log(`✅ [SUBMIT BLUR] Price saved: ${newPrice} for product ${productId}`);
  } else {
    console.warn(`⚠️ [SUBMIT BLUR] Invalid price, cancelling edit`);
    cancelEditingPrice(productId, input);
  }
}

/**
 * Handles blur event intelligently
 * Submits if value changed, cancels if ESC was pressed
 */
function handlePriceBlur(productId, input) {
  const id = parseInt(productId);
  const formatter = window[`priceFormatter_${productId}`];
  
  if (!formatter) {
    console.warn('⚠️ [BLUR] Formatter not found');
    return;
  }
  
  // ✅ Check if ESC was pressed
  if (isPriceEditCancelled) {
    console.log(`🚫 [BLUR] Cancelled by ESC flag, not submitting`);
    isPriceEditCancelled = false;  // Reset flag
    return;
  }
  
  // Get current value from formatter
  const currentValue = formatter.getValue();
  
  // Get original value from cart
  const cartItem = cart.get(id);
  const originalPrice = cartItem ? (cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price)) : 0;
  
  console.log(`🔍 [BLUR] Checking if price changed:`, {
    productId,
    original: originalPrice,
    current: currentValue,
    changed: currentValue !== originalPrice
  });
  
  // If value changed, submit; otherwise, just cancel
  if (currentValue !== originalPrice && currentValue >= 0) {
    console.log(`✅ [BLUR] Price changed, submitting...`);
    submitEditingPrice(productId, input);
  } else {
    console.log(`❌ [BLUR] No change or invalid value, cancelling...`);
    cancelEditingPrice(productId, input);
  }
}

/**
 * Salva edição de preço ao pressionar ENTER
 */
function handlePriceKeydown(event, productId, input) {
  const formatter = window[`priceFormatter_${productId}`];
  
  if (!formatter) {
    console.warn('⚠️ Formatter não encontrado para produto:', productId);
    return;
  }
  
  if (event.key === 'Enter') {
    event.preventDefault();
    
    const rawPrice = formatter.getValue();

    // Se o utilizador submeteu 0 ou vazio, reverter para o preço original do produto.
    const cartItem = cart.get(parseInt(productId));
    const originalProductPrice = cartItem ? parseFloat(cartItem.product.price) : 0;
    const newPrice = (rawPrice > 0) ? rawPrice : originalProductPrice;

    if (newPrice > 0) {
      // ✅ Atualiza preço
      updateCartProductPrice(parseInt(productId), newPrice);
      
      // ✅ DESATIVA o formatter (remove listeners)
      formatter.disable();
      
      // ✅ Bloqueia input novamente
      input.setAttribute('readonly', 'true');
      input.blur();
      
      console.log(`✅ Preço confirmado: ${newPrice} para produto ${productId}`);
    }
  } else if (event.key === 'Escape') {
    event.preventDefault();
    
    // ✅ Set cancellation flag
    isPriceEditCancelled = true;
    
    // ✅ Cancel edit
    cancelEditingPrice(productId, input);
    
    // ✅ DESATIVA o formatter
    formatter.disable();
    
    console.log(`🚫 Edit cancelled by ESC for product ${productId}`);
  }
  
  // ❌ NÃO delega para formatter.handleKeyboard() aqui
  // (o formatter já está escutando diretamente via seu próprio listener)
}

function formatPriceDisplay(value) {
  // Converte para número para garantir formatação correta
  const numValue = parseFloat(value) || 0;
  
  // Formata com separadores de milhar e 2 casas decimais (como o input de pagamento)
  const formatted = numValue.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatted;
}

/*
function handlePriceKeydownNumeric(event) {
  const input = event.target;
  const key = event.key;

  // BACKSPACE: Remove último caractere
  if (key === 'Backspace') {
    // Permitido - o próprio input lida com isso
    return;
  }

  // DELETE: Limpa tudo
  if (key === 'Delete') {
    event.preventDefault();
    // Limpa o input
    input.value = '';
    return;
  }

  // PONTO DECIMAL: Adiciona ponto (aceita . ou , ou Decimal do numpad)
  if (key === '.' || key === ',' || key === 'Decimal') {
    event.preventDefault();
    const currentValue = input.value;
    // Verifica se já existe ponto decimal
    if (currentValue.includes('.')) {
      console.log('⚠️ Já existe ponto decimal - ignorando');
      return;
    }
    // Adiciona ponto decimal
    input.value = currentValue + '.';
    return;
  }

  // NÚMEROS: Adiciona dígito
  if (/^[0-9]$/.test(key)) {
    event.preventDefault();
    const currentValue = input.value;
    input.value = currentValue + key;
    // Limita a 2 casas decimais após o ponto
    if (input.value.includes('.')) {
      const parts = input.value.split('.');
      if (parts[1] && parts[1].length > 2) {
        input.value = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    return;
  }

  // Arrow keys, Tab, Home, End são permitidos para navegação
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'].includes(key)) {
    return;
  }

  // Prevenir qualquer outro caractere
  event.preventDefault();
}
*/

/**
 * Cancela edição e restaura valor formatado
 */
function cancelEditingPrice(productId, input) {
  setTimeout(() => {
    const id = parseInt(productId);
    const cartItem = cart.get(id);

    if (cartItem) {
      const price = cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
      input.value = formatPriceDisplay(price);
    }

    // ✅ DESATIVA o formatter
    const formatter = window[`priceFormatter_${productId}`];
    if (formatter) {
      formatter.disable();
    }

    // Bloqueia input
    input.setAttribute('readonly', 'true');
    
    console.log(`❌ Edição cancelada para produto ${productId}`);
  }, 150);
}

/**
 * Remove produto do carrinho
 */
function handleInputKeydown(event, productId) {
  if (event.key === 'Enter') {
    event.preventDefault();

    // Encontra o card atual
    const card = document.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
      // Remove a classe expanded para colapsar o card
      card.classList.remove('expanded');
      // Limpa o registro do último card expandido
      lastExpandedProductId = null;
    }

    // Remove o foco do input (opcional, para evitar que continue editando)
    event.target.blur();
  }
}

// Expõe no global para os handlers inline (onfocus/onblur) no HTML gerado por cart.ui.js
window.startEditingQuantity = startEditingQuantity;
window.finishEditingQuantity = finishEditingQuantity;
window.handleQuantityKeypadKey = handleQuantityKeypadKey;

/**
 * Rastreia o input de quantidade ou preço focado para o teclado numérico da tela.
 * payment.ui.js usa window._keypadTargetInput para enviar teclas ao input correto.
 */
function initKeypadTargetTracking() {
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (el && el.id && (el.id.indexOf('qty-') === 0 || el.id.indexOf('price-') === 0)) {
      window._keypadTargetInput = el;
    }
  });
  document.addEventListener('focusout', function () {
    setTimeout(function () {
      var a = document.activeElement;
      // ✅ CORRECÇÃO: não apagar se o foco foi para outro input do carrinho (qty ou price).
      // Sem esta verificação, quando o foco passa do qty para o price input,
      // o setTimeout de 200ms apaga _keypadTargetInput porque o price input
      // não está dentro de .footer-keypad, tornando o keypad inoperante para preços.
      if (a && a.id && (a.id.startsWith('qty-') || a.id.startsWith('price-'))) {
        return; // foco está num input do carrinho — manter _keypadTargetInput
      }
      if (!a || !a.closest || !a.closest('.footer-keypad')) {
        window._keypadTargetInput = null;
      }
    }, 200);
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initKeypadTargetTracking);
} else {
  initKeypadTargetTracking();
}



         /* ================================================
   FIM Cart Editing UI

   ================================================ */

/* ================================================
   MÓDULO: Cart UI
   Ficheiro: assets/js/ui/cart.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= CART ======= */
function renderCart(resumoServidor = null) {
  const items = [...cart.values()];

  updateCartDisplay();

  if (items.length === 0) {
    if (cartEmptyState) cartEmptyState.style.display = 'flex';
    if (cartList) cartList.style.display = 'none';
    if (cartEmptyStateMobile) cartEmptyStateMobile.style.display = 'flex';
    if (cartListOverlay) cartListOverlay.style.display = 'none';
  } else {
    if (cartEmptyState) cartEmptyState.style.display = 'none';
    if (cartList) cartList.style.display = 'flex';
    if (cartEmptyStateMobile) cartEmptyStateMobile.style.display = 'none';
    if (cartListOverlay) cartListOverlay.style.display = 'flex';

    if (cartList) {
      cartList.innerHTML = items.map(({ product, qty, customPrice = product.price }) => {
        const line = customPrice * qty;
        const precoCustomizado = product.preco_customizado === "1" ? ' (Custom)' : '';
        return `
          <li class="cart-item" data-id="${product.id}">
            <div>
              <div class="title" style="cursor: pointer; padding: 2px 0;">${product.name}</div>
              <div class="meta">${currency.format(customPrice)}${precoCustomizado} × ${qty} = <strong>${currency.format(line)}</strong></div>
            </div>
            <div class="right">
              <button class="iconbtn" data-act="minus" aria-label="Diminuir">−</button>
              <div class="qty-display" style="min-width:24px; text-align:center; font-weight:700; cursor: pointer;">${qty}</div>
              <button class="iconbtn" data-act="plus" aria-label="Adicionar">+</button>
              <button class="iconbtn del" data-act="del" aria-label="Excluir">×</button>
            </div>
          </li>
        `;
      }).join('');
    }

    if (cartListOverlay) {
      cartListOverlay.innerHTML = items.map(({ product, qty, customPrice = product.price }) => {
        const line = customPrice * qty;
        const precoCustomizado = product.preco_customizado === "1" ? ' (Custom)' : '';
        return `
          <li class="cart-item" data-id="${product.id}">
            <div>
              <div class="title" style="cursor: pointer; padding: 2px 0;">${product.name}</div>
              <div class="meta">${currency.format(customPrice)}${precoCustomizado} × ${qty} = <strong>${currency.format(line)}</strong></div>
            </div>
            <div class="right">
              <button class="iconbtn" data-act="minus" aria-label="Diminuir">−</button>
              <div class="qty-display" style="min-width:24px; text-align:center; font-weight:700; cursor: pointer;">${qty}</div>
              <button class="iconbtn" data-act="plus" aria-label="Adicionar">+</button>
              <button class="iconbtn del" data-act="del" aria-label="Excluir">×</button>
            </div>
          </li>
        `;
      }).join('');
    }

    if (cartList) {
      cartList.querySelectorAll('.cart-item').forEach(row => {
        const id = +row.dataset.id;
        row.querySelector('[data-act="minus"]').addEventListener('click', () => addToCart(id, -1));
        row.querySelector('[data-act="plus"]').addEventListener('click', () => addToCart(id, +1));
        row.querySelector('[data-act="del"]').addEventListener('click', () => {
          const cartItem = cart.get(id);
          if (cartItem && cartItem.product) {
            showRemoveConfirmation(id, cartItem.product.name);
          } else {
            const productName = row.querySelector('.title')?.textContent || 'Item';
            showRemoveConfirmation(id, productName);
          }
        });
      });
    }

    if (cartListOverlay) {
      cartListOverlay.querySelectorAll('.cart-item').forEach(row => {
        const id = +row.dataset.id;
        row.querySelector('[data-act="minus"]').addEventListener('click', () => addToCart(id, -1));
        row.querySelector('[data-act="plus"]').addEventListener('click', () => addToCart(id, +1));
        row.querySelector('[data-act="del"]').addEventListener('click', () => {
          const cartItem = cart.get(id);
          if (cartItem && cartItem.product) {
            showRemoveConfirmation(id, cartItem.product.name);
          } else {
            const productName = row.querySelector('.title')?.textContent || 'Item';
            showRemoveConfirmation(id, productName);
          }
        });
      });
    }

    if (cartList) {
      cartList.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('.empty') || target.matches('.clear-all') || target.closest('.clear-all')) {
          showRemoveAllConfirmation();
        }
        if (target.closest('[data-act="checkout"]')) {
          checkout();
        }
      });
    }

    if (cartListOverlay) {
      cartListOverlay.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('.empty') || target.matches('.clear-all') || target.closest('.clear-all')) {
          showRemoveAllConfirmation();
        }
        if (target.closest('[data-act="checkout"]')) {
          checkout();
        }
      });
    }
  }

  let stats;
  let totalIliquido, totalImposto, totalRetencao, total;

  if (resumoServidor && resumoServidor.total_iliquido !== undefined) {
    console.log("✅ Usando resumo do BACKEND:", resumoServidor);
    stats = {
      items: resumoServidor.total_itens,
      subtotal: resumoServidor.total_iliquido
    };
    totalIliquido = resumoServidor.total_iliquido;
    totalImposto = resumoServidor.total_imposto;
    totalRetencao = resumoServidor.total_retencao;
    total = resumoServidor.total;
  } else {
    console.warn('⚠️ Resumo do backend não disponível - calculando localmente');
    let subtotal = 0;
    let itemCount = 0;
    cart.forEach((cartItem) => {
      const price = cartItem.customPrice !== null ? parseFloat(cartItem.customPrice) : parseFloat(cartItem.product.price);
      const qty = parseInt(cartItem.qty) || 0;
      subtotal += price * qty;
      itemCount += qty;
    });
    stats = { items: itemCount, subtotal: subtotal };
    totalIliquido = subtotal;
    totalImposto = 0;
    totalRetencao = 0;
    total = subtotal;
  }

  if (cartItemsCount) cartItemsCount.textContent = `${stats.items}`;
  if (cartSubtotal) cartSubtotal.textContent = currency.format(totalIliquido);
  if (cartDiscount) cartDiscount.textContent = currency.format(totalRetencao);
  if (cartTax) cartTax.textContent = currency.format(totalImposto);
  if (cartTotalBtn) cartTotalBtn.textContent = currency.format(total);

  if (cartItemsCountOverlay) cartItemsCountOverlay.textContent = `${stats.items}`;
  if (cartSubtotalOverlay) cartSubtotalOverlay.textContent = currency.format(totalIliquido);
  if (cartDiscountOverlay) cartDiscountOverlay.textContent = currency.format(totalRetencao);
  if (cartTaxOverlay) cartTaxOverlay.textContent = currency.format(totalImposto);
  if (cartTotalBtnOverlay) cartTotalBtnOverlay.textContent = currency.format(total);

  if (typeof window.updateStickyCartBadge === 'function') window.updateStickyCartBadge();

  updateOrderSummaryFooter(totalIliquido, totalImposto, totalRetencao, total);

  updateProductSelections();

  if (typeof scheduleRefreshPaymentMethodsOverflow === 'function') scheduleRefreshPaymentMethodsOverflow();
}

/* ======= GESTÃO DE CARDS DE PRODUTOS NO CARRINHO ======= */

function formatCurrencyInput(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "0,00 Kz";
  const formatted = num.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${formatted} Kz`;
}

function renderCartProductCard(productId, productData) {
  const { product, qty, customPrice } = productData;
  const price = customPrice !== null ? parseFloat(customPrice) : parseFloat(product.price);
  const total = price * qty;

  const card = document.createElement('div');
  card.className = 'cart-product-card';
  card.dataset.productId = productId;

  card.innerHTML = `
    <div class="card-summary" onclick="toggleCardExpansion('${productId}')">
      <i class="fa-solid fa-chevron-right expand-arrow"></i>
      <span class="product-quantity">${qty}</span>
      <span class="quantity-separator">×</span>
      <span class="product-name">${product.name}</span>
      <span class="product-total-price">${currency.format(total)}</span>
      <button class="btn-remove" onclick="event.stopPropagation(); removeCartProduct('${productId}')">
        ×
      </button>
    </div>
    <div class="card-expanded-area">
      <div class="inputs-grid">
        <div class="input-field">
          <label for="qty-${productId}">Quantidade:</label>
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            id="qty-${productId}"
            value="${qty}"
            onclick="event.stopPropagation(); quantityInputIsSelected = false;"
            onfocus="startEditingQuantity()"
            onblur="finishEditingQuantity('${productId}', this)"
            oninput="validateAndUpdateQuantity('${productId}', this)"
            onkeypress="return preventZero(event, this)"
            onkeydown="handleInputKeydown(event, '${productId}')"
          />
        </div>
        <div class="input-field">
          <label for="price-${productId}">Preço:</label>
          <input
            type="text"
            id="price-${productId}"
            data-formatter="price-${productId}"
            value="${formatCurrencyInput(price)}"
            readonly
            onclick="event.stopPropagation()"
            ondblclick="startEditingPrice('${productId}', this)"
            onkeydown="handlePriceKeydown(event, '${productId}', this)"
            onblur="handlePriceBlur('${productId}', this)"
          />
        </div>
      </div>
    </div>
  `;

  return card;
}

function updateCartDisplay() {
  const emptyState = document.getElementById('cartEmptyState');
  const productsContainer = document.getElementById('cartProductsContainer');

  if (!emptyState || !productsContainer) return;

  if (cart.size === 0) {
    emptyState.style.display = 'flex';
    productsContainer.style.display = 'none';
    productsContainer.innerHTML = '';
    lastExpandedProductId = null;
  } else {
    emptyState.style.display = 'none';
    productsContainer.style.display = 'flex';

    productsContainer.innerHTML = '';

    cart.forEach((productData, productId) => {
      const card = renderCartProductCard(productId, productData);
      productsContainer.appendChild(card);

      if (lastExpandedProductId !== null && productId === lastExpandedProductId) {
        setTimeout(() => {
          card.classList.add('expanded');
          const qtyInput = document.getElementById(`qty-${productId}`);
          if (qtyInput) {
            qtyInput.focus();
            qtyInput.select();
            quantityInputIsSelected = true;
          }
        }, 100);
      }
    });
  }

  if (typeof scheduleRefreshPaymentMethodsOverflow === 'function') scheduleRefreshPaymentMethodsOverflow();
}

function toggleCardExpansion(productId) {
  const numericId = parseInt(productId);

  isSwitchingCards = true;

  if (finishEditingTimeout) {
    clearTimeout(finishEditingTimeout);
    finishEditingTimeout = null;
  }

  if (pendingSync) {
    console.log('🔄 Sincronizando edição pendente (sem reload durante troca)');
    const cartItem = cart.get(pendingSync.id);
    if (cartItem) {
      cartItem.qty = pendingSync.qty;
    }
    setTimeout(() => {
      if (pendingSync) {
        syncToAPI(pendingSync.id, pendingSync.qty, null);
        pendingSync = null;
      }
    }, 200);
  }

  if (modoEdicao) {
    modoEdicao = false;
    console.log('✅ Modo de edição DESATIVADO (troca de card)');
  }

  const allCards = document.querySelectorAll('.cart-product-card');
  const clickedCard = document.querySelector(`[data-product-id="${productId}"]`);

  if (!clickedCard) {
    isSwitchingCards = false;
    return;
  }

  const wasExpanded = clickedCard.classList.contains('expanded');

  allCards.forEach(card => card.classList.remove('expanded'));

  if (!wasExpanded) {
    clickedCard.classList.add('expanded');
    lastExpandedProductId = numericId;

    setTimeout(() => {
      const qtyInput = document.getElementById(`qty-${productId}`);
      if (qtyInput) {
        qtyInput.focus();
        qtyInput.select();
        quantityInputIsSelected = true;
      }
    }, 100);
  } else {
    lastExpandedProductId = null;
    console.log('🔽 Card colapsado pelo usuário (Toggle)');
  }

  setTimeout(() => {
    isSwitchingCards = false;
    console.log('✅ Troca de card completa');
  }, 300);
}





         /* ================================================
   FIM do Cart UI

   ================================================ */


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



         /* ================================================
   FIM do Client Panel

   ================================================ */

/* ================================================
   MÓDULO: Invoice Type UI
   Ficheiro: assets/js/ui/invoice-type.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= CONTROLE DE TIPO DE DOCUMENTO ======= */
/**
 * Função para selecionar tipo de documento
 * Valida se o tipo já foi desenvolvido
 */
/* ======= CONTROLE DE TIPO DE DOCUMENTO - VERSÃO CORRIGIDA ======= */

/**
 * Retorna o tipo de documento atualmente selecionado
 */
function getTipoDocumentoAtual() {
  return tipoDocumentoAtual;
}

/**
 * Seleciona o formato de fatura (A4 ou 80mm)
 * Sincroniza todos os radio buttons e atualiza a interface
 */
function selecionarFormatoFatura(formato) {
  console.log(`📐 [FORMATO] Selecionando formato: ${formato}`);
  
  // ✅ 1. Valida formato
  if (formato !== 'A4' && formato !== '80mm') {
    console.warn(`⚠️ [FORMATO] Formato inválido: ${formato}. Usando A4.`);
    formato = 'A4';
  }
  
  // ✅ 2. Atualiza variável global
  formatoFaturaAtual = formato;
  
  // ✅ 3. Salva em localStorage
  localStorage.setItem('invoiceFormat', formato);
  
  // ✅ 4. Sincroniza TODOS os radio buttons
  const allRadios = document.querySelectorAll('input[name="invoiceFormat"]');
  allRadios.forEach(radio => {
    radio.checked = (radio.value === formato);
    
    // Atualiza classe visual do toggle pai
    const toggleParent = radio.closest('.format-toggle-option');
    if (toggleParent) {
      if (radio.value === formato) {
        toggleParent.classList.add('active');
      } else {
        toggleParent.classList.remove('active');
      }
    }
  });
  
  // ✅ 5. Atualiza display no cabeçalho do carrinho
  updateInvoiceFormatDisplay(formato);

  if (typeof updateStickyDocTypeLabel === 'function') updateStickyDocTypeLabel();

  // Factura-Recibo (A4 ou 80mm): garantir que a aba Desc. e os blocos do rodapé ficam sem cadeado
  if (typeof window.updateOrderSummaryDescTabState === 'function') window.updateOrderSummaryDescTabState();
  var currentType = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
  if (typeof updateCartFooterLockIcons === 'function') updateCartFooterLockIcons(currentType);

  console.log(`✅ [FORMATO] Formato selecionado: ${formato}`);
}

/**
 * Retorna o formato de fatura atualmente selecionado
 */
function getInvoiceFormat() {
  return formatoFaturaAtual;
}

/**
 * Inicializa o formato de fatura (chamado no carregamento)
 */
function initInvoiceFormat() {
  // Tenta carregar do localStorage
  const savedFormat = localStorage.getItem('invoiceFormat');
  const initialFormat = savedFormat || 'A4';
  
  console.log(`🔧 [FORMATO] Inicializando com formato: ${initialFormat}`);
  
  // Aplica seleção inicial
  selecionarFormatoFatura(initialFormat);
}
// Função para mostrar o seletor de formato de fatura (painel único - formatSubOptions)
function showInvoiceFormatSelector() {
  const formatSubOptions = document.getElementById('formatSubOptions');
  if (formatSubOptions) {
    formatSubOptions.style.display = 'flex';
  }
  const formatRadios = document.querySelectorAll('input[name="invoiceFormat"]');
  let hasSelection = false;
  formatRadios.forEach(radio => {
    if (radio.checked) hasSelection = true;
  });
  if (!hasSelection && formatRadios.length > 0) {
    formatRadios[0].checked = true;
  }
}

// Função para esconder o seletor de formato de fatura (painel único - formatSubOptions)
function hideInvoiceFormatSelector() {
  const formatSubOptions = document.getElementById('formatSubOptions');
  if (formatSubOptions) {
    formatSubOptions.style.display = 'none';
  }
}

// Função para selecionar formato de fatura
function selectInvoiceFormat(format) {
  // Find and check the corresponding radio button
  const formatRadios = document.querySelectorAll(`input[name="invoiceFormat"][value="${format}"]`);
  formatRadios.forEach(radio => {
    radio.checked = true;
  });
}

// Função para confirmar formato de fatura
function confirmInvoiceFormat() {
  // Get the selected format from radio buttons
  const selectedRadio = document.querySelector('input[name="invoiceFormat"]:checked');
  if (!selectedRadio) {
    showAlert('warning', 'Formato não selecionado', 'Por favor, selecione um formato de fatura.');
    return;
  }

  const selectedFormat = selectedRadio.value;

  // Store the selected format in localStorage
  localStorage.setItem('invoiceFormat', selectedFormat);

  // Hide the selector
  hideInvoiceFormatSelector();

  // Show confirmation
  showAlert('success', 'Formato selecionado', `Formato de fatura definido como ${selectedFormat}`);
}



// Initialize invoice format selector event listeners
document.addEventListener('DOMContentLoaded', function () {
  // Add event listeners for format selection
  const formatRadios = document.querySelectorAll('input[name="invoiceFormat"]');

  formatRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      // ✅ NOVO: Usa a função centralizada
      selecionarFormatoFatura(this.value);
    });
  });

  // ✅ NOVO: Inicialização já é feita na função init()
  // O código de inicialização foi movido para initInvoiceFormat()
});
// ===== INTEGRAÇÃO COM CHECKOUT INTEGRADO =====
// ============================================
// PAINEL CLIENTE SLIDER
// ============================================

/**
 * Abre/fecha o painel cliente slider (TOGGLE)
 */
function openPanel(panelId) {
  if (panelId === 'clientePanel') {
    const panel = document.getElementById('clientePanelSlider');
    const wrapper = document.querySelector('.products-container-wrapper');
    const clientBtn = document.querySelector('.toggle-select-painel.cliente-btn');

    if (panel && wrapper) {
      // Verifica se o painel já está aberto
      const isOpen = panel.classList.contains('active');

      if (isOpen) {
        // Se está aberto, fecha
        panel.classList.remove('active');
        wrapper.classList.remove('panel-open');
        if (clientBtn) clientBtn.classList.remove('panel-active');
        console.log('✅ Painel cliente fechado (toggle)');
      } else {
        // Se está fechado, abre
        panel.classList.add('active');
        wrapper.classList.add('panel-open');
        if (clientBtn) clientBtn.classList.add('panel-active');
        console.log('✅ Painel cliente aberto (toggle)');
      }
    }
  }

  // Painel de Tipo de Documento (no carrinho)
  if (panelId === 'documentoPanel') {
    const panel = document.getElementById('docTypePanelSlider');
    const wrapper = document.getElementById('cartBodyWrapper');
    const docBtn = document.querySelector('.cart-header .toggle-select-painel');

    if (panel && wrapper) {
      // Verifica se o painel já está aberto
      const isOpen = panel.classList.contains('active');

      if (isOpen) {
        // Se está aberto, fecha
        panel.classList.remove('active');
        wrapper.classList.remove('doc-panel-open');
        if (docBtn) docBtn.classList.remove('panel-active');
        console.log('✅ Painel documento fechado (toggle)');
      } else {
        // Se está fechado, abre
        panel.classList.add('active');
        wrapper.classList.add('doc-panel-open');
        if (docBtn) docBtn.classList.add('panel-active');
        console.log('✅ Painel documento aberto (toggle)');
      }
    }
  }
}

/**
 * Fecha o painel cliente slider
 */
function closeClientPanel() {
  const panel = document.getElementById('clientePanelSlider');
  const wrapper = document.querySelector('.products-container-wrapper');
  const clientBtn = document.querySelector('.toggle-select-painel.cliente-btn');

  if (panel && wrapper) {
    panel.classList.remove('active');
    wrapper.classList.remove('panel-open');
    if (clientBtn) clientBtn.classList.remove('panel-active');
    console.log('✅ Painel cliente fechado');
  }
  if (typeof closeBottomSheet === 'function') closeBottomSheet();
}

/**
 * Fecha o painel de tipo de documento slider
 */
function closeDocPanel() {
  const panel = document.getElementById('docTypePanelSlider');
  const wrapper = document.getElementById('cartBodyWrapper');
  const docBtn = document.querySelector('.cart-header .toggle-select-painel');

  if (panel && wrapper) {
    panel.classList.remove('active');
    wrapper.classList.remove('doc-panel-open');
    if (docBtn) docBtn.classList.remove('panel-active');
    console.log('✅ Painel documento fechado');
  }
  if (typeof closeBottomSheet === 'function') closeBottomSheet();
}

/**
 * Inicializa os event listeners para os toggles de tipo de fatura
 */
function initInvoiceTypePanelToggles() {
  console.log('🔧 [TOGGLES] Inicializando toggles...');
  
  // Toggles de tipo
  const invoiceToggles = document.querySelectorAll('.invoice-toggle-option');
  console.log('📊 [TOGGLES] Tipos encontrados:', invoiceToggles.length);
  
  invoiceToggles.forEach(toggle => {
    toggle.addEventListener('click', function () {
      invoiceToggles.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      const radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const invoiceType = this.dataset.invoiceType;
      tipoDocumentoAtual = invoiceType;
      updateInvoiceTypeDisplay(invoiceType);
      if (typeof window.updateOrderSummaryDescTabState === 'function') window.updateOrderSummaryDescTabState();
      console.log('📄 [TOGGLES] Tipo selecionado:', invoiceType);

      const formatSubOptions = document.getElementById('formatSubOptions');
      if (formatSubOptions) {
        if (invoiceType === 'factura-recibo') {
          formatSubOptions.style.display = 'flex';
          console.log('✅ [TOGGLES] Sub-toggle exibido');
        } else {
          formatSubOptions.style.display = 'none';
          console.log('❌ [TOGGLES] Sub-toggle ocultado');
        }
      }

      if (invoiceType !== 'factura-recibo') {
        closeDocPanel();
      }
    });
  });

  // ✅ CRÍTICO: Toggles de formato
  const formatToggles = document.querySelectorAll('.format-toggle-option');
  console.log('📊 [TOGGLES] Formatos encontrados:', formatToggles.length);
  
  formatToggles.forEach((toggle, index) => {
    toggle.addEventListener('click', function () {
      console.log(`🎯 [TOGGLES] Toggle ${index} clicado:`, this.dataset.format);
      
      formatToggles.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      const radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const format = this.dataset.format;
      console.log('📐 [TOGGLES] Chamando selecionarFormatoFatura():', format);
      
      // ✅ CHAMADA CRÍTICA
      selecionarFormatoFatura(format);
      
      // Verifica se atualizou
      setTimeout(() => {
        console.log('🔍 [TOGGLES] Verificação:', {
          formatoFaturaAtual: formatoFaturaAtual,
          localStorage: localStorage.getItem('invoiceFormat'),
          radioMarcado: document.querySelector('input[name="invoiceFormat"]:checked')?.value
        });
      }, 100);

      closeDocPanel();
    });
  });
  
  console.log('✅ [TOGGLES] Inicialização concluída');
}

/**
 * Atualiza o texto do botão Tipo Factura no sticky bottom menu (telas ≤905px).
 * Se for Factura-Recibo, acrescenta o formato (A4 ou 80mm).
 */
function updateStickyDocTypeLabel() {
  const el = document.getElementById('stickyDocTypeLabel');
  if (!el) return;
  const typeNames = {
    'factura-recibo': 'Factura-Recibo',
    'factura-proforma': 'Factura Proforma',
    'factura': 'Factura',
    'orcamento': 'Orçamento'
  };
  const tipo = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
  let text = typeNames[tipo] || tipo || 'Tipo Factura';
  if (tipo === 'factura-recibo') {
    const formato = (typeof formatoFaturaAtual !== 'undefined' && formatoFaturaAtual)
      ? formatoFaturaAtual
      : (document.querySelector('input[name="invoiceFormat"]:checked')?.value || localStorage.getItem('invoiceFormat') || 'A4');
    text = text + ' (' + (formato === '80mm' ? '80mm' : 'A4') + ')';
  }
  el.textContent = text;
}

/**
 * Atualiza o display do formato de fatura (A4 ou 80mm) no botão do cabeçalho do carrinho
 * Chamada por selecionarFormatoFatura() sempre que o formato muda
 */
function updateInvoiceFormatDisplay(formato) {
  const formatDisplay = document.getElementById('selectedDocFormat');
  if (formatDisplay) {
    formatDisplay.textContent = formato === '80mm' ? 'Formato 80mm' : 'Formato A4';
  }
  updateStickyDocTypeLabel();
}

/**
 * Atualiza o display do tipo de fatura no botão do cabeçalho
 */
function updateInvoiceTypeDisplay(invoiceType) {
  const typeNames = {
    'factura-recibo': 'Factura-Recibo',
    'factura-proforma': 'Factura Proforma',
    'factura': 'Factura',
    'orcamento': 'Orçamento'
  };
  const displayElement = document.getElementById('selectedDocType');
  if (displayElement) {
    displayElement.textContent = typeNames[invoiceType] || invoiceType;
  }

  updateStickyDocTypeLabel();

  // Sempre mostra o formato e a seta
  const formatDisplay = document.getElementById('selectedDocFormat');
  const arrowDisplay = document.querySelector('.doc-arrow');

  if (formatDisplay) formatDisplay.style.display = 'inline';
  if (arrowDisplay) arrowDisplay.style.display = 'inline';

  // Para tipos diferentes de factura-recibo, sempre mostra A4 como padrão
  if (invoiceType !== 'factura-recibo') {
    if (formatDisplay) formatDisplay.textContent = 'Formato A4';
  }

  // Factura Proforma, Fatura e Orçamento: bloquear métodos de pagamento e teclado; alterar texto do botão
  const cartFooter = document.querySelector('.cart-footer');
  const payBtns = document.querySelectorAll('.keypad-pay-btn');
  const setPayBtnText = function (text) { payBtns.forEach(function (btn) { btn.textContent = text; }); };
  if (invoiceType === 'factura-proforma') {
    if (cartFooter) cartFooter.classList.add('document-type-proforma');
    setPayBtnText('Gerar Factura Proforma');
  } else if (invoiceType === 'factura') {
    if (cartFooter) cartFooter.classList.add('document-type-proforma');
    setPayBtnText('Gerar Fatura');
  } else if (invoiceType === 'orcamento') {
    if (cartFooter) cartFooter.classList.add('document-type-proforma');
    setPayBtnText('Gerar Orçamento');
  } else {
    if (cartFooter) cartFooter.classList.remove('document-type-proforma');
    setPayBtnText('Pagar');
  }

  // Cadeados no rodapé: mostrar só quando bloqueado (proforma/fatura/orçamento); sumir com Factura-Recibo
  if (typeof updateCartFooterLockIcons === 'function') updateCartFooterLockIcons(invoiceType);
}

/**
 * Adiciona ou remove o ícone de cadeado DENTRO de cada elemento bloqueado do rodapé,
 * com estilo igual ao do elemento (mesmo font-size e tom de cor).
 * @param {string} invoiceType - Tipo de documento atual (factura-recibo, factura-proforma, fatura, orcamento)
 */
function updateCartFooterLockIcons(invoiceType) {
  const blockFooter = invoiceType === 'factura-proforma' || invoiceType === 'factura' || invoiceType === 'orcamento';
  const footer = document.querySelector('.cart-footer');
  if (!footer) return;

  function addLock(parent, lockClass) {
    if (!parent.querySelector('.' + lockClass)) {
      const wrap = document.createElement('span');
      wrap.className = lockClass;
      wrap.setAttribute('aria-hidden', 'true');
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-lock';
      wrap.appendChild(icon);
      parent.appendChild(wrap);
    }
  }
  function removeLocks(selector) {
    footer.querySelectorAll(selector).forEach(function (el) { el.remove(); });
  }

  if (blockFooter) {
    // 1) Cada card: substituir conteúdo pelo cadeado
    footer.querySelectorAll('#paymentMethodsTrack .pm-card').forEach(function (card) {
      addLock(card, 'pm-card-lock');
      card.classList.add('locked');
    });
    // 2) Input: substituir valor pelo cadeado
    const amountWrapper = footer.querySelector('.footer-amount-wrapper');
    if (amountWrapper) {
      addLock(amountWrapper, 'footer-input-lock');
      amountWrapper.classList.add('locked');
    }
    // 3) Cada botão numérico: substituir número pelo cadeado
    footer.querySelectorAll('.keypad-grid .keypad-btn').forEach(function (btn) {
      addLock(btn, 'keypad-btn-lock');
      btn.classList.add('locked');
    });
    // 4) Botão Exato: substituir palavra "Exato" pelo cadeado
    const exactBtn = footer.querySelector('.keypad-exact-btn');
    if (exactBtn) {
      addLock(exactBtn, 'keypad-exact-lock');
      exactBtn.classList.add('locked');
    }
  } else {
    removeLocks('.pm-card-lock');
    removeLocks('.footer-input-lock');
    removeLocks('.keypad-btn-lock');
    removeLocks('.keypad-exact-lock');
    footer.querySelectorAll('.pm-card, .footer-amount-wrapper, .keypad-grid .keypad-btn, .keypad-exact-btn').forEach(function (el) {
      el.classList.remove('locked');
    });
  }
}
// Inicializa os toggles quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
  initInvoiceTypePanelToggles();

  // [TESTE] Clique na área do usuário logado → alert com width da tela (útil ao redimensionar)
  const loggedUserArea = document.getElementById('loggedUserArea');
  if (loggedUserArea) {
    loggedUserArea.addEventListener('click', function () {
      var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      alert('Width da tela: ' + w + ' px');
    });
  }

  // Inicializa visibilidade do sub-toggle de formato
  const formatSubOptions = document.getElementById('formatSubOptions');
  if (formatSubOptions) {
    // Mostra sub-toggle apenas se factura-recibo estiver selecionado
    const isFaturaRecibo = tipoDocumentoAtual === 'factura-recibo';
    formatSubOptions.style.display = isFaturaRecibo ? 'flex' : 'none';
  }

});
/**
 * Função genérica para fechar painel (compatibilidade)
 */
function closePanel(panelId) {
  if (panelId === 'clientePanel') {
    closeClientPanel();
  }
  if (panelId === 'documentoPanel') {
    closeDocPanel();
  }
}

/**
 * Seleciona um cliente no painel
 */
function selectClient(clientId, clientName) {
  console.log('🧑 Cliente selecionado:', clientName, clientId);

  // Remove active de todos os itens
  const items = document.querySelectorAll('.client-item');
  items.forEach(item => item.classList.remove('active'));

  // Adiciona active no item clicado
  event.currentTarget.classList.add('active');

  // Atualiza o nome no botão cliente (topo e sticky bottom menu)
  const topClientName = document.getElementById('topSelectedClient');
  if (topClientName) {
    topClientName.textContent = clientName;
  }
  const stickyClientLabel = document.getElementById('stickyClientLabel');
  if (stickyClientLabel) {
    stickyClientLabel.textContent = clientName;
  }

  // Atualiza no checkout também (se existir)
  const selectedClientName = document.getElementById('selectedClientName');
  if (selectedClientName) {
    selectedClientName.textContent = clientName;
  }

  // Fecha o painel após seleção
  setTimeout(() => {
    closeClientPanel();
  }, 300);

  // Mostra alerta de sucesso
  showAlert('success', 'Cliente Selecionado', `${clientName} foi selecionado`, 2000);
}

/**
 * Abre formulário para novo cliente (placeholder)
 */
function openNewClientFormPanel() {
  console.log('➕ Abrir formulário de novo cliente');
  showAlert('info', 'Em Desenvolvimento', 'Funcionalidade de cadastro será implementada', 2500);
}

/**
 * ⚠️ CÓDIGO ANTIGO DO PAINEL DE CLIENTES FOI REMOVIDO
 * Foi substituído pelo arquivo clientes.js que conecta com a API do backend
 * O código antigo usava dados mockados e foi removido para evitar conflitos
 */





         /* ================================================
   FIM do Invoice Type UI

   ================================================ */


/* ================================================
   MÓDULO: Modal UI
   Ficheiro: assets/js/ui/modal.ui.js
   Parte do sistema Dash-POS
   ================================================ */


// ============================================
// MODAL DE CONFIRMAÇÃO (Centralizado em app.js)
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

/**
 * Inicializa os listeners dos botões da modal de confirmação
 * Liga: confirm -> onConfirmAction, cancel/close/overlay -> onCancelAction
 */
function initConfirmModalListeners() {
  const confirmBtn = document.getElementById('confirm-confirm-dialog');
  const cancelBtn = document.getElementById('cancel-confirm-dialog');
  const closeBtn = document.getElementById('close-confirm-dialog');
  const overlay = document.getElementById('overlay-confirm-dialog');
  const modal = document.getElementById('modal-confirm-dialog');

  if (confirmBtn) confirmBtn.addEventListener('click', onConfirmAction);
  if (cancelBtn) cancelBtn.addEventListener('click', onCancelAction);
  if (closeBtn) closeBtn.addEventListener('click', onCancelAction);
  if (overlay) overlay.addEventListener('click', onCancelAction);

  // Escape key closes modal
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && modal && !modal.classList.contains('hidden')) {
      onCancelAction();
    }
  });

  console.log('🔧 [CONFIRM] Listeners de confirmação inicializados');
}

// Tenta inicializar imediatamente quando o DOM estiver pronto
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initConfirmModalListeners, 10);
} else {
  document.addEventListener('DOMContentLoaded', initConfirmModalListeners);
}


window.showConfirmModal = showConfirmModal;
window.hideConfirmModal = hideConfirmModal;
window.onConfirmAction = onConfirmAction;
window.onCancelAction = onCancelAction;
window.updateConfirmModalContent = updateConfirmModalContent;



         /* ================================================
   FIM do Modal UI

   ================================================ */



/* ================================================
   MÓDULO: Order Summary UI
   Ficheiro: assets/js/ui/order-summary.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/* ======= ORDER SUMMARY SLIDER ======= */
/**
 * Inicializa o slider do Order Summary (OBS toggle)
 */
function initOrderSummarySlider() {
  const slider = document.getElementById('orderSummarySlider');
  const obsToggleBtn = document.getElementById('obsToggleBtn');
  const obsBackBtn = document.getElementById('obsBackBtn');
  const obsSubmitBtn = document.getElementById('obsSubmitBtn');
  const orderObservation = document.getElementById('orderObservation');
  const innerSlider = document.getElementById('orderObsInnerSlider');
  const obsTabObservacao = document.getElementById('obsTabObservacao');
  const obsTabDesc = document.getElementById('obsTabDesc');

  if (!slider || !obsToggleBtn || !obsBackBtn) {
    console.warn('Order summary slider elements not found');
    return;
  }

  const orderDiscountInput = document.getElementById('orderDiscountInput');

  function setObsTab(panel) {
    if (!innerSlider || !obsTabObservacao || !obsTabDesc) return;
    const bodyWrapper = innerSlider.parentElement; // .order-obs-body-wrapper
    if (panel === 'desc') {
      const offsetPx = bodyWrapper.offsetWidth;
      innerSlider.style.transform = 'translateX(-' + offsetPx + 'px)';
      obsTabObservacao.classList.remove('active');
      obsTabObservacao.setAttribute('aria-selected', 'false');
      obsTabDesc.classList.add('active');
      obsTabDesc.setAttribute('aria-selected', 'true');
      setTimeout(function () {
        if (orderDiscountInput) orderDiscountInput.focus();
      }, 350);
    } else {
      innerSlider.style.transform = 'translateX(0px)';
      obsTabObservacao.classList.add('active');
      obsTabObservacao.setAttribute('aria-selected', 'true');
      obsTabDesc.classList.remove('active');
      obsTabDesc.setAttribute('aria-selected', 'false');
    }
  }

  /** Bloqueia a aba Desc. quando o tipo de documento é factura-proforma, factura ou orçamento.
   *  Cadeado só aparece quando a aba está bloqueada; com Factura-Recibo (A4 ou 80mm) o cadeado some. */
  function updateDescTabBlockState() {
    const tipo = (typeof getTipoDocumentoAtual === 'function') ? getTipoDocumentoAtual() : tipoDocumentoAtual;
    const blockDesc = tipo === 'factura-proforma' || tipo === 'factura' || tipo === 'orcamento';
    if (obsTabDesc) {
      obsTabDesc.classList.toggle('disabled', blockDesc);
      obsTabDesc.setAttribute('aria-disabled', blockDesc ? 'true' : 'false');
      // Cadeado: só inserir no DOM quando bloqueado; remover quando Factura-Recibo
      const lockEl = obsTabDesc.querySelector('.obs-tab-lock-icon');
      if (blockDesc) {
        if (!lockEl) {
          const icon = document.createElement('i');
          icon.className = 'fa-solid fa-lock obs-tab-lock-icon';
          icon.setAttribute('aria-hidden', 'true');
          icon.style.marginLeft = '4px';
          icon.style.fontSize = '10px';
          obsTabDesc.appendChild(icon);
        }
      } else {
        if (lockEl) lockEl.remove();
      }
    }
    if (blockDesc) setObsTab('obs');
  }

  if (obsTabObservacao) {
    obsTabObservacao.addEventListener('click', function () { setObsTab('obs'); });
  }
  if (obsTabDesc) {
    obsTabDesc.addEventListener('click', function () {
      if (obsTabDesc.classList.contains('disabled')) return;
      setObsTab('desc');
    });
  }

  window.updateOrderSummaryDescTabState = updateDescTabBlockState;
  updateDescTabBlockState();

  // Toggle to OBS view (como em leia.txt); ao abrir, mostrar sempre a aba Observação
  obsToggleBtn.addEventListener('click', function () {
    setObsTab('obs');
    slider.classList.add('show-obs');
    setTimeout(function () {
      if (orderObservation) orderObservation.focus();
    }, 350);
  });

  // Back to Order Summary view
  obsBackBtn.addEventListener('click', function () {
    slider.classList.remove('show-obs');
  });

  /* Recalcular o transform do inner slider em resize APENAS se:
     1. O painel DESC está activo (transform != 0px)
     2. O contentor OBS está visível (slider tem classe show-obs)
     3. O layout está estável (usa requestAnimationFrame + debounce) */
  if (innerSlider && typeof ResizeObserver !== 'undefined') {
    const bodyWrapper = innerSlider.parentElement;
    let resizeTimeout;

    const recalculateTransform = function () {
      // Só recalcular se o painel DESC está visível E o contentor OBS está aberto
      if (!slider.classList.contains('show-obs')) return;
      if (!innerSlider.style.transform || innerSlider.style.transform === 'translateX(0px)') return;

      // requestAnimationFrame garante que o DOM foi completamente renderizado
      requestAnimationFrame(function () {
        const newOffsetPx = bodyWrapper.offsetWidth;
        if (newOffsetPx > 0) {
          innerSlider.style.transform = 'translateX(-' + newOffsetPx + 'px)';
        }
      });
    };

    const resizeObs = new ResizeObserver(function () {
      // Debounce: só recalcular 100ms após o último evento de resize
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(recalculateTransform, 100);
    });

    resizeObs.observe(bodyWrapper);
  }

  // Submit observation
  if (obsSubmitBtn) {
    obsSubmitBtn.addEventListener('click', function () {
      const observation = orderObservation ? orderObservation.value.trim() : '';
      window.orderObservation = observation;
      console.log('📝 Observação salva:', observation);
      obsSubmitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
      obsSubmitBtn.style.background = '#4caf50';
      setTimeout(function () {
        slider.classList.remove('show-obs');
        setTimeout(function () {
          obsSubmitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Confirmar';
          obsSubmitBtn.style.background = '';
        }, 400);
      }, 500);
    });
  }

  // Input de desconto com formatação monetária (como valor pago e preço do produto)
  if (orderDiscountInput && typeof MonetaryFormatter !== 'undefined') {
    window.orderDiscountFormatter = new MonetaryFormatter('orderDiscountInput', {
      locale: 'pt-AO',
      currency: 'Kz',
      decimals: 2,
      allowNegative: false,
      onValueChange: function (value) { window.orderDiscountValue = value; }
    });
    window.orderDiscountFormatter.enable();
    window.orderDiscountFormatter.setValue(0);
  }

  // Aplicar desconto (valor guardado para uso no cálculo)
  const orderDiscountApplyBtn = document.getElementById('orderDiscountApplyBtn');
  if (orderDiscountApplyBtn && orderDiscountInput) {
    orderDiscountApplyBtn.addEventListener('click', function () {
      const value = window.orderDiscountFormatter ? window.orderDiscountFormatter.getValue() : parseFloat((orderDiscountInput.value || '').replace(/\s/g, '').replace(',', '.')) || 0;
      window.orderDiscountValue = value;
      console.log('💰 Desconto aplicado:', value);
      if (typeof showAlert === 'function') {
        showAlert('info', 'Desconto', value ? 'Valor de desconto definido: ' + currency.format(value) : 'Introduza um valor.', 3000);
      }
    });
  }

  console.log('✅ Order Summary Slider initialized');
}

/**
 * Atualiza os valores do resumo do pedido no footer
 */
function updateOrderSummaryFooter(netTotal, taxTotal, retention, totalPagar) {
  const summaryNetTotal = document.getElementById('summaryNetTotal');
  const summaryTaxTotal = document.getElementById('summaryTaxTotal');
  const summaryRetention = document.getElementById('summaryRetention');
  const summaryTotalPagar = document.getElementById('summaryTotalPagar');

  if (summaryNetTotal) summaryNetTotal.textContent = currency.format(netTotal || 0);
  if (summaryTaxTotal) summaryTaxTotal.textContent = currency.format(taxTotal || 0);
  if (summaryRetention) summaryRetention.textContent = currency.format(retention || 0);
  if (summaryTotalPagar) summaryTotalPagar.textContent = currency.format(totalPagar || 0);

  // Atualiza o total atual do carrinho para os cards de pagamento
  currentCartTotal = totalPagar || 0;

  // Atualiza os valores exibidos nos cards de pagamento
  updateFooterPaymentCards();
}

/**
 * Retorna a observação do pedido
 */
/**
 * Retorna a observação do pedido
 * @returns {string} Observação (sempre string, vazia ou com conteúdo)
 */
function getOrderObservation() {
  // Garantir que sempre retorna string
  if (window.orderObservation && typeof window.orderObservation === 'string') {
    return window.orderObservation.trim();
  }
  return '';
}

// Expose functions globally
window.updateOrderSummaryFooter = updateOrderSummaryFooter;
window.getOrderObservation = getOrderObservation;
window.initOrderSummarySlider = initOrderSummarySlider;



         /* ================================================
   FIM Order Summary UI

   ================================================ */

/* ================================================
   MÓDULO: Payment UI
   Ficheiro: assets/js/ui/payment.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/**
 * Gera slug a partir do nome do método
 */
function generatePaymentSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Renderiza os cards de pagamento no footer
 */
function renderFooterPaymentCards() {
  const track = document.getElementById('paymentMethodsTrack');
  if (!track) return;

  if (footerPaymentMethods.length === 0) {
    track.innerHTML = '<span class="pm-empty">Nenhum método disponível</span>';
    return;
  }

  // Inicializa valores por método (se ainda não existir)
  footerPaymentMethods.forEach(metodo => {
    if (!(metodo.slug in footerValoresPorMetodo)) {
      footerValoresPorMetodo[metodo.slug] = 0;
    }
  });

  // Renderiza cards com estrutura de duas linhas (nome + valor restante)
  track.innerHTML = footerPaymentMethods.map(metodo =>
    `<button class="pm-card" data-method="${metodo.slug}" data-id="${metodo.id}">
      <span class="pm-card-name">${metodo.nome}</span>
      <span class="pm-card-value valor-restante"></span>
    </button>`
  ).join('');

  // Inicializa seleção e slider após renderizar
  initPaymentMethodsSelection();
  initPaymentMethodsSlider();

  // Atualiza os valores exibidos nos cards
  updateFooterPaymentCards();

  // Garantir que o overflow do slider é reavaliado após os cards estarem no DOM
  if (typeof scheduleRefreshPaymentMethodsOverflow === 'function') scheduleRefreshPaymentMethodsOverflow();

  console.log('✅ [FOOTER] Cards renderizados');
}

/**
 * Detecta se o track de métodos de pagamento tem overflow (quebra de linha)
 * e atualiza a visibilidade das setas + estado disabled.
 * Mostra setas sempre que qualquer card não estiver totalmente visível.
 */
function refreshPaymentMethodsOverflow() {
  const wrapper = document.getElementById('paymentMethodsWrapper');
  const track = document.getElementById('paymentMethodsTrack');
  const prevBtn = document.getElementById('pmArrowPrev');
  const nextBtn = document.getElementById('pmArrowNext');

  if (!wrapper || !track || !prevBtn || !nextBtn) return;

  const scrollW = track.scrollWidth;
  const clientW = track.clientWidth;
  const cards = track.querySelectorAll('.pm-card');

  // Overflow quando o conteúdo é mais largo que a área visível
  let hasOverflow = scrollW > clientW;

  // Deteção extra: último card parcialmente visível (quebra mínima / subpixel)
  if (!hasOverflow && cards.length > 0) {
    const tr = track.getBoundingClientRect();
    const last = cards[cards.length - 1];
    const lr = last.getBoundingClientRect();
    if (lr.right > tr.right - 1) hasOverflow = true;
  }

  wrapper.classList.toggle('has-overflow', hasOverflow);

  if (hasOverflow) {
    const scrollLeft = track.scrollLeft;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    prevBtn.disabled = scrollLeft <= 0;
    nextBtn.disabled = scrollLeft >= maxScroll - 1;
  }
}

/**
 * Agenda o refresh do overflow para depois do layout (evita medição antes do paint).
 */
function scheduleRefreshPaymentMethodsOverflow() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (typeof refreshPaymentMethodsOverflow === 'function') refreshPaymentMethodsOverflow();
    });
  });
}

/**
 * Inicializa o slider de métodos de pagamento
 * Setas só aparecem quando há overflow (quebra nos cards).
 */
function initPaymentMethodsSlider() {
  const wrapper = document.getElementById('paymentMethodsWrapper');
  const track = document.getElementById('paymentMethodsTrack');
  const prevBtn = document.getElementById('pmArrowPrev');
  const nextBtn = document.getElementById('pmArrowNext');

  if (!wrapper || !track || !prevBtn || !nextBtn) {
    console.warn('⚠️ Elementos do slider de pagamento não encontrados');
    return;
  }

  // Scroll por "página"
  function scrollByPage(direction) {
    const pageSize = Math.max(track.clientWidth * 0.8, 100);
    track.scrollBy({ left: direction * pageSize, behavior: 'smooth' });
  }

  prevBtn.addEventListener('click', () => scrollByPage(-1));
  nextBtn.addEventListener('click', () => scrollByPage(+1));
  track.addEventListener('scroll', () => refreshPaymentMethodsOverflow());

  // Verificação inicial após o layout estar estável
  scheduleRefreshPaymentMethodsOverflow();

  // Re-verificar no resize (debounce para evitar excesso de chamadas)
  let resizeTimeout;
  const onResize = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(scheduleRefreshPaymentMethodsOverflow, 120);
  };
  window.addEventListener('resize', onResize);
}

/**
 * Inicializa a seleção de métodos de pagamento
 */
function initPaymentMethodsSelection() {
  const cards = document.querySelectorAll('#paymentMethodsTrack .pm-card');

  cards.forEach(card => {
    card.addEventListener('click', function () {
      const method = this.dataset.method;
      selectFooterPaymentMethod(this, method);
    });
  });
}

/**
 * Seleciona um método de pagamento no footer
 * Lógica igual à do modal_checkout: salva valor anterior, carrega valor do método clicado
 */
function selectFooterPaymentMethod(card, method) {
  console.log('💳 [FOOTER] Clique detectado em:', method);

  const isCurrentMethod = selectedPaymentMethod === method;

  if (isCurrentMethod) {
    // Deselect current method
    console.log('❎ [FOOTER] Deselecionando método:', method);

    // ✅ CONFIRMA o valor antes de desselecionar
    confirmFooterPaymentValue();

    // Clear selection
    selectedPaymentMethod = null;
    footerCashAmount = '0';
    
    if (window.footerCashFormatter) {
      window.footerCashFormatter.setValue(0);
    }

  } else {
    // Select new method
    console.log('✅ [FOOTER] Selecionando método:', method);

    // ✅ CONFIRMA o valor do método anterior antes de trocar
    if (selectedPaymentMethod) {
      confirmFooterPaymentValue();
    }

    // 2️⃣ Set new current method
    selectedPaymentMethod = method;

    // 3️⃣ Load saved value for this method
    const valorSalvo = footerValoresPorMetodo[method] || 0;
    footerCashAmount = String(valorSalvo);
    
    if (window.footerCashFormatter) {
      window.footerCashFormatter.setValue(valorSalvo);
    }
    console.log(`📥 [FOOTER] Carregando ${method}: ${valorSalvo} Kz`);

    // 4️⃣ Auto-focus input
    setTimeout(() => {
      const cashInput = document.getElementById('footerCashInput');
      if (cashInput) {
        cashInput.focus();
        console.log('🎯 [FOOTER] Input focado!');
      }
    }, 100);
  }

  // ✅ Atualiza cards APÓS confirmar valores
  updateFooterPaymentCards();
}

/**
 * Atualiza os valores e estilos de todos os cards de pagamento
 */
function updateFooterPaymentCards() {
  const cards = document.querySelectorAll('#paymentMethodsTrack .pm-card');
  const totalAPagar = currentCartTotal || 0;

  // Calcula soma de todos os pagamentos
  let somaPagamentos = 0;
  footerPaymentMethods.forEach(metodo => {
    const slug = metodo.slug;
    if (slug === selectedPaymentMethod) {
      // Método atualmente sendo editado: usa o valor do input
      somaPagamentos += parseFloat(footerCashAmount) || 0;
    } else {
      // Outros métodos: usa o valor salvo
      somaPagamentos += parseFloat(footerValoresPorMetodo[slug]) || 0;
    }
  });

  const faltaPagar = totalAPagar - somaPagamentos;

  console.log(`💰 [FOOTER] Total: ${totalAPagar} | Pago: ${somaPagamentos} | Falta: ${faltaPagar}`);

  cards.forEach(card => {
    const method = card.getAttribute('data-method') || '';
    const span = card.querySelector('.valor-restante');
    const isCurrentMethod = selectedPaymentMethod === method;

    // Calcula o valor deste método
    let valorDoMetodo = 0;
    if (isCurrentMethod) {
      valorDoMetodo = parseFloat(footerCashAmount) || 0;
    } else {
      valorDoMetodo = parseFloat(footerValoresPorMetodo[method]) || 0;
    }

    // Card ativo se valor > 0
    const deveEstarAtivo = valorDoMetodo > 0;

    // Aplica ou remove classe 'active'
    if (deveEstarAtivo) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }

    // Aplica classe 'editing' se for o método atual
    if (isCurrentMethod) {
      card.classList.add('editing');
    } else {
      card.classList.remove('editing');
    }

    // Exibição do valor no span
    if (span) {
      if (isCurrentMethod && deveEstarAtivo) {
        // Método atual com valor: mostra em azul
        span.textContent = valorDoMetodo.toLocaleString('pt-AO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' Kz';
        span.className = 'pm-card-value valor-restante valor-positivo';

      } else if (deveEstarAtivo) {
        // Outro método com valor: mostra em verde
        span.textContent = valorDoMetodo.toLocaleString('pt-AO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' Kz';
        span.className = 'pm-card-value valor-restante valor-confirmado';

      } else if (faltaPagar > 0) {
        // Sem valor e falta pagar: mostra negativo em vermelho
        span.textContent = '−' + faltaPagar.toLocaleString('pt-AO', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' Kz';
        span.className = 'pm-card-value valor-restante valor-negativo';

      } else {
        // Tudo pago ou carrinho vazio: limpa
        span.textContent = '';
        span.className = 'pm-card-value valor-restante';
      }
    }
  });

  // ✅ Calcula e exibe o STATUS DE PAGAMENTO (Troco / Falta / Completo)
  updatePaymentStatus(somaPagamentos, totalAPagar);
}

/**
 * Exibe o estado de "Valor em falta" após falha na validação de pagamento
 * Mostra um estado visual vermelho com a quantidade em falta
 */
function showPaymentMissing(valorEmFalta) {
  const statusElement = document.getElementById('paymentStatusElement');
  const statusLabel = document.getElementById('statusLabel');
  const statusValue = document.getElementById('statusValue');
  const statusIcon = document.getElementById('statusIcon');

  if (!statusElement || !statusLabel || !statusValue || !statusIcon) return;

  // Ícone de aviso
  const iconWarning = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m.93-6.93a9.001 9.001 0 1 1-1.86 0M9 16H3m6-8l-5.66 5.66m0 0l11.32 0" /><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>';
  const iconAlertIcon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

  // Limpa classes anteriores
  statusElement.classList.remove('state-change', 'state-complete');

  // Mostra o estado de valor em falta
  statusLabel.textContent = 'Valor em falta';
  statusValue.textContent = valorEmFalta.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' Kz';
  statusIcon.innerHTML = iconAlertIcon;
  statusElement.classList.add('visible', 'state-remaining');

  console.log(`🔴 [STATUS] Valor em falta exibido: ${valorEmFalta.toFixed(2)} Kz`);
}

/**
 * Atualiza a exibição do status de pagamento (3 estados)
 * - Troco (verde): pagou mais do que o total
 * - Valor em falta (vermelho): ainda falta pagar
 * - Pagamento completo (azul): pagou exatamente o total
 */
function updatePaymentStatus(somaPagamentos, totalAPagar) {
  const statusElement = document.getElementById('paymentStatusElement');
  const statusLabel = document.getElementById('statusLabel');
  const statusValue = document.getElementById('statusValue');
  const statusIcon = document.getElementById('statusIcon');

  if (!statusElement || !statusLabel || !statusValue || !statusIcon) return;

  // Ícones SVG
  const iconCheck = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
  const iconWarning = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

  // Remove classes de estado anteriores
  statusElement.classList.remove('visible', 'state-change', 'state-remaining', 'state-complete');

  // Se não há pagamentos ou carrinho vazio, esconde
  if (somaPagamentos === 0 || totalAPagar === 0) {
    return;
  }

  const diferenca = totalAPagar - somaPagamentos;

  if (diferenca > 0) {
    // 🔴 AINDA FALTA PAGAR -> OCULTO (Solicitação do usuário)
    // Se o valor inserido for menor que o total, não mostrar nada.
    statusElement.classList.remove('visible');
    console.log(`🔴 [STATUS] Falta pagar: ${diferenca.toFixed(2)} Kz (Oculto)`);

  } else if (diferenca < 0) {
    // 🟢 PAGOU A MAIS - TEM TROCO
    const troco = Math.abs(diferenca);
    statusLabel.textContent = 'Troco';
    statusValue.textContent = troco.toLocaleString('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' Kz';
    statusIcon.innerHTML = iconCheck;
    statusElement.classList.add('visible', 'state-change');
    console.log(`🟢 [STATUS] Troco: ${troco.toFixed(2)} Kz`);

  } else {
    // 🔵 PAGAMENTO EXATO - COMPLETO
    statusLabel.textContent = 'Pagamento completo';
    statusValue.textContent = '';
    statusIcon.innerHTML = iconCheck;
    statusElement.classList.add('visible', 'state-complete');
    console.log(`🔵 [STATUS] Pagamento completo`);
  }
}

/**
 * Retorna o método de pagamento selecionado
 */
function getSelectedPaymentMethod() {
  return selectedPaymentMethod;
}

/**
 * Reseta todos os valores dos métodos de pagamento
 * Chamado quando o carrinho é limpo
 */
function resetFooterPaymentValues() {
  console.log('🔄 [FOOTER] Resetando valores dos métodos de pagamento');

  // Limpa o objeto de valores por método
  for (const key in footerValoresPorMetodo) {
    if (footerValoresPorMetodo.hasOwnProperty(key)) {
      footerValoresPorMetodo[key] = 0;
    }
  }

  // Reseta o método selecionado
  selectedPaymentMethod = null;

  // Reseta o valor do input
  footerCashAmount = '0';

  // Atualiza o display do input
  const cashInput = document.getElementById('footerCashInput');
  if (cashInput) {
    cashInput.value = 'Kz 0,00';
  }

  // Atualiza os cards visuais
  updateFooterPaymentCards();

  console.log('✅ [FOOTER] Valores resetados');
}

/* ======================================================
   SEÇÃO: INPUT DO FOOTER - VALOR RECEBIDO DO CLIENTE
   ====================================================== */

/*
function setupFooterKeyboardListener() {
  const cashInput = document.getElementById('footerCashInput');
  if (!cashInput) {
    console.warn('⚠️ [FOOTER] Input footerCashInput não encontrado');
    return;
  }

  // Remove listeners anteriores se existirem
  cashInput.removeEventListener('keydown', handleFooterKeyboardInput);

  // Adiciona novo listener para keydown
  cashInput.addEventListener('keydown', handleFooterKeyboardInput);

  // Previne entrada direta - valor controlado pela nossa lógica
  cashInput.addEventListener('input', function (e) {
    e.preventDefault();
    updateFooterCashDisplay();
  });

  // Cursor sempre no final
  cashInput.addEventListener('click', function () {
    this.selectionStart = this.selectionEnd = this.value.length;
  });

  cashInput.addEventListener('focus', function () {
    this.selectionStart = this.selectionEnd = this.value.length;
  });

  console.log('✅ [FOOTER] Listener do teclado físico configurado');
}
*/

/*
function handleFooterKeyboardInput(e) {
  const key = e.key;

  // BACKSPACE: Remove último caractere
  if (key === 'Backspace') {
    e.preventDefault();
    backspaceFooterCash();
    return;
  }

  // DELETE: Limpa tudo
  if (key === 'Delete') {
    e.preventDefault();
    clearFooterCash();
    return;
  }

  // PONTO DECIMAL: Adiciona ponto (aceita . ou , ou Decimal do numpad)
  if (key === '.' || key === ',' || key === 'Decimal') {
    e.preventDefault();
    footerKeypadInput('.');
    return;
  }

  // NÚMEROS: Adiciona dígito
  if (/^[0-9]$/.test(key)) {
    e.preventDefault();
    footerKeypadInput(key);
    return;
  }
}
*/

function footerKeypadInput(value) {
  if (!selectedPaymentMethod) {
    console.warn('⚠️ [FOOTER] Nenhum método selecionado');
    return;
  }
  
  if (window.footerCashFormatter) {
    window.footerCashFormatter.keypadInput(value);
  }
}

function backspaceFooterCash() {
  if (!selectedPaymentMethod) {
    console.warn('⚠️ [FOOTER] Nenhum método selecionado');
    return;
  }
  
  if (window.footerCashFormatter) {
    window.footerCashFormatter.backspace();
  }
}

function clearFooterCash() {
  if (window.footerCashFormatter) {
    window.footerCashFormatter.clear();
  }
}

function updateFooterCashDisplay() {
  // This function now just triggers the formatter's display update
  if (window.footerCashFormatter) {
    window.footerCashFormatter._formatDisplay();
  }
}

/**
 * Retorna o valor numérico atual do footer
 */
function getFooterCashAmount() {
  return parseFloat(footerCashAmount) || 0;
}

/**
 * Inicializa os listeners dos botões do keypad
 */
function initFooterKeypad() {
  // ✅ Instancia formatter SEM atualizar cards em tempo real
  window.footerCashFormatter = new MonetaryFormatter('footerCashInput', {
    locale: 'pt-AO',
    currency: 'Kz',
    decimals: 2,
    onValueChange: (value) => {
      // ✅ Atualiza APENAS as variáveis globais (sem atualizar UI)
      footerCashAmount = String(value);
      
      if (selectedPaymentMethod) {
        footerValoresPorMetodo[selectedPaymentMethod] = value;
        console.log(`💾 [FOOTER] Salvando ${selectedPaymentMethod}: ${value} Kz (sem atualizar UI)`);
      }
      
      // ❌ NÃO CHAMA updateFooterPaymentCards() AQUI!
      // A atualização acontece apenas na confirmação (Enter ou Blur)
    }
  });
  
  // ✅ ATIVA o formatter (este input sempre está em modo edição)
  window.footerCashFormatter.enable();
  
  // ✅ NOVO: Adiciona listeners para confirmação
  const cashInput = document.getElementById('footerCashInput');
  if (cashInput) {
    // ✅ Confirma ao pressionar Enter
    cashInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmFooterPaymentValue();
      }
    });
    
    // ✅ Confirma ao clicar fora (blur)
    cashInput.addEventListener('blur', () => {
      confirmFooterPaymentValue();
    });
  }
  
  // Configura botões do keypad (quantidade/preço no carrinho ou valor do pagamento)
  const keypadBtns = document.querySelectorAll('.keypad-btn');
  keypadBtns.forEach(btn => {
    // CRÍTICO: preventDefault no mousedown impede que o input activo perca foco
    // quando o utilizador clica num botão do keypad.
    // Sem isto, o focusout dispara antes do click e apaga _keypadTargetInput.
    btn.addEventListener('mousedown', function (e) {
      e.preventDefault();
    });

    btn.addEventListener('click', function () {
      const value = this.dataset.value;
      const target = window._keypadTargetInput;

      // 1. Se há um input de qty ou price em foco → envia para ele
      if (target && document.contains(target)) {
        if (target.id && target.id.startsWith('qty-')) {
          if (typeof window.handleQuantityKeypadKey === 'function') {
            window.handleQuantityKeypadKey(target, value);
          }
          return;
        }
        if (target.id && target.id.startsWith('price-')) {
          const productId = target.id.replace('price-', '');
          const formatter = window['priceFormatter_' + productId];
          if (formatter) {
            // ✅ Re-seleção manual via mouse/Shift+setas: se há seleção DOM real
            // e a flag ainda não está activa, activá-la antes de chamar keypadInput.
            // (Para teclado físico, MonetaryFormatter.keypadInput() já trata isto sozinho.)
            const inputEl = formatter.inputElement;
            if (!formatter.replaceOnNextInput &&
                inputEl && inputEl.selectionStart !== undefined &&
                inputEl.selectionStart !== inputEl.selectionEnd) {
              formatter.replaceOnNextInput = true;
            }
            if (value === 'C') formatter.clear();
            else if (value === 'back') formatter.backspace();
            else formatter.keypadInput(value);
          }
          return;
        }
      }

      // 2. Fallback → envia para o input de pagamento
      if (value === 'C') clearFooterCash();
      else if (value === 'back') backspaceFooterCash();
      else footerKeypadInput(value);
    });
  });
  
  console.log('✅ [FOOTER] Keypad inicializado com confirmação explícita');
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
  loadFooterPaymentMethods();
  initOrderSummarySlider();
  initFooterKeypad();
  if (typeof initBottomSheetSystem === 'function') initBottomSheetSystem();
});

/**
 * Preenche o input do método de pagamento atual com o valor exato do total
 * Chamada ao clicar no botão "Exact"
 */
function fillExactAmount() {
  // ✅ Verifica se há um método de pagamento selecionado
  if (!selectedPaymentMethod) {
    console.warn('⚠️ [EXACT] Nenhum método de pagamento selecionado');
    showAlert('warning', '⚠️ Selecione um Método', 'Por favor, selecione um método de pagamento primeiro');
    return;
  }

  // ✅ Verifica se há produtos no carrinho
  if (cart.size === 0 || currentCartTotal === 0) {
    console.warn('⚠️ [EXACT] Carrinho vazio');
    showAlert('warning', '⚠️ Carrinho Vazio', 'Adicione produtos ao carrinho primeiro');
    return;
  }

  // ✅ CORREÇÃO: Calcula o VALOR RESTANTE a pagar
  const totalAPagar = currentCartTotal;
  
  // Soma todos os pagamentos JÁ CONFIRMADOS (exceto o método atual)
  let somaPagamentos = 0;
  footerPaymentMethods.forEach(metodo => {
    const slug = metodo.slug;
    
    // Ignora o método atual (ainda está sendo editado)
    if (slug !== selectedPaymentMethod) {
      somaPagamentos += parseFloat(footerValoresPorMetodo[slug]) || 0;
    }
  });
  
  // Calcula quanto AINDA FALTA PAGAR
  const valorRestante = totalAPagar - somaPagamentos;
  
  // ✅ NOVO: Usa o VALOR RESTANTE em vez do total
  const exactAmount = valorRestante;

  console.log(`💰 [EXACT] Preenchendo ${exactAmount.toFixed(2)} Kz no método: ${selectedPaymentMethod}`);
  console.log(`📊 [EXACT] Total: ${totalAPagar} | Já pago: ${somaPagamentos} | Restante: ${valorRestante}`);

  // ✅ CORREÇÃO 1: Atualiza a variável global footerCashAmount
  footerCashAmount = String(exactAmount);
  
  // ✅ CORREÇÃO 2: Salva o valor no método de pagamento atual
  footerValoresPorMetodo[selectedPaymentMethod] = exactAmount;
  console.log(`💾 [EXACT] Salvando ${selectedPaymentMethod}: ${exactAmount} Kz`);

  // ✅ CORREÇÃO 3: Atualiza o formatter do footer com o valor exato
  if (window.footerCashFormatter) {
    window.footerCashFormatter.setValue(exactAmount);
  }

  // ✅ CORREÇÃO 4: Agora updateFooterPaymentCards() lerá os valores corretos
  updateFooterPaymentCards();

  // ✅ Feedback visual de sucesso
  showAlert('success', '✅ Valor Exato Inserido', `${exactAmount.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} Kz foi inserido no pagamento`);

  console.log('✅ [EXACT] Valor exato preenchido com sucesso');
}

/**
 * ✅ NOVA FUNÇÃO: Confirma valor digitado e atualiza cards
 * Chamada APENAS quando:
 * - Usuário pressiona Enter
 * - Usuário clica fora do input (blur)
 * - Usuário troca de método de pagamento
 */
function confirmFooterPaymentValue() {
  // Só confirma se há um método selecionado
  if (!selectedPaymentMethod) {
    console.log('⚠️ [CONFIRM] Nenhum método selecionado');
    return;
  }
  
  // Pega o valor atual do formatter
  const currentValue = window.footerCashFormatter ? 
    window.footerCashFormatter.getValue() : 
    parseFloat(footerCashAmount) || 0;
  
  console.log(`✅ [CONFIRM] Confirmando valor ${currentValue} para ${selectedPaymentMethod}`);
  
  // Salva o valor confirmado
  footerValoresPorMetodo[selectedPaymentMethod] = currentValue;
  footerCashAmount = String(currentValue);
  
  // ✅ AGORA SIM: Atualiza os cards com o valor confirmado
  updateFooterPaymentCards();
  
  console.log(`✅ [CONFIRM] Cards atualizados com valor confirmado`);
}

// ✅ Expõe a função globalmente
window.fillExactAmount = fillExactAmount;
window.confirmFooterPaymentValue = confirmFooterPaymentValue;

// Expor funções globalmente
window.getSelectedPaymentMethod = getSelectedPaymentMethod;
window.footerKeypadInput = footerKeypadInput;
window.backspaceFooterCash = backspaceFooterCash;
window.clearFooterCash = clearFooterCash;
window.updateFooterCashDisplay = updateFooterCashDisplay;
window.getFooterCashAmount = getFooterCashAmount;
window.updateFooterPaymentCards = updateFooterPaymentCards;
window.selectFooterPaymentMethod = selectFooterPaymentMethod;
window.resetFooterPaymentValues = resetFooterPaymentValues;
window.updatePaymentStatus = updatePaymentStatus;
window.refreshPaymentMethodsOverflow = refreshPaymentMethodsOverflow;
window.scheduleRefreshPaymentMethodsOverflow = scheduleRefreshPaymentMethodsOverflow;





         /* ================================================
   FIM do Payment UI

   ================================================ */


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



         /* ================================================
   FIM do Products UI

   ================================================ */


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




         /* ================================================
   FIM do Search UI

   ================================================ */

/* ================================================
   MÓDULO: Skeleton UI
   Ficheiro: assets/js/ui/skeleton.ui.js
   Parte do sistema Dash-POS
   ================================================ */

/** Skeleton loading: marcar produtos como prontos e eventualmente esconder skeleton */
function skeletonMarkProductsReady() {
  window.__skeletonProductsReady = true;
  skeletonTryHide();
}

/** Skeleton loading: marcar carrinho como pronto e eventualmente esconder skeleton */
function skeletonMarkCartReady() {
  window.__skeletonCartReady = true;
  skeletonTryHide();
}

function skeletonTryHide() {
  if (!window.__skeletonProductsReady || !window.__skeletonCartReady) return;
  const el = document.getElementById('appSkeleton');
  if (!el) return;
  window.__skeletonHidden = true;
  el.classList.add('hidden');
  el.setAttribute('aria-hidden', 'true');
}




         /* ================================================
   FIM do Skeleton UI

   ================================================ */

/* ================================================
   MÓDULO: Monetary-formatter.js
   Ficheiro: assets/js/utils/monetary-formatter.js
   Parte do sistema Dash-POS
   ================================================ */


class MonetaryFormatter {
  constructor(inputId, options = {}) {
    // PRIVATE PROPERTIES
    this.inputId = inputId;
    this.inputElement = document.getElementById(inputId);
    this.internalValue = '0';
    this.locale = options.locale || 'pt-AO';
    this.currency = options.currency || 'Kz';
    this.decimals = options.decimals !== undefined ? options.decimals : 2;
    this.allowNegative = options.allowNegative || false;
    
    // ✅ NEW PROPERTIES for mathematical operations
    this.operationMode = null;        // 'addition' | 'subtraction' | null
    this.operationBuffer = '0';       // Value being typed after operator
    this.previousValue = '0';         // Value before the operation
    this.replaceOnNextInput = false;  // When true, next digit replaces internalValue instead of appending

    // OPTIONAL CALLBACKS
    this.onValueChange = options.onValueChange || null;
    
    // INITIALIZATION
    if (this.inputElement) {
      this._init();
    }
  }
  
  _init() {
    // 1. Define input as readonly
    this.inputElement.setAttribute('readonly', 'true');
    
    // 2. Listener will be added by enable() when needed
    this._boundKeyboardHandler = null;
    this._boundInputHandler = null;
  }
  
  _formatDisplay() {
    // ✅ CRITICAL: Refresh DOM reference before updating
    this._refreshInputReference();
    
    if (!this.inputElement) {
      console.warn(`[MonetaryFormatter] Cannot format display - input ${this.inputId} not in DOM`);
      return;
    }
    
    // ✅ OPERATION MODE: Display two values with operator
    if (this.operationMode) {
      const previousFormatted = this._formatValue(this.previousValue);
      const bufferFormatted = this._formatValue(this.operationBuffer);
      const operator = this.operationMode === 'addition' ? '+' : '−';
      
      this.inputElement.value = `${this.currency} ${previousFormatted} ${operator} ${this.currency} ${bufferFormatted}`;
    } 
    // ✅ NORMAL MODE: Display only one value
    else {
      const formatted = this._formatValue(this.internalValue);
      this.inputElement.value = `${this.currency} ${formatted}`;
    }
  }
  
  // ✅ NEW HELPER: Format a numeric value
  _formatValue(valueString) {
    const value = parseFloat(valueString) || 0;
    return value.toLocaleString(this.locale, {
      minimumFractionDigits: this.decimals,
      maximumFractionDigits: this.decimals
    });
  }
  
  // ✅ NEW METHOD: Start a mathematical operation
  startOperation(operation) {
    if (this.operationMode !== null) {
      console.warn('[MonetaryFormatter] Operation already in progress');
      return;
    }
    
    // Save current value and start operation mode
    this.previousValue = this.internalValue;
    this.operationMode = operation;
    this.operationBuffer = '0';
    
    console.log(`➕ [MonetaryFormatter] Operation started: ${operation}`);
    this._formatDisplay();
  }
  
  // ✅ NEW METHOD: Execute the calculation and return to normal mode
  executeOperation() {
    if (this.operationMode === null) {
      console.warn('[MonetaryFormatter] No operation to execute');
      return;
    }
    
    const prev = parseFloat(this.previousValue) || 0;
    const buffer = parseFloat(this.operationBuffer) || 0;
    
    let result;
    if (this.operationMode === 'addition') {
      result = prev + buffer;
    } else if (this.operationMode === 'subtraction') {
      result = prev - buffer;
      
      // ✅ VALIDATION: Don't allow negative result (if allowNegative = false)
      if (!this.allowNegative && result < 0) {
        console.warn('[MonetaryFormatter] Result would be negative, operation cancelled');
        this.cancelOperation();
        return;
      }
    }
    
    // Update internal value and reset operation state
    this.internalValue = String(result);
    this.operationMode = null;
    this.operationBuffer = '0';
    this.previousValue = '0';
    
    console.log(`✅ [MonetaryFormatter] Operation executed. Result: ${result}`);
    
    this._formatDisplay();
    this._triggerCallback();
  }
  
  // ✅ NEW METHOD: Cancel operation in progress (ESC)
  cancelOperation() {
    if (this.operationMode === null) {
      return;
    }
    
    console.log('❌ [MonetaryFormatter] Operation cancelled');
    
    // Reset operation state
    this.operationMode = null;
    this.operationBuffer = '0';
    this.previousValue = '0';
    
    this._formatDisplay();
  }
  
  keypadInput(value) {
    // ✅ REPLACE MODE: Se replaceOnNextInput está activo OU se há seleção DOM real,
    // o próximo dígito deve substituir internalValue em vez de concatenar.
    // Cobre: auto-seleção no duplo clique, re-seleção por mouse, re-seleção por Shift+setas.
    const hasRealDOMSelection = this.inputElement &&
      this.inputElement.selectionStart !== undefined &&
      this.inputElement.selectionStart !== this.inputElement.selectionEnd;

    if (this.replaceOnNextInput || hasRealDOMSelection) {
      this.internalValue = '0';
      this.operationBuffer = '0';
      this.replaceOnNextInput = false;
    }

    // ✅ CORRECTION: If in operation mode, type in the buffer
    const targetValue = this.operationMode ? 'operationBuffer' : 'internalValue';
    
    if (value === '.') {
      if (!this[targetValue].includes('.')) {
        this[targetValue] += '.';
      }
    } else if (value === '0') {
      if (this[targetValue] === '0') {
        return;
      } else if (this[targetValue] === '0.') {
        this[targetValue] += value;
      } else if (this[targetValue] === '') {
        this[targetValue] = '0';
      } else {
        this[targetValue] += value;
      }
    } else {
      if (this[targetValue] === '0') {
        this[targetValue] = value;
      } else {
        this[targetValue] += value;
      }
    }
    
    // ✅ Limit decimal places
    if (this[targetValue].includes('.')) {
      const parts = this[targetValue].split('.');
      if (parts[1] && parts[1].length > this.decimals) {
        parts[1] = parts[1].substring(0, this.decimals);
        this[targetValue] = parts[0] + '.' + parts[1];
      }
    }
    
    this._formatDisplay();
    
    // ✅ CORRECTION: Only trigger callback if not in operation mode
    if (!this.operationMode) {
      this._triggerCallback();
    }
  }
  
  backspace() {
    // ✅ CORRECTION: If in operation mode, delete from buffer
    const targetValue = this.operationMode ? 'operationBuffer' : 'internalValue';
    
    if (this[targetValue].length > 0) {
      this[targetValue] = this[targetValue].slice(0, -1);
      
      if (this[targetValue] === '' || this[targetValue] === '.') {
        this[targetValue] = '0';
      }
    }
    
    this._formatDisplay();
    
    // ✅ CORRECTION: Only trigger callback if not in operation mode
    if (!this.operationMode) {
      this._triggerCallback();
    }
  }
  
  clear() {
    // ✅ CORRECTION: Reset EVERYTHING (value + operation)
    this.internalValue = '0';
    this.operationMode = null;
    this.operationBuffer = '0';
    this.previousValue = '0';
    
    this._formatDisplay();
    this._triggerCallback();
  }
  
  handleKeyboard(event) {
    const key = event.key;
    
    // ✅ ADDITION (+)
    if (key === '+') {
      event.preventDefault();
      if (this.operationMode === null) {
        this.startOperation('addition');
      }
      return;
    }
    
    // ✅ SUBTRACTION (-)
    if (key === '-') {
      event.preventDefault();
      if (this.operationMode === null) {
        this.startOperation('subtraction');
      }
      return;
    }
    
    // ✅ ENTER (Execute operation or confirm value)
    if (key === 'Enter') {
      event.preventDefault();
      if (this.operationMode !== null) {
        this.executeOperation();
      }
      return;
    }
    
    // ✅ ESC (Cancel operation)
    if (key === 'Escape') {
      event.preventDefault();
      if (this.operationMode !== null) {
        this.cancelOperation();
      }
      return;
    }
    
    if (/[0-9]/.test(key)) {
      event.preventDefault();
      this.keypadInput(key);
    } else if (key === '.' || key === ',' || key === 'Decimal') {
      event.preventDefault();
      this.keypadInput('.');
    } else if (key === 'Backspace') {
      event.preventDefault();
      this.backspace();
    } else if (key === 'Delete' || key === 'Clear') {
      event.preventDefault();
      this.clear();
    }
  }
  
  getValue() {
    return parseFloat(this.internalValue) || 0;
  }
  
  setValue(newValue) {
    this.internalValue = String(newValue);
    this._formatDisplay();
  }
  
  _triggerCallback() {
    if (this.onValueChange) {
      this.onValueChange(this.getValue());
    }
  }
  
  /**
   * ✅ NEW METHOD: Refresh input element reference from DOM
   * CRITICAL for handling re-rendered elements with same ID
   */
  _refreshInputReference() {
    const currentElement = document.getElementById(this.inputId);
    
    // If element changed (different object), update reference
    if (currentElement !== this.inputElement) {
      console.log(`🔄 [MonetaryFormatter] Input ${this.inputId} reference updated`);
      this.inputElement = currentElement;
    }
    
    if (!this.inputElement) {
      console.warn(`⚠️ [MonetaryFormatter] Input ${this.inputId} not found in DOM`);
    }
  }
  
  /**
   * ✅ CORRECTED: Enable formatting with DOM reference refresh
   */
  enable() {
    // ✅ CRITICAL FIX: Always refresh DOM reference before enabling
    this._refreshInputReference();
    
    if (!this.inputElement) {
      console.error(`❌ [MonetaryFormatter] Cannot enable - input ${this.inputId} not found`);
      return;
    }
    
    // Remove readonly to allow focus and editing
    this.inputElement.removeAttribute('readonly');
    
    // Create bound handlers if they don't exist
    if (!this._boundKeyboardHandler) {
      this._boundKeyboardHandler = (event) => this.handleKeyboard(event);
    }
    
    if (!this._boundInputHandler) {
      // Prevent direct input that bypasses our keyboard handler
      this._boundInputHandler = (event) => {
        event.preventDefault();
        this._formatDisplay();
      };
    }
    
    // ✅ Remove old listeners first (prevent duplicates)
    this.inputElement.removeEventListener('keydown', this._boundKeyboardHandler);
    this.inputElement.removeEventListener('input', this._boundInputHandler);
    this.inputElement.removeEventListener('paste', this._preventPaste);
    
    // ✅ Add fresh listeners to CURRENT element
    this.inputElement.addEventListener('keydown', this._boundKeyboardHandler);
    this.inputElement.addEventListener('input', this._boundInputHandler);
    this.inputElement.addEventListener('paste', this._preventPaste);
    
    console.log(`✅ [MonetaryFormatter] Enabled for ${this.inputId}`);
  }
  
  /**
   * ✅ CORRECTED: Disable formatting with DOM reference refresh
   */
  disable() {
    // ✅ Refresh reference before disabling
    this._refreshInputReference();
    
    if (!this.inputElement) {
      console.warn(`⚠️ [MonetaryFormatter] Cannot disable - input ${this.inputId} not found`);
      return;
    }
    
    // Remove ALL event listeners
    if (this._boundKeyboardHandler) {
      this.inputElement.removeEventListener('keydown', this._boundKeyboardHandler);
    }
    
    if (this._boundInputHandler) {
      this.inputElement.removeEventListener('input', this._boundInputHandler);
    }
    
    this.inputElement.removeEventListener('paste', this._preventPaste);
    
    // Set readonly
    this.inputElement.setAttribute('readonly', 'true');
    
    console.log(`❌ [MonetaryFormatter] Disabled for ${this.inputId}`);
  }
  
  /**
   * Prevent paste events
   */
  _preventPaste(e) {
    e.preventDefault();
  }
  
  /**
   * ✅ CORRECTED: Destroy with cleanup
   */
  destroy() {
    this.disable();
    this._boundKeyboardHandler = null;
    this._boundInputHandler = null;
    this.inputElement = null;
    console.log(`🗑️ [MonetaryFormatter] Destroyed for ${this.inputId}`);
  }
}


         /* ================================================
   FIM do Factura.js

   ================================================ */


         /* ================================================
   FIM do Factura.js

   ================================================ */


         /* ================================================
   FIM do Factura.js

   ================================================ */


         /* ================================================
   FIM do Factura.js

   ================================================ */


         /* ================================================
   FIM do Factura.js

   ================================================ */


         /* ================================================
   FIM do Factura.js

   ================================================ */


         /* ================================================
   FIM do Factura.js

   ================================================ */


         /* ================================================
   FIM do Factura.js

   ================================================ */


         /* ================================================
   FIM do Factura.js

   ================================================ */


         /* ================================================
   FIM do Factura.js

   ================================================ */


         /* ================================================
   FIM do Factura.js

   ================================================ */


         /* ================================================
   FIM do Factura.js

   ================================================ */


         /* ================================================
   FIM do Factura.js

   ================================================ */

         /* ================================================
   FIM do Factura.js

   ================================================ */