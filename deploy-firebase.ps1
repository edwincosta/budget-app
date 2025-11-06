# 🔥 Script de Deploy para Firebase Hosting

# Verificar se o Firebase CLI está instalado
function Test-FirebaseCLI {
    try {
        $firebaseVersion = firebase --version
        Write-Host "✅ Firebase CLI instalado: $firebaseVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Firebase CLI não encontrado!" -ForegroundColor Red
        Write-Host "📦 Instale com: npm install -g firebase-tools" -ForegroundColor Yellow
        return $false
    }
}

# Fazer login no Firebase
function Connect-Firebase {
    Write-Host "🔐 Fazendo login no Firebase..." -ForegroundColor Yellow
    firebase login
}

# Inicializar projeto Firebase
function Initialize-Firebase {
    Write-Host "🚀 Inicializando projeto Firebase..." -ForegroundColor Yellow
    firebase init hosting
    Write-Host "✅ Projeto inicializado!" -ForegroundColor Green
}

# Build do projeto cliente
function Build-Client {
    Write-Host "🔨 Fazendo build do cliente..." -ForegroundColor Yellow
    
    Set-Location client
    
    Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
    npm ci
    
    Write-Host "🎨 Gerando build otimizado..." -ForegroundColor Cyan
    npm run build
    
    Set-Location ..
    
    Write-Host "✅ Build do cliente concluído!" -ForegroundColor Green
}

# Deploy para Firebase
function Deploy-Firebase {
    Write-Host "🚀 Fazendo deploy para Firebase..." -ForegroundColor Yellow
    
    firebase deploy --only hosting
    
    Write-Host "✅ Deploy concluído!" -ForegroundColor Green
    Write-Host "🌐 Acesse sua aplicação no link fornecido acima" -ForegroundColor Green
}

# Preview local
function Preview-Local {
    Write-Host "👀 Iniciando preview local..." -ForegroundColor Yellow
    firebase serve --only hosting
}

# Status do projeto
function Get-ProjectStatus {
    Write-Host "📊 Status do projeto Firebase:" -ForegroundColor Yellow
    firebase projects:list
}

# Menu principal
function Show-Menu {
    Write-Host ""
    Write-Host "=== 🔥 BUDGET APP - FIREBASE DEPLOY ===" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "1. 🔍 Verificar Firebase CLI"
    Write-Host "2. 🔐 Login no Firebase"
    Write-Host "3. 🚀 Inicializar projeto"
    Write-Host "4. 🔨 Build do cliente"
    Write-Host "5. 🚀 Deploy para Firebase"
    Write-Host "6. 👀 Preview local"
    Write-Host "7. 📊 Status do projeto"
    Write-Host "8. 🎯 Deploy completo (build + deploy)"
    Write-Host "0. ❌ Sair"
    Write-Host ""
}

# Loop principal
do {
    Show-Menu
    $choice = Read-Host "Escolha uma opção"
    
    switch ($choice) {
        "1" { Test-FirebaseCLI }
        "2" { Connect-Firebase }
        "3" { Initialize-Firebase }
        "4" { Build-Client }
        "5" { Deploy-Firebase }
        "6" { Preview-Local }
        "7" { Get-ProjectStatus }
        "8" { 
            if (Test-FirebaseCLI) {
                Build-Client
                Deploy-Firebase
            }
        }
        "0" { 
            Write-Host "👋 Até mais!" -ForegroundColor Green
            break 
        }
        default { 
            Write-Host "❌ Opção inválida!" -ForegroundColor Red 
        }
    }
    
    if ($choice -ne "0" -and $choice -ne "6") {
        Write-Host ""
        Read-Host "Pressione Enter para continuar..."
    }
    
} while ($choice -ne "0")