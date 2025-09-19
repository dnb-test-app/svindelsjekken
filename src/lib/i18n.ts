export type Locale = 'nb' | 'en';

export function isValidLocale(locale: string): locale is Locale {
  return locale === 'nb' || locale === 'en';
}

export function loadMessages(locale: Locale) {
  const messages = {
    nb: {
      title: 'DNB Svindelsjekk',
      subtitle: 'Sjekk om noe kan være svindel',
      description: 'Få en veiledende vurdering av om en melding, e-post eller nettside kan være svindel.',
      inputPlaceholder: 'Lim inn tekst eller last opp bilde her...',
      analyzeButton: 'Analyser',
      analyzing: 'Analyserer...',
      riskLevel: 'Risikonivå',
      low: 'Lav',
      medium: 'Middels',
      high: 'Høy',
      triggers: 'Varseltegn funnet',
      recommendations: 'Anbefalinger',
      deepCheck: 'Dyp sjekk',
      deepCheckDescription: 'Få en grundigere analyse med AI',
      privacy: 'Personvern',
      about: 'Om tjenesten',
      darkMode: 'Mørk modus',
      language: 'Språk',
      config: 'Konfigurasjon',
      aiSettings: 'AI-innstillinger',
      model: 'Modell',
      systemPrompt: 'Systemprompt',
      apiKey: 'API-nøkkel',
      save: 'Lagre',
      cancel: 'Avbryt',
      defaultSystemPrompt: 'Du er en AI-assistent som spesialiserer seg på å identifisere svindelforsøk. Analyser følgende tekst og gi en vurdering av sannsynligheten for at det er svindel. Fokuser på norske svindelmetoder og DNBs sikkerhetsanbefalinger.',
      dataDeleted: 'Data slettet',
      analysisResultTitle: 'Analyseresultat',
      back: 'Tilbake',
      analyzedText: 'Analysert tekst',
      nextSteps: 'Neste steg',
      contactDNB: 'Kontakt DNB',
      learnMore: 'Lær mer',
      newAnalysis: 'Ny analyse',
      deleteAll: 'Slett alt',
    },
    en: {
      title: 'DNB Fraud Check',
      subtitle: 'Check if something might be fraud',
      description: 'Get an assessment of whether a message, email or website might be fraudulent.',
      inputPlaceholder: 'Paste text or upload image here...',
      analyzeButton: 'Analyze',
      analyzing: 'Analyzing...',
      riskLevel: 'Risk Level',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      triggers: 'Warning signs found',
      recommendations: 'Recommendations',
      deepCheck: 'Deep check',
      deepCheckDescription: 'Get a more thorough AI analysis',
      privacy: 'Privacy',
      about: 'About',
      darkMode: 'Dark mode',
      language: 'Language',
      config: 'Configuration',
      aiSettings: 'AI Settings',
      model: 'Model',
      systemPrompt: 'System Prompt',
      apiKey: 'API Key',
      save: 'Save',
      cancel: 'Cancel',
      defaultSystemPrompt: 'You are an AI assistant specializing in identifying fraud attempts. Analyze the following text and assess the likelihood that it is fraudulent. Focus on Norwegian fraud methods and DNB security recommendations.',
      dataDeleted: 'Data deleted',
      analysisResultTitle: 'Analysis Result',
      back: 'Back',
      analyzedText: 'Analyzed text',
      nextSteps: 'Next steps',
      contactDNB: 'Contact DNB',
      learnMore: 'Learn more',
      newAnalysis: 'New analysis',
      deleteAll: 'Delete all',
    }
  };
  
  return messages[locale];
}

export type Messages = ReturnType<typeof loadMessages>;

export function t(messages: Messages, key: string): string {
  return (messages as any)[key] || key;
}