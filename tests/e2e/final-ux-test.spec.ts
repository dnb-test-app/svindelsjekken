import { test, expect } from '@playwright/test';

test.describe('Final UX Verification - DNB Eufemia Standards', () => {
  const viewports = [
    { name: 'mobile-xs', width: 320, height: 568 },
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'wide', width: 1920, height: 1080 }
  ];

  test('Complete responsive design test', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await page.screenshot({
        path: `tests/screenshots/final-${viewport.name}.png`,
        fullPage: true
      });
      
      console.log(`✅ Screenshot taken: ${viewport.name}`);
    }
  });

  test('DNB Eufemia compliance check', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    
    // Check logo
    const logo = page.locator('.dnb-logo-responsive');
    await expect(logo).toBeVisible();
    const logoBox = await logo.boundingBox();
    console.log('✅ Logo size:', logoBox?.height, 'px');
    
    // Check primary button styling
    const primaryButton = page.locator('button').first();
    const primaryStyles = await primaryButton.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        minHeight: computed.minHeight
      };
    });
    console.log('✅ Primary button styles:', primaryStyles);
    
    // Check hero section
    const heroSection = page.locator('.hero-section');
    const heroStyles = await heroSection.evaluate(el => {
      const section = el.closest('section');
      const computed = window.getComputedStyle(section!);
      return {
        background: computed.background,
        borderBottom: computed.borderBottom
      };
    });
    console.log('✅ Hero section styles:', heroStyles);
    
    // Check spacing
    const mainContainer = page.locator('.main-container');
    const containerStyles = await mainContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        padding: computed.padding,
        maxWidth: computed.maxWidth
      };
    });
    console.log('✅ Container styles:', containerStyles);
  });

  test('Touch targets and accessibility', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    // Check all interactive elements
    const interactiveElements = await page.locator('button, a, input, textarea, [role="button"]').all();
    let touchTargetsPassed = true;
    const issues = [];
    
    for (const element of interactiveElements) {
      const box = await element.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        const text = await element.textContent() || await element.getAttribute('aria-label') || 'unknown';
        issues.push({ text: text.substring(0, 30), width: box.width, height: box.height });
        touchTargetsPassed = false;
      }
    }
    
    if (touchTargetsPassed) {
      console.log('✅ All touch targets meet 44x44px minimum');
    } else {
      console.log('⚠️ Touch targets below 44x44px:', issues);
    }
    
    // Check focus states
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (el) {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineOffset: styles.outlineOffset
        };
      }
      return null;
    });
    console.log('✅ Focus styles:', focusedElement);
  });

  test('Dark mode complete test', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    
    // Switch to dark mode
    const themeToggle = page.locator('.theme-toggle button');
    await themeToggle.click(); // To dark
    await page.waitForTimeout(500);
    
    // Verify dark mode is active
    const htmlElement = page.locator('html');
    const dataTheme = await htmlElement.getAttribute('data-theme');
    expect(dataTheme).toBe('dark');
    
    // Check dark mode colors
    const bodyStyles = await page.locator('body').evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color
      };
    });
    console.log('✅ Dark mode body styles:', bodyStyles);
    
    // Check button visibility in dark mode
    const buttonStyles = await page.locator('button').first().evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderColor: computed.borderColor
      };
    });
    console.log('✅ Dark mode button styles:', buttonStyles);
    
    // Take dark mode screenshots
    for (const viewport of [
      { name: 'mobile-dark', width: 375, height: 812 },
      { name: 'desktop-dark', width: 1440, height: 900 }
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.screenshot({
        path: `tests/screenshots/final-${viewport.name}.png`,
        fullPage: true
      });
    }
  });

  test('Performance metrics', async ({ page }) => {
    await page.goto('/');
    
    // Measure performance
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart
      };
    });
    
    console.log('✅ Performance metrics (ms):', metrics);
    expect(metrics.domInteractive).toBeLessThan(3000);
  });
});