// JSON Schema for fraud analysis responses
// This ensures consistent, structured outputs from AI models

// Re-export Zod-generated types and schemas for backward compatibility
export {
  type URLVerification,
  type QuestionOption,
  type ContextQuestion,
  type EducationalContext,
  type VerificationGuide,
  type FraudAnalysisResponse,
  fraudAnalysisJsonSchema as fraudAnalysisSchema,
  modelsWithStructuredOutputSupport,
  supportsStructuredOutput,
  supportsNativeJSONSchema,
  validateFraudAnalysisResponse,
  safeFraudAnalysisValidation,
} from './fraudAnalysis.zod';