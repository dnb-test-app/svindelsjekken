import { test } from '@playwright/test';

test('Check upload functionality', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Take screenshot of current state
  await page.screenshot({ path: 'current-state.png', fullPage: true });
  
  // Log what's visible
  const textarea = await page.locator('textarea').first();
  console.log('Textarea placeholder:', await textarea.getAttribute('placeholder'));
  
  // Check for upload hint
  const uploadHint = await page.locator('.upload-hint').count();
  console.log('Upload hint elements found:', uploadHint);
  
  // Check all text on page
  const allText = await page.locator('body').innerText();
  console.log('Page contains:', allText.includes('Klikk eller slipp fil her'));
  
  // Keep browser open for inspection
  await page.waitForTimeout(30000);
});