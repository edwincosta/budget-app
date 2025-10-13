# Development Utils

Este diretório contém utilitários de desenvolvimento: sistema de seed automático e parsers de extratos bancários.

## 📁 Estrutura

```
utils/
├── DEVELOPMENT.md              # Este arquivo
├── seed.ts                     # Sistema de seed para desenvolvimento  
├── csvParser.ts                # Parser de arquivos CSV
├── pdfParser.ts                # Parser de arquivos PDF
├── excelParser.ts              # Parser de arquivos Excel
├── advancedCsvParser.ts        # Parser CSV avançado
├── duplicateDetector.ts        # Detector de duplicatas
└── parsers/                    # Parsers específicos por banco
```

## 🌱 Sistema de Seed (Desenvolvimento)

Sistema automático para criar dados de teste no ambiente de desenvolvimento.

## Como Funciona

### Execução Automática
- **Desenvolvimento**: O seed é executado automaticamente quando o servidor inicia em modo development
- **Produção**: O seed NÃO é executado em produção
- **Detecção Inteligente**: Se já existem usuários no banco, o seed é pulado

### Dados Criados

#### 👤 **Usuários de Teste**
- **joao@example.com** / senha: `123456`
- **maria@example.com** / senha: `123456` 
- **pedro@example.com** / senha: `123456`

#### 📊 **Orçamentos**
- Cada usuário recebe um orçamento padrão chamado "Meu Orçamento"
- O orçamento é automaticamente definido como `defaultBudgetId`

#### 🏷️ **Categorias (15 total)**

**Receitas (5):**
- Salário 💰
- Freelance 💻  
- Investimentos 📈
- Vendas 🛍️
- Outros (Receita) 🎯

**Despesas (10):**
- Alimentação 🍽️
- Transporte 🚗
- Moradia 🏠
- Saúde 🏥
- Educação 📚
- Lazer 🎉
- Roupas 👕
- Serviços 🔧
- Impostos 📋
- Outros (Despesa) 📦

#### 💳 **Contas**
Para cada usuário:
- **Conta Corrente**: R$ 1.000,00
- **Poupança**: R$ 5.000,00  
- **Cartão de Crédito**: R$ 0,00

## Comandos

### Executar Seed Manualmente
```bash
# Dentro do container do servidor
npm run seed
```

### Resetar Banco + Seed
```bash
# Reseta banco e reaplica migrações
npm run prisma:reset -- --force

# Depois executa seed
npm run seed
```

### Verificar Status
```bash
# Ver se há usuários no banco
npm run prisma:studio
```

## Arquivos

- **`seed.ts`**: Script principal de seed
- **Integração**: `src/index.ts` (linhas de inicialização)
- **Script npm**: `package.json` (`npm run seed`)

## Comportamento

1. **Primeira execução**: Cria todos os dados
2. **Execuções subsequentes**: Detecta dados existentes e pula
3. **Reset de banco**: Apaga tudo, próximo restart recria
4. **Produção**: Nunca executa (NODE_ENV !== 'development')

---

✅ **O seed garante que o ambiente de desenvolvimento sempre tenha dados consistentes para teste!**

## 📄 Sistema de Parsers (Importação)

Sistema para processar extratos bancários de múltiplos formatos e bancos brasileiros.

### 🏦 **Bancos Suportados**

**CSV:**
- Nubank (Conta e Cartão)
- BTG Pactual  
- Bradesco
- Itaú
- C6 Bank
- Clear
- Inter
- XP Investimentos

**PDF:**
- Nubank (Faturas)
- BTG Pactual (Extratos)
- Bancos com padrões comuns

**Excel:**
- Clear (formato .xlsx)
- BTG Pactual (formato .xlsx)
- Formatos padronizados

### 📋 **Funcionalidades**

#### ✅ **Detecção Automática**
- **Encoding**: UTF-8, ISO-8859-1, CP1252
- **Formato**: CSV, PDF, Excel (xlsx, xls)
- **Banco**: Baseado em padrões de coluna/conteúdo
- **Separador**: Vírgula, ponto-vírgula, tab

#### ✅ **Processamento Inteligente** 
- **Duplicatas**: Detecção automática por data+valor+descrição
- **Validação**: Tipos de campo, formatos de data
- **Filtros**: Por período de datas (opcional)
- **Normalização**: Valores monetários, datas, descrições

#### ✅ **Tratamento de Erros**
- **Linhas inválidas**: Log detalhado de erros
- **Formatos**: Suporte a múltiplos padrões de data
- **Encoding**: Fallback automático entre encodings
- **Campos faltantes**: Valores padrão quando possível

### 🔧 **Uso dos Parsers**

#### CSV Parser
```typescript
import { parseCSV } from './csvParser';

const result = await parseCSV(filePath, {
  dateRange: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31')
  }
});

console.log(`${result.transactions.length} transações processadas`);
```

#### PDF Parser  
```typescript
import { PDFParser } from './pdfParser';

const result = await PDFParser.parseFile(filePath);
console.log(`${result.transactions.length} transações encontradas`);
```

#### Excel Parser
```typescript
import { parseExcel } from './excelParser';

const result = await parseExcel(filePath);
console.log(`${result.transactions.length} transações importadas`);
```

### 📊 **Estrutura de Dados**

```typescript
interface ParsedTransaction {
  description: string;           // Descrição da transação
  amount: number;               // Valor (positivo=receita, negativo=despesa)  
  type: 'INCOME' | 'EXPENSE';   // Tipo calculado automaticamente
  date: Date;                   // Data da transação
  originalData?: any;           // Dados originais para debug
}

interface ParseResult {
  transactions: ParsedTransaction[];  // Transações válidas
  errors: string[];                  // Erros encontrados
  totalProcessed: number;            // Total de linhas processadas
}
```

### 🎯 **Integração com API**

Os parsers são utilizados pelo endpoint `/api/import/*`:

- `POST /api/import/upload` - Upload do arquivo
- `GET /api/import/sessions` - Listar sessões de importação  
- `POST /api/import/sessions/:id/process` - Processar arquivo
- `GET /api/import/sessions/:id/preview` - Preview das transações
- `POST /api/import/sessions/:id/confirm` - Confirmar importação

---

✅ **Sistema completo de importação multi-formato para extratos bancários brasileiros!**