<?php
require_once __DIR__ . '/../Model/ClienteModel.php';

class ClienteControl {
    public function apiListarClientes() {
        try {
            $clientes = ClienteModel::listarClientes();

            if (empty($clientes)) {
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => 'Nenhum cliente cadastrado',
                    'clientes' => []
                ], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => 'Clientes carregados com sucesso',
                    'clientes' => $clientes
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Erro ao listar clientes: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    public function apiBuscarClientes() {
        if (!isset($_GET['termo']) || trim($_GET['termo']) === '') {
            http_response_code(400);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Termo de busca não informado'
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        try {
            $termo = trim($_GET['termo']);
            $clientes = ClienteModel::buscarClientes($termo);

            if (empty($clientes)) {
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => 'Nenhum cliente encontrado',
                    'clientes' => []
                ], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => 'Clientes encontrados',
                    'clientes' => $clientes
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Erro ao buscar clientes: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    public function apiVerificarCliente($dados) {
        try {
            // Validação adicional no controller: e-mail deve ser válido (apenas se fornecido)
            if (!empty($dados['email']) && !filter_var($dados['email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => 'E-mail inválido'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // Sanitização adicional: trim em todos os campos de texto
            $dados['nome'] = trim($dados['nome']);
            $dados['telefone'] = !empty($dados['telefone']) ? trim($dados['telefone']) : null;
            $dados['email'] = !empty($dados['email']) ? trim($dados['email']) : null;
            $dados['endereco'] = !empty($dados['endereco']) ? trim($dados['endereco']) : null;
            $dados['nif'] = !empty($dados['nif']) ? trim($dados['nif']) : null;

            // Chama o model para verificar ou criar o cliente
            $resultado = ClienteModel::verificar_cliente($dados);

            if ($resultado['status'] === 'PODE PASSAR') {
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => 'Cliente verificado ou criado com sucesso',
                    'id_cliente' => $resultado['id_cliente']
                ], JSON_UNESCAPED_UNICODE);
            } else {
                // Caso o model retorne algo diferente (ex.: erro na inserção), tratar aqui
                http_response_code(500);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => $resultado['mensagem'] ?? 'Erro na verificação do cliente'
                ], JSON_UNESCAPED_UNICODE);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Erro ao verificar cliente: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * API: Busca o cliente padrão "Consumidor Final"
     * Retorna o ID e dados básicos do cliente padrão
     */
    public function apiBuscarConsumidorFinal() {
        try {
            // Chama o Model para buscar no banco
            $cliente = ClienteModel::buscarConsumidorFinal();
            
            if ($cliente === null) {
                // Cliente não encontrado - ERRO CRÍTICO
                http_response_code(404);
                echo json_encode([
                    'sucesso' => false,
                    'erro' => 'Cliente "Consumidor Final" não encontrado no banco de dados',
                    'mensagem_tecnica' => 'Verifique se existe um cliente cadastrado com nome "Consumidor Final"'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }
            
            // Sucesso - Retorna dados do cliente
            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Cliente padrão localizado com sucesso',
                'cliente' => [
                    'idcliente' => $cliente['idcliente'],
                    'nome' => $cliente['nome'],
                    'nif' => $cliente['nif'],
                    'email' => $cliente['email'],
                    'telefone' => $cliente['telefone'],
                    'morada' => $cliente['morada']
                ]
            ], JSON_UNESCAPED_UNICODE);
            
        } catch (Exception $e) {
            // Erro inesperado (ex: problema de conexão)
            http_response_code(500);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Erro ao buscar cliente padrão: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
        }
    }
}
?>