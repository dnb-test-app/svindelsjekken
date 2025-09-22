'use client';

import React from 'react';
import {
  ProgressIndicator,
  Card,
  Heading,
  P,
  Space,
  Button,
  Badge
} from '@dnb/eufemia';

interface AnalysisResult {
  score: number;
  risk: 'low' | 'medium' | 'high';
  triggers: string[];
  explanation: string;
  recommendation: string;
}

interface AIAnalysisResult {
  risk_level: 'low' | 'medium' | 'high';
  confidence: number;
  analysis: string;
  recommendation: string;
  reasoning: string;
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
    if (aiAnalysis) return aiAnalysis.risk_level;
    return result?.risk || 'low';
  };

  const getScore = () => {
    let score = 0;

    if (aiAnalysis) {
      // Try different possible field names for AI analysis
      score = aiAnalysis.confidence || aiAnalysis.fraudProbability || aiAnalysis.score || 0;
    } else if (result) {
      // Try different possible field names for result
      score = result.score || result.fraudProbability || result.confidence || 0;
    }

    // Ensure we have a valid number
    const numericScore = typeof score === 'number' ? score : parseFloat(score) || 0;
    return Math.round(numericScore);
  };

  const getAnalysis = () => {
    if (aiAnalysis) {
      return aiAnalysis.analysis || aiAnalysis.summary || aiAnalysis.explanation || '';
    }
    return result?.summary || result?.explanation || result?.analysis || '';
  };

  const getRecommendation = () => {
    if (aiAnalysis) return aiAnalysis.recommendation;
    return result?.recommendation || '';
  };

  const riskLevel = getRiskLevel();
  const score = getScore();
  const analysis = getAnalysis();
  const recommendation = getRecommendation();

  const getRiskVariant = () => {
    switch (riskLevel) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'information';
    }
  };

  const getRiskText = () => {
    switch (riskLevel) {
      case 'high': return 'HØYT';
      case 'medium': return 'MIDDELS';
      case 'low': return 'LAVT';
      default: return 'UKJENT';
    }
  };

  const getRiskTier = () => {
    const numericScore = score;

    if (numericScore >= 80) return 'HØYRISIKO';
    if (numericScore >= 60) return 'MISTENKELIG';
    if (numericScore >= 40) return 'USIKKER';
    if (numericScore >= 20) return 'LITEN RISIKO';
    if (numericScore >= 10) return 'SVÆRT LAV RISIKO';
    return 'LEGITIMT';
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

  return (
    <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
      <Space bottom="large">
        {/* Risk Score Card */}
        <Card spacing="large" style={{ textAlign: 'center' }}>
          <Space bottom="small">
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              textAlign: 'center',
              color: score >= 60 ? 'var(--color-cherry-red)' : score >= 20 ? 'var(--color-signal-orange)' : 'var(--color-sea-green)'
            }}>
              {getRiskTier()}
            </div>
          </Space>

          <Space bottom="medium">
            <P size="medium" style={{ color: 'var(--color-black-80)' }}>
              {getRiskDescription()}
            </P>
          </Space>

          <Space bottom="medium">
            <Badge
              variant={getRiskVariant()}
              text="AI + Web-verifisert ✓"
            />
          </Space>

          <Space bottom={recommendation ? "medium" : "none"}>
            <P size="medium">
              {analysis}
            </P>
          </Space>

          {recommendation && (
            <P size="medium">
              <strong>Anbefaling:</strong> {recommendation}
            </P>
          )}
        </Card>
      </Space>

      {/* Recommendations */}
      {riskLevel === 'high' && (
        <Space bottom="large">
          <Card spacing="medium">
            <Space bottom="small">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-small)',
                padding: 'var(--spacing-small)'
              }}>
                <span style={{ fontSize: '1.25rem' }}>🗑️</span>
                <P>Slett meldingen umiddelbart</P>
              </div>
            </Space>
            <Space bottom="small">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-small)',
                padding: 'var(--spacing-small)'
              }}>
                <span style={{ fontSize: '1.25rem' }}>🚫</span>
                <P>Ikke klikk på lenker eller oppgi informasjon</P>
              </div>
            </Space>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-small)',
              padding: 'var(--spacing-small)'
            }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <P>Hvis du har oppgitt info: Ring DNB på 915 04800</P>
            </div>
          </Card>
        </Space>
      )}

      {riskLevel === 'medium' && (
        <Space bottom="large">
          <Card spacing="medium">
            <Space bottom="small">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-small)',
                padding: 'var(--spacing-small)'
              }}>
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <P>Vær ekstra forsiktig</P>
              </div>
            </Space>
            <Space bottom="small">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-small)',
                padding: 'var(--spacing-small)'
              }}>
                <span style={{ fontSize: '1.25rem' }}>✔️</span>
                <P>Sjekk avsender nøye</P>
              </div>
            </Space>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-small)',
              padding: 'var(--spacing-small)'
            }}>
              <span style={{ fontSize: '1.25rem' }}>📞</span>
              <P>Kontakt DNB direkte hvis du er usikker</P>
            </div>
          </Card>
        </Space>
      )}

      {riskLevel === 'low' && (
        <Space bottom="large">
          <Card spacing="medium">
            <Space bottom="small">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-small)',
                padding: 'var(--spacing-small)'
              }}>
                <span style={{ fontSize: '1.25rem' }}>✅</span>
                <P>Dette ser legitimt ut</P>
              </div>
            </Space>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-small)',
              padding: 'var(--spacing-small)'
            }}>
              <span style={{ fontSize: '1.25rem' }}>👀</span>
              <P>Vær alltid oppmerksom på tegn til svindel</P>
            </div>
          </Card>
        </Space>
      )}

      {/* New Analysis Button */}
      <div style={{ textAlign: 'center' }}>
        <Button
          variant="primary"
          size="large"
          onClick={onNewAnalysis}
          icon="refresh"
        >
          Ny analyse
        </Button>
      </div>
    </div>
  );
}