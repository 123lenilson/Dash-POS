const form = document.getElementById('loginForm');
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  alert(`Tentando login com: ${email} / ${password}`);
});


