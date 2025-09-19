'use client';

import { Heading, P, Space } from '@dnb/eufemia';

interface DNBHeroProps {
  locale: string;
}

export default function DNBHero({ locale }: DNBHeroProps) {
  const isNorwegian = locale === 'nb';
  
  return (
    <div className="dnb-hero">
      <div className="hero-content">
        {/* DNB Logo */}
        <div className="logo-container">
          <svg width="120" height="48" viewBox="0 0 120 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M0 8.5V39.5H13.5C22.6127 39.5 30 32.1127 30 23C30 13.8873 22.6127 6.5 13.5 6.5H0V8.5ZM6 14.5V32.5H13.5C18.7467 32.5 23 28.2467 23 23C23 17.7533 18.7467 13.5 13.5 13.5H6V14.5Z" fill="#007272"/>
            <path d="M35 8.5H41L50 25.5V8.5H56V39.5H50L41 22.5V39.5H35V8.5Z" fill="#007272"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M62 8.5V39.5H75C79.9706 39.5 84 35.4706 84 30.5C84 27.5 82.5 25 80 23.5C81.5 22 82.5 20 82.5 17.5C82.5 12.5294 78.4706 8.5 73.5 8.5H62ZM68 14.5H73.5C75.433 14.5 77 16.067 77 18C77 19.933 75.433 21.5 73.5 21.5H68V14.5ZM68 27.5H75C77.2091 27.5 79 29.2909 79 31.5C79 33.7091 77.2091 35.5 75 35.5H68V27.5Z" fill="#007272"/>
            {/* Subtitle */}
            <text x="90" y="30" fill="#007272" fontSize="20" fontWeight="600" fontFamily="system-ui">
              {isNorwegian ? 'Trygg' : 'Safe'}
            </text>
          </svg>
        </div>

        <Space top="large">
          <Heading 
            size="xx-large" 
            level="1"
            style={{
              textAlign: 'center',
              color: '#1b1b1b',
              fontWeight: 600,
              letterSpacing: '-0.02em'
            }}
          >
            {isNorwegian ? 'Svindelsjekk' : 'Fraud Check'}
          </Heading>
        </Space>

        <Space top="small">
          <P 
            size="medium"
            style={{
              textAlign: 'center',
              color: '#555',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6
            }}
          >
            {isNorwegian 
              ? 'Er du usikker på om en melding er ekte? Sjekk den her for å få en umiddelbar vurdering.'
              : 'Unsure if a message is genuine? Check it here for an instant assessment.'}
          </P>
        </Space>

        {/* Trust indicators */}
        <Space top="large">
          <div className="trust-indicators">
            <div className="indicator">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" fill="#28a745"/>
                <path d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="white"/>
              </svg>
              <span>{isNorwegian ? 'Sikker analyse' : 'Secure analysis'}</span>
            </div>
            <div className="indicator">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L18.59 5.58L20 7L10 17Z" fill="#007272"/>
              </svg>
              <span>{isNorwegian ? 'Lokal prosessering' : 'Local processing'}</span>
            </div>
            <div className="indicator">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="#007272" strokeWidth="2" fill="none"/>
                <text x="12" y="16" textAnchor="middle" fill="#007272" fontSize="10" fontWeight="bold">DNB</text>
              </svg>
              <span>{isNorwegian ? 'DNB-verifisert' : 'DNB verified'}</span>
            </div>
          </div>
        </Space>
      </div>

      <style jsx>{`
        .dnb-hero {
          padding: 48px 16px;
          max-width: 100%;
          margin: 0 auto;
          width: 100%;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
          width: 100%;
        }

        .trust-indicators {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          width: 100%;
          padding: 0 8px;
        }

        .indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: transform 0.2s ease;
          white-space: nowrap;
        }

        .indicator:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .indicator span {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        @media (max-width: 640px) {
          .dnb-hero {
            padding: 32px 8px;
          }

          .trust-indicators {
            gap: 8px;
            padding: 0 4px;
          }

          .indicator {
            padding: 6px 10px;
            font-size: 12px;
          }

          .indicator span {
            font-size: 12px;
          }

          .indicator svg {
            width: 20px;
            height: 20px;
          }
        }

        @media (min-width: 768px) {
          .dnb-hero {
            padding: 48px 24px;
          }

          .trust-indicators {
            gap: 24px;
          }
        }
      `}</style>
    </div>
  );
}