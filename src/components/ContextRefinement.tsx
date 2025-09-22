'use client';

import React, { useState } from 'react';
import { Button, Textarea } from '@dnb/eufemia';

interface ContextRefinementProps {
  followUpQuestions: string[];
  onRefineAnalysis: (questionAnswers: Record<string, 'yes' | 'no'>, additionalContext: string) => void;
  isAnalyzing?: boolean;
}

export default function ContextRefinement({
  followUpQuestions,
  onRefineAnalysis,
  isAnalyzing = false
}: ContextRefinementProps) {
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, 'yes' | 'no'>>({});
  const [additionalContext, setAdditionalContext] = useState('');

  const handleQuestionAnswer = (question: string, answer: 'yes' | 'no') => {
    setQuestionAnswers(prev => ({
      ...prev,
      [question]: answer
    }));
  };

  const handleRefineAnalysis = () => {
    const allQuestionsAnswered = followUpQuestions.length === Object.keys(questionAnswers).length;
    if (allQuestionsAnswered) {
      onRefineAnalysis(questionAnswers, additionalContext);
    }
  };

  const allQuestionsAnswered = followUpQuestions.length === Object.keys(questionAnswers).length;
  const hasContext = allQuestionsAnswered;

  return (
    <div style={{
      background: 'var(--color-mint-green-12)',
      border: '2px solid var(--color-sea-green-30)',
      borderRadius: '12px',
      padding: 'var(--spacing-large)',
      marginTop: 'var(--spacing-large)',
      marginBottom: 'var(--spacing-medium)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-small)',
        marginBottom: 'var(--spacing-medium)'
      }}>
        <span style={{ fontSize: '1.5rem' }}>🎯</span>
        <h3 style={{
          margin: 0,
          fontSize: 'var(--font-size-large)',
          fontWeight: 600,
          color: 'var(--color-sea-green)'
        }}>
          Tilpass analysen - legg til kontekst
        </h3>
      </div>

      {/* Description */}
      <p style={{
        margin: '0 0 var(--spacing-medium) 0',
        fontSize: 'var(--font-size-basis)',
        color: 'var(--color-black-80)',
        lineHeight: 1.5
      }}>
        Klikk på spørsmålene som er relevante for deg, eller skriv inn ekstra informasjon for en mer presis analyse.
      </p>

      {/* Follow-up Questions */}
      {followUpQuestions && followUpQuestions.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-medium)' }}>
          <h4 style={{
            margin: '0 0 var(--spacing-small) 0',
            fontSize: 'var(--font-size-medium)',
            fontWeight: 500,
            color: 'var(--color-black-80)'
          }}>
            Relevante spørsmål:
          </h4>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-medium)'
          }}>
            {followUpQuestions.map((question, index) => {
              const currentAnswer = questionAnswers[question];

              return (
                <div
                  key={index}
                  style={{
                    background: 'var(--color-white)',
                    border: `1px solid var(--color-sea-green-30)`,
                    borderRadius: '8px',
                    padding: 'var(--spacing-medium)',
                    opacity: isAnalyzing ? 0.6 : 1
                  }}
                >
                  <div style={{
                    marginBottom: 'var(--spacing-small)',
                    fontSize: 'var(--font-size-basis)',
                    fontWeight: 500,
                    color: 'var(--color-black-80)',
                    lineHeight: 1.4
                  }}>
                    {question}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-small)'
                  }}>
                    <Button
                      variant={currentAnswer === 'yes' ? 'primary' : 'secondary'}
                      size="small"
                      disabled={isAnalyzing}
                      onClick={() => handleQuestionAnswer(question, 'yes')}
                      style={{
                        minWidth: '80px',
                        fontWeight: currentAnswer === 'yes' ? 600 : 400
                      }}
                    >
                      <span style={{ marginRight: 'var(--spacing-x-small)' }}>
                        {currentAnswer === 'yes' ? '✅' : '○'}
                      </span>
                      JA
                    </Button>

                    <Button
                      variant={currentAnswer === 'no' ? 'primary' : 'secondary'}
                      size="small"
                      disabled={isAnalyzing}
                      onClick={() => handleQuestionAnswer(question, 'no')}
                      style={{
                        minWidth: '80px',
                        fontWeight: currentAnswer === 'no' ? 600 : 400,
                        backgroundColor: currentAnswer === 'no' ? 'var(--color-cherry-red)' : undefined,
                        borderColor: currentAnswer === 'no' ? 'var(--color-cherry-red)' : undefined
                      }}
                    >
                      <span style={{ marginRight: 'var(--spacing-x-small)' }}>
                        {currentAnswer === 'no' ? '❌' : '○'}
                      </span>
                      NEI
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Free Text Input */}
      <div style={{ marginBottom: 'var(--spacing-medium)' }}>
        <h4 style={{
          margin: '0 0 var(--spacing-small) 0',
          fontSize: 'var(--font-size-medium)',
          fontWeight: 500,
          color: 'var(--color-black-80)'
        }}>
          Tilleggsinformasjon:
        </h4>

        <Textarea
          placeholder="Legg til mer informasjon som kan hjelpe analysen..."
          value={additionalContext}
          onChange={(e) => setAdditionalContext((e.target as HTMLTextAreaElement).value)}
          rows={3}
          disabled={isAnalyzing}
          style={{
            width: '100%',
            border: '2px solid var(--color-sea-green-30)',
            borderRadius: '8px',
            padding: 'var(--spacing-small)',
            fontSize: 'var(--font-size-basis)',
            resize: 'vertical',
            minHeight: '80px'
          }}
        />
      </div>

      {/* Action Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        paddingTop: 'var(--spacing-small)',
        borderTop: '1px solid var(--color-sea-green-30)'
      }}>
        <Button
          variant="primary"
          size="large"
          disabled={!hasContext || isAnalyzing}
          onClick={handleRefineAnalysis}
          style={{
            minWidth: '200px',
            fontWeight: 600
          }}
        >
          {isAnalyzing ? (
            <>
              <span style={{ marginRight: 'var(--spacing-small)' }}>⏳</span>
              Analyserer...
            </>
          ) : (
            <>
              <span style={{ marginRight: 'var(--spacing-small)' }}>🔍</span>
              Se resultater
            </>
          )}
        </Button>
      </div>

      {/* Helper text */}
      {!hasContext && (
        <p style={{
          margin: 'var(--spacing-small) 0 0 0',
          fontSize: 'var(--font-size-small)',
          color: 'var(--color-black-60)',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Du må svare JA eller NEI på alle spørsmålene for å fortsette
        </p>
      )}
    </div>
  );
}