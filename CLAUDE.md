# CLAUDE.md - DNB Svindelsjekk

Dette dokumentet gir veiledning til Claude Code (claude.ai/code) når man arbeider med DNB Svindelsjekk-prosjektet.
**CRITICAL** Use Bash to get the [CURRENT_DATE] from the system. Include [CURRENT_MONTH] [CURRENT_YEAR] in **ALL WEB SEARCHES** to ensure you only get the LATEST information

## 🚨 KRITISK: DESIGN LOCK - ALDRI MODIFISER 🚨

### ⛔ DESIGNET ER LÅST - COMMIT 4deda88 ER GODKJENT AV DNB

**ADVARSEL**: Dette prosjektet bruker DNBs offisielle designsystem. Enhver avvik fra DNB Eufemia eller custom styling VIL ØDELEGGE PRODUKSJON og bryte kundetillit.

### ABSOLUTTE REGLER - INGEN UNNTAK:
1. **ALDRI** skriv custom CSS som overstyrer DNB Eufemia
2. **ALDRI** bruk andre UI-biblioteker (Tailwind, Material-UI, etc.)
3. **ALDRI** endre farger, spacing eller typografi fra DNB-standard
4. **ALLTID** bruk DNB Eufemia komponenter EKSAKT som dokumentert
5. **ALLTID** sammenlign med DNB.no FØR enhver endring
6. **HVIS USIKKER**: IKKE ENDRE - spør først!

### GODKJENT DESIGN-TILSTAND:
- Commit: `4deda882d8468c782b0e73f97f770f46664d4eec`
- DNB Eufemia versjon: `10.80.0` (IKKE OPPGRADER)
- Styling: 100% DNB-kompatibel
- Testet mot: DNB.no produksjon september 2024

### VED BRUDD PÅ DESIGN:
```bash
# UMIDDELBAR ROLLBACK
git reset --hard 4deda88
npm install
npm run dev
```

## Prosjektoversikt

**DNB Svindelsjekk** - En produksjonsklar webapplikasjon for svindeldeteksjon bygget med Next.js 14, TypeScript og DNB Eufemia designsystem. Applikasjonen tilbyr lokal tekst- og bildeanalyse for å hjelpe brukere med å identifisere potensielle svindelforsøk.

### Hovedmål
- **Brukeropplevelse**: Matche DNB.no sitt utseende og interaksjonsmønstre 100%
- **Sikkerhet**: All databehandling skjer lokalt i nettleseren
- **Tilgjengelighet**: WCAG 2.1 AA-kompatibel
- **Ytelse**: Rask respons med lokal analyse

## Utviklingskommandoer

```bash
# Installer avhengigheter
npm install

# Kjør utviklingsserver
npm run dev

# Bygg for produksjon
npm run build

# Start produksjonsserver
npm start

# Kjør linter
npm run lint

# Kjør tester
npm test
npm run test:e2e
npm run test:a11y

# 🔴 OBLIGATORISK: Visuell testing FØR ALLE ENDRINGER
# STOPP! Har du kjørt disse testene? NEI = IKKE FORTSETT!
# Designet MÅ matche DNB.no 100% - ingen avvik tolereres

# STEG 1: Ta screenshot av DNB.no for sammenligning
open https://www.dnb.no  # Åpne DNB.no i browser
# Ta screenshots av relevante sider/komponenter

# STEG 2: Kjør visuelle tester MOT DNB-standard
npx playwright test --ui  # Åpner Playwright UI for visuell inspeksjon
npx playwright test tests/visual --update-snapshots  # Oppdater baseline BARE hvis godkjent
npx playwright test tests/visual  # Sammenlign med godkjent baseline
npx playwright test --headed  # Se testen kjøre i nettleser
npx playwright test tests/e2e/responsive-test.spec.ts  # Test responsive design

# STEG 3: Verifiser at INGEN styling har endret seg
git diff src/app/globals.css  # Skal være TOM
git diff '*.tsx' | grep -E "style|className|css"  # Skal IKKE vise custom styling

# HVIS TESTER FEILER = ROLLBACK UMIDDELBART
git reset --hard 4deda88
```

## Arkitektur

### Teknologi-stack
- **Frontend Framework**: Next.js 14 med App Router
- **Språk**: TypeScript
- **UI Komponenter**: DNB Eufemia Design System (https://eufemia.dnb.no)
- **State Management**: React useState og Context
- **Routing**: Next.js App Router med [locale] segmenter
- **OCR**: Tesseract.js for lokal tekstekstraksjon
- **Bildeprosessering**: EXIF-analyse med exifr
- **Validering**: Zod for skjemavalidering
- **Testing**: Jest, Testing Library, Playwright

### Katalogstruktur
```
src/
├── app/
│   ├── [locale]/          # Lokaliserte ruter
│   │   ├── layout.tsx      # Root layout med Eufemia Theme
│   │   ├── page.tsx        # Hjemmeside
│   │   ├── analyse/        # Resultatside
│   │   ├── om/             # Om-side
│   │   └── personvern/     # Personvernside
│   └── api/
│       └── analyze/        # API for dyp sjekk
├── components/             # React-komponenter
├── lib/                    # Utility-funksjoner
├── hooks/                  # Custom React hooks
└── middleware.ts           # Locale routing og CSP
```

## ⚠️ KRITISK: DNB Eufemia Design System

### ABSOLUTT KRAV: ALLTID BRUK DNB EUFEMIA
**VI MÅ ABSOLUTT BRUKE DNB EUFEMIA KOMPONENTER OG DESIGN!**
- **Bruk DNB.no som referanse** for hvordan ting skal se ut for kundene
- **ALDRI lag custom komponenter** hvis DNB Eufemia har en løsning
- **Følg DNB brand guidelines** 100% av tiden

### ALLTID sjekk DNB ressurser først
Før du lager eller endrer UI-komponenter, ALLTID konsulter:
- **DNB.no**: https://www.dnb.no - Hvordan DNB presenterer seg til kunder
- **Offisiell Eufemia dokumentasjon**: https://eufemia.dnb.no
- **Komponenter**: https://eufemia.dnb.no/uilib/components/
- **Layout**: https://eufemia.dnb.no/uilib/layout/
- **Patterns**: https://eufemia.dnb.no/uilib/patterns/
- **Design tokens**: https://eufemia.dnb.no/design-system/tokens/

### Komponenthierarki (STRENGE KRAV)
1. **FØRST**: Bruk eksisterende DNB Eufemia-komponenter
2. **ANDRE**: Følg mønstre fra DNB.no
3. **ALDRI**: Lag custom komponenter uten DNB Eufemia som base
4. **ABSOLUTT ALDRI**: Bruk andre UI-biblioteker (ingen Tailwind, Material-UI, etc.)

### ❌ FORBUDT - ALDRI GJØR DETTE (VIL ØDELEGGE PRODUKSJON)

```tsx
// ❌❌❌ ABSOLUTT FORBUDT - ØDELEGGER ALT
import styled from 'styled-components'; // NEI!
import { Box } from '@mui/material'; // NEI!
import { tw } from 'tailwind'; // NEI!

// ❌❌❌ FORBUDT - Custom styling
<div style={{background: 'blue'}}> // NEI!
<button className="custom-button"> // NEI!

// ❌❌❌ FORBUDT - Overstyr DNB
.dnb-button { background: red !important; } // NEI!

// ❌❌❌ FORBUDT - Egne farger
color: '#123456' // NEI! Bruk var(--color-sea-green)
padding: '20px' // NEI! Bruk var(--spacing-medium)
```

### ✅ PÅKREVD - GJØR ALLTID DETTE

```tsx
// ✅✅✅ RIKTIG - KUN DNB Eufemia
import { Button, Card, Input, Heading, P } from '@dnb/eufemia';

// ✅✅✅ RIKTIG - DNB komponenter
<Button variant="primary">Send</Button>
<Input label="Navn" />
<Card>Innhold</Card>

// ✅✅✅ RIKTIG - DNB tokens
color: 'var(--color-sea-green)'
spacing: 'var(--spacing-medium)'

// ✅✅✅ RIKTIG - DNB Eufemia styling
<Space top="large" bottom="medium">
  <Heading size="xx-large">Overskrift</Heading>
</Space>
```

### Layout og Grid System

#### Responsive Breakpoints (Eufemia standard)
```css
/* Small screen */
@media screen and (max-width: 40em) { /* 640px */ }

/* Medium screen */
@media screen and (min-width: 40.0625em) and (max-width: 60em) { /* 641px - 960px */ }

/* Large screen */
@media screen and (min-width: 60.0625em) { /* 961px+ */ }

/* Extra large screen */
@media screen and (min-width: 80em) { /* 1280px+ */ }
```

#### Container-bredder
- Small: 40rem (640px)
- Medium: 60rem (960px)
- Large: 80rem (1280px)
- X-Large: 90rem (1440px)

### Spacing System (Eufemia)
Bruk alltid Eufemia spacing-variabler:
```tsx
<Space top="large" bottom="medium">
  <Component />
</Space>
```

Spacing-verdier:
- `xx-small`: 0.25rem
- `x-small`: 0.5rem
- `small`: 1rem
- `medium`: 1.5rem
- `large`: 2rem
- `x-large`: 3rem
- `xx-large`: 3.5rem
- `xxx-large`: 4.5rem

### Typografi (Eufemia)
```tsx
// Overskrifter
<Heading size="xx-large">H1 Overskrift</Heading>
<Heading size="x-large">H2 Overskrift</Heading>
<Heading size="large">H3 Overskrift</Heading>

// Brødtekst
<P>Normal paragraf</P>
<P size="small">Liten tekst</P>
<P size="medium">Medium tekst</P>
```

### Knappevarianter (FØLG DNB.no EKSAKT)
```tsx
// Primærknapp - Hovedhandlinger (Sea Green - som på DNB.no)
<Button>Primær handling</Button>

// Sekundærknapp - Alternative handlinger (Hvit med border)
<Button variant="secondary">Sekundær handling</Button>

// Tertiærknapp - Mindre viktige handlinger (KREVER ikon, ingen bakgrunn)
<Button variant="tertiary" icon="arrow_forward">Les mer</Button>

// VIKTIG: Se DNB.no for eksakt bruk av hver variant!
// Primær: Logg inn, Send, Bekreft
// Sekundær: Avbryt, Tilbake, Alternative valg
// Tertiær: Les mer, Last ned, Eksterne lenker
```

### Fargepalett (DNB BRAND COLORS)
**BRUK KUN DNB GODKJENTE FARGER - Se DNB.no for eksempler**

Primærfarger:
- `--color-sea-green` (#007272): DNBs hovedfarge - bruk på primærknapper og viktige elementer
- `--color-mint-green` (#40BFBF): Sekundærfarge for aksenter
- `--color-white` (#FFFFFF): Hvit bakgrunn (standard)
- `--color-black` (#000000): Sort tekst på lys bakgrunn

Sekundærfarger:
- `--color-summer-green` (#28a745): Success/godkjent
- `--color-cherry-red` (#c21e25): Error/advarsel
- `--color-ocean-blue` (#0064FF): Info/lenker
- `--color-signal-orange` (#FF9100): Warning/oppmerksomhet

**VIKTIG**: Se alltid på DNB.no for hvordan fargene brukes i praksis!

## Internasjonalisering (i18n)

### Støttede språk
- `nb` - Norsk bokmål (standard)
- `en` - Engelsk

### Legge til nytt språk
1. Opprett ny fil i `messages/` (f.eks. `messages/de.json`)
2. Oppdater `src/lib/i18n.ts` med ny locale
3. Oppdater `src/middleware.ts` med ny locale

### Språkdeteksjon
1. Cookie-preferanse (`locale`)
2. Accept-Language header
3. Standard til norsk (`nb`)

## Temasystem

### Temamoduser
- **Light**: Lyst tema
- **Dark**: Mørkt tema
- **System**: Følger OS-preferanse

### Dark Mode implementasjon
```css
[data-theme="dark"] {
  --color-surface: #1a1a1a;
  --color-text: #ffffff;
  /* ... */
}
```

## Svindeldeteksjon

### Heuristiske regler
- **Hasteord**: Detekterer presstaktikker
- **Legitimasjonsforespørsler**: Identifiserer forespørsler om sensitiv info
- **Domeneanalyse**: Sjekker mistenkelige domener
- **Phishing-nøkkelord**: Vanlige phishing-termer
- **For godt til å være sant**: Urealistiske løfter
- **Fjernaksess**: Remote desktop-verktøy
- **Gavekort**: Betaling via gavekort
- **Kryptovaluta**: Krypto-relaterte svindler

### Risikonivåer
- **Lav** (0-29 poeng): Grønn indikator
- **Middels** (30-59 poeng): Gul indikator
- **Høy** (60-100 poeng): Rød indikator

## Personvern og sikkerhet

### Lokal prosessering
- All standard analyse skjer i nettleseren
- Ingen data sendes til servere som standard
- OCR og tekstanalyse kjører lokalt

### Dyp sjekk (opt-in)
- Krever eksplisitt brukersamtykke
- Data sendes kryptert til `/api/analyze`
- Umiddelbar sletting etter analyse
- Ingen langtidslagring

### CSP Headers
```javascript
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{nonce}';
  style-src 'self' 'unsafe-inline';
  worker-src 'self' blob:;
```

## Testing

### Enhetstester
```bash
npm test
```

### E2E-tester
```bash
npm run test:e2e
```

### Tilgjengelighetstester
```bash
npm run test:a11y
```

### Testscenarier
1. **i18n**: Språkbytte og persistens
2. **Tema**: Mørk modus og systempreferanse
3. **Opplasting**: Bilde-upload og OCR
4. **Dyp sjekk**: Opt-in serveranalyse
5. **Tilgjengelighet**: WCAG-samsvar
6. **Personvern**: Ingen uautoriserte nettverkskall

## Ytelsesoptimalisering

### Mobile First
- Start med mobildesign
- Progressive enhancement for større skjermer
- Touch-vennlige interaksjoner

### Lazy Loading
- Tesseract.js lastes ved behov
- Bilder optimaliseres automatisk
- Code splitting per rute

### Bildehåndtering
- Maks filstørrelse: 10 MB
- Støttede formater: PNG, JPG, JPEG, PDF
- Automatisk komprimering

## Deployment

### Produksjonsbygg
```bash
npm run build
npm start
```

### Miljøvariabler
```env
ANALYSIS_API_KEY=din_api_nøkkel  # Valgfri for dyp analyse
```

### Sjekkliste før deployment
1. ✅ Kjør alle tester
2. ✅ Sjekk for konsoll-feil
3. ✅ Verifiser miljøvariabler
4. ✅ Test på mobile enheter
5. ✅ Valider tilgjengelighet
6. ✅ Sikkerhetskontroll

## Design System Requirements (ABSOLUTTE KRAV)

### DNB.no som hovedreferanse
**ALLTID bruk DNB.no som visuell guide for hvordan komponenter og sider skal se ut.**

Når du implementerer nye features:
1. **Først**: Sjekk hvordan lignende funksjonalitet ser ut på DNB.no
2. **Deretter**: Finn tilsvarende komponenter i DNB Eufemia
3. **Implementer**: Bruk Eufemia-komponenter med samme styling som DNB.no
4. **Valider**: Sammenlign resultatet med DNB.no

### Komponent-bruk (STRENGE REGLER)
```tsx
// ✅ RIKTIG - Bruk DNB Eufemia komponenter
import { Button, Card, Input } from '@dnb/eufemia';

// ❌ FEIL - ALDRI bruk andre UI-biblioteker
import { Button } from '@mui/material'; // FORBUDT!
import { Card } from 'antd'; // FORBUDT!
```

### Styling-regler
```tsx
// ✅ RIKTIG - Bruk DNB design tokens
const styles = {
  color: 'var(--color-sea-green)',
  spacing: 'var(--spacing-medium)'
};

// ❌ FEIL - Ikke bruk custom verdier
const styles = {
  color: '#00a0a0', // FEIL - bruk DNB tokens
  padding: '20px' // FEIL - bruk DNB spacing
};
```

## 🔒 DESIGN SYSTEM ENFORCEMENT

### AUTOMATISKE SJEKKER SOM MÅ KJØRES

```bash
# Design System Validator Script
# Kjør ALLTID før commit

#!/bin/bash
echo "🔍 DNB Design System Compliance Check..."

# 1. Sjekk DNB Eufemia versjon
VERSION=$(npm list @dnb/eufemia --depth=0 | grep @dnb/eufemia | awk '{print $2}')
if [ "$VERSION" != "10.80.0" ]; then
  echo "❌ FEIL: DNB Eufemia versjon er $VERSION, skal være 10.80.0"
  exit 1
fi

# 2. Sjekk for forbudte UI-biblioteker
FORBIDDEN=$(grep -r "import.*from" src/ | grep -E "material-ui|tailwind|styled-components|emotion|chakra" || true)
if [ ! -z "$FORBIDDEN" ]; then
  echo "❌ FEIL: Forbudte UI-biblioteker funnet:"
  echo "$FORBIDDEN"
  exit 1
fi

# 3. Sjekk globals.css ikke endret
CHANGED=$(git diff src/app/globals.css)
if [ ! -z "$CHANGED" ]; then
  echo "❌ FEIL: globals.css har blitt endret - IKKE TILLATT"
  exit 1
fi

# 4. Verifiser DNB komponenter
DNB_IMPORTS=$(grep -r "@dnb/eufemia" src/ | wc -l)
if [ "$DNB_IMPORTS" -lt 1 ]; then
  echo "❌ FEIL: Ingen DNB Eufemia komponenter brukt"
  exit 1
fi

echo "✅ Design System Compliance: GODKJENT"
```

### LOCKED DESIGN PATTERNS

**Disse mønstrene er LÅST og kan ALDRI endres:**

1. **Header**: DNB grønn (#007272) med hvit logo
2. **Buttons**: Sea Green primær, hvit sekundær, tertiær med ikon
3. **Spacing**: DNB tokens (small: 1rem, medium: 1.5rem, large: 2rem)
4. **Typography**: DNB Eufemia font stack
5. **Cards**: Hvit bakgrunn, subtle shadow, 12px border-radius
6. **Forms**: 2px border, DNB grønn fokus, 8px border-radius

### DESIGN SYSTEM KONTAKTER

Ved tvil om design, kontakt:
- DNB Design System Team: design.system@dnb.no
- Eufemia Support: https://eufemia.dnb.no/contact
- Slack: #dnb-design-system

## Viktige merknader

### DNB Eufemia-krav (ABSOLUTTE KRAV)
- **ALLTID** bruk DNB Eufemia-komponenter - ingen unntak
- **ALLTID** sjekk DNB.no for visuell referanse
- **ALDRI** lag custom styling som avviker fra DNB-merkevare
- **ALDRI** bruk andre UI-biblioteker eller rammeverk
- **FØLG** DNBs spacing og typography-system 100%
- **KOPIER** interaksjonsmønstre fra DNB.no
- **TEST** på alle skjermstørrelser som DNB.no støtter
- **VALIDER** at designet matcher DNBs kundeopplevelse

### Tilgjengelighet (WCAG 2.1 AA)
- Alle interaktive elementer må ha tastaturfokus
- Proper ARIA-labels og roller
- Kontrastforhold minimum 4.5:1 for tekst
- Fokushåndtering i dialoger og modaler

### Sikkerhet
- Ingen inline scripts
- Valider all brukerinput
- Sanitiser data før visning
- Implementer rate limiting på API

### Kompatibilitet
- React 18+
- Node.js 18+
- Moderne nettlesere (siste 2 versjoner)
- iOS Safari 14+
- Chrome Mobile 90+

## Prosjektspesifikke notater

### Svindeldeteksjon-algoritme
Algoritmen bruker vektet scoring basert på:
- Antall og type triggere
- Alvorlighetsgrad av hver trigger
- Kombinasjoner av triggere

### OCR-prosessering
- Tesseract.js med norsk og engelsk språkstøtte
- Automatisk språkdeteksjon
- Progressiv lasting for bedre ytelse

### Testing Strategy

### Visuell Testing (KRITISK)
**ALLTID sammenlign med DNB.no før deployment!**

```bash
# Visuell regresjonstesting
npx playwright test tests/visual --update-snapshots  # Oppdater referansebilder
npx playwright test tests/visual  # Sammenlign med referanse

# Responsive testing
npx playwright test tests/e2e/responsive-test.spec.ts
```

### Enhetstester
```bash
npm test  # Kjør alle enhetstester
npm test:watch  # Watch mode for utvikling
```

### E2E-tester
```bash
npm run test:e2e  # Headless
npx playwright test --headed  # Med synlig browser
npx playwright test --ui  # Interaktiv UI
```

### Tilgjengelighetstesting
```bash
npm run test:a11y  # WCAG 2.1 AA validering
```

### Testprioriteringer
1. **Kritisk**: DNB Eufemia-kompatibilitet
2. **Kritisk**: Responsive design (mobil, tablet, desktop)
3. **Høy**: Svindeldeteksjon-nøyaktighet
4. **Høy**: Tilgjengelighet (WCAG 2.1 AA)
5. **Medium**: Dark mode-støtte
6. **Medium**: Språkbytte (nb/en)

## Performance Guidelines

### Mobile First
- **ALLTID** start design for mobilskjermer
- Progressive enhancement for større skjermer
- Touch-vennlige interaksjoner (min 44x44px)

### Lazy Loading
```typescript
// Tesseract.js lastes kun ved behov
const loadOCR = async () => {
  const { createWorker } = await import('tesseract.js');
  // ...
};
```

### Bildehåndtering
- Maks filstørrelse: 10 MB
- Støttede formater: PNG, JPG, JPEG, PDF
- Automatisk komprimering før prosessering
- WebP for statiske bilder når mulig

### Bundle-optimalisering
- Code splitting per rute
- Tree shaking for ubrukt kode
- Minifisering i produksjon
- DNB Eufemia lastes som ekstern pakke

### Ytelsesmål (Core Web Vitals)
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTI** (Time to Interactive): < 3.8s

## Security Best Practices

### Databehandling
- **INGEN** data sendes til servere uten eksplisitt samtykke
- All standard analyse skjer 100% lokalt
- Ingen cookies for sporing
- Ingen tredjepartsanalyse (Google Analytics, etc.)

### Content Security Policy
```javascript
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{nonce}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  worker-src 'self' blob:;
  connect-src 'self' https://api.dnb.no;
```

### Input-validering
- Sanitér all brukerinput
- Valider filtyper og -størrelser
- Sjekk for malware i opplastede filer
- Rate limiting på API-kall

### Personvern (GDPR)
- Ingen langtidslagring av brukerdata
- Eksplisitt samtykke for dyp sjekk
- Umiddelbar sletting etter analyse
- Tydelig personvernerklæring

## Deployment Checklist

### 🛑 PRE-COMMIT CHECKLIST - OBLIGATORISK

**STOPP! Før du committer, BEKREFT ALLE punkter:**

```bash
# 1. DESIGN COMPLIANCE CHECK
[ ] DNB.no sammenligning utført?
[ ] Ingen custom CSS lagt til?
[ ] Kun DNB Eufemia komponenter brukt?
[ ] Farger matcher DNB palette (Sea Green #007272)?
[ ] Spacing bruker DNB tokens (small, medium, large)?
[ ] Typography følger DNB standard?

# 2. KOMPONENT CHECK
git diff | grep -E "import.*from" | grep -v "@dnb/eufemia"
# ↑ Skal IKKE vise noen UI-biblioteker

# 3. STYLING CHECK
git diff src/app/globals.css
# ↑ Skal være TOM (ingen endringer)

git diff | grep -E "style=|className="
# ↑ Skal IKKE vise custom styling

# 4. VISUELL TEST
npx playwright test tests/visual
# ↑ MÅ passere 100%

# 5. DNB EUFEMIA VERSJON
npm list @dnb/eufemia | grep "10.80.0"
# ↑ MÅ være 10.80.0

# 6. FINAL VALIDERING
npm run lint
npm test
npm run build
```

### ⚠️ HVIS NOE FEILER = IKKE COMMIT
```bash
git reset --hard  # Forkast endringer
git checkout 4deda88  # Tilbake til godkjent design
```

### Før produksjon
1. ✅ **DNB Design Compliance**: Kjør pre-commit checklist ovenfor
2. ✅ **Visuell validering**: Sammenlign med DNB.no
3. ✅ **Kjør alle tester**: `npm test && npm run test:e2e`
4. ✅ **Sjekk konsoll**: Ingen feil eller advarsler
5. ✅ **Responsive test**: Mobil, tablet, desktop, TV
6. ✅ **Dark mode**: Test begge temaer
7. ✅ **Språk**: Test nb og en
8. ✅ **Tilgjengelighet**: WCAG 2.1 AA validering
9. ✅ **Ytelse**: Lighthouse score > 90
10. ✅ **Sikkerhet**: CSP headers konfigurert
11. ✅ **Build**: `npm run build` uten feil

### Deployment-kommandoer
```bash
# Bygg for produksjon
npm run build

# Test produksjonsbygg lokalt
npm run preview

# Deploy til Vercel
vercel --prod

# Deploy til andre platformer
npm run build && npm start
```

### Miljøvariabler
```env
# Produksjon
NODE_ENV=production
ANALYSIS_API_KEY=<encrypted_key>  # Kun for dyp sjekk
NEXT_PUBLIC_DNB_API_URL=https://api.dnb.no
```

## Commit Message Format

### Konvensjoner (Conventional Commits)
Bruk alltid standardiserte commit-meldinger:

```bash
# Features
feat: legg til støtte for PDF-analyse
feat(ocr): forbedre tekstgjenkjenning for håndskrift

# Bug fixes
fix: fiks viewport-problemer på mobil
fix(dark-mode): korriger kontrastforhold i mørk modus

# Ytelsesforbedringer
perf: optimaliser bildeanalyse for store filer
perf(ocr): reduser minnebruk ved PDF-prosessering

# Dokumentasjon
docs: oppdater CLAUDE.md med DNB-krav
docs(api): dokumenter nye API-endepunkter

# Refaktorering
refactor: migrer til DNB Eufemia v2
refactor(components): forenkle DNBInput-komponenten

# Tester
test: legg til e2e-tester for responsive design
test(a11y): valider WCAG 2.1 AA-kompatibilitet

# Vedlikehold
chore: oppdater DNB Eufemia til v1.2.3
chore(deps): oppgrader Next.js til 14.2.0
```

### Scope-eksempler
- `(eufemia)`: DNB Eufemia-relaterte endringer
- `(ocr)`: OCR/tekstgjenkjenning
- `(ui)`: Brukergrensesnitt
- `(a11y)`: Tilgjengelighet
- `(i18n)`: Internasjonalisering
- `(dark-mode)`: Mørk modus
- `(security)`: Sikkerhet

## 🚨 RECOVERY INSTRUCTIONS - VED DESIGN-BRUDD

### HVIS DESIGNET ER ØDELAGT - GJØR DETTE UMIDDELBART:

```bash
# STEG 1: STOPP ALT
ctrl+c  # Stopp dev server

# STEG 2: SJEKK CURRENT STATE
git status
git diff

# STEG 3: ROLLBACK TIL GODKJENT DESIGN
git reset --hard 4deda88
# ELLER hvis du har uncommitted changes du vil beholde:
git stash
git checkout 4deda88

# STEG 4: REINSTALLER DEPENDENCIES
rm -rf node_modules package-lock.json
npm install

# STEG 5: VERIFISER DNB EUFEMIA
npm list @dnb/eufemia  # Skal vise 10.80.0

# STEG 6: START OG TEST
npm run dev
# Åpne http://localhost:3000
# Sammenlign med DNB.no

# STEG 7: HVIS FORTSATT ØDELAGT
git clean -fd  # Fjern alle untracked files
git reset --hard 4deda88
npm ci  # Clean install
```

### VANLIGE DESIGN-FEIL OG LØSNINGER:

| Problem | Løsning |
|---------|---------|
| Feil farger | Sjekk at du bruker `var(--color-sea-green)` ikke hex |
| Feil spacing | Bruk DNB tokens: `var(--spacing-medium)` |
| Custom komponenter | Erstatt med DNB Eufemia komponenter |
| Feil font | Sjekk at DNB Eufemia styles er importert |
| Layout ødelagt | Verifiser at du bruker DNB Grid/Flex |

### KONTAKT VED KRITISKE PROBLEMER:
- Git history: Se commit 4deda88 for working state
- DNB Support: design.system@dnb.no
- Slack: #dnb-design-system

## 📐 VISUAL REFERENCE - CURRENT APPROVED DESIGN

### GODKJENTE FARGER (LÅST):
```css
/* DNB Brand Colors - IKKE ENDRE */
--dnb-green: #007272;        /* Sea Green - Primary */
--dnb-green-dark: #004f4f;   /* Sea Green Dark */
--dnb-mint: #40bfbf;         /* Mint Green - Accent */
--dnb-white: #ffffff;        /* White */
--dnb-gray-light: #f8f8f8;  /* Light Gray - Background */
--dnb-gray: #e5e5e5;         /* Gray - Borders */
--dnb-text: #1b1b1b;         /* Text Primary */
--dnb-text-muted: #666666;   /* Text Secondary */
--dnb-error: #c21e25;        /* Error Red */
--dnb-warning: #ff9100;      /* Warning Orange */
--dnb-success: #28a745;      /* Success Green */
```

### GODKJENT SPACING (LÅST):
```css
/* DNB Spacing System - BRUK DISSE */
--spacing-xx-small: 0.25rem;  /* 4px */
--spacing-x-small: 0.5rem;    /* 8px */
--spacing-small: 1rem;        /* 16px */
--spacing-medium: 1.5rem;     /* 24px */
--spacing-large: 2rem;        /* 32px */
--spacing-x-large: 3rem;      /* 48px */
```

### GODKJENT TYPOGRAPHY (LÅST):
```css
/* Font Stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Sizes */
--font-size-small: 0.875rem;   /* 14px */
--font-size-basis: 1rem;       /* 16px */
--font-size-medium: 1.125rem;  /* 18px */
--font-size-large: 1.5rem;     /* 24px */
--font-size-x-large: 2rem;     /* 32px */
```

### GODKJENTE KOMPONENTER:
- **Logo**: DNB Eufemia Logo component, height: 28px
- **Button Primary**: Background #007272, white text, 8px radius
- **Button Secondary**: White background, #007272 border, 8px radius
- **Input Fields**: 2px #e5e5e5 border, 8px radius, 1.25rem padding
- **Cards**: White background, 12px radius, subtle shadow

## Fremtidige forbedringer
- [ ] Integrasjon med DNB's faktiske svindeldeteksjon-API
- [ ] Støtte for flere filformater
- [ ] Forbedret OCR-nøyaktighet
- [ ] Maskinlæringsbasert deteksjon
- [ ] Sanntidsvarslinger
- [ ] BankID-autentisering for lagring av historikk
- [ ] Deling av advarsler med andre DNB-kunder

---

*⚠️ VIKTIG: Denne CLAUDE.md-filen er LÅST for design-seksjoner. Endringer i design-relaterte seksjoner krever godkjenning fra DNB Design System team. Commit 4deda88 er baseline for all design.*
- please remember to always use the systemdate!
- can you please make sure to always use the systemdate - we are not in 2024..
