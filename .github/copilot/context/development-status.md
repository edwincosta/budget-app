# 🚀 Budget App - Contexto de Desenvolvimento

## 📝 Atualizações Recentes

### 🗓️ Setembro 2025 - Funcionalidade de Compartilhamento

#### ✅ **Correções Implementadas**
- Alinhamento de permissões com schema do banco (READ/WRITE)
- Limpeza de arquivos duplicados da funcionalidade de compartilhamento
- Interface simplificada com radio buttons para seleção de permissão
- Tipos TypeScript corrigidos e consistentes

#### 📁 **Arquivos Principais da Funcionalidade**
- `client/src/components/ShareManager.tsx` - Componente principal (implementação completa)
- `client/src/pages/Sharing.tsx` - Página de compartilhamento
- `server/src/routes/sharing.ts` - Rotas da API de compartilhamento
- `server/src/middleware/budgetAuth.ts` - Middleware de autorização
- `.github/copilot/knowledge/sharing-feature.md` - Documentação detalhada

#### 🗑️ **Arquivos Removidos (Duplicatas)**
- ❌ `ShareManagerNew.tsx` (versão de teste)
- ❌ `SHARING_FEATURE.md` (documentação inicial)
- ❌ `STATUS_COMPARTILHAMENTO.md` (status intermediário)
- ❌ `IMPLEMENTACAO_COMPARTILHAMENTO.md` (resumo intermediário)
- ❌ `SHARING_FEATURE_COMPLETE.md` (movido para estrutura do Copilot)

---

## 🎯 Estado Atual do Projeto

### ✅ **Funcionalidades Completamente Implementadas**
1. **Autenticação de Usuários** - Login/registro com JWT
2. **Gestão de Orçamentos** - CRUD completo
3. **Sistema de Contas** - Diferentes tipos de conta
4. **Categorização** - Receitas e despesas
5. **Transações Financeiras** - Registro completo de movimentação
6. **Orçamentos Planejados** - Definição de metas por categoria
7. **Compartilhamento** - Sistema READ/WRITE entre usuários
8. **Relatórios** - Análises e comparativos
9. **Dashboard** - Visão geral das finanças

### 🔧 **Status dos Containers**
- **Database** (`budget_db`): PostgreSQL 15
- **Server** (`budget_server`): Node.js + Express + Prisma
- **Client** (`budget_client`): React + Vite + Tailwind

### 🌐 **Endpoints Disponíveis**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Database:** localhost:5432

---

## 📋 Padrões de Desenvolvimento

### 🎨 **Frontend (React + TypeScript)**
```typescript
// Padrão de componentes funcionais com hooks
const ComponentName: React.FC = () => {
  const [state, setState] = useState<Type>([]);
  
  useEffect(() => {
    // Lógica de carregamento
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Tailwind CSS classes */}
    </div>
  );
};
```

### 🔧 **Backend (Express + TypeScript)**
```typescript
// Padrão de rotas com middleware
router.get('/endpoint', auth, budgetAuth, async (req: BudgetAuthRequest, res) => {
  try {
    // Lógica da rota
    res.json({ data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

### 🗄️ **Database (Prisma)**
```typescript
// Padrão de consultas com Prisma
const result = await prisma.model.findMany({
  where: { condition },
  include: { relations: true },
  orderBy: { field: 'desc' }
});
```

---

## 🧪 Como Testar Funcionalidades

### 🔐 **Compartilhamento de Orçamentos**
1. Registrar dois usuários diferentes
2. Usuário A: criar orçamento com dados
3. Usuário A: acessar `/sharing` e enviar convite
4. Usuário B: fazer login e visualizar convites
5. Usuário B: aceitar convite
6. Verificar acesso conforme permissão (READ/WRITE)

### 💰 **Fluxo de Transações**
1. Criar conta bancária
2. Definir categorias de receita/despesa
3. Registrar transação associando conta e categoria
4. Verificar atualização de saldo e relatórios

### 📊 **Orçamentos vs Realizado**
1. Definir orçamento mensal por categoria
2. Registrar transações nas categorias
3. Acessar relatórios de comparação
4. Verificar status (bom/alerta/excedido)

---

## 🚨 Problemas Conhecidos e Soluções

### ❌ **Erro de JWT "invalid signature"**
**Solução:** Verificar se `JWT_SECRET` está definido corretamente nos containers

### ❌ **Tela em branco na página de Compartilhamento**
**Solução:** ✅ **Resolvido** - Componente simplificado e erros corrigidos

### ❌ **Permissões inconsistentes**
**Solução:** ✅ **Resolvido** - Alinhado com schema READ/WRITE

---

## 📚 Recursos de Referência

### 🔗 **Documentação Técnica**
- [Prisma Schema](../server/prisma/schema.prisma)
- [API Routes](../server/src/routes/)
- [Frontend Components](../client/src/components/)
- [Types Definition](../client/src/types/index.ts)

### 🛠️ **Comandos Úteis**
```bash
# Iniciar ambiente de desenvolvimento
docker-compose up --build -d

# Ver logs dos containers
docker logs budget_server --tail 20
docker logs budget_client --tail 20

# Reiniciar apenas um container
docker restart budget_client

# Acessar banco de dados
docker exec -it budget_db psql -U budget -d budget

# Executar migrations
docker exec -it budget_server npx prisma migrate deploy

# Gerar cliente Prisma
docker exec -it budget_server npx prisma generate
```

---

**💡 Este arquivo serve como contexto rápido para desenvolvimento e manutenção do sistema.**
