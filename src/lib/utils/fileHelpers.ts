/**
 * File Helper Utilities
 * Reusable functions for file operations
 */

/**
 * Convert a File to base64 string
 * @param file - The file to convert
 * @returns Promise<string> - Base64 encoded string (without data URL prefix)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:type;base64, prefix
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };

    reader.onerror = (error) => {
      reject(new Error(`Failed to read file: ${error}`));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validate file size
 * @param file - The file to validate
 * @param maxSizeMB - Maximum size in megabytes
 * @returns boolean - True if file is within size limit
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validate file type
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns boolean - True if file type is allowed
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Get file extension from filename
 * @param filename - The filename
 * @returns string - File extension (lowercase, without dot)
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}