import { test, expect } from '@playwright/test';

test.describe('Badge Color Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should show red badge for fraud results', async ({ page }) => {
    // Enter a known fraudulent text that should trigger high risk
    const fraudText = 'URGENT: Your bank account will be closed! Click this link immediately to verify your BankID credentials or lose access forever!';

    await page.fill('textarea', fraudText);
    await page.click('text=Sjekk');

    // Wait for analysis to complete
    await page.waitForSelector('.analyzing-state', { state: 'hidden' });

    // Should have AI analysis section
    await expect(page.locator('[data-testid="ai-analysis-badge"]')).toBeVisible();

    // Check that the badge has red background for fraud
    const badge = page.locator('[data-testid="ai-analysis-badge"]');
    await expect(badge).toBeVisible();

    // Check computed styles for red color (fraud)
    const backgroundColor = await badge.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be red (cherry-red color)
    expect(backgroundColor).toMatch(/rgb\(194, 30, 37\)|#c21e25/i);
  });

  test('should show orange badge for suspicious results', async ({ page }) => {
    // Enter a moderately suspicious text
    const suspiciousText = 'You have won a prize! Please provide your personal information to claim it.';

    await page.fill('textarea', suspiciousText);
    await page.click('text=Sjekk');

    // Wait for analysis to complete
    await page.waitForSelector('.analyzing-state', { state: 'hidden' });

    // Should have AI analysis section
    await expect(page.locator('[data-testid="ai-analysis-badge"]')).toBeVisible();

    // Check that the badge has orange background for suspicious
    const badge = page.locator('[data-testid="ai-analysis-badge"]');
    await expect(badge).toBeVisible();

    // Check computed styles - should be orange (signal-orange) or red if categorized as fraud
    const backgroundColor = await badge.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be orange for suspicious or red if classified as fraud
    expect(backgroundColor).toMatch(/rgb\((255, 145, 0)|(194, 30, 37)\)|#(ff9100|c21e25)/i);
  });

  test('should show green badge for safe results', async ({ page }) => {
    // Enter a safe text
    const safeText = 'Thank you for your purchase. Your order has been confirmed and will be shipped within 3-5 business days.';

    await page.fill('textarea', safeText);
    await page.click('text=Sjekk');

    // Wait for analysis to complete
    await page.waitForSelector('.analyzing-state', { state: 'hidden' });

    // Should have AI analysis section
    await expect(page.locator('[data-testid="ai-analysis-badge"]')).toBeVisible();

    // Check that the badge has green background for safe
    const badge = page.locator('[data-testid="ai-analysis-badge"]');
    await expect(badge).toBeVisible();

    // Check computed styles for green color (safe)
    const backgroundColor = await badge.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be green (summer-green color)
    expect(backgroundColor).toMatch(/rgb\(40, 167, 69\)|#28a745/i);
  });

  test('should show red badge for AI errors (never green)', async ({ page }) => {
    // Mock API to return error
    await page.route('/api/analyze-advanced', async route => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'API Error' })
      });
    });

    await page.fill('textarea', 'Some text that will cause AI error');
    await page.click('text=Sjekk');

    // Wait for analysis to complete
    await page.waitForSelector('.analyzing-state', { state: 'hidden' });

    // Should have AI analysis section showing error
    await expect(page.locator('[data-testid="ai-analysis-badge"]')).toBeVisible();

    // Check that the badge has red background for error (never green)
    const badge = page.locator('[data-testid="ai-analysis-badge"]');
    await expect(badge).toBeVisible();

    // Check computed styles for red color (error)
    const backgroundColor = await badge.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be red (cherry-red color) for errors, NEVER green
    expect(backgroundColor).toMatch(/rgb\(194, 30, 37\)|#c21e25/i);
    expect(backgroundColor).not.toMatch(/rgb\(40, 167, 69\)|#28a745/i); // Not green
  });

  test('should handle URL-only input correctly', async ({ page }) => {
    // Test the specific case mentioned by user: dnb.no.dnb.com
    const urlOnlyInput = 'dnb.no.dnb.com';

    await page.fill('textarea', urlOnlyInput);
    await page.click('text=Sjekk');

    // Wait for analysis to complete
    await page.waitForSelector('.analyzing-state', { state: 'hidden' });

    // Should have a result (not fail completely)
    await expect(page.locator('.result')).toBeVisible();

    // Should have AI analysis badge
    await expect(page.locator('[data-testid="ai-analysis-badge"]')).toBeVisible();

    // The badge should show appropriate color based on analysis result
    // dnb.no.dnb.com should be detected as typosquatting and be red (fraud)
    const badge = page.locator('[data-testid="ai-analysis-badge"]');
    const backgroundColor = await badge.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be red for this typosquatting domain
    expect(backgroundColor).toMatch(/rgb\(194, 30, 37\)|#c21e25/i);
  });

  test('should never fallback to local-only analysis', async ({ page }) => {
    // Mock all API endpoints to fail
    await page.route('/api/**', async route => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Complete API failure' })
      });
    });

    await page.fill('textarea', 'This should not result in safe analysis');
    await page.click('text=Sjekk');

    // Wait for analysis to complete
    await page.waitForSelector('.analyzing-state', { state: 'hidden' });

    // Should have a result showing error, not safe
    await expect(page.locator('.result')).toBeVisible();

    // Should NOT have a green result or safe category
    const resultDiv = page.locator('.result');
    await expect(resultDiv).not.toHaveClass(/low-risk|safe/);

    // Should have error or warning styling
    await expect(resultDiv).toHaveClass(/error|medium-risk|high-risk/);

    // Badge should be red for error, never green
    if (await page.locator('[data-testid="ai-analysis-badge"]').isVisible()) {
      const badge = page.locator('[data-testid="ai-analysis-badge"]');
      const backgroundColor = await badge.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should be red (error), never green
      expect(backgroundColor).toMatch(/rgb\(194, 30, 37\)|#c21e25/i);
      expect(backgroundColor).not.toMatch(/rgb\(40, 167, 69\)|#28a745/i); // Not green
    }
  });
});