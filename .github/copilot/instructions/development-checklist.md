# ✅ Development Checklist

## 🚨 **OBRIGATÓRIO par#### **Sistema de Compartilhamento\*\*

- [ ] Testei como proprietário do orçamento (OWNER)
- [ ] Testei como usuário com permissão WRITE
- [ ] Testei como usuário com permissão read-only (READ)
- [ ] Verificui banner informativo em orçamentos compartilhados
- [ ] Confirmei bloqueio de funcionalidades para READ-only
- [ ] Testei rotas próprias: `/api/{resource}` (sem budgetId)
- [ ] Testei rotas compartilhadas: `/api/budgets/:budgetId/{resource}`
- [ ] Validei middleware `budgetAuth` em rotas específicas
- [ ] Confirmei `requireWritePermission` em operações de escritaQUER Alteração\*\*

### 📋 **Pré-Desenvolvimento**

- [ ] Li completamente o arquivo `copilot-context.md`
- [ ] Entendi a arquitetura budget-centric do sistema
- [ ] Verifiquei padrões de responsividade existentes
- [ ] Confirmei requisitos de compartilhamento de orçamentos
- [ ] Identifiquei middleware de segurança necessário

### 🛠️ **Durante o Desenvolvimento**

#### **Responsividade (OBRIGATÓRIO)**

- [ ] Usei container padrão: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- [ ] Implementei design mobile-first
- [ ] Testei em breakpoints: sm, md, lg, xl
- [ ] Usei grid/flex responsivo apropriado

#### **Sistema de Compartilhamento (OBRIGATÓRIO)**

- [ ] Adicionei suporte a `budgetId?: string` nas props/APIs
- [ ] Implementei rotas duplas: `/api/resource` e `/api/budgets/:budgetId/resource`
- [ ] Usei padrão correto de rotas: `/api/budgets/:budgetId/{resource}/{sub-resource}`
- [ ] Implementei banner para orçamentos compartilhados
- [ ] Adicionei verificação de permissões (READ/WRITE)
- [ ] Desabilitei funcionalidades para usuários READ-only
- [ ] Usei contexto BudgetContext apropriadamente (`activeBudget?.budgetId`)

#### **Segurança e Isolamento (CRÍTICO)**

- [ ] Apliquei middleware `auth` em rotas autenticadas
- [ ] Usei `budgetAuth` para rotas de orçamento específico
- [ ] Adicionei `requireWritePermission` para operações de escrita
- [ ] Filtrei consultas por orçamento do usuário
- [ ] Validei que entidades pertencem ao orçamento correto

#### **Código e Padrões**

- [ ] Usei TypeScript estrito (sem `any`)
- [ ] Implementei tratamento de erros apropriado
- [ ] Segui padrões de nomenclatura estabelecidos
- [ ] Adicionei comentários para lógica complexa
- [ ] Validei dados de entrada (Joi/Zod)

### 🧪 **Testes (OBRIGATÓRIO)**

#### **Responsividade**

- [ ] Testei em dispositivo móvel (< 768px) - menu hamburger
- [ ] Testei em tablet (768px - 1024px) - bottom navigation
- [ ] Testei em desktop (> 1024px) - sidebar permanente
- [ ] Verifiquei scroll horizontal inexistente
- [ ] Confirmei legibilidade em todas as telas
- [ ] Validei transformação tabela→cards no mobile

#### **Sistema de Compartilhamento**

- [ ] Testei como proprietário do orçamento (OWNER)
- [ ] Testei como usuário com permissão WRITE
- [ ] Testei como usuário com permissão READ-only (READ)
- [ ] Verificui banner informativo em orçamentos compartilhados
- [ ] Confirmei bloqueio de funcionalidades para READ-only

#### **Segurança**

- [ ] Tentei acessar dados de outro orçamento (deve falhar)
- [ ] Testei com usuário não autenticado (deve redirecionar)
- [ ] Verificui que permissões são respeitadas na interface
- [ ] Confirmei que dados são filtrados por orçamento

### 📝 **Pós-Desenvolvimento (OBRIGATÓRIO)**

#### **Atualização do Contexto**

- [ ] **Atualizei `copilot-context.md`** com as mudanças
- [ ] Documentei novas funcionalidades na seção apropriada
- [ ] Adicionei exemplos de código quando relevante
- [ ] Atualizei changelog com data atual
- [ ] Revisei consistência com resto da documentação

#### **Seções do Contexto a Considerar:**

- [ ] 🎯 Funcionalidades Principais (se nova feature)
- [ ] 🏗️ Arquitetura do Projeto (se mudança estrutural)
- [ ] 📊 Modelo de Dados (se mudança no Prisma)
- [ ] 🔄 Fluxos de Trabalho (se novo processo)
- [ ] 🎨 Padrões de Código (se novo padrão)
- [ ] 🔧 APIs e Serviços (se nova API)
- [ ] 📱 Padrões de Interface (se nova interface)

#### **Documentação Adicional**

- [ ] Atualizei comentários no código
- [ ] Atualizei README.md se necessário
- [ ] Documentei breaking changes se aplicável
- [ ] Adicionei exemplos de uso se nova funcionalidade

#### **Versionamento Semântico (OBRIGATÓRIO)**

- [ ] Incrementei versão seguindo padrão MAJOR.MINOR.PATCH
- [ ] Client e server têm a MESMA versão no package.json
- [ ] Usei critério correto: MAJOR (breaking), MINOR (features), PATCH (fixes)
- [ ] Verificei sincronização: `grep '"version"' client/package.json server/package.json`

### ⚠️ **Validação Final**

- [ ] Código compilou sem erros TypeScript
- [ ] Testes automatizados passaram (se existirem)
- [ ] Interface funciona em todos os cenários de compartilhamento
- [ ] Responsividade verificada em todos os breakpoints
- [ ] Segurança validada (isolamento por orçamento)
- [ ] Contexto atualizado e revisado

---

## 🚫 **O QUE NUNCA FAZER:**

- ❌ Fazer alterações sem consultar o contexto
- ❌ Quebrar isolamento entre orçamentos
- ❌ Ignorar sistema de permissões
- ❌ Criar interfaces não responsivas
- ❌ Esquecer de atualizar a documentação
- ❌ Usar `any` no TypeScript
- ❌ Não tratar erros adequadamente
- ❌ Criar funcionalidades que não suportam compartilhamento

## ✅ **SEMPRE LEMBRAR:**

- 📋 **Contexto primeiro**: Sempre consulte `copilot-context.md`
- 🔒 **Segurança**: Validações em todas as camadas
- 📱 **Responsividade**: Mobile-first sempre
- 🤝 **Compartilhamento**: Suporte obrigatório
- 📝 **Documentação**: Atualize após qualquer mudança

---

**Este checklist deve ser seguido religiosamente para manter a qualidade e consistência do sistema!**
