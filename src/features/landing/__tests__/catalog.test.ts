import { describe, expect, it } from 'vitest';
import { SORT_ALGORITHMS } from '@/algorithms/sorting';
import { SEARCH_ALGORITHMS } from '@/algorithms/searching';
import { GRAPH_ALGORITHMS } from '@/algorithms/graphs';
import { RECURSION_ALGORITHMS } from '@/algorithms/recursion';
import { NAV_SECTIONS } from '@/app/navigation';
import {
  ALGORITHM_GROUPS,
  CATALOG,
  DATA_STRUCTURE_GROUPS,
  TOTAL_ALGORITHMS,
} from '../catalog';

/**
 * The landing page quotes counts as literals so it does not drag every
 * algorithm module into the entry bundle. These tests are what keeps those
 * numbers honest.
 */
describe('landing catalog', () => {
  it('quotes the real algorithm counts', () => {
    expect(CATALOG.sorting).toBe(SORT_ALGORITHMS.length);
    expect(CATALOG.searching).toBe(SEARCH_ALGORITHMS.length);
    expect(CATALOG.graph).toBe(GRAPH_ALGORITHMS.length);
    expect(CATALOG.recursion).toBe(RECURSION_ALGORITHMS.length);
  });

  it('quotes the real data structure count', () => {
    const structures = NAV_SECTIONS.find(
      (section) => section.heading === 'Data Structures',
    );
    expect(CATALOG.dataStructures).toBe(structures?.items.length);
  });

  it('totals the algorithms correctly', () => {
    expect(TOTAL_ALGORITHMS).toBe(
      SORT_ALGORITHMS.length +
        SEARCH_ALGORITHMS.length +
        GRAPH_ALGORITHMS.length +
        RECURSION_ALGORITHMS.length,
    );
  });

  it('links only to routes that exist in the navigation', () => {
    const known = new Set(
      NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.to)),
    );
    for (const group of [...DATA_STRUCTURE_GROUPS, ...ALGORITHM_GROUPS]) {
      expect(known.has(group.to)).toBe(true);
    }
  });

  it('shows one card per data structure page', () => {
    expect(DATA_STRUCTURE_GROUPS).toHaveLength(CATALOG.dataStructures);
  });

  it('shows one card per algorithm family', () => {
    expect(ALGORITHM_GROUPS).toHaveLength(4);
  });
});
