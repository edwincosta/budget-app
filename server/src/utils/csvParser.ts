import csv from 'csv-parser';
import * as fs from 'fs';
import { Readable } from 'stream';
import * as iconv from 'iconv-lite';
import * as chardet from 'chardet';

export interface ParsedTransaction {
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    date: Date;
    originalData?: any; // Dados originais para debug
}

export interface ParseOptions {
    dateRange?: {
        startDate?: Date;
        endDate?: Date;
    };
}

export interface ParseResult {
    transactions: ParsedTransaction[];
    errors: string[];
    totalProcessed: number;
}

/**
 * Parser para arquivos CSV de extratos bancários
 * Suporta formatos comuns dos principais bancos brasileiros
 */
export class CSVParser {

    /**
     * Detecta o encoding do arquivo
     */
    private static detectEncoding(buffer: Buffer): string {
        const detected = chardet.detect(buffer);

        // Padrões comuns no Brasil
        if (detected?.includes('UTF-8')) return 'utf8';
        if (detected?.includes('ISO-8859-1') || detected?.includes('latin1')) return 'latin1';
        if (detected?.includes('windows-1252')) return 'win1252';

        // Fallback para UTF-8
        return 'utf8';
    }

    /**
     * Detecta o formato do CSV baseado no header e estrutura
     */
    private static detectFormat(headers: string[], sampleRow?: any): 'BANCO_BRASIL' | 'BRADESCO' | 'C6' | 'CLEAR' | 'INTER' | 'ITAU' | 'NUBANK' | 'NUBANK_BR' | 'NUBANK_CARTAO' | 'XP' | 'SANTANDER' | 'GENERIC' {
        const headerStr = headers.join('|').toLowerCase();

        // XP Investimentos - formato específico
        if (headerStr.includes('data') && headerStr.includes('descricao') && headerStr.includes('valor') && headerStr.includes('saldo')) {
            return 'XP';
        }

        // Bradesco - separado por ponto e vírgula
        if (headerStr.includes('data') && headerStr.includes('histórico') && headerStr.includes('crédito') && headerStr.includes('débito')) {
            return 'BRADESCO';
        }

        // C6 Bank - identificado por estrutura específica
        if (headerStr.includes('data') && headerStr.includes('descrição') && headerStr.includes('valor') && !headerStr.includes('saldo')) {
            return 'C6';
        }

        // Clear
        if (headerStr.includes('data') && headerStr.includes('descrição') && headerStr.includes('valor') && headerStr.includes('tipo')) {
            return 'CLEAR';
        }

        // Inter - pode ter colunas separadas para débito/crédito
        if (headerStr.includes('data') && headerStr.includes('descrição') && (headerStr.includes('valor') || headerStr.includes('débito') || headerStr.includes('crédito'))) {
            return 'INTER';
        }

        // Formato Nubank extrato brasileiro: Data, Valor, Identificador, Descrição
        if (headerStr.includes('data') && headerStr.includes('valor') && headerStr.includes('identificador') && headerStr.includes('descrição')) {
            return 'NUBANK_BR';
        }

        // Formato Nubank cartão de crédito: date, title, amount (valores positivos são gastos)
        if (headerStr.includes('date') && headerStr.includes('title') && headerStr.includes('amount')) {
            return 'NUBANK_CARTAO';
        }

        // Formato Nubank original: date, description, amount
        if (headerStr.includes('date') && headerStr.includes('description') && headerStr.includes('amount')) {
            return 'NUBANK';
        }

        // Banco do Brasil
        if (headerStr.includes('data') && headerStr.includes('histórico') && headerStr.includes('valor') && !headerStr.includes('crédito')) {
            return 'BANCO_BRASIL';
        }

        // Formato genérico
        return 'GENERIC';
    }

    /**
     * Parseia data em diferentes formatos brasileiros
     */
    private static parseDate(dateStr: string): Date {
        if (!dateStr) throw new Error('Data inválida');

        // Remove espaços extras
        const cleanDate = dateStr.trim();

        // Formato XP: DD/MM/YY às HH:mm:ss
        const xpDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})\s+às\s+\d{2}:\d{2}:\d{2}$/;
        const xpDateMatch = cleanDate.match(xpDateRegex);
        if (xpDateMatch) {
            const [, day, month, year] = xpDateMatch;
            const fullYear = parseInt(year) + 2000; // Assume anos 20xx
            return new Date(fullYear, parseInt(month) - 1, parseInt(day));
        }

        // Formato: DD/MM/YYYY
        const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const ddmmyyyyMatch = cleanDate.match(ddmmyyyyRegex);
        if (ddmmyyyyMatch) {
            const [, day, month, year] = ddmmyyyyMatch;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }

        // Formato: YYYY-MM-DD
        const yyyymmddRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
        const yyyymmddMatch = cleanDate.match(yyyymmddRegex);
        if (yyyymmddMatch) {
            const [, year, month, day] = yyyymmddMatch;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }

        // Formato: DD-MM-YYYY
        const ddmmyyyyDashRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
        const ddmmyyyyDashMatch = cleanDate.match(ddmmyyyyDashRegex);
        if (ddmmyyyyDashMatch) {
            const [, day, month, year] = ddmmyyyyDashMatch;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }

        throw new Error(`Formato de data não reconhecido: ${dateStr}`);
    }

    /**
     * Valida se a data não é futura
     */
    private static isValidTransactionDate(date: Date): boolean {
        if (!date || isNaN(date.getTime())) return false;

        const today = new Date();
        today.setHours(23, 59, 59, 999); // Final do dia atual

        return date <= today;
    }

    /**
     * Parseia valor monetário brasileiro
     */
    private static parseAmount(amountStr: string): number {
        if (!amountStr) return 0;

        // Remove espaços e caracteres especiais, mantém apenas números, vírgula, ponto e sinal
        let cleanAmount = amountStr.toString().trim();

        // Remove símbolos de moeda (R$, etc)
        cleanAmount = cleanAmount.replace(/[R$\s]/g, '');

        // Detecta se usa vírgula como decimal (padrão brasileiro)
        const hasCommaDecimal = /\d{1,3}(?:\.\d{3})*,\d{2}$/.test(cleanAmount);

        if (hasCommaDecimal) {
            // Formato brasileiro: 1.234.567,89
            cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
        }

        // Remove parenteses (indicam valor negativo em alguns bancos)
        const isNegative = cleanAmount.includes('(') && cleanAmount.includes(')');
        cleanAmount = cleanAmount.replace(/[()]/g, '');

        const amount = parseFloat(cleanAmount);
        if (isNaN(amount)) {
            throw new Error(`Valor inválido: ${amountStr}`);
        }

        return isNegative ? -amount : amount;
    }

    /**
     * Mapeia linha do CSV baseado no formato detectado
     */
    private static mapTransaction(row: any, format: string): ParsedTransaction {
        let description: string = '';
        let amount: number = 0;
        let date: Date;

        switch (format) {
            case 'BRADESCO':
                // Formato: Data, Histórico, Valor, Saldo
                description = row['Histórico'] || row['historico'] || row['Descrição'] || '';
                amount = this.parseAmount(row['Valor'] || row['valor'] || '0');
                date = this.parseDate(row['Data'] || row['data'] || '');
                break;

            case 'C6':
                // Formato: Data, Descrição, Valor, Categoria
                description = row['Descrição'] || row['descrição'] || '';
                amount = this.parseAmount(row['Valor'] || row['valor'] || '0');
                date = this.parseDate(row['Data'] || row['data'] || '');
                break;

            case 'CLEAR':
                // Formato: Data, Descrição, Valor, Tipo
                description = row['Descrição'] || row['descrição'] || '';
                amount = this.parseAmount(row['Valor'] || row['valor'] || '0');
                date = this.parseDate(row['Data'] || row['data'] || '');
                break;

            case 'INTER':
                // Formato: Data, Descrição, Débito/Crédito ou Valor
                description = row['Descrição'] || row['descrição'] || row['Histórico'] || '';

                // Inter pode ter colunas separadas para débito e crédito
                let interAmount = 0;
                if (row['Valor']) {
                    interAmount = this.parseAmount(row['Valor']);
                } else {
                    const credito = this.parseAmount(row['Crédito'] || row['credito'] || '0');
                    const debito = this.parseAmount(row['Débito'] || row['debito'] || '0');
                    interAmount = credito - debito;
                }

                amount = interAmount;
                date = this.parseDate(row['Data'] || row['data'] || '');
                break;

            case 'XP':
                // Formato: Data, Descrição/Histórico, Valor, Movimentação/Tipo
                description = row['Descrição'] || row['descrição'] || row['Histórico'] || row['historico'] || '';
                amount = this.parseAmount(row['Valor'] || row['valor'] || '0');
                date = this.parseDate(row['Data'] || row['data'] || '');
                break;

            case 'NUBANK_BR':
                // Formato: Data, Valor, Identificador, Descrição (valores negativos são gastos)
                description = row['Descrição'] || row['descrição'] || '';
                amount = this.parseAmount(row['Valor'] || row['valor'] || '0');
                date = this.parseDate(row['Data'] || row['data'] || '');
                break;

            case 'NUBANK_CARTAO':
                // Formato: date, title, amount (cartão de crédito - valores positivos são gastos)
                description = row['title'] || row['titulo'] || '';
                amount = this.parseAmount(row['amount'] || row['valor'] || '0');
                date = this.parseDate(row['date'] || row['data'] || '');
                // No cartão de crédito do Nubank, valores positivos representam gastos
                // Exceto se for explicitamente um pagamento recebido
                if (!description.toLowerCase().includes('pagamento recebido') &&
                    !description.toLowerCase().includes('transferência recebida') &&
                    !description.toLowerCase().includes('pix recebido')) {
                    amount = -Math.abs(amount); // Força valor negativo para gastos
                }
                break;

            case 'BANCO_BRASIL':
                description = row['Histórico'] || row['historico'] || row['Descrição'] || '';
                amount = this.parseAmount(row['Valor'] || row['valor'] || '0');
                date = this.parseDate(row['Data'] || row['data'] || '');
                break;

            case 'NUBANK':
                description = row['description'] || row['descricao'] || '';
                amount = this.parseAmount(row['amount'] || row['valor'] || '0');
                date = this.parseDate(row['date'] || row['data'] || '');
                break;

            case 'GENERIC':
            default:
                // Tenta mapear campos comuns
                const possibleDescriptions = ['description', 'descricao', 'historico', 'memo', 'details', 'title', 'Descrição', 'Histórico'];
                const possibleAmounts = ['amount', 'valor', 'value', 'quantia', 'Valor'];
                const possibleDates = ['date', 'data', 'transaction_date', 'dt_transacao', 'Data'];

                description = possibleDescriptions.find(key => row[key]) ? row[possibleDescriptions.find(key => row[key])!] : '';

                const amountKey = possibleAmounts.find(key => row[key]);
                amount = amountKey ? this.parseAmount(row[amountKey]) : 0;

                const dateKey = possibleDates.find(key => row[key]);
                date = dateKey ? this.parseDate(row[dateKey]) : new Date();
                break;
        }

        // Determina o tipo baseado no valor
        const type: 'INCOME' | 'EXPENSE' = amount >= 0 ? 'INCOME' : 'EXPENSE';

        // Valida se a data não é futura
        if (!this.isValidTransactionDate(date)) {
            throw new Error('Data futura - transação ignorada');
        }

        return {
            description: description.trim(),
            amount: Math.abs(amount), // Sempre positivo, o tipo determina se é entrada ou saída
            type,
            date,
            originalData: row // Salva dados originais para debug
        };
    }

    /**
     * Parseia arquivo CSV
     */
    static async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        return new Promise((resolve) => {
            const transactions: ParsedTransaction[] = [];
            const errors: string[] = [];
            let totalProcessed = 0;
            let format: string = 'GENERIC';
            let isFirstRow = true;

            try {
                // Detecta encoding
                const buffer = fs.readFileSync(filePath);
                const encoding = this.detectEncoding(buffer);

                // Converte para UTF-8
                const content = iconv.decode(buffer, encoding);
                const stream = Readable.from([content]);

                stream
                    .pipe(csv({
                        separator: ',' // Separador padrão
                    }))
                    .on('data', (row) => {
                        try {
                            totalProcessed++;

                            // Detecta formato no primeiro registro
                            if (isFirstRow) {
                                const headers = Object.keys(row);
                                format = this.detectFormat(headers);
                                isFirstRow = false;
                            }

                            // Pula linhas vazias ou inválidas
                            if (Object.values(row).every(value => !value || value.toString().trim() === '')) {
                                return;
                            }

                            const transaction = this.mapTransaction(row, format);

                            // Validações básicas
                            if (!transaction.description) {
                                errors.push(`Linha ${totalProcessed}: Descrição em branco`);
                                return;
                            }

                            if (!transaction.date || isNaN(transaction.date.getTime())) {
                                errors.push(`Linha ${totalProcessed}: Data inválida`);
                                return;
                            }

                            // Aplica filtro de data se especificado
                            if (options?.dateRange) {
                                if (options.dateRange.startDate && transaction.date < options.dateRange.startDate) {
                                    return; // Pula transação fora do período
                                }
                                if (options.dateRange.endDate && transaction.date > options.dateRange.endDate) {
                                    return; // Pula transação fora do período
                                }
                            }

                            transactions.push(transaction);

                        } catch (error) {
                            errors.push(`Linha ${totalProcessed}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                        }
                    })
                    .on('end', () => {
                        resolve({
                            transactions,
                            errors,
                            totalProcessed
                        });
                    })
                    .on('error', (error) => {
                        errors.push(`Erro ao processar arquivo: ${error.message}`);
                        resolve({
                            transactions,
                            errors,
                            totalProcessed
                        });
                    });

            } catch (error) {
                resolve({
                    transactions: [],
                    errors: [`Erro ao ler arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
                    totalProcessed: 0
                });
            }
        });
    }
}
