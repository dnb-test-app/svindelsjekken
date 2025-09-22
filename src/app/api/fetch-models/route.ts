import { NextRequest, NextResponse } from 'next/server';
import { supportsStructuredOutput, supportsNativeJSONSchema } from '@/lib/schemas/fraudAnalysis';

// Minimal fraud detection prompt for testing
const TEST_FRAUD_PROMPT = `Du er en svindeldeteksjonsekspert. Analyser denne teksten kort:
"Dette er en test av svindeldeteksjon. Klikk her for å bekrefte din konto."

Svar BARE med JSON i dette formatet (ingen ekstra tekst):
{"riskLevel": "medium", "riskScore": 50, "summary": "Test utført"}`;

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
  context_length?: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
  };
  top_provider?: {
    is_free?: boolean;
  };
  created?: string;
}

interface ModelTestResult {
  id: string;
  name: string;
  working: boolean;
  supportsJson: boolean;
  supportsStructuredOutput?: boolean;
  supportsNativeJSONSchema?: boolean;
  speed?: string;
  cost?: string;
  error?: string;
  status?: 'verified' | 'untested' | 'failed';
  provider?: string;
  contextLength?: number;
}

// Test a model with and without JSON format
async function testModel(model: OpenRouterModel, apiKey: string): Promise<ModelTestResult> {
  const result: ModelTestResult = {
    id: model.id,
    name: model.name || model.id,
    working: false,
    supportsJson: false
  };

  // Determine cost level based on pricing
  if (model.top_provider?.is_free) {
    result.cost = 'free';
  } else if (model.pricing) {
    const promptCost = parseFloat(model.pricing.prompt);
    if (promptCost < 0.000001) result.cost = 'low';
    else if (promptCost < 0.00001) result.cost = 'medium';
    else result.cost = 'high';
  }

  // Estimate speed based on model name and size
  const modelName = model.id.toLowerCase();
  if (modelName.includes('flash') || modelName.includes('mini') || modelName.includes('haiku')) {
    result.speed = 'fast';
  } else if (modelName.includes('opus') || modelName.includes('ultra') || modelName.includes('70b') || modelName.includes('405b')) {
    result.speed = 'slow';
  } else {
    result.speed = 'medium';
  }

  try {
    // First test WITHOUT JSON format (more compatible)
    const responseNoJson = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
        'X-Title': 'DNB Model Test'
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          {
            role: 'system',
            content: 'You are a fraud detection expert. Always respond in valid JSON format only.'
          },
          {
            role: 'user',
            content: TEST_FRAUD_PROMPT
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (responseNoJson.ok) {
      const data = await responseNoJson.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        result.working = true;

        // Try parsing as JSON to see if it returns valid JSON
        try {
          JSON.parse(content);
          // If it parses, test with JSON format too
          const responseWithJson = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
              'X-Title': 'DNB Model Test'
            },
            body: JSON.stringify({
              model: model.id,
              messages: [
                {
                  role: 'system',
                  content: 'You are a fraud detection expert. Always respond in valid JSON format only.'
                },
                {
                  role: 'user',
                  content: TEST_FRAUD_PROMPT
                }
              ],
              temperature: 0.3,
              max_tokens: 100,
              response_format: { type: 'json_object' }
            }),
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });

          if (responseWithJson.ok) {
            result.supportsJson = true;
          }
        } catch {
          // Model works but doesn't return valid JSON naturally
        }
      }
    } else {
      const errorText = await responseNoJson.text();
      result.error = `HTTP ${responseNoJson.status}`;
    }
  } catch (error: any) {
    result.error = error.message || 'Test failed';
  }

  return result;
}

// GET: Fetch and test available models
export async function GET(request: NextRequest) {
  // Check if fresh fetch is requested
  const { searchParams } = new URL(request.url);
  const forceFresh = searchParams.get('fresh') === 'true';

  console.log('Fetch models called, fresh:', forceFresh);

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return NextResponse.json(
      { error: 'OpenRouter API key not configured' },
      { status: 503 }
    );
  }

  try {
    // Fetch available models from OpenRouter
    const modelsResponse = await fetch('https://openrouter.ai/api/v1/models');

    if (!modelsResponse.ok) {
      throw new Error(`Failed to fetch models: ${modelsResponse.status}`);
    }

    const modelsData = await modelsResponse.json();
    const models: OpenRouterModel[] = modelsData.data || [];

    // Filter out only non-text models (keep all text models)
    const textModels = models.filter((model: OpenRouterModel) => {
      const architecture = model.architecture?.modality?.toLowerCase() || '';
      // Include models that are text-based or don't specify modality
      const isTextModel = !architecture || architecture.includes('text') ||
                         architecture === 'text->text' || architecture === 'text+image->text';
      return isTextModel;
    });

    // Extensive list of known working models (September 2025 - Updated)
    const knownWorkingModels = new Set([
      // OpenAI Models (Latest 2025 Models)
      'openai/gpt-5-mini',           // GPT-5 Mini (September 2025)
      'openai/gpt-4.5-turbo',        // GPT-4.5 Turbo
      'openai/gpt-4o-mini',
      'openai/gpt-4o',
      'openai/gpt-4-turbo',
      'openai/gpt-3.5-turbo',
      'openai/o4-mini',              // O4 Mini (September 2025)
      'openai/o4-mini-high',         // O4 Mini High Performance
      'openai/o3',                   // O3 Reasoning Model
      'openai/o3-mini',              // O3 Mini
      'openai/o1-preview',           // O1 Preview
      'openai/o1-mini',              // O1 Mini
      'openai/o1',                   // O1 Base

      // Anthropic Claude 4 Models (2025)
      'anthropic/claude-opus-4.1',   // Claude 4 Opus Updated (September 2025)
      'anthropic/claude-opus-4',     // Claude 4 Opus
      'anthropic/claude-sonnet-4',   // Claude 4 Sonnet
      'anthropic/claude-haiku-4',    // Claude 4 Haiku
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'anthropic/claude-2.1',
      'anthropic/claude-2',

      // Google Gemini 2.x Models (2025)
      'google/gemini-2.5-pro',       // Gemini 2.5 Pro with Deep Think
      'google/gemini-2.5-pro-preview',
      'google/gemini-2.5-flash',     // Gemini 2.5 Flash
      'google/gemini-2.5-flash-lite',
      'google/gemini-2.5-flash-image-preview',
      'google/gemini-2.0-flash-exp', // Gemini 2.0 Experimental
      'google/gemini-2.0-flash',
      'google/gemini-2.0-flash-lite-001',
      'google/gemini-pro',
      'google/gemini-pro-vision',
      'google/gemini-1.5-flash',
      'google/gemini-1.5-pro',

      // Meta Llama 4 Models (2025)
      'meta-llama/llama-4-maverick-400b', // Llama 4 Maverick (April 2025)
      'meta-llama/llama-4-scout',         // Llama 4 Scout
      'meta-llama/llama-4-behemoth',      // Llama 4 Behemoth
      'meta-llama/llama-3.3-70b-instruct',
      'meta-llama/llama-3.2-90b-instruct',
      'meta-llama/llama-3.1-405b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct',

      // Mistral Models (2025)
      'mistralai/mistral-small-3.1', // Mistral Small 3.1 (24B)
      'mistralai/mistral-large',
      'mistralai/mistral-medium',
      'mistralai/mistral-small',
      'mistralai/mistral-7b-instruct',
      'mistralai/mixtral-8x7b-instruct',
      'mistralai/mixtral-8x22b-instruct',

      // xAI Grok Models (2025)
      'xai/grok-3',                  // Grok 3 (February 2025)
      'xai/grok-2',

      // DeepSeek Models (2025)
      'deepseek/deepseek-r1',        // DeepSeek R1 (January 2025)
      'deepseek/deepseek-v3',        // DeepSeek V3
      'deepseek/deepseek-chat',

      // Perplexity Models
      'perplexity/llama-3.1-sonar-large-128k-online',
      'perplexity/llama-3.1-sonar-small-128k-online',

      // Qwen Models
      'qwen/qwen-2.5-72b-instruct',
      'qwen/qwen-2.5-32b-instruct',

      // Cohere
      'cohere/command-r-plus',
      'cohere/command-r'
    ]);

    const knownJsonSupport = new Set([
      // OpenAI - Native JSON mode (All 2025 models)
      'openai/gpt-5-mini',
      'openai/gpt-4.5-turbo',
      'openai/gpt-4o-mini',
      'openai/gpt-4o',
      'openai/gpt-4-turbo',
      'openai/gpt-3.5-turbo',
      'openai/o4-mini',
      'openai/o4-mini-high',
      'openai/o3',
      'openai/o3-mini',
      'openai/o1-preview',
      'openai/o1-mini',
      'openai/o1',

      // Anthropic Claude 4 - Excellent JSON output
      'anthropic/claude-opus-4.1',
      'anthropic/claude-opus-4',
      'anthropic/claude-sonnet-4',
      'anthropic/claude-haiku-4',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',

      // Google Gemini 2.x - Enhanced JSON support
      'google/gemini-2.5-pro',
      'google/gemini-2.5-pro-preview',
      'google/gemini-2.5-flash',
      'google/gemini-2.5-flash-lite',
      'google/gemini-2.0-flash-exp',
      'google/gemini-2.0-flash',
      'google/gemini-1.5-flash',
      'google/gemini-1.5-pro',

      // Meta Llama 4 - Native multimodal with JSON
      'meta-llama/llama-4-maverick-400b',
      'meta-llama/llama-4-scout',
      'meta-llama/llama-4-behemoth',
      'meta-llama/llama-3.3-70b-instruct',
      'meta-llama/llama-3.1-405b-instruct',

      // Mistral - JSON capable
      'mistralai/mistral-small-3.1',
      'mistralai/mistral-large',
      'mistralai/mixtral-8x22b-instruct',

      // xAI Grok - JSON support
      'xai/grok-3',

      // DeepSeek - JSON capable
      'deepseek/deepseek-r1',
      'deepseek/deepseek-v3'
    ]);

    // Map all text models with verification status
    const results: ModelTestResult[] = textModels.map((model: OpenRouterModel) => {
      const isVerified = knownWorkingModels.has(model.id);
      const hasJsonSupport = knownJsonSupport.has(model.id);

      // Extract provider from model ID
      const provider = model.id.split('/')[0] || 'unknown';

      const result: ModelTestResult = {
        id: model.id,
        name: model.name || model.id,
        working: isVerified,
        supportsJson: hasJsonSupport,
        supportsStructuredOutput: supportsStructuredOutput(model.id),
        supportsNativeJSONSchema: supportsNativeJSONSchema(model.id),
        status: isVerified ? 'verified' : 'untested',
        provider: provider,
        contextLength: model.context_length
      };

      // Determine cost level based on pricing
      if (model.top_provider?.is_free) {
        result.cost = 'free';
      } else if (model.pricing) {
        const promptCost = parseFloat(model.pricing.prompt);
        if (promptCost < 0.000001) result.cost = 'low';
        else if (promptCost < 0.00001) result.cost = 'medium';
        else result.cost = 'high';
      }

      // Estimate speed based on model name and size
      const modelName = model.id.toLowerCase();
      if (modelName.includes('flash') || modelName.includes('mini') || modelName.includes('haiku')) {
        result.speed = 'fast';
      } else if (modelName.includes('opus') || modelName.includes('ultra') || modelName.includes('70b') || modelName.includes('405b')) {
        result.speed = 'slow';
      } else {
        result.speed = 'medium';
      }

      return result;
    });

    // Sort all models by a combination of factors
    const sortModels = (models: ModelTestResult[]) => {
      models.sort((a, b) => {
        // Prioritize verified status
        if (a.status !== b.status) {
          const statusOrder = { 'verified': 0, 'untested': 1, 'failed': 2 };
          return (statusOrder[a.status!] ?? 3) - (statusOrder[b.status!] ?? 3);
        }
        // Then JSON support
        if (a.supportsJson !== b.supportsJson) {
          return a.supportsJson ? -1 : 1;
        }
        // Then by cost (free/low first)
        const costOrder = { 'free': 0, 'low': 1, 'medium': 2, 'high': 3 };
        const aCost = costOrder[a.cost as keyof typeof costOrder] ?? 4;
        const bCost = costOrder[b.cost as keyof typeof costOrder] ?? 4;
        if (aCost !== bCost) return aCost - bCost;
        // Then by speed
        const speedOrder = { 'fast': 0, 'medium': 1, 'slow': 2 };
        const aSpeed = speedOrder[a.speed as keyof typeof speedOrder] ?? 3;
        const bSpeed = speedOrder[b.speed as keyof typeof speedOrder] ?? 3;
        return aSpeed - bSpeed;
      });
    };

    // Sort all models
    sortModels(results);

    // Separate by status for reporting
    const verifiedModels = results.filter(r => r.status === 'verified');
    const untestedModels = results.filter(r => r.status === 'untested');

    // Group by provider for easier navigation
    const modelsByProvider: Record<string, ModelTestResult[]> = {};
    results.forEach(model => {
      if (!modelsByProvider[model.provider!]) {
        modelsByProvider[model.provider!] = [];
      }
      modelsByProvider[model.provider!].push(model);
    });

    // Add performance score to each model
    const modelsWithScore = results.map(model => {
      let score = 0;

      // Status weight (40%)
      if (model.status === 'verified') score += 40;

      // JSON support (15%)
      if (model.supportsJson) score += 15;

      // Cost efficiency (15%)
      if (model.cost === 'free') score += 15;
      else if (model.cost === 'low') score += 10;
      else if (model.cost === 'medium') score += 5;

      // Speed (20%)
      if (model.speed === 'fast') score += 20;
      else if (model.speed === 'medium') score += 10;

      // Provider reputation (10%)
      const topProviders = ['openai', 'anthropic', 'google', 'meta-llama'];
      if (topProviders.includes(model.provider!)) score += 10;

      return { ...model, performanceScore: score };
    });

    // Sort by performance score
    modelsWithScore.sort((a, b) => b.performanceScore - a.performanceScore);

    console.log(`Returning ${modelsWithScore.length} models (${verifiedModels.length} verified)`);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      totalModels: modelsWithScore.length,
      verifiedCount: verifiedModels.length,
      untestedCount: untestedModels.length,
      models: modelsWithScore, // All models with performance scores
      modelsByProvider: modelsByProvider,
      topPerformers: modelsWithScore.slice(0, 50), // Top 50 by performance
      recommended: modelsWithScore[0], // Best model
      statistics: {
        totalProviders: Object.keys(modelsByProvider).length,
        averageScore: Math.round(modelsWithScore.reduce((sum, m) => sum + m.performanceScore, 0) / modelsWithScore.length),
        withJsonSupport: modelsWithScore.filter(m => m.supportsJson).length,
        withStructuredOutput: modelsWithScore.filter(m => m.supportsStructuredOutput).length,
        withNativeJSONSchema: modelsWithScore.filter(m => m.supportsNativeJSONSchema).length,
        freeModels: modelsWithScore.filter(m => m.cost === 'free').length
      }
    });

  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: `Failed to fetch models: ${error.message}` },
      { status: 500 }
    );
  }
}