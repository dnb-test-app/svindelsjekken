# DNB Svindelsjekk

A production-ready fraud detection web application built with Next.js 14, TypeScript, and DNB Eufemia design system. The application provides local text and image analysis to help users identify potential fraud attempts.

## Features

- 🌍 **Internationalization (i18n)**: Full support for Norwegian (nb) and English (en)
- 🌓 **Dark Mode**: Complete dark mode support with system preference detection
- 🔒 **Privacy-First**: All analysis runs locally in the browser by default
- 📱 **Mobile-First**: Fully responsive design optimized for mobile devices
- ♿ **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation
- 🚀 **Performance**: Optimized with lazy loading and local processing
- 🛡️ **Security**: Comprehensive CSP headers and security measures

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Library**: DNB Eufemia Design System
- **OCR**: Tesseract.js for local text extraction
- **Image Processing**: EXIF data analysis with exifr
- **Validation**: Zod for schema validation
- **Testing**: Jest, Testing Library, Playwright
- **Accessibility**: Axe-core for automated testing

## Installation

```bash
# Clone the repository
git clone [repository-url]
cd dnb-svindelsjekk

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file for environment-specific configuration:

```env
# Optional: API key for deep analysis (if using external LLM)
ANALYSIS_API_KEY=your_api_key_here
```

## Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  "test:e2e": "playwright test",
  "test:a11y": "playwright test tests/e2e/a11y.spec.ts"
}
```

## Project Structure

```
dnb-svindelsjekk/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx          # Root layout with Eufemia theme
│   │   │   ├── page.tsx            # Home page
│   │   │   ├── analyse/page.tsx    # Analysis results page
│   │   │   ├── om/page.tsx         # About page
│   │   │   └── personvern/page.tsx # Privacy page
│   │   └── api/
│   │       └── analyze/route.ts    # Deep check API endpoint
│   ├── components/
│   │   ├── Header.tsx               # App header with language/theme switchers
│   │   ├── LanguageSwitcher.tsx    # Language selection component
│   │   ├── ThemeToggle.tsx         # Theme mode toggle
│   │   ├── UploadBox.tsx           # File upload component
│   │   ├── PasteBox.tsx            # Text input component
│   │   ├── AnalysisSummary.tsx     # Risk assessment display
│   │   └── Chips.tsx               # Trigger tags display
│   ├── lib/
│   │   ├── i18n.ts                 # Internationalization utilities
│   │   ├── theme.ts                # Theme management utilities
│   │   ├── textRules.ts            # Fraud detection heuristics
│   │   └── image.ts                # OCR and image processing
│   ├── hooks/
│   │   ├── useAnalyzeLocal.ts      # Local analysis hook
│   │   └── useAnalyzeRemote.ts     # Remote analysis hook
│   └── middleware.ts                # Locale routing and CSP headers
├── messages/
│   ├── nb.json                     # Norwegian translations
│   └── en.json                     # English translations
├── tests/
│   └── e2e/
│       ├── i18n.spec.ts            # Internationalization tests
│       ├── theme.spec.ts           # Theme switching tests
│       ├── analysis.spec.ts        # Analysis functionality tests
│       └── a11y.spec.ts            # Accessibility tests
└── public/                         # Static assets
```

## Internationalization (i18n)

The application supports multiple languages through the `[locale]` routing pattern:

### Adding a New Language

1. Create a new translation file in `messages/`:
```json
// messages/de.json
{
  "heroTitle": "Prüfen Sie auf möglichen Betrug",
  // ... other translations
}
```

2. Update supported locales in `src/lib/i18n.ts`:
```typescript
export const locales: Locale[] = ['nb', 'en', 'de'];
```

3. Update the middleware configuration in `src/middleware.ts`:
```typescript
const locales = ['nb', 'en', 'de'];
```

### Language Detection

The application automatically detects the user's preferred language from:
1. Cookie preference (`locale`)
2. Accept-Language header
3. Default to Norwegian (`nb`)

## Theme System

The application supports three theme modes:
- **Light**: Light color scheme
- **Dark**: Dark color scheme
- **System**: Follows OS preference

### Customizing Colors

Theme colors are defined in `src/app/[locale]/globals.css`:

```css
:root {
  --color-surface: var(--color-white);
  --color-text: var(--color-black-80);
  /* ... other colors */
}

[data-theme="dark"] {
  --color-surface: #1a1a1a;
  --color-text: #ffffff;
  /* ... dark mode colors */
}
```

## Fraud Detection Rules

The application uses heuristic-based rules to detect potential fraud:

### Rule Categories

- **Urgency Language**: Detects pressure tactics
- **Credential Requests**: Identifies requests for sensitive information
- **Domain Analysis**: Checks for suspicious domains
- **Phishing Keywords**: Common phishing terms
- **Too Good to Be True**: Unrealistic promises
- **Remote Access**: Remote desktop tool mentions
- **Gift Cards**: Payment via gift cards
- **Cryptocurrency**: Crypto-related scams

### Adding New Rules

Edit `src/lib/textRules.ts` to add new detection patterns:

```typescript
const newPattern = ['suspicious', 'pattern'];
// Add to appropriate detection logic
```

## Deep Check Feature

The optional deep check sends content to the server for enhanced analysis:

1. User must explicitly opt-in via checkbox
2. Data is sent encrypted to `/api/analyze`
3. Server processes and immediately deletes data
4. No data persistence or third-party sharing

### Enabling LLM Integration

To connect an actual LLM for deep analysis:

1. Set the `ANALYSIS_API_KEY` environment variable
2. Modify `src/app/api/analyze/route.ts` to call your LLM provider
3. Ensure response matches the expected schema

## Security

### Content Security Policy (CSP)

The application implements strict CSP headers:
- Script sources limited to self with nonce
- No inline scripts (except required styles for Eufemia)
- Worker sources allowed for Tesseract.js
- Strict frame and object restrictions

### Data Privacy

- **Local Processing**: All standard analysis runs in the browser
- **No Tracking**: No analytics or tracking cookies
- **Explicit Consent**: Server processing requires user opt-in
- **Immediate Deletion**: Server data deleted after processing

## Testing

### Unit Tests

```bash
npm test
```

Tests core functionality including:
- Text analysis rules
- Domain detection
- Risk scoring algorithms

### End-to-End Tests

```bash
npm run test:e2e
```

Comprehensive E2E test scenarios:
1. **i18n**: Language switching and persistence
2. **Theme**: Dark mode toggle and system preference
3. **Upload**: Image upload and OCR processing
4. **Deep Check**: Opt-in server analysis
5. **Accessibility**: WCAG compliance
6. **Privacy**: No unauthorized network calls

### Accessibility Testing

```bash
npm run test:a11y
```

Automated accessibility testing with Axe-core:
- WCAG 2.1 AA compliance
- Keyboard navigation
- ARIA labels and roles
- Focus management

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Considerations

- Set `NODE_ENV=production`
- Configure `ANALYSIS_API_KEY` if using deep check
- Ensure proper CSP headers are maintained
- Use HTTPS in production

## CI/CD Pipeline

The project includes GitHub Actions workflow for:
- Linting and type checking
- Unit test execution
- E2E test suite
- Accessibility validation
- Build verification

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimization

- Lazy loading of Tesseract.js
- Image optimization and size limits
- Efficient state management
- Code splitting by route

## Troubleshooting

### Common Issues

1. **OCR not working**: Ensure Tesseract.js workers load properly
2. **Theme not persisting**: Check cookie settings
3. **Language detection fails**: Verify Accept-Language header

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

[License information]

## Support

For questions or issues:
- GitHub Issues: [repository-issues-url]
- Email: personvern@dnb.no
