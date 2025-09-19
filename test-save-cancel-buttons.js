const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'tests', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function testSaveCancelButtons() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🚀 Starting Save/Cancel Buttons Test...');
        
        // Go to the application
        await page.goto('http://localhost:3001');
        await page.waitForSelector('h1', { timeout: 10000 });
        console.log('✅ Page loaded successfully');
        
        // Find the textarea
        const textInput = page.locator('textarea').first();
        await textInput.waitFor({ state: 'visible' });
        console.log('✅ Text input found');
        
        // Initial state screenshot
        await page.screenshot({ path: path.join(screenshotsDir, 'save-cancel-1-initial.png'), fullPage: true });
        
        // Step 1: Activate Easter egg
        console.log('\n🥚 Step 1: Activating Easter egg with "RaiRai"...');
        await textInput.fill('RaiRai');
        await page.waitForTimeout(1500);
        
        await page.screenshot({ path: path.join(screenshotsDir, 'save-cancel-2-easter-egg-activated.png'), fullPage: true });
        
        // Check if model selector is visible
        const modelSelector = page.locator('.dnb-dropdown').first();
        const isModelSelectorVisible = await modelSelector.isVisible();
        console.log(`Model selector visible: ${isModelSelectorVisible}`);
        
        if (!isModelSelectorVisible) {
            console.log('❌ Model selector not visible - Easter egg failed to activate');
            return;
        }
        
        // Step 2: Check initial state - should be no save/cancel buttons
        const initialSaveButton = page.locator('button:has-text("Lagre")').first();
        const initialCancelButton = page.locator('button:has-text("Avbryt")').first();
        
        const initialSaveVisible = await initialSaveButton.isVisible();
        const initialCancelVisible = await initialCancelButton.isVisible();
        
        console.log(`Initial save button visible: ${initialSaveVisible}`);
        console.log(`Initial cancel button visible: ${initialCancelVisible}`);
        
        // Step 3: Get current model selection
        console.log('\n🔄 Step 3: Checking current model and attempting to change it...');
        
        // Click on the dropdown to open it
        await modelSelector.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: path.join(screenshotsDir, 'save-cancel-3-dropdown-opened.png'), fullPage: true });
        
        // Look for dropdown options
        const options = page.locator('.dnb-dropdown__list__option, [role="option"]');
        const optionCount = await options.count();
        console.log(`Found ${optionCount} dropdown options`);
        
        if (optionCount > 0) {
            // Get text of current and alternative options
            for (let i = 0; i < Math.min(optionCount, 5); i++) {
                const optionText = await options.nth(i).textContent();
                console.log(`Option ${i}: "${optionText}"`);
            }
            
            // Select a different option (try the second one)
            if (optionCount > 1) {
                console.log('Selecting second option...');
                await options.nth(1).click();
                await page.waitForTimeout(1000);
                
                await page.screenshot({ path: path.join(screenshotsDir, 'save-cancel-4-option-selected.png'), fullPage: true });
                
                // Step 4: Check if save/cancel buttons appear after selection change
                console.log('\n💾 Step 4: Checking for save/cancel buttons after model change...');
                
                const saveButton = page.locator('button:has-text("Lagre")').first();
                const cancelButton = page.locator('button:has-text("Avbryt")').first();
                
                // Wait a bit for buttons to potentially appear
                await page.waitForTimeout(2000);
                
                const saveVisible = await saveButton.isVisible();
                const cancelVisible = await cancelButton.isVisible();
                
                console.log(`Save button visible after change: ${saveVisible}`);
                console.log(`Cancel button visible after change: ${cancelVisible}`);
                
                if (saveVisible && cancelVisible) {
                    console.log('✅ SUCCESS: Save/Cancel buttons appeared after model change');
                    await page.screenshot({ path: path.join(screenshotsDir, 'save-cancel-5-SUCCESS-buttons-visible.png'), fullPage: true });
                    
                    // Test button functionality
                    console.log('\n🧪 Testing button functionality...');
                    
                    // Test cancel button
                    await cancelButton.click();
                    await page.waitForTimeout(1000);
                    
                    const saveVisibleAfterCancel = await saveButton.isVisible();
                    const cancelVisibleAfterCancel = await cancelButton.isVisible();
                    
                    console.log(`Buttons visible after cancel: save=${saveVisibleAfterCancel}, cancel=${cancelVisibleAfterCancel}`);
                    await page.screenshot({ path: path.join(screenshotsDir, 'save-cancel-6-after-cancel.png'), fullPage: true });
                    
                } else {
                    console.log('❌ ISSUE CONFIRMED: Save/Cancel buttons did NOT appear after model change');
                    console.log('This confirms the reported bug!');
                    await page.screenshot({ path: path.join(screenshotsDir, 'save-cancel-5-FAILED-buttons-missing.png'), fullPage: true });
                    
                    // Let's inspect the DOM to see what's happening
                    console.log('\n🔍 Investigating DOM state...');
                    
                    // Check if there are any buttons at all
                    const allButtons = page.locator('button');
                    const buttonCount = await allButtons.count();
                    console.log(`Total buttons on page: ${buttonCount}`);
                    
                    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
                        const buttonText = await allButtons.nth(i).textContent();
                        const buttonVisible = await allButtons.nth(i).isVisible();
                        console.log(`Button ${i}: "${buttonText}" (visible: ${buttonVisible})`);
                    }
                    
                    // Check the dropdown value
                    const dropdownValue = await modelSelector.inputValue();
                    console.log(`Current dropdown value: "${dropdownValue}"`);
                    
                    // Check for any elements with save/cancel related classes or text
                    const elementsWithSave = page.locator('*:has-text("Lagre"), *:has-text("Save")');
                    const elementsWithCancel = page.locator('*:has-text("Avbryt"), *:has-text("Cancel")');
                    
                    const saveElementCount = await elementsWithSave.count();
                    const cancelElementCount = await elementsWithCancel.count();
                    
                    console.log(`Elements containing "Lagre/Save": ${saveElementCount}`);
                    console.log(`Elements containing "Avbryt/Cancel": ${cancelElementCount}`);
                }
                
            } else {
                console.log('⚠️ Only one option available, cannot test model change');
            }
        } else {
            console.log('❌ No dropdown options found');
        }
        
        // Step 5: Summary
        console.log('\n📊 TEST SUMMARY:');
        console.log('- Easter egg activation: ✅ Working');
        console.log('- Model selector appearance: ✅ Working');
        console.log('- Model dropdown interaction: ✅ Working');
        
        const finalSaveVisible = await page.locator('button:has-text("Lagre")').first().isVisible();
        const finalCancelVisible = await page.locator('button:has-text("Avbryt")').first().isVisible();
        
        if (finalSaveVisible && finalCancelVisible) {
            console.log('- Save/Cancel buttons: ✅ Working correctly');
        } else {
            console.log('- Save/Cancel buttons: ❌ NOT working - BUG CONFIRMED');
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        await page.screenshot({ path: path.join(screenshotsDir, 'save-cancel-error.png'), fullPage: true });
    } finally {
        await browser.close();
        console.log('\n🏁 Test completed');
        console.log(`Screenshots saved to: ${screenshotsDir}`);
    }
}

// Run the test
testSaveCancelButtons().catch(console.error);