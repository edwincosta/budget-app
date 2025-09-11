import * as fs from 'fs';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { BankParser, ParseResult, ParseOptions } from './BankParser';
import { ParsedTransaction } from '../csvParser';

/**
 * Parser específico para arquivos do Nubank
 */
export class NubankParser extends BankParser {
    readonly bankName = 'Nubank';
    readonly supportedFormats = ['csv'];

    canParse(filePath: string, firstLines: string[]): boolean {
        // Verifica se é arquivo Nubank pelo nome ou conteúdo
        const fileName = filePath.toLowerCase();
        if (fileName.includes('nubank')) return true;

        // Verifica pelos headers característicos
        const firstLine = firstLines[0]?.toLowerCase() || '';
        return firstLine.includes('date') &&
            firstLine.includes('description') &&
            firstLine.includes('amount');
    }

    async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        return new Promise((resolve) => {
            const transactions: ParsedTransaction[] = [];
            const errors: string[] = [];
            let totalProcessed = 0;

            const accountType = this.detectAccountTypeFromFile(filePath);

            try {
                const content = fs.readFileSync(filePath, 'utf8');

                Readable.from([content])
                    .pipe(csv())
                    .on('data', (row) => {
                        try {
                            totalProcessed++;

                            const transaction = this.parseNubankTransaction(row, accountType);

                            if (transaction) {
                                transactions.push(transaction);
                            }

                        } catch (error) {
                            errors.push(`Linha ${totalProcessed}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                        }
                    })
                    .on('end', () => {
                        // Aplica filtro de data se especificado
                        const filteredTransactions = this.filterByDateRange(transactions, options?.dateRange);

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
                    accountType
                });
            }
        });
    }

    private detectAccountTypeFromFile(filePath: string): string {
        const fileName = filePath.toLowerCase();

        if (fileName.includes('cartao') || fileName.includes('credito')) {
            return 'cartao_credito';
        }

        if (fileName.includes('conta') || fileName.includes('corrente')) {
            return 'conta_corrente';
        }

        return 'conta_corrente';
    }

    private parseNubankTransaction(row: any, accountType: string): ParsedTransaction | null {
        // Headers do Nubank: date, category, title, amount
        const date = this.parseDate(row.date);
        if (!date) {
            throw new Error('Data inválida');
        }

        // Valida se a data não é futura
        if (!this.isValidTransactionDate(date)) {
            throw new Error('Data futura - transação ignorada');
        }

        const description = row.title || row.description;
        if (!description || description.trim() === '') {
            throw new Error('Descrição em branco');
        }

        const amount = this.parseAmount(row.amount);

        return {
            date,
            description: description.trim(),
            amount,
            type: amount < 0 ? 'EXPENSE' : 'INCOME',
            originalData: {
                bank: this.bankName,
                accountType,
                category: row.category || 'Outros',
                raw: row
            }
        };
    }
}
