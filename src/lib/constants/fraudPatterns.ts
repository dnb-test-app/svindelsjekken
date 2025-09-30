/**
 * Centralized Fraud Detection Patterns
 * Single source of truth for all fraud detection pattern definitions
 */

export interface FraudPattern {
  patterns: RegExp[];
  severity: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * Core fraud detection patterns
 * These are used by textRules.ts for scoring and trigger detection
 */
export const FRAUD_PATTERNS: Record<string, FraudPattern> = {
  bankid_scam: {
    patterns: [
      /\b(bankid.*(?:utløper|fornye?s?|oppdater|reaktiver))\b/gi,
      /\b((?:fornye?|oppdater|reaktiver).*bankid)\b/gi,
    ],
    severity: 'high',
    description: 'BankID-svindel - BankID fornyes kun i nettbanken',
  },
  urgency: {
    patterns: [
      /\b(haster?|raskt?|umiddelbart|nå|i dag|innen \d+ timer?|siste sjanse)\b/gi,
      /\b(urgent|immediately|now|today|within \d+ hours?|last chance)\b/gi,
    ],
    severity: 'high',
    description: 'Presstaktikker for å få deg til å handle raskt',
  },
  credentials: {
    patterns: [
      /\b(passord|pin|kode|bankid|bruker(?:navn)?|pålogging)\b/gi,
      /\b(password|pin|code|username|login|credential)\b/gi,
    ],
    severity: 'high',
    description: 'Forespørsel om sensitive opplysninger',
  },
  suspicious_domains: {
    patterns: [
      /\b(?:dnb-?(?:no|bank|nett)|d[nm]b\.)\w+\.\w+/gi,
      /\b(?:bit\.ly|tinyurl|short\.link|goo\.gl|t\.co|ow\.ly|is\.gd)/gi,
      /\b(?:secure-?dnb|dnb-?secure|bankid-?verify|verify-?bankid)/gi,
      /\b(?:official-?dnb|dnb-?official|norway-?bank|bank-?norway)/gi,
    ],
    severity: 'high',
    description: 'Mistenkelig domene som kan etterligne DNB eller bruker URL-forkortere',
  },
  phishing_keywords: {
    patterns: [
      /\b(verifiser.*(?:klikk|lenke|link)|bekreft.*(?:klikk|lenke|link))\b/gi,
      /\b(oppdater.*(?:umiddelbart|nå|i\s?dag)|suspendert.*(?:konto|tilgang))\b/gi,
      /\b(verify.*(?:click|link)|confirm.*(?:click|link))\b/gi,
      /\b(update.*(?:immediately|now|today)|suspended.*(?:account|access))\b/gi,
    ],
    severity: 'high',
    description: 'Phishing-nøkkelord kombinert med handlingskrav',
  },
  too_good_to_be_true: {
    patterns: [
      /\b(vinn.*(?:kroner?|million|tusen)|gratulerer.*(?:vunnet|valgt))\b/gi,
      /\b(gratis.*(?:penger|million|gave)|(?:100|få).*(?:%|prosent).*rabatt)\b/gi,
      /\b(win.*(?:money|million|thousand)|congratulations.*(?:won|selected))\b/gi,
      /\b(free.*(?:money|million|gift)|(?:100|get).*(?:%|percent).*discount)\b/gi,
    ],
    severity: 'high',
    description: 'Urealistiske økonomiske løfter',
  },
  remote_access: {
    patterns: [
      /\b(teamviewer|anydesk|fjernhjelp|remote\s?desktop|fjernstyr)\b/gi,
    ],
    severity: 'high',
    description: 'Forespørsel om fjerntilgang til enheten din',
  },
  gift_cards: {
    patterns: [
      /\b(gavekort|itunes|google\s?play|steam|paysafe)\b/gi,
      /\b(gift\s?card|voucher)\b/gi,
    ],
    severity: 'high',
    description: 'Forespørsel om betaling via gavekort',
  },
  cryptocurrency: {
    patterns: [
      /\b(bitcoin|crypto|krypto|ethereum|binance|coinbase)\b/gi,
    ],
    severity: 'medium',
    description: 'Kryptovaluta-relaterte forespørsler',
  },
  minimal_context_url: {
    patterns: [
      /^https?:\/\/[^\s]+$/gi,
      /^[^\s]+\.[a-z]{2,}(?:\/[^\s]*)?$/gi,
    ],
    severity: 'medium',
    description: 'URL uten kontekst - kan være mistenkelig',
  },
  ip_address_urls: {
    patterns: [
      /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s]*)?/gi,
    ],
    severity: 'high',
    description: 'URL bruker IP-adresse i stedet for domenenavn',
  },
  legitimate_info: {
    patterns: [
      /\b(kvittering|bekreftelse.*kjøp|pakke.*sendt|faktura.*periode)\b/gi,
      /\b(receipt|confirmation.*purchase|package.*sent|invoice.*period)\b/gi,
    ],
    severity: 'low',
    description: 'Sannsynlig legitim informasjon',
  },
};

/**
 * URL Pattern Constants
 * Shared between different modules to avoid duplication
 */
export const URL_PATTERNS = {
  // URL Shorteners - used for detection and web search triggers
  shorteners: ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'ow.ly', 'is.gd'],

  // Suspicious TLDs
  suspiciousTLDs: ['.tk', '.ml', '.ga', '.cf', '.click', '.download'],

  // Norwegian financial services patterns
  norwegianFinancial: {
    dnb: /dnb/gi,
    bank: /bank/gi,
    vipps: /vipps/gi,
    bankid: /bankid/gi,
  },

  // IP address pattern
  ipAddress: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
};

/**
 * Norwegian Phone Number Patterns
 * Single source of truth for phone number detection
 */
export const PHONE_NUMBER_PATTERNS = {
  norwegian: [
    // Mobile: +47 XX XX XX XX or 8-digit starting with 4/9
    /(\+47)?[\s-]?[49]\d{7}/g,
    // Formatted mobile: XX XX XX XX
    /\b[49]\d[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/g,
    // Landline with area code
    /(\+47)?[\s-]?[23567]\d{7}/g,
    // Formatted landline
    /\b[23567]\d[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/g,
    // Generic 8-digit numbers
    /\b\d{8}\b/g,
  ],
};

/**
 * Bank Account Patterns
 */
export const BANK_ACCOUNT_PATTERNS = [
  // Norwegian account format: XXXX.XX.XXXXX
  /\b\d{4}[\s.]?\d{2}[\s.]?\d{5}\b/g,
  // IBAN format
  /\bIBAN[\s:]?[A-Z]{2}\d{2}[A-Z0-9\s]{15,31}\b/gi,
  // General account references
  /kontonummer|account[\s-]?number|konto[\s-]?nr/gi,
];

/**
 * Helper function to test if text matches any pattern in an array
 */
export function matchesAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Helper function to check if URL contains any of the given strings
 */
export function urlContainsAny(url: string, patterns: string[]): boolean {
  const lowerUrl = url.toLowerCase();
  return patterns.some((pattern) => lowerUrl.includes(pattern));
}