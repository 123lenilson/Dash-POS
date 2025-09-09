<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login - Hélio Trading Lda</title>
  <link rel="stylesheet" href="../assets/css/login.css" />
</head>
<body>
  <div class="container">
    <!-- Lado esquerdo -->
    <div class="left">
      <img src="../assets/img/heilo_trading_lda.jpg" alt="Login">
    </div>

    <!-- Lado direito -->
    <div class="right">
      <div class="login-box">
        <h1>Bem-vindo de volta à Hélio Trading Lda</h1>
        <p>Acesse sua conta para continuar</p>
        
        <form id="loginForm" action="../app/Control/User_control.php?action=login" method="POST">
          <?php if (isset($_GET['erro'])): ?>
            <div class="error-message">
              <?php 
                if ($_GET['erro'] == 1) {
                  echo "Email ou senha incorretos.";
                } elseif ($_GET['erro'] == 2) {
                  echo "Preencha todos os campos.";
                }
              ?>
            </div>
          <?php endif; ?>
          <label>Email</label>
          <input type="email" name="email" placeholder="seuemail@exemplo.com" required>
          
          <label>Senha</label>
          <input type="password" name="password" placeholder="••••••••" required>
          
          <a href="#" class="forgot">Esqueceu sua senha?</a>
          
          <button type="submit">Entrar</button>
          
          <div class="divider">ou</div>
          
          <button type="button" class="google">
            <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google"> Continuar com Google
          </button>
        </form>

        
        <p class="signup">Não tem uma conta?<a href="#">Cadastre-se</a></p>
      </div>
    </div>
  </div>
  <script src="../assets/js/login.js"></script>
</body>
</html>
