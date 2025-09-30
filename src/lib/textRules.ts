import { analyzeURLs } from './urlAnalyzer';
import { RISK_THRESHOLDS, TRIGGER_SEVERITY_SCORES, getRiskLevelFromScore } from './constants/riskConstants';

export interface Trigger {
  type: string;
  text: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface AnalysisResult {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  triggers: Trigger[];
  recommendations: string[];
}

// DNB-anbefalte svindeldeteksjonsregler - fokusert på atferd, ikke merkenavn
const rules = {
  bankid_scam: {
    patterns: [
      /\b(bankid.*(?:utløper|fornye?s?|oppdater|reaktiver))\b/gi,
      /\b((?:fornye?|oppdater|reaktiver).*bankid)\b/gi,
    ],
    severity: 'high' as const,
    description: 'BankID-svindel - BankID fornyes kun i nettbanken',
  },
  urgency: {
    patterns: [
      /\b(haster?|raskt?|umiddelbart|nå|i dag|innen \d+ timer?|siste sjanse)\b/gi,
      /\b(urgent|immediately|now|today|within \d+ hours?|last chance)\b/gi,
    ],
    severity: 'high' as const,
    description: 'Presstaktikker for å få deg til å handle raskt',
  },
  credentials: {
    patterns: [
      /\b(passord|pin|kode|bankid|bruker(?:navn)?|pålogging)\b/gi,
      /\b(password|pin|code|username|login|credential)\b/gi,
    ],
    severity: 'high' as const,
    description: 'Forespørsel om sensitive opplysninger',
  },
  suspicious_domains: {
    patterns: [
      /\b(?:dnb-?(?:no|bank|nett)|d[nm]b\.)\w+\.\w+/gi,
      /\b(?:bit\.ly|tinyurl|short\.link|goo\.gl|t\.co|ow\.ly|is\.gd)/gi,
      /\b(?:secure-?dnb|dnb-?secure|bankid-?verify|verify-?bankid)/gi,
      /\b(?:official-?dnb|dnb-?official|norway-?bank|bank-?norway)/gi,
    ],
    severity: 'high' as const,
    description: 'Mistenkelig domene som kan etterligne DNB eller bruker URL-forkortere',
  },
  phishing_keywords: {
    patterns: [
      /\b(verifiser.*(?:klikk|lenke|link)|bekreft.*(?:klikk|lenke|link))\b/gi,
      /\b(oppdater.*(?:umiddelbart|nå|i\s?dag)|suspendert.*(?:konto|tilgang))\b/gi,
      /\b(verify.*(?:click|link)|confirm.*(?:click|link))\b/gi,
      /\b(update.*(?:immediately|now|today)|suspended.*(?:account|access))\b/gi,
    ],
    severity: 'high' as const,
    description: 'Phishing-nøkkelord kombinert med handlingskrav',
  },
  too_good_to_be_true: {
    patterns: [
      /\b(vinn.*(?:kroner?|million|tusen)|gratulerer.*(?:vunnet|valgt))\b/gi,
      /\b(gratis.*(?:penger|million|gave)|(?:100|få).*(?:%|prosent).*rabatt)\b/gi,
      /\b(win.*(?:money|million|thousand)|congratulations.*(?:won|selected))\b/gi,
      /\b(free.*(?:money|million|gift)|(?:100|get).*(?:%|percent).*discount)\b/gi,
    ],
    severity: 'high' as const,
    description: 'Urealistiske økonomiske løfter',
  },
  remote_access: {
    patterns: [
      /\b(teamviewer|anydesk|fjernhjelp|remote\s?desktop|fjernstyr)\b/gi,
    ],
    severity: 'high' as const,
    description: 'Forespørsel om fjerntilgang til enheten din',
  },
  gift_cards: {
    patterns: [
      /\b(gavekort|itunes|google\s?play|steam|paysafe)\b/gi,
      /\b(gift\s?card|voucher)\b/gi,
    ],
    severity: 'high' as const,
    description: 'Forespørsel om betaling via gavekort',
  },
  cryptocurrency: {
    patterns: [
      /\b(bitcoin|crypto|krypto|ethereum|binance|coinbase)\b/gi,
    ],
    severity: 'medium' as const,
    description: 'Kryptovaluta-relaterte forespørsler',
  },
  minimal_context_url: {
    patterns: [
      // This will be handled by our URL analyzer, but we add a basic pattern for backup
      /^https?:\/\/[^\s]+$/gi,
      /^[^\s]+\.[a-z]{2,}(?:\/[^\s]*)?$/gi,
    ],
    severity: 'medium' as const,
    description: 'URL uten kontekst - kan være mistenkelig',
  },
  ip_address_urls: {
    patterns: [
      /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s]*)?/gi,
    ],
    severity: 'high' as const,
    description: 'URL bruker IP-adresse i stedet for domenenavn',
  },
  legitimate_info: {
    patterns: [
      /\b(kvittering|bekreftelse.*kjøp|pakke.*sendt|faktura.*periode)\b/gi,
      /\b(receipt|confirmation.*purchase|package.*sent|invoice.*period)\b/gi,
    ],
    severity: 'low' as const,
    description: 'Sannsynlig legitim informasjon',
  },
};

function getURLSuspiciousDescription(key: string): string {
  const descriptions: Record<string, string> = {
    hasURLShortener: 'URL-forkortere skjuler den egentlige destinasjonen',
    hasSuspiciousTLD: 'Mistenkelig toppnivådomene som ofte brukes i svindel',
    hasIPAddress: 'Bruker IP-adresse i stedet for domenenavn',
    hasExcessiveSubdomains: 'Unormalt mange subdomener - kan være mistenkelig',
    hasMisleadingDomain: 'Domenenavn som prøver å etterligne kjente tjenester',
    hasTyposquatting: 'Domenet ligner på et kjent nettsted men er ikke identisk',
    hasPhishingKeywords: 'Inneholder ord som ofte brukes i phishing-forsøk'
  };
  return descriptions[key] || 'Mistenkelig URL-mønster';
}

export function analyzeText(text: string): AnalysisResult {
  const triggers: Trigger[] = [];
  let riskScore = 0;

  // First, analyze URLs with our specialized analyzer
  const urlAnalysis = analyzeURLs(text);
  if (urlAnalysis.isUrl) {
    // Add URL-specific risk to base score
    riskScore += urlAnalysis.riskScore * 0.7; // Weight URL analysis at 70%

    // Add URL-specific triggers
    if (urlAnalysis.hasMinimalContext) {
      triggers.push({
        type: 'minimal_context',
        text: 'URL med lite kontekst',
        severity: 'medium',
        description: 'Lenke mangler kontekst om hvor den kommer fra'
      });
    }

    Object.entries(urlAnalysis.suspicious).forEach(([key, value]) => {
      if (value) {
        triggers.push({
          type: key,
          text: urlAnalysis.extractedURLs[0] || 'URL',
          severity: key === 'hasTyposquatting' || key === 'hasMisleadingDomain' ? 'high' : 'medium',
          description: getURLSuspiciousDescription(key)
        });
      }
    });
  }
  
  // Sjekk hver regel
  for (const [ruleType, rule] of Object.entries(rules)) {
    for (const pattern of rule.patterns) {
      const matches = text.match(pattern);
      if (matches) {
        // Unngå duplikater
        const uniqueMatches = [...new Set(matches)];
        
        for (const match of uniqueMatches) {
          triggers.push({
            type: ruleType,
            text: match,
            severity: rule.severity,
            description: rule.description,
          });
          
          // Beregn risikoscore basert på alvorlighetsgrad
          switch (rule.severity) {
            case 'high':
              riskScore += TRIGGER_SEVERITY_SCORES.HIGH;
              break;
            case 'medium':
              riskScore += TRIGGER_SEVERITY_SCORES.MEDIUM;
              break;
            case 'low':
              riskScore -= TRIGGER_SEVERITY_SCORES.LOW; // Reduser risikoscore for legitimt innhold
              break;
          }
        }
      }
    }
  }
  
  // Begrens risikoscore til 0-100
  riskScore = Math.max(RISK_THRESHOLDS.LOW_MIN, Math.min(RISK_THRESHOLDS.HIGH_MAX, riskScore));

  // Bestem risikonivå
  const riskLevel = getRiskLevelFromScore(riskScore);
  
  // Generer anbefalinger basert på risikonivå
  const recommendations = [];
  
  if (riskLevel === 'high') {
    recommendations.push(
      'Slett meldingen umiddelbart',
      'IKKE klikk på lenker eller oppgi informasjon',
      'Blokker avsenderen',
      'Hvis du har oppgitt informasjon: Ring DNB på 915 04800 øyeblikkelig'
    );
  } else if (riskLevel === 'medium') {
    recommendations.push(
      'Vær forsiktig og dobbeltsjekk avsender',
      'Ikke klikk på lenker før du er sikker',
      'Slett mistenkelige meldinger',
      'Bruk kun offisielle DNB-kanaler (dnb.no)'
    );
  } else {
    recommendations.push(
      'Fortsett å være oppmerksom',
      'Verifiser alltid avsender',
      'Bruk offisielle DNB-kanaler for sensitiv informasjon'
    );
  }
  
  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    triggers,
    recommendations,
  };
}