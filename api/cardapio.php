<?php
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");


require_once __DIR__ . '/../app/Control/cardapioControl.php';

$controla_cardapio = new CardapioControl();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['acao']) && $_GET['acao'] === 'listar') {
            $controla_cardapio->apiListarCardapio();
        } else {
            http_response_code(400);
            echo json_encode(["erro" => "Ação GET inválida ou não informada (use ?acao=listar)"]);
        }
        break;

    case 'POST':
        if (isset($_GET['acao']) && $_GET['acao'] === 'adicionar') {
            // ----- ADICIONAR -----
            $raw = file_get_contents("php://input");
            $data = json_decode($raw, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(["erro" => "JSON inválido"]);
                break;
            }

            if (!isset($data['nome']) || !isset($data['preco'])) {
                http_response_code(400);
                echo json_encode(["erro" => "Campos obrigatórios não informados: nome e preco"]);
                break;
            }

            $nome = trim($data['nome']);
            $preco = $data['preco'];

            if ($nome === '') {
                http_response_code(400);
                echo json_encode(["erro" => "Nome vazio"]);
                break;
            }

            if (!is_numeric($preco)) {
                http_response_code(400);
                echo json_encode(["erro" => "Preço inválido"]);
                break;
            }

            $preco = floatval($preco);

            $result = $controla_cardapio->apiAdicionarCardapio($nome, $preco);

            if ($result === null) { exit; }
            if ($result === true) {
                http_response_code(201);
                echo json_encode(["sucesso" => true, "mensagem" => "Produto adicionado"]);
                exit;
            }
            if (is_array($result)) {
                echo json_encode($result);
                exit;
            }

            http_response_code(500);
            echo json_encode(["erro" => "Falha ao adicionar o produto"]);
        } 
        elseif (isset($_GET['acao']) && $_GET['acao'] === 'alterar') {
            // ----- ALTERAR -----
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(["erro" => "ID inválido ou não informado"]);
                break;
            }

            $raw = file_get_contents("php://input");
            $data = json_decode($raw, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(["erro" => "JSON inválido"]);
                break;
            }

            if (!isset($data['nome']) || !isset($data['preco'])) {
                http_response_code(400);
                echo json_encode(["erro" => "Campos obrigatórios não informados: nome e preco"]);
                break;
            }

            $nome = trim($data['nome']);
            $preco = $data['preco'];

            if ($nome === '') {
                http_response_code(400);
                echo json_encode(["erro" => "Nome vazio"]);
                break;
            }

            if (!is_numeric($preco)) {
                http_response_code(400);
                echo json_encode(["erro" => "Preço inválido"]);
                break;
            }

            $preco = floatval($preco);

            // Chama o método no Controller
            if (!method_exists($controla_cardapio, 'apiAlterarCardapio')) {
                http_response_code(501);
                echo json_encode([
                    "erro" => "Método apiAlterarCardapio não implementado no controller"
                ]);
                break;
            }

            $result = $controla_cardapio->apiAlterarCardapio($id, $nome, $preco);

            if ($result === null) { exit; }
            if ($result === true) {
                http_response_code(200);
                echo json_encode(["sucesso" => true, "mensagem" => "Produto alterado com sucesso"]);
                exit;
            }
            if (is_array($result)) {
                echo json_encode($result);
                exit;
            }

            http_response_code(500);
            echo json_encode(["erro" => "Falha ao alterar o produto"]);
        } 
        else {
            http_response_code(400);
            echo json_encode(["erro" => "Ação POST inválida ou não informada (use ?acao=adicionar ou ?acao=alterar)"]);
        }
        break;

    case 'DELETE':
        if (isset($_GET['acao']) && $_GET['acao'] === 'deletar') {
            $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(["erro" => "ID inválido ou não informado"]);
                break;
            }

            if (!method_exists($controla_cardapio, 'apiDeletarCardapio')) {
                http_response_code(501);
                echo json_encode([
                    "erro" => "Método apiDeletarCardapio não implementado no controller"
                ]);
                break;
            }

            $result = $controla_cardapio->apiDeletarCardapio($id);

            if ($result === null) { exit; }
            if ($result === true) {
                http_response_code(200);
                echo json_encode(["sucesso" => true, "mensagem" => "Produto eliminado"]);
                exit;
            }
            if (is_array($result)) {
                echo json_encode($result);
                exit;
            }

            http_response_code(500);
            echo json_encode(["erro" => "Falha ao eliminar o produto"]);
        } else {
            http_response_code(400);
            echo json_encode(["erro" => "Ação DELETE inválida ou não informada (use ?acao=deletar&id=...)"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["erro" => "Método não permitido"]);
        break;
}
