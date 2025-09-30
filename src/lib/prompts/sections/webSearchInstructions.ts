/**
 * Web Search Instructions
 * Provides detailed instructions for using web search to verify content
 */

export function getWebSearchInstructions(): string {
  return `<web_search_instructions>
IMPORTANT: You have access to web search. Use TWO-PHASE verification strategy to properly classify domains.

🔍 TWO-PHASE DOMAIN VERIFICATION STRATEGY 🔍

## PHASE 1: VERIFY LEGITIMACY (Search for positive evidence FIRST)

⚠️ CRITICAL: Do NOT jump to fraud searches first! Start by looking for legitimate company information.

FOR ANY DOMAIN/URL:
1. **Company/Brand Search**:
   - Search: "[company name] Wikipedia" (established companies have Wikipedia pages)
   - Search: "[company name] official website"
   - Search: "[company name] LinkedIn company" (legitimate businesses have LinkedIn)
   - Search: "[domain] about us OR company information"
   - Search: "site:[domain] about OR contact" (check if site has company info)

2. **Business Registry Search**:
   - Norwegian: "[company] site:brreg.no" (Brønnøysundregistrene)
   - Swedish: "[company] bolagsverket" or "[company] allabolag.se"
   - Danish: "[company] cvr.dk"
   - International: "[company] [country] business registry"

3. **Reputation & Reviews** (for e-commerce):
   - Search: "[store name] trustpilot reviews"
   - Search: "[store name] customer reviews"
   - Search: "[store name] anmeldelse OR erfaring"

## PHASE 2: CHECK FOR FRAUD (Only after Phase 1)

After gathering positive information, NOW search for fraud reports:

1. **Norwegian Fraud Databases**:
   - Search: "[domain] site:forbrukertilsynet.no"
   - Search: "[domain] site:forbrukerradet.no"
   - Search: "[domain] site:svindel.no"
   - Search: "[domain] site:nettvett.no"

2. **General Fraud Search**:
   - Search: "[domain] scam OR fraud OR svindel"
   - Search: "[domain] falsk nettbutikk" (fake online store)
   - Search: "[store name] returns china" (common scam indicator for fashion)

3. **Police & Authority Warnings**:
   - Search: "site:politiet.no [domain] svindel"
   - Search: "[domain] phishing warning"

## 📊 STATUS DECISION LOGIC 📊

Use this EXACT logic to determine status:

### ✅ status="legitimate" WHEN:
✓ Found positive evidence (Wikipedia OR official company info OR business registry)
✓ Established business with clear history (founding year, known brand)
✓ Social media presence (LinkedIn, official Instagram/Facebook)
✓ NO fraud reports or warnings found

**Examples of LEGITIMATE:**
- holzweileroslo.com: "Established Norwegian fashion brand since 2012, Wikipedia page, sold in 180+ stores, official website verified"
- voyado.com: "Swedish B2B SaaS company, customer experience platform for retail, 400+ clients, Wikipedia and LinkedIn verified"
- nrk.no: "Norwegian Broadcasting Corporation, official national broadcaster, government-owned"

### ⚠️ status="unknown" WHEN:
? No sufficient company information found (no Wikipedia, no clear about page, no business registry)
? Domain exists but appears to be new or genuinely obscure
? Cannot verify if legitimate OR fraudulent with available information

**Examples of UNKNOWN:**
- brandnewstore2024.com: "Recently registered domain, no Wikipedia, no business registry, no company information available, no fraud reports - insufficient information"
- generic-shop.online: "New domain, minimal website content, no established presence, cannot verify legitimacy"

### ❌ status="verified_scam" WHEN:
✗ Found fraud warnings from authorities (forbrukertilsynet.no, politiet.no)
✗ Multiple scam reports from users
✗ Confirmed phishing or fake store database entries
✗ Known scam patterns (typosquatting, suspicious TLD with no legitimate business)

**Examples of VERIFIED_SCAM:**
- modeshoposlo.com: "Confirmed fake fashion store, warnings on forbrukertilsynet.no, multiple user scam reports, ships from China despite claiming to be Norwegian"
- dnb-verify.tk: "Phishing domain impersonating DNB bank, suspicious .tk TLD, no legitimate business information"

## 🌍 INTERNATIONAL DOMAINS SPECIAL HANDLING 🌍

For .com, .se, .dk, .eu, etc. (non-.no domains):

**DO NOT expect Norwegian fraud database hits!**
- International legitimate companies won't appear in Norwegian databases
- Focus on Phase 1 (positive verification) MORE than Norwegian fraud databases
- Wikipedia, LinkedIn, and official websites are PRIMARY sources
- Only check Norwegian databases if company claims to be Norwegian

**Example searches for international domains:**
- "[company name] Wikipedia" ← Start here!
- "[company name] official site"
- "[company name] [country] company"
- "[domain] about company"
- Then: "[domain] scam reviews" (not Norwegian-specific searches)

## 📝 VERIFICATION DETAILS REQUIREMENTS 📝

For each URL in urlVerifications array, include SPECIFIC details:

**For "legitimate":**
\`\`\`
verificationDetails: "Established [industry] company since [year], verified via [sources]. [Key facts: Wikipedia/business registry/social media presence]"
\`\`\`
Examples:
- "Established Norwegian fashion brand since 2012, verified via Wikipedia and official website. Sold in 180+ stores internationally, featured in Vogue."
- "Swedish customer experience platform for retail, used by 400+ brands. Verified via Wikipedia, LinkedIn, and official site voyado.com."

**For "unknown":**
\`\`\`
verificationDetails: "Insufficient information available. No Wikipedia page, no business registry entry, no clear company information found. Domain appears to be [new/obscure/minimal presence]."
\`\`\`

**For "verified_scam":**
\`\`\`
verificationDetails: "WARNING: [Specific fraud evidence found]. Reported on [source]. [Details of scam pattern]."
\`\`\`
Example:
- "WARNING: Fake fashion store. Multiple scam reports on forbrukertilsynet.no. Claims Norwegian but ships from China. No legitimate business registration."

## 🎯 SEARCH PRIORITY GUIDELINES 🎯

1. **Start positive, then negative**: Always search for legitimacy BEFORE fraud
2. **Context matters**: International domains need international verification sources
3. **Multiple sources**: Require 2+ positive indicators for "legitimate" status
4. **Be specific**: Include founding year, industry, key facts in verificationDetails
5. **Don't assume**: "No fraud reports in Norwegian databases" ≠ "unknown" for international domains

## FOR PHONE NUMBERS (Norwegian +47 format):
- Search: "[phone number] site:telefonterror.co.no"
- Search: "[phone number] site:1881.no"
- Search: "[phone number] svindel OR bedrageri"
- Search: "site:politiet.no [phone number]"

## FOR GENERAL FRAUD PATTERNS:
- Search: "[suspicious text] site:politiet.no svindel"
- Search: "[pattern] site:nettvett.no phishing"
- Search: "2025 svindel [keyword]"

Remember: The goal is ACCURATE classification, not defaulting to "unknown" when information exists!
</web_search_instructions>`;
}