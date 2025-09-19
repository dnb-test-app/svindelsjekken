import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Opening localhost:3001...');
  await page.goto('http://localhost:3001');

  // Wait for the page to load
  await page.waitForSelector('.input-field');

  // Type the BankID phishing text
  const bankIDText = `BankID
Viktig: Husk å fornye tilgangen din innen 12.09.2025
Til: Oscar Nordström

Forny BankID-en din

Kjære kunde,

For å fortsette å bruke BankID utstedt av banken din, må du fornye den innen 12.09.2025.

Hvis du ikke gjør dette i tide, vil BankID-en slutte å fungere.

https://bankid.no/login

Vennligst fullfør fornyelsen innen 12.09.2025 kl. 15:05 for å kunne fortsette å bruke BankID.

BankID-teamet`;

  console.log('Entering BankID phishing text...');
  await page.fill('.input-field', bankIDText);

  // Wait for button to be enabled
  await page.waitForTimeout(500);
  await page.waitForSelector('.check-button:not([disabled])');

  // Click the check button
  console.log('Clicking Sjekk button...');
  await page.click('.check-button');

  // Wait for results
  await page.waitForSelector('.result', { timeout: 30000 });

  // Get the result text
  const resultCategory = await page.textContent('.result-header');
  const summaryText = await page.textContent('.text-prompt p');
  const recommendations = await page.$$eval('.recommendation', els =>
    els.map(el => el.textContent)
  );

  console.log('\n=== RESULTS ===');
  console.log('Category:', resultCategory);
  console.log('Summary:', summaryText);
  console.log('Recommendations:', recommendations);

  // Check if it's correctly classified as fraud
  const isFraud = resultCategory?.includes('svindel') || resultCategory?.includes('%');
  const isSuspicious = resultCategory?.toLowerCase().includes('mistenkelig');

  console.log('\n=== ANALYSIS ===');
  if (isFraud) {
    console.log('✅ Correctly classified as FRAUD');
  } else if (isSuspicious) {
    console.log('⚠️ WARNING: Only classified as SUSPICIOUS - should be FRAUD!');
  } else {
    console.log('❌ ERROR: Not properly classified');
  }

  // Keep browser open for 10 seconds to see the result
  await page.screenshot({ path: 'bankid-test-result.png', fullPage: true });
  console.log('\nScreenshot saved as bankid-test-result.png');

  await page.waitForTimeout(10000);
  await browser.close();
})();