'use client';

import { useState, useRef, useEffect, DragEvent } from 'react';
import { Textarea, Icon, FormStatus } from '@dnb/eufemia/components';
import { upload, close } from '@dnb/eufemia/icons';
import { t } from '@/lib/i18n';

interface UnifiedInputProps {
  messages: any;
  value: string;
  onChange: (value: string) => void;
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

export default function UnifiedInput({ 
  messages, 
  value, 
  onChange, 
  onFileSelect,
  isProcessing 
}: UnifiedInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect clipboard content on mount
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.length > 0 && !value) {
          onChange(text);
        }
      } catch (err) {
        // Clipboard API not available or no permission
      }
    };
    
    checkClipboard();
  }, [onChange, value]);

  const validateFile = (file: File): boolean => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t(messages, 'errorFileType'));
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(t(messages, 'errorFileSize'));
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
      onChange(''); // Clear text when file is selected
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(value + text);
      }
    } catch (err) {
      console.error('Failed to read clipboard');
    }
  };

  const clearInput = () => {
    onChange('');
    setSelectedFile(null);
    setError(null);
  };

  const hasContent = value.trim().length > 0 || selectedFile !== null;

  return (
    <div 
      className={`unified-input ${isDragging ? 'dragging' : ''} ${hasContent ? 'has-content' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        style={{ display: 'none' }}
      />

      {selectedFile ? (
        <div className="file-preview">
          <Icon icon={upload} size="large" />
          <p className="file-name">{selectedFile.name}</p>
          <button className="clear-btn" onClick={clearInput}>
            <Icon icon={close} />
          </button>
        </div>
      ) : (
        <>
          <Textarea
            value={value}
            on_change={({ value }: { value: string }) => onChange(value)}
            placeholder={t(messages, 'unifiedPlaceholder') || 'Lim inn mistenkelig tekst, eller dra og slipp et bilde her...'}
            rows={6}
            autoresize={true}
            stretch={true}
            className="unified-textarea"
          />
          
          {hasContent && (
            <button className="clear-btn floating" onClick={clearInput}>
              <Icon icon={close} />
            </button>
          )}

          <div className="input-helpers">
            <button 
              className="helper-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Icon icon={upload} size="small" />
              <span>{t(messages, 'uploadLabel')}</span>
            </button>
            
            <button 
              className="helper-btn"
              onClick={handlePaste}
              disabled={isProcessing}
            >
              <span>📋</span>
              <span>{t(messages, 'pasteLabel') || 'Lim inn'}</span>
            </button>
          </div>
        </>
      )}

      {error && (
        <FormStatus state="error" className="input-error">
          {error}
        </FormStatus>
      )}

      <style jsx>{`
        .unified-input {
          position: relative;
          background: var(--color-white);
          border: 2px dashed var(--color-black-20);
          border-radius: var(--border-radius-large);
          padding: var(--spacing-medium);
          transition: all 0.3s ease;
          min-height: 200px;
        }

        .unified-input.dragging {
          border-color: var(--color-sea-green);
          background: var(--color-mint-green-12);
          transform: scale(1.02);
        }

        .unified-input.has-content {
          border-style: solid;
          border-color: var(--color-sea-green);
        }

        :global([data-theme="dark"] .unified-input) {
          background: var(--color-black-80);
          border-color: var(--color-black-border);
        }

        :global([data-theme="dark"] .unified-input.dragging) {
          background: var(--color-black-80);
          border-color: var(--color-accent-yellow);
        }

        :global([data-theme="dark"] .unified-input.has-content) {
          border-color: var(--color-success-green);
        }

        :global(.unified-textarea) {
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
          font-size: var(--font-size-basis) !important;
          color: var(--color-text) !important;
        }

        :global([data-theme="dark"] .unified-textarea) {
          color: var(--color-white) !important;
        }

        :global(.unified-textarea:focus) {
          outline: none !important;
        }

        .file-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 150px;
          gap: var(--spacing-small);
        }

        .file-name {
          font-weight: 500;
          color: var(--color-text);
        }

        :global([data-theme="dark"]) .file-name {
          color: var(--color-white);
        }

        .clear-btn {
          background: var(--color-black-8);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-btn:hover {
          background: var(--color-black-20);
          transform: scale(1.1);
        }

        :global([data-theme="dark"]) .clear-btn {
          background: var(--color-black-55);
        }

        :global([data-theme="dark"]) .clear-btn:hover {
          background: var(--color-black-45);
        }

        .clear-btn.floating {
          position: absolute;
          top: var(--spacing-small);
          right: var(--spacing-small);
        }

        .input-helpers {
          display: flex;
          gap: var(--spacing-small);
          margin-top: var(--spacing-small);
          padding-top: var(--spacing-small);
          border-top: 1px solid var(--color-black-8);
        }

        :global([data-theme="dark"]) .input-helpers {
          border-top-color: var(--color-black-55);
        }

        .helper-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-x-small);
          padding: var(--spacing-x-small) var(--spacing-small);
          background: transparent;
          border: 1px solid var(--color-black-20);
          border-radius: var(--border-radius-small);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: var(--font-size-small);
          color: var(--color-text-muted);
        }

        .helper-btn:hover {
          background: var(--color-black-3);
          border-color: var(--color-sea-green);
          color: var(--color-sea-green);
        }

        .helper-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        :global([data-theme="dark"] .helper-btn) {
          border-color: var(--color-black-border);
          color: var(--color-white);
        }

        :global([data-theme="dark"] .helper-btn:hover) {
          background: var(--color-black-70);
          border-color: var(--color-accent-yellow);
        }

        :global(.input-error) {
          margin-top: var(--spacing-small);
        }

        @media screen and (max-width: 40em) {
          .unified-input {
            padding: var(--spacing-small);
          }

          .input-helpers {
            flex-direction: column;
          }

          .helper-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}