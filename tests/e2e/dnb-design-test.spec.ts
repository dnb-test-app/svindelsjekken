import { test } from '@playwright/test';

test('DNB Design Showcase', async ({ page }) => {
  // Navigate to the Norwegian page
  await page.goto('http://localhost:3002/nb');
  await page.waitForLoadState('networkidle');
  
  // Take initial screenshot
  await page.screenshot({ 
    path: 'tests/screenshots/dnb-design-homepage.png',
    fullPage: true 
  });
  
  // Add high-risk text to trigger instant analysis
  const textarea = page.locator('textarea').first();
  await textarea.fill(`HASTER! Din DNB-konto er blokkert!
  
Klikk på denne lenken umiddelbart for å gjenopprette tilgang:
www.dnb-sikkerhet-verifisering.fake-site.com

Oppgi BankID og passord NÅ eller kontoen stenges permanent!
Dette er siste varsel!`);
  
  // Wait for analysis to complete
  await page.waitForTimeout(500);
  
  // Take screenshot with analysis results
  await page.screenshot({ 
    path: 'tests/screenshots/dnb-design-with-analysis.png',
    fullPage: true 
  });
  
  // Test dark mode
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  
  await page.waitForTimeout(500);
  
  // Take dark mode screenshot
  await page.screenshot({ 
    path: 'tests/screenshots/dnb-design-dark-mode.png',
    fullPage: true 
  });
  
  console.log('✅ DNB Design screenshots saved:');
  console.log('  - dnb-design-homepage.png');
  console.log('  - dnb-design-with-analysis.png');
  console.log('  - dnb-design-dark-mode.png');
});