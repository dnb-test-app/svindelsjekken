/**
 * Norwegian Fraud Detection Helpers
 * Detects patterns that would benefit from web search verification
 */

/**
 * Detect Norwegian phone numbers in various formats
 */
export function hasNorwegianPhoneNumber(text: string): boolean {
  const patterns = [
    // Norwegian mobile: +47 XX XX XX XX or 8-digit starting with 4/9
    /(\+47)?[\s-]?[49]\d{7}/g,
    // Formatted mobile: XX XX XX XX
    /\b[49]\d[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/g,
    // Landline with area code: +47 XX XX XX XX (2-8 digits)
    /(\+47)?[\s-]?[23567]\d{7}/g,
    // Formatted landline: XX XX XX XX
    /\b[23567]\d[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/g,
    // Generic 8-digit numbers
    /\b\d{8}\b/g
  ];

  return patterns.some(pattern => pattern.test(text));
}

/**
 * Detect Norwegian bank account numbers or IBAN
 */
export function hasBankAccountNumber(text: string): boolean {
  const patterns = [
    // Norwegian account format: XXXX.XX.XXXXX
    /\b\d{4}[\s.]?\d{2}[\s.]?\d{5}\b/g,
    // IBAN format
    /\bIBAN[\s:]?[A-Z]{2}\d{2}[A-Z0-9\s]{15,31}\b/gi,
    // General account references
    /kontonummer|account[\s-]?number|konto[\s-]?nr/gi
  ];

  return patterns.some(pattern => pattern.test(text));
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
  // Import URL analyzer to check for minimal context
  const { hasMinimalContext, extractURLs, deduplicateURLsByDomain } = require('./urlAnalyzer');

  // Extract URLs from text and deduplicate by domain
  const allUrls = extractURLs(text);
  const urls = deduplicateURLsByDomain(allUrls);

  if (urls.length === 0) return false;

  // ALWAYS verify URLs with minimal context (< 10 words)
  if (hasMinimalContext(text)) return true;

  // Also check for suspicious patterns that warrant web verification
  return urls.some((url: string) => {
    const lowerUrl = url.toLowerCase();

    // URL shorteners
    const shorteners = ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'ow.ly', 'is.gd'];
    if (shorteners.some((shortener: string) => lowerUrl.includes(shortener))) return true;

    // Norwegian domains with suspicious patterns
    if (lowerUrl.includes('.no') && (
      lowerUrl.includes('dnb') ||
      lowerUrl.includes('bank') ||
      lowerUrl.includes('vipps') ||
      lowerUrl.includes('bankid')
    )) return true;

    // Suspicious TLDs
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.click', '.download'];
    if (suspiciousTlds.some((tld: string) => lowerUrl.includes(tld))) return true;

    // IP addresses
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) return true;

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
  const { hasMinimalContext, extractURLs, deduplicateURLsByDomain } = require('./urlAnalyzer');

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