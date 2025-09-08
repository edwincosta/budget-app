#!/bin/bash

# Budget API Test Suite
# Testa todas as APIs utilizando os dados de teste criados

echo "🧪 BUDGET API TEST SUITE"
echo "========================"
echo ""

# Configurações
BASE_URL="http://localhost:3001/api"
USER_EMAIL="joao@example.com"
USER_PASSWORD="123456"
MARIA_EMAIL="maria@example.com"
PEDRO_EMAIL="pedro@example.com"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir resultado do teste
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - $2"
    else
        echo -e "${RED}❌ FAIL${NC} - $2"
    fi
}

echo -e "${BLUE}🔐 AUTHENTICATION TESTS${NC}"
echo "========================"

# 1. Test Login - João
echo -n "Testing login for João... "
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

HTTP_CODE=${LOGIN_RESPONSE: -3}
RESPONSE_BODY=${LOGIN_RESPONSE%???}

if [ "$HTTP_CODE" = "200" ]; then
    TOKEN=$(echo $RESPONSE_BODY | jq -r '.token')
    USER_ID=$(echo $RESPONSE_BODY | jq -r '.user.id')
    test_result 0 "Login João"
else
    test_result 1 "Login João (HTTP: $HTTP_CODE)"
    exit 1
fi

# 2. Test Login - Maria
echo -n "Testing login for Maria... "
MARIA_LOGIN=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$MARIA_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

MARIA_HTTP_CODE=${MARIA_LOGIN: -3}
MARIA_RESPONSE=${MARIA_LOGIN%???}

if [ "$MARIA_HTTP_CODE" = "200" ]; then
    MARIA_TOKEN=$(echo $MARIA_RESPONSE | jq -r '.token')
    test_result 0 "Login Maria"
else
    test_result 1 "Login Maria (HTTP: $MARIA_HTTP_CODE)"
fi

# 3. Test Get User Info
echo -n "Testing get user info... "
USER_INFO=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

USER_INFO_CODE=${USER_INFO: -3}
if [ "$USER_INFO_CODE" = "200" ]; then
    test_result 0 "Get user info"
else
    test_result 1 "Get user info (HTTP: $USER_INFO_CODE)"
fi

echo ""
echo -e "${BLUE}📊 BUDGET TESTS${NC}"
echo "================"

# 4. Test Get Budgets
echo -n "Testing get budgets... "
BUDGETS_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/budgets" \
  -H "Authorization: Bearer $TOKEN")

BUDGETS_CODE=${BUDGETS_RESPONSE: -3}
BUDGETS_BODY=${BUDGETS_RESPONSE%???}

if [ "$BUDGETS_CODE" = "200" ]; then
    BUDGET_ID=$(echo $BUDGETS_BODY | jq -r '.[0].id')
    test_result 0 "Get budgets"
else
    test_result 1 "Get budgets (HTTP: $BUDGETS_CODE)"
fi

# 5. Test Get Specific Budget
echo -n "Testing get specific budget... "
BUDGET_DETAIL=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/budgets/$BUDGET_ID" \
  -H "Authorization: Bearer $TOKEN")

BUDGET_DETAIL_CODE=${BUDGET_DETAIL: -3}
if [ "$BUDGET_DETAIL_CODE" = "200" ]; then
    test_result 0 "Get specific budget"
else
    test_result 1 "Get specific budget (HTTP: $BUDGET_DETAIL_CODE)"
fi

# 6. Test Budget Stats
echo -n "Testing budget statistics... "
BUDGET_STATS=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/budgets/$BUDGET_ID/stats" \
  -H "Authorization: Bearer $TOKEN")

BUDGET_STATS_CODE=${BUDGET_STATS: -3}
if [ "$BUDGET_STATS_CODE" = "200" ]; then
    test_result 0 "Budget statistics"
else
    test_result 1 "Budget statistics (HTTP: $BUDGET_STATS_CODE)"
fi

echo ""
echo -e "${BLUE}💳 ACCOUNT TESTS${NC}"
echo "================"

# 7. Test Get Accounts
echo -n "Testing get accounts... "
ACCOUNTS_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/accounts" \
  -H "Authorization: Bearer $TOKEN")

ACCOUNTS_CODE=${ACCOUNTS_RESPONSE: -3}
ACCOUNTS_BODY=${ACCOUNTS_RESPONSE%???}

if [ "$ACCOUNTS_CODE" = "200" ]; then
    ACCOUNT_ID=$(echo $ACCOUNTS_BODY | jq -r '.[0].id')
    test_result 0 "Get accounts"
else
    test_result 1 "Get accounts (HTTP: $ACCOUNTS_CODE)"
fi

# 8. Test Get Specific Account
echo -n "Testing get specific account... "
ACCOUNT_DETAIL=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/accounts/$ACCOUNT_ID" \
  -H "Authorization: Bearer $TOKEN")

ACCOUNT_DETAIL_CODE=${ACCOUNT_DETAIL: -3}
if [ "$ACCOUNT_DETAIL_CODE" = "200" ]; then
    test_result 0 "Get specific account"
else
    test_result 1 "Get specific account (HTTP: $ACCOUNT_DETAIL_CODE)"
fi

# 9. Test Account Transactions
echo -n "Testing account transactions... "
ACCOUNT_TRANSACTIONS=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/accounts/$ACCOUNT_ID/transactions" \
  -H "Authorization: Bearer $TOKEN")

ACCOUNT_TRANS_CODE=${ACCOUNT_TRANSACTIONS: -3}
if [ "$ACCOUNT_TRANS_CODE" = "200" ]; then
    test_result 0 "Account transactions"
else
    test_result 1 "Account transactions (HTTP: $ACCOUNT_TRANS_CODE)"
fi

echo ""
echo -e "${BLUE}🏷️ CATEGORY TESTS${NC}"
echo "=================="

# 10. Test Get Categories
echo -n "Testing get categories... "
CATEGORIES_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/categories" \
  -H "Authorization: Bearer $TOKEN")

CATEGORIES_CODE=${CATEGORIES_RESPONSE: -3}
CATEGORIES_BODY=${CATEGORIES_RESPONSE%???}

if [ "$CATEGORIES_CODE" = "200" ]; then
    CATEGORY_ID=$(echo $CATEGORIES_BODY | jq -r '.[0].id')
    test_result 0 "Get categories"
else
    test_result 1 "Get categories (HTTP: $CATEGORIES_CODE)"
fi

# 11. Test Get Specific Category
echo -n "Testing get specific category... "
CATEGORY_DETAIL=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/categories/$CATEGORY_ID" \
  -H "Authorization: Bearer $TOKEN")

CATEGORY_DETAIL_CODE=${CATEGORY_DETAIL: -3}
if [ "$CATEGORY_DETAIL_CODE" = "200" ]; then
    test_result 0 "Get specific category"
else
    test_result 1 "Get specific category (HTTP: $CATEGORY_DETAIL_CODE)"
fi

echo ""
echo -e "${BLUE}💰 TRANSACTION TESTS${NC}"
echo "===================="

# 12. Test Get Transactions
echo -n "Testing get transactions... "
TRANSACTIONS_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/transactions" \
  -H "Authorization: Bearer $TOKEN")

TRANSACTIONS_CODE=${TRANSACTIONS_RESPONSE: -3}
TRANSACTIONS_BODY=${TRANSACTIONS_RESPONSE%???}

if [ "$TRANSACTIONS_CODE" = "200" ]; then
    TRANSACTION_COUNT=$(echo $TRANSACTIONS_BODY | jq '. | length')
    test_result 0 "Get transactions ($TRANSACTION_COUNT found)"
else
    test_result 1 "Get transactions (HTTP: $TRANSACTIONS_CODE)"
fi

# 13. Test Transaction Filters
echo -n "Testing transaction filters (current month)... "
FILTERED_TRANSACTIONS=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/transactions?period=current_month" \
  -H "Authorization: Bearer $TOKEN")

FILTERED_CODE=${FILTERED_TRANSACTIONS: -3}
if [ "$FILTERED_CODE" = "200" ]; then
    test_result 0 "Transaction filters"
else
    test_result 1 "Transaction filters (HTTP: $FILTERED_CODE)"
fi

# 14. Test Transaction Summary
echo -n "Testing transaction summary... "
TRANS_SUMMARY=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/transactions/summary" \
  -H "Authorization: Bearer $TOKEN")

TRANS_SUMMARY_CODE=${TRANS_SUMMARY: -3}
if [ "$TRANS_SUMMARY_CODE" = "200" ]; then
    test_result 0 "Transaction summary"
else
    test_result 1 "Transaction summary (HTTP: $TRANS_SUMMARY_CODE)"
fi

# 15. Test Create Transaction
echo -n "Testing create transaction... "
NEW_TRANSACTION=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Test API Transaction\",
    \"amount\": -50.00,
    \"type\": \"EXPENSE\",
    \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
    \"categoryId\": \"$CATEGORY_ID\",
    \"accountId\": \"$ACCOUNT_ID\"
  }")

NEW_TRANS_CODE=${NEW_TRANSACTION: -3}
NEW_TRANS_BODY=${NEW_TRANSACTION%???}

if [ "$NEW_TRANS_CODE" = "201" ]; then
    CREATED_TRANS_ID=$(echo $NEW_TRANS_BODY | jq -r '.id')
    test_result 0 "Create transaction"
else
    test_result 1 "Create transaction (HTTP: $NEW_TRANS_CODE)"
fi

echo ""
echo -e "${BLUE}📈 DASHBOARD TESTS${NC}"
echo "=================="

# 16. Test Dashboard Stats
echo -n "Testing dashboard statistics... "
DASHBOARD_STATS=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN")

DASHBOARD_CODE=${DASHBOARD_STATS: -3}
if [ "$DASHBOARD_CODE" = "200" ]; then
    test_result 0 "Dashboard statistics"
else
    test_result 1 "Dashboard statistics (HTTP: $DASHBOARD_CODE)"
fi

# 17. Test Dashboard Chart Data
echo -n "Testing dashboard chart data... "
CHART_DATA=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/dashboard/chart-data" \
  -H "Authorization: Bearer $TOKEN")

CHART_CODE=${CHART_DATA: -3}
if [ "$CHART_CODE" = "200" ]; then
    test_result 0 "Dashboard chart data"
else
    test_result 1 "Dashboard chart data (HTTP: $CHART_CODE)"
fi

echo ""
echo -e "${BLUE}📄 REPORTS TESTS${NC}"
echo "================"

# 18. Test Basic Report
echo -n "Testing basic report... "
BASIC_REPORT=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/reports" \
  -H "Authorization: Bearer $TOKEN")

REPORT_CODE=${BASIC_REPORT: -3}
if [ "$REPORT_CODE" = "200" ]; then
    test_result 0 "Basic report"
else
    test_result 1 "Basic report (HTTP: $REPORT_CODE)"
fi

# 19. Test Monthly Report
echo -n "Testing monthly report... "
MONTHLY_REPORT=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/reports?period=current_month" \
  -H "Authorization: Bearer $TOKEN")

MONTHLY_CODE=${MONTHLY_REPORT: -3}
if [ "$MONTHLY_CODE" = "200" ]; then
    test_result 0 "Monthly report"
else
    test_result 1 "Monthly report (HTTP: $MONTHLY_CODE)"
fi

echo ""
echo -e "${BLUE}🤝 SHARING TESTS${NC}"
echo "================"

# 20. Test Create Share
echo -n "Testing create budget share... "
NEW_SHARE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/sharing/share" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"budgetId\": \"$BUDGET_ID\",
    \"email\": \"$MARIA_EMAIL\",
    \"permission\": \"READ\"
  }")

SHARE_CODE=${NEW_SHARE: -3}
SHARE_BODY=${NEW_SHARE%???}

if [ "$SHARE_CODE" = "201" ]; then
    SHARE_ID=$(echo $SHARE_BODY | jq -r '.id')
    test_result 0 "Create budget share"
else
    test_result 1 "Create budget share (HTTP: $SHARE_CODE)"
fi

# 21. Test Get Sent Shares
echo -n "Testing get sent shares... "
SENT_SHARES=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/sharing/sent" \
  -H "Authorization: Bearer $TOKEN")

SENT_CODE=${SENT_SHARES: -3}
if [ "$SENT_CODE" = "200" ]; then
    test_result 0 "Get sent shares"
else
    test_result 1 "Get sent shares (HTTP: $SENT_CODE)"
fi

# 22. Test Get Received Shares (as Maria)
if [ ! -z "$MARIA_TOKEN" ]; then
    echo -n "Testing get received shares (as Maria)... "
    RECEIVED_SHARES=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/sharing/received" \
      -H "Authorization: Bearer $MARIA_TOKEN")

    RECEIVED_CODE=${RECEIVED_SHARES: -3}
    if [ "$RECEIVED_CODE" = "200" ]; then
        test_result 0 "Get received shares"
    else
        test_result 1 "Get received shares (HTTP: $RECEIVED_CODE)"
    fi
fi

echo ""
echo -e "${BLUE}❌ ERROR HANDLING TESTS${NC}"
echo "======================="

# 23. Test 401 - No Token
echo -n "Testing 401 - No authentication... "
NO_AUTH=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/budgets")
NO_AUTH_CODE=${NO_AUTH: -3}

if [ "$NO_AUTH_CODE" = "401" ]; then
    test_result 0 "401 - No authentication"
else
    test_result 1 "401 - No authentication (Expected 401, got $NO_AUTH_CODE)"
fi

# 24. Test 404 - Invalid endpoint
echo -n "Testing 404 - Invalid endpoint... "
NOT_FOUND=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/nonexistent" \
  -H "Authorization: Bearer $TOKEN")
NOT_FOUND_CODE=${NOT_FOUND: -3}

if [ "$NOT_FOUND_CODE" = "404" ]; then
    test_result 0 "404 - Invalid endpoint"
else
    test_result 1 "404 - Invalid endpoint (Expected 404, got $NOT_FOUND_CODE)"
fi

# 25. Test 400 - Invalid data
echo -n "Testing 400 - Invalid data... "
INVALID_DATA=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}")
INVALID_CODE=${INVALID_DATA: -3}

if [ "$INVALID_CODE" = "400" ]; then
    test_result 0 "400 - Invalid data"
else
    test_result 1 "400 - Invalid data (Expected 400, got $INVALID_CODE)"
fi

echo ""
echo -e "${YELLOW}📊 TEST SUMMARY${NC}"
echo "==============="

# Cleanup - Delete created transaction
if [ ! -z "$CREATED_TRANS_ID" ]; then
    echo -n "Cleaning up test transaction... "
    DELETE_TRANS=$(curl -s -w "%{http_code}" -X DELETE "$BASE_URL/transactions/$CREATED_TRANS_ID" \
      -H "Authorization: Bearer $TOKEN")
    DELETE_CODE=${DELETE_TRANS: -3}
    
    if [ "$DELETE_CODE" = "204" ]; then
        test_result 0 "Cleanup test transaction"
    else
        test_result 1 "Cleanup test transaction (HTTP: $DELETE_CODE)"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Budget API Test Suite Completed!${NC}"
echo -e "${BLUE}📈 Using test data created by seed script${NC}"
echo -e "${YELLOW}💡 Run individual tests or check specific endpoints as needed${NC}"
