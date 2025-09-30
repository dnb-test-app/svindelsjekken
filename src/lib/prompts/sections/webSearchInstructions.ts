/**
 * Web Search Instructions
 * Provides detailed instructions for using web search to verify content
 */

export function getWebSearchInstructions(): string {
  return `<web_search_instructions>
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
- Set status: "legitimate" (verified safe), "unknown" (no clear info), "verified_scam" (confirmed fraud)
- Include specific verificationDetails: e.g., "Etablert norsk kleskjede siden 2012, verifisert via offisiell nettside og Brønnøysundregistrene"
- This data will be used to display detailed URL verification to users
</web_search_instructions>`;
}