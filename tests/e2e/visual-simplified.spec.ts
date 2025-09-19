import { test, expect } from '@playwright/test';

test.describe('Simplified Design Visual Tests', () => {
  test('capture simplified design on different viewports', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3004');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'tests/screenshots/simplified-desktop.png', 
      fullPage: true 
    });

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'tests/screenshots/simplified-tablet.png', 
      fullPage: true 
    });

    // Mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'tests/screenshots/simplified-mobile.png', 
      fullPage: true 
    });

    // Test input interaction
    const textarea = await page.locator('textarea').first();
    await textarea.fill('Jeg fikk en SMS om at kontoen min er sperret. Klikk her: bit.ly/dnb-fake');
    
    const checkButton = await page.locator('button:has-text("Sjekk")').first();
    await checkButton.click();
    
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: 'tests/screenshots/simplified-with-result.png', 
      fullPage: true 
    });
  });
});