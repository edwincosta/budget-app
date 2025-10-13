import { ExcelReader } from '../excelReader';
import { BankParser, ParseResult, ParseOptions } from './BankParser';
import { ParsedTransaction } from '../csvParser';

/**
 * Parser específico para arquivos Excel do BTG Pactual
 * Formato: Excel (.xlsx/.xls) com estrutura específica do BTG
 */
export class BTGParser extends BankParser {
    readonly bankName = 'BTG';
    readonly supportedFormats = ['xlsx', 'xls'];

    canParse(filePath: string, firstLines: string[]): boolean {
        const fileName = filePath.toLowerCase();

        // Deve ter BTG no nome e ser Excel
        if (!fileName.includes('btg')) return false;
        if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) return false;

        return true;
    }

    async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        const transactions: ParsedTransaction[] = [];
        const errors: string[] = [];
        let totalProcessed = 0;

        try {
            console.log('🏦 BTG: Processando arquivo Excel');

            const data = await ExcelReader.readFile(filePath);

            const accountType = this.detectAccountTypeFromFile(filePath);

            // Encontra onde começam os dados (após header "Data e hora")
            const dataStartIndex = this.findDataStartIndex(data);

            if (dataStartIndex === -1) {
                return {
                    transactions: [],
                    errors: ['Estrutura do arquivo BTG não reconhecida'],
                    totalProcessed: 0,
                    bankName: this.bankName,
                    accountType
                };
            }

            console.log(`🏦 BTG: Dados começam na linha ${dataStartIndex + 1}`);

            // Processa cada linha de dados
            for (let i = dataStartIndex + 1; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                try {
                    totalProcessed++;

                    const transaction = this.parseBTGTransaction(row, accountType, i + 1);

                    if (transaction) {
                        transactions.push(transaction);
                    }

                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
                    errors.push(`Linha ${i + 1}: ${errorMsg}`);
                }
            }

            const filteredTransactions = this.filterByDateRange(transactions, options?.dateRange);

            console.log(`✅ BTG: ${filteredTransactions.length} transações processadas de ${totalProcessed} linhas`);

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
        // Procura pela linha com "Data e hora" no BTG
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (row && row.length > 1) {
                const cell = row[1]?.toString().toLowerCase() || '';
                if (cell.includes('data e hora') || cell.includes('data') && cell.includes('hora')) {
                    return i;
                }
            }
        }
        return -1;
    }

    private parseBTGTransaction(row: any[], accountType: string, lineNumber: number): ParsedTransaction | null {
        // Estrutura BTG: [0] Vazio, [1] Data e hora, [2] Categoria, [3] Transação, [4] Vazio, [5] Descrição, [6-8] Vazio, [9] Valor
        const dataHora = row[1];
        const categoria = row[2];
        const transacao = row[3];
        const descricao = row[5];
        const valor = row[9];

        // Ignora linhas de saldo diário e vazias
        if (!dataHora || !descricao || descricao.toString().includes('Saldo Diário')) {
            return null;
        }

        // Monta descrição completa
        let fullDescription = '';
        if (categoria && categoria.toString().trim() !== '') {
            fullDescription += categoria.toString().trim();
        }
        if (transacao && transacao.toString().trim() !== '') {
            if (fullDescription) fullDescription += ' - ';
            fullDescription += transacao.toString().trim();
        }
        if (descricao && descricao.toString().trim() !== '') {
            if (fullDescription) fullDescription += ' - ';
            fullDescription += descricao.toString().trim();
        }

        if (!fullDescription) {
            throw new Error('Descrição em branco');
        }

        // Parseia data - formato: "DD/MM/YYYY HH:mm"
        const date = this.parseBTGDate(dataHora);
        if (!date) {
            throw new Error('Data inválida');
        }

        // Valida se a data não é futura
        if (!this.isValidTransactionDate(date)) {
            throw new Error('Data futura - transação ignorada');
        }

        // Parseia valor
        const amount = this.parseBTGAmount(valor);
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
                categoria,
                transacao,
                originalDescricao: descricao,
                originalDataHora: dataHora,
                originalValor: valor,
                raw: row
            }
        };
    }

    private parseBTGDate(dataHoraStr: any): Date | null {
        if (!dataHoraStr) return null;

        const str = dataHoraStr.toString().trim();

        // Formato: "DD/MM/YYYY HH:mm"
        const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
        if (match) {
            const [, day, month, year, hour, minute] = match;
            return new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute)
            );
        }

        // Fallback para outros formatos
        return this.parseDate(str);
    }

    private parseBTGAmount(valor: any): number {
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
