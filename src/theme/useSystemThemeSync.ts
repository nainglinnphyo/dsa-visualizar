import { useEffect } from 'react';
import { useThemeStore } from './theme';

/**
 * Keeps the app in step with the OS theme while the preference is "system".
 * Registered once, by the provider.
 */
export function useSystemThemeSync(): void {
  const syncWithSystem = useThemeStore((state) => state.syncWithSystem);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (): void => syncWithSystem();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [syncWithSystem]);
}
