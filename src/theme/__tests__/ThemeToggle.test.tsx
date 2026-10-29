import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../ThemeToggle';
import { THEME_STORAGE_KEY, useThemeStore } from '../theme';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  useThemeStore.setState({ preference: 'system', resolved: 'dark' });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ThemeToggle', () => {
  it('exposes the three choices as a radio group', () => {
    render(<ThemeToggle />);
    const group = screen.getByRole('radiogroup', { name: 'Colour theme' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the active preference', () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole('radio', { name: /System theme/ }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Light theme' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('tells the user what "system" currently resolves to', () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole('radio', { name: 'System theme (currently dark)' }),
    ).toBeInTheDocument();
  });

  it('switches the theme and persists the choice', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('radio', { name: 'Light theme' }));

    expect(useThemeStore.getState()).toMatchObject({
      preference: 'light',
      resolved: 'light',
    });
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(screen.getByRole('radio', { name: 'Light theme' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('switches back to dark', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('radio', { name: 'Light theme' }));
    await user.click(screen.getByRole('radio', { name: 'Dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('shows labels in full size and hides them when compact', () => {
    const { rerender } = render(<ThemeToggle size="full" />);
    expect(screen.getByText('Light')).toBeInTheDocument();
    rerender(<ThemeToggle size="compact" />);
    expect(screen.queryByText('Light')).not.toBeInTheDocument();
  });

  it('is reachable by keyboard', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Light theme' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(useThemeStore.getState().preference).toBe('light');
  });
});
