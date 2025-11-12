````markdown
# 📋 GitHub Copilot - Budget App Context Overview

> **ℹ️ IMPORTANTE**: Este projeto usa uma estrutura hierárquica de instruções para AI agents.

## 🎯 **Nova Estrutura de Instruções (Novembro 2025)**

### **📄 Arquivos AGENTS.md - Instruções Específicas por Escopo**

**Seguindo as melhores práticas do VS Code, organizamos instruções específicas por diretório:**

- **`/AGENTS.md`** - Instruções gerais do projeto, arquitetura, e princípios fundamentais
- **`/client/AGENTS.md`** - Instruções específicas do frontend (React, TypeScript, Tailwind)
- **`/server/AGENTS.md`** - Instruções específicas do backend (Express, Prisma, APIs)

### **📄 Arquivo Principal (Auto-carregado pelo VS Code)**

**`.copilot-instructions.md`** - Instruções principais que o GitHub Copilot segue automaticamente

### **📚 Arquivos de Contexto Detalhado (.github/copilot/)**

- `copilot-context.md` - Documentação completa e autorativa (2900+ linhas)
- `copilot-config.md` - Configurações do VS Code e snippets úteis
- `copilot-examples.md` - Exemplos práticos de implementação
- `instructions/development-rules.md` - Regras técnicas obrigatórias
- `instructions/development-checklist.md` - Checklist completo para alterações
- `knowledge/reports-functionality.md` - Documentação específica de funcionalidades
- `context/development-status.md` - Status atual do desenvolvimento

## 🚨 **REGRAS OBRIGATÓRIAS PARA DESENVOLVIMENTO**

### 📋 **Antes de Qualquer Alteração:**

1. **Consulte os arquivos AGENTS.md apropriados:**
   - `/AGENTS.md` - Visão geral, arquitetura, princípios fundamentais
   - `/client/AGENTS.md` - Se trabalhando no frontend
   - `/server/AGENTS.md` - Se trabalhando no backend
2. **SEMPRE consulte `.github/copilot/copilot-context.md`** - Fonte única de verdade do sistema
3. **Leia `.github/copilot/instructions/development-rules.md`** - Regras técnicas obrigatórias
4. **Use `.github/copilot/instructions/development-checklist.md`** - Lista completa de verificação
5. **Verifique padrões de responsividade** - Mobile-first obrigatório
6. **Considere sistema de compartilhamento** - Suporte obrigatório a orçamentos compartilhados
7. **Valide permissões** - READ vs WRITE em orçamentos compartilhados
8. **Mantenha isolamento por orçamento** - Dados nunca podem vazar entre orçamentos

### 🔄 **Após Qualquer Alteração:**

1. **OBRIGATÓRIO: Atualize o AGENTS.md apropriado** (root, client ou server)
2. **OBRIGATÓRIO: Atualize `.github/copilot/copilot-context.md`** com as mudanças realizadas
3. **Documente novas funcionalidades** na seção apropriada do contexto
4. **Atualize exemplos de código** se necessário
5. **Registre data da atualização** no final dos arquivos
6. **Marque todos os itens do checklist** como concluídos

## ✅ **Benefícios da Nova Estrutura**

- ✅ **AGENTS.md por escopo** - Instruções específicas onde são necessárias
- ✅ **VS Code automaticamente carrega** as instruções principais
- ✅ **Uma única fonte de verdade** (copilot-context.md) complementada por instruções específicas
- ✅ **Não precisa mais referenciar arquivos manualmente**
- ✅ **Contextos detalhados organizados e acessíveis**
- ✅ **Eliminação de conflitos entre múltiplos arquivos**
- ✅ **Seguindo best practices do VS Code** para customização de agents

## 🔧 **Como Usar Agora**

### **Para Instruções Rápidas e Específicas:**

- Consulte o arquivo `AGENTS.md` do diretório em que está trabalhando
- `/AGENTS.md` - Arquitetura geral, princípios, workflows comuns
- `/client/AGENTS.md` - Padrões React, componentes, styling
- `/server/AGENTS.md` - Padrões API, Prisma, middleware, segurança

### **Para Contexto Completo e Detalhado:**

- `.github/copilot/copilot-context.md` - Documentação completa (2900+ linhas)
- `.github/copilot/copilot-examples.md` - Exemplos práticos de código
- `.github/copilot/instructions/development-rules.md` - Regras técnicas
- `.github/copilot/instructions/development-checklist.md` - Checklist de desenvolvimento

### **Comandos para o Copilot:**

```
"Seguindo as regras do AGENTS.md, implemente..."
"Baseado nos padrões do client/AGENTS.md, crie um componente para..."
"Conforme server/AGENTS.md, adicione uma rota para..."
"Respeitando o isolamento por orçamento documentado em AGENTS.md, desenvolva..."
```

## 🛠️ **Última Atualização: 12 de Novembro 2025**

- ✅ **Implementação de arquivos AGENTS.md** seguindo best practices do VS Code
- ✅ **Estrutura hierárquica** - root, client e server com instruções específicas
- ✅ **Consolidação de conteúdo** - Removida duplicação, mantida fonte única de verdade
- ✅ **Reorganização do .github/copilot** - Melhor navegação e clareza
- ✅ Limpeza de arquivos duplicados (versões anteriores)
- ✅ Consolidação no copilot-context.md como fonte única
- ✅ Remoção de informações fragmentadas
- ✅ **Adicionadas regras obrigatórias de desenvolvimento**
- ✅ **Criado checklist completo para alterações**
- ✅ **Estabelecido protocolo de atualização do contexto**
- ✅ **Alinhados padrões de responsividade com contexto principal**
- ✅ **Corrigidos breakpoints e padrões de rotas de compartilhamento**

---

_Contexto otimizado para GitHub Copilot e AI Agents seguindo VS Code best practices_
````
