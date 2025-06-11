function showErrorToast(message) {
  const toast = document.getElementById('errorToast');
  const toastMessage = document.getElementById('errorToastMessage');
  if (toast && toastMessage) {
    toastMessage.textContent = message;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  } else {
    console.error('Toast elements not found:', { toast, toastMessage });
    alert(message);
  }
}

function login(event) {
  event.preventDefault();
  console.log('Login function called');

  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');

  if (!emailInput || !senhaInput) {
    console.error('Form elements not found:', { emailInput, senhaInput });
    showErrorToast('Erro: Campos de email ou senha não encontrados.');
    return;
  }

  const email = emailInput.value.trim();
  const senha = senhaInput.value.trim();

  if (!email || !senha) {
    showErrorToast('Por favor, preencha email e senha.');
    return;
  }

  console.log('Attempting login with:', { email, senha: '****' });

  fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  })
    .then(response => {
      console.log('Login response:', response.status);
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.error || `HTTP error - Status: ${response.status}`);
        });
      }
      return response.json();
    })
    .then(result => {
      console.log('Login result:', result);
      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('permissao', result.permissao);

        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || 'index.html';
        console.log('Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      } else {
        showErrorToast(result.error || 'Erro ao autenticar');
      }
    })
    .catch(error => {
      console.error('Erro ao fazer login:', error);
      showErrorToast(error.message || 'Erro ao autenticar');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded - Initializing login form');
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', login);
    console.log('Login form found and event listener attached');
  } else {
    console.error('Login form not found (#loginForm)');
    showErrorToast('Erro: Formulário de login não encontrado.');
  }
});