/**
 * Norwegian Fraud Detection Helpers
 * Detects patterns that would benefit from web search verification
 */

import { hasMinimalContext, extractURLs, deduplicateURLsByDomain } from './urlAnalyzer';
import { PHONE_NUMBER_PATTERNS, matchesAnyPattern } from './constants/fraudPatterns';

/**
 * Detect Norwegian phone numbers in various formats
 */
export function hasNorwegianPhoneNumber(text: string): boolean {
  return matchesAnyPattern(text, PHONE_NUMBER_PATTERNS.norwegian);
}

/**
 * Detect Norwegian bank account numbers or IBAN
 */
export function hasBankAccountNumber(text: string): boolean {
  const { BANK_ACCOUNT_PATTERNS } = require('./constants/fraudPatterns');
  return matchesAnyPattern(text, BANK_ACCOUNT_PATTERNS);
}

/**
 * Detect mentions of potential company/brand names that would benefit from web verification
 * This function detects patterns that suggest a company name without hardcoding specific brands
 */
export function mentionsNorwegianBrands(text: string): boolean {
  // Look for patterns that suggest company/brand mentions
  const brandPatterns = [
    // Company suffixes (Norwegian)
    /\b\w+(?:AS|ASA|Ltd|Group|Bank|Energi|forsikring)\b/gi,
    // Website domains
    /\b\w+\.(?:no|com|org|net)\b/gi,
    // Brand-like capitalized words (potential company names)
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
    // Store/service indicators
    /\bnettbutikk\b|\bbutikk\b|\bselskap\b/gi
  ];

  return brandPatterns.some(pattern => pattern.test(text));
}

/**
 * Detect URLs that should be verified against Norwegian databases
 */
export function hasURLsNeedingVerification(text: string): boolean {
  // Extract URLs from text and deduplicate by domain
  const allUrls = extractURLs(text);
  const urls = deduplicateURLsByDomain(allUrls);

  if (urls.length === 0) return false;

  // ALWAYS verify URLs with minimal context (< 10 words)
  if (hasMinimalContext(text)) return true;

  // Also check for suspicious patterns that warrant web verification
  const { URL_PATTERNS, urlContainsAny } = require('./constants/fraudPatterns');

  return urls.some((url: string) => {
    const lowerUrl = url.toLowerCase();

    // URL shorteners
    if (urlContainsAny(url, URL_PATTERNS.shorteners)) return true;

    // Norwegian domains with suspicious patterns
    if (lowerUrl.includes('.no')) {
      for (const pattern of Object.values(URL_PATTERNS.norwegianFinancial)) {
        if ((pattern as RegExp).test(lowerUrl)) return true;
      }
    }

    // Suspicious TLDs
    if (urlContainsAny(url, URL_PATTERNS.suspiciousTLDs)) return true;

    // IP addresses
    if (URL_PATTERNS.ipAddress.test(url)) return true;

    return false;
  });
}

/**
 * Detect patterns suggesting government/official communication that should be verified
 */
export function mentionsOfficialNorwegianServices(text: string): boolean {
  const officialTerms = [
    // Government services
    'skatteetaten', 'nav.no', 'altinn', 'regjeringen',
    // Legal/formal terms
    'skatteoppgjør', 'refusjon', 'tilbakebetaling', 'vedtak',
    'innkreving', 'purring', 'tvangsinndrivelse',
    // Banking terms that could be spoofed
    'bankid', 'digipass', 'kodebrikke', 'mobil bank'
  ];

  return officialTerms.some(term =>
    new RegExp(`\\b${term}\\b`, 'i').test(text)
  );
}

/**
 * Main function to determine if content needs web search verification
 */
export function needsWebSearchVerification(text: string): boolean {
  // Check if any pattern suggests web verification would be helpful
  return (
    hasURLsNeedingVerification(text) ||
    hasNorwegianPhoneNumber(text) ||
    mentionsNorwegianBrands(text) ||
    mentionsOfficialNorwegianServices(text) ||
    hasBankAccountNumber(text)
  );
}

/**
 * Get specific reasons why web search is recommended
 */
export function getWebSearchReasons(text: string, context?: any): string[] {
  const reasons: string[] = [];

  // Check if image content is present
  if (context?.imageData) {
    reasons.push('Image content detected - may contain URLs, brands, or suspicious elements');
  }

  if (hasURLsNeedingVerification(text)) {
    // Check if it's because of minimal context or suspicious patterns
    const allUrls = extractURLs(text);
    const urls = deduplicateURLsByDomain(allUrls);
    if (urls.length > 0) {
      if (hasMinimalContext(text)) {
        reasons.push('URL with minimal context detected');
      } else {
        reasons.push('Suspicious URLs detected');
      }
    }
  }

  if (hasNorwegianPhoneNumber(text)) {
    reasons.push('Norwegian phone numbers found');
  }

  if (mentionsNorwegianBrands(text)) {
    reasons.push('Norwegian brands/services mentioned');
  }

  if (mentionsOfficialNorwegianServices(text)) {
    reasons.push('Official Norwegian services referenced');
  }

  if (hasBankAccountNumber(text)) {
    reasons.push('Bank account information detected');
  }

  return reasons;
}