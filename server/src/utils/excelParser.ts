import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { ParsedTransaction, ParseResult, ParseOptions } from './csvParser';

/**
 * Parser para arquivos Excel/XLS de extratos bancários
 * Suporta formatos .xlsx e .xls
 */
export class ExcelParser {

    /**
     * Detecta o formato do Excel baseado nas colunas
     */
    private static detectFormat(headers: string[]): string {
        const headerStr = headers.join('|').toLowerCase();

        // BTG Pactual
        if (headerStr.includes('data') && headerStr.includes('descrição') && headerStr.includes('valor')) {
            return 'BTG';
        }

        // Clear
        if (headerStr.includes('data') && headerStr.includes('histórico') && headerStr.includes('valor')) {
            return 'CLEAR';
        }

        // Itaú
        if (headerStr.includes('data') && headerStr.includes('lançamento') && headerStr.includes('valor')) {
            return 'ITAU';
        }

        // Formato genérico
        return 'GENERIC';
    }

    /**
     * Parseia data em diferentes formatos
     */
    private static parseDate(dateValue: any): Date {
        if (!dateValue) throw new Error('Data inválida');

        // Se é um número serial do Excel (dias desde 1900-01-01)
        if (typeof dateValue === 'number') {
            // Excel serial date: dias desde 1900-01-01 (com ajuste para erro do Excel)
            const excelEpoch = new Date(1900, 0, 1);
            const days = dateValue - 2; // Ajuste para erro do Excel (1900 não é bissexto)
            return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
        }

        // Se é string, usar os mesmos parsers do CSV
        if (typeof dateValue === 'string') {
            const cleanDate = dateValue.trim();

            // DD/MM/YYYY
            const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            const ddmmyyyyMatch = cleanDate.match(ddmmyyyyRegex);
            if (ddmmyyyyMatch) {
                const [, day, month, year] = ddmmyyyyMatch;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }

            // YYYY-MM-DD
            const yyyymmddRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
            const yyyymmddMatch = cleanDate.match(yyyymmddRegex);
            if (yyyymmddMatch) {
                const [, year, month, day] = yyyymmddMatch;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }

            // DD-MM-YYYY
            const ddmmyyyyDashRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
            const ddmmyyyyDashMatch = cleanDate.match(ddmmyyyyDashRegex);
            if (ddmmyyyyDashMatch) {
                const [, day, month, year] = ddmmyyyyDashMatch;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
        }

        // Se é uma data do JavaScript
        if (dateValue instanceof Date) {
            return dateValue;
        }

        throw new Error(`Formato de data não reconhecido: ${dateValue}`);
    }

    /**
     * Parseia valor monetário
     */
    private static parseAmount(amountValue: any): number {
        if (amountValue === null || amountValue === undefined) return 0;

        // Se já é um número
        if (typeof amountValue === 'number') {
            return amountValue;
        }

        // Se é string, processar como no CSV
        let cleanAmount = amountValue.toString().trim();

        // Remove símbolos de moeda
        cleanAmount = cleanAmount.replace(/[R$\s]/g, '');

        // Detecta formato brasileiro com vírgula decimal
        const hasCommaDecimal = /\d{1,3}(?:\.\d{3})*,\d{2}$/.test(cleanAmount);

        if (hasCommaDecimal) {
            cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
        }

        // Remove parênteses (valores negativos)
        const isNegative = cleanAmount.includes('(') && cleanAmount.includes(')');
        cleanAmount = cleanAmount.replace(/[()]/g, '');

        const amount = parseFloat(cleanAmount);
        if (isNaN(amount)) {
            throw new Error(`Valor inválido: ${amountValue}`);
        }

        return isNegative ? -amount : amount;
    }

    /**
     * Mapeia linha do Excel baseado no formato
     */
    private static mapTransaction(row: any, format: string, headers: string[]): ParsedTransaction {
        let description: string = '';
        let amount: number = 0;
        let date: Date;

        // Mapear por posição se os nomes das colunas não forem claros
        const findValue = (possibleKeys: string[]) => {
            for (const key of possibleKeys) {
                if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                    return row[key];
                }
            }
            return null;
        };

        switch (format) {
            case 'BTG':
                description = findValue(['Descrição', 'descrição', 'Histórico', 'historico']) || '';
                amount = this.parseAmount(findValue(['Valor', 'valor', 'Quantia', 'quantia']));
                date = this.parseDate(findValue(['Data', 'data', 'Data Operação', 'data_operacao']));
                break;

            case 'CLEAR':
                description = findValue(['Histórico', 'historico', 'Descrição', 'descrição']) || '';
                amount = this.parseAmount(findValue(['Valor', 'valor', 'Quantia', 'quantia']));
                date = this.parseDate(findValue(['Data', 'data', 'Data Operação', 'data_operacao']));
                break;

            case 'ITAU':
                description = findValue(['Lançamento', 'lançamento', 'Histórico', 'historico', 'Descrição']) || '';
                amount = this.parseAmount(findValue(['Valor', 'valor', 'Quantia', 'quantia']));
                date = this.parseDate(findValue(['Data', 'data', 'Data Lançamento', 'data_lancamento']));
                break;

            case 'GENERIC':
            default:
                // Tentar mapear automaticamente
                const possibleDescriptions = ['Descrição', 'descrição', 'Histórico', 'historico', 'Lançamento', 'lançamento', 'description', 'title'];
                const possibleAmounts = ['Valor', 'valor', 'amount', 'quantia', 'value'];
                const possibleDates = ['Data', 'data', 'date', 'Data Operação', 'Data Lançamento'];

                description = findValue(possibleDescriptions) || '';
                amount = this.parseAmount(findValue(possibleAmounts)) || 0;
                date = this.parseDate(findValue(possibleDates)) || new Date();
                break;
        }

        // Determina o tipo baseado no valor
        const type: 'INCOME' | 'EXPENSE' = amount >= 0 ? 'INCOME' : 'EXPENSE';

        return {
            description: description.trim(),
            amount: Math.abs(amount),
            type,
            date,
            originalData: row
        };
    }

    /**
     * Parseia arquivo Excel/XLS
     */
    static async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        return new Promise((resolve) => {
            const transactions: ParsedTransaction[] = [];
            const errors: string[] = [];
            let totalProcessed = 0;

            try {
                // Ler arquivo Excel
                const workbook = XLSX.readFile(filePath);

                // Pegar a primeira planilha
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Converter para JSON
                const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (data.length === 0) {
                    errors.push('Arquivo Excel vazio ou sem dados');
                    resolve({ transactions, errors, totalProcessed });
                    return;
                }

                // Primeira linha são os headers
                const headers = (data[0] as string[]).map(h => h?.toString() || '');
                const format = this.detectFormat(headers);

                console.log(`Formato detectado: ${format}`);
                console.log(`Headers: ${headers.join(', ')}`);

                // Processar linhas de dados
                for (let i = 1; i < data.length; i++) {
                    try {
                        totalProcessed++;
                        const rowArray = data[i] as any[];

                        // Converter array para objeto com headers
                        const row: any = {};
                        headers.forEach((header, index) => {
                            row[header] = rowArray[index];
                        });

                        // Pular linhas vazias
                        if (Object.values(row).every(value => !value || value.toString().trim() === '')) {
                            continue;
                        }

                        const transaction = this.mapTransaction(row, format, headers);

                        // Validações básicas
                        if (!transaction.description) {
                            errors.push(`Linha ${i + 1}: Descrição em branco`);
                            continue;
                        }

                        if (!transaction.date || isNaN(transaction.date.getTime())) {
                            errors.push(`Linha ${i + 1}: Data inválida`);
                            continue;
                        }

                        // Aplica filtro de data se especificado
                        if (options?.dateRange) {
                            if (options.dateRange.startDate && transaction.date < options.dateRange.startDate) {
                                continue; // Pula transação fora do período
                            }
                            if (options.dateRange.endDate && transaction.date > options.dateRange.endDate) {
                                continue; // Pula transação fora do período
                            }
                        }

                        transactions.push(transaction);

                    } catch (error) {
                        errors.push(`Linha ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                    }
                }

                resolve({
                    transactions,
                    errors,
                    totalProcessed
                });

            } catch (error) {
                errors.push(`Erro ao processar arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                resolve({
                    transactions,
                    errors,
                    totalProcessed
                });
            }
        });
    }
}
