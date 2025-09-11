import { ParsedTransaction } from '../csvParser';

export interface ParseResult {
    transactions: ParsedTransaction[];
    errors: string[];
    totalProcessed: number;
    bankName: string;
    accountType: string;
}

export interface DateRange {
    startDate?: Date;
    endDate?: Date;
}

export interface ParseOptions {
    dateRange?: DateRange;
    skipDuplicates?: boolean;
}

/**
 * Interface base para todos os parsers de bancos
 */
export abstract class BankParser {
    abstract readonly bankName: string;
    abstract readonly supportedFormats: string[];

    /**
     * Verifica se o parser pode processar o arquivo
     */
    abstract canParse(filePath: string, firstLines: string[]): boolean;

    /**
     * Parseia o arquivo do banco
     */
    abstract parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult>;

    /**
     * Detecta o tipo de conta (corrente, poupança, cartão, investimento)
     */
    protected detectAccountType(headers: string[], content: string): string {
        const lowerContent = content.toLowerCase();
        const lowerHeaders = headers.join(' ').toLowerCase();

        if (lowerContent.includes('cartão') || lowerContent.includes('cartao') ||
            lowerContent.includes('fatura') || lowerHeaders.includes('cartao')) {
            return 'cartao_credito';
        }

        if (lowerContent.includes('poupança') || lowerContent.includes('poupanca') ||
            lowerHeaders.includes('poupanca')) {
            return 'conta_poupanca';
        }

        if (lowerContent.includes('investimento') || lowerHeaders.includes('investimento')) {
            return 'conta_investimento';
        }

        return 'conta_corrente';
    }

    /**
     * Filtra transações por período e remove lançamentos futuros
     */
    protected filterByDateRange(transactions: ParsedTransaction[], dateRange?: DateRange): ParsedTransaction[] {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Final do dia atual

        return transactions.filter(transaction => {
            if (!transaction.date) return false;

            // Ignora lançamentos futuros
            if (transaction.date > today) {
                return false;
            }

            // Aplica filtro de período se especificado
            if (dateRange) {
                if (dateRange.startDate && transaction.date < dateRange.startDate) {
                    return false;
                }

                if (dateRange.endDate && transaction.date > dateRange.endDate) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Valida se a data não é futura
     */
    protected isValidTransactionDate(date: Date): boolean {
        if (!date || isNaN(date.getTime())) return false;

        const today = new Date();
        today.setHours(23, 59, 59, 999); // Final do dia atual

        return date <= today;
    }

    /**
     * Normaliza valor monetário
     */
    protected parseAmount(value: string): number {
        if (!value) return 0;

        // Remove espaços e caracteres especiais, mantém apenas números, vírgulas, pontos e sinais
        let cleaned = value.toString().trim()
            .replace(/[^\d,.-]/g, '')
            .replace(/\s+/g, '');

        // Se tem vírgula e ponto, assume que vírgula é decimal
        if (cleaned.includes(',') && cleaned.includes('.')) {
            // Se ponto vem depois da vírgula, remove o ponto
            if (cleaned.lastIndexOf('.') > cleaned.lastIndexOf(',')) {
                cleaned = cleaned.replace(/\./g, '');
                cleaned = cleaned.replace(',', '.');
            } else {
                // Se vírgula vem depois do ponto, remove vírgulas
                cleaned = cleaned.replace(/,/g, '');
            }
        } else if (cleaned.includes(',')) {
            // Se só tem vírgula, substitui por ponto
            cleaned = cleaned.replace(',', '.');
        }

        const amount = parseFloat(cleaned);
        return isNaN(amount) ? 0 : amount;
    }

    /**
     * Parseia data em vários formatos
     */
    protected parseDate(dateStr: string): Date | null {
        if (!dateStr) return null;

        const cleaned = dateStr.trim();

        // Formatos comuns brasileiros
        const formats = [
            /^(\d{2})\/(\d{2})\/(\d{4})$/,  // DD/MM/YYYY
            /^(\d{2})-(\d{2})-(\d{4})$/,   // DD-MM-YYYY
            /^(\d{4})-(\d{2})-(\d{2})$/,   // YYYY-MM-DD
            /^(\d{2})\/(\d{2})\/(\d{2})$/  // DD/MM/YY
        ];

        for (const format of formats) {
            const match = cleaned.match(format);
            if (match) {
                let day, month, year;

                if (format.source.startsWith('^(\\d{4})')) {
                    // YYYY-MM-DD
                    year = parseInt(match[1]);
                    month = parseInt(match[2]) - 1;
                    day = parseInt(match[3]);
                } else {
                    // DD/MM/YYYY ou DD/MM/YY
                    day = parseInt(match[1]);
                    month = parseInt(match[2]) - 1;
                    year = parseInt(match[3]);

                    // Se ano com 2 dígitos, assumir 20XX
                    if (year < 100) {
                        year += 2000;
                    }
                }

                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }

        return null;
    }
}
