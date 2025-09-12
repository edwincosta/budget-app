// Script para definir cookies de autenticação e testar a página de importação
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZmIxejlmYzAwMDBkbTgwdmxodGt1cjkiLCJpYXQiOjE3NTc2MjIyMjN9.U3jTaxVf1YEiD8DxU8YDc_yBaak94tCK3U1cND4Z9p4';
const userData = {
    "id": "cmfb1z9fc0000dm80vlhtkur9",
    "name": "João Silva",
    "email": "joao@example.com",
    "createdAt": "2025-09-08T11:45:31.132Z",
    "updatedAt": "2025-09-08T11:45:31.132Z"
};

// Definir cookies
document.cookie = `auth_token=${token}; path=/; max-age=2592000`; // 30 dias
document.cookie = `user_data=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=2592000`;

// Também definir no localStorage para compatibilidade
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(userData));

console.log('✅ Cookies de autenticação definidos!');
console.log('🔄 Recarregue a página para aplicar o login.');

// Recarregar a página após 1 segundo
setTimeout(() => {
    window.location.reload();
}, 1000);
