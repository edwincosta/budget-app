# Budget API Test Suite - PowerShell Version
# Testa todas as APIs utilizando os dados de teste criados

Write-Host "🧪 BUDGET API TEST SUITE" -ForegroundColor Blue
Write-Host "========================" -ForegroundColor Blue
Write-Host ""

# Configurações
$baseUrl = "http://localhost:3001/api"
$userEmail = "joao@example.com"
$userPassword = "123456"
$mariaEmail = "maria@example.com"
$pedroEmail = "pedro@example.com"

# Função para exibir resultado do teste
function Test-Result {
    param([bool]$success, [string]$message)
    if ($success) {
        Write-Host "✅ PASS" -ForegroundColor Green -NoNewline
        Write-Host " - $message"
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red -NoNewline
        Write-Host " - $message"
    }
}

# Função para fazer requests HTTP
function Invoke-ApiRequest {
    param(
        [string]$method,
        [string]$url,
        [hashtable]$headers = @{},
        [string]$body = $null
    )
    
    try {
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
        return @{ Success = $true; Data = $response; StatusCode = 200 }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        return @{ Success = $false; Error = $_.Exception.Message; StatusCode = $statusCode }
    }
}

Write-Host "🔐 AUTHENTICATION TESTS" -ForegroundColor Cyan
Write-Host "========================"

# 1. Test Login - João
Write-Host "Testing login for João... " -NoNewline
$loginBody = @{
    email = $userEmail
    password = $userPassword
} | ConvertTo-Json

$loginResponse = Invoke-ApiRequest -method "POST" -url "$baseUrl/auth/login" -body $loginBody

if ($loginResponse.Success) {
    $token = $loginResponse.Data.token
    $userId = $loginResponse.Data.user.id
    Test-Result $true "Login João"
} else {
    Test-Result $false "Login João (Status: $($loginResponse.StatusCode))"
    exit 1
}

# 2. Test Login - Maria
Write-Host "Testing login for Maria... " -NoNewline
$mariaLoginBody = @{
    email = $mariaEmail
    password = $userPassword
} | ConvertTo-Json

$mariaResponse = Invoke-ApiRequest -method "POST" -url "$baseUrl/auth/login" -body $mariaLoginBody

if ($mariaResponse.Success) {
    $mariaToken = $mariaResponse.Data.token
    Test-Result $true "Login Maria"
} else {
    Test-Result $false "Login Maria (Status: $($mariaResponse.StatusCode))"
}

# 3. Test Get User Info
Write-Host "Testing get user info... " -NoNewline
$headers = @{ Authorization = "Bearer $token" }
$userInfoResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/auth/me" -headers $headers

Test-Result $userInfoResponse.Success "Get user info"

Write-Host ""
Write-Host "📊 BUDGET TESTS" -ForegroundColor Cyan
Write-Host "================"

# 4. Test Get Budgets
Write-Host "Testing get budgets... " -NoNewline
$budgetsResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/budgets" -headers $headers

if ($budgetsResponse.Success) {
    $budgetId = $budgetsResponse.Data[0].id
    Test-Result $true "Get budgets"
} else {
    Test-Result $false "Get budgets (Status: $($budgetsResponse.StatusCode))"
}

# 5. Test Get Specific Budget
Write-Host "Testing get specific budget... " -NoNewline
$budgetDetailResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/budgets/$budgetId" -headers $headers
Test-Result $budgetDetailResponse.Success "Get specific budget"

# 6. Test Budget Stats
Write-Host "Testing budget statistics... " -NoNewline
$budgetStatsResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/budgets/$budgetId/stats" -headers $headers
Test-Result $budgetStatsResponse.Success "Budget statistics"

Write-Host ""
Write-Host "💳 ACCOUNT TESTS" -ForegroundColor Cyan
Write-Host "================"

# 7. Test Get Accounts
Write-Host "Testing get accounts... " -NoNewline
$accountsResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/accounts" -headers $headers

if ($accountsResponse.Success) {
    $accountId = $accountsResponse.Data[0].id
    Test-Result $true "Get accounts"
} else {
    Test-Result $false "Get accounts (Status: $($accountsResponse.StatusCode))"
}

# 8. Test Get Specific Account
Write-Host "Testing get specific account... " -NoNewline
$accountDetailResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/accounts/$accountId" -headers $headers
Test-Result $accountDetailResponse.Success "Get specific account"

# 9. Test Account Transactions
Write-Host "Testing account transactions... " -NoNewline
$accountTransResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/accounts/$accountId/transactions" -headers $headers
Test-Result $accountTransResponse.Success "Account transactions"

Write-Host ""
Write-Host "🏷️ CATEGORY TESTS" -ForegroundColor Cyan
Write-Host "=================="

# 10. Test Get Categories
Write-Host "Testing get categories... " -NoNewline
$categoriesResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/categories" -headers $headers

if ($categoriesResponse.Success) {
    $categoryId = $categoriesResponse.Data[0].id
    Test-Result $true "Get categories"
} else {
    Test-Result $false "Get categories (Status: $($categoriesResponse.StatusCode))"
}

# 11. Test Get Specific Category
Write-Host "Testing get specific category... " -NoNewline
$categoryDetailResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/categories/$categoryId" -headers $headers
Test-Result $categoryDetailResponse.Success "Get specific category"

Write-Host ""
Write-Host "💰 TRANSACTION TESTS" -ForegroundColor Cyan
Write-Host "===================="

# 12. Test Get Transactions
Write-Host "Testing get transactions... " -NoNewline
$transactionsResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/transactions" -headers $headers

if ($transactionsResponse.Success) {
    $transactionCount = $transactionsResponse.Data.Count
    Test-Result $true "Get transactions ($transactionCount found)"
} else {
    Test-Result $false "Get transactions (Status: $($transactionsResponse.StatusCode))"
}

# 13. Test Transaction Filters
Write-Host "Testing transaction filters... " -NoNewline
$filteredResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/transactions?period=current_month" -headers $headers
Test-Result $filteredResponse.Success "Transaction filters"

# 14. Test Transaction Summary
Write-Host "Testing transaction summary... " -NoNewline
$summaryResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/transactions/summary" -headers $headers
Test-Result $summaryResponse.Success "Transaction summary"

# 15. Test Create Transaction
Write-Host "Testing create transaction... " -NoNewline
$newTransactionBody = @{
    description = "Test API Transaction"
    amount = -50.00
    type = "EXPENSE"
    date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    categoryId = $categoryId
    accountId = $accountId
} | ConvertTo-Json

$newTransResponse = Invoke-ApiRequest -method "POST" -url "$baseUrl/transactions" -headers $headers -body $newTransactionBody

if ($newTransResponse.Success) {
    $createdTransId = $newTransResponse.Data.id
    Test-Result $true "Create transaction"
} else {
    Test-Result $false "Create transaction (Status: $($newTransResponse.StatusCode))"
}

Write-Host ""
Write-Host "📈 DASHBOARD TESTS" -ForegroundColor Cyan
Write-Host "=================="

# 16. Test Dashboard Stats
Write-Host "Testing dashboard statistics... " -NoNewline
$dashboardResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/dashboard/stats" -headers $headers
Test-Result $dashboardResponse.Success "Dashboard statistics"

# 17. Test Dashboard Chart Data
Write-Host "Testing dashboard chart data... " -NoNewline
$chartResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/dashboard/chart-data" -headers $headers
Test-Result $chartResponse.Success "Dashboard chart data"

Write-Host ""
Write-Host "📄 REPORTS TESTS" -ForegroundColor Cyan
Write-Host "================"

# 18. Test Basic Report
Write-Host "Testing basic report... " -NoNewline
$reportResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/reports" -headers $headers
Test-Result $reportResponse.Success "Basic report"

# 19. Test Monthly Report
Write-Host "Testing monthly report... " -NoNewline
$monthlyResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/reports?period=current_month" -headers $headers
Test-Result $monthlyResponse.Success "Monthly report"

Write-Host ""
Write-Host "🤝 SHARING TESTS" -ForegroundColor Cyan
Write-Host "================"

# 20. Test Create Share
Write-Host "Testing create budget share... " -NoNewline
$shareBody = @{
    budgetId = $budgetId
    email = $mariaEmail
    permission = "READ"
} | ConvertTo-Json

$shareResponse = Invoke-ApiRequest -method "POST" -url "$baseUrl/sharing/share" -headers $headers -body $shareBody

if ($shareResponse.Success) {
    $shareId = $shareResponse.Data.id
    Test-Result $true "Create budget share"
} else {
    Test-Result $false "Create budget share (Status: $($shareResponse.StatusCode))"
}

# 21. Test Get Sent Shares
Write-Host "Testing get sent shares... " -NoNewline
$sentResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/sharing/sent" -headers $headers
Test-Result $sentResponse.Success "Get sent shares"

# 22. Test Get Received Shares (as Maria)
if ($mariaToken) {
    Write-Host "Testing get received shares (as Maria)... " -NoNewline
    $mariaHeaders = @{ Authorization = "Bearer $mariaToken" }
    $receivedResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/sharing/received" -headers $mariaHeaders
    Test-Result $receivedResponse.Success "Get received shares"
}

Write-Host ""
Write-Host "❌ ERROR HANDLING TESTS" -ForegroundColor Cyan
Write-Host "======================="

# 23. Test 401 - No Token
Write-Host "Testing 401 - No authentication... " -NoNewline
$noAuthResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/budgets"
$is401 = $noAuthResponse.StatusCode -eq 401
Test-Result $is401 "401 - No authentication"

# 24. Test 404 - Invalid endpoint
Write-Host "Testing 404 - Invalid endpoint... " -NoNewline
$notFoundResponse = Invoke-ApiRequest -method "GET" -url "$baseUrl/nonexistent" -headers $headers
$is404 = $notFoundResponse.StatusCode -eq 404
Test-Result $is404 "404 - Invalid endpoint"

# 25. Test 400 - Invalid data
Write-Host "Testing 400 - Invalid data... " -NoNewline
$invalidResponse = Invoke-ApiRequest -method "POST" -url "$baseUrl/accounts" -headers $headers -body "{}"
$is400 = $invalidResponse.StatusCode -eq 400
Test-Result $is400 "400 - Invalid data"

Write-Host ""
Write-Host "📊 TEST SUMMARY" -ForegroundColor Yellow
Write-Host "==============="

# Cleanup - Delete created transaction
if ($createdTransId) {
    Write-Host "Cleaning up test transaction... " -NoNewline
    $deleteResponse = Invoke-ApiRequest -method "DELETE" -url "$baseUrl/transactions/$createdTransId" -headers $headers
    Test-Result $deleteResponse.Success "Cleanup test transaction"
}

Write-Host ""
Write-Host "🎉 Budget API Test Suite Completed!" -ForegroundColor Green
Write-Host "📈 Using test data created by seed script" -ForegroundColor Blue
Write-Host "💡 Run individual tests or check specific endpoints as needed" -ForegroundColor Yellow

Write-Host ""
Write-Host "📋 QUICK TEST EXAMPLES:" -ForegroundColor Magenta
Write-Host "======================="
Write-Host "# Test specific endpoint:"
Write-Host "Invoke-RestMethod -Uri 'http://localhost:3001/api/transactions' -Headers @{Authorization='Bearer $token'}" -ForegroundColor Gray
Write-Host ""
Write-Host "# Check database status:"
Write-Host "Invoke-RestMethod -Uri 'http://localhost:3001/api/test'" -ForegroundColor Gray
