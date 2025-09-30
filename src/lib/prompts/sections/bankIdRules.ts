/**
 * BankID Detection Rules
 * Critical rules for detecting BankID-related phishing attempts
 */

export function getBankIdRules(): string {
  return `<critical_rule name="BankID_Context_Aware_Detection">
IF text contains "BankID" (variants: Bank ID, Bank-ID, BankId, bankid, bank id):

CRITICAL PHISHING INDICATORS - Check for COMBINATION of factors:
1. ACTION_WORDS: forny*, oppdater*, utløp*, expire*, renew*, update*, reaktiver*, bekreft*
2. TIME_PRESSURE: innen, før, frist, deadline, haster, viktig, må, slutte, stoppe, umiddelbart
3. LINKS: Any URL or link combined with action requests
4. THREATS: "vil slutte å fungere", "mister tilgang", "stenges", "suspendert"
5. ORGANIZATION_CLAIM: Claims to be from "BankID", "BankID-teamet", or impersonates official communication

PHISHING = BankID + (ACTION + LINK) OR (ACTION + THREAT + TIME_PRESSURE)
→ THEN: category="fraud", fraudProbability=85-100, riskLevel="high"

FACT: BankID renewal ONLY happens in your bank's online banking portal or in-person at branch.
NEVER via email, SMS, or external links - no exceptions!
</critical_rule>

<bankid_detection>
🚨 BANKID PHISHING DETECTION - KONTEKSTBASERT VURDERING 🚨

Hvis teksten inneholder "BankID" (eller varianter: Bank ID, Bank-ID, BankId, bankid):

CRITICAL: DISTINGUISH between PHISHING and LEGITIMATE DISCUSSION

HØYRISIKO PHISHING-KOMBINASJONER (fraud, 85-100%):
✘ BankID + fornyelse/oppdatering/utløp + LENKE/URL + handlingskrav
✘ BankID + "logg inn her"/"klikk her" + tidsfrist eller trussel
✘ BankID + tidspress ("innen 24 timer", "slutte å fungere") + handling påkrevd
✘ Påstand om å være "BankID-teamet"/"fra BankID" + krever umiddelbar handling
✘ BankID + betalingskort/sikkerhet + "verifiser via denne lenken"
✘ BankID + trussel om stenging/tap av tilgang + lenke for å "fikse"

KEY PATTERN: Action + Link + Pressure = PHISHING

LEGITIMATE BANKID-DISKUSJONER (safe/info/marketing, 5-25%):
✓ Nyhetssaker OM BankID (fra VG.no, NRK.no, E24.no, Digi.no)
✓ LinkedIn/Facebook-poster som DISKUTERER BankID-teknologi eller sikkerhet
✓ Informasjon fra kjente tekniske/sikkerhetsfaglige kilder UTEN handlingskrav
✓ DNB/banker som generelt informerer OM BankID UTEN lenker til handling
✓ Utdanningsmateriell om digital sikkerhet og hvordan BankID fungerer
✓ Blogginnlegg eller artikler som forklarer BankID-systemet
✓ Sosiale medier-innlegg som advarer MOT BankID-svindel (meta-diskusjon)

VURDERINGSPRINSIPPER:
1. FOKUS PÅ INTENSJON: Ber meldingen deg om å GJØRE NOE (phishing) eller INFORMERER den bare (legitim)?
2. HANDLINGSKRAV: Er det en DIREKTE oppfordring til å klikke/logge inn/fornye (phishing)?
3. KONTEKST: Er dette en nyhetssak, fagartikkel, eller sosial diskusjon (legitim)?
4. LENKER: Er lenker kombinert med handlingskrav og tidspress (phishing)?
5. AVSENDER: Hevder avsenderen å VÆRE BankID/bank og krever handling (phishing)?

DECISION TREE:
- BankID nevnt + INGEN handling påkrevd + informativ kontekst = LEGITIM (safe/info)
- BankID nevnt + handling påkrevd + lenke/tidspress = PHISHING (fraud)
- BankID nevnt + generell diskusjon/utdanning = LEGITIM (safe/info)
- BankID nevnt + "dette er svindel"-advarsel = META-DISKUSJON (safe)

FAKTA: BankID fornyes KUN i nettbank (direkte innlogget) eller personlig på bankkontor.
Eksterne lenker for BankID-fornyelse = ALLTID PHISHING, ingen unntak!

⚠️ IMPORTANT: Reduce false positives by identifying legitimate educational/news content about BankID.
Only flag as fraud when there's clear action + link/threat combination.
</bankid_detection>`;
}

export function getFundamentalPrinciple(): string {
  return `<fundamental_principle>
ALDRI STOL PÅ MERKENAVN - Svindlere bruker ALLTID kjente merker (Telenor, DNB, Posten, etc.)
Fokuser på HVA de ber om, ikke HVEM de sier de er.
</fundamental_principle>`;
}