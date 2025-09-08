# Sistema de Relatórios - Budget App

## Visão Geral
O sistema de relatórios oferece análises financeiras completas e avançadas, incluindo visualizações interativas, análises preditivas, comparações de performance e insights detalhados sobre orçamentos e transações.

## Estrutura Principal

### Página de Relatórios (`Reports.tsx`)
- **Localização**: `client/src/pages/Reports.tsx` (717 linhas)
- **Função**: Interface principal com navegação por abas e visualizações
- **Dependências**: Recharts, Lucide React, API services

#### Modos de Visualização
1. **Por Período**: Análise de 3, 6, 12 meses ou ano completo
2. **Por Mês**: Análise detalhada de um mês específico com breakdown diário

#### Abas Disponíveis
- **Visão Geral**: Overview financeiro com gráficos principais
- **Tendências**: Análise temporal de receitas, despesas e saldo
- **Categorias**: Distribuição por categorias com gráficos de pizza
- **Detalhes Diários**: Breakdown diário (disponível apenas no modo mensal)
- **Orçamento**: Análise de metas vs realizado
- **Comparação**: Comparação entre períodos
- **Previsões**: Análises preditivas e tendências futuras
- **Detalhado**: Relatório completo e exportação

## Componentes Especializados

### 1. BudgetAnalysis (`BudgetAnalysis.tsx`)
- **Propósito**: Análise detalhada de orçamentos vs gastos reais
- **Funcionalidades**:
  - Comparação orçamento planejado vs realizado
  - Status visual (bom/alerta/excedido) por categoria
  - Barras de progresso com percentuais utilizados
  - Cards de resumo com totais e médias
  - Alertas e recomendações automáticas
- **API**: `/api/budgets/analysis`
- **Estados**: Loading, dados de orçamento, totais calculados

### 2. FinancialForecast (`FinancialForecast.tsx`)
- **Propósito**: Previsões financeiras baseadas em dados históricos
- **Funcionalidades**:
  - Predições para próximos meses (otimista/realista/pessimista)
  - Gráficos de área com tendências históricas vs previstas
  - Métricas de crescimento e confiança
  - Recomendações baseadas em tendências
  - Suporte para análise por orçamento específico
- **API**: `/api/reports/forecast` e `/api/reports/forecast/:budgetId`
- **Tipos**: Balance, Income, Expenses

### 3. PerformanceComparison (`PerformanceComparison.tsx`)
- **Propósito**: Comparação de performance entre períodos
- **Funcionalidades**:
  - Gráficos compostos (barras + linhas) para comparação
  - Análise período atual vs período anterior
  - Métricas de crescimento e variação percentual
  - Indicadores visuais de melhoria/piora
  - Suporte para orçamentos compartilhados
- **API**: `/api/reports/comparison` e `/api/reports/comparison/:budgetId`

### 4. MonthlyDetail (`MonthlyDetail.tsx`)
- **Propósito**: Análise detalhada diária de um mês específico
- **Funcionalidades**:
  - Gráfico de barras com transações diárias
  - Insights automáticos (melhor/pior dia, médias)
  - Contagem de transações por dia
  - Análise de padrões de comportamento
  - Heat map visual de atividade financeira
- **API**: `/api/reports/monthly-detail` e `/api/reports/monthly-detail/:budgetId`

## API Endpoints

### Rotas Principais (`server/src/routes/reports.ts`)
1. **GET /api/reports** - ✅ **IMPLEMENTADO** - Dados gerais de relatórios
   - **Parâmetros**: 
     - `mode`: 'period' | 'monthly' (padrão: 'period')
     - `period`: '3months' | '6months' | '12months' | 'year' (padrão: '6months')  
     - `month`: 'YYYY-MM' (obrigatório se mode='monthly')
   - **Retorna**: ReportsData completa com monthlyData, categoryData, summary
   - **Funcionalidade**: Dados principais para visão geral, tendências e categorias

2. **GET /api/reports/comparison/:budgetId?** - ✅ **IMPLEMENTADO** - Comparação entre períodos
   - **Suporte**: Orçamentos compartilhados com validação de permissões
   - **Middleware**: budgetAuth para validação automática
   - **Funcionalidade**: Dados para aba "Comparação" do frontend

3. **GET /api/reports/forecast/:budgetId?** - ✅ **IMPLEMENTADO** - Previsões financeiras
   - **Algoritmos**: Predição baseada em dados históricos dos últimos 6 meses
   - **Níveis**: Otimista, realista, pessimista com métricas de confiança
   - **Funcionalidade**: Dados para aba "Previsões" do frontend

4. **GET /api/reports/monthly-detail/:budgetId?** - ✅ **IMPLEMENTADO** - Detalhes mensais
   - **Parâmetros**: `month` (YYYY-MM, padrão: mês atual)
   - **Breakdown**: Dados diários completos com insights automáticos
   - **Funcionalidade**: Dados para aba "Detalhes Diários" (modo mensal apenas)

5. **GET /api/reports/export** - ✅ **IMPLEMENTADO** - Exportação de relatórios
   - **Parâmetros**: `period`, `format` ('pdf' | 'excel')
   - **Status**: Placeholder implementado (funcionalidade completa em desenvolvimento)
   - **Funcionalidade**: Botões de exportação PDF/Excel no frontend

### Middleware de Segurança
- **auth**: Autenticação JWT obrigatória
- **budgetAuth**: Validação de permissões para orçamentos compartilhados
- Suporte automático para budgetId via parâmetro ou defaultBudgetId

## Funcionalidades de Interface

### Cards de Resumo
- **Receitas Totais**: Soma de todas as receitas do período
- **Despesas Totais**: Soma de todas as despesas do período  
- **Saldo Líquido**: Diferença entre receitas e despesas
- **Receita Média/Mês**: Média mensal de receitas
- **Despesa Média/Mês**: Média mensal de despesas

### Visualizações Interativas
- **Gráficos Responsivos**: Recharts com responsividade completa
- **Tooltips Informativos**: Detalhes ao passar mouse
- **Legendas Dinâmicas**: Controle de visibilidade de séries
- **Cores Consistentes**: Paleta padronizada para melhor UX

### Exportação de Dados
- **PDF**: Relatório formatado para impressão
- **Excel**: Planilha com dados brutos para análise
- **Filtros**: Dados filtrados pelo período selecionado

## Estados e Tratamento de Dados

### Estados de Loading
- Loading state global na página principal
- Loading específico por componente
- Skeleton screens para melhor experiência

### Tratamento de Erros
- Try/catch em todas as chamadas API
- Reset para dados vazios em caso de erro
- Mensagens informativas para usuário

### Dados Vazios
- Tela específica quando não há transações
- Botões de ação (adicionar transações, mudar período)
- Orientações claras para o usuário

## Responsividade e UX

### Layout Adaptivo
- Grid responsivo para diferentes tamanhos de tela
- Navegação por abas otimizada para mobile/tablet
- **Evita scroll horizontal** - Layout adaptativo previne scroll lateral
- Breakdowns automáticos para telas menores
- Navegação em stack vertical quando necessário

### Classes Tailwind Específicas
- `tablet:*` - Breakpoints específicos para tablets
- `flex-wrap` - Permite quebra de linha em navegação
- `overflow-hidden` - Previne scroll horizontal indesejado
- Grid adaptativos: `grid-cols-1 lg:grid-cols-2`

### Cores e Temas
- Verde: Receitas e valores positivos
- Vermelho: Despesas e valores negativos
- Azul: Elementos neutros e ações principais
- Cinza: Textos secundários e backgrounds

### Boas Práticas de UX
- **Sem scroll horizontal**: Layout sempre se adapta à largura da tela
- **Navegação acessível**: Abas empilham verticalmente em telas pequenas
- **Conteúdo responsivo**: Gráficos e tabelas se ajustam automaticamente
- **Toque amigável**: Elementos com área mínima de 44px para touch
- **Performance visual**: Animações suaves e loading states apropriados

## Integrações Externas

### Recharts Components
- `BarChart`, `LineChart`, `PieChart`, `AreaChart`
- `ResponsiveContainer` para responsividade
- `Tooltip`, `Legend`, `CartesianGrid` para UX

### Lucide React Icons
- Icons específicos para cada tipo de métrica
- Consistência visual em toda aplicação
- Indicadores de status (up/down trends)

## Segurança e Permissões

### Autenticação
- JWT token obrigatório em todas as rotas
- Middleware de auth aplicado globalmente

### Orçamentos Compartilhados
- Validação de permissões READ/WRITE
- Middleware budgetAuth para rotas com :budgetId
- Fallback para defaultBudgetId do usuário

### Dados Sensíveis
- Formatação segura de valores monetários
- Sanitização de dados de entrada
- Validação de períodos e datas

## Performance e Otimização

### Lazy Loading
- Componentes carregados sob demanda
- Estados de loading específicos

### Cache de Dados
- useEffect com dependencies apropriadas
- Re-fetch apenas quando necessário

### Formato de Dados
- Uso de Decimal.js no backend para precisão
- Conversão para number apenas no JSON final
- Evita problemas de arredondamento

## Manutenibilidade

### Separação de Responsabilidades
- Componentes específicos para cada tipo de análise
- Services separados para chamadas API
- Types TypeScript bem definidos

### Documentação de Código
- Interfaces TypeScript completas
- Comentários em lógicas complexas
- Nomes de variáveis descritivos

### Testes e Validação
- Tratamento robusto de erros
- Validações de entrada
- Fallbacks para cenários edge
