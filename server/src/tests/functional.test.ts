import request from 'supertest';
import app from '../index';

// Helper para login e obter token
async function getAuthToken(email: string = 'joao@example.com', password: string = '123456') {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  
  return response.body.token;
}

// Testes funcionais usando dados reais do seed
describe('Budget API Integration Tests', () => {
  let token: string;

  beforeAll(async () => {
    // Obter token para testes
    token = await getAuthToken();
  });

  test('Authentication - Login with seed data', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'joao@example.com',
        password: '123456'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('joao@example.com');
  });

  test('Authentication - Login with Maria', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'maria@example.com',
        password: '123456'
      });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('maria@example.com');
  });

  test('Authentication - Login with Pedro', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'pedro@example.com',
        password: '123456'
      });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('pedro@example.com');
  });

  test('Budgets - Get user budgets', async () => {
    const response = await request(app)
      .get('/api/budgets')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('Accounts - Get user accounts', async () => {
    const response = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('Categories - Get user categories', async () => {
    const response = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('Transactions - Get user transactions', async () => {
    const response = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    // João deve ter 24 transações conforme seed
    expect(response.body.length).toBeGreaterThan(20);
  });

  test('Transactions - Get with filters', async () => {
    const response = await request(app)
      .get('/api/transactions?period=current_month')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('Transactions - Get summary', async () => {
    const response = await request(app)
      .get('/api/transactions/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('totalIncome');
    expect(response.body.data).toHaveProperty('totalExpenses');
  });

  test('Dashboard - Get statistics', async () => {
    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('totalBalance');
    expect(response.body.data).toHaveProperty('monthlyIncome');
    expect(response.body.data).toHaveProperty('monthlyExpenses');
  });

  test('Dashboard - Get chart data', async () => {
    const response = await request(app)
      .get('/api/dashboard/chart-data')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });

  test('Reports - Get basic report', async () => {
    const response = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });

  test('Reports - Get monthly report', async () => {
    const response = await request(app)
      .get('/api/reports?period=current_month')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });

  test('Error Handling - 401 without token', async () => {
    const response = await request(app)
      .get('/api/budgets');

    expect(response.status).toBe(401);
  });

  test('Error Handling - 404 invalid endpoint', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  test('CRUD - Create and delete transaction', async () => {
    // Primeiro, obter uma categoria e conta existente
    const categoriesResponse = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    
    const accountsResponse = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${token}`);

    if (categoriesResponse.body.length > 0 && accountsResponse.body.length > 0) {
      const categoryId = categoriesResponse.body[0].id;
      const accountId = accountsResponse.body[0].id;

      // Criar transação
      const createResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Test Transaction',
          amount: -50.00,
          type: 'EXPENSE',
          date: new Date().toISOString(),
          categoryId,
          accountId
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body).toHaveProperty('id');

      const transactionId = createResponse.body.id;

      // Deletar transação
      const deleteResponse = await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteResponse.status).toBe(204);
    }
  });

  test('Multi-user data validation', async () => {
    // Testar dados de cada usuário
    const users = [
      { email: 'joao@example.com', expectedTransactions: 20 },
      { email: 'maria@example.com', expectedTransactions: 5 },
      { email: 'pedro@example.com', expectedTransactions: 5 }
    ];

    for (const user of users) {
      const userToken = await getAuthToken(user.email);
      
      const transactionsResponse = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(transactionsResponse.status).toBe(200);
      expect(transactionsResponse.body.length).toBeGreaterThan(0);

      const dashResponse = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(dashResponse.status).toBe(200);
      expect(dashResponse.body.data).toHaveProperty('totalBalance');
      expect(typeof dashResponse.body.data.totalBalance).toBe('number');
    }
  });
});
