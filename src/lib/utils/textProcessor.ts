/**
 * Text Processing Utilities
 * Handles text validation, sanitization, and combining
 */

import { sanitizeUserInput, validateInput } from '@/lib/security/promptSanitizer';
import { logInfo } from '@/lib/logger';

export interface TextProcessingResult {
  success: boolean;
  text?: string;
  error?: {
    message: string;
    reason?: string;
    type: 'validation' | 'sanitization';
  };
}

/**
 * Validate and sanitize OCR-extracted text
 * @param ocrText - Raw OCR text to process
 * @returns Processing result with sanitized text or error
 */
export function processOCRText(ocrText: string): TextProcessingResult {
  if (!ocrText || !ocrText.trim()) {
    return { success: true, text: '' };
  }

  logInfo(`Processing OCR text`, { characterCount: ocrText.length });

  // Step 1: Validate OCR text
  const validation = validateInput(ocrText);
  if (!validation.valid) {
    return {
      success: false,
      error: {
        message: 'Invalid OCR text',
        reason: validation.reason,
        type: 'validation'
      }
    };
  }

  // Step 2: Sanitize OCR text
  const sanitization = sanitizeUserInput(ocrText);
  if (sanitization.blocked) {
    return {
      success: false,
      error: {
        message: 'Uakseptabelt OCR innhold',
        reason: 'OCR-ekstrahert tekst inneholder forbudte elementer.',
        type: 'sanitization'
      }
    };
  }

  return {
    success: true,
    text: sanitization.sanitized
  };
}

/**
 * Combine user text with OCR-extracted text
 * @param userText - User-provided text (already sanitized)
 * @param ocrText - OCR-extracted text (already sanitized)
 * @returns Combined text with OCR text properly tagged
 */
export function combineTextWithOCR(userText: string, ocrText: string): string {
  if (!ocrText || !ocrText.trim()) {
    return userText;
  }

  const sanitizedOcrText = ocrText.trim();
  const trimmedUserText = userText.trim();

  if (trimmedUserText) {
    // User provided text + OCR text
    return `${trimmedUserText}\n\n<ocr_extracted_text>\n${sanitizedOcrText}\n</ocr_extracted_text>`;
  } else {
    // Only OCR text
    return `<ocr_extracted_text>\n${sanitizedOcrText}\n</ocr_extracted_text>`;
  }
}

/**
 * Process and combine user text with OCR text
 * @param userText - User-provided text (already sanitized)
 * @param ocrText - Raw OCR text to process
 * @returns Processing result with combined text or error
 */
export function processAndCombineOCRText(
  userText: string,
  ocrText: string
): TextProcessingResult {
  const ocrResult = processOCRText(ocrText);

  if (!ocrResult.success) {
    return ocrResult;
  }

  const combinedText = combineTextWithOCR(userText, ocrResult.text || '');

  return {
    success: true,
    text: combinedText
  };
}