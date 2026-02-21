<?php
error_log('===== VENDACONTROL.PHP CARREGADO =====');
require_once __DIR__ . '/../Model/VendaModel.php';
error_log('VendaModel.php carregado');

class VendaControl {
    
    public function apiProcessarFatura($dados) {
        error_log('===== INICIO apiProcessarFatura =====');
        error_log('Dados recebidos: ' . json_encode($dados));
        
        try {
            // Validar se id_cliente existe nos dados
            if (!isset($dados['id_cliente'])) {
                error_log('Erro: ID cliente não informado');
                http_response_code(400);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => 'ID do cliente é obrigatório'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // Validação adicional no controller: ID cliente numérico
            if (!is_numeric($dados['id_cliente']) || $dados['id_cliente'] <= 0) {
                error_log('Erro: ID cliente inválido');
                http_response_code(400);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => 'ID do cliente inválido (deve ser numérico e > 0)'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // Chama o model para processar (passa dados completos para suportar observação)
            error_log('Chamando VendaModel->processarFatura...');
            $resultado = (new VendaModel())->processarFatura($dados);
            error_log('processarFatura retornou: ' . substr(json_encode($resultado), 0, 500));

            if ($resultado['status'] === 'SUCESSO') {
                error_log('Status SUCESSO - preparando resposta');
                // Remover 'status' do array para não duplicar com 'sucesso'
                unset($resultado['status']);
                
                // Adicionar o campo 'sucesso' ao início
                $response = array_merge(
                    ['sucesso' => true],
                    $resultado
                );
                
                error_log('Enviando resposta JSON (primeiros 500 chars): ' . substr(json_encode($response), 0, 500));
                echo json_encode($response, JSON_UNESCAPED_UNICODE);
            } else {
                error_log('Status ERRO: ' . ($resultado['mensagem'] ?? 'Desconhecido'));
                http_response_code(500);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => $resultado['mensagem'] ?? 'Erro no processamento da fatura'
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            error_log('EXCEÇÃO capturada em apiProcessarFatura: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Erro ao processar fatura: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
        error_log('===== FIM apiProcessarFatura =====');
    }
    
    public function apiProcessarFaturaRecibo($dados) {  // ✅ RENOMEADO: apiProcessarFatura -> apiProcessarFaturaRecibo
        error_log('===== INICIO apiProcessarFaturaRecibo =====');  // ✅ ATUALIZADO
        error_log('Dados recebidos: ' . json_encode($dados));
        
        try {
            // Validação adicional no controller (além da API): ID cliente numérico
            if (!is_numeric($dados['id_cliente']) || $dados['id_cliente'] <= 0) {
                error_log('Erro: ID cliente inválido');
                http_response_code(400);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => 'ID do cliente inválido (deve ser numérico e > 0)'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // Chama o model para processar
            error_log('Chamando VendaModel->processarFaturaRecibo...');  // ✅ ATUALIZADO
            $resultado = (new VendaModel())->processarFaturaRecibo($dados);  // ✅ RENOMEADO: processarFatura -> processarFaturaRecibo
            error_log('processarFaturaRecibo retornou: ' . substr(json_encode($resultado), 0, 500));  // ✅ ATUALIZADO

            if ($resultado['status'] === 'SUCESSO') {
                error_log('Status SUCESSO - preparando resposta');
                // ✅ RETORNA TODOS OS DADOS DO MODEL
                // Remove 'status' do array para não duplicar com 'sucesso'
                unset($resultado['status']);
                
                // Adiciona o campo 'sucesso' ao início
                $response = array_merge(
                    ['sucesso' => true],
                    $resultado
                );
                
                error_log('Enviando resposta JSON (primeiros 500 chars): ' . substr(json_encode($response), 0, 500));
                echo json_encode($response, JSON_UNESCAPED_UNICODE);
            } else {
                error_log('Status ERRO: ' . ($resultado['mensagem'] ?? 'Desconhecido'));
                http_response_code(500);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => $resultado['mensagem'] ?? 'Erro no processamento da fatura'
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            error_log('EXCEÇÃO capturada em apiProcessarFaturaRecibo: ' . $e->getMessage());  // ✅ ATUALIZADO
            error_log('Stack trace: ' . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Erro ao processar fatura-recibo: ' . $e->getMessage()  // ✅ ATUALIZADO
            ], JSON_UNESCAPED_UNICODE);
        }
        error_log('===== FIM apiProcessarFaturaRecibo =====');  // ✅ ATUALIZADO
    }

    public function api_processar_factura_proforma_orcamento($dados) {
        error_log('===== INICIO api_processar_factura_proforma_orcamento =====');
        error_log('Dados recebidos: ' . json_encode($dados));
        
        try {
            // Validar se dados_cliente existe nos dados
            if (!isset($dados['dados_cliente']) || !is_array($dados['dados_cliente'])) {
                error_log('Erro: Dados do cliente não informados ou inválidos');
                http_response_code(400);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => 'Dados do cliente são obrigatórios e devem ser um array'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            // Extrair dados do cliente
            $dados_cliente = $dados['dados_cliente'];
            $id_cliente = $dados_cliente['id_cliente'] ?? null;
            $tipo_documento = $dados_cliente['tipo_documento'] ?? null;
            
            // Validar campos obrigatórios
            if (empty($id_cliente) || empty($tipo_documento)) {
                error_log('Erro: ID cliente ou tipo documento não informados');
                http_response_code(400);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => 'ID do cliente e tipo de documento são obrigatórios'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // Validação adicional no controller: ID cliente numérico
            if (!is_numeric($id_cliente) || $id_cliente <= 0) {
                error_log('Erro: ID cliente inválido');
                http_response_code(400);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => 'ID do cliente inválido (deve ser numérico e > 0)'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            // Validar tipo de documento
            if (!in_array($tipo_documento, ['Factura-Proforma', 'Orcamento', 'fatura-proforma', 'orcamento'])) {
                error_log('Erro: Tipo de documento inválido');
                http_response_code(400);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => 'Tipo de documento inválido (deve ser Factura-Proforma ou Orcamento)'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // Chama o model para processar
            error_log('Chamando VendaModel->processar_factura_proforma_orcamento...');
            $resultado = (new VendaModel())->processar_factura_proforma_orcamento($dados_cliente);
            error_log('processar_factura_proforma_orcamento retornou: ' . substr(json_encode($resultado), 0, 500));

            if ($resultado['status'] === 'SUCESSO') {
                error_log('Status SUCESSO - preparando resposta');
                // Remover 'status' do array para não duplicar com 'sucesso'
                unset($resultado['status']);
                
                // Adicionar o campo 'sucesso' ao início
                $response = array_merge(
                    ['sucesso' => true],
                    $resultado
                );
                
                error_log('Enviando resposta JSON (primeiros 500 chars): ' . substr(json_encode($response), 0, 500));
                echo json_encode($response, JSON_UNESCAPED_UNICODE);
            } else {
                error_log('Status ERRO: ' . ($resultado['mensagem'] ?? 'Desconhecido'));
                http_response_code(500);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => $resultado['mensagem'] ?? 'Erro no processamento da factura proforma/orcamento'
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            error_log('EXCEÇÃO capturada em api_processar_factura_proforma_orcamento: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Erro ao processar factura proforma/orcamento: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
        error_log('===== FIM api_processar_factura_proforma_orcamento =====');
    }
}
?>