// OpenRouter Configuration and API Client
// Documentation: https://openrouter.ai/docs

import { parseFraudAnalysis } from './utils/jsonParser';

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: number; // per 1M tokens
    completion: number; // per 1M tokens
  };
}

// Popular models for fraud detection
export const AVAILABLE_MODELS: OpenRouterModel[] = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    context_length: 200000,
    pricing: { prompt: 3, completion: 15 }
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    context_length: 200000,
    pricing: { prompt: 0.25, completion: 1.25 }
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    context_length: 128000,
    pricing: { prompt: 5, completion: 15 }
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    context_length: 128000,
    pricing: { prompt: 0.15, completion: 0.6 }
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    context_length: 2000000,
    pricing: { prompt: 2.5, completion: 10 }
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    context_length: 131072,
    pricing: { prompt: 0.7, completion: 0.8 }
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    context_length: 128000,
    pricing: { prompt: 3, completion: 9 }
  }
];

export const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

export const createEnhancedSystemPrompt = (): string => {
  const currentDate = new Date().toLocaleDateString('no-NO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const basePrompt = `<context>
Role: Ekspert på svindeldeteksjon og cybersikkerhet
Specialization: Norske svindelmetoder og DNBs sikkerhetsanbefalinger
Date: ${currentDate}
Language: Norsk (svar på norsk)
</context>

<task>
Analysere tekst for tegn på svindel eller phishing-forsøk
</task>

<detection_criteria>
<suspicious_elements>
1. Hasteord og presstaktikker
2. Forespørsler om sensitive opplysninger (passord, BankID, etc.)
3. Mistenkelige domener eller lenker
4. Urealistiske løfter eller tilbud
5. Grammatiske feil eller unaturlig språkbruk
6. Forespørsler om fjerntilgang eller gavekort
</suspicious_elements>

<severity_assessment>
- Lav: Minimal risiko, sannsynligvis legitimt
- Middels: Noen bekymringsfull elementer, krever oppmerksomhet
- Høy: Klare tegn på svindel, umiddelbar fare
</severity_assessment>

<dnb_specific_threats>
1. Falske DNB-nettsider eller e-poster
2. Vishing (telefonsvindel)
3. Smishing (SMS-svindel)
4. Investeringssvindel
5. Romantikksvindel
6. BankID-svindel (alltid høy risiko)
</dnb_specific_threats>
</detection_criteria>

<output_requirements>
Gi konkrete anbefalinger basert på DNBs retningslinjer
Svar alltid på norsk med mindre spesifikt bedt om engelsk
Bruk strukturert tilnærming til analyse
</output_requirements>`;

  return basePrompt;
};

export const DEFAULT_SYSTEM_PROMPT = createEnhancedSystemPrompt();

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: OpenRouterMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  private config: OpenRouterConfig;
  
  constructor(config: OpenRouterConfig) {
    this.config = {
      temperature: 0.3, // Lower temperature for more consistent fraud detection
      maxTokens: 2000,
      ...config
    };
  }
  
  async analyzeText(text: string): Promise<{
    analysis: string;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    triggers: string[];
    recommendations: string[];
  }> {
    const enhancedPrompt = `<analysis_request>
<input_text>
${text}
</input_text>

<instructions>
Analyser teksten ovenfor for svindel og phishing-tegn.
</instructions>

<output_format>
RETURNER BARE følgende JSON (ingen ekstra tekst):
{
  "analysis": "Din detaljerte analyse på norsk",
  "riskScore": 0-100,
  "riskLevel": "low/medium/high",
  "triggers": ["liste over varseltegn"],
  "recommendations": ["liste over DNB-anbefalinger"]
}
</output_format>

<constraints>
- Output MUST be valid JSON only
- NO additional text before or after JSON
- riskScore must be number 0-100
- All text in Norwegian
</constraints>
</analysis_request>`;

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: this.config.systemPrompt
      },
      {
        role: 'user',
        content: enhancedPrompt
      }
    ];
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dnb-svindelsjekk.vercel.app',
          'X-Title': 'DNB Svindelsjekk'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          response_format: { type: 'json_object' },
          ...(this.config.model.includes('gpt-5') && { reasoning_effort: 'medium' })
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${error}`);
      }
      
      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenRouter');
      }
      
      // Parse JSON response using universal robust parser
      const parseResult = parseFraudAnalysis(content);

      if (!parseResult.success) {
        console.error('Failed to parse OpenRouter response:', {
          error: parseResult.error,
          fallback: parseResult.fallbackUsed,
          model: this.config.model,
          originalLength: content.length
        });

        // Return fallback data if available
        if (parseResult.data) {
          const fallbackData = parseResult.data;
          const fallbackDataAny = fallbackData as any; // Type assertion for additional properties
          return {
            analysis: fallbackData.summary || fallbackDataAny.analysis || 'Parse error fallback',
            riskScore: fallbackData.fraudProbability || 50,
            riskLevel: fallbackData.riskLevel || 'medium',
            triggers: fallbackData.mainIndicators || ['Parse error'],
            recommendations: [fallbackData.recommendation || 'Kontakt DNB direkte for verifisering']
          };
        }

        // Complete fallback
        return {
          analysis: 'Kunne ikke tolke AI-respons fullstendig',
          riskScore: 50,
          riskLevel: 'medium',
          triggers: ['AI-parse feil'],
          recommendations: ['Kontakt DNB direkte for verifisering']
        };
      }

      const result = parseResult.data!;
      const resultData = result as any; // Type assertion for additional properties
      return {
        analysis: result.summary || resultData.analysis || '',
        riskScore: Math.min(100, Math.max(0, result.fraudProbability || 0)),
        riskLevel: result.riskLevel || 'low',
        triggers: result.mainIndicators || [],
        recommendations: result.recommendation ? [result.recommendation] : []
      };
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }
  
  static validateApiKey(apiKey: string): boolean {
    // OpenRouter API keys typically start with 'sk-or-'
    return apiKey.length > 10 && (apiKey.startsWith('sk-') || apiKey.includes('-'));
  }
  
  static getConfigFromLocalStorage(): OpenRouterConfig | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('openrouter_config');
      if (!stored) return null;
      
      const config = JSON.parse(stored);
      return {
        apiKey: config.apiKey || '',
        model: config.model || DEFAULT_MODEL,
        systemPrompt: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        temperature: config.temperature || 0.3,
        maxTokens: config.maxTokens || 2000
      };
    } catch (error) {
      console.error('Failed to load OpenRouter config:', error);
      return null;
    }
  }
  
  static saveConfigToLocalStorage(config: Partial<OpenRouterConfig>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const existing = OpenRouterClient.getConfigFromLocalStorage();
      const updated = {
        ...existing,
        ...config
      };
      localStorage.setItem('openrouter_config', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save OpenRouter config:', error);
    }
  }
  
  static clearConfig(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('openrouter_config');
  }
}