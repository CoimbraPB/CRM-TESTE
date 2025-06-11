function checkAuth() {
  console.log('Checking auth');
  const token = localStorage.getItem('token');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  console.log('Token:', token ? 'Present' : 'Missing', 'Current page:', currentPage);
  if (!token && currentPage !== 'login.html') {
    const redirectUrl = window.location.href;
    console.log('Redirecting to login with:', redirectUrl);
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
  }
}

document.addEventListener('DOMContentLoaded', checkAuth);