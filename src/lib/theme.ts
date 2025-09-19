export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_COOKIE_NAME = 'theme';

export function isValidTheme(theme: string): theme is ThemeMode {
  return theme === 'light' || theme === 'dark' || theme === 'system';
}

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeMode) {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  if (theme === 'system') {
    const systemTheme = getSystemTheme();
    root.setAttribute('data-theme', systemTheme);
  } else {
    root.setAttribute('data-theme', theme);
  }
}