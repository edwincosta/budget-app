# Funcionalidade de Compartilhamento

## Visão Geral

A funcionalidade de compartilhamento permite que os usuários compartilhem seus dados financeiros com outros usuários do sistema, permitindo colaboração na gestão financeira familiar ou empresarial.

## Como Funciona

### 1. Convite de Usuários

- Um usuário pode convidar outro usuário através do email
- O proprietário dos dados define quais permissões conceder
- O convite fica pendente até ser aceito ou rejeitado

### 2. Permissões Disponíveis

- **READ_ACCOUNTS**: Visualizar contas
- **WRITE_ACCOUNTS**: Criar, editar e excluir contas
- **READ_TRANSACTIONS**: Visualizar transações
- **WRITE_TRANSACTIONS**: Criar, editar e excluir transações
- **READ_BUDGETS**: Visualizar orçamentos
- **WRITE_BUDGETS**: Criar, editar e excluir orçamentos
- **READ_CATEGORIES**: Visualizar categorias
- **WRITE_CATEGORIES**: Criar, editar e excluir categorias

### 3. Status do Compartilhamento

- **PENDING**: Convite enviado, aguardando resposta
- **ACCEPTED**: Convite aceito, compartilhamento ativo
- **REJECTED**: Convite rejeitado
- **REVOKED**: Compartilhamento cancelado pelo proprietário

### 4. Acesso aos Dados Compartilhados

- Usuários com acesso podem visualizar/editar dados conforme suas permissões
- Para acessar dados compartilhados, usar o parâmetro `?sharedUser=ID_DO_PROPRIETARIO` nas URLs
- A interface mostra claramente quando se está acessando dados compartilhados

## Endpoints da API

### POST /api/sharing/invite
Enviar convite de compartilhamento
```json
{
  "email": "usuario@email.com",
  "permissions": ["READ_ACCOUNTS", "READ_TRANSACTIONS"]
}
```

### GET /api/sharing/invitations
Listar convites recebidos

### POST /api/sharing/respond/:shareId
Aceitar ou rejeitar convite
```json
{
  "action": "accept" // ou "reject"
}
```

### GET /api/sharing/active
Listar compartilhamentos ativos

### DELETE /api/sharing/:shareId
Revogar compartilhamento

## Interface do Usuário

### Página de Compartilhamento (/sharing)

- Lista de convites recebidos
- Lista de compartilhamentos que fiz
- Lista de compartilhamentos que tenho acesso
- Formulário para convidar novos usuários

### Navegação

- Link "Compartilhamento" no menu lateral
- Ícone de usuários no menu inferior (tablets)

## Segurança

- Apenas usuários autenticados podem acessar a funcionalidade
- Verificação de permissões em cada operação
- Compartilhamentos podem ser revogados a qualquer momento
- Dados compartilhados só são acessíveis com as permissões corretas

## Banco de Dados

### Tabela user_shares

- **id**: Identificador único
- **ownerId**: ID do usuário proprietário dos dados
- **sharedWithId**: ID do usuário com quem está compartilhando
- **permissions**: Array de permissões concedidas
- **status**: Status atual do compartilhamento
- **createdAt/updatedAt**: Timestamps de criação e atualização

## Exemplo de Uso

1. João quer compartilhar suas finanças com sua esposa Maria
2. João acessa `/sharing` e convida Maria pelo email
3. João seleciona permissões: READ_ACCOUNTS, WRITE_TRANSACTIONS
4. Maria recebe o convite e aceita
5. Maria pode agora acessar as contas de João (só visualizar) e criar/editar transações
6. Para acessar os dados de João, Maria usa URLs como `/dashboard?sharedUser=joao-id`

## Implementação Técnica

### Backend
- Novas rotas em `/server/src/routes/sharing.ts`
- Middleware de autenticação compartilhada em `/server/src/middleware/sharedAuth.ts`
- Utilitários para gestão de acesso em `/server/src/utils/sharing.ts`

### Frontend
- Componente `ShareManager` para interface de compartilhamento
- Página `Sharing` para navegação
- Serviços de API em `sharingService`
- Tipos TypeScript para compartilhamento

### Database
- Novos modelos no Prisma schema
- Migração para criação das tabelas
- Enums para permissões e status
