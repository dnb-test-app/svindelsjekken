'use client';

interface SecurityAdviceProps {
  locale: string;
}

export default function SecurityAdvice({ locale }: SecurityAdviceProps) {
  const isNorwegian = locale === 'nb';
  
  return (
    <section className="security-advice">
      <div className="advice-container">
        <div className="advice-header">
          <div className="dnb-security-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" 
                    fill="currentColor" opacity="0.1"/>
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{isNorwegian ? 'DNBs sikkerhetsråd' : 'DNB Security Advice'}</span>
          </div>
        </div>

        <div className="advice-grid">
          <div className="advice-card critical">
            <div className="advice-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                <path d="M10 6v5m0 3h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>{isNorwegian ? 'Aldri oppgi dette' : 'Never share this'}</h3>
            <p>
              {isNorwegian 
                ? 'DNB vil ALDRI spørre om BankID, passord, PIN-koder eller engangskoder på telefon, SMS eller e-post.'
                : 'DNB will NEVER ask for BankID, passwords, PIN codes or one-time codes via phone, SMS or email.'}
            </p>
          </div>

          <div className="advice-card warning">
            <div className="advice-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L2 18h16L10 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M10 8v4m0 2h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>{isNorwegian ? 'Vær mistenksom' : 'Be suspicious'}</h3>
            <p>
              {isNorwegian 
                ? 'Stol aldri på henvendelser som skaper hastverk eller press. Svindlere bruker frykt og tidsnød for å lure deg.'
                : 'Never trust contacts that create urgency or pressure. Fraudsters use fear and time pressure to trick you.'}
            </p>
          </div>

          <div className="advice-card info">
            <div className="advice-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                <path d="M10 14v-4m0-2h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>{isNorwegian ? 'Sjekk alltid' : 'Always verify'}</h3>
            <p>
              {isNorwegian 
                ? 'Verifiser alltid avsender. Bruk kun offisielle kanaler fra dnb.no. Ved tvil - slett meldingen.'
                : 'Always verify the sender. Only use official channels from dnb.no. When in doubt - delete the message.'}
            </p>
          </div>
        </div>

        <div className="action-section">
          <h2>{isNorwegian ? 'Hva gjør jeg hvis jeg er svindlet?' : 'What if I\'ve been scammed?'}</h2>
          
          <div className="action-steps">
            <div className="action-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>{isNorwegian ? 'Kontakt DNB hvis du har delt informasjon' : 'Contact DNB if you shared information'}</h4>
                <p>{isNorwegian 
                  ? 'Ring 915 04800 BARE hvis du har oppgitt personlig info eller klikket på lenker' 
                  : 'Call 915 04800 ONLY if you shared personal info or clicked links'}</p>
              </div>
            </div>

            <div className="action-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>{isNorwegian ? 'Anmeld til politiet' : 'Report to the police'}</h4>
                <p>{isNorwegian 
                  ? 'Anmeld saken på politiet.no eller nærmeste politistasjon' 
                  : 'Report the case at politiet.no or your nearest police station'}</p>
              </div>
            </div>

            <div className="action-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>{isNorwegian ? 'Sikre bevis' : 'Secure evidence'}</h4>
                <p>{isNorwegian 
                  ? 'Ta skjermbilde av svindelforsøket og behold all kommunikasjon' 
                  : 'Take screenshots of the fraud attempt and keep all communication'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="dnb-reference">
          <p>
            {isNorwegian 
              ? 'Basert på DNBs årlige trusselvurdering 2024 og sikkerhetsveiledning' 
              : 'Based on DNB\'s annual threat assessment 2024 and security guidance'}
          </p>
        </div>
      </div>

      <style jsx>{`
        .security-advice {
          padding: 60px 20px;
          background: linear-gradient(180deg, rgba(0, 114, 114, 0.02) 0%, transparent 100%);
        }

        :global([data-theme="dark"]) .security-advice {
          background: linear-gradient(180deg, rgba(64, 224, 208, 0.02) 0%, transparent 100%);
        }

        .advice-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .advice-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .dnb-security-badge {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          background: white;
          border-radius: 100px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
          color: #007272;
          font-weight: 600;
          font-size: 1.125rem;
        }

        :global([data-theme="dark"]) .dnb-security-badge {
          background: rgba(255, 255, 255, 0.1);
          color: #40e0d0;
        }

        .advice-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 60px;
        }

        .advice-card {
          padding: 24px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        :global([data-theme="dark"]) .advice-card {
          background: rgba(255, 255, 255, 0.03);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
        }

        .advice-card.critical {
          border-color: #dc3545;
        }

        .advice-card.warning {
          border-color: #ffc107;
        }

        .advice-card.info {
          border-color: #007272;
        }

        .advice-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .advice-card.critical .advice-icon {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
        }

        .advice-card.warning .advice-icon {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
        }

        .advice-card.info .advice-icon {
          background: rgba(0, 114, 114, 0.1);
          color: #007272;
        }

        .advice-card h3 {
          margin: 0 0 12px;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        :global([data-theme="dark"]) .advice-card h3 {
          color: #fafafa;
        }

        .advice-card p {
          margin: 0;
          color: #6c757d;
          line-height: 1.6;
        }

        :global([data-theme="dark"]) .advice-card p {
          color: #adb5bd;
        }

        .action-section {
          margin-top: 60px;
          padding: 48px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
        }

        :global([data-theme="dark"]) .action-section {
          background: rgba(255, 255, 255, 0.03);
        }

        .action-section h2 {
          margin: 0 0 32px;
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a1a;
          text-align: center;
        }

        :global([data-theme="dark"]) .action-section h2 {
          color: #fafafa;
        }

        .action-steps {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 600px;
          margin: 0 auto;
        }

        .action-step {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .step-number {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #007272 0%, #40e0d0 100%);
          color: white;
          border-radius: 50%;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-content h4 {
          margin: 0 0 8px;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        :global([data-theme="dark"]) .step-content h4 {
          color: #fafafa;
        }

        .step-content p {
          margin: 0;
          color: #6c757d;
        }

        :global([data-theme="dark"]) .step-content p {
          color: #adb5bd;
        }

        .dnb-reference {
          text-align: center;
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid rgba(0, 114, 114, 0.1);
        }

        :global([data-theme="dark"]) .dnb-reference {
          border-top-color: rgba(64, 224, 208, 0.1);
        }

        .dnb-reference p {
          color: #6c757d;
          font-size: 0.875rem;
        }

        :global([data-theme="dark"]) .dnb-reference p {
          color: #adb5bd;
        }

        @media (max-width: 768px) {
          .advice-grid {
            grid-template-columns: 1fr;
          }

          .action-section {
            padding: 32px 20px;
          }
        }
      `}</style>
    </section>
  );
}