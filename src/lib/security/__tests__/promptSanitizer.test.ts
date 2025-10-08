import { describe, it, expect } from '@jest/globals';
import {
  sanitizeUserInput,
  validateInput
} from '../promptSanitizer';

describe('promptSanitizer', () => {
  describe('sanitizeUserInput', () => {
    it('should pass through normal text unchanged', () => {
      const text = 'This is normal text about banking';
      const result = sanitizeUserInput(text);
      expect(result.warnings.length).toBe(0);
      expect(result.sanitized).toBe(text);
    });

    it('should remove control characters', () => {
      const text = 'Hello\x00World\x1F!';
      const result = sanitizeUserInput(text);
      expect(result.sanitized).toBe('HelloWorld!');
      expect(result.warnings).toContain('Removed control characters or invisible Unicode');
    });

    it('should remove zero-width Unicode characters', () => {
      const text = 'Hello\u200BWorld\u200C!';
      const result = sanitizeUserInput(text);
      expect(result.sanitized).toBe('HelloWorld!');
      expect(result.warnings).toContain('Removed control characters or invisible Unicode');
    });

    it('should truncate at 10000 characters', () => {
      const longText = 'a'.repeat(15000);
      const result = sanitizeUserInput(longText);
      expect(result.sanitized.length).toBe(10000);
      expect(result.warnings).toContain('Input truncated to maximum length');
    });
  });

  describe('validateInput', () => {
    it('should accept text over 5 characters', () => {
      const result = validateInput('Hello world');
      expect(result.valid).toBe(true);
    });

    it('should reject text under 5 characters', () => {
      const result = validateInput('Hi');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Input too short');
    });

    it('should reject whitespace-only input', () => {
      const result = validateInput('     ');
      expect(result.valid).toBe(false);
    });
  });
});
