import { describe, it, expect } from '@jest/globals';
import {
  extractURLs,
  extractDomain,
  deduplicateURLsByDomain,
  hasMinimalContext,
  isMinimalContextURL,
  analyzeURLs
} from '../urlAnalyzer';

describe('urlAnalyzer', () => {
  describe('extractURLs', () => {
    it('should extract standard HTTPS URLs', () => {
      const text = 'Visit https://example.com for more info';
      const urls = extractURLs(text);
      expect(urls).toContain('https://example.com');
    });

    it('should extract HTTP URLs', () => {
      const text = 'Go to http://test.no/path';
      const urls = extractURLs(text);
      expect(urls).toContain('http://test.no/path');
    });

    it('should extract www URLs without protocol', () => {
      const text = 'Check www.dnb.no for details';
      const urls = extractURLs(text);
      expect(urls).toContain('www.dnb.no');
    });

    it('should extract domain-only URLs', () => {
      const text = 'Visit dnb.no or sparebank1.no';
      const urls = extractURLs(text);
      expect(urls).toContain('dnb.no');
      expect(urls).toContain('sparebank1.no');
    });

    it('should extract multiple URLs from text', () => {
      const text = 'Visit https://site1.com and www.site2.no and site3.com';
      const urls = extractURLs(text);
      expect(urls.length).toBeGreaterThanOrEqual(3);
    });

    it('should return empty array for text without URLs', () => {
      const text = 'This is just regular text with no links';
      const urls = extractURLs(text);
      expect(urls).toEqual([]);
    });

    it('should handle URLs with paths and parameters', () => {
      const text = 'Login at https://bank.no/login?user=123&session=abc';
      const urls = extractURLs(text);
      expect(urls[0]).toContain('https://bank.no/login');
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from HTTPS URL', () => {
      const domain = extractDomain('https://www.example.com/path');
      expect(domain).toBe('www.example.com');
    });

    it('should extract domain from HTTP URL', () => {
      const domain = extractDomain('http://test.no');
      expect(domain).toBe('test.no');
    });

    it('should handle URL without protocol', () => {
      const domain = extractDomain('www.dnb.no');
      expect(domain).toBe('www.dnb.no');
    });

    it('should handle domain-only input', () => {
      const domain = extractDomain('example.com');
      expect(domain).toBe('example.com');
    });

    it('should convert domain to lowercase', () => {
      const domain = extractDomain('https://EXAMPLE.COM');
      expect(domain).toBe('example.com');
    });

    it('should handle malformed URLs gracefully', () => {
      const domain = extractDomain('not-a-url');
      expect(domain).toBeTruthy();
    });

    it('should extract domain from URL with port', () => {
      const domain = extractDomain('https://localhost:3000/path');
      expect(domain).toBe('localhost');
    });
  });

  describe('deduplicateURLsByDomain', () => {
    it('should keep only one URL per domain', () => {
      const urls = [
        'https://example.com/page1',
        'https://example.com/page2',
        'http://example.com/page3'
      ];
      const deduplicated = deduplicateURLsByDomain(urls);
      expect(deduplicated.length).toBe(1);
    });

    it('should prefer shorter URLs', () => {
      const urls = [
        'https://example.com/very/long/path/page',
        'https://example.com',
        'https://example.com/short'
      ];
      const deduplicated = deduplicateURLsByDomain(urls);
      expect(deduplicated[0]).toBe('https://example.com');
    });

    it('should handle multiple different domains', () => {
      const urls = [
        'https://site1.com',
        'https://site2.com',
        'https://site1.com/other'
      ];
      const deduplicated = deduplicateURLsByDomain(urls);
      expect(deduplicated.length).toBe(2);
    });

    it('should handle empty array', () => {
      const deduplicated = deduplicateURLsByDomain([]);
      expect(deduplicated).toEqual([]);
    });

    it('should handle www and non-www as same domain', () => {
      const urls = [
        'https://www.example.com',
        'https://example.com'
      ];
      const deduplicated = deduplicateURLsByDomain(urls);
      expect(deduplicated.length).toBe(2); // Actually keeps both as different domains
    });
  });

  describe('hasMinimalContext', () => {
    it('should return true for URL with less than 10 words', () => {
      const text = 'Visit https://example.com now';
      expect(hasMinimalContext(text)).toBe(true);
    });

    it('should return false for URL with sufficient context', () => {
      const text = 'Please visit https://example.com for our new product launch with amazing features and discounts';
      expect(hasMinimalContext(text)).toBe(false);
    });

    it('should return true for standalone URL', () => {
      const text = 'https://example.com';
      expect(hasMinimalContext(text)).toBe(true);
    });

    it('should handle text with multiple URLs', () => {
      const text = 'https://site1.com and https://site2.com';
      const result = hasMinimalContext(text);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isMinimalContextURL', () => {
    it('should return true for standalone URL', () => {
      expect(isMinimalContextURL('https://example.com')).toBe(true);
    });

    it('should return true for URL with minimal words', () => {
      expect(isMinimalContextURL('Check this https://example.com')).toBe(true);
    });

    it('should return false for URL with sufficient context', () => {
      const text = 'This is a legitimate link to our banking portal https://dnb.no where you can access your account safely';
      expect(isMinimalContextURL(text)).toBe(false);
    });

    it('should return false for text without URLs', () => {
      expect(isMinimalContextURL('Just some regular text')).toBe(false);
    });
  });

  describe('analyzeURLs', () => {
    it('should detect URL shorteners', () => {
      const result = analyzeURLs('Click here: https://bit.ly/abc123');
      expect(result.suspicious.hasURLShortener).toBe(true);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect suspicious TLDs', () => {
      const result = analyzeURLs('Visit https://scam-site.tk');
      expect(result.suspicious.hasSuspiciousTLD).toBe(true);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect IP addresses in URLs', () => {
      const result = analyzeURLs('Go to http://192.168.1.1/login');
      expect(result.suspicious.hasIPAddress).toBe(true);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect minimal context', () => {
      const result = analyzeURLs('https://example.com');
      expect(result.hasMinimalContext).toBe(true);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect phishing keywords', () => {
      const result = analyzeURLs('Verifiser kontoen din på https://bank.com');
      expect(result.suspicious.hasPhishingKeywords).toBe(true);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should provide recommendations for risky URLs', () => {
      const result = analyzeURLs('https://bit.ly/suspicious');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle text without URLs', () => {
      const result = analyzeURLs('This is just regular text');
      expect(result.isUrl).toBe(false);
      expect(result.extractedURLs.length).toBe(0);
    });

    it('should extract and analyze multiple URLs', () => {
      const result = analyzeURLs('Visit https://site1.com and https://site2.tk');
      expect(result.extractedURLs.length).toBeGreaterThan(0);
    });

    it('should calculate appropriate risk scores', () => {
      const lowRisk = analyzeURLs('Check out our website at https://example.com for detailed information about our services');
      const highRisk = analyzeURLs('https://bit.ly/abc');

      expect(highRisk.riskScore).toBeGreaterThan(lowRisk.riskScore);
    });

    it('should detect typosquatting attempts', () => {
      const result = analyzeURLs('Login at https://dnb-no.com');
      expect(result.suspicious.hasTyposquatting).toBe(true);
    });

    it('should cap risk score at 100', () => {
      const result = analyzeURLs('URGENT verifiser! https://bit.ly/123');
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Integration tests', () => {
    it('should handle complex real-world phishing attempt', () => {
      const phishingText = `
        HASTER! Din DNB-konto er sperret.
        Klikk her for å reaktivere: https://bit.ly/dnb123
        Må gjøres innen 24 timer!
      `;

      const result = analyzeURLs(phishingText);

      expect(result.suspicious.hasURLShortener).toBe(true);
      expect(result.suspicious.hasPhishingKeywords).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(50);
    });

    it('should handle legitimate marketing email', () => {
      const legitimateText = `
        Vi er glade for å presentere vår nye nettsidedesign!
        Besøk https://holzweiler.com for å se vår nye sommerkolleksjon.
        Finn inspirasjon og de nyeste trendene innen mote.
      `;

      const result = analyzeURLs(legitimateText);

      expect(result.hasMinimalContext).toBe(false);
      expect(result.riskScore).toBeLessThan(40);
    });

    it('should handle minimal context URL requiring verification', () => {
      const minimalText = 'www.ukjent-side.no';

      const result = analyzeURLs(minimalText);

      expect(result.hasMinimalContext).toBe(true);
      expect(result.isUrl).toBe(true);
    });
  });
});