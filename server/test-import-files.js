const path = require('path');
const fs = require('fs');

// Simular as classes TypeScript em JavaScript para teste
class CSVParser {
    static detectEncoding(buffer) {
        // Simulação simples - assumir UTF-8
        return 'utf8';
    }

    static detectFormat(headers) {
        const headerStr = headers.join('|').toLowerCase();

        console.log('Headers detectados:', headers);
        console.log('Header string:', headerStr);

        // Formato Nubank brasileiro: Data, Valor, Identificador, Descrição
        if (headerStr.includes('data') && headerStr.includes('valor') && headerStr.includes('descrição')) {
            return 'NUBANK_BR';
        }

        // Formato Nubank internacional: date, title, amount
        if (headerStr.includes('date') && headerStr.includes('title') && headerStr.includes('amount')) {
            return 'NUBANK_INTL';
        }

        // Formato original esperado pelo código: date, description, amount
        if (headerStr.includes('date') && headerStr.includes('description') && headerStr.includes('amount')) {
            return 'NUBANK';
        }

        // Banco do Brasil
        if (headerStr.includes('data') && headerStr.includes('histórico') && headerStr.includes('valor')) {
            return 'BANCO_BRASIL';
        }

        return 'GENERIC';
    }

    static parseDate(dateStr) {
        if (!dateStr) throw new Error('Data inválida');

        const cleanDate = dateStr.trim();

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

        throw new Error(`Formato de data não reconhecido: ${dateStr}`);
    }

    static parseAmount(amountStr) {
        if (!amountStr) return 0;

        let cleanAmount = amountStr.toString().trim();

        // Remove símbolos de moeda
        cleanAmount = cleanAmount.replace(/[R$\s]/g, '');

        // Detecta formato brasileiro com vírgula decimal
        const hasCommaDecimal = /\d{1,3}(?:\.\d{3})*,\d{2}$/.test(cleanAmount);

        if (hasCommaDecimal) {
            cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
        }

        const amount = parseFloat(cleanAmount);
        if (isNaN(amount)) {
            throw new Error(`Valor inválido: ${amountStr}`);
        }

        return amount;
    }

    static mapTransaction(row, format) {
        let description = '';
        let amount = 0;
        let date;

        console.log(`Processando linha com formato ${format}:`, row);

        switch (format) {
            case 'NUBANK_BR':
                // Data, Valor, Identificador, Descrição
                description = row['Descrição'] || '';
                amount = this.parseAmount(row['Valor'] || '0');
                date = this.parseDate(row['Data'] || '');
                break;

            case 'NUBANK_INTL':
                // date, title, amount
                description = row['title'] || '';
                amount = this.parseAmount(row['amount'] || '0');
                date = this.parseDate(row['date'] || '');
                break;

            case 'NUBANK':
                // date, description, amount
                description = row['description'] || '';
                amount = this.parseAmount(row['amount'] || '0');
                date = this.parseDate(row['date'] || '');
                break;

            default:
                // Tentar mapear automaticamente
                const possibleDescriptions = ['Descrição', 'description', 'descricao', 'title', 'historico'];
                const possibleAmounts = ['Valor', 'amount', 'valor', 'value'];
                const possibleDates = ['Data', 'date', 'data'];

                description = possibleDescriptions.find(key => row[key]) ? row[possibleDescriptions.find(key => row[key])] : '';
                const amountKey = possibleAmounts.find(key => row[key]);
                amount = amountKey ? this.parseAmount(row[amountKey]) : 0;
                const dateKey = possibleDates.find(key => row[key]);
                date = dateKey ? this.parseDate(row[dateKey]) : new Date();
                break;
        }

        const type = amount >= 0 ? 'INCOME' : 'EXPENSE';

        return {
            description: description.trim(),
            amount: Math.abs(amount),
            type,
            date,
            originalData: row
        };
    }
}

// Função para testar arquivo CSV
async function testCSVFile(filePath) {
    console.log(`\n=== TESTANDO ARQUIVO CSV: ${path.basename(filePath)} ===`);

    try {
        const csv = require('csv-parser');
        const fs = require('fs');
        const { Readable } = require('stream');

        const transactions = [];
        const errors = [];
        let totalProcessed = 0;
        let format = 'GENERIC';
        let isFirstRow = true;

        const content = fs.readFileSync(filePath, 'utf8');
        const stream = Readable.from([content]);

        return new Promise((resolve) => {
            stream
                .pipe(csv())
                .on('data', (row) => {
                    try {
                        totalProcessed++;

                        if (isFirstRow) {
                            const headers = Object.keys(row);
                            format = CSVParser.detectFormat(headers);
                            console.log(`Formato detectado: ${format}`);
                            isFirstRow = false;
                        }

                        const transaction = CSVParser.mapTransaction(row, format);
                        transactions.push(transaction);

                        console.log(`Transação ${totalProcessed}:`, {
                            date: transaction.date.toISOString().split('T')[0],
                            description: transaction.description.substring(0, 50) + '...',
                            amount: transaction.amount,
                            type: transaction.type
                        });

                    } catch (error) {
                        errors.push(`Linha ${totalProcessed}: ${error.message}`);
                        console.error(`Erro linha ${totalProcessed}:`, error.message);
                    }
                })
                .on('end', () => {
                    console.log(`\n📊 RESULTADO:`);
                    console.log(`- Total processado: ${totalProcessed}`);
                    console.log(`- Transações válidas: ${transactions.length}`);
                    console.log(`- Erros: ${errors.length}`);

                    if (errors.length > 0) {
                        console.log('\n❌ ERROS ENCONTRADOS:');
                        errors.forEach(error => console.log(`  - ${error}`));
                    }

                    resolve({ transactions, errors, format });
                });
        });

    } catch (error) {
        console.error('Erro ao processar arquivo:', error.message);
        return { transactions: [], errors: [error.message], format: 'ERROR' };
    }
}

// Função principal de teste
async function testImportFiles() {
    console.log('🧪 TESTE DE COMPATIBILIDADE DE ARQUIVOS DE EXTRATO');
    console.log('================================================\n');

    const testDir = '/app/test-extratos';

    try {
        const files = fs.readdirSync(testDir);
        const csvFiles = files.filter(file => file.endsWith('.csv'));

        console.log(`Arquivos CSV encontrados: ${csvFiles.length}`);

        for (const csvFile of csvFiles) {
            const filePath = path.join(testDir, csvFile);
            await testCSVFile(filePath);
        }

        console.log('\n✅ TESTE CONCLUÍDO!');
        console.log('\n📋 RESUMO:');
        console.log('- Verifique se todos os arquivos foram processados corretamente');
        console.log('- Identifique formatos não reconhecidos');
        console.log('- Ajuste o parser se necessário');

    } catch (error) {
        console.error('Erro ao executar teste:', error.message);
    }
}

// Executar teste
testImportFiles();
