<?php
require_once __DIR__ . '/../Model/PedidoModel.php';

class PedidoControl {
    public function apiListarCarrinho() {  // Mantive o nome do método pra compatibilidade, mas chame como quiser
        $dados = PedidoModel::listarPedido();

        if (!$dados['sucesso']) {
            echo json_encode([
                'sucesso' => false,
                'mensagem' => $dados['mensagem'] ?? 'Erro desconhecido'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        if (empty($dados['itens'])) {
            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Pedido vazio',
                'itens' => [],
                'resumo' => $dados['resumo']
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Pedido carregado',
                'itens' => $dados['itens'],
                'resumo' => $dados['resumo']
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    public function apiSelecionarProduto($id, $qty, $preco = null, $impostos = null) {
        try {
            if ($id <= 0 || $qty < 0) {
                http_response_code(400);
                echo json_encode([
                    "sucesso" => false,
                    "erro" => "Parâmetros inválidos (ID > 0, qty >= 0)"
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            if ($preco !== null && $preco < 0) {
                http_response_code(400);
                echo json_encode([
                    "sucesso" => false,
                    "erro" => "Preço inválido (>= 0)"
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            $resultado = PedidoModel::adicionarAoPedido($id, $qty, $preco, $impostos);
            http_response_code(200);
            echo json_encode($resultado, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                "sucesso" => false,
                "erro" => "Erro interno no processamento: " . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    // Se precisar implementar remover:
    // public function apiRemoverDoPedido($id) {
    //     // Chame PedidoModel::removerDoPedido($id);
    //     // ...
    // }
}
?>