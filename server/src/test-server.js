const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const users = await prisma.user.count();
    const budgets = await prisma.budget.count();
    const shares = await prisma.budgetShare.count();
    
    res.json({
      message: 'API funcionando!',
      database: {
        users,
        budgets,
        shares
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📋 Teste: http://localhost:${PORT}/api/test`);
});

module.exports = app;
