console.log('🚀 Starting Complete Budget Server with TS-NODE...');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

console.log('✅ Core imports loaded successfully');

// Routes funcionais com nova arquitetura
import authRoutes from './routes/auth';
import budgetRoutes from './routes/budgets';
import sharingRoutes from './routes/sharing';

// Adapted legacy routes for budget-centric architecture
import accountsRoutes from './routes/accounts';
import categoriesRoutes from './routes/categories';
import transactionsRoutes from './routes/transactions';
import dashboardRoutes from './routes/dashboard';
import reportsRoutes from './routes/reports';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

console.log('✅ All imports loaded successfully');

dotenv.config();
console.log('✅ Environment variables loaded');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

console.log('✅ Express app and Prisma client created');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

console.log('✅ Complete middleware configured');

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('📋 Health check requested');
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    runtime: 'ts-node',
    message: 'Complete Budget Server with TS-NODE working!'
  });
});

// Test endpoint para verificar se a nova arquitetura está funcionando
app.get('/api/test', async (req, res) => {
  console.log('🧪 API test endpoint requested');
  try {
    const users = await prisma.user.count();
    const budgets = await prisma.budget.count();
    const shares = await prisma.budgetShare.count();
    const accounts = await prisma.account.count();
    const categories = await prisma.category.count();
    const transactions = await prisma.transaction.count();
    
    res.json({
      message: 'Complete budget architecture working with TS-NODE!',
      database: { users, budgets, shares, accounts, categories, transactions },
      timestamp: new Date().toISOString(),
      runtime: 'ts-node',
      routes: [
        'GET /api/auth/* (authentication)',
        'GET /api/budgets/* (budget management)', 
        'GET /api/sharing/* (budget sharing)',
        'GET /api/accounts (default budget)',
        'GET /api/categories (default budget)', 
        'GET /api/transactions (default budget)',
        'GET /api/dashboard/stats (default budget)',
        'GET /api/reports (default budget)'
      ]
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

console.log('✅ Health and test endpoints configured');

// API Routes - Nova arquitetura baseada em orçamentos
app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/sharing', sharingRoutes);

// Legacy routes adapted for budget-centric architecture (use default budget)
app.use('/api/accounts', accountsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);

console.log('✅ All API routes registered successfully');
console.log('📋 Available API endpoints:');
console.log('   🔐 Auth: /api/auth/*');
console.log('   📊 Budgets: /api/budgets/* (full budget management)');
console.log('   🤝 Sharing: /api/sharing/* (budget sharing)');
console.log('   💳 Accounts: /api/accounts (default budget context)');
console.log('   🏷️  Categories: /api/categories (default budget context)');
console.log('   💰 Transactions: /api/transactions (default budget context)');
console.log('   📈 Dashboard: /api/dashboard/* (default budget context)');
console.log('   📄 Reports: /api/reports (default budget context)');

// Error handling
app.use(notFound);
app.use(errorHandler);

console.log('✅ Error handlers configured');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Export app for testing
export default app;

// Start server only if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Complete Budget Server with TS-NODE running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🎉 OPÇÃO C3 - Complete TS-NODE Budget System funcionando!`);
    console.log(`💻 Complete budget application ready!`);
  });
}

console.log('✅ Server initialization complete');
