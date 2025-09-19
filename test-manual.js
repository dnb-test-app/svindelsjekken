// Manual test script to verify the issues
const puppeteer = require('puppeteer');

async function testEasterEgg() {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1200,800']
  });
  
  const page = await browser.newPage();
  
  // Monitor API calls
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('/api/analyze-advanced')) {
      console.log('🔴 API Call detected:', request.method(), request.url());
      apiCalls.push(request.url());
    }
  });
  
  await page.goto('http://localhost:3000');
  console.log('📍 Page loaded');
  
  // Test 1: Check if first request is local-only
  console.log('\n=== TEST 1: First request should be local-only ===');
  
  // Wait for textarea to be available
  await page.waitForSelector('.input-field', { timeout: 5000 });
  await page.type('.input-field', 'Dette er en test av svindelsjekken');
  await page.click('.check-button');
  await page.waitForTimeout(2000);
  
  if (apiCalls.length === 0) {
    console.log('✅ PASS: First check was local-only (no API calls)');
  } else {
    console.log('❌ FAIL: First check made API calls:', apiCalls);
  }
  
  // Clear and test Easter egg
  console.log('\n=== TEST 2: Easter egg activation ===');
  await page.evaluate(() => document.querySelector('.input-field').value = '');
  await page.type('.input-field', 'RaiRai');
  await page.waitForTimeout(1000);
  
  // Check if model selector is visible
  const modelSelectorVisible = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    return labels.some(label => label.textContent.includes('AI Model'));
  });
  
  if (modelSelectorVisible) {
    console.log('✅ Model selector appeared after typing RaiRai');
    
    // Try to find and click dropdown
    const dropdown = await page.$('[role="combobox"]');
    if (dropdown) {
      await dropdown.click();
      await page.waitForTimeout(500);
      
      // Select a different model using text content
      const clicked = await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('span'));
        const gpt5 = options.find(span => span.textContent.includes('GPT-5'));
        if (gpt5) {
          gpt5.click();
          return true;
        }
        return false;
      });
      
      if (clicked) {
        await page.waitForTimeout(1000);
        
        // Check for save/cancel buttons
        const buttonsFound = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const saveButton = buttons.find(btn => btn.textContent.includes('Lagre modell'));
          const cancelButton = buttons.find(btn => btn.textContent.includes('Avbryt'));
          return {
            save: !!saveButton,
            cancel: !!cancelButton
          };
        });
        
        if (buttonsFound.save && buttonsFound.cancel) {
          console.log('✅ PASS: Save and Cancel buttons are visible');
        } else {
          console.log('❌ FAIL: Save/Cancel buttons not found');
          console.log('  - Save button found:', buttonsFound.save);
          console.log('  - Cancel button found:', buttonsFound.cancel);
        }
      } else {
        console.log('❌ Could not find GPT-5 option');
      }
    } else {
      console.log('❌ Dropdown not found');
    }
  } else {
    console.log('❌ Model selector did not appear');
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'test-result.png', fullPage: true });
  console.log('\n📸 Screenshot saved as test-result.png');
  
  console.log('\n=== Test Summary ===');
  console.log('Total API calls during test:', apiCalls.length);
  
  await browser.close();
}

testEasterEgg().catch(console.error);