import { test, expect } from '@playwright/test';

test.describe('UX Final Review - After DNB Eufemia Fixes', () => {
  test('Homepage screenshots - all viewports', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'wide', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await page.screenshot({
        path: `tests/screenshots/final-homepage-${viewport.name}.png`,
        fullPage: true
      });
    }
  });

  test('Visual consistency check', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Check header styling
    const header = page.locator('header');
    const headerBg = await header.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return computed.backgroundColor;
    });
    console.log('Header background:', headerBg);
    
    // Check hero section
    const heroSection = page.locator('.hero-section').first();
    const heroBg = await heroSection.evaluate(el => {
      const parent = el.closest('section');
      const computed = window.getComputedStyle(parent);
      return computed.backgroundColor;
    });
    console.log('Hero background:', heroBg);
    
    // Check button styling
    const primaryButton = page.locator('button').first();
    const buttonStyles = await primaryButton.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderRadius: computed.borderRadius
      };
    });
    console.log('Primary button styles:', buttonStyles);
    
    // Check DNB Logo presence
    const logo = page.locator('.dnb-logo');
    await expect(logo).toBeVisible();
  });

  test('Dark mode consistency', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Switch to dark mode
    const themeButton = page.locator('button[aria-label*="tema" i], button:has-text("System")').first();
    await themeButton.click();
    await page.locator('text=Mørkt').click();
    await page.waitForTimeout(500);
    
    // Take dark mode screenshot
    await page.screenshot({
      path: 'tests/screenshots/final-homepage-dark.png',
      fullPage: true
    });
    
    // Check dark mode colors
    const bodyBg = await page.evaluate(() => {
      const computed = window.getComputedStyle(document.body);
      return computed.backgroundColor;
    });
    console.log('Dark mode background:', bodyBg);
  });
});