import { describe, it, expect } from '@jest/globals';
import {
  hasNorwegianPhoneNumber,
  hasBankAccountNumber,
} from '../fraudDetection';

describe('fraudDetection', () => {
  describe('hasNorwegianPhoneNumber', () => {
    it('should detect Norwegian phone numbers with spaces', () => {
      expect(hasNorwegianPhoneNumber('Ring oss på 23 45 67 89')).toBe(true);
    });

    it('should detect Norwegian phone numbers without spaces', () => {
      expect(hasNorwegianPhoneNumber('Nummer: 23456789')).toBe(true);
    });

    it('should detect phone numbers with country code', () => {
      expect(hasNorwegianPhoneNumber('Call +47 23 45 67 89')).toBe(true);
    });

    it('should detect phone numbers with alternative formats', () => {
      expect(hasNorwegianPhoneNumber('Kontakt: 23-45-67-89')).toBe(true);
    });

    it('should not match invalid phone numbers', () => {
      expect(hasNorwegianPhoneNumber('1234')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(hasNorwegianPhoneNumber('')).toBe(false);
    });
  });

  describe('hasBankAccountNumber', () => {
    it('should detect Norwegian bank account numbers', () => {
      expect(hasBankAccountNumber('1234.56.78901')).toBe(true);
    });

    it('should detect account numbers without periods', () => {
      expect(hasBankAccountNumber('12345678901')).toBe(true);
    });

    it('should detect IBANs', () => {
      expect(hasBankAccountNumber('NO9386011117947')).toBe(true);
    });

    it('should not match invalid account numbers', () => {
      expect(hasBankAccountNumber('123')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(hasBankAccountNumber('')).toBe(false);
    });
  });
});
