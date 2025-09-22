'use client';

import React from 'react';
import {
  Button,
  Textarea,
  P,
  FormRow,
  Space,
  Card,
  Icon
} from '@dnb/eufemia';

interface AnalysisStepProps {
  text: string;
  setText: (text: string) => void;
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handlePaste: (e: React.ClipboardEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onRemoveImage: () => void;
}

export default function AnalysisStep({
  text,
  setText,
  imagePreview,
  setImagePreview,
  isAnalyzing,
  onAnalyze,
  onImageUpload,
  handlePaste,
  fileInputRef,
  onRemoveImage
}: AnalysisStepProps) {
  const isButtonDisabled = (text.trim().length < 5 && !imagePreview) || isAnalyzing;

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <Space bottom="large">
        <div style={{ textAlign: 'center' }}>
          <P size="medium">
            Er du usikker på om noe er svindel? Sjekk her:
          </P>
        </div>
      </Space>

      <div style={{ width: '100%' }}>
        <Textarea
          label=""
          placeholder="Lim inn mistenkelig tekst, link eller slipp bilde her. Du kan også legge til ekstra informasjon sammen med bildet."
          value={text}
          onChange={(e) => setText((e.target as HTMLTextAreaElement).value)}
          onPaste={handlePaste}
          disabled={isAnalyzing}
          rows={8}
          stretch
          style={{
            minHeight: '120px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        />

        {/* Image preview below textarea */}
        {imagePreview && (
          <Space top="small">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-small)',
              padding: 'var(--spacing-small)',
              backgroundColor: 'var(--color-mint-green-12)',
              border: '1px solid var(--color-sea-green-30)',
              borderRadius: 'var(--border-radius-small)'
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                borderRadius: 'var(--border-radius-small)',
                overflow: 'hidden',
                flexShrink: 0,
                border: '1px solid var(--color-sea-green-30)'
              }}>
                <img
                  src={imagePreview}
                  alt="Opplastet bilde"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 'var(--font-size-basis)',
                  fontWeight: 600,
                  color: 'var(--color-sea-green)',
                  marginBottom: '2px'
                }}>
                  📎 Bilde er lastet opp
                </div>
                <div style={{
                  fontSize: 'var(--font-size-small)',
                  color: 'var(--color-black-60)'
                }}>
                  Bildet vil bli analysert sammen med teksten din
                </div>
              </div>
              <Button
                variant="tertiary"
                size="small"
                onClick={onRemoveImage}
                icon="close"
                style={{
                  flexShrink: 0,
                  minWidth: 'auto',
                  padding: 'var(--spacing-x-small)'
                }}
              >
                Fjern
              </Button>
            </div>
          </Space>
        )}
      </div>

      <Space top="small" bottom="large">
        <div style={{ textAlign: 'center' }}>
          <P size="small" modifier="medium">
            💡 Tips: Du kan lime inn skjermbilde direkte med Ctrl+V / Cmd+V
          </P>
        </div>
      </Space>

      <Space bottom="medium">
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-medium)',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Button
            variant="primary"
            size="large"
            disabled={isButtonDisabled}
            onClick={onAnalyze}
            style={{ minWidth: '12rem' }}
          >
            {isAnalyzing ? 'Sjekker...' : 'Sjekk'}
          </Button>

          <Button
            variant="secondary"
            size="large"
            disabled={isAnalyzing}
            onClick={() => fileInputRef.current?.click()}
            icon="camera"
            style={{ minWidth: '12rem' }}
          >
            Last opp bilde
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={onImageUpload}
            style={{ display: 'none' }}
          />
        </div>
      </Space>
    </div>
  );
}