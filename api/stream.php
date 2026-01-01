<?php
/**
 * SSE (Server-Sent Events) Stream
 * Endpoint para comunicação em tempo real com o frontend
 * Substitui o polling de 500ms por uma conexão persistente
 */

// Desabilita output buffering para enviar dados imediatamente
if (ob_get_level()) ob_end_clean();

// Headers SSE obrigatórios
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no'); // Nginx

// Previne timeout
set_time_limit(0);
ini_set('max_execution_time', 0);

// Inclui a conexão com o banco
require_once __DIR__ . '/../app/config/conexao.php';

/**
 * Função para enviar evento SSE
 */
function sendSSE($event, $data) {
    echo "event: {$event}\n";
    echo "data: " . json_encode($data) . "\n\n";
    
    if (ob_get_level() > 0) {
        ob_flush();
    }
    flush();
}

/**
 * Função para obter hash dos produtos (detectar mudanças)
 * Usa MAX(IDPRODUTO) + COUNT(*) já que não há created_at/updated_at
 */
function getProdutosHash() {
    try {
        $db = Conexao::getConexao();
        
        // Detecta mudanças via último ID + total de produtos
        $sql = "SELECT 
                    IFNULL(MAX(IDPRODUTO), 0) as max_id,
                    COUNT(*) as total
                FROM produto";
        
        $result = $db->query($sql);
        
        if ($result && $row = $result->fetch_assoc()) {
            // Hash combina último ID + total (detecta INSERT/DELETE)
            return md5($row['max_id'] . '_' . $row['total']);
        }
        
        return null;
    } catch (Exception $e) {
        error_log("Erro getProdutosHash: " . $e->getMessage());
        return null;
    }
}

/**
 * Função para obter hash do pedido do usuário (detectar mudanças)
 * Usa MAX(idpedido) + SUM(qtd) + COUNT(*) para detectar qualquer mudança
 */
function getPedidoHash($usuario = 1) {
    try {
        $db = Conexao::getConexao();
        
        // Detecta mudanças via último ID + soma de quantidade + total de itens
        $sql = "SELECT 
                    IFNULL(MAX(idpedido), 0) as max_id,
                    IFNULL(SUM(CAST(qtd AS DECIMAL(10,2))), 0) as total_qty,
                    COUNT(*) as total_itens
                FROM pedido 
                WHERE usuario = ?";
        
        $stmt = $db->prepare($sql);
        $stmt->bind_param("i", $usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $row = $result->fetch_assoc()) {
            // Hash combina max_id + total_qty + total_itens
            // Detecta INSERT, UPDATE e DELETE
            return md5($row['max_id'] . '_' . $row['total_qty'] . '_' . $row['total_itens']);
        }
        
        return null;
    } catch (Exception $e) {
        error_log("Erro getPedidoHash: " . $e->getMessage());
        return null;
    }
}

// Variáveis para controle de mudanças
$lastProdutosHash = null;
$lastPedidoHash = null;
$heartbeatInterval = 15; // Heartbeat a cada 15 segundos
$lastHeartbeat = time();

// Envia evento inicial de conexão
sendSSE('connected', [
    'message' => 'SSE stream conectado',
    'timestamp' => date('Y-m-d H:i:s')
]);

// Loop infinito - mantém conexão aberta
while (true) {
    // Verifica se o cliente ainda está conectado
    if (connection_aborted()) {
        error_log("SSE: Cliente desconectou");
        break;
    }
    
    // 1. VERIFICA MUDANÇAS NOS PRODUTOS
    $currentProdutosHash = getProdutosHash();
    
    if ($currentProdutosHash !== null && $currentProdutosHash !== $lastProdutosHash) {
        if ($lastProdutosHash !== null) {
            // Mudança detectada! Envia evento
            sendSSE('produtos_updated', [
                'message' => 'Produtos foram atualizados',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
            error_log("SSE: Produtos atualizados - Hash: {$currentProdutosHash}");
        }
        
        $lastProdutosHash = $currentProdutosHash;
    }
    
    // 2. VERIFICA MUDANÇAS NO PEDIDO
    $currentPedidoHash = getPedidoHash(1); // Usuario hardcoded por enquanto
    
    if ($currentPedidoHash !== null && $currentPedidoHash !== $lastPedidoHash) {
        if ($lastPedidoHash !== null) {
            // Mudança detectada! Envia evento
            sendSSE('pedido_updated', [
                'message' => 'Carrinho foi atualizado',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
            error_log("SSE: Pedido atualizado - Hash: {$currentPedidoHash}");
        }
        
        $lastPedidoHash = $currentPedidoHash;
    }
    
    // 3. HEARTBEAT (mantém conexão viva)
    $now = time();
    if (($now - $lastHeartbeat) >= $heartbeatInterval) {
        sendSSE('heartbeat', [
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
        $lastHeartbeat = $now;
    }
    
    // Aguarda 1 segundo antes de verificar novamente
    // (muito mais eficiente que 500ms do polling!)
    sleep(1);
}

// Cleanup ao desconectar
error_log("SSE: Stream encerrado");
?>
