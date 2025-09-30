// Zod-based schema definition for fraud analysis responses
// This is the single source of truth for all fraud analysis types and validation

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// URL Verification Schema
export const URLVerificationSchema = z.object({
  url: z.string(),
  status: z.enum(['legitimate', 'unknown', 'verified_scam']),
  verificationDetails: z.string().describe('Details from web search (e.g., "Established 2012, legitimate clothing retailer")'),
});

// Question Option Schema
export const QuestionOptionSchema = z.object({
  value: z.string().describe('Unique value for this option'),
  label: z.string().describe('Display text for this option'),
  emoji: z.string().describe('Emoji for visual clarity (required for consistency)'),
});

// Context Question Schema - with conditional validation
export const ContextQuestionSchema = z.object({
  question: z.string().describe('The question text in Norwegian'),
  type: z.enum(['yes-no', 'multiple-choice']).describe('Type of question determining answer options'),
  options: z.array(QuestionOptionSchema).optional().describe('Array of options for multiple-choice questions (not required for yes-no)'),
}).refine((data) => {
  // If type is multiple-choice, options must be present
  if (data.type === 'multiple-choice') {
    return data.options && data.options.length > 0;
  }
  // If type is yes-no, options should not be present
  return data.type === 'yes-no';
}, {
  message: "Multiple-choice questions must have options, yes-no questions should not have options",
});

// Educational Context Schema
export const EducationalContextSchema = z.object({
  whyThisAssessment: z.string().describe('Explanation of why this assessment was made'),
  commonLegitimateUse: z.string().describe('How legitimate actors use similar patterns'),
  keyDifference: z.string().describe('What separates legitimate use from fraud'),
});

// Verification Guide Schema
export const VerificationGuideSchema = z.object({
  primaryCheck: z.string().describe('Most important thing to check first'),
  independentVerification: z.string().describe('How to verify independently'),
  alternativeChannel: z.string().describe('Alternative ways to contact/verify'),
});

// Main Fraud Analysis Response Schema
export const FraudAnalysisResponseSchema = z.object({
  category: z.enum(['fraud', 'marketing', 'context-required', 'info']).describe('Risk category based on analysis'),
  riskLevel: z.enum(['low', 'medium', 'high']).describe('Overall risk level assessment'),
  fraudProbability: z.number().int().min(0).max(100).describe('Fraud probability as percentage (0-100)'),
  mainIndicators: z.array(z.string()).describe('Primary risk indicators found in the content'),
  positiveIndicators: z.array(z.string()).describe('Positive/legitimate indicators (prefixed with ✅)'),
  negativeIndicators: z.array(z.string()).describe('Negative/suspicious indicators (prefixed with ⚠️ or ❌)'),
  urlVerifications: z.array(URLVerificationSchema).describe('Detailed URL verification results from web search (only when web search is enabled)'),
  educationalContext: EducationalContextSchema,
  verificationGuide: VerificationGuideSchema,
  actionableSteps: z.array(z.string()).min(1).max(3).describe('Concrete actionable steps for the user'),
  recommendation: z.string().describe('Short recommendation to user in Norwegian'),
  summary: z.string().describe('Brief summary in 1-2 sentences in Norwegian'),
  followUpQuestions: z.array(ContextQuestionSchema).length(3).describe('Exactly 3 contextual follow-up questions with enhanced format'),
});

// Export TypeScript types generated from Zod schemas
export type URLVerification = z.infer<typeof URLVerificationSchema>;
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;
export type ContextQuestion = z.infer<typeof ContextQuestionSchema>;
export type EducationalContext = z.infer<typeof EducationalContextSchema>;
export type VerificationGuide = z.infer<typeof VerificationGuideSchema>;
export type FraudAnalysisResponse = z.infer<typeof FraudAnalysisResponseSchema>;

// Generate JSON Schema for OpenAI API
// Note: For now, we'll use a manual schema due to OpenAI's strict mode limitations
export const fraudAnalysisJsonSchema = {
  name: "fraud_analysis_response",
  strict: true,
  schema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: ["fraud", "marketing", "context-required", "info"],
        description: "Risk category based on analysis",
      },
      riskLevel: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Overall risk level assessment",
      },
      fraudProbability: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description: "Fraud probability as percentage (0-100)",
      },
      mainIndicators: {
        type: "array",
        items: { type: "string" },
        description: "Primary risk indicators found in the content",
      },
      positiveIndicators: {
        type: "array",
        items: { type: "string" },
        description: "Positive/legitimate indicators (prefixed with ✅)",
      },
      negativeIndicators: {
        type: "array",
        items: { type: "string" },
        description: "Negative/suspicious indicators (prefixed with ⚠️ or ❌)",
      },
      urlVerifications: {
        type: "array",
        items: {
          type: "object",
          properties: {
            url: { type: "string", description: "The URL that was verified" },
            status: {
              type: "string",
              enum: ["legitimate", "unknown", "verified_scam"],
              description: "Verification status from web search",
            },
            verificationDetails: {
              type: "string",
              description: "Details from web search findings",
            },
          },
          required: ["url", "status", "verificationDetails"],
          additionalProperties: false,
        },
        description: "Detailed URL verification results from web search",
      },
      educationalContext: {
        type: "object",
        properties: {
          whyThisAssessment: {
            type: "string",
            description: "Explanation of why this assessment was made",
          },
          commonLegitimateUse: {
            type: "string",
            description: "How legitimate actors use similar patterns",
          },
          keyDifference: {
            type: "string",
            description: "What separates legitimate use from fraud",
          },
        },
        required: ["whyThisAssessment", "commonLegitimateUse", "keyDifference"],
        additionalProperties: false,
      },
      verificationGuide: {
        type: "object",
        properties: {
          primaryCheck: {
            type: "string",
            description: "Most important thing to check first",
          },
          independentVerification: {
            type: "string",
            description: "How to verify independently",
          },
          alternativeChannel: {
            type: "string",
            description: "Alternative ways to contact/verify",
          },
        },
        required: ["primaryCheck", "independentVerification", "alternativeChannel"],
        additionalProperties: false,
      },
      actionableSteps: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 3,
        description: "Concrete actionable steps for the user",
      },
      recommendation: {
        type: "string",
        description: "Short recommendation to user in Norwegian",
      },
      summary: {
        type: "string",
        description: "Brief summary in 1-2 sentences in Norwegian",
      },
      followUpQuestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: {
              type: "string",
              description: "The question text in Norwegian",
            },
            type: {
              type: "string",
              enum: ["yes-no", "multiple-choice"],
              description: "Type of question determining answer options",
            },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  value: { type: "string", description: "Unique value for this option" },
                  label: { type: "string", description: "Display text for this option" },
                  emoji: { type: "string", description: "Emoji for visual clarity" },
                },
                required: ["value", "label", "emoji"],
                additionalProperties: false,
              },
              description: "Array of options. For yes-no questions, use empty array []",
            },
          },
          required: ["question", "type", "options"],
          additionalProperties: false,
        },
        minItems: 3,
        maxItems: 3,
        description: "Exactly 3 contextual follow-up questions with enhanced format",
      },
    },
    required: [
      "category", "riskLevel", "fraudProbability", "mainIndicators",
      "positiveIndicators", "negativeIndicators", "urlVerifications",
      "educationalContext", "verificationGuide", "actionableSteps",
      "recommendation", "summary", "followUpQuestions"
    ],
    additionalProperties: false,
  },
};

// Models that support structured output (keep this for compatibility)
export const modelsWithStructuredOutputSupport = new Set([
  // OpenAI Models with native JSON schema support
  "openai/gpt-5-mini",
  "openai/gpt-5-mini-2024-07-18",
  "openai/gpt-4o-2024-08-06",
  "openai/gpt-4o-2024-11-20",
  "openai/gpt-4o",
  "openai/gpt-4-turbo",
  "openai/gpt-4-turbo-2024-04-09",
  "openai/gpt-3.5-turbo",
  "openai/gpt-5-mini",
  "openai/gpt-4.5-turbo",
  "openai/gpt-5",
  "openai/o1-preview",
  "openai/o1-mini",
  "openai/o1",
  "openai/o3",
  "openai/o3-mini",
  "openai/o4-mini",
  "openai/o4-mini-high",

  // Anthropic Claude models with good JSON output
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-sonnet-20241022",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-3-opus",
  "anthropic/claude-3-sonnet",
  "anthropic/claude-3-haiku",
  "anthropic/claude-opus-4",
  "anthropic/claude-opus-4.1",
  "anthropic/claude-sonnet-4",
  "anthropic/claude-haiku-4",

  // Google Gemini models with structured output support
  "google/gemini-1.5-pro",
  "google/gemini-1.5-pro-002",
  "google/gemini-1.5-flash",
  "google/gemini-1.5-flash-002",
  "google/gemini-1.5-flash-8b",
  "google/gemini-2.0-flash-exp",
  "google/gemini-2.0-flash",
  "google/gemini-2.0-flash-lite-001",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-pro-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-flash-image-preview",

  // Meta Llama models
  "meta-llama/llama-3.3-70b-instruct",
  "meta-llama/llama-3.2-90b-instruct",
  "meta-llama/llama-3.1-405b-instruct",
  "meta-llama/llama-3.1-70b-instruct",
  "meta-llama/llama-4-maverick-400b",
  "meta-llama/llama-4-scout",
  "meta-llama/llama-4-behemoth",

  // Mistral models
  "mistralai/mistral-large",
  "mistralai/mistral-small-3.1",
  "mistralai/mixtral-8x22b-instruct",

  // xAI Grok models
  "xai/grok-3",
  "xai/grok-2",

  // DeepSeek models
  "deepseek/deepseek-r1",
  "deepseek/deepseek-v3",

  // Qwen models
  "qwen/qwen-2.5-72b-instruct",
  "qwen/qwen-2.5-32b-instruct",
]);

// Helper functions (keep for compatibility)
export function supportsStructuredOutput(modelId: string): boolean {
  return modelsWithStructuredOutputSupport.has(modelId);
}

export function supportsNativeJSONSchema(modelId: string): boolean {
  return (
    modelId.startsWith("openai/") &&
    modelsWithStructuredOutputSupport.has(modelId)
  );
}

// Runtime validation function
export function validateFraudAnalysisResponse(data: unknown): FraudAnalysisResponse {
  return FraudAnalysisResponseSchema.parse(data);
}

// Safe validation function that returns success/error
export function safeFraudAnalysisValidation(data: unknown) {
  const result = FraudAnalysisResponseSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    error: result.success ? null : result.error,
  };
}