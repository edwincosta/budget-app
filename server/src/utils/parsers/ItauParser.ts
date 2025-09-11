import * as XLSX from 'xlsx';
import { BankParser, ParseResult, ParseOptions } from './BankParser';
import { ParsedTransaction } from '../csvParser';

/**
 * Parser específico para arquivos Excel do Itaú
 * Formato: Excel com estrutura específica do Itaú (.xls)
 */
export class ItauParser extends BankParser {
    readonly bankName = 'Itaú';
    readonly supportedFormats = ['xls', 'xlsx'];

    canParse(filePath: string, firstLines: string[]): boolean {
        const fileName = filePath.toLowerCase();

        // Deve ter Itaú no nome e ser Excel
        if (!fileName.includes('itau') && !fileName.includes('itaú')) return false;
        if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) return false;

        return true;
    }

    async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        const transactions: ParsedTransaction[] = [];
        const errors: string[] = [];
        let totalProcessed = 0;

        try {
            console.log('🏦 Itaú: Processando arquivo Excel');

            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0]; // Primeira aba
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

            const accountType = this.detectAccountTypeFromFile(filePath);

            // Encontra onde começam os dados (após header "data")
            const dataStartIndex = this.findDataStartIndex(data);

            if (dataStartIndex === -1) {
                return {
                    transactions: [],
                    errors: ['Estrutura do arquivo Itaú não reconhecida'],
                    totalProcessed: 0,
                    bankName: this.bankName,
                    accountType
                };
            }

            console.log(`🏦 Itaú: Dados começam na linha ${dataStartIndex + 1}`);

            // Processa cada linha de dados (pula a linha de headers "lançamentos")
            for (let i = dataStartIndex + 2; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                try {
                    totalProcessed++;

                    const transaction = this.parseItauTransaction(row, accountType, i + 1);

                    if (transaction) {
                        transactions.push(transaction);
                    }

                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
                    errors.push(`Linha ${i + 1}: ${errorMsg}`);
                }
            }

            const filteredTransactions = this.filterByDateRange(transactions, options?.dateRange);

            console.log(`✅ Itaú: ${filteredTransactions.length} transações processadas de ${totalProcessed} linhas`);

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
                accountType: 'conta_corrente'
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

        return 'conta_corrente';
    }

    private findDataStartIndex(data: any[][]): number {
        // Procura pela linha com headers "data", "lançamento", etc. no Itaú
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (row && row.length > 1) {
                const firstCell = row[0]?.toString().toLowerCase() || '';
                const secondCell = row[1]?.toString().toLowerCase() || '';

                if (firstCell.includes('data') && secondCell.includes('lançamento')) {
                    return i;
                }
            }
        }
        return -1;
    }

    private parseItauTransaction(row: any[], accountType: string, lineNumber: number): ParsedTransaction | null {
        // Estrutura Itaú: [0] Data, [1] Lançamento, [2] Ag./Origem, [3] Valor, [4] Saldo
        const data = row[0];
        const lancamento = row[1];
        const agenciaOrigin = row[2];
        const valor = row[3];
        const saldo = row[4];

        // Ignora linhas de saldo e linhas vazias ou informativas
        if (!data || !lancamento || !valor ||
            lancamento.toString().includes('SALDO ANTERIOR') ||
            lancamento.toString().includes('SALDO TOTAL DISPONÍVEL') ||
            lancamento.toString().includes('SALDO TOTAL DISPONÃ')) {
            return null;
        }

        // Monta descrição completa
        let fullDescription = lancamento.toString().trim();
        if (agenciaOrigin && agenciaOrigin.toString().trim() !== '') {
            fullDescription += ` - ${agenciaOrigin.toString().trim()}`;
        }

        if (!fullDescription) {
            throw new Error('Descrição em branco');
        }

        // Parseia data - formato: "DD/MM/YYYY"
        const date = this.parseDate(data.toString());
        if (!date) {
            throw new Error('Data inválida');
        }

        // Valida se a data não é futura
        if (!this.isValidTransactionDate(date)) {
            throw new Error('Data futura - transação ignorada');
        }

        // Parseia valor
        const amount = this.parseItauAmount(valor);
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
                agenciaOrigin,
                originalData: data,
                originalValor: valor,
                saldo,
                raw: row
            }
        };
    }

    private parseItauAmount(valor: any): number {
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
