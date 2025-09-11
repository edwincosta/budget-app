import pdf from 'pdf-parse';
import * as fs from 'fs';
import { ParsedTransaction, ParseResult, ParseOptions } from './csvParser';

/**
 * Parser para arquivos PDF de extratos bancários
 * Suporta formatos comuns de faturas de cartão e extratos
 */
export class PDFParser {

    /**
     * Extrai transações de texto de PDF baseado em padrões regex
     */
    private static extractTransactions(text: string): ParsedTransaction[] {
        const transactions: ParsedTransaction[] = [];
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Padrões regex para diferentes bancos brasileiros
        const patterns = [
            // Padrão Nubank: DD/MM DESCRIÇÃO VALOR
            {
                regex: /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+(R\$\s*[\d.,]+)$/,
                bank: 'NUBANK',
                dateGroup: 1,
                descriptionGroup: 2,
                amountGroup: 3
            },

            // Padrão Itaú: DD/MM/YYYY DESCRIÇÃO VALOR
            {
                regex: /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([\d.,]+)$/,
                bank: 'ITAU',
                dateGroup: 1,
                descriptionGroup: 2,
                amountGroup: 3
            },

            // Padrão Banco do Brasil: DD/MM HISTÓRICO VALOR
            {
                regex: /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+([\d.,]+[+-]?)$/,
                bank: 'BANCO_BRASIL',
                dateGroup: 1,
                descriptionGroup: 2,
                amountGroup: 3
            },

            // Padrão genérico: DATA DESCRIÇÃO VALOR
            {
                regex: /(\d{1,2}\/\d{1,2}(?:\/\d{4})?)\s+(.{10,}?)\s+(R?\$?\s*[\d.,]+[+-]?)$/,
                bank: 'GENERIC',
                dateGroup: 1,
                descriptionGroup: 2,
                amountGroup: 3
            }
        ];

        const currentYear = new Date().getFullYear();

        for (const line of lines) {
            // Pula linhas muito curtas ou que parecem ser cabeçalho
            if (line.length < 10) continue;
            if (this.isHeaderLine(line)) continue;

            for (const pattern of patterns) {
                const match = line.match(pattern.regex);
                if (match) {
                    try {
                        const dateStr = match[pattern.dateGroup];
                        const description = match[pattern.descriptionGroup].trim();
                        const amountStr = match[pattern.amountGroup];

                        // Parseia data
                        let date = this.parseDate(dateStr, currentYear);

                        // Parseia valor
                        const { amount, isNegative } = this.parseAmount(amountStr);

                        // Filtra descrições muito curtas ou inválidas
                        if (description.length < 3) continue;
                        if (this.isInvalidDescription(description)) continue;

                        const transaction: ParsedTransaction = {
                            description: this.cleanDescription(description),
                            amount: Math.abs(amount),
                            type: isNegative ? 'EXPENSE' : 'INCOME',
                            date,
                            originalData: {
                                line,
                                pattern: pattern.bank
                            }
                        };

                        transactions.push(transaction);
                        break; // Parou no primeiro padrão que funcionou

                    } catch (error) {
                        // Ignora linha com erro de parsing
                        continue;
                    }
                }
            }
        }

        return transactions;
    }

    /**
     * Verifica se linha é cabeçalho ou texto irrelevante
     */
    private static isHeaderLine(line: string): boolean {
        const headerPatterns = [
            /^(data|date|período|periodo|extrato|fatura|página|page)/i,
            /^(saldo|balance|total|subtotal)/i,
            /^(crédito|débito|credit|debit)$/i,
            /^\*+$/, // Linhas só com asteriscos
            /^-+$/, // Linhas só com traços
            /^\d+$/  // Linhas só com números
        ];

        return headerPatterns.some(pattern => pattern.test(line));
    }

    /**
     * Verifica se descrição é inválida
     */
    private static isInvalidDescription(description: string): boolean {
        const invalidPatterns = [
            /^[\d\s.,]+$/, // Só números e espaços
            /^[^\w\s]+$/,  // Só caracteres especiais
            /^(saldo|total|subtotal)$/i,
            /^(cont|continuação)$/i
        ];

        return invalidPatterns.some(pattern => pattern.test(description));
    }

    /**
     * Limpa descrição removendo caracteres desnecessários
     */
    private static cleanDescription(description: string): string {
        return description
            .replace(/\s+/g, ' ') // Multiple spaces -> single space
            .replace(/[^\w\s\-.,]/g, '') // Remove caracteres especiais exceto básicos
            .trim()
            .substring(0, 255); // Limita tamanho
    }

    /**
     * Parseia data considerando ano atual se não informado
     */
    private static parseDate(dateStr: string, currentYear: number): Date {
        // DD/MM/YYYY
        const fullDateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (fullDateMatch) {
            const [, day, month, year] = fullDateMatch;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }

        // DD/MM (assume ano atual)
        const shortDateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
        if (shortDateMatch) {
            const [, day, month] = shortDateMatch;
            let year = currentYear;

            // Se mês é futuro, assume ano anterior
            const now = new Date();
            const transactionDate = new Date(year, parseInt(month) - 1, parseInt(day));
            if (transactionDate > now) {
                year = currentYear - 1;
            }

            return new Date(year, parseInt(month) - 1, parseInt(day));
        }

        throw new Error(`Formato de data inválido: ${dateStr}`);
    }

    /**
     * Parseia valor monetário
     */
    private static parseAmount(amountStr: string): { amount: number; isNegative: boolean } {
        let cleanAmount = amountStr.trim();

        // Detecta sinal negativo
        const isNegative = cleanAmount.includes('-') || cleanAmount.includes('(') ||
            cleanAmount.endsWith('+') === false && cleanAmount.includes('+') === false;

        // Remove símbolos
        cleanAmount = cleanAmount.replace(/[R$\s()\-+]/g, '');

        // Converte vírgula decimal brasileira
        if (cleanAmount.includes(',')) {
            const parts = cleanAmount.split(',');
            if (parts.length === 2 && parts[1].length <= 2) {
                // É decimal brasileiro (ex: 1.234,56)
                cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
            }
        }

        const amount = parseFloat(cleanAmount);
        if (isNaN(amount)) {
            throw new Error(`Valor inválido: ${amountStr}`);
        }

        return { amount, isNegative };
    }

    /**
     * Parseia arquivo PDF
     */
    static async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        const errors: string[] = [];

        try {
            const buffer = fs.readFileSync(filePath);
            const data = await pdf(buffer);

            if (!data.text) {
                return {
                    transactions: [],
                    errors: ['Não foi possível extrair texto do PDF'],
                    totalProcessed: 0
                };
            }

            const transactions = this.extractTransactions(data.text);

            // Aplica filtro de data se especificado
            let filteredTransactions = transactions;
            if (options?.dateRange) {
                filteredTransactions = transactions.filter(transaction => {
                    if (options.dateRange?.startDate && transaction.date < options.dateRange.startDate) {
                        return false;
                    }
                    if (options.dateRange?.endDate && transaction.date > options.dateRange.endDate) {
                        return false;
                    }
                    return true;
                });
            }

            // Remove duplicatas baseada em data + valor + descrição similar
            const uniqueTransactions = this.removeDuplicates(filteredTransactions);

            return {
                transactions: uniqueTransactions,
                errors,
                totalProcessed: transactions.length
            };

        } catch (error) {
            return {
                transactions: [],
                errors: [`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
                totalProcessed: 0
            };
        }
    }

    /**
     * Remove duplicatas internas do arquivo
     */
    private static removeDuplicates(transactions: ParsedTransaction[]): ParsedTransaction[] {
        const unique: ParsedTransaction[] = [];
        const seen = new Set<string>();

        for (const transaction of transactions) {
            // Cria chave única baseada em data, valor e primeiras palavras da descrição
            const descriptionKey = transaction.description.split(' ').slice(0, 3).join(' ').toLowerCase();
            const key = `${transaction.date.toDateString()}_${transaction.amount}_${descriptionKey}`;

            if (!seen.has(key)) {
                seen.add(key);
                unique.push(transaction);
            }
        }

        return unique;
    }
}
