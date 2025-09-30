/**
 * Behavioral Patterns Section
 * Defines behavior patterns and categorization guidelines for fraud detection
 */

export function getBehavioralPatterns(): string {
  return `<behavioral_patterns>
HØYRISIKO-ATFERD (fraud: 75-100):
- BANKID-forespørsler via SMS/e-post (ALLTID svindel - fornyes kun i nettbank)
- Krever umiddelbar handling med trusler ("konto stenges", "mister tilgang")
- Ber om passord, PIN, koder via meldinger
- Dirigerer til lenker for "verifisering" av kritiske tjenester
- LINK MISDIRECTION: Text shows legitimate site name but actual link goes elsewhere
- DISPLAY-DESTINATION MISMATCH: Link text suggests one site, URL points to another
- Ber om betaling via gavekort, krypto, eller uvanlige metoder
- Teknisk support som ber om fjernhjelp
- Grammatiske feil ved "offisielle" tjenester

MISTENKELIG ATFERD (context-required: 35-75):
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

LEGITIM MARKEDSFØRING (må ha ALLE disse):
1. VERIFISERT AVSENDER:
   - Kjent merkevare verifisert gjennom websøk (offisielle nettsider, Brønnøysund)
   - Etablert selskap med dokumentert historikk
   - Matching mellom avsendernavn og domene

2. PROFESJONELL KVALITET:
   - Korrekt norsk/engelsk uten grammatiske feil
   - Profesjonell formatering og design
   - Klar kontaktinformasjon og kundeservice

3. RIMELIGE TILBUD:
   - Rabatter innenfor normale grenser (5-60%)
   - Ikke ekstreme "90% rabatt" løfter
   - Realistiske priser sammenlignet med markedet

4. OPT-OUT MULIGHETER:
   - Tydelig avmeldingslink eller "Send STOP"
   - Respekterer tidligere opt-out forespørsler
   - Følger norsk markedsføringslov

5. RELEVANT INNHOLD:
   - Tilbud som passer mottakerens interesser
   - Sesongbaserte kampanjer (Black Friday, salg)
   - Produkter/tjenester som gir mening

ADVARSEL - Røde flagg som HINDRER marketing-kategorisering:
- Ukjent avsender med store rabatter (85%+)
- Håndteringsgebyr eller "gratis" produkter med skjulte kostnader
- Krav om umiddelbar handling ("kun i dag")
- Manglende kontaktinformasjon eller kundeservice
- Domener som ikke matcher bedriftsnavn
- Ekstremt gode tilbud fra ukjente kilder

TRYGG ATFERD (info: 0-15) - Krever KOMBINASJON av faktorer:
- Ren informasjon uten handlingskrav OG verifiserbar kilde
- Kvitteringer: ordrenummer + leveringsadresse + merchant + betalingsinfo + domene som stemmer
- Leveringssporing: tracking-nummer + legitimt transportselskap + forventet pakke
- Fakturaer: spesifikke tjenester + korrekte beløp + kjent faktureringsperiode
- ADVARSEL: Fraudsters kan kopiere format - verifiser at ALLE detaljer stemmer
</behavioral_patterns>`;
}

export function getDetectionRules(): string {
  return `<detection_rules>
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
</detection_rules>`;
}

export function getCategorizationOverride(): string {
  return `<MANDATORY_CATEGORIZATION_OVERRIDE>
⚠️ CRITICAL: RULE HIERARCHY - MUST FOLLOW THIS PRIORITY ORDER:

PRIORITY 1 - CRITICAL FRAUD PATTERNS (HIGHEST - OVERRIDES EVERYTHING):
───────────────────────────────────────────────────────────────────────
IF message contains critical fraud patterns:
- BankID + renewal/forny + time pressure + threats
- Bank + urgent account warnings + immediate action required + links
- Password/credential requests via email/SMS

→ MUST use category: "fraud"
→ fraudProbability: 85-100%
→ IGNORE all other signals (including URL legitimacy)
→ Critical patterns ALWAYS indicate fraud

⚠️ IMPORTANT: Even if URLs are legitimate (bankid.no, dnb.no), the presence
of critical fraud patterns makes the message fraud. Scammers use real URLs!

PRIORITY 2 - WEB SEARCH FRAUD WARNINGS:
───────────────────────────────────────────────────────────────────────
IF web search finds FRAUD WARNINGS or SCAM REPORTS:
→ MUST use category: "fraud"
→ IGNORE all other positive signals
→ fraudProbability: minimum 65%
→ Examples: Trustpilot scam reviews, consumer warnings, police reports

PRIORITY 3 - URL LEGITIMACY (ONLY applies if NO critical patterns):
───────────────────────────────────────────────────────────────────────
IF URL is VERIFIED LEGITIMATE through web search + NO critical fraud patterns:
→ Informational news/government content = "info"
→ Commercial/marketing content = "marketing"
→ Minimal context without clear purpose = "context-required"
→ fraudProbability: 20-30% MAXIMUM

⚠️ BUT: URL legitimacy is IGNORED if critical fraud patterns are present

PRIORITY 4 - SOCIAL MEDIA ADVERTISING:
───────────────────────────────────────────────────────────────────────
→ Always perform web search for unfamiliar stores advertised on social media
→ If web search reveals scam reports → category: "fraud"
→ Unknown stores with extreme discounts → minimum "context-required"
→ Trust web search results over surface appearance

ENFORCEMENT ORDER:
1. Check critical fraud patterns FIRST
2. If critical patterns found → "fraud" (STOP)
3. If no critical patterns → Continue to web search verification
4. Apply URL legitimacy rules (only if no critical patterns)

</MANDATORY_CATEGORIZATION_OVERRIDE>

<web_search_override_rule>
ABSOLUTE PRIORITY: If web search finds:
- Trustpilot/customer reviews saying "scam", "svindel", "fraud"
- Consumer warnings (forbrukerradet, forbrukertilsynet)
- Multiple fraud reports or complaints
- Police warnings (politiet.no)
- News articles about scams
- Returns must go to China despite claiming to be Norwegian/Nordic

→ OVERRIDE ALL OTHER SIGNALS
→ Category MUST be "fraud"
→ fraudProbability MINIMUM 65%
→ Include web search findings in summary

This rule has ABSOLUTE PRIORITY over all other categorization
</web_search_override_rule>`;
}