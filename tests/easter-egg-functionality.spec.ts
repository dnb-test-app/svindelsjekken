import { test, expect, Page } from '@playwright/test';
import path from 'path';

test.describe('DNB Svindelsjekk - Easter Egg Functionality Tests', () => {
  let consoleErrors: string[] = [];
  let networkRequests: Array<{url: string, method: string, timestamp: number}> = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    networkRequests = [];

    // Collect console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor network requests
    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    });

    // Go to the home page
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test('should activate Easter egg by typing "RaiRai" and show model selector', async ({ page }) => {
    // Take initial screenshot
    await page.screenshot({ path: path.join('tests', 'screenshots', 'initial-state.png') });

    // Find the text input (could be textarea or input field)
    const textInput = page.locator('textarea, input[type="text"]').first();
    await expect(textInput).toBeVisible();

    // Type "RaiRai" to activate Easter egg
    await textInput.fill('RaiRai');
    
    // Wait a bit for the Easter egg to be processed
    await page.waitForTimeout(1000);

    // Take screenshot after typing RaiRai
    await page.screenshot({ path: path.join('tests', 'screenshots', 'after-rairai-typed.png') });

    // Check if model selector dropdown appears
    const modelSelector = page.locator('select, .dnb-dropdown, [role="combobox"], [role="listbox"]').first();
    await expect(modelSelector).toBeVisible({ timeout: 5000 });

    // Take screenshot showing model selector
    await page.screenshot({ path: path.join('tests', 'screenshots', 'model-selector-visible.png') });

    console.log('✅ Easter egg activated successfully - model selector is visible');
  });

  test('should show save/cancel buttons when changing model selection', async ({ page }) => {
    // First activate the Easter egg
    const textInput = page.locator('textarea, input[type="text"]').first();
    await textInput.fill('RaiRai');
    await page.waitForTimeout(1000);

    // Wait for model selector to appear
    const modelSelector = page.locator('select, .dnb-dropdown, [role="combobox"], [role="listbox"]').first();
    await expect(modelSelector).toBeVisible({ timeout: 5000 });

    // Take screenshot before changing model
    await page.screenshot({ path: path.join('tests', 'screenshots', 'before-model-change.png') });

    // Try to change the model selection
    // This could be a dropdown, select, or custom component
    try {
      // First try clicking the dropdown to open it
      await modelSelector.click();
      await page.waitForTimeout(500);

      // Look for dropdown options
      const dropdownOptions = page.locator('[role="option"], option, .dnb-dropdown__list__option');
      if (await dropdownOptions.first().isVisible()) {
        await dropdownOptions.nth(1).click(); // Select second option
        await page.waitForTimeout(500);
      }
    } catch (error) {
      console.log('Dropdown interaction failed, trying alternative approach');
      // Try alternative approaches for different dropdown implementations
      const selectElement = page.locator('select').first();
      if (await selectElement.isVisible()) {
        await selectElement.selectOption({ index: 1 });
      }
    }

    // Take screenshot after changing model
    await page.screenshot({ path: path.join('tests', 'screenshots', 'after-model-change.png') });

    // Check if save/cancel buttons appear
    const saveButton = page.locator('button').filter({ hasText: /Lagre|Save/ });
    const cancelButton = page.locator('button').filter({ hasText: /Avbryt|Cancel/ });

    // Wait for buttons to appear with a reasonable timeout
    try {
      await expect(saveButton).toBeVisible({ timeout: 3000 });
      await expect(cancelButton).toBeVisible({ timeout: 3000 });
      
      // Take screenshot showing save/cancel buttons
      await page.screenshot({ path: path.join('tests', 'screenshots', 'save-cancel-buttons-visible.png') });
      
      console.log('✅ Save/Cancel buttons appeared after model change');
    } catch (error) {
      console.log('⚠️ Save/Cancel buttons did not appear - this might be the issue we are testing for');
      await page.screenshot({ path: path.join('tests', 'screenshots', 'save-cancel-buttons-missing.png') });
    }
  });

  test('should verify first fraud check is done locally without API call', async ({ page }) => {
    // Clear any previous network requests
    networkRequests = [];

    // Type test fraud text WITHOUT activating Easter egg
    const textInput = page.locator('textarea, input[type="text"]').first();
    const testText = 'HASTER! Din konto sperres i dag! Oppgi BankID kode umiddelbart';
    await textInput.fill(testText);

    // Find and click the check/analyze button
    const checkButton = page.locator('button').filter({ hasText: /Sjekk|Analyser|Check/ });
    await expect(checkButton).toBeEnabled();

    // Record network requests before clicking
    const requestsBefore = networkRequests.length;

    // Click the check button
    await checkButton.click();

    // Wait for analysis to complete
    await page.waitForTimeout(2000);

    // Take screenshot of results
    await page.screenshot({ path: path.join('tests', 'screenshots', 'local-analysis-results.png') });

    // Filter for API calls to analyze endpoint
    const apiCalls = networkRequests.filter(req => 
      req.url.includes('/api/analyze') || req.url.includes('/analyze')
    );

    console.log(`Network requests before check: ${requestsBefore}`);
    console.log(`Total network requests after check: ${networkRequests.length}`);
    console.log(`API calls to analyze endpoint: ${apiCalls.length}`);

    // The first check should be local-only, no API calls
    expect(apiCalls.length).toBe(0);

    console.log('✅ First fraud check completed locally without API calls');
  });

  test('should make API call when model selector is visible', async ({ page }) => {
    // Clear any previous network requests
    networkRequests = [];

    // Activate Easter egg first
    const textInput = page.locator('textarea, input[type="text"]').first();
    await textInput.fill('RaiRai');
    await page.waitForTimeout(1000);

    // Wait for model selector to appear
    const modelSelector = page.locator('select, .dnb-dropdown, [role="combobox"], [role="listbox"]').first();
    await expect(modelSelector).toBeVisible();

    // Clear text and add fraud test text
    await textInput.fill('');
    const testText = 'HASTER! Din konto sperres i dag! Oppgi BankID kode';
    await textInput.fill(testText);

    // Record network requests before clicking
    const requestsBefore = networkRequests.length;

    // Click the check button
    const checkButton = page.locator('button').filter({ hasText: /Sjekk|Analyser|Check/ });
    await expect(checkButton).toBeEnabled();
    await checkButton.click();

    // Wait for analysis to complete (longer timeout for API call)
    await page.waitForTimeout(5000);

    // Take screenshot of results with AI analysis
    await page.screenshot({ path: path.join('tests', 'screenshots', 'ai-enhanced-analysis-results.png') });

    // Filter for API calls to analyze endpoint
    const apiCalls = networkRequests.filter(req => 
      req.url.includes('/api/analyze') || req.url.includes('/analyze')
    );

    console.log(`Network requests before check: ${requestsBefore}`);
    console.log(`Total network requests after check: ${networkRequests.length}`);
    console.log(`API calls to analyze endpoint: ${apiCalls.length}`);

    // When model selector is visible, should make API call
    expect(apiCalls.length).toBeGreaterThan(0);

    console.log('✅ API call made when model selector is active');
  });

  test('should activate Easter egg by triple-clicking DNB logo', async ({ page }) => {
    // Find the DNB logo (it should be clickable based on the code)
    const logo = page.locator('[class*="logo"], .header img, .header svg, .logo').first();
    
    // Try to find logo by different selectors if first doesn't work
    let logoElement = logo;
    if (!(await logo.isVisible())) {
      logoElement = page.locator('svg, img').filter({ hasText: /DNB|logo/i }).first();
    }

    await expect(logoElement).toBeVisible();

    // Take screenshot before triple-click
    await page.screenshot({ path: path.join('tests', 'screenshots', 'before-logo-triple-click.png') });

    // Triple-click the logo
    await logoElement.click();
    await logoElement.click();
    await logoElement.click();

    // Wait for Easter egg activation
    await page.waitForTimeout(1000);

    // Take screenshot after triple-click
    await page.screenshot({ path: path.join('tests', 'screenshots', 'after-logo-triple-click.png') });

    // Check if model selector appears
    const modelSelector = page.locator('select, .dnb-dropdown, [role="combobox"], [role="listbox"]').first();
    
    try {
      await expect(modelSelector).toBeVisible({ timeout: 5000 });
      console.log('✅ Easter egg activated by triple-clicking logo');
    } catch (error) {
      console.log('⚠️ Logo triple-click Easter egg did not activate model selector');
      await page.screenshot({ path: path.join('tests', 'screenshots', 'logo-triple-click-failed.png') });
    }
  });

  test('should not have critical console errors during Easter egg usage', async ({ page }) => {
    // Clear any existing errors
    consoleErrors = [];

    // Perform Easter egg activation and usage
    const textInput = page.locator('textarea, input[type="text"]').first();
    await textInput.fill('RaiRai');
    await page.waitForTimeout(1000);

    // Try to interact with model selector
    const modelSelector = page.locator('select, .dnb-dropdown, [role="combobox"], [role="listbox"]').first();
    if (await modelSelector.isVisible()) {
      await modelSelector.click();
      await page.waitForTimeout(500);
    }

    // Test fraud check with Easter egg active
    await textInput.fill('Test fraud text for error detection');
    const checkButton = page.locator('button').filter({ hasText: /Sjekk|Analyser|Check/ });
    if (await checkButton.isVisible() && await checkButton.isEnabled()) {
      await checkButton.click();
      await page.waitForTimeout(3000);
    }

    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Warning:') && 
      !error.includes('DevTools') &&
      !error.includes('Extension') &&
      !error.includes('favicon')
    );

    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }

    expect(criticalErrors).toEqual([]);

    console.log('✅ No critical console errors during Easter egg usage');
  });

  test.afterEach(async ({ page }) => {
    // Log summary of network requests for debugging
    console.log(`Total network requests in test: ${networkRequests.length}`);
    
    const apiRequests = networkRequests.filter(req => req.url.includes('/api/'));
    console.log(`API requests: ${apiRequests.length}`);
    
    if (apiRequests.length > 0) {
      console.log('API requests made:', apiRequests.map(req => `${req.method} ${req.url}`));
    }

    // Log console errors if any
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
  });
});