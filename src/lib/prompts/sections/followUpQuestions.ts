/**
 * Follow-up Questions Guide
 * Instructions for generating contextual follow-up questions
 */

export function getFollowUpQuestionsGuide(): string {
  return `<follow_up_questions_guide>
Analyser INNHOLDET i meldingen og generer 3 SPESIFIKKE oppfølgingsspørsmål basert på det faktiske innholdet:

PROSESS:
1. IDENTIFISER: Hva handler meldingen om? (nyhetsbrev, faktura, pakke, kontovarsling, etc.)
2. ANALYSER: Hvilke spesifikke tjenester, produkter eller tema nevnes?
3. GENERER: Lag spørsmål som er relevante for DETTE spesifikke innholdet

NYTT FORMAT - STRUKTURERTE SPØRSMÅL:
Hver question skal ha:
- "question": Spørsmålsteksten på norsk
- "type": "yes-no" eller "multiple-choice"
- "options": Array med svaralternativer (kun for multiple-choice)

NÅR SKAL DU BRUKE HVILKEN TYPE:

YES-NO SPØRSMÅL (type: "yes-no"):
- Enkle ja/nei-spørsmål
- "Er du kunde hos [tjeneste]?"
- "Venter du en pakke?"
- "Har du bestilt dette?"

MULTIPLE-CHOICE SPØRSMÅL (type: "multiple-choice"):
- Når spørsmålet naturlig har flere alternativer
- "Hvordan logger du vanligvis inn?" → App, Nettbank, Begge, Ingen
- "Hvor ofte handler du hos [butikk]?" → Ofte, Sjelden, Aldri, Første gang
- "Hvilken tjeneste bruker du?" → Mobilapp, Nettside, SMS, Telefon

EKSEMPEL STRUKTURERTE SPØRSMÅL - FOKUS PÅ FORVENTET vs UVENTET:

For BankID/Bank-varsler (SpareBank1, DNB, etc.):
{
  "question": "Er du kunde hos SpareBank1?",
  "type": "yes-no"
},
{
  "question": "Har du nylig gjort endringer eller bedt om oppdatering av BankID?",
  "type": "yes-no"
},
{
  "question": "Hvordan mottok du denne meldingen?",
  "type": "multiple-choice",
  "options": [
    {"value": "sms", "label": "SMS", "emoji": "📱"},
    {"value": "email", "label": "E-post", "emoji": "📧"},
    {"value": "social", "label": "Sosiale medier", "emoji": "📘"},
    {"value": "other", "label": "Annet", "emoji": "❓"}
  ]
}

For pakkelevering/transport:
{
  "question": "Venter du en pakke akkurat nå?",
  "type": "yes-no"
},
{
  "question": "Har du bestilt noe de siste 2 ukene?",
  "type": "yes-no"
},
{
  "question": "Hvordan fikk du leveringsvarselet?",
  "type": "multiple-choice",
  "options": [
    {"value": "sms", "label": "SMS", "emoji": "📱"},
    {"value": "email", "label": "E-post", "emoji": "📧"},
    {"value": "app", "label": "Transportør-app", "emoji": "📲"},
    {"value": "social", "label": "Sosiale medier", "emoji": "📘"},
    {"value": "other", "label": "Annet", "emoji": "❓"}
  ]
}

For refusjon/betaling:
{
  "question": "Venter du en refusjon eller tilbakebetaling?",
  "type": "yes-no"
},
{
  "question": "Kjenner du igjen beløpet som nevnes?",
  "type": "yes-no"
},
{
  "question": "Har du handlet hos denne aktøren før?",
  "type": "multiple-choice",
  "options": [
    {"value": "recent", "label": "Nylig (siste måned)", "emoji": "🕐"},
    {"value": "sometime", "label": "Tidligere", "emoji": "📅"},
    {"value": "never", "label": "Aldri", "emoji": "❌"},
    {"value": "unsure", "label": "Usikker", "emoji": "🤔"}
  ]
}

For kontovarsler/tjenestevarsler:
{
  "question": "Har du en aktiv konto hos denne tjenesten?",
  "type": "yes-no"
},
{
  "question": "Har du nylig endret passord eller kontoinformasjon?",
  "type": "yes-no"
},
{
  "question": "Hvordan bruker du vanligvis denne tjenesten?",
  "type": "multiple-choice",
  "options": [
    {"value": "app_only", "label": "Kun mobilapp", "emoji": "📱"},
    {"value": "web_only", "label": "Kun nettside", "emoji": "💻"},
    {"value": "both", "label": "Både app og nettside", "emoji": "🔄"},
    {"value": "not_user", "label": "Bruker ikke tjenesten", "emoji": "❌"}
  ]
}

For tilbud/shopping:
{
  "question": "Kjenner du til denne butikken fra før?",
  "type": "yes-no"
},
{
  "question": "Hvor så du tilbudet/annonsen?",
  "type": "multiple-choice",
  "options": [
    {"value": "email", "label": "E-post", "emoji": "📧"},
    {"value": "sms", "label": "SMS", "emoji": "📱"},
    {"value": "facebook", "label": "Facebook", "emoji": "📘"},
    {"value": "instagram", "label": "Instagram", "emoji": "📷"},
    {"value": "website", "label": "Nettside", "emoji": "💻"},
    {"value": "other", "label": "Annet", "emoji": "❓"}
  ]
},
{
  "question": "Har du handlet hos dem før?",
  "type": "multiple-choice",
  "options": [
    {"value": "yes_often", "label": "Ja, flere ganger", "emoji": "🛒"},
    {"value": "yes_once", "label": "Ja, en gang", "emoji": "✅"},
    {"value": "no", "label": "Nei, aldri", "emoji": "❌"}
  ]
}

EMOJI-RETNINGSLINJER:
- 📱 Mobilapp/telefon
- 💻 Nettside/datamaskin
- ✅ Ja/bekreftet
- ❌ Nei/avvist
- 🔄 Begge/kombinasjon
- 🛒 Shopping/handel
- 📧 E-post/kommunikasjon
- 🏦 Bank/økonomi
- 📦 Pakke/levering
- ⏰ Tid/timing

KRAV til spørsmålene - FOKUS PÅ SVINDELDETEKSJON:

PRIORITET 1: FORVENTET vs UVENTET KOMMUNIKASJON
- "Er du kunde hos [tjeneste]?" - Verifiserer legitimt kundeforhold
- "Venter du [handling/varsel] akkurat nå?" - Sjekker om timing gir mening
- "Har du nylig gjort [relevant handling]?" - Kontrollerer om meldingen er forventet

PRIORITET 2: KOMMUNIKASJONSKANAL og KONTEKST
- "Hvordan mottok du denne meldingen?" - Skjuler svindlere seg bak sosiale medier?
- "Hvordan kommuniserer [tjeneste] vanligvis med deg?" - Avdekker uvanlige kanaler
- "Har du oppgitt din informasjon til denne avsenderen?" - Verifiserer datagrunnlag

PRIORITET 3: BRUKERATFERD og TIDLIGERE ERFARING
- "Når [handlet/brukte] du denne tjenesten sist?" - Avdekker om relasjonen er aktiv
- "Kjenner du igjen [detaljer] som nevnes?" - Verifiserer legitimitet av innhold
- "Har du tidligere mottatt lignende meldinger?" - Identifiserer mønstre

SPØRSMÅLSSTRATEGI BASERT PÅ INNHOLD:
- Bank/BankID → Kundeforhold + nylige endringer + kommunikasjonskanal
- Pakker → Forventer pakke + bestillingshistorikk + transportør
- Refusjon → Nylige returer + beløpsgjenkjenning + transaksjonshistorikk
- Kontovarsler → Aktiv konto + nylige endringer + vanlig bruksmønster
- Tilbud/shopping → Kundeforhold + hvor funnet + handelshistorikk

TEKNISKE KRAV:
- Må referere DIREKTE til konkrete detaljer fra meldingen
- Bruk faktiske navn på tjenester/produkter/tema som nevnes
- Fokuser på brukerens forhold til den SPESIFIKKE situasjonen
- Velg riktig spørsmålstype basert på naturlige svaralternativer
- Inklude relevante emojis for klarhet

MÅLET: Hjelp brukeren identifisere om meldingen er FORVENTET (legitimate) eller UVENTET (potensielt svindel)
</follow_up_questions_guide>`;
}