#!/bin/bash
BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/cookies.txt"

# Login
curl -s -c $COOKIE_FILE -b $COOKIE_FILE -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"gio","password":"admin123"}' > /dev/null

ORG_ID="demo-org"

echo "=== TESTING CRM FEATURES ==="
echo ""

# Test 1: Move deal to different stage
echo "1. Moving deal between pipeline stages"
# Get a deal
DEAL_ID=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/deals?organizationId=$ORG_ID" | grep -o '"id":"deal-[0-9]"' | head -1 | cut -d'"' -f4)
echo "   Using deal: $DEAL_ID"

# Move to stage
echo "   Moving to stage: stage-primera-reunion"
curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/deals/$DEAL_ID/move" \
  -H "Content-Type: application/json" \
  -d '{"stageId":"stage-primera-reunion"}' | head -c 200
echo ""

# Test 2: Complete a task
echo ""
echo "2. Completing a task"
TASK_ID=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/tasks?organizationId=$ORG_ID" | grep -o '"id":"task-[0-9]"' | head -1 | cut -d'"' -f4)
echo "   Using task: $TASK_ID"

curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/tasks/$TASK_ID/complete" \
  -H "Content-Type: application/json" \
  -d '{"organizationId":"'$ORG_ID'"}' | head -c 200
echo ""

# Test 3: Create team with members
echo ""
echo "3. Creating team and adding members"
TEAM=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/teams" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Team API","description":"Created via API","organizationId":"'$ORG_ID'"}')
TEAM_ID=$(echo "$TEAM" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Created team: $TEAM_ID"

# Add member
echo "   Adding member..."
curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/teams/$TEAM_ID/members" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-ana"}' | head -c 150
echo ""

# Test 4: Add tag to contact
echo ""
echo "4. Adding tag to contact"
CONTACT_ID=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/contacts?organizationId=$ORG_ID" | grep -o '"id":"contact-[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Using contact: $CONTACT_ID"

curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/contacts/$CONTACT_ID/tags" \
  -H "Content-Type: application/json" \
  -d '{"name":"VIP","color":"#FFD700"}' | head -c 150
echo ""

# Test 5: Update user settings
echo ""
echo "5. Updating user settings"
USER_ID="user-gio"
curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/api/users/$USER_ID/settings" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark","notifications":true}' | head -c 150
echo ""

# Test 6: Get managers list
echo ""
echo "6. Getting managers list"
curl -s -b $COOKIE_FILE "$BASE_URL/api/auth/managers?organizationId=$ORG_ID" | head -c 200
echo ""

# Test 7: Create notification
echo ""
echo "7. Testing notifications"
curl -s -b $COOKIE_FILE "$BASE_URL/api/notifications?organizationId=$ORG_ID" | head -c 200
echo ""

# Test 8: Mark notification as read
echo ""
echo "8. Marking notifications as read"
curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/notifications/read-all" \
  -H "Content-Type: application/json" \
  -d '{"organizationId":"'$ORG_ID'"}' | head -c 100
echo ""

rm -f $COOKIE_FILE
echo ""
echo "=== FEATURE TESTS COMPLETED ==="
