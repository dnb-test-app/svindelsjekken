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

  return (
    <Card spacing="medium" style={{ marginBottom: 'var(--spacing-large)' }}>
      {/* Category Display - Only show if we have a category */}
      {category && (() => {
        const categoryInfo = getCategoryInfo();
        return (
          <div style={{ marginBottom: 'var(--spacing-large)' }}>
            <P size="large" style={{
              margin: 0,
              fontWeight: 600,
              color: 'var(--color-black)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {categoryInfo.text}
            </P>
          </div>
        );
      })()}

      <Heading size="medium" level="3" style={{
        margin: '0 0 var(--spacing-small) 0',
        color: 'var(--color-black)',
        fontWeight: 500
      }}>
        🔍 URLs funnet og sjekket:
      </Heading>

      {/* Important notice about link verification */}
      <div style={{
        backgroundColor: '#FEF3C7',
        border: '2px solid #F59E0B',
        borderRadius: '8px',
        padding: 'var(--spacing-medium)',
        marginBottom: 'var(--spacing-small)'
      }}>
        <P size="small" style={{ margin: 0, color: '#92400E' }}>
          <strong>⚠️ Viktig:</strong> Lenketekst kan skjule ekte adresse. Hold musen over lenken (ikke klikk) for å se hvor den faktisk går.
        </P>
      </div>

      <div style={{ display: 'grid', gap: 'var(--spacing-medium)' }}>
        {deduplicatedVerifications.map((verification, index) => {
          const statusInfo = getStatusInfo(verification);
          return (
            <div key={index}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: 'var(--spacing-small)'
              }}>
                <P size="medium" style={{
                  margin: 0,
                  color: 'var(--color-black)',
                  fontWeight: 600
                }}>
                  📍 {verification.url}
                </P>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: 'var(--spacing-small)'
              }}>
                <P size="small" style={{ margin: 0, fontWeight: 600 }}>Status:</P>
                <span style={{
                  color: statusInfo.variant === 'success' ? '#10B981' :
                        statusInfo.variant === 'error' ? '#DC2626' :
                        statusInfo.variant === 'warning' ? '#F59E0B' : '#3B82F6',
                  fontWeight: 600
                }}>
                  {statusInfo.emoji} {statusInfo.status}
                </span>
              </div>

              {verification.verificationDetails && (
                <P size="small" style={{
                  margin: '0 0 var(--spacing-small) 0',
                  color: verification.verificationDetails.includes('⚠️') ||
                         verification.verificationDetails.toLowerCase().includes('advarsel') ||
                         verification.verificationDetails.toLowerCase().includes('lenketekst viser')
                         ? '#991B1B' : 'var(--color-black)',
                  lineHeight: 1.5,
                  backgroundColor: verification.verificationDetails.includes('⚠️') ||
                                  verification.verificationDetails.toLowerCase().includes('advarsel') ||
                                  verification.verificationDetails.toLowerCase().includes('lenketekst viser')
                                  ? '#FEE2E2' : 'transparent',
                  padding: verification.verificationDetails.includes('⚠️') ||
                          verification.verificationDetails.toLowerCase().includes('advarsel') ||
                          verification.verificationDetails.toLowerCase().includes('lenketekst viser')
                          ? 'var(--spacing-small)' : '0',
                  borderRadius: verification.verificationDetails.includes('⚠️') ||
                               verification.verificationDetails.toLowerCase().includes('advarsel') ||
                               verification.verificationDetails.toLowerCase().includes('lenketekst viser')
                               ? '6px' : '0',
                  border: verification.verificationDetails.includes('⚠️') ||
                         verification.verificationDetails.toLowerCase().includes('advarsel') ||
                         verification.verificationDetails.toLowerCase().includes('lenketekst viser')
                         ? '2px solid #DC2626' : 'none',
                  fontWeight: verification.verificationDetails.includes('⚠️') ||
                             verification.verificationDetails.toLowerCase().includes('advarsel') ||
                             verification.verificationDetails.toLowerCase().includes('lenketekst viser')
                             ? 600 : 400
                }}>
                  <strong>Funn:</strong> {verification.verificationDetails}
                </P>
              )}

            </div>
          );
        })}
      </div>

    </Card>
  );
}