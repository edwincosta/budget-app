import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('🔍 Testando conexão com o banco de dados...');

        // Testar conexão básica
        await prisma.$connect();
        console.log('✅ Conexão estabelecida com sucesso!');

        // Testar uma query simples
        const userCount = await prisma.user.count();
        console.log(`📊 Total de usuários no banco: ${userCount}`);

        // Testar estrutura das tabelas
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

        console.log('📋 Tabelas encontradas:');
        console.table(tables);

        console.log('🎉 Banco de dados configurado corretamente!');

    } catch (error) {
        console.error('❌ Erro ao conectar com o banco:', error);
        console.error('\n🔧 Verifique:');
        console.error('1. Se a DATABASE_URL está correta no arquivo .env');
        console.error('2. Se o projeto Supabase está ativo');
        console.error('3. Se a senha do banco está correta');
        console.error('4. Se as migrações foram executadas');

        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();