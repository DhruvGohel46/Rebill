/**
 * =============================================================================
 * THEME SYSTEM - THEME.JSX
 * =============================================================================
 * 
 * ROLE: Centralized design system and theme management for the application
 * 
 * RESPONSIBILITIES:
 * - Define color palettes for light and dark themes
 * - Typography system with consistent font scales
 * - Spacing system for consistent layouts
 * - Shadow definitions for depth and hierarchy
 * - Breakpoint system for responsive design
 * - Component-specific styling tokens
 * 
 * KEY FEATURES:
 * - Dual theme support (light/dark modes)
 * - Comprehensive color system with semantic naming
 * - Typography scale with proper hierarchy
 * - Consistent spacing system (rem-based)
 * - Professional shadow system for depth
 * - Responsive breakpoint definitions
 * - CSS custom properties generation
 * 
 * COLOR SYSTEM:
 * - Semantic colors: primary, secondary, success, error, warning, info
 * - Neutral colors: gray scale for text and backgrounds
 * - Surface colors: cards, modals, overlays
 * - Interactive states: hover, focus, disabled
 * 
 * TYPOGRAPHY:
 * - Font sizes: xs to 9xl scale
 * - Font weights: light to bold
 * - Line heights for readability
 * - Letter spacing for emphasis
 * 
 * SPACING SYSTEM:
 * - Consistent rem-based spacing (0.25rem to 6rem)
 * - Semantic naming (xs, sm, md, lg, xl, etc.)
 * - Layout utilities and gaps
 * 
 * SHADOWS:
 * - Subtle to dramatic shadow scale
 * - Theme-aware shadows (dark/light)
 * - Component-specific shadows
 * - Colored shadows for accents
 * 
 * BREAKPOINTS:
 * - Mobile-first responsive design
 * - Standard breakpoint definitions
 * - Container max-widths
 * 
 * DESIGN PATTERNS:
 * - CSS custom properties for dynamic theming
 * - Systematic design tokens
 * - Consistent naming conventions
 * - Developer-friendly API
 * 
 * USAGE:
 * - Import theme object in components
 * - Use theme.colors, theme.spacing, etc.
 * - Automatic theme switching support
 * =============================================================================
 */

// Unified Design System Theme for POS Application
// Professional enterprise color system with consistent usage across all screens

// Primary brand color - Modern Vibrant Orange
// Primary brand color - ReBill Signature Orange
export const primary = {
  50: '#FFF1E9',
  100: '#FFDBC2',
  200: '#FFBFA0',
  300: '#FF9E75',
  400: '#FF8A3D',
  500: '#FF6A00', // ReBill Signature Primary
  600: '#FF7A1A', // ReBill Hover
  700: '#E85C00', // ReBill Pressed
  800: '#C44112',
  900: '#752307',
  950: '#401002',
};

// Neutral color system - Professional Slate Scale (Blue-tinted grays)
export const neutral = {
  0: '#ffffff',     // Pure White
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

// Semantic colors - consistent across all screens
export const semantic = {
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  }
};

// Category colors - consistent with semantic colors
export const category = {
  COLD: primary[600],      // cold drinks
  PAAN: semantic.success[600],  // Green for paan
  OTHER: semantic.warning[600], // Amber for other
};

// Unified color system
export const colors = {
  // Primary brand color
  primary: primary,

  // Semantic colors
  success: semantic.success,
  warning: semantic.warning,
  error: semantic.error,
  info: semantic.info,

  // Neutral colors
  neutral: neutral,
  gray: neutral, // Legacy support

  // Background colors
  background: {
    primary: neutral[50],
    secondary: neutral[100],
    tertiary: neutral[200],
  },

  // Text colors
  text: {
    primary: neutral[900],
    secondary: neutral[600],
    tertiary: neutral[500],
    quaternary: neutral[400],
    inverse: neutral[0],
  },

  // Border colors
  border: {
    primary: neutral[200],
    secondary: neutral[300],
    tertiary: neutral[400],
  },

  // Surface colors
  surface: {
    primary: neutral[0],
    secondary: neutral[50],
    tertiary: neutral[100],
  },

  // Category colors
  category: category,

  // Legacy colors for compatibility
  white: '#FFFFFF',
  black: '#000000',
};

// Typography system
export const typography = {
  fontFamily: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },

  fontSize: {
    xs: 'var(--font-size-ui-xs)',    // 12px
    sm: 'var(--font-size-ui-sm)',   // 14px
    base: 'var(--font-size-ui-base)', // 15px
    lg: 'var(--font-size-ui-lg)',       // 16px
    xl: 'var(--font-size-ui-xl)',   // 18px
    '2xl': 'var(--font-size-ui-2xl)', // 20px
    '3xl': 'var(--font-size-ui-3xl)',  // 24px
    '4xl': 'var(--font-size-ui-4xl)', // 30px
    '5xl': '2.25rem', // 36px
    '6xl': '3rem',    // 48px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.6,
  },

  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  }
};

// Strict Spacing Scale
export const spacing = {
  0: '0',
  1: 'calc(4px * var(--ui-scale))',
  2: 'calc(8px * var(--ui-scale))',
  3: 'calc(12px * var(--ui-scale))',
  4: 'calc(16px * var(--ui-scale))',
  6: 'calc(24px * var(--ui-scale))',
  8: 'calc(32px * var(--ui-scale))',
  10: 'calc(40px * var(--ui-scale))',
  12: 'calc(48px * var(--ui-scale))',
  16: 'calc(64px * var(--ui-scale))',
  20: 'calc(80px * var(--ui-scale))',
  24: 'calc(96px * var(--ui-scale))',
  32: 'calc(128px * var(--ui-scale))',
};

// Border radius
export const borderRadius = {
  sharp: '0',
  none: '0',
  sm: '8px',
  base: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px', // Standard InfoBill Card
  '2xl': '48px',
  '3xl': '64px',
  full: '9999px',
};

// Shadows - Human Quality Depth with Crisp Light Theme Definition
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  base: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
  md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
  lg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
  xl: '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
  '2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.15)',

  // ReBill Signature Card Shadows (High contrast depth for rapid retail workflows)
  card: '0 2px 8px -2px rgba(15, 23, 42, 0.08), 0 1px 3px -1px rgba(15, 23, 42, 0.05)',
  cardHover: '0 8px 20px -4px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(255, 106, 0, 0.20)',

  // Dark Theme Shadows
  cardDark: '0 1px 0 rgba(255,255,255,0.01), 0 2px 8px rgba(0,0,0,0.20)',
  cardDarkHover: '0 6px 16px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,106,0,0.15)', // Minimal lift glow

  inner: 'inset 0 1px 2px 0 rgba(15, 23, 42, 0.06)',

  // Colored shadows for accent elements
  primary: {
    sm: '0 1px 2px 0 rgba(255, 106, 0, 0.1)',
    md: '0 6px 18px rgba(255,106,0,0.35)',
  },

  success: {
    sm: '0 1px 2px 0 rgba(34, 197, 94, 0.1)',
    md: '0 4px 6px -1px rgba(34, 197, 94, 0.15), 0 2px 4px -1px rgba(34, 197, 94, 0.1)',
  },

  warning: {
    sm: '0 1px 2px 0 rgba(245, 158, 11, 0.1)',
    md: '0 4px 6px -1px rgba(245, 158, 11, 0.15), 0 2px 4px -1px rgba(245, 158, 11, 0.1)',
  },

  error: {
    sm: '0 1px 2px 0 rgba(239, 68, 68, 0.1)',
    md: '0 4px 6px -1px rgba(239, 68, 68, 0.15), 0 2px 4px -1px rgba(239, 68, 68, 0.1)',
  },

  // Glow effects for interactive states
  glow: {
    primary: '0 0 0 2px rgba(255, 106, 0, 0.35)',
    success: '0 0 0 2px rgba(34, 197, 94, 0.35)',
    error: '0 0 0 2px rgba(239, 68, 68, 0.35)',
  },

  // 3D Elevation Scale (Ambient + Direct)
  elevation: {
    low: '0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
    mid: '0 10px 20px rgba(0,0,0,0.08), 0 6px 6px rgba(0,0,0,0.1)',
    high: '0 20px 40px rgba(0,0,0,0.12), 0 15px 12px rgba(0,0,0,0.15)',
    inner: 'inset 0 2px 4px rgba(0,0,0,0.06)',
  }
};

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Glassmorphism tokens
const glass = {
  light: {
    sidebar: '#FFFFFF',
    card: '#FFFFFF',
    modal: '#FFFFFF',
    input: '#F8FAFC',
    dropdown: '#FFFFFF',
    header: '#FFFFFF',
    border: '#E2E8F0',
    specular: 'rgba(255, 255, 255, 1)', // Brilliant top-left 3D highlight
    blur: 'none',
  },
  dark: {
    sidebar: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.01))',
    card: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02))',
    modal: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
    input: 'rgba(255, 255, 255, 0.05)',
    dropdown: 'rgba(23, 23, 23, 0.85)',
    header: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
    border: 'rgba(255, 255, 255, 0.2)',
    specular: 'rgba(255, 255, 255, 0.3)', // For top-left highlights
    blur: 'blur(2px)',
  }
};

// Light theme configuration - ReBill Light
export const lightTheme = {
  colors: {
    ...colors,
    background: '#F4F6F8', // ReBill Light Background
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: {
      primary: neutral[900],
      secondary: neutral[600],
      muted: neutral[400],
      inverse: neutral[0],
    },
    border: '#E3E6EA',
    focus: colors.primary[500],
    skeleton: {
      base: neutral[200],
      highlight: neutral[100],
    },
  },
  glass: glass.light,
  typography,
  spacing,
  borderRadius,
  shadows: {
    ...shadows,
    card: shadows.card,
    cardHover: shadows.cardHover,
  },
  gradients: {
    background: '#F4F6F8',
    glow: 'none',
    primary: 'linear-gradient(135deg, #FF6A00, #FF8A3D)',
  }
};

// Dark theme configuration - ReBill Dark
export const darkTheme = {
  colors: {
    ...colors,
    background: '#0E0E11', // ReBill Dark Background
    surface: '#15161A', // Secondary Surface
    card: '#1B1D22', // Card Surface
    text: {
      primary: '#e5e5e5',
      secondary: '#a3a3a3',
      muted: '#737373',
      inverse: '#ffffff',
    },
    border: '#2C2F36',
    focus: colors.primary[500],
    skeleton: {
      base: neutral[700],
      highlight: neutral[600],
    },
    sidebar: '#15161A',
    modal: '#1F1F1F',
  },
  glass: glass.dark,
  typography,
  spacing,
  borderRadius,
  shadows: {
    ...shadows,
    card: shadows.cardDark,
    cardHover: shadows.cardDarkHover,
    glow: {
      primary: '0 0 20px rgba(255, 106, 0, 0.15)',
      success: '0 0 20px rgba(34, 197, 94, 0.15)',
    }
  },
  gradients: {
    background: '#0E0E11',
    glow: 'radial-gradient(circle at 15% 20%, rgba(255,106,0,0.06), transparent 40%), radial-gradient(circle at 85% 80%, rgba(255,106,0,0.04), transparent 40%)',
    primary: 'linear-gradient(135deg, #FF6A00, #FF8A3D)',
  }
};

// Default theme
export const theme = lightTheme;

// Export theme utilities
export const getThemeColor = (colorName, shade = 500, theme = 'light') => {
  const themeObj = theme === 'dark' ? darkTheme : lightTheme;
  return themeObj.colors[colorName]?.[shade] || colorName;
};

export const getCategoryColor = (category) => {
  return category[category.toUpperCase()] || category.OTHER;
};
