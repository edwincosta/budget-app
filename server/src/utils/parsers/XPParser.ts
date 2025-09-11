import * as fs from 'fs';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { BankParser, ParseResult, ParseOptions } from './BankParser';
import { ParsedTransaction } from '../csvParser';

/**
 * Parser específico para arquivos do XP Investimentos
 */
export class XPParser extends BankParser {
    readonly bankName = 'XP';
    readonly supportedFormats = ['csv'];

    canParse(filePath: string, firstLines: string[]): boolean {
        const fileName = filePath.toLowerCase();

        // Deve ter XP mas NÃO ser cartão (que tem parser específico)
        if (fileName.includes('cartao') || fileName.includes('fatura') || fileName.includes('credito')) {
            return false;
        }

        if (fileName.includes('xp_') || fileName.includes('xp-')) return true;

        // Verifica estrutura característica do XP conta (não cartão)
        const firstLine = firstLines[0]?.toLowerCase() || '';
        return firstLine.includes('data') &&
            firstLine.includes('descricao') &&
            firstLine.includes('valor') &&
            firstLine.includes('saldo');
    }

    async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        return new Promise((resolve) => {
            const transactions: ParsedTransaction[] = [];
            const errors: string[] = [];
            let totalProcessed = 0;

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const accountType = this.detectAccountTypeFromFile(filePath);

                console.log(`🏦 XP: Processando ${accountType}`);

                Readable.from([content])
                    .pipe(csv({ separator: ';' })) // XP usa ponto e vírgula
                    .on('data', (row) => {
                        try {
                            totalProcessed++;

                            const transaction = this.parseXPTransaction(row, accountType);

                            if (transaction) {
                                transactions.push(transaction);
                            }

                        } catch (error) {
                            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
                            errors.push(`Linha ${totalProcessed}: ${errorMsg}`);
                        }
                    })
                    .on('end', () => {
                        const filteredTransactions = this.filterByDateRange(transactions, options?.dateRange);

                        console.log(`✅ XP: ${filteredTransactions.length} transações processadas de ${totalProcessed} linhas`);

                        resolve({
                            transactions: filteredTransactions,
                            errors,
                            totalProcessed,
                            bankName: this.bankName,
                            accountType
                        });
                    })
                    .on('error', (error) => {
                        errors.push(`Erro ao processar arquivo: ${error.message}`);
                        resolve({
                            transactions,
                            errors,
                            totalProcessed,
                            bankName: this.bankName,
                            accountType
                        });
                    });

            } catch (error) {
                errors.push(`Erro ao ler arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                resolve({
                    transactions,
                    errors,
                    totalProcessed: 0,
                    bankName: this.bankName,
                    accountType: 'conta_corrente'
                });
            }
        });
    }

    private detectAccountTypeFromFile(filePath: string): string {
        const fileName = filePath.toLowerCase();

        if (fileName.includes('investimento')) {
            return 'conta_investimento';
        }

        if (fileName.includes('corrente')) {
            return 'conta_corrente';
        }

        return 'conta_corrente';
    }

    private parseXPTransaction(row: any, accountType: string): ParsedTransaction | null {
        // Headers do XP conta: Data;Descricao;Valor;Saldo
        const dateStr = row['Data'] || row['data'];
        const description = row['Descricao'] || row['descricao'] || row['Descrição'];
        const valueStr = row['Valor'] || row['valor'];

        // Valida descrição
        if (!description || description.trim() === '') {
            throw new Error('Descrição em branco');
        }

        // Parseia data - formato específico do XP conta: "DD/MM/YY às HH:mm:ss"
        const date = this.parseXPDate(dateStr);
        if (!date) {
            throw new Error('Data inválida');
        }

        // Valida se a data não é futura
        if (!this.isValidTransactionDate(date)) {
            throw new Error('Data futura - transação ignorada');
        }

        // Parseia valor - formato: "R$ 1.000,00" ou "-R$ 1.000,00"
        const amount = this.parseXPAmount(valueStr);
        if (amount === 0) {
            throw new Error('Valor inválido');
        }

        const type: 'INCOME' | 'EXPENSE' = amount >= 0 ? 'INCOME' : 'EXPENSE';

        return {
            date,
            description: description.trim(),
            amount: Math.abs(amount),
            type,
            originalData: {
                bank: this.bankName,
                accountType,
                originalValue: valueStr,
                saldo: row['Saldo'] || row['saldo'],
                raw: row
            }
        };
    }

    private parseXPDate(dateStr: string): Date | null {
        if (!dateStr) return null;

        // Formato XP: "DD/MM/YY às HH:mm:ss"
        const xpDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})\s+às\s+(\d{2}):(\d{2}):(\d{2})$/;
        const match = dateStr.trim().match(xpDateRegex);

        if (match) {
            const [, day, month, year] = match;
            const fullYear = parseInt(year) + 2000; // Assume anos 20xx
            return new Date(fullYear, parseInt(month) - 1, parseInt(day));
        }

        // Fallback para outros formatos
        return this.parseDate(dateStr);
    }

    private parseXPAmount(valueStr: string): number {
        if (!valueStr) return 0;

        // Remove "R$" e outros caracteres, mantém sinal
        let cleaned = valueStr.toString().trim()
            .replace(/R\$\s*/g, '')
            .replace(/\s+/g, '');

        // Se começa com hífen, é negativo
        const isNegative = cleaned.startsWith('-');
        if (isNegative) {
            cleaned = cleaned.substring(1);
        }

        // Substitui vírgula por ponto para decimal
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');

        const amount = parseFloat(cleaned);
        if (isNaN(amount)) return 0;

        return isNegative ? -amount : amount;
    }
}
