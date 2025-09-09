<?php
require_once __DIR__ . '/../config/conexao.php';

class UserModel {
    public static function buscarPorEmail($email) {
        $db = Conexao::getConexao();
        $email = $db->real_escape_string($email);

        $sql = "SELECT id, nome, email, password FROM users WHERE email = '$email' LIMIT 1";
        $result = $db->query($sql);

        if ($result && $result->num_rows > 0) {
            return $result->fetch_assoc();
        }
        return null;
    }
}
