'use client';

import { Button, Card, Flex, Heading, Section } from '@dnb/eufemia/components';
import { P, Ul, Li } from '@dnb/eufemia/elements';
import { loadMessages, t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

interface PrivacyPageProps {
  params: { locale: string };
}

export default function PrivacyPage({ params }: PrivacyPageProps) {
  const messages = loadMessages(params.locale as 'nb' | 'en');
  const router = useRouter();

  return (
    <>
      <Section spacing>
        <Card>
          <Button
            text={t(messages, 'back')}
            variant="tertiary"
            on_click={() => router.back()}
            icon="chevron_left"
            icon_position="left"
          />
        </Card>
      </Section>

      <Section spacing>
        <Flex.Stack gap="large">
          <Card>
            <Heading size="xx-large" level="1">
              {t(messages, 'privacyTitle')}
            </Heading>
            <P>
              {t(messages, 'privacyContent')}
            </P>
          </Card>

          <Card>
            <Heading size="large" level="2">
              {t(messages, 'dataProcessing')}
            </Heading>
            <P>
              {t(messages, 'dataProcessingContent')}
            </P>
          </Card>

          <Card>
            <Heading size="large" level="2">
              {params.locale === 'nb' ? 'Lokal analyse' : 'Local analysis'}
            </Heading>
            <Ul>
              <Li>
                {params.locale === 'nb'
                  ? 'All tekstanalyse skjer i din nettleser'
                  : 'All text analysis happens in your browser'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'OCR-behandling av bilder skjer lokalt'
                  : 'OCR processing of images happens locally'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Ingen data sendes til servere som standard'
                  : 'No data is sent to servers by default'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Data i nettleseren slettes når du lukker fanen'
                  : 'Browser data is deleted when you close the tab'}
              </Li>
            </Ul>
          </Card>

          <Card>
            <Heading size="large" level="2">
              {params.locale === 'nb' ? 'Dyp sjekk (valgfritt)' : 'Deep check (optional)'}
            </Heading>
            <Ul>
              <Li>
                {params.locale === 'nb'
                  ? 'Krever eksplisitt samtykke fra brukeren'
                  : 'Requires explicit consent from the user'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Data sendes kryptert til våre servere'
                  : 'Data is sent encrypted to our servers'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Analyseres og slettes umiddelbart'
                  : 'Analyzed and deleted immediately'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Ingen langtidslagring av brukerdata'
                  : 'No long-term storage of user data'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Ingen deling med tredjepart'
                  : 'No sharing with third parties'}
              </Li>
            </Ul>
          </Card>

          <Card>
            <Heading size="large" level="2">
              {params.locale === 'nb' ? 'Dine rettigheter' : 'Your rights'}
            </Heading>
            <P>
              {params.locale === 'nb'
                ? 'Du har full kontroll over dine data. Du kan når som helst:'
                : 'You have full control over your data. You can at any time:'}
            </P>
            <Ul>
              <Li>
                {params.locale === 'nb'
                  ? 'Slette all data med "Slett alt"-knappen'
                  : 'Delete all data with the "Delete all" button'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Velge å ikke bruke dyp sjekk'
                  : 'Choose not to use deep check'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Lukke nettleseren for å fjerne all lokal data'
                  : 'Close the browser to remove all local data'}
              </Li>
            </Ul>
          </Card>

          <Card>
            <Heading size="large" level="2">
              {params.locale === 'nb' ? 'Cookies' : 'Cookies'}
            </Heading>
            <P>
              {params.locale === 'nb'
                ? 'Vi bruker kun funksjonelle cookies for:'
                : 'We only use functional cookies for:'}
            </P>
            <Ul>
              <Li>
                {params.locale === 'nb'
                  ? 'Språkvalg (locale)'
                  : 'Language selection (locale)'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Temavalg (light/dark/system)'
                  : 'Theme selection (light/dark/system)'}
              </Li>
            </Ul>
            <P>
              {params.locale === 'nb'
                ? 'Ingen sporing eller analysecookies brukes.'
                : 'No tracking or analytics cookies are used.'}
            </P>
          </Card>

          <Card>
            <Heading size="large" level="2">
              {params.locale === 'nb' ? 'Kontakt' : 'Contact'}
            </Heading>
            <P>
              {params.locale === 'nb'
                ? 'For spørsmål om personvern, kontakt DNB på:'
                : 'For privacy questions, contact DNB at:'}
            </P>
            <Button
              text="personvern@dnb.no"
              href="mailto:personvern@dnb.no"
              variant="secondary"
              icon="email"
              icon_position="left"
            />
          </Card>
        </Flex.Stack>
      </Section>
    </>
  );
}