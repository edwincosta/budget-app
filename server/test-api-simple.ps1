# Budget API Test Suite - Simplified PowerShell Version
Write-Host "🧪 BUDGET API TEST SUITE" -ForegroundColor Blue
Write-Host "========================" -ForegroundColor Blue
Write-Host ""

# Configurações
$baseUrl = "http://localhost:3001/api"
$userEmail = "joao@example.com"
$userPassword = "123456"

# Função para testar endpoints
function Test-Endpoint {
    param([string]$method, [string]$url, [hashtable]$headers = @{}, [string]$body = $null, [string]$testName)
    
    try {
        Write-Host "Testing $testName... " -NoNewline
        
        $params = @{
            Uri = $url
            Method = $method
            Headers = $headers
            ContentType = "application/json"
        }
        
        if ($body) {
            $params.Body = $body
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "✅ PASS" -ForegroundColor Green
        return @{ Success = $true; Data = $response }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ FAIL (Status: $statusCode)" -ForegroundColor Red
        return @{ Success = $false; StatusCode = $statusCode }
    }
}

Write-Host "🔐 AUTHENTICATION TESTS" -ForegroundColor Cyan
Write-Host "========================"

# 1. Test Login
$loginBody = @{
    email = $userEmail
    password = $userPassword
} | ConvertTo-Json

$loginResult = Test-Endpoint -method "POST" -url "$baseUrl/auth/login" -body $loginBody -testName "Login João"

if ($loginResult.Success) {
    $token = $loginResult.Data.token
    $headers = @{ Authorization = "Bearer $token" }
} else {
    Write-Host "Cannot continue without authentication token" -ForegroundColor Red
    exit 1
}

# 2. Test Get User Info
Test-Endpoint -method "GET" -url "$baseUrl/auth/me" -headers $headers -testName "Get user info"

Write-Host ""
Write-Host "📊 BUDGET TESTS" -ForegroundColor Cyan
Write-Host "================"

# 3. Test Get Budgets
$budgetsResult = Test-Endpoint -method "GET" -url "$baseUrl/budgets" -headers $headers -testName "Get budgets"

if ($budgetsResult.Success -and $budgetsResult.Data.Count -gt 0) {
    $budgetId = $budgetsResult.Data[0].id
    
    # 4. Test Get Specific Budget
    Test-Endpoint -method "GET" -url "$baseUrl/budgets/$budgetId" -headers $headers -testName "Get specific budget"
    
    # 5. Test Budget Stats
    Test-Endpoint -method "GET" -url "$baseUrl/budgets/$budgetId/stats" -headers $headers -testName "Budget statistics"
}

Write-Host ""
Write-Host "💳 ACCOUNT TESTS" -ForegroundColor Cyan
Write-Host "================"

# 6. Test Get Accounts
$accountsResult = Test-Endpoint -method "GET" -url "$baseUrl/accounts" -headers $headers -testName "Get accounts"

if ($accountsResult.Success -and $accountsResult.Data.Count -gt 0) {
    $accountId = $accountsResult.Data[0].id
    
    # 7. Test Get Specific Account
    Test-Endpoint -method "GET" -url "$baseUrl/accounts/$accountId" -headers $headers -testName "Get specific account"
    
    # 8. Test Account Transactions
    Test-Endpoint -method "GET" -url "$baseUrl/accounts/$accountId/transactions" -headers $headers -testName "Account transactions"
}

Write-Host ""
Write-Host "🏷️ CATEGORY TESTS" -ForegroundColor Cyan
Write-Host "=================="

# 9. Test Get Categories
$categoriesResult = Test-Endpoint -method "GET" -url "$baseUrl/categories" -headers $headers -testName "Get categories"

if ($categoriesResult.Success -and $categoriesResult.Data.Count -gt 0) {
    $categoryId = $categoriesResult.Data[0].id
    
    # 10. Test Get Specific Category
    Test-Endpoint -method "GET" -url "$baseUrl/categories/$categoryId" -headers $headers -testName "Get specific category"
}

Write-Host ""
Write-Host "💰 TRANSACTION TESTS" -ForegroundColor Cyan
Write-Host "===================="

# 11. Test Get Transactions
$transactionsResult = Test-Endpoint -method "GET" -url "$baseUrl/transactions" -headers $headers -testName "Get transactions"

if ($transactionsResult.Success) {
    $transactionCount = $transactionsResult.Data.Count
    Write-Host "Found $transactionCount transactions" -ForegroundColor Yellow
}

# 12. Test Transaction Filters
Test-Endpoint -method "GET" -url "$baseUrl/transactions?period=current_month" -headers $headers -testName "Transaction filters"

# 13. Test Transaction Summary
Test-Endpoint -method "GET" -url "$baseUrl/transactions/summary" -headers $headers -testName "Transaction summary"

# 14. Test Create Transaction
if ($categoryId -and $accountId) {
    $newTransactionBody = @{
        description = "Test API Transaction"
        amount = -50.00
        type = "EXPENSE"
        date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        categoryId = $categoryId
        accountId = $accountId
    } | ConvertTo-Json

    $newTransResult = Test-Endpoint -method "POST" -url "$baseUrl/transactions" -headers $headers -body $newTransactionBody -testName "Create transaction"
    
    if ($newTransResult.Success) {
        $createdTransId = $newTransResult.Data.id
    }
}

Write-Host ""
Write-Host "📈 DASHBOARD TESTS" -ForegroundColor Cyan
Write-Host "=================="

# 15. Test Dashboard Stats
Test-Endpoint -method "GET" -url "$baseUrl/dashboard/stats" -headers $headers -testName "Dashboard statistics"

# 16. Test Dashboard Chart Data
Test-Endpoint -method "GET" -url "$baseUrl/dashboard/chart-data" -headers $headers -testName "Dashboard chart data"

Write-Host ""
Write-Host "📄 REPORTS TESTS" -ForegroundColor Cyan
Write-Host "================"

# 17. Test Basic Report
Test-Endpoint -method "GET" -url "$baseUrl/reports" -headers $headers -testName "Basic report"

# 18. Test Monthly Report
Test-Endpoint -method "GET" -url "$baseUrl/reports?period=current_month" -headers $headers -testName "Monthly report"

Write-Host ""
Write-Host "❌ ERROR HANDLING TESTS" -ForegroundColor Cyan
Write-Host "======================="

# 19. Test 401 - No Token
Write-Host "Testing 401 - No authentication... " -NoNewline
try {
    Invoke-RestMethod -Uri "$baseUrl/budgets" -Method GET
    Write-Host "❌ FAIL (Expected 401)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL (Got $statusCode)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 CLEANUP & SUMMARY" -ForegroundColor Yellow
Write-Host "===================="

# Cleanup - Delete created transaction
if ($createdTransId) {
    Test-Endpoint -method "DELETE" -url "$baseUrl/transactions/$createdTransId" -headers $headers -testName "Cleanup test transaction"
}

Write-Host ""
Write-Host "🎉 Budget API Test Suite Completed!" -ForegroundColor Green
Write-Host "📈 Using test data created by seed script" -ForegroundColor Blue
Write-Host "💡 All endpoints tested with realistic data" -ForegroundColor Yellow
