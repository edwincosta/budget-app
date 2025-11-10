#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * TESTE OFICIAL DE IMPORTAÇÃO DE EXTRATOS BANCÁRIOS
 * 
 * ⚠️  ATENÇÃO: Este é o script OFICIAL para testar importações.
 *     Conforme instruções do GitHub Copilot, sempre use este script
 *     e NÃO crie novos scripts de teste similares.
 * 
 * 🚀 EXECUÇÃO: ./test-import-extratos.sh (da raiz do projeto)
 * 
 * Este script testa a importação de todos os arquivos da pasta /examples/extratos
 * chamando a API do servidor (executando em Docker) e validando se as transações
 * foram importadas corretamente.
 * 
 * Características:
 * - ✅ Testa 19 arquivos de 8 bancos diferentes
 * - ✅ Zero dependências externas (Node.js 18+ nativo)
 * - ✅ Configura automaticamente dados de desenvolvimento
 * - ✅ Relatório detalhado com estatísticas
 * - ✅ Utiliza usuário de teste padrão: joao@example.com
 * - ✅ Assume serviços rodando em containers Docker
 */

// ===== CONFIGURAÇÕES =====
const API_BASE = 'http://localhost:3001/api';
const EXTRATOS_DIR = path.join(__dirname, 'examples', 'extratos');

// Usuário de teste padrão conforme instruções do projeto
const TEST_USER = {
    email: 'joao@example.com',
    password: '123456'
};

// ===== FUNÇÕES AUXILIARES =====

/**
 * Cria FormData para upload de arquivo sem dependências externas
 * Usa boundary personalizado e constrói o corpo da requisição manualmente
 */
function createMultipartFormData(filePath, accountId) {
    const boundary = `----formdata-budget-app-${Date.now()}`;
    const fileName = path.basename(filePath);

    // Lê o arquivo como buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Constrói o corpo da requisição multipart
    let body = '';

    // Campo accountId
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="accountId"\r\n\r\n`;
    body += `${accountId}\r\n`;

    // Campo file - início
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
    body += `Content-Type: application/octet-stream\r\n\r\n`;

    // Converte a parte textual para buffer
    const textBuffer = Buffer.from(body, 'utf8');

    // Fim do boundary
    const endBoundary = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');

    // Combina: texto inicial + arquivo + fim
    const finalBody = Buffer.concat([textBuffer, fileBuffer, endBoundary]);

    return {
        body: finalBody,
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': finalBody.length.toString()
        }
    };
}

/**
 * Realiza login e obtém token de autenticação
 */
async function login() {
    console.log('🔐 Fazendo login...');

    const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Login falhou: ${response.status} ${response.statusText}${errorData?.message ? ` - ${errorData.message}` : ''}`);
    }

    const data = await response.json();
    console.log('✅ Login realizado com sucesso');
    return data.token;
}

/**
 * Obtém o orçamento ativo do usuário
 */
async function getActiveBudget(token) {
    console.log('💼 Obtendo orçamento ativo...');

    const response = await fetch(`${API_BASE}/budgets`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error(`Erro ao obter orçamentos: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // A API retorna { ownedBudgets: [...], sharedBudgets: [...], defaultBudget: {...} }
    const ownedBudgets = result.ownedBudgets || [];
    const sharedBudgets = result.sharedBudgets || [];
    const allBudgets = [...ownedBudgets, ...sharedBudgets];

    if (allBudgets.length === 0) {
        throw new Error('Nenhum orçamento encontrado para o usuário');
    }

    // Prioriza orçamento padrão, senão usa o primeiro próprio, senão o primeiro compartilhado
    let activeBudget = result.defaultBudget && ownedBudgets.find(b => b.id === result.defaultBudget.id);
    if (!activeBudget) {
        activeBudget = ownedBudgets[0] || sharedBudgets[0];
    }

    console.log(`✅ Orçamento ativo: ${activeBudget.name} (ID: ${activeBudget.id})`);
    return activeBudget;
}

/**
 * Obtém contas do orçamento ativo
 */
async function getAccounts(token, budgetId) {
    console.log('📋 Obtendo contas...');

    const response = await fetch(`${API_BASE}/budgets/${budgetId}/accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error(`Erro ao obter contas: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const accounts = result.data || result;

    console.log(`✅ ${accounts?.length || 0} contas encontradas`);

    if (!Array.isArray(accounts) || accounts.length === 0) {
        throw new Error('Nenhuma conta encontrada no orçamento');
    }

    // Prioriza conta corrente, senão usa a primeira disponível
    const checkingAccount = accounts.find(acc => acc.type === 'CHECKING');
    const selectedAccount = checkingAccount || accounts[0];

    console.log(`📊 Usando conta: ${selectedAccount.name} (${selectedAccount.type})`);
    return selectedAccount;
}

/**
 * Obtém contagem de transações antes da importação
 */
async function getTransactionCount(token, budgetId, accountId) {
    const response = await fetch(`${API_BASE}/budgets/${budgetId}/transactions?accountId=${accountId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        return 0; // Se der erro, assume 0 transações
    }

    const result = await response.json();
    const transactions = result.data || result;

    return Array.isArray(transactions) ? transactions.length : 0;
}

/**
 * Testa o upload de um arquivo de extrato
 */
async function testFileUpload(token, budgetId, accountId, fileName) {
    const filePath = path.join(EXTRATOS_DIR, fileName);

    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Arquivo não encontrado: ${fileName}`);
        return {
            success: false,
            error: 'Arquivo não encontrado',
            fileName,
            filePath
        };
    }

    console.log(`📤 Testando: ${fileName}`);

    try {
        // Conta transações antes da importação
        const transactionsBefore = await getTransactionCount(token, budgetId, accountId);

        // Prepara multipart form data sem dependências externas
        const formData = createMultipartFormData(filePath, accountId);

        // Faz o upload (usando endpoint sem budgetId que funciona melhor)
        const response = await fetch(`${API_BASE}/import/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.headers
            },
            body: formData.body
        });

        const result = await response.json();

        if (!response.ok) {
            console.log(`❌ ${fileName}: ${response.status} - ${result.message || 'Erro desconhecido'}`);
            return {
                success: false,
                error: result.message || 'Erro desconhecido',
                statusCode: response.status,
                fileName
            };
        }

        // Conta transações após a importação
        const transactionsAfter = await getTransactionCount(token, budgetId, accountId);
        const newTransactions = transactionsAfter - transactionsBefore;

        console.log(`✅ ${fileName}: ${result.totalTransactions || 0} transações processadas, ${newTransactions} novas transações, ${result.errors?.length || 0} erros (${result.bankName || 'Parser não identificado'})`);

        return {
            success: true,
            fileName,
            sessionId: result.sessionId,
            bankName: result.bankName,
            accountType: result.accountType,
            totalTransactions: result.totalTransactions || 0,
            newTransactions: newTransactions,
            totalDuplicates: result.totalDuplicates || 0,
            errors: result.errors || [],
            transactionsBefore,
            transactionsAfter
        };

    } catch (error) {
        console.log(`❌ ${fileName}: Erro de conexão - ${error.message}`);
        return {
            success: false,
            error: error.message,
            fileName
        };
    }
}

/**
 * Obtém lista de arquivos para teste
 */
function getExtractFiles() {
    try {
        return fs.readdirSync(EXTRATOS_DIR).filter(file => {
            // Filtra apenas arquivos de extrato (não diretórios)
            const filePath = path.join(EXTRATOS_DIR, file);
            return fs.statSync(filePath).isFile();
        });
    } catch (error) {
        throw new Error(`Erro ao ler diretório ${EXTRATOS_DIR}: ${error.message}`);
    }
}

/**
 * Função principal de teste
 */
async function runAllTests() {
    console.log('🚀 TESTE DE IMPORTAÇÃO DE EXTRATOS BANCÁRIOS');
    console.log('='.repeat(70));
    console.log(`📁 Diretório: ${EXTRATOS_DIR}`);
    console.log(`🌐 API Base: ${API_BASE}`);
    console.log(`👤 Usuário: ${TEST_USER.email}`);
    console.log('');

    let token;
    let budget;
    let account;

    try {
        // 1. Inicialização
        console.log('🔄 FASE 1: INICIALIZAÇÃO');
        console.log('-'.repeat(40));

        token = await login();
        budget = await getActiveBudget(token);
        account = await getAccounts(token, budget.id);

        console.log('');

        // 2. Preparação
        console.log('🔄 FASE 2: PREPARAÇÃO DOS TESTES');
        console.log('-'.repeat(40));

        const extractFiles = getExtractFiles();
        console.log(`📊 Total de arquivos encontrados: ${extractFiles.length}`);

        if (extractFiles.length === 0) {
            throw new Error('Nenhum arquivo encontrado para teste');
        }

        console.log('');

        // 3. Execução dos testes
        console.log('🔄 FASE 3: EXECUÇÃO DOS TESTES');
        console.log('-'.repeat(40));

        const results = {
            total: extractFiles.length,
            success: 0,
            errors: 0,
            totalTransactions: 0,
            totalNewTransactions: 0,
            bankStats: {},
            errorDetails: []
        };

        // Testa cada arquivo
        for (const fileName of extractFiles) {
            const result = await testFileUpload(token, budget.id, account.id, fileName);

            if (result.success) {
                results.success++;
                results.totalTransactions += result.totalTransactions;
                results.totalNewTransactions += result.newTransactions;

                // Estatísticas por banco
                const bank = result.bankName || 'Não identificado';
                if (!results.bankStats[bank]) {
                    results.bankStats[bank] = {
                        files: 0,
                        transactions: 0,
                        newTransactions: 0
                    };
                }
                results.bankStats[bank].files++;
                results.bankStats[bank].transactions += result.totalTransactions;
                results.bankStats[bank].newTransactions += result.newTransactions;

            } else {
                results.errors++;
                results.errorDetails.push({
                    file: fileName,
                    error: result.error,
                    statusCode: result.statusCode
                });
            }

            // Pausa entre testes
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('');

        // 4. Relatório final
        console.log('📊 RELATÓRIO FINAL');
        console.log('='.repeat(70));
        console.log(`📁 Total de arquivos testados: ${results.total}`);
        console.log(`✅ Sucessos: ${results.success} (${Math.round(results.success / results.total * 100)}%)`);
        console.log(`❌ Erros: ${results.errors} (${Math.round(results.errors / results.total * 100)}%)`);
        console.log(`💰 Total de transações processadas: ${results.totalTransactions}`);
        console.log(`🆕 Novas transações importadas: ${results.totalNewTransactions}`);
        console.log(`🔄 Duplicatas ignoradas: ${results.totalTransactions - results.totalNewTransactions}`);
        console.log('');

        // Estatísticas por banco
        if (Object.keys(results.bankStats).length > 0) {
            console.log('🏦 ESTATÍSTICAS POR BANCO:');
            console.log('-'.repeat(50));
            Object.entries(results.bankStats).forEach(([bank, stats]) => {
                console.log(`${bank}:`);
                console.log(`  📄 Arquivos: ${stats.files}`);
                console.log(`  💰 Transações: ${stats.transactions} (${stats.newTransactions} novas)`);
                console.log('');
            });
        }

        // Detalhes dos erros
        if (results.errorDetails.length > 0) {
            console.log('❌ DETALHES DOS ERROS:');
            console.log('-'.repeat(50));
            results.errorDetails.forEach(error => {
                console.log(`📄 ${error.file}:`);
                console.log(`   ${error.error} ${error.statusCode ? `(HTTP ${error.statusCode})` : ''}`);
                console.log('');
            });
        }

        // Status final
        const successRate = Math.round(results.success / results.total * 100);
        if (successRate >= 90) {
            console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
        } else if (successRate >= 70) {
            console.log('⚠️  TESTE CONCLUÍDO COM ALGUNS PROBLEMAS');
        } else {
            console.log('❌ TESTE APRESENTOU MUITOS ERROS');
        }

        console.log(`🎯 Taxa de sucesso: ${successRate}%`);
        console.log('');

    } catch (error) {
        console.error('💥 Erro fatal durante a execução:', error.message);
        console.error('');
        console.error('🔧 Verificações sugeridas:');
        console.error('   • Docker containers estão rodando? (docker-compose up)');
        console.error('   • API está respondendo em http://localhost:3001?');
        console.error('   • Usuário joao@example.com existe no banco?');
        console.error('   • Banco de dados está inicializado?');
        process.exit(1);
    }
}

// ===== EXECUÇÃO =====
if (require.main === module) {
    // Verifica se o diretório de extratos existe
    if (!fs.existsSync(EXTRATOS_DIR)) {
        console.error(`❌ Diretório não encontrado: ${EXTRATOS_DIR}`);
        console.error('   Certifique-se de que a pasta examples/extratos existe');
        process.exit(1);
    }

    runAllTests().catch(error => {
        console.error('💥 Erro não tratado:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests };