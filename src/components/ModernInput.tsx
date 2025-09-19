'use client';

import { useState, useRef, DragEvent } from 'react';
import { Icon } from '@dnb/eufemia/components';
import { upload, file, photo } from '@dnb/eufemia/icons';
import { t } from '@/lib/i18n';

interface ModernInputProps {
  messages: any;
  value: string;
  onChange: (value: string) => void;
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

export default function ModernInput({ 
  messages, 
  value, 
  onChange, 
  onFileSelect,
  isProcessing 
}: ModernInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onChange('');
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

  const clearInput = () => {
    onChange('');
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="modern-input-wrapper">
      <div 
        className={`modern-input ${isDragging ? 'dragging' : ''} ${isFocused ? 'focused' : ''} ${value || selectedFile ? 'has-content' : ''}`}
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
            <div className="file-icon">
              <Icon icon={selectedFile.type.startsWith('image/') ? photo : file} size="large" />
            </div>
            <div className="file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button className="clear-button" onClick={clearInput}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div className="input-header">
              <div className="input-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="input-label">
                {t(messages, 'checkSuspiciousContent') || 'Sjekk mistenkelig innhold'}
              </span>
            </div>

            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={t(messages, 'unifiedPlaceholder') || 'Lim inn mistenkelig tekst her...'}
              className="modern-textarea"
              rows={4}
            />

            <div className="input-actions">
              <button 
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Icon icon={upload} size="small" />
                <span>{t(messages, 'uploadImage') || 'Last opp bilde'}</span>
              </button>
              
              <div className="separator">eller</div>
              
              <button 
                className="paste-button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) onChange(value + text);
                  } catch (err) {
                    console.error('Failed to read clipboard');
                  }
                }}
                disabled={isProcessing}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="5" width="8" height="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 3h7v2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span>{t(messages, 'pasteText') || 'Lim inn tekst'}</span>
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3m0 3h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}
      </div>

      <style jsx>{`
        .modern-input-wrapper {
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
        }

        .modern-input {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(0, 114, 114, 0.1);
          border-radius: 24px;
          padding: 32px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
        }

        :global([data-theme="dark"]) .modern-input {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(64, 224, 208, 0.1);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .modern-input.dragging {
          border-color: #007272;
          background: rgba(0, 114, 114, 0.03);
          transform: scale(1.01);
        }

        :global([data-theme="dark"]) .modern-input.dragging {
          border-color: #40e0d0;
          background: rgba(64, 224, 208, 0.05);
        }

        .modern-input.focused {
          border-color: #007272;
          box-shadow: 0 10px 40px rgba(0, 114, 114, 0.1);
        }

        :global([data-theme="dark"]) .modern-input.focused {
          border-color: #40e0d0;
          box-shadow: 0 10px 40px rgba(64, 224, 208, 0.1);
        }

        .modern-input.has-content {
          border-color: #28a745;
        }

        .input-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .input-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #007272 0%, #40e0d0 100%);
          border-radius: 12px;
          color: white;
        }

        .input-label {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        :global([data-theme="dark"]) .input-label {
          color: #fafafa;
        }

        .modern-textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-size: 1.125rem;
          line-height: 1.6;
          resize: none;
          color: #1a1a1a;
          font-family: inherit;
        }

        :global([data-theme="dark"]) .modern-textarea {
          color: #fafafa;
        }

        .modern-textarea::placeholder {
          color: #adb5bd;
        }

        :global([data-theme="dark"]) .modern-textarea::placeholder {
          color: #6c757d;
        }

        .input-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(0, 114, 114, 0.1);
        }

        :global([data-theme="dark"]) .input-actions {
          border-top-color: rgba(64, 224, 208, 0.1);
        }

        .upload-button,
        .paste-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: white;
          border: 1px solid rgba(0, 114, 114, 0.2);
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #007272;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        :global([data-theme="dark"]) .upload-button,
        :global([data-theme="dark"]) .paste-button {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(64, 224, 208, 0.2);
          color: #40e0d0;
        }

        .upload-button:hover,
        .paste-button:hover {
          background: #007272;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 114, 114, 0.2);
        }

        :global([data-theme="dark"]) .upload-button:hover,
        :global([data-theme="dark"]) .paste-button:hover {
          background: #40e0d0;
          color: #0f0f0f;
        }

        .upload-button:disabled,
        .paste-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .separator {
          color: #adb5bd;
          font-size: 0.875rem;
        }

        .file-preview {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: rgba(0, 114, 114, 0.03);
          border-radius: 16px;
        }

        :global([data-theme="dark"]) .file-preview {
          background: rgba(64, 224, 208, 0.05);
        }

        .file-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 12px;
          color: #007272;
        }

        :global([data-theme="dark"]) .file-icon {
          background: rgba(255, 255, 255, 0.1);
          color: #40e0d0;
        }

        .file-info {
          flex: 1;
        }

        .file-name {
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        :global([data-theme="dark"]) .file-name {
          color: #fafafa;
        }

        .file-size {
          font-size: 0.875rem;
          color: #6c757d;
          margin: 4px 0 0;
        }

        .clear-button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 1px solid rgba(0, 114, 114, 0.2);
          border-radius: 8px;
          color: #dc3545;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        :global([data-theme="dark"]) .clear-button {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(220, 53, 69, 0.3);
        }

        .clear-button:hover {
          background: #dc3545;
          color: white;
          transform: scale(1.1);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 12px;
          background: rgba(220, 53, 69, 0.1);
          border-radius: 8px;
          color: #dc3545;
          font-size: 0.875rem;
        }

        @media (max-width: 640px) {
          .modern-input {
            padding: 24px 20px;
          }

          .input-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .upload-button,
          .paste-button {
            justify-content: center;
          }

          .separator {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}