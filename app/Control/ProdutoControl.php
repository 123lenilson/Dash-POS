<?php
require_once __DIR__ . '/../Model/ProdutoModel.php';

class ProdutoControl {
    public function apiListarProdutos() {
        $produtos = ProdutoModel::listarProdutos();
        echo json_encode($produtos, JSON_UNESCAPED_UNICODE);
    }

    public function apiBuscarProdutos() {
        if (!isset($_GET['termo']) || trim($_GET['termo']) === '') {
            http_response_code(400);
            echo json_encode(["erro" => "Termo de busca não informado"], JSON_UNESCAPED_UNICODE);
            return;
        }

        $termo = trim($_GET['termo']);
        $resultados = ProdutoModel::buscarProdutos($termo);
        echo json_encode($resultados, JSON_UNESCAPED_UNICODE);
    }
}
?>