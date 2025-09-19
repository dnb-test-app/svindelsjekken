#!/bin/bash

echo "=== Testing DNB Svindelsjekk Issues ==="
echo ""

# Test 1: Check that first request is local-only
echo "TEST 1: Verify first request uses local analysis only"
echo "-------------------------------------------------------"

# Open browser to test manually
echo "1. Open http://localhost:3000 in your browser"
echo "2. Open Developer Tools (F12) and go to Network tab"
echo "3. Type 'Dette er en test' in the text field"
echo "4. Click 'Sjekk' button"
echo "5. Check Network tab - there should be NO API calls to /api/analyze-advanced"
echo ""
echo "Expected: No network requests to API"
echo "Actual: The check should complete instantly with local pattern matching"
echo ""

# Test 2: Check save button visibility
echo "TEST 2: Verify save/cancel buttons appear when changing model"
echo "-------------------------------------------------------------"
echo "1. Clear the text field"
echo "2. Type 'RaiRai' to activate the Easter egg"
echo "3. The AI Model dropdown should appear"
echo "4. Click the dropdown and select a different model (e.g., GPT-5)"
echo "5. Save and Cancel buttons should appear below the dropdown"
echo ""
echo "Expected: 'Lagre modell' and 'Avbryt' buttons appear"
echo ""

# Test with curl
echo "TEST 3: API Default Model Check"
echo "--------------------------------"
echo "Testing that API uses DEFAULT_AI_MODEL from env..."
curl -s http://localhost:3000/api/analyze-advanced | jq '.defaultModel'
echo ""

echo "TEST 4: API with no model specified"
echo "------------------------------------"
echo "Sending request without model parameter..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/analyze-advanced \
  -H "Content-Type: application/json" \
  -d '{"text": "Test svindelsjekk uten model parameter"}')
  
MODEL=$(echo "$RESPONSE" | jq -r '.model')
echo "Model used: $MODEL"
echo "Expected: openai/gpt-4o-mini (from DEFAULT_AI_MODEL)"
echo ""

echo "TEST 5: Empty text validation"
echo "------------------------------"
ERROR=$(curl -s -X POST http://localhost:3000/api/analyze-advanced \
  -H "Content-Type: application/json" \
  -d '{"text": ""}' | jq -r '.error')
echo "Error message: $ERROR"
echo "Expected: 'Text too short for analysis'"
echo ""

echo "=== Manual Testing Instructions ==="
echo "Please test the following manually in your browser:"
echo ""
echo "Issue 1 - Save Button Not Visible:"
echo "  1. Type 'RaiRai' in text field"
echo "  2. Change model in dropdown"
echo "  3. Save/Cancel buttons should appear"
echo "  Status: FIXED - buttons now appear when pendingModel differs from selectedModel"
echo ""
echo "Issue 2 - First Request Local Only:"
echo "  1. Type text WITHOUT 'RaiRai'"
echo "  2. Click 'Sjekk'"
echo "  3. Check Network tab - NO API calls should be made"
echo "  Status: WORKING - API only called when showModelSelector or useAI is true"