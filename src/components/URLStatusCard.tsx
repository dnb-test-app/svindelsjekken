'use client';

import React from 'react';
import {
  Card,
  Heading,
  P,
  Icon,
  Badge,
  Space,
  Flex
} from '@dnb/eufemia';

interface URLVerification {
  url: string;
  status: 'legitimate' | 'unknown' | 'verified_scam';
  verificationDetails: string;
}

interface URLStatusCardProps {
  positiveIndicators?: string[];
  negativeIndicators?: string[];
  category?: 'fraud' | 'marketing' | 'context-required' | 'info';
  webSearchUsed?: boolean;
  webSearchReasons?: string[];
  urlVerifications?: URLVerification[];
}

export default function URLStatusCard({
  positiveIndicators = [],
  negativeIndicators = [],
  category,
  webSearchUsed,
  webSearchReasons = [],
  urlVerifications = []
}: URLStatusCardProps) {
  // Only show if we have URL verifications from AI
  if (urlVerifications.length === 0) {
    return null;
  }

  // Client-side deduplication backup - group by domain and keep only one per domain
  const deduplicatedVerifications = urlVerifications.reduce((acc, verification) => {
    try {
      // Extract domain from URL
      const url = new URL(verification.url.startsWith('http') ? verification.url : `https://${verification.url}`);
      const domain = url.hostname.toLowerCase().replace(/^www\./, ''); // Remove www. prefix for consistent grouping

      // If we haven't seen this domain yet, add it
      if (!acc.some(item => {
        try {
          const existingUrl = new URL(item.url.startsWith('http') ? item.url : `https://${item.url}`);
          const existingDomain = existingUrl.hostname.toLowerCase().replace(/^www\./, '');
          return existingDomain === domain;
        } catch {
          return item.url.toLowerCase().includes(domain);
        }
      })) {
        acc.push(verification);
      }
    } catch (error) {
      // If URL parsing fails, fall back to string comparison
      if (!acc.some(item => item.url.toLowerCase() === verification.url.toLowerCase())) {
        acc.push(verification);
      }
    }
    return acc;
  }, [] as URLVerification[]);

  const getStatusInfo = (verification: URLVerification) => {
    switch (verification.status) {
      case 'legitimate':
        return {
          status: 'Legitim nettside bekreftet',
          variant: 'success' as const,
          icon: 'check',
          emoji: '✅'
        };
      case 'verified_scam':
        return {
          status: 'Bekreftet svindel',
          variant: 'error' as const,
          icon: 'warning',
          emoji: '❌'
        };
      case 'unknown':
      default:
        return {
          status: 'Ukjent domene',
          variant: 'info' as const,
          icon: 'help',
          emoji: '❓'
        };
    }
  };

  const getCategoryInfo = () => {
    switch (category) {
      case 'fraud':
        return { text: '⚠️ Svindel', variant: 'error' as const };
      case 'context-required':
        return { text: '❓ Mangler kontekst', variant: 'warning' as const };
      case 'marketing':
        return { text: '📢 Markedsføring', variant: 'info' as const };
      case 'info':
        return { text: 'ℹ️ Info', variant: 'info' as const };
      default:
        return { text: '❓ Ukategorisert', variant: 'info' as const };
    }
  };

  const isWarningMessage = (details: string) => {
    const lower = details.toLowerCase();
    return details.includes('⚠️') ||
           lower.includes('advarsel') ||
           lower.includes('lenketekst viser');
  };

  const getStatusColor = (variant: 'success' | 'error' | 'info') => {
    switch (variant) {
      case 'success': return 'var(--color-emerald)';
      case 'error': return 'var(--color-fire-red)';
      default: return 'var(--color-ocean-blue)';
    }
  };

  return (
    <Card spacing="medium" bottom="large">
      <Heading size="medium" level="3" bottom="small">
        🔍 URLs funnet og sjekket:
      </Heading>

      {/* Important notice about link verification */}
      <Space
        bottom="small"
        style={{
          backgroundColor: '#FEF3C7',
          border: '2px solid #F59E0B',
          borderRadius: '8px',
          padding: 'var(--spacing-medium)'
        }}
      >
        <P size="small" top={false} bottom={false} style={{ color: '#92400E' }}>
          <strong>⚠️ Viktig:</strong> Lenketekst kan skjule ekte adresse. Hold musen over lenken (ikke klikk) for å se hvor den faktisk går.
        </P>
      </Space>

      <Flex.Vertical gap="medium">
        {deduplicatedVerifications.map((verification, index) => {
          const statusInfo = getStatusInfo(verification);
          const isWarning = verification.verificationDetails && isWarningMessage(verification.verificationDetails);

          return (
            <Flex.Vertical key={index} gap="x-small">
              <P size="medium" weight="bold" top={false} bottom={false}>
                📍 {verification.url}
              </P>

              <Flex.Horizontal align="center" gap="x-small">
                <P size="small" weight="bold" top={false} bottom={false}>Status:</P>
                <span style={{ color: getStatusColor(statusInfo.variant), fontWeight: 600 }}>
                  {statusInfo.emoji} {statusInfo.status}
                </span>
              </Flex.Horizontal>

              {verification.verificationDetails && (
                <Space
                  top="x-small"
                  style={{
                    backgroundColor: isWarning ? '#FEE2E2' : 'transparent',
                    padding: isWarning ? 'var(--spacing-small)' : '0',
                    borderRadius: isWarning ? '6px' : '0',
                    border: isWarning ? '2px solid var(--color-fire-red)' : 'none'
                  }}
                >
                  <P
                    size="small"
                    top={false}
                    bottom={false}
                    weight={isWarning ? 'bold' : 'regular'}
                    style={{
                      color: isWarning ? '#991B1B' : 'var(--color-black)',
                      lineHeight: 1.5
                    }}
                  >
                    <strong>Funn:</strong> {verification.verificationDetails}
                  </P>
                </Space>
              )}
            </Flex.Vertical>
          );
        })}
      </Flex.Vertical>
    </Card>
  );
}