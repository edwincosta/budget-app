import * as fs from 'fs';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { BankParser, ParseResult, ParseOptions } from './BankParser';
import { ParsedTransaction } from '../csvParser';

/**
 * Parser específico para arquivos do C6 Bank
 */
export class C6Parser extends BankParser {
    readonly bankName = 'C6';
    readonly supportedFormats = ['csv'];

    canParse(filePath: string, firstLines: string[]): boolean {
        const fileName = filePath.toLowerCase();
        if (fileName.includes('c6-') || fileName.includes('c6_')) return true;

        // Verifica estrutura característica do C6
        const content = firstLines.join('\n').toLowerCase();
        return content.includes('c6 bank') ||
            content.includes('extrato de conta corrente c6') ||
            (content.includes('data lançamento') && content.includes('entrada(r$)') && content.includes('saída(r$)'));
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

                console.log(`🏦 C6: Dados começam na linha ${dataStartIndex + 1}`);

                if (dataStartIndex === -1) {
                    resolve({
                        transactions: [],
                        errors: ['Não foi possível encontrar dados no arquivo'],
                        totalProcessed: 0,
                        bankName: this.bankName,
                        accountType
                    });
                    return;
                }

                // Processa apenas as linhas de dados
                const dataLines = lines.slice(dataStartIndex);
                const dataContent = dataLines.join('\n');

                Readable.from([dataContent])
                    .pipe(csv())
                    .on('data', (row) => {
                        try {
                            totalProcessed++;

                            const transaction = this.parseC6Transaction(row, accountType);

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

                        console.log(`✅ C6: ${filteredTransactions.length} transações processadas de ${totalProcessed} linhas`);

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

        return 'conta_corrente';
    }

    private findDataStartIndex(lines: string[]): number {
        // Procura pela linha com os headers do C6
        // Formato: "Data Lançamento,Data Contábil,Título,Descrição,Entrada(R$),Saída(R$),Saldo do Dia(R$)"
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();

            if (line.includes('data lançamento') &&
                line.includes('entrada(r$)') &&
                line.includes('saída(r$)')) {

                // Retorna o próprio índice (linha do header) para usar com csv-parser
                return i;
            }
        }

        return -1;
    }

    private parseC6Transaction(row: any, accountType: string): ParsedTransaction | null {
        // Headers do C6: Data Lançamento,Data Contábil,Título,Descrição,Entrada(R$),Saída(R$),Saldo do Dia(R$)
        const dateStr = row['Data Lançamento'] || row['Data Contábil'];
        let title = row['Título'] || '';
        let description = row['Descrição'] || '';
        const entradaStr = row['Entrada(R$)'] || '0';
        const saidaStr = row['Saída(R$)'] || '0';

        // Remove aspas extras que podem estar nos dados
        title = title.toString().replace(/^"|"$/g, '').trim();
        description = description.toString().replace(/^"|"$/g, '').trim();

        // Combina título e descrição para formar a descrição completa
        let fullDescription = '';
        if (title && title !== '') {
            fullDescription = title;
            if (description && description !== '' && description !== title) {
                fullDescription += ' - ' + description;
            }
        } else if (description && description !== '') {
            fullDescription = description;
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

        // Parseia valores de entrada e saída
        const entrada = this.parseAmount(entradaStr);
        const saida = this.parseAmount(saidaStr);

        // Determina valor e tipo
        let amount = 0;
        let type: 'INCOME' | 'EXPENSE' = 'EXPENSE';

        if (entrada > 0) {
            amount = entrada;
            type = 'INCOME';
        } else if (saida > 0) {
            amount = saida;
            type = 'EXPENSE';
        }

        if (amount === 0) {
            throw new Error('Valor inválido');
        }

        return {
            date,
            description: fullDescription,
            amount,
            type,
            originalData: {
                bank: this.bankName,
                accountType,
                title,
                originalDescription: description,
                entrada: entradaStr,
                saida: saidaStr,
                saldo: row['Saldo do Dia(R$)'],
                raw: row
            }
        };
    }
}
