const puppeteer = require('puppeteer');

async function testFjellsportRealSearch() {
  console.log('🧪 Testing fjellsport.no real web search functionality...');

  const browser = await puppeteer.launch({
    headless: false, // Show browser
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();

    // Monitor console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Console error:', msg.text());
      }
    });

    // Monitor network requests
    page.on('response', response => {
      if (response.url().includes('api/analyze')) {
        console.log(`🌐 API Response: ${response.url()} - Status: ${response.status()}`);
      }
    });

    console.log('🌐 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000/nb', { waitUntil: 'networkidle2' });

    // Wait for page to load
    await page.waitForSelector('.unified-textarea', { timeout: 10000 });

    console.log('📝 Entering fjellsport.no text...');
    await page.type('.unified-textarea', 'Check out this amazing deal at fjellsport.no');

    // Wait a moment for text to be processed
    await page.waitForTimeout(1000);

    console.log('🔍 Clicking analyze button...');
    await page.click('.check-button');

    // Wait for navigation or result
    console.log('⏳ Waiting for analysis to complete...');
    await page.waitForFunction(
      () => window.location.href.includes('/analyse') || document.querySelector('.analysis-content'),
      { timeout: 30000 }
    );

    // Wait for analysis to complete
    await page.waitForTimeout(5000);

    // Get the page content
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('📄 Analysis result preview (first 500 chars):');
    console.log(pageText.substring(0, 500));
    console.log('...');

    // Analyze the results
    console.log('\n🔍 Analyzing results for fjellsport.no...');

    // Check for real web search indicators
    const trustpilotMentioned = pageText.toLowerCase().includes('trustpilot');
    const ratingFound = /[0-9]+[.,][0-9]+/.test(pageText); // Rating pattern like 3.8 or 4.2
    const etablertMentioned = pageText.toLowerCase().includes('etablerte selskaper');
    const verifisertMentioned = pageText.toLowerCase().includes('verifisert gjennom websøk');
    const legitimMentioned = pageText.toLowerCase().includes('legitim');

    // Check for hardcoded examples (should NOT be present)
    const powerMentioned = pageText.toLowerCase().includes('power') &&
                          !pageText.toLowerCase().includes('powerful'); // Avoid false positives
    const hmMentioned = pageText.toLowerCase().includes('h&m');
    const dnbMentioned = pageText.toLowerCase().includes('dnb') &&
                        !pageText.toLowerCase().includes('dnb svindelsjekken');

    // Check for "no results found" (should NOT be present for legitimate company)
    const noResultsFound = pageText.toLowerCase().includes('ingen søketreff funnet') ||
                          pageText.toLowerCase().includes('no search results found');

    console.log('\n📊 RESULTS SUMMARY:');
    console.log('=====================================');
    console.log('Real web search indicators:');
    console.log(`✅ Trustpilot mentioned: ${trustpilotMentioned}`);
    console.log(`✅ Rating found: ${ratingFound}`);
    console.log(`✅ "Etablerte selskaper" mentioned: ${etablertMentioned}`);
    console.log(`✅ "Verifisert gjennom websøk" mentioned: ${verifisertMentioned}`);
    console.log(`✅ "Legitim" mentioned: ${legitimMentioned}`);
    console.log('');
    console.log('Hardcoded examples check (should be FALSE):');
    console.log(`❌ Power mentioned: ${powerMentioned}`);
    console.log(`❌ H&M mentioned: ${hmMentioned}`);
    console.log(`❌ DNB mentioned (outside app): ${dnbMentioned}`);
    console.log('');
    console.log('No results check (should be FALSE for legitimate company):');
    console.log(`❌ "Ingen søketreff funnet": ${noResultsFound}`);

    // Take screenshot for manual verification
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({
      path: '/Users/oscar/Documents/AI-prosjekt/Svindel/dnb-fresh/fjellsport-test-result.png',
      fullPage: true
    });

    // Final verdict
    console.log('\n🎯 FINAL VERDICT:');
    console.log('=====================================');

    const realSearchEvidence = trustpilotMentioned || ratingFound || etablertMentioned || verifisertMentioned;
    const hardcodedEvidence = powerMentioned || hmMentioned;

    if (realSearchEvidence && !hardcodedEvidence && !noResultsFound) {
      console.log('🎉 SUCCESS: Real web search is working for fjellsport.no!');
      console.log('✅ Evidence of real web search found');
      console.log('✅ No hardcoded examples detected');
      console.log('✅ No "no results found" message');
    } else if (noResultsFound) {
      console.log('❌ ISSUE: Still showing "no results found" for fjellsport.no');
      console.log('This suggests hardcoded examples might still be affecting the search');
    } else if (hardcodedEvidence) {
      console.log('❌ ISSUE: Hardcoded examples still present in prompts');
      console.log('Need to check and remove remaining hardcoded company names');
    } else {
      console.log('⚠️  UNCLEAR: No clear evidence of web search or hardcoded examples');
      console.log('May need to check if web search is functioning properly');
    }

    // Wait for manual inspection
    console.log('\n🔍 Browser left open for manual inspection...');
    console.log('Press Ctrl+C when done inspecting the results.');

    // Keep browser open for manual inspection
    await new Promise(() => {}); // Wait indefinitely

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Don't close browser automatically for manual inspection
    // await browser.close();
  }
}

// Run the test
testFjellsportRealSearch();