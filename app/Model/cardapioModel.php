<?php
require_once __DIR__ . '/../config/conexao.php';

class CardapioModel {
    public static function listarCardapio() {
        $db = Conexao::getConexao();
        $sql = "
            SELECT 
                c.id AS categoria_id,
                c.nome AS categoria_nome,
                ca.id AS cardapio_id,
                ca.nome AS cardapio_nome,
                ca.preco AS cardapio_preco,
                COUNT(ca2.id) AS qtd_itens_categoria,
                (SELECT COUNT(*) FROM cardapio) AS qtd_itens_total
            FROM categorias c
            JOIN cardapio ca ON ca.categoria_id = c.id
            LEFT JOIN cardapio ca2 ON ca2.categoria_id = c.id
            GROUP BY c.id, c.nome, ca.id, ca.nome, ca.preco
            ORDER BY c.nome, ca.nome
                ";
        $result = $db->query($sql);
        $cardapios = [];
        while ($row = $result->fetch_assoc()) {
            $cardapios[] = $row;
        }
        return $cardapios;
    }

    public static function buscarClientes($termo) {
        $db = Conexao::getConexao();
        $termo = $db->real_escape_string($termo);
        $sql = "
            SELECT id, nome, email, telefone
            FROM clientes
            WHERE nome LIKE '%$termo%'
            ORDER BY nome ASC
        ";
        $result = $db->query($sql);
        $clientes = [];
        while ($row = $result->fetch_assoc()) {
            $clientes[] = $row;
        }
        return $clientes;
    }

    public static function adicionarCardapio($nome, $preco) {
        $db = Conexao::getConexao();

        // Previne SQL Injection
        $nome = $db->real_escape_string($nome);
        $preco = floatval($preco);

        $sql = "INSERT INTO cardapio (nome, preco) VALUES ('$nome', $preco)";
        return $db->query($sql);
    }

    public static function deletarCardapio($id) {
        $db = Conexao::getConexao();

        // Garante que o ID seja um número inteiro
        $id = intval($id);

        // Monta e executa a query
        $sql = "DELETE FROM cardapio WHERE id = $id";
        return $db->query($sql);
    }

    public static function alterarCardapio($id, $nome, $preco) {
        $db = Conexao::getConexao();

        // Sanitiza e valida os dados
        $id = intval($id);
        $nome = $db->real_escape_string($nome);
        $preco = floatval($preco);

        // Monta e executa a query de atualização
        $sql = "UPDATE cardapio 
                SET nome = '$nome', preco = $preco 
                WHERE id = $id";

        return $db->query($sql);
    }


}
