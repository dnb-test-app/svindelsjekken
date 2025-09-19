import { NextRequest, NextResponse } from 'next/server';

// Models to test
const MODELS_TO_TEST = [
  'openai/gpt-4o-mini',
  'openai/gpt-5',
  'openai/gpt-4o',
  'anthropic/claude-opus-4',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'meta-llama/llama-3.3-70b-instruct',
];

const TEST_PROMPT = "Respond with exactly: 'Model working'. Nothing else.";

async function testModel(model: string, apiKey: string): Promise<{ model: string; working: boolean; error?: string }> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://localhost:3000',
        'X-Title': 'DNB Svindelsjekk Model Test'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: TEST_PROMPT
          }
        ],
        temperature: 0,
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { model, working: false, error: `HTTP ${response.status}: ${errorText.substring(0, 100)}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    return { 
      model, 
      working: content?.toLowerCase().includes('model working') || false,
      error: !content ? 'No response content' : undefined
    };
  } catch (error: any) {
    return { 
      model, 
      working: false, 
      error: error.message || 'Unknown error' 
    };
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 503 }
    );
  }

  // Test all models in parallel
  const results = await Promise.all(
    MODELS_TO_TEST.map(model => testModel(model, apiKey))
  );

  // Separate working and failing models
  const workingModels = results.filter(r => r.working).map(r => r.model);
  const failingModels = results.filter(r => !r.working);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    totalTested: MODELS_TO_TEST.length,
    workingCount: workingModels.length,
    failingCount: failingModels.length,
    workingModels,
    failingModels,
    details: results
  });
}

// POST endpoint to test a specific model
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 503 }
    );
  }

  const { model } = await request.json();
  
  if (!model) {
    return NextResponse.json(
      { error: 'Model parameter required' },
      { status: 400 }
    );
  }

  const result = await testModel(model, apiKey);
  
  return NextResponse.json(result);
}