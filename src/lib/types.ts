export interface Trigger {
  type: string;
  description: string;
  text?: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface AnalysisResult {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  triggers: Trigger[];
  recommendations: string[];
  category?: 'fraud' | 'marketing' | 'context-required' | 'info';
  fraudProbability?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  mainIndicators?: string[];
  recommendation?: string;
  summary?: string;
}

export interface APIAnalysisResponse {
  category: 'fraud' | 'marketing' | 'context-required' | 'info';
  riskLevel: 'low' | 'medium' | 'high';
  fraudProbability: number;
  mainIndicators: string[];
  recommendation: string;
  summary: string;
  extractedText?: string;
  error?: string;
}

export interface AnalysisRequestContext {
  imageData?: {
    base64: string;
    mimeType: string;
  };
  ocrText?: string;
  additionalContext?: string;
  questionAnswers?: Record<string, string>;
}

export interface AnalysisRequest {
  text: string;
  model?: string;
  context?: AnalysisRequestContext;
}