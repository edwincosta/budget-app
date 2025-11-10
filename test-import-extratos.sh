#!/bin/bash

# SCRIPT OFICIAL DE TESTE DE IMPORTAÇÃO DE EXTRATOS
# 
# ⚠️  ATENÇÃO: Este é o script OFICIAL para testar importações.
#     Conforme instruções do GitHub Copilot, sempre use este script.
#
# 🚀 EXECUÇÃO: ./test-import-extratos.sh (da raiz do projeto)
#
# Características:
# - ✅ Verifica e inicia containers Docker automaticamente
# - ✅ Configura dados de desenvolvimento (seed)
# - ✅ Executa teste completo de 19 arquivos
# - ✅ Relatório detalhado com estatísticas
# - ✅ Zero dependências externas

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE} TESTE DE IMPORTAÇÃO DE EXTRATOS     ${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verifica se está no diretório correto
if [ ! -f "package.json" ] || [ ! -d "examples/extratos" ]; then
    log_error "Execute este script a partir da raiz do projeto budget-app"
    exit 1
fi

# Verifica se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    log_error "Docker não está rodando. Por favor, inicie o Docker."
    exit 1
fi

log_info "Verificando containers..."

# Verifica se os containers estão rodando
if ! docker-compose ps | grep -q "budget_server.*Up"; then
    log_warning "Container do servidor não está rodando. Iniciando containers..."
    
    # Para containers existentes (se houver)
    docker-compose down > /dev/null 2>&1 || true
    
    # Inicia os containers
    log_info "Iniciando containers com docker-compose..."
    docker-compose up -d
    
    log_info "Aguardando containers iniciarem..."
    sleep 10
    
    # Aguarda o servidor estar pronto
    for i in {1..30}; do
        if curl -f http://localhost:3001/health > /dev/null 2>&1; then
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
    
    if ! curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_error "Servidor não respondeu após 60 segundos"
        log_info "Logs do servidor:"
        docker-compose logs server
        exit 1
    fi
    
    log_success "Containers iniciados e servidor respondendo"
else
    log_success "Containers já estão rodando"
fi

# Verifica se a API está respondendo
log_info "Verificando conectividade com a API..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    log_success "API está respondendo"
else
    log_error "API não está respondendo em http://localhost:3001"
    log_info "Verificando logs do servidor:"
    docker-compose logs --tail=20 server
    exit 1
fi

# Verifica se Node.js é compatível (precisa 18+ para fetch nativo)
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js 18+ é necessário para executar este teste (versão atual: $(node --version))"
    log_info "O teste usa fetch() e FormData nativos do Node.js 18+"
    exit 1
fi

log_success "Node.js $(node --version) é compatível"

# Executa seed do banco de dados para garantir dados de desenvolvimento
log_info "Garantindo dados de desenvolvimento no banco..."
if docker-compose exec -T server npm run seed > /dev/null 2>&1; then
    log_success "Dados de desenvolvimento verificados/criados"
else
    log_warning "Seed já executado anteriormente (dados existem)"
fi

# Executa o teste
log_info "Executando teste de importação..."
echo ""

node test-import-extratos.js

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    log_success "Teste executado com sucesso!"
else
    log_error "Teste falhou com código de saída: $TEST_EXIT_CODE"
fi

# Opções pós-teste
echo ""
log_info "Opções disponíveis:"
echo "  • Para ver logs do servidor: docker-compose logs server"
echo "  • Para parar containers: docker-compose down"
echo "  • Para executar teste novamente: ./test-import-extratos.sh"

exit $TEST_EXIT_CODE