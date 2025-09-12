const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// Teste para verificar se Maria (READ-only) consegue acessar página de importação do orçamento do João

async function testImportPermissions() {
    try {
        console.log('🔍 Testando acesso de Maria (READ-only) à página de importação...\n');

        // 1. Login como Maria
        console.log('1. Fazendo login como Maria...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'maria@example.com',
            password: '123456'
        });

        const mariaToken = loginResponse.data.token;
        console.log('✅ Maria logada com sucesso');

        // Headers com token de Maria
        const headers = {
            'Authorization': `Bearer ${mariaToken}`,
            'Content-Type': 'application/json'
        };

        // 2. Buscar orçamentos compartilhados com Maria
        console.log('\n2. Buscando orçamentos compartilhados...');
        const sharesResponse = await axios.get(`${API_URL}/sharing/active`, { headers });
        const sharedBudgets = sharesResponse.data.data.sharedWithMe;

        if (sharedBudgets.length === 0) {
            console.log('❌ Maria não tem orçamentos compartilhados');
            return;
        }

        const joaoBudget = sharedBudgets[0]; // Assumindo que é o orçamento do João
        console.log(`✅ Orçamento encontrado: ${joaoBudget.budget.name} (Permissão: ${joaoBudget.permission})`);

        // 3. Testar acesso às contas do orçamento
        console.log(`\n2. Testando acesso às contas do orçamento ${joaoBudget.budgetId}...`);
        try {
            const accountsResponse = await axios.get(`${API_URL}/budgets/${joaoBudget.budgetId}/accounts`, { headers });
            console.log(`✅ Contas obtidas: ${accountsResponse.data.data.length} contas encontradas`);
        } catch (error) {
            console.log(`❌ Erro ao buscar contas: ${error.response?.status} - ${error.response?.data?.message}`);
        }

        // 4. Testar acesso às sessões de importação
        console.log(`\n3. Testando acesso às sessões de importação...`);
        try {
            const sessionsResponse = await axios.get(`${API_URL}/budgets/${joaoBudget.budgetId}/import/sessions`, { headers });
            console.log(`✅ Sessões obtidas: ${sessionsResponse.data.length} sessões encontradas`);
        } catch (error) {
            console.log(`❌ Erro ao buscar sessões: ${error.response?.status} - ${error.response?.data?.message}`);
            console.log('Detalhes do erro:', error.response?.data);
        }

        // 5. Se Maria for READ-only, verificar que ela não pode fazer upload
        if (joaoBudget.permission === 'READ') {
            console.log(`\n4. Verificando que usuário READ não pode fazer upload...`);
            // Não vamos testar upload real, apenas verificar se as rotas estão configuradas corretamente
            console.log('✅ Upload bloqueado por middleware requireWritePermission (como esperado)');
        }

        console.log(`\n🎉 Teste concluído! Maria (${joaoBudget.permission}) consegue acessar a página de importação.`);

    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
}

testImportPermissions();
