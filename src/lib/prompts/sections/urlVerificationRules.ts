/**
 * URL Verification Rules
 * Comprehensive rules for URL extraction, verification, and phishing detection
 */

export function getUrlExtractionRules(): string {
  return `<critical_rule name="URL_Extraction_Mandatory">
⚠️ ABSOLUTE REQUIREMENT - URLs MUST BE EXTRACTED AND VERIFIED:

IF input contains ANY URL pattern (https://, http://, domain.com, www.site.no, etc.):
→ urlVerifications array MUST NOT be empty
→ EVERY unique domain found MUST appear in urlVerifications
→ Even if web search finds nothing, include URL with status "unknown"
→ This applies to URLs in text input, OCR-extracted text, and images

EXTRACTION EXAMPLES (YOU MUST FOLLOW THIS PATTERN):

Example 1 - URL in text:
Input: "Visit https://sparebank1.no/login to update BankID"
REQUIRED: urlVerifications: [{
  url: "sparebank1.no",
  status: "legitimate" or "verified_scam" or "unknown",
  verificationDetails: "Brief findings from web search"
}]

Example 2 - URL without protocol:
Input: "Besøk www.holzweiler.com for ny kolleksjon"
REQUIRED: urlVerifications: [{
  url: "holzweiler.com",
  status: "unknown",
  verificationDetails: "Ingen relevante treff i norske kilder" or actual findings
}]

Example 3 - Multiple URLs:
Input: "Click dnb.no or sparebank1.no"
REQUIRED: urlVerifications: [
  { url: "dnb.no", status: "legitimate", verificationDetails: "..." },
  { url: "sparebank1.no", status: "legitimate", verificationDetails: "..." }
]

❌ FORBIDDEN (WILL CAUSE VALIDATION ERROR):
Input: "Click https://suspicious-bank.tk"
Output: { ..., urlVerifications: [] }  ← WRONG! URL not extracted!

✅ CORRECT:
Input: "Click https://suspicious-bank.tk"
Output: { ..., urlVerifications: [{ url: "suspicious-bank.tk", status: "unknown", verificationDetails: "..." }] }

VALIDATION RULE:
- If you found ANY URL → urlVerifications CANNOT be empty array
- If NO URLs exist in input → urlVerifications: []
- This is NON-NEGOTIABLE and will be strictly validated
</critical_rule>`;
}

export function getMinimalContextUrlRules(): string {
  return `<critical_rule name="Minimal_Context_URL_Analysis">
WHEN analyzing input with minimal context (especially bare URLs or links with < 10 words):

1. DEFAULT STANCE: Treat with elevated suspicion
   - Never assume safety without context
   - Minimum risk level: "medium" (never "low" for bare URLs)
   - For bare URLs: fraudProbability minimum 40%

2. URL STRUCTURE ANALYSIS:
   - Domain similarity to legitimate services (dnb.no, bankid.no, vipps.no)
   - Suspicious patterns: unusual TLDs (.tk, .ml, .ga, .cf, .click)
   - URL shorteners (bit.ly, tinyurl, etc.) = automatic "suspicious" minimum
   - Typosquatting attempts (dnb-no.com, dnb.com.no) = "fraud"
   - IP addresses instead of domains = high risk
   - Excessive subdomains = suspicious

3. RESPONSE GUIDANCE:
   - Always recommend: "Verifiser hvem som sendte lenken"
   - Include: "Aldri klikk på lenker du er usikker på"
   - Ask: "Hvor fikk du denne lenken fra?"

4. BALANCE: Maintain normal analysis for text with URLs that have rich context (>10 words)
5. REMEMBER: Most fraud attempts lack context or rush the user

CONTEXT REQUIREMENT LOGIC:
- Verified legitimate URLs (through web search) + no context = MUST BE "context-required"
- Unknown/suspicious URLs + no context = "context-required"
- Ask: "Why would someone send just this link?"
- Guide users to verify sender and purpose, not just URL safety

IMPORTANT: Major established Norwegian news and government sites should be verified through web search, not assumed

VERIFIED DOMAIN PRIORITY RULES:
HØYEST PRIORITET - Norske offentlige tjenester (info/marketing max):
   - regjeringen.no, nav.no, skatteetaten.no, altinn.no
   - kommune.no-domener (oslo.no, bergen.no, etc.)
   - helsenorge.no, fhi.no, politiet.no
   - Disse er ALLTID legitime - fokuser på sender og kontekst

HØY PRIORITET - Etablerte norske medier og banker (info/marketing max):
   - nrk.no, vg.no, dagbladet.no, aftenposten.no, e24.no
   - dnb.no, nordea.no, sparebank1.no, handelsbanken.no
   - telenor.no, telia.no, ice.no
   - Verifiser at URL og avsender matcher

MEDIUM PRIORITET - Store internasjonale tjenester (context-required hvis uklar kontekst):
   - google.com, microsoft.com, apple.com, amazon.com
   - facebook.com, linkedin.com, twitter.com, instagram.com
   - paypal.com, stripe.com, klarna.com, vipps.no
   - Legitime, men kan brukes i phishing - sjekk kontekst nøye

LAV PRIORITET - Kommersielle domener (krev full verifisering):
   - Ukjente .com/.no/.org domener
   - Nye selskaper uten etablert historie
   - Sosiale medier annonser fra ukjente butikker
   - ALLTID websøk: Brønnøysund, Trustpilot, kunde anmeldelser

RØDE FLAGG - Automatisk mistenkelige domener:
   - IP-adresser istedenfor domenenavn
   - Mistenkelige TLD (.tk, .ml, .ga, .cf, .click)
   - URL-forkortere (bit.ly, tinyurl.com, etc.)
   - Typosquatting (drnb.no, teelnor.no, etc.)

VERIFISERINGSHIERARKI:
1. Offentlige norske tjenester → Automatisk legitime
2. Etablerte norske selskaper → Websøk bekreftelse
3. Store internasjonale → Kontekstsjekk påkrevd
4. Ukjente kommersielle → Full verifisering nødvendig
5. Mistenkelige mønstre → Høy risikovurdering

REMEMBER: Context matters more than URL legitimacy - legitimate sites can be used in social engineering
</critical_rule>`;
}

export function getUrlProcessingInstructions(): string {
  return `<url_extraction_and_verification>
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

⚠️ CRITICAL: URL DISPLAY vs DESTINATION MISMATCH (Common Phishing Tactic):
   - DISPLAYED TEXT ≠ ACTUAL LINK: Text may claim "dnb.no" but actual URL could be "dnb-login.scam.tk"
   - VERIFY BOTH DISPLAY AND DESTINATION: Check what's shown AND where it actually leads
   - COMMON PHISHING TECHNIQUES:
     * Link text says "dnb.no" but HTML href attribute shows different domain
     * "Visit DNB here" text masks destination like "evil-phishing-site.com"
     * Email displays "www.bankid.no" but link goes to "bankid-verify.tk"
     * Screenshot shows legitimate URL in browser bar but OCR finds different URLs in page content
   - IN SCREENSHOTS: Images may show misleading link text or fake URL bars
   - MANDATORY CHECK: When you find URL text that differs from actual destination:
     * Immediately flag this as HIGH RISK phishing indicator
     * Add explicit warning in verificationDetails about the mismatch
     * Example: "⚠️ ADVARSEL: Lenketekst viser 'dnb.no' men faktisk URL er 'dnb-phishing.tk' - KLASSISK SVINDEL"
   - ANALYSIS PRINCIPLE: NEVER assume link safety based solely on displayed text
   - USER WARNING: Users MUST be told when link text doesn't match actual destination

3. VERIFY EVERY FOUND URL:
   - For EACH URL found, you MUST populate urlVerifications array
   - Web search is ENABLED - you have access to current information
   - Even if you cannot verify, include the URL with status "unknown"
   - Recommended searches to perform:
     * "[domain] site:trustpilot.no" (customer reviews)
     * "[domain] svindel" (fraud warnings)
     * "[domain] site:forbrukertilsynet.no" (consumer authority)
     * "[company name] offisiell nettside" (official verification)

   ⚠️ CRITICAL WEB SEARCH REQUIREMENTS:
   - REPORT ACTUAL SEARCH FINDINGS, not generic advice
   - If search finds information: Report the specific findings concisely
   - If search finds nothing useful: Say "Ingen relevante treff i norske kilder"
   - NEVER give users a list of resources to check themselves - YOU have already searched
   - NEVER say "Anbefalt: søk etter..." or provide links to search tools
   - NEVER include URLs to search engines or advice sites in verificationDetails
   - Example BAD response: "Ingen spesifikke svindelvarsler... Utfør videre sjekk... [trustmary.com] [mcafee.com]"
   - Example GOOD response: "Ingen relevante treff i norske kilder"
   - Example GOOD response: "Etablert norsk kleskjede, verifisert via Brønnøysund"

4. MANDATORY URL VERIFICATION RESPONSE:
   - CRITICAL: STRICT DEDUPLICATION REQUIRED - Only ONE entry per unique domain
   - Examples of what counts as SAME domain requiring deduplication:
     * go.kjell.com/rydd AND go.kjell.com/10 → ONLY ONE verification for go.kjell.com
     * shop.example.com/page1 AND shop.example.com/page2 → ONLY ONE verification for shop.example.com
     * www.site.no AND site.no → ONLY ONE verification for site.no
   - PROCESS: Extract domain from each URL, group by domain, verify ONLY the main domain once
   - Every unique domain MUST appear EXACTLY ONCE in urlVerifications array
   - Required fields for each unique domain:
     * url: The main domain URL (use root domain, not deep paths)
     * status: "legitimate", "unknown", "verified_scam"
     * verificationDetails: Specific findings from web search that apply to the entire domain
     * IMPORTANT: Include redirect/mismatch warnings in verificationDetails if detected
       Example: "⚠️ Lenketekst viser 'dnb.no' men faktisk lenke går til 'phishing-site.tk' - SVINDEL"
   - If no URLs found, urlVerifications should be empty array []
   - VERIFICATION RULE: One domain = One verification entry (never duplicate domains)
   - MISMATCH RULE: If display text claims one domain but actual URL is different → ALWAYS warn in verificationDetails

   📏 CRITICAL: RESPONSE LENGTH REQUIREMENTS (ENFORCE STRICTLY):
   - verificationDetails: MAXIMUM 1-2 sentences. Direct findings only, no advice.
     ✅ GOOD: "Etablert norsk kleskjede siden 2012, verifisert via Brønnøysund"
     ✅ GOOD: "Ingen treff i norske kilder for svindelwarnelser"
     ❌ BAD: "Ingen spesifikke svindelvarsler eller bekreftelser ble funnet i de medfølgende søkeresultatene. Utfør videre sjekk mot..."
     ❌ BAD: Any response with multiple links or paragraphs of generic guidance
   - summary: MAXIMUM 2 sentences total
   - recommendation: MAXIMUM 1 clear action sentence
   - mainIndicators: Short bullet points, 5-10 words each
     ⚠️ IMPORTANT: mainIndicators should contain SPECIFIC findings from the content
     ✅ GOOD: "BankID nevnt sammen med fornyelse", "Tidsfrist (12.09.2025)", "Trussel om tap av tilgang"
     ❌ BAD: Generic warnings like "Lenketekst kan skjule destinasjon" (UI already shows this)
     ❌ BAD: "Advarsel om lenketekst" or similar generic link warnings
     RULE: Do NOT include generic warnings about link text - focus on CONTENT-SPECIFIC findings
   - PRINCIPLE: Be direct and concise. Report findings, not tasks for the user.

5. SPECIAL CASES:
   - OCR text: URLs extracted from images are often suspicious
   - Image content: Look for URLs displayed visually in screenshots
   - Phishing: Pay attention to lookalike domains (bank.no vs bank-no.com)
   - Social engineering: Legitimate sites used in suspicious contexts

CRITICAL: URL extraction is MANDATORY, not optional. Always populate urlVerifications array.
</url_extraction_and_verification>`;
}