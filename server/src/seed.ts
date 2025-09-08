import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database with initial data...');

  // Create users
  const hashedPassword = await bcrypt.hash('123456', 12);
  
  const user1 = await prisma.user.create({
    data: {
      email: 'joao@example.com',
      name: 'João Silva',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'maria@example.com', 
      name: 'Maria Santos',
      password: hashedPassword,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'pedro@example.com',
      name: 'Pedro Costa',
      password: hashedPassword,
    },
  });

  console.log('✅ Users created');

  // Create budgets for each user
  const budget1 = await prisma.budget.create({
    data: {
      name: 'Orçamento Familiar - João',
      description: 'Orçamento principal da família Silva',
      ownerId: user1.id,
    },
  });

  const budget2 = await prisma.budget.create({
    data: {
      name: 'Orçamento Pessoal - Maria',
      description: 'Controle financeiro pessoal da Maria',
      ownerId: user2.id,
    },
  });

  const budget3 = await prisma.budget.create({
    data: {
      name: 'Startup Budget - Pedro',
      description: 'Orçamento da startup do Pedro',
      ownerId: user3.id,
    },
  });

  console.log('✅ Budgets created');

  // Set default budgets for users
  await prisma.user.update({
    where: { id: user1.id },
    data: { defaultBudgetId: budget1.id },
  });

  await prisma.user.update({
    where: { id: user2.id },
    data: { defaultBudgetId: budget2.id },
  });

  await prisma.user.update({
    where: { id: user3.id },
    data: { defaultBudgetId: budget3.id },
  });

  console.log('✅ Default budgets set');

  // Create some categories for each budget
  const categoriesJoao = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Salário',
        type: 'INCOME',
        color: '#4ECDC4',
        budgetId: budget1.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Moradia',
        type: 'EXPENSE',
        color: '#FF6B6B',
        budgetId: budget1.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Alimentação',
        type: 'EXPENSE',
        color: '#FFA07A',
        budgetId: budget1.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Transporte',
        type: 'EXPENSE',
        color: '#45B7D1',
        budgetId: budget1.id,
      },
    }),
  ]);

  const categoriesMaria = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Freelance',
        type: 'INCOME',
        color: '#96CEB4',
        budgetId: budget2.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Educação',
        type: 'EXPENSE',
        color: '#FECA57',
        budgetId: budget2.id,
      },
    }),
  ]);

  const categoriesPedro = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Receitas Empresa',
        type: 'INCOME',
        color: '#98D8C8',
        budgetId: budget3.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Operacional',
        type: 'EXPENSE',
        color: '#F7DC6F',
        budgetId: budget3.id,
      },
    }),
  ]);

  console.log('✅ Categories created');

  // Create some accounts for each budget
  await prisma.account.create({
    data: {
      name: 'Conta Corrente Família',
      type: 'CHECKING',
      balance: 5000.00,
      description: 'Conta principal da família',
      budgetId: budget1.id,
    },
  });

  await prisma.account.create({
    data: {
      name: 'Poupança Maria',
      type: 'SAVINGS',
      balance: 15000.00,
      description: 'Reserva de emergência',
      budgetId: budget2.id,
    },
  });

  await prisma.account.create({
    data: {
      name: 'Conta Empresarial',
      type: 'CHECKING',
      balance: 25000.00,
      description: 'Conta da startup',
      budgetId: budget3.id,
    },
  });

  console.log('✅ Accounts created');

  // Get accounts and categories for transactions
  const accountJoao = await prisma.account.findFirst({
    where: { budgetId: budget1.id, name: 'Conta Corrente Família' }
  });

  const accountMaria = await prisma.account.findFirst({
    where: { budgetId: budget2.id, name: 'Poupança Maria' }
  });

  const accountPedro = await prisma.account.findFirst({
    where: { budgetId: budget3.id, name: 'Conta Empresarial' }
  });

  console.log('🔄 Creating transactions for the last 2 months...');

  // Generate transactions for the last 2 months
  const today = new Date();
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(today.getMonth() - 2);

  // Transações para João (Orçamento Familiar) - Mês 1
  const month1Start = new Date();
  month1Start.setMonth(today.getMonth() - 1);
  month1Start.setDate(1);

  const joaoTransactionsMonth1 = [
    // Receitas
    { description: 'Salário Setembro', amount: 4500.00, type: 'INCOME' as const, categoryId: categoriesJoao[0].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 5) },
    { description: 'Freelance Design', amount: 800.00, type: 'INCOME' as const, categoryId: categoriesJoao[0].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 15) },
    
    // Despesas
    { description: 'Aluguel Apartamento', amount: -1200.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[1].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 1) },
    { description: 'Supermercado Extra', amount: -350.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[2].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 3) },
    { description: 'Gasolina', amount: -180.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[3].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 7) },
    { description: 'Conta de Luz', amount: -120.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[1].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 10) },
    { description: 'Internet/TV', amount: -89.90, type: 'EXPENSE' as const, categoryId: categoriesJoao[1].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 12) },
    { description: 'Farmácia São João', amount: -45.50, type: 'EXPENSE' as const, categoryId: categoriesJoao[2].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 14) },
    { description: 'Uber Centro', amount: -25.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[3].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 16) },
    { description: 'Mercado do Bairro', amount: -180.75, type: 'EXPENSE' as const, categoryId: categoriesJoao[2].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 18) },
    { description: 'Combustível', amount: -160.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[3].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 22) },
    { description: 'Restaurante Italiano', amount: -85.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[2].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 25) },
  ];

  // Transações para João - Mês 2 (atual)
  const month2Start = new Date();
  month2Start.setDate(1);

  const joaoTransactionsMonth2 = [
    // Receitas
    { description: 'Salário Outubro', amount: 4500.00, type: 'INCOME' as const, categoryId: categoriesJoao[0].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 5) },
    { description: 'Consultoria TI', amount: 1200.00, type: 'INCOME' as const, categoryId: categoriesJoao[0].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 12) },
    
    // Despesas
    { description: 'Aluguel Apartamento', amount: -1200.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[1].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 1) },
    { description: 'Supermercado Central', amount: -420.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[2].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 4) },
    { description: 'Posto Shell', amount: -175.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[3].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 6) },
    { description: 'Conta de Água', amount: -85.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[1].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 8) },
    { description: 'Streaming Netflix', amount: -29.90, type: 'EXPENSE' as const, categoryId: categoriesJoao[1].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 10) },
    { description: 'Drogaria Pacheco', amount: -67.30, type: 'EXPENSE' as const, categoryId: categoriesJoao[2].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 13) },
    { description: 'Taxi Aeroporto', amount: -45.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[3].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 15) },
    { description: 'Feira Orgânica', amount: -95.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[2].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 17) },
    { description: 'Manutenção Carro', amount: -280.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[3].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 20) },
    { description: 'Jantar Aniversário', amount: -150.00, type: 'EXPENSE' as const, categoryId: categoriesJoao[2].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 23) },
  ];

  // Criar transações para João
  for (const transaction of [...joaoTransactionsMonth1, ...joaoTransactionsMonth2]) {
    await prisma.transaction.create({
      data: {
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        categoryId: transaction.categoryId,
        accountId: accountJoao!.id,
        budgetId: budget1.id,
      },
    });
  }

  // Transações para Maria - 2 meses
  const mariaTransactions = [
    // Mês 1 - Receitas
    { description: 'Projeto Freelance Web', amount: 2500.00, type: 'INCOME' as const, categoryId: categoriesMaria[0].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 10) },
    { description: 'Curso Online Vendido', amount: 890.00, type: 'INCOME' as const, categoryId: categoriesMaria[0].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 20) },
    
    // Mês 1 - Despesas  
    { description: 'Curso Programação', amount: -299.00, type: 'EXPENSE' as const, categoryId: categoriesMaria[1].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 5) },
    { description: 'Livros Técnicos', amount: -180.00, type: 'EXPENSE' as const, categoryId: categoriesMaria[1].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 15) },
    
    // Mês 2 - Receitas
    { description: 'E-commerce Development', amount: 3200.00, type: 'INCOME' as const, categoryId: categoriesMaria[0].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 8) },
    { description: 'Mentoria Tech', amount: 450.00, type: 'INCOME' as const, categoryId: categoriesMaria[0].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 18) },
    
    // Mês 2 - Despesas
    { description: 'Certificação AWS', amount: -350.00, type: 'EXPENSE' as const, categoryId: categoriesMaria[1].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 12) },
    { description: 'Conferência Tech', amount: -480.00, type: 'EXPENSE' as const, categoryId: categoriesMaria[1].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 22) },
  ];

  // Criar transações para Maria
  for (const transaction of mariaTransactions) {
    await prisma.transaction.create({
      data: {
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        categoryId: transaction.categoryId,
        accountId: accountMaria!.id,
        budgetId: budget2.id,
      },
    });
  }

  // Transações para Pedro (Startup) - 2 meses
  const pedroTransactions = [
    // Mês 1
    { description: 'Investimento Anjo', amount: 50000.00, type: 'INCOME' as const, categoryId: categoriesPedro[0].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 8) },
    { description: 'Receita SaaS', amount: 8500.00, type: 'INCOME' as const, categoryId: categoriesPedro[0].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 15) },
    { description: 'Escritório Coworking', amount: -1200.00, type: 'EXPENSE' as const, categoryId: categoriesPedro[1].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 1) },
    { description: 'Servidores AWS', amount: -890.00, type: 'EXPENSE' as const, categoryId: categoriesPedro[1].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 10) },
    { description: 'Marketing Digital', amount: -2500.00, type: 'EXPENSE' as const, categoryId: categoriesPedro[1].id, date: new Date(month1Start.getFullYear(), month1Start.getMonth(), 20) },
    
    // Mês 2
    { description: 'Receita SaaS', amount: 12800.00, type: 'INCOME' as const, categoryId: categoriesPedro[0].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 15) },
    { description: 'Consultoria Enterprise', amount: 15000.00, type: 'INCOME' as const, categoryId: categoriesPedro[0].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 25) },
    { description: 'Escritório Coworking', amount: -1200.00, type: 'EXPENSE' as const, categoryId: categoriesPedro[1].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 1) },
    { description: 'Infraestrutura Cloud', amount: -1450.00, type: 'EXPENSE' as const, categoryId: categoriesPedro[1].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 8) },
    { description: 'Equipe Desenvolvimento', amount: -8000.00, type: 'EXPENSE' as const, categoryId: categoriesPedro[1].id, date: new Date(month2Start.getFullYear(), month2Start.getMonth(), 15) },
  ];

  // Criar transações para Pedro
  for (const transaction of pedroTransactions) {
    await prisma.transaction.create({
      data: {
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        categoryId: transaction.categoryId,
        accountId: accountPedro!.id,
        budgetId: budget3.id,
      },
    });
  }

  console.log('✅ Transactions created for 2 months');

  // Update account balances based on transactions
  const joaoBalance = 5000 + joaoTransactionsMonth1.concat(joaoTransactionsMonth2).reduce((sum, t) => sum + t.amount, 0);
  const mariaBalance = 15000 + mariaTransactions.reduce((sum, t) => sum + t.amount, 0);
  const pedroBalance = 25000 + pedroTransactions.reduce((sum, t) => sum + t.amount, 0);

  await prisma.account.update({
    where: { id: accountJoao!.id },
    data: { balance: joaoBalance }
  });

  await prisma.account.update({
    where: { id: accountMaria!.id },
    data: { balance: mariaBalance }
  });

  await prisma.account.update({
    where: { id: accountPedro!.id },
    data: { balance: pedroBalance }
  });

  console.log('✅ Account balances updated');

  // Create a budget share (João compartilha com Maria)
  await prisma.budgetShare.create({
    data: {
      budgetId: budget1.id,
      sharedWithId: user2.id,
      permission: 'READ',
      status: 'PENDING',
    },
  });

  console.log('✅ Budget share created');

  console.log('🎉 Seeding completed successfully!');
  console.log('\n📋 Created:');
  console.log('- 3 users (joao@example.com, maria@example.com, pedro@example.com)');
  console.log('- 3 budgets (1 per user)');
  console.log('- Categories and accounts for each budget');
  console.log('- 1 budget share (João -> Maria, READ, PENDING)');
  console.log('- Realistic transactions for the last 2 months');
  console.log('  • João: 24 transactions (salary, expenses, daily life)');
  console.log('  • Maria: 8 transactions (freelance income, education expenses)');
  console.log('  • Pedro: 10 transactions (startup income/expenses)');
  console.log('\n💰 Updated account balances based on transactions');
  console.log('\n🔑 All users have password: 123456');
  console.log('\n🎯 Ready for testing the complete budget application!');
}

seed()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
