<?php
require_once __DIR__ . '/../config/conexao.php';

class VendaModel {
    
    public function processarFatura($id_cliente) {
        error_log('===== INICIO processarFatura =====');
        error_log('ID Cliente recebido: ' . $id_cliente);
        
        $db = Conexao::getConexao();
        $db->autocommit(false);  // Transação básica

        try {
            // Variáveis padrão
            $usuario = 1;
            $empresa = 1;
            $data_atual = date('Y-m-d');
            $hora_atual = date('H:i:s');
            $ano_atual = date('Y');
            $codenome = 'FT';  // Código para Fatura

            $id_cliente = (int)$id_cliente;

            // PASSO 1: SELECT Pedido com JOIN na tabela imposto
            $sql_pedido = "
                SELECT 
                    p.idpedido, 
                    p.n_pedido, 
                    p.id_produto, 
                    p.descricao, 
                    p.qtd, 
                    p.preco, 
                    p.desconto, 
                    p.imposto AS imposto_id,
                    imp.percentagem AS imposto_percentagem,
                    imp.imposto AS imposto_descricao,
                    p.dataa, 
                    p.hora, 
                    p.conta, 
                    p.mesa, 
                    p.usuario
                FROM pedido p
                LEFT JOIN imposto imp ON imp.id = p.imposto
                WHERE p.usuario = ?
            ";
            $stmt_pedido = $db->prepare($sql_pedido);
            if (!$stmt_pedido) {
                throw new Exception("Erro ao preparar SELECT Pedido: " . $db->error);
            }
            $stmt_pedido->bind_param("i", $usuario);
            $stmt_pedido->execute();
            $result_pedido = $stmt_pedido->get_result();
            $pedidos = [];
            if ($result_pedido->num_rows > 0) {
                while ($row = $result_pedido->fetch_assoc()) {
                    $row['qtd'] = (int)$row['qtd'];
                    $row['preco'] = (float)$row['preco'];
                    $row['desconto'] = (float)$row['desconto'];
                    $row['imposto'] = (float)($row['imposto_percentagem'] ?? 0);
                    $row['imposto_id'] = (int)($row['imposto_id'] ?? 0);
                    $row['imposto_descricao'] = $row['imposto_descricao'] ?? '';
                    $pedidos[] = $row;
                }
            }
            $stmt_pedido->close();

            if (empty($pedidos)) {
                throw new Exception("Nenhum pedido encontrado para usuário $usuario");
            }

            error_log('✅ PASSO 1 OK: Pedidos encontrados (' . count($pedidos) . ' itens)');

            // PASSO 2: SELECT Cliente
            $sql_cliente = "
                SELECT idcliente, nome, nif, email, telefone, morada, endereco, empresa, usuario 
                FROM cliente 
                WHERE idcliente = ?
            ";
            $stmt_cliente = $db->prepare($sql_cliente);
            if (!$stmt_cliente) {
                throw new Exception("Erro ao preparar SELECT Cliente: " . $db->error);
            }
            $stmt_cliente->bind_param("i", $id_cliente);
            $stmt_cliente->execute();
            $result_cliente = $stmt_cliente->get_result();
            $cliente = [];
            if ($result_cliente->num_rows > 0) {
                $cliente = $result_cliente->fetch_assoc();
            }
            $stmt_cliente->close();

            if (empty($cliente)) {
                throw new Exception("Cliente com ID $id_cliente não encontrado");
            }

            error_log('✅ PASSO 2 OK: Cliente encontrado - Nome: ' . ($cliente['nome'] ?? 'N/A'));

            // PASSO 3: Geração do NFatura a partir da tabela Venda
            $sql_max_nfat = "SELECT MAX(N_fat) AS max_nfat FROM venda";
            $result_max = $db->query($sql_max_nfat);
            if (!$result_max) {
                throw new Exception("Erro ao consultar MAX N_fat na tabela venda: " . $db->error);
            }
            $max_nfat = $result_max->fetch_assoc()['max_nfat'] ?? 0;
            $n_fatura = $max_nfat + 1;

            error_log('✅ PASSO 3 OK: NFatura gerado - ' . $n_fatura);

            // PASSO 4: Geração do código do documento (fatura)
            // Estrutura: [codigo_nome] [ano]/[numero_fatura] => F 2025/1
            $codigo_documento = $codenome . ' ' . $ano_atual . '/' . $n_fatura;
            error_log('✅ PASSO 4 OK: Código do documento gerado - ' . $codigo_documento);

            // PASSO 5: REMOVIDO - NÃO processar pagamentos na fatura simples

            // PASSO 6: Inserir registros de venda na tabela venda
            $id_venda_inserida = null;
            foreach ($pedidos as $pedido) {
                $sql_venda = "
                    INSERT INTO venda (
                        Produto_idProduto, Qtd, preconormal, iva, datavenda, hora, N_fat, 
                        desconto, cliente, Usuario, Tipo_docum, iva_valor, caixa, condicao, 
                        Justificacao, codigo_doc, Nome, assinatura, Hash, referncia, 
                        n_cliente, Motivo, Descricao, Referencia_a, empresa
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ";
                $stmt_venda = $db->prepare($sql_venda);
                if (!$stmt_venda) {
                    throw new Exception("Erro ao preparar INSERT venda: " . $db->error);
                }
                
                // Preparar valores conforme especificações
                $id_produto = (int)$pedido['id_produto'];
                $qtd = (float)$pedido['qtd'];
                $preco_normal = (float)$pedido['preco'];
                $iva = null;
                $data_venda = $data_atual;
                $hora = $hora_atual;
                $n_fat = (int)$n_fatura;
                $desconto = (float)$pedido['desconto'];
                $id_cliente_venda = (int)$id_cliente;
                $usuario_venda = (int)$usuario;
                $tipo_documento = 'Fatura';  // Tipo específico para fatura
                $iva_valor = '0';
                $caixa = 1;
                $condicao = null;
                $justificacao = null;
                $codigo_doc = (string)$codigo_documento;
                $nome = null;
                $assinatura = null;
                $hash = null;
                $referencia = null;
                $n_cliente = null;
                $motivo = null;
                $descricao = null;
                $referencia_a = $id_produto;
                $empresa_venda = (int)$empresa;
                
                $stmt_venda->bind_param(
                    "idssssidiissssssssssssssi",
                    $id_produto, $qtd, $preco_normal, $iva, $data_venda, $hora, 
                    $n_fat, $desconto, $id_cliente_venda, $usuario_venda, $tipo_documento_venda, 
                    $iva_valor, $caixa, $condicao, $justificacao, $codigo_doc, $nome, 
                    $assinatura, $hash, $referencia, $n_cliente, $motivo, $descricao, 
                    $referencia_a, $empresa_venda
                );
                
                if (!$stmt_venda->execute()) {
                    $stmt_venda->close();
                    throw new Exception("Erro ao inserir em venda: " . $stmt_venda->error);
                }
                
                if ($id_venda_inserida === null) {
                    $id_venda_inserida = $stmt_venda->insert_id;
                }
                
                $stmt_venda->close();
            }
            
            error_log('✅ PASSO 6 OK: Registros de venda inseridos - ID inicial: ' . $id_venda_inserida);

            // PASSO 6.1: Atualizar stock dos produtos vendidos (diferente da fatura pró-forma)
            foreach ($pedidos as $pedido) {
                $id_produto = (int)$pedido['id_produto'];
                $qtd_vendida = (float)$pedido['qtd'];
                
                // Verificar se o item é um produto (PS = 'P') ou serviço (PS = 'S')
                $sql_check_ps = "SELECT PS FROM produto WHERE idproduto = ?";
                $stmt_check_ps = $db->prepare($sql_check_ps);
                
                if (!$stmt_check_ps) {
                    throw new Exception("Erro ao preparar SELECT PS: " . $db->error);
                }
                
                $stmt_check_ps->bind_param("i", $id_produto);
                $stmt_check_ps->execute();
                $result_ps = $stmt_check_ps->get_result();
                
                if ($result_ps->num_rows > 0) {
                    $row_ps = $result_ps->fetch_assoc();
                    $tipo_item = strtoupper(trim($row_ps['PS'] ?? ''));
                    $stmt_check_ps->close();
                    
                    // Aplicar desconto de stock APENAS se for PRODUTO (PS = 'P')
                    if ($tipo_item === 'P') {
                        // UPDATE na tabela produto: diminuir a quantidade vendida do stock atual
                        $sql_update_stock = "UPDATE produto SET QTD = QTD - ? WHERE idproduto = ?";
                        $stmt_update_stock = $db->prepare($sql_update_stock);
                        
                        if (!$stmt_update_stock) {
                            throw new Exception("Erro ao preparar UPDATE stock: " . $db->error);
                        }
                        
                        $stmt_update_stock->bind_param("di", $qtd_vendida, $id_produto);
                        
                        if (!$stmt_update_stock->execute()) {
                            $stmt_update_stock->close();
                            throw new Exception("Erro ao atualizar stock do produto ID $id_produto: " . $stmt_update_stock->error);
                        }
                        
                        $linhas_afetadas = $stmt_update_stock->affected_rows;
                        $stmt_update_stock->close();
                        
                        if ($linhas_afetadas > 0) {
                            error_log("✅ Stock atualizado - Produto ID: $id_produto | Qtd descontada: $qtd_vendida | Tipo: PRODUTO (P)");
                        } else {
                            error_log("⚠️ AVISO: Produto ID $id_produto não encontrado ou stock não alterado");
                        }
                    } elseif ($tipo_item === 'S') {
                        // É um serviço, não aplicar desconto de stock
                        error_log("ℹ️ Item ID: $id_produto | Tipo: SERVIÇO (S) | Stock NÃO descontado (serviços não possuem stock)");
                    } else {
                        error_log("⚠️ AVISO: Item ID $id_produto possui PS inválido: '$tipo_item' (esperado 'P' ou 'S')");
                    }
                } else {
                    $stmt_check_ps->close();
                    error_log("⚠️ AVISO: Item ID $id_produto não encontrado na tabela produto");
                }
            }
            
            error_log('✅ PASSO 6.1 OK: Atualização de stock processada (apenas produtos)');

            // PASSO 7: Selecionar dados da empresa da tabela login
            $sql_empresa = "
                SELECT * FROM login 
                WHERE ID = ? AND dica = 'empresa'
            ";
            $stmt_empresa = $db->prepare($sql_empresa);
            if (!$stmt_empresa) {
                throw new Exception("Erro ao preparar SELECT empresa: " . $db->error);
            }
            $stmt_empresa->bind_param("i", $empresa);
            $stmt_empresa->execute();
            $result_empresa = $stmt_empresa->get_result();
            $dados_empresa = [];
            if ($result_empresa->num_rows > 0) {
                $dados_empresa = $result_empresa->fetch_assoc();
            }
            $stmt_empresa->close();

            if (empty($dados_empresa)) {
                throw new Exception("Dados da empresa não encontrados");
            }

            error_log('✅ PASSO 7 OK: Dados da empresa encontrados');

            // PASSO 8: Processar produtos para a segunda tabela do corpo da fatura
            $produtos_fatura = [];
            $numero_item = 1;
            
            foreach ($pedidos as $pedido) {
                $qtd = (float)$pedido['qtd'];
                $preco = (float)$pedido['preco'];
                $desconto_percentual = (float)$pedido['desconto'];
                $imposto_percentual = (float)$pedido['imposto'];
                
                $valor_base = $qtd * $preco;
                
                $valor_com_desconto = $valor_base;
                if ($desconto_percentual > 0) {
                    $valor_desconto = ($valor_base * $desconto_percentual) / 100;
                    $valor_com_desconto = $valor_base - $valor_desconto;
                }
                
                $total_item = $valor_com_desconto;
                if ($imposto_percentual > 0) {
                    $valor_imposto = ($valor_com_desconto * $imposto_percentual) / 100;
                    if (!($imposto_percentual == 6.5 || $imposto_percentual == 6.50)) {
                        $total_item = $valor_com_desconto + $valor_imposto;
                    }
                }
                
                $produtos_fatura[] = [
                    'numero' => str_pad($numero_item, 3, '0', STR_PAD_LEFT),
                    'designacao' => $pedido['descricao'],
                    'qtd' => $qtd,
                    'preco_unitario' => $preco,
                    'desconto_percentual' => $desconto_percentual,
                    'taxa_percentual' => ($imposto_percentual == 6.5 || $imposto_percentual == 6.50) ? 0 : $imposto_percentual,
                    'total' => $total_item
                ];
                
                $numero_item++;
            }
            
            error_log('✅ PASSO 8 OK: Produtos processados para fatura (' . count($produtos_fatura) . ' itens)');

            // PASSO 9: Calcular totais para a primeira tabela do rodapé
            $total_iliquido = 0;
            $total_desconto = 0;
            $total_imposto = 0;
            $total_retencao = 0;
            
            foreach ($pedidos as $pedido) {
                $qtd = (float)$pedido['qtd'];
                $preco = (float)$pedido['preco'];
                $desconto_percentual = (float)$pedido['desconto'];
                $imposto_percentual = (float)$pedido['imposto'];
                
                $valor_base = $qtd * $preco;
                $total_iliquido += $valor_base;
                
                if ($desconto_percentual > 0) {
                    $valor_desconto = ($valor_base * $desconto_percentual) / 100;
                    $total_desconto += $valor_desconto;
                }
                
                if ($imposto_percentual > 0) {
                    $valor_com_desconto = $valor_base;
                    if ($desconto_percentual > 0) {
                        $valor_desconto = ($valor_base * $desconto_percentual) / 100;
                        $valor_com_desconto = $valor_base - $valor_desconto;
                    }
                    $valor_imposto = ($valor_com_desconto * $imposto_percentual) / 100;
                    
                    if ($imposto_percentual == 6.5 || $imposto_percentual == 6.50) {
                        $total_retencao += $valor_imposto;
                    } else {
                        $total_imposto += $valor_imposto;
                    }
                }
            }

            // ✅ VALOR A PAGAR: Quanto o cliente DEVE pagar (total da fatura)
            // Fórmula: Total Ilíquido - Desconto + Imposto (IVA)
            // Retenção NÃO entra no cálculo (é deduzida do total)
            $valor_a_pagar = $total_iliquido - $total_desconto + $total_imposto;

            error_log('✅ PASSO 9 OK: Totais calculados - Ilíquido: ' . $total_iliquido . ' | Desconto: ' . $total_desconto . ' | Imposto (IVA): ' . $total_imposto . ' | Retenção: ' . $total_retencao . ' | Valor a Pagar: ' . $valor_a_pagar);

            // PASSO 10: REMOVIDO - NÃO selecionar formas de pagamento na fatura simples

            // PASSO 11: Processar resumo de impostos (agrupado por taxa)
            $resumo_impostos_agrupado = [];
            
            foreach ($pedidos as $pedido) {
                $qtd = (float)$pedido['qtd'];
                $preco = (float)$pedido['preco'];
                $desconto_percentual = (float)$pedido['desconto'];
                $imposto_percentual = (float)$pedido['imposto'];
                
                $valor_base = $qtd * $preco;
                
                $valor_com_desconto = $valor_base;
                if ($desconto_percentual > 0) {
                    $valor_desconto = ($valor_base * $desconto_percentual) / 100;
                    $valor_com_desconto = $valor_base - $valor_desconto;
                }
                
                $valor_imposto = 0;
                if ($imposto_percentual > 0) {
                    $valor_imposto = ($valor_com_desconto * $imposto_percentual) / 100;
                }
                
                $taxa_key = (string)$imposto_percentual;
                
                if (!isset($resumo_impostos_agrupado[$taxa_key])) {
                    $resumo_impostos_agrupado[$taxa_key] = [
                        'taxa' => $imposto_percentual,
                        'incidencia' => 0,
                        'imposto' => 0
                    ];
                }
                
                $resumo_impostos_agrupado[$taxa_key]['incidencia'] += $valor_com_desconto;
                $resumo_impostos_agrupado[$taxa_key]['imposto'] += $valor_imposto;
            }
            
            $resumo_impostos = [];
            
            if (isset($resumo_impostos_agrupado['0'])) {
                $resumo_impostos[] = [
                    'descricao' => 'ISENTO',
                    'taxa_percentual' => 0,
                    'incidencia' => $resumo_impostos_agrupado['0']['incidencia'],
                    'imposto' => 0,
                    'motivo' => 'Transmissão de Bens e serviços não suscetíveis'
                ];
            }
            
            if (isset($resumo_impostos_agrupado['14'])) {
                $resumo_impostos[] = [
                    'descricao' => 'IVA',
                    'taxa_percentual' => 14,
                    'incidencia' => $resumo_impostos_agrupado['14']['incidencia'],
                    'imposto' => $resumo_impostos_agrupado['14']['imposto'],
                    'motivo' => ''
                ];
            }
            
            if (isset($resumo_impostos_agrupado['7'])) {
                $resumo_impostos[] = [
                    'descricao' => 'IVA',
                    'taxa_percentual' => 7,
                    'incidencia' => $resumo_impostos_agrupado['7']['incidencia'],
                    'imposto' => $resumo_impostos_agrupado['7']['imposto'],
                    'motivo' => ''
                ];
            }
            
            if (isset($resumo_impostos_agrupado['5'])) {
                $resumo_impostos[] = [
                    'descricao' => 'IVA',
                    'taxa_percentual' => 5,
                    'incidencia' => $resumo_impostos_agrupado['5']['incidencia'],
                    'imposto' => $resumo_impostos_agrupado['5']['imposto'],
                    'motivo' => ''
                ];
            }
            
            error_log('✅ PASSO 11 OK: Resumo de impostos processado (' . count($resumo_impostos) . ' linhas)');

            // PASSO 12: Coletar observação (se existir)
            // ✅ CORREÇÃO: Mesmo processo robusto
            $observacao = '';
            
            if (isset($dados['observacao'])) {
                if (is_string($dados['observacao'])) {
                    $observacao = trim($dados['observacao']);
                } else if (!is_null($dados['observacao'])) {
                    $observacao = strval($dados['observacao']);
                    error_log('⚠️ AVISO: Observacao não era string em processarFatura, convertida');
                }
            }
            
            if ($observacao === null) {
                $observacao = '';
                error_log('⚠️ AVISO: Observacao era null, forçada para string vazia');
            }
            
            error_log('✅ PASSO 12 OK: Observação definida' . ($observacao ? ' (com conteúdo: "' . substr($observacao, 0, 30) . '...")' : ' (vazia)'));

            // PASSO 13: Definir nome do usuário
            $nome_usuario = 'Joana Rafael';
            
            error_log('✅ PASSO 13 OK: Nome do usuário definido - ' . $nome_usuario);

            $db->commit();

            // PASSO 14: Limpar tabela pedido para o usuário (APÓS commit bem-sucedido)
            $sql_limpar_pedido = "DELETE FROM pedido WHERE usuario = ?";
            $stmt_limpar = $db->prepare($sql_limpar_pedido);
            if (!$stmt_limpar) {
                error_log("⚠️ AVISO: Erro ao preparar DELETE pedido: " . $db->error);
            } else {
                $stmt_limpar->bind_param("i", $usuario);
                if ($stmt_limpar->execute()) {
                    $linhas_deletadas = $stmt_limpar->affected_rows;
                    error_log('✅ PASSO 14 OK: Pedidos do usuário ' . $usuario . ' limpos (' . $linhas_deletadas . ' linhas deletadas)');
                } else {
                    error_log("⚠️ AVISO: Erro ao executar DELETE pedido: " . $stmt_limpar->error);
                }
                $stmt_limpar->close();
            }

            // Retorno com todos os dados necessários para gerar a fatura
            return [
                'status' => 'SUCESSO',
                'mensagem' => 'Fatura gerada com sucesso e pedidos do usuário limpos',
                'pedidos' => $pedidos,
                'cliente' => $cliente,
                'n_fatura' => $n_fatura,
                'codigo_documento' => $codigo_documento,
                'id_venda' => $id_venda_inserida,
                'dados_empresa' => $dados_empresa,
                'titulo_documento' => 'FACTURA',  // Título específico
                'data_emissao' => $data_atual,
                'hora_emissao' => $hora_atual,
                'nif_cliente' => $cliente['nif'] ?? '',
                'telefone_cliente' => $cliente['telefone'] ?? '',
                'endereco_cliente' => $cliente['endereco'] ?? '',
                'produtos_fatura' => $produtos_fatura,
                'total_iliquido' => $total_iliquido,
                'total_desconto' => $total_desconto,
                'total_imposto' => $total_imposto,
                'total_retencao' => $total_retencao,
                'valor_a_pagar' => $valor_a_pagar,  // 🔥 NOVO: Valor total a pagar (Ilíquido - Desconto + Imposto)
                // NÃO retornar total_pago e formas_pagamento
                'resumo_impostos' => $resumo_impostos,
                'observacao' => $observacao,
                'nome_usuario' => $nome_usuario
            ];

        } catch (Exception $e) {
            $db->rollback();
            error_log("❌ ERRO NO processarFatura: " . $e->getMessage());
            return [
                'status' => 'ERRO',
                'mensagem' => $e->getMessage()
            ];
        } finally {
            $db->autocommit(true);
        }
    }
    
    public function processarFaturaRecibo($dados) {  // ✅ RENOMEADO: processarFatura -> processarFaturaRecibo
        $db = Conexao::getConexao();
        $db->autocommit(false);  // Transação básica

        try {
            // Variáveis padrão (como no plano)
            $usuario = 1;
            $empresa = 1;
            $data_atual = date('Y-m-d');
            $hora_atual = date('H:i:s');
            $ano_atual = date('Y');
            $codenome = 'FR';  // Código para Fatura Recibo

            $id_cliente = (int)$dados['id_cliente'];

            // Verificar se os dados de pagamento foram enviados
            if (!isset($dados['metodos_pagamento']) || !is_array($dados['metodos_pagamento'])) {
                throw new Exception("Dados de pagamento não informados");
            }

            // PASSO 1: SELECT Pedido com JOIN na tabela imposto
            $sql_pedido = "
                SELECT 
                    p.idpedido, 
                    p.n_pedido, 
                    p.id_produto, 
                    p.descricao, 
                    p.qtd, 
                    p.preco, 
                    p.desconto, 
                    p.imposto AS imposto_id,
                    imp.percentagem AS imposto_percentagem,
                    imp.imposto AS imposto_descricao,
                    p.dataa, 
                    p.hora, 
                    p.conta, 
                    p.mesa, 
                    p.usuario
                FROM pedido p
                LEFT JOIN imposto imp ON imp.id = p.imposto
                WHERE p.usuario = ?
            ";
            $stmt_pedido = $db->prepare($sql_pedido);
            if (!$stmt_pedido) {
                throw new Exception("Erro ao preparar SELECT Pedido: " . $db->error);
            }
            $stmt_pedido->bind_param("i", $usuario);
            $stmt_pedido->execute();
            $result_pedido = $stmt_pedido->get_result();
            $pedidos = [];
            if ($result_pedido->num_rows > 0) {
                while ($row = $result_pedido->fetch_assoc()) {
                    $row['qtd'] = (int)$row['qtd'];
                    $row['preco'] = (float)$row['preco'];
                    $row['desconto'] = (float)$row['desconto'];
                    // ✅ AGORA USAMOS A PERCENTAGEM DA TABELA IMPOSTO
                    $row['imposto'] = (float)($row['imposto_percentagem'] ?? 0);
                    $row['imposto_id'] = (int)($row['imposto_id'] ?? 0);
                    $row['imposto_descricao'] = $row['imposto_descricao'] ?? '';
                    $pedidos[] = $row;
                }
            }
            $stmt_pedido->close();

            if (empty($pedidos)) {
                throw new Exception("Nenhum pedido encontrado para usuário $usuario");
            }

            error_log('✅ PASSO 1 OK: Pedidos encontrados (' . count($pedidos) . ' itens)');

            // PASSO 2: SELECT Cliente
            $sql_cliente = "
                SELECT idcliente, nome, nif, email, telefone, morada, endereco, empresa, usuario 
                FROM cliente 
                WHERE idcliente = ?
            ";
            $stmt_cliente = $db->prepare($sql_cliente);
            if (!$stmt_cliente) {
                throw new Exception("Erro ao preparar SELECT Cliente: " . $db->error);
            }
            $stmt_cliente->bind_param("i", $id_cliente);
            $stmt_cliente->execute();
            $result_cliente = $stmt_cliente->get_result();
            $cliente = [];
            if ($result_cliente->num_rows > 0) {
                $cliente = $result_cliente->fetch_assoc();
            }
            $stmt_cliente->close();

            if (empty($cliente)) {
                throw new Exception("Cliente com ID $id_cliente não encontrado");
            }

            error_log('✅ PASSO 2 OK: Cliente encontrado - Nome: ' . ($cliente['nome'] ?? 'N/A'));

            // PASSO 3: Geração do NFatura a partir da tabela Venda
            $sql_max_nfat = "SELECT MAX(N_fat) AS max_nfat FROM venda";
            $result_max = $db->query($sql_max_nfat);
            if (!$result_max) {
                throw new Exception("Erro ao consultar MAX N_fat na tabela venda: " . $db->error);
            }
            $max_nfat = $result_max->fetch_assoc()['max_nfat'] ?? 0;
            $n_fatura = $max_nfat + 1;

            error_log('✅ PASSO 3 OK: NFatura gerado - ' . $n_fatura);

            // PASSO 4: Geração do código do documento (fatura)
            // Estrutura: [codigo_nome] [ano]/[numero_fatura] => F 2025/1
            $codigo_documento = $codenome . ' ' . $ano_atual . '/' . $n_fatura;
            error_log('✅ PASSO 4 OK: Código do documento gerado - ' . $codigo_documento);

            // PASSO 5: Processar pagamentos e inserir na tabela formapago
            foreach ($dados['metodos_pagamento'] as $metodo_pagamento) {
                // Verificar se os dados do pagamento estão presentes
                if (!isset($metodo_pagamento['id_metodo']) || !isset($metodo_pagamento['valor'])) {
                    throw new Exception("Dados incompletos de pagamento: ID ou valor não informado");
                }

                $id_pagamento = (int)$metodo_pagamento['id_metodo'];
                $valor_pagamento = (float)$metodo_pagamento['valor']; // Alterado para float para suportar valores decimais

                // Consultar a tabela pagamento para obter a forma de pagamento
                $sql_pagamento = "
                    SELECT idpagamento, forma, taxa, ativo, empresa, usuario 
                    FROM pagamento 
                    WHERE idpagamento = ?
                ";
                $stmt_pagamento = $db->prepare($sql_pagamento);
                if (!$stmt_pagamento) {
                    throw new Exception("Erro ao preparar SELECT pagamento: " . $db->error);
                }
                $stmt_pagamento->bind_param("i", $id_pagamento);
                $stmt_pagamento->execute();
                $result_pagamento = $stmt_pagamento->get_result();
                
                if ($result_pagamento->num_rows === 0) {
                    $stmt_pagamento->close();
                    throw new Exception("Forma de pagamento com ID $id_pagamento não encontrada");
                }
                
                $dados_pagamento = $result_pagamento->fetch_assoc();
                $stmt_pagamento->close();

                // Obter a forma de pagamento
                $forma_pagamento = $dados_pagamento['forma'];

                // Inserir na tabela formapago
                $sql_formapago = "
                    INSERT INTO formapago (forma, valor, N_FACTURA, empresa, usuario, dataa) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ";
                $stmt_formapago = $db->prepare($sql_formapago);
                if (!$stmt_formapago) {
                    throw new Exception("Erro ao preparar INSERT formapago: " . $db->error);
                }
                $n_fatura_str = (string)$n_fatura;
                $stmt_formapago->bind_param("sdsiis", $forma_pagamento, $valor_pagamento, $n_fatura_str, $empresa, $usuario, $data_atual);
                if (!$stmt_formapago->execute()) {
                    $stmt_formapago->close();
                    throw new Exception("Erro ao inserir em formapago: " . $stmt_formapago->error);
                }
                $stmt_formapago->close();

                error_log('✅ PASSO 5 OK: Forma de pagamento registrada - Forma: ' . $forma_pagamento . ', Valor: ' . $valor_pagamento . ', N_FACTURA: ' . $n_fatura);
            }

            // PASSO 6: Inserir registros de venda na tabela venda
            $id_venda_inserida = null;
            foreach ($pedidos as $pedido) {
                $sql_venda = "
                    INSERT INTO venda (
                        Produto_idProduto, Qtd, preconormal, iva, datavenda, hora, N_fat, 
                        desconto, cliente, Usuario, Tipo_docum, iva_valor, caixa, condicao, 
                        Justificacao, codigo_doc, Nome, assinatura, Hash, referncia, 
                        n_cliente, Motivo, Descricao, Referencia_a, empresa
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ";
                $stmt_venda = $db->prepare($sql_venda);
                if (!$stmt_venda) {
                    throw new Exception("Erro ao preparar INSERT venda: " . $db->error);
                }
                
                // Preparar valores conforme especificações
                $id_produto = (int)$pedido['id_produto'];           // Produto_idProduto
                $qtd = (float)$pedido['qtd'];                       // Qtd
                $preco_normal = (float)$pedido['preco'];            // preconormal
                $iva = null;                                        // iva (NULL por enquanto)
                $data_venda = $data_atual;                          // datavenda
                $hora = $hora_atual;                                // hora
                $n_fat = (int)$n_fatura;                            // N_fat
                $desconto = (float)$pedido['desconto'];             // desconto
                $id_cliente_venda = (int)$id_cliente;               // cliente
                $usuario_venda = (int)$usuario;                     // Usuario
                $tipo_documento = 'FaturaRecibo';                   // 🔹 Tipo específico para Fatura Recibo
                $iva_valor = '0';                                   // iva_valor
                $caixa = 1;                                         // caixa
                $condicao = null;                                   // condicao (NULL)
                $justificacao = null;                               // Justificacao (NULL)
                $codigo_doc = (string)$codigo_documento;            // codigo_doc
                $nome = null;                                       // Nome (NULL)
                $assinatura = null;                                 // assinatura (NULL)
                $hash = null;                                       // Hash (NULL)
                $referencia = null;                                 // referncia (NULL)
                $n_cliente = null;                                  // n_cliente (NULL)
                $motivo = null;                                     // Motivo (NULL)
                $descricao = null;                                  // Descricao (NULL)
                $referencia_a = $id_produto;                        // Referencia_a (código do produto)
                $empresa_venda = (int)$empresa;                     // empresa
                
                $stmt_venda->bind_param(
                    "idssssidiissssssssssssssi",
                    $id_produto, $qtd, $preco_normal, $iva, $data_venda, $hora, 
                    $n_fat, $desconto, $id_cliente_venda, $usuario_venda, $tipo_documento_venda, 
                    $iva_valor, $caixa, $condicao, $justificacao, $codigo_doc, $nome, 
                    $assinatura, $hash, $referencia, $n_cliente, $motivo, $descricao, 
                    $referencia_a, $empresa_venda
                );
                
                if (!$stmt_venda->execute()) {
                    $stmt_venda->close();
                    throw new Exception("Erro ao inserir em venda: " . $stmt_venda->error);
                }
                
                // Guardar o ID da primeira venda inserida para referência
                if ($id_venda_inserida === null) {
                    $id_venda_inserida = $stmt_venda->insert_id;
                }
                
                $stmt_venda->close();
            }
            
            error_log('✅ PASSO 6 OK: Registros de venda inseridos - ID inicial: ' . $id_venda_inserida);

            // PASSO 6.1: Atualizar stock dos produtos vendidos
            foreach ($pedidos as $pedido) {
                $id_produto = (int)$pedido['id_produto'];
                $qtd_vendida = (float)$pedido['qtd'];
                
                // Verificar se o item é um produto (PS = 'P') ou serviço (PS = 'S')
                $sql_check_ps = "SELECT PS FROM produto WHERE idproduto = ?";
                $stmt_check_ps = $db->prepare($sql_check_ps);
                
                if (!$stmt_check_ps) {
                    throw new Exception("Erro ao preparar SELECT PS: " . $db->error);
                }
                
                $stmt_check_ps->bind_param("i", $id_produto);
                $stmt_check_ps->execute();
                $result_ps = $stmt_check_ps->get_result();
                
                if ($result_ps->num_rows > 0) {
                    $row_ps = $result_ps->fetch_assoc();
                    $tipo_item = strtoupper(trim($row_ps['PS'] ?? ''));
                    $stmt_check_ps->close();
                    
                    // Aplicar desconto de stock APENAS se for PRODUTO (PS = 'P')
                    if ($tipo_item === 'P') {
                        // UPDATE na tabela produto: diminuir a quantidade vendida do stock atual
                        $sql_update_stock = "UPDATE produto SET QTD = QTD - ? WHERE idproduto = ?";
                        $stmt_update_stock = $db->prepare($sql_update_stock);
                        
                        if (!$stmt_update_stock) {
                            throw new Exception("Erro ao preparar UPDATE stock: " . $db->error);
                        }
                        
                        $stmt_update_stock->bind_param("di", $qtd_vendida, $id_produto);
                        
                        if (!$stmt_update_stock->execute()) {
                            $stmt_update_stock->close();
                            throw new Exception("Erro ao atualizar stock do produto ID $id_produto: " . $stmt_update_stock->error);
                        }
                        
                        $linhas_afetadas = $stmt_update_stock->affected_rows;
                        $stmt_update_stock->close();
                        
                        if ($linhas_afetadas > 0) {
                            error_log("✅ Stock atualizado - Produto ID: $id_produto | Qtd descontada: $qtd_vendida | Tipo: PRODUTO (P)");
                        } else {
                            error_log("⚠️ AVISO: Produto ID $id_produto não encontrado ou stock não alterado");
                        }
                    } elseif ($tipo_item === 'S') {
                        // É um serviço, não aplicar desconto de stock
                        error_log("ℹ️ Item ID: $id_produto | Tipo: SERVIÇO (S) | Stock NÃO descontado (serviços não possuem stock)");
                    } else {
                        error_log("⚠️ AVISO: Item ID $id_produto possui PS inválido: '$tipo_item' (esperado 'P' ou 'S')");
                    }
                } else {
                    $stmt_check_ps->close();
                    error_log("⚠️ AVISO: Item ID $id_produto não encontrado na tabela produto");
                }
            }
            
            error_log('✅ PASSO 6.1 OK: Atualização de stock processada (apenas produtos)');

            // PASSO 7: Selecionar dados da empresa da tabela login
            $sql_empresa = "
                SELECT * FROM login 
                WHERE ID = ? AND dica = 'empresa'
            ";
            $stmt_empresa = $db->prepare($sql_empresa);
            if (!$stmt_empresa) {
                throw new Exception("Erro ao preparar SELECT empresa: " . $db->error);
            }
            $stmt_empresa->bind_param("i", $empresa);
            $stmt_empresa->execute();
            $result_empresa = $stmt_empresa->get_result();
            $dados_empresa = [];
            if ($result_empresa->num_rows > 0) {
                $dados_empresa = $result_empresa->fetch_assoc();
            }
            $stmt_empresa->close();

            if (empty($dados_empresa)) {
                throw new Exception("Dados da empresa não encontrados");
            }

            error_log('✅ PASSO 7 OK: Dados da empresa encontrados');

            // PASSO 8: Processar produtos para a segunda tabela do corpo da fatura
            $produtos_fatura = [];
            $numero_item = 1;
            
            foreach ($pedidos as $pedido) {
                // Calcular o total do item
                $qtd = (float)$pedido['qtd'];
                $preco = (float)$pedido['preco'];
                $desconto_percentual = (float)$pedido['desconto'];
                $imposto_percentual = (float)$pedido['imposto'];
                
                // Valor base = quantidade * preço
                $valor_base = $qtd * $preco;
                
                // Aplicar desconto se existir (desconto > 0)
                $valor_com_desconto = $valor_base;
                if ($desconto_percentual > 0) {
                    $valor_desconto = ($valor_base * $desconto_percentual) / 100;
                    $valor_com_desconto = $valor_base - $valor_desconto;
                }
                
                // Aplicar imposto se existir (imposto > 0)
                $total_item = $valor_com_desconto;
                if ($imposto_percentual > 0) {
                    $valor_imposto = ($valor_com_desconto * $imposto_percentual) / 100;
                    // ✅ RETENÇÃO (6.50%) NÃO É ADICIONADA AO TOTAL DA LINHA
                    if (!($imposto_percentual == 6.5 || $imposto_percentual == 6.50)) {
                        $total_item = $valor_com_desconto + $valor_imposto;
                    }
                    // Se for retenção, total_item permanece = valor_com_desconto
                }
                
                // Adicionar ao array de produtos da fatura
                $produtos_fatura[] = [
                    'numero' => str_pad($numero_item, 3, '0', STR_PAD_LEFT),  // Nº: 001, 002, 003...
                    'designacao' => $pedido['descricao'],  // Nome do produto
                    'qtd' => $qtd,  // Quantidade
                    'preco_unitario' => $preco,  // P. Unit 
                    'desconto_percentual' => $desconto_percentual,  // Desc.%
                    'taxa_percentual' => ($imposto_percentual == 6.5 || $imposto_percentual == 6.50) ? 0 : $imposto_percentual,  // Taxa % (✅ Retenção não aparece aqui)
                    'total' => $total_item  // Total calculado
                ];
                
                $numero_item++;
            }
            
            error_log('✅ PASSO 8 OK: Produtos processados para fatura (' . count($produtos_fatura) . ' itens)');

            // PASSO 9: Calcular totais para a primeira tabela do rodapé
            $total_iliquido = 0;  // Somatório de todos os preços (qtd * preço) sem imposto
            $total_desconto = 0;  // Somatório de todos os descontos aplicados
            $total_imposto = 0;   // Somatório de todos os impostos aplicados (IVA)
            $total_retencao = 0;  // ✅ Somatório de todas as retenções (6.50%)
            
            foreach ($pedidos as $pedido) {
                $qtd = (float)$pedido['qtd'];
                $preco = (float)$pedido['preco'];
                $desconto_percentual = (float)$pedido['desconto'];
                $imposto_percentual = (float)$pedido['imposto'];
                
                // Total ilíquido: quantidade * preço (sem imposto)
                $valor_base = $qtd * $preco;
                $total_iliquido += $valor_base;
                
                // Total desconto: calcular o valor do desconto em dinheiro
                if ($desconto_percentual > 0) {
                    $valor_desconto = ($valor_base * $desconto_percentual) / 100;
                    $total_desconto += $valor_desconto;
                }
                
                // ✅ Separar Retenção (6.50%) de Imposto (IVA)
                if ($imposto_percentual > 0) {
                    // Imposto é aplicado após o desconto
                    $valor_com_desconto = $valor_base;
                    if ($desconto_percentual > 0) {
                        $valor_desconto = ($valor_base * $desconto_percentual) / 100;
                        $valor_com_desconto = $valor_base - $valor_desconto;
                    }
                    $valor_imposto = ($valor_com_desconto * $imposto_percentual) / 100;
                    
                    // ✅ VERIFICA SE É RETENÇÃO (6.50%) OU IVA
                    if ($imposto_percentual == 6.5 || $imposto_percentual == 6.50) {
                        $total_retencao += $valor_imposto;
                    } else {
                        $total_imposto += $valor_imposto;
                    }
                }
            }
            
            // Total Pago: vem dos dados enviados pelo frontend
            $total_pago = 0;
            if (isset($dados['metodos_pagamento']) && is_array($dados['metodos_pagamento'])) {
                foreach ($dados['metodos_pagamento'] as $metodo_pagamento) {
                    $total_pago += (float)$metodo_pagamento['valor'];
                }
            }

            // ✅ VALOR A PAGAR: Quanto o cliente DEVE pagar (antes do pagamento)
            // Fórmula: Total Ilíquido - Desconto + Imposto (IVA)
            // Retenção NÃO entra no cálculo (é deduzida do total)
            $valor_a_pagar = $total_iliquido - $total_desconto + $total_imposto;

            // 💰 TROCO: Diferença entre o valor pago e o valor a pagar (se positivo)
            $troco = max(0, $total_pago - $valor_a_pagar);

            error_log('✅ PASSO 9 OK: Totais calculados - Ilíquido: ' . $total_iliquido . ' | Desconto: ' . $total_desconto . ' | Imposto (IVA): ' . $total_imposto . ' | Retenção: ' . $total_retencao . ' | Valor a Pagar: ' . $valor_a_pagar . ' | Pago: ' . $total_pago . ' | Troco: ' . $troco);

            // PASSO 10: SELECT das formas de pagamento utilizadas na fatura
            $sql_formapago = "SELECT forma, valor, N_FACTURA, dataa FROM formapago WHERE N_FACTURA = ?";
            $stmt_formapago = $db->prepare($sql_formapago);
            if (!$stmt_formapago) {
                throw new Exception("Erro ao preparar SELECT formapago: " . $db->error);
            }
            
            $n_fatura_str = (string)$n_fatura;
            $stmt_formapago->bind_param("s", $n_fatura_str);
            $stmt_formapago->execute();
            $result_formapago = $stmt_formapago->get_result();
            
            $formas_pagamento = [];
            if ($result_formapago->num_rows > 0) {
                while ($row = $result_formapago->fetch_assoc()) {
                    $formas_pagamento[] = [
                        'forma' => $row['forma'],           // Nome do método de pagamento
                        'valor' => (float)$row['valor'],    // Valor pago neste método
                        'data' => $row['dataa']             // Data do pagamento
                    ];
                }
            }
            $stmt_formapago->close();
            
            error_log('✅ PASSO 10 OK: Formas de pagamento encontradas (' . count($formas_pagamento) . ' métodos)');

            // PASSO 11: Processar resumo de impostos (agrupado por taxa)
            // Array para armazenar dados agrupados por taxa de imposto
            $resumo_impostos_agrupado = [];
            
            foreach ($pedidos as $pedido) {
                $qtd = (float)$pedido['qtd'];
                $preco = (float)$pedido['preco'];
                $desconto_percentual = (float)$pedido['desconto'];
                $imposto_percentual = (float)$pedido['imposto'];
                
                // Valor base (sem desconto e sem imposto)
                $valor_base = $qtd * $preco;
                
                // Calcular valor após desconto (incidência)
                $valor_com_desconto = $valor_base;
                if ($desconto_percentual > 0) {
                    $valor_desconto = ($valor_base * $desconto_percentual) / 100;
                    $valor_com_desconto = $valor_base - $valor_desconto;
                }
                
                // Calcular valor do imposto
                $valor_imposto = 0;
                if ($imposto_percentual > 0) {
                    $valor_imposto = ($valor_com_desconto * $imposto_percentual) / 100;
                }
                
                // Agrupar por taxa de imposto
                $taxa_key = (string)$imposto_percentual;
                
                if (!isset($resumo_impostos_agrupado[$taxa_key])) {
                    $resumo_impostos_agrupado[$taxa_key] = [
                        'taxa' => $imposto_percentual,
                        'incidencia' => 0,  // Soma dos valores COM desconto aplicado
                        'imposto' => 0      // Soma dos valores de imposto
                    ];
                }
                
                $resumo_impostos_agrupado[$taxa_key]['incidencia'] += $valor_com_desconto;
                $resumo_impostos_agrupado[$taxa_key]['imposto'] += $valor_imposto;
            }
            
            // Construir array final do resumo de impostos na ordem correta
            $resumo_impostos = [];
            
            // 1ª LINHA: ISENTO (taxa = 0)
            if (isset($resumo_impostos_agrupado['0'])) {
                $resumo_impostos[] = [
                    'descricao' => 'ISENTO',
                    'taxa_percentual' => 0,
                    'incidencia' => $resumo_impostos_agrupado['0']['incidencia'],
                    'imposto' => 0,
                    'motivo' => 'Transmissão de Bens e serviços não suscetíveis'
                ];
            }
            
            // 2ª LINHA: IVA 14% (se existir)
            if (isset($resumo_impostos_agrupado['14'])) {
                $resumo_impostos[] = [
                    'descricao' => 'IVA',
                    'taxa_percentual' => 14,
                    'incidencia' => $resumo_impostos_agrupado['14']['incidencia'],
                    'imposto' => $resumo_impostos_agrupado['14']['imposto'],
                    'motivo' => ''
                ];
            }
            
            // 3ª LINHA: IVA 7% (se existir)
            if (isset($resumo_impostos_agrupado['7'])) {
                $resumo_impostos[] = [
                    'descricao' => 'IVA',
                    'taxa_percentual' => 7,
                    'incidencia' => $resumo_impostos_agrupado['7']['incidencia'],
                    'imposto' => $resumo_impostos_agrupado['7']['imposto'],
                    'motivo' => ''
                ];
            }
            
            // 4ª LINHA: IVA 5% (se existir)
            if (isset($resumo_impostos_agrupado['5'])) {
                $resumo_impostos[] = [
                    'descricao' => 'IVA',
                    'taxa_percentual' => 5,
                    'incidencia' => $resumo_impostos_agrupado['5']['incidencia'],
                    'imposto' => $resumo_impostos_agrupado['5']['imposto'],
                    'motivo' => ''
                ];
            }
            
            // ✅ RETENÇÃO NÃO VAI NO RESUMO DE IMPOSTOS
            // A retenção (6.50%) é apenas mostrada no total separado (total_retencao)
            
            error_log('✅ PASSO 11 OK: Resumo de impostos processado (' . count($resumo_impostos) . ' linhas)');

            // PASSO 12: Coletar observação do frontend (se existir)
            // ✅ CORREÇÃO: Garantir que sempre seja string válida
            $observacao = '';
            
            if (isset($dados['observacao'])) {
                if (is_string($dados['observacao'])) {
                    $observacao = trim($dados['observacao']);
                } else if (!is_null($dados['observacao'])) {
                    // Tentar converter para string
                    $observacao = strval($dados['observacao']);
                    error_log('⚠️ AVISO: Observacao não era string em processarFaturaRecibo, convertida');
                }
            }
            
            // Garantir que nunca seja null
            if ($observacao === null) {
                $observacao = '';
                error_log('⚠️ AVISO: Observacao era null, forçada para string vazia');
            }
            
            error_log('✅ PASSO 12 OK: Observação coletada' . ($observacao ? ' (com conteúdo: "' . substr($observacao, 0, 30) . '...")' : ' (vazia)'));

            // PASSO 13: Definir nome do usuário (fictício)
            $nome_usuario = 'Joana Rafael';  // Usuário ID 1
            
            error_log('✅ PASSO 13 OK: Nome do usuário definido - ' . $nome_usuario);

            $db->commit();

            // PASSO 14: Limpar tabela pedido para o usuário (APÓS commit bem-sucedido)
            $sql_limpar_pedido = "DELETE FROM pedido WHERE usuario = ?";
            $stmt_limpar = $db->prepare($sql_limpar_pedido);
            if (!$stmt_limpar) {
                error_log("⚠️ AVISO: Erro ao preparar DELETE pedido: " . $db->error);
            } else {
                $stmt_limpar->bind_param("i", $usuario);
                if ($stmt_limpar->execute()) {
                    $linhas_deletadas = $stmt_limpar->affected_rows;
                    error_log('✅ PASSO 14 OK: Pedidos do usuário ' . $usuario . ' limpos (' . $linhas_deletadas . ' linhas deletadas)');
                } else {
                    error_log("⚠️ AVISO: Erro ao executar DELETE pedido: " . $stmt_limpar->error);
                }
                $stmt_limpar->close();
            }

            // Retorno com todos os dados necessários para gerar a fatura
            return [
                'status' => 'SUCESSO',
                'mensagem' => 'Fatura gerada com sucesso e pedidos do usuário limpos',
                'pedidos' => $pedidos,  // Do Passo 1
                'cliente' => $cliente,  // Do Passo 2
                'n_fatura' => $n_fatura,
                'codigo_documento' => $codigo_documento,
                'id_venda' => $id_venda_inserida,
                'dados_empresa' => $dados_empresa,  // Dados da empresa do Passo 7
                'titulo_documento' => 'FACTURA RECIBO',  // Baseado no codenome F
                // Dados para preencher a primeira tabela do corpo da fatura
                'data_emissao' => $data_atual,  // Data de impressão da fatura
                'hora_emissao' => $hora_atual,  // Hora de impressão da fatura
                'nif_cliente' => $cliente['nif'] ?? '',  // NIF/Contribuinte do cliente
                'telefone_cliente' => $cliente['telefone'] ?? '',  // Telefone do cliente
                'endereco_cliente' => $cliente['endereco'] ?? '',  // Endereço do cliente
                // Dados para preencher a segunda tabela do corpo da fatura (produtos)
                'produtos_fatura' => $produtos_fatura,  // Array com todos os produtos formatados
                // Dados para preencher a primeira tabela do rodapé (Totais)
                'total_iliquido' => $total_iliquido,  // Somatório de qtd * preço (sem imposto)
                'total_desconto' => $total_desconto,  // Somatório de todos os descontos
                'total_imposto' => $total_imposto,    // Somatório de todos os impostos (IVA 14%, 7%, 5%)
                'total_retencao' => $total_retencao,  // ✅ Somatório de todas as retenções (6.50%)
                'valor_a_pagar' => $valor_a_pagar,    // 🔥 NOVO: Valor que o cliente DEVE pagar (Ilíquido - Desconto + Imposto)
                'total_pago' => $total_pago,           // Somatório dos valores pagos
                'troco' => $troco,                     // 💰 Troco (diferença entre pago e valor a pagar)
                // Dados para preencher a tabela de formas de pagamento no rodapé
                'formas_pagamento' => $formas_pagamento,  // Array com todos os métodos de pagamento usados
                // Dados para preencher a tabela de resumo de impostos no rodapé
                'resumo_impostos' => $resumo_impostos,  // Array com o resumo agrupado por taxa de imposto
                // Observação da fatura (campo opcional)
                'observacao' => $observacao,  // Observação enviada pelo frontend
                // Nome do usuário que gerou a fatura
                'nome_usuario' => $nome_usuario  // Nome do usuário (Joana Rafael - ID 1)
            ];

        } catch (Exception $e) {
            $db->rollback();
            error_log("❌ ERRO NO PASSO 7: " . $e->getMessage());
            return [
                'status' => 'ERRO',
                'mensagem' => $e->getMessage()
            ];
        } finally {
            $db->autocommit(true);
        }
    }

    public function processar_factura_proforma_orcamento($dados) {
        error_log('===== INICIO processar_factura_proforma_orcamento =====');
        error_log('Dados recebidos: ' . json_encode($dados));
        
        // Extrair id_cliente e tipo_documento do array dados
        $id_cliente = (int)($dados['id_cliente'] ?? 0);
        $tipo_documento = $dados['tipo_documento'] ?? 'Factura-Proforma';
        
        error_log('ID Cliente recebido: ' . $id_cliente);
        error_log('Tipo documento recebido: ' . $tipo_documento);
        
        $db = Conexao::getConexao();
        $db->autocommit(false);  // Transação básica

        try {
            // Variáveis padrão
            $usuario = 1;
            $empresa = 1;
            $data_atual = date('Y-m-d');
            $hora_atual = date('H:i:s');
            $ano_atual = date('Y');
            
            // Definir código e título com base no tipo de documento
            if ($tipo_documento === 'Factura-Proforma' || $tipo_documento === 'fatura-proforma') {
                $codenome = 'PP';  // Código para Fatura Pró-Forma
                $titulo_documento = 'FACTURA PRÓ-FORMA';
            } else { // Orcamento
                $codenome = 'OR';  // Código para Orçamento
                $titulo_documento = 'ORÇAMENTO';
            }

            $id_cliente = (int)$id_cliente;

            // PASSO 1: SELECT Pedido com JOIN na tabela imposto
            $sql_pedido = "
                SELECT 
                    p.idpedido, 
                    p.n_pedido, 
                    p.id_produto, 
                    p.descricao, 
                    p.qtd, 
                    p.preco, 
                    p.desconto, 
                    p.imposto AS imposto_id,
                    imp.percentagem AS imposto_percentagem,
                    imp.imposto AS imposto_descricao,
                    p.dataa, 
                    p.hora, 
                    p.conta, 
                    p.mesa, 
                    p.usuario
                FROM pedido p
                LEFT JOIN imposto imp ON imp.id = p.imposto
                WHERE p.usuario = ?
            ";
            $stmt_pedido = $db->prepare($sql_pedido);
            if (!$stmt_pedido) {
                throw new Exception("Erro ao preparar SELECT Pedido: " . $db->error);
            }
            $stmt_pedido->bind_param("i", $usuario);
            $stmt_pedido->execute();
            $result_pedido = $stmt_pedido->get_result();
            $pedidos = [];
            if ($result_pedido->num_rows > 0) {
                while ($row = $result_pedido->fetch_assoc()) {
                    $row['qtd'] = (int)$row['qtd'];
                    $row['preco'] = (float)$row['preco'];
                    $row['desconto'] = (float)$row['desconto'];
                    $row['imposto'] = (float)($row['imposto_percentagem'] ?? 0);
                    $row['imposto_id'] = (int)($row['imposto_id'] ?? 0);
                    $row['imposto_descricao'] = $row['imposto_descricao'] ?? '';
                    $pedidos[] = $row;
                }
            }
            $stmt_pedido->close();

            if (empty($pedidos)) {
                throw new Exception("Nenhum pedido encontrado para usuário $usuario");
            }

            error_log('✅ PASSO 1 OK: Pedidos encontrados (' . count($pedidos) . ' itens)');

            // PASSO 2: SELECT Cliente
            $sql_cliente = "
                SELECT idcliente, nome, nif, email, telefone, morada, endereco, empresa, usuario 
                FROM cliente 
                WHERE idcliente = ?
            ";
            $stmt_cliente = $db->prepare($sql_cliente);
            if (!$stmt_cliente) {
                throw new Exception("Erro ao preparar SELECT Cliente: " . $db->error);
            }
            $stmt_cliente->bind_param("i", $id_cliente);
            $stmt_cliente->execute();
            $result_cliente = $stmt_cliente->get_result();
            $cliente = [];
            if ($result_cliente->num_rows > 0) {
                $cliente = $result_cliente->fetch_assoc();
            }
            $stmt_cliente->close();

            if (empty($cliente)) {
                throw new Exception("Cliente com ID $id_cliente não encontrado");
            }

            error_log('✅ PASSO 2 OK: Cliente encontrado - Nome: ' . ($cliente['nome'] ?? 'N/A'));

            // PASSO 3: Geração do NFatura a partir da tabela Venda
            $sql_max_nfat = "SELECT MAX(N_fat) AS max_nfat FROM venda";
            $result_max = $db->query($sql_max_nfat);
            if (!$result_max) {
                throw new Exception("Erro ao consultar MAX N_fat na tabela venda: " . $db->error);
            }
            $max_nfat = $result_max->fetch_assoc()['max_nfat'] ?? 0;
            $n_fatura = $max_nfat + 1;

            error_log('✅ PASSO 3 OK: NFatura gerado - ' . $n_fatura);

            // PASSO 4: Geração do código do documento (fatura pró-forma)
            // Estrutura: [codigo_nome] [ano]/[numero_fatura] => FP 2025/1
            $codigo_documento = $codenome . ' ' . $ano_atual . '/' . $n_fatura;
            error_log('✅ PASSO 4 OK: Código do documento gerado - ' . $codigo_documento);

            // 🔹 PASSO 5: REMOVIDO - NÃO processar pagamentos na fatura pró-forma

            // PASSO 6: Inserir registros de venda na tabela venda
            $id_venda_inserida = null;
            foreach ($pedidos as $pedido) {
                $sql_venda = "
                    INSERT INTO venda (
                        Produto_idProduto, Qtd, preconormal, iva, datavenda, hora, N_fat, 
                        desconto, cliente, Usuario, Tipo_docum, iva_valor, caixa, condicao, 
                        Justificacao, codigo_doc, Nome, assinatura, Hash, referncia, 
                        n_cliente, Motivo, Descricao, Referencia_a, empresa
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ";
                $stmt_venda = $db->prepare($sql_venda);
                if (!$stmt_venda) {
                    throw new Exception("Erro ao preparar INSERT venda: " . $db->error);
                }
                
                // Preparar valores conforme especificações
                $id_produto = (int)$pedido['id_produto'];
                $qtd = (float)$pedido['qtd'];
                $preco_normal = (float)$pedido['preco'];
                $iva = null;
                $data_venda = $data_atual;
                $hora = $hora_atual;
                $n_fat = (int)$n_fatura;
                $desconto = (float)$pedido['desconto'];
                $id_cliente_venda = (int)$id_cliente;
                $usuario_venda = (int)$usuario;
                $tipo_documento_venda = ($tipo_documento === 'Factura-Proforma' || $tipo_documento === 'fatura-proforma') ? 'FaturaProForma' : 'Orcamento';  // 🔹 Tipo específico para pró-forma
                $iva_valor = '0';
                $caixa = 1;
                $condicao = null;
                $justificacao = null;
                $codigo_doc = (string)$codigo_documento;
                $nome = null;
                $assinatura = null;
                $hash = null;
                $referencia = null;
                $n_cliente = null;
                $motivo = null;
                $descricao = null;
                $referencia_a = $id_produto;
                $empresa_venda = (int)$empresa;
                
                $stmt_venda->bind_param(
                    "idssssidiissssssssssssssi",
                    $id_produto, $qtd, $preco_normal, $iva, $data_venda, $hora, 
                    $n_fat, $desconto, $id_cliente_venda, $usuario_venda, $tipo_documento_venda, 
                    $iva_valor, $caixa, $condicao, $justificacao, $codigo_doc, $nome, 
                    $assinatura, $hash, $referencia, $n_cliente, $motivo, $descricao, 
                    $referencia_a, $empresa_venda
                );
                
                if (!$stmt_venda->execute()) {
                    $stmt_venda->close();
                    throw new Exception("Erro ao inserir em venda: " . $stmt_venda->error);
                }
                
                if ($id_venda_inserida === null) {
                    $id_venda_inserida = $stmt_venda->insert_id;
                }
                
                $stmt_venda->close();
            }
            
            error_log('✅ PASSO 6 OK: Registros de venda inseridos - ID inicial: ' . $id_venda_inserida);

            // 🔹 PASSO 6.1: REMOVIDO - NÃO atualizar stock na fatura pró-forma

            // PASSO 7: Selecionar dados da empresa da tabela login
            $sql_empresa = "
                SELECT * FROM login 
                WHERE ID = ? AND dica = 'empresa'
            ";
            $stmt_empresa = $db->prepare($sql_empresa);
            if (!$stmt_empresa) {
                throw new Exception("Erro ao preparar SELECT empresa: " . $db->error);
            }
            $stmt_empresa->bind_param("i", $empresa);
            $stmt_empresa->execute();
            $result_empresa = $stmt_empresa->get_result();
            $dados_empresa = [];
            if ($result_empresa->num_rows > 0) {
                $dados_empresa = $result_empresa->fetch_assoc();
            }
            $stmt_empresa->close();

            if (empty($dados_empresa)) {
                throw new Exception("Dados da empresa não encontrados");
            }

            error_log('✅ PASSO 7 OK: Dados da empresa encontrados');

            // PASSO 8: Processar produtos para a segunda tabela do corpo da fatura
            $produtos_fatura = [];
            $numero_item = 1;
            
            foreach ($pedidos as $pedido) {
                $qtd = (float)$pedido['qtd'];
                $preco = (float)$pedido['preco'];
                $desconto_percentual = (float)$pedido['desconto'];
                $imposto_percentual = (float)$pedido['imposto'];
                
                $valor_base = $qtd * $preco;
                
                $valor_com_desconto = $valor_base;
                if ($desconto_percentual > 0) {
                    $valor_desconto = ($valor_base * $desconto_percentual) / 100;
                    $valor_com_desconto = $valor_base - $valor_desconto;
                }
                
                $total_item = $valor_com_desconto;
                if ($imposto_percentual > 0) {
                    $valor_imposto = ($valor_com_desconto * $imposto_percentual) / 100;
                    if (!($imposto_percentual == 6.5 || $imposto_percentual == 6.50)) {
                        $total_item = $valor_com_desconto + $valor_imposto;
                    }
                }
                
                $produtos_fatura[] = [
                    'numero' => str_pad($numero_item, 3, '0', STR_PAD_LEFT),
                    'designacao' => $pedido['descricao'],
                    'qtd' => $qtd,
                    'preco_unitario' => $preco,
                    'desconto_percentual' => $desconto_percentual,
                    'taxa_percentual' => ($imposto_percentual == 6.5 || $imposto_percentual == 6.50) ? 0 : $imposto_percentual,
                    'total' => $total_item
                ];
                
                $numero_item++;
            }
            
            error_log('✅ PASSO 8 OK: Produtos processados para fatura (' . count($produtos_fatura) . ' itens)');

            // PASSO 9: Calcular totais para a primeira tabela do rodapé
            $total_iliquido = 0;
            $total_desconto = 0;
            $total_imposto = 0;
            $total_retencao = 0;
            
            foreach ($pedidos as $pedido) {
                $qtd = (float)$pedido['qtd'];
                $preco = (float)$pedido['preco'];
                $desconto_percentual = (float)$pedido['desconto'];
                $imposto_percentual = (float)$pedido['imposto'];
                
                $valor_base = $qtd * $preco;
                $total_iliquido += $valor_base;
                
                if ($desconto_percentual > 0) {
                    $valor_desconto = ($valor_base * $desconto_percentual) / 100;
                    $total_desconto += $valor_desconto;
                }
                
                if ($imposto_percentual > 0) {
                    $valor_com_desconto = $valor_base;
                    if ($desconto_percentual > 0) {
                        $valor_desconto = ($valor_base * $desconto_percentual) / 100;
                        $valor_com_desconto = $valor_base - $valor_desconto;
                    }
                    $valor_imposto = ($valor_com_desconto * $imposto_percentual) / 100;
                    
                    if ($imposto_percentual == 6.5 || $imposto_percentual == 6.50) {
                        $total_retencao += $valor_imposto;
                    } else {
                        $total_imposto += $valor_imposto;
                    }
                }
            }

            // ✅ VALOR A PAGAR: Quanto o cliente DEVE pagar (total do documento)
            // Fórmula: Total Ilíquido - Desconto + Imposto (IVA)
            // Retenção NÃO entra no cálculo (é deduzida do total)
            $valor_a_pagar = $total_iliquido - $total_desconto + $total_imposto;

            error_log('✅ PASSO 9 OK: Totais calculados - Ilíquido: ' . $total_iliquido . ' | Desconto: ' . $total_desconto . ' | Imposto (IVA): ' . $total_imposto . ' | Retenção: ' . $total_retencao . ' | Valor a Pagar: ' . $valor_a_pagar);

            // 🔹 PASSO 10: REMOVIDO - NÃO selecionar formas de pagamento na fatura pró-forma

            // PASSO 11: Processar resumo de impostos (agrupado por taxa)
            $resumo_impostos_agrupado = [];
            
            foreach ($pedidos as $pedido) {
                $qtd = (float)$pedido['qtd'];
                $preco = (float)$pedido['preco'];
                $desconto_percentual = (float)$pedido['desconto'];
                $imposto_percentual = (float)$pedido['imposto'];
                
                $valor_base = $qtd * $preco;
                
                $valor_com_desconto = $valor_base;
                if ($desconto_percentual > 0) {
                    $valor_desconto = ($valor_base * $desconto_percentual) / 100;
                    $valor_com_desconto = $valor_base - $valor_desconto;
                }
                
                $valor_imposto = 0;
                if ($imposto_percentual > 0) {
                    $valor_imposto = ($valor_com_desconto * $imposto_percentual) / 100;
                }
                
                $taxa_key = (string)$imposto_percentual;
                
                if (!isset($resumo_impostos_agrupado[$taxa_key])) {
                    $resumo_impostos_agrupado[$taxa_key] = [
                        'taxa' => $imposto_percentual,
                        'incidencia' => 0,
                        'imposto' => 0
                    ];
                }
                
                $resumo_impostos_agrupado[$taxa_key]['incidencia'] += $valor_com_desconto;
                $resumo_impostos_agrupado[$taxa_key]['imposto'] += $valor_imposto;
            }
            
            $resumo_impostos = [];
            
            if (isset($resumo_impostos_agrupado['0'])) {
                $resumo_impostos[] = [
                    'descricao' => 'ISENTO',
                    'taxa_percentual' => 0,
                    'incidencia' => $resumo_impostos_agrupado['0']['incidencia'],
                    'imposto' => 0,
                    'motivo' => 'Transmissão de Bens e serviços não suscetíveis'
                ];
            }
            
            if (isset($resumo_impostos_agrupado['14'])) {
                $resumo_impostos[] = [
                    'descricao' => 'IVA',
                    'taxa_percentual' => 14,
                    'incidencia' => $resumo_impostos_agrupado['14']['incidencia'],
                    'imposto' => $resumo_impostos_agrupado['14']['imposto'],
                    'motivo' => ''
                ];
            }
            
            if (isset($resumo_impostos_agrupado['7'])) {
                $resumo_impostos[] = [
                    'descricao' => 'IVA',
                    'taxa_percentual' => 7,
                    'incidencia' => $resumo_impostos_agrupado['7']['incidencia'],
                    'imposto' => $resumo_impostos_agrupado['7']['imposto'],
                    'motivo' => ''
                ];
            }
            
            if (isset($resumo_impostos_agrupado['5'])) {
                $resumo_impostos[] = [
                    'descricao' => 'IVA',
                    'taxa_percentual' => 5,
                    'incidencia' => $resumo_impostos_agrupado['5']['incidencia'],
                    'imposto' => $resumo_impostos_agrupado['5']['imposto'],
                    'motivo' => ''
                ];
            }
            
            error_log('✅ PASSO 11 OK: Resumo de impostos processado (' . count($resumo_impostos) . ' linhas)');

            // PASSO 12: Coletar observação (se existir)
            // ✅ CORREÇÃO: Mesmo processo robusto, mesmo que normalmente esteja vazia
            $observacao = '';
            
            if (isset($dados['observacao'])) {
                if (is_string($dados['observacao'])) {
                    $observacao = trim($dados['observacao']);
                } else if (!is_null($dados['observacao'])) {
                    // Tentar converter para string
                    $observacao = strval($dados['observacao']);
                    error_log('⚠️ AVISO: Observacao não era string em processar_factura_proforma_orcamento, convertida');
                }
            }
            
            // Garantir que nunca seja null
            if ($observacao === null) {
                $observacao = '';
                error_log('⚠️ AVISO: Observacao era null, forçada para string vazia');
            }
            
            error_log('✅ PASSO 12 OK: Observação definida' . ($observacao ? ' (com conteúdo: "' . substr($observacao, 0, 30) . '...")' : ' (vazia)'));

            // PASSO 13: Definir nome do usuário
            $nome_usuario = 'Joana Rafael';
            
            error_log('✅ PASSO 13 OK: Nome do usuário definido - ' . $nome_usuario);

            $db->commit();

            // PASSO 14: Limpar tabela pedido para o usuário (APÓS commit bem-sucedido)
            $sql_limpar_pedido = "DELETE FROM pedido WHERE usuario = ?";
            $stmt_limpar = $db->prepare($sql_limpar_pedido);
            if (!$stmt_limpar) {
                error_log("⚠️ AVISO: Erro ao preparar DELETE pedido: " . $db->error);
            } else {
                $stmt_limpar->bind_param("i", $usuario);
                if ($stmt_limpar->execute()) {
                    $linhas_deletadas = $stmt_limpar->affected_rows;
                    error_log('✅ PASSO 14 OK: Pedidos do usuário ' . $usuario . ' limpos (' . $linhas_deletadas . ' linhas deletadas)');
                } else {
                    error_log("⚠️ AVISO: Erro ao executar DELETE pedido: " . $stmt_limpar->error);
                }
                $stmt_limpar->close();
            }

            // Retorno com todos os dados necessários para gerar a fatura pró-forma
            return [
                'status' => 'SUCESSO',
                'mensagem' => $titulo_documento . ' gerad' . ($tipo_documento === 'Factura-Proforma' || $tipo_documento === 'fatura-proforma' ? 'a' : 'o') . ' com sucesso e pedidos do usuário limpos',
                'pedidos' => $pedidos,
                'cliente' => $cliente,
                'n_fatura' => $n_fatura,
                'codigo_documento' => $codigo_documento,
                'id_venda' => $id_venda_inserida,
                'dados_empresa' => $dados_empresa,
                'titulo_documento' => $titulo_documento,  // 🔹 Título específico
                'data_emissao' => $data_atual,
                'hora_emissao' => $hora_atual,
                'nif_cliente' => $cliente['nif'] ?? '',
                'telefone_cliente' => $cliente['telefone'] ?? '',
                'endereco_cliente' => $cliente['endereco'] ?? '',
                'produtos_fatura' => $produtos_fatura,
                'total_iliquido' => $total_iliquido,
                'total_desconto' => $total_desconto,
                'total_imposto' => $total_imposto,
                'total_retencao' => $total_retencao,
                'valor_a_pagar' => $valor_a_pagar,  // 🔥 NOVO: Valor total a pagar (Ilíquido - Desconto + Imposto)
                // 🔹 NÃO retornar total_pago e formas_pagamento
                'resumo_impostos' => $resumo_impostos,
                'observacao' => $observacao,
                'nome_usuario' => $nome_usuario
            ];

        } catch (Exception $e) {
            $db->rollback();
            error_log("❌ ERRO NO processar_factura_proforma_orcamento: " . $e->getMessage());
            return [
                'status' => 'ERRO',
                'mensagem' => $e->getMessage()
            ];
        } finally {
            $db->autocommit(true);
        }
    }
}
?>