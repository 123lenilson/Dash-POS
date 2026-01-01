<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../app/Control/ProdutoControl.php';

$produtoControl = new ProdutoControl();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!isset($_GET['acao'])) {
            http_response_code(400);
            echo json_encode(["erro" => "Ação não informada (use ?acao=listar_prod ou ?acao=pesquisar_prod)"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $acao = $_GET['acao'];

        if ($acao === 'listar_prod') {
            $produtoControl->apiListarProdutos();
        } else if ($acao === 'pesquisar_prod') {
            if (!isset($_GET['termo'])) {
                http_response_code(400);
                echo json_encode(["erro" => "Termo não informado (?termo=)"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $termo = trim($_GET['termo']);
            if (empty($termo)) {
                http_response_code(400);
                echo json_encode(["erro" => "Termo de busca não pode estar vazio"], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $produtoControl->apiBuscarProdutos();
        } else {
            http_response_code(400);
            echo json_encode(["erro" => "Ação inválida (use listar_prod ou pesquisar_prod)"], JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["erro" => "Método não permitido (apenas GET é suportado para produtos)"], JSON_UNESCAPED_UNICODE);
        break;
}
?>