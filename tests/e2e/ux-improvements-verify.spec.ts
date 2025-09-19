import { test, expect } from '@playwright/test';

test.describe('UX Improvements Verification', () => {
  test('Verify responsive improvements', async ({ page }) => {
    // Test mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check logo size on mobile
    const logoMobile = page.locator('.dnb-logo-responsive').first();
    const logoBoxMobile = await logoMobile.boundingBox();
    console.log('Mobile - Logo height:', logoBoxMobile?.height);
    expect(logoBoxMobile?.height).toBeGreaterThanOrEqual(48);
    
    // Check touch targets on mobile
    const languageButton = page.locator('.language-switcher button').first();
    const langBox = await languageButton.boundingBox();
    console.log('Mobile - Language button height:', langBox?.height);
    expect(langBox?.height).toBeGreaterThanOrEqual(44);
    
    // Check textarea width
    const textarea = page.locator('textarea').first();
    const textareaBox = await textarea.boundingBox();
    const containerBox = await page.locator('.form-container').first().boundingBox();
    console.log('Mobile - Textarea width:', textareaBox?.width, 'Container width:', containerBox?.width);
    
    // Take mobile screenshot
    await page.screenshot({
      path: 'tests/screenshots/improved-mobile.png',
      fullPage: true
    });
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    const logoTablet = page.locator('.dnb-logo-responsive').first();
    const logoBoxTablet = await logoTablet.boundingBox();
    console.log('Tablet - Logo height:', logoBoxTablet?.height);
    expect(logoBoxTablet?.height).toBeGreaterThanOrEqual(64);
    
    await page.screenshot({
      path: 'tests/screenshots/improved-tablet.png',
      fullPage: true
    });
    
    // Test desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload();
    
    const logoDesktop = page.locator('.dnb-logo-responsive').first();
    const logoBoxDesktop = await logoDesktop.boundingBox();
    console.log('Desktop - Logo height:', logoBoxDesktop?.height);
    expect(logoBoxDesktop?.height).toBeGreaterThanOrEqual(80);
    
    // Check button layout on desktop
    const buttonGroup = page.locator('.button-group').first();
    const buttonGroupBox = await buttonGroup.boundingBox();
    const buttons = await page.locator('.button-group .dnb-button').all();
    console.log('Desktop - Button group has', buttons.length, 'buttons');
    
    await page.screenshot({
      path: 'tests/screenshots/improved-desktop.png',
      fullPage: true
    });
  });

  test('Verify dark mode improvements', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    
    // Switch to dark mode
    const themeToggle = page.locator('.theme-toggle button').first();
    await themeToggle.click(); // Switch to dark
    await page.waitForTimeout(500);
    
    // Check dark mode is applied
    const htmlElement = page.locator('html');
    const dataTheme = await htmlElement.getAttribute('data-theme');
    console.log('Dark mode data-theme:', dataTheme);
    
    // Check background colors
    const body = page.locator('body');
    const bodyBg = await body.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log('Dark mode body background:', bodyBg);
    
    await page.screenshot({
      path: 'tests/screenshots/improved-dark-mode.png',
      fullPage: true
    });
  });

  test('Verify container widths', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375 },
      { name: 'tablet', width: 768 },
      { name: 'desktop', width: 1280 },
      { name: 'wide', width: 1920 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: 900 });
      await page.goto('/');
      
      const mainContainer = page.locator('.main-container').first();
      const box = await mainContainer.boundingBox();
      
      console.log(`[${viewport.name}] Container width: ${box?.width}px`);
      
      // Verify max-width constraints
      if (viewport.width >= 1920) {
        expect(box?.width).toBeLessThanOrEqual(1440);
      }
    }
  });
});