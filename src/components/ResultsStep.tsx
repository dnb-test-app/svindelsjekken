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

interface AnalysisResult {
  score: number;
  risk: 'low' | 'medium' | 'high';
  triggers: string[];
  explanation: string;
  recommendation: string;
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
  verificationGuide?: {
    primaryCheck: string;
    independentVerification: string;
    alternativeChannel: string;
  };
  actionableSteps?: string[];
}

interface ResultsStepProps {
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  aiAnalysis: AIAnalysisResult | null;
  onNewAnalysis: () => void;
}

export default function ResultsStep({
  isAnalyzing,
  result,
  aiAnalysis,
  onNewAnalysis
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

  // Handle different result formats
  const getRiskLevel = () => {
    if (aiAnalysis) return aiAnalysis.risk_level || aiAnalysis.riskLevel || 'low';
    return result?.risk || 'low';
  };

  const getScore = () => {
    let score = 0;

    if (aiAnalysis) {
      score = aiAnalysis.fraudProbability || aiAnalysis.confidence || 0;
    } else if (result) {
      score = result.score || 0;
    }

    // Ensure we have a valid number
    const numericScore = typeof score === 'number' ? score : parseFloat(score) || 0;
    return Math.round(numericScore);
  };

  const getAnalysis = () => {
    if (aiAnalysis) {
      return aiAnalysis.summary || aiAnalysis.analysis || '';
    }
    return result?.explanation || '';
  };

  const getRecommendation = () => {
    if (aiAnalysis) return aiAnalysis.recommendation || '';
    return result?.recommendation || '';
  };

  const getMainIndicators = () => {
    return aiAnalysis?.mainIndicators || [];
  };

  const getVerificationGuide = () => {
    return aiAnalysis?.verificationGuide;
  };

  const getActionableSteps = () => {
    return aiAnalysis?.actionableSteps || [];
  };

  const riskLevel = getRiskLevel();
  const score = getScore();
  const analysis = getAnalysis();
  const recommendation = getRecommendation();
  const mainIndicators = getMainIndicators();
  const verificationGuide = getVerificationGuide();
  const actionableSteps = getActionableSteps();

  const getRiskVariant = () => {
    switch (riskLevel) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const getRiskText = () => {
    switch (riskLevel) {
      case 'high': return 'HØYRISIKO';
      case 'medium': return 'MIDDELS RISIKO';
      case 'low': return 'LAV RISIKO';
      default: return 'UKJENT';
    }
  };

  const getRiskDescription = () => {
    const numericScore = score;

    if (numericScore >= 80) return 'Høy sannsynlighet for svindel';
    if (numericScore >= 60) return 'Mistenkelige elementer funnet';
    if (numericScore >= 40) return 'Usikre signaler oppdaget';
    if (numericScore >= 20) return 'Noen bekymringsverdig tegn';
    if (numericScore >= 10) return 'Minimale risikoindikatorer';
    return 'Ingen tegn til svindel funnet';
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'high': return 'warning';
      case 'medium': return 'information';
      case 'low': return 'check_circle';
      default: return 'information';
    }
  };

  const getRiskColors = () => {
    switch (riskLevel) {
      case 'high':
        return {
          bg: '#FEE2E2',
          border: '#DC2626',
          text: '#991B1B',
          icon: '#DC2626'
        };
      case 'medium':
        return {
          bg: '#FEF3C7',
          border: '#F59E0B',
          text: '#92400E',
          icon: '#F59E0B'
        };
      case 'low':
        return {
          bg: '#D1FAE5',
          border: '#10B981',
          text: '#065F46',
          icon: '#10B981'
        };
      default:
        return {
          bg: '#DBEAFE',
          border: '#3B82F6',
          text: '#1E40AF',
          icon: '#3B82F6'
        };
    }
  };

  const colors = getRiskColors();

  return (
    <div style={{
      maxWidth: '56rem',
      margin: '0 auto',
      padding: 'clamp(0.5rem, 3vw, 1rem)',
      paddingTop: 'clamp(1rem, 3vw, 2rem)'
    }}>
      {/* HERO SECTION - Risk Assessment */}
      <div style={{
        backgroundColor: colors.bg,
        border: `3px solid ${colors.border}`,
        borderRadius: '1rem',
        padding: 'clamp(1rem, 4vw, 2.5rem)',
        marginBottom: 'clamp(1rem, 4vw, 2.5rem)',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${colors.border}20 0%, transparent 70%)`,
          zIndex: 0
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Large Risk Icon */}
          <div style={{ marginBottom: 'clamp(0.75rem, 3vw, 1.5rem)' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'clamp(3rem, 8vw, 5rem)',
              height: 'clamp(3rem, 8vw, 5rem)',
              borderRadius: '50%',
              backgroundColor: colors.icon,
              marginBottom: 'clamp(0.5rem, 2vw, 1rem)'
            }}>
              <Icon
                name={getRiskIcon()}
                size="large"
                style={{ color: 'white' }}
              />
            </div>
          </div>

          {/* Risk Level Badge */}
          <div style={{ marginBottom: 'clamp(0.5rem, 2vw, 1rem)' }}>
            <Badge
              text={getRiskText()}
              variant={getRiskVariant()}
              size="medium"
              style={{
                fontSize: 'clamp(0.875rem, 3vw, 1.125rem)',
                fontWeight: 700,
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)'
              }}
            />
          </div>

          {/* Main Headline */}
          <Heading
            size="large"
            level="2"
            style={{
              margin: '0 0 clamp(0.5rem, 2vw, 1rem) 0',
              color: colors.text,
              fontWeight: 700,
              lineHeight: 1.2,
              fontSize: 'clamp(1.25rem, 4vw, 2rem)'
            }}
          >
            {getRiskDescription()}
          </Heading>

          {/* Score Display */}
          {score > 0 && (
            <div style={{ marginBottom: 'clamp(0.75rem, 3vw, 1.5rem)' }}>
              <div style={{
                display: 'inline-block',
                backgroundColor: 'white',
                borderRadius: '2rem',
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
                border: `2px solid ${colors.border}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <P style={{
                  margin: 0,
                  color: colors.text,
                  fontWeight: 600,
                  fontSize: 'clamp(0.875rem, 3vw, 1.125rem)'
                }}>
                  Risikoscore: {score}%
                </P>
              </div>
            </div>
          )}

          {/* Analysis Summary */}
          {analysis && (
            <P size="large" style={{
              margin: '0 auto',
              maxWidth: '40rem',
              color: colors.text,
              lineHeight: 1.6,
              fontWeight: 500
            }}>
              {analysis}
            </P>
          )}
        </div>
      </div>

      {/* KEY INDICATORS */}
      {mainIndicators.length > 0 && (
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

          <div style={{ display: 'grid', gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
            {mainIndicators.map((indicator, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'clamp(0.75rem, 2vw, 1rem)',
                  padding: 'clamp(0.75rem, 2vw, 1rem)',
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

      {/* VERIFICATION GUIDE */}
      {verificationGuide && (
        <Card spacing="large" style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <Icon name="shield" size="medium" style={{ color: 'var(--color-sea-green)' }} />
            <Heading size="large" level="2" style={{ margin: 0 }}>
              Slik kan du verifisere
            </Heading>
          </div>

          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div style={{
              padding: '1.25rem',
              backgroundColor: '#DBEAFE',
              borderRadius: '0.75rem',
              border: '2px solid #3B82F6'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <Icon name="search" size="small" style={{ color: '#1E40AF' }} />
                <Heading size="medium" level="3" style={{ margin: 0, color: '#1E40AF' }}>
                  Primær sjekk
                </Heading>
              </div>
              <P style={{ margin: 0, color: '#1E40AF' }}>{verificationGuide.primaryCheck}</P>
            </div>

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
                marginBottom: '0.75rem'
              }}>
                <Icon name="warning" size="small" style={{ color: '#92400E' }} />
                <Heading size="medium" level="3" style={{ margin: 0, color: '#92400E' }}>
                  Uavhengig verifisering
                </Heading>
              </div>
              <P style={{ margin: 0, color: '#92400E' }}>{verificationGuide.independentVerification}</P>
            </div>

            <div style={{
              padding: '1.25rem',
              backgroundColor: '#D1FAE5',
              borderRadius: '0.75rem',
              border: '2px solid #10B981'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <Icon name="phone" size="small" style={{ color: '#065F46' }} />
                <Heading size="medium" level="3" style={{ margin: 0, color: '#065F46' }}>
                  Alternativ kanal
                </Heading>
              </div>
              <P style={{ margin: 0, color: '#065F46' }}>{verificationGuide.alternativeChannel}</P>
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