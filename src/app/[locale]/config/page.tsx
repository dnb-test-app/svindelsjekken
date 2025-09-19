'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Heading,
  P,
  Input,
  Textarea,
  Dropdown,
  Button,
  Space,
  FormRow,
  FormSet,
  Section,
  FormStatus,
  Icon,
  Flex,
} from '@dnb/eufemia';
import { useRouter } from 'next/navigation';
import { loadMessages, isValidLocale, type Locale } from '@/lib/i18n';
import {
  OpenRouterClient,
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  DEFAULT_SYSTEM_PROMPT,
  type OpenRouterConfig,
} from '@/lib/openrouter';

interface ConfigPageProps {
  params: { locale: string };
}

export default function ConfigPage({ params }: ConfigPageProps) {
  const router = useRouter();
  const locale = isValidLocale(params.locale) ? params.locale : 'nb';
  const messages = loadMessages(locale as Locale);
  
  const [config, setConfig] = useState<OpenRouterConfig>({
    apiKey: '',
    model: DEFAULT_MODEL,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    temperature: 0.3,
    maxTokens: 2000,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'info' | 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);
  
  useEffect(() => {
    // Load saved config from localStorage
    const savedConfig = OpenRouterClient.getConfigFromLocalStorage();
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, []);
  
  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    
    try {
      // Validate API key if provided
      if (config.apiKey && !OpenRouterClient.validateApiKey(config.apiKey)) {
        setStatusMessage({
          type: 'error',
          text: locale === 'nb' 
            ? 'API-nøkkelen ser ikke ut til å være gyldig. Sjekk at den er korrekt.'
            : 'The API key does not appear to be valid. Please check that it is correct.',
        });
        setIsSaving(false);
        return;
      }
      
      // Save config to localStorage
      OpenRouterClient.saveConfigToLocalStorage(config);
      
      setStatusMessage({
        type: 'success',
        text: locale === 'nb' 
          ? 'AI-innstillingene dine har blitt lagret.'
          : 'Your AI settings have been saved.',
      });
      
      // Redirect back to home after a short delay
      setTimeout(() => {
        router.push(`/${locale}`);
      }, 1500);
    } catch (error) {
      console.error('Failed to save config:', error);
      setStatusMessage({
        type: 'error',
        text: locale === 'nb' 
          ? 'Kunne ikke lagre innstillingene. Prøv igjen.'
          : 'Could not save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleReset = () => {
    setConfig({
      apiKey: '',
      model: DEFAULT_MODEL,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 2000,
    });
    OpenRouterClient.clearConfig();
    
    setStatusMessage({
      type: 'info',
      text: locale === 'nb' 
        ? 'Innstillingene har blitt tilbakestilt til standard.'
        : 'Settings have been reset to defaults.',
    });
  };
  
  const modelOptions = AVAILABLE_MODELS.map(model => ({
    value: model.id,
    content: model.name,
    suffix: `$${model.pricing.prompt}/$${model.pricing.completion} per 1M`,
  }));
  
  return (
    <div className="config-page">
      <Section spacing>
        <Space top="large" bottom="large">
          <Card>
            <Heading size="xx-large">
              <Icon icon="settings" size="medium" />
              {' '}
              {messages.aiSettings || 'AI-innstillinger'}
            </Heading>
            
            <P size="medium">
              {locale === 'nb' 
                ? 'Konfigurer AI-modell og systemprompt for avansert svindeldeteksjon med OpenRouter.'
                : 'Configure AI model and system prompt for advanced fraud detection with OpenRouter.'}
            </P>
            
            {statusMessage && (
              <Space top="medium">
                <FormStatus state={statusMessage.type}>
                  {statusMessage.text}
                </FormStatus>
              </Space>
            )}
            
            <Space top="large">
              <FormSet>
                <FormRow>
                  <div>
                    <Input
                      label={messages.apiKey || 'API-nøkkel'}
                      placeholder="sk-or-v1-..."
                      type={showApiKey ? 'text' : 'password'}
                      value={config.apiKey}
                      on_change={({ value }) => 
                        setConfig({ ...config, apiKey: value as string })
                      }
                    />
                    <P size="small" modifier="muted" style={{ marginTop: '0.5rem' }}>
                      {locale === 'nb' 
                        ? 'Få din API-nøkkel fra '
                        : 'Get your API key from '}
                      <a 
                        href="https://openrouter.ai/keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        openrouter.ai/keys
                      </a>
                    </P>
                    <Button
                      variant="tertiary"
                      icon={showApiKey ? 'hide' : 'view'}
                      icon_position="left"
                      on_click={() => setShowApiKey(!showApiKey)}
                      aria-label={showApiKey ? 'Skjul API-nøkkel' : 'Vis API-nøkkel'}
                      style={{ marginTop: '0.5rem' }}
                    >
                      {showApiKey 
                        ? (locale === 'nb' ? 'Skjul' : 'Hide')
                        : (locale === 'nb' ? 'Vis' : 'Show')}
                    </Button>
                  </div>
                </FormRow>
                
                <FormRow>
                  <Dropdown
                    label={messages.model || 'Modell'}
                    value={config.model}
                    data={modelOptions}
                    on_change={({ data }) => 
                      setConfig({ ...config, model: data?.value as string })
                    }
                  />
                  <P size="small" modifier="muted" style={{ marginTop: '0.5rem' }}>
                    {locale === 'nb' 
                      ? 'Velg hvilken AI-modell som skal brukes for analyse. Priser vises per 1 million tokens.'
                      : 'Choose which AI model to use for analysis. Prices shown per 1 million tokens.'}
                  </P>
                </FormRow>
                
                <FormRow>
                  <Textarea
                    label={messages.systemPrompt || 'Systemprompt'}
                    value={config.systemPrompt}
                    rows={10}
                    on_change={({ value }) => 
                      setConfig({ ...config, systemPrompt: value as string })
                    }
                  />
                  <P size="small" modifier="muted" style={{ marginTop: '0.5rem' }}>
                    {locale === 'nb' 
                      ? 'Dette definerer hvordan AI-modellen skal oppføre seg og hva den skal fokusere på.'
                      : 'This defines how the AI model should behave and what it should focus on.'}
                  </P>
                </FormRow>
                
                <FormRow>
                  <Flex.Container gap="small">
                    <Button
                      variant="primary"
                      icon="save"
                      icon_position="left"
                      on_click={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving 
                        ? (locale === 'nb' ? 'Lagrer...' : 'Saving...')
                        : (messages.save || 'Lagre')}
                    </Button>
                    
                    <Button
                      variant="secondary"
                      on_click={() => router.push(`/${locale}`)}
                    >
                      {messages.cancel || 'Avbryt'}
                    </Button>
                    
                    <Button
                      variant="tertiary"
                      icon="reset"
                      icon_position="left"
                      on_click={handleReset}
                    >
                      {locale === 'nb' ? 'Tilbakestill' : 'Reset'}
                    </Button>
                  </Flex.Container>
                </FormRow>
              </FormSet>
            </Space>
          </Card>
          
          <Space top="large">
            <Card>
              <Heading size="large">
                <Icon icon="information" size="small" />
                {' '}
                {locale === 'nb' ? 'Om OpenRouter' : 'About OpenRouter'}
              </Heading>
              
              <P>
                {locale === 'nb' 
                  ? 'OpenRouter gir tilgang til flere ledende AI-modeller gjennom én API. Dette gjør at DNB Svindelsjekk kan bruke den beste modellen for svindeldeteksjon.'
                  : 'OpenRouter provides access to multiple leading AI models through one API. This allows DNB Fraud Check to use the best model for fraud detection.'}
              </P>
              
              <P>
                {locale === 'nb' 
                  ? 'Når du bruker AI-analyse, sendes teksten til OpenRouter for prosessering. Data blir ikke lagret og slettes umiddelbart etter analyse.'
                  : 'When using AI analysis, text is sent to OpenRouter for processing. Data is not stored and is deleted immediately after analysis.'}
              </P>
              
              <Space top="small">
                <Button
                  variant="tertiary"
                  icon="external"
                  icon_position="right"
                  element="a"
                  href="https://openrouter.ai/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {locale === 'nb' ? 'Les mer om OpenRouter' : 'Learn more about OpenRouter'}
                </Button>
              </Space>
            </Card>
          </Space>
        </Space>
      </Section>
      
      <style jsx>{`
        .config-page {
          max-width: var(--layout-medium);
          margin: 0 auto;
          padding: 0 var(--spacing-medium);
        }
      `}</style>
    </div>
  );
}