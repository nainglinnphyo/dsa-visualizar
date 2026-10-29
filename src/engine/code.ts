/**
 * Source listings shown in the code panel.
 *
 * Steps highlight *pseudocode* lines (1-based). `lineMap` translates those to
 * lines in the TypeScript listing; when an algorithm omits it the TypeScript
 * tab simply renders without highlighting rather than pointing at a wrong line.
 */
export interface CodeSource {
  pseudocode: string;
  typescript: string;
  lineMap?: Record<number, number[]>;
}

export type CodeLanguage = 'pseudocode' | 'typescript';

export function linesOf(source: string): string[] {
  return source.replace(/\n$/, '').split('\n');
}

export function mapHighlight(
  code: CodeSource,
  language: CodeLanguage,
  pseudoLines: number[] | undefined,
): number[] {
  if (!pseudoLines?.length) return [];
  if (language === 'pseudocode') return pseudoLines;
  if (!code.lineMap) return [];
  const mapped = new Set<number>();
  for (const line of pseudoLines) {
    for (const target of code.lineMap[line] ?? []) mapped.add(target);
  }
  return [...mapped];
}
