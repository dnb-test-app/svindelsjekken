import { createWorker, type Worker } from 'tesseract.js';
import { logError } from './logger';

export interface OCRProgress {
  status: string;
  progress: number;
}

export type OCRProgressCallback = (progress: OCRProgress) => void;

/**
 * Extract text from an image using Tesseract.js OCR.
 * Supports Norwegian and English languages.
 *
 * @param file - Image file to process
 * @param onProgress - Optional callback for progress updates
 * @returns Extracted text, or empty string if OCR fails
 */
export async function runOCR(
  file: File,
  onProgress?: OCRProgressCallback
): Promise<string> {
  let worker: Worker | null = null;

  try {
    // Create worker with Norwegian and English support
    worker = await createWorker(['nor', 'eng'], 1, {
      logger: onProgress ? (m) => onProgress({ status: m.status, progress: m.progress * 100 }) : undefined,
    });

    // Convert file to data URL
    const dataUrl = await fileToDataURL(file);

    // Run OCR
    const { data: { text } } = await worker.recognize(dataUrl);

    return text.trim();
  } catch (error) {
    logError('OCR processing failed', error, { fileName: file.name, fileSize: file.size });
    return '';
  } finally {
    // Always clean up worker
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * Convert File to data URL for Tesseract processing
 */
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}