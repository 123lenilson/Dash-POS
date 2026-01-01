<?php
require_once __DIR__ . '/../config/conexao.php';

class PedidoModel {
    /**
     * Adiciona/atualiza produto no pedido com validação de stock (APENAS para produtos)
     */
    public static function adicionarAoPedido($id, $qty = null, $preco = null, $impostos = null) {
        $db = Conexao::getConexao();
        $id = intval($id);
        
        if ($id <= 0) {
            return ['sucesso' => false, 'mensagem' => 'ID inválido'];
        }

        // ========== 1. BUSCA INFO DO PRODUTO ==========
        $sql_produto = "SELECT idproduto, descricao, venda AS preco, qtd AS stock, ps, impostos 
                        FROM produto 
                        WHERE idproduto = ?";
        $stmt_produto = $db->prepare($sql_produto);
        if (!$stmt_produto) {
            return ['sucesso' => false, 'mensagem' => 'Erro ao preparar consulta de produto: ' . $db->error];
        }
        $stmt_produto->bind_param("i", $id);
        $stmt_produto->execute();
        $result_produto = $stmt_produto->get_result();
        
        if (!$result_produto || $result_produto->num_rows === 0) {
            $stmt_produto->close();
            return ['sucesso' => false, 'mensagem' => 'Produto não encontrado'];
        }
        
        $produto = $result_produto->fetch_assoc();
        $stmt_produto->close();
        
        $produto_nome = $produto['descricao'];
        $preco_original = floatval($produto['preco']);
        $stock_disponivel = intval($produto['stock']);
        $produto_imposto_id = $produto['impostos'] ?: '0';
        
        // Força uppercase e define padrão como 'P'
        $ps = strtoupper($produto['ps'] ?? 'P');
        $is_servico = ($ps === 'S');

        // ========== 2. DEFINE VALORES PADRÃO ==========
        $usuario_id = 1;
        $empresa_id = 1;
        $desconto_val = '0.00';
        $conta = 'sem serviço';
        $mesa = 'sem serviço';
        $data_atual = date('Y-m-d H:i:s');
        $hora_atual = date('H:i:s');
        
        // Define o ID do imposto
        $imposto_id = ($impostos !== null) ? strval($impostos) : $produto_imposto_id;

        // ========== 3. DEFINE QUANTIDADE FINAL ==========
        if ($qty === null) {
            $qty = 1;
        } else {
            $qty = intval($qty);
            if ($qty < 0) {
                return ['sucesso' => false, 'mensagem' => 'Quantidade inválida'];
            }
        }

        // ========== 4. VALIDAÇÃO DE STOCK (APENAS PARA PRODUTOS) ==========
        if (!$is_servico && $stock_disponivel < $qty) {
            return [
                'sucesso' => false,
                'mensagem' => 'Stock insuficiente',
                'erros' => [[
                    'produto_id' => $id,
                    'nome' => $produto_nome,
                    'stock_disponivel' => $stock_disponivel,
                    'quantidade_pedida' => $qty,
                    'erro' => "Stock insuficiente. Disponível: $stock_disponivel, Solicitado: $qty"
                ]]
            ];
        }

        // ========== 5. VERIFICA/CRIA N_PEDIDO ==========
        $sql_pedido_usuario = "SELECT DISTINCT n_pedido 
                            FROM pedido 
                            WHERE usuario = ? 
                            ORDER BY CAST(n_pedido AS UNSIGNED) DESC 
                            LIMIT 1";
        $stmt_pedido_usuario = $db->prepare($sql_pedido_usuario);
        if (!$stmt_pedido_usuario) {
            return ['sucesso' => false, 'mensagem' => 'Erro ao preparar consulta de pedido: ' . $db->error];
        }
        $stmt_pedido_usuario->bind_param("i", $usuario_id);
        $stmt_pedido_usuario->execute();
        $result_pedido = $stmt_pedido_usuario->get_result();
        
        if ($result_pedido && $result_pedido->num_rows > 0) {
            $row = $result_pedido->fetch_assoc();
            $n_pedido_str = $row['n_pedido'];
        } else {
            $sql_max_pedido = "SELECT IFNULL(MAX(CAST(n_pedido AS UNSIGNED)), 0) + 1 AS novo_numero FROM pedido";
            $stmt_max_pedido = $db->prepare($sql_max_pedido);
            if (!$stmt_max_pedido) {
                return ['sucesso' => false, 'mensagem' => 'Erro ao preparar consulta de max pedido: ' . $db->error];
            }
            $stmt_max_pedido->execute();
            $result_max = $stmt_max_pedido->get_result();
            $row_max = $result_max->fetch_assoc();
            $n_pedido_str = strval($row_max['novo_numero']);
            $stmt_max_pedido->close();
        }
        $stmt_pedido_usuario->close();

        // ========== 6. DEFINE PREÇO FINAL ==========
        if ($preco !== null) {
            $preco_final_str = number_format(floatval($preco), 2, '.', '');
        } else {
            $preco_final_str = number_format($preco_original, 2, '.', '');
        }

        // ========== 7. TRATAMENTO DE REMOÇÃO ==========
        if ($qty === 0) {
            $sql_delete = "DELETE FROM pedido 
                        WHERE usuario = ? 
                        AND n_pedido = ? 
                        AND id_produto = ?";
            $stmt_delete = $db->prepare($sql_delete);
            if (!$stmt_delete) {
                return ['sucesso' => false, 'mensagem' => 'Erro ao preparar remoção: ' . $db->error];
            }
            $stmt_delete->bind_param("isi", $usuario_id, $n_pedido_str, $id);
            
            if ($stmt_delete->execute()) {
                $stmt_delete->close();
                return [
                    'sucesso' => true,
                    'mensagem' => 'Produto removido do pedido'
                ];
            } else {
                $stmt_delete->close();
                return ['sucesso' => false, 'mensagem' => 'Erro ao remover produto'];
            }
        }

        // ========== 8. VERIFICA SE PRODUTO JÁ EXISTE NO PEDIDO ==========
        $sql_verifica_produto = "SELECT idpedido, qtd, preco, imposto 
                                FROM pedido 
                                WHERE usuario = ? 
                                AND n_pedido = ? 
                                AND id_produto = ?";
        $stmt_verifica_produto = $db->prepare($sql_verifica_produto);
        if (!$stmt_verifica_produto) {
            return ['sucesso' => false, 'mensagem' => 'Erro ao preparar verificação: ' . $db->error];
        }
        $stmt_verifica_produto->bind_param("isi", $usuario_id, $n_pedido_str, $id);
        $stmt_verifica_produto->execute();
        $result_verifica = $stmt_verifica_produto->get_result();
        $produto_existe = ($result_verifica && $result_verifica->num_rows > 0);

        $db->begin_transaction();
        
        try {
            if ($produto_existe) {
                $produto_atual = $result_verifica->fetch_assoc();
                $stmt_verifica_produto->close();
                
                $updates = [];
                $params = [];
                $types = "";
                
                $qty_str = strval($qty);
                if ($produto_atual['qtd'] !== $qty_str) {
                    $updates[] = "qtd = ?";
                    $params[] = $qty_str;
                    $types .= "s";
                }
                
                if ($preco !== null && $produto_atual['preco'] !== $preco_final_str) {
                    $updates[] = "preco = ?";
                    $params[] = $preco_final_str;
                    $types .= "s";
                }
                
                if ($imposto_id !== null && $produto_atual['imposto'] !== $imposto_id) {
                    $updates[] = "imposto = ?";
                    $params[] = $imposto_id;
                    $types .= "s";
                }

                if (!empty($updates)) {
                    $sql_update = "UPDATE pedido 
                                SET " . implode(", ", $updates) . " 
                                WHERE idpedido = ?";
                    $params[] = intval($produto_atual['idpedido']);
                    $types .= "i";
                    
                    $stmt_update = $db->prepare($sql_update);
                    if (!$stmt_update) {
                        throw new Exception("Erro ao preparar atualização pedido: " . $db->error);
                    }
                    
                    $stmt_update->bind_param($types, ...$params);
                    
                    if (!$stmt_update->execute()) {
                        $stmt_update->close();
                        throw new Exception("Erro ao atualizar pedido: " . $stmt_update->error);
                    }
                    
                    $stmt_update->close();
                    
                    error_log("✅ Pedido ATUALIZADO - N°: $n_pedido_str, Produto: $produto_nome, Qty: $qty, Preço: $preco_final_str, Imposto: $imposto_id");
                }
                
            } else {
                $stmt_verifica_produto->close();
                
                // SQL de inserção com os campos corretos
                $sql_insert = "INSERT INTO pedido 
                            (n_pedido, id_produto, descricao, qtd, preco, desconto, imposto, dataa, hora, conta, mesa, empresa, usuario) 
                            VALUES 
                            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                
                $stmt_insert = $db->prepare($sql_insert);
                if (!$stmt_insert) {
                    throw new Exception("Erro ao preparar inserção: " . $db->error);
                }
                
                // Prepara as variáveis com tipos corretos
                $qty_str = strval($qty);
                
                // BIND CORRETO FINAL
                $stmt_insert->bind_param(
                    "sisssssssssii",
                    $n_pedido_str,      // s - varchar(500)
                    $id,                // i - int(11)
                    $produto_nome,      // s - varchar(500)
                    $qty_str,           // s - varchar(500)
                    $preco_final_str,   // s - varchar(500)
                    $desconto_val,      // s - varchar(500)
                    $imposto_id,        // s - varchar(500)
                    $data_atual,        // s - timestamp
                    $hora_atual,        // s - varchar(500)
                    $conta,             // s - varchar(500)
                    $mesa,              // s - varchar(500)
                    $empresa_id,        // i - int(11)
                    $usuario_id         // i - int(11)
                );
                
                if (!$stmt_insert->execute()) {
                    $erro_msg = $stmt_insert->error;
                    $stmt_insert->close();
                    throw new Exception("Erro ao inserir pedido: " . $erro_msg);
                }
                
                $stmt_insert->close();
                
                error_log("✅ Pedido INSERIDO - N°: $n_pedido_str, Produto: $produto_nome, Qty: $qty, Preço: $preco_final_str, Imposto: $imposto_id");
            }

            $db->commit();
            
            return [
                'sucesso' => true,
                'mensagem' => $produto_existe ? 'Produto atualizado no pedido' : 'Produto adicionado ao pedido',
                'detalhes' => [
                    'n_pedido' => $n_pedido_str,
                    'produto_id' => $id,
                    'produto_nome' => $produto_nome,
                    'quantidade' => $qty,
                    'preco' => $preco_final_str,
                    'tipo' => $is_servico ? 'servico' : 'produto',
                    'operacao' => $produto_existe ? 'UPDATE' : 'INSERT'
                ]
            ];
            
        } catch (Exception $e) {
            $db->rollback();
            error_log("❌ Erro em adicionarAoPedido: " . $e->getMessage());
            return [
                'sucesso' => false,
                'mensagem' => 'Erro ao processar: ' . $e->getMessage()
            ];
        }
    }

    public static function listarPedido($usuario_id = null) {
        $db = Conexao::getConexao();
        
        if ($usuario_id === null) {
            $usuario_id = 1;
        }
        $usuario_id = intval($usuario_id);
        
        $sql_pedido_ativo = "SELECT DISTINCT n_pedido 
                            FROM pedido 
                            WHERE usuario = ? 
                            ORDER BY CAST(n_pedido AS UNSIGNED) DESC 
                            LIMIT 1";
        $stmt_pedido = $db->prepare($sql_pedido_ativo);
        if (!$stmt_pedido) {
            return [
                'sucesso' => false,
                'mensagem' => 'Erro ao preparar consulta de pedido ativo: ' . $db->error
            ];
        }
        $stmt_pedido->bind_param("i", $usuario_id);
        $stmt_pedido->execute();
        $result_pedido = $stmt_pedido->get_result();
        
        if (!$result_pedido || $result_pedido->num_rows === 0) {
            $stmt_pedido->close();
            return [
                'sucesso' => true,
                'itens' => [],
                'resumo' => [
                    'n_pedido' => null,
                    'total_itens' => 0,
                    'subtotal' => 0.00,
                    'desconto' => 0.00,
                    'taxa' => 0.00,
                    'total' => 0.00
                ]
            ];
        }
        
        $n_pedido = $result_pedido->fetch_assoc()['n_pedido'];
        $stmt_pedido->close();
        
        $sql_itens = "SELECT
                        ped.idpedido,
                        ped.id_produto AS cardapio_id,
                        ped.descricao AS produto_nome,
                        CAST(ped.qtd AS UNSIGNED) AS qty,
                        CAST(ped.preco AS DECIMAL(10,2)) AS preco,
                        CAST(p.venda AS DECIMAL(10,2)) AS preco_original,
                        CAST(p.qtd AS UNSIGNED) AS stock_atual,
                        p.ps AS tipo,
                        (CAST(ped.qtd AS UNSIGNED) * CAST(ped.preco AS DECIMAL(10,2))) AS subtotal,
                        (ped.preco != p.venda) AS preco_customizado,
                        ped.imposto AS imposto_id,
                        CAST(imp.percentagem AS DECIMAL(10,2)) AS imposto_percentual
                    FROM pedido ped
                    LEFT JOIN produto p ON p.idproduto = ped.id_produto
                    LEFT JOIN imposto imp ON imp.id = ped.imposto
                    WHERE ped.usuario = ?
                    AND ped.n_pedido = ?
                    ORDER BY ped.idpedido DESC";
        $stmt_itens = $db->prepare($sql_itens);
        if (!$stmt_itens) {
            return [
                'sucesso' => false,
                'mensagem' => 'Erro ao preparar consulta de itens: ' . $db->error
            ];
        }
        $stmt_itens->bind_param("is", $usuario_id, $n_pedido);
        $stmt_itens->execute();
        $result_itens = $stmt_itens->get_result();
        
        if (!$result_itens) {
            $stmt_itens->close();
            return [
                'sucesso' => false,
                'mensagem' => 'Erro ao buscar itens do pedido: ' . $db->error
            ];
        }
        
        $itens = [];
        $total_itens = 0;
        $total_iliquido = 0.00;
        $total_imposto = 0.00;    // IVA (5%, 7%, 14%)
        $total_retencao = 0.00;   // Retenção (6.5%)

        while ($row = $result_itens->fetch_assoc()) {
            $itens[] = $row;
            $total_itens += intval($row['qty']);
            $valor_base = floatval($row['subtotal']);
            $total_iliquido += $valor_base;

            // 🔥 Calcular imposto baseado no percentual real do produto
            $imposto_percentual = floatval($row['imposto_percentual'] ?? 0);

            if ($imposto_percentual > 0) {
                $valor_imposto = ($valor_base * $imposto_percentual) / 100;

                // ✅ Separar RETENÇÃO (6.5%) de IMPOSTOS (5%, 7%, 14%)
                if ($imposto_percentual == 6.5 || $imposto_percentual == 6.50) {
                    $total_retencao += $valor_imposto;
                } else {
                    $total_imposto += $valor_imposto;
                }
            }
        }
        $stmt_itens->close();

        // 💰 Total a pagar = Ilíquido - Retenção + Impostos
        $total = $total_iliquido - $total_retencao + $total_imposto;

        return [
            'sucesso' => true,
            'itens' => $itens,
            'resumo' => [
                'n_pedido' => $n_pedido,
                'total_itens' => $total_itens,
                'total_iliquido' => round($total_iliquido, 2),      // ✅ NOVO: Total sem impostos
                'total_imposto' => round($total_imposto, 2),        // ✅ NOVO: Soma dos IVAs
                'total_retencao' => round($total_retencao, 2),      // ✅ NOVO: Soma das retenções
                'total' => round($total, 2),                        // ✅ Total a pagar
                // ⚠️ Mantém campos antigos por compatibilidade (serão removidos depois)
                'subtotal' => round($total_iliquido, 2),
                'desconto' => round($total_retencao, 2),
                'taxa' => round($total_imposto, 2)
            ]
        ];
    }

    public static function removerDoPedido($id_pedido) {
        $db = Conexao::getConexao();
        $id_pedido = intval($id_pedido);
       
        $sql_item = "SELECT id_produto, qtd FROM pedido WHERE idpedido = ?";
        $stmt_item = $db->prepare($sql_item);
        if (!$stmt_item) {
            return [
                'sucesso' => false,
                'mensagem' => 'Erro ao preparar consulta de item: ' . $db->error
            ];
        }
        $stmt_item->bind_param("i", $id_pedido);
        $stmt_item->execute();
        $result = $stmt_item->get_result();
       
        if (!$result || $result->num_rows === 0) {
            $stmt_item->close();
            return [
                'sucesso' => false,
                'mensagem' => 'Item não encontrado no pedido'
            ];
        }
       
        $item = $result->fetch_assoc();
        $stmt_item->close();
       
        $db->begin_transaction();
       
        try {
            $sql_delete = "DELETE FROM pedido WHERE idpedido = ?";
            $stmt_delete = $db->prepare($sql_delete);
            if (!$stmt_delete) {
                throw new Exception("Erro ao preparar remoção: " . $db->error);
            }
            $stmt_delete->bind_param("i", $id_pedido);
           
            if (!$stmt_delete->execute()) {
                $stmt_delete->close();
                throw new Exception("Erro ao remover do pedido");
            }
           
            $stmt_delete->close();
            $db->commit();
           
            return [
                'sucesso' => true,
                'mensagem' => 'Item removido do pedido com sucesso'
            ];
           
        } catch (Exception $e) {
            $db->rollback();
            return [
                'sucesso' => false,
                'mensagem' => 'Erro ao processar: ' . $e->getMessage()
            ];
        }
    }

    public static function limparPedido() {
        $db = Conexao::getConexao();
       
        $sql_itens = "SELECT id_produto, qtd FROM pedido LIMIT 1";
        $stmt_itens = $db->prepare($sql_itens);
        if (!$stmt_itens) {
            return [
                'sucesso' => false,
                'mensagem' => 'Erro ao preparar consulta de itens: ' . $db->error
            ];
        }
        $stmt_itens->execute();
        $result = $stmt_itens->get_result();
       
        if (!$result || $result->num_rows === 0) {
            $stmt_itens->close();
            return [
                'sucesso' => true,
                'mensagem' => 'Pedido já está vazio'
            ];
        }
        $stmt_itens->close();
       
        $db->begin_transaction();
       
        try {
            $sql_limpar_pedido = "DELETE FROM pedido";
            $stmt_limpar = $db->prepare($sql_limpar_pedido);
            if (!$stmt_limpar) {
                throw new Exception("Erro ao preparar limpeza: " . $db->error);
            }
           
            if (!$stmt_limpar->execute()) {
                $stmt_limpar->close();
                throw new Exception("Erro ao limpar pedido");
            }
           
            $stmt_limpar->close();
            $db->commit();
           
            return [
                'sucesso' => true,
                'mensagem' => 'Pedido limpo com sucesso'
            ];
           
        } catch (Exception $e) {
            $db->rollback();
            return [
                'sucesso' => false,
                'mensagem' => 'Erro ao limpar pedido: ' . $e->getMessage()
            ];
        }
    }
}
?>