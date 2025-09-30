/**
 * useAnalysisState Hook
 * Manages core analysis state (text, result, analyzing status)
 */

import { useState } from 'react';

export interface UseAnalysisStateReturn {
  // State
  text: string;
  result: any;
  aiAnalysis: any;
  isAnalyzing: boolean;
  isWebVerifying: boolean;
  urlDetected: boolean;
  additionalContext: string;

  // Actions
  setText: (text: string) => void;
  setResult: (result: any) => void;
  setAiAnalysis: (analysis: any) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setIsWebVerifying: (verifying: boolean) => void;
  setUrlDetected: (detected: boolean) => void;
  setAdditionalContext: (context: string) => void;
  resetAnalysis: () => void;
}

/**
 * Custom hook for managing analysis state
 */
export function useAnalysisState(): UseAnalysisStateReturn {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWebVerifying, setIsWebVerifying] = useState(false);
  const [urlDetected, setUrlDetected] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');

  /**
   * Reset all analysis-related state
   */
  const resetAnalysis = () => {
    setText('');
    setResult(null);
    setAiAnalysis(null);
    setIsAnalyzing(false);
    setIsWebVerifying(false);
    setUrlDetected(false);
    setAdditionalContext('');
  };

  return {
    // State
    text,
    result,
    aiAnalysis,
    isAnalyzing,
    isWebVerifying,
    urlDetected,
    additionalContext,

    // Actions
    setText,
    setResult,
    setAiAnalysis,
    setIsAnalyzing,
    setIsWebVerifying,
    setUrlDetected,
    setAdditionalContext,
    resetAnalysis,
  };
}

export default useAnalysisState;