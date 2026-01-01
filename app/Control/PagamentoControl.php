<?php
require_once __DIR__ . '/../Model/PagamentoModel.php';

class PagamentoControl {
    public function apiListarPagamento() {
        try {
            $pagamentos = PagamentoModel::listarPagamentos();

            if (empty($pagamentos)) {
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => 'Nenhum cliente cadastrado',
                    'pagamentos' => []
                ], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => 'Pagamentos carregados com sucesso',
                    'pagamentos' => $pagamentos
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Erro ao listar pagamentos: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }

}
?>