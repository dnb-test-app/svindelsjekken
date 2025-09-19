#!/bin/bash

echo "=== Testing Always-On External LLM API ==="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "TEST 1: API should be called for ANY valid text (without RaiRai)"
echo "================================================================"
echo "Sending request with regular text (no Easter egg)..."

RESPONSE=$(curl -s -X POST http://localhost:3000/api/analyze-advanced \
  -H "Content-Type: application/json" \
  -d '{"text": "Dette er en vanlig test tekst uten svindel"}' \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ PASS: API was called successfully for regular text${NC}"
  echo "Response model: $(echo "$BODY" | jq -r '.model')"
else
  echo -e "${RED}❌ FAIL: API returned status $HTTP_STATUS${NC}"
fi

echo ""
echo "TEST 2: API should NOT be called for empty text"
echo "================================================"

RESPONSE2=$(curl -s -X POST http://localhost:3000/api/analyze-advanced \
  -H "Content-Type: application/json" \
  -d '{"text": ""}' \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY2=$(echo "$RESPONSE2" | sed '$d')

if [ "$HTTP_STATUS2" = "400" ]; then
  echo -e "${GREEN}✅ PASS: API correctly rejected empty text${NC}"
  ERROR=$(echo "$BODY2" | jq -r '.error')
  echo "Error message: $ERROR"
else
  echo -e "${RED}❌ FAIL: API should have rejected empty text${NC}"
fi

echo ""
echo "TEST 3: API should NOT be called for text less than 5 characters"
echo "================================================================="

RESPONSE3=$(curl -s -X POST http://localhost:3000/api/analyze-advanced \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}' \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS3=$(echo "$RESPONSE3" | grep "HTTP_STATUS" | cut -d':' -f2)

if [ "$HTTP_STATUS3" = "400" ]; then
  echo -e "${GREEN}✅ PASS: API correctly rejected short text (< 5 chars)${NC}"
else
  echo -e "${RED}❌ FAIL: API should have rejected text shorter than 5 characters${NC}"
fi

echo ""
echo "TEST 4: Text with 'RaiRai' should have it removed before API call"
echo "=================================================================="

RESPONSE4=$(curl -s -X POST http://localhost:3000/api/analyze-advanced \
  -H "Content-Type: application/json" \
  -d '{"text": "RaiRai Dette er en test av svindelsjekken"}')

if echo "$RESPONSE4" | jq -e '.riskScore' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS: API processed text with RaiRai removed${NC}"
  echo "Risk score: $(echo "$RESPONSE4" | jq -r '.riskScore')"
else
  echo -e "${RED}❌ FAIL: API failed to process text with RaiRai${NC}"
fi

echo ""
echo "TEST 5: Verify 'RaiRai' alone doesn't trigger API (too short after removal)"
echo "==========================================================================="

RESPONSE5=$(curl -s -X POST http://localhost:3000/api/analyze-advanced \
  -H "Content-Type: application/json" \
  -d '{"text": "RaiRai"}' \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS5=$(echo "$RESPONSE5" | grep "HTTP_STATUS" | cut -d':' -f2)

if [ "$HTTP_STATUS5" = "400" ]; then
  echo -e "${GREEN}✅ PASS: 'RaiRai' alone correctly rejected (empty after cleaning)${NC}"
else
  echo -e "${RED}❌ FAIL: 'RaiRai' alone should be rejected after cleaning${NC}"
fi

echo ""
echo "=== MANUAL BROWSER TESTING INSTRUCTIONS ==="
echo ""
echo "Please test in your browser:"
echo "1. Open http://localhost:3000"
echo "2. Open Developer Tools → Network tab"
echo "3. Type ANY text (e.g., 'Test av svindelsjekk')"
echo "4. Click 'Sjekk'"
echo "5. ✅ You SHOULD see a POST request to /api/analyze-advanced"
echo ""
echo "6. Clear text and type 'RaiRai test'"
echo "7. Model selector should appear"
echo "8. Click 'Sjekk'"
echo "9. ✅ You SHOULD see a POST request to /api/analyze-advanced"
echo ""
echo "10. Clear text and type only 'test' (4 chars)"
echo "11. Click 'Sjekk' button should be disabled"
echo "12. ✅ NO API request should be made"
echo ""
echo "Summary:"
echo "- API is ALWAYS called for valid text (≥5 chars after cleaning)"
echo "- Easter egg ('RaiRai') ONLY controls model selector visibility"
echo "- Empty or too-short text is never sent to API"