import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPrisma() {
  console.log('🔍 Testing Prisma Client...');
  
  try {
    // Test basic connection
    const users = await prisma.user.findMany({
      take: 1,
      select: { id: true, email: true }
    });
    console.log('✅ Users table accessible:', users.length);

    // Test budgets table
    const budgets = await prisma.budget.findMany({
      take: 1,
      select: { id: true, name: true }
    });
    console.log('✅ Budgets table accessible:', budgets.length);

    // Check what properties are available on Budget
    if (budgets.length > 0) {
      console.log('Budget object properties:', Object.keys(budgets[0]));
    }

    // Check if budgetShare exists by trying to access it
    try {
      // @ts-ignore
      const shares = await prisma.budgetShare.findMany({ take: 1 });
      console.log('✅ BudgetShare table accessible:', shares.length);
    } catch (error) {
      console.log('❌ BudgetShare not accessible:', error.message);
    }

    // List all available models
    console.log('\n📋 Available Prisma models:');
    // @ts-ignore
    console.log(Object.keys(prisma).filter(key => !key.startsWith('$') && typeof prisma[key] === 'object'));

  } catch (error) {
    console.error('❌ Error testing Prisma:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
