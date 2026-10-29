import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'dsa-visualizer:theme';

const PREFERENCES: ThemePreference[] = ['light', 'dark', 'system'];

export const isThemePreference = (value: unknown): value is ThemePreference =>
  typeof value === 'string' && PREFERENCES.includes(value as ThemePreference);

/** The OS-level preference, defaulting to dark where it cannot be read. */
export function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export const resolveTheme = (preference: ThemePreference): ResolvedTheme =>
  preference === 'system' ? systemTheme() : preference;

/** Reads the stored preference; private browsing can make this throw. */
export function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function writeStoredPreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage is unavailable; the choice simply will not persist.
  }
}

/**
 * Writes the resolved theme onto <html>. The inline script in index.html does
 * the same thing before first paint, so there is never a flash of the wrong
 * theme.
 */
export function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  /** Called when the OS preference changes while on "system". */
  syncWithSystem: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: 'system',
  resolved: 'dark',
  setPreference: (preference) => {
    const resolved = resolveTheme(preference);
    writeStoredPreference(preference);
    applyTheme(resolved);
    set({ preference, resolved });
  },
  syncWithSystem: () => {
    if (get().preference !== 'system') return;
    const resolved = systemTheme();
    applyTheme(resolved);
    set({ resolved });
  },
}));

/**
 * Adopts whatever the pre-paint script already decided, without writing to
 * storage — calling setPreference here would persist a choice the user never
 * made.
 */
export function initializeTheme(): void {
  const preference = readStoredPreference();
  const resolved = resolveTheme(preference);
  applyTheme(resolved);
  useThemeStore.setState({ preference, resolved });
}
