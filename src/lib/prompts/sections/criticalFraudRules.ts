/**
 * Critical Fraud Rules - HIGHEST PRIORITY
 * These patterns ALWAYS indicate fraud and CANNOT be overridden by URL verification or other signals
 */

export function getCriticalFraudRules(): string {
  return `<CRITICAL_FRAUD_RULES_ABSOLUTE_PRIORITY>
🚨 ABSOLUTE PRIORITY - THESE RULES OVERRIDE ALL OTHER ANALYSIS 🚨

These patterns indicate fraud with 95-100% certainty and MUST result in category="fraud"
regardless of URL legitimacy, web search results, or any other positive signals.

CRITICAL RULE #1: BANKID RENEWAL PHISHING (ALWAYS FRAUD)
═══════════════════════════════════════════════════════════
IF message contains "BankID" (or variants: Bank ID, Bank-ID, BankId, bankid)
AND ANY of these combinations:

1. RENEWAL/UPDATE LANGUAGE:
   - forny*, oppdater*, utløp*, expire*, renew*, update*, reaktiver*, bekreft*
   - Words like: "fornye", "fornyelsen", "oppdatere", "utløper"

2. TIME PRESSURE:
   - innen, før, frist, deadline, haster, viktig, må, slutte, stoppe
   - Specific dates/deadlines (e.g., "innen 12.09.2025")
   - Urgency phrases: "i tide", "så snart som mulig"

3. THREATS/CONSEQUENCES:
   - "vil slutte å fungere" (will stop working)
   - "mister tilgang" (lose access)
   - "stenges" (will be closed/blocked)
   - "ikke lenger fungere" (no longer work)

4. ACTION REQUIRED WITH LINKS:
   - Any URL or link presented with renewal request
   - Even if the URL is bankid.no or other legitimate domains

→ THEN: category="fraud", fraudProbability=95-100, riskLevel="high"

🔒 UNBREAKABLE FACT: BankID is ONLY renewed through:
- Your bank's online banking platform (directly logged in)
- In-person at bank branch
- NEVER via email, SMS, or external links

⚠️ CRITICAL OVERRIDE: Even if the message contains legitimate URLs like "bankid.no",
the presence of renewal requests + pressure + threats = FRAUD.
Legitimate URLs appearing in fraud messages DO NOT make the message legitimate!

CRITICAL RULE #2: URGENT BANK WARNINGS (ALWAYS FRAUD)
═══════════════════════════════════════════════════════════
IF message claims to be from bank AND contains:

1. URGENT ACCOUNT THREATS:
   - "konto stenges" (account will be closed)
   - "suspendert" (suspended)
   - "sperret" (blocked)
   - "mistenkelig aktivitet" (suspicious activity) + urgent action required

2. IMMEDIATE ACTION WITH LINKS:
   - "logg inn via denne lenken" (log in via this link)
   - "verifiser umiddelbart" (verify immediately)
   - "oppdater sikkerhet" + external link

3. TIME-LIMITED THREATS:
   - "innen 24 timer" (within 24 hours)
   - "i dag" + consequences (today + consequences)

→ THEN: category="fraud", fraudProbability=85-100, riskLevel="high"

🔒 FACT: Banks contact customers through secure channels (online banking inbox,
phone from verified numbers) for urgent matters, never via threatening emails/SMS.

CRITICAL RULE #3: PASSWORD/CREDENTIAL REQUESTS (ALWAYS FRAUD)
═══════════════════════════════════════════════════════════
IF message requests ANY of:
- Passord (password)
- PIN-kode (PIN code)
- Engangskode (one-time code)
- Sikkerhetskoder (security codes)
- Full fødselsdato (full date of birth)

Via email, SMS, or external links:
→ THEN: category="fraud", fraudProbability=100, riskLevel="high"

🔒 FACT: No legitimate service asks for passwords/codes via email/SMS.

ENFORCEMENT RULES - NON-NEGOTIABLE:
═══════════════════════════════════════════════════════════
1. These critical patterns OVERRIDE all other signals including:
   ❌ URL verification (even if URLs are legitimate domains)
   ❌ Web search results (even if domain is verified safe)
   ❌ Professional formatting
   ❌ Correct branding/logos
   ❌ Any other positive indicators

2. If ANY critical pattern matches:
   → category MUST be "fraud"
   → fraudProbability MINIMUM 85% (usually 95-100%)
   → riskLevel MUST be "high"

3. URL legitimacy does NOT override critical patterns:
   ⚠️ "bankid.no" appearing in a BankID renewal request = STILL FRAUD
   ⚠️ "dnb.no" in an urgent account warning = STILL FRAUD
   ⚠️ Legitimate URLs are often USED in phishing to appear credible

4. These rules apply FIRST before any other analysis:
   STEP 1: Check critical fraud patterns → If match = FRAUD (done)
   STEP 2: Check URL verification → Only if no critical patterns
   STEP 3: Check behavioral patterns → Only if no critical patterns
   STEP 4: Check context → Only if no critical patterns

LEGITIMATE USE CASES THAT ARE NOT FRAUD:
═══════════════════════════════════════════════════════════
These patterns DO NOT trigger critical rules:

✅ News articles ABOUT BankID (from nrk.no, vg.no, e24.no)
   - No action required from user
   - Informational content only
   - No links directing to renewal/update

✅ Social media discussions ABOUT BankID security
   - User-generated content discussing BankID
   - Educational content about fraud
   - No impersonation of BankID team

✅ Bank newsletters with general security tips
   - No urgent threats
   - No specific deadline pressure
   - No links for "verification" or "renewal"

CRITICAL VALIDATION CHECKLIST (MUST APPLY):
═══════════════════════════════════════════════════════════
Before returning response, ask yourself:

□ Does this message mention BankID + renewal/update + deadline?
  → YES = FRAUD (no exceptions)

□ Does this message threaten account closure + require link clicking?
  → YES = FRAUD (no exceptions)

□ Does this message request passwords/codes via email/SMS?
  → YES = FRAUD (no exceptions)

□ Is this message informational news/discussion with no action required?
  → NO critical pattern = Continue with normal analysis

If ANY critical pattern matched → STOP → category="fraud" → DONE
Do NOT proceed with URL verification or other analysis.

</CRITICAL_FRAUD_RULES_ABSOLUTE_PRIORITY>`;
}

export function getCriticalRulesSummary(): string {
  return `<CRITICAL_RULES_SUMMARY>
⚠️ REMEMBER: Critical fraud patterns ALWAYS override URL legitimacy.
Legitimate domains (bankid.no, dnb.no) appearing in messages with renewal requests,
threats, or time pressure are STILL FRAUD. Scammers use real URLs to appear credible.

HIERARCHY OF ANALYSIS:
1. 🚨 Critical fraud patterns → If detected = FRAUD (STOP here)
2. 🔍 URL verification → Only if no critical patterns detected
3. 📋 Behavioral analysis → Only if no critical patterns detected
4. 📝 Context evaluation → Only if no critical patterns detected
</CRITICAL_RULES_SUMMARY>`;
}