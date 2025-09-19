'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Textarea, Icon, P, ProgressIndicator } from '@dnb/eufemia';
import { check, exclamation_medium, information } from '@dnb/eufemia/icons';
import { isMinimalContextURL } from '@/lib/urlAnalyzer';
// import { analyzeImage, analyzePDF } from '@/lib/image'; // Removed - using API now

interface SimplifiedInputProps {
  locale?: string;
}

export default function SimplifiedInput({ locale = 'nb' }: SimplifiedInputProps) {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastAnalyzedText, setLastAnalyzedText] = useState('');
  const [urlDetected, setUrlDetected] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLDivElement>(null);
  const isNorwegian = locale === 'nb';

  const handleAnalyze = async () => {
    if (text.trim().length < 5) return;

    setIsAnalyzing(true);

    try {
      // Prepare final text with context if provided
      const finalText = additionalContext && urlDetected
        ? `${text}\n\nKontekst: ${additionalContext}`
        : text;

      // API-based analysis only
      const response = await fetch('/api/analyze-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: finalText,
          hasMinimalContext: urlDetected && !additionalContext
        })
      });

      if (response.ok) {
        const analysis = await response.json();
        setResult(analysis);
        setShowResult(true);
        setLastAnalyzedText(text); // Track what text was analyzed
      } else {
        console.error('Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing text:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to reset for new analysis
  const handleNewAnalysis = () => {
    setText('');
    setResult(null);
    setShowResult(false);
    setImagePreview(null);
    setLastAnalyzedText('');
    setOcrProgress(0);
    setUrlDetected(false);
    setAdditionalContext('');
  };

  const processFile = useCallback(async (file: File) => {
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(isNorwegian 
        ? 'Filen er for stor. Maksimal størrelse er 10MB.' 
        : 'File is too large. Maximum size is 10MB.');
      return;
    }

    setIsProcessingImage(true);
    setOcrProgress(0);

    // Show image preview for image files
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    try {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        // Prepare form data
        const formData = new FormData();
        formData.append('image', file);
        formData.append('model', 'openai/gpt-4o-mini'); // Default model for simplified input
        
        // Update progress
        setOcrProgress(20);
        
        // Send to API for OCR and analysis
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          body: formData
        });
        
        setOcrProgress(60);
        
        if (!response.ok) {
          throw new Error(isNorwegian 
            ? 'Kunne ikke analysere bildet' 
            : 'Could not analyze image');
        }
        
        const apiResult = await response.json();
        setOcrProgress(90);

        if (apiResult.fraudProbability !== undefined) {
          // Don't put extracted text in the text field - keep image analysis separate
          // This prevents confusion when users click "Sjekk" again

          setResult({
            category: apiResult.category || 'safe',
            fraudProbability: apiResult.fraudProbability,
            riskLevel: apiResult.riskLevel || 'low',
            mainIndicators: apiResult.mainIndicators || [],
            positiveIndicators: apiResult.positiveIndicators || [],
            negativeIndicators: apiResult.negativeIndicators || [],
            educationalContext: apiResult.educationalContext || null,
            verificationGuide: apiResult.verificationGuide || null,
            smartQuestions: apiResult.smartQuestions || [],
            recommendation: apiResult.recommendation,
            summary: apiResult.summary,
            triggers: apiResult.mainIndicators?.map((ind: string) => ({
              reason: ind,
              description: ind,
              category: 'api_detected',
              weight: 10
            })) || [],
            categories: ['api_analysis'],
            extractedText: apiResult.extractedText,
            recommendations: apiResult.recommendation ? [apiResult.recommendation] : [],
            isImageAnalysis: true // Mark this as an image analysis
          });
          setShowResult(true);
          // Don't track as analyzed text since we're not putting it in the field
        } else if (apiResult.error) {
          throw new Error(apiResult.error);
        }
      }
    } catch (error: any) {
      console.error('Feil ved prosessering av fil:', error);
      const errorMessage = error.message || (isNorwegian 
        ? 'Kunne ikke lese tekst fra filen' 
        : 'Could not read text from file');
      alert(`${isNorwegian ? 'Feil' : 'Error'}: ${errorMessage}`);
    } finally {
      setIsProcessingImage(false);
      setOcrProgress(0);
    }
  }, [isNorwegian]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  // Handle paste event for images
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processFile(file);
        }
        break;
      }
    }
  }, [processFile]);

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      await processFile(file);
    }
  };

  // Add paste event listener
  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const clearImage = () => {
    setImagePreview(null);
    if (!text || text === (isNorwegian ? 'Kunne ikke trekke ut tekst fra bildet' : 'Could not extract text from image')) {
      setText('');
    }
  };

  const getRiskIcon = () => {
    if (!result) return information;
    const score = result.riskScore || result.risk_score || 0;
    if (score > 60) return exclamation_medium;
    if (score > 30) return information;
    return check;
  };

  const getRiskColor = () => {
    if (!result) return '#007272';
    const score = result.riskScore || result.risk_score || 0;
    if (score > 60) return '#C21E25';
    if (score > 30) return '#FF9100';
    return '#28A745';
  };

  const getRiskMessage = () => {
    if (!result) return '';
    const score = result.riskScore || result.risk_score || 0;
    if (score > 60) {
      return isNorwegian 
        ? '⚠️ Høy risiko - Kontakt DNB på 915 04800'
        : '⚠️ High risk - Contact DNB at 915 04800';
    }
    if (score > 30) {
      return isNorwegian 
        ? '⚡ Vær forsiktig - Se anbefalingene nedenfor'
        : '⚡ Be careful - See recommendations below';
    }
    return isNorwegian 
      ? '✅ Ser trygt ut - Men vær alltid oppmerksom'
      : '✅ Looks safe - But always stay alert';
  };

  return (
    <div className="simplified-input">
      <div className="input-container">
        {/* Hovedinput - stort og tydelig */}
        <div className="input-card">
          {/* Image preview if uploaded */}
          {imagePreview && (
            <div className="image-preview-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Uploaded" className="image-preview" />
              <button 
                onClick={clearImage}
                className="clear-image"
              >
                ✕
              </button>
            </div>
          )}

          {/* OCR Progress indicator */}
          {isProcessingImage && (
            <div className="ocr-progress">
              <P>{isNorwegian ? 'Leser tekst fra bildet...' : 'Reading text from image...'}</P>
              <ProgressIndicator 
                progress={ocrProgress} 
                show_label
                size="large"
              />
            </div>
          )}

          {/* Main text area with integrated upload */}
          <div 
            ref={textareaRef}
            className={`textarea-wrapper ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Textarea
              value={text}
              on_change={({ value }: any) => {
                setText(value as string);
                setUrlDetected(isMinimalContextURL(value as string));
              }}
              placeholder={isNorwegian
                ? 'Lim inn mistenkelig tekst, link eller slipp bilde her'
                : 'Paste suspicious text, link or drop image here'}
              rows={4}
              className="main-input"
              disabled={isProcessingImage}
            />
            
            {/* Clickable area for upload - more visible */}
            {!text && !isProcessingImage && (
              <div 
                className="upload-overlay"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="upload-hint">
                  {isNorwegian 
                    ? '📷 Klikk her eller dra bilde hit'
                    : '📷 Click here or drag image'}
                </span>
              </div>
            )}
          </div>

          {/* Help text */}
          <div className="help-text">
            <P size="small">
              {isNorwegian
                ? '💡 Tips: Du kan lime inn skjermbilde direkte med Ctrl+V / Cmd+V'
                : '💡 Tip: You can paste screenshots directly with Ctrl+V / Cmd+V'}
            </P>
          </div>

          {/* Context helper for URLs - subtle and inline */}
          {urlDetected && !showResult && (
            <div className="context-helper">
              <div className="helper-content">
                <Icon icon={information} size="small" />
                <span className="helper-text">
                  {isNorwegian
                    ? 'Tips: Fortell gjerne hvor du fikk lenken fra for bedre analyse'
                    : 'Tip: Tell us where you got this link for better analysis'}
                </span>
              </div>
              <textarea
                className="context-input"
                placeholder={isNorwegian
                  ? 'F.eks: SMS fra ukjent nummer, e-post som hevder å være DNB...'
                  : 'E.g.: SMS from unknown number, email claiming to be from bank...'}
                rows={2}
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
              />
            </div>
          )}

          {/* Action buttons - check and upload */}
          <div className="action-buttons">
            {showResult && result ? (
              // Show "New analysis" button when we have a result
              <button
                onClick={handleNewAnalysis}
                className="check-button"
              >
                {isNorwegian ? '🔄 Ny analyse' : '🔄 New analysis'}
              </button>
            ) : (
              // Show regular "Check" button
              <button
                onClick={handleAnalyze}
                disabled={
                  text.trim().length < 5 ||
                  isAnalyzing ||
                  isProcessingImage ||
                  (showResult && text === lastAnalyzedText) // Disable if same text already analyzed
                }
                className="check-button"
              >
                {isAnalyzing
                  ? (isNorwegian ? 'Sjekker...' : 'Checking...')
                  : (isNorwegian ? 'Sjekk' : 'Check')}
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImage}
              className="upload-button"
            >
              📷 {isNorwegian ? 'Last opp bilde' : 'Upload image'}
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Result - simple and clear */}
        {showResult && result && (
          <div className="result-card" style={{ borderColor: getRiskColor() }}>
            {/* Show when this is from an image analysis */}
            {result.isImageAnalysis && (
              <div className="analysis-type-indicator">
                <P size="small" style={{ fontWeight: 600, marginBottom: '12px' }}>
                  📸 {isNorwegian ? 'Bildeanalyse fullført' : 'Image analysis complete'}
                </P>
              </div>
            )}

            <div className="risk-indicator">
              <Icon
                icon={getRiskIcon()}
                size="large"
                style={{ color: getRiskColor() }}
              />
              <div className="risk-text">
                <P className="risk-score">{result.riskScore || result.risk_score || 0}%</P>
                <P className="risk-label">
                  {isNorwegian ? 'sannsynlighet for svindel' : 'fraud probability'}
                </P>
              </div>
            </div>

            <P className="risk-message">{getRiskMessage()}</P>

            {/* Educational Content - Most Important Section */}
            {result.educationalContext && (
              <div className="educational-content">
                <div className="educational-header">
                  <P size="medium" className="educational-title">
                    📚 {isNorwegian ? 'Viktig å vite' : 'Important to know'}
                  </P>
                </div>

                <div className="educational-section">
                  <P className="educational-text">
                    <strong>{isNorwegian ? 'Hvorfor denne vurderingen:' : 'Why this assessment:'}</strong><br/>
                    {result.educationalContext.whyThisAssessment}
                  </P>
                </div>

                <div className="educational-section">
                  <P className="educational-text">
                    <strong>{isNorwegian ? 'Legitim bruk:' : 'Legitimate use:'}</strong><br/>
                    {result.educationalContext.commonLegitimateUse}
                  </P>
                </div>

                <div className="educational-section">
                  <P className="educational-text">
                    <strong>{isNorwegian ? 'Viktig forskjell:' : 'Key difference:'}</strong><br/>
                    {result.educationalContext.keyDifference}
                  </P>
                </div>
              </div>
            )}

            {/* Verification Guide */}
            {result.verificationGuide && (
              <div className="verification-guide">
                <P size="medium" className="verification-title">
                  ✅ {isNorwegian ? 'Slik sjekker du dette' : 'How to verify this'}
                </P>

                <div className="verification-steps">
                  <div className="verification-step">
                    <span className="step-number">1</span>
                    <P className="step-text">{result.verificationGuide.primaryCheck}</P>
                  </div>

                  <div className="verification-step">
                    <span className="step-number">2</span>
                    <P className="step-text">{result.verificationGuide.independentVerification}</P>
                  </div>

                  <div className="verification-step">
                    <span className="step-number">3</span>
                    <P className="step-text">{result.verificationGuide.alternativeChannel}</P>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Questions */}
            {result.smartQuestions && result.smartQuestions.length > 0 && (
              <div className="smart-questions">
                <P size="medium" className="questions-title">
                  🤔 {isNorwegian ? 'Spørsmål til deg' : 'Questions for you'}
                </P>

                {result.smartQuestions.slice(0, 3).map((q: any, idx: number) => (
                  <div key={idx} className="smart-question">
                    <P className="question-text"><strong>Q: {q.question}</strong></P>
                    <P className="question-why" size="small">
                      <em>{isNorwegian ? 'Hvorfor vi spør:' : 'Why we ask:'} {q.whyAsking}</em>
                    </P>
                    <div className="question-guidance">
                      <P size="small" className="guidance-yes">
                        <span className="guidance-bullet">✅</span>
                        {isNorwegian ? 'Hvis ja:' : 'If yes:'} {q.ifYes}
                      </P>
                      <P size="small" className="guidance-no">
                        <span className="guidance-bullet">⚠️</span>
                        {isNorwegian ? 'Hvis nei:' : 'If no:'} {q.ifNo}
                      </P>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Show extracted text if available */}
            {result.extractedText && (
              <div className="extracted-text">
                <P size="small" className="extracted-label">
                  {isNorwegian ? 'Tekst funnet i bildet:' : 'Text found in image:'}
                </P>
                <div className="extracted-content">
                  {result.extractedText}
                </div>
              </div>
            )}

            {/* Show positive indicators if available */}
            {result.positiveIndicators && result.positiveIndicators.length > 0 && (
              <div className="positive-indicators">
                <P size="small" className="positive-indicators-label">
                  {isNorwegian ? 'Positive funn:' : 'Positive findings:'}
                </P>
                {result.positiveIndicators.slice(0, 3).map((indicator: string, idx: number) => (
                  <div key={idx} className="positive-indicator">
                    <span className="positive-bullet">✅</span>
                    <span>{indicator}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Show negative indicators if available */}
            {result.negativeIndicators && result.negativeIndicators.length > 0 && (
              <div className="negative-indicators">
                <P size="small" className="negative-indicators-label">
                  {isNorwegian ? 'Bekymringer funnet:' : 'Concerns found:'}
                </P>
                {result.negativeIndicators.slice(0, 3).map((indicator: string, idx: number) => (
                  <div key={idx} className="negative-indicator">
                    <span className="negative-bullet">⚠️</span>
                    <span>{indicator}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Show triggers if available (fallback for old format) */}
            {result.triggers && result.triggers.length > 0 && (
              <div className="triggers">
                <P size="small" className="triggers-label">
                  {isNorwegian ? 'Advarselstegn funnet:' : 'Warning signs found:'}
                </P>
                {result.triggers.slice(0, 3).map((trigger: any, idx: number) => (
                  <div key={idx} className="trigger">
                    <span className="trigger-bullet">•</span>
                    <span>{trigger.reason || trigger.description || trigger}</span>
                  </div>
                ))}
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div className="recommendations">
                {result.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                  <div key={idx} className="recommendation">
                    <span className="rec-bullet">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .simplified-input {
          padding: 60px 20px;
          background: #f8f8f8;
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .input-container {
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
        }

        .input-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .image-preview-container {
          margin-bottom: 20px;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
        }

        .image-preview {
          width: 100%;
          max-height: 300px;
          object-fit: contain;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .clear-image {
          position: absolute;
          top: 10px;
          right: 10px;
          background: white;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .clear-image:hover {
          background: #f5f5f5;
          transform: scale(1.1);
        }

        .ocr-progress {
          margin-bottom: 20px;
          padding: 16px;
          background: #f0f8f8;
          border-radius: 8px;
        }

        .textarea-wrapper {
          position: relative;
          transition: all 0.2s ease;
        }

        .textarea-wrapper.dragging {
          background: #f0f8f8;
          border-radius: 12px;
          padding: 4px;
        }

        .textarea-wrapper.dragging :global(.main-input) {
          border-color: #007272 !important;
          background: white !important;
        }

        :global(.main-input) {
          font-size: 18px !important;
          padding: 20px !important;
          border: 2px solid #e0e0e0 !important;
          border-radius: 12px !important;
          transition: all 0.2s ease !important;
          background: white !important;
        }

        :global(.main-input:focus) {
          border-color: #007272 !important;
          box-shadow: 0 0 0 3px rgba(0,114,114,0.1) !important;
        }

        :global(.main-input textarea) {
          font-size: 18px !important;
          line-height: 1.5 !important;
        }

        .upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .upload-hint {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #007272;
          font-size: 16px;
          font-weight: 600;
          padding: 12px 24px;
          background: rgba(240,248,248,0.95);
          border: 2px dashed #007272;
          border-radius: 12px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .upload-hint:hover {
          background: rgba(0,114,114,0.1);
          transform: translate(-50%, -50%) scale(1.05);
          box-shadow: 0 4px 12px rgba(0,114,114,0.2);
        }

        .help-text {
          margin-top: 12px;
          text-align: center;
          color: #666;
        }

        .action-buttons {
          margin-top: 24px;
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .check-button {
          background: #007272;
          color: white;
          padding: 16px 48px;
          font-size: 18px;
          font-weight: 600;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .check-button:hover:not(:disabled) {
          background: #005555;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,114,114,0.3);
        }

        .check-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .upload-button {
          background: white;
          color: #007272;
          padding: 16px 32px;
          font-size: 18px;
          font-weight: 600;
          border-radius: 8px;
          border: 2px solid #007272;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-button:hover:not(:disabled) {
          background: #007272;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,114,114,0.3);
        }

        .upload-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .result-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-top: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border-left: 6px solid;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .risk-indicator {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .risk-text {
          flex: 1;
        }

        .risk-score {
          font-size: 36px !important;
          font-weight: 700 !important;
          margin: 0 !important;
          line-height: 1 !important;
        }

        .risk-label {
          font-size: 14px !important;
          color: #666 !important;
          margin: 4px 0 0 0 !important;
        }

        .risk-message {
          font-size: 18px !important;
          font-weight: 500 !important;
          margin: 16px 0 !important;
        }

        .extracted-text {
          margin-top: 20px;
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .extracted-label, .triggers-label {
          font-weight: 600 !important;
          margin-bottom: 8px !important;
          color: #333 !important;
        }

        .extracted-content {
          font-size: 14px;
          color: #666;
          max-height: 150px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .triggers {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .trigger {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 14px;
          color: #666;
        }

        .trigger-bullet {
          color: #FF9100;
          font-weight: bold;
        }

        .positive-indicators, .negative-indicators {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .positive-indicators-label, .negative-indicators-label {
          font-weight: 600 !important;
          margin-bottom: 8px !important;
          color: #333 !important;
        }

        .positive-indicator, .negative-indicator {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
          align-items: flex-start;
          font-size: 14px;
          color: #666;
        }

        .positive-bullet {
          color: #28a745;
          font-weight: bold;
          font-size: 16px;
        }

        .negative-bullet {
          color: #FF9100;
          font-weight: bold;
          font-size: 16px;
        }

        /* Educational Content Styles */
        .educational-content {
          margin-top: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #f8fffe 0%, #edfffe 100%);
          border: 2px solid #007272;
          border-radius: 12px;
          position: relative;
        }

        .educational-header {
          margin-bottom: 16px;
        }

        .educational-title {
          font-weight: 700 !important;
          color: #007272 !important;
          font-size: 18px !important;
        }

        .educational-section {
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          border-left: 4px solid #007272;
        }

        .educational-text {
          color: #333 !important;
          line-height: 1.5 !important;
        }

        /* Verification Guide Styles */
        .verification-guide {
          margin-top: 20px;
          padding: 18px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #28a745;
          border-radius: 10px;
        }

        .verification-title {
          font-weight: 600 !important;
          color: #28a745 !important;
          margin-bottom: 16px !important;
        }

        .verification-steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .verification-step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 8px;
          border-left: 3px solid #28a745;
        }

        .step-number {
          background: #28a745;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          flex-shrink: 0;
        }

        .step-text {
          color: #333 !important;
          margin: 0 !important;
        }

        /* Smart Questions Styles */
        .smart-questions {
          margin-top: 20px;
          padding: 18px;
          background: linear-gradient(135deg, #fffbf0 0%, #fef7e0 100%);
          border: 2px solid #FF9100;
          border-radius: 10px;
        }

        .questions-title {
          font-weight: 600 !important;
          color: #FF9100 !important;
          margin-bottom: 16px !important;
        }

        .smart-question {
          margin-bottom: 20px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 8px;
          border-left: 3px solid #FF9100;
        }

        .smart-question:last-child {
          margin-bottom: 0;
        }

        .question-text {
          color: #333 !important;
          margin-bottom: 8px !important;
        }

        .question-why {
          color: #666 !important;
          margin-bottom: 12px !important;
          font-style: italic;
        }

        .question-guidance {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .guidance-yes, .guidance-no {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 0 !important;
        }

        .guidance-bullet {
          flex-shrink: 0;
          font-size: 14px;
        }

        .guidance-yes .guidance-bullet {
          color: #28a745;
        }

        .guidance-no .guidance-bullet {
          color: #FF9100;
        }

        .recommendations {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e0e0e0;
        }

        .recommendation {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 15px;
          color: #333;
        }

        .rec-bullet {
          color: #007272;
          font-weight: bold;
        }

        /* Context helper styles */
        .context-helper {
          margin-top: 12px;
          padding: 12px;
          background: #f0f8f8;
          border-radius: 8px;
          border: 1px solid #007272;
          animation: slideDown 0.2s ease;
        }

        .helper-content {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #007272;
          font-size: 14px;
        }

        .helper-text {
          font-weight: 500;
        }

        .context-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 14px;
          resize: none;
          font-family: inherit;
          transition: border-color 0.2s ease;
        }

        .context-input:focus {
          outline: none;
          border-color: #007272;
          box-shadow: 0 0 0 2px rgba(0, 114, 114, 0.1);
        }

        .context-input::placeholder {
          color: #adb5bd;
          font-style: italic;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 200px;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .simplified-input {
            padding: 40px 16px;
          }

          .input-card {
            padding: 24px;
          }

          :global(.main-input textarea) {
            font-size: 16px !important;
          }

          .check-button {
            width: 100%;
            padding: 14px 32px;
            font-size: 16px;
          }

          .risk-score {
            font-size: 28px !important;
          }

          .risk-message {
            font-size: 16px !important;
          }

          .upload-hint {
            bottom: 10px;
            right: 10px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}