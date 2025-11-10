import { BankParser } from './BankParser';
import { NubankParser } from './NubankParser';
import { BradescoParser } from './BradescoParser';
import { XPParser } from './XPParser';
import { XPCartaoParser } from './XPCartaoParser';
import { C6Parser } from './C6Parser';
import { InterParser } from './InterParser';
import { BTGParser } from './BTGParser';
import { BTGPDFParser } from './BTGPDFParser';
import { ItauParser } from './ItauParser';
import { ClearParser } from './ClearParser';
import * as fs from 'fs';

/**
 * Factory para detectar e criar o parser correto para cada banco
 */
export class BankParserFactory {
    private static parsers: BankParser[] = [
        new NubankParser(),
        new BradescoParser(),
        new XPCartaoParser(), // Deve vir antes do XPParser para detectar cartões
        new XPParser(),
        new C6Parser(),
        new InterParser(),
        new BTGPDFParser(), // PDF parser deve vir antes do Excel parser para PDFs
        new BTGParser(),
        new ItauParser(),
        new ClearParser(),
        // Adicionar outros parsers aqui quando implementados
        // etc.
    ];

    /**
     * Detecta o banco baseado no arquivo e retorna o parser apropriado
     * @param filePath Caminho do arquivo (pode ser temporário)
     * @param originalName Nome original do arquivo (opcional)
     */
    static detectParser(filePath: string, originalName?: string): BankParser | null {
        try {
            // Lê as primeiras linhas do arquivo para análise
            const content = fs.readFileSync(filePath, 'utf8');
            const firstLines = content.split('\n').slice(0, 10); // Primeiras 10 linhas

            // Usa nome original se fornecido, senão usa o caminho do arquivo
            const fileNameForAnalysis = originalName || filePath;

            // Testa cada parser para ver qual pode processar o arquivo
            for (const parser of this.parsers) {
                if (parser.canParse(fileNameForAnalysis, firstLines)) {
                    console.log(`🎯 Detector: ${parser.bankName} parser selecionado para ${originalName || filePath}`);
                    return parser;
                }
            }

            console.log(`⚠️  Detector: Nenhum parser específico encontrado para ${originalName || filePath}`);
            return null;

        } catch (error) {
            console.error(`❌ Erro ao detectar parser para ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Lista todos os bancos suportados
     */
    static getSupportedBanks(): string[] {
        return this.parsers.map(parser => parser.bankName);
    }

    /**
     * Registra um novo parser
     */
    static registerParser(parser: BankParser): void {
        this.parsers.push(parser);
        console.log(`✅ Parser registrado: ${parser.bankName}`);
    }

    /**
     * Testa todos os parsers em um arquivo e retorna estatísticas
     */
    static async testAllParsers(filePath: string): Promise<{
        parser: string;
        canParse: boolean;
        result?: any;
        error?: string;
    }[]> {
        const results = [];

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const firstLines = content.split('\n').slice(0, 10);

            for (const parser of this.parsers) {
                try {
                    const canParse = parser.canParse(filePath, firstLines);
                    let result = undefined;
                    let error = undefined;

                    if (canParse) {
                        try {
                            result = await parser.parseFile(filePath);
                        } catch (parseError) {
                            error = parseError instanceof Error ? parseError.message : 'Erro desconhecido';
                        }
                    }

                    results.push({
                        parser: parser.bankName,
                        canParse,
                        result,
                        error
                    });

                } catch (testError) {
                    results.push({
                        parser: parser.bankName,
                        canParse: false,
                        error: testError instanceof Error ? testError.message : 'Erro no teste'
                    });
                }
            }

        } catch (fileError) {
            console.error(`Erro ao ler arquivo ${filePath}:`, fileError);
        }

        return results;
    }
}
