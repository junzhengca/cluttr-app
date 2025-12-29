import { Theme } from './types';

export const theme: Theme = {
  colors: {
    primary: '#2E7D32', // Dark green
    primaryDark: '#1B5E20',
    primaryLight: '#4CAF50',
    secondary: '#81C784', // Light green
    background: '#F1F8E9', // Light green background
    backgroundLight: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    textLight: '#9E9E9E',
    border: '#E0E0E0',
    borderLight: '#F5F5F5',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
    notification: '#FFC107', // Yellow for notification badge
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 24,
      xxxl: 32,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      bold: '700',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

