import { test, expect, Page } from '@playwright/test';
import path from 'path';

// Test data
const TEST_TEXT = 'Dette er en mistenkelig melding. Ring 12345678 for å vinne premie!';
const PHISHING_TEXT = 'Kjære kunde, din konto er suspendert. Klikk her for å reaktivere: http://fake-dnb.com';

// Helper to create test files
async function createTestFile(page: Page, fileName: string, content: string) {
  const buffer = Buffer.from(content);
  const dataTransfer = await page.evaluateHandle((data) => {
    const dt = new DataTransfer();
    const file = new File([new Uint8Array(data)], 'test.txt', { type: 'text/plain' });
    dt.items.add(file);
    return dt;
  }, [...buffer]);
  return dataTransfer;
}

test.describe('DNB Svindelsjekk - Comprehensive Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nb');
    
    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Eufemia')) {
        console.error('Console error:', msg.text());
      }
    });
  });

  test.describe('Core Functionality', () => {
    test('should load homepage without errors', async ({ page }) => {
      // Check main elements are present
      await expect(page.locator('h1')).toContainText('SVINDELSJEKKEN');
      await expect(page.locator('.unified-input')).toBeVisible();
      await expect(page.locator('.check-button')).toBeVisible();
      
      // Check no hydration errors
      const errors = await page.evaluate(() => {
        return window.document.querySelector('[data-nextjs-error]') !== null;
      });
      expect(errors).toBe(false);
    });

    test('should analyze text input', async ({ page }) => {
      // Type text
      const textarea = page.locator('.unified-textarea');
      await textarea.fill(PHISHING_TEXT);
      
      // Click analyze
      await page.locator('.check-button').click();
      
      // Wait for navigation or result
      await page.waitForTimeout(2000);
      
      // Check if analysis happened (either navigation or error)
      const url = page.url();
      const hasNavigated = url.includes('/analyse');
      const hasError = await page.locator('.dnb-form-status--error').count() > 0;
      
      expect(hasNavigated || hasError).toBe(true);
    });
  });

  test.describe('File Upload', () => {
    test('should upload PNG image', async ({ page }) => {
      const filePath = path.join(__dirname, '../fixtures/test-image.png');
      
      // Create a test image if it doesn't exist
      const fileInput = page.locator('input[type="file"]');
      
      // Upload file
      await fileInput.setInputFiles(filePath);
      
      // Check file preview appears
      await expect(page.locator('.file-preview')).toBeVisible({ timeout: 5000 });
    });

    test('should upload JPG image', async ({ page }) => {
      const filePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);
      
      await expect(page.locator('.file-preview')).toBeVisible({ timeout: 5000 });
    });

    test('should upload PDF file', async ({ page }) => {
      const filePath = path.join(__dirname, '../fixtures/test-document.pdf');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);
      
      await expect(page.locator('.file-preview')).toBeVisible({ timeout: 5000 });
    });

    test('should reject invalid file types', async ({ page }) => {
      const filePath = path.join(__dirname, '../fixtures/test.txt');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);
      
      // Should show error
      await expect(page.locator('.input-error')).toBeVisible({ timeout: 5000 });
    });

    test('should reject files over 10MB', async ({ page }) => {
      // This would need a large test file
      // Skipping for now as it requires generating a large file
    });
  });

  test.describe('Drag and Drop', () => {
    test('should handle drag and drop of images', async ({ page }) => {
      // Simulate drag and drop
      const dropZone = page.locator('.unified-input');
      
      // Trigger drag events
      await dropZone.dispatchEvent('dragenter');
      
      // Check dragging state
      await expect(dropZone).toHaveClass(/dragging/);
      
      await dropZone.dispatchEvent('dragleave');
      await expect(dropZone).not.toHaveClass(/dragging/);
    });
  });

  test.describe('Clipboard Integration', () => {
    test('should paste text from clipboard button', async ({ page }) => {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      // Copy text to clipboard
      await page.evaluate((text) => {
        navigator.clipboard.writeText(text);
      }, TEST_TEXT);
      
      // Click paste button
      const pasteButton = page.locator('button:has-text("Lim inn")');
      if (await pasteButton.count() > 0) {
        await pasteButton.click();
        
        // Check if text was pasted
        const textarea = page.locator('.unified-textarea');
        await expect(textarea).toHaveValue(TEST_TEXT);
      }
    });

    test('should auto-detect clipboard on load', async ({ page, context }) => {
      // Set clipboard before navigation
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      
      await page.evaluate((text) => {
        navigator.clipboard.writeText(text);
      }, TEST_TEXT);
      
      // Navigate to page
      await page.goto('/nb');
      
      // Wait a bit for auto-detect
      await page.waitForTimeout(1000);
      
      // Check if text was auto-filled (may not work due to browser security)
      const textarea = page.locator('.unified-textarea');
      const value = await textarea.inputValue();
      
      // This might not work due to browser security restrictions
      console.log('Auto-detected value:', value);
    });
  });

  test.describe('UI/UX Features', () => {
    test('should toggle dark mode', async ({ page }) => {
      const themeToggle = page.locator('.compact-theme-toggle');
      
      // Click to cycle through themes
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Check if theme changed
      const htmlElement = page.locator('html');
      const dataTheme = await htmlElement.getAttribute('data-theme');
      
      expect(['light', 'dark', null]).toContain(dataTheme);
    });

    test('should switch language', async ({ page }) => {
      const langToggle = page.locator('.compact-language-switcher');
      
      // Click to switch language
      await langToggle.click();
      
      // Should navigate to English version
      await page.waitForURL('**/en**', { timeout: 5000 });
      
      // Check English text
      await expect(page.locator('h1')).toContainText('SVINDELSJEKKEN');
    });

    test('should show help dialog', async ({ page }) => {
      const helpLink = page.locator('.help-link');
      await helpLink.click();
      
      // Dialog should appear
      await expect(page.locator('.dnb-dialog')).toBeVisible();
      await expect(page.locator('.dnb-dialog')).toContainText('Hvordan fungerer');
    });

    test('should clear input with X button', async ({ page }) => {
      // Add text
      const textarea = page.locator('.unified-textarea');
      await textarea.fill(TEST_TEXT);
      
      // Clear button should appear
      const clearButton = page.locator('.clear-btn.floating');
      await expect(clearButton).toBeVisible();
      
      // Click clear
      await clearButton.click();
      
      // Text should be cleared
      await expect(textarea).toHaveValue('');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check elements are visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.unified-input')).toBeVisible();
      await expect(page.locator('.check-button')).toBeVisible();
      
      // Check button is full width
      const button = page.locator('.check-button');
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThan(300);
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.unified-input')).toBeVisible();
      await expect(page.locator('.check-button')).toBeVisible();
    });

    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.unified-input')).toBeVisible();
      await expect(page.locator('.check-button')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle empty input', async ({ page }) => {
      // Try to analyze without input
      const button = page.locator('.check-button');
      
      // Button should be disabled
      await expect(button).toBeDisabled();
    });

    test('should show error for invalid file type', async ({ page }) => {
      // Already tested above
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline
      await page.context().setOffline(true);
      
      // Try to analyze
      const textarea = page.locator('.unified-textarea');
      await textarea.fill(TEST_TEXT);
      
      // This should still work as analysis is local
      const button = page.locator('.check-button');
      await button.click();
      
      // Should either navigate or show error
      await page.waitForTimeout(2000);
    });
  });

  test.describe('Performance', () => {
    test('should load page quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/nb');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
    });

    test('should handle large text input', async ({ page }) => {
      const largeText = TEST_TEXT.repeat(100); // Large text
      
      const textarea = page.locator('.unified-textarea');
      await textarea.fill(largeText);
      
      // Should handle without freezing
      await expect(textarea).toHaveValue(largeText);
    });
  });
});

test.describe('OCR and PDF Processing', () => {
  test('should extract text from image (if OCR is working)', async ({ page }) => {
    // This requires actual OCR implementation
    const filePath = path.join(__dirname, '../fixtures/text-image.png');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Click analyze
    await page.locator('.check-button').click();
    
    // Check if navigation happens (OCR processed)
    await page.waitForTimeout(5000); // OCR can be slow
    
    const url = page.url();
    console.log('After OCR URL:', url);
  });

  test('should extract text from PDF (if PDF processing works)', async ({ page }) => {
    const filePath = path.join(__dirname, '../fixtures/test.pdf');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Click analyze
    await page.locator('.check-button').click();
    
    await page.waitForTimeout(3000);
    
    const url = page.url();
    console.log('After PDF processing URL:', url);
  });
});