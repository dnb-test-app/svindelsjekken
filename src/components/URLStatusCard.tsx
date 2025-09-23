'use client';

import React from 'react';
import {
  Card,
  Heading,
  P,
  Icon,
  Badge,
  Space
} from '@dnb/eufemia';
import { extractURLs } from '@/lib/urlAnalyzer';

interface URLVerification {
  url: string;
  status: 'legitimate' | 'suspicious' | 'unknown' | 'verified_scam';
  verificationDetails: string;
  sources: string[];
}

interface URLStatusCardProps {
  text: string;
  positiveIndicators?: string[];
  negativeIndicators?: string[];
  category?: 'fraud' | 'marketing' | 'suspicious' | 'context-required' | 'safe';
  webSearchUsed?: boolean;
  webSearchReasons?: string[];
  urlVerifications?: URLVerification[];
}

export default function URLStatusCard({
  text,
  positiveIndicators = [],
  negativeIndicators = [],
  category,
  webSearchUsed,
  webSearchReasons = [],
  urlVerifications = []
}: URLStatusCardProps) {
  const extractedURLs = extractURLs(text);

  if (extractedURLs.length === 0) {
    return null;
  }

  const getStatusInfo = (url: string) => {
    // First check if we have detailed verification data for this URL
    const verification = urlVerifications.find(v =>
      url.includes(v.url) || v.url.includes(url.replace(/^https?:\/\//, ''))
    );

    if (verification) {
      switch (verification.status) {
        case 'legitimate':
          return {
            status: 'Legitim',
            variant: 'success' as const,
            icon: 'check_circle',
            color: 'var(--color-summer-green)',
            details: verification.verificationDetails,
            sources: verification.sources
          };
        case 'verified_scam':
          return {
            status: 'Bekreftet svindel',
            variant: 'error' as const,
            icon: 'warning',
            color: 'var(--color-fire-red)',
            details: verification.verificationDetails,
            sources: verification.sources
          };
        case 'suspicious':
          return {
            status: 'Mistenkelig',
            variant: 'warning' as const,
            icon: 'warning',
            color: 'var(--color-signal-orange)',
            details: verification.verificationDetails,
            sources: verification.sources
          };
        case 'unknown':
        default:
          return {
            status: 'Ukjent',
            variant: 'info' as const,
            icon: 'help',
            color: 'var(--color-ocean-blue)',
            details: verification.verificationDetails,
            sources: verification.sources
          };
      }
    }

    // Fallback to old logic if no verification data
    const hasLegitimateIndicator = positiveIndicators.some(indicator =>
      indicator.toLowerCase().includes('legitim') ||
      indicator.toLowerCase().includes('verifisert') ||
      indicator.toLowerCase().includes('kjent')
    );

    const hasSuspiciousIndicator = negativeIndicators.some(indicator =>
      indicator.toLowerCase().includes('ukjent') ||
      indicator.toLowerCase().includes('mistenkelig') ||
      indicator.toLowerCase().includes('suspekt')
    );

    if (hasLegitimateIndicator) {
      return {
        status: 'Legitim',
        variant: 'success' as const,
        icon: 'check_circle',
        color: 'var(--color-summer-green)'
      };
    } else if (hasSuspiciousIndicator || category === 'fraud' || category === 'suspicious') {
      return {
        status: 'Suspekt',
        variant: 'error' as const,
        icon: 'warning',
        color: 'var(--color-fire-red)'
      };
    } else if (category === 'context-required') {
      return {
        status: 'Trenger kontekst',
        variant: 'warning' as const,
        icon: 'information',
        color: 'var(--color-signal-orange)'
      };
    } else {
      return {
        status: 'Ukjent',
        variant: 'info' as const,
        icon: 'help',
        color: 'var(--color-ocean-blue)'
      };
    }
  };

  const getCategoryInfo = () => {
    switch (category) {
      case 'fraud':
        return { text: 'Svindel', variant: 'error' as const };
      case 'suspicious':
        return { text: 'Mistenkelig', variant: 'warning' as const };
      case 'context-required':
        return { text: 'Mangler kontekst', variant: 'warning' as const };
      case 'marketing':
        return { text: 'Markedsføring', variant: 'info' as const };
      case 'safe':
        return { text: 'Trygg', variant: 'success' as const };
      default:
        return { text: 'Ukategorisert', variant: 'info' as const };
    }
  };

  return (
    <Card spacing="medium" style={{ marginBottom: 'var(--spacing-large)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-small)',
        marginBottom: 'var(--spacing-medium)'
      }}>
        <Icon name="link" size="medium" style={{ color: 'var(--color-sea-green)' }} />
        <Heading size="medium" level="3" style={{
          margin: 0,
          fontSize: 'var(--font-size-large)'
        }}>
          URLs funnet og sjekket
        </Heading>
        {webSearchUsed && (
          <Badge
            text="Online verifisert"
            variant="success"
            size="small"
            style={{ marginLeft: 'var(--spacing-small)' }}
          />
        )}
      </div>

      <Space bottom="medium">
        <div style={{ display: 'grid', gap: 'var(--spacing-medium)' }}>
          {extractedURLs.map((url, index) => {
            const statusInfo = getStatusInfo(url);
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-medium)',
                  backgroundColor: 'var(--color-white)',
                  borderRadius: 'var(--spacing-small)',
                  border: `2px solid ${statusInfo.color}22`,
                  borderLeft: `6px solid ${statusInfo.color}`
                }}
              >
                <div style={{ flex: 1, marginRight: 'var(--spacing-medium)' }}>
                  <P size="small" style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    color: 'var(--color-black-80)',
                    marginBottom: statusInfo.details ? 'var(--spacing-x-small)' : 0
                  }}>
                    📍 {url}
                  </P>
                  {statusInfo.details && (
                    <P size="x-small" style={{
                      margin: 0,
                      color: 'var(--color-black-60)',
                      fontStyle: 'italic',
                      lineHeight: 1.4
                    }}>
                      {statusInfo.details}
                    </P>
                  )}
                  {statusInfo.sources && statusInfo.sources.length > 0 && (
                    <P size="x-small" style={{
                      margin: 0,
                      color: 'var(--color-sea-green)',
                      marginTop: 'var(--spacing-xx-small)',
                      fontWeight: 500
                    }}>
                      Kilder: {statusInfo.sources.join(', ')}
                    </P>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-small)'
                }}>
                  <Icon
                    name={statusInfo.icon}
                    size="small"
                    style={{ color: statusInfo.color }}
                  />
                  <Badge
                    text={statusInfo.status}
                    variant={statusInfo.variant}
                    size="small"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Space>

      {category && (
        <Space top="medium">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-small)',
            padding: 'var(--spacing-medium)',
            backgroundColor: 'var(--color-mint-green-8)',
            borderRadius: 'var(--spacing-small)',
            border: '2px solid var(--color-sea-green-30)'
          }}>
            <Icon name="category" size="small" style={{ color: 'var(--color-sea-green)' }} />
            <P size="small" style={{ margin: 0, color: 'var(--color-sea-green)' }}>
              <strong>Kategorisering:</strong>
            </P>
            <Badge
              text={getCategoryInfo().text}
              variant={getCategoryInfo().variant}
              size="small"
            />
          </div>
        </Space>
      )}

      {webSearchUsed && webSearchReasons.length > 0 && (
        <Space top="medium">
          <div style={{
            padding: 'var(--spacing-medium)',
            backgroundColor: 'var(--color-summer-green-8)',
            borderRadius: 'var(--spacing-small)',
            border: '2px solid var(--color-summer-green-30)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-small)',
              marginBottom: 'var(--spacing-small)'
            }}>
              <Icon name="search" size="small" style={{ color: 'var(--color-summer-green)' }} />
              <P size="small" style={{ margin: 0, fontWeight: 600, color: 'var(--color-summer-green)' }}>
                Online verifikasjon utført
              </P>
            </div>
            <P size="small" style={{ margin: 0, color: 'var(--color-summer-green)' }}>
              Grunn: {webSearchReasons.join(', ')}
            </P>
          </div>
        </Space>
      )}
    </Card>
  );
}