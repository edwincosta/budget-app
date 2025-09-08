import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

console.log('🚀 Starting TS-NODE Test Server...');

dotenv.config();
console.log('✅ Environment loaded');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(express.json());

console.log('✅ Express configured');

app.get('/health', (req, res) => {
  console.log('📋 Health check requested');
  res.json({ 
    status: 'OK',
    message: 'TS-NODE Server working!',
    timestamp: new Date().toISOString(),
    runtime: 'ts-node'
  });
});

app.get('/api/test', async (req, res) => {
  console.log('🧪 Test endpoint requested');
  try {
    const result = await prisma.user.count();
    res.json({
      message: 'TS-NODE + Prisma working!',
      userCount: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

console.log('✅ Routes configured');

app.listen(PORT, () => {
  console.log(`🚀 TS-NODE Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
});

console.log('✅ Server startup complete');
