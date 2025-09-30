import { test, expect } from '@playwright/test';

test.describe('UX Review - DNB Eufemia Standards', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'wide', width: 1920, height: 1080 }
  ];

  const pages = [
    { path: '/', name: 'homepage' },
    { path: '/om', name: 'about' },
    { path: '/personvern', name: 'privacy' }
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  for (const viewport of viewports) {
    test(`Screenshot all pages - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      for (const pageInfo of pages) {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        
        // Take screenshot
        await page.screenshot({
          path: `tests/screenshots/ux-review-${pageInfo.name}-${viewport.name}.png`,
          fullPage: true
        });

        // Test dark mode
        await page.click('button[aria-label*="tema" i]');
        await page.click('text=Mørkt');
        await page.waitForTimeout(500);
        
        await page.screenshot({
          path: `tests/screenshots/ux-review-${pageInfo.name}-${viewport.name}-dark.png`,
          fullPage: true
        });

        // Reset to light mode
        await page.click('button[aria-label*="tema" i]');
        await page.click('text=Lyst');
      }
    });
  }

  test('Interactive elements and forms', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Test file upload area
    const uploadArea = page.locator('[data-testid="upload-area"]');
    await expect(uploadArea).toBeVisible();
    await page.screenshot({
      path: 'tests/screenshots/ux-review-upload-area.png',
      clip: await uploadArea.boundingBox() || undefined
    });

    // Test text input
    await page.fill('textarea', 'Test av svindelmeldinger');
    await page.screenshot({
      path: 'tests/screenshots/ux-review-text-input.png',
      fullPage: true
    });

    // Test buttons
    const analyzeButton = page.locator('button:has-text("Analyser")');
    await analyzeButton.hover();
    await page.screenshot({
      path: 'tests/screenshots/ux-review-button-hover.png',
      clip: await analyzeButton.boundingBox() || undefined
    });
  });

  test('Typography and spacing check', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Check headings
    const headings = await page.locator('h1, h2, h3, h4').all();
    for (const heading of headings) {
      const styles = await heading.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          lineHeight: computed.lineHeight,
          marginTop: computed.marginTop,
          marginBottom: computed.marginBottom
        };
      });
      console.log('Heading styles:', styles);
    }

    // Check body text
    const paragraphs = await page.locator('p').all();
    for (const p of paragraphs.slice(0, 3)) {
      const styles = await p.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          lineHeight: computed.lineHeight,
          marginBottom: computed.marginBottom
        };
      });
      console.log('Paragraph styles:', styles);
    }
  });

  test('Color contrast check', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Check text contrast
    const elements = await page.locator('p, h1, h2, h3, button, a').all();
    
    for (const element of elements.slice(0, 10)) {
      const contrast = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        const bg = computed.backgroundColor;
        const color = computed.color;
        return { background: bg, text: color };
      });
      console.log('Color contrast:', contrast);
    }
  });

  test('DNB Eufemia components check', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Check for Eufemia classes
    const eufemiaElements = await page.locator('[class*="dnb-"]').count();
    console.log('Eufemia elements found:', eufemiaElements);
    
    // Check buttons follow Eufemia patterns
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const classes = await button.getAttribute('class');
      console.log('Button classes:', classes);
    }
  });
});