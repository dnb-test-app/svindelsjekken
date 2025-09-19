import { analyzeText } from '../textRules';

describe('textRules', () => {
  describe('analyzeText', () => {
    it('should detect urgency language', () => {
      const text = 'Din konto sperres umiddelbart hvis du ikke handler nå!';
      const result = analyzeText(text);
      
      expect(result.triggers).toContainEqual(
        expect.objectContaining({
          type: 'urgency'
        })
      );
      expect(result.risk_score).toBeGreaterThan(0);
    });

    it('should detect credential requests', () => {
      const text = 'Vennligst oppgi ditt BankID passord for verifisering.';
      const result = analyzeText(text);
      
      expect(result.triggers).toContainEqual(
        expect.objectContaining({
          type: 'credentials'
        })
      );
    });

    it('should detect phishing keywords', () => {
      const text = 'Klikk her for å bekrefte kontoen din';
      const result = analyzeText(text);
      
      expect(result.triggers).toContainEqual(
        expect.objectContaining({
          type: 'phishing_keywords'
        })
      );
    });

    it('should detect cryptocurrency scams', () => {
      const text = 'Invester i Bitcoin nå og tjen millioner!';
      const result = analyzeText(text);
      
      expect(result.triggers).toContainEqual(
        expect.objectContaining({
          type: 'cryptocurrency'
        })
      );
    });

    it('should calculate risk levels correctly', () => {
      const lowRiskText = 'Dette er en vanlig melding uten mistenkelig innhold.';
      const lowResult = analyzeText(lowRiskText);
      expect(lowResult.risk_level).toBe('low');

      const highRiskText = 'HASTER! Oppgi BankID kode nå eller kontoen sperres! Klikk her: http://dnb-no.com';
      const highResult = analyzeText(highRiskText);
      expect(highResult.risk_level).toBe('high');
      expect(highResult.risk_score).toBeGreaterThanOrEqual(60);
    });

    it('should generate appropriate recommendations', () => {
      const highRiskText = 'Send BankID kode til dette nummeret umiddelbart!';
      const result = analyzeText(highRiskText);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some((r: string) => 
        r.includes('IKKE oppgi') || r.includes('DNB')
      )).toBeTruthy();
    });
  });
});