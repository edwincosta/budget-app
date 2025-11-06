# 🚀 Script de Deploy para Render.com (100% Gratuito)

# Cores para output
$Green = "Green"
$Yellow = "Yellow" 
$Red = "Red"
$Cyan = "Cyan"
$Magenta = "Magenta"

# Verificar se o projeto está pronto para Render
function Test-RenderReadiness {
    Write-Host "🔍 Verificando se projeto está pronto para Render..." -ForegroundColor $Yellow
    
    # Verificar estrutura do servidor
    if (-not (Test-Path "server/package.json")) {
        Write-Host "❌ server/package.json não encontrado!" -ForegroundColor $Red
        return $false
    }
    
    # Verificar scripts necessários
    $packageJson = Get-Content "server/package.json" | ConvertFrom-Json
    if (-not $packageJson.scripts.build) {
        Write-Host "❌ Script 'build' não encontrado em server/package.json!" -ForegroundColor $Red
        return $false
    }
    
    if (-not $packageJson.scripts.start) {
        Write-Host "❌ Script 'start' não encontrado em server/package.json!" -ForegroundColor $Red
        return $false
    }
    
    # Verificar Prisma
    if (-not (Test-Path "server/prisma/schema.prisma")) {
        Write-Host "❌ Schema do Prisma não encontrado!" -ForegroundColor $Red
        return $false
    }
    
    Write-Host "✅ Projeto pronto para Render!" -ForegroundColor $Green
    return $true
}

# Configurar banco de dados
function Initialize-Database {
    Write-Host "🗄️ Configurando banco de dados..." -ForegroundColor $Yellow
    
    $dbChoice = Read-Host "Usar Supabase (S) ou PostgreSQL do Render (R)? [S/R]"
    
    if ($dbChoice.ToUpper() -eq "S") {
        Write-Host "🌊 Usando Supabase..." -ForegroundColor $Cyan
        
        if (-not $env:DATABASE_URL -or -not $env:DATABASE_URL.Contains("supabase.co")) {
            Write-Host "❌ DATABASE_URL do Supabase não configurada!" -ForegroundColor $Red
            Write-Host "Configure no arquivo .env com sua connection string do Supabase" -ForegroundColor $Yellow
            return $false
        }
        
        # Testar conexão Supabase
        Set-Location server
        try {
            npm run test:connection
            Write-Host "✅ Conexão com Supabase OK!" -ForegroundColor $Green
        }
        catch {
            Write-Host "❌ Falha na conexão com Supabase!" -ForegroundColor $Red
            Set-Location ..
            return $false
        }
        Set-Location ..
        
    }
    else {
        Write-Host "🐘 Usando PostgreSQL do Render..." -ForegroundColor $Cyan
        Write-Host "ℹ️  Você configurará o banco no dashboard do Render" -ForegroundColor $Yellow
    }
    
    return $true
}

# Build do projeto para verificar se está tudo OK
function Build-Project {
    Write-Host "🔨 Testando build do projeto..." -ForegroundColor $Yellow
    
    Set-Location server
    
    try {
        Write-Host "📦 Instalando dependências..." -ForegroundColor $Cyan
        npm ci
        
        Write-Host "🔨 Fazendo build..." -ForegroundColor $Cyan
        npm run build
        
        Write-Host "✅ Build bem-sucedido!" -ForegroundColor $Green
        
    }
    catch {
        Write-Host "❌ Erro no build!" -ForegroundColor $Red
        Set-Location ..
        return $false
    }
    
    Set-Location ..
    return $true
}

# Deploy do frontend no Firebase
function Deploy-Frontend {
    Write-Host "🔥 Fazendo deploy do frontend..." -ForegroundColor $Yellow
    
    # Verificar Firebase CLI
    try {
        $firebaseVersion = firebase --version
        Write-Host "✅ Firebase CLI: $firebaseVersion" -ForegroundColor $Green
    }
    catch {
        Write-Host "❌ Firebase CLI não instalado!" -ForegroundColor $Red
        Write-Host "📦 Instale: npm install -g firebase-tools" -ForegroundColor $Yellow
        return $false
    }
    
    Set-Location client
    
    try {
        Write-Host "📦 Instalando dependências..." -ForegroundColor $Cyan
        npm ci
        
        Write-Host "🎨 Fazendo build..." -ForegroundColor $Cyan
        npm run build
        
        Set-Location ..
        
        Write-Host "🚀 Deploy para Firebase..." -ForegroundColor $Cyan
        firebase deploy --only hosting
        
        Write-Host "✅ Frontend deployado!" -ForegroundColor $Green
        
    }
    catch {
        Write-Host "❌ Erro no deploy do frontend!" -ForegroundColor $Red
        Set-Location ..
        return $false
    }
    
    return $true
}

# Instruções para Render
function Show-RenderInstructions {
    Write-Host ""
    Write-Host "🌐 CONFIGURAÇÃO DO RENDER.COM:" -ForegroundColor $Magenta
    Write-Host ""
    Write-Host "1. 🌐 Acesse: https://render.com" -ForegroundColor $Cyan
    Write-Host "2. 🔐 Clique em 'Get Started for Free'" -ForegroundColor $Cyan
    Write-Host "3. 👨‍💻 Use 'Sign up with GitHub'" -ForegroundColor $Cyan
    Write-Host "4. 📦 Dashboard → 'New +' → 'Web Service'" -ForegroundColor $Cyan
    Write-Host "5. 🔗 'Connect a repository' → Selecione este repo" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "⚙️ CONFIGURAÇÕES DO SERVIÇO:" -ForegroundColor $Yellow
    Write-Host "   - Name: budget-backend" -ForegroundColor $Cyan
    Write-Host "   - Region: Ohio (US East)" -ForegroundColor $Cyan
    Write-Host "   - Branch: main ou client" -ForegroundColor $Cyan
    Write-Host "   - Root Directory: server" -ForegroundColor $Cyan
    Write-Host "   - Runtime: Node" -ForegroundColor $Cyan
    Write-Host "   - Build Command: npm install && npm run build" -ForegroundColor $Cyan
    Write-Host "   - Start Command: npm start" -ForegroundColor $Cyan
    Write-Host "   - Plan: Free" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "🔧 VARIÁVEIS DE AMBIENTE:" -ForegroundColor $Yellow
    
    if ($env:DATABASE_URL -and $env:DATABASE_URL.Contains("supabase.co")) {
        Write-Host "   DATABASE_URL=$env:DATABASE_URL" -ForegroundColor $Cyan
    }
    else {
        Write-Host "   DATABASE_URL=[será preenchida pelo Render se usar PostgreSQL deles]" -ForegroundColor $Cyan
    }
    
    Write-Host "   JWT_SECRET=[gere uma chave forte de 32+ caracteres]" -ForegroundColor $Cyan
    Write-Host "   NODE_ENV=production" -ForegroundColor $Cyan
    Write-Host "   PORT=10000" -ForegroundColor $Cyan
    Write-Host ""
}

# Atualizar configuração do frontend
function Update-FrontendConfig {
    $backendUrl = Read-Host "🌐 Digite a URL do backend Render (ex: https://budget-backend.onrender.com)"
    
    if ($backendUrl) {
        Write-Host "🔧 Atualizando configuração do frontend..." -ForegroundColor $Yellow
        
        # Criar/atualizar .env.production no cliente
        $envContent = "VITE_API_URL=$backendUrl"
        $envContent | Out-File -FilePath "client\.env.production" -Encoding UTF8
        
        Write-Host "✅ Configuração atualizada!" -ForegroundColor $Green
        Write-Host "🔄 Re-deploy do frontend necessário..." -ForegroundColor $Yellow
        
        if ((Read-Host "Fazer re-deploy agora? (y/n)") -eq "y") {
            Deploy-Frontend
        }
    }
}

# Teste final da aplicação
function Test-Application {
    Write-Host "🧪 Testando aplicação completa..." -ForegroundColor $Yellow
    
    $frontendUrl = Read-Host "🌐 Digite a URL do frontend (Firebase)"
    $backendUrl = Read-Host "🌐 Digite a URL do backend (Render)"
    
    if ($frontendUrl -and $backendUrl) {
        Write-Host ""
        Write-Host "🔗 URLs da aplicação:" -ForegroundColor $Green
        Write-Host "   Frontend: $frontendUrl" -ForegroundColor $Cyan
        Write-Host "   Backend:  $backendUrl" -ForegroundColor $Cyan
        Write-Host "   Health:   $backendUrl/health" -ForegroundColor $Cyan
        Write-Host ""
        
        # Tentar acessar health check
        try {
            $healthUrl = "$backendUrl/health"
            $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 30
            Write-Host "✅ Backend respondendo:" -ForegroundColor $Green
            Write-Host "   Status: $($response.status)" -ForegroundColor $Cyan
            Write-Host "   Message: $($response.message)" -ForegroundColor $Cyan
        }
        catch {
            Write-Host "❌ Backend não está respondendo" -ForegroundColor $Red
            Write-Host "💤 Pode estar hibernando - tente novamente em 1 minuto" -ForegroundColor $Yellow
        }
        
        Write-Host ""
        Write-Host "👥 USUÁRIOS DE TESTE:" -ForegroundColor $Yellow
        Write-Host "   joao@example.com / 123456" -ForegroundColor $Cyan
        Write-Host "   maria@example.com / 123456" -ForegroundColor $Cyan
        Write-Host "   pedro@example.com / 123456" -ForegroundColor $Cyan
    }
}

# Menu principal
function Show-MainMenu {
    Write-Host ""
    Write-Host "=== 🌐 BUDGET APP - RENDER DEPLOY (100% GRATUITO) ===" -ForegroundColor $Magenta
    Write-Host ""
    Write-Host "1. 🔍 Verificar projeto"
    Write-Host "2. 🗄️ Configurar banco"
    Write-Host "3. 🔨 Testar build"
    Write-Host "4. 🔥 Deploy frontend (Firebase)"
    Write-Host "5. 🌐 Instruções Render"
    Write-Host "6. 🔧 Atualizar config frontend"
    Write-Host "7. 🧪 Testar aplicação"
    Write-Host "8. 🎯 DEPLOY COMPLETO"
    Write-Host "0. ❌ Sair"
    Write-Host ""
}

# Deploy completo
function Start-FullDeploy {
    Write-Host "🎯 INICIANDO DEPLOY COMPLETO (100% GRATUITO)..." -ForegroundColor $Magenta
    Write-Host ""
    
    # Verificar projeto
    if (-not (Test-RenderReadiness)) {
        Write-Host "❌ Configure o projeto primeiro!" -ForegroundColor $Red
        return
    }
    
    # Configurar banco
    if (-not (Initialize-Database)) {
        Write-Host "❌ Falha na configuração do banco!" -ForegroundColor $Red
        return
    }
    
    # Testar build
    if (-not (Build-Project)) {
        Write-Host "❌ Falha no build!" -ForegroundColor $Red
        return
    }
    
    # Deploy frontend
    if (-not (Deploy-Frontend)) {
        Write-Host "❌ Falha no deploy do frontend!" -ForegroundColor $Red
        return
    }
    
    # Instruções Render
    Show-RenderInstructions
    Read-Host "Pressione Enter após configurar o backend no Render..."
    
    # Atualizar config e re-deploy
    Update-FrontendConfig
    
    # Teste final
    Test-Application
    
    Write-Host ""
    Write-Host "🎉 DEPLOY COMPLETO FINALIZADO!" -ForegroundColor $Green
    Write-Host "💰 Custo total: $0/mês (100% gratuito!)" -ForegroundColor $Green
    Write-Host "💤 Nota: Backend hiberna após 15min - acordar leva ~30s" -ForegroundColor $Yellow
}

# Carregar variáveis de ambiente
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

# Loop principal
do {
    Show-MainMenu
    $choice = Read-Host "Escolha uma opção"
    
    switch ($choice) {
        "1" { Test-RenderReadiness }
        "2" { Initialize-Database }
        "3" { Build-Project }
        "4" { Deploy-Frontend }
        "5" { Show-RenderInstructions }
        "6" { Update-FrontendConfig }
        "7" { Test-Application }
        "8" { Start-FullDeploy }
        "0" { 
            Write-Host "👋 Deploy finalizado!" -ForegroundColor $Green
            break 
        }
        default { 
            Write-Host "❌ Opção inválida!" -ForegroundColor $Red 
        }
    }
    
    if ($choice -ne "0" -and $choice -ne "8") {
        Write-Host ""
        Read-Host "Pressione Enter para continuar..."
    }
    
} while ($choice -ne "0")