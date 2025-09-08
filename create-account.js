// Script para criar uma nova conta para testar o frontend
async function createTestAccount() {
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
    const token = loginData.token;
    
    // 2. Criar conta
    console.log('2. Criando conta de teste...');
    const createResponse = await fetch(`${API_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Conta Teste',
        type: 'CHECKING',
        balance: 1000
      })
    });
    
    const createData = await createResponse.json();
    console.log('Create response:', createData);
    
    if (createResponse.ok) {
      console.log('✅ Conta criada com sucesso!');
      console.log('ID da conta:', createData.data.id);
    } else {
      console.log('❌ Erro ao criar conta:', createData);
    }
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executar o teste
createTestAccount();
