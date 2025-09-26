// Application Constants
export const APP_CONSTANTS = {
  // Quality settings
  DEFAULT_QUALITY: 0.9,
  MIN_QUALITY: 0.5,
  MAX_QUALITY: 0.99,

  // File limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_COUNT: 100,

  // Dimensions
  MIN_DIMENSION: 1,

  // Performance
  DEBOUNCE_DELAY: 300,
  CONNECTION_CHECK_INTERVAL: 1000,

  // PWA
  PWA_DISMISS_DAYS: 7,

  // Image display
  IMAGE_CONTAINER_HEIGHT: 320, // h-80 = 320px
  PROGRESS_BAR_HEIGHT: 4,

  // Percentages
  PERCENTAGE_MULTIPLIER: 100,

  // LocalStorage keys
  STORAGE_KEYS: {
    CONVERSION_SETTINGS: 'imageConverterSettings',
    PWA_DISMISSED: 'pwaDismissed',
    THEME: 'theme',
  },
} as const;

// Format-specific constants
export const FORMAT_CONSTANTS = {
  SUPPORTED_FORMATS: ['webp', 'jpeg', 'png'] as const,
  SUPPORTED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ] as const,
  SUPPORTED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp'] as const,

  // Quality settings per format
  QUALITY_SUPPORT: {
    jpeg: true,
    webp: true,
    png: false,
  },
} as const;

// UI Constants
export const UI_CONSTANTS = {
  ANIMATION: {
    DURATION_FAST: 150,
    DURATION_NORMAL: 300,
    DURATION_SLOW: 500,
  },

  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
  },

  Z_INDEX: {
    MODAL: 50,
    DROPDOWN: 40,
    OVERLAY: 30,
    TOOLTIP: 20,
  },
} as const;