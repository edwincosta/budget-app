const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });
    
    console.log('=== USUÁRIOS NO BANCO DE DADOS ===');
    console.log(`Total: ${users.length} usuários`);
    console.log('');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Criado em: ${user.createdAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
