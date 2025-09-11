import * as fs from 'fs';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { BankParser, ParseResult, ParseOptions } from './BankParser';
import { ParsedTransaction } from '../csvParser';
import * as iconv from 'iconv-lite';

/**
 * Parser específico para arquivos do Bradesco
 */
export class BradescoParser extends BankParser {
    readonly bankName = 'Bradesco';
    readonly supportedFormats = ['csv'];

    canParse(filePath: string, firstLines: string[]): boolean {
        const fileName = filePath.toLowerCase();
        if (fileName.includes('bradesco')) return true;

        // Verifica estrutura característica do Bradesco
        // O Bradesco tem várias linhas de cabeçalho antes dos dados
        const content = firstLines.join('\n').toLowerCase();
        return content.includes('bradesco') ||
            (content.includes('data') && content.includes('debito') && content.includes('credito'));
    }

    async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        return new Promise((resolve) => {
            const transactions: ParsedTransaction[] = [];
            const errors: string[] = [];
            let totalProcessed = 0;

            try {
                // Tenta primeiro UTF-8, depois ISO-8859-1 se necessário
                let content: string;
                const buffer = fs.readFileSync(filePath);

                try {
                    content = buffer.toString('utf8');
                    // Verifica se a codificação UTF-8 está funcionando
                    if (content.includes('Histórico') || content.includes('Crédito')) {
                        console.log('🔤 Bradesco: Usando codificação UTF-8');
                    } else {
                        throw new Error('UTF-8 não funciona');
                    }
                } catch {
                    content = iconv.decode(buffer, 'iso-8859-1');
                    console.log('🔤 Bradesco: Usando codificação ISO-8859-1');
                }

                const accountType = this.detectAccountTypeFromFile(filePath);

                // Divide em linhas e encontra onde começam os dados
                const lines = content.split('\n');
                const dataStartIndex = this.findDataStartIndex(lines);

                console.log(`🏦 Bradesco: Dados começam na linha ${dataStartIndex + 1}`);

                if (dataStartIndex === -1) {
                    // Arquivo sem dados - pode ser extrato vazio
                    console.log('ℹ️ Bradesco: Arquivo sem transações (extrato vazio)');
                    resolve({
                        transactions: [],
                        errors: ['Arquivo sem transações - extrato vazio ou apenas cabeçalhos'],
                        totalProcessed: 0,
                        bankName: this.bankName,
                        accountType
                    });
                    return;
                }

                // Processa as linhas de dados com o header correto
                const headerLine = lines[dataStartIndex - 1]; // Linha anterior é o header

                // Filtra apenas linhas válidas de transações
                const validDataLines = [];
                for (let i = dataStartIndex; i < lines.length; i++) {
                    const line = lines[i].trim();

                    // Para se encontrar linha vazia ou de rodapé
                    if (!line || line === '' || /^[;\s]*$/.test(line)) {
                        break;
                    }

                    // Para se não parecer uma transação
                    const parts = line.split(';');
                    if (parts.length < 4 || !this.looksLikeDate(parts[0].trim())) {
                        break;
                    }

                    validDataLines.push(line);
                }

                console.log(`✅ Bradesco: ${validDataLines.length} linhas de dados válidas encontradas`);

                const dataContent = [headerLine, ...validDataLines].join('\n');

                Readable.from([dataContent])
                    .pipe(csv({ separator: ';' })) // Bradesco usa ponto e vírgula
                    .on('data', (row) => {
                        try {
                            totalProcessed++;

                            const transaction = this.parseBradescoTransaction(row, accountType);

                            if (transaction) {
                                transactions.push(transaction);
                            }

                        } catch (error) {
                            errors.push(`Linha ${totalProcessed + dataStartIndex}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                        }
                    })
                    .on('end', () => {
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
                    accountType: 'conta_corrente'
                });
            }
        });
    }

    private detectAccountTypeFromFile(filePath: string): string {
        const fileName = filePath.toLowerCase();

        if (fileName.includes('poupanca') || fileName.includes('poupança')) {
            return 'conta_poupanca';
        }

        if (fileName.includes('cartao') || fileName.includes('credito')) {
            return 'cartao_credito';
        }

        return 'conta_corrente';
    }

    private findDataStartIndex(lines: string[]): number {
        // Procura pela linha que tem a estrutura de dados do Bradesco
        // Estrutura típica: "Data;Histórico;Docto.;Crédito (R$);Débito (R$);Saldo (R$)"
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();

            // Para no "Últimos Lançamentos" - ignora tudo após isso
            if (line.includes('últimos lançamentos') || line.includes('ultimos lancamentos')) {
                console.log(`⚠️ Bradesco: Parando antes de "Últimos Lançamentos" na linha ${i + 1}`);
                return -1; // Indica que não há dados para processar
            }

            // Headers típicos do Bradesco (com e sem acentos, e com codificação corrompida)
            if (line.includes('data') &&
                (line.includes('histórico') || line.includes('historico') || line.includes('histã³rico')) &&
                (line.includes('crédito') || line.includes('credito') || line.includes('crã©dito') ||
                    line.includes('débito') || line.includes('debito') || line.includes('dã©bito'))) {

                // Procura a primeira linha com dados reais após este header
                for (let j = i + 1; j < lines.length; j++) {
                    const dataLine = lines[j].trim();

                    // Para se encontrar "Últimos Lançamentos"
                    if (dataLine.toLowerCase().includes('últimos lançamentos') ||
                        dataLine.toLowerCase().includes('ultimos lancamentos')) {
                        console.log(`⚠️ Bradesco: Parando antes de "Últimos Lançamentos" na linha ${j + 1}`);
                        return -1;
                    }

                    // Ignora linhas vazias ou só com separadores
                    if (!dataLine || dataLine === '' || /^[;\s]*$/.test(dataLine)) {
                        continue;
                    }

                    // Ignora linhas de status/filtro
                    if (dataLine.toLowerCase().includes('extrato inexistente') ||
                        dataLine.toLowerCase().includes('filtro de resultado') ||
                        dataLine.toLowerCase().includes('movimentação entre') ||
                        dataLine.toLowerCase().includes('os dados acima') ||
                        dataLine.toLowerCase().includes('não há lançamentos')) {
                        continue;
                    }

                    // Se tem dados que parecem uma transação
                    const parts = dataLine.split(';');
                    if (parts.length >= 4 && this.looksLikeDate(parts[0].trim())) {
                        console.log(`✅ Bradesco: Dados encontrados na linha ${j + 1}`);
                        return j;
                    }
                }
            }
        }

        console.log('⚠️ Bradesco: Nenhum dado encontrado - arquivo pode estar vazio');
        return -1;
    } private looksLikeDate(str: string): boolean {
        // Verifica se string parece uma data (DD/MM/YYYY ou DD/MM/YY)
        return /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(str);
    }

    private parseBradescoTransaction(row: any, accountType: string): ParsedTransaction | null {
        // Headers típicos do Bradesco: Data;Descrição;Débito;Crédito;Saldo
        const keys = Object.keys(row);

        // Encontra as colunas dinamicamente
        const dateField = keys.find(k => k.toLowerCase().includes('data')) || keys[0];
        const descriptionField = keys.find(k => k.toLowerCase().includes('descri')) || keys[1];
        const debitField = keys.find(k => k.toLowerCase().includes('debito') || k.toLowerCase().includes('débito'));
        const creditField = keys.find(k => k.toLowerCase().includes('credito') || k.toLowerCase().includes('crédito'));

        const dateStr = row[dateField];
        const description = row[descriptionField];
        const debitValue = row[debitField] || '';
        const creditValue = row[creditField] || '';

        // Validações
        const date = this.parseDate(dateStr);
        if (!date) {
            throw new Error('Data inválida');
        }

        if (!description || description.trim() === '') {
            throw new Error('Descrição em branco');
        }

        // Determina o valor (débito é negativo, crédito é positivo)
        let amount = 0;
        let type: 'INCOME' | 'EXPENSE' = 'EXPENSE';

        if (debitValue && debitValue.trim() !== '') {
            const debitAmount = this.parseAmount(debitValue);
            if (debitAmount > 0) {
                amount = -Math.abs(debitAmount);
                type = 'EXPENSE';
            }
        } else if (creditValue && creditValue.trim() !== '') {
            const creditAmount = this.parseAmount(creditValue);
            if (creditAmount > 0) {
                amount = Math.abs(creditAmount);
                type = 'INCOME';
            }
        }

        if (amount === 0) {
            // Transações com valor zero são ignoradas (ex: lançamentos de ajuste)
            return null;
        }

        return {
            date,
            description: description.trim(),
            amount,
            type,
            originalData: {
                bank: this.bankName,
                accountType,
                debit: debitValue,
                credit: creditValue,
                raw: row
            }
        };
    }
}
