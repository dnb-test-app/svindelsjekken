const { chromium } = require('playwright');
const path = require('path');

async function inspectDOMStructure() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🔍 DOM Structure Inspection...');
        
        await page.goto('http://localhost:3001');
        await page.waitForSelector('h1', { timeout: 10000 });
        
        const textInput = page.locator('textarea').first();
        await textInput.fill('RaiRai');
        await page.waitForTimeout(2000);
        
        console.log('\n📋 After Easter egg activation:');
        
        // Get the full HTML of the model selector area
        const modelSelectorArea = page.locator('.dnb-dropdown').first();
        const isVisible = await modelSelectorArea.isVisible();
        console.log(`Model selector visible: ${isVisible}`);
        
        if (isVisible) {
            // Get the dropdown HTML
            const dropdownHTML = await modelSelectorArea.innerHTML();
            console.log('\n🏗️ Dropdown HTML structure:');
            console.log(dropdownHTML.substring(0, 500) + '...');
            
            // Check for data attributes that might contain options
            const dropdownData = await modelSelectorArea.evaluate(element => {
                return {
                    tagName: element.tagName,
                    className: element.className,
                    id: element.id,
                    dataset: element.dataset,
                    attributes: Array.from(element.attributes).map(attr => ({ name: attr.name, value: attr.value }))
                };
            });
            
            console.log('\n🔧 Dropdown element details:');
            console.log(JSON.stringify(dropdownData, null, 2));
            
            // Try to find the actual select element or input
            const selectElement = page.locator('select').first();
            const selectVisible = await selectElement.isVisible();
            console.log(`\nSelect element visible: ${selectVisible}`);
            
            if (selectVisible) {
                const options = await selectElement.locator('option').count();
                console.log(`Select options count: ${options}`);
                
                for (let i = 0; i < options; i++) {
                    const optionValue = await selectElement.locator('option').nth(i).getAttribute('value');
                    const optionText = await selectElement.locator('option').nth(i).textContent();
                    console.log(`Option ${i}: value="${optionValue}", text="${optionText}"`);
                }
            }
            
            // Check for DNB-specific dropdown classes
            const dnbDropdownButton = page.locator('.dnb-dropdown__trigger, [role="combobox"]').first();
            const dnbButtonVisible = await dnbDropdownButton.isVisible();
            console.log(`\nDNB dropdown button visible: ${dnbButtonVisible}`);
            
            if (dnbButtonVisible) {
                console.log('Attempting to click DNB dropdown...');
                await dnbDropdownButton.click();
                await page.waitForTimeout(1000);
                
                // Look for opened dropdown list
                const dropdownList = page.locator('.dnb-dropdown__list, [role="listbox"]').first();
                const listVisible = await dropdownList.isVisible();
                console.log(`Dropdown list visible after click: ${listVisible}`);
                
                if (listVisible) {
                    const options = page.locator('.dnb-dropdown__option, [role="option"]');
                    const optionCount = await options.count();
                    console.log(`Found ${optionCount} options in opened dropdown`);
                    
                    for (let i = 0; i < Math.min(optionCount, 5); i++) {
                        const optionText = await options.nth(i).textContent();
                        const optionValue = await options.nth(i).getAttribute('value');
                        console.log(`Option ${i}: "${optionText}" (value: ${optionValue})`);
                    }
                    
                    // Try selecting a different option
                    if (optionCount > 1) {
                        console.log('\n🔄 Attempting to select different option...');
                        await options.nth(1).click();
                        await page.waitForTimeout(2000);
                        
                        // Now check for save/cancel buttons
                        const saveButton = page.locator('button').filter({ hasText: /Lagre|Save/ });
                        const cancelButton = page.locator('button').filter({ hasText: /Avbryt|Cancel/ });
                        
                        const saveCount = await saveButton.count();
                        const cancelCount = await cancelButton.count();
                        
                        console.log(`Save buttons found: ${saveCount}`);
                        console.log(`Cancel buttons found: ${cancelCount}`);
                        
                        if (saveCount > 0) {
                            const saveVisible = await saveButton.first().isVisible();
                            const saveText = await saveButton.first().textContent();
                            console.log(`First save button visible: ${saveVisible}, text: "${saveText}"`);
                        }
                        
                        if (cancelCount > 0) {
                            const cancelVisible = await cancelButton.first().isVisible();
                            const cancelText = await cancelButton.first().textContent();
                            console.log(`First cancel button visible: ${cancelVisible}, text: "${cancelText}"`);
                        }
                        
                        // Take final screenshot for debugging
                        await page.screenshot({ 
                            path: path.join(__dirname, 'tests', 'screenshots', 'dom-inspection-after-selection.png'),
                            fullPage: true 
                        });
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Error during DOM inspection:', error);
    } finally {
        await browser.close();
    }
}

inspectDOMStructure().catch(console.error);