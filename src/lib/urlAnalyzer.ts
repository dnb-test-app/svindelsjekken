/**
 * URL Analyzer Module
 * Analyzes URLs for fraud indicators and suspicious patterns
 */

import { URL_ANALYSIS_SCORES } from './constants/riskConstants';

export interface URLAnalysis {
  isUrl: boolean;
  hasMinimalContext: boolean;
  suspicious: {
    hasURLShortener: boolean;
    hasSuspiciousTLD: boolean;
    hasIPAddress: boolean;
    hasExcessiveSubdomains: boolean;
    hasMisleadingDomain: boolean;
    hasTyposquatting: boolean;
    hasPhishingKeywords: boolean;
  };
  riskScore: number;
  recommendations: string[];
  extractedURLs: string[];
  contextWords: string[];
}

// Common URL shortener domains
const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 'short.link', 't.co',
  'ow.ly', 'is.gd', 'buff.ly', 'adf.ly', 'db.tt'
];

// Suspicious top-level domains often used in fraud
const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.click', '.download',
  '.review', '.bid', '.date', '.loan', '.men', '.win'
];

// Critical authentication systems that need special verification via web search
// These patterns indicate domains that require enhanced scrutiny due to high fraud risk
const CRITICAL_AUTH_PATTERNS = [
  // BankID is CRITICAL - any mention needs immediate web verification
  /bankid/i,
  /bank-?id/i,
  /\bbank\s*id\b/i,
  // Vipps is CRITICAL - payment system commonly targeted for fraud
  /vipps/i,
  /vi[1l]pps/i, // Common typosquatting attempts (v1pps, vilpps)
  // Other authentication systems that are commonly spoofed
  /mobilepay/i,
  /\bauth\b/i,
  /\blogin\b/i,
  /\bsignin\b/i
];

// Common marketing subdomains used by legitimate companies
const MARKETING_SUBDOMAINS = [
  'go.', 'click.', 'shop.', 'email.', 'newsletter.', 'campaign.',
  'promo.', 'offer.', 'tilbud.', 'kampanje.', 'nyhetsbrev.'
];

// Keywords that indicate phishing when combined with URLs
const PHISHING_KEYWORDS = [
  'verifiser', 'bekreft', 'oppdater', 'reaktiver', 'suspendert',
  'verify', 'confirm', 'update', 'reactivate', 'suspended',
  'sikkerhet', 'security', 'logg inn', 'login'
];

/**
 * Extract URLs from text
 */
export function extractURLs(text: string): string[] {
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  return text.match(urlPattern) || [];
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    // Add protocol if missing
    const fullUrl = url.includes('://') ? url : `https://${url}`;
    const urlObj = new URL(fullUrl);
    return urlObj.hostname.toLowerCase();
  } catch {
    // Fallback for malformed URLs
    const domainMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
    return domainMatch ? domainMatch[1].toLowerCase() : url.toLowerCase();
  }
}

/**
 * Deduplicate URLs by domain, keeping only one URL per domain
 * Prefers shorter, cleaner URLs (like root domain over deep paths)
 */
export function deduplicateURLsByDomain(urls: string[]): string[] {
  const domainMap = new Map<string, string>();

  urls.forEach(url => {
    const domain = extractDomain(url);
    const existing = domainMap.get(domain);

    if (!existing) {
      // First URL for this domain
      domainMap.set(domain, url);
    } else {
      // Choose the cleaner URL (shorter path, prefer root)
      const existingPath = existing.split('/').slice(3).join('/'); // Remove protocol and domain
      const currentPath = url.split('/').slice(3).join('/');

      // Prefer shorter paths or root domains
      if (currentPath.length < existingPath.length ||
          (!currentPath && existingPath) ||
          (currentPath === '' && existingPath !== '')) {
        domainMap.set(domain, url);
      }
    }
  });

  return Array.from(domainMap.values());
}

/**
 * Extract main domain from subdomain (e.g., go.meny.no -> meny.no)
 */
export function extractMainDomain(domain: string): string {
  const parts = domain.split('.');

  // If it's a Norwegian domain (.no), take the last two parts
  if (domain.endsWith('.no') && parts.length >= 2) {
    return parts.slice(-2).join('.');
  }

  // For other domains, take the last two parts unless it's a known TLD extension
  if (parts.length >= 2) {
    const commonTLDs = ['co.uk', 'com.au', 'co.za'];
    const lastTwo = parts.slice(-2).join('.');

    if (commonTLDs.includes(lastTwo) && parts.length >= 3) {
      return parts.slice(-3).join('.');
    }

    return lastTwo;
  }

  return domain;
}

/**
 * Check if domain uses a marketing subdomain
 */
export function hasMarketingSubdomain(domain: string): boolean {
  return MARKETING_SUBDOMAINS.some(subdomain =>
    domain.toLowerCase().startsWith(subdomain.toLowerCase())
  );
}

/**
 * Check if domain contains critical authentication patterns that need web verification
 */
export function hasCriticalAuthPattern(domain: string): boolean {
  return CRITICAL_AUTH_PATTERNS.some(pattern => pattern.test(domain));
}

/**
 * Calculate string similarity (simple Levenshtein-based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Check if domain appears to be impersonating critical authentication services
 * This triggers web search verification instead of relying on hardcoded lists
 */
function checkTyposquatting(domain: string): boolean {
  // Check if domain mentions critical authentication terms but looks suspicious
  const hasCriticalPattern = hasCriticalAuthPattern(domain);

  if (!hasCriticalPattern) {
    return false; // No critical patterns, not typosquatting of auth services
  }

  // If domain contains critical auth patterns, check for suspicious indicators:

  // 1. Mixed case or numbers in auth terms (e.g., "BankId", "bank1d", "v1pps")
  const hasAlteredAuthTerms = /bank[0-9i1l]d|bankid[0-9]/i.test(domain) ||
                             /v[i1l]pps|v[i1l]pp5/i.test(domain);

  // 2. Auth terms combined with suspicious words
  const hasSuspiciousWords = /(?:bankid|vipps|auth).*(?:secure|verify|update|login|portal)/i.test(domain) ||
                            /(?:secure|verify|update|login|portal).*(?:bankid|vipps|auth)/i.test(domain);

  // 3. Suspicious TLD with auth terms
  const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(tld => domain.includes(tld)) && hasCriticalPattern;

  // 4. Multiple hyphens with auth terms (bank-id-secure.com)
  const hasExcessiveHyphens = domain.split('-').length > 3 && hasCriticalPattern;

  // Flag as potential typosquatting requiring web verification
  return hasAlteredAuthTerms || hasSuspiciousWords || hasSuspiciousTLD || hasExcessiveHyphens;
}

/**
 * Check if URL uses a shortener service
 */
function hasURLShortener(url: string): boolean {
  const domain = extractDomain(url);
  return URL_SHORTENERS.some(shortener => domain.includes(shortener));
}

/**
 * Check if URL has suspicious TLD
 */
function hasSuspiciousTLD(url: string): boolean {
  return SUSPICIOUS_TLDS.some(tld => url.toLowerCase().endsWith(tld));
}

/**
 * Check if URL contains IP address instead of domain
 */
function hasIPAddress(url: string): boolean {
  const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
  return ipPattern.test(url);
}

/**
 * Check if URL has excessive subdomains (potential subdomain squatting)
 */
function hasExcessiveSubdomains(url: string): boolean {
  const domain = extractDomain(url);
  const parts = domain.split('.');

  // Don't flag marketing subdomains as excessive
  if (hasMarketingSubdomain(domain)) {
    // For marketing subdomains, only flag if more than 4 parts (e.g., go.shop.example.com.evil.tk)
    return parts.length > 4;
  }

  // Flag if more than 3 parts (e.g., secure.login.fake.dnb.malicious.com)
  return parts.length > 4;
}

/**
 * Check if domain contains misleading keywords
 */
function hasMisleadingDomain(url: string): boolean {
  const domain = extractDomain(url);
  const misleadingPatterns = [
    /secure.*dnb/i, /dnb.*secure/i, /bankid.*verify/i, /verify.*bankid/i,
    /dnb.*login/i, /login.*dnb/i, /bank.*norway/i, /norway.*bank/i,
    /official.*dnb/i, /dnb.*official/i
  ];

  return misleadingPatterns.some(pattern => pattern.test(domain));
}

/**
 * Check if text around URLs contains phishing keywords
 */
function hasPhishingKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PHISHING_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Determine if input has minimal context around URLs
 */
export function hasMinimalContext(text: string): boolean {
  const trimmed = text.trim();
  const urls = extractURLs(trimmed);

  if (urls.length === 0) return false;

  // Remove URLs to count remaining context
  let contextText = trimmed;
  urls.forEach(url => {
    contextText = contextText.replace(url, ' ').replace(/\s+/g, ' ');
  });

  // Count actual words in remaining context
  const contextWords = contextText.trim().split(/\s+/).filter(w => w.length > 1);

  // Calculate ratio of URL content vs context
  const urlLength = urls.join('').length;
  const totalLength = trimmed.length;
  const urlRatio = urlLength / totalLength;

  // Flag as minimal context if:
  // - Less than 10 meaningful words of context OR
  // - URLs make up more than 70% of the content
  return contextWords.length < 10 || urlRatio > 0.7;
}

/**
 * Generate recommendations based on suspicious patterns
 */
function generateRecommendations(analysis: URLAnalysis, isNorwegian: boolean = true): string[] {
  const recommendations: string[] = [];

  if (analysis.hasMinimalContext) {
    recommendations.push(
      isNorwegian
        ? 'Spør hvem som sendte lenken og hvorfor før du klikker'
        : 'Ask who sent the link and why before clicking'
    );
  }

  if (analysis.suspicious.hasURLShortener) {
    recommendations.push(
      isNorwegian
        ? 'Url-forkortere skjuler den egentlige destinasjonen - vær ekstra forsiktig'
        : 'URL shorteners hide the real destination - be extra careful'
    );
  }

  if (analysis.suspicious.hasTyposquatting) {
    recommendations.push(
      isNorwegian
        ? 'Domenet ligner på et kjent nettsted men er ikke identisk - sjekk nøye'
        : 'Domain looks similar to a known website but is not identical - check carefully'
    );
  }

  if (analysis.suspicious.hasMisleadingDomain) {
    recommendations.push(
      isNorwegian
        ? 'Domenet inneholder villedende ord som "secure" eller "bankid" - sannsynlig svindel'
        : 'Domain contains misleading words like "secure" or "bankid" - likely fraud'
    );
  }

  if (analysis.suspicious.hasIPAddress) {
    recommendations.push(
      isNorwegian
        ? 'Lenken bruker IP-adresse i stedet for domenenavn - meget mistenkelig'
        : 'Link uses IP address instead of domain name - very suspicious'
    );
  }

  if (analysis.riskScore > 60) {
    recommendations.push(
      isNorwegian
        ? 'Kontakt DNB direkte på 915 04800 for å verifisere om dette er ekte'
        : 'Contact DNB directly at 915 04800 to verify if this is genuine'
    );
  }

  // Always include general advice for URLs with minimal context
  if (analysis.hasMinimalContext) {
    recommendations.push(
      isNorwegian
        ? 'Aldri klikk på lenker du er usikker på - gå direkte til det offisielle nettstedet i stedet'
        : 'Never click on links you are unsure about - go directly to the official website instead'
    );
  }

  return recommendations;
}

/**
 * Main function to analyze URLs in text
 */
export function analyzeURLs(text: string, isNorwegian: boolean = true): URLAnalysis {
  const urls = extractURLs(text);
  const isUrl = urls.length > 0;
  const minimalContext = hasMinimalContext(text);

  if (!isUrl) {
    return {
      isUrl: false,
      hasMinimalContext: false,
      suspicious: {
        hasURLShortener: false,
        hasSuspiciousTLD: false,
        hasIPAddress: false,
        hasExcessiveSubdomains: false,
        hasMisleadingDomain: false,
        hasTyposquatting: false,
        hasPhishingKeywords: false
      },
      riskScore: 0,
      recommendations: [],
      extractedURLs: [],
      contextWords: []
    };
  }

  // Analyze each URL for suspicious patterns
  const suspicious = {
    hasURLShortener: urls.some(hasURLShortener),
    hasSuspiciousTLD: urls.some(hasSuspiciousTLD),
    hasIPAddress: urls.some(hasIPAddress),
    hasExcessiveSubdomains: urls.some(hasExcessiveSubdomains),
    hasMisleadingDomain: urls.some(hasMisleadingDomain),
    hasTyposquatting: urls.some(url => checkTyposquatting(extractDomain(url))),
    hasPhishingKeywords: hasPhishingKeywords(text)
  };

  // Calculate risk score
  let riskScore = 0;

  // Base score for minimal context - reduced if marketing subdomain
  if (minimalContext) {
    const domain = urls.length > 0 ? extractDomain(urls[0]) : '';
    const hasMarketing = hasMarketingSubdomain(domain);
    riskScore += hasMarketing ? 15 : URL_ANALYSIS_SCORES.MINIMAL_CONTEXT;
  }

  // Add points for each suspicious pattern
  if (suspicious.hasURLShortener) riskScore += URL_ANALYSIS_SCORES.URL_SHORTENER;
  if (suspicious.hasSuspiciousTLD) riskScore += URL_ANALYSIS_SCORES.SUSPICIOUS_TLD;
  if (suspicious.hasIPAddress) riskScore += URL_ANALYSIS_SCORES.IP_ADDRESS;
  if (suspicious.hasExcessiveSubdomains) riskScore += URL_ANALYSIS_SCORES.EXCESSIVE_SUBDOMAINS;
  if (suspicious.hasMisleadingDomain) riskScore += URL_ANALYSIS_SCORES.MISLEADING_DOMAIN;
  if (suspicious.hasTyposquatting) riskScore += URL_ANALYSIS_SCORES.TYPOSQUATTING;
  if (suspicious.hasPhishingKeywords) riskScore += URL_ANALYSIS_SCORES.PHISHING_KEYWORDS;

  // Cap at 100
  riskScore = Math.min(100, riskScore);

  // Extract context words
  let contextText = text;
  urls.forEach(url => {
    contextText = contextText.replace(url, ' ');
  });
  const contextWords = contextText.trim().split(/\s+/).filter(w => w.length > 1);

  const analysis: URLAnalysis = {
    isUrl: true,
    hasMinimalContext: minimalContext,
    suspicious,
    riskScore,
    recommendations: [],
    extractedURLs: urls,
    contextWords
  };

  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis, isNorwegian);

  return analysis;
}

/**
 * Quick check if text contains URLs with minimal context
 */
export function isMinimalContextURL(text: string): boolean {
  return hasMinimalContext(text);
}

/**
 * Get a summary of URL analysis for display
 */
export function getURLAnalysisSummary(analysis: URLAnalysis, isNorwegian: boolean = true): string {
  if (!analysis.isUrl) return '';

  const suspiciousCount = Object.values(analysis.suspicious).filter(Boolean).length;

  if (suspiciousCount === 0 && !analysis.hasMinimalContext) {
    return isNorwegian
      ? 'Ingen åpenbare mistenkelige tegn i URL-strukturen'
      : 'No obvious suspicious signs in URL structure';
  }

  if (analysis.hasMinimalContext) {
    return isNorwegian
      ? `Lenke med lite kontekst - ${suspiciousCount} mistenkelige tegn funnet`
      : `Link with little context - ${suspiciousCount} suspicious signs found`;
  }

  return isNorwegian
    ? `${suspiciousCount} mistenkelige tegn funnet i lenken`
    : `${suspiciousCount} suspicious signs found in the link`;
}