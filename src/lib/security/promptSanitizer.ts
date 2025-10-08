/**
 * Prompt Sanitization Module
 * Ensures input stability and prevents prompt structure breaking
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
 * Sanitizes user input for stable prompt processing
 * Focuses on structural safety, not pattern detection
 */
export function sanitizeUserInput(input: string): SanitizationResult {
  const warnings: string[] = [];
  let sanitized = input;

  // Check length (DoS prevention)
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
    warnings.push('Input truncated to maximum length');
  }

  // Remove control characters (parsing safety)
  const controlCharsFound = CONTROL_CHAR_REGEX.test(sanitized);
  if (controlCharsFound) {
    sanitized = sanitized.replace(CONTROL_CHAR_REGEX, '');
    warnings.push('Control characters removed');
  }

  // Escape special delimiters we use in prompts (prevents breaking prompt structure)
  sanitized = sanitized
    .replace(/\[USER_INPUT_START\]/gi, '[USER-INPUT-START]')
    .replace(/\[USER_INPUT_END\]/gi, '[USER-INPUT-END]')
    .replace(/\[SYSTEM CONTEXT\]/gi, '[SYSTEM-CONTEXT]')
    .replace(/\[END SYSTEM CONTEXT\]/gi, '[END-SYSTEM-CONTEXT]');

  return {
    sanitized,
    warnings
  };
}

/**
 * Validates that input is safe for LLM processing
 * Focuses on DoS prevention, not content filtering
 */
export function validateInput(input: string): { valid: boolean; reason?: string } {
  // Check if input is too short
  if (input.trim().length < 5) {
    return { valid: false, reason: 'Input too short' };
  }

  // Check if input is just repeated characters
  const uniqueChars = new Set(input.replace(/\s/g, ''));
  if (uniqueChars.size < 3) {
    return { valid: false, reason: 'Input lacks meaningful content' };
  }

  // Check for excessive repetition (potential DoS)
  const words = input.split(/\s+/);
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }

  const maxRepetition = Math.max(...wordCounts.values());
  if (maxRepetition > words.length * 0.5 && words.length > 10) {
    return { valid: false, reason: 'Excessive repetition detected' };
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
