#!/bin/bash

BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/cookies.txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "MAATWORK CRM - PAGE LOAD TESTS"
echo "========================================"
echo ""

# Login first
curl -s -c $COOKIE_FILE -b $COOKIE_FILE -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"gio","password":"admin123"}' > /dev/null

# Pages to test
PAGES=(
  "/"
  "/login"
  "/contacts"
  "/pipeline"
  "/tasks"
  "/teams"
  "/calendar"
  "/reports"
  "/training"
  "/settings"
  "/notifications"
  "/register"
)

for PAGE in "${PAGES[@]}"; do
  echo -e "${YELLOW}Testing: $PAGE${NC}"
  RESPONSE=$(curl -s -b $COOKIE_FILE -w "\n%{http_code}" "$BASE_URL$PAGE")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  
  # Check for errors in response
  if echo "$BODY" | grep -qi "error\|exception\|failed"; then
    echo -e "  ${RED}✗ HTTP $HTTP_CODE - Possible error in page${NC}"
    echo "$BODY" | grep -i "error\|exception\|failed" | head -3
  elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}✓ HTTP $HTTP_CODE - Page loaded${NC}"
  else
    echo -e "  ${RED}✗ HTTP $HTTP_CODE${NC}"
  fi
  echo ""
done

# Cleanup
rm -f $COOKIE_FILE

echo "========================================"
echo "PAGE LOAD TESTS COMPLETED"
echo "========================================"
