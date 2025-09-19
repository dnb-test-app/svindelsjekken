import { test, expect } from '@playwright/test';

test.describe('New Intuitive Layout Test', () => {
  test('Test new layout on all screen sizes', async ({ page }) => {
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
        path: `tests/screenshots/new-layout-${viewport.name}.png`,
        fullPage: true
      });
      
      console.log(`✅ Screenshot taken: ${viewport.name}`);
      
      // Check layout structure
      if (viewport.width >= 960) {
        // Desktop: should have side-by-side layout
        const textInput = page.locator('.paste-box').first();
        const uploadBox = page.locator('.upload-box').first();
        
        const textBox = await textInput.boundingBox();
        const uploadBoxBounds = await uploadBox.boundingBox();
        
        if (textBox && uploadBoxBounds) {
          console.log(`[${viewport.name}] Text input width: ${textBox.width}px`);
          console.log(`[${viewport.name}] Upload box width: ${uploadBoxBounds.width}px`);
          console.log(`[${viewport.name}] Same row: ${Math.abs(textBox.y - uploadBoxBounds.y) < 50}`);
        }
      }
    }
  });

  test('Verify hero section with new tagline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    
    // Check for new tagline
    const tagline = page.locator('text=Vi stopper 9 av 10');
    await expect(tagline).toBeVisible();
    
    // Check hero styling
    const heroSection = page.locator('.hero-section').first();
    const heroText = await heroSection.textContent();
    console.log('Hero contains:', {
      hasTagline: heroText?.includes('Vi stopper 9 av 10'),
      hasTitle: heroText?.includes('Sjekk om noe kan være svindel')
    });
    
    // Check T for Trygghet
    const subtitle = page.locator('text=T for Trygghet').or(page.locator('text=T for Trust'));
    await expect(subtitle).toBeVisible();
  });

  test('Test responsive behavior', async ({ page }) => {
    // Test on mobile first
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    // Elements should stack vertically on mobile
    const textInput = page.locator('.paste-box').first();
    const uploadBox = page.locator('.upload-box').first();
    
    const textBoxMobile = await textInput.boundingBox();
    const uploadBoxMobile = await uploadBox.boundingBox();
    
    if (textBoxMobile && uploadBoxMobile) {
      const isStacked = uploadBoxMobile.y > textBoxMobile.y + textBoxMobile.height;
      console.log('Mobile - Elements stacked:', isStacked);
    }
    
    // Test on desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload();
    
    const textBoxDesktop = await textInput.boundingBox();
    const uploadBoxDesktop = await uploadBox.boundingBox();
    
    if (textBoxDesktop && uploadBoxDesktop) {
      const isSideBySide = Math.abs(textBoxDesktop.y - uploadBoxDesktop.y) < 50;
      console.log('Desktop - Elements side by side:', isSideBySide);
    }
  });
});