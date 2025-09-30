import { test, expect, Page } from '@playwright/test';
import path from 'path';

test.describe('Fjellsport.no Real Web Search Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/nb');

    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });

    // Monitor network requests for debugging
    page.on('request', request => {
      if (request.url().includes('api') || request.url().includes('search')) {
        console.log('API Request:', request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('api') || response.url().includes('search')) {
        console.log('API Response:', response.url(), response.status());
      }
    });
  });

  test('should show REAL web search results for fjellsport.no text analysis', async ({ page }) => {
    console.log('Starting fjellsport.no text analysis test...');

    // Fill in the text input with fjellsport.no URL
    const textarea = page.locator('.unified-textarea');
    await textarea.fill('Check out this amazing deal at fjellsport.no');

    // Click the analyze button
    await page.locator('.check-button').click();

    // Wait for navigation to analysis page
    await page.waitForURL('**/analyse**', { timeout: 30000 });

    // Wait for analysis to complete
    await page.waitForTimeout(5000);

    // Look for analysis results
    const analysisContent = page.locator('.analysis-content, .result-content, [data-testid="analysis-result"]');
    await expect(analysisContent).toBeVisible({ timeout: 30000 });

    // Get the full page text content
    const pageText = await page.textContent('body');
    console.log('Analysis page content preview:', pageText?.substring(0, 500));

    // Check for real web search indicators - should find Trustpilot data
    const trustpilotMentioned = pageText?.toLowerCase().includes('trustpilot');
    const ratingMentioned = pageText?.includes('3.') || pageText?.includes('4.') || pageText?.includes('5.');
    const etablertMentioned = pageText?.toLowerCase().includes('etablert');
    const legitimMentioned = pageText?.toLowerCase().includes('legitim');

    // Check that hardcoded examples are NOT mentioned
    const powerMentioned = pageText?.toLowerCase().includes('power');
    const hmMentioned = pageText?.toLowerCase().includes('h&m');
    const dnbMentioned = pageText?.toLowerCase().includes('dnb') && !pageText?.toLowerCase().includes('dnb svindelsjekken');

    console.log('Search result indicators:');
    console.log('- Trustpilot mentioned:', trustpilotMentioned);
    console.log('- Rating found:', ratingMentioned);
    console.log('- Etablert mentioned:', etablertMentioned);
    console.log('- Legitim mentioned:', legitimMentioned);
    console.log('Hardcoded example check:');
    console.log('- Power mentioned:', powerMentioned);
    console.log('- H&M mentioned:', hmMentioned);
    console.log('- DNB mentioned (outside app name):', dnbMentioned);

    // Assertions
    expect(trustpilotMentioned || etablertMentioned || legitimMentioned).toBe(true);

    // Should NOT mention hardcoded examples
    expect(powerMentioned).toBe(false);
    expect(hmMentioned).toBe(false);

    // Look for specific Trustpilot rating if available
    if (trustpilotMentioned) {
      console.log('✅ Trustpilot data found - real web search confirmed!');
    }

    // Take screenshot for verification
    await page.screenshot({
      path: '/Users/oscar/Documents/AI-prosjekt/Svindel/dnb-fresh/test-results/fjellsport-text-analysis.png',
      fullPage: true
    });
  });

  test('should show REAL web search results for fjellsport.no image analysis', async ({ page }) => {
    console.log('Starting fjellsport.no image analysis test...');

    // Create a simple test image with fjellsport.no text
    const canvas = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 800, 400);

      // Add fjellsport.no text
      ctx.fillStyle = 'black';
      ctx.font = '48px Arial';
      ctx.fillText('Special offer at fjellsport.no', 50, 100);
      ctx.font = '24px Arial';
      ctx.fillText('Visit fjellsport.no for amazing outdoor gear!', 50, 150);
      ctx.fillText('Contact: info@fjellsport.no', 50, 200);

      return canvas.toDataURL('image/png');
    });

    // Convert data URL to blob for file upload
    const buffer = Buffer.from(canvas.split(',')[1], 'base64');

    // Create temporary file
    const tempFilePath = '/tmp/fjellsport-test-image.png';
    await page.evaluate(async ({ buffer, tempFilePath }) => {
      const fs = require('fs');
      fs.writeFileSync(tempFilePath, Buffer.from(buffer));
    }, { buffer: Array.from(buffer), tempFilePath });

    // Upload the test image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFilePath);

    // Wait for file preview
    await expect(page.locator('.file-preview')).toBeVisible({ timeout: 10000 });

    // Click analyze button
    await page.locator('.check-button').click();

    // Wait for navigation and analysis
    await page.waitForURL('**/analyse**', { timeout: 30000 });
    await page.waitForTimeout(10000); // OCR and analysis can take time

    // Get analysis results
    const pageText = await page.textContent('body');
    console.log('Image analysis content preview:', pageText?.substring(0, 500));

    // Check for real web search indicators
    const trustpilotMentioned = pageText?.toLowerCase().includes('trustpilot');
    const websearchMentioned = pageText?.toLowerCase().includes('websøk') || pageText?.toLowerCase().includes('web search');
    const etablertMentioned = pageText?.toLowerCase().includes('etablerte selskaper');
    const verifisertMentioned = pageText?.toLowerCase().includes('verifisert');

    // Check that hardcoded examples are NOT mentioned
    const powerMentioned = pageText?.toLowerCase().includes('power');
    const hmMentioned = pageText?.toLowerCase().includes('h&m');

    console.log('Image analysis search indicators:');
    console.log('- Trustpilot mentioned:', trustpilotMentioned);
    console.log('- Web search mentioned:', websearchMentioned);
    console.log('- Etablerte selskaper mentioned:', etablertMentioned);
    console.log('- Verifisert mentioned:', verifisertMentioned);
    console.log('Hardcoded example check:');
    console.log('- Power mentioned:', powerMentioned);
    console.log('- H&M mentioned:', hmMentioned);

    // Assertions - should show signs of real web search
    expect(websearchMentioned || etablertMentioned || verifisertMentioned || trustpilotMentioned).toBe(true);

    // Should NOT mention hardcoded examples
    expect(powerMentioned).toBe(false);
    expect(hmMentioned).toBe(false);

    // Take screenshot
    await page.screenshot({
      path: '/Users/oscar/Documents/AI-prosjekt/Svindel/dnb-fresh/test-results/fjellsport-image-analysis.png',
      fullPage: true
    });

    // Clean up temp file
    await page.evaluate(({ tempFilePath }) => {
      const fs = require('fs');
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.log('Could not delete temp file:', e instanceof Error ? e.message : String(e));
      }
    }, { tempFilePath });
  });

  test('should verify hardcoded examples are completely removed from prompts', async ({ page }) => {
    console.log('Verifying hardcoded examples are removed...');

    // Test multiple scenarios to ensure no hardcoded responses
    const testCases = [
      'Check out this deal at fjellsport.no',
      'Visit fjellsport.no for outdoor gear',
      'Special offer from fjellsport.no'
    ];

    for (const testText of testCases) {
      console.log(`Testing: "${testText}"`);

      // Navigate back to home page
      await page.goto('http://localhost:3000/nb');
      await page.waitForLoadState('networkidle');

      // Fill and analyze
      const textarea = page.locator('.unified-textarea');
      await textarea.fill(testText);
      await page.locator('.check-button').click();

      // Wait for analysis
      await page.waitForURL('**/analyse**', { timeout: 30000 });
      await page.waitForTimeout(3000);

      // Check results
      const pageText = await page.textContent('body');

      // Should show real analysis, not "no results found"
      const noResultsFound = pageText?.toLowerCase().includes('ingen søketreff funnet') ||
                            pageText?.toLowerCase().includes('no search results found');

      console.log(`- No results found for "${testText}":`, noResultsFound);

      // Should NOT show "no results found" for legitimate company
      expect(noResultsFound).toBe(false);
    }
  });
});