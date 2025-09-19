// Robust JSON extraction utility for AI model responses
// Handles text before JSON, malformed JSON, and various edge cases

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fallbackUsed?: string;
  originalContent?: string;
}

export interface FraudAnalysisResult {
  category: 'fraud' | 'marketing' | 'suspicious' | 'safe' | 'context-required';
  riskLevel: 'low' | 'medium' | 'high';
  fraudProbability: number;
  mainIndicators: string[];
  recommendation: string;
  summary: string;
  followUpQuestions?: string[];
}

/**
 * Universal robust JSON parser for all AI models
 * Includes enhanced strategies that work well for GPT-5 and other models
 */
export class RobustJsonParser {

  /**
   * Main parsing function with multiple fallback strategies
   * Works universally for all AI models with enhanced preprocessing
   */
  static parseAIResponse<T = FraudAnalysisResult>(content: string): ParseResult<T> {
    if (!content || typeof content !== 'string') {
      return {
        success: false,
        error: 'Empty or invalid content',
        originalContent: content
      };
    }

    // Apply universal preprocessing (beneficial for all models)
    const preprocessedContent = this.preprocessContent(content);

    return this.parseWithStrategies<T>(preprocessedContent, content);
  }

  /**
   * Preprocess content with universal optimizations
   */
  private static preprocessContent(content: string): string {
    let cleaned = content.trim();

    // Universal reasoning patterns that many models use
    const reasoningPatterns = [
      /^[\s\S]*?(?=\{)/, // Remove everything before first brace
      /^Let me analyze[\s\S]*?(?=\{)/i,
      /^Based on[\s\S]*?(?=\{)/i,
      /^Looking at[\s\S]*?(?=\{)/i,
      /^Here[\s\S]*?(?=\{)/i,
      /^Analysis:[\s\S]*?(?=\{)/i
    ];

    for (const pattern of reasoningPatterns) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, '').trim();
        break;
      }
    }

    return cleaned;
  }

  /**
   * Core parsing with fallback strategies
   */
  private static parseWithStrategies<T>(content: string, originalContent: string): ParseResult<T> {
    const strategies = [
      () => this.directParse<T>(content),
      () => this.extractFromCodeBlocks<T>(content),
      () => this.regexExtraction<T>(content),
      () => this.cleanAndParse<T>(content),
      () => this.fixCommonIssues<T>(content),
      () => this.partialRecovery<T>(content)
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        const result = strategies[i]();
        if (result.success) {
          return result;
        }
      } catch (error) {
        // Continue to next strategy
        console.debug(`Strategy ${i + 1} failed:`, error);
      }
    }

    // All strategies failed, return fallback
    return this.createFallback<T>(originalContent);
  }

  /**
   * Strategy 1: Direct JSON parsing
   */
  private static directParse<T>(content: string): ParseResult<T> {
    try {
      const parsed = JSON.parse(content.trim());
      return {
        success: true,
        data: parsed,
        fallbackUsed: 'direct_parse'
      };
    } catch (error) {
      throw new Error('Direct parse failed');
    }
  }

  /**
   * Strategy 2: Extract JSON from markdown code blocks
   */
  private static extractFromCodeBlocks<T>(content: string): ParseResult<T> {
    const patterns = [
      /```json\s*(\{[\s\S]*?\})\s*```/,
      /```\s*(\{[\s\S]*?\})\s*```/,
      /`(\{[\s\S]*?\})`/
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        try {
          const parsed = JSON.parse(match[1].trim());
          return {
            success: true,
            data: parsed,
            fallbackUsed: 'code_block_extraction'
          };
        } catch {
          continue;
        }
      }
    }

    throw new Error('Code block extraction failed');
  }

  /**
   * Strategy 3: Regex extraction for JSON objects
   */
  private static regexExtraction<T>(content: string): ParseResult<T> {
    // Look for JSON-like patterns
    const patterns = [
      /\{[\s\S]*\}/,  // Basic curly braces
      /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/,  // Nested objects
      /\{[\s\S]*?"[^"]*"[\s\S]*?\}/  // Must contain at least one string property
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          return {
            success: true,
            data: parsed,
            fallbackUsed: 'regex_extraction'
          };
        } catch {
          continue;
        }
      }
    }

    throw new Error('Regex extraction failed');
  }

  /**
   * Strategy 4: Clean common prefixes/suffixes and parse
   */
  private static cleanAndParse<T>(content: string): ParseResult<T> {
    let cleaned = content.trim();

    // Remove common AI model prefixes
    const prefixPatterns = [
      /^.*?(?=\{)/,  // Remove everything before first {
      /^(Here's the analysis|Here is|Based on|The result is|Analysis:|Result:).*?(?=\{)/i,
      /^```json\s*/i,
      /^```\s*/,
      /^Here[\s\S]*?(?=\{)/i
    ];

    // Remove common suffixes
    const suffixPatterns = [
      /\}\s*```.*$/,
      /\}\s*$.*$/,
      /\}[\s\S]*?$/
    ];

    for (const pattern of prefixPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Find the JSON object
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start !== -1 && end !== -1 && start <= end) {
      const jsonStr = cleaned.substring(start, end + 1);
      try {
        const parsed = JSON.parse(jsonStr);
        return {
          success: true,
          data: parsed,
          fallbackUsed: 'clean_and_parse'
        };
      } catch {
        // Continue to next strategy
      }
    }

    throw new Error('Clean and parse failed');
  }

  /**
   * Strategy 5: Fix common JSON issues
   */
  private static fixCommonIssues<T>(content: string): ParseResult<T> {
    let fixed = content.trim();

    // Common fixes
    const fixes = [
      // Fix unescaped quotes
      { pattern: /([^\\])"/g, replacement: '$1\\"' },
      // Fix trailing commas
      { pattern: /,(\s*[}\]])/g, replacement: '$1' },
      // Fix missing quotes around keys
      { pattern: /(\w+):/g, replacement: '"$1":' },
      // Fix single quotes
      { pattern: /'/g, replacement: '"' },
      // Fix newlines in strings
      { pattern: /"\s*\n\s*([^"]*?)"/g, replacement: '"$1"' }
    ];

    for (const fix of fixes) {
      fixed = fixed.replace(fix.pattern, fix.replacement);
    }

    try {
      const parsed = JSON.parse(fixed);
      return {
        success: true,
        data: parsed,
        fallbackUsed: 'common_fixes'
      };
    } catch {
      throw new Error('Common fixes failed');
    }
  }

  /**
   * Strategy 6: Partial recovery for truncated JSON
   */
  private static partialRecovery<T>(content: string): ParseResult<T> {
    const start = content.indexOf('{');
    if (start === -1) throw new Error('No JSON start found');

    let braceCount = 0;
    let end = start;

    for (let i = start; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      if (braceCount === 0) {
        end = i;
        break;
      }
    }

    if (braceCount === 0) {
      try {
        const jsonStr = content.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        return {
          success: true,
          data: parsed,
          fallbackUsed: 'partial_recovery'
        };
      } catch {
        // Continue
      }
    }

    throw new Error('Partial recovery failed');
  }

  /**
   * Create error result when all parsing strategies fail
   */
  private static createFallback<T>(content: string): ParseResult<T> {
    return {
      success: false,
      data: undefined,
      error: 'All parsing strategies failed',
      fallbackUsed: 'complete_fallback',
      originalContent: content.substring(0, 200) + (content.length > 200 ? '...' : '')
    };
  }

  /**
   * Validate fraud analysis result has required fields
   */
  static validateFraudAnalysis(data: any): FraudAnalysisResult {
    const validated: FraudAnalysisResult = {
      category: this.validateCategory(data.category),
      riskLevel: this.validateRiskLevel(data.riskLevel),
      fraudProbability: this.validateNumber(data.fraudProbability, 0, 100, 50),
      mainIndicators: this.validateArray(data.mainIndicators, 'string', ['Analyse ukjent']),
      recommendation: this.validateString(data.recommendation, 'Vær forsiktig og kontakt DNB ved tvil.'),
      summary: this.validateString(data.summary, 'Analyse gjennomført.'),
      followUpQuestions: this.validateArray(data.followUpQuestions, 'string', [])
    };

    return validated;
  }

  private static validateCategory(value: any): 'fraud' | 'marketing' | 'suspicious' | 'safe' | 'context-required' {
    const validCategories = ['fraud', 'marketing', 'suspicious', 'safe', 'context-required'];
    return validCategories.includes(value) ? value : 'suspicious';
  }

  private static validateRiskLevel(value: any): 'low' | 'medium' | 'high' {
    const validLevels = ['low', 'medium', 'high'];
    return validLevels.includes(value) ? value : 'medium';
  }

  private static validateNumber(value: any, min: number, max: number, defaultValue: number): number {
    if (typeof value === 'number' && value >= min && value <= max) {
      return value;
    }
    return defaultValue;
  }

  private static validateArray(value: any, type: string, defaultValue: any[]): any[] {
    if (Array.isArray(value) && value.length > 0) {
      const filteredArray = value.filter(item => typeof item === type && item.trim().length > 0);
      // Only return the array if it has meaningful content, otherwise return empty array
      return filteredArray.length > 0 ? filteredArray : [];
    }
    // For follow-up questions, return empty array instead of static defaults when LLM didn't provide them
    return [];
  }

  private static validateString(value: any, defaultValue: string): string {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : defaultValue;
  }

}

// Universal convenience function for fraud analysis (works for all models)
export function parseFraudAnalysis(content: string): ParseResult<FraudAnalysisResult> {
  const result = RobustJsonParser.parseAIResponse<FraudAnalysisResult>(content);

  if (result.data) {
    result.data = RobustJsonParser.validateFraudAnalysis(result.data);
  }

  return result;
}

// Alias for backward compatibility - now uses the same universal parser
export const parseGPT5FraudAnalysis = parseFraudAnalysis;