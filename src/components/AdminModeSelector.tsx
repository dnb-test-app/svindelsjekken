'use client';

import React from 'react';
import { Button, Input, P } from '@dnb/eufemia';
import { getModelName } from '@/lib/utils/modelHelpers';
import { UI } from '@/lib/constants/appConstants';

interface Model {
  id: string;
  name?: string;
  provider?: string;
  cost?: string;
  speed?: string;
  status?: 'verified' | 'untested' | 'failed';
  working?: boolean;
  supportsJson?: boolean;
  supportsStructuredOutput?: boolean;
  supportsNativeJSONSchema?: boolean;
  lastTested?: string;
}

interface AdminModeSelectorProps {
  selectedModel: string;
  defaultModel: string;
  availableModels: Model[];
  isLoadingModels: boolean;
  modelFilter: string;
  setModelFilter: (filter: string) => void;
  onModelSelect: (modelId: string) => void;
  onExitAdminMode: () => void;
}

export default function AdminModeSelector({
  selectedModel,
  defaultModel,
  availableModels,
  isLoadingModels,
  modelFilter,
  setModelFilter,
  onModelSelect,
  onExitAdminMode
}: AdminModeSelectorProps) {
  // Filter models based on search
  const filteredModels = availableModels.filter(
    (model) =>
      modelFilter === '' ||
      model.id.toLowerCase().includes(modelFilter.toLowerCase()) ||
      model.name?.toLowerCase().includes(modelFilter.toLowerCase()) ||
      model.provider?.toLowerCase().includes(modelFilter.toLowerCase())
  );

  return (
    <div>
      {/* Admin Mode Indicator - Orange Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-signal-orange)',
          color: 'white',
          padding: 'var(--spacing-x-small) var(--spacing-small)',
          borderRadius: '4px',
          marginBottom: 'var(--spacing-small)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.875rem',
          fontWeight: 'bold',
        }}
      >
        <span>
          🔧 Admin Mode Active - Model:{' '}
          {selectedModel.split('/')[1] || selectedModel}
        </span>
        <Button
          size="small"
          variant="tertiary"
          style={{ color: 'white', border: '1px solid white' }}
          on_click={onExitAdminMode}
        >
          Exit Admin Mode
        </Button>
      </div>

      {isLoadingModels ? (
        <div style={{ padding: 'var(--spacing-medium)', textAlign: 'center' }}>
          <P>Laster tilgjengelige modeller...</P>
        </div>
      ) : availableModels.length > 0 ? (
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-black-20)',
            borderRadius: '8px',
            padding: 'var(--spacing-medium)',
            marginBottom: 'var(--spacing-medium)',
          }}
        >
          <P style={{ marginBottom: 'var(--spacing-small)', fontWeight: 'bold' }}>
            AI Model Selection ({availableModels.length} available):
          </P>

          {/* Search input with icon */}
          <div style={{ marginBottom: 'var(--spacing-small)' }}>
            <Input
              placeholder="Search models (e.g., gpt-4, claude, gemini)..."
              value={modelFilter}
              on_change={(event) => setModelFilter(event.value as string)}
              size="medium"
              icon="search"
              icon_position="left"
              style={{ width: '100%' } as React.CSSProperties}
            />
          </div>

          {/* Current selection display */}
          <div
            style={{
              marginBottom: 'var(--spacing-small)',
              padding: 'var(--spacing-small)',
              backgroundColor: 'var(--color-mint-green-12)',
              borderRadius: '4px',
              border: '1px solid var(--color-sea-green-30)',
            }}
          >
            <P size="small" style={{ margin: 0 }}>
              <strong>Current:</strong>{' '}
              {(() => {
                const current = availableModels.find((m) => m.id === selectedModel);
                if (!current) return selectedModel;

                let schemaSupport = '';
                if (current.supportsNativeJSONSchema) {
                  schemaSupport = ' 🎯 Native Schema';
                } else if (current.supportsStructuredOutput) {
                  schemaSupport = ' 📋 Structured';
                } else if (current.supportsJson) {
                  schemaSupport = ' ✅ JSON';
                }

                return `${current.name || getModelName(current.id)} (${current.provider})${schemaSupport}`;
              })()}
            </P>
          </div>

          {/* Model dropdown list */}
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid var(--color-black-20)',
              borderRadius: '4px',
            }}
          >
            {filteredModels
              .slice(0, UI.MAX_VISIBLE_MODELS)
              .map((model: Model) => (
                <div
                  key={model.id}
                  style={{
                    padding: 'var(--spacing-small)',
                    borderBottom: '1px solid var(--color-black-8)',
                    cursor: 'pointer',
                    backgroundColor:
                      selectedModel === model.id
                        ? 'var(--color-sea-green-8)'
                        : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onClick={() => onModelSelect(model.id)}
                  onMouseEnter={(e) => {
                    if (selectedModel !== model.id) {
                      e.currentTarget.style.backgroundColor = 'var(--color-black-4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedModel !== model.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: selectedModel === model.id ? 'bold' : 'normal',
                      }}
                    >
                      {model.name || model.id.split('/')[1] || model.id}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-black-60)',
                        marginTop: '2px',
                      }}
                    >
                      {model.provider} • {model.cost || 'unknown'} cost •{' '}
                      {model.speed || 'unknown'} speed
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>
                    {model.supportsNativeJSONSchema && (
                      <span title="Native JSON Schema Support">🎯</span>
                    )}
                    {model.supportsStructuredOutput &&
                      !model.supportsNativeJSONSchema && (
                        <span title="Structured Output Support">📋</span>
                      )}
                    {model.supportsJson && !model.supportsStructuredOutput && (
                      <span title="Basic JSON Support">✅</span>
                    )}
                    {model.status === 'verified' && (
                      <span title="Verified working"> ⚡</span>
                    )}
                    {selectedModel === model.id && (
                      <span style={{ color: 'var(--color-sea-green)' }}> ●</span>
                    )}
                  </div>
                </div>
              ))}

            {filteredModels.length > UI.MAX_VISIBLE_MODELS && (
              <div
                style={{
                  padding: 'var(--spacing-small)',
                  textAlign: 'center',
                  color: 'var(--color-black-60)',
                  fontSize: '0.875rem',
                }}
              >
                Showing first {UI.MAX_VISIBLE_MODELS} results. Use search to narrow
                down.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: 'var(--spacing-medium)',
            textAlign: 'center',
            border: '1px solid var(--color-black-20)',
            borderRadius: '8px',
          }}
        >
          <P>Ingen modeller tilgjengelig</P>
        </div>
      )}
    </div>
  );
}
