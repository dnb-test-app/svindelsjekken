/**
 * Norwegian Fraud Detection Helpers
 * Basic pattern detection for phone numbers and bank accounts
 * Web search is always enabled - AI decides when to use it based on prompt instructions
 */

import { PHONE_NUMBER_PATTERNS, BANK_ACCOUNT_PATTERNS, matchesAnyPattern } from './constants/fraudPatterns';

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
  return matchesAnyPattern(text, BANK_ACCOUNT_PATTERNS);
}
