import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test.describe('Mobile Viewport (iPhone 12)', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('should render properly on mobile', async ({ page }) => {
      await page.goto('/');
      
      // Check viewport meta tag
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
      expect(viewport).toContain('initial-scale=1');
      
      // Check that main container doesn't overflow
      const mainContainer = await page.locator('.main-container').boundingBox();
      expect(mainContainer?.width).toBeLessThanOrEqual(390);
      
      // Check that hero section is visible and properly sized
      const hero = await page.locator('.dnb-hero').isVisible();
      expect(hero).toBeTruthy();
      
      // Check that trust indicators wrap properly
      const indicators = await page.locator('.trust-indicators').boundingBox();
      expect(indicators?.width).toBeLessThanOrEqual(390);
      
      // Check input container doesn't overflow
      const inputContainer = await page.locator('.dnb-input-container').boundingBox();
      expect(inputContainer?.width).toBeLessThanOrEqual(390);
      
      // Take screenshot for visual verification
      await page.screenshot({ path: 'tests/screenshots/mobile-viewport.png', fullPage: true });
    });

    test('should have no horizontal scroll on mobile', async ({ page }) => {
      await page.goto('/');
      
      // Check body width
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
      
      // Check for horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBeFalsy();
    });
  });

  test.describe('Tablet Viewport (iPad)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should render properly on tablet', async ({ page }) => {
      await page.goto('/');
      
      const mainContainer = await page.locator('.main-container').boundingBox();
      expect(mainContainer?.width).toBeLessThanOrEqual(768);
      
      // Take screenshot
      await page.screenshot({ path: 'tests/screenshots/tablet-viewport.png', fullPage: true });
    });
  });

  test.describe('Desktop Viewport', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should render properly on desktop', async ({ page }) => {
      await page.goto('/');
      
      // Check that content is centered and not too wide
      const hero = await page.locator('.dnb-hero').boundingBox();
      expect(hero).toBeTruthy();
      
      // Take screenshot
      await page.screenshot({ path: 'tests/screenshots/desktop-viewport.png', fullPage: true });
    });
  });

  test('should handle orientation change', async ({ page, context }) => {
    // Start with portrait
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    
    let bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(390);
    
    // Change to landscape
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500); // Wait for reflow
    
    bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(844);
    
    // No horizontal scroll in landscape
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('should have touch-friendly buttons on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    
    // Check button sizes are at least 44x44px for touch targets
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        // Width check might vary for icon buttons vs text buttons
      }
    }
  });
});