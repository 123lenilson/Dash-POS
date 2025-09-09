<?php
require_once __DIR__ . '/../Model/cardapioModel.php';

class CardapioControl {
    public function apiListarCardapio() {
        $cardapios = CardapioModel::listarCardapio();
        echo json_encode($cardapios);
    }

    public function apiAdicionarCardapio($nome, $preco) {
        // Chama o model para inserir no banco
        $resultado = CardapioModel::adicionarCardapio($nome, $preco);

        if ($resultado) {
            http_response_code(201);
            echo json_encode([
                "sucesso" => true,
                "mensagem" => "Produto adicionado com sucesso"
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "sucesso" => false,
                "erro" => "Falha ao adicionar o produto"
            ]);
        }
    }

    public function apiDeletarCardapio($id) {
        // Chama o model para deletar no banco
        $resultado = CardapioModel::deletarCardapio($id);

        if ($resultado) {
            http_response_code(200);
            echo json_encode([
                "sucesso" => true,
                "mensagem" => "Produto removido com sucesso"
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "sucesso" => false,
                "erro" => "Falha ao remover o produto"
            ]);
        }
    }

    public function apiAlterarCardapio($id, $nome, $preco) {
        // Chama o model para atualizar no banco
        $resultado = CardapioModel::alterarCardapio($id, $nome, $preco);

        if ($resultado) {
            http_response_code(200);
            echo json_encode([
                "sucesso" => true,
                "mensagem" => "Produto alterado com sucesso"
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "sucesso" => false,
                "erro" => "Falha ao alterar o produto"
            ]);
        }
    }


}
