import { describe, it, expect } from '@jest/globals';
import {
  hasNorwegianPhoneNumber,
  mentionsNorwegianBrands,
  hasBankAccountNumber,
  hasURLsNeedingVerification,
  needsWebSearchVerification,
  getWebSearchReasons
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

    it('should not match random 8-digit numbers', () => {
      expect(hasNorwegianPhoneNumber('Order #12345678')).toBe(false);
    });
  });

  describe('mentionsNorwegianBrands', () => {
    it('should detect DNB mentions', () => {
      expect(mentionsNorwegianBrands('Melding fra DNB')).toBe(true);
    });

    it('should detect BankID mentions', () => {
      expect(mentionsNorwegianBrands('Bekreft med BankID')).toBe(true);
    });

    it('should detect Vipps mentions', () => {
      expect(mentionsNorwegianBrands('Betal med Vipps')).toBe(true);
    });

    it('should detect SpareBank mentions', () => {
      expect(mentionsNorwegianBrands('Fra SpareBank 1')).toBe(true);
    });

    it('should detect Nordea mentions', () => {
      expect(mentionsNorwegianBrands('Nordea kundeservice')).toBe(true);
    });

    it('should detect Posten mentions', () => {
      expect(mentionsNorwegianBrands('Pakke fra Posten')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(mentionsNorwegianBrands('dnb vipps BANKID')).toBe(true);
    });

    it('should not match generic text', () => {
      expect(mentionsNorwegianBrands('Just some regular text')).toBe(false);
    });
  });

  describe('hasBankAccountNumber', () => {
    it('should detect Norwegian account format with dots', () => {
      expect(hasBankAccountNumber('Konto: 1234.56.78901')).toBe(true);
    });

    it('should detect Norwegian account format without dots', () => {
      expect(hasBankAccountNumber('12345678901')).toBe(true);
    });

    it('should detect account with spaces', () => {
      expect(hasBankAccountNumber('Konto: 1234 56 78901')).toBe(true);
    });

    it('should not match invalid account numbers', () => {
      expect(hasBankAccountNumber('123')).toBe(false);
    });

    it('should not match random numbers', () => {
      expect(hasBankAccountNumber('Order 123456')).toBe(false);
    });
  });

  describe('hasURLsNeedingVerification', () => {
    it('should detect URLs with minimal context', () => {
      expect(hasURLsNeedingVerification('https://example.com')).toBe(true);
    });

    it('should detect URLs with few surrounding words', () => {
      expect(hasURLsNeedingVerification('Click https://site.no')).toBe(true);
    });

    it('should not require verification for URLs with sufficient context', () => {
      const text = 'Visit our official website at https://example.com for detailed information about our products and services';
      expect(hasURLsNeedingVerification(text)).toBe(false);
    });

    it('should handle text without URLs', () => {
      expect(hasURLsNeedingVerification('No URLs here')).toBe(false);
    });

    it('should deduplicate URLs by domain', () => {
      const text = 'https://example.com and https://example.com/other';
      expect(hasURLsNeedingVerification(text)).toBe(true);
    });
  });

  describe('needsWebSearchVerification', () => {
    it('should enable web search for minimal context URLs', () => {
      expect(needsWebSearchVerification('https://suspicious-site.tk')).toBe(true);
    });

    it('should enable web search when phone numbers present', () => {
      expect(needsWebSearchVerification('Ring 23 45 67 89 for hjelp')).toBe(true);
    });

    it('should enable web search when Norwegian brands mentioned', () => {
      expect(needsWebSearchVerification('Melding fra DNB')).toBe(true);
    });

    it('should enable web search when bank accounts mentioned', () => {
      expect(needsWebSearchVerification('Overfør til konto 1234.56.78901')).toBe(true);
    });

    it('should not enable for generic text without indicators', () => {
      expect(needsWebSearchVerification('This is just regular text')).toBe(false);
    });

    it('should enable when context has imageData', () => {
      const context = { imageData: { base64: 'abc123', mimeType: 'image/png' } };
      const text = 'Some text';
      // needsWebSearchVerification only checks text content, context is passed to getWebSearchReasons
      const reasons = getWebSearchReasons(text, context);
      expect(reasons.length).toBeGreaterThan(0);
    });

    it('should handle multiple indicators', () => {
      const text = 'DNB ber deg ringe 23 45 67 89 eller besøk https://dnb.no';
      expect(needsWebSearchVerification(text)).toBe(true);
    });
  });

  describe('getWebSearchReasons', () => {
    it('should provide reason for image content', () => {
      const context = { imageData: { base64: 'abc', mimeType: 'image/png' } };
      const reasons = getWebSearchReasons('Text', context);
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons.some(r => r.includes('Image'))).toBe(true);
    });

    it('should provide reason for phone numbers', () => {
      const reasons = getWebSearchReasons('Ring 23 45 67 89');
      expect(reasons.some(r => r.includes('phone') || r.includes('telefon'))).toBe(true);
    });

    it('should provide reason for Norwegian brands', () => {
      const reasons = getWebSearchReasons('Melding fra DNB');
      expect(reasons.some(r => r.includes('brand') || r.includes('merke'))).toBe(true);
    });

    it('should provide reason for bank accounts', () => {
      const reasons = getWebSearchReasons('Konto: 1234.56.78901');
      expect(reasons.some(r => r.includes('account') || r.includes('konto'))).toBe(true);
    });

    it('should provide reason for minimal context URLs', () => {
      const reasons = getWebSearchReasons('https://site.tk');
      expect(reasons.some(r => r.includes('URL'))).toBe(true);
    });

    it('should provide multiple reasons when applicable', () => {
      const text = 'DNB meldinger: ring 23456789 eller besøk https://dnb-no.com';
      const reasons = getWebSearchReasons(text);
      expect(reasons.length).toBeGreaterThan(2);
    });

    it('should return empty array for generic text', () => {
      const reasons = getWebSearchReasons('Just regular text without indicators');
      expect(reasons.length).toBe(0);
    });
  });

  describe('Integration tests', () => {
    it('should handle comprehensive phishing scenario', () => {
      const phishing = `
        VIKTIG MELDING FRA DNB!
        Din konto er midlertidig sperret.
        Ring UMIDDELBART 23 45 67 89
        Eller besøk https://dnb-sikkerhet.tk
        Oppgi kontonummer: 1234.56.78901
      `;

      expect(mentionsNorwegianBrands(phishing)).toBe(true);
      expect(hasNorwegianPhoneNumber(phishing)).toBe(true);
      expect(hasBankAccountNumber(phishing)).toBe(true);
      expect(hasURLsNeedingVerification(phishing)).toBe(true);
      expect(needsWebSearchVerification(phishing)).toBe(true);

      const reasons = getWebSearchReasons(phishing);
      expect(reasons.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle legitimate marketing email', () => {
      const legitimate = `
        Velkommen til vår nye nettbutikk!
        Vi tilbyr kvalitetsprodukter til gode priser.
        Besøk oss på www.eksempel-butikk.no for mer informasjon.
        Her finner du alt du trenger for hjemmet.
      `;

      expect(mentionsNorwegianBrands(legitimate)).toBe(false);
      expect(hasNorwegianPhoneNumber(legitimate)).toBe(false);
      expect(hasBankAccountNumber(legitimate)).toBe(false);
      // URL has sufficient context, so should not need verification
      expect(hasURLsNeedingVerification(legitimate)).toBe(false);
    });

    it('should detect mixed indicators correctly', () => {
      const mixed = 'Kontakt SpareBank på 23456789 for konto 1234.56.78901';

      expect(mentionsNorwegianBrands(mixed)).toBe(true);
      expect(hasNorwegianPhoneNumber(mixed)).toBe(true);
      expect(hasBankAccountNumber(mixed)).toBe(true);
      expect(needsWebSearchVerification(mixed)).toBe(true);
    });

    it('should handle edge case with legitimate DNB reference', () => {
      const legitimate = `
        Jeg har en legitim konto hos DNB og lurer på noe.
        Jeg har ikke fått svar på e-posten jeg sendte til kundeservice.
        Kan dere hjelpe meg?
      `;

      expect(mentionsNorwegianBrands(legitimate)).toBe(true);
      expect(needsWebSearchVerification(legitimate)).toBe(true);

      const reasons = getWebSearchReasons(legitimate);
      // Should recommend web search for brand verification
      expect(reasons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty input', () => {
      expect(hasNorwegianPhoneNumber('')).toBe(false);
      expect(mentionsNorwegianBrands('')).toBe(false);
      expect(hasBankAccountNumber('')).toBe(false);
      expect(hasURLsNeedingVerification('')).toBe(false);
      expect(needsWebSearchVerification('')).toBe(false);
      expect(getWebSearchReasons('').length).toBe(0);
    });

    it('should handle special characters', () => {
      expect(hasNorwegianPhoneNumber('!!!###$$$')).toBe(false);
    });

    it('should handle very long input', () => {
      const longText = 'a'.repeat(10000) + 'DNB' + 'b'.repeat(10000);
      expect(mentionsNorwegianBrands(longText)).toBe(true);
    });

    it('should handle Unicode characters', () => {
      expect(mentionsNorwegianBrands('DNB med æøå')).toBe(true);
    });

    it('should be case-insensitive for all checks', () => {
      expect(mentionsNorwegianBrands('dnb VIPPS bankid')).toBe(true);
    });
  });
});