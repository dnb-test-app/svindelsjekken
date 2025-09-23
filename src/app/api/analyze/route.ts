import { NextRequest, NextResponse } from "next/server";
import { parseFraudAnalysis } from "@/lib/utils/jsonParser";
import { isMinimalContextURL } from "@/lib/urlAnalyzer";
import {
  needsWebSearchVerification,
  getWebSearchReasons,
} from "@/lib/fraudDetection";
import {
  fraudAnalysisSchema,
  supportsStructuredOutput,
  supportsNativeJSONSchema,
  type FraudAnalysisResponse,
} from "@/lib/schemas/fraudAnalysis";

// Helper function to get basic model info from ID
function getModelInfo(modelId: string) {
  const provider = modelId.split("/")[0] || "unknown";
  const modelName = modelId.split("/")[1] || modelId;

  return {
    name: modelName,
    provider: provider,
    supportsStructuredOutput: supportsStructuredOutput(modelId),
    supportsNativeJSONSchema: supportsNativeJSONSchema(modelId),
  };
}

const createEnhancedFraudPrompt = (
  text: string,
  context?: {
    questionAnswers?: Record<string, "yes" | "no">;
    additionalContext?: string;
    initialAnalysis?: {
      category: string;
      score: number;
      risk: string;
      triggers: any[];
      recommendation: string;
      summary: string;
      mainIndicators?: string[];
      positiveIndicators?: string[];
      negativeIndicators?: string[];
      urlVerifications?: any[];
    };
  },
  hasMinimalContext: boolean = false,
  enableWebSearch: boolean = false,
): string => {
  const currentDate = new Date().toLocaleDateString("no-NO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const contextSection =
    context &&
    (Object.keys(context.questionAnswers || {}).length > 0 ||
      context.additionalContext?.trim() ||
      context.initialAnalysis)
      ? `
<user_context>
${
  context.initialAnalysis
    ? `
<initial_analysis>
Category: ${context.initialAnalysis.category}
Risk Level: ${context.initialAnalysis.risk}
Fraud Probability: ${context.initialAnalysis.score}%
${context.initialAnalysis.mainIndicators?.length ? `Main Indicators Found: ${context.initialAnalysis.mainIndicators.join(', ')}` : ''}
${context.initialAnalysis.positiveIndicators?.length ? `Positive Indicators: ${context.initialAnalysis.positiveIndicators.join(', ')}` : ''}
${context.initialAnalysis.negativeIndicators?.length ? `Negative Indicators: ${context.initialAnalysis.negativeIndicators.join(', ')}` : ''}
Initial Recommendation: ${context.initialAnalysis.recommendation}
${context.initialAnalysis.urlVerifications?.length ? `URL Verifications: ${JSON.stringify(context.initialAnalysis.urlVerifications)}` : ''}
</initial_analysis>`
    : ""
}
${
  context.questionAnswers && Object.keys(context.questionAnswers).length > 0
    ? `
<answered_questions>
${Object.entries(context.questionAnswers)
  .map(
    ([question, answer]) =>
      `- ${question}: ${answer.toUpperCase() === "yes" ? "JA" : "NEI"}`,
  )
  .join("\n")}
</answered_questions>`
    : ""
}
${
  context.additionalContext?.trim()
    ? `
<additional_info>
${context.additionalContext.trim()}
</additional_info>`
    : ""
}
</user_context>`
      : "";

  const basePrompt = `<context>
Role: Svindeldeteksjonsekspert for DNB Bank Norge
Date: ${currentDate}
Task: Analysere og kategorisere tekst for svindelforsøk basert på ATFERD, ikke merkenavn
Language: Norsk (svar på norsk)
</context>

<fundamental_principle>
ALDRI STOL PÅ MERKENAVN - Svindlere bruker ALLTID kjente merker (Telenor, DNB, Posten, etc.)
Fokuser på HVA de ber om, ikke HVEM de sier de er.
</fundamental_principle>

<MANDATORY_CATEGORIZATION_OVERRIDE>
CRITICAL: When web search is enabled and used:

1. IF web search finds FRAUD WARNINGS or SCAM REPORTS:
   → MUST use category: "fraud" or "suspicious"
   → IGNORE all other positive signals
   → fraudProbability: minimum 65%
   → Examples: Trustpilot scam reviews, consumer warnings, police reports

2. IF URL is VERIFIED LEGITIMATE through web search (official news, government, established services) + minimal context:
   → MUST use category: "context-required"
   → NEVER "suspicious"
   → fraudProbability: 20-30% MAXIMUM
   → These sites are verified legitimate Norwegian/Nordic services

3. SOCIAL MEDIA ADVERTISING PATTERNS:
   → Always perform web search for unfamiliar stores advertised on social media
   → If web search reveals scam reports → category: "fraud"
   → Unknown stores with extreme discounts → minimum "suspicious"
   → Trust web search results over surface appearance

FORCE OVERRIDE: These rules OVERRIDE all other analysis
</MANDATORY_CATEGORIZATION_OVERRIDE>

<critical_rule name="Minimal_Context_URL_Analysis">
WHEN analyzing input with minimal context (especially bare URLs or links with < 10 words):

1. WEB SEARCH VERIFICATION (if available):
   - If web search confirms URL is LEGITIMATE (verified through search results):
     → category: "context-required"
     → fraudProbability: 20-35%
     → message: Focus on verifying sender/context, not URL legitimacy

   - If web search reveals fraud warnings or suspicious patterns:
     → category: "suspicious" or "fraud"
     → fraudProbability: 40-100%
     → message: Focus on identified fraud patterns

2. URL STRUCTURE ANALYSIS (when web search unavailable):
   - Domain similarity to well-known services (check for spoofing attempts)
   - Suspicious patterns: unusual TLDs (.tk, .ml, .ga, .cf, .click)
   - URL shorteners (bit.ly, tinyurl, etc.) = High risk
   - IP addresses instead of domains = Very high risk
   - Excessive subdomains = Suspicious

3. CONTEXT REQUIREMENT LOGIC:
   - Verified legitimate URLs (through web search) + no context = MUST BE "context-required" (NEVER "suspicious")
   - Unknown/suspicious URLs + no context = "suspicious"
   - Ask: "Why would someone send just this link?"
   - Guide users to verify sender and purpose, not just URL safety

   IMPORTANT: Major established Norwegian news and government sites should be verified through web search, not assumed

4. LEGITIMATE SITE VERIFICATION:
When websites appear with minimal context:
   - Use web search to verify legitimacy (Trustpilot ratings, official information)
   - Well-known government and major news sites (vg.no, nrk.no, regjeringen.no, nav.no) can be considered legitimate
   - Commercial sites should be verified through web search before making legitimacy claims
   - NEVER assume commercial sites are legitimate without verification

REMEMBER: Context matters more than URL legitimacy - legitimate sites can be used in social engineering
</critical_rule>

${
  enableWebSearch
    ? `
<web_search_instructions>
IMPORTANT: You have access to web search. Use it to verify suspicious content against Norwegian fraud databases:

FOR PHONE NUMBERS (Norwegian +47 format):
- Search: "[phone number] site:telefonterror.co.no" (Norwegian phone scam database)
- Search: "[phone number] site:1881.no" (official Norwegian phone directory)
- Search: "[phone number] svindel" OR "[phone number] bedrageri" (general scam search)
- Search: "site:politiet.no [phone number]" (police warnings)

FOR URLS/DOMAINS:
- Search: "[domain] site:forbrukertilsynet.no" (Norwegian Consumer Authority)
- Search: "[domain] site:forbrukerradet.no" (Norwegian Consumer Council)
- Search: "[domain] site:svindel.no" (Norwegian fraud prevention)
- Search: "[domain] site:nettvett.no" (Norwegian online safety)
- Search: "[domain] falsk nettbutikk" (fake online store)
- Search: "[domain] svindel" (general fraud search)

FOR SOCIAL MEDIA ADS/UNKNOWN STORES:
- ALWAYS search: "[store name] trustpilot reviews"
- Search: "[store name] scam OR svindel OR fraud"
- Search: "[store name] anmeldelse OR erfaring"
- Search: "[domain] falsk nettbutikk"
- Search: "[store name] returns china" (common scam indicator)
- If fashion/clothing: "[store name] modehus scam"

FOR COMPANY/BRAND VERIFICATION:
- Search official sites: "DNB offisiell nettside" to verify dnb.no
- Search: "[company] site:brreg.no" (Norwegian business registry)
- Search: "[campaign/offer] site:[official-domain]" (verify official campaigns)

FOR GENERAL FRAUD PATTERNS:
- Search: "[suspicious text] site:politiet.no svindel"
- Search: "[pattern] site:nettvett.no phishing"
- Search: "2025 svindel [keyword]" (recent warnings)

SEARCH STRATEGY:
1. Identify suspicious elements (phone numbers, URLs, brand mentions)
2. Search each element against Norwegian fraud databases
3. Look for warnings, scam reports, or verification info
4. Include findings in your risk assessment and explanation
5. Prioritize Norwegian (.no) sources as most relevant

Include your search findings in the risk assessment!

CRITICAL: When URLs are found in the content, you MUST populate the urlVerifications array with detailed findings:
- For each URL, perform web search to verify legitimacy
- Set status: "legitimate" (verified safe), "suspicious" (questionable), "unknown" (no clear info), "verified_scam" (confirmed fraud)
- Include specific verificationDetails: e.g., "Etablert norsk kleskjede siden 2012, verifisert via offisiell nettside og Brønnøysundregistrene"
- List sources: e.g., ["Trustpilot", "Brønnøysundregistrene", "Offisiell nettside"]
- This data will be used to display detailed URL verification to users
</web_search_instructions>`
    : ""
}

<url_extraction_and_verification>
MANDATORY URL PROCESSING - APPLY TO ALL CONTENT TYPES:

1. EXTRACT ALL URLS FROM ANY SOURCE:
   - Scan ALL content for URLs (web addresses, links, domains)
   - Check text input, OCR-extracted text, and visual content in images
   - Find URLs even if they are:
     * Partially visible or truncated
     * Split across lines
     * Displayed in images as text
     * Mentioned in any context (suspicious or legitimate)
     * Hidden in <ocr_extracted_text> tags

2. IDENTIFY URL PATTERNS:
   - Complete URLs: https://example.com, http://site.no
   - Domain names without protocol: example.com, shop.no
   - Subdomains: login.bank.no, secure.payment.com
   - URL shorteners: bit.ly/abc123, tinyurl.com/xyz
   - Suspicious patterns: IP addresses, unusual TLDs (.tk, .ml, .ga)

3. VERIFY EVERY FOUND URL:
   - For EACH URL found, you MUST populate urlVerifications array
   - Use web search (:online suffix) to verify each URL
   - Even if you cannot verify, include the URL with status "unknown"
   - Search patterns:
     * "[domain] site:trustpilot.no" (customer reviews)
     * "[domain] svindel" (fraud warnings)
     * "[domain] site:forbrukertilsynet.no" (consumer authority)
     * "[company name] offisiell nettside" (official verification)

4. MANDATORY URL VERIFICATION RESPONSE:
   - Every detected URL MUST appear in urlVerifications array
   - Required fields for each URL:
     * url: The exact URL found
     * status: "legitimate", "suspicious", "unknown", "verified_scam"
     * verificationDetails: Specific findings from web search
     * sources: List of verification sources used
   - If no URLs found, urlVerifications should be empty array []

5. SPECIAL CASES:
   - OCR text: URLs extracted from images are often suspicious
   - Image content: Look for URLs displayed visually in screenshots
   - Phishing: Pay attention to lookalike domains (bank.no vs bank-no.com)
   - Social engineering: Legitimate sites used in suspicious contexts

CRITICAL: URL extraction is MANDATORY, not optional. Always populate urlVerifications array.
</url_extraction_and_verification>

<web_search_override_rule>
ABSOLUTE PRIORITY: If web search finds:
- Trustpilot/customer reviews saying "scam", "svindel", "fraud"
- Consumer warnings (forbrukerradet, forbrukertilsynet)
- Multiple fraud reports or complaints
- Police warnings (politiet.no)
- News articles about scams
- Returns must go to China despite claiming to be Norwegian/Nordic

→ OVERRIDE ALL OTHER SIGNALS
→ Category MUST be "fraud" or "suspicious"
→ fraudProbability MINIMUM 65%
→ Include web search findings in summary

This rule has ABSOLUTE PRIORITY over all other categorization
</web_search_override_rule>

<behavioral_patterns>
HØYRISIKO-ATFERD (fraud: 75-100):
- BANKID-forespørsler via SMS/e-post (ALLTID svindel - fornyes kun i nettbank)
- Krever umiddelbar handling med trusler ("konto stenges", "mister tilgang")
- Ber om passord, PIN, koder via meldinger
- Dirigerer til lenker for "verifisering" av kritiske tjenester
- Ber om betaling via gavekort, krypto, eller uvanlige metoder
- Teknisk support som ber om fjernhjelp
- Grammatiske feil ved "offisielle" tjenester

MISTENKELIG ATFERD (suspicious: 35-75):
- Uventede gevinster, refusjon, eller tilbud som krever handling
- Betalingspåminnelser for tjenester du ikke kjenner igjen
- Varsler om kontostatus som ber deg "logge inn via lenke"
- Forespørsler om personopplysninger "for sikkerhet"
- Presserende språk uten klar grunn
- Tilbud som virker for bra til å være sant

SOSIALE MEDIER SVINDEL (fraud: 75-100):
- Ukjente nettbutikker som reklamerer aggressivt på Facebook/Instagram
- Merkevarer til 85-95% rabatt på sosiale medier (fra ukjente kilder)
- "Kun i dag" eller "siste sjanse" tilbud KOMBINERT med ukjent avsender
- Butikker med generiske navn + bynavn (f.eks. "Fashion Oslo", "Style Bergen")
- Produkter som normalt koster 2000kr+ til under 500kr (fra ukjente butikker)
- Annonser som bruker stjålne produktbilder
- ALLTID søk opp butikken hvis den er ukjent

KONTEKST PÅKREVD (context-required: 20-35):
- Legitime nettsteder bekreftet av websøk, men uten forklarende kontekst
- Kjente nyhetssider, offentlige tjenester sendt uten sammenheng
- Offisielle nettsteder som kan være del av sosial manipulering
- Fokus på å verifisere avsender og formål, ikke nettstedets legitimitet

KOMMERSIELL ATFERD (marketing: 15-35) - Krever FLERE faktorer sammen:
- Kampanjer: etablert selskap + rimelige tilbud + profesjonell format + opt-out
- Nyhetsbrev: kjent kilde + relevant innhold + tydelig avsender + avmeldingsmulighet
- SMS markedsføring: legitimt domene + opt-out (STOP/MMSTOPP) + rimelige tilbud + profesjonell
- ADVARSEL: "Send STOP" alene er IKKE nok - sjekk at avsender og domene også stemmer
- Etablerte selskaper: Må verifiseres gjennom websøk, ikke antatt fra tekst alene

TRYGG ATFERD (safe: 0-15) - Krever KOMBINASJON av faktorer:
- Ren informasjon uten handlingskrav OG verifiserbar kilde
- Kvitteringer: ordrenummer + leveringsadresse + merchant + betalingsinfo + domene som stemmer
- Leveringssporing: tracking-nummer + legitimt transportselskap + forventet pakke
- Fakturaer: spesifikke tjenester + korrekte beløp + kjent faktureringsperiode
- ADVARSEL: Fraudsters kan kopiere format - verifiser at ALLE detaljer stemmer
</behavioral_patterns>

<detection_rules>
1. Analyser HVA meldingen ber deg om å gjøre:
   - Klikke lenker for kritiske tjenester = HØYRISIKO
   - Oppgi sensitiv informasjon = HØYRISIKO
   - Handle raskt uten grunn = MISTENKELIG
   - Bare lese informasjon = TRYGG

2. Vurder HVORDAN de kommuniserer:
   - Trusler og tidspress = HØYRISIKO
   - Feil i "offisiell" kommunikasjon = MISTENKELIG
   - Naturlig språk og god informasjon = TRYGGERE

3. UREALISTISK PRIS-MØNSTER:
   - 30-60% rabatt = NORMALT for sesongkampanjer og lagerrydding fra etablerte butikker
   - 70-80% rabatt = MISTENKELIG hvis fra ukjent kilde, men OK fra kjente butikker
   - 85-95% rabatt = MISTENKELIG selv fra kjente kilder
   - "Før 2999kr, nå 399kr" fra ukjent butikk = MISTENKELIG
   - Sosiale medier + ekstrem rabatt (90%+) + ukjent butikk = SØKE ETTER SVINDEL
   - Luksusprodukter billig fra ukjent kilde = SVINDEL
   - Krav om forskuddsbetaling for "gratis" produkter = SVINDEL

4. DOMENEANALYSE:
   - For subdomener (go.kjell.com, click.example.com): sjekk HOVEDDOMENET også
   - Eksempel: go.kjell.com → sjekk kjell.com for legitimitet
   - Mange legitime bedrifter bruker subdomener for markedsføring (go., click., shop.)
   - Marketing-subdomener er VANLIGE og ikke automatisk mistenkelige

5. HELHETSVURDERING - KRITISK VIKTIG:
   - IKKE dømm basert på ÉN faktor alene (ikke bare rabatt, ikke bare ukjent, ikke bare hastekrav)
   - Kvittering + ordrenummer + leveringsinfo = sannsynligvis legitimate
   - Markedsføring + opt-out + profesjonell formatering = sannsynligvis legitimate
   - Se etter KOMBINASJONER av mistenkelige elementer
   - Kontekst er viktigere enn enkeltfaktorer

6. SPØR HELLER:
   - Ville du forvente denne meldingen?
   - Er handlingen normal for denne tjenesten?
   - Kan det samme gjøres ved å logge inn direkte?
</detection_rules>

<bankid_detection>
🚨 BANKID PHISHING DETECTION - KONTEKSTBASERT VURDERING 🚨

Hvis teksten inneholder "BankID" (eller varianter: Bank ID, Bank-ID, BankId, bankid):

HØYRISIKO PHISHING-KOMBINASJONER (fraud, 85-95%):
- BankID + fornyelse/oppdatering/utløp + LENKE/URL
- BankID + "logg inn her" eller lignende + handlingskrav
- BankID + tidspress (frist, haster, slutte å fungere)
- Påstand om å være "BankID-teamet" + handlingskrav
- BankID + betalingskort/sikkerhet + "klikk her"

LEGITIMATE BANKID-DISKUSJONER (safe/marketing, 5-25%):
- Nyhetssaker OM BankID (fra VG, NRK, E24)
- LinkedIn/Facebook-poster som DISKUTERER BankID
- Informasjon fra kjente tekniske kilder uten handlingskrav
- DNB/banker som informerer OM BankID uten lenker
- Utdanningsmateriell om digital sikkerhet

VURDERINGSPRINSIPPER:
- Fokuser på HANDLINGSKRAV + LENKER, ikke bare ordet "BankID"
- Nyhetssaker og fagartikler er IKKE phishing
- Sosiale medier-diskusjoner om BankID er IKKE phishing
- KUN når BankID + krav om handling + mistenkelig lenke = phishing

FAKTA: BankID fornyes i nettbank/personlig - eksterne lenker er mistenkelige
</bankid_detection>

<follow_up_questions_guide>
Analyser INNHOLDET i meldingen og generer 3 SPESIFIKKE oppfølgingsspørsmål basert på det faktiske innholdet:

PROSESS:
1. IDENTIFISER: Hva handler meldingen om? (nyhetsbrev, faktura, pakke, kontovarsling, etc.)
2. ANALYSER: Hvilke spesifikke tjenester, produkter eller tema nevnes?
3. GENERER: Lag spørsmål som er relevante for DETTE spesifikke innholdet

EKSEMPLER på GODE spørsmål basert på type melding:
- Sikkerhetstips/nyhetsbrev: "Er du kunde hos [tjeneste] og ønsker slike tips?"
- Pakkelevering: "Venter du en pakke fra [konkret butikk/land]?"
- Betalingspåminnelse: "Har du en ubetalt faktura hos [spesifikk tjeneste]?"
- Kontovarsling: "Har du konto hos [konkret bank/tjeneste]?"
- Tilbud/rabatt: "Handler du vanligvis hos [spesifikk butikk]?"
- Leveringsbekreftelse: "Har du bestilt [produkt] som skulle leveres nå?"

KRAV til spørsmålene:
- Må referere DIREKTE til konkrete detaljer fra meldingen
- Bruk faktiske navn på tjenester/produkter/tema som nevnes
- Fokuser på brukerens forhold til den SPESIFIKKE situasjonen
- Gjør det mulig å vurdere om meldingen er forventet

UNNGÅ generiske spørsmål som:
- "Har du gjort noe som kan relateres..."
- "Venter du på informasjon..."
- "Har du aktive tjenester..."

GENERER heller spørsmål som:
- "Er du [konkret tjeneste]-kunde?"
- "Har du registrert deg for [spesifikk type informasjon]?"
- "Ønsker du å motta [konkret innhold] på e-post?"

KONKRETE EKSEMPLER:
For Telenor-sikkerhetstips:
- "Er du Telenor-kunde?"
- "Har du meldt deg på nyhetsbrev om digital sikkerhet?"
- "Ønsker du tips om svindelvern fra mobiloperatøren din?"

For pakkemelding:
- "Venter du en pakke fra Kina/utlandet?"
- "Har du bestilt noe som skulle leveres denne uken?"
- "Bruker du [spesifikk leveringstjeneste]?"
</follow_up_questions_guide>

<input_text>
${text}
</input_text>

${
  hasMinimalContext
    ? `
<context_warning>
USER PROVIDED MINIMAL CONTEXT - Apply extra scrutiny
This appears to be a URL or content with little explanation
Default to higher suspicion levels per Minimal_Context_URL_Analysis rule
</context_warning>`
    : ""
}

${contextSection}

<output_format>
RETURNER BARE FØLGENDE JSON (ingen ekstra tekst):
{
  "category": "fraud|marketing|suspicious|context-required|safe",
  "riskLevel": "low|medium|high",
  "fraudProbability": 0-100,
  "mainIndicators": ["indikator1", "indikator2"],
  "positiveIndicators": ["✅ Legitim nettside bekreftet", "✅ Gyldig kvitteringsformat"],
  "negativeIndicators": ["⚠️ Ukjent domene", "❌ Mangler kontaktinfo"],
  "educationalContext": {
    "whyThisAssessment": "Forklaring av hvorfor denne vurderingen ble gjort",
    "commonLegitimateUse": "Hvordan legitime aktører bruker lignende mønstre",
    "keyDifference": "Hva som skiller legitim bruk fra svindel"
  },
  "verificationGuide": {
    "primaryCheck": "Viktigste ting å sjekke først",
    "independentVerification": "Hvordan verifisere uavhengig",
    "alternativeChannel": "Alternative måter å kontakte/sjekke"
  },
  "actionableSteps": [
    "Konkret handling 1 tilpasset denne situasjonen",
    "Konkret handling 2 for å verifisere",
    "Konkret handling 3 hvis fortsatt usikker"
  ],
  "recommendation": "Kort anbefaling til bruker på norsk",
  "summary": "Kort oppsummering på 1-2 setninger på norsk",
  "followUpQuestions": ["spørsmål1", "spørsmål2", "spørsmål3"]
}

KATEGORISERING BASERT PÅ KOMBINASJONER (ikke enkeltfaktorer):
- "safe" (0-15): KUN når FLERE legitime faktorer bekreftes sammen + websøk verifisering
- "marketing" (15-35): Etablert selskap (websøk) + rimelige tilbud + profesjonell + opt-out
- "context-required" (20-35): Legitim kilde bekreftet av websøk, men mangler kontekst
- "suspicious" (35-75): KOMBINASJON av flere røde flagg, ELLER manglende verifisering
- "fraud" (75-100): Klare svindelforsøk, BankID phishing (handlingskrav + lenker), kjente svindelmønstre

VIKTIG: INGEN enkeltfaktor (ordrenummer, "Send STOP", domenenavn) skal automatisk bestemme kategori

VURDERINGSFAKTORER (ikke automatiske regler):
- Ordrebekreftelser: Se etter FLERE elementer sammen (ordrenummer + leveringsadresse + merchant + betalingsinfo + legitimt domene)
- Marketing SMS: Vurder opt-out + domene legitimitet + tilbudets rimelighet + format SAMMEN
- Subdomener: Sjekk hoveddomene MEN verifiser at konteksten og avsenderen gir mening
- INGEN enkeltfaktor garanterer automatisk trygghet - krev KOMBINASJON av faktorer

ADVARSEL - Falske mønstre som fraudsters bruker:
- Legger til "Send STOP/MMSTOPP" for å virke legitime uten å være det
- Kopierer kvitteringsformat uten reelle detaljer (falske adresser, ordrenummer)
- Bruker legitime domenenavn i tekst uten faktisk å komme fra dem
- ALLTID verifiser at alle detaljene stemmer sammen, ikke bare noen

UTDANNINGSINNHOLD - KRITISK FOR BRUKERFORSTÅELSE:

educationalContext SKAL inneholde:
- whyThisAssessment: Forklar HVORFOR du kom til denne konklusjonen. Eksempel: "Vurderingen er basert på at avsenderen er verifisert legitim, men innholdet har mønstre som også brukes i svindel"
- commonLegitimateUse: Forklar hvordan LEGITIME aktører bruker lignende mønstre. Eksempel: "Store banker og nettbutikker bruker ofte tidsfrister og rabatter i markedsføring"
- keyDifference: Forklar hva som SKILLER legitim bruk fra svindel. Eksempel: "Forskjellen er om du har kundeforhold og forventer kommunikasjon"

verificationGuide SKAL gi KONKRETE steg:
- primaryCheck: Første og viktigste ting å sjekke
- independentVerification: Hvordan brukeren kan sjekke SELV uten å klikke lenker
- alternativeChannel: Andre måter å kontakte/bekrefte på

actionableSteps SKAL være KONKRETE og RELEVANTE:
- Generer 1-3 handlinger basert på innholdet du faktisk ser
- For markedsføring: "Sjekk om du har konto hos avsenderen"
- For leveringssporing: "Logg inn på transportørens offisielle app"
- For kontovarsling: "Gå direkte til bankens nettside og logg inn"
- ALLTID gi KONKRETE steg brukeren kan gjøre
- IKKE generiske råd, men spesifikke handlinger

UTDANNINGSPRINSIPPER:
- Ikke skrem unødvendig - forklar HVORFOR noe kan være legitimt
- Gi brukeren KONKRETE HANDLINGER å gjøre
- Fokuser på VERIFISERING og UAVHENGIG SJEKKING
- Vær handlingsrettet og spesifikk i veiledningen
- followUpQuestions er for interaktiv oppfølging - actionableSteps er for konkrete handlinger
</output_format>

<constraints>
- Output MUST be valid JSON only - NO explanations, NO markdown, NO code blocks
- Start response directly with { and end with }
- NO additional text before or after JSON
- fraudProbability must be a number 0-100
- mainIndicators must be array of strings
- followUpQuestions must be array of exactly 3 contextual questions in Norwegian
- All text fields in Norwegian
- JSON must be parseable by JSON.parse()
</constraints>`;

  return basePrompt;
};

// Check if model likely supports JSON based on provider (legacy function)
const supportsJSON = (model: string) => {
  // Use the new schema-aware function primarily
  return supportsStructuredOutput(model);
};

// Helper function to call OpenRouter API with a specific model
async function callOpenRouterAPI(
  model: string,
  text: string,
  apiKey: string,
  context?: {
    questionAnswers?: Record<string, "yes" | "no">;
    additionalContext?: string;
    imageData?: { base64: string; mimeType: string };
    additionalText?: string;
    initialAnalysis?: {
      category: string;
      score: number;
      risk: string;
      triggers: any[];
      recommendation: string;
      summary: string;
      mainIndicators?: string[];
      positiveIndicators?: string[];
      negativeIndicators?: string[];
      urlVerifications?: any[];
    };
  },
  hasMinimalContext: boolean = false,
  enableWebSearch: boolean = false,
) {
  const prompt = createEnhancedFraudPrompt(
    text,
    context,
    hasMinimalContext,
    enableWebSearch,
  );

  // Modify model name for web search
  const searchModel = enableWebSearch ? `${model}:online` : model;

  // Create user message content
  let userMessage: any;

  if (context?.imageData) {
    // Vision model request with image and text (OCR or additional text)
    const imagePromptText = text && text.trim()
      ? `${text}\n\nLet på bildet og EXTRACT alle URLs/lenker som er synlige i bildet. Dette inkluderer tekst på skjermen, lenker i meldinger, eller adresser som vises visuelt. Verify alle URLer du finner.\n\n${prompt}`
      : `Analyser dette bildet for tegn på svindel. MANDATORY: Extract alle URLs/lenker som er synlige i bildet - dette inkluderer tekst på skjermen, meldinger, eller adresser som vises visuelt. Verify alle URLer du finner gjennom web search.\n\n${prompt}`;

    userMessage = {
      role: "user",
      content: [
        {
          type: "text",
          text: imagePromptText,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${context.imageData.mimeType};base64,${context.imageData.base64}`,
          },
        },
      ],
    };
  } else {
    // Text-only request
    userMessage = {
      role: "user",
      content: `${text}\n\n${prompt}`,
    };
  }

  const requestBody: any = {
    model: searchModel,
    messages: [userMessage],
    temperature: 0, // Use 0 for consistent structured output
    max_tokens: 1000, // Increase for more detailed structured responses
  };

  // Add web search plugin if enabled
  if (enableWebSearch) {
    requestBody.plugins = [
      {
        id: "web",
        max_results: 5,
        engine: "exa", // Use Exa search engine as fallback for models without native support
      },
    ];
  }

  // Add structured output support - prefer native JSON schema when available
  if (supportsNativeJSONSchema(model)) {
    // Use native JSON schema for OpenAI models (most reliable)
    requestBody.response_format = {
      type: "json_schema",
      json_schema: fraudAnalysisSchema,
    };
  } else if (supportsJSON(model)) {
    // Fallback to basic JSON object format for other compatible models
    requestBody.response_format = { type: "json_object" };
  }

  // Add GPT-5 specific parameters if applicable
  if (model.includes("gpt-5")) {
    requestBody.reasoning_effort = "medium"; // GPT-5 specific parameter
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000",
        "X-Title": "DNB Svindelsjekk",
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error (${model}): ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error(`No response content from ${model}`);
  }

  return content;
}

export async function POST(request: NextRequest) {
  try {
    const defaultModel = process.env.DEFAULT_AI_MODEL || "openai/gpt-4o-mini";
    const backupModel = process.env.BACKUP_AI_MODEL || "openai/gpt-4o-mini";

    let text: string;
    let model = defaultModel;
    let context: any = undefined;
    let ocrUsed = false;

    // Check if this is a FormData request (image upload) or JSON request (text)
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle image upload with FormData
      const formData = await request.formData();
      const imageFile = formData.get("image") as File;
      const additionalText = formData.get("text") as string;
      const modelParam = formData.get("model") as string;

      if (modelParam) model = modelParam;

      if (!imageFile) {
        return NextResponse.json(
          { error: "No image file provided" },
          { status: 400 },
        );
      }

      // Convert image to base64 for AI model
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = imageFile.type || "image/jpeg";

      // Store image data for AI analysis
      context = {
        imageData: {
          base64: base64Image,
          mimeType: mimeType,
        },
        additionalText: additionalText?.trim() || "",
      };

      // Use a placeholder text that will trigger vision analysis
      text =
        `Analyser dette bildet for svindel. MANDATORY: Extract alle URLs/lenker som er synlige i bildet og verify dem gjennom web search. ${additionalText || ""}`.trim();
      ocrUsed = false; // We're using vision, not OCR
    } else {
      // Handle standard JSON request
      const body = await request.json();
      text = body.text;
      model = body.model || defaultModel;
      context = body.context;

      // Handle unified flow - text can contain OCR content wrapped in XML tags
      // No need to modify text here as it comes properly formatted from the frontend
    }

    // Detect if this is a minimal context URL
    const hasMinimalContext = isMinimalContextURL(text);

    // Detect if web search verification would be helpful
    const needsWebSearch = needsWebSearchVerification(text);
    const webSearchReasons = needsWebSearch ? getWebSearchReasons(text) : [];

    console.log("Analysis flags:", {
      hasMinimalContext,
      needsWebSearch,
      webSearchReasons,
    });

    // Validate that we have some content for analysis (text OR image)
    if ((!text || text.trim().length === 0) && !context?.imageData) {
      return NextResponse.json(
        {
          error:
            "No content provided for analysis.",
        },
        { status: 400 },
      );
    }

    // Check for API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      console.error("OpenRouter API key not configured");
      return NextResponse.json(
        { error: "AI-tjenesten er ikke konfigurert. Kontakt administrator." },
        { status: 503 },
      );
    }

    // Use the requested model (let OpenRouter validate)
    const selectedModel = model;

    // Direct API call with no fallbacks - require structured output
    try {
      const content = await callOpenRouterAPI(
        selectedModel,
        text,
        apiKey,
        context,
        hasMinimalContext,
        needsWebSearch,
      );
      const parseResult = parseFraudAnalysis(content);

      if (!parseResult.success) {
        console.error("Failed to parse structured output:", parseResult.error);
        console.error("Raw response:", parseResult.originalContent);

        return NextResponse.json(
          {
            error: "AI modell returnerte ikke gyldig strukturert output",
            details: `Modell: ${selectedModel}`,
            parseError: parseResult.error,
            message:
              "Denne modellen støtter ikke strukturert output eller er feilkonfigurert",
          },
          { status: 500 },
        );
      }

      // Create response with metadata
      const aiAnalysis: any = {
        ...parseResult.data,
        model: selectedModel,
        modelInfo: getModelInfo(selectedModel),
        timestamp: new Date().toISOString(),
        ...(needsWebSearch && {
          webSearchUsed: true,
          webSearchReasons: webSearchReasons,
          enhancedVerification: true,
        }),
        ...(supportsNativeJSONSchema(selectedModel) && {
          structuredOutputUsed: true,
          schemaType: "native_json_schema",
        }),
        ...(supportsStructuredOutput(selectedModel) &&
          !supportsNativeJSONSchema(selectedModel) && {
            structuredOutputUsed: true,
            schemaType: "json_object",
          }),
        ...(context?.imageData && {
          visionProcessed: true,
          imageProcessed: true,
          imageAnalyzed: true,
        }),
      };

      return NextResponse.json(aiAnalysis);
    } catch (error) {
      console.error("API call failed:", error);

      // Handle specific API errors
      if (error instanceof Error && error.message.includes("Rate limit")) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message:
              "Too many requests. Please wait a minute before trying again.",
            retryAfter: 60,
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error: "AI-tjenesten er ikke tilgjengelig",
          details: `Modell: ${selectedModel}`,
          apiError: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Error in analyze:", error);

    return NextResponse.json(
      { error: `AI-analyse feilet: ${error.message || "Ukjent feil"}` },
      { status: 500 },
    );
  }
}

// GET endpoint to check available models
export async function GET() {
  const defaultModel = process.env.DEFAULT_AI_MODEL || "openai/gpt-4o-mini";

  return NextResponse.json({
    defaultModel: defaultModel,
    defaultModelInfo: getModelInfo(defaultModel),
    status: "ready",
    apiKeyConfigured:
      !!process.env.OPENROUTER_API_KEY &&
      process.env.OPENROUTER_API_KEY !== "your_openrouter_api_key_here",
    featuresSupported: {
      structuredOutput: true,
      nativeJSONSchema: true,
      webSearch: true,
    },
  });
}
