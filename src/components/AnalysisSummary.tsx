import { Card, Heading, P, Icon, Space } from '@dnb/eufemia';
import type { AnalysisResult } from '@/lib/types';

interface AnalysisSummaryProps {
  result: AnalysisResult;
  messages: any;
}

export default function AnalysisSummary({ result, messages }: AnalysisSummaryProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'var(--color-fire-red)';
      case 'medium': return 'var(--color-signal-orange)';
      case 'low': return 'var(--color-summer-green)';
      default: return 'var(--color-black-55)';
    }
  };

  return (
    <Card>
      <Space>
        <Heading size="large">
          {messages.riskLevel || 'Risk Level'}
        </Heading>
        <div style={{ 
          padding: '1rem',
          borderRadius: '0.5rem',
          backgroundColor: getRiskColor(result.risk_level) + '22',
          borderLeft: `4px solid ${getRiskColor(result.risk_level)}`
        }}>
          <P size="large" style={{ color: getRiskColor(result.risk_level), fontWeight: 600 }}>
            {result.risk_level.toUpperCase()}
          </P>
          <P>
            {messages.riskScore || 'Risk Score'}: {result.risk_score}%
          </P>
        </div>
      </Space>
      
      {result.triggers.length > 0 && (
        <Space top="large">
          <Heading size="medium">{messages.triggers || 'Warning Signs'}</Heading>
          {result.triggers.map((trigger, idx) => (
            <Card key={idx} filled style={{ marginBottom: '0.5rem' }}>
              <P size="small">
                <strong>{trigger.type}:</strong> {trigger.description}
              </P>
            </Card>
          ))}
        </Space>
      )}
      
      {result.recommendations.length > 0 && (
        <Space top="large">
          <Heading size="medium">{messages.recommendations || 'Recommendations'}</Heading>
          <ul>
            {result.recommendations.map((rec, idx) => (
              <li key={idx}>
                <P>{rec}</P>
              </li>
            ))}
          </ul>
        </Space>
      )}
    </Card>
  );
}