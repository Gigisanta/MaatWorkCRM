#!/bin/bash

BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/cookies.txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "MAATWORK CRM - API TEST SUITE"
echo "========================================"
echo ""

# Test 1: Login
echo -e "${YELLOW}TEST 1: Login${NC}"
LOGIN_RESPONSE=$(curl -s -c $COOKIE_FILE -b $COOKIE_FILE -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"gio","password":"admin123"}')
echo "$LOGIN_RESPONSE" | head -c 200
if echo "$LOGIN_RESPONSE" | grep -q "Inicio de sesión exitoso"; then
  echo -e "\n${GREEN}✓ Login successful${NC}"
else
  echo -e "\n${RED}✗ Login failed${NC}"
fi
echo ""

# Test 2: Check Session
echo -e "${YELLOW}TEST 2: Check Session${NC}"
SESSION_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/auth/session")
echo "$SESSION_RESPONSE" | head -c 300
if echo "$SESSION_RESPONSE" | grep -q '"authenticated":true'; then
  echo -e "\n${GREEN}✓ Session valid${NC}"
else
  echo -e "\n${RED}✗ Session invalid${NC}"
fi
echo ""

# Extract organizationId from session
ORG_ID=$(echo "$SESSION_RESPONSE" | grep -o '"organizationId":"[^"]*"' | cut -d'"' -f4)
echo "Organization ID: $ORG_ID"
echo ""

# Test 3: Get Contacts
echo -e "${YELLOW}TEST 3: Get Contacts${NC}"
CONTACTS_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/contacts?organizationId=$ORG_ID")
echo "$CONTACTS_RESPONSE" | head -c 300
if echo "$CONTACTS_RESPONSE" | grep -q '"contacts"'; then
  CONTACT_COUNT=$(echo "$CONTACTS_RESPONSE" | grep -o '"id"' | wc -l)
  echo -e "\n${GREEN}✓ Contacts fetched (count: $CONTACT_COUNT)${NC}"
else
  echo -e "\n${RED}✗ Failed to fetch contacts${NC}"
fi
echo ""

# Test 4: Get Deals
echo -e "${YELLOW}TEST 4: Get Deals${NC}"
DEALS_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/deals?organizationId=$ORG_ID")
echo "$DEALS_RESPONSE" | head -c 300
if echo "$DEALS_RESPONSE" | grep -q '"deals"'; then
  echo -e "\n${GREEN}✓ Deals fetched${NC}"
else
  echo -e "\n${RED}✗ Failed to fetch deals${NC}"
fi
echo ""

# Test 5: Get Tasks
echo -e "${YELLOW}TEST 5: Get Tasks${NC}"
TASKS_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/tasks?organizationId=$ORG_ID")
echo "$TASKS_RESPONSE" | head -c 300
if echo "$TASKS_RESPONSE" | grep -q '"tasks"'; then
  echo -e "\n${GREEN}✓ Tasks fetched${NC}"
else
  echo -e "\n${RED}✗ Failed to fetch tasks${NC}"
fi
echo ""

# Test 6: Get Teams
echo -e "${YELLOW}TEST 6: Get Teams${NC}"
TEAMS_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/teams?organizationId=$ORG_ID")
echo "$TEAMS_RESPONSE" | head -c 300
if echo "$TEAMS_RESPONSE" | grep -q '"teams"'; then
  echo -e "\n${GREEN}✓ Teams fetched${NC}"
else
  echo -e "\n${RED}✗ Failed to fetch teams${NC}"
fi
echo ""

# Test 7: Get Pipeline Stages
echo -e "${YELLOW}TEST 7: Get Pipeline Stages${NC}"
STAGES_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/pipeline-stages?organizationId=$ORG_ID")
echo "$STAGES_RESPONSE" | head -c 300
if echo "$STAGES_RESPONSE" | grep -q '"stages"'; then
  echo -e "\n${GREEN}✓ Pipeline stages fetched${NC}"
else
  echo -e "\n${RED}✗ Failed to fetch pipeline stages${NC}"
fi
echo ""

# Test 8: Get Calendar Events
echo -e "${YELLOW}TEST 8: Get Calendar Events${NC}"
EVENTS_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/calendar-events?organizationId=$ORG_ID")
echo "$EVENTS_RESPONSE" | head -c 300
if echo "$EVENTS_RESPONSE" | grep -q '"events"'; then
  echo -e "\n${GREEN}✓ Calendar events fetched${NC}"
else
  echo -e "\n${RED}✗ Failed to fetch calendar events${NC}"
fi
echo ""

# Test 9: Get Users
echo -e "${YELLOW}TEST 9: Get Users${NC}"
USERS_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/users?organizationId=$ORG_ID")
echo "$USERS_RESPONSE" | head -c 300
if echo "$USERS_RESPONSE" | grep -q '"id"'; then
  echo -e "\n${GREEN}✓ Users fetched${NC}"
else
  echo -e "\n${RED}✗ Failed to fetch users${NC}"
fi
echo ""

# Test 10: Create Contact
echo -e "${YELLOW}TEST 10: Create Contact${NC}"
CREATE_CONTACT=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/contacts" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Contact API","email":"test@api.com","organizationId":"'$ORG_ID'"}')
echo "$CREATE_CONTACT" | head -c 200
if echo "$CREATE_CONTACT" | grep -q '"id"'; then
  echo -e "\n${GREEN}✓ Contact created${NC}"
  CONTACT_ID=$(echo "$CREATE_CONTACT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
else
  echo -e "\n${RED}✗ Failed to create contact${NC}"
fi
echo ""

# Test 11: Create Task
echo -e "${YELLOW}TEST 11: Create Task${NC}"
CREATE_TASK=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task API","priority":"high","organizationId":"'$ORG_ID'"}')
echo "$CREATE_TASK" | head -c 200
if echo "$CREATE_TASK" | grep -q '"id"'; then
  echo -e "\n${GREEN}✓ Task created${NC}"
  TASK_ID=$(echo "$CREATE_TASK" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
else
  echo -e "\n${RED}✗ Failed to create task${NC}"
fi
echo ""

# Test 12: Logout
echo -e "${YELLOW}TEST 12: Logout${NC}"
LOGOUT_RESPONSE=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/auth/logout")
echo "$LOGOUT_RESPONSE"
if echo "$LOGOUT_RESPONSE" | grep -q "exitosamente\|Sesión cerrada\|success"; then
  echo -e "${GREEN}✓ Logout successful${NC}"
else
  echo -e "${YELLOW}⚠ Logout response received${NC}"
fi
echo ""

# Cleanup
rm -f $COOKIE_FILE

echo "========================================"
echo "TEST SUITE COMPLETED"
echo "========================================"
