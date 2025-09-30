/**
 * BankID Detection Rules
 * Critical rules for detecting BankID-related phishing attempts
 */

export function getBankIdRules(): string {
  return `<critical_rule name="BankID_Always_Fraud">
IF text contains "BankID" (variants: Bank ID, Bank-ID, BankId, bankid)
AND ANY of these patterns:
1. ACTION_WORDS: forny*, oppdater*, utløp*, expire*, renew*, update*, reaktiver*, bekreft*
2. TIME_PRESSURE: innen, før, frist, deadline, haster, viktig, må, slutte, stoppe
3. LINKS: Any URL or link combined with BankID
4. ORGANIZATION_CLAIM: Claims to be from BankID, BankID-team, or bank

THEN: category="fraud", fraudProbability=95-100, riskLevel="high"

FACT: BankID renewal ONLY in online banking or in-person - NEVER via email/SMS!
ALL external BankID communication = FRAUD regardless of formulation
</critical_rule>

<bankid_detection>
🚨 BANKID PHISHING DETECTION - KONTEKSTBASERT VURDERING 🚨

Hvis teksten inneholder "BankID" (eller varianter: Bank ID, Bank-ID, BankId, bankid):

HØYRISIKO PHISHING-KOMBINASJONER (fraud, 85-95%):
- BankID + fornyelse/oppdatering/utløp + LENKE/URL
- BankID + "logg inn her" eller lignende + handlingskrav
- BankID + tidspress (frist, haster, slutte å fungere)
- Påstand om å være "BankID-teamet" + handlingskrav
- BankID + betalingskort/sikkerhet + "klikk her"

LEGITIMATE BANKID-DISKUSJONER (info/marketing, 5-25%):
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
</bankid_detection>`;
}

export function getFundamentalPrinciple(): string {
  return `<fundamental_principle>
ALDRI STOL PÅ MERKENAVN - Svindlere bruker ALLTID kjente merker (Telenor, DNB, Posten, etc.)
Fokuser på HVA de ber om, ikke HVEM de sier de er.
</fundamental_principle>`;
}