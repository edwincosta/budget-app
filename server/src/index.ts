console.log('🚀 Starting Complete Budget Server...');
console.log('📦 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('🔢 Node version:', process.version);

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
import importRoutes from './routes/import';

// Middleware
import { errorHandler } from './middleware/errorHandler';

// Seed function for development
import { seedDatabase } from './utils/seed';

console.log('✅ All imports loaded successfully');

dotenv.config();
console.log('✅ Environment variables loaded');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

console.log('✅ Express app and Prisma client created');

// Rate limiting (mais restritivo para produção)
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : (process.env.NODE_ENV === 'production' ? 100 : 1000),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
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

// Health check endpoint - basic (always available)
app.get('/health', (req, res) => {
  console.log('📋 Health check requested');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    runtime: process.env.NODE_ENV === 'production' ? 'node' : 'ts-node',
    version: '1.0.0',
    message: 'Budget Server is running!'
  });
});

// Health check with database - detailed
app.get('/health/detailed', async (req, res) => {
  console.log('📋 Detailed health check requested');
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      runtime: process.env.NODE_ENV === 'production' ? 'node' : 'ts-node',
      database: 'connected',
      version: '1.0.0',
      message: 'Complete Budget Server working with database!'
    });
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: process.env.NODE_ENV === 'production' ? 'Database unavailable' : String(error),
      message: 'Server running but database unhealthy'
    });
  }
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
app.use('/api/import', importRoutes);

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
console.log('   📥 Import: /api/import/* (file import system)');

// No static file serving - client is deployed separately
// The client is deployed as a static site on Render
// Server only provides API endpoints

// Catch-all for non-API routes - inform about separate deployments
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    res.status(404).json({
      error: 'This is an API server only',
      message: 'The frontend is deployed separately at https://budget-app-docker-client.onrender.com',
      availableRoutes: ['/api/auth', '/api/budgets', '/api/accounts', '/api/transactions', '/health']
    });
  }
});

// Error handling
app.use(errorHandler);

console.log('✅ Error handlers configured');

// Export app for testing
export default app;

// Start server only if this file is run directly
if (require.main === module) {
  const startServer = async () => {
    try {
      console.log('🔍 Testing database connection...');

      // Test database connection
      await prisma.$connect();
      console.log('✅ Database connected successfully');

      // Start server
      const server = app.listen(PORT, () => {
        console.log(`🚀 Complete Budget Server running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
        console.log(`🎉 Complete Budget System ready!`);
        console.log(`💻 Server successfully started!`);
      });

      // Handle server errors
      server.on('error', (error) => {
        console.error('❌ Server error:', error);
        process.exit(1);
      });

      // Graceful shutdown
      let isShuttingDown = false;
      const shutdown = async (signal: string) => {
        if (isShuttingDown) {
          console.log(`⚠️ Already shutting down, ignoring ${signal}...`);
          return;
        }

        isShuttingDown = true;
        console.log(`🛑 ${signal} received, shutting down gracefully...`);

        try {
          await prisma.$disconnect();
          console.log('✅ Database disconnected');

          server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
          });

          // Force exit after 10 seconds if server doesn't close gracefully
          setTimeout(() => {
            console.log('⚠️ Force closing server after timeout');
            process.exit(1);
          }, 10000);

        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));

      // Run seed in development mode after server starts
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        console.log('🌱 Running development seed...');
        try {
          await seedDatabase();
        } catch (error) {
          console.error('❌ Seed failed:', error);
        }
      }

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      console.error('💡 Check if DATABASE_URL is set correctly');
      process.exit(1);
    }
  };

  startServer();
}

console.log('✅ Server initialization complete');
