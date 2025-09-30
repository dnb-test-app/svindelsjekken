import { NextRequest, NextResponse } from "next/server";
import { parseFraudAnalysis } from "@/lib/utils/jsonParser";
import { isMinimalContextURL } from "@/lib/urlAnalyzer";
import {
  needsWebSearchVerification,
  getWebSearchReasons,
} from "@/lib/fraudDetection";
import {
  fraudAnalysisJsonSchema,
  supportsStructuredOutput,
  supportsNativeJSONSchema,
  type FraudAnalysisResponse,
} from "@/lib/schemas/fraudAnalysis.zod";
import { sanitizeUserInput, validateInput } from "@/lib/security/promptSanitizer";
import { detectInjectionAttempts } from "@/lib/security/injectionDetector";
import { validateDNBContext, validateResponse } from "@/lib/security/responseValidator";
import { logDebug, logInfo, logError, logWarn } from "@/lib/logger";
import { createEnhancedFraudPrompt } from "@/lib/prompts/promptBuilder";
import { getModelInfo, isGPT5Model, getMaxTokens } from "@/lib/utils/modelHelpers";
import { processImageData } from "@/lib/utils/imageProcessor";
import { processAndCombineOCRText } from "@/lib/utils/textProcessor";
import { getAnalysisCache } from "@/lib/cache/analysisCache";

// createEnhancedFraudPrompt is now imported from @/lib/prompts/promptBuilder
// Old function definition removed - see promptBuilder.ts for modular implementation

// Check if model likely supports JSON based on provider (legacy function)
const supportsJSON = (model: string) => {
  // Use the new schema-aware function primarily
  return supportsStructuredOutput(model);
};

// Helper function to call OpenRouter API with a specific model
async function callOpenRouterAPI(
  model: string,
  text: string,
  apiKey: string,
  context?: {
    questionAnswers?: Record<string, string>; // Updated to accept any string value, not just 'yes'/'no'
    additionalContext?: string;
    imageData?: { base64: string; mimeType: string };
    additionalText?: string;
    initialAnalysis?: {
      category: string;
      score: number;
      risk: string;
      triggers: any[];
      recommendation: string;
      summary: string;
      mainIndicators?: string[];
      positiveIndicators?: string[];
      negativeIndicators?: string[];
      urlVerifications?: any[];
    };
  },
  hasMinimalContext: boolean = false,
  enableWebSearch: boolean = false,
) {
  const prompt = createEnhancedFraudPrompt(
    text,
    context,
    hasMinimalContext,
    enableWebSearch,
  );

  // Modify model name for web search
  const searchModel = enableWebSearch ? `${model}:online` : model;

  // Create user message content
  let userMessage: any;

  if (context?.imageData) {
    // Vision model request with image and OCR-extracted text
    const hasOcrText = text.includes('<ocr_extracted_text>');
    const imagePromptText = hasOcrText
      ? `[USER_INPUT_START]\n${text}\n[USER_INPUT_END]\n\nIMAGE CONTEXT: Text marked with <ocr_extracted_text> tags was automatically extracted from the attached image using OCR. Analyze both the OCR text content and the visual elements in the image for fraud indicators. Pay special attention to URLs, sender information, and visual design elements that may indicate phishing or scams.\n\n${prompt}`
      : `[USER_INPUT_START]\n${text || 'Analyser dette bildet for tegn på svindel.'}\n[USER_INPUT_END]\n\nIMAGE ANALYSIS: Extract and analyze all visible text, URLs, and visual elements in the attached image for fraud indicators. Look for phishing attempts, fake websites, suspicious sender information, and social engineering tactics.\n\n${prompt}`;

    userMessage = {
      role: "user",
      content: [
        {
          type: "text",
          text: imagePromptText,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${context.imageData.mimeType};base64,${context.imageData.base64}`,
          },
        },
      ],
    };
  } else {
    // Text-only request
    userMessage = {
      role: "user",
      content: `[USER_INPUT_START]\n${text}\n[USER_INPUT_END]\n\n${prompt}`,
    };
  }

  const requestBody: any = {
    model: searchModel,
    messages: [userMessage],
    temperature: 0, // Use 0 for consistent structured output
    max_tokens: getMaxTokens(model), // Use centralized helper for token limits
  };

  // Add web search plugin if enabled
  if (enableWebSearch) {
    requestBody.plugins = [
      {
        id: "web",
        max_results: 5,
        engine: "exa", // Use Exa search engine as fallback for models without native support
      },
    ];
  }

  // Add structured output support - prefer native JSON schema when available
  if (supportsNativeJSONSchema(model)) {
    // Use native JSON schema for OpenAI models (most reliable)
    requestBody.response_format = {
      type: "json_schema",
      json_schema: fraudAnalysisJsonSchema,
    };
  }

  // Add GPT-5 specific parameters if applicable
  if (isGPT5Model(model)) {
    requestBody.reasoning_effort = "low"; // GPT-5 specific parameter
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000",
        "X-Title": "DNB Svindelsjekk",
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error (${model}): ${error}`);
  }

  // Clone the response so we can read it multiple times if needed
  const responseClone = response.clone();

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    // Try reading as text to see what we got
    try {
      const responseText = await responseClone.text();
      logError(`JSON parse error from ${model}`, parseError, { responsePreview: responseText.substring(0, 1000) });
    } catch (textError) {
      logError(`Could not read response as text`, textError);
    }
    throw new Error(`Failed to parse JSON response from ${model}: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }

  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error(`No response content from ${model}`);
  }

  return content;
}

export async function POST(request: NextRequest) {
  try {
    const defaultModel = process.env.DEFAULT_AI_MODEL || "openai/gpt-5-mini";
    const backupModel = process.env.BACKUP_AI_MODEL || "openai/gpt-5-mini";

    let text: string;
    let model = defaultModel;
    let context: any = undefined;
    let ocrUsed = false;

    // Handle JSON request (unified path for all requests)
    const body = await request.json();
    text = body.text || "";
    model = body.model || defaultModel;
    context = body.context;

    // Track request metadata for security
    const requestId = crypto.randomUUID();
    const sessionId = request.cookies.get('session_id')?.value || crypto.randomUUID();

    // ============================================================================
    // SECURITY VALIDATION - MUST HAPPEN FIRST BEFORE ANY PROCESSING
    // ============================================================================

    // Step 1: Validate raw text input immediately (before any processing)
    if (text.trim()) {
      const inputValidation = validateInput(text);
      if (!inputValidation.valid) {
        return NextResponse.json(
          {
            error: 'Invalid input',
            reason: inputValidation.reason,
            requestId
          },
          { status: 400 }
        );
      }
    }

    // Step 2: Detect injection attempts in raw input
    if (text.trim()) {
      const injectionDetection = detectInjectionAttempts(text);

      if (injectionDetection.severity === 'critical' || injectionDetection.severity === 'high') {
        logWarn('Security threat detected in raw input', {
          severity: injectionDetection.severity,
          patterns: injectionDetection.patterns,
          score: injectionDetection.score
        });

        return NextResponse.json({
          category: 'fraud',
          risk: 'high',
          score: 100,
          mainIndicators: ['Sikkerhetstrussel detektert'],
          recommendation: 'Potensielt ondsinnet forespørsel blokkert. Kontakt DNB på 915 04800.',
          summary: 'Sikkerhetsystemet blokkerte denne forespørselen.',
          securityBlock: true,
          requestId
        });
      }

      // Log if injection detected but not blocked
      if (injectionDetection.detected) {
        logInfo('Injection patterns detected but allowed in raw input', {
          severity: injectionDetection.severity,
          patterns: injectionDetection.patterns
        });
      }
    }

    // Step 3: Sanitize raw input
    if (text.trim()) {
      const sanitizationResult = sanitizeUserInput(text);
      if (sanitizationResult.blocked) {
        return NextResponse.json({
          category: 'fraud',
          risk: 'high',
          score: 90,
          mainIndicators: ['Uakseptabelt innhold'],
          recommendation: 'Innholdet inneholder forbudte elementer.',
          summary: 'Forespørselen ble blokkert av sikkerhetsgrunner.',
          securityBlock: true,
          requestId
        });
      }

      // Use sanitized text from now on
      text = sanitizationResult.sanitized;
    }

    // ============================================================================
    // END SECURITY VALIDATION - Now safe to proceed with processing
    // ============================================================================

    // Process image data (convert unsupported formats if needed)
    if (context?.imageData) {
      const processedImage = await processImageData(context.imageData);
      if (processedImage) {
        context.imageData = processedImage;
      }
    }

    // Process and combine OCR text if provided
    const ocrText = context?.ocrText || "";
    if (ocrText) {
      ocrUsed = true;

      const ocrResult = processAndCombineOCRText(text, ocrText);

      if (!ocrResult.success) {
        const error = ocrResult.error!;

        if (error.type === 'validation') {
          return NextResponse.json(
            {
              error: error.message,
              reason: error.reason,
              requestId
            },
            { status: 400 }
          );
        } else {
          // Sanitization blocked
          return NextResponse.json({
            category: 'fraud',
            risk: 'high',
            score: 90,
            mainIndicators: [error.message],
            recommendation: error.reason || 'Innholdet inneholder forbudte elementer.',
            summary: 'Forespørselen ble blokkert av sikkerhetsgrunner.',
            securityBlock: true,
            requestId
          });
        }
      }

      // Use combined text
      text = ocrResult.text!;
    }

    // Use the combined sanitized text for all further analysis
    const sanitizedText = text;

    // Detect if this is a minimal context URL
    const hasMinimalContext = isMinimalContextURL(sanitizedText);

    // Detect if web search verification would be helpful
    const needsWebSearch =
      needsWebSearchVerification(sanitizedText) || !!context?.imageData;
    const webSearchReasons = needsWebSearch
      ? getWebSearchReasons(sanitizedText, context)
      : [];

    logDebug("Analysis flags", {
      hasMinimalContext,
      needsWebSearch,
      webSearchReasons,
    });

    // Validate that we have some content for analysis (text OR image)
    if ((!sanitizedText || sanitizedText.trim().length === 0) && !context?.imageData) {
      return NextResponse.json(
        {
          error: "No content provided for analysis.",
          requestId
        },
        { status: 400 },
      );
    }

    // Check for API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      logError("OpenRouter API key not configured");
      return NextResponse.json(
        { error: "AI-tjenesten er ikke konfigurert. Kontakt administrator." },
        { status: 503 },
      );
    }

    // Use the requested model (let OpenRouter validate)
    const selectedModel = model;

    // Check cache before making API call
    const cache = getAnalysisCache();
    const cachedResult = cache.get(sanitizedText, selectedModel, context);

    if (cachedResult) {
      logInfo('Returning cached analysis result', { model: selectedModel });
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        cacheTimestamp: new Date().toISOString(),
        requestId,
      });
    }

    // Direct API call with no fallbacks - require structured output
    try {
      const content = await callOpenRouterAPI(
        selectedModel,
        sanitizedText,
        apiKey,
        context,
        hasMinimalContext,
        needsWebSearch,
      );
      const parseResult = parseFraudAnalysis(content);

      if (!parseResult.success) {
        logError("Failed to parse structured output", parseResult.error, {
          model: selectedModel,
          rawResponse: parseResult.originalContent
        });

        return NextResponse.json(
          {
            error: "AI modell returnerte ikke gyldig strukturert output",
            details: `Modell: ${selectedModel}`,
            parseError: parseResult.error,
            message:
              "Denne modellen støtter ikke strukturert output eller er feilkonfigurert",
          },
          { status: 500 },
        );
      }

      // Create response with metadata
      const aiAnalysis: any = {
        ...parseResult.data,
        model: selectedModel,
        modelInfo: getModelInfo(selectedModel),
        timestamp: new Date().toISOString(),
        ...(needsWebSearch && {
          webSearchUsed: true,
          webSearchReasons: webSearchReasons,
          enhancedVerification: true,
        }),
        ...(supportsNativeJSONSchema(selectedModel) && {
          structuredOutputUsed: true,
          schemaType: "native_json_schema",
        }),
        ...(supportsStructuredOutput(selectedModel) &&
          !supportsNativeJSONSchema(selectedModel) && {
            structuredOutputUsed: true,
            schemaType: "json_object",
          }),
        ...(context?.imageData && {
          visionProcessed: true,
          imageProcessed: true,
          imageAnalyzed: true,
        }),
      };

      // Step 4: Validate AI response integrity
      const dnbValidation = validateDNBContext(aiAnalysis);
      if (!dnbValidation.valid) {
        logWarn('DNB context validation failed', { errors: dnbValidation.errors });

        // Return a safe fallback response
        return NextResponse.json({
          category: 'fraud',
          risk: 'high',
          score: 80,
          mainIndicators: ['AI-respons validering feilet'],
          recommendation: 'Kontakt DNB på 915 04800 for manuell vurdering.',
          summary: 'Analyseresultatet kunne ikke valideres. Vær forsiktig.',
          validationError: true,
          requestId
        });
      }

      // Log warnings but allow response
      if (dnbValidation.warnings.length > 0) {
        logWarn('DNB context warnings', { warnings: dnbValidation.warnings });
      }

      // Prepare response object
      const responseData = {
        ...aiAnalysis,
        requestId,
        securityValidated: true
      };

      // Store successful result in cache for future requests
      cache.set(sanitizedText, selectedModel, responseData, context);

      return NextResponse.json(responseData);
    } catch (error) {
      logError("API call failed", error);

      // Handle specific API errors
      if (error instanceof Error && error.message.includes("Rate limit")) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message:
              "Too many requests. Please wait a minute before trying again.",
            retryAfter: 60,
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error: "AI-tjenesten er ikke tilgjengelig",
          details: `Modell: ${selectedModel}`,
          apiError: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    logError("Error in analyze", error);

    return NextResponse.json(
      { error: `AI-analyse feilet: ${error.message || "Ukjent feil"}` },
      { status: 500 },
    );
  }
}

// GET endpoint to check available models
export async function GET() {
  const defaultModel = process.env.DEFAULT_AI_MODEL || "openai/gpt-5-mini";

  return NextResponse.json({
    defaultModel: defaultModel,
    defaultModelInfo: getModelInfo(defaultModel),
    status: "ready",
    apiKeyConfigured:
      !!process.env.OPENROUTER_API_KEY &&
      process.env.OPENROUTER_API_KEY !== "your_openrouter_api_key_here",
    featuresSupported: {
      structuredOutput: true,
      nativeJSONSchema: true,
      webSearch: true,
    },
  });
}
