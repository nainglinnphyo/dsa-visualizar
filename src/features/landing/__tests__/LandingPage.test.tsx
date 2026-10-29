import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../LandingPage';
import {
  ALGORITHM_GROUPS,
  CATALOG,
  DATA_STRUCTURE_GROUPS,
  TOTAL_ALGORITHMS,
} from '../catalog';

const renderLanding = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('LandingPage', () => {
  it('leads with what the tool is', () => {
    renderLanding();
    expect(
      screen.getByRole('heading', { level: 1, name: /See the algorithm actually run/ }),
    ).toBeInTheDocument();
  });

  it('offers a way into the app from the header and the hero', () => {
    renderLanding();
    const openApp = screen.getAllByRole('link', { name: /Open the app/ });
    expect(openApp.length).toBeGreaterThanOrEqual(2);
    for (const link of openApp) {
      expect(link).toHaveAttribute('href', '/dashboard');
    }
    expect(
      screen.getByRole('link', { name: /Start with sorting/ }),
    ).toHaveAttribute('href', '/algorithms/sorting');
  });

  it('states the catalog size using the shared counts', () => {
    renderLanding();
    expect(
      screen.getByText(
        `Interactive · ${CATALOG.dataStructures} data structures · ${TOTAL_ALGORITHMS} algorithms`,
      ),
    ).toBeInTheDocument();
  });

  it('links every catalogued topic to its visualizer', () => {
    renderLanding();
    // Scoped to the catalog: the footer repeats some of these names.
    const catalog = screen
      .getByRole('heading', { name: /What’s covered/ })
      .closest('section') as HTMLElement;
    for (const group of [...DATA_STRUCTURE_GROUPS, ...ALGORITHM_GROUPS]) {
      const link = within(catalog).getByRole('link', {
        name: new RegExp(`^${group.title}`),
      });
      expect(link).toHaveAttribute('href', group.to);
    }
  });

  it('explains what each page provides', () => {
    renderLanding();
    const section = screen
      .getByRole('heading', { name: 'On every page' })
      .closest('section') as HTMLElement;
    expect(within(section).getByText('Code panel')).toBeInTheDocument();
    expect(within(section).getByText('Complexity panel')).toBeInTheDocument();
    expect(within(section).getByText('Operation history')).toBeInTheDocument();
  });

  it('runs the real bubble sort in the hero preview', () => {
    vi.useFakeTimers();
    renderLanding();
    // The preview reports its own step count, which must match a genuine trace.
    const counter = screen.getByText(/^step \d+\/\d+$/);
    const total = Number(counter.textContent?.split('/')[1]);
    expect(total).toBeGreaterThan(50);
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('advances the hero preview over time', async () => {
    vi.useFakeTimers();
    const { act } = await import('react');
    renderLanding();
    const before = screen.getByText(/^step \d+\/\d+$/).textContent;
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/^step \d+\/\d+$/).textContent).not.toBe(before);
  });

  it('points at the learning resources', () => {
    renderLanding();
    const learnLinks = screen.getAllByRole('link', {
      name: /Learning resources|Complexity cheat sheet|^Learn$/,
    });
    expect(learnLinks.length).toBeGreaterThan(0);
    for (const link of learnLinks) {
      expect(link).toHaveAttribute('href', '/learn');
    }
  });
});
