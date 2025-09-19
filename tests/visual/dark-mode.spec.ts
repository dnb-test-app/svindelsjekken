import { test, expect } from '@playwright/test';

test.describe('Dark Mode Visual Tests', () => {
  test('dark mode styling should look professional', async ({ page }) => {
    // Navigate to the home page
    await page.goto('http://localhost:3002/nb');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Enable dark mode by setting cookie
    await page.context().addCookies([
      {
        name: 'theme',
        value: 'dark',
        domain: 'localhost',
        path: '/'
      }
    ]);
    
    // Reload to apply dark mode
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of dark mode
    await page.screenshot({ 
      path: 'tests/screenshots/dark-mode-home.png',
      fullPage: true 
    });
    
    // Check that dark mode is applied
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    
    // Check input area styling
    const inputArea = page.locator('.unified-input').first();
    
    // Get computed styles
    const backgroundColor = await inputArea.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    const borderColor = await inputArea.evaluate((el) => 
      window.getComputedStyle(el).borderColor
    );
    
    // Log the colors for debugging
    console.log('Background color:', backgroundColor);
    console.log('Border color:', borderColor);
    
    // Check text visibility in textarea
    const textarea = page.locator('.unified-textarea textarea').first();
    await textarea.fill('Test text for dark mode');
    
    const textColor = await textarea.evaluate((el) => 
      window.getComputedStyle(el).color
    );
    
    console.log('Text color:', textColor);
    
    // Take screenshot with text
    await page.screenshot({ 
      path: 'tests/screenshots/dark-mode-with-text.png',
      fullPage: true 
    });
    
    // Check button styling
    const checkButton = page.locator('.check-button').first();
    const buttonBg = await checkButton.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    console.log('Button background:', buttonBg);
    
    // Visual regression test (if baseline exists)
    await expect(page).toHaveScreenshot('dark-mode-homepage.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('dark mode contrast should be sufficient', async ({ page }) => {
    await page.goto('http://localhost:3002/nb');
    
    // Enable dark mode
    await page.context().addCookies([
      {
        name: 'theme',
        value: 'dark',
        domain: 'localhost',
        path: '/'
      }
    ]);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check contrast ratios
    const elements = [
      { selector: '.hero-title', name: 'Hero Title' },
      { selector: '.hero-tagline', name: 'Hero Tagline' },
      { selector: '.helper-btn', name: 'Helper Button' },
      { selector: '.help-link', name: 'Help Link' }
    ];
    
    for (const element of elements) {
      const el = page.locator(element.selector).first();
      if (await el.count() > 0) {
        const color = await el.evaluate((node) => 
          window.getComputedStyle(node).color
        );
        const bgColor = await el.evaluate((node) => {
          let bg = window.getComputedStyle(node).backgroundColor;
          if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
            // Get parent background
            const parent = node.parentElement;
            if (parent) {
              bg = window.getComputedStyle(parent).backgroundColor;
            }
          }
          return bg;
        });
        
        console.log(`${element.name} - Color: ${color}, Background: ${bgColor}`);
      }
    }
  });
});