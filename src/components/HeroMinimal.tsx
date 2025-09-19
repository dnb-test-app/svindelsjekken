'use client';

import { P } from '@dnb/eufemia/elements';

interface HeroMinimalProps {
  title: string;
  tagline: string;
}

export default function HeroMinimal({ title, tagline }: HeroMinimalProps) {
  return (
    <div className="hero-minimal">
      <div className="hero-content">
        <h1 className="hero-title dnb-h--xx-large">
          {title}
        </h1>
        <P className="hero-tagline">
          {tagline}
        </P>
      </div>
      
      <style jsx>{`
        .hero-minimal {
          text-align: center;
          padding: var(--spacing-large) 0 var(--spacing-medium);
          position: relative;
        }
        
        .hero-content {
          max-width: 600px;
          margin: 0 auto;
        }
        
        :global(.hero-title) {
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: var(--spacing-small);
          background: linear-gradient(135deg, var(--color-sea-green) 0%, var(--color-emerald-green) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        :global([data-theme="dark"] .hero-title) {
          background: linear-gradient(135deg, #40BFBF 0%, #5ED9D9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
        
        :global(.hero-tagline) {
          font-size: var(--font-size-basis);
          color: var(--color-text-muted);
          font-weight: 500;
        }
        
        @media screen and (max-width: 40em) {
          .hero-minimal {
            padding: var(--spacing-medium) var(--spacing-small);
          }
          
          :global(.hero-title) {
            font-size: var(--font-size-x-large);
          }
        }
      `}</style>
    </div>
  );
}