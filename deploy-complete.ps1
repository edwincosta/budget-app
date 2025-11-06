# 🚀 DEPLOY COMPLETO - Budget App

# Cores para output
$Green = "Green"
$Yellow = "Yellow" 
$Red = "Red"
$Cyan = "Cyan"
$Magenta = "Magenta"

# Função para verificar status de cada serviço
function Test-Services {
    Write-Host "🔍 Verificando status dos serviços..." -ForegroundColor $Yellow
    Write-Host ""
    
    # Verificar Supabase
    Write-Host "🗄️ SUPABASE (Database)" -ForegroundColor $Cyan
    if ($env:DATABASE_URL -and $env:DATABASE_URL.Contains("supabase.co")) {
        Write-Host "   ✅ URL configurada" -ForegroundColor $Green
    }
    else {
        Write-Host "   ❌ URL não configurada ou inválida" -ForegroundColor $Red
        return $false
    }
    
    # Verificar Firebase CLI
    Write-Host "🔥 FIREBASE (Frontend)" -ForegroundColor $Cyan
    try {
        $firebaseVersion = firebase --version
        Write-Host "   ✅ CLI instalado: $firebaseVersion" -ForegroundColor $Green
    }
    catch {
        Write-Host "   ❌ CLI não instalado" -ForegroundColor $Red
        Write-Host "   📦 Instale: npm install -g firebase-tools" -ForegroundColor $Yellow
        return $false
    }
    
    # Verificar Railway CLI (opcional)
    Write-Host "🚂 RAILWAY (Backend)" -ForegroundColor $Cyan
    try {
        railway version | Out-Null
        Write-Host "   ✅ CLI instalado" -ForegroundColor $Green
    }
    catch {
        Write-Host "   ⚠️  CLI não instalado (opcional)" -ForegroundColor $Yellow
        Write-Host "   📦 Instale: npm install -g @railway/cli" -ForegroundColor $Yellow
    }
    
    Write-Host ""
    return $true
}

# Configurar banco de dados
function Initialize-Database {
    Write-Host "🗄️ Configurando banco de dados Supabase..." -ForegroundColor $Yellow
    
    Set-Location server
    
    try {
        Write-Host "📦 Instalando dependências..." -ForegroundColor $Cyan
        npm ci
        
        Write-Host "🔨 Gerando cliente Prisma..." -ForegroundColor $Cyan
        npm run db:generate
        
        Write-Host "🔄 Executando migrações..." -ForegroundColor $Cyan
        npm run db:migrate:deploy
        
        Write-Host "🌱 Executando seeds..." -ForegroundColor $Cyan
        npm run db:seed
        
        Write-Host "🧪 Testando conexão..." -ForegroundColor $Cyan
        npm run test:connection
        
        Write-Host "✅ Banco configurado com sucesso!" -ForegroundColor $Green
        
    }
    catch {
        Write-Host "❌ Erro ao configurar banco!" -ForegroundColor $Red
        Write-Host "🔧 Verifique a DATABASE_URL no arquivo .env" -ForegroundColor $Yellow
        Set-Location ..
        return $false
    }
    
    Set-Location ..
    return $true
}

# Deploy do frontend no Firebase
function Deploy-Frontend {
    Write-Host "🔥 Fazendo deploy do frontend..." -ForegroundColor $Yellow
    
    Set-Location client
    
    try {
        Write-Host "📦 Instalando dependências..." -ForegroundColor $Cyan
        npm ci
        
        Write-Host "🎨 Fazendo build..." -ForegroundColor $Cyan
        npm run build
        
        Set-Location ..
        
        Write-Host "🚀 Deploy para Firebase..." -ForegroundColor $Cyan
        firebase deploy --only hosting
        
        Write-Host "✅ Frontend deployado com sucesso!" -ForegroundColor $Green
        
    }
    catch {
        Write-Host "❌ Erro no deploy do frontend!" -ForegroundColor $Red
        Set-Location ..
        return $false
    }
    
    return $true
}

# Deploy do backend (instruções)
function Show-BackendInstructions {
    Write-Host "🚂 CONFIGURAÇÃO DO BACKEND (Railway):" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "1. 🌐 Acesse: https://railway.app" -ForegroundColor $Cyan
    Write-Host "2. 🔐 Faça login com GitHub" -ForegroundColor $Cyan
    Write-Host "3. 📦 Crie novo projeto → Deploy from GitHub" -ForegroundColor $Cyan
    Write-Host "4. 📂 Selecione este repositório" -ForegroundColor $Cyan
    Write-Host "5. ⚙️ Configure nas Settings:" -ForegroundColor $Cyan
    Write-Host "   - Root Directory: server" -ForegroundColor $Cyan
    Write-Host "   - Build Command: npm run build" -ForegroundColor $Cyan
    Write-Host "   - Start Command: npm start" -ForegroundColor $Cyan
    Write-Host "6. 🔧 Adicione variáveis de ambiente:" -ForegroundColor $Cyan
    Write-Host "   - DATABASE_URL=$env:DATABASE_URL" -ForegroundColor $Cyan
    Write-Host "   - JWT_SECRET=[gere uma chave forte]" -ForegroundColor $Cyan
    Write-Host "   - NODE_ENV=production" -ForegroundColor $Cyan
    Write-Host "7. 🚀 Deploy automático será feito!" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "📋 Após deploy, anote a URL do backend!" -ForegroundColor $Yellow
}

# Atualizar configuração do frontend
function Update-FrontendConfig {
    $backendUrl = Read-Host "🌐 Digite a URL do backend (ex: https://app.railway.app)"
    
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
    $backendUrl = Read-Host "🌐 Digite a URL do backend (Railway)"
    
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
            $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
            Write-Host "✅ Backend respondendo:" -ForegroundColor $Green
            Write-Host "   Status: $($response.status)" -ForegroundColor $Cyan
            Write-Host "   Message: $($response.message)" -ForegroundColor $Cyan
        }
        catch {
            Write-Host "❌ Backend não está respondendo" -ForegroundColor $Red
            Write-Host "🔧 Verifique os logs no Railway" -ForegroundColor $Yellow
        }
    }
}

# Menu principal
function Show-MainMenu {
    Write-Host ""
    Write-Host "=== 🚀 BUDGET APP - DEPLOY COMPLETO ===" -ForegroundColor $Magenta
    Write-Host ""
    Write-Host "1. 🔍 Verificar serviços"
    Write-Host "2. 🗄️ Configurar banco (Supabase)"
    Write-Host "3. 🔥 Deploy frontend (Firebase)"
    Write-Host "4. 🚂 Instruções backend (Railway)"
    Write-Host "5. 🔧 Atualizar config frontend"
    Write-Host "6. 🧪 Testar aplicação"
    Write-Host "7. 🎯 DEPLOY COMPLETO"
    Write-Host "0. ❌ Sair"
    Write-Host ""
}

# Deploy completo
function Start-FullDeploy {
    Write-Host "🎯 INICIANDO DEPLOY COMPLETO..." -ForegroundColor $Magenta
    Write-Host ""
    
    # Verificar serviços
    if (-not (Test-Services)) {
        Write-Host "❌ Configure os serviços necessários primeiro!" -ForegroundColor $Red
        return
    }
    
    # Configurar banco
    if (-not (Initialize-Database)) {
        Write-Host "❌ Falha na configuração do banco!" -ForegroundColor $Red
        return
    }
    
    # Deploy frontend
    if (-not (Deploy-Frontend)) {
        Write-Host "❌ Falha no deploy do frontend!" -ForegroundColor $Red
        return
    }
    
    # Instruções backend
    Show-BackendInstructions
    Read-Host "Pressione Enter após configurar o backend no Railway..."
    
    # Atualizar config e re-deploy
    Update-FrontendConfig
    
    # Teste final
    Test-Application
    
    Write-Host ""
    Write-Host "🎉 DEPLOY COMPLETO FINALIZADO!" -ForegroundColor $Green
    Write-Host "🌐 Sua aplicação está rodando em produção!" -ForegroundColor $Green
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
        "1" { Test-Services }
        "2" { Initialize-Database }
        "3" { Deploy-Frontend }
        "4" { Show-BackendInstructions }
        "5" { Update-FrontendConfig }
        "6" { Test-Application }
        "7" { Start-FullDeploy }
        "0" { 
            Write-Host "👋 Deploy finalizado!" -ForegroundColor $Green
            break 
        }
        default { 
            Write-Host "❌ Opção inválida!" -ForegroundColor $Red 
        }
    }
    
    if ($choice -ne "0" -and $choice -ne "7") {
        Write-Host ""
        Read-Host "Pressione Enter para continuar..."
    }
    
} while ($choice -ne "0")