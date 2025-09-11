# 🚨 Regras Obrigatórias de Desenvolvimento

## ⚠️ **LEIA ANTES DE FAZER QUALQUER ALTERAÇÃO**

### 📋 **PROTOCOLO OBRIGATÓRIO:**

#### 1. **PRÉ-DESENVOLVIMENTO**
- [ ] **Consultar `copilot-context.md`** - Arquivo principal com todas as regras
- [ ] **Verificar padrões de responsividade** estabelecidos
- [ ] **Validar compatibilidade com compartilhamento** de orçamentos
- [ ] **Confirmar requisitos de segurança** e isolamento

#### 2. **DURANTE O DESENVOLVIMENTO**
- [ ] **Aplicar padrões responsivos**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- [ ] **Implementar suporte a compartilhamento**: Props `budgetId?: string`
- [ ] **Usar middleware de segurança**: `auth`, `budgetAuth`, `requireWritePermission`
- [ ] **Manter isolamento por orçamento**: Filtros em todas as consultas
- [ ] **Validar permissões**: READ vs WRITE em orçamentos compartilhados

#### 3. **PÓS-DESENVOLVIMENTO**
- [ ] **OBRIGATÓRIO: Atualizar `copilot-context.md`**
- [ ] **Documentar novas funcionalidades** 
- [ ] **Adicionar exemplos de código** se aplicável
- [ ] **Registrar data da atualização**
- [ ] **Testar responsividade** em desktop, tablet e mobile
- [ ] **Testar compartilhamento** com permissões READ e WRITE

## 🏗️ **ARQUITETURA BUDGET-CENTRIC**

### **Princípios Fundamentais:**
1. **Tudo pertence a um orçamento** - Nunca criar entidades órfãs
2. **Isolamento total** - Dados de orçamentos diferentes nunca se misturam
3. **Permissões granulares** - READ/WRITE respeitadas em toda interface
4. **Validação multicamada** - Frontend + Middleware + Controller + Database

### **Padrões de API:**
```typescript
// Orçamento próprio
GET /api/accounts
POST /api/transactions

// Orçamento compartilhado  
GET /api/budgets/:budgetId/accounts
POST /api/budgets/:budgetId/transactions
```

### **Padrões de Interface:**
```typescript
// Sempre verificar permissões
const { activeBudget, isOwner } = useBudget();
const canWrite = isOwner || activeBudget?.permission === 'WRITE';

// Banner para orçamentos compartilhados
{activeBudget && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <Users className="h-5 w-5 text-blue-600 mr-3" />
    <div>
      <h3>Visualizando: {activeBudget.budget?.name}</h3>
      <p>Por {activeBudget.budget?.owner?.name} • {activeBudget.permission}</p>
    </div>
  </div>
)}
```

## 📱 **PADRÕES DE RESPONSIVIDADE**

### **Breakpoints Obrigatórios (Mobile First):**
- **Mobile (< 768px)**: Menu hamburger + drawer lateral
- **Tablet (768px - 1024px)**: Bottom navigation com ícones
- **Desktop (> 1024px)**: Sidebar permanente

### **Container Padrão:**
```typescript
<div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Conteúdo da página */}
  </div>
</div>
```

### **Layout Responsivo:**
```typescript
// Cards - linha para coluna
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">Card 1</div>
  <div className="flex-1">Card 2</div>
</div>

// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards responsivos */}
</div>

// Tabelas → Cards no mobile
<div className="hidden md:block">
  <Table />
</div>
<div className="md:hidden space-y-4">
  {data.map(item => <Card key={item.id} data={item} />)}
</div>
```

### **Botões e Formulários:**
```typescript
<button className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md">
  {/* Mobile: full width, Desktop: auto width */}
</button>
```

### **🚫 NUNCA Fazer:**
```typescript
// ❌ Larguras fixas que causam scroll horizontal
<div className="w-[1200px]">
<div className="min-w-[500px]">

// ✅ Sempre responsivo
<div className="w-full max-w-7xl">
<div className="min-w-0 flex-1">
<div className="overflow-x-auto"> // Scroll apenas quando necessário
```

## 🔒 **PADRÕES DE SEGURANÇA**

### **Middleware Obrigatório:**
```typescript
// Rotas públicas
router.post('/register', AuthController.register);

// Rotas autenticadas
router.use(auth);
router.get('/accounts', AccountController.getAccounts);

// Rotas de orçamento específico
router.use('/:budgetId/*', budgetAuth);
router.post('/:budgetId/transactions', requireWritePermission, TransactionController.create);
```

### **Validação de Queries:**
```typescript
// SEMPRE filtrar por orçamento
const accounts = await prisma.account.findMany({
  where: {
    budget: {
      OR: [
        { ownerId: req.user!.id },
        {
          shares: {
            some: {
              sharedWithId: req.user!.id,
              status: 'ACCEPTED'
            }
          }
        }
      ]
    }
  }
});
```

## 📝 **PROCESSO DE ATUALIZAÇÃO DO CONTEXTO**

### **Quando Atualizar:**
- ✅ Novas funcionalidades implementadas
- ✅ Alterações em APIs existentes  
- ✅ Mudanças na estrutura de dados
- ✅ Novos padrões ou regras estabelecidos
- ✅ Correções de bugs que afetam a arquitetura

### **Como Atualizar:**
1. **Localizar seção apropriada** no `copilot-context.md`
2. **Adicionar/atualizar documentação** técnica
3. **Incluir exemplos de código** quando relevante
4. **Atualizar changelog** com data atual
5. **Revisar consistência** com resto da documentação

### **Seções a Considerar:**
- 🎯 Funcionalidades Principais
- 🏗️ Arquitetura do Projeto  
- 📊 Modelo de Dados
- 🔄 Fluxos de Trabalho
- 🎨 Padrões de Código
- 🔧 APIs e Serviços
- 📱 Padrões de Interface

---

**⚠️ O não cumprimento dessas regras pode resultar em:**
- Quebra do sistema de compartilhamento
- Vulnerabilidades de segurança
- Interface não responsiva
- Inconsistências na arquitetura
- Documentação desatualizada

**📋 SEMPRE consulte `copilot-context.md` antes de qualquer alteração!**
