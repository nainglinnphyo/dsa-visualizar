import { InputError } from '@/engine/types';

export interface ParseOptions {
  min?: number;
  max?: number;
  maxLength?: number;
  allowEmpty?: boolean;
  integersOnly?: boolean;
}

/**
 * Parses a comma/space separated list of numbers, throwing `InputError` with a
 * message the UI can show verbatim.
 */
export function parseNumberList(
  raw: string,
  options: ParseOptions = {},
): number[] {
  const {
    min = -9999,
    max = 9999,
    maxLength = 60,
    allowEmpty = false,
    integersOnly = true,
  } = options;

  const tokens = raw
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    if (allowEmpty) return [];
    throw new InputError('Enter at least one number.');
  }
  if (tokens.length > maxLength) {
    throw new InputError(`At most ${maxLength} values (got ${tokens.length}).`);
  }

  return tokens.map((token) => {
    const value = Number(token);
    if (!Number.isFinite(value)) {
      throw new InputError(`"${token}" is not a number.`);
    }
    if (integersOnly && !Number.isInteger(value)) {
      throw new InputError(`"${token}" must be a whole number.`);
    }
    if (value < min || value > max) {
      throw new InputError(`${value} is outside ${min}…${max}.`);
    }
    return value;
  });
}

export function parseSingleNumber(raw: string, label = 'Value'): number {
  const value = Number(raw.trim());
  if (raw.trim() === '' || !Number.isFinite(value)) {
    throw new InputError(`${label} must be a number.`);
  }
  return value;
}

export function randomArray(
  length: number,
  options: { min?: number; max?: number; sorted?: boolean; unique?: boolean } = {},
): number[] {
  const { min = 5, max = 99, sorted = false, unique = false } = options;
  let values: number[];
  if (unique) {
    const pool = new Set<number>();
    const span = max - min + 1;
    const size = Math.min(length, span);
    while (pool.size < size) {
      pool.add(min + Math.floor(Math.random() * span));
    }
    values = [...pool];
  } else {
    values = Array.from(
      { length },
      () => min + Math.floor(Math.random() * (max - min + 1)),
    );
  }
  return sorted ? values.sort((a, b) => a - b) : values;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function formatList(values: readonly number[]): string {
  return values.join(', ');
}
