import { NextRequest, NextResponse } from 'next/server';

// Test prompt for comprehensive fraud detection testing
const TEST_PROMPTS = {
  simple: `Analyser: "Gratulerer! Du har vunnet 1 million kroner!"
Svar med JSON: {"riskLevel": "high", "riskScore": 85, "summary": "Svindel"}`,
  
  medium: `Analyser denne meldingen for svindel:
"Kjære kunde, din DNB-konto vil bli sperret om 24 timer. Klikk her for å bekrefte."
Gi en detaljert analyse i JSON-format med riskLevel, riskScore, triggers, og anbefalinger.`,
  
  complex: `Du er en avansert svindeldeteksjonsekspert for DNB. Analyser følgende scenario:
"Hei, jeg ringer fra Microsoft Support. Vi har oppdaget virus på din datamaskin som stjeler dine bankopplysninger. 
Vi må få tilgang til din maskin via TeamViewer for å fikse dette umiddelbart. 
Du må også bekrefte din identitet med BankID."

Returner en omfattende JSON-analyse med:
- riskLevel: "low"/"medium"/"high"
- riskScore: 0-100
- category: type svindel
- triggers: liste over mistenkelige elementer
- recommendations: konkrete anbefalinger
- confidence: din tillit til analysen (0-100)`
};

interface TestRequest {
  modelIds?: string[];
  testDepth?: 'quick' | 'standard' | 'comprehensive';
  maxConcurrent?: number;
}

interface ModelTestResult {
  modelId: string;
  working: boolean;
  supportsJson: boolean;
  responseTime: number;
  accuracy?: number;
  errors: string[];
  testResults: {
    simple?: boolean;
    medium?: boolean;
    complex?: boolean;
  };
}

async function testSingleModel(
  modelId: string, 
  apiKey: string,
  testDepth: 'quick' | 'standard' | 'comprehensive'
): Promise<ModelTestResult> {
  const result: ModelTestResult = {
    modelId,
    working: false,
    supportsJson: false,
    responseTime: 0,
    errors: [],
    testResults: {}
  };

  const startTime = Date.now();
  
  try {
    // Determine which tests to run based on depth
    const testsToRun = testDepth === 'quick' 
      ? ['simple'] 
      : testDepth === 'standard' 
        ? ['simple', 'medium']
        : ['simple', 'medium', 'complex'];

    let successCount = 0;
    let totalTests = 0;

    for (const testType of testsToRun) {
      const prompt = TEST_PROMPTS[testType as keyof typeof TEST_PROMPTS];
      totalTests++;

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
            'X-Title': 'DNB Batch Model Test'
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              {
                role: 'system',
                content: 'You are a fraud detection expert. Always respond in valid JSON format only.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 200
          }),
          signal: AbortSignal.timeout(15000) // 15 second timeout per test
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          
          if (content) {
            try {
              const parsed = JSON.parse(content);
              // Check if response has expected structure
              if (parsed.riskLevel && typeof parsed.riskScore === 'number') {
                result.testResults[testType as keyof typeof TEST_PROMPTS] = true;
                successCount++;
                result.supportsJson = true;
              } else {
                result.testResults[testType as keyof typeof TEST_PROMPTS] = false;
                result.errors.push(`${testType}: Invalid JSON structure`);
              }
            } catch (e) {
              result.testResults[testType as keyof typeof TEST_PROMPTS] = false;
              result.errors.push(`${testType}: JSON parse error`);
            }
          }
        } else {
          result.errors.push(`${testType}: HTTP ${response.status}`);
        }
      } catch (error: any) {
        result.errors.push(`${testType}: ${error.message}`);
      }
    }

    result.working = successCount > 0;
    result.accuracy = totalTests > 0 ? Math.round((successCount / totalTests) * 100) : 0;
    result.responseTime = Date.now() - startTime;

  } catch (error: any) {
    result.errors.push(`Fatal: ${error.message}`);
    result.responseTime = Date.now() - startTime;
  }

  return result;
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
    const { 
      modelIds = [], 
      testDepth = 'standard',
      maxConcurrent = 5 
    } = body;

    if (!modelIds || modelIds.length === 0) {
      return NextResponse.json(
        { error: 'No models specified for testing' },
        { status: 400 }
      );
    }

    console.log(`Starting batch test for ${modelIds.length} models with depth: ${testDepth}`);

    // Process models in batches to avoid overwhelming the API
    const results: ModelTestResult[] = [];
    
    for (let i = 0; i < modelIds.length; i += maxConcurrent) {
      const batch = modelIds.slice(i, i + maxConcurrent);
      
      // Test batch in parallel
      const batchPromises = batch.map(modelId => 
        testSingleModel(modelId, apiKey, testDepth)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      console.log(`Completed batch ${Math.floor(i / maxConcurrent) + 1}, tested ${results.length}/${modelIds.length} models`);
    }

    // Calculate statistics
    const stats = {
      totalTested: results.length,
      working: results.filter(r => r.working).length,
      withJsonSupport: results.filter(r => r.supportsJson).length,
      averageResponseTime: Math.round(
        results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      ),
      averageAccuracy: Math.round(
        results.filter(r => r.accuracy !== undefined)
          .reduce((sum, r) => sum + (r.accuracy || 0), 0) / results.length
      ),
      byProvider: {} as Record<string, number>
    };

    // Count by provider
    results.forEach(r => {
      const provider = r.modelId.split('/')[0];
      stats.byProvider[provider] = (stats.byProvider[provider] || 0) + (r.working ? 1 : 0);
    });

    // Sort results by performance
    results.sort((a, b) => {
      // First by working status
      if (a.working !== b.working) return a.working ? -1 : 1;
      // Then by accuracy
      if (a.accuracy !== b.accuracy) return (b.accuracy || 0) - (a.accuracy || 0);
      // Then by response time
      return a.responseTime - b.responseTime;
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      testDepth,
      statistics: stats,
      results: results
    });

  } catch (error: any) {
    console.error('Batch test error:', error);
    return NextResponse.json(
      { error: `Batch test failed: ${error.message}` },
      { status: 500 }
    );
  }
}