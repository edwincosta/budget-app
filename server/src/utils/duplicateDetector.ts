import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface TransactionForComparison {
    description: string;
    amount: Decimal;
    date: Date;
    accountId: string;
}

export interface DuplicateResult {
    isDuplicate: boolean;
    reason?: string;
    existingTransactionId?: string;
    similarity?: number;
}

/**
 * Detecta duplicatas comparando transações importadas com existentes
 */
export class DuplicateDetector {

    /**
     * Verifica se uma transação é duplicata
     */
    static async checkDuplicate(
        transaction: TransactionForComparison,
        budgetId: string
    ): Promise<DuplicateResult> {

        // 1. Busca transações na mesma conta nos últimos 30 dias
        const dateStart = new Date(transaction.date);
        dateStart.setDate(dateStart.getDate() - 15); // 15 dias antes

        const dateEnd = new Date(transaction.date);
        dateEnd.setDate(dateEnd.getDate() + 15); // 15 dias depois

        const existingTransactions = await prisma.transaction.findMany({
            where: {
                budgetId,
                accountId: transaction.accountId,
                date: {
                    gte: dateStart,
                    lte: dateEnd
                }
            },
            select: {
                id: true,
                description: true,
                amount: true,
                date: true
            }
        });

        // 2. Verifica duplicata exata (mesmo valor, mesma data)
        const exactMatch = existingTransactions.find(existing =>
            existing.amount.equals(transaction.amount) &&
            this.isSameDay(existing.date, transaction.date)
        );

        if (exactMatch) {
            return {
                isDuplicate: true,
                reason: 'Transação idêntica encontrada (mesmo valor e data)',
                existingTransactionId: exactMatch.id,
                similarity: 1.0
            };
        }

        // 3. Verifica duplicata por descrição e valor (até 3 dias de diferença)
        const similarMatch = existingTransactions.find(existing => {
            const daysDiff = Math.abs(
                (existing.date.getTime() - transaction.date.getTime()) / (1000 * 60 * 60 * 24)
            );

            return existing.amount.equals(transaction.amount) &&
                daysDiff <= 3 &&
                this.calculateSimilarity(existing.description, transaction.description) > 0.8;
        });

        if (similarMatch) {
            const similarity = this.calculateSimilarity(similarMatch.description, transaction.description);
            return {
                isDuplicate: true,
                reason: `Transação similar encontrada (${Math.round(similarity * 100)}% similaridade)`,
                existingTransactionId: similarMatch.id,
                similarity
            };
        }

        // 4. Não é duplicata
        return {
            isDuplicate: false
        };
    }

    /**
     * Verifica se duas datas são do mesmo dia
     */
    private static isSameDay(date1: Date, date2: Date): boolean {
        return date1.toDateString() === date2.toDateString();
    }

    /**
     * Calcula similaridade entre duas strings (algoritmo de Levenshtein simplificado)
     */
    private static calculateSimilarity(str1: string, str2: string): number {
        const s1 = str1.toLowerCase().trim();
        const s2 = str2.toLowerCase().trim();

        if (s1 === s2) return 1.0;
        if (s1.length === 0 || s2.length === 0) return 0;

        const matrix: number[][] = [];
        const n = s1.length;
        const m = s2.length;

        // Inicializar matriz
        for (let i = 0; i <= n; i++) {
            matrix[i] = [];
            matrix[i][0] = i;
        }
        for (let j = 0; j <= m; j++) {
            matrix[0][j] = j;
        }

        // Calcular distância
        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j] + 1,     // deleção
                        matrix[i][j - 1] + 1,     // inserção
                        matrix[i - 1][j - 1] + 1  // substituição
                    );
                }
            }
        }

        const distance = matrix[n][m];
        const maxLength = Math.max(n, m);
        return 1 - (distance / maxLength);
    }

    /**
     * Processa lote de transações verificando duplicatas
     */
    static async processBatch(
        transactions: TransactionForComparison[],
        budgetId: string
    ): Promise<(TransactionForComparison & DuplicateResult)[]> {

        const results: (TransactionForComparison & DuplicateResult)[] = [];

        for (const transaction of transactions) {
            const duplicateCheck = await this.checkDuplicate(transaction, budgetId);
            results.push({
                ...transaction,
                ...duplicateCheck
            });
        }

        return results;
    }
}
