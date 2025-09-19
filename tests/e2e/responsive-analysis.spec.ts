import { test, expect } from '@playwright/test';

test.describe('Responsive Design Analysis', () => {
  const breakpoints = [
    { name: 'mobile-xs', width: 320, height: 568 },
    { name: 'mobile', width: 375, height: 812 },
    { name: 'mobile-lg', width: 414, height: 896 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'tablet-lg', width: 834, height: 1194 },
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'desktop-lg', width: 1440, height: 900 },
    { name: 'wide', width: 1920, height: 1080 }
  ];

  for (const viewport of breakpoints) {
    test(`Analyze layout at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Analyze logo size
      const logo = page.locator('.dnb-logo').first();
      const logoBox = await logo.boundingBox();
      console.log(`[${viewport.name}] Logo size:`, logoBox);

      // Analyze button sizes and spacing
      const buttons = await page.locator('button').all();
      for (let i = 0; i < Math.min(3, buttons.length); i++) {
        const box = await buttons[i].boundingBox();
        const text = await buttons[i].textContent();
        console.log(`[${viewport.name}] Button "${text}":`, box);
      }

      // Analyze container widths
      const mainContainer = page.locator('.main-container').first();
      const containerBox = await mainContainer.boundingBox();
      console.log(`[${viewport.name}] Main container:`, containerBox);

      // Analyze text areas
      const textarea = page.locator('textarea').first();
      if (await textarea.isVisible()) {
        const textareaBox = await textarea.boundingBox();
        console.log(`[${viewport.name}] Textarea:`, textareaBox);
      }

      // Check padding and margins
      const heroSection = page.locator('.hero-section').first();
      const heroStyles = await heroSection.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          padding: computed.padding,
          margin: computed.margin,
          maxWidth: computed.maxWidth
        };
      });
      console.log(`[${viewport.name}] Hero section styles:`, heroStyles);

      // Check font sizes
      const heading = page.locator('h1, h2').first();
      const headingStyles = await heading.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          lineHeight: computed.lineHeight
        };
      });
      console.log(`[${viewport.name}] Heading styles:`, headingStyles);

      // Take screenshot for visual review
      await page.screenshot({
        path: `tests/screenshots/responsive-${viewport.name}.png`,
        fullPage: true
      });
    });
  }

  test('Touch target analysis on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Get all clickable elements
    const clickables = await page.locator('button, a, input, textarea, [role="button"]').all();
    
    const smallTargets = [];
    for (const element of clickables) {
      const box = await element.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        const text = await element.textContent() || await element.getAttribute('aria-label') || 'unknown';
        smallTargets.push({ text, width: box.width, height: box.height });
      }
    }

    if (smallTargets.length > 0) {
      console.log('❌ Touch targets below 44x44px:', smallTargets);
    } else {
      console.log('✅ All touch targets meet minimum size requirements');
    }
  });

  test('Container width consistency', async ({ page }) => {
    const widths = [375, 768, 1280, 1920];
    
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      
      const containers = await page.locator('.main-container, .hero-section, .form-container').all();
      const measurements = [];
      
      for (const container of containers) {
        const box = await container.boundingBox();
        const className = await container.getAttribute('class');
        if (box) {
          measurements.push({
            class: className,
            width: box.width,
            x: box.x
          });
        }
      }
      
      console.log(`[${width}px] Container measurements:`, measurements);
    }
  });
});