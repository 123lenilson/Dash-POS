<?php
// ✅ LIMPA QUALQUER OUTPUT ANTERIOR
ob_start();

error_reporting(E_ALL);
ini_set('display_errors', 0); // ✅ NÃO EXIBIR ERROS NO OUTPUT
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log'); // ✅ SALVA ERROS EM LOG

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");

// ✅ LIMPA BUFFER ANTES DE ENVIAR JSON
ob_clean();

require_once __DIR__ . '/../app/Control/PedidoControl.php';

$pedidoControl = new PedidoControl();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!isset($_GET['acao'])) {
            http_response_code(400);
            echo json_encode(["erro" => "Ação não informada (use ?acao=listar_pedido para seleção geral)"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $acao = $_GET['acao'];

        if ($acao === 'listar_pedido') {
            $pedidoControl->apiListarCarrinho();
        } else {
            http_response_code(400);
            echo json_encode(["erro" => "Ação inválida (use listar_pedido para seleção geral)"], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'POST':
        if (!isset($_GET['acao'])) {
            http_response_code(400);
            echo json_encode(["erro" => "Ação não informada (use ?acao=adicionar_pedido para adicionar item)"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $acao = $_GET['acao'];

        if ($acao === 'adicionar_pedido') {
            $raw = file_get_contents("php://input");
            $data = json_decode($raw, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(["erro" => "JSON inválido"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            if (!isset($data['id']) || !isset($data['qty'])) {
                http_response_code(400);
                echo json_encode(["erro" => "ID ou quantidade não informados no body JSON"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $id = intval($data['id']);
            $qty = intval($data['qty']);
            $preco = isset($data['preco']) ? floatval($data['preco']) : null;
            $impostos = isset($data['impostos']) ? intval($data['impostos']) : null;

            if ($id <= 0 || $qty < 0 || ($preco !== null && $preco < 0)) {
                http_response_code(400);
                echo json_encode(["erro" => "Dados inválidos (ID>0, qty>=0, preco>=0)"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $pedidoControl->apiSelecionarProduto($id, $qty, $preco, $impostos);
        } else {
            http_response_code(400);
            echo json_encode(["erro" => "Ação inválida (use adicionar_pedido para adicionar item)"], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'DELETE':
        // Placeholder para remover item (ex: ?acao=remover_item&id=1)
        if (!isset($_GET['acao']) || $_GET['acao'] !== 'remover_item' || !isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["erro" => "Ação ou ID não informados (?acao=remover_item&id=)"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $id = intval($_GET['id']);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(["erro" => "ID inválido (deve ser > 0)"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Para implementar: $pedidoControl->apiRemoverDoPedido($id);
        http_response_code(501);
        echo json_encode(["erro" => "Remover item ainda não implementado"], JSON_UNESCAPED_UNICODE);
        break;

    default:
        http_response_code(405);
        echo json_encode(["erro" => "Método não permitido"], JSON_UNESCAPED_UNICODE);
        break;
}
?>