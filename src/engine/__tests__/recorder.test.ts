import { describe, expect, it } from 'vitest';
import { StepRecorder } from '../recorder';

describe('StepRecorder', () => {
  it('snapshots counters per step so stepping back is accurate', () => {
    const recorder = new StepRecorder<number[]>();
    recorder.push({ state: [1], description: 'first' });
    recorder.count('comparisons');
    recorder.push({ state: [2], description: 'second' });
    recorder.count('comparisons');
    recorder.count('swaps', 3);
    recorder.push({ state: [3], description: 'third' });

    const { steps } = recorder.finish({
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
    });
    expect(steps.map((s) => s.stats.comparisons)).toEqual([0, 1, 2]);
    expect(steps.map((s) => s.stats.swaps)).toEqual([0, 0, 3]);
  });

  it('does not share a stats object between steps', () => {
    const recorder = new StepRecorder<null>();
    recorder.push({ state: null, description: 'a' });
    recorder.push({ state: null, description: 'b' });
    const { steps } = recorder.finish({
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
    });
    expect(steps[0].stats).not.toBe(steps[1].stats);
  });

  it('set overrides a counter absolutely', () => {
    const recorder = new StepRecorder<null>();
    recorder.count('depth', 5);
    recorder.set('depth', 2);
    recorder.push({ state: null, description: 'x' });
    expect(recorder.finish({ timeComplexity: '', spaceComplexity: '' }).steps[0].stats.depth).toBe(2);
  });

  it('accepts per-step stat overrides', () => {
    const recorder = new StepRecorder<null>();
    recorder.push({ state: null, description: 'x', stats: { comparisons: 7 } });
    expect(
      recorder.finish({ timeComplexity: '', spaceComplexity: '' }).steps[0].stats
        .comparisons,
    ).toBe(7);
  });

  it('reports metadata and length', () => {
    const recorder = new StepRecorder<null>();
    recorder.push({ state: null, description: 'x' });
    expect(recorder.length).toBe(1);
    const result = recorder.finish({
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      summary: 'done',
    });
    expect(result).toMatchObject({
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      summary: 'done',
    });
  });
});
