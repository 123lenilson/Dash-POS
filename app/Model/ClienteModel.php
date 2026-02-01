<?php
require_once __DIR__ . '/../config/conexao.php';

class ClienteModel {
    public static function listarClientes() {
        $db = Conexao::getConexao();
        
        // ✅ MUDANÇA: Usar prepared statement para consistência (embora sem parâmetros)
        $sql = "
            SELECT
                idcliente,
                nome,
                nif,
                email,
                telefone,
                morada
            FROM
                cliente
            ORDER BY
                nome ASC
        ";
        $stmt = $db->prepare($sql);
        if (!$stmt) {
            throw new Exception("Erro ao preparar a consulta de listagem: " . $db->error);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $clientes = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $clientes[] = $row;
            }
        }
        $stmt->close();
        return $clientes;
    }

    public static function buscarClientes($termo) {
        $db = Conexao::getConexao();
        
        // ✅ MUDANÇA: Usar prepared statement para evitar SQL injection e consistência
        $sql = "
            SELECT
                idcliente,
                nome,
                nif,
                email,
                telefone,
                morada
            FROM cliente
            WHERE nome LIKE ? OR telefone LIKE ?
            ORDER BY nome ASC
        ";
        $termo_like = "%$termo%";
        $stmt = $db->prepare($sql);
        if (!$stmt) {
            throw new Exception("Erro ao preparar a consulta de busca: " . $db->error);
        }
        
        $stmt->bind_param("ss", $termo_like, $termo_like);
        $stmt->execute();
        $result = $stmt->get_result();
        $clientes = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $clientes[] = $row;
            }
        }
        $stmt->close();
        return $clientes;
    }

    public static function verificar_cliente($dados) {
        $db = Conexao::getConexao();

        // Prepared statement para SELECT - Verifica apenas pelo nome (único campo obrigatório)
        // Se telefone ou email estiverem preenchidos, também verifica por eles
        $where_conditions = ["nome = ?"];
        $bind_types = "s";
        $bind_values = [$dados['nome']];

        if (!empty($dados['telefone'])) {
            $where_conditions[] = "telefone = ?";
            $bind_types .= "s";
            $bind_values[] = $dados['telefone'];
        }

        if (!empty($dados['email'])) {
            $where_conditions[] = "email = ?";
            $bind_types .= "s";
            $bind_values[] = $dados['email'];
        }

        $sql_select = "
            SELECT idcliente
            FROM cliente
            WHERE " . implode(" AND ", $where_conditions) . "
        ";

        $stmt = $db->prepare($sql_select);
        if (!$stmt) {
            throw new Exception("Erro ao preparar a consulta de verificação: " . $db->error);
        }

        $stmt->bind_param($bind_types, ...$bind_values);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $stmt->close();
            return [
                'status' => 'PODE PASSAR',
                'id_cliente' => $row['idcliente']
            ];
        }

        $stmt->close();

        // Se não encontrado, INSERT novo cliente
        $sql_insert = "
            INSERT INTO cliente (nome, nif, email, telefone, morada, endereco, empresa, usuario) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ";
        $stmt = $db->prepare($sql_insert);
        if (!$stmt) {
            throw new Exception("Erro ao preparar a inserção: " . $db->error);
        }

        // Campos do input - todos opcionais exceto nome
        $nif = $dados['nif'] ?? null;
        $email = $dados['email'] ?? null;
        $telefone = $dados['telefone'] ?? null;
        $endereco_input = $dados['endereco'] ?? null;

        // Duplicar o valor de 'endereco' para 'morada' também
        $morada = $endereco_input;  // Salva o mesmo valor em morada e endereco
        $empresa = '1'; // Valor padrão conforme instrução
        $usuario = '1'; // Valor padrão conforme instrução

        $stmt->bind_param("ssssssss", $dados['nome'], $nif, $email, $telefone, $morada, $endereco_input, $empresa, $usuario);
        if (!$stmt->execute()) {
            throw new Exception("Erro ao inserir cliente: " . $stmt->error);
        }

        $id_cliente = $db->insert_id;
        $stmt->close();

        return [
            'status' => 'PODE PASSAR',
            'id_cliente' => $id_cliente
        ];
    }

    /**
     * Busca o cliente padrão "Consumidor Final" no banco de dados
     * 
     * @return array|null Retorna array com dados do cliente ou null se não encontrado
     * @throws Exception Se houver erro na query
     */
    public static function buscarConsumidorFinal() {
        $db = Conexao::getConexao();
        
        // ✅ PREPARED STATEMENT para consistência com o resto do código
        $sql = "
            SELECT 
                idcliente,
                nome,
                nif,
                email,
                telefone,
                morada
            FROM 
                cliente
            WHERE 
                nome = 'Consumidor Final'
                OR LOWER(nome) LIKE '%consumidor%final%'
            LIMIT 1
        ";
        
        $stmt = $db->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Erro ao preparar consulta de cliente padrão: " . $db->error);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $cliente = null;
        if ($result && $result->num_rows > 0) {
            $cliente = $result->fetch_assoc();
        }
        
        $stmt->close();
        
        return $cliente;
    }
}
?>