/**
 * Output Format Section
 * Defines the JSON output structure and response guidelines
 */

export function getOutputFormat(isRefinement: boolean): string {
  const categorization = getCategorization(isRefinement);

  return `<output_format>
RETURNER BARE FØLGENDE JSON (ingen ekstra tekst):
{
  "category": "${isRefinement ? "fraud|marketing|info" : "fraud|marketing|context-required|info"}",
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
  "followUpQuestions": [
    {
      "question": "Spørsmålstekst på norsk",
      "type": "yes-no",
      "options": []
    },
    {
      "question": "Spørsmålstekst på norsk",
      "type": "multiple-choice",
      "options": [
        {"value": "option1", "label": "Alternativ 1", "emoji": "📱"},
        {"value": "option2", "label": "Alternativ 2", "emoji": "💻"}
      ]
    },
    {
      "question": "Spørsmålstekst på norsk",
      "type": "yes-no",
      "options": []
    }
  ]
}

${categorization}

VIKTIG: INGEN enkeltfaktor (ordrenummer, "Send STOP", domenenavn) skal automatisk bestemme kategori

VURDERINGSFAKTORER (ikke automatiske regler):
- Ordrebekreftelser: Se etter FLERE elementer sammen (ordrenummer + leveringsadresse + merchant + betalingsinfo + legitimt domene)
- Marketing SMS: Vurder opt-out + domene legitimitet + tilbudets rimelighet + format SAMMEN
- Subdomener: Sjekk hoveddomene MEN verifiser at konteksten og avsenderen gir mening
- INGEN enkeltfaktor garanterer automatisk legitimitet - krev KOMBINASJON av faktorer

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
⚠️ CRITICAL: NEVER include specific URLs from the message in actionableSteps
- ❌ BAD: "Ikke klikk på https://bankid.no/forny eller svar på meldingen"
- ✅ GOOD: "Ikke klikk på lenker i meldingen og svar ikke på forespørselen"
- ❌ BAD: "Ikke besøk example.com/phishing"
- ✅ GOOD: "Ikke klikk på lenker i meldingen"
- RULE: Use generic language "lenker i meldingen" instead of specific URLs
- REASON: Prevents accidental clicks and keeps advice universal

- Generer 1-3 handlinger basert på innholdet du faktisk ser
- For markedsføring: "Sjekk om du har konto hos avsenderen"
- For leveringssporing: "Logg inn på transportørens offisielle app"
- For kontovarsling: "Gå direkte til bankens nettside og logg inn"
- ALLTID gi KONKRETE steg brukeren kan gjøre
- IKKE generiske råd, men spesifikke handlinger

UTDANNINGSPRINSIPPER:
- Ikke skrem unødvendig - forklar HVORFOR noe kan være legitimt
- Gi brukeren KONKRETE HANDLINGER å gjøre

📚 LINK SAFETY EDUCATION - INFORMATIV VEILEDNING:
Hjelp brukere å forstå at:
- "Lenketekst kan være forskjellig fra faktisk destinasjon"
- "Det er normalt å dobbeltsjekke hvor lenker faktisk leder"
- "Du kan se faktisk URL ved å holde musepekeren over lenken"
- "Tryggeste metode: Gå direkte til kjente nettsider ved å skrive adressen"
- "Nettlesere viser faktisk destinasjon nederst når du holder over lenker"
- Fokuser på VERIFISERING og UAVHENGIG SJEKKING
- Vær handlingsrettet og spesifikk i veiledningen
- followUpQuestions er for interaktiv oppfølging - actionableSteps er for konkrete handlinger
</output_format>`;
}

function getCategorization(isRefinement: boolean): string {
  let categorization = `KATEGORISERING BASERT PÅ KOMBINASJONER (ikke enkeltfaktorer):
- "info" (0-15): Verified legitimate URLs (news sites, government, established services) + informational content
- "marketing" (15-35): Etablert selskap (websøk) + rimelige tilbud + profesjonell + opt-out + commercial content`;

  if (!isRefinement) {
    categorization += `\n- "context-required" (20-75): Legitim kilde bekreftet av websøk men mangler kontekst, ELLER kombinasjon av flere røde flagg/manglende verifisering`;
  }

  categorization += `\n- "fraud" (75-100): Klare svindelforsøk, BankID phishing (handlingskrav + lenker), kjente svindelmønstre`;

  if (isRefinement) {
    categorization += `\n\nREFINEMENT SPECIAL RULES:
- Since context has been provided, you MUST choose between fraud, marketing, or info
- Use the initial analysis as baseline and adjust based on new context

⚠️ CRITICAL: URL LEGITIMACY DOES NOT OVERRIDE FRAUD PATTERNS
═══════════════════════════════════════════════════════════════
IMPORTANT: Legitimate URLs (bankid.no, dnb.no, etc.) appearing in messages
DO NOT automatically make the message legitimate. Scammers often use real URLs
to appear credible while executing fraud.

RULE PRIORITY (MUST FOLLOW THIS ORDER):
1. ⚠️ FIRST: Check for critical fraud patterns (BankID renewal, urgent threats)
   → If found = category "fraud" (STOP - do not proceed to URL verification)

2. 🔍 SECOND: Check URL legitimacy (only if no critical patterns)
   → Legitimate URLs in informational context = "info"
   → Legitimate URLs in commercial context = "marketing"

VERIFIED LEGITIMATE URL GUIDELINES (applies ONLY when NO critical patterns detected):
- Legitimate news/government sites with informational content = "info"
  Examples: vg.no, nrk.no, regjeringen.no (pure news/information)

- Legitimate commercial sites with marketing content = "marketing"
  Examples: Established stores sending newsletters, promotions

⚠️ BUT if legitimate URL appears with:
- BankID + renewal/update requests + pressure = FRAUD
- Bank warnings + urgent threats + links = FRAUD
- Password/credential requests = FRAUD

SENDER CONTEXT vs URL LEGITIMACY:
- Legitimate URL + informational news content = "info"
- Legitimate URL + commercial/marketing = "marketing"
- Legitimate URL + critical fraud patterns = "fraud" (patterns override URL)
- Unknown sender + legitimate URL + no context = "context-required"

- If still uncertain between categories AND no critical patterns, prefer safer option`;
  }

  return categorization;
}

export function getPreResponseValidation(): string {
  return `<pre_response_validation>
⚠️ MANDATORY CHECKS BEFORE RESPONDING - MUST VALIDATE:

1. URL EXTRACTION CHECK:
   Question: Did I scan the input for ANY URLs, domains, or web addresses?
   Answer: □ YES / □ NO (must be YES)

2. URL DETECTION CHECK:
   Question: Did I find ANY URLs in the input (text, OCR, or image)?
   Answer: □ YES / □ NO

3. URL VERIFICATION ARRAY CHECK (CRITICAL):
   IF answered YES to question #2:
   → Question: Is my urlVerifications array populated with those URLs?
   → Answer: □ YES / □ NO (MUST be YES)
   → If NO: STOP and go back to extract the URLs before responding

4. VALIDATION RULE:
   ✅ CORRECT: Found URLs → urlVerifications has entries
   ✅ CORRECT: No URLs found → urlVerifications: []
   ❌ ERROR: Found URLs → urlVerifications: [] (THIS IS FORBIDDEN)

If validation fails, DO NOT RESPOND. Extract the URLs first, then respond.
</pre_response_validation>`;
}

export function getConstraints(): string {
  return `<constraints>
- Output MUST be valid JSON only - NO explanations, NO markdown, NO code blocks
- Start response directly with { and end with }
- NO additional text before or after JSON
- fraudProbability must be a number 0-100
- mainIndicators must be array of strings
- followUpQuestions must be array of exactly 3 contextual questions in Norwegian
- All text fields in Norwegian
- JSON must be parseable by JSON.parse()
- urlVerifications array MUST be populated if URLs were found in input (see pre_response_validation above)
</constraints>`;
}

export function getRefinementRules(): string {
  return `<refinement_rules>
CRITICAL: This is a REFINED analysis with context provided by the user.
You MUST choose a definitive category: fraud, marketing, or info.
DO NOT use "context-required" - the user has already provided context.
Base your decision on the combined initial analysis and new context provided.
</refinement_rules>`;
}