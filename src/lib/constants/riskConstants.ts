/**
 * Risk Assessment Constants
 * Centralized configuration for risk scoring and thresholds
 */

export const RISK_THRESHOLDS = {
  // Risk score ranges (0-100)
  LOW_MIN: 0,
  LOW_MAX: 29,
  MEDIUM_MIN: 30,
  MEDIUM_MAX: 59,
  HIGH_MIN: 60,
  HIGH_MAX: 100,
} as const;

export const FRAUD_PROBABILITY_THRESHOLDS = {
  LOW_MAX: 29,
  MEDIUM_MAX: 59,
  HIGH_MIN: 60,
} as const;

export const TRIGGER_SEVERITY_SCORES = {
  LOW: 10,
  MEDIUM: 15,
  HIGH: 30,
} as const;

export const URL_ANALYSIS_SCORES = {
  MINIMAL_CONTEXT: 30,
  URL_SHORTENER: 25,
  SUSPICIOUS_TLD: 35,
  IP_ADDRESS: 40,
  EXCESSIVE_SUBDOMAINS: 20,
  MISLEADING_DOMAIN: 45,
  TYPOSQUATTING: 50,
  PHISHING_KEYWORDS: 30,
} as const;

/**
 * Risk level colors for UI consistency
 */
export const RISK_COLORS = {
  high: {
    bg: '#FEE2E2',
    border: '#DC2626',
    text: '#991B1B',
    icon: '#DC2626',
  },
  medium: {
    bg: '#FEF3C7',
    border: '#F59E0B',
    text: '#92400E',
    icon: '#F59E0B',
  },
  low: {
    bg: '#D1FAE5',
    border: '#10B981',
    text: '#065F46',
    icon: '#10B981',
  },
} as const;

/**
 * Helper function to determine risk level from score
 */
export function getRiskLevelFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score >= RISK_THRESHOLDS.HIGH_MIN) return 'high';
  if (score >= RISK_THRESHOLDS.MEDIUM_MIN) return 'medium';
  return 'low';
}

/**
 * Helper function to get risk colors
 */
export function getRiskColors(riskLevel: 'low' | 'medium' | 'high') {
  return RISK_COLORS[riskLevel];
}

/**
 * Helper function to get risk text
 */
export function getRiskText(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'high':
      return 'HØYRISIKO';
    case 'medium':
      return 'MIDDELS RISIKO';
    case 'low':
      return 'LAV RISIKO';
  }
}

/**
 * Helper function to get risk description
 */
export function getRiskDescription(score: number): string {
  if (score >= RISK_THRESHOLDS.HIGH_MIN) {
    return 'Krever oppmerksomhet og verifisering';
  }
  if (score >= RISK_THRESHOLDS.MEDIUM_MIN) {
    return 'Vær forsiktig og sjekk nøye';
  }
  return 'Få risikosignaler funnet';
}

/**
 * Helper function to get risk icon
 */
export function getRiskIcon(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'high':
      return 'warning';
    case 'medium':
      return 'information';
    case 'low':
      return 'check_circle';
  }
}