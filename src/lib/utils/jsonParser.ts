// Simple JSON parser for native structured output from AI models
// No fallbacks - requires proper JSON response format

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  originalContent?: string;
}

export interface FraudAnalysisResult {
  category: 'fraud' | 'marketing' | 'context-required' | 'info';
  riskLevel: 'low' | 'medium' | 'high';
  fraudProbability: number;
  mainIndicators: string[];
  positiveIndicators: string[];
  negativeIndicators: string[];
  educationalContext: {
    whyThisAssessment: string;
    commonLegitimateUse: string;
    keyDifference: string;
  };
  verificationGuide: {
    primaryCheck: string;
    independentVerification: string;
    alternativeChannel: string;
  };
  actionableSteps: string[];
  recommendation: string;
  summary: string;
  followUpQuestions: string[];
}

/**
 * Parse AI response expecting native JSON structured output
 * No fallback strategies - fails immediately if not valid JSON
 */
export function parseFraudAnalysis(content: string): ParseResult<FraudAnalysisResult> {
  if (!content || typeof content !== 'string') {
    return {
      success: false,
      error: 'Empty or invalid content received from AI model',
      originalContent: content
    };
  }

  try {
    // Direct JSON parse - no preprocessing or fallbacks
    const parsed = JSON.parse(content.trim());

    // Basic validation of required fields
    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false,
        error: 'AI response is not a valid JSON object',
        originalContent: content
      };
    }

    // Validate essential fields exist
    const requiredFields = [
      'category', 'riskLevel', 'fraudProbability', 'mainIndicators',
      'recommendation', 'summary', 'followUpQuestions'
    ];

    for (const field of requiredFields) {
      if (!(field in parsed)) {
        return {
          success: false,
          error: `Missing required field: ${field}`,
          originalContent: content
        };
      }
    }

    // Ensure followUpQuestions is an array
    if (!Array.isArray(parsed.followUpQuestions)) {
      parsed.followUpQuestions = [];
    }

    return {
      success: true,
      data: parsed as FraudAnalysisResult
    };
  } catch (error) {
    return {
      success: false,
      error: `Invalid JSON response from AI model: ${error instanceof Error ? error.message : 'Parse failed'}`,
      originalContent: content
    };
  }
}