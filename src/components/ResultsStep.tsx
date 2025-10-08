'use client';

import React from 'react';
import {
  Card,
  Heading,
  P,
  Space,
  Button,
  Badge,
  Icon
} from '@dnb/eufemia';
import URLStatusCard from './URLStatusCard';
import LoadingAnalysis from './LoadingAnalysis';
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
  securityBlock?: boolean;
}

interface ResultsStepProps {
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  aiAnalysis: AIAnalysisResult | null;
  onNewAnalysis: () => void;
  originalText?: string;
}

/**
 * Get icon name based on analysis category
 */
function getCategoryIcon(category?: string): string {
  if (category === 'fraud') return 'warning';
  if (category === 'context-required') return 'help';
  return 'information';
}

export default function ResultsStep({
  isAnalyzing,
  result,
  aiAnalysis,
  onNewAnalysis,
  originalText = ''
}: ResultsStepProps) {
  if (isAnalyzing) {
    return <LoadingAnalysis />;
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

      {/* ACTIONABLE STEPS WITH CATEGORY BANNER - Show first so users see what to do immediately */}
      {actionableSteps.length > 0 && aiAnalysis?.category && (() => {
        // Category-specific styling for window title bar
        const getBannerStyle = () => {
          switch (aiAnalysis.category) {
            case 'fraud':
              return {
                background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
                borderColor: '#B91C1C',
                iconBg: '#FFFFFF',
                iconColor: '#DC2626',
                textColor: '#FFFFFF',
                categoryText: '⚠️ Svindel'
              };
            case 'context-required':
              return {
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                borderColor: '#D97706',
                iconBg: '#FFFFFF',
                iconColor: '#F59E0B',
                textColor: '#FFFFFF',
                categoryText: '❓ Mangler kontekst'
              };
            case 'marketing':
              return {
                background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                borderColor: '#2563EB',
                iconBg: '#FFFFFF',
                iconColor: '#3B82F6',
                textColor: '#FFFFFF',
                categoryText: '📢 Markedsføring'
              };
            case 'info':
              return {
                background: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
                borderColor: '#4B5563',
                iconBg: '#FFFFFF',
                iconColor: '#6B7280',
                textColor: '#FFFFFF',
                categoryText: 'ℹ️ Info'
              };
            default:
              return {
                background: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
                borderColor: '#4B5563',
                iconBg: '#FFFFFF',
                iconColor: '#6B7280',
                textColor: '#FFFFFF',
                categoryText: '❓ Ukategorisert'
              };
          }
        };

        const bannerStyle = getBannerStyle();

        return (
          <div style={{
            marginBottom: '2.5rem',
            overflow: 'hidden',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: `3px solid ${bannerStyle.borderColor}`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Window Title Bar - Category Display */}
            <div style={{
              background: bannerStyle.background,
              borderBottom: `3px solid ${bannerStyle.borderColor}`,
              padding: 'clamp(1rem, 3vw, 1.25rem) clamp(1rem, 4vw, 1.5rem)',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(0.75rem, 2vw, 1rem)'
            }}>
              <div style={{
                backgroundColor: bannerStyle.iconBg,
                borderRadius: '50%',
                padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}>
                <Icon
                  name={getCategoryIcon(aiAnalysis.category)}
                  size="medium"
                  style={{ color: bannerStyle.iconColor }}
                />
              </div>
              <Heading
                size="xx-large"
                level="2"
                style={{
                  margin: 0,
                  color: bannerStyle.textColor,
                  fontWeight: 700,
                  fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                  lineHeight: 1.2,
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
              >
                {bannerStyle.categoryText}
              </Heading>
            </div>

            {/* Card Content */}
            <div style={{ padding: 'clamp(1.25rem, 3vw, 1.5rem)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <Icon name="play" size="medium" style={{ color: 'var(--color-sea-green)' }} />
                <Heading size="large" level="3" style={{ margin: 0 }}>
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
            </div>
          </div>
        );
      })()}

      {/* URL VERIFICATION CARD - No category banner, just URL details */}
      {aiAnalysis && !isSecurityBlock && (
        <URLStatusCard
          positiveIndicators={aiAnalysis.positiveIndicators}
          negativeIndicators={aiAnalysis.negativeIndicators}
          category={undefined}
          webSearchUsed={aiAnalysis.webSearchUsed}
          webSearchReasons={aiAnalysis.webSearchReasons}
          urlVerifications={aiAnalysis.urlVerifications || []}
        />
      )}


      {/* EDUCATIONAL CONTEXT - Background */}
      {!isSecurityBlock && educationalContext && (
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
              📚 Bakgrunn
            </Heading>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Key Indicators - Viktige funn */}
            {aiAnalysis?.mainIndicators && aiAnalysis.mainIndicators.length > 0 && (
              <div style={{
                padding: '1.25rem',
                backgroundColor: '#FEF3C7',
                borderRadius: '0.75rem',
                border: '2px solid #F59E0B'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <Icon name="list" size="small" style={{ color: '#F59E0B' }} />
                  <Heading size="medium" level="3" style={{ margin: 0, color: '#92400E' }}>
                    Viktige funn
                  </Heading>
                </div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {aiAnalysis.mainIndicators.slice(0, 3).map((indicator, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{
                        backgroundColor: '#F59E0B',
                        borderRadius: '50%',
                        padding: '0.375rem',
                        flexShrink: 0,
                        marginTop: '0.125rem'
                      }}>
                        <Icon name="warning" size="small" style={{ color: 'white' }} />
                      </div>
                      <P size="medium" style={{
                        margin: 0,
                        color: '#92400E',
                        fontWeight: 500,
                        lineHeight: 1.5
                      }}>
                        {indicator}
                      </P>
                    </div>
                  ))}
                </div>
              </div>
            )}

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