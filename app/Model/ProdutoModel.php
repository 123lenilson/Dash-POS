<?php
require_once __DIR__ . '/../config/conexao.php';

class ProdutoModel {
    public static function listarProdutos() {
        try {
            $db = Conexao::getConexao();
            $sql = "
                SELECT
                    p.idproduto,
                    p.descricao,
                    p.categoria AS categoria_id,
                    c.categoria AS categoria_nome,
                    p.ps,
                    p.impostos,
                    p.qtd,
                    p.validade,
                    p.compra,
                    p.venda,
                    p.barra,
                    p.obs,
                    p.empresa,
                    p.usuario,
                    i.imposto AS imposto_descricao,
                    i.percentagem AS imposto_percentagem,
                    CASE 
                        WHEN p.impostos = 4 THEN p.venda
                        ELSE ROUND(p.venda + (p.venda * IFNULL(i.percentagem, 0) / 100), 2)
                    END AS preco_com_imposto
                FROM
                    produto p
                JOIN
                    categoria c ON c.id = p.categoria
                LEFT JOIN
                    imposto i ON i.id = p.impostos
                ORDER BY
                    c.categoria, p.descricao
            ";
            
            $stmt = $db->prepare($sql);
            if (!$stmt) {
                throw new Exception('Erro ao preparar consulta: ' . $db->error);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            
            if (!$result) {
                $stmt->close();
                throw new Exception('Erro na query: ' . $db->error);
            }
            
            $produtos = [];
            while ($row = $result->fetch_assoc()) {
                $produtos[] = $row;
            }
            
            $stmt->close();
            return $produtos;
            
        } catch (Exception $e) {
            return ['erro' => $e->getMessage()];
        }
    }

    public static function buscarProdutos($termo) {
        try {
            $db = Conexao::getConexao();
            $termo_like = "%$termo%";
            $sql = "
                SELECT
                    p.idproduto,
                    p.descricao,
                    p.categoria AS categoria_id,
                    c.categoria AS categoria_nome,
                    p.ps,
                    p.impostos,
                    p.qtd,
                    p.validade,
                    p.compra,
                    p.venda,
                    p.barra,
                    p.obs,
                    p.empresa,
                    p.usuario,
                    i.imposto AS imposto_descricao,
                    i.percentagem AS imposto_percentagem,
                    CASE 
                        WHEN p.impostos = 4 THEN p.venda
                        ELSE ROUND(p.venda + (p.venda * IFNULL(i.percentagem, 0) / 100), 2)
                    END AS preco_com_imposto
                FROM
                    produto p
                JOIN
                    categoria c ON c.id = p.categoria
                LEFT JOIN
                    imposto i ON i.id = p.impostos
                WHERE
                    p.descricao LIKE ? OR p.barra LIKE ?
                ORDER BY
                    c.categoria, p.descricao
            ";
            
            $stmt = $db->prepare($sql);
            if (!$stmt) {
                throw new Exception('Erro ao preparar consulta: ' . $db->error);
            }
            
            $stmt->bind_param("ss", $termo_like, $termo_like);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if (!$result) {
                $stmt->close();
                throw new Exception('Erro na query: ' . $db->error);
            }
            
            $produtos = [];
            while ($row = $result->fetch_assoc()) {
                $produtos[] = $row;
            }
            
            $stmt->close();
            return $produtos;
            
        } catch (Exception $e) {
            return ['erro' => $e->getMessage()];
        }
    }
}
?>