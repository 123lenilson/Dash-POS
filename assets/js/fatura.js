/* FATURA.JS - Sistema de Renderização com prefixo inv-a4- */

// ✅ PROTEÇÃO CONTRA CARREGAMENTO DUPLICADO
if (window.FATURA_JS_LOADED) {
    console.warn('⚠️ fatura.js já foi carregado anteriormente. Ignorando...');
} else {
    window.FATURA_JS_LOADED = true;
    
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
                        <h4>${dadosFatura.titulo_documento || 'FATURA RECIBO'}</h4>
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
    console.log('📄 Renderizando fatura');
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
    
    console.log('✅ Fatura renderizada com', todasPaginas.length, 'página(s)');
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
            retencao: 0,  // ✅ Para faturas do checkout local, retenção é sempre 0
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

// ✅ NOVA FUNÇÃO: Renderizar fatura com dados vindos do backend
function renderizarFaturaComDadosBackend(dadosBackend) {
    console.log('📥 [FATURA] Recebendo dados do backend:', dadosBackend);
    
    // ✅ TRANSFORMAR dados do backend no formato esperado pelo renderizador
    const dadosFatura = {
        numeroFatura: dadosBackend.codigo_documento || 'F00001',
        titulo_documento: dadosBackend.titulo_documento || 'FATURA RECIBO',
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
            total: dadosBackend.total_pago || 0
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
    
    console.log('📦 [FATURA] Dados transformados:', dadosFatura);
    
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
    
    console.log('✅ [FATURA] Renderização com dados do backend concluída!');
}

// Exportar a nova função
window.renderizarFaturaComDadosBackend = renderizarFaturaComDadosBackend;

console.log('✅ fatura.js carregado com prefixo inv-a4-');

} // Fecha o bloco de proteção contra carregamento duplicado