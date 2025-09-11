import * as fs from 'fs';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { BankParser, ParseResult, ParseOptions } from './BankParser';
import { ParsedTransaction } from '../csvParser';

/**
 * Parser específico para arquivos do Banco Inter
 */
export class InterParser extends BankParser {
    readonly bankName = 'Inter';
    readonly supportedFormats = ['csv'];

    canParse(filePath: string, firstLines: string[]): boolean {
        const fileName = filePath.toLowerCase();
        if (fileName.includes('inter_') || fileName.includes('inter-')) return true;

        // Verifica estrutura característica do Inter
        const content = firstLines.join('\n').toLowerCase();
        return content.includes('extrato conta corrente') &&
            content.includes('data lançamento') &&
            content.includes('histórico') &&
            content.includes('descrição');
    }

    async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        return new Promise((resolve) => {
            const transactions: ParsedTransaction[] = [];
            const errors: string[] = [];
            let totalProcessed = 0;

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const accountType = this.detectAccountTypeFromFile(filePath);

                // Encontra onde começam os dados (após o cabeçalho)
                const lines = content.split('\n');
                const dataStartIndex = this.findDataStartIndex(lines);

                console.log(`🏦 Inter: Dados começam na linha ${dataStartIndex + 1}`);

                if (dataStartIndex === -1) {
                    resolve({
                        transactions: [],
                        errors: ['Arquivo sem transações - extrato vazio ou apenas cabeçalhos'],
                        totalProcessed: 0,
                        bankName: this.bankName,
                        accountType
                    });
                    return;
                }

                // Processa apenas as linhas de dados
                const dataLines = lines.slice(dataStartIndex);
                const dataContent = dataLines.join('\n');

                // Verifica se há dados reais para processar
                if (dataLines.length <= 1 || dataLines.every(line => line.trim() === '')) {
                    console.log('ℹ️ Inter: Arquivo sem transações (extrato vazio)');
                    resolve({
                        transactions: [],
                        errors: ['Arquivo sem transações - extrato vazio'],
                        totalProcessed: 0,
                        bankName: this.bankName,
                        accountType
                    });
                    return;
                }

                Readable.from([dataContent])
                    .pipe(csv({ separator: ';' })) // Inter usa ponto e vírgula
                    .on('data', (row) => {
                        try {
                            totalProcessed++;

                            const transaction = this.parseInterTransaction(row, accountType);

                            if (transaction) {
                                transactions.push(transaction);
                            }

                        } catch (error) {
                            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
                            errors.push(`Linha ${totalProcessed + dataStartIndex}: ${errorMsg}`);
                        }
                    })
                    .on('end', () => {
                        const filteredTransactions = this.filterByDateRange(transactions, options?.dateRange);

                        console.log(`✅ Inter: ${filteredTransactions.length} transações processadas de ${totalProcessed} linhas`);

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

        if (fileName.includes('cartao') || fileName.includes('credito')) {
            return 'cartao_credito';
        }

        if (fileName.includes('poupanca') || fileName.includes('poupança')) {
            return 'conta_poupanca';
        }

        if (fileName.includes('investimento')) {
            return 'conta_investimento';
        }

        return 'conta_corrente';
    }

    private findDataStartIndex(lines: string[]): number {
        // Procura pela linha com os headers do Inter
        // Formato: "Data Lançamento;Histórico;Descrição;Valor;Saldo"
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();

            if (line.includes('data lançamento') &&
                line.includes('histórico') &&
                line.includes('descrição') &&
                line.includes('valor')) {

                // Retorna o próprio índice (linha do header) para usar com csv-parser
                return i;
            }
        }

        return -1;
    }

    private parseInterTransaction(row: any, accountType: string): ParsedTransaction | null {
        // Headers do Inter: Data Lançamento;Histórico;Descrição;Valor;Saldo
        const dateStr = row['Data Lançamento'] || '';
        const historico = row['Histórico'] || '';
        const descricao = row['Descrição'] || '';
        const valorStr = row['Valor'] || '';

        // Combina histórico e descrição para formar a descrição completa
        let fullDescription = '';
        if (historico && historico.trim() !== '') {
            fullDescription = historico.trim();
            if (descricao && descricao.trim() !== '' && descricao.trim() !== historico.trim()) {
                fullDescription += ' - ' + descricao.trim();
            }
        } else if (descricao && descricao.trim() !== '') {
            fullDescription = descricao.trim();
        }

        // Valida descrição
        if (!fullDescription) {
            throw new Error('Descrição em branco');
        }

        // Parseia data
        const date = this.parseDate(dateStr);
        if (!date) {
            throw new Error('Data inválida');
        }

        // Valida se a data não é futura
        if (!this.isValidTransactionDate(date)) {
            throw new Error('Data futura - transação ignorada');
        }

        // Parseia valor
        const amount = this.parseInterAmount(valorStr);
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
                historico,
                originalDescricao: descricao,
                originalValor: valorStr,
                saldo: row['Saldo'],
                raw: row
            }
        };
    }

    private parseInterAmount(valueStr: string): number {
        if (!valueStr) return 0;

        // Inter pode usar vírgula como separador decimal
        let cleaned = valueStr.toString().trim()
            .replace(/[^\d,.-]/g, '')
            .replace(/\s+/g, '');

        // Se começa com hífen, é negativo
        const isNegative = cleaned.startsWith('-');
        if (isNegative) {
            cleaned = cleaned.substring(1);
        }

        // Substitui vírgula por ponto para decimal (formato brasileiro)
        if (cleaned.includes(',')) {
            // Se tem ponto e vírgula, assume que vírgula é decimal
            if (cleaned.includes('.')) {
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else {
                cleaned = cleaned.replace(',', '.');
            }
        }

        const amount = parseFloat(cleaned);
        if (isNaN(amount)) return 0;

        return isNegative ? -amount : amount;
    }
}
