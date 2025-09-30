/**
 * Image Processing Utilities
 * Handles image format conversion and validation
 */

import { logInfo, logError, logWarn } from '@/lib/logger';

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export interface ImageData {
  base64: string;
  mimeType: string;
}

/**
 * Check if image format is supported by AI models
 */
export function isSupportedImageFormat(mimeType: string): boolean {
  return SUPPORTED_FORMATS.includes(mimeType);
}

/**
 * Convert unsupported image formats to PNG using Sharp
 * @param imageData - Original image data
 * @returns Converted image data or null if conversion fails
 */
export async function convertImageToPNG(imageData: ImageData): Promise<ImageData | null> {
  const { base64: originalBase64, mimeType: originalMimeType } = imageData;

  logInfo(`Converting unsupported format ${originalMimeType} to PNG for AI compatibility`);

  try {
    const sharp = await import('sharp');
    const imageBuffer = Buffer.from(originalBase64, 'base64');
    const convertedBuffer = await sharp.default(imageBuffer)
      .png()
      .toBuffer();

    const convertedBase64 = convertedBuffer.toString('base64');
    const convertedMimeType = 'image/png';

    logInfo(`Successfully converted image to PNG`, { originalFormat: originalMimeType });

    return {
      base64: convertedBase64,
      mimeType: convertedMimeType
    };
  } catch (conversionError) {
    logError("Image conversion failed", conversionError);
    logWarn("Proceeding with original image format");
    return null;
  }
}

/**
 * Process image data, converting unsupported formats if needed
 * @param imageData - Image data to process
 * @returns Processed image data (converted if needed, or original)
 */
export async function processImageData(imageData: ImageData | undefined): Promise<ImageData | undefined> {
  if (!imageData?.base64) {
    return undefined;
  }

  // If format is already supported, return as-is
  if (isSupportedImageFormat(imageData.mimeType)) {
    return imageData;
  }

  // Try to convert unsupported format
  const converted = await convertImageToPNG(imageData);

  // Return converted image or fall back to original
  return converted || imageData;
}