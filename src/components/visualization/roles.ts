export type VizRole =
  | 'idle'
  | 'sorted'
  | 'active'
  | 'compared'
  | 'swapped'
  | 'pivot';

const ROLE_COLOR: Record<VizRole, string> = {
  idle: 'var(--color-viz-idle)',
  sorted: 'var(--color-viz-sorted)',
  active: 'var(--color-viz-active)',
  compared: 'var(--color-viz-compare)',
  swapped: 'var(--color-viz-swap)',
  pivot: 'var(--color-viz-pivot)',
};

export const roleColor = (role: VizRole): string => ROLE_COLOR[role];

export interface RoleSets {
  sorted?: number[];
  active?: number[];
  compared?: number[];
  swapped?: number[];
  pivot?: number;
}

/**
 * Resolves the single role to paint an index with. Later entries win, so a
 * swap is always visible even if the index is also "active".
 */
export function resolveRole(index: number, sets: RoleSets): VizRole {
  if (sets.swapped?.includes(index)) return 'swapped';
  if (sets.compared?.includes(index)) return 'compared';
  if (sets.pivot === index) return 'pivot';
  if (sets.active?.includes(index)) return 'active';
  if (sets.sorted?.includes(index)) return 'sorted';
  return 'idle';
}

export const SORT_LEGEND = [
  { label: 'Unsorted', color: roleColor('idle') },
  { label: 'Comparing', color: roleColor('compared') },
  { label: 'Swapped / written', color: roleColor('swapped') },
  { label: 'Cursor', color: roleColor('active') },
  { label: 'Pivot', color: roleColor('pivot') },
  { label: 'Final position', color: roleColor('sorted') },
];
