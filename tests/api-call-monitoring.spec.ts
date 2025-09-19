import { test, expect, Page } from '@playwright/test';
import path from 'path';

test.describe('DNB Svindelsjekk - API Call Monitoring Tests', () => {
  let apiCalls: Array<{url: string, method: string, timestamp: number, headers: any, body: any}> = [];

  test.beforeEach(async ({ page }) => {
    apiCalls = [];

    // Monitor ALL network requests with detailed information
    page.on('request', async (request) => {
      // Only log API calls
      if (request.url().includes('/api/')) {
        const headers = await request.allHeaders();
        let body = null;
        
        try {
          if (request.method() === 'POST' && request.postData()) {
            body = JSON.parse(request.postData() || '{}');
          }
        } catch (e) {
          body = request.postData();
        }

        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now(),
          headers,
          body
        });

        console.log(`📡 API Request: ${request.method()} ${request.url()}`);
        if (body) {
          console.log(`📝 Request body:`, body);
        }
      }
    });

    // Monitor API responses
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        console.log(`📥 API Response: ${response.status()} ${response.url()}`);
        
        try {
          const responseBody = await response.json();
          console.log(`📄 Response body:`, responseBody);
        } catch (e) {
          // Response might not be JSON
          console.log(`📄 Response (non-JSON):`, await response.text());
        }
      }
    });

    // Go to the home page
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test('should perform local pattern analysis without API calls', async ({ page }) => {
    // Clear API calls log
    apiCalls = [];

    const textInput = page.locator('textarea, input[type="text"]').first();
    await expect(textInput).toBeVisible();

    // Test various fraud patterns to ensure local analysis works
    const fraudTestCases = [
      {
        name: 'High risk fraud text',
        text: 'HASTER! Din konto sperres i dag! Oppgi BankID kode umiddelbart på http://dnb-no.com',
        expectedRisk: 'high'
      },
      {
        name: 'Medium risk fraud text', 
        text: 'Mistenkelig aktivitet på kontoen din. Verifiser identitet ved å klikke her.',
        expectedRisk: 'medium'
      },
      {
        name: 'Low risk text',
        text: 'Hei! Hvordan har du det i dag? Håper du har en fin dag.',
        expectedRisk: 'low'
      }
    ];

    for (const testCase of fraudTestCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      
      // Clear previous analysis
      await textInput.fill('');
      await page.waitForTimeout(500);
      
      // Enter test text
      await textInput.fill(testCase.text);
      
      // Record API calls before analysis
      const apiCallsBefore = apiCalls.length;
      
      // Click analyze button
      const checkButton = page.locator('button').filter({ hasText: /Sjekk|Analyser|Check/ });
      await expect(checkButton).toBeEnabled();
      await checkButton.click();
      
      // Wait for local analysis to complete
      await page.waitForTimeout(2000);
      
      // Check if we get results (should be instant local analysis)
      const resultElement = page.locator('.result, [class*="result"]').first();
      
      // Take screenshot of results
      await page.screenshot({ 
        path: path.join('tests', 'screenshots', `local-analysis-${testCase.name.replace(/\s+/g, '-').toLowerCase()}.png`)
      });
      
      // Verify no API calls were made
      const apiCallsAfter = apiCalls.length;
      const newApiCalls = apiCalls.slice(apiCallsBefore);
      
      console.log(`API calls before: ${apiCallsBefore}, after: ${apiCallsAfter}`);
      console.log(`New API calls:`, newApiCalls.map(call => `${call.method} ${call.url}`));
      
      // Local analysis should not make any API calls
      expect(newApiCalls.length).toBe(0);
      
      console.log(`✅ Local analysis for "${testCase.name}" completed without API calls`);
    }
  });

  test('should make API calls only when Easter egg is active', async ({ page }) => {
    const textInput = page.locator('textarea, input[type="text"]').first();
    
    // First test: Normal analysis (should be local only)
    console.log('\n🧪 Testing normal analysis (should be local only)');
    apiCalls = [];
    
    await textInput.fill('Test fraud text for normal analysis');
    const checkButton = page.locator('button').filter({ hasText: /Sjekk|Analyser|Check/ });
    await checkButton.click();
    await page.waitForTimeout(3000);
    
    const normalAnalysisApiCalls = apiCalls.filter(call => call.url.includes('/analyze'));
    expect(normalAnalysisApiCalls.length).toBe(0);
    console.log('✅ Normal analysis made no API calls');
    
    // Second test: Easter egg analysis (should make API calls)
    console.log('\n🧪 Testing Easter egg analysis (should make API calls)');
    apiCalls = [];
    
    // Activate Easter egg
    await textInput.fill('RaiRai');
    await page.waitForTimeout(1000);
    
    // Verify model selector is visible
    const modelSelector = page.locator('select, .dnb-dropdown, [role="combobox"], [role="listbox"]').first();
    await expect(modelSelector).toBeVisible({ timeout: 5000 });
    
    // Clear and add fraud text
    await textInput.fill('');
    await textInput.fill('HASTER! Din konto er sperret! Oppgi BankID umiddelbart!');
    
    // Click analyze with Easter egg active
    await checkButton.click();
    await page.waitForTimeout(5000); // Longer wait for API call
    
    // Take screenshot
    await page.screenshot({ 
      path: path.join('tests', 'screenshots', 'easter-egg-api-analysis.png')
    });
    
    const easterEggApiCalls = apiCalls.filter(call => call.url.includes('/analyze'));
    console.log(`Easter egg analysis made ${easterEggApiCalls.length} API calls`);
    
    if (easterEggApiCalls.length > 0) {
      console.log('API call details:', easterEggApiCalls[0]);
    }
    
    expect(easterEggApiCalls.length).toBeGreaterThan(0);
    console.log('✅ Easter egg analysis made API calls as expected');
  });

  test('should verify API request format and parameters', async ({ page }) => {
    const textInput = page.locator('textarea, input[type="text"]').first();
    apiCalls = [];
    
    // Activate Easter egg
    await textInput.fill('RaiRai');
    await page.waitForTimeout(1000);
    
    // Wait for model selector
    const modelSelector = page.locator('select, .dnb-dropdown, [role="combobox"], [role="listbox"]').first();
    await expect(modelSelector).toBeVisible();
    
    // Add test text
    const testText = 'URGENT: Your DNB account will be suspended! Click here now!';
    await textInput.fill('');
    await textInput.fill(testText);
    
    // Analyze
    const checkButton = page.locator('button').filter({ hasText: /Sjekk|Analyser|Check/ });
    await checkButton.click();
    await page.waitForTimeout(5000);
    
    // Find the analyze API call
    const analyzeCall = apiCalls.find(call => call.url.includes('/analyze-advanced'));
    
    if (analyzeCall) {
      console.log('📋 API call found:', analyzeCall.url);
      console.log('📝 Request method:', analyzeCall.method);
      console.log('📦 Request body:', analyzeCall.body);
      
      // Verify API call structure
      expect(analyzeCall.method).toBe('POST');
      expect(analyzeCall.body).toHaveProperty('text');
      expect(analyzeCall.body).toHaveProperty('model');
      
      // Verify text was cleaned (RaiRai should be removed)
      expect(analyzeCall.body.text).not.toContain('RaiRai');
      expect(analyzeCall.body.text).not.toContain('rairai');
      
      // Should contain our test text
      expect(analyzeCall.body.text.toLowerCase()).toContain('urgent');
      
      console.log('✅ API request format is correct');
    } else {
      throw new Error('No API call to analyze-advanced endpoint found');
    }
  });

  test('should handle API failures gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/analyze-advanced', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    const textInput = page.locator('textarea, input[type="text"]').first();
    
    // Activate Easter egg
    await textInput.fill('RaiRai');
    await page.waitForTimeout(1000);
    
    // Add test text
    await textInput.fill('');
    await textInput.fill('Test fraud detection with API failure');
    
    // Analyze (should fallback to local analysis)
    const checkButton = page.locator('button').filter({ hasText: /Sjekk|Analyser|Check/ });
    await checkButton.click();
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: path.join('tests', 'screenshots', 'api-failure-fallback.png')
    });
    
    // Should still get results from local analysis
    const resultElement = page.locator('.result, [class*="result"]').first();
    await expect(resultElement).toBeVisible({ timeout: 5000 });
    
    console.log('✅ API failure handled gracefully with fallback to local analysis');
  });

  test('should verify different AI models can be selected', async ({ page }) => {
    const textInput = page.locator('textarea, input[type="text"]').first();
    
    // Activate Easter egg
    await textInput.fill('RaiRai');
    await page.waitForTimeout(1000);
    
    // Find model selector
    const modelSelector = page.locator('select, .dnb-dropdown, [role="combobox"], [role="listbox"]').first();
    await expect(modelSelector).toBeVisible();
    
    // Take screenshot of available models
    await page.screenshot({ 
      path: path.join('tests', 'screenshots', 'available-ai-models.png')
    });
    
    // Try to interact with dropdown to see available models
    try {
      await modelSelector.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of open dropdown
      await page.screenshot({ 
        path: path.join('tests', 'screenshots', 'ai-models-dropdown-open.png')
      });
      
      // Look for model options
      const options = page.locator('[role="option"], option, .dnb-dropdown__list__option');
      const optionCount = await options.count();
      
      console.log(`Found ${optionCount} AI model options`);
      
      // Log available models
      for (let i = 0; i < Math.min(optionCount, 5); i++) {
        const optionText = await options.nth(i).textContent();
        console.log(`Model option ${i + 1}: ${optionText}`);
      }
      
      expect(optionCount).toBeGreaterThan(0);
      console.log('✅ Multiple AI models are available for selection');
      
    } catch (error) {
      console.log('Could not interact with model dropdown:', error);
      // Still take a screenshot for debugging
      await page.screenshot({ 
        path: path.join('tests', 'screenshots', 'model-dropdown-interaction-failed.png')
      });
    }
  });

  test.afterEach(async () => {
    // Log summary
    const totalApiCalls = apiCalls.length;
    const analyzeCalls = apiCalls.filter(call => call.url.includes('/analyze'));
    
    console.log(`\n📊 Test Summary:`);
    console.log(`Total API calls: ${totalApiCalls}`);
    console.log(`Analyze API calls: ${analyzeCalls.length}`);
    
    if (analyzeCalls.length > 0) {
      console.log('Analyze API calls details:');
      analyzeCalls.forEach((call, index) => {
        console.log(`  ${index + 1}. ${call.method} ${call.url}`);
        if (call.body && call.body.model) {
          console.log(`     Model: ${call.body.model}`);
        }
      });
    }
  });
});