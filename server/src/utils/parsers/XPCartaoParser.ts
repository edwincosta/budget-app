import * as fs from 'fs';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { BankParser, ParseResult, ParseOptions } from './BankParser';
import { ParsedTransaction } from '../csvParser';

/**
 * Parser específico para cartão de crédito XP Investimentos
 * Formato: Data;Estabelecimento;Portador;Valor;Parcela
 */
export class XPCartaoParser extends BankParser {
    readonly bankName = 'XP Cartão';
    readonly supportedFormats = ['csv'];

    canParse(filePath: string, firstLines: string[]): boolean {
        const fileName = filePath.toLowerCase();

        // Deve ter XP e indicadores de cartão
        if (!(fileName.includes('xp') &&
            (fileName.includes('cartao') || fileName.includes('fatura') || fileName.includes('credito')))) {
            return false;
        }

        // Verifica se tem o header específico do cartão XP
        const content = firstLines.join('\n').toLowerCase();
        return content.includes('estabelecimento') &&
            content.includes('portador') &&
            content.includes('parcela');
    }

    async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        return new Promise((resolve) => {
            const transactions: ParsedTransaction[] = [];
            const errors: string[] = [];
            let totalProcessed = 0;

            try {
                const content = fs.readFileSync(filePath, 'utf8');

                console.log('🏦 XP Cartão: Processando fatura de cartão de crédito');

                Readable.from([content])
                    .pipe(csv({ separator: ';' }))
                    .on('data', (row) => {
                        try {
                            totalProcessed++;

                            const transaction = this.parseXPCartaoTransaction(row);

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

                        console.log(`✅ XP Cartão: ${filteredTransactions.length} transações processadas de ${totalProcessed} linhas`);

                        resolve({
                            transactions: filteredTransactions,
                            errors,
                            totalProcessed,
                            bankName: this.bankName,
                            accountType: 'cartao_credito'
                        });
                    })
                    .on('error', (error) => {
                        errors.push(`Erro ao processar arquivo: ${error.message}`);
                        resolve({
                            transactions,
                            errors,
                            totalProcessed,
                            bankName: this.bankName,
                            accountType: 'cartao_credito'
                        });
                    });

            } catch (error) {
                errors.push(`Erro ao ler arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                resolve({
                    transactions,
                    errors,
                    totalProcessed: 0,
                    bankName: this.bankName,
                    accountType: 'cartao_credito'
                });
            }
        });
    }

    private parseXPCartaoTransaction(row: any): ParsedTransaction | null {
        // Headers do XP Cartão: Data;Estabelecimento;Portador;Valor;Parcela
        // Nota: O arquivo pode ter BOM, então a primeira coluna pode ser '\ufeffData'
        const dateStr = row['Data'] || row['\ufeffData'];
        const estabelecimento = row['Estabelecimento'];
        const portador = row['Portador'];
        const valueStr = row['Valor'];
        const parcela = row['Parcela'];

        // Valida estabelecimento (descrição principal)
        if (!estabelecimento || estabelecimento.trim() === '') {
            throw new Error('Estabelecimento em branco');
        }

        // Parseia data - formato: "DD/MM/YYYY"
        const date = this.parseDate(dateStr);
        if (!date) {
            throw new Error('Data inválida');
        }        // Valida se a data não é futura
        if (!this.isValidTransactionDate(date)) {
            throw new Error('Data futura - transação ignorada');
        }

        // Parseia valor - formato: "R$ 1.000,00" ou "-R$ 1.000,00"
        const amount = this.parseXPCartaoAmount(valueStr);
        if (amount === 0) {
            throw new Error('Valor inválido');
        }

        // Monta descrição completa
        let description = estabelecimento.trim();
        if (portador && portador.trim() !== '') {
            description += ` (${portador.trim()})`;
        }
        if (parcela && parcela.trim() !== '' && parcela.trim() !== '-') {
            description += ` [${parcela.trim()}]`;
        }

        // No cartão de crédito, gastos são sempre EXPENSE, estornos são INCOME
        const type: 'INCOME' | 'EXPENSE' = amount >= 0 ? 'EXPENSE' : 'INCOME';

        return {
            date,
            description,
            amount: Math.abs(amount),
            type,
            originalData: {
                bank: this.bankName,
                accountType: 'cartao_credito',
                estabelecimento,
                portador,
                parcela,
                originalValue: valueStr,
                raw: row
            }
        };
    }

    private parseXPCartaoAmount(valueStr: string): number {
        if (!valueStr) return 0;

        // Remove "R$" e espaços
        let cleaned = valueStr.toString().trim()
            .replace(/R\$\s*/g, '')
            .replace(/\s+/g, '');

        // Se começa com hífen, é negativo (estorno)
        const isNegative = cleaned.startsWith('-');
        if (isNegative) {
            cleaned = cleaned.substring(1);
        }

        // Substitui vírgula por ponto para decimal (formato brasileiro)
        if (cleaned.includes('.') && cleaned.includes(',')) {
            // Formato: 1.000,00 - ponto é separador de milhar
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else if (cleaned.includes(',')) {
            // Formato: 1000,00 - vírgula é decimal
            cleaned = cleaned.replace(',', '.');
        }

        const amount = parseFloat(cleaned);
        if (isNaN(amount)) return 0;

        return isNegative ? -amount : amount;
    }
}
