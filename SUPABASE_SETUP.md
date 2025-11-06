# 🗄️ CONFIGURAÇÃO DO SUPABASE (Banco de Dados Gratuito)

## 📝 **PASSO A PASSO**

### **1. Criar Projeto no Supabase**

1. **Acesse**: https://supabase.com
2. **Login**: Use GitHub/Google ou crie conta
3. **Novo Projeto**: Clique em "New Project"
4. **Configuração**:
   - **Name**: `budget-app`
   - **Database Password**: `[ANOTE ESSA SENHA - MUITO IMPORTANTE!]`
   - **Region**: `South America (São Paulo)`
   - **Pricing**: `Free` (sempre gratuito)

### **2. Obter Credenciais**

Após criar o projeto, você terá acesso às seguintes informações:

#### **2.1 Connection String**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

#### **2.2 Project Settings**
- Acesse: `Settings > API`
- **Project URL**: `https://[PROJECT_REF].supabase.co`
- **Anon Public Key**: `eyJhbGci...` (chave pública)
- **Service Role Key**: `eyJhbGci...` (chave privada - CUIDADO!)

### **3. Configurar Variáveis de Ambiente**

Copie o arquivo `.env.example` para `.env` e atualize:

```bash
# Supabase Database
DATABASE_URL="postgresql://postgres:[SUA_SENHA]@db.[SEU_PROJECT_REF].supabase.co:5432/postgres"

# JWT (gere uma chave secreta forte)
JWT_SECRET="sua_chave_super_secreta_minimo_32_caracteres_muito_segura"

# Supabase (opcional)
SUPABASE_URL="https://[SEU_PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="[SUA_ANON_KEY]"
SUPABASE_SERVICE_KEY="[SUA_SERVICE_KEY]"
```

### **4. Migrar Banco de Dados**

Execute os comandos para configurar o schema:

```bash
# Instalar dependências
cd server
npm install

# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate:deploy

# Executar seeds (usuários de teste)
npm run db:seed
```

### **5. Verificar Conexão**

Teste a conexão com o banco:

```bash
# Verificar conexão
npm run test:connection

# Listar usuários (deve mostrar joao, maria, pedro)
npm run list:users
```

## ✅ **CHECKLIST DE VERIFICAÇÃO**

- [ ] Projeto criado no Supabase
- [ ] Senha do banco anotada em local seguro
- [ ] CONNECTION_STRING obtida
- [ ] Variáveis de ambiente configuradas
- [ ] Migrações executadas com sucesso
- [ ] Usuários de teste criados
- [ ] Conexão testada e funcionando

## 🔑 **INFORMAÇÕES IMPORTANTES**

### **Limites do Tier Gratuito**
- ✅ **500MB** de banco de dados
- ✅ **2GB** de bandwidth mensal
- ✅ **50MB** de storage para arquivos
- ✅ **2 projetos** simultâneos
- ✅ **Auto-suspend** após 7 dias de inatividade

### **Para 2 usuários**
Você usará menos de **1%** dos limites gratuitos! 

### **Próximos Passos**
Após configurar o Supabase, continuaremos com:
1. Deploy do backend (Railway/Render)
2. Deploy do frontend (Firebase)
3. Configuração de domínio personalizado