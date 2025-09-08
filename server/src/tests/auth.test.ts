import request from 'supertest';
import app from '../index';
import { prisma } from './setup';

describe('🔐 Authentication API Tests', () => {
  
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials from seed data', async () => {
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
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should login with Maria credentials', async () => {
      const loginData = {
        email: 'maria@example.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should login with Pedro credentials', async () => {
      const loginData = {
        email: 'pedro@example.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should fail with invalid credentials', async () => {
      const loginData = {
        email: 'joao@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`, // Email único
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

      // Cleanup - remove test user
      await prisma.user.delete({
        where: { email: userData.email }
      });
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'joao@example.com', // Email já existe
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });
});
