/**
 * Injection Detection Module
 * Detects and analyzes potential prompt injection attempts
 */

export interface InjectionDetectionResult {
  detected: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  patterns: string[];
  score: number;
  details: InjectionDetail[];
}

export interface InjectionDetail {
  type: string;
  pattern: string;
  match: string;
  position: number;
  severity: number;
}

// Injection pattern categories with severity scores
const INJECTION_CATEGORIES = {
  ROLE_HIJACKING: {
    severity: 10,
    patterns: [
      { regex: /system\s*:\s*you\s+are/gi, desc: 'System role override' },
      { regex: /assistant\s*:\s*i\s+am/gi, desc: 'Assistant role confusion' },
      { regex: /you\s+are\s+now\s+a\s+[a-z]+/gi, desc: 'Role reassignment' },
      { regex: /act\s+as\s+(?!DNB)/gi, desc: 'Acting as non-DNB entity' },
      { regex: /pretend\s+(?:to\s+be|you\s+are)/gi, desc: 'Pretending directive' },
    ]
  },
  INSTRUCTION_OVERRIDE: {
    severity: 9,
    patterns: [
      { regex: /ignore\s+(?:all\s+)?(?:previous|above|prior)/gi, desc: 'Ignore instructions' },
      { regex: /forget\s+(?:everything|all|what\s+i\s+said)/gi, desc: 'Forget directive' },
      { regex: /disregard\s+(?:all\s+)?(?:instructions?|rules?)/gi, desc: 'Disregard rules' },
      { regex: /new\s+(?:instructions?|rules?)\s*:/gi, desc: 'New instructions' },
      { regex: /override\s+(?:your\s+)?(?:instructions?|programming)/gi, desc: 'Override attempt' },
    ]
  },
  PROMPT_EXTRACTION: {
    severity: 7,
    patterns: [
      { regex: /(?:show|reveal|display)\s+(?:me\s+)?(?:the\s+)?system\s+prompt/gi, desc: 'System prompt request' },
      { regex: /what\s+(?:is|are)\s+your\s+(?:instructions?|system\s+prompt)/gi, desc: 'Prompt inquiry' },
      { regex: /print\s+(?:your\s+)?(?:instructions?|initialization)/gi, desc: 'Print instructions' },
      { regex: /repeat\s+(?:your\s+)?(?:system\s+)?prompt/gi, desc: 'Repeat prompt request' },
    ]
  },
  CONTEXT_ESCAPE: {
    severity: 8,
    patterns: [
      { regex: /\[(?:SYSTEM|END|USER_INPUT_END|STOP)\]/gi, desc: 'Delimiter injection' },
      { regex: /\{\{(?:system|end|stop)\}\}/gi, desc: 'Template injection' },
      { regex: /"""[\s\S]*?"""/g, desc: 'Triple quote escape' },
      { regex: /```[\s\S]*?```/g, desc: 'Code block escape' },
    ]
  },
  JAILBREAK: {
    severity: 10,
    patterns: [
      { regex: /DAN\s+(?:mode|prompt)/gi, desc: 'DAN jailbreak' },
      { regex: /developer\s+mode/gi, desc: 'Developer mode' },
      { regex: /(?:enable|activate)\s+(?:unrestricted|unlimited)/gi, desc: 'Unrestricted mode' },
      { regex: /jailbreak/gi, desc: 'Direct jailbreak mention' },
      { regex: /bypass\s+(?:all\s+)?(?:restrictions?|filters?|safety)/gi, desc: 'Bypass attempt' },
    ]
  },
  DNB_IMPERSONATION: {
    severity: 10,
    patterns: [
      { regex: /i\s+am\s+(?:from\s+)?DNB(?:\s+support)?/gi, desc: 'DNB impersonation' },
      { regex: /this\s+is\s+(?:an?\s+)?official\s+DNB/gi, desc: 'Official DNB claim' },
      { regex: /on\s+behalf\s+of\s+DNB/gi, desc: 'On behalf of DNB' },
      { regex: /DNB\s+(?:security|fraud)\s+department/gi, desc: 'DNB department claim' },
    ]
  },
  MALICIOUS_CODE: {
    severity: 9,
    patterns: [
      { regex: /<script[\s\S]*?<\/script>/gi, desc: 'Script injection' },
      { regex: /javascript:/gi, desc: 'JavaScript protocol' },
      { regex: /eval\s*\(/gi, desc: 'Eval function' },
      { regex: /import\s+os|subprocess|sys/gi, desc: 'System imports' },
      { regex: /rm\s+-rf|del\s+\/f/gi, desc: 'Destructive commands' },
    ]
  }
};

/**
 * Detects potential injection attempts in user input
 */
export function detectInjectionAttempts(input: string): InjectionDetectionResult {
  const details: InjectionDetail[] = [];
  let totalScore = 0;
  const detectedPatterns = new Set<string>();

  // Check each category
  for (const [category, config] of Object.entries(INJECTION_CATEGORIES)) {
    for (const patternDef of config.patterns) {
      const matches = input.matchAll(patternDef.regex);
      
      for (const match of matches) {
        if (match.index !== undefined) {
          details.push({
            type: category,
            pattern: patternDef.desc,
            match: match[0],
            position: match.index,
            severity: config.severity
          });
          
          totalScore += config.severity;
          detectedPatterns.add(patternDef.desc);
        }
      }
    }
  }

  // Additional heuristic checks
  const heuristicScore = performHeuristicChecks(input, details);
  totalScore += heuristicScore;

  // Determine overall severity
  let severity: InjectionDetectionResult['severity'] = 'none';
  if (totalScore > 0) {
    if (totalScore >= 30) severity = 'critical';
    else if (totalScore >= 20) severity = 'high';
    else if (totalScore >= 10) severity = 'medium';
    else severity = 'low';
  }

  return {
    detected: totalScore > 0,
    severity,
    patterns: Array.from(detectedPatterns),
    score: totalScore,
    details: details.sort((a, b) => b.severity - a.severity)
  };
}

/**
 * Performs additional heuristic checks for suspicious patterns
 */
function performHeuristicChecks(input: string, details: InjectionDetail[]): number {
  let score = 0;

  // Check for excessive special characters
  const specialCharRatio = (input.match(/[^a-zA-Z0-9\s.,!?æøåÆØÅ]/g) || []).length / input.length;
  if (specialCharRatio > 0.3) {
    details.push({
      type: 'HEURISTIC',
      pattern: 'Excessive special characters',
      match: `${Math.round(specialCharRatio * 100)}% special chars`,
      position: 0,
      severity: 3
    });
    score += 3;
  }

  // Check for unusual language mixing (Norwegian context with English commands)
  const hasNorwegian = /[æøåÆØÅ]/g.test(input);
  const hasEnglishCommands = /\b(ignore|system|prompt|reveal|show|print)\b/gi.test(input);
  if (hasNorwegian && hasEnglishCommands) {
    details.push({
      type: 'HEURISTIC',
      pattern: 'Mixed language with commands',
      match: 'Norwegian text with English commands',
      position: 0,
      severity: 2
    });
    score += 2;
  }

  // Check for base64 or encoded content
  const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g;
  if (base64Pattern.test(input)) {
    details.push({
      type: 'HEURISTIC',
      pattern: 'Potential encoded content',
      match: 'Base64-like pattern detected',
      position: 0,
      severity: 5
    });
    score += 5;
  }

  // Check for repeated attempts to break context
  const breakAttempts = (input.match(/\n{3,}|\r{3,}|[\[\]{}]{3,}/g) || []).length;
  if (breakAttempts > 2) {
    details.push({
      type: 'HEURISTIC',
      pattern: 'Context break attempts',
      match: `${breakAttempts} break patterns`,
      position: 0,
      severity: 4
    });
    score += 4;
  }

  return score;
}

/**
 * Analyzes injection risk level
 */
export function analyzeInjectionRisk(result: InjectionDetectionResult): {
  blockRequest: boolean;
  requiresReview: boolean;
  riskLevel: 'safe' | 'suspicious' | 'dangerous' | 'blocked';
  message: string;
} {
  if (result.severity === 'critical' || result.score >= 30) {
    return {
      blockRequest: true,
      requiresReview: true,
      riskLevel: 'blocked',
      message: 'Potensielt ondsinnet forespørsel blokkert av sikkerhetssystem'
    };
  }

  if (result.severity === 'high' || result.score >= 20) {
    return {
      blockRequest: false,
      requiresReview: true,
      riskLevel: 'dangerous',
      message: 'Mistenkelig aktivitet detektert - forespørsel under observasjon'
    };
  }

  if (result.severity === 'medium' || result.score >= 10) {
    return {
      blockRequest: false,
      requiresReview: false,
      riskLevel: 'suspicious',
      message: 'Uvanlig mønster detektert i forespørsel'
    };
  }

  return {
    blockRequest: false,
    requiresReview: false,
    riskLevel: 'safe',
    message: 'Forespørsel godkjent'
  };
}

/**
 * Logs security events for monitoring
 */
export function logSecurityEvent(
  eventType: string,
  details: InjectionDetectionResult,
  metadata?: Record<string, any>
): void {
  const event = {
    timestamp: new Date().toISOString(),
    type: eventType,
    severity: details.severity,
    score: details.score,
    patterns: details.patterns,
    metadata,
    // DNB compliance fields
    system: 'DNB_SVINDELSJEKK',
    component: 'PROMPT_INJECTION_DETECTOR',
    version: '1.0.0'
  };

  // In production, this would send to DNB's security monitoring system
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service
    console.error('[SECURITY_EVENT]', JSON.stringify(event));
  } else {
    console.warn('[SECURITY_EVENT]', event);
  }
}