#!/bin/bash

BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/cookies.txt"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "  MAATWORK CRM - FINAL TEST SUITE"
echo "========================================"
echo ""

PASSED=0
FAILED=0

# Login
echo -e "${BLUE}Logging in...${NC}"
curl -s -c $COOKIE_FILE -b $COOKIE_FILE -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"gio","password":"admin123"}' > /dev/null

ORG_ID="demo-org"

test_api() {
  local name=$1
  local url=$2
  local check=$3
  
  RESPONSE=$(curl -s -b $COOKIE_FILE "$url")
  
  if echo "$RESPONSE" | grep -q "$check"; then
    echo -e "  ${GREEN}✓${NC} $name"
    ((PASSED++))
  else
    echo -e "  ${RED}✗${NC} $name"
    echo "    Response: ${RESPONSE:0:100}"
    ((FAILED++))
  fi
}

echo ""
echo -e "${YELLOW}=== PAGES ===${NC}"
for PAGE in "/" "/login" "/contacts" "/pipeline" "/tasks" "/teams" "/calendar" "/reports" "/training" "/settings" "/notifications"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$PAGE")
  if [ "$CODE" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} $PAGE (200 OK)"
    ((PASSED++))
  else
    echo -e "  ${RED}✗${NC} $PAGE ($CODE)"
    ((FAILED++))
  fi
done

echo ""
echo -e "${YELLOW}=== API ENDPOINTS ===${NC}"

test_api "GET /api/auth/session" "$BASE_URL/api/auth/session" '"authenticated"'
test_api "GET /api/contacts" "$BASE_URL/api/contacts?organizationId=$ORG_ID" '"contacts"'
test_api "GET /api/deals" "$BASE_URL/api/deals?organizationId=$ORG_ID" '"deals"'
test_api "GET /api/tasks" "$BASE_URL/api/tasks?organizationId=$ORG_ID" '"tasks"'
test_api "GET /api/teams" "$BASE_URL/api/teams?organizationId=$ORG_ID" '"teams"'
test_api "GET /api/pipeline-stages" "$BASE_URL/api/pipeline-stages?organizationId=$ORG_ID" '"stages"'
test_api "GET /api/calendar-events" "$BASE_URL/api/calendar-events?organizationId=$ORG_ID" '"events"'
test_api "GET /api/notes" "$BASE_URL/api/notes?organizationId=$ORG_ID" '"notes"'
test_api "GET /api/training" "$BASE_URL/api/training?organizationId=$ORG_ID" '"materials"'
test_api "GET /api/goals" "$BASE_URL/api/goals?teamId=team-ventas" '"goals"'
test_api "GET /api/users" "$BASE_URL/api/users?organizationId=$ORG_ID" '"users"'
test_api "GET /api/users/settings" "$BASE_URL/api/users/user-gio/settings" '"settings"'

echo ""
echo -e "${YELLOW}=== CREATE OPERATIONS ===${NC}"

# Create Contact
CREATE_RESULT=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/contacts" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Final Test Contact\",\"email\":\"final@test.com\",\"organizationId\":\"$ORG_ID\"}")
if echo "$CREATE_RESULT" | grep -q '"id"'; then
  echo -e "  ${GREEN}✓${NC} Create Contact"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} Create Contact"
  ((FAILED++))
fi

# Create Task
CREATE_RESULT=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Final Test Task\",\"priority\":\"high\",\"organizationId\":\"$ORG_ID\"}")
if echo "$CREATE_RESULT" | grep -q '"id"'; then
  echo -e "  ${GREEN}✓${NC} Create Task"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} Create Task"
  ((FAILED++))
fi

# Create Deal
CREATE_RESULT=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/deals" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Final Test Deal\",\"value\":100000,\"organizationId\":\"$ORG_ID\"}")
if echo "$CREATE_RESULT" | grep -q '"id"'; then
  echo -e "  ${GREEN}✓${NC} Create Deal"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} Create Deal"
  ((FAILED++))
fi

# Create Calendar Event
CREATE_RESULT=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/calendar-events" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Final Test Event\",\"startAt\":\"2025-04-01T10:00:00Z\",\"endAt\":\"2025-04-01T11:00:00Z\",\"type\":\"meeting\",\"organizationId\":\"$ORG_ID\"}")
if echo "$CREATE_RESULT" | grep -q '"id"'; then
  echo -e "  ${GREEN}✓${NC} Create Calendar Event"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} Create Calendar Event"
  ((FAILED++))
fi

# Create Notification
CREATE_RESULT=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/notifications" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"user-gio\",\"organizationId\":\"$ORG_ID\",\"type\":\"info\",\"title\":\"Test\",\"message\":\"Final test\"}")
if echo "$CREATE_RESULT" | grep -q '"id"'; then
  echo -e "  ${GREEN}✓${NC} Create Notification"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} Create Notification"
  ((FAILED++))
fi

# Create Pipeline Stage
CREATE_RESULT=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/pipeline-stages" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Final Test Stage\",\"organizationId\":\"$ORG_ID\"}")
if echo "$CREATE_RESULT" | grep -q '"id"'; then
  echo -e "  ${GREEN}✓${NC} Create Pipeline Stage"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} Create Pipeline Stage"
  ((FAILED++))
fi

echo ""
echo -e "${YELLOW}=== UPDATE OPERATIONS ===${NC}"

# Update user settings
UPDATE_RESULT=$(curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/api/users/user-gio/settings" \
  -H "Content-Type: application/json" \
  -d '{"emailNotifications":true,"pushNotifications":false,"taskReminders":true,"goalProgressAlerts":true,"newLeadsNotifications":true,"theme":"dark"}')
if echo "$UPDATE_RESULT" | grep -q '"settings"'; then
  echo -e "  ${GREEN}✓${NC} Update User Settings"
  ((PASSED++))
else
  echo -e "  ${RED}✗${NC} Update User Settings"
  ((FAILED++))
fi

echo ""
echo "========================================"
echo -e "  ${GREEN}PASSED:${NC} $PASSED"
echo -e "  ${RED}FAILED:${NC} $FAILED"
echo -e "  ${BLUE}TOTAL:${NC} $((PASSED + FAILED))"
echo "========================================"

rm -f $COOKIE_FILE

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi
