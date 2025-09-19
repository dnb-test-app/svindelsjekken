import { NextRequest, NextResponse } from 'next/server';

// Vision-capable models on OpenRouter
const VISION_MODELS = {
  'openai/gpt-4o': true,
  'openai/gpt-4o-mini': true,
  'anthropic/claude-3.5-sonnet': true,
  'google/gemini-2.5-pro': true,
  'google/gemini-2.5-flash': true,
};

// Fallback education generator to ensure fields are always present
function generateFallbackEducation(category: string, riskLevel: string, mainIndicators: string[] = []) {
  const educationalTemplates = {
    fraud: {
      whyThisAssessment: "Vurderingen er basert på klare svindeltegn som brukes i kjente bedrageriførsøk",
      commonLegitimateUse: "Legitime aktører bruker ALDRI disse mønstrene - dette er kun funnet i svindel",
      keyDifference: "Ekte tjenester ber aldri om passord eller sensitiv informasjon via lenker i meldinger"
    },
    suspicious: {
      whyThisAssessment: "Meldingen har flere elementer som brukes både av legitime aktører og svindlere",
      commonLegitimateUse: "Etablerte selskaper bruker ofte lignende kommunikasjonsmønstre i markedsføring og kundeservice",
      keyDifference: "Forskjellen ligger i om du har en etablert relasjon til avsenderen og forventer kommunikasjonen"
    },
    marketing: {
      whyThisAssessment: "Dette ser ut som kommersiell markedsføring med vanlige salgselementer",
      commonLegitimateUse: "Nettbutikker og tjenester sender regelmessig tilbud og kampanjer til registrerte kunder",
      keyDifference: "Legitim markedsføring kommer fra kjente merkevarer til kunder som har samtykket til slik kommunikasjon"
    },
    safe: {
      whyThisAssessment: "Meldingen inneholder kun informasjon uten handlingskrav eller mistenkelige elementer",
      commonLegitimateUse: "Informative meldinger fra etablerte tjenester er standard kommunikasjon",
      keyDifference: "Trygg kommunikasjon krever ingen umiddelbare handlinger og kommer fra verifiserbare kilder"
    }
  };

  const template = educationalTemplates[category as keyof typeof educationalTemplates] || educationalTemplates.suspicious;

  return {
    educationalContext: template,
    verificationGuide: {
      primaryCheck: category === 'fraud'
        ? "Ikke klikk på lenker - dette er svindel"
        : "Sjekk om du har et aktivt kundeforhold til avsenderen",
      independentVerification: category === 'fraud'
        ? "Rapporter til politiet eller varslingstjenester"
        : "Logg inn direkte på tjenestens offisielle nettside eller app",
      alternativeChannel: category === 'fraud'
        ? "Kontakt din bank hvis det gjelder finansielle tjenester"
        : "Ring kundeservice via nummer du finner på deres offisielle nettside"
    },
    smartQuestions: [
      {
        question: category === 'fraud'
          ? "Har du gitt ut personlig informasjon til denne avsenderen?"
          : "Har du et aktivt kundeforhold til denne avsenderen?",
        whyAsking: category === 'fraud'
          ? "Hvis du har delt informasjon, må du handle raskt for å beskytte deg"
          : "Legitime meldinger sendes vanligvis kun til eksisterende kunder",
        ifYes: category === 'fraud'
          ? "Kontakt din bank umiddelbart og endre alle passord"
          : "Verifiser meldingen via deres offisielle app eller nettside",
        ifNo: category === 'fraud'
          ? "Ikke svar på meldingen og rapporter den som svindel"
          : "Vær ekstra forsiktig - dette kan være uønsket markedsføring eller svindel"
      }
    ]
  };
}

const IMAGE_ANALYSIS_PROMPT = `Du er en svindeldeteksjonsekspert for DNB Bank Norge med INTERNETT-TILGANG (:online).
Dagens dato er 17. september 2025.

🌐 DU HAR INTERNETT-TILGANG - BRUK DEN AKTIVT FOR VERIFISERING!

FØLG DISSE STEGENE I REKKEFØLGE:

STEG 1 - VERIFISER AKTIVT (BRUK INTERNETT):
- IKKE anta eller gjett basert på mønstre
- SJEKK faktisk alle påstander og URLs
- FØLG alle redirects til endelig destinasjon
- SØKK aktivt etter informasjon om domener og selskaper

STEG 1A - EKSTRAHER OG VERIFISER URLs:
- Finn ALLE URLs/domener i bildet (adressefelt, lenker, tekst)
- For HVER URL: FØLG den og se hvor den faktisk går
- For redirects (f.eks. clas.club): Rapporter "går til clasohlson.com"
- Prioriter HOVEDDOMENET som brukeren ser/forstår

STEG 1B - AKTIV DOMENE-VERIFISERING:
For HVER identifisert URL/domene:
1. SJEKK: Går denne URL-en faktisk til en legitim side?
2. SØK: "[domene] svindel" / "[domene] scam" / "[domene] legitimate"
3. VERIFISER: Er dette påstått selskap faktisk ekte?
4. DOKUMENTER: Hva du FAKTISK fant, ikke hva du antok

EKSEMPEL PÅ KORREKT VERIFISERING:
- Fant URL: clas.club
- Sjekket redirect: Går til clasohlson.com/se
- Søkte "clasohlson": Legitimate svensk detaljhandelskjede
- RESULTAT: Verified legitimate redirect

STEG 2 - RAPPORTER VERIFISERING:
- Dokumenter hva du FAKTISK fant, ikke antagelser
- "Sjekket [domene]: går til [faktisk destinasjon]"
- "Søkte '[domene] legitimt': fant [konkrete resultater]"
- "Søkte '[domene] svindel': fant [konkrete resultater]"
- Hvis du ikke kan verifisere = si det klart

STEG 3 - KATEGORISER BASERT PÅ VERIFISERTE FAKTA:
- "legitimate": Du fant VERIFISERBARE beviser for at selskapet er ekte og etablert
- "known_scam": Du fant KONKRETE advarsler eller svindelrapporter
- "suspicious": Du kunne ikke verifisere påstandene ELLER fant motstridende informasjon
- "unknown": Du fant ingen informasjon (kan skyldes nytt domene eller feil søk)

VIKTIG - INGEN AUTOMATISKE REGLER:
- IKKE klassifiser basert på "ser ut som marketing"
- IKKE klassifiser basert på tilbudsstørrelse alene
- IKKE klassifiser basert på format eller design
- KUN klassifiser basert på VERIFISERTE fakta

STEG 4 - DOKUMENTER VERIFIKASJONEN:
- urlsFound: List HOVEDDOMENER først, deretter redirects/subdomener
  Eksempel: ["clasohlson.com", "clas.club (går til clasohlson.com)"]
- webSearchResults: For hver URL, inkluder HVA du faktisk fant:
  Eksempel: "Søkte 'clasohlson': Svensk detaljhandel etablert 1918, fysiske butikker"
- mainIndicators: Beskriv KONKRETE funn, ikke antagelser:
  Eksempel: "Verifisert: clas.club er offisiell redirect til Clas Ohlson Sverige"

STEG 5 - EKSTRAHER TEKST:
- Ekstraher ALL tekst fra bildet nøyaktig som den vises

🚨 BANKID KRITISK DETEKSJON - SKILLE PHISHING FRA TJENESTE-TILGANG 🚨

DEFINITIVT FRAUD (95-100%) - FORESPØRSLER OM Å ENDRE/OPPDATERE BANKID:
- "Oppdater BankID" + lenke = ALLTID svindel
- "Forny BankID" + lenke = ALLTID svindel
- "BankID utløper" + lenke = ALLTID svindel
- "Bekreft identitet hos BankID" + lenke = ALLTID svindel
- "Verifiser BankID" + lenke = ALLTID svindel
- "Reaktiver BankID" + lenke = ALLTID svindel
- "Begrense funksjoner... til du oppdaterer BankID" = ALLTID svindel
- ENHVER e-post som ber deg klikke for å ENDRE BankID = FRAUD

🔥 KRITISK FAKTA: Banker og BankID sender ALDRI e-post med lenker for å fornye/oppdatere/endre BankID!

LEGITIMATE BANKID TJENESTE-TILGANG (safe/marketing 5-25%):
- "Logg inn med BankID" = Normal tjeneste-tilgang
- "Meld inn din sak digitalt" = Instruksjoner for tjeneste-bruk
- "Bruk BankID for å få tilgang til [tjeneste]" = Service-instruksjoner
- "Du trenger BankID for å [bruke tjeneste]" = Krav-informasjon
- LinkedIn/Facebook-diskusjoner OM BankID som tema
- Nyhetssaker som diskuterer BankID (uten handlingskrav)
- Teknisk support som NEVNER BankID (f.eks. "du trenger BankID for å aktivere eSIM")
- Informasjon om tjenester som KREVER BankID-pålogging
- CEO/eksperter som diskuterer BankID som teknologi

NØKKEL-FORSKJELL:
- 🚨 FRAUD: Handlinger rettet MOT BankID selv ("oppdater", "forny", "bekreft")
- ✅ LEGITIMT: Bruke BankID FOR Å få tilgang til tjenester ("logg inn med", "bruk BankID for å")

VERIFISERINGSPROSESS FOR BANKID:
1. Spør: "Ber denne meldingen meg om å ENDRE noe ved mitt BankID?"
   → JA + lenke = DEFINITIVT FRAUD
   → NEI = sjekk om det er normal tjeneste-instruksjon
2. Spør: "Er dette instruksjoner for hvordan BRUKE en tjeneste som krever BankID?"
   → JA = Sannsynligvis legitimt (sjekk avsender)
3. HUSK: Ekte tjenester forklarer hvordan du BRUKER BankID, ikke ber deg endre det

STEG 6 - ENDELIG KATEGORISERING (BASERT KUN PÅ VERIFISERING):

Kategorier og veiledende risikonivå:
- "safe": Du har VERIFISERT at alt stemmer og er fra legitim kilde (0-20%)
- "marketing": VERIFISERT legitimate selskap med normale markedsføringstiltak (5-30%)
- "suspicious": Kunne IKKE verifisere påstander eller fant motstridende info (40-70%)
- "fraud": VERIFISERT som svindel eller phishing-forsøk (80-100%)

ALDRI kategoriser basert på:
❌ Utseende eller format
❌ Tilbudsstørrelse
❌ Ord som "BankID", "STOP", etc.
❌ Antagelser om "ser ut som..."

KUN kategoriser basert på:
✅ Hva du faktisk fant ved søk og verifisering
✅ Konkrete beviser for legitimitet eller svindel
✅ Når du ikke kan verifisere = suspicious (bedre trygt enn lei seg)

Andre tegn på svindel:
- Phishing/nettfiske forsøk
- Falske DNB-domener
- Sosial manipulering
- Hastepress
- Forespørsler om passord
- Mistenkelige lenker
- Kryptovaluta-svindel
- Investeringssvindel
- Teknisk support-svindel

🚨 OBLIGATORISK UTDANNINGSINNHOLD - BASERT PÅ VERIFISERING 🚨

ALLE RESPONSER MÅ INNEHOLDE DISSE FELTENE - INGEN UNNTAK!

OBLIGATORISK educationalContext MED ALLE 3 UNDERFELT:
- whyThisAssessment: PÅKREVD - Forklar NØYAKTIG hva du VERIFISERTE og hvorfor det førte til vurderingen
- commonLegitimateUse: PÅKREVD - Beskriv hvordan ekte aktører opererer (basert på generell kunnskap)
- keyDifference: PÅKREVD - Konkret forskjell mellom ekte og falsk i DENNE situasjonen

OBLIGATORISK verificationGuide MED ALLE 3 STEG:
- primaryCheck: PÅKREVD - Det viktigste å verifisere FØRST (spesifikt for denne situasjonen)
- independentVerification: PÅKREVD - Hvordan sjekke UAVHENGIG (ikke via lenker i meldingen)
- alternativeChannel: PÅKREVD - Andre sikre måter å få bekreftet informasjonen

OBLIGATORISK actionableSteps ARRAY MED 1-3 KONKRETE HANDLINGER:
- Erstatter "smart questions" som brukeren ikke kan svare på
- Gi ENKLE, KONKRETE steg brukeren kan gjøre
- Basert på denne SPESIFIKKE situasjonen
- Eksempler: "Ring direkte til...", "Logg inn på...", "Sjekk din..."

UTDANNINGSPRINSIPPER (OBLIGATORISK Å FØLGE):
- Baserér utdanning på hva du FAKTISK fant ved verifisering
- IKKE generiske råd, men spesifikt for dette tilfellet
- Fokuser på HANDLINGER brukeren kan ta
- Forklar HVORFOR noe kan være legitimt (ikke bare advare)

EKSEMPEL STRUKTUR SOM ALLTID MÅ FØLGES:
{
  "educationalContext": {
    "whyThisAssessment": "Jeg sjekket [spesifikke ting] og fant [konkrete resultater] som førte til denne vurderingen",
    "commonLegitimateUse": "Etablerte selskaper bruker ofte [spesifikke mønstre relevante for dette tilfellet]",
    "keyDifference": "I denne situasjonen kan du skille ekte fra falsk ved å [konkrete ting å se etter]"
  },
  "verificationGuide": {
    "primaryCheck": "Sjekk om du faktisk har konto/kundeforhold hos [spesifikk avsender]",
    "independentVerification": "Gå direkte til [spesifikk nettside/app] og logg inn der",
    "alternativeChannel": "Ring [type tjeneste] direkte via nummer fra deres offisielle nettside"
  },
  "actionableSteps": [
    "Konkret handling 1 tilpasset denne situasjonen",
    "Konkret handling 2 for å verifisere",
    "Konkret handling 3 hvis fortsatt usikker"
  ]
}

🔥 KRITISK VALIDERING - RESPONSEN ER UGYLDIG HVIS:
- educationalContext mangler NOEN av de 3 underfeltene
- verificationGuide mangler NOEN av de 3 stegene
- actionableSteps er tom eller mangler konkrete handlinger
- Noen av tekstene er tomme eller bare fyltekst

DISSE FELTENE ER IKKE VALGFRIE - DE ER ABSOLUTT PÅKREVDE!

Returner BARE følgende som gyldig JSON format (IKKE markdown, BARE JSON):
{
  "extractedText": "Den komplette teksten fra bildet",
  "category": "fraud|marketing|suspicious|safe",
  "riskLevel": "low|medium|high",
  "fraudProbability": 0-100,
  "mainIndicators": ["Verifisert: [konkrete funn]", "Søk: [hva jeg faktisk fant]"],
  "positiveIndicators": ["✅ Bekreftet: [spesifikke positive funn]"],
  "negativeIndicators": ["⚠️ Kunne ikke verifisere: [spesifikke mangler]"],
  "educationalContext": {
    "whyThisAssessment": "Basert på min verifisering fant jeg [konkrete funn] som førte til vurderingen",
    "commonLegitimateUse": "Etablerte selskaper opererer vanligvis ved å [relevante mønstre for dette tilfellet]",
    "keyDifference": "I denne situasjonen skiller du ekte fra falsk ved [konkrete forskjeller]"
  },
  "verificationGuide": {
    "primaryCheck": "Sjekk først [spesifikk ting relevant for dette tilfellet]",
    "independentVerification": "Verifiser uavhengig ved å [spesifikk metode for denne situasjonen]",
    "alternativeChannel": "Kontakt via [alternativ sikker kanal for denne typen tjeneste]"
  },
  "actionableSteps": [
    "Konkret handling 1 tilpasset denne situasjonen",
    "Konkret handling 2 for å verifisere",
    "Konkret handling 3 hvis fortsatt usikker"
  ],
  "recommendation": "Basert på min verifisering: [spesifikk anbefaling]",
  "summary": "Verifiserte [hva] og fant [konkrete resultater]",
  "urlsFound": ["hoveddomene.com", "redirect-domene.com (går til hoveddomene.com)"],
  "webSearchResults": {
    "domene.com": {
      "status": "legitimate|known_scam|suspicious|unknown",
      "findings": ["Det jeg FAKTISK fant ved søk", "Konkrete verifiseringsresultater"]
    }
  }
}`;


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const model = (formData.get('model') as string) || 'openai/gpt-4o-mini';

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Ingen bilde lastet opp' },
        { status: 400 }
      );
    }

    // Check if the model supports vision (handle :online suffix)
    const baseModel = model.replace(':online', '');
    if (!VISION_MODELS[baseModel as keyof typeof VISION_MODELS]) {
      // Fallback to GPT-4o-mini for vision tasks
      console.log(`Model ${baseModel} doesn't support vision, using gpt-4o-mini`);
    }

    // Convert image to base64 with enhanced format detection
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Enhanced MIME type detection for iPhone screenshots
    let mimeType = imageFile.type;
    const fileName = imageFile.name.toLowerCase();

    // Handle cases where browser doesn't detect HEIC correctly
    if (!mimeType || mimeType === 'application/octet-stream') {
      if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
        mimeType = 'image/heic';
      } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      } else if (fileName.endsWith('.png')) {
        mimeType = 'image/png';
      } else if (fileName.endsWith('.webp')) {
        mimeType = 'image/webp';
      } else {
        // Fallback - try to detect from file signature
        const signature = buffer.toString('hex', 0, 12);
        if (signature.startsWith('ffd8ff')) {
          mimeType = 'image/jpeg';
        } else if (signature.startsWith('89504e47')) {
          mimeType = 'image/png';
        } else if (signature.startsWith('52494646') && signature.includes('57454250')) {
          mimeType = 'image/webp';
        } else if (signature.includes('66747970686569') || signature.includes('66747970686963')) {
          mimeType = 'image/heic';
        } else {
          mimeType = 'image/jpeg'; // Safe fallback
        }
      }
    }

    console.log(`Processing image: ${imageFile.name}, detected type: ${mimeType}, size: ${(imageFile.size / 1024 / 1024).toFixed(2)}MB`);

    // Prepare the request to OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OpenRouter API key not configured');
      return NextResponse.json(
        {
          error: 'API ikke konfigurert',
          extractedText: '',
          category: 'error',
          fraudProbability: 50,
          riskLevel: 'medium',
          mainIndicators: ['Teknisk feil'],
          recommendation: 'Kunne ikke analysere bildet. Vær forsiktig og kontakt DNB på 915 04800 ved tvil.',
          summary: 'Teknisk feil - analyse ikke tilgjengelig'
        },
        { status: 500 }
      );
    }

    // Use the appropriate vision model with automatic :online for web search
    const visionModel = VISION_MODELS[baseModel as keyof typeof VISION_MODELS]
      ? (model.endsWith(':online') ? model : `${model}:online`)  // Always add :online for web search
      : 'openai/gpt-4o-mini:online';

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dnb-svindelsjekk.vercel.app',
        'X-Title': 'DNB Svindelsjekk'
      },
      body: JSON.stringify({
        model: visionModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: IMAGE_ANALYSIS_PROMPT
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!openRouterResponse.ok) {
      const error = await openRouterResponse.text();
      console.error('OpenRouter API error:', error);
      
      return NextResponse.json(
        {
          error: 'Kunne ikke analysere bildet',
          extractedText: '',
          category: 'error',
          fraudProbability: 50,
          riskLevel: 'medium',
          mainIndicators: ['AI-analyse feilet'],
          recommendation: 'Analyse feilet. Vær forsiktig og kontakt DNB på 915 04800 ved tvil.',
          summary: 'AI-analyse feilet - vær ekstra forsiktig'
        },
        { status: 500 }
      );
    }

    const aiResponse = await openRouterResponse.json();

    try {
      const result = JSON.parse(aiResponse.choices[0].message.content);

      // Debug: Log what educational fields we got from AI
      console.log('🔍 Educational Content Debug:', {
        hasEducationalContext: !!result.educationalContext,
        hasVerificationGuide: !!result.verificationGuide,
        hasSmartQuestions: !!result.smartQuestions,
        educationalFields: result.educationalContext ? Object.keys(result.educationalContext) : 'missing',
        questionCount: result.smartQuestions ? result.smartQuestions.length : 0
      });

      // Validate and ensure educational fields are present
      const fallbackEducation = generateFallbackEducation(
        result.category || 'suspicious',
        result.riskLevel || 'medium',
        result.mainIndicators || []
      );

      // Use AI response if complete, otherwise use fallback
      const educationalContext = (result.educationalContext?.whyThisAssessment &&
                                result.educationalContext?.commonLegitimateUse &&
                                result.educationalContext?.keyDifference)
                                ? result.educationalContext
                                : fallbackEducation.educationalContext;

      const verificationGuide = (result.verificationGuide?.primaryCheck &&
                               result.verificationGuide?.independentVerification &&
                               result.verificationGuide?.alternativeChannel)
                               ? result.verificationGuide
                               : fallbackEducation.verificationGuide;

      const smartQuestions = (result.smartQuestions && result.smartQuestions.length > 0 &&
                            result.smartQuestions[0]?.question && result.smartQuestions[0]?.whyAsking)
                            ? result.smartQuestions
                            : fallbackEducation.smartQuestions;

      console.log('✅ Final Educational Content:', {
        usingAIEducation: educationalContext === result.educationalContext,
        usingAIVerification: verificationGuide === result.verificationGuide,
        usingAIQuestions: smartQuestions === result.smartQuestions
      });

      // Return the simplified result from the :online vision model
      return NextResponse.json({
        extractedText: result.extractedText || '',
        category: result.category || 'suspicious',
        riskLevel: result.riskLevel || 'medium',
        fraudProbability: result.fraudProbability || 50,
        mainIndicators: result.mainIndicators || ['Bildeanalyse fullført'],
        positiveIndicators: result.positiveIndicators || [],
        negativeIndicators: result.negativeIndicators || [],
        educationalContext: educationalContext,
        verificationGuide: verificationGuide,
        smartQuestions: smartQuestions,
        recommendation: result.recommendation || 'Vær forsiktig og kontakt DNB på 915 04800 ved tvil.',
        summary: result.summary || 'Bildeanalyse gjennomført',
        urlsFound: result.urlsFound || [],
        webSearchResults: result.webSearchResults || {},
        model: visionModel
      });

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);

      return NextResponse.json({
        extractedText: aiResponse.choices[0]?.message?.content || '',
        category: 'error',
        riskLevel: 'medium',
        fraudProbability: 50,
        mainIndicators: ['Parsing feilet'],
        recommendation: 'Analysen ga ikke entydige resultater. Vær forsiktig og kontakt DNB på 915 04800 ved tvil.',
        summary: 'Analyse feilet - vær ekstra forsiktig',
        model: visionModel
      });
    }

  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Intern feil ved bildeanalyse',
        extractedText: '',
        category: 'safe',
        fraudProbability: 0,
        riskLevel: 'low',
        mainIndicators: [],
        recommendation: 'En teknisk feil oppstod. Prøv igjen.',
        summary: 'Teknisk feil'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check available vision models
export async function GET() {
  return NextResponse.json({
    availableModels: Object.keys(VISION_MODELS),
    defaultModel: 'openai/gpt-4o-mini'
  });
}