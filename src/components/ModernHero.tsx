'use client';

import { useEffect, useState } from 'react';

interface ModernHeroProps {
  locale: string;
}

export default function ModernHero({ locale }: ModernHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="modern-hero">
      <div className="hero-background">
        <div className="gradient-sphere gradient-sphere-1" />
        <div className="gradient-sphere gradient-sphere-2" />
        <div className="gradient-sphere gradient-sphere-3" />
      </div>
      
      <div className="hero-content">
        <div className="dnb-badge">
          <svg className="dnb-logo" viewBox="0 0 60 24" fill="none">
            <path d="M0 0h10c5.5 0 10 4.5 10 10v4c0 5.5-4.5 10-10 10H0V0z" fill="currentColor"/>
            <path d="M8 8v8h2c2.2 0 4-1.8 4-4s-1.8-4-4-4H8z" fill="var(--color-white)"/>
            <path d="M24 0h10l6 24h-8l-1-4h-4l-1 4h-8l6-24z" fill="currentColor"/>
            <path d="M40 0h10c3.3 0 6 2.7 6 6s-2.7 6-6 6h-2v12h-8V0z" fill="currentColor"/>
          </svg>
          <span className="badge-text">SVINDELSJEKK</span>
        </div>
        
        <h1 className="hero-title">
          {locale === 'nb' ? 'Beskytt deg mot' : 'Protect yourself from'}
          <span className="title-gradient"> svindel</span>
        </h1>
        
        <p className="hero-subtitle">
          {locale === 'nb' 
            ? 'DNB stopper 9 av 10 svindelforsøk. Sammen kan vi stoppe resten.'
            : 'DNB stops 9 out of 10 fraud attempts. Together we can stop the rest.'}
        </p>
        
        <div className="trust-indicators">
          <div className="indicator">
            <span className="indicator-number">150K</span>
            <span className="indicator-label">
              {locale === 'nb' ? 'Ondsinnede e-poster blokkert daglig' : 'Malicious emails blocked daily'}
            </span>
          </div>
          <div className="indicator">
            <span className="indicator-number">90%</span>
            <span className="indicator-label">
              {locale === 'nb' ? 'Svindelforsøk stoppet' : 'Fraud attempts stopped'}
            </span>
          </div>
          <div className="indicator">
            <span className="indicator-number">2024</span>
            <span className="indicator-label">
              {locale === 'nb' ? 'Oppdatert trusselvurdering' : 'Updated threat assessment'}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modern-hero {
          position: relative;
          min-height: 500px;
          overflow: hidden;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        :global([data-theme="dark"]) .modern-hero {
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
        }

        .hero-background {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .gradient-sphere {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.3;
          animation: float 20s infinite ease-in-out;
        }

        .gradient-sphere-1 {
          width: 600px;
          height: 600px;
          background: linear-gradient(135deg, #007272 0%, #40e0d0 100%);
          top: -200px;
          right: -200px;
          animation-delay: 0s;
        }

        .gradient-sphere-2 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #14555a 0%, #007272 100%);
          bottom: -100px;
          left: -100px;
          animation-delay: -7s;
        }

        .gradient-sphere-3 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #40e0d0 0%, #a8e6cf 100%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -14s;
        }

        :global([data-theme="dark"]) .gradient-sphere {
          opacity: 0.15;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 20px;
          text-align: center;
        }

        .dnb-badge {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 100px;
          margin-bottom: 32px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
        }

        :global([data-theme="dark"]) .dnb-badge {
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
        }

        .dnb-logo {
          width: 60px;
          height: 24px;
          color: #007272;
        }

        :global([data-theme="dark"]) .dnb-logo {
          color: #40e0d0;
        }

        .badge-text {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #007272;
        }

        :global([data-theme="dark"]) .badge-text {
          color: #40e0d0;
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 24px;
          color: #1a1a1a;
        }

        :global([data-theme="dark"]) .hero-title {
          color: #fafafa;
        }

        .title-gradient {
          background: linear-gradient(135deg, #007272 0%, #40e0d0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: clamp(1.125rem, 2vw, 1.5rem);
          color: #6c757d;
          max-width: 600px;
          margin: 0 auto 48px;
          line-height: 1.5;
        }

        :global([data-theme="dark"]) .hero-subtitle {
          color: #adb5bd;
        }

        .trust-indicators {
          display: flex;
          justify-content: center;
          gap: 48px;
          flex-wrap: wrap;
        }

        .indicator {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .indicator-number {
          font-size: 2rem;
          font-weight: 700;
          color: #007272;
        }

        :global([data-theme="dark"]) .indicator-number {
          color: #40e0d0;
        }

        .indicator-label {
          font-size: 0.875rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        :global([data-theme="dark"]) .indicator-label {
          color: #adb5bd;
        }

        @media (max-width: 640px) {
          .hero-content {
            padding: 60px 20px;
          }

          .trust-indicators {
            gap: 32px;
          }

          .gradient-sphere-1 {
            width: 400px;
            height: 400px;
          }

          .gradient-sphere-2 {
            width: 300px;
            height: 300px;
          }
        }
      `}</style>
    </div>
  );
}