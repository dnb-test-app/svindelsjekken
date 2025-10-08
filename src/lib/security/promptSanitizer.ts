/**
 * Input Sanitization Module
 * Real protections only - no security theater
 */

export interface SanitizationResult {
  sanitized: string;
  warnings: string[];
}

// Control characters and special Unicode that could break parsing
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202F\u205F-\u206F]/g;

// Maximum safe input length (prevents token overflow attacks)
const MAX_INPUT_LENGTH = 10000;

/**
 * Sanitizes user input
 * Only real protections: length limits and control char removal
 */
export function sanitizeUserInput(input: string): SanitizationResult {
  const warnings: string[] = [];
  let sanitized = input;

  // Truncate to max length (DoS prevention, cost control)
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
    warnings.push('Input truncated to maximum length');
  }

  // Remove control characters (JSON/encoding safety)
  const controlCharsFound = CONTROL_CHAR_REGEX.test(sanitized);
  if (controlCharsFound) {
    sanitized = sanitized.replace(CONTROL_CHAR_REGEX, '');
    warnings.push('Control characters removed');
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
