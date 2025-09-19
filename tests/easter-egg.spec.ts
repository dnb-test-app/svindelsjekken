import { test, expect } from '@playwright/test';

test.describe('DNB Svindelsjekk Easter Egg Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should show model selector and save buttons when Easter egg is activated', async ({ page }) => {
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/1-initial-state.png', fullPage: true });

    // Find the textarea
    const textarea = page.locator('textarea');
    
    // Type "RaiRai" to activate Easter egg
    await textarea.fill('RaiRai');
    await page.waitForTimeout(500); // Give time for the Easter egg to activate
    
    // Take screenshot after typing RaiRai
    await page.screenshot({ path: 'screenshots/2-after-rairai.png', fullPage: true });
    
    // Check if model selector appears
    const modelSelector = page.locator('label:has-text("AI Model (Testing - Sept 2025)")');
    await expect(modelSelector).toBeVisible();
    
    // Find and click the dropdown
    const dropdown = page.locator('[role="combobox"]').first();
    await dropdown.click();
    await page.waitForTimeout(500);
    
    // Take screenshot with dropdown open
    await page.screenshot({ path: 'screenshots/3-dropdown-open.png', fullPage: true });
    
    // Select a different model (GPT-5)
    const option = page.locator('text=GPT-5 (Latest)');
    await option.click();
    await page.waitForTimeout(500);
    
    // Take screenshot after selection
    await page.screenshot({ path: 'screenshots/4-after-selection.png', fullPage: true });
    
    // Check if save and cancel buttons appear
    const saveButton = page.locator('button:has-text("Lagre modell")');
    const cancelButton = page.locator('button:has-text("Avbryt")');
    
    await expect(saveButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
    
    console.log('✅ Save and Cancel buttons are visible after model change');
  });

  test('should make local-only check for first request', async ({ page }) => {
    // Set up network monitoring
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/analyze-advanced')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });

    // Type some text without activating Easter egg
    const textarea = page.locator('textarea');
    await textarea.fill('Dette er en test av svindelsjekken for å se om den fungerer');
    
    // Click check button
    const checkButton = page.locator('button:has-text("Sjekk")');
    await checkButton.click();
    
    // Wait for analysis to complete
    await page.waitForTimeout(2000);
    
    // Take screenshot of result
    await page.screenshot({ path: 'screenshots/5-local-check-result.png', fullPage: true });
    
    // Verify no API calls were made
    expect(apiCalls.length).toBe(0);
    console.log('✅ First check was local-only, no API calls made');
    
    // Now activate Easter egg and check again
    await textarea.fill('RaiRai Dette er en test av svindelsjekken');
    await page.waitForTimeout(500);
    
    // Check button should be enabled again
    await checkButton.click();
    
    // Wait for API call
    await page.waitForTimeout(3000);
    
    // Take screenshot of AI-enhanced result
    await page.screenshot({ path: 'screenshots/6-ai-enhanced-result.png', fullPage: true });
    
    // Now there should be API calls
    expect(apiCalls.length).toBeGreaterThan(0);
    console.log(`✅ With Easter egg active, ${apiCalls.length} API call(s) made`);
  });

  test('should test logo triple-click Easter egg activation', async ({ page }) => {
    // Find the logo
    const logo = page.locator('[data-testid="dnb-logo"], .dnb-logo, svg').first();
    
    // Triple-click the logo
    await logo.click({ clickCount: 3, delay: 100 });
    await page.waitForTimeout(500);
    
    // Check if model selector appears
    const modelSelector = page.locator('label:has-text("AI Model (Testing - Sept 2025)")');
    await expect(modelSelector).toBeVisible();
    
    console.log('✅ Logo triple-click Easter egg works');
  });
});