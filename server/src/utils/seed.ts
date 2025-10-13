// Seed script for development environment
// Creates test users, default budgets, and categories

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface TestUser {
    email: string;
    name: string;
    password: string;
}

interface Category {
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color: string;
    icon?: string;
}

// Test users data
const testUsers: TestUser[] = [
    {
        email: 'joao@example.com',
        name: 'João Silva',
        password: '123456'
    },
    {
        email: 'maria@example.com',
        name: 'Maria Santos',
        password: '123456'
    },
    {
        email: 'pedro@example.com',
        name: 'Pedro Oliveira',
        password: '123456'
    }
];

// Default categories for each budget
const defaultCategories: Category[] = [
    // Income categories
    { name: 'Salário', type: 'INCOME', color: '#10B981', icon: '💰' },
    { name: 'Freelance', type: 'INCOME', color: '#059669', icon: '💻' },
    { name: 'Investimentos', type: 'INCOME', color: '#047857', icon: '📈' },
    { name: 'Vendas', type: 'INCOME', color: '#065F46', icon: '🛍️' },
    { name: 'Outros (Receita)', type: 'INCOME', color: '#064E3B', icon: '🎯' },

    // Expense categories  
    { name: 'Alimentação', type: 'EXPENSE', color: '#EF4444', icon: '🍽️' },
    { name: 'Transporte', type: 'EXPENSE', color: '#F97316', icon: '🚗' },
    { name: 'Moradia', type: 'EXPENSE', color: '#8B5CF6', icon: '🏠' },
    { name: 'Saúde', type: 'EXPENSE', color: '#EC4899', icon: '🏥' },
    { name: 'Educação', type: 'EXPENSE', color: '#3B82F6', icon: '📚' },
    { name: 'Lazer', type: 'EXPENSE', color: '#06B6D4', icon: '🎉' },
    { name: 'Roupas', type: 'EXPENSE', color: '#84CC16', icon: '👕' },
    { name: 'Serviços', type: 'EXPENSE', color: '#F59E0B', icon: '🔧' },
    { name: 'Impostos', type: 'EXPENSE', color: '#DC2626', icon: '📋' },
    { name: 'Outros (Despesa)', type: 'EXPENSE', color: '#6B7280', icon: '📦' }
];

export async function seedDatabase() {
    try {
        console.log('🌱 Starting database seed...');

        // Check if users already exist
        const existingUsers = await prisma.user.count();
        if (existingUsers > 0) {
            console.log('✅ Users already exist, skipping seed');
            return;
        }

        // Create test users with budgets and categories
        for (const userData of testUsers) {
            console.log(`👤 Creating user: ${userData.name} (${userData.email})`);

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create user
            const user = await prisma.user.create({
                data: {
                    email: userData.email,
                    name: userData.name,
                    password: hashedPassword
                }
            });

            console.log(`✅ User created: ${user.id}`);

            // Create default budget for user
            console.log(`📊 Creating budget for: ${userData.name}`);

            const budget = await prisma.budget.create({
                data: {
                    name: 'Meu Orçamento',
                    description: 'Orçamento pessoal padrão',
                    ownerId: user.id
                }
            });

            console.log(`✅ Budget created: ${budget.id}`);

            // Set as default budget
            await prisma.user.update({
                where: { id: user.id },
                data: { defaultBudgetId: budget.id }
            });

            console.log(`✅ Default budget set for user: ${userData.name}`);

            // Create default categories
            console.log(`🏷️ Creating categories for: ${userData.name}`);

            const categories = await prisma.category.createMany({
                data: defaultCategories.map(cat => ({
                    name: cat.name,
                    type: cat.type,
                    color: cat.color,
                    icon: cat.icon,
                    budgetId: budget.id
                }))
            });

            console.log(`✅ Created ${categories.count} categories for ${userData.name}`);

            // Create some sample accounts
            console.log(`💳 Creating accounts for: ${userData.name}`);

            await prisma.account.createMany({
                data: [
                    {
                        name: 'Conta Corrente',
                        type: 'CHECKING',
                        balance: 1000.00,
                        budgetId: budget.id
                    },
                    {
                        name: 'Poupança',
                        type: 'SAVINGS',
                        balance: 5000.00,
                        budgetId: budget.id
                    },
                    {
                        name: 'Cartão de Crédito',
                        type: 'CREDIT_CARD',
                        balance: 0.00,
                        budgetId: budget.id
                    }
                ]
            });

            console.log(`✅ Created accounts for ${userData.name}`);
        }

        console.log('🎉 Database seed completed successfully!');
        console.log('📝 Test users created:');
        testUsers.forEach(user => {
            console.log(`   - ${user.email} / ${user.password}`);
        });

    } catch (error) {
        console.error('❌ Seed error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run seed if called directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('✅ Seed script completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Seed script failed:', error);
            process.exit(1);
        });
}