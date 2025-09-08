// Script para testar o login e delete de conta
async function testAccountDelete() {
  const API_URL = 'http://localhost:3001/api';
  
  try {
    // 1. Fazer login
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'edwincosta@gmail.com',
        password: 'teste123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginResponse.ok) {
      throw new Error('Login failed: ' + JSON.stringify(loginData));
    }
    
    const token = loginData.token;
    console.log('Token obtido:', token ? 'Token exists' : 'No token');
    
    // 2. Listar contas
    console.log('2. Listando contas...');
    const accountsResponse = await fetch(`${API_URL}/accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const accountsData = await accountsResponse.json();
    console.log('Accounts response:', accountsData);
    
    if (accountsData.data && accountsData.data.length > 0) {
      const accountId = accountsData.data[0].id;
      console.log('Account ID para deletar:', accountId);
      
      // 3. Deletar conta
      console.log('3. Deletando conta...');
      const deleteResponse = await fetch(`${API_URL}/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const deleteData = await deleteResponse.json();
      console.log('Delete response status:', deleteResponse.status);
      console.log('Delete response:', deleteData);
      
      if (deleteResponse.ok) {
        console.log('✅ Conta deletada com sucesso!');
      } else {
        console.log('❌ Erro ao deletar conta:', deleteData);
      }
    } else {
      console.log('Nenhuma conta encontrada para deletar');
    }
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executar o teste
testAccountDelete();
