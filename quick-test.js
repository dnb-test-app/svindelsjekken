const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Testing local dev environment...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Test localhost first
    console.log('📍 Testing localhost:3000...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: 'local-test-initial.png', fullPage: true });

    // Enter URL text
    const textArea = page.locator('textarea').first();
    await textArea.fill('Check out this amazing deal at modehusoslo.com');

    // Wait for URL detection to trigger
    await page.waitForTimeout(2000);

    // Take screenshot after URL entry
    await page.screenshot({ path: 'local-test-url-entered.png', fullPage: true });

    // Check if additional context field appears
    const contextField = page.locator('textarea[placeholder*="Fikk denne"]');
    const isVisible = await contextField.isVisible();

    console.log(`✅ Local test - Additional context field visible: ${isVisible}`);

    // Now test live site
    console.log('📍 Testing live site...');
    await page.goto('https://svindelsjekken.0scar.no');
    await page.waitForLoadState('networkidle');

    // Take screenshot of live site
    await page.screenshot({ path: 'live-test-initial.png', fullPage: true });

    // Enter URL text on live site
    const liveTextArea = page.locator('textarea').first();
    await liveTextArea.fill('Check out this amazing deal at modehusoslo.com');

    // Wait for URL detection
    await page.waitForTimeout(2000);

    // Take screenshot after URL entry on live site
    await page.screenshot({ path: 'live-test-url-entered.png', fullPage: true });

    // Check if additional context field appears on live site
    const liveContextField = page.locator('textarea[placeholder*="Fikk denna"], textarea[placeholder*="Fikk denne"]');
    const isLiveVisible = await liveContextField.isVisible();

    console.log(`🌐 Live test - Additional context field visible: ${isLiveVisible}`);

    // Compare results
    console.log('\n📊 COMPARISON:');
    console.log(`Local (localhost:3000): ${isVisible ? '✅' : '❌'}`);
    console.log(`Live (svindelsjekken.0scar.no): ${isLiveVisible ? '✅' : '❌'}`);

    if (isVisible && !isLiveVisible) {
      console.log('🚨 ISSUE: Working locally but broken on live site - deployment issue!');
    } else if (!isVisible && !isLiveVisible) {
      console.log('🚨 ISSUE: Broken in both environments - code issue!');
    } else if (isVisible && isLiveVisible) {
      console.log('✅ Working in both environments');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();