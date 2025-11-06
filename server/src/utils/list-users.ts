import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const prisma = new PrismaClient();

async function listUsers() {
    try {
        console.log('👥 Listando usuários cadastrados...\n');

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                ownedBudgets: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                sharedBudgets: {
                    select: {
                        permission: true,
                        budget: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        if (users.length === 0) {
            console.log('⚠️  Nenhum usuário encontrado.');
            console.log('💡 Execute: npm run db:seed');
            return;
        }

        users.forEach((user, index) => {
            console.log(`${index + 1}. 👤 ${user.name}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   📅 Criado: ${user.createdAt.toLocaleDateString('pt-BR')}`);

            if (user.ownedBudgets.length > 0) {
                console.log(`   🏠 Orçamentos próprios: ${user.ownedBudgets.length}`);
                user.ownedBudgets.forEach(budget => {
                    console.log(`      - ${budget.name}`);
                });
            }

            if (user.sharedBudgets.length > 0) {
                console.log(`   🤝 Orçamentos compartilhados: ${user.sharedBudgets.length}`);
                user.sharedBudgets.forEach(share => {
                    console.log(`      - ${share.budget.name} (${share.permission})`);
                });
            }

            console.log('');
        });

        console.log(`📊 Total: ${users.length} usuários cadastrados`);

    } catch (error) {
        console.error('❌ Erro ao listar usuários:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();