<?php
require_once __DIR__ . '/../Model/users_model.php';

class UserController {
    public function login() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $email = $_POST['email'] ?? '';
            $password = $_POST['password'] ?? '';

            $usuario = UserModel::buscarPorEmail($email);

            if ($usuario && password_verify($password, $usuario['senha'])) {
                session_start();
                $_SESSION['user_id'] = $usuario['id'];
                $_SESSION['user_name'] = $usuario['nome'];

                header("Location: ../pages/index.php");
                exit;
            } else {
                $erro = "E-mail ou senha inválidos!";
                header("Location: ../../pages/login.php?erro=" . urlencode($erro));
                exit;
            }
        }
    }

    public function logout() {
        session_start();
        session_destroy();
        header("Location: ../views/login.php");
        exit;
    }
}

// --- Roteamento simples --- //
if (isset($_GET['action'])) {
    $controller = new UserController();
    if ($_GET['action'] === 'login') {
        $controller->login();
    } elseif ($_GET['action'] === 'logout') {
        $controller->logout();
    }
}
