#!/bin/bash
BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/cookies.txt"

# Login
curl -s -c $COOKIE_FILE -b $COOKIE_FILE -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"gio","password":"admin123"}' > /dev/null

ORG_ID=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/auth/session" | grep -o '"organizationId":"[^"]*"' | cut -d'"' -f4)

echo "Testing Notes API..."

# Get a contact ID first
CONTACT_ID=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/contacts?organizationId=$ORG_ID" | grep -o '"id":"contact-[^"]*"' | head -1 | cut -d'"' -f4)
echo "Using contact: $CONTACT_ID"

# Create note for contact
echo ""
echo "1. Creating note for contact..."
curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/notes" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test note for contact","entityType":"contact","entityId":"'$CONTACT_ID'","organizationId":"'$ORG_ID'"}' | head -c 200

echo ""
echo ""

# Create a deal first, then note
echo "2. Creating deal..."
DEAL=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/deals" \
  -H "Content-Type: application/json" \
  -d '{"title":"Deal for note test","value":100000,"organizationId":"'$ORG_ID'"}')
DEAL_ID=$(echo "$DEAL" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Deal created: $DEAL_ID"

echo ""
echo "3. Creating note for deal..."
curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/notes" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test note for deal","entityType":"deal","entityId":"'$DEAL_ID'","organizationId":"'$ORG_ID'"}' | head -c 200

echo ""
echo ""
echo "4. Fetching notes..."
curl -s -b $COOKIE_FILE "$BASE_URL/api/notes?organizationId=$ORG_ID&limit=5" | head -c 300

rm -f $COOKIE_FILE
