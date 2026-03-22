#!/bin/bash

BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/cookies.txt"

echo "=== TESTING CRUD OPERATIONS ==="

# Login
curl -s -c $COOKIE_FILE -b $COOKIE_FILE -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"gio","password":"admin123"}' > /dev/null

# Get org ID
ORG_ID=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/auth/session" | grep -o '"organizationId":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "1. CREATE Deal"
DEAL=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/deals" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Deal","value":50000,"probability":50,"organizationId":"'$ORG_ID'"}')
echo "$DEAL" | head -c 150
DEAL_ID=$(echo "$DEAL" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""

echo ""
echo "2. UPDATE Deal"
curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/api/deals/$DEAL_ID" \
  -H "Content-Type: application/json" \
  -d '{"value":75000,"probability":75}' | head -c 150
echo ""

echo ""
echo "3. CREATE Goal"
GOAL=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/goals" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Goal","type":"new_aum","targetValue":100000,"unit":"currency","month":3,"year":2025,"teamId":"team-ventas","organizationId":"'$ORG_ID'"}')
echo "$GOAL" | head -c 150
GOAL_ID=$(echo "$GOAL" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""

echo ""
echo "4. UPDATE Goal Progress"
curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/api/goals/$GOAL_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentValue":50000}' | head -c 150
echo ""

echo ""
echo "5. CREATE Calendar Event"
EVENT=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/calendar-events" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Event","startAt":"2025-03-20T10:00:00Z","endAt":"2025-03-20T11:00:00Z","type":"meeting","organizationId":"'$ORG_ID'"}')
echo "$EVENT" | head -c 150
EVENT_ID=$(echo "$EVENT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""

echo ""
echo "6. CREATE Note"
NOTE=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/notes" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test note from API","entityType":"deal","entityId":"'$DEAL_ID'","organizationId":"'$ORG_ID'"}')
echo "$NOTE" | head -c 150
NOTE_ID=$(echo "$NOTE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""

echo ""
echo "7. CREATE Training Material"
TRAINING=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/training" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Training","category":"document","organizationId":"'$ORG_ID'"}')
echo "$TRAINING" | head -c 150
TRAINING_ID=$(echo "$TRAINING" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""

echo ""
echo "8. DELETE operations"
echo "Deleting deal $DEAL_ID..."
curl -s -b $COOKIE_FILE -X DELETE "$BASE_URL/api/deals/$DEAL_ID" | head -c 100
echo ""
echo "Deleting event $EVENT_ID..."
curl -s -b $COOKIE_FILE -X DELETE "$BASE_URL/api/calendar-events/$EVENT_ID" | head -c 100
echo ""
echo "Deleting note $NOTE_ID..."
curl -s -b $COOKIE_FILE -X DELETE "$BASE_URL/api/notes/$NOTE_ID" | head -c 100
echo ""
echo "Deleting training $TRAINING_ID..."
curl -s -b $COOKIE_FILE -X DELETE "$BASE_URL/api/training/$TRAINING_ID" | head -c 100
echo ""

rm -f $COOKIE_FILE
echo ""
echo "=== CRUD TESTS COMPLETED ==="
