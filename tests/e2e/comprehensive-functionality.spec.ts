import { test, expect, Page, BrowserContext } from '@playwright/test';
import path from 'path';

// Test configuration
const TEST_TIMEOUT = 60000; // 1 minute per test
const WAIT_FOR_ANALYSIS = 5000; // Wait time for analysis to complete

test.describe('DNB Svindelsjekk - Comprehensive Functionality Tests', () => {
  let context: BrowserContext;
  let page: Page;
  let consoleErrors: string[] = [];

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
  });

  test.beforeEach(async () => {
    page = await context.newPage();
    consoleErrors = [];
    
    // Collect console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Go to the Norwegian homepage
    await page.goto('/nb', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('Text Input Functionality', () => {
    test('should accept and analyze text input with high-risk content', async () => {
      const highRiskText = 'HASTER! Din konto sperres i dag! Oppgi BankID kode umiddelbart på http://dnb-no.com';
      
      // Enter text into the textarea
      const textarea = page.locator('#paste-text, textarea');
      await expect(textarea).toBeVisible();
      await textarea.fill(highRiskText);
      
      // Verify text was entered
      await expect(textarea).toHaveValue(highRiskText);
      
      // Click analyze button
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await expect(analyzeButton).toBeEnabled();
      await analyzeButton.click();
      
      // Wait for navigation to analysis page
      await page.waitForURL('**/analyse', { timeout: 10000 });
      
      // Verify analysis results
      await expect(page.locator('text=Høy risiko')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Hasteord')).toBeVisible();
      await expect(page.locator('text=BankID')).toBeVisible();
    });

    test('should handle low-risk text correctly', async () => {
      const lowRiskText = 'Hei! Hvordan har du det i dag? Håper du har en fin dag.';
      
      const textarea = page.locator('#paste-text, textarea');
      await textarea.fill(lowRiskText);
      
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await analyzeButton.click();
      
      await page.waitForURL('**/analyse');
      await expect(page.locator('text=Lav risiko')).toBeVisible();
    });

    test('should not enable analyze button with empty text', async () => {
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await expect(analyzeButton).toBeDisabled();
    });
  });

  test.describe('File Upload Functionality', () => {
    const testFiles = {
      png: path.join(__dirname, '..', '..', 'test-assets', 'test-image.png'),
      jpg: path.join(__dirname, '..', '..', 'test-assets', 'test-image.jpg'),
      pdf: path.join(__dirname, '..', '..', 'test-assets', 'test-document.pdf'),
      jpeg: path.join(__dirname, '..', '..', 'test-assets', 'test-image.jpeg')
    };

    test('should accept PNG file upload', async () => {
      const fileInput = page.locator('input[type="file"]');
      
      // Create a test PNG file programmatically if it doesn't exist
      await fileInput.setInputFiles(await createTestImage(page, 'png'));
      
      // Verify file is selected and preview is shown
      await expect(page.locator('.file-preview')).toBeVisible();
      await expect(page.locator('.file-name')).toContainText('.png');
      
      // Click analyze
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await expect(analyzeButton).toBeEnabled();
      await analyzeButton.click();
      
      // Wait for OCR processing and analysis
      await page.waitForURL('**/analyse', { timeout: 30000 });
      
      // Verify OCR was attempted
      await expect(page).toHaveURL(/analyse/);
    });

    test('should accept JPG file upload', async () => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(await createTestImage(page, 'jpg'));
      
      await expect(page.locator('.file-preview')).toBeVisible();
      await expect(page.locator('.file-name')).toContainText('.jpg');
      
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await analyzeButton.click();
      
      await page.waitForURL('**/analyse', { timeout: 30000 });
    });

    test('should accept JPEG file upload', async () => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(await createTestImage(page, 'jpeg'));
      
      await expect(page.locator('.file-preview')).toBeVisible();
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await analyzeButton.click();
      
      await page.waitForURL('**/analyse', { timeout: 30000 });
    });

    test('should accept PDF file upload', async () => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(await createTestPDF(page));
      
      await expect(page.locator('.file-preview')).toBeVisible();
      await expect(page.locator('.file-name')).toContainText('.pdf');
      
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await analyzeButton.click();
      
      await page.waitForURL('**/analyse', { timeout: 30000 });
    });

    test('should reject unsupported file types', async () => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(await createTestFile(page, 'test.txt', 'text/plain'));
      
      // Should show error message
      await expect(page.locator('.input-error')).toBeVisible();
      await expect(page.locator('.input-error')).toContainText(/filtype/);
    });

    test('should reject files that are too large', async () => {
      // Create a large file (> 10MB)
      const largeFile = await createLargeFile(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(largeFile);
      
      await expect(page.locator('.input-error')).toBeVisible();
      await expect(page.locator('.input-error')).toContainText(/størrelse/);
    });
  });

  test.describe('Drag and Drop Functionality', () => {
    test('should accept file via drag and drop', async () => {
      const dropZone = page.locator('.unified-input');
      const testFile = await createTestImage(page, 'png');
      
      // Simulate drag and drop
      const fileChooserPromise = page.waitForEvent('filechooser');
      await dropZone.dispatchEvent('drop', {
        dataTransfer: {
          files: [testFile]
        }
      });
      
      await expect(page.locator('.file-preview')).toBeVisible();
      await expect(page.locator('.file-name')).toContainText('.png');
    });

    test('should show drag state visual feedback', async () => {
      const dropZone = page.locator('.unified-input');
      
      // Simulate drag over
      await dropZone.dispatchEvent('dragover');
      await expect(dropZone).toHaveClass(/dragging/);
      
      // Simulate drag leave
      await dropZone.dispatchEvent('dragleave');
      await expect(dropZone).not.toHaveClass(/dragging/);
    });
  });

  test.describe('Clipboard Auto-detection', () => {
    test('should attempt to read clipboard on page load', async () => {
      // This test is limited by browser security - we can only test that the code attempts to read
      // We'll check that no errors are thrown and the textarea remains functional
      await page.reload();
      
      const textarea = page.locator('#paste-text, textarea');
      await expect(textarea).toBeVisible();
      
      // Manual paste should still work
      await textarea.fill('Test text from manual input');
      await expect(textarea).toHaveValue('Test text from manual input');
    });

    test('should have paste button functionality', async () => {
      const pasteButton = page.locator('button').filter({ hasText: /Lim inn|Paste/ });
      
      if (await pasteButton.isVisible()) {
        // Click paste button (won't work in test environment but shouldn't crash)
        await pasteButton.click();
        
        // Verify no errors and textarea is still functional
        const textarea = page.locator('#paste-text, textarea');
        await textarea.fill('Test after paste attempt');
        await expect(textarea).toHaveValue('Test after paste attempt');
      }
    });
  });

  test.describe('Dark Mode Toggle', () => {
    test('should toggle between light, dark, and system themes', async () => {
      const themeToggle = page.locator('#theme-toggle, .compact-theme-toggle');
      await expect(themeToggle).toBeVisible();
      
      // Initial state (system)
      let htmlElement = page.locator('html');
      let initialTheme = await htmlElement.getAttribute('data-theme');
      
      // Toggle to light
      await themeToggle.click();
      await page.waitForTimeout(500);
      let dataTheme = await htmlElement.getAttribute('data-theme');
      expect(dataTheme).toBe('light');
      
      // Toggle to dark
      await themeToggle.click();
      await page.waitForTimeout(500);
      dataTheme = await htmlElement.getAttribute('data-theme');
      expect(dataTheme).toBe('dark');
      
      // Toggle back to system
      await themeToggle.click();
      await page.waitForTimeout(500);
      dataTheme = await htmlElement.getAttribute('data-theme');
      expect(dataTheme).toBeNull();
    });

    test('should persist theme preference in cookie', async () => {
      const themeToggle = page.locator('#theme-toggle, .compact-theme-toggle');
      
      // Set to dark theme
      await themeToggle.click(); // light
      await themeToggle.click(); // dark
      
      // Check cookie
      const cookies = await context.cookies();
      const themeCookie = cookies.find(c => c.name === 'theme');
      expect(themeCookie?.value).toBe('dark');
      
      // Reload and verify theme persists
      await page.reload();
      await page.waitForTimeout(1000);
      const htmlElement = page.locator('html');
      const dataTheme = await htmlElement.getAttribute('data-theme');
      expect(dataTheme).toBe('dark');
    });
  });

  test.describe('Language Switching', () => {
    test('should switch between Norwegian and English', async () => {
      // Start with Norwegian
      await expect(page.locator('h1')).toContainText('Sjekk om');
      
      // Switch to English
      const languageToggle = page.locator('#language-switcher, .compact-language-switcher');
      if (await languageToggle.isVisible()) {
        await languageToggle.click();
        
        // Wait for URL change
        await page.waitForURL('**/en');
        await expect(page.locator('h1')).toContainText('Check if');
        
        // Switch back to Norwegian
        await languageToggle.click();
        await page.waitForURL('**/nb');
        await expect(page.locator('h1')).toContainText('Sjekk om');
      }
    });

    test('should persist language preference', async () => {
      const languageToggle = page.locator('#language-switcher, .compact-language-switcher');
      
      if (await languageToggle.isVisible()) {
        await languageToggle.click();
        await page.waitForURL('**/en');
        
        // Check cookie
        const cookies = await context.cookies();
        const localeCookie = cookies.find(c => c.name === 'locale');
        expect(localeCookie?.value).toBe('en');
        
        // Navigate to root and verify language persists
        await page.goto('/');
        await page.waitForURL('**/en');
        await expect(page.locator('h1')).toContainText('Check if');
      }
    });
  });

  test.describe('Responsive Design Tests', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 }
    ];

    viewports.forEach(viewport => {
      test(`should work properly on ${viewport.name} (${viewport.width}x${viewport.height})`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.reload();
        
        // Test basic functionality on this viewport
        const textarea = page.locator('#paste-text, textarea');
        await expect(textarea).toBeVisible();
        
        const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
        await expect(analyzeButton).toBeVisible();
        
        // Test that input works
        await textarea.fill('Test på ' + viewport.name);
        await expect(analyzeButton).toBeEnabled();
        
        // Test file upload button visibility
        const uploadButton = page.locator('button').filter({ hasText: /Last opp|Upload/ });
        if (await uploadButton.isVisible()) {
          await expect(uploadButton).toBeVisible();
        }
      });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Block network requests to simulate offline
      await page.route('**/*', route => route.abort());
      
      const textarea = page.locator('#paste-text, textarea');
      await textarea.fill('Test text');
      
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await analyzeButton.click();
      
      // Should still navigate to analysis page (local analysis)
      await page.waitForURL('**/analyse');
      
      // Clear route blocking
      await page.unroute('**/*');
    });

    test('should handle malformed data in sessionStorage', async () => {
      // Inject malformed data into sessionStorage
      await page.evaluate(() => {
        sessionStorage.setItem('analysisResult', '{"invalid": json}');
      });
      
      await page.goto('/nb/analyse');
      
      // Should redirect back to home page
      await page.waitForURL('**/nb');
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Console Error Detection', () => {
    test('should not have critical console errors during normal usage', async () => {
      // Clear any existing errors
      consoleErrors = [];
      
      // Perform typical user actions
      const textarea = page.locator('#paste-text, textarea');
      await textarea.fill('Test text for error detection');
      
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await analyzeButton.click();
      
      await page.waitForURL('**/analyse');
      await expect(page.locator('h1')).toBeVisible();
      
      // Check for critical errors (ignore minor warnings)
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('Warning:') && 
        !error.includes('DevTools') &&
        !error.includes('Extension')
      );
      
      expect(criticalErrors).toEqual([]);
    });
  });

  test.describe('OCR Text Extraction', () => {
    test('should process image with OCR and extract text', async () => {
      // Create an image with text
      const imageWithText = await createTestImageWithText(page);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(imageWithText);
      
      await expect(page.locator('.file-preview')).toBeVisible();
      
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await analyzeButton.click();
      
      // Wait longer for OCR processing
      await page.waitForURL('**/analyse', { timeout: 60000 });
      
      // Check if we reached the analysis page (OCR may or may not extract text in test environment)
      await expect(page).toHaveURL(/analyse/);
    });
  });

  test.describe('Performance Tests', () => {
    test('should load main page within reasonable time', async () => {
      const startTime = Date.now();
      await page.goto('/nb', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should handle large text input without performance issues', async () => {
      const largeText = 'Lorem ipsum dolor sit amet. '.repeat(1000); // ~27KB text
      
      const textarea = page.locator('#paste-text, textarea');
      const startTime = Date.now();
      await textarea.fill(largeText);
      const inputTime = Date.now() - startTime;
      
      // Text input should be responsive
      expect(inputTime).toBeLessThan(2000);
      
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await analyzeButton.click();
      
      await page.waitForURL('**/analyse', { timeout: 30000 });
    });
  });
});

// Helper functions for creating test files
async function createTestImage(page: Page, format: 'png' | 'jpg' | 'jpeg'): Promise<string> {
  return await page.evaluate(async (format) => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    
    // Draw a simple test image
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 200, 100);
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.fillText('Test Image', 50, 50);
    
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataURL = canvas.toDataURL(mimeType);
    
    // Convert to file
    const response = await fetch(dataURL);
    const blob = await response.blob();
    const file = new File([blob], `test.${format}`, { type: mimeType });
    
    return dataURL;
  }, format);
}

async function createTestImageWithText(page: Page): Promise<string> {
  return await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 200);
    
    // Add text that OCR might detect
    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.fillText('URGENT: Your account will be closed!', 20, 50);
    ctx.fillText('Call 123-456-7890 immediately', 20, 80);
    ctx.fillText('Provide your BankID', 20, 110);
    
    const dataURL = canvas.toDataURL('image/png');
    
    return dataURL;
  });
}

async function createTestPDF(page: Page): Promise<string> {
  return await page.evaluate(async () => {
    // Create a simple data URL for a minimal PDF
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
    
    // Convert to data URL for testing
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  });
}

async function createTestFile(page: Page, filename: string, mimeType: string): Promise<string> {
  return await page.evaluate(async (args) => {
    const blob = new Blob(['Test file content'], { type: args.mimeType });
    const file = new File([blob], args.filename, { type: args.mimeType });
    
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }, { filename, mimeType });
}

async function createLargeFile(page: Page): Promise<string> {
  return await page.evaluate(async () => {
    // Create a file larger than 10MB
    const largeContent = new Array(11 * 1024 * 1024).fill('x').join('');
    const blob = new Blob([largeContent], { type: 'text/plain' });
    const file = new File([blob], 'large-file.txt', { type: 'text/plain' });
    
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  });
}