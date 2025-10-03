/**
 * Application Constants
 * Centralized configuration values to avoid magic numbers
 */

/**
 * File Upload Constraints
 */
export const FILE_UPLOAD = {
  // Maximum file size for uploads (in bytes)
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  MAX_SIZE_MB: 10,

  // Compression threshold (files smaller than this skip compression)
  COMPRESSION_THRESHOLD_BYTES: 2 * 1024 * 1024, // 2 MB
  COMPRESSION_THRESHOLD_MB: 2,

  // Supported file types
  SUPPORTED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/heic', 'image/heif'],
  SUPPORTED_DOCUMENT_TYPES: ['application/pdf'],

  // Image compression settings
  MAX_IMAGE_WIDTH: 1920,  // pixels
  MAX_IMAGE_HEIGHT: 1080, // pixels
  COMPRESSION_QUALITY: 0.85, // 85%
  COMPRESSION_TIMEOUT_MS: 10000, // 10 seconds
} as const;

/**
 * Analysis Configuration
 */
export const ANALYSIS = {
  // Minimum text length for analysis
  MIN_TEXT_LENGTH: 5,

  // URL context detection threshold (words)
  MINIMAL_CONTEXT_WORD_COUNT: 10,

  // Rate limiting
  RATE_LIMIT_DELAY_MS: 1000, // 1 second between requests
} as const;

/**
 * API Configuration
 */
export const API = {
  // Request timeouts
  DEFAULT_TIMEOUT_MS: 30000, // 30 seconds
  OCR_TIMEOUT_MS: 60000,     // 60 seconds
  MODEL_TEST_TIMEOUT_MS: 10000, // 10 seconds

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  RETRY_BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * UI Configuration
 */
export const UI = {
  // Progress indicator delays
  DEBOUNCE_DELAY_MS: 300,
  TOAST_DURATION_MS: 5000,

  // Animation durations
  FADE_DURATION_MS: 200,
  SLIDE_DURATION_MS: 300,

  // Pagination
  ITEMS_PER_PAGE: 50,
  MAX_VISIBLE_MODELS: 50,
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  SELECTED_MODEL: 'selectedAIModel',
  CACHED_MODELS: 'cachedModels',
  MODEL_TEST_RESULTS: 'modelTestResults',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
  LOCALE: 'locale',
} as const;

/**
 * Feature Flags
 */
export const FEATURES = {
  ENABLE_MODEL_SELECTION: true,
  ENABLE_WEB_SEARCH: true,
  ENABLE_OCR: true,
  ENABLE_DEEP_CHECK: true,
  ENABLE_CONTEXT_REFINEMENT: true,
} as const;

/**
 * Application Metadata
 */
export const APP = {
  NAME: 'DNB Svindelsjekk',
  VERSION: '2025-10-03.4',
  SUPPORT_PHONE: '915 04800',
  SUPPORT_URL: 'https://www.dnb.no/sikkerhet',
} as const;