// JSON Schema for fraud analysis responses
// This ensures consistent, structured outputs from AI models

export interface FraudAnalysisResponse {
  category: 'fraud' | 'marketing' | 'suspicious' | 'context-required' | 'safe';
  riskLevel: 'low' | 'medium' | 'high';
  fraudProbability: number; // 0-100
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
  followUpQuestions: string[]; // exactly 3 questions
}

// JSON Schema definition for OpenRouter structured outputs
export const fraudAnalysisSchema = {
  name: "fraud_analysis_response",
  strict: true,
  schema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: ["fraud", "marketing", "suspicious", "context-required", "safe"],
        description: "Risk category based on analysis"
      },
      riskLevel: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Overall risk level assessment"
      },
      fraudProbability: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description: "Fraud probability as percentage (0-100)"
      },
      mainIndicators: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Primary risk indicators found in the content"
      },
      positiveIndicators: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Positive/legitimate indicators (prefixed with ✅)"
      },
      negativeIndicators: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Negative/suspicious indicators (prefixed with ⚠️ or ❌)"
      },
      educationalContext: {
        type: "object",
        properties: {
          whyThisAssessment: {
            type: "string",
            description: "Explanation of why this assessment was made"
          },
          commonLegitimateUse: {
            type: "string",
            description: "How legitimate actors use similar patterns"
          },
          keyDifference: {
            type: "string",
            description: "What separates legitimate use from fraud"
          }
        },
        required: ["whyThisAssessment", "commonLegitimateUse", "keyDifference"],
        additionalProperties: false
      },
      verificationGuide: {
        type: "object",
        properties: {
          primaryCheck: {
            type: "string",
            description: "Most important thing to check first"
          },
          independentVerification: {
            type: "string",
            description: "How to verify independently"
          },
          alternativeChannel: {
            type: "string",
            description: "Alternative ways to contact/verify"
          }
        },
        required: ["primaryCheck", "independentVerification", "alternativeChannel"],
        additionalProperties: false
      },
      actionableSteps: {
        type: "array",
        items: {
          type: "string"
        },
        minItems: 1,
        maxItems: 3,
        description: "Concrete actionable steps for the user"
      },
      recommendation: {
        type: "string",
        description: "Short recommendation to user in Norwegian"
      },
      summary: {
        type: "string",
        description: "Brief summary in 1-2 sentences in Norwegian"
      },
      followUpQuestions: {
        type: "array",
        items: {
          type: "string"
        },
        minItems: 3,
        maxItems: 3,
        description: "Exactly 3 contextual follow-up questions in Norwegian"
      }
    },
    required: [
      "category",
      "riskLevel",
      "fraudProbability",
      "mainIndicators",
      "positiveIndicators",
      "negativeIndicators",
      "educationalContext",
      "verificationGuide",
      "actionableSteps",
      "recommendation",
      "summary",
      "followUpQuestions"
    ],
    additionalProperties: false
  }
};

// Models that support native JSON schema structured outputs
export const modelsWithStructuredOutputSupport = new Set([
  // OpenAI Models with native JSON schema support
  'openai/gpt-4o-mini',
  'openai/gpt-4o-mini-2024-07-18',
  'openai/gpt-4o-2024-08-06',
  'openai/gpt-4o-2024-11-20',
  'openai/gpt-4o',
  'openai/gpt-4-turbo',
  'openai/gpt-4-turbo-2024-04-09',
  'openai/gpt-3.5-turbo',
  'openai/gpt-5-mini',
  'openai/gpt-4.5-turbo',
  'openai/gpt-5',
  'openai/o1-preview',
  'openai/o1-mini',
  'openai/o1',
  'openai/o3',
  'openai/o3-mini',
  'openai/o4-mini',
  'openai/o4-mini-high',

  // Anthropic Claude models with good JSON output (though not native schema)
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.5-sonnet-20241022',
  'anthropic/claude-3.5-haiku',
  'anthropic/claude-3-opus',
  'anthropic/claude-3-sonnet',
  'anthropic/claude-3-haiku',
  'anthropic/claude-opus-4',
  'anthropic/claude-opus-4.1',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-haiku-4',

  // Google Gemini models with structured output support
  'google/gemini-1.5-pro',
  'google/gemini-1.5-pro-002',
  'google/gemini-1.5-flash',
  'google/gemini-1.5-flash-002',
  'google/gemini-1.5-flash-8b',
  'google/gemini-2.0-flash-exp',
  'google/gemini-2.0-flash',
  'google/gemini-2.0-flash-lite-001',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-pro-preview',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-flash-image-preview',

  // Meta Llama models (newer versions with better instruction following)
  'meta-llama/llama-3.3-70b-instruct',
  'meta-llama/llama-3.2-90b-instruct',
  'meta-llama/llama-3.1-405b-instruct',
  'meta-llama/llama-3.1-70b-instruct',
  'meta-llama/llama-4-maverick-400b',
  'meta-llama/llama-4-scout',
  'meta-llama/llama-4-behemoth',

  // Mistral models with good JSON support
  'mistralai/mistral-large',
  'mistralai/mistral-small-3.1',
  'mistralai/mixtral-8x22b-instruct',

  // xAI Grok models
  'xai/grok-3',
  'xai/grok-2',

  // DeepSeek models
  'deepseek/deepseek-r1',
  'deepseek/deepseek-v3',

  // Qwen models with good instruction following
  'qwen/qwen-2.5-72b-instruct',
  'qwen/qwen-2.5-32b-instruct'
]);

// Check if a model supports native JSON schema
export function supportsStructuredOutput(modelId: string): boolean {
  return modelsWithStructuredOutputSupport.has(modelId);
}

// Check if a model supports OpenAI-style native JSON schema (most reliable)
export function supportsNativeJSONSchema(modelId: string): boolean {
  return modelId.startsWith('openai/') && modelsWithStructuredOutputSupport.has(modelId);
}