/**
 * Prompt Sanitization Module
 * Prevents prompt injection attacks by cleaning and validating user input
 */

export interface SanitizationResult {
  sanitized: string;
  warnings: string[];
  blocked: boolean;
}

// Common prompt injection patterns
const INJECTION_PATTERNS = [
  // Role switching attempts
  /system\s*:/gi,
  /assistant\s*:/gi,
  /human\s*:/gi,
  /user\s*:/gi,
  
  // Instruction overrides
  /ignore\s+(all\s+)?previous\s+(instructions?|prompts?)/gi,
  /forget\s+(everything|all|previous)/gi,
  /disregard\s+(all\s+)?instructions?/gi,
  /new\s+instructions?\s*:/gi,
  
  // Prompt extraction attempts
  /show\s+(me\s+)?(the\s+)?system\s+prompt/gi,
  /reveal\s+(the\s+)?prompt/gi,
  /what\s+is\s+your\s+system\s+prompt/gi,
  /print\s+(the\s+)?instructions?/gi,
  
  // Context escape attempts
  /\[system\]/gi,
  /\[end\]/gi,
  /\[user_input_end\]/gi,
  /\{\{system\}\}/gi,
  
  // Jailbreak patterns
  /DAN\s+mode/gi,
  /developer\s+mode/gi,
  /unrestricted\s+mode/gi,
  /jailbreak/gi,
  /bypass\s+restrictions?/gi,
  
  // Role confusion
  /you\s+are\s+now\s+[a-z]+/gi,
  /act\s+as\s+[a-z]+/gi,
  /pretend\s+to\s+be/gi,
  /from\s+now\s+on/gi,
  
  // DNB impersonation attempts
  /i\s+am\s+(from\s+)?DNB/gi,
  /this\s+is\s+(from\s+)?DNB/gi,
  /official\s+DNB\s+message/gi,
];

// Control characters and special Unicode that could break parsing
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202F\u205F-\u206F]/g;

// Maximum safe input length (prevents token overflow attacks)
const MAX_INPUT_LENGTH = 10000;

/**
 * Sanitizes user input to prevent prompt injection attacks
 */
export function sanitizeUserInput(input: string): SanitizationResult {
  const warnings: string[] = [];
  let sanitized = input;
  let blocked = false;

  // Check length
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
    warnings.push('Input truncated to maximum length');
  }

  // Remove control characters
  const controlCharsFound = CONTROL_CHAR_REGEX.test(sanitized);
  if (controlCharsFound) {
    sanitized = sanitized.replace(CONTROL_CHAR_REGEX, '');
    warnings.push('Control characters removed');
  }

  // Check for injection patterns
  const detectedPatterns: string[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      detectedPatterns.push(pattern.source);
      
      // For critical patterns, block entirely
      if (pattern.source.includes('system') || 
          pattern.source.includes('ignore') || 
          pattern.source.includes('DAN')) {
        blocked = true;
      }
    }
  }

  if (detectedPatterns.length > 0) {
    warnings.push(`Potential injection patterns detected: ${detectedPatterns.length}`);
    
    // Neutralize patterns by adding zero-width spaces
    for (const pattern of INJECTION_PATTERNS) {
      sanitized = sanitized.replace(pattern, (match) => {
        return match.split('').join('\u200B');
      });
    }
  }

  // Escape special delimiters we use in prompts
  sanitized = sanitized
    .replace(/\[USER_INPUT_START\]/gi, '[USER-INPUT-START]')
    .replace(/\[USER_INPUT_END\]/gi, '[USER-INPUT-END]')
    .replace(/\[SYSTEM CONTEXT\]/gi, '[SYSTEM-CONTEXT]')
    .replace(/\[END SYSTEM CONTEXT\]/gi, '[END-SYSTEM-CONTEXT]');

  // Additional DNB-specific sanitization
  sanitized = sanitizeDNBSpecific(sanitized, warnings);

  return {
    sanitized,
    warnings,
    blocked
  };
}

/**
 * DNB-specific sanitization rules
 */
function sanitizeDNBSpecific(input: string, warnings: string[]): string {
  let sanitized = input;

  // Check for fake DNB domains
  const fakeDomainPattern = /dnb[\-\.](?!no\b)[a-z]+/gi;
  if (fakeDomainPattern.test(sanitized)) {
    warnings.push('Suspicious DNB domain pattern detected');
    sanitized = sanitized.replace(fakeDomainPattern, (match) => `[SUSPICIOUS_DOMAIN:${match}]`);
  }

  // Check for DNB employee impersonation
  const impersonationPattern = /jeg\s+(er|jobber)\s+(hos|for|med)\s+DNB/gi;
  if (impersonationPattern.test(sanitized)) {
    warnings.push('Potential DNB impersonation detected');
    sanitized = sanitized.replace(impersonationPattern, '[IMPERSONATION_ATTEMPT]');
  }

  return sanitized;
}

/**
 * Validates that input is safe for LLM processing
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