import { NextRequest, NextResponse } from 'next/server';
import { parseFraudAnalysis } from '@/lib/utils/jsonParser';

// Enhanced test prompt with XML-like structure for better parsing
const createTestPrompt = (): string => {
  const basePrompt = `<context>
Role: Svindeldeteksjonsekspert
Task: Kort analyse av testmelding
</context>

<test_input>
"Dette er en test av svindeldeteksjon. Klikk her for å bekrefte din konto."
</test_input>

<output_format>
Svar BARE med JSON i dette formatet (ingen ekstra tekst):
{
  "riskLevel": "medium",
  "riskScore": 50,
  "summary": "Test utført",
  "category": "suspicious",
  "fraudProbability": 65,
  "mainIndicators": ["Testmelding", "Bekreftelseslenke"]
}
</output_format>

<constraints>
- Output MUST be valid JSON only
- NO additional text before or after JSON
- Test result should indicate suspicious/medium risk
</constraints>`;

  return basePrompt;
};

interface TestRequest {
  modelId: string;
}

interface TestResponse {
  modelId: string;
  working: boolean;
  supportsJson: boolean;
  error?: string;
  errorType?: 'json_format' | 'timeout' | 'rate_limit' | 'auth' | 'not_found' | 'network' | 'other';
  responseTime?: number;
  parseWarning?: string;
  jsonFormatWarning?: string;
  fallbackUsed?: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return NextResponse.json(
      { error: 'OpenRouter API key not configured' },
      { status: 503 }
    );
  }

  try {
    const body: TestRequest = await request.json();
    const { modelId } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    const result: TestResponse = {
      modelId,
      working: false,
      supportsJson: false
    };

    const startTime = Date.now();

    try {
      // First test WITHOUT JSON format (more compatible)
      const testPrompt = createTestPrompt();

      const requestBody: any = {
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You are a fraud detection expert. Always respond in valid JSON format only.'
          },
          {
            role: 'user',
            content: testPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      };

      // Add GPT-5 specific parameters
      if (modelId.includes('gpt-5')) {
        requestBody.reasoning_effort = 'low'; // Minimal reasoning for test
      }

      const responseNoJson = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
          'X-Title': 'DNB Model Test'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (responseNoJson.ok) {
        const data = await responseNoJson.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (content) {
          result.working = true;
          result.responseTime = Date.now() - startTime;
          
          // Try parsing with robust parser
          const parseResult = parseFraudAnalysis(content);

          if (!parseResult.success) {
            result.error = `Parse failed: ${parseResult.error} (fallback: ${parseResult.fallbackUsed})`;
            result.errorType = 'json_format';
            result.working = parseResult.data ? true : false; // Working if fallback succeeded

            if (parseResult.data) {
              // Fallback worked, but with warnings
              result.parseWarning = parseResult.error;
            } else {
              return NextResponse.json(result);
            }
          }
            
            // Test with JSON format enforcement if parsing was successful
            const jsonRequestBody = {
              ...requestBody,
              response_format: { type: 'json_object' }
            };

            const responseWithJson = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
                'X-Title': 'DNB Model Test'
              },
              body: JSON.stringify(jsonRequestBody),
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (responseWithJson.ok) {
              const jsonData = await responseWithJson.json();
              const jsonContent = jsonData.choices?.[0]?.message?.content;

              if (jsonContent) {
                const jsonParseResult = parseFraudAnalysis(jsonContent);

                if (jsonParseResult.success) {
                  result.supportsJson = true;
                } else {
                  // response_format worked but content wasn't reliably parseable
                  result.jsonFormatWarning = `JSON format partially supported: ${jsonParseResult.error}`;
                }
              }
            }
        } else {
          result.error = 'No response content from model';
          result.errorType = 'other';
        }
      } else {
        const errorText = await responseNoJson.text();
        let errorMessage = `HTTP ${responseNoJson.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
          
          // Categorize error based on status and message
          if (responseNoJson.status === 429 || errorMessage.toLowerCase().includes('rate')) {
            result.errorType = 'rate_limit';
            result.error = 'Rate limit exceeded';
          } else if (responseNoJson.status === 401 || responseNoJson.status === 403) {
            result.errorType = 'auth';
            result.error = 'Authentication failed';
          } else if (responseNoJson.status === 404 || errorMessage.toLowerCase().includes('not found')) {
            result.errorType = 'not_found';
            result.error = 'Model not available';
          } else if (errorMessage.toLowerCase().includes('json') || errorMessage.toLowerCase().includes('format')) {
            result.errorType = 'json_format';
            result.error = 'Invalid response format';
          } else {
            result.errorType = 'other';
            result.error = errorMessage;
          }
        } catch {
          // Use HTTP status as error message
          result.errorType = 'other';
          result.error = errorMessage;
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        result.error = 'Model response timeout (>15s)';
        result.errorType = 'timeout';
      } else if (error.message?.includes('fetch')) {
        result.error = 'Network connection error';
        result.errorType = 'network';
      } else {
        result.error = error.message || 'Test failed';
        result.errorType = 'other';
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error testing model:', error);
    return NextResponse.json(
      { error: `Failed to test model: ${error.message}` },
      { status: 500 }
    );
  }
}