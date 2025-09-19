'use client';

import { Heading, P, Space } from '@dnb/eufemia';

interface SimplifiedHeroProps {
  locale: string;
}

export default function SimplifiedHero({ locale }: SimplifiedHeroProps) {
  const isNorwegian = locale === 'nb';
  
  return (
    <div className="simplified-hero">
      {/* Minimalistisk header med DNB logo */}
      <div className="header-strip">
        <div className="logo-section">
          <span className="tagline">T for Trygghet</span>
          <svg className="dnb-logo" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 8V32H13C20.732 32 27 25.732 27 18C27 10.268 20.732 4 13 4H0V8ZM6 10V26H13C17.418 26 21 22.418 21 18C21 13.582 17.418 10 13 10H6Z" fill="white"/>
            <path d="M32 8H38L47 21V8H53V32H47L38 19V32H32V8Z" fill="white"/>
            <path d="M58 8V32H70C74.418 32 78 28.418 78 24C78 21.5 77 19.5 75 18C76.5 16.5 77.5 14.5 77.5 12C77.5 7.582 73.918 4 69.5 4H58ZM64 10H69.5C71.433 10 73 11.567 73 13.5C73 15.433 71.433 17 69.5 17H64V10ZM64 22H70C72.209 22 74 23.791 74 26C74 28.209 72.209 30 70 30H64V22Z" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Hovedtittel - stor og tydelig */}
      <div className="hero-content">
        <div className="title-section">
          <Heading 
            size="xx-large" 
            className="main-title"
          >
            <span className="title-line">SVINDEL</span>
            <span className="title-line">SJEKKEN</span>
          </Heading>
          <div className="checkmark">✓</div>
        </div>

        {/* DNBs budskap */}
        <div className="message-section">
          <P className="trust-message">
            {isNorwegian 
              ? 'Vi stopper 9 av 10 svindelforsøk.'
              : 'We stop 9 out of 10 fraud attempts.'}
          </P>
          <P className="trust-message-bold">
            {isNorwegian 
              ? 'Sammen kan vi stoppe resten.'
              : 'Together we can stop the rest.'}
          </P>
        </div>
      </div>

      <style jsx>{`
        .simplified-hero {
          min-height: 50vh;
          background: linear-gradient(135deg, #007272 0%, #005555 100%);
          color: white;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .header-strip {
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 40px;
        }

        .tagline {
          font-size: 14px;
          opacity: 0.9;
          letter-spacing: 0.5px;
        }

        .dnb-logo {
          height: 32px;
          width: auto;
        }

        .hero-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 20px;
          text-align: center;
        }

        .title-section {
          position: relative;
          margin-bottom: 40px;
        }

        .main-title {
          font-size: clamp(48px, 8vw, 96px) !important;
          font-weight: 700 !important;
          letter-spacing: -2px !important;
          line-height: 0.9 !important;
          color: white !important;
          display: flex;
          flex-direction: column;
        }

        .title-line {
          display: block;
        }

        .checkmark {
          position: absolute;
          right: -60px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 80px;
          color: #40BFBF;
          font-weight: bold;
        }

        .message-section {
          max-width: 600px;
        }

        .trust-message {
          font-size: 20px !important;
          color: white !important;
          opacity: 0.95;
          margin-bottom: 8px !important;
        }

        .trust-message-bold {
          font-size: 24px !important;
          font-weight: 600 !important;
          color: white !important;
        }

        @media (max-width: 768px) {
          .header-strip {
            padding: 16px 20px;
          }

          .logo-section {
            gap: 20px;
          }

          .tagline {
            font-size: 12px;
          }

          .dnb-logo {
            height: 24px;
          }

          .hero-content {
            padding: 20px;
          }

          .main-title {
            font-size: clamp(36px, 10vw, 64px) !important;
          }

          .checkmark {
            font-size: 50px;
            right: -30px;
          }

          .trust-message {
            font-size: 16px !important;
          }

          .trust-message-bold {
            font-size: 18px !important;
          }
        }

        @media (max-width: 480px) {
          .checkmark {
            position: static;
            transform: none;
            margin-top: 20px;
          }

          .tagline {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}