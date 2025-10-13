import { PrismaClient } from '@prisma/client';

// Import Jest globals
import 'jest';

// Mock problematic modules before any imports
jest.mock('pdf-parse');
jest.mock('pdfjs-dist/legacy/build/pdf.mjs');

// Setup environment variables for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_github_actions_pipeline';
process.env.NODE_ENV = 'test';

// Global test environment setup
declare global {
  var prisma: PrismaClient;
}

// Create a single prisma instance for tests
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/budget'
    }
  }
});

// Make prisma available globally
global.prisma = prisma;

beforeAll(async () => {
  try {
    await prisma.$connect();
    console.log('🔗 Connected to test database');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
    console.log('🔗 Disconnected from test database');
  } catch (error) {
    console.error('❌ Failed to disconnect from test database:', error);
  }
});

// Export for use in tests
export { prisma };
