<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../app/Control/PagamentoControl.php';

$pagamentoControl = new PagamentoControl();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!isset($_GET['acao'])) {
            http_response_code(400);
            echo json_encode(["erro" => "Ação não informada (use ?acao=listar_cliente para selecionar geral ou ?acao=pesquisar_cliente para pesquisa com termo)"], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $acao = $_GET['acao'];

        if ($acao === 'listar_pagamento') {
            $pagamentoControl->apiListarPagamento();
        } else {
            http_response_code(400);
            echo json_encode(["erro" => "Ação inválida (use listar_cliente para seleção geral ou pesquisar_cliente para pesquisa)"], JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["erro" => "Método não permitido (apenas GET é suportado para clientes)"], JSON_UNESCAPED_UNICODE);
        break;
}
?>