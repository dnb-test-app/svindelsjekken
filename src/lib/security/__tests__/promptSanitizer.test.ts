import { describe, it, expect } from '@jest/globals';
import {
  sanitizeUserInput,
  validateInput,
  escapeForPrompt
} from '../promptSanitizer';

describe('promptSanitizer', () => {
  describe('sanitizeUserInput', () => {
    it('should pass through normal text unchanged', () => {
      const text = 'This is normal text about banking';
      const result = sanitizeUserInput(text);
      expect(result.warnings.length).toBe(0);
      expect(result.sanitized).toBe(text);
    });

    it('should truncate at 10000 characters', () => {
      const longText = 'a'.repeat(15000);
      const result = sanitizeUserInput(longText);
      expect(result.sanitized.length).toBe(10000);
      expect(result.warnings).toContain('Input truncated to maximum length');
    });

    it('should remove control characters', () => {
      const text = 'Normal\x00text\x01with\x02control';
      const result = sanitizeUserInput(text);
      expect(result.sanitized).toBe('Normaltextwithcontrol');
      expect(result.warnings).toContain('Control characters removed');
    });

    it('should remove zero-width Unicode', () => {
      const text = 'test\u200Bword';
      const result = sanitizeUserInput(text);
      expect(result.sanitized).toBe('testword');
      expect(result.sanitized).not.toContain('\u200B');
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

  describe('escapeForPrompt', () => {
    it('should escape backslashes', () => {
      expect(escapeForPrompt('C:\\file')).toBe('C:\\\\file');
    });

    it('should escape quotes', () => {
      expect(escapeForPrompt('Say "hello"')).toBe('Say \\"hello\\"');
    });

    it('should escape newlines', () => {
      expect(escapeForPrompt('line1\nline2')).toBe('line1\\nline2');
    });

    it('should escape tabs', () => {
      expect(escapeForPrompt('col1\tcol2')).toBe('col1\\tcol2');
    });

    it('should escape carriage returns', () => {
      expect(escapeForPrompt('text\rmore')).toBe('text\\rmore');
    });
  });
});
