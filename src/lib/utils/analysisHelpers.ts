/**
 * Analysis Helper Functions
 * Extracted from page.tsx handleCheck to reduce complexity
 */

import { fileToBase64 } from './fileHelpers';
import { ANALYSIS } from '@/lib/constants/appConstants';

export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface AnalysisContext {
  imageData?: ImageData;
  ocrText?: string;
  additionalContext?: string;
}

export interface AnalysisRequest {
  text: string;
  model: string;
  context?: AnalysisContext;
}

/**
 * Convert uploaded file to base64 image data
 * @param file - File to convert
 * @param onProgress - Progress callback
 * @returns Image data or null if conversion fails
 */
export async function prepareImageData(
  file: File | null,
  onProgress?: (progress: number) => void
): Promise<ImageData | null> {
  if (!file) {
    return null;
  }

  onProgress?.(10);

  try {
    const base64 = await fileToBase64(file);

    const imageData: ImageData = {
      base64,
      mimeType: file.type,
    };

    onProgress?.(50);
    return imageData;
  } catch (error) {
    console.error("Failed to convert image:", error);
    onProgress?.(0);
    return null;
  }
}

/**
 * Check if web verification is needed
 * Always returns true - web search is always enabled, AI decides when to use it
 * @param text - Text to analyze (unused, kept for API compatibility)
 * @returns Object with needsVerification always true and empty reasons
 */
export function checkWebVerificationNeeds(text: string): {
  needsVerification: boolean;
  reasons: string[];
} {
  // Always enable web search - let AI decide when to use it based on prompt
  return {
    needsVerification: true,
    reasons: [],
  };
}

/**
 * Build context object for API request
 * @param imageData - Image data if available
 * @param ocrText - OCR-extracted text if available
 * @param additionalContext - Additional context for URLs
 * @param urlDetected - Whether URL was detected
 * @returns Context object or undefined
 */
export function buildAnalysisContext(
  imageData: ImageData | null,
  ocrText: string,
  additionalContext: string,
  urlDetected: boolean
): AnalysisContext | undefined {
  const contextData: AnalysisContext = {};

  if (imageData) {
    contextData.imageData = imageData;
  }

  if (ocrText) {
    contextData.ocrText = ocrText;
  }

  if (urlDetected && additionalContext.trim()) {
    contextData.additionalContext = additionalContext.trim();
  }

  return Object.keys(contextData).length > 0 ? contextData : undefined;
}

/**
 * Create error result for API failures
 * @param status - HTTP status code
 * @returns Error result object
 */
export function createErrorResult(status?: number) {
  let errorMessage = "AI-analyse utilgjengelig.";
  let recommendation = "Analyse utilgjengelig - vær ekstra forsiktig";
  let summary = "Kunne ikke analysere innholdet på grunn av tekniske problemer";
  let retryable = false;

  if (status === 429) {
    errorMessage =
      "For mange forespørsler. Vennligst vent et øyeblikk og prøv igjen.";
    recommendation = "Vent og prøv igjen - vær ekstra forsiktig i mellomtiden";
    summary = "Midlertidig utilgjengelig på grunn av høy trafikk";
    retryable = true;
  }

  return {
    result: {
      category: "error" as const,
      score: 0,
      risk: "unknown" as const,
      triggers: [],
      categories: [],
      fallbackMode: true,
      recommendation,
      summary,
      retryable,
    },
    error: errorMessage,
  };
}

/**
 * Create insufficient text error result
 * @returns Error result for short text
 */
export function createInsufficientTextResult() {
  return {
    category: "error" as const,
    score: 50,
    risk: "medium" as const,
    triggers: ["Tekst for kort"],
    categories: ["Utilstrekkelig input"],
    fallbackMode: true,
    recommendation: "Tekst for kort for pålitelig analyse - vær forsiktig",
    summary: `Minimum ${ANALYSIS.MIN_TEXT_LENGTH} tegn kreves for sikker analyse`,
  };
}

/**
 * Transform AI result to analysis result format
 * @param aiResult - AI API response
 * @returns Formatted analysis result
 */
export function transformAIResult(aiResult: any) {
  return {
    category: aiResult.category || "info",
    score: aiResult.fraudProbability || 0,
    risk: aiResult.riskLevel || "low",
    triggers:
      aiResult.mainIndicators?.map((ind: string) => ({
        pattern: ind,
        category: "ai_detected",
        weight: 10,
      })) || [],
    categories: ["ai_analysis"],
    aiEnhanced: true,
    recommendation: aiResult.recommendation,
    summary: aiResult.summary,
    educationalContext: aiResult.educationalContext || null,
    verificationGuide: aiResult.verificationGuide || null,
    actionableSteps: aiResult.actionableSteps || [],
  };
}

/**
 * Check if analysis result requires context refinement
 * @param aiResult - AI API response
 * @returns True if refinement is needed
 */
export function requiresContextRefinement(aiResult: any): boolean {
  return (
    aiResult.category === "context-required" ||
    (aiResult.followUpQuestions && aiResult.followUpQuestions.length > 0)
  );
}

/**
 * Validate if text or image is sufficient for analysis
 * @param text - Text to analyze
 * @param imageData - Image data if available
 * @returns True if sufficient
 */
export function hasSufficientInput(
  text: string,
  imageData: ImageData | null
): boolean {
  return text.length >= ANALYSIS.MIN_TEXT_LENGTH || imageData !== null;
}