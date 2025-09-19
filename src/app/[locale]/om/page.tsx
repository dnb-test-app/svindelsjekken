'use client';

import { Button, Card, Flex, Heading, Section } from '@dnb/eufemia/components';
import { P, Ul, Li } from '@dnb/eufemia/elements';
import { loadMessages, t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

interface AboutPageProps {
  params: { locale: string };
}

export default function AboutPage({ params }: AboutPageProps) {
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
              {t(messages, 'aboutTitle')}
            </Heading>
            <P>
              {t(messages, 'aboutContent')}
            </P>
          </Card>

          <Card>
            <Heading size="large" level="2">
              {t(messages, 'limitations')}
            </Heading>
            <P>
              {t(messages, 'limitationsContent')}
            </P>
            <Ul>
              <Li>
                {params.locale === 'nb' 
                  ? 'Nye svindelmetoder utvikles kontinuerlig'
                  : 'New fraud methods are continuously developed'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Verktøyet kan ikke garantere 100% nøyaktighet'
                  : 'The tool cannot guarantee 100% accuracy'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Menneskelig vurdering er alltid viktig'
                  : 'Human judgment is always important'}
              </Li>
            </Ul>
          </Card>

          <Card>
            <Heading size="large" level="2">
              {params.locale === 'nb' ? 'Teknologi' : 'Technology'}
            </Heading>
            <P>
              {params.locale === 'nb'
                ? 'DNB Svindelsjekk bruker en kombinasjon av:'
                : 'DNB Fraud Check uses a combination of:'}
            </P>
            <Ul>
              <Li>
                {params.locale === 'nb'
                  ? 'Regelbasert analyse med kjente svindelmønstre'
                  : 'Rule-based analysis with known fraud patterns'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Lokal OCR (Optical Character Recognition) for bildeanalyse'
                  : 'Local OCR (Optical Character Recognition) for image analysis'}
              </Li>
              <Li>
                {params.locale === 'nb'
                  ? 'Valgfri dyp analyse med avanserte språkmodeller'
                  : 'Optional deep analysis with advanced language models'}
              </Li>
            </Ul>
          </Card>

          <Card>
            <Heading size="large" level="2">
              {params.locale === 'nb' ? 'Ansvarsfraskrivelse' : 'Disclaimer'}
            </Heading>
            <P>
              {params.locale === 'nb'
                ? 'Dette verktøyet er kun ment som veiledning og erstatter ikke profesjonell rådgivning fra DNB eller andre finansinstitusjoner. Ved mistanke om svindel, kontakt alltid DNB direkte via offisielle kanaler.'
                : 'This tool is intended for guidance only and does not replace professional advice from DNB or other financial institutions. If you suspect fraud, always contact DNB directly through official channels.'}
            </P>
          </Card>

          <Card>
            <Flex.Horizontal gap="medium">
              <Button
                text={t(messages, 'contactDNB')}
                href="https://www.dnb.no/kontakt"
                target="_blank"
                icon="external"
                icon_position="right"
              />
              <Button
                text={t(messages, 'privacy')}
                on_click={() => router.push(`/${params.locale}/personvern`)}
                variant="secondary"
              />
            </Flex.Horizontal>
          </Card>
        </Flex.Stack>
      </Section>
    </>
  );
}