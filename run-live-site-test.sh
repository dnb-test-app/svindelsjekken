#!/bin/bash

echo "🚀 Running DNB Svindelsjekk Live Site Tests"
echo "Target: https://svindelsjekken.0scar.no"
echo "Date: $(date)"
echo ""

# Create test results directory
mkdir -p test-results

# Run the specific live site test with live config
npx playwright test tests/e2e/live-site-test.spec.ts --config=playwright-live.config.ts --headed --project=chromium

echo ""
echo "📊 Test Results Summary:"
echo "Check the test-results/ directory for:"
echo "  - Screenshots of each test scenario"
echo "  - Detailed test report (live-site-report-*.md)"
echo ""
echo "🔍 Key things to verify:"
echo "  1. Web search results displayed for URLs"
echo "  2. Additional context field visible"
echo "  3. ':online' suffix functionality"
echo "  4. Correct categorization (marketing vs fraud)"
echo "  5. Image upload functionality"
echo "  6. No JavaScript console errors"
echo ""
echo "✅ Test completed!"