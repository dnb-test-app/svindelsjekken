/**
 * Input Sanitization Module
 * Real protections only - no security theater
 */

export interface SanitizationResult {
  sanitized: string;
  warnings: string[];
}

// Maximum safe input length (prevents token overflow attacks)
const MAX_INPUT_LENGTH = 10000;

/**
 * Control characters and problematic Unicode ranges
 *
 * Ranges explained:
 * - \x00-\x08: NULL, SOH, STX, ETX, EOT, ENQ, ACK, BEL, BS (can break text processing)
 * - \x0B: Vertical Tab (not a standard whitespace)
 * - \x0C: Form Feed (can cause formatting issues)
 * - \x0E-\x1F: SO, SI, DLE, DC1-4, NAK, SYN, ETB, CAN, EM, SUB, ESC, FS-US (control codes)
 * - \x7F-\x9F: DEL + C1 control codes (legacy control characters)
 * - \u200B-\u200F: Zero-width spaces, joiners, markers (can hide text, homograph attacks)
 * - \u2028-\u202F: Line/paragraph separators, narrow spaces (can break parsing)
 * - \u205F-\u206F: Math spaces, direction marks (can cause display issues)
 *
 * Why filter these?
 * - Prevents invisible characters from cluttering logs and debugging
 * - Removes characters that can break text display or parsing
 * - Blocks zero-width Unicode used in homograph attacks
 * - Ensures clean data for AI processing and storage
 *
 * Note: This is data hygiene, not security. JSON.stringify() and React escaping
 * already prevent injection, but clean input prevents edge case bugs.
 */
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202F\u205F-\u206F]/g;

/**
 * Sanitizes user input
 *
 * Protections:
 * 1. Remove control characters (data hygiene, prevents edge case bugs)
 * 2. Truncate to max length (DoS prevention, cost control)
 */
export function sanitizeUserInput(input: string): SanitizationResult {
  const warnings: string[] = [];
  let sanitized = input;

  // Remove control characters and problematic Unicode
  const originalLength = sanitized.length;
  sanitized = sanitized.replace(CONTROL_CHAR_REGEX, '');
  if (sanitized.length < originalLength) {
    warnings.push('Removed control characters or invisible Unicode');
  }

  // Truncate to max length (DoS prevention, cost control)
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
    warnings.push('Input truncated to maximum length');
  }

  return {
    sanitized,
    warnings
  };
}

/**
 * Validates input meets minimum requirements
 * Only checks minimum length - prevent accidental empty submissions
 */
export function validateInput(input: string): { valid: boolean; reason?: string } {
  // Minimum length check (UX only)
  if (input.trim().length < 5) {
    return { valid: false, reason: 'Input too short' };
  }

  return { valid: true };
}

/**
 * Escapes user input for safe embedding in prompts
 */
export function escapeForPrompt(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
