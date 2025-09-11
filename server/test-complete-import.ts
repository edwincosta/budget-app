import { CSVParser } from './src/utils/csvParser';
import { ExcelParser } from './src/utils/excelParser';
import { PDFParser } from './src/utils/pdfParser';
import { BankParserFactory } from './src/utils/parsers/BankParserFactory';
import * as path from 'path';
import * as fs from 'fs';

interface TestResult {
    filename: string;
    fileType: string;
    format: string;
    success: boolean;
    transactions: number;
    errors: number;
    errorMessages: string[];
    totalValue: number;
    incomeCount: number;
    expenseCount: number;
}

// Função para testar arquivo CSV
async function testCSVFile(filePath: string): Promise<TestResult> {
    const filename = path.basename(filePath);
    console.log(`\n📄 TESTANDO CSV: ${filename}`);

    try {
        let result;
        let usedParser = 'Unknown';

        // 1. Tenta detectar parser específico por banco
        const bankParser = BankParserFactory.detectParser(filePath);
        if (bankParser) {
            try {
                result = await bankParser.parseFile(filePath);
                usedParser = bankParser.bankName;
                console.log(`  🎯 Parser usado: ${usedParser}`);
            } catch (bankError) {
                console.log(`  ⚠️ ${bankParser.bankName} parser falhou, usando fallback`);
                result = await CSVParser.parseFile(filePath);
                usedParser = 'CSVParser (fallback)';
            }
        } else {
            // Fallback para parser básico
            result = await CSVParser.parseFile(filePath);
            usedParser = 'CSVParser';
        }

        const incomeTransactions = result.transactions.filter(t => t.type === 'INCOME');
        const expenseTransactions = result.transactions.filter(t => t.type === 'EXPENSE');
        const totalValue = result.transactions.reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0);

        console.log(`  ✅ Processado: ${result.transactions.length}/${result.totalProcessed} transações`);
        if (result.errors.length > 0) {
            console.log(`  ⚠️  Erros: ${result.errors.length}`);
        }

        return {
            filename,
            fileType: 'CSV',
            format: usedParser,
            success: result.transactions.length > 0,
            transactions: result.transactions.length,
            errors: result.errors.length,
            errorMessages: result.errors,
            totalValue,
            incomeCount: incomeTransactions.length,
            expenseCount: expenseTransactions.length
        };

    } catch (error) {
        console.log(`  ❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        return {
            filename,
            fileType: 'CSV',
            format: 'ERROR',
            success: false,
            transactions: 0,
            errors: 1,
            errorMessages: [error instanceof Error ? error.message : 'Erro desconhecido'],
            totalValue: 0,
            incomeCount: 0,
            expenseCount: 0
        };
    }
}

// Função para testar arquivo Excel
async function testExcelFile(filePath: string): Promise<TestResult> {
    const filename = path.basename(filePath);
    console.log(`\n📊 TESTANDO EXCEL: ${filename}`);

    try {
        let result;
        let usedParser = 'Unknown';

        // 1. Tenta detectar parser específico por banco
        const bankParser = BankParserFactory.detectParser(filePath);
        if (bankParser) {
            try {
                result = await bankParser.parseFile(filePath);
                usedParser = bankParser.bankName;
                console.log(`  🎯 Parser usado: ${usedParser}`);
            } catch (bankError) {
                console.log(`  ⚠️ ${bankParser.bankName} parser falhou, usando fallback`);
                result = await ExcelParser.parseFile(filePath);
                usedParser = 'ExcelParser (fallback)';
            }
        } else {
            // Fallback para parser básico
            result = await ExcelParser.parseFile(filePath);
            usedParser = 'ExcelParser';
        }

        const incomeTransactions = result.transactions.filter(t => t.type === 'INCOME');
        const expenseTransactions = result.transactions.filter(t => t.type === 'EXPENSE');
        const totalValue = result.transactions.reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0);

        console.log(`  ✅ Processado: ${result.transactions.length}/${result.totalProcessed} transações`);
        if (result.errors.length > 0) {
            console.log(`  ⚠️  Erros: ${result.errors.length}`);
        }

        return {
            filename,
            fileType: 'EXCEL',
            format: usedParser,
            success: result.transactions.length > 0,
            transactions: result.transactions.length,
            errors: result.errors.length,
            errorMessages: result.errors,
            totalValue,
            incomeCount: incomeTransactions.length,
            expenseCount: expenseTransactions.length
        };

    } catch (error) {
        console.log(`  ❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        return {
            filename,
            fileType: 'EXCEL',
            format: 'ERROR',
            success: false,
            transactions: 0,
            errors: 1,
            errorMessages: [error instanceof Error ? error.message : 'Erro desconhecido'],
            totalValue: 0,
            incomeCount: 0,
            expenseCount: 0
        };
    }
}

// Função para testar arquivo PDF
async function testPDFFile(filePath: string): Promise<TestResult> {
    const filename = path.basename(filePath);
    console.log(`\n📄 TESTANDO PDF: ${filename}`);

    try {
        let result;
        let usedParser = 'Unknown';

        // 1. Tenta detectar parser específico por banco
        const bankParser = BankParserFactory.detectParser(filePath);
        if (bankParser) {
            try {
                result = await bankParser.parseFile(filePath);
                usedParser = bankParser.bankName;
                console.log(`  🎯 Parser usado: ${usedParser}`);
            } catch (bankError) {
                console.log(`  ⚠️ ${bankParser.bankName} parser falhou, usando fallback`);
                result = await PDFParser.parseFile(filePath);
                usedParser = 'PDFParser (fallback)';
            }
        } else {
            // Fallback para parser básico
            result = await PDFParser.parseFile(filePath);
            usedParser = 'PDFParser';
        }

        const incomeTransactions = result.transactions.filter(t => t.type === 'INCOME');
        const expenseTransactions = result.transactions.filter(t => t.type === 'EXPENSE');
        const totalValue = result.transactions.reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0);

        console.log(`  ✅ Processado: ${result.transactions.length}/${result.totalProcessed} transações`);
        if (result.errors.length > 0) {
            console.log(`  ⚠️  Erros: ${result.errors.length}`);
        }

        return {
            filename,
            fileType: 'PDF',
            format: usedParser,
            success: result.transactions.length > 0,
            transactions: result.transactions.length,
            errors: result.errors.length,
            errorMessages: result.errors,
            totalValue,
            incomeCount: incomeTransactions.length,
            expenseCount: expenseTransactions.length
        };

    } catch (error) {
        console.log(`  ❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        return {
            filename,
            fileType: 'PDF',
            format: 'ERROR',
            success: false,
            transactions: 0,
            errors: 1,
            errorMessages: [error instanceof Error ? error.message : 'Erro desconhecido'],
            totalValue: 0,
            incomeCount: 0,
            expenseCount: 0
        };
    }
}

// Função principal de teste completo
async function testAllFiles() {
    console.log('🏦 TESTE COMPLETO DO SISTEMA DE IMPORTAÇÃO DE EXTRATOS');
    console.log('=====================================================\n');

    const testDir = '/app/examples-extratos';
    const results: TestResult[] = [];

    try {
        const files = fs.readdirSync(testDir);

        // Separar arquivos por tipo
        const csvFiles = files.filter(file => file.endsWith('.csv'));
        const excelFiles = files.filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
        const pdfFiles = files.filter(file => file.endsWith('.pdf'));

        console.log(`📊 RESUMO DOS ARQUIVOS ENCONTRADOS:`);
        console.log(`   📄 CSV: ${csvFiles.length} arquivos`);
        console.log(`   📊 Excel: ${excelFiles.length} arquivos`);
        console.log(`   📄 PDF: ${pdfFiles.length} arquivos`);
        console.log(`   📁 Total: ${files.length} arquivos\n`);

        // Testar arquivos CSV
        for (const csvFile of csvFiles) {
            const filePath = path.join(testDir, csvFile);
            const result = await testCSVFile(filePath);
            results.push(result);
        }

        // Testar arquivos Excel
        for (const excelFile of excelFiles) {
            const filePath = path.join(testDir, excelFile);
            const result = await testExcelFile(filePath);
            results.push(result);
        }

        // Testar arquivos PDF
        for (const pdfFile of pdfFiles) {
            const filePath = path.join(testDir, pdfFile);
            const result = await testPDFFile(filePath);
            results.push(result);
        }

        // Gerar relatório final
        console.log('\n\n📊 RELATÓRIO FINAL DE COMPATIBILIDADE');
        console.log('=====================================\n');

        const successfulFiles = results.filter(r => r.success);
        const failedFiles = results.filter(r => !r.success);
        const totalTransactions = results.reduce((sum, r) => sum + r.transactions, 0);

        console.log(`✅ SUCESSOS: ${successfulFiles.length}/${results.length} arquivos (${Math.round(successfulFiles.length / results.length * 100)}%)`);
        console.log(`❌ FALHAS: ${failedFiles.length}/${results.length} arquivos`);
        console.log(`📈 TRANSAÇÕES: ${totalTransactions} transações processadas\n`);

        // Relatório por tipo de arquivo
        console.log('📋 DETALHAMENTO POR TIPO:');

        const csvResults = results.filter(r => r.fileType === 'CSV');
        const csvSuccess = csvResults.filter(r => r.success).length;
        console.log(`   📄 CSV: ${csvSuccess}/${csvResults.length} sucessos`);

        const excelResults = results.filter(r => r.fileType === 'EXCEL');
        const excelSuccess = excelResults.filter(r => r.success).length;
        console.log(`   📊 Excel: ${excelSuccess}/${excelResults.length} sucessos`);

        const pdfResults = results.filter(r => r.fileType === 'PDF');
        const pdfSuccess = pdfResults.filter(r => r.success).length;
        console.log(`   📄 PDF: ${pdfSuccess}/${pdfResults.length} sucessos\n`);

        // Listar arquivos com problemas
        if (failedFiles.length > 0) {
            console.log('⚠️  ARQUIVOS COM PROBLEMAS:');
            failedFiles.forEach(file => {
                console.log(`   ❌ ${file.filename} (${file.fileType})`);
                if (file.errorMessages.length > 0) {
                    file.errorMessages.slice(0, 3).forEach(error => {
                        console.log(`      - ${error}`);
                    });
                }
            });
            console.log('');
        }

        // Listar sucessos
        console.log('✅ ARQUIVOS COMPATÍVEIS:');
        successfulFiles.forEach(file => {
            console.log(`   ✅ ${file.filename} (${file.fileType}) - ${file.transactions} transações`);
        });

        console.log('\n🎯 CONCLUSÃO:');
        if (successfulFiles.length === results.length) {
            console.log('🎉 TODOS OS ARQUIVOS SÃO COMPATÍVEIS! Sistema pronto para produção.');
        } else if (successfulFiles.length > results.length / 2) {
            console.log('✅ MAIORIA DOS ARQUIVOS É COMPATÍVEL. Necessários ajustes nos formatos com falha.');
        } else {
            console.log('⚠️  NECESSÁRIAS MELHORIAS SIGNIFICATIVAS no sistema de parsers.');
        }

    } catch (error) {
        console.error('Erro ao executar teste:', error instanceof Error ? error.message : 'Erro desconhecido');
    }
}

// Executar teste
testAllFiles().catch(console.error);
