interface AnalysisResult {
  score: number;
  risk: 'low' | 'medium' | 'high';
  triggers: string[];
  explanation: string;
  recommendation: string;
}

interface WebVerificationResult {
  isLegitimate: boolean;
  domainInfo?: {
    domain: string;
    isKnownLegitimate: boolean;
    isKnownMalicious: boolean;
  };
  phoneInfo?: {
    number: string;
    isKnownLegitimate: boolean;
    isKnownScam: boolean;
  };
}

export interface AIAnalysisResult {
  risk_level: 'low' | 'medium' | 'high';
  confidence: number;
  analysis: string;
  recommendation: string;
  reasoning: string;
}

// Heuristic analysis patterns
const HEURISTIC_PATTERNS = {
  urgency: {
    patterns: [
      /ring\s*(nå|umiddelbart|med\s*en\s*gang)/gi,
      /hast(e|ig)|raskt|øyeblikkelig/gi,
      /begrenset\s*tid|utløper\s*(snart|i\s*dag)/gi,
      /kun\s*i\s*dag|siste\s*sjanse/gi,
      /må\s*(ring|kontakt|svar)/gi,
      /innen\s*\d+\s*(timer|døgn|dager|minutter)/gi,
      /ellers\s*(blir|vil|kan|mister)/gi,
      /hvis\s*ikke|om\s*ikke/gi,
      /umiddelbart\s*handling|øyeblikkelig\s*respons/gi
    ],
    weight: 30,
    description: 'Hasteord og tidspress'
  },

  credentials: {
    patterns: [
      /bank\s*id|bankid/gi,
      /person\s*nummer|personnummer/gi,
      /passord|pin\s*kode|pinkode/gi,
      /konto\s*nummer|kontonummer/gi,
      /kort\s*nummer|kortnummer/gi,
      /cvv|sikkerhet\s*kode/gi,
      /fødsel\s*dato|fødselsdato/gi
    ],
    weight: 30,
    description: 'Forespørsel om legitimasjon'
  },

  domains: {
    patterns: [
      /[a-zA-Z0-9-]+\.(?!dnb\.no|sparebank1\.no|nordea\.no)[a-z]{2,}/gi,
      /bit\.ly|tinyurl|t\.co|short\.link/gi,
      /\.tk|\.ml|\.ga|\.cf/gi
    ],
    weight: 20,
    description: 'Mistenkelige domener'
  },

  phishing: {
    patterns: [
      /vunnet|gevinst|premie|utvalgt|valgt\s*ut/gi,
      /million|tusen\s*kroner|penger|pengepremie/gi,
      /konkurranse|lotteri|trekning/gi,
      /gratis|gave|bonus/gi,
      /klikk\s*her|følg\s*link/gi,
      /bekreft\s*konto|verifiser|aktivere/gi
    ],
    weight: 25,
    description: 'Vanlige phishing-termer'
  },

  tooGoodToBeTrue: {
    patterns: [
      /\d+\s*(million|tusen)\s*kroner/gi,
      /100%\s*(sikker|garantert)/gi,
      /ingen\s*risiko|risikofri/gi,
      /garantert\s*(gevinst|fortjeneste)/gi
    ],
    weight: 20,
    description: 'For godt til å være sant'
  },

  remoteAccess: {
    patterns: [
      /team\s*viewer|teamviewer/gi,
      /anydesk|remote\s*desktop/gi,
      /fjern\s*tilgang|ekstern\s*tilgang/gi,
      /chrome\s*remote|vnc/gi
    ],
    weight: 35,
    description: 'Fjernaksess-verktøy'
  },

  giftCards: {
    patterns: [
      /gave\s*kort|gavekort/gi,
      /steam|itunes|google\s*play/gi,
      /psn|playstation\s*network/gi,
      /netflix|spotify\s*kort/gi
    ],
    weight: 30,
    description: 'Gavekort som betaling'
  },

  cryptocurrency: {
    patterns: [
      /bitcoin|btc|ethereum|eth/gi,
      /crypto|krypto|digital\s*valuta/gi,
      /wallet|lommebok|blockchain/gi,
      /mining|utvinning/gi
    ],
    weight: 25,
    description: 'Kryptovaluta-relatert'
  },

  techSupportScam: {
    patterns: [
      /microsoft|apple|windows|mac\s*(har\s*oppdaget|support|kundestøtte)/gi,
      /virus|malware|trojan|infeksjon|infisert/gi,
      /data\s*(blir\s*)?slettet|miste\s*filer/gi,
      /teknisk\s*support|it\s*support|brukerstøtte/gi,
      /feilmelding|sikkerhetsproblem|sikkerhetsadvarsel/gi,
      /datamaskin|pc|mac\s*(er\s*)?(infisert|skadet|kompromittert)/gi
    ],
    weight: 40,
    description: 'Teknisk support-svindel'
  },

  paymentRequest: {
    patterns: [
      /betale?\s*\d+\s*(kr|kroner|nok)/gi,
      /vipps|paypal|western\s*union/gi,
      /gebyr|avgift|kostnad|serviceavgift/gi,
      /overføre?\s*penger|betaling/gi,
      /kun\s*\d+\s*(kr|kroner)|bare\s*\d+\s*(kr|kroner)/gi,
      /send\s*penger|overfør\s*til/gi
    ],
    weight: 30,
    description: 'Betalingsforespørsel'
  },

  impersonation: {
    patterns: [
      /(microsoft|apple|google|amazon|facebook)\s*(support|kundestøtte|team)/gi,
      /vi\s*er\s*fra\s*(microsoft|apple|google|dnb|sparebank)/gi,
      /offisiell\s*(support|melding|varsel)/gi,
      /autorisert\s*(tekniker|support|reparatør)/gi,
      /(microsoft|apple|google)\s*(har\s*oppdaget|varsler|kontakter)/gi
    ],
    weight: 35,
    description: 'Utgir seg for kjent selskap'
  }
};

// Legitimate patterns that reduce risk
const LEGITIMATE_PATTERNS = {
  officialSources: {
    patterns: [
      /fra\s*dnb\.no|@dnb\.no/gi,
      /sparebank1\.no|nordea\.no/gi,
      /regjeringen\.no|nav\.no/gi,
      /skatteetaten\.no|toll\.no/gi
    ],
    weight: -30,
    description: 'Offisielle norske nettsteder'
  },

  professionalCommunication: {
    patterns: [
      /org\.nr|organisasjon\s*nummer/gi,
      /postadresse|besøksadresse/gi,
      /kundeservice|kundestøtte/gi,
      /hilsen|mvh|med\s*vennlig\s*hilsen/gi
    ],
    weight: -15,
    description: 'Profesjonell kommunikasjon'
  }
};

export function performHeuristicAnalysis(text: string): AnalysisResult {
  let totalScore = 0;
  const triggeredPatterns: string[] = [];

  // Check malicious patterns
  Object.entries(HEURISTIC_PATTERNS).forEach(([category, config]) => {
    const matchCount = config.patterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    if (matchCount > 0) {
      // Base score plus small bonus for multiple matches
      const categoryScore = config.weight + (Math.min(matchCount - 1, 2) * 5);
      totalScore += categoryScore;
      triggeredPatterns.push(config.description);
    }
  });

  // Check legitimate patterns
  Object.entries(LEGITIMATE_PATTERNS).forEach(([category, config]) => {
    const matchCount = config.patterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    if (matchCount > 0) {
      totalScore += config.weight; // Negative weight to reduce score
    }
  });

  // Ensure score is between 0-100
  totalScore = Math.max(0, Math.min(100, totalScore));

  // Determine risk level
  let risk: 'low' | 'medium' | 'high';
  if (totalScore >= 60) {
    risk = 'high';
  } else if (totalScore >= 30) {
    risk = 'medium';
  } else {
    risk = 'low';
  }

  // Generate explanation
  let explanation = '';
  let recommendation = '';

  if (risk === 'high') {
    explanation = 'Dette ser ut som en svindelmelding. ';
    recommendation = 'Ikke svar på meldingen eller oppgi personlig informasjon.';
  } else if (risk === 'medium') {
    explanation = 'Dette kan være svindel. ';
    recommendation = 'Vær forsiktig og sjekk kilden nøye før du handler.';
  } else {
    explanation = 'Dette ser legitimt ut. ';
    recommendation = 'Likevel, vær alltid oppmerksom på tegn til svindel.';
  }

  if (triggeredPatterns.length > 0) {
    explanation += `Utløste advarsler: ${triggeredPatterns.join(', ')}.`;
  }

  return {
    score: totalScore,
    risk,
    triggers: triggeredPatterns,
    explanation,
    recommendation
  };
}

export function shouldPerformWebVerification(text: string): boolean {
  // Check if text contains URLs, phone numbers, or Norwegian-specific content
  const urlPattern = /https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/gi;
  const phonePattern = /(\+47|47|0047)?\s*[2-9]\d{7}|\d{8}/gi;
  const norwegianPattern = /dnb|sparebank|nordea|norge|norsk|kroner?|nok/gi;

  return !!(text.match(urlPattern) || text.match(phonePattern) || text.match(norwegianPattern));
}

export function extractWebVerificationData(text: string) {
  const urls: string[] = [];
  const phoneNumbers: string[] = [];

  // Extract URLs
  const urlMatches = text.match(/https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/gi);
  if (urlMatches) {
    urls.push(...urlMatches);
  }

  // Extract Norwegian phone numbers
  const phoneMatches = text.match(/(\+47|47|0047)?\s*[2-9]\d{7}|\d{8}/gi);
  if (phoneMatches) {
    phoneNumbers.push(...phoneMatches);
  }

  return { urls, phoneNumbers };
}

export function generateFollowUpQuestions(text: string, result: AnalysisResult): string[] {
  const questions: string[] = [];

  // Questions based on triggered patterns
  if (result.triggers.includes('Vanlige phishing-termer')) {
    questions.push('Har du deltatt i noen konkurranser nylig?');
    questions.push('Kjenner du til noen som har vunnet en premie fra denne kilden?');
  }

  if (result.triggers.includes('Forespørsel om legitimasjon')) {
    questions.push('Har du oppgitt noen personlig informasjon til denne kilden før?');
    questions.push('Har du mottatt lignende forespørsler fra andre kilder?');
  }

  if (result.triggers.includes('Mistenkelige domener')) {
    questions.push('Kjenner du til nettsiden som er nevnt i meldingen?');
    questions.push('Har du besøkt lignende nettsteder før?');
  }

  // Generic questions
  questions.push('Har du sett lignende meldinger før?');

  // Remove duplicates and limit to 5 questions
  const uniqueQuestions = [...new Set(questions)];
  return uniqueQuestions.slice(0, 5);
}

export async function performAIAnalysis(
  text: string,
  refinementContext?: {
    questionAnswers: Record<string, 'yes' | 'no'>;
    additionalContext: string;
  }
): Promise<AIAnalysisResult> {
  const prompt = `
Analyser følgende tekst for svindel og phishing på norsk:

TEKST: "${text}"

${refinementContext ? `
TILLEGGSKONTEKST:
Spørsmål og svar: ${Object.entries(refinementContext.questionAnswers).map(([q, a]) => `${q}: ${a}`).join(', ')}
Ekstra informasjon: ${refinementContext.additionalContext}
` : ''}

Vurder:
1. Sannsynlighet for svindel (0-100%)
2. Risikonivå (low/medium/high)
3. Detaljert analyse på norsk
4. Konkret anbefaling
5. Begrunnelse for vurderingen

Svar i JSON-format:
{
  "risk_level": "high/medium/low",
  "confidence": 85,
  "analysis": "Detaljert analyse på norsk...",
  "recommendation": "Konkret anbefaling...",
  "reasoning": "Begrunnelse for vurderingen..."
}`;

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        prompt,
        refinementContext
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('AI analysis failed:', error);

    // Fallback to heuristic analysis
    const heuristicResult = performHeuristicAnalysis(text);
    return {
      risk_level: heuristicResult.risk,
      confidence: heuristicResult.score,
      analysis: heuristicResult.explanation,
      recommendation: heuristicResult.recommendation,
      reasoning: 'Fallback til heuristisk analyse på grunn av AI-feil.'
    };
  }
}