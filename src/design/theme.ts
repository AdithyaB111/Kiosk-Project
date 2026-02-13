/**
 * Design System - 2026 Modern Kiosk Theme
 * Premium, minimal, touch-optimized design tokens
 */

export const theme = {
  // Color Palette - Dark mode optimized
  colors: {
    // Backgrounds
    background: {
      primary: '#000000',
      secondary: '#0A0A0A',
      tertiary: '#141414',
      elevated: '#1C1C1E',
      card: '#1C1C1E',
    },
    
    // Brand
    brand: {
      primary: '#FF3B30',
      primaryHover: '#FF6259',
      primaryPressed: '#E6352A',
      secondary: '#FF9500',
      accent: '#5E5CE6',
    },
    
    // Status
    status: {
      success: '#30D158',
      warning: '#FFD60A',
      error: '#FF453A',
      info: '#64D2FF',
    },
    
    // Text
    text: {
      primary: '#FFFFFF',
      secondary: '#EBEBF5',
      tertiary: '#EBEBF599',
      quaternary: '#EBEBF54D',
      disabled: '#3A3A3C',
    },
    
    // Borders & Dividers
    border: {
      primary: '#38383A',
      secondary: '#2C2C2E',
      focus: '#FF3B30',
    },
    
    // Overlays
    overlay: {
      light: 'rgba(255, 255, 255, 0.05)',
      medium: 'rgba(255, 255, 255, 0.1)',
      heavy: 'rgba(0, 0, 0, 0.7)',
    },
  },
  
  // Typography
  typography: {
    // Display
    displayLarge: {
      fontSize: 48,
      fontWeight: '800' as const,
      lineHeight: 56,
      letterSpacing: -0.5,
    },
    displayMedium: {
      fontSize: 36,
      fontWeight: '800' as const,
      lineHeight: 44,
      letterSpacing: -0.3,
    },
    displaySmall: {
      fontSize: 28,
      fontWeight: '800' as const,
      lineHeight: 36,
      letterSpacing: 0,
    },
    
    // Headings
    h1: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: 0,
    },
    h2: {
      fontSize: 20,
      fontWeight: '700' as const,
      lineHeight: 28,
      letterSpacing: 0,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    
    // Body
    bodyLarge: {
      fontSize: 17,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodyMedium: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
      letterSpacing: 0,
    },
    bodySmall: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
      letterSpacing: 0,
    },
    
    // Labels
    labelLarge: {
      fontSize: 17,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    labelMedium: {
      fontSize: 15,
      fontWeight: '600' as const,
      lineHeight: 22,
      letterSpacing: 0,
    },
    labelSmall: {
      fontSize: 13,
      fontWeight: '600' as const,
      lineHeight: 18,
      letterSpacing: 0,
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
  },
  
  // Border Radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    brand: {
      shadowColor: '#FF3B30',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  
  // Touch Targets
  touchTarget: {
    min: 48,
    comfortable: 56,
    large: 64,
  },
  
  // Animation
  animation: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

export type Theme = typeof theme;
