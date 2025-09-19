/**
 * Response Validation Module
 * Ensures LLM responses maintain DNB context and follow expected structure
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized?: any;
}

export interface ExpectedResponse {
  category?: 'fraud' | 'marketing' | 'suspicious' | 'safe';
  riskLevel: 'low' | 'medium' | 'high';
  riskScore?: number;
  fraudProbability?: number;
  mainIndicators?: string[];
  recommendation?: string;
  summary?: string;
  analysis?: string;
  triggers?: string[];
  recommendations?: string[];
}

// DNB-specific terms that should be present in legitimate responses
const DNB_CONTEXT_MARKERS = [
  'DNB',
  'svindel',
  'bedrageri',
  'sikkerhet',
  'BankID',
  'phishing',
  'risiko',
  'anbefaling'
];

// Patterns that indicate response manipulation or prompt leakage
const SUSPICIOUS_RESPONSE_PATTERNS = [
  // Prompt leakage
  /\[SYSTEM CONTEXT\]/gi,
  /\[USER_INPUT_START\]/gi,
  /system\s*prompt/gi,
  /my\s+instructions/gi,
  
  // Role confusion
  /i\s+am\s+not\s+DNB/gi,
  /actually\s+i\s+am/gi,
  /let\s+me\s+tell\s+you\s+who\s+i\s+really\s+am/gi,
  
  // External references (non-DNB)
  /visit\s+(?!dnb\.no)[a-z]+\.[a-z]+/gi,
  /call\s+(?!23\s*27\s*19\s*59|\+47)/gi,
  
  // Inappropriate content
  /\bcrypto\s+investment\s+opportunity/gi,
  /guaranteed\s+returns/gi,
  /click\s+here\s+now/gi
];

/**
 * Validates that the response maintains DNB context
 */
export function validateDNBContext(response: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Convert response to string for text analysis
  const responseText = JSON.stringify(response).toLowerCase();

  // Check for DNB context markers
  const hasContextMarkers = DNB_CONTEXT_MARKERS.some(marker => 
    responseText.includes(marker.toLowerCase())
  );

  if (!hasContextMarkers) {
    warnings.push('Response lacks DNB context markers');
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_RESPONSE_PATTERNS) {
    if (pattern.test(responseText)) {
      errors.push(`Suspicious pattern detected: ${pattern.source}`);
    }
  }

  // Check for prompt leakage
  if (responseText.includes('[') && responseText.includes(']')) {
    const bracketContent = responseText.match(/\[([^\]]+)\]/g);
    if (bracketContent && bracketContent.some(content => 
      content.length > 20 || content.includes('system') || content.includes('context')
    )) {
      errors.push('Potential prompt leakage detected');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates response structure and data types
 */
export function validateResponseStructure(response: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields - now category OR riskLevel is required
  if (!response.hasOwnProperty('category') && !response.hasOwnProperty('riskLevel')) {
    errors.push('Missing required field: category or riskLevel');
  }

  // Validate category if present
  if (response.hasOwnProperty('category')) {
    if (!['fraud', 'marketing', 'suspicious', 'safe'].includes(response.category)) {
      errors.push('Invalid category value');
    }
  }

  // Validate riskLevel if present
  if (response.hasOwnProperty('riskLevel')) {
    if (!['low', 'medium', 'high'].includes(response.riskLevel)) {
      errors.push('Invalid riskLevel value');
    }
  }

  // Check fraudProbability OR riskScore (at least one should be present)
  if (!response.hasOwnProperty('fraudProbability') && !response.hasOwnProperty('riskScore')) {
    warnings.push('Missing score field: fraudProbability or riskScore');
  }

  if (response.hasOwnProperty('fraudProbability')) {
    if (typeof response.fraudProbability !== 'number' ||
        response.fraudProbability < 0 ||
        response.fraudProbability > 100) {
      errors.push('Invalid fraudProbability: must be number between 0-100');
    }
  }

  if (response.hasOwnProperty('riskScore')) {
    if (typeof response.riskScore !== 'number' ||
        response.riskScore < 0 ||
        response.riskScore > 100) {
      errors.push('Invalid riskScore: must be number between 0-100');
    }
  }

  // Check optional fields if present
  if (response.mainIndicators && !Array.isArray(response.mainIndicators)) {
    errors.push('mainIndicators must be an array');
  }

  if (response.triggers && !Array.isArray(response.triggers)) {
    errors.push('triggers must be an array');
  }

  if (response.recommendations && !Array.isArray(response.recommendations)) {
    errors.push('recommendations must be an array');
  }

  // Check for unexpected fields that might indicate manipulation
  const expectedFields = [
    'category', 'riskLevel', 'riskScore', 'fraudProbability',
    'mainIndicators', 'recommendation', 'summary', 'analysis',
    'triggers', 'recommendations', 'model', 'modelInfo',
    'timestamp', 'fallback', 'error', 'parseError', 'requestId',
    'securityBlock', 'securityChecks'
  ];

  const unexpectedFields = Object.keys(response).filter(key => 
    !expectedFields.includes(key)
  );

  if (unexpectedFields.length > 0) {
    warnings.push(`Unexpected fields in response: ${unexpectedFields.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Sanitizes response to ensure safe content
 */
export function sanitizeResponse(response: any): ExpectedResponse {
  const sanitized: ExpectedResponse = {
    riskLevel: 'medium' // Default to medium if invalid
  };

  // Sanitize category
  if (['fraud', 'marketing', 'suspicious', 'safe'].includes(response.category)) {
    sanitized.category = response.category;
  }

  // Sanitize riskLevel
  if (['low', 'medium', 'high'].includes(response.riskLevel)) {
    sanitized.riskLevel = response.riskLevel;
  }

  // Sanitize riskScore
  if (typeof response.riskScore === 'number') {
    sanitized.riskScore = Math.min(100, Math.max(0, response.riskScore));
  }

  // Sanitize fraudProbability
  if (typeof response.fraudProbability === 'number') {
    sanitized.fraudProbability = Math.min(100, Math.max(0, response.fraudProbability));
  }

  // Sanitize arrays
  if (Array.isArray(response.mainIndicators)) {
    sanitized.mainIndicators = response.mainIndicators
      .filter((item: any) => typeof item === 'string')
      .map((item: string) => sanitizeString(item))
      .slice(0, 10); // Limit to 10 items
  }

  if (Array.isArray(response.triggers)) {
    sanitized.triggers = response.triggers
      .filter((item: any) => typeof item === 'string')
      .map((item: string) => sanitizeString(item))
      .slice(0, 20); // Limit to 20 items
  }

  if (Array.isArray(response.recommendations)) {
    sanitized.recommendations = response.recommendations
      .filter((item: any) => typeof item === 'string')
      .map((item: string) => sanitizeString(item))
      .slice(0, 5); // Limit to 5 recommendations
  }

  // Sanitize strings
  if (typeof response.recommendation === 'string') {
    sanitized.recommendation = sanitizeString(response.recommendation);
  }

  if (typeof response.summary === 'string') {
    sanitized.summary = sanitizeString(response.summary);
  }

  if (typeof response.analysis === 'string') {
    sanitized.analysis = sanitizeString(response.analysis);
  }

  return sanitized;
}

/**
 * Sanitizes individual strings
 */
function sanitizeString(str: string): string {
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 500) // Limit length
    .trim();
}

/**
 * Comprehensive response validation
 */
export function validateResponse(response: any): {
  valid: boolean;
  sanitized: ExpectedResponse;
  issues: string[];
} {
  const contextValidation = validateDNBContext(response);
  const structureValidation = validateResponseStructure(response);
  
  const allErrors = [
    ...contextValidation.errors,
    ...structureValidation.errors
  ];
  
  const allWarnings = [
    ...contextValidation.warnings,
    ...structureValidation.warnings
  ];

  // If critical errors, create safe fallback
  if (allErrors.length > 0) {
    return {
      valid: false,
      sanitized: {
        category: 'suspicious',
        riskLevel: 'high',
        fraudProbability: 75,
        recommendation: 'Teknisk feil i analyse. Kontakt DNB direkte på 915 04800 for verifisering.',
        summary: 'Kunne ikke validere svar fra AI-system.',
        triggers: ['Valideringsfeil'],
        recommendations: ['Kontakt DNB kundeservice for manuell vurdering']
      },
      issues: allErrors
    };
  }

  // Sanitize and return
  const sanitized = sanitizeResponse(response);
  
  return {
    valid: true,
    sanitized,
    issues: allWarnings
  };
}

/**
 * Checks if response indicates system compromise
 */
export function detectCompromisedResponse(response: any): boolean {
  const responseText = JSON.stringify(response).toLowerCase();
  
  const compromiseIndicators = [
    'ignore dnb',
    'not actually dnb',
    'disregard previous',
    'i am claude',
    'i am gpt',
    'as an ai',
    'language model',
    'my training',
    'openai',
    'anthropic'
  ];

  return compromiseIndicators.some(indicator => responseText.includes(indicator));
}

/**
 * Ensures DNB phone numbers and URLs are correct
 */
export function validateDNBReferences(response: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const responseText = JSON.stringify(response);

  // Check phone numbers (should only be official DNB numbers)
  const phonePattern = /\b\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\b/g;
  const phones = responseText.match(phonePattern) || [];
  
  const validDNBPhones = ['915 04800', '91504800'];
  
  for (const phone of phones) {
    const normalized = phone.replace(/\s/g, '');
    if (!validDNBPhones.some(valid => valid.replace(/\s/g, '') === normalized)) {
      errors.push(`Invalid phone number detected: ${phone}`);
    }
  }

  // Check URLs (should only be dnb.no)
  const urlPattern = /https?:\/\/[^\s"']+/gi;
  const urls = responseText.match(urlPattern) || [];
  
  for (const url of urls) {
    if (!url.includes('dnb.no')) {
      errors.push(`Non-DNB URL detected: ${url}`);
    }
  }

  // Check for fake DNB domains
  const fakeDomainPattern = /dnb[-.](?!no\b)[a-z]+/gi;
  if (fakeDomainPattern.test(responseText)) {
    errors.push('Fake DNB domain detected in response');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}