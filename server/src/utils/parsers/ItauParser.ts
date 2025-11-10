import { ExcelReader } from '../excelReader';
import { BankParser, ParseResult, ParseOptions } from './BankParser';
import { ParsedTransaction } from '../csvParser';
import * as fs from 'fs';
import * as xlsx from 'xlsx';

/**
 * Parser específico para arquivos do Itaú
 * Suporta: Excel (.xls, .xlsx) e TXT (formato dd/mm/yyyy;descrição;valor)
 */
export class ItauParser extends BankParser {
    readonly bankName = 'Itaú';
    readonly supportedFormats = ['xls', 'xlsx', 'txt'];

    canParse(filePath: string, firstLines: string[]): boolean {
        const fileName = filePath.toLowerCase();

        // Verifica se tem Itaú no nome do arquivo
        const hasItauInName = fileName.includes('itau') || fileName.includes('itaú');

        // Para arquivos Excel, exige nome com Itaú
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            return hasItauInName;
        }

        // Para arquivos TXT ou arquivos sem extensão (arquivos temporários)
        const isTxtFile = fileName.endsWith('.txt') || !fileName.includes('.');

        if (isTxtFile) {
            // Se tem Itaú no nome, aceita
            if (hasItauInName) {
                return this.validateTxtFormat(firstLines);
            }

            // Se não tem no nome, verifica se o conteúdo parece ser do Itaú
            // (transações com PIX, TED, etc. são características do Itaú)
            const isValidFormat = this.validateTxtFormat(firstLines);

            if (isValidFormat) {
                // Verifica se tem termos característicos do Itaú
                const content = firstLines.join('\n').toLowerCase();
                const itauTerms = ['pix transf', 'pix qrs', 'ted 237', 'rend pago aplic', 'pag boleto'];
                const hasItauTerms = itauTerms.some(term => content.includes(term));

                if (hasItauTerms) {
                    console.log('🏦 Itaú: Detectado pelo conteúdo (PIX, TED, etc.)');
                    return true;
                }
            }
        }

        return false;
    }

    private validateTxtFormat(firstLines: string[]): boolean {
        if (firstLines.length === 0) return false;

        // Verifica se pelo menos uma linha tem o formato correto
        for (const line of firstLines.slice(0, 3)) {
            const parts = line.split(';');
            if (parts.length >= 3) {
                const datePart = parts[0].trim();
                // Verifica se é uma data no formato dd/mm/yyyy
                const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
                if (dateRegex.test(datePart)) {
                    return true;
                }
            }
        }
        return false;
    }

    async parseFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        const fileName = filePath.toLowerCase();

        // Detecta se é TXT ou Excel
        // Para arquivos temporários (sem extensão), verifica conteúdo
        if (fileName.endsWith('.txt') || (!fileName.includes('.') && this.isTextFormat(filePath))) {
            return this.parseTxtFile(filePath, options);
        } else {
            return this.parseExcelFile(filePath, options);
        }
    }

    private isTextFormat(filePath: string): boolean {
        try {
            const fs = require('fs');
            const content = fs.readFileSync(filePath, 'utf8');
            const firstLines = content.split('\n').slice(0, 3);
            return this.validateTxtFormat(firstLines);
        } catch {
            return false;
        }
    }

    private async parseTxtFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        const transactions: ParsedTransaction[] = [];
        const errors: string[] = [];
        let totalProcessed = 0;

        try {
            console.log('🏦 Itaú: Processando arquivo TXT');

            const fileContent = fs.readFileSync(filePath, 'utf8');
            const lines = fileContent.split('\n').filter(line => line.trim());

            const accountType = this.detectAccountTypeFromFile(filePath);

            // Processa cada linha (formato: dd/mm/yyyy;descrição;valor)
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                try {
                    totalProcessed++;

                    const transaction = this.parseTxtTransaction(line, accountType, i + 1);

                    if (transaction) {
                        transactions.push(transaction);
                    }

                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
                    errors.push(`Linha ${i + 1}: ${errorMsg}`);
                }
            }

            const filteredTransactions = this.filterByDateRange(transactions, options?.dateRange);

            console.log(`✅ Itaú TXT: ${filteredTransactions.length} transações processadas de ${totalProcessed} linhas`);

            return {
                transactions: filteredTransactions,
                errors,
                totalProcessed,
                bankName: this.bankName,
                accountType
            };

        } catch (error) {
            errors.push(`Erro ao ler arquivo TXT: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            return {
                transactions,
                errors,
                totalProcessed: 0,
                bankName: this.bankName,
                accountType: 'conta_corrente'
            };
        }
    }

    private async parseExcelFile(filePath: string, options?: ParseOptions): Promise<ParseResult> {
        const transactions: ParsedTransaction[] = [];
        const errors: string[] = [];
        let totalProcessed = 0;

        try {
            console.log('🏦 Itaú: Processando arquivo Excel');

            let data: any[][];

            // Para arquivos .xls antigos, usa xlsx diretamente
            if (filePath.toLowerCase().endsWith('.xls') || this.isOldExcelFormat(filePath)) {
                console.log('🏦 Itaú: Detectado formato XLS antigo, usando biblioteca xlsx');
                const workbook = xlsx.readFile(filePath);
                const firstSheetName = Object.keys(workbook.Sheets)[0];
                const worksheet = workbook.Sheets[firstSheetName];
                data = xlsx.utils.sheet_to_json(worksheet, {
                    header: 1,
                    range: 0,
                    raw: false
                });
            } else {
                // Para arquivos .xlsx, usa ExcelReader normal
                console.log('🏦 Itaú: Usando ExcelReader padrão');
                data = await ExcelReader.readFile(filePath);
            }

            console.log(`🏦 Itaú: ${data.length} linhas lidas do Excel`);

            if (data.length === 0) {
                return {
                    transactions: [],
                    errors: ['Arquivo Excel está vazio'],
                    totalProcessed: 0,
                    bankName: this.bankName,
                    accountType: 'conta_corrente'
                };
            }

            // Mostra algumas linhas para debug
            console.log('🏦 Itaú: Primeiras 3 linhas do Excel:');
            data.slice(0, 3).forEach((row, i) => {
                if (row && row.length > 0) {
                    console.log(`  Linha ${i + 1}: [${row.join('] [')}]`);
                }
            });

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
            const errorMessage = `Erro ao ler arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
            console.error('❌ Itaú Excel:', errorMessage);
            errors.push(errorMessage);
            return {
                transactions,
                errors,
                totalProcessed: 0,
                bankName: this.bankName,
                accountType: 'conta_corrente'
            };
        }
    }

    private isOldExcelFormat(filePath: string): boolean {
        // Verifica se é um arquivo XLS antigo tentando ler como XLSX
        try {
            const stats = fs.statSync(filePath);
            if (stats.size > 0) {
                const buffer = fs.readFileSync(filePath, null);
                // XLS antigo não é um arquivo ZIP (que começa com PK)
                return !buffer.toString('hex', 0, 2).toLowerCase().includes('504b');
            }
        } catch {
            return false;
        }
        return false;
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
                // Converte todos os valores da linha para string e junta
                const rowText = row.map(cell =>
                    cell ? cell.toString().toLowerCase().trim() : ''
                ).join(' ');

                // Verifica se tem os headers típicos do Itaú
                if (rowText.includes('data') &&
                    rowText.includes('lançamento') &&
                    (rowText.includes('valor') || rowText.includes('saldo'))) {
                    console.log(`🏦 Itaú Excel: Headers encontrados na linha ${i + 1}: ${rowText}`);
                    return i;
                }
            }
        }

        console.log('🏦 Itaú Excel: Headers não encontrados, procurando por "data" e qualquer termo financeiro');

        // Fallback: procura por linha que tenha "data" e algum termo financeiro
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (row && row.length > 0) {
                const firstCell = row[0]?.toString().toLowerCase().trim() || '';

                if (firstCell === 'data' || firstCell.includes('data')) {
                    console.log(`🏦 Itaú Excel: Fallback - linha com "data" encontrada: ${i + 1}`);
                    return i;
                }
            }
        }

        return -1;
    }

    private parseTxtTransaction(line: string, accountType: string, lineNumber: number): ParsedTransaction | null {
        // Formato TXT: dd/mm/yyyy;descrição;valor
        const parts = line.split(';');

        if (parts.length < 3) {
            throw new Error('Formato inválido - esperado: data;descrição;valor');
        }

        const [datePart, description, valorPart] = parts;

        // Parseia data - formato: "DD/MM/YYYY"
        const date = this.parseDate(datePart.trim());
        if (!date) {
            throw new Error('Data inválida');
        }

        // Valida se a data não é futura
        if (!this.isValidTransactionDate(date)) {
            throw new Error('Data futura - transação ignorada');
        }

        // Valida descrição
        const cleanDescription = description.trim();
        if (!cleanDescription) {
            throw new Error('Descrição em branco');
        }

        // Parseia valor (formato brasileiro: -1.000,00 ou 1.000,00)
        const amount = this.parseItauAmount(valorPart.trim());
        if (amount === 0) {
            throw new Error('Valor inválido');
        }

        const type: 'INCOME' | 'EXPENSE' = amount >= 0 ? 'INCOME' : 'EXPENSE';

        return {
            date,
            description: cleanDescription,
            amount: Math.abs(amount),
            type,
            originalData: {
                bank: this.bankName,
                accountType,
                originalData: datePart,
                originalValor: valorPart,
                raw: line
            }
        };
    }

    private parseItauTransaction(row: any[], accountType: string, lineNumber: number): ParsedTransaction | null {
        // Estrutura Itaú Excel: [0] Data, [1] Lançamento, [2] Ag./Origem, [3] Valor, [4] Saldo
        const data = row[0];
        const lancamento = row[1];
        const agenciaOrigin = row[2];
        const valor = row[3];
        const saldo = row[4];

        // Ignora linhas de header, saldo e linhas vazias ou informativas
        if (!data || !lancamento ||
            lancamento.toString().toLowerCase().includes('lançamento') ||
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

        // Parseia data - pode ser string "DD/MM/YYYY" ou objeto Date do Excel
        let parsedDate: Date;
        if (data instanceof Date) {
            parsedDate = data;
        } else {
            parsedDate = this.parseDate(data.toString());
            if (!parsedDate) {
                throw new Error(`Data inválida: ${data}`);
            }
        }

        // Valida se a data não é futura
        if (!this.isValidTransactionDate(parsedDate)) {
            throw new Error('Data futura - transação ignorada');
        }

        // Parseia valor - pode estar na coluna 3 ou 4 dependendo da estrutura
        let amount = 0;

        // Tenta primeiro a coluna de valor (index 3)
        if (valor !== undefined && valor !== null && valor !== '') {
            amount = this.parseItauAmount(valor);
        }

        // Se não conseguiu, verifica se não é uma linha de saldo anterior
        if (amount === 0 && !fullDescription.toLowerCase().includes('saldo')) {
            throw new Error(`Valor inválido: ${valor}`);
        }

        const type: 'INCOME' | 'EXPENSE' = amount >= 0 ? 'INCOME' : 'EXPENSE';

        return {
            date: parsedDate,
            description: fullDescription,
            amount: Math.abs(amount),
            type,
            originalData: {
                bank: this.bankName,
                accountType,
                lancamento: lancamento?.toString(),
                agenciaOrigin: agenciaOrigin?.toString(),
                originalData: data,
                originalValor: valor,
                saldo: saldo?.toString(),
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
        if (!str || str === '' || str === '-') return 0;

        // Remove caracteres não numéricos exceto ponto, vírgula e sinal
        let cleaned = str.replace(/[^\d,.\-+]/g, '');

        // Se está vazio após limpeza, retorna 0
        if (!cleaned) return 0;

        // Trata formato brasileiro (1.234,56 ou -1.234,56)
        if (cleaned.includes(',')) {
            // Remove pontos (separadores de milhares) e converte vírgula para ponto
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }

        const amount = parseFloat(cleaned);
        const result = isNaN(amount) ? 0 : amount;

        return result;
    }
}
