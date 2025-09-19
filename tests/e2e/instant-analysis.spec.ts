import { test, expect } from '@playwright/test';

test.describe('Instant Analysis Tests', () => {
  test('should analyze text automatically when pasted', async ({ page }) => {
    // Navigate to the Norwegian page
    await page.goto('http://localhost:3002/nb');
    await page.waitForLoadState('networkidle');
    
    // Find the textarea
    const textarea = page.locator('.text-input').first();
    
    // Test with a high-risk scam text
    const scamText = `URGENT: Your DNB account has been compromised! 
    Click here immediately to verify your identity: 
    http://dnb-secure-verify.fake-site.com
    Enter your BankID and password NOW or your account will be locked!`;
    
    // Paste the text
    await textarea.fill(scamText);
    
    // Wait for analysis to trigger (300ms delay + processing time)
    await page.waitForTimeout(500);
    
    // Check that results appear
    const resultBox = page.locator('.result-box');
    await expect(resultBox).toBeVisible();
    
    // Check that risk level is shown
    const riskLevel = page.locator('.risk-level');
    await expect(riskLevel).toContainText(/Risikonivå|Risk level/);
    
    // Check that triggers are shown
    const triggers = page.locator('.triggers');
    await expect(triggers).toBeVisible();
    
    // Check that recommendations are shown
    const recommendations = page.locator('.recommendations');
    await expect(recommendations).toBeVisible();
    
    // Since it's a high-risk text, check for DNB contact info
    const dnbContact = page.locator('.dnb-contact');
    await expect(dnbContact).toBeVisible();
    await expect(dnbContact).toContainText('915 04800');
  });

  test('should clear analysis when text is deleted', async ({ page }) => {
    await page.goto('http://localhost:3002/nb');
    await page.waitForLoadState('networkidle');
    
    const textarea = page.locator('.text-input').first();
    
    // Add text
    await textarea.fill('This might be a scam message');
    await page.waitForTimeout(500);
    
    // Verify results appear
    const resultBox = page.locator('.result-box');
    await expect(resultBox).toBeVisible();
    
    // Clear the text
    await textarea.clear();
    await page.waitForTimeout(100);
    
    // Verify results disappear
    await expect(resultBox).not.toBeVisible();
  });

  test('should analyze medium-risk text correctly', async ({ page }) => {
    await page.goto('http://localhost:3002/nb');
    await page.waitForLoadState('networkidle');
    
    const textarea = page.locator('.text-input').first();
    
    // Medium risk text
    const mediumRiskText = 'You have won a prize! Contact us to claim your reward.';
    
    await textarea.fill(mediumRiskText);
    await page.waitForTimeout(500);
    
    // Check results
    const resultBox = page.locator('.result-box');
    await expect(resultBox).toBeVisible();
    
    // Should not show DNB contact for medium risk
    const dnbContact = page.locator('.dnb-contact');
    await expect(dnbContact).not.toBeVisible();
  });

  test('should update analysis when text changes', async ({ page }) => {
    await page.goto('http://localhost:3002/nb');
    await page.waitForLoadState('networkidle');
    
    const textarea = page.locator('.text-input').first();
    
    // Start with low risk text
    await textarea.fill('Hello, how are you?');
    await page.waitForTimeout(500);
    
    // Get initial risk score
    const riskScore1 = await page.locator('.risk-score').textContent();
    
    // Change to high risk text
    await textarea.clear();
    await textarea.fill('URGENT: Send BankID immediately or account will be closed!');
    await page.waitForTimeout(500);
    
    // Get new risk score
    const riskScore2 = await page.locator('.risk-score').textContent();
    
    // Scores should be different
    expect(riskScore1).not.toBe(riskScore2);
  });

  test('should handle rapid text changes gracefully', async ({ page }) => {
    await page.goto('http://localhost:3002/nb');
    await page.waitForLoadState('networkidle');
    
    const textarea = page.locator('.text-input').first();
    
    // Type rapidly
    await textarea.type('This ', { delay: 50 });
    await textarea.type('is ', { delay: 50 });
    await textarea.type('a ', { delay: 50 });
    await textarea.type('test ', { delay: 50 });
    await textarea.type('message', { delay: 50 });
    
    // Wait for debounce
    await page.waitForTimeout(500);
    
    // Should show one result, not multiple
    const resultBoxes = page.locator('.result-box');
    await expect(resultBoxes).toHaveCount(1);
  });

  test('should work with Norwegian text', async ({ page }) => {
    await page.goto('http://localhost:3002/nb');
    await page.waitForLoadState('networkidle');
    
    const textarea = page.locator('.text-input').first();
    
    // Norwegian scam text
    const norwegianScam = `HASTER: Din DNB-konto er sperret! 
    Klikk her for å bekrefte identitet: 
    www.dnb-verifisering.fake.no
    Oppgi BankID umiddelbart!`;
    
    await textarea.fill(norwegianScam);
    await page.waitForTimeout(500);
    
    // Check that analysis works
    const resultBox = page.locator('.result-box');
    await expect(resultBox).toBeVisible();
    
    // Check Norwegian labels
    const triggers = page.locator('.triggers h3');
    await expect(triggers).toContainText('Faresignaler');
  });

  test('visual check - screenshot of instant analysis', async ({ page }) => {
    await page.goto('http://localhost:3002/nb');
    await page.waitForLoadState('networkidle');
    
    const textarea = page.locator('.text-input').first();
    
    // Add high-risk text
    await textarea.fill('URGENT: Your account is blocked! Send your BankID and password NOW to unlock: fake@scam.com');
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/instant-analysis.png',
      fullPage: true 
    });
  });
});