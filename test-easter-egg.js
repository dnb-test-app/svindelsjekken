const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'tests', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function testEasterEggFunctionality() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    let consoleErrors = [];
    let networkRequests = [];

    // Collect console errors
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    // Monitor network requests
    page.on('request', (request) => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: Date.now()
        });
    });

    try {
        console.log('🚀 Starting Easter egg functionality test...');
        
        // Go to the application
        console.log('📱 Navigating to http://localhost:3001');
        await page.goto('http://localhost:3001');
        
        // Wait for page to load
        await page.waitForSelector('h1', { timeout: 10000 });
        console.log('✅ Page loaded successfully');
        
        // Take initial screenshot
        await page.screenshot({ path: path.join(screenshotsDir, '1-initial-state.png'), fullPage: true });
        console.log('📸 Initial screenshot taken');

        // Let's inspect what's actually on the page
        const pageContent = await page.content();
        console.log('Page title:', await page.title());
        
        // Check if we're on the right page
        const h1Text = await page.locator('h1').textContent();
        console.log('H1 text:', h1Text);
        
        // Look for any text inputs
        const inputs = await page.locator('input').count();
        const textareas = await page.locator('textarea').count();
        console.log(`Found ${inputs} input elements and ${textareas} textarea elements`);
        
        // Try to find the text input with various selectors
        let textInput;
        const selectors = [
            'textarea',
            'input[type="text"]',
            'input',
            '.input-field',
            '[placeholder*="tekst"]',
            '[placeholder*="lim"]'
        ];
        
        for (const selector of selectors) {
            try {
                const element = page.locator(selector).first();
                const isVisible = await element.isVisible();
                console.log(`Selector "${selector}": ${isVisible ? 'visible' : 'not visible'}`);
                if (isVisible) {
                    textInput = element;
                    console.log(`✅ Text input found with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`Selector "${selector}": error -`, e.message);
            }
        }
        
        if (!textInput) {
            console.log('❌ No text input found, listing all visible elements...');
            const allElements = await page.locator('*').all();
            for (let i = 0; i < Math.min(allElements.length, 20); i++) {
                try {
                    const tagName = await allElements[i].evaluate(el => el.tagName);
                    const isVisible = await allElements[i].isVisible();
                    if (isVisible && (tagName === 'INPUT' || tagName === 'TEXTAREA')) {
                        console.log(`Found visible ${tagName} element`);
                    }
                } catch (e) {
                    // Skip
                }
            }
            throw new Error('No text input element found');
        }

        // Test 1: Activate Easter egg by typing "RaiRai"
        console.log('\n🥚 TEST 1: Activating Easter egg with "RaiRai"...');
        await textInput.fill('RaiRai');
        await page.waitForTimeout(1500); // Give time for Easter egg to activate
        
        await page.screenshot({ path: path.join(screenshotsDir, '2-after-rairai-typed.png') });
        console.log('📸 Screenshot after typing RaiRai');

        // Check if model selector appears
        const modelSelector = page.locator('.dnb-dropdown').first();
        try {
            await modelSelector.waitFor({ state: 'visible', timeout: 5000 });
            console.log('✅ Model selector appeared after typing RaiRai');
            
            await page.screenshot({ path: path.join(screenshotsDir, '3-model-selector-visible.png') });
            console.log('📸 Model selector screenshot taken');
            
        } catch (error) {
            console.log('❌ Model selector did not appear after typing RaiRai');
            await page.screenshot({ path: path.join(screenshotsDir, '3-model-selector-missing.png') });
        }

        // Test 2: Try to change model selection
        console.log('\n🔧 TEST 2: Testing model selection change...');
        try {
            // Click on the dropdown
            await modelSelector.click();
            await page.waitForTimeout(1000);
            
            // Look for dropdown options
            const dropdownOptions = page.locator('.dnb-dropdown__list__option');
            const optionCount = await dropdownOptions.count();
            console.log(`Found ${optionCount} dropdown options`);
            
            if (optionCount > 1) {
                // Click the second option
                await dropdownOptions.nth(1).click();
                await page.waitForTimeout(1000);
                
                await page.screenshot({ path: path.join(screenshotsDir, '4-after-model-change.png') });
                console.log('📸 Screenshot after model change');
                
                // Check for save/cancel buttons
                const saveButton = page.locator('button:has-text("Lagre")');
                const cancelButton = page.locator('button:has-text("Avbryt")');
                
                const saveVisible = await saveButton.isVisible();
                const cancelVisible = await cancelButton.isVisible();
                
                if (saveVisible && cancelVisible) {
                    console.log('✅ Save and Cancel buttons appeared after model change');
                    await page.screenshot({ path: path.join(screenshotsDir, '5-save-cancel-buttons-visible.png') });
                } else {
                    console.log('❌ Save/Cancel buttons did not appear - THIS IS THE ISSUE!');
                    console.log(`Save button visible: ${saveVisible}, Cancel button visible: ${cancelVisible}`);
                    await page.screenshot({ path: path.join(screenshotsDir, '5-save-cancel-buttons-missing.png') });
                }
            }
        } catch (error) {
            console.log('❌ Could not interact with model dropdown:', error.message);
            await page.screenshot({ path: path.join(screenshotsDir, '4-model-dropdown-interaction-failed.png') });
        }

        // Test 3: Test local fraud checking without API calls
        console.log('\n🔍 TEST 3: Testing local fraud checking...');
        
        // Clear previous requests
        networkRequests = [];
        
        // Clear text and add fraud test
        await textInput.fill('');
        const fraudText = 'HASTER! Din konto sperres i dag! Oppgi BankID kode umiddelbart';
        await textInput.fill(fraudText);
        
        // Find and click check button
        const checkButton = page.locator('button:has-text("Sjekk")').first();
        await checkButton.waitFor({ state: 'visible' });
        
        const requestsBefore = networkRequests.length;
        await checkButton.click();
        
        // Wait for analysis
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: path.join(screenshotsDir, '6-local-analysis-results.png') });
        
        // Check network requests
        const apiCalls = networkRequests.filter(req => req.url.includes('/api/analyze'));
        console.log(`API calls made during local check: ${apiCalls.length}`);
        
        if (apiCalls.length === 0) {
            console.log('✅ Local fraud check made no API calls');
        } else {
            console.log('❌ Local fraud check made API calls (unexpected)');
            console.log('API calls:', apiCalls);
        }

        // Test 4: Test API calls when Easter egg is active
        console.log('\n🌐 TEST 4: Testing API calls with Easter egg active...');
        
        // Make sure Easter egg is still active
        await textInput.fill('RaiRai test fraud text');
        await page.waitForTimeout(1000);
        
        // Clear and add fraud text
        networkRequests = [];
        await textInput.fill('URGENT: Your account will be suspended! Click here now!');
        
        await checkButton.click();
        await page.waitForTimeout(5000); // Longer wait for API call
        
        await page.screenshot({ path: path.join(screenshotsDir, '7-api-enhanced-analysis.png') });
        
        const apiCallsWithEasterEgg = networkRequests.filter(req => req.url.includes('/api/analyze'));
        console.log(`API calls made with Easter egg active: ${apiCallsWithEasterEgg.length}`);
        
        if (apiCallsWithEasterEgg.length > 0) {
            console.log('✅ API calls made when Easter egg is active');
            console.log('API calls:', apiCallsWithEasterEgg.map(call => `${call.method} ${call.url}`));
        } else {
            console.log('❌ No API calls made even with Easter egg active');
        }

        // Final summary
        console.log('\n📊 TEST SUMMARY:');
        console.log(`Console errors: ${consoleErrors.length}`);
        if (consoleErrors.length > 0) {
            console.log('Console errors:', consoleErrors);
        }
        console.log(`Total network requests: ${networkRequests.length}`);
        console.log('Screenshots saved to:', screenshotsDir);

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        await page.screenshot({ path: path.join(screenshotsDir, 'error-screenshot.png') });
    } finally {
        await browser.close();
        console.log('🏁 Test completed');
    }
}

// Run the test
testEasterEggFunctionality().catch(console.error);