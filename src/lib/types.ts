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
  category?: 'fraud' | 'marketing' | 'suspicious' | 'safe';
  fraudProbability?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  mainIndicators?: string[];
  recommendation?: string;
  summary?: string;
}

export interface APIAnalysisResponse {
  category: 'fraud' | 'marketing' | 'suspicious' | 'safe';
  riskLevel: 'low' | 'medium' | 'high';
  fraudProbability: number;
  mainIndicators: string[];
  recommendation: string;
  summary: string;
  extractedText?: string;
  error?: string;
}