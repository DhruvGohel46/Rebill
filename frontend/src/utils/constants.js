// Application constants

// Product categories
export const PRODUCT_CATEGORIES = {
  COLDRINK: 'coldrink',
  PAAN: 'paan',
  OTHER: 'other'
};

// Product statuses - centralized status management
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  OUT_OF_STOCK: 'out_of_stock',
  DELETED: 'deleted'
};

// Product status display names and configurations - using unified theme colors
export const PRODUCT_STATUS_CONFIG = {
  [PRODUCT_STATUS.ACTIVE]: {
    label: 'Active',
    color: '#22C55E', // semantic.success[500]
    bgColor: '#F0FDF4', // semantic.success[50]
    borderColor: '#22C55E'
  },
  [PRODUCT_STATUS.OUT_OF_STOCK]: {
    label: 'Out of Stock',
    color: '#F59E0B', // semantic.warning[500]
    bgColor: '#FFFBEB', // semantic.warning[50]
    borderColor: '#F59E0B'
  },
  [PRODUCT_STATUS.DELETED]: {
    label: 'Deleted',
    color: '#EF4444', // semantic.error[500]
    bgColor: '#FEF2F2', // semantic.error[50]
    borderColor: '#EF4444'
  }
};

// Category display names
export const CATEGORY_NAMES = {
  [PRODUCT_CATEGORIES.COLDRINK]: 'Cold Drinks',
  [PRODUCT_CATEGORIES.PAAN]: 'Paan',
  [PRODUCT_CATEGORIES.OTHER]: 'Other'
};

// Category colors - using unified theme system
export const CATEGORY_COLORS = {
  [PRODUCT_CATEGORIES.COLDRINK]: '#EA580C', // primary[600]
  [PRODUCT_CATEGORIES.PAAN]: '#16A34A',   // semantic.success[600]
  [PRODUCT_CATEGORIES.OTHER]: '#D97706'  // semantic.warning[600]
};

// Animation durations (in seconds) - refined for professional feel
export const ANIMATION_DURATIONS = {
  INSTANT: 0.1,
  FAST: 0.15,
  NORMAL: 0.2,
  SLOW: 0.3,
  PAGE_TRANSITION: 0.25,
  MICRO: 0.08,
};

// Animation easing functions - calm and professional
export const EASINGS = {
  EASE_OUT: [0.25, 0.46, 0.45, 0.94],
  EASE_IN_OUT: [0.4, 0, 0.2, 1],
  EASE_IN: [0.4, 0, 1, 1],
  EASE_OUT_BACK: [0.34, 1.56, 0.64, 1],
  EASE_OUT_CIRC: [0.08, 0.82, 0.17, 1],
  SMOOTH: [0.25, 0.1, 0.25, 1],
  GENTLE: [0.33, 0, 0.67, 1],
};

// Toast notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'pos_theme',
  LAST_BILL_NUMBER: 'pos_last_bill_number',
  USER_PREFERENCES: 'pos_user_preferences'
};

// API response status codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

// Time formats
export const TIME_FORMATS = {
  DISPLAY: 'h:mm A',
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD h:mm A'
};

// Validation rules
export const VALIDATION = {
  PRODUCT_NAME_MIN_LENGTH: 2,
  PRODUCT_NAME_MAX_LENGTH: 50,
  PRICE_MIN: 0.01,
  PRICE_MAX: 99999.99,
  QUANTITY_MIN: 1,
  QUANTITY_MAX: 999
};

// Print settings
export const PRINT_SETTINGS = {
  MAX_CHARS_PER_LINE: 32,
  SHOP_NAME: 'InfoOS POS',
  SHOP_ADDRESS: 'Your Address Here',
  SHOP_PHONE: 'Phone: XXXXXXXXXX'
};
