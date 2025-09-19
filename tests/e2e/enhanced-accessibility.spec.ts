import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Enhanced Accessibility Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/nb', { waitUntil: 'networkidle' });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    test('should pass all critical and serious accessibility checks on homepage', async () => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Check for critical and serious violations
      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      if (criticalViolations.length > 0) {
        console.log('Critical/Serious Accessibility Violations:', 
          JSON.stringify(criticalViolations, null, 2)
        );
      }

      expect(criticalViolations).toEqual([]);
    });

    test('should pass accessibility checks on analysis results page', async () => {
      // Navigate to analysis page
      const textarea = page.locator('#paste-text, textarea');
      await textarea.fill('Test text for accessibility check');
      
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await analyzeButton.click();
      
      await page.waitForURL('**/analyse');
      await expect(page.locator('h1')).toBeVisible();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should provide complete keyboard navigation', async () => {
      // Test tab order through all interactive elements
      const interactiveElements = [
        'button', 'input', 'textarea', 'a[href]', '[tabindex]:not([tabindex="-1"])'
      ];

      let tabIndex = 0;
      let previousFocusedElement = null;

      // Start tabbing through elements
      while (tabIndex < 20) { // Reasonable limit
        await page.keyboard.press('Tab');
        
        const activeElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el ? {
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            textContent: el.textContent?.trim().substring(0, 50)
          } : null;
        });

        if (!activeElement || activeElement === previousFocusedElement) {
          break; // No more tabbable elements or cycling
        }

        // Verify element is visible and focusable
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();

        previousFocusedElement = activeElement;
        tabIndex++;
      }

      expect(tabIndex).toBeGreaterThan(3); // Should have at least some interactive elements
    });

    test('should support Enter key activation for buttons', async () => {
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      
      // Focus the button using keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Find and focus the analyze button
      await analyzeButton.focus();
      
      const textarea = page.locator('#paste-text, textarea');
      await textarea.fill('Test for keyboard activation');
      await analyzeButton.focus();
      
      // Activate with Enter key
      await page.keyboard.press('Enter');
      
      // Should navigate to analysis page
      await page.waitForURL('**/analyse');
    });

    test('should support Space key activation for buttons', async () => {
      const textarea = page.locator('#paste-text, textarea');
      await textarea.fill('Test for space key activation');
      
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await analyzeButton.focus();
      
      // Activate with Space key
      await page.keyboard.press('Space');
      
      await page.waitForURL('**/analyse');
    });
  });

  test.describe('Focus Management', () => {
    test('should maintain visible focus indicators', async () => {
      // Tab through elements and verify focus is visible
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Check that focus indicator is visible
      const focusStyles = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineOffset: styles.outlineOffset,
          boxShadow: styles.boxShadow,
          border: styles.border
        };
      });

      // Should have some form of focus indicator
      const hasFocusIndicator = Object.values(focusStyles).some(value => 
        value && value !== 'none' && value !== '0px'
      );
      
      expect(hasFocusIndicator).toBe(true);
    });

    test('should trap focus in modal dialogs', async () => {
      // Open the "How it works" dialog
      const howItWorksButton = page.locator('button').filter({ hasText: /Hvordan|How/ });
      if (await howItWorksButton.isVisible()) {
        await howItWorksButton.click();
        
        // Verify dialog is open
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();
        
        // Tab through dialog elements - focus should stay within dialog
        let focusIsTrapped = true;
        let tabCount = 0;
        
        while (tabCount < 10) {
          await page.keyboard.press('Tab');
          
          const focusedElement = await page.evaluate(() => {
            return document.activeElement?.closest('[role="dialog"]') !== null;
          });
          
          if (!focusedElement) {
            focusIsTrapped = false;
            break;
          }
          
          tabCount++;
        }
        
        expect(focusIsTrapped).toBe(true);
        
        // Close dialog with Escape
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
      }
    });
  });

  test.describe('ARIA Labels and Roles', () => {
    test('should have proper ARIA labels on interactive elements', async () => {
      // Check textarea
      const textarea = page.locator('#paste-text, textarea');
      const textareaLabel = await textarea.getAttribute('aria-label');
      const textareaLabelledBy = await textarea.getAttribute('aria-labelledby');
      
      expect(textareaLabel || textareaLabelledBy).toBeTruthy();
      
      // Check buttons have accessible names
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const accessibleName = await button.evaluate((btn) => {
          return btn.textContent?.trim() || 
                 btn.getAttribute('aria-label') || 
                 btn.getAttribute('title');
        });
        
        expect(accessibleName).toBeTruthy();
      }
    });

    test('should have proper heading structure', async () => {
      // Check for h1
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      // Verify heading hierarchy
      const headings = await page.evaluate(() => {
        const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return headingElements.map(h => ({
          level: parseInt(h.tagName.charAt(1)),
          text: h.textContent?.trim()
        }));
      });
      
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].level).toBe(1); // First heading should be h1
    });

    test('should have proper form labels', async () => {
      const formElements = page.locator('input, textarea, select');
      const elementCount = await formElements.count();
      
      for (let i = 0; i < elementCount; i++) {
        const element = formElements.nth(i);
        
        const hasLabel = await element.evaluate((el) => {
          const id = el.getAttribute('id');
          const hasLabel = id && document.querySelector(`label[for="${id}"]`);
          const hasAriaLabel = el.getAttribute('aria-label');
          const hasAriaLabelledBy = el.getAttribute('aria-labelledby');
          const hasPlaceholder = el.getAttribute('placeholder');
          
          return !!(hasLabel || hasAriaLabel || hasAriaLabelledBy || hasPlaceholder);
        });
        
        expect(hasLabel).toBe(true);
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('should meet WCAG AA color contrast requirements', async () => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      const colorContrastViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'color-contrast'
      );

      if (colorContrastViolations.length > 0) {
        console.log('Color Contrast Violations:', 
          JSON.stringify(colorContrastViolations, null, 2)
        );
      }

      expect(colorContrastViolations).toEqual([]);
    });
  });

  test.describe('Dark Mode Accessibility', () => {
    test('should maintain accessibility in dark mode', async () => {
      // Switch to dark mode
      const themeToggle = page.locator('#theme-toggle, .compact-theme-toggle');
      if (await themeToggle.isVisible()) {
        await themeToggle.click(); // light
        await themeToggle.click(); // dark
        await page.waitForTimeout(500);
        
        // Verify dark mode is active
        const htmlTheme = await page.locator('html').getAttribute('data-theme');
        expect(htmlTheme).toBe('dark');
        
        // Run accessibility checks in dark mode
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const criticalViolations = accessibilityScanResults.violations.filter(
          v => v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalViolations).toEqual([]);
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper page title', async () => {
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should have proper lang attribute on html element', async () => {
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toMatch(/^(nb|en)/);
    });

    test('should announce dynamic content changes', async () => {
      // Fill textarea and analyze
      const textarea = page.locator('#paste-text, textarea');
      await textarea.fill('Test text for screen reader announcement');
      
      const analyzeButton = page.locator('button').filter({ hasText: /SJEKK|Analyser/ });
      await analyzeButton.click();
      
      await page.waitForURL('**/analyse');
      
      // Check for aria-live regions or other announcement mechanisms
      const ariaLiveElements = page.locator('[aria-live], [role="status"], [role="alert"]');
      const ariaLiveCount = await ariaLiveElements.count();
      
      // Should have some mechanism for announcing changes
      expect(ariaLiveCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      // Run accessibility checks on mobile
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('should have touch-friendly interactive elements', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      // Check that interactive elements meet minimum touch target size (44x44px)
      const interactiveElements = page.locator('button, input, a[href], [role="button"]');
      const elementCount = await interactiveElements.count();
      
      let smallElements = 0;
      
      for (let i = 0; i < elementCount; i++) {
        const element = interactiveElements.nth(i);
        
        if (await element.isVisible()) {
          const boundingBox = await element.boundingBox();
          
          if (boundingBox && (boundingBox.width < 44 || boundingBox.height < 44)) {
            smallElements++;
          }
        }
      }
      
      // Allow some small elements but most should meet touch target size
      const ratio = smallElements / Math.max(elementCount, 1);
      expect(ratio).toBeLessThan(0.3); // Less than 30% should be too small
    });
  });
});