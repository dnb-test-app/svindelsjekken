'use client';

import React from 'react';
import { ProgressIndicator, Heading, P, Space } from '@dnb/eufemia';

export default function LoadingAnalysis() {
  return (
    <div
      style={{
        maxWidth: '48rem',
        margin: '0 auto',
        textAlign: 'center',
        padding: 'var(--spacing-xx-large)',
      }}
    >
      <div
        style={{
          background: 'var(--color-mint-green-12)',
          border: '2px solid var(--color-sea-green-30)',
          borderRadius: '12px',
          padding: 'var(--spacing-x-large)',
        }}
      >
        <div style={{ marginBottom: 'var(--spacing-medium)' }}>
          <ProgressIndicator
            size="large"
            type="circular"
            style={{
              color: 'var(--color-sea-green)',
              marginBottom: 'var(--spacing-medium)',
            }}
          />
        </div>
        <Heading
          size="x-large"
          level="3"
          style={{
            margin: '0 0 var(--spacing-small) 0',
            color: 'var(--color-sea-green)',
          }}
        >
          Analyserer med AI...
        </Heading>
        <P size="medium" style={{ color: 'var(--color-black-60)' }}>
          Vi bruker avansert AI for å gi deg den mest nøyaktige analysen basert
          på konteksten du oppga.
        </P>
      </div>
    </div>
  );
}