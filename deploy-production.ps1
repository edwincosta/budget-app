# 🚀 Script de Deploy para Produção com Supabase

# Verificar se as variáveis de ambiente estão configuradas
function Check-Environment {
    Write-Host "🔍 Verificando configuração..." -ForegroundColor Yellow
    
    if (-not $env:DATABASE_URL) {
        Write-Host "❌ DATABASE_URL não configurada!" -ForegroundColor Red
        Write-Host "Configure no arquivo .env com sua connection string do Supabase" -ForegroundColor Red
        exit 1
    }
    
    if (-not $env:JWT_SECRET -or $env:JWT_SECRET.Length -lt 32) {
        Write-Host "❌ JWT_SECRET deve ter pelo menos 32 caracteres!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Configuração válida!" -ForegroundColor Green
}

# Executar migrações do banco
function Deploy-Database {
    Write-Host "🗄️ Configurando banco de dados..." -ForegroundColor Yellow
    
    cd server
    
    Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
    npm ci --production=false
    
    Write-Host "🔨 Gerando cliente Prisma..." -ForegroundColor Cyan
    npm run db:generate
    
    Write-Host "🔄 Executando migrações..." -ForegroundColor Cyan
    npm run db:migrate:deploy
    
    Write-Host "🌱 Executando seeds..." -ForegroundColor Cyan
    npm run db:seed
    
    Write-Host "✅ Banco configurado!" -ForegroundColor Green
    cd ..
}

# Build do projeto
function Build-Project {
    Write-Host "🔨 Fazendo build do projeto..." -ForegroundColor Yellow
    
    # Build do servidor
    Write-Host "📦 Build do servidor..." -ForegroundColor Cyan
    cd server
    npm ci --production=false
    npm run build
    cd ..
    
    # Build do cliente
    Write-Host "🎨 Build do cliente..." -ForegroundColor Cyan
    cd client
    npm ci --production=false
    npm run build
    cd ..
    
    Write-Host "✅ Build concluído!" -ForegroundColor Green
}

# Deploy usando Docker Compose
function Deploy-Production {
    Write-Host "🚀 Iniciando deploy de produção..." -ForegroundColor Yellow
    
    # Carregar variáveis de ambiente
    if (Test-Path ".env") {
        Get-Content ".env" | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
            }
        }
    }
    
    # Parar containers existentes
    Write-Host "🛑 Parando containers existentes..." -ForegroundColor Cyan
    docker-compose -f docker-compose.supabase.yml down
    
    # Fazer build e subir novos containers
    Write-Host "🔄 Subindo containers de produção..." -ForegroundColor Cyan
    docker-compose -f docker-compose.supabase.yml up --build -d
    
    Write-Host "✅ Deploy concluído!" -ForegroundColor Green
    Write-Host "🌐 Aplicação disponível em: http://localhost:3000" -ForegroundColor Green
}

# Menu principal
function Show-Menu {
    Write-Host ""
    Write-Host "=== 🚀 BUDGET APP - DEPLOY DE PRODUÇÃO ===" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "1. 🔍 Verificar configuração"
    Write-Host "2. 🗄️ Configurar banco (Supabase)"
    Write-Host "3. 🔨 Build do projeto"
    Write-Host "4. 🚀 Deploy completo"
    Write-Host "5. 📊 Status dos containers"
    Write-Host "6. 📋 Logs da aplicação"
    Write-Host "7. 🛑 Parar aplicação"
    Write-Host "0. ❌ Sair"
    Write-Host ""
}

# Loop principal
do {
    Show-Menu
    $choice = Read-Host "Escolha uma opção"
    
    switch ($choice) {
        "1" { Check-Environment }
        "2" { Deploy-Database }
        "3" { Build-Project }
        "4" { 
            Check-Environment
            Deploy-Database
            Build-Project
            Deploy-Production
        }
        "5" { docker-compose -f docker-compose.supabase.yml ps }
        "6" { docker-compose -f docker-compose.supabase.yml logs -f }
        "7" { docker-compose -f docker-compose.supabase.yml down }
        "0" { 
            Write-Host "👋 Até mais!" -ForegroundColor Green
            break 
        }
        default { 
            Write-Host "❌ Opção inválida!" -ForegroundColor Red 
        }
    }
    
    if ($choice -ne "0") {
        Write-Host ""
        Read-Host "Pressione Enter para continuar..."
    }
    
} while ($choice -ne "0")