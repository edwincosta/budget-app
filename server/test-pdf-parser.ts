import { PDFParser } from './src/utils/pdfParser';
import * as path from 'path';
import * as fs from 'fs';

// Função para testar arquivo PDF
async function testPDFFile(filePath: string) {
    console.log(`\n=== TESTANDO ARQUIVO PDF: ${path.basename(filePath)} ===`);

    try {
        const result = await PDFParser.parseFile(filePath);

        console.log(`\n📊 RESULTADO:`);
        console.log(`- Total processado: ${result.totalProcessed}`);
        console.log(`- Transações válidas: ${result.transactions.length}`);
        console.log(`- Erros: ${result.errors.length}`);

        if (result.errors.length > 0) {
            console.log('\n❌ ERROS ENCONTRADOS:');
            result.errors.forEach(error => console.log(`  - ${error}`));
        }

        if (result.transactions.length > 0) {
            console.log('\n📋 PRIMEIRAS 5 TRANSAÇÕES:');
            result.transactions.slice(0, 5).forEach((t, i) => {
                console.log(`${i + 1}. ${t.date.toISOString().split('T')[0]} | ${t.type} | R$ ${t.amount.toFixed(2)} | ${t.description.substring(0, 50)}...`);
            });

            // Análise por tipo
            const income = result.transactions.filter(t => t.type === 'INCOME');
            const expenses = result.transactions.filter(t => t.type === 'EXPENSE');

            console.log('\n💰 ANÁLISE POR TIPO:');
            console.log(`  Receitas: ${income.length} transações`);
            console.log(`  Gastos: ${expenses.length} transações`);
            console.log(`  Total receitas: R$ ${income.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);
            console.log(`  Total gastos: R$ ${expenses.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);
        } else {
            console.log('\n⚠️ Nenhuma transação encontrada. Possíveis causas:');
            console.log('  - PDF pode ser protegido ou sem texto extraível');
            console.log('  - Formato não reconhecido pelos padrões atuais');
            console.log('  - Arquivo pode estar corrompido');
        }

        return result;

    } catch (error) {
        console.error('Erro ao processar arquivo PDF:', error instanceof Error ? error.message : 'Erro desconhecido');
        return { transactions: [], errors: [error instanceof Error ? error.message : 'Erro desconhecido'], totalProcessed: 0 };
    }
}

// Função principal de teste
async function testPDFFiles() {
    console.log('📄 TESTE DE ARQUIVOS PDF');
    console.log('========================\n');

    const testDir = '/app/test-extratos';

    try {
        const files = fs.readdirSync(testDir);
        const pdfFiles = files.filter(file => file.endsWith('.pdf'));

        console.log(`Arquivos PDF encontrados: ${pdfFiles.length}`);

        for (const pdfFile of pdfFiles) {
            const filePath = path.join(testDir, pdfFile);
            await testPDFFile(filePath);
        }

        console.log('\n✅ TESTE PDF CONCLUÍDO!');

    } catch (error) {
        console.error('Erro ao executar teste:', error instanceof Error ? error.message : 'Erro desconhecido');
    }
}

// Executar teste
testPDFFiles().catch(console.error);
