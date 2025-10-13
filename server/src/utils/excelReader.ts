import * as ExcelJS from 'exceljs';
import * as xlsx from 'node-xlsx';
import * as path from 'path';

/**
 * Utilitário para leitura de arquivos Excel usando ExcelJS (mais seguro que xlsx)
 */
export class ExcelReader {
    /**
     * Lê um arquivo Excel e retorna os dados como array de arrays
     * @param filePath Caminho para o arquivo Excel
     * @param sheetIndex Índice da planilha (padrão: 0)
     * @returns Promise com array de arrays contendo os dados
     */
    static async readFile(filePath: string, sheetIndex: number = 0): Promise<any[][]> {
        const ext = path.extname(filePath).toLowerCase();

        try {
            // Para arquivos XLS (formato antigo), usa node-xlsx
            if (ext === '.xls') {
                return this.readXlsFile(filePath, sheetIndex);
            }

            // Para arquivos XLSX (formato novo), usa ExcelJS
            return await this.readXlsxFile(filePath, sheetIndex);

        } catch (error) {
            throw new Error(`Erro ao ler arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }

    /**
     * Lê arquivos XLSX usando ExcelJS
     */
    private static async readXlsxFile(filePath: string, sheetIndex: number = 0): Promise<any[][]> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.worksheets[sheetIndex];
        if (!worksheet) {
            throw new Error(`Planilha ${sheetIndex} não encontrada`);
        }

        const data: any[][] = [];

        worksheet.eachRow((row, rowNumber) => {
            const rowData: any[] = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                let value = this.extractCellValue(cell);
                rowData[colNumber - 1] = value;
            });

            data[rowNumber - 1] = rowData;
        });

        return data;
    }

    /**
     * Lê arquivos XLS usando node-xlsx
     */
    private static readXlsFile(filePath: string, sheetIndex: number = 0): any[][] {
        const workSheets = xlsx.parse(filePath);

        if (!workSheets[sheetIndex]) {
            throw new Error(`Planilha ${sheetIndex} não encontrada`);
        }

        return workSheets[sheetIndex].data;
    }

    /**
     * Extrai o valor de uma célula, tratando diferentes tipos de dados do ExcelJS
     * @param cell Célula do ExcelJS
     * @returns Valor extraído da célula
     */
    private static extractCellValue(cell: ExcelJS.Cell): any {
        let value = cell.value;

        // Se é null ou undefined, retorna como está
        if (value === null || value === undefined) {
            return value;
        }

        // Trata datas
        if (value instanceof Date) {
            return value;
        }

        // Trata fórmulas
        if (cell.type === ExcelJS.ValueType.Formula) {
            return cell.result || cell.value;
        }

        // Trata RichText (texto formatado)
        if (typeof value === 'object' && value !== null && 'richText' in value) {
            const richText = (value as any).richText;
            if (Array.isArray(richText)) {
                return richText.map((part: any) => part.text || '').join('');
            }
            return String(value);
        }

        // Trata hiperlinks
        if (typeof value === 'object' && value !== null && 'text' in value) {
            return (value as any).text;
        }

        // Trata objetos complexos (converte para string)
        if (typeof value === 'object' && value !== null) {
            // Se tem propriedades reconhecíveis, tenta extrair o texto
            if ('hyperlink' in value && 'text' in value) {
                return (value as any).text;
            }

            // Se não conseguiu extrair, converte para string
            return String(value);
        }

        // Números, strings e booleanos passam direto
        return value;
    }

    /**
     * Obtém os nomes das planilhas
     * @param filePath Caminho para o arquivo Excel
     * @returns Promise com array dos nomes das planilhas
     */
    static async getSheetNames(filePath: string): Promise<string[]> {
        const workbook = new ExcelJS.Workbook();

        try {
            await workbook.xlsx.readFile(filePath);
            return workbook.worksheets.map(sheet => sheet.name);
        } catch (error) {
            throw new Error(`Erro ao ler nomes das planilhas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }

    /**
     * Verifica se um arquivo é um Excel válido
     * @param filePath Caminho para o arquivo
     * @returns true se for um arquivo Excel válido
     */
    static isExcelFile(filePath: string): boolean {
        const ext = path.extname(filePath).toLowerCase();
        return ext === '.xlsx' || ext === '.xls';
    }
}