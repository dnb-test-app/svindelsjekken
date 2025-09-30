/**
 * Model Helpers
 * Utilities for parsing and working with AI model metadata
 */

import {
  supportsStructuredOutput,
  supportsNativeJSONSchema,
} from '@/lib/schemas/fraudAnalysis.zod';

export interface ModelInfo {
  name: string;
  provider: string;
  supportsStructuredOutput: boolean;
  supportsNativeJSONSchema: boolean;
}

/**
 * Parse model ID into provider and name components
 * @param modelId - Model ID in format "provider/model-name"
 * @returns Object with provider and name
 * @example
 * parseModelId("openai/gpt-4") // { provider: "openai", name: "gpt-4" }
 */
export function parseModelId(modelId: string): { provider: string; name: string } {
  const parts = modelId.split('/');
  return {
    provider: parts[0] || 'unknown',
    name: parts[1] || modelId,
  };
}

/**
 * Get provider from model ID
 * @param modelId - Model ID in format "provider/model-name"
 * @returns Provider name
 * @example
 * getModelProvider("openai/gpt-4") // "openai"
 */
export function getModelProvider(modelId: string): string {
  return parseModelId(modelId).provider;
}

/**
 * Get model name from model ID
 * @param modelId - Model ID in format "provider/model-name"
 * @returns Model name without provider prefix
 * @example
 * getModelName("openai/gpt-4") // "gpt-4"
 */
export function getModelName(modelId: string): string {
  return parseModelId(modelId).name;
}

/**
 * Get comprehensive model information including capabilities
 * @param modelId - Model ID in format "provider/model-name"
 * @returns Complete model metadata
 */
export function getModelInfo(modelId: string): ModelInfo {
  const { provider, name } = parseModelId(modelId);

  return {
    name,
    provider,
    supportsStructuredOutput: supportsStructuredOutput(modelId),
    supportsNativeJSONSchema: supportsNativeJSONSchema(modelId),
  };
}

/**
 * Format model display name with provider
 * @param modelId - Model ID in format "provider/model-name"
 * @returns Formatted display string
 * @example
 * formatModelDisplay("openai/gpt-4") // "gpt-4 (openai)"
 */
export function formatModelDisplay(modelId: string): string {
  const { provider, name } = parseModelId(modelId);
  return `${name} (${provider})`;
}

/**
 * Check if model supports GPT-5 specific features
 * @param modelId - Model ID
 * @returns True if model is GPT-5 variant
 */
export function isGPT5Model(modelId: string): boolean {
  return modelId.includes('gpt-5');
}

/**
 * Get max tokens for model
 * @param modelId - Model ID
 * @returns Maximum token limit for the model
 */
export function getMaxTokens(modelId: string): number {
  if (isGPT5Model(modelId)) {
    return 4000; // Higher limit for GPT-5 models with reasoning
  }
  return 1000; // Default limit
}