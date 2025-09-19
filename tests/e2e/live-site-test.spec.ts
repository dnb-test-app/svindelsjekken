import { test, expect, Page } from '@playwright/test';

// Test the live DNB Svindelsjekk site
const LIVE_SITE_URL = 'https://svindelsjekken.0scar.no';

test.describe('DNB Svindelsjekk Live Site Testing', () => {
  let consoleErrors: string[] = [];
  let networkErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Monitor console errors
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`Console Error: ${msg.text()}`);
      }
    });

    // Monitor network errors
    networkErrors = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`Network Error: ${response.status()} ${response.url()}`);
      }
    });

    page.on('requestfailed', request => {
      networkErrors.push(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('Test 1: Text analysis with suspicious URL (modehusoslo.com)', async ({ page }) => {
    console.log('🔍 Testing suspicious URL analysis...');

    // Navigate to live site
    await page.goto(LIVE_SITE_URL);
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/live-site-initial.png',
      fullPage: true
    });

    // Find the text input field
    const textInput = page.locator('textarea, input[type="text"]').first();
    await expect(textInput).toBeVisible({ timeout: 10000 });

    // Clear any existing text and enter the suspicious text
    await textInput.clear();
    await textInput.fill('Check out this amazing deal at modehusoslo.com');

    // Take screenshot after entering text
    await page.screenshot({
      path: 'test-results/live-site-suspicious-text-entered.png',
      fullPage: true
    });

    // Find and click the analyze button
    const analyzeButton = page.locator('button').filter({ hasText: /analys|check|submit/i }).first();
    await expect(analyzeButton).toBeVisible();

    await analyzeButton.click();

    // Wait for analysis results
    await page.waitForTimeout(5000); // Give time for analysis to complete

    // Check if additional context field is visible (for URLs)
    const contextField = page.locator('text=/context|additional|web search|online/i').first();
    const hasContextField = await contextField.isVisible().catch(() => false);
    console.log(`📋 Additional context field visible: ${hasContextField}`);

    // Look for web search results
    const webSearchResults = page.locator('text=/search result|web result|online/i').first();
    const hasWebSearchResults = await webSearchResults.isVisible().catch(() => false);
    console.log(`🌐 Web search results displayed: ${hasWebSearchResults}`);

    // Check for ":online" suffix functionality
    const onlineSuffix = page.locator('text=/:online|online analysis/i').first();
    const hasOnlineSuffix = await onlineSuffix.isVisible().catch(() => false);
    console.log(`🔗 Online suffix functionality: ${hasOnlineSuffix}`);

    // Take screenshot of results
    await page.screenshot({
      path: 'test-results/live-site-suspicious-results.png',
      fullPage: true
    });

    // Log the analysis results
    const resultsContent = await page.locator('body').textContent();
    console.log('📊 Analysis completed for suspicious URL');

    // Check for fraud/scam categorization
    const isFraudDetected = resultsContent?.toLowerCase().includes('fraud') ||
                           resultsContent?.toLowerCase().includes('scam') ||
                           resultsContent?.toLowerCase().includes('suspicious');
    console.log(`⚠️ Fraud/suspicious categorization: ${isFraudDetected}`);
  });

  test('Test 2: Text analysis with legitimate company (Power.no)', async ({ page }) => {
    console.log('🔍 Testing legitimate company analysis...');

    await page.goto(LIVE_SITE_URL);
    await page.waitForLoadState('networkidle');

    // Find the text input field
    const textInput = page.locator('textarea, input[type="text"]').first();
    await expect(textInput).toBeVisible({ timeout: 10000 });

    // Clear and enter legitimate company text
    await textInput.clear();
    await textInput.fill('Power.no has a great offer on air fryers');

    // Take screenshot after entering text
    await page.screenshot({
      path: 'test-results/live-site-legitimate-text-entered.png',
      fullPage: true
    });

    // Find and click analyze button
    const analyzeButton = page.locator('button').filter({ hasText: /analys|check|submit/i }).first();
    await analyzeButton.click();

    // Wait for analysis
    await page.waitForTimeout(5000);

    // Take screenshot of results
    await page.screenshot({
      path: 'test-results/live-site-legitimate-results.png',
      fullPage: true
    });

    // Check categorization - should be marketing, not suspicious
    const resultsContent = await page.locator('body').textContent();
    const isMarketingCategory = resultsContent?.toLowerCase().includes('marketing') ||
                               resultsContent?.toLowerCase().includes('advertisement') ||
                               resultsContent?.toLowerCase().includes('promotion');
    const isSuspicious = resultsContent?.toLowerCase().includes('fraud') ||
                        resultsContent?.toLowerCase().includes('scam') ||
                        resultsContent?.toLowerCase().includes('suspicious');

    console.log(`📈 Marketing categorization: ${isMarketingCategory}`);
    console.log(`⚠️ Incorrectly marked as suspicious: ${isSuspicious}`);

    // This should be categorized as marketing, not fraud
    expect(isSuspicious).toBe(false);
  });

  test('Test 3: Image upload functionality', async ({ page }) => {
    console.log('🔍 Testing image upload functionality...');

    await page.goto(LIVE_SITE_URL);
    await page.waitForLoadState('networkidle');

    // Look for file input or upload button
    const fileInput = page.locator('input[type="file"]').first();
    const uploadButton = page.locator('button').filter({ hasText: /upload|file|image/i }).first();

    const hasFileInput = await fileInput.isVisible().catch(() => false);
    const hasUploadButton = await uploadButton.isVisible().catch(() => false);

    console.log(`📁 File input visible: ${hasFileInput}`);
    console.log(`📤 Upload button visible: ${hasUploadButton}`);

    if (hasFileInput) {
      try {
        // Create a simple test image file
        const testImagePath = 'test-results/test-image.png';

        // Try to upload the test image
        await fileInput.setInputFiles(testImagePath);

        // Wait for upload processing
        await page.waitForTimeout(3000);

        // Take screenshot after upload attempt
        await page.screenshot({
          path: 'test-results/live-site-image-upload-attempt.png',
          fullPage: true
        });

        console.log('✅ Image upload attempted successfully');
      } catch (error) {
        console.log(`❌ Image upload error: ${error}`);

        // Take screenshot of error state
        await page.screenshot({
          path: 'test-results/live-site-image-upload-error.png',
          fullPage: true
        });
      }
    } else {
      console.log('❌ No file input found for image upload');

      // Take screenshot showing no upload functionality
      await page.screenshot({
        path: 'test-results/live-site-no-upload.png',
        fullPage: true
      });
    }
  });

  test('Test 4: Overall functionality and error monitoring', async ({ page }) => {
    console.log('🔍 Testing overall functionality and monitoring errors...');

    await page.goto(LIVE_SITE_URL);
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/live-site-full-page.png',
      fullPage: true
    });

    // Check for basic page elements
    const hasTextInput = await page.locator('textarea, input[type="text"]').first().isVisible().catch(() => false);
    const hasAnalyzeButton = await page.locator('button').filter({ hasText: /analys|check|submit/i }).first().isVisible().catch(() => false);
    const hasLogo = await page.locator('img').first().isVisible().catch(() => false);

    console.log(`📝 Text input present: ${hasTextInput}`);
    console.log(`🔘 Analyze button present: ${hasAnalyzeButton}`);
    console.log(`🏛️ Logo/branding present: ${hasLogo}`);

    // Test a quick analysis to check functionality
    if (hasTextInput && hasAnalyzeButton) {
      const textInput = page.locator('textarea, input[type="text"]').first();
      await textInput.fill('Test message to check functionality');

      const analyzeButton = page.locator('button').filter({ hasText: /analys|check|submit/i }).first();
      await analyzeButton.click();

      await page.waitForTimeout(3000);

      // Take screenshot of quick test results
      await page.screenshot({
        path: 'test-results/live-site-functionality-test.png',
        fullPage: true
      });
    }

    // Report any errors found
    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors Found:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No console errors detected');
    }

    if (networkErrors.length > 0) {
      console.log('❌ Network Errors Found:');
      networkErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No network errors detected');
    }
  });

  test.afterEach(async ({ page }) => {
    // Generate summary report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportContent = `
# DNB Svindelsjekk Live Site Test Report
Generated: ${new Date().toISOString()}
Test Site: ${LIVE_SITE_URL}

## Console Errors (${consoleErrors.length})
${consoleErrors.map(error => `- ${error}`).join('\n')}

## Network Errors (${networkErrors.length})
${networkErrors.map(error => `- ${error}`).join('\n')}

## Test Status
- Console Errors: ${consoleErrors.length === 0 ? '✅ PASS' : '❌ FAIL'}
- Network Errors: ${networkErrors.length === 0 ? '✅ PASS' : '❌ FAIL'}

## Screenshots Captured
- live-site-initial.png
- live-site-suspicious-text-entered.png
- live-site-suspicious-results.png
- live-site-legitimate-text-entered.png
- live-site-legitimate-results.png
- live-site-image-upload-attempt.png
- live-site-full-page.png
- live-site-functionality-test.png
`;

    // Write report to file
    const fs = require('fs');
    fs.writeFileSync(`test-results/live-site-report-${timestamp}.md`, reportContent);
  });
});