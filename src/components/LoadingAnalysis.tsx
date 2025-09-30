'use client';

import React from 'react';
import { ProgressIndicator, Heading, P, Space } from '@dnb/eufemia';

export default function LoadingAnalysis() {
  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
      <Space top="xx-large" bottom="xx-large">
        <ProgressIndicator size="large" />
        <Space top="large">
          <Heading size="large" level="3">
            Analyserer med AI...
          </Heading>
          <Space top="medium">
            <div style={{ maxWidth: '32rem', margin: '0 auto' }}>
              <P size="medium">
                Vi bruker avansert AI for å gi deg den mest nøyaktige analysen
                basert på konteksten du oppga.
              </P>
            </div>
          </Space>
        </Space>
      </Space>
    </div>
  );
}