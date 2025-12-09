#!/bin/bash

# Automated Integration Tests for Event Planner
# Tests all CRUD operations via API calls using curl

BASE_URL="http://localhost:3001"
PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Test results storage
CREATED_EVENT_IDS=()
CREATED_SPEAKER_IDS=()
CREATED_SPONSOR_IDS=()

# Helper functions
log() {
    echo -e "${2}${1}${NC}"
}

test_name() {
    echo -e "\n${BLUE}🧪 Testing: ${1}${NC}"
}

pass() {
    echo -e "${GREEN}✅ PASSED: ${1}${NC}"
    ((PASSED++))
}

fail() {
    echo -e "${RED}❌ FAILED: ${1}${NC}"
    echo -e "${RED}   Error: ${2}${NC}"
    ((FAILED++))
}

# Get future date (30 days from now)
get_future_date() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        date -u -v+${1}d +"%Y-%m-%dT%H:%M:%S.000Z"
    else
        # Linux
        date -u -d "+${1} days" +"%Y-%m-%dT%H:%M:%S.000Z"
    fi
}

# Test 1: Create Event #1
test_name "Create Event #1 - Tech Conference"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Tech Conference 2024 - Automated Test\",
    \"city\": \"Mumbai\",
    \"venue\": \"Convention Center\",
    \"startsAt\": \"$(get_future_date 30)\",
    \"endsAt\": \"$(get_future_date 31)\",
    \"price\": 2500,
    \"eventMode\": \"IN_PERSON\",
    \"description\": \"Annual tech conference for automated testing\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    EVENT_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    if [[ -n "$EVENT_ID" ]]; then
        CREATED_EVENT_IDS+=("$EVENT_ID")
        log "   Created event ID: $EVENT_ID" "$YELLOW"
        pass "Create Event #1"
    else
        fail "Create Event #1" "No event ID in response"
    fi
else
    fail "Create Event #1" "HTTP $HTTP_CODE - $BODY"
fi

# Test 2: Create Event #2
test_name "Create Event #2 - Virtual Workshop"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Virtual Workshop - Automated Test\",
    \"city\": \"Online\",
    \"venue\": \"Zoom\",
    \"startsAt\": \"$(get_future_date 15)\",
    \"endsAt\": \"$(get_future_date 15)\",
    \"price\": 500,
    \"eventMode\": \"VIRTUAL\",
    \"description\": \"Online learning workshop\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    EVENT_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    if [[ -n "$EVENT_ID" ]]; then
        CREATED_EVENT_IDS+=("$EVENT_ID")
        pass "Create Event #2"
    else
        fail "Create Event #2" "No event ID in response"
    fi
else
    fail "Create Event #2" "HTTP $HTTP_CODE"
fi

# Test 3: Create Event #3
test_name "Create Event #3 - Hybrid Meetup"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Hybrid Meetup - Automated Test\",
    \"city\": \"Delhi\",
    \"venue\": \"Tech Hub\",
    \"startsAt\": \"$(get_future_date 20)\",
    \"endsAt\": \"$(get_future_date 20)\",
    \"price\": 0,
    \"eventMode\": \"HYBRID\",
    \"description\": \"Free community meetup\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    pass "Create Event #3"
else
    fail "Create Event #3" "HTTP $HTTP_CODE"
fi

# Test 4: List All Events
test_name "List All Events"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/events?page=1&limit=20")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" == "200" ]]; then
    EVENT_COUNT=$(echo "$BODY" | grep -o '"id":[0-9]*' | wc -l | tr -d ' ')
    log "   Found $EVENT_COUNT events" "$YELLOW"
    pass "List All Events"
else
    fail "List All Events" "HTTP $HTTP_CODE"
fi

# Test 5: Read Event Details
if [[ ${#CREATED_EVENT_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    test_name "Read Event Details (ID: $EVENT_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/events/${EVENT_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        pass "Read Event Details"
    else
        fail "Read Event Details" "HTTP $HTTP_CODE"
    fi
fi

# Test 6: Update Event
if [[ ${#CREATED_EVENT_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    test_name "Update Event (ID: $EVENT_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/api/events/${EVENT_ID}" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Updated Tech Conference 2024\",
        \"city\": \"Mumbai\",
        \"venue\": \"Convention Center\",
        \"startsAt\": \"$(get_future_date 30)\",
        \"endsAt\": \"$(get_future_date 31)\",
        \"price\": 3000,
        \"eventMode\": \"IN_PERSON\",
        \"description\": \"Updated description\"
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        log "   Updated event $EVENT_ID" "$YELLOW"
        pass "Update Event"
    else
        fail "Update Event" "HTTP $HTTP_CODE"
    fi
fi

# Test 7: Create Speaker #1
if [[ ${#CREATED_EVENT_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    test_name "Create Speaker #1 (Event: $EVENT_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/events/${EVENT_ID}/speakers" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Dr. Sarah Johnson\",
        \"title\": \"Chief Technology Officer\",
        \"bio\": \"Expert in AI and Machine Learning\",
        \"company\": \"TechCorp\"
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
        SPEAKER_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        if [[ -n "$SPEAKER_ID" ]]; then
            CREATED_SPEAKER_IDS+=("$SPEAKER_ID")
            log "   Created speaker ID: $SPEAKER_ID" "$YELLOW"
        fi
        pass "Create Speaker #1"
    else
        fail "Create Speaker #1" "HTTP $HTTP_CODE - $BODY"
    fi
fi

# Test 8: Create Speaker #2
if [[ ${#CREATED_EVENT_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    test_name "Create Speaker #2 (Event: $EVENT_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/events/${EVENT_ID}/speakers" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"John Smith\",
        \"title\": \"Senior Software Engineer\",
        \"bio\": \"Full-stack developer\",
        \"company\": \"StartupXYZ\"
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
        pass "Create Speaker #2"
    else
        fail "Create Speaker #2" "HTTP $HTTP_CODE"
    fi
fi

# Test 9: List Speakers
if [[ ${#CREATED_EVENT_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    test_name "List Speakers (Event: $EVENT_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/events/${EVENT_ID}/speakers")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        SPEAKER_COUNT=$(echo "$BODY" | grep -o '"id":[0-9]*' | wc -l | tr -d ' ')
        log "   Found $SPEAKER_COUNT speakers" "$YELLOW"
        pass "List Speakers"
    else
        fail "List Speakers" "HTTP $HTTP_CODE"
    fi
fi

# Test 10: Update Speaker
if [[ ${#CREATED_SPEAKER_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    SPEAKER_ID=${CREATED_SPEAKER_IDS[0]}
    test_name "Update Speaker (ID: $SPEAKER_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/api/events/${EVENT_ID}/speakers/${SPEAKER_ID}" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Dr. Sarah Johnson\",
        \"title\": \"Chief Innovation Officer\",
        \"bio\": \"Expert in AI and Machine Learning\",
        \"company\": \"TechCorp\"
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        pass "Update Speaker"
    else
        fail "Update Speaker" "HTTP $HTTP_CODE"
    fi
fi

# Test 11: Create Sponsor #1
if [[ ${#CREATED_EVENT_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    test_name "Create Sponsor #1 (Event: $EVENT_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/events/${EVENT_ID}/sponsors" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"TechCorp Global\",
        \"tier\": \"PLATINUM\",
        \"website\": \"https://techcorp.example.com\",
        \"description\": \"Leading technology solutions\"
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
        SPONSOR_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        if [[ -n "$SPONSOR_ID" ]]; then
            CREATED_SPONSOR_IDS+=("$SPONSOR_ID")
            log "   Created sponsor ID: $SPONSOR_ID" "$YELLOW"
        fi
        pass "Create Sponsor #1"
    else
        fail "Create Sponsor #1" "HTTP $HTTP_CODE - $BODY"
    fi
fi

# Test 12: Create Sponsor #2
if [[ ${#CREATED_EVENT_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    test_name "Create Sponsor #2 (Event: $EVENT_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/events/${EVENT_ID}/sponsors" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"StartupHub\",
        \"tier\": \"GOLD\",
        \"website\": \"https://startuphub.example.com\",
        \"description\": \"Supporting startups\"
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
        pass "Create Sponsor #2"
    else
        fail "Create Sponsor #2" "HTTP $HTTP_CODE"
    fi
fi

# Test 13: List Sponsors
if [[ ${#CREATED_EVENT_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    test_name "List Sponsors (Event: $EVENT_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/events/${EVENT_ID}/sponsors")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        SPONSOR_COUNT=$(echo "$BODY" | grep -o '"id":[0-9]*' | wc -l | tr -d ' ')
        log "   Found $SPONSOR_COUNT sponsors" "$YELLOW"
        pass "List Sponsors"
    else
        fail "List Sponsors" "HTTP $HTTP_CODE"
    fi
fi

# Test 14: Update Sponsor
if [[ ${#CREATED_SPONSOR_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    SPONSOR_ID=${CREATED_SPONSOR_IDS[0]}
    test_name "Update Sponsor (ID: $SPONSOR_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/api/events/${EVENT_ID}/sponsors/${SPONSOR_ID}" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"TechCorp Global\",
        \"tier\": \"GOLD\",
        \"website\": \"https://techcorp.example.com\",
        \"description\": \"Leading technology solutions\"
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        pass "Update Sponsor"
    else
        fail "Update Sponsor" "HTTP $HTTP_CODE"
    fi
fi

# Test 15: Delete Speaker
if [[ ${#CREATED_SPEAKER_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    SPEAKER_ID=${CREATED_SPEAKER_IDS[0]}
    test_name "Delete Speaker (ID: $SPEAKER_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/api/events/${EVENT_ID}/speakers/${SPEAKER_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "204" ]]; then
        log "   Deleted speaker $SPEAKER_ID" "$YELLOW"
        pass "Delete Speaker"
    else
        fail "Delete Speaker" "HTTP $HTTP_CODE"
    fi
fi

# Test 16: Delete Sponsor
if [[ ${#CREATED_SPONSOR_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    SPONSOR_ID=${CREATED_SPONSOR_IDS[0]}
    test_name "Delete Sponsor (ID: $SPONSOR_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/api/events/${EVENT_ID}/sponsors/${SPONSOR_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "204" ]]; then
        log "   Deleted sponsor $SPONSOR_ID" "$YELLOW"
        pass "Delete Sponsor"
    else
        fail "Delete Sponsor" "HTTP $HTTP_CODE"
    fi
fi

# Test 17: Delete Event
if [[ ${#CREATED_EVENT_IDS[@]} -gt 0 ]]; then
    EVENT_ID=${CREATED_EVENT_IDS[0]}
    test_name "Delete Event (ID: $EVENT_ID)"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/api/events/${EVENT_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "204" ]]; then
        log "   Deleted event $EVENT_ID" "$YELLOW"
        pass "Delete Event"
    else
        fail "Delete Event" "HTTP $HTTP_CODE"
    fi
fi

# Print Summary
echo ""
echo "============================================================"
echo -e "\n${BOLD}📊 Test Results Summary:${NC}"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "📈 Total: $((PASSED + FAILED))"

if [[ $((PASSED + FAILED)) -gt 0 ]]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.2f\", ($PASSED / ($PASSED + $FAILED)) * 100}")
    echo -e "${YELLOW}🎯 Success Rate: ${SUCCESS_RATE}%${NC}"
fi

echo ""
echo "============================================================"

# Exit with appropriate code
if [[ $FAILED -gt 0 ]]; then
    exit 1
else
    exit 0
fi
