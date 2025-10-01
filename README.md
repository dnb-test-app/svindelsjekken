# DNB Svindelsjekk (DNB Fraud Checker)

A modern web application for fraud detection built with Next.js and the DNB Eufemia design system.

## Features 

### Core Functionality
- **AI-Powered Analysis**: Advanced fraud detection using multiple AI models via OpenRouter API
- **Text Analysis**: Paste suspicious messages, links, or phone numbers for instant evaluation
- **Image Analysis**: Upload screenshots with built-in OCR text extraction (Tesseract.js)
- **URL Verification**: Automatic URL detection with live web search verification
- **Context Refinement**: Interactive follow-up questions for enhanced accuracy
- **Multi-Model Support**: Choose from GPT-5-mini, Claude, Gemini, and other AI models

### Security & Protection
- **Multi-Tier Rate Limiting**: 10 requests/minute, 30/hour, 100/day per user + global limits
- **Prompt Injection Detection**: Advanced security against AI manipulation attempts
- **Input Sanitization**: Comprehensive validation and cleaning of user input
- **Response Validation**: Ensures AI responses maintain DNB context and accuracy
- **Zod Schema Validation**: Runtime type safety for all API communications

### User Experience
- **Instant Risk Assessment**: Immediate feedback with clear risk levels (Low/Medium/High)
- **Actionable Recommendations**: Specific guidance based on threat analysis
- **DNB Eufemia Design**: Professional, accessible UI matching DNB standards
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Dark Mode Support**: Automatic theme switching based on system preferences

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **DNB Eufemia**: Official DNB design system
- **Tesseract.js**: Browser-based OCR for image text extraction

### Backend & APIs
- **OpenRouter API**: Multi-model AI integration
- **Zod**: Schema validation and runtime type checking
- **Rate Limiting**: Sliding window algorithm with multi-tier protection
- **Security Middleware**: Prompt injection detection, input sanitization

### Infrastructure
- **Bun**: Fast JavaScript runtime and package manager
- **Docker**: Containerized deployment
- **Next.js Middleware**: Security headers, rate limiting, session management

## Installation

### Prerequisites
- Bun runtime installed
- OpenRouter API key (required)

### Setup

```bash
# Install dependencies
bun install

# Create environment file
cp .env.example .env.local

# Add your OpenRouter API key to .env.local
# OPENROUTER_API_KEY=your_key_here

# Start development server
bun run dev
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Required
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional
NEXT_PUBLIC_DEFAULT_MODEL=openai/gpt-5-mini
```

## Development

```bash
# Install dependencies
bun install

# Run development server (http://localhost:3000)
bun run dev

# Build for production
bun run build

# Start production server
bun start

# Lint code
bun run lint
```

## Docker Deployment

```bash
# Build Docker image
docker build -t dnb-svindelsjekk .

# Run container
docker run -p 3000:3000 -e OPENROUTER_API_KEY=your_key dnb-svindelsjekk
```

## Architecture Overview

```
User Input (Text/Image)
    ↓
Frontend (Next.js + Eufemia)
    ↓
Rate Limiting Middleware
    ↓
API Route (/api/analyze)
    ↓
Input Sanitization & Validation
    ↓
OpenRouter API (GPT-5-mini/Claude/Gemini)
    ↓
Response Validation
    ↓
Fraud Risk Assessment
    ↓
User Interface (Results + Recommendations)
```

## Key Features Explained

### Rate Limiting
Protects against abuse with sliding window algorithm:
- **Per-User**: 10 req/min, 30 req/hour, 100 req/day
- **Global**: 200 req/min, 2000 req/hour, 10000 req/day
- **Session-Based**: Tracks via session ID with IP fallback

### OCR Integration
Client-side text extraction from images:
- Supports PNG, JPG, JPEG formats
- Norwegian and English language support
- Real-time progress feedback
- Max file size: 10MB

### URL Verification
Intelligent URL detection and verification:
- Automatic extraction from text and images
- Live web search for legitimacy verification
- Warning for suspicious redirects
- Domain reputation checking

### AI Model Selection
Flexible model switching:
- Default: GPT-5-mini (fast, cost-effective)
- Advanced: Claude Sonnet 4.5, GPT-4o
- Vision models for image analysis
- Automatic fallback on errors

## Security

### Implemented Protections
- Content Security Policy (CSP) headers
- Prompt injection detection and blocking
- Input sanitization (XSS prevention)
- Response validation (AI context enforcement)
- Rate limiting (abuse prevention)
- Session-based tracking (GDPR-friendly)

### Privacy
- No long-term data storage
- Session-only cookies
- No third-party analytics
- API requests encrypted (HTTPS)

## DNB's Message

**Norwegian**: "Vi stopper 9 av 10 svindelforsøk. Sammen kan vi stoppe resten."

**English**: "We stop 9 out of 10 fraud attempts. Together we can stop the rest."

---

© 2025 DNB
