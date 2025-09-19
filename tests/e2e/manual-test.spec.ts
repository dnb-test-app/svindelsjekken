import { test, expect } from '@playwright/test';

test.describe('Manual Test for User Issues', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('dnb.no.dnb.com should NOT show green badge', async ({ page }) => {
    // Enter the specific URL that was causing issues
    await page.fill('textarea', 'dnb.no.dnb.com');
    await page.click('text=Sjekk');

    // Wait for analysis to complete with longer timeout since it's slow
    await page.waitForSelector('.analyzing-state', { state: 'hidden', timeout: 30000 });

    // Take a screenshot to see what actually happened
    await page.screenshot({ path: 'test-results/dnb-domain-test.png' });

    // Check if there's a result displayed
    await expect(page.locator('.result')).toBeVisible();

    // Check if there's an AI analysis section
    const aiAnalysisExists = await page.locator('.ai-analysis-section').isVisible().catch(() => false);
    if (aiAnalysisExists) {
      console.log('AI analysis section is visible');

      // Check if badge exists
      const badgeExists = await page.locator('[data-testid="ai-analysis-badge"]').isVisible().catch(() => false);
      if (badgeExists) {
        // Get badge background color
        const badge = page.locator('[data-testid="ai-analysis-badge"]');
        const backgroundColor = await badge.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });

        console.log('Badge background color:', backgroundColor);

        // Should NOT be green (safe color)
        expect(backgroundColor).not.toMatch(/rgb\(40, 167, 69\)|#28a745/i);

        // Should be red (fraud) since dnb.no.dnb.com is typosquatting
        expect(backgroundColor).toMatch(/rgb\(194, 30, 37\)|#c21e25/i);
      } else {
        console.log('Badge not found with data-testid="ai-analysis-badge"');
      }
    } else {
      console.log('AI analysis section not visible');
    }

    // Log the page content for debugging
    const resultText = await page.locator('.result').textContent();
    console.log('Result text:', resultText);
  });

  test('verify that failed analyses never show as safe', async ({ page }) => {
    // Mock API to return 500 error
    await page.route('/api/analyze-advanced', async route => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Mocked API failure' })
      });
    });

    await page.fill('textarea', 'Some test text that will fail analysis');
    await page.click('text=Sjekk');

    // Wait for analysis to complete
    await page.waitForSelector('.analyzing-state', { state: 'hidden' });

    // Take a screenshot
    await page.screenshot({ path: 'test-results/failed-analysis-test.png' });

    // Check that result exists and is NOT safe
    await expect(page.locator('.result')).toBeVisible();

    // Result should NOT have safe/low-risk classes
    const resultDiv = page.locator('.result');
    const className = await resultDiv.getAttribute('class');
    console.log('Result classes:', className);

    // Should not contain 'low-risk' class
    expect(className).not.toContain('low-risk');

    // Should contain error or medium/high risk
    expect(className).toMatch(/error|medium-risk|high-risk/);
  });
});