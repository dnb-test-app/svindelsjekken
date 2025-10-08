import { describe, it, expect } from '@jest/globals';
import {
  sanitizeUserInput,
  validateInput,
  escapeForPrompt
} from '../promptSanitizer';

describe('promptSanitizer', () => {
  describe('sanitizeUserInput', () => {
    it('should allow clean input without warnings', () => {
      const result = sanitizeUserInput('This is normal text about banking');
      expect(result.warnings.length).toBe(0);
      expect(result.sanitized).toBe('This is normal text about banking');
    });

    it('should truncate overly long input', () => {
      const longText = 'a'.repeat(15000);
      const result = sanitizeUserInput(longText);
      expect(result.sanitized.length).toBeLessThanOrEqual(10000);
      expect(result.warnings).toContain('Input truncated to maximum length');
    });

    it('should remove control characters', () => {
      const textWithControl = 'Normal text\x00\x01\x02with control chars';
      const result = sanitizeUserInput(textWithControl);
      expect(result.sanitized).not.toMatch(/[\x00-\x08]/);
      expect(result.warnings).toContain('Control characters removed');
    });

    it('should escape system delimiters', () => {
      const result = sanitizeUserInput('[USER_INPUT_START] text [USER_INPUT_END]');
      expect(result.sanitized).toContain('[USER-INPUT-START]');
      expect(result.sanitized).toContain('[USER-INPUT-END]');
    });

    it('should escape SYSTEM CONTEXT delimiters', () => {
      const result = sanitizeUserInput('[SYSTEM CONTEXT] text [END SYSTEM CONTEXT]');
      expect(result.sanitized).toContain('[SYSTEM-CONTEXT]');
      expect(result.sanitized).toContain('[END-SYSTEM-CONTEXT]');
    });

    it('should handle Norwegian text correctly', () => {
      const result = sanitizeUserInput('Dette er en vanlig norsk melding med æøå');
      expect(result.sanitized).toContain('æøå');
    });

    it('should allow legitimate fraud reports', () => {
      const fraudReport = 'jeg fikk en SMS som sa "jeg er fra DNB"';
      const result = sanitizeUserInput(fraudReport);
      expect(result.warnings.length).toBe(0);
      expect(result.sanitized).toContain('jeg er fra DNB');
    });

    it('should allow reports with fake DNB domains for AI analysis', () => {
      const result = sanitizeUserInput('Visit dnb-support.com for help');
      expect(result.warnings.length).toBe(0);
      expect(result.sanitized).toContain('dnb-support.com');
    });

    it('should allow injection-like patterns in fraud reports', () => {
      const result = sanitizeUserInput('The email said to ignore previous emails');
      expect(result.warnings.length).toBe(0);
      expect(result.sanitized).toContain('ignore previous');
    });
  });

  describe('validateInput', () => {
    it('should accept valid input', () => {
      const result = validateInput('This is a normal message about banking');
      expect(result.valid).toBe(true);
    });

    it('should reject input that is too short', () => {
      const result = validateInput('Hi');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('too short');
    });

    it('should reject input with insufficient unique characters', () => {
      const result = validateInput('aaaaaaaaaaaaa');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('meaningful content');
    });

    it('should reject input with excessive repetition (DoS prevention)', () => {
      const repeatedText = 'spam spam spam spam spam spam spam spam spam spam spam spam';
      const result = validateInput(repeatedText);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('repetition');
    });

    it('should accept varied input', () => {
      const result = validateInput('I received a suspicious email asking for my password');
      expect(result.valid).toBe(true);
    });

    it('should handle whitespace correctly', () => {
      const result = validateInput('     Short     ');
      expect(result.valid).toBe(false);
    });

    it('should accept input at minimum length threshold', () => {
      const result = validateInput('Hello world');
      expect(result.valid).toBe(true);
    });
  });

  describe('escapeForPrompt', () => {
    it('should escape backslashes', () => {
      const result = escapeForPrompt('C:\\Users\\file');
      expect(result).toBe('C:\\\\Users\\\\file');
    });

    it('should escape double quotes', () => {
      const result = escapeForPrompt('He said "hello"');
      expect(result).toBe('He said \\"hello\\"');
    });

    it('should escape newlines', () => {
      const result = escapeForPrompt('Line 1\nLine 2');
      expect(result).toBe('Line 1\\nLine 2');
    });

    it('should escape carriage returns', () => {
      const result = escapeForPrompt('Text\rMore text');
      expect(result).toBe('Text\\rMore text');
    });

    it('should escape tabs', () => {
      const result = escapeForPrompt('Column1\tColumn2');
      expect(result).toBe('Column1\\tColumn2');
    });

    it('should handle multiple escape sequences', () => {
      const result = escapeForPrompt('Text with\n"quotes"\tand\\backslash');
      expect(result).toBe('Text with\\n\\"quotes\\"\\tand\\\\backslash');
    });

    it('should not modify safe text', () => {
      const result = escapeForPrompt('Safe normal text');
      expect(result).toBe('Safe normal text');
    });
  });

  describe('Integration tests', () => {
    it('should allow legitimate customer inquiry', () => {
      const legitimate = `
        Jeg mottok en e-post som sa at DNB-kontoen min var sperret.
        E-posten ba meg klikke på en lenke for å reaktivere kontoen.
        Er dette en legitim e-post fra DNB?
      `;

      const sanitized = sanitizeUserInput(legitimate);
      expect(sanitized.warnings.length).toBe(0);

      const validated = validateInput(legitimate);
      expect(validated.valid).toBe(true);
    });

    it('should properly sanitize and validate in sequence', () => {
      const input = 'This is a test message with sufficient length';

      const sanitized = sanitizeUserInput(input);
      expect(sanitized.warnings.length).toBe(0);

      const validated = validateInput(sanitized.sanitized);
      expect(validated.valid).toBe(true);

      const escaped = escapeForPrompt(sanitized.sanitized);
      expect(escaped).toBeTruthy();
    });
  });

  describe('Security edge cases', () => {
    it('should handle Unicode zero-width characters', () => {
      const textWithZeroWidth = 'Normal\u200Btext\u200Cwith\u200Dzero\u200Ewidth';
      const result = sanitizeUserInput(textWithZeroWidth);
      expect(result.sanitized.length).toBeLessThan(textWithZeroWidth.length);
    });

    it('should handle empty input', () => {
      const result = sanitizeUserInput('');
      expect(result.sanitized).toBe('');

      const validated = validateInput('');
      expect(validated.valid).toBe(false);
    });

    it('should handle input with only whitespace', () => {
      const result = sanitizeUserInput('     ');
      const validated = validateInput(result.sanitized);
      expect(validated.valid).toBe(false);
    });
  });
});
