#!/bin/bash
BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/cookies.txt"

# Login
curl -s -c $COOKIE_FILE -b $COOKIE_FILE -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"gio","password":"admin123"}' > /dev/null

ORG_ID="demo-org"
USER_ID="user-gio"

echo "=== TESTING CRM FEATURES (CORRECTED) ==="
echo ""

# Test 1: Move deal with correct param
echo "1. Moving deal between pipeline stages"
DEAL_ID=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/deals?organizationId=$ORG_ID" | grep -o '"id":"deal-[0-9]"' | head -1 | cut -d'"' -f4)
echo "   Using deal: $DEAL_ID"
curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/deals/$DEAL_ID/move" \
  -H "Content-Type: application/json" \
  -d '{"toStageId":"stage-primera-reunion"}' | head -c 150
echo ""
echo ""

# Test 2: Add tag with correct params
echo "2. Adding tag to contact"
CONTACT_ID=$(curl -s -b $COOKIE_FILE "$BASE_URL/api/contacts?organizationId=$ORG_ID" | grep -o '"id":"contact-[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Using contact: $CONTACT_ID"
curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/contacts/$CONTACT_ID/tags" \
  -H "Content-Type: application/json" \
  -d '{"tagName":"VIP","tagColor":"#FFD700","organizationId":"'$ORG_ID'"}' | head -c 150
echo ""
echo ""

# Test 3: Update user settings with correct body
echo "3. Updating user settings"
curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/api/users/$USER_ID/settings" \
  -H "Content-Type: application/json" \
  -d '{"emailNotifications":true,"pushNotifications":true,"taskReminders":true,"goalProgressAlerts":true,"newLeadsNotifications":true,"theme":"dark"}' | head -c 150
echo ""
echo ""

# Test 4: Get user settings
echo "4. Getting user settings"
curl -s -b $COOKIE_FILE "$BASE_URL/api/users/$USER_ID/settings" | head -c 200
echo ""
echo ""

# Test 5: Get notifications with correct params
echo "5. Getting notifications"
curl -s -b $COOKIE_FILE "$BASE_URL/api/notifications?userId=$USER_ID&organizationId=$ORG_ID" | head -c 200
echo ""
echo ""

# Test 6: Create a notification
echo "6. Creating a notification"
curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/notifications" \
  -H "Content-Type: application/json" \
  -d '{"userId":"'$USER_ID'","organizationId":"'$ORG_ID'","type":"info","title":"Test Notification","message":"This is a test notification from API"}' | head -c 150
echo ""
echo ""

# Test 7: Get notifications again
echo "7. Getting notifications after creation"
curl -s -b $COOKIE_FILE "$BASE_URL/api/notifications?userId=$USER_ID&organizationId=$ORG_ID" | head -c 250
echo ""
echo ""

# Test 8: Get managers
echo "8. Getting managers (need to create manager first)"
# First check if there's a manager user
curl -s -b $COOKIE_FILE "$BASE_URL/api/users?organizationId=$ORG_ID" | head -c 300
echo ""
echo ""

# Test 9: Create pipeline stage
echo "9. Creating pipeline stage"
curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/pipeline-stages" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Stage API","color":"#FF5733","order":10,"organizationId":"'$ORG_ID'"}' | head -c 150
echo ""
echo ""

# Test 10: Get all stages
echo "10. Getting all pipeline stages"
curl -s -b $COOKIE_FILE "$BASE_URL/api/pipeline-stages?organizationId=$ORG_ID" | head -c 300
echo ""

rm -f $COOKIE_FILE
echo ""
echo "=== TESTS COMPLETED ==="
