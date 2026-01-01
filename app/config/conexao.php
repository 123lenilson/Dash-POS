<?php
class Conexao {
    private static $host = "localhost";   // ou 127.0.0.1
    private static $user = "root";        // usuário do MySQL
    private static $pass = "";            // senha do MySQL
    private static $db   = "wenkamba";   // nome do banco de dados
    private static $conn = null;

    public static function getConexao() {
        if (self::$conn === null) {
            self::$conn = new mysqli(self::$host, self::$user, self::$pass, self::$db);

            if (self::$conn->connect_error) {
                die("Erro de conexão: " . self::$conn->connect_error);
            }

            // charset para suportar acentos
            self::$conn->set_charset("utf8mb4");
        }
        return self::$conn;
    }
}
