/**
 * Vipps Detection Rules
 * Critical rules for detecting Vipps-related phishing and fraud attempts
 */

export function getVippsRules(): string {
  return `<critical_rule name="Vipps_Context_Aware_Detection">
IF text contains "Vipps" (variants: VIPPS, vipps, Vi pps, MobilePay):

CRITICAL PHISHING INDICATORS - Check for COMBINATION of factors:
1. ACCOUNT_ACTIONS: verifiser*, bekreft*, oppdater*, suspended*, blokkert*, stengt*
2. TIME_PRESSURE: innen, før, frist, deadline, haster, umiddelbart, nå, i dag
3. LINKS: Any URL or link combined with account/payment verification requests
4. THREATS: "kontoen stenges", "mister tilgang", "blokkert", "suspendert", "utestengt"
5. PAYMENT_ISSUES: Claims of "mistenkelig aktivitet", "uautorisert betaling", "sikkerhetsproblem"
6. ORGANIZATION_CLAIM: Claims to be from "Vipps", "Vipps Support", "Vipps Sikkerhet"

PHISHING = Vipps + (ACCOUNT_ACTION + LINK) OR (PAYMENT_ISSUE + THREAT + TIME_PRESSURE)
→ THEN: category="fraud", fraudProbability=85-100, riskLevel="high"

FACT: Vipps NEVER asks you to verify your account via email/SMS links.
All Vipps account management happens IN THE APP - never via external links!
</critical_rule>

<vipps_detection>
🚨 VIPPS PHISHING DETECTION - KONTEKSTBASERT VURDERING 🚨

Hvis teksten inneholder "Vipps" (eller varianter: VIPPS, vipps, MobilePay):

CRITICAL: DISTINGUISH between PHISHING and LEGITIMATE COMMUNICATION

HØYRISIKO PHISHING-KOMBINASJONER (fraud, 85-100%):
✘ Vipps + "verifiser konto"/"bekreft identitet" + LENKE + tidsfrist
✘ Vipps + "mistenkelig aktivitet" + "klikk her for å låse opp"
✘ Vipps + "kontoen stenges"/"suspendert" + handling påkrevd med lenke
✘ Påstand om å være "Vipps Support"/"Vipps Sikkerhet" + krever umiddelbar handling
✘ Vipps + "uautorisert betaling" + "bekreft via denne lenken"
✘ Vipps + trussel om tap av tilgang + eksterne lenker for verifisering
✘ Vipps + "oppdater betalingsinformasjon" via e-post/SMS-lenke
✘ Vipps + "vinn penger"/"tilbakebetaling" + registrer deg via lenke

KEY PATTERN: Vipps + Account Threat + Link = PHISHING

LEGITIMATE VIPPS-KOMMUNIKASJON (safe/info/marketing, 5-25%):
✓ Nyhetssaker OM Vipps (fra VG.no, NRK.no, E24.no, DN.no)
✓ Vipps offisielle nyhetsbrev med generell info UTEN handlingskrav
✓ Informasjon fra kjente handelspartnere om Vipps som betalingsalternativ
✓ Blogginnlegg eller artikler som forklarer Vipps-tjenesten
✓ Sosiale medier-innlegg som diskuterer Vipps-funksjoner
✓ Markedsføring fra butikker om "betal med Vipps" UTEN kontoverifisering
✓ Kvitteringer fra Vipps etter gjennomført betaling (i appen eller e-post)
✓ Advarsler MOT Vipps-svindel (meta-diskusjon)

VURDERINGSPRINSIPPER:
1. FOKUS PÅ INTENSJON: Ber meldingen deg om å VERIFISERE KONTO (phishing) eller er det en kvittering/info (legitim)?
2. HANDLINGSKRAV: Er det en DIREKTE oppfordring til å klikke for kontoverifisering (phishing)?
3. KONTEKST: Er dette en nyhetssak, kvittering, eller generell info (legitim)?
4. LENKER: Er lenker kombinert med kontotrusler og tidspress (phishing)?
5. AVSENDER: Hevder avsenderen å VÆRE Vipps Support og krever handling (phishing)?
6. IN-APP: Ekte Vipps-varsler kommer i appen, ikke via eksterne lenker

DECISION TREE:
- Vipps nevnt + kvittering for betaling + ingen handling påkrevd = LEGITIM (safe)
- Vipps nevnt + "verifiser konto" + ekstern lenke = PHISHING (fraud)
- Vipps nevnt + generell info om tjenesten = LEGITIM (info/marketing)
- Vipps nevnt + "dette er svindel"-advarsel = META-DISKUSJON (safe)
- Vipps nevnt + betalingsalternativ hos butikk = LEGITIM (marketing)
- Vipps nevnt + kontotrussel + tidsfrist + lenke = PHISHING (fraud)

FAKTA: Vipps kontoadministrasjon skjer KUN i appen eller direkte innlogget på vipps.no.
Eksterne lenker for kontoverifisering = ALLTID PHISHING, ingen unntak!

COMMON VIPPS PHISHING TACTICS:
1. "Din Vipps-konto er suspendert - klikk her for å reaktivere"
2. "Mistenkelig aktivitet oppdaget - verifiser identitet innen 24 timer"
3. "Vipps: Uautorisert betaling på kr 5000 - stopp betaling her"
4. "Vipps tilbakebetaling kr 2500 - klikk for å motta"
5. "Oppdater Vipps-sikkerhet - klikk her innen i dag"

⚠️ IMPORTANT: Reduce false positives by identifying:
- Legitimate payment receipts from Vipps
- News articles about Vipps services
- Merchant information about Vipps payment option
- General information about Vipps features

Only flag as fraud when there's clear account threat + action + link combination.
</vipps_detection>`;
}