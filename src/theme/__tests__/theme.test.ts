import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyTheme,
  initializeTheme,
  isThemePreference,
  readStoredPreference,
  resolveTheme,
  systemTheme,
  THEME_STORAGE_KEY,
  useThemeStore,
} from '../theme';

/** Swaps in a controllable matchMedia for `prefers-color-scheme: light`. */
function mockSystem(prefersLight: boolean): { change: (next: boolean) => void } {
  const listeners = new Set<() => void>();
  let matches = prefersLight;
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return matches;
      },
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) =>
        listeners.delete(listener),
    })),
  );
  return {
    change: (next: boolean) => {
      matches = next;
      for (const listener of listeners) listener();
    },
  };
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.colorScheme = '';
  useThemeStore.setState({ preference: 'system', resolved: 'dark' });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('preference parsing', () => {
  it.each(['light', 'dark', 'system'])('accepts %s', (value) => {
    expect(isThemePreference(value)).toBe(true);
  });

  it.each([null, undefined, 'blue', 42, {}])('rejects %s', (value) => {
    expect(isThemePreference(value)).toBe(false);
  });
});

describe('resolveTheme', () => {
  it('passes explicit choices straight through', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('follows the system for "system"', () => {
    mockSystem(true);
    expect(resolveTheme('system')).toBe('light');
    mockSystem(false);
    expect(resolveTheme('system')).toBe('dark');
  });

  it('falls back to dark when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(systemTheme()).toBe('dark');
  });
});

describe('storage', () => {
  it('defaults to system when nothing is stored', () => {
    expect(readStoredPreference()).toBe('system');
  });

  it('reads a stored preference', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(readStoredPreference()).toBe('light');
  });

  it('ignores a corrupted value', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'chartreuse');
    expect(readStoredPreference()).toBe('system');
  });

  it('survives storage throwing, as in private browsing', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });
    expect(readStoredPreference()).toBe('system');
    spy.mockRestore();
  });

  it('does not throw when writing is blocked', () => {
    mockSystem(false);
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });
    expect(() => useThemeStore.getState().setPreference('light')).not.toThrow();
    expect(useThemeStore.getState().resolved).toBe('light');
    spy.mockRestore();
  });
});

describe('applyTheme', () => {
  it('writes the resolved theme onto the document element', () => {
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});

describe('the store', () => {
  it('persists an explicit choice and applies it', () => {
    mockSystem(false);
    useThemeStore.getState().setPreference('light');
    expect(useThemeStore.getState()).toMatchObject({
      preference: 'light',
      resolved: 'light',
    });
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('resolves "system" against the OS', () => {
    mockSystem(true);
    useThemeStore.getState().setPreference('system');
    expect(useThemeStore.getState().resolved).toBe('light');
  });

  it('follows the OS while on "system"', () => {
    const system = mockSystem(true);
    useThemeStore.getState().setPreference('system');
    expect(useThemeStore.getState().resolved).toBe('light');
    system.change(false);
    useThemeStore.getState().syncWithSystem();
    expect(useThemeStore.getState().resolved).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('ignores OS changes once a theme is pinned', () => {
    const system = mockSystem(true);
    useThemeStore.getState().setPreference('dark');
    system.change(true);
    useThemeStore.getState().syncWithSystem();
    expect(useThemeStore.getState().resolved).toBe('dark');
  });

  it('initializes from storage without persisting an unmade choice', () => {
    mockSystem(true);
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    initializeTheme();
    expect(useThemeStore.getState()).toMatchObject({
      preference: 'system',
      resolved: 'light',
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('initializes from a previously stored choice', () => {
    mockSystem(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    initializeTheme();
    expect(useThemeStore.getState()).toMatchObject({
      preference: 'dark',
      resolved: 'dark',
    });
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
