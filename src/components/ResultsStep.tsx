'use client';

import React from 'react';
import {
  ProgressIndicator,
  Card,
  Heading,
  P,
  Space,
  Button,
  Badge,
  Icon
} from '@dnb/eufemia';
import URLStatusCard from './URLStatusCard';
import { getRiskColors, getRiskText, getRiskDescription, getRiskIcon } from '@/lib/constants/riskConstants';

interface AnalysisResult {
  score: number;
  risk: 'low' | 'medium' | 'high';
  triggers: string[];
  explanation: string;
  recommendation: string;
}

interface URLVerification {
  url: string;
  status: 'legitimate' | 'unknown' | 'verified_scam';
  verificationDetails: string;
}

interface AIAnalysisResult {
  risk_level?: 'low' | 'medium' | 'high';
  riskLevel?: 'low' | 'medium' | 'high';
  confidence?: number;
  fraudProbability?: number;
  analysis?: string;
  summary?: string;
  recommendation?: string;
  reasoning?: string;
  mainIndicators?: string[];
  positiveIndicators?: string[];
  negativeIndicators?: string[];
  category?: 'fraud' | 'marketing' | 'context-required' | 'info';
  urlVerifications: URLVerification[];
  educationalContext?: {
    whyThisAssessment: string;
    commonLegitimateUse: string;
    keyDifference: string;
  };
  verificationGuide?: {
    primaryCheck: string;
    independentVerification: string;
    alternativeChannel: string;
  };
  actionableSteps?: string[];
  webSearchUsed?: boolean;
  webSearchReasons?: string[];
}

interface ResultsStepProps {
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  aiAnalysis: AIAnalysisResult | null;
  onNewAnalysis: () => void;
  originalText?: string;
}

export default function ResultsStep({
  isAnalyzing,
  result,
  aiAnalysis,
  onNewAnalysis,
  originalText = ''
}: ResultsStepProps) {
  if (isAnalyzing) {
    return (
      <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
        <Space top="xx-large" bottom="xx-large">
          <ProgressIndicator size="large" />
          <Space top="large">
            <Heading size="large" level="3">
              Analyserer med AI...
            </Heading>
            <Space top="medium">
              <div style={{ maxWidth: '32rem', margin: '0 auto' }}>
                <P size="medium">
                  Vi bruker avansert AI for å gi deg den mest nøyaktige analysen basert på konteksten du oppga.
                </P>
              </div>
            </Space>
          </Space>
        </Space>
      </div>
    );
  }

  if (!result && !aiAnalysis) {
    return (
      <div style={{ textAlign: 'center' }}>
        <Space top="large" bottom="large">
          <P>Ingen resultater tilgjengelig</P>
        </Space>
      </div>
    );
  }

  const displayResult = aiAnalysis || result;
  if (!displayResult) return null;

  // Simplified data extraction
  const riskLevel = aiAnalysis?.risk_level || aiAnalysis?.riskLevel || result?.risk || 'low';
  const score = Math.round(aiAnalysis?.fraudProbability || aiAnalysis?.confidence || result?.score || 0);
  const summary = aiAnalysis?.summary || aiAnalysis?.analysis || result?.explanation || '';
  const recommendation = aiAnalysis?.recommendation || result?.recommendation || '';
  const isSecurityBlock = aiAnalysis?.securityBlock || false;

  // Educational content
  const educationalContext = aiAnalysis?.educationalContext;
  const verificationGuide = aiAnalysis?.verificationGuide;
  const actionableSteps = aiAnalysis?.actionableSteps || [];

  const getRiskVariant = () => {
    switch (riskLevel) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const colors = getRiskColors(riskLevel);

  return (
    <div style={{
      maxWidth: '48rem',
      margin: '0 auto',
      padding: 'clamp(0.5rem, 3vw, 1rem)',
      paddingTop: 'clamp(1rem, 3vw, 2rem)'
    }}>

      {/* SECURITY WARNING - if security block */}
      {isSecurityBlock && (
        <Card spacing="large" style={{
          marginBottom: '2rem',
          border: '3px solid var(--color-fire-red)',
          backgroundColor: '#FEE2E2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Icon name="warning" size="large" style={{ color: 'var(--color-fire-red)' }} />
            <Heading size="large" style={{ color: 'var(--color-fire-red)', margin: 0 }}>
              Sikkerhetstrussel blokkert
            </Heading>
          </div>
          <P style={{ color: 'var(--color-black-80)', marginBottom: '1rem' }}>
            {summary}
          </P>
          <P style={{ fontWeight: 600, color: 'var(--color-fire-red)' }}>
            {recommendation}
          </P>
        </Card>
      )}

      {/* URL VERIFICATION CARD - Show first so users see category and URL checks immediately */}
      {aiAnalysis && !isSecurityBlock && (
        <URLStatusCard
          positiveIndicators={aiAnalysis.positiveIndicators}
          negativeIndicators={aiAnalysis.negativeIndicators}
          category={aiAnalysis.category}
          webSearchUsed={aiAnalysis.webSearchUsed}
          webSearchReasons={aiAnalysis.webSearchReasons}
          urlVerifications={aiAnalysis.urlVerifications || []}
        />
      )}

      {/* MAIN RESULT CARD - simplified */}
      {!isSecurityBlock && (
        <Card spacing="large" style={{
          marginBottom: 'clamp(1rem, 4vw, 2.5rem)',
          border: '3px solid var(--color-mint-green)',
          borderLeft: '8px solid var(--color-sea-green)',
          backgroundColor: 'var(--color-mint-green-8)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(0.5rem, 2vw, 0.75rem)',
            marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
          }}>
            <div style={{
              backgroundColor: 'var(--color-sea-green)',
              borderRadius: '50%',
              padding: 'clamp(0.5rem, 2vw, 0.75rem)'
            }}>
              <Icon name="information" size="medium" style={{ color: 'white' }} />
            </div>
            <Heading size="large" level="2" style={{
              margin: 0,
              color: 'var(--color-sea-green)',
              fontSize: 'clamp(1.25rem, 4vw, 1.75rem)'
            }}>
              📚 Viktig å vite
            </Heading>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Why This Assessment */}
            <div style={{
              padding: '1.25rem',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              border: '2px solid var(--color-sea-green-30)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <Icon name="question" size="small" style={{ color: 'var(--color-sea-green)' }} />
                <Heading size="medium" level="3" style={{ margin: 0, color: 'var(--color-sea-green)' }}>
                  Hvorfor denne vurderingen?
                </Heading>
              </div>
              <P style={{ margin: 0, color: 'var(--color-black-80)', lineHeight: 1.6 }}>
                {educationalContext?.whyThisAssessment}
              </P>
            </div>

            {/* Legitimate Use */}
            <div style={{
              padding: '1.25rem',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              border: '2px solid var(--color-sea-green-30)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <Icon name="check_circle" size="small" style={{ color: 'var(--color-summer-green)' }} />
                <Heading size="medium" level="3" style={{ margin: 0, color: 'var(--color-summer-green)' }}>
                  Legitim bruk
                </Heading>
              </div>
              <P style={{ margin: 0, color: 'var(--color-black-80)', lineHeight: 1.6 }}>
                {educationalContext?.commonLegitimateUse}
              </P>
            </div>

            {/* Key Difference */}
            <div style={{
              padding: '1.25rem',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              border: '2px solid var(--color-sea-green-30)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <Icon name="warning" size="small" style={{ color: 'var(--color-signal-orange)' }} />
                <Heading size="medium" level="3" style={{ margin: 0, color: 'var(--color-signal-orange)' }}>
                  Viktig forskjell
                </Heading>
              </div>
              <P style={{ margin: 0, color: 'var(--color-black-80)', lineHeight: 1.6 }}>
                {educationalContext?.keyDifference}
              </P>
            </div>
          </div>
        </Card>
      )}

      {/* KEY INDICATORS - simplified */}
      {aiAnalysis?.mainIndicators && aiAnalysis.mainIndicators.length > 0 && (
        <Card spacing="medium" style={{ marginBottom: 'clamp(1rem, 4vw, 2.5rem)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(0.5rem, 2vw, 0.75rem)',
            marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
          }}>
            <Icon name="list" size="medium" style={{ color: 'var(--color-sea-green)' }} />
            <Heading size="medium" level="2" style={{
              margin: 0,
              fontSize: 'clamp(1.125rem, 4vw, 1.5rem)'
            }}>
              Viktige funn
            </Heading>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {aiAnalysis.mainIndicators.slice(0, 3).map((indicator, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '0.75rem',
                  border: '2px solid #F59E0B'
                }}
              >
                <div style={{
                  backgroundColor: '#F59E0B',
                  borderRadius: '50%',
                  padding: 'clamp(0.375rem, 1vw, 0.5rem)',
                  flexShrink: 0
                }}>
                  <Icon name="warning" size="small" style={{ color: 'white' }} />
                </div>
                <P size="medium" style={{
                  margin: 0,
                  color: '#92400E',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  fontSize: 'clamp(0.875rem, 3vw, 1rem)'
                }}>
                  {indicator}
                </P>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* RECOMMENDATION */}
      {recommendation && (
        <Card spacing="large" style={{
          marginBottom: '2.5rem',
          border: '2px solid var(--color-sea-green)',
          borderLeft: '6px solid var(--color-sea-green)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              backgroundColor: 'var(--color-sea-green)',
              borderRadius: '50%',
              padding: '0.5rem'
            }}>
              <Icon name="lightbulb" size="medium" style={{ color: 'white' }} />
            </div>
            <Heading size="large" level="2" style={{ margin: 0, color: 'var(--color-sea-green)' }}>
              Vår anbefaling
            </Heading>
          </div>
          <P size="large" style={{
            margin: 0,
            lineHeight: 1.6,
            color: 'var(--color-black-80)'
          }}>
            {recommendation}
          </P>
        </Card>
      )}

      {/* ACTIONABLE STEPS */}
      {actionableSteps.length > 0 && (
        <Card spacing="large" style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <Icon name="play" size="medium" style={{ color: 'var(--color-sea-green)' }} />
            <Heading size="large" level="2" style={{ margin: 0 }}>
              Hva bør du gjøre nå?
            </Heading>
          </div>

          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {actionableSteps.map((step, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1.25rem',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  borderRadius: '1rem',
                  border: '2px solid var(--color-black-20)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--color-sea-green)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '2.5rem',
                    height: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 114, 114, 0.3)'
                  }}
                >
                  {index + 1}
                </div>
                <P size="medium" style={{
                  margin: 0,
                  lineHeight: 1.6,
                  color: 'var(--color-black-80)',
                  fontWeight: 500
                }}>
                  {step}
                </P>
              </div>
            ))}
          </div>
        </Card>
      )}


      {/* CTA SECTION */}
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'var(--color-mint-green-12)',
        borderRadius: '1rem',
        border: '2px solid var(--color-sea-green-30)'
      }}>
        <Heading size="medium" level="3" style={{
          marginBottom: '1rem',
          color: 'var(--color-sea-green)'
        }}>
          Ønsker du å analysere noe nytt?
        </Heading>
        <P style={{
          marginBottom: '1.5rem',
          color: 'var(--color-black-60)'
        }}>
          Kjør en ny analyse av mistenkelig innhold
        </P>
        <Button
          variant="primary"
          size="large"
          onClick={onNewAnalysis}
          icon="refresh"
          style={{
            minWidth: '12rem',
            fontWeight: 600
          }}
        >
          Ny analyse
        </Button>
      </div>
    </div>
  );
}