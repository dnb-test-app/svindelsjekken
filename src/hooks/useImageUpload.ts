/**
 * useImageUpload Hook
 * Manages image upload, preview, OCR, and file processing
 */

import { useState, useRef } from 'react';
import { runOCR, type OCRProgress } from '@/lib/ocr';
import { FILE_UPLOAD } from '@/lib/constants/appConstants';

export interface UseImageUploadReturn {
  // State
  imagePreview: string | null;
  uploadedFile: File | null;
  ocrText: string;
  isProcessingImage: boolean;
  ocrProgress: number;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  errorDialogOpen: boolean;
  errorDialogTitle: string;
  errorDialogMessage: string;

  // Actions
  setImagePreview: (preview: string | null) => void;
  setUploadedFile: (file: File | null) => void;
  setOcrText: (text: string) => void;
  setOcrProgress: (progress: number) => void;
  setIsDragging: (dragging: boolean) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handlePaste: (event: React.ClipboardEvent) => Promise<void>;
  handleRemoveImage: () => void;
  processImageWithOCR: (file: File) => Promise<void>;
  closeErrorDialog: () => void;
}

/**
 * Custom hook for managing image upload and OCR functionality
 */
export function useImageUpload(): UseImageUploadReturn {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogTitle, setErrorDialogTitle] = useState('');
  const [errorDialogMessage, setErrorDialogMessage] = useState('');

  /**
   * Show error dialog with title and message
   */
  const showError = (title: string, message: string) => {
    setErrorDialogTitle(title);
    setErrorDialogMessage(message);
    setErrorDialogOpen(true);
  };

  /**
   * Close error dialog
   */
  const closeErrorDialog = () => {
    setErrorDialogOpen(false);
  };

  /**
   * Process image with OCR
   */
  const processImageWithOCR = async (file: File) => {
    setIsProcessingImage(true);
    setOcrProgress(0);

    try {
      const progressCallback = (progress: OCRProgress) => {
        setOcrProgress(progress.progress);
      };

      const extractedText = await runOCR(file, progressCallback);
      setOcrText(extractedText);
      setOcrProgress(100);
    } catch (error) {
      console.error('OCR failed:', error);
      showError('OCR-feil', 'Kunne ikke lese tekst fra bildet. Du kan fortsatt analysere bildet.');
      setOcrText('');
    } finally {
      setIsProcessingImage(false);
      setTimeout(() => setOcrProgress(0), 1000);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const supportedImageTypes: string[] = [...FILE_UPLOAD.SUPPORTED_IMAGE_TYPES];
    const supportedDocTypes: string[] = [...FILE_UPLOAD.SUPPORTED_DOCUMENT_TYPES];
    const supportedTypes = [...supportedImageTypes, ...supportedDocTypes];

    if (!supportedTypes.includes(file.type)) {
      showError(
        'Ugyldig filtype',
        'Støttede formater: PNG, JPG, JPEG, HEIC, HEIF, PDF'
      );
      return;
    }

    // Validate file size
    if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
      showError('Filen er for stor', `Filen du prøver å laste opp er for stor. Maksimal størrelse er ${FILE_UPLOAD.MAX_SIZE_MB} MB.`);
      return;
    }

    // Set file and create preview
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Run OCR if it's an image
    const imageTypes: string[] = [...FILE_UPLOAD.SUPPORTED_IMAGE_TYPES];
    if (imageTypes.includes(file.type)) {
      await processImageWithOCR(file);
    }
  };

  /**
   * Handle paste event (for pasting images)
   */
  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();

        if (!file) continue;

        // Validate file size
        if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
          showError('Bildet er for stort', `Bildet du prøver å laste opp er for stort. Maksimal størrelse er ${FILE_UPLOAD.MAX_SIZE_MB} MB.`);
          return;
        }

        setUploadedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Run OCR
        await processImageWithOCR(file);
        break;
      }
    }
  };

  /**
   * Remove uploaded image
   */
  const handleRemoveImage = () => {
    setImagePreview(null);
    setUploadedFile(null);
    setOcrText('');
    setOcrProgress(0);
  };

  return {
    // State
    imagePreview,
    uploadedFile,
    ocrText,
    isProcessingImage,
    ocrProgress,
    isDragging,
    fileInputRef,
    errorDialogOpen,
    errorDialogTitle,
    errorDialogMessage,

    // Actions
    setImagePreview,
    setUploadedFile,
    setOcrText,
    setOcrProgress,
    setIsDragging,
    handleFileChange,
    handlePaste,
    handleRemoveImage,
    processImageWithOCR,
    closeErrorDialog,
  };
}

export default useImageUpload;