export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'cv_theme';

export function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function initTheme() {
  const theme = getStoredTheme() ?? getSystemTheme();
  document.documentElement.setAttribute('data-theme', theme);
}

export function getCurrentTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' ? 'dark' : 'light';
}
