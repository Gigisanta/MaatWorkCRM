#!/bin/bash
BASE_URL="http://localhost:3000"

echo "=== TESTING LOGIN WITH DIFFERENT IDENTIFIERS ==="
echo ""

# Test 1: Login with username
echo "1. Login with username 'gio':"
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"gio","password":"admin123"}' | grep -o '"message":"[^"]*"'

echo ""
echo "2. Login with name 'Giovanni Admin':"
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"Giovanni Admin","password":"admin123"}' | grep -o '"message":"[^"]*"'

echo ""
echo "3. Login with email 'gio':"
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"gio","password":"admin123"}' | grep -o '"message":"[^"]*"'

echo ""
echo "4. Login with wrong password:"
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"gio","password":"wrongpass"}' | grep -o '"error":"[^"]*"'

echo ""
echo "5. Login with other user 'ana':"
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"ana","password":"demo123"}' | grep -o '"message":"[^"]*"'

echo ""
echo "=== ALL USERNAME LOGIN TESTS COMPLETED ==="
