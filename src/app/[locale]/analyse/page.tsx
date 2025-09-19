'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button,
  Card,
  Flex,
  GlobalStatus,
  Heading,
  Section
} from '@dnb/eufemia/components';
import { P } from '@dnb/eufemia/elements';
import { loadMessages, t } from '@/lib/i18n';
import { AnalysisResult } from '@/lib/textRules';
import AnalysisSummary from '@/components/AnalysisSummary';
import Chips from '@/components/Chips';

interface AnalysePageProps {
  params: { locale: string };
}

export default function AnalysePage({ params }: AnalysePageProps) {
  const messages = loadMessages(params.locale as 'nb' | 'en');
  const router = useRouter();
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisText, setAnalysisText] = useState<string>('');

  useEffect(() => {
    // Load analysis result from sessionStorage
    const storedResult = sessionStorage.getItem('analysisResult');
    const storedText = sessionStorage.getItem('analysisText');
    
    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult));
        setAnalysisText(storedText || '');
      } catch (error) {
        console.error('Failed to parse analysis result:', error);
        router.push(`/${params.locale}`);
      }
    } else {
      // No result available, redirect to home
      router.push(`/${params.locale}`);
    }
  }, [params.locale, router]);

  const handleNewAnalysis = () => {
    sessionStorage.removeItem('analysisResult');
    sessionStorage.removeItem('analysisText');
    router.push(`/${params.locale}`);
  };

  const handleDeleteData = () => {
    sessionStorage.clear();
    GlobalStatus.Add({
      id: 'data-deleted',
      status_id: 'data-deleted',
      text: t(messages, 'dataDeleted') || 'Data slettet',
      on_close: () => {}
    });
    router.push(`/${params.locale}`);
  };

  if (!result) {
    return (
      <Section spacing>
        <Card>
          <P>{t(messages, 'analyzing')}</P>
        </Card>
      </Section>
    );
  }

  return (
    <>
      <Section spacing>
        <Flex.Stack gap="large">
          <Card>
            <Heading size="xx-large" level="1">
              {t(messages, 'analysisResultTitle') || 'Analyseresultat'}
            </Heading>
            <Button
              text={t(messages, 'back')}
              variant="tertiary"
              on_click={() => router.back()}
              icon="chevron_left"
              icon_position="left"
              top="medium"
            />
          </Card>

          <AnalysisSummary result={result} messages={messages} />

          {result.triggers && result.triggers.length > 0 && (
            <Card>
              <Heading size="medium" level="3">
                {t(messages, 'triggers')}
              </Heading>
              <Chips items={result.triggers.map(t => t.type)} variant="default" />
            </Card>
          )}

          {analysisText && (
            <Card>
              <details>
                <summary className="analyzed-text-summary">
                  <Heading size="small" level="4">
                    {t(messages, 'analyzedText') || 'Analysert tekst'}
                  </Heading>
                </summary>
                <div className="analyzed-text-content">
                  <P>{analysisText}</P>
                </div>
              </details>
            </Card>
          )}

          <Card>
            <Heading size="medium" level="3">
              {t(messages, 'nextSteps')}
            </Heading>
            <Flex.Horizontal gap="medium" wrap>
              <Button
                text={t(messages, 'contactDNB')}
                href="https://www.dnb.no/kontakt"
                target="_blank"
                icon="external"
                icon_position="right"
              />
              <Button
                text={t(messages, 'learnMore')}
                href="https://www.dnb.no/svindel"
                target="_blank"
                variant="secondary"
                icon="external"
                icon_position="right"
              />
              <Button
                text={t(messages, 'newAnalysis')}
                variant="secondary"
                on_click={handleNewAnalysis}
              />
              <Button
                text={t(messages, 'deleteAll')}
                variant="tertiary"
                on_click={handleDeleteData}
                icon="trash"
                icon_position="left"
              />
            </Flex.Horizontal>
          </Card>
        </Flex.Stack>
      </Section>

      <style jsx>{`
        .analyzed-text-summary {
          cursor: pointer;
          padding: var(--spacing-medium);
          list-style: none;
        }

        .analyzed-text-summary::-webkit-details-marker {
          display: none;
        }

        .analyzed-text-content {
          padding: var(--spacing-medium);
          background-color: var(--color-surface-alt);
          border-radius: var(--border-radius-small);
          margin-top: var(--spacing-small);
          max-height: 300px;
          overflow-y: auto;
        }

        details[open] .analyzed-text-summary {
          margin-bottom: var(--spacing-small);
        }
      `}</style>
    </>
  );
}