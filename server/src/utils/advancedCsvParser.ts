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
 * Parser avançado para arquivos CSV de extratos bancários
 * Suporta estruturas complexas com headers dinâmicos
 */
export class AdvancedCSVParser {

    /**
     * Detecta o encoding do arquivo
     */
    private static detectEncoding(buffer: Buffer): string {
        const detected = chardet.detect(buffer);
        if (detected?.includes('UTF-8')) return 'utf8';
        if (detected?.includes('ISO-8859-1') || detected?.includes('latin1')) return 'latin1';
        if (detected?.includes('windows-1252')) return 'win1252';
        return 'utf8';
    }

    /**
     * Encontra a linha que contém os headers reais
     */
    private static findHeaderLine(lines: string[][]): { headerIndex: number; headers: string[]; separator: string } {
        const possibleSeparators = [',', ';', '\t'];

        for (let i = 0; i < Math.min(lines.length, 10); i++) {
            const line = lines[i];

            // Tenta cada separador
            for (const sep of possibleSeparators) {
                const parts = line.join(',').split(sep);

                if (parts.length >= 3) {
                    const headerStr = parts.join('|').toLowerCase();

                    // Procura por headers típicos de extratos
                    if ((headerStr.includes('data') || headerStr.includes('date')) &&
                        (headerStr.includes('descrição') || headerStr.includes('descricao') ||
                            headerStr.includes('histórico') || headerStr.includes('historico') ||
                            headerStr.includes('description') || headerStr.includes('title')) &&
                        (headerStr.includes('valor') || headerStr.includes('amount') ||
                            headerStr.includes('crédito') || headerStr.includes('débito'))) {

                        return {
                            headerIndex: i,
                            headers: parts.map(h => h.trim()),
                            separator: sep
                        };
                    }
                }
            }
        }

        // Fallback: assume primeira linha com pelo menos 3 colunas
        for (let i = 0; i < Math.min(lines.length, 5); i++) {
            const line = lines[i];
            if (line.length >= 3) {
                return {
                    headerIndex: i,
                    headers: line,
                    separator: ','
                };
            }
        }

        throw new Error('Não foi possível identificar os headers do arquivo');
    }

    /**
     * Detecta o formato baseado nos headers
     */
    private static detectFormat(headers: string[]): string {
        const headerStr = headers.join('|').toLowerCase();

        if (headerStr.includes('descricao') && headerStr.includes('valor') && headerStr.includes('saldo')) {
            return 'XP';
        }
        if (headerStr.includes('histórico') && headerStr.includes('crédito') && headerStr.includes('débito')) {
            return 'BRADESCO';
        }
        if (headerStr.includes('data') && headerStr.includes('valor') && headerStr.includes('identificador')) {
            return 'NUBANK_BR';
        }
        if (headerStr.includes('date') && headerStr.includes('title') && headerStr.includes('amount')) {
            return 'NUBANK_CARTAO';
        }

        return 'GENERIC';
    }

    /**
     * Parseia data em diferentes formatos
     */
    private static parseDate(dateStr: string): Date {
        if (!dateStr || dateStr.trim() === '') throw new Error('Data inválida');

        const cleanDate = dateStr.trim();

        // XP: DD/MM/YY às HH:mm:ss
        const xpDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})\s+às\s+\d{2}:\d{2}:\d{2}$/;
        const xpMatch = cleanDate.match(xpDateRegex);
        if (xpMatch) {
            const [, day, month, year] = xpMatch;
            return new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
        }

        // DD/MM/YYYY
        const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const ddmmMatch = cleanDate.match(ddmmyyyyRegex);
        if (ddmmMatch) {
            const [, day, month, year] = ddmmMatch;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }

        // YYYY-MM-DD
        const yyyymmddRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
        const yyyyMatch = cleanDate.match(yyyymmddRegex);
        if (yyyyMatch) {
            const [, year, month, day] = yyyyMatch;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }

        throw new Error(`Formato de data não reconhecido: ${dateStr}`);
    }

    /**
     * Parseia valor monetário
     */
    private static parseAmount(amountStr: string): number {
        if (!amountStr || amountStr.trim() === '') return 0;

        let cleanAmount = amountStr.toString().trim();

        // Remove símbolos e espaços
        cleanAmount = cleanAmount.replace(/[R$\s]/g, '');

        // Detecta sinal negativo (- ou parênteses)
        const isNegative = cleanAmount.startsWith('-') ||
            (cleanAmount.includes('(') && cleanAmount.includes(')'));

        cleanAmount = cleanAmount.replace(/[-()]/g, '');

        // Formato brasileiro: 1.234.567,89
        const hasCommaDecimal = /\d{1,3}(?:\.\d{3})*,\d{2}$/.test(cleanAmount);
        if (hasCommaDecimal) {
            cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
        }

        const amount = parseFloat(cleanAmount);
        if (isNaN(amount)) {
            throw new Error(`Valor inválido: ${amountStr}`);
        }

        return isNegative ? -amount : amount;
    }

    /**
     * Mapeia transação baseado no formato e headers
     */
    private static mapTransaction(row: any, format: string, headers: string[]): ParsedTransaction {
        let description = '';
        let amount = 0;
        let date: Date;

        // Função auxiliar para encontrar valor por múltiplas chaves
        const findValue = (keys: string[]) => {
            for (const key of keys) {
                if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                    return row[key];
                }
            }
            return null;
        };

        switch (format) {
            case 'XP':
                description = findValue(['Descricao', 'descricao', 'Descrição']) || '';
                amount = this.parseAmount(findValue(['Valor', 'valor']) || '0');
                date = this.parseDate(findValue(['Data', 'data']) || '');
                break;

            case 'BRADESCO':
                description = findValue(['Histórico', 'historico', 'Histórico ']) || '';

                // Bradesco: colunas separadas para crédito e débito
                const credito = this.parseAmount(findValue(['Crédito (R$)', 'Crédito', 'credito']) || '0');
                const debito = this.parseAmount(findValue(['Débito (R$)', 'Débito', 'debito']) || '0');
                amount = credito - debito;

                date = this.parseDate(findValue(['Data', 'data']) || '');
                break;

            case 'NUBANK_BR':
                description = findValue(['Descrição', 'descrição']) || '';
                amount = this.parseAmount(findValue(['Valor', 'valor']) || '0');
                date = this.parseDate(findValue(['Data', 'data']) || '');
                break;

            case 'NUBANK_CARTAO':
                description = findValue(['title', 'titulo']) || '';
                amount = this.parseAmount(findValue(['amount', 'valor']) || '0');
                date = this.parseDate(findValue(['date', 'data']) || '');

                // Cartão de crédito: gastos são positivos, mas devem ser negativos
                if (!description.toLowerCase().includes('pagamento recebido')) {
                    amount = -Math.abs(amount);
                }
                break;

            default:
                // Mapeamento genérico mais robusto
                const descKeys = ['Descrição', 'descrição', 'Histórico', 'historico', 'Descricao', 'description', 'title'];
                const amountKeys = ['Valor', 'valor', 'amount', 'value'];
                const dateKeys = ['Data', 'data', 'date'];

                description = findValue(descKeys) || '';
                amount = this.parseAmount(findValue(amountKeys) || '0');
                date = this.parseDate(findValue(dateKeys) || '');
                break;
        }

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
     * Parseia arquivo CSV com detecção automática de estrutura
     */
    static async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        return new Promise((resolve) => {
            const transactions: ParsedTransaction[] = [];
            const errors: string[] = [];
            let totalProcessed = 0;

            try {
                // Ler arquivo e detectar encoding
                const buffer = fs.readFileSync(filePath);
                const encoding = this.detectEncoding(buffer);
                const content = iconv.decode(buffer, encoding);

                // Dividir em linhas e analisar estrutura
                const allLines = content.split('\n').map(line => line.split(','));

                // Encontrar headers
                const { headerIndex, headers, separator } = this.findHeaderLine(allLines);
                const format = this.detectFormat(headers);

                console.log(`Formato detectado: ${format}`);
                console.log(`Headers encontrados na linha ${headerIndex}: ${headers.join(', ')}`);
                console.log(`Separador: '${separator}'`);

                // Processar arquivo com o separador correto
                const stream = Readable.from([content]);

                stream
                    .pipe(csv({ separator }))
                    .on('data', (row) => {
                        try {
                            totalProcessed++;

                            // Pular linhas antes dos headers
                            if (totalProcessed <= headerIndex) {
                                return;
                            }

                            // Verificar se a linha tem dados válidos
                            const hasValidData = Object.values(row).some(value =>
                                value && value.toString().trim() !== ''
                            );

                            if (!hasValidData) {
                                return; // Pular linhas vazias
                            }

                            const transaction = this.mapTransaction(row, format, headers);

                            // Validações
                            if (!transaction.description || transaction.description.trim() === '') {
                                errors.push(`Linha ${totalProcessed}: Descrição em branco`);
                                return;
                            }

                            if (!transaction.date || isNaN(transaction.date.getTime())) {
                                errors.push(`Linha ${totalProcessed}: Data inválida`);
                                return;
                            }

                            // Valida se a data não é futura
                            const today = new Date();
                            today.setHours(23, 59, 59, 999);
                            if (transaction.date > today) {
                                errors.push(`Linha ${totalProcessed}: Data futura - transação ignorada`);
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
                        resolve({ transactions, errors, totalProcessed });
                    });

            } catch (error) {
                errors.push(`Erro ao ler arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                resolve({ transactions, errors, totalProcessed });
            }
        });
    }
}
