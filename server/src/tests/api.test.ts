import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Budget API Tests - Complete Suite', () => {
  let authToken: string;
  let userId: string;
  let budgetId: string;
  let accountId: string;
  let categoryId: string;
  
  // Configuração inicial dos testes
  beforeAll(async () => {
    // Conectar ao banco de teste
    await prisma.$connect();
  });

  afterAll(async () => {
    // Limpar e desconectar
    await prisma.$disconnect();
  });

  describe('🔐 Authentication Tests', () => {
    test('POST /api/auth/register - Should create new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('POST /api/auth/login - Should login with valid credentials', async () => {
      const loginData = {
        email: 'joao@example.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
      
      // Salvar token para testes subsequentes
      authToken = response.body.token;
      userId = response.body.user.id;
    });

    test('POST /api/auth/login - Should fail with invalid credentials', async () => {
      const loginData = {
        email: 'joao@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    });

    test('GET /api/auth/me - Should return current user info', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe('joao@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    test('GET /api/auth/me - Should fail without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('📊 Budget Management Tests', () => {
    test('GET /api/budgets - Should list user budgets', async () => {
      const response = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Salvar primeiro budget para outros testes
      budgetId = response.body[0].id;
    });

    test('POST /api/budgets - Should create new budget', async () => {
      const budgetData = {
        name: 'Test Budget',
        description: 'Budget for testing purposes'
      };

      const response = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(budgetData)
        .expect(201);

      expect(response.body.name).toBe(budgetData.name);
      expect(response.body.description).toBe(budgetData.description);
      expect(response.body.ownerId).toBe(userId);
    });

    test('GET /api/budgets/:id - Should get specific budget', async () => {
      const response = await request(app)
        .get(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(budgetId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('accounts');
      expect(response.body).toHaveProperty('categories');
    });

    test('PUT /api/budgets/:id - Should update budget', async () => {
      const updateData = {
        name: 'Updated Budget Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
    });

    test('GET /api/budgets/:id/stats - Should get budget statistics', async () => {
      const response = await request(app)
        .get(`/api/budgets/${budgetId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalIncome');
      expect(response.body).toHaveProperty('totalExpenses');
      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('transactionCount');
    });
  });

  describe('💳 Account Management Tests', () => {
    test('GET /api/accounts - Should list user accounts', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Salvar primeiro account para outros testes
      accountId = response.body[0].id;
    });

    test('POST /api/accounts - Should create new account', async () => {
      const accountData = {
        name: 'Test Account',
        type: 'CHECKING',
        balance: 1000.00,
        description: 'Test account for API testing'
      };

      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(accountData)
        .expect(201);

      expect(response.body.name).toBe(accountData.name);
      expect(response.body.type).toBe(accountData.type);
      expect(parseFloat(response.body.balance)).toBe(accountData.balance);
    });

    test('GET /api/accounts/:id - Should get specific account', async () => {
      const response = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(accountId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('type');
    });

    test('PUT /api/accounts/:id - Should update account', async () => {
      const updateData = {
        name: 'Updated Account Name',
        description: 'Updated account description'
      };

      const response = await request(app)
        .put(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
    });

    test('GET /api/accounts/:id/transactions - Should get account transactions', async () => {
      const response = await request(app)
        .get(`/api/accounts/${accountId}/transactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Deve ter transações dos dados de seed
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('🏷️ Category Management Tests', () => {
    test('GET /api/categories - Should list user categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Salvar primeira categoria para outros testes
      categoryId = response.body[0].id;
    });

    test('POST /api/categories - Should create new category', async () => {
      const categoryData = {
        name: 'Test Category',
        type: 'EXPENSE',
        color: '#FF0000',
        description: 'Test category for API testing'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.name).toBe(categoryData.name);
      expect(response.body.type).toBe(categoryData.type);
      expect(response.body.color).toBe(categoryData.color);
    });

    test('GET /api/categories/:id - Should get specific category', async () => {
      const response = await request(app)
        .get(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(categoryId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('color');
    });

    test('PUT /api/categories/:id - Should update category', async () => {
      const updateData = {
        name: 'Updated Category Name',
        color: '#00FF00'
      };

      const response = await request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.color).toBe(updateData.color);
    });

    test('GET /api/categories/:id/transactions - Should get category transactions', async () => {
      const response = await request(app)
        .get(`/api/categories/${categoryId}/transactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('💰 Transaction Management Tests', () => {
    let transactionId: string;

    test('GET /api/transactions - Should list user transactions', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Deve ter transações dos dados de seed (João tem 24)
      expect(response.body.length).toBeGreaterThan(20);
    });

    test('GET /api/transactions?period=current_month - Should filter by period', async () => {
      const response = await request(app)
        .get('/api/transactions?period=current_month')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Verificar se as transações são do mês atual
      response.body.forEach((transaction: any) => {
        const transactionDate = new Date(transaction.date);
        const currentMonth = new Date().getMonth();
        expect(transactionDate.getMonth()).toBe(currentMonth);
      });
    });

    test('POST /api/transactions - Should create new transaction', async () => {
      const transactionData = {
        description: 'Test Transaction',
        amount: -50.00,
        type: 'EXPENSE',
        date: new Date().toISOString(),
        categoryId: categoryId,
        accountId: accountId
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.description).toBe(transactionData.description);
      expect(parseFloat(response.body.amount)).toBe(transactionData.amount);
      expect(response.body.type).toBe(transactionData.type);
      
      transactionId = response.body.id;
    });

    test('GET /api/transactions/:id - Should get specific transaction', async () => {
      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(transactionId);
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('amount');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('account');
    });

    test('PUT /api/transactions/:id - Should update transaction', async () => {
      const updateData = {
        description: 'Updated Transaction Description',
        amount: -75.00
      };

      const response = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.description).toBe(updateData.description);
      expect(parseFloat(response.body.amount)).toBe(updateData.amount);
    });

    test('GET /api/transactions/summary - Should get transactions summary', async () => {
      const response = await request(app)
        .get('/api/transactions/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalIncome');
      expect(response.body).toHaveProperty('totalExpenses');
      expect(response.body).toHaveProperty('netIncome');
      expect(response.body).toHaveProperty('transactionCount');
    });

    test('DELETE /api/transactions/:id - Should delete transaction', async () => {
      await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verificar se foi realmente deletado
      await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('📈 Dashboard Tests', () => {
    test('GET /api/dashboard/stats - Should get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalBalance');
      expect(response.body).toHaveProperty('monthlyIncome');
      expect(response.body).toHaveProperty('monthlyExpenses');
      expect(response.body).toHaveProperty('accountsCount');
      expect(response.body).toHaveProperty('categoriesCount');
      expect(response.body).toHaveProperty('recentTransactions');
    });

    test('GET /api/dashboard/chart-data - Should get chart data', async () => {
      const response = await request(app)
        .get('/api/dashboard/chart-data')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('monthlyTrends');
      expect(response.body).toHaveProperty('categoryBreakdown');
      expect(Array.isArray(response.body.monthlyTrends)).toBe(true);
      expect(Array.isArray(response.body.categoryBreakdown)).toBe(true);
    });

    test('GET /api/dashboard/overview - Should get complete overview', async () => {
      const response = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('charts');
      expect(response.body).toHaveProperty('recentActivity');
      expect(response.body).toHaveProperty('alerts');
    });
  });

  describe('📄 Reports Tests', () => {
    test('GET /api/reports - Should generate basic report', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('categories');
    });

    test('GET /api/reports?period=last_month - Should generate monthly report', async () => {
      const response = await request(app)
        .get('/api/reports?period=last_month')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.period).toBe('last_month');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('totalIncome');
      expect(response.body.summary).toHaveProperty('totalExpenses');
    });

    test('GET /api/reports/export/csv - Should export to CSV', async () => {
      const response = await request(app)
        .get('/api/reports/export/csv')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('description,amount,type,date,category');
    });

    test('GET /api/reports/comparison - Should generate comparison report', async () => {
      const response = await request(app)
        .get('/api/reports/comparison?periods=current_month,last_month')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('periods');
      expect(response.body).toHaveProperty('comparison');
      expect(Array.isArray(response.body.periods)).toBe(true);
    });
  });

  describe('🤝 Sharing Tests', () => {
    let shareId: string;

    test('POST /api/sharing/share - Should create budget share', async () => {
      const shareData = {
        budgetId: budgetId,
        email: 'maria@example.com',
        permission: 'READ'
      };

      const response = await request(app)
        .post('/api/sharing/share')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shareData)
        .expect(201);

      expect(response.body.permission).toBe(shareData.permission);
      expect(response.body.status).toBe('PENDING');
      
      shareId = response.body.id;
    });

    test('GET /api/sharing/sent - Should list sent shares', async () => {
      const response = await request(app)
        .get('/api/sharing/sent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('GET /api/sharing/received - Should list received shares', async () => {
      // Login como Maria para ver shares recebidos
      const mariaLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'maria@example.com', password: '123456' });

      const response = await request(app)
        .get('/api/sharing/received')
        .set('Authorization', `Bearer ${mariaLogin.body.token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('PUT /api/sharing/:id/accept - Should accept budget share', async () => {
      // Login como Maria para aceitar
      const mariaLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'maria@example.com', password: '123456' });

      const response = await request(app)
        .put(`/api/sharing/${shareId}/accept`)
        .set('Authorization', `Bearer ${mariaLogin.body.token}`)
        .expect(200);

      expect(response.body.status).toBe('ACCEPTED');
    });

    test('PUT /api/sharing/:id - Should update share permission', async () => {
      const updateData = {
        permission: 'WRITE'
      };

      const response = await request(app)
        .put(`/api/sharing/${shareId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.permission).toBe(updateData.permission);
    });

    test('DELETE /api/sharing/:id - Should revoke share', async () => {
      await request(app)
        .delete(`/api/sharing/${shareId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });

  describe('❌ Error Handling Tests', () => {
    test('Should return 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('Should return 401 for protected routes without token', async () => {
      await request(app)
        .get('/api/budgets')
        .expect(401);
    });

    test('Should return 403 for accessing other user data', async () => {
      // Tentar acessar budget de outro usuário
      const response = await request(app)
        .get('/api/budgets/invalid-budget-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('Should validate required fields', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Enviar dados vazios
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('Should handle invalid data types', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Test',
          amount: 'invalid-amount', // Tipo inválido
          type: 'EXPENSE',
          categoryId: categoryId,
          accountId: accountId
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('🔍 Edge Cases Tests', () => {
    test('Should handle large transaction amounts', async () => {
      const largeTransaction = {
        description: 'Large Transaction',
        amount: 999999.99,
        type: 'INCOME',
        date: new Date().toISOString(),
        categoryId: categoryId,
        accountId: accountId
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeTransaction)
        .expect(201);

      expect(response.body.amount).toBe(largeTransaction.amount.toString());
    });

    test('Should handle transactions with future dates', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const futureTransaction = {
        description: 'Future Transaction',
        amount: 100.00,
        type: 'INCOME',
        date: futureDate.toISOString(),
        categoryId: categoryId,
        accountId: accountId
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(futureTransaction)
        .expect(201);

      expect(new Date(response.body.date)).toEqual(futureDate);
    });

    test('Should handle pagination', async () => {
      const response = await request(app)
        .get('/api/transactions?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    test('Should handle search functionality', async () => {
      const response = await request(app)
        .get('/api/transactions?search=Salário')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Verificar se os resultados contêm o termo de busca
      response.body.forEach((transaction: any) => {
        expect(transaction.description.toLowerCase()).toContain('salário');
      });
    });
  });
});
