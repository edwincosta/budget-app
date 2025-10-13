import * as fs from 'fs';
const pdf = require('pdf-parse');
import { BankParser, ParseResult, ParseOptions } from './BankParser';
import { ParsedTransaction } from '../csvParser';

/**
 * Parser específico para arquivos PDF do BTG Pactual
 * Formato: PDF de extratos de conta corrente/investimento
 */
export class BTGPDFParser extends BankParser {
    readonly bankName = 'BTG PDF';
    readonly supportedFormats = ['pdf'];

    canParse(filePath: string, firstLines: string[]): boolean {
        const fileName = filePath.toLowerCase();

        // Deve ter BTG no nome e ser PDF
        if (!fileName.includes('btg')) return false;
        if (!fileName.endsWith('.pdf')) return false;

        return true;
    }

    async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        const transactions: ParsedTransaction[] = [];
        const errors: string[] = [];
        let totalProcessed = 0;

        try {
            console.log('🏦 BTG PDF: Processando arquivo PDF');

            const buffer = fs.readFileSync(filePath);
            const pdfData = await pdf(buffer);
            const lines = pdfData.text.split('\n');

            const accountType = this.detectAccountTypeFromFile(filePath);

            // Encontra a seção de movimentações
            let inMovimentacao = false;
            let currentTransaction = null;
            let tempTransactions = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Identifica o início da seção de movimentações
                if (line.includes('DataDescriçãoDébitoSaldoCrédito') ||
                    (line.includes('Data') && line.includes('Descrição'))) {
                    inMovimentacao = true;
                    console.log('🏦 BTG PDF: Seção de movimentação encontrada');
                    continue;
                }

                if (inMovimentacao) {
                    // Para quando sair da seção de transações
                    if (line.includes('Totalizadores') ||
                        line.includes('Informações Gerais') ||
                        line.includes('Saldo Final') ||
                        line.includes('2 de 3') ||
                        line.includes('3 de 3')) {
                        break;
                    }

                    // Se é uma linha com data, inicia nova transação
                    if (line.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                        // Se já tinha uma transação, salva ela
                        if (currentTransaction) {
                            tempTransactions.push(currentTransaction);
                        }

                        const dateMatch = line.match(/^\d{2}\/\d{2}\/\d{4}/);
                        currentTransaction = {
                            date: dateMatch[0],
                            description: line.replace(/^\d{2}\/\d{2}\/\d{4}\s+/, '').trim(),
                            values: []
                        };
                    }
                    // Se é uma linha com valores (números com vírgula)
                    else if (line.match(/\d+\.\d+,\d+/) && currentTransaction) {
                        const values = line.match(/\d+\.\d+,\d+/g);
                        if (values) {
                            currentTransaction.values.push(...values);
                        }
                    }
                }
            }

            // Adiciona a última transação
            if (currentTransaction) {
                tempTransactions.push(currentTransaction);
            }

            console.log(`🏦 BTG PDF: ${tempTransactions.length} transações encontradas no PDF`);

            // Processa cada transação temporária
            for (const tempTransaction of tempTransactions) {
                try {
                    totalProcessed++;

                    const date = this.parseDate(tempTransaction.date);
                    if (!date) {
                        errors.push(`Linha ${totalProcessed}: Data inválida`);
                        continue;
                    }

                    if (!this.isValidTransactionDate(date)) {
                        errors.push(`Linha ${totalProcessed}: Data futura inválida`);
                        continue;
                    }

                    if (!tempTransaction.description || tempTransaction.description.trim() === '') {
                        errors.push(`Linha ${totalProcessed}: Descrição em branco`);
                        continue;
                    }

                    // Determina o valor da transação
                    // O BTG PDF geralmente tem: [débito, saldo, crédito] ou variações
                    let amount = 0;
                    let type: 'INCOME' | 'EXPENSE' = 'EXPENSE';

                    if (tempTransaction.values.length > 0) {
                        // Usa o primeiro valor como base
                        const firstValue = this.parseAmount(tempTransaction.values[0]);

                        // Determina se é débito ou crédito baseado na descrição
                        const description = tempTransaction.description.toLowerCase();

                        if (description.includes('recebimento') ||
                            description.includes('credito') ||
                            description.includes('rendimento') ||
                            description.includes('resgate')) {
                            amount = Math.abs(firstValue);
                            type = 'INCOME';
                        } else {
                            amount = -Math.abs(firstValue);
                            type = 'EXPENSE';
                        }

                        if (amount === 0) {
                            // Ignora transações com valor zero
                            continue;
                        }

                        const transaction: ParsedTransaction = {
                            date,
                            description: tempTransaction.description,
                            amount,
                            type,
                            originalData: {
                                bank: this.bankName,
                                accountType,
                                values: tempTransaction.values,
                                raw: tempTransaction
                            }
                        };

                        transactions.push(transaction);
                    }

                } catch (error) {
                    errors.push(`Linha ${totalProcessed}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                }
            }

            const filteredTransactions = this.filterByDateRange(transactions, options?.dateRange);

            console.log(`✅ BTG PDF: ${filteredTransactions.length} transações processadas de ${tempTransactions.length} encontradas`);

            return {
                transactions: filteredTransactions,
                errors,
                totalProcessed,
                bankName: this.bankName,
                accountType
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            return {
                transactions,
                errors: [`Erro ao processar PDF do BTG: ${errorMessage}`],
                totalProcessed: 0,
                bankName: this.bankName,
                accountType: 'conta_investimento'
            };
        }
    }

    private detectAccountTypeFromFile(filePath: string): string {
        const fileName = filePath.toLowerCase();

        if (fileName.includes('investimento')) {
            return 'conta_investimento';
        }

        if (fileName.includes('poupanca') || fileName.includes('poupança')) {
            return 'conta_poupanca';
        }

        if (fileName.includes('cartao') || fileName.includes('credito')) {
            return 'cartao_credito';
        }

        return 'conta_corrente';
    }
}
