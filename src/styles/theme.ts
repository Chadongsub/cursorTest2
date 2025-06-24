export const theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    text: '#000000',
    gray: {
      light: '#F2F2F7',
      medium: '#C7C7CC',
      dark: '#8E8E93'
    }
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1025px'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  }
} as const;

export type Theme = typeof theme; 