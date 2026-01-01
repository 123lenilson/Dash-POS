<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
error_log('===== INICIO VENDER.PHP =====');

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

try {
    error_log('Tentando carregar VendaControl.php');
    require_once __DIR__ . '/../app/Control/VendaControl.php';
    error_log('VendaControl.php carregado com sucesso');
} catch (Exception $e) {
    error_log('ERRO ao carregar VendaControl: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["erro" => "Erro ao carregar controller: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
}

$vendaControl = new VendaControl();
$method = $_SERVER['REQUEST_METHOD'];
error_log('Método HTTP: ' . $method);

switch ($method) {
    case 'POST':
        error_log('POST recebido');
        $input = file_get_contents('php://input');
        error_log('Input recebido: ' . substr($input, 0, 500));
        
        $dados = json_decode($input, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('Erro JSON: ' . json_last_error_msg());
            http_response_code(400);
            echo json_encode(["erro" => "JSON inválido na requisição"], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        error_log('JSON parseado com sucesso');

        if (!isset($dados['acao'])) {
            error_log('Ação não informada');
            http_response_code(400);
            echo json_encode(["erro" => "Ação não informada no corpo da requisição"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $acao = $dados['acao'];
        error_log('Ação: ' . $acao);

        if ($acao === 'fatura-recibo') {  // ✅ ATUALIZADO: fatura -> fatura-recibo
            // Validação básica dos campos obrigatórios
            if (!isset($dados['id_cliente']) || empty($dados['id_cliente'])) {
                http_response_code(400);
                echo json_encode(["erro" => "ID do cliente é obrigatório"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            if (!isset($dados['metodos_pagamento']) || !is_array($dados['metodos_pagamento']) || empty($dados['metodos_pagamento'])) {
                http_response_code(400);
                echo json_encode(["erro" => "Métodos de pagamento são obrigatórios e devem ser um array não vazio"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Validar que cada método tem id_metodo e valor > 0
            foreach ($dados['metodos_pagamento'] as $metodo) {
                if (!isset($metodo['id_metodo']) || empty($metodo['id_metodo']) || !isset($metodo['valor']) || $metodo['valor'] <= 0) {
                    http_response_code(400);
                    echo json_encode(["erro" => "Cada método de pagamento deve ter id_metodo válido e valor > 0"], JSON_UNESCAPED_UNICODE);
                    exit;
                }
            }

            // Campos opcionais: observacao, troco, valor_pago
            $dados['observacao'] = isset($dados['observacao']) ? trim($dados['observacao']) : '';
            $dados['troco'] = isset($dados['troco']) ? (float)$dados['troco'] : 0;
            $dados['valor_pago'] = isset($dados['valor_pago']) ? (float)$dados['valor_pago'] : 0;

            // Chama o método no controller
            error_log('Chamando apiProcessarFaturaRecibo...');  // ✅ ATUALIZADO
            try {
                $vendaControl->apiProcessarFaturaRecibo($dados);  // ✅ ATUALIZADO: apiProcessarFatura -> apiProcessarFaturaRecibo
                error_log('apiProcessarFaturaRecibo executado com sucesso');  // ✅ ATUALIZADO
            } catch (Exception $e) {
                error_log('ERRO em apiProcessarFaturaRecibo: ' . $e->getMessage());  // ✅ ATUALIZADO
                error_log('Stack trace: ' . $e->getTraceAsString());
                http_response_code(500);
                echo json_encode(["erro" => "Erro ao processar fatura-recibo: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);  // ✅ ATUALIZADO
            }
        } elseif ($acao === 'factura_proforma_orcamento') {
            // Validação básica: ID do cliente e tipo de documento
            if (!isset($dados['id_cliente']) || empty($dados['id_cliente'])) {
                http_response_code(400);
                echo json_encode(["erro" => "ID do cliente é obrigatório"], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
            if (!isset($dados['tipo_documento']) || empty($dados['tipo_documento'])) {
                http_response_code(400);
                echo json_encode(["erro" => "Tipo de documento é obrigatório"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Chama o método no controller
            error_log('Chamando api_processar_factura_proforma_orcamento...');
            try {
                // Converter formato antigo para novo formato
                $dados_novos = [
                    'dados_cliente' => [
                        'id_cliente' => $dados['id_cliente'],
                        'tipo_documento' => $dados['tipo_documento']
                    ]
                ];
                $vendaControl->api_processar_factura_proforma_orcamento($dados_novos);
                error_log('api_processar_factura_proforma_orcamento executado com sucesso');
            } catch (Exception $e) {
                error_log('ERRO em api_processar_factura_proforma_orcamento: ' . $e->getMessage());
                error_log('Stack trace: ' . $e->getTraceAsString());
                http_response_code(500);
                echo json_encode(["erro" => "Erro ao processar factura proforma/orcamento: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            }
        } elseif ($acao === 'fatura-proforma') {
            // Validação básica: ID do cliente
            if (!isset($dados['id_cliente']) || empty($dados['id_cliente'])) {
                http_response_code(400);
                echo json_encode(["erro" => "ID do cliente é obrigatório"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Chama o método no controller
            error_log('Chamando api_processar_factura_proforma_orcamento...');
            try {
                // Converter formato antigo para novo formato
                $dados_novos = [
                    'dados_cliente' => [
                        'id_cliente' => $dados['id_cliente'],
                        'tipo_documento' => $dados['tipo_documento'] ?? 'Factura-Proforma'
                    ]
                ];
                $vendaControl->api_processar_factura_proforma_orcamento($dados_novos);
                error_log('api_processar_factura_proforma_orcamento executado com sucesso');
            } catch (Exception $e) {
                error_log('ERRO em api_processar_factura_proforma_orcamento: ' . $e->getMessage());
                error_log('Stack trace: ' . $e->getTraceAsString());
                http_response_code(500);
                echo json_encode(["erro" => "Erro ao processar factura proforma/orcamento: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            }
        } elseif ($acao === 'fatura') {
            // Nova ação: fatura
            // Validação básica: ID do cliente
            if (!isset($dados['id_cliente']) || empty($dados['id_cliente'])) {
                http_response_code(400);
                echo json_encode(["erro" => "ID do cliente é obrigatório"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Chama o método no controller
            error_log('Chamando apiProcessarFatura...');
            try {
                $vendaControl->apiProcessarFatura($dados);
                error_log('apiProcessarFatura executado com sucesso');
            } catch (Exception $e) {
                error_log('ERRO em apiProcessarFatura: ' . $e->getMessage());
                error_log('Stack trace: ' . $e->getTraceAsString());
                http_response_code(500);
                echo json_encode(["erro" => "Erro ao processar fatura: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            }
        } elseif ($acao === 'orcamento') {
            // Validação básica: dados do cliente
            if (!isset($dados['dados_cliente']) || !is_array($dados['dados_cliente'])) {
                http_response_code(400);
                echo json_encode(["erro" => "Dados do cliente são obrigatórios"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Chama o método no controller
            error_log('Chamando api_processar_factura_proforma_orcamento (orcamento)...');
            try {
                // Converter formato para orçamento
                $dados_orcamento = $dados;
                $dados_orcamento['dados_cliente']['tipo_documento'] = $dados['tipo_documento'] ?? 'Orcamento';
                $vendaControl->api_processar_factura_proforma_orcamento($dados_orcamento);
                error_log('api_processar_factura_proforma_orcamento executado com sucesso');
            } catch (Exception $e) {
                error_log('ERRO em api_processar_factura_proforma_orcamento: ' . $e->getMessage());
                error_log('Stack trace: ' . $e->getTraceAsString());
                http_response_code(500);
                echo json_encode(["erro" => "Erro ao processar orçamento: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            }
        } else {
            http_response_code(400);
            echo json_encode(["erro" => "Ação inválida para POST (use 'fatura-recibo', 'factura_proforma_orcamento', 'fatura' ou 'orcamento')"], JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["erro" => "Método não permitido (apenas POST é suportado para fatura)"], JSON_UNESCAPED_UNICODE);
        break;
}
?>