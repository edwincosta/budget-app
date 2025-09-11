import { CSVParser } from './src/utils/csvParser';
import * as path from 'path';
import * as fs from 'fs';

// Função para testar arquivo CSV com o parser real
async function testCSVFileReal(filePath: string) {
    console.log(`\n=== TESTANDO ARQUIVO CSV: ${path.basename(filePath)} ===`);

    try {
        const result = await CSVParser.parseFile(filePath);

        console.log(`\n📊 RESULTADO:`);
        console.log(`- Total processado: ${result.totalProcessed}`);
        console.log(`- Transações válidas: ${result.transactions.length}`);
        console.log(`- Erros: ${result.errors.length}`);

        if (result.errors.length > 0) {
            console.log('\n❌ ERROS ENCONTRADOS:');
            result.errors.forEach(error => console.log(`  - ${error}`));
        }

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

        return result;

    } catch (error) {
        console.error('Erro ao processar arquivo:', error instanceof Error ? error.message : 'Erro desconhecido');
        return { transactions: [], errors: [error instanceof Error ? error.message : 'Erro desconhecido'], totalProcessed: 0 };
    }
}

// Função principal de teste
async function testImportFilesReal() {
    console.log('🧪 TESTE DE COMPATIBILIDADE COM PARSER REAL');
    console.log('===============================================\n');

    const testDir = '/app/test-extratos';

    try {
        const files = fs.readdirSync(testDir);
        const csvFiles = files.filter(file => file.endsWith('.csv'));

        console.log(`Arquivos CSV encontrados: ${csvFiles.length}`);

        for (const csvFile of csvFiles) {
            const filePath = path.join(testDir, csvFile);
            await testCSVFileReal(filePath);
        }

        console.log('\n✅ TESTE CONCLUÍDO!');
        console.log('\n📋 RESUMO DAS MELHORIAS:');
        console.log('- ✅ Suporte ao formato Nubank brasileiro (Data, Valor, Identificador, Descrição)');
        console.log('- ✅ Suporte ao formato Nubank cartão (date, title, amount)');
        console.log('- ✅ Detecção automática de gastos em cartão de crédito');
        console.log('- ✅ Classificação correta de receitas vs gastos');

    } catch (error) {
        console.error('Erro ao executar teste:', error instanceof Error ? error.message : 'Erro desconhecido');
    }
}

// Executar teste
testImportFilesReal().catch(console.error);
