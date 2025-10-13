import { ExcelReader } from '../excelReader';
import { BankParser, ParseResult, ParseOptions } from './BankParser';
import { ParsedTransaction } from '../csvParser';

/**
 * Parser específico para arquivos Excel do Clear (investimento)
 * Formato: Excel com estrutura específica do Clear
 */
export class ClearParser extends BankParser {
    readonly bankName = 'Clear';
    readonly supportedFormats = ['xlsx', 'xls'];

    canParse(filePath: string, firstLines: string[]): boolean {
        const fileName = filePath.toLowerCase();

        // Deve ter Clear no nome, ser Excel e ser investimento (conta corrente usa CSV/XP parser)
        if (!fileName.includes('clear')) return false;
        if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) return false;
        if (!fileName.includes('investimento')) return false;

        return true;
    }

    async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        const transactions: ParsedTransaction[] = [];
        const errors: string[] = [];
        let totalProcessed = 0;

        try {
            console.log('🏦 Clear: Processando arquivo Excel de investimento');

            const data = await ExcelReader.readFile(filePath);

            const accountType = 'conta_investimento';

            // Encontra onde começam os dados (após header "Movimentação")
            const dataStartIndex = this.findDataStartIndex(data);

            if (dataStartIndex === -1) {
                return {
                    transactions: [],
                    errors: ['Estrutura do arquivo Clear não reconhecida'],
                    totalProcessed: 0,
                    bankName: this.bankName,
                    accountType
                };
            }

            console.log(`🏦 Clear: Dados começam na linha ${dataStartIndex + 1}`);

            // Processa cada linha de dados
            for (let i = dataStartIndex + 1; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                // Para quando chegar em "Lançamentos futuros" ou linhas informativas
                if (row[0] && row[0].toString().includes('Lançamentos futuros')) {
                    break;
                }

                try {
                    totalProcessed++;

                    const transaction = this.parseClearTransaction(row, accountType, i + 1);

                    if (transaction) {
                        transactions.push(transaction);
                    }

                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
                    errors.push(`Linha ${i + 1}: ${errorMsg}`);
                }
            }

            const filteredTransactions = this.filterByDateRange(transactions, options?.dateRange);

            console.log(`✅ Clear: ${filteredTransactions.length} transações processadas de ${totalProcessed} linhas`);

            return {
                transactions: filteredTransactions,
                errors,
                totalProcessed,
                bankName: this.bankName,
                accountType
            };

        } catch (error) {
            errors.push(`Erro ao ler arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            return {
                transactions,
                errors,
                totalProcessed: 0,
                bankName: this.bankName,
                accountType: 'conta_investimento'
            };
        }
    }

    private findDataStartIndex(data: any[][]): number {
        // Procura pela linha com headers "Movimentação", "Liquidação", "Lançamento", etc.
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (row && row.length > 2) {
                const firstCell = row[0]?.toString().toLowerCase() || '';
                const secondCell = row[1]?.toString().toLowerCase() || '';
                const thirdCell = row[2]?.toString().toLowerCase() || '';

                if (firstCell.includes('movimentação') &&
                    secondCell.includes('liquidação') &&
                    thirdCell.includes('lançamento')) {
                    return i;
                }
            }
        }
        return -1;
    }

    private parseClearTransaction(row: any[], accountType: string, lineNumber: number): ParsedTransaction | null {
        // Estrutura Clear: [0] Data Movimentação, [1] Data Liquidação, [2] Lançamento, [3] Vazio, [4] Valor, [5] Saldo
        const dataMovimentacao = row[0];
        const dataLiquidacao = row[1];
        const lancamento = row[2];
        const valor = row[4];
        const saldo = row[5];

        // Ignora linhas vazias ou sem dados relevantes
        if (!dataMovimentacao || !lancamento || valor === undefined || valor === null ||
            lancamento.toString().includes('Não há lançamentos')) {
            return null;
        }

        // Usa lançamento como descrição
        const fullDescription = lancamento.toString().trim();

        if (!fullDescription) {
            throw new Error('Descrição em branco');
        }

        // Parseia data - usa data de movimentação (número serial do Excel)
        const date = this.parseClearDate(dataMovimentacao);
        if (!date) {
            throw new Error('Data inválida');
        }

        // Valida se a data não é futura
        if (!this.isValidTransactionDate(date)) {
            throw new Error('Data futura - transação ignorada');
        }

        // Parseia valor
        const amount = this.parseClearAmount(valor);
        if (amount === 0) {
            throw new Error('Valor inválido');
        }

        const type: 'INCOME' | 'EXPENSE' = amount >= 0 ? 'INCOME' : 'EXPENSE';

        return {
            date,
            description: fullDescription,
            amount: Math.abs(amount),
            type,
            originalData: {
                bank: this.bankName,
                accountType,
                lancamento,
                dataMovimentacao,
                dataLiquidacao,
                originalValor: valor,
                saldo,
                raw: row
            }
        };
    }

    private parseClearDate(dateValue: any): Date | null {
        if (!dateValue) return null;

        // Se é número (serial date do Excel)
        if (typeof dateValue === 'number') {
            // Converte serial date do Excel para JavaScript Date
            // Serial date do Excel: dias desde 1900-01-01 (com ajuste para erro do Excel)
            return new Date((dateValue - 25569) * 86400 * 1000);
        }

        // Se é string, tenta parsing normal
        return this.parseDate(dateValue.toString());
    }

    private parseClearAmount(valor: any): number {
        if (valor === null || valor === undefined) return 0;

        // Se já é número
        if (typeof valor === 'number') {
            return valor;
        }

        // Se é string, limpa e converte
        const str = valor.toString().trim();
        if (!str) return 0;

        // Remove caracteres não numéricos exceto ponto, vírgula e sinal
        let cleaned = str.replace(/[^\d,.-]/g, '');

        // Converte vírgula para ponto se necessário
        if (cleaned.includes(',')) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }

        const amount = parseFloat(cleaned);
        return isNaN(amount) ? 0 : amount;
    }
}
