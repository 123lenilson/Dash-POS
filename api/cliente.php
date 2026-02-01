<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . '/../app/Control/ClienteControl.php';

$clienteControl = new ClienteControl();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!isset($_GET['acao'])) {
            http_response_code(400);
            echo json_encode(["erro" => "Ação não informada (use ?acao=listar_cliente, pesquisar_cliente ou buscar_consumidor_final)"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $acao = $_GET['acao'];

        if ($acao === 'listar_cliente') {
            $clienteControl->apiListarClientes();
        } else if ($acao === 'pesquisar_cliente') {
            if (!isset($_GET['termo'])) {
                http_response_code(400);
                echo json_encode(["erro" => "Termo não informado para pesquisa (?termo=)"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $termo = trim($_GET['termo']);
            if (empty($termo)) {
                http_response_code(400);
                echo json_encode(["erro" => "Termo de pesquisa não pode estar vazio"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $clienteControl->apiBuscarClientes();
        } else if ($acao === 'buscar_consumidor_final') {
            // ✅ IMPLEMENTAÇÃO CORRETA: Apenas chama o Controller
            $clienteControl->apiBuscarConsumidorFinal();
        } else {
            http_response_code(400);
            echo json_encode(["erro" => "Ação inválida (use listar_cliente, pesquisar_cliente ou buscar_consumidor_final)"], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'POST':
        $input = file_get_contents('php://input');
        $dados = json_decode($input, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(["erro" => "JSON inválido na requisição"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (!isset($dados['acao'])) {
            http_response_code(400);
            echo json_encode(["erro" => "Ação não informada no corpo da requisição"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $acao = $dados['acao'];

        if ($acao === 'verificar_cliente') {
            // Validação - Apenas o Nome é obrigatório
            if (!isset($dados['nome']) || empty(trim($dados['nome']))) {
                http_response_code(400);
                echo json_encode(["erro" => "Nome do cliente é obrigatório"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Campos opcionais: telefone, email, endereco, nif
            $dados['telefone'] = isset($dados['telefone']) && !empty(trim($dados['telefone'])) ? trim($dados['telefone']) : null;
            $dados['email'] = isset($dados['email']) && !empty(trim($dados['email'])) ? trim($dados['email']) : null;
            $dados['endereco'] = isset($dados['endereco']) && !empty(trim($dados['endereco'])) ? trim($dados['endereco']) : null;
            $dados['nif'] = isset($dados['nif']) && !empty(trim($dados['nif'])) ? trim($dados['nif']) : null;

            // Chama o método no controller
            $clienteControl->apiVerificarCliente($dados);
        } else {
            http_response_code(400);
            echo json_encode(["erro" => "Ação inválida para POST (use 'verificar_cliente')"], JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["erro" => "Método não permitido (suportados: GET e POST)"], JSON_UNESCAPED_UNICODE);
        break;
}
?>