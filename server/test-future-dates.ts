import { NubankParser } from './src/utils/parsers/NubankParser';
import * as fs from 'fs';
import * as path from 'path';

async function testFutureDateValidation() {
    console.log('🧪 TESTE DE VALIDAÇÃO DE DATAS FUTURAS');
    console.log('=====================================');

    // Criar arquivo CSV de teste com data futura
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 5); // 5 dias no futuro

    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 5); // 5 dias no passado

    const testCSV = `date,category,title,amount
${pastDate.toISOString().split('T')[0]},Food,"Almoço passado",-25.50
${futureDate.toISOString().split('T')[0]},Food,"Almoço futuro",-100.00
${today.toISOString().split('T')[0]},Income,"Salário hoje",3000.00`;

    const testFilePath = path.join(__dirname, 'test-future-dates.csv');
    fs.writeFileSync(testFilePath, testCSV);

    try {
        const parser = new NubankParser();
        const result = await parser.parseFile(testFilePath);

        console.log(`📊 Total processado: ${result.totalProcessed}`);
        console.log(`✅ Transações válidas: ${result.transactions.length}`);
        console.log(`⚠️  Erros: ${result.errors.length}`);

        if (result.errors.length > 0) {
            console.log('\n🚫 ERROS ENCONTRADOS:');
            result.errors.forEach(error => console.log(`   - ${error}`));
        }

        if (result.transactions.length > 0) {
            console.log('\n✅ TRANSAÇÕES VÁLIDAS:');
            result.transactions.forEach(tx => {
                console.log(`   - ${tx.date.toISOString().split('T')[0]}: ${tx.description} - R$ ${tx.amount}`);
            });
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        // Limpa arquivo de teste
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    }
}

testFutureDateValidation();
