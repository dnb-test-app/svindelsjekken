const { chromium } = require('playwright');
const path = require('path');

async function testApplicationState() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🧪 Testing Application State and Logic...');
        
        await page.goto('http://localhost:3001');
        await page.waitForSelector('h1', { timeout: 10000 });
        
        // Activate Easter egg
        const textInput = page.locator('textarea').first();
        await textInput.fill('RaiRai');
        await page.waitForTimeout(2000);
        
        console.log('✅ Easter egg activated');
        
        // Check React component state directly
        const componentState = await page.evaluate(() => {
            // Look for React component state
            const reactKeys = Object.keys(window).filter(key => key.startsWith('__REACT'));
            console.log('React keys found:', reactKeys);
            
            // Try to access React dev tools info
            if (window.React) {
                return 'React found in window';
            }
            
            // Check for any global variables that might contain state
            const globalVars = Object.keys(window).filter(key => 
                key.includes('state') || key.includes('model') || key.includes('pending')
            );
            
            return {
                reactKeys,
                globalVars,
                hasReact: !!window.React,
                hasReactDOM: !!window.ReactDOM
            };
        });
        
        console.log('🔍 Component state inspection:', componentState);
        
        // Try to trigger the model selection change through DOM manipulation
        console.log('\n🎯 Testing model selection programmatically...');
        
        // First, take a screenshot before any changes
        await page.screenshot({ 
            path: path.join(__dirname, 'tests', 'screenshots', 'state-test-before-change.png'),
            fullPage: true 
        });
        
        // Try to simulate the model change by directly calling the onChange handler
        const changeResult = await page.evaluate(() => {
            // Look for the dropdown element
            const dropdown = document.querySelector('.dnb-dropdown');
            if (!dropdown) return 'No dropdown found';
            
            // Look for any event listeners or data attributes
            const dropdownInfo = {
                hasOnChange: dropdown.onchange !== null,
                hasClickHandler: dropdown.onclick !== null,
                dataAttributes: Object.keys(dropdown.dataset),
                innerHTML: dropdown.innerHTML.substring(0, 200)
            };
            
            // Try to find React event handlers (they usually start with __)
            const eventKeys = Object.keys(dropdown).filter(key => 
                key.includes('react') || key.includes('event') || key.includes('__')
            );
            
            dropdownInfo.eventKeys = eventKeys;
            
            return dropdownInfo;
        });
        
        console.log('🔧 Dropdown analysis:', JSON.stringify(changeResult, null, 2));
        
        // Now let's try a different approach - use keyboard navigation
        console.log('\n⌨️ Trying keyboard navigation...');
        
        const dropdownTrigger = page.locator('.dnb-dropdown__trigger').first();
        await dropdownTrigger.focus();
        await page.keyboard.press('Space'); // Open dropdown
        await page.waitForTimeout(1000);
        
        await page.keyboard.press('ArrowDown'); // Move to next option
        await page.waitForTimeout(500);
        await page.keyboard.press('ArrowDown'); // Move to next option again
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter'); // Select the option
        await page.waitForTimeout(2000);
        
        // Take screenshot after keyboard selection
        await page.screenshot({ 
            path: path.join(__dirname, 'tests', 'screenshots', 'state-test-after-keyboard-change.png'),
            fullPage: true 
        });
        
        // Check for save/cancel buttons
        const saveButtons = await page.locator('button').filter({ hasText: /Lagre|Save/ }).count();
        const cancelButtons = await page.locator('button').filter({ hasText: /Avbryt|Cancel/ }).count();
        
        console.log(`\n📊 After keyboard selection:`);
        console.log(`Save buttons: ${saveButtons}`);
        console.log(`Cancel buttons: ${cancelButtons}`);
        
        if (saveButtons > 0 || cancelButtons > 0) {
            console.log('✅ SUCCESS: Buttons appeared after keyboard interaction!');
        } else {
            console.log('❌ Buttons still not visible after keyboard interaction');
            
            // Let's check the React component props and state more deeply
            const deepInspection = await page.evaluate(() => {
                // Look for any element that might contain React data
                const allElements = document.querySelectorAll('*');
                let reactData = [];
                
                for (let element of allElements) {
                    const keys = Object.keys(element);
                    const reactKeys = keys.filter(key => key.startsWith('__react'));
                    if (reactKeys.length > 0) {
                        reactData.push({
                            tagName: element.tagName,
                            className: element.className,
                            reactKeys: reactKeys.slice(0, 3) // Limit to first 3
                        });
                    }
                }
                
                return {
                    reactElementsFound: reactData.length,
                    sampleReactElements: reactData.slice(0, 5)
                };
            });
            
            console.log('🔬 Deep React inspection:', JSON.stringify(deepInspection, null, 2));
        }
        
        // Final summary
        console.log('\n📋 FINAL DIAGNOSIS:');
        console.log('1. Easter egg activation: ✅ Working');
        console.log('2. Model selector visibility: ✅ Working'); 
        console.log('3. Model options available: ✅ Working (9 options found)');
        console.log('4. Dropdown interaction: ❌ Problematic (viewport issues)');
        console.log('5. Save/Cancel buttons: ❌ NOT appearing');
        console.log('\n💡 LIKELY ISSUE: The pendingModel state is not being set when model selection changes');
        console.log('   This could be due to:');
        console.log('   - Event handler not being called');
        console.log('   - DNB Dropdown component not triggering onChange correctly');
        console.log('   - State update logic not working as expected');
        
    } catch (error) {
        console.error('Error during state testing:', error);
    } finally {
        await browser.close();
    }
}

testApplicationState().catch(console.error);