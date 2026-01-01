<?php
require_once __DIR__ . '/../config/conexao.php';

class PagamentoModel {
    public static function listarPagamentos() {
        $db = Conexao::getConexao();
        $sql = "
            SELECT
                idpagamento,
                forma,
                taxa,
                ativo,
                empresa,
                usuario
            FROM
                pagamento
            ORDER BY
                forma ASC
        ";
        
        $stmt = $db->prepare($sql);
        if (!$stmt) {
            return [];
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $pagamentos = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $pagamentos[] = $row;
            }
        }
        $stmt->close();
        return $pagamentos;
    }
}
?>