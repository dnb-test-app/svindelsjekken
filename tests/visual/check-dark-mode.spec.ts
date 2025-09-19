import { test } from '@playwright/test';

test('Take screenshot of dark mode', async ({ page }) => {
  // Navigate to homepage
  await page.goto('http://localhost:3002/nb');
  await page.waitForLoadState('networkidle');
  
  // Take light mode screenshot first
  await page.screenshot({ 
    path: 'dark-mode-light.png',
    fullPage: true 
  });
  
  // Set dark mode via JavaScript
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  
  // Wait a bit for styles to apply
  await page.waitForTimeout(1000);
  
  // Take dark mode screenshot
  await page.screenshot({ 
    path: 'dark-mode-dark.png',
    fullPage: true 
  });
  
  console.log('Screenshots saved: dark-mode-light.png and dark-mode-dark.png');
});